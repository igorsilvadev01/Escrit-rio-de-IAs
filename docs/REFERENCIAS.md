# Referências aplicadas na Firma v0.2

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
