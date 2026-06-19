/**
 * XIAOMI VISUAL APP - FRONTEND LOGIC
 */

const APP_CONFIG = {
    scriptUrl: 'https://script.google.com/macros/s/AKfycbxxvnXnL-X6Rd7rW8v_UWDaVJwnU9t9o_ke_Rfs-dcsRzy8Xz9iyaWVYUpSorurQzNbMQ/exec',
    currentUser: null,
    currentReport: {
        category: '',
        centro: '',
        path: []
    },
    dashboardReports: [], 
    launches: [],
    materials: [], // Caché de materiales
    incidentUploadedPhotos: [],
    deviceCatalog: [], // Lista global bajada de 'Dispositivos'
    currentSelectedDevices: [], // Buffer temporal del reporte actual
    currentSelectedLonas: [],
    currentSelectedAlarmados: []
};

// --- MOTOR UNIVERSAL DE COMPRESIÓN Y RENDERIZADO (Baja Cobertura & CDN) ---
window.getGoogleDriveThumbnail = function(url) {
    if (!url) return '';
    const str = String(url);
    if (str.includes('drive.google.com')) {
        const match = str.match(/\/file\/d\/([^\/]+)/) || str.match(/id=([^\&]+)/);
        if (match && match[1]) {
            // Usamos el CDN universal lh3 de Google, inmune al bloqueo de cookies de terceros
            return `https://lh3.googleusercontent.com/d/${match[1]}=w300`;
        }
    }
    return url;
};

window.getCompressedBase64 = async function(file, maxWidth = 1200, maxHeight = 1200, quality = 0.7) {
    // Si no es imagen, retornamos el base64 directo sin compresión
    if (!file.type || !file.type.startsWith('image/')) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1] || reader.result);
            reader.onerror = error => reject(error);
        });
    }
    // Algoritmo de compresión en el cliente vía HTML5 Canvas
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                // Forzamos calidad reducida en JPEG para velocidad instantánea
                const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedBase64.split(',')[1] || compressedBase64);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

// --- SISTEMA PREMIUM DE NOTIFICACIONES Y ALERTAS ---
window.showToast = function(msg, type = 'info') {
    let container = document.getElementById('custom-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'custom-toast-container';
        container.className = 'custom-toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `custom-toast toast-${type}`;
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    
    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <div style="flex:1">${msg}</div>
    `;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('slide-out');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
};

// Sobrescribir alert tradicional con Toast ultra moderno
window.alert = function(msg) {
    if (!msg) return;
    let type = 'info';
    const lowerMsg = String(msg).toLowerCase();
    if (lowerMsg.includes('éxito') || lowerMsg.includes('exito') || lowerMsg.includes('correcto') || lowerMsg.includes('guardad')) {
        type = 'success';
    } else if (lowerMsg.includes('error') || lowerMsg.includes('fallo') || lowerMsg.includes('no se found')) {
        type = 'error';
    }
    window.showToast(msg, type);
};

// Diálogo de Confirmación Promificado 100% Premium
window.showConfirm = function(title, message, isDanger = true) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'custom-confirm-overlay';
        
        const iconHtml = isDanger 
            ? '<div class="confirm-icon-box"><i class="fas fa-trash-alt"></i></div>'
            : '<div class="confirm-icon-box primary"><i class="fas fa-exclamation-circle"></i></div>';
            
        const btnClass = isDanger ? 'confirm-btn-danger' : 'confirm-btn-primary';
        const actionText = isDanger ? 'Eliminar' : 'Aceptar';
        
        overlay.innerHTML = `
            <div class="custom-confirm-card">
                ${iconHtml}
                <h3 class="confirm-title">${title}</h3>
                <p class="confirm-message">${message}</p>
                <div class="confirm-actions-row">
                    <button class="confirm-btn confirm-btn-cancel" id="confirm-cancel">Cancelar</button>
                    <button class="confirm-btn ${btnClass}" id="confirm-proceed">${actionText}</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        requestAnimationFrame(() => {
            overlay.classList.add('visible');
        });
        
        const cleanup = (value) => {
            overlay.classList.remove('visible');
            setTimeout(() => {
                overlay.remove();
                resolve(value);
            }, 300);
        };
        
        overlay.querySelector('#confirm-cancel').onclick = () => cleanup(false);
        overlay.querySelector('#confirm-proceed').onclick = () => cleanup(true);
    });
};

// Helper global para comparaciones a prueba de fallos (quita acentos, mayúsculas, espacios)
function normalizeString(str) {
    return String(str || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();
}

// Función para actualizar código de dispositivo
window.updateDeviceCode = function(selectId, inputId) {
    const select = document.getElementById(selectId);
    const input = document.getElementById(inputId);
    if (select && input) {
        const selectedOption = select.options[select.selectedIndex];
        if (selectedOption && selectedOption.dataset.code) {
            input.value = selectedOption.dataset.code;
        } else {
            input.value = '';
        }
    }
};

// DOM Elements
const views = {
    login: document.getElementById('login-container'),
    app: document.getElementById('app-container'),
    dashboard: document.getElementById('view-dashboard'),
    reportes: document.getElementById('view-reportes'),
    lanzamientos: document.getElementById('view-lanzamientos'),
    materiales: document.getElementById('view-materiales')
};

const navLinks = document.querySelectorAll('.nav-links li[data-target]');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    setupMobileNavigation();
    setupForms();
    
    const isLoggedIn = checkSession();
    
    // Si NO está logueado, necesitamos cargar los usuarios para la pantalla de login
    if (!isLoggedIn) {
        loadUsers();
    }
    
    // El catálogo de dispositivos puede cargar silenciosamente en segundo plano
    loadDeviceCatalog();
});

function checkSession() {
    const savedUser = localStorage.getItem('xiaomi_user');
    if (savedUser) {
        try {
            APP_CONFIG.currentUser = JSON.parse(savedUser);
            startApp();
            return true;
        } catch(e) { return false; }
    }
    return false;
}

// --- Navigation Logic ---
function setupNavigation() {
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const target = link.getAttribute('data-target');
            showView(target);
            
            // Update active class
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    const sidebarHeader = document.querySelector('.sidebar-header');
    if (sidebarHeader) {
        sidebarHeader.addEventListener('click', () => {
            showView('dashboard');
            navLinks.forEach(l => l.classList.remove('active'));
            const dashLink = Array.from(navLinks).find(l => l.getAttribute('data-target') === 'dashboard');
            if (dashLink) dashLink.classList.add('active');
        });
    }

    logoutBtn.addEventListener('click', () => {
        APP_CONFIG.currentUser = null;
        localStorage.removeItem('xiaomi_user');
        localStorage.removeItem('xiaomi_last_view');
        location.reload();
    });
}

function setupMobileNavigation() {
    const mobileTabs = document.querySelectorAll('.mobile-bottom-nav-item');
    if (!mobileTabs.length) return;
    
    mobileTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-target');
            
            // 1. Simular clic en el enlace de navegación de escritorio correspondiente
            const desktopLink = Array.from(navLinks).find(l => l.getAttribute('data-target') === target);
            if (desktopLink) {
                // Hacer clic en él para desencadenar la carga de datos y visibilidad
                desktopLink.click();
            } else {
                // Fallback por si acaso
                showView(target);
            }
            
            // 2. Sincronizar clase activa en mobile tabs
            mobileTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });
}

window.toggleMobileMessagesView = function(viewName) {
    const redactDiv = document.querySelector('#messages-form-grid > div:first-child');
    const inboxDiv = document.querySelector('#messages-form-grid > div:last-child');
    const btnInbox = document.getElementById('btn-toggle-inbox');
    const btnCompose = document.getElementById('btn-toggle-compose');
    
    if (viewName === 'inbox') {
        if (redactDiv) redactDiv.classList.add('mobile-hidden');
        if (inboxDiv) inboxDiv.classList.remove('mobile-hidden');
        if (btnInbox) btnInbox.classList.add('active');
        if (btnCompose) btnCompose.classList.remove('active');
    } else if (viewName === 'compose') {
        if (redactDiv) redactDiv.classList.remove('mobile-hidden');
        if (inboxDiv) inboxDiv.classList.add('mobile-hidden');
        if (btnInbox) btnInbox.classList.remove('active');
        if (btnCompose) btnCompose.classList.add('active');
    }
};

async function showView(viewName) {
    localStorage.setItem('xiaomi_last_view', viewName);
    
    // Cerrar modales flotantes al cambiar de pestaña
    const historialModal = document.getElementById('historial-modal');
    if (historialModal) {
        historialModal.style.display = 'none';
        historialModal.classList.add('hidden');
    }
    
    // Hide all sub-views explicitly
    document.querySelectorAll('.sub-view').forEach(v => {
        v.style.display = 'none';
        v.classList.add('hidden');
    });
    
    // Show selected view
    const targetView = document.getElementById(`view-${viewName}`);
    if (targetView) {
        targetView.style.display = 'block';
        targetView.classList.remove('hidden');
        // Título con Icono dinámico adaptado
        let formattedTitle = viewName.charAt(0).toUpperCase() + viewName.slice(1);
        let iconHtml = '';
        
        if (viewName === 'dashboard') {
            iconHtml = '<i class="fas fa-chart-line" style="margin-right:8px; font-size:0.85em;"></i>';
        }
        if (viewName === 'reportes') {
            formattedTitle = 'Reporte Incidencias';
            iconHtml = '<i class="fas fa-clipboard-list" style="margin-right:8px; font-size:0.85em;"></i>';
        }
        if (viewName === 'lanzamientos') {
            iconHtml = '<i class="fas fa-rocket" style="margin-right:8px; font-size:0.85em;"></i>';
        }
        if (viewName === 'materiales') {
            formattedTitle = 'Tiendas';
            iconHtml = '<i class="fas fa-store" style="margin-right:8px; font-size:0.85em;"></i>';
            if (typeof renderTiendasView === 'function') {
                renderTiendasView();
            }
        }
        if (viewName === 'mensajes') {
            formattedTitle = 'Centro de Mensajes';
            iconHtml = '<i class="fas fa-bell" style="margin-right:8px; font-size:0.85em;"></i>';
        }
document.getElementById('view-title').innerHTML = iconHtml + formattedTitle;
        
        // Cargar data según vista
        if (viewName === 'dashboard' || viewName === 'reportes') loadDashboard();
        if (viewName === 'mensajes') {
            window.loadMessagingUsers();
            window.loadMessagingMotivos();
            window.loadUserInbox();
            if (!APP_CONFIG.dashboardReports || APP_CONFIG.dashboardReports.length === 0) {
                loadDashboard().then(() => {
                    window.loadMessagingMotivos();
                }).catch(e => console.error("Error pre-loading dashboard data:", e));
            }
        }
        if (viewName === 'lanzamientos') {
            const userRole = String(APP_CONFIG.currentUser?.rol || '').trim().toUpperCase();
            const isAdmin = userRole === 'ADMIN' || userRole === 'ADMINISTRADOR';
            const sidebar = document.getElementById('launch-filter-sidebar');
            if (sidebar) {
                sidebar.style.display = isAdmin ? 'flex' : 'none';
            }
            
            // Popula selector y carga tiendas de forma asíncrona (evita condición de carrera en la UI)
            (async () => {
                try {
                    await loadLaunches();
                    
                    const presetLaunch = APP_CONFIG.presetLaunchName;
                    if (presetLaunch) {
                        const sel = document.getElementById('launch-selector');
                        if (sel) {
                            const exists = Array.from(sel.options).find(o => o.value === presetLaunch);
                            if (exists) sel.value = presetLaunch;
                        }
                        APP_CONFIG.presetLaunchName = null; // Consume and clear
                    }
                    
                    // Si venimos de un redireccionamiento rápido, fijar lanzamiento correcto ANTES del fetch
                    if (window._pendingQuickLaunch) {
                        const select = document.getElementById('launch-selector');
                        if (select) select.value = window._pendingQuickLaunch;
                        window._pendingQuickLaunch = null; // Consumido
                    }
                    
                    // ÚNICA CARGA LIMPIA DE DATOS (Acelerado)
                    await loadLaunchStores();
                    
                    // Selección automática inmediata sin polling al tener el DOM listo
                    if (window._pendingQuickStore) {
                        const storeToOpen = window._pendingQuickStore;
                        window._pendingQuickStore = null; // Consumido
                        
                        const grid = document.getElementById('launch-store-grid');
                        if (grid) {
                            const cards = grid.querySelectorAll('.dashboard-card');
                            const target = String(storeToOpen).trim().toLowerCase();
                            for (const card of cards) {
                                // Logic for auto-opening
                            }
                        }
                    }
                } catch(e) { console.error(e); }
            })();
        }
        
        // Sincronizar indicador de pestaña activa en móvil
        const correspondingMobileTab = Array.from(document.querySelectorAll('.mobile-bottom-nav-item'))
            .find(t => t.getAttribute('data-target') === viewName);
        if (correspondingMobileTab) {
            document.querySelectorAll('.mobile-bottom-nav-item').forEach(t => t.classList.remove('active'));
            correspondingMobileTab.classList.add('active');
        }
        
        // Inicializar por defecto la bandeja de entrada si es móvil en la vista de mensajes
        if (viewName === 'mensajes' && window.innerWidth <= 768) {
            window.toggleMobileMessagesView('inbox');
        }
    }
}

// ==============================================================
// TIENDAS VIEW LOGIC
// ==============================================================

window.renderTiendasView = function() {
    const grid = document.getElementById('tiendas-grid');
    if (!grid) return;
    
    // Obtener las tiendas del usuario (ya sea Admin o Standard)
    let stores = APP_CONFIG.currentUser.tiendas || [];
    
    // Configurar filtros la primera vez
    const userRole = String(APP_CONFIG.currentUser.rol || '').trim().toUpperCase();
    const isAdmin = userRole === 'ADMIN' || userRole === 'ADMINISTRADOR';
    
    const filterCuenta = document.getElementById('tiendas-filter-cuenta');
    const filterTienda = document.getElementById('tiendas-filter-tienda');
    const filterUsuario = document.getElementById('tiendas-filter-usuario');
    
    if (!window.tiendasFiltersInitialized) {
        window.tiendasFiltersInitialized = true;
        
        // Rellenar select de Cuentas
        const cuentas = [...new Set(stores.map(t => String(t.cuenta || '').trim()))].filter(Boolean).sort();
        filterCuenta.innerHTML = '<option value="all">Todas las Cuentas</option>';
        cuentas.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c; opt.textContent = c;
            filterCuenta.appendChild(opt);
        });
        
        // Función para actualizar el select de Tiendas
        window.updateSelectTiendas = function() {
            const filterTienda = document.getElementById('tiendas-filter-tienda');
            const filterUsuario = document.getElementById('tiendas-filter-usuario');
            const selectedCuenta = filterCuenta.value;
            const selectedUsuario = filterUsuario && filterUsuario.style.display !== 'none' ? filterUsuario.value : 'all';
            
            if (filterTienda) {
                const currentVal = filterTienda.value;
                const filterList = document.getElementById('tiendas-filter-tienda-list');
                if (filterList) {
                    filterList.innerHTML = '';
                    let storesFiltered = stores;
                    
                    if (selectedCuenta !== 'all') {
                        storesFiltered = storesFiltered.filter(t => String(t.cuenta || '').trim() === selectedCuenta);
                    }
                    if (selectedUsuario !== 'all') {
                        storesFiltered = storesFiltered.filter(t => String(t.usuario || t.owner || '').trim() === selectedUsuario);
                    }
                    
                    const tiendas = [...new Set(storesFiltered.map(t => String(t.nombre || '').trim()))].filter(Boolean).sort();
                    tiendas.forEach(t => {
                        const opt = document.createElement('option');
                        opt.value = t;
                        filterList.appendChild(opt);
                    });
                    
                    if (!tiendas.includes(currentVal)) {
                        filterTienda.value = '';
                    }
                }
            }
        };
        
        window.updateSelectTiendas();
        
        // Rellenar select de Usuarios (Solo Admin)
        if (isAdmin && filterUsuario) {
            filterUsuario.style.display = 'inline-block';
            const usuarios = [...new Set(stores.map(t => String(t.usuario || t.owner || '').trim()))].filter(Boolean).sort();
            filterUsuario.innerHTML = '<option value="all">Todos los Usuarios</option>';
            usuarios.forEach(u => {
                const opt = document.createElement('option');
                opt.value = u; opt.textContent = u;
                filterUsuario.appendChild(opt);
            });
        } else if (filterUsuario) {
            filterUsuario.style.display = 'none';
        }
        
        // Event Listeners
        filterCuenta.addEventListener('change', () => {
            if(filterTienda) filterTienda.value = ''; // Reset tienda when cuenta changes
            window.updateSelectTiendas();
            renderTiendasGrid();
        });
        filterTienda.addEventListener('change', renderTiendasGrid);
        if (filterUsuario) {
            filterUsuario.addEventListener('change', () => {
                if(filterTienda) filterTienda.value = ''; // Reset tienda when usuario changes
                window.updateSelectTiendas();
                renderTiendasGrid();
            });
        }
    }
    
    renderTiendasGrid();
};

window.renderTiendasGrid = function() {
    const grid = document.getElementById('tiendas-grid');
    if (!grid) return;
    
    const userRole = String(APP_CONFIG.currentUser.rol || '').trim().toUpperCase();
    const isAdmin = userRole === 'ADMIN' || userRole === 'ADMINISTRADOR';
    
    const fCuenta = document.getElementById('tiendas-filter-cuenta').value;
    const fTienda = document.getElementById('tiendas-filter-tienda').value.toLowerCase().trim();
    const fUsuario = document.getElementById('tiendas-filter-usuario') ? document.getElementById('tiendas-filter-usuario').value : 'all';
    
    let stores = APP_CONFIG.currentUser.tiendas || [];
    
    // ESTADO EN BLANCO PARA ADMIN: Si es admin y no ha seleccionado NADA (todo está en 'all' y texto vacío)
    if (isAdmin && fCuenta === 'all' && fTienda === '' && fUsuario === 'all') {
        grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #888; padding: 2rem 0; font-size: 0.95rem;"><i class="fas fa-search" style="font-size: 2rem; color: #ddd; margin-bottom: 10px; display: block;"></i>Utiliza los filtros de arriba para buscar y mostrar tiendas.</div>';
        return;
    }
    
    // Aplicar filtros
    let filtered = stores.filter(t => {
        let match = true;
        
        if (fCuenta !== 'all' && String(t.cuenta || '').trim() !== fCuenta) match = false;
        
        if (fTienda !== '') {
            const tName = String(t.nombre || '').toLowerCase();
            const tRms = String(t.rms || '').toLowerCase();
            if (!tName.includes(fTienda) && !tRms.includes(fTienda)) match = false;
        }
        
        if (isAdmin && fUsuario !== 'all') {
            const tOwner = String(t.usuario || t.owner || '').trim();
            if (tOwner !== fUsuario) match = false;
        }
        
        return match;
    });
    
    grid.innerHTML = '';
    
    if (filtered.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #888; padding: 2rem 0;">No se encontraron tiendas con estos filtros.</div>';
        return;
    }
    
    // Ordenar alfabéticamente por nombre de tienda
    filtered.sort((a, b) => String(a.nombre || '').localeCompare(String(b.nombre || '')));
    
    filtered.forEach(t => {
        const getVal = (key) => {
            if (t[key] !== undefined && t[key] !== null) return t[key];
            if (t[key.toLowerCase()] !== undefined && t[key.toLowerCase()] !== null) return t[key.toLowerCase()];
            if (t[key.toUpperCase()] !== undefined && t[key.toUpperCase()] !== null) return t[key.toUpperCase()];
            return 0;
        };
        const getStr = (key) => {
            if (t[key] !== undefined && t[key] !== null) return t[key];
            if (t[key.toLowerCase()] !== undefined && t[key.toLowerCase()] !== null) return t[key.toLowerCase()];
            if (t[key.toUpperCase()] !== undefined && t[key.toUpperCase()] !== null) return t[key.toUpperCase()];
            return '';
        };

        const valMesa = parseFloat(getVal('Mesa')) || 0;
        const valTopTable = getVal('Top Table');
        const valColumna = parseFloat(getVal('Columna')) || 0;
        const valLightboxColumn = getVal('Lightbox Column');
        const valWall = parseFloat(getVal('Wall')) || 0;
        const valLightboxWall = getVal('Lightbox Wall');
        const valUrl = getStr('Url Guia');

        // No mostrar la tienda si las 3 mtricas son 0
        if (valMesa === 0 && valColumna === 0 && valWall === 0) {
            return;
        }

        const card = document.createElement('div');
        card.style.background = '#fff';
        card.style.border = '1px solid #eee';
        card.style.borderRadius = '8px';
        card.style.padding = '15px';
        card.style.boxShadow = '0 2px 5px rgba(0,0,0,0.02)';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.gap = '8px';
        card.style.height = '100%';
        card.style.minHeight = '90px';
        card.style.boxSizing = 'border-box';
        
        const nombre = t.nombre || 'Sin Nombre';
        let fontSize = '1.05rem';
        if (nombre.length > 22) {
            fontSize = '0.85rem';
        } else if (nombre.length > 16) {
            fontSize = '0.95rem';
        }

        let html = `
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                <h4 style="margin: 0; color: #333; font-size: ${fontSize}; display: flex; align-items: center; gap: 8px; flex-wrap: nowrap; overflow: hidden; white-space: nowrap;">
                    <i class="fas fa-store" style="color: var(--mi-orange); font-size: 0.9rem; flex-shrink: 0;"></i> 
                    <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${nombre}</span>
                    <span style="font-size: 0.75rem; background: #e6f7ff; color: #0050b3; padding: 2px 6px; border-radius: 4px; border: 1px solid #91d5ff; font-weight: normal; flex-shrink: 0;">${t.cuenta || 'Sin Cuenta'}</span>
                </h4>
            </div>
        `;

        html += `
            <div style="display: flex; gap: 15px; margin-top: auto; flex-wrap: wrap; align-items: flex-start; padding-top: 10px; border-top: 1px solid #f0f0f0;">
        `;
        
        if (valMesa > 0) {
            html += `
                <!-- Mesa -->
                <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; min-width: 45px;" onclick="const s = this.querySelector('.subcat-content'); s.style.display = s.style.display === 'none' ? 'block' : 'none';">
                    <span style="display:inline-block; width: 20px; height: 14px; border-top: 3px solid #666; border-left: 2px solid #666; border-right: 2px solid #666; border-radius: 2px 2px 0 0;"></span>
                    <span style="font-size: 0.8rem; font-weight: bold; margin-top: 4px; color: #444;">${valMesa}</span>
                    <div class="subcat-content" style="display: none; font-size: 0.7rem; color: #888; margin-top: 4px; text-align: center; background: #f9f9f9; padding: 4px; border-radius: 4px; border: 1px solid #eee;">TOP TABLE<br><b style="color:#444">${valTopTable}</b></div>
                </div>
            `;
        }
        
        if (valColumna > 0) {
            html += `
                <!-- Columna -->
                <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; min-width: 45px;" onclick="const s = this.querySelector('.subcat-content'); s.style.display = s.style.display === 'none' ? 'block' : 'none';">
                    <div style="display: flex; flex-direction: column; align-items: center; color: #666;">
                      <div style="width: 14px; height: 6px; border: 2px solid currentColor; border-bottom: none;"></div>
                      <div style="width: 20px; height: 2px; background: currentColor;"></div>
                      <div style="width: 14px; height: 14px; border: 2px solid currentColor; border-top: none;"></div>
                    </div>
                    <span style="font-size: 0.8rem; font-weight: bold; margin-top: 4px; color: #444;">${valColumna}</span>
                    <div class="subcat-content" style="display: none; font-size: 0.7rem; color: #888; margin-top: 4px; text-align: center; background: #f9f9f9; padding: 4px; border-radius: 4px; border: 1px solid #eee;">Lightbox Column<br><b style="color:#444">${valLightboxColumn}</b></div>
                </div>
            `;
        }

        if (valWall > 0) {
            html += `
                <!-- Wall -->
                <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; min-width: 45px;" onclick="const s = this.querySelector('.subcat-content'); s.style.display = s.style.display === 'none' ? 'block' : 'none';">
                    <div style="display: flex; flex-direction: column; align-items: center; color: #666;">
                      <div style="width: 22px; height: 12px; border: 2px solid currentColor; border-bottom: none; border-radius: 2px 2px 0 0;"></div>
                      <div style="width: 26px; height: 2px; background: currentColor;"></div>
                      <div style="width: 22px; height: 8px; background: currentColor;"></div>
                    </div>
                    <span style="font-size: 0.8rem; font-weight: bold; margin-top: 4px; color: #444;">${valWall}</span>
                    <div class="subcat-content" style="display: none; font-size: 0.7rem; color: #888; margin-top: 4px; text-align: center; background: #f9f9f9; padding: 4px; border-radius: 4px; border: 1px solid #eee;">Lightbox Wall<br><b style="color:#444">${valLightboxWall}</b></div>
                </div>
            `;
        }
        
        if (valMesa > 0 && valUrl && String(valUrl).trim() !== '' && String(valUrl).trim() !== '0') {
            html += `
                <!-- Url Guia -->
                <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; margin-left: auto;" onclick="window.open('${valUrl}', '_blank')">
                    <i class="fas fa-file-invoice" style="font-size: 1.2rem; color: var(--mi-orange);"></i>
                    <span style="font-size: 0.7rem; color: var(--mi-orange); margin-top: 4px; font-weight: bold;">Guía</span>
                </div>
            `;
        }
        
        html += `</div>`;
        
        if (isAdmin && (t.usuario || t.owner)) {
            html += `<div style="margin-top: 8px; font-size: 0.8rem; color: #666; border-top: 1px dashed #eee; padding-top: 5px;"><i class="fas fa-user-circle"></i> ${t.usuario || t.owner}</div>`;
        }
        
        card.innerHTML = html;
        grid.appendChild(card);
    });
};

window.clearTiendasFilters = function() {
    const filterCuenta = document.getElementById('tiendas-filter-cuenta');
    const filterTienda = document.getElementById('tiendas-filter-tienda');
    const filterUsuario = document.getElementById('tiendas-filter-usuario');
    
    if (filterCuenta) filterCuenta.value = 'all';
    if (filterTienda) filterTienda.value = '';
    if (filterUsuario) filterUsuario.value = 'all';
    
    if (typeof window.renderTiendasGrid === 'function') {
        window.renderTiendasGrid();
    }
};

window.clearDashboardFilters = function() {
    const fCuenta = document.getElementById('dash-filter-cuenta');
    const fTienda = document.getElementById('dash-filter-tienda');
    const fTipo = document.getElementById('dash-filter-tipo');
    const fUsuario = document.getElementById('dash-filter-usuario');
    const fEstado = document.getElementById('dash-filter-estado');
    
    if (fCuenta) fCuenta.value = 'all';
    if (fTienda) fTienda.value = 'all';
    if (fTipo) fTipo.value = 'all';
    if (fUsuario) fUsuario.value = 'all';
    if (fEstado) fEstado.value = 'all';
    
    if (typeof window.filterDashboardTable === 'function') {
        window.filterDashboardTable();
    }
};
window.refreshAllDashboardData = async function() {
    const btn = document.querySelector('.capsule-search-btn');
    if (btn) {
        const icon = btn.querySelector('i');
        if (icon) icon.classList.add('fa-spin');
    }
    
    // Clear local memory cache
    APP_CONFIG.dashboardReports = null; 
    APP_CONFIG.launches = [];
    
    await loadDashboard();
    
    if (btn) {
        const icon = btn.querySelector('i');
        if (icon) icon.classList.remove('fa-spin');
    }
};

