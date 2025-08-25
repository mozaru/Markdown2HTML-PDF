// src/advanced.js
// Boot da página de Conversão Avançada.

import AppController from './controllers/AppController.js';
import NavController from './controllers/NavController.js';
import AdvancedController from './controllers/AdvancedController.js';
import {applyLinkSmart} from './utils/openLinkSmart.js';

let controller = null;

window.addEventListener('DOMContentLoaded', async () => {
  await AppController.init();
  NavController.highlightCurrent('advanced');
  applyLinkSmart();

  controller = new AdvancedController();
  controller.init();

  // Expor para debug (opcional)
  // @ts-ignore
  window.advancedController = controller;
});

export default controller;
