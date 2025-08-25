// src/controllers/NavController.js
// Controla estado visual da navbar (item ativo) e pequenas conveniências de navegação.

function routeFromPath(pathname = '') {
  const p = String(pathname || '').toLowerCase();
  if (p.endsWith('/simple.html')) return 'simple';
  if (p.endsWith('/advanced.html')) return 'advanced';
  if (p.endsWith('/index.html') || p.endsWith('/')) return 'home';
  // fallback: tenta a última parte
  const last = p.split('/').pop();
  if (last === 'simple.html') return 'simple';
  if (last === 'advanced.html') return 'advanced';
  return 'home';
}

function setActive(route = 'home') {
  const links = document.querySelectorAll('a.nav-link[data-route]');
  links.forEach(a => {
    const r = a.getAttribute('data-route');
    const isActive = r === route;
    a.classList.toggle('active', isActive);
    if (isActive) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

export class NavController {
  /**
   * Destaca o item ativo da navbar.
   * Se route não for passado, tenta deduzir pela URL.
   * @param {"home"|"simple"|"advanced"} [route]
   */
  static highlightCurrent(route) {
    const r = route || routeFromPath(location.pathname);
    setActive(r);
  }

  /** Liga eventuais eventos de navegação se necessário (placeholder para futuro) */
  static bindEvents() {
    // No momento, não interceptamos cliques (links são páginas estáticas).
  }
}

export default NavController;
