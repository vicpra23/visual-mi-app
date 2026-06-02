
async function submitFinalReport(event, type) {
    event.preventDefault();
    const form = event.target;
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    
    if (APP_CONFIG.incidentUploadedPhotos.length === 0) {
        const zoneId = type === 'furniture' ? 'drop-zone-furniture' : 'drop-zone-device';
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
        btn.disabled = false;
        btn.textContent = originalText;
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Enviando...';

    const descEl = form.querySelector('.rep-desc');
    const desc = descEl ? descEl.value.trim() : '';
    
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
        const isFurniture = type === 'furniture';
        
        const reportData = {
            action: 'submitReport',
            usuario: (APP_CONFIG.currentUser.email || APP_CONFIG.currentUser.usuario),
            tienda: APP_CONFIG.currentReport.centro,
            categoria: isFurniture ? 'Mobiliario' : 'Dispositivo',
            descripcion: desc,
            photos: APP_CONFIG.incidentUploadedPhotos,
            estado: 'Abierta' // NUEVO: Forza reactivación a abierta si es una nueva incidencia o reedición
        };

        // NUEVO: Si hay ID activo de edición, lo inyectamos para que el backend sobreescriba
        if (window.editingIncidentId) {
            reportData.updateId = window.editingIncidentId;
        }
        
        if (isFurniture) {
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
                return alert('Falta Información: Por favor, selecciona qué ELEMENTO de Mobiliario presenta el fallo.');
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
                    const uRes = await callApi({ action: 'getMessagingUsers' });
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
