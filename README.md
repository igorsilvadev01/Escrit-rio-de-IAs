# Firma — escritório de IAs em 2D · v0.9

## Bancada: código, chat e terminal

Entre como administrador e abra **⌘ Bancada** no topo. Acompanhe os arquivos salvos no VS Code, converse separadamente com a IA de cada função, encaminhe missões e execute verificações locais com saída ao vivo. O terminal tem uma lista fixa de comandos permitidos; não é um shell livre e as IAs não editam arquivos automaticamente.

Chats usam streaming real, histórico privado e o mesmo limite diário das missões. Nenhum arquivo é enviado sem você marcar o anexo. A Bancada só está disponível no servidor local. Guia e limites: [Bancada v0.9](docs/BANCADA-V0.9.md).

Um escritório jogável com quatro salas de produção, uma sala para o líder Codex, login exclusivo do proprietário e visitas em tempo real. HTML, CSS, JavaScript e Node.js, sem dependências externas de execução.

## IAs reais

Na sala do Codex, abra **Conectar IAs reais**. Codex usa login oficial do ChatGPT em uma sessão própria da Firma. Claude e Gemini usam chaves das respectivas plataformas de API — não as senhas do chat.

Configuração atual recomendada para evitar pré-pagamento da API Claude: Codex na liderança/desenvolvimento e Gemini nas funções de planejamento, revisão técnica e conteúdo, dentro das cotas gratuitas da conta. Claude é opcional e pode permanecer desconectado. Modelos são ajustáveis conforme sua conta, mantendo Codex como líder.

Use **Ordem ao líder Codex**, **Dar ordem à IA** no colaborador ou **Criar fluxo com IAs reais**. Cada envio exige confirmação do compartilhamento de dados e possível consumo. Respostas vão para revisão humana; uma dependência só avança depois da sua aprovação.

**Limite das IAs:** geram texto, planos, código proposto, análises e rascunhos; não executam comandos/testes, editam projetos ou publicam automaticamente. O administrador pode executar verificações reais separadamente no terminal restrito da Bancada. A simulação continua identificada. A execução com suas contas precisa ser validada após você autenticar; os testes automatizados usam provedores substitutos, sem créditos.

Guia de conexão, custos, segurança, limitações e fontes: [IAs reais v0.8](docs/IAS-REAIS-V0.8.md).

Agora com uma paleta viva de azul, ciano, coral e violeta e uma área de reunião dentro da sala do líder. Converse com Codex ou clique na mesa de reunião e escolha **Reunir toda a equipe**. Os colaboradores caminham até seus lugares; as tarefas aguardam sem perder progresso, energia ou pausas pessoais. **Encerrar reunião e liberar equipe** faz todos voltarem aos setores. A convocação é exclusiva do administrador e suporta os 24 colaboradores do escritório, inclusive com a produção pausada.

Você e Codex agora têm cadeiras reservadas. Ao convocar, seu personagem vai até sua cadeira e senta; o líder também caminha até a reunião. Para levantar, use **E**, WASD, setas ou clique no chão. Você também pode clicar na cadeira ou usar **Sentar na minha cadeira**.

A sexta sala é a **Sala de descanso**, na ala inferior: quatro conjuntos de sofás, café, mesas e uma poltrona exclusiva para você. Colaboradores em pausa vão até lá e retornam aos setores ao retomar o trabalho. A reunião geral tem prioridade sobre a pausa; ao encerrar, quem ainda estiver em pausa volta ao descanso.

Detalhes e referências: [Tema e reuniões v0.6](docs/TEMA-REUNIOES-V0.6.md) e [Cadeiras e descanso v0.7](docs/CADEIRAS-DESCANSO-V0.7.md).

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
- **Clique em um terminal ou colega:** ir até ele e interagir ao chegar.
- **E ou botão de interação:** usar o objeto ou conversar com o colega próximo.
- **1–5:** caminhar até a sala correspondente.
- **Mapa e controles / Ctrl+K:** escolher um destino; zoom também fica nesse menu recolhido.
- **Esc:** cancelar o deslocamento ou fechar um diálogo.
- **?:** guia.
- **Celular:** setas de toque, câmera acompanhando o personagem e botão de interação.

Aparência, nome, posição e salas visitadas são salvos. Na primeira migração para o novo mapa, somente a posição e a descoberta dos locais são reiniciadas; sua equipe, missões e identidade são mantidas.

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
