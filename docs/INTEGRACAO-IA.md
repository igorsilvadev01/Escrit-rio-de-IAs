# Próxima etapa: funcionários com IA real

O motor (`engine.js`), a interface (`ui.js`) e o mapa (`app.js`) estão separados. Isso permite trocar a produção simulada por um executor sem redesenhar o escritório.

## Contrato de execução já exportável

Ao abrir uma missão, use **Exportar briefing (.json)**. O contrato produzido por `FirmaEngine.contract(state, task)` contém:

- objetivo e instruções;
- perfil e instruções do responsável;
- formato esperado e critérios de aceite;
- cópia do contexto usado na criação;
- documento da dependência aprovada, quando existir;
- feedback das revisões;
- `mode: "simulation"` e `requiresHumanReview: true`.

Essa exportação é uma especificação de entrada. Nenhum executor real é chamado atualmente.

## Arquitetura prevista

```text
Interface e escritório 2D
         ↓ briefing / comandos
Servidor local Node.js
         ↓ fila persistente / execução com IDs estáveis
Adaptador de provedor de IA
         ↓ eventos / conteúdo / consumo informado pelo provedor
Registro da execução e arquivo entregue
         ↓
Revisão do fundador → aprovação ou pedido de ajustes
```

Antes de conectar um modelo, o backend deve passar a guardar tarefas, resultados e eventos. O `localStorage` atual serve ao protótipo de uma única página; não deve coordenar execuções reais em várias abas.

## Comportamentos necessários na futura implementação

1. Credenciais e chamadas ao provedor ficam no backend local; não salvar chaves em arquivos de backup do jogo.
2. O executor informa estados reais: na fila, executando, aguardando informação, falhou, cancelado e em revisão.
3. Percentuais do simulador são substituídos por etapas e eventos verificáveis. Tokens e custo só aparecem quando houver medição real.
4. Cada execução recebe um ID. Retentativas não devem repetir ações já realizadas sem controle.
5. A aprovação libera dependências, mas não autoriza automaticamente publicação, envio de mensagens ou alteração de arquivos externos. Essas ferramentas precisam de controles próprios ligados à ação concreta.
6. A tarefa fornece o contexto capturado e o resultado aprovado da dependência; o histórico permite reproduzir a entrada usada em uma execução.
7. Pausas e energia do personagem permanecem uma camada opcional do jogo. Não podem interromper silenciosamente chamadas reais nem determinar a qualidade de uma entrega.

## Limite atual

O servidor só entrega arquivos estáticos. Não há endpoint de execução, acesso ao sistema de arquivos do usuário, chamadas a provedores, pesquisa automática, conversa livre nem trabalho em segundo plano. As entregas atuais documentam o fluxo de simulação.