async function loadDashboard() {
    const tableBody = document.querySelector('#recent-reports-table tbody');
    const accountFilter = document.getElementById('dash-account-filter');

    // 1. REHIDRATACIÓN INMEDIATA DE SESIÓN PARA EVITAR FLICKER
    if (!APP_CONFIG.currentUser) {
        const saved = localStorage.getItem('xiaomi_user');
        if (saved) {
            APP_CONFIG.currentUser = JSON.parse(saved);
        }
    }
    
    if (!APP_CONFIG.currentUser) {
        console.warn("Sesión perdida.");
        return; // Dejar que la app maneje logout o login
    }

    // 2. APLICAR FILTRADO POR ROL INSTANTÁNEAMENTE
    const userRole = String(APP_CONFIG.currentUser.rol || '').trim().toUpperCase();
    const isAdmin = userRole === 'ADMIN' || userRole === 'ADMINISTRADOR';
    const dashLaunchCapsule = document.getElementById('dash-launch-filter-capsule');
    if (dashLaunchCapsule) {
        dashLaunchCapsule.style.display = isAdmin ? 'flex' : 'none';
    }

    // OPTIMIZACIÓN: Renderizado instantáneo desde Caché local (si ya existe data previa)
    if (APP_CONFIG.dashboardReports && APP_CONFIG.dashboardReports.length > 0) {
        // Renderizamos silenciosamente lo que ya tenemos para CERO latencia percibida
        console.log("Renders instantáneo desde caché...");
        renderDashboardFromData(APP_CONFIG.dashboardReports);
        // Pero lanzamos la actualización en background igual
    } else {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;"><i class="fas fa-spinner fa-spin"></i> Sincronizando datos iniciales...</td></tr>';
    }
    
    try {

        const data = await callApi({ 
            action: 'getDashboardData',
            rol: APP_CONFIG.currentUser?.rol || 'usuario'
        });

        
        if (data.error) throw new Error(data.error);
        
        let userReports = (data.recentReports || []).filter(r => r && r.id && String(r.tienda || '').trim() !== '');
        const userRole = String(APP_CONFIG.currentUser.rol || '').trim().toUpperCase();
        const isAdmin = userRole === 'ADMIN' || userRole === 'ADMINISTRADOR';
        
        if (!isAdmin) {
            const myEmail = String((APP_CONFIG.currentUser.email || APP_CONFIG.currentUser.usuario) || '').trim().toLowerCase();
            const myStores = APP_CONFIG.currentUser.tiendas || [];
            const myStoreNames = myStores.map(t => String(t.nombre).trim().toLowerCase());
            
            userReports = userReports.filter(r => {
                const isMyUser = String(r.usuario || '').trim().toLowerCase() === myEmail;
                const isMyStore = myStoreNames.includes(String(r.tienda || '').trim().toLowerCase());
                return isMyUser || isMyStore;
            });
        }
        
        
        // FIX: Si el backend (GAS) fuerza categoria="Dispositivo" o hay desajustes de acentos
        // Buscamos en TODOS los valores del objeto para detectar si es una lona o pantalla
        userReports.forEach(r => {
            const allValuesStr = Object.values(r).map(v => String(v || '').toLowerCase()).join(' ');
            if (allValuesStr.includes('lona') || allValuesStr.includes('lightbox') || allValuesStr.includes('top table')) {
                r.categoria = 'Lonas';
                r.tipo = 'Lona';
            } else if (allValuesStr.includes('pantalla') || allValuesStr.includes('digital')) {
                r.categoria = 'Pantalla Digital';
                r.tipo = 'Pantalla';
            }
        });

        APP_CONFIG.dashboardReports = userReports;
        
        // Ejecutar actualización visual final con la data fresca
        renderDashboardFromData(userReports, isAdmin);
        
        // Cargar lanzamientos para el resumen (También optimizado internamente)
        await window.renderDashboardLaunches();
        
    } catch (err) {
        console.error('Error loading dashboard:', err);
        if (!APP_CONFIG.dashboardReports || APP_CONFIG.dashboardReports.length === 0) {
             const safeMsg = String(err.message || err).substring(0, 100);
             tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:red; font-size:12px; padding:20px;">
                 <i class="fas fa-exclamation-triangle"></i> Error al cargar datos:<br>
                 <code style="background:#fff5f5; padding:2px 6px; border-radius:4px; border:1px solid #ffcccc; margin-top:5px; display:inline-block;">${safeMsg}</code>
             </td></tr>`;
        }
    }
}

/**
 * Extraído para permitir renderizado repetido rápido tanto desde caché como desde respuesta viva
 */
function renderDashboardFromData(userReports, explicitIsAdmin = null) {
    // NUEVO: Analizar cambios de estado y generar notificaciones si las hay
    checkStatusChanges(userReports);

    const userRole = String(APP_CONFIG.currentUser?.rol || '').trim().toUpperCase();
    const isAdmin = explicitIsAdmin !== null ? explicitIsAdmin : (userRole === 'ADMIN' || userRole === 'ADMINISTRADOR');
    
    // Calcular estadísticas dinámicamente por estados específicos
    const countByStatus = (statusStr) => userReports.filter(r => String(r.estado || '').trim().toLowerCase().includes(statusStr)).length;
    
    const openIncidents = countByStatus('abierta');
    const pendingIncidents = countByStatus('pendiente');
    const solvedIncidents = countByStatus('solucionado');
    const closedIncidents = countByStatus('cerrada') + countByStatus('cerrado'); // handle variants

    // Actualizar estadísticas principales
    const statTotalEl = document.getElementById('stat-total');
    if (statTotalEl) statTotalEl.textContent = userReports.length;
    
    // Actualizar los 4 Cuadrantes Específicos
    const setStat = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };
    
    setStat('stat-incidents-open', openIncidents);
    setStat('stat-incidents-pending', pendingIncidents);
    setStat('stat-incidents-solved', solvedIncidents);
    setStat('stat-incidents-closed', closedIncidents);
    
    // Novedad: Estadísticas por Categoría
    const countByCategory = (catStr) => userReports.filter(r => String(r.categoria || '').trim().toLowerCase().includes(catStr)).length;
    setStat('dash-cat-mobiliario', countByCategory('mobiliario'));
    setStat('dash-cat-dispositivo', countByCategory('dispositivo'));
    setStat('dash-cat-pantalla', countByCategory('pantalla'));
    setStat('dash-cat-lonas', countByCategory('lona'));
    
    const accountFilter = document.getElementById('dash-account-filter');
    if (isAdmin) {
        const titleEl = document.getElementById('dashboard-table-title');
        if (titleEl) titleEl.textContent = 'Historial de Reportes';
        const adminFilters = document.getElementById('admin-filters');
        if (adminFilters) {
            adminFilters.classList.remove('hidden');
            adminFilters.style.display = 'flex';
        }
        if (accountFilter) accountFilter.style.display = 'none';
        populateDashboardFilters(userReports);
    } else {
        const titleEl = document.getElementById('dashboard-table-title');
        if (titleEl) titleEl.textContent = 'Historial de Reportes';
        const adminFilters = document.getElementById('admin-filters');
        if (adminFilters) {
            adminFilters.classList.add('hidden');
            adminFilters.style.display = 'none';
        }
        if (accountFilter) accountFilter.style.display = 'inline-block';
    }
    
    // Rellenar nuevos filtros de la tabla
    const filterCuenta = document.getElementById('dash-filter-cuenta');
    const filterTienda = document.getElementById('dash-filter-tienda');
    const filterUsuario = document.getElementById('dash-filter-usuario');
    
    if (filterUsuario) {
        filterUsuario.style.display = isAdmin ? 'inline-block' : 'none';
        const users = [...new Set(userReports.map(r => String(r.usuario || '').trim()))].filter(Boolean).sort();
        filterUsuario.innerHTML = '<option value="all">Todos Usuarios</option>';
        users.forEach(u => {
            const opt = document.createElement('option');
            opt.value = u; opt.textContent = u;
            filterUsuario.appendChild(opt);
        });
    }

    if (filterCuenta) {
        const accounts = [...new Set(userReports.map(r => String(r.cuenta || '').trim()))].filter(Boolean).sort();
        filterCuenta.innerHTML = '<option value="all">Todas Cuentas</option>';
        accounts.forEach(acc => {
            const opt = document.createElement('option');
            opt.value = acc; opt.textContent = acc;
            filterCuenta.appendChild(opt);
        });
    }
    
    if (filterTienda) {
        const stores = [...new Set(userReports.map(r => String(r.tienda || '').trim()))].filter(Boolean).sort();
        const filterList = document.getElementById('dash-filter-tienda-list');
        if (filterList) {
            filterList.innerHTML = '';
            stores.forEach(store => {
                const opt = document.createElement('option');
                opt.value = store;
                filterList.appendChild(opt);
            });
        }
    }
    
    // Resetear filtros visuales a ALL al cargar
    const filterEst = document.getElementById('dash-filter-estado');
    if (filterEst) filterEst.value = 'all';
    if (filterCuenta) filterCuenta.value = 'all';
    if (filterTienda) filterTienda.value = '';
    
    renderDashboardTable(userReports);
}

function renderDashboardTable(reports) {
    const userRole = String(APP_CONFIG.currentUser?.rol || '').trim().toUpperCase();
    const isAdmin = userRole === 'ADMIN' || userRole === 'ADMINISTRADOR';
    
    const thUsuario = document.getElementById('th-usuario');
    if (thUsuario) {
        thUsuario.style.display = isAdmin ? '' : 'none';
    }

    const tableBody = document.querySelector('#recent-reports-table tbody');
    tableBody.innerHTML = '';
    
    if (reports.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No hay actividad reciente.</td></tr>';
        return;
    }
    
    reports.forEach(r => {
        const row = document.createElement('tr');
        row.onclick = function(e) {
            if (window.innerWidth <= 768) {
                // Prevenir que se expanda/cierre si se hace click directamente en un botón de acción
                if (e.target.tagName.toLowerCase() === 'button' || e.target.closest('button')) return;
                this.classList.toggle('expanded');
            }
        };
        
        // Estilos para el estado
        let statusClass = 'color:#95a5a6;font-weight:600';
        const est = String(r.estado || '').trim().toLowerCase();
        if (est === 'abierta') {
            statusClass = 'color:#e74c3c;font-weight:600'; // Rojo
        } else if (est === 'cerrada') {
            statusClass = 'color:#2ecc71;font-weight:600'; // Verde
        } else if (est === 'pendiente') {
            statusClass = 'color:#faad14;font-weight:600'; // Amarillo
        } else if (est === 'solucionado') {
            statusClass = 'color:#1890ff;font-weight:600'; // Azul
        }
        
        // Fix UX: Priorizar valor de tiempo de Excel, solo calcular dinámico si está vacío
        let rawTiempo = r.tiempo;
        let displayTiempo = (rawTiempo !== undefined && rawTiempo !== null && rawTiempo !== '') ? String(rawTiempo).trim() : '';
        const isResolvedTiempo = est === 'solucionado' || est === 'cerrada' || est === 'cerrado' || est === 'realizado' || est === 'realizada';
        
        if (displayTiempo !== '') {
            // Si está solucionado y el Excel manda '0' o un número fijo, lo respetamos para que no siga sumando.
            if (displayTiempo === '0' && !isResolvedTiempo) {
                displayTiempo = ''; // Forzamos recálculo
            } else {
                if (!isNaN(displayTiempo)) {
                    // Evitar días negativos que vengan del Excel por desajuste de zona horaria
                    if (parseInt(displayTiempo) < 0) {
                        displayTiempo = '0 días';
                    } else {
                        displayTiempo += ' días';
                    }
                }
            }
        }
        
        if (displayTiempo === '') {
            // Fallback solo si el Excel no tiene nada calculado
            const fechaStr = String(r.fecha || '');
            const reportDate = new Date(fechaStr.replace(/-/g, '/')); 
            if (!isNaN(reportDate.getTime())) {
                if (isResolvedTiempo) {
                    // Si está solucionado pero el Excel lo mandó vacío, probamos con fechaCierre
                    if (r.fechaCierre) {
                        const closeDate = new Date(String(r.fechaCierre).replace(/-/g, '/'));
                        if (!isNaN(closeDate.getTime())) {
                            const diffTime = Math.abs(closeDate.getTime() - reportDate.getTime());
                            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                            displayTiempo = `${diffDays} días`;
                        } else {
                            displayTiempo = '0 días';
                        }
                    } else {
                        displayTiempo = '0 días'; 
                    }
                } else {
                    const diffTime = Math.abs(Date.now() - reportDate.getTime());
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                    displayTiempo = `${diffDays} días`; 
                }
            } else {
                displayTiempo = '0 días';
            }
        }
        
        const usuarioTd = isAdmin ? `<td>${r.usuario}</td>` : '';
        
        row.innerHTML = `
            <td>${r.fecha}</td>
            ${usuarioTd}
            <td>${r.cuenta}</td>
            <td>${r.tienda}</td>
            <td>${r.tipo}</td>
            <td style="font-weight:500;">${displayTiempo}</td>
            <td style="${statusClass}">${r.estado}</td>
            <td style="text-align:center;"></td>
        `;
        row.style.cursor = 'pointer';
        row.title = 'Haz clic para operar la incidencia';
        row.onclick = () => showQuickBox(r);
        
        const actionTd = row.querySelector('td:last-child');
        const flexWrapper = document.createElement('div');
        flexWrapper.className = 'table-actions-wrapper';
        actionTd.appendChild(flexWrapper);
        
        // Circular Button "Ver"
        const verBtn = document.createElement('button');
        verBtn.className = 'action-btn-circle';
        verBtn.innerHTML = '<i class="fas fa-eye"></i>';
        verBtn.title = 'Ver Detalles Completos';
        verBtn.onclick = (e) => {
            e.stopPropagation();
            window.showReportDetails(r);
        };
        flexWrapper.appendChild(verBtn);

        // BOTONES DE GESTIÓN UNIVERSAL: Editar (para ABIERTA y PENDIENTE) y Eliminar solo para estado ABIERTA
        if (est === 'abierta' || est === 'pendiente') {
            // Botón Editar (Lápiz azul-turquesa)
            const editBtn = document.createElement('button');
            editBtn.className = 'action-btn-circle';
            editBtn.style.color = '#00bcd4'; 
            editBtn.innerHTML = '<i class="fas fa-pencil-alt"></i>';
            editBtn.title = 'Editar este reporte';
            editBtn.onclick = (e) => {
                e.stopPropagation();
                window.jumpToCreateReportForStore(r); 
            };
            flexWrapper.appendChild(editBtn);

            if (est === 'abierta') {
                // Botón Eliminar (Basura roja)
                const delBtn = document.createElement('button');
                delBtn.className = 'action-btn-circle';
                delBtn.style.color = '#e74c3c'; 
                delBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
                delBtn.title = 'Eliminar este reporte permanentemente';
                delBtn.onclick = async (e) => {
                    e.stopPropagation();
                    if (await window.showConfirm('¿Eliminar Reporte?', '¿Seguro que deseas ELIMINAR este reporte permanentemente? Esta acción no se puede deshacer.', true)) {
                        await window.deleteDashboardReport(r.id);
                    }
                };
                flexWrapper.appendChild(delBtn);
            }
        }
        
        // BOTÓN UNIVERSAL: Marcar como Solucionado (para PENDIENTE, disponible para todos incl. Admin)
        if (est === 'pendiente') {
            const resBtn = document.createElement('button');
            resBtn.className = 'action-btn-circle';
            resBtn.style.color = '#52c41a';
            resBtn.innerHTML = '<i class="fas fa-check"></i>';
            resBtn.title = 'Marcar como Solucionado';
            resBtn.onclick = (e) => {
                e.stopPropagation();
                window.showQuickBox(r);
            };
            flexWrapper.appendChild(resBtn);
        }

        // Special Admin Direct Buttons in dashboard table row
        
        if (isAdmin) {
            if (est === 'abierta') {
                const repairBtn = document.createElement('button');
                repairBtn.className = 'action-btn-circle';
                repairBtn.style.color = '#e67e22';
                repairBtn.innerHTML = '<i class="fas fa-tools"></i>';
                repairBtn.title = 'Marcar como Solicitado reparación';
                repairBtn.onclick = async (e) => {
                    e.stopPropagation();
                    await window.changeIncidentStatus(r.id, 'Pendiente');
                };
                flexWrapper.appendChild(repairBtn);
            } else if (est === 'solucionado') {
                const reviewBtn = document.createElement('button');
                reviewBtn.className = 'action-btn-circle';
                reviewBtn.style.color = '#2ecc71';
                reviewBtn.innerHTML = '<i class="fas fa-search"></i>';
                reviewBtn.title = 'Revisar Resolución';
                reviewBtn.onclick = (e) => {
                    e.stopPropagation();
                    window.showReportDetails(r);
                    // Auto open review box inside the detail modal after short delay
                    setTimeout(() => {
                        const revBtn = document.getElementById('admin-review-btn');
                        if (revBtn) revBtn.click();
                    }, 250);
                };
                flexWrapper.appendChild(reviewBtn);
            }
        }
        
        tableBody.appendChild(row);
    });
}

window.showReportDetails = function(report) {
    const modal = document.getElementById('report-modal');
    const container = document.getElementById('modal-report-details');
    if (!modal || !container) return;
    
    let photosHtml = '';
    const rawFotos = report.fotos || report.photos || '';
    const urls = rawFotos ? rawFotos.split(/[\n,]+/).map(url => url.trim()).filter(Boolean) : [];
    
    if (urls.length > 0) {
        photosHtml = `
            <div class="modal-detail-item">
                <span class="modal-detail-label">Fotos Cargadas:</span>
                <div class="modal-photo-grid">
                    ${urls.map(url => {
                        const directUrl = window.getGoogleDriveThumbnail(url);
                        return `<img src="${directUrl}" class="modal-photo-thumbnail" onclick="window.open('${url}', '_blank')" title="Clic para ampliar" />`;
                    }).join('')}
                </div>
            </div>
        `;
    } else {
        photosHtml = `
            <div class="modal-detail-item">
                <span class="modal-detail-label">Fotos Cargadas:</span>
                <p style="color:var(--mi-gray-dark);font-style:italic;margin:0;">Sin imágenes adjuntas</p>
            </div>
        `;
    }
    
    // Admin Actions inside detail modal
    const userRole = String(APP_CONFIG.currentUser?.rol || '').trim().toUpperCase();
    const isAdmin = userRole === 'ADMIN' || userRole === 'ADMINISTRADOR';
    let adminActionsHtml = '';
    
    if (isAdmin) {
        const estLower = String(report.estado || '').trim().toLowerCase();
        if (estLower === 'abierta' || estLower === 'abierto') {
            adminActionsHtml = `
                <div style="border-top: 1px solid var(--mi-border); padding-top: 1rem; margin-top: 1rem; display: flex; justify-content: flex-end;">
                    <button class="btn-primary" id="admin-repair-btn" style="background:#ff6700; width:auto; padding:8px 16px; border-radius:6px; color:white; border:none; font-size:12px; font-weight:600; cursor:pointer;" onclick="window.changeIncidentStatus('${report.id}', 'Pendiente')">
                        <i class="fas fa-tools"></i> Solicitado reparación
                    </button>
                </div>
            `;
        } else if (estLower === 'solucionado') {
            const newPhotos = urls.slice(1);
            const reviewPhotos = newPhotos.length > 0 ? newPhotos : urls;
            
            adminActionsHtml = `
                <div style="border-top: 1px solid var(--mi-border); padding-top: 1rem; margin-top: 1rem;">
                    <button class="btn-primary" id="admin-review-btn" style="background:#1890ff; width:100%; padding:10px; border-radius:6px; color:white; border:none; font-size:12px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;" onclick="document.getElementById('admin-review-box').style.display='block'; this.style.display='none';">
                        <i class="fas fa-search"></i> Revisar Resolución
                    </button>
                    
                    <div id="admin-review-box" style="display:none; background:#f9f9f9; padding:15px; border-radius:8px; border:1px solid var(--mi-border); margin-top:10px;">
                        <p style="font-weight:600; margin-top:0; margin-bottom:10px; font-size:12px; color:var(--mi-gray-dark);">Nuevas Fotos Subidas (Resolución):</p>
                        <div class="modal-photo-grid" style="margin-bottom:15px;">
                            ${reviewPhotos.map(url => {
                                const directUrl = window.getGoogleDriveThumbnail(url);
                                return `<img src="${directUrl}" class="modal-photo-thumbnail" onclick="window.open('${url}', '_blank')" title="Clic para ampliar" />`;
                            }).join('')}
                        </div>
                        <div style="display:flex; gap:10px; justify-content:flex-end;">
                            <button class="btn-primary" style="background:#ff4d4f; width:auto; padding:8px 14px; border-radius:6px; color:white; border:none; font-size:12px; font-weight:600; cursor:pointer;" onclick="window.changeIncidentStatus('${report.id}', 'Abierta')">
                                <i class="fas fa-times-circle"></i> No cerrado
                            </button>
                            <button class="btn-primary" style="background:#2ecc71; width:auto; padding:8px 14px; border-radius:6px; color:white; border:none; font-size:12px; font-weight:600; cursor:pointer;" onclick="window.changeIncidentStatus('${report.id}', 'Cerrado')">
                                <i class="fas fa-check-circle"></i> Cerrado
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    }
    
    container.innerHTML = `
        <div class="form-grid-2col" style="gap:1rem;">
            <div class="modal-detail-item">
                <span class="modal-detail-label">Fecha:</span>
                <span class="modal-detail-value">${report.fecha}</span>
            </div>
            <div class="modal-detail-item">
                <span class="modal-detail-label">Usuario:</span>
                <span class="modal-detail-value">${report.usuario}</span>
            </div>
            <div class="modal-detail-item">
                <span class="modal-detail-label">Cuenta:</span>
                <span class="modal-detail-value">${report.cuenta}</span>
            </div>
            <div class="modal-detail-item">
                <span class="modal-detail-label">Tienda:</span>
                <span class="modal-detail-value">${report.tienda}</span>
            </div>
        </div>
        
        <div class="modal-detail-item" style="border-top: 1px solid var(--mi-border); padding-top: 0.8rem;">
            <span class="modal-detail-label">Tipo / Categoría:</span>
            <span class="modal-detail-value" style="font-weight: 500;">${report.tipo}</span>
        </div>
        
        <div class="modal-detail-item" style="border-top: 1px solid var(--mi-border); padding-top: 0.8rem;">
            <span class="modal-detail-label">Estado:</span>
            <span class="modal-detail-value" style="font-weight: 600; color:${String(report.estado).toLowerCase().includes('abiert') ? '#e74c3c' : String(report.estado).toLowerCase().includes('cerrad') ? '#2ecc71' : String(report.estado).toLowerCase().includes('pendiente') ? '#faad14' : '#1890ff'};">${report.estado}</span>
        </div>
        
        <div class="modal-detail-item" style="border-top: 1px solid var(--mi-border); padding-top: 0.8rem;">
            <span class="modal-detail-label">Comentario:</span>
            <span class="modal-detail-value" style="background:#f9f9f9; padding:0.8rem; border-radius:6px; font-style:italic; border-left:3px solid var(--mi-orange);">${report.descripcion || 'Sin comentarios registrados.'}</span>
        </div>
        
        <div style="border-top: 1px solid var(--mi-border); padding-top: 0.8rem;">
            ${photosHtml}
        </div>
        
        <div style="border-top: 1px solid var(--mi-border); padding-top: 1rem; margin-top: 1rem; display: flex; justify-content: flex-end;">
            <button class="btn-primary" style="background:#4a90e2; width:auto; padding:8px 16px; border-radius:6px; color:white; border:none; font-size:12px; font-weight:600; cursor:pointer;" onclick="window.downloadReportPDF('${report.id}')">
                <i class="fas fa-file-pdf"></i> Descargar PDF
            </button>
        </div>
        
        ${adminActionsHtml}
    `;
    
    modal.style.display = 'flex';
    modal.classList.remove('hidden');
};

window.closeReportModal = function() {
    const modal = document.getElementById('report-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.add('hidden');
    }
    
    if (APP_CONFIG.returnToHistorial) {
        APP_CONFIG.returnToHistorial = false;
        const hModal = document.getElementById('historial-modal');
        if (hModal) {
            hModal.style.display = 'flex';
            hModal.classList.remove('hidden');
        }
    }
};

window.downloadReportPDF = function(reportId) {
    const element = document.getElementById('report-modal').querySelector('.modal-content');
    if (!element) return;
    
    // Ocultar botones e iconos interactivos para que no salgan en el PDF
    const closeBtn = element.querySelector('.close-modal');
    const dragHandle = element.querySelector('.bottom-sheet-drag-handle');
    const actionBtns = element.querySelectorAll('button');
    
    if (closeBtn) closeBtn.style.display = 'none';
    if (dragHandle) dragHandle.style.display = 'none';
    actionBtns.forEach(btn => btn.style.display = 'none');
    
    // Opciones de html2pdf
    const opt = {
      margin:       15,
      filename:     'Reporte_' + (reportId || 'Incidencia') + '.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        // Restaurar UI original
        if (closeBtn) closeBtn.style.display = '';
        if (dragHandle) dragHandle.style.display = '';
        actionBtns.forEach(btn => btn.style.display = '');
    }).catch(err => {
        console.error('Error generando PDF:', err);
        if (closeBtn) closeBtn.style.display = '';
        if (dragHandle) dragHandle.style.display = '';
        actionBtns.forEach(btn => btn.style.display = '');
        alert('Hubo un error al generar el PDF.');
    });
};

window.downloadBulkExcel = async function() {
    const userRole = String(APP_CONFIG.currentUser?.rol || '').trim().toUpperCase();
    const isAdmin = userRole === 'ADMIN' || userRole === 'ADMINISTRADOR';
    if (!isAdmin) {
        alert("No tienes permisos para exportar reportes a Excel.");
        return;
    }

    const list = APP_CONFIG.lastFilteredHistorialItems || APP_CONFIG.currentHistorialItems || [];
    if (list.length === 0) {
        alert("No hay reportes para exportar.");
        return;
    }
    
    // Validar que la librería se ha cargado
    if (typeof ExcelJS === 'undefined') {
        alert("La librería de Excel aún se está cargando. Por favor, inténtalo de nuevo en unos segundos.");
        return;
    }
    
    let maxPhotos = 0;
    list.forEach(r => {
        const rawFotos = r.fotos || r.photos || '';
        const urls = rawFotos ? rawFotos.split(/[\n,]+/).map(u => u.trim()).filter(Boolean) : [];
        if (urls.length > maxPhotos) maxPhotos = urls.length;
    });
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reportes');
    
    const columns = [
        { header: 'ID Reporte', key: 'id', width: 15 },
        { header: 'Fecha', key: 'fecha', width: 20 },
        { header: 'Usuario', key: 'usuario', width: 25 },
        { header: 'Cuenta', key: 'cuenta', width: 20 },
        { header: 'Tienda', key: 'tienda', width: 25 },
        { header: 'Categoría', key: 'categoria', width: 15 },
        { header: 'Tipo / Tipología / Modelo', key: 'tipo', width: 25 },
        { header: 'Código Dispositivo', key: 'codigo', width: 20 },
        { header: 'Motivo', key: 'motivo', width: 25 },
        { header: 'Descripción', key: 'descripcion', width: 50 },
        { header: 'Estado', key: 'estado', width: 15 },
        { header: 'Tiempo (días)', key: 'tiempo', width: 15 }
    ];
    
    for (let i = 1; i <= maxPhotos; i++) {
        columns.push({ header: `Foto ${i}`, key: `foto${i}`, width: 15 });
    }
    
    worksheet.columns = columns;
    
    // Style headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3F3F3' }
    };
    
    list.forEach(r => {
        const est = String(r.estado || '').trim().toLowerCase();
        let displayTiempo = '';
        let rawTiempo = r.tiempo;
        if (rawTiempo !== undefined && rawTiempo !== null && rawTiempo !== '') {
            displayTiempo = String(rawTiempo).trim();
        }
        const isResolvedTiempo = est === 'solucionado' || est.includes('cerrad') || est.includes('realizad');
        
        if (displayTiempo !== '') {
            if (displayTiempo === '0' && !isResolvedTiempo) {
                displayTiempo = ''; 
            } else {
                if (!isNaN(displayTiempo)) {
                    if (parseInt(displayTiempo) < 0) {
                        displayTiempo = '0 días';
                    } else {
                        displayTiempo += ' días';
                    }
                }
            }
        }
        
        if (displayTiempo === '') {
            const fechaStr = String(r.fecha || '');
            const reportDate = new Date(fechaStr.replace(/-/g, '/')); 
            if (!isNaN(reportDate.getTime())) {
                const diffTime = Math.abs(new Date().getTime() - reportDate.getTime());
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                
                if (isResolvedTiempo) {
                    if (r.fechaCierre) {
                        const closeDate = new Date(String(r.fechaCierre).replace(/-/g, '/'));
                        if (!isNaN(closeDate.getTime())) {
                            const diffT = Math.abs(closeDate.getTime() - reportDate.getTime());
                            displayTiempo = `${Math.floor(diffT / (1000 * 60 * 60 * 24))} días`;
                        } else {
                            displayTiempo = '0 días';
                        }
                    } else {
                        displayTiempo = '0 días'; 
                    }
                } else {
                    displayTiempo = `${diffDays} días`; 
                }
            } else {
                displayTiempo = '0 días';
            }
        }

        const rowData = {
            id: r.id || r.ref,
            fecha: r.fecha,
            usuario: r.usuario,
            cuenta: r.cuenta,
            tienda: r.tienda,
            categoria: r.categoria,
            tipo: r.tipo || r.tipologia || r.modelo,
            codigo: r.codigoDispositivo || r.codigo || r.codigo_dispositivo || '',
            motivo: r.motivo,
            descripcion: r.descripcion,
            estado: r.estado,
            tiempo: displayTiempo
        };
        
        const row = worksheet.addRow(rowData);
        
        const stateCell = row.getCell('estado');
        stateCell.font = { bold: true };
        if (est.includes('abiert')) {
            stateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEAEA' } };
            stateCell.font = { color: { argb: 'FFD93025' }, bold: true };
        } else if (est.includes('pendiente')) {
            stateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF4E5' } };
            stateCell.font = { color: { argb: 'FFE37400' }, bold: true };
        } else if (est.includes('solucionado')) {
            stateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } };
            stateCell.font = { color: { argb: 'FF1A73E8' }, bold: true };
        } else if (est.includes('cerrad')) {
            stateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F4EA' } };
            stateCell.font = { color: { argb: 'FF1E8E3E' }, bold: true };
        }
        
        const rawFotos = r.fotos || r.photos || '';
        const urls = rawFotos ? rawFotos.split(/[\n,]+/).map(u => u.trim()).filter(Boolean) : [];
        
        urls.forEach((url, i) => {
            const cell = row.getCell(`foto${i + 1}`);
            cell.value = {
                text: 'Ver Foto ' + (i + 1),
                hyperlink: url,
                tooltip: 'Abrir foto en Drive'
            };
            cell.font = { color: { argb: 'FF1A73E8' }, underline: true };
        });
        
        row.alignment = { vertical: 'middle', wrapText: true };
    });
    
    try {
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Reportes_Filtrados_' + new Date().toISOString().slice(0,10) + '.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error('Error generando Excel:', err);
        alert('Hubo un error al generar el archivo Excel.');
    }
};

window.deleteDashboardReport = async function(id) {
    if (!id) return;
    try {
        const res = await callApi({
            action: 'deleteReport',
            id: id
        });
        
        if (res && res.success) {
            // 1. UI Optimista: Quitar el reporte de la caché local inmediatamente
            if (Array.isArray(APP_CONFIG.dashboardReports)) {
                APP_CONFIG.dashboardReports = APP_CONFIG.dashboardReports.filter(item => String(item.id) !== String(id));
            }
            
            // 2. Forzar el re-renderizado de la tabla y stats al instante con la caché limpia
            if (typeof renderDashboardFromData === 'function') {
                renderDashboardFromData(APP_CONFIG.dashboardReports);
            }
            
            // Mostrar el toast premium de éxito
            alert('Reporte eliminado correctamente.');
            
            // 3. Re-sincronizar silenciosamente en segundo plano con el servidor por consistencia
            if (typeof loadDashboard === 'function') {
                loadDashboard(); 
            }
        } else {
            alert('Error al eliminar: ' + (res.message || res.error || 'Desconocido'));
        }
    } catch (err) {
        console.error(err);
        alert('Error de conexión al intentar eliminar el reporte.');
    }
};

