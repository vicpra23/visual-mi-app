function renderDashboard(container) {
    try {
        let session = getSessionData();
        const role = session ? session.role : 'User';
        const currentUser = session ? session.user : 'Desconocido';
        const nickname = session ? session.name : 'Desconocido';
        const realName = nickname || currentUser;
        const isAdmin = (role === 'Admin');

        const masterMobiles = ["Redmi 15 Series", "Redmi 15C Series", "Redmi A5", "Redmi A7 Pro", "Redmi Note 15 Series", "Xiaomi 17 series", "Xiaomi 17T Series"];
        const masterEcosystem = ["Air Fryer Series", "Aire Acondicionado", "Cámaras de Vigilancia", "Frigorífico", "Lavadora", "Redmi Buds 8 Series", "Redmi Pad 2 9,7\"", "Redmi Pad 2 Pro Series", "Redmi Pad 2 Series", "Redmi Watch 5 Series", "Redmi Watch 6 Series", "Robot Vacuum", "Scooters", "TV A 2026 Series", "TV S 2026 Series", "Vacuum", "Xiaomi Band 10 Series", "Xiaomi Buds 5 Series", "Xiaomi Buds 6 Series", "Xiaomi Openwear Stereo Series", "Xiaomi Pad 8 Series", "Xiaomi Watch 5 Series", "Xiaomi Watch S4 Series", "Xiaomi Watch S5 Series"];
        const masterDevices = [...masterMobiles, ...masterEcosystem].sort();

        const parseISO = (s) => {
            if (!s) return new Date();
            const p = s.split('T')[0].split('-');
            if (p.length !== 3) return new Date(s);
            return new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]));
        };

        // Helper para pintar la fecha perfecta en el HTML sin saltos de zona horaria
        const formatDateSafe = (dateStr) => {
            if (!dateStr) return '';
            if (dateStr.includes('-')) {
                const p = dateStr.split('T')[0].split('-');
                if (p.length === 3) {
                    // Creamos a mediodía para evitar cualquier salto por desfase de horas en el navegador
                    return new Date(parseInt(p[0]), parseInt(p[1])-1, parseInt(p[2]), 12, 0, 0).toLocaleDateString();
                }
            }
            return new Date(dateStr).toLocaleDateString();
        };

        // El redimensionamiento ahora lo gestiona Chart.js automáticamente con ResizeObserver
        // gracias a que el tamaño de los contenedores está definido en CSS (clamp + media queries).
        if (window._dashResizeHandler) window.removeEventListener('resize', window._dashResizeHandler);
        window._dashResizeHandler = () => {
            // Solo si queremos actualizar fuentes o algo muy específico al cambiar de modo (móvil/desktop)
            // pero el re-render total ya no es necesario.
            if (window.location.hash === '#dashboard' && window.weeklyChart) {
                 // Chart.js hará el reflow por sí solo.
            }
        };
        window.addEventListener('resize', window._dashResizeHandler);

    const filterCard = isAdmin ? `
        <div class="glass-card" style="margin-bottom: 2rem; position: relative; z-index: 10;">
            <div style="display:flex; flex-wrap:wrap; gap:16px; align-items:flex-end; justify-content:center;">
                <div class="form-group" style="margin:0; min-width: 130px; flex: 0 1 auto; text-align: center;">
                    <label class="form-label" style="display: block; width: 100%;">Trainer</label>
                    <select id="dashboardTarget" class="form-control">
                        <option value="Total">Dato Global</option>
                        <option value="${currentUser}">Solo Mío</option>
                    </select>
                </div>
                
                <div id="periodFiltersContainer" style="display:flex; flex-wrap:wrap; gap:16px; align-items:flex-end; justify-content:center;">
                    <div class="form-group" style="margin:0; min-width: 80px; flex: 0 1 auto; text-align: center;">
                        <label class="form-label" style="display: block; width: 100%;">Año</label>
                        <select id="dashboardYear" class="form-control" onchange="window.onDashboardYearChange()">
                            <option value="Todos">Todos</option>
                        </select>
                    </div>
                    <div class="form-group" style="margin:0; position: relative; min-width: 120px; flex: 0 1 auto; text-align: center;">
                        <label class="form-label" style="display: block; width: 100%;">Meses (Multi)</label>
                        <div id="multiMonthContainer" class="form-control" style="height: 42px; overflow-y: auto; display: flex; flex-wrap: wrap; gap: 4px; padding: 4px; cursor: pointer; background: var(--bg-main); border: 1px solid var(--border-main); border-radius: 8px; justify-content: center; align-items:center;">
                            <span style="color: var(--text-muted); font-size: 0.8rem; padding: 4px;">Todos</span>
                        </div>
                        <input type="hidden" id="dashboardMonth" value="Todos">
                    </div>
                    <div class="form-group" style="margin:0; position: relative; min-width: 180px; flex: 0 1 auto; text-align: center;">
                        <label class="form-label" style="display: block; width: 100%;">Semanas (Multi)</label>
                        <div id="multiWeekContainer" class="form-control" style="height: 42px; overflow-y: auto; display: flex; flex-wrap: wrap; gap: 4px; padding: 4px; cursor: pointer; background: var(--bg-main); border: 1px solid var(--border-main); border-radius: 8px; justify-content: center; align-items:center;">
                            <span style="color: var(--text-muted); font-size: 0.8rem; padding: 4px;">Selecciona periodo...</span>
                        </div>
                        <input type="hidden" id="dashboardWeek" value="">
                    </div>
                </div>

                <div id="rangeFiltersContainer" style="display:none; flex-wrap:wrap; gap:16px; align-items:flex-end; justify-content:center;">
                    <div class="form-group" style="margin:0; min-width: 140px; flex: 0 1 auto; text-align: center;">
                        <label class="form-label" style="display: block; width: 100%;">Desde</label>
                        <input type="date" id="dashboardDateStart" class="form-control" style="height: 42px; font-size: 0.85rem; text-align:center;">
                    </div>
                    <div class="form-group" style="margin:0; min-width: 140px; flex: 0 1 auto; text-align: center;">
                        <label class="form-label" style="display: block; width: 100%;">Hasta</label>
                        <input type="date" id="dashboardDateEnd" class="form-control" style="height: 42px; font-size: 0.85rem; text-align:center;">
                    </div>
                </div>

                <div class="form-group" style="margin:0; min-width: 110px; flex: 0 1 auto; text-align: center;">
                    <label class="form-label" style="display: block; width: 100%;">Dispositivo</label>
                    <select id="dashboardDevice" class="form-control">
                        <option value="Todos">Todos</option>
                    </select>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button id="btnToggleRange" class="btn-secondary" style="height:42px; width: 42px; padding:0; display:flex; align-items:center; justify-content:center;" title="Alternar Rango/Periodos"><i data-lucide="calendar" style="width:18px;"></i></button>
                    <button id="btnFilter" class="btn-primary" style="height:42px; width: 42px; padding:0; display:flex; align-items:center; justify-content:center;" title="Filtrar"><i data-lucide="search" style="width:18px;"></i></button>
                    <button id="btnClearFilters" class="btn-secondary" style="height:42px; width: 42px; padding:0; display:flex; align-items:center; justify-content:center;" title="Borrar Filtros"><i data-lucide="refresh-ccw" style="width:16px;"></i></button>
                </div>
            </div>
        </div>` : `
        <div class="glass-card" style="margin-left: 0; margin-right: auto; margin-bottom: 2rem; max-width: 500px; padding: 0.75rem 1.25rem; position: relative; z-index: 10;">
            <div style="display:flex; flex-wrap:wrap; gap:12px; align-items:flex-end; justify-content:flex-start;">
                <div id="periodFiltersContainer" style="display:flex; gap:12px;">
                    <div class="form-group" style="margin:0; min-width: 180px; flex: 0 1 auto; text-align: center;">
                        <label class="form-label" style="display: block; width: 100%;">Semana</label>
                        <select id="dashboardWeek" class="form-control"></select>
                    </div>
                </div>
                <div id="rangeFiltersContainer" style="display:none; flex-wrap:wrap; gap:12px; align-items:flex-end; justify-content:flex-start;">
                    <div class="form-group" style="margin:0; min-width: 140px; flex: 0 1 auto; text-align: center;">
                        <label class="form-label" style="display: block; width: 100%;">Desde</label>
                        <input type="date" id="dashboardDateStart" class="form-control" style="height: 42px; font-size: 0.85rem; text-align:center;">
                    </div>
                    <div class="form-group" style="margin:0; min-width: 140px; flex: 0 1 auto; text-align: center;">
                        <label class="form-label" style="display: block; width: 100%;">Hasta</label>
                        <input type="date" id="dashboardDateEnd" class="form-control" style="height: 42px; font-size: 0.85rem; text-align:center;">
                    </div>
                </div>
                <div style="display:flex; gap:8px;">
                    <button id="btnToggleRange" class="btn-secondary" style="height:42px; width: 42px; padding:0; display:flex; align-items:center; justify-content:center;" title="Alternar Rango/Periodos"><i data-lucide="calendar" style="width:18px;"></i></button>
                    <button id="btnFilter" class="btn-primary" style="height:42px; width:42px; padding:0; display:flex; align-items:center; justify-content:center;"><i data-lucide="search" style="width:20px;"></i></button>
                    <button id="btnClearFilters" class="btn-secondary" style="height:42px; width: 42px; padding:0; display:flex; align-items:center; justify-content:center;"><i data-lucide="refresh-ccw" style="width:18px;"></i></button>
                </div>
            </div>
        </div>`;

    const html = `
        <div class="dash-module fade-in" style="max-width: 1400px; margin: 0 auto;">
            <header class="dash-header" style="margin-bottom: 4rem; text-align: center; padding-top: 2rem;">
                <h2 style="font-size: 2.5rem; letter-spacing: -0.04em; margin-bottom: 0.5rem;">&iexcl;Hola, ${realName}! <i data-lucide="sparkles" style="color: var(--xiaomi-orange); width: 32px; vertical-align: middle;"></i></h2>
                <p id="dashPeriodText" style="color: var(--text-medium); font-weight: 500; font-size: 1.1rem; justify-content: center; display: flex; align-items: center; gap: 8px;">
                    ${isAdmin ? '<i data-lucide="line-chart" style="width:20px;"></i> Panel de Supervisión Global' : '<i data-lucide="zap" style="width:20px;"></i> Tu impacto semanal en Xiaomi'}
                </p>
            </header>

            ${filterCard}

            <div class="bento-grid">
                <div class="glass-card bento-item" style="grid-column: span 2; grid-row: span 2; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; position: relative; overflow: hidden;">
                    <h3 style="font-size: 1.25rem; color: var(--text-medium); font-weight: 500; position: relative; z-index: 2; margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; gap: 10px;">
                        <i data-lucide="activity" style="color: var(--text-medium); width: 22px;"></i>
                        Actividades Registradas
                    </h3>
                    <div id="stat_count" style="font-size: clamp(3.5rem, 15vw, 5.5rem); font-weight: 800; line-height: 1; letter-spacing: -0.05em; font-family: var(--font-heading); position: relative; z-index: 2; color: var(--xiaomi-orange);">0</div>
                </div>

                <div class="glass-card bento-item" style="grid-column: span 2; display: flex; align-items: center; justify-content: center; text-align: center; padding: 2rem; position: relative; overflow: hidden;">
                    <div style="position: relative; z-index: 2;">
                        <h4 style="color: var(--text-muted); text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.1em; margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <i data-lucide="users" style="color: var(--text-muted); width: 16px;"></i>
                            Alumnos Formados
                        </h4>
                        <div id="stat_alumnos" style="font-size: clamp(2rem, 10vw, 2.5rem); font-weight: 800; font-family: var(--font-heading); color: #059669;">0</div>
                    </div>
                </div>

                <div class="glass-card bento-item" style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 1.5rem; position: relative; overflow: hidden;">
                    <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; position: relative; z-index: 2; display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                        <i data-lucide="layers" style="color: var(--text-muted); width: 14px;"></i>
                        Sesiones
                    </span>
                    <div id="stat_sesiones" style="font-size: 2rem; font-weight: 800; font-family: var(--font-heading); position: relative; z-index: 2; color: #3b82f6;">0</div>
                </div>

                <div class="glass-card bento-item" style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 1.5rem; position: relative; overflow: hidden;">
                    <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; position: relative; z-index: 2; display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                        <i data-lucide="clock" style="color: var(--text-muted); width: 14px;"></i>
                        Horas
                    </span>
                    <div id="stat_horas" style="font-size: 2rem; font-weight: 800; font-family: var(--font-heading); position: relative; z-index: 2; color: #8b5cf6;">0</div>
                </div>
            </div>

            <div class="charts-container">
                <div class="glass-card">
                    <h3 style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 2rem; letter-spacing: 0.1em; display: flex; align-items: center; gap: 10px;"><i data-lucide="bar-chart-3" style="width:18px;"></i> Tendencia Semanal</h3>
                    <div class="chart-wrapper"><canvas id="chartWeekly"></canvas></div>
                </div>
                <div class="glass-card">
                    <h3 style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 2rem; letter-spacing: 0.1em; display: flex; align-items: center; gap: 10px;"><i data-lucide="pie-chart" style="width:18px;"></i> Distribución por Método</h3>
                    <div class="chart-wrapper" style="display: flex; justify-content: center;"><canvas id="chartMethods"></canvas></div>
                </div>
            </div>

            ${isAdmin ? `
            <div id="adminWidgets" class="admin-charts-container">
                <div class="glass-card" style="padding:0; overflow:hidden;">
                    <div style="padding:1.5rem; border-bottom:1px solid var(--border-main); display:flex; align-items:center; gap:10px;">
                        <i data-lucide="building" style="color: var(--text-muted); width:18px;"></i>
                        <h3 style="margin:0; font-size: 0.9rem; color: var(--text-medium); text-transform: uppercase; letter-spacing: 0.05em;">Impacto por Cuenta</h3>
                    </div>
                    <div style="overflow-x:auto;">
                        <table id="accountTable" class="report-table" style="width:100%; border-collapse:collapse; font-size:0.85rem;">
                            <thead style="background: var(--bg-main);">
                                <tr>
                                    <th style="padding:12px 15px; text-align:left; color: var(--text-muted); font-weight: 700;">Cuenta</th>
                                    <th style="padding:12px 15px; text-align:center; color: var(--text-muted); font-weight: 700;">Sesiones</th>
                                    <th style="padding:12px 15px; text-align:center; color: var(--text-muted); font-weight: 700;">Personas</th>
                                </tr>
                            </thead>
                            <tbody id="accountTableBody"></tbody>
                        </table>
                    </div>
                </div>
                <div class="glass-card">
                    <div style="display:flex; align-items:center; gap:10px; margin-bottom: 2rem;">
                        <i data-lucide="award" style="color: var(--xiaomi-orange); width:18px;"></i>
                        <h3 style="margin:0; font-size: 0.9rem; color: var(--text-medium); text-transform: uppercase; letter-spacing: 0.05em;">Rendimiento Trainers</h3>
                    </div>
                    <div class="chart-wrapper"><canvas id="chartTrainers"></canvas></div>
                </div>
            </div>
            ` : ''}

            <div class="glass-card" style="padding: 0; overflow: hidden; border-radius: 32px;">
                <div style="padding: 2.5rem; border-bottom: 1px solid var(--border-main);">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; margin-bottom: 2rem;">
                        <h3 style="margin:0; font-size: 1.4rem; display: flex; align-items: center; gap: 12px;"><i data-lucide="history" style="color: var(--xiaomi-orange);"></i> Historial de Actividad</h3>
                        <div style="display: flex; gap: 10px; justify-content: flex-end;">
                            <button id="btnToggleHistoryRange" class="btn-secondary" style="height: 44px; width: 44px; display: flex; align-items: center; justify-content: center; border-radius: 12px; padding: 0; border: 1px solid var(--border-main);" title="Alternar Rango/Periodos">
                                <i data-lucide="calendar" style="width:20px;"></i>
                            </button>
                            <button onclick="window.dashboardLoadHistory()" class="btn-primary" style="height: 44px; width: 44px; display: flex; align-items: center; justify-content: center; border-radius: 12px; padding: 0;" title="Filtrar">
                                <i data-lucide="search" style="width:20px;"></i>
                            </button>
                            <button id="btnClearHistory" class="btn-outline" style="height: 44px; width: 44px; display: flex; align-items: center; justify-content: center; border-radius: 12px; padding: 0; border: 1px solid var(--border-main);" title="Limpiar Filtros">
                                <i data-lucide="rotate-ccw" style="width:20px;"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="filters-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin-bottom: 1.5rem;">
                        ${isAdmin ? `
                        <div class="form-group" style="margin:0;">
                            <label class="filter-label" style="font-size: 0.65rem; color: var(--text-muted); font-weight: 800; text-transform: uppercase; margin-bottom: 4px; display: block;">Trainer</label>
                            <select id="histFilterTrainer" class="form-control" style="height: 36px; font-size: 0.8rem; margin:0;" onchange="window.dashboardLoadHistory()">
                                <option value="Total">Dato Global</option>
                            </select>
                        </div>` : ''}
                        <div id="histPeriodMonth" class="form-group" style="margin:0;">
                            <label class="filter-label" style="font-size: 0.7rem; color: var(--graphite-medium); font-weight: 800; text-transform: uppercase; margin-bottom: 4px; display: block;">Mes</label>
                            <select id="histFilterMonth" class="form-control" style="font-size: 0.8rem; margin:0;" onchange="window.dashboardLoadHistory()">
                                <option value="Todos">Todos</option>
                            </select>
                        </div>
                        <div id="histPeriodWeek" class="form-group" style="margin:0;">
                            <label class="filter-label" style="font-size: 0.7rem; color: var(--graphite-medium); font-weight: 800; text-transform: uppercase; margin-bottom: 4px; display: block;">Semana</label>
                            <select id="histFilterWeek" class="form-control" style="font-size: 0.8rem; margin:0;" onchange="window.dashboardLoadHistory()">
                                <option value="Todos">Todas</option>
                            </select>
                        </div>
                        <div id="histRangeStart" class="form-group" style="margin:0; display:none;">
                            <label class="filter-label" style="font-size: 0.7rem; color: var(--graphite-medium); font-weight: 800; text-transform: uppercase; margin-bottom: 4px; display: block;">Desde</label>
                            <input type="date" id="histFilterDateStart" class="form-control" style="font-size: 0.85rem; margin:0;" onchange="window.dashboardLoadHistory()">
                        </div>
                        <div id="histRangeEnd" class="form-group" style="margin:0; display:none;">
                            <label class="filter-label" style="font-size: 0.7rem; color: var(--graphite-medium); font-weight: 800; text-transform: uppercase; margin-bottom: 4px; display: block;">Hasta</label>
                            <input type="date" id="histFilterDateEnd" class="form-control" style="font-size: 0.85rem; margin:0;" onchange="window.dashboardLoadHistory()">
                        </div>
                        <div class="form-group" style="margin:0;">
                            <label class="filter-label" style="font-size: 0.7rem; color: var(--graphite-medium); font-weight: 800; text-transform: uppercase; margin-bottom: 4px; display: block;">Cuenta</label>
                            <select id="histFilterAccount" class="form-control" style="font-size: 0.8rem; margin:0;" onchange="window.dashboardLoadHistory()">
                                <option value="Todos">Todas</option>
                            </select>
                        </div>
                        <div class="form-group" style="margin:0;">
                            <label class="filter-label" style="font-size: 0.7rem; color: var(--graphite-medium); font-weight: 800; text-transform: uppercase; margin-bottom: 4px; display: block;">Dispositivo</label>
                            <select id="histFilterDevice" class="form-control" style="font-size: 0.8rem; margin:0;" onchange="window.dashboardLoadHistory()">
                                <option value="Todos">Todos</option>
                            </select>
                        </div>
                        <div class="form-group" style="margin:0;">
                            <label class="filter-label" style="font-size: 0.7rem; color: var(--graphite-medium); font-weight: 800; text-transform: uppercase; margin-bottom: 4px; display: block;">Metodología</label>
                            <select id="histFilterMethod" class="form-control" style="font-size: 0.8rem; margin:0;" multiple onchange="window.dashboardLoadHistory()">
                                <option value="Todos">Todos</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div style="overflow-x: auto;">
                    <table class="report-table" style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                        <thead style="background: #f8fafc;">
                            <tr>
                                <th style="padding: 12px; text-align: left; color: var(--text-muted); cursor: pointer;" onclick="window.sortHistory('fecha')">Fecha <i data-lucide="chevrons-up-down" style="width:12px; vertical-align:middle;"></i></th>
                                ${isAdmin ? `<th style="padding: 12px; text-align: left; color: var(--text-muted); cursor: pointer;" onclick="window.sortHistory('trainer')">Trainer <i data-lucide="chevrons-up-down" style="width:12px; vertical-align:middle;"></i></th>` : ''}
                                <th style="padding: 12px; text-align: left; color: var(--text-muted); cursor: pointer;" onclick="window.sortHistory('cuenta')">Cuenta <i data-lucide="chevrons-up-down" style="width:12px; vertical-align:middle;"></i></th>
                                <th style="padding: 12px; text-align: left; color: var(--text-muted);">Metodología</th>
                                <th style="padding: 12px; text-align: center; color: var(--text-muted); cursor: pointer;" onclick="window.sortHistory('alumnos')">Alumnos <i data-lucide="chevrons-up-down" style="width:12px; vertical-align:middle;"></i></th>
                                <th style="padding: 12px; text-align: center; color: var(--text-muted); cursor: pointer;" onclick="window.sortHistory('duracion')">Horas <i data-lucide="chevrons-up-down" style="width:12px; vertical-align:middle;"></i></th>
                                <th style="padding: 12px; text-align: right; color: var(--text-muted);">Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="historyBody">
                            <tr><td colspan="6" style="padding: 2rem; text-align: center; color: #94a3b8;">Cargando historial...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div id="modalReport" class="calendar-overlay">
             <div class="glass-card" style="max-width: 500px; width: 90%; margin: auto; position: relative;">
                <button style="position: absolute; top: 15px; right: 15px; background: none; border: none; color: var(--text-muted); cursor: pointer;" onclick="document.getElementById('modalReport').style.display='none'"><i data-lucide="x" style="width: 20px;"></i></button>
                <h3 id="modalTitle" style="color: var(--xiaomi-orange); margin-bottom: 1rem;">Detalles del Reporte</h3>
                <div id="modalContent" style="font-size: 0.9rem; line-height: 1.6;"></div>
                <button class="btn-primary" style="width: 100%; margin-top: 1.5rem;" onclick="document.getElementById('modalReport').style.display='none'">Cerrar</button>
             </div>
        </div>
    `;

    container.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Limpiar cualquier instancia previa de TomSelect al iniciar
    window.tsInstances = window.tsInstances || {};
    Object.keys(window.tsInstances).forEach(k => {
        try { window.tsInstances[k].destroy(); } catch(e){}
    });
    window.tsInstances = {};

    const initTomSelect = (selectId, placeholder) => {
        if (typeof TomSelect === 'undefined') return;
        const el = document.getElementById(selectId);
        if (!el) return;
        
        if (window.tsInstances[selectId]) {
            try { window.tsInstances[selectId].destroy(); } catch(e){}
        }
        
        const isMultiple = el.hasAttribute('multiple');
        const config = {
            placeholder: placeholder,
            sortField: { field: "text", direction: "asc" },
            dropdownParent: 'body',
            hideSelected: false, // Maintain selected options in the list
            score: function(search) {
                var scoreFunc = this.getScoreFunction(search);
                return function(item) {
                    if (item.value === 'Todos') return 1000; // Todos always on top and visible
                    if (typeof scoreFunc === 'function') {
                        return scoreFunc(item);
                    }
                    return 1;
                };
            },
            onInitialize: function() {
                const wrapper = this.control.parentElement.querySelector('.ts-wrapper');
                if (wrapper) {
                    wrapper.style.minWidth = '120px';
                    wrapper.style.borderRadius = '8px';
                }
            }
        };

        if (isMultiple) {
            config.plugins = {
                'remove_button': {
                    title: 'Eliminar'
                }
            };
            config.onChange = function(values) {
                if (window.isUpdatingHistoryFilters) return;
                
                const valStr = Array.isArray(values) ? values.join(',') : values;
                if (this._lastValue === valStr) return;
                this._lastValue = valStr;

                if (Array.isArray(values)) {
                    if (values.length === 0) {
                        setTimeout(() => {
                            this.addItem('Todos', true);
                            if (selectId.includes('histFilter')) window.dashboardLoadHistory();
                        }, 0);
                        return;
                    } else if (values.length > 1) {
                        if (values[0] === 'Todos') {
                            setTimeout(() => {
                                this.removeItem('Todos', true);
                                if (selectId.includes('histFilter')) window.dashboardLoadHistory();
                            }, 0);
                            return;
                        } else if (values.includes('Todos')) {
                            setTimeout(() => {
                                this.clear(true);
                                this.addItem('Todos', true);
                                if (selectId.includes('histFilter')) window.dashboardLoadHistory();
                            }, 0);
                            return;
                        }
                    }
                }
                
                // For history filters, we want to auto-load on change
                if (selectId.includes('histFilter')) {
                    window.dashboardLoadHistory();
                }
            };
        } else {
            config.onChange = function(values) {
                if (window.isUpdatingHistoryFilters) return;
                
                const valStr = Array.isArray(values) ? values.join(',') : values;
                if (this._lastValue === valStr) return;
                this._lastValue = valStr;

                if (selectId.startsWith('dashboard')) {
                    if (typeof loadStats === 'function') loadStats(false);
                } else {
                    if (typeof window.dashboardLoadHistory === 'function') window.dashboardLoadHistory();
                }
            };
        }
        
        window.tsInstances[selectId] = new TomSelect("#" + selectId, config);
    };

    const weekNumberISO = (d) => {
        let d2 = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d2.setUTCDate(d2.getUTCDate() + 4 - (d2.getUTCDay() || 7));
        return Math.ceil((((d2 - new Date(Date.UTC(d2.getUTCFullYear(), 0, 1))) / 86400000) + 1) / 7);
    };
    const currentWeek = weekNumberISO(new Date());
    
    const weeksList = Array.from({length: 52}, (_, i) => i + 1);
    const sW = document.getElementById('dashboardWeek');
    const hW = document.getElementById('histFilterWeek');
    const mWeekCont = document.getElementById('multiWeekContainer');
    
    // El usuario ha pedido que siempre arranque con la semana actual
    let selectedWeeksSet = new Set([currentWeek]);

    const updateMultiWeekUI = () => {
        if (!mWeekCont) return;
        const sorted = Array.from(selectedWeeksSet).sort((a,b)=>a-b);
        
        if (sorted.length === weeksList.length) {
            mWeekCont.innerHTML = '<span style="color: var(--text-muted); font-size: 0.8rem; padding: 4px;">Todas</span>';
            if(sW) sW.value = sorted.join(',');
        } else if (sorted.length > 8) {
            mWeekCont.innerHTML = `<span class="badge badge-extra" style="font-size: 0.75rem; padding: 4px 8px; margin: 2px;">${sorted.length} Semanas</span>`;
            if(sW) sW.value = sorted.join(',');
        } else {
            mWeekCont.innerHTML = sorted.length ? sorted.map(w => `<span class="badge badge-extra" style="font-size: 0.65rem; padding: 2px 6px; margin: 2px;">Sem ${w}</span>`).join('') : '<span style="color: #94a3b8; font-size: 0.8rem; padding: 4px;">Selecciona periodo...</span>';
            if(sW) sW.value = sorted.join(',');
        }
    };

    const injectWeeks = (select, list, selected = null) => {
        if (!select) return;
        const currentVal = selected || select.value;
        select.innerHTML = select.id.includes('hist') ? '<option value="Todos">Todas</option>' : '';
        list.forEach(w => {
            const opt = document.createElement('option');
            opt.value = w;
            opt.innerText = `Semana ${w}`;
            if(currentVal && w == currentVal) opt.selected = true;
            select.appendChild(opt);
        });
    };

    // Lógica de Multi-Selección de Meses (Pop-up)
    const mMonthCont = document.getElementById('multiMonthContainer');
    const sMonthInput = document.getElementById('dashboardMonth');
    let selectedMonthsSet = new Set(); // Vacío equivale a "Todos"
    const allMonthsList = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    const updateMultiMonthUI = () => {
        if (!mMonthCont) return;
        if (selectedMonthsSet.size === 0) {
            mMonthCont.innerHTML = '<span style="color: var(--text-muted); font-size: 0.8rem; padding: 4px;">Todos</span>';
            if(sMonthInput) sMonthInput.value = "Todos";
        } else {
            const sorted = Array.from(selectedMonthsSet).sort((a,b) => allMonthsList.indexOf(a) - allMonthsList.indexOf(b));
            mMonthCont.innerHTML = sorted.map(m => `<span class="badge badge-approved" style="font-size: 0.65rem; padding: 2px 6px; margin: 2px;">${m.substring(0,3)}</span>`).join('');
            if(sMonthInput) sMonthInput.value = sorted.join(',');
        }
    };
    window.updateMultiMonthUI = updateMultiMonthUI;

    if(isAdmin && mMonthCont) {
        mMonthCont.onclick = (e) => {
            let picker = document.getElementById('monthPickerPop');
            if(picker) { picker.remove(); return; }
            
            picker = document.createElement('div');
            picker.id = 'monthPickerPop';
            picker.style = `position: absolute; top: 100%; left: 0; width: 200px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); z-index: 100; padding: 10px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px;`;
            
            const hdr = document.createElement('button');
            hdr.className = selectedMonthsSet.size === 0 ? 'btn-primary' : 'btn-outline';
            hdr.style = `grid-column: span 3; margin-bottom: 4px; font-size: 0.75rem; height: auto; padding: 4px;`;
            hdr.innerText = "Todos";
            hdr.onclick = (ev) => {
                ev.stopPropagation();
                selectedMonthsSet.clear();
                updateMultiMonthUI();
                picker.remove();
                selectedWeeksSet = new Set(weeksList);
                window.syncWeeksByMonth();
            };
            picker.appendChild(hdr);

            allMonthsList.forEach(m => {
                const isSel = selectedMonthsSet.has(m);
                const btn = document.createElement('button');
                btn.className = isSel ? 'btn-primary' : 'btn-outline';
                btn.style = `padding: 4px; font-size: 0.7rem; height: auto; border-radius: 4px; ${!isSel ? 'border-color: #f1f5f9; color: #64748b;' : ''}`;
                btn.innerText = m.substring(0,3);
                btn.onclick = (ev) => {
                    ev.stopPropagation();
                    if(selectedMonthsSet.has(m)) selectedMonthsSet.delete(m);
                    else selectedMonthsSet.add(m);
                    updateMultiMonthUI();
                    btn.className = selectedMonthsSet.has(m) ? 'btn-primary' : 'btn-outline';
                    btn.style.borderColor = selectedMonthsSet.has(m) ? '' : '#f1f5f9';
                    btn.style.color = selectedMonthsSet.has(m) ? '' : '#64748b';
                    window.syncWeeksByMonth();
                };
                picker.appendChild(btn);
            });
            
            mMonthCont.parentElement.appendChild(picker);
            document.addEventListener('click', function closeM(e) {
                if(!picker.contains(e.target) && !mMonthCont.contains(e.target)) {
                    picker.remove();
                    document.removeEventListener('click', closeM);
                }
            });
        };
    }

    // Lógica de Multi-Selección de Semanas con Botón Contextual "Seleccionar Todas"
    if(isAdmin) {
        updateMultiWeekUI();
        mWeekCont.onclick = (e) => {
            let picker = document.getElementById('weekPickerPop');
            if(picker) { picker.remove(); return; }
            
            picker = document.createElement('div');
            picker.id = 'weekPickerPop';
            picker.style = `position: absolute; top: 100%; left: 0; width: 100%; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); z-index: 100; padding: 10px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; max-height: 220px; overflow-y: auto;`;
            
            const currentActiveWeeks = [];
            const monthStr = document.getElementById('dashboardMonth')?.value || "Todos";
            if (monthStr === "Todos" || monthStr.trim() === "") {
                weeksList.forEach(w => currentActiveWeeks.push(w));
            } else {
                const year = parseInt(document.getElementById('dashboardYear')?.value) || new Date().getFullYear();
                const mNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
                const selectedMonths = monthStr.split(',').map(m => m.trim());
                selectedMonths.forEach(mName => {
                    const mIdx = mNames.indexOf(mName);
                    if (mIdx !== -1) {
                        for (let d = 1; d <= 31; d++) {
                            const date = new Date(year, mIdx, d);
                            if (date.getMonth() !== mIdx) break;
                            const w = weekNumberISO(date);
                            if (!currentActiveWeeks.includes(w)) currentActiveWeeks.push(w);
                        }
                    }
                });
            }
            currentActiveWeeks.sort((a,b)=>a-b);

            const tBtn = document.createElement('button');
            tBtn.className = 'btn-secondary';
            tBtn.style = `grid-column: span 4; margin-bottom: 4px; font-size: 0.75rem; height: auto; padding: 4px;`;
            tBtn.innerText = "Todos";
            tBtn.onclick = (ev) => {
                ev.stopPropagation();
                const allActiveSelected = currentActiveWeeks.every(w => selectedWeeksSet.has(w));
                if (allActiveSelected) {
                    currentActiveWeeks.forEach(w => selectedWeeksSet.delete(w));
                } else {
                    currentActiveWeeks.forEach(w => selectedWeeksSet.add(w));
                }
                updateMultiWeekUI();
                picker.remove();
            };
            picker.appendChild(tBtn);

            currentActiveWeeks.forEach(w => {
                const isSel = selectedWeeksSet.has(w);
                const btn = document.createElement('button');
                btn.className = isSel ? 'btn-primary' : 'btn-outline';
                btn.style = `padding: 4px; font-size: 0.7rem; height: auto; border-radius: 4px; ${!isSel ? 'border-color: #f1f5f9; color: #64748b;' : ''}`;
                btn.innerText = `S${w}`;
                btn.onclick = (ev) => {
                    ev.stopPropagation();
                    if(selectedWeeksSet.has(w)) selectedWeeksSet.delete(w);
                    else selectedWeeksSet.add(w);
                    updateMultiWeekUI();
                    btn.className = selectedWeeksSet.has(w) ? 'btn-primary' : 'btn-outline';
                    btn.style.borderColor = selectedWeeksSet.has(w) ? '' : '#f1f5f9';
                    btn.style.color = selectedWeeksSet.has(w) ? '' : '#64748b';
                };
                picker.appendChild(btn);
            });
            mWeekCont.parentElement.appendChild(picker);
            
            document.addEventListener('click', function close(e) {
                if(!picker.contains(e.target) && !mWeekCont.contains(e.target)) {
                    picker.remove();
                    document.removeEventListener('click', close);
                }
            });
        };
    }
    injectWeeks(hW, weeksList, currentWeek);

    // Lógica de alternado Periodo / Rango de Calendario
    const btnToggle = document.getElementById('btnToggleRange');
    const periodDiv = document.getElementById('periodFiltersContainer');
    const rangeDiv = document.getElementById('rangeFiltersContainer');
    let isRangeMode = false;

    if(btnToggle && periodDiv && rangeDiv) {
        btnToggle.onclick = () => {
            isRangeMode = !isRangeMode;
            if(isRangeMode) {
                periodDiv.style.display = 'none';
                rangeDiv.style.display = 'flex';
                btnToggle.innerHTML = '<i data-lucide="list-filter" style="width:18px;"></i>';
                btnToggle.title = "Cambiar a Filtro por Periodos";
            } else {
                periodDiv.style.display = 'flex';
                rangeDiv.style.display = 'none';
                btnToggle.innerHTML = '<i data-lucide="calendar" style="width:18px;"></i>';
                btnToggle.title = "Cambiar a Rango de Fechas";
            }
            if (typeof lucide !== 'undefined') lucide.createIcons();
        };
    }

    // Toggle para Historial
    const btnToggleHist = document.getElementById('btnToggleHistoryRange');
    const histPeriodMonth = document.getElementById('histPeriodMonth');
    const histPeriodWeek = document.getElementById('histPeriodWeek');
    const histRangeStart = document.getElementById('histRangeStart');
    const histRangeEnd = document.getElementById('histRangeEnd');
    window.isHistoryRangeMode = false;

    if(btnToggleHist && histPeriodMonth && histRangeStart) {
        btnToggleHist.onclick = () => {
            window.isHistoryRangeMode = !window.isHistoryRangeMode;
            if(window.isHistoryRangeMode) {
                if(histPeriodMonth) histPeriodMonth.style.display = 'none';
                if(histPeriodWeek) histPeriodWeek.style.display = 'none';
                if(histRangeStart) histRangeStart.style.display = 'block';
                if(histRangeEnd) histRangeEnd.style.display = 'block';
                btnToggleHist.innerHTML = '<i data-lucide="list-filter" style="width:20px;"></i>';
                btnToggleHist.title = "Cambiar a Filtro por Periodos";
            } else {
                if(histPeriodMonth) histPeriodMonth.style.display = 'block';
                if(histPeriodWeek) histPeriodWeek.style.display = 'block';
                if(histRangeStart) histRangeStart.style.display = 'none';
                if(histRangeEnd) histRangeEnd.style.display = 'none';
                btnToggleHist.innerHTML = '<i data-lucide="calendar" style="width:20px;"></i>';
                btnToggleHist.title = "Cambiar a Rango de Fechas";
            }
            if (typeof lucide !== 'undefined') lucide.createIcons();
            // Optional: loadHistory() to trigger refresh automatically if desired
        };
    }

    window.onDashboardYearChange = () => {
        const dM = document.getElementById('dashboardMonth');
        if(dM) dM.value = "Todos";
        selectedMonthsSet.clear();
        if(window.updateMultiMonthUI) window.updateMultiMonthUI();
        
        // Cuando se cambia el año, automáticamente seleccionamos todas las semanas
        selectedWeeksSet = new Set(weeksList);
        updateMultiWeekUI();
    };

    window.syncWeeksByMonth = () => {
        const monthStr = document.getElementById('dashboardMonth')?.value || "Todos";
        const year = parseInt(document.getElementById('dashboardYear')?.value) || new Date().getFullYear();
        
        const mNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
        const monthWeeks = [];
        
        if (monthStr !== "Todos" && monthStr.trim() !== "") {
            const selectedMonths = monthStr.split(',').map(m => m.trim());
            selectedMonths.forEach(mName => {
                const mIdx = mNames.indexOf(mName);
                if (mIdx === -1) return;
                for (let d = 1; d <= 31; d++) {
                    const date = new Date(year, mIdx, d);
                    if (date.getMonth() !== mIdx) break;
                    const w = weekNumberISO(date);
                    if (!monthWeeks.includes(w)) monthWeeks.push(w);
                }
            });
        }

        if(isAdmin) {
            if(monthStr !== "Todos" && monthStr.trim() !== "") {
                // FIX CRÍTICO: Limpiamos el Set completamente para evitar leak de la semana actual
                selectedWeeksSet = new Set(monthWeeks);
            }
            updateMultiWeekUI();
        } else {
            if (monthStr === "Todos" || monthStr.trim() === "") injectWeeks(sW, weeksList);
            else injectWeeks(sW, monthWeeks);
        }
    };

    const populateAllFilters = () => {
        if (!isAdmin) return;
        
        api.getFilterMetadata({}, true).then(res => {
            if (res.status === 'success') {
                const yS = document.getElementById('dashboardYear');
                const mS = document.getElementById('dashboardMonth');
                const dS = document.getElementById('dashboardDevice');
                
                if (yS) yS.innerHTML = '<option value="Todos">Todos</option>' + res.data.years.map(y => `<option value="${y}">${y}</option>`).join('');
                if (mS && mS.tagName === "SELECT") mS.innerHTML = '<option value="Todos">Todos</option>' + res.data.months.map(m => `<option value="${m}">${m}</option>`).join('');
                
                if (dS) {
                    const reported = new Set(res.data.devices);
                    let opts = '<option value="Todos">Todos</option>';
                    if (isAdmin) {
                        masterDevices.forEach(d => {
                            const hasData = reported.has(d);
                            opts += `<option value="${d}" ${!hasData ? 'disabled style="color:#aaa"' : ''}>${d}${!hasData ? ' (Sin datos)' : ''}</option>`;
                        });
                    } else {
                        res.data.devices.sort().forEach(d => {
                            opts += `<option value="${d}">${d}</option>`;
                        });
                    }
                    dS.innerHTML = opts;
                    initTomSelect('dashboardDevice', 'Busca dispositivo...');
                }
            }
        });

        api.getUsersList({}, true).then(res => {
            if (res.status === 'success') {
                const s = document.getElementById('dashboardTarget');
                const ht = document.getElementById('histFilterTrainer');
                const optionsHtml = `
                    <option value="Total">Dato Global</option>
                    <option value="${currentUser}">Solo Mío</option>
                    <hr>
                    ${res.data.map(u => `<option value="${u.user || u}">${u.name || u}</option>`).join('')}
                `;
                if (s) s.innerHTML = optionsHtml;
                if (ht) ht.innerHTML = optionsHtml;
            }
        });
        
        // Historial (No requiere caché estricto pero se mantiene la lógica)
        api.getFilterMetadata().then(res => {
            if(res.status === 'success') {
                const hM = document.getElementById('histFilterMonth');
                const hA = document.getElementById('histFilterAccount');
                const hD = document.getElementById('histFilterDevice');
                const hMet = document.getElementById('histFilterMethod');
                if(hM) res.data.months.forEach(m => hM.innerHTML += `<option value="${m}">${m}</option>`);
                if(hA) res.data.accounts.forEach(a => hA.innerHTML += `<option value="${a}">${a}</option>`);
                if(hD) {
                    const reported = new Set(res.data.devices);
                    let opts = '<option value="Todos">Todas</option>';
                    if (isAdmin) {
                        masterDevices.forEach(d => {
                            const hasData = reported.has(d);
                            opts += `<option value="${d}" ${!hasData ? 'disabled style="color:#aaa"' : ''}>${d}${!hasData ? ' (Sin datos)' : ''}</option>`;
                        });
                    } else {
                        res.data.devices.sort().forEach(d => {
                            opts += `<option value="${d}">${d}</option>`;
                        });
                    }
                    hD.innerHTML = opts;
                    initTomSelect('histFilterDevice', 'Busca dispositivo...');
                }
                if(hMet) {
                    const methods = res.data.methodologies || [];
                    hMet.innerHTML = '<option value="Todos" selected>Todas</option>' + methods.map(h => `<option value="${h}">${h}</option>`).join('');
                    initTomSelect('histFilterMethod', '');
                    if (window.tsInstances['histFilterMethod']) {
                        window.tsInstances['histFilterMethod'].addItem('Todos', true);
                    }
                }
            }
        });
    };
    populateAllFilters();

    const updateWeekSelect = (weeks, isAdmin) => {
        if (isAdmin) return; // Admins use the multi-picker
        const sel = document.getElementById('dashboardWeek');
        if (!sel) return;
        const currentVal = sel.value || currentWeek.toString();
        sel.innerHTML = '<option value="">Selecciona...</option>';
        (weeks || []).sort((a, b) => b - a).forEach(w => {
            const opt = document.createElement('option');
            opt.value = w;
            opt.innerText = `Semana ${w}`;
            if (w.toString() === currentVal) opt.selected = true;
            sel.appendChild(opt);
        });
    };

    const loadStats = (force = false) => {
        const dTarget = document.getElementById('dashboardTarget');
        const dWeek = document.getElementById('dashboardWeek');
        const dMonth = document.getElementById('dashboardMonth');
        const dYear = document.getElementById('dashboardYear');
        const dDevice = document.getElementById('dashboardDevice');
        const dStart = document.getElementById('dashboardDateStart');
        const dEnd = document.getElementById('dashboardDateEnd');

        const target = isAdmin ? (dTarget ? dTarget.value : "Total") : currentUser;
        const device = dDevice ? dDevice.value : "Todos";

        const statsLoading = document.getElementById('stat_count');
        if (statsLoading) statsLoading.innerText = "...";

        let params = { targetUser: target, device: device, refresh: force };
        
        if (isAdmin && isRangeMode) {
            params.startDate = dStart ? dStart.value : "";
            params.endDate = dEnd ? dEnd.value : "";
        } else {
            params.week = dWeek ? dWeek.value : "";
            params.month = dMonth ? dMonth.value : "Todos";
            params.year = dYear ? dYear.value : "Todos";
        }
        
        api.getDashboardStats(params).then(res => {
            if (res.status === 'success') {
                try {
                    const sCount = document.getElementById('stat_count'); if(sCount) sCount.innerText = (res.currentWeekData && res.currentWeekData.count !== undefined) ? res.currentWeekData.count : (res.count || 0);
                    const sSesi = document.getElementById('stat_sesiones'); if(sSesi) sSesi.innerText = res.totalSesiones !== undefined ? res.totalSesiones : (res.sesiones || 0);
                    const sAlum = document.getElementById('stat_alumnos'); if(sAlum) sAlum.innerText = res.totalAlumnos !== undefined ? res.totalAlumnos : (res.alumnos || 0);
                    const sHora = document.getElementById('stat_horas'); if(sHora) sHora.innerText = res.totalHoras !== undefined ? res.totalHoras : (res.horas || 0);
                    
                    const pText = document.getElementById('dashPeriodText');
                    if (pText) {
                        pText.innerHTML = isAdmin ? '<i data-lucide="line-chart" style="width:20px;"></i> Panel de Supervisión Global' : 'Tu impacto semanal en Xiaomi';
                        if (typeof lucide !== 'undefined') lucide.createIcons();
                    }

                    updateWeekSelect(res.availableWeeks, isAdmin);
                    
                    // Delay render to let mobile layout and fonts stabilize
                    setTimeout(() => {
                        window._lastDashData = res;
                        renderCharts(res);
                        if (isAdmin && res.adminStats) renderAdminStats(res.adminStats);
                    }, 250);
                } catch(e) { console.error("Shielding error in stats rendering:", e); }
            }
        });
    };

    // Botón de Limpiar Filtros
    const clearBtn = document.getElementById('btnClearFilters');
    if(clearBtn) clearBtn.onclick = () => {
        if(isAdmin) {
            document.getElementById('dashboardTarget').value = 'Total';
            document.getElementById('dashboardYear').value = 'Todos';
            document.getElementById('dashboardMonth').value = 'Todos';
            if (window.tsInstances && window.tsInstances['dashboardDevice']) {
                window.tsInstances['dashboardDevice'].setValue('Todos');
            } else {
                document.getElementById('dashboardDevice').value = 'Todos';
            }
            
            if(document.getElementById('dashboardDateStart')) document.getElementById('dashboardDateStart').value = '';
            if(document.getElementById('dashboardDateEnd')) document.getElementById('dashboardDateEnd').value = '';
            
            selectedMonthsSet.clear();
            if(window.updateMultiMonthUI) window.updateMultiMonthUI();
            
            if(isRangeMode && btnToggle) btnToggle.click();

            selectedWeeksSet = new Set([currentWeek]);
            updateMultiWeekUI(); 
        } else {
            if(document.getElementById('dashboardWeek')) document.getElementById('dashboardWeek').value = currentWeek;
        }
        // Historial
        if(isAdmin && document.getElementById('histFilterTrainer')) document.getElementById('histFilterTrainer').value = 'Total';
        if(document.getElementById('histFilterWeek')) document.getElementById('histFilterWeek').value = currentWeek;
        document.getElementById('histFilterMonth').value = 'Todos';
        document.getElementById('histFilterAccount').value = 'Todos';
        if (window.tsInstances && window.tsInstances['histFilterDevice']) {
            window.tsInstances['histFilterDevice'].setValue('Todos');
        } else {
            document.getElementById('histFilterDevice').value = 'Todos';
        }
        if (window.tsInstances && window.tsInstances['histFilterMethod']) {
            window.tsInstances['histFilterMethod'].setValue(['Todos']);
        } else {
            document.getElementById('histFilterMethod').value = 'Todos';
        }
        const hS = document.getElementById('historySearch');
        if(hS) hS.value = '';
        
        loadStats();
        loadHistory();
    };
    
    window.isUpdatingHistoryFilters = false;
    const updateHistoryFilters = (af) => {
        if (window.isUpdatingHistoryFilters) return;
        window.isUpdatingHistoryFilters = true;
        try {
            const selectors = [
                { id: 'histFilterMonth', data: af.months, label: 'Todos' },
                { id: 'histFilterWeek', data: af.weeks, label: 'Todas' },
                { id: 'histFilterAccount', data: af.accounts, label: 'Todas' },
                { id: 'histFilterDevice', data: af.devices, label: 'Todos' },
                { id: 'histFilterMethod', data: af.methods, label: 'Todas' }
            ];
            
            selectors.forEach(s => {
                const el = document.getElementById(s.id);
                if (!el) return;
                
                let currentVal = el.value;
                if (window.tsInstances && window.tsInstances[s.id]) {
                    const tsVal = window.tsInstances[s.id].getValue();
                    currentVal = Array.isArray(tsVal) ? [...tsVal] : tsVal;
                    const ts = window.tsInstances[s.id];
                    
                    // Update options dynamically without destroying the instance
                    ts.clearOptions();
                    ts.addOption({value: 'Todos', text: s.label});
                    
                    if (s.id === 'histFilterDevice') {
                        const reported = new Set(s.data);
                        if (isAdmin) {
                            masterDevices.forEach(d => {
                                const hasData = reported.has(d);
                                ts.addOption({value: d.toString(), text: hasData ? d : d + ' (Sin datos)', disabled: !hasData});
                            });
                        } else {
                            s.data.sort().forEach(d => ts.addOption({value: d.toString(), text: d}));
                        }
                    } else if (s.id === 'histFilterMethod') {
                        s.data.forEach(v => ts.addOption({value: v.toString(), text: v}));
                    }
                    
                    if (Array.isArray(currentVal)) {
                        currentVal.forEach(v => {
                            if (v !== 'Todos' && !s.data.includes(v)) {
                                ts.addOption({value: v.toString(), text: v.toString()});
                            }
                        });
                        if (currentVal.length === 0) currentVal = ['Todos'];
                    } else if (!currentVal) {
                        currentVal = 'Todos';
                    }
                    
                    ts.setValue(currentVal, true); // true = silent
                } else {
                    if (s.id === 'histFilterDevice') {
                        const reported = new Set(s.data);
                        const isTodosSel = Array.isArray(currentVal) ? currentVal.includes('Todos') : currentVal === 'Todos';
                        let opts = `<option value="Todos" ${isTodosSel ? 'selected' : ''}>${s.label}</option>`;
                        if (isAdmin) {
                            masterDevices.forEach(d => {
                                const hasData = reported.has(d);
                                const isSel = Array.isArray(currentVal) ? currentVal.includes(d.toString()) : d.toString() === currentVal;
                                opts += `<option value="${d}" ${isSel ? 'selected' : ''} ${!hasData ? 'disabled style="color:#aaa"' : ''}>${d}${!hasData ? ' (Sin datos)' : ''}</option>`;
                            });
                        } else {
                            s.data.sort().forEach(d => {
                                const isSel = Array.isArray(currentVal) ? currentVal.includes(d.toString()) : d.toString() === currentVal;
                                opts += `<option value="${d}" ${isSel ? 'selected' : ''}>${d}</option>`;
                            });
                        }
                        el.innerHTML = opts;
                        initTomSelect('histFilterDevice', 'Busca dispositivo...');
                    } else if (s.id === 'histFilterMethod') {
                        const isTodosSel = (!currentVal || currentVal.length === 0 || (Array.isArray(currentVal) ? currentVal.includes('Todos') : currentVal === 'Todos'));
                        el.innerHTML = `<option value="Todos" ${isTodosSel ? 'selected' : ''}>${s.label}</option>` + 
                            s.data.map(v => {
                                const isSel = Array.isArray(currentVal) ? currentVal.includes(v.toString()) : v.toString() === currentVal;
                                return `<option value="${v}" ${isSel ? 'selected' : ''}>${v}</option>`;
                            }).join('');
                        initTomSelect('histFilterMethod', '');
                        if (window.tsInstances['histFilterMethod'] && isTodosSel) {
                            window.tsInstances['histFilterMethod'].addItem('Todos', true);
                        }
                    } else {
                        el.innerHTML = `<option value="Todos">${s.label}</option>` + 
                            s.data.map(v => `<option value="${v}" ${v.toString() === currentVal ? 'selected' : ''}>${v}</option>`).join('');
                    }
                }
            });
        } catch(e) { console.error("Error updating filters:", e); }
        setTimeout(() => { window.isUpdatingHistoryFilters = false; }, 50);
    };

    const loadHistory = (force = false) => {
        // Al cargar historial, respetamos si el admin seleccionó un trainer específico ABRAZO
        const target = isAdmin ? (document.getElementById('histFilterTrainer')?.value || 'Total') : currentUser;
        let week = document.getElementById('histFilterWeek')?.value || "";
        let month = document.getElementById('histFilterMonth')?.value || "Todos";
        const account = document.getElementById('histFilterAccount')?.value || "Todos";
        const device = document.getElementById('histFilterDevice')?.value || "Todos";
        const q = document.getElementById('historySearch')?.value || "";
        
        const dateStart = document.getElementById('histFilterDateStart')?.value || "";
        const dateEnd = document.getElementById('histFilterDateEnd')?.value || "";
        const useRange = document.getElementById('histRangeStart')?.style.display !== 'none';

        if (useRange) {
            week = "";
            month = "Todos";
        }

        let methods = [];
        if (window.tsInstances && window.tsInstances['histFilterMethod']) {
            const val = window.tsInstances['histFilterMethod'].getValue();
            if (Array.isArray(val)) {
                methods = val;
            } else if (typeof val === 'string') {
                methods = val.split(',').filter(Boolean);
            }
        } else {
            const el = document.getElementById('histFilterMethod');
            if (el) {
                methods = Array.from(el.selectedOptions).map(o => o.value);
            }
        }
        const isMethodTodos = methods.length === 0 || methods.includes('Todos');

        const parseDuration = (val) => {
            if (!val) return 0;
            const s = val.toString();
            if (s.includes('T')) {
                const parts = s.split('T')[1].split(':');
                return parseFloat(parts[0]) + (parseFloat(parts[1])/60);
            }
            return parseFloat(s) || 0;
        };

        const loader = document.getElementById('historyLoading');
        if(loader) loader.style.visibility = 'visible';

        const isFiltered = (isAdmin && target !== 'Total') || 
                           (week !== "Todos" && week !== "" && week.toString() !== currentWeek.toString()) || 
                           (month !== "Todos") || 
                           (account !== "Todos") || 
                           (device !== "Todos") || 
                           (!isMethodTodos) || 
                           (useRange && (dateStart || dateEnd)) ||
                           (q.trim() !== "");

        const historyParams = { 
            targetUser: target === 'Total' ? '' : target, 
            week: (week === "Todos" ? "" : week),
            month: month,
            account: account,
            device: device,
            methodology: "Todos", // Send Todos to bypass backend filtering, we filter client-side
            q: q,
            refresh: force,
            limit: isFiltered ? 9999 : 25
        };

        api.getReportsHistory(historyParams).then(res => {
            if(res.status === 'success' && res.availableFilters) {
                updateHistoryFilters(res.availableFilters);
            }
            const body = document.getElementById('historyBody');
            if (!body) return; // FIX: Guard if user navigated away

            if(res.status === 'success' && res.data.length > 0) {
                // Client-side filtering (methodology & dates)
                let filteredData = res.data;
                if (!isMethodTodos) {
                    const normalizeStr = (s) => String(s || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
                    const methodsLower = methods.map(normalizeStr);
                    filteredData = filteredData.filter(r => {
                        const rowMethod = normalizeStr(r.metodologia);
                        return methodsLower.includes(rowMethod);
                    });
                }
                
                if (useRange) {
                    if (dateStart) {
                        const dStart = new Date(dateStart).getTime();
                        filteredData = filteredData.filter(r => new Date(r.fecha).getTime() >= dStart);
                    }
                    if (dateEnd) {
                        const dEnd = new Date(dateEnd);
                        dEnd.setHours(23, 59, 59, 999);
                        filteredData = filteredData.filter(r => new Date(r.fecha).getTime() <= dEnd.getTime());
                    }
                }

                window.dashboardHistoryData = filteredData;

                if (filteredData.length === 0) {
                    body.innerHTML = '<tr><td colspan="7" style="padding: 20px; text-align: center; color: var(--text-muted);">No se encontraron reportes que coincidan con la metodología seleccionada.</td></tr>';
                    return;
                }

                body.innerHTML = filteredData.map((r, idx) => `
                    <tr style="border-bottom: 1px solid var(--border-main);">
                        <td data-label="Fecha" style="padding: 12px; font-weight: 600;">${formatDateSafe(r.fecha)}</td>
                        ${isAdmin ? `<td data-label="Trainer" style="padding: 12px; font-weight: 600; color: var(--xiaomi-orange);">${r.trainer || '-'}</td>` : ''}
                        <td data-label="Cuenta" style="padding: 12px; color: var(--text-medium);">${r.cuenta}</td>
                        <td data-label="Método" style="padding: 12px;"><span class="badge ${r.metodologia === 'Classroom' ? 'badge-approved' : 'badge-extra'}">${r.metodologia}</span></td>
                        <td data-label="Alumnos" style="padding: 12px; text-align: center;">${r.alumnos || '0'}</td>
                        <td data-label="Horas" style="padding: 12px; text-align: center;">${parseDuration(r.duracion).toFixed(1)}h</td>
                        <td data-label="Acciones" style="padding: 12px; text-align: right; white-space: nowrap;">
                            <button onclick="handleHistoryAction('view', ${idx})" class="btn-outline btn-compact" style="border-color: #10b981; color: #10b981;" title="Ver Detalles"><i data-lucide="eye" style="width:14px;"></i></button>
                            <button onclick="handleHistoryAction('duplicate', ${idx})" class="btn-outline btn-compact" style="border-color: #0ea5e9; color: #0ea5e9;" title="Duplicar"><i data-lucide="copy" style="width:14px;"></i></button>
                            <button onclick="handleHistoryAction('edit', ${idx})" class="btn-outline btn-compact" title="Editar"><i data-lucide="edit-2" style="width:14px;"></i></button>
                            <button onclick="handleHistoryAction('delete', ${idx})" class="btn-outline danger btn-compact" style="border-color: #ef4444; color: #ef4444;" title="Eliminar"><i data-lucide="trash-2" style="width:14px;"></i></button>
                        </td>
                    </tr>
                `).join('');
                if (typeof lucide !== 'undefined') lucide.createIcons();
            } else {
                body.innerHTML = `<tr><td colspan="${isAdmin ? 7 : 6}" style="padding: 2.5rem; text-align: center; color: var(--text-muted);">${q ? 'No hay resultados para esa búsqueda.' : 'No se encontraron reportes.'}</td></tr>`;
            }
        }).finally(() => { 
            const loader = document.getElementById('historyLoading');
            if(loader) loader.style.visibility = 'hidden'; 
        });
    };

    const renderAdminStats = (stats) => {
        const body = document.getElementById('accountTableBody');
        if(!body) return;
        let rows = '', totalSes = 0, totalAlu = 0;
        const accounts = Object.keys(stats.byAccount || {}).sort();
        accounts.forEach(acc => {
            const s = stats.byAccount[acc]?.sesiones || 0;
            const a = stats.byAccount[acc]?.alumnos || 0;
            totalSes += s; totalAlu += a;
            rows += `
                <tr class="table-row-hover" style="border-bottom:1px solid var(--border-main); transition: background 0.2s;">
                    <td data-label="Cuenta" style="padding:12px 15px; color:var(--text-main); font-weight:600;">${acc}</td>
                    <td data-label="Sesiones" style="padding:12px 15px; text-align:center; font-weight:700; color:var(--xiaomi-orange);">${s}</td>
                    <td data-label="Personas" style="padding:12px 15px; text-align:center; font-weight:700; color:var(--text-main);">${a}</td>
                </tr>`;
        });
        if(rows) {
            rows += `

                <tr style="background: var(--bg-main); font-weight:900; border-top:2px solid var(--border-main);">
                    <td data-label="Cuenta" style="padding:12px 15px; color:var(--text-main);">TOTAL</td>
                    <td data-label="Sesiones" style="padding:12px 15px; text-align:center; color:var(--xiaomi-orange);">${totalSes}</td>
                    <td data-label="Personas" style="padding:12px 15px; text-align:center; color:var(--text-main);">${totalAlu}</td>
                </tr>`;
            body.innerHTML = rows;
        } else body.innerHTML = '<tr><td colspan="3" style="padding:2.5rem; text-align:center; color: var(--text-muted);">Sin datos en el periodo</td></tr>';
    };

    window.dashboardLoadHistory = loadHistory;

    window.sortHistory = (field) => {
        if(!window.dashboardHistoryData) return;
        
        // Helper interno redundante para asegurar disponibilidad en sort
        const pD = (val) => {
            if (!val) return 0;
            const s = val.toString();
            if (s.includes('T')) {
                const parts = s.split('T')[1].split(':');
                return parseFloat(parts[0]) + (parseFloat(parts[1])/60);
            }
            return parseFloat(s) || 0;
        };

        const dir = window._sortDir === 'asc' ? 'desc' : 'asc';
        window._sortDir = dir;
        window.dashboardHistoryData.sort((a, b) => {
            let vA = a[field], vB = b[field];
            if(field === 'fecha') { 
                const dA = a[field] && a[field].toString().includes('T') ? new Date(a[field]) : new Date((a[field] || "").toString() + 'T12:00:00');
                const dB = b[field] && b[field].toString().includes('T') ? new Date(b[field]) : new Date((b[field] || "").toString() + 'T12:00:00');
                vA = dA.getTime(); vB = dB.getTime(); 
            }
            if(field === 'duracion') { vA = pD(vA); vB = pD(vB); }
            if(field === 'alumnos') { vA = parseFloat(vA) || 0; vB = parseFloat(vB) || 0; }
            if(vA < vB) return dir === 'asc' ? -1 : 1;
            if(vA > vB) return dir === 'asc' ? 1 : -1;
            return 0;
        });
        // Re-render sin fetch
        const body = document.getElementById('historyBody');
        body.innerHTML = window.dashboardHistoryData.map((r, idx) => `
            <tr style="border-bottom: 1px solid var(--border-main);">
                <td data-label="Fecha" style="padding: 12px; font-weight: 600;">${formatDateSafe(r.fecha)}</td>
                ${isAdmin ? `<td data-label="Trainer" style="padding: 12px; font-weight: 600; color: var(--xiaomi-orange);">${r.trainer || '-'}</td>` : ''}
                <td data-label="Cuenta" style="padding: 12px; color: var(--text-medium);">${r.cuenta}</td>
                <td data-label="Método" style="padding: 12px;"><span class="badge ${r.metodologia === 'Classroom' ? 'badge-approved' : 'badge-extra'}">${r.metodologia}</span></td>
                <td data-label="Alumnos" style="padding: 12px; text-align: center;">${r.alumnos || '0'}</td>
                <td data-label="Horas" style="padding: 12px; text-align: center;">${pD(r.duracion).toFixed(1)}h</td>
                <td data-label="Acciones" style="padding: 12px; text-align: right; white-space: nowrap;">
                    <button onclick="handleHistoryAction('view', ${idx})" class="btn-outline btn-compact" style="border-color: #10b981; color: #10b981;" title="Ver Detalles"><i data-lucide="eye" style="width:14px;"></i></button>
                    <button onclick="handleHistoryAction('duplicate', ${idx})" class="btn-outline btn-compact" style="border-color: #0ea5e9; color: #0ea5e9;" title="Duplicar"><i data-lucide="copy" style="width:14px;"></i></button>
                    <button onclick="handleHistoryAction('edit', ${idx})" class="btn-outline btn-compact" title="Editar"><i data-lucide="edit-2" style="width:14px;"></i></button>
                    <button onclick="handleHistoryAction('delete', ${idx})" class="btn-outline danger btn-compact" style="border-color: #ef4444; color: #ef4444;" title="Eliminar"><i data-lucide="trash-2" style="width:14px;"></i></button>
                </td>
            </tr>
        `).join('');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    window.handleHistoryAction = (action, index) => {
        const report = window.dashboardHistoryData[index];
        if(!report) return;

        const pD = (val) => {
            if (!val) return 0;
            const s = val.toString();
            if (s.includes('T')) {
                const parts = s.split('T')[1].split(':');
                return parseFloat(parts[0]) + (parseFloat(parts[1])/60);
            }
            return parseFloat(s) || 0;
        };

        if(action === 'view') {
            const modal = document.getElementById('modalReport');
            const content = document.getElementById('modalContent');
            content.innerHTML = `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; border-bottom: 1px solid var(--border-main); padding-bottom: 15px; margin-bottom: 15px;">
                    <div><strong style="color:var(--text-muted); font-size:0.75rem; display:block; text-transform:uppercase;">Trainer</strong> <span style="font-weight:700;">${report.trainer}</span></div>
                    <div><strong style="color:var(--text-muted); font-size:0.75rem; display:block; text-transform:uppercase;">Fecha</strong> <span style="font-weight:700;">${formatDateSafe(report.fecha)}</span></div>
                </div>
                <div style="line-height: 1.8;">
                    <div style="margin-bottom:12px;"><strong style="color:var(--text-muted); font-size:0.75rem; text-transform:uppercase;">Metodología:</strong> <span style="font-weight:600;">${report.metodologia}</span></div>
                    <div style="margin-bottom:12px;"><strong style="color:var(--text-muted); font-size:0.75rem; text-transform:uppercase;">Cuenta:</strong> <span style="font-weight:600;">${report.cuenta} ${report.distribuidor ? `(${report.distribuidor})` : ''}</span></div>
                    <div style="margin-bottom:12px;"><strong style="color:var(--text-muted); font-size:0.75rem; text-transform:uppercase;">Ubicación:</strong> <span style="font-weight:600;">${report.ciudad}, ${report.provincia}</span></div>
                    <hr style="border: 0; border-top: 1px solid var(--border-main); margin: 15px 0;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; background:var(--bg-main); padding: 15px; border-radius:12px; margin-bottom:15px; text-align:center;">
                        <div><span style="display:block; font-size:1.25rem; font-weight:800; color:var(--xiaomi-orange);">${report.sesiones}</span><span style="font-size:0.6rem; text-transform:uppercase; color:var(--text-muted);">Sesiones</span></div>
                        <div><span style="display:block; font-size:1.25rem; font-weight:800; color:var(--xiaomi-orange);">${report.alumnos}</span><span style="font-size:0.6rem; text-transform:uppercase; color:var(--text-muted);">Alumnos</span></div>
                        <div><span style="display:block; font-size:1.25rem; font-weight:800; color:var(--xiaomi-orange);">${pD(report.duracion).toFixed(1)}h</span><span style="font-size:0.6rem; text-transform:uppercase; color:var(--text-muted);">Duración</span></div>
                    </div>
                    <hr style="border: 0; border-top: 1px solid var(--border-main); margin: 15px 0;">
                    <p style="margin-bottom:8px;"><strong>Contenidos:</strong> ${report.contenidos}</p>
                    <p style="margin-bottom:8px;"><strong>Móviles:</strong> ${report.dispositivos || '-'}</p>
                    <p style="margin-bottom:8px;"><strong>Ecosistema:</strong> ${report.dispositivos_no_movil || '-'}</p>
                    <p style="margin-bottom:15px;"><strong>Comentarios:</strong><br><span style="color: var(--text-medium); font-style: italic;">${report.comentarios || 'Sin comentarios'}</span></p>
                    <hr style="border: 0; border-top: 1px solid var(--border-main); margin: 15px 0;">
                    <div style="margin-top:10px;">
                        <strong style="color:var(--text-muted); font-size:0.75rem; text-transform:uppercase; display:block; margin-bottom:12px;">FOTOS:</strong>
                        <div style="display: flex; flex-wrap: wrap; gap: 12px;">
                            ${report.photoLinks ? report.photoLinks.split(/[\n,]+/).filter(url => url.trim().startsWith('http')).map((url, i) => {
                                const p = url.trim();
                                const idMatch = p.match(/id=([^&]+)/) || p.match(/\/d\/([^/]+)/);
                                const thumb = idMatch ? `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w200` : p;
                                return `
                                    <a href="${p}" target="_blank" style="display:block; width:85px; height:85px; border-radius:12px; background:url(${thumb}) center/cover; border:2px solid var(--border-main); cursor:pointer; transition: all 0.2s ease; box-shadow: var(--shadow-sm);" onmouseover="this.style.transform='scale(1.08)'; this.style.borderColor='var(--xiaomi-orange)'" onmouseout="this.style.transform='scale(1)'; this.style.borderColor='var(--border-main)'" title="Ver en grande (Google Drive)">
                                    </a>
                                `;
                            }).join('') : '<span style="color:var(--text-muted); font-style:italic; font-size:0.8rem;">No hay fotos adjuntas</span>'}
                        </div>
                    </div>
                </div>
            `;
            modal.style.display = 'flex';
            if (typeof lucide !== 'undefined') lucide.createIcons();
        } else if(action === 'duplicate' || action === 'edit') {
            window.reportEditData = { ...report, mode: action };
            window.location.hash = '#report';
        } else if(action === 'delete') {
            if(!report.id) {
                showToast("Error", "No se puede eliminar: el reporte no tiene un ID válido.");
                return;
            }
            if(!confirm("¿Seguro que quieres eliminar este reporte permanentemente?")) return;
            
            const btn = document.activeElement;
            const originalHTML = btn ? btn.innerHTML : '';
            if(btn) {
                btn.disabled = true;
                btn.innerHTML = '<div class="loader" style="width:12px; height:12px; border-width:2px; border-color:white transparent transparent;"></div>';
            }

            api.deleteReport(report.id).then(res => {
                if(res.status === 'success') {
                    showToast("Eliminado", "Reporte borrado correctamente");
                    loadHistory(true);
                    loadStats(true);
                } else {
                    showToast("Error", res.message || "No se pudo eliminar el reporte");
                    if(btn) { btn.disabled = false; btn.innerHTML = originalHTML; }
                }
            }).catch(e => {
                showToast("Error", "Fallo de conexión o error en el servidor");
                if(btn) { btn.disabled = false; btn.innerHTML = originalHTML; }
            });
        }
    };

    const btnFilter = document.getElementById('btnFilter');
    if(btnFilter) btnFilter.onclick = () => { loadStats(); loadHistory(); };

    const btnClearHistory = document.getElementById('btnClearHistory');
    if(btnClearHistory) btnClearHistory.onclick = () => {
        ['histFilterMonth', 'histFilterAccount', 'histFilterDevice', 'histFilterMethod'].forEach(id => {
            const el = document.getElementById(id);
            if(el) {
                el.value = 'Todos';
                if ((id === 'histFilterDevice' || id === 'histFilterMethod') && window.tsInstances && window.tsInstances[id]) {
                    window.tsInstances[id].setValue(id === 'histFilterMethod' ? ['Todos'] : 'Todos');
                }
            }
        });
        const hW = document.getElementById('histFilterWeek');
        if(hW) hW.value = currentWeek;
        const hS = document.getElementById('historySearch');
        if(hS) hS.value = '';
        loadHistory();
    };

    const btnRefreshHistory = document.getElementById('btnRefreshHistory');
    if(btnRefreshHistory) btnRefreshHistory.onclick = () => { 
        loadStats(true);
        loadHistory(true); 
    };

    const btnFilterHistory = document.getElementById('btnFilterHistory');
    if(btnFilterHistory) btnFilterHistory.onclick = () => { loadHistory(); };

    const historySearch = document.getElementById('historySearch');
    if(historySearch) historySearch.onkeyup = (e) => { if(e.key === 'Enter') loadHistory(); };
    
        // CARGA INICIAL DIFERIDA (Performance V1.1)
        loadStats();
        setTimeout(loadHistory, 300); // Retrasar carga de historial para priorizar los números principales
    } catch(e) {
        console.error("Dashboard Render Error:", e);
        container.innerHTML = `<div class="glass-card" style="padding:40px; text-align:center;"><h3>Error al cargar el Dashboard</h3><p>${e.message}</p></div>`;
    }
}

