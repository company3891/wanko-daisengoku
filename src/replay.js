// 戦闘ログの再生（2026-09-20）
// engine が吐いたログをそのまま盤面アニメにする。ルールはここには一切書かない。
const TER = { PLAIN:'', ROAD:'', PAVED:'', CASTLE_PATH:'', FOREST:'森', SLOPE:'坂',
  MUD:'泥', SHALLOW_WATER:'浅', DEEP_WATER:'水', BRIDGE:'橋', GATE_OPEN:'門',
  WALL:'壁', GATE_CLOSED:'閉', MOAT:'堀', CLIFF:'崖', ROCK:'岩', BUILDING:'家' };
/* 同じ地形に、いくつも絵を持たせる（2026-09-26）。
   ここに並べた絵があれば、マスの位置で1枚を選ぶ。無ければ <記号>.png のまま。
   名前が _45 で終わる絵は「斜め45度から見た絵」なので、犬のコマと同じように
   盤面の傾きぶんだけ起こして、地面に立っているように見せる */
const TER_ALT = {
  FOREST: ['BIG_TREE_45.png'],
  WALL: ['CASTLE_WALL_45.png'],
};
/* <記号>.png のほかに <記号>_2.png / <記号>_45.png / <記号>_45_2.png … を置けば、
   何も書かなくても代わりの絵として拾う。TER_ALT は別名を使いたいときだけ */
function terFiles(code) {
  const all = MANIFEST.terrain || [];
  const re = new RegExp('^' + code + '(_45)?(_[0-9]+)?\\.(png|webp|jpg)$');
  const auto = all.filter(f => re.test(f));
  const named = (TER_ALT[code] || [])
    .map(f => all.includes(f) ? f : pickFile('terrain', f.replace(/\.[a-z]+$/i, '')))
    .filter(Boolean);
  /* 別名（TER_ALT）を先に、そのあと自動で見つけた絵。1枚しかなくても返す
     ――<記号>.png が無くて <記号>_45.png だけ置いてある場合があるため（2026-09-27） */
  /* 別名を指定したときは、素の <記号>.png は使わない（2026-09-27）。
     混ぜると 森に「立つ大樹」と「平らな四角」が並んでしまう */
  const bare = pickFile('terrain', code);
  return named.length ? named.concat(auto.filter(f => f !== bare && !named.includes(f)))
                      : auto;
}
/* 1マスより大きく描く物（2026-09-26）。橋は両岸まで架かるので縦に2マスぶん、
   かたまりの絵は少し大きくして隣と溶け合わせる */
/* 立たせる絵の大きさ（2026-09-27）。櫓は塀より高いので大きめに */
const STAND_SCALE = { BUILDING: 1.62, WALL: 1.12, GATE_OPEN: 1.35, FOREST: 1.0 };
const TER_SCALE = { BRIDGE: 1.9, MUD: 1.34, DEEP_WATER: 1.18, SHALLOW_WATER: 1.18, PAVED: 1.12, CASTLE_PATH: 1.12, ROAD: 1.1 };
/* 横2マスぶんの絵（2026-09-26）。`<記号>_W2.png`（横1024×縦512）を置くと、
   同じ地形が横に2つ並んでいるところに1枚で架ける。継ぎ目が消える。
   左から順に2つずつ取っていき、あまった1マスは これまでの1マスの絵で描く */
/* 素材の拡張子は問わない（2026-09-30）。
   webp → png → jpg の順に、置いてあるものを拾う。
   これで「png を置くだけ」も「webp を置くだけ」も同じように効く。
   ウェブに載せるとき、絵をまとめて webp に焼き直しても壊れないようにするため */
const EXTS = ['.webp', '.png', '.jpg', '.jpeg'];
function pickFile(kind, base) {
  const list = MANIFEST[kind] || [];
  for (const e of EXTS) if (list.includes(base + e)) return base + e;
  return null;
}
function pickUrl(kind, base, folder) {
  const f = pickFile(kind, base);
  return f ? `/app/assets/${folder || kind}/${f}` : null;
}
function pairFile(code, kind) {
  // 立たせる絵（_45）を先に見る。石垣のように2マスぶんで立つ絵があるため
  return pickFile('terrain', `${code}_${kind}_45`) || pickFile('terrain', `${code}_${kind}`);
}
const pairUrl = (code, kind) => { const f = pairFile(code, kind); return f ? `/app/assets/terrain/${f}` : null; };
/* 横（W2）を先に取り、あまったところを縦（V2）で取る。
   どちらも無い地形と、あまった1マスは これまでの1マスの絵で描く */
function widePairs(map, W, H) {
  const m = new Map();
  if (!map) return m;
  for (let y = 0; y < H; y++) for (let x = 0; x < W - 1; x++) {
    const a = map[y][x];
    if (a !== map[y][x + 1] || !pairUrl(a, 'W2')) continue;
    if (m.has(x + ',' + y) || m.has((x + 1) + ',' + y)) continue;
    m.set(x + ',' + y, 'W'); m.set((x + 1) + ',' + y, 'x');
    x++;
  }
  for (let x = 0; x < W; x++) for (let y = 0; y < H - 1; y++) {
    const a = map[y][x];
    if (a !== map[y + 1][x]) continue;
    if (!(pairUrl(a, 'V2') || (pairUrl(a, 'W2') && !NO_TURN.has(a)))) continue;
    if (m.has(x + ',' + y) || m.has(x + ',' + (y + 1))) continue;
    m.set(x + ',' + y, 'V'); m.set(x + ',' + (y + 1), 'x');
    y++;
  }
  return m;
}
// マスごとに裏返してよい地形（向きの決まっていないもの）
const FLIPPABLE = new Set(['FOREST','MUD','SHALLOW_WATER','DEEP_WATER','ROCK','MOAT','PAVED','CASTLE_PATH','ROAD']);
/* 上下も裏返してよいのは、光の向きが無い「面」だけ（2026-09-27）。
   岩・崖・坂のように上から光が当たった描き方の絵は、上下を返すと
   影が逆さになって、遊ぶ人から見て気持ち悪くなる。左右だけにする。
   ※盤は遊ぶ人の側から見た絵づくりでよい。敵陣からの見えかたは考えない */
const FLIP_Y = new Set(['MUD','SHALLOW_WATER','DEEP_WATER','PAVED','CASTLE_PATH','MOAT','ROAD']);
// 一面に広がる地形（縁を切り落として隣と繋げる）。橋・門・岩などの「物」は含めない
const SURFACE = new Set(['DEEP_WATER','SHALLOW_WATER','MOAT','MUD','FOREST','ROAD','PAVED','CASTLE_PATH','SLOPE']);
/* 縁を切り落とす（隣と繋げる）のは、四角いっぱいに塗ってある絵だけ（2026-09-26）。
   まわりが透けている「かたまり」の絵は、切ると せっかくの でこぼこが四角くなるので切らない */
const BLEED = new Set(['SHALLOW_WATER','MOAT']);
/* まわして縦に使ってはいけない絵（2026-09-26）。
   石畳のように目地の向きが決まっているものは、90度まわすと積み方が変わってしまう */
const NO_TURN = new Set(['PAVED', 'BRIDGE', 'WALL', 'GATE_OPEN']);
const ATTR_BG = { 猛将:'#d9544d', 智将:'#7a7ee0', 守将:'#4fa36b', 仁将:'#d98fc0', 神速:'#e0c04a' };

// 画像があれば使い、無ければ色で描く。app/assets/README.md の規格どおりに置けば勝手に差し替わる
const IMG = { pawn: n => pickUrl('pawn', String(n).padStart(3,'0')),
              terrain: c => pickUrl('terrain', c) };
// 画面から引くとき用。素材が無ければ null を返す
export function pawnUrl(no) {
  return pickUrl('pawn', String(no).padStart(3, '0'));
}
// カットインは専用の大きい絵があればそれを、無ければ盤面のコマを使う
// 状態異常アイコンの置き場所（ビルド時に相対パスへ書き換えられる）
function statusUrl(file) { return `/app/assets/status/${file}`; }
/* 状態異常の絵（2026-09-23）。盤面の外の顔の列でも使うので外に出した。
   素材が無ければ null を返すので、呼ぶ側は文字に落とす */
export function statusIconUrl(name) {
  const f = pickFile('status', name);
  return f ? statusUrl(f) : null;
}
// UI素材（奥義ボタン・総大将の印・ステータス変化の矢印）
/* ================= 盤面を傾ける（2026-09-21 改訂）=================
   盤面（地面ごと）を 32度 うしろへ倒してパースをつける。
   コマ・兵量・数字だけは同じ角度で起こし直すので、犬は地面に立ったまま
   真正面を向いて見える＝「キャラにはパースをかけない」。

   ・視点までの距離は盤面の幅の2倍。角度は --tilt（既定 32deg）
   ・回転の軸は盤面の下端。手前の列は大きさが変わらず、奥へいくほど縮む
   ・地面の絵（<テーマ>.jpg・正方形）は盤面の背景なので一緒に倒れる
   ・傾かない遠景は <テーマ>_背景.jpg（あれば）。無ければ暗い空だけ
   ・当たり判定はブラウザが変換ごと計算してくれるので、タップはそのまま効く */
export const TILT_DEG = 32;
export const PERSP_RATIO = 2;      // 視点距離 ÷ 盤面の幅
export function stageBgUrl(theme) {
  for (const ext of ['jpg', 'png', 'webp']) {
    const f = theme + '_背景.' + ext;
    if ((MANIFEST.stage || []).includes(f)) return `/app/assets/stage/${f}`;
  }
  return null;
}
/* 盤面の上から被せる「額縁」（2026-09-21）。
   中央の台形だけを抜いた遠景の絵。盤面の角と背景の継ぎ目を隠す。
   <テーマ>_枠.png を置くだけで効く。 */
export function stageFrameUrl(theme) {
  return pickUrl('stage', theme + '_枠');
}
/* iPhone だけコマが潰れる件（2026-09-30）。
   WebKit は、切り取り（overflow）のある入れ物の中に入ると
   3Dの組み立て（preserve-3d）を落としてしまうことがある。
   そうなると盤面の倒し（rotateX）は「2Dの縦つぶし」として残り、
   起こし直しの逆回転まで同じ向きの縦つぶしになって、犬が二重に潰れる。
   実際に潰れているかをその場で測り、潰れていたら 2D の引き伸ばしに切り替える。
   測り方：盤面の見かけの高さ÷本来の高さ（＝倒れ具合）と、
   起こしたはずの入れ物の同じ比を見くらべ、起きていなければ落ちている */
