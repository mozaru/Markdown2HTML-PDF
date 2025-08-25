# 📌 GUI Markdown → PDF/HTML

Aplicação **serverless** e **multiplataforma** (web e desktop via Tauri) para converter arquivos **Markdown** em **PDF** ou **HTML**, com suporte a **emojis via Twemoji** e **placeholders configuráveis** em cabeçalhos e rodapés.

## Arquitetura e Tecnologias

### Arquitetura
* uma unica camada de frontend

### Tecnologias
* **Bootstrap 5** (UI)
* **markdown-it** (+ plugins de tabelas/toc se quiser)
* **highlight.js** (código)
* **DOMPurify** (segurança)
* **Paged.js** (paginação PDF + header/footer com numeração)
* **Twemoji**
* **Tauri** (criar executavel, local apartir de sistema web)
* **PWA** (permitir colocar a aplicação local com pwa)
* **Hospedada** (hospedar em algum servidor de forma simples, com poucas ou nenhum dependencia)

## Pontos críticos (prós/contras)

* **Conversão p/ PDF no browser**: use o próprio **Print to PDF** do navegador + **CSS Paged Media**. Para ter **cabeçalho/rodapé de verdade com numeração**, recomendo fortemente **Paged.js** (client-side). Sem ele, os headers/footers ficam limitados.
* **Fidelidade de layout**: com Paged.js você tem `running headers/footers`, `counter(page)`/`counter(pages)`, margens por seção, quebras controladas — o bastante para um “papel timbrado” decente no cliente.
* **Sanitização**: você vai permitir HTML no MD e header/footer — **obrigatório** sanitizar com **DOMPurify**.
* **Emojis**: nativo do browser. Se quiser aparência uniforme cross-plataforma, pode usar **Twemoji** faz replace ao exportar HTML.
* **Offline**: para Tauri, **empacote libs localmente** (sem CDN). Para web pública, pode começar com CDN e depois “vendorizar”.

---

## Arquitetura (simples, escalável e “clean”)

### Estrutura de pastas

```
/public
  /assets
    /css/
      base.css          # estilo geral + tipografia + layout
      print.css         # regras específicas de impressão/PDF (separar do base)
      theme.css         # ajustes de tema/cores
    /js/vendor/
      markdown-it.min.js
      highlight.min.js
      highlight.github.min.css
      dompurify.min.js
      paged.polyfill.js    # Paged.js
      twemoji.min.js       # se preferir usar a lib oficial para parse
    /img/                 # (a preencher)
  /partials/
    navbar.html           # navbar única injetada via JS em todas as páginas
  index.html              # Home/Sobre
  simple.html             # Conversão simples
  advanced.html           # Conversão avançada
  favicon.ico
  manifest.webmanifest    # PWA
  robots.txt              # 

/src
  /models
    DocConfig.js          # DTO: título, página, margens, css extra, useTwemoji etc.
    HeaderFooter.js       # DTO: header/footer em MD/HTML + flags/placeholders
  /services
    MarkdownService.js    # render MD -> HTML (markdown-it + highlight)
    TemplateService.js    # resolve placeholders (DATE/TIME/TITLE/PAGE/PAGES + máscaras)
    StorageService.js     # presets no localStorage (export/import JSON)
    ExportService.js      # exportar HTML (blob) e Print-to-PDF (print-mode)
    TwemojiService.js     # varre DOM e troca emojis por Twemoji (sempre ON)
    PagedHooksService.js  # hooks do Paged.js p/ paginação + zero-pad PAGE/PAGES
    StateService.js       # estado compartilhado mínimo (ex.: último preset/título)
    LoggerService.js      # (leve) logs/safe-try (facilita depurar sem console poluído)
  /controllers
    AppController.js      # base comum (carrega navbar, vendors, etc.)
    NavController.js      # ativa links da navbar e rota atual
    SimpleController.js   # lógica da página simples
    AdvancedController.js # lógica da página avançada (abas, presets, header/footer)
  /utils
    sanitize.js           # wrapper DOMPurify (perfis/allowlist)
    file.js               # ler arquivo local (drag&drop/input), baixar blob
    date.js               # formatar data/hora (d, dd, ddd, m, mm, mmm, y, yy, yyyy; h/H/mm/ss; AM/PM)
    number.js             # formatação por máscara (0, _, 9, # e literais)
    case.js               # transforms de texto (camelCase, PascalCase, snake_case, kebab-case, SCREAMING_SNAKE, etc.)
    dom.js                # helpers de DOM (injetar partials, debounce, etc.)
  index.js                # bootstrap para index.html
  simple.js               # bootstrap para simple.html
  advanced.js             # bootstrap para advanced.html
```