window.changeIncidentStatus = async function(id, newStatus) {
    const btn = document.activeElement;
    let originalText = '';
    if (btn) {
        originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
    }
    
    try {
        const res = await callApi({
            action: 'resolveIncident',
            id: id,
            estado: newStatus
        });
        
        if (res && res.success) {
            alert(`El estado de la incidencia ha sido cambiado con éxito a: ${newStatus}`);
            window.closeReportModal();
            await loadDashboard();
        } else {
            alert('Error al actualizar el estado: ' + (res.error || res.message || 'Error desconocido'));
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        }
    } catch (err) {
        console.error(err);
        alert('Error al comunicarse con el servidor.');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
};

window.selectedReportForQuickBox = null;
window.uploadedResolutionPhotos = [];

window.showQuickBox = function(report) {
    window.selectedReportForQuickBox = report;
    window.uploadedResolutionPhotos = []; // Reset
    
    const box = document.getElementById('quick-detail-box');
    const badge = document.getElementById('quick-detail-status-badge');
    const tienda = document.getElementById('quick-detail-tienda');
    const tipo = document.getElementById('quick-detail-tipo');
    const resolveBtn = document.getElementById('quick-detail-resolve-btn');
    const editBtn = document.getElementById('quick-detail-edit-btn');
    const resArea = document.getElementById('quick-detail-resolution-area');
    const submitBtn = document.getElementById('submit-resolution-btn');
    const previewContainer = document.getElementById('resolve-photo-preview-container');
    const fileInput = document.getElementById('resolve-photo-input');
    
    if (!box) return;
    
    tienda.textContent = report.tienda || '-';
    tipo.textContent = report.tipo || '-';
    
    const est = String(report.estado || '').trim().toUpperCase();
    badge.textContent = est;
    
    if (est === 'ABIERTA') {
        badge.style.background = '#e74c3c';
        badge.style.color = 'white';
    } else if (est === 'PENDIENTE') {
        badge.style.background = '#faad14';
        badge.style.color = 'white';
    } else if (est === 'CERRADA') {
        badge.style.background = '#2ecc71';
        badge.style.color = 'white';
    } else if (est === 'SOLUCIONADO') {
        badge.style.background = '#1890ff';
        badge.style.color = 'white';
    } else {
        badge.style.background = '#95a5a6';
        badge.style.color = 'white';
    }
    
    if (est === 'PENDIENTE' || est === 'ABIERTA') {
        resolveBtn.style.display = 'flex';
        resArea.style.display = 'block'; // Auto-desplegar por defecto para ahorrar un clic al usuario
    } else {
        resolveBtn.style.display = 'none';
        resArea.style.display = 'none';
    }

    if (editBtn) {
        editBtn.style.display = (est === 'ABIERTA' || est === 'PENDIENTE') ? 'flex' : 'none';
    }
    
    submitBtn.disabled = true;
    if (fileInput) fileInput.value = '';
    if (previewContainer) previewContainer.innerHTML = '';
    
    box.style.display = 'flex';
    box.classList.remove('hidden');
};

window.toggleResolutionArea = function() {
    const resArea = document.getElementById('quick-detail-resolution-area');
    if (resArea) {
        resArea.style.display = resArea.style.display === 'none' ? 'block' : 'none';
    }
};

window.openDetailsModalFromQuickBox = function() {
    if (window.selectedReportForQuickBox) {
        showReportDetails(window.selectedReportForQuickBox);
    }
};

window.editReportFromQuickBox = function() {
    if (window.selectedReportForQuickBox) {
        const box = document.getElementById('quick-detail-box');
        if (box) {
            box.style.display = 'none';
            box.classList.add('hidden');
        }
        window.jumpToCreateReportForStore(window.selectedReportForQuickBox);
    }
};

window.jumpToCreateReportForStore = function(customReport = null) {
    if (customReport) {
        window.selectedReportForQuickBox = customReport;
    }
    const r = window.selectedReportForQuickBox;
    if (!r || !r.cuenta || !r.tienda) {
        alert('No se puede saltar: faltan datos de cuenta o tienda en este registro.');
        return;
    }
    
    // 1. Navegar a la vista de Nuevo Reporte
    showView('reportes');
    
    // 2. Inyectar Cuenta y Centro instantáneamente en el formulario
    const accSel = document.getElementById('incident-cuenta');
    const storeSel = document.getElementById('incident-centro');
    
    if (accSel && storeSel) {
        // Limpieza preventiva para no pisar datos antiguos
        if (typeof resetProcedure === 'function') {
            resetProcedure(false);
        }
        
        // NUEVO: Activar MODO EDICIÓN y ESCUDO DE PRECARGA ANTIBORRADO (Establecido estrictamente TRAS el reset!)
        window.editingIncidentId = r.id || '';
        window.isAutoloadingReport = true; // Bloquea reseteos del array durante clics automáticos
        const banner = document.getElementById('editing-mode-banner');
        if (banner) {
            banner.style.display = 'flex';
            banner.classList.remove('hidden');
        }
        
        // Cargar cuenta
        accSel.value = r.cuenta;
        
        // Disparar filtro de centros síncrono
        if (typeof filterStoresByAccount === 'function') {
            filterStoresByAccount('incident', r.cuenta);
        }
        
        // Seleccionar la tienda exacta cargada en el combo
        storeSel.value = r.tienda;
        
        // Iniciar el procedimiento visual automáticamente
        if (typeof startIncidentProcedure === 'function') {
            startIncidentProcedure(r.tienda);
        }
        
        // NUEVO: INTELIGENCIA DE PRECARGA AUTOMÁTICA DE TODO EL FORMULARIO (AHORA CON FLUJO ASYNC LINEAL PERFECTO)
        (async () => {
            const sleep = ms => new Promise(r => setTimeout(r, ms));
            
            const catStr = String(r.categoria || '').toLowerCase();
            const isFurniture = catStr.includes('mobiliario');
            const isDevice = catStr.includes('dispositivo');
            const isLona = catStr.includes('lona');
            const isScreen = catStr.includes('pantalla');

            // A. Auto-seleccionar Categoría Principal (simulando click)
            let mainBtn = null;
            if (isFurniture) {
                mainBtn = document.querySelector('#category-selection button.furniture');
            } else if (isDevice) {
                mainBtn = document.querySelector('#category-selection button.device');
            } else if (isLona) {
                mainBtn = document.querySelector('#category-selection button.lona');
            } else if (isScreen) {
                mainBtn = document.querySelector('#category-selection button.screen');
            }
            
            if (mainBtn) {
                mainBtn.click();
            }
            
            // Esperar a que la interfaz despliegue las subcategorías correspondientes
            await sleep(350);

            let procId = 'device-procedure';
            if (isFurniture) procId = 'furniture-procedure';
            if (isLona) procId = 'lona-procedure';
            if (isScreen) procId = 'screen-procedure';
            
            const container = document.getElementById(procId);
            if (!container) {
                window.isAutoloadingReport = false; // Liberar bloqueo si algo falla catastróficamente
                return;
            }

            // PASO B: EJECUTAR LA RAMIFICACIÓN DE CLICS DE FORMA SECUENCIAL
            if (isFurniture) {
                // RAMA MOBILIARIO: L2(Subcategoria) -> L3(Motivo)
                if (r.subcategoria) {
                    const subBtns = Array.from(container.querySelectorAll('.level-box[data-level="2"] button.bubble-btn'));
                    const targetSub = subBtns.find(b => b.textContent.trim().toUpperCase() === String(r.subcategoria).trim().toUpperCase());
                    if (targetSub) targetSub.click();
                }
                
                // Espera secuencial garantizada
                await sleep(350);
                
                if (r.motivo) {
                    const motBtns = Array.from(container.querySelectorAll('.level-box[data-level="3"] button.bubble-btn'));
                    const targetMot = motBtns.find(b => b.textContent.trim().toUpperCase() === String(r.motivo).trim().toUpperCase());
                    if (targetMot) targetMot.click();
                }

            } else if (isLona) {
                // RAMA LONA: L2(Tipología) -> L3(Motivo)
                const lonaTip = r.tipologia || r.subcategoria || '';
                if (lonaTip) {
                    const tipBtns = Array.from(container.querySelectorAll('.level-box[data-level="2"] button.bubble-btn'));
                    const targetTip = tipBtns.find(b => b.textContent.trim().toUpperCase() === String(lonaTip).trim().toUpperCase());
                    if (targetTip) targetTip.click();
                }
                
                await sleep(350);
                
                if (r.motivo) {
                    const motBtns = Array.from(container.querySelectorAll('.level-box[data-level="3"] button.bubble-btn'));
                    const targetMot = motBtns.find(b => b.textContent.trim().toUpperCase() === String(r.motivo).trim().toUpperCase());
                    if (targetMot) targetMot.click();
                }
                
            } else if (isScreen) {
                // RAMA PANTALLA: Pantalla no tiene subcategorías en el frontend, pasa directo al paso C.
                
            } else if (isDevice) {
                // RAMA DISPOSITIVO: L2(Tipología) -> L3(Subcategoría) -> L4(Motivo)
                const tipologyVal = r.tipologia || '';
                if (tipologyVal) {
                    const tipBtns = Array.from(container.querySelectorAll('.level-box[data-level="2"] button.bubble-btn'));
                    const targetTip = tipBtns.find(b => b.textContent.trim().toUpperCase() === String(tipologyVal).trim().toUpperCase());
                    if (targetTip) targetTip.click();
                }

                // Espera a que se regeneren las subcategorías del Nivel 3 según Tipología
                await sleep(400);

                if (r.subcategoria) {
                    const subBtns = Array.from(container.querySelectorAll('.level-box[data-level="3"] button.bubble-btn'));
                    const targetSub = subBtns.find(b => b.textContent.trim().toUpperCase() === String(r.subcategoria).trim().toUpperCase());
                    if (targetSub) targetSub.click();
                }

                // Espera a que aparezca la caja del Nivel 4 de Motivos
                await sleep(400);

                if (r.motivo) {
                    const motBtns = Array.from(container.querySelectorAll('.level-box[data-level="4"] button.bubble-btn'));
                    const targetMot = motBtns.find(b => b.textContent.trim().toUpperCase() === String(r.motivo).trim().toUpperCase());
                    if (targetMot) targetMot.click();
                }
            }
            
            // Esperar a que finalice la renderización del DOM final
            await sleep(350);

            // C. Rellenar Bloque Final (Comentarios y Dónde Enviar)
            let finalLvlId = 'final-level-device';
            if (isFurniture) finalLvlId = 'final-level-furniture';
            if (isLona) finalLvlId = 'final-level-lona';
            if (isScreen) finalLvlId = 'final-level-screen';
            
            const finalLvl = document.getElementById(finalLvlId);
            if (finalLvl) {
                const descInp = finalLvl.querySelector('.rep-desc');
                if (descInp) descInp.value = r.descripcion || '';
                
                const envSel = finalLvl.querySelector('.rep-enviar');
                if (envSel && r.enviar) envSel.value = r.enviar;
                
                // Hacer scroll al final para revisión
                finalLvl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
            // D. SI ES DISPOSITIVO: Cargar array completo de modelos para visualización (CON ULTRA-DEFENSA)
            if (isDevice) {
                // Fallback 1: Intentar rehidratar desde el listado global en memoria para máxima seguridad
                let sourceReport = r;
                if (r.id && APP_CONFIG.dashboardReports) {
                    const found = APP_CONFIG.dashboardReports.find(x => x.id === r.id);
                    if (found) sourceReport = found;
                }

                let finalDevs = sourceReport.dispositivos;

                // Fallback 2: Si viene serializado como texto por algún motivo extraño
                if (typeof finalDevs === 'string') {
                    try { finalDevs = JSON.parse(finalDevs); } catch(e) { finalDevs = null; }
                }

                // Fallback 3: Si no hay array pero hay datos planos en el reporte (compatibilidad absoluta heredada)
                if (!finalDevs || !Array.isArray(finalDevs)) {
                    if (sourceReport.modelo || sourceReport.tipologia || sourceReport.tipo) {
                        // Intentar adivinar el modelo desde el texto si es un registro heredado
                        const guessedModel = sourceReport.modelo || (String(sourceReport.tipo).split('>')[1] || '').trim() || 'Dispositivo Genérico';
                        finalDevs = [{
                            modelo: guessedModel,
                            cantidad: parseInt(sourceReport.cantidad) || 1,
                            codigoDispositivo: sourceReport.codigoDispositivo || 'N/A',
                            tipoReporte: sourceReport.tipologia || sourceReport.subcategoria || ''
                        }];
                    }
                }

                if (finalDevs && Array.isArray(finalDevs) && finalDevs.length > 0) {
                    APP_CONFIG.currentSelectedDevices = JSON.parse(JSON.stringify(finalDevs));
                    if (typeof renderSelectedDevices === 'function') {
                        renderSelectedDevices();
                        
                        // REFUERZO FINAL: Doble renderizado tras micro-sleep para garantizar visibilidad
                        await sleep(250);
                        renderSelectedDevices();
                    }
                } else {
                    console.error("CRITICAL PRECARGA: No se encontraron dispositivos estructurados para el reporte id=" + (r.id || 'N/A'), sourceReport);
                }
            } else if (isLona) {
                let sourceReport = r;
                if (r.id && APP_CONFIG.dashboardReports) {
                    const found = APP_CONFIG.dashboardReports.find(x => x.id === r.id);
                    if (found) sourceReport = found;
                }
                let finalLonas = sourceReport.dispositivos;
                if (typeof finalLonas === 'string') {
                    try { finalLonas = JSON.parse(finalLonas); } catch(e) { finalLonas = null; }
                }
                if (!finalLonas || !Array.isArray(finalLonas)) {
                    if (sourceReport.modelo) {
                        finalLonas = [{
                            modelo: sourceReport.modelo,
                            cantidad: parseInt(sourceReport.cantidad) || 1,
                            codigoDispositivo: sourceReport.codigoDispositivo || ''
                        }];
                    }
                }
                if (finalLonas && Array.isArray(finalLonas) && finalLonas.length > 0) {
                    APP_CONFIG.currentSelectedLonas = JSON.parse(JSON.stringify(finalLonas));
                    if (typeof renderSelectedLonas === 'function') {
                        renderSelectedLonas();
                        await sleep(250);
                        renderSelectedLonas();
                    }
                }
            }

            // E. PRECARGA DE FOTOS EXISTENTES: Para que el usuario pueda verlas, borrarlas o añadir nuevas
            if (r.fotos) {
                // Limpiar estado previo de fotos de incidentes
                APP_CONFIG.incidentUploadedPhotos = [];
                
                // Parsear enlaces (separados por saltos de línea o comas)
                const urls = String(r.fotos).split(/[\n,]+/).map(u => u.trim()).filter(u => u && u.startsWith('http'));
                
                if (urls.length > 0) {
                    APP_CONFIG.incidentUploadedPhotos = [...urls];
                    const thumbContainer = document.getElementById(`incident-thumbnails-${isFurniture ? 'furniture' : 'device'}`);
                    
                    if (thumbContainer) {
                        thumbContainer.innerHTML = ''; // Limpiar previos visualmente
                        
                        urls.forEach(picUrl => {
                            // Crear el wrapper visual imitando la carga normal de la APP
                            const wrap = document.createElement('div');
                            wrap.className = 'local-thumb-wrapper uploaded';
                            wrap.style.cssText = 'position: relative; width: 80px; height: 80px; border-radius: 8px; overflow: hidden; border: 2px solid #2ecc71; background: #333; display: flex; align-items: center; justify-content: center;';
                            wrap.dataset.url = picUrl;

                            // Convertir link de drive a vista previa real para el IMG
                            const previewUrl = window.getGoogleDriveThumbnail(picUrl);

                            wrap.innerHTML = `
                                <img src="${previewUrl}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null;this.src='https://via.placeholder.com/80x80?text=FOTO';">
                                <div style="position: absolute; top: 2px; right: 2px; background: rgba(46, 204, 113, 0.9); color: #fff; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px;">
                                    <i class="fa fa-check"></i>
                                </div>
                                <button type="button" class="delete-thumb-btn" style="position: absolute; bottom: 0; left: 0; width: 100%; background: rgba(231, 76, 60, 0.85); color: #fff; border: none; font-size: 10px; padding: 2px 0; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
                                    <i class="fa fa-trash"></i> Borrar
                                </button>
                            `;

                            // Configurar el botón de borrado nativo
                            wrap.querySelector('.delete-thumb-btn').onclick = () => {
                                APP_CONFIG.incidentUploadedPhotos = APP_CONFIG.incidentUploadedPhotos.filter(u => u !== picUrl);
                                wrap.remove();
                            };
                            
                            thumbContainer.appendChild(wrap);
                        });
                    }
                }
            }
            
            // ELEGANCIA PURA Y SEGURIDAD ABSOLUTA: Retirar escudo de precarga solo al FINAL de todo el hilo secuencial
            window.isAutoloadingReport = false;

        })();

    }
};

window.cancelEditMode = function() {
    window.editingIncidentId = null;
    const banner = document.getElementById('editing-mode-banner');
    if (banner) {
        banner.style.display = 'none';
        banner.classList.add('hidden');
    }
    // Limpiar el formulario también por coherencia
    if (typeof resetProcedure === 'function') {
        resetProcedure(false); 
    }
};

window.handleResolutionPhotoUpload = async function(event) {
    const input = event.target;
    const files = Array.from(input.files || []);
    if (files.length === 0) return;
    
    const previewContainer = document.getElementById('resolve-photo-preview-container');
    const submitBtn = document.getElementById('submit-resolution-btn');
    
    submitBtn.disabled = true;
    if (previewContainer) {
        previewContainer.innerHTML = `
            <div style="color:var(--mi-orange); font-weight:600; display:flex; align-items:center; gap:8px; margin-bottom:10px; font-size:12px; width:100%;">
                <i class="fa fa-spinner fa-spin" style="font-size:1.1rem;"></i> Subiendo ${files.length} foto(s) a Drive... Espera, por favor.
            </div>
        `;
    }
    
    let successCount = 0;
    let failCount = 0;

    // Iteramos sobre todos los archivos seleccionados por el usuario
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
            const isImg = file.type && file.type.startsWith('image/');
            const base64 = await window.getCompressedBase64(file);
            const mimeType = isImg ? 'image/jpeg' : file.type;
            const extension = isImg ? 'jpg' : (file.name.split('.').pop() || 'bin');
            const formattedDate = new Date().toISOString().slice(0, 10);
            const userRaw = (APP_CONFIG.currentUser?.email || APP_CONFIG.currentUser?.usuario) || 'Usuario';
            const userClean = String(userRaw).split('@')[0].trim().toUpperCase().replace(/[^A-Z0-9]/g, '_');
            const tiendaSanitized = String(window.selectedReportForQuickBox?.tienda || 'Tienda').trim().toUpperCase().replace(/[^A-Z0-9]/g, '_');
            
            // Sufijo de conteo si hay varias fotos para mantener el orden lógico y evitar sobreescrituras fortuitas
            const uniqueSuffix = files.length > 1 ? `_${i + 1}` : '';
            const customFileName = `${userClean}_${tiendaSanitized}_${formattedDate}_SOLUCIONADO${uniqueSuffix}.${extension}`;

            const res = await callApi({
                action: 'uploadFile',
                base64: base64,
                mimeType: mimeType,
                fileName: customFileName
            });

            if (res && res.success && res.url) {
                window.uploadedResolutionPhotos.push(res.url);
                successCount++;
            } else {
                failCount++;
            }
        } catch (err) {
            console.error("Fallo de subida en iteración:", err);
            failCount++;
        }
    }

    // Renderizamos el feedback definitivo para el usuario
    if (previewContainer) {
        previewContainer.innerHTML = '';
        
        if (successCount > 0) {
            const successBox = document.createElement('div');
            successBox.style.cssText = "background:#e6f7ff; border:1px solid #91d5ff; padding:8px 12px; border-radius:8px; color:#1890ff; font-size:12px; font-weight:600; margin-bottom:8px; display:flex; align-items:center; gap:8px; width:100%;";
            successBox.innerHTML = `<i class="fa fa-check-circle" style="color:#52c41a; font-size:1.2rem;"></i> ¡${successCount} foto(s) subida(s) con éxito!`;
            previewContainer.appendChild(successBox);
        }
        
        if (failCount > 0) {
            const errorBox = document.createElement('div');
            errorBox.style.cssText = "background:#fff2f0; border:1px solid #ffccc7; padding:8px 12px; border-radius:8px; color:#ff4d4f; font-size:12px; font-weight:600; margin-bottom:8px; display:flex; align-items:center; gap:8px; width:100%;";
            errorBox.innerHTML = `<i class="fa fa-exclamation-circle" style="font-size:1.2rem;"></i> ${failCount} foto(s) no se pudieron cargar.`;
            previewContainer.appendChild(errorBox);
        }
    }

    // Habilitamos el botón final si tenemos al menos una foto válida cargada
    if (window.uploadedResolutionPhotos.length > 0) {
        submitBtn.disabled = false;
    } else {
        submitBtn.disabled = true;
    }
};

window.submitResolution = async function() {
    if (!window.selectedReportForQuickBox || window.uploadedResolutionPhotos.length === 0) {
        alert("Por favor, sube una foto de la solución obligatoria.");
        return;
    }
    
    const submitBtn = document.getElementById('submit-resolution-btn');
    const originalText = submitBtn.textContent;
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Actualizando estado...';
    
    try {
        const res = await callApi({
            action: 'resolveIncident',
            id: window.selectedReportForQuickBox.id,
            photos: window.uploadedResolutionPhotos
        });
        
        if (res && res.success) {
            alert('¡Incidencia resuelta con éxito! Pasada a color azul (Solucionado).');
            
            // Ocultar modal de resolución flotante
            const box = document.getElementById('quick-detail-box');
            if (box) {
                box.style.display = 'none';
                box.classList.add('hidden');
            }
            
            // Ocultar también el modal del historial subyacente si estaba abierto
            const histModal = document.getElementById('historial-modal');
            if (histModal) {
                histModal.style.display = 'none';
                histModal.classList.add('hidden');
            }
            
            // Recargar dashboard para actualizar métricas y tabla
            await loadDashboard();
        } else {
            alert('Error al resolver la incidencia: ' + (res.error || 'Error desconocido'));
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    } catch (err) {
        console.error(err);
        alert('Error al enviar la resolución.');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
};

window.filterDashboardTable = function() {
    const selCuenta = document.getElementById('dash-filter-cuenta')?.value || 'all';
    const selTienda = document.getElementById('dash-filter-tienda')?.value.trim().toLowerCase() || '';
    const selTipo = document.getElementById('dash-filter-tipo')?.value || 'all';
    const selEstado = document.getElementById('dash-filter-estado')?.value || 'all';
    const selUsuario = document.getElementById('dash-filter-usuario')?.value || 'all';
    
    let reports = APP_CONFIG.dashboardReports || [];
    
    const userRole = String(APP_CONFIG.currentUser?.rol || '').trim().toUpperCase();
    const isAdmin = userRole === 'ADMIN' || userRole === 'ADMINISTRADOR';
    
    const filtered = reports.filter(r => {
        const matchCuenta = selCuenta === 'all' || String(r.cuenta || '').trim() === selCuenta;
        const matchTienda = selTienda === '' || String(r.tienda || '').trim().toLowerCase().includes(selTienda);
        
        let matchTipo = true;
        if (selTipo !== 'all') {
            const rCat = String(r.categoria || '').trim().toLowerCase();
            let rTipoFinal = rCat;
            if (String(r.tipo || '').trim().toLowerCase().includes('lanzamiento')) rTipoFinal = 'lanzamiento';
            if (rCat.includes('pantalla')) rTipoFinal = 'pantalla';
            matchTipo = rTipoFinal === selTipo;
        }
        
        let matchUsuario = true;
        if (isAdmin && selUsuario !== 'all') {
            matchUsuario = String(r.usuario || '').trim() === selUsuario;
        }
        
        let matchEstado = true;
        if (selEstado !== 'all') {
            const rowEst = String(r.estado || '').trim().toLowerCase();
            matchEstado = rowEst.includes(selEstado);
        }
        
        return matchCuenta && matchTienda && matchTipo && matchUsuario && matchEstado;
    });
    
    function getSortValue(r) {
        const est = String(r.estado).trim().toLowerCase();
        const isResolvedTiempo = est === 'solucionado' || est === 'cerrada' || est === 'cerrado' || est === 'realizado' || est === 'realizada';
        let rawTiempo = r.tiempo;
        let displayTiempo = (rawTiempo !== undefined && rawTiempo !== null && rawTiempo !== '') ? String(rawTiempo).trim() : '';
        if (displayTiempo !== '') {
            if (!(displayTiempo === '0' && !isResolvedTiempo)) {
                return !isNaN(displayTiempo) ? Math.max(0, parseInt(displayTiempo)) : 0;
            }
        }
        const fechaStr = String(r.fecha || '');
        const reportDate = new Date(fechaStr.replace(/-/g, '/')); 
        if (!isNaN(reportDate.getTime())) {
            if (isResolvedTiempo) {
                if (r.fechaCierre) {
                    const closeDate = new Date(String(r.fechaCierre).replace(/-/g, '/'));
                    if (!isNaN(closeDate.getTime())) {
                        const diffTime = Math.abs(closeDate.getTime() - reportDate.getTime());
                        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
                    }
                }
                return 0;
            }
            const diffTime = Math.abs(Date.now() - reportDate.getTime());
            return Math.floor(diffTime / (1000 * 60 * 60 * 24));
        }
        return 0;
    }

    if (window.dashboardTimeSortOrder) {
        filtered.sort((a, b) => {
            const valA = getSortValue(a);
            const valB = getSortValue(b);
            return window.dashboardTimeSortOrder === 'desc' ? valB - valA : valA - valB;
        });
    }
    
    renderDashboardTable(filtered);
};

window.dashboardTimeSortOrder = 'desc';

window.sortDashboardByTime = function() {
    window.dashboardTimeSortOrder = window.dashboardTimeSortOrder === 'desc' ? 'asc' : 'desc';
    const icon = document.getElementById('sort-tiempo-icon');
    if (icon) {
        icon.className = window.dashboardTimeSortOrder === 'desc' ? 'fas fa-sort-numeric-down-alt' : 'fas fa-sort-numeric-up';
    }
    window.filterDashboardTable();
};

window.renderHistorialRows = function(items, isLanzamientos) {
    const modal = document.getElementById('historial-modal');
    const tbody = document.getElementById('historial-modal-tbody');
    if (!tbody) return;
    
    // Toggle header visibility based on isLanzamientos and role
    const isAdmin = String(APP_CONFIG.currentUser?.rol || '').trim().toUpperCase() === 'ADMIN' || 
                    String(APP_CONFIG.currentUser?.rol || '').trim().toUpperCase() === 'ADMINISTRADOR';
                    
    const hideUsuario = !isAdmin;
    const hideAcciones = isLanzamientos;

    const thUsuario = document.getElementById('historial-th-usuario');
    const thAcciones = document.getElementById('historial-th-acciones');
    if (thUsuario) thUsuario.style.display = hideUsuario ? 'none' : '';
    if (thAcciones) thAcciones.style.display = hideAcciones ? 'none' : '';
    
    tbody.innerHTML = '';
    
    if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${hideUsuario ? (hideAcciones ? '4' : '5') : (hideAcciones ? '5' : '6')}" style="text-align:center; padding: 20px;">No hay registros para este estado o búsqueda.</td></tr>`;
        return;
    }

    items.forEach(r => {
        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid var(--mi-border)';
        
        let statusClass = 'color:#95a5a6;font-weight:600';
        const rawEst = String(r.estado || '').trim().toLowerCase();
        
        if (rawEst === 'abierta' || rawEst === 'incidente') {
            statusClass = 'color:#e74c3c;font-weight:600';
        } else if (rawEst === 'realizado' || rawEst === 'cerrada' || rawEst === 'cerrado') {
            statusClass = 'color:#2ecc71;font-weight:600';
        } else if (rawEst === 'pendiente') {
            statusClass = 'color:#faad14;font-weight:600';
        } else if (rawEst === 'solucionado') {
            statusClass = 'color:#1890ff;font-weight:600';
        }
        const refVal = isLanzamientos ? 'Lanzamiento' : (r.fecha || '-');
        const tiendaVal = isLanzamientos ? (r.nombre || r.tienda) : (r.tienda || '-');
        const usuarioVal = r.usuario || '-';
        const cuentaVal = r.cuenta || '-';
        let estadoLabel = isLanzamientos && rawEst === 'pendiente' ? 'Pendiente' : (r.estado || 'Pendiente');
        
        const isAdmin = String(APP_CONFIG.currentUser?.rol || '').trim().toUpperCase() === 'ADMIN' || 
                        String(APP_CONFIG.currentUser?.rol || '').trim().toUpperCase() === 'ADMINISTRADOR';
                        
        const hideUsuario = !isAdmin;
        const hideAcciones = isLanzamientos;
        
        if (isLanzamientos && rawEst === 'pendiente') {
            estadoLabel = `<span style="color:#faad14; font-weight:600;"><i class="fas fa-clock"></i> Pendiente</span>`;
            statusClass = ''; 
        } else if (isLanzamientos && (rawEst === 'realizado' || rawEst === 'realizada')) {
            estadoLabel = `<span style="color:#2ecc71; font-weight:600;"><i class="fas fa-check-circle"></i> Realizada</span>`;
            statusClass = '';
        }
        
        row.innerHTML = `
            <td style="padding: 12px;">${refVal}</td>
            <td style="padding: 12px; display: ${hideUsuario ? 'none' : ''};">${usuarioVal}</td>
            <td style="padding: 12px;">${cuentaVal}</td>
            <td style="padding: 12px;">${tiendaVal}</td>
            <td style="padding: 12px; ${statusClass}">${estadoLabel}</td>
            <td style="padding: 12px; text-align:center; display: ${hideAcciones ? 'none' : 'flex'}; gap:5px; justify-content:center; align-items:center;"></td>
        `;
        
        const actionTd = row.querySelector('td:last-child');
        
        // --- LÓGICA ESTÁNDAR REPORTES INCIDENCIAS ---
        if (!isLanzamientos) {
            actionTd.style.display = 'table-cell'; // Asegurar modo tabla-celda puro
            
            const flexWrapper = document.createElement('div');
            flexWrapper.className = 'table-actions-wrapper';
            actionTd.appendChild(flexWrapper);

            // 1. Circular Button "Ver"
            const verBtn = document.createElement('button');
            verBtn.className = 'action-btn-circle';
            verBtn.innerHTML = '<i class="fas fa-eye"></i>';
            verBtn.title = 'Ver Detalles Completos';
            verBtn.onclick = (e) => {
                e.stopPropagation();
                modal.style.display = 'none';
                APP_CONFIG.returnToHistorial = true;
                window.showReportDetails(r);
            };
            flexWrapper.appendChild(verBtn);

            // 2. BOTONES DE GESTIÓN UNIVERSAL: Editar (para ABIERTA y PENDIENTE) y Eliminar solo para estado ABIERTA
            if (rawEst === 'abierta' || rawEst === 'abierto' || rawEst === 'pendiente') {
                // Botón Editar (Lápiz azul-turquesa)
                const editBtn = document.createElement('button');
                editBtn.className = 'action-btn-circle';
                editBtn.style.color = '#00bcd4'; 
                editBtn.innerHTML = '<i class="fas fa-pencil-alt"></i>';
                editBtn.title = 'Editar este reporte';
                editBtn.onclick = (e) => {
                    e.stopPropagation();
                    modal.style.display = 'none';
                    window.jumpToCreateReportForStore(r); 
                };
                flexWrapper.appendChild(editBtn);

                if (rawEst === 'abierta' || rawEst === 'abierto') {
                    // Botón Eliminar (Basura roja)
                    const delBtn = document.createElement('button');
                    delBtn.className = 'action-btn-circle';
                    delBtn.style.color = '#e74c3c'; 
                    delBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
                    delBtn.title = 'Eliminar este reporte permanentemente';
                    delBtn.onclick = async (e) => {
                        e.stopPropagation();
                        if (await window.showConfirm('¿Eliminar Reporte?', '¿Seguro que deseas ELIMINAR este reporte permanentemente? Esta acción no se puede deshacer.', true)) {
                            modal.style.display = 'none';
                            await window.deleteDashboardReport(r.id);
                        }
                    };
                    flexWrapper.appendChild(delBtn);
                }
            }
            
            // 3. Button "Incidencia Resuelta" (Para PENDIENTE y ABIERTA, visible universalmente)
            if (rawEst === 'pendiente' || rawEst === 'abierta' || rawEst === 'abierto') {
                const resBtn = document.createElement('button');
                resBtn.className = 'action-btn-circle';
                resBtn.style.color = '#52c41a'; // Verde éxito vibrante
                resBtn.innerHTML = '<i class="fas fa-check"></i>';
                resBtn.title = 'Marcar como Solucionado';
                resBtn.onclick = (e) => {
                    e.stopPropagation();
                    window.showQuickBox(r);
                };
                flexWrapper.appendChild(resBtn);
            }
            
            // 4. Permisos Admin
            if (isAdmin) {
                if (rawEst === 'abierta' || rawEst === 'abierto') {
                    const repBtn = document.createElement('button');
                    repBtn.className = 'action-btn-circle';
                    repBtn.style.color = '#e67e22';
                    repBtn.innerHTML = '<i class="fas fa-tools"></i>';
                    repBtn.title = 'Marcar como Solicitado reparación';
                    repBtn.onclick = async (e) => {
                        e.stopPropagation();
                        modal.style.display = 'none';
                        await window.changeIncidentStatus(r.id, 'Pendiente');
                    };
                    flexWrapper.appendChild(repBtn);
                } else if (rawEst === 'solucionado') {
                    const revBtn = document.createElement('button');
                    revBtn.className = 'action-btn-circle';
                    revBtn.style.color = '#2ecc71';
                    revBtn.innerHTML = '<i class="fas fa-search"></i>';
                    revBtn.title = 'Revisar Resolución';
                    revBtn.onclick = (e) => {
                        e.stopPropagation();
                        modal.style.display = 'none';
                        APP_CONFIG.returnToHistorial = true;
                        window.showReportDetails(r);
                        setTimeout(() => {
                            const adminRev = document.getElementById('admin-review-btn');
                            if (adminRev) adminRev.click();
                        }, 250);
                    };
                    flexWrapper.appendChild(revBtn);
                }
            }
        }
        
        tbody.appendChild(row);
    });
};

window.applyModalFilters = function() {
    let items = APP_CONFIG.currentHistorialItems || [];
    const isLanzamientos = APP_CONFIG.currentHistorialIsLanzamientos || false;
    
    const targetStatus = APP_CONFIG.currentModalStatus || 'all';
    const isTodos = targetStatus === 'all' || targetStatus === 'todos';
    
    // First, filter items by status so dropdowns only show relevant data
    let statusFilteredItems = items;
    if (!isTodos && !isLanzamientos) {
        statusFilteredItems = items.filter(r => {
            const est = String(r.estado || '').trim().toLowerCase();
            if (targetStatus === 'cerrada') return est.includes('cerrada') || est.includes('cerrado');
            return est.includes(targetStatus);
        });
    }

    const cuentaVal = document.getElementById('modal-filter-cuenta')?.value || 'all';
    const filterTienda = document.getElementById('modal-filter-tienda');
    
    // Dynamically rebuild modal-filter-tienda based on selected cuenta AND status
    if (filterTienda) {
        const currentTiendaVal = filterTienda.value;
        const filterList = document.getElementById('modal-filter-tienda-list');
        if (filterList) {
            let storesForCuenta = statusFilteredItems;
            if (cuentaVal !== 'all') {
                storesForCuenta = statusFilteredItems.filter(r => String(r.cuenta || '').trim() === cuentaVal);
            }
            const tiendas = [...new Set(storesForCuenta.map(r => String(r.tienda || '').trim()).filter(Boolean))].sort();
            
            filterList.innerHTML = '';
            tiendas.forEach(t => filterList.innerHTML += `<option value="${t}"></option>`);
            
            if (currentTiendaVal !== '' && !tiendas.includes(currentTiendaVal)) {
                filterTienda.value = '';
            }
        }
    }
    
    const tiendaVal = filterTienda?.value.trim().toLowerCase() || '';
    const tipoVal = document.getElementById('modal-filter-tipo')?.value || 'all';
    const usuarioVal = document.getElementById('modal-filter-usuario')?.value || 'all';
    const estadoVal = document.getElementById('modal-filter-estado')?.value || 'all';
    
    const userRole = String(APP_CONFIG.currentUser?.rol || '').trim().toUpperCase();
    const isAdmin = userRole === 'ADMIN' || userRole === 'ADMINISTRADOR';

    const filtered = items.filter(r => {
        // Si no estamos en "Todos" ni en lanzamientos, filtramos duro por estado
        if (!isTodos && !isLanzamientos) {
            const est = String(r.estado || '').trim().toLowerCase();
            let matchStatus = false;
            if (targetStatus === 'cerrada') matchStatus = est.includes('cerrada') || est.includes('cerrado');
            else matchStatus = est.includes(targetStatus);
            if (!matchStatus) return false;
        }
        
        // Filtros desplegables
        if (cuentaVal !== 'all' && String(r.cuenta || '').trim() !== cuentaVal) return false;
        
        if (tiendaVal !== '' && !String(r.tienda || '').trim().toLowerCase().includes(tiendaVal)) return false;
        
        if (tipoVal !== 'all') {
            const rCat = String(r.categoria || '').trim().toLowerCase();
            let rTipoFinal = rCat;
            if (String(r.tipo || '').trim().toLowerCase().includes('lanzamiento')) rTipoFinal = 'lanzamiento';
            if (rCat.includes('pantalla')) rTipoFinal = 'pantalla';
            if (rCat.includes('lona')) rTipoFinal = 'lona';
            if (rTipoFinal !== tipoVal) return false;
        }
        
        if (isAdmin && usuarioVal !== 'all') {
            const rUsuario = String(r.usuario || '').trim();
            if (rUsuario !== usuarioVal) return false;
        }
        
        if (isTodos && estadoVal !== 'all') {
            const est = String(r.estado || '').trim().toLowerCase();
            if (estadoVal === 'cerrada') {
                if (!est.includes('cerrada') && !est.includes('cerrado')) return false;
            } else {
                if (!est.includes(estadoVal)) return false;
            }
        }
        
        return true;
    });
    
    if (typeof renderHistorialRows === 'function') {
        APP_CONFIG.lastFilteredHistorialItems = filtered;
        window.renderHistorialRows(filtered, isLanzamientos);
    }
};

window.showHistorialModal = function(title, items, isLanzamientos) {
    const modal = document.getElementById('historial-modal');
    const titleEl = document.getElementById('historial-modal-title');
    const filtersEl = document.getElementById('historial-modal-filters');
    
    if (!modal || !titleEl) return;
    
    titleEl.textContent = title;
    
    // Hide filters for general historical views (not the dashboard summary cards)
    if (filtersEl) filtersEl.style.display = 'none';
    
    // Save current items for local filtering
    APP_CONFIG.currentHistorialItems = items;
    APP_CONFIG.currentHistorialIsLanzamientos = isLanzamientos;
    
    const userRole = String(APP_CONFIG.currentUser?.rol || '').trim().toUpperCase();
    const isAdmin = userRole === 'ADMIN' || userRole === 'ADMINISTRADOR';
    const excelBtn = document.getElementById('export-excel-btn');
    if (excelBtn) {
        excelBtn.style.display = isAdmin ? 'flex' : 'none';
    }
    
    window.renderHistorialRows(items, isLanzamientos);
    
    modal.style.display = 'flex';
    modal.classList.remove('hidden');
};

window.filterToIncidents = function() {
    if (!APP_CONFIG.dashboardReports) return;
    let filtered = APP_CONFIG.dashboardReports.filter(r => {
        const est = String(r.estado || '').trim().toLowerCase();
        return est === 'abierta' || est === 'pendiente';
    });
    
    window.showHistorialModal('Historial de Incidencias Activas', filtered, false);
};

window.filterToAllReports = function() {
    if (!APP_CONFIG.dashboardReports) return;
    window.showHistorialModal('Historial de Reportes Totales', APP_CONFIG.dashboardReports, false);
};

// --- Password Hashing ---
async function hashPassword(password) {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- Authentication ---
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-usuario').value;
    const pass = document.getElementById('login-password').value;
    const errorMsg = document.getElementById('login-error');

    errorMsg.textContent = 'Verificando...';

    try {
        const hashedPass = await hashPassword(pass);
        const response = await callApi({
            action: 'login',
            email: email,
            password: hashedPass
        });

        console.log("Login Response:", response);
        if (response.success) {
            APP_CONFIG.currentUser = response.user;
            localStorage.setItem('xiaomi_user', JSON.stringify(response.user));
            startApp(true);
            
            // Solicitar permisos de notificación nativa
            if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
                Notification.requestPermission();
            }
        } else {
            errorMsg.textContent = response.message || 'Error al iniciar sesión';
        }
    } catch (err) {
        errorMsg.textContent = 'Error de conexión con el servidor (Revisa el despliegue)';
        console.error('Error en login:', err);
    }
}

