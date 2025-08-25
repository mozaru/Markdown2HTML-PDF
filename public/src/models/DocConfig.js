// src/models/DocConfig.js
// DTO de configuração do documento (página, margens, título, CSS extra, twemoji)

export class DocConfig {
  /**
   * @param {Object} opts
   * @param {string} [opts.title]            - Título do documento (usado em {{TITLE}})
   * @param {"A4"|"Letter"|"Custom"} [opts.pageSize]
   * @param {"portrait"|"landscape"} [opts.orientation]
   * @param {{top:string,right:string,bottom:string,left:string}} [opts.margins] - Ex.: "20mm"
   * @param {string} [opts.customCss]        - CSS adicional a ser injetado no documento
   * @param {boolean} [opts.useTwemoji=true] - Sempre true neste projeto (padroniza emojis)
   */
  constructor({
    title = "",
    pageSize = "A4",
    orientation = "portrait",
    margins = { top: "20mm", right: "18mm", bottom: "20mm", left: "18mm" },
    customCss = "",
    useTwemoji = true
  } = {}) {
    this.title = title;
    this.pageSize = pageSize;
    this.orientation = orientation;
    this.margins = margins;
    this.customCss = customCss;
    this.useTwemoji = useTwemoji;
  }

  static from(obj = {}) {
    return new DocConfig(obj);
  }
}

export default DocConfig;
