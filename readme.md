# 📌 GUI Markdown → PDF/HTML

Aplicação **serverless** e **multiplataforma** (web e desktop via Tauri) para converter arquivos **Markdown** em **PDF** ou **HTML**, com suporte a **emojis via Twemoji** e **placeholders configuráveis** em cabeçalhos e rodapés.

---

## 📖 Índice
- [Sobre](#-sobre)
- [Tecnologias](#-tecnologias)
- [Funcionalidades](#-funcionalidades)
- [Placeholders](#-placeholders)
- [Telas](#-telas)
- [Instalação e Uso](#-instalação-e-uso)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)
- [Contato](#-contato)

---

## 💡 Sobre
O **GUI Markdown → PDF/HTML** nasceu da necessidade de transformar documentos em Markdown em arquivos mais formais e padronizados, prontos para serem enviados a clientes ou parceiros.

- Desenvolvido por **Mozar Baptista da Silva / 11tech**  
- Uso **gratuito** (pode ser utilizado sem custo), mas **não pode ser modificado nem redistribuído** sem autorização.  
- Distribuído como **aplicação web** (GitHub Pages) e como **executável desktop** via [Tauri](https://tauri.app/).  

---

## 🛠 Tecnologias
- **HTML5 + CSS3 + Bootstrap 5** (UI responsiva)  
- **JavaScript ES Modules** (arquitetura MVC simplificada)  
- **markdown-it** (parser Markdown)  
- **highlight.js** (syntax highlight em blocos de código)  
- **DOMPurify** (sanitização de HTML)  
- **Paged.js** (controle de paginação, cabeçalhos e rodapés no PDF)  
- **Twemoji** (renderização uniforme de emojis)  

---

## ✨ Funcionalidades
- ✅ Conversão de arquivos `.md` para **PDF** ou **HTML**  
- ✅ Interface gráfica com **drag & drop** e preview em tempo real  
- ✅ Emojis convertidos para **Twemoji** (consistência entre SOs e navegadores)  
- ✅ Placeholders dinâmicos em cabeçalho/rodapé (`DATE`, `TIME`, `TITLE`, `PAGE`, `PAGES`)  
- ✅ Presets de configuração salvos no navegador (localStorage)  
- 🚧 Futuro: Empacotamento multiplataforma com Tauri  
- 🚧 Futuro: Templates de papel timbrado, estilos de página e customizações avançadas  

---

## 🔖 Placeholders
Suporte a placeholders dinâmicos que podem ser usados em cabeçalhos e rodapés:

- **Data/Hora**  
  - `{{DATE}}` → data atual  
  - `{{DATE:dd/mm/yyyy}}` → com formato específico  
  - `{{TIME}}` ou `{{TIME:HH:mm}}`  

- **Título**  
  - `{{TITLE}}` → título do documento  
  - `{{TITLE:UPPERCASE}}` → maiúsculas  
  - `{{TITLE:camelCase}}`, `{{TITLE:PascalCase}}`, `{{TITLE:snake_case}}`, etc.  

- **Paginação**  
  - `{{PAGE}}` → número da página atual  
  - `{{PAGES}}` → total de páginas  
  - Suporte a **máscaras numéricas** (`0000`, `####`, `9999`, `_ _ _ _`)  

---

## 🖼 Telas
1. **Home / Sobre / Créditos**  
   - Explica o projeto, créditos e licença.  

2. **Conversão Simples**  
   - Upload/drag & drop de `.md`.  
   - Escolha entre saída PDF ou HTML.  
   - Preview em tempo real.  

3. **Conversão Avançada**  
   - Tudo da simples + configuração de cabeçalhos, rodapés, margens, tamanho da página.  
   - Placeholders dinâmicos.  
   - Presets de configuração (salvar/carregar/exportar).  

---

## 📦 Instalação e Uso

### Uso online (web)
Acesse diretamente via GitHub Pages:  
👉 [link_do_projeto](https://github.com/seu-usuario/gui-md2pdf)

### Uso local
```bash
# Clone o repositório
git clone https://github.com/seu-usuario/gui-md2pdf.git

cd gui-md2pdf

# Abra o arquivo index.html no navegador
````

### Uso via Tauri (executável desktop)

Em construção 🚧
Será possível gerar executáveis nativos (Windows/Linux/macOS) com suporte a todas as funcionalidades.

---

## 🤝 Contribuindo

1. Faça um **fork** do projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas alterações (`git commit -m 'Adiciona nova feature'`)
4. Push (`git push origin feature/nova-feature`)
5. Abra um **Pull Request**

---

## 📜 Licença

Este software é **proprietário** e protegido por direitos autorais de **Mozar Baptista da Silva – 11tech**.

* Pode ser **utilizado gratuitamente**.
* **Não pode** ser modificado, redistribuído, sublicenciado ou usado para fins comerciais sem autorização expressa.

Consulte o arquivo [LICENSE](LICENSE) para detalhes.
© Mozar Baptista da Silva – 11tech. Todos os direitos reservados.

---

## 📬 Contato

* **Mozar Baptista da Silva** – [11tech](http://www.11tech.com.br)
* ✉ **[mozar.silva@gmail.com](mailto:mozar.silva@gmail.com)**



