# Bancada da Firma · v0.9

Depois de entrar como administrador, clique em **⌘ Bancada** no topo do escritório. A Bancada roda somente no servidor local; não deve ser publicada como uma IDE remota. Visitantes não recebem arquivos, chats ou saída do terminal.

## Código ao vivo

O explorador abre código e documentação deste projeto, em modo somente leitura. Salve suas alterações no VS Code para vê-las aqui em aproximadamente dois segundos. O visualizador não é um editor e as IAs não alteram arquivos automaticamente. Código proposto aparece no chat e pode ser copiado para revisão e aplicação no VS Code.

Arquivos privados, pastas ocultas, credenciais, dependências, artefatos, caminhos externos, links simbólicos, hard links e arquivos acima de 300 KB são bloqueados. O visualizador não autoriza escolher outra pasta do computador. Credenciais reconhecidas são removidas da exibição, mas isso não substitui a obrigação de não colocar segredos no código.

## Chat por função

Há conversas separadas para liderança, planejamento, desenvolvimento, testes e conteúdo. Cada uma usa o provedor/modelo configurado na Central de IAs. A configuração atual do proprietário usa Codex na liderança/desenvolvimento e Gemini nas outras funções; o adaptador Claude continua opcional, desconectado.

O Codex entrega trechos de `item/agentMessage/delta`. O Gemini usa `streamGenerateContent` com SSE. Não há digitação simulada: se o provedor demora para enviar o primeiro trecho, o painel informa que está aguardando. Somente uma conclusão válida conta como resposta concluída. Pensamento interno não é exibido.

Cada envio exige consentimento e compartilha a cota diária das missões. Não há aumento automático do limite, repetição após erro, compra de créditos ou fallback pago. O envio é bloqueado enquanto outra resposta/missão estiver em execução ou na fila. Você pode cancelar; o consumo já realizado no provedor pode permanecer.

Somente a conversa desta função é enviada. A memória do escritório e os arquivos do projeto não são anexados automaticamente. Marcar **Anexar somente o arquivo aberto** inclui esse arquivo, limitado a 24 mil caracteres. O anexo faz parte do histórico enviado nas mensagens seguintes desta conversa. O contexto total tem limite de 60 mil caracteres; limpe o histórico se necessário.

Os históricos ficam em `.firma-private/chats.json`, fora do Git, da visita pública e do backup do escritório. Limpar uma conversa remove seu histórico local e não desfaz dados já enviados ao provedor. Ao reiniciar o servidor, respostas inacabadas são marcadas como interrompidas e nunca reenviadas automaticamente. As chaves de API continuam somente em memória e precisam ser reconectadas após reinício, salvo configuração explícita por variável de ambiente.

## Tarefas

Em **Tarefas**, escolha função, colaborador, título e briefing. Sem marcar a autorização de envio imediato, a missão fica guardada sem executar a IA. Cada envio usa a configuração atual da função. As entregas continuam exigindo revisão humana; o progresso mostrado é o estado registrado da missão, não uma estimativa inventada de tokens ou tempo restante.

Uma resposta concluída pode virar rascunho de missão usando **Criar missão a partir disto**. Isso apenas preenche o formulário; revise e confirme antes de criar ou enviar. Use **Abrir missão / revisar** para a revisão existente do jogo.

## Terminal de verificações

É um executor real com comandos permitidos, não um shell livre:

- `node --check` no arquivo JavaScript aberto;
- `node --test` na lista fixa de testes unitários da Firma;
- `git status --short`;
- `git diff --stat`, sem ferramentas externas de diff.

Cada execução requer confirmação, trabalha na raiz do projeto, mostra stdout/stderr, código de saída, erro ou cancelamento. Há limite de 90 segundos, 100 KB de saída e um processo por vez. As chaves de IA não são herdadas pelo ambiente do subprocesso. **Testes executam código local com as permissões do usuário do servidor: isto não é uma sandbox do sistema operacional.** Não execute testes de procedência desconhecida. As IAs não têm acesso a este executor; comandos não são extraídos de suas respostas.

## Verificação

`npm run check` valida a sintaxe. `npm test` inclui autorização, travessia de caminhos, arquivos privados, histórico, anexos, cotas compartilhadas, cancelamento, streaming real do protocolo, saídas incompletas e execução efetiva de comandos. Os testes de integração usam provedores substitutos, sem gastar créditos.

Fontes oficiais: [Codex App Server](https://learn.chatgpt.com/docs/app-server), [Gemini streaming](https://ai.google.dev/gemini-api/docs/generate-content/text-generation).
