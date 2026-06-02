var fso = new ActiveXObject("Scripting.FileSystemObject");
var file = fso.OpenTextFile("main_v130.js", 1);
var code = file.ReadAll();
file.Close();
eval(code);
WScript.Echo("Syntax OK");
