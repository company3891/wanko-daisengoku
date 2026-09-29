// 開発用のちいさなサーバ。app/ と sim/ の両方を配るだけ。
//   node app/serve.mjs  → http://localhost:5173
import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.mjs':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.json':'application/json; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp' };
const PORT = +(process.argv[2] || 5173);
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/app/index.html';
  // 素材の一覧。これが無いと画像の有無を1枚ずつ試すことになり、404が大量に出る
  if (p === '/app/assets/manifest.json') {
    const dir = d => { try { return fs.readdirSync(path.join(ROOT, 'app/assets', d)); } catch { return []; } };
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ pawn: dir('pawn'), terrain: dir('terrain'), attr: dir('attr'), rarity: dir('rarity'), bg: dir('bg'), fx: dir('fx'), status: dir('status'), audio: dir('audio'), font: dir('font'), cutin: dir('cutin'), ui: dir('ui'), stat: dir('stat'), stage: dir('stage'), card: dir('card') }));
    return;
  }
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); res.end('not found: ' + p); return;
  }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`http://localhost:${PORT}`));
