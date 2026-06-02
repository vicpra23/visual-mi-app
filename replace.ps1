$path = "main_v130.js"
$content = Get-Content $path -Raw

$find = "        const res = await callApi(reportData);"
$replace = "        const res = await callApi(reportData);
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
        }"

$content = $content.Replace($find, $replace)
Set-Content $path -Value $content