### Placeholders suportados 
`{{DATE}}`, `{{TIME}}`, `{{TITLE}}`, `{{PAGE}}`, `{{PAGES}}`

* `{{DATE:fmt}}`, `{{TIME:fmt}}` (formatos simples)
* `{{TITLE:fmt}}` (título do doc)
* `{{PAGE:fmt}}`/`{{PAGES:fmt}}` (pagina corrente e total de paginas)

obs:os place holders podem ou nao ter o formato especificado
   {{DATE}} ou {{DATE:dd/mm/yyyy}}
   {{PAGE}} ou {{PAGE:00}} 
   {{TITLE}} ou {{TITLE:UPPERCASE}} ou {{TITLE:CAMELCASE}} ou {{TITLE:SNAKECASE}}
   
## Detalhes das regras de formatação

### Máscaras numéricas (PAGE/PAGES)

* `0` → preenche com zero se não houver dígito; caso haja, usa o dígito.
* `_` → preenche com `_` se faltar; senão usa o dígito.
* `9` → preenche com **espaço** se faltar; senão usa o dígito.
* `#` → se faltar, **não preenche**; se houver dígito, usa.
* Qualquer outro caractere → literal.

Implementaremos em `number.js` com uma função:

```js
formatNumberWithMask(value, mask) // ex.: (7, "0000") => "0007"; (7, "##") => "7"
```

E o `TemplateService` detecta `{{PAGE:mask}}` / `{{PAGES:mask}}`.
O `PagedHooksService` sobrescreve o texto final **depois** da paginação.

### Data/Hora

* Data: `d, dd, ddd, m, mm, mmm, y, yy, yyyy`
* Hora: `h, hh, H, HH, m, mm, s, ss` + `AM/PM`
  `date.js` converte o pattern em um formatter (usando `Intl` quando aplicável e complementando onde não der).

### TITLE cases

* camelCase, PascalCase, snake\_case, kebab-case, SCREAMING\_SNAKE\_CASE, lowercase, UPPERCASE, Screaming-Kebab-Case, Train-Case, flat case, UPPER FLAT CASE, Camel\_Snake\_Case, Pascal\_Snake\_Case, SCREAMING CASE.
  `case.js` implementa um normalizador (tokenização + mapa de transformações).

## UX (abas + possíveis popups)

* **Avançada**: Abas para “Conteúdo / Header & Footer / Página / Presets” (confirmado).
* **Popups**: apenas para “Ajuda de placeholders” e “Gerenciar presets” (se quiser).
* **Simple**: sem abas; só dropzone, título, saída (PDF/HTML) e preview.


### Fluxo de PDF com Paged.js

* Renderiza conteúdo em um contêiner “printable”.
* Injeta header/footer com CSS `position: running(header/foot)` e resolve counters.
* Chama `window.print()` (usuário escolhe “Salvar como PDF”).
* Em Tauri, a mesma chamada abre o diálogo do SO.

---

## Telas

### 1) **Home/Sobre/Créditos**

* Texto explicando o projeto, quem fez (Mozar/11tech), licença proprietária (uso sem custo, sem modificação, sem redistribuição).
* Links para GitHub, download Tauri, licença.
* Navbar para **Conversão Simples** e **Avançada**.

### 2) **Conversão simples (MD → PDF/HTML)**

* Área de **drag & drop** e **file input**.
* **Select** de saída: `PDF` ou `HTML`.
* Botão **Converter**:

  * Se `HTML`: gera arquivo `.html` com CSS embutido (ou linkado) e baixa via blob (download).
  * Se `PDF`: renderiza e chama `print()`.
* Link/botão **Avançado** (leva para advanced.html).

### 3) **Conversão avançada**

