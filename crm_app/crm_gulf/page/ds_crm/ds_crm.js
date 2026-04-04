

frappe.pages['ds-crm'].on_page_load = function (wrapper) {
	frappe.ui.make_app_page({
		parent: wrapper,
		title: 'DS CRM',
		single_column: true,
	});

	frappe.require([
		'https://unpkg.com/react@18/umd/react.production.min.js',
		'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
	], function () {
		frappe.require('/assets/crm_app/css/ds_crm.css');

		// ── Mount ──────────────────────────────────────────────────────────
		var mount = document.createElement('div');
		mount.id  = 'ds-crm-root';
		$(wrapper).find('.page-content').html('').append(mount);

		// ── ICONS (all functions, no top-level const/let) ──────────────────
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
    var queryArr   = React.useState('');   var query = queryArr[0];   var setQuery = queryArr[1];
    var optionsArr = React.useState([]);   var options = optionsArr[0]; var setOptions = optionsArr[1];
    var openArr    = React.useState(false); var isOpen = openArr[0];  var setOpen = openArr[1];
    var displayArr = React.useState('');   var display = displayArr[0]; var setDisplay = displayArr[1];
    var ref = React.useRef();

    // Sync display when parent clears the value (e.g. form reset)
    React.useEffect(function () {
        if (!props.value) {
            setDisplay('');
            setQuery('');
            setOpen(false);
        }
    }, [props.value]);

    React.useEffect(function () {
        if (!isOpen) return;
        var fields = ['name'].concat(props.labelField ? [props.labelField] : []);
        var f = (props.filters || []).slice();
        if (query) f.push([props.labelField || 'name', 'like', '%' + query + '%']);
        frappe.call({
            method: 'frappe.client.get_list',
            args: { doctype: props.doctype, filters: f, fields: fields, limit_page_length: 20, order_by: 'creation desc' },
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
                limit_page_length: 10,
            },
            callback: function (r) {
                var acts = r.message || [];
                setActivities(acts);
                setLoading(false);

                // Collect unique enquiry and lead IDs to resolve labels
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
                        args: { doctype:'CRM Enquiry', filters:[['name','in',enquiryIds]], fields:['name','title'], limit_page_length:50 },
                        callback: function(r2) {
                            (r2.message||[]).forEach(function(e){ resolved[e.name] = e.title; });
                            done();
                        },
                    });
                }
                if (leadIds.length > 0) {
                    frappe.call({
                        method: 'frappe.client.get_list',
                        args: { doctype:'CRM Lead', filters:[['name','in',leadIds]], fields:['name','full_name','company'], limit_page_length:50 },
                        callback: function(r2) {
                            (r2.message||[]).forEach(function(e){
                                resolved[e.name] = e.full_name + (e.company ? ' · ' + e.company : '');
                            });
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
                if (r.message) {
                    props.showToast('Follow-up updated!', 'success');
                    props.onClose();
                    props.refresh();
                }
            },
            error: function () { setSaving(false); props.showToast('Failed to update.', 'error'); },
        });
    }

    var act = props.activity || {};
    // Use pre-resolved human-readable label; fall back to raw IDs
    var linkedLabel = act._resolvedLabel || act.enquiry || act.lead || '—';

    return React.createElement(Drawer, {
        id: 'drawer-editfollowup',
        open: props.open,
        icon: '✏️',
        title: 'Edit Follow-up',
        onClose: props.onClose,
        onSave: save,
        saveLabel: 'Save Changes',
        saving: saving,
    },
        field('Subject', true,
            React.createElement('input', {
                className: 'ds-input',
                value: form.subject,
                placeholder: 'e.g. Send proposal',
                onChange: function (e) { set('subject', e.target.value); },
            }),
        ),
        field('Enquiry / Lead', false,
            React.createElement('input', {
                className: 'ds-input',
                value: linkedLabel,
                readOnly: true,
                style: { background: 'var(--bg2)', cursor: 'default', color: 'var(--muted)' },
            }),
        ),
        field('New Date', true,
            React.createElement('input', {
                className: 'ds-input',
                type: 'date',
                value: form.date,
                onChange: function (e) { set('date', e.target.value); },
            }),
        ),
        field('Notes', false,
            React.createElement('textarea', {
                className: 'ds-textarea',
                value: form.notes,
                placeholder: 'What happened? What was agreed?',
                style: { minHeight: '90px' },
                onChange: function (e) { set('notes', e.target.value); },
            }),
        ),
    );
}

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
                limit_page_length: 10,
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
                        args: { doctype:'CRM Enquiry', filters:[['name','in',enquiryIds]], fields:['name','title'], limit_page_length:50 },
                        callback: function(r2) {
                            (r2.message||[]).forEach(function(e){ resolved[e.name] = e.title; });
                            done();
                        },
                    });
                }
                if (leadIds.length > 0) {
                    frappe.call({
                        method: 'frappe.client.get_list',
                        args: { doctype:'CRM Lead', filters:[['name','in',leadIds]], fields:['name','full_name','company'], limit_page_length:50 },
                        callback: function(r2) {
                            (r2.message||[]).forEach(function(e){
                                resolved[e.name] = e.full_name + (e.company ? ' · ' + e.company : '');
                            });
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
        // Attach resolved label to act so Edit popup can use it
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

			var profileArr    = React.useState({ initials:'', name:'', image:'' });     var profile = profileArr[0];    var setProfile = profileArr[1];
			var statsArr      = React.useState({ pipeline:null, won:null, leads:null, overdue:null }); var stats = statsArr[0]; var setStats = statsArr[1];
			var tickerArr     = React.useState([]);   var ticker = tickerArr[0];    var setTicker = tickerArr[1];
			var greetingArr   = React.useState('');   var greeting = greetingArr[0]; var setGreeting = greetingArr[1];
			var weekArr       = React.useState('');   var weekLabel = weekArr[0];    var setWeekLabel = weekArr[1];
			var subtitleArr   = React.useState('Fetching your pipeline summary…'); var subtitle = subtitleArr[0]; var setSubtitle = subtitleArr[1];
			var drawerArr     = React.useState(null); var drawer = drawerArr[0];    var setDrawer = drawerArr[1];
			var toastArr      = React.useState(null); var toast = toastArr[0];      var setToast = toastArr[1];
			var refreshArr    = React.useState(0);    var refreshAt = refreshArr[0]; var setRefreshAt = refreshArr[1];
            var editActArr    = React.useState(null);  var editAct = editActArr[0];    var setEditAct = editActArr[1];
            var sectRefArr    = React.useState(0);     var sectRefreshAt = sectRefArr[0]; var setSectRefreshAt = sectRefArr[1];

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

        // ── TWO-COLUMN SECTIONS ─────────────────────────
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

        React.createElement(DrawerOverlay, { open:!!drawer, onClose:function(){setDrawer(null);} }),
        React.createElement(DrawerLead,          { open:drawer==='lead',          onClose:function(){setDrawer(null);}, showToast:showToast, refresh:function(){refresh();refreshSections();} }),
        React.createElement(DrawerEnquiry,       { open:drawer==='enquiry',       onClose:function(){setDrawer(null);}, showToast:showToast, refresh:function(){refresh();refreshSections();} }),
        React.createElement(DrawerActivity,      { open:drawer==='activity',      onClose:function(){setDrawer(null);}, showToast:showToast, refresh:function(){refresh();refreshSections();} }),
        React.createElement(DrawerEditFollowup,  { open:drawer==='editfollowup',  onClose:function(){setDrawer(null);setEditAct(null);}, showToast:showToast, refresh:function(){refresh();refreshSections();}, activity:editAct }),
    ),
    toast ? React.createElement(Toast, { msg:toast.msg, type:toast.type }) : null,
);
		}

		// ── BOOT ───────────────────────────────────────────────────────────
		ReactDOM.createRoot(mount).render(React.createElement(DSCRMApp));

	}); // end frappe.require callback
}; // end on_page_load