export function check3d(field) {
  if (!field || !field.classList.contains('tilt')) return;
  const board = field.querySelector('.board');
  const st = field.querySelector('.stand');
  if (!board || !st) return;
  const bh = board.offsetHeight, sh = st.offsetHeight;
  if (!bh || !sh) return;
  const tilt = board.getBoundingClientRect().height / bh;     // 倒れ具合（0.74 くらい）
  const stand = st.getBoundingClientRect().height / sh;        // 起きていれば 1 前後
  if (tilt > 0.98) return;                                     // そもそも倒れていない
  const flat = stand < tilt * 1.05;                            // 起きていない＝落ちている
  field.classList.toggle('flat3d', flat);
  // 倒れ具合は端末と画面の大きさで変わるので、測った値から引き伸ばしの量を決める
  if (flat) field.style.setProperty('--flatfix', (1 / Math.max(.4, tilt)).toFixed(3));
  else field.style.removeProperty('--flatfix');
}
export function fieldEl(board, theme, ...extras) {
  const f = document.createElement('div');
  f.className = 'field tilt';
  // 盤面が画面に出たあとで、3Dが効いているかを一度だけ測る
  setTimeout(() => check3d(f), 0);
  const bg = theme ? stageBgUrl(theme) : null;
  if (bg) {
    const b = document.createElement('div');
    b.className = 'fieldbg';
    b.style.backgroundImage = `url(${bg})`;
    f.append(b);
  }
  f.append(board);
  for (const e of extras) if (e) f.append(e);
  // 額縁は盤面の上に重ねる。中央は抜いてあるので盤面はそのまま見える
  const fg = theme ? stageFrameUrl(theme) : null;
  if (fg) {
    const g = document.createElement('div');
    g.className = 'fieldfg';
    g.style.backgroundImage = `url(${fg})`;
    f.append(g);
  }
  // 視点距離は盤面の幅から決める。幅が変わったら付け直す
  const fit = () => {
    const w = board.clientWidth;
    if (w) f.style.setProperty('--persp', Math.round(w * PERSP_RATIO) + 'px');
  };
  fit();
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(fit);
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(fit).observe(board);
  return f;
}

/* 属性・レアリティ・戦闘エフェクトの素材（2026-09-21）
   置いてなければ null を返すので、画面側は従来の文字や色に落ちる。
     app/assets/attr/<属性>.png      仁将・守将・智将・猛将・神速
     app/assets/rarity/<レア>.png    N・R・SR・SSR・UR
     app/assets/fx/<名前>.png        当たった場所に出す絵 */
/* 家紋（2026-09-21）。app/assets/kamon/<家名>.png を置くと全国の国の札に出る */
export function kamonUrl(house) {
  if (!house) return null;
  /* 「〜軍」は「〜家」に、家の字が無いものは「〜家」を足して探す（2026-09-28）。
     札を焼く build_card_v2.py は前からこの読み替えをしていたが、
     画面のほうは名前がぴったり合うときしか出しておらず、
     織田軍・豊臣・長宗我部などが紋ではなく頭文字の丸で出ていた。 */
  const cand = [house];
  if (house.endsWith('軍')) cand.push(house.slice(0, -1) + '家');
  if (!house.endsWith('家')) cand.push(house + '家');
  for (const k of cand) {
    const u = pickUrl('kamon', k);
    if (u) return u;
  }
  return null;
}
/* ガチャの帯の絵（2026-09-28）。app/assets/banner/<くじの印>.png を置くと
   ガチャ一覧の帯がその絵になる。無ければ金の枠と字の帯に落ちる */
export function bannerUrl(id) {
  if (!id) return null;
  return pickUrl('banner', id);
}
/* 道具の絵（2026-09-21）。app/assets/item/<品名>.png を置くと、
   所持アイテム・ショップ・素材欄の文字が絵に変わる。置かなければ従来の文字のまま */
export function itemUrl(name) {
  if (!name) return null;
  return pickUrl('item', name);
}
export function attrUrl(a) { return pickUrl('attr', a); }
export function rarUrl(r) { return pickUrl('rarity', r); }
export function fxUrl(name) { return pickUrl('fx', name); }
/* 当たった場所に絵を1枚出して、ふくらんで消える（2026-09-21）
   盤面が倒れていても絵は立たせたいので、外側の入れ物で起こす。
   中身は animate が transform を書き換えるため、二重にしてある。 */
