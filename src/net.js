/* サーバーとの行き来（2026-10-04）
   ★ここの文言も戦国口調を使わない（link.js と同じ決めごと）。
     間違えると失うのが「気分」ではなく「データそのもの」だから。

   いちばん大事な決めごと ──「サーバーが無くても遊べる」。
   繋がらないときは静かにあきらめて、これまでどおり端末の中だけで動く。
   「絵が無くても動く」と同じ考え方。

   まだ画面には繋いでいない。繋ぐときは build_standalone.mjs の
   strip() と連結の2か所に net を足すこと（新モジュールの落とし穴） */

export const KURA = 'https://wanko-kura.company-yug.workers.dev';   // 例: 'https://wanko-kura.<あなた>.workers.dev'。空ならサーバーを使わない

const LS_DEV = 'wanko.device.v1';
const LS_TOK = 'wanko.token.v1';
const LS_REV = 'wanko.rev.v1';

const ls = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* 入らなくても進む */ } },
};

/* 端末の印。その端末にひとつ。消すと別の端末として扱われる */
export function deviceKey() {
  let d = ls.get(LS_DEV);
  if (!d) {
    const a = new Uint8Array(16);
    try { crypto.getRandomValues(a); } catch { for (let i = 0; i < 16; i++) a[i] = Math.random() * 256; }
    d = [...a].map(b => b.toString(16).padStart(2, '0')).join('');
    ls.set(LS_DEV, d);
  }
  return d;
}

export const token = () => ls.get(LS_TOK) || '';
export const revOf = () => parseInt(ls.get(LS_REV) || '0', 10) || 0;
/* 版を合わせる（2026-10-04）。サーバーの記録をこちらに入れたときは、
   版の数もサーバーに合わせること。忘れると開き直すたびに
   「向こうが新しい」と言われて同じ札が出つづける（実際に踏んだ） */
export const setRev = (n) => ls.set(LS_REV, String(n || 0));
export const linked = () => !!(KURA && token());

