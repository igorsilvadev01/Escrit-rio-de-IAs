# Computadores dos setores · v0.10

## Como usar

Na v0.11, entre como administrador e clique no Codex ou em um computador para abrir a estação imediatamente, sem mover seu personagem. O menu **Mapa e controles** faz o mesmo. Caminhar e usar **E** continuam disponíveis como opção. A nova sala do administrador compartilha as ferramentas de desenvolvimento; veja [Admin v0.11](ADMIN-V0.11.md). O computador permanece dentro da cena. **Levantar**, **Esc** ou clicar novamente no piso fecha a estação.

Cada computador já seleciona a função daquela sala. Use **Código**, **Chat**, **Tarefas** e **Terminal**. **Gestão da sala** abre o quadro, os colaboradores e as ferramentas anteriores. Também é possível acessar a estação nos detalhes de uma sala ou colaborador. O histórico continua separado por função; não é uma nova conta de IA para cada personagem.

## Código em produção e arquivos salvos

**Produção da IA ao vivo** mostra os trechos realmente recebidos do provedor. Blocos de código são destacados na tela central, inclusive enquanto a cerca Markdown ainda está aberta. Missões de Codex e Gemini também alimentam essa tela durante a geração. Planos e textos sem código aparecem como texto. Uma resposta interrompida permanece identificada como incompleta; uma proposta concluída exige revisão.

**Arquivos salvos do projeto** é outro modo, somente leitura, atualizado ao salvar no VS Code. A produção da IA não é gravada automaticamente nesses arquivos. Anexar arquivo e verificar sua sintaxe só fazem sentido no modo de arquivos salvos; o terminal não valida silenciosamente outro arquivo enquanto você olha uma proposta.

Trechos parciais das missões ficam somente na memória do servidor e no endpoint privado autenticado. Não aparecem na visita pública ou no backup. Ao terminar, a entrega segue para o fluxo normal de revisão humana. Não há permissão nova para editar arquivos, executar ferramentas pela IA ou publicar.

## Animações e percentual

- Planejamento: mapa de ideias com nós conectados.
- Desenvolvimento: monitor com código e cursor.
- Testes: checklist com verificações visuais.
- Conteúdo: cartão de postagem e seta de envio.
- Liderança: coordenação de quatro pontos ao redor do líder.

As animações indicam atividade registrada, não evidência de comandos/testes/publicação executados. Chats reais também ativam seu setor e continuam acompanhados após fechar a estação. As animações novas respeitam a preferência por movimento reduzido.

O percentual de **entregas** é `prontas / total de missões do setor × 100`, arredondado. Uma entrega é pronta quando foi gerada e aguarda revisão, ou foi aprovada. Isso não é percentual de testes passando nem percentual de conclusão de um aplicativo inteiro. Missões da liderança não são contadas novamente no planejamento.

Enquanto a IA gera texto, o provedor não informa uma fração confiável do trabalho restante: mostramos **IA gerando · percentual indisponível**, com animação de atividade. Missões simuladas continuam mostrando seu progresso simulado de forma explícita. Pausa, reunião, erros, dependências e autorização pendente são diferenciados.

## Validação

`npm run check` e `npm test` incluem cálculo de percentuais, isolamento da liderança, código parcial, privacidade e streaming das missões. `tests/browser-in-game.cjs` valida chegada física ao terminal, estação não modal dentro da cena, atividade das cinco funções, código parcial do chat e das missões, continuidade ao fechar e layout móvel. Os testes usam provedores substitutos, sem créditos reais. Permanecem os limites e proteções descritos em [Bancada v0.9](BANCADA-V0.9.md).
