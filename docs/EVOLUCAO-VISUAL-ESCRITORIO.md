# Evolução visual do escritório

Pesquisa de 18/10/2026, aplicada na Firma 0.13. As seções de diagnóstico e proposta preservam a análise anterior à entrega. A análise original considerou o código e uma captura local de QA; as imagens não representam dados da empresa do proprietário.

## Entrega aplicada

- Chão em cache, materiais e tapetes por setor; monitores e quadros com desenhos próprios da função. Postos vazios permanecem visíveis e alcançáveis, com equipamentos visualmente inativos.
- Móveis, árvores e pessoas na mesma ordenação de profundidade; seleção respeita os objetos em primeiro plano. Sombras coerentes com a base e iluminação quente opcional.
- Personagens com cores de pele, cabelo e acessórios variados, caminhada direcional e poses de digitação, leitura, espera, conversa e café. As rotinas locais de encontros e pausas foram mantidas.
- Modos **Ambiente** e **Trabalho**, rótulos condicionais e nomes com prevenção de sobreposição. Um aviso de revisão, bloqueio ou erro abre a tarefa correspondente do projeto selecionado. Visitantes não recebem ações ou textos privados.
- Contorno ao apontar, cartão com nome e ação e lista **Cenário e equipe**, utilizável por teclado e toque. A lista e os avisos acompanham a troca de projeto.
- Câmeras **Ver tudo**, **Seguir** e **Minha mesa**, com zoom lembrado. O enquadramento tenta alinhar a escala aos pixels quando isso não compromete o tamanho útil da cena.
- Preferências locais de madeira, tapete, plantas, luminárias e iluminação. Redução de movimento local soma-se à preferência da empresa e do sistema.
- Som sintetizado de ambiente e pássaros, desligado por padrão, com volume independente e ativação por ação explícita. Não usa arquivos externos nem provedores; ao sair da aba, o áudio é suspenso.

Limites da entrega: animações são representações da simulação, não prova de execução de IA. O cenário mantém a planta aberta de 720 × 480 e não acrescenta colaboração automática entre provedores. Preferências deste navegador não fazem parte do pacote de backup do servidor. Personagens e objetos usam arte original no Canvas; não há dependência de sprites ou fontes baixados da internet.

Validação: sintaxe dos módulos, testes automatizados e jornadas de navegador para profundidade, clique em tarefas, isolamento por projeto, persistência visual, movimento reduzido, áudio opt-in, controles móveis, navegação, 24 postos e abertura/fechamento. Em uma execução local de QA, o tempo médio medido de desenho foi aproximadamente 1,4 ms; esse número é específico daquela máquina e cena, não uma garantia de FPS nem uma comparação com a versão anterior. Capturas: `artifacts/firma-scene-ambient.png`, `artifacts/firma-scene-work.png` e `artifacts/firma-scene-mobile.png`.

## Direção recomendada

Um **estúdio de programação em uma vila**, com madeira, verde, luz quente e personagens em pixel art. A melhoria deve tornar o escritório mais convincente e facilitar reconhecer pessoas, setores e trabalho pendente.

Preservar as escolhas já feitas: planta compacta, setores juntos, ausência de paredes, sua mesa ao lado de Codex e um pequeno café. A proposta concentra o investimento em arte, profundidade, animação e interação dentro do espaço atual de 720 × 480.

## Diagnóstico do cenário atual

Estas observações vêm da implementação, não de um teste de preferência com usuários:

