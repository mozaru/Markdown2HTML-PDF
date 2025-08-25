// src/services/ExportService.js
// Exporta HTML (download) e aciona impressão para PDF (via window.print).
// Também aplica DocConfig no DOM (margens, orientação, tamanho).
// - Para tamanho/orientação da página usamos um <style id="print-dynamic"> com @page dinâmico.
// - Margens são passadas por CSS variables na :root (ver print.css).

const DYNAMIC_STYLE_ID = 'print-dynamic-style';


async function myFetch(path){
  if (!window.__TAURI__)
    return await fetch(path);

  let url;
  try {
    url = new URL(path, window.location.href);
  } catch {
    url = null
  }
  const isExternal = url && (url.origin !== window.location.origin);
  if (isExternal)
    return await window.__TAURI__.http.fetch(path);
  else
    await fetch(path);
}

function ensureDynamicStyleEl(doc=null) {
  if (doc==null) doc = document;
  let el = doc.getElementById(DYNAMIC_STYLE_ID);
  if (!el) {
    el = doc.createElement('style');
    el.id = DYNAMIC_STYLE_ID;
    doc.head.appendChild(el);
  }
  return el;
}

function pageSizeRule(pageSize = 'A4', orientation = 'portrait') {
  // Mapeia tamanhos permitidos
  const PageHeaderFooter = `
    @top-left {
      content: element(hf-header); /* Place the element with ID 'pageHeader' in the top-left margin */
    }

    @bottom-left {
      content: element(hf-footer); /* Place the element with ID 'pageFooter' in the bottom-left margin */
    }
  `
  const HeadeFooter = `
  #hf-header {
    position: running(hf-header); 
  }

  #hf-footer {
    position: running(hf-footer);
  }
  `;
  const allowed = new Set(['A4','Letter','Custom']);
  const size = allowed.has(pageSize) ? pageSize : 'A4';
  // Para Custom, deixamos sem size (usuário controla via CSS extra)
  if (size === 'Custom') return `@page { ${PageHeaderFooter} }\n ${HeadeFooter}`;
  const orient = orientation === 'landscape' ? 'landscape' : 'portrait';
  return `@page { size: ${size} ${orient};\n ${PageHeaderFooter} }\n ${HeadeFooter}`;
}

function applyMarginsVars(margins, element=null) {
  const root = element == null ? document.documentElement : element.documentElement;
  if (!margins) return;
  if (margins.top)    root.style.setProperty('--page-margin-top', margins.top);
  if (margins.right)  root.style.setProperty('--page-margin-right', margins.right);
  if (margins.bottom) root.style.setProperty('--page-margin-bottom', margins.bottom);
  if (margins.left)   root.style.setProperty('--page-margin-left', margins.left);
}

function sanitizeFilename(name = 'document') {
  return String(name)
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '_')
    .slice(0, 120) || 'document';
}

async function loadCssFiles(paths = []) {
  const results = await Promise.all(
    paths.map(path => myFetch(path).then(r => r.text()))
  );
  return results.join('\n');
}

async function inlineSvgs_old(html) {
  // regex simples: <img src="...svg" ...>
  const imgRegex = /<img[^>]+src=["']([^"']+\.svg)["'][^>]*>/gi;
  let match;
  let result = html;

  while ((match = imgRegex.exec(html)) !== null) {
    const svgPath = match[1];
    try {
      const svgContent = await myFetch(svgPath);
      result = result.replace(match[0], svgContent);
    } catch (err) {
      console.warn(`Falha ao injetar SVG: ${svgPath}`, err);
    }
  }

  return result;
}

function toBase64Unicode(str) {
  // unescape/encodeURIComponent garante bytes UTF-8 corretos para btoa
  return btoa(unescape(encodeURIComponent(str)));
}

