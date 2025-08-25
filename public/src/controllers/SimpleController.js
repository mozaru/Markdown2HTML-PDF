// src/controllers/SimpleController.js
// teste
// Lida com o fluxo da página de Conversão Simples.
// - Leitura de arquivo .md (input/drag&drop)
// - Preview (markdown-it + DOMPurify + highlight + Twemoji)
// - Conversão: PDF (window.print) ou HTML (download)

import MarkdownService from '../services/MarkdownService.js';
import TwemojiService from '../services/TwemojiService.js';
import ExportService from '../services/ExportService.js';
import StateService from '../services/StateService.js';
import Logger from '../services/LoggerService.js';
import DocConfig from '../models/DocConfig.js';
import { readTextFile } from '../utils/file.js';
import { qs } from '../utils/dom.js';

export class SimpleController {
  constructor() {
    this.md = new MarkdownService();
    this.docConfig = new DocConfig(); // defaults (A4 retrato, margens padrão)
    this.currentMd = '';
    this.filename = 'document.md';
  }

  init() {
    this.cacheEls();
    this.bindUi();
    this.bindShortcuts();
  }

  cacheEls() {
    this.dropzone = qs('#dropzone');
    this.fileInput = qs('#fileInput');
    this.btnSample  = qs('#btnSample');
    this.btnEditMarkdown  = qs('#btnEditMarkdown');
    this.btnVisualize = qs('#btnVisualize');
    this.btnExportHtml = qs('#btnExportHtml');
    this.btnExportPdf = qs('#btnExportPdf');
    this.docRoot  = qs('#doc-root');
    this.preview = this.docRoot.parentElement;

    this.editorWrap = qs('#editorWrap');
    this.mdEditor = qs('#mdEditor');
    this.btnApply = qs('#btnApply');
    this.btnCancel = qs('#btnCancel');
  }

  bindUi() {
    // file input
    this.fileInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      await this.loadFile(file);
    });

    // drag & drop
    const stop = (ev) => { ev.preventDefault(); ev.stopPropagation(); };
    ['dragenter','dragover','dragleave','drop'].forEach(evt => {
      this.dropzone.addEventListener(evt, stop);
    });
    this.dropzone.addEventListener('dragover', () => this.dropzone.classList.add('dragover'));
    this.dropzone.addEventListener('dragleave', () => this.dropzone.classList.remove('dragover'));
    this.dropzone.addEventListener('drop', async (ev) => {
      this.dropzone.classList.remove('dragover');
      const file = ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files[0];
      if (!file) return;
      await this.loadFile(file);
    });

    this.btnSample.addEventListener('click', () => this.loadSample());
    this.btnEditMarkdown.addEventListener('click', () => this.editMarkdown());
    this.btnVisualize.addEventListener('click', () => this.applyAndPreview());
    this.btnExportHtml.addEventListener('click', () => this.exportHtml());
    this.btnExportPdf.addEventListener('click', () => this.exportPdf());
    this.btnApply?.addEventListener('click', () => this.applyAndPreview());
    this.btnCancel?.addEventListener('click', () => this.cancelEdit());

    // NOVO: atalhos do editor
    this.mdEditor?.addEventListener('keydown', (ev) => {
      // Ctrl/Cmd + Enter => aplicar
      if ((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter') {
        ev.preventDefault();
        this.applyAndPreview();
      }
      // Tab dentro do textarea => insere \t
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
    // integra com AppController atalhos
    window.addEventListener('app:shortcut:open', () => this.fileInput?.click());
    window.addEventListener('app:shortcut:print', () => {
      this.setOutputType('pdf'); this.convert();
    });
    window.addEventListener('app:shortcut:save', () => {
      this.setOutputType('html'); this.convert();
    });
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

  async loadFile(file) {
    try {
      const text = await readTextFile(file);
      this.currentMd = text;
      this.filename = file.name || 'document.md';
      // Se não há título, sugere com base no nome do arquivo
      this.docConfig.title = this.filename.replace(/\.[^.]+$/, '');
      StateService.setState({ title: this.docConfig.title });
      this.renderPreview();
    } catch (err) {
      Logger.error('Falha ao ler arquivo', { error: String(err && err.message || err) });
    }
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

  renderPreview() {
    const html = this.md.render(this.currentMd || '');
    this.docRoot.innerHTML = html;
    // aplica Twemoji in-place
    TwemojiService.toTwemojiInPlace(this.docRoot);
  }

  async exportHtml() {
    const title = this.docConfig.title;
    const full = await ExportService.composeFullHtml(title, this.preview);
    const fname = `${title.replace(/\s+/g,'_') || 'document'}.html`;
    ExportService.exportHTML(full, fname);
  }

  async exportPdf() {
    ExportService.exportPDF();
  }
}

export default SimpleController;
