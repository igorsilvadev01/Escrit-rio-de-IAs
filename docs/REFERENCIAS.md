# Referências aplicadas na Firma

Pesquisa feita em 17 de outubro de 2026. As decisões abaixo são adaptações para este protótipo, sem copiar interfaces ou usar marcas como se fossem integrações.

| Referência primária | Ideia aproveitada | Aplicação na Firma |
| --- | --- | --- |
| [Anthropic — Building effective agents](https://www.anthropic.com/engineering/building-effective-agents) | Decompor objetivos, encaminhar trabalho para especialistas e avaliar resultados. | Reunião que cria pesquisa → proposta → protótipo; responsáveis sugeridos por especialidade e carga; critérios de aceite e revisão. A decomposição atual é um modelo fixo, não um orquestrador com IA. |
| [LangGraph — Interrupts](https://docs.langchain.com/oss/javascript/langgraph/interrupts) | Interromper um fluxo para decisão humana e depois retomá-lo. | Entregas aguardam aprovação; pedidos de ajustes voltam à produção; dependências só avançam quando a entrega anterior é aprovada. Implementação própria, sem dependência do LangGraph. |
| [Gather — Tour of an office](https://support.gather.town/articles/2958572750-take-a-tour-of-an-office-on-gather) | Usar espaços do escritório para atividades distintas e tornar a presença compreensível. | Sala de reunião ligada ao planejamento; café ligado a pausas; quadro ligado à produção. Os botões das salas dão alternativa acessível ao clique no canvas. |
| [Factorio — Friday Facts #423](https://www.factorio.com/blog/post/fff-423) | Facilitar a consulta do estado de uma operação sem exigir deslocamento constante. | Faixa de atenção com tarefas dependentes e revisões, indicadores no mapa, status individuais e filtros do quadro. |

## Escolhas de produto

- Um agente executa uma missão por vez. A fila considera prioridade, prazo e ordem de criação.
- A energia é uma mecânica de jogo, não representa tokens, custos ou capacidade de um modelo real.
- A experiência sobe com entregas aprovadas; não é uma avaliação objetiva da qualidade do agente.
- O contexto compartilhado é copiado no momento da criação da missão, evitando que alterações posteriores mudem silenciosamente o briefing antigo.
- A conversa é demonstrativa e responde a consultas de status, fila e próximo passo com regras locais.
- A entrega exportada é explicitamente um modelo simulado, sem alegar que houve pesquisa ou implementação real.
- A navegação prioriza missão → produção → revisão → aprovação, com atalhos, busca, estados vazios e backup restaurável.

Nenhuma referência é uma promessa de capacidades disponíveis no protótipo. As conexões com provedores de IA ainda não existem.

## Evolução jogável — v0.3

Os arquivos `engine.js`, `ui.js`, `app.js` e os testes da v0.2 foram a referência principal para a evolução: o motor continua sendo a fonte de regras; os diálogos de missão, revisão, contratação e contexto foram reutilizados no cenário.

| Referência primária consultada | Ideia aproveitada | Aplicação |
| --- | --- | --- |
| [Gather — Looking & Moving Around the Office](https://support.gather.town/articles/1285650718-looking-moving-around-the-office) | Andar com WASD/setas ou mouse, aproximar-se de colegas e usar destinos do escritório. | Personagem controlável, clique para caminhar, aproximação de agentes e lista acessível de destinos. |
| [Red Blob Games — Introduction to the A* Algorithm](https://www.redblobgames.com/pathfinding/a-star/introduction.html) | Representar o mapa como grafo, bloquear obstáculos e reconstruir o caminho até o objetivo. | Implementação própria de A* em grade, margem de colisão para o personagem e passagem pela porta da sala de reunião. |

Não foram copiados sprites ou recursos visuais externos. O escritório e os personagens continuam desenhados com Canvas localmente, sem requisições a serviços de IA.

## Escritório como interface — v0.5

As referências de Gather, Kanban e coordenação por especialistas foram aplicadas à organização em quatro salas de produção e uma sala do líder Codex. O detalhamento das escolhas e das fontes está em [INTERFACE-V0.5.md](INTERFACE-V0.5.md).