function startApp(forceDashboard = false) {
    views.login.classList.add('hidden');
    views.app.classList.remove('hidden');
    document.getElementById('user-name').textContent = APP_CONFIG.currentUser.nombre;
    document.getElementById('user-badge').textContent = APP_CONFIG.currentUser.rol;
    
    // Premium Hero Welcome Label
    const welcomeEl = document.getElementById('welcome-msg');
    if (welcomeEl) {
        welcomeEl.innerHTML = `¡Hola, ${String(APP_CONFIG.currentUser.nombre).split(' ')[0]}! ✨`;
    }
    
    // Rellenar Cuentas dinámicamente
    const tiendas = APP_CONFIG.currentUser.tiendas || [];
    const cuentas = [...new Set(tiendas.map(t => t.cuenta))]; // Cuentas únicas
    
    ['incident'].forEach(type => {
        const cuentaSelect = document.getElementById(`${type}-cuenta`);
        const centroSelect = document.getElementById(`${type}-centro`);
        
        if (cuentaSelect) {
            cuentaSelect.innerHTML = '<option value="" disabled selected>Seleccione Cuenta</option>';
            if (cuentas.length === 0) {
                cuentaSelect.innerHTML = '<option value="" disabled>Sin tiendas asignadas</option>';
            } else {
                cuentas.forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c;
                    opt.textContent = c;
                    cuentaSelect.appendChild(opt);
                });
            }
        }

        if (centroSelect) {
            centroSelect.innerHTML = '<option value="" disabled selected>Primero elige cuenta</option>';
            centroSelect.disabled = true;
        }
    });

    const targetView = forceDashboard ? 'dashboard' : (localStorage.getItem('xiaomi_last_view') || 'dashboard');
    showView(targetView);
    
    // Sincronizar estado activo de los links de navegación
    navLinks.forEach(link => {
        if (link.getAttribute('data-target') === targetView) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // Pre-cargar correspondencia en segundo plano para hidratar badge de mensajes
    setTimeout(() => {
        if (typeof window.loadUserInbox === 'function') window.loadUserInbox();
    }, 1000);
}

function filterStoresByAccount(type, cuenta) {
    const tiendas = APP_CONFIG.currentUser.tiendas || [];
    const filtered = tiendas.filter(t => t.cuenta === cuenta);
    
    const select = document.getElementById(`${type}-centro`);
    if (select) {
        select.disabled = false;
        select.innerHTML = '<option value="" disabled selected>Seleccione Centro</option>';
        filtered.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.nombre;
            opt.dataset.owner = t.owner || t.usuario || '';
            opt.textContent = t.nombre;
            select.appendChild(opt);
        });
    }
}

// Custom Store Selection Modal Logic
window.openStoreSelectionModal = function(mode = 'incident') {
    APP_CONFIG.currentStoreSelectionMode = mode;
    const modal = document.getElementById('store-selection-modal');
    if (!modal) return;
    
    const searchInput = document.getElementById('store-selection-search');
    if (searchInput) searchInput.value = '';
    
    renderStoreSelectionList();
    
    modal.style.display = 'flex';
    modal.classList.remove('hidden');
    
    if (searchInput) {
        setTimeout(() => searchInput.focus(), 100);
        searchInput.oninput = renderStoreSelectionList;
    }
};

window.renderStoreSelectionList = function() {
    const listContainer = document.getElementById('store-selection-list');
    const searchInput = document.getElementById('store-selection-search');
    if (!listContainer) return;
    
    const mode = APP_CONFIG.currentStoreSelectionMode || 'incident';
    
    let stores = [];
    if (mode === 'incident') {
        stores = APP_CONFIG.currentCuentaStores || [];
    } else {
        // Tiendas View mode
        const filterCuenta = document.getElementById('tiendas-filter-cuenta');
        const selectedCuenta = filterCuenta ? filterCuenta.value : 'all';
        let allStores = APP_CONFIG.currentUser.tiendas || [];
        if (selectedCuenta !== 'all') {
            stores = allStores.filter(t => String(t.cuenta || '').trim() === selectedCuenta);
        } else {
            stores = allStores;
        }
    }
    
    // Dedup stores by name since the list might contain the same store multiple times for different metrics
    const uniqueStoreNames = [...new Set(stores.map(t => String(t.nombre || '').trim()))].filter(Boolean);
    let uniqueStores = uniqueStoreNames.map(name => {
        return stores.find(t => String(t.nombre || '').trim() === name);
    });
    
    if (searchInput && searchInput.value.trim() !== '') {
        const query = searchInput.value.toLowerCase().trim();
        uniqueStores = uniqueStores.filter(t => 
            String(t.nombre || '').toLowerCase().includes(query) || 
            String(t.rms || '').toLowerCase().includes(query)
        );
    }
    
    listContainer.innerHTML = '';
    
    // Add "Todas las Tiendas" option if mode is 'tiendas_view'
    if (mode === 'tiendas_view') {
        const allBtn = document.createElement('button');
        allBtn.style.cssText = 'width: 100%; text-align: left; padding: 12px 15px; background: #f9f9f9; border: 1px solid #eee; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; font-size: 14px; color: #333; transition: all 0.2s; font-style: italic;';
        allBtn.innerHTML = `<span><i class="fas fa-list"></i> Todas las Tiendas</span>`;
        allBtn.onclick = () => {
            document.getElementById('store-selection-modal').style.display = 'none';
            document.getElementById('store-selection-modal').classList.add('hidden');
            const tiendasInput = document.getElementById('tiendas-filter-tienda');
            if (tiendasInput) {
                tiendasInput.value = '';
                tiendasInput.dataset.realValue = '';
                window.renderTiendasGrid();
            }
        };
        listContainer.appendChild(allBtn);
    }
    
    if (uniqueStores.length === 0) {
        listContainer.innerHTML += '<div style="padding: 20px; text-align: center; color: #888;">No hay resultados</div>';
        return;
    }
    
    // Sort
    uniqueStores.sort((a, b) => String(a.nombre || '').localeCompare(String(b.nombre || '')));
    
    uniqueStores.forEach(t => {
        const btn = document.createElement('button');
        btn.style.cssText = 'width: 100%; text-align: left; padding: 12px 15px; background: #f9f9f9; border: 1px solid #eee; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; font-size: 14px; color: #333; transition: all 0.2s;';
        btn.onmouseover = () => btn.style.borderColor = 'var(--mi-orange)';
        btn.onmouseout = () => btn.style.borderColor = '#eee';
        
        btn.innerHTML = `
            <span style="font-weight: 500;">${t.nombre}</span>
            <i class="fas fa-chevron-right" style="color: #ccc; font-size: 12px;"></i>
        `;
        
        btn.onclick = () => {
            document.getElementById('store-selection-modal').style.display = 'none';
            document.getElementById('store-selection-modal').classList.add('hidden');
            
            if (mode === 'incident') {
                document.getElementById('selected-store-text').textContent = t.nombre;
                document.getElementById('selected-store-text').style.fontWeight = 'bold';
                document.getElementById('custom-store-trigger').style.border = '1px solid #ccc';
                const hiddenInput = document.getElementById('incident-centro');
                if (hiddenInput) {
                    hiddenInput.value = t.nombre;
                    startIncidentProcedure(t.nombre);
                }
            } else if (mode === 'tiendas_view') {
                const tiendasInput = document.getElementById('tiendas-filter-tienda');
                if (tiendasInput) {
                    tiendasInput.value = t.nombre;
                    window.renderTiendasGrid();
                }
            }
        };
        
        listContainer.appendChild(btn);
    });
};

async function loadUsers() {
    const select = document.getElementById('login-usuario');
    if (!select) return;

    // 1. OPTIMIZACIÓN: Usar caché local para que el desplegable responda AL INSTANTE
    const cachedUsersStr = localStorage.getItem('cached_users_list');
    if (cachedUsersStr) {
        try {
            const cached = JSON.parse(cachedUsersStr);
            if (cached && cached.length > 0) {
                console.log("Renderizando usuarios desde caché instantáneo...");
                renderUsersToDropdown(cached, select);
                // Si ya tenemos caché, no hace falta mostrar spinner, simplemente refrescamos en background
            }
        } catch(e) {
             select.innerHTML = '<option value="" disabled selected>Cargando usuarios...</option>';
        }
    } else {
        select.innerHTML = '<option value="" disabled selected>Cargando usuarios...</option>';
    }
    
    // 2. LISTA DE EMERGENCIA HARDCODED (Backup total en caso de bloqueo de navegador o local file restricted)
    const HARDCODED_FALLBACK = [{"email":"Virginia Rodriguez","nombre":"Virginia Rodriguez"},{"email":"Carlos Deniz","nombre":"Carlos Deniz"},{"email":"Jesús de Luis Blanco","nombre":"Jesús de Luis Blanco"},{"email":"Carlos Bellasai","nombre":"Carlos Bellasai"},{"email":"Virginia Torre","nombre":"Virginia Torre"},{"email":"Ezequiel Brito","nombre":"Ezequiel Brito"},{"email":"Jesus de la Torre","nombre":"Jesus de la Torre"},{"email":"Francisco Paz","nombre":"Francisco Paz"},{"email":"Ricardo Dahdah Leon","nombre":"Ricardo Dahdah Leon"},{"email":"Miguel Mata","nombre":"Miguel Mata"},{"email":"Fernando Torres","nombre":"Fernando Torres"},{"email":"Estela Corbella","nombre":"Estela Corbella"},{"email":"Carlos Martinez","nombre":"Carlos Martinez"},{"email":"Joaquín Lemus","nombre":"Joaquín Lemus"},{"email":"Elizabeth López","nombre":"Elizabeth López"},{"email":"Alicia Muruzabal","nombre":"Alicia Muruzabal"}];

    try {
        console.log("Intentando cargar usuarios en vivo...");
        const users = await callApi({ action: 'getUserList' });
        
        if (users && Array.isArray(users) && users.length > 0) {
            localStorage.setItem('cached_users_list', JSON.stringify(users));
            renderUsersToDropdown(users, select);
            console.log("? Carga en vivo completada.");
            return;
        }
    } catch (err) {
        console.error('⚠️ Bloqueo de red al cargar usuarios. Activando modo Rescate Local:', err);
    }

    // 3. ACTIVACIÓN DE EMERGENCIA
    if (!select.options.length || select.value === "") {
        console.warn("🚨 Activando lista de usuarios de emergencia hardcoded por fallo de red.");
        renderUsersToDropdown(HARDCODED_FALLBACK, select);
        // Añadimos opción visual de que está en modo redundante
        const opt = document.createElement('option');
        opt.disabled = true;
        opt.textContent = "-- Carga de Emergencia Activa --";
        select.prepend(opt);
    }
}

function renderUsersToDropdown(users, select) {
    if (!select) return;
    const currentVal = select.value; // Preservar si ya eligió algo
    select.innerHTML = '<option value="" disabled selected>Selecciona tu usuario</option>';
    
    users.forEach(user => {
        if (user && user.email) {
            const opt = document.createElement('option');
            opt.value = user.email;
            // Limpiar: Solo mostrar nombre, quitar paréntesis con email
            opt.textContent = user.nombre || user.email; 
            select.appendChild(opt);
        }
    });
    if (currentVal) select.value = currentVal;
}



async function loadDeviceCatalog() {
    try {
        const devices = await callApi({ action: 'getDevices' });
        if (devices && Array.isArray(devices)) {
            APP_CONFIG.deviceCatalog = devices;
            console.log(`Loaded ${devices.length} devices into catalog.`);
        }
    } catch (e) {
        console.error('Error loading device catalog:', e);
    }
}

