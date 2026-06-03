// ==================================================
// XIAOMI VISUAL APP - Backend V5.1 (Fixed Pro)
// ==================================================

const CONFIG = {
  SS_ID: "1Xht-QU2wRpWNBgT0dqyJkfM9SHD610mhO9y-W3lzonM",
  DRIVE_FOLDER_ID: "1e5uJurcqaTgDGfgHlp2vKyWmpOFhV_-U",
  LOCK_TIMEOUT: 15000 
};

function doGet(e) {
  const callback = e.parameter.callback;
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SS_ID);
    const action = e.parameter.action;
    
    let result;
    switch (action) {
      case 'getUserList':
        result = getUserList(ss);
        console.log("getUserList result:", result);
        break;
      case 'getDashboardData':
        result = getDashboardData(ss, e.parameter.rol);
        break;
      case 'getLaunches':
        result = getDataFromSheet(ss, 'Lanzamientos');
        break;
      case 'getMaterials':
        result = getDataFromSheet(ss, 'Materiales');
        break;
      case 'getLaunchStatuses':
        result = getLaunchStatuses(ss, e.parameter.usuario, e.parameter.lanzamiento);
        break;
      case 'getDiagnostics':
        result = getDiagnostics(ss);
        break;
      case 'getDevices':
        result = getDataFromSheet(ss, 'Dispositivos');
        break;
      case 'getMessagingUsers':
        result = getMessagingUsers(ss);
        break;
      case 'getMessages':
        result = getUserMessages(ss, e.parameter.email);
        break;
      case 'getMaterials':
        result = getDataFromSheet(ss, 'Materiales');
        break;
      default:
        result = { success: false, message: 'Acción GET no válida' };
    }
    return jsonResponse(result, callback);
  } catch (err) {
    return jsonResponse({ success: false, message: 'Error en doGet: ' + err.toString() }, callback);
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ success: false, message: 'Cuerpo de petición vacío' });
    }
    
    const ss = SpreadsheetApp.openById(CONFIG.SS_ID);
    const data = JSON.parse(e.postData.contents);
    
    switch (data.action) {
      case 'getMaterials':
        return jsonResponse(getDataFromSheet(ss, 'Materiales'));
      case 'login':
        return jsonResponse(handleLogin(ss, data.email, data.password));
      case 'submitReport':
        return jsonResponse(handleSubmitReport(ss, data));
      case 'submitLaunchChecklist':
        return jsonResponse(handleSubmitLaunchChecklist(ss, data));
      case 'submitCustomLaunchForm':
        return jsonResponse(handleSubmitCustomLaunchForm(ss, data));
      case 'uploadFile':
        return jsonResponse(handleFileUpload(data));
      case 'resolveIncident':
        return jsonResponse(resolveIncident(ss, data));
      case 'getLaunchStatuses':
        return jsonResponse(getLaunchStatuses(ss, data.usuario, data.lanzamiento));
      case 'deleteLaunchValidation':
        return jsonResponse(deleteLaunchValidation(ss, data.id));
      case 'updateLaunchValidation':
        return jsonResponse(updateLaunchValidation(ss, data));
      case 'deleteReport':
        return jsonResponse(deleteReport(ss, data.id));
      case 'getMessagingUsers':
        return jsonResponse(getMessagingUsers(ss));
      case 'sendMessage':
        return jsonResponse(sendInstantMessage(ss, data));
      case 'getMessages':
        return jsonResponse(getUserMessages(ss, data.email));
      case 'markMessageRead':
        return jsonResponse(markInstantMessageRead(ss, data.messageId));
      default:
        return jsonResponse({ success: false, message: 'Acción POST no válida' });
    }
  } catch (err) {
    return jsonResponse({ success: false, message: 'Error en doPost: ' + err.toString() });
  }
}

function jsonResponse(data, callback) {
  const output = JSON.stringify(data);
  if (callback) {
    return ContentService.createTextOutput(callback + "(" + output + ")")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(output)
    .setMimeType(ContentService.MimeType.JSON);
}

function generateUUID(prefix) {
  return prefix + "-" + Math.random().toString(36).substr(2, 9).toUpperCase();
}

function getSheetDefensive(ss, name) {
  const sheets = ss.getSheets();
  const lowerName = name.toLowerCase().trim();
  let sheet = ss.getSheetByName(name);
  if (sheet) return sheet;
  sheet = sheets.find(s => {
    const sName = s.getName().toLowerCase().trim();
    return sName === lowerName || sName.includes(lowerName) || lowerName.includes(sName);
  });
  return sheet || null;
}

function getDataFromSheet(ss, sheetName) {
  const sheet = getSheetDefensive(ss, sheetName);
  if (!sheet) return [];
  const data = getFastValues(sheet);
  if (data.length <= 1) return [];
  const headers = data.shift();
  
  const tz = ss.getSpreadsheetTimeZone();
  return data.map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      let val = row[i];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, tz, "yyyy-MM-dd");
      }
      const key = h.toString().trim();
      obj[key] = val;
      obj['col' + i] = val; // Añadimos acceso directo por índice numérico para robustez
    });
    return obj;
  });
}

