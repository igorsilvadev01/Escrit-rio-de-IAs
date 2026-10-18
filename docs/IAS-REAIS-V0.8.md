# IAs reais na Firma · v0.8

Pesquisa e implementação: 17/10/2026.

## Seleção por função

Recomendação de adequação ao trabalho, não ranking absoluto nem benchmark próprio. Disponibilidade, qualidade e custo precisam ser avaliados com seus briefings. A divisão por função é uma decisão de projeto baseada nas capacidades descritas pelos fabricantes.

| Função | Escolha inicial | Motivo |
| --- | --- | --- |
| Liderança | ChatGPT / Codex, modelo padrão da conta | Preferência do fundador; orientação técnica |
| Planejar | Claude Opus 5.5 · claude-opus-5-5 | Raciocínio e projetos complexos |
| Desenvolver | ChatGPT / Codex, modelo padrão da conta | Especialização em código |
| Testar / revisar | Gemini 4 Argon · gemini-4-argon | Contexto longo e revisão independente |
| Preparar postagem | Claude Sonnet 5.5 · claude-sonnet-5-5 | Escrita e equilíbrio entre qualidade e custo |

IDs são ajustáveis. Se um modelo não estiver disponível, a ordem falha com orientação; não há substituição silenciosa.

## Conectar e usar

1. Entre como administrador na Firma local.
2. Na sala do Codex, abra **Conectar IAs reais**.
3. Use **Entrar com ChatGPT** e conclua o login na página oficial. A Firma não recebe sua senha.
4. Para Claude e Gemini, crie uma chave nas plataformas oficiais e use **Conectar API**.
5. Em **Configurar funções e limites**, escolha os modelos disponíveis. Codex permanece como líder; as outras funções podem usar qualquer provedor conectado, inclusive somente Codex.
6. Use **Ordem ao líder Codex**, **Dar ordem à IA** no colaborador ou **Criar fluxo com IAs reais**.

Missões novas podem começar em simulação ou como ordem real suspensa para confirmação. Converter uma missão simulada substitui seu progresso e rascunho simulado.

### Autenticação

Codex usa o App Server oficial por stdin/stdout, com sessão própria em .firma-private/codex. Não copia, lê ou altera tokens do IDE. **Verificar sessão** consulta o acesso e os modelos; **Desconectar** encerra apenas a sessão da Firma. O login completo depende da ação do usuário, do plano, das permissões e da disponibilidade de portas locais.

O CLI oficial foi detectado nesta máquina. A distribuição npm no Windows é descoberta no perfil do usuário; outras instalações podem indicar FIRMA_CODEX_BIN com caminho absoluto do executável oficial. O binário nativo é iniciado sem shell ou janela visível.

Claude e Gemini usam APIs oficiais nesta implementação:

