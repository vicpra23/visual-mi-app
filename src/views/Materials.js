function renderMaterials(container) {
    const session = getSessionData();
    const categories = [
        {
            id: 'smartphones',
            title: 'Smartphones',
            icon: 'smartphone',
            subcategories: [
                {
                    name: 'Xiaomi Series',
                    items: [
                        { name: 'Xiaomi 17 Series', link: 'https://drive.google.com/drive/folders/1X5D15N7kX6E_T3z1I0oAEw52hVvZj4kE?usp=drive_link' },
                        { name: 'Xiaomi 17T Series', link: 'https://drive.google.com/drive/folders/12Pp5GqAC3MAS5Lg3_6euNP8wpk5bigx0?usp=drive_link' },
                        { name: 'Xiaomi 15', link: 'https://drive.google.com/drive/folders/1LdSr1wVeSd-SDlA7J88W7AoSDTo36Bs3?usp=drive_link' }
                    ]
                },
                {
                    name: 'Redmi Note Series',
                    items: [
                        { name: 'Redmi Note 15 Series', link: 'https://drive.google.com/drive/folders/1tVzbAPPJ2sKTIQfSDIj_lZ3DnSZ2DeDO?usp=drive_link' },
                        { name: 'Redmi Note 14 Series', link: 'https://drive.google.com/drive/folders/158tzCM-AN6eZQaDXvgIded_EaElHvDtx?usp=drive_link' }
                    ]
                },
                {
                    name: 'Redmi Series',
                    items: [
                        { name: 'Redmi A7 Pro', link: 'https://drive.google.com/drive/folders/1sGoos4L8TYb3cWfU-BgqWRJIGiuJVx-Z?usp=drive_link' },
                        { name: 'Redmi 15C Series', link: 'https://drive.google.com/drive/folders/1nI5668YtZ80KbzlWVq9G6W-TdmUYKL-O?usp=drive_link' },
                        { name: 'Redmi 15 Series', link: 'https://drive.google.com/drive/folders/1jKz2q1GtlRoUV1vU_IMAOme6VmzOoDvG?usp=drive_link' }
                    ]
                },
                {
                    name: 'Poco Series',
                    items: [
                        { name: 'Modelos Poco', link: 'https://drive.google.com/drive/folders/1juohiKKybgrbU9QQFO9NRUuGY2kIsv4q?usp=drive_link' }
                    ]
                }
            ]
        },
        {
            id: 'wearables',
            title: 'Wearables',
            icon: 'watch',
            subcategories: [
                {
                    name: 'Xiaomi Band',
                    items: [
                        { name: 'Xiaomi Band 10 Pro', link: 'https://drive.google.com/drive/folders/1v6jE8VRI76fsfY68L59AvCH5fkgPJN2u?usp=drive_link' },
                        { name: 'Xiaomi Band 10', link: 'https://drive.google.com/drive/folders/1ChCLVcB1Qd47Euaxosfh5y4GWFSiBs0t?usp=drive_link' },
                        { name: 'Xiaomi Band 9 Series', link: 'https://drive.google.com/drive/folders/1ynJw_ISQL5aT68IWtOPs9FKCbRSWJ7V_?usp=drive_link' }
                    ]
                },
                {
                    name: 'Xiaomi Watch',
                    items: [
                        { name: 'Xiaomi Watch S5 46mm', link: 'https://drive.google.com/drive/folders/1aG_t62JPgG--mcuLspkaZCoMRp0cpegD?usp=drive_link' },
                        { name: 'Xiaomi Watch 5', link: 'https://drive.google.com/drive/folders/1MKCNhtlIr9kjDmd_u46_1nBL5wqixh7F?usp=drive_link' },
                        { name: 'Xiaomi Watch S4', link: 'https://drive.google.com/drive/folders/1KD4LBsOeYyr-wpzAPruIZZXF63hRMTte?usp=drive_link' },
                        { name: 'Xiaomi Watch S4 41 mm', link: 'https://drive.google.com/drive/folders/12hqXI7ictDs4RIhhzecM1K8kz0_wNt7W?usp=drive_link' },
                        { name: 'Xiaomi Watch 2', link: 'https://drive.google.com/drive/folders/1M2cluCVj7p1bFDfj-hch84SWv9Ybfts9?usp=drive_link' },
                        { name: 'Xiaomi Watch 2 Pro', link: 'https://drive.google.com/drive/folders/1BA63fqVslxa2FjulvEIv13FZ1SpJBXzH?usp=drive_link' }
                    ]
                },
                {
                    name: 'Redmi Watch',
                    items: [
                        { name: 'Redmi Watch 6', link: 'https://drive.google.com/drive/folders/1gTDcL0BbV8MMrsu_JQfKOOpnEpOw_mM6?usp=drive_link' },
                        { name: 'Redmi Watch 5 Series', link: 'https://drive.google.com/drive/folders/1ROS4qUYwz3oxTK-66zfNlbFPo7o57bLi?usp=drive_link' }
                    ]
                }
            ]
        },
        {
            id: 'tablets',
            title: 'Tablets',
            icon: 'tablet',
            subcategories: [
                {
                    name: 'Xiaomi Pad',
                    items: [
                        { name: 'Xiaomi Pad 8 Series', link: 'https://drive.google.com/drive/folders/1UY4dVNbo5a6BA8y9IxkeP0C6JK_xfqRl?usp=drive_link' },
                        { name: 'Xiaomi Pad 7 Series', link: 'https://drive.google.com/drive/folders/1XClGAkAmTm7e1huJ5zcIFkuK9FOZZ86x?usp=drive_link' }
                    ]
                },
                {
                    name: 'Redmi Pad',
                    items: [
                        { name: 'Redmi Pad 2 Series', link: 'https://drive.google.com/drive/folders/1-dmBXg3_7H532gBqvoZVEVuyAZXU7zG-?usp=drive_link' },
                        { name: 'Redmi Pad Series', link: 'https://drive.google.com/drive/folders/17K07gSvMP-XsOC9WsLgCH2HsraF7IGMn?usp=drive_link' },
                        { name: 'Redmi Pad 2 9.7', link: 'https://drive.google.com/drive/folders/110IQ62Bh6BuSYrpcnmOsme7hkYQUoRxV?usp=drive_link' }
                    ]
                }
            ]
        },
        {
            id: 'audio',
            title: 'Audio y Seguridad',
            icon: 'headphones',
            subcategories: [
                {
                    name: 'Auriculares Xiaomi',
                    items: [
                        { name: 'Xiaomi OpenWear Stereo Pro', link: 'https://drive.google.com/drive/folders/1Eom0uMEYUI4PC2OJPdd5z4dreB18XKTR?usp=drive_link' },
                        { name: 'Xiaomi OpenWear Stereo', link: 'https://drive.google.com/drive/folders/1Tc1uTvsyw4ESgA6PA5m9MF6XQUqkS7b1?usp=drive_link' },
                        { name: 'Xiaomi Buds 5 Series', link: 'https://drive.google.com/drive/folders/1vSDiDTxsTdMfKPcFsoxwSBqzG0fqV_vC?usp=drive_link' }
                    ]
                },
                {
                    name: 'Auriculares Redmi',
                    items: [
                        { name: 'Redmi Buds 8 Series', link: 'https://drive.google.com/drive/folders/1H2KgeuMwXZh6_46jE1wgat9IBVNzochZ?usp=drive_link' },
                        { name: 'Redmi Buds 6 Series', link: 'https://drive.google.com/drive/folders/1lhTyeOgQ9MW4lEA_94dwq9aVeTkKm52O?usp=drive_link' },
                        { name: 'Redmi Buds 5 Series', link: 'https://drive.google.com/drive/folders/1RZXdG0cdVLENAALeSdqu1_Lr99oZtxqv?usp=drive_link' },
                        { name: 'Redmi Buds 4 Series', link: 'https://drive.google.com/drive/folders/1uVA741nP4nFciOT051uutViObJhIvtp1?usp=drive_link' }
                    ]
                },
                {
                    name: 'Cámaras IP (Seguridad)',
                    items: [
                        { name: 'Outdoor Camera BW500', link: 'https://drive.google.com/drive/folders/1C9eRJd-ox4_Dynq5IT8KaMO5nIWcBIPe?usp=drive_link' },
                        { name: 'Outdoor Camera BW300', link: 'https://drive.google.com/drive/folders/1V6EZH0bZWIvwt3dd3gBw4Ou72qGagrBx?usp=drive_link' },
                        { name: 'Outdoor Camera BW400 Pro', link: 'https://drive.google.com/drive/folders/1XmQno9-IVLYb45HKp4eGs0U_KW8y4p1Q?usp=drive_link' },
                        { name: 'Outdoor Camera CW400', link: 'https://drive.google.com/drive/folders/1S5-RLX9KGhEC75Sj95RT9VrTiP3iG8-C?usp=drive_link' },
                        { name: 'Outdoor Camera CW300', link: 'https://drive.google.com/drive/folders/1-7gfo3PfC3FsU0RwVV9zaR_zcuP3ds3Y?usp=drive_link' },
                        { name: 'Camera C500 Pro', link: 'https://drive.google.com/drive/folders/1P9hEN7A8Y_LJsmhCR6D9pu9I5E5jq5bR?usp=drive_link' }
                    ]
                }
            ]
        },
        {
            id: 'tv',
            title: 'Multimedia',
            icon: 'tv',
            subcategories: [
                {
                    name: 'Xiaomi TV',
                    items: [
                        { name: 'Xiaomi TV A Pro 2026', link: 'https://drive.google.com/drive/folders/1nGG5ZY6phSw4vnmJYIf-Mixj0irAOZgg?usp=drive_link' },
                        { name: 'Xiaomi TV F 2026', link: 'https://drive.google.com/drive/folders/1XfhvOx1K_tvKxwKIS-9wwcXYDXgAmwF1?usp=drive_link' },
                        { name: 'Xiaomi TV S Pro Mini LED 2026', link: 'https://drive.google.com/drive/folders/10JoTZUI_k6vsHa9Juop2hpyaDIt1Xsag?usp=drive_link' },
                        { name: 'Xiaomi TV S Mini LED 2025', link: 'https://drive.google.com/drive/folders/11ExZDUZFANPj1e7iSppck1FwOQ-qb0KU?usp=drive_link' },
                        { name: 'Xiaomi TV Max 100', link: 'https://drive.google.com/drive/folders/1MrTOW8RDVSCiUl4YB0T-rKIJiNGF-QGA?usp=drive_link' }
                    ]
                },
                {
                    name: 'TV Box / Stick',
                    items: [
                        { name: 'Xiaomi Smart Stick 4K', link: 'https://drive.google.com/drive/folders/1UIxBAa3iyOUorkcSrGZF-VBsF9RAdEsl?usp=drive_link' },
                        { name: 'Xiaomi TV Box S (Gen3)', link: 'https://drive.google.com/drive/folders/1WeSErqR205Iv0LMlx1RBMa1ybEgDZxzl?usp=drive_link' }
                    ]
                }
            ]
        },
        {
            id: 'eco',
            title: 'Ecosistema',
            icon: 'home',
            subcategories: [
                {
                    name: 'Climatización',
                    items: [{ name: 'Mijia Air Conditioner Pro', link: 'https://drive.google.com/drive/folders/1X3vZdPK7sRLtj95szHxawynAPNglKwJ0?usp=drive_link' }]
                },
                {
                    name: 'Movilidad (Scooters)',
                    items: [
                        { name: 'Xiaomi Scooter 6 Series', link: 'https://drive.google.com/drive/folders/1R-F2SyMl-d8VX2KCX-acTQQbTb34wBd_?usp=drive_link' },
                        { name: 'Xiaomi Scooter 5 Series', link: 'https://drive.google.com/drive/folders/1s2UpvnuPBSiFn84rdaYJW2Mcb_dRFTK7?usp=drive_link' }
                    ]
                },
                {
                    name: 'Cocina (Air Fryers)',
                    items: [
                        { name: 'Smart Double Stack Air Fryer 12L', link: 'https://drive.google.com/drive/folders/10pVUOFRTQJAAlNJslJMV7nVk4Z38cM1Z?usp=drive_link' },
                        { name: 'Smart Air Fryer Pro 4L', link: 'https://drive.google.com/drive/folders/11olTGLQReuJ8gny55khVHUjcbdt1BW1H?usp=drive_link' }
                    ]
                },
                {
                    name: 'Aspiradoras de mano',
                    items: [
                        { name: 'Vacuum Cleaner G30', link: 'https://drive.google.com/drive/folders/146e5h4lwuMCEPPEJZeqeqlYLEehPtQae?usp=drive_link' },
                        { name: 'Vacuum Cleaner G20 Max', link: 'https://drive.google.com/drive/folders/1vhzihiQ4pXVizWI7wKa91nvNd8JUzm9e?usp=drive_link' },
                        { name: 'Vacuum Cleaner G20', link: 'https://drive.google.com/drive/folders/1WOy8lzbtLofjEsHrivAuDZBWsrYcAklc?usp=drive_link' },
                        { name: 'Vacuum Cleaner G20 Lite', link: 'https://drive.google.com/drive/folders/1ZSbVe3CYdUylrFtqwuByiZhUEmyq-laM?usp=drive_link' }
                    ]
                },
                {
                    name: 'Robots Aspiradores',
                    items: [
                        { name: 'Robot Vaccum S40', link: 'https://drive.google.com/drive/folders/1Ih1Eo5W89IN3CFMRwmzo_h4p45vkpkod?usp=drive_link' },
                        { name: 'Robot Vaccum S20+', link: 'https://drive.google.com/drive/folders/1s_QuOLgtkUgxmsLBRM_4b_5PyEd-wCY1?usp=drive_link' },
                        { name: 'Robot Vaccum S20', link: 'https://drive.google.com/drive/folders/1oIm8FN2jXpAAUGVG2mDD1QMCq1SldpMs?usp=drive_link' },
                        { name: 'Robot Vaccum H40', link: 'https://drive.google.com/drive/folders/14w4vOMlxCtIOFKlfP3-fNylOAfBRPe_b?usp=drive_link' },
                        { name: 'Robot Vaccum S40C', link: 'https://drive.google.com/drive/folders/1IHbEQ-3VEniX4iVufo8JmCfQk1nhZzcr?usp=drive_link' },
                        { name: 'Robot Vaccum E5', link: 'https://drive.google.com/drive/folders/1waL0GjBoVPN0ixm6ZcXu_tqQoxEVNR-E?usp=drive_link' },
                        { name: 'Robot Vaccum 5', link: 'https://drive.google.com/drive/folders/1ux9EVGg7upLKktwwwPPoOsJvP7sh3XmA?usp=drive_link' }
                    ]
                }
            ]
        }
    ];

    let activeCatId = 'smartphones';

    function updateView() {
        const cat = categories.find(c => c.id === activeCatId);
        const html = `
            <div class="materials-module fade-in">
                <header class="section-header" style="margin-bottom: 3.5rem; text-align: center;">
                    <h2 style="font-size: 2.2rem; letter-spacing: -0.03em; display: flex; align-items: center; justify-content: center; gap: 12px;">Biblioteca de Materiales <i data-lucide="book-open" style="color: var(--xiaomi-orange); width: 28px; height: 28px;"></i></h2>
                    <p style="color:var(--text-medium); margin: 0.5rem 0 1.5rem 0; font-weight: 500; font-size: 1.1rem;">Todo lo que necesitas para tus formaciones en un solo lugar.</p>
                    <div style="display:flex; justify-content:center; gap: 1rem;">
                        ${(session && session.role === 'Admin') ? `
                            <button id="btnNotifyMaterials" class="btn-primary" style="padding: 0.75rem 1.5rem; font-size:0.85rem;"><i data-lucide="send" style="width:16px; margin-right: 8px;"></i> Notificar Novedades</button>
                        ` : ''}
                    </div>
                </header>
                
                <div class="social-access-bar" style="margin-bottom: 4rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                    <a href="https://www.tiktok.com/@xiaomitrainingvideos" target="_blank" class="glass-card" style="display:flex; align-items:center; gap: 18px; padding: 1.5rem; text-decoration: none; border-radius: 24px; transition: all 0.3s ease;">
                        <div style="width: 44px; height: 44px; display: flex; align-items: center; justify-content:center;">
                            <img src="https://cdn.simpleicons.org/tiktok/000000" alt="TikTok" class="tiktok-icon-fix" style="width: 32px; height: 32px; transition: filter 0.3s;">
                        </div>
                        <div>
                            <strong style="display:block; color: var(--text-main); font-size: 1.05rem;">TikTok</strong>
                            <span style="font-size:0.8rem; color: var(--text-muted); font-weight: 500;">@xiaomitrainingvideos</span>
                        </div>
                    </a>
                    <a href="https://www.youtube.com/@xiaomitrainingvideos" target="_blank" class="glass-card" style="display:flex; align-items:center; gap: 18px; padding: 1.5rem; text-decoration: none; border-radius: 24px; transition: all 0.3s ease;">
                        <div style="width: 44px; height: 44px; display: flex; align-items: center; justify-content:center;">
                            <img src="https://cdn.simpleicons.org/youtube/ff0000" alt="YouTube" style="width: 34px; height: auto;">
                        </div>
                        <div>
                            <strong style="display:block; color: var(--text-main); font-size: 1.05rem;">YouTube</strong>
                            <span style="font-size:0.8rem; color: var(--text-muted); font-weight: 500;">@xiaomitrainingvideos</span>
                        </div>
                    </a>
                </div>

                <div class="mat-tabs-header" style="margin-bottom: 3rem; display: flex; justify-content: center; gap: 15px; flex-wrap: wrap;">
                    ${categories.map(c => `
                        <div class="mat-tab-btn ${c.id === activeCatId ? 'active' : ''}" data-id="${c.id}" style="min-width: 140px; padding: 1rem; border-radius: 16px;">
                            <i data-lucide="${c.icon}" style="width: 20px; height: 20px;"></i>
                            <span style="font-weight: 600; font-size: 0.9rem;">${c.title}</span>
                        </div>
                    `).join('')}
                </div>

                <div id="mat-tab-content-container">
                    <div class="mat-tab-content-panel" style="background: transparent; border: none; box-shadow: none; padding: 0;">
                        ${cat.subcategories ? cat.subcategories.map(sub => `
                            <div class="glass-card" style="padding: 2rem; border-radius: 28px; margin-bottom: 2rem;">
                                <div style="display:flex; align-items:center; gap: 10px; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-main);">
                                    <div style="width: 6px; height: 20px; background: var(--xiaomi-orange); border-radius: 3px;"></div>
                                    <h4 style="margin:0; font-size: 1.1rem; text-transform: none; letter-spacing: normal;">${sub.name}</h4>
                                </div>
                                <div class="mat-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px;">
                                    ${sub.items.length > 0 ? sub.items.map(item => `
                                        <a href="${item.link}" target="_blank" class="mat-link" style="display:flex; justify-content:space-between; align-items:center; padding: 1rem 1.25rem; background: var(--bg-main); border-radius: 16px; text-decoration: none; transition: all 0.2s;">
                                            <span style="color: var(--text-main); font-weight: 500; font-size: 0.9rem;">${item.name}</span>
                                            <i data-lucide="chevron-right" style="width: 16px; color: var(--text-muted); opacity: 0.5;"></i>
                                        </a>
                                    `).join('') : '<p style="font-size:0.85rem; color:var(--text-muted); padding: 1rem; text-align: center;">Próximamente...</p>'}
                                </div>
                            </div>
                        `).join('') : `
                            <div class="glass-card" style="text-align: center; padding: 5rem 2rem;">
                                <i data-lucide="folder-open" style="width: 64px; height: 64px; margin-bottom: 1.5rem; color: var(--border-main);"></i>
                                <p style="color: var(--text-medium); font-size: 1.1rem;">No hay materiales disponibles en esta categoría.</p>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
        container.innerHTML = html;
        if (typeof lucide !== 'undefined') lucide.createIcons();

        container.querySelectorAll('.mat-tab-btn').forEach(btn => {
            btn.onclick = () => {
                activeCatId = btn.dataset.id;
                updateView();
            };
        });

        const btnNotify = container.querySelector('#btnNotifyMaterials');
        if (btnNotify) {
            btnNotify.onclick = async () => {
                btnNotify.disabled = true;
                const oldHtml = btnNotify.innerHTML;
                btnNotify.innerText = "Enviando...";
                await sendPost('adminProcessSelection', { opAction: 'notify_materials' });
                btnNotify.innerText = "¡Notificado!";
                setTimeout(() => { 
                    btnNotify.disabled = false; 
                    btnNotify.innerHTML = oldHtml; 
                }, 3000);
            };
        }
    }

    updateView();
}
window.renderMaterials = renderMaterials;
