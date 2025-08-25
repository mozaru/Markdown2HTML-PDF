// src/controllers/AdvancedController.js
// Página Avançada: header/footer (MD/HTML + placeholders), presets, página (tamanho/orientação/margens)
// Preview com Twemoji e integração com Paged.js (máscaras via PagedHooksService).

import MarkdownService from '../services/MarkdownService.js';
import TwemojiService from '../services/TwemojiService.js';
import ExportService from '../services/ExportService.js';
import TemplateService, { applyHeaderFooterPlaceholders } from '../services/TemplateService.js';
import StorageService from '../services/StorageService.js';
import PagedHooksService from '../services/PagedHooksService.js';
import StateService from '../services/StateService.js';
import Logger from '../services/LoggerService.js';
import DocConfig from '../models/DocConfig.js';
import { readTextFile } from '../utils/file.js';
import { qs, debounce } from '../utils/dom.js';
import { sanitize } from '../utils/sanitize.js';

export class AdvancedController {
  constructor() {
    this.md = new MarkdownService();
    this.docConfig = new DocConfig();
    this.currentMd = '';
    this.filename = 'document.md';
    this.hfMode = 'md'; // 'md' | 'html'
    this.pagedLoaded = false;
  }

  init() {
    PagedHooksService.install();
    this.cacheEls();
    this.bindUi();
    this.bindShortcuts();
    this.loadDefaultPresetIfAny();
  }

  cacheEls() {
    // Entrada básica
    this.dropzone = qs('#dropzone');
    this.fileInput = qs('#fileInput');
    this.titleEl  = qs('#docTitle');
    // Abas Header/Footer
    this.modeMd   = qs('#modeMd');
    this.modeHtml = qs('#modeHtml');
    this.headerEditor = qs('#headerEditor');
    this.footerEditor = qs('#footerEditor');
    this.insPhHeader = qs('#insPhHeader');
    this.insPhFooter = qs('#insPhFooter');
    this.btnHelpPlaceholders = qs('#btnHelpPlaceholders');
    // Página
    this.pageSize = qs('#pageSize');
    this.orientPortrait = qs('#orientPortrait');
    this.orientLandscape = qs('#orientLandscape');
    this.marginTop = qs('#marginTop');
    this.marginRight = qs('#marginRight');
    this.marginBottom = qs('#marginBottom');
    this.marginLeft = qs('#marginLeft');
    // CSS extra
    this.customCss = qs('#customCss');
    // Presets
    this.presetName = qs('#presetName');
    this.presetList = qs('#presetList');
    this.btnPresetSave = qs('#btnPresetSave');
    this.btnPresetDelete = qs('#btnPresetDelete');
    this.btnPresetLoad = qs('#btnPresetLoad');
    this.btnPresetDefault = qs('#btnPresetDefault');
    this.btnPresetExport = qs('#btnPresetExport');
    this.btnPresetImport = qs('#btnPresetImport');
    this.btnImportConfirm = qs('#btnImportConfirm');
    this.importJson = qs('#importJson');
    // Preview & ações
    this.btnEditMarkdown  = qs('#btnEditMarkdown');
    this.btnLoadSample  = qs('#btnLoadSample');
    this.btnVisualize = qs('#btnVisualize');
    this.btnExportHtml = qs('#btnExportHtml');
    this.btnExportPdf = qs('#btnExportPdf');
    this.docRoot  = qs('#doc-root');
    this.hfHeader = qs('#hf-header');
    this.hfFooter = qs('#hf-footer');
    
    // estilo do usuário (preview)
    this.userCssEl = document.getElementById('user-css');
    if (!this.userCssEl) {
      this.userCssEl = document.createElement('style');
      this.userCssEl.id = 'user-css';
      document.head.appendChild(this.userCssEl);
    }

    const iframe = document.getElementById('preview-frame');
    this.preview = iframe.parentElement;

    this.editorWrap = qs('#editorWrap');
    this.mdEditor = qs('#mdEditor');
    this.btnApply = qs('#btnApply');
    this.btnCancel = qs('#btnCancel');
  }

