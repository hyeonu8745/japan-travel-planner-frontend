import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('poster creation sends optional choices, keeps bodyless calls, and preserves server 400 messages', async () => {
  const clientSource = await readFile(new URL('../src/api/client.js', import.meta.url), 'utf8');
  const client = clientSource.replace('import { clearAuth, getToken } from "../auth/token";', 'const getToken=()=>"fixture-token"; const clearAuth=()=>{};').replace('import.meta.env.VITE_API_BASE_URL', '"https://fixture.invalid"');
  const clientUrl = `data:text/javascript;base64,${Buffer.from(client).toString('base64')}`;
  const extras = (await readFile(new URL('../src/api/itineraryExtras.js', import.meta.url), 'utf8')).replace("'./client'", JSON.stringify(clientUrl));
  const { createPoster } = await import(`data:text/javascript;base64,${Buffer.from(extras).toString('base64')}`);
  const originalFetch = globalThis.fetch;
  try {
    const calls = [];
    globalThis.fetch = async (url, options) => { calls.push({url, ...options}); return new Response(JSON.stringify({ id:5, style:'RETRO', character:'안경 쓴 회색 고양이' }), { status:202 }); };
    const result = await createPoster(9, { style:'RETRO', character:'안경 쓴 회색 고양이' });
    assert.equal(result.style, 'RETRO'); assert.equal(result.character, '안경 쓴 회색 고양이');
    assert.equal(calls[0].url, 'https://fixture.invalid/api/trips/9/posters');
    assert.equal(calls[0].method, 'POST'); assert.equal(calls[0].headers.Authorization, 'Bearer fixture-token');
    assert.deepEqual(JSON.parse(calls[0].body), { style:'RETRO', character:'안경 쓴 회색 고양이' });
    await createPoster(9); assert.equal(calls[1].body, undefined); assert.equal(calls[1].headers['Content-Type'], undefined);
    const message = '캐릭터는 50자 이하로 입력해주세요.';
    globalThis.fetch = async () => new Response(JSON.stringify({message}), {status:400});
    await assert.rejects(createPoster(9, {style:'UNKNOWN'}), error => error.status === 400 && error.message === message);
  } finally { globalThis.fetch = originalFetch; }
});
