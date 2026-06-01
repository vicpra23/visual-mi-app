const calendarCache = {};

function renderCalendar(container) {
    // Función auxiliar para crear fechas sin problemas de zona horaria (Local Midnight)
    function createLocalDate(year, month, day) {
        return new Date(year, month, day, 0, 0, 0, 0);
    }

    // Función para parsear ISO YYYY-MM-DD a objeto Date local sin saltos
    function parseISOLocal(s) {
        const p = s.split('-');
        return createLocalDate(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]));
    }

    const today = new Date();
    // Iniciar en el lunes de la semana actual (Lógica estable)
    let currentMonday = createLocalDate(today.getFullYear(), today.getMonth(), today.getDate());
    const day = currentMonday.getDay();
    const diff = (day === 0 ? -6 : 1 - day); 
    currentMonday.setDate(currentMonday.getDate() + diff);

    const session = getSessionData();
    const currentUser = session ? session.user : '';
    const isAdmin = (session && session.role === 'Admin');

    const categories = [
        { id: "eci", label: "ECI", color: "#00c853" },
        { id: "mm", label: "MM", color: "#d0021b" },
        { id: "crf", label: "CRF", color: "#2196f3" },
        { id: "mistores", label: "Mi Stores", color: "#ffb800" },
        { id: "osp", label: "OSP", color: "#ff6700" },
        { id: "vdf", label: "VDF", color: "#f44336" }, 
        { id: "mmy", label: "MMY", color: "#9c27b0" },
        { id: "tme", label: "TME", color: "#00bcd4" },
        { id: "interno", label: "Interno", color: "#ffeb3b" },
        { id: "materiales", label: "Materiales", color: "#795548" },
        { id: "otros", label: "Otros", color: "#607d8b" }
    ];

    const html = `
        <div class="calendar-module fade-in">
            <header class="calendar-header-main" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:15px; border-bottom: 1px solid var(--border-main); padding-bottom: 1.5rem;">
                <div class="calendar-controls" style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
                    <div class="btn-group" style="display:flex; gap:4px; background: var(--bg-card); padding: 4px; border-radius: 10px; border: 1px solid var(--border-main);">
                        <button id="prevWeek" class="theme-toggle-btn" style="width:34px; height:34px;"><i data-lucide="chevron-left" style="width:18px;"></i></button>
                        <button id="todayBtn" class="btn-secondary" style="padding:0 15px; font-size: 0.8rem; height:34px; border:none;">Hoy</button>
                        <button id="nextWeek" class="theme-toggle-btn" style="width:34px; height:34px;"><i data-lucide="chevron-right" style="width:18px;"></i></button>
                    </div>
                    
                    <div style="display:flex; align-items:center; gap:5px; background:var(--bg-card); border:1px solid var(--border-main); border-radius:10px; padding:4px 12px; box-shadow: var(--shadow-sm);">
                        <select id="jumpMonth" class="form-control" style="border:none; background:transparent; font-weight:700; cursor:pointer; width:auto; padding:0; height:auto;">
                            ${["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"].map((m, i) => `<option value="${i}">${m}</option>`).join('')}
                        </select>
                        <select id="jumpYear" class="form-control" style="border:none; background:transparent; font-weight:700; cursor:pointer; width:auto; padding:0; height:auto;">
                            <option value="2025">2025</option>
                            <option value="2026">2026</option>
                            <option value="2027">2027</option>
                        </select>
                        <button id="jumpBtn" class="btn-primary" style="padding:2px 10px; font-size: 0.7rem; height:24px; border-radius:6px; margin-left:5px;">Ir</button>
                    </div>

                    <h2 id="weekTitle" style="margin:0; font-weight:800; color:var(--xiaomi-orange); font-size:1.1rem;"></h2>
                </div>
                
                <div class="legend-bar glass-card" style="padding:12px; display:flex; gap:10px; flex-wrap:wrap; font-size:0.65rem; font-weight:800; text-transform: uppercase; letter-spacing: 0.02em; justify-content: center;">
                    ${categories.map(c => `
                        <span style="display:flex; align-items:center; gap:5px;">
                            <i style="width:10px; height:10px; border-radius:3px; background:${c.color}; display:inline-block; flex-shrink:0;"></i> ${c.label}
                        </span>
                    `).join('')}
                    <span style="display:flex; align-items:center; gap:5px;">
                        <i style="width:10px; height:10px; border-radius:3px; background:var(--text-muted); opacity:0.3; display:inline-block; flex-shrink:0;"></i> Vac/Ext
                    </span>
                </div>
            </header>

            <div class="calendar-scroll-shell">
                <div id="calendarTableContainer" class="calendar-table-scroller">
                <table class="calendar-weekly">
                    <thead>
                        <tr id="tableHeader">
                            <th class="trainer-col">Trainer</th>
                        </tr>
                    </thead>
                    <tbody id="tableBody"></tbody>
                </table>
                </div>
            </div>
            <div id="loadingOverlay" style="text-align:center; padding:2rem; display:none;">
                <div class="loader"></div>
                <p>Sincronizando equipo...</p>
            </div>
        </div>
    `;

    container.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    document.getElementById('jumpMonth').value = currentMonday.getMonth();
    document.getElementById('jumpYear').value = currentMonday.getFullYear();
    document.getElementById('jumpBtn').onclick = () => {
        const m = parseInt(document.getElementById('jumpMonth').value);
        const y = parseInt(document.getElementById('jumpYear').value);
        const d = createLocalDate(y, m, 1);
        const day = d.getDay();
        const diff = (day === 0 ? -6 : 1 - day);
        currentMonday = createLocalDate(y, m, 1); currentMonday.setDate(currentMonday.getDate() + diff);
        loadWeek();
    };

    loadWeek();

    async function loadWeek() {
        const loader = document.getElementById('loadingOverlay');
        const tableCont = document.getElementById('calendarTableContainer');
        loader.style.display = 'block'; tableCont.style.opacity = '0.3';

        const weekEnd = new Date(currentMonday); weekEnd.setDate(weekEnd.getDate() + 6);
        const startISO = toISO(currentMonday), endISO = toISO(weekEnd);
        const cacheKey = `${startISO}_${endISO}`;
        
        const weekNum = getWeekNumber(currentMonday);
        const monthName = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"][currentMonday.getMonth()];
        const wTitle = document.getElementById('weekTitle');
        if (wTitle) wTitle.innerText = `${monthName} ${currentMonday.getFullYear()} - Sem ${weekNum}`;

        if (calendarCache[cacheKey]) {
            loader.style.display = 'none'; tableCont.style.opacity = '1';
            renderWeeklyTable(calendarCache[cacheKey].users, calendarCache[cacheKey].schedule, calendarCache[cacheKey].blocks);
        }

        try {
            const [usersRes, scheduleRes] = await Promise.all([
                api.getUsersList(),
                api.getWeekly({ start: startISO, end: endISO })
            ]);

            loader.style.display = 'none'; tableCont.style.opacity = '1';

            if (usersRes.status === 'success' && scheduleRes.status === 'success') {
                calendarCache[cacheKey] = { users: usersRes.data, schedule: scheduleRes.schedule, blocks: scheduleRes.blocks };
                renderWeeklyTable(usersRes.data, scheduleRes.schedule, scheduleRes.blocks);
                if (typeof lucide !== 'undefined') lucide.createIcons();
            } else {
                const err = usersRes.message || scheduleRes.message || "Error desconocido";
                loader.innerHTML = `<p style="color:var(--status-rejected-text); font-weight:bold; display:flex; align-items:center; justify-content:center; gap:8px;"><i data-lucide="alert-triangle"></i> Error: ${err}</p>`;
                loader.style.display = 'block';
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
        } catch(e) { 
            console.error(e); 
            loader.style.display = 'none'; 
            tableCont.style.opacity = '1';
            alert("Error al cargar calendario: " + e.message);
        }
    }

    function renderWeeklyTable(users, schedule, blocks) {
        const header = document.getElementById('tableHeader'); if(!header) return;
        header.innerHTML = '<th class="trainer-col">Trainer</th>';
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(currentMonday); d.setDate(d.getDate() + i);
            const iso = toISO(d);
            const label = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"][i];
            const th = document.createElement('th');
            th.innerHTML = `${label}<br><span style="font-size:0.65rem; opacity:0.9; font-weight:800;">${d.getDate()}/${d.getMonth()+1}</span>`;
            header.appendChild(th);
            days.push({ iso, isWeekend: (i >= 5) });
        }

        const body = document.getElementById('tableBody'); if(!body) return;
        body.innerHTML = '';

        users.forEach(userObj => {
            const userId = (typeof userObj === 'object') ? userObj.user : userObj;
            const displayName = (typeof userObj === 'object' && userObj.name) ? userObj.name : userId;
            
            if (userId === "Training Manager" || displayName === "Training Manager") return;
            
            const tr = document.createElement('tr');
            const tdName = document.createElement('td');
            tdName.className = 'trainer-col'; 
            tdName.innerText = displayName;
            tr.appendChild(tdName);

            days.forEach(day => {
                const td = document.createElement('td');
                td.className = 'day-cell';
                if (day.isWeekend) td.classList.add('day-wknd');
                
                const userBlocks = blocks[userId] || blocks[userId.toLowerCase()] || {};
                const vHist = userBlocks.vacationInfo || [];
                const matchedVaca = vHist.find(h => isInRange(day.iso, h.fechas));
                const isHoliday = userBlocks[day.iso] === "FESTIVO";

                const dayItems = (schedule[day.iso] && (schedule[day.iso][userId] || schedule[day.iso][userId.toLowerCase()])) 
                    ? (schedule[day.iso][userId] || schedule[day.iso][userId.toLowerCase()]) 
                    : [];

                if (matchedVaca) {
                    td.classList.add('day-blocked');
                    td.innerHTML = `<div class="assignment-tag" style="background:var(--text-muted); opacity:0.6; color:white; font-size:0.6rem;">${matchedVaca.status === 'Pendiente' ? 'SOLICITUD' : 'VACACIONES'}</div>`;
                } else if (isHoliday) {
                    const canEditHoliday = isAdmin;
                    if (!canEditHoliday) td.classList.add('day-blocked');
                    let itemsHtml = `<div class="assignment-tag cat-fest">FESTIVO</div>`;
                    itemsHtml += dayItems.map(it => `<div class="assignment-tag cat-${it.category}">${linkify(it.text)}</div>`).join('');
                    td.innerHTML = itemsHtml;
                    if (canEditHoliday) td.onclick = (e) => { if (e.target.tagName !== 'A') openEditModal(userId, day.iso, dayItems); };
                } else {
                    const canEdit = (isAdmin || (userId === currentUser && !day.isWeekend));
                    if (!canEdit) td.classList.add('day-blocked');
                    td.innerHTML = dayItems.map(it => `<div class="assignment-tag cat-${it.category}">${linkify(it.text)}</div>`).join('') || (canEdit ? '<div style="color:var(--text-muted); opacity:0.6; font-size:0.6rem; text-align:center;">Libre</div>' : '');
                    if (canEdit) td.onclick = (e) => { if (e.target.tagName !== 'A') openEditModal(userId, day.iso, dayItems); };
                }
                tr.appendChild(td);
            });
            body.appendChild(tr);
        });
    }

    function openEditModal(userId, date, currentItems) {
        const overlay = document.createElement('div'); overlay.className = 'calendar-overlay';
        const modal = document.createElement('div'); modal.className = 'calendar-edit-modal';
        function createItemRow(it) {
            const div = document.createElement('div');
            div.className = 'assignment-row';
            div.style.cssText = 'display:flex; gap:5px; margin-bottom:8px; align-items:center;';
            div.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:2px;">
                    <button type="button" class="btn-secondary move-up" style="padding:0; width:22px; height:20px; font-size:10px;"><i data-lucide="chevron-up" style="width:12px;"></i></button>
                    <button type="button" class="btn-secondary move-down" style="padding:0; width:22px; height:20px; font-size:10px;"><i data-lucide="chevron-down" style="width:12px;"></i></button>
                </div>
                <select class="form-control sel-cat" style="flex:1; padding:6px; font-size: 0.8rem;">
                    ${categories.map(c => `<option value="${c.id}" ${it && c.id === it.category ? 'selected' : ''}>${c.label}</option>`).join('')}
                </select>
                <textarea class="form-control inp-text" style="flex:2; padding:8px; font-size:0.75rem; border:1px solid var(--border-main); border-radius:10px; resize:vertical; min-height:45px;" placeholder="Detalle...">${it ? it.text : ''}</textarea>
                <button type="button" class="btn-outline danger" onclick="this.parentElement.remove()" style="padding:0; width:34px; height:34px; display:flex; align-items:center; justify-content:center;"><i data-lucide="x" style="width:16px;"></i></button>
            `;
            div.querySelector('.move-up').onclick = () => { if(div.previousElementSibling) div.parentElement.insertBefore(div, div.previousElementSibling); };
            div.querySelector('.move-down').onclick = () => { if(div.nextElementSibling) div.parentElement.insertBefore(div.nextElementSibling, div); };
            return div;
        }

        modal.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h4 style="margin:0; font-size: 1.25rem;">${userId}</h4>
                <div style="font-size:0.75rem; color:var(--text-muted); font-weight:600; display:flex; align-items:center; gap:5px;"><i data-lucide="calendar" style="width:14px;"></i> ${date}</div>
            </div>
            <div id="itemsContainer"></div>
            <button type="button" id="addItem" class="btn-secondary" style="width:100%; margin-top:15px; font-size:0.75rem; height:36px; border-style:dashed;">+ Añadir opción</button>
            <div style="display:flex; gap:10px; margin-top:25px;">
                <button id="cancelModal" class="btn-outline" style="flex:1;">Cerrar</button>
                <button id="saveModal" class="btn-primary" style="flex:1;">Guardar</button>
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(modal);
        const container = document.getElementById('itemsContainer');
        currentItems.forEach(it => container.appendChild(createItemRow(it)));
        container.appendChild(createItemRow(null));
        document.getElementById('addItem').onclick = () => {
            container.appendChild(createItemRow(null));
            if (typeof lucide !== 'undefined') lucide.createIcons();
        };
        const close = () => { overlay.remove(); modal.remove(); };
        document.getElementById('cancelModal').onclick = close;
        overlay.onclick = close;
        if (typeof lucide !== 'undefined') lucide.createIcons();

        document.getElementById('saveModal').onclick = async () => {
            const rows = container.querySelectorAll('.assignment-row');
            const newItems = [];
            rows.forEach(r => {
                const cat = r.querySelector('.sel-cat').value;
                const txt = r.querySelector('.inp-text').value.trim();
                if(txt) newItems.push({ text: txt, category: cat });
            });
            document.getElementById('saveModal').innerText = 'Guardando...';
            document.getElementById('saveModal').disabled = true;
            const res = await api.saveAssignment({ user: userId, date: date, items: newItems, modifiedBy: currentUser });
            if (res.status === 'success') { 
                delete calendarCache[toISO(currentMonday) + "_" + toISO(new Date(currentMonday.getTime() + 6*86400000))];
                close(); loadWeek(); 
            } else { alert("Error: " + res.message); document.getElementById('saveModal').innerText = 'Guardar'; document.getElementById('saveModal').disabled = false; }
        };
    }

    function linkify(text) {
        if (!text) return "";
        const str = text.toString();
        const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|meet\.google\.com\/[^\s]+|teams\.microsoft\.com\/[^\s]+)/gi;
        return str.replace(urlRegex, (url) => {
            let href = url; if (!url.startsWith('http')) href = 'http://' + url;
            return `<a href="${href}" target="_blank" style="color:white; text-decoration:underline; font-weight:bold;">Link</a>`;
        });
    }

    function toISO(d) { return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,'0') + "-" + String(d.getDate()).padStart(2,'0'); }
    
    function isInRange(iso, rangeStr) {
        if(!rangeStr) return false;
        try {
            const targetTime = parseISOLocal(iso).getTime();
            const matches = rangeStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/g);
            if (!matches) return false;
            const parseDate = (str) => {
                const p = str.split('/');
                let y = parseInt(p[2]); if (y < 100) y += 2000;
                return createLocalDate(y, parseInt(p[1]) - 1, parseInt(p[0])).getTime();
            };
            const start = parseDate(matches[0]);
            if (matches.length === 1) return targetTime === start;
            const end = parseDate(matches[matches.length-1]);
            return targetTime >= start && targetTime <= end;
        } catch(e) { return false; }
    }
    
    function getWeekNumber(d) {
        const date = new Date(d.getTime());
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
        const week1 = new Date(date.getFullYear(), 0, 4);
        return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    }

    document.getElementById('prevWeek').onclick = () => { currentMonday.setDate(currentMonday.getDate() - 7); loadWeek(); };
    document.getElementById('nextWeek').onclick = () => { currentMonday.setDate(currentMonday.getDate() + 7); loadWeek(); };
    document.getElementById('todayBtn').onclick = () => {
        const d = new Date(); 
        currentMonday = createLocalDate(d.getFullYear(), d.getMonth(), d.getDate());
        const day = currentMonday.getDay(); const diff = (day === 0 ? -6 : 1 - day);
        currentMonday.setDate(currentMonday.getDate() + diff);
        loadWeek();
    };
}
window.renderCalendar = renderCalendar;