function getUserList(ss) {
  const sheet = getSheetDefensive(ss, 'Usuarios');
  if (!sheet) return [];
  const data = getFastValues(sheet);
  if (data.length <= 1) return [];
  data.shift();
  // Estructura: A: Usuario, B: Password, C: Rol
  return data.map(r => ({ email: r[0], nombre: r[0] })).filter(u => u.email);
}

function handleLogin(ss, email, password) {
  const sheet = getSheetDefensive(ss, 'Usuarios');
  if (!sheet) return { success: false, message: 'Error: Hoja Usuarios no encontrada' };
  
  const data = getFastValues(sheet);
  data.shift();
  
  // r[0]: Usuario, r[1]: Password, r[2]: Rol
  const user = data.find(r => String(r[0]).trim().toLowerCase() === String(email).trim().toLowerCase() && String(r[1]).trim() === String(password).trim());
  if (user) {
    const storesSheet = getSheetDefensive(ss, 'Tiendas');
    let userStores = [];
    let debugInfo = {};
    if (storesSheet) {
      const sData = getFastValues(storesSheet);
      const headers = sData.shift();
      const userRole = String(user[2] || '').trim().toUpperCase();
      const isAdmin = userRole === 'ADMIN' || userRole === 'ADMINISTRADOR';
      const cleanEmail = String(email || '').trim().toLowerCase();
      
      userStores = sData.filter(r => {
        const storeUser = String(r[3] || '').trim().toLowerCase(); // Columna D (índice 3) es USUARIO
        if (isAdmin) {
            return true; // Devolver todas las tiendas para el Admin, pero con la info del usuario incluida
        }
        return storeUser === cleanEmail;
      }).map(r => ({
        nombre: r[2],  // Columna C (índice 2) es Tienda (Nombre)
        cuenta: r[1],  // Columna B (índice 1) es Cuenta
        rms: r[0] || '', // Columna A (índice 0) es Codigo RMS
        usuario: r[3] || '' // Columna D (índice 3) es Usuario asignado
      }));
      
      debugInfo = {
        isAdmin: isAdmin,
        userRole: userRole,
        cleanEmail: cleanEmail,
        totalStoresInSheet: sData.length,
        headers: headers,
        sampleRow: sData[0] || []
      };
    }
    
    return { 
      success: true, 
      user: { 
        nombre: user[0], 
        email: user[0], 
        rol: user[2],
        tiendas: userStores
      },
      debug: debugInfo
    };
  }
  return { success: false, message: 'Usuario o contraseña incorrectos' };
}

