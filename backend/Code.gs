// ==================================================
// XIAOMI TRAINER INTRANET - Backend V4.9 (SENIOR REFACTOR)
// ==================================================

const CONFIG = {
  REPORTES_SS_ID: "117UB1wEqZg7D_vdmp2lZ-RN3BQHnQZk7HP49YP-0MPo",
  USUARIOS_SS_ID: "1K0vGOPwteG6ZjNVT7cDaEwIeb3ONcjmNec3-FGlH10g",
  DRIVE_FOLDER_ID: "14LBhHOVqdGJf2x-02GTrZREuZYxM_GV_",
  REPORTES_SHEET_NAME: "DATOS",
  USUARIOS_SHEET_NAME: "USUARIOS",
  VACACIONES_SHEET_NAME: "VACACIONES",
  FESTIVOS_SHEET_NAME: "FESTIVOS",
  DIAS_EXTRAS_SHEET_NAME: "DIAS EXTRAS",
  MENSAJES_SHEET_NAME: "MENSAJES",
  PLANIFICACION_SHEET_NAME: "PLANIFICACION",
  VERSION: "V5.0",
  ADMINS: ["Training Manager", "Training Coordinator", "Training Creator"]
};

// CONFIGURACIÓN DE COLUMNAS DINÁMICAS (V5.5)
function _getColMap(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  headers.forEach((h, i) => {
    const clean = h.toString().trim().toUpperCase();
    if (clean === "FECHA") map.FECHA = i;
    else if (clean.includes("FECHA") && map.FECHA === undefined) map.FECHA = i;
    else if (clean.includes("CUENTA")) map.CUENTA = i;
    else if (clean.includes("DISTRIBUIDOR")) map.DISTRIBUIDOR = i;
    else if (clean.includes("METODOLOG")) map.METODOLOGIA = i;
    else if (clean.includes("SESION")) map.SESIONES = i;
    else if (clean.includes("PERFIL")) map.PERFIL = i; // Perfil tiene prioridad sobre la palabra "Alumno"
    else if (clean === "ALUMNOS" || clean.includes("Nº ALUM") || clean.includes("CANT. ALUM")) map.ALUMNOS = i;
    else if (clean.includes("HORA") || clean.includes("DURAC")) map.HORAS = i;
    else if (clean.includes("TIENDA") && !clean.includes("DISTRIBUIDOR")) map.TIENDAS = i;
    else if (clean.includes("CIUDAD") || clean.includes("POBLAC") || clean.includes("MUNICIPIO")) map.CIUDAD = i;
    else if (clean.includes("PROVINCIA")) map.PROVINCIA = i;
    else if (clean.includes("CONTENIDO")) map.CONTENIDOS = i;
    else if (clean.includes("DISPOSITIVO") && !clean.includes("NO")) map.DISP_MOVIL = i;
    else if (clean.includes("ECOSISTEMA") || clean.includes("NO M")) map.DISP_ECO = i;
    else if (clean.includes("COMENTARIO")) map.COMENTARIOS = i;
    else if (clean.includes("FOTO") || clean.includes("URL")) map.FOTOS = i;
    else if (clean.includes("TRAINER") || clean.includes("USUARIO") || clean.includes("NOMBRE")) map.TRAINER = i;
  });
  return map;
}

const CACHE_EXPIRATION = 300; // 5 minutos en segundos

// MEJORA SENIOR: Super-calculadora de duraciones (V5.6)
function _parseDur(val) {
  if (val === undefined || val === null || val === "") return 0;
  
  // 1. Si Google Sheets lo envía como un objeto Date nativo (formato Duración)
  if (val instanceof Date) {
    const baseDate = new Date(1899, 11, 30);
    let diff = (val.getTime() - baseDate.getTime()) / (1000 * 60 * 60);
    if (diff > 100000) return Math.abs(val.getHours() + (val.getMinutes() / 60) + (val.getSeconds() / 3600));
    return Math.abs(diff);
  }

  let s = val.toString().trim().replace(',', '.');

  // 2. Si viene en formato hora "HH:MM" o "T14:30" (común en móviles)
  if (s.includes(':')) {
    let timePart = s.includes('T') ? s.split('T')[1] : s;
    let parts = timePart.split(':');
    let hh = parseFloat(parts[0]) || 0;
    let mm = parseFloat(parts[1]) || 0;
    let ss = parseFloat(parts[2]) || 0;
    return Math.abs(hh + (mm / 60) + (ss / 3600));
  }
  
  // 3. Si viene como número o texto decimal ("2.5")
  const num = parseFloat(s.replace(/[^0-9.-]/g, '')) || 0;
  return Math.abs(num);
}

// 🛠️ FIX 2: CACHÉ REAL DE APPS SCRIPT CON SOPORTE PARA REFRESH FORZADO
function _getValuesCached(ssId, sheetName, forceRefresh = false) {
  const cache = CacheService.getScriptCache();
  const key = ssId + "_" + sheetName;
  
  if (!forceRefresh) {
    const cachedData = cache.get(key);
    if (cachedData) {
      try { return JSON.parse(cachedData); } catch(e) { cache.remove(key); }
    }
  } else {
    cache.remove(key);
  }
  
  try {
    const ss = SpreadsheetApp.openById(ssId);
    const s = ss.getSheetByName(sheetName);
    if (!s) return [];
    const d = s.getDataRange().getValues();
    try {
      cache.put(key, JSON.stringify(d), CACHE_EXPIRATION);
    } catch(cacheError) {
      // CacheService limit is 100KB. If it fails, ignore and return data anyway.
    }
    return d;
  } catch(e) { return []; }
}

function _invalidateCache(ssId, sheetName) {
  CacheService.getScriptCache().remove(ssId + "_" + sheetName);
}

function doGet(e) {
  const p = e.parameter || {};
  const action = (p.action || "").toString().trim();
  const callback = p.callback || "callback";
  const userParam = (p.user || "").toString().trim();
  
  let res = { status: "error", message: "Accion [" + action + "] no encontrada" };
  try {
    const forceRefresh = p._t ? true : false;
    if (action === "login")             res = attemptLogin(userParam, p.pass);
    if (action === "getUsersList")      res = getUsersList();
    if (action === "getVacationData")   res = getVacationData(userParam, forceRefresh);
    if (action === "getAdminData")      res = getAdminData(forceRefresh);
    if (action === "getDashboardStats") res = getDashboardStats(p);
    if (action === "getReportsHistory")  res = getReportsHistory(p);
    if (action === "getCitiesList")     res = getCitiesList();
    if (action === "getFilterMetadata") res = getFilterMetadata();
    if (action === "getMessages")       res = getMessages(p);
    if (action === "getWeekly")         res = getWeeklySchedule(p);
    if (action === "updateReport")      res = updateReport(p);
    if (action === "deleteReport")      res = deleteReport(p);
  } catch(err) { res = { status: "error", message: "Backend Error: " + err.toString() }; }
  if (p.callback) {
    return ContentService.createTextOutput(p.callback + "(" + JSON.stringify(res) + ")").setMimeType(ContentService.MimeType.JAVASCRIPT);
  } else {
    return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents);
    let res = { status: "error", message: "Accion no encontrada" };
    if (req.action === "saveReport")      res = handleSaveReport(req.data, req.photos);
    if (req.action === "updateReport")    res = updateReport(req);
    if (req.action === "deleteReport")    res = deleteReport(req);
    if (req.action === "requestVacation") res = handleRequestVacation(req);
    if (req.action === "updateRequest")   res = updateRequestStatus(req.id, req.status);
    if (req.action === "modifyExtra")     res = modifyExtraDays(req.user, req.delta);
    if (req.action === "modifyBase")      res = modifyBaseDays(req.user, req.delta);
    if (req.action === "markMessageRead") res = handleMarkMessageRead(req);
    if (req.action === "markAllMessagesRead") res = handleMarkAllMessagesRead(req);
    if (req.action === "saveAssignment")  res = saveWeeklyAssignment(req);
    if (req.action === "adminProcessSelection") res = adminProcessSelection(req);
    return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
  } catch(err) { return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() })).setMimeType(ContentService.MimeType.JSON); }
}