export function fxBurst(cell, name, opt) {
  const url = fxUrl(name);
  if (!cell || !url) return 0;
  const o = opt || {};
  const ms = o.ms || 420, big = o.scale || 1;
  const w = document.createElement('span');
  w.className = 'fxw' + (o.cls ? ' ' + o.cls : '');
  const im = document.createElement('img');
  im.className = 'fximg'; im.src = url; im.alt = '';
  im.onerror = () => w.remove();
  w.append(im); cell.append(w);
  im.animate([
    { transform: `scale(${0.45 * big}) rotate(${o.spin ? -18 : 0}deg)`, opacity: 0 },
    { transform: `scale(${1.15 * big}) rotate(0deg)`, opacity: 1, offset: .28 },
    { transform: `scale(${1.0 * big}) rotate(0deg)`, opacity: .95, offset: .55 },
    { transform: `scale(${1.35 * big}) rotate(${o.spin ? 14 : 0}deg)`, opacity: 0 },
  ], { duration: pdur(ms), easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => w.remove();
  return pdur(ms);
}

/* その種類に置いてある絵の道を、まとめて返す（2026-09-30）。
   はじめに先読みするために使う。MANIFEST は外から見えないので、ここで包む */
export function assetUrlsOf(kind) {
  return (MANIFEST[kind] || [])
    .filter(f => /\.(webp|png|jpg|jpeg)$/i.test(f))
    .map(f => `/app/assets/${kind}/${f}`);
}
export function uiUrl(name) {
  /* webp を先に見る（2026-09-25）。置くだけで反映の決まりは変えず、
     軽いほうがあればそちらを使う */
  const list = MANIFEST.ui || [];
  for (const ext of ['.webp', '.png']) if (list.includes(name + ext)) return `/app/assets/ui/${name}${ext}`;
  return null;
}
// ステータスのアイコン（火力・賢さ・防御・回復・速さ）
export function statUrl(name) { return pickUrl('stat', name); }
/* くじの見せ場に使う絵（2026-10-01）。app/assets/gacha/ に置くだけで反映。
   ピックアップの紹介で使う切り抜き（pu_103.png など）はここに置く */
export function gachaUrl(name) { return pickUrl('gacha', name); }
/* キャラカード（2026-09-21）。表裏の2枚組で、元は1枚の絵を左右に分けたもの。
   一覧では表だけを出し、開いたときに表裏を並べて見せる。 */
export function cardUrl(no, side) {
  return pickUrl('card', `${String(no).padStart(3, '0')}_${side || 'front'}`);
}
/* 継いだ特技の絵（2026-09-27）。
   app/assets/skillart/<技名>.png を置けばそのまま出る。無ければ薄い囲いのまま。
   技名あたまの (属性) と ◆ は外した形で探す */
export function skillArtUrl(name) {
  const key = String(name || '').replace(/^\([^)]*\)\s*/, '').replace(/◆/g, '').trim();
  if (!key) return null;
  const list = MANIFEST.skillart || [];
  const f = list.find(x => x.replace(/\.[^.]+$/, '') === key) || list.find(x => x.includes(key));
  return f ? `/app/assets/skillart/${f}` : null;
}
/* 継いだ特技を描き替えるための、まっさらな和紙の切れはし（2026-09-27）。
   特技3枠のぶんを1枚にしてある。無ければ描き替えはあきらめ、焼いた字のまま出す */
export function cardPatchUrl(no) {
  return pickUrl('card', `${String(no).padStart(3, '0')}_patch`);
}
/* 札に重ねる「育てば変わる数」の置き場所（2026-09-27）。
   升の数値と特技の位は焼いていないので、ここの座標へアプリが今の値を重ねる。
   置き場所が無い札（古い焼き方のもの）は null が返り、これまでどおり焼いた数が出る */
export function cardLayout(no) {
  return ((MANIFEST.cardlay || {}).cards || {})[String(no).padStart(3, '0')] || null;
}
export const CARD_BASE = () => [(MANIFEST.cardlay || {}).w || 864, (MANIFEST.cardlay || {}).h || 1280];
/* まだ手に入れていない武将の共通カード（2026-09-21）
   「未奉公」＝まだ仕えていない、の意。図鑑などで中身を伏せて並べる。
   app/assets/card/未奉公_front.jpg ／ 未奉公_back.jpg */
export function unknownCardUrl(side) {
  return pickUrl('card', `未奉公_${side || 'front'}`);
}
// 画面の背景。素材が置かれていなければ null（仮の塗りで表示する）
// jpg でも png でも、置いてあるほうを拾う
export function bgUrl(name) {
  const list = MANIFEST.bg || [];
  for (const ext of ['jpg', 'png', 'webp']) {
    if (list.includes(name + '.' + ext)) return `/app/assets/bg/${name}.${ext}`;
  }
  return null;
}
/* 動く背景（2026-09-26）。app/assets/bg/<名>.mp4 を置くと、その画面の地紋が動く。
   無ければ今までどおり静止画に落ちるので、「絵が無くても動く」は崩れない */
/* 位ごとの見せ場の動画（2026-09-26）。app/assets/fx/rar_UR.mp4 などを置くと、
   CSSの光（光の筋・輪）の代わりにそれを流す。黒地の絵を screen で重ねる約束なので、
   透けた動画でなくてよい。無ければ これまでの CSS の光に落ちる（絵が無くても動く） */
export function fxVideoUrl(name) {
  const list = MANIFEST.fx || [];
  for (const ext of ['mp4', 'webm']) {
    if (list.includes(name + '.' + ext)) return `/app/assets/fx/${name}.${ext}`;
  }
  return null;
}
export function bgVideoUrl(name) {
  const list = MANIFEST.bg || [];
  for (const ext of ['mp4', 'webm']) {
    if (list.includes(name + '.' + ext)) return `/app/assets/bg/${name}.${ext}`;
  }
  return null;
}

// 状態変化・ステータス変化が複数あるとき、0.5秒ごとに1つずつ見せる（2026-09-20）
// 全コマ共通のタイマーで回すので、盤面じゅうの表示が同じ拍で切り替わる。
const CYCLE_MS = 500;
let ST_STEP = 0;
/* 複数あるときは並べずに、0.5秒ごとに1つずつ見せる（2026-09-20）。
   盤面の外の顔の列の状態異常（.rbad）からも呼ぶので外に出した（2026-09-23） */
/* 状態異常の絵が無いときの一字（2026-10-04）。盤のコマの頭の上で使う */
const ST_MARK = { 炎上: '炎', 感電: '電', 混乱: '乱', ひるみ: '怯', 回復不能: '癒', 挑発: '挑', 洗脳: '💕', 伏兵: '👣' };
export function stFace(st) {
  const kids = st.children;
  if (!kids.length) return;
  const i = kids.length === 1 ? 0 : ST_STEP % kids.length;
  for (let k = 0; k < kids.length; k++) kids[k].style.display = k === i ? '' : 'none';
  st.classList.toggle('multi', kids.length > 1);
}
if (typeof document !== 'undefined') setInterval(() => {
  ST_STEP++;
  for (const st of document.querySelectorAll('.rbad,.rmod,.pst')) stFace(st);
}, CYCLE_MS);

/* 表情の顔（2026-09-25）。app/assets/face/<番号>_<表情>.png
   表情は 通常／笑顔／怒り／驚き／真剣／不敵 の6つ。
   置いてある武将だけ顔が変わり、無い武将はこれまでどおりコマ絵に落ちる。
   「絵が無くても動く」を崩さないため、ここでも必ず null を返せるようにしてある */
export const FACES = ['通常', '笑顔', '怒り', '驚き', '真剣', '不敵'];
/* 軽いほうから探す（2026-09-25）。同じ絵でも webp は png の1/7ほどで、
   画面では幅393pxでしか出ないので見分けがつかない。
   ただし「png を置くだけで映る」決まりは崩さないので、webp が無ければ png を見る。
   名が当たらないよう assetPick という長めの名にしてある（束ねると一つの入れ物になるため） */
function assetPick(folder, base) {
  const list = MANIFEST[folder] || [];
  for (const ext of ['.webp', '.png']) if (list.includes(base + ext)) return `/app/assets/${folder}/${base}${ext}`;
  return null;
}
export function faceUrl(no, kind) {
  return assetPick('face', `${String(no).padStart(3, '0')}_${kind || '通常'}`);
}
/* 一枚絵のカットイン（2026-09-25）。app/assets/cutin/<番号>_<種>.webp（png も可）
   種は 攻撃／固有／特技／奥義。横長（1080×約520）の絵をそのまま敷き、
   技名はその上に重ねる。無ければこれまでどおり「顔＋右に文字」の形に落ちる */
export function cutinArt(no, kind) {
  return assetPick('cutin', `${String(no).padStart(3, '0')}_${kind}`);
}
/* はじまりの名乗りに使う横長の一枚絵（2026-09-25）。app/assets/hero/<番号>.webp
   設定画のいちばん上にある絵。無ければ出さない */
/* 称号の額（2026-09-25）。app/assets/frame/<称号>.webp（png も可）。
   真ん中は抜いてある256角の絵で、顔の上に重ねる。
   無ければ ui/player_frame に落ち、それも無ければ金の細い縁だけになる */
export function frameUrl(title) {
  return title ? assetPick('frame', String(title)) : null;
}
export function heroUrl(no) {
  return assetPick('hero', String(no).padStart(3, '0'));
}
export function cutinUrl(no) {
  return pickUrl('cutin', String(no).padStart(3, '0')) || pawnUrl(no);
}
let MANIFEST = { cardlay: {}, pawn: [], terrain: [], attr: [], rarity: [], bg: [], fx: [], status: [], audio: [], cutin: [], ui: [], stat: [], stage: [], card: [], face: [], hero: [], frame: [] };
export async function loadManifest() {
  try { MANIFEST = await fetch('/app/assets/manifest.json').then(r => r.json()); } catch { /* 素材なしでも動く */ }
}
function useImage(kind, file, url, on) {
  if (!(MANIFEST[kind] || []).includes(file)) return;
  on(url);
}

/* 盤面（2026-09-21 改訂）
   地面は「盤面ぜんたいで1枚」の正方形の絵（app/assets/stage/<テーマ>.jpg）を敷く。
   合戦では盤面ごと32度倒すので、地面も一緒に倒れる＝絵は真俯瞰のままでよい。
   障害物は1マスぶんの透過アイコンを、その上に重ねる。
   こうしておくと、ランダムに置き換わる障害物と地面の絵を別々に作れる。 */
export function stageUrl(theme) {
  for (const ext of ['jpg', 'png', 'webp']) {
    if ((MANIFEST.stage || []).includes(theme + '.' + ext)) return `/app/assets/stage/${theme}.${ext}`;
  }
  return null;
}
/* 盤面ちがい25枚を、そのまま1枚の絵で描く（2026-09-26）。
   `app/assets/stage/<地>_0.jpg` 〜 `_4.jpg` を置くと、その顔ぜんぶを
   描き込んだ一枚絵として敷き、マスには何も重ねない。
   絵かきが川筋も林もまとめて描くので、合成では出せない見ばえになる。
   どれか1枚だけ置いてもよい。無い顔は これまでの作りに落ちる。 */
export function stageArtUrl(theme, v) {
  if (v == null || v < 0) return null;
  for (const ext of ['webp', 'jpg', 'png']) {
    const f = `${theme}_${v}.${ext}`;
    if ((MANIFEST.stage || []).includes(f)) return `/app/assets/stage/${f}`;
  }
  return null;
}
/* 何も置いていない地面（2026-09-26）。
   `app/assets/stage/<テーマ>_無地.jpg` を置くと、そちらを敷いたうえで
   障害物を1マスずつの絵で描く＝盤面ちがい25枚が見た目にも出るようになる。
   いまの一枚絵（草原.jpg など）は障害物まで描き込んであるので、
   それを敷いているあいだは重ねない（二重に見えるため）。
   置くだけで切り替わる。無ければ これまでどおり。 */
export function plainStageUrl(theme) {
  for (const ext of ['jpg', 'png', 'webp']) {
    if ((MANIFEST.stage || []).includes(theme + '_無地.' + ext)) return `/app/assets/stage/${theme}_無地.${ext}`;
  }
  return null;
}
/* 一面ものの「面の絵」（2026-09-26）。
   `app/assets/terrain/<記号>_面.png` を置くと、盤面ぜんぶ分（9×9）の1枚絵として扱い、
   各マスは その絵の「自分の位置の切り抜き」を見せる。
   同じ絵を並べないので、川も森も端から端まで繋がって見える。
   ふちは これまでの1マスの絵（DEEP_WATER.png など）の透け具合を型紙に使うので、
   角ばらずに地面へ溶ける。型紙が無ければ四角いまま。 */
export function terrainSheetUrl(code) {
  for (const ext of ['webp', 'png', 'jpg']) {
    const f = code + '_面.' + ext;
    if ((MANIFEST.terrain || []).includes(f)) return `/app/assets/terrain/${f}`;
  }
  return null;
}
export function boardEl(rules, theme, opt) {
  const W = rules.board.width, H = rules.board.height;
  const map = rules.stage && rules.stage.map;
  const box = document.createElement('div');
  box.className = 'board';
  // 地面の絵は盤面にそのまま敷く。合戦では盤面ごと傾くので、地面も一緒に傾く。
  /* 無地の地面があればそちらを敷き、障害物はマスごとの絵で描く（2026-09-26）。
     無ければ これまでの一枚絵（障害物まで描き込んである）を敷いて、マスには重ねない */
  /* 顔ごとの一枚絵があれば、それがいちばん強い（2026-09-26）。
     次が「無地の地面＋マスの絵」、最後がこれまでの地ごとの一枚絵 */
  const painted = theme ? stageArtUrl(theme, rules.stage && rules.stage.variant) : null;
  const bare = painted ? null : (theme ? plainStageUrl(theme) : null);
  const gnd = painted || bare || (theme ? stageUrl(theme) : null);
  /* 地面の絵は疑似要素に回す（2026-09-21）。
     こうすると絵だけに「縁のぼかし」をかけられて、駒は薄くならない */
  if (gnd) { box.classList.add('art'); box.style.setProperty('--gnd', `url(${gnd})`); }
  if (opt && opt.flat) box.classList.add('flat');
  const wide = widePairs(map, W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const code = (map && map[y] && map[y][x]) || 'PLAIN';
    const c = document.createElement('div');
    c.className = 'cell t-' + code;
    c.dataset.xy = x + ',' + y;
    if (TER[code]) { const s = document.createElement('span'); s.className = 'ter'; s.textContent = TER[code]; c.append(s); }
    /* 地面の絵に障害物まで描いてあるときは、上にアイコンを重ねない（2026-09-21）。
       岩や川が絵に溶け込んでいるほうが綺麗なので、絵があるほうを優先する。
       絵が無いステージは今までどおり1マスぶんのアイコンを重ねる。 */
    if (gnd && !bare) { c.querySelector('.ter')?.remove(); }
    else if (code !== 'PLAIN' && !(SURFACE.has(code) && terrainSheetUrl(code))) {
      /* 位置から絵を1枚選ぶ。同じ盤面はいつ見ても同じ顔になる */
      const w2p = wide.get(x + ',' + y);
      if (w2p === 'x') { c.querySelector('.ter')?.remove(); box.append(c); continue; }
      const alts = terFiles(code);
      const hh = ((x * 73856093) ^ (y * 19349663) ^ (code.length * 83492791)) >>> 0;
      /* 縦2マスの絵が無いときは、横2マスの絵を90度まわして使う（2026-09-26）。
         波のように向きの無い絵なら、これで縦の並びにも架けられる */
      const turn = w2p === 'V' && !pairUrl(code, 'V2');
      // 上下に続く石垣は、奥へ走る向きに立てる
      const file = w2p ? pairFile(code, (turn ? 'W' : w2p) + '2')
                     : (alts.length ? alts[hh % alts.length] : pickFile('terrain', code));
      if (!file) { box.append(c); continue; }
      useImage('terrain', file, `/app/assets/terrain/${file}`, u => {
        c.querySelector('.ter')?.remove();
        const w2 = document.createElement('span');
        // 水や森のように一面に広がるものは、少し大きく描いて縁を切り落とす。
        // そうしないとマスごとに縁が見えて、隣と繋がらない（2026-09-21）
        const up = /_45\.(png|webp|jpg)$/.test(file);   // 斜めから見た絵は起こして立たせる
        w2.className = 'terwrap' + (BLEED.has(code) && !w2p ? ' bleed' : '') + (up ? ' terstand' : '')
                     + (w2p === 'W' ? ' wide2' : w2p === 'V' ? (turn ? ' tall2 rot90' : ' tall2') : '')
;
        const im = document.createElement('img');
        im.className = 'terimg'; im.src = u; im.alt = '';
        /* 同じ絵が並ぶと判で押したように見えるので、マスごとに裏返す（2026-09-26）。
           位置から決めるので、同じ盤面はいつも同じ見た目になる。
           向きの決まっている物（橋・門・櫓・崖）と、立たせる絵はそのまま */
        if (TER_SCALE[code] && !up) {
          /* 1マスより大きく描く。かたまりの絵は こうすると隣と溶け合う（2026-09-26）。
             裏返しも足して、同じ形が並ばないようにする */
          /* 2マスぶんの絵は もともと大きいので、少しだけ広げる（2026-09-27） */
          const k = w2p ? 1.06 : TER_SCALE[code];
          const sx = (FLIPPABLE.has(code) && (hh & 1)) ? -k : k;
          const sy = (FLIP_Y.has(code) && (hh & 2)) ? -k : k;
          w2.style.transform = `scale(${sx},${sy})`;
        } else if (FLIPPABLE.has(code) && !up) {
          const sx = (hh & 1) ? -1 : 1, sy = (FLIP_Y.has(code) && (hh & 2)) ? -1 : 1;
          /* 入れ物のほうを裏返す。中の絵には bleed の 1.16 倍が掛かっているので、
             絵に直接書くと その拡大を打ち消してしまう */
          if (sx < 0 || sy < 0) w2.style.transform = `scale(${sx},${sy})`;
        } else if (up) {
          /* 立たせる絵は、左右の入れ替えと大きさのばらつきで同じ顔を避ける（2026-09-26）。
             木が一列に並んでも、背丈と向きが違えば判で押したようには見えない */
          /* 大きさは入れ物のほうに掛ける（2026-09-27）。
             絵に掛けると、はみ出したぶんが入れ物に切られて屋根が欠ける。
             背丈のばらつきは木だけ。櫓や塀は同じ高さでそろえる */
          const base = STAND_SCALE[code] || 1;
          const big = base * (code === 'FOREST' ? 1 + ((hh >> 3) % 5) * 0.07 : 1);
          w2.style.setProperty('--st', (big * 1.18).toFixed(3));
          if (code === 'FOREST') {
            const dx = (((hh >> 6) % 5) - 2) * 3;
            if (dx) w2.style.marginLeft = dx + '%';
          }
          if (hh & 1) im.style.transform = 'scaleX(-1)';   // 左右だけ入れ替える
        }
        im.onerror = () => w2.remove();
        w2.append(im);
        c.prepend(w2);
      });
    }
    box.append(c);
  }
  /* 面の絵は「その地形のマスの集まり」の形で抜く（2026-09-26）。
     マスごとに抜くと角の丸い札を並べたように見えてしまうので、
     ひとまとまりにして、ぼかし→閾値で輪郭を作り、さらに ゆらぎで岸をくずす。
     深い水は浅瀬より後に描いて、境目が浅瀬へ溶けるようにする。 */
  for (const code of SHEET_ORDER) {
    const url = terrainSheetUrl(code);
    if (!url) continue;
    const cells = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++)
      if (((map && map[y] && map[y][x]) || 'PLAIN') === code) cells.push([x, y]);
    if (!cells.length) continue;
    const ov = document.createElement('div');
    ov.className = 'tersheet';
    ov.style.backgroundImage = `url(${url})`;
    const mk = regionMask(cells, W, H, code);
    ov.style.webkitMaskImage = mk; ov.style.maskImage = mk;
    box.prepend(ov);
  }
  return box;
}

