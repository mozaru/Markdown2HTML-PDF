// src/services/LoggerService.js
// Logger leve, centralizado e seguro para o browser.
// - Níveis: 'silent' | 'error' | 'warn' | 'info'
// - Persistência opcional do nível via localStorage (chave: md2pdf:log:level)
// - Formata mensagens com contexto opcional
//
// API:
//   LoggerService.setLevel(level)
//   LoggerService.getLevel()
//   LoggerService.info(msg, ctx?)
//   LoggerService.warn(msg, ctx?)
//   LoggerService.error(msg, ctx?)
//   LoggerService.tryWrap(fn, fallback?) -> retorna resultado ou fallback e loga erro
//
// Observação: por padrão nível = 'info' em dev; você pode trocar para 'silent' no release.

const LS_KEY = 'md2pdf:log:level';
const LEVELS = ['silent', 'error', 'warn', 'info'];

let _level = (() => {
  try {
    const lv = localStorage.getItem(LS_KEY);
    return LEVELS.includes(lv) ? lv : 'info';
  } catch { return 'info'; }
})();

function levelIndex(lv) { return Math.max(0, LEVELS.indexOf(lv)); }
function shouldLog(targetLevel) {
  return levelIndex(targetLevel) <= levelIndex(_level);
}

function fmtCtx(ctx) {
  if (ctx == null) return '';
  try { return JSON.stringify(ctx); } catch { return String(ctx); }
}

export class LoggerService {
  /** Define o nível de log */
  static setLevel(level) {
    if (!LEVELS.includes(level)) return;
    _level = level;
    try { localStorage.setItem(LS_KEY, level); } catch {}
  }

  /** Lê o nível atual */
  static getLevel() {
    return _level;
  }

  /** Loga info (mostrado quando nível >= info) */
  static info(msg, ctx) {
    if (!shouldLog('info')) return;
    try { console.info(`[INFO] ${msg}`, ctx ?? ''); } catch {}
  }

  /** Loga warn (mostrado quando nível >= warn) */
  static warn(msg, ctx) {
    if (!shouldLog('warn')) return;
    try { console.warn(`[WARN] ${msg}`, ctx ?? ''); } catch {}
  }

  /** Loga erro (mostrado quando nível >= error) */
  static error(msg, ctx) {
    if (!shouldLog('error')) return;
    try { console.error(`[ERROR] ${msg}`, ctx ?? ''); } catch {}
  }

  /**
   * Executa função protegida; em caso de erro, loga e retorna fallback.
   * @template T
   * @param {() => T} fn
   * @param {T} [fallback]
   * @returns {T}
   */
  static tryWrap(fn, fallback = undefined) {
    try {
      return fn();
    } catch (err) {
      LoggerService.error('Exceção em tryWrap', { error: String(err && err.message || err) });
      return fallback;
    }
  }
}

export default LoggerService;