// --- ADMIN FEATURES ---
function getAdminData(forceRefresh = false) {
  try {
    const dU = _getValuesCached(CONFIG.USUARIOS_SS_ID, CONFIG.USUARIOS_SHEET_NAME, forceRefresh);
    const dE = _getValuesCached(CONFIG.USUARIOS_SS_ID, CONFIG.DIAS_EXTRAS_SHEET_NAME, forceRefresh);
    const extraMap = {}; 
    for(let i=1; i<dE.length; i++) {
       if (!dE[i][0]) continue;
       const uKey = dE[i][0].toString().trim().toLowerCase();
       if(uKey) extraMap[uKey] = parseFloat(dE[i][1]) || 0;
    }
    
    const dV = _getValuesCached(CONFIG.USUARIOS_SS_ID, CONFIG.VACACIONES_SHEET_NAME, forceRefresh);
    const consumedMap = {}; 
    for(let i=1; i<dV.length; i++) {
        if (!dV[i][1]) continue; 
        const u = dV[i][1].toString().trim().toLowerCase();
        if(dV[i][5] !== 'Rechazado') {
            if(!consumedMap[u]) consumedMap[u] = {base:0, extra:0};
            
            const rangeStr = dV[i][2] ? dV[i][2].toString() : "";
            let count = parseFloat(dV[i][6]) || 0;
            
            const matches = rangeStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/g);
            if (matches) {
                const parseDate = (s) => {
                    const parts = s.split("/");
                    let y = parseInt(parts[2]);
                    if (y < 100) y += 2000;
                    return new Date(y, parseInt(parts[1]) - 1, parseInt(parts[0]));
                };
                const start = parseDate(matches[0]);
                const end = matches.length > 1 ? parseDate(matches[matches.length - 1]) : start;
                let cur = new Date(start);
                let laborableCount = 0;
                while (cur <= end) {
                    if (cur.getDay() !== 0 && cur.getDay() !== 6) {
                        laborableCount++;
                    }
                    cur.setDate(cur.getDate() + 1);
                }
                count = laborableCount;
            }
            
            if(dV[i][4] === 'Vacaciones') consumedMap[u].base += count;
            else consumedMap[u].extra += count;
        }
    }

    const allUsers = dU.slice(1).map(r => {
        const u = r[0].toString().trim().toLowerCase();
        const cons = consumedMap[u] || {base:0, extra:0};
        const totalExtra = extraMap[u] || 0;
        const totalBase = parseFloat(r[6]) || 23; 
        return { 
          user: r[0], 
          name: r[1], 
          sede: r[2], 
          baseTotal: totalBase,
          baseAvail: totalBase - cons.base, 
          extraTotal: totalExtra,
          extraAvail: totalExtra - cons.extra
        };
    });

    const pending = dV.slice(1).filter(r => r[5] === 'Pendiente').map(r => ({ id: r[7], date: r[0], user: r[1], fechas: r[2], month: r[3], type: r[4], count: r[6] }));
    const approved = dV.slice(1).filter(r => r[5] === 'Aprobado').map(r => ({ id: r[7], date: r[0], user: r[1], fechas: r[2], month: r[3], type: r[4], count: r[6] }));

    return { status: "success", allUsers: allUsers, pendingRequests: pending, approvedRequests: approved };
  } catch(e) { return { status: "error", message: e.toString() }; }
}

function getUsersList() {
  try {
    const d = _getValuesCached(CONFIG.USUARIOS_SS_ID, CONFIG.USUARIOS_SHEET_NAME);
    const users = d.slice(1).map(r => ({ user: r[0], name: r[1] }));
    return { status: "success", data: users };
  } catch(e) { return { status: "error", message: e.toString() }; }
}

function updateRequestStatus(id, status) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = SpreadsheetApp.openById(CONFIG.USUARIOS_SS_ID);
    const s = ss.getSheetByName(CONFIG.VACACIONES_SHEET_NAME);
    const d = s.getDataRange().getValues();
    for (let i = 1; i < d.length; i++) {
        if (d[i][7] === id) { 
            s.getRange(i + 1, 6).setValue(status);
            notifyUser(d[i][1], "Tu solicitud de " + (d[i][4]||"Vacaciones") + " (" + d[i][2] + ") ha sido " + (status === "Aprobado" ? "APROBADA ✅" : "RECHAZADA ❌") + ".");
            _invalidateCache(CONFIG.USUARIOS_SS_ID, CONFIG.VACACIONES_SHEET_NAME);
            return { status: "success" }; 
        }
    }
    return { status: "error", message: "ID no encontrado" };
  } catch(e) { return { status: "error", message: e.toString() }; } finally { SpreadsheetApp.flush(); lock.releaseLock(); }
}

function modifyBaseDays(user, delta) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = SpreadsheetApp.openById(CONFIG.USUARIOS_SS_ID);
    let s = ss.getSheetByName(CONFIG.USUARIOS_SHEET_NAME);
    const d = s.getDataRange().getValues();
    for (let i = 1; i < d.length; i++) {
      if (d[i][0].toString().toLowerCase() === user.toLowerCase()) {
        const current = (parseFloat(d[i][6]) || 23);
        const newVal = Math.max(0, current + delta);
        s.getRange(i + 1, 7).setValue(newVal);
        if(newVal !== current) notifyUser(user, "Se han actualizado tus días de vacaciones.");
        _invalidateCache(CONFIG.USUARIOS_SS_ID, CONFIG.USUARIOS_SHEET_NAME);
        return { status: "success", newVal: newVal };
      }
    }
    return { status: "error", message: "Usuario no encontrado" };
  } catch(e) { return { status: "error", message: e.toString() }; } finally { SpreadsheetApp.flush(); lock.releaseLock(); }
}

function modifyExtraDays(user, delta) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = SpreadsheetApp.openById(CONFIG.USUARIOS_SS_ID);
    let s = ss.getSheetByName(CONFIG.DIAS_EXTRAS_SHEET_NAME);
    if (!s) s = ss.insertSheet(CONFIG.DIAS_EXTRAS_SHEET_NAME);
    const d = s.getDataRange().getValues();
    for (let i = 1; i < d.length; i++) {
      if (d[i][0].toString().toLowerCase() === user.toLowerCase()) {
        const current = (parseFloat(d[i][1]) || 0);
        const newVal = Math.max(0, current + delta);
        s.getRange(i + 1, 2).setValue(newVal);
        notifyUser(user, "Se han actualizado tus días de vacaciones.");
        _invalidateCache(CONFIG.USUARIOS_SS_ID, CONFIG.DIAS_EXTRAS_SHEET_NAME);
        return { status: "success", newVal: newVal };
      }
    }
    s.appendRow([user, Math.max(0, delta)]);
    _invalidateCache(CONFIG.USUARIOS_SS_ID, CONFIG.DIAS_EXTRAS_SHEET_NAME);
    return { status: "success" };
  } catch(e) { return { status: "error", message: e.toString() }; } finally { SpreadsheetApp.flush(); lock.releaseLock(); }
}

