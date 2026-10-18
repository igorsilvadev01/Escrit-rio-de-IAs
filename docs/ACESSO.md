# Acesso e visita — Firma v0.4

## Uso local

Abra `Iniciar Firma.bat`. Na primeira execução, o navegador recebe uma chave de configuração no fragmento do endereço. Ela é removida da barra assim que a página carrega, não é enviada em requisições HTTP e só permite criar o primeiro proprietário. Defina um e-mail válido (até 254 caracteres) ou usuário (3–40 letras, números, pontos, hífens ou sublinhados) e uma senha de 12–256 caracteres. E-mails são normalizados para minúsculas. A senha não vai para o código nem é armazenada em texto legível.

O cadastro inicial exige a chave privada gerada no computador do proprietário. Saber o endereço público ou chegar primeiro à tela de login não permite criar uma conta. O único login administrativo é aquele configurado nesse acesso inicial. Não compartilhe a chave de configuração.

## Permissões

| Capacidade | Administrador autenticado | Visitante |
| --- | --- | --- |
| Explorar o escritório e os colegas | Sim | Sim |
| Acompanhar energia e produção | Sim | Sim |
| Consultar títulos, briefings, contexto e documentos privados | Sim | Não |
| Criar tarefas, contratar, pausar, alterar configurações | Sim | Não |
| Aprovar ou devolver entregas | Sim | Não |
| Baixar/restaurar backups | Sim | Não |

A projeção pública usa títulos genéricos para as missões e remove briefing, contexto, critérios, resultado, feedback, instruções e histórico privado. O personagem de visita é local à aba e não altera o personagem do fundador. Isso é visita acompanhando a simulação, não multiplayer com visitantes aparecendo uns para os outros.

O estado é mantido no servidor. A interface envia comandos autenticados; não envia cópias completas do estado para cada ação. Os visitantes consultam a projeção pública a cada segundo. A produção continua com o Node.js ligado e para quando ele é desligado. Login não conecta nenhum provedor de IA: a produção continua simulada.

## Armazenamento e sessão

- `.firma-private/admin.json`: usuário, salt aleatório e derivação scrypt da senha.
- `.firma-private/office.json`: estado compartilhado e pausa da produção.
- `.firma-private/setup-token`: chave inicial, invalidada e removida depois da configuração.
- Sessões: identificadores aleatórios, guardados em hash somente na memória do servidor. Reiniciar o servidor exige novo login; os dados e a conta permanecem.

Cookies de sessão têm `HttpOnly`, `SameSite=Strict`, expiração absoluta de oito horas e `Secure` quando a origem pública usa HTTPS. Logout invalida a sessão correspondente. Comandos exigem sessão válida, token CSRF e a origem correta. Login e configuração limitam tentativas por endereço de conexão. Arquivos privados não são servidos pelo HTTP nem incluídos no Git. O backup baixado no painel inclui o escritório, não as credenciais.

Um save antigo pode ser importado no primeiro login; a cópia no navegador é preservada. Se a senha for perdida, será necessária uma recuperação feita localmente no servidor por quem controla os arquivos; não há recuperação por e-mail nesta versão.

## Publicação

GitHub Pages não executa Node.js e não serve como backend deste login. Use um serviço com processo Node.js, armazenamento persistente e HTTPS. Esta alteração prepara o aplicativo; não publica um novo endereço na internet.

Variáveis disponíveis para a hospedagem:

| Variável | Uso |
| --- | --- |
| `PORT` | Porta do processo; padrão `3000` |
| `FIRMA_HOST` | Interface de escuta; padrão `127.0.0.1`; em contêiner normalmente `0.0.0.0` |
| `FIRMA_PUBLIC_ORIGIN` | Origem HTTPS exata, como `https://firma.exemplo.com`, sem caminhos |
| `FIRMA_DATA_DIR` | Diretório privado persistente, fora dos arquivos públicos |

Configure a origem pública ao usar um domínio: o servidor valida Host e Origin. Em produção, termine HTTPS no serviço/proxy e mantenha uma única instância Node.js usando esse diretório. Não use o mesmo diretório simultaneamente em dois processos/contêineres. A configuração inicial remota exige que o proprietário obtenha a chave no volume privado e abra a origem pública com `/#configurar=CHAVE`.

## Referências técnicas

- [OWASP — Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html): sessões, renovação de identificadores e atributos de cookies.
- [Node.js — Crypto](https://nodejs.org/api/crypto.html): scrypt, salt aleatório, geração de identificadores e comparação com `timingSafeEqual`.

Os testes exercitam o backend real em diretórios temporários e verificam que alterar a interface ou forjar um papel de administrador no navegador não concede permissão no servidor.
