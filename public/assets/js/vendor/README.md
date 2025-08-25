# Vendor (bibliotecas de terceiros)

Este diretório destina-se a cópias **vendorizadas** das libs usadas no projeto para funcionar **100% offline** (PWA/Tauri).

Por ora, em desenvolvimento, você pode usar **CDNs** nas páginas HTML. Para release offline, baixe as versões correspondentes e coloque aqui:

- `markdown-it.min.js`
- `highlight.min.js` e `highlight.github.min.css`
- `dompurify.min.js`
- `paged.polyfill.js` (Paged.js)
- `twemoji.min.js` (opcional se usar API oficial)

> Após vendorizar, atualize os `<script>`/`<link>` nos HTML para apontar para `./assets/js/vendor/...`.
