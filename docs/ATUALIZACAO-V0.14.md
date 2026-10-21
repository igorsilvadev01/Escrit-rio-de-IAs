# Firma 0.14 — programação e preparação de produção

Atualização local de 20/10/2026. Nenhuma hospedagem foi contratada, nenhum domínio foi configurado e nenhuma versão foi publicada externamente.

## O que mudou

| Área | Entrega |
| --- | --- |
| Editor | CodeMirror 6, destaque de sintaxe JS/TS/HTML/CSS/JSON, sugestões, indentação, histórico de edição, dobramento de código e diagnóstico JSON. Mantém rascunhos, conflitos, salvamento e atalhos da bancada. |
| Revisão | Comparação por linhas, distinguindo inclusão e remoção sem marcar todo o restante como alterado quando uma linha é inserida. |
| Projetos | Arquivos novos ficam em `.firma-private/projects/` por padrão. Projetos antigos registrados são copiados para o destino persistente na primeira inicialização; os originais permanecem intactos. |
| Configuração | Edição de Dockerfile, YAML/TOML e uma lista explícita de configurações ocultas, incluindo workflows, `.gitignore` e `.env.example`. Segredos e `.git/` continuam bloqueados. |
| Verificações | O terminal executa verificações do projeto selecionado. Instalação npm, lint, tipos, testes e build estão disponíveis pelo executor Docker. |
| Executor | Cada comando roda em um worker separado. Modo local usa as permissões do Node; modo Docker usa contêiner descartável, limites de recursos e rede desativada durante testes/build. |
| Git | Inicialização local, checkpoint, histórico, branch/worktree por tarefa e integração por fast-forward do commit validado. Importação de código de repositórios públicos do GitHub para um novo projeto. |
| Contexto de IA | Seleção explícita ou automática de arquivos, catálogo com hashes, registro do conteúdo anexado e suporte a substituições de trechos únicos. Arquivos existentes fora do contexto não podem ser sobrescritos pela proposta. |
| Backup | Agendamento a cada 24 horas, sete pacotes retidos, verificação de integridade e botão para criar um backup no servidor. |
| Pacote para publicação | Download `.tar.gz` de site estático ou `dist/`, com manifesto e hashes, após integração, verificações e aprovação. Preparação não publica. |
| Operação | Saúde/readiness, logs operacionais opcionais sem conteúdo de pedidos, prazo de encerramento e arquivos de exemplo para Docker, Caddy e systemd. |
| Qualidade | Dependências de desenvolvimento fixadas, lockfile, formatação, contratos JS verificados por TypeScript e CI para Windows/Linux, navegador e executor Docker. |

## Usar a bancada

Abra a Firma normalmente. No primeiro acesso à versão nova, encerre a instância antiga com Ctrl+C, abra `Iniciar Firma.bat` e atualize a página com Ctrl+F5. O editor vem compilado no repositório; a execução normal continua sem depender de `npm install`.

Crie um projeto próprio. Em **Projeto → Dados e ajustes → Git e histórico de versões**, inicialize o histórico. Quando houver alterações salvas, crie um checkpoint antes de preparar outra branch. Marque **Criar branch Git por tarefa** na preparação da execução para separar o trabalho. Confira a comparação e integre; a aprovação da tarefa continua na gestão.

Git é opcional. Cópias sem Git continuam funcionando. A integração não resolve conflitos automaticamente nem altera uma base que recebeu outras modificações. O backup exportável preserva conteúdo e registros; não contém o diretório `.git` nem recria as ligações de worktrees após restauração. Nos projetos restaurados, inicialize um novo histórico ou recupere o histórico pelo backup privado do sistema.

**Importar GitHub** traz o código permitido de um repositório público HTTPS para um projeto novo e inicia um histórico local. Não usa credenciais, não importa histórico remoto e não envia commits ou PRs. Diretórios privados, links, arquivos acima dos limites e credenciais reconhecidas são omitidos. Importação de repositórios privados e criação de PRs externos exigem uma integração futura com uma conta autorizada.

## Testar e compilar projetos

Em **Projeto → Dados e ajustes → Verificações do projeto**, use uma verificação por linha:

```text
syntax
node-test:tests/app.test.cjs
```

No modo Docker, um projeto npm com `package.json` e `package-lock.json` pode usar:

