import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import handler from '../api/weather.mjs';

const weather = { temp_c: 21.4, humidity: 68, condition: { text: '맑음' }, last_updated: '2026-11-03 22:00' };
function response() {
  return { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(n) { this.code = n; return this; }, json(body) { this.body = body; return this; } };
}

test('server reads environment keys, filters responses, and handles failures safely', async () => {
  const names = ['WEATHER_API_KEY', 'WEATHERAPI_API_KEY', 'WEATHERAPI_KEY'];
  const saved = names.map(n => process.env[n]);
  const originalFetch = globalThis.fetch;
  try {
    for (const n of names) delete process.env[n];
    let calls = 0;
    globalThis.fetch = async url => {
      calls++;
      assert.equal(url.searchParams.get('key'), 'secret-test-key');
      assert.equal(url.searchParams.get('lang'), 'ko');
      assert.equal(url.searchParams.get('q'), '33.4996,126.5312');
      assert.equal(url.pathname, '/v1/current.json');
      return { ok: true, json: async () => ({ current: weather, key: 'secret-test-key' }) };
    };
    let res = response();
    await handler({ method: 'GET' }, res);
    assert.equal(res.code, 503);
    assert.equal(calls, 0);
    for (const n of names) {
      process.env[n] = 'secret-test-key';
      res = response();
      await handler({ method: 'GET' }, res);
      assert.equal(res.code, 200);
      assert.deepEqual(res.body, { current: weather });
      assert.equal(res.headers['Cache-Control'], 'no-store');
      assert.ok(!JSON.stringify(res.body).includes('secret-test-key'));
      delete process.env[n];
    }
    process.env.WEATHER_API_KEY = 'secret-test-key';
    res = response();
    await handler({ method: 'POST' }, res);
    assert.equal(res.code, 405);
    assert.equal(res.headers.Allow, 'GET');
    for (const upstream of [
      async () => ({ ok: false, json: async () => ({ error: { code: 2006, message: 'secret-test-key' } }) }),
      async () => ({ ok: true, json: async () => ({ current: {} }) }),
      async () => { throw new Error('secret-test-key'); },
      async () => { const e = new Error('secret-test-key'); e.name = 'AbortError'; throw e; },
    ]) {
      globalThis.fetch = upstream;
      res = response();
      await handler({ method: 'GET' }, res);
      assert.ok([502, 504].includes(res.code));
      assert.ok(!JSON.stringify(res.body).includes('secret-test-key'));
    }
  } finally {
    globalThis.fetch = originalFetch;
    names.forEach((n, i) => saved[i] === undefined ? delete process.env[n] : process.env[n] = saved[i]);
  }
});

test('page loads automatically without a key, refreshes and preserves data on failure', async () => {
  const els = Object.fromEntries(['temperature', 'humidity', 'condition', 'updated', 'status', 'refresh'].map(id => [id, { textContent: '—', addEventListener(type, fn) { this[type] = fn; } }]));
  let calls = 0;
  const context = { document: { getElementById: id => els[id], querySelector: () => ({ setAttribute() {} }) }, AbortController, setTimeout, clearTimeout,
    fetch: async url => { calls++; assert.equal(url, '/api/weather'); return { ok: true, json: async () => ({ current: weather }) }; } };
  vm.runInNewContext(readFileSync(new URL('../dist/app.js', import.meta.url), 'utf8'), context);
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(calls, 1);
  assert.equal(els.temperature.textContent, 21.4);
  assert.equal(els.humidity.textContent, 68);
  assert.equal(els.condition.textContent, '맑음');
  assert.equal(els.updated.textContent, weather.last_updated);
  await els.refresh.click();
  assert.equal(calls, 2);
  context.fetch = async () => ({ ok: false, json: async () => ({ error: { message: '서비스 연결 실패' } }) });
  await els.refresh.click();
  assert.match(els.status.textContent, /서비스 연결 실패.*이전에/);
  assert.equal(els.temperature.textContent, 21.4);
  assert.equal(els.refresh.disabled, false);
  const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
  assert.ok(!html.includes('id="api-key"'));
});
