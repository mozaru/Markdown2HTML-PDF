// src/simple.js
// Boot da página de Conversão Simples.

import AppController from './controllers/AppController.js';
import NavController from './controllers/NavController.js';
import SimpleController from './controllers/SimpleController.js';

let controller = null;

window.addEventListener('DOMContentLoaded', async () => {
  await AppController.init();
  NavController.highlightCurrent('simple');

  controller = new SimpleController();
  controller.init();

  // Expor para debug no console (opcional)
  // @ts-ignore
  window.simpleController = controller;
});

export default controller;
