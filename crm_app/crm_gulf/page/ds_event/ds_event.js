frappe.pages['ds-event'].on_page_load = function (wrapper) {
	frappe.ui.make_app_page({
		parent: wrapper,
		title: 'DS Events',
		single_column: true,
	});

	frappe.require([
		'https://unpkg.com/vue@3/dist/vue.global.prod.js',
	], function () {
		frappe.require('/assets/crm_app/css/ds_event.css');

		// ── SCROLL FIX: reset scroll every time this page is shown ──────────
		// $(wrapper).on('show', function () {
		// 	var pageBody = $(wrapper).find('.page-content')[0];
		// 	if (pageBody) pageBody.scrollTop = 0;
		// 	// Also reset main window scroll
		// 	var layout = document.querySelector('.layout-main-section');
		// 	if (layout) layout.scrollTop = 0;
		// });

		// ── SCROLL FIX ───────────────────────────────────────────────────────
// ── SCROLL FIX ───────────────────────────────────────────────────────
function applyScrollFix() {
    var pageContent = $(wrapper).find('.page-content')[0];
    if (pageContent) {
        pageContent.style.setProperty('overflow',   'visible', 'important');
        pageContent.style.setProperty('height',     'auto',    'important');
        pageContent.style.setProperty('max-height', 'none',    'important');
        pageContent.style.setProperty('min-height', '0',       'important');
    }
    var pageBody = $(wrapper).find('.page-body')[0];
    if (pageBody) {
        pageBody.style.setProperty('overflow',   'visible', 'important');
        pageBody.style.setProperty('height',     'auto',    'important');
        pageBody.style.setProperty('max-height', 'none',    'important');
    }
}

applyScrollFix();
$(wrapper).on('show', function () {
    applyScrollFix();
    setTimeout(applyScrollFix, 100);
    setTimeout(applyScrollFix, 400);
});

		var mount = document.createElement('div');
		mount.id = 'ds-event-root';
		$(wrapper).find('.page-content').html('').append(mount);

		// ── CONSTANTS ────────────────────────────────────────────────────────
		var MONTHS_LONG  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
		var MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
		var DAYS_SHORT   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
		var DAYS_LONG    = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

		// ── HELPERS ──────────────────────────────────────────────────────────
		function evtCatStyle(cat) {
			var m = {
				'Event':      { bg:'rgba(107,78,186,0.14)',  color:'#6B4EBA' },
				'Meeting':    { bg:'rgba(30,71,200,0.13)',   color:'#1E47C8' },
				'Call':       { bg:'rgba(26,114,69,0.13)',   color:'#1A7245' },
				'Conference': { bg:'rgba(30,71,200,0.13)',   color:'#1E47C8' },
				'Networking': { bg:'rgba(107,78,186,0.14)',  color:'#6B4EBA' },
				'Meetup':     { bg:'rgba(15,123,108,0.13)',  color:'#0F7B6C' },
				'Award Show': { bg:'rgba(196,81,42,0.13)',   color:'#C4512A' },
			};
			return m[cat] || { bg:'rgba(113,117,132,0.12)', color:'#717584' };
		}

		function fmtDateShort(ds) {
			if (!ds) return '—';
			var parts = ds.split('-');
			var m, d;
			if (parts[0].length === 4) {
				m = parseInt(parts[1], 10) - 1;
				d = parseInt(parts[2], 10);
			} else {
				m = parseInt(parts[1], 10) - 1;
				d = parseInt(parts[0], 10);
			}
			return MONTHS_SHORT[m] + ' ' + d;
		}

		function fmtDateLong(ds) {
			if (!ds) return '—';
			var parts = ds.split('-');
			var y, m, d;
			if (parts[0].length === 4) {
				y = parseInt(parts[0], 10);
				m = parseInt(parts[1], 10) - 1;
				d = parseInt(parts[2], 10);
			} else {
				d = parseInt(parts[0], 10);
				m = parseInt(parts[1], 10) - 1;
				y = parseInt(parts[2], 10);
			}
			var dow = new Date(Date.UTC(y, m, d)).getUTCDay();
			return DAYS_LONG[dow] + ', ' + MONTHS_LONG[m] + ' ' + d + ', ' + y;
		}

		function fmtTime(ts) {
			if (!ts) return '';
			return ts.substring(0, 5);
		}

		function todayStr() {
			return frappe.datetime.get_today();
		}

		// ── LINK FIELD COMPONENT ─────────────────────────────────────────────
		var LinkFieldComp = {
			name: 'LinkField',
			props: {
				doctype:    { type: String, required: true },
				labelField: { type: String, default: 'name' },
				placeholder:{ type: String, default: 'Search…' },
				filters:    { type: Array,  default: function(){ return []; } },
				modelValue: { type: String, default: '' },
			},
			emits: ['update:modelValue'],
			data: function() {
				return {
					query:   '',
					opts:    [],
					isOpen:  false,
					display: '',
				};
			},
			watch: {
				modelValue: function(v) {
					if (!v) { this.display = ''; this.query = ''; this.isOpen = false; }
				},
			},
			methods: {
				openDropdown: function() {
					this.isOpen = true;
					this.query  = '';
					this.fetchOpts();
				},
				fetchOpts: function() {
					var self    = this;
					var fields  = ['name'].concat(this.labelField ? [this.labelField] : []);
					var filters = (this.filters || []).slice();
					if (this.query) filters.push([this.labelField || 'name', 'like', '%' + this.query + '%']);
					frappe.call({
						method: 'frappe.client.get_list',
						args: { doctype: self.doctype, filters: filters, fields: fields, limit_page_length: 20, order_by: 'creation desc' },
						callback: function(r) { self.opts = r.message || []; },
					});
				},
				selectOpt: function(opt) {
					this.$emit('update:modelValue', opt.name);
					this.display = opt[this.labelField] || opt.name;
					this.query   = '';
					this.isOpen  = false;
				},
				clearVal: function() {
					this.$emit('update:modelValue', '');
					this.display = '';
					this.query   = '';
				},
				onBlur: function() {
					var self = this;
					setTimeout(function() { self.isOpen = false; }, 180);
				},
				toggleDropdown: function() {
					if (this.isOpen) { this.isOpen = false; }
					else { this.openDropdown(); }
				},
			},
			template: `
				<div class="dse-link-wrap">
					<div class="dse-link-input-row">
						<input
							class="dse-input dse-link-input"
							:value="isOpen ? query : display"
							:placeholder="display ? '' : placeholder"
							@focus="openDropdown"
							@input="e => { query = e.target.value; fetchOpts(); }"
							@blur="onBlur"
						/>
						<button v-if="display" class="dse-link-clear" type="button" @mousedown.prevent="clearVal">×</button>
						<span class="dse-link-arrow" @mousedown.prevent="toggleDropdown">▾</span>
					</div>
					<div v-if="display && !isOpen" class="dse-link-badge">{{ display }}</div>
					<div v-if="isOpen" class="dse-link-dropdown">
						<div v-if="opts.length === 0" class="dse-link-empty">No results</div>
						<div
							v-for="opt in opts"
							:key="opt.name"
							class="dse-link-option"
							@mousedown.prevent="selectOpt(opt)"
						>
							<span class="dse-link-opt-label">{{ opt[labelField] || opt.name }}</span>
							<span v-if="labelField && opt.name !== opt[labelField]" class="dse-link-opt-sub">{{ opt.name }}</span>
						</div>
					</div>
				</div>
			`,
		};

		// ── DRAWER ADD EVENT COMPONENT ────────────────────────────────────────
		var DrawerAddEventComp = {
			name: 'DrawerAddEvent',
			components: { LinkField: LinkFieldComp },
			props: {
				open: { type: Boolean, default: false },
			},
			emits: ['close', 'toast', 'refresh'],
			data: function() {
				return {
					saving:    false,
					mountKey:  0,
					form: {
						event_category: 'Event',
						link_type:      'Enquiry',
						enquiry:        '',
						lead:           '',
						title:          '',
						event_date:     frappe.datetime.get_today(),
						event_time:     '',
						assigned_to:    frappe.session.user,
						location:       '',
						notes:          '',
					},
				};
			},
			watch: {
				open: function(v) {
					if (v) {
						this.form = {
							event_category: 'Event',
							link_type:      'Enquiry',
							enquiry:        '',
							lead:           '',
							title:          '',
							event_date:     frappe.datetime.get_today(),
							event_time:     '',
							assigned_to:    frappe.session.user,
							location:       '',
							notes:          '',
						};
						this.mountKey++;
					}
				},
			},
			mounted: function() {
				var self = this;
				document.addEventListener('keydown', function(e) {
					if (e.key === 'Escape' && self.open) self.$emit('close');
				});
			},
			methods: {
				setLinkType: function(lt) {
					this.form.link_type = lt;
					if (lt === 'Enquiry') this.form.lead    = '';
					else                  this.form.enquiry = '';
				},
				save: function() {
					var self = this;
					if (!self.form.title.trim()) { self.$emit('toast', { msg:'Title is required', type:'error' }); return; }
					if (!self.form.event_date)   { self.$emit('toast', { msg:'Date is required',  type:'error' }); return; }
					self.saving = true;
					frappe.call({
						method: 'frappe.client.insert',
						args: { doc: {
							doctype:        'CRM Event',
							event_category: self.form.event_category,
							title:          self.form.title.trim(),
							event_date:     self.form.event_date,
							event_time:     self.form.event_time || '',
							location:       self.form.location.trim(),
							notes:          self.form.notes.trim(),
							assigned_to:    self.form.assigned_to || frappe.session.user,
							enquiry:        self.form.link_type === 'Enquiry' ? self.form.enquiry : '',
							lead:           self.form.link_type === 'Lead'    ? self.form.lead    : '',
						}},
						callback: function(r) {
							self.saving = false;
							if (r.message) {
								self.$emit('toast', { msg:'Event added!', type:'success' });
								self.$emit('close');
								self.$emit('refresh');
							}
						},
						error: function() {
							self.saving = false;
							self.$emit('toast', { msg:'Failed to save event.', type:'error' });
						},
					});
				},
			},
			template: `
				<div>
					<!-- Overlay -->
					<div :class="'dse-overlay' + (open ? ' visible' : '')" @click="$emit('close')"></div>

					<!-- Drawer -->
					<div :class="'dse-drawer' + (open ? ' open' : '')">
						<div class="dse-drawer-hdr">
							<div class="dse-drawer-title">📅 Add Event</div>
							<button class="dse-drawer-close" @click="$emit('close')">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
									<path d="M18 6 6 18M6 6l12 12"/>
								</svg>
							</button>
						</div>

						<div class="dse-drawer-body">
							<!-- Event Type -->
							<div class="dse-field">
								<label class="dse-label">Event Type</label>
								<div class="dse-toggle-row">
									<button
										v-for="c in ['Event','Meeting','Call']"
										:key="c"
										:class="'dse-type-btn' + (form.event_category === c ? ' active' : '')"
										type="button"
										@click="form.event_category = c"
									>{{ {Event:'📅',Meeting:'🤝',Call:'📞'}[c] }} {{ c }}</button>
								</div>
							</div>

							<!-- Link To -->
							<div class="dse-field">
								<label class="dse-label">Link to</label>
								<div class="dse-toggle-row" style="margin-bottom:8px">
									<button
										:class="'dse-type-btn' + (form.link_type === 'Enquiry' ? ' active' : '')"
										type="button"
										@click="setLinkType('Enquiry')"
									>📋 Enquiry</button>
									<button
										:class="'dse-type-btn' + (form.link_type === 'Lead' ? ' active' : '')"
										type="button"
										@click="setLinkType('Lead')"
									>👤 Lead</button>
								</div>
							</div>

							<!-- Enquiry / Lead -->
							<div class="dse-field" v-if="form.link_type === 'Enquiry'">
								<label class="dse-label">Enquiry</label>
								<LinkField
									:key="'ae-enq-' + mountKey"
									doctype="CRM Enquiry"
									label-field="title"
									placeholder="Search enquiry…"
									:filters="[['stage','not in',['Won','Lost']]]"
									v-model="form.enquiry"
								/>
							</div>
							<div class="dse-field" v-else>
								<label class="dse-label">Lead</label>
								<LinkField
									:key="'ae-lead-' + mountKey"
									doctype="CRM Lead"
									label-field="full_name"
									placeholder="Search lead…"
									:filters="[['status','=','Active']]"
									v-model="form.lead"
								/>
							</div>

							<!-- Title -->
							<div class="dse-field">
								<label class="dse-label">Title <span class="dse-req">*</span></label>
								<input
									class="dse-input"
									v-model="form.title"
									placeholder="e.g. Design Week Dubai Networking Night"
									@keydown.enter="save"
								/>
							</div>

							<!-- Date + Time -->
							<div class="dse-row2">
								<div class="dse-field">
									<label class="dse-label">Date <span class="dse-req">*</span></label>
									<input class="dse-input" type="date" v-model="form.event_date" />
								</div>
								<div class="dse-field">
									<label class="dse-label">Time</label>
									<input class="dse-input" type="time" v-model="form.event_time" />
								</div>
							</div>

							<!-- Assigned To -->
							<div class="dse-field">
								<label class="dse-label">Assigned To</label>
								<LinkField
									:key="'ae-user-' + mountKey"
									doctype="User"
									label-field="full_name"
									placeholder="Search user…"
									:filters="[['enabled','=',1],['user_type','=','System User']]"
									v-model="form.assigned_to"
								/>
							</div>

							<!-- Location -->
							<div class="dse-field">
								<label class="dse-label">Location</label>
								<input class="dse-input" v-model="form.location" placeholder="e.g. DIFC Gate Village, Dubai" />
							</div>

							<!-- Notes -->
							<div class="dse-field">
								<label class="dse-label">Notes</label>
								<textarea class="dse-textarea" v-model="form.notes" placeholder="Event details, attendees, agenda…" style="min-height:80px"></textarea>
							</div>
						</div>

						<div class="dse-drawer-footer">
							<button class="dse-btn dse-btn-primary" style="flex:1" @click="save" :disabled="saving">
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
									<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
									<polyline points="17 21 17 13 7 13 7 21"/>
									<polyline points="7 3 7 8 15 8"/>
								</svg>
								{{ saving ? ' Saving…' : ' Add Event' }}
							</button>
							<button class="dse-btn dse-btn-ghost" @click="$emit('close')">Cancel</button>
						</div>
					</div>
				</div>
			`,
		};

		// ── MAIN APP COMPONENT ────────────────────────────────────────────────
		var DSEventApp = {
			name: 'DSEventApp',
			components: {
				LinkField:       LinkFieldComp,
				DrawerAddEvent:  DrawerAddEventComp,
			},
			data: function() {
				var today = new Date();
				return {
					year:        today.getFullYear(),
					month:       today.getMonth(),   // 0-indexed
					view:        'month',
					scope:       'team',
					events:      [],
					loading:     true,
					selDay:      null,
					drawerOpen:  false,
					toast:       null,
					refreshAt:   0,
				};
			},
			computed: {
				monthLabel: function() {
					return MONTHS_LONG[this.month] + ' ' + this.year;
				},
				upcoming: function() {
					var td = todayStr();
					return this.events
						.filter(function(e){ return e.event_date >= td; })
						.sort(function(a,b){
							if (a.event_date !== b.event_date) return a.event_date.localeCompare(b.event_date);
							return (a.event_time||'').localeCompare(b.event_time||'');
						})
						.slice(0, 7);
				},
				upcomingCount: function() {
					var td = todayStr();
					return this.events.filter(function(e){ return e.event_date >= td; }).length;
				},
				typeSummary: function() {
					var counts = {};
					this.events.forEach(function(e){ var c = e.event_category||'Event'; counts[c]=(counts[c]||0)+1; });
					return Object.keys(counts).map(function(cat){
						return { cat: cat, count: counts[cat], style: evtCatStyle(cat) };
					});
				},
				cells: function() {
					var firstDay    = new Date(this.year, this.month, 1).getDay();
					var daysInMonth = new Date(this.year, this.month+1, 0).getDate();
					var daysInPrev  = new Date(this.year, this.month, 0).getDate();
					var cells       = [];
					for (var i = firstDay-1; i >= 0; i--) {
						cells.push({ day: daysInPrev-i, current:false, dateStr:null });
					}
					for (var d = 1; d <= daysInMonth; d++) {
						var ds = this.year + '-' + String(this.month+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
						cells.push({ day:d, current:true, dateStr:ds });
					}
					var rem = (7 - cells.length%7) % 7;
					for (var j = 1; j <= rem; j++) {
						cells.push({ day:j, current:false, dateStr:null });
					}
					return cells;
				},
				dayViewDate: function() {
					return this.selDay || (this.year+'-'+String(this.month+1).padStart(2,'0')+'-01');
				},
				dayViewEvents: function() {
					return this.eventsFor(this.dayViewDate);
				},
				dayViewUntimed: function() {
					return this.dayViewEvents.filter(function(e){ return !e.event_time; });
				},
			},
			watch: {
				year:      function() { this.fetchEvents(); },
				month:     function() { this.fetchEvents(); },
				scope:     function() { this.fetchEvents(); },
				refreshAt: function() { this.fetchEvents(); },
			},
			mounted: function() {
				this.fetchEvents();
			},
			methods: {
				// ── DATA ──────────────────────────────────────────────────────
				fetchEvents: function() {
					var self = this;
					self.loading = true;

					var sd    = new Date(self.year, self.month - 1, 1);
					var ed    = new Date(self.year, self.month + 2, 0);
					var sdStr = sd.toISOString().slice(0,10);
					var edStr = ed.toISOString().slice(0,10);

					var filters = [
						['event_date', '>=', sdStr],
						['event_date', '<=', edStr],
					];
					if (self.scope === 'mine') {
						filters.push(['assigned_to', '=', frappe.session.user]);
					}

					frappe.call({
						method: 'frappe.client.get_list',
						args: {
							doctype: 'CRM Event',
							filters: filters,
							fields:  ['name','title','event_category','event_date','event_time','location','assigned_to','enquiry','lead','notes'],
							order_by: 'event_date asc, event_time asc',
							limit_page_length: 300,
						},
						callback: function(r) {
							var rows = r.message || [];
							var uids = [];
							rows.forEach(function(e){ if(e.assigned_to && uids.indexOf(e.assigned_to)===-1) uids.push(e.assigned_to); });

							if (uids.length) {
								frappe.call({
									method: 'frappe.client.get_list',
									args: { doctype:'User', filters:[['name','in',uids]], fields:['name','full_name'], limit_page_length:50 },
									callback: function(r2) {
										var map = {};
										(r2.message||[]).forEach(function(u){ map[u.name] = u.full_name; });
										self.events = rows.map(function(e){ return Object.assign({}, e, { _assignedName: map[e.assigned_to] || e.assigned_to }); });
										self.loading = false;
									},
								});
							} else {
								self.events = rows;
								self.loading = false;
							}
						},
					});
				},

				// ── NAVIGATION ────────────────────────────────────────────────
				navMonth: function(dir) {
					if (this.view === 'day' && this.selDay) {
						var d = new Date(this.selDay);
						d.setDate(d.getDate() + dir);
						var newDs = d.getFullYear() + '-'
							+ String(d.getMonth()+1).padStart(2,'0') + '-'
							+ String(d.getDate()).padStart(2,'0');
						this.selDay = newDs;
						if (d.getMonth() !== this.month || d.getFullYear() !== this.year) {
							this.month = d.getMonth();
							this.year  = d.getFullYear();
						}
						return;
					}
					var nm = this.month + dir;
					if (nm > 11) { nm = 0; this.year++; }
					else if (nm < 0) { nm = 11; this.year--; }
					this.month = nm;
					this.selDay = null;
				},
				goToDay: function(dateStr) {
					this.selDay = dateStr;
					this.view   = 'day';
				},
				switchView: function(v) {
					this.view = v;
					if (v === 'day' && !this.selDay) this.selDay = todayStr();
					if (v === 'month') this.selDay = null;
				},

				// ── HELPERS ───────────────────────────────────────────────────
				eventsFor: function(dateStr) {
					if (!dateStr) return [];
					var norm = dateStr;
					if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
						var p = dateStr.split('-');
						norm = p[2]+'-'+p[1]+'-'+p[0];
					}
					return this.events.filter(function(e){ return e.event_date === norm; });
				},
				evtStyle: function(cat) { return evtCatStyle(cat); },
				fmtDateLong:  fmtDateLong,
				fmtDateShort: fmtDateShort,
				fmtTime:      fmtTime,
				todayStr:     todayStr,

				hourEvents: function(dayEvs, hr) {
					var hStr = String(hr).padStart(2,'0') + ':';
					return dayEvs.filter(function(e) {
						if (!e.event_time) return false;
						var t = e.event_time.trim();
						if (t.charAt(1) === ':') t = '0' + t;
						return t.slice(0,3) === hStr;
					});
				},
				hourLabel: function(hr) {
					return (hr === 0 ? 12 : hr > 12 ? hr-12 : hr) + ':00 ' + (hr < 12 ? 'AM' : 'PM');
				},
				hours: function() {
					var h = [];
					for (var i = 6; i <= 22; i++) h.push(i);
					return h;
				},

				// ── TOAST ─────────────────────────────────────────────────────
				showToast: function(payload) {
					var self = this;
					self.toast = payload;
					setTimeout(function(){ self.toast = null; }, 3200);
				},
				onRefresh: function() {
					this.refreshAt = Date.now();
				},
			},
			template: `
				<div class="ds-event-wrapper">

					<!-- Topbar -->
					<div class="dse-topbar">
						<div class="dse-topbar-left">
							<h1>📅 Events Calendar</h1>
							<p>Meetings, calls and networking events</p>
						</div>
						<div class="dse-topbar-right">
							<!-- Team / Mine -->
							<div class="dse-toggle-group">
								<button :class="'dse-toggle-btn' + (scope==='team'?' on':'')" @click="scope='team'">Team</button>
								<button :class="'dse-toggle-btn' + (scope==='mine'?' on':'')" @click="scope='mine'">Mine</button>
							</div>
							<!-- Month / Day -->
							<div class="dse-toggle-group">
								<button :class="'dse-toggle-btn' + (view==='month'?' on':'')" @click="switchView('month')">Month</button>
								<button :class="'dse-toggle-btn' + (view==='day'?' on':'')"   @click="switchView('day')">Day</button>
							</div>
							<!-- Add Event -->
							<button class="dse-btn dse-btn-primary" @click="drawerOpen=true">
								<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
									<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
								</svg>
								Add Event
							</button>
						</div>
					</div>

					<!-- Main grid -->
					<div class="dse-main-grid">

						<!-- Calendar Card -->
						<div class="dse-cal-card">
							<!-- Nav header -->
							<div class="dse-cal-nav">
								<div class="dse-cal-month-label">{{ monthLabel }}</div>
								<div class="dse-cal-nav-right">
									<button class="dse-icon-btn" @click="navMonth(-1)">
										<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
									</button>
									<button v-if="view==='day'" class="dse-btn dse-btn-ghost" style="padding:4px 10px;font-size:11.5px" @click="switchView('month')">← Month</button>
									<button class="dse-icon-btn" @click="navMonth(1)">
										<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
									</button>
								</div>
							</div>

							<!-- MONTH VIEW -->
							<template v-if="view==='month'">
								<!-- Type chips -->
								<div class="dse-type-chips">
									<span class="dse-type-label">This period:</span>
									<span v-if="loading" style="font-size:10.5px;color:var(--faint)">Loading…</span>
									<template v-else>
										<span v-if="!typeSummary.length" style="font-size:10.5px;color:var(--faint)">No events this period</span>
										<span
											v-for="ts in typeSummary"
											:key="ts.cat"
											class="dse-type-chip"
											:style="{ background: ts.style.bg, color: ts.style.color }"
										>{{ ts.cat }}&nbsp;&nbsp;{{ ts.count }}</span>
									</template>
								</div>

								<!-- Grid -->
								<div class="dse-month-body">
									<div class="dse-dow-row">
										<div v-for="d in ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']" :key="d" class="dse-dow">{{ d }}</div>
									</div>
									<div class="dse-day-grid">
										<div
											v-for="(cell, idx) in cells"
											:key="idx"
											:class="[
												'dse-day-cell',
												!cell.current   ? 'dim'        : '',
												cell.current && cell.dateStr === todayStr() ? 'today' : '',
												cell.current && cell.dateStr === selDay     ? 'selected' : '',
												cell.current && eventsFor(cell.dateStr).length > 0 ? 'has-events' : '',
											]"
											@click="cell.current && goToDay(cell.dateStr)"
										>
											<div class="dse-day-num">{{ cell.day }}</div>

											<template v-if="cell.current">
												<div
													v-for="e in eventsFor(cell.dateStr).slice(0,3)"
													:key="e.name"
													class="dse-day-pill"
													:style="{ background: evtStyle(e.event_category).bg, color: evtStyle(e.event_category).color }"
												>{{ e.event_time ? fmtTime(e.event_time)+' ' : '' }}{{ e.title }}</div>

												<div v-if="eventsFor(cell.dateStr).length > 3" class="dse-day-more">
													+{{ eventsFor(cell.dateStr).length - 3 }} more
												</div>

												<!-- Tooltip -->
												<div v-if="eventsFor(cell.dateStr).length > 0" class="dse-day-tooltip">
													<div v-for="e in eventsFor(cell.dateStr)" :key="e.name" class="dse-tooltip-item">
														<span class="dse-tooltip-cat" :style="{ color: evtStyle(e.event_category).color }">{{ e.event_category }}</span>
														<div class="dse-tooltip-title">{{ e.title }}</div>
														<div v-if="e.event_time || e.location" class="dse-tooltip-time">
															{{ e.event_time ? fmtTime(e.event_time) : '' }}{{ e.event_time && e.location ? '  ·  ' : '' }}{{ e.location || '' }}
														</div>
													</div>
												</div>
											</template>
										</div>
									</div>
								</div>
							</template>

							<!-- DAY VIEW -->
							<template v-else>
								<div class="dse-day-view-body">
									<div class="dse-day-view-title">{{ fmtDateLong(dayViewDate) }}</div>

									<!-- All-day events -->
									<div v-if="dayViewUntimed.length > 0" class="dse-allday-row">
										<div class="dse-allday-label">All day</div>
										<div class="dse-allday-events">
											<div
												v-for="e in dayViewUntimed"
												:key="e.name"
												class="dse-hour-event"
												:style="{ background: evtStyle(e.event_category).bg, borderColor: evtStyle(e.event_category).color }"
											>
												<div class="dse-hour-event-name">{{ e.title }}</div>
												<div class="dse-hour-event-meta">
													{{ e.location ? '📍 '+e.location : '' }}{{ e.location && e._assignedName ? '  ·  ' : '' }}{{ e._assignedName ? '👤 '+e._assignedName : '' }}
												</div>
											</div>
										</div>
									</div>

									<div v-if="dayViewEvents.length === 0" class="dse-empty">No events on this day.</div>

									<div v-for="hr in hours()" :key="hr" class="dse-hour-row">
										<div class="dse-hour-label">{{ hourLabel(hr) }}</div>
										<div class="dse-hour-slot">
											<div
												v-for="e in hourEvents(dayViewEvents, hr)"
												:key="e.name"
												class="dse-hour-event"
												:style="{ background: evtStyle(e.event_category).bg, borderColor: evtStyle(e.event_category).color }"
											>
												<div class="dse-hour-event-name">{{ e.title }}</div>
												<div class="dse-hour-event-meta">
													{{ e.event_time ? '🕐 '+fmtTime(e.event_time) : '' }}{{ e.event_time && (e.location || e._assignedName) ? '  ·  ' : '' }}{{ e.location ? '📍 '+e.location : '' }}{{ e.location && e._assignedName ? '  ·  ' : '' }}{{ e._assignedName ? '👤 '+e._assignedName : '' }}
												</div>
												<div v-if="e.notes" class="dse-hour-event-notes">{{ e.notes }}</div>
											</div>
										</div>
									</div>
								</div>
							</template>
						</div>

						<!-- Upcoming sidebar -->
						<div class="dse-upcoming-card">
							<div class="dse-card-hdr">
								<span class="dse-card-ttl">Upcoming</span>
								<div class="dse-card-rule"></div>
								<span class="dse-card-badge">{{ upcomingCount }}</span>
							</div>
							<div v-if="loading" class="dse-empty">Loading…</div>
							<div v-else-if="!upcoming.length" class="dse-empty">No upcoming events.</div>
							<div
								v-for="e in upcoming"
								:key="e.name"
								class="dse-upcoming-item"
							>
								<div class="dse-upcoming-dot" :style="{ background: evtStyle(e.event_category).color }"></div>
								<div class="dse-upcoming-body">
									<div class="dse-upcoming-date">{{ fmtDateShort(e.event_date) }}{{ e.event_time ? '  ·  '+fmtTime(e.event_time) : '' }}</div>
									<div class="dse-upcoming-title">{{ e.title }}</div>
									<div v-if="e.location" class="dse-upcoming-meta">📍 {{ e.location }}</div>
									<span class="dse-upcoming-cat" :style="{ background: evtStyle(e.event_category).bg, color: evtStyle(e.event_category).color }">{{ e.event_category || 'Event' }}</span>
								</div>
							</div>
						</div>
					</div>

					<!-- Drawer -->
					<DrawerAddEvent
						:open="drawerOpen"
						@close="drawerOpen=false"
						@toast="showToast"
						@refresh="onRefresh"
					/>

					<!-- Toast -->
					<div v-if="toast" :class="'dse-toast show ' + (toast.type || 'success')">{{ toast.msg }}</div>
				</div>
			`,
		};

		// ── BOOT ─────────────────────────────────────────────────────────────
		var vueApp = Vue.createApp(DSEventApp);
		vueApp.mount(mount);

	}); // end frappe.require
}; // end on_page_load