// --- Device Specific UI Logic ---
window.selectDeviceTipology = function(tipology, btn) {
    // 1. Marcar la burbuja activa
    const group = btn.parentElement;
    group.querySelectorAll('.bubble-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // 2. Guardar en el path temporal
    APP_CONFIG.currentReport.path[1] = tipology;
    
    // 3. Inyectar dinámicamente las subcategorías de nivel 3 según la tipología
    const matchTipology = tipology.trim().toUpperCase();
    const subGroup = document.getElementById('device-subcategories-group');
    if (subGroup) {
        subGroup.innerHTML = '';
        let items = [];
        if (matchTipology === 'POSM') {
            items = ['Display', 'Filmina', 'Luminoso', 'Miniluminoso', 'Ficha de Producto', 'Ficha energética', 'A4', 'OTROS'];
        } else {
            // Para LDU y DUMMY
            items = ['MESA', 'MURO', 'COLUMNA', 'LINEAL', 'OTROS'];
        }
        items.forEach(subItem => {
            const button = document.createElement('button');
            button.className = 'bubble-btn sub';
            button.textContent = subItem;
            button.onclick = () => selectLevel('device', 3, subItem);
            subGroup.appendChild(button);
        });
    }
    
    // 4. Avanzar directamente a Subcategoría (Level 3) y resetear el resto (protegido si estamos en precarga)
    if (!window.isAutoloadingReport) {
        APP_CONFIG.currentSelectedDevices = [];
    }
    renderSelectedDevices();

    document.getElementById('device-l3').classList.remove('hidden');
    document.getElementById('device-models-box').classList.add('hidden');
    document.getElementById('device-l4').classList.add('hidden');
    document.getElementById('final-level-device').classList.add('hidden');
    
    document.getElementById('device-l3').scrollIntoView({ behavior: 'smooth', block: 'center' });
};

window.addDeviceToList = function() {
    const dropdown = document.getElementById('device-selector-dropdown');
    const customInput = document.getElementById('device-selector-custom');
    const qtyInput = document.getElementById('device-quantity-input');
    
    let selectedModel = '';
    let selectedCode = 'N/A';
    let selectedRepType = '';

    // Determinar si estamos usando el selector manual o el desplegable
    const isCustom = !customInput.classList.contains('hidden');
    
    if (isCustom) {
        selectedModel = customInput.value.trim();
        selectedCode = 'OTRO';
        selectedRepType = 'OTRO';
    } else {
        selectedModel = dropdown.value;
        selectedCode = dropdown.options[dropdown.selectedIndex]?.dataset.code || 'N/A';
        selectedRepType = dropdown.options[dropdown.selectedIndex]?.dataset.repType || '';
    }
    
    const selectedQty = parseInt(qtyInput.value) || 1;
    
    if (!selectedModel) {
        alert(isCustom ? "Escribe el nombre del artículo." : "Por favor seleccione un modelo de la lista.");
        return;
    }
    
    // Añadir al array
    APP_CONFIG.currentSelectedDevices.push({
        modelo: selectedModel,
        cantidad: selectedQty,
        codigoDispositivo: selectedCode,
        tipoReporte: selectedRepType
    });
    
    // Reset input para el siguiente
    qtyInput.value = 1;
    dropdown.selectedIndex = 0;
    customInput.value = '';
    
    renderSelectedDevices();
};

window.removeDeviceFromList = function(index) {
    APP_CONFIG.currentSelectedDevices.splice(index, 1);
    renderSelectedDevices();
};

function renderSelectedDevices() {
    const listContainer = document.getElementById('device-selected-list');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';
    
    if (APP_CONFIG.currentSelectedDevices.length === 0) {
        listContainer.innerHTML = '<p id="no-devices-msg" style="font-style: italic; color: #999; margin: 0; font-size: 12px;">Ningún modelo añadido aún.</p>';
        return;
    }
    
    APP_CONFIG.currentSelectedDevices.forEach((item, idx) => {
        const div = document.createElement('div');
        div.style.cssText = 'display: flex; align-items: center; justify-content: space-between; background: white; border: 1px solid #eee; padding: 6px 10px; border-radius: 6px; font-size: 12px;';
        div.innerHTML = `
            <span><strong>${item.modelo}</strong> <small style="color:#666;">(${item.codigoDispositivo})</small></span>
            <div style="display:flex; align-items:center; gap:12px;">
                <span style="background:#ff6700; color:white; padding: 2px 8px; border-radius: 20px; font-weight:bold; font-size:11px;">x${item.cantidad}</span>
                <button type="button" onclick="removeDeviceFromList(${idx})" style="border:none; background:none; color:#ff4d4f; cursor:pointer; padding:0;"><i class="fa fa-trash"></i></button>
            </div>
        `;
        listContainer.appendChild(div);
    });
}

// LOGICA DE LONAS

window.addLonaToList = function() {
    const dropdown = document.getElementById('lona-selector-dropdown');
    const customInput = document.getElementById('lona-selector-custom');
    const qtyInput = document.getElementById('lona-quantity-input');
    
    let selectedModel = '';
    let selectedCode = 'N/A';

    const isCustom = !customInput.classList.contains('hidden');
    
    if (isCustom) {
        selectedModel = customInput.value.trim();
        selectedCode = 'OTRO';
    } else {
        selectedModel = dropdown.options[dropdown.selectedIndex]?.text || dropdown.value;
        if (dropdown.value === 'otro') selectedModel = customInput.value.trim();
        selectedCode = dropdown.options[dropdown.selectedIndex]?.dataset.code || 'N/A';
    }
    
    const selectedQty = parseInt(qtyInput.value) || 1;
    
    if (!selectedModel) {
        alert(isCustom ? "Escribe el nombre del modelo de lona." : "Por favor seleccione un modelo de la lista.");
        return;
    }
    
    APP_CONFIG.currentSelectedLonas.push({
        modelo: selectedModel,
        cantidad: selectedQty,
        codigoDispositivo: selectedCode
    });
    
    qtyInput.value = 1;
    dropdown.selectedIndex = 0;
    customInput.value = '';
    
    renderSelectedLonas();
};

window.removeLonaFromList = function(index) {
    APP_CONFIG.currentSelectedLonas.splice(index, 1);
    renderSelectedLonas();
};

function renderSelectedLonas() {
    const listContainer = document.getElementById('lona-selected-list');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';
    
    if (APP_CONFIG.currentSelectedLonas.length === 0) {
        listContainer.innerHTML = '<p id="no-lonas-msg" style="font-style: italic; color: #999; margin: 0; font-size: 12px;">Ningún modelo añadido aún.</p>';
        return;
    }
    
    APP_CONFIG.currentSelectedLonas.forEach((item, idx) => {
        const div = document.createElement('div');
        div.style.cssText = 'display: flex; align-items: center; justify-content: space-between; background: white; border: 1px solid #eee; padding: 6px 10px; border-radius: 6px; font-size: 12px;';
        div.innerHTML = `
            <span><strong>${item.modelo}</strong> <small style="color:#666;">(${item.codigoDispositivo})</small></span>
            <div style="display:flex; align-items:center; gap:12px;">
                <span style="background:#ff6700; color:white; padding: 2px 8px; border-radius: 20px; font-weight:bold; font-size:11px;">x${item.cantidad}</span>
                <button type="button" onclick="removeLonaFromList(${idx})" style="border:none; background:none; color:#ff4d4f; cursor:pointer; padding:0;"><i class="fa fa-trash"></i></button>
            </div>
        `;
        listContainer.appendChild(div);
    });
}

// ---- LOGICA DE MOBILIARIO ALARMADOS (MULTI-ITEM) ----
window.addAlarmadoToList = function() {
    const dropdown = document.getElementById('furn-rep-modelo');
    const qtyInput = document.getElementById('furn-rep-cantidad');
    
    const selectedOption = dropdown.options[dropdown.selectedIndex];
    if (!selectedOption || !selectedOption.value) {
        alert('Por favor, selecciona un modelo de Alarmado.');
        dropdown.focus();
        return;
    }
    
    const selectedModel = selectedOption.value;
    const selectedCode = selectedOption.dataset.code || '';
    const selectedQty = parseInt(qtyInput.value) || 1;
    
    if (selectedQty < 1) {
        alert('La cantidad debe ser al menos 1.');
        qtyInput.focus();
        return;
    }
    
    APP_CONFIG.currentSelectedAlarmados.push({
        modelo: selectedModel,
        cantidad: selectedQty,
        codigoDispositivo: selectedCode
    });
    
    dropdown.value = '';
    qtyInput.value = '1';
    
    renderSelectedAlarmados();
};

window.removeAlarmadoFromList = function(index) {
    APP_CONFIG.currentSelectedAlarmados.splice(index, 1);
    renderSelectedAlarmados();
};

function renderSelectedAlarmados() {
    const listContainer = document.getElementById('furn-alarmado-selected-list');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';
    
    if (APP_CONFIG.currentSelectedAlarmados.length === 0) {
        listContainer.innerHTML = '<p id="no-alarmados-msg" style="font-style: italic; color: #999; margin: 0; font-size: 11px;">Ningún modelo añadido aún.</p>';
        return;
    }
    
    APP_CONFIG.currentSelectedAlarmados.forEach((item, idx) => {
        const div = document.createElement('div');
        div.style.cssText = 'display: flex; align-items: center; justify-content: space-between; background: white; border: 1px solid #eee; padding: 6px 10px; border-radius: 6px; font-size: 12px;';
        div.innerHTML = `
            <span><strong>${item.modelo}</strong> <small style="color:#666;">(${item.codigoDispositivo})</small></span>
            <div style="display:flex; align-items:center; gap:12px;">
                <span style="background:#ff6700; color:white; padding: 2px 8px; border-radius: 20px; font-weight:bold; font-size:11px;">x${item.cantidad}</span>
                <button type="button" onclick="removeAlarmadoFromList(${idx})" style="border:none; background:none; color:#ff4d4f; cursor:pointer; padding:0;"><i class="fa fa-trash"></i></button>
            </div>
        `;
        listContainer.appendChild(div);
    });
}

// --- Procedure Logic ---
function startIncidentProcedure(centro) {
    if (!centro) return;
    APP_CONFIG.currentReport.centro = centro;
    const catSelection = document.getElementById('category-selection');
    if (catSelection) catSelection.classList.remove('hidden');
    // Ensure all sub-procedures are hidden until chosen
    const fp = document.getElementById('furniture-procedure');
    if (fp) fp.classList.add('hidden');
    const dp = document.getElementById('device-procedure');
    if (dp) dp.classList.add('hidden');
    const sp = document.getElementById('screen-procedure');
    if (sp) sp.classList.add('hidden');
}

window.chooseMainCategory = function(category, btn) {
    // 1. LIMPIEZA PREVENTIVA ABSOLUTA:
    // Al cambiar entre Mobiliario/Dispositivo, reseteamos TODO para no dejar el formulario roto a medias,
    // pero pasamos "true" para que NO borre la tienda elegida ni oculte este selector principal.
    resetProcedure(true);

    // Reset path completamente
    if (category === 'furniture') {
        APP_CONFIG.currentReport.path = ['Mobiliario'];
    } else if (category === 'screen') {
        APP_CONFIG.currentReport.path = ['Pantalla Digital'];
    } else if (category === 'lona') {
        APP_CONFIG.currentReport.path = ['Lona'];
    } else {
        APP_CONFIG.currentReport.path = ['Dispositivo'];
    }
    APP_CONFIG.currentReport.category = category;

    // UI Feedback for category buttons
    const group = btn.parentElement;
    group.querySelectorAll('.bubble-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Show corresponding procedure container, hide the others
    const fp2 = document.getElementById('furniture-procedure');
    if (fp2) fp2.classList.add('hidden');
    const dp2 = document.getElementById('device-procedure');
    if (dp2) dp2.classList.add('hidden');
    const sp2 = document.getElementById('screen-procedure');
    if (sp2) sp2.classList.add('hidden');
    const lp2 = document.getElementById('lona-procedure');
    if (lp2) lp2.classList.add('hidden');

    if (category === 'furniture') {
        const el = document.getElementById('furniture-procedure');
        if (el) el.classList.remove('hidden');
        resetLevels('furniture');
    } else if (category === 'screen') {
        const el1 = document.getElementById('screen-procedure');
        if (el1) el1.classList.remove('hidden');
        const el2 = document.getElementById('final-level-screen');
        if (el2) el2.classList.remove('hidden');
    } else if (category === 'lona') {
        const el = document.getElementById('lona-procedure');
        if (el) {
            el.classList.remove('hidden');
            const l2 = document.getElementById('lona-l2');
            if (l2) l2.classList.remove('hidden');
        }
    } else {
        const el = document.getElementById('device-procedure');
        if (el) el.classList.remove('hidden');
        resetLevels('device');
    }
};

function resetLevels(type) {
    const container = document.getElementById(`${type}-procedure`);
    const boxes = container.querySelectorAll('.level-box');
    // Hide all boxes except the first one in that tree (which is level 2)
    boxes.forEach(box => {
        if (box.dataset.level === "2") {
            box.classList.remove('hidden');
        } else {
            box.classList.add('hidden');
        }
        box.querySelectorAll('.bubble-btn').forEach(b => b.classList.remove('active'));
    });
    document.getElementById(`final-level-${type}`).classList.add('hidden');
}

function selectLevel(type, level, value) {
    // Note: level passed here is 2, 3, or 4. Path index should be level - 1
    APP_CONFIG.currentReport.path = APP_CONFIG.currentReport.path.slice(0, level - 1);
    
    // Save selection
    APP_CONFIG.currentReport.path[level - 1] = value;

    // UI Feedback: Activate bubble in current box
    const container = document.getElementById(`${type}-procedure`);
    // Find the box for the CURRENT level
    const currentBox = container.querySelector(`.level-box[data-level="${level}"]`);
    
    if (currentBox) {
        currentBox.querySelectorAll('.bubble-btn').forEach(btn => {
            btn.classList.toggle('active', btn.textContent === value);
        });
    }

    // Hide subsequent levels
    const boxes = container.querySelectorAll('.level-box');
    boxes.forEach(box => {
        if (parseInt(box.dataset.level) > level) {
            box.classList.add('hidden');
            box.querySelectorAll('.bubble-btn').forEach(b => b.classList.remove('active'));
        }
    });

    // --- LOGICA DE MOBILIARIO PARA ALARMADO ---
    if (type === 'furniture' && level === 3) {
        const alarmadoFields = document.getElementById('furniture-alarmado-fields');
        const alarmadoInfo = document.getElementById('furn-alarmado-info');
        if (value === 'ALARMADO') {
            if (alarmadoFields) alarmadoFields.style.display = 'block';
            if (alarmadoInfo) alarmadoInfo.style.display = 'flex';
            
            if (!window.isAutoloadingReport) {
                APP_CONFIG.currentSelectedAlarmados = [];
                if (typeof renderSelectedAlarmados === 'function') renderSelectedAlarmados();
            }
            
            // Poblar dropdown de modelos de alarmado (igual que en Dispositivos pero filtramos por 'ALARMADO')
            const dropdown = document.getElementById('furn-rep-modelo');
            if (dropdown) {
                dropdown.innerHTML = '<option value="">Seleccione modelo...</option>';
                const filtered = APP_CONFIG.deviceCatalog.filter(d => {
                    const searchPayload = normalizeString(d.col1 || d.Subcategoria || d.Subcategoria || '');
                    return searchPayload === 'ALARMADO';
                });
                
                filtered.forEach(d => {
                    const model = String(d.col2 || d.Modelo || '').trim();
                    const code = d['Código Dispositivo'] || d.codigo || d.col3 || ''; 
                    
                    if (model && model !== '' && model.toUpperCase() !== 'MODELO') {
                        const opt = document.createElement('option');
                        opt.value = model;
                        opt.textContent = code ? `${model} - ${code}` : model;
                        opt.dataset.code = code; 
                        dropdown.appendChild(opt);
                    }
                });
            }
            
        } else {
            if (alarmadoFields) alarmadoFields.style.display = 'none';
            if (alarmadoInfo) alarmadoInfo.style.display = 'none';
            // Limpiar inputs
            const dropdown = document.getElementById('furn-rep-modelo');
            if (dropdown) dropdown.value = '';
            const cantInput = document.getElementById('furn-rep-cantidad');
            if (cantInput) cantInput.value = '';
            
            if (!window.isAutoloadingReport) {
                APP_CONFIG.currentSelectedAlarmados = [];
            }
        }
    }

    // --- EXCEPCIÓN: Flujo de Dispositivos en Nivel 3 y Nivel 4 ---
    if (type === 'device' && (level === 3 || level === 4)) {
        // En Nivel 3 (Subcategoría), limpiamos la selección actual
        if (level === 3 && !window.isAutoloadingReport) {
            APP_CONFIG.currentSelectedDevices = [];
            renderSelectedDevices();
        }
        
        const dropdown = document.getElementById('device-selector-dropdown');
        dropdown.innerHTML = '<option value="">Seleccione modelo...</option>';
        
        const tipologyChosen = String(APP_CONFIG.currentReport.path[1] || '').trim().toUpperCase();
        const subcategoryChosen = String(APP_CONFIG.currentReport.path[2] || '').trim().toUpperCase();
        const motivoChosen = String(APP_CONFIG.currentReport.path[3] || '').trim().toUpperCase();
        
        // CONTROL DINÁMICO: Para OTROS, mostramos el Input de escritura libre (excepto en LDU y DUMMY)
        const customInput = document.getElementById('device-selector-custom');
        if (subcategoryChosen === 'OTROS' && tipologyChosen !== 'LDU' && tipologyChosen !== 'DUMMY') {
            dropdown.classList.add('hidden');
            customInput.classList.remove('hidden');
            if (level === 3) customInput.value = '';
        } else {
            dropdown.classList.remove('hidden');
            customInput.classList.add('hidden');
            if (level === 3) customInput.value = '';
        }
        
        const filtered = APP_CONFIG.deviceCatalog.filter(d => {
            const itemTip = String(d.col0 || d.Tipologia || d['Tipologia'] || '').trim().toUpperCase();
            
            // Flexibilidad: si en excel pone "LDU / DUMMY", matchTipology debe aceptar tanto LDU como DUMMY
            let tipologyMatch = (itemTip === tipologyChosen);
            if (!tipologyMatch && itemTip.includes(tipologyChosen)) {
                tipologyMatch = true;
            }
            
            if (!tipologyMatch) return false;
            
            const searchPayload = normalizeString(d.col1 || d.Subcategoria || d.Subcategoria || '');
            
            if (tipologyChosen === 'POSM') {
                const searchKey = normalizeString(subcategoryChosen);
                if (!searchKey) return true;
                if (searchKey === 'LUMINOSO') return searchPayload === 'LUMINOSO';
                return searchPayload.includes(searchKey);
            } else {
                // LDU y DUMMY
                if (motivoChosen === 'ALARMADO') {
                    // Si el Motivo es Alarmado, SOLO mostrar dispositivos que tengan ALARMADO en el excel
                    return searchPayload === 'ALARMADO';
                } else {
                    // Si el Motivo NO es Alarmado, NO mostrar los alarmados en el listado normal
                    return searchPayload !== 'ALARMADO';
                }
            }
        });
        
        filtered.forEach(d => {
            // User confirma: Coger de la Columna C (col2) el modelo final para todos.
            const model = String(d.col2 || d.Modelo || '').trim();
            const code = d['Código Dispositivo'] || d.codigo || d.col3 || ''; 
            const repType = d['TIPO REPORTE'] || d['Tipo Reporte'] || d.col4 || d.col3 || '';
            
            if (model && model !== '' && model.toUpperCase() !== 'MODELO') {
                const opt = document.createElement('option');
                opt.value = model;
                opt.textContent = model;
                opt.dataset.code = code; 
                opt.dataset.repType = repType; 
                dropdown.appendChild(opt);
            }
        });
        
        if (level === 3) {
            const box = document.getElementById('device-models-box');
            box.classList.remove('hidden');
            
            const nextBox = document.getElementById('device-l4');
            if (nextBox) nextBox.classList.remove('hidden');
            
            const finalBox = document.getElementById('final-level-device');
            if (finalBox) finalBox.classList.remove('hidden');
            
            box.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    } else if (type === 'lona' && level === 3) {
        if (!window.isAutoloadingReport) {
            APP_CONFIG.currentSelectedLonas = [];
            if (typeof renderSelectedLonas === 'function') renderSelectedLonas();
        }
        
        if (APP_CONFIG.deviceCatalog.length === 0) {
            loadDeviceCatalog().then(() => populateLonaDropdown());
        } else {
            populateLonaDropdown();
        }
        
        const final = document.getElementById(`final-level-${type}`);
        if (final) {
            final.classList.remove('hidden');
            final.scrollIntoView({ behavior: 'smooth' });
        }
    } else {
        // Generico: mostrar siguiente nivel o final
        showFinalForm(type);
    }
    
    // Show next level or final form
    const nextLevel = level + 1;
    const nextBox = document.getElementById(`${type}-l${nextLevel}`);

    if (nextBox) {
        nextBox.classList.remove('hidden');
        nextBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        showFinalForm(type);
    }
}

function showFinalForm(type) {
    const final = document.getElementById(`final-level-${type}`);
    if (final) {
        final.classList.remove('hidden');
        final.scrollIntoView({ behavior: 'smooth' });
    }
}

function populateLonaDropdown() {
    const dropdown = document.getElementById('lona-selector-dropdown');
    if (!dropdown) return;
    
    dropdown.innerHTML = '<option value="">Seleccione modelo...</option>';
    
    const tipologyChosen = String(APP_CONFIG.currentReport.path[1] || '').trim().toUpperCase();
    const uniqueModels = new Set();
    
    APP_CONFIG.deviceCatalog.forEach(d => {
        const modelo = String(d.col1 || d.Subcategoria || d.Subcategoria || '').trim();
        const code = String(d.col2 || d.Codigo || d['Codigo Dispositivo'] || '').trim();
        const repType = String(d.col0 || d.Tipologia || '').trim().toUpperCase();
        const subCat = modelo.toUpperCase();
        
        if (!modelo) return;
        
        let tipologyMatch = false;
        if (repType === tipologyChosen || repType.includes(tipologyChosen)) tipologyMatch = true;
        if (subCat === tipologyChosen || subCat.includes(tipologyChosen)) tipologyMatch = true;
        
        if (!tipologyMatch && repType.includes('LONA') && tipologyChosen.includes('TOP TABLE') && (repType.includes('TOP TABLE') || subCat.includes('TOP TABLE'))) tipologyMatch = true;
        if (!tipologyMatch && repType.includes('LONA') && tipologyChosen.includes('COLUMN') && (repType.includes('COLUMN') || subCat.includes('COLUMN'))) tipologyMatch = true;
        if (!tipologyMatch && repType.includes('LONA') && tipologyChosen.includes('WALL') && (repType.includes('WALL') || subCat.includes('WALL'))) tipologyMatch = true;
        if (!tipologyMatch && repType.includes('LONA') && !repType.includes('TOP TABLE') && !repType.includes('COLUMN') && !repType.includes('WALL') && !subCat.includes('TOP TABLE') && !subCat.includes('COLUMN') && !subCat.includes('WALL')) tipologyMatch = true; // Fallback
        
        if (tipologyMatch) {
            const key = modelo + '_' + code;
            if (!uniqueModels.has(key)) {
                uniqueModels.add(key);
                const opt = document.createElement('option');
                opt.value = modelo;
                opt.textContent = code && code !== 'N/A' ? `${modelo} (${code})` : modelo;
                opt.dataset.code = code;
                opt.dataset.repType = repType;
                dropdown.appendChild(opt);
            }
        }
    });
    
    // Añadir opción "Otro" al final
    const optOtro = document.createElement('option');
    optOtro.value = 'otro';
    optOtro.textContent = 'Otro (Escribir manualmente)';
    optOtro.dataset.code = 'OTRO';
    dropdown.appendChild(optOtro);
}

window.handleLonaDropdownChange = function(sel) {
    const customInput = document.getElementById('lona-selector-custom');
    if (!customInput) return;
    if (sel.value === 'otro') {
        customInput.classList.remove('hidden');
        customInput.style.display = 'inline-block';
        customInput.focus();
    } else {
        customInput.classList.add('hidden');
        customInput.style.display = 'none';
        customInput.value = '';
    }
};

async function handleIncidentPhotos(input, type) {
    const container = document.getElementById(`incident-thumbnails-${type}`);
    const submitBtn = document.querySelector(`#final-level-${type} button[type="submit"]`);
    
    if (!input.files || input.files.length === 0) return;
    
    const files = Array.from(input.files);
    
    // Validar máximo de 5 fotos en total
    const currentCount = APP_CONFIG.incidentUploadedPhotos.length;
    const pendingThumbs = container.querySelectorAll('.local-thumb-wrapper:not(.uploaded)').length;
    if (currentCount + pendingThumbs + files.length > 5) {
        alert("Solo se permite subir un máximo de 5 fotos para la incidencia.");
        input.value = '';
        return;
    }
    
    // Deshabilitar botón de enviar mientras se sube
    if (submitBtn) {
        submitBtn.disabled = true;
    }
    
    for (const file of files) {
        // Crear contenedor local instantáneo
        const wrapper = document.createElement('div');
        wrapper.className = 'local-thumb-wrapper';
        wrapper.style.cssText = 'position: relative; width: 80px; height: 80px; border-radius: 8px; overflow: hidden; border: 2px solid var(--mi-orange); background: #333; display: flex; align-items: center; justify-content: center;';
        
        // Crear objeto URL local instantáneo
        const localUrl = URL.createObjectURL(file);
        
        wrapper.innerHTML = `
            <img src="${localUrl}" style="width: 100%; height: 100%; object-fit: cover; filter: blur(1px) brightness(0.6);">
            <div class="thumb-loader" style="position: absolute; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #fff;">
                <i class="fa fa-spinner fa-spin" style="font-size: 1.5rem; margin-bottom: 4px;"></i>
                <span style="font-size: 9px; font-weight: bold; text-transform: uppercase;">Subiendo</span>
            </div>
        `;
        container.appendChild(wrapper);
        
        try {
            const isImg = file.type && file.type.startsWith('image/');
            const ext = isImg ? 'jpg' : (file.name.split('.').pop().toLowerCase() || 'bin');
            const base64 = await window.getCompressedBase64(file);
            const userRaw = (APP_CONFIG.currentUser?.email || APP_CONFIG.currentUser?.usuario) || 'Usuario';
            const userClean = String(userRaw).split('@')[0].trim().toUpperCase().replace(/[^A-Z0-9]/g, '_');
            const storeRaw = APP_CONFIG.currentReport?.centro || 'Tienda';
            const storeClean = String(storeRaw).trim().toUpperCase().replace(/[^A-Z0-9]/g, '_');
            const dateStr = new Date().toISOString().slice(0, 10);
            const shortTime = Date.now().toString().slice(-4);
            const customFileName = `${userClean}_${storeClean}_${dateStr}_INCIDENCIA_${shortTime}.${ext}`;

            const uploadRes = await callApi({
                action: 'uploadFile',
                fileName: customFileName,
                mimeType: isImg ? 'image/jpeg' : (file.type || 'image/jpeg'),
                base64: base64
            });
            
            if (uploadRes && uploadRes.url) {
                APP_CONFIG.incidentUploadedPhotos.push(uploadRes.url);
                wrapper.classList.add('uploaded');
                wrapper.dataset.url = uploadRes.url;
                wrapper.style.borderColor = '#2ecc71';
                
                // Actualizar thumbnail con icono de borrado y éxito
                wrapper.innerHTML = `
                    <img src="${localUrl}" style="width: 100%; height: 100%; object-fit: cover;">
                    <div style="position: absolute; top: 2px; right: 2px; background: rgba(46, 204, 113, 0.9); color: #fff; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px;">
                        <i class="fa fa-check"></i>
                    </div>
                    <button type="button" class="delete-thumb-btn" style="position: absolute; bottom: 0; left: 0; width: 100%; background: rgba(231, 76, 60, 0.85); color: #fff; border: none; font-size: 10px; padding: 2px 0; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <i class="fa fa-trash"></i> Borrar
                    </button>
                `;
                
                // Agregar acción de borrar
                wrapper.querySelector('.delete-thumb-btn').onclick = () => {
                    APP_CONFIG.incidentUploadedPhotos = APP_CONFIG.incidentUploadedPhotos.filter(url => url !== uploadRes.url);
                    wrapper.remove();
                    updateSubmitState();
                };
            } else {
                throw new Error(uploadRes ? (uploadRes.error || uploadRes.message || "No URL returned") : "No response from server");
            }
        } catch (e) {
            console.error('Error uploading incident photo:', e);
            wrapper.style.borderColor = '#e74c3c';
            wrapper.innerHTML = `
                <img src="${localUrl}" style="width: 100%; height: 100%; object-fit: cover; filter: grayscale(1) brightness(0.5);">
                <div style="position: absolute; color: #fff; text-align: center; font-size: 9px; padding: 4px; font-weight: bold;">
                    <i class="fa fa-exclamation-triangle" style="font-size: 1.2rem; color: #e74c3c; margin-bottom: 2px;"></i><br>Error
                </div>
                <button type="button" class="delete-thumb-btn" style="position: absolute; bottom: 0; left: 0; width: 100%; background: rgba(51, 51, 51, 0.9); color: #fff; border: none; font-size: 10px; padding: 2px 0; cursor: pointer;">
                    <i class="fa fa-trash"></i> Quitar
                </button>
            `;
            wrapper.querySelector('.delete-thumb-btn').onclick = () => {
                wrapper.remove();
                updateSubmitState();
            };
        }
    }
    
    input.value = '';
    updateSubmitState();
    
    function updateSubmitState() {
        const remainingUploads = container.querySelectorAll('.local-thumb-wrapper:not(.uploaded)').length;
        if (submitBtn) {
            submitBtn.disabled = (remainingUploads > 0);
        }
    }
}

async function submitFinalReport(event, type) {
    event.preventDefault();
    const form = event.target;
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    const descEl = form.querySelector('.rep-desc');
    const desc = descEl ? descEl.value.trim() : '';
    const enviarSelect = form.querySelector('.rep-enviar');
    const enviarVal = enviarSelect ? enviarSelect.value : '';

    const isFurniture = type === 'furniture';
    const isScreen = type === 'screen';
    const isLona = type === 'lona';
    
    let reportCategory = 'Dispositivo';
    if (isFurniture) reportCategory = 'Mobiliario';
    if (isScreen) reportCategory = 'Pantalla Digital';
    if (isLona) reportCategory = 'Lonas';

    // Validate Alarmado inputs if furniture
    if (isFurniture) {
        const isAlarmado = APP_CONFIG.currentReport.path[2] === 'Alarmado';
        if (isAlarmado) {
            const modVal = document.getElementById('furn-rep-modelo').value;
            const cantVal = document.getElementById('furn-rep-cantidad').value;
            if (!modVal || !cantVal || parseInt(cantVal) < 1) {
                alert('Por favor, seleccione un modelo y una cantidad válida para el alarmado.');
                return;
            }
        }
    }
    
    if (APP_CONFIG.incidentUploadedPhotos.length === 0) {
        let zoneId = `drop-zone-${type}`;
        const zone = document.getElementById(zoneId);
        if (zone) {
            zone.style.border = '2px dashed #ff4d4f';
            zone.style.boxShadow = '0 0 12px rgba(255,77,79,0.4)';
            zone.style.background = '#fffafa';
            zone.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
                zone.style.border = '2px dashed var(--mi-border)';
                zone.style.boxShadow = 'none';
                zone.style.background = '#f9f9f9';
            }, 4000);
        }
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Enviando...';

    // Obligar a que el comentario descriptivo no esté vacío
    if (!desc) {
        if (descEl) {
            descEl.style.border = '2px dashed #ff4d4f';
            descEl.style.boxShadow = '0 0 12px rgba(255,77,79,0.4)';
            descEl.style.background = '#fffafa';
            descEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
                descEl.style.border = '1px solid var(--mi-border)';
                descEl.style.boxShadow = 'none';
                descEl.style.background = '#ffffff';
            }, 4000);
        }
        btn.disabled = false;
        btn.textContent = originalText;
        alert('Por favor, escribe un comentario descriptivo para la incidencia.');
        return;
    }

    try {
        const storeSelect = document.getElementById('incident-centro');
        const selectedOption = storeSelect.options[storeSelect.selectedIndex];
        const storeOwner = selectedOption ? selectedOption.dataset.owner || '' : '';

        const reportData = {
            action: 'submitReport',
            usuario: (APP_CONFIG.currentUser.email || APP_CONFIG.currentUser.usuario),
            tienda: APP_CONFIG.currentReport.centro,
            owner: storeOwner,
            categoria: reportCategory,
            subcategoria: APP_CONFIG.currentReport.path[1] || '',
            motivo: isFurniture ? (APP_CONFIG.currentReport.path[2] || '') : (isScreen ? (APP_CONFIG.currentReport.path[2] || '') : (APP_CONFIG.currentReport.path[3] || '')),
            descripcion: desc,
            enviar: enviarVal,
            photos: APP_CONFIG.incidentUploadedPhotos,
            estado: isFurniture ? 'Abierta' : 'Pendiente',
            updateId: window.editingIncidentId || APP_CONFIG.currentReport.updateId || null
        };
        
        if (isFurniture) {
            const isAlarmado = APP_CONFIG.currentReport.path[2] === 'ALARMADO';
            if (isAlarmado) {
                if (APP_CONFIG.currentSelectedAlarmados.length === 0) {
                    const box = document.getElementById('furniture-alarmado-fields');
                    if (box) {
                        box.style.border = '2px solid #ff4d4f';
                        box.style.boxShadow = '0 0 12px rgba(255,77,79,0.4)';
                        box.style.transition = 'all 0.3s ease';
                        box.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        setTimeout(() => {
                            box.style.border = '1px solid var(--mi-border)';
                            box.style.boxShadow = 'none';
                        }, 4000);
                    }
                    btn.disabled = false;
                    btn.textContent = originalText;
                    return;
                }
                reportData.dispositivos = APP_CONFIG.currentSelectedAlarmados;
            } else {
                reportData.modelo = '';
                reportData.codigoDispositivo = '';
                reportData.cantidad = '';
            }

            const enviarSelect = form.querySelector('.rep-enviar');
            if (!enviarSelect || !enviarSelect.value) {
                if (enviarSelect) {
                    enviarSelect.style.border = '2px solid #ff4d4f';
                    enviarSelect.style.boxShadow = '0 0 10px rgba(255,77,79,0.3)';
                    enviarSelect.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    enviarSelect.focus();
                    setTimeout(() => {
                        enviarSelect.style.border = '1px solid var(--mi-border)';
                        enviarSelect.style.boxShadow = 'none';
                    }, 4000);
                }
                btn.disabled = false;
                btn.textContent = originalText;
                return;
            }
            reportData.subcategoria = APP_CONFIG.currentReport.path[1] || '';
            reportData.motivo = APP_CONFIG.currentReport.path[2] || '';
            reportData.enviar = enviarSelect.value;

            // SEGURIDAD EXTREMA: Validar Subcategoría de Mobiliario
            if (!reportData.subcategoria) {
                const box = document.getElementById('furniture-l2');
                if (box) {
                    box.style.border = '2px solid #ff4d4f';
                    box.style.borderRadius = '10px';
                    box.style.padding = '12px';
                    box.style.boxShadow = '0 0 15px rgba(255,77,79,0.35)';
                    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => { box.style.border = 'none'; box.style.boxShadow = 'none'; box.style.padding = '0'; }, 5000);
                }
                btn.disabled = false;
                btn.textContent = originalText;
                return alert('Falta Información: Por favor, indica la subcategoría del mobiliario.');
            }
            
            // SEGURIDAD EXTREMA: Validar Motivo detallado de Mobiliario
            if (!reportData.motivo) {
                const box = document.getElementById('furniture-l3');
                if (box) {
                    box.style.border = '2px solid #ff4d4f';
                    box.style.borderRadius = '10px';
                    box.style.padding = '12px';
                    box.style.boxShadow = '0 0 15px rgba(255,77,79,0.35)';
                    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => { box.style.border = 'none'; box.style.boxShadow = 'none'; box.style.padding = '0'; }, 5000);
                }
                btn.disabled = false;
                btn.textContent = originalText;
                return alert('Falta Información: Por favor, indica el MOTIVO concreto del desperfecto.');
            }
        } else if (isScreen) {
            // Pantalla category just needs description and photos, which are already validated.
            // No sub-categories or reasons required.
            reportData.subcategoria = '';
            reportData.motivo = '';
        } else if (isLona) {
            if (APP_CONFIG.currentSelectedLonas.length === 0) {
                const box = document.getElementById('lona-models-box');
                if (box) {
                    box.style.border = '2px solid #ff4d4f';
                    box.style.boxShadow = '0 0 12px rgba(255,77,79,0.4)';
                    box.style.transition = 'all 0.3s ease';
                    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => {
                        box.style.border = '1px solid var(--mi-border)';
                        box.style.boxShadow = 'none';
                    }, 4000);
                }
                btn.disabled = false;
                btn.textContent = originalText;
                return;
            }
            const enviarSelect = form.querySelector('.rep-enviar');
            if (!enviarSelect || !enviarSelect.value) {
                if (enviarSelect) {
                    enviarSelect.style.border = '2px solid #ff4d4f';
                    enviarSelect.style.boxShadow = '0 0 10px rgba(255,77,79,0.3)';
                    enviarSelect.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    enviarSelect.focus();
                    setTimeout(() => {
                        enviarSelect.style.border = '1px solid var(--mi-border)';
                        enviarSelect.style.boxShadow = 'none';
                    }, 4000);
                }
                btn.disabled = false;
                btn.textContent = originalText;
                return;
            }

            reportData.tipologia = APP_CONFIG.currentReport.path[1] || '';
            reportData.motivo = APP_CONFIG.currentReport.path[2] || ''; 
            reportData.enviar = enviarSelect.value; 
            reportData.dispositivos = APP_CONFIG.currentSelectedLonas;
        } else {
            // Para Dispositivos
            if (APP_CONFIG.currentSelectedDevices.length === 0) {
                const box = document.getElementById('device-models-box');
                if (box) {
                    box.style.border = '2px solid #ff4d4f';
                    box.style.boxShadow = '0 0 12px rgba(255,77,79,0.4)';
                    box.style.transition = 'all 0.3s ease';
                    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => {
                        box.style.border = '1px solid var(--mi-border)';
                        box.style.boxShadow = 'none';
                    }, 4000);
                }
                btn.disabled = false;
                btn.textContent = originalText;
                return;
            }
            const enviarSelect = form.querySelector('.rep-enviar');
            if (!enviarSelect || !enviarSelect.value) {
                if (enviarSelect) {
                    enviarSelect.style.border = '2px solid #ff4d4f';
                    enviarSelect.style.boxShadow = '0 0 10px rgba(255,77,79,0.3)';
                    enviarSelect.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    enviarSelect.focus();
                    setTimeout(() => {
                        enviarSelect.style.border = '1px solid var(--mi-border)';
                        enviarSelect.style.boxShadow = 'none';
                    }, 4000);
                }
                btn.disabled = false;
                btn.textContent = originalText;
                return;
            }

            reportData.tipologia = APP_CONFIG.currentReport.path[1] || '';
            reportData.subcategoria = APP_CONFIG.currentReport.path[2] || ''; 
            reportData.motivo = APP_CONFIG.currentReport.path[3] || ''; 
            reportData.enviar = enviarSelect.value; 
            reportData.dispositivos = APP_CONFIG.currentSelectedDevices;

            // SEGURIDAD EXTREMA: Validar Tipología del Dispositivo
            if (!reportData.tipologia) {
                const box = document.getElementById('device-l2');
                if (box) {
                    box.style.border = '2px solid #ff4d4f'; box.style.borderRadius = '10px'; box.style.padding = '12px'; box.style.boxShadow = '0 0 15px rgba(255,77,79,0.35)';
                    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => { box.style.border = 'none'; box.style.boxShadow = 'none'; box.style.padding = '0'; }, 5000);
                }
                btn.disabled = false; btn.textContent = originalText;
                return alert('Falta Información: Por favor, selecciona la TIPOLOGÍA del dispositivo.');
            }

            // SEGURIDAD EXTREMA: Validar Subcategoría de Dispositivo
            if (!reportData.subcategoria) {
                const box = document.getElementById('device-l3');
                if (box) {
                    box.style.border = '2px solid #ff4d4f'; box.style.borderRadius = '10px'; box.style.padding = '12px'; box.style.boxShadow = '0 0 15px rgba(255,77,79,0.35)';
                    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => { box.style.border = 'none'; box.style.boxShadow = 'none'; box.style.padding = '0'; }, 5000);
                }
                btn.disabled = false; btn.textContent = originalText;
                return alert('Falta Información: Por favor, selecciona la SUB-FAMILIA o Familia del dispositivo.');
            }

            // SEGURIDAD EXTREMA: Validar Motivo detallado de Dispositivo
            if (!reportData.motivo) {
                const box = document.getElementById('device-l4');
                if (box) {
                    box.style.border = '2px solid #ff4d4f'; box.style.borderRadius = '10px'; box.style.padding = '12px'; box.style.boxShadow = '0 0 15px rgba(255,77,79,0.35)';
                    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => { box.style.border = 'none'; box.style.boxShadow = 'none'; box.style.padding = '0'; }, 5000);
                }
                btn.disabled = false; btn.textContent = originalText;
                return alert('Falta Información: Por favor, indica el MOTIVO concreto de la incidencia.');
            }
        }

        const res = await callApi(reportData);
        if (res && res.success) {
            setTimeout(async () => {
                try {
                    const uRes = await callApi({ 
                        action: 'getMessagingUsers',
                        email: APP_CONFIG.currentUser?.email || APP_CONFIG.currentUser?.usuario,
                        token: APP_CONFIG.currentUser?.token
                    });
                    if (uRes && uRes.users) {
                        const admins = uRes.users.filter(u => String(u.rol || '').trim().toUpperCase().includes('ADMIN'));
                        const nombreUsu = APP_CONFIG.currentUser?.nombre || APP_CONFIG.currentUser?.usuario || 'Un usuario';
                        const tiend = reportData.tienda || 'una tienda';
                        const cat = reportData.categoria || 'Incidencia';
                        for (const admin of admins) {
                            const adminEmail = admin.email || admin.usuario;
                            if (adminEmail) {
                                callApi({
                                    action: 'sendMessage',
                                    remitente: 'Sistema',
                                    destinatario: adminEmail,
                                    mensaje: 'NUEVA INCIDENCIA ABIERTA: ' + nombreUsu + ' acaba de abrir un reporte de ' + cat + ' en ' + tiend + '. Por favor, revisalo para responder lo antes posible.'
                                });
                            }
                        }
                    }
                } catch(e) { console.error('Error al notificar admins', e); }
            }, 500);
        }
        if (res && res.success) {
            alert('Reporte guardado con éxito');
            resetProcedure();
            loadDashboard(); // Actualiza el historial visualmente en tiempo real
            // Vuelve abajo para ver el historial insertado
            const tableEl = document.getElementById('dashboard-table-title');
            if (tableEl) tableEl.scrollIntoView({ behavior: 'smooth' });
        } else {
            alert('Error al guardar: ' + (res.message || 'Error desconocido'));
        }
    } catch (err) {
        console.error('Error:', err);
        alert('Error al enviar reporte');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

function resetProcedure(preserveStoreContext = false) {
    // Guardamos el centro antes de limpiar si así lo solicitan (para cambios de categoría sin perder la tienda)
    const storedCentro = APP_CONFIG.currentReport?.centro || '';
    
    APP_CONFIG.currentReport = { 
        category: '', 
        centro: preserveStoreContext ? storedCentro : '', 
        path: [] 
    };

    // Reset notes/inputs
    document.querySelectorAll('.rep-desc').forEach(el => el.value = '');
    
    const submitBtn = document.getElementById('dash-submit-btn');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Confirmar y Enviar Reporte';
    }
    
    APP_CONFIG.incidentUploadedPhotos = [];
    APP_CONFIG.currentSelectedDevices = []; // Reset de buffer temporal
    APP_CONFIG.currentSelectedLonas = [];
    APP_CONFIG.currentSelectedAlarmados = [];
    
    // Limpiar miniaturas
    document.querySelectorAll('.thumbnail-container').forEach(c => c.innerHTML = '');

    // NUEVO: Limpiar automáticamente el modo edición si estaba activo
    if (!preserveStoreContext) {
        window.editingIncidentId = null;
        const banner = document.getElementById('editing-mode-banner');
        if (banner) {
            banner.style.display = 'none';
            banner.classList.add('hidden');
        }
    }
    
    // Limpiar listado de dispositivos dinámicos
    const listContainer = document.getElementById('device-selected-list');
    if (listContainer) {
        listContainer.innerHTML = '<p id="no-devices-msg" style="font-style: italic; color: #999; margin: 0; font-size: 12px;">Ningún modelo añadido aún.</p>';
    }
    
    const lonaListContainer = document.getElementById('lona-selected-list');
    if (lonaListContainer) {
        lonaListContainer.innerHTML = '<p id="no-lonas-msg" style="font-style: italic; color: #999; margin: 0; font-size: 12px;">Ningún modelo añadido aún.</p>';
    }
    
    const alarmadoListContainer = document.getElementById('furn-alarmado-selected-list');
    if (alarmadoListContainer) {
        alarmadoListContainer.innerHTML = '<p id="no-alarmados-msg" style="font-style: italic; color: #999; margin: 0; font-size: 11px;">Ningún modelo añadido aún.</p>';
    }
    
    // Reset all selects and hide boxes (Excluyendo cuenta y tienda si preservamos contexto)
    document.querySelectorAll('.sub-view select').forEach(s => {
        if (preserveStoreContext && (s.id === 'incident-cuenta' || s.id === 'incident-centro')) return;
        s.selectedIndex = 0;
    });
    
    // SOLO ocultamos la selección de categoría si es un reset FULL (ej: enviar reporte)
    if (!preserveStoreContext) {
        document.getElementById('category-selection')?.classList.add('hidden');
    }
    
    document.getElementById('furniture-procedure')?.classList.add('hidden');
    document.getElementById('device-procedure')?.classList.add('hidden');
    document.getElementById('device-models-box')?.classList.add('hidden');
    const customInp = document.getElementById('device-selector-custom');
    if (customInp) {
        customInp.value = '';
        customInp.classList.add('hidden');
    }
    document.getElementById('device-selector-dropdown')?.classList.remove('hidden');
    document.querySelectorAll('[id^="final-level-"]').forEach(f => f.classList.add('hidden'));
    
    // Hide all dynamic levels
    document.querySelectorAll('.level-box[data-level]').forEach(box => {
        if (box.id !== 'category-selection') {
            box.classList.add('hidden');
        }
    });
    
    document.querySelectorAll('.bubble-btn').forEach(btn => btn.classList.remove('active'));
    
    // Protección formularios
    if (!preserveStoreContext) {
        document.querySelectorAll('form').forEach(f => f.reset());
    } else {
        // Resetear formularios de procedimientos internos, no los selectores raíz
        document.querySelectorAll('#furniture-procedure form, #device-procedure form').forEach(f => f.reset());
    }
}