function getDashboardData(ss, rol) {
  const mobSheet = getSheetDefensive(ss, 'Reporte mobiliario');
  const devSheet = getSheetDefensive(ss, 'Reporte dispositivo');
  
  let mobReports = getFastValues(mobSheet);
  let devReports = getFastValues(devSheet);
  
  let allReports = [];
  let openTotal = 0;
  let pendingTotal = 0;
  
  const tz = ss.getSpreadsheetTimeZone();

  // 1. Procesar Mobiliario
  if (mobReports.length > 1) {
    mobReports.shift();
    mobReports.forEach(r => {
      if (!r[0]) return; 
      const est = String(r[11] || '').trim().toLowerCase(); 
      if (est === 'abierta') openTotal++;
      if (est === 'pendiente') pendingTotal++;
      
      allReports.push({
        id: r[0],
        fecha: r[1] instanceof Date ? Utilities.formatDate(r[1], tz, "yyyy-MM-dd HH:mm:ss") : r[1],
        usuario: r[2],
        cuenta: r[3],
        tienda: r[4],
        categoria: 'Mobiliario',
        subcategoria: r[7],
        enviar: r[8],
        motivo: r[9],
        descripcion: r[10], 
        estado: r[11],  
        tiempo: r[12],  
        fotos: r[13] || '',
        tipo: `Mobiliario: ${r[7] || ''} > ${r[9] || ''}`
      });
    });
  }

  // 2. Procesar Dispositivo: AGRUPAR POR ID
  if (devReports.length > 1) {
    devReports.shift();
    const devMap = {};
    
    devReports.forEach(r => {
      if (!r[0]) return;
      const id = r[0];
      const item = {
        tipoReporte: r[2] || '',
        tipologia: r[8] || '',
        modelo: r[9] || '',
        codigoDispositivo: r[10] || '',
        cantidad: r[11] || 1
      };
      
      if (!devMap[id]) {
        const est = String(r[16] || '').trim().toLowerCase();
        if (est === 'abierta') openTotal++;
        if (est === 'pendiente') pendingTotal++;
        
        devMap[id] = {
          id: id,
          fecha: r[1] instanceof Date ? Utilities.formatDate(r[1], tz, "yyyy-MM-dd HH:mm:ss") : r[1],
          usuario: r[3],
          cuenta: r[4],
          tienda: r[5],
          categoria: 'Dispositivo',
          tipologia: r[8] || '', 
          subcategoria: r[12],
          enviar: r[13],
          motivo: r[14],
          descripcion: r[15],
          estado: r[16],
          tiempo: r[17],
          fotos: r[18] || '',
          dispositivos: [item],
          // Armar texto del tipo dinámico
          tipo: `Dispositivo: ${r[12] || ''} > ${r[14] || ''}`
        };
      } else {
        devMap[id].dispositivos.push(item);
      }
    });
    
    // Volcar a allReports
    Object.keys(devMap).forEach(k => allReports.push(devMap[k]));
  }

  // Invertir para tener últimos primero por defecto en array separado de las incidencias de lanzamiento
  allReports = allReports.reverse();

  const incSheet = getSheetDefensive(ss, 'Incidencias Lanzamientos');
  let incidentStats = { total: 0, abiertos: 0, pendientes: 0 };
  let mappedIncidents = [];
  if (incSheet) {
    const incData = getFastValues(incSheet);
    if (incData.length > 1) {
      incData.shift();
      incidentStats.total = incData.length;
      incData.forEach(row => {
        const estado = String(row[8] || '').toLowerCase(); // Index 8 is Estado
        if (estado.includes('abiert') || estado.includes('open')) incidentStats.abiertos++;
        if (estado.includes('pendient')) incidentStats.pendientes++;
      });
      
      mappedIncidents = incData.map(r => {
        return {
          id: r[0],
          fecha: r[1] instanceof Date ? Utilities.formatDate(r[1], tz, "yyyy-MM-dd HH:mm:ss") : r[1],
          usuario: r[2],
          cuenta: r[3],
          tienda: r[4],
          tipo: 'Lanzamiento: ' + (r[6] || ''),
          descripcion: r[7],
          estado: r[8],
          tiempo: r[9],
          fotos: r[10] || ''
        };
      });
    }
  }

  const valSheet = getSheetDefensive(ss, 'Validaciones de Lanzamiento');
  let launchStats = { total: 0, realizadas: 0, pendientes: 0, conIncidente: 0 };
  if (valSheet) {
    const valData = getFastValues(valSheet);
    if (valData.length > 1) {
      valData.shift();
      launchStats.realizadas = valData.length;
    }
    launchStats.conIncidente = incidentStats.total;
  }

  // Combinar reportes e incidentes de lanzamiento
  let combined = [...allReports, ...mappedIncidents];
  combined.sort((a, b) => {
    const dateA = new Date(String(a.fecha).replace(/-/g, '/'));
    const dateB = new Date(String(b.fecha).replace(/-/g, '/'));
    return dateB - dateA;
  });

  return {
    totalReports: allReports.length + incidentStats.total,
    pendingReports: openTotal + pendingTotal + incidentStats.abiertos + incidentStats.pendientes,
    recentReports: combined,
    incidentStats: incidentStats,
    launchStats: launchStats
  };
}

function getLaunchStatuses(ss, usuario, lanzamiento) {
  const statuses = {};
  
  // Archivos externos de Google Forms
  const idECI = '1jlKgfjJlA44bbPL-SJGqXrhBk0jiRZiJm277EIIEUXM';
  const idMAC = '1kbu29XSbzEzKS7TmC4gUwzP-8gpR98rhL2-YzKB-LGs';
  
  try {
    // 1. Leer Archivo ECI
    try {
      const ssECI = SpreadsheetApp.openById(idECI);
      const sheetECI = ssECI.getSheets()[0];
      const dataECI = sheetECI.getRange(2, 2, sheetECI.getLastRow(), 1).getValues(); // Columna B (Tienda)
      dataECI.forEach(row => {
        const storeName = String(row[0] || '').trim();
        if (storeName) {
          statuses[storeName] = { estado: 'Realizado' };
        }
      });
    } catch (e) {
      console.error("Error leyendo archivo ECI: " + e);
    }
    
    // 2. Leer Archivo MAC (MM, Alcampo, Carrefour)
    try {
      const ssMAC = SpreadsheetApp.openById(idMAC);
      const sheetMAC = ssMAC.getSheets()[0];
      const dataMAC = sheetMAC.getRange(2, 2, sheetMAC.getLastRow(), 1).getValues(); // Columna B (Tienda)
      dataMAC.forEach(row => {
        const storeName = String(row[0] || '').trim();
        if (storeName) {
          statuses[storeName] = { estado: 'Realizado' };
        }
      });
    } catch (e) {
      console.error("Error leyendo archivo MAC: " + e);
    }
  } catch (globalError) {
      console.error("Error global en getLaunchStatuses externos: " + globalError);
  }
  
  // Sobrescribir/Priorizar incidentes si hay fila abierta en incidencias
  const incSheet = getSheetDefensive(ss, 'Incidencias Lanzamientos');
  if (incSheet) {
    const data = getFastValues(incSheet);
    data.shift();
    data.forEach(r => {
      if (usuario && String(r[2] || '').trim().toLowerCase() !== String(usuario).trim().toLowerCase()) return;
      if (lanzamiento && String(r[12] || '').trim().toLowerCase() !== String(lanzamiento).trim().toLowerCase()) return;
      
      const statusInc = String(r[8] || '').trim().toLowerCase();
      // Solo si el incidente sigue Abierto o Pendiente lo forzamos
      if (statusInc.includes('abiert') || statusInc.includes('pendient')) {
         // Si no existía en Validaciones lo creamos temporalmente para la vista
         if (!statuses[r[4]]) {
           statuses[r[4]] = {
              tienda: r[4],
              cuenta: r[3],
              lanzamiento: r[12]
           };
         }
         statuses[r[4]].estado = 'Incidente'; 
         statuses[r[4]].incId = r[0]; // Guardamos enlace a la incidencia por si hace falta
      }
    });
  }
  
  return statuses;
}

