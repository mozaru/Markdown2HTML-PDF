// src/services/MarkdownService.js
// Renderiza Markdown -> HTML seguro usando markdown-it + highlight.js + DOMPurify.
// Requer que os vendors estejam disponíveis globalmente (markdownit, hljs, DOMPurify) via CDN ou assets vendorizados.
// Sanitização final é feita via utils/sanitize.sanitize().

import { sanitize } from '../utils/sanitize.js';

function ensureAnchorAttrs(html) {
  // Garante target/rel seguros para links externos
  return html.replace(/<a\s+([^>]*href=['\"][^'\"]+['\"][^>]*)>/gi, (m, attrs) => {
    const hasTarget = /target=/i.test(attrs);
    const hasRel = /rel=/i.test(attrs);
    let extra = '';
    if (!hasTarget) extra += ' target="_blank"';
    if (!hasRel) extra += ' rel="noopener"';
    return `<a ${attrs}${extra}>`;
  });
}

export class MarkdownService {
  /**
   * @param {Object} opts
   * @param {boolean} [opts.enableHtml=true] - Permitir HTML embutido (será sanitizado depois)
   */
  constructor({ enableHtml = true } = {}) {
    if (typeof window === 'undefined' || !window.markdownit) {
      throw new Error('markdown-it não encontrado. Inclua o script vendor antes de usar MarkdownService.');
    }

    this.md = window.markdownit({
      html: enableHtml,
      linkify: true,
      typographer: true,
      highlight: (str, lang) => {
        try {
          if (window.hljs) {
            if (lang && window.hljs.getLanguage(lang)) {
              const out = window.hljs.highlight(str, { language: lang, ignoreIllegals: true }).value;
              return `<pre><code class="hljs language-${lang}">${out}</code></pre>`;
            } else {
              const out = window.hljs.highlightAuto(str).value;
              return `<pre><code class="hljs">${out}</code></pre>`;
            }
          }
        } catch (_) { /* fallback abaixo */ }
        // Fallback: escapar conteúdo sem highlight
        const esc = this.md.utils.escapeHtml(str);
        return `<pre><code>${esc}</code></pre>`;
      }
    });
  }

  /**
   * Renderiza Markdown em HTML sanitizado
   * @param {string} mdText
   * @returns {string} HTML seguro
   */
  render(mdText = '') {
    const raw = this.md.render(mdText);
    const withLinks = ensureAnchorAttrs(raw);
    return withLinks;
    return sanitize(withLinks);
  }

  /**
   * Renderiza inline (sem <p> wrappers), sanitizado
   * @param {string} mdText
   * @returns {string}
   */
  renderInline(mdText = '') {
    const raw = this.md.renderInline(mdText);
    const withLinks = ensureAnchorAttrs(raw);
    return sanitize(withLinks);
  }
}

export default MarkdownService;
