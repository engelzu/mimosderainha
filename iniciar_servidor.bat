@echo off
title Mimos de Rainha - Servidor Local
cd /d "%~dp0"
set PORT=8080

echo ================================================
echo   Mimos de Rainha - Servidor Local
echo   Endereco: http://localhost:%PORT%
echo   Pressione CTRL+C para encerrar
echo ================================================
echo.

start "" "http://localhost:%PORT%/index.html"

where python >nul 2>nul
if %errorlevel%==0 (
    python -m http.server %PORT%
    goto :fim
)

where py >nul 2>nul
if %errorlevel%==0 (
    py -m http.server %PORT%
    goto :fim
)

where npx >nul 2>nul
if %errorlevel%==0 (
    npx -y http-server -p %PORT% -c-1
    goto :fim
)

echo [ERRO] Python ou Node.js nao encontrado.
echo Instale um deles para iniciar o servidor local.

:fim
pause