  bindUi() {
    // Arquivo
    this.fileInput.addEventListener('change', async (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      await this.loadFile(f);
    });
    // Drag & drop
    const stop = (ev) => { ev.preventDefault(); ev.stopPropagation(); };
    ['dragenter','dragover','dragleave','drop'].forEach(evt => {
      this.dropzone.addEventListener(evt, stop);
    });
    this.dropzone.addEventListener('dragover', () => this.dropzone.classList.add('dragover'));
    this.dropzone.addEventListener('dragleave', () => this.dropzone.classList.remove('dragover'));
    this.dropzone.addEventListener('drop', async (ev) => {
      this.dropzone.classList.remove('dragover');
      const f = ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files[0];
      if (!f) return;
      await this.loadFile(f);
    });

    // Título
    this.titleEl.addEventListener('input', (e) => {
      const title = String(e.target.value || '');
      StateService.setState({ title });
      this.docConfig.title = title;
      this.updateHeaderFooter(); // TITLE pode aparecer nos H/F
    });

    // HF modo
    this.modeMd.addEventListener('change', () => { if (this.modeMd.checked) { this.hfMode = 'md'; this.updateHeaderFooter(); } });
    this.modeHtml.addEventListener('change', () => { if (this.modeHtml.checked) { this.hfMode = 'html'; this.updateHeaderFooter(); } });

    // HF editores
    const deb = debounce(() => this.updateHeaderFooter(), 250);
    this.headerEditor.addEventListener('input', deb);
    this.footerEditor.addEventListener('input', deb);

    // Placeholder inserção
    const bindPhMenu = (menuEl, targetTextarea) => {
      if (!menuEl || !targetTextarea) return;
      menuEl.addEventListener('click', (ev) => {
        const btn = ev.target.closest('[data-ph]');
        if (!btn) return;
        ev.preventDefault();
        const ph = btn.getAttribute('data-ph');
        this.insertAtCursor(targetTextarea, ph);
        this.updateHeaderFooter();
      });
    };
    bindPhMenu(this.insPhHeader, this.headerEditor);
    bindPhMenu(this.insPhFooter, this.footerEditor);

    // Página - tamanho/orientação/margens
    this.pageSize.addEventListener('change', () => { this.docConfig.pageSize = this.pageSize.value; });
    this.orientPortrait.addEventListener('change', () => { if (this.orientPortrait.checked) this.docConfig.orientation = 'portrait'; });
    this.orientLandscape.addEventListener('change', () => { if (this.orientLandscape.checked) this.docConfig.orientation = 'landscape'; });
    const updateMargins = () => {
      this.docConfig.margins = {
        top: this.marginTop.value || '20mm',
        right: this.marginRight.value || '18mm',
        bottom: this.marginBottom.value || '20mm',
        left: this.marginLeft.value || '18mm'
      };
    };
    [this.marginTop, this.marginRight, this.marginBottom, this.marginLeft].forEach(el => {
      el.addEventListener('input', debounce(updateMargins, 200));
    });

    // CSS extra (preview e export)
    this.customCss.addEventListener('input', debounce(() => {
      this.docConfig.customCss = this.customCss.value || '';
      this.userCssEl.textContent = this.docConfig.customCss;
    }, 200));

    // Presets
    this.btnPresetSave.addEventListener('click', () => this.onPresetSave());
    this.btnPresetDelete.addEventListener('click', () => this.onPresetDelete());
    this.btnPresetLoad.addEventListener('click', () => this.onPresetLoad());
    this.btnPresetDefault.addEventListener('click', () => this.onPresetDefault());
    this.btnPresetExport.addEventListener('click', () => this.onPresetExport());
    if (this.btnImportConfirm) {
      this.btnImportConfirm.addEventListener('click', () => this.onPresetImport());
    }

    // Ações
    this.btnLoadSample.addEventListener('click', () => this.loadSample());
    this.btnEditMarkdown.addEventListener('click', () => this.editMarkdown());
    this.btnVisualize.addEventListener('click', () => this.applyAndPreview());
    this.btnExportHtml.addEventListener('click', () => this.exportHtml());
    this.btnExportPdf.addEventListener('click', () => this.exportPdf());
    this.btnApply?.addEventListener('click', () => this.applyAndPreview());
    this.btnCancel?.addEventListener('click', () => this.cancelEdit());
    this.mdEditor?.addEventListener('keydown', (ev) => {
      if ((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter') {
        ev.preventDefault();
        this.applyAndPreview();
      }
      if (ev.key === 'Tab') {
        ev.preventDefault();
        const start = ev.target.selectionStart;
        const end = ev.target.selectionEnd;
        const v = ev.target.value;
        ev.target.value = v.substring(0, start) + '\t' + v.substring(end);
        ev.target.selectionStart = ev.target.selectionEnd = start + 1;
      }
    });
  }

  bindShortcuts() {
    window.addEventListener('app:shortcut:open', () => this.fileInput?.click());
    window.addEventListener('app:shortcut:print', () => this.exportPdf());
    window.addEventListener('app:shortcut:save', () => this.exportHtml());
    window.addEventListener('app:shortcut:visualize', () => this.renderPreview());
  }

  editMarkdown() {
    if (this.mdEditor) this.mdEditor.value = this.currentMd || '';
    this.toggleEditor(true);
  }

  applyAndPreview() {
    if (this.editorWrap && !this.editorWrap.hidden) {
      this.currentMd = this.mdEditor?.value ?? this.currentMd;
    }
    this.renderPreview();
    this.toggleEditor(false);
  }

  cancelEdit() {
    this.toggleEditor(false);
  }

  toggleEditor(showEditor) {
    if (!this.editorWrap) return;
    this.editorWrap.hidden = !showEditor;
    if (this.preview) this.preview.style.display = showEditor ? 'none' : '';
    if (showEditor) this.mdEditor?.focus();
  }

  async loadDefaultPresetIfAny() {
    try {
      const id = StorageService.getDefaultPreset();
      if (!id) return this.refreshPresetList();
      const p = StorageService.loadPreset(id);
      if (p) {
        await this.applyPreset(p);
      }
      this.refreshPresetList(id);
    } catch (err) {
      Logger.warn('Falha ao carregar preset padrão', { error: String(err && err.message || err) });
      this.refreshPresetList();
    }
  }

  async loadFile(file) {
    try {
      const text = await readTextFile(file);
      this.currentMd = text;
      this.filename = file.name || 'document.md';
      // Sugerir título se vazio
      if (!this.titleEl.value) {
        const base = this.filename.replace(/\.[^.]+$/, '');
        this.titleEl.value = base;
        this.docConfig.title = base;
        StateService.setState({ title: base });
      }
      this.renderPreview();
    } catch (err) {
      Logger.error('Falha ao ler arquivo', { error: String(err && err.message || err) });
    }
  }

  async renderBody() {
    const html = this.md.render(this.currentMd || '');
    this.docRoot.innerHTML = html;
    TwemojiService.toTwemojiInPlace(this.docRoot);
  }

  updateHeaderFooter() {
    // Gera header/footer HTML conforme modo selecionado, aplica placeholders e registra máscaras
    let headerHtml = '';
    let footerHtml = '';

    if (this.hfMode === 'md') {
      headerHtml = this.md.render(this.headerEditor.value || '');
      footerHtml = this.md.render(this.footerEditor.value || '');
    } else {
      headerHtml = sanitize(this.headerEditor.value || '');
      footerHtml = sanitize(this.footerEditor.value || '');
    }

    // Aplica placeholders (DATE/TIME/TITLE/PAGE/PAGES)
    const res = applyHeaderFooterPlaceholders({ headerHtml, footerHtml }, this.docConfig, { now: new Date() });

    // Preenche elementos de preview (running elements para Paged.js)
    this.hfHeader.innerHTML = res.headerHtml;
    this.hfFooter.innerHTML = res.footerHtml;

    // Twemoji nos H/F
    TwemojiService.toTwemojiInPlace(this.hfHeader);
    TwemojiService.toTwemojiInPlace(this.hfFooter);

    // Registra máscaras para PagedHooksService aplicar após render do Paged
    PagedHooksService.registerMasks(res.masks);

  }

  copiarEstilosComPrefixoDoIframe(iframe, prefixo=null) {
      if (!iframe || !iframe.contentDocument) {
          console.error('Iframe inválido ou inacessível.');
          return;
      }

      const docOrigem = iframe.contentDocument;
      const styleSheets = [...docOrigem.styleSheets];
      const regrasFiltradas = [];

      for (const sheet of styleSheets) {
          try {
              const rules = sheet.cssRules || sheet.rules;
              if (!rules) continue;

              for (const rule of rules) {
                  if (rule.selectorText && (prefixo==null || rule.selectorText.startsWith(prefixo))) {
                      regrasFiltradas.push(rule.cssText);
                  }
              }
          } catch (e) {
              console.warn('Erro ao acessar folha de estilo:', e);
              continue;
          }
      }

      if (regrasFiltradas.length > 0) {
          const styleTag = document.createElement('style');
          styleTag.textContent = regrasFiltradas.join('\n');
          document.head.appendChild(styleTag);
      }
  }


  async ensurePagedLoaded(doc) {
    await new Promise((resolve, reject) => {
      let finished = false;
      const iframe = document.getElementById('preview-frame');
      iframe.contentWindow.PagedConfig = {
        before: () => {
			    return new Promise((resolve, reject) => {
				    setTimeout(() => { console.log("before !"); resolve() }, 1000);
			    })
		    },
        //auto: false,
        after: (flow) => { 
          console.log("after !", flow); 
          finished = true;
          resolve(); 
        }
      };
      const s = doc.createElement('script');
      s.src = 'assets/js/vendor/paged.polyfill.js';
      s.onload = () => { 

      };
      s.onerror = () => {
        finished=true;
        reject();
      }
      /*let sim = false
      const interval = setInterval(() => { 
        if (!finished) {
          let el = document.querySelector("#preview-frame");
          sim=!sim
          el.contentWindow.scrollBy(0,sim?el.clientHeight:0);
        }
        else clearInterval(interval);
        }, 1500);

      setTimeout(() => { if (!finished) reject("Timeout"); finished=true; }, 30000);
      */
      setTimeout(() => { if (!finished) reject("Timeout"); finished=true; }, 30000);
      doc.head.appendChild(s);
    });
  }

    loadSample() {
    this.currentMd = `# 📌 Exemplo de Documento
  
Alguns itens de teste:
- Emojis: 😀 🚀 🧪
- Código:
\`\`\`js
function hello(name){ return \`Olá, \${name}!\`; }
console.log(hello('Mundo'));
\`\`\`

Tabela:

| Produto | Qtd | Preço |
|--------:|---:|------:|
| A       |  2 | 10.00 |
| B       |  1 |  5.50 |

> Blockquote de exemplo.

E uma imagem (seu navegador vai baixar localmente ao exportar HTML/PDF):
![Logo](https://11tech.com.br/logo/11TechCompleto.svg)
`;
    this.renderPreview();
  }

  async renderPreview() {
    try { 
      this.preview.innerHTML = `
            <iframe id="preview-frame" sandbox="allow-scripts allow-same-origin" style="width:100%;height:100vh;border:0"></iframe>
            <div id="preview-loading" class="preview-loading">
              <div class="spinner" aria-label="Carregando" role="status"></div>
              <div class="msg">Renderizando preview…</div>
            </div>
      `;
      const iframe = document.getElementById('preview-frame');
      const doc = iframe.contentWindow.document;
      doc.head.innerHTML = `
        <meta charset="utf-8">
        <link rel="stylesheet" href="/assets/css/base.css">
        <link rel="stylesheet" href="/assets/css/print.css">
        <link rel="stylesheet" href="/assets/css/theme.css">
      `;
      doc.body.innerHTML = `
        <div id="hf-root">
          <header id="hf-header" class="page-header"></header>
          <footer id="hf-footer" class="page-footer"></footer>
        </div>
        <article id="doc-root"></article>
      `; 
      this.docRoot  = qs('#doc-root', doc);
      this.hfHeader = qs('#hf-header', doc);
      this.hfFooter = qs('#hf-footer', doc);
      ExportService.applyDocConfig(this.docConfig, doc);
      this.updateHeaderFooter();
      await this.renderBody();
      await this.ensurePagedLoaded(doc);
      this.copiarEstilosComPrefixoDoIframe(iframe);
      this.preview.innerHTML = doc.body.innerHTML;
      PagedHooksService.refresh();
    } catch (err) {
      Logger.error('Falha ao renderizar preview', { error: String(err && err.message || err) });
      this.preview.innerHTML = "<div class='error'><h2>Falha na conversão</h2><p>"+ String(err && err.message || err)+"</p></div>";
    }
  }


  async exportHtml() {
    // Gera HTML completo standalone
    const title = this.docConfig.title;
    const full = await ExportService.composeFullHtml(title, this.preview);
    const fname = `${title.replace(/\s+/g,'_') || 'document'}.html`;
    ExportService.exportHTML(full, fname);
  }

  async exportPdf() {
    ExportService.exportPDF();
  }

  // ===== Presets =====

  refreshPresetList(selectId = null) {
    const list = StorageService.listPresets();
    // limpa
    this.presetList.innerHTML = '';
    for (const it of list) {
      const opt = document.createElement('option');
      opt.value = it.id;
      opt.textContent = `${it.name} — ${new Date(it.updatedAt).toLocaleString()}`;
      if (selectId && it.id === selectId) opt.selected = true;
      this.presetList.appendChild(opt);
    }
  }

  collectHeaderFooterForPreset() {
    const mode = this.modeHtml.checked ? 'html' : 'md';
    const hf = {
      mode,
      headerMd: '',
      footerMd: '',
      headerHtml: '',
      footerHtml: '',
      placeholders: true
    };
    if (mode === 'md') {
      hf.headerMd = this.headerEditor.value || '';
      hf.footerMd = this.footerEditor.value || '';
      hf.headerHtml = this.md.render(hf.headerMd);
      hf.footerHtml = this.md.render(hf.footerMd);
    } else {
      hf.headerHtml = sanitize(this.headerEditor.value || '');
      hf.footerHtml = sanitize(this.footerEditor.value || '');
    }
    return hf;
  }

  async applyPreset(preset) {
    // DocConfig
    this.docConfig = new DocConfig(preset.docConfig || {});
    this.titleEl.value = this.docConfig.title || '';
    // Página
    this.pageSize.value = this.docConfig.pageSize;
    this.orientPortrait.checked = this.docConfig.orientation !== 'landscape';
    this.orientLandscape.checked = this.docConfig.orientation === 'landscape';
    this.marginTop.value = this.docConfig.margins?.top || '20mm';
    this.marginRight.value = this.docConfig.margins?.right || '18mm';
    this.marginBottom.value = this.docConfig.margins?.bottom || '20mm';
    this.marginLeft.value = this.docConfig.margins?.left || '18mm';
    // CSS extra
    this.customCss.value = preset.docConfig?.customCss || '';
    this.userCssEl.textContent = this.customCss.value;
    // Header/Footer
    const hf = preset.headerFooter || {};
    this.hfMode = hf.mode === 'html' ? 'html' : 'md';
    this.modeHtml.checked = this.hfMode === 'html';
    this.modeMd.checked = this.hfMode !== 'html';

    if (this.hfMode === 'md') {
      this.headerEditor.value = hf.headerMd || '';
      this.footerEditor.value = hf.footerMd || '';
    } else {
      this.headerEditor.value = hf.headerHtml || '';
      this.footerEditor.value = hf.footerHtml || '';
    }
    // Atualiza preview H/F (placeholders etc.)
    this.updateHeaderFooter();
    StateService.setState({ title: this.docConfig.title });
  }

  onPresetSave() {
    const name = (this.presetName.value || '').trim() || 'Preset sem nome';
    const preset = {
      name,
      docConfig: this.docConfig,
      headerFooter: this.collectHeaderFooterForPreset()
    };
    const id = StorageService.savePreset(preset);
    this.refreshPresetList(id);
  }

  onPresetDelete() {
    const id = this.presetList.value;
    if (!id) return;
    StorageService.deletePreset(id);
    this.refreshPresetList();
  }

  async onPresetLoad() {
    const id = this.presetList.value;
    if (!id) return;
    const p = StorageService.loadPreset(id);
    if (!p) return;
    await this.applyPreset(p);
    StateService.setState({ presetId: id });
  }

  onPresetDefault() {
    const id = this.presetList.value;
    if (!id) return;
    StorageService.setDefaultPreset(id);
  }

  onPresetExport() {
    const id = this.presetList.value;
    if (!id) return;
    const json = StorageService.exportPreset(id);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'preset.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 0);
  }

  onPresetImport() {
    const txt = (this.importJson && this.importJson.value) || '';
    if (!txt.trim()) return;
    const id = StorageService.importPreset(txt);
    this.refreshPresetList(id);
    if (this.importJson) this.importJson.value = '';
  }

  // ===== Util =====

  insertAtCursor(textarea, text) {
    textarea.focus();
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? textarea.value.length;
    const before = textarea.value.slice(0, start);
    const after = textarea.value.slice(end);
    textarea.value = before + text + after;
    const pos = start + text.length;
    textarea.setSelectionRange(pos, pos);
  }
}

export default AdvancedController;
