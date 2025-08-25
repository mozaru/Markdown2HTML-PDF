FROM busybox:stable

# Usuário sem privilégios
RUN adduser -D -u 10001 app

# Pasta pública (seus arquivos estão em ./public, relativo ao Dockerfile)
WORKDIR /www
COPY --chown=app:app public/ /www/

# Porta interna do container (mapeia no compose/reverse proxy)
EXPOSE 8080

# Healthcheck simples
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1

# Rodar como não-root na porta alta (não precisa de CAP_NET_BIND_SERVICE)
USER 10001:10001

# Servir com o httpd do busybox
# -f: foreground  | -p: porta | -h: docroot
CMD ["httpd", "-f", "-p", "8080", "-h", "/www"]