function handleSubmitReport(ss, data) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(CONFIG.LOCK_TIMEOUT);
    
    // 1. Datos maestros compartidos
    let cuenta = '';
    let rms = '';
    let owner = '';
    const storesSheet = getSheetDefensive(ss, 'Tiendas');
    if (storesSheet) {
      const storesData = getFastValues(storesSheet);
      storesData.shift(); 
      const storeRow = storesData.find(r => String(r[2]).trim().toLowerCase() === String(data.tienda).trim().toLowerCase());
      if (storeRow) {
        rms = storeRow[0] || '';
        cuenta = storeRow[1] || '';
        owner = storeRow[3] || ''; 
      }
    }
    const finalUser = owner || data.usuario || '';
    const now = new Date();
    const finalPhotos = Array.isArray(data.photos) ? data.photos.join('\n') : (data.photos || '');
    
    const isFurniture = String(data.categoria).toLowerCase() === 'mobiliario';
    const updateId = data.updateId || '';
    
    // LOGICA DE EDICIÓN: Si estamos editando, borramos el rastro previo para machacar los datos limpiamente
    if (updateId) {
      Logger.log("🛠️ [EDIT MODE] Intentando sobreescribir reporte ID: " + updateId);
      const sheetNames = ['Reporte mobiliario', 'Reporte dispositivo'];
      sheetNames.forEach(sn => {
        const sh = getSheetDefensive(ss, sn);
        if (sh) {
          const vals = getFastValues(sh);
          let countDeleted = 0;
          // Recorrer del revés para borrar filas de forma segura sin mover índices de las que quedan arriba
          for (let i = vals.length - 1; i >= 1; i--) {
            const rowId = String(vals[i][0] || '').trim().toUpperCase();
            const searchId = String(updateId).trim().toUpperCase();
            if (rowId === searchId && searchId !== "") {
              sh.deleteRow(i + 1);
              countDeleted++;
            }
          }
          if (countDeleted > 0) {
            Logger.log("✅ Filas borradas en '" + sn + "': " + countDeleted);
          }
        }
      });
    }
    
    // Mantenemos el ID original si estamos editando, sino generamos uno nuevo
    const finalId = updateId || generateUUID(isFurniture ? 'REP_M' : 'REP_D');
    
    const formulaTiempo = '';

    if (isFurniture) {
      const sheet = getSheetDefensive(ss, 'Reporte mobiliario');
      if (!sheet) return { success: false, message: 'Hoja "Reporte mobiliario" no encontrada' };
      
      const row = [
        finalId,
        now,
        finalUser,
        cuenta,
        data.tienda || '',
        rms,
        data.categoria,
        data.subcategoria || '',
        data.enviar || '',  
        data.motivo || '',
        data.descripcion || '',
        data.estado || 'Abierta',
        formulaTiempo,
        finalPhotos
      ];
      sheet.appendRow(row);
      
    } else {
      const sheet = getSheetDefensive(ss, 'Reporte dispositivo');
      if (!sheet) return { success: false, message: 'Hoja "Reporte dispositivo" no encontrada' };
      
      const deviceList = data.dispositivos || [];
      if (deviceList.length === 0) return { success: false, message: 'No se seleccionaron dispositivos.' };
      
      deviceList.forEach(item => {
        const row = [
          finalId,
          now,
          item.tipoReporte || '',
          finalUser,
          cuenta,
          data.tienda || '',
          rms,
          data.categoria,
          data.tipologia || '',
          item.modelo || '',
          item.codigoDispositivo || '',
          item.cantidad || 1,
          data.subcategoria || '',
          data.enviar || '', 
          data.motivo || '',
          data.descripcion || '',
          data.estado || 'Abierta',
          formulaTiempo,
          finalPhotos
        ];
        sheet.appendRow(row);
      });
    }
    
    return { success: true };
  } catch (e) {
    return { success: false, message: 'Error (Lock/Write): ' + e.toString() };
  } finally {
    lock.releaseLock();
  }
}