* Tudo da simples + painel de **Config**:

  * **Cabeçalho/Rodapé**: editor (tabs: Markdown | HTML).
  * **Placeholders** (checkbox para mostrar dica e inserir).
  * **Página**: tamanho, orientação, margens (inputs). 
  * **CSS Extra**: textarea.
  * **Twemoji**: toggle (para visual uniforme).
  * **Salvar/Carregar preset** (localStorage):

  * Salvar com nome
  * Listar presets (set default)
  * Exportar/Importar preset (JSON)
* Botões: **Visualizar**, **Gerar PDF**, **Exportar HTML**.

---

## Segurança e robustez

* **Sanitizar HTML** (markdown e header/footer) com DOMPurify.
* **Bloquear scripts** no conteúdo convertido.
* **Imagens**: permitir `<img>` mas **sem** `onerror`, `javascript:` etc.
* **Tamanho**: para documentos grandes, usar `requestIdleCallback`/throttle na preview para não travar a UI.

---

## Experiência de usuário

* Preview live com debounce (300ms).
* Indicador de “modo impressão” ao gerar PDF (esconde toolbars).
* Templates prontos (ex.: “Papel timbrado simples”, “Com logo e numeração central”).
* Lembrar último preset e reabrir como **default**.

---

Perfeito. Abaixo está a **descrição completa e objetiva de cada arquivo** da estrutura proposta — função, responsabilidades, interfaces principais e observações de implementação. É para ser usado como guia de desenvolvimento e revisão.

---

## Documentação da Estrutura de Arquivos

### /public (camada de apresentação e assets)

#### /public/assets/css/base.css

* **Função:** estilos globais (tipografia, layout, cores básicas, componentes genéricos, classes utilitárias).
* **Escopo:** telas (Home, Simples, Avançada) e **preview** do documento (`#doc-root`).
* **Contém:** variáveis CSS (`--page-margin-*`, fontes), estilos de tipografia, tabelas, blocos de código, blockquote, dropzone, preview, toolbar.
* **Não deve conter:** regras específicas de impressão (ficam em `print.css`).

#### /public/assets/css/print.css

* **Função:** **regras apenas de impressão/PDF**.
* **Escopo:** `@page` (A4/Letter), margens, `running headers/footers` (Paged.js), counters default (`.ph-page::after`, `.ph-pages::after`).
* **Observação:** padding com zeros e formatação final de `PAGE/PAGES` serão ajustados via **PagedHooksService** após a paginação.

#### /public/assets/css/theme.css

* **Função:** temas visuais (cores, dark mode, ajustes cosméticos).
* **Escopo:** customizações não-estruturais.
* **Crítico:** nunca duplicar regras funcionais (header/footer/counters) aqui.

---

#### /public/assets/js/vendor/

**Função:** bibliotecas de terceiros “vendorizadas” para rodar **100% offline** (especialmente para Tauri).

* **markdown-it.min.js**
  Parser Markdown → HTML.
  Usado por `MarkdownService`.

* **highlight.min.js** + **highlight.github.min.css**
  Syntax highlight de blocos de código.
  Integrado pelo `MarkdownService` na fase de render.

* **dompurify.min.js**
  Sanitização de HTML (remove scripts/eventos maliciosos).
  Encapsulado por `utils/sanitize.js`.

* **paged.polyfill.js** (Paged.js)
  Paginação em client-side: `@page`, `running headers/footers`, `counter(page|pages)`.
  Hooks consumidos por `PagedHooksService`.

* **twemoji.min.js** 
  Se preferir usar a API do Twemoji em vez de busca/replace manual.
  Integrado por `TwemojiService` para uniformizar emojis.

> **Nota:** pode começar com CDN em desenvolvimento e, ao preparar o build Tauri, **copiar** para esta pasta e referenciar localmente.

---

#### /public/partials/navbar.html

* **Função:** HTML da barra de navegação comum às 3 páginas.
* **Renderização:** injetado dinamicamente por `utils/dom.js` (para evitar duplicação).
* **Requisitos:** conter data-attributes ou ids que `NavController` vai usar para ativar o item atual.

---

#### /public/index.html (Home/Sobre)

* **Função:** landing page (o que é, quem fez, licença, links).
* **Estrutura:** carrega `assets/css/*.css`, injeta `partials/navbar.html`, referencia `src/index.js`.

