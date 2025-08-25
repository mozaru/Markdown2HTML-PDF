// src/services/StorageService.js
// Gerencia presets no localStorage com index, versão de schema e default preset.
// Forma do preset persistido:
// {
//   id: string,
//   schemaVersion: 1,
//   name: string,
//   docConfig: DocConfig,
//   headerFooter: HeaderFooter,
//   updatedAt: ISOString
// }
//
// API pública:
// - savePreset(preset) -> id
// - loadPreset(id) -> preset completo
// - listPresets() -> [{id, name, updatedAt}] (metadados para listar)
// - deletePreset(id)
// - setDefaultPreset(id)
// - getDefaultPreset() -> id|null
// - exportPreset(id) -> JSON string
// - importPreset(json) -> id (novo ou existente)
//
// Obs: validação de schema é defensiva e tolerante; adiciona campos padrão quando faltam.

const INDEX_KEY = 'md2pdf:preset:index';     // Array<{id,name,updatedAt}>
const PRESET_KEY = (id) => `md2pdf:preset:${id}`;
const DEFAULT_KEY = 'md2pdf:preset:default';
const SCHEMA_VERSION = 1;

function nowIso() { return new Date().toISOString(); }

function safeJsonParse(s, fallback = null) {
  try { return JSON.parse(s); } catch { return fallback; }
}

function safeGet(key, fallback = null) {
  try {
    const s = localStorage.getItem(key);
    return s == null ? fallback : s;
  } catch {
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeRemove(key) {
  try { localStorage.removeItem(key); } catch {}
}

function ensureIndex() {
  const idx = safeJsonParse(safeGet(INDEX_KEY, '[]'), []);
  if (!Array.isArray(idx)) return [];
  // normaliza
  return idx.filter(entry => entry && typeof entry.id === 'string');
}

function writeIndex(idx) {
  return safeSet(INDEX_KEY, JSON.stringify(idx));
}

function randomId() {
  // Usa crypto.randomUUID() quando disponível; fallback simples quando não.
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).slice(1);
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}

function normalizeDocConfig(dc = {}) {
  const def = {
    title: '',
    pageSize: 'A4',
    orientation: 'portrait',
    margins: { top: '20mm', right: '18mm', bottom: '20mm', left: '18mm' },
    customCss: '',
    useTwemoji: true
  };
  const out = { ...def, ...dc };
  out.margins = { ...def.margins, ...(dc && dc.margins || {}) };
  out.pageSize = ['A4','Letter','Custom'].includes(out.pageSize) ? out.pageSize : 'A4';
  out.orientation = ['portrait','landscape'].includes(out.orientation) ? out.orientation : 'portrait';
  out.useTwemoji = true; // sempre true neste projeto
  return out;
}

function normalizeHeaderFooter(hf = {}) {
  const def = {
    mode: 'md',
    headerMd: '',
    footerMd: '',
    headerHtml: '',
    footerHtml: '',
    placeholders: true
  };
  const out = { ...def, ...hf };
  out.mode = (out.mode === 'html') ? 'html' : 'md';
  out.placeholders = true;
  return out;
}

function normalizePreset(p) {
  if (!p || typeof p !== 'object') throw new Error('Preset inválido.');
  const id = typeof p.id === 'string' && p.id.trim() ? p.id : randomId();
  const name = typeof p.name === 'string' && p.name.trim() ? p.name.trim() : 'Preset sem nome';
  const preset = {
    id,
    schemaVersion: SCHEMA_VERSION,
    name,
    docConfig: normalizeDocConfig(p.docConfig),
    headerFooter: normalizeHeaderFooter(p.headerFooter),
    updatedAt: p.updatedAt || nowIso()
  };
  return preset;
}

export class StorageService {
  /**
   * Salva (cria/atualiza) um preset. Retorna o id.
   * @param {{id?:string, name:string, docConfig:Object, headerFooter:Object}} preset
   * @returns {string} id
   */
  static savePreset(preset) {
    const norm = normalizePreset(preset || {});
    const key = PRESET_KEY(norm.id);
    const ok = safeSet(key, JSON.stringify(norm));
    if (!ok) throw new Error('Falha ao salvar preset no localStorage.');

    // Atualiza index
    const idx = ensureIndex();
    const i = idx.findIndex(e => e.id === norm.id);
    const meta = { id: norm.id, name: norm.name, updatedAt: nowIso() };
    if (i >= 0) idx[i] = meta; else idx.push(meta);
    writeIndex(idx);
    return norm.id;
  }

  /**
   * Carrega um preset completo pelo id.
   * @param {string} id
   * @returns {object|null}
   */
  static loadPreset(id) {
    if (!id) return null;
    const raw = safeGet(PRESET_KEY(id));
    if (!raw) return null;
    const p = safeJsonParse(raw, null);
    if (!p) return null;
    // Normaliza para schema atual
    return normalizePreset(p);
  }

  /**
   * Lista metadados de presets (id, name, updatedAt).
   * @returns {Array<{id:string,name:string,updatedAt:string}>}
   */
  static listPresets() {
    return ensureIndex();
  }

  /**
   * Apaga um preset.
   * @param {string} id
   */
  static deletePreset(id) {
    if (!id) return;
    safeRemove(PRESET_KEY(id));
    const idx = ensureIndex().filter(e => e.id !== id);
    writeIndex(idx);
    const def = this.getDefaultPreset();
    if (def === id) safeRemove(DEFAULT_KEY);
  }

  /**
   * Define um preset como padrão.
   * @param {string} id
   */
  static setDefaultPreset(id) {
    if (!id) return;
    // só aceita se existir
    const exists = !!this.loadPreset(id);
    if (!exists) throw new Error('Preset não encontrado.');
    safeSet(DEFAULT_KEY, id);
  }

  /**
   * Retorna o id do preset padrão, se houver.
   * @returns {string|null}
   */
  static getDefaultPreset() {
    const id = safeGet(DEFAULT_KEY, null);
    return id || null;
  }

  /**
   * Exporta um preset como JSON string.
   * @param {string} id
   * @returns {string} JSON
   */
  static exportPreset(id) {
    const p = this.loadPreset(id);
    if (!p) throw new Error('Preset não encontrado para exportar.');
    return JSON.stringify(p, null, 2);
  }

  /**
   * Importa um preset a partir de JSON string. Retorna o novo id.
   * - Garante schemaVersion atual
   * - Gera novo id para evitar colisão
   * @param {string} json
   * @returns {string} id
   */
  static importPreset(json) {
    const obj = safeJsonParse(json, null);
    if (!obj) throw new Error('JSON inválido.');
    const norm = normalizePreset({ ...obj, id: undefined, updatedAt: nowIso() });
    return this.savePreset(norm);
  }
}

export default StorageService;
