# Firma 0.13 — guia atual

> Este guia registra a base 0.13. A versão atual é 0.14; mudanças de editor, armazenamento, Git, executor, backups e preparação de produção estão em [Atualização v0.14](ATUALIZACAO-V0.14.md). Em caso de diferença, prevalece esse documento.

Este é o ponto de entrada para o funcionamento atual. Os documentos com `V0.x` no nome registram versões anteriores; descrições de paredes, salas antigas e ausência de ferramentas nesses registros são históricas.

Pesquisa e detalhes das melhorias visuais aplicadas: [Evolução visual do escritório](EVOLUCAO-VISUAL-ESCRITORIO.md).

## Escritório visual

Use **Ambiente** para uma cena mais limpa ou **Trabalho** para mostrar nomes e avisos do projeto selecionado. Aponte para uma pessoa ou estação para ver o nome e a ação. No modo Trabalho, clique no aviso para abrir a tarefa de revisão, bloqueio ou falha. **Cenário e equipe** oferece a mesma navegação por uma lista em HTML, acessível por teclado e toque.

As câmeras **Ver tudo**, **Seguir** e **Minha mesa** mudam o enquadramento; os controles de zoom continuam em **Mapa e controles**. Em **Cenário e equipe → Personalizar cenário**, escolha madeira, tapete, plantas, luminárias, iluminação, movimento reduzido e volume de som. As preferências são deste navegador e ficam fora do backup do servidor. O som é opcional e precisa de uma ação para começar, mesmo após recarregar a página. A redução de movimento do sistema e da empresa também prevalece.

Móveis e pessoas agora compartilham a profundidade da cena. Cada setor tem tapete, quadro e equipamentos próprios; os postos vazios continuam visíveis, com monitores inativos. Poses e conversas representam a simulação: uma animação não comprova que o provedor esteja executando uma tarefa.

## Começar a trabalhar

1. Abra `Iniciar Firma.bat`, entre como administrador e mantenha o servidor aberto. A aplicação usa Node.js 22.18 ou posterior da linha 22.
2. Na sua mesa, crie um projeto próprio. Os arquivos ficam em `projects/<identificador>/`. O projeto **Firma · escritório** contém o código do próprio jogo; execuções com cópias exigem um projeto próprio.
3. Escolha o projeto no seletor do topo. **Projeto ↗** reúne Resumo, Planos, Memória, Execuções, Caixa de entrada e Dados e ajustes. A gestão e a bancada acompanham essa escolha.
4. Defina objetivo, equipe e limites. Registre requisitos e decisões em **Memória**. Somente registros aprovados entram no contexto das novas tarefas e conversas. Tarefas já criadas preservam seu briefing.
5. Prepare um plano, edite etapas, responsáveis, dependências e critérios; depois inicie. Preparar planos usa regras locais e não consome IA. Planos iniciados preservam suas etapas; ajustes posteriores são feitos nas tarefas ou em outro plano.
6. Em **Execuções**, escolha uma tarefa e um modo. Confira as alterações e as verificações antes de **Revisar e integrar**. Depois aprove a entrega na gestão. Dependências exigem aprovação da etapa anterior para geração e integração.

## Modos e execução real

| Modo | O que acontece |
| --- | --- |
| Manual | Você prepara arquivos na cópia e autoriza verificações locais. Nenhuma chamada à IA. |
| Assistido | Uma chamada ao executor configurado propõe arquivos completos na cópia. Você pode verificar e revisar. |
| Delegado | A IA propõe arquivos, as verificações cadastradas executam e suas falhas podem alimentar outra rodada, até o limite autorizado. |

Cada execução guarda base, arquivos propostos, até cinco checkpoints, estado, chamadas, tokens quando informados, provedor/modelo, tempos e evidências. O executor usa uma chamada por rodada, com máximo configurável de uma a cinco rodadas e 15 a 600 segundos. Uma execução usa o executor compartilhado por vez; chats e ordens concorrentes aguardam. Limites diários por projeto se somam ao limite geral das IAs e são aplicados no servidor. Contagens diárias usam UTC. Valores monetários não são inventados.

