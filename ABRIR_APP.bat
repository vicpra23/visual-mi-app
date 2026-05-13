@echo off
title SERVIDOR XIAOMI VISUAL
cd /d "%~dp0"
echo Lanzando Servidor Seguro...
powershell -NoProfile -ExecutionPolicy Bypass -File "servidor_xiaomi.ps1"
pause