/**
 * Substitui <img src="*.svg"> por <img src="data:image/svg+xml;base64,...">
 * sem alterar outros atributos.
 *
 * @param {string} html - trecho HTML onde há os <img>
 * @param {Object} [opts]
 * @param {string} [opts.baseUrl] - base para resolver caminhos relativos (default: document.baseURI)
 * @returns {Promise<string>} - HTML com os src de SVGs inline como data URI
 */
async function inlineSvgs(html, { baseUrl } = {}) {
  // usa um container para não depender do DOM atual
  const container = document.createElement('div');
  container.innerHTML = html;

  const imgs = Array.from(container.querySelectorAll('img[src$=".svg"], img[src$=".SVG"]'));
  if (imgs.length === 0) return container.innerHTML;

  const base = baseUrl || document.baseURI;

  await Promise.all(imgs.map(async (img) => {
    try {
      const src = img.getAttribute('src');
      // resolve relativo x absoluto
      const absUrl = new URL(src, base).href;

      const resp = await myFetch(absUrl);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const svgText = await resp.text();

      // monta data URI em Base64 (mais à prova de quebras que utf8 inline)
      const dataUri = `data:image/svg+xml;base64,${toBase64Unicode(svgText)}`;

      // troca SOMENTE o src; mantém todos os outros atributos
      img.setAttribute('src', dataUri);
      img.loading = 'eager';

      // opcional: se houver srcset apontando para .svg, alinhar também (sem remover outros attrs)
      const srcset = img.getAttribute('srcset');
      if (srcset && /\.svg(\s|$)/i.test(srcset)) {
        img.setAttribute('srcset', dataUri);
      }
    } catch (err) {
      console.warn('Falha ao inline do SVG:', err);
      // em caso de erro, não mexe na tag
    }
  }));

  return container.innerHTML;
}
export class ExportService {
  /**
   * Aplica DocConfig no documento (CSS vars + @page dinâmico).
   * Chame antes de visualizar/imprimir.
   * @param {import('../models/DocConfig.js').DocConfig} docConfig
   */
static applyDocConfig(docConfig, doc=null) {
    if (doc == null) doc = document;
    const { pageSize = 'A4', orientation = 'portrait', margins } = docConfig || {};
    applyMarginsVars(margins, doc);
    const styleEl = ensureDynamicStyleEl(doc);
    styleEl.textContent = pageSizeRule(pageSize, orientation);
    // Classe auxiliar para CSS geral (se quiser usar em outros seletores)
    
    doc.body.classList.toggle('landscape', orientation === 'landscape');
  }

  /**
   * Entra em modo de impressão: esconde UI e prepara página.
   */
  static enterPrintMode() {
    document.body.classList.add('print-mode');
  }

  /**
   * Sai do modo de impressão.
   */
  static exitPrintMode() {
    document.body.classList.remove('print-mode');
  }

  /**
   * Dispara o fluxo de impressão (PDF via diálogo do navegador/SO).
   * @param {Function} [beforePrint] - callback antes de chamar print()
   * @param {Function} [afterPrint]  - callback após fechamento do diálogo
   */
  static exportPDF(beforePrint, afterPrint) {
    const after = () => {
      try { afterPrint && afterPrint(); } catch {}
      // Pequeno atraso para garantir restauração de UI
      setTimeout(() => ExportService.exitPrintMode(), 50);
      window.removeEventListener('afterprint', after);
    };

    ExportService.enterPrintMode();
    try { beforePrint && beforePrint(); } catch {}

    // Hook confiável em navegadores modernos
    window.addEventListener('afterprint', after);
    // Chama a impressão
    window.print();

    // Fallback: se afterprint não disparar (casos raros), aplica timeout
    setTimeout(() => {
      if (document.body.classList.contains('print-mode')) after();
    }, 4000);
  }

