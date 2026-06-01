const API_URL = "https://script.google.com/macros/s/AKfycbyUPEtTeLftNBr9hcVODrUJbLAbYaTLfc-8v0hX7BxC2v7HBh8LM7IQ117GHs9mxfHoAQ/exec";

// Sistema de Caché de Metadatos para Optimización (V1.1)
const _metadataCache = new Map();

/**
 * Motor de comunicación GET (V6.9) - MODO JSONP (Anti-Bloqueos CORS)
 * Esto evita que el móvil bloquee las redirecciones de Google Apps Script.
 */
function sendGet(action, params = {}, useCache = false) {
    const cacheKey = action + JSON.stringify(params);
    if (useCache && _metadataCache.has(cacheKey)) {
        return Promise.resolve(_metadataCache.get(cacheKey));
    }

    return new Promise((resolve, reject) => {
        const callbackName = 'jsonp_' + Math.round(100000 * Math.random());
        const script = document.createElement('script');
        
        const timeout = setTimeout(() => {
            cleanup();
            reject(new Error("Timeout: El servidor de Google no responde o hay mala cobertura."));
        }, 15000); 

        function cleanup() {
            clearTimeout(timeout);
            if (script.parentNode) script.parentNode.removeChild(script);
            delete window[callbackName];
        }

        window[callbackName] = function(data) {
            cleanup();
            if (useCache) _metadataCache.set(cacheKey, data);
            resolve(data);
        };

        const queryParams = { action, ...params, callback: callbackName };
        if (!useCache) queryParams._t = Date.now(); // Evitar caché del navegador
        
        const query = new URLSearchParams(queryParams).toString();
        script.src = `${API_URL}?${query}`;
        script.onerror = () => { 
            cleanup(); 
            reject(new Error("Error de red o bloqueo de seguridad (CORS/VPN).")); 
        };
        
        document.body.appendChild(script);
    });
}

/**
 * Motor de comunicación POST para subida de reportes y fotos
 */
async function sendPost(action, data = {}) {
    const payload = JSON.stringify({ action, ...data });
    console.log(`[API] sending POST for action: ${action}`);
    
    try {
        const res = await fetch(API_URL, { 
            method: 'POST', 
            body: payload, 
            headers: {
                'Content-Type': 'text/plain;charset=utf-8' // Obligatorio para evitar preflight
            }
        });
        
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        const result = await res.json();
        
        console.log(`[API] POST sent successfully`);
        _metadataCache.clear(); // Limpiamos caché porque hubo cambios
        return result;
    } catch (e) {
        console.error(`[API] fetch error:`, e);
        throw new Error("Error de red o conexión bloqueada al enviar datos.");
    }
}

function setSessionData(data) { 
    try { localStorage.setItem('userSession', JSON.stringify(data)); } 
    catch(e) { console.warn("LocalStorage bloqueado:", e); }
}

function getSessionData() { 
    try { return JSON.parse(localStorage.getItem('userSession')); } 
    catch(e) { return null; }
}

function clearSessionData() { 
    try {
        localStorage.removeItem('userSession'); 
        _metadataCache.clear();
    } catch(e) {}
}

const api = {
    login: (user, pass) => sendGet("login", { user, pass }),
    getUsersList: () => sendGet("getUsersList", {}, true),
    getVacationData: (user) => sendGet("getVacationData", { user }),
    getAdminData: () => sendGet("getAdminData"),
    getDashboardStats: (params) => sendGet("getDashboardStats", params),
    getReportsHistory: (params) => sendGet("getReportsHistory", params),
    getCitiesList: () => sendGet("getCitiesList", {}, true),
    getFilterMetadata: () => sendGet("getFilterMetadata", {}, true),
    getMessages: (params) => sendGet("getMessages", params),
    getWeekly: (params) => sendGet("getWeekly", params),
    
    saveReport: (data, photos) => sendPost("saveReport", { data, photos }),
    updateReport: (req) => sendPost("updateReport", req),
    requestVacation: (req) => sendPost("requestVacation", req),
    updateRequest: (id, status) => sendPost("updateRequest", { id, status }),
    modifyExtra: (user, delta) => sendPost("modifyExtra", { user, delta }),
    modifyBase: (user, delta) => sendPost("modifyBase", { user, delta }),
    markMessageRead: (msgId) => sendPost("markMessageRead", { msgId }),
    markAllMessagesRead: (user) => sendPost("markAllMessagesRead", { user }),
    saveAssignment: (req) => sendPost("saveAssignment", req),
    adminProcessSelection: (req) => sendPost("adminProcessSelection", req),
    deleteReport: (id) => sendPost("deleteReport", { id })
};

window.setSessionData = setSessionData;
window.getSessionData = getSessionData;
window.clearSessionData = clearSessionData;
window.sendJSONP = sendGet; // Compatibilidad
window.sendPost = sendPost;
window.api = api;