let weeklyChart, methodsChart, trainersChart;
function renderCharts(data) {
    if (!data) return;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const isMobile = window.innerWidth < 768;
    const primaryColor = '#ff6700';
    const primaryGradientEnd = '#ff9a44';
    const secondaryColor = isDark ? '#334155' : '#cbd5e0';
    const secondaryGradientEnd = isDark ? '#1e293b' : '#f1f5f9';
    const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)';
    const textColor = isDark ? '#777777' : '#888888';
    const isLandscape = window.innerHeight < window.innerWidth && isMobile;
    const fontSize = isMobile ? (isLandscape ? 8 : 9) : 12;
    const tickSize = isMobile ? (isLandscape ? 7 : 8) : 11;

    if (typeof Chart === 'undefined') {
        console.error("Chart.js is NOT defined.");
        return;
    }

    try {
        console.log("Rendering Dashboard charts with data:", data);

        // Configuración global de Chart.js
        Chart.defaults.font.family = "'Inter', 'Outfit', sans-serif";
        Chart.defaults.color = textColor;
        Chart.defaults.borderColor = gridColor;

        const createGrad = (ctx, start, end) => {
            if (!ctx) return start;
            try {
                const g = ctx.createLinearGradient(0, 0, 0, 300);
                g.addColorStop(0, start);
                g.addColorStop(1, end);
                return g;
            } catch(e) { return start; }
        };

        // --- Weekly Chart ---
        const canvasW = document.getElementById('chartWeekly');
        if (!canvasW) return;
        const ctxW = canvasW.getContext('2d');
        if(weeklyChart) weeklyChart.destroy();
        
        const gradOrange = createGrad(ctxW, primaryColor, primaryGradientEnd);
        const gradGray = createGrad(ctxW, secondaryColor, secondaryGradientEnd);

        weeklyChart = new Chart(ctxW, {
            type: 'bar',
            data: { 
                labels: data.chartLabels || data.labels || ["Sin Datos"], 
                datasets: [
                    { 
                        label: 'Sesiones', 
                        data: data.chartSesiones || data.sesiones || [0], 
                        backgroundColor: gradOrange, 
                        borderRadius: 12,
                        hoverBackgroundColor: primaryColor,
                        maxBarThickness: 45
                    },
                    { 
                        label: 'Alumnos', 
                        data: data.chartAlumnos || data.alumnos || [0], 
                        backgroundColor: gradGray, 
                        borderRadius: 12,
                        hoverBackgroundColor: secondaryColor,
                        maxBarThickness: 45
                    }
                ]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                layout: { padding: isMobile ? { top: 5, bottom: 5, left: 10, right: 15 } : 15 },
                plugins: { 
                    legend: { 
                        position: 'bottom',
                        labels: { 
                            padding: isMobile ? 12 : 20, 
                            usePointStyle: true, 
                            pointStyle: 'circle', 
                            font: { size: fontSize, weight: 600 } 
                        }
                    },
                    tooltip: {
                        backgroundColor: isDark ? '#1f2937' : '#ffffff',
                        titleColor: isDark ? '#ffffff' : '#1f2937',
                        bodyColor: isDark ? '#cbd5e0' : '#4b5563',
                        borderColor: isDark ? '#374151' : '#e5e7eb',
                        borderWidth: 1,
                        padding: isMobile ? 8 : 12,
                        cornerRadius: 8,
                        displayColors: true
                    }
                },
                scales: { 
                    y: { 
                        beginAtZero: true,
                        grid: { color: gridColor, drawBorder: false },
                        ticks: { color: textColor, font: { size: tickSize }, maxTicksLimit: isMobile ? 4 : 10 }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: textColor, font: { size: tickSize, weight: 600 }, maxRotation: 45, minRotation: 0 }
                    }
                }
            }
        });

        // --- Methods Chart ---
        const canvasM = document.getElementById('chartMethods');
        if (!canvasM) return;
        const ctxM = canvasM.getContext('2d');
        if(methodsChart) methodsChart.destroy();
        methodsChart = new Chart(ctxM, {
            type: 'doughnut',
            data: { 
                labels: data.pieLabels || data.methodLabels || [], 
                datasets: [{ 
                    data: data.pieData || data.methodData || [],
                    backgroundColor: [
                        primaryColor,                                   // 1. Orange (Brand)
                        isDark ? '#3b82f6' : '#2563eb',                 // 2. Blue
                        isDark ? '#10b981' : '#059669',                 // 3. Green
                        isDark ? '#8b5cf6' : '#7c3aed',                 // 4. Purple
                        isDark ? '#f59e0b' : '#d97706',                 // 5. Amber
                        isDark ? '#ec4899' : '#db2777',                 // 6. Pink
                        isDark ? '#06b6d4' : '#0891b2',                 // 7. Cyan/Teal
                        isDark ? '#f43f5e' : '#e11d48',                 // 8. Rose
                        isDark ? '#6366f1' : '#4f46e5',                 // 9. Indigo
                        isDark ? '#84cc16' : '#65a30d',                 // 10. Lime
                        isDark ? '#0d9488' : '#0f766e',                 // 11. Teal Dark
                        isDark ? '#a21caf' : '#86198f'                  // 12. Magenta/Fuchsia
                    ],
                    borderWidth: 0,
                    hoverOffset: 12
                }] 
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                animation: { animateRotate: true, animateScale: true },
                layout: { padding: isMobile ? { top: 10, bottom: 10, left: 5, right: 5 } : 0 },
                plugins: { 
                    legend: { 
                        position: 'bottom',
                        display: true,
                        labels: { 
                            color: textColor,
                            padding: isMobile ? 12 : 20, 
                            usePointStyle: true, 
                            pointStyle: 'circle', 
                            font: { size: fontSize - 1, weight: 600 } 
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) label += ': ';
                                if (context.parsed !== undefined) {
                                    label += context.parsed + 'h';
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });

        // --- Trainers Chart (Admin) ---
        if(data.adminStats && document.getElementById('chartTrainers')) {
            const ctxT = document.getElementById('chartTrainers').getContext('2d');
            if(trainersChart) trainersChart.destroy();
            const names = Object.keys(data.adminStats.byTrainer);
            
            const gradT_Orange = createGrad(ctxT, primaryColor, primaryGradientEnd);
            const gradT_Gray = createGrad(ctxT, secondaryColor, secondaryGradientEnd);

            trainersChart = new Chart(ctxT, {
                type: 'bar',
                data: {
                    labels: names,
                    datasets: [
                        { label: 'Personas', data: names.map(n => data.adminStats.byTrainer[n]?.alumnos || 0), backgroundColor: gradT_Orange, borderRadius: 20 },
                        { label: 'Sesiones', data: names.map(n => data.adminStats.byTrainer[n]?.sesiones || 0), backgroundColor: gradT_Gray, borderRadius: 20 }
                    ]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                        legend: { position: 'bottom', labels: { usePointStyle: true, font: { size: isMobile ? 9 : 12, weight: 600 } } }
                    },
                    scales: { 
                        x: { beginAtZero: true, grid: { color: gridColor }, ticks: { font: { size: isMobile ? 9 : 11 } } },
                        y: { 
                            grid: { display: false }, 
                            ticks: { 
                                font: { size: isMobile ? 9 : 11, weight: 700 },
                                callback: function(value) {
                                    const label = this.getLabelForValue(value);
                                    return isMobile && label.length > 8 ? label.substring(0,7)+'..' : label;
                                }
                            } 
                        }
                    }
                }
            });
        }
    } catch(e) { console.error("Error renderCharts:", e); }
}
window.renderDashboard = renderDashboard;
