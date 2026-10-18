# Clique direto e sala do administrador · v0.11

Atualização de planta: o mapa compacto mede 1200 × 900. A sala do administrador agora fica ao lado do descanso, na mesma fileira, eliminando a ala inferior separada. As descrições da implantação original abaixo são históricas; ao migrar dessa planta, o jogador volta à entrada segura e mantém identidade, visitas e missões.

- Clique no personagem Codex ou na mesa dele: o chat de liderança abre imediatamente, sem mover o jogador.
- Computadores e colaboradores também são clicáveis sem deslocamento. A mesa de reunião abre sua gestão, sem convocar ninguém automaticamente.
- Em **Mapa e controles**, selecione uma sala para acessar suas ferramentas diretamente. Clicar no chão continua fazendo o personagem caminhar; WASD, setas, **E** e as cadeiras permanecem disponíveis.
- A sétima sala, **Administrador**, fica em uma nova ala abaixo do descanso, com porta, mesa de dois monitores e cadeira própria. A reunião e os 25 lugares de descanso não foram deslocados.
- A mesa do administrador abre **Desenvolvimento**: mesmo Codex configurado, conversa, código, missões, arquivos e terminal. É uma localização adicional para o mesmo trabalho, não outra conta ou executor.
- Você pode selecionar outras funções na mesa sem sair da sala do administrador. **Gestão da sala** oferece atalhos para código, chat, missões, terminal, líder, conexões e contexto.
- Abrir uma mesa não chama uma IA, não executa comandos e não muda os limites. Enviar conversas, missões e comandos continua exigindo confirmação e autenticação. Visitantes veem a sala, mas não suas ferramentas privadas.
- Visitas físicas continuam registradas como exploração; acesso remoto por clique não teleporta o personagem nem registra uma visita física fictícia. Posições e visitas antigas são preservadas; os novos limites do mapa permitem salvar o jogador na sala nova.

Validação: `npm run check`, `npm test` e `tests/browser-admin.cjs`. O teste no navegador verifica clique no Codex sem movimento, acesso à mesa pelo mapa, histórico compartilhado, missão de desenvolvimento sem envio automático, comando real de sintaxe, cadeira acessível, layout móvel e bloqueio de visitantes. Chamadas de IA são substituídas por provedores de teste, sem cobrança.
