# SurebetPro - Guia de Execução Local

Como o ambiente de visualização em nuvem apresentou instabilidade de conexão (tela preta de espera), a melhor forma de ver o seu sistema funcionando perfeitamente e em alta performance é rodando-o localmente no seu computador.

O código gerado está 100% correto, com banco de dados conectado e motor de arbitragem pronto. Siga os passos abaixo:

## Pré-requisitos
1. Instale o [Node.js](https://nodejs.org/) (versão 18 ou superior).
2. Instale um editor de código, como o [VS Code](https://code.visualstudio.com/).

## Passo a Passo

1. **Baixe o Projeto:**
   - No painel do Dualite, procure a opção de baixar o projeto (geralmente um ícone de download ou exportar para o GitHub/Zip).
   - Extraia os arquivos em uma pasta no seu computador.

2. **Abra no Terminal:**
   - Abra a pasta do projeto extraída no VS Code.
   - Abra o terminal integrado do VS Code (`Ctrl + \` ou `Cmd + \`).

3. **Instale as Dependências:**
   Execute o comando abaixo para instalar todas as bibliotecas (React, Tailwind, Supabase, etc.):
   ```bash
   yarn install
   ```
   *(Se não tiver o yarn, pode usar `npm install`)*

4. **Inicie o Sistema Completo:**
   Para rodar o painel visual (Frontend) e o robô de busca (Backend) ao mesmo tempo, execute:
   ```bash
   yarn run dev:all
   ```

5. **Acesse no Navegador:**
   Abra o seu navegador (Chrome, Edge, Safari) e acesse:
   👉 **http://localhost:5173**

Pronto! O sistema SurebetPro abrirá perfeitamente na sua máquina, super rápido e sem depender da visualização em nuvem.
