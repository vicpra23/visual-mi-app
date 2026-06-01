function renderLogin(container) {
    var html = `
    <div class="login-module fade-in" style="display:flex; align-items:center; justify-content:center; min-height: 80vh;">
        <div class="glass-card login-card" style="max-width: 400px; width:100%; padding: 2.5rem; text-align:center;">
            <img src="./Xiaomi_logo_(2021-).svg.png" alt="Xiaomi Logo" class="login-logo" style="width: 60px; margin-bottom: 1.5rem;">
            <h2 class="login-title" style="font-size: 1.75rem; color:var(--text-main);">¡Hola, Equipo! <i data-lucide="sparkles" style="color: var(--xiaomi-orange); width: 24px; vertical-align: middle;"></i></h2>
            <p class="login-subtitle" style="color:var(--text-muted); margin-bottom: 2rem; font-weight: 500;">Accede para organizar tu día y conectar con los demás.</p>
            
            <form id="loginForm">
                <div class="form-group">
                    <label for="username" class="form-label">Usuario</label>
                    <select id="username" name="username" class="form-control" required>
                        <option value="" disabled selected>Cargando usuarios...</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="password" class="form-label">Password</label>
                    <input type="password" id="password" name="password" class="form-control" placeholder="*************" required>
                </div>
                
                <button type="submit" id="btnSubmit" class="btn-primary" style="width: 100%; margin-top: 1.5rem; height: 50px; font-size: 1rem; border-radius: 12px;">
                    <i data-lucide="lock" style="width:18px;"></i> Entrar a mi espacio
                </button>
                
                <small id="errorMsg" style="color: var(--status-rejected-text); display: none; margin-top: 15px; text-align: center; font-weight: 500;"></small>
            </form>
        </div>
    </div>`;

    container.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    var form = document.getElementById('loginForm');
    var errorMsg = document.getElementById('errorMsg');
    var btnSubmit = document.getElementById('btnSubmit');
    var userSelect = document.getElementById('username');

    // Mantenemos el endpoint original getUsersList
    api.getUsersList().then(function(res) {
        if (res.status === 'success') {
            userSelect.innerHTML = '<option value="" disabled selected>Selecciona tu cuenta</option>';
            res.data.forEach(function(u) {
                var opt = document.createElement('option');
                opt.value = u.user; opt.innerText = u.name;
                userSelect.appendChild(opt);
            });
        } else {
            userSelect.innerHTML = '<option value="" disabled selected>Error de red</option>';
        }
    }).catch(function() {
        userSelect.innerHTML = '<option value="" disabled selected>Sin conexión</option>';
    });

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        var user = userSelect.value;
        var pass = document.getElementById('password').value;
        if (!user) {
            errorMsg.innerText = 'Selecciona un usuario primero.';
            errorMsg.style.display = 'block';
            return;
        }
        
        btnSubmit.disabled = true;
        btnSubmit.innerText = 'Iniciando sesión...';
        errorMsg.style.display = 'none';
        
        // Mantenemos el nombre del endpoint al array original: login
        api.login(user, pass).then(function(res) {
            btnSubmit.disabled = false;
            btnSubmit.innerText = 'Entrar a mi espacio';
            if (res.status === 'success') {
                setSessionData({ user: res.user, name: res.name, role: res.role, sede: res.sede, email: res.email });
                navigate('#dashboard');
            } else {
                errorMsg.innerText = res.message || 'Usuario o password incorrectos.';
                errorMsg.style.display = 'block';
            }
        }).catch(function() {
            btnSubmit.disabled = false;
            btnSubmit.innerText = 'Entrar a mi espacio';
            errorMsg.innerText = 'Error de red. Intenta de nuevo.';
            errorMsg.style.display = 'block';
        });
    });
}
window.renderLogin = renderLogin;
