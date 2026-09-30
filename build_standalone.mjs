// ダブルクリックで開ける1枚のHTMLを作る（2026-09-20）
//   node app/build_standalone.mjs
//   → app/わんこ大戦国.html
// Node もサーバも要らずにブラウザで遊べる。画像は app/assets/ を相対参照するので、
// このHTMLは app/ の直下に置いたまま使うこと。
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const APP = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(APP, '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
// import / export 行を落として、ひとつのスコープに並べられる形にする
const strip = p => read(p)
  .replace(/^\s*import\s[\s\S]*?from\s*['"][^'"]*['"];?[ \t]*\n/gm, '')   // 複数行の import も落とす
  .replace(/^\s*import[^\n]*\n/gm, '')
  .replace(/^export\s+/gm, '');
const dir = d => { try { return fs.readdirSync(path.join(APP, 'assets', d)); } catch { return []; } };

const manifest = { pawn: dir('pawn'), terrain: dir('terrain'), attr: dir('attr'), rarity: dir('rarity'), bg: dir('bg'), fx: dir('fx'), status: dir('status'), audio: dir('audio'), font: dir('font'), cutin: dir('cutin'), ui: dir('ui'), stat: dir('stat'), stage: dir('stage'), card: dir('card'), kamon: dir('kamon'), banner: dir('banner'), skillart: dir('skillart'), item: dir('item'), news: dir('news'), face: dir('face'), hero: dir('hero'), frame: dir('frame'),
  /* 札に重ねる数の置き場所（2026-09-27）。焼いた札には升の数値が入っていないので、
     この座標を見てアプリが今の値を描く。無くても札は出る */
  cardlay: (() => { try { return JSON.parse(read('app/assets/card/layout.json')); } catch { return {}; } })() };

let campaign = strip('app/src/campaign.js');
let player = strip('app/src/player.js');
let event = strip('app/src/event.js');   // 催し（2026-09-23）
let news = strip('app/src/news.js');     // お知らせ（2026-09-24）
let mission = strip('app/src/mission.js'); // お役目（2026-09-24）
let rank = strip('app/src/rank.js');       // 番付（2026-09-25）
let link = strip('app/src/link.js');       // 引き継ぎの備え（2026-09-25）
let gachas = strip('app/src/gachas.js'); // くじの一覧（2026-09-28）
let main = strip('app/src/main.js');
// fetch で読んでいたデータを、直接埋め込んだ定数に置き換える
main = main.replace(
  /const \[RULES, DB\] = await Promise\.all\(\[[\s\S]*?\]\);/,
  'const RULES = __RULES__;\nconst DB = __DB__;\nloadManifest();');

let replay = strip('app/src/replay.js');
// manifest.json を取りに行かず、埋め込んだ一覧を使う
replay = replay.replace(
  /async function loadManifest\(\) \{[\s\S]*?\n\}/,
  'function loadManifest() { MANIFEST = __MANIFEST__; }');
// 画像は HTML からの相対パスで引く
// 文字列の replace は1個目しか置き換えないので、必ず正規表現の g で回す。
// 同じフォルダを2か所から引くコードを足したとき、片方だけ直らずに画像が消えた（2026-09-21）
replay = replay
  .replace(/`\/app\/assets\//g, '`assets/')
  .replace(/'\/app\/assets\//g, "'assets/");

const js = [
  strip('sim/src/rng.mjs'),
  strip('sim/src/skills.mjs'),
  strip('sim/src/terrain.mjs'),
  strip('sim/src/engine.mjs'),
  replay,
  campaign,
  player,
  event,
  news,
  mission,
  rank,
  link,
  gachas,
  main,
].join('\n\n')
  .replace('__RULES__', () => read('sim/rules.json'))
  .replace('__DB__', () => read('sim/data/characters.json'))
  .replace('__MANIFEST__', () => JSON.stringify(manifest));

const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>わんこ大戦国</title>
<link rel="icon" href="icon-192-v2.png">
<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="#12100e">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="わんこ大戦国">
<link rel="apple-touch-icon" href="apple-touch-icon-v2.png">
<style>
${read('app/src/style.css').replaceAll("url('../assets/font/", "url('assets/font/")}
</style>
</head>
<body>
<div id="app"><div class="boot">読み込み中…</div></div>
<script type="module">
${js}
</script>
</body>
</html>`;
// 書き出す前に構文を確かめる。import の消し漏れなどをここで止める
try { new Function(js.replace(/\bawait\b/g, 'void 0 &&')); }
catch (e) { console.error('バンドルの構文エラー:', e.message); process.exit(1); }
const out = path.join(APP, 'わんこ大戦国.html');
fs.writeFileSync(out, html);
console.log(`${path.basename(out)} を作った: ${(html.length / 1024 / 1024).toFixed(2)} MB`);
console.log(`コマ画像 ${manifest.pawn.length}体 / 地形 ${manifest.terrain.length}種 を認識`);
