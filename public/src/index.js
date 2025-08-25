// src/index.js
// Boot da Home/Sobre. Injeta navbar e aplica pequenos binds de navegação.

import AppController from './controllers/AppController.js';
import NavController from './controllers/NavController.js';

function bindCtas() {
  const goSimple = document.getElementById('goSimple');
  if (goSimple) goSimple.addEventListener('click', () => (location.href = './simple.html'));

  const goAdvanced = document.getElementById('goAdvanced');
  if (goAdvanced) goAdvanced.addEventListener('click', () => (location.href = './advanced.html'));

  const helpPh = document.getElementById('helpPlaceholders');
  if (helpPh) {
    helpPh.addEventListener('click', (e) => {
      e.preventDefault();
      // delega ao AppController abrir o modal, se existir na página (index não tem, mas mantemos padrão)
      const ev = new CustomEvent('app:open:placeholders');
      window.dispatchEvent(ev);
    });
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  await AppController.init();
  NavController.highlightCurrent('home');
  bindCtas();
  // Se desejar, podemos definir dinamicamente a URL do GitHub:
  // AppController.setGithubUrl('https://github.com/sua-org/seu-repo');
});
