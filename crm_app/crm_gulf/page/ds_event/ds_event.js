frappe.pages['ds-event'].on_page_load = function (wrapper) {
	frappe.ui.make_app_page({
		parent: wrapper,
		title: 'DS Events',
		single_column: true,
	});

	frappe.require([
		'https://unpkg.com/react@18/umd/react.development.js',
		'https://unpkg.com/react-dom@18/umd/react-dom.development.js',
	], function () {
		frappe.require('/assets/crm_app/css/ds_event.css');

		var mount = document.createElement('div');
		mount.id = 'ds-event-root';
		$(wrapper).find('.page-content').html('').append(mount);

		// ── ICONS ──────────────────────────────────────────────────────────
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
		function chevLeft() {
			return React.createElement('svg', { width:'14', height:'14', viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:'2.5', strokeLinecap:'round' },
				React.createElement('polyline', { points:'15 18 9 12 15 6' }),
			);
		}
		function chevRight() {
			return React.createElement('svg', { width:'14', height:'14', viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:'2.5', strokeLinecap:'round' },
				React.createElement('polyline', { points:'9 18 15 12 9 6' }),
			);
		}
		function plusIcon() {
			return React.createElement('svg', { width:'12', height:'12', viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:'2.5', strokeLinecap:'round' },
				React.createElement('line', { x1:'12', y1:'5', x2:'12', y2:'19' }),
				React.createElement('line', { x1:'5',  y1:'12', x2:'19', y2:'12' }),
			);
		}
		function callIcon() {
			return React.createElement('svg', { width:'13', height:'13', viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:'2', strokeLinecap:'round' },
				React.createElement('path', { d:'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.24h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.19 6.19l1.73-1.74a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z' }),
			);
		}
		function meetIcon() {
			return React.createElement('svg', { width:'13', height:'13', viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:'2', strokeLinecap:'round' },
				React.createElement('path', { d:'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' }),
				React.createElement('circle', { cx:'9', cy:'7', r:'4' }),
				React.createElement('path', { d:'M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' }),
			);
		}

		// ── CONSTANTS ──────────────────────────────────────────────────────
		var MONTHS_LONG  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
		var MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
		var DAYS_SHORT   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
		var DAYS_LONG    = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

		// ── HELPERS ────────────────────────────────────────────────────────
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
    // Handle both YYYY-MM-DD and DD-MM-YYYY
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
    // Use Date.UTC to avoid timezone shift, then read day-of-week
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

		// ── TOAST ──────────────────────────────────────────────────────────
		function Toast(props) {
			return React.createElement('div', { className:'dse-toast show ' + (props.type || 'success') }, props.msg);
		}

		// ── FIELD HELPER ───────────────────────────────────────────────────
		function field(label, required) {
			var extra = Array.prototype.slice.call(arguments, 2);
			var lbl = React.createElement('label', { className:'dse-label' },
				label,
				required ? React.createElement('span', { className:'dse-req' }, ' *') : null,
			);
			return React.createElement.apply(React, ['div', { className:'dse-field', key:label }, lbl].concat(extra));
		}

		// ── LINK FIELD — same pattern as ds-crm ────────────────────────────
		function LinkField(props) {
			var qArr   = React.useState('');    var query = qArr[0];   var setQuery   = qArr[1];
			var optArr = React.useState([]);    var opts  = optArr[0]; var setOpts    = optArr[1];
			var opArr  = React.useState(false); var isOpen = opArr[0]; var setOpen    = opArr[1];
			var dArr   = React.useState('');    var disp  = dArr[0];   var setDisplay = dArr[1];
			var ref    = React.useRef();

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
					args: { doctype:props.doctype, filters:f, fields:fields, limit_page_length:20, order_by:'creation desc' },
					callback: function (r) { setOpts(r.message || []); },
				});
			}, [query, isOpen]);

			React.useEffect(function () {
				function h(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
				document.addEventListener('mousedown', h);
				return function () { document.removeEventListener('mousedown', h); };
			}, []);

			function select(opt) {
				props.onChange(opt.name);
				setDisplay(opt[props.labelField] || opt.name);
				setQuery(''); setOpen(false);
			}
			function clear() { props.onChange(''); setDisplay(''); setQuery(''); }

			return React.createElement('div', { className:'dse-link-wrap', ref:ref },
				React.createElement('div', { className:'dse-link-input-row' },
					React.createElement('input', {
						className: 'dse-input dse-link-input',
						value: isOpen ? query : disp,
						placeholder: disp ? '' : props.placeholder,
						onFocus: function () { setOpen(true); setQuery(''); },
						onChange: function (e) { setQuery(e.target.value); },
					}),
					disp ? React.createElement('button', { className:'dse-link-clear', type:'button', onClick:clear }, '×') : null,
					React.createElement('span', { className:'dse-link-arrow', onClick:function(){setOpen(function(o){return !o;});} }, '▾'),
				),
				(disp && !isOpen) ? React.createElement('div', { className:'dse-link-badge' }, disp) : null,
				isOpen ? React.createElement('div', { className:'dse-link-dropdown' },
					opts.length === 0
						? React.createElement('div', { className:'dse-link-empty' }, 'No results')
						: opts.map(function (opt) {
							return React.createElement('div', { key:opt.name, className:'dse-link-option', onMouseDown:function(){select(opt);} },
								React.createElement('span', { className:'dse-link-opt-label' }, opt[props.labelField] || opt.name),
								(props.labelField && opt.name !== opt[props.labelField])
									? React.createElement('span', { className:'dse-link-opt-sub' }, opt.name)
									: null,
							);
						}),
				) : null,
			);
		}

		// ── DRAWER: ADD EVENT — same style as ds-crm DrawerAddEvent ─────────
		function DrawerAddEvent(props) {
			var def = {
				event_category: 'Event',
				link_type: 'Enquiry',
				enquiry: '', lead: '',
				title: '',
				event_date: frappe.datetime.get_today(),
				event_time: '',
				assigned_to: frappe.session.user,
				location: '',
				notes: '',
			};
			var fArr   = React.useState(def);   var form = fArr[0];   var setForm   = fArr[1];
			var sArr   = React.useState(false);  var saving = sArr[0]; var setSaving = sArr[1];
			var mkArr  = React.useState(0);      var mountKey = mkArr[0]; var setMountKey = mkArr[1];

			React.useEffect(function () {
				if (props.open) {
					setForm(Object.assign({}, def, { assigned_to:frappe.session.user, event_date:frappe.datetime.get_today() }));
					setMountKey(function(k){ return k+1; });
				}
			}, [props.open]);

			React.useEffect(function () {
				function h(e) { if (e.key === 'Escape' && props.open) props.onClose(); }
				document.addEventListener('keydown', h);
				return function () { document.removeEventListener('keydown', h); };
			}, [props.open]);

			function set(k, v) { setForm(function(f){ return Object.assign({}, f, {[k]:v}); }); }

			function save() {
				if (!form.title.trim()) { props.showToast('Title is required', 'error'); return; }
				if (!form.event_date)   { props.showToast('Date is required',  'error'); return; }
				setSaving(true);
				frappe.call({
					method: 'frappe.client.insert',
					args: { doc: {
						doctype: 'CRM Event',
						event_category: form.event_category,
						title:          form.title.trim(),
						event_date:     form.event_date,
						event_time:     form.event_time || '',
						location:       form.location.trim(),
						notes:          form.notes.trim(),
						assigned_to:    form.assigned_to || frappe.session.user,
						enquiry: form.link_type === 'Enquiry' ? form.enquiry : '',
						lead:    form.link_type === 'Lead'    ? form.lead    : '',
					}},
					callback: function (r) {
						setSaving(false);
						if (r.message) { props.showToast('Event added!', 'success'); props.onClose(); props.refresh(); }
					},
					error: function () { setSaving(false); props.showToast('Failed to save event.', 'error'); },
				});
			}

			var cats     = ['Event', 'Meeting', 'Call'];
			var catIcons = { Event:'📅', Meeting:'🤝', Call:'📞' };

			return React.createElement(React.Fragment, null,
				// Overlay
				React.createElement('div', {
					className: 'dse-overlay' + (props.open ? ' visible' : ''),
					onClick: props.onClose,
				}),
				// Drawer
				React.createElement('div', { className:'dse-drawer' + (props.open ? ' open' : '') },
					React.createElement('div', { className:'dse-drawer-hdr' },
						React.createElement('div', { className:'dse-drawer-title' }, '📅 Add Event'),
						React.createElement('button', { className:'dse-drawer-close', onClick:props.onClose }, closeIcon()),
					),
					React.createElement('div', { className:'dse-drawer-body' },

						// Event Type
						field('Event Type', false,
							React.createElement('div', { className:'dse-toggle-row' },
								cats.map(function(c) {
									return React.createElement('button', {
										key: c,
										className: 'dse-type-btn' + (form.event_category === c ? ' active' : ''),
										type: 'button',
										onClick: function(){ set('event_category', c); },
									}, catIcons[c] + ' ' + c);
								}),
							),
						),

						// Link to
						field('Link to', false,
							React.createElement('div', { className:'dse-toggle-row', style:{marginBottom:'8px'} },
								React.createElement('button', {
									className: 'dse-type-btn' + (form.link_type === 'Enquiry' ? ' active' : ''),
									type: 'button',
									onClick: function(){ set('link_type','Enquiry'); set('lead',''); },
								}, '📋 Enquiry'),
								React.createElement('button', {
									className: 'dse-type-btn' + (form.link_type === 'Lead' ? ' active' : ''),
									type: 'button',
									onClick: function(){ set('link_type','Lead'); set('enquiry',''); },
								}, '👤 Lead'),
							),
						),

						form.link_type === 'Enquiry'
							? field('Enquiry', false, React.createElement(LinkField, { key:'ae-enq-'+mountKey, doctype:'CRM Enquiry', labelField:'title', placeholder:'Search enquiry…', filters:[['stage','not in',['Won','Lost']]], value:form.enquiry, onChange:function(v){set('enquiry',v);} }))
							: field('Lead',    false, React.createElement(LinkField, { key:'ae-lead-'+mountKey, doctype:'CRM Lead', labelField:'full_name', placeholder:'Search lead…', filters:[['status','=','Active']], value:form.lead, onChange:function(v){set('lead',v);} })),

						field('Title', true,
							React.createElement('input', {
								className: 'dse-input',
								value: form.title,
								placeholder: 'e.g. Design Week Dubai Networking Night',
								onChange: function(e){ set('title', e.target.value); },
								onKeyDown: function(e){ if(e.key==='Enter') save(); },
							}),
						),

						React.createElement('div', { className:'dse-row2' },
							field('Date', true,
								React.createElement('input', { className:'dse-input', type:'date', value:form.event_date, onChange:function(e){set('event_date',e.target.value);} }),
							),
							field('Time', false,
								React.createElement('input', { className:'dse-input', type:'time', value:form.event_time, onChange:function(e){set('event_time',e.target.value);} }),
							),
						),

						field('Assigned To', false,
							React.createElement(LinkField, { key:'ae-user-'+mountKey, doctype:'User', labelField:'full_name', placeholder:'Search user…', filters:[['enabled','=',1],['user_type','=','System User']], value:form.assigned_to, onChange:function(v){set('assigned_to',v);} }),
						),

						field('Location', false,
							React.createElement('input', { className:'dse-input', value:form.location, placeholder:'e.g. DIFC Gate Village, Dubai', onChange:function(e){set('location',e.target.value);} }),
						),

						field('Notes', false,
							React.createElement('textarea', { className:'dse-textarea', value:form.notes, placeholder:'Event details, attendees, agenda…', style:{minHeight:'80px'}, onChange:function(e){set('notes',e.target.value);} }),
						),
					),
					React.createElement('div', { className:'dse-drawer-footer' },
						React.createElement('button', {
							className: 'dse-btn dse-btn-primary',
							style: { flex:1 },
							onClick: save,
							disabled: saving,
						}, saveIcon(), saving ? ' Saving…' : ' Add Event'),
						React.createElement('button', { className:'dse-btn dse-btn-ghost', onClick:props.onClose }, 'Cancel'),
					),
				),
			);
		}

		// ── MAIN APP ────────────────────────────────────────────────────────
		function DSEventApp() {
			var today   = new Date();
			var yArr    = React.useState(today.getFullYear()); var year  = yArr[0]; var setYear  = yArr[1];
			var mArr    = React.useState(today.getMonth());    var month = mArr[0]; var setMonth = mArr[1];
			var vArr    = React.useState('month'); var view  = vArr[0]; var setView  = vArr[1];
			var scArr   = React.useState('team');  var scope = scArr[0]; var setScope = scArr[1];
			var evArr   = React.useState([]);      var events = evArr[0]; var setEvents = evArr[1];
			var ldArr   = React.useState(true);    var loading = ldArr[0]; var setLoading = ldArr[1];
			var sdArr   = React.useState(null);    var selDay = sdArr[0]; var setSelDay = sdArr[1];
			var drArr   = React.useState(false);   var drawerOpen = drArr[0]; var setDrawerOpen = drArr[1];
			var toArr   = React.useState(null);    var toast = toArr[0]; var setToast = toArr[1];
			var rfArr   = React.useState(0);       var refreshAt = rfArr[0]; var setRefreshAt = rfArr[1];

			function showToast(msg, type) {
				setToast({ msg:msg, type:type||'success' });
				setTimeout(function(){ setToast(null); }, 3200);
			}
			function refresh() { setRefreshAt(Date.now()); }

			// ── FETCH EVENTS ─────────────────────────────────────────────────
			React.useEffect(function () {
				setLoading(true);

				// Fetch current month +/- one month buffer
				var sd = new Date(year, month - 1, 1);
				var ed = new Date(year, month + 2, 0);
				var sdStr = sd.toISOString().slice(0,10);
				var edStr = ed.toISOString().slice(0,10);

				var filters = [
					['event_date', '>=', sdStr],
					['event_date', '<=', edStr],
				];
				if (scope === 'mine') {
					filters.push(['assigned_to', '=', frappe.session.user]);
				}

				frappe.call({
					method: 'frappe.client.get_list',
					args: {
						doctype: 'CRM Event',
						filters: filters,
						fields: ['name','title','event_category','event_date','event_time','location','assigned_to','enquiry','lead','notes'],
						order_by: 'event_date asc, event_time asc',
						limit_page_length: 300,
					},
					callback: function (r) {
						var rows = r.message || [];

						// Resolve assigned_to → full_name
						var uids = [];
						rows.forEach(function(e){ if(e.assigned_to && uids.indexOf(e.assigned_to)===-1) uids.push(e.assigned_to); });

						if (uids.length) {
							frappe.call({
								method: 'frappe.client.get_list',
								args: { doctype:'User', filters:[['name','in',uids]], fields:['name','full_name'], limit_page_length:50 },
								callback: function (r2) {
									var map = {};
									(r2.message||[]).forEach(function(u){ map[u.name] = u.full_name; });
									rows = rows.map(function(e){ return Object.assign({}, e, { _assignedName: map[e.assigned_to] || e.assigned_to }); });
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
			}, [year, month, scope, refreshAt]);

			// ── NAVIGATE MONTH ────────────────────────────────────────────────
			function navMonth(dir) {
    if (view === 'day' && selDay) {
        // Navigate by day when in day view
        var d = new Date(selDay);
        d.setDate(d.getDate() + dir);
        var newDs = d.getFullYear() + '-'
            + String(d.getMonth()+1).padStart(2,'0') + '-'
            + String(d.getDate()).padStart(2,'0');
        setSelDay(newDs);
        // Also update month/year if we crossed a boundary
        if (d.getMonth() !== month || d.getFullYear() !== year) {
            setMonth(d.getMonth());
            setYear(d.getFullYear());
        }
        return;
    }
    var nm = month + dir;
    if (nm > 11){ nm = 0; setYear(function(y){ return y+1; }); }
    else if (nm < 0){ nm = 11; setYear(function(y){ return y-1; }); }
    setMonth(nm);
    setSelDay(null);
}

			// ── EVENTS FOR A DATE ─────────────────────────────────────────────
			function eventsFor(dateStr) {
    if (!dateStr) return [];
    // Normalize to YYYY-MM-DD regardless of input format
    var norm = dateStr;
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
        // DD-MM-YYYY → YYYY-MM-DD
        var p = dateStr.split('-');
        norm = p[2] + '-' + p[1] + '-' + p[0];
    }
    return events.filter(function(e) {
        return e.event_date === norm;
    });
}

			// ── BUILD MONTH CELLS ─────────────────────────────────────────────
			function buildCells() {
				var firstDay    = new Date(year, month, 1).getDay();
				var daysInMonth = new Date(year, month+1, 0).getDate();
				var daysInPrev  = new Date(year, month, 0).getDate();
				var cells = [];

				// Prev month pads
				for (var i = firstDay-1; i >= 0; i--) {
					cells.push({ day: daysInPrev-i, current:false, dateStr:null });
				}
				// Current month
				for (var d = 1; d <= daysInMonth; d++) {
					var ds = year + '-' + String(month+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
					cells.push({ day:d, current:true, dateStr:ds });
				}
				// Next month pads
				var rem = (7 - cells.length%7) % 7;
				for (var j = 1; j <= rem; j++) {
					cells.push({ day:j, current:false, dateStr:null });
				}
				return cells;
			}

			// ── TYPE SUMMARY BAR ──────────────────────────────────────────────
			function renderTypeSummary() {
				if (loading) return React.createElement('span', { style:{fontSize:'10.5px', color:'var(--faint)'} }, 'Loading…');
				var counts = {};
				events.forEach(function(e){ var c = e.event_category||'Event'; counts[c]=(counts[c]||0)+1; });
				var keys = Object.keys(counts);
				if (!keys.length) return React.createElement('span', { style:{fontSize:'10.5px', color:'var(--faint)'} }, 'No events this period');
				return keys.map(function(cat) {
					var cs = evtCatStyle(cat);
					return React.createElement('span', {
						key: cat,
						className: 'dse-type-chip',
						style: { background:cs.bg, color:cs.color },
					}, cat + '  ' + counts[cat]);
				});
			}

			// ── MONTH VIEW ────────────────────────────────────────────────────
			function renderMonthView() {
				var cells = buildCells();
				var td    = todayStr();

				return React.createElement('div', null,
					// Type chips bar
					React.createElement('div', { className:'dse-type-chips' },
						React.createElement('span', { className:'dse-type-label' }, 'This period:'),
						renderTypeSummary(),
					),
					// Grid
					React.createElement('div', { className:'dse-month-body' },
						React.createElement('div', { className:'dse-dow-row' },
							DAYS_SHORT.map(function(d){ return React.createElement('div', { key:d, className:'dse-dow' }, d); }),
						),
						React.createElement('div', { className:'dse-day-grid' },
							cells.map(function(cell, idx) {
								if (!cell.current) {
									return React.createElement('div', { key:idx, className:'dse-day-cell dim' },
										React.createElement('div', { className:'dse-day-num' }, cell.day),
									);
								}

								var dayEvs  = eventsFor(cell.dateStr);
								var isToday = cell.dateStr === td;
								var isSel   = cell.dateStr === selDay;
								var maxShow = 3;
								var shown   = dayEvs.slice(0, maxShow);
								var hidden  = dayEvs.slice(maxShow);

								return React.createElement('div', {
									key: idx,
									className: 'dse-day-cell' + (isToday?' today':'') + (isSel?' selected':'') + (dayEvs.length>0?' has-events':''),
									onClick: function() {
										setSelDay(cell.dateStr);
										setView('day');
									},
								},
									React.createElement('div', { className:'dse-day-num' }, cell.day),

									// Pills — first 3
									shown.map(function(e) {
										var cs = evtCatStyle(e.event_category);
										return React.createElement('div', {
											key: e.name,
											className: 'dse-day-pill',
											style: { background:cs.bg, color:cs.color },
										}, (e.event_time ? fmtTime(e.event_time)+' ' : '') + e.title);
									}),

									// +N more chip
									hidden.length > 0
										? React.createElement('div', { className:'dse-day-more' }, '+'+hidden.length+' more')
										: null,

									// Tooltip — shows ALL events on this day
									dayEvs.length > 0
										? React.createElement('div', { className:'dse-day-tooltip' },
											dayEvs.map(function(e) {
												var cs = evtCatStyle(e.event_category);
												return React.createElement('div', { key:e.name, className:'dse-tooltip-item' },
													React.createElement('span', { className:'dse-tooltip-cat', style:{color:cs.color} }, e.event_category),
													React.createElement('div', { className:'dse-tooltip-title' }, e.title),
													(e.event_time || e.location)
														? React.createElement('div', { className:'dse-tooltip-time' },
															(e.event_time ? fmtTime(e.event_time) : '') +
															(e.event_time && e.location ? '  ·  ' : '') +
															(e.location || ''),
														)
														: null,
												);
											}),
										)
										: null,
								);
							}),
						),
					),
				);
			}

			// ── DAY VIEW ──────────────────────────────────────────────────────
			function renderDayView() {
    var displayDate = selDay || (year+'-'+String(month+1).padStart(2,'0')+'-01');
    var dayEvs = eventsFor(displayDate);
    var hours  = [];
    for (var h = 6; h <= 22; h++) hours.push(h);  // expanded range

    // Separate untimed events
    var untimedEvs = dayEvs.filter(function(e){ return !e.event_time; });

    return React.createElement('div', { className:'dse-day-view-body' },
        React.createElement('div', { className:'dse-day-view-title' }, fmtDateLong(displayDate)),

        // All-day / no-time events
        untimedEvs.length > 0
            ? React.createElement('div', { className:'dse-allday-row' },
                React.createElement('div', { className:'dse-allday-label' }, 'All day'),
                React.createElement('div', { className:'dse-allday-events' },
                    untimedEvs.map(function(e) {
                        var cs = evtCatStyle(e.event_category);
                        return React.createElement('div', { key:e.name, className:'dse-hour-event', style:{ background:cs.bg, borderColor:cs.color } },
                            React.createElement('div', { className:'dse-hour-event-name' }, e.title),
                            React.createElement('div', { className:'dse-hour-event-meta' },
                                (e.location ? '📍 '+e.location : '') +
                                (e.location && e._assignedName ? '  ·  ' : '') +
                                (e._assignedName ? '👤 '+e._assignedName : ''),
                            ),
                        );
                    }),
                ),
              )
            : null,

        dayEvs.length === 0
            ? React.createElement('div', { className:'dse-empty' }, 'No events on this day.')
            : null,

        hours.map(function(hr) {
            var hStr  = String(hr).padStart(2,'0') + ':';
            var label = (hr === 0 ? 12 : hr > 12 ? hr-12 : hr) + ':00 ' + (hr < 12 ? 'AM' : 'PM');
            var hEvs = dayEvs.filter(function(e) {
    if (!e.event_time) return false;
    var t = e.event_time.trim();
    // Normalize "9:00:00" → "09:00:00" in case DB returns without leading zero
    if (t.charAt(1) === ':') t = '0' + t;
    return t.slice(0, 3) === hStr;
});
            return React.createElement('div', { key:hr, className:'dse-hour-row' },
                React.createElement('div', { className:'dse-hour-label' }, label),
                React.createElement('div', { className:'dse-hour-slot' },
                    hEvs.map(function(e) {
                        var cs = evtCatStyle(e.event_category);
                        var timeDisplay = e.event_time ? fmtTime(e.event_time) : '';
                        return React.createElement('div', { key:e.name, className:'dse-hour-event', style:{ background:cs.bg, borderColor:cs.color } },
                            React.createElement('div', { className:'dse-hour-event-name' }, e.title),
                            React.createElement('div', { className:'dse-hour-event-meta' },
                                (timeDisplay ? '🕐 '+timeDisplay : '') +
                                (timeDisplay && (e.location || e._assignedName) ? '  ·  ' : '') +
                                (e.location ? '📍 '+e.location : '') +
                                (e.location && e._assignedName ? '  ·  ' : '') +
                                (e._assignedName ? '👤 '+e._assignedName : ''),
                            ),
                            e.notes
                                ? React.createElement('div', { className:'dse-hour-event-notes' }, e.notes)
                                : null,
                        );
                    }),
                ),
            );
        }),
    );
}

			// ── UPCOMING SECTION ──────────────────────────────────────────────
			function renderUpcoming() {
				var td = todayStr();
				var upcoming = events
					.filter(function(e){ return e.event_date >= td; })
					.sort(function(a,b){
						if (a.event_date !== b.event_date) return a.event_date.localeCompare(b.event_date);
						return (a.event_time||'').localeCompare(b.event_time||'');
					})
					.slice(0, 7);

				if (loading) return React.createElement('div', { className:'dse-empty' }, 'Loading…');
				if (!upcoming.length) return React.createElement('div', { className:'dse-empty' }, 'No upcoming events.');

				return upcoming.map(function(e) {
					var cs = evtCatStyle(e.event_category);
					return React.createElement('div', { key:e.name, className:'dse-upcoming-item' },
						React.createElement('div', { className:'dse-upcoming-dot', style:{background:cs.color} }),
						React.createElement('div', { className:'dse-upcoming-body' },
							React.createElement('div', { className:'dse-upcoming-date' },
								fmtDateShort(e.event_date) + (e.event_time ? '  ·  '+fmtTime(e.event_time) : ''),
							),
							React.createElement('div', { className:'dse-upcoming-title' }, e.title),
							e.location
								? React.createElement('div', { className:'dse-upcoming-meta' }, '📍 '+e.location)
								: null,
							React.createElement('span', { className:'dse-upcoming-cat', style:{background:cs.bg, color:cs.color} },
								e.event_category || 'Event',
							),
						),
					);
				});
			}

			// ── RENDER ────────────────────────────────────────────────────────
			return React.createElement('div', { className:'ds-event-wrapper' },

				// Topbar
				React.createElement('div', { className:'dse-topbar' },
					React.createElement('div', { className:'dse-topbar-left' },
						React.createElement('h1', null, '📅 Events Calendar'),
						React.createElement('p', null, 'Meetings, calls and networking events'),
					),
					React.createElement('div', { className:'dse-topbar-right' },

						// Team / Mine
						React.createElement('div', { className:'dse-toggle-group' },
							React.createElement('button', {
								className: 'dse-toggle-btn' + (scope==='team'?' on':''),
								onClick: function(){ setScope('team'); },
							}, 'Team'),
							React.createElement('button', {
								className: 'dse-toggle-btn' + (scope==='mine'?' on':''),
								onClick: function(){ setScope('mine'); },
							}, 'Mine'),
						),

						// Month / Day
						React.createElement('div', { className:'dse-toggle-group' },
							React.createElement('button', {
								className: 'dse-toggle-btn' + (view==='month'?' on':''),
								onClick: function(){ setView('month'); setSelDay(null); },
							}, 'Month'),
							React.createElement('button', {
								className: 'dse-toggle-btn' + (view==='day'?' on':''),
								onClick: function(){
									setView('day');
									if (!selDay) setSelDay(todayStr());
								},
							}, 'Day'),
						),

						// Add Event
						React.createElement('button', {
							className: 'dse-btn dse-btn-primary',
							onClick: function(){ setDrawerOpen(true); },
						}, plusIcon(), ' Add Event'),
					),
				),

				// Main grid: calendar + upcoming
				React.createElement('div', { className:'dse-main-grid' },

					// ── Calendar card ───────────────────────────────────────────
					React.createElement('div', { className:'dse-cal-card' },
						// Nav header
						React.createElement('div', { className:'dse-cal-nav' },
							React.createElement('div', { className:'dse-cal-month-label' },
								MONTHS_LONG[month] + ' ' + year,
							),
							React.createElement('div', { className:'dse-cal-nav-right' },
								React.createElement('button', { className:'dse-icon-btn', onClick:function(){ navMonth(-1); } }, chevLeft()),
								view === 'day'
									? React.createElement('button', {
										className: 'dse-btn dse-btn-ghost',
										style: { padding:'4px 10px', fontSize:'11.5px' },
										onClick: function(){ setView('month'); setSelDay(null); },
									  }, '← Month')
									: null,
								React.createElement('button', { className:'dse-icon-btn', onClick:function(){ navMonth(1); } }, chevRight()),
							),
						),

						// Month or Day view body
						view === 'month' ? renderMonthView() : renderDayView(),
					),

					// ── Upcoming sidebar card ────────────────────────────────────
					React.createElement('div', { className:'dse-upcoming-card' },
						React.createElement('div', { className:'dse-card-hdr' },
							React.createElement('span', { className:'dse-card-ttl' }, 'Upcoming'),
							React.createElement('div',  { className:'dse-card-rule' }),
							React.createElement('span', { className:'dse-card-badge' },
								events.filter(function(e){ return e.event_date >= todayStr(); }).length,
							),
						),
						renderUpcoming(),
					),
				),

				// Add Event Drawer
				React.createElement(DrawerAddEvent, {
					open:      drawerOpen,
					onClose:   function(){ setDrawerOpen(false); },
					showToast: showToast,
					refresh:   refresh,
				}),

				// Toast
				toast ? React.createElement(Toast, { msg:toast.msg, type:toast.type }) : null,
			);
		}

		// ── BOOT ───────────────────────────────────────────────────────────
		if (ReactDOM.createRoot) {
			ReactDOM.createRoot(mount).render(React.createElement(DSEventApp));
		} else {
			ReactDOM.render(React.createElement(DSEventApp), mount);
		}

	}); // end frappe.require
}; // end on_page_load