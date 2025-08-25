// src/services/TwemojiService.js
// Converte emojis nativos em imagens Twemoji para garantir aparência uniforme.
// Utiliza window.twemoji (vendor). Suporta modo CDN (padrão) ou base local (para Tauri/offline).
// CSS recomendado: img.emoji { height: 1em; width: auto; vertical-align: text-bottom; }

/*
  Uso típico:
    import TwemojiService from './TwemojiService.js';
    TwemojiService.configure({ source: 'cdn', folder: 'svg' }); // ou {source:'local', base:'/assets/twemoji/', folder:'svg'}
    const html = TwemojiService.toTwemoji(markdownHtml);
    // ou in-place:
    TwemojiService.toTwemojiInPlace(document.getElementById('doc-root'));
*/

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/';
const DEFAULTS = {
  source: 'cdn',              // 'cdn' | 'local'
  base: CDN_BASE,             // quando source='cdn': usar CDN_BASE; quando 'local': path local (ex.: './assets/twemoji/')
  folder: 'svg',              // 'svg' | '72x72' (png)
  ext: '.svg',                // '.svg' | '.png' — coerente com folder
};

let current = { ...DEFAULTS };

function buildTwemojiOptions() {
  const base = current.source === 'local' ? (current.base || './assets/twemoji/') : CDN_BASE;
  const folder = current.folder === '72x72' ? '72x72' : 'svg';
  const ext = folder === '72x72' ? '.png' : '.svg';

  // Ignorar conversão dentro de tags onde não faz sentido
  const ignore = (node) => {
    if (!node || !node.tagName) return false;
    const tag = node.tagName.toUpperCase();
    return tag === 'CODE' || tag === 'PRE' || tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA';
  };

  return {
    base,
    folder,
    ext,
    className: 'emoji',
    attributes: () => ({ draggable: 'false', loading: 'eager' }),
    // parse aceita string ou Node. Para Node, a opção 'ignore' é levada em conta.
    // Para string, a 'ignore' não se aplica — então prefira toTwemojiInPlace quando possível.
    ignore
  };
}

export class TwemojiService {
  /**
   * Configura a origem dos assets do Twemoji.
   * @param {{source?:'cdn'|'local', base?:string, folder?:'svg'|'72x72', ext?:'.svg'|'.png'}} opts
   */
  static configure(opts = {}) {
    current = { ...current, ...opts };
    // coerção folder/ext
    if (current.folder === '72x72') current.ext = '.png';
    if (current.folder === 'svg') current.ext = '.svg';
    if (opts.ext) current.ext = opts.ext; // permitir override explícito
  }

  /** Retorna as opções efetivas passadas ao twemoji.parse */
  static getOptions() {
    const o = buildTwemojiOptions();
    return { base: o.base, folder: o.folder, ext: o.ext, className: o.className };
  }

  /**
   * Converte uma string HTML para HTML com imagens Twemoji.
   * Observação: a API do twemoji.parse(string, opts) não respeita 'ignore' para tags internas,
   * portanto para evitar conversão dentro de <code>/<pre>, prefira toTwemojiInPlace(rootEl).
   * @param {string} html
   * @returns {string}
   */
  static toTwemoji(html = '') {
    if (typeof window === 'undefined' || !window.twemoji || typeof window.twemoji.parse !== 'function') {
      // Sem twemoji, retorna original para não quebrar
      return html;
    }
    try {
      return window.twemoji.parse(html, buildTwemojiOptions());
    } catch {
      return html;
    }
  }

  /**
   * Converte emojis para Twemoji dentro de um elemento do DOM (melhor controle).
   * @param {Element} rootEl
   */
  static toTwemojiInPlace(rootEl) {
    if (!rootEl) return;
    if (typeof window === 'undefined' || !window.twemoji || typeof window.twemoji.parse !== 'function') {
      return; // silencioso
    }
    try {
      window.twemoji.parse(rootEl, buildTwemojiOptions());
    } catch(err) {
      console.log("Erro no toTwemojiInPlace\n"+err);
      // silencioso
    }
  }
}

export default TwemojiService;