```text
npm-ci
npm-script:lint
npm-script:typecheck
npm-script:test
npm-script:build
```

Os scripts precisam existir no `package.json` do projeto. A instalação usa `npm ci --ignore-scripts`: pacotes que dependem de scripts de instalação, módulos nativos e ferramentas de outras linguagens precisam de uma imagem/perfil apropriado. Não há instalação automática de Python, compiladores ou navegadores nas execuções dos projetos. O CI da própria Firma instala Playwright separadamente.

Os botões de build/lint/tipos do terminal também preparam dependências em uma cópia. Arquivos e dependências dessa verificação não são instalados no projeto original. O modo local não executa npm no computador como alternativa quando falta Docker.

Para preparar Docker, instale e inicie o serviço adequado ao seu sistema e baixe a imagem escolhida explicitamente. Depois configure o processo da Firma:

```powershell
docker pull node:22-bookworm-slim
$env:FIRMA_EXECUTOR = 'docker'
npm start
```

A imagem não é baixada durante uma tarefa. `FIRMA_RUNNER_IMAGE` permite selecionar uma imagem previamente preparada; para uma implantação reproduzível, configure um digest aprovado. O contêiner recebe somente a pasta da cópia, nunca a área de autenticação ou o socket Docker. CPU: 1; RAM: 512 MB; até 96 processos; raiz somente leitura; capacidades removidas. Instalação de dependências usa `FIRMA_INSTALL_NETWORK` (padrão `bridge`); testes/build usam rede `none`. Uma rede de instalação com saída restrita precisa ser provisionada no host.

Em Linux, o UID/GID usado pelo contêiner precisa ter acesso à cópia. O padrão acompanha o usuário não privilegiado do processo da Firma, com fallback `1000:1000`. `FIRMA_RUNNER_USER` permite ajustar esse mapeamento. Para Docker rootless, um contêiner `0:0` pode corresponder ao usuário sem privilégios do daemon; confira o mapeamento e use `DOCKER_HOST` para apontar para o socket correto.

O worker de controle é um processo filho separado da aplicação. Ele ainda pertence à instalação e precisa de acesso ao daemon Docker: não é um serviço remoto independente. Prefira daemon rootless dedicado; acesso a um daemon rootful dá privilégios amplos ao serviço que o controla. O código do projeto recebe apenas o volume da cópia e comandos fixos. O modo local é destinado a código confiável e não oferece isolamento contra código hostil.

## Backups e recuperação

O backup automático é gerado enquanto o servidor está ligado e aguarda não haver execuções/operações Git em andamento. O padrão é um pacote a cada 24 horas e retenção dos sete últimos. **Criar backup no servidor** permite gerar o primeiro pacote imediatamente. Consulte data e erro no diagnóstico. Uma falha não é apresentada como backup concluído.

Se não houver um backup anterior, o agendador tenta gerar o primeiro após um minuto. Backups anteriores são conferidos ao iniciar; atrasos e falhas são tentados novamente sem esperar outro dia inteiro.

`FIRMA_BACKUP_DIR` escolhe o destino. O padrão fica na própria área privada e não protege contra perda da máquina/disco. Configure armazenamento separado e cópia externa antes da produção. O pacote exportável exclui credenciais, sessões, dependências, binários e histórico Git. Para recuperar a instalação com contas e Git, faça também backup privado protegido do diretório de dados, com o servidor parado ou snapshot consistente. Não publique esse backup.

O teste de restauração do pacote cria projetos novos, sem sobrescrever os originais. Um retorno de versão da aplicação deve preservar os dados e considerar mudanças no formato; não existe migração reversa automática.

Verificações restauradas permanecem como histórico. Uma nova preparação de pacote exige outra execução validada e aprovada no ambiente atual; os registros importados não recebem um novo selo de execução local.

## Preparação de produção

`deploy/firma.service`, `deploy/Caddyfile`, `Dockerfile` e `.env.example` são exemplos para revisão. Não são aplicados automaticamente.

A recomendação inicial é uma instância Node 22 atualizada, executada por usuário sem privilégios, com diretório de dados e backups fora da instalação. O modelo continua sendo um proprietário por instalação. Ainda não há múltiplas empresas, administradores com permissões distintas ou réplicas compartilhando os JSON.

