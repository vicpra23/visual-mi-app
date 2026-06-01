const getUser = () => getSessionData();
const clearSession = () => clearSessionData();
const navigate = (h) => { window.location.hash = h; };

const app = document.getElementById('app');
const navbar = document.getElementById('navbar');
const navLinks = document.getElementById('navLinks');
let lastSeenMsgId = 0;
let pollerInterval = null;

// GESTIÓN DE TEMAS (V1.0)
const getTheme = () => localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
const setTheme = (t) => {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('theme', t);
    if (typeof lucide !== 'undefined') lucide.createIcons();
};
window.toggleTheme = () => {
    const next = getTheme() === 'light' ? 'dark' : 'light';
    setTheme(next);
};

function initApp() {
    setTheme(getTheme());
    
    window.addEventListener('hashchange', navigateRouter);
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        stopPoller();
        clearSession();
        window.location.hash = '';
        navigateRouter();
    });

    // Resetear datos de edición al navegar manualmente por el menú & Mobile Toggle
    navbar.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        const toggle = e.target.closest('#menuToggle');
        const navOverlay = document.getElementById('navOverlay');

        if (toggle && navLinks) {
            navLinks.classList.toggle('active');
            if (navOverlay) navOverlay.classList.toggle('active');
            
            const icon = toggle.querySelector('i');
            if (icon && typeof lucide !== 'undefined') {
                const isOpen = navLinks.classList.contains('active');
                icon.setAttribute('data-lucide', isOpen ? 'x' : 'menu');
                lucide.createIcons();
            }
        }

        if (link) {
            // Resetear datos de edición si se hace clic en el link de Reporte directamente
            if (link.getAttribute('href') === '#report') {
                window.reportEditData = null;
            }
            // Close mobile menu on click
            if (navLinks) navLinks.classList.remove('active');
            if (navOverlay) navOverlay.classList.remove('active');
            
            const toggleIcon = document.querySelector('#menuToggle i');
            if (toggleIcon && typeof lucide !== 'undefined') {
                toggleIcon.setAttribute('data-lucide', 'menu');
                lucide.createIcons();
            }

            if (link.getAttribute('href') === '#report') {
                window.reportEditData = null;
                if (window.location.hash === '#report') navigateRouter();
            }
        }
    });

    // Close menu when clicking backdrop or outside
    document.addEventListener('click', (e) => {
        const navLinks = document.getElementById('navLinks');
        const toggle = document.getElementById('menuToggle');
        const navOverlay = document.getElementById('navOverlay');
        
        const isClickOutside = navLinks && navLinks.classList.contains('active') && !navLinks.contains(e.target) && toggle && !toggle.contains(e.target);
        const isClickOverlay = e.target === navOverlay;

        if (isClickOutside || isClickOverlay) {
            if (navLinks) navLinks.classList.remove('active');
            if (navOverlay) navOverlay.classList.remove('active');
            
            const toggleIcon = toggle.querySelector('i');
            if (toggleIcon && typeof lucide !== 'undefined') {
                toggleIcon.setAttribute('data-lucide', 'menu');
                lucide.createIcons();
            }
        }
    });
    
    if (!document.getElementById('toast-container')) {
        const tc = document.createElement('div');
        tc.id = 'toast-container';
        document.body.appendChild(tc);
    }

    navigateRouter();
    startPoller();
}

let hasShownNews = false;

function navigateRouter() {
    let hash = window.location.hash || '#';
    let user = getUser();
    if (!user && hash !== '#') { window.location.hash = '#'; return; }
    if (user && hash === '#') { window.location.hash = '#dashboard'; return; }

    navbar.style.display = user ? 'block' : 'none';
    if (user) {
        document.body.classList.toggle('is-admin', user.role === 'Admin');
        updateNavBadge();
        if(!hasShownNews) {
            hasShownNews = true;
            api.getMessages({ targetUser: user.user }).then(res => {
                if(res.status === 'success') {
                    const unread = res.data.filter(m => !m.read && m.id && !localReadCache.includes(m.id.toString())).length;
                    if(unread > 0) {
                        const label = unread === 1 ? "tienes 1 mensaje pendiente" : `tienes ${unread} mensajes pendientes`;
                        showToast("¡Tienes novedades!", `Hola ${user.name}, ${label} en tu buzón.`, "#mensajes");
                    }
                }
            });
        }
    }

    try {
        console.log("Navigating to:", hash);
        switch (hash) {
            case '#': renderLogin(app); break;
            case '#dashboard': renderDashboard(app); break;
            case '#report': renderReport(app, window.reportEditData); break;
            case '#calendar': renderCalendar(app); break;
            case '#vacations': renderVacations(app); break;
            case '#materials': 
                if (typeof renderMaterials === 'function') renderMaterials(app); 
                else { console.error("renderMaterials not found!"); renderDashboard(app); }
                break;
            case '#mensajes': renderMessages(app); break;
            default: renderLogin(app);
        }
    } catch (e) {
        console.error("Router Error:", e);
        renderDashboard(app);
    }

    // Renderizado de iconos Lucide tras cada navegación
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// CACHE LOCAL PARA EVITAR EFECTO "REBOTE" EN MENSAJES
let localReadCache = JSON.parse(localStorage.getItem('readCache') || "[]");
const saveCache = () => localStorage.setItem('readCache', JSON.stringify(localReadCache));

async function updateNavBadge() {
    const userData = getSessionData();
    if (!userData) return;
    const res = await api.getMessages({ targetUser: userData.user });
    if (res.status === 'success') {
        // Filtramos por leído en el servidor O en nuestra caché local
        const unread = res.data.filter(m => !m.read && m.id && !localReadCache.includes(m.id.toString())).length;
        const msgLink = document.querySelector('a[href="#mensajes"]');
        if (msgLink) {
            msgLink.style.position = 'relative';
            let b = msgLink.querySelector('.msg-badge');
            if (unread > 0) {
                if (!b) { b = document.createElement('span'); b.className = 'msg-badge'; msgLink.appendChild(b); }
                b.innerText = unread;
            } else if (b) { b.remove(); }
        }
        if (res.data.length > 0) {
            const latest = res.data[0];
            if (latest.id && latest.id > lastSeenMsgId && lastSeenMsgId !== 0) {
                if (!latest.read && !localReadCache.includes(latest.id.toString())) showToast(`Mensaje de ${latest.from}`, latest.text, '#mensajes');
            }
            lastSeenMsgId = latest.id || lastSeenMsgId;
        }
    }
}

function showToast(title, msg, targetHash) {
    const container = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `
        <div class="toast-title">${title}</div>
        <div class="toast-body">${msg}</div>
        <div style="font-size:0.6rem; color: var(--text-muted); margin-top:5px; font-weight:700;">Clic para ver...</div>
    `;
    t.onclick = () => { t.classList.add('out'); setTimeout(()=>t.remove(), 300); window.location.hash = targetHash; };
    container.appendChild(t);
    setTimeout(() => { if(t.parentElement) { t.classList.add('out'); setTimeout(()=>t.remove(), 300); } }, 2000);
}

function startPoller() { if (pollerInterval) clearInterval(pollerInterval); if (getUser()) { updateNavBadge(); pollerInterval = setInterval(updateNavBadge, 60000); } }
function stopPoller() { if (pollerInterval) clearInterval(pollerInterval); pollerInterval = null; }

window.onload = initApp;
window.navigate = (h) => { window.location.hash = h; };
window.showToast = showToast;