Preparar uma cópia não envia chamadas. Autorizar sua execução pode enviar ao provedor o briefing, o contexto aprovado e todos os arquivos permitidos dessa cópia, até 45 mil caracteres de contexto. Arquivos com credenciais reconhecidas pela proteção existente ficam fora do snapshot. A autorização do chat continua separada e anexos continuam explícitos. Conversas com o mesmo agente têm históricos próprios por projeto; conversas antigas permanecem no escritório geral.

Planejamento e liderança propõem documentos `.md`, `.txt` e `.json`. Desenvolvimento propõe código e documentação; teste prepara testes e relatórios; conteúdo prepara arquivos para revisão. Caminhos e conteúdo passam por validação. O modelo não recebe um shell e não amplia ferramentas ou pasta. A aplicação executa somente as operações locais previstas. Pesquisa na internet e publicação externa não estão conectadas como ferramentas dos agentes.

## Verificações, isolamento e integração

Em **Dados e ajustes → Verificações do projeto**, cadastre uma verificação por linha:

```text
syntax
node-test:tests/app.test.js
node-script:scripts/build.js
```

`syntax` executa `node --check` nos arquivos JavaScript da cópia. `node-test` usa o executor de testes do Node. `node-script` executa um script JavaScript cadastrado; ele pode implementar uma verificação de build ou lint compatível com o ambiente. O painel mostra o comando, saída e resultado reais. Ausência de verificações executáveis exige revisão manual e não recebe selo de validação. Uma falha impede integrar até nova verificação bem-sucedida. Alterar código avaliado durante um script também invalida a evidência.

