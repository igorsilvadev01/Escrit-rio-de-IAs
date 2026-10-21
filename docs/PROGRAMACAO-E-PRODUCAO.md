# Firma: programação e entrada em produção

Pesquisa e inspeção em 20/10/2026, sobre a versão local 0.13.0.

> A pesquisa abaixo preserva o diagnóstico anterior à implementação. As melhorias implementadas na versão 0.14, sua configuração e os limites ainda pendentes estão em [Atualização v0.14](ATUALIZACAO-V0.14.md). As referências de linhas abaixo pertencem ao código anterior à formatação.

## Parecer

A Firma já tem uma base funcional de projetos, memória, tarefas, propostas de arquivos, revisão, checkpoints e backups. O próximo avanço deve completar o caminho **tarefa → alteração de código → testes do projeto → revisão → versão publicada**. Minha recomendação é manter JavaScript/Node e o escritório atual, introduzindo melhorias por etapas.

Há dois objetivos diferentes: colocar a própria Firma em um domínio e permitir que projetos desenvolvidos nela sejam publicados. Hoje nenhum desses fluxos está completo para o uso remoto da bancada. Esta proposta cobre ambos, começando por uma instalação de um proprietário, com visitantes somente para acompanhamento. Vários administradores ou empresas independentes exigiriam outro escopo de autenticação e isolamento.

## Evidências locais

| Local | Constatação e consequência |
| --- | --- |
| `server.cjs:112–120` | `/api/company/*` e `/api/studio/*` exigem origem local e conexão de loopback. Um domínio público HTTPS bloqueia projetos, execuções e bancada, inclusive para o administrador. Hospedar sem adaptar essa política não entrega a experiência completa. |
| `server.cjs:28–46` e `workspace-projects.cjs:8–12` | `FIRMA_DATA_DIR` controla os dados privados; arquivos dos projetos ficam sob a raiz da aplicação em `projects/`. Persistir apenas a área privada deixa os projetos fora do volume. |
| `studio.js:13` | O editor usa `textarea`. Busca, rascunhos e salvamento existem, mas não equivalem a uma infraestrutura de editor com análise de linguagem. |
| `workstation.cjs:44–56` | O terminal aceita sintaxe, testes da própria Firma e consultas Git. A opção de testes não executa automaticamente a suíte do projeto selecionado. |
| `company.cjs:47–51` | As verificações das cópias executam sintaxe, testes Node e scripts Node cadastrados. Não há preparação geral de dependências, build de aplicações ou navegador de testes. |
| `company.cjs:58–64` | O contexto enviado tem teto de 45 mil caracteres, com arquivos completos; a proposta retorna conteúdo completo e até 20 arquivos por rodada. Isso limita tarefas maiores. |
| `workspace-projects.cjs:4–14` | A lista de formatos aceita código/documentação, mas impede vários arquivos de infraestrutura, como YAML e Dockerfile, e diretórios ocultos. Precisamos de permissões específicas para configurações, preservando a proteção de segredos. |
| `server.cjs:24,39–40,95–102` e módulos de persistência | Há JSON local e gravações síncronas, sessões e execução ativa na memória. A primeira implantação deve ter uma única instância. Não medi desempenho nem determinei um limite de usuários. |
| `package.json` e arquivos versionados | Existem check de sintaxe, testes Node e jornadas de navegador. Não há workflow de CI, manifesto Docker ou dependências de QA fixadas no repositório. |
| `README.md` | Ainda mistura descrições atuais com afirmações antigas como “nenhuma IA externa está conectada”. Isso precisa ser alinhado ao guia atual antes da entrega. |

Validação executada: **`npm run check` aprovado; `npm test` com 75 testes aprovados, zero falhas**, em Node 22.18.0. Não executei as jornadas Playwright, chamadas pagas, login real de provedores, teste de carga ou implantação externa. A análise não acessou credenciais da instalação.

## Melhorias de programação, em ordem de impacto

### 1. Executor capaz de validar projetos reais

Criar perfis de projeto com instalação de dependências, lint, verificação de tipos, testes e build. Primeiro suportar JavaScript/TypeScript; outras linguagens entram depois. Os comandos devem ser definidos e autorizados pelo proprietário e executados em ambiente separado do processo que guarda login e credenciais.

Sugestão: um worker com ambientes descartáveis por execução, limites de CPU/RAM/tempo/saída, usuário sem privilégios e acesso apenas aos arquivos daquela tarefa. Preparação de dependências usa rede controlada; testes sem necessidade de internet devem rodar sem rede. Não montar credenciais nem o socket Docker no ambiente que executa o código do projeto. Contêineres exigem configuração e não garantem isolamento absoluto.

O Permission Model existente continua útil como proteção adicional. A documentação do Node 22 deixa claro que ele não é uma fronteira de segurança contra código malicioso. Portanto, retirar o bloqueio de acesso remoto depende dessa separação, além de autenticação. [Node 22 — permissões](https://nodejs.org/docs/latest-v22.x/api/permissions.html), [Docker — seccomp](https://docs.docker.com/engine/security/seccomp/), [Docker — limites de recursos](https://docs.docker.com/engine/containers/resource_constraints/).

Aceite: um projeto com dependências instala versões do lockfile, executa seus próprios testes/build, registra código de saída e evidências, e não acessa dados privados da Firma. Falhas impedem promover aquela versão como validada.

### 2. Versionamento Git por tarefa

Adicionar importação de repositório, branch por tarefa, comparação por linhas e commit vinculado à entrega. Depois, integrar abertura de PR. Worktrees podem substituir ou complementar as cópias atuais quando o projeto tiver Git; não são uma sandbox. Preservar checkpoints e tratamento explícito de conflitos.

O Git oferece múltiplas árvores de trabalho ligadas ao mesmo repositório. Para a Firma, a vantagem proposta é rastrear tarefa, alteração e versão entregue de forma verificável. [Git — worktree](https://git-scm.com/docs/git-worktree).

Aceite: alterações de duas tarefas ficam separadas; integração detecta conflitos; a entrega identifica exatamente seu commit. Nenhuma alteração direta no código que está servindo a Firma em produção.

### 3. Editor de código especializado

Avaliar **CodeMirror 6** como primeira opção para manter a interface personalizada e o uso móvel; fazer uma prova curta antes da escolha definitiva. Comparar com **Monaco** se a prioridade for desktop, recursos de JavaScript/TypeScript e diff. Monaco declara que não suporta navegadores móveis. Extensões do VS Code não passam a funcionar automaticamente por usar Monaco. [CodeMirror — projeto oficial](https://github.com/codemirror/website/blob/main/site/index.html), [Monaco — documentação oficial](https://github.com/microsoft/monaco-editor#readme).

Entregar destaque de sintaxe, indentação, desfazer/refazer, diagnósticos, atalhos e diff por linhas, mantendo proteção de conflito e recuperação dos rascunhos. Autocompletar avançado de todas as linguagens depende de serviços adicionais.

Aceite: abrir, editar, salvar e recuperar arquivos sem perda de conteúdo; preservar Ctrl+S/Ctrl+P; navegação por teclado e edição móvel verificadas.

### 4. Organização e análise do código da própria Firma

Formatar arquivos de forma consistente e separar rotas, autenticação, persistência e execução em módulos com contratos claros. Hoje vários módulos têm funções extensas comprimidas em poucas linhas. Fazer isso em mudanças pequenas, preservando os testes.

Introduzir JSDoc e verificação de tipos gradualmente com `allowJs`/`checkJs`, começando pelos dados de tarefa, projeto, execução e respostas de API. Migrar módulos para TypeScript conforme trouxer benefício. Não é necessário trocar todo o frontend para entregar produção. [TypeScript — checkJs](https://www.typescriptlang.org/tsconfig/checkJs.html).

Aceite: novos contratos e módulos modificados passam na análise estática; os testes de migração de dados e permissões continuam aprovados.

### 5. CI reproduzível e contexto melhor para as IAs

Fixar ferramentas de desenvolvimento e versões em lockfile, adicionar scripts para as jornadas principais e executar no GitHub Actions: sintaxe, análise estática, testes e navegador. Os scripts atuais são executáveis Node independentes; devem ser chamados explicitamente ou adaptados, pois `playwright test` não os descobre como estão. Guardar capturas e logs em falhas. [Playwright — CI](https://playwright.dev/docs/ci).

Para as tarefas de IA, selecionar arquivos relevantes, resumir evidências e aplicar alterações estruturadas com verificação da base, em vez de depender sempre do reenvio integral do projeto. Manter briefing, decisões aprovadas e limites registrados. Avaliar qualidade com algumas tarefas fixas do próprio projeto antes de trocar modelos ou ampliar autonomia.

Aceite: um checkout limpo reproduz as verificações; uma falha real bloqueia o pipeline; tarefas maiores não precisam enviar indiscriminadamente todos os arquivos. Testes com substitutos continuam separados da validação real de cada provedor.

## Opções de hospedagem

As opções abaixo são avaliações de adequação à arquitetura, não benchmarks ou cotações. Preço final depende de região, recursos, disco, backups e uso das IAs.

| Opção | Quando faz sentido | Condições para a Firma |
| --- | --- | --- |
| **VPS Linux + Caddy + aplicação e worker separados** | Minha preferência se a Firma vai executar builds/testes variados continuamente. Dá controle sobre processos, volumes e isolamento. | Exige administrar atualizações, firewall, backups e monitoramento. Caddy pode gerenciar certificados HTTPS automaticamente. Não basta hospedar o processo atual. |
| **Render com serviço Node/Docker e disco persistente** | Alternativa para reduzir o trabalho de operação da aplicação web. | O disco precisa conter todos os dados mutáveis. Discos vinculados restringem a uma instância e implicam interrupção em deploys; worker precisa de desenho compatível com a plataforma. |
| **Railway com volume persistente** | Outra alternativa gerenciada para o processo web e seus dados. | Volumes têm limitações para réplicas e redeploy; verificar permissões e viabilidade do executor. Usar worker externo se o isolamento necessário não estiver disponível. |

Fontes das características: [Caddy — HTTPS automático](https://caddyserver.com/docs/automatic-https), [Render — discos e limitações](https://render.com/docs/disks), [Railway — volumes](https://docs.railway.com/volumes/reference).

Para um primeiro piloto, manter **um proprietário e uma instância**. O JSON pode permanecer inicialmente com backups e recuperação exercitados. Avaliar banco transacional quando precisarmos de operações atômicas entre registros, consultas maiores ou concorrência; escolher SQLite ou PostgreSQL depende desse requisito. Adicionar um banco sozinho não torna os arquivos dos projetos, sessões e executores compatíveis com múltiplas instâncias.

## Sequência para liberar produção

| Etapa | Entrega concreta | Critério de conclusão |
| --- | --- | --- |
| 1. Base reproduzível | Ferramentas de QA fixadas, CI, documentação atualizada e versão Node testada e mantida | Checkout limpo passa nas verificações e jornadas de login, projeto, edição e revisão. |
| 2. Dados duráveis | Separar diretório de projetos da instalação; persistir dados privados e projetos; backup automático fora da máquina | Reinício e redeploy preservam arquivos, tarefas, chats e histórico; restaurar em ambiente vazio reproduz o trabalho. Credenciais têm procedimento protegido separado do backup exportável. |
| 3. Execução separada | Worker, perfis de verificação, isolamento e cancelamento | Build/testes do projeto rodam com recursos limitados e sem acesso às credenciais do servidor. |
| 4. Uso remoto | Política explícita para administrador remoto após a separação, mantendo CSRF, validação de origem e proteção do visitante | Pelo domínio HTTPS, o administrador edita e revisa; visitante não usa ferramentas nem recebe conteúdo privado. Testes cobrem ambos. |
| 5. Operação | Manifesto de implantação, endpoint mínimo de saúde, logs sem segredos, alerta de indisponibilidade, tratamento de falhas de disco, encerramento com prazo e retorno à versão anterior | Processo reinicia sob supervisão; manutenção não deixa tarefas pagas sendo repetidas; logs permitem diagnosticar falhas; restauração e reversão ensaiadas. |
| 6. Homologação | Cópia com dados de teste e configuração equivalente à produção | Executar a jornada completa no domínio, validar cada conexão real configurada com uso limitado e medir carga compatível com o público esperado. |
| 7. Primeira publicação | Domínio, HTTPS, configuração inicial protegida e migração conferida | A versão publicada tem identificação, dados persistentes, verificações aprovadas e procedimento de recuperação executável. |

Ao usar proxy, revisar o limitador de login: hoje ele identifica o endereço da conexão (`req.socket.remoteAddress`), que pode ser o mesmo para todos os usuários atrás do proxy. Não confiar em `X-Forwarded-For` arbitrário; configurar a fronteira de confiança e proteção no proxy. O `Host` encaminhado precisa ser compatível com `FIRMA_PUBLIC_ORIGIN`.

O desligamento já trata SIGINT/SIGTERM e tenta fechar o servidor; falta definir prazo e comportamento verificável para conexões e execuções em andamento. Sessões em memória podem continuar exigindo novo login após reinício no piloto, desde que isso seja comunicado.

## Publicar projetos criados dentro da Firma

Começar com **um destino e um tipo de projeto**. Exemplo de primeira entrega: aplicação web JavaScript com build, ambiente de homologação e promoção da mesma versão para produção.

O botão de publicação deve usar um adaptador específico: mostrar destino, commit, evidências, variáveis exigidas e possível custo; guardar identificador da implantação e URL; oferecer retorno à versão anterior. Credenciais de deploy ficam separadas do contexto enviado às IAs. Publicação ocorre pelo serviço de implantação, sem entregar um shell irrestrito ao modelo.

O setor Postar hoje prepara conteúdo. Ele só deve indicar “Publicado” depois de confirmação real do destino. A aprovação de uma entrega e sua publicação são eventos distintos.

## Primeiro conjunto de trabalho recomendado

Começar por **CI e contratos de código, separação dos dados mutáveis e perfil de testes/build por projeto**. Em seguida, separar o executor, habilitar a bancada remota e preparar homologação. Editor e integração Git podem evoluir em paralelo ao longo dessas entregas, sem virar condição para iniciar o piloto.

Este relatório é uma proposta pesquisada. Nenhuma mudança funcional, assinatura de hospedagem ou publicação externa foi executada nesta análise. Hospedagem/domínio disponíveis, orçamento e público esperado ainda precisam ser definidos para fechar a configuração final.
