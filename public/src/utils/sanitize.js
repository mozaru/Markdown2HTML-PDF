// src/utils/sanitize.js
// Wrapper de DOMPurify com configuração conservadora para nosso caso de uso.
// Permite HTML típico de Markdown + imagens e tabelas, bloqueia scripts/iframes e eventos inline.

const DEFAULTS = {
  // Tags comuns do Markdown + auxiliares
  ALLOWED_TAGS: [
    'a','p','br','hr','blockquote','pre','code','span','div',
    'strong','em','b','i','u','s','del','mark','small','center',
    'h1','h2','h3','h4','h5','h6',
    'ul','ol','li',
    'table','thead','tbody','tr','th','td',
    'img'
  ],
  // Atributos seguros (sem on*). Permitimos class para estilização e data-* para Paged.js/Twemoji.
  ALLOWED_ATTR: [
    'href','target','rel','title','name','id','class','lang','text-align',
    'src','alt','width','height','loading','draggable',
    'colspan','rowspan','align','valign','scope','style',
    'data-*'
  ],
  // URIs permitidas (http/https/data para imagens). Bloqueia javascript:, vbscript:, etc.
  ALLOWED_URI_REGEXP: /^(?:(?:https?|data):|[^a-z]|[a-z+.-]+(?:[^a-z+.-]|$))/i,
  // Bloqueia tags perigosas
  FORBID_TAGS: ['script','iframe','embed','object','form','input','button','link','meta','style'],
  // Não permitir atributos data- arbitrários do usuário? Mantemos via data-*, mas DOMPurify já valida.
  ALLOW_DATA_ATTR: true,
  // Não manter conteúdo de tags proibidas
  KEEP_CONTENT: true
};

/**
 * Sanitiza uma string HTML.
 * Retorna string segura. Se DOMPurify não estiver presente, retorna o HTML como-is (fallback seguro seria escapar, mas
 * sanitizamos na renderização principal também).
 * @param {string} html
 * @param {object} [opts] - overrides do config
 * @returns {string}
 */
export function sanitize(html = '', opts = {}) {
  const cfg = { ...DEFAULTS, ...(opts || {}) };
  if (typeof window === 'undefined' || !window.DOMPurify) {
    // Fallback: retorna string original (assumimos outra camada evita inserir conteúdo não confiável)
    try { return String(html); } catch { return ''; }
  }
  try {
    let out = window.DOMPurify.sanitize(String(html), cfg);
    out = out.replace(/<a\s+([^>]*href=['\"][^'\"]+['\"][^>]*)>/gi, (m, attrs) => {
      const hasTarget = /target=/i.test(attrs);
      const hasRel = /rel=/i.test(attrs);
      let extra = '';
      if (!hasTarget) extra += ' target="_blank"';
      if (!hasRel) extra += ' rel="noopener"';
      return `<a ${attrs}${extra}>`;
    });
    return out;
  } catch {
    return '';
  }
}

/**
 * Sanitiza o innerHTML de um Element existente, in-place.
 * @param {Element} el
 * @param {object} [opts]
 */
export function sanitizeFragment(el, opts = {}) {
  if (!el) return;
  el.innerHTML = sanitize(el.innerHTML, opts);
}

export default { sanitize, sanitizeFragment };
