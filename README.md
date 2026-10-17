# Firma — escritório de IAs em 2D · v0.2

Projeto **Escritório de IAs**: um escritório 2D interativo para visualizar IAs no ambiente de trabalho. A Firma é a interface local em português para transformar objetivos em missões, acompanhar especialistas e revisar entregas. HTML, CSS e JavaScript sem dependências de execução externas.

Repositório: [igorsilvadev01/Escrit-rio-de-IAs](https://github.com/igorsilvadev01/Escrit-rio-de-IAs).

Para obter o projeto em outro computador:

```powershell
git clone https://github.com/igorsilvadev01/Escrit-rio-de-IAs.git
cd Escrit-rio-de-IAs
npm start
```

Não é necessário executar `npm install` para usar o jogo ou rodar os testes do motor.

## Abrir no Windows

Dê dois cliques em **Iniciar Firma.bat**. Mantenha a janela do servidor aberta. Se a versão anterior estiver rodando, encerre-a com `Ctrl+C` e abra novamente para carregar os novos arquivos do servidor.

Alternativamente:

```powershell
npm start
```

Acesse **http://localhost:3000**. Requer Node.js, já disponível neste computador. O servidor escuta apenas em `127.0.0.1`.

## Começar a usar

1. Em **Contexto**, registre objetivos, público e restrições do projeto.
2. Clique em **Nova missão** e escolha pesquisa, desenvolvimento, design, conteúdo ou análise. Ajuste briefing, entrega e critérios de aceite. O responsável é sugerido por especialidade e carga de trabalho.
3. Ou use **Reunir equipe** para criar um plano de três tarefas conectadas a partir de um objetivo. A decomposição usa um modelo fixo.
4. No quadro, acompanhe fila, produção, dependências, revisão e aprovações. Busque por título, briefing ou responsável e filtre por estado ou atraso.
5. Quando uma entrega chegar à revisão, leia o documento, baixe-o, peça ajustes ou aprove. Só a aprovação libera a tarefa dependente.

## Mecânicas e ferramentas

- Escritório em pixel art com salas clicáveis, zoom, pausa e velocidades 1×, 2× e 4×.
- Um trabalho por agente, com fila ordenada por prioridade, prazo e criação.
- Briefings com entrega esperada, critérios de aceite, prazo opcional e dependência.
- Contexto compartilhado capturado na criação de cada tarefa.
- Revisão humana com histórico de feedback e devolução à produção.
- Energia, pausas automáticas, experiência e nível simulados. Agentes vão para a sala de reunião ou o descanso conforme seu estado.
- Conversa demonstrativa para consultar status, fila e próximo passo.
- Edição de instruções individuais e reatribuição de tarefas abertas.
- Exportação de entrega em Markdown e briefing estruturado em JSON.
- Backup completo em JSON e restauração validada com resumo antes de substituir o escritório.
- Salvamento no navegador e migração dos dados da versão anterior (`firma-office-v1`).
- Histórico local dos últimos 80 eventos e guia de primeiros passos.
- Layout responsivo, busca, atalhos e navegação por teclado nos painéis.

Atalhos fora de campos de texto: `N` nova missão, `Q` quadro, `O` escritório, `?` guia e `Ctrl+K` ações rápidas. `Esc` fecha os diálogos.

## O que é simulado

**Nenhum modelo de IA está conectado.** Personagens, energia, progresso, reuniões e respostas da conversa usam regras locais. A entrega gerada é um documento que registra briefing, critérios, etapas e feedback, identificado como simulado. Não constitui uma pesquisa, código ou análise executados.

O progresso só avança com a página aberta e a simulação em execução. Prazos usam o calendário real do computador; o relógio de operação usa segundos simulados. Não há progresso offline, colaboração entre abas nem coordenação de múltiplos usuários. Use uma aba por escritório.

Dados são mantidos na origem do navegador (`http://localhost:3000`); outro navegador, outra porta ou `127.0.0.1` terão armazenamento separado. Faça backups antes de limpar dados do navegador.

## Verificação

```powershell
npm run check
npm test
```

Os testes do motor cobrem dependências, prioridade, pausas, aprovação, revisão, captura de contexto, migração e backups inválidos. A validação no Chrome está em `tests/browser-smoke.cjs`, que requer Playwright instalado separadamente. `FIRMA_PLAYWRIGHT` pode apontar ao módulo e `FIRMA_BROWSER` a um Chrome local. O teste usa armazenamento isolado, não altera seu escritório e produz capturas em `artifacts/`.

## Organização

| Arquivo | Responsabilidade |
| --- | --- |
| `index.html` | Estrutura, navegação e diálogos |
| `style.css`, `work.css` | Identidade visual e layouts |
| `engine.js` | Estado, migração e regras de trabalho simuladas |
| `ui.js` | Painéis, missões, revisão, backup e interações |
| `app.js` | Escritório, personagens e interação espacial |
| `server.cjs` | Servidor estático local |

Veja [referências aplicadas](docs/REFERENCIAS.md) e o [plano de integração com IA real](docs/INTEGRACAO-IA.md).