As cópias ficam na área privada do servidor. Comandos têm tempo e saída limitados, ambiente sem chaves dos provedores e execução sem shell. O Permission Model do Node limita leitura/escrita à cópia e bloqueia subprocessos e workers não autorizados. **Isso não é uma sandbox de sistema operacional para código hostil e não bloqueia toda comunicação de rede.** Use verificações confiáveis. Dependências externas, compiladores, npm e navegadores não são instalados ou autorizados automaticamente. A Firma não oferece ainda um executor geral de Playwright, Docker ou worktrees Git; a implementação atual usa cópias locais. [Limitações oficiais do Node](https://nodejs.org/docs/latest-v22.x/api/permissions.html).

A integração confere conflitos com os arquivos originais, preserva um checkpoint e grava apenas arquivos alterados. Se uma gravação falhar, tenta reverter os arquivos já escritos e informa qualquer falha de reversão. Arquivos novos revertidos são arquivados na área privada. A integração não apaga arquivos do projeto. Quedas abruptas do processo durante uma integração ficam como **Interrompida**, com checkpoint preservado para conferência; não há promessa de transação atômica de múltiplos arquivos em caso de corte de energia. O jogo nunca aprova a entrega automaticamente.

Ao reiniciar, execuções em andamento ficam interrompidas. Não há reenvio automático de chamadas, pois a resposta anterior pode ter consumido créditos. Consulte arquivos, evidências e checkpoints antes de autorizar outra tentativa. Tarefas ligadas a cópias não progridem pelo relógio da simulação.

## Backup e recuperação

**Dados e ajustes → Exportar backup completo** gera um JSON com escritório, projetos, arquivos de código/documentação permitidos, conversas salvas, prompts, memória, planos, execuções e hashes SHA-256. Credenciais, sessão Codex, arquivos privados, dependências e binários ficam fora. Rascunhos existentes somente no navegador precisam ser salvos no disco ou exportados pela bancada antes.

Ao importar, o servidor confere estrutura, limites, caminhos e hashes. O resumo aparece antes da confirmação. Os projetos são restaurados em **novas cópias**, inclusive o código do jogo; nenhum código em execução é substituído. O escritório e as conversas passam a refletir o pacote. Antes disso, um pacote de segurança do estado anterior é salvo em `.firma-private/backups/`. O limite é de 40 projetos próprios, e o servidor verifica a capacidade antes de importar. As chaves precisam ser conectadas novamente conforme o provedor; restauração nunca inicia trabalho de IA.

Armazenamento permanece em JSON com substituição atômica por arquivo e arquivos locais. SQLite foi avaliado como evolução condicionada ao volume, conforme a pesquisa; não é requisito desta entrega. Backups do escritório antigo continuam disponíveis, mas não equivalem ao pacote completo.

## Modelos locais, acompanhamento e cenário

**Conectar IAs → Ollama → Detectar modelos locais** consulta somente `http://127.0.0.1:11434`. Com Ollama já instalado, iniciado e com modelos baixados pelo usuário, escolha um modelo instalado para uma função compatível. Liderança continua vinculada ao Codex. Não há instalação, download ou seleção automática de modelo pelo jogo. RAM total aparece no diagnóstico; desempenho e qualidade precisam ser medidos no seu hardware. [API de chat do Ollama](https://docs.ollama.com/api/chat), [modelos instalados](https://docs.ollama.com/api/tags).

A caixa de entrada reúne revisões, dependências e histórico com atalhos. Balões diferenciam entregas simuladas e trabalho para revisar; falas sociais podem ser desligadas. Movimento reduzido pausa animações decorativas, preservando deslocamentos necessários à interação e à entrada/saída do escritório. A planta compacta e aberta foi mantida.

Marcos reconhecem primeira entrega aprovada, primeira integração com verificações e cinco aprovações. A lista de primeiros passos acompanha objetivo, memória, plano e aprovação validada. Contagens por especialidade consideram entregas aprovadas com verificações. A primeira aprovação libera o detalhe de jardim; a primeira aprovação com verificações libera madeira clara. A decoração é opcional e não bloqueia trabalho. Energia, pausas, níveis de XP e conversas sociais continuam mecânicas simuladas; não medem disponibilidade nem competência de um provedor real. As contagens de entregas verificadas aparecem separadamente no painel do projeto.

**Diagnóstico** mostra versão, Node, plataforma, RAM, armazenamento, conexões, execução ativa, última falha e contratos das funções. **Comparar execuções** apresenta chamadas, tokens informados, duração da última tentativa, correções e verificações de dois registros. Compare tarefas equivalentes e revise a qualidade; a tela não é um benchmark automático de modelos ou de versões de prompt.

## Validação e módulos

- `npm run check`: sintaxe dos módulos do cliente e servidor.
- `npm test`: testes de motor, acesso, provedores substitutos, chat, arquivos, cópias, limites, cancelamento, recuperação, integração, rollback e backup.
- `tests/browser-company.cjs`: jornada real no navegador de projetos, memória, planos, verificações, integração, backup, sincronização da mesa e layout móvel.
- `tests/browser-scene.cjs`: profundidade, seleção da tarefa certa, contexto por projeto, câmera, personalização, movimento reduzido, áudio opcional, toque e privacidade do visitante. `tests/browser-village.cjs` e `tests/browser-office-life.cjs` cobrem circulação, postos, café e expediente.
- `tests/browser-workbench.cjs`, `tests/browser-desk.cjs` e `tests/browser-management.cjs`: jornadas da bancada e gestão.

Os testes de navegador usam Playwright e Chrome instalados no ambiente de QA, com diretórios temporários e provedores substitutos. Eles não usam contas, arquivos ou créditos reais do proprietário. Qualidade de modelos e funcionamento de um Ollama instalado não foram medidos por esses testes.

Novos módulos: `company.cjs` (estado e execução), `company-backup.cjs` (pacotes e restauração), `company-tools.cjs` (contratos), `company-ui.js` (navegação e revisão). A bancada e as integrações existentes permanecem nos seus módulos, com migração compatível dos registros antigos.
