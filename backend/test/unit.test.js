// Unit and HTTP tests. The database is replaced by a tiny in-memory fake pool,
// so these run without Docker or PostgreSQL: `npm test`.
const test = require('node:test');
const assert = require('node:assert/strict');
const { validateUrl, isValidCode } = require('../src/validation');
const { generateCode, ALPHABET } = require('../src/services/shortCode');
const { loadConfig } = require('../src/config');
const { createApp } = require('../src/app');

test('validateUrl accepts http(s) and rejects other schemes', () => {
  assert.equal(validateUrl(' https://github.com '), 'https://github.com/');
  for (const bad of ['', 'not a url', 'javascript:alert(1)', 'ftp://x.com', 'data:text/html,hi']) {
    assert.throws(() => validateUrl(bad), (err) => err.status === 400);
  }
});

test('generateCode uses the safe alphabet and requested length', () => {
  const code = generateCode(8);
  assert.equal(code.length, 8);
  assert.ok([...code].every((c) => ALPHABET.includes(c)));
  assert.ok(isValidCode(generateCode()));
  assert.equal(isValidCode('../etc'), false);
});

function fakePool() {
  const rows = [];
  let nextId = 1;
  return {
    rows,
    async query(sql, params = []) {
      if (sql.startsWith('SELECT 1')) return { rows: [{}] };
      if (sql.includes('INSERT INTO urls')) {
        const row = { id: nextId++, short_code: params[0], original_url: params[1], clicks: 0, created_at: new Date().toISOString() };
        rows.push(row);
        return { rows: [row] };
      }
      if (sql.includes('COUNT(*)')) {
        return { rows: [{ total_links: rows.length, total_clicks: rows.reduce((s, r) => s + r.clicks, 0) }] };
      }
      if (sql.includes('FROM urls ORDER BY')) return { rows: [...rows].reverse() };
      if (sql.startsWith('UPDATE urls')) {
        const row = rows.find((r) => r.short_code === params[0]);
        if (!row) return { rows: [] };
        row.clicks += 1;
        return { rows: [{ original_url: row.original_url }] };
      }
      if (sql.startsWith('DELETE')) {
        const i = rows.findIndex((r) => r.id === params[0]);
        if (i >= 0) rows.splice(i, 1);
        return { rowCount: i >= 0 ? 1 : 0 };
      }
      throw new Error(`unexpected query: ${sql}`);
    },
  };
}

test('API: health, create (201), list, redirect (302), delete (204)', async (t) => {
  const pool = fakePool();
  const config = loadConfig({ PUBLIC_BASE_URL: 'http://localhost:8080' });
  const app = createApp({ config, pool, logRequests: false });
  const server = await new Promise((resolve) => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  t.after(() => new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); }));
  const base = `http://127.0.0.1:${server.address().port}`;

  const health = await fetch(`${base}/health`);
  assert.equal(health.status, 200);

  const bad = await fetch(`${base}/api/urls`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ original_url: 'javascript:alert(1)' }) });
  assert.equal(bad.status, 400);

  const created = await fetch(`${base}/api/urls`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ original_url: 'https://github.com/' }) });
  assert.equal(created.status, 201);
  const link = await created.json();
  assert.equal(link.short_url, `http://localhost:8080/${link.short_code}`);

  const list = await (await fetch(`${base}/api/urls`)).json();
  assert.equal(list.length, 1);

  const redirect = await fetch(`${base}/${link.short_code}`, { redirect: 'manual' });
  assert.equal(redirect.status, 302);
  assert.equal(redirect.headers.get('location'), 'https://github.com/');
  assert.equal(pool.rows[0].clicks, 1);

  assert.equal((await fetch(`${base}/zzzzzz`, { redirect: 'manual' })).status, 404);
  assert.equal((await fetch(`${base}/api/nope`)).status, 404);

  assert.equal((await fetch(`${base}/api/urls/${link.id}`, { method: 'DELETE' })).status, 204);
  assert.equal((await fetch(`${base}/api/urls/${link.id}`, { method: 'DELETE' })).status, 404);
});
