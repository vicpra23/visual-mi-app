function renderMessages(container) {
    let userData = getSessionData();
    let user = userData ? userData.user : 'Desconocido';

    const html = `
        <div class="fade-in">
            <header class="section-header" style="margin-bottom: 2rem; border-bottom: 1px solid var(--border-main); padding-bottom: 1.5rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:15px;">
                <div style="flex: 1; min-width: 250px;">
                    <h2 style="font-size: 1.75rem; margin-bottom: 0.25rem;"><i data-lucide="message-square" style="color: var(--xiaomi-orange); width: 28px; vertical-align: middle; margin-right: 10px;"></i> Buzón de Mensajes</h2>
                    <p style="color:var(--text-medium); font-weight: 500;">Mantente al tanto de misiones y novedades.</p>
                </div>
                <button id="markAllReadBtn" class="btn-secondary" style="font-size:0.8rem; height:40px; padding:0 15px; display:flex; align-items:center; gap:8px; font-weight:600; border-radius:10px; flex-shrink: 0;">
                    <i data-lucide="check-check" style="width:16px; height:16px;"></i>
                    <span>Marcar todos leídos</span>
                </button>
            </header>
            <div id="msgLogContainer" style="display:flex; flex-direction:column; gap:15px;">
                <p style="text-align:center; color:#888;">Cargando mensajes...</p>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    loadMessages();

    document.getElementById('markAllReadBtn').onclick = async () => {
        const btn = document.getElementById('markAllReadBtn');
        btn.disabled = true; btn.innerText = "...";
        try {
            await sendPost('markAllMessagesRead', { user: user });
            // Optimistic UI: mark everything as read in the view immediately
            document.querySelectorAll('[id^="msg-"]').forEach(el => {
                el.style.opacity = '0.7';
                el.style.borderLeftColor = '#e2e8f0';
                const badge = el.querySelector('.badge'); if(badge) badge.remove();
                const btnM = el.querySelector('button[onclick^="markAsRead"]'); if(btnM) btnM.remove();
            });
            if (window.updateNavBadge) window.updateNavBadge();
        } catch(e) { console.error(e); }
        btn.innerText = "Marcar todos como leídos";
        btn.disabled = false;
    };

    async function loadMessages() {
        const res = await api.getMessages({ targetUser: user });
        const log = document.getElementById('msgLogContainer'); if(!log) return;
        if (res.status === 'success' && res.data.length > 0) {
            log.innerHTML = res.data.map(m => {
                const isRead = m.read || (m.id && localReadCache.includes(m.id.toString()));
                const isVac = m.text.toLowerCase().includes('vacacio') || m.text.toLowerCase().includes('extra');
                const isCal = m.text.toLowerCase().includes('calendario') || m.text.toLowerCase().includes('planifica');
                const isMat = m.text.toLowerCase().includes('material');
                const isRep = m.text.toLowerCase().includes('reporte') || m.text.toLowerCase().includes('historial');
                let targetHash = '';
                if (isVac) targetHash = '#vacations';
                else if (isCal) targetHash = '#calendar';
                else if (isMat) targetHash = '#materials';
                else if (isRep) targetHash = '#dashboard';

                return `
                <article id="msg-${m.id}" class="glass-card fade-in" style="padding: 1.2rem; border-left: 6px solid ${isRead ? 'var(--border-main)' : (m.from === 'Admin' ? 'var(--xiaomi-orange)' : '#10b981')}; position:relative; opacity: ${isRead ? '0.7' : '1'};">
                    <div style="display:flex; justify-content:space-between; align-items:start;">
                        <div>
                            <h4 style="margin:0; font-size:1.1rem; color:var(--text-main); font-family:var(--font-heading);">${m.from}</h4>
                            <small style="color:var(--text-muted); font-weight:600;">${new Date(m.date).toLocaleString()}</small>
                        </div>
                        ${!isRead ? '<span class="badge" style="background:var(--xiaomi-orange); color:#fff; font-size:0.6rem; padding:4px 10px; border-radius:8px; font-weight:800; letter-spacing:0.05em;">NUEVO</span>' : ''}
                    </div>
                    <p style="margin:1rem 0 0 0; color:var(--text-medium); line-height:1.6; font-size: 0.95rem;">${m.text}</p>
                    
                    <div style="display:flex; gap:10px; margin-top:1.2rem;">
                        ${!isRead ? `<button onclick="markAsRead(${m.id})" class="btn-secondary" style="padding:6px 15px; font-size:0.8rem; margin:0;"><i data-lucide="check" style="width:14px;"></i> Marcar leído</button>` : ''}
                        ${targetHash ? `
                            <button onclick="goToSection('${targetHash}', ${m.id})" class="btn-primary" style="padding:6px 15px; font-size:0.8rem; margin:0;"><i data-lucide="arrow-right-circle" style="width:14px;"></i> Ir a sección</button>
                        ` : ''}
                    </div>
                </article>
                `;
            }).join('');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        } else {
            log.innerHTML = `
                <div class="glass-card" style="text-align:center; padding:4rem 2rem; color:var(--text-muted);">
                    <i data-lucide="inbox" style="width:48px; height:48px; margin-bottom:1rem; opacity:0.2;"></i>
                    <p>Tu buzón está vacío por ahora.</p>
                </div>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    }

    window.goToSection = async (hash, id) => {
        const el = document.getElementById(`msg-${id}`); if(el) el.style.display = 'none';
        localReadCache.push(id.toString()); saveCache();
        sendPost('markMessageRead', { msgId: id });
        window.location.hash = hash;
    };

    window.markAsRead = async (id) => {
        // EFECTO INMEDIATO
        const el = document.getElementById(`msg-${id}`); if(el) el.style.display = 'none';
        localReadCache.push(id.toString()); saveCache();
        if (window.updateNavBadge) window.updateNavBadge();

        const res = await sendPost('markMessageRead', { msgId: id });
        if (res.status === 'success') {
            setTimeout(() => {
                loadMessages();
                if (window.updateNavBadge) window.updateNavBadge();
            }, 600);
        }
    };
}
window.renderMessages = renderMessages;