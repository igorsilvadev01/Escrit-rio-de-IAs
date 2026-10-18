# Cadeiras e sala de descanso

O mapa passou a 1200 × 960, mantendo as coordenadas das quatro salas de produção e o login existente. A sala do líder foi ampliada horizontalmente; uma nova ala inferior abriga o descanso. Câmera, limites de movimento, navegação e migração do personagem usam a área ampliada.

## Reunião

- Há 24 lugares para colaboradores e duas cadeiras reservadas, uma para o jogador e outra para Codex.
- Ao convocar pelo painel do líder, o diálogo fecha e o jogador caminha até sua cadeira. Codex percorre um caminho com colisões e senta no outro lado da mesa.
- As poses sentadas têm pernas recolhidas. Colaboradores também sentam quando chegam aos lugares.
- O jogador pode sentar novamente clicando na cadeira, usando E por perto ou escolhendo **Sentar na minha cadeira**.
- E levanta. Caminhar por teclado, toque ou clique também levanta. Encerrar a reunião libera o jogador e faz Codex voltar ao escritório.

## Descanso

- Quatro ambientes de convivência, 24 assentos de equipe e uma poltrona para o jogador.
- Balcão de café, mesas, tapetes, plantas e passagens livres.
- Colaboradores em pausa manual ou automática caminham até seus lugares e sentam. Quem retoma o trabalho volta ao setor.
- A recuperação de energia continua sendo uma regra da simulação, não depende da animação ou de uma aba aberta. Pausas manuais exigem retomada pelo administrador; as automáticas terminam em 85%.
- A reunião geral tem prioridade e preserva o estado de pausa. Quem continuar em pausa após a reunião retorna à sala de descanso.
- O mapa e os controles incluem o destino **Descanso**. O painel mostra a equipe em pausa e permite acessar a poltrona.

Não há nova conta, integração externa ou publicação. Credenciais privadas não são alteradas. Visitantes podem explorar e sentar com seu personagem local, sem modificar o estado administrativo.

## Verificação

`npm run check`, `npm test` e testes de navegador de reunião/descanso, salas e autenticação, com servidor e credenciais temporários. Os testes de caminhos verificam os 26 destinos de reunião e os 25 de descanso. O teste de navegador cobre ida e retorno de 24 colaboradores, Codex, jogador, sentar/levantar e celular.
