# Tema vivo e reunião geral

A interface local usa superfícies azul-marinho, texto claro e acentos ciano, azul, coral, violeta e amarelo. Salas continuam identificadas por nome e número, sem depender apenas da cor. Os estilos são locais, sem imagens ou serviços externos.

## Reunião

Na sala do Codex, clique na mesa ou converse com o líder. O comando **Reunir toda a equipe** inicia uma reunião geral persistida no servidor. Todos os colaboradores, inclusive os que estavam em pausa, recebem destinos próprios na área de reunião. Há 24 lugares distintos e caminhos com colisão; o mobiliário desenhado compartilha a geometria usada na navegação.

Tarefas não avançam durante a reunião. Progresso, energia e pausas individuais são preservados. Ao encerrar, os colaboradores voltam aos lugares de seus departamentos e a produção segue sua configuração anterior. Se a produção estava pausada, continua pausada; o deslocamento visual permanece disponível. Recarregar a página mantém a reunião ativa e desenha a equipe nos destinos atuais.

O comando é separado de **Planejar uma entrega com Codex**, que continua criando o fluxo de quatro etapas. A reunião é parte da simulação: não inicia chamadas de áudio/vídeo nem envia mensagens externas.

Visitantes acompanham a reunião, mas a API exige sessão de administrador e proteção CSRF para convocar ou encerrar. Não foram alteradas credenciais nem a hospedagem.

## Referências consultadas

- [Material Design 3 — papéis de cor](https://m3.material.io/styles/color/the-color-system): separar superfícies, conteúdo e ações com contraste e hierarquia.
- [Android Developers — tema Material 3](https://developer.android.com/codelabs/m3-design-theming): cores vivas para destacar ações relevantes.
- [Gather — reuniões](https://support.gather.town/articles/8308555684-schedule-meetings): áreas reconhecíveis de reunião no escritório virtual. A implementação aqui é própria e somente simulada.

## Validação

- `npm run check` e `npm test`.
- `tests/browser-meeting.cjs`: convocação, deslocamento, retorno, persistência, 24 lugares, produção pausada, celular e visitante.
- `tests/browser-rooms.cjs`: regressão dos cinco ambientes, tarefas, personalização, backup e controles.
- `tests/browser-auth.cjs`: regressão do acesso.

Os testes de navegador usam backend e credenciais temporários, nunca os dados reais do proprietário.
