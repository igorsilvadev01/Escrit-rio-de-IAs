# Gestão simplificada

Abra **Gestão**, no topo do jogo. Não é preciso caminhar até uma sala para administrar o escritório.

- **Visão geral:** quantidade de entregas para revisar, tarefas em aberto e concluídas, com um próximo passo sugerido.
- **Tarefas:** lista única com busca por título ou responsável, filtro por setor e situação. As dependências mostram qual tarefa precisa ser aprovada primeiro.
- **Para revisar:** entregas prontas para sua decisão. Abra o documento, aprove ou descreva os ajustes. A aprovação libera as etapas dependentes.
- **Equipe:** encontre uma pessoa pelo nome ou especialidade, delegue tarefas e controle suas pausas. Setor e instruções ficam em uma seção recolhida no perfil.
- **Ajustes e IAs:** conexões, ordens reais, planejamento, contexto, preferências, backups e histórico.

## Criar uma tarefa

Clique em **Nova tarefa**, escolha o tipo de trabalho e preencha título e explicação. O escritório sugere um responsável do setor. Prazo, prioridade, dependência, entrega esperada e critérios ficam em **Prazo, prioridade e detalhes da entrega**.

O modo padrão é a simulação local. Escolher IA real prepara a tarefa e abre a confirmação de envio; criar ou consultar tarefas não autoriza chamadas pagas automaticamente. Geração real não usa porcentagem inventada.

O botão **Gestão** nos computadores abre essa mesma organização, filtrada pelo setor. **Voltar à gestão** permite sair de detalhes sem procurar novamente o menu principal. Visitantes têm acompanhamento público, sem ações administrativas nem acesso aos briefings privados.

## Referências de interface

As soluções foram adaptadas ao escritório local, mantendo sua paleta de madeira, papel e verde:

- [NN/g — Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/): ações frequentes primeiro; detalhes especializados sob demanda. Aplicado aos formulários de tarefa, perfil e entrega.
- [NN/g — Recognition and Recall](https://www.nngroup.com/articles/recognition-and-recall/): opções visíveis reduzem a necessidade de memorizar caminhos. Aplicado ao botão Gestão e à navegação fixa.
- [Linear — Triage](https://linear.app/docs/triage): uma fila dedicada facilita identificar itens que precisam de decisão. Adaptado à fila **Para revisar**, com aprovação humana de entregas.

## Verificação

`tests/browser-management.cjs` usa um servidor isolado e provedores substitutos para verificar criação, busca, atribuição, ajustes, aprovação, persistência, delegação pela equipe, preferências, uso em celular e limites de visitantes. Não acessa os dados privados do escritório nem consome as contas de IA.