// --- API Communication ---
// --- API Communication (Híbrido robusto compatible con ejecución local file://) ---
async function callApi(data) {
    if (!APP_CONFIG.scriptUrl) {
        console.warn('Apps Script URL not set. Returning mock data.');
        return mockApi(data);
    }

    const isRead = !['submitReport', 'uploadFile', 'submitLaunchChecklist', 'login', 'resolveIncident', 'deleteReport', 'sendMessage', 'markMessageRead', 'markAllMessagesRead', 'deleteLaunchValidation', 'updateLaunchValidation', 'getMessages'].includes(data.action);

    if (isRead) {
        // ESTRATEGIA HÍBRIDA INTELIGENTE V5
        // 1º Intentamos FETCH NATIVO (Garantizado en http://localhost:8080 o servidores reales)
        try {
            let queryUrl = APP_CONFIG.scriptUrl + (APP_CONFIG.scriptUrl.includes('?') ? '&' : '?');
            const queryParams = [];
            for (let key in data) {
                queryParams.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
            }
            // Cache Buster para forzar lectura real sin dependencias de CDNs intermedias
            queryParams.push('_nocache=' + Date.now());
            const fullUrl = queryUrl + queryParams.join('&');

            console.log('📡 Probando Fetch Nativo ->', data.action);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 45000); 
            
            const response = await fetch(fullUrl, { 
                method: 'GET',
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const responseText = await response.text();
                // Si devuelve JSON crudo, lo parseamos y triunfamos instantáneamente!
                if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
                    console.log('? FETCH NATIVO EXITOSO - Omitiendo rescate JSONP.');
                    return JSON.parse(responseText);
                }
            }
            throw new Error('Formato de respuesta desconocido');
        } catch (fetchErr) {
            console.warn('⚠️ Fetch nativo fallido (posible file://). Iniciando Rescate JSONP...', fetchErr.message);
            
            // MODO RESCATE: JSONP clásico (El único que a veces funciona desde file:// local)
            return new Promise((resolve, reject) => {
                const callbackName = 'jsonp_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
                const script = document.createElement('script');
                script.type = 'text/javascript';
                script.async = true;
                script.referrerPolicy = 'no-referrer'; 
                
                window[callbackName] = function(response) {
                    cleanup();
                    resolve(response);
                };

                const cleanup = () => {
                    if (script.parentNode) script.parentNode.removeChild(script);
                    delete window[callbackName];
                };

                script.onerror = (e) => {
                    cleanup();
                    console.error("⛔ ERROR CRÍTICO ABSOLUTO (Fetch + JSONP Fallidos):", e);
                    reject(new Error('Bloqueo total de red local'));
                };

                let url = APP_CONFIG.scriptUrl + (APP_CONFIG.scriptUrl.includes('?') ? '&' : '?');
                const params = [];
                for (let key in data) {
                    params.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
                }
                params.push('callback=' + callbackName);
                params.push('_nocache=' + Date.now()); // Evitar cacheo de la etiqueta de script
                
                script.src = url + params.join('&');
                document.body.appendChild(script);

                // Prevención de colgado eterno
                setTimeout(() => {
                    if (window[callbackName]) {
                        cleanup();
                        reject(new Error('Timeout absoluto en rescate JSONP'));
                    }
                }, 15000);
            });
        }
    }

    // Rutas de escritura/mutación (POST) - Funcionan 100% si el login funcionó
    try {
        const response = await fetch(APP_CONFIG.scriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(data)
        });
        return await response.json();
    } catch (err) {
        console.error('Error de comunicación POST:', err);
        return { success: false, message: err.message };
    }
}


function populateDashboardFilters(reports) {
    const cuentas = new Set();
    const tiendas = new Set();
    const usuarios = new Set();

    reports.forEach(r => {
        if (r.cuenta) cuentas.add(r.cuenta);
        if (r.tienda) tiendas.add(r.tienda);
        if (r.usuario) usuarios.add(r.usuario);
    });

    fillSelect('filter-cuenta', cuentas, 'Todas las cuentas');
    fillSelect('filter-tienda', tiendas, 'Todas las tiendas');
    fillSelect('filter-usuario', usuarios, 'Todos los usuarios');
}

function fillSelect(id, set, defaultText) {
    const select = document.getElementById(id);
    if (!select) return;
    select.innerHTML = `<option value="all">${defaultText}</option>`;
    [...set].sort().forEach(item => {
        const opt = document.createElement('option');
        opt.value = item;
        opt.textContent = item;
        select.appendChild(opt);
    });
}

// Duplicate filterDashboardTable removed.

async function loadLaunches() {
    const selector = document.getElementById('launch-selector');
    
    // OPTIMIZACIÓN: Reusar caché si existe
    let launches = APP_CONFIG.launches;
    if (!launches || launches.length === 0) {
        launches = await callApi({ action: 'getLaunches' });
        APP_CONFIG.launches = launches;
    }
    
    if (selector) selector.innerHTML = '';
    
    if (!launches || launches.length === 0) {
        return;
    }

    APP_CONFIG.launches = launches;

    const now = new Date();
    let closestLaunch = null;
    let minDiff = Infinity;

    launches.forEach(launch => {
        const keys = Object.keys(launch);
        let pKey = keys.find(k => k.toLowerCase().includes('producto') || k.toLowerCase().includes('nombre') || k.toLowerCase().includes('dispositivo'));
        if (!pKey && keys.length > 0) pKey = keys[0];
        const prodName = pKey ? String(launch[pKey]) : 'Sin nombre';
        
        // Búsqueda dinámica de la fecha de lanzamiento / activación
        let dateInfo = '';
        let dateObj = null;
        const dateKey = Object.keys(launch).find(k => k.toLowerCase().includes('fecha') || k.toLowerCase().includes('inicio') || k.toLowerCase().includes('activación') || k.toLowerCase().includes('date'));
        
        if (dateKey && launch[dateKey]) {
            let rawDate = String(launch[dateKey]).trim();
            if (rawDate.includes('T')) {
                const datePart = rawDate.split('T')[0];
                const [y, m, d] = datePart.split('-').map(Number);
                dateInfo = `${d.toString().padStart(2, '0')}/${m.toString().padStart(2, '0')}/${y}`;
                dateObj = new Date(y, m - 1, d);
            } else {
                dateInfo = rawDate;
                // Intentar parsear fecha simple
                const parts = rawDate.split(/[\/\-]/);
                if (parts.length === 3) {
                    if (parts[0].length === 4) dateObj = new Date(parts[0], parts[1]-1, parts[2]);
                    else dateObj = new Date(parts[2], parts[1]-1, parts[0]);
                }
            }
        }
        
        launch._prodName = prodName;
        launch._fechaParsed = dateInfo;
        launch._dateObj = dateObj;

        // Calcular el más cercano (hacia el futuro o el más reciente pasado)
        if (dateObj) {
            const diff = Math.abs(dateObj - now);
            if (diff < minDiff) {
                minDiff = diff;
                closestLaunch = launch;
            }
        }

        // Popula el selector de filtrado
        if (selector) {
            const opt = document.createElement('option');
            opt.value = prodName;
            opt.textContent = prodName; // Solo el nombre, sin la fecha
            selector.appendChild(opt);
        }
    });

    // Auto-seleccionar el lanzamiento más cercano si existe
    if (closestLaunch && selector) {
        selector.value = closestLaunch._prodName;
    }
}

window.loadMaterials = async function() {};

async function loadMaterials() {
    // La pestaña de materiales ahora es estática en index.html
    // No se realizan llamadas al backend
}

function renderMaterialsToContainer(materials, container) {
    // Obsoleto
}

// updateRecentTable removed.

// --- Launch Procedure Logic ---
APP_CONFIG.launchUploadedPhotos = [];
APP_CONFIG.launchIncidentPath = [];
APP_CONFIG.currentLaunchStore = null;

window.updateLaunchCascade = function() {
    const launchVal = document.getElementById('launch-selector')?.value || 'all';
    const cSelect = document.getElementById('launch-cuenta-selector');
    
    if (launchVal === 'all') {
        if (cSelect) {
            cSelect.disabled = true;
            cSelect.innerHTML = '<option value="all">Primero elige producto</option>';
        }
        loadLaunchStores();
        return;
    }

    if (cSelect) cSelect.disabled = false;
    
    let tiendas = APP_CONFIG.currentUser ? (APP_CONFIG.currentUser.tiendas || []) : [];

    // First filter by launch
    if (launchVal !== 'all' && APP_CONFIG.launches) {
        const launch = APP_CONFIG.launches.find(l => {
            const keys = Object.keys(l);
            let pKey = keys.find(k => k.toLowerCase().includes('producto') || k.toLowerCase().includes('nombre') || k.toLowerCase().includes('dispositivo'));
            if (!pKey && keys.length > 0) pKey = keys[0]; // Fallback to Column A
            const pVal = pKey ? String(l[pKey]) : '';
            return pVal && pVal.trim().toLowerCase() === launchVal.trim().toLowerCase();
        });
        
        if (launch) {
            const keys = Object.keys(launch);
            let cKey = keys.find(k => k.toLowerCase().includes('cuenta') || k.toLowerCase().includes('cuentas'));
            if (!cKey && keys.length > 1) cKey = keys[1]; // Fallback to Column B
            
            const cuentaVal = cKey ? String(launch[cKey]) : '';
            if (cuentaVal) {
                const allowedAccounts = String(cuentaVal).split(',').map(s => s.trim().toLowerCase());
                tiendas = tiendas.filter(t => t.cuenta && allowedAccounts.includes(t.cuenta.toLowerCase()));
            }
        }
    }

    // Based on filtered tiendas, update Cuenta dropdown
    const filteredAccounts = [...new Set(tiendas.map(t => t.cuenta).filter(Boolean))];

    if (cSelect) {
        cSelect.innerHTML = '<option value="all">Todas las cuentas</option>';
        filteredAccounts.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c;
            opt.textContent = c;
            cSelect.appendChild(opt);
        });
    }

    loadLaunchStores();
};

window.updateLaunchStoresByCascade = function() {
    loadLaunchStores();
};

window.loadLaunchStores = async function() {
    const grid = document.getElementById('launch-store-grid');
    if (!grid) return;
    
    grid.innerHTML = '<p>Cargando estados...</p>';
    
    try {
        const launchFilter = document.getElementById('launch-selector')?.value || 'all';
        const isAdmin = String(APP_CONFIG.currentUser.rol || '').trim().toUpperCase() === 'ADMIN' || 
                        String(APP_CONFIG.currentUser.rol || '').trim().toUpperCase() === 'ADMINISTRADOR';
        
        const res = await callApi({ 
            action: 'getLaunchStatuses', 
            usuario: isAdmin ? '' : (APP_CONFIG.currentUser.email || APP_CONFIG.currentUser.usuario),
            lanzamiento: launchFilter === 'all' ? '' : launchFilter
        });
        const statuses = (res && res.statuses) ? res.statuses : {};
        
        const myStores = APP_CONFIG.currentUser.tiendas || [];
        let tiendas = [];
        
        // 1. Obtener las tiendas permitidas según APP_CONFIG.launches (cruzando con myStores)
        if (APP_CONFIG.launches && APP_CONFIG.launches.length > 0) {
            const allAllowedStores = new Set();
            const allAllowedAccounts = new Set();
            let hasAtLeastOneFilter = false;
            
            const sel = document.getElementById('launch-selector');
            const launchName = sel ? sel.value : '';
            
            // Filtramos los lanzamientos para coger SOLO el seleccionado
            let currentLaunches = APP_CONFIG.launches;
            if (launchName && launchName !== 'all') {
                currentLaunches = APP_CONFIG.launches.filter(l => {
                    const keys = Object.keys(l);
                    const nameKey = keys.find(k => k.toLowerCase().includes('producto') || k.toLowerCase().includes('lanzamiento') || k.toLowerCase() === 'col0' || k.toLowerCase() === 'nombre');
                    if (nameKey) {
                        return String(l[nameKey]).trim().toLowerCase() === String(launchName).trim().toLowerCase();
                    }
                    return false;
                });
            }
            
            currentLaunches.forEach(launch => {
                const keys = Object.keys(launch);
                const tKey = keys.find(k => k.toLowerCase() === 'tienda' || k.toLowerCase() === 'tiendas' || k.toLowerCase() === 'rms');
                const cKey = keys.find(k => k.toLowerCase() === 'cuenta' || k.toLowerCase() === 'cuentas');
                
                if (tKey) {
                    const tiendasVal = String(launch[tKey] || '').trim();
                    if (tiendasVal) {
                        tiendasVal.split(',').forEach(s => allAllowedStores.add(s.trim().toLowerCase()));
                        hasAtLeastOneFilter = true;
                    }
                }
                if (cKey) {
                    const cuentaVal = String(launch[cKey] || '').trim();
                    if (cuentaVal) {
                        cuentaVal.split(',').forEach(s => allAllowedAccounts.add(s.trim().toLowerCase()));
                        hasAtLeastOneFilter = true;
                    }
                }
            });
            
            if (hasAtLeastOneFilter) {
                tiendas = myStores.filter(t => {
                    const nameMatch = t.nombre && allAllowedStores.has(String(t.nombre).trim().toLowerCase());
                    const rmsMatch = t.rms && allAllowedStores.has(String(t.rms).trim().toLowerCase());
                    const accountMatch = t.cuenta && allAllowedAccounts.has(String(t.cuenta).trim().toLowerCase());
                    return nameMatch || rmsMatch || accountMatch;
                });
            }
        }
        
        // 2. Mapear estado desde forms externos y construir el array final
        tiendas = tiendas.map(t => {
            const storeNameKey = Object.keys(statuses).find(k => k.trim().toLowerCase() === String(t.nombre).trim().toLowerCase());
            const estadoActual = storeNameKey ? statuses[storeNameKey].estado : 'Pendiente';
            
            return {
                nombre: t.nombre,
                cuenta: t.cuenta || 'Varias Cuentas',
                usuario: t.usuario || 'Desconocido',
                rms: t.rms || '',
                estado: estadoActual
            };
        });

        // 2. Poblar los selectores dinámicamente si es Admin
        const cuentaSelect = document.getElementById('launch-cuenta-selector');
        const userSelect = document.getElementById('launch-user-selector');
        
        if (isAdmin && cuentaSelect && userSelect) {
            // Guardar valores actuales
            const currCuenta = cuentaSelect.value;
            const currUser = userSelect.value;
            
            const uniqueAccounts = [...new Set(tiendas.map(t => t.cuenta).filter(Boolean))].sort();
            const uniqueUsers = [...new Set(tiendas.map(t => t.usuario).filter(Boolean))].sort();
            
            cuentaSelect.innerHTML = '<option value="all">Todas</option>';
            uniqueAccounts.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c;
                opt.textContent = c;
                cuentaSelect.appendChild(opt);
            });
            cuentaSelect.value = uniqueAccounts.includes(currCuenta) ? currCuenta : 'all';
            
            userSelect.innerHTML = '<option value="all">Todos</option>';
            uniqueUsers.forEach(u => {
                const opt = document.createElement('option');
                opt.value = u;
                opt.textContent = u;
                userSelect.appendChild(opt);
            });
            userSelect.value = uniqueUsers.includes(currUser) ? currUser : 'all';
        }

        // 3. Aplicar los filtros seleccionados
        const cuentaFilter = cuentaSelect?.value || 'all';
        const userFilter = userSelect?.value || 'all';
        
        if (cuentaFilter !== 'all') {
            tiendas = tiendas.filter(t => t.cuenta && t.cuenta.toLowerCase() === cuentaFilter.toLowerCase());
        }
        if (userFilter !== 'all') {
            tiendas = tiendas.filter(t => t.usuario && t.usuario.toLowerCase() === userFilter.toLowerCase());
        }

        const historyGrid = document.getElementById('launch-history-grid');

        grid.innerHTML = '';
        if (historyGrid) historyGrid.innerHTML = '';
        
        if (tiendas.length === 0) {
            grid.innerHTML = '<p>No hay tiendas para este lanzamiento.</p>';
            if (historyGrid) historyGrid.innerHTML = '<p>Sin datos.</p>';
            return;
        }

        let pendingCount = 0;
        let historyCount = 0;

        function normalizeStoreName(name) {
            if (!name) return "";
            return String(name)
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-zA-Z0-9]/g, "")
                .toLowerCase();
        }

        tiendas.forEach(store => {
            const normTarget = normalizeStoreName(store.nombre);
            const sKey = Object.keys(statuses).find(k => normalizeStoreName(k) === normTarget);
            const rawStatusObj = sKey ? statuses[sKey] : null;
            
            // Usamos rawStatusObj.estado porque el script antiguo inyectaba 'estado' en lugar de 'state' desde backend
            let status = rawStatusObj ? (rawStatusObj.estado || rawStatusObj.state || 'Pendiente') : 'Pendiente';
            if (status === 'Realizado') status = 'Realizada'; // normalizar a lo que espera la interfaz
            const thumb = rawStatusObj ? rawStatusObj.thumbnail : '';
            
            const card = document.createElement('div');
            card.className = 'dashboard-card';
            card.style.cursor = 'pointer';
            card.style.overflow = 'hidden';
            card.style.background = '#fff';
            card.style.borderRadius = '12px';
            card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
            card.style.border = '1px solid #f0f0f0';
            card.style.transition = 'transform 0.2s, box-shadow 0.2s';
            
            let badgeHtml = '';
            let cardContent = '';
            
            if (status === 'Realizada') {
                badgeHtml = '<span class="status-badge" style="background: #e6f7ff; color: #1890ff; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; border: 1px solid #91d5ff;"><span class="badge-icon"><i class="fas fa-check-circle" style="color: #52c41a; font-size: 18px;"></i></span><span class="badge-text">? Realizada</span></span>';
                if (thumb) {
                    cardContent = `
                        <div style="width: 100%; height: 80px; overflow: hidden; margin-top: 10px; border-radius: 6px;">
                            <img src="${thumb}" style="width: 100%; height: 100%; object-fit: cover;">
                        </div>
                    `;
                }
            } else if (status === 'Abierta') {
                badgeHtml = '<span class="status-badge" style="background: #fff1f0; color: #f5222d; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; border: 1px solid #ffa39e;"><span class="badge-icon"><i class="fas fa-exclamation-triangle" style="color: #f5222d; font-size: 18px;"></i></span><span class="badge-text">🔴 Abierta</span></span>';
            } else if (status === 'Revisada') {
                badgeHtml = '<span class="status-badge" style="background: #fff7e6; color: #fa8c16; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; border: 1px solid #ffd591;"><span class="badge-icon"><i class="fas fa-eye" style="color: #fa8c16; font-size: 18px;"></i></span><span class="badge-text">🟠 Revisada</span></span>';
            } else if (status === 'Reportada') {
                badgeHtml = '<span class="status-badge" style="background: #feffe6; color: #d4b106; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; border: 1px solid #ffffb8;"><span class="badge-icon"><i class="fas fa-exclamation" style="color: #d4b106; font-size: 18px;"></i></span><span class="badge-text">🟡 Reportada</span></span>';
            } else if (status === 'Cambiada') {
                badgeHtml = '<span class="status-badge" style="background: #f6ffed; color: #52c41a; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; border: 1px solid #b7eb8f;"><span class="badge-icon"><i class="fas fa-sync-alt" style="color: #52c41a; font-size: 18px;"></i></span><span class="badge-text">🟢 Cambiada</span></span>';
            } else {
                badgeHtml = '<span class="status-badge" style="background: #fff1f0; color: #f5222d; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; border: 1px solid #ffa39e;"><span class="badge-icon"><i class="fas fa-exclamation-circle" style="color: #f5222d; font-size: 18px;"></i></span><span class="badge-text">Pendiente</span></span>';
            }
            
            card.innerHTML = `
                <div style="background: #fff5e6; padding: 12px 15px; display: flex; justify-content: space-between; align-items: center; ${cardContent ? 'border-bottom: 1px solid #fce8db;' : ''}">
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <div style="position: relative; width: 32px; height: 32px; border-radius: 50%; background: #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                            <i class="fas fa-store" style="color: var(--mi-orange); font-size: 14px;"></i>
                            <div class="mobile-badge-float" style="position: absolute; top: -6px; right: -6px; z-index: 2;">${badgeHtml}</div>
                        </div>
                        <div>
                            <h3 style="font-size: 14px; margin: 0 0 2px 0; color: #111; font-weight: 800; line-height: 1.2;">${store.nombre}</h3>
                            <p style="font-size: 11px; margin: 0; color: #666; font-weight: 600;">${store.cuenta}</p>
                        </div>
                    </div>
                    <div class="desktop-badge-area">
                        ${badgeHtml}
                    </div>
                </div>
                ${cardContent ? `<div style="padding: 12px 15px;">${cardContent}</div>` : ''}
            `;
            
            card.onclick = () => {
                startLaunchChecklist(store);
            };
            
            if (status === 'Pendiente') {
                grid.appendChild(card);
                pendingCount++;
            } else {
                if (historyGrid) {
                    historyGrid.appendChild(card);
                    historyCount++;
                }
            }
        });

        if (pendingCount === 0) grid.innerHTML = '<p>No hay tiendas pendientes.</p>';
        if (historyGrid && historyCount === 0) historyGrid.innerHTML = '<p>No hay historial de lanzamientos reportados.</p>';
        
        console.log("[DEBUG] Lanzamientos DOM rendered. Pendientes:", pendingCount, "Historial:", historyCount);
        console.log("[DEBUG] Grid HTML (first 200 chars):", grid.innerHTML.substring(0, 200));
        
    } catch (err) {
        console.error(err);
        grid.innerHTML = '<p>Error al cargar las tiendas.</p>';
    }
};

window.startLaunchChecklist = function(storeObj) {
    if (!storeObj) return;
    APP_CONFIG.currentLaunchStore = storeObj;
    
    document.getElementById('launch-store-grid').classList.add('hidden');
    document.getElementById('launch-checklist').classList.remove('hidden');
    
    const isECI = storeObj.cuenta === 'ECI';
    const escGroup = document.getElementById('launch-group-escalerilla');
    const escInput = document.getElementById('launch-q-escalerilla');
    if (escGroup) {
        if (isECI) {
            escGroup.classList.remove('hidden');
            if (escInput) escInput.setAttribute('required', 'true');
        } else {
            escGroup.classList.add('hidden');
            if (escInput) escInput.removeAttribute('required');
        }
    }
    
    document.getElementById('launch-form').reset();
    document.getElementById('launch-checklist-store-title').textContent = storeObj.nombre + ' (' + storeObj.cuenta + ')';
    
    APP_CONFIG.launchUploadedPhotos = [];
    document.getElementById('launch-thumbnails-incident').innerHTML = '';
};

window.toggleLaunchOk = function(isOk) {
    const section2 = document.getElementById('section-tarea-2');
    const details1 = document.getElementById('launch-ok-details');
    
    if (isOk) {
        section2.classList.add('hidden');
        details1.classList.remove('hidden');
    } else {
        section2.classList.remove('hidden');
        details1.classList.add('hidden');
    }
};

window.toggleLaunchIncident = function(isChecked) {
    const section1 = document.getElementById('section-tarea-1');
    const details2 = document.getElementById('launch-incident-details');
    const procedureBox = document.getElementById('launch-device-procedure');
    
    if (isChecked) {
        section1.classList.add('hidden');
        details2.classList.remove('hidden');
        APP_CONFIG.launchIncidentPath = ['Dispositivo'];
        
        // Reset bubble UI inside launch
        procedureBox.querySelectorAll('.bubble-btn').forEach(btn => btn.classList.remove('active'));
        procedureBox.querySelectorAll('.level-box').forEach(box => {
            if (box.dataset.launchLevel === "2") box.classList.remove('hidden');
            else box.classList.add('hidden');
        });
    } else {
        section1.classList.remove('hidden');
        details2.classList.add('hidden');
        APP_CONFIG.launchIncidentPath = [];
    }
};

window.closeLaunchChecklist = function() {
    document.getElementById('launch-form').reset();
    document.getElementById('launch-checklist').classList.add('hidden');
    document.getElementById('launch-store-grid').classList.remove('hidden');
    APP_CONFIG.currentLaunchStore = null;
};

