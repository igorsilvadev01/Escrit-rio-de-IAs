# Firma v0.5 — o escritório é a interface

## Organização aplicada

O pedido de quatro salas de produção e uma sala adicional para o líder foi implementado como cinco ambientes físicos. A tela principal fica dedicada ao mapa. Restam apenas identificação da sessão, saída, indicadores discretos de produção, interação contextual e navegação/zoom recolhidos. Os antigos menus laterais, cartões de missão, estatísticas e botões externos foram removidos do HTML.

| Ambiente | Função | Ferramentas no terminal |
| --- | --- | --- |
| 01 · Planejar | Pesquisa, escopo e design | Missões de planejamento, contexto e especialistas |
| 02 · Desenvolver | Construção da solução | Fila de desenvolvimento e responsáveis |
| 03 · Testar | Verificação e qualidade | Missões de teste, critérios e revisão |
| 04 · Postar | Preparação de divulgação | Rascunhos, checklist e aprovação de postagem |
| 05 · Líder — Codex | Direção e coordenação | Fluxo completo, próximo passo, contratação, realocação, personagem, preferências, histórico e backups |

Os agentes antigos recebem uma sala inferida da especialidade: pesquisa/design/projetos em Planejar; programação em Desenvolver; análise/dados/qualidade em Testar; conteúdo/divulgação em Postar. Nomes, instruções, experiência e tarefas antigas são preservados. A sala pode ser alterada no diálogo individual do agente. Novas contratações permitem escolher a sala; cada sala recebe até seis especialistas.

O fundador continua sendo o personagem controlado pelo usuário. Codex é um personagem separado na sala do líder e representa a coordenação do jogo. Não é uma conexão com o Codex, ChatGPT ou qualquer modelo externo. Suas sugestões usam o estado das filas e regras locais.

## Fluxo de trabalho

Ao dar um objetivo ao líder, a simulação gera quatro missões:

`Planejar → aprovação → Desenvolver → aprovação → Testar → aprovação → Preparar postagem → aprovação`

Cada etapa recebe um especialista da sala correspondente. Uma missão só avança quando a dependência anterior foi aprovada. Se uma especialidade estiver ausente, o sistema orienta completar a equipe e não cria um plano pela metade. O limite de uma tarefa ativa por agente permanece.

Os testes e as postagens são simulados. Não há execução de testes reais, publicação em redes sociais, deploy ou acesso a contas externas. O último estágio prepara um rascunho/checklist para decisão humana.

## Referências consultadas e adaptações

- [Gather — Meeting Rooms / Private Areas](https://support.gather.town/articles/2550999600-overview-of-meeting-rooms-private-areas): espaços físicos com propósitos distintos. Aplicação: salas identificadas, portas, terminais e agentes residentes.
- [Atlassian — Work in Progress limits](https://www.atlassian.com/agile/kanban/wip-limits): visualizar carga e limitar trabalho simultâneo. Aplicação: indicadores de agentes/produção/revisão por sala e uma tarefa ativa por agente, sem um painel externo permanente.
- [Anthropic — Building effective agents](https://www.anthropic.com/engineering/building-effective-agents): separar coordenação de especialistas e incluir avaliação/feedback. Aplicação: Codex organiza um fluxo fixo e a revisão humana libera cada etapa. Não foi implementada orquestração com LLM.

Os recursos gráficos são desenhados localmente em Canvas. A geometria dos móveis e paredes é compartilhada com o cálculo dos caminhos. A câmera acompanha o personagem no zoom e aproxima a cena no celular.

## Validação

Testes cobrem as cinco salas acessíveis por portas, posições dos agentes dentro da sala correta, o plano de quatro etapas, falta de especialistas, capacidade por sala, permissões de administrador/visitante, persistência e dados privados. No navegador são exercitados o deslocamento físico, terminais, planejamento, missões por sala, revisão, contratação, personalização, backup/restauração, câmera/zoom e controles de toque.