function handleSubmitCustomLaunchForm(mainSs, data) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(CONFIG.LOCK_TIMEOUT);
    
    let targetSsId = '';
    const cuenta = String(data.cuenta).trim().toUpperCase();
    if (cuenta === 'ECI') {
      targetSsId = '1jlKgfjJlA44bbPL-SJGqXrhBk0jiRZiJm277EIIEUXM';
    } else {
      targetSsId = '1kbu29XSbzEzKS7TmC4gUwzP-8gpR98rhL2-YzKB-LGs';
    }
    
    const targetSs = SpreadsheetApp.openById(targetSsId);
    const targetSheet = targetSs.getSheets()[0];
    if (!targetSheet) throw new Error("Hoja de respuestas no encontrada en el destino.");
    
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
    
    let rowData = [];
    if (cuenta === 'ECI' || cuenta === 'EL CORTE INGLES' || cuenta === 'EL CORTE INGLÉS') {
      rowData = [
        timestamp,
        data.tienda,
        data.q_lampara,
        data.q_ldu,
        data.q_dummy,
        data.q_eco,
        data.q_filmina,
        data.q_lonas,
        data.q_wall,
        data.q_column,
        data.q_fichas,
        data.q_incidencias,
        data.q_escalerilla || 'No aplica', // 13. Has implantado la escalerilla
        data.photos, // 14. Sube fotos completas
        '' // 15. Foto de la escalerilla (dejamos vacío por ahora ya que se suben juntas)
      ];
    } else {
      rowData = [
        timestamp,
        data.tienda,
        data.q_lampara,
        data.q_ldu,
        data.q_dummy,
        data.q_eco,
        data.q_filmina,
        data.q_lonas,
        data.q_wall,
        data.q_column,
        data.q_fichas,
        data.q_incidencias,
        data.photos // 13. Sube fotos
      ];
    }
    
    targetSheet.appendRow(rowData);
    
    return { success: true };
  } catch(e) {
    return { success: false, message: e.message };
  } finally {
    lock.releaseLock();
  }
}

function handleSubmitLaunchChecklist(ss, data) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(CONFIG.LOCK_TIMEOUT);
    const valSheet = getSheetDefensive(ss, 'Validaciones de Lanzamiento');
    const incSheet = getSheetDefensive(ss, 'Incidencias Lanzamientos');
    
    // Buscar el dueño (USUARIO) de la Tienda en la hoja 'Tiendas'
    let owner = '';
    const storesSheet = getSheetDefensive(ss, 'Tiendas');
    if (storesSheet) {
      const storesData = getFastValues(storesSheet);
      storesData.shift(); // remover cabecera
      const storeRow = storesData.find(r => String(r[2]).trim().toLowerCase() === String(data.tienda).trim().toLowerCase());
      if (storeRow) {
        owner = storeRow[3] || ''; // Columna D: USUARIO asignado a la tienda
      }
    }
    
    const finalUser = owner || data.usuario || '';
    
    // 1. Fila para Validaciones de Lanzamiento (9 columnas):
    // ID (0), Fecha (1), Columna C: Usuario (2), Cuenta (3), Tienda (4), Código RMS (5), ¿Instalación OK? (6), Comentario (7), Fotos (8)
    const valRow = [
      generateUUID('VAL'),                      // ID (0)
      new Date(),                               // Fecha (1)
      finalUser,                                // Usuario (dueño de la tienda) (2)
      data.cuenta || '',                        // Cuenta (3)
      data.tienda || '',                        // Tienda (4)
      data.rms || '',                           // Código RMS (5)
      data.instalacionOk ? 'OK' : 'Error',      // ¿Instalación OK? (6)
      data.descripcion || '',                   // Comentario (7)
      Array.isArray(data.photos) ? data.photos.join('\n') : (data.photos || ''), // Fotos (8)
      '',                                       // (9)
      '',                                       // (10)
      '',                                       // (11)
      data.lanzamiento || ''                    // Lanzamiento (12)
    ];
    
    // 2. Fila para Incidencias Lanzamientos (13 columnas):
    // ID (0), Fecha (1), Usuario (2), Cuenta (3), Tienda (4), Código RMS (5), Ruta Incidencia (6), Comentario (7), Estado (8), Tiempo (9), Fotos (10), Lanzamiento (12)
    const formulaTiempo = '';

    const incRow = [
      generateUUID('INC'),                      
      new Date(),                               
      finalUser,                                
      data.cuenta || '',                        
      data.tienda || '',                        
      data.rms || '',                           
      data.incidentPath || '',                  
      data.descripcion || '',                   
      'Abierta',                                
      formulaTiempo,
      Array.isArray(data.photos) ? data.photos.join('\n') : (data.photos || ''), 
      '',                                       
      data.lanzamiento || ''                    
    ];
    
    if (valSheet) valSheet.appendRow(valRow);
    if (data.isIncident && incSheet) incSheet.appendRow(incRow);
    
    return { success: true };
  } catch (e) {
    return { success: false, message: 'Error (Lock/Write): ' + e.toString() };
  } finally {
    lock.releaseLock();
  }
}