// --- CORE VACATION LOGIC ---
function getVacationData(user, forceRefresh = false) {
  if (!user) return { status: "error" };
  let festivos = [], userSede = "Genérica", baseTotal = 23;
  
  const dU = _getValuesCached(CONFIG.USUARIOS_SS_ID, CONFIG.USUARIOS_SHEET_NAME, forceRefresh);
  for (let i = 1; i < dU.length; i++) {
    if (dU[i][0].toString().trim().toLowerCase() === user.trim().toLowerCase()) {
      baseTotal = parseFloat(dU[i][6]) || 23;
      break;
    }
  }

  const dF = _getValuesCached(CONFIG.USUARIOS_SS_ID, CONFIG.FESTIVOS_SHEET_NAME, forceRefresh);
  for (let i = 1; i < dF.length; i++) {
    if (dF[i][0].toString().trim().toLowerCase() === user.trim().toLowerCase()) {
      userSede = (dF[i][2] || "Genérica").toString();
      for (let col = 3; col < dF[i].length; col++) {
        const dO = parseDateStable(dF[i][col]);
        if (dO) {
          const dStr = dO.getFullYear() + "-" + ("0" + (dO.getMonth() + 1)).slice(-2) + "-" + ("0" + dO.getDate()).slice(-2);
          festivos.push(dStr);
        }
      }
      break;
    }
  }

  let extra = 0;
  const dE = _getValuesCached(CONFIG.USUARIOS_SS_ID, CONFIG.DIAS_EXTRAS_SHEET_NAME, forceRefresh);
  for (let i=1; i<dE.length; i++) if (dE[i][0].toString().trim().toLowerCase() === user.trim().toLowerCase()) { extra = parseFloat(dE[i][1]) || 0; break; }

  let uB = 0, uE = 0, history = [];
  const dV = _getValuesCached(CONFIG.USUARIOS_SS_ID, CONFIG.VACACIONES_SHEET_NAME, forceRefresh);
  for (let i = 1; i < dV.length; i++) {
    if (!dV[i][1]) continue;
    const rowUser = dV[i][1].toString().trim().toLowerCase();
    if (rowUser === user.trim().toLowerCase()) {
      const status = dV[i][5], count = parseFloat(dV[i][6]) || 0, type = dV[i][4];
      if (status !== "Rechazado") { if (type === "Vacaciones") uB += count; else uE += count; }
      history.push({ id: dV[i][7], user: rowUser, date: dV[i][0], fechas: dV[i][2], month: dV[i][3], type: type, status: status, count: count });
    }
  }
  return { status: "success", stats: { baseTotal: baseTotal, extraTotal: extra, usedBase: uB, usedExtra: uE, sede: userSede }, festivos: festivos, history: history };
}

function handleRequestVacation(req) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = SpreadsheetApp.openById(CONFIG.USUARIOS_SS_ID);
    let sV = ss.getSheetByName(CONFIG.VACACIONES_SHEET_NAME) || ss.insertSheet(CONFIG.VACACIONES_SHEET_NAME);
    const groups = {};
    req.dates.forEach(dStr => {
      const d = parseDateStable(dStr) || new Date(dStr);
      const mLabel = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"][d.getMonth()] + " " + d.getFullYear();
      if (!groups[mLabel]) groups[mLabel] = []; groups[mLabel].push(dStr);
    });
    for (let m in groups) {
      const s = groups[m].sort();
      const label = s.length>1 ? ("Del "+formatDateS(s[0])+" al "+formatDateS(s[s.length-1])) : ("Día "+formatDateS(s[0]));
      const uniqueId = "REQ_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
      sV.appendRow([ new Date(), req.user, label, m, req.type, "Pendiente", s.length, uniqueId ]);
      notifyAdmins("Nueva solicitud de " + req.user + " (" + req.type + "): " + label, req.user);
    }
    _invalidateCache(CONFIG.USUARIOS_SS_ID, CONFIG.VACACIONES_SHEET_NAME);
    return { status: "success" };
  } catch(e) { return { status: "error", message: e.toString() }; } finally { lock.releaseLock(); }
}

function formatDateS(iso) { 
    if (!iso) return "";
    const p = iso.toString().split("-").map(Number);
    return Utilities.formatDate(new Date(p[0], p[1]-1, p[2]), Session.getScriptTimeZone(), "dd/MM/yy"); 
}

// --- DASHBOARD / LOGIN ---
function attemptLogin(u, p) {
  const d = _getValuesCached(CONFIG.USUARIOS_SS_ID, CONFIG.USUARIOS_SHEET_NAME);
  const up = (p || "").toString().trim();
  for (let i = 1; i < d.length; i++) {
    if ((d[i][0] || "").toString().trim().toLowerCase() === u.toLowerCase() && (d[i][3] || "").toString().trim() === up) {
      const isAdmin = CONFIG.ADMINS.some(a => d[i][0].toString().toLowerCase() === a.toLowerCase()) || /Manager|Coordinator|Creator/i.test(d[i][0]);
      return { status: "success", user: d[i][0], name: d[i][1], sede: d[i][2], role: isAdmin ? "Admin" : "User" };
    }
  }
  return { status: "error", message: "Credenciales incorrectas" };
}

function getDashboardStats(p) {
  const force = p.refresh === 'true' || p.refresh === true;
  const now = new Date();
  const d = _getValuesCached(CONFIG.REPORTES_SS_ID, CONFIG.REPORTES_SHEET_NAME, force);
  
  const ss = SpreadsheetApp.openById(CONFIG.REPORTES_SS_ID);
  const sRef = ss.getSheetByName(CONFIG.REPORTES_SHEET_NAME);
  const colMap = _getColMap(sRef);
  
  const target = (p.targetUser || "Total").toString().trim();
  const targetWeeksStr = (p.weeks || p.week || "").toString().trim();
  const targetMonth = (p.month || "Todos").toString().trim();
  const targetYear = (p.year || "Todos").toString().trim();
  const targetDevice = (p.device || "todos").toString().trim().toLowerCase();

  // 1️⃣ NUEVO: Leer Rango de Fechas (Si el Admin lo usa)
  const startDateStr = (p.startDate || "").toString().trim();
  const endDateStr = (p.endDate || "").toString().trim();
  let startD = startDateStr ? new Date(startDateStr) : null;
  let endD = endDateStr ? new Date(endDateStr) : null;
  if(startD) startD.setHours(0,0,0,0);
  if(endD) endD.setHours(23,59,59,999);

  let selectedWeeks = [];
  if (targetWeeksStr) {
    const matches = targetWeeksStr.match(/\d+/g);
    if (matches) selectedWeeks = matches.map(Number);
  }
  if (selectedWeeks.length === 0 && targetMonth === "Todos" && !startD) selectedWeeks = [getWeekNumber(now)];

  // 2️⃣ NUEVO: Soporte para Múltiples Meses (Ej: "Mayo,Junio")
  let selectedMonths = [];
  if (targetMonth !== "Todos") {
      selectedMonths = targetMonth.split(',').map(m => m.trim());
  }

  const mNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  let tS=0, tA=0, tH=0, count=0; 
  let mS={}; 
  let monthlyWS = {}; 
  let statsByAccount = {}; 
  let statsByTrainer = {};
  let availableWeeks = new Set();

  for (var i=1; i<d.length; i++) {
    var fVal = colMap.FECHA !== undefined ? d[i][colMap.FECHA] : d[i][2];
    var tVal = colMap.TRAINER !== undefined ? d[i][colMap.TRAINER] : d[i][1];
    if (!fVal || !tVal) continue; 

    var dO = parseDateStable(fVal); if (!dO) continue;
    var rowYear = dO.getFullYear();
    var rowMonth = dO.getMonth();
    var rowWeek = getWeekNumber(dO);

    // 3️⃣ NUEVO: Aplicación lógica de los Filtros
    if (startD && endD) {
        // Modo Rango de Fechas
        if (dO.getTime() < startD.getTime() || dO.getTime() > endD.getTime()) continue;
        availableWeeks.add(rowWeek);
    } else {
        // Modo Estándar (Año, Mes, Semana)
        if (targetYear !== "Todos" && rowYear.toString() !== targetYear) continue;
        // Si hay meses seleccionados y este mes NO está en la lista, saltamos
        if (selectedMonths.length > 0 && !selectedMonths.includes(mNames[rowMonth])) continue;
        if (selectedMonths.length === 0 || selectedMonths.includes(mNames[rowMonth])) availableWeeks.add(rowWeek);
    }
    
    if (targetDevice !== "todos") {
        const mobiles = (colMap.DISP_MOVIL !== undefined ? d[i][colMap.DISP_MOVIL] : (d[i][11]||"")).toString().toLowerCase();
        const eco = (colMap.DISP_ECO !== undefined ? d[i][colMap.DISP_ECO] : (d[i][12]||"")).toString().toLowerCase();
        if (mobiles.indexOf(targetDevice) === -1 && eco.indexOf(targetDevice) === -1) continue;
    }

    const rowTrainer = (d[i][colMap.TRAINER]||d[i][1]||"").toString().trim().toLowerCase();
    const targetLower = target.toLowerCase();
    const matchesUser = (target === "Total" || rowTrainer === targetLower);
    
    var sVal = colMap.SESIONES !== undefined ? d[i][colMap.SESIONES] : d[i][6];
    var aVal = colMap.ALUMNOS !== undefined ? d[i][colMap.ALUMNOS] : d[i][8];
    var hVal = colMap.HORAS !== undefined ? d[i][colMap.HORAS] : d[i][9];
    var ses=parseFloat(sVal)||0, alu=parseFloat(aVal)||0, hor=_parseDur(hVal);
    var trainer = (d[i][colMap.TRAINER]||d[i][1]||"Desconocido").toString().trim();
    var cuenta = (d[i][colMap.CUENTA]||"Otros").toString().trim();

    // Sumar a totales si coincide la semana (o si estamos en modo Rango de Fechas)
    const inSelectedWeek = (startD && endD) ? true : (selectedWeeks.length === 0 || selectedWeeks.includes(rowWeek));

    if (inSelectedWeek) {
      if (matchesUser) {
        tS+=ses; tA+=alu; tH+=hor; count++;
        var met=(colMap.METODOLOGIA !== undefined ? d[i][colMap.METODOLOGIA] : (d[i][3]||"Otros")).toString().trim(); 
        mS[met]=(mS[met]||0)+hor;
        if(!statsByAccount[cuenta]) statsByAccount[cuenta] = { sesiones:0, alumnos:0 };
        statsByAccount[cuenta].sesiones += ses; statsByAccount[cuenta].alumnos += alu;
        if(!statsByTrainer[trainer]) statsByTrainer[trainer] = { sesiones:0, alumnos:0 };
        statsByTrainer[trainer].sesiones += ses; statsByTrainer[trainer].alumnos += alu;
      }
    }

    // Acumular para el gráfico de barras semanal
    if (matchesUser) {
        const matchesMonthForChart = (startD && endD) ? true : (selectedMonths.length === 0 || selectedMonths.includes(mNames[rowMonth]));
        if (matchesMonthForChart) {
            if(!monthlyWS[rowWeek]) monthlyWS[rowWeek] = { sesiones:0, alumnos:0 };
            monthlyWS[rowWeek].sesiones += ses; monthlyWS[rowWeek].alumnos += alu;
        }
    }
  }
  
  var sW = Object.keys(monthlyWS).sort((a,b)=>a-b);
  return { 
    status:"success", totalSesiones:tS, totalAlumnos:tA, totalHoras:tH.toFixed(1), 
    currentWeekData:{count:count, week: selectedWeeks.join(',')}, 
    chartLabels:sW.length > 0 ? sW.map(w=>"Sem "+w) : ["Sin Datos"], 
    chartSesiones:sW.length > 0 ? sW.map(w=>monthlyWS[w].sesiones) : [0], 
    chartAlumnos:sW.length > 0 ? sW.map(w=>monthlyWS[w].alumnos) : [0], 
    pieLabels:Object.keys(mS), pieData:Object.values(mS),
    adminStats: { byAccount: statsByAccount, byTrainer: statsByTrainer },
    availableWeeks: Array.from(availableWeeks).sort((a,b) => a-b)
  };
}

