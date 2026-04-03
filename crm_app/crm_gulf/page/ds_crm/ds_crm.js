// frappe.pages['ds-crm'].on_page_load = function(wrapper) {
// 	var page = frappe.ui.make_app_page({
// 		parent: wrapper,
// 		title: 'DS CRM',
// 		single_column: true
// 	});
// }



frappe.pages['ds-crm'].on_page_load = function (wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'DS CRM',
		single_column: true,
	});

	// Inject CSS
	frappe.require('/assets/crm_app/css/ds_crm.css');

	// Render HTML template into page body
	$(wrapper).find('.page-content').html(
		frappe.render_template('ds_crm', {})
	);

	// Boot the dashboard
	ds_crm.init(wrapper);
};

/* ── NAMESPACE ──────────────────────────────── */
var ds_crm = (function () {

	/* ── HELPERS ─────────────────────────────── */
	function fN(n) {
		if (!n) return '0';
		if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
		if (n >= 1000)    return Math.round(n / 1000) + 'K';
		return String(n);
	}

	function today_str() {
		return frappe.datetime.get_today(); // YYYY-MM-DD
	}

	function get_week_label() {
		var d    = new Date();
		var start = new Date(d.getFullYear(), 0, 1);
		var wk   = Math.ceil(((d - start) / 86400000 + start.getDay() + 1) / 7);
		var months = ['January','February','March','April','May','June',
		              'July','August','September','October','November','December'];
		return 'Week ' + wk + ' · ' + months[d.getMonth()] + ' ' + d.getFullYear();
	}

	function get_greeting() {
		var h = new Date().getHours();
		if (h < 12) return 'Good morning';
		if (h < 17) return 'Good afternoon';
		return 'Good evening';
	}

	function show_toast(msg, type) {
		var $t = $('#ds-toast-msg');
		if (!$t.length) {
			$('body').append('<div class="ds-toast" id="ds-toast-msg"></div>');
			$t = $('#ds-toast-msg');
		}
		$t.removeClass('success error').addClass(type || 'success')
		  .text(msg).addClass('show');
		setTimeout(function () { $t.removeClass('show'); }, 3200);
	}

	/* ── DRAWER CONTROLS ─────────────────────── */
	function open_drawer(id) {
		$('#ds-overlay').addClass('visible');
		$('#' + id).addClass('open');
		// focus first input
		setTimeout(function () {
			$('#' + id).find('input:not([readonly]), select').first().focus();
		}, 310);
	}

	function close_all_drawers() {
		$('.ds-drawer').removeClass('open');
		setTimeout(function () { $('#ds-overlay').removeClass('visible'); }, 300);
	}

	/* ── LOAD USER PROFILE ───────────────────── */
	function load_user_profile() {
		var user = frappe.session.user;

		// Initials fallback
		var name_parts = (frappe.session.user_fullname || user).split(' ');
		var initials = name_parts.map(function (p) { return p[0]; }).join('').toUpperCase().slice(0, 2);
		$('#greet-avatar-initials').text(initials);

		// Greet title
		var first = name_parts[0] || 'there';
		$('#greet-title').text(get_greeting() + ', ' + first + '.');

		// Week label
		$('#greet-week-label').text(get_week_label());

		// Fetch user doc for profile image
		frappe.db.get_value('User', user, ['user_image', 'full_name'], function (r) {
			if (r && r.user_image) {
				$('#greet-avatar-img')
					.attr('src', r.user_image)
					.show();
				$('#greet-avatar-initials').hide();
			}
			if (r && r.full_name) {
				var parts = r.full_name.split(' ');
				$('#greet-title').text(get_greeting() + ', ' + parts[0] + '.');
			}
		});
	}

	/* ── LOAD KPI STATS ──────────────────────── */
	function load_stats() {
		var user = frappe.session.user;
		var month_start = frappe.datetime.month_start();
		var month_end   = frappe.datetime.month_end();

		// ① Pipeline total (all open enquiries assigned to me)
		frappe.call({
			method: 'frappe.client.get_list',
			args: {
				doctype: 'CRM Enquiry',
				filters: [
					['assigned_to', '=', user],
					['stage', 'not in', ['Won', 'Lost']],
				],
				fields: ['name', 'value'],
				limit_page_length: 0,
			},
			callback: function (r) {
				var total = 0;
				if (r.message) {
					r.message.forEach(function (e) { total += (e.value || 0); });
				}
				$('#stat-pipeline-val').text('AED ' + fN(total));
				// animate bar: treat 1M as 100%
				var pct = Math.min(total / 1000000 * 100, 100);
				setTimeout(function () {
					$('#stat-pipeline-bar').css('width', pct + '%');
				}, 300);
			},
		});

		// ② Won this month
		frappe.call({
			method: 'frappe.client.get_list',
			args: {
				doctype: 'CRM Enquiry',
				filters: [
					['assigned_to', '=', user],
					['stage', '=', 'Won'],
					['modified', 'between', [month_start, month_end]],
				],
				fields: ['name', 'value'],
				limit_page_length: 0,
			},
			callback: function (r) {
				var total = 0;
				if (r.message) {
					r.message.forEach(function (e) { total += (e.value || 0); });
				}
				$('#stat-won-val').text('AED ' + fN(total));
				var pct = Math.min(total / 500000 * 100, 100);
				setTimeout(function () {
					$('#stat-won-bar').css('width', pct + '%');
				}, 400);
			},
		});

		// ③ Active Leads assigned to me
		frappe.call({
			method: 'frappe.client.get_count',
			args: {
				doctype: 'CRM Lead',
				filters: [
					['assigned_to', '=', user],
					['status', '=', 'Active'],
				],
			},
			callback: function (r) {
				var cnt = r.message || 0;
				$('#stat-leads-val').text(cnt);
				var pct = Math.min(cnt / 30 * 100, 100);
				setTimeout(function () {
					$('#stat-leads-bar').css('width', pct + '%');
				}, 500);
			},
		});

		// ④ Overdue activities: activity_date < today AND logged_by = me
		frappe.call({
			method: 'frappe.client.get_count',
			args: {
				doctype: 'CRM Activity',
				filters: [
					['logged_by', '=', user],
					['activity_date', '<', today_str()],
				],
			},
			callback: function (r) {
				var cnt = r.message || 0;
				$('#stat-overdue-val').text(cnt);
				var pct = Math.min(cnt / 10 * 100, 100);
				setTimeout(function () {
					$('#stat-overdue-bar').css('width', pct + '%');
				}, 600);

				// Build subtitle
				build_subtitle(cnt);
			},
		});
	}

	function build_subtitle(overdue_cnt) {
		// count deals needing attention (days_in_stage > 7, not Won/Lost, assigned to me)
		frappe.call({
			method: 'frappe.client.get_count',
			args: {
				doctype: 'CRM Enquiry',
				filters: [
					['assigned_to', '=', frappe.session.user],
					['stage', 'not in', ['Won', 'Lost']],
					['days_in_stage', '>', 7],
				],
			},
			callback: function (r) {
				var attention = r.message || 0;
				var parts = [];
				if (overdue_cnt > 0)  parts.push(overdue_cnt + ' overdue activit' + (overdue_cnt === 1 ? 'y' : 'ies'));
				if (attention > 0)    parts.push(attention + ' deal' + (attention === 1 ? '' : 's') + ' need attention');
				var txt = parts.length ? parts.join(' · ') : 'Your pipeline is looking healthy today.';
				$('#greet-subtitle').text(txt);
			},
		});
	}

	/* ── POPULATE USER DROPDOWNS ─────────────── */
	function populate_user_dropdowns() {
		frappe.call({
			method: 'frappe.client.get_list',
			args: {
				doctype: 'User',
				filters: [['enabled', '=', 1], ['user_type', '=', 'System User']],
				fields: ['name', 'full_name'],
				limit_page_length: 100,
			},
			callback: function (r) {
				if (!r.message) return;
				var opts = '<option value="">Select user...</option>';
				r.message.forEach(function (u) {
					opts += '<option value="' + u.name + '">' + (u.full_name || u.name) + '</option>';
				});
				$('#lead-assigned-to, #enq-assigned-to').html(opts);
				// default to current user
				$('#lead-assigned-to, #enq-assigned-to').val(frappe.session.user);
			},
		});
	}

	/* ── POPULATE LEAD DROPDOWN (for enquiry + activity drawers) ── */
	function populate_lead_dropdown() {
		frappe.call({
			method: 'frappe.client.get_list',
			args: {
				doctype: 'CRM Lead',
				filters: [['status', '=', 'Active']],
				fields: ['name', 'full_name', 'company'],
				limit_page_length: 200,
				order_by: 'creation desc',
			},
			callback: function (r) {
				if (!r.message) return;
				var opts = '<option value="">No lead (optional)</option>';
				var act_opts = '<option value="">Select lead (optional)</option>';
				r.message.forEach(function (l) {
					var label = l.full_name + (l.company ? ' — ' + l.company : '');
					opts     += '<option value="' + l.name + '">' + label + '</option>';
					act_opts += '<option value="' + l.name + '">' + label + '</option>';
				});
				$('#enq-lead').html(opts);
				$('#act-lead').html(act_opts);
			},
		});
	}

	/* ── POPULATE ENQUIRY DROPDOWN (for activity drawer) ─── */
	function populate_enquiry_dropdown() {
		frappe.call({
			method: 'frappe.client.get_list',
			args: {
				doctype: 'CRM Enquiry',
				filters: [['stage', 'not in', ['Won', 'Lost']]],
				fields: ['name', 'title'],
				limit_page_length: 200,
				order_by: 'creation desc',
			},
			callback: function (r) {
				if (!r.message) return;
				var opts = '<option value="">Select enquiry (optional)</option>';
				r.message.forEach(function (e) {
					opts += '<option value="' + e.name + '">' + e.title + '</option>';
				});
				$('#act-enquiry').html(opts);
			},
		});
	}

	/* ── SAVE LEAD ───────────────────────────── */
	function save_lead() {
		var full_name = $('#lead-full-name').val().trim();
		var source    = $('#lead-source').val();

		if (!full_name) { show_toast('Full name is required', 'error'); return; }
		if (!source)    { show_toast('Please select a source', 'error'); return; }

		var $btn = $('#save-lead-btn').prop('disabled', true).text('Saving…');

		frappe.call({
			method: 'frappe.client.insert',
			args: {
				doc: {
					doctype:     'CRM Lead',
					full_name:   full_name,
					company:     $('#lead-company').val().trim()  || '',
					phone:       $('#lead-phone').val().trim()    || '',
					email:       $('#lead-email').val().trim()    || '',
					source:      source,
					status:      'Active',
					assigned_to: $('#lead-assigned-to').val()    || frappe.session.user,
					added_on:    today_str(),
					notes:       $('#lead-notes').val().trim()   || '',
				},
			},
			callback: function (r) {
				$btn.prop('disabled', false).html(
					'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save Lead'
				);
				if (r.message) {
					show_toast('Lead "' + full_name + '" created successfully!', 'success');
					close_all_drawers();
					reset_lead_form();
					load_stats();
					populate_lead_dropdown();
				}
			},
			error: function () {
				$btn.prop('disabled', false).text('Save Lead');
				show_toast('Failed to save lead. Please try again.', 'error');
			},
		});
	}

	function reset_lead_form() {
		$('#lead-full-name, #lead-company, #lead-phone, #lead-email, #lead-notes').val('');
		$('#lead-source').val('');
		$('#lead-assigned-to').val(frappe.session.user);
	}

	/* ── SAVE ENQUIRY ────────────────────────── */
	function save_enquiry() {
		var title = $('#enq-title').val().trim();
		var value = parseFloat($('#enq-value').val()) || 0;

		if (!title) { show_toast('Enquiry title is required', 'error'); return; }
		if (!value) { show_toast('Value (AED) is required', 'error'); return; }

		var $btn = $('#save-enquiry-btn').prop('disabled', true).text('Saving…');

		frappe.call({
			method: 'frappe.client.insert',
			args: {
				doc: {
					doctype:            'CRM Enquiry',
					title:              title,
					lead:               $('#enq-lead').val()              || '',
					stage:              $('#enq-stage').val()             || 'New Lead',
					value:              value,
					service_type:       $('#enq-service-type').val()      || '',
					assigned_to:        $('#enq-assigned-to').val()       || frappe.session.user,
					notes:              $('#enq-notes').val().trim()      || '',
					last_activity_date: today_str(),
					days_in_stage:      0,
					stage_changed_on:   today_str(),
				},
			},
			callback: function (r) {
				$btn.prop('disabled', false).html(
					'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save Enquiry'
				);
				if (r.message) {
					show_toast('Enquiry "' + title + '" created!', 'success');
					close_all_drawers();
					reset_enquiry_form();
					load_stats();
					populate_enquiry_dropdown();
				}
			},
			error: function () {
				$btn.prop('disabled', false).text('Save Enquiry');
				show_toast('Failed to save enquiry. Please try again.', 'error');
			},
		});
	}

	function reset_enquiry_form() {
		$('#enq-title, #enq-value, #enq-notes').val('');
		$('#enq-lead, #enq-service-type').val('');
		$('#enq-stage').val('New Lead');
		$('#enq-assigned-to').val(frappe.session.user);
	}

	/* ── SAVE ACTIVITY ───────────────────────── */
	function save_activity() {
		var act_type  = $('#act-type-val').val();
		var act_date  = $('#act-date').val();
		var notes     = $('#act-notes').val().trim();

		if (!act_type) { show_toast('Activity type is required', 'error'); return; }
		if (!act_date) { show_toast('Date is required', 'error'); return; }
		if (!notes)    { show_toast('Outcome / Notes are required', 'error'); return; }

		var $btn = $('#save-activity-btn').prop('disabled', true).text('Saving…');

		frappe.call({
			method: 'frappe.client.insert',
			args: {
				doc: {
					doctype:          'CRM Activity',
					activity_type:    act_type,
					enquiry:          $('#act-enquiry').val()  || '',
					lead:             $('#act-lead').val()     || '',
					logged_by:        frappe.session.user,
					activity_date:    act_date,
					activity_time:    $('#act-time').val()     || '',
					duration_minutes: $('#act-duration').val() || '30',
					follow_up_action: $('#act-followup').val() || '',
					outcome_notes:    notes,
				},
			},
			callback: function (r) {
				$btn.prop('disabled', false).html(
					'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Log Activity'
				);
				if (r.message) {
					show_toast('Activity logged successfully!', 'success');
					close_all_drawers();
					reset_activity_form();
					load_stats(); // refresh overdue count
				}
			},
			error: function () {
				$btn.prop('disabled', false).text('Log Activity');
				show_toast('Failed to log activity. Please try again.', 'error');
			},
		});
	}

	function reset_activity_form() {
		$('#act-enquiry, #act-lead, #act-notes, #act-followup').val('');
		$('#act-date').val(today_str());
		$('#act-time').val('');
		$('#act-duration').val('30');
		$('#act-type-val').val('Call');
		$('#act-type-call').addClass('active');
		$('#act-type-meeting').removeClass('active');
	}

	/* ── WIRE UP ALL EVENTS ──────────────────── */
	function bind_events() {

		// Overlay click → close drawers
		$('#ds-overlay').on('click', close_all_drawers);

		// Escape key
		$(document).on('keydown.ds_crm', function (e) {
			if (e.key === 'Escape') close_all_drawers();
		});

		// Open drawers
		$('#btn-new-lead').on('click', function () {
			populate_user_dropdowns();
			open_drawer('drawer-lead');
		});

		$('#btn-new-enquiry').on('click', function () {
			populate_user_dropdowns();
			populate_lead_dropdown();
			open_drawer('drawer-enquiry');
		});

		$('#btn-log-activity').on('click', function () {
			populate_lead_dropdown();
			populate_enquiry_dropdown();
			$('#act-date').val(today_str());
			open_drawer('drawer-activity');
		});

		// Close buttons
		$('#close-lead-drawer, #cancel-lead-btn').on('click', close_all_drawers);
		$('#close-enquiry-drawer, #cancel-enquiry-btn').on('click', close_all_drawers);
		$('#close-activity-drawer, #cancel-activity-btn').on('click', close_all_drawers);

		// Save buttons
		$('#save-lead-btn').on('click', save_lead);
		$('#save-enquiry-btn').on('click', save_enquiry);
		$('#save-activity-btn').on('click', save_activity);

		// Activity type toggle
		$('#act-type-call, #act-type-meeting').on('click', function () {
			$('#act-type-call, #act-type-meeting').removeClass('active');
			$(this).addClass('active');
			$('#act-type-val').val($(this).data('val'));
		});

		// Enter on inputs submits the active drawer
		$('#drawer-lead').on('keydown', 'input', function (e) {
			if (e.key === 'Enter') save_lead();
		});
		$('#drawer-enquiry').on('keydown', 'input', function (e) {
			if (e.key === 'Enter') save_enquiry();
		});
	}

	/* ── PUBLIC INIT ─────────────────────────── */
	function init(wrapper) {
		// Bind events after DOM is ready
		bind_events();

		// Load data
		load_user_profile();
		load_stats();
	}

	return { init: init };

})();