/* 一面ものを描く順。下にあるものから。深い水はいちばん上 */
const SHEET_ORDER = ['PAVED', 'CASTLE_PATH', 'MUD', 'SLOPE', 'FOREST', 'SHALLOW_WATER', 'MOAT', 'DEEP_WATER'];
/* ゆらぎの強さ。水はよく崩し、石畳は崩さない */
const EDGE = {
  DEEP_WATER: [0.22, 0.52], SHALLOW_WATER: [0.22, 0.52], MOAT: [0.14, 0.18],
  FOREST: [0.24, 0.60], MUD: [0.24, 0.60], SLOPE: [0.18, 0.28],
  PAVED: [0.05, 0.03], CASTLE_PATH: [0.10, 0.14],
};
function regionMask(cells, W, H, code) {
  const [blur, wob] = EDGE[code] || [0.18, 0.24];
  const seed = code.length * 7 + cells.length;
  const rects = cells.map(([x, y]) => `<rect x="${x - 0.02}" y="${y - 0.02}" width="1.04" height="1.04"/>`).join('');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">` +
    `<filter id="f" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">` +
    `<feGaussianBlur stdDeviation="${blur}" result="b"/>` +
    `<feComponentTransfer in="b" result="t"><feFuncA type="linear" slope="9" intercept="-3.6"/></feComponentTransfer>` +
    `<feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="4" seed="${seed}" result="n"/>` +
    `<feDisplacementMap in="t" in2="n" scale="${wob}" xChannelSelector="R" yChannelSelector="G"/>` +
    `</filter>` +
    `<g filter="url(#f)" fill="#fff">${rects}</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function pawns(board, initial) {
  const map = new Map();
  for (const u of initial) {
    /* 天守（2026-10-02）。盤に立つ「動かない的」。
       中身は一マスだが、絵は三マス幅で立てて見上げる大きさにする。
       絵が無ければ黒漆の櫓の形に落ちる（絵が無くても動く、は崩さない） */
    if (u.isKeep) {
      const k = document.createElement('div');
      k.className = 'pawn keep';
      const art = pickUrl('terrain', '天守');
      if (art) {
        const img = document.createElement('img');
        img.src = art; img.alt = '天守'; img.draggable = false;
        img.onerror = () => { img.remove(); k.classList.add('bare'); };
        k.append(img);
      } else k.classList.add('bare');
      const bar = document.createElement('span');
      bar.className = 'khp';
      bar.append(document.createElement('i'));
      k.append(bar);
      map.set(u.id, k);
      continue;
    }
    const p = document.createElement('div');
    p.className = 'pawn ' + u.side + (u.isGeneral ? ' gen' : '');
    p.style.background = ATTR_BG[u.attr] || '#888';
    /* 盤面を倒しても犬は立たせる（2026-09-21）。
       絵・名前・兵量は .stand に入れて同じ角度だけ起こし直す。
       足もとの影と輪は .pawn 側に残すので、地面に貼りついたまま倒れる。
       動き（突進・被弾・移動）は .pawn の transform を使うため、
       起こし直しは別の入れ物でやらないと消えてしまう。 */
    const st0 = document.createElement('div');
    st0.className = 'stand';
    // 兵量の帯はコマに出さない（2026-09-23）。盤面の外の顔の列に数字で出る
    st0.innerHTML = `<span class="n">${u.name.slice(0, 5)}</span>`;
    p.append(st0);
    /* 総大将は「のぼりを背負う」（2026-09-29）。
       丸い印より、どちらの大将かが遠目で分かる。
       自軍が青、敵将が赤に入れ替えた（2026-09-30）。
       地図の制覇ののぼりが赤だと紙の色と同化して見えなかったので、
       制覇＝青にそろえ、戦いの画面もそちらに合わせた。
       のぼりの絵が無いときだけ、これまでの丸い印に落ちる（絵が無くても動く）。
       ※ innerHTML のあとに足すこと。先に足すと中身ごと消える */
    if (u.isGeneral) {
      const nob = uiUrl(u.side === 'B' ? 'nobori_赤' : 'nobori_青');
      if (nob) {
        const g = document.createElement('img');
        g.className = 'nobori'; g.src = nob; g.alt = '総大将';
        g.onerror = () => g.remove();
        // 犬の後ろに出すため、中身のいちばん前に差し込む
        st0.prepend(g);
        p.classList.add('hasnob');
      } else {
        const mk = uiUrl(u.side === 'B' ? 'general_mark_red' : 'general_mark_blue') || uiUrl('general_mark');
        if (mk) {
          const g = document.createElement('img');
          g.className = 'gmark'; g.src = mk; g.alt = '総大将';
          g.onerror = () => g.remove();
          st0.append(g);
        }
      }
    }
    // 2頭身スプライトがあれば、足元をマスの下端に合わせて立たせる。
    // 無ければ従来どおり属性色の角丸コマ。
    useImage('pawn', pickFile('pawn', String(u.no).padStart(3,'0')) || '', IMG.pawn(u.no) || '', url => {
      p.classList.add('sprite');
      p.querySelector('.n')?.remove();
      const img = document.createElement('img');
      img.src = url; img.alt = ''; img.draggable = false;
      // 読めなかったら元の色コマに戻す（壊れた画像アイコンを出さない）
      img.onerror = () => {
        p.classList.remove('sprite');
        img.remove(); p.querySelector('.ring')?.remove();
        if (!p.querySelector('.n')) st0.prepend(Object.assign(document.createElement('span'),
          { className: 'n', textContent: u.name.slice(0, 5) }));
      };
      const ring = document.createElement('span'); ring.className = 'ring';
      st0.prepend(img); p.append(ring);   // 輪は地面に残す
    });
    map.set(u.id, p);
  }
  return map;
}

// ログをターンごとに束ねる。snapshot が盤面の真の状態、それ以外は演出
export function byTurn(log) {
  const turns = [];
  let cur = null;
  for (const e of log) {
    if (e.type === 'snapshot') { cur = { turn: e.turn, units: e.units, events: [] }; turns.push(cur); continue; }
    if (!cur) { cur = { turn: 0, units: [], events: [] }; turns.push(cur); }
    cur.events.push(e);
  }
  return turns;
}

export function render(board, pawnMap, snapUnits, rules) {
  const W = rules.board.width;
  for (const u of snapUnits) {
    const p = pawnMap.get(u.id);
    if (!p) continue;
    const cell = board.children[u.y * W + u.x];
    if (p.parentElement !== cell) cell.append(p);
    cell.style.zIndex = String(u.y + 1);      // 手前の列が奥の列に重なる
    /* 天守の帯（2026-10-02）。天守は盤の外の顔の列に出ないので、
       残りの兵量は城そのものに重ねて見せる。落ちたら盤から消す（落城） */
    if (p.classList.contains('keep')) {
      const i = p.querySelector('.khp > i');
      const pct = Math.max(0, Math.min(100, u.maxHp ? u.hp / u.maxHp * 100 : 0));
      if (i) i.style.width = pct + '%';
      p.classList.toggle('low', pct <= 30);    // 残りわずかは朱に（2026-10-03）
      p.style.display = u.alive ? '' : 'none';
      continue;
    }
    // 戦闘不能は盤面から消す。死体は残さない（逃走の演出は showEvent 側）
    if (u.alive) unflee(p);          // 生き返ったら走り去る動きを取り消す（2026-10-03）
    p.style.display = u.alive ? '' : 'none';
    p.classList.toggle('dead', !u.alive);
    /* 状態異常は、コマ絵の頭の上に出す（2026-10-04）。
       2026-09-23 に「盤には出さない」と決めたが、盤を見ているあいだ
       誰が何を受けているのか分からなかった。
       .stand の中に入れるので、盤を倒しても印だけは立ったまま出る。
       いくつも付いているときは、顔の列と同じ拍で一つずつ入れ替える。
       ステータスの上下（.mods）はこれまでどおり盤には出さない ──
       コマの上に矢印まで重ねると、何の印なのか読み取れなくなるため */
    const st0 = p.querySelector('.st'); if (st0) st0.remove();
    const mb0 = p.querySelector('.mods'); if (mb0) mb0.remove();
    const bad = (u.st || []).filter(Boolean);
    let pst = p.querySelector('.pst');
    if (!bad.length) { if (pst) pst.remove(); }
    else {
      const stand = p.querySelector('.stand') || p;
      if (!pst) { pst = document.createElement('span'); pst.className = 'pst'; stand.append(pst); }
      const key = bad.join(',');
      if (pst.dataset.k !== key) {
        pst.dataset.k = key;
        pst.textContent = '';
        for (const n of bad) {
          const url = statusIconUrl(n);
          const e2 = document.createElement(url ? 'img' : 'i');
          e2.className = 'psb' + (url ? ' art' : '');
          if (url) { e2.src = url; e2.alt = n; } else e2.textContent = ST_MARK[n] || n.slice(0, 1);
          e2.title = n;
          pst.append(e2);
        }
        stFace(pst);
      }
    }

    // 古い保存から来た帯が残っていたら消しておく
    const bar0 = p.querySelector('.hp');
    if (bar0) bar0.remove();
    /* 盤面のコマには数字を出さない（2026-09-23）。
       一体ずつの兵量は盤面の外の顔の列に数字で出るので、盤面は帯だけにして見やすくする */
    const hpn0 = p.querySelector('.hpn');
    if (hpn0) hpn0.remove();
  }
}

const nameOf = (initial, id) => (initial.find(u => u.id === id) || {}).name || id;
export function describe(e, initial) {
  const n = id => nameOf(initial, id);
  switch (e.type) {
    case 'dmg': return { cls:'', s:`${n(e.src)} → ${n(e.tgt)} に ${e.v}${e.crit ? '（会心）' : ''}` };
    case 'ko': return { cls:'ko', s:`${n(e.tgt)} 戦闘不能` };
    case 'ult': return { cls:'ult', s:`${n(e.src)} 奥義！` };
    /* 控えにも固有の名を出す（2026-10-01）。継承した◆はマスタに無いので、
       エンジンが log に残した名を使う。頭の（属性）と末尾の◆は落とす */
    case 'unique': {
      const un = (e.skills || []).map(x => String(x)
        .replace(/^[（(][^）)]*[）)]\s*/, '').replace(/[◆◇]\s*$/, '')).filter(Boolean);
      return { cls:'ult', s:`${n(e.src)} 固有発動${un.length ? '　' + un.join('／') : ''}` };
    }
    case 'skill': return { cls:'', s:`${n(e.src)} ${e.name}` };
    case 'move': return { cls:'', s:`${n(e.src)} 移動 (${e.x},${e.y})` };
    case 'retreat': return { cls:'', s:`${n(e.src)} 後退` };
    case 'swap': return { cls:'', s:`${n(e.src)} 陣中交代` };
    case 'status': return { cls:'', s:`${n(e.tgt)} に ${e.name}` };
    case 'burn': return { cls:'ko', s:`${n(e.tgt)} 炎上 ${e.v}` };
    case 'counter': return { cls:'', s:`${n(e.src)} 反撃` };
    case 'cover': return { cls:'heal', s:`${n(e.src)} が ${n(e.tgt)} をかばう` };
    case 'eva': return { cls:'', s:`${n(e.tgt)} 回避` };
    case 'endure': return { cls:'heal', s:`${n(e.tgt)} 兵量1で耐える` };
    case 'revive': return { cls:'heal', s:`${n(e.tgt)} 復活` };
    case 'supportFire': return { cls:'', s:`${n(e.src)} 援護射撃` };
    case 'charge': return { cls:'', s:`${n(e.src)} 一騎駆け` };
    case 'taunt': return { cls:'', s:`${n(e.src)} 挑発` };
    case 'bond': return { cls:'heal', s:`縁：${e.name}（${e.kind}）` };
    case 'shapeAtk': return { cls:'', s:`${n(e.src)} 範囲攻撃` };
    case 'aoeSplit': return { cls:'', s:`範囲 ${e.n}体に頭割り` };
    case 'withdraw': return { cls:'ko', s:`${n(e.src)} 撤退` };
    default: return null;
  }
}


/* ===== 動き（2026-09-20）=====
   立ち絵1枚だけで、移動・踏み込み・被弾・戦闘不能を作る。
   キャラごとの攻撃ポーズは要らない。 */

// FLIP: 先に位置を測り、移した後で「元の位置」へ戻してから0へ遷移させる。
// これで DOM を入れ替えただけの瞬間移動が、滑らかな移動に見える。
/* 移動のアニメ（2026-09-21 改訂）
   盤面を倒してからは、画面上の座標で動かすとズレる（コマの transform は
   倒れた盤面の中の座標で効くため）。マスの素の位置（offsetLeft/Top）で
   差を取れば、傾きがいくつでもぴったり合う。 */
export function flipMove(pawnMap, before, ms = 280) {
  for (const [id, p] of pawnMap) {
    const b = before.get(id);
    const c = p.parentElement;
    if (!b || !c) continue;
    const dx = b.x - c.offsetLeft, dy = b.y - c.offsetTop;
    if (!dx && !dy) continue;
    p.style.transition = 'none';
    p.style.transform = `translate(${dx}px,${dy}px)`;
    p.offsetHeight;                                   // 反映を確定させる
    p.style.transition = `transform ${ms}ms cubic-bezier(.3,.7,.3,1)`;
    p.style.transform = '';
    // 歩いている感じを足す（上下に小さく跳ねる）
    const img = p.querySelector('img');
    if (img) { img.style.animation = 'none'; img.offsetHeight; img.style.animation = `walk ${ms}ms ease-in-out`; }
  }
}
export function snapshotRects(pawnMap) {
  const m = new Map();
  for (const [id, p] of pawnMap) {
    const c = p.parentElement;
    if (c) m.set(id, { x: c.offsetLeft, y: c.offsetTop });
  }
  return m;
}

// 攻撃の踏み込み：相手の方向へ少し出て戻る
export function lunge(p, from, to) {
  if (!p) return;
  // 移動アニメ（FLIP）が外枠の transform を使うので、踏み込みは中の絵に掛ける
  const el = p.querySelector('img') || p;
  const dx = Math.sign(to.x - from.x) * 12, dy = Math.sign(to.y - from.y) * 12;
  el.animate([{ transform: 'translate(0,0)' },
             { transform: `translate(${dx}px,${dy}px)`, offset: .35 },
             { transform: 'translate(0,0)' }],
            { duration: pdur(320), easing: 'cubic-bezier(.2,.9,.3,1)' });
}
// 被弾：白く光って後ろへ下がる
export function hitFlash(p, dir) {
  if (!p) return;
  const el = p.querySelector('img') || p;
  el.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(3.2)', offset: .15 }, { filter: 'brightness(1)' }],
             { duration: pdur(260)});
  el.animate([{ transform: 'translate(0,0)' },
              { transform: `translate(${dir.x * 7}px,${dir.y * 7}px)`, offset: .25 },
              { transform: 'translate(0,0)' }], { duration: pdur(260)});
}
// ダメージの数字が浮く
export function popNumber(cell, text, cls) {
  if (!cell) return;
  const n = document.createElement('span');
  n.className = 'pop ' + (cls || '');
  n.textContent = text;
  // 盤面が倒れていても数字は立たせる。中身は animate が transform を
  // 書き換えるので、起こすのは外側の入れ物でやる（2026-09-21）
  const wrap = document.createElement('span');
  wrap.className = 'popwrap';
  wrap.append(n);
  cell.append(wrap);
  // 数字が他のマスの下に隠れないよう、出している間だけ手前に上げる
  const z0 = cell.style.zIndex;
  cell.style.zIndex = '60';
  setTimeout(() => { cell.style.zIndex = z0; }, 1200);
  const crit = (cls || '').includes('crit');
  // 会心は大きく出て、少し弾んでから消える
  const frames = crit
    ? [{ transform: 'translate(-50%,6px) scale(.35) rotate(-8deg)', opacity: 0 },
       { transform: 'translate(-50%,-10px) scale(1.55) rotate(3deg)', opacity: 1, offset: .16 },
       { transform: 'translate(-50%,-16px) scale(1.12) rotate(-1deg)', opacity: 1, offset: .3 },
       { transform: 'translate(-50%,-24px) scale(1.24) rotate(0deg)', opacity: 1, offset: .62 },
       { transform: 'translate(-50%,-52px) scale(1.1)', opacity: 0 }]
    : [{ transform: 'translate(-50%,0) scale(.7)', opacity: 0 },
       { transform: 'translate(-50%,-14px) scale(1.15)', opacity: 1, offset: .25 },
       { transform: 'translate(-50%,-34px) scale(1)', opacity: 0 }];
  n.animate(frames, { duration: pdur(crit ? 1150 : 900), easing: 'cubic-bezier(.2,.9,.3,1)' })
   .onfinish = () => wrap.remove();
  if (crit) {
    // 背後に光を一瞬だけ散らす
    const g = document.createElement('span');
    g.style.cssText = 'position:absolute;left:50%;bottom:52%;width:78px;height:78px;margin:-39px 0 0 -39px;' +
      'border-radius:50%;pointer-events:none;z-index:44;' +
      'background:radial-gradient(circle,#ffd23f66 0%,#ff8a1f33 40%,transparent 70%)';
    cell.append(g);
    g.animate([{ transform: 'scale(.3)', opacity: 0 }, { transform: 'scale(1.5)', opacity: 1, offset: .2 },
               { transform: 'scale(2.2)', opacity: 0 }], { duration: pdur(520)}).onfinish = () => g.remove();
  }
}
// 戦闘不能：死体を残さず、盤外へ走って逃げる（2026-09-20）
// side が 'A' なら手前（下）へ、'B' なら奥（上）へ。向きを反転して背を向けて走る。
/* 合戦の速さ（2026-09-24）
   main.js から渡す。1 が元の速さで、2 にすると動きもカットインもぜんぶ倍の長さになる。
   間（sleep）だけ伸ばすと、絵が終わったあとに待たされて間延びするので、絵のほうも伸ばす。 */
export let PMUL = 1;
export const setPlayMul = m => { PMUL = m > 0 ? m : 1; };
const pdur = ms => Math.round(ms * PMUL);  // 演出の長さ。skills.mjs の dur() と名前が当たるので pdur（2026-09-24）

/* 走り去る動きを取り消して、コマ絵をもとに戻す（2026-10-03）。
   fleeAway は fill:'forwards' で「消えたまま」止める作りなので、
   生き返ったときはここで取り消さないと、盤の上に絵が出てこない */
export function unflee(p) {
  if (!p || !p._flee) return;
  for (const a of p._flee) { try { a.cancel(); } catch (_) {} }
  p._flee = null;
}
export function fleeAway(p, side) {
  if (!p) return pdur(620);
  const el = p.querySelector('img') || p;
  const dir = side === 'A' ? 1 : -1;
  const flip = side === 'A' ? -1 : 1;     // 走り去る向きに体を向ける
  const away = el.animate([
    { transform: `translate(0,0) scaleX(${flip}) rotate(0deg)`, opacity: 1 },
    { transform: `translate(${dir * 4}px,${dir * -6}px) scaleX(${flip}) rotate(${dir * -8}deg)`, opacity: 1, offset: .12 },
    { transform: `translate(${dir * 18}px,${dir * 60}px) scaleX(${flip}) rotate(${dir * 6}deg)`, opacity: .9, offset: .5 },
    { transform: `translate(${dir * 34}px,${dir * 170}px) scaleX(${flip}) rotate(${dir * -4}deg)`, opacity: 0 },
  ], { duration: pdur(620), easing: 'cubic-bezier(.3,.1,.7,1)', fill: 'forwards' });
  // 走る足音がわりに上下に跳ねる
  const hop = p.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-4px)' },
             { transform: 'translateY(0)' }, { transform: 'translateY(-3px)' },
             { transform: 'translateY(0)' }], { duration: pdur(620), easing: 'linear' });
  /* 復活したときに取り消せるよう、動きを覚えておく（2026-10-03）。
     走り去る動きは fill:'forwards' で「消えたまま」止めてあるので、
     取り消さないかぎり、生き返ってもコマ絵が戻らなかった */
  p._flee = [away, hop];
  // 砂ぼこりを一瞬
  const dust = document.createElement('span');
  dust.className = 'dust';
  p.append(dust);
  dust.animate([{ transform: 'scale(.4)', opacity: .8 }, { transform: 'scale(1.8)', opacity: 0 }],
               { duration: pdur(520)}).onfinish = () => dust.remove();
  return pdur(620);
}
// 奥義：ぐっと大きくなって発光
export function ultFlare(p) {
  if (!p) return;
  const el = p.querySelector('img') || p;
  el.animate([{ transform: 'scale(1)', filter: 'brightness(1)' },
             { transform: 'scale(1.35)', filter: 'brightness(2.2) drop-shadow(0 0 12px #e0c04a)', offset: .3 },
             { transform: 'scale(1)', filter: 'brightness(1)' }],
            { duration: pdur(680), easing: 'ease-out' });
}


/* ===== 音（2026-09-20）=====
   音源ファイルを持たず、その場で合成する。1枚のHTMLのまま鳴らせる。 */
let AC = null, SOUND_ON = false;
/* 種類ごとの入り切りと大きさ（2026-09-28）。
   MIX[種類] は 0〜1。0 なら鳴らさない。
   もとの音を「BGM 平均 -21dB／環境音 -27dB」にそろえてあるので、
   ここの既定値がその埋め合わせになっている（下の bgm()/ambient() を見ること） */
const MIX = { bgm: .55, amb: .40, se: .70 };
const MIXON = { bgm: true, amb: true, se: true };
const mixOf = k => (MIXON[k] ? MIX[k] : 0);
/* 環境設定から呼ぶ。入り切りと大きさをまとめて渡す。
   鳴っている最中の BGM・環境音は、その場で音量を付け替える（切り替え待ちにしない） */
export function setMix(part) {
  for (const k of ['bgm', 'amb', 'se']) {
    if (part && part[k] && part[k].v != null) MIX[k] = Math.max(0, Math.min(1, part[k].v));
    if (part && part[k] && part[k].on != null) MIXON[k] = !!part[k].on;
  }
  for (const k of ['bgm', 'amb']) {
    const c = loops[k]; if (!c) continue;
    const v = mixOf(k);
    if (v <= 0) { c.pause(); c.vol(0); }
    else { c.vol(v); if (SOUND_ON) c.play(); }
  }
}
export const mixNow = () => ({ bgm: { on: MIXON.bgm, v: MIX.bgm },
                               amb: { on: MIXON.amb, v: MIX.amb },
                               se:  { on: MIXON.se,  v: MIX.se } });
export function soundEnabled(v) {
  if (v != null) SOUND_ON = v;
  if (!SOUND_ON) { for (const k of ['bgm', 'amb']) { const c = loops[k]; if (c) c.pause(); } }
  else { for (const k of ['bgm', 'amb']) { const c = loops[k]; if (c && mixOf(k) > 0) c.play(); } }
  if (SOUND_ON && !AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch { AC = null; } }
  if (AC && AC.state === 'suspended') AC.resume();
  return SOUND_ON;
}
function tone({ f = 440, to = null, dur = .12, type = 'square', gain = .06, delay = 0 }) {
  if (!SOUND_ON || !AC || mixOf('se') <= 0) return;
  gain *= mixOf('se') / .70;        // 既定 .70 を1倍とみなす（2026-09-28）
  const t0 = AC.currentTime + delay;
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t0);
  if (to) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + .008);
  g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
  o.connect(g).connect(AC.destination);
  o.start(t0); o.stop(t0 + dur + .02);
}
function noise({ dur = .12, gain = .05, delay = 0, hp = 900 }) {
  if (!SOUND_ON || !AC || mixOf('se') <= 0) return;
  gain *= mixOf('se') / .70;        // 既定 .70 を1倍とみなす（2026-09-28）
  const t0 = AC.currentTime + delay;
  const n = Math.floor(AC.sampleRate * dur);
  const buf = AC.createBuffer(1, n, AC.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = AC.createBufferSource(); src.buffer = buf;
  const f = AC.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
  const g = AC.createGain(); g.gain.setValueAtTime(gain, t0);
  src.connect(f).connect(g).connect(AC.destination);
  src.start(t0);
}
/* 音源ファイル（assets/audio/）。あればこちらを優先し、無ければ下の合成音に落ちる。
   SE は se_*.mp3 / BGM は bgm_*.mp3 / 環境音は amb_*.mp3 */
const AUDIO_BASE = '/app/assets/audio/';
const hasAudio = f => (MANIFEST.audio || []).includes(f);
const sePool = new Map();
function playFile(name, opt) {
  const f = name + '.mp3';
  if (!SOUND_ON || !hasAudio(f)) return false;
  const volume = mixOf('se') * ((opt && opt.vol) || 1);
  if (volume <= 0) return true;     // 切っているときは「鳴らした」ことにして合成音も出さない
  let pool = sePool.get(f);
  if (!pool) { pool = []; sePool.set(f, pool); }
  let a;
  /* 単声（solo）＝ 前に鳴っている同じ音を止めてから頭から鳴らし直す（2026-09-28）。
     特技は一手に何度も出るので、重ねると濁る。重ねずに鳴らし直せば粒が立つ */
  if (opt && opt.solo) {
    if (!pool.length) pool.push(new Audio(AUDIO_BASE + f));
    a = pool[0];
    try { a.pause(); } catch { /* まだ鳴っていないときは何もしない */ }
  } else {
    a = pool.find(x => x.paused || x.ended);
    if (!a) { a = new Audio(AUDIO_BASE + f); pool.push(a); }
  }
  a.volume = Math.min(1, volume); a.currentTime = 0;
  a.play().catch(() => {});
  // keep を渡すと、鳴らしている音そのものを返す（あとで止めたいときに使う）
  return (opt && opt.keep) ? a : true;
}
// BGMと環境音：それぞれ1本だけ鳴らし、切り替えは1秒でクロスさせる
const loops = { bgm: null, amb: null };
/* ---- 継ぎ目のない繰り返し（2026-09-30）----
   <audio loop> は、mp3 の頭と尻についた無音（符号化のときに必ず入る余白）ごと
   繰り返すので、一周するたびに ぷつっと切れて聞こえる。
   そこで Web Audio に読み込み、波形そのものを見て「鳴り始め」と「鳴り終わり」を探し、
   その間だけを回す。元の mp3 を焼き直さずに継ぎ目が消える。
   Web Audio が使えない・ほどけないときは、これまでどおり <audio> に落ちる */
const RAWC = new Map();        // 取ってきた元の中身。小さいので全部置いておく
const BUFC = new Map();        // ほどいた波形。重いので二本まで
function keepBuf(url, v) {
  BUFC.set(url, v);
  for (const k of [...BUFC.keys()]) { if (BUFC.size <= 2) break; if (k !== url) BUFC.delete(k); }
  return v;
}
async function loopBuf(url) {
  if (BUFC.has(url)) return BUFC.get(url);
  let raw = RAWC.get(url);
  if (!raw) { raw = await fetch(url).then(r => r.arrayBuffer()); RAWC.set(url, raw); }
  // slice しないと、ほどくときに中身を取られて二度目が読めなくなる
  const buf = await new Promise((ok, ng) => {
    const pr = AC.decodeAudioData(raw.slice(0), ok, ng);
    if (pr && pr.then) pr.then(ok, ng);
  });
  const [s, e] = loudEdges(buf);
  return keepBuf(url, { buf, s, e });
}
/* 頭と尻の無音を測る。-56dB あたりを「鳴っている」の目安にした。
   行き過ぎて音の立ち上がりを削らないよう、前後に2ミリ秒だけ残す */
function loudEdges(b) {
  const th = 0.0016, ch = b.numberOfChannels, n = b.length;
  const d = []; for (let c = 0; c < ch; c++) d.push(b.getChannelData(c));
  const loud = i => { for (let c = 0; c < ch; c++) if (Math.abs(d[c][i]) > th) return true; return false; };
  let s = 0, e = n - 1;
  while (s < n && !loud(s)) s++;
  while (e > s && !loud(e)) e--;
  if (s >= e) return [0, b.duration];
  const pad = Math.round(b.sampleRate * 0.002);
  return [Math.max(0, s - pad) / b.sampleRate, Math.min(n, e + 1 + pad) / b.sampleRate];
}
/* <audio> の一本（受け皿） */
function elLoop(name, url) {
  const a = new Audio(url);
  a.loop = true; a.volume = 0; a.preload = 'auto';
  const o = { name, el: a, want: false,
    play() { o.want = true; a.play().catch(() => {}); },
    pause() { o.want = false; try { a.pause(); } catch {} },
    paused: () => a.paused,
    vol(v) { a.volume = Math.max(0, Math.min(1, v)); },
    fade(to, ms) { elFade(a, to, ms); },
    stop() { o.want = false; elFade(a, 0, 800);
             setTimeout(() => { try { a.pause(); } catch {} }, 830); } };
  return o;
}
/* Web Audio の一本（本命） */
function waLoop(name, url, volume) {
  const g = AC.createGain(); g.gain.value = 0; g.connect(AC.destination);
  const o = { name, el: null, want: true, src: null, at: null, base: 0, seg: null, gain: g,
    vol(v) { const t = AC.currentTime; g.gain.cancelScheduledValues(t);
             g.gain.setValueAtTime(Math.max(0, Math.min(1, v)), t); },
    fade(to, ms) { const t = AC.currentTime; g.gain.cancelScheduledValues(t);
                   g.gain.setValueAtTime(g.gain.value, t);
                   g.gain.linearRampToValueAtTime(Math.max(0, Math.min(1, to)), t + ms / 1000); },
    paused: () => !o.src,
    /* いま曲のどこを鳴らしているか。留守から戻ったとき、続きから鳴らすために使う */
    pos() { if (!o.src || !o.seg) return null;
            const len = o.seg.e - o.seg.s;
            return len > 0 ? o.seg.s + ((AC.currentTime - o.base - o.seg.s) % len) : o.seg.s; },
    begin(from) {
      if (!o.seg || o.src) return;
      const { buf, s, e } = o.seg;
      const at = (from != null && from >= s && from < e) ? from : s;
      const src = AC.createBufferSource();
      src.buffer = buf; src.loop = true; src.loopStart = s; src.loopEnd = e;
      src.connect(g); src.start(0, at);
      o.src = src; o.base = AC.currentTime - at;
    },
    play() { o.want = true;
             if (AC.state === 'suspended') AC.resume().catch(() => {});
             if (!o.src) o.begin(o.at); },
    pause() { o.want = false; o.at = o.pos();
              if (o.src) { try { o.src.stop(); } catch {} try { o.src.disconnect(); } catch {} o.src = null; } },
    stop() { o.want = false; o.fade(0, 800);
             setTimeout(() => { if (o.src) { try { o.src.stop(); } catch {} o.src = null; }
                                try { g.disconnect(); } catch {} }, 830); } };
  const mine = () => loops.bgm === o || loops.amb === o;
  loopBuf(url).then(v => {
    if (!mine()) return;                    // 読んでいるあいだに曲が替わっていた
    o.seg = v;
    if (o.want) { o.begin(null); o.fade(volume, 800); }
  }).catch(() => {
    if (!mine()) return;
    const k = loops.bgm === o ? 'bgm' : 'amb';
    try { g.disconnect(); } catch {}
    const f = elLoop(name, url);            // ほどけなければ <audio> に落ちる
    loops[k] = f; f.play(); f.fade(volume, 800);
  });
  return o;
}
function playLoop(kind, name) {
  const f = name ? name + '.mp3' : null;
  const volume = mixOf(kind);
  const cur = loops[kind];
  if (cur && cur.name === f) { if (SOUND_ON && volume > 0) cur.play(); return; }
  if (cur) { cur.stop(); loops[kind] = null; }
  if (!f || !SOUND_ON || !hasAudio(f) || volume <= 0) return;
  const url = AUDIO_BASE + f;
  if (AC) { loops[kind] = waLoop(f, url, volume); return; }
  const o = elLoop(f, url);
  loops[kind] = o; o.play(); o.fade(volume, 800);
}
function elFade(a, to, ms) {
  const from = a.volume, t0 = performance.now();
  const step = () => { const k = Math.min(1, (performance.now() - t0) / ms);
    a.volume = Math.max(0, Math.min(1, from + (to - from) * k)); if (k < 1) requestAnimationFrame(step); };
  step();
}
/* 名は一つでも、並びで渡してもよい（2026-09-28）。
   並びのときは、置いてある最初の一本を鳴らす。
   画面ごとの曲を増やしても、その曲がまだ無ければ受け皿の bgm_home に落ちる。
   「絵が無くても動く」と同じで、曲が無くても音は途切れない */
const firstHave = (n) => {
  if (!n) return null;
  const list = Array.isArray(n) ? n : [n];
  return list.find(x => x && hasAudio(x + '.mp3')) || null;
};
/* 鳴らす大きさ（2026-09-28 に見直した）。
   音の元を「BGM は平均 -21dB／環境音は -27dB」にそろえたので、
   そのぶんここを上げて、耳に届く大きさは前と同じにしている。
   元を大きく作って山を潰すより、元は素直なままで ここで上げるほうがきれいに鳴る */
export function bgm(name) { playLoop('bgm', firstHave(name)); }
export function ambient(name) { playLoop('amb', firstHave(name)); }
export function stopAllLoops() { bgm(null); ambient(null); }

/* 画面を離れたら音を止める（2026-09-30）。
   iPhone の Safari は、ほかの画面へ移っても・本体を閉じても鳴りっぱなしになる。
   隠れたら止め、戻ってきたら「止める前に鳴っていたもの」だけ鳴らし直す。
   loops[kind].name を照らし合わせるので、留守のあいだに曲が変わっていれば鳴らさない */
let HIDDEN_LOOPS = null;
function soundSleep() {
  HIDDEN_LOOPS = {};
  for (const k of ['bgm', 'amb']) {
    const cur = loops[k];
    if (cur) { HIDDEN_LOOPS[k] = cur.name; cur.pause(); }   // 止める前に居場所を覚える
  }
  for (const pool of sePool.values()) for (const a of pool) {
    try { a.pause(); a.currentTime = 0; } catch { }
  }
  if (AC && AC.state === 'running') { try { AC.suspend(); } catch { } }
}
function soundWake() {
  const keep = HIDDEN_LOOPS; HIDDEN_LOOPS = null;
  if (!keep || !SOUND_ON) return;
  if (AC && AC.state === 'suspended') AC.resume().catch(() => { });
  for (const k of ['bgm', 'amb']) {
    const cur = loops[k];
    if (cur && keep[k] === cur.name && mixOf(k) > 0) cur.play();   // 続きから鳴らし直す
  }
}
/* 勝手に止まったのを起こし直す（2026-09-30）。
   iPhone は 電話・動画・Siri に割り込まれると、囃子が止まったまま戻らない。
   設定は「入」のままなので、遊ぶ人には ただ音が消えたようにしか見えない。
   触れたときと、数秒ごとに「鳴っているはずなのに止まっていないか」を見に行く */
function soundKick() {
  if (!SOUND_ON || HIDDEN_LOOPS) return;
  if (AC && AC.state === 'suspended') AC.resume().catch(() => { });
  for (const k of ['bgm', 'amb']) {
    const cur = loops[k];
    if (cur && mixOf(k) > 0 && cur.paused()) cur.play();
  }
}
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) soundSleep(); else soundWake();
  });
  /* iOS は本体を閉じたとき visibilitychange が来ないことがあるので、pagehide でも受ける */
  window.addEventListener('pagehide', soundSleep);
  window.addEventListener('pageshow', soundWake);
  for (const t of ['pointerdown', 'touchend', 'click', 'keydown'])
    document.addEventListener(t, soundKick, { passive: true, capture: true });
  setInterval(soundKick, 4000);
}

const SYNTH = {
  hit:  () => { noise({ dur: .09, gain: .05, hp: 1200 }); tone({ f: 190, to: 90, dur: .1, type: 'triangle', gain: .05 }); },
  crit: () => { noise({ dur: .14, gain: .08, hp: 800 }); tone({ f: 320, to: 110, dur: .18, type: 'sawtooth', gain: .07 }); },
  move: () => tone({ f: 620, to: 780, dur: .05, type: 'sine', gain: .025 }),
  heal: () => { tone({ f: 660, dur: .1, type: 'sine', gain: .04 }); tone({ f: 990, dur: .12, type: 'sine', gain: .03, delay: .07 }); },
  ko:   () => { tone({ f: 260, to: 70, dur: .45, type: 'sawtooth', gain: .06 }); noise({ dur: .3, gain: .04, hp: 400 }); },
  ult:  () => { [523, 659, 784, 1047].forEach((f, i) => tone({ f, dur: .26, type: 'triangle', gain: .05, delay: i * .07 })); },
  eva:  () => tone({ f: 900, to: 1400, dur: .07, type: 'sine', gain: .03 }),
  pick: () => tone({ f: 740, dur: .05, type: 'square', gain: .03 }),
  win:  () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone({ f, dur: .3, type: 'triangle', gain: .05, delay: i * .1 })),
  lose: () => [440, 392, 330, 262].forEach((f, i) => tone({ f, dur: .35, type: 'sine', gain: .05, delay: i * .13 })),
  /* ここから下は 2026-09-28 に足した口。
     se_<名>.mp3 を置けばその音になり、無ければ下の合成音が鳴る。
     get は前から呼ばれていたのに ここに無く、音を置いても鳴らなかった */
  get:  () => { tone({ f: 880, dur: .08, type: 'sine', gain: .04 }); tone({ f: 1320, dur: .12, type: 'sine', gain: .03, delay: .06 }); },
  pull: () => { tone({ f: 1480, to: 1760, dur: .09, type: 'sine', gain: .035 }); noise({ dur: .12, gain: .02, hp: 3000, delay: .04 }); },
  box:  () => { noise({ dur: .22, gain: .05, hp: 600 }); [392, 523, 659].forEach((f, i) => tone({ f, dur: .3, type: 'triangle', gain: .045, delay: .08 + i * .06 })); },
  coin: () => { [1180, 1560].forEach((f, i) => tone({ f, dur: .1, type: 'square', gain: .028, delay: i * .05 })); },
  ng:   () => tone({ f: 200, to: 150, dur: .16, type: 'square', gain: .035 }),
  march:() => { tone({ f: 330, to: 440, dur: .5, type: 'sawtooth', gain: .045 }); noise({ dur: .4, gain: .03, hp: 300, delay: .1 }); },
  /* 場面替わりのつなぎ（2026-09-28）。低い風が一度だけ吹き抜ける */
  tsunagi:() => { tone({ f: 140, to: 60, dur: .7, type: 'sine', gain: .05 });
                  noise({ dur: .5, gain: .018, hp: 200 }); },
  /* 落雷（2026-09-29）。嵐の日だけ、ときどき落ちる */
  kaminari:() => { noise({ dur: 1.2, gain: .05, hp: 60 });
                   tone({ f: 70, to: 40, dur: 1.4, type: 'sine', gain: .05 }); },
  /* 開戦の合図（2026-09-28）。法螺貝の代わりに、低い音をぐいと持ち上げて伸ばす */
  start:() => { tone({ f: 196, to: 294, dur: .35, type: 'sawtooth', gain: .05 });
                tone({ f: 294, dur: 1.1, type: 'sawtooth', gain: .045, delay: .3 });
                tone({ f: 587, dur: 1.1, type: 'triangle', gain: .022, delay: .3 }); },
};
export const SFX = {};
/* 連打しても重ならない音（2026-09-29）。
   押す音は 0.44秒あるので、続けて押すと何重にも鳴って濁る。
   前のを止めて頭から鳴らし直す */
const SOLO = new Set(['pick']);
for (const k of Object.keys(SYNTH)) {
  SFX[k] = () => { if (!SOUND_ON) return;
    if (!playFile('se_' + k, SOLO.has(k) ? { solo: true } : undefined)) SYNTH[k](); };
}
/* 位ごとの見せ場の音（2026-09-28）。se_rare_UR.mp3 のように位別に置ける。
   位別が無ければ se_rare.mp3、それも無ければ位に合わせた合成音に落ちる。
   「絵が無くても動く」と同じで、音が無くても遊べる */
const RARE_SYNTH = {
  N:   () => tone({ f: 523, dur: .18, type: 'sine', gain: .04 }),
  R:   () => [523, 784].forEach((f, i) => tone({ f, dur: .22, type: 'sine', gain: .04, delay: i * .08 })),
  SR:  () => [523, 784, 1047].forEach((f, i) => tone({ f, dur: .26, type: 'triangle', gain: .045, delay: i * .08 })),
  SSR: () => { [523, 659, 784, 1047].forEach((f, i) => tone({ f, dur: .3, type: 'triangle', gain: .05, delay: i * .08 }));
               noise({ dur: .5, gain: .025, hp: 2500 }); },
  UR:  () => { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone({ f, dur: .38, type: 'triangle', gain: .055, delay: i * .08 }));
               noise({ dur: .8, gain: .03, hp: 2000 }); tone({ f: 65, dur: .9, type: 'sine', gain: .05 }); },
};
/* 位の音は一本きり（2026-09-29）。
   UR は 6.6秒あるので、十連で次の札へ送ると前の音が鳴り残って重なる。
   新しい位の音を鳴らすときは、前の位の音を止めてから鳴らす */
let rareNow = null;
SFX.rare = (rarity) => {
  if (!SOUND_ON) return;
  if (rareNow) { try { rareNow.pause(); rareNow.currentTime = 0; } catch { /* まだ鳴っていない */ } rareNow = null; }
  const f = hasAudio('se_rare_' + rarity + '.mp3') ? 'se_rare_' + rarity
          : hasAudio('se_rare.mp3') ? 'se_rare' : null;
  if (f) { rareNow = playFile(f, { keep: true }) || null; return; }
  (RARE_SYNTH[rarity] || RARE_SYNTH.N)();
};
/* 固有特技の音を属性ごとに分ける（2026-09-28）。se_uniq_猛将.mp3 のように置ける。
   属性別が無ければ se_uniq.mp3、それも無ければ奥義の合成音に落ちる。
   猛将は太鼓の低い音、智将は鐘、守将は地を打つ音、仁将は鈴、神速は風切り音 */
/* 属性の音がどれになるか（2026-09-28）。
   se_uniq_<属性>.mp3 → se_uniq.mp3 → 無し、の順に探す */
const uniqFile = (attr) => {
  if (attr && hasAudio('se_uniq_' + attr + '.mp3')) return 'se_uniq_' + attr;
  if (hasAudio('se_uniq.mp3')) return 'se_uniq';
  return null;
};
/* 固有特技（2026-09-28）。属性の音をそのまま鳴らす */
SFX.uniq = (attr) => {
  if (!SOUND_ON) return;
  const f = uniqFile(attr);
  if (f) { playFile(f); return; }
  if (playFile('se_ult')) return;
  SYNTH.ult();
};
/* 特技（2026-09-28）。固有と同じ属性の音を使うが、
   一手に何度も出るので小さめ・単声にした。重ならないので続けて出ても濁らない */
SFX.waza = (attr) => {
  if (!SOUND_ON) return;
  const f = uniqFile(attr);
  if (f) { playFile(f, { vol: .55, solo: true }); return; }
  SYNTH.pick();
};
/* 奥義（2026-09-28）。その属性の音に、奥義の芯を重ねる。
   「固有を大きくしたものが奥義」と耳で分かるようにした。素材は足していない */
SFX.ougi = (attr) => {
  if (!SOUND_ON) return;
  const f = uniqFile(attr);
  if (f) playFile(f, { vol: .9 });
  if (!playFile('se_ult') && !f) SYNTH.ult();
};

/* ===== 奥義カットイン ===== */
export function cutIn(host, { name, skill, img, art, kind = 'ult' }) {
  // kind で大きさと長さを変える。奥義は全画面、固有は中、特技は小さな帯で盤面を止めない
  /* 固有も通常特技と同じ大きさにした（2026-09-30）。
     一枚絵をやめたのに帯だけ画面の34%のままで、中がすかすかに見えていた。
     どの技かは「固有発動」の筆文字で見分ける */
  const CONF = { ult: { ms: 1000, cls: 'ult' }, unique: { ms: 720, cls: 'mini uniq' }, skill: { ms: 480, cls: 'mini' } };
  const cf = CONF[kind] || CONF.ult;
  /* 前の帯はいつも片づける（2026-09-30）。
     特技も画面の真ん中に出すようにしたので、重なると読めなくなる。
     開戦の札（.vscut）は別ものなので触らない */
  for (const old of host.querySelectorAll('.cutin:not(.vscut)')) old.remove();
  /* 一枚絵は「もう読み終わっている」ときだけ使う（2026-10-01）。
     まだ読めていないと、絵の無い透けた箱に 名と技名だけが盤の上に浮いて見える。
     奥義の一枚絵は重いので、その戦のはじめの一回は必ずこれが出ていた。
     読めていなければ この一回だけ帯のほうに落とす。
     絵は startBattle が開戦の札のあいだに裏で読んでいる */
  let bg = null, useArt = false;
  if (art) {
    bg = document.createElement('img');
    bg.className = 'cart'; bg.alt = ''; bg.src = art;
    useArt = bg.complete && bg.naturalWidth > 0;
  }
  const box = document.createElement('div');
  box.className = 'cutin ' + cf.cls + (useArt ? ' art' : '');
  const band = document.createElement('div'); band.className = 'band';
  /* 「奥義」「固有発動」の筆文字（2026-09-30）。
     app/assets/ui/cut_奥義.png ／ cut_固有.png を置くと出る。無ければ出ない（絵が無くても動く） */
  const word = kind === 'ult' ? uiUrl('cut_奥義') : kind === 'unique' ? uiUrl('cut_固有') : null;
  const who = document.createElement('div'); who.className = 'who';
  /* 一枚絵があるときは who の中に敷き、その下端に名と技名を重ねる（2026-09-25）。
     box に直に入れると絵と文字の高さが揃わず、字が絵の真ん中にかぶってしまう */
  if (useArt) who.append(bg);
  if (img && !useArt) {
    const im = document.createElement('img');
    im.src = img; im.alt = '';
    im.onerror = () => im.remove();
    who.append(im);
  }
  const txt = document.createElement('div'); txt.className = 'txt';
  txt.innerHTML = `<div class="nm"></div><div class="sk"></div>`;
  txt.querySelector('.nm').textContent = name;
  const sk = txt.querySelector('.sk');
  sk.textContent = skill;
  /* 一枚絵の上では、同じ字を黒で太く敷いてから金の字を乗せる（2026-09-25）。
     金のグラデは背景の明るいところに溶けるので、影だけでは読めなかった。
     background-clip:text だと縁取りも透けるため、下敷きを別に置くしかない */
  sk.dataset.t = skill;
  /* 技名の字の大きさ（2026-09-25 に計算で決めるよう改めた）。
     文字数だけで縮めていたので「天下統一の遠吠え」が二行に割れ、
     「遠吠 / え」という無様な切れ方をしていた。
     顔とすき間と余白を引いた残り幅から逆算して、入るところまで詰める。
     17px まで詰めても入らないときだけ、あきらめて折り返す */
  const len = [...String(skill)].length;
  /* 特技も真ん中の帯になったので、字をひと回り大きくできる（2026-09-30・17→22） */
  const base = useArt ? (kind === 'ult' ? 36 : kind === 'unique' ? 28 : 20)
                   : kind === 'ult' ? 31 : kind === 'unique' ? 24 : 22;
  const wide = host.clientWidth || window.innerWidth || 393;
  /* 特技の一枚絵は画面いっぱいだとうるさいので78%にしている（2026-09-25）。
     字の入る幅もそれに合わせて狭める */
  const artW = kind === 'skill' ? wide * .78 : wide;
  /* 顔の大きさは帯ごとにちがう（2026-09-30）。いつも 132 で引いていたので、
     小さい帯では入る幅を 60px ほど少なく見積もり、字が要らぬところで縮んでいた */
  /* 固有も通常特技と同じ帯になったので、顔の幅も 66 で見る（2026-09-30） */
  const iconW = kind === 'ult' ? 132 : 66;
  const room = Math.max(120, (useArt ? artW - 44 : wide - (iconW + 14 + 36)) - 16);
  const fit = Math.floor(room / (len * 1.08));
  const px = Math.min(base, Math.max(17, fit));
  sk.style.fontSize = px + 'px';
  sk.style.whiteSpace = fit >= 17 ? 'nowrap' : 'normal';
  who.append(txt);
  /* 一枚絵のときは帯（上下の金の線と黒地）も画面ぜんたいの黒幕も出さない（2026-09-25）。
     絵そのものが主役なので、囲いがあると額縁のようで邪魔になる */
  if (useArt) box.append(who);
  else {
    box.append(band, who);
    band.animate([{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], { duration: pdur(140), easing: 'ease-out' });
  }
  /* 筆文字はいちばん上に重ねる（帯や絵からはみ出させたいので いちばん後ろに足す）。
     一枚絵があるときは絵の箱の中に入れる（2026-09-30）。
     画面の高さを物差しにすると、絵の高さが変わったとき離れてしまうため */
  let wordEl = null;
  if (word) {
    wordEl = document.createElement('img');
    wordEl.className = 'cutword'; wordEl.src = word; wordEl.alt = '';
    wordEl.onerror = () => wordEl.remove();
    (useArt ? who : box).append(wordEl);
  }
  host.append(box);
  /* 筆文字は ひと呼吸おくれて浮かび、終わりに沈む（2026-09-30）。
     傾きは CSS の transform で当てているので、ここでは濃さだけ動かす。
     transform を動きの中で書くと、傾きが打ち消されて水平に戻ってしまう */
  if (wordEl) wordEl.animate(
    [{ opacity: 0 }, { opacity: 1, offset: .28 }, { opacity: 1, offset: .8 }, { opacity: 0 }],
    { duration: pdur(cf.ms), easing: 'ease-out', fill: 'both' });
  /* 一枚絵は横に滑らせない（2026-09-25）。絵が画面からはみ出して見苦しいので、
     art のときは その場で薄く浮かび上がって沈む形にする */
  who.animate(useArt
    ? [{ opacity: 0 }, { opacity: 1, offset: .16 }, { opacity: 1, offset: .82 }, { opacity: 0 }]
    : [{ transform: 'translateX(-26px)', opacity: 0 },
       { transform: 'translateX(0)', opacity: 1, offset: .26 },
       { transform: 'translateX(0)', opacity: 1, offset: .74 },
       { transform: 'translateX(20px)', opacity: 0 }],
    { duration: pdur(cf.ms), easing: 'ease-out' });
  const a = box.animate([{ opacity: 0 }, { opacity: 1, offset: .12 }, { opacity: 1, offset: .8 }, { opacity: 0 }],
                        { duration: pdur(cf.ms)});
  a.onfinish = () => box.remove();
  return pdur(cf.ms);
}