#### /public/simple.html (Conversão Simples)

* **Função:** fluxo rápido de conversão `.md` → `PDF`/`HTML`.
* **Estrutura:** dropzone/input de arquivo, seletor de saída, input de título, preview live.
* **Scripts:** `src/simple.js` (boot), services necessários.

#### /public/advanced.html (Conversão Avançada)

* **Função:** conversão com **header/footer**, placeholders, margens, tamanho de página, **presets**.
* **Estrutura:** abas (Conteúdo / Header & Footer / Página / Presets), preview com Paged.js, botões Visualizar/PDF/HTML.
* **Scripts:** `src/advanced.js` (boot).

#### /public/favicon.ico

* **Função:** ícone do site.

#### /public/manifest.webmanifest (PWA)

* **Função:** metadata para instalação como app (Tauri não depende disso, mas é útil na web).

#### /public/robots.txt (crawlers)

* **Função:** regras para crawlers.

---

### /src/models (DTOs/TOs de domínio)

#### /src/models/DocConfig.js

* **Objeto:** configuração do documento.
* **Campos sugeridos:**

  ```js
  {
    title: string,
    pageSize: "A4" | "Letter" | "Custom",
    orientation: "portrait" | "landscape",
    margins: { top: string, right: string, bottom: string, left: string }, // ex: "20mm"
    customCss: string,      // CSS extra do usuário
    useTwemoji: true        // sempre true (exigência do projeto)
  }
  ```
* **Uso:** persistido em presets (StorageService), aplicado por TemplateService/ExportService.

#### /src/models/HeaderFooter.js

* **Objeto:** conteúdo de cabeçalho e rodapé.
* **Campos sugeridos:**

  ```js
  {
    mode: "md" | "html",  // origem do conteúdo
    headerMd: string,
    footerMd: string,
    headerHtml: string,   // renderizado a partir do md quando mode="md"
    footerHtml: string,
    placeholders: true    // habilita substituições (DATE/TIME/TITLE/PAGE/PAGES)
  }
  ```
* **Uso:** render por MarkdownService (quando `mode="md"`) + TemplateService (placeholders).

---

### /src/services (regras e infraestrutura da aplicação)

#### /src/services/MarkdownService.js

* **Função:** renderizar Markdown em HTML seguro (markdown-it + highlight + sanitização).
* **Assinatura típica:**

  ```js
  render(mdText: string): string // HTML sanitizado (sem scripts)
  ```
