frappe.pages['ds-crm'].on_page_load = function (wrapper) {
	frappe.ui.make_app_page({
		parent: wrapper,
		title: 'DS CRM',
		single_column: true,
	});

	frappe.require([
		'https://unpkg.com/vue@3/dist/vue.global.prod.js',
	], function () {
		frappe.require('/assets/crm_app/css/ds_crm.css');

		// ── SCROLL FIX ───────────────────────────────────────────────────────

// ── SCROLL FIX ───────────────────────────────────────────────────────
function applyScrollFix() {
    // DO NOT touch the sidebar or navbar — only fix the content area
    var layoutMain = document.querySelector('.layout-main-section');
    if (layoutMain) {
        layoutMain.style.setProperty('overflow-y', 'auto',    'important');
        layoutMain.style.setProperty('overflow-x', 'hidden',  'important');
        layoutMain.style.setProperty('height',     '100vh',   'important');
        layoutMain.style.setProperty('max-height', '100vh',   'important');
    }

    var wrapper2 = document.querySelector('.layout-main-section-wrapper');
    if (wrapper2) {
        wrapper2.style.setProperty('overflow',   'visible', 'important');
        wrapper2.style.setProperty('height',     'auto',    'important');
        wrapper2.style.setProperty('max-height', 'none',    'important');
    }

    var pageContent = $(wrapper).find('.page-content')[0];
    if (pageContent) {
        pageContent.style.setProperty('overflow',   'visible', 'important');
        pageContent.style.setProperty('height',     'auto',    'important');
        pageContent.style.setProperty('max-height', 'none',    'important');
    }
}

applyScrollFix();
$(wrapper).on('show', function () {
    applyScrollFix();
    setTimeout(applyScrollFix, 100);
    setTimeout(applyScrollFix, 400);
});

		var mount = document.createElement('div');
		mount.id = 'ds-crm-root';
		$(wrapper).find('.page-content').html('').append(mount);

		// ── CONSTANTS ────────────────────────────────────────────────────────
		var STAGES = ['New Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];
		var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
		var MONTHS_LONG = ['January','February','March','April','May','June','July','August','September','October','November','December'];

		// ── HELPERS ──────────────────────────────────────────────────────────
		function evtCatStyle(cat) {
			var map = {
				'Event':      { bg:'rgba(107,78,186,0.12)',  color:'var(--lav)' },
				'Meeting':    { bg:'rgba(30,71,200,0.12)',   color:'var(--blue)' },
				'Call':       { bg:'rgba(26,114,69,0.12)',   color:'var(--grn)' },
				'Conference': { bg:'rgba(30,71,200,0.12)',   color:'var(--blue)' },
				'Networking': { bg:'rgba(107,78,186,0.12)',  color:'var(--lav)' },
				'Meetup':     { bg:'rgba(15,123,108,0.12)',  color:'#0F7B6C' },
				'Award Show': { bg:'rgba(196,81,42,0.12)',   color:'#C4512A' },
			};
			return map[cat] || { bg:'rgba(113,117,132,0.12)', color:'var(--muted)' };
		}

		function fmtVal(n) {
			if (!n && n !== 0) return '—';
			var num = parseFloat(n);
			if (isNaN(num)) return '—';
			if (num >= 1000000000) return 'AED ' + (num/1000000000).toFixed(1) + 'B';
			if (num >= 1000000)    return 'AED ' + (num/1000000).toFixed(1) + 'M';
			if (num >= 1000)       return 'AED ' + Math.round(num/1000) + 'K';
			return 'AED ' + num;
		}

		function fN(n) {
			if (!n) return '0';
			if (n >= 1000000) return (n/1000000).toFixed(1) + 'M';
			if (n >= 1000)    return Math.round(n/1000) + 'K';
			return String(n);
		}

		function fmtDate(dateStr) {
			if (!dateStr) return '—';
			var d = new Date(dateStr);
			return MONTHS[d.getMonth()] + ' ' + d.getDate();
		}

		function fmtEventDate(dateStr, timeStr) {
			if (!dateStr) return '—';
			var base = fmtDate(dateStr);
			if (timeStr) return base + ' · ' + timeStr.substring(0,5);
			return base;
		}

		function stageClass(stage) {
			return 'stage-' + (stage||'').toLowerCase().replace(/\s+/g,'-');
		}

		function daysDotColor(days) {
			if (days === null || days === undefined) return 'var(--faint)';
			if (days >= 7) return 'var(--red)';
			if (days >= 3) return 'var(--amb)';
			return 'var(--grn)';
		}

		function stripHtml(html) {
			if (!html) return '';
			return html.replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim();
		}

		// ── LINK FIELD COMPONENT ─────────────────────────────────────────────
		var LinkFieldComp = {
			name: 'LinkField',
			props: {
				doctype:    { type:String, required:true },
				labelField: { type:String, default:'name' },
				placeholder:{ type:String, default:'Search…' },
				filters:    { type:Array,  default:function(){ return []; } },
				modelValue: { type:String, default:'' },
			},
			emits: ['update:modelValue'],
			data: function() {
				return { query:'', opts:[], isOpen:false, display:'' };
			},
			watch: {
				modelValue: function(v) {
					if (!v) { this.display=''; this.query=''; this.isOpen=false; }
				},
			},
			methods: {
				openDropdown: function() { this.isOpen=true; this.query=''; this.fetchOpts(); },
				fetchOpts: function() {
					var self = this;
					var fields = ['name'].concat(this.labelField ? [this.labelField] : []);
					var filters = (this.filters||[]).slice();
					if (this.query) filters.push([this.labelField||'name','like','%'+this.query+'%']);
					frappe.call({
						method:'frappe.client.get_list',
						args:{ doctype:self.doctype, filters:filters, fields:fields, limit_page_length:20, order_by:'creation desc' },
						callback:function(r){ self.opts = r.message||[]; },
					});
				},
				selectOpt: function(opt) {
					this.$emit('update:modelValue', opt.name);
					this.display = opt[this.labelField]||opt.name;
					this.query=''; this.isOpen=false;
				},
				clearVal: function() { this.$emit('update:modelValue',''); this.display=''; this.query=''; },
				onBlur: function() { var self=this; setTimeout(function(){ self.isOpen=false; }, 180); },
				toggleDropdown: function() { if(this.isOpen){ this.isOpen=false; } else { this.openDropdown(); } },
			},
			template: `
				<div class="ds-link-wrap">
					<div class="ds-link-input-row">
						<input
							class="ds-input ds-link-input"
							:value="isOpen ? query : display"
							:placeholder="display ? '' : placeholder"
							@focus="openDropdown"
							@input="e => { query=e.target.value; fetchOpts(); }"
							@blur="onBlur"
						/>
						<button v-if="display" class="ds-link-clear" type="button" @mousedown.prevent="clearVal">×</button>
						<span class="ds-link-arrow" @mousedown.prevent="toggleDropdown">▾</span>
					</div>
					<div v-if="display && !isOpen" class="ds-link-badge">{{ display }}</div>
					<div v-if="isOpen" class="ds-link-dropdown">
						<div v-if="opts.length===0" class="ds-link-empty">No results</div>
						<div v-for="opt in opts" :key="opt.name" class="ds-link-option" @mousedown.prevent="selectOpt(opt)">
							<span class="ds-link-opt-label">{{ opt[labelField]||opt.name }}</span>
							<span v-if="labelField && opt.name!==opt[labelField]" class="ds-link-opt-sub">{{ opt.name }}</span>
						</div>
					</div>
				</div>
			`,
		};

		// ── DRAWER WRAPPER COMPONENT ──────────────────────────────────────────
		var DrawerComp = {
			name: 'Drawer',
			props: {
				open:      { type:Boolean, default:false },
				icon:      { type:String,  default:'' },
				title:     { type:String,  default:'' },
				saveLabel: { type:String,  default:'Save' },
				saving:    { type:Boolean, default:false },
				drawerId:  { type:String,  default:'' },
			},
			emits: ['close','save'],
			mounted: function() {
				var self = this;
				document.addEventListener('keydown', function(e){ if(e.key==='Escape' && self.open) self.$emit('close'); });
			},
			template: `
				<div :class="'ds-drawer'+(open?' open':'')" :id="drawerId">
					<div class="ds-drawer-header">
					    <div class="ds-sheet-handle"></div>
						<div class="ds-drawer-title">
							<span class="ds-drawer-icon">{{ icon }}</span>{{ title }}
						</div>
						<button class="ds-drawer-close" @click="$emit('close')">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
						</button>
					</div>
					<div class="ds-drawer-body">
						<slot />
					</div>
					<div class="ds-drawer-footer">
						<button class="g-btn g-btn-primary" style="flex:1" @click="$emit('save')" :disabled="saving">
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
								<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
								<polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
							</svg>
							{{ saving ? ' Saving…' : ' '+saveLabel }}
						</button>
						<button class="g-btn g-btn-ghost" @click="$emit('close')">Cancel</button>
					</div>
				</div>
			`,
		};

		// ── DRAWER: LEAD ──────────────────────────────────────────────────────
		var DrawerLeadComp = {
			name: 'DrawerLead',
			components: { Drawer:DrawerComp, LinkField:LinkFieldComp },
			props: { open:{type:Boolean,default:false} },
			emits: ['close','toast','refresh'],
			data: function() {
				return {
					saving:false, mountKey:0,
					form:{ full_name:'',company:'',phone:'',email:'',source:'',assigned_to:frappe.session.user,notes:'' },
				};
			},
			watch: {
				open: function(v) {
					if(v){ this.form={ full_name:'',company:'',phone:'',email:'',source:'',assigned_to:frappe.session.user,notes:'' }; this.mountKey++; }
				},
			},
			methods: {
				save: function() {
					var self = this;
					if(!self.form.full_name.trim()){ self.$emit('toast',{msg:'Full name is required',type:'error'}); return; }
					if(!self.form.source){           self.$emit('toast',{msg:'Please select a source',type:'error'}); return; }
					self.saving=true;
					frappe.call({ method:'frappe.client.insert', args:{ doc:{
						doctype:'CRM Lead', full_name:self.form.full_name.trim(), company:self.form.company.trim(),
						phone:self.form.phone.trim(), email:self.form.email.trim(), source:self.form.source, status:'Active',
						assigned_to:self.form.assigned_to||frappe.session.user,
						added_on:frappe.datetime.get_today(), notes:self.form.notes.trim(),
					}},
						callback:function(r){
							self.saving=false;
							if(r.message){ self.$emit('toast',{msg:'Lead "'+self.form.full_name+'" created!',type:'success'}); self.$emit('close'); self.$emit('refresh'); }
						},
						error:function(){ self.saving=false; self.$emit('toast',{msg:'Failed to save lead.',type:'error'}); },
					});
				},
			},
			template: `
				<Drawer draw-id="drawer-lead" :open="open" icon="👤" title="New Lead" save-label="Save Lead" :saving="saving" @close="$emit('close')" @save="save">
					<div class="ds-field"><label class="ds-label">Full Name <span class="ds-req">*</span></label>
						<input class="ds-input" v-model="form.full_name" placeholder="e.g. Khalid Al Rashidi" @keydown.enter="save"/>
					</div>
					<div class="ds-field"><label class="ds-label">Company</label>
						<input class="ds-input" v-model="form.company" placeholder="e.g. Deyaar Developments"/>
					</div>
					<div class="ds-row2">
						<div class="ds-field"><label class="ds-label">Phone</label>
							<input class="ds-input" v-model="form.phone" placeholder="+971 50 000 0000"/>
						</div>
						<div class="ds-field"><label class="ds-label">Email</label>
							<input class="ds-input" type="email" v-model="form.email" placeholder="email@company.ae"/>
						</div>
					</div>
					<div class="ds-field"><label class="ds-label">Source <span class="ds-req">*</span></label>
						<select class="ds-select" v-model="form.source">
							<option value="">Pick one…</option>
							<option v-for="s in ['Referral','Instagram','LinkedIn','Website','Walk-in','WhatsApp','Event','Other']" :key="s">{{ s }}</option>
						</select>
					</div>
					<div class="ds-field"><label class="ds-label">Assigned To</label>
						<LinkField :key="'lead-assigned-'+mountKey" doctype="User" label-field="full_name" placeholder="Search user…" :filters="[['enabled','=',1],['user_type','=','System User']]" v-model="form.assigned_to"/>
					</div>
					<div class="ds-field"><label class="ds-label">Notes</label>
						<textarea class="ds-textarea" v-model="form.notes" placeholder="Any context worth capturing?"></textarea>
					</div>
				</Drawer>
			`,
		};

		// ── DRAWER: ENQUIRY ───────────────────────────────────────────────────
		var DrawerEnquiryComp = {
			name: 'DrawerEnquiry',
			components: { Drawer:DrawerComp, LinkField:LinkFieldComp },
			props: { open:{type:Boolean,default:false} },
			emits: ['close','toast','refresh'],
			data: function() {
				return {
					saving:false, mountKey:0, valFocused:false,
					form:{ title:'',lead:'',stage:'New Lead',value:'',service_type:'',assigned_to:frappe.session.user,notes:'' },
				};
			},
			watch: {
				open: function(v) {
					if(v){ this.form={ title:'',lead:'',stage:'New Lead',value:'',service_type:'',assigned_to:frappe.session.user,notes:'' }; this.valFocused=false; this.mountKey++; }
				},
			},
			methods: {
				formatAED: function(val) {
					var n = parseFloat(String(val).replace(/[^0-9.]/g,''));
					if(isNaN(n)) return '';
					return 'AED '+n.toLocaleString('en-AE',{minimumFractionDigits:0,maximumFractionDigits:0});
				},
				displayVal: function() {
					if(this.valFocused) return String(this.form.value).replace(/[^0-9.]/g,'');
					return this.form.value ? this.formatAED(this.form.value) : '';
				},
				onValFocus: function() { this.valFocused=true; },
				onValBlur:  function() { this.valFocused=false; var raw=String(this.form.value).replace(/[^0-9.]/g,''); this.form.value=raw; },
				onValInput: function(e) { this.form.value=e.target.value.replace(/[^0-9.]/g,''); },
				save: function() {
					var self = this;
					if(!self.form.title.trim()){ self.$emit('toast',{msg:'Enquiry title is required',type:'error'}); return; }
					if(!self.form.value){        self.$emit('toast',{msg:'Value (AED) is required',type:'error'}); return; }
					self.saving=true;
					frappe.call({ method:'frappe.client.insert', args:{ doc:{
						doctype:'CRM Enquiry', title:self.form.title.trim(), lead:self.form.lead,
						stage:self.form.stage, value:parseFloat(String(self.form.value).replace(/[^0-9.]/g,''))||0,
						service_type:self.form.service_type,
						assigned_to:self.form.assigned_to||frappe.session.user, notes:self.form.notes.trim(),
						last_activity_date:frappe.datetime.get_today(), days_in_stage:0, stage_changed_on:frappe.datetime.get_today(),
					}},
						callback:function(r){
							self.saving=false;
							if(r.message){ self.$emit('toast',{msg:'Enquiry "'+self.form.title+'" created!',type:'success'}); self.$emit('close'); self.$emit('refresh'); }
						},
						error:function(){ self.saving=false; self.$emit('toast',{msg:'Failed to save enquiry.',type:'error'}); },
					});
				},
			},
			template: `
				<Drawer draw-id="drawer-enquiry" :open="open" icon="📋" title="New Enquiry" save-label="Save Enquiry" :saving="saving" @close="$emit('close')" @save="save">
					<div class="ds-field">
						<label class="ds-label">Enquiry Title <span class="ds-req">*</span></label>
						<input class="ds-input" v-model="form.title" placeholder="Client Name – Fitout Type" @keydown.enter="save"/>
						<div class="ds-hint">e.g. Emaar Development – Office Fitout</div>
					</div>
					<div class="ds-field"><label class="ds-label">Linked Lead</label>
						<LinkField :key="'enq-lead-'+mountKey" doctype="CRM Lead" label-field="full_name" placeholder="Search lead…" :filters="[['status','=','Active']]" v-model="form.lead"/>
					</div>
					<div class="ds-row2">
						<div class="ds-field"><label class="ds-label">Value (AED) <span class="ds-req">*</span></label>
							<input class="ds-input" inputmode="numeric" :value="displayVal()" placeholder="e.g. 75,000" @focus="onValFocus" @blur="onValBlur" @input="onValInput"/>
						</div>
						<div class="ds-field"><label class="ds-label">Stage</label>
							<select class="ds-select" v-model="form.stage">
								<option v-for="s in ['New Lead','Qualified','Proposal','Negotiation']" :key="s">{{ s }}</option>
							</select>
						</div>
					</div>
					<div class="ds-field"><label class="ds-label">Service Type</label>
						<select class="ds-select" v-model="form.service_type">
							<option value="">Select service…</option>
							<option v-for="s in ['Office Fitout','Retail Fitout','Hospitality Fitout','Villa & Residential Fitout','Commercial Fitout','Turnkey Fitout','Joinery & Millwork','Other']" :key="s">{{ s }}</option>
						</select>
					</div>
					<div class="ds-field"><label class="ds-label">Assigned To</label>
						<LinkField :key="'enq-assigned-'+mountKey" doctype="User" label-field="full_name" placeholder="Search user…" :filters="[['enabled','=',1],['user_type','=','System User']]" v-model="form.assigned_to"/>
					</div>
					<div class="ds-field"><label class="ds-label">Notes</label>
						<textarea class="ds-textarea" v-model="form.notes" placeholder="What do we know so far?"></textarea>
					</div>
				</Drawer>
			`,
		};

		// ── DRAWER: ACTIVITY ──────────────────────────────────────────────────
		var DrawerActivityComp = {
			name: 'DrawerActivity',
			components: { Drawer:DrawerComp, LinkField:LinkFieldComp },
			props: { open:{type:Boolean,default:false} },
			emits: ['close','toast','refresh'],
			data: function() {
				return {
					saving:false, mountKey:0,
					form:{ act_type:'Call', link_type:'Enquiry', enquiry:'', lead:'', date:frappe.datetime.get_today(), time:'', duration:'30', followup:'', notes:'' },
				};
			},
			watch: {
				open: function(v) {
					if(v){ this.form={ act_type:'Call', link_type:'Enquiry', enquiry:'', lead:'', date:frappe.datetime.get_today(), time:'', duration:'30', followup:'', notes:'' }; this.mountKey++; }
				},
			},
			methods: {
				setLinkType: function(lt) { this.form.link_type=lt; if(lt==='Enquiry') this.form.lead=''; else this.form.enquiry=''; },
				save: function() {
					var self = this;
					if(!self.form.act_type){ self.$emit('toast',{msg:'Activity type is required',type:'error'}); return; }
					if(!self.form.date){     self.$emit('toast',{msg:'Date is required',type:'error'}); return; }
					if(!self.form.notes.trim()){ self.$emit('toast',{msg:'Outcome / Notes are required',type:'error'}); return; }
					self.saving=true;
					frappe.call({ method:'frappe.client.insert', args:{ doc:{
						doctype:'CRM Activity',
						activity_type:self.form.act_type,
						enquiry:self.form.link_type==='Enquiry'?self.form.enquiry:'',
						lead:self.form.link_type==='Lead'?self.form.lead:'',
						logged_by:frappe.session.user,
						activity_date:self.form.date, activity_time:self.form.time,
						duration_minutes:self.form.duration, follow_up_action:self.form.followup,
						outcome_notes:self.form.notes.trim(),
					}},
						callback:function(r){
							self.saving=false;
							if(r.message){ self.$emit('toast',{msg:'Activity logged!',type:'success'}); self.$emit('close'); self.$emit('refresh'); }
						},
						error:function(){ self.saving=false; self.$emit('toast',{msg:'Failed to log activity.',type:'error'}); },
					});
				},
			},
			template: `
				<Drawer draw-id="drawer-activity" :open="open" icon="⏱" title="Log Activity" save-label="Log Activity" :saving="saving" @close="$emit('close')" @save="save">
					<div class="ds-field"><label class="ds-label">Activity Type <span class="ds-req">*</span></label>
						<div class="ds-toggle-row">
							<button :class="'ds-toggle-btn'+(form.act_type==='Call'?' active':'')" type="button" @click="form.act_type='Call'">
								<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.24h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.19 6.19l1.73-1.74a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
								Call
							</button>
							<button :class="'ds-toggle-btn'+(form.act_type==='Meeting'?' active':'')" type="button" @click="form.act_type='Meeting'">
								<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
								Meeting
							</button>
						</div>
					</div>
					<div class="ds-field"><label class="ds-label">Link to</label>
						<div class="ds-toggle-row" style="margin-bottom:8px">
							<button :class="'ds-toggle-btn'+(form.link_type==='Enquiry'?' active':'')" type="button" @click="setLinkType('Enquiry')">📋 Enquiry</button>
							<button :class="'ds-toggle-btn'+(form.link_type==='Lead'?' active':'')" type="button" @click="setLinkType('Lead')">👤 Lead</button>
						</div>
					</div>
					<div class="ds-field" v-if="form.link_type==='Enquiry'"><label class="ds-label">Enquiry</label>
						<LinkField :key="'act-enq-'+mountKey" doctype="CRM Enquiry" label-field="title" placeholder="Search enquiry…" :filters="[['stage','not in',['Won','Lost']]]" v-model="form.enquiry"/>
					</div>
					<div class="ds-field" v-else><label class="ds-label">Lead</label>
						<LinkField :key="'act-lead-'+mountKey" doctype="CRM Lead" label-field="full_name" placeholder="Search lead…" :filters="[['status','=','Active']]" v-model="form.lead"/>
					</div>
					<div class="ds-row2">
						<div class="ds-field"><label class="ds-label">Date <span class="ds-req">*</span></label>
							<input class="ds-input" type="date" v-model="form.date"/>
						</div>
						<div class="ds-field"><label class="ds-label">Time</label>
							<input class="ds-input" type="time" v-model="form.time"/>
						</div>
					</div>
					<div class="ds-field"><label class="ds-label">Duration</label>
						<select class="ds-select" v-model="form.duration">
							<option v-for="p in [['15','15 min'],['30','30 min'],['45','45 min'],['60','1 hr'],['90','1.5 hrs'],['120','2 hrs']]" :key="p[0]" :value="p[0]">{{ p[1] }}</option>
						</select>
					</div>
					<div class="ds-field"><label class="ds-label">Follow-up Action</label>
						<input class="ds-input" v-model="form.followup" placeholder="e.g. Send proposal, Schedule next call…"/>
					</div>
					<div class="ds-field"><label class="ds-label">Outcome / Notes <span class="ds-req">*</span></label>
						<textarea class="ds-textarea" v-model="form.notes" placeholder="What happened? What was agreed? Next steps?" style="min-height:100px"></textarea>
					</div>
				</Drawer>
			`,
		};

		// ── DRAWER: EDIT FOLLOW-UP ────────────────────────────────────────────
		var DrawerEditFollowupComp = {
    name: 'DrawerEditFollowup',
    components: { Drawer:DrawerComp },
    props: { open:{type:Boolean,default:false}, activity:{type:Object,default:null} },
    emits: ['close','toast','refresh'],
    data: function() {
        return { saving:false, form:{ subject:'', date:'', notes:'', is_completed:0 } };
    },
    watch: {
        open: function(v) {
            if(v && this.activity){
                this.form = {
                    subject:      stripHtml(this.activity.follow_up_action||''),
                    date:         this.activity.activity_date||frappe.datetime.get_today(),
                    notes:        stripHtml(this.activity.outcome_notes||''),
                    is_completed: this.activity.is_completed ? 1 : 0,
                };
            } else if(!v) {
                this.form = { subject:'', date:'', notes:'', is_completed:0 };
            }
        },
    },
    computed: {
        linkedLabel: function() {
            var act = this.activity||{};
            return act._resolvedLabel||act.enquiry||act.lead||'—';
        },
    },
    methods: {
        save: function() {
            var self = this;
            if(!self.form.subject.trim()){ self.$emit('toast',{msg:'Subject is required',type:'error'}); return; }
            if(!self.form.date){           self.$emit('toast',{msg:'Date is required',type:'error'}); return; }
            self.saving=true;
            frappe.call({
                method:'frappe.client.set_value',
                args:{ doctype:'CRM Activity', name:self.activity.name,
                    fieldname:{
                        follow_up_action: self.form.subject.trim(),
                        activity_date:    self.form.date,
                        outcome_notes:    self.form.notes.trim(),
                        is_completed:     self.form.is_completed,
                    }
                },
                callback:function(r){
                    self.saving=false;
                    if(r.message){
                        var msg = self.form.is_completed ? 'Follow-up marked as completed!' : 'Follow-up updated!';
                        self.$emit('toast',{msg:msg,type:'success'});
                        self.$emit('close');
                        self.$emit('refresh');
                    }
                },
                error:function(){ self.saving=false; self.$emit('toast',{msg:'Failed to update.',type:'error'}); },
            });
        },
    },
    template: `
        <Drawer draw-id="drawer-editfollowup" :open="open" icon="✏️" title="Edit Follow-up" save-label="Save Changes" :saving="saving" @close="$emit('close')" @save="save">
            <div class="ds-field"><label class="ds-label">Subject <span class="ds-req">*</span></label>
                <input class="ds-input" v-model="form.subject" placeholder="e.g. Send proposal"/>
            </div>
            <div class="ds-field"><label class="ds-label">Enquiry / Lead</label>
                <input class="ds-input" :value="linkedLabel" readonly style="background:var(--bg2);cursor:default;color:var(--muted)"/>
            </div>
            <div class="ds-field"><label class="ds-label">New Date <span class="ds-req">*</span></label>
                <input class="ds-input" type="date" v-model="form.date"/>
            </div>
            <div class="ds-field"><label class="ds-label">Notes</label>
                <textarea class="ds-textarea" v-model="form.notes" placeholder="What happened? What was agreed?" style="min-height:90px"></textarea>
            </div>
            <div class="ds-field">
                <label class="ds-completed-wrap">
                    <input type="checkbox" class="ds-completed-cb" :checked="form.is_completed===1" @change="form.is_completed=$event.target.checked?1:0"/>
                    <span class="ds-completed-box" :class="form.is_completed===1?'checked':''">
                        <svg v-if="form.is_completed===1" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </span>
                    <span class="ds-completed-label" :class="form.is_completed===1?'done':''">Completed (Follow Up)</span>
                </label>
                <div v-if="form.is_completed===1" class="ds-completed-hint">This follow-up will be removed from the Needs Chasing list.</div>
            </div>
        </Drawer>
    `,
};

		// ── ON DECK SECTION ───────────────────────────────────────────────────
		var OnDeckSectionComp = {
			name: 'OnDeckSection',
			props: { refreshAt:{type:Number,default:0} },
			emits: ['logActivity'],
			data: function() {
				return { activities:[], loading:true, labels:{} };
			},
			watch: {
				refreshAt: function() { this.load(); },
			},
			mounted: function() { this.load(); },
			methods: {
				load: function() {
					var self = this;
					self.loading = true;
					var today = frappe.datetime.get_today();
					var in14  = frappe.datetime.add_days(today,14);
					frappe.call({
						method:'frappe.client.get_list',
						args:{ doctype:'CRM Activity', filters:[['logged_by','=',frappe.session.user],['activity_date','>=',today],['activity_date','<=',in14]],
							fields:['name','activity_date','activity_type','follow_up_action','enquiry','lead','outcome_notes'], order_by:'activity_date asc', limit_page_length:0 },
						callback:function(r){
							var acts = r.message||[];
							self.activities = acts;
							self.loading = false;
							self.resolveLabels(acts);
						},
					});
				},
				resolveLabels: function(acts) {
					var self = this;
					var enquiryIds=[], leadIds=[];
					acts.forEach(function(a){
						if(a.enquiry && enquiryIds.indexOf(a.enquiry)===-1) enquiryIds.push(a.enquiry);
						if(a.lead    && leadIds.indexOf(a.lead)===-1)       leadIds.push(a.lead);
					});
					var resolved={}, pending=(enquiryIds.length>0?1:0)+(leadIds.length>0?1:0);
					if(pending===0){ self.labels={}; return; }
					function done(){ pending--; if(pending<=0) self.labels=Object.assign({},resolved); }
					if(enquiryIds.length){
						frappe.call({ method:'frappe.client.get_list', args:{ doctype:'CRM Enquiry', filters:[['name','in',enquiryIds]], fields:['name','title'], limit_page_length:0 },
							callback:function(r2){ (r2.message||[]).forEach(function(e){ resolved[e.name]=e.title; }); done(); } });
					}
					if(leadIds.length){
						frappe.call({ method:'frappe.client.get_list', args:{ doctype:'CRM Lead', filters:[['name','in',leadIds]], fields:['name','full_name','company'], limit_page_length:0 },
							callback:function(r2){ (r2.message||[]).forEach(function(e){ resolved[e.name]=e.full_name+(e.company?' · '+e.company:''); }); done(); } });
					}
				},
				getLabel: function(act) {
					return (act.enquiry?this.labels[act.enquiry]:null)||(act.lead?this.labels[act.lead]:null)||'';
				},
				fmtActDate: function(ds) {
					if(!ds) return { mon:'',day:'' };
					var d = new Date(ds);
					return { mon:MONTHS[d.getMonth()], day:d.getDate() };
				},
			},
			template: `
				<div class="ds-sec-card">
					<div class="ds-sec-hdr">
						<span class="ds-sec-ttl">On Deck</span>
						<div class="ds-sec-rule"></div>
						<span class="ds-sec-badge ds-sec-badge-blue">{{ activities.length }}</span>
						<button class="g-btn g-btn-ghost" style="padding:4px 10px;font-size:11.5px;margin-left:4px" @click="$emit('logActivity')">+ Log</button>
					</div>
					<div v-if="loading" class="ds-empty">Loading…</div>
					<div v-else-if="!activities.length" class="ds-empty">No upcoming activities in the next 14 days.</div>
					<div v-for="act in activities" :key="act.name" class="ds-act-row">
						<div class="ds-act-date">
							<span class="ds-act-date-mon">{{ fmtActDate(act.activity_date).mon }}</span>
							<span class="ds-act-date-day">{{ fmtActDate(act.activity_date).day }}</span>
						</div>
						<div class="ds-act-dot"></div>
						<div class="ds-act-body">
							<div class="ds-act-title">{{ act.follow_up_action||act.activity_type||'Activity' }}</div>
							<div v-if="getLabel(act)" class="ds-act-sub">{{ getLabel(act) }}</div>
						</div>
						<span :class="'ds-act-type-pill ds-act-type-'+((act.activity_type||'').toLowerCase()==='meeting'?'meeting':'call')">{{ act.activity_type||'Call' }}</span>
					</div>
				</div>
			`,
		};

		var NeedsChasingSectionComp = {
    name: 'NeedsChasingSection',
    props: { refreshAt:{type:Number,default:0} },
    emits: ['edit'],
    data: function() {
        return { activities:[], loading:true, labels:{} };
    },
    watch: {
        refreshAt: function() { this.load(); },
    },
    mounted: function() { this.load(); },
    methods: {
        load: function() {
            var self = this;
            self.loading = true;
            var today = frappe.datetime.get_today();
            frappe.call({
                method:'frappe.client.get_list',
                args:{ doctype:'CRM Activity',
                    filters:[
                        ['logged_by','=',frappe.session.user],
                        ['activity_date','<',today],
                        ['follow_up_action','!=',''],
                        ['follow_up_action','is','set'],
                        ['is_completed','!=',1],
                    ],
                    fields:['name','activity_date','follow_up_action','enquiry','lead','outcome_notes','is_completed'],
                    order_by:'activity_date asc', limit_page_length:0 },
                callback:function(r){
                    var acts = r.message||[];
                    self.activities = acts;
                    self.loading = false;
                    self.resolveLabels(acts);
                },
            });
        },
        resolveLabels: function(acts) {
            var self = this;
            var enquiryIds=[], leadIds=[];
            acts.forEach(function(a){
                if(a.enquiry && enquiryIds.indexOf(a.enquiry)===-1) enquiryIds.push(a.enquiry);
                if(a.lead    && leadIds.indexOf(a.lead)===-1)       leadIds.push(a.lead);
            });
            var resolved={}, pending=(enquiryIds.length>0?1:0)+(leadIds.length>0?1:0);
            if(pending===0){ self.labels={}; return; }
            function done(){ pending--; if(pending<=0) self.labels=Object.assign({},resolved); }
            if(enquiryIds.length){
                frappe.call({ method:'frappe.client.get_list', args:{ doctype:'CRM Enquiry', filters:[['name','in',enquiryIds]], fields:['name','title'], limit_page_length:0 },
                    callback:function(r2){ (r2.message||[]).forEach(function(e){ resolved[e.name]=e.title; }); done(); } });
            }
            if(leadIds.length){
                frappe.call({ method:'frappe.client.get_list', args:{ doctype:'CRM Lead', filters:[['name','in',leadIds]], fields:['name','full_name','company'], limit_page_length:0 },
                    callback:function(r2){ (r2.message||[]).forEach(function(e){ resolved[e.name]=e.full_name+(e.company?' · '+e.company:''); }); done(); } });
            }
        },
        getLabel: function(act) {
            return (act.enquiry?this.labels[act.enquiry]:null)||(act.lead?this.labels[act.lead]:null)||'';
        },
        daysDiff: function(ds) {
            var today=new Date(); today.setHours(0,0,0,0);
            var then=new Date(ds); then.setHours(0,0,0,0);
            return Math.round((today-then)/86400000);
        },
        onEdit: function(act) {
            var sub = this.getLabel(act);
            this.$emit('edit', Object.assign({},act,{_resolvedLabel:sub}));
        },
    },
    template: `
        <div class="ds-sec-card">
            <div class="ds-sec-hdr">
                <span class="ds-sec-ttl ds-sec-ttl-amb">Needs Chasing</span>
                <div class="ds-sec-rule"></div>
                <span class="ds-sec-badge ds-sec-badge-amb">{{ activities.length }}</span>
            </div>
            <div v-if="loading" class="ds-empty">Loading…</div>
            <div v-else-if="!activities.length" class="ds-empty">✓ Nothing overdue.</div>
            <div v-for="act in activities" :key="act.name" class="ds-chase-row">
                <div class="ds-chase-days">
                    <span class="ds-chase-days-num">{{ daysDiff(act.activity_date) }}</span>
                    <span class="ds-chase-days-lbl">days</span>
                </div>
                <div class="ds-chase-body">
                    <div class="ds-chase-title">{{ act.follow_up_action }}</div>
                    <div v-if="getLabel(act)" class="ds-chase-sub">{{ getLabel(act) }}</div>
                </div>
                <button class="ds-chase-edit" title="Edit follow-up" @click="onEdit(act)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                </button>
            </div>
        </div>
    `,
};

		// ── ENQUIRY DETAIL PANEL ──────────────────────────────────────────────
		var EnquiryDetailPanelComp = {
			name: 'EnquiryDetailPanel',
			props: { open:{type:Boolean,default:false}, enquiry:{type:Object,default:null} },
			emits: ['close','toast','refresh'],
			data: function() {
				return { tab:'overview', activs:[], actLoad:false, moving:false };
			},
			watch: {
				open: function(v) { if(!v) this.tab='overview'; },
				tab:  function(v) { if(v==='activity' && this.open && this.enquiry) this.loadActivities(); },
			},
			computed: {
				enq: function() { return this.enquiry||{}; },
				progressStages: function() { return STAGES.filter(function(s){ return s!=='Lost'; }); },
				curIdx: function() { return this.progressStages.indexOf(this.enq.stage); },
				nextStage: function() { return STAGES[STAGES.indexOf(this.enq.stage)+1]; },
				canMove: function() { return this.nextStage && this.nextStage!=='Lost' && this.enq.stage!=='Won' && this.enq.stage!=='Lost'; },
			},
			methods: {
				loadActivities: function() {
					var self = this;
					self.actLoad = true;
					frappe.call({
						method:'frappe.client.get_list',
						args:{ doctype:'CRM Activity', filters:[['enquiry','=',self.enq.name]], fields:['name','activity_type','activity_date','follow_up_action','outcome_notes','logged_by'], order_by:'activity_date desc', limit_page_length:6 },
						callback:function(r){ self.activs=r.message||[]; self.actLoad=false; },
					});
				},
				moveToNextStage: function() {
					var self = this;
					if(!self.canMove){ self.$emit('toast',{msg:'Already at final stage',type:'error'}); return; }
					self.moving=true;
					frappe.call({
						method:'frappe.client.set_value',
						args:{ doctype:'CRM Enquiry', name:self.enq.name, fieldname:{ stage:self.nextStage, stage_changed_on:frappe.datetime.get_today(), days_in_stage:0 } },
						callback:function(r){
							self.moving=false;
							if(r.message){ self.$emit('toast',{msg:'Moved to '+self.nextStage+'!',type:'success'}); self.$emit('close'); self.$emit('refresh'); }
						},
						error:function(){ self.moving=false; self.$emit('toast',{msg:'Failed to update stage.',type:'error'}); },
					});
				},
				stageColor: function(s) {
					var map = { 'New Lead':'var(--muted)', 'Qualified':'var(--blue)', 'Proposal':'var(--lav)', 'Negotiation':'var(--amb)', 'Won':'var(--grn)' };
					return map[s]||'var(--lav)';
				},
				isFilled: function(i) { return i<=this.curIdx; },
				isCurrent: function(i) { return i===this.curIdx; },
				fmtVal: fmtVal,
				fmtDate: fmtDate,
				stripHtml: stripHtml,
				stageClass: stageClass,
			},
			template: `
				<div :class="'ds-enq-panel'+(open?' open':'')">
					<div class="ds-enq-panel-hdr">
						<div class="ds-enq-panel-top">
							<div style="flex:1;min-width:0">
								<div class="ds-enq-panel-title">{{ enq.title||'—' }}</div>
								<div class="ds-enq-panel-meta">
									<span :class="'ds-enq-stage-badge '+stageClass(enq.stage)">{{ enq.stage||'—' }}</span>
									<span class="ds-enq-panel-val">{{ fmtVal(enq.value) }}</span>
									<span class="ds-enq-panel-who">Assigned: {{ enq._assignedName||enq.assigned_to||'—' }}</span>
								</div>
							</div>
							<button class="ds-drawer-close" @click="$emit('close')">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
							</button>
						</div>
						<div class="ds-enq-sbar">
							<div v-for="(s,i) in progressStages" :key="s" class="ds-enq-seg">
								<div class="ds-enq-seg-line" :style="{ background: isFilled(i) ? stageColor(s) : 'var(--hair)' }"></div>
								<span class="ds-enq-seg-lbl" :style="{ color: isCurrent(i) ? stageColor(s) : (isFilled(i) ? stageColor(s) : 'var(--faint)'), fontWeight: isCurrent(i)?'700':'500' }">{{ s }}</span>
							</div>
						</div>
					</div>
					<div class="ds-enq-tabs">
						<div :class="'ds-enq-tab'+(tab==='overview'?' active':'')" @click="tab='overview'">Overview</div>
						<div :class="'ds-enq-tab'+(tab==='activity'?' active':'')" @click="tab='activity'">Activity</div>
					</div>
					<div class="ds-enq-body">
						<!-- Overview -->
						<template v-if="tab==='overview'">
							<div class="ds-ov-grid">
								<div><div class="ds-ov-lbl">Stage</div><div class="ds-ov-val">{{ enq.stage||'—' }}</div></div>
								<div><div class="ds-ov-lbl">Value</div><div class="ds-ov-val" style="color:var(--blue)">{{ fmtVal(enq.value) }}</div></div>
								<div><div class="ds-ov-lbl">Days in Stage</div><div class="ds-ov-val">{{ enq.days_in_stage!=null ? enq.days_in_stage+'d' : '—' }}</div></div>
								<div><div class="ds-ov-lbl">Last Activity</div><div class="ds-ov-val">{{ fmtDate(enq.last_activity_date) }}</div></div>
							</div>
							<div class="ds-ov-notes-lbl">Notes</div>
							<div class="ds-ov-notes-box">
								<span v-if="!stripHtml(enq.notes)" style="color:var(--faint)">No notes added.</span>
								<template v-else>{{ stripHtml(enq.notes) }}</template>
							</div>
							<div v-if="canMove" class="ds-ov-actions">
								<button class="g-btn g-btn-primary" style="flex:1" :disabled="moving" @click="moveToNextStage">{{ moving ? 'Moving…' : 'Move to next stage → '+nextStage }}</button>
							</div>
							<div v-else-if="enq.stage==='Won'" style="text-align:center;padding:10px 0;font-size:12px;color:var(--grn);font-weight:600">✓ Deal Won</div>
						</template>
						<!-- Activity -->
						<template v-else>
							<div v-if="actLoad" class="ds-act-log-empty">Loading…</div>
							<div v-else-if="!activs.length" class="ds-act-log-empty">No activities logged yet.</div>
							<div v-for="a in activs" :key="a.name" class="ds-act-log-item">
								<div class="ds-act-log-top">
									<span class="ds-act-log-type">{{ a.activity_type||'Activity' }}</span>
									<span class="ds-act-log-date">{{ fmtDate(a.activity_date) }}</span>
								</div>
								<div v-if="a.follow_up_action" class="ds-act-log-followup">↪ {{ stripHtml(a.follow_up_action) }}</div>
								<div v-if="a.outcome_notes" class="ds-act-log-notes">{{ stripHtml(a.outcome_notes) }}</div>
							</div>
						</template>
					</div>
				</div>
			`,
		};
  
    var MyBriefBoardComp = {
    name: 'MyBriefBoard',
    components: { EnquiryDetailPanel:EnquiryDetailPanelComp },
    props: { refreshAt:{type:Number,default:0} },
    emits: ['toast','refresh'],
    data: function() {
        return {
            enquiries:[], loading:true, userNames:{},
            selEnq:null, panelOpen:false,
            viewMode: 'brief',
            kanbanEnquiries:[], kanbanLoading:false,
            draggedEnq: null,
            dragOverStage: null,
            movingEnq: null,
        };
    },
    watch: {
        refreshAt: function() {
            this.load();
            if(this.viewMode === 'kanban') this.loadKanban();
        },
    },
    mounted: function() { this.load(); },
    methods: {
        goFullView: function() { frappe.set_route('crm-enquiry'); },
        switchView: function(mode) {
            this.viewMode = mode;
            if(mode === 'kanban' && !this.kanbanEnquiries.length) this.loadKanban();
        },
        load: function() {
            var self = this;
            self.loading = true;
            frappe.call({
                method:'frappe.client.get_list',
                args:{ doctype:'CRM Enquiry', filters:[['assigned_to','=',frappe.session.user]],
                    fields:['name','title','stage','value','days_in_stage','assigned_to','last_activity_date','stage_changed_on','notes'],
                    order_by:'days_in_stage desc', limit_page_length:0 },
                callback:function(r){
                    var rows = r.message||[];
                    self.enquiries = rows;
                    self.loading = false;
                    self.resolveUserNames(rows);
                },
            });
        },
        loadKanban: function() {
            var self = this;
            self.kanbanLoading = true;
            frappe.call({
                method:'frappe.client.get_list',
                args:{ doctype:'CRM Enquiry',
                    filters:[['assigned_to','=',frappe.session.user]],
                    fields:['name','title','stage','value','days_in_stage','assigned_to','last_activity_date','notes'],
                    order_by:'days_in_stage desc', limit_page_length:0 },
                callback:function(r){
                    var rows = r.message||[];
                    self.kanbanEnquiries = rows;
                    self.kanbanLoading = false;
                    self.resolveUserNames(rows);
                },
            });
        },
        resolveUserNames: function(rows) {
            var self = this;
            var uids=[];
            rows.forEach(function(e){ if(e.assigned_to && uids.indexOf(e.assigned_to)===-1) uids.push(e.assigned_to); });
            if(uids.length){
                frappe.call({ method:'frappe.client.get_list', args:{ doctype:'User', filters:[['name','in',uids]], fields:['name','full_name'], limit_page_length:0 },
                    callback:function(r2){
                        var map = Object.assign({}, self.userNames);
                        (r2.message||[]).forEach(function(u){ map[u.name]=u.full_name.split(' ')[0]; });
                        self.userNames = map;
                    },
                });
            }
        },
        // Brief board helpers
        getTopCard: function(stage) {
            var matching = this.enquiries.filter(function(e){ return e.stage===stage; });
            return matching.length ? matching[0] : null;
        },
        countForStage: function(stage) {
            return this.enquiries.filter(function(e){ return e.stage===stage; }).length;
        },
        // Kanban helpers
        kanbanCardsForStage: function(stage) {
            return this.kanbanEnquiries.filter(function(e){ return e.stage===stage; });
        },
        kanbanCountForStage: function(stage) {
            return this.kanbanEnquiries.filter(function(e){ return e.stage===stage; }).length;
        },
        openPanel: function(enq) {
            if(this.draggedEnq) return; // don't open panel if we were dragging
            this.selEnq = Object.assign({},enq,{_assignedName:this.userNames[enq.assigned_to]||enq.assigned_to});
            this.panelOpen = true;
        },

        // ── DRAG & DROP ──────────────────────────────────────────────────
        onDragStart: function(enq, event) {
            this.draggedEnq = enq;
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', enq.name);
            // style the ghost
            event.target.style.opacity = '0.45';
        },
        onDragEnd: function(event) {
            event.target.style.opacity = '1';
            this.dragOverStage = null;
            // draggedEnq cleared after drop or here if dropped outside
            setTimeout(function() {}, 50);
        },
        onDragOver: function(stage, event) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            this.dragOverStage = stage;
        },
        onDragLeave: function(event) {
            // only clear if leaving the column entirely
            if(!event.currentTarget.contains(event.relatedTarget)) {
                this.dragOverStage = null;
            }
        },
        onDrop: function(stage, event) {
            event.preventDefault();
            var self = this;
            var enq  = self.draggedEnq;
            self.dragOverStage = null;
            self.draggedEnq    = null;

            if(!enq || enq.stage === stage) return; // dropped on same stage

            self.movingEnq = enq.name;

            // Optimistic UI — update locally immediately
            var idx = self.kanbanEnquiries.findIndex(function(e){ return e.name === enq.name; });
            if(idx !== -1) {
                self.kanbanEnquiries[idx] = Object.assign({}, self.kanbanEnquiries[idx], {
                    stage: stage,
                    days_in_stage: 0,
                    stage_changed_on: frappe.datetime.get_today(),
                });
                // force Vue reactivity
                self.kanbanEnquiries = self.kanbanEnquiries.slice();
            }

            // Persist to server
            frappe.call({
                method: 'frappe.client.set_value',
                args: {
                    doctype: 'CRM Enquiry',
                    name: enq.name,
                    fieldname: {
                        stage: stage,
                        stage_changed_on: frappe.datetime.get_today(),
                        days_in_stage: 0,
                    },
                },
                callback: function(r) {
                    self.movingEnq = null;
                    if(r.message) {
                        self.$emit('toast', { msg: '"' + enq.title + '" moved to ' + stage, type:'success' });
                        self.$emit('refresh');
                    }
                },
                error: function() {
                    self.movingEnq = null;
                    // Revert optimistic update
                    if(idx !== -1) {
                        self.kanbanEnquiries[idx] = Object.assign({}, self.kanbanEnquiries[idx], { stage: enq.stage });
                        self.kanbanEnquiries = self.kanbanEnquiries.slice();
                    }
                    self.$emit('toast', { msg:'Failed to move enquiry.', type:'error' });
                },
            });
        },

        fmtVal: fmtVal,
        daysDotColor: daysDotColor,
        stageClass: stageClass,
    },
    template: `
        <div>
            <div class="ds-board-wrap">
                <div class="ds-sec-hdr" style="margin-bottom:14px">
                    <span class="ds-sec-ttl">My Brief Board</span>
                    <div class="ds-sec-rule"></div>
                    <div class="ds-view-toggle">
                        <button :class="'ds-view-btn'+(viewMode==='brief'?' active':'')" @click="switchView('brief')" title="Brief view">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                            Brief
                        </button>
                        <button :class="'ds-view-btn'+(viewMode==='kanban'?' active':'')" @click="switchView('kanban')" title="Kanban view">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="5" height="15" rx="1"/></svg>
                            Kanban
                        </button>
                    </div>
                    <button class="g-btn g-btn-ghost" style="padding:4px 10px;font-size:11.5px" @click="goFullView">Full view</button>
                </div>

                <div v-if="loading && viewMode==='brief'" class="ds-empty">Loading…</div>
                <div v-else-if="kanbanLoading && viewMode==='kanban'" class="ds-empty">Loading…</div>

                <!-- ── BRIEF VIEW ── -->
                <div v-else-if="viewMode==='brief'" class="ds-board-scroll">
                    <div class="ds-kb-board">
                        <div v-for="stage in ['New Lead','Qualified','Proposal','Negotiation','Won','Lost']" :key="stage" class="ds-kb-col">
                            <div :class="'ds-kb-col-hdr '+stageClass(stage)">
                                <span class="ds-kb-col-name">{{ stage }}</span>
                                <span class="ds-kb-col-cnt">{{ countForStage(stage) }}</span>
                            </div>
                            <div v-if="getTopCard(stage)" class="ds-kb-card" @click="openPanel(getTopCard(stage))">
                                <div class="ds-kb-card-title">{{ getTopCard(stage).title }}</div>
                                <div class="ds-kb-card-who">{{ userNames[getTopCard(stage).assigned_to]||getTopCard(stage).assigned_to||'—' }}</div>
                                <div class="ds-kb-card-foot">
                                    <span class="ds-kb-card-val">{{ fmtVal(getTopCard(stage).value) }}</span>
                                    <span class="ds-kb-card-days">
                                        <span class="ds-kb-days-dot" :style="{ background: daysDotColor(getTopCard(stage).days_in_stage) }"></span>
                                        {{ getTopCard(stage).days_in_stage!=null ? getTopCard(stage).days_in_stage+'d' : '—' }}
                                    </span>
                                </div>
                            </div>
                            <div v-else class="ds-kb-card-empty">Empty</div>
                        </div>
                    </div>
                </div>

                <!-- ── KANBAN VIEW ── -->
                <div v-else class="ds-kanban-scroll">
                    <div class="ds-kanban-board">
                        <div
                            v-for="stage in ['New Lead','Qualified','Proposal','Negotiation','Won','Lost']"
                            :key="stage"
                            :class="[
                                'ds-kanban-col',
                                dragOverStage===stage ? 'ds-kanban-col-over' : '',
                            ]"
                            @dragover="onDragOver(stage, $event)"
                            @dragleave="onDragLeave($event)"
                            @drop="onDrop(stage, $event)"
                        >
                            <div :class="'ds-kb-col-hdr '+stageClass(stage)" style="margin-bottom:8px">
                                <span class="ds-kb-col-name">{{ stage }}</span>
                                <span class="ds-kb-col-cnt">{{ kanbanCountForStage(stage) }}</span>
                            </div>

                            <!-- Drop hint shown when dragging over an empty column -->
                            <div
                                v-if="dragOverStage===stage && !kanbanCardsForStage(stage).length"
                                class="ds-kanban-drop-hint"
                            >Drop here</div>

                            <div v-if="!kanbanCardsForStage(stage).length && dragOverStage!==stage" class="ds-kb-card-empty">Empty</div>

                            <div
                                v-for="enq in kanbanCardsForStage(stage)"
                                :key="enq.name"
                                :class="[
                                    'ds-kb-card',
                                    'ds-kanban-card',
                                    movingEnq===enq.name ? 'ds-kanban-card-moving' : '',
                                    draggedEnq && draggedEnq.name===enq.name ? 'ds-kanban-card-dragging' : '',
                                ]"
                                draggable="true"
                                @dragstart="onDragStart(enq, $event)"
                                @dragend="onDragEnd($event)"
                                @click="openPanel(enq)"
                                style="margin-bottom:8px"
                            >
                                <!-- Drag handle -->
                                <div class="ds-kanban-drag-handle" title="Drag to move">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                                        <circle cx="9"  cy="5"  r="1" fill="currentColor"/>
                                        <circle cx="15" cy="5"  r="1" fill="currentColor"/>
                                        <circle cx="9"  cy="12" r="1" fill="currentColor"/>
                                        <circle cx="15" cy="12" r="1" fill="currentColor"/>
                                        <circle cx="9"  cy="19" r="1" fill="currentColor"/>
                                        <circle cx="15" cy="19" r="1" fill="currentColor"/>
                                    </svg>
                                </div>

                                <div class="ds-kb-card-title">{{ enq.title }}</div>
                                <div class="ds-kb-card-who">{{ userNames[enq.assigned_to]||enq.assigned_to||'—' }}</div>
                                <div class="ds-kb-card-foot">
                                    <span class="ds-kb-card-val">{{ fmtVal(enq.value) }}</span>
                                    <span class="ds-kb-card-days">
                                        <span class="ds-kb-days-dot" :style="{ background: daysDotColor(enq.days_in_stage) }"></span>
                                        {{ enq.days_in_stage!=null ? enq.days_in_stage+'d' : '—' }}
                                    </span>
                                </div>

                                <!-- Saving spinner -->
                                <div v-if="movingEnq===enq.name" class="ds-kanban-saving">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="ds-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                                    Moving…
                                </div>
                            </div>

                            <!-- Drop zone indicator at bottom of column -->
                            <div
                                v-if="dragOverStage===stage && kanbanCardsForStage(stage).length"
                                class="ds-kanban-drop-hint"
                            >Drop here</div>
                        </div>
                    </div>
                </div>
            </div>

            <div :class="'ds-overlay'+(panelOpen?' visible':'')" @click="panelOpen=false"></div>
            <EnquiryDetailPanel
                :open="panelOpen"
                :enquiry="selEnq"
                @close="panelOpen=false"
                @toast="e => $emit('toast',e)"
                @refresh="() => { $emit('refresh'); panelOpen=false; }"
            />
        </div>
    `,
};


		// ── EVENT DETAIL PANEL ────────────────────────────────────────────────
		var EventDetailPanelComp = {
			name: 'EventDetailPanel',
			components: { LinkField:LinkFieldComp },
			props: { open:{type:Boolean,default:false}, event:{type:Object,default:null} },
			emits: ['close','toast','refresh'],
			data: function() {
				return { tab:'overview', saving:false, mountKey:0, form:null };
			},
			watch: {
				open: function(v) {
					if(v && this.event && this.event.name){
						this.tab = 'overview';
						this.form = {
							event_category: this.event.event_category||'Event',
							title:          this.event.title||'',
							event_date:     this.event.event_date||'',
							event_time:     this.event.event_time ? this.event.event_time.substring(0,5) : '',
							location:       this.event.location||'',
							notes:          stripHtml(this.event.notes||''),
							assigned_to:    this.event.assigned_to||'',
							link_type:      this.event.enquiry?'Enquiry':'Lead',
							enquiry:        this.event.enquiry||'',
							lead:           this.event.lead||'',
						};
						this.mountKey++;
					}
				},
			},
			computed: {
				evt: function() { return this.event||{}; },
				catStyle: function() { return evtCatStyle(this.evt.event_category); },
			},
			methods: {
				saveEdit: function() {
					var self = this;
					if(!self.form||!self.form.title.trim()){ self.$emit('toast',{msg:'Title is required',type:'error'}); return; }
					if(!self.form.event_date){ self.$emit('toast',{msg:'Date is required',type:'error'}); return; }
					self.saving=true;
					frappe.call({
						method:'frappe.client.set_value',
						args:{ doctype:'CRM Event', name:self.evt.name, fieldname:{
							event_category:self.form.event_category, title:self.form.title.trim(),
							event_date:self.form.event_date, event_time:self.form.event_time||'',
							location:self.form.location.trim(), notes:self.form.notes.trim(),
							assigned_to:self.form.assigned_to,
							enquiry:self.form.link_type==='Enquiry'?self.form.enquiry:'',
							lead:self.form.link_type==='Lead'?self.form.lead:'',
						}},
						callback:function(r){
							self.saving=false;
							if(r.message){ self.$emit('toast',{msg:'Event updated!',type:'success'}); self.$emit('close'); self.$emit('refresh'); }
						},
						error:function(){ self.saving=false; self.$emit('toast',{msg:'Failed to update.',type:'error'}); },
					});
				},
				fmtDate: fmtDate,
				fmtEventDate: fmtEventDate,
				evtCatStyle: evtCatStyle,
				stripHtml: stripHtml,
			},
			template: `
				<div :class="'ds-evt-panel'+(open?' open':'')">
					<div class="ds-evt-panel-hdr">
						<div class="ds-evt-panel-top">
							<div style="flex:1;min-width:0">
								<div class="ds-evt-panel-title">{{ evt.title||'—' }}</div>
								<div class="ds-evt-panel-meta">
									<span class="ds-net-card-cat" :style="{ background:catStyle.bg, color:catStyle.color }">{{ evt.event_category||'—' }}</span>
									<span style="font-size:11.5px;color:var(--muted)">{{ fmtEventDate(evt.event_date,evt.event_time) }}</span>
									<span v-if="evt.location" style="font-size:11px;color:var(--faint)">📍 {{ evt.location }}</span>
								</div>
							</div>
							<button class="ds-drawer-close" @click="$emit('close')">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
							</button>
						</div>
					</div>
					<div class="ds-evt-tabs">
						<div :class="'ds-evt-tab'+(tab==='overview'?' active':'')" @click="tab='overview'">Overview</div>
						<div :class="'ds-evt-tab'+(tab==='edit'?' active':'')" @click="tab='edit'">Edit Event</div>
					</div>
					<div class="ds-evt-body">
						<!-- Overview -->
						<template v-if="tab==='overview'">
							<div class="ds-evt-ov-grid">
								<div><div class="ds-ov-lbl">Date</div><div class="ds-ov-val">{{ fmtDate(evt.event_date) }}</div></div>
								<div><div class="ds-ov-lbl">Time</div><div class="ds-ov-val">{{ evt.event_time ? evt.event_time.substring(0,5) : '—' }}</div></div>
								<div><div class="ds-ov-lbl">Category</div><div class="ds-ov-val">{{ evt.event_category||'—' }}</div></div>
								<div><div class="ds-ov-lbl">Location</div><div class="ds-ov-val" style="font-size:12px">{{ evt.location||'—' }}</div></div>
								<div style="grid-column:span 2"><div class="ds-ov-lbl">Assigned To</div><div class="ds-ov-val" style="font-size:12px">{{ evt._assignedName||evt.assigned_to||'—' }}</div></div>
							</div>
							<div class="ds-ov-notes-lbl">Notes</div>
							<div class="ds-ov-notes-box">
								<span v-if="!stripHtml(evt.notes)" style="color:var(--faint)">No notes added.</span>
								<template v-else>{{ stripHtml(evt.notes) }}</template>
							</div>
						</template>
						<!-- Edit -->
						<template v-else>
							<div v-if="!form" class="ds-act-log-empty">Loading…</div>
							<template v-else>
								<div class="ds-field"><label class="ds-label">Event Type</label>
									<div class="ds-toggle-row">
										<button v-for="c in ['Event','Meeting','Call']" :key="c" :class="'ds-toggle-btn'+(form.event_category===c?' active':'')" type="button" @click="form.event_category=c">
											{{ {Event:'📅',Meeting:'🤝',Call:'📞'}[c] }} {{ c }}
										</button>
									</div>
								</div>
								<div class="ds-field"><label class="ds-label">Title <span class="ds-req">*</span></label>
									<input class="ds-input" v-model="form.title"/>
								</div>
								<div class="ds-row2">
									<div class="ds-field"><label class="ds-label">Date <span class="ds-req">*</span></label>
										<input class="ds-input" type="date" v-model="form.event_date"/>
									</div>
									<div class="ds-field"><label class="ds-label">Time</label>
										<input class="ds-input" type="time" v-model="form.event_time"/>
									</div>
								</div>
								<div class="ds-field"><label class="ds-label">Assigned To</label>
									<input class="ds-input" :value="evt._assignedName||evt.assigned_to||'—'" readonly style="background:var(--bg2);cursor:default;color:var(--muted)"/>
								</div>
								<div class="ds-field"><label class="ds-label">Location</label>
									<input class="ds-input" v-model="form.location" placeholder="e.g. DIFC Gate Village"/>
								</div>
								<div class="ds-field"><label class="ds-label">Notes</label>
									<textarea class="ds-textarea" v-model="form.notes" placeholder="Event details, attendees, agenda…" style="min-height:80px"></textarea>
								</div>
								<button class="g-btn g-btn-primary" style="width:100%" :disabled="saving" @click="saveEdit">{{ saving?'Saving…':'Save Changes' }}</button>
							</template>
						</template>
					</div>
				</div>
			`,
		};

		// ── NETWORKING EVENTS SECTION ─────────────────────────────────────────
		var NetworkingEventsSectionComp = {
			name: 'NetworkingEventsSection',
			components: { Drawer:DrawerComp, LinkField:LinkFieldComp, EventDetailPanel:EventDetailPanelComp },
			props: { refreshAt:{type:Number,default:0} },
			emits: ['toast','refresh'],
			data: function() {
				return {
					events:[], loading:true, selEvt:null, panelOpen:false,
					drawerOpen:false, saving:false, mountKey:0,
					form:{ event_category:'Event', link_type:'Enquiry', enquiry:'', lead:'', title:'', event_date:'', event_time:'', assigned_to:frappe.session.user, location:'', notes:'' },
				};
			},
			watch: {
				refreshAt: function() { this.load(); },
				drawerOpen: function(v) {
					if(v){
						this.form={ event_category:'Event', link_type:'Enquiry', enquiry:'', lead:'', title:'', event_date:frappe.datetime.get_today(), event_time:'', assigned_to:frappe.session.user, location:'', notes:'' };
						this.mountKey++;
					}
				},
			},
			mounted: function() { this.load(); },
			methods: {
				goCalendar: function() { frappe.set_route('ds-event'); },
				load: function() {
					var self = this;
					self.loading = true;
					var today = frappe.datetime.get_today();
					frappe.call({
						method:'frappe.client.get_list',
						args:{ doctype:'CRM Event', filters:[['event_date','>=',today]],
							fields:['name','title','event_category','event_date','event_time','location','enquiry','lead','assigned_to','notes'],
							order_by:'event_date asc, event_time asc', limit_page_length:5 },
						callback:function(r){
							var rows = r.message||[];
							var uids=[];
							rows.forEach(function(e){ if(e.assigned_to && uids.indexOf(e.assigned_to)===-1) uids.push(e.assigned_to); });
							if(uids.length){
								frappe.call({ method:'frappe.client.get_list', args:{ doctype:'User', filters:[['name','in',uids]], fields:['name','full_name'], limit_page_length:50 },
									callback:function(r2){
										var map={};
										(r2.message||[]).forEach(function(u){ map[u.name]=u.full_name; });
										self.events = rows.map(function(e){ return Object.assign({},e,{_assignedName:map[e.assigned_to]||e.assigned_to}); });
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
				setLinkType: function(lt) { this.form.link_type=lt; if(lt==='Enquiry') this.form.lead=''; else this.form.enquiry=''; },
				saveEvent: function() {
					var self = this;
					if(!self.form.title.trim()){ self.$emit('toast',{msg:'Title is required',type:'error'}); return; }
					if(!self.form.event_date){   self.$emit('toast',{msg:'Date is required',type:'error'}); return; }
					self.saving=true;
					frappe.call({ method:'frappe.client.insert', args:{ doc:{
						doctype:'CRM Event', event_category:self.form.event_category, title:self.form.title.trim(),
						event_date:self.form.event_date, event_time:self.form.event_time||'',
						location:self.form.location.trim(), notes:self.form.notes.trim(),
						assigned_to:self.form.assigned_to||frappe.session.user,
						enquiry:self.form.link_type==='Enquiry'?self.form.enquiry:'',
						lead:self.form.link_type==='Lead'?self.form.lead:'',
					}},
						callback:function(r){
							self.saving=false;
							if(r.message){ self.$emit('toast',{msg:'Event added!',type:'success'}); self.drawerOpen=false; self.$emit('refresh'); }
						},
						error:function(){ self.saving=false; self.$emit('toast',{msg:'Failed to save.',type:'error'}); },
					});
				},
				evtCatStyle: evtCatStyle,
				fmtEventDate: fmtEventDate,
			},
			template: `
				<div>
					<div class="ds-net-wrap">
						<div class="ds-sec-hdr" style="margin-bottom:14px">
							<span class="ds-sec-ttl">🏞 Networking Events</span>
							<div class="ds-sec-rule"></div>
							<button class="g-btn g-btn-primary" style="padding:4px 12px;font-size:11.5px" @click="drawerOpen=true">+ Add Event</button>
							<button class="g-btn g-btn-ghost" style="padding:4px 10px;font-size:11.5px" @click="goCalendar">Calendar →</button>
						</div>
						<div v-if="loading" class="ds-empty">Loading…</div>
						<div v-else-if="!events.length" class="ds-empty">No upcoming events.</div>
						<div v-else class="ds-net-scroll">
							<div class="ds-net-list">
								<div v-for="evt in events" :key="evt.name" class="ds-net-card" @click="selEvt=evt; panelOpen=true;">
									<div class="ds-net-card-date">{{ fmtEventDate(evt.event_date,evt.event_time) }}</div>
									<div class="ds-net-card-title">{{ evt.title }}</div>
									<div v-if="evt.location" class="ds-net-card-venue">{{ evt.location }}</div>
									<span class="ds-net-card-cat" :style="{ background:evtCatStyle(evt.event_category).bg, color:evtCatStyle(evt.event_category).color }">{{ evt.event_category||'Event' }}</span>
								</div>
							</div>
						</div>
					</div>

					<!-- Overlays -->
					<div :class="'ds-overlay'+((panelOpen||drawerOpen)?' visible':'')" @click="panelOpen=false; drawerOpen=false;"></div>

					<EventDetailPanel :open="panelOpen" :event="selEvt" @close="panelOpen=false" @toast="e=>$emit('toast',e)" @refresh="()=>{ $emit('refresh'); panelOpen=false; }"/>

					<Drawer draw-id="drawer-addevent" :open="drawerOpen" icon="📅" title="Add Event" save-label="Add Event" :saving="saving" @close="drawerOpen=false" @save="saveEvent">
						<div class="ds-field"><label class="ds-label">Event Type</label>
							<div class="ds-toggle-row">
								<button v-for="c in ['Event','Meeting','Call']" :key="c" :class="'ds-toggle-btn'+(form.event_category===c?' active':'')" type="button" @click="form.event_category=c">
									{{ {Event:'📅',Meeting:'🤝',Call:'📞'}[c] }} {{ c }}
								</button>
							</div>
						</div>
						<div class="ds-field"><label class="ds-label">Link to</label>
							<div class="ds-toggle-row" style="margin-bottom:8px">
								<button :class="'ds-toggle-btn'+(form.link_type==='Enquiry'?' active':'')" type="button" @click="setLinkType('Enquiry')">📋 Enquiry</button>
								<button :class="'ds-toggle-btn'+(form.link_type==='Lead'?' active':'')" type="button" @click="setLinkType('Lead')">👤 Lead</button>
							</div>
						</div>
						<div class="ds-field" v-if="form.link_type==='Enquiry'"><label class="ds-label">Enquiry</label>
							<LinkField :key="'ae-enq-'+mountKey" doctype="CRM Enquiry" label-field="title" placeholder="Search enquiry…" :filters="[['stage','not in',['Won','Lost']]]" v-model="form.enquiry"/>
						</div>
						<div class="ds-field" v-else><label class="ds-label">Lead</label>
							<LinkField :key="'ae-lead-'+mountKey" doctype="CRM Lead" label-field="full_name" placeholder="Search lead…" :filters="[['status','=','Active']]" v-model="form.lead"/>
						</div>
						<div class="ds-field"><label class="ds-label">Title <span class="ds-req">*</span></label>
							<input class="ds-input" v-model="form.title" placeholder="e.g. Design Week Dubai Networking Night" @keydown.enter="saveEvent"/>
						</div>
						<div class="ds-row2">
							<div class="ds-field"><label class="ds-label">Date <span class="ds-req">*</span></label>
								<input class="ds-input" type="date" v-model="form.event_date"/>
							</div>
							<div class="ds-field"><label class="ds-label">Time</label>
								<input class="ds-input" type="time" v-model="form.event_time"/>
							</div>
						</div>
						<div class="ds-field"><label class="ds-label">Assigned To</label>
							<LinkField :key="'ae-user-'+mountKey" doctype="User" label-field="full_name" placeholder="Search user…" :filters="[['enabled','=',1],['user_type','=','System User']]" v-model="form.assigned_to"/>
						</div>
						<div class="ds-field"><label class="ds-label">Location</label>
							<input class="ds-input" v-model="form.location" placeholder="e.g. DIFC Gate Village, Dubai"/>
						</div>
						<div class="ds-field"><label class="ds-label">Notes</label>
							<textarea class="ds-textarea" v-model="form.notes" placeholder="Event details, attendees, agenda…" style="min-height:80px"></textarea>
						</div>
					</Drawer>
				</div>
			`,
		};

		// ── GREET SECTION ─────────────────────────────────────────────────────
		var GreetSectionComp = {
			name: 'GreetSection',
			props: {
				profile:   { type:Object, default:function(){ return {}; } },
				greeting:  { type:String, default:'' },
				weekLabel: { type:String, default:'' },
				subtitle:  { type:String, default:'' },
				stats:     { type:Object, default:function(){ return {}; } },
				ticker:    { type:Array,  default:function(){ return []; } },
			},
			emits: ['newLead','newEnquiry','logActivity'],
			data: function() {
				return { barsReady:false };
			},
			mounted: function() {
				var self = this;
				setTimeout(function(){ self.barsReady=true; }, 350);
			},
			computed: {
				pct: function() {
					var s = this.stats;
					return {
						pipeline: Math.min((s.pipeline||0)/1000000*100, 100),
						won:      Math.min((s.won||0)/500000*100, 100),
						leads:    Math.min((s.leads||0)/30*100, 100),
						overdue:  Math.min((s.overdue||0)/10*100, 100),
					};
				},
			},
			methods: { fN: fN },
			template: `
				<div class="greet-section">
					<div class="greet-inner">
						<div class="greet-left">
							<div class="greet-avatar-wrap">
								<div class="greet-avatar">
									<img v-if="profile.image" :src="profile.image" alt=""/>
									<span v-else>{{ profile.initials }}</span>
								</div>
								<div class="greet-avatar-pulse"></div>
							</div>
							<div class="greet-text">
								<div class="greet-eyebrow"><span class="greet-eye-dot"></span>{{ weekLabel }}</div>
								<div class="greet-title">{{ greeting }}, {{ profile.name||'there' }}.</div>
								<div class="greet-subtitle">{{ subtitle }}</div>
								<div class="greet-actions">
									<button class="g-btn g-btn-primary"   @click="$emit('newLead')">
										<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
										New Lead
									</button>
									<button class="g-btn g-btn-secondary" @click="$emit('newEnquiry')">
										<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
										New Enquiry
									</button>
									<button class="g-btn g-btn-ghost"     @click="$emit('logActivity')">
										<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
										Log Activity
									</button>
								</div>
							</div>
						</div>
						<div class="greet-stats">
							<div class="g-stat">
								<div class="g-stat-value">{{ stats.pipeline!=null ? 'AED '+fN(stats.pipeline) : '—' }}</div>
								<div class="g-stat-label">AED Pipeline</div>
								<div class="g-stat-bar"><div class="g-stat-bar-fill" :style="{ width:(barsReady?pct.pipeline:0)+'%', transition:'width 1s cubic-bezier(0.4,0,0.2,1)' }"></div></div>
							</div>
							<div class="g-stat">
								<div class="g-stat-value won">{{ stats.won!=null ? 'AED '+fN(stats.won) : '—' }}</div>
								<div class="g-stat-label">AED Won</div>
								<div class="g-stat-bar"><div class="g-stat-bar-fill won" :style="{ width:(barsReady?pct.won:0)+'%', transition:'width 1s cubic-bezier(0.4,0,0.2,1)' }"></div></div>
							</div>
							<div class="g-stat">
								<div class="g-stat-value leads">{{ stats.leads!=null ? stats.leads : '—' }}</div>
								<div class="g-stat-label">Active Leads</div>
								<div class="g-stat-bar"><div class="g-stat-bar-fill leads" :style="{ width:(barsReady?pct.leads:0)+'%', transition:'width 1s cubic-bezier(0.4,0,0.2,1)' }"></div></div>
							</div>
							<div class="g-stat">
								<div class="g-stat-value overdue">{{ stats.overdue!=null ? stats.overdue : '—' }}</div>
								<div class="g-stat-label">Overdue</div>
								<div class="g-stat-bar"><div class="g-stat-bar-fill overdue" :style="{ width:(barsReady?pct.overdue:0)+'%', transition:'width 1s cubic-bezier(0.4,0,0.2,1)' }"></div></div>
							</div>
						</div>
					</div>
					<div v-if="ticker.length" class="ds-ticker">
						<span v-for="(item,i) in ticker" :key="i" :class="'ds-ticker-item ds-ticker-'+item.color">
							<span class="ds-ticker-icon">{{ item.icon }}</span>{{ item.text }}
						</span>
					</div>
				</div>
			`,
		};

		// ── MAIN APP ──────────────────────────────────────────────────────────
		var DSCRMApp = {
			name: 'DSCRMApp',
			components: {
				GreetSection:             GreetSectionComp,
				OnDeckSection:            OnDeckSectionComp,
				NeedsChasingSection:      NeedsChasingSectionComp,
				MyBriefBoard:             MyBriefBoardComp,
				NetworkingEventsSection:  NetworkingEventsSectionComp,
				DrawerLead:               DrawerLeadComp,
				DrawerEnquiry:            DrawerEnquiryComp,
				DrawerActivity:           DrawerActivityComp,
				DrawerEditFollowup:       DrawerEditFollowupComp,
			},
			data: function() {
				return {
					profile:  { initials:'', name:'', image:'' },
					stats:    { pipeline:null, won:null, leads:null, overdue:null },
					ticker:   [],
					greeting: '',
					weekLabel:'',
					subtitle: 'Fetching your pipeline summary…',
					drawer:   null,
					toast:    null,
					refreshAt:    0,
					sectRefreshAt:0,
					editAct:  null,
				};
			},
			mounted: function() {
				this.initGreeting();
				this.loadProfile();
				this.loadStats();
				this.loadTicker();
				var self = this;
				setInterval(function(){ self.refreshAt = Date.now(); self.loadStats(); self.loadTicker(); }, 10000);
			},
			methods: {
				// ── INIT ────────────────────────────────────────────────────
				initGreeting: function() {
					var h = new Date().getHours();
					this.greeting = h<12 ? 'Good morning' : h<17 ? 'Good afternoon' : 'Good evening';
					var d=new Date(), start=new Date(d.getFullYear(),0,1);
					var wk = Math.ceil(((d-start)/86400000+start.getDay()+1)/7);
					this.weekLabel = 'Week '+wk+' · '+MONTHS_LONG[d.getMonth()]+' '+d.getFullYear();
				},
				loadProfile: function() {
					var self = this;
					var user = frappe.session.user;
					var parts = (frappe.session.user_fullname||user).split(' ');
					var initials = parts.map(function(p){ return p[0]; }).join('').toUpperCase().slice(0,2);
					self.profile = { initials:initials, name:parts[0], image:'' };
					frappe.db.get_value('User', user, ['user_image','full_name'], function(r) {
						if(!r) return;
						var firstName = (r.full_name||'').split(' ')[0]||parts[0];
						self.profile = { initials:initials, name:firstName, image:r.user_image||'' };
					});
				},
				loadStats: function() {
					var self = this;
					var user  = frappe.session.user;
					var ms    = frappe.datetime.month_start(), me = frappe.datetime.month_end();
					var today = frappe.datetime.get_today();

					frappe.call({ method:'frappe.client.get_list', args:{ doctype:'CRM Enquiry', filters:[['assigned_to','=',user],['stage','not in',['Won','Lost']]], fields:['name','value'], limit_page_length:0 },
						callback:function(r){ var t=(r.message||[]).reduce(function(s,e){ return s+(e.value||0); },0); self.stats=Object.assign({},self.stats,{pipeline:t}); } });

					frappe.call({ method:'frappe.client.get_list', args:{ doctype:'CRM Enquiry', filters:[['assigned_to','=',user],['stage','=','Won'],['modified','between',[ms,me]]], fields:['name','value'], limit_page_length:0 },
						callback:function(r){ var t=(r.message||[]).reduce(function(s,e){ return s+(e.value||0); },0); self.stats=Object.assign({},self.stats,{won:t}); } });

					frappe.call({ method:'frappe.client.get_count', args:{ doctype:'CRM Lead', filters:[['assigned_to','=',user],['status','=','Active']] },
						callback:function(r){ self.stats=Object.assign({},self.stats,{leads:r.message||0}); } });

					frappe.call({ method:'frappe.client.get_count', args:{ doctype:'CRM Activity', filters:[['logged_by','=',user],['activity_date','<',today]] },
						callback:function(r){
							var cnt=r.message||0;
							self.stats=Object.assign({},self.stats,{overdue:cnt});
							frappe.call({ method:'frappe.client.get_count', args:{ doctype:'CRM Enquiry', filters:[['assigned_to','=',user],['stage','not in',['Won','Lost']],['days_in_stage','>',7]] },
								callback:function(r2){
									var attn=r2.message||0, parts=[];
									if(cnt>0)  parts.push(cnt+' overdue activit'+(cnt===1?'y':'ies'));
									if(attn>0) parts.push(attn+' deal'+(attn===1?'':'s')+' need attention');
									self.subtitle = parts.length ? parts.join(' · ') : 'Your pipeline is looking healthy today.';
								},
							});
						},
					});
				},
				loadTicker: function() {
					var self  = this;
					var user  = frappe.session.user;
					var today = frappe.datetime.get_today();
					var in3   = frappe.datetime.add_days(today,3);
					var ms    = frappe.datetime.month_start(), me = frappe.datetime.month_end();
					var items=[], pending=3;

					function rebuild(){ pending--; if(pending<=0) self.ticker=items.slice(); }

					frappe.call({ method:'frappe.client.get_count', args:{ doctype:'CRM Activity', filters:[['logged_by','=',user],['activity_date','<',today],['follow_up_action','!=','']] },
						callback:function(r){ var c=r.message||0; if(c>0) items.push({icon:'⚠',text:c+' overdue follow-up'+(c>1?'s':''),color:'amb'}); rebuild(); } });

					frappe.call({ method:'frappe.client.get_list', args:{ doctype:'CRM Enquiry', filters:[['assigned_to','=',user],['stage','=','Proposal'],['last_activity_date','<=',in3]], fields:['name','title'], limit_page_length:5, order_by:'last_activity_date asc' },
						callback:function(r){ (r.message||[]).forEach(function(e){ items.push({icon:'📋',text:e.title+' proposal due soon',color:'blue'}); }); rebuild(); } });

					frappe.call({ method:'frappe.client.get_list', args:{ doctype:'CRM Enquiry', filters:[['assigned_to','=',user],['stage','=','Won'],['modified','between',[ms,me]]], fields:['name','value'], limit_page_length:0 },
						callback:function(r){ var t=(r.message||[]).reduce(function(s,e){ return s+(e.value||0); },0); if(t>0) items.push({icon:'✓',text:'AED '+fN(t)+' closed this month',color:'grn'}); rebuild(); } });
				},

				// ── EVENTS ──────────────────────────────────────────────────
				showToast: function(payload) {
					var self = this;
					this.toast = payload;
					setTimeout(function(){ self.toast=null; }, 3200);
				},
				refreshAll: function() {
					this.refreshAt     = Date.now();
					this.sectRefreshAt = Date.now();
					this.loadStats();
					this.loadTicker();
				},
				openDrawer:  function(name) { this.drawer=name; },
				closeDrawer: function() { this.drawer=null; this.editAct=null; },
				onEdit:      function(act) { this.editAct=act; this.drawer='editfollowup'; },
			},
			template: `
				<div>
					<div class="ds-crm-wrapper">
						<GreetSection
							:profile="profile" :greeting="greeting" :week-label="weekLabel"
							:subtitle="subtitle" :stats="stats" :ticker="ticker"
							@new-lead="openDrawer('lead')"
							@new-enquiry="openDrawer('enquiry')"
							@log-activity="openDrawer('activity')"
						/>

						<div class="ds-g2">
							<OnDeckSection :refresh-at="sectRefreshAt" @log-activity="openDrawer('activity')"/>
							<NeedsChasingSection :refresh-at="sectRefreshAt" @edit="onEdit"/>
						</div>

						<MyBriefBoard :refresh-at="sectRefreshAt" @toast="showToast" @refresh="refreshAll"/>

						<NetworkingEventsSection :refresh-at="sectRefreshAt" @toast="showToast" @refresh="refreshAll"/>

						<!-- Global overlay -->
						<div :class="'ds-overlay'+(!!drawer?' visible':'')" @click="closeDrawer"></div>

						<!-- Drawers -->
						<DrawerLead
							:open="drawer==='lead'"
							@close="closeDrawer"
							@toast="showToast"
							@refresh="refreshAll"
						/>
						<DrawerEnquiry
							:open="drawer==='enquiry'"
							@close="closeDrawer"
							@toast="showToast"
							@refresh="refreshAll"
						/>
						<DrawerActivity
							:open="drawer==='activity'"
							@close="closeDrawer"
							@toast="showToast"
							@refresh="refreshAll"
						/>
						<DrawerEditFollowup
							:open="drawer==='editfollowup'"
							:activity="editAct"
							@close="closeDrawer"
							@toast="showToast"
							@refresh="refreshAll"
						/>
					</div>

					<!-- Toast -->
					<div v-if="toast" :class="'ds-toast show '+(toast.type||'success')">{{ toast.msg }}</div>
				</div>
			`,
		};

		// ── BOOT ─────────────────────────────────────────────────────────────
		Vue.createApp(DSCRMApp).mount(mount);

	}); // end frappe.require
}; // end on_page_load