function getReportsHistory(p) {
  try {
    const force = p.refresh === 'true' || p.refresh === true;
    const target = (p.targetUser || "").toString().trim();
    const limit = parseInt(p.limit) || 20;
    const weekFilter = p.week ? parseInt(p.week) : null;
    const monthFilter = (p.month || "").toString().trim();
    const accountFilter = (p.account || "").toString().trim();
    const deviceFilter = (p.device || "").toString().trim().toLowerCase();
    const methodologyFilter = (p.methodology || "").toString().trim();
    const query = (p.q || "").toString().trim().toLowerCase();
    
    const d = _getValuesCached(CONFIG.REPORTES_SS_ID, CONFIG.REPORTES_SHEET_NAME, force);
    const ss = SpreadsheetApp.openById(CONFIG.REPORTES_SS_ID);
    const sRef = ss.getSheetByName(CONFIG.REPORTES_SHEET_NAME);
    const colMap = _getColMap(sRef);

    const result = [];
    const mNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    const availableFilters = { weeks: new Set(), months: new Set(), accounts: new Set(), methods: new Set(), devices: new Set() };

    const targetLower = target.toLowerCase();

    for (var j=1; j<d.length; j++) {
        var tVal = colMap.TRAINER !== undefined ? d[j][colMap.TRAINER] : d[j][1];
        var fVal = colMap.FECHA !== undefined ? d[j][colMap.FECHA] : d[j][2];
        if (!fVal || !tVal) continue;

        const rowTrainer = tVal.toString().trim().toLowerCase();
        const matchesUser = (target === "Total" || !target || rowTrainer === targetLower);
        
        if (matchesUser) {
            const dO = parseDateStable(fVal);
            if (dO) {
                const rowMonth = mNames[dO.getMonth()];
                const rowWeek = getWeekNumber(dO);
                availableFilters.accounts.add((d[j][colMap.CUENTA]||"Otros").toString().trim());
                availableFilters.methods.add((d[j][colMap.METODOLOGIA]||"Otros").toString().trim());
                if (monthFilter === "Todos" || rowMonth === monthFilter) availableFilters.weeks.add(rowWeek);
                if (weekFilter === null || rowWeek == weekFilter) availableFilters.months.add(rowMonth);
                const devs = ((d[j][colMap.DISP_MOVIL]||"") + ", " + (d[j][colMap.DISP_ECO]||"")).split(",");
                devs.forEach(dev => {
                    const clean = dev.trim();
                    if(clean && clean !== "-" && clean !== "0") availableFilters.devices.add(clean);
                });
            }
        }
    }

  
    for (let i = d.length - 1; i >= 1; i--) {
      var tVal = colMap.TRAINER !== undefined ? d[i][colMap.TRAINER] : d[i][1];
      var fVal = colMap.FECHA !== undefined ? d[i][colMap.FECHA] : d[i][2];
      if (!fVal || !tVal) continue;

      const rowTrainer = tVal.toString().trim().toLowerCase();
      const matchesUser = (target === "Total" || !target || rowTrainer === targetLower);
      
      if (!matchesUser) continue;
      const dO = parseDateStable(fVal);
      if (!dO) continue;
      
      if (weekFilter && weekFilter !== "Todos" && getWeekNumber(dO) != weekFilter) continue;
      if (monthFilter && monthFilter !== "Todos" && mNames[dO.getMonth()] !== monthFilter) continue;
      if (accountFilter && accountFilter !== "Todos" && (d[i][colMap.CUENTA]||"").toString().trim() !== accountFilter) continue;
      if (methodologyFilter && methodologyFilter !== "Todos" && (d[i][colMap.METODOLOGIA]||"").toString().trim() !== methodologyFilter) continue;
      
      if (deviceFilter && deviceFilter !== "todos") {
        const mobiles = (d[i][colMap.DISP_MOVIL]||"").toString().toLowerCase();
        const eco = (d[i][colMap.DISP_ECO]||"").toString().toLowerCase();
        if (mobiles.indexOf(deviceFilter) === -1 && eco.indexOf(deviceFilter) === -1) continue;
      }

      if (query) {
        const rowStr = [Utilities.formatDate(dO, Session.getScriptTimeZone(), "dd/MM/yyyy"), d[i][colMap.CUENTA], d[i][colMap.TIENDAS], d[i][colMap.DISP_MOVIL], d[i][colMap.DISP_ECO]].join(" ").toLowerCase();
        if (rowStr.indexOf(query) === -1) continue;
      }
      
      const dVal = d[i][0];
      let rowTimestamp = 0;
      if (dVal) {
          const parsed = (dVal instanceof Date) ? dVal : new Date(dVal);
          rowTimestamp = isNaN(parsed.getTime()) ? 0 : parsed.getTime();
      }
      const uniqueId = "RID_" + rowTimestamp + "_" + i;

      result.push({
        rowIdx: i + 1,
        id: uniqueId,
        timestamp: d[i][0], 
        trainer: (d[i][colMap.TRAINER] || d[i][1] || "").toString(), 
        fecha: (() => {
          let val = d[i][colMap.FECHA];
          if (!val) return "";
          let dO2 = (val instanceof Date) ? val : parseDateStable(val);
          if (!dO2) return val.toString();
          return dO2.getFullYear() + "-" + ("0" + (dO2.getMonth() + 1)).slice(-2) + "-" + ("0" + dO2.getDate()).slice(-2);
        })(),
        cuenta: (d[i][colMap.CUENTA] || "").toString(), 
        distribuidor: (d[i][colMap.DISTRIBUIDOR] || d[i][4] || "").toString(), 
        metodologia: (d[i][colMap.METODOLOGIA] || "").toString(),
        sesiones: d[i][colMap.SESIONES], 
        alumnos: d[i][colMap.ALUMNOS], 
        provincia: (d[i][colMap.PROVINCIA] || d[i][8] || "").toString(), 
        duracion: d[i][colMap.HORAS], 
        tiendas: d[i][colMap.TIENDAS], 
        perfil: (d[i][colMap.PERFIL] || "").toString(), 
        ciudad: (d[i][colMap.CIUDAD] || "").toString(), 
        contenidos: (d[i][colMap.CONTENIDOS] || "").toString(), 
        dispositivos: (d[i][colMap.DISP_MOVIL] || "").toString(), 
        dispositivos_no_movil: (d[i][colMap.DISP_ECO] || "").toString(), 
        comentarios: (d[i][colMap.COMENTARIOS] || "").toString(),
        photoLinks: (d[i][colMap.FOTOS] || "").toString()
      });
      if (result.length >= limit) break;
    }
    
    return { 
      status: "success", data: result,
      availableFilters: {
          weeks: Array.from(availableFilters.weeks).sort((a,b) => b-a),
          months: Array.from(availableFilters.months).sort((a,b) => mNames.indexOf(a) - mNames.indexOf(b)),
          accounts: Array.from(availableFilters.accounts).sort(),
          methods: Array.from(availableFilters.methods).sort(),
          devices: Array.from(availableFilters.devices).sort()
      }
    };
  } catch(e) { return { status: "error", message: e.toString() }; }
}