* **Detalhes:**

  * Ativa `linkify`, `typographer`.
  * Integra highlight.js nos blocos ` ```lang `.
  * **Não** aplica placeholders (isso é do TemplateService).

#### /src/services/TemplateService.js

* **Função:** resolver **placeholders** e aplicar formatações.
* **Placeholders:**

  * `{{DATE}}`, `{{DATE:dd/mm/yyyy}}`
  * `{{TIME}}`, `{{TIME:HH:mm}}`
  * `{{TITLE}}`, `{{TITLE:UPPERCASE|camelCase|snake_case|...}}`
  * `{{PAGE}}`, `{{PAGE:0000|####|9999|__}}`
  * `{{PAGES}}`, idem a `PAGE`.
* **Assinaturas:**

  ```js
  applyHeaderFooterPlaceholders(html: string, docConfig: DocConfig, hf: HeaderFooter): string
  applyTitleTransforms(title: string, transform?: string): string
  parseMask(mask: string): Mask // retorna metadados p/ PagedHooksService
  ```
* **Observação:** `PAGE/PAGES` com máscara **não** deve imprimir valor aqui; trocar por spans `.ph-page/.ph-pages` e **registrar** a máscara para o PagedHooksService aplicar **depois**.

#### /src/services/StorageService.js

* **Função:** gerenciar **presets** no `localStorage`.
* **Assinaturas:**

  ```js
  savePreset(preset: { id?: string, name: string, docConfig: DocConfig, headerFooter: HeaderFooter }): string // id
  loadPreset(id: string): Preset
  listPresets(): Preset[]
  deletePreset(id: string): void
  setDefaultPreset(id: string): void
  getDefaultPreset(): string | null
  exportPreset(id: string): string // JSON
  importPreset(json: string): string // id
  ```
* **Observação:** validar esquema antes de salvar/carregar (defensivo).

#### /src/services/ExportService.js

* **Função:** exportar **HTML** (download) e **PDF** (via `window.print()` com Paged.js).
* **Assinaturas:**

  ```js
  exportHTML(fullHtml: string, filename: string): void
  exportPDF(beforePrint?: () => void, afterPrint?: () => void): void
  enterPrintMode(): void // adiciona .print-mode no body, oculta UI
  exitPrintMode(): void
  ```
* **Observação:** em Tauri, `window.print()` abre diálogo nativo; sem “print silencioso”.

#### /src/services/TwemojiService.js

* **Função:** **converter todos os emojis para Twemoji** no HTML final (obrigatório).
* **Estratégia:** varrer DOM após render (ou operar no HTML string), substituindo por `<img class="emoji" ...>`.
* **Assinaturas:**

  ```js
  toTwemoji(html: string): string
  toTwemojiInPlace(rootEl: Element): void
  ```
* **Fonte:** apontar para assets locais (preferível no Tauri) ou CDN.

#### /src/services/PagedHooksService.js

* **Função:** integrar com **Paged.js** e aplicar máscaras **numéricas** de `PAGE/PAGES` **após** a paginação.
* **Assinaturas:**

  ```js
  registerMasks(masks: { pageMask?: string, pagesMask?: string }): void
  install(): void // registra hooks Paged.on('rendered', ...) etc.
  ```
* **Detalhe:** usar `utils/number.formatNumberWithMask(value, mask)` para substituir o conteúdo dos spans `.ph-page` / `.ph-pages`.

#### /src/services/StateService.js

* **Função:** estado mínimo compartilhado entre páginas/controladores (ex.: título atual, preset carregado, última saída escolhida).
* **Assinaturas:**

  ```js
  getState(): { title, outputType, presetId, ... }
  setState(partial: object): void
  reset(): void
  ```
* **Cuidado:** não virar “dumping ground”; manter simples.

#### /src/services/LoggerService.js

* **Função:** logging mínimo e seguro (desliga em produção; agrega contexto).
* **Assinaturas:**

  ```js
  info(msg: string, ctx?: any): void
  warn(msg: string, ctx?: any): void
  error(msg: string, ctx?: any): void
  tryWrap<T>(fn: () => T, fallback?: T): T
  ```
* **Objetivo:** evitar `console.log` espalhado.

---

### /src/controllers (orquestração de UI + serviços)

#### /src/controllers/AppController.js

* **Função:** bootstrap comum (carrega navbar, vendors, aplica handlers globais, hotkeys).
* **Ciclo:**

  ```js
  init(): Promise<void> // injeta navbar, configura NavController
  ```

#### /src/controllers/NavController.js

* **Função:** ativar item da navbar conforme página, tratar navegação entre páginas.
* **Assinaturas:**

  ```js
  highlightCurrent(route: "home" | "simple" | "advanced"): void
  bindEvents(): void
  ```

#### /src/controllers/SimpleController.js

* **Função:** fluxo da **conversão simples**.
* **Ciclo & ações:**

  ```js
  init(): void
  onFileSelected(file: File): Promise<void>
  onOutputTypeChanged(type: "pdf" | "html"): void
  onConvert(): void // PDF → print(); HTML → download
  ```
* **Integra:** MarkdownService → TwemojiService → (se PDF: Paged.js) → ExportService.

#### /src/controllers/AdvancedController.js

* **Função:** fluxo da **conversão avançada** (abas, header/footer, presets).
* **Ciclo & ações:**

  ```js
  init(): void
  onFileSelected(file: File): Promise<void>
  onTabChange(tab: "conteudo" | "hf" | "pagina" | "presets"): void
  onInsertPlaceholder(ph: string): void
  onSavePreset(name: string): void
  onLoadPreset(id: string): void
  onSetDefaultPreset(id: string): void
  onVisualize(): void
  onExportHTML(): void
  onExportPDF(): void
  ```
* **Integra:** MarkdownService, TemplateService, TwemojiService, PagedHooksService, StorageService, ExportService.

---

### /src/utils (funções utilitárias isoladas)

#### /src/utils/sanitize.js

* **Função:** wrapper de DOMPurify com perfil/allowlist conservador.
* **Assinaturas:**

  ```js
  sanitize(html: string): string
  sanitizeFragment(fragment: Element): void
  ```

#### /src/utils/file.js

* **Função:** leitura de arquivos locais (File API) e download via Blob.
* **Assinaturas:**

  ```js
  readTextFile(file: File): Promise<string>
  download(filename: string, content: string, mime: string = "text/plain"): void
  ```

#### /src/utils/date.js

* **Função:** formatadores de data/hora com padrões declarados.
* **Assinatura:**

  ```js
  formatDate(date: Date, pattern: string): string // d, dd, ddd, m, mm, mmm, y, yy, yyyy
  formatTime(date: Date, pattern: string): string // h, hh, H, HH, m, mm, s, ss, AM/PM
  ```

#### /src/utils/number.js

* **Função:** aplicar **máscaras numéricas** conforme suas regras:

  * `0` → preenche com zero
  * `_` → preenche com `_`
  * `9` → preenche com espaço
  * `#` → não preenche
  * outros → literal
* **Assinatura:**

  ```js
  formatNumberWithMask(value: number, mask: string): string
  ```

#### /src/utils/case.js

* **Função:** transformações de **TITLE**:

  * camelCase, PascalCase, snake\_case, kebab-case,
    SCREAMING\_SNAKE\_CASE, lowercase, UPPERCASE,
    Screaming-Kebab-Case, Train-Case, flat case, UPPER FLAT CASE,
    Camel\_Snake\_Case, Pascal\_Snake\_Case, SCREAMING CASE.
* **Assinatura:**

  ```js
  transformCase(text: string, mode: string): string
  ```

#### /src/utils/dom.js

* **Função:** helpers de DOM.
* **Assinaturas:**

  ```js
  injectPartial(targetSelector: string, url: string): Promise<void> // ex.: navbar
  debounce(fn: Function, ms: number): Function
  qs(sel: string, root?: Element): Element|null
  qsa(sel: string, root?: Element): Element[]
  ```

---

### /src (boots por página)

#### /src/index.js

* **Função:** inicializar Home/Sobre.
* **Fluxo:** `AppController.init()` → `NavController.highlightCurrent("home")` → bind de links e CTA.

#### /src/simple.js

* **Função:** boot da Conversão Simples.
* **Fluxo:** `AppController.init()` → `NavController.highlightCurrent("simple")` → `SimpleController.init()`.

#### /src/advanced.js

* **Função:** boot da Conversão Avançada.
* **Fluxo:** `AppController.init()` → `NavController.highlightCurrent("advanced")` → `AdvancedController.init()`.

---

### Observações finais (práticas)

* **Separação de responsabilidades** está clara: *render* (MarkdownService), *sanitização* (sanitize), *placeholders* (TemplateService), *twemoji* (TwemojiService), *pós-paginação* (PagedHooksService), *export* (ExportService).
* **Twemoji** é obrigatório: padronizar para **assets locais** no build Tauri (evita CDN).
* **Máscaras PAGE/PAGES**: **TemplateService** só marca; **PagedHooksService** escreve o valor final com `number.formatNumberWithMask`.
* **CSS**: `print.css` só impressão; `base.css` o resto. Evita regressões ao mexer no PDF.

---

## Deploy e empacotamento

* **Web**: GitHub Pages / qualquer host estático (só `public/`).
* **Tauri**: apontar para `public/` como assets; empacotar libs localmente; `window.print()` para gerar PDF.

  * Se um dia quiser PDF “silencioso”, dá para integrar um gerador nativo (plugin/CLI), mas por ora não é necessário.

---

## Riscos / Trade-offs

* **PDF perfeito**: CSS paged + Paged.js cobre 90% dos casos típicos. Se você exigir recurso extremo (notas de rodapé automáticas avançadas, índice com páginas geradas, PDF/A), aí teria que ir para uma rota headless/servidor ou libs paged mais pesadas.
* **Compatibilidade**: Paged.js funciona bem em Chromium/Firefox; Edge/Chrome ok. Safari costuma ser o mais chatinho (testar).

---