window.selectLaunchLevel = function(level, value) {
    APP_CONFIG.launchIncidentPath = APP_CONFIG.launchIncidentPath.slice(0, level - 1);
    APP_CONFIG.launchIncidentPath[level - 1] = value;

    const procedureBox = document.getElementById('launch-device-procedure');
    const currentBox = procedureBox.querySelector(`.level-box[data-launch-level="${level}"]`);
    
    if (currentBox) {
        currentBox.querySelectorAll('.bubble-btn').forEach(btn => {
            btn.classList.toggle('active', btn.textContent === value);
        });
    }

    // Hide subsequent levels
    procedureBox.querySelectorAll('.level-box').forEach(box => {
        if (parseInt(box.dataset.launchLevel) > level) {
            box.classList.add('hidden');
            box.querySelectorAll('.bubble-btn').forEach(b => b.classList.remove('active'));
        }
    });

    const nextLevel = level + 1;
    const nextBox = procedureBox.querySelector(`.level-box[data-launch-level="${nextLevel}"]`);
    if (nextBox) {
        nextBox.classList.remove('hidden');
        nextBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
};

window.handleLaunchPhotos = async function(input, maxFiles = 99) {
    const container = document.getElementById('launch-thumbnails-incident');
    const submitBtn = document.querySelector('#launch-form button[type="submit"]');
    
    if (!input.files || input.files.length === 0) return;
    
    const files = Array.from(input.files);
    
    // Validar máximo de fotos
    const currentCount = APP_CONFIG.launchUploadedPhotos.length;
    const pendingThumbs = container.querySelectorAll('.local-thumb-wrapper:not(.uploaded)').length;
    if (currentCount + pendingThumbs + files.length > maxFiles) {
        alert(`Solo se permite subir un máximo de ${maxFiles} fotos.`);
        input.value = '';
        return;
    }
    
    // Deshabilitar botón de enviar mientras se sube
    if (submitBtn) {
        submitBtn.disabled = true;
    }
    
    for (const file of files) {
        // Crear contenedor local instantáneo
        const wrapper = document.createElement('div');
        wrapper.className = 'local-thumb-wrapper';
        wrapper.style.cssText = 'position: relative; width: 80px; height: 80px; border-radius: 8px; overflow: hidden; border: 2px solid var(--mi-orange); background: #333; display: flex; align-items: center; justify-content: center;';
        
        // Crear objeto URL local instantáneo
        const localUrl = URL.createObjectURL(file);
        
        wrapper.innerHTML = `
            <img src="${localUrl}" style="width: 100%; height: 100%; object-fit: cover; filter: blur(1px) brightness(0.6);">
            <div class="thumb-loader" style="position: absolute; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #fff;">
                <i class="fa fa-spinner fa-spin" style="font-size: 1.5rem; margin-bottom: 4px;"></i>
                <span style="font-size: 9px; font-weight: bold; text-transform: uppercase;">Subiendo</span>
            </div>
        `;
        container.appendChild(wrapper);
        
        try {
            const isImg = file.type && file.type.startsWith('image/');
            const ext = isImg ? 'jpg' : (file.name.split('.').pop().toLowerCase() || 'bin');
            const base64 = await window.getCompressedBase64(file);
            const userRaw = (APP_CONFIG.currentUser?.email || APP_CONFIG.currentUser?.usuario) || 'Usuario';
            const userClean = String(userRaw).split('@')[0].trim().toUpperCase().replace(/[^A-Z0-9]/g, '_');
            const storeRaw = APP_CONFIG.currentReport?.centro || 'Tienda';
            const storeClean = String(storeRaw).trim().toUpperCase().replace(/[^A-Z0-9]/g, '_');
            const dateStr = new Date().toISOString().slice(0, 10);
            const shortTime = Date.now().toString().slice(-4);
            const customFileName = `${userClean}_${storeClean}_${dateStr}_LANZAMIENTO_${shortTime}.${ext}`;

            const uploadRes = await callApi({
                action: 'uploadFile',
                fileName: customFileName,
                mimeType: isImg ? 'image/jpeg' : (file.type || 'image/jpeg'),
                base64: base64
            });
            
            if (uploadRes && uploadRes.url) {
                APP_CONFIG.launchUploadedPhotos.push(uploadRes.url);
                wrapper.classList.add('uploaded');
                wrapper.dataset.url = uploadRes.url;
                wrapper.style.borderColor = '#2ecc71';
                
                // Actualizar thumbnail con icono de borrado y éxito
                wrapper.innerHTML = `
                    <img src="${localUrl}" style="width: 100%; height: 100%; object-fit: cover;">
                    <div style="position: absolute; top: 2px; right: 2px; background: rgba(46, 204, 113, 0.9); color: #fff; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px;">
                        <i class="fa fa-check"></i>
                    </div>
                    <button type="button" class="delete-thumb-btn" style="position: absolute; bottom: 0; left: 0; width: 100%; background: rgba(231, 76, 60, 0.85); color: #fff; border: none; font-size: 10px; padding: 2px 0; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <i class="fa fa-trash"></i> Borrar
                    </button>
                `;
                
                // Agregar acción de borrar
                wrapper.querySelector('.delete-thumb-btn').onclick = () => {
                    APP_CONFIG.launchUploadedPhotos = APP_CONFIG.launchUploadedPhotos.filter(url => url !== uploadRes.url);
                    wrapper.remove();
                    updateSubmitState();
                };
            } else {
                throw new Error(uploadRes ? (uploadRes.error || uploadRes.message || "No URL returned") : "No response from server");
            }
        } catch (e) {
            console.error('Error uploading launch photo:', e);
            wrapper.style.borderColor = '#e74c3c';
            wrapper.innerHTML = `
                <img src="${localUrl}" style="width: 100%; height: 100%; object-fit: cover; filter: grayscale(1) brightness(0.5);">
                <div style="position: absolute; color: #fff; text-align: center; font-size: 9px; padding: 4px; font-weight: bold;">
                    <i class="fa fa-exclamation-triangle" style="font-size: 1.2rem; color: #e74c3c; margin-bottom: 2px;"></i><br>Error
                </div>
                <button type="button" class="delete-thumb-btn" style="position: absolute; bottom: 0; left: 0; width: 100%; background: rgba(51, 51, 51, 0.9); color: #fff; border: none; font-size: 10px; padding: 2px 0; cursor: pointer;">
                    <i class="fa fa-trash"></i> Quitar
                </button>
            `;
            wrapper.querySelector('.delete-thumb-btn').onclick = () => {
                wrapper.remove();
                updateSubmitState();
            };
        }
    }
    
    input.value = '';
    updateSubmitState();
    
    function updateSubmitState() {
        const remainingUploads = container.querySelectorAll('.local-thumb-wrapper:not(.uploaded)').length;
        if (submitBtn) {
            submitBtn.disabled = (remainingUploads > 0);
        }
    }
};

window.submitLaunch = async function(event) {
    event.preventDefault();
    
    if (APP_CONFIG.launchUploadedPhotos.length === 0) {
        alert("Por favor, sube al menos una foto antes de enviar.");
        return;
    }
    
    const btn = document.getElementById('btn-submit-launch');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

    const isECI = APP_CONFIG.currentLaunchStore.cuenta === 'ECI';

    const reportData = {
        action: 'submitCustomLaunchForm',
        usuario: (APP_CONFIG.currentUser.email || APP_CONFIG.currentUser.usuario),
        cuenta: APP_CONFIG.currentLaunchStore.cuenta,
        tienda: APP_CONFIG.currentLaunchStore.nombre,
        owner: APP_CONFIG.currentLaunchStore.owner || '',
        rms: APP_CONFIG.currentLaunchStore.rms || '',
        lanzamiento: document.getElementById('launch-selector').value,
        photos: APP_CONFIG.launchUploadedPhotos.join('\n'),
        q_lampara: document.getElementById('launch-q-lampara').value,
        q_ldu: document.getElementById('launch-q-ldu').value,
        q_dummy: document.getElementById('launch-q-dummy').value,
        q_eco: document.getElementById('launch-q-eco').value,
        q_filmina: document.getElementById('launch-q-filmina').value,
        q_lonas: document.getElementById('launch-q-lonas').value,
        q_wall: document.getElementById('launch-q-wall').value,
        q_column: document.getElementById('launch-q-column').value,
        q_fichas: document.getElementById('launch-q-fichas').value,
        q_incidencias: document.getElementById('launch-q-incidencias').value || ''
    };
    
    if (isECI) {
        reportData.q_escalerilla = document.getElementById('launch-q-escalerilla').value || '';
    }

    try {
        const res = await callApi(reportData);
        if (res && res.success) {
            setTimeout(async () => {
                try {
                    const uRes = await callApi({ 
                        action: 'getMessagingUsers',
                        email: APP_CONFIG.currentUser?.email || APP_CONFIG.currentUser?.usuario,
                        token: APP_CONFIG.currentUser?.token
                    });
                    if (uRes && uRes.users) {
                        const admins = uRes.users.filter(u => String(u.rol || '').trim().toUpperCase().includes('ADMIN'));
                        const nombreUsu = APP_CONFIG.currentUser?.nombre || APP_CONFIG.currentUser?.usuario || 'Un usuario';
                        const tiend = reportData.tienda || 'una tienda';
                        const cat = reportData.categoria || 'Incidencia';
                        for (const admin of admins) {
                            const adminEmail = admin.email || admin.usuario;
                            if (adminEmail) {
                                callApi({
                                    action: 'sendMessage',
                                    remitente: 'Sistema',
                                    destinatario: adminEmail,
                                    mensaje: 'NUEVA INCIDENCIA ABIERTA: ' + nombreUsu + ' acaba de abrir un reporte de ' + cat + ' en ' + tiend + '. Por favor, revisalo para responder lo antes posible.'
                                });
                            }
                        }
                    }
                } catch(e) { console.error('Error al notificar admins', e); }
            }, 500);
        }
        if (res.success) {
            alert('Formulario de Lanzamiento enviado con éxito.');
            closeLaunchChecklist();
            loadLaunchStores();
        } else {
            alert('Error al guardar: ' + res.message);
        }
    } catch (e) {
        console.error(e);
        alert('Error de conexión al guardar.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// --- Form Handling ---
function setupForms() {
    loginForm.addEventListener('submit', handleLogin);
    
    // Toggle Password Visibility
    const togglePassword = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('login-password');
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function () {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.classList.toggle('fa-eye-slash');
            this.classList.toggle('fa-eye');
        });
    }
}

/* ====================================================
   NUEVAS RUTINAS: GESTIÓN AVANZADA LANZAMIENTOS
   ==================================================== */
window.editValPhotosBuffer = [];

/**
 * Abre la pestaña de lanzamientos y preselecciona la tienda de forma ultra rápida y sin peticiones redundantes
 */
window.quickGoToLaunch = async function(launchName, storeName) {
    // Almacenar objetivos en variables globales temporales para consumo inmediato en showView
    window._pendingQuickLaunch = launchName;
    window._pendingQuickStore = storeName;
    
    // Invocar flujo de enrutado
    await showView('lanzamientos');
};

/**
 * Abre el nuevo modal interactivo de validación en modo VER, EDITAR o RESOLVER
 */
window.openLaunchValidationEditor = function(meta, mode) {
    const modal = document.getElementById('edit-validation-modal');
    if (!modal) return;
    
    // Reset buffers
    window.editValPhotosBuffer = [];
    document.getElementById('edit-val-thumbnails').innerHTML = '';
    document.getElementById('edit-val-photos-input').value = '';
    
    // Setup Title y data
    document.getElementById('edit-val-title').textContent = mode === 'resolve' ? 'Resolver Incidencia Lanzamiento' : (mode === 'edit' ? 'Editar Validación' : 'Detalles del Lanzamiento');
    document.getElementById('edit-val-id').value = meta.id || '';
    document.getElementById('edit-val-store').value = meta.tienda || '';
    document.getElementById('edit-val-mode').value = mode;
    
    document.getElementById('edit-val-tienda-txt').textContent = meta.tienda || '-';
    document.getElementById('edit-val-lanz-txt').textContent = meta.lanzamiento || '-';
    
    const commentBox = document.getElementById('edit-val-comentario');
    commentBox.value = meta.comentario || '';
    commentBox.readOnly = (mode === 'view');
    
    // Current Photos Container
    const currPhotos = document.getElementById('edit-val-current-photos');
    currPhotos.innerHTML = '';
    const photoLabel = document.getElementById('edit-val-photo-label');
    const inputBlock = document.getElementById('edit-val-photos-input');
    const submitBtn = document.getElementById('edit-val-submit-btn');
    
    // Lógica fotos actuales
    if (meta.fotos) {
        const urls = meta.fotos.split(/[\n,]+/).map(u => u.trim()).filter(Boolean);
        if (urls.length > 0) {
            currPhotos.innerHTML = `<p style="font-size:11px; margin:0 0 5px; font-weight:600; color:#666;">Fotografías Actuales:</p>`;
            const grid = document.createElement('div');
            grid.className = 'modal-photo-grid';
            grid.innerHTML = urls.map(u => {
                const final = window.getGoogleDriveThumbnail(u);
                return `<img src="${final}" style="width:60px; height:60px; object-fit:cover; border-radius:4px; cursor:pointer; border:1px solid #ccc;" onclick="window.open('${u}','_blank')" title="Ver original"/>`;
            }).join('');
            currPhotos.appendChild(grid);
        }
    }
    
    // Visibilidad por modo
    if (mode === 'view') {
        inputBlock.style.display = 'none';
        photoLabel.style.display = 'none';
        submitBtn.style.display = 'none';
    } else {
        inputBlock.style.display = 'block';
        photoLabel.style.display = 'block';
        submitBtn.style.display = 'block';
        submitBtn.textContent = mode === 'resolve' ? 'Resolver y Guardar OK' : 'Actualizar Cambios';
        submitBtn.style.background = mode === 'resolve' ? '#2ecc71' : '#ff6700';
    }
    
    modal.style.display = 'flex';
    modal.classList.remove('hidden');
};

window.closeEditValidationModal = function() {
    const modal = document.getElementById('edit-validation-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.add('hidden');
    }
};

/**
 * Sube nuevas fotos desde el modal de edición a Google Drive
 */
window.handleEditValPhotoUpload = async function(input) {
    const files = input.files;
    if (!files || files.length === 0) return;
    
    const msg = document.getElementById('edit-val-upload-msg');
    const btn = document.getElementById('edit-val-submit-btn');
    const container = document.getElementById('edit-val-thumbnails');
    
    msg.style.display = 'inline-block';
    btn.disabled = true;
    
    const tienda = document.getElementById('edit-val-store').value || 'Tienda';
    
    for (let f of files) {
        try {
            const isImg = f.type && f.type.startsWith('image/');
            const base64 = await window.getCompressedBase64(f);
            const userRaw = (APP_CONFIG.currentUser?.email || APP_CONFIG.currentUser?.usuario) || 'Usuario';
            const userClean = String(userRaw).split('@')[0].trim().toUpperCase().replace(/[^A-Z0-9]/g, '_');
            const storeClean = String(tienda).trim().toUpperCase().replace(/[^A-Z0-9]/g, '_');
            const dateStr = new Date().toISOString().slice(0, 10);
            const shortTime = Date.now().toString().slice(-4);
            const ext = isImg ? 'jpg' : (f.name.split('.').pop() || 'bin');
            
            const res = await callApi({
                action: 'uploadFile',
                base64: base64,
                mimeType: isImg ? 'image/jpeg' : (f.type || 'image/jpeg'),
                fileName: `${userClean}_${storeClean}_${dateStr}_LANZAMIENTO_EDIT_${shortTime}.${ext}`
            });
            
            if (res && res.success) {
                window.editValPhotosBuffer.push(res.url);
                const thumb = document.createElement('div');
                thumb.style.cssText = 'width:50px; height:50px; background:#eee; position:relative; border-radius:4px; border:1px solid #2ecc71; overflow:hidden;';
                thumb.innerHTML = `<img src="${window.getGoogleDriveThumbnail(res.url)}" style="width:100%; height:100%; object-fit:cover;">`;
                container.appendChild(thumb);
            }
        } catch (e) {
            console.error(e);
        }
    }
    
    msg.style.display = 'none';
    btn.disabled = false;
};

/**
 * Lanza el submit de edición hacia el backend
 */
window.handleEditValidationSubmit = async function(e) {
    e.preventDefault();
    const btn = document.getElementById('edit-val-submit-btn');
    const id = document.getElementById('edit-val-id').value;
    const mode = document.getElementById('edit-val-mode').value;
    const com = document.getElementById('edit-val-comentario').value;
    
    if (!id) {
        alert("No se puede actualizar un registro sin ID válido.");
        return;
    }

    const original = btn.textContent;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    
    try {
        const payload = {
            action: 'updateLaunchValidation',
            id: id,
            comentario: com
        };
        
        // Si es resolución, forzamos estado a OK
        if (mode === 'resolve') {
            payload.instalacionOk = 'OK';
        }
        
        // Si subió nuevas fotos, enviarlas. 
        // (Unimos el buffer separado por saltos de línea)
        if (window.editValPhotosBuffer.length > 0) {
            payload.fotos = window.editValPhotosBuffer.join('\n');
        }
        
        const res = await callApi(payload);
        if (res && res.success) {
            alert(mode === 'resolve' ? "¡Incidencia resuelta! El estado ha pasado a Realizado." : "Validación actualizada con éxito.");
            window.closeEditValidationModal();
            // Recargar dashboard para ver cambios
            await loadDashboard();
        } else {
            alert("Error al guardar cambios: " + (res.error || "Desconocido"));
        }
    } catch (err) {
        console.error(err);
        alert("Error de conexión.");
    } finally {
        btn.disabled = false;
        btn.textContent = original;
    }
};

/**
 * Elimina validación llamando al backend con confirmación
 */
window.deleteLaunchValidationHandler = async function(id) {
    if (!id) return;
    const conf = await window.showConfirm("¿Eliminar Validación?", "¿Estás seguro de que deseas eliminar este reporte permanentemente? Esta acción borrará la fila del Excel.", true);
    if (!conf) return;
    
    try {
        const res = await callApi({
            action: 'deleteLaunchValidation',
            id: id
        });
        if (res && res.success) {
            alert("Reporte eliminado con éxito.");
            // Recargar vista para refrescar lista modal y stats
            await loadDashboard(); 
            // Cierra modal del historial para forzar la recarga visual de la parrilla si el usuario quiere reabrirlo
            const histModal = document.getElementById('historial-modal');
            if (histModal) histModal.style.display = 'none';
        } else {
            alert("Error al borrar: " + (res.error || "Desconocido"));
        }
    } catch (e) {
        console.error(e);
        alert("Error en comunicación con el servidor.");
    }
};

// Helper local para conversiones a base64 si no existe global
function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}


function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]); // Solo la parte base64
        reader.onerror = error => reject(error);
    });
}
function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}



// Mock API for testing before deployment
function mockApi(data) {
    return new Promise(resolve => {
        setTimeout(() => {
            if (data.action === 'login') {
                resolve({ success: true, user: { nombre: 'Admin Demo', email: 'admin@xiaomi.com', rol: 'admin' } });
            }
            if (data.action === 'getDashboard') {
                resolve({ totalReports: 12, pendingReports: 3, recentReports: [] });
            }
            resolve({ success: true });
        }, 800);
    });
}


window.filterToAllReports = function() { renderDashboardTable(APP_CONFIG.dashboardReports || []); const table = document.getElementById('recent-reports-table'); if (table) table.scrollIntoView({ behavior: 'smooth', block: 'center' }); };
window.filterToIncidents = function() { const list = (APP_CONFIG.dashboardReports || []).filter(r => { const val = String(r.tipo || '').toUpperCase(); return val.includes('DISPOSITIVO') || val.includes('MOBILIARIO') || val.includes('INCIDENCIA') || val.includes('INCIDENTE') || val.includes('LONA') || val.includes('PANTALLA'); }); renderDashboardTable(list); const table = document.getElementById('recent-reports-table'); if (table) table.scrollIntoView({ behavior: 'smooth', block: 'center' }); };

window.openDashboardModal = function(status, category = null) { 
    const modal = document.getElementById('historial-modal'); 
    if (!modal) return; 
    const title = document.getElementById('historial-modal-title'); 
    const filtersEl = document.getElementById('historial-modal-filters');

    APP_CONFIG.currentModalStatus = String(status || '').trim().toLowerCase();
    const isTodos = APP_CONFIG.currentModalStatus === 'all' || APP_CONFIG.currentModalStatus === 'todos';
    
    const baseList = APP_CONFIG.dashboardReports || [];
    APP_CONFIG.currentHistorialItems = baseList;
    APP_CONFIG.currentHistorialIsLanzamientos = false;

    // Filter baseList by status so dropdown options only reflect matching reports
    let statusFilteredList = baseList;
    if (!isTodos) {
        statusFilteredList = baseList.filter(r => {
            const est = String(r.estado || '').trim().toLowerCase();
            if (APP_CONFIG.currentModalStatus === 'cerrada') return est.includes('cerrada') || est.includes('cerrado');
            return est.includes(APP_CONFIG.currentModalStatus);
        });
    }

    const userRole = String(APP_CONFIG.currentUser?.rol || '').trim().toUpperCase();
    const isAdmin = userRole === 'ADMIN' || userRole === 'ADMINISTRADOR';
    
    const excelBtn = document.getElementById('export-excel-btn');
    if (excelBtn) {
        excelBtn.style.display = isAdmin ? 'flex' : 'none';
    }
    
    const filterCuenta = document.getElementById('modal-filter-cuenta');
    const filterTienda = document.getElementById('modal-filter-tienda');
    const filterUsuario = document.getElementById('modal-filter-usuario');
    const filterEstado = document.getElementById('modal-filter-estado');
    const filterTipo = document.getElementById('modal-filter-tipo');
    
    if (filtersEl) filtersEl.style.display = 'flex';

    if (filterUsuario) filterUsuario.style.display = isAdmin ? '' : 'none';
    if (filterEstado) filterEstado.style.display = isTodos ? '' : 'none';
    
    if (filterCuenta) {
        const cuentas = [...new Set(statusFilteredList.map(r => String(r.cuenta || '').trim()).filter(Boolean))].sort();
        filterCuenta.innerHTML = '<option value="all">Todas las Cuentas</option>';
        cuentas.forEach(c => filterCuenta.innerHTML += `<option value="${c}">${c}</option>`);
        filterCuenta.value = 'all';
    }
    
    if (filterTienda) {
        const datalist = document.getElementById('modal-filter-tienda-list');
        const tiendas = [...new Set(statusFilteredList.map(r => String(r.tienda || '').trim()).filter(Boolean))].sort();
        if (datalist) {
            datalist.innerHTML = '';
            tiendas.forEach(t => datalist.innerHTML += `<option value="${t}">`);
        }
        filterTienda.value = '';
    }
    
    if (isAdmin && filterUsuario) {
        const usuarios = [...new Set(statusFilteredList.map(r => String(r.usuario || '').trim()).filter(Boolean))].sort();
        filterUsuario.innerHTML = '<option value="all">Todos los Usuarios</option>';
        usuarios.forEach(u => filterUsuario.innerHTML += `<option value="${u}">${u}</option>`);
        filterUsuario.value = 'all';
    }
    
    if (filterEstado) filterEstado.value = 'all';

    if (filterTipo) {
        if (category) {
            filterTipo.value = category;
        } else {
            filterTipo.value = 'all';
        }
    }

    if (title) {
        let displayStatus = isTodos ? 'TODOS' : APP_CONFIG.currentModalStatus.toUpperCase();
        if (category) {
            displayStatus += ` - ${String(category).toUpperCase()}`;
        }
        title.textContent = 'Historial de Incidencias: ' + displayStatus; 
    }
    
    window.applyModalFilters();
    
    modal.style.display = 'flex'; 
    modal.classList.remove('hidden'); 
};

// ========================================================
// SISTEMA DE NOTIFICACIONES Y CAMBIOS DE ESTADO
// ========================================================

function checkStatusChanges(reports) {
    if (!reports || reports.length === 0) return;
    
    // Obtener caché previa de estados e historial de notificaciones
    let prevStates = JSON.parse(localStorage.getItem('xiaomi_states_cache_' + ((APP_CONFIG.currentUser?.email || APP_CONFIG.currentUser?.usuario) || '').toLowerCase()) || '{}');
    let notifications = JSON.parse(localStorage.getItem('xiaomi_notifications_' + ((APP_CONFIG.currentUser?.email || APP_CONFIG.currentUser?.usuario) || '').toLowerCase()) || '[]');
    let isInitial = Object.keys(prevStates).length === 0;
    let newStates = {};
    let foundChanges = [];

    reports.forEach(r => {
        if (!r.id) return;
        const currentEst = String(r.estado || '').trim().toUpperCase();
        newStates[r.id] = currentEst;
        
        // Solo procesar cambios si no es la carga inicial absoluta
        if (!isInitial) {
            if (prevStates[r.id] && prevStates[r.id] !== currentEst) {
                // CAMBIO DE ESTADO DETECTADO!
                const change = {
                    id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
                    reportId: r.id,
                    tienda: r.tienda || 'Tienda Desconocida',
                    oldState: prevStates[r.id],
                    newState: currentEst,
                    tipo: r.tipo || 'Reporte',
                    timestamp: new Date().toLocaleString(),
                    timeMs: Date.now(),
                    read: false
                };
                foundChanges.push(change);
                notifications.unshift(change); // Al principio de la lista
            } else if (!prevStates[r.id]) {
                // NUEVO REPORTE DETECTADO!
                const userRole = String(APP_CONFIG.currentUser?.rol || '').trim().toUpperCase();
                const isAdmin = (userRole === 'ADMIN' || userRole === 'ADMINISTRADOR');
                
                if (isAdmin) {
                    const change = {
                        id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
                        reportId: r.id,
                        tienda: r.tienda || 'Tienda Desconocida',
                        oldState: 'NUEVO',
                        newState: currentEst,
                        tipo: r.tipo || 'Reporte',
                        timestamp: new Date().toLocaleString(),
                        timeMs: Date.now(),
                        read: false
                    };
                    foundChanges.push(change);
                    notifications.unshift(change);
                }
            }
        }
    });

    // Guardar la nueva caché de estados para la próxima comparativa
    localStorage.setItem('xiaomi_states_cache_' + ((APP_CONFIG.currentUser?.email || APP_CONFIG.currentUser?.usuario) || '').toLowerCase(), JSON.stringify(newStates));
    
    if (foundChanges.length > 0) {
        // Limitar histórico de notificaciones para no saturar (ej. últimas 50)
        notifications = notifications.slice(0, 50);
        localStorage.setItem('xiaomi_notifications_' + ((APP_CONFIG.currentUser?.email || APP_CONFIG.currentUser?.usuario) || '').toLowerCase(), JSON.stringify(notifications));
        
        // Alertar al usuario inmediatamente
        triggerNotificationAlert(foundChanges);
    }
    
    // Siempre actualizar el badge
    updateNavBadge();
}

function triggerNotificationAlert(changes) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    let msg = "";
    let plainMsg = "";
    if (changes.length === 1) {
        const c = changes[0];
        msg = `El estado de <strong>"${c.tienda}"</strong> cambió de <span style="opacity:0.7;">${c.oldState}</span> a <strong>${c.newState}</strong>.`;
        plainMsg = `El estado de "${c.tienda}" cambió de ${c.oldState} a ${c.newState}.`;
    } else {
        msg = `Se han detectado <strong>${changes.length}</strong> actualizaciones en tus incidencias.`;
        plainMsg = `Se han detectado ${changes.length} actualizaciones en tus incidencias.`;
    }

    // --- LÓGICA DE NOTIFICACIÓN NATIVA ---
    if ('Notification' in window && Notification.permission === 'granted') {
        try {
            new Notification('Xiaomi Visual', {
                body: plainMsg,
                icon: 'logo.png'
            });
        } catch(e) {
            console.log("Error enviando notificación nativa:", e);
        }
    }

    const toast = document.createElement('div');
    toast.className = 'premium-toast';
    toast.innerHTML = `
        <div class="toast-icon"><i class="fas fa-bell"></i></div>
        <div class="toast-content">
            <div class="toast-title">AVISO DE CAMBIO 🔄</div>
            <div class="toast-text">${msg}</div>
        </div>
        <button class="toast-close" title="Cerrar"><i class="fas fa-times"></i></button>
    `;

    const closeToast = () => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
    };

    toast.querySelector('.toast-close').onclick = closeToast;
    container.appendChild(toast);

    // Auto-destrucción tras 6 segundos
    setTimeout(closeToast, 6000);
}

function updateNavBadge() {
    const badge = document.getElementById('msg-nav-badge');
    const mobileBadge = document.getElementById('msg-mobile-badge');
    if (!badge) return;
    
    // 1. Mensajes de chat no leídos de la base de datos
    const currentUser = String((APP_CONFIG.currentUser?.email || APP_CONFIG.currentUser?.usuario) || '').trim().toLowerCase();
    const unreadChatCount = (window.inboxMessages || []).filter(m => 
        String(m.destinatario || '').trim().toLowerCase() === currentUser && 
        !String(m.leido || '').trim().toLowerCase().includes('leido') &&
        !String(m.leido || '').trim().toLowerCase().includes('leído')
    ).length;
    
    // 2. Notificaciones del sistema no leídas de localStorage
    const systemNotifs = JSON.parse(localStorage.getItem('xiaomi_notifications_' + ((APP_CONFIG.currentUser?.email || APP_CONFIG.currentUser?.usuario) || '').toLowerCase()) || '[]');
    const unreadSystemCount = systemNotifs.filter(n => !n.read).length;
    
    const totalCount = unreadChatCount + unreadSystemCount;
    
    if (totalCount > 0) {
        const displayText = totalCount > 99 ? '99+' : totalCount;
        badge.textContent = displayText;
        badge.style.display = 'flex';
        badge.classList.add('active');
        if (mobileBadge) {
            mobileBadge.textContent = displayText;
            mobileBadge.style.display = 'flex';
            mobileBadge.classList.add('active');
        }
    } else {
        badge.style.display = 'none';
        badge.classList.remove('active');
        if (mobileBadge) {
            mobileBadge.style.display = 'none';
            mobileBadge.classList.remove('active');
        }
    }
}

// Helper para marcar lectura individual sin recargar
window.markSingleNotificationRead = function(notifId) {
    let notifs = JSON.parse(localStorage.getItem('xiaomi_notifications_' + ((APP_CONFIG.currentUser?.email || APP_CONFIG.currentUser?.usuario) || '').toLowerCase()) || '[]');
    const item = notifs.find(x => x.id === notifId);
    if (item) {
        item.read = true;
        localStorage.setItem('xiaomi_notifications_' + ((APP_CONFIG.currentUser?.email || APP_CONFIG.currentUser?.usuario) || '').toLowerCase(), JSON.stringify(notifs));
        updateNavBadge();
    }
};

window.renderNotificationsView = function() {
    const listContainer = document.getElementById('notifications-list');
    const emptyEl = document.getElementById('no-msgs-fallback');
    if (!listContainer || !emptyEl) return;
    
    const notifications = JSON.parse(localStorage.getItem('xiaomi_notifications_' + ((APP_CONFIG.currentUser?.email || APP_CONFIG.currentUser?.usuario) || '').toLowerCase()) || '[]');
    listContainer.innerHTML = '';
    
    if (notifications.length === 0) {
        emptyEl.style.display = 'block';
        return;
    } else {
        emptyEl.style.display = 'none';
    }
    
    notifications.forEach(n => {
        const item = document.createElement('div');
        item.className = `msg-notification-item ${n.read ? '' : 'unread'}`;
        
        let iconClass = 'fa-exchange-alt';
        let colorClass = '#ffa940';
        if (n.newState.includes('SOLUCIONADO')) { iconClass = 'fa-check-circle'; colorClass = '#52c41a'; }
        if (n.newState.includes('PENDIENTE')) { iconClass = 'fa-hourglass-half'; colorClass = '#faad14'; }
        if (n.newState.includes('CERRAD')) { iconClass = 'fa-lock'; colorClass = '#bfbfbf'; }

        item.innerHTML = `
            <div class="msg-icon-box" style="background: ${colorClass}1a; color: ${colorClass}">
                <i class="fas ${iconClass}"></i>
            </div>
            <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <strong style="font-size: 14px;">Cambio de Estado: ${n.newState}</strong>
                    <small style="color: #999; font-size: 11px;">${n.timestamp}</small>
                </div>
                <p style="font-size: 13px; color: #666; margin: 0;">
                    La incidencia en <strong>${n.tienda}</strong> pasó de <span style="text-decoration: line-through; opacity: 0.7;">${n.oldState}</span> a <strong>${n.newState}</strong>.
                </p>
                <small style="display:block; margin-top: 5px; color: var(--mi-gray-dark); font-size:11px;">Categoría: ${n.tipo}</small>
                
                <!-- Acciones del mensaje enlazadas directamente -->
                <div style="display: flex; gap: 8px; margin-top: 12px;">
                    <button class="action-go-link" style="background: var(--mi-orange); color:white; border:none; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor:pointer; display:flex; align-items:center; gap:5px; transition: background 0.2s;">
                        <i class="fas fa-external-link-alt"></i> Ir a la Sección
                    </button>
                    ${!n.read ? `
                    <button class="action-mark-read" style="background: #f5f5f5; color:var(--mi-text-dark); border: 1px solid var(--mi-border); padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor:pointer; display:flex; align-items:center; gap:5px; transition: all 0.2s;">
                        <i class="fas fa-check"></i> Marcar como leído
                    </button>
                    ` : ''}
                </div>
            </div>
        `;

        // Listener: Ir a la Sección (Redirección con deep-linking)
        const btnGo = item.querySelector('.action-go-link');
        if (btnGo) {
            btnGo.onclick = () => {
                const rep = (APP_CONFIG.dashboardReports || []).find(x => x.id === n.reportId);
                if (rep) {
                    // 1. Forzar vista dashboard
                    showView('dashboard');
                    // 2. Sincronizar nav active class
                    navLinks.forEach(lnk => {
                        if (lnk.getAttribute('data-target') === 'dashboard') lnk.classList.add('active');
                        else lnk.classList.remove('active');
                    });
                    // 3. Abrir detalles del reporte tras renderizado
                    setTimeout(() => {
                        window.showReportDetails(rep);
                    }, 300);

                    // Auto-marcar como leído al navegar
                    if (!n.read) {
                        window.markSingleNotificationRead(n.id);
                        n.read = true;
                        item.classList.remove('unread');
                        const btnRead = item.querySelector('.action-mark-read');
                        if (btnRead) btnRead.remove();
                    }
                } else {
                    alert("El reporte original ya no se encuentra disponible (podría haber sido modificado o borrado).");
                }
            };
        }

        // Listener: Marcar Leído individualmente
        const btnRead = item.querySelector('.action-mark-read');
        if (btnRead) {
            btnRead.onclick = () => {
                window.markSingleNotificationRead(n.id);
                n.read = true;
                item.classList.remove('unread');
                btnRead.remove();
            };
        }

        listContainer.appendChild(item);
    });
};

window.markAllNotificationsRead = function() {
    let notifications = JSON.parse(localStorage.getItem('xiaomi_notifications_' + ((APP_CONFIG.currentUser?.email || APP_CONFIG.currentUser?.usuario) || '').toLowerCase()) || '[]');
    notifications.forEach(n => n.read = true);
    localStorage.setItem('xiaomi_notifications_' + ((APP_CONFIG.currentUser?.email || APP_CONFIG.currentUser?.usuario) || '').toLowerCase(), JSON.stringify(notifications));
    updateNavBadge();
    renderNotificationsView();
};

// Iniciar chequeo al arrancar (Badge)
setTimeout(updateNavBadge, 1000);


// ==============================================================
// --- MÓDULO DE MENSAJERÍA INTERNA (ANTIGRAVITY PREMIUM) ---
// ==============================================================

window.inboxMessages = [];
window.activeInboxFilter = 'recibidos';

window.updateCharCounter = function(el) {
    const counter = document.getElementById('msg-char-counter');
    if (counter) {
        counter.textContent = `${el.value.length} / 200`;
        if (el.value.length >= 200) {
            counter.style.color = '#ff4d4f';
        } else {
            counter.style.color = '#aaa';
        }
    }
};

window.loadMessagingUsers = async function() {
    const select = document.getElementById('msg-destinatario');
    if (!select) return;
    
    try {
        const res = await callApi({ 
            action: 'getMessagingUsers',
            email: APP_CONFIG.currentUser?.email || APP_CONFIG.currentUser?.usuario,
            token: APP_CONFIG.currentUser?.token
        });
        if (res && res.success && res.users) {
            const userRole = String(APP_CONFIG.currentUser?.rol || '').trim().toUpperCase();
            const isCurrentUserAdmin = userRole === 'ADMIN' || userRole === 'ADMINISTRADOR';
            
            // Si el usuario actual es Admin, carga a los usuarios Estándar.
            // Si el usuario actual es Estándar, carga a los Admins.
            const filteredUsers = res.users.filter(u => {
                const targetIsAdmin = u.rol === 'ADMIN' || u.rol === 'ADMINISTRADOR';
                if (isCurrentUserAdmin) {
                    // Mostrar todos excepto Admins (para mandarle a estandars)
                    return !targetIsAdmin;
                } else {
                    // Mostrar solo Admins
                    return targetIsAdmin;
                }
            });
            
            select.innerHTML = '<option value="" disabled selected>Selecciona destinatario...</option>';
            filteredUsers.forEach(u => {
                const opt = document.createElement('option');
                opt.value = (u.email || u.usuario);
                opt.textContent = `${(u.nombre || u.email || u.usuario)} (${isCurrentUserAdmin ? 'Estándar' : 'Administrador'})`;
                opt.dataset.nombre = String(u.nombre || '').trim().toLowerCase();
                select.appendChild(opt);
            });
            
            if (filteredUsers.length === 0) {
                select.innerHTML = '<option value="" disabled selected>Sin destinatarios disponibles.</option>';
            }
        } else {
            const errReason = res ? (res.message || res.error || JSON.stringify(res)) : 'Sin respuesta del servidor';
            console.error("Error de API:", errReason);
            select.innerHTML = `<option value="" disabled selected>Error: ${errReason}</option>`;
        }
    } catch (err) {
        console.error("Excepción de carga de contactos:", err);
        select.innerHTML = `<option value="" disabled selected>Error de red: ${err.message || err}</option>`;
    }
};

