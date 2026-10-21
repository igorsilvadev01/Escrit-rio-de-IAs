'use strict';
const url = new URL(
  process.env.FIRMA_HEALTH_URL || `http://127.0.0.1:${process.env.PORT || 3000}/readyz`,
);
if (url.username || url.password || !['http:', 'https:'].includes(url.protocol))
  throw Error('URL de saúde inválida.');
fetch(url, { signal: AbortSignal.timeout(5000), redirect: 'error' })
  .then(async (response) => {
    if (!response.ok || (await response.json()).ok !== true) throw Error();
    console.log('Firma disponível.');
  })
  .catch(() => {
    console.error('Firma indisponível.');
    process.exitCode = 1;
  });
