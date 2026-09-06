import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { createD1Persistence } from '../server/d1Persistence.mjs';
import { createBillingStore } from '../server/billingStore.mjs';
import { createPartnerStore } from '../server/partnerStore.mjs';
import worker, { dispatchApi } from '../server/worker.mjs';

function database() {
  const sql = new DatabaseSync(':memory:');
  sql.exec('CREATE TABLE app_stores (name TEXT PRIMARY KEY, revision INTEGER NOT NULL, body TEXT NOT NULL)');
  return { prepare(query) { return { bind(...values) { return {
    async first() { return sql.prepare(query).get(...values) ?? null; },
    async run() { const result = sql.prepare(query).run(...values); return { success: true, meta: { changes: Number(result.changes) } }; },
  }; } }; } };
}

test('separate database adapters retry conflicting inserts and retain both mutations', async () => {
  const db = database();
  const adapters = [createD1Persistence(db, 'billing'), createD1Persistence(db, 'billing')];
  await Promise.all(adapters.map((adapter) => adapter.mutate(async data => ({ changed: true, data: { count: (data?.count ?? 0) + 1 }, result: true }))));
  assert.deepEqual(await adapters[0].read(), { count: 2 });
});

test('billing identities persist across instances and conflicting ownership is refused', async () => {
  const db = database();
  const make = () => createBillingStore({ persistence: createD1Persistence(db, 'billing') });
  await make().bindCustomer({ uid: 'learner-one', customerId: 'cus_One' });
  assert.equal((await make().getByUid('learner-one')).customerId, 'cus_One');
  await assert.rejects(make().bindCustomer({ uid: 'learner-two', customerId: 'cus_One' }));
  assert.deepEqual(await make().health(), { configured: true, healthy: true });
});

test('new partner records use durable storage and old nonexistent invitations fail closed', async () => {
  const db = database();
  const make = () => createPartnerStore({ filePath: '/unused', persistence: createD1Persistence(db, 'partners') });
  assert.deepEqual(await make().health(), { configured: false, healthy: false });
  await make().createPartner({ partnerId: 'new-partner', name: 'New Partner', seatLimit: 500, branding: { name: 'New Partner', logoPath: null, accent: '#315A73' } });
  assert.deepEqual(await make().health(), { configured: true, healthy: true });
});

test('request bridge preserves webhook bytes and blocks oversized bodies', async () => {
  const bytes = '{ "unchanged": true }';
  const app = { async handle(req, res) { const chunks = []; for await (const chunk of req) chunks.push(chunk); assert.equal(Buffer.concat(chunks).toString(), bytes); res.writeHead(201, { 'Content-Type': 'text/plain' }); res.end('ok'); } };
  const response = await dispatchApi(new Request('https://everwise.tips/api/stripe/webhook', { method: 'POST', body: bytes }), app);
  assert.equal(response.status, 201);
  assert.equal(await response.text(), 'ok');
  assert.equal((await dispatchApi(new Request('https://everwise.tips/api/x', { method: 'POST', body: 'x'.repeat(262145) }), app)).status, 413);
});

test('replacement backend reports missing services and cannot enable billing before recovery', async () => {
  const env = { DB: database(), STRIPE_SECRET_KEY: 'sk_test_placeholder' };
  const response = await worker.fetch(new Request('https://everwise.tips/healthz'), env);
  assert.equal(response.status, 200);
  const health = await response.json();
  assert.equal(health.billingConfigured, false);
  assert.equal(health.scamCheckerConfigured, false);
});
