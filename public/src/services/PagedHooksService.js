// src/services/PagedHooksService.js
// Integração com Paged.js para aplicar máscaras personalizadas em {{PAGE}}/{{PAGES}}
// após a paginação. Funciona adicionando atributos data-text nos spans .ph-page/.ph-pages
// dentro de cada página renderizada (.pagedjs_page), e força o ::after a usar attr(data-text).
//
// Requer: utils/number.formatNumberWithMask
// Eventos do Paged.js: 'pagedjs:rendered' (quando todas as páginas foram geradas).

import { formatNumberWithMask } from '../utils/number.js';

const STYLE_ID = 'paged-hooks-style-mask-override';
let installed = false;
let registered = { pageMask: undefined, pagesMask: undefined };

function ensureStyleOverride() {
  let el = document.getElementById(STYLE_ID);
  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = `
      /* Quando data-text estiver presente, usa o texto calculado em vez do counter() */
      .ph-page[data-text]::after  { content: attr(data-text) !important; }
      .ph-pages[data-text]::after { content: attr(data-text) !important; }
    `;
    document.head.appendChild(el);
  }
  return el;
}

/**
 * Formata um número segundo máscara (se houver).
 * @param {number} n
 * @param {string|undefined} mask
 * @returns {string}
 */
function maybeMask(n, mask) {
  if (!mask) return String(n);
  try { return formatNumberWithMask(n, mask); }
  catch { return String(n); }
}

/**
 * Aplica os data-text nas cópias de header/footer de cada página renderizada.
 * @param {number} totalPages
 */
function applyMasksPerPage(totalPages) {
  const pages = Array.from(document.querySelectorAll('.pagedjs_page'));
  for (const pageEl of pages) {
    const pageNum = parseInt(pageEl.getAttribute('data-page-number'), 10) || (pages.indexOf(pageEl) + 1);

    // .ph-page dentro desta página
    for (const el of pageEl.querySelectorAll('.ph-page')) {
      const text = maybeMask(pageNum, registered.pageMask);
      if (registered.pageMask) {
        el.setAttribute('data-text', text);
      } else {
        el.removeAttribute('data-text'); // deixa counter(page) padrão
      }
    }
    // .ph-pages dentro desta página
    for (const el of pageEl.querySelectorAll('.ph-pages')) {
      const text = maybeMask(totalPages, registered.pagesMask);
      if (registered.pagesMask) {
        el.setAttribute('data-text', text);
      } else {
        el.removeAttribute('data-text'); // deixa counter(pages) padrão
      }
    }
  }
}

function onRendered() {
  // total de páginas
  const pages = document.querySelectorAll('.pagedjs_page');
  const total = pages.length || 1;
  applyMasksPerPage(total);
}

export class PagedHooksService {
  /**
   * Registra máscaras a serem usadas após a paginação.
   * @param {{pageMask?:string, pagesMask?:string}} masks
   */
  static registerMasks(masks = {}) {
    registered = {
      pageMask: masks.pageMask || registered.pageMask,
      pagesMask: masks.pagesMask || registered.pagesMask
    };
  }

  /**
   * Instala listeners do Paged.js (idempotente).
   */
  static install() {
    if (installed) return;
    installed = true;
    ensureStyleOverride();
    document.addEventListener('pagedjs:rendered', onRendered);
  }

  /**
   * Força re-aplicar as máscaras imediatamente (útil após mudanças manuais).
   */
  static refresh() {
    onRendered();
  }

  /** Retorna máscaras ativas (debug/inspeção) */
  static getMasks() {
    return { ...registered };
  }
}

export default PagedHooksService;
