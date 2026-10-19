# Pesquisa de evolução da Firma

Pesquisa realizada em 18/10/2026. A Firma 0.12 implementa a primeira entrega das 16 frentes abaixo. As seções de pesquisa preservam a proposta original; o quadro a seguir registra o que está disponível e as extensões condicionadas. Uso e limites: [Capacidades atuais](CAPACIDADES-ATUAIS.md).

## Implementação na versão 0.12

| Frente | Entrega disponível |
| --- | --- |
| 1 · Projetos | Seletor global, tarefas e conversas por projeto, objetivo, equipe e arquivos vinculados à entrega |
| 2 · Planos | Etapas editáveis antes do início, responsáveis, critérios e dependências com aprovação |
| 3 · Memória | Registros por projeto, origem, data, aprovação, edição e remoção; contexto antigo preservado |
| 4 · Autonomia | Modos manual, assistido e delegado; autorização, cancelamento, limites e integração revisada |
| 5 · Retomada | Estados persistidos e interrupções identificadas; nenhuma repetição automática de chamadas |
| 6 · Cópias | Arquivos por execução, comparação, checkpoints, conflitos e reversão em falha de gravação; worktrees ficam como extensão |
| 7 · Evidências | Sintaxe JavaScript, testes Node e scripts cadastrados com saída real; ferramentas externas exigem executor adicional |
| 8 · Limites | Cotas por projeto e gerais, rodadas, tempo e executor compartilhado; consumo conhecido sem preço inventado |
| 9 · Eventos | Caixa de entrada com revisões, dependências, erros, histórico e atalhos |
| 10 · Backup | Pacote completo com hashes e prévia; restauração em cópias e pacote de segurança; JSON mantido, SQLite condicionado ao volume |
| 11 · Cenário | Falas de trabalho derivadas das tarefas, conversas sociais opcionais e movimento reduzido |
| 12 · Progressão | Primeiros passos, marcos por entrega, contagem por especialidade de aprovações com verificações e detalhes visuais desbloqueáveis |
| 13 · Ferramentas | Contratos locais por especialidade, propostas de arquivos validadas e registro de ações; pesquisa e publicação externas permanecem sem integração |
| 14 · Modelos locais | Adaptador Ollama para modelos já instalados, seleção por função e diagnóstico de RAM; instalação e benchmark dependem do hardware |
| 15 · Avaliação | Registros comparáveis de execuções, evidências, consumo, duração e diagnóstico; testes reproduzíveis sem contas reais |
| 16 · Organização | Módulos de projetos, execução, backup, contratos e interface; guia atual separado de documentos históricos |

Validação desta entrega: `npm run check`, 72 testes automatizados e jornadas de navegador para projetos, gestão e bancada. Provedores foram substituídos por respostas de protocolo nos testes; isso não mede qualidade real de modelos. As cópias com permissões do Node não constituem uma sandbox de sistema operacional para código hostil. Os detalhes estão no guia atual.

## Direção recomendada

Evoluir a Firma para um escritório local em que cada projeto reúne objetivo, equipe, conversas, tarefas, arquivos e entregas verificáveis. O cenário 2D deve mostrar o andamento desse trabalho e oferecer atalhos para agir. A planta continua compacta; as melhorias devem reduzir o esforço de administrar o escritório.

As recomendações abaixo são uma avaliação para este repositório, a partir da leitura do código e da documentação e das fontes indicadas. As fontes oferecem padrões e exemplos, não comprovam que uma biblioteca específica seja necessária para a Firma.

## Situação observada antes da versão 0.12

- Escritório compacto com personagens, cadeiras, café, horários e rotinas locais.
- Gestão com criação de tarefas, responsáveis, dependências e aprovação de entregas.
- Conexões Codex e Gemini, chats individuais e limite diário compartilhado de chamadas.
- Bancada com projetos e arquivos locais, edição, comparação, prévia, prompts e terminal restrito.
- Recuperação de rascunhos no navegador e opções de salvamento e verificação de sintaxe automáticos.

