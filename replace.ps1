$path = "main_v130.js"
$content = Get-Content $path -Raw
$content = $content.Replace("u.email", "(u.email || u.usuario)")
$content = $content.Replace("APP_CONFIG.currentUser.email", "(APP_CONFIG.currentUser.email || APP_CONFIG.currentUser.usuario)")
$content = $content.Replace("APP_CONFIG.currentUser?.email", "(APP_CONFIG.currentUser?.email || APP_CONFIG.currentUser?.usuario)")
Set-Content $path -Value $content