- [Chaves Claude](https://platform.claude.com/settings/keys)
- [Chaves Gemini](https://aistudio.google.com/apikey)

Não informe senhas, cookies ou tokens extraídos de outros aplicativos. Assinaturas de chat não são convertidas em créditos de API.

Verificar uma chave consulta modelos, sem gerar uma resposta. Chaves digitadas ficam somente na memória do servidor, não em localStorage, backups ou arquivos de configuração. Depois de reiniciar o servidor, informe-as novamente. Alternativamente, configure ANTHROPIC_API_KEY e GEMINI_API_KEY nas variáveis de ambiente do processo e conecte com o campo vazio. A Firma não carrega .env automaticamente.

## Ordens, revisão e limitações

A aplicação envia o briefing, a entrega esperada, os critérios de aceite, as instruções do agente, o contexto compartilhado da tarefa, o feedback e a entrega anterior aprovada, quando houver. O fundador confirma o compartilhamento e possível consumo antes do envio.

O servidor executa uma ordem por vez. No fluxo de quatro etapas, aprovar uma entrega libera a próxima chamada já autorizada. Falhas não são repetidas automaticamente; revisões exigem nova confirmação.

Uma entrega só é marcada como gerada por IA após resposta concluída. Saídas bloqueadas, interrompidas ou cortadas pelo limite não são tratadas como sucesso. A aprovação humana não garante a correção do modelo.

Esta versão gera planos, texto, código proposto, casos de teste e revisão técnica do material fornecido. **Não executa shell/testes, não instala dependências, não edita projetos e não publica.** A função Testar propõe e revisa testes, sem afirmar que os executou.

Codex usa modo somente leitura, shell desabilitado e nenhuma ferramenta MCP configurada pela Firma. Pedidos de ferramentas/permissões ao cliente são recusados. Claude e Gemini recebem mensagens sem ferramentas de execução. O executor Codex conectado não é uma continuação automática da conversa no IDE.

Não há acesso automático a outros repositórios, arquivos ou contas. Para executar projetos de verdade, ainda é necessário implementar seleção de repositório, executor isolado e política de permissões. Não apresente esta versão como produção autônoma de software.

## Custos e controle

Padrão: até 10 chamadas por dia UTC e 8192 tokens de saída nas APIs. Configurável de 1 a 100 chamadas e 512 a 65536 tokens. Codex usa os limites do cliente/plano; o limite de tokens das APIs não se aplica a ele.

Modelos de raciocínio podem atingir o limite antes de responder. Gemini recomenda limites maiores em certos trabalhos complexos; aumentá-los pode aumentar o consumo. Não há garantia de gratuidade.

O contador inclui tentativas que falham ou são canceladas. **Não é um teto financeiro.** Entradas, saídas e raciocínio afetam a cobrança. Configure também cotas e faturamento no provedor. Nenhum teste desta implementação consumiu créditos de modelos.

Cancelar interrompe a espera e tenta interromper a requisição, sem garantir estorno ou fim do processamento remoto. Timeout local de três minutos, sem repetição automática.

Pausas e reunião impedem novos envios. Uma chamada já enviada pode terminar; o documento aguarda a retomada para ir à revisão. Reiniciar o servidor ou restaurar backup suspende ordens não concluídas, exigindo nova autorização.

## Segurança e validação

Conexões e ordens exigem administrador, origem válida e CSRF. A API pública não expõe briefings, respostas, erros detalhados ou credenciais. Endereços de provedores são fixos, IDs de modelo são validados e redirecionamentos HTTP não são seguidos. Erros não repassam corpos brutos; chaves conhecidas são removidas das respostas.

Configuração e contagem são separadas do backup, sem chaves. A sessão oficial do Codex fica na área privada local, excluída do Git e não servida por HTTP. Proteja essa pasta e o computador; não a compartilhe. Conexões exigem localhost ou HTTPS; login Codex restrito ao uso local. Resultados são texto escapado, nunca HTML ou comandos executados.

36 testes Node cobrem a base, autorização, privacidade, limites, dependências, revisão, cancelamento, reinício, truncamento e roteamento. O protocolo Codex foi testado com processo substituto e inicialização real do CLI em diretório temporário sem conta, sem chamadas a modelos.

Testes de navegador usam backend temporário e provedores substitutos, sem dados ou credenciais reais do proprietário. Cobrem conexões, interface de login, funções, consentimento, ordens, entregas, celular e visitantes.

**Após conectar suas contas, valide uma ordem pequena em cada provedor.** Login completo, acesso aos modelos, cobrança e qualidade das respostas não foram verificados com as contas do proprietário.

## Fontes oficiais

- [Codex App Server](https://learn.chatgpt.com/docs/app-server)
- [Autenticação OpenAI](https://learn.chatgpt.com/docs/auth)
- [Configuração Codex](https://learn.chatgpt.com/docs/config-file/config-sample)
- [Modelos Claude](https://platform.claude.com/docs/en/models/overview)
- [Autenticação e uso de terceiros Claude](https://support.claude.com/en/articles/13189465-log-in-to-your-claude-account)
- [Messages API Claude](https://platform.claude.com/docs/en/api/messages/create)
- [Modelos Gemini](https://ai.google.dev/gemini-api/docs/models)
- [Limites e novidades Gemini](https://ai.google.dev/gemini-api/docs/latest-model)
- [Chaves Gemini](https://ai.google.dev/gemini-api/docs/api-key)
- [GenerateContent API](https://ai.google.dev/api/generate-content)
