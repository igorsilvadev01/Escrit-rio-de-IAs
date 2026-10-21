'use strict';
// All responses are doubles. Never calls a provider or uses real credentials.
function fakeProviders() {
  const calls = [],
    settings = { fail: false, truncated: false, block: false, started: null, plan: 'test' };
  const codex = {
    available: true,
    account: null,
    login: null,
    async start() {},
    async refresh() {
      if (this.login) this.account = { type: 'chatgpt', plan: settings.plan };
      return this.account;
    },
    async loginStart() {
      this.login = { authUrl: 'https://auth.openai.com/firma-qa', loginId: 'test-login' };
      return this.login;
    },
    async loginCancel() {
      this.login = null;
    },
    async models() {
      return [{ id: 'qa-codex', name: 'Codex QA' }];
    },
    async logout() {
      this.account = null;
      this.login = null;
    },
    close() {
      this.account = null;
    },
    async run(request) {
      calls.push({ provider: 'codex', ...request, signal: undefined });
      request.onDelta?.('Resposta de QA do Codex: ');
      request.onDelta?.('plano e código proposto.');
      return {
        text: 'Resposta de QA do Codex: plano e código proposto.',
        model: 'qa-codex',
        usage: { tokens: 12 },
      };
    },
  };
  async function fetcher(url, options = {}) {
    const target = new URL(url);
    if (target.hostname !== 'generativelanguage.googleapis.com') throw Error('Unexpected endpoint');
    const data = (value) =>
      new Response(JSON.stringify(value), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    if (options.method !== 'POST') {
      return data({
        models: [
          {
            name: 'models/gemini-3.8-flash',
            displayName: 'Gemini QA',
            supportedGenerationMethods: ['generateContent'],
          },
        ],
      });
    }
    const payload = JSON.parse(options.body);
    calls.push({ provider: 'gemini', payload });
    if (settings.fail)
      return new Response('Do not expose provider errors or QA_SECRET', { status: 429 });
    if (settings.block)
      return new Promise((resolve, reject) => {
        settings.started?.();
        options.signal.addEventListener('abort', () => reject(Error('cancelled')), { once: true });
      });
    if (target.pathname.endsWith(':streamGenerateContent')) {
      const events = [
        {
          candidates: [
            {
              content: {
                parts: [{ text: 'Olá, ' }, { thought: true, text: 'QA_PRIVATE_REASONING' }],
              },
            },
          ],
        },
        {
          candidates: [
            {
              content: { parts: [{ text: 'resposta em tempo real de QA.' }] },
              finishReason: settings.truncated ? 'MAX_TOKENS' : 'STOP',
            },
          ],
          usageMetadata: { totalTokenCount: 30 },
        },
      ];
      return new Response(events.map((e) => 'data: ' + JSON.stringify(e) + '\n\n').join(''), {
        headers: { 'Content-Type': 'text/event-stream' },
      });
    }
    return data({
      candidates: [
        {
          content: { parts: [{ text: 'Revisão técnica de QA. Testes não executados.' }] },
          finishReason: settings.truncated ? 'MAX_TOKENS' : 'STOP',
        },
      ],
      usageMetadata: { totalTokenCount: 30 },
    });
  }
  return { fetcher, codex, env: {}, calls, settings };
}
module.exports = { fakeProviders };
