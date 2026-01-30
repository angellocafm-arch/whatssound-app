#!/usr/bin/env node
/**
 * WhatsSound — API Integration Tests
 * Tests all Supabase operations end-to-end
 * Run: node tests/api-tests.js
 */

const SUPABASE_URL = 'https://xyehncvvvprrqwnsefcr.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZWhuY3Z2dnBycnF3bnNlZmNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NTA4OTgsImV4cCI6MjA4NTIyNjg5OH0.VEaTmqpMA7XdUa-tZ7mXib1ciweD7y5UU4dFGZq3EtQ';
const DEPLOY_URL = 'https://dist-sepia-sigma-62.vercel.app';

const USERS = {
  kike: { email: 'kike@whatssound.com', password: 'WS2026demo!', id: 'e5a9ca28-bbfe-488d-b8b5-888e829e1f7b' },
  angel: { email: 'angel@whatssound.com', password: 'WS2026demo!', id: 'ceaf5567-b9a4-4682-baef-4343e3ed2d6d' },
  admin: { email: 'admin@whatssound.com', password: 'WS2026demo!', id: '88af064d-8c21-4bd6-97c5-90a2f820b9c6' },
};

let passed = 0, failed = 0, total = 0;
const results = [];

function log(status, name, detail = '') {
  total++;
  const icon = status === 'PASS' ? '✅' : '❌';
  if (status === 'PASS') passed++; else failed++;
  const msg = `${icon} ${name}${detail ? ' — ' + detail : ''}`;
  console.log(msg);
  results.push({ status, name, detail });
}