As lacunas mais relevantes são: tarefas e conversas ainda não formam um histórico completo por projeto; a memória da empresa é um texto compartilhado; os agentes propõem conteúdo, mas não dispõem de um ciclo geral de execução de ferramentas; backups do escritório não incluem automaticamente todos os arquivos e históricos da bancada.

## 1. Projeto como centro de tudo — prioridade imediata

**Proposta:** associar tarefas, conversas, documentos, versões e execuções ao mesmo `projectId`. Cada projeto teria objetivo, pasta de trabalho, equipe, contexto e critérios de conclusão próprios.

**Exemplo:** ao abrir “Meu aplicativo”, aparecem somente suas tarefas, conversas e arquivos. Uma pergunta feita à Luna nesse projeto não usa automaticamente o histórico de outro cliente.

**Entrega mínima:** seletor global de projeto; abas Resumo, Trabalho, Equipe e Entregas; migração dos registros existentes para “Escritório geral”; links entre uma tarefa e os arquivos produzidos.

**Como verificar:** criar dois projetos, conversar com o mesmo agente e confirmar que filtros, histórico e contexto permanecem separados. Conversas gerais continuam disponíveis por escolha explícita.

**Base:** a organização de sessões e rastreamentos por interação é uma referência útil para essa estrutura. [Langfuse — Sessions](https://langfuse.com/docs/observability/features/sessions).

## 2. Plano de trabalho editável — prioridade imediata

**Proposta:** transformar um objetivo em etapas pequenas, com responsável, dependências, resultado esperado e critério verificável de conclusão. O usuário edita o plano antes de iniciar.

**Exemplo:** “Criar uma página para minha loja” gera pesquisa, estrutura, implementação e validação, mostrando qual etapa pode começar e qual aguarda outra entrega.

**Entrega mínima:** aproveitar o fluxo atual de quatro etapas, mas permitir renomear, acrescentar, remover e reatribuir etapas. Começar com regras previsíveis; usar planejamento por IA quando ele trouxer benefício demonstrável.

**Como verificar:** uma etapa dependente só começa quando as condições registradas foram cumpridas; uma alteração no plano fica no histórico.

**Base:** encadeamento de etapas e coordenação por um responsável central são padrões documentados para sistemas de agentes. [Anthropic — Building effective agents](https://www.anthropic.com/engineering/building-effective-agents).

## 3. Memória aprovada por projeto — prioridade imediata

**Proposta:** separar informações em objetivo, decisões aprovadas, requisitos, dúvidas e referências. Cada informação deve indicar origem e data; o usuário pode corrigir ou remover registros.

**Exemplo:** a decisão “o aplicativo precisa funcionar no celular” passa a acompanhar as próximas tarefas daquele projeto sem copiar a conversa inteira.

**Entrega mínima:** usar o contexto compartilhado existente como ponto de partida, dividido por projeto; manter sugestões de memória aguardando aprovação. Recuperação semântica pode entrar depois, se o volume justificar.

**Como verificar:** uma resposta usa somente o contexto selecionado e permite localizar a decisão que o fundamentou; instruções antigas podem ser substituídas sem alterar silenciosamente tarefas já criadas.

## 4. Autonomia com escopo definido — prioridade alta

**Proposta:** oferecer três modos por tarefa:

| Modo | Comportamento proposto |
| --- | --- |
| Manual | A IA explica e propõe; o usuário executa. |
| Assistido | A IA prepara mudanças e verificações para revisão. |
| Delegado | Executa um plano autorizado, dentro da pasta, ferramentas e limites daquela tarefa. |

O modo delegado precisaria de ferramentas reais, limite de rodadas, cancelamento e condições de parada. Exemplo de autorização: trabalhar na cópia do projeto, fazer no máximo três rodadas de correção e usar apenas os comandos de validação cadastrados. O custo monetário só pode ser apresentado como estimativa quando houver dados suficientes do provedor.

**Como verificar:** o executor para ao atingir limite, bloqueio ou conclusão; não amplia a pasta ou as ferramentas por conta própria. O painel diferencia ações propostas, tentadas e concluídas.

**Base:** fluxos com intervenção humana e interrupções explícitas ajudam a definir os pontos de decisão. [AutoGen — Human-in-the-Loop](https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/tutorial/human-in-the-loop.html).

## 5. Retomada confiável após interrupções — prioridade alta

**Proposta:** registrar o estado de cada etapa no servidor, incluindo identificador da execução, entrada, saída, arquivos envolvidos, estado e próxima ação permitida.

**Exemplo:** após fechar o programa, a Firma informa “a análise terminou; a edição ainda não começou”. Uma chamada externa de resultado incerto fica para reconciliação, sem presumir sucesso nem repetir consumo automaticamente.

**Entrega mínima:** uma máquina de estados persistida e identificadores de execução. Manter o comportamento atual de não reenviar chamadas pagas ao reiniciar, acrescentando uma interface para decidir como continuar.

**Como verificar:** interromper antes e depois de uma gravação; confirmar que não há duplicação de tarefa, arquivo ou envio. Diferenciar rascunho recuperado do navegador e execução recuperada do servidor.

**Base:** persistência e checkpoints são mecanismos usados para retomar fluxos e inspecionar estados anteriores. [LangGraph — Persistence](https://docs.langchain.com/oss/python/langgraph/persistence).

## 6. Área isolada de trabalho e checkpoints — prioridade alta

**Proposta:** cada execução de programação trabalha em uma cópia própria ou worktree, quando o projeto usa Git. Ao concluir, a Firma mostra arquivos alterados, comparação e resultado das verificações antes de integrar ao projeto principal.

**Exemplo:** Theo pode experimentar uma solução enquanto a versão aprovada continua disponível. Voltar a um checkpoint recupera o conjunto de arquivos daquela etapa.

**Entrega mínima:** primeiro uma cópia por execução e um manifesto de arquivos; depois worktrees para repositórios Git. O backup individual de arquivos existente continua útil, mas não representa sozinho um checkpoint completo.

**Como verificar:** rejeitar uma execução não altera o projeto principal; restaurar um checkpoint recupera arquivos compatíveis entre si.

**Base:** worktrees permitem diretórios de trabalho separados para mudanças paralelas. [VS Code — Branches and worktrees](https://code.visualstudio.com/docs/sourcecontrol/branches-worktrees).

## 7. Validação de entregas por evidências — prioridade alta

**Proposta:** além de sintaxe, cadastrar verificações por projeto: testes funcionais, lint, build e cenários de navegador. Uma entrega mostra o comando, resultado e artefatos correspondentes.

**Exemplo:** a sala Testar apresenta “formulário enviado com sucesso”, acompanhado do teste e da captura, em vez de somente afirmar que o código parece correto.

**Entrega mínima:** catálogo explícito de verificações, execução na área isolada e relatório vinculado à tarefa. Testes de projetos executam código: isso exige o escopo de execução do item 4, além da configuração por projeto.

**Como verificar:** uma falha de teste impede classificar a entrega como validada; análise por IA e execução de teste aparecem como evidências diferentes.

**Base:** ciclos de geração e avaliação são úteis quando existem critérios claros; resultados reais de ferramentas devem informar o próximo passo. [Anthropic — Building effective agents](https://www.anthropic.com/engineering/building-effective-agents).

## 8. Limites e acompanhamento por projeto — prioridade alta

**Proposta:** ampliar a cota diária atual com limites de chamadas por tarefa, rodadas de correção, tempo e simultaneidade. Mostrar fila, duração, provedor e consumo informado pela API.

**Exemplo:** uma tarefa autorizada para três rodadas para na terceira tentativa e apresenta o bloqueio, sem continuar indefinidamente.

**Entrega mínima:** contagem por execução/projeto e um resumo de uso. Onde o provedor ou plano não fornecer preço ou consumo equivalente, exibir “não informado” e a contagem conhecida.

**Como verificar:** limites são aplicados pelo servidor; números estimados são identificados como estimativas. Nenhuma porcentagem de geração é inventada.

## 9. Central de eventos e próximos passos — prioridade alta

**Proposta:** reunir entregas para revisar, bloqueios, erros e decisões em uma caixa de entrada. Cada evento deve levar à ação correspondente.

**Exemplo:** “Maya precisa de uma decisão sobre o prazo” abre a dúvida ligada à tarefa; “teste falhou” abre o relatório.

**Entrega mínima:** expandir o histórico e a fila de revisão existentes, sem criar outro menu concorrente. Mostrar um resumo de abertura do expediente e o próximo passo do projeto ativo.

**Base:** feedback claro sobre o estado do sistema ajuda o usuário a entender o que está acontecendo. [NN/g — Visibility of System Status](https://www.nngroup.com/articles/visibility-system-status/).

## 10. Backup completo e restauração verificável — prioridade alta

**Proposta:** um pacote inclui dados do escritório, projetos, arquivos, conversas, prompts e manifestos de versão. Credenciais ficam fora por padrão. Rascunhos ainda presentes só no navegador exigem exportação explícita ou salvamento prévio.

**Entrega mínima:** mostrar exatamente o que será incluído; exportar para um destino escolhido; validar a restauração em uma pasta temporária antes de substituir dados.

**Como verificar:** restaurar em outra pasta permite abrir projetos e localizar suas entregas, com checagem de integridade. O backup não depende da presença do navegador original.

**Evolução de armazenamento:** avaliar SQLite quando os relacionamentos entre projetos e execuções justificarem transações e consultas mais estruturadas. A migração não é pré-requisito para organizar os dados. SQLite dispõe de uma API própria de backup de bancos em uso. [SQLite — Backup API](https://sqlite.org/backup.html).

## 11. O escritório como painel vivo — prioridade intermediária

**Proposta:** usar os personagens para explicar o trabalho: disponível, trabalhando, aguardando resposta, revisando e bloqueado. Balões curtos mostram eventos úteis, e um clique abre o item relevante.

**Exemplo:** Theo diz “a implementação está pronta; falta o teste”. Maya sinaliza uma falha real e abre o relatório. Conversas sociais continuam opcionais e identificadas como parte da simulação.

**Entrega mínima:** derivar os estados visuais das execuções registradas e permitir silenciar falas sociais. Manter a circulação curta e os atalhos existentes.

**Como verificar:** o personagem nunca indica conclusão sem a evidência correspondente; a animação não impede criar ou revisar trabalho. Opções de movimento reduzido e indicadores legíveis também ficam disponíveis.

**Base de interface:** aplicar o feedback do sistema ao cenário, mantendo a indicação visível e compreensível. [NN/g — Visibility of System Status](https://www.nngroup.com/articles/visibility-system-status/).

## 12. Progressão ligada a entregas — prioridade intermediária

**Proposta:** missões de introdução, marcos de projeto, reconhecimento por entregas aprovadas e decoração desbloqueável opcional. Evolução dos funcionários mostra experiência comprovada por tipo de tarefa.

**Exemplo:** concluir e validar a primeira página libera um marco visual na mesa; produzir mais mensagens não gera uma recompensa por si só.

**Como verificar:** o jogo recompensa resultados definidos e permite trabalhar sem cumprir atividades decorativas. Energia e pausas simuladas não devem confundir a disponibilidade real dos provedores.

Esta é uma proposta de produto para a Firma, que precisa ser validada com o uso cotidiano; não há evidência nesta pesquisa de que gamificação aumentará a produtividade neste caso específico.

## 13. Ferramentas por especialidade — prioridade posterior

**Proposta:** definir capacidades por função e projeto: pesquisa produz referências; desenvolvimento prepara mudanças; revisão inspeciona evidências; conteúdo prepara arquivos de divulgação.

**Entrega mínima:** contratos pequenos de ferramentas, entradas e saídas validadas e registro de uso. Começar pelas operações locais necessárias; integrações externas entram depois, quando houver uma necessidade concreta.

**Como verificar:** uma troca de provedor mantém a função da ferramenta e respeita o escopo autorizado. Uma referência de pesquisa inclui origem verificável; publicação externa permanece uma ação distinta.

## 14. Modelos locais opcionais — prioridade condicionada ao hardware

**Proposta:** adicionar um adaptador opcional para modelos locais, preservando Codex e Gemini. Reservar tarefas adequadas a esse executor após comparar a qualidade e o tempo de resposta.

**Exemplo:** organizar notas e preparar rascunhos locais enquanto a internet está indisponível. A interface deve distinguir modelo local, nuvem e simulação.

**Antes de escolher:** medir RAM, GPU/VRAM, tamanho do modelo e contexto necessário. Executar localmente evita o envio ao provedor remoto naquele fluxo, mas usa recursos do PC e não garante desempenho equivalente aos executores atuais. Ollama oferece execução local e opção de desabilitar funções de nuvem. [Ollama — FAQ](https://docs.ollama.com/faq), [suporte de hardware](https://docs.ollama.com/gpu).

## 15. Avaliação e diagnóstico do próprio sistema — prioridade contínua

**Proposta:** manter exemplos representativos de tarefas e medir conclusão, retrabalho, tempo e evidências aprovadas. Uma tela de diagnóstico mostra servidor, armazenamento, conexões, última falha e versão em uso.

**Exemplo:** comparar duas versões de um prompt com as mesmas tarefas antes de mudar o padrão para todos os agentes.

**Entrega mínima:** registros locais por execução e testes reproduzíveis. As ferramentas de observabilidade servem como referência de organização; não é necessário contratar ou instalar uma plataforma externa para começar. [Langfuse — Sessions](https://langfuse.com/docs/observability/features/sessions).

**Distinção importante:** os testes com provedores substitutos verificam a aplicação e seus controles. A qualidade das respostas reais exige avaliações separadas, com contas e orçamento autorizados.

## 16. Organização técnica e documentação — prioridade contínua

**Proposta:** separar gradualmente estado da bancada, editor, prévia, recuperação e chat em módulos; manter migrações de dados com testes; distinguir guias atuais de registros históricos.

**Motivo observado:** o repositório tem guias de versões antigas com descrições que já não correspondem ao produto atual. Isso pode levar a instruções contraditórias sobre salas, IA e armazenamento.

**Entrega mínima:** uma página de capacidades atuais e um roteiro único de abertura e diagnóstico. Extrair módulos de forma incremental, preservando o funcionamento local e evitando uma troca ampla de stack sem benefício medido.

## Sequência de implementação recomendada

| Etapa | Foco | Critério de conclusão |
| --- | --- | --- |
| 1 · Organizar | Projetos ligados a tarefas, conversas, memória e entregas; backup completo | Alternar projetos sem mistura de contexto e restaurar um projeto com seus arquivos e histórico |
| 2 · Tornar verificável | Execuções persistidas, central de eventos, verificações por projeto, limites | Uma tarefa mostra o que foi feito, o que foi validado e como continuar após uma interrupção |
| 3 · Delegar | Área isolada, ferramentas locais e autonomia limitada por tarefa | Concluir uma mudança na cópia de trabalho, validar e apresentar uma integração revisável |
| 4 · Ampliar | Feedback no cenário, progressão opcional, integrações e modelos locais | Ganho comprovado na experiência e nas tarefas reais, sem tornar a gestão mais confusa |

Recomendação de primeira entrega: **Projeto completo**. Ela cria a base para as demais melhorias e resolve a separação atual entre a gestão, as conversas e a bancada. Nenhum prazo em dias foi estimado sem decompor essa entrega e verificar sua implementação.
