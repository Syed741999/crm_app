frappe.pages['ds-crm'].on_page_load = function (wrapper) {
	frappe.ui.make_app_page({
		parent: wrapper,
		title: 'DS CRM',
		single_column: true,
	});

	// Load React 18 first, then app
	frappe.require([
		'https://unpkg.com/react@18/umd/react.development.js',
		'https://unpkg.com/react-dom@18/umd/react-dom.development.js',
	], function () {
		frappe.require('/assets/crm_app/css/ds_crm.css');

		var mount = document.createElement('div');
		mount.id  = 'ds-crm-root';
		$(wrapper).find('.page-content').html('').append(mount);

		// ── ICONS ──────────────────────────────────────────────────────────
		function plusIcon() {
			return React.createElement('svg', { width:'13', height:'13', viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:'2.5', strokeLinecap:'round' },
				React.createElement('line', { x1:'12', y1:'5', x2:'12', y2:'19' }),
				React.createElement('line', { x1:'5',  y1:'12', x2:'19', y2:'12' }),
			);
		}
		function pencilIcon() {
			return React.createElement('svg', { width:'13', height:'13', viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:'2', strokeLinecap:'round' },
				React.createElement('path', { d:'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' }),
				React.createElement('path', { d:'M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' }),
			);
		}
		function clockIcon() {
			return React.createElement('svg', { width:'13', height:'13', viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:'2', strokeLinecap:'round' },
				React.createElement('circle', { cx:'12', cy:'12', r:'10' }),
				React.createElement('polyline', { points:'12 6 12 12 16 14' }),
			);
		}
		function closeIcon() {
			return React.createElement('svg', { width:'16', height:'16', viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:'2.5', strokeLinecap:'round' },
				React.createElement('path', { d:'M18 6 6 18M6 6l12 12' }),
			);
		}
		function saveIcon() {
			return React.createElement('svg', { width:'14', height:'14', viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:'2.5', strokeLinecap:'round' },
				React.createElement('path', { d:'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z' }),
				React.createElement('polyline', { points:'17 21 17 13 7 13 7 21' }),
				React.createElement('polyline', { points:'7 3 7 8 15 8' }),
			);
		}
		function callIcon() {
			return React.createElement('svg', { width:'13', height:'13', viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:'2', strokeLinecap:'round' },
				React.createElement('path', { d:'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.24h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.19 6.19l1.73-1.74a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z' }),
			);
		}
		function meetingIcon() {
			return React.createElement('svg', { width:'13', height:'13', viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:'2', strokeLinecap:'round' },
				React.createElement('path', { d:'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' }),
				React.createElement('circle', { cx:'9', cy:'7', r:'4' }),
				React.createElement('path', { d:'M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' }),
			);
		}

		// ── FIELD HELPER ───────────────────────────────────────────────────
		function field(label, required) {
			var extra = Array.prototype.slice.call(arguments, 2);
			var labelEl = React.createElement('label', { className: 'ds-label' },
				label,
				required ? React.createElement('span', { className: 'ds-req' }, ' *') : null,
			);
			return React.createElement.apply(React, ['div', { className: 'ds-field', key: label }, labelEl].concat(extra));
		}

		// ── TOAST ──────────────────────────────────────────────────────────
		function Toast(props) {
			return React.createElement('div', { className: 'ds-toast show ' + props.type }, props.msg);
		}

		// ── LINK FIELD ─────────────────────────────────────────────────────
		function LinkField(props) {
			var queryArr   = React.useState('');    var query = queryArr[0];   var setQuery = queryArr[1];
			var optionsArr = React.useState([]);    var options = optionsArr[0]; var setOptions = optionsArr[1];
			var openArr    = React.useState(false); var isOpen = openArr[0];   var setOpen = openArr[1];
			var displayArr = React.useState('');    var display = displayArr[0]; var setDisplay = displayArr[1];
			var ref = React.useRef();

			React.useEffect(function () {
				if (!props.value) { setDisplay(''); setQuery(''); setOpen(false); }
			}, [props.value]);

			React.useEffect(function () {
				if (!isOpen) return;
				var fields = ['name'].concat(props.labelField ? [props.labelField] : []);
				var f = (props.filters || []).slice();
				if (query) f.push([props.labelField || 'name', 'like', '%' + query + '%']);
				frappe.call({
					method: 'frappe.client.get_list',
					args: { doctype: props.doctype, filters: f, fields: fields, limit_page_length: 0, order_by: 'creation desc' },
					callback: function (r) { setOptions(r.message || []); },
				});
			}, [query, isOpen]);

			React.useEffect(function () {
				function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
				document.addEventListener('mousedown', handler);
				return function () { document.removeEventListener('mousedown', handler); };
			}, []);

			function select(opt) {
				props.onChange(opt.name);
				setDisplay(opt[props.labelField] || opt.name);
				setQuery(''); setOpen(false);
			}
			function clear() { props.onChange(''); setDisplay(''); setQuery(''); }

			return React.createElement('div', { className: 'ds-link-wrap', ref: ref },
				React.createElement('div', { className: 'ds-link-input-row' },
					React.createElement('input', {
						className: 'ds-input ds-link-input',
						value: isOpen ? query : display,
						placeholder: display ? '' : props.placeholder,
						onFocus: function () { setOpen(true); setQuery(''); },
						onChange: function (e) { setQuery(e.target.value); },
					}),
					display ? React.createElement('button', { className: 'ds-link-clear', type: 'button', onClick: clear }, '×') : null,
					React.createElement('span', { className: 'ds-link-arrow', onClick: function () { setOpen(function (o) { return !o; }); } }, '▾'),
				),
				(display && !isOpen) ? React.createElement('div', { className: 'ds-link-badge' }, display) : null,
				isOpen ? React.createElement('div', { className: 'ds-link-dropdown' },
					options.length === 0
						? React.createElement('div', { className: 'ds-link-empty' }, 'No results')
						: options.map(function (opt) {
							return React.createElement('div', { key: opt.name, className: 'ds-link-option', onMouseDown: function () { select(opt); } },
								React.createElement('span', { className: 'ds-link-opt-label' }, opt[props.labelField] || opt.name),
								(props.labelField && opt.name !== opt[props.labelField])
									? React.createElement('span', { className: 'ds-link-opt-sub' }, opt.name)
									: null,
							);
						}),
				) : null,
			);
		}

		// ── TICKER BAR ─────────────────────────────────────────────────────
		function TickerBar(props) {
			return React.createElement('div', { className: 'ds-ticker' },
				props.items.map(function (item, i) {
					return React.createElement('span', { key: i, className: 'ds-ticker-item ds-ticker-' + item.color },
						React.createElement('span', { className: 'ds-ticker-icon' }, item.icon),
						item.text,
					);
				}),
			);
		}

		// ── DRAWER WRAPPER ─────────────────────────────────────────────────
		function Drawer(props) {
			React.useEffect(function () {
				function handler(e) { if (e.key === 'Escape' && props.open) props.onClose(); }
				document.addEventListener('keydown', handler);
				return function () { document.removeEventListener('keydown', handler); };
			}, [props.open]);

			return React.createElement('div', { className: 'ds-drawer' + (props.open ? ' open' : ''), id: props.id },
				React.createElement('div', { className: 'ds-drawer-header' },
					React.createElement('div', { className: 'ds-drawer-title' },
						React.createElement('span', { className: 'ds-drawer-icon' }, props.icon),
						props.title,
					),
					React.createElement('button', { className: 'ds-drawer-close', onClick: props.onClose }, closeIcon()),
				),
				React.createElement.apply(React, ['div', { className: 'ds-drawer-body' }].concat(React.Children.toArray(props.children))),
				React.createElement('div', { className: 'ds-drawer-footer' },
					React.createElement('button', { className: 'g-btn g-btn-primary', style: { flex: 1 }, onClick: props.onSave, disabled: props.saving },
						saveIcon(), props.saving ? ' Saving…' : ' ' + props.saveLabel,
					),
					React.createElement('button', { className: 'g-btn g-btn-ghost', onClick: props.onClose }, 'Cancel'),
				),
			);
		}

		// ── OVERLAY ────────────────────────────────────────────────────────
		function DrawerOverlay(props) {
			return React.createElement('div', { className: 'ds-overlay' + (props.open ? ' visible' : ''), onClick: props.onClose });
		}

		// ── DRAWER: LEAD ───────────────────────────────────────────────────
		function DrawerLead(props) {
			var defaultForm = { full_name:'', company:'', phone:'', email:'', source:'', assigned_to: frappe.session.user, notes:'' };
			var formArr   = React.useState(defaultForm); var form = formArr[0]; var setForm = formArr[1];
			var savingArr = React.useState(false);       var saving = savingArr[0]; var setSaving = savingArr[1];
			var mountKeyArr = React.useState(0); var mountKey = mountKeyArr[0]; var setMountKey = mountKeyArr[1];

			React.useEffect(function () {
				if (props.open) {
					setForm(Object.assign({}, defaultForm, { assigned_to: frappe.session.user }));
					setMountKey(function(k){ return k + 1; });
				}
			}, [props.open]);

			function set(k, v) { setForm(function (f) { return Object.assign({}, f, { [k]: v }); }); }
			function save() {
				if (!form.full_name.trim()) { props.showToast('Full name is required', 'error'); return; }
				if (!form.source)           { props.showToast('Please select a source', 'error'); return; }
				setSaving(true);
				frappe.call({ method: 'frappe.client.insert', args: { doc: {
					doctype: 'CRM Lead', full_name: form.full_name.trim(), company: form.company.trim(),
					phone: form.phone.trim(), email: form.email.trim(), source: form.source, status: 'Active',
					assigned_to: form.assigned_to || frappe.session.user,
					added_on: frappe.datetime.get_today(), notes: form.notes.trim(),
				}},
					callback: function (r) {
						setSaving(false);
						if (r.message) { props.showToast('Lead "' + form.full_name + '" created!', 'success'); props.onClose(); props.refresh(); }
					},
					error: function () { setSaving(false); props.showToast('Failed to save lead.', 'error'); },
				});
			}
			return React.createElement(Drawer, { id:'drawer-lead', open:props.open, icon:'👤', title:'New Lead', onClose:props.onClose, onSave:save, saveLabel:'Save Lead', saving:saving },
				field('Full Name', true, React.createElement('input', { className:'ds-input', value:form.full_name, placeholder:'e.g. Khalid Al Rashidi', onChange:function(e){set('full_name',e.target.value);}, onKeyDown:function(e){if(e.key==='Enter')save();} })),
				field('Company',   false, React.createElement('input', { className:'ds-input', value:form.company,   placeholder:'e.g. Deyaar Developments',  onChange:function(e){set('company',e.target.value);} })),
				React.createElement('div', { className:'ds-row2' },
					field('Phone', false, React.createElement('input', { className:'ds-input', value:form.phone, placeholder:'+971 50 000 0000', onChange:function(e){set('phone',e.target.value);} })),
					field('Email', false, React.createElement('input', { className:'ds-input', type:'email', value:form.email, placeholder:'email@company.ae', onChange:function(e){set('email',e.target.value);} })),
				),
				field('Source', true, React.createElement('select', { className:'ds-select', value:form.source, onChange:function(e){set('source',e.target.value);} },
					React.createElement('option', {value:''}, 'Pick one…'),
					['Referral','Instagram','LinkedIn','Website','Walk-in','WhatsApp','Event','Other'].map(function(s){return React.createElement('option',{key:s},s);}),
				)),
				field('Assigned To', false, React.createElement(LinkField, { key:'lead-assigned-'+mountKey, doctype:'User', labelField:'full_name', placeholder:'Search user…', filters:[['enabled','=',1],['user_type','=','System User']], value:form.assigned_to, onChange:function(v){set('assigned_to',v);} })),
				field('Notes', false, React.createElement('textarea', { className:'ds-textarea', value:form.notes, placeholder:'Any context worth capturing?', onChange:function(e){set('notes',e.target.value);} })),
			);
		}

		// ── DRAWER: ENQUIRY ────────────────────────────────────────────────
		function DrawerEnquiry(props) {
			var defaultForm = { title:'', lead:'', stage:'New Lead', value:'', service_type:'', assigned_to: frappe.session.user, notes:'' };
			var formArr   = React.useState(defaultForm); var form = formArr[0]; var setForm = formArr[1];
			var savingArr = React.useState(false);       var saving = savingArr[0]; var setSaving = savingArr[1];
			var valFocArr = React.useState(false);       var valFocused = valFocArr[0]; var setValFocused = valFocArr[1];
			var mountKeyArr = React.useState(0); var mountKey = mountKeyArr[0]; var setMountKey = mountKeyArr[1];

			React.useEffect(function () {
				if (props.open) {
					setForm(Object.assign({}, defaultForm, { assigned_to: frappe.session.user }));
					setValFocused(false);
					setMountKey(function(k){ return k + 1; });
				}
			}, [props.open]);

			function set(k, v) { setForm(function (f) { return Object.assign({}, f, { [k]: v }); }); }

			function formatAED(val) {
				var n = parseFloat(String(val).replace(/[^0-9.]/g, ''));
				if (isNaN(n)) return '';
				return 'AED ' + n.toLocaleString('en-AE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
			}

			function save() {
				if (!form.title.trim()) { props.showToast('Enquiry title is required', 'error'); return; }
				if (!form.value)        { props.showToast('Value (AED) is required', 'error'); return; }
				setSaving(true);
				frappe.call({ method: 'frappe.client.insert', args: { doc: {
					doctype: 'CRM Enquiry', title: form.title.trim(), lead: form.lead,
					stage: form.stage, value: parseFloat(String(form.value).replace(/[^0-9.]/g, '')) || 0,
					service_type: form.service_type,
					assigned_to: form.assigned_to || frappe.session.user, notes: form.notes.trim(),
					last_activity_date: frappe.datetime.get_today(), days_in_stage: 0, stage_changed_on: frappe.datetime.get_today(),
				}},
					callback: function (r) {
						setSaving(false);
						if (r.message) { props.showToast('Enquiry "' + form.title + '" created!', 'success'); props.onClose(); props.refresh(); }
					},
					error: function () { setSaving(false); props.showToast('Failed to save enquiry.', 'error'); },
				});
			}

			return React.createElement(Drawer, { id:'drawer-enquiry', open:props.open, icon:'📋', title:'New Enquiry', onClose:props.onClose, onSave:save, saveLabel:'Save Enquiry', saving:saving },
				field('Enquiry Title', true,
					React.createElement('input', { className:'ds-input', value:form.title, placeholder:'Client Name – Fitout Type', onChange:function(e){set('title',e.target.value);}, onKeyDown:function(e){if(e.key==='Enter')save();} }),
					React.createElement('div', { className:'ds-hint' }, 'e.g. Emaar Development – Office Fitout'),
				),
				field('Linked Lead', false, React.createElement(LinkField, { key:'enq-lead-'+mountKey, doctype:'CRM Lead', labelField:'full_name', placeholder:'Search lead…', filters:[['status','=','Active']], value:form.lead, onChange:function(v){set('lead',v);} })),
				React.createElement('div', { className:'ds-row2' },
					field('Value (AED)', true,
						React.createElement('input', {
							className: 'ds-input',
							inputMode: 'numeric',
							style: { MozAppearance:'textfield', appearance:'textfield' },
							value: valFocused ? String(form.value).replace(/[^0-9.]/g,'') : (form.value ? formatAED(form.value) : ''),
							placeholder: 'e.g. 75,000',
							onFocus: function () { setValFocused(true); },
							onBlur:  function () {
								setValFocused(false);
								var raw = String(form.value).replace(/[^0-9.]/g,'');
								set('value', raw);
							},
							onChange: function (e) {
								var raw = e.target.value.replace(/[^0-9.]/g,'');
								set('value', raw);
							},
						}),
					),
					field('Stage', false, React.createElement('select', { className:'ds-select', value:form.stage, onChange:function(e){set('stage',e.target.value);} },
						['New Lead','Qualified','Proposal','Negotiation'].map(function(s){return React.createElement('option',{key:s},s);}),
					)),
				),
				field('Service Type', false, React.createElement('select', { className:'ds-select', value:form.service_type, onChange:function(e){set('service_type',e.target.value);} },
					React.createElement('option', {value:''}, 'Select service…'),
					['Office Fitout','Retail Fitout','Hospitality Fitout','Villa & Residential Fitout','Commercial Fitout','Turnkey Fitout','Joinery & Millwork','Other'].map(function(s){return React.createElement('option',{key:s},s);}),
				)),
				field('Assigned To', false, React.createElement(LinkField, { key:'enq-assigned-'+mountKey, doctype:'User', labelField:'full_name', placeholder:'Search user…', filters:[['enabled','=',1],['user_type','=','System User']], value:form.assigned_to, onChange:function(v){set('assigned_to',v);} })),
				field('Notes', false, React.createElement('textarea', { className:'ds-textarea', value:form.notes, placeholder:'What do we know so far?', onChange:function(e){set('notes',e.target.value);} })),
			);
		}

		// ── ON DECK SECTION ────────────────────────────────────────────────
		function OnDeckSection(props) {
			var activitiesArr = React.useState([]); var activities = activitiesArr[0]; var setActivities = activitiesArr[1];
			var loadingArr    = React.useState(true); var loading = loadingArr[0]; var setLoading = loadingArr[1];
			var labelsArr     = React.useState({}); var labels = labelsArr[0]; var setLabels = labelsArr[1];

			var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

			React.useEffect(function () {
				setLoading(true);
				var today = frappe.datetime.get_today();
				var in14  = frappe.datetime.add_days(today, 14);
				frappe.call({
					method: 'frappe.client.get_list',
					args: {
						doctype: 'CRM Activity',
						filters: [
							['logged_by', '=', frappe.session.user],
							['activity_date', '>=', today],
							['activity_date', '<=', in14],
						],
						fields: ['name', 'activity_date', 'activity_type', 'follow_up_action', 'enquiry', 'lead', 'outcome_notes'],
						order_by: 'activity_date asc',
						limit_page_length: 0,
					},
					callback: function (r) {
						var acts = r.message || [];
						setActivities(acts);
						setLoading(false);

						var enquiryIds = []; var leadIds = [];
						acts.forEach(function(a) {
							if (a.enquiry && enquiryIds.indexOf(a.enquiry) === -1) enquiryIds.push(a.enquiry);
							if (a.lead    && leadIds.indexOf(a.lead)       === -1) leadIds.push(a.lead);
						});

						var resolved = {};
						var pending = (enquiryIds.length > 0 ? 1 : 0) + (leadIds.length > 0 ? 1 : 0);
						if (pending === 0) { setLabels({}); return; }
						function done() { pending--; if (pending <= 0) setLabels(Object.assign({}, resolved)); }

						if (enquiryIds.length > 0) {
							frappe.call({
								method: 'frappe.client.get_list',
								args: { doctype:'CRM Enquiry', filters:[['name','in',enquiryIds]], fields:['name','title'], limit_page_length:0 },
								callback: function(r2) { (r2.message||[]).forEach(function(e){ resolved[e.name] = e.title; }); done(); },
							});
						}
						if (leadIds.length > 0) {
							frappe.call({
								method: 'frappe.client.get_list',
								args: { doctype:'CRM Lead', filters:[['name','in',leadIds]], fields:['name','full_name','company'], limit_page_length:0 },
								callback: function(r2) {
									(r2.message||[]).forEach(function(e){ resolved[e.name] = e.full_name + (e.company ? ' · ' + e.company : ''); });
									done();
								},
							});
						}
					},
				});
			}, [props.refreshAt]);

			function renderRow(act) {
				var d   = new Date(act.activity_date);
				var mon = months[d.getMonth()];
				var day = d.getDate();
				var title   = act.follow_up_action || act.activity_type || 'Activity';
				var sub     = (act.enquiry ? labels[act.enquiry] : null) || (act.lead ? labels[act.lead] : null) || '';
				var typeKey = (act.activity_type || '').toLowerCase();

				return React.createElement('div', { className: 'ds-act-row', key: act.name },
					React.createElement('div', { className: 'ds-act-date' },
						React.createElement('span', { className: 'ds-act-date-mon' }, mon),
						React.createElement('span', { className: 'ds-act-date-day' }, day),
					),
					React.createElement('div', { className: 'ds-act-dot' }),
					React.createElement('div', { className: 'ds-act-body' },
						React.createElement('div', { className: 'ds-act-title' }, title),
						sub ? React.createElement('div', { className: 'ds-act-sub' }, sub) : null,
					),
					React.createElement('span', {
						className: 'ds-act-type-pill ds-act-type-' + (typeKey === 'meeting' ? 'meeting' : 'call'),
					}, act.activity_type || 'Call'),
				);
			}

			return React.createElement('div', { className: 'ds-sec-card' },
				React.createElement('div', { className: 'ds-sec-hdr' },
					React.createElement('span', { className: 'ds-sec-ttl' }, 'On Deck'),
					React.createElement('div', { className: 'ds-sec-rule' }),
					React.createElement('span', { className: 'ds-sec-badge ds-sec-badge-blue' }, activities.length),
					React.createElement('button', {
						className: 'g-btn g-btn-ghost',
						style: { padding: '4px 10px', fontSize: '11.5px', marginLeft: '4px' },
						onClick: props.onLogActivity,
					}, '+ Log'),
				),
				loading
					? React.createElement('div', { className: 'ds-empty' }, 'Loading…')
					: activities.length === 0
						? React.createElement('div', { className: 'ds-empty' }, 'No upcoming activities in the next 14 days.')
						: activities.map(renderRow),
			);
		}

		// ── DRAWER: ACTIVITY ───────────────────────────────────────────────
		function DrawerActivity(props) {
			var defaultForm = { act_type:'Call', link_type:'Enquiry', enquiry:'', lead:'', date: frappe.datetime.get_today(), time:'', duration:'30', followup:'', notes:'' };
			var formArr   = React.useState(defaultForm); var form = formArr[0]; var setForm = formArr[1];
			var savingArr = React.useState(false);       var saving = savingArr[0]; var setSaving = savingArr[1];
			var mountKeyArr = React.useState(0); var mountKey = mountKeyArr[0]; var setMountKey = mountKeyArr[1];

			React.useEffect(function () {
				if (props.open) {
					setForm(Object.assign({}, defaultForm, { date: frappe.datetime.get_today() }));
					setMountKey(function(k){ return k + 1; });
				}
			}, [props.open]);

			function set(k, v) { setForm(function (f) { return Object.assign({}, f, { [k]: v }); }); }

			function save() {
				if (!form.act_type)     { props.showToast('Activity type is required', 'error'); return; }
				if (!form.date)         { props.showToast('Date is required', 'error'); return; }
				if (!form.notes.trim()) { props.showToast('Outcome / Notes are required', 'error'); return; }
				setSaving(true);
				frappe.call({ method: 'frappe.client.insert', args: { doc: {
					doctype: 'CRM Activity',
					activity_type: form.act_type,
					enquiry:       form.link_type === 'Enquiry' ? form.enquiry : '',
					lead:          form.link_type === 'Lead'    ? form.lead    : '',
					logged_by:     frappe.session.user,
					activity_date: form.date,
					activity_time: form.time,
					duration_minutes: form.duration,
					follow_up_action: form.followup,
					outcome_notes: form.notes.trim(),
				}},
					callback: function (r) {
						setSaving(false);
						if (r.message) { props.showToast('Activity logged!', 'success'); props.onClose(); props.refresh(); }
					},
					error: function () { setSaving(false); props.showToast('Failed to log activity.', 'error'); },
				});
			}

			return React.createElement(Drawer, { id:'drawer-activity', open:props.open, icon:'⏱', title:'Log Activity', onClose:props.onClose, onSave:save, saveLabel:'Log Activity', saving:saving },
				field('Activity Type', true,
					React.createElement('div', { className:'ds-toggle-row' },
						React.createElement('button', { className:'ds-toggle-btn'+(form.act_type==='Call'?' active':''), type:'button', onClick:function(){set('act_type','Call');} }, callIcon(), ' Call'),
						React.createElement('button', { className:'ds-toggle-btn'+(form.act_type==='Meeting'?' active':''), type:'button', onClick:function(){set('act_type','Meeting');} }, meetingIcon(), ' Meeting'),
					),
				),
				field('Link to', false,
					React.createElement('div', { className:'ds-toggle-row', style:{marginBottom:'8px'} },
						React.createElement('button', {
							className: 'ds-toggle-btn'+(form.link_type==='Enquiry'?' active':''),
							type:'button',
							onClick: function(){ set('link_type','Enquiry'); set('lead',''); }
						}, '📋 Enquiry'),
						React.createElement('button', {
							className: 'ds-toggle-btn'+(form.link_type==='Lead'?' active':''),
							type:'button',
							onClick: function(){ set('link_type','Lead'); set('enquiry',''); }
						}, '👤 Lead'),
					),
				),
				form.link_type === 'Enquiry'
					? field('Enquiry', false, React.createElement(LinkField, { key:'act-enq-'+mountKey, doctype:'CRM Enquiry', labelField:'title', placeholder:'Search enquiry…', filters:[['stage','not in',['Won','Lost']]], value:form.enquiry, onChange:function(v){set('enquiry',v);} }))
					: field('Lead',    false, React.createElement(LinkField, { key:'act-lead-'+mountKey, doctype:'CRM Lead', labelField:'full_name', placeholder:'Search lead…', filters:[['status','=','Active']], value:form.lead, onChange:function(v){set('lead',v);} })),
				React.createElement('div', { className:'ds-row2' },
					field('Date', true, React.createElement('input', { className:'ds-input', type:'date', value:form.date, onChange:function(e){set('date',e.target.value);} })),
					field('Time', false, React.createElement('input', { className:'ds-input', type:'time', value:form.time, onChange:function(e){set('time',e.target.value);} })),
				),
				field('Duration', false, React.createElement('select', { className:'ds-select', value:form.duration, onChange:function(e){set('duration',e.target.value);} },
					[['15','15 min'],['30','30 min'],['45','45 min'],['60','1 hr'],['90','1.5 hrs'],['120','2 hrs']].map(function(p){return React.createElement('option',{key:p[0],value:p[0]},p[1]);})
				)),
				field('Follow-up Action', false,
					React.createElement('input', { className:'ds-input', value:form.followup, placeholder:'e.g. Send proposal, Schedule next call…', onChange:function(e){set('followup',e.target.value);} }),
				),
				field('Outcome / Notes', true, React.createElement('textarea', { className:'ds-textarea', value:form.notes, placeholder:'What happened? What was agreed? Next steps?', style:{minHeight:'100px'}, onChange:function(e){set('notes',e.target.value);} })),
			);
		}

		// ── DRAWER: EDIT FOLLOWUP ──────────────────────────────────────────
		function DrawerEditFollowup(props) {
			var formArr   = React.useState({ subject:'', date:'', notes:'' });
			var form = formArr[0]; var setForm = formArr[1];
			var savingArr = React.useState(false);
			var saving = savingArr[0]; var setSaving = savingArr[1];

			function stripHtml(html) {
				if (!html) return '';
				return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
			}

			React.useEffect(function () {
				if (props.open && props.activity) {
					setForm({
						subject: stripHtml(props.activity.follow_up_action || ''),
						date:    props.activity.activity_date || frappe.datetime.get_today(),
						notes:   stripHtml(props.activity.outcome_notes    || ''),
					});
				} else if (!props.open) {
					setForm({ subject:'', date:'', notes:'' });
				}
			}, [props.open, props.activity]);

			function set(k, v) { setForm(function (f) { return Object.assign({}, f, { [k]: v }); }); }

			function save() {
				if (!form.subject.trim()) { props.showToast('Subject is required', 'error'); return; }
				if (!form.date)           { props.showToast('Date is required', 'error'); return; }
				setSaving(true);
				frappe.call({
					method: 'frappe.client.set_value',
					args: {
						doctype: 'CRM Activity',
						name: props.activity.name,
						fieldname: {
							follow_up_action: form.subject.trim(),
							activity_date:    form.date,
							outcome_notes:    form.notes.trim(),
						},
					},
					callback: function (r) {
						setSaving(false);
						if (r.message) { props.showToast('Follow-up updated!', 'success'); props.onClose(); props.refresh(); }
					},
					error: function () { setSaving(false); props.showToast('Failed to update.', 'error'); },
				});
			}

			var act = props.activity || {};
			var linkedLabel = act._resolvedLabel || act.enquiry || act.lead || '—';

			return React.createElement(Drawer, {
				id: 'drawer-editfollowup', open: props.open, icon: '✏️', title: 'Edit Follow-up',
				onClose: props.onClose, onSave: save, saveLabel: 'Save Changes', saving: saving,
			},
				field('Subject', true,
					React.createElement('input', { className: 'ds-input', value: form.subject, placeholder: 'e.g. Send proposal', onChange: function (e) { set('subject', e.target.value); } }),
				),
				field('Enquiry / Lead', false,
					React.createElement('input', { className: 'ds-input', value: linkedLabel, readOnly: true, style: { background: 'var(--bg2)', cursor: 'default', color: 'var(--muted)' } }),
				),
				field('New Date', true,
					React.createElement('input', { className: 'ds-input', type: 'date', value: form.date, onChange: function (e) { set('date', e.target.value); } }),
				),
				field('Notes', false,
					React.createElement('textarea', { className: 'ds-textarea', value: form.notes, placeholder: 'What happened? What was agreed?', style: { minHeight: '90px' }, onChange: function (e) { set('notes', e.target.value); } }),
				),
			);
		}

		// ── NEEDS CHASING SECTION ──────────────────────────────────────────
		function NeedsChasingSection(props) {
			var activitiesArr = React.useState([]); var activities = activitiesArr[0]; var setActivities = activitiesArr[1];
			var loadingArr    = React.useState(true); var loading = loadingArr[0]; var setLoading = loadingArr[1];
			var labelsArr     = React.useState({}); var labels = labelsArr[0]; var setLabels = labelsArr[1];

			function stripHtml(html) {
				if (!html) return '';
				return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
			}

			React.useEffect(function () {
				setLoading(true);
				var today = frappe.datetime.get_today();
				frappe.call({
					method: 'frappe.client.get_list',
					args: {
						doctype: 'CRM Activity',
						filters: [
							['logged_by', '=', frappe.session.user],
							['activity_date', '<', today],
							['follow_up_action', '!=', ''],
							['follow_up_action', 'is', 'set'],
						],
						fields: ['name', 'activity_date', 'follow_up_action', 'enquiry', 'lead', 'outcome_notes'],
						order_by: 'activity_date asc',
						limit_page_length: 0,
					},
					callback: function (r) {
						var acts = r.message || [];
						setActivities(acts);
						setLoading(false);

						var enquiryIds = []; var leadIds = [];
						acts.forEach(function(a) {
							if (a.enquiry && enquiryIds.indexOf(a.enquiry) === -1) enquiryIds.push(a.enquiry);
							if (a.lead    && leadIds.indexOf(a.lead)       === -1) leadIds.push(a.lead);
						});

						var resolved = {};
						var pending = (enquiryIds.length > 0 ? 1 : 0) + (leadIds.length > 0 ? 1 : 0);
						if (pending === 0) { setLabels({}); return; }
						function done() { pending--; if (pending <= 0) setLabels(Object.assign({}, resolved)); }

						if (enquiryIds.length > 0) {
							frappe.call({
								method: 'frappe.client.get_list',
								args: { doctype:'CRM Enquiry', filters:[['name','in',enquiryIds]], fields:['name','title'], limit_page_length:0 },
								callback: function(r2) { (r2.message||[]).forEach(function(e){ resolved[e.name] = e.title; }); done(); },
							});
						}
						if (leadIds.length > 0) {
							frappe.call({
								method: 'frappe.client.get_list',
								args: { doctype:'CRM Lead', filters:[['name','in',leadIds]], fields:['name','full_name','company'], limit_page_length:0 },
								callback: function(r2) {
									(r2.message||[]).forEach(function(e){ resolved[e.name] = e.full_name + (e.company ? ' · ' + e.company : ''); });
									done();
								},
							});
						}
					},
				});
			}, [props.refreshAt]);

			function daysDiff(dateStr) {
				var today = new Date(); today.setHours(0,0,0,0);
				var then  = new Date(dateStr); then.setHours(0,0,0,0);
				return Math.round((today - then) / 86400000);
			}

			function renderRow(act) {
				var days  = daysDiff(act.activity_date);
				var sub   = (act.enquiry ? labels[act.enquiry] : null) || (act.lead ? labels[act.lead] : null) || '';
				var title = stripHtml(act.follow_up_action);
				var actWithLabel = Object.assign({}, act, { _resolvedLabel: sub });
				return React.createElement('div', { className: 'ds-chase-row', key: act.name },
					React.createElement('div', { className: 'ds-chase-days' },
						React.createElement('span', { className: 'ds-chase-days-num' }, days),
						React.createElement('span', { className: 'ds-chase-days-lbl' }, 'days'),
					),
					React.createElement('div', { className: 'ds-chase-body' },
						React.createElement('div', { className: 'ds-chase-title' }, title),
						sub ? React.createElement('div', { className: 'ds-chase-sub' }, sub) : null,
					),
					React.createElement('button', {
						className: 'ds-chase-edit',
						title: 'Edit follow-up',
						onClick: function () { props.onEdit(actWithLabel); },
					}, pencilIcon()),
				);
			}

			return React.createElement('div', { className: 'ds-sec-card' },
				React.createElement('div', { className: 'ds-sec-hdr' },
					React.createElement('span', { className: 'ds-sec-ttl ds-sec-ttl-amb' }, 'Needs Chasing'),
					React.createElement('div', { className: 'ds-sec-rule' }),
					React.createElement('span', { className: 'ds-sec-badge ds-sec-badge-amb' }, activities.length),
				),
				loading
					? React.createElement('div', { className: 'ds-empty' }, 'Loading…')
					: activities.length === 0
						? React.createElement('div', { className: 'ds-empty' }, '✓ Nothing overdue.')
						: activities.map(renderRow),
			);
		}

		// ── BRIEF BOARD HELPERS ────────────────────────────────────────────
		var STAGES = ['New Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];

		function stageClass(stage) {
			return 'stage-' + (stage || '').toLowerCase().replace(/\s+/g, '-');
		}

		function fmtVal(n) {
			if (!n && n !== 0) return '—';
			var num = parseFloat(n);
			if (isNaN(num)) return '—';
			if (num >= 1000000000) return 'AED ' + (num / 1000000000).toFixed(1) + 'B';
			if (num >= 1000000)    return 'AED ' + (num / 1000000).toFixed(1) + 'M';
			if (num >= 1000)       return 'AED ' + Math.round(num / 1000) + 'K';
			return 'AED ' + num;
		}

		function daysDotColor(days) {
			if (days === null || days === undefined) return 'var(--faint)';
			if (days >= 7) return 'var(--red)';
			if (days >= 3) return 'var(--amb)';
			return 'var(--grn)';
		}

		function fmtDate(dateStr) {
			if (!dateStr) return '—';
			var d = new Date(dateStr);
			var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
			return months[d.getMonth()] + ' ' + d.getDate();
		}

		function stripHtmlBrief(html) {
			if (!html) return '';
			return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
		}

		// ── ENQUIRY DETAIL PANEL ───────────────────────────────────────────
		function EnquiryDetailPanel(props) {
			var tabArr     = React.useState('overview'); var tab = tabArr[0]; var setTab = tabArr[1];
			var activsArr  = React.useState([]);         var activs = activsArr[0]; var setActivs = activsArr[1];
			var actLoadArr = React.useState(false);      var actLoad = actLoadArr[0]; var setActLoad = actLoadArr[1];
			var movingArr  = React.useState(false);      var moving = movingArr[0]; var setMoving = movingArr[1];

			var enq = props.enquiry || {};

			React.useEffect(function () {
				if (!props.open) { setTab('overview'); return; }
			}, [props.open]);

			React.useEffect(function () {
				if (!props.open || !enq.name || tab !== 'activity') return;
				setActLoad(true);
				frappe.call({
					method: 'frappe.client.get_list',
					args: {
						doctype: 'CRM Activity',
						filters: [['enquiry', '=', enq.name]],
						fields: ['name', 'activity_type', 'activity_date', 'follow_up_action', 'outcome_notes', 'logged_by'],
						order_by: 'activity_date desc',
						limit_page_length: 6,
					},
					callback: function (r) { setActivs(r.message || []); setActLoad(false); },
				});
			}, [tab, props.open, enq.name]);

			function moveToNextStage() {
				var cur = STAGES.indexOf(enq.stage);
				var next = STAGES[cur + 1];
				if (!next || next === 'Lost') { props.showToast('Already at final stage', 'error'); return; }
				setMoving(true);
				frappe.call({
					method: 'frappe.client.set_value',
					args: {
						doctype: 'CRM Enquiry',
						name: enq.name,
						fieldname: { stage: next, stage_changed_on: frappe.datetime.get_today(), days_in_stage: 0 },
					},
					callback: function (r) {
						setMoving(false);
						if (r.message) { props.showToast('Moved to ' + next + '!', 'success'); props.onClose(); props.refresh(); }
					},
					error: function () { setMoving(false); props.showToast('Failed to update stage.', 'error'); },
				});
			}

			var progressStages = STAGES.filter(function(s){ return s !== 'Lost'; });

			function renderStageLine(s, i) {
				var stageColors = {
					'New Lead': 'var(--muted)', 'Qualified': 'var(--blue)',
					'Proposal': 'var(--lav)', 'Negotiation': 'var(--amb)', 'Won': 'var(--grn)',
				};
				var curIdx = progressStages.indexOf(enq.stage);
				var isFilled = i <= curIdx;
				var isCurrent = i === curIdx;
				return React.createElement('div', { className: 'ds-enq-seg', key: s },
					React.createElement('div', { className: 'ds-enq-seg-line', style: { background: isFilled ? (stageColors[s] || 'var(--lav)') : 'var(--hair)' } }),
					React.createElement('span', { className: 'ds-enq-seg-lbl', style: { color: isCurrent ? (stageColors[s] || 'var(--lav)') : (isFilled ? stageColors[s] || 'var(--muted)' : 'var(--faint)'), fontWeight: isCurrent ? '700' : '500' } }, s),
				);
			}

			function renderOverview() {
				var curIdx = STAGES.indexOf(enq.stage);
				var nextStage = STAGES[curIdx + 1];
				var canMove = nextStage && nextStage !== 'Lost' && enq.stage !== 'Won' && enq.stage !== 'Lost';
				return React.createElement('div', null,
					React.createElement('div', { className: 'ds-ov-grid' },
						React.createElement('div', null,
							React.createElement('div', { className: 'ds-ov-lbl' }, 'Stage'),
							React.createElement('div', { className: 'ds-ov-val' }, enq.stage || '—'),
						),
						React.createElement('div', null,
							React.createElement('div', { className: 'ds-ov-lbl' }, 'Value'),
							React.createElement('div', { className: 'ds-ov-val', style: { color: 'var(--blue)' } }, fmtVal(enq.value)),
						),
						React.createElement('div', null,
							React.createElement('div', { className: 'ds-ov-lbl' }, 'Days in Stage'),
							React.createElement('div', { className: 'ds-ov-val' }, (enq.days_in_stage !== undefined && enq.days_in_stage !== null) ? enq.days_in_stage + 'd' : '—'),
						),
						React.createElement('div', null,
							React.createElement('div', { className: 'ds-ov-lbl' }, 'Last Activity'),
							React.createElement('div', { className: 'ds-ov-val' }, fmtDate(enq.last_activity_date)),
						),
					),
					React.createElement('div', { className: 'ds-ov-notes-lbl' }, 'Notes'),
					React.createElement('div', { className: 'ds-ov-notes-box' },
						stripHtmlBrief(enq.notes) || React.createElement('span', { style: { color: 'var(--faint)' } }, 'No notes added.'),
					),
					canMove
						? React.createElement('div', { className: 'ds-ov-actions' },
							React.createElement('button', {
								className: 'g-btn g-btn-primary',
								style: { flex: 1 },
								disabled: moving,
								onClick: moveToNextStage,
							}, moving ? 'Moving…' : 'Move to next stage → ' + nextStage),
						  )
						: enq.stage === 'Won'
							? React.createElement('div', { style: { textAlign: 'center', padding: '10px 0', fontSize: '12px', color: 'var(--grn)', fontWeight: '600' } }, '✓ Deal Won')
							: null,
				);
			}

			function renderActivity() {
				if (actLoad) return React.createElement('div', { className: 'ds-act-log-empty' }, 'Loading…');
				if (!activs.length) return React.createElement('div', { className: 'ds-act-log-empty' }, 'No activities logged yet.');
				return React.createElement('div', null,
					activs.map(function (a) {
						return React.createElement('div', { className: 'ds-act-log-item', key: a.name },
							React.createElement('div', { className: 'ds-act-log-top' },
								React.createElement('span', { className: 'ds-act-log-type' }, a.activity_type || 'Activity'),
								React.createElement('span', { className: 'ds-act-log-date' }, fmtDate(a.activity_date)),
							),
							a.follow_up_action ? React.createElement('div', { className: 'ds-act-log-followup' }, '↪ ' + stripHtmlBrief(a.follow_up_action)) : null,
							a.outcome_notes ? React.createElement('div', { className: 'ds-act-log-notes' }, stripHtmlBrief(a.outcome_notes)) : null,
						);
					}),
				);
			}

			return React.createElement('div', { className: 'ds-enq-panel' + (props.open ? ' open' : '') },
				React.createElement('div', { className: 'ds-enq-panel-hdr' },
					React.createElement('div', { className: 'ds-enq-panel-top' },
						React.createElement('div', { style: { flex: 1, minWidth: 0 } },
							React.createElement('div', { className: 'ds-enq-panel-title' }, enq.title || '—'),
							React.createElement('div', { className: 'ds-enq-panel-meta' },
								React.createElement('span', { className: 'ds-enq-stage-badge ' + stageClass(enq.stage) }, enq.stage || '—'),
								React.createElement('span', { className: 'ds-enq-panel-val' }, fmtVal(enq.value)),
								React.createElement('span', { className: 'ds-enq-panel-who' }, 'Assigned: ' + (enq._assignedName || enq.assigned_to || '—')),
							),
						),
						React.createElement('button', { className: 'ds-drawer-close', onClick: props.onClose }, closeIcon()),
					),
					React.createElement('div', { className: 'ds-enq-sbar' }, progressStages.map(renderStageLine)),
				),
				React.createElement('div', { className: 'ds-enq-tabs' },
					React.createElement('div', { className: 'ds-enq-tab' + (tab === 'overview' ? ' active' : ''), onClick: function () { setTab('overview'); } }, 'Overview'),
					React.createElement('div', { className: 'ds-enq-tab' + (tab === 'activity' ? ' active' : ''), onClick: function () { setTab('activity'); } }, 'Activity'),
				),
				React.createElement('div', { className: 'ds-enq-body' },
					tab === 'overview' ? renderOverview() : renderActivity(),
				),
			);
		}

		// ── MY BRIEF BOARD ─────────────────────────────────────────────────
		function MyBriefBoard(props) {
			var enquiriesArr = React.useState([]); var enquiries = enquiriesArr[0]; var setEnquiries = enquiriesArr[1];
			var loadingArr   = React.useState(true); var loading = loadingArr[0]; var setLoading = loadingArr[1];
			var userNamesArr = React.useState({}); var userNames = userNamesArr[0]; var setUserNames = userNamesArr[1];
			var selEnqArr    = React.useState(null); var selEnq = selEnqArr[0]; var setSelEnq = selEnqArr[1];
			var panelOpenArr = React.useState(false); var panelOpen = panelOpenArr[0]; var setPanelOpen = panelOpenArr[1];

			React.useEffect(function () {
				setLoading(true);
				frappe.call({
					method: 'frappe.client.get_list',
					args: {
						doctype: 'CRM Enquiry',
						filters: [['assigned_to', '=', frappe.session.user]],
						fields: ['name', 'title', 'stage', 'value', 'days_in_stage', 'assigned_to', 'last_activity_date', 'stage_changed_on', 'notes'],
						order_by: 'days_in_stage desc',
						limit_page_length: 0,
					},
					callback: function (r) {
						var rows = r.message || [];
						setEnquiries(rows);
						setLoading(false);

						var uids = [];
						rows.forEach(function (e) {
							if (e.assigned_to && uids.indexOf(e.assigned_to) === -1) uids.push(e.assigned_to);
						});
						if (uids.length) {
							frappe.call({
								method: 'frappe.client.get_list',
								args: { doctype: 'User', filters: [['name', 'in', uids]], fields: ['name', 'full_name'], limit_page_length: 0 },
								callback: function (r2) {
									var map = {};
									(r2.message || []).forEach(function (u) { map[u.name] = u.full_name.split(' ')[0]; });
									setUserNames(map);
								},
							});
						}
					},
				});
			}, [props.refreshAt]);

			function getTopCardForStage(stage) {
				var matching = enquiries.filter(function (e) { return e.stage === stage; });
				if (!matching.length) return null;
				return matching[0]; // already sorted by days_in_stage desc
			}

			function openPanel(enq) {
				var enriched = Object.assign({}, enq, { _assignedName: userNames[enq.assigned_to] || enq.assigned_to });
				setSelEnq(enriched);
				setPanelOpen(true);
			}

			function closePanel() { setPanelOpen(false); }

			function renderCard(stage) {
				var count = enquiries.filter(function(e){ return e.stage === stage; }).length;
				var card = getTopCardForStage(stage);
				return React.createElement('div', { className: 'ds-kb-col', key: stage },
					React.createElement('div', { className: 'ds-kb-col-hdr ' + stageClass(stage) },
						React.createElement('span', { className: 'ds-kb-col-name' }, stage),
						React.createElement('span', { className: 'ds-kb-col-cnt' }, count),
					),
					card
						? React.createElement('div', { className: 'ds-kb-card', onClick: function () { openPanel(card); } },
							React.createElement('div', { className: 'ds-kb-card-title' }, card.title),
							React.createElement('div', { className: 'ds-kb-card-who' }, userNames[card.assigned_to] || card.assigned_to || '—'),
							React.createElement('div', { className: 'ds-kb-card-foot' },
								React.createElement('span', { className: 'ds-kb-card-val' }, fmtVal(card.value)),
								React.createElement('span', { className: 'ds-kb-card-days' },
									React.createElement('span', { className: 'ds-kb-days-dot', style: { background: daysDotColor(card.days_in_stage) } }),
									(card.days_in_stage !== null && card.days_in_stage !== undefined) ? card.days_in_stage + 'd' : '—',
								),
							),
						  )
						: React.createElement('div', { className: 'ds-kb-card-empty' }, 'Empty'),
				);
			}

			return React.createElement(React.Fragment, null,
				React.createElement('div', { className: 'ds-board-wrap' },
					React.createElement('div', { className: 'ds-sec-hdr', style: { marginBottom: '14px' } },
						React.createElement('span', { className: 'ds-sec-ttl' }, 'My Brief Board'),
						React.createElement('div', { className: 'ds-sec-rule' }),
						React.createElement('button', {
							className: 'g-btn g-btn-ghost',
							style: { padding: '4px 10px', fontSize: '11.5px' },
							onClick: function () { frappe.set_route('crm-enquiry'); },
						}, 'Full view'),
					),
					loading
						? React.createElement('div', { className: 'ds-empty' }, 'Loading…')
						: React.createElement('div', { className: 'ds-board-scroll' },
							React.createElement('div', { className: 'ds-kb-board' },
								STAGES.map(renderCard),
							),
						  ),
				),
				React.createElement(DrawerOverlay, { open: panelOpen, onClose: closePanel }),
				React.createElement(EnquiryDetailPanel, {
					open: panelOpen,
					enquiry: selEnq,
					onClose: closePanel,
					showToast: props.showToast,
					refresh: function () { props.refresh(); closePanel(); },
				}),
			);
		}



        // ── EVENT CATEGORY HELPERS ─────────────────────────────────────────────
function evtCatStyle(cat) {
    var map = {
        'Event':       { bg: 'rgba(107,78,186,0.12)',  color: 'var(--lav)' },
        'Meeting':     { bg: 'rgba(30,71,200,0.12)',   color: 'var(--blue)' },
        'Call':        { bg: 'rgba(26,114,69,0.12)',   color: 'var(--grn)' },
        'Conference':  { bg: 'rgba(30,71,200,0.12)',   color: 'var(--blue)' },
        'Networking':  { bg: 'rgba(107,78,186,0.12)',  color: 'var(--lav)' },
        'Meetup':      { bg: 'rgba(15,123,108,0.12)',  color: '#0F7B6C' },
        'Award Show':  { bg: 'rgba(196,81,42,0.12)',   color: '#C4512A' },
    };
    return map[cat] || { bg: 'rgba(113,117,132,0.12)', color: 'var(--muted)' };
}

function fmtEventDate(dateStr, timeStr) {
    if (!dateStr) return '—';
    var d = new Date(dateStr);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var base = months[d.getMonth()] + ' ' + d.getDate();
    if (timeStr) {
        var t = timeStr.substring(0, 5);
        return base + ' · ' + t;
    }
    return base;
}

// ── EVENT DETAIL PANEL ─────────────────────────────────────────────────
function EventDetailPanel(props) {
    var tabArr    = React.useState('overview'); var tab = tabArr[0]; var setTab = tabArr[1];
    var savingArr = React.useState(false);      var saving = savingArr[0]; var setSaving = savingArr[1];
    var formArr   = React.useState(null);       var form = formArr[0]; var setForm = formArr[1];
    var mountKeyArr = React.useState(0); var mountKey = mountKeyArr[0]; var setMountKey = mountKeyArr[1];

    var evt = props.event || {};

    function stripH(html) {
        if (!html) return '';
        return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').trim();
    }

    React.useEffect(function () {
        if (props.open && evt.name) {
            setTab('overview');
            setForm({
                event_category: evt.event_category || 'Event',
                title: evt.title || '',
                event_date: evt.event_date || '',
                event_time: evt.event_time ? evt.event_time.substring(0,5) : '',
                location: evt.location || '',
                notes: stripH(evt.notes || ''),
                assigned_to: evt.assigned_to || '',
                link_type: evt.enquiry ? 'Enquiry' : 'Lead',
                enquiry: evt.enquiry || '',
                lead: evt.lead || '',
            });
            setMountKey(function(k){ return k+1; });
        }
    }, [props.open, evt.name]);

    function setF(k, v) { setForm(function(f){ return Object.assign({}, f, {[k]:v}); }); }

    function saveEdit() {
        if (!form || !form.title.trim()) { props.showToast('Title is required', 'error'); return; }
        if (!form.event_date) { props.showToast('Date is required', 'error'); return; }
        setSaving(true);
        frappe.call({
            method: 'frappe.client.set_value',
            args: {
                doctype: 'CRM Event',
                name: evt.name,
                fieldname: {
                    event_category: form.event_category,
                    title: form.title.trim(),
                    event_date: form.event_date,
                    event_time: form.event_time || '',
                    location: form.location.trim(),
                    notes: form.notes.trim(),
                    assigned_to: form.assigned_to,
                    enquiry: form.link_type === 'Enquiry' ? form.enquiry : '',
                    lead:    form.link_type === 'Lead'    ? form.lead    : '',
                },
            },
            callback: function(r) {
                setSaving(false);
                if (r.message) { props.showToast('Event updated!', 'success'); props.onClose(); props.refresh(); }
            },
            error: function() { setSaving(false); props.showToast('Failed to update.', 'error'); },
        });
    }

    var catStyle = evtCatStyle(evt.event_category);

    function renderOverview() {
    return React.createElement('div', null,
        React.createElement('div', { className: 'ds-evt-ov-grid' },
            React.createElement('div', null,
                React.createElement('div', { className: 'ds-ov-lbl' }, 'Date'),
                React.createElement('div', { className: 'ds-ov-val' }, fmtDate(evt.event_date)),
            ),
            React.createElement('div', null,
                React.createElement('div', { className: 'ds-ov-lbl' }, 'Time'),
                React.createElement('div', { className: 'ds-ov-val' }, evt.event_time ? evt.event_time.substring(0,5) : '—'),
            ),
            React.createElement('div', null,
                React.createElement('div', { className: 'ds-ov-lbl' }, 'Category'),
                React.createElement('div', { className: 'ds-ov-val' }, evt.event_category || '—'),
            ),
            React.createElement('div', null,
                React.createElement('div', { className: 'ds-ov-lbl' }, 'Location'),
                React.createElement('div', { className: 'ds-ov-val', style:{ fontSize:'12px' } }, evt.location || '—'),
            ),
            React.createElement('div', { style:{ gridColumn: 'span 2' } },
                React.createElement('div', { className: 'ds-ov-lbl' }, 'Assigned To'),
                React.createElement('div', { className: 'ds-ov-val', style:{ fontSize:'12px' } }, evt._assignedName || evt.assigned_to || '—'),
            ),
        ),
        React.createElement('div', { className: 'ds-ov-notes-lbl' }, 'Notes'),
        React.createElement('div', { className: 'ds-ov-notes-box' },
            stripH(evt.notes) || React.createElement('span', { style:{ color:'var(--faint)' } }, 'No notes added.'),
        ),
    );
}

    function renderEdit() {
    if (!form) return React.createElement('div', { className:'ds-act-log-empty' }, 'Loading…');
    return React.createElement('div', null,
        field('Event Type', false,
            React.createElement('div', { className:'ds-toggle-row' },
                ['Event','Meeting','Call'].map(function(c) {
                    var icons = { 'Event':'📅', 'Meeting':'🤝', 'Call':'📞' };
                    return React.createElement('button', {
                        key: c,
                        className: 'ds-toggle-btn' + (form.event_category === c ? ' active' : ''),
                        type: 'button',
                        onClick: function(){ setF('event_category', c); },
                    }, icons[c] + ' ' + c);
                }),
            ),
        ),
        field('Title', true,
            React.createElement('input', { className:'ds-input', value:form.title, onChange:function(e){setF('title',e.target.value);} }),
        ),
        React.createElement('div', { className:'ds-row2' },
            field('Date', true, React.createElement('input', { className:'ds-input', type:'date', value:form.event_date, onChange:function(e){setF('event_date',e.target.value);} })),
            field('Time', false, React.createElement('input', { className:'ds-input', type:'time', value:form.event_time, onChange:function(e){setF('event_time',e.target.value);} })),
        ),
        field('Assigned To', false,
            React.createElement('input', {
                className: 'ds-input',
                value: evt._assignedName || evt.assigned_to || '—',
                readOnly: true,
                style: { background: 'var(--bg2)', cursor: 'default', color: 'var(--muted)' },
            }),
        ),
        field('Location', false,
            React.createElement('input', { className:'ds-input', value:form.location, placeholder:'e.g. DIFC Gate Village', onChange:function(e){setF('location',e.target.value);} }),
        ),
        field('Notes', false,
            React.createElement('textarea', { className:'ds-textarea', value:form.notes, placeholder:'Event details, attendees, agenda…', style:{minHeight:'80px'}, onChange:function(e){setF('notes',e.target.value);} }),
        ),
        React.createElement('div', { style:{display:'flex', gap:'8px'} },
            React.createElement('button', {
                className:'g-btn g-btn-primary', style:{flex:1},
                disabled: saving, onClick: saveEdit,
            }, saving ? 'Saving…' : 'Save Changes'),
        ),
    );
}

    return React.createElement('div', { className: 'ds-evt-panel' + (props.open ? ' open' : '') },
        React.createElement('div', { className: 'ds-evt-panel-hdr' },
            React.createElement('div', { className: 'ds-evt-panel-top' },
                React.createElement('div', { style:{ flex:1, minWidth:0 } },
                    React.createElement('div', { className: 'ds-evt-panel-title' }, evt.title || '—'),
                    React.createElement('div', { className: 'ds-evt-panel-meta' },
                        React.createElement('span', { className: 'ds-net-card-cat', style:{ background: catStyle.bg, color: catStyle.color } }, evt.event_category || '—'),
                        React.createElement('span', { style:{ fontSize:'11.5px', color:'var(--muted)' } }, fmtEventDate(evt.event_date, evt.event_time)),
                        evt.location ? React.createElement('span', { style:{ fontSize:'11px', color:'var(--faint)' } }, '📍 ' + evt.location) : null,
                    ),
                ),
                React.createElement('button', { className:'ds-drawer-close', onClick:props.onClose }, closeIcon()),
            ),
        ),
        React.createElement('div', { className: 'ds-evt-tabs' },
            React.createElement('div', { className:'ds-evt-tab'+(tab==='overview'?' active':''), onClick:function(){setTab('overview');} }, 'Overview'),
            React.createElement('div', { className:'ds-evt-tab'+(tab==='edit'?' active':''), onClick:function(){setTab('edit');} }, 'Edit Event'),
        ),
        React.createElement('div', { className: 'ds-evt-body' },
            tab === 'overview' ? renderOverview() : renderEdit(),
        ),
    );
}

// ── DRAWER: ADD EVENT ──────────────────────────────────────────────────
function DrawerAddEvent(props) {
    var defaultForm = { event_category:'Event', link_type:'Enquiry', enquiry:'', lead:'', title:'', event_date:'', event_time:'', assigned_to: frappe.session.user, location:'', notes:'' };
    var formArr   = React.useState(defaultForm); var form = formArr[0]; var setForm = formArr[1];
    var savingArr = React.useState(false);       var saving = savingArr[0]; var setSaving = savingArr[1];
    var mountKeyArr = React.useState(0); var mountKey = mountKeyArr[0]; var setMountKey = mountKeyArr[1];

    React.useEffect(function () {
        if (props.open) {
            setForm(Object.assign({}, defaultForm, { assigned_to: frappe.session.user, event_date: frappe.datetime.get_today() }));
            setMountKey(function(k){ return k+1; });
        }
    }, [props.open]);

    function set(k, v) { setForm(function(f){ return Object.assign({}, f, {[k]:v}); }); }

    function save() {
        if (!form.title.trim()) { props.showToast('Title is required', 'error'); return; }
        if (!form.event_date)   { props.showToast('Date is required', 'error'); return; }
        setSaving(true);
        frappe.call({
            method: 'frappe.client.insert',
            args: { doc: {
                doctype: 'CRM Event',
                event_category: form.event_category,
                title: form.title.trim(),
                event_date: form.event_date,
                event_time: form.event_time || '',
                location: form.location.trim(),
                notes: form.notes.trim(),
                assigned_to: form.assigned_to || frappe.session.user,
                enquiry: form.link_type === 'Enquiry' ? form.enquiry : '',
                lead:    form.link_type === 'Lead'    ? form.lead    : '',
            }},
            callback: function(r) {
                setSaving(false);
                if (r.message) { props.showToast('Event added!', 'success'); props.onClose(); props.refresh(); }
            },
            error: function() { setSaving(false); props.showToast('Failed to save.', 'error'); },
        });
    }

    return React.createElement(Drawer, { id:'drawer-addevent', open:props.open, icon:'📅', title:'Add Event', onClose:props.onClose, onSave:save, saveLabel:'Add Event', saving:saving },
        // Event Type
        field('Event Type', false,
            React.createElement('div', { className:'ds-toggle-row' },
                ['Event','Meeting','Call'].map(function(c) {
                    var icons = { 'Event':'📅', 'Meeting':'🤝', 'Call':'📞' };
                    return React.createElement('button', {
                        key: c,
                        className: 'ds-toggle-btn' + (form.event_category === c ? ' active' : ''),
                        type: 'button',
                        onClick: function(){ set('event_category', c); },
                    }, icons[c] + ' ' + c);
                }),
            ),
        ),
        // Link to
        field('Link to', false,
            React.createElement('div', { className:'ds-toggle-row', style:{marginBottom:'8px'} },
                React.createElement('button', {
                    className: 'ds-toggle-btn'+(form.link_type==='Enquiry'?' active':''),
                    type:'button',
                    onClick: function(){ set('link_type','Enquiry'); set('lead',''); }
                }, '📋 Enquiry'),
                React.createElement('button', {
                    className: 'ds-toggle-btn'+(form.link_type==='Lead'?' active':''),
                    type:'button',
                    onClick: function(){ set('link_type','Lead'); set('enquiry',''); }
                }, '👤 Lead'),
            ),
        ),
        form.link_type === 'Enquiry'
            ? field('Enquiry', false, React.createElement(LinkField, { key:'ae-enq-'+mountKey, doctype:'CRM Enquiry', labelField:'title', placeholder:'Search enquiry…', filters:[['stage','not in',['Won','Lost']]], value:form.enquiry, onChange:function(v){set('enquiry',v);} }))
            : field('Lead', false, React.createElement(LinkField, { key:'ae-lead-'+mountKey, doctype:'CRM Lead', labelField:'full_name', placeholder:'Search lead…', filters:[['status','=','Active']], value:form.lead, onChange:function(v){set('lead',v);} })),
        field('Title', true,
            React.createElement('input', { className:'ds-input', value:form.title, placeholder:'e.g. Design Week Dubai Networking Night', onChange:function(e){set('title',e.target.value);}, onKeyDown:function(e){if(e.key==='Enter')save();} }),
        ),
        React.createElement('div', { className:'ds-row2' },
            field('Date', true, React.createElement('input', { className:'ds-input', type:'date', value:form.event_date, onChange:function(e){set('event_date',e.target.value);} })),
            field('Time', false, React.createElement('input', { className:'ds-input', type:'time', value:form.event_time, onChange:function(e){set('event_time',e.target.value);} })),
        ),
        field('Assigned To', false, React.createElement(LinkField, { key:'ae-user-'+mountKey, doctype:'User', labelField:'full_name', placeholder:'Search user…', filters:[['enabled','=',1],['user_type','=','System User']], value:form.assigned_to, onChange:function(v){set('assigned_to',v);} })),
        field('Location', false,
            React.createElement('input', { className:'ds-input', value:form.location, placeholder:'e.g. DIFC Gate Village, Dubai', onChange:function(e){set('location',e.target.value);} }),
        ),
        field('Notes', false,
            React.createElement('textarea', { className:'ds-textarea', value:form.notes, placeholder:'Event details, attendees, agenda…', style:{minHeight:'80px'}, onChange:function(e){set('notes',e.target.value);} }),
        ),
    );
}

// ── NETWORKING EVENTS SECTION ──────────────────────────────────────────
function NetworkingEventsSection(props) {
    var eventsArr = React.useState([]); var events = eventsArr[0]; var setEvents = eventsArr[1];
    var loadingArr = React.useState(true); var loading = loadingArr[0]; var setLoading = loadingArr[1];
    var selEvtArr  = React.useState(null); var selEvt = selEvtArr[0]; var setSelEvt = selEvtArr[1];
    var panelOpenArr = React.useState(false); var panelOpen = panelOpenArr[0]; var setPanelOpen = panelOpenArr[1];
    var drawerOpenArr = React.useState(false); var drawerOpen = drawerOpenArr[0]; var setDrawerOpen = drawerOpenArr[1];

    React.useEffect(function () {
    setLoading(true);
    var today = frappe.datetime.get_today();
    frappe.call({
        method: 'frappe.client.get_list',
        args: {
            doctype: 'CRM Event',
            filters: [['event_date', '>=', today]],
            fields: ['name', 'title', 'event_category', 'event_date', 'event_time', 'location', 'enquiry', 'lead', 'assigned_to', 'notes'],
            order_by: 'event_date asc, event_time asc',
            limit_page_length: 5,
        },
        callback: function(r) {
            var rows = r.message || [];
            // Resolve assigned_to names
            var uids = [];
            rows.forEach(function(e) {
                if (e.assigned_to && uids.indexOf(e.assigned_to) === -1) uids.push(e.assigned_to);
            });
            if (uids.length) {
                frappe.call({
                    method: 'frappe.client.get_list',
                    args: { doctype:'User', filters:[['name','in',uids]], fields:['name','full_name'], limit_page_length:50 },
                    callback: function(r2) {
                        var map = {};
                        (r2.message||[]).forEach(function(u){ map[u.name] = u.full_name; });
                        rows = rows.map(function(e){
                            return Object.assign({}, e, { _assignedName: map[e.assigned_to] || e.assigned_to });
                        });
                        setEvents(rows);
                        setLoading(false);
                    },
                });
            } else {
                setEvents(rows);
                setLoading(false);
            }
        },
    });
}, [props.refreshAt]);

    function openPanel(evt) { setSelEvt(evt); setPanelOpen(true); }
    function closePanel() { setPanelOpen(false); }

    function renderCard(evt) {
        var catStyle = evtCatStyle(evt.event_category);
        return React.createElement('div', { className: 'ds-net-card', key: evt.name, onClick: function(){ openPanel(evt); } },
            React.createElement('div', { className: 'ds-net-card-date' }, fmtEventDate(evt.event_date, evt.event_time)),
            React.createElement('div', { className: 'ds-net-card-title' }, evt.title),
            evt.location ? React.createElement('div', { className: 'ds-net-card-venue' }, evt.location) : null,
            React.createElement('span', { className: 'ds-net-card-cat', style: { background: catStyle.bg, color: catStyle.color } }, evt.event_category || 'Event'),
        );
    }

    return React.createElement(React.Fragment, null,
        React.createElement('div', { className: 'ds-net-wrap' },
            React.createElement('div', { className: 'ds-sec-hdr', style:{ marginBottom:'14px' } },
                React.createElement('span', { className: 'ds-sec-ttl' }, '🏞 Networking Events'),
                React.createElement('div', { className: 'ds-sec-rule' }),
                React.createElement('button', {
                    className: 'g-btn g-btn-primary',
                    style: { padding:'4px 12px', fontSize:'11.5px' },
                    onClick: function(){ setDrawerOpen(true); },
                }, '+ Add Event'),
                React.createElement('button', {
                    className: 'g-btn g-btn-ghost',
                    style: { padding:'4px 10px', fontSize:'11.5px' },
                    onClick: function () { frappe.set_route('ds-event'); },
                }, 'Calendar →'),
            ),
            loading
                ? React.createElement('div', { className:'ds-empty' }, 'Loading…')
                : events.length === 0
                    ? React.createElement('div', { className:'ds-empty' }, 'No upcoming events.')
                    : React.createElement('div', { className:'ds-net-scroll' },
                        React.createElement('div', { className:'ds-net-list' }, events.map(renderCard)),
                      ),
        ),
        React.createElement(DrawerOverlay, { open: panelOpen || drawerOpen, onClose: function(){ closePanel(); setDrawerOpen(false); } }),
        React.createElement(EventDetailPanel, {
            open: panelOpen,
            event: selEvt,
            onClose: closePanel,
            showToast: props.showToast,
            refresh: function(){ props.refresh(); closePanel(); },
        }),
        React.createElement(DrawerAddEvent, {
            open: drawerOpen,
            onClose: function(){ setDrawerOpen(false); },
            showToast: props.showToast,
            refresh: function(){ props.refresh(); setDrawerOpen(false); },
        }),
    );
}


		// ── STAT CARD ──────────────────────────────────────────────────────
		function statCard(val, label, pct, colorClass) {
			return React.createElement('div', { className:'g-stat', key:label },
				React.createElement('div', { className:'g-stat-value'+(colorClass?' '+colorClass:'') },
					(val === null || val === undefined) ? React.createElement('span', { className:'ds-shimmer-inline' }) : val,
				),
				React.createElement('div', { className:'g-stat-label' }, label),
				React.createElement('div', { className:'g-stat-bar' },
					React.createElement('div', { className:'g-stat-bar-fill'+(colorClass?' '+colorClass:''), style:{width:pct+'%',transition:'width 1s cubic-bezier(0.4,0,0.2,1)'} }),
				),
			);
		}

		// ── GREET SECTION ──────────────────────────────────────────────────
		function GreetSection(props) {
			var barsArr = React.useState(false); var barsReady = barsArr[0]; var setBarsReady = barsArr[1];
			React.useEffect(function () { setTimeout(function () { setBarsReady(true); }, 350); }, []);

			var s = props.stats;
			var pct = {
				pipeline: Math.min((s.pipeline || 0) / 1000000 * 100, 100),
				won:      Math.min((s.won      || 0) / 500000  * 100, 100),
				leads:    Math.min((s.leads    || 0) / 30      * 100, 100),
				overdue:  Math.min((s.overdue  || 0) / 10      * 100, 100),
			};

			return React.createElement('div', { className:'greet-section' },
				React.createElement('div', { className:'greet-inner' },
					React.createElement('div', { className:'greet-left' },
						React.createElement('div', { className:'greet-avatar-wrap' },
							React.createElement('div', { className:'greet-avatar' },
								props.profile.image
									? React.createElement('img', { src:props.profile.image, alt:'' })
									: React.createElement('span', null, props.profile.initials),
							),
							React.createElement('div', { className:'greet-avatar-pulse' }),
						),
						React.createElement('div', { className:'greet-text' },
							React.createElement('div', { className:'greet-eyebrow' },
								React.createElement('span', { className:'greet-eye-dot' }),
								props.weekLabel,
							),
							React.createElement('div', { className:'greet-title' }, props.greeting + ', ' + (props.profile.name || 'there') + '.'),
							React.createElement('div', { className:'greet-subtitle' }, props.subtitle),
							React.createElement('div', { className:'greet-actions' },
								React.createElement('button', { className:'g-btn g-btn-primary',   onClick:props.onNewLead },     plusIcon(),  ' New Lead'),
								React.createElement('button', { className:'g-btn g-btn-secondary', onClick:props.onNewEnquiry },  plusIcon(),  ' New Enquiry'),
								React.createElement('button', { className:'g-btn g-btn-ghost',     onClick:props.onLogActivity }, clockIcon(), ' Log Activity'),
							),
						),
					),
					React.createElement('div', { className:'greet-stats' },
						statCard('AED ' + props.fN(s.pipeline), 'AED Pipeline', barsReady ? pct.pipeline : 0, ''),
						statCard('AED ' + props.fN(s.won),      'AED Won',      barsReady ? pct.won      : 0, 'won'),
						statCard(s.leads   !== null ? s.leads   : '—', 'Active Leads', barsReady ? pct.leads   : 0, 'leads'),
						statCard(s.overdue !== null ? s.overdue : '—', 'Overdue',      barsReady ? pct.overdue : 0, 'overdue'),
					),
				),
				props.ticker.length > 0 ? React.createElement(TickerBar, { items:props.ticker }) : null,
			);
		}

		// ── TOP-LEVEL APP ──────────────────────────────────────────────────
		function DSCRMApp() {
			var user = frappe.session.user;

			var profileArr  = React.useState({ initials:'', name:'', image:'' }); var profile = profileArr[0]; var setProfile = profileArr[1];
			var statsArr    = React.useState({ pipeline:null, won:null, leads:null, overdue:null }); var stats = statsArr[0]; var setStats = statsArr[1];
			var tickerArr   = React.useState([]); var ticker = tickerArr[0]; var setTicker = tickerArr[1];
			var greetingArr = React.useState(''); var greeting = greetingArr[0]; var setGreeting = greetingArr[1];
			var weekArr     = React.useState(''); var weekLabel = weekArr[0]; var setWeekLabel = weekArr[1];
			var subtitleArr = React.useState('Fetching your pipeline summary…'); var subtitle = subtitleArr[0]; var setSubtitle = subtitleArr[1];
			var drawerArr   = React.useState(null); var drawer = drawerArr[0]; var setDrawer = drawerArr[1];
			var toastArr    = React.useState(null); var toast = toastArr[0]; var setToast = toastArr[1];
			var refreshArr  = React.useState(0); var refreshAt = refreshArr[0]; var setRefreshAt = refreshArr[1];
			var editActArr  = React.useState(null); var editAct = editActArr[0]; var setEditAct = editActArr[1];
			var sectRefArr  = React.useState(0); var sectRefreshAt = sectRefArr[0]; var setSectRefreshAt = sectRefArr[1];

			function refreshSections() { setSectRefreshAt(Date.now()); }

			function fN(n) {
				if (!n) return '0';
				if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
				if (n >= 1000)    return Math.round(n / 1000) + 'K';
				return String(n);
			}
			function showToast(msg, type) {
				setToast({ msg:msg, type:type||'success' });
				setTimeout(function () { setToast(null); }, 3200);
			}
			function refresh() { setRefreshAt(Date.now()); }

			// Greeting
			React.useEffect(function () {
				var h = new Date().getHours();
				setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
				var d = new Date(), start = new Date(d.getFullYear(), 0, 1);
				var wk = Math.ceil(((d - start) / 86400000 + start.getDay() + 1) / 7);
				var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
				setWeekLabel('Week ' + wk + ' · ' + months[d.getMonth()] + ' ' + d.getFullYear());
			}, []);

			// Profile
			React.useEffect(function () {
				var parts = (frappe.session.user_fullname || user).split(' ');
				var initials = parts.map(function (p) { return p[0]; }).join('').toUpperCase().slice(0, 2);
				setProfile(function (p) { return Object.assign({}, p, { initials:initials, name:parts[0] }); });
				frappe.db.get_value('User', user, ['user_image', 'full_name'], function (r) {
					if (!r) return;
					var firstName = (r.full_name || '').split(' ')[0] || parts[0];
					setProfile({ initials:initials, name:firstName, image:r.user_image || '' });
				});
			}, []);

			// Stats
			React.useEffect(function () {
				var ms = frappe.datetime.month_start(), me = frappe.datetime.month_end();
				var today = frappe.datetime.get_today();

				frappe.call({ method:'frappe.client.get_list', args:{ doctype:'CRM Enquiry',
					filters:[['assigned_to','=',user],['stage','not in',['Won','Lost']]], fields:['name','value'], limit_page_length:0 },
					callback:function(r){ var t=(r.message||[]).reduce(function(s,e){return s+(e.value||0);},0); setStats(function(s){return Object.assign({},s,{pipeline:t});}); } });

				frappe.call({ method:'frappe.client.get_list', args:{ doctype:'CRM Enquiry',
					filters:[['assigned_to','=',user],['stage','=','Won'],['modified','between',[ms,me]]], fields:['name','value'], limit_page_length:0 },
					callback:function(r){ var t=(r.message||[]).reduce(function(s,e){return s+(e.value||0);},0); setStats(function(s){return Object.assign({},s,{won:t});}); } });

				frappe.call({ method:'frappe.client.get_count', args:{ doctype:'CRM Lead', filters:[['assigned_to','=',user],['status','=','Active']] },
					callback:function(r){ setStats(function(s){return Object.assign({},s,{leads:r.message||0});}); } });

				frappe.call({ method:'frappe.client.get_count', args:{ doctype:'CRM Activity', filters:[['logged_by','=',user],['activity_date','<',today]] },
					callback:function(r){
						var cnt = r.message || 0;
						setStats(function(s){return Object.assign({},s,{overdue:cnt});});
						frappe.call({ method:'frappe.client.get_count', args:{ doctype:'CRM Enquiry',
							filters:[['assigned_to','=',user],['stage','not in',['Won','Lost']],['days_in_stage','>',7]] },
							callback:function(r2){
								var attn = r2.message || 0, parts = [];
								if (cnt  > 0) parts.push(cnt + ' overdue activit' + (cnt===1?'y':'ies'));
								if (attn > 0) parts.push(attn + ' deal' + (attn===1?'':'s') + ' need attention');
								setSubtitle(parts.length ? parts.join(' · ') : 'Your pipeline is looking healthy today.');
							},
						});
					},
				});
			}, [refreshAt]);

			// Ticker
			React.useEffect(function () {
				var items = [], pending = 3;
				var today = frappe.datetime.get_today();
				var in3   = frappe.datetime.add_days(today, 3);
				var ms    = frappe.datetime.month_start(), me = frappe.datetime.month_end();

				function rebuild() { pending--; if (pending <= 0) setTicker(items.slice()); }

				frappe.call({ method:'frappe.client.get_count', args:{ doctype:'CRM Activity',
					filters:[['logged_by','=',user],['activity_date','<',today],['follow_up_action','!=','']] },
					callback:function(r){ var c=r.message||0; if(c>0) items.push({icon:'⚠',text:c+' overdue follow-up'+(c>1?'s':''),color:'amb'}); rebuild(); } });

				frappe.call({ method:'frappe.client.get_list', args:{ doctype:'CRM Enquiry',
					filters:[['assigned_to','=',user],['stage','=','Proposal'],['last_activity_date','<=',in3]],
					fields:['name','title'], limit_page_length:5, order_by:'last_activity_date asc' },
					callback:function(r){ (r.message||[]).forEach(function(e){ items.push({icon:'📋',text:e.title+' proposal due soon',color:'blue'}); }); rebuild(); } });

				frappe.call({ method:'frappe.client.get_list', args:{ doctype:'CRM Enquiry',
					filters:[['assigned_to','=',user],['stage','=','Won'],['modified','between',[ms,me]]],
					fields:['name','value'], limit_page_length:0 },
					callback:function(r){ var t=(r.message||[]).reduce(function(s,e){return s+(e.value||0);},0); if(t>0) items.push({icon:'✓',text:'AED '+fN(t)+' closed this month',color:'grn'}); rebuild(); } });
			}, [refreshAt]);

			// Auto-refresh
			React.useEffect(function () {
				var id = setInterval(refresh, 10000);
				return function () { clearInterval(id); };
			}, []);

			return React.createElement(React.Fragment, null,
				React.createElement('div', { className: 'ds-crm-wrapper' },
					React.createElement(GreetSection, {
						profile:profile, greeting:greeting, weekLabel:weekLabel, subtitle:subtitle,
						stats:stats, fN:fN, ticker:ticker,
						onNewLead:function(){setDrawer('lead');},
						onNewEnquiry:function(){setDrawer('enquiry');},
						onLogActivity:function(){setDrawer('activity');},
					}),

					React.createElement('div', { className: 'ds-g2' },
						React.createElement(OnDeckSection, {
							refreshAt: sectRefreshAt,
							onLogActivity: function () { setDrawer('activity'); },
						}),
						React.createElement(NeedsChasingSection, {
							refreshAt: sectRefreshAt,
							onEdit: function (act) { setEditAct(act); setDrawer('editfollowup'); },
						}),
					),

					React.createElement(MyBriefBoard, {
						refreshAt: sectRefreshAt,
						showToast: showToast,
						refresh: function () { refresh(); refreshSections(); },
					}),

					React.createElement(NetworkingEventsSection, {
                        refreshAt: sectRefreshAt,
                        showToast: showToast,
                        refresh: function(){ refresh(); refreshSections(); },
                    }),

					React.createElement(DrawerOverlay, { open:!!drawer, onClose:function(){setDrawer(null);} }),
					React.createElement(DrawerLead,         { open:drawer==='lead',         onClose:function(){setDrawer(null);}, showToast:showToast, refresh:function(){refresh();refreshSections();} }),
					React.createElement(DrawerEnquiry,      { open:drawer==='enquiry',      onClose:function(){setDrawer(null);}, showToast:showToast, refresh:function(){refresh();refreshSections();} }),
					React.createElement(DrawerActivity,     { open:drawer==='activity',     onClose:function(){setDrawer(null);}, showToast:showToast, refresh:function(){refresh();refreshSections();} }),
					React.createElement(DrawerEditFollowup, { open:drawer==='editfollowup', onClose:function(){setDrawer(null);setEditAct(null);}, showToast:showToast, refresh:function(){refresh();refreshSections();}, activity:editAct }),
				),
				toast ? React.createElement(Toast, { msg:toast.msg, type:toast.type }) : null,
			);
		}

		// ── BOOT ───────────────────────────────────────────────────────────
		if (ReactDOM.createRoot) {
    ReactDOM.createRoot(mount).render(React.createElement(DSCRMApp));
} else {
    ReactDOM.render(React.createElement(DSCRMApp), mount);
}

	}); // end frappe.require callback
}; // end on_page_load