Antes de habilitar a bancada por domínio, configure HTTPS, o executor Docker e `FIRMA_REMOTE_ADMIN=1`. Sem os três requisitos, a ferramenta não abre remotamente. Se a imagem/daemon estiver indisponível, readiness e acesso remoto falham. O código da Firma em execução fica somente leitura quando há domínio público; use CI e troca de versão para atualizar o servidor.

Exemplo de configuração futura para Node no host:

```text
FIRMA_HOST=127.0.0.1
FIRMA_PUBLIC_ORIGIN=https://firma.example.com
FIRMA_DATA_DIR=/srv/firma/data
FIRMA_BACKUP_DIR=/srv/firma/backups
FIRMA_EXECUTOR=docker
FIRMA_REMOTE_ADMIN=1
FIRMA_READ_ONLY_ROOT=1
FIRMA_TRUSTED_PROXY=127.0.0.1
FIRMA_LOG=json
```

No exemplo systemd, crie o usuário, diretórios e arquivo de ambiente com permissões correspondentes. Ajuste o serviço/UID do daemon rootless antes de habilitar a execução. Configure DNS e domínio no Caddy somente na etapa de publicação. O proxy precisa preservar Host e terminar HTTPS. `FIRMA_TRUSTED_PROXY` aceita um IP exato e só deve apontar para um proxy administrado por você; a última entrada válida de `X-Forwarded-For` identifica o cliente no limitador de login.

Se executar a aplicação em contêiner e usar o daemon no host, a pasta de cópias precisa aparecer no mesmo caminho absoluto no host e no contêiner da aplicação, porque quem resolve o bind mount é o daemon. Persistir só `/data` sem alinhar esse caminho não prepara o executor. Não monte o socket do daemon nos contêineres que executam projetos. O Dockerfile não habilita administração remota nem conecta contas sozinho.

`GET /healthz` informa processo vivo; `GET /readyz` informa disponibilidade operacional mínima. Os endpoints não expõem caminhos ou credenciais. `npm run health` retorna código diferente de zero quando readiness falha. Configure um monitor externo para alertas: nenhum serviço de monitoramento foi contratado ou conectado nesta atualização. Os sinais SIGINT/SIGTERM interrompem execuções e encerram conexões com prazo. Sessões em memória exigem novo login após reinício.

## Preparar um site para publicar depois

Depois de integrar, verificar e aprovar uma tarefa, abra sua execução e escolha **Preparar pacote do site**. Selecione os arquivos estáticos do projeto ou `dist/` de um build realizado na cópia. A preparação bloqueia versões cujo código do projeto mudou desde a validação. O arquivo contém hashes, critérios executados e commit quando houver Git.

O pacote é específico para sites estáticos. Não publica o backend da Firma nem configura serviços Node de outros projetos. Estados “Publicado” e URLs externas não são inventados. Um adaptador para hospedagem, criação de PRs e promoção remota de versões permanece fora desta entrega sem publicação.

## Verificações reproduzíveis

```powershell
npm ci
npm run verify
npm run test:browser
```

Em um ambiente com Docker e imagem preparada:

```powershell
npm run test:docker
```

`verify` cobre sintaxe, contratos tipados, formatação, bundle do editor e testes Node. As jornadas de navegador verificam os fluxos com dados temporários; no Windows usam o Chrome/Edge instalado quando não há Chromium do Playwright. Para instalar o navegador de QA: `npx playwright install chromium`. O CI também testa o executor Docker em Linux. As verificações locais não executam workflows hospedados no GitHub.

O executor Docker e o Dockerfile precisam da validação real em uma máquina com daemon disponível; não foram executados neste computador Windows sem Docker. Modelos reais, repositórios externos e hospedagem também não foram acionados nos testes. As integrações de IA usam substitutos de protocolo para não consumir contas/créditos do proprietário.

Resultado local desta entrega: instalação reproduzida com `npm ci`, análise de sintaxe, contratos tipados, formatação e bundle aprovados; **89 testes Node e 13 jornadas de navegador aprovados** no Chrome instalado. O teste opcional do executável Codex verificou somente o handshake com diretório isolado vazio, sem conta ou chamada de modelo. Os logs e capturas de QA ficam em `artifacts/`, fora do Git.
