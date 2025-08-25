// src/utils/dom.js
// Helpers básicos de DOM usados no app:
// - injectPartial: injeta um HTML externo (navbar) em um container
// - debounce: cria função debounced
// - qs/qsa: atalhos para querySelector(s)

/**
 * Injeta o conteúdo HTML de um arquivo externo no elemento alvo.
 * Útil para incluir a navbar (partials/navbar.html) em todas as páginas sem duplicação.
 * @param {string} targetSelector - seletor CSS do elemento contêiner (ex.: '#navbar')
 * @param {string} url - caminho do arquivo HTML parcial (relativo à página)
 * @returns {Promise<void>}
 */
export async function injectPartial(targetSelector, url) {
  const el = document.querySelector(targetSelector);
  if (!el) return;
  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    el.innerHTML = html;
  } catch (err) {
    // fallback: mostra mensagem simples no lugar do partial (sem quebrar a página)
    el.innerHTML = `<div class="alert alert-warning m-2">Falha ao carregar parcial: ${escapeHtml(
      String(url)
    )}</div>`;
    // eslint-disable-next-line no-console
    console.warn('injectPartial error:', err);
  }
}

/**
 * Debounce simples
 * @template {Function} F
 * @param {F} fn
 * @param {number} ms
 * @returns {F}
 */
export function debounce(fn, ms = 250) {
  let t = null;
  return function debounced(...args) {
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      // @ts-ignore
      fn.apply(this, args);
    }, ms);
  };
}

/** querySelector atalho */
export function qs(sel, root) {
  return (root || document).querySelector(sel);
}

/** querySelectorAll atalho (retorna array) */
export function qsa(sel, root) {
  return Array.from((root || document).querySelectorAll(sel));
}

// util local para mensagem de erro do injectPartial
function escapeHtml(s = '') {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

export default { injectPartial, debounce, qs, qsa };
