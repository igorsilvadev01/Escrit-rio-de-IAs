# Bancada local de programação

Clique no **Codex** ou no computador da **sua mesa**. A bancada ocupa a tela, com projetos e arquivos à esquerda, área de trabalho no centro, conversa à direita e terminal na parte inferior. No celular, use as abas para alternar essas áreas.

## Mesa para o trabalho diário

- **Ctrl+P** procura arquivos no projeto; **Ctrl+Shift+P** procura comandos. Use as setas, Enter e Esc para navegar sem sair do teclado.
- O explorador organiza as pastas em árvore. Arquivos abertos têm abas que podem ser fechadas. A mesa avisa antes de descartar um rascunho.
- Os botões no topo mostram ou recolhem explorador, terminal e conversa. **Modo foco**, na lista de comandos, reserva a área para o editor. **Restaurar painéis** traz a equipe de volta.
- **Ctrl+F** abre busca e substituição no arquivo. A lista de comandos também permite formatar arquivos JSON. O botão **↵** alterna quebra de linhas.
- **Comparar** mostra o conteúdo anterior e o rascunho lado a lado. Se o arquivo mudou fora do jogo, a mesa preserva as duas versões e suspende o salvamento daquele arquivo até você resolver o conflito.

## Recuperação e automatizações locais

Projeto, abas, rascunhos e pedidos não enviados são guardados em IndexedDB neste navegador. Ao reabrir **sua mesa**, o projeto anterior e os rascunhos voltam. Os rascunhos ainda não são arquivos salvos e podem ser perdidos se os dados do navegador forem apagados. Caso a recuperação local não consiga gravar, a interface informa isso e mantém o aviso de saída com alterações.

Clique em **Salvar manualmente** ou **Auto salvar**, no topo, para escolher as automatizações:

- **Salvar automaticamente:** grava após 1,5 segundo sem digitar, somente nos projetos criados por você. O código do jogo Firma mantém salvamento manual.
- **Verificar JavaScript ao salvar:** roda `node --check` no arquivo salvo e mostra o resultado no terminal. Essa verificação não executa o programa nem envia dados para IA.

Sugestões de IA em revisão e arquivos em conflito aguardam sua decisão, mesmo com o salvamento automático ligado. Uma falha de salvamento preserva o rascunho e pausa as tentativas automáticas daquele arquivo. Chamadas de IA continuam exigindo o envio pelo chat.

## Prévia e sugestões de código

**▶ Prévia** abre o HTML do projeto, junto com CSS e JavaScript locais referenciados por ele. Alterações no editor atualizam a prévia, inclusive antes de salvar. A prévia usa um documento temporário, com isolamento do escritório e restrições de acesso à rede; não tem acesso à sessão do administrador. Arquivos com módulos, dependências externas, imagens locais ou um backend próprio ainda precisam das ferramentas do projeto.

Blocos de código recebidos de uma IA concluída oferecem **Revisar no editor**. Escolha o arquivo, confira a comparação e coloque a sugestão no rascunho. Você pode desfazer essa sugestão ou salvar para aplicá-la ao disco. O anexo do chat usa a versão salva: a mesa pede para salvar primeiro se o editor tiver mudanças.

## Trabalhar em um projeto

1. Clique em **＋ Projeto**, informe nome e objetivo. A Firma cria uma pasta real em `projects/<identificador>` com `README.md` e `index.html`.
2. Abra um arquivo pelo explorador ou pelo seletor do editor. Use **＋ Arquivo** para criar caminhos como `src/main.js`.
3. Edite e clique em **Salvar**, pressione **Ctrl+S** ou habilite o salvamento automático. Os arquivos são gravados no seu computador. A versão anterior fica em `.firma-private/file-backups`.
4. Se o arquivo tiver mudado fora do jogo, o salvamento avisa sobre o conflito e preserva o conteúdo do disco. Rascunhos são recuperados neste navegador ao trocar de arquivo, fechar ou recarregar a bancada.

O projeto **Firma · escritório** permite consultar e editar o código do próprio jogo. Mudar esse código pode exigir recarregar a página ou reiniciar o servidor. Arquivos privados, credenciais, links e arquivos acima de 300 KB não ficam disponíveis para edição. A criação de projetos e a biblioteca de prompts são registradas em `.firma-private/projects.json`; os backups gerais do escritório não incluem as pastas dos projetos nem os históricos da bancada.

## Conversar com qualquer agente

Selecione **Codex** ou um funcionário na lista da equipe ou no seletor do chat. Cada pessoa tem um histórico próprio, incluindo funcionários que usam o mesmo provedor. Os antigos canais por setor continuam disponíveis para preservar as conversas existentes.

Em **Gestão → Equipe**, abra uma pessoa e clique em **Abrir conversa de trabalho**. A identidade e as instruções daquele funcionário acompanham o pedido. O executor é o provedor configurado para o setor; os personagens não são modelos independentes instalados no computador.

Escreva o pedido, abra **Contexto e autorização de envio**, escolha se deseja anexar o arquivo salvo e autorize a chamada. **Ctrl+Enter** envia. Somente o histórico da conversa selecionada e o arquivo marcado são enviados. Alterações ainda não salvas no editor não são anexadas. Chats compartilham a cota das tarefas reais e exigem uma conexão ativa. Não há chamadas automáticas ao abrir a bancada.

Use **Meus prompts** para reutilizar modelos ou salvar seus próprios textos. Os prompts só preenchem o campo de mensagem; você revisa e envia. Uma resposta concluída pode virar uma tarefa para revisão.

## Terminal e limites

O terminal executa verificações reais e explícitas: sintaxe de JavaScript, testes automatizados da Firma e consultas locais do Git. **Parar** interrompe o processo. O editor aceita código de outros tipos, mas não instala dependências, depura programas, oferece extensões do VS Code ou um shell livre. As IAs propõem código no chat; você escolhe o conteúdo que copia para o editor e salva.

Projetos novos começam com arquivos HTML e Markdown. Para usar outras ferramentas e executar aplicativos completos, abra a pasta indicada na bancada em suas ferramentas locais. A bancada continua disponível somente para o administrador em localhost.

## Referência e validação

Organização adaptada da documentação oficial da [interface do VS Code](https://code.visualstudio.com/docs/editing/getting-started/userinterface): explorador, editor, painel inferior e área de conversa. A Firma mantém a paleta de madeira, papel e verde.

As melhorias de acesso rápido, comandos e modos de exibição seguem as [dicas oficiais do VS Code](https://code.visualstudio.com/docs/editing/getting-started/tips-and-tricks). Busca, salvamento e recuperação usam como referência [Basic Editing](https://code.visualstudio.com/docs/editing/codebasics). A comparação e a reversão de sugestões foram adaptadas das orientações de [revisão de alterações de agentes](https://code.visualstudio.com/docs/agents/run/review-code-edits).

`tests/browser-workbench.cjs` verifica prévia com CSS/JS, isolamento, recuperação após recarga, conflito com alteração externa, salvamento e sintaxe automáticos, busca/substituição, revisão/desfazer sugestão, modo foco e celular. Os provedores são substitutos, sem chamadas às contas do usuário. A API de prévia também tem testes de autenticação, limites e política de isolamento.

`tests/browser-desk.cjs` verifica criação de projetos e arquivos, gravação no disco, terminal de sintaxe, conversas separadas, biblioteca de prompts, acesso pelo perfil, celular e limites de visitantes. Usa uma pasta temporária e provedores substitutos. Os testes de `workstation.test.cjs` também verificam conflitos de salvamento, backups e caminhos inválidos.