function updateReport(p) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    let data = p.data;
    if (typeof data === 'string') data = JSON.parse(data);
    const rowIdx = parseInt(p.rowIdx);
    if (!rowIdx || rowIdx < 1) {
        return { status: "error", message: "Error: No se ha recibido un índice de fila válido para actualizar (rowIdx=" + p.rowIdx + ")" };
    }
    const ss = SpreadsheetApp.openById(CONFIG.REPORTES_SS_ID);
    const s = ss.getSheetByName(CONFIG.REPORTES_SHEET_NAME);
    const colMap = _getColMap(s);
    
    const currentRow = s.getRange(rowIdx, 1, 1, s.getLastColumn()).getValues()[0];
    const existingTrainer = (currentRow[colMap.TRAINER] || currentRow[1] || "").toString().trim().toLowerCase();
    const incomingTrainer = (data.trainer || "").toString().trim().toLowerCase();
    const isAdmin = CONFIG.ADMINS.some(a => a.toLowerCase() === incomingTrainer) || /Manager|Coordinator|Creator/i.test(incomingTrainer);
    
    if (existingTrainer !== incomingTrainer && !isAdmin) {
        return { status: "error", message: "No tienes permiso para editar." };
    }

    var newPhotoUrls = _uploadPhotos(p.photos, data);
    // IMPORTANTE: Respetar la selección de fotos del frontend (permite borrar fotos antiguas)
    const keptPhotos = (data.existingPhotos || "").toString().trim();
    
    let finalPhotos = keptPhotos;
    if (newPhotoUrls.length > 0) {
        finalPhotos = keptPhotos ? (keptPhotos + "\n" + newPhotoUrls.join("\n")) : newPhotoUrls.join("\n");
    }

    // Limpiar y convertir a número
    const cleanNum = (v) => {
        if (v === undefined || v === null || v === "") return 0;
        const s = v.toString().replace(',', '.').replace(/[^0-9.]/g, '');
        return parseFloat(s) || 0;
    };

    const rowData = [...currentRow];
    
    if (colMap.TRAINER !== undefined) rowData[colMap.TRAINER] = data.trainer;
    if (colMap.FECHA !== undefined) rowData[colMap.FECHA] = data.fecha;
    if (colMap.CUENTA !== undefined) rowData[colMap.CUENTA] = data.cuenta;
    if (colMap.DISTRIBUIDOR !== undefined) rowData[colMap.DISTRIBUIDOR] = data.distribuidor;
    if (colMap.METODOLOGIA !== undefined) rowData[colMap.METODOLOGIA] = data.metodologia;
    if (colMap.SESIONES !== undefined) rowData[colMap.SESIONES] = cleanNum(data.sesiones);
    if (colMap.ALUMNOS !== undefined) rowData[colMap.ALUMNOS] = cleanNum(data.alumnos);
    if (colMap.PROVINCIA !== undefined) rowData[colMap.PROVINCIA] = data.provincia;
    if (colMap.HORAS !== undefined) rowData[colMap.HORAS] = cleanNum(data.duracion);
    if (colMap.TIENDAS !== undefined) rowData[colMap.TIENDAS] = cleanNum(data.tiendas);
    if (colMap.PERFIL !== undefined) rowData[colMap.PERFIL] = data.perfil;
    if (colMap.CIUDAD !== undefined) rowData[colMap.CIUDAD] = data.ciudad;
    if (colMap.CONTENIDOS !== undefined) rowData[colMap.CONTENIDOS] = data.contenidos;
    if (colMap.DISP_MOVIL !== undefined) rowData[colMap.DISP_MOVIL] = data.dispositivos;
    if (colMap.DISP_ECO !== undefined) rowData[colMap.DISP_ECO] = data.dispositivos_no_movil;
    if (colMap.COMENTARIOS !== undefined) rowData[colMap.COMENTARIOS] = data.comentarios;
    if (colMap.FOTOS !== undefined) rowData[colMap.FOTOS] = finalPhotos;
    
    s.getRange(rowIdx, 1, 1, rowData.length).setValues([rowData]);
    if (isAdmin && existingTrainer !== incomingTrainer) notifyUser(currentRow[1], "Se ha actualizado un reporte. Revísalo en tu historial", "Admin");
    
    _invalidateCache(CONFIG.REPORTES_SS_ID, CONFIG.REPORTES_SHEET_NAME);
    return { status: "success", message: "Reporte editado correctamente" };
  } catch(e) { return { status: "error", message: e.toString() }; } finally { SpreadsheetApp.flush(); lock.releaseLock(); }
}

function deleteReport(p) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const id = p.id;
    if (!id) throw new Error("ID de reporte no proporcionado.");
    
    const s = SpreadsheetApp.openById(CONFIG.REPORTES_SS_ID).getSheetByName(CONFIG.REPORTES_SHEET_NAME);
    const colMap = _getColMap(s);
    const d = s.getDataRange().getValues();
    
    let targetRow = -1;
    for (let i = d.length - 1; i >= 1; i--) {
      // FIX SENIOR: El timestamp debe ser consistente incluso si viene de caché (string) o de hoja (Date)
      const dVal = d[i][0];
      let rowTimestamp = 0;
      if (dVal) {
          const parsed = (dVal instanceof Date) ? dVal : new Date(dVal);
          rowTimestamp = isNaN(parsed.getTime()) ? 0 : parsed.getTime();
      }
      const currentUniqueId = "RID_" + rowTimestamp + "_" + i;
      
      if (currentUniqueId === id) {
        targetRow = i + 1;
        break;
      }
    }
    
    if (targetRow === -1) throw new Error("No se encontró el reporte.");
    
    s.deleteRow(targetRow);
    _invalidateCache(CONFIG.REPORTES_SS_ID, CONFIG.REPORTES_SHEET_NAME);
    return { status: "success", message: "Reporte eliminado" };
  } catch(e) { return { status: "error", message: e.toString() }; } finally { SpreadsheetApp.flush(); lock.releaseLock(); }
}

function getWeekNumber(d) {
  var d2 = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d2.setUTCDate(d2.getUTCDate() + 4 - (d2.getUTCDay() || 7));
  return Math.ceil((((d2 - new Date(Date.UTC(d2.getUTCFullYear(), 0, 1))) / 86400000) + 1) / 7);
}

function getCitiesList() {
  const ss = SpreadsheetApp.openById(CONFIG.REPORTES_SS_ID);
  const s = ss.getSheetByName(CONFIG.REPORTES_SHEET_NAME);
  const colMap = _getColMap(s);
  const d = _getValuesCached(CONFIG.REPORTES_SS_ID, CONFIG.REPORTES_SHEET_NAME);
  return { status:"success", data:Array.from(new Set(d.slice(1).map(r=>(r[colMap.CIUDAD]||"").toString().trim()).filter(Boolean))) };
}

function getFilterMetadata() {
  const ss = SpreadsheetApp.openById(CONFIG.REPORTES_SS_ID);
  const s = ss.getSheetByName(CONFIG.REPORTES_SHEET_NAME);
  const colMap = _getColMap(s);
  const d = _getValuesCached(CONFIG.REPORTES_SS_ID, CONFIG.REPORTES_SHEET_NAME);
  
  var ys = new Set(), ms = new Set(), devs = new Set(), accounts = new Set(), methodologies = new Set();
  var mNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  
  for (var i=1; i<d.length; i++) {
    var fVal = colMap.FECHA !== undefined ? d[i][colMap.FECHA] : d[i][2];
    if (!fVal) continue;
    var dO = parseDateStable(fVal);
    if(dO) { ys.add(dO.getFullYear().toString()); ms.add(mNames[dO.getMonth()]); }
    if(d[i][colMap.CUENTA]) accounts.add(d[i][colMap.CUENTA].toString().trim());
    if(d[i][colMap.METODOLOGIA]) methodologies.add(d[i][colMap.METODOLOGIA].toString().trim());
    
    var d1 = (d[i][colMap.DISP_MOVIL]||"").toString().split(',');
    var d2 = (d[i][colMap.DISP_ECO]||"").toString().split(',');
    d1.concat(d2).forEach(item => {
      var t = item.trim();
      if(t && t !== "0" && t !== "-") devs.add(t);
    });
  }
  return { status:"success", data: { years: Array.from(ys).sort().reverse(), months: Array.from(ms), accounts: Array.from(accounts).sort(), methodologies: Array.from(methodologies).sort(), devices: Array.from(devs).sort() } };
}

function _uploadPhotos(photos, data) {
  var photoUrls = [];
  if (photos && photos.length > 0) {
    try {
      var folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
      
      var cleanName = function(str) {
        if (!str) return "";
        return str.toString().trim()
          .replace(/[\/\?%\*:\x22<>\|]/g, '') // remove invalid filename chars
          .replace(/\s+/g, '_'); // replace spaces with underscores
      };
      
      var trainer = cleanName(data && data.trainer ? data.trainer : "usuario");
      var tienda = cleanName(data && data.cuenta ? data.cuenta : "tienda");
      var fecha = cleanName(data && data.fecha ? data.fecha : "fecha");
      
      for (var i=0; i<photos.length; i++) {
          var p = photos[i];
          if (p && p.base64Data) {
              try {
                var splitted = p.base64Data.split(',');
                // El replace(/\s/g, '') arregla los saltos de línea de iOS/Android que rompen el decodificador
                var base64 = (splitted.length > 1 ? splitted[1] : splitted[0]).replace(/\s/g, ''); 
                
                var ext = "jpg";
                if (p.mimeType && p.mimeType.indexOf("/") !== -1) {
                  ext = p.mimeType.split("/")[1];
                }
                var fileName = trainer + "_" + tienda + "_" + fecha + "_" + (i + 1) + "." + ext;
                var blob = Utilities.newBlob(Utilities.base64Decode(base64), p.mimeType || "image/jpeg", fileName);
                var file = folder.createFile(blob);
                file.setName(fileName); // Force Google Drive to set the clean filename
                photoUrls.push(file.getUrl());
              } catch(err) { console.error("Error individual photo:", err); }
          }
      }
    } catch(e) { console.error("Error uploading photos:", e); }
  }
  return photoUrls;
}

function handleSaveReport(data, photos) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const s = SpreadsheetApp.openById(CONFIG.REPORTES_SS_ID).getSheetByName(CONFIG.REPORTES_SHEET_NAME);
    const colMap = _getColMap(s);
    
    // Limpiar y convertir a número de forma segura
    const cleanNum = (v) => {
        if (v === undefined || v === null || v === "") return 0;
        const s = v.toString().replace(',', '.').replace(/[^0-9.]/g, '');
        return parseFloat(s) || 0;
    };

    var photoUrls = _uploadPhotos(photos, data);
    var urlsString = photoUrls.join("\n");
    
    // Obtenemos el número real de columnas de la hoja
    const totalCols = Math.max(s.getLastColumn(), 20); // Asegura al menos 20 huecos de memoria
    const rowData = new Array(totalCols).fill(""); 
    
    // Asignación segura basada en el colMap
    rowData[0] = new Date(); // Asumimos que la Col A (índice 0) es Timestamp
    
    if (colMap.TRAINER !== undefined) rowData[colMap.TRAINER] = data.trainer;
    if (colMap.FECHA !== undefined) rowData[colMap.FECHA] = data.fecha;
    if (colMap.CUENTA !== undefined) rowData[colMap.CUENTA] = data.cuenta;
    if (colMap.DISTRIBUIDOR !== undefined) rowData[colMap.DISTRIBUIDOR] = data.distribuidor;
    if (colMap.METODOLOGIA !== undefined) rowData[colMap.METODOLOGIA] = data.metodologia;
    if (colMap.SESIONES !== undefined) rowData[colMap.SESIONES] = cleanNum(data.sesiones);
    if (colMap.ALUMNOS !== undefined) rowData[colMap.ALUMNOS] = cleanNum(data.alumnos);
    if (colMap.PROVINCIA !== undefined) rowData[colMap.PROVINCIA] = data.provincia;
    if (colMap.HORAS !== undefined) rowData[colMap.HORAS] = cleanNum(data.duracion);
    if (colMap.TIENDAS !== undefined) rowData[colMap.TIENDAS] = cleanNum(data.tiendas);
    if (colMap.PERFIL !== undefined) rowData[colMap.PERFIL] = data.perfil;
    if (colMap.CIUDAD !== undefined) rowData[colMap.CIUDAD] = data.ciudad;
    if (colMap.CONTENIDOS !== undefined) rowData[colMap.CONTENIDOS] = data.contenidos;
    if (colMap.DISP_MOVIL !== undefined) rowData[colMap.DISP_MOVIL] = data.dispositivos;
    if (colMap.DISP_ECO !== undefined) rowData[colMap.DISP_ECO] = data.dispositivos_no_movil;
    if (colMap.COMENTARIOS !== undefined) rowData[colMap.COMENTARIOS] = data.comentarios;
    if (colMap.FOTOS !== undefined) rowData[colMap.FOTOS] = urlsString;
    
    s.appendRow(rowData);
    _invalidateCache(CONFIG.REPORTES_SS_ID, CONFIG.REPORTES_SHEET_NAME);
    return { status:"success" };
  } catch(e) { return { status: "error", message: e.toString() }; } finally { lock.releaseLock(); }
}

function getMessages(p) {
  try {
    const target = (p.targetUser || "").toString().trim().toLowerCase();
    const ss = SpreadsheetApp.openById(CONFIG.USUARIOS_SS_ID);
    const smsg = ss.getSheetByName(CONFIG.MENSAJES_SHEET_NAME) || ss.insertSheet(CONFIG.MENSAJES_SHEET_NAME);
    const d = smsg.getDataRange().getValues();
    const result = [];
    for (let i = 1; i < d.length; i++) {
        const rowTo = (d[i][2] || "").toString().toLowerCase();
        const isAdmin = CONFIG.ADMINS.some(a => a.toLowerCase() === target) || /Manager|Coordinator|Creator/i.test(target);
        if ((rowTo === target) || (isAdmin && rowTo === "admin")) {
            result.push({ id: d[i][0], date: d[i][1], to: d[i][2], from: d[i][3], text: d[i][4], read: d[i][5] === true || (d[i][5] && d[i][5].toString().toUpperCase() === "TRUE") });
        }
    }
    return { status: "success", data: result.reverse() };
  } catch(e) { return { status: "error", message: e.toString() }; }
}

