/* 留守番（Service Worker）── 電波が無くても開けるようにする（2026-10-05）
   きっかけ：機内モードでアプリを開くと、画面がまるごと読み込めなかった。
   中身（武将も持ち物も）は端末の中にあるのに、入れ物が降りてこないだけで遊べない。

   決めごと
   ・札（HTML）は **まず取りに行く**。取れたら新しいものを使い、覚える。
     取れなかったら覚えてあるものを出す。こうすると直したものが必ず届く。
   ・絵や書体は **まず覚えから**。無ければ取りに行って覚える（二度目から速い）。
   ・サーバー（別の家の字）には触らない。覚えもしない。
   ・どちらも駄目なときだけ「つながりませぬ」の紙を出す。

   直したら CACHE の数を上げること。上げないと古い覚えが残る。 */
const CACHE = 'wanko-v20';
const SHELL = ['./', './index.html', './manifest.webmanifest'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(() => {})));
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

const SORRY = `<!doctype html><html lang="ja"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>わんこ大戦国</title><style>
html,body{height:100%;margin:0;background:#12100e;color:#f5e2a8;
 font-family:system-ui,-apple-system,"Hiragino Sans",sans-serif}
div{height:100%;display:flex;flex-direction:column;gap:12px;
 align-items:center;justify-content:center;text-align:center;padding:24px}
b{font-size:20px;color:#d8a94a}p{font-size:14px;opacity:.8;line-height:1.8;margin:0}
button{margin-top:8px;padding:12px 28px;border-radius:10px;border:1px solid #d8a94a;
 background:#1b1814;color:#f5e2a8;font-size:15px}
</style></head><body><div>
<b>つながりませぬ</b>
<p>電波の届くところで、もう一度お試しくだされ。<br>
一度でも開いておけば、次からは電波が無くとも遊べまする。</p>
<button onclick="location.reload()">もう一度</button>
</div></body></html>`;

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // サーバーへの遣り取りは素通し

  /* 札（HTML）＝まず取りに行く。駄目なら覚えから。それも無ければ詫びの紙 */
  if (req.mode === 'navigate' || /\.html?$/.test(url.pathname)) {
    e.respondWith((async () => {
      try {
        const r = await fetch(req);
        const c = await caches.open(CACHE);
        c.put('./index.html', r.clone()); c.put('./', r.clone());
        return r;
      } catch (_) {
        const c = await caches.open(CACHE);
        return (await c.match('./index.html')) || (await c.match('./'))
            || new Response(SORRY, { headers: { 'content-type': 'text/html; charset=utf-8' } });
      }
    })());
    return;
  }

  /* 絵・書体・音＝まず覚えから。無ければ取りに行って覚える */
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const hit = await c.match(req);
    if (hit) return hit;
    try {
      const r = await fetch(req);
      if (r && r.ok && r.type === 'basic') c.put(req, r.clone());
      return r;
    } catch (_) {
      return new Response('', { status: 504 });
    }
  })());
});