window.handleMotivoChange = function(select) {
    const customInput = document.getElementById('msg-custom-motivo');
    if (select.value === 'nuevo') {
        customInput.style.display = 'block';
        customInput.required = true;
    } else {
        customInput.style.display = 'none';
        customInput.required = false;
        customInput.value = '';
    }
};

window.loadMessagingMotivos = function() {
    const select = document.getElementById('msg-motivo');
    const destSelect = document.getElementById('msg-destinatario');
    if (!select) return;
    
    // Mantener las opciones básicas
    select.innerHTML = '<option value="" selected>Sin motivo / General</option><option value="nuevo">Escribir nuevo motivo...</option>';
    
    // Cargar reportes si existen
    let reports = APP_CONFIG.dashboardReports || [];
    
    // Si somos Admin, filtrar los reportes solo al usuario seleccionado
    const userRole = String(APP_CONFIG.currentUser?.rol || '').trim().toUpperCase();
    const isAdmin = userRole === 'ADMIN' || userRole === 'ADMINISTRADOR';
    
    if (isAdmin && destSelect) {
        const selectedOption = destSelect.options[destSelect.selectedIndex];
        if (selectedOption && !selectedOption.disabled) {
            const targetEmail = String(selectedOption.value).trim().toLowerCase();
            const targetNombre = String(selectedOption.dataset.nombre || '').trim().toLowerCase();
            
            try {
                let filteredReports = reports.filter(r => {
                    if (!r) return false;
                    const repUser = String(r.usuario || '').trim().toLowerCase();
                    const repOwner = String(r.owner || '').trim().toLowerCase();
                    const repCuenta = String(r.cuenta || '').trim().toLowerCase();
                    
                    const normalizeStr = (str) => {
                        if (!str) return '';
                        let s = String(str).toLowerCase();
                        try { s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); } catch(e) {}
                        return s.replace(/[^a-z0-9]/g, '');
                    };
                    
                    const cleanRepUser = normalizeStr(repUser);
                    const cleanRepOwner = normalizeStr(repOwner);
                    const cleanRepCuenta = normalizeStr(repCuenta);
                    const cleanTargetEmail = normalizeStr(targetEmail);
                    const cleanTargetNombre = normalizeStr(targetNombre);
                    
                    if (cleanTargetEmail && cleanRepUser && (cleanRepUser.includes(cleanTargetEmail) || cleanTargetEmail.includes(cleanRepUser))) return true;
                    if (cleanTargetEmail && cleanRepOwner && cleanRepOwner.includes(cleanTargetEmail)) return true;
                    if (cleanTargetEmail && cleanRepCuenta && cleanRepCuenta.includes(cleanTargetEmail)) return true;
                    
                    if (cleanTargetNombre && cleanRepUser && (cleanRepUser.includes(cleanTargetNombre) || cleanTargetNombre.includes(cleanRepUser))) return true;
                    if (cleanTargetNombre && cleanRepOwner && cleanRepOwner.includes(cleanTargetNombre)) return true;
                    if (cleanTargetNombre && cleanRepCuenta && cleanRepCuenta.includes(cleanTargetNombre)) return true;
                    
                    return false;
                });
                
                console.log("🎯 Filtrando reportes para dest:", targetEmail, "| Nombre:", targetNombre);
                console.log("📊 Total reportes antes:", reports.length, "| Después:", filteredReports.length);
                
                reports = filteredReports;
            } catch (e) {
                console.error("Error filtrando motivos:", e);
                reports = [];
            }
        } else {
            reports = []; // Si no ha seleccionado usuario, no mostrar reportes aún
        }
    }
    
    if (reports.length > 0) {
        reports.forEach(r => {
            const idStr = r.id ? String(r.id) : 'Sin ID';
            const categoriaStr = r.categoria || 'Sin categoría';
            const subcategoriaStr = r.subcategoria ? String(r.subcategoria) : 'Sin subcategoría';
            const estadoStr = r.estado || 'Sin estado';
            let motivoDesc = 'Sin motivo';
            
            if (r.motivo) motivoDesc = String(r.motivo);
            else if (r.descripcion) motivoDesc = String(r.descripcion).substring(0, 40) + '...';
            
            const optionText = `${idStr}, ${categoriaStr}, ${subcategoriaStr}, ${motivoDesc}, ${estadoStr}`;
            const optionValue = optionText;
            
            const opt = document.createElement('option');
            opt.value = optionValue;
            opt.textContent = optionText;
            select.appendChild(opt);
        });
    }
};

window.handleSendMessage = async function(e) {
    e.preventDefault();
    const destInput = document.getElementById('msg-destinatario');
    const textInput = document.getElementById('msg-texto');
    const selectMotivo = document.getElementById('msg-motivo');
    const customMotivo = document.getElementById('msg-custom-motivo');
    const submitBtn = document.getElementById('msg-submit-btn');
    
    if (!destInput.value || !textInput.value.trim()) {
        alert("Por favor completa todos los campos obligatorios.");
        return;
    }
    
    const originalContent = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Enviando...';
    
    let finalMotivo = '';
    if (selectMotivo && selectMotivo.value) {
        if (selectMotivo.value === 'nuevo' && customMotivo) {
            finalMotivo = customMotivo.value.trim();
        } else {
            finalMotivo = selectMotivo.value;
        }
    }
    
    try {
        const res = await callApi({
            action: 'sendMessage',
            remitente: (APP_CONFIG.currentUser.email || APP_CONFIG.currentUser.usuario),
            destinatario: destInput.value,
            mensaje: textInput.value.trim(),
            motivo: finalMotivo
        });
        
        if (res && res.success) {
            alert("¡Mensaje enviado con éxito!");
            textInput.value = '';
            if (selectMotivo) selectMotivo.value = '';
            if (customMotivo) {
                customMotivo.value = '';
                customMotivo.style.display = 'none';
            }
            updateCharCounter(textInput);
            // Recargar bandeja automáticamente
            await window.loadUserInbox();
        } else {
            alert("Error al enviar mensaje: " + (res.error || 'Error desconocido'));
        }
    } catch (err) {
        console.error(err);
        alert("Error al comunicar con el servidor de mensajería.");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalContent;
    }
};

window.loadUserInbox = async function() {
    const loader = document.getElementById('inbox-loader');
    const list = document.getElementById('inbox-list');
    const fallback = document.getElementById('no-inbox-fallback');
    
    if (loader) loader.style.display = 'block';
    if (list) list.style.display = 'none';
    if (fallback) fallback.style.display = 'none';
    
    try {
        const res = await callApi({
            action: 'getMessages',
            email: (APP_CONFIG.currentUser.email || APP_CONFIG.currentUser.usuario)
        });
        
        if (res && res.success) {
            window.inboxMessages = res.messages || [];
            window.lastInboxResponse = res; // Guardamos metadatos de depuración para el panel visual
            window.renderInboxList(window.activeInboxFilter);
            updateNavBadge();
        } else {
            if (list) list.innerHTML = '<p style="color:red; text-align:center; font-size:12px;">Error cargando bandeja.</p>';
        }
    } catch (err) {
        console.error("Error crítico en inbox loader:", err);
        if (list) list.innerHTML = `
            <div style="text-align:center; padding:20px; color:#cf1322; font-size:12px; background:#fff1f0; border:1px solid #ffa39e; border-radius:8px; margin:10px;">
                <i class="fas fa-exclamation-circle" style="font-size:20px; margin-bottom:8px;"></i><br>
                <strong>Error de Conexión:</strong><br>${err.message || err.toString()}<br>
                <small style="color:#888; margin-top:5px; display:block;">Por favor reporta esta traza técnica.</small>
            </div>
        `;
        if (list) list.style.display = 'block';
    } finally {
        if (loader) loader.style.display = 'none';
        if (list) list.style.display = 'flex';
    }
};

window.filterInbox = function(filterType, btn) {
    window.activeInboxFilter = filterType;
    
    // Alternar estilos visuales del selector píldora
    document.querySelectorAll('.inbox-filter-pill').forEach(p => {
        p.style.background = 'transparent';
        p.style.color = '#666';
        p.style.boxShadow = 'none';
    });
    
    btn.style.background = 'white';
    btn.style.color = 'var(--mi-orange)';
    btn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.05)';
    
    window.renderInboxList(filterType);
};

window.renderInboxList = function(filterType) {
    const list = document.getElementById('inbox-list');
    const fallback = document.getElementById('no-inbox-fallback');
    if (!list) return;
    
    const currentUser = String((APP_CONFIG.currentUser?.email || APP_CONFIG.currentUser?.usuario) || '').trim().toLowerCase();
    
    // --- CONSTRUCCIÓN DEL FEED AGREGADO Y CRONOLÓGICO ---
    let combinedFeed = [];
    
    if (filterType === 'recibidos') {
        // 1. Mensajes de Chat Recibidos de base de datos
        const chatMsgs = (window.inboxMessages || [])
            .filter(m => String(m.destinatario || '').trim().toLowerCase() === currentUser.trim())
            .map(m => ({
                id: m.id,
                time: new Date(m.fecha).getTime() || 0,
                formattedDate: isNaN(new Date(m.fecha)) ? 'Fecha Desconocida' : new Date(m.fecha).toLocaleDateString('es-ES', {day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'}),
                isRead: String(m.leido || '').toLowerCase().includes('leido') || String(m.leido || '').toLowerCase().includes('leído'),
                type: 'chat',
                sender: m.remitente,
                content: m.mensaje,
                original: m
            }));
            
        // 2. Notificaciones del Sistema Locales
        const sysNotifs = JSON.parse(localStorage.getItem('xiaomi_notifications_' + ((APP_CONFIG.currentUser?.email || APP_CONFIG.currentUser?.usuario) || '').toLowerCase()) || '[]')
            .map(n => {
                let parseTime = n.timeMs || 0;
                if (!parseTime) {
                    const d = new Date(n.timestamp);
                    parseTime = isNaN(d.getTime()) ? 0 : d.getTime();
                }
                return {
                    id: n.id,
                    time: parseTime,
                    formattedDate: n.timestamp,
                    isRead: n.read,
                    type: 'sistema',
                    sender: 'SISTEMA',
                    original: n
                };
            });
            
        // Mezclar ambos arreglos y ordenar cronológicamente de más reciente a más antiguo
        combinedFeed = [...chatMsgs, ...sysNotifs];
        combinedFeed.sort((a, b) => b.time - a.time);
        
    } else {
        // Para la pestaña Enviados, solo chat saliente del usuario activo
        combinedFeed = (window.inboxMessages || [])
            .filter(m => String(m.remitente || '').trim().toLowerCase() === currentUser.trim())
            .map(m => ({
                id: m.id,
                time: new Date(m.fecha).getTime() || 0,
                formattedDate: isNaN(new Date(m.fecha)) ? 'Fecha Desconocida' : new Date(m.fecha).toLocaleDateString('es-ES', {day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'}),
                isRead: true, 
                type: 'chat',
                sender: m.destinatario,
                content: m.mensaje,
                original: m
            }));
            
        combinedFeed.sort((a, b) => b.time - a.time);
    }
    
    // --- BUTTON VISIBILITY ---
    const markAllBtn = document.getElementById('mark-all-read-btn');
    if (markAllBtn) {
        const hasUnread = combinedFeed.some(item => !item.isRead);
        if (filterType === 'recibidos' && hasUnread) {
            markAllBtn.style.display = 'flex';
        } else {
            markAllBtn.style.display = 'none';
        }
    }
    
    // Manejo de vista vacía (Producción)
    if (combinedFeed.length === 0) {
        list.innerHTML = '';
        if (fallback) {
            fallback.style.display = 'block';
            const diagPara = fallback.querySelector('p');
            if (diagPara) {
                diagPara.innerHTML = '<span style="color: #999; font-size: 13px; font-weight: 500;">No hay mensajes en este filtro.</span>';
            }
        }
        return;
    }
    if (fallback) fallback.style.display = 'none';
    
    // --- RENDERIZADO DINÁMICO UNIFICADO ---
    list.innerHTML = combinedFeed.map(item => {
        const peerLabel = filterType === 'recibidos' ? 'De:' : 'Para:';
        
        // CASO A: CHAT DIRECTO BIDIRECCIONAL
        if (item.type === 'chat') {
            const borderLeftColor = filterType === 'recibidos' ? (item.isRead ? '#ddd' : 'var(--mi-orange)') : '#1890ff';
            const badgeBg = filterType === 'recibidos' ? (item.isRead ? '#f0f0f0' : '#fff2e8') : '#e6f7ff';
            const badgeTextColor = filterType === 'recibidos' ? (item.isRead ? '#8c8c8c' : '#fa541c') : '#1890ff';
            const badgeText = filterType === 'recibidos' ? (item.isRead ? 'Leído' : 'Nuevo Chat') : 'Enviado';
            
            let extraButtons = '';
            if (!item.isRead && filterType === 'recibidos') {
                extraButtons += `
                <button onclick="event.stopPropagation(); window.markInboxMessageRead('${item.id}', this.closest('.message-card'))" style="background:#ffffff; color:#555; border:1px solid #ddd; padding:6px 12px; border-radius:4px; font-size:10px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:4px; margin-top: 8px;">
                    <i class="fas fa-check"></i> Marcar como leído
                </button>
                `;
            }
            if (String(item.sender).trim().toLowerCase() === 'sistema') {
                extraButtons += `
                <button onclick="event.stopPropagation(); window.loadView('reportes')" style="background:var(--mi-orange); color:white; border:none; padding:6px 12px; border-radius:4px; font-size:10px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:4px; margin-top: 8px;">
                    <i class="fas fa-external-link-alt"></i> Ver Incidencias
                </button>
                `;
            }
            
            const buttonsContainer = extraButtons ? `<div style="display:flex; gap:8px; justify-content:flex-start; border-top: 1px solid #f0f0f0; padding-top: 8px; margin-top: 4px;">${extraButtons}</div>` : '';
            
            const motivoBadge = item.original && item.original.motivo ? `<div style="margin: 4px 0 6px 0;"><span style="background: #f4f6f8; border: 1px solid #d9e2ec; color: #486581; font-size: 10px; padding: 3px 8px; border-radius: 4px; font-weight: 600;"><i class="fas fa-tag" style="margin-right: 4px; color: var(--mi-orange);"></i>Motivo: ${item.original.motivo}</span></div>` : '';
            
            return `
                <div class="message-card chat-item" style="background:#ffffff; border-radius: 8px; padding: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); display:flex; flex-direction:column; gap:8px; transition:all 0.2s; border: 1px solid #f0f0f0; border-left: 4px solid ${borderLeftColor}; margin-bottom: 10px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:11px; font-weight:700; color:var(--mi-gray-dark); text-transform:uppercase;">
                            ${peerLabel} <span style="color:var(--mi-black); text-transform:none; background:#f0f2f5; padding: 2px 8px; border-radius:4px; font-weight:600;">${item.sender}</span>
                        </span>
                        <span style="background:${badgeBg}; color:${badgeTextColor}; font-size:10px; font-weight:700; padding:2px 10px; border-radius:20px;">${badgeText}</span>
                    </div>
                    ${motivoBadge}
                    <p style="margin:4px 0; font-size:13px; line-height:1.5; color:#333; word-break:break-word;">${item.content}</p>
                    ${buttonsContainer}
                    <div style="display:flex; justify-content:flex-end; align-items:center;">
                        <small style="font-size:10px; color:#aaa;"><i class="far fa-clock"></i> ${item.formattedDate}</small>
                    </div>
                </div>
            `;
        }
        
        // CASO B: ALERTAS DEL SISTEMA AUTOMÁTICAS
        if (item.type === 'sistema') {
            const n = item.original;
            let iconClass = 'fa-exchange-alt';
            let colorClass = '#ffa940';
            const nState = String(n.newState || '').toUpperCase();
            if (nState.includes('SOLUCIONADO')) { iconClass = 'fa-check-circle'; colorClass = '#52c41a'; }
            if (nState.includes('PENDIENTE')) { iconClass = 'fa-hourglass-half'; colorClass = '#faad14'; }
            if (nState.includes('CERRAD')) { iconClass = 'fa-lock'; colorClass = '#bfbfbf'; }
            
            const borderLeft = item.isRead ? '#ddd' : colorClass;
            const unreadBg = item.isRead ? '#ffffff' : '#fafafa';
            
            return `
                <div class="message-card msg-notification-item ${item.isRead ? '' : 'unread'}" style="background:${unreadBg}; border-radius: 8px; padding: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); display:flex; gap:14px; border: 1px solid #f0f0f0; border-left: 4px solid ${borderLeft}; margin-bottom: 10px;">
                    <div style="width:36px; height:36px; border-radius:50%; background:${colorClass}1a; color:${colorClass}; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:16px;">
                        <i class="fas ${iconClass}"></i>
                    </div>
                    <div style="flex:1; display:flex; flex-direction:column; gap:4px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-size:11px; font-weight:700; color:var(--mi-gray-dark); text-transform:uppercase;">
                                De: <span style="color:#c41d7f; background:#fff0f6; padding: 2px 8px; border-radius:4px; font-weight:700; border: 1px solid #ffd6e7;">${item.sender}</span>
                            </span>
                            <span style="background:#f5f5f5; color:#8c8c8c; font-size:10px; font-weight:700; padding:2px 10px; border-radius:20px;">Sistema</span>
                        </div>
                        <strong style="font-size:13px; color:var(--mi-black); margin-top:2px;">Cambio de Estado: ${n.newState}</strong>
                        <p style="margin:2px 0; font-size:12px; color:#555; line-height:1.4;">
                            La incidencia en <strong>${n.tienda}</strong> pasó de <span style="text-decoration: line-through; opacity: 0.7;">${n.oldState}</span> a <strong>${n.newState}</strong>.
                        </p>
                        <small style="display:block; color:var(--mi-gray-dark); font-size:10px; margin-bottom: 4px;">Categoría: ${n.tipo}</small>
                        
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
                            <div style="display:flex; gap:8px;">
                                <button onclick="window.handleSystemGo('${n.tipo}', '${n.lanzamientoId || ''}', '${n.tienda}')" style="background:var(--mi-orange); color:white; border:none; padding:6px 12px; border-radius:4px; font-size:10px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:4px;">
                                    <i class="fas fa-external-link-alt"></i> Ir a la Sección
                                </button>
                                ${!item.isRead ? `
                                <button onclick="window.handleSystemMarkRead('${n.id}')" style="background:#ffffff; color:#555; border:1px solid #ddd; padding:6px 12px; border-radius:4px; font-size:10px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:4px;">
                                    <i class="fas fa-check"></i> Marcar como leído
                                </button>
                                ` : ''}
                            </div>
                            <small style="font-size:10px; color:#aaa;"><i class="far fa-clock"></i> ${item.formattedDate}</small>
                        </div>
                    </div>
                </div>
            `;
        }
    }).join('');
};

window.markInboxMessageRead = async function(msgId, cardEl) {
    // Optimistic UI: marcado instantáneo sin lag visual
    if (cardEl) {
        cardEl.style.borderColor = '#f0f0f0';
        cardEl.style.borderLeftColor = '#ddd';
        cardEl.style.cursor = 'default';
        const badge = cardEl.querySelector('span[style*="background"]');
        if (badge) {
            badge.style.background = '#f0f0f0';
            badge.style.color = '#8c8c8c';
            badge.textContent = 'Leído';
        }
        cardEl.removeAttribute('onclick');
    }
    
    const localMsg = window.inboxMessages.find(m => m.id === msgId);
    if (localMsg) localMsg.leido = 'Leido';
    
    // Actualizar el contador visual de la barra de navegación instantáneamente
    updateNavBadge();
    
    try {
        await callApi({
            action: 'markMessageRead',
            messageId: msgId
        });
    } catch (err) {
        console.error("Fallo al persistir leído en servidor:", err);
    }
};


// ==============================================================
// --- CALLBACKS GLOBALES PARA NOTIFICACIONES DE SISTEMA ---
// ==============================================================

window.handleSystemGo = function(tipo, lanzamientoId, tienda) {
    if (String(tipo).toLowerCase().includes('lanzamiento')) {
        window._pendingQuickLaunch = lanzamientoId || null;
        window._pendingQuickStore = tienda || null;
        showView('lanzamientos');
    } else {
        showView('dashboard');
        setTimeout(() => {
            const targetRow = Array.from(document.querySelectorAll('#recent-reports-table tbody tr'))
                                  .find(tr => tr.innerText.includes(tienda));
            if (targetRow) targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 800);
    }
};

window.handleSystemMarkRead = function(id) {
    let notifications = JSON.parse(localStorage.getItem('xiaomi_notifications_' + ((APP_CONFIG.currentUser?.email || APP_CONFIG.currentUser?.usuario) || '').toLowerCase()) || '[]');
    const idx = notifications.findIndex(n => n.id === id);
    if (idx !== -1) {
        notifications[idx].read = true;
        localStorage.setItem('xiaomi_notifications_' + ((APP_CONFIG.currentUser?.email || APP_CONFIG.currentUser?.usuario) || '').toLowerCase(), JSON.stringify(notifications));
    }
    // Recalcular y refrescar UI instantáneamente
    updateNavBadge();
    window.renderInboxList('recibidos');
};

window.handleMarkAllRead = async function() {
    const markAllBtn = document.getElementById('mark-all-read-btn');
    if (!markAllBtn) return;
    
    // Deshabilitar botón durante proceso
    const originalHtml = markAllBtn.innerHTML;
    markAllBtn.disabled = true;
    markAllBtn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right: 4px;"></i> Marcando...';
    
    const currentUser = String((APP_CONFIG.currentUser?.email || APP_CONFIG.currentUser?.usuario) || '').trim().toLowerCase();
    
    // 1. Marcar notificaciones del sistema como leídas
    const localKey = 'xiaomi_notifications_' + currentUser;
    let localNotifs = JSON.parse(localStorage.getItem(localKey) || '[]');
    let localModified = false;
    localNotifs.forEach(n => {
        if (!n.read) {
            n.read = true;
            localModified = true;
        }
    });
    if (localModified) {
        localStorage.setItem(localKey, JSON.stringify(localNotifs));
    }
    
    // 2. Llamada a la API para mensajes de chat
    try {
        const unreadIds = (window.inboxMessages || [])
            .filter(m => String(m.estado || m.leido || '').trim().toLowerCase() !== 'leido' && String(m.estado || m.leido || '').trim().toLowerCase() !== 'leído')
            .map(m => m.id);

        const res = await callApi({
            action: 'markAllMessagesRead',
            email: currentUser,
            msgIds: unreadIds.length > 0 ? JSON.stringify(unreadIds) : '[]'
        });
        
        if (res && res.success) {
            // Actualizar estado local en memoria
            if (window.inboxMessages) {
                const normalizeStr = (str) => {
                    if (!str) return '';
                    let s = String(str).toLowerCase();
                    try { s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); } catch(e) {}
                    return s.replace(/[^a-z0-9]/g, '');
                };
                const cleanCurrentUser = normalizeStr(currentUser);
                
                window.inboxMessages.forEach(m => {
                    const isLeido = String(m.leido || '').toLowerCase().includes('leido') || String(m.leido || '').toLowerCase().includes('leído');
                    const cleanDest = normalizeStr(String(m.destinatario || '').trim().toLowerCase());
                    
                    if (cleanDest === cleanCurrentUser && !isLeido) {
                        m.leido = 'Leido';
                    }
                });
            }
        } else {
            console.error("Error al marcar todos como leídos en la base de datos:", res);
        }
    } catch (e) {
        console.error("Excepción marcando todos como leídos:", e);
    }
    
    // Refrescar vista
    markAllBtn.innerHTML = originalHtml;
    markAllBtn.disabled = false;
    markAllBtn.style.display = 'none';
    
    // Re-renderizar
    const inboxFilter = document.querySelector('.inbox-filter-pill.active');
    renderInboxList(inboxFilter ? (inboxFilter.textContent.trim().toLowerCase() === 'recibidos' ? 'recibidos' : 'enviados') : 'recibidos');
    
    // Si no es un read explícito desde click, refrescamos badge si procede
    updateNavBadge();
};


// ==========================================
// ==========================================
// NUEVO MOTOR DE PROGRESO DE LANZAMIENTOS EN DASHBOARD
// ==========================================
window.renderDashboardLaunches = async function() {
    const adminFilters = document.getElementById('admin-launch-filters');
    const filterCuenta = document.getElementById('dash-internal-cuenta');
    const filterUsuario = document.getElementById('dash-internal-usuario');
    
    // Obtener Rol
    const userRole = String(APP_CONFIG.currentUser?.rol || '').trim().toUpperCase();
    const isAdmin = userRole === 'ADMIN' || userRole === 'ADMINISTRADOR';
    
    // Mostrar filtros a todos
    if (adminFilters) adminFilters.style.display = 'flex';
    
    try {
        // Cargar launches si no estn
        if (!APP_CONFIG.launches || APP_CONFIG.launches.length === 0) {
            APP_CONFIG.launches = await callApi({ action: 'getLaunches' });
        }
        
        // Cargar statuses (sin filtros, obtenemos el mapa global)
        if (!APP_CONFIG.launchStatuses || Object.keys(APP_CONFIG.launchStatuses).length === 0) {
            APP_CONFIG.launchStatuses = await callApi({ action: 'getLaunchStatuses', usuario: '', lanzamiento: '' }) || {};
        }
        
        const launches = APP_CONFIG.launches || [];
        const statuses = APP_CONFIG.launchStatuses || {};
        const myEmail = String((APP_CONFIG.currentUser?.email || APP_CONFIG.currentUser?.usuario) || '').trim().toLowerCase();
        
        // Llenar selectores si están vacíos (solo una vez)
        if (filterCuenta && filterCuenta.options.length <= 1) {
            const cuentasSet = new Set();
            const usuariosSet = new Set();
            launches.forEach(l => {
                if (l.tiendas && Array.isArray(l.tiendas)) {
                    l.tiendas.forEach(t => {
                        if (t.Cuenta) cuentasSet.add(t.Cuenta.trim());
                        if (t.Usuario) usuariosSet.add(t.Usuario.trim());
                    });
                }
            });
            Array.from(cuentasSet).sort().forEach(c => {
                const opt = document.createElement('option');
                opt.value = c; opt.textContent = c;
                filterCuenta.appendChild(opt);
            });
            Array.from(usuariosSet).sort().forEach(u => {
                const opt = document.createElement('option');
                opt.value = u; opt.textContent = u;
                filterUsuario.appendChild(opt);
            });
        }
        
        const selectedCuenta = filterCuenta ? filterCuenta.value : 'all';
        const selectedUsuario = filterUsuario ? filterUsuario.value : 'all';
        
        let globalTotal = 0;
        let globalCompletadas = 0;
        let filteredStoresCache = []; // Para guardarlas y usarlas en el modal
        
        launches.forEach(launch => {
            const keys = Object.keys(launch);
            const nameKey = keys.find(k => k.toLowerCase().includes('producto') || k.toLowerCase().includes('lanzamiento') || k.toLowerCase() === 'col0' || k.toLowerCase() === 'nombre');
            const launchName = nameKey ? launch[nameKey] : 'Lanzamiento Sin Nombre';
            
            if (launch.tiendas && Array.isArray(launch.tiendas)) {
                launch.tiendas.forEach(t => {
                    const tUser = String(t.Usuario || '').trim().toLowerCase();
                    const tCuenta = String(t.Cuenta || '').trim();
                    const tNombre = String(t.Tienda || '').trim();
                    
                    // Filtrar por permisos del usuario
                    if (!isAdmin && tUser !== myEmail) return;
                    
                    // Filtrar por admin filters
                    if (isAdmin && selectedCuenta !== 'all' && tCuenta !== selectedCuenta) return;
                    if (isAdmin && selectedUsuario !== 'all' && tUser !== selectedUsuario.toLowerCase()) return;
                    
                    globalTotal++;
                    
                    let estadoActual = 'Pendiente';
                    if (statuses[tNombre] && statuses[tNombre].estado === 'Realizado') {
                        globalCompletadas++;
                        estadoActual = 'Realizado';
                    }
                    
                    filteredStoresCache.push({
                        tienda: tNombre,
                        cuenta: tCuenta,
                        usuario: t.Usuario,
                        estado: estadoActual,
                        lanzamientoTarget: launchName
                    });
                });
            }
        });
        
        // Guardamos en memoria para los clicks del modal
        window._currentLaunchStoresCache = filteredStoresCache;
        
        const globalPendientes = globalTotal - globalCompletadas;
        const globalPct = globalTotal > 0 ? Math.round((globalCompletadas / globalTotal) * 100) : 0;
        
        const totalEl = document.getElementById('dash-launch-total');
        const doneEl = document.getElementById('dash-launch-done');
        const pendEl = document.getElementById('dash-launch-pending');
        const pctEl = document.getElementById('dash-launch-pct');
        
        if (totalEl) totalEl.textContent = globalTotal;
        if (doneEl) doneEl.textContent = globalCompletadas;
        if (pendEl) pendEl.textContent = globalPendientes;
        if (pctEl) pctEl.textContent = globalPct + '%';
        
    } catch (e) {
        console.error("Error calculando lanzamientos en dashboard:", e);
    }
};

window.filterLaunchStores = function(filterType) {
    if (!window._currentLaunchStoresCache || window._currentLaunchStoresCache.length === 0) {
        alert("No hay tiendas asignadas para el filtro actual.");
        return;
    }
    
    let filteredStores = [];
    if (filterType === 'all') {
        filteredStores = window._currentLaunchStoresCache;
    } else if (filterType === 'done') {
        filteredStores = window._currentLaunchStoresCache.filter(t => t.estado === 'Realizado');
    } else if (filterType === 'pending') {
        filteredStores = window._currentLaunchStoresCache.filter(t => t.estado === 'Pendiente');
    }
    
    // Mapear tiendas a formato consistente para el historial modal, arrastrando la metadata
    const mappedItems = filteredStores.map(t => ({
        nombre: t.tienda,
        tienda: t.tienda,
        cuenta: t.cuenta,
        estado: t.estado,
        lanzamientoTarget: t.lanzamientoTarget
    }));
    
    // showHistorialModal(title, reports, isReadOnlyLaunch)
    window.showHistorialModal(`Lanzamientos: Tiendas (${filterType.toUpperCase()})`, mappedItems, true);
};

// ========================================================
// PWA Y NOTIFICACIONES
// ========================================================
let deferredPrompt;

// 1. Registrar Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(reg => {
            console.log('ServiceWorker registrado', reg);
        }).catch(err => {
            console.error('Error al registrar ServiceWorker', err);
        });
    });
}

// 2. Interceptar el evento de instalacin de PWA (Generar APK / Add to Home Screen)
window.addEventListener('beforeinstallprompt', (e) => {
    // Evitar que el navegador muestre el banner por defecto inmediatamente (opcional)
    e.preventDefault();
    deferredPrompt = e;
    
    // Mostrar nuestro botn de instalacin en el men
    const installBtn = document.getElementById('install-app-btn');
    if (installBtn) {
        installBtn.style.display = 'block';
        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    installBtn.style.display = 'none';
                }
                deferredPrompt = null;
            }
        });
    }
});

// 3. Botn de Activar Notificaciones
document.addEventListener('DOMContentLoaded', () => {
    const notifBtn = document.getElementById('enable-notif-btn');
    if (notifBtn && 'Notification' in window) {
        // Mostrar botn slo si los permisos an no han sido otorgados ni denegados
        if (Notification.permission === 'default') {
            notifBtn.style.display = 'block';
        }
        
        notifBtn.addEventListener('click', () => {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    alert('Notificaciones activadas!');
                    notifBtn.style.display = 'none';
                } else {
                    alert('Permiso de notificaciones denegado.');
                    notifBtn.style.display = 'none';
                }
            });
        });
    }
});






