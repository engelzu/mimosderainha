@echo off
title Gerar Arquivos de Deploy (Netlify) - Mimos de Rainha
cd /d "%~dp0"

echo ===================================================
echo   Preparando pasta OUT para Deploy no Netlify
echo ===================================================
echo.

set "OUT_DIR=%~dp0out"

:: Cria ou limpa a pasta out
if exist "%OUT_DIR%" (
    echo Limpando versao anterior da pasta OUT...
    rmdir /s /q "%OUT_DIR%"
)

mkdir "%OUT_DIR%"
mkdir "%OUT_DIR%\css"
mkdir "%OUT_DIR%\js"

echo Copiando paginas HTML...
copy /y "index.html" "%OUT_DIR%\" >nul
copy /y "admin.html" "%OUT_DIR%\" >nul

echo Copiando estilos CSS...
xcopy /y /e /i "css" "%OUT_DIR%\css" >nul

echo Copiando scripts JavaScript...
xcopy /y /e /i "js" "%OUT_DIR%\js" >nul

echo.
echo ===================================================
echo   Deploy gerado com sucesso na pasta:
echo   %OUT_DIR%
echo.
echo   Basta arrastar a pasta "out" para o Netlify Drop!
echo ===================================================
echo.
pause
