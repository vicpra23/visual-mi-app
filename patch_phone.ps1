$file = "src\views\ReportForm.js"
$content = Get-Content $file -Raw -Encoding UTF8
$target = '<option value="Redmi A5">Redmi A5</option>'
$replacement = '<option value="Redmi A5">Redmi A5</option>
                            <option value="Redmi A7 Pro">Redmi A7 Pro</option>'
$content = $content.Replace($target, $replacement)
[System.IO.File]::WriteAllText((Get-Location).Path + "\$file", $content, [System.Text.Encoding]::UTF8)