function handleFileUpload(data) {
  try {
    const folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    const blob = Utilities.newBlob(Utilities.base64Decode(data.base64), data.mimeType, data.fileName);
    const file = folder.createFile(blob);
    
    const fileSize = file.getSize();
    Logger.log("📁 [FILE UPLOAD] Archivo creado con éxito: '" + data.fileName + "' (" + fileSize + " bytes) en ID: " + file.getId());
    
    let sharingWarning = "";
    // Intento defensivo de compartir por políticas de dominio corporativo (Salesland)
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      Logger.log("✅ Compartido públicamente: Anyone with link.");
    } catch (sharingError) {
      try {
        file.setSharing(DriveApp.Access.DOMAIN_WITH_LINK, DriveApp.Permission.VIEW);
        Logger.log("⚠️ Bloqueo Público. Compartido en dominio corporativo: Domain with link.");
      } catch (domError) {
        sharingWarning = "POLITICA_BLOQUEADA: El administrador de Google Workspace restringe el compartido externo de archivos programáticamente.";
        Logger.log("🚨 ERROR CRÍTICO COMPARTIDO: " + sharingWarning);
      }
    }
    
    return { 
      success: true, 
      url: file.getUrl(),
      fileId: file.getId(),
      size: fileSize,
      warning: sharingWarning
    };
  } catch (e) {
    Logger.log("❌ ERROR en handleFileUpload: " + e.toString());
    return { success: false, error: e.toString() };
  }
}

// ==================================================
// UTILITY: Convertir contraseñas a SHA-256
// Ejecuta esta función manualmente desde Apps Script 
// para encriptar las contraseñas actuales de la hoja Usuarios.
// ==================================================
function hashAllPasswords() {
  const ss = SpreadsheetApp.openById(CONFIG.SS_ID);
  const sheet = getSheetDefensive(ss, 'Usuarios');
  if (!sheet) return;
  
  const data = getFastValues(sheet);
  for (let i = 1; i < data.length; i++) {
    const plainPass = String(data[i][1] || '').trim();
    // Solo hashea si la contraseña no parece estar ya hasheada (un hash SHA-256 tiene 64 caracteres)
    if (plainPass && plainPass.length < 60) {
      const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, plainPass);
      let txtHash = '';
      for (let j = 0; j < rawHash.length; j++) {
        let hashVal = rawHash[j];
        if (hashVal < 0) {
          hashVal += 256;
        }
        if (hashVal.toString(16).length == 1) {
          txtHash += '0';
        }
        txtHash += hashVal.toString(16);
      }
      // Sobrescribe la columna B (índice 2 en formato R1C1) con el Hash
      sheet.getRange(i + 1, 2).setValue(txtHash);
    }
  }
}

function getDiagnostics(ss) {
  const sheets = ss.getSheets();
  const info = {};
  sheets.forEach(s => {
    const name = s.getName();
    const data = getFastValues(s);
    info[name] = {
      totalRows: data.length,
      columnsCount: data[0] ? data[0].length : 0,
      headers: data[0] || [],
      firstRow: data[1] || []
    };
  });
  return { success: true, sheets: info };
}

function resolveIncident(ss, data) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    
    const id = data.id;
    const status = data.estado || data.status || 'Solucionado';
    const newPhotos = Array.isArray(data.photos) ? data.photos.join('\n') : (data.photos || '');
    
    function calculateDaysFromDate(dateVal) {
      if (!dateVal) return 0;
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return 0;
      return Math.floor(Math.abs(Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
    }

    // 1. Buscar en pestaña 'Reporte mobiliario'
    const mobSheet = getSheetDefensive(ss, 'Reporte mobiliario');
    if (mobSheet) {
      const reports = getFastValues(mobSheet);
      for (let i = 1; i < reports.length; i++) {
        if (reports[i][0] === id) {
          mobSheet.getRange(i + 1, 12).setValue(status); // Columna L (índice 11) es Estado
          mobSheet.getRange(i + 1, 13).setValue(calculateDaysFromDate(reports[i][1])); // Congelar tiempo
          if (newPhotos) {
            const oldPhotos = reports[i][13] || ''; // Columna N (índice 13) es Fotos
            const combinedPhotos = oldPhotos ? oldPhotos + '\n' + newPhotos : newPhotos;
            mobSheet.getRange(i + 1, 14).setValue(combinedPhotos);
          }
          return { success: true };
        }
      }
    }

    // 2. Buscar en pestaña 'Reporte dispositivo'
    const devSheet = getSheetDefensive(ss, 'Reporte dispositivo');
    if (devSheet) {
      const reports = getFastValues(devSheet);
      let foundAny = false;
      for (let i = 1; i < reports.length; i++) {
        if (reports[i][0] === id) {
          foundAny = true;
          devSheet.getRange(i + 1, 17).setValue(status); // Columna Q (índice 16) es Estado
          devSheet.getRange(i + 1, 18).setValue(calculateDaysFromDate(reports[i][1])); // Congelar tiempo
          if (newPhotos) {
            const oldPhotos = reports[i][18] || ''; // Columna S (índice 18) es Fotos
            const combinedPhotos = oldPhotos ? oldPhotos + '\n' + newPhotos : newPhotos;
            devSheet.getRange(i + 1, 19).setValue(combinedPhotos);
          }
        }
      }
      if (foundAny) return { success: true };
    }
    
    // 3. Buscar en pestaña 'Incidencias Lanzamientos'
    const incSheet = getSheetDefensive(ss, 'Incidencias Lanzamientos');
    if (incSheet) {
      const incs = getFastValues(incSheet);
      for (let i = 1; i < incs.length; i++) {
        if (incs[i][0] === id) {
          incSheet.getRange(i + 1, 9).setValue(status); // Columna I (índice 8) es Estado
          incSheet.getRange(i + 1, 10).setValue(calculateDaysFromDate(incs[i][1])); // Congelar tiempo
          if (newPhotos) {
            const oldPhotos = incs[i][10] || ''; // Columna K (índice 10) es Fotos
            const combinedPhotos = oldPhotos ? oldPhotos + '\n' + newPhotos : newPhotos;
            incSheet.getRange(i + 1, 11).setValue(combinedPhotos);
          }
          return { success: true };
        }
      }
    }
    
    return { success: false, error: 'ID de reporte no encontrado' };
  } catch (e) {
    return { success: false, error: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Borra una validación de la hoja de excel por ID.
 */
function deleteLaunchValidation(ss, id) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(CONFIG.LOCK_TIMEOUT);
    const sheet = getSheetDefensive(ss, 'Validaciones de Lanzamiento');
    if (!sheet) return { success: false, error: 'Hoja no encontrada' };
    
    const data = getFastValues(sheet);
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(id)) {
        sheet.deleteRow(i + 1);
        return { success: true };
      }
    }
    return { success: false, error: 'ID no encontrado en validaciones.' };
  } catch (e) {
    return { success: false, error: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Actualiza un registro de validación (Comentario, Fotos, Estado).
 */
function updateLaunchValidation(ss, data) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(CONFIG.LOCK_TIMEOUT);
    const sheet = getSheetDefensive(ss, 'Validaciones de Lanzamiento');
    if (!sheet) return { success: false, error: 'Hoja no encontrada' };
    
    const sheetData = getFastValues(sheet);
    for (let i = 1; i < sheetData.length; i++) {
      if (String(sheetData[i][0]) === String(data.id)) {
        // Si envían fotos, las sobrescribimos o anexamos? Asumo sobrescribir para esta edición
        if (data.fotos) sheet.getRange(i + 1, 9).setValue(data.fotos); // Col I (índice 8)
        if (data.comentario !== undefined) sheet.getRange(i + 1, 8).setValue(data.comentario); // Col H (índice 7)
        
        // Actualizar Instalación OK status (Columna G -> Indice 6)
        if (data.instalacionOk) sheet.getRange(i + 1, 7).setValue(data.instalacionOk); // 'OK' o 'Error'
        
        return { success: true };
      }
    }
    return { success: false, error: 'ID no encontrado para actualizar.' };
  } catch (e) {
    return { success: false, error: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Borra permanentemente un reporte de la hoja correspondiente por su ID
 */
function deleteReport(ss, id) {
  if (!id) return { success: false, error: 'ID requerido' };
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(CONFIG.LOCK_TIMEOUT);
    const sheetsToCheck = ['Reporte mobiliario', 'Reporte dispositivo', 'Incidencias Lanzamientos'];
    let deletedAny = false;
    sheetsToCheck.forEach(sn => {
      const sheet = getSheetDefensive(ss, sn);
      if (!sheet) return;
      const vals = getFastValues(sheet);
      for (let i = vals.length - 1; i >= 1; i--) {
        if (String(vals[i][0]).trim() === String(id).trim()) {
          sheet.deleteRow(i + 1);
          deletedAny = true;
        }
      }
    });
    return deletedAny ? { success: true } : { success: false, error: 'No encontrado' };
  } catch (e) { return { success: false, error: e.toString() }; } finally { lock.releaseLock(); }
}

/**
 * LEE LOS DATOS A VELOCIDAD DE LA LUZ EVITANDO FILAS FANTASMA
 * Esta función busca la última fila REAL en lugar de confiar en getDataRange()
 * que puede atascarse si el excel tiene celdas vacías con bordes o formato.
 */
function getFastValues(sheet) {
  if (!sheet) return [];
  const lastCol = sheet.getLastColumn();
  if (lastCol === 0) return [];
  
  // 1. Leemos SOLO la Columna A entera (muy rápido, incluso con miles de filas)
  const colA = sheet.getRange(1, 1, sheet.getMaxRows(), 1).getValues();
  
  // 2. Encontrar la última fila con contenido REAL empezando desde el final
  let lastRow = colA.length;
  while (lastRow > 0 && String(colA[lastRow - 1][0] || '').trim() === "") {
    lastRow--;
  }
  
  // Si no hay datos, devolver vacío
  if (lastRow === 0) return [];
  
  // 3. Leemos el rango EXACTO de datos reales. Instantáneo.
  return sheet.getRange(1, 1, lastRow, lastCol).getValues();
}

// ==================================================
// NUEVO: MÓDULO PREMIUM DE MENSAJERÍA INTERNA
// ==================================================

function getOrCreateMessagesSheet(ss) {
  let sheet = ss.getSheetByName('Mensajes');
  if (!sheet) {
    sheet = ss.insertSheet('Mensajes');
    sheet.appendRow(['ID', 'Fecha', 'Remitente', 'Destinatario', 'Mensaje', 'Leido']);
    sheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#ffe6cc');
  }
  return sheet;
}

function getMessagingUsers(ss) {
  const sheet = getSheetDefensive(ss, 'Usuarios');
  if (!sheet) return { success: false, error: 'Hoja Usuarios no encontrada' };
  
  const data = getFastValues(sheet);
  data.shift(); // Remover cabecera
  
  const users = data.map(r => ({
    email: String(r[0] || '').trim(),
    rol: String(r[2] || '').trim().toUpperCase()
  })).filter(u => u.email);
  
  return { success: true, users: users };
}

function sendInstantMessage(ss, data) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const sheet = getOrCreateMessagesSheet(ss);
    
    const id = 'MSG_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const fecha = new Date().toISOString();
    const remitente = String(data.remitente || '').trim();
    const destinatario = String(data.destinatario || '').trim();
    const mensaje = String(data.mensaje || '').slice(0, 200); // Límite estricto de 200 caracteres
    const leido = 'Pendiente';
    
    if (!remitente || !destinatario || !mensaje) {
      return { success: false, error: 'Campos incompletos' };
    }
    
    sheet.appendRow([id, fecha, remitente, destinatario, mensaje, leido]);
    SpreadsheetApp.flush(); // Forzar guardado en disco inmediato antes de liberar bloqueo
    return { success: true };
  } catch (e) {
    return { success: false, error: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

function getUserMessages(ss, email) {
  const sheet = getOrCreateMessagesSheet(ss);
  const data = getFastValues(sheet);
  const cleanEmail = String(email || '').trim().toLowerCase();
  
  // Estadísticas de telemetría activas para el panel del frontend
  const debugStats = {
    filasTotales: data.length,
    emailBuscado: cleanEmail,
    columnas: sheet.getLastColumn()
  };
  
  if (data.length <= 1) {
    return { success: true, messages: [], debug: debugStats };
  }
  
  const rawRows = [...data];
  data.shift(); // Quitar cabecera
  
  const userMsgs = data.filter(r => {
    const from = String(r[2] || '').trim().toLowerCase();
    const to = String(r[3] || '').trim().toLowerCase();
    return from === cleanEmail || to === cleanEmail;
  }).map(r => ({
    id: r[0],
    fecha: r[1],
    remitente: r[2],
    destinatario: r[3],
    mensaje: r[4],
    leido: r[5]
  }));
  
  // Ordenar cronológico descendente
  userMsgs.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  
  debugStats.filtrados = userMsgs.length;
  if (rawRows.length > 1) {
    debugStats.primerRegistro = `De: "${rawRows[1][2]}" | Para: "${rawRows[1][3]}"`;
  }
  
  return { 
    success: true, 
    messages: userMsgs,
    debug: debugStats 
  };
}

function markInstantMessageRead(ss, messageId) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const sheet = getOrCreateMessagesSheet(ss);
    const data = getFastValues(sheet);
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === messageId) {
        sheet.getRange(i + 1, 6).setValue('Leído');
        return { success: true };
      }
    }
    return { success: false, error: 'Mensaje no encontrado' };
  } catch (e) {
    return { success: false, error: e.toString() };
  } finally {
    lock.releaseLock();
  }
}
