# 📄 Documento de Telas – GUI Markdown → PDF/HTML

## 🏠 Tela 1 – Home / Sobre / Créditos

### Descrição

Página inicial do sistema, apresenta o projeto, créditos, licenciamento e links de navegação para as demais páginas. É também a “landing page” para quem acessar a versão web pública.

### Regras de Negócio

* Exibir informações sobre o projeto: objetivo, autor, empresa, licença de uso.
* Disponibilizar links para:

  * Conversão Simples
  * Conversão Avançada
  * Repositório GitHub
  * Download da versão Tauri (quando disponível)
* Licença: destacar que o uso é gratuito, mas não é permitida modificação/distribuição sem autorização.
* Responsivo (layout deve ajustar em mobile).

### Rascunho

```
┌───────────────────────────────────────────────┐
│ Navbar: [Home] [Conversão Simples] [Avançado] │
├───────────────────────────────────────────────┤
│ [Hero] Markdown → PDF/HTML (Client-Side)      │
│ Texto: Objetivo do projeto, quem fez, etc.    │
│                                               │
│ [Cartões/Seções]                              │
│  - Como usar                                  │
│  - Limitações                                 │
│  - Privacidade (sem upload)                   │
│                                               │
│ [CTA] Botão "Ir para Conversão Simples"       │
└───────────────────────────────────────────────┘
```

---

## 📄 Tela 2 – Conversão Simples

### Descrição

Interface para conversão básica de arquivos Markdown para PDF ou HTML. Destinada a usuários leigos, priorizando simplicidade.

### Regras de Negócio

* Entrada do usuário: arquivo Markdown via drag & drop ou botão “Escolher arquivo”.
* Opções de saída:

  * PDF → renderiza via CSS @page + Paged.js e usa `window.print()`.
  * HTML → gera arquivo `.html` (download).
* Campo “Título do Documento” (usado em placeholders).
* Preview renderizado ao lado, sempre atualizado.
* Twemoji aplicado obrigatoriamente.
* Ações principais:

  * **Converter**
  * **Ir para Avançado**

### Rascunho

```
┌────────────────────────────────────────────────────────────┐
│ Navbar: [Home] [Conversão Simples] [Avançado]              │
├────────────────────────────────────────────────────────────┤
│ Coluna A (Entrada)                | Coluna B (Preview)     │
│───────────────────────────────────|────────────────────────│
│ [Dropzone / Escolher arquivo]     | [Preview renderizado]  │
│                                   |  - Markdown-it +       │
│ Opção saída: ( ) PDF ( ) HTML     |    DOMPurify + Twemoji │
│                                   |                        │
│ Título do documento: [input]      | [Aviso sobre PDF]      │
│                                   |                        │
│ [Botões]                          |                        │
│  - Converter                      |                        │
│  - Avançado →                     |                        │
└────────────────────────────────────────────────────────────┘
```

---

## ⚙ Tela 3 – Conversão Avançada

### Descrição

Interface para conversão com personalização de cabeçalhos, rodapés, layout de página, CSS extra e gerenciamento de presets. Destinada a usuários avançados/profissionais.

### Regras de Negócio

* Entrada de arquivo `.md` (drag & drop ou seleção).
* Campo “Título do Documento”.
* **Abas**:

  * **Conteúdo**: sanitização, CSS extra, Twemoji (sempre on).
  * **Header/Rodapé**: edição em Markdown ou HTML, suporte a placeholders.
  * **Página**: configurações de tamanho, margens, orientação.
  * **Presets**: salvar, carregar, importar/exportar configurações.
* Placeholders suportados:

  * `{{DATE}}` com formatos (`dd`, `dd/mm/yyyy`, etc.)
  * `{{TIME}}` com formatos (`HH:mm:ss`, `AM/PM`, etc.)
  * `{{TITLE}}` com transformações (camelCase, PascalCase, snake\_case, kebab-case, SCREAMING\_CASE, etc.)
  * `{{PAGE}}` e `{{PAGES}}` com máscaras (`0000`, `####`, etc.)
* Twemoji aplicado obrigatoriamente.
* Preview com Paged.js simulando header/footer.
* Presets armazenados no localStorage, com opção de definir default.

### Rascunho

```
┌──────────────────────────────────────────────────────────────┐
│ Navbar: [Home] [Simples] [Avançado]                          │
├──────────────────────────────────────────────────────────────┤
│ Coluna A (Config)                 | Coluna B (Preview)       │
│───────────────────────────────────|──────────────────────────│
│ [Dropzone / Escolher arquivo]     | [Preview com Paged.js]   │
│ Título: [input]                   |  - Header/Footer simul.  │
│                                   |                          │
│ [Abas] ───────────────────────────┘                          │
│  Conteúdo: [CSS extra] [Twemoji ON]                          │
│  Header/Rodapé: Editor MD/HTML + inserir placeholder ▼       │
│  Página: tamanho, orientação, margens                        │
│  Presets: salvar, carregar, exportar/importar, default       │
│                                                              │
│ [Botões principais]                                          │
│  - Visualizar  - Gerar PDF  - Exportar HTML                  │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔗 Navegação entre telas

* Navbar fixa em todas as páginas: **Home**, **Simples**, **Avançado**.
* Botões “Avançar para Avançado” na tela simples e “Voltar para Simples” na avançada.

---

## 📋 Observações

* **Abas** escolhidas para organizar opções (melhor que popups).
* **Popup/modal** só será usado para:

  * “Ajuda sobre placeholders” (tabela com exemplos).
  * “Gerenciar presets” (opcional).
* **Responsividade**: em mobile, colunas viram blocos verticais.

---
