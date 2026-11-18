@echo off
setlocal EnableExtensions
cd /d "%~dp0"
set "SCRIPT_DIR=%~dp0"

icacls .vps_chave_ssh.txt /inheritance:r >nul
icacls .vps_chave_ssh.txt /grant:r "tio:F" >nul

rem Prepara o projeto na VPS: cria a pasta e envia o docker-compose.yaml.
rem A imagem e gerada pelo GitHub Actions (GHCR privado) e baixada pelo deploy.yml.
rem Se a imagem local :deploy existir, recria o container com ela (sem registry).
rem Uso: vps-create-proj.bat [usuario@servidor]

rem Ajuste estas variaveis quando necessario.
set "PROJECT_NAME=md2pdf"
set "SSH_PORT=22"
set "SSH_KEY=%SCRIPT_DIR%.vps_chave_ssh.txt"
set "SSH_TARGET=gitdeploy@187.41.102.156"
if not "%~1"=="" set "SSH_TARGET=%~1"

if not exist "%SSH_KEY%" (
    echo ERRO: chave SSH nao encontrada: %SSH_KEY%
    exit /b 1
)

set "LOCAL_COMPOSE=%SCRIPT_DIR%docker-compose.yaml"
set "REMOTE_PROJECT_DIR=/server/projetos/%PROJECT_NAME%"

if not exist "%LOCAL_COMPOSE%" (
    echo ERRO: arquivo local nao encontrado: %LOCAL_COMPOSE%
    exit /b 1
)

echo Criando diretorio remoto...
ssh -i "%SSH_KEY%" -p "%SSH_PORT%" "%SSH_TARGET%" "mkdir -p '%REMOTE_PROJECT_DIR%' && touch '%REMOTE_PROJECT_DIR%/.env'"
if errorlevel 1 exit /b 1

echo Enviando %LOCAL_COMPOSE% para %REMOTE_PROJECT_DIR%/docker-compose.yaml...
scp -i "%SSH_KEY%" -P "%SSH_PORT%" "%LOCAL_COMPOSE%" "%SSH_TARGET%:%REMOTE_PROJECT_DIR%/docker-compose.yaml"
if errorlevel 1 exit /b 1

echo Verificando se a imagem do ultimo deploy ja esta no servidor...
ssh -i "%SSH_KEY%" -p "%SSH_PORT%" "%SSH_TARGET%" "cd '%REMOTE_PROJECT_DIR%' && img=$(docker compose config --images server) && if docker image inspect $img >/dev/null 2>&1; then echo Usando imagem local: $img; docker compose up -d server && docker compose ps; else echo Imagem $img ainda nao esta no servidor. Rode: gh workflow run deploy.yml; fi"
if errorlevel 1 exit /b 1

echo.
echo Projeto: %PROJECT_NAME%
echo Compose: %REMOTE_PROJECT_DIR%/docker-compose.yaml
echo Imagem:  tag local deploy (marcada pelo deploy.yml)

endlocal
