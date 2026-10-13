import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClient, MlbbApiError } from '../src/index.js';

// A fake fetch that records calls and replies from a table, so tests never touch the network.
function fake(routes) {
  const calls = [];
  const fetch = async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body), method: init.method });
    const path = new URL(url).pathname;
    const r = routes[path];
    return { status: r?.status ?? 200, json: async () => r?.json ?? { success: false, error: 'not found' } };
  };
  return { fetch, calls };
}

test('login sends vc as a string and returns a session', async () => {
  const { fetch, calls } = fake({ '/api/login': { json: { success: true, data: { token: 'tok' } } } });
  const session = await createClient({ fetch }).login(1, 2, '0123');
  assert.equal(session.token, 'tok');
  assert.equal(calls[0].url, 'https://mlbb.bypaxxy.rip/api/login');
  assert.equal(calls[0].method, 'POST');
  assert.deepEqual(calls[0].body, { roleId: 1, zoneId: 2, vc: '0123' });
});

test('session methods send the token', async () => {
  const { fetch, calls } = fake({
    '/api/profile': { json: { success: true, data: { name: 'Aqua.' } } },
    '/api/friends': { json: { success: true, data: { friends: [{ name: 'A', avatar: null }] } } },
  });
  const s = createClient({ fetch }).session('tok');
  assert.equal((await s.profile()).name, 'Aqua.');
  assert.deepEqual(await s.friends(), [{ name: 'A', avatar: null }]);
  assert.deepEqual(calls.map((c) => c.body), [{ token: 'tok' }, { token: 'tok' }]);
});

test('failures throw MlbbApiError with status and upstream code', async () => {
  const { fetch } = fake({ '/api/login': { status: 401, json: { success: false, error: 'Wrong or expired code.', upstreamCode: -20001 } } });
  await assert.rejects(createClient({ fetch }).login(1, 2, '1'), (e) => {
    assert.ok(e instanceof MlbbApiError);
    assert.equal(e.status, 401);
    assert.equal(e.upstreamCode, -20001);
    assert.equal(e.message, 'Wrong or expired code.');
    return true;
  });
});

test('network errors become MlbbApiError with status 0', async () => {
  const fetch = async () => { throw new Error('offline'); };
  await assert.rejects(createClient({ fetch }).sendCode(1, 2), (e) => e instanceof MlbbApiError && e.status === 0);
});

test('baseUrl override strips trailing slashes', async () => {
  const { fetch, calls } = fake({ '/api/send-code': { json: { success: true, data: { sent: true } } } });
  await createClient({ fetch, baseUrl: 'https://example.test///' }).sendCode(1, 2);
  assert.equal(calls[0].url, 'https://example.test/api/send-code');
});