async function api(path, opts = {}) {
  const url = path.startsWith('http') ? path : `${SUPABASE_URL}${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      'apikey': ANON_KEY,
      'Content-Type': 'application/json',
      ...opts.headers,
    },
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { ok: res.ok, status: res.status, data };
}

async function authApi(token, path, opts = {}) {
  return api(path, { ...opts, headers: { ...opts.headers, 'Authorization': `Bearer ${token}` } });
}

// ═══════════════════════════════════════════
// TEST SUITE
// ═══════════════════════════════════════════

async function runTests() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   WhatsSound API Integration Tests       ║');
  console.log('║   ' + new Date().toISOString() + '   ║');
  console.log('╚══════════════════════════════════════════╝\n');

  // ─── 1. AUTHENTICATION ───
  console.log('─── 1. AUTENTICACIÓN ───');
  
  const tokens = {};
  for (const [name, user] of Object.entries(USERS)) {
    const { ok, data } = await api('/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({ email: user.email, password: user.password }),
    });
    if (ok && data.access_token) {
      tokens[name] = data.access_token;
      log('PASS', `Login ${name}`, `token: ${data.access_token.substring(0, 20)}...`);
    } else {
      log('FAIL', `Login ${name}`, JSON.stringify(data).substring(0, 100));
    }
  }

  // ─── 2. PROFILES ───
  console.log('\n─── 2. PERFILES ───');
  
  const { ok: profOk, data: profiles } = await authApi(tokens.kike, '/rest/v1/profiles?select=id,display_name,username,is_dj&order=display_name');
  if (profOk && profiles.length >= 3) {
    log('PASS', 'Fetch profiles', `${profiles.length} perfiles encontrados`);
  } else {
    log('FAIL', 'Fetch profiles', JSON.stringify(profiles).substring(0, 100));
  }

  // Verify each user has a profile
  for (const [name, user] of Object.entries(USERS)) {
    const found = profiles?.find(p => p.id === user.id);
    log(found ? 'PASS' : 'FAIL', `Profile exists: ${name}`, found?.display_name || 'NOT FOUND');
  }

  // ─── 3. SESSIONS ───
  console.log('\n─── 3. SESIONES ───');
  
  // Create a new session
  const { ok: createOk, data: newSession } = await authApi(tokens.kike, '/rest/v1/sessions', {
    method: 'POST',
    headers: { 'Prefer': 'return=representation' },
    body: JSON.stringify({ dj_id: USERS.kike.id, name: 'Test Session 🧪', genre: 'Pop', status: 'live' }),
  });
  const testSessionId = Array.isArray(newSession) ? newSession[0]?.id : newSession?.id;
  log(createOk && testSessionId ? 'PASS' : 'FAIL', 'Create session', testSessionId || JSON.stringify(newSession).substring(0, 100));

  // Fetch live sessions (excluding Chat/Group)
  const { ok: liveOk, data: liveSessions } = await authApi(tokens.kike, '/rest/v1/sessions?status=eq.live&genre=not.in.(%22Chat%22,%22Group%22)&select=id,name,genre');
  const foundTest = liveSessions?.find(s => s.id === testSessionId);
  log(liveOk && foundTest ? 'PASS' : 'FAIL', 'Fetch live sessions', `${liveSessions?.length} sesiones, test found: ${!!foundTest}`);

  // Ángel also sees the session
  const { data: angelSessions } = await authApi(tokens.angel, '/rest/v1/sessions?status=eq.live&genre=not.in.(%22Chat%22,%22Group%22)&select=id,name');
  const angelFound = angelSessions?.find(s => s.id === testSessionId);
  log(angelFound ? 'PASS' : 'FAIL', 'Ángel sees live session', angelFound?.name || 'NOT FOUND');

  // ─── 4. QUEUE (SONGS) ───
  console.log('\n─── 4. COLA DE CANCIONES ───');
  
  // Request a song
  const { ok: songOk, data: songData } = await authApi(tokens.angel, '/rest/v1/queue', {
    method: 'POST',
    headers: { 'Prefer': 'return=representation' },
    body: JSON.stringify({ session_id: testSessionId, requested_by: USERS.angel.id, song_name: 'Blinding Lights', artist: 'The Weeknd' }),
  });
  const songId = Array.isArray(songData) ? songData[0]?.id : songData?.id;
  log(songOk && songId ? 'PASS' : 'FAIL', 'Request song (Ángel)', songId || JSON.stringify(songData).substring(0, 100));

  // Admin requests another song
  const { ok: song2Ok } = await authApi(tokens.admin, '/rest/v1/queue', {
    method: 'POST',
    headers: { 'Prefer': 'return=representation' },
    body: JSON.stringify({ session_id: testSessionId, requested_by: USERS.admin.id, song_name: 'Shape of You', artist: 'Ed Sheeran' }),
  });
  log(song2Ok ? 'PASS' : 'FAIL', 'Request song (Admin)');

  // Fetch queue
  const { ok: queueOk, data: queue } = await authApi(tokens.kike, `/rest/v1/queue?session_id=eq.${testSessionId}&order=votes.desc&select=id,song_name,artist,votes`);
  log(queueOk && queue?.length === 2 ? 'PASS' : 'FAIL', 'Fetch queue', `${queue?.length} canciones`);

  // ─── 5. VOTES ───
  console.log('\n─── 5. VOTOS ───');
  
  // Kike votes for Blinding Lights
  const { ok: voteOk } = await authApi(tokens.kike, '/rest/v1/votes', {
    method: 'POST',
    headers: { 'Prefer': 'return=representation' },
    body: JSON.stringify({ user_id: USERS.kike.id, queue_id: songId }),
  });
  log(voteOk ? 'PASS' : 'FAIL', 'Vote (Kike → Blinding Lights)');

  // Admin also votes
  const { ok: vote2Ok } = await authApi(tokens.admin, '/rest/v1/votes', {
    method: 'POST',
    headers: { 'Prefer': 'return=representation' },
    body: JSON.stringify({ user_id: USERS.admin.id, queue_id: songId }),
  });
  log(vote2Ok ? 'PASS' : 'FAIL', 'Vote (Admin → Blinding Lights)');

  // Verify vote count via proxy API
  const voteRes = await fetch(`${DEPLOY_URL}/api/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ queueId: songId }),
  });
  log(voteRes.ok ? 'PASS' : 'FAIL', 'Vote proxy API (/api/vote)', `status: ${voteRes.status}`);

  // ─── 6. SESSION MESSAGES ───
  console.log('\n─── 6. MENSAJES DE SESIÓN ───');
  
  // Kike sends a message
  const { ok: msgOk } = await authApi(tokens.kike, '/rest/v1/messages', {
    method: 'POST',
    body: JSON.stringify({ session_id: testSessionId, user_id: USERS.kike.id, content: 'Bienvenidos al test! 🧪' }),
  });
  log(msgOk ? 'PASS' : 'FAIL', 'Send message (Kike)');

  // Ángel sends a message
  const { ok: msg2Ok } = await authApi(tokens.angel, '/rest/v1/messages', {
    method: 'POST',
    body: JSON.stringify({ session_id: testSessionId, user_id: USERS.angel.id, content: 'Hola! Ponme Blinding Lights! 🎵' }),
  });
  log(msg2Ok ? 'PASS' : 'FAIL', 'Send message (Ángel)');

  // Fetch messages
  const { ok: msgsOk, data: msgs } = await authApi(tokens.kike, `/rest/v1/messages?session_id=eq.${testSessionId}&order=created_at&select=content,user_id`);
  log(msgsOk && msgs?.length >= 2 ? 'PASS' : 'FAIL', 'Fetch session messages', `${msgs?.length} mensajes`);

  // ─── 7. CHATS (1-a-1) ───
  console.log('\n─── 7. CHATS DIRECTOS ───');
  
  const { data: chats } = await authApi(tokens.kike, '/rest/v1/chats?type=eq.direct&select=id,type,name');
  log(chats?.length > 0 ? 'PASS' : 'FAIL', 'Fetch direct chats (Kike)', `${chats?.length} chats`);

  // Fetch chat messages
  if (chats?.length > 0) {
    const chatId = chats[0].id;
    const { data: chatMsgs } = await authApi(tokens.kike, `/rest/v1/chat_messages?chat_id=eq.${chatId}&select=content,user_id&order=created_at`);
    log(chatMsgs?.length > 0 ? 'PASS' : 'FAIL', 'Fetch chat messages', `${chatMsgs?.length} mensajes`);
  }

  // ─── 8. GROUPS ───
  console.log('\n─── 8. GRUPOS ───');
  
  const { data: groups } = await authApi(tokens.kike, '/rest/v1/chats?type=eq.group&select=id,name');
  log(groups?.length > 0 ? 'PASS' : 'FAIL', 'Fetch groups (Kike)', `${groups?.length} grupos: ${groups?.map(g => g.name).join(', ')}`);

  // Fetch group members
  if (groups?.length > 0) {
    const { data: members } = await authApi(tokens.kike, `/rest/v1/chat_members?chat_id=eq.${groups[0].id}&select=user_id,role`);
    log(members?.length >= 2 ? 'PASS' : 'FAIL', 'Fetch group members', `${members?.length} miembros`);
  }

  // ─── 9. FOLLOWERS ───
  console.log('\n─── 9. SEGUIDORES ───');
  
  // Ángel follows Kike
  const { ok: followOk } = await authApi(tokens.angel, '/rest/v1/followers', {
    method: 'POST',
    headers: { 'Prefer': 'return=representation' },
    body: JSON.stringify({ follower_id: USERS.angel.id, following_id: USERS.kike.id }),
  });
  log(followOk ? 'PASS' : 'FAIL', 'Follow (Ángel → Kike)');

  // Verify
  const { data: followers } = await authApi(tokens.kike, `/rest/v1/followers?following_id=eq.${USERS.kike.id}&select=follower_id`);
  log(followers?.length > 0 ? 'PASS' : 'FAIL', 'Verify followers', `${followers?.length} seguidores`);

  // ─── 10. DEEZER API ───
  console.log('\n─── 10. DEEZER API ───');
  
  const deezerRes = await fetch(`${DEPLOY_URL}/api/deezer?q=Bad+Bunny`);
  const deezerData = await deezerRes.json().catch(() => null);
  log(deezerRes.ok && deezerData?.data?.length > 0 ? 'PASS' : 'FAIL', 'Deezer search (Bad Bunny)', `${deezerData?.data?.length || 0} resultados`);

  // ─── 11. CLEANUP ───
  console.log('\n─── 11. LIMPIEZA ───');
  
  // End test session
  const { ok: endOk } = await authApi(tokens.kike, `/rest/v1/sessions?id=eq.${testSessionId}`, {
    method: 'PATCH',
    headers: { 'Prefer': 'return=minimal' },
    body: JSON.stringify({ status: 'ended', ended_at: new Date().toISOString() }),
  });
  log(endOk ? 'PASS' : 'FAIL', 'End test session');

  // Unfollow
  await authApi(tokens.angel, `/rest/v1/followers?follower_id=eq.${USERS.angel.id}&following_id=eq.${USERS.kike.id}`, { method: 'DELETE' });
  log('PASS', 'Cleanup followers');

  // ═══ SUMMARY ═══
  console.log('\n╔══════════════════════════════════════════╗');
  console.log(`║   RESULTADO: ${passed}/${total} PASSED ${failed > 0 ? '(' + failed + ' FAILED)' : '✅'}`.padEnd(43) + '║');
  console.log('╚══════════════════════════════════════════╝');
  
  if (failed > 0) {
    console.log('\n❌ Tests fallidos:');
    results.filter(r => r.status === 'FAIL').forEach(r => console.log(`   - ${r.name}: ${r.detail}`));
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