async function call(path, { method = 'GET', body, auth = true } = {}) {
  if (!KURA) return { ok: false, err: 'off' };
  const h = { 'content-type': 'application/json' };
  if (auth && token()) h.authorization = 'Bearer ' + token();
  try {
    const r = await fetch(KURA + path, { method, headers: h,
      body: body === undefined ? undefined : JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    return { ...j, status: r.status, ok: r.ok && j.ok !== false };
  } catch (e) {
    return { ok: false, err: 'net' };     // 繋がらない。黙って端末の中だけで続ける
  }
}

/* サーバーに名乗る。はじめてなら主を作って札をもらう。
   code は link.js が端末で作った引き継ぎID（WAN-…）をそのまま渡す */
export async function hello(code, name) {
  const r = await call('/v1/hello', { method: 'POST', auth: false,
    body: { device: deviceKey(), code, name } });
  if (r.ok && r.token) { ls.set(LS_TOK, r.token); ls.set(LS_REV, String(r.rev || 0)); }
  return r;
}

/* 別の端末から、引き継ぎID＋パスワードで入り直す */
export async function claim(code, pass) {
  const r = await call('/v1/link/claim', { method: 'POST', auth: false,
    body: { device: deviceKey(), code, pass } });
  if (r.ok && r.token) { ls.set(LS_TOK, r.token); ls.set(LS_REV, String(r.rev || 0)); }
  return r;
}

export const setPass = (pass) => call('/v1/link/pass', { method: 'POST', body: { pass } });
export const pullSave = () => call('/v1/save');

/* 保存を入れる。版が食い違えば 409 とサーバーの中身が返る。
   そのときは勝手に混ぜず、どちらを採るか画面で尋ねること */
export async function pushSave(blob) {
  const r = await call('/v1/save', { method: 'PUT', body: { rev: revOf(), blob } });
  if (r.ok && r.rev != null) ls.set(LS_REV, String(r.rev));
  return r;
}
/* サーバーのほうを採ると決めたとき。版だけ合わせてから入れ直す */
export async function pushSaveForce(blob, serverRev) {
  ls.set(LS_REV, String(serverRev));
  return pushSave(blob);
}

/* ---- 果たし合い（同期の対人戦）----
   盤は送らない。種と指図だけをやりとりして、両方の端末で同じ戦を回す */
export function duelJoin(duelId, { pid, name, team, seed }, on) {
  if (!KURA) return null;
  const ws = new WebSocket(KURA.replace(/^http/, 'ws') + `/v1/duel/${duelId}/ws`);
  const send = (o) => { try { ws.send(JSON.stringify(o)); } catch (_) {} };
  /* 間の印（duelId）は名乗りのときに預ける。間は休眠するので、
     あとから聞き直せるように storage に置いてもらう（2026-10-04） */
  ws.addEventListener('open', () => send({ t: 'join', duel: duelId, pid, name, team, seed }));
  ws.addEventListener('message', (e) => { try { on(JSON.parse(e.data)); } catch (_) {} });
  /* 繋ぎが切れたことも知らせる（2026-10-05）。
     黙って止まるのがいちばん困るので、画面に出して繋ぎ直せるようにする */
  ws.addEventListener('close', () => { try { on({ t: 'lost' }); } catch (_) {} });
  ws.addEventListener('error', () => { try { on({ t: 'lost' }); } catch (_) {} });
  return {
    send,
    cmd:   (c) => send({ t: 'cmd', cmd: c }),
    over:  (winner, reason) => send({ t: 'over', duel: duelId, winner, reason }),
    bye:   () => send({ t: 'bye' }),
    close: () => { try { ws.close(); } catch (_) {} },
  };
}
export const duelOpen = (team) => call('/v1/duel/open', { method: 'POST', body: { team } });

/* ---------------- 取引所（2026-10-05）----------------
   サーバーが受け持つのは「品の取り合い」と「売り上げを二度渡さないこと」。
   魂の残高は端末が持ったままなので、買うときは
     ① サーバーに押さえてもらう（mkTake）→ ② 返ってきたら端末の魂を減らす
   の順にする。逆にすると、押さえに負けたときに魂だけ消える。 */
export const mkShelf = () => call('/v1/market');
export const mkMine  = () => call('/v1/market/mine');
export const mkPut   = (no, cnt, st, price) =>
  call('/v1/market/list', { method: 'POST', body: { no, cnt, st, price } });
export const mkBack  = (id) => call('/v1/market/pull', { method: 'POST', body: { id } });
export const mkTake  = (id) => call('/v1/market/buy',  { method: 'POST', body: { id } });
export const mkPay   = () => call('/v1/market/claim',  { method: 'POST' });

/* ---------------- 友（2026-10-06）----------------
   ★引き継ぎID（WAN-…）は乗っ取りの鍵なので、友達さがしには出さない。
     人に見せてよい **主番号（tag）** をサーバーが別に配る。
   友は双方が頷いたときだけ結ぶ。願う → 相手が受ける → 両方の一覧に出る。 */
export const palMe   = (name, lv, face) =>
  call('/v1/pal/me', { method: 'POST', body: { name, lv, face } });
export const palList = () => call('/v1/pal');
export const palFind = (q) => call('/v1/pal/find?q=' + encodeURIComponent(q || ''));
export const palAsk  = (who) => call('/v1/pal/ask', { method: 'POST', body: who });
export const palOk   = (who) => call('/v1/pal/ok',  { method: 'POST', body: who });
export const palNo   = (who) => call('/v1/pal/no',  { method: 'POST', body: who });
export const palBye  = (who) => call('/v1/pal/bye', { method: 'POST', body: who });
export const palDuel = (who, code) =>
  call('/v1/pal/duel', { method: 'POST', body: { ...who, code } });
