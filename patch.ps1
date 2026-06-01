$file = "src\views\ReportForm.js"
$content = Get-Content $file -Raw -Encoding UTF8

$content = $content -replace 'Reporte Inteligente', 'Reporte de Actividad'
$content = $content -replace 'Carga tu actividad diaria en campo o en sala.', 'Carga aquí tu trabajo del día.'
$content = $content -replace 'Empujar a Drive', 'Subir'

# Replace the HTML for distribuidor
$htmlTarget = [regex]::Escape('<div>
                        <label for="distribuidor">Distribuidor *</label>
                        <select id="distribuidor" name="distribuidor">
                            <option value="">(Selecciona Cuenta primero)</option>
                        </select>
                        <input type="text" id="distribuidor_custom" name="distribuidor_custom" placeholder="Escribe el nombre..." style="display:none; margin-top:5px;">
                    </div>')
$htmlRepl = '<div id="distribuidorWrapper" style="display:none;">
                        <label for="distribuidor">Distribuidor *</label>
                        <select id="distribuidor" name="distribuidor">
                            <option value="">(Selecciona Cuenta primero)</option>
                        </select>
                        <input type="text" id="distribuidor_custom" name="distribuidor_custom" placeholder="Escribe el nombre..." style="display:none; margin-top:5px;">
                    </div>'
$content = $content -replace $htmlTarget, $htmlRepl

# Replace the variable assignments
$varTarget = [regex]::Escape("const cuentaSelect = document.getElementById('cuenta');
    const distribuidorSelect = document.getElementById('distribuidor');")
$varRepl = "const cuentaSelect = document.getElementById('cuenta');`n    const distribuidorWrapper = document.getElementById('distribuidorWrapper');`n    const distribuidorSelect = document.getElementById('distribuidor');"
$content = $content -replace $varTarget, $varRepl

# Replace logic in cuentaSelect
$cuentaTarget = [regex]::Escape("if(distribuidores[val]) {
            distribuidores[val].forEach(d => {
                distribuidorSelect.innerHTML += `<option value=`"`${d}`">`${d}</option>`;
            });
        }
        distribuidorSelect.innerHTML += `<option value=`"`+`">`+ (Otro Manual)</option>`;")

$cuentaRepl = "if(distribuidores[val] && distribuidores[val].length > 0) {
            distribuidorWrapper.style.display = 'block';
            distribuidorSelect.required = true;
            distribuidores[val].forEach(d => {
                distribuidorSelect.innerHTML += `<option value=`"`${d}`">`${d}</option>`;
            });
            distribuidorSelect.innerHTML += `<option value=`"`+`">`+ (Otro Manual)</option>`;
        } else {
            distribuidorWrapper.style.display = 'none';
            distribuidorSelect.required = false;
        }"
$content = $content -replace $cuentaTarget, $cuentaRepl

# Replace logic in methodology
$metTarget = [regex]::Escape("distribuidorSelect.innerHTML = '<option value=`"N/A`">N/A</option>';
            distribuidorSelect.required = false;
            distribuidorCustom.style.display = 'none';
            distribuidorCustom.required = false;
        } else {
            groupAccountDist.style.opacity = '1';
            groupAccountDist.style.pointerEvents = 'auto';
            cuentaSelect.required = true;
            distribuidorSelect.required = true;")

$metRepl = "distribuidorWrapper.style.display = 'none';
            distribuidorSelect.required = false;
            distribuidorCustom.style.display = 'none';
            distribuidorCustom.required = false;
        } else {
            groupAccountDist.style.opacity = '1';
            groupAccountDist.style.pointerEvents = 'auto';
            cuentaSelect.required = true;
            if(cuentaSelect.value && distribuidores[cuentaSelect.value] && distribuidores[cuentaSelect.value].length > 0) {
                distribuidorWrapper.style.display = 'block';
                distribuidorSelect.required = true;
            }"
$content = $content -replace $metTarget, $metRepl

[System.IO.File]::WriteAllText((Get-Location).Path + "\$file", $content, [System.Text.Encoding]::UTF8)