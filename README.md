# Firma — escritório de IAs em 2D · v0.13

## Demonstração online

[Abrir demonstração do Escritório de IAs](https://igorsilvadev01.github.io/Escrit-rio-de-IAs/).

A versão pública permite explorar o cenário 2D, os personagens e os diálogos demonstrativos com dados de exemplo e simulação local. Não usa login, contas, arquivos privados ou chamadas reais de IA. Administração, projetos, arquivos, terminal e integrações precisam da versão Node.js descrita abaixo.

O GitHub Actions publica somente os arquivos de navegador selecionados por `scripts/build-pages.cjs`. Para gerar a demonstração localmente, execute `node scripts/build-pages.cjs` e sirva a pasta `_site/`. O servidor e seus recursos continuam preservados no projeto original.

O escritório agora tem profundidade compartilhada entre móveis e personagens, setores com identidade própria, poses de trabalho e café e modos **Ambiente / Trabalho**. Use **Ver tudo / Seguir / Minha mesa** para a câmera e **Cenário e equipe** para personalizar materiais, iluminação, som opcional e acessar colegas. Avisos do projeto ativo abrem suas tarefas. Detalhes e verificação: [Evolução visual aplicada](docs/EVOLUCAO-VISUAL-ESCRITORIO.md).

Guia de uso, capacidades e limites desta versão: [Capacidades atuais](docs/CAPACIDADES-ATUAIS.md). A pesquisa e o quadro de implementação das 16 frentes estão no [Plano de evolução da Firma](docs/EVOLUCAO-DO-PROJETO.md). Documentos com versões antigas no nome são registros históricos.

## Projetos, planos e execução em cópias

O seletor no topo sincroniza projeto, gestão, bancada e conversas individuais. **Projeto ↗** abre planos editáveis, memória aprovada, execuções, caixa de entrada e ajustes. Cada projeto tem objetivo, equipe e limites próprios.

Prepare uma cópia de uma tarefa nos modos **Manual**, **Assistido** ou **Delegado**. O modo delegado pode propor arquivos e corrigir falhas das verificações cadastradas dentro dos limites autorizados. Compare arquivos, consulte evidências e checkpoints e integre explicitamente; a aprovação da entrega continua na gestão. O servidor registra interrupções e não repete chamadas automaticamente.

Em **Dados e ajustes**, exporte/restaure pacotes completos, compare execuções, consulte diagnóstico e ajuste o cenário. O adaptador Ollama é opcional e detecta modelos já instalados. Cópias, scripts Node e limites estão disponíveis; isolamento de sistema operacional, worktrees Git e publicação externa não estão implementados. Consulte o guia antes de configurar verificações locais.

## Sua bancada de programação

A mesa agora tem **Ctrl+P** para arquivos, comandos pesquisáveis, pastas em árvore, modo foco, busca/substituição e comparação de alterações. Rascunhos e pedidos não enviados são recuperados neste navegador. Habilite **Auto salvar** e **verificar JavaScript ao salvar** para automatizar a rotina local. **Prévia** mostra páginas com CSS/JS do projeto; **Revisar no editor** permite comparar e aproveitar códigos recebidos das IAs.

Clique em **Codex** ou na **sua mesa** para abrir projetos, arquivos editáveis, terminal e conversas individuais com todos os agentes. Crie projetos locais, salve arquivos com **Ctrl+S**, reutilize prompts e acompanhe tarefas. Em **Gestão → Equipe**, **Abrir conversa de trabalho** leva diretamente ao chat da pessoa escolhida. A bancada segue a organização de um editor de código, mantendo o tema da vila.

Projetos ficam em `projects/`, no seu computador; salvamentos preservam uma cópia anterior e verificam conflitos. As IAs continuam dependendo das conexões configuradas e de autorização de envio. Guia, atalhos e limites: [Bancada de programação](docs/BANCADA-PROGRAMACAO.md).

## Gestão simplificada

O botão **Gestão**, no topo, reúne **Visão geral**, **Tarefas**, **Para revisar**, **Equipe** e **Ajustes e IAs**. Crie uma tarefa com título e explicação; o responsável é sugerido pelo tipo de trabalho. Prazo, dependências e detalhes ficam recolhidos. Acompanhe a lista com busca e filtros, abra uma entrega para aprovar ou pedir ajustes e volte à gestão pelo mesmo caminho. O tema de madeira e verde continua em todas as telas.

O botão **Gestão** nos computadores usa o mesmo painel, filtrado por setor. Integrações, contexto, preferências e backups estão em **Ajustes e IAs**. Guia, referências pesquisadas e verificação: [Gestão simplificada](docs/GESTAO-SIMPLES.md).

## Nova planta: setores abertos e tema de vila

O mapa tem **720 × 480**, com quatro setores de produção em um espaço aberto. As paredes e suas colisões foram removidas: é possível circular entre as mesas por qualquer lado livre. O espaço compartilhado por você e Codex tem **184 × 132**, apenas com as duas mesas. A área de reunião foi retirada. Há 24 postos individuais com mesa, computador e cadeira, além de um pequeno cantinho do café com três bancos e um lugar para você.

## Uma equipe viva e horários do escritório

- Os colaboradores ficam sentados nas suas cadeiras, trabalham, levantam para pausas e circulam até o café. Até três colegas em pausa usam os bancos; os demais descansam na própria mesa.
- Colegas disponíveis também fazem pequenas visitas ao café. Balões mostram falas locais alternadas; ao clicar em alguém, **Conversar com o colega** oferece um diálogo demonstrativo sobre energia, trabalho e café. **Dar ordem à IA** continua sendo a ação separada para usar um modelo real.
- No topo, **Fechar escritório** encerra o expediente. Os funcionários se despedem e saem um por um pela saída à esquerda; Codex sai por último. **Abrir escritório** traz Codex primeiro e depois os funcionários, também em sequência.
- O escritório fechado permanece salvo, inclusive ao recarregar a página ou reiniciar o servidor. Missões, feedback, progresso, energia e preferências de pausa são preservados. As animações de saída e chegada usam intervalos de cinco segundos por personagem e continuam mesmo com a produção pausada; elas avançam enquanto o servidor está ligado.
- Uma resposta real de IA em andamento precisa terminar antes de fechar. Ordens ainda na fila ficam suspensas e exigem nova autorização; abrir o escritório não dispara novas cobranças. As missões simuladas retomam após a chegada de toda a equipe, respeitando a pausa da produção.
- **Sair** encerra seu login; **Fechar escritório** altera o expediente da equipe. Visitantes acompanham a abertura e o fechamento, mas só o administrador usa esses controles.

Conversas, rotinas sociais e gestos dos personagens são simulados, sem chamadas externas ou consumo de IA.

O tema segue a referência visual enviada: grama verde, árvores, madeira, terra, água, ponte, placas e personagens de contorno escuro em pixel art. Os desenhos são locais, feitos em canvas, sem imagens ou serviços externos. A interface e os computadores também usam a paleta de madeira e papel.

Ao carregar uma planta anterior, seu personagem volta à entrada segura. Aparência, equipe, visitas históricas, tarefas, integrações e progresso são preservados. Para ver a mudança, encerre o servidor antigo com `Ctrl+C`, execute **Iniciar Firma.bat** novamente e use `Ctrl+F5` no navegador.

## Computadores dentro do jogo: código, chat e terminal

Entre como administrador e **clique no Codex ou nos computadores para abrir imediatamente, sem caminhar**. O menu **Mapa e controles** também abre cada estação diretamente. Caminhar com WASD/setas e interagir com **E** continua opcional. Sua **mesa de administrador fica junto à do Codex**, com o mesmo chat, código, missões e terminal de desenvolvimento; não duplica contas nem histórico. O guia [Sala do administrador v0.11](docs/ADMIN-V0.11.md) descreve as ferramentas da mesa; a localização mudou para a sala compartilhada.

Cada setor tem uma animação própria durante o trabalho. A porcentagem é a razão de entregas prontas pelo total de missões do setor; geração real usa indicador de atividade sem inventar percentual de tokens. A simulação é identificada separadamente. Guia: [Computadores e setores v0.10](docs/COMPUTADORES-V0.10.md).

Chats usam streaming real, histórico privado e o mesmo limite diário das missões. Nenhum arquivo é enviado sem você marcar o anexo. A Bancada só está disponível no servidor local. Guia e limites: [Bancada v0.9](docs/BANCADA-V0.9.md).

Um escritório jogável com quatro salas de produção, uma sala para o líder Codex, login exclusivo do proprietário e visitas em tempo real. HTML, CSS, JavaScript e Node.js, sem dependências externas de execução.

## IAs reais

Em **Gestão → Ajustes e IAs**, abra **Conectar ou configurar IAs**. Codex usa login oficial do ChatGPT em uma sessão própria da Firma. Gemini usa a chave da plataforma de API — não a senha do chat.

Integrações disponíveis: apenas Codex e Gemini. Codex fica na liderança/desenvolvimento; Gemini no planejamento, revisão técnica e conteúdo. Claude foi removido da interface e dos adaptadores de execução. Modelos são ajustáveis conforme sua conta.

Use **Ordem ao líder Codex**, **Dar ordem à IA** no colaborador ou **Criar fluxo com IAs reais**. Cada envio exige confirmação do compartilhamento de dados e possível consumo. Respostas vão para revisão humana; uma dependência só avança depois da sua aprovação.

**Limite das IAs:** geram texto, planos, código proposto, análises e rascunhos; não executam comandos/testes, editam projetos ou publicam automaticamente. O administrador pode executar verificações reais separadamente no terminal restrito da Bancada. A simulação continua identificada. A execução com suas contas precisa ser validada após você autenticar; os testes automatizados usam provedores substitutos, sem créditos.

Guia de conexão, custos, segurança, limitações e fontes: [IAs reais v0.8](docs/IAS-REAIS-V0.8.md).

O planejamento de entregas continua disponível pelo Codex, com quatro etapas e revisão humana entre elas. A reunião física foi removida para manter o espaço compacto. Ao carregar uma planta antiga, uma convocação que estivesse ativa é encerrada para evitar que as tarefas fiquem presas aguardando uma reunião inexistente.

Sua cadeira fica na mesa ao lado do Codex. Clique nela para sentar; para levantar, use **E**, WASD, setas ou clique no chão.

As pausas continuam recuperando energia na própria mesa de cada colaborador.

Os guias [Tema e reuniões v0.6](docs/TEMA-REUNIOES-V0.6.md) e [Cadeiras e descanso v0.7](docs/CADEIRAS-DESCANSO-V0.7.md) registram plantas anteriores. A referência atual é a planta de cinco salas descrita acima.

Repositório: [igorsilvadev01/Escrit-rio-de-IAs](https://github.com/igorsilvadev01/Escrit-rio-de-IAs).

## Abrir

Dê dois cliques em **Iniciar Firma.bat**, ou execute:

```powershell
npm start
```

Acesse **http://localhost:3000**. Mantenha o servidor ligado. Se uma versão antiga estiver rodando, feche-a e inicie novamente. Não é necessário executar `npm install` para usar o jogo.

## Entrar

A tela inicial oferece **Login do administrador** e **Visitar escritório**.

O primeiro proprietário é configurado pelo endereço privado aberto por `Iniciar Firma.bat`. É possível usar e-mail ou usuário; não há cadastro público de outros administradores nem senha padrão. Credenciais e escritório ficam em `.firma-private/`, que não é servida pelo site e está excluída do Git.

Se houver dados da versão anterior no navegador, o primeiro login oferece importá-los para o servidor, preservando a cópia antiga. O administrador controla o escritório; o visitante acompanha o estado público e explora o cenário sem alterar os dados. Briefings, contexto, instruções, feedback e documentos não são enviados ao visitante.

Detalhes de autenticação, armazenamento e publicação estão em [ACESSO.md](docs/ACESSO.md).

## O escritório é a interface

A tela principal abre diretamente no jogo. Missões, equipe, preferências e backups ficam dentro dos ambientes, em vez de ocupar menus laterais.

| Sala | O que acontece nela |
| --- | --- |
| **01 · Planejar** | Pesquisa, escopo, design e contexto compartilhado |
| **02 · Desenvolver** | Construção e fila dos desenvolvedores |
| **03 · Testar** | Qualidade, critérios de aceite e revisão |
| **04 · Postar** | Preparação de postagem e checklist de divulgação |
| **05 · Líder — Codex** | Objetivos, fluxo completo, próximo passo e ferramentas do escritório |

Os agentes ficam separados por sala. Na contratação, escolha a especialidade e o ambiente. Para realocar um agente, interaja com ele, escolha sua sala e salve as instruções. Cada sala comporta até seis especialistas.

Na sala do líder, a opção **Equipe, escritório e ferramentas** reúne contratação, equipe, contexto, personagem, preferências, histórico, pausa/velocidade e backups.

Codex é o personagem que representa o líder no jogo. A coordenação é simulada e usa regras locais; não há conexão com o ChatGPT, o Codex ou outro modelo externo.

## Jogar

- **WASD ou setas:** andar.
- **Clique/toque no chão:** caminhar contornando móveis e paredes.
- **Clique em um terminal ou colega:** abrir suas ferramentas diretamente, sem caminhar.
- **E ou botão de interação:** usar o objeto ou conversar com o colega próximo.
- **1–5:** caminhar até a sala correspondente.
- **Mapa e controles / Ctrl+K:** escolher um destino; zoom também fica nesse menu recolhido.
- **Esc:** cancelar o deslocamento ou fechar um diálogo.
- **?:** guia.
- **Celular:** setas de toque, câmera acompanhando o personagem e botão de interação.

Aparência, nome, posição e salas visitadas são salvos. Na migração da planta antiga para a compacta, somente a posição volta à entrada segura; salas visitadas, equipe, missões e identidade são mantidas.

## Da ideia à divulgação

Converse com Codex na sala do líder e escolha **Planejar uma entrega**. Um objetivo gera quatro missões encadeadas:

`Planejar → Desenvolver → Testar → Preparar postagem`

O responsável é escolhido na sala correspondente. Cada entrega passa pela aprovação do administrador antes de liberar a etapa seguinte. Pedidos de ajuste voltam à produção. Se faltar uma especialidade, complete a equipe antes de criar o fluxo.

Cada agente executa uma tarefa por vez. Energia, pausas, experiência, prioridade, dependências, critérios, feedback e contexto continuam disponíveis. Missões também podem ser criadas individualmente nos terminais das salas.

## O que é simulado

**Nenhuma IA externa está conectada.** A produção, o planejamento e as conversas demonstrativas usam regras locais. O documento de entrega é identificado como simulado. A sala de Testar não executa testes reais e a sala de Postar não publica em nenhuma rede social ou conta externa.

A produção avança enquanto o servidor Node.js está ligado, mesmo sem abas abertas. Ao desligá-lo, o escritório para; não há recuperação automática do tempo desligado. A pausa afeta a produção, mas você pode continuar andando.

Visitantes acompanham o mesmo escritório em modo somente leitura. Seu personagem é local à aba: não há presença multiplayer entre visitantes. O servidor mantém as regras e o estado compartilhado; o navegador não decide permissões.

## Verificar

```powershell
npm run check
npm test
```

Os testes automatizados cobrem o motor, fluxo por salas, colisões, portas, agentes, migração, backups, autenticação, permissões, privacidade e persistência.

A verificação real no Chrome está em `tests/browser-rooms.cjs` e `tests/browser-auth.cjs`. Requer Playwright instalado separadamente. `FIRMA_PLAYWRIGHT` pode apontar para o módulo e `FIRMA_BROWSER` para o Chrome local. Os testes criam contas e dados temporários isolados e geram capturas em `artifacts/`. Os antigos comandos `browser-smoke.cjs` e `browser-play.cjs` encaminham à suíte de salas.

## Arquivos principais

| Arquivo | Responsabilidade |
| --- | --- |
| `index.html` | Entrada, mapa, controles mínimos e diálogos |
| `engine.js` | Departamentos, modelos, filas, plano e regras simuladas |
| `world.js` | Cinco salas, posições, colisões e caminhos A* |
| `app.js` | Canvas, câmera, personagens e interação espacial |
| `ui.js` | Terminais das salas, líder e gestão dentro dos diálogos |
| `access.js` | Login, visita, sessão e comandos autenticados |
| `server.cjs` | Autenticação, permissões, produção e persistência |
| `office.css` | Interface focada no escritório e diálogos por sala |

As escolhas de organização e as referências aplicadas estão em [INTERFACE-V0.5.md](docs/INTERFACE-V0.5.md). A visão de integração futura está em [INTEGRACAO-IA.md](docs/INTEGRACAO-IA.md).

Esta versão roda localmente. Para visitas pela internet, é necessária hospedagem Node.js com HTTPS e armazenamento persistente; GitHub Pages sozinho não executa seu backend.


### Identidade visual e visitante

A interface usa azul cobalto, branco e azul-marinho, em continuidade com o portfólio. Antes de entrar, visitantes podem criar um personagem com nome, apresentação, tom de pele, roupas, calças, sapatos, cabelo e chapéu. A prévia é atualizada ao vivo e o botão **Meu personagem** permite mudar o visual durante a visita. A preferência é validada e salva apenas no navegador; não altera o personagem do administrador nem envia dados ao servidor.


### Vida no escritório

O cenário inclui seis colegas adicionais (Nina, Ravi, Bia, Caio, Yara e Miguel), com visuais e funções próprios. Eles são personagens ambientais, sem alterar a equipe de agentes ou as tarefas salvas no servidor. As rotinas intercalam mesa, quadros, café, plantas e encontros. O painel **Equipe e conversas** reúne o elenco, o histórico das falas presenciadas e oito conversas completas, com seis falas alternadas em cada uma. As falas só aparecem no cenário quando os dois participantes chegam ao encontro. As rotinas não usam IA nem produzem entregas; respeitam execução real, pausa, fechamento do escritório e redução de movimento.

Verificação do diretor de animação: `node --test tests/office-animation.test.cjs`.


### Igor e as animações de trabalho

Igor é o anfitrião fixo do cenário, na mesa ao lado do Codex, com identificação permanente. A câmera **Igor & Codex** aproxima a dupla. A mesa reservada abre a apresentação do anfitrião. O visitante continua com seu próprio personagem.

As poses alternam digitação, mouse e leitura com ritmos individuais; monitores e teclados só animam quando o colega está sentado naquela estação. A redução de movimento congela o ciclo. Nenhum desses efeitos inicia execuções reais ou altera tarefas.

Referências de direção visual: [Gather — mesas e espaços de trabalho](https://support.gather.town/articles/2958572750-take-a-tour-of-an-office-on-gather) e [Pixel Agents — animações por atividade](https://github.com/bartoszkwiat/pixel-office). O desenho em Canvas é próprio, sem copiar sprites ou tilesets externos.

Verificação: `node --test tests/workstation-animation.test.cjs`.


### Tema do estúdio da miniatura

A direção de arte do cenário segue o escritório em pixel art criado para a miniatura do portfólio: piso contínuo de madeira mel, janelas amplas de vidro azulado com paisagem, paredes cinza-azuladas, estantes com livros, vegetação em vasos azuis e assentos em azul-ardósia. Os setores, pontos de interação, obstáculos, rotas, personagens e animações conservam a geometria anterior. O renderer é compartilhado pela demonstração e pela versão completa; `studio-theme.css` aplica a mesma paleta aos controles e painéis.


### Sala principal no estilo chibi da referência

A entrada jogável usa uma arte-base própria reconstruída a partir do trecho marcado da miniatura, com sprites chibi animados em quatro direções. As duas mesas, sofá, janelas, estantes e plantas seguem a composição da imagem. A sala tem colisões e caminhos próprios; o escritório completo e as ferramentas originais permanecem em **Setores e equipe**, e os atalhos de Planejar, Desenvolver, Testar e Publicar abrem as funções existentes. A arte PNG e os prompts estão em `public-art/README.md`.

Validação da navegação da sala: `node --test tests/cozy-room.test.cjs`.### Escritório completo em arte chibi

O mapa completo é a única cena jogável: todos os setores, Igor e Codex usam móveis ilustrados e personagens chibi da mesma referência visual. A interação com cadeiras tem quadros de aproximação, flexão dos joelhos, acomodação, digitação e retorno em pé antes da caminhada. Há também gestos de leitura, café, rega, conversa e alongamento, respeitando redução de movimento. Navegação, colisões e ferramentas anteriores são preservadas. Arquivos e prompts: [public-art/README.md](public-art/README.md).
