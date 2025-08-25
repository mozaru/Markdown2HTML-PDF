// src/models/HeaderFooter.js
// DTO para conteúdo de Cabeçalho e Rodapé, em Markdown ou HTML, com placeholders habilitados.

export class HeaderFooter {
  /**
   * @param {Object} opts
   * @param {"md"|"html"} [opts.mode="md"]  - Origem do conteúdo: Markdown ou HTML
   * @param {string} [opts.headerMd=""]     - Texto Markdown do cabeçalho
   * @param {string} [opts.footerMd=""]     - Texto Markdown do rodapé
   * @param {string} [opts.headerHtml=""]   - HTML do cabeçalho (renderizado quando mode="md" ou fornecido diretamente)
   * @param {string} [opts.footerHtml=""]   - HTML do rodapé   (renderizado quando mode="md" ou fornecido diretamente)
   * @param {boolean} [opts.placeholders=true] - Ativa substituição de placeholders (DATE/TIME/TITLE/PAGE/PAGES)
   */
  constructor({
    mode = "md",
    headerMd = "",
    footerMd = "",
    headerHtml = "",
    footerHtml = "",
    placeholders = true
  } = {}) {
    this.mode = mode;
    this.headerMd = headerMd;
    this.footerMd = footerMd;
    this.headerHtml = headerHtml;
    this.footerHtml = footerHtml;
    this.placeholders = placeholders;
  }

  static from(obj = {}) {
    return new HeaderFooter(obj);
  }

  clone() {
    return new HeaderFooter(JSON.parse(JSON.stringify(this)));
  }
}

export default HeaderFooter;
