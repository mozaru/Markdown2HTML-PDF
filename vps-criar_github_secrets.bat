@echo off
setlocal
cd /d "%~dp0"
echo =======================================================
echo   CONFIGURACAO DO GITHUB PARA O CI/CD (.github/workflows/deploy.yml)
echo =======================================================
echo.
echo Antes de rodar, confira as linhas abaixo com os valores reais
echo do servidor de producao (VPS) onde a aplicacao vai rodar.
echo.

:: ===== PREENCHA AQUI =====
set VPS_HOST=187.41.102.156
set VPS_USER=gitdeploy
:: chave privada SSH gerada (ssh-keygen), sem senha -- so a privada, sem extensao .pub
set CHAVE_SSH_ARQUIVO=.vps_chave_ssh.txt

set PROJECT_NAME=md2pdf
set VPS_PROJECT_PATH=/server/projetos/%PROJECT_NAME%
:: ==========================

if not exist "%CHAVE_SSH_ARQUIVO%" (
    echo [ERRO] Arquivo de chave SSH "%CHAVE_SSH_ARQUIVO%" nao encontrado.
    pause
    exit /b 1
)

gh auth status >nul 2>&1 || (
    echo [ERRO] gh nao autenticado. Rode: gh auth login
    pause
    exit /b 1
)

echo =======================================================
echo   1. CONFIGURANDO VARIAVEIS E SECRETS NO GITHUB
echo =======================================================
gh repo view --json nameWithOwner -q .nameWithOwner

:: Variaveis (visiveis no painel do GitHub - vars.*), usadas por .github/workflows/deploy.yml
echo %VPS_HOST%| gh variable set VPS_HOST || goto :falha
echo %VPS_PROJECT_PATH%| gh variable set VPS_PROJECT_PATH || goto :falha
echo %VPS_USER%| gh variable set VPS_USER || goto :falha

:: Secrets (bloqueados para leitura - secrets.*), tambem usados por .github/workflows/deploy.yml
gh secret set VPS_SSH_KEY < "%CHAVE_SSH_ARQUIVO%" || goto :falha

:: secrets do workflow antigo (build no servidor), nao sao mais usados
gh secret delete SERVER_HOST >nul 2>&1
gh secret delete SERVER_USER >nul 2>&1
gh secret delete SERVER_SSH_KEY >nul 2>&1

echo.
echo [+] Variaveis e Secrets configurados com sucesso!
echo.
echo Lembrete: o deploy.yml tambem depende de coisas que NAO da pra
echo configurar por aqui:
echo   - A chave publica correspondente a "%CHAVE_SSH_ARQUIVO%" precisa
echo     estar em ~/.ssh/authorized_keys do usuario %VPS_USER% na VPS.
echo   - O usuario %VPS_USER% precisa estar no grupo docker na VPS.
echo   - A pasta %VPS_PROJECT_PATH% precisa existir (vps-create-proj.bat).
echo.
pause

cls
echo =======================================================
echo   2. GUIA DE COMANDOS UTEIS DA GITHUB CLI (GH)
echo =======================================================
echo.
echo [ AUTENTICACAO ]
echo   gh auth login          - Faz login na sua conta do GitHub pelo terminal
echo.
echo [ GERENCIAMENTO DE DADOS ]
echo   gh secret set NOME     - Cria/Atualiza um Secret (Bloqueado para leitura)
echo   gh variable set NOME   - Cria/Atualiza uma Variavel (Visivel no painel)
echo.
echo [ AUTOMACAO E DEPLOY ]
echo   gh workflow run        - Dispara o deploy manualmente (Gatilho: workflow_dispatch)
echo   gh run watch           - Assiste aos logs do deploy rodando em tempo real
echo.
echo =======================================================
pause
exit /b 0

:falha
echo [ERRO] Falha ao gravar variavel/secret no GitHub.
pause
exit /b 1
