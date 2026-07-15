# Álbum de Figurinhas Digital - Elsword

Este é um projeto interativo de colecionador que simula um álbum de figurinhas físico em 3D, dedicado aos personagens jogáveis do jogo **Elsword** da KOG Games.

---

## 🎯 Objetivo do Projeto
O objetivo principal é oferecer uma experiência imersiva e responsiva de colecionador diretamente no navegador. O usuário pode folhear as páginas do álbum, ouvir efeitos sonoros realistas de papel, alternar entre os temas Claro e Escuro, e colar figurinhas clicando nos slots correspondentes (que são automaticamente reveladas a partir de imagens locais ou enviadas pelo próprio usuário) com salvamento automático persistente.

---

## 📂 Funcionalidade dos Arquivos do Projeto

### 1. 📄 [index.html](index.html)
* **Estrutura e Conteúdo:** Contém a marcação semântica de todo o álbum.
* **Seções Principais:**
  * **Capa 3D:** Contém o selo animado e a esfera interativa central em vermelho.
  * **Páginas dos Personagens:** 15 páginas dedicadas a cada um dos heróis de Elsword com grades de figurinhas representando suas 4 linhas de evolução (*job paths*).
  * **Página do Jogador:** Espaço reservado para figurinhas personalizadas do próprio jogador.
  * **Contracapa:** Design com código de barras simbólico e créditos.
  * **Controles do Sistema:** Botão de ativação de som, botão de reinicialização da coleção e o comutador de temas.

### 2. 🎨 [style.css](style.css)
* **Estilização e Layout:** Gerencia toda a estética premium do álbum (capa tridimensional, sombras de dobra de páginas, efeitos de hover e animações).
* **Paleta Dinâmica:** Configura variáveis personalizadas CSS (`--char-color`, `--char-color-alpha`, etc.) por página para adaptar a borda, crachás e textos à cor característica de cada personagem (ex: vermelho para Elsword, roxo para Aisha, verde para Rena).
* **Temas Claro e Escuro:** Implementa transição suave de ambiente e cores das páginas (páginas em cinza-escuro no Dark Mode e creme no Light Mode), invertendo a cor dos ícones pretos para branco automaticamente no tema escuro para garantir máxima legibilidade.
* **Interatividade Física:** Remove interceptações do canvas de desenho no PageFlip (`pointer-events: none`) para permitir interações diretas com os slots.

### 3. ⚙️ [app.js](app.js)
* **Lógica de Interação:** Inicializa e gerencia a biblioteca física de renderização de páginas *St.PageFlip*.
* **Coleção e Upload:** 
  * Trata cliques nos slots: normaliza o nome da classe em formato kebab-case e tenta carregar a imagem correspondente da pasta `fotos/`.
  * Fornece um seletor local caso a imagem não exista ou seja um slot customizado do jogador.
  * Redimensiona e comprime imagens via `<canvas>` (para JPEG 300x400 a 70% de qualidade) para otimizar espaço e salva persistido em Base64 no `localStorage`.
* **Áudio Sintetizado:** Cria efeitos de papel e colagem sintetizados dinamicamente usando a *Web Audio API* (sem necessidade de carregar arquivos pesados de som).
* **Persistência de Tema:** Lê e salva a escolha de Tema Claro/Escuro do usuário para evitar piscadas de tela (FOUC) na inicialização.

### 4. 🖼️ Diretório `fotos/`
* Contém as imagens finais das classes para preencher os slots e as imagens `*-base.png` (como `elsword-base.png`) usadas como marcas d'água sutis no fundo de cada página correspondente.

### 5. ⚔️ Diretório `icones/`
* Armazena as imagens de armas customizadas para cada personagem (como `elsword - greatsword.png`), que substituem os emojis no cabeçalho das páginas e sofrem inversão de cor com base no tema ativo.

---

## 🛠️ Como Executar
Basta abrir o arquivo [index.html](index.html) diretamente em qualquer navegador moderno. Toda a lógica funciona localmente offline no navegador por meio de `localStorage`.