- **Setores muito semelhantes.** `village-renderer.js` usa o mesmo desenho de mesa e a mesma cor de monitor para os postos dos quatro setores. As placas fazem grande parte da identificação.
- **Profundidade incompleta.** `app.js` desenha o cenário com móveis e árvores antes dos personagens. A ordenação vertical posterior compara personagens entre si, sem incluir os móveis. Isso pode fazer uma pessoa aparecer à frente de um objeto quando deveria estar atrás.
- **Repetição de postos vazios.** `world.js` reserva seis mesas por setor mesmo quando a equipe é pequena. É uma capacidade útil, mas a ocupação visual pode parecer artificial.
- **Informação distribuída.** Nomes, placas, marcadores, balões e quadros da interface disputam espaço em uma área pequena. O problema cresce com 24 funcionários.
- **Pouca diferenciação nas ações.** A mesma base de personagem representa caminhar, sentar e trabalhar com alterações pequenas. Falta distinguir visualmente digitar, ler, aguardar e conversar.
- **Zoom e câmera merecem revisão.** Já há controle de zoom e foco da bancada. Escalas fracionárias podem produzir pixels de larguras diferentes; vale comparar nitidez e enquadramento em telas reais antes de escolher novos padrões.

## Referências e como aproveitar

**Gather:** recomenda tornar claros os caminhos e objetos interativos e diferenciar equipes por elementos do ambiente. Para a Firma, isso sugere tapetes discretos, postos reconhecíveis e realce ao apontar. O artigo consultado é do Gather Classic; a aplicação dessas ideias ao nosso jogo é uma proposta de design, não uma integração. [Boas práticas de escritórios virtuais](https://support.gather.town/articles/3513901174-best-practices-in-office-design).

**Factorio:** o relato dos próprios desenvolvedores mostra como objetos altos, contrastes fortes e movimento constante competem pela atenção. Também discute remover indicadores redundantes e modular efeitos conforme a distância. Para a Firma, sugiro dois modos de visualização: um cenário limpo e uma visão operacional com indicadores. [Processo de redesign e redução de ruído visual](https://www.factorio.com/blog/post/fff-351).

**Xbox Accessibility Guidelines:** as orientações cobrem pistas por mais de um canal, objetivos consultáveis e controle sobre distrações. Aplicação proposta: ícone acompanhado de texto, indicação clara da próxima ação e opção de reduzir efeitos. Cor ou animação sozinhas não devem comunicar uma falha. [Pistas visuais e sonoras](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/103), [clareza dos objetivos](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/109), [movimento e distrações](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/117).

**Godot:** sua documentação descreve ordenação pelo eixo Y para controlar quais elementos aparecem à frente. A mesma técnica pode ser implementada no nosso Canvas; isso não exige migrar o jogo para Godot. [Ordenação visual de elementos 2D](https://docs.godotengine.org/en/stable/classes/class_canvasitem.html#class-canvasitem-property-y-sort-enabled).

## Melhorias propostas

| Prioridade | Melhoria | Aplicação concreta |
| --- | --- | --- |
| 1 | Profundidade e proporções | Ordenar móveis e personagens pela base no chão; separar chão, sombras, objetos e elementos altos; revisar proporção entre corpo, cadeira e monitor |
| 1 | Arte mais consistente | Criar um pequeno conjunto de pisos, mesas, cadeiras e plantas com contornos, luz e textura coerentes; manter madeira, oliva, creme e terracota como base |
| 1 | Identidade dos setores | Planejar com quadro e cadernos; Desenvolver com equipamentos e cabos organizados; Testar com checklist e bancada; Conteúdo com referências visuais; todos reconhecíveis também pela forma |
| 1 | Interação evidente | Contorno ao apontar ou focar, nome e ação disponíveis; seleção de pessoa ou objeto em primeiro plano; alternativa equivalente por teclado e toque |
| 2 | Personagens expressivos | Estados visuais distintos para caminhar nas quatro direções, sentar, digitar, ler, esperar, conversar e tomar café; pequenas diferenças de roupa, cabelo e acessórios |
| 2 | Estado real no cenário | Aviso discreto para revisão, bloqueio, falha ou geração; clique abre a tarefa ou execução correspondente; distinguir simulação e trabalho real |
| 2 | Câmera previsível | Ações “Ver escritório” e “Focar minha mesa”; manter contexto ao abrir a bancada; comparar zooms com boa nitidez; lembrar preferência local |
| 2 | Menos poluição de interface | Modo Ambiente com poucos rótulos e modo Trabalho com nomes, setores e alertas; detalhes completos aparecem ao selecionar |
| 3 | Iluminação e ambientação | Sombras curtas coerentes, luz quente de luminárias e pequena variação visual de expediente; manter contraste, sem escurecer a leitura |
| 3 | Personalização útil | Alguns modelos de mesa, tapete, planta e luminária; postos ocupados com identidade; expansão visual opcional conforme a equipe cresce |

As linhas da tabela são recomendações para este projeto, apoiadas nos princípios das referências. Não há evidência de que adicionar todos os efeitos aumentará produtividade; é preciso comparar o resultado em uso.

## Como imagino o resultado

Ao abrir, o escritório inteiro aparece bem enquadrado. Cada setor tem uma composição própria, sem divisórias. Seu posto e o de Codex formam o ponto de referência à direita. O café parece um canto mobiliado, com objetos proporcionais e bancos reconhecíveis.

Ao apontar para um agente, aparece seu nome e uma ação clara. Se houver entrega pendente, um símbolo de revisão leva diretamente à entrega. Sem seleção, nomes e textos secundários ficam discretos. Ao ativar a visão Trabalho, surgem os indicadores do projeto selecionado.

Estados do escritório e da empresa podem ser globais; indicadores de tarefas devem respeitar o projeto ativo e as permissões do visitante. Uma animação de digitação não comprova execução de IA. Geração sem percentual conhecido deve continuar sem barra de progresso inventada.

O cenário pode mostrar cooperação, como uma pessoa parar perto de outra. Esses encontros são animações da simulação; uma troca real entre agentes precisa de evento registrado. Sons de ambiente ficam opcionais, com controle independente e sem carregar dados de serviços externos.

## Ordem de implementação

**Entrega A — aparência:** corrigir profundidade, revisar proporções, melhorar materiais e dar identidade aos cinco setores. Comparar capturas antes/depois com a mesma câmera e a mesma equipe. É o conjunto que recomendo implementar primeiro, porque atua diretamente na insatisfação visual.

**Entrega B — presença e interação:** animações de personagens, contorno de seleção, rótulos contextuais e ligação dos alertas com tarefas. Reaproveitar os estados e eventos que já existem no servidor.

**Entrega C — conforto e personalização:** câmera, modos Ambiente/Trabalho, iluminação, áudio opcional e decoração. Aplicar depois que a leitura da cena estiver boa, para não encobrir problemas com efeitos.

## Cuidados de implementação e verificação

- Em `village-renderer.js`, separar desenho do piso, objetos, sombras e partes altas. Em `app.js`, montar uma ordem comum de desenho de objetos e pessoas. A base de cada objeto deve ser explícita: a coordenada superior do sprite não basta.
- A geometria em `world.js` deve continuar sendo a referência de desenho, colisão, clique e navegação. Ocultar uma mesa visualmente sem atualizar sua colisão criaria um obstáculo invisível. A primeira entrega pode manter todos os postos visíveis, com ocupados mais personalizados e vazios mais discretos.
- Reutilizar `activity.js` e eventos de tarefas/execuções para os indicadores. Não criar outro estado de “trabalho” que possa divergir do servidor.
- Manter uma alternativa em HTML para ações do Canvas. Foco do teclado, toque e clique precisam abrir a mesma informação.
- Validar passagem atrás e à frente de mesas, cadeiras e árvores; todas as cadeiras e estações continuam alcançáveis.
- Comparar cenas com equipe pequena e com 24 agentes, escritório aberto e fechado, desktop e celular. Evitar sobreposição de nomes e balões e manter sua mesa e Codex fáceis de localizar.
- Medir tempo de quadro antes/depois no mesmo equipamento; desenhar piso estático em cache é uma opção. Só aumentar efeitos se o desempenho observado permitir.
- Testar movimento reduzido e desligamento de sons. Não adicionar chamadas a provedores para produzir animações, diálogos ambientes ou indicadores.

O primeiro passo técnico não exige alterar o backend nem trocar a stack. Uma direção de arte mais consistente pode ser feita com desenhos do Canvas ou um conjunto pequeno de sprites originais, conforme o resultado visual desejado.