  /**
   * Cria um download de arquivo HTML (ou outro mimetype).
   * @param {string|Blob} content - conteúdo do arquivo
   * @param {string} filename - nome sugerido (será sanitizado)
   * @param {string} [mime='text/html;charset=utf-8']
   */
  /*static download(content, filename, mime = 'text/html;charset=utf-8') {
    const safe = sanitizeFilename(filename);
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = safe;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 0);
  }*/
  static async download(content, filename, mime = 'text/html;charset=utf-8') {
    // normaliza conteúdo
    const toBlob = async (c) =>
      c instanceof Blob ? c : new Blob([c], { type: mime });

    // 1) Tauri (dialog + fs)
    if (window.__TAURI__?.dialog?.save && window.__TAURI__?.fs?.writeFile) {
      try {
        const suggested = filename || 'arquivo';
        const path = await window.__TAURI__.dialog.save({
          defaultPath: suggested,
          filters: [{ name: 'Arquivo', extensions: ['html','htm','txt','pdf','*'] }]
        });
        if (path) {
          const blob = await toBlob(content);
          const buf = new Uint8Array(await blob.arrayBuffer());
          await window.__TAURI__.fs.writeFile(path, buf);
          return true;
        }
      } catch (e) { /* cai pro próximo método */ }
    }

    // 2) Web: File System Access API (Chromium)
    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: filename || 'arquivo.html',
          types: [{ description: 'Arquivo', accept: { [mime.split(';')[0]]: ['.html','.htm','.txt','.pdf'] } }]
        });
        const writable = await handle.createWritable();
        const blob = await toBlob(content);
        await writable.write(blob);
        await writable.close();
        return true;
      } catch (e) { /* usuário cancelou ou não suportado */ }
    }

    // 3) Fallback: <a download> (pode não abrir "Save As" conforme config do browser)
    const safe = filename || 'arquivo.html';
    const blob = await toBlob(content);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = safe;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
    return true;
  }

  /**
   * Exporta HTML já montado (full document) para download.
   * @param {string} fullHtml
   * @param {string} filename
   */
  static exportHTML(fullHtml, filename = 'document.html') {
    return ExportService.download(fullHtml, filename, 'text/html;charset=utf-8');
  }

  static async toLocalContent(html)
  {
    return await inlineSvgs(html);
  }

  static async getInlineStyles() {
    // Função para pegar todos os estilos CSS embutidos
    let styles = "";

    // Pegar todos os estilos no documento (estilos internos e links)
    const styleSheets = document.styleSheets;
    for (let sheet of styleSheets) {
        try {
            if (sheet.href)
                styles += await myFetch(sheet.href);
            else
              for (let rule of sheet.cssRules)
                styles += rule.cssText + "\n";
        } catch (e) {
            console.error("Erro ao acessar a folha de estilo:", e);
        }
    }
    return styles;
  }

  /**
   * Compoe um HTML mínimo completo com body/header/footer fornecidos.
   * Útil para exportar um arquivo standalone rapidamente.
   * Observação: por padrão referencia CSS do projeto; para "um arquivo só", use inlineCss e forneça cssText.
   *
   * @param {Object} opts
   * @param {string} opts.title
   * @param {string} opts.bodyHtml    - conteúdo do documento (#doc-root)
   * @param {string} [opts.headerHtml] - opcional, será injetado com class 'page-header'
   * @param {string} [opts.footerHtml] - opcional, será injetado com class 'page-footer'
   * @param {string} [opts.customCss]  - CSS adicional do usuário
   * @param {boolean} [opts.inlineCss=false]
   * @param {string} [opts.cssText]    - quando inlineCss=true, CSS completo para embutir
   * @returns {string} HTML completo
   */
  static async composeFullHtml(title, element) {
    const contentHtml = await inlineSvgs(element.outerHTML);
    return `<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        ${await this.getInlineStyles()}
    </style>
</head>
<body>
    ${contentHtml}
</body>
</html>`;
  }
}

// Util local simples para escapar o <title>
function escapeHtml(s='') {
  return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}

export default ExportService;
