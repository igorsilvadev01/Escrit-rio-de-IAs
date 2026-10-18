# Análise e evolução da Firma — v0.3

## Base encontrada

O projeto já separa regras (`engine.js`), interface de gestão (`ui.js`) e representação do escritório (`app.js`). Existem tarefas com dependências, filas por prioridade, pausa automática por energia, revisão humana, contexto por tarefa, contratação, conversa demonstrativa, importação/exportação e testes do motor. O servidor local permite somente os arquivos da aplicação.

O limite principal da experiência era espacial: o fundador não aparecia no mundo, os agentes eram essencialmente uma visualização e só três áreas do mapa tinham ação. As ferramentas de trabalho ficavam nos painéis externos. Não havia movimento do usuário, navegação com obstáculos nem identidade de personagem.

## Implementado nesta versão

- Personagem do fundador, com nome, camiseta, pele e cabelo editáveis.
- Movimento com WASD/setas, clique no cenário, controles de toque e caminhos até destinos acessíveis por botão.
- Colisão com móveis e paredes; caminhos A* passam pela porta da reunião.
- Nove espaços com ações de missão, reunião, quadro, revisão, contexto, equipe, contratação, histórico e preferências/backup.
- Aproximação de colegas para conversar, delegar e pausar agentes.
- Modo de jogo com o escritório ampliado e diálogos sobre o cenário, compartilhando o estado da gestão.
- Trilha de descoberta do escritório e contador de entregas para revisão no mapa.
- Persistência da aparência, posição e espaços visitados, compatível com saves antigos e backups.
- Foco de teclado, interrupção de movimento em diálogos e tratamento da escala/letterboxing do canvas nos cliques.
- Testes do mundo e roteiro de navegador para a experiência jogável, além dos testes de gestão existentes.

## Oportunidades seguintes

1. **Personagens e ambiente:** animações com mais direções, decoração editável e layouts maiores. O deslocamento autônomo dos agentes ainda usa a animação simples anterior; a colisão e o A* desta entrega se aplicam ao fundador.
2. **Progressão:** contratos, objetivos de negócio, reputação, melhorias e recompensas que deem propósito além de explorar o escritório. O contador de espaços visitados é uma introdução, não uma economia completa.
3. **IA executora:** conectar um provedor por um backend com credenciais no servidor, execução cancelável e acompanhamento de custos. Hoje a produção e as conversas seguem simuladas, como documentado em `INTEGRACAO-IA.md`.
4. **Escala da interface:** modularizar gradualmente o código legado mais compacto e acrescentar filtros aos quadros internos quando o volume de missões crescer.
5. **Colaboração:** definir estratégia de sincronização antes de permitir múltiplas abas ou usuários. A persistência atual permanece local e a simulação avança somente com a página aberta.

Nenhuma alteração desta versão envia dados para IA externa ou cria contas/integrações. As missões internas são as mesmas missões do painel de gestão.