function handleMarkMessageRead(p) {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
      const ss = SpreadsheetApp.openById(CONFIG.USUARIOS_SS_ID);
      const smsg = ss.getSheetByName(CONFIG.MENSAJES_SHEET_NAME);
      if (!smsg) return { status: "error", message: "No sheet" };
      const d = smsg.getDataRange().getValues();
      for (let i = 1; i < d.length; i++) {
        if (d[i][0].toString() === p.msgId.toString()) {
          smsg.getRange(i+1, 6).setValue("TRUE");
          return { status: "success" };
        }
      }
      return { status: "error", message: "Not found ID" };
    } catch(e) { return { status: "error", message: e.toString() }; } finally { SpreadsheetApp.flush(); lock.releaseLock(); }
}

function handleMarkAllMessagesRead(p) {
    const lock = LockService.getScriptLock();
    try {
        lock.waitLock(10000);
        const target = (p.user || "").toString().trim().toLowerCase();
        const ss = SpreadsheetApp.openById(CONFIG.USUARIOS_SS_ID);
        const smsg = ss.getSheetByName(CONFIG.MENSAJES_SHEET_NAME);
        if (!smsg) return { status: "success" };
        const d = smsg.getDataRange().getValues();
        const isAdmin = CONFIG.ADMINS.some(a => a.toLowerCase() === target) || /Manager|Coordinator|Creator/i.test(target);
        
        for (let i = 1; i < d.length; i++) {
            const rowTo = (d[i][2] || "").toString().toLowerCase();
            const matches = (rowTo === target) || (isAdmin && rowTo === "admin");
            if (matches && d[i][5].toString().toUpperCase() !== "TRUE") {
                smsg.getRange(i+1, 6).setValue("TRUE");
            }
        }
        return { status: "success" };
    } catch(e) { return { status: "error", message: e.toString() }; } finally { SpreadsheetApp.flush(); lock.releaseLock(); }
}

function notifyAdmins(text, fromUser) {
    try {
        const safeUser = (fromUser || "").toString();
        const isAdmin = CONFIG.ADMINS.some(a => a.toLowerCase() === safeUser.toLowerCase()) || /Manager|Coordinator|Creator/i.test(safeUser);
        if (isAdmin) return;
        const ss = SpreadsheetApp.openById(CONFIG.USUARIOS_SS_ID);
        let smsg = ss.getSheetByName(CONFIG.MENSAJES_SHEET_NAME);
        if (!smsg) smsg = ss.insertSheet(CONFIG.MENSAJES_SHEET_NAME);
        if (smsg.getLastRow() === 0) smsg.appendRow(["ID", "Date", "ToUser", "FromUser", "Text", "Read"]);
        smsg.appendRow([ Date.now() + Math.floor(Math.random()*1000), new Date(), "Admin", safeUser, text, "FALSE" ]);
    } catch(e) {}
}

function notifyAllUsers(text) {
    try {
        const dU = _getValuesCached(CONFIG.USUARIOS_SS_ID, CONFIG.USUARIOS_SHEET_NAME);
        dU.slice(1).forEach(r => notifyUser(r[0].toString(), text));
    } catch(e) {}
}

function notifyUser(toUser, text, fromUser) {
    try {
        const ss = SpreadsheetApp.openById(CONFIG.USUARIOS_SS_ID);
        let smsg = ss.getSheetByName(CONFIG.MENSAJES_SHEET_NAME);
        if (!smsg) smsg = ss.insertSheet(CONFIG.MENSAJES_SHEET_NAME);
        smsg.appendRow([ Date.now() + Math.floor(Math.random()*1000), new Date(), toUser, fromUser || "System", text, "FALSE" ]);
    } catch(e) {}
}

function getWeeklySchedule(p) {
  try {
    const start = p.start, end = p.end;
    const dPlan = _getValuesCached(CONFIG.USUARIOS_SS_ID, CONFIG.PLANIFICACION_SHEET_NAME);
    const dVacas = _getValuesCached(CONFIG.USUARIOS_SS_ID, CONFIG.VACACIONES_SHEET_NAME);
    const dFest = _getValuesCached(CONFIG.USUARIOS_SS_ID, CONFIG.FESTIVOS_SHEET_NAME);
    const users = getUsersList().data || [];

    const scheduleByDay = {};
    for (let i = 1; i < dPlan.length; i++) {
        const dO = parseDateStable(dPlan[i][2]);
        if (!dO) continue;
        const dStr = dO.getFullYear() + "-" + ("0" + (dO.getMonth() + 1)).slice(-2) + "-" + ("0" + dO.getDate()).slice(-2);
        if (dStr >= start && dStr <= end) {
            if (!scheduleByDay[dStr]) scheduleByDay[dStr] = {};
            const u = (dPlan[i][1]||"").toString();
            if (!u) continue;
            if (!scheduleByDay[dStr][u]) scheduleByDay[dStr][u] = [];
            scheduleByDay[dStr][u].push({ id: dPlan[i][0], text: dPlan[i][3], category: dPlan[i][4] });
        }
    }

    const blocks = {};
    const normalizedBlocks = {}; 
    users.forEach(u => {
      const data = { vacationInfo: [], festivos: [] };
      blocks[u.user] = data; 
      normalizedBlocks[(u.user || "").toString().trim().toLowerCase()] = data;
    });

    for (let i = 1; i < dFest.length; i++) {
        const uKey = (dFest[i][0]||"").toString().trim().toLowerCase();
        if (normalizedBlocks[uKey]) {
            for (let col = 3; col < dFest[i].length; col++) {
                const dO = parseDateStable(dFest[i][col]);
                if (dO) {
                    const fStr = dO.getFullYear() + "-" + ("0" + (dO.getMonth() + 1)).slice(-2) + "-" + ("0" + dO.getDate()).slice(-2);
                    if (fStr >= start && fStr <= end) {
                        normalizedBlocks[uKey].festivos.push(fStr);
                        normalizedBlocks[uKey][fStr] = "FESTIVO";
                    }
                }
            }
        }
    }

    for (let i = 1; i < dVacas.length; i++) {
        const uKey = (dVacas[i][1]||"").toString().trim().toLowerCase();
        const status = dVacas[i][5];
        if (normalizedBlocks[uKey] && (status === "Aprobado" || status === "Pendiente")) {
            normalizedBlocks[uKey].vacationInfo.push({ fechas: dVacas[i][2], status: status });
        }
    }
    return { status: "success", schedule: scheduleByDay, blocks: blocks };
  } catch(e) { return { status: "error", message: "getWeekly error: " + e.toString() }; }
}

