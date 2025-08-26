// src/controllers/AppController.js
// Bootstrap comum das páginas: injeta navbar parcial, liga eventos globais e atalhos.
// Depende de utils/dom.js para injetar partials e seletores.

import { injectPartial, qs } from '../utils/dom.js';
import Logger from '../services/LoggerService.js';
import MarkdownService from '../services/MarkdownService.js';

function openPlaceholdersModal() {
  // Abre o modal #placeholdersModal se existir na página corrente
  const modalEl = document.getElementById('placeholdersModal');
  if (!modalEl) return;
  try {
    // Bootstrap 5 Modal
    // @ts-ignore
    const Modal = window.bootstrap && window.bootstrap.Modal;
    if (!Modal) return;
    const instance = Modal.getOrCreateInstance(modalEl);
    instance.show();
  } catch (err) {
    Logger.warn('Falha ao abrir modal de placeholders', { error: String(err && err.message || err) });
  }
}

function openInfoModal(info){
  const modalEl = document.getElementById('infoModal');
  if (!modalEl) return;
  try {
    const content = modalEl.querySelector('.modal-body');
    content.innerHTML = info.replaceAll("\n","<br/>");
    const Modal = window.bootstrap && window.bootstrap.Modal;
    if (!Modal) return;
    const instance = Modal.getOrCreateInstance(modalEl);
    instance.show();
  } catch (err) {
    Logger.warn('Falha ao abrir modal generica de informacao', { error: String(err && err.message || err) });
  }
}

export async function openLocalFileModal(path) {
  let content = await fetch(path)
  content = await content.text();
  if (path.endsWith('.md'))
  {
    const md = new MarkdownService();
    content = md.render(content);
  }
  openInfoModal(content);
}

function bindNavbarEvents() {
  const help = document.getElementById('navHelpPlaceholders');
  if (help) {
    help.addEventListener('click', (e) => {
      e.preventDefault();
      openPlaceholdersModal();
    });
  }

  const license = document.getElementById('navLicense');
  if (license) {
    license.addEventListener('click', (e) => {
      e.preventDefault();
      openLocalFileModal("LICENSE");
    });
  }
  
  const license2 = document.getElementById('navLicense2');
  if (license2) {
    license2.addEventListener('click', (e) => {
      e.preventDefault();
      openLocalFileModal("LICENSE");
    });
  }

  const thirdPartyLicenses = document.getElementById('navThirdPartyLicenses');
  if (thirdPartyLicenses) {
    thirdPartyLicenses.addEventListener('click', (e) => {
      e.preventDefault();
      openLocalFileModal("THIRD_PARTY_LICENSES.md");
    });
  }
  // Link do GitHub pode ser ajustado em runtime se desejar (ver setGithubUrl)
}

function attachGlobalShortcuts() {
  // Dispara eventos customizados para os controllers de cada página ouvirem
  const dispatch = (name) => window.dispatchEvent(new CustomEvent(`app:shortcut:${name}`));

  window.addEventListener('keydown', (ev) => {
    // Ignorar quando foco em inputs/textarea/seleção de texto
    const tag = (document.activeElement && document.activeElement.tagName || '').toUpperCase();
    const editable = ['INPUT', 'TEXTAREA'].includes(tag) || (document.activeElement && document.activeElement.isContentEditable);
    if (editable && ev.key !== 'Enter') return;

    const ctrl = ev.ctrlKey || ev.metaKey;
    const key = ev.key.toLowerCase();

    if (ctrl && key === 'o') { ev.preventDefault(); dispatch('open'); }
    else if (ctrl && key === 'p') { ev.preventDefault(); dispatch('print'); }
    else if (ctrl && key === 's') { ev.preventDefault(); dispatch('save'); }
    else if (ctrl && ev.key === 'Enter') { ev.preventDefault(); dispatch('visualize'); }
  });
}

export class AppController {
  /**
   * Inicializa a camada comum (navbar + atalhos).
   * @returns {Promise<void>}
   */
  static async init() {
    // Injeta navbar
    await injectPartial('#navbar', './partials/navbar.html');
    bindNavbarEvents();
    attachGlobalShortcuts();
  }
  
  static initWithoutNavBar() {
    bindNavbarEvents();
    attachGlobalShortcuts();
  }
  /** Ajusta o href do link de GitHub na navbar (se existir) */
  static setGithubUrl(url) {
    const a = document.getElementById('navGithub');
    if (a && url) a.setAttribute('href', url);
  }
}

export default AppController;
