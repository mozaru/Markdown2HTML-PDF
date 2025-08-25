# 📄 Documento de Visão e Escopo
**Projeto:** GUI Markdown → PDF/HTML  
**Versão:** 1.0  
**Data:** _(preencher)_  

---

## 1. Introdução

### 1.1 Objetivo do Documento
Este documento descreve a **visão** e o **escopo** do projeto **GUI Markdown → PDF/HTML**, uma aplicação web serverless (e com empacotamento via Tauri) para converter arquivos Markdown em documentos PDF ou HTML.  
O objetivo é oferecer uma solução simples para usuários leigos e profissionais que necessitam transformar Markdown em documentos mais formais.

### 1.2 Público-Alvo
- **Usuários leigos**: qualquer pessoa que deseje converter Markdown em PDF/HTML.  
- **Profissionais e consultores**: que usam Markdown em relatórios e precisam enviar documentos oficiais a clientes.  
- **Desenvolvedores**: interessados em estudar a arquitetura do projeto como referência.  

### 1.3 Definições e Abreviações
- **Markdown (MD):** Linguagem de marcação leve para formatação de texto.  
- **PDF:** Portable Document Format, usado como padrão para documentos.  
- **HTML:** HyperText Markup Language, formato de páginas web.  
- **GUI:** Graphical User Interface (Interface Gráfica).  
- **Tauri:** Framework para empacotar apps web em executáveis nativos.  
- **wkhtmltopdf/Paged.js:** Tecnologias para gerar PDF a partir de HTML.  
- **Twemoji:** Biblioteca de emojis do Twitter, garante consistência visual.  

---

## 2. Visão do Produto

### 2.1 Declaração de Visão
Fornecer uma ferramenta **serverless**, **fácil de usar** e **multiplataforma**, que permita transformar Markdown em PDF ou HTML de forma confiável, com **placeholders dinâmicos** e suporte completo a **emojis via Twemoji**.

### 2.2 Problema/Oportunidade
- Markdown é cada vez mais usado, mas destinatários (clientes/gestores) frequentemente exigem PDF.  
- Ferramentas existentes são técnicas (ex.: Pandoc) ou inseguras (conversores online).  
- Este projeto traz a conversão para dentro do **browser do usuário**, sem dependência de servidor, mantendo privacidade e simplicidade.  

### 2.3 Benefícios
- **Usuários finais:** rapidez e simplicidade.  
- **Profissionais:** personalização com cabeçalhos/rodapés, placeholders, presets.  
- **Empresas:** possibilidade de uso como "papel timbrado digital".  

---

## 3. Escopo

### 3.1 Escopo do Produto
- Conversão de `.md` → PDF ou HTML.  
- Interface gráfica em **3 telas**:
  1. **Home/Sobre/Créditos**  
  2. **Conversão Simples**  
  3. **Conversão Avançada**  
- Placeholders dinâmicos: `DATE`, `TIME`, `TITLE`, `PAGE`, `PAGES` (com formatações e máscaras).  
- Emojis sempre convertidos para **Twemoji**.  
- Presets armazenados em `localStorage`.  
- Layout responsivo (Bootstrap).  

### 3.2 Fora do Escopo
- Suporte oficial multiplataforma no release inicial (foco em browser e Windows via Tauri).  
- Exportação para DOCX ou outros formatos além de PDF/HTML.  
- Suporte avançado a padrões PDF/A.  

### 3.3 Entregas
- Aplicação web estática (`index.html`, `simple.html`, `advanced.html`).  
- Arquivos separados de **CSS**, **JS** e **assets**.  
- Empacotamento futuro via **Tauri**.  
- Documentação: `README.md`, `LICENSE`, `visao-e-escopo.md`, `docs/telas.md`.  

---

## 4. Stakeholders e Usuários

### 4.1 Stakeholders
- **Mozar Baptista da Silva / 11tech**: idealizador, desenvolvedor e mantenedor.  
- **Usuários finais**: leigos ou profissionais que necessitam da conversão.  

### 4.2 Perfis
- **Leigo**: arrasta o `.md`, escolhe saída e baixa PDF/HTML.  
- **Avançado**: configura cabeçalhos/rodapés, placeholders e presets.  

---

## 5. Contexto e Cenário

### 5.1 Alternativas
- **Pandoc**: poderoso mas complexo para usuários comuns.  
- **Conversores online**: inseguros, exigem upload.  
- **Extensões de editores**: não funcionam standalone.  

### 5.2 Cenários de Uso
1. Usuário precisa mandar um relatório rápido: converte com 2 cliques.  
2. Consultor cria proposta em Markdown e aplica rodapé com logo + data/hora.  
3. Empresa define preset padrão com cabeçalho institucional e usa em todos os relatórios.  

---

## 6. Requisitos e Restrições

### 6.1 Requisitos
- Funcionar totalmente **offline** no navegador.  
- Sanitização de HTML (segurança).  
- Emojis via Twemoji obrigatórios.  
- Preview em tempo real.  
- Placeholders flexíveis com máscaras.  

### 6.2 Restrições
- Depende de **Paged.js** para paginação avançada.  
- Licença proprietária: gratuito para uso, mas sem modificação/distribuição.  

---

## 7. Critérios de Sucesso
- Usuário leigo consegue converter `.md` em PDF/HTML em menos de 1 minuto.  
- PDFs preservam conteúdo, emojis e estilos básicos.  
- Cabeçalhos/rodapés funcionam com placeholders.  
- Presets carregam corretamente no navegador.  

---

## 8. Funcionalidades Futuras
- Exportação para DOCX e outros formatos.  
- Suporte multiplataforma ampliado (Linux, macOS, mobile).  
- Templates prontos de papel timbrado.  
- Customização de estilos (cores, fontes, margens avançadas).  

---

## 9. Licenciamento
- Uso gratuito permitido.  
- Modificação e redistribuição **proibidos** sem autorização da 11tech.  
- Detalhes no arquivo [LICENSE](LICENSE).  

---

## 10. Conclusão
O **GUI Markdown → PDF/HTML** fornece uma solução prática, segura e intuitiva para transformar Markdown em documentos oficiais.  
Com arquitetura **serverless**, UI simples e recursos avançados de personalização, equilibra acessibilidade para leigos e poder para profissionais.

---