function adminProcessSelection(req) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const action = req.opAction; 
    if (action === 'notify_materials') {
        notifyAllUsers("Nuevos materiales disponibles en tu repositorio.");
        return { status: "success" };
    }

    const ss = SpreadsheetApp.openById(CONFIG.USUARIOS_SS_ID);
    const s = ss.getSheetByName(CONFIG.VACACIONES_SHEET_NAME);
    const userNorm = req.user.trim().toLowerCase();

    if (action === 'remove') {
      const d = s.getDataRange().getValues();
      const datesToRemove = req.dates; 
      const toISO = (dateObj) => dateObj.getFullYear() + "-" + String(dateObj.getMonth() + 1).padStart(2, '0') + "-" + String(dateObj.getDate()).padStart(2, '0');

      let newData = [d[0]]; 
      let newIndividualDays = [];

      for (let i = 1; i < d.length; i++) {
        if (d[i][1].toString().trim().toLowerCase() !== userNorm) {
            newData.push(d[i]); 
            continue;
        }
        
        const rangeStr = d[i][2].toString();
        const type = d[i][4];
        const matches = rangeStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/g);
        
        if (!matches) { newData.push(d[i]); continue; }
        
        const parseMatch = (str) => {
            const p = str.split('/');
            let y = parseInt(p[2]); if(y < 100) y += 2000;
            return new Date(y, parseInt(p[1]) - 1, parseInt(p[0]));
        };

        const startDate = parseMatch(matches[0]);
        const endDate = matches.length > 1 ? parseMatch(matches[matches.length - 1]) : startDate;
        
        let daysInRow = [];
        let cur = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        let curEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        
        while(cur.getTime() <= curEnd.getTime()) {
           daysInRow.push(new Date(cur.getTime()));
           cur.setDate(cur.getDate()+1);
        }

        let thisRowRemoved = false;
        let daysToKeep = [];

        daysInRow.forEach(day => {
            if (datesToRemove.includes(toISO(day))) { thisRowRemoved = true; }
            else daysToKeep.push(day);
        });

        if (thisRowRemoved) {
            daysToKeep.forEach(day => newIndividualDays.push({date: day, type: type, originalDateVal: d[i][0]}));
        } else {
            newData.push(d[i]); 
        }
      }

      const mNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
      newIndividualDays.forEach((obj, idx) => {
          const dObj = obj.date;
          const label = "Día " + Utilities.formatDate(dObj, Session.getScriptTimeZone(), "dd/MM/yy");
          const mLabel = mNames[dObj.getMonth()] + " " + dObj.getFullYear();
          const id = "ADM_" + Date.now() + "_" + Math.floor(Math.random()*1000) + "_" + idx;
          newData.push([obj.originalDateVal, req.user, label, mLabel, obj.type, "Aprobado", 1, id]);
      });

      s.clearContents();
      if(newData.length > 0) s.getRange(1, 1, newData.length, newData[0].length).setValues(newData);

      const smsg = ss.getSheetByName(CONFIG.MENSAJES_SHEET_NAME);
      if (smsg) {
          const dMsg = smsg.getDataRange().getValues();
          for (let i = 1; i < dMsg.length; i++) {
              if (dMsg[i][2] === "Admin" && (dMsg[i][4]||"").toString().includes(req.user) && dMsg[i][5].toString().toUpperCase() === "FALSE") {
                  smsg.getRange(i+1, 6).setValue("TRUE");
              }
          }
      }

      _invalidateCache(CONFIG.USUARIOS_SS_ID, CONFIG.VACACIONES_SHEET_NAME);
      notifyUser(req.user, `Admin ha ELIMINADO vacaciones/días extra de tu calendario para: ${req.dates.join(", ")}.`);
      return { status: "success", action: "removed" };
    } else {
      const type = (action === 'add_vacation') ? 'Vacaciones' : 'Dias Extras';
      const mNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
      const groups = {};
      
      req.dates.forEach(dStr => {
          const d = parseDateStable(dStr);
          if(d) {
              const mLabel = mNames[d.getMonth()] + " " + d.getFullYear();
              if(!groups[mLabel]) groups[mLabel] = [];
              groups[mLabel].push(dStr); 
          }
      });
      
      Object.keys(groups).forEach((m, idx) => {
          const sDates = groups[m].sort();
          let label = sDates.length > 1 
            ? "Del " + Utilities.formatDate(parseDateStable(sDates[0]), Session.getScriptTimeZone(), "dd/MM/yy") + " al " + Utilities.formatDate(parseDateStable(sDates[sDates.length - 1]), Session.getScriptTimeZone(), "dd/MM/yy")
            : "Día " + Utilities.formatDate(parseDateStable(sDates[0]), Session.getScriptTimeZone(), "dd/MM/yy");
          const id = "ADM_" + Date.now() + "_" + Math.floor(Math.random()*1000) + "_" + idx;
          s.appendRow([new Date(), req.user, label, m, type, "Aprobado", sDates.length, id]);
      });

      _invalidateCache(CONFIG.USUARIOS_SS_ID, CONFIG.VACACIONES_SHEET_NAME);
      notifyUser(req.user, `Admin ha ASIGNADO ${type} en tu calendario para: ${req.dates.join(", ")}.`);
      return { status: "success", action: "added" };
    }
  } catch(e) { return { status: "error", message: e.toString() }; } finally { SpreadsheetApp.flush(); lock.releaseLock(); }
}

function saveWeeklyAssignment(req) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = SpreadsheetApp.openById(CONFIG.USUARIOS_SS_ID);
    const s = ss.getSheetByName(CONFIG.PLANIFICACION_SHEET_NAME);
    const d = s.getDataRange().getValues();
    
    let newData = [d[0]];
    for (let i = 1; i < d.length; i++) {
        const pDate = parseDateStable(d[i][2]);
        if (!pDate) continue;
        
        const dStr = pDate.getFullYear() + "-" + ("0" + (pDate.getMonth() + 1)).slice(-2) + "-" + ("0" + pDate.getDate()).slice(-2);
        if (!(d[i][1] === req.user && dStr === req.date)) {
            newData.push(d[i]);
        }
    }
    
    if (req.items && req.items.length > 0) {
      req.items.forEach(it => {
        newData.push([Date.now(), req.user, req.date, it.text, it.category, req.modifiedBy || '']);
      });
    }
    
    s.clearContents();
    if (newData.length > 0) s.getRange(1, 1, newData.length, newData[0].length).setValues(newData);
    
    _invalidateCache(CONFIG.USUARIOS_SS_ID, CONFIG.PLANIFICACION_SHEET_NAME);
    notifyUser(req.user, "Se ha actualizado tu planificación semanal.");
    return { status: "success" };
  } catch(e) { return { status: "error", message: e.toString() }; } finally { SpreadsheetApp.flush(); lock.releaseLock(); }
}

function parseDateStable(val) {
  if (!val) return null;
  
  // 1. Si es un objeto Date nativo de Google Sheets (lectura fresca)
  if (val instanceof Date && !isNaN(val.getTime())) {
    // Hack senior: sumamos 6 horas al UTC para evitar que el desfase 
    // de medianoche local tire la fecha al día anterior.
    const d = new Date(val.getTime() + (6 * 60 * 60 * 1000));
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0, 0);
  }
  
  try {
    const s = val.toString().trim();
    
    // 2. EL FIX DEL BUG DE LA CACHÉ: 
    // Si viene congelado de la caché en formato UTC (ej: "2026-04-30T22:00:00.000Z")
    if (s.includes('T') && s.endsWith('Z')) {
        const d = new Date(s);
        // Le sumamos 6 horas virtuales para que pase de las 22:00 a las 04:00 del día correcto
        d.setTime(d.getTime() + (6 * 60 * 60 * 1000));
        return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0, 0);
    }
    
    // 3. String puro (ej: "15/04/2026" o "2026-04-15") escrito a mano
    const p = s.split(/[-\/]/); 
    if (p.length === 3 && !s.includes('T')) {
      let dd, mm, yy;
      // Detectamos el orden según si el año va primero o último
      if (p[0].length === 4) { yy = parseInt(p[0]); mm = parseInt(p[1]); dd = parseInt(p[2]); }
      else { dd = parseInt(p[0]); mm = parseInt(p[1]); yy = parseInt(p[2]); }
      if (yy < 100) yy += 2000;
      // Fijamos a mediodía para tener margen por ambos lados
      return new Date(yy, mm - 1, dd, 12, 0, 0, 0); 
    }
    
    // 4. Fallback genérico
    const d = new Date(val);
    if (!isNaN(d.getTime())) { d.setHours(12, 0, 0, 0); return d; }
    return null;
  } catch(e) { return null; }
}

// --- AUTO-LIMPIEZA AL EDITAR EL EXCEL MANUALMENTE ---
function onManualSheetChange(e) {
  // Limpia la caché de los reportes automáticamente si alguien borra o edita una fila a mano
  CacheService.getScriptCache().remove(CONFIG.REPORTES_SS_ID + "_" + CONFIG.REPORTES_SHEET_NAME);
}
