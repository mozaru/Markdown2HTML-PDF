// src/services/TemplateService.js
// Resolve placeholders e aplica formatações de data/hora, título (cases) e paginação (máscaras).
// Observação: valores de {{PAGE}} e {{PAGES}} são resolvidos APÓS a paginação (Paged.js).
// Aqui substituímos por spans marcados e registramos máscaras para o PagedHooksService.
//
// Depende de utils/date.js, utils/number.js, utils/case.js

import { formatDate, formatTime } from '../utils/date.js';
import { formatNumberWithMask } from '../utils/number.js'; // usado apenas para validação/opcional
import { transformCase } from '../utils/case.js';

const PH_RE = /\{\{\s*([A-Z]+)\s*(?::\s*([^}]+?)\s*)?\}\}/g; // {{NAME[:fmt]}}

function normalizeCaseToken(token = '') {
  // normaliza variantes: UPPERCASE, upper, Upper, etc.
  const t = String(token).trim()
    .replace(/[\s_-]+/g, '_')   // 'Screaming Kebab Case' -> 'SCREAMING_KEBAB_CASE'
    .toLowerCase();

  const map = {
    'upper': 'upper',
    'uppercase': 'upper',
    'lower': 'lower',
    'lowercase': 'lower',
    'camel': 'camel',
    'camelcase': 'camel',
    'pascal': 'pascal',
    'pascalcase': 'pascal',
    'snake': 'snake',
    'snakecase': 'snake',
    'kebab': 'kebab',
    'kebabcase': 'kebab',
    'screaming_snake': 'scream_snake',
    'screamingsnakecase': 'scream_snake',
    'screaming_kebab': 'scream_kebab',
    'screamingkebabcase': 'scream_kebab',
    'train': 'train',
    'traincase': 'train',
    'flat': 'flat',
    'flatcase': 'flat',
    'upper_flat': 'upper_flat',
    'upperflatcase': 'upper_flat',
    'camel_snake': 'camel_snake',
    'camelsnakecase': 'camel_snake',
    'pascal_snake': 'pascal_snake',
    'pascalsnakecase': 'pascal_snake',
    'screaming': 'scream_words',
    'screamingcase': 'scream_words',
    'screaming_words': 'scream_words'
  };
  return map[t] || t;
}

/**
 * Substitui placeholders na string HTML fornecida.
 * - DATE/TIME usam utils/date (patterns como dd/mm/yyyy, HH:mm, etc.)
 * - TITLE usa utils/case (camel, pascal, snake, kebab, upper, lower, ...)
 * - PAGE/PAGES ficam como spans marcados para Paged.js finalizar
 *
 * @param {string} html
 * @param {import('../models/DocConfig.js').DocConfig} docConfig
 * @param {{now?: Date}} [ctx]
 * @returns {{ html: string, masks: { pageMask?: string, pagesMask?: string } }}
 */
export function applyPlaceholders(html = '', docConfig, ctx = {}) {
  const now = ctx.now || new Date();
  const masks = { pageMask: undefined, pagesMask: undefined };
  const title = String(docConfig?.title || '');

  const out = html.replace(PH_RE, (_m, rawName, rawFmt) => {
    const name = String(rawName).trim().toUpperCase();
    const fmt = rawFmt ? String(rawFmt).trim() : undefined;

    switch (name) {
      case 'DATE': {
        const pattern = fmt || 'dd/mm/yyyy';
        return formatDate(now, pattern);
      }
      case 'TIME': {
        const pattern = fmt || 'HH:mm';
        return formatTime(now, pattern);
      }
      case 'TITLE': {
        if (!fmt) return title;
        const mode = normalizeCaseToken(fmt);
        return transformCase(title, mode);
      }
      case 'PAGE': {
        const mask = fmt; // pode ser undefined
        if (mask) {
          // validação superficial opcional via formatNumberWithMask
          try { formatNumberWithMask(1, mask); } catch(_) { /* ignora erros de máscara */ }
          if (!masks.pageMask) masks.pageMask = mask;
          return `<span class="ph-page" data-mask="${escapeHtmlAttr(mask)}"></span>`;
        }
        return `<span class="ph-page"></span>`;
      }
      case 'PAGES': {
        const mask = fmt;
        if (mask) {
          try { formatNumberWithMask(1, mask); } catch(_) { /* ignora erros de máscara */ }
          if (!masks.pagesMask) masks.pagesMask = mask;
          return `<span class="ph-pages" data-mask="${escapeHtmlAttr(mask)}"></span>`;
        }
        return `<span class="ph-pages"></span>`;
      }
      default:
        return _m; // deixa como está, caso surjam placeholders não suportados
    }
  });

  return { html: out, masks };
}

/**
 * Aplica placeholders para cabeçalho/rodapé já em HTML.
 * Uso típico na Avançada após render do Markdown (quando mode='md').
 *
 * @param {{ headerHtml: string, footerHtml: string }} hfHtml
 * @param {import('../models/DocConfig.js').DocConfig} docConfig
 * @param {{now?: Date}} [ctx]
 * @returns {{ headerHtml: string, footerHtml: string, masks: { pageMask?: string, pagesMask?: string } }}
 */
export function applyHeaderFooterPlaceholders(hfHtml, docConfig, ctx) {
  const r1 = applyPlaceholders(hfHtml?.headerHtml || '', docConfig, ctx);
  const r2 = applyPlaceholders(hfHtml?.footerHtml || '', docConfig, ctx);
  // Preferência: se as duas tiverem máscara definida, mantém a primeira encontrada
  const masks = {
    pageMask: r1.masks.pageMask || r2.masks.pageMask,
    pagesMask: r1.masks.pagesMask || r2.masks.pagesMask
  };
  return { headerHtml: r1.html, footerHtml: r2.html, masks };
}

/**
 * Exposto para casos em que se queira normalizar e checar máscara antes de registrar.
 * @param {string} mask
 * @returns {string} mesma máscara (aqui poderíamos higienizar/limitar tamanho se desejado)
 */
export function parseMask(mask) {
  return String(mask || '');
}

/**
 * Transforma título segundo modo solicitado.
 * @param {string} title
 * @param {string} [mode]
 * @returns {string}
 */
export function applyTitleTransforms(title, mode) {
  if (!mode) return title;
  return transformCase(String(title || ''), normalizeCaseToken(mode));
}

// Utilidades locais
function escapeHtmlAttr(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default {
  applyPlaceholders,
  applyHeaderFooterPlaceholders,
  applyTitleTransforms,
  parseMask
};
