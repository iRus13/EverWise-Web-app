import { Readable } from 'node:stream';
import { createEverWiseApplication } from '../server.mjs';
import { createBillingStore } from './billingStore.mjs';
import { createPartnerStore } from './partnerStore.mjs';
import { createD1Persistence } from './d1Persistence.mjs';

const applications = new WeakMap();

export async function dispatchApi(request, application) {
  const reader = request.body?.getReader();
  const chunks = [];
  let size = 0;
  if (reader) {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 256 * 1024) {
        await reader.cancel();
        return Response.json({ error: 'Request too large' }, { status: 413 });
      }
      chunks.push(Buffer.from(value));
    }
  }
  const incoming = Readable.from(chunks);
  incoming.method = request.method;
  incoming.url = request.url;
  incoming.headers = Object.fromEntries(request.headers);
  incoming.socket = { remoteAddress: request.headers.get('cf-connecting-ip') || '127.0.0.1' };
  const headers = new Headers();
  let status = 200;
  let body = null;
  const outgoing = {
    setHeader: (key, value) => headers.set(key, String(value)),
    getHeader: (key) => headers.get(key),
    writeHead(code, values = {}) { status = code; for (const [key, value] of Object.entries(values)) headers.set(key, String(value)); },
    end(value) { body = value ?? null; },
  };
  Object.defineProperty(outgoing, 'statusCode', { get: () => status, set: (value) => { status = value; } });
  await application.handle(incoming, outgoing);
  return new Response([204, 304].includes(status) ? null : body, { status, headers });
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (!path.startsWith('/api/') && path !== '/healthz') return env.ASSETS.fetch(request);
    try {
      const billing = createD1Persistence(env.DB, 'billing');
      const partners = createD1Persistence(env.DB, 'partners');
      // Missing credentials leave services unavailable. Do not recreate lost
      // trial eligibility or grant paid access from an empty replacement store.
      const runtimeEnv = { ...env };
      if (env.BILLING_RECOVERY_COMPLETE !== 'true') {
        for (const key of ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_MONTHLY_PRICE_ID', 'STRIPE_ANNUAL_PRICE_ID', 'EVERWISE_PUBLIC_APP_ORIGIN']) delete runtimeEnv[key];
      }
      let appPromise = applications.get(env);
      if (!appPromise) {
        appPromise = createEverWiseApplication({
        env: runtimeEnv,
        dependencies: {
          createBillingStore: (options) => createBillingStore({ ...options, persistence: billing }),
          createPartnerStore: (options) => createPartnerStore({ ...options, persistence: partners }),
        },
        });
        applications.set(env, appPromise);
        appPromise.catch(() => applications.delete(env));
      }
      return await dispatchApi(request, await appPromise);
    } catch {
      return Response.json({ error: 'Service temporarily unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }
  },
};
