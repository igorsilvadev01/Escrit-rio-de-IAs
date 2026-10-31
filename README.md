# Firma — escritório de IAs em 2D · v0.14

A Firma reúne projetos, tarefas, memória aprovada, conversas com IAs e uma bancada de programação em um escritório interativo. O proprietário administra o trabalho; visitantes acompanham uma visão pública sem briefings, arquivos ou credenciais.

**Esta versão continua local. Nada foi publicado na internet.** As melhorias e os limites de preparação de produção estão no [guia da versão 0.14](docs/ATUALIZACAO-V0.14.md).

## Abrir

Use Node.js 22.18 ou posterior da linha 22, preferindo uma atualização de segurança atual dessa linha. Dê dois cliques em **Iniciar Firma.bat**, ou execute:

```powershell
npm start
```

Abra **http://localhost:3000** e mantenha o servidor ligado. O editor compilado já acompanha o repositório; não é necessário instalar as dependências de desenvolvimento para iniciar a aplicação.

No primeiro acesso, o iniciador abre a configuração privada do proprietário. Não há senha padrão nem cadastro público de administradores. Credenciais, projetos e estado ficam na área privada, excluída do Git. Ao atualizar, encerre o servidor anterior, abra o iniciador novamente e use Ctrl+F5.

## Programar e revisar

Na sua mesa, crie um projeto ou escolha **Importar GitHub** para trazer código permitido de um repositório público para uma cópia local. O editor tem destaque de sintaxe, sugestões, indentação, histórico de edição, busca/substituição, comparação por linhas e recuperação de rascunhos. Use Ctrl+S para salvar e Ctrl+P para localizar arquivos.

O projeto **Firma · escritório** mostra o código desta aplicação. Em instalações com domínio público, ele é somente leitura. Desenvolva aplicações em projetos próprios.

Em **Projeto ↗**, defina objetivo, equipe, memória e critérios. Prepare uma tarefa nos modos Manual, Assistido ou Delegado. A proposta fica em uma cópia, com evidências e checkpoints. Compare, integre e aprove a entrega na gestão. A simulação visual não substitui uma execução de testes.

**Git e histórico de versões**, nos ajustes do projeto, permite inicializar um histórico e criar checkpoints. Marque **Criar branch Git por tarefa** para usar worktree e commit por entrega. Não há envio automático de commits nem criação de PRs externos.

O terminal verifica o projeto selecionado. Sintaxe e testes Node funcionam no executor local; instalação de dependências, lint, tipos e build usam o executor Docker, preparado separadamente. O modo local é destinado a código confiável. Configuração, limites e exemplos: [programação e executor](docs/ATUALIZACAO-V0.14.md#testar-e-compilar-projetos).

## IAs reais e simulação

Em **Gestão → Ajustes e IAs**, conecte os provedores desejados. A integração atual oferece Codex, Gemini e Ollama para modelos locais já instalados. Conexões e modelos disponíveis dependem da configuração e da conta; nenhum consumo começa só por abrir a mesa.

Chamadas reais exigem autorização e respeitam limites. Chats enviam os anexos marcados; execuções usam seleção explícita ou automática de arquivos, com registro do contexto e catálogo do projeto. Resultados continuam aguardando revisão. Reinícios não repetem chamadas pagas automaticamente.

Personagens, energia, café e diálogos demonstrativos usam regras locais. As animações não comprovam que um provedor está trabalhando. Os setores Planejar, Desenvolver, Testar e Postar organizam o trabalho; Postar não publica em contas externas.

## Dados, backup e versões

Os arquivos dos projetos ficam em **.firma-private/projects/** por padrão. Projetos antigos registrados em **projects/** são copiados na inicialização; os originais permanecem intactos. O diretório pode ser configurado por FIRMA_PROJECTS_DIR. Preserve também os metadados em FIRMA_DATA_DIR.

**Dados e ajustes** permite exportar/restaurar pacotes e criar backup no servidor. O agendamento padrão gera um pacote a cada 24 horas, retendo sete. Para proteção contra perda do computador, configure armazenamento e cópia externos. Backups exportáveis não incluem credenciais nem histórico Git.

Depois de integrar, verificar e aprovar uma entrega, **Preparar pacote do site** gera um download estático com manifesto e hashes. Não publica o projeto. [Recuperação e preparação de versões](docs/ATUALIZACAO-V0.14.md).

## Verificar o desenvolvimento

```powershell
npm ci
npm run verify
npm run test:browser
```

Com Docker instalado, daemon iniciado e imagem preparada, execute também **npm run test:docker**. O CI verifica código no Windows/Linux, jornadas de navegador e executor Docker. Os testes usam diretórios temporários e provedores substitutos, sem créditos reais.

## Futura produção

Acompanham o projeto: Dockerfile, exemplos de Caddy/systemd, variáveis de ambiente, saúde/readiness e logs opcionais. Esses arquivos não são aplicados automaticamente. A bancada remota exige configuração explícita, HTTPS e executor Docker disponível; credenciais e código da instalação ficam separados dos projetos.

A primeira implantação deve usar **uma instância e um proprietário**, com armazenamento persistente, backup fora da máquina e homologação. Não há múltiplas empresas, perfis de administradores ou réplicas compartilhando os JSON. Consulte o [procedimento de preparação](docs/ATUALIZACAO-V0.14.md#preparação-de-produção) antes de configurar hospedagem.

## Navegação e documentação

- Clique em computadores e colegas para abrir suas ferramentas diretamente.
- WASD/setas ou toque no chão para andar; E para interagir.
- Gestão reúne tarefas, revisão, equipe e conexões.
- Projeto ↗ reúne planos, memória, execuções, Git, backups e diagnóstico.
- Ambiente/Trabalho, câmera e cenário preservam a personalização do escritório.
- [Atualização e limites da versão 0.14](docs/ATUALIZACAO-V0.14.md).
- [Guia da base 0.13](docs/CAPACIDADES-ATUAIS.md), complementado pela versão 0.14.
- [Pesquisa que orientou esta atualização](docs/PROGRAMACAO-E-PRODUCAO.md).

Documentos com versões anteriores no nome são registros históricos. Repositório: [igorsilvadev01/Escrit-rio-de-IAs](https://github.com/igorsilvadev01/Escrit-rio-de-IAs).


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
