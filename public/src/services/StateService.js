// src/services/StateService.js
// Estado compartilhado mínimo entre controladores/páginas.
// Mantém: title, outputType ('pdf'|'html'), presetId selecionado, masks registradas, etc.
// Inclui um sistema simples de assinatura para reagir a mudanças (opcional).

const _state = {
  title: '',
  outputType: 'pdf',         // 'pdf' | 'html'
  presetId: null,            // id do preset selecionado
  masks: { pageMask: undefined, pagesMask: undefined },
};

const _subs = new Set();

function emit() {
  for (const fn of Array.from(_subs)) {
    try { fn(StateService.getState()); } catch {}
  }
}

export class StateService {
  /** Lê o estado atual (shallow clone para evitar mutações externas) */
  static getState() {
    return {
      title: _state.title,
      outputType: _state.outputType,
      presetId: _state.presetId,
      masks: { ..._state.masks },
    };
  }

  /** Aplica um patch parcial ao estado e notifica assinantes */
  static setState(partial = {}) {
    if (!partial || typeof partial !== 'object') return;
    if ('title' in partial) _state.title = String(partial.title || '');
    if ('outputType' in partial) _state.outputType = partial.outputType === 'html' ? 'html' : 'pdf';
    if ('presetId' in partial) _state.presetId = partial.presetId || null;
    if ('masks' in partial && partial.masks && typeof partial.masks === 'object') {
      _state.masks.pageMask = partial.masks.pageMask ?? _state.masks.pageMask;
      _state.masks.pagesMask = partial.masks.pagesMask ?? _state.masks.pagesMask;
    }
    emit();
  }

  /** Zera o estado para valores padrão */
  static reset() {
    _state.title = '';
    _state.outputType = 'pdf';
    _state.presetId = null;
    _state.masks = { pageMask: undefined, pagesMask: undefined };
    emit();
  }

  /** Assina mudanças de estado. Retorna função para desinscrever. */
  static subscribe(fn) {
    if (typeof fn !== 'function') return () => {};
    _subs.add(fn);
    return () => _subs.delete(fn);
  }
}

export default StateService;
