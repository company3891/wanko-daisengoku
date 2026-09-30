// わんこ大戦国 プロトタイプ（2026-09-20）
// 編成 → 陣形 → 戦闘 → 勝敗。戦闘ルールは sim/src/engine.mjs をそのまま呼ぶ。
import { runBattle, WEATHER_NOTE, WEATHER_TABLE } from '/sim/src/engine.mjs';
import { boardEl, fieldEl, pawns, byTurn, render, loadManifest, flipMove, snapshotRects, lunge, hitFlash, popNumber, fleeAway, ultFlare, SFX, soundEnabled, cutIn, pawnUrl, cutinUrl, cutinArt, heroUrl, frameUrl, faceUrl, FACES, bgUrl, bgVideoUrl, fxVideoUrl, uiUrl, statUrl, statusIconUrl, stFace, stageUrl, cardUrl, cardLayout, cardPatchUrl, skillArtUrl, unknownCardUrl, bannerUrl, attrUrl, rarUrl, fxBurst, bgm, ambient, kamonUrl, itemUrl, setPlayMul, assetUrlsOf } from './replay.js';

import { GACHAS, gachaOf, poolOf, urListOf, urRatesOf } from './gachas.js';
/* 束ねるときに import 行は捨てられるので、別名（as）は使えない（2026-10-01 に踏んだ）。
   tower.js のほうで twTeam / twResult という名にしてある */
import { TOWER, TOWER_FOOD, TOWER_MAX, towerOf, towerTier, TIER_NAME, isBoss, isGate,
         twTeam, twResult } from './tower.js';
import { pityOf } from './player.js';
import { setMix } from './replay.js';
import { P, loadPlayer, savePlayer, today, miRoll, miBump, miSet, gainTitle, TICKET, TICKET_PRICE, newSquad, owns, stones, pull, giveReward, rewardMulOf, sparReward, grantStarter, SQUAD_MAX, COST_MAX, costMax, costBuff, costBuffLeft, useCostItem, RATES, PRICE, PITY, SOUL_BY_RARITY,
         AWAKE_KOBAN, awakeKoban,
         setCampStart, prefStep, prefTaken, takenCount, regionTaken, openRegions, canMarch, spendFood, marchFood, refillFood, foodWait, advancePref,
         ITEMS, ITEM_KINDS, item, addItem, charState, lvCapOf, spUsed, feedBook, awaken, addSp, commitSp, grownStats,
         LV_CAP, AWAKE_MAX, expToNext, SP_MAX, SP_STATS,
         SOUL_PACK, dailyDeals, dealBought, buyItem, buyDeal, buySoul, useFood,
         ATTRS, AWAKE_TIERS, BADGES, badgeMat, freeMat, awakeNeed, awakeCheck,
         BATTLE_STATS, WEATHERS, WEATHER_ITEM, useItem,
         SKILL_MAX, MAT_MAX, BOOK, STAR_RATE, buildStars, starOf, dupOf, skillLvOf,
         sellDup, skillRate, skillUp,
         INH_MAT_MAX, INH_RATE_NORMAL, INH_RATE_UNIQ, INH_CHARMS, inhOf, uniqInhCount, slotsOf,
         givableOf, canInherit, inhRate, inherit, lostUnique,
         matLeft, cardsNeeded, canEatCard, inSquad, dismiss, cntOf, setCnt, hasCard, fireMax } from './player.js';
import { REGIONS, REGION_ORDER, PREFS, PREF, prefsOf, INTRO, LORD_TALK, NO_LORD_NAME, STEP_NAME, FOOD_COST, chapterRank, mapX, mapY, stageOf } from './campaign.js';
import { EVENTS, EV_RANKS, EV_FOOD, EV_POWER, EV_LV, EV_SOUL, EV_SKILL, EV_STAGE, evOf, evState, evCleared, evOpen, evDone, evWin,
         awakeAttrsToday, WEEKLY_PICK, evShownToday } from './event.js';
import { MI_TABS, MI_BOX, MISSIONS, miOf, KADODE } from './mission.js';
import { LK_TIES, LK_PASS_MIN, lkMakeCode, lkCodeOk, lkTidyCode, lkPassNg, lkPassRank,
         lkHash, lkSalt, lkTied } from './link.js';
import { RK_TIERS, RK_SEATS, RK_UP, RK_DOWN, RK_TICKET, RK_NEAR, RK_RAID, RK_PIN, RK_PRIZE, RK_POWER,
         RK_BANDS, RK_SHOP, rkBandOf, rkPrizeOf, rkPoint, rkSide, rkRand, rkSeed, rkRoom, rkNpcPt,
         rkMonth, rkDayOfMonth, rkDaysInMonth, rkNextTier, rkMoveWord } from './rank.js';

const $ = (s, r = document) => r.querySelector(s);
/* ---- 絵を作り直さない（2026-09-23）----
   draw() は画面をまるごと組み直すので、そのたびに <img> が作り直され、
   読み込み済みでも一瞬の描き直しが起きる（ボタンを押すたびに絵がちらつく）。
   src ごとに <img> の実体をひとつだけ持ち、使い回すことで消える。
   同じ描画の中で同じ絵を2度使うときだけ、2つ目は新しく作る（1つの実体は1か所にしか置けないため）。 */
const IMG_CACHE = new Map();
let IMG_USED = new Set();
/* 背景の箱も同じ理由で使い回す（中身は背景画像なので div のまま持つ） */
const BG_CACHE = new Map();
function keepBg(src, cls) {
  if (!src) return null;
  const key = cls + '|' + src;
  if (IMG_USED.has(key)) return el('div', { class: cls, style: `background-image:url(${src})` });
  IMG_USED.add(key);
  let n = BG_CACHE.get(key);
  if (!n) { n = el('div', { class: cls, style: `background-image:url(${src})` }); BG_CACHE.set(key, n); }
  else n.className = cls;
  return n;
}
/* 動く背景（2026-09-26）。
   組み直しのたびに作り直すと頭から流れ直してしまうので、同じ節を使い回す。
   muted と playsinline を付けないと、iPhone では勝手に流れない。
   poster に静止画を入れておくと、読み込むまでのあいだ そちらが見える */
function keepVid(src, poster, cls) {
  if (!src) return null;
  const key = 'vid|' + cls + '|' + src;
  let n = BG_CACHE.get(key);
  if (!n) {
    n = el('video', {
      class: cls, src, poster: poster || null,
      autoplay: true, loop: true, muted: true, playsinline: true, preload: 'auto',
      tabindex: -1, 'aria-hidden': 'true',
    });
    n.muted = true;            // 属性だけでは効かない見かけがあるので、実物にも入れる
    n.defaultMuted = true;
    BG_CACHE.set(key, n);
  } else n.className = cls;
  // 画面を離れて戻ったときに止まったままになることがある
  if (n.paused) { const pr = n.play(); if (pr && pr.catch) pr.catch(() => {}); }
  return n;
}
/* ガチャの動く景色（2026-09-26）。
   一度だけ流して、終わったら最後のコマで止まる＝そのまま背景になる。
   loop を付けないのはそのため。画面を組み直すたび作り直すと頭から
   流れ直してしまうので、節（ふし）は1つだけ持って使い回す */
let GVID = null;
function gachaVid(src, poster) {
  if (!src) return null;
  if (!GVID || GVID.dataset.src !== src) {
    GVID = el('video', {
      class: 'bgvid', src, poster: poster || null,
      muted: true, playsinline: true, preload: 'auto',
      tabindex: -1, 'aria-hidden': 'true',
    });
    GVID.dataset.src = src;
    GVID.muted = true; GVID.defaultMuted = true;
  }
  return GVID;
}
/* 頭から一度だけ流して、終わる（または待ち時間が尽きる）まで待つ。
   検証用の見かけでは mp4 が開けないことがあるので、かならず時間で抜ける */
function playOnce(v, capMs) {
  if (!v) return sleep(0);
  return new Promise(done => {
    let fin = false;
    const end = () => { if (fin) return; fin = true; v.removeEventListener('ended', end); done(); };
    v.addEventListener('ended', end);
    try { v.currentTime = 0; } catch { /* まだ読めていないだけ */ }
    const pr = v.play();
    if (pr && pr.catch) pr.catch(() => {});
    setTimeout(end, capMs);
  });
}
function keepImg(attrs) {
  const src = attrs.src;
  if (!src) return el('img', attrs);
  const key = src + '|' + (attrs.class || '');
  if (IMG_USED.has(key)) return el('img', attrs);   // 同じ描画で2度目。使い回せない
  IMG_USED.add(key);
  let n = IMG_CACHE.get(key);
  if (!n) { n = el('img', attrs); IMG_CACHE.set(key, n); return n; }
  // 2回目以降は中身だけ入れ替える（src は同じなので読み直しは起きない）
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'src') continue;
    if (k === 'class') n.className = v;
    else if (k === 'style') { if (v == null) n.removeAttribute('style'); else n.setAttribute('style', v); }
    else if (k.startsWith('on')) n[k] = v;
    else if (v == null) n.removeAttribute(k);
    else n.setAttribute(k, v);
  }
  return n;
}
const el = (t, a = {}, ...kids) => {
  const n = document.createElement(t);
  for (const [k, v] of Object.entries(a)) {
    if (k === 'class') n.className = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else if (v != null) n.setAttribute(k, v);
  }
  for (const c of kids.flat()) if (c != null) n.append(c.nodeType ? c : document.createTextNode(c));
  return n;
};

const [RULES, DB] = await Promise.all([
  fetch('/sim/rules.json').then(r => r.json()),
  fetch('/sim/data/characters.json').then(r => r.json()),
  loadManifest(),
]);
const C = DB.characters;
const FORMS = Object.keys(RULES.formations).filter(k => RULES.formations[k]?.cells);
const STAGES = ['地形なし', ...Object.keys(RULES.stage.maps || {})];
/* 「地形なし」にも地面と景色を出す（2026-09-27）。
   絵を探すときだけ草原に読み替える。障害物は置かないので、ただの野原に見える。
   これまでは theme に「地形なし」を渡していたので、地面も背景も見つからず
   盤が真緑の四角になっていた */
const stageArt = s => (s === '地形なし' ? '草原' : s);
const RAR = ['UR', 'SSR', 'SR', 'R', 'N'];
const POOL = {}; for (const r of RAR) POOL[r] = C.filter(c => c.rarity === r);
const charOf = no => C.find(c => c.no === no) || null;
buildStars(C);                 // 特技の★（その特技を持つ最低レアリティ）を数えておく

/* ---------------- プレイヤーデータ（2026-09-21）----------------
   所持武将・通貨・部隊プリセットは player.js が持ち、端末に保存する。
   1つの部隊＝「編成（武将5体まで）＋総大将＋陣形＋配置」で5つまで。
   ステージと操作方式は部隊に含めない（同じ部隊をいろいろな戦場に出せるほうが使いやすい）。 */
loadPlayer(FORMS);
soundEnabled(!!P.sound);   // 覚えている音の入り切りを渡す（2026-09-28）
setMix({ bgm: sndOf('bgm'), amb: sndOf('amb'), se: sndOf('se') });
const saveSquads = savePlayer;

const S = { stage: '地形なし', filter: 'すべて', screen: 'home', manual: false, gacha: null, volOpen: false,
  /* お知らせ（2026-09-24）。news＝開いているか／newsTab＝選んでいるタグ／newsId＝読んでいる記事 */
  news: false, newsTab: '更新', newsId: null,
  /* 友（2026-09-24）。fr＝一覧を開いているか／frId＝訪ねている友／frMsg＝その場の一言 */
  fr: false, frId: null, frMsg: '',
  detailRO: false, nmMsg: '', rwi: null,
  /* お役目（2026-09-24）。mi＝開いているか／miTab＝選んでいるタグ */
  mi: false, miTab: '日課', miMsg: '', tt: false, reset: 0, pwUp: 0,
  /* 武将強化の三つの札（2026-09-26）。'稽古' / '覚醒' / '魂' / null */
  pw: null,
  /* その戦の盤面ちがい（2026-09-26）。0〜4 */
  stageV: 0,
  /* 攻守を入れ替えたか（稽古・番付だけ true になりうる） */
  stageFlip: false,
  /* 宝箱の演出（2026-09-26）。
     gbox … 開ける前の中身（引いた結果をここで預かる）
     gboxing … 開いている最中（光っているあいだ）
     gopen … 宝の前の景色を敷いているか（札が出たあともそのまま残す） */
  gbox: null, gboxing: false, gopen: false,
  /* 一体ずつの見せ場（2026-09-26）。
     rv … { list: 出た順, i: いま何体目, res: 十連ぜんぶの結果 }
     画面をふれるたび次の一体へ。最後まで見たら、
     一連はガチャの入口へ、十連は獲得の一覧へ */
  rv: null,
  /* 十連の締め（2026-09-26）。出た10体を並べるだけの画面。
     引く釦もおみくじの帯も下の帯も出さない */
  rvall: null,
  gbanner: null,   // いま選んでいるくじ（2026-09-28）
  /* 試練の塔（2026-10-01）。twSel＝札を開いている階／twMsg＝弾かれた訳 */
  twSel: null, twMsg: '' };
/* 起動したら、かならずスタートの画面から（2026-09-25）。
   ここで「やり直す」を出したいので、チュートリアルの途中でも一度ここを通す */
S.screen = 'title';
Object.defineProperty(S, 'squads', { get: () => P.squads });
Object.defineProperty(S, 'active', { get: () => P.active, set: v => { P.active = v; } });
// 編成まわりの読み書きは、いま選んでいる部隊へそのまま通す
Object.defineProperty(S, 'picked', {
  get: () => P.squads[P.active].nos.map(charOf).filter(Boolean),
  set: v => { P.squads[P.active].nos = v.map(c => c.no); },
});
for (const k of ['name', 'general', 'form', 'slots'])
  Object.defineProperty(S, k, {
    get: () => P.squads[P.active][k],
    set: v => { P.squads[P.active][k] = v; },
  });
const squadCost = q => q.nos.map(charOf).filter(Boolean).reduce((a, c) => a + (c.cost || 0), 0);
const squadChars = q => q.nos.map(charOf).filter(Boolean);

// カットインでは頭の（属性）を落とす。技名だけを大きく見せたい
const ultNameOf = no => String((C.find(c => c.no === no)?.ultimate?.name) || '奥義')
  .replace(/^[（(][^）)]*[）)]\s*/, '').replace(/[◆◇]\s*$/, '');
/* ---- 盤面のちがい（2026-09-26）----
   同じ地でも障害の置き方が5とおりある。どれになるかは その戦の種で決まるので、
   同じ国の同じ段はいつも同じ景色になる。絵（stage/<地>.jpg）は地ごとに1枚のまま。
   theme も渡すようにした。これまでは草原のまま固まっていて、
   「この地のとき」という技の条件が働いていなかった */
const stageVar = (name, v) => ((RULES.stage.variants || {})[name] || [])[v] || null;
const stageVarCount = name => ((RULES.stage.variants || {})[name] || []).length || 1;
const stageVarName = (name, v) => (((RULES.stage.variantNames || {})[name] || [])[v]) || '';
/* 遊ぶ人に見せる地の名。「草原・木立の回廊」のように、地＋その顔で出す */
const stageLabel = (name, v) => {
  const sub = stageVarName(name, v || 0);
  return sub ? `${name}・${sub}` : name;
};
/* 攻守の入れ替え（2026-09-26）。
   盤面を偏らせると、置かれた側で得・損が出る。
   人が絡む戦（友との稽古・番付）だけは、相手ごと・日ごとに盤面を上下ひっくり返して、
   同じ相手とは次に当たるとき逆の側に立つようにする。
   全国とお祭りは相手が国なので、そのまま。地の利も難しさのうち */
const flipMap = m => (m ? m.slice().reverse() : m);
const dayNo = () => Math.floor(Date.parse(today() + 'T00:00:00') / 86400000);
const idHash = v => { let h = 0; for (const c of String(v)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
/* 相手が決まれば、その日の側が決まる。日が変われば逆になる */
const stageFlipFor = (spar, bout) => {
  const id = spar ? spar.id : (bout ? bout.npc.id : null);
  if (id == null) return false;
  return ((dayNo() + idHash(id)) & 1) === 1;
};
const stageRules = (name, v, flip) => {
  if (name === '地形なし') return RULES;
  const m = stageVar(name, v || 0) || RULES.stage.maps[name];
  /* どの顔かも渡す（2026-09-26）。stage/<地>_<番号>.jpg があればそれを敷くため */
  return { ...RULES, stage: { ...RULES.stage, theme: name, variant: v || 0, map: flip ? flipMap(m) : m } };
};
const cost = () => S.picked.reduce((a, c) => a + (c.cost || 0), 0);
/* ---- 総戦力（2026-09-23）----
   育てたぶんを乗せた5つの値（火力・賢さ・防御・回復・速さ）の合計。
   兵量は桁がちがって他を飲み込んでしまうので入れない。 */
const powerOf = c => { const g = grownStats(c); return SP_STATS.reduce((a, k) => a + (g[k] || 0), 0); };
const teamPower = () => S.picked.reduce((a, c) => a + powerOf(c), 0);
const squadPower = q => squadChars(q).reduce((a, c) => a + powerOf(c), 0);
/* いちばん総戦力が高くなる5人を選ぶ。
   コスト上限のある詰め込み（ナップサック）なので、
   「何人・いくらまで使ったか」で表を作って順に埋める。
   同じ元武将は一隊にひとりなので、すでに入っている人物は飛ばす。 */
function bestTeam(pool) {
  const STEP = 50, MAXC = Math.floor(costMax() / STEP);
  // dp[人数][コスト] = { pw, list }
  let dp = Array.from({ length: 6 }, () => Array(MAXC + 1).fill(null));
  dp[0][0] = { pw: 0, list: [], org: new Set() };
  const cand = pool.slice().sort((a, b) => powerOf(b) - powerOf(a));
  for (const c of cand) {
    const cc = Math.ceil((c.cost || 0) / STEP);
    if (cc > MAXC) continue;
    for (let n = 4; n >= 0; n--) for (let m = MAXC - cc; m >= 0; m--) {
      const from = dp[n][m];
      if (!from) continue;
      if (c.origin && from.org.has(c.origin)) continue;    // 同じ人物は二人立てぬ
      const pw = from.pw + powerOf(c);
      const to = dp[n + 1][m + cc];
      if (!to || pw > to.pw) {
        const org = new Set(from.org); if (c.origin) org.add(c.origin);
        dp[n + 1][m + cc] = { pw, list: [...from.list, c], org };
      }
    }
  }
  let best = null;
  for (let n = 1; n <= 5; n++) for (let m = 0; m <= MAXC; m++)
    if (dp[n][m] && (!best || dp[n][m].pw > best.pw)) best = dp[n][m];
  return best ? best.list : [];
}

/* ================= ホーム・全国・図鑑・ガチャ（2026-09-21）=================
   下ナビは 全国／編成／ホーム／図鑑／ガチャ の5つ。ホームが真ん中。
   仕様書（ゲーム§16・デザイン§8/§13）に沿って作ってある。 */

const num = n => (n || 0).toLocaleString();
/* ヘッダーの通貨は一列に並べるので、桁が増えても幅が暴れないように万・億で詰める（2026-09-22）。
   正確な数はツールチップとショップの帯で見せる。 */
function numShort(n) {
  n = n || 0;
  if (n < 10000) return num(n);
  const unit = n < 1e8 ? [1e4, '万'] : [1e8, '億'];
  const v = n / unit[0];
  const t = v < 10 ? v.toFixed(2) : v < 100 ? v.toFixed(1) : Math.floor(v).toLocaleString();
  return t.replace(/\.?0+$/, '') + unit[1];
}
/* 属性・レアリティの絵（2026-09-21）
   素材があれば絵で、無ければこれまでどおり色つきの文字で出す。
   絵のなかに「猛将」「SSR」まで描いてあるので、絵のときは文字を重ねない。 */
function rarTag(r, cls) {
  const u = rarUrl(r);
  return u ? el('img', { class: 'ricon' + (cls ? ' ' + cls : ''), src: u, alt: r, title: r })
           : el('span', { class: 'rar r-' + r + (cls ? ' ' + cls : '') }, r);
}
function attrTag(a, cls) {
  const u = a ? attrUrl(a) : null;
  return u ? el('img', { class: 'aicon' + (cls ? ' ' + cls : ''), src: u, alt: a, title: a })
           : el('span', { class: 'attr a-' + a + (cls ? ' ' + cls : '') }, a || '―');
}
const nextExp = () => P.lv * 100;
// プレイヤーの顔は、いま選んでいる部隊の総大将を使う
/* 育成の三画面の既定に使う（2026-09-29）。
   ホームに立っている武将＝いま選んでいる部隊の総大将。
   札を持っていない（絵が無い）ときは既定にしない */
const homeChar = () => {
  const c = faceChar();
  return (c && hasCard(c.no)) ? c : null;
};
const faceChar = () => {
  const q = P.squads[P.active];
  return charOf(q.general) || squadChars(q)[0] || charOf(P.own.find(hasCard)) || null;
};
/* ヘッダーに出すもの（2026-09-21 決定）
   プレイヤーアイコン ／ レベル ／ 次のレベルまでのゲージ ／ 兵糧 ／ 武士の魂 ／ 石（ガチャ通貨）
   小判はショップでしか使わないので、2026-09-22 にヘッダーから外した
   石は有償と無償の合計を出す。内訳はガチャ画面で見せる。 */
function playerBar() {
  const f = faceChar();
  const pct = Math.max(0, Math.min(100, P.exp / nextExp() * 100));
  return el('div', { class: 'pbar' },
    el('div', { class: 'me' },
      // 額（ふち）の絵があれば顔の上に重ねる
      /* 顔をたたくと称号を選べる（2026-09-25）。
         もとはお役目の札の下にあったが、肩書きは自分の見た目の話なので顔のほうが素直 */
      /* 額は称号のもの（2026-09-25）。称号を変えると額も変わる。
         その称号の絵が無ければ ui/player_frame に落ちる */
      (() => { const fr = P.title ? (frameUrl(P.title) || uiUrl('player_frame')) : null;
        return el('button', { class: 'ic tapic' + (fr ? ' framed' : ''),
          style: faceStyle(f), title: '称号をえらぶ',
          onclick: () => { S.tt = true; SFX.pick(); draw(); } },
          f ? null : el('i', {}, '将'),
          fr ? el('img', { class: 'pf', src: fr, alt: '' }) : null); })(),
      el('div', { class: 'lvb' },
        /* 名乗りとレベルを一行に（2026-09-24）。
           「次まで◯◯」はゲージが見えていれば要らないので落とした */
        el('span', { class: 'l' },
          el('b', { class: 'nm' }, P.name || '無名の将'),
          `Lv.${P.lv}`),
        el('span', { class: 'g' }, el('i', { style: `width:${pct}%` })))),
    el('div', { class: 'cur' },
      // 兵糧は出陣のたびに減るので、いつでも見えるようにした（2026-09-21）
      /* 兵糧は時間で戻る（2026-09-26）。残り時間の字は画面に出さない
         （説明しすぎない。玉の明滅だけで「戻っている最中」が分かる） */
      (() => { const w = foodWait(); return el('span', {
        class: 'w food' + (uiUrl('coin_兵糧') ? ' art' : '') + (w.full ? ' wait' : ''),
        title: '兵糧（出陣に使う）',
      },
        uiUrl('coin_兵糧') ? keepImg({ class: 'ci', src: uiUrl('coin_兵糧'), alt: '' }) : el('i', {}, '糧'),
        `${num(P.stamina)}`, el('em', {}, `/${num(P.staminaMax)}`),
        // ＋から兵糧の道具をその場で使える（2026-09-21）
        el('button', {
          class: 'plus', title: '兵糧をもどす',
          onclick: e => { e.stopPropagation(); S.food = true; SFX.pick(); draw(); },
        }, '＋')); })(),
      coin('soul', '魂', '武士の魂', P.soul),
      /* 小判はヘッダーから外した（2026-09-22）。買い物のときだけ要る数字で、
         iPhone16 の幅では通貨4つが入らなかった。ショップの上に大きく出している */
      coin('stone', '勾', 'ガチャ石（有償＋無償）', stones())));
}
/* 通貨の玉（2026-09-21）
   app/assets/ui/coin_魂.png のように置くと、漢字の丸から絵に変わる。 */
function coin(cls, mark, title, n, full, arts) {
  /* 絵の名は題から起こすが、軍功のように別名で来た絵もあるので
     候補を渡せるようにした（2026-09-26）。先に見つかったほうを使う */
  let art = null;
  for (const nm of arts || [title.replace('武士の魂', '魂').replace('ガチャ石（有償＋無償）', '石')]) {
    art = uiUrl('coin_' + nm); if (art) break;
  }
  return el('span', { class: 'w ' + cls + (art ? ' art' : ''), title: `${title}　${num(n)}` },
    art ? keepImg({ class: 'ci', src: art, alt: '' }) : el('i', {}, mark),
    full ? num(n) : numShort(n));
}

/* 褒美の並びで使う通貨の粒（2026-09-23）。
   ヘッダーの玉と同じ絵（coin_小判 / coin_魂 / coin_石）を使い、
   絵が無いときだけ、これまでの漢字の丸に落とす。 */
/* 通貨の絵（2026-09-25）。名を並べて書けるようにした。
   軍功は虹の勾玉の絵が coin_勾玉 で来たので、そちらも見る。
   あとから coin_軍功 を置けば、そちらが勝つ */
const CUR_ART = { koban: ['小判'], soul: ['魂'], stone: ['石'], food: ['兵糧'], gun: ['軍功', '勾玉'] };
const CUR_MARK = { koban: '判', soul: '魂', stone: '勾', food: '糧', gun: '功' };
function curIcon(kind) {
  let art = null;
  for (const n of CUR_ART[kind] || []) { art = uiUrl('coin_' + n); if (art) break; }
  return art
    ? keepImg({ class: 'ci cur', src: art, alt: '' })
    : el('i', { class: kind === 'stone' ? 'free' : kind }, CUR_MARK[kind]);
}

/* ================= スタートの画面（2026-09-25）=================
   起動するたび、かならずここを通る。一枚絵を画面いっぱいに見せて、
   たたくと先へ進む。右上に「やり直す」を置いてあるので、
   アプリを取り直さなくても、その場ではじめからやり直せる。

   絵は app/assets/bg/title.png（無ければ城下町の絵に落ちる）。
   題字は app/assets/ui/title_logo.png（無ければ文字で出る）。 */
const TITLE_CATCH = '小さなわんこの、大きな夢が　この国を動かす――';
const APP_VER = 'Ver.1.0.0';

/* スタート画面の下の札（2026-09-25）。
   絵があれば絵、無ければ字。押せないときは灰にして「近日」を出す */
function ttlPlate(img, mark, label, onclick, soon, badge) {
  const src = uiUrl(img);
  const cls = 'ttls' + (src ? ' pic' : '') + (soon ? ' soon' : '');
  return el('button', { class: cls, disabled: soon || null, title: soon ? `${label}（近日）` : label,
    onclick: soon ? null : onclick },
    src ? keepImg({ src, alt: label }) : el('i', {}, mark),
    src ? null : label,
    badge ? el('em', { class: 'hmbadge' }, badge > 9 ? '9+' : String(badge)) : null);
}

/* 保存を消させない願い出（2026-09-30）。
   ブラウザは「しばらく使われていない置き場」から順に消す。
   持ちきり（persistent）を許してもらえれば、その仲間から外れる。
   WebKit は「ホーム画面に足したウェブアプリとして開かれているか」を目安のひとつにしているので、
   ホーム画面から遊ぶ人はここで通る。断られても遊びには何も起きない。
   人が触った直後のほうが通りやすいので、起動時と、題の画面を押したときの二度たずねる */
let PERSIST_ASKED = false;
async function askPersist() {
  if (PERSIST_ASKED) return;
  PERSIST_ASKED = true;
  try {
    if (!navigator.storage || !navigator.storage.persist) return;
    if (await navigator.storage.persisted()) { KEEP_OK = true; return; }
    KEEP_OK = await navigator.storage.persist();
  } catch { /* 使えない機器でも落とさない */ }
}
let KEEP_OK = null;   // true=持ちきり／false=断られた／null=まだ分からない

/* 保存の控えを一つのファイルに出す（2026-09-30）。
   ★ここの言葉は戦国口調にしない。間違えると本当に記録が消えるため。 */
function saveExport() {
  const body = JSON.stringify({
    app: 'wanko-daisengoku', kind: 'save', ver: 1,
    at: new Date().toISOString(), data: { ...P, own: [...P.own] },
  });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([body], { type: 'application/json' }));
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  a.download = `わんこ大戦国_控え_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}.json`;
  /* 体に貼ってから押す（2026-09-30）。浮いたままだと、機器によって名が付かずに落ちてくる */
  a.style.display = 'none';
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
/* 控えを読み込む。いまの記録は消えるので、中身を見せてから確かめる */
function saveImportPick() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'application/json,.json';
  inp.onchange = () => {
    const f = inp.files && inp.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      let j = null;
      try { j = JSON.parse(String(r.result)); } catch { }
      const d = j && j.data;
      if (!j || j.app !== 'wanko-daisengoku' || !d || typeof d !== 'object') {
        S.keepMsg = 'このファイルは わんこ大戦国 の控えではありません'; draw(); return;
      }
      S.keepAsk = { at: j.at || '', name: d.name || '（名前なし）', lv: d.lv || 1,
                    chars: Array.isArray(d.own) ? d.own.length : 0, raw: d };
      SFX.pick(); draw();
    };
    r.readAsText(f);
  };
  inp.click();
}
/* 控えを戻す前の確かめ（2026-09-30）。
   ★ここの言葉は戦国口調にしない。いまの記録が本当に消えるため */
function keepAskSheet() {
  const a = S.keepAsk; if (!a) return null;
  const close = () => { S.keepAsk = null; draw(); };
  const when = a.at ? String(a.at).slice(0, 16).replace('T', ' ') : '（日付なし）';
  return el('div', { class: 'sheet', onclick: e => { if (e.target === e.currentTarget) close(); } },
    el('div', { class: 'card2 keepbox' },
      el('b', { class: 'mittl' }, '控えから戻す'),
      el('div', { class: 'keeprow' },
        el('div', {}, el('em', {}, 'いまの記録'),
          el('span', {}, `${P.name || '（名前なし）'}　Lv.${P.lv}　武将 ${P.own.length} 体`)),
        el('div', {}, el('em', {}, '控えの記録'),
          el('span', {}, `${a.name}　Lv.${a.lv}　武将 ${a.chars} 体`),
          el('i', {}, `書き出した日　${when}`))),
      el('p', { class: 'note warn' }, 'いまの記録は消えます。元には戻せません。'),
      el('button', { class: 'go wide', onclick: () => saveImportGo(a.raw) }, '控えの記録で始める'),
      el('button', { class: 'ghost wide', onclick: close }, 'やめる')));
}
function saveImportGo(d) {
  try {
    localStorage.setItem('wanko.player.v1', JSON.stringify(d));
  } catch {
    S.keepAsk = null; S.keepMsg = '保存できませんでした'; draw(); return;
  }
  location.reload();
}
/* ---------------- ロード画面（2026-09-30） ----------------
   題の画面を押したあと、よく使う絵をまとめて先に読む。
   前は城へ入ってから一枚ずつ出てきて、そのたびに間が空いていた。
   ぜんぶ（149MB）は読まない。城とその周りで必ず使うものだけ。
   家紋がゆっくり回り、信わんが上下にはずみ、下に帯が伸びる */
const LOAD_KINDS = ['ui', 'attr', 'rarity', 'stat', 'status', 'tag', 'frame', 'item', 'kamon', 'terrain'];
function loadList() {
  const out = [];
  for (const k of LOAD_KINDS) out.push(...assetUrlsOf(k));
  for (const n of ['home', 'title', 'kamon']) { const u = bgUrl(n); if (u) out.push(u); }
  /* いま出している部隊の子は、城でもすぐ出るので先に読む */
  const q = P.squads[P.active] || { nos: [] };
  for (const no of q.nos) {
    for (const u of [pawnUrl(no), cardUrl(no, 'front'), faceUrl(no, '笑顔'), faceUrl(no, '通常')]) if (u) out.push(u);
  }
  return [...new Set(out)];
}
function screenLoading() {
  const art = bgUrl('kamon') || bgUrl('home');
  const dog = pawnUrl(1) || heroUrl(1);
  const pct = Math.max(0, Math.min(100, Math.round((S.load || 0) * 100)));
  return {
    bare: true,
    body: el('div', { class: 'loadwrap' },
      art ? el('div', { class: 'loadbg', style: `background-image:url("${art}")` }) : null,
      el('div', { class: 'loadkamon' }, kamon('織田家', 'big')),
      dog ? keepImg({ class: 'loaddog', src: dog, alt: '' }) : null,
      el('div', { class: 'loadfoot' },
        el('div', { class: 'loadtx' }, 'ロード中',
          el('i', {}, '・'), el('i', {}, '・'), el('i', {}, '・')),
        el('div', { class: 'loadbar' }, el('i', { style: `width:${pct}%` })))),
  };
}
/* 先読み。読めない絵があっても止まらない（数だけ進める）。
   絵が早く終わっても 0.9秒は見せる（ぱっと消えると、かえって落ち着かない） */
async function bootLoad() {
  const urls = loadList();
  const t0 = Date.now();
  let done = 0;
  const tick = () => { S.load = urls.length ? done / urls.length : 1; draw(); };
  S.load = 0; tick();
  try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch { }
  await Promise.all(urls.map(u => new Promise(res => {
    const im = new Image();
    const fin = () => { done++; if (done % 6 === 0 || done === urls.length) tick(); res(); };
    im.onload = fin; im.onerror = fin;
    im.src = u;
  })));
  S.load = 1; draw();
  const wait = Math.max(0, 900 - (Date.now() - t0));
  await new Promise(r => setTimeout(r, wait));
  S.screen = P.tutorial < 2 ? 'tutorial' : 'home';
  S.load = null;
  draw();   // つなぎ音は画面が変わったときに draw が勝手に鳴らす
}
function screenTitle() {
  const go = () => {
    askPersist();
    /* 先にロード画面をはさむ（2026-09-30）。
       読み終わったら bootLoad が チュートリアル／城 へ送り出す */
    S.screen = 'loading'; S.load = 0;
    SFX.pick(); draw(); bootLoad();
  };
  const logo = uiUrl('title_logo');
  /* 一枚絵。title が無ければ城下町の絵で代える（絵が無くても動く決まり） */
  const art = bgUrl('title') || bgUrl('home') || bgUrl(BG_FALLBACK);
  return {
    bare: true,
    body: el('div', { class: 'ttl', onclick: e => { if (!e.target.closest('button')) go(); } },
      el('div', { class: 'ttlart', style: art ? `background-image:url("${art}")` : null }),
      /* 右上のやり直し。紐づけができたら、紐づけ済みの人には出さない */
      el('button', { class: 'ttlre', title: 'はじめからやり直す',
        onclick: () => { S.reset = 1; SFX.pick(); draw(); } }, el('i', {}, '↺'), el('span', {}, 'やり直す')),
      el('div', { class: 'ttlmid' },
        logo ? keepImg({ class: 'ttllogo', src: logo, alt: 'わんこ大戦国' })
             : el('div', { class: 'ttlname' }, el('b', {}, 'わんこ大戦国'), el('i', {}, 'WANKO DAISENGOKU'))),
      el('div', { class: 'ttlbtm' },
        /* 開始の札。絵があれば絵、無ければ金の釦（2026-09-25） */
        (() => { const g = uiUrl('title_go');
          return el('button', { class: 'ttlgo' + (g ? ' pic' : ''), onclick: go },
            g ? keepImg({ src: g, alt: 'タップして開始' }) : 'タップして開始'); })(),
        /* 下の二つは絵の札（2026-09-25）。
           絵が無ければ字の札に落ちる（置くだけで反映の決まりを崩さない） */
        el('div', { class: 'ttlsub' },
          ttlPlate('title_news', '報', 'お知らせ',
            e => { e.stopPropagation(); S.news = true; S.newsTab = NEWS_TAGS[0]; S.newsId = null; SFX.pick(); draw(); },
            false, newsUnread()),
          ttlPlate('title_link', '継', 'データ連携',
            e => { e.stopPropagation(); lkOpen(); }, false,
            /* まだ備えていなければ、赤丸で気づかせる（消えると取り返しがつかないので） */
            P.link.code ? 0 : 1)),
        el('p', { class: 'ttlcatch' }, TITLE_CATCH),
        el('p', { class: 'ttlver' }, APP_VER)),
    ),
  };
}

/* ---------------- データ引き継ぎ（2026-09-25）----------------
   引き継ぎID（世界にひとつ）と パスワードを持たせる。
   これがあれば、ログイン手段を全部入れ替えてもデータを取り戻せる。
   アカウント連携（LINE・Game Center・Play ゲーム）はサーバーができてから。
   いまはIDを端末で作る。32字×8桁なのでぶつからない。

   ★この画面の文言だけ、戦国口調（〜わん）を使わない（2026-09-25）。
     ここは間違えると本当にデータが消えるところなので、
     雰囲気より「読んで確実に分かること」を取る。用語もふつうの言い方にそろえる。
   設計は claude/わんこ大戦国_アカウントとログインの設計_20260925.md */
function lkOpen() {
  S.link = P.link.code ? 'main' : 'intro';
  S.lkMsg = ''; S.lkP1 = ''; S.lkP2 = ''; S.lkShow = false;
  SFX.pick(); draw();
}
const lkClose = () => { S.link = null; S.lkMsg = ''; S.lkP1 = ''; S.lkP2 = ''; draw(); };

/* パスワードを決める（はじめて発行するときも、変えるときも同じ札） */
function lkSavePass(first) {
  const code = first ? lkMakeCode() : P.link.code;
  const ng = lkPassNg(S.lkP1, S.lkP2, code);
  if (ng) { S.lkMsg = ng; draw(); return; }
  const salt = lkSalt();
  P.link.code = code;
  P.link.salt = salt;
  P.link.pass = lkHash(S.lkP1, salt);
  if (first) P.link.at = Date.now();
  savePlayer();
  S.lkP1 = ''; S.lkP2 = '';
  S.link = first ? 'done' : 'main';
  S.lkMsg = first ? '' : 'パスワードを変更しました';
  SFX.get ? SFX.get() : SFX.pick();
  draw();
}

/* IDをコピーする。クリップボードが使えない環境でも落ちないようにする */
function lkCopy() {
  const t = P.link.code;
  const done = () => { S.lkMsg = 'IDをコピーしました'; draw(); };
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(done, () => { S.lkMsg = 'コピーできませんでした。長押しで選択してください'; draw(); });
      return;
    }
  } catch { /* 使えない環境でも落ちない */ }
  S.lkMsg = '長押しで選択してコピーしてください'; draw();
}

/* IDを画像にして保存する（2026-09-25）。
   ★パスワードは画像に入れない。画像は人に見せやすく、
     写真を一枚渡すだけで乗っ取られてしまうため。IDだけを残す。 */
function lkCard() {
  try {
    const W = 1000, H = 560, c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.fillStyle = '#12100e'; g.fillRect(0, 0, W, H);
    const grd = g.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, '#1e1a14'); grd.addColorStop(1, '#100d09');
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#d8a94a'; g.lineWidth = 6; g.strokeRect(24, 24, W - 48, H - 48);
    g.strokeStyle = '#a8802c'; g.lineWidth = 2; g.strokeRect(40, 40, W - 80, H - 80);
    g.textAlign = 'center';
    g.fillStyle = '#d8a94a';
    g.font = '600 34px "Noto Serif JP", serif';
    g.fillText('わんこ大戦国　引き継ぎID', W / 2, 120);
    g.fillStyle = '#f5e2a8';
    g.font = '700 86px ui-monospace, monospace';
    g.fillText(P.link.code, W / 2, 268);
    g.fillStyle = '#8b8172';
    g.font = '24px sans-serif';
    g.fillText(P.name ? `${P.name}　Lv.${P.lv}` : '名前未設定', W / 2, 340);
    g.fillStyle = '#e0654f';
    g.font = '600 26px sans-serif';
    g.fillText('パスワードは記載していません', W / 2, 424);
    g.fillStyle = '#6a6256';
    g.font = '20px sans-serif';
    g.fillText('この画像は他人に見せないでください', W / 2, 470);
    const a = document.createElement('a');
    a.href = c.toDataURL('image/png');
    a.download = `わんこ大戦国_引き継ぎID_${P.link.code}.png`;
    a.click();
    S.lkMsg = '画像を保存しました';
  } catch { S.lkMsg = '画像を保存できませんでした'; }
  draw();
}

function lkSheet() {
  /* 打つたびに draw を呼ぶと、入力中のカーソルが外れてしまう（2026-09-25）。
     そこで、注意書きと強さの帯だけをその場で書き換える */
  const live = () => {
    const m = document.querySelector('.lkmsg'); if (m) m.remove();
    const bar = document.querySelector('.lkbar'); if (!bar) return;
    const r = lkPassRank(S.lkP1);
    bar.querySelectorAll('i').forEach(i => { i.className = 'b' + r.i; });
    const w = bar.querySelector('span'); if (w) w.textContent = S.lkP1 ? r.w : '';
  };
  const on = (k, v) => ({ oninput: e => { S[k] = e.target.value; S.lkMsg = ''; live(); },
    value: v, class: 'lkin', type: S.lkShow ? 'text' : 'password',
    autocomplete: 'new-password', spellcheck: 'false' });
  const rank = lkPassRank(S.lkP1);
  return [
    el('div', { class: 'lkfield' },
      el('input', { ...on('lkP1', S.lkP1), placeholder: `パスワード（${LK_PASS_MIN}文字以上）` }),
      el('input', { ...on('lkP2', S.lkP2), placeholder: 'もう一度入力' }),
      el('button', { class: 'lkeye', onclick: () => { S.lkShow = !S.lkShow; draw(); } },
        S.lkShow ? '隠す' : '表示')),
    el('div', { class: 'lkbar' },
      el('i', { class: 'b' + rank.i }), el('i', { class: 'b' + rank.i }), el('i', { class: 'b' + rank.i }),
      el('span', {}, S.lkP1 ? rank.w : '')),
  ];
}

function linkSheet() {
  const step = S.link;
  const box = (...kids) => el('div', { class: 'sheet', onclick: e => { if (e.target.classList.contains('sheet')) lkClose(); } },
    el('div', { class: 'card2 lkbox' }, ...kids.filter(Boolean)));

  /* はじめて開いたとき。何のためのものかを先に伝える */
  if (step === 'intro') {
    return box(
      el('b', { class: 'mittl' }, 'データ引き継ぎ'),
      el('p', { class: 'ttsub' },
        '現在のデータは、この端末の中にのみ保存されています。' +
        '機種変更やアプリの再インストールで消えないよう、引き継ぎIDとパスワードを発行してください。'),
      el('div', { class: 'lknote' },
        el('b', {}, '引き継ぎID'), el('span', {}, '自動で発行されます。あとから変更できません'),
        el('b', {}, 'パスワード'), el('span', {}, 'ご自身で決めます。あとから変更できます')),
      ...lkSheet(),
      S.lkMsg ? el('p', { class: 'lkmsg' }, S.lkMsg) : null,
      el('button', { class: 'go wide', onclick: () => lkSavePass(true) }, '発行する'),
      el('button', { class: 'ghost wide', onclick: lkClose }, 'あとで'));
  }

  /* 発行できたところ。ここで必ず控えさせる */
  if (step === 'done') {
    return box(
      el('b', { class: 'mittl' }, '発行しました'),
      el('div', { class: 'lkcode' }, el('span', {}, P.link.code)),
      el('p', { class: 'ttsub' }, 'このIDとパスワードがあれば、別の端末でもデータを引き継げます。' +
        'パスワードは二度と表示されません。忘れないよう保管してください。'),
      el('div', { class: 'lkrow' },
        el('button', { class: 'ghost', onclick: lkCopy }, 'IDをコピー'),
        el('button', { class: 'ghost', onclick: lkCard }, '画像で保存')),
      S.lkMsg ? el('p', { class: 'lkmsg' }, S.lkMsg) : null,
      el('button', { class: 'go wide', onclick: () => { S.link = 'main'; S.lkMsg = ''; draw(); } }, '控えました'));
  }

  /* パスワードを変える */
  if (step === 'pass') {
    return box(
      el('b', { class: 'mittl' }, 'パスワードの変更'),
      el('p', { class: 'ttsub' }, '変更すると、ほかの端末はログアウトされます。'),
      ...lkSheet(),
      S.lkMsg ? el('p', { class: 'lkmsg' }, S.lkMsg) : null,
      el('button', { class: 'go wide', onclick: () => lkSavePass(false) }, '変更する'),
      el('button', { class: 'ghost wide', onclick: () => { S.link = 'main'; S.lkP1 = ''; S.lkP2 = ''; S.lkMsg = ''; draw(); } }, 'キャンセル'));
  }

  /* ふだんの画面 */
  const tied = lkTied(P);
  return box(
    el('b', { class: 'mittl' }, 'データ引き継ぎ'),
    el('div', { class: 'lkcode' }, el('span', {}, P.link.code)),
    el('div', { class: 'lkpass' },
      el('span', { class: 'l' }, 'パスワード'),
      el('span', { class: 'd' }, '● ● ● ● ● ● ● ●'),
      el('button', { class: 'ghost sm', onclick: () => { S.link = 'pass'; S.lkP1 = ''; S.lkP2 = ''; S.lkMsg = ''; SFX.pick(); draw(); } }, '変更')),
    el('div', { class: 'lkrow' },
      el('button', { class: 'ghost', onclick: lkCopy }, 'IDをコピー'),
      el('button', { class: 'ghost', onclick: lkCard }, '画像で保存')),
    S.lkMsg ? el('p', { class: 'lkmsg' }, S.lkMsg) : null,
    el('p', { class: 'lkwarn' }, 'IDとパスワードは他人に教えないでください。'),
    /* 連携。サーバーができるまでは灰のまま並べておく（何につながるかだけ見せる） */
    el('div', { class: 'lkties' },
      el('b', {}, `アカウント連携　${tied} / ${LK_TIES.length}`),
      ...LK_TIES.map(t => el('button', { class: 'lkty soon', disabled: true },
        el('i', {}, t.name.slice(0, 1)),
        el('span', { class: 'n' }, t.name),
        el('span', { class: 'o' }, (P.link.ties || {})[t.id] ? '連携済み' : '準備中')))),
    el('button', { class: 'ghost wide soon', disabled: true }, '別の端末から引き継ぐ（準備中）'),
    closeX(lkClose));
}

/* やり直しの確かめ。二枚はさむ（押し間違いで消えると取り返しがつかないため）。
   ★ここもデータ引き継ぎと同じく、戦国口調を使わない（2026-09-25）。
     消える範囲が伝わらないまま押されるのがいちばん困る */
function resetSheet() {
  const step = S.reset;
  const close = () => { S.reset = 0; draw(); };
  if (step === 1) {
    return el('div', { class: 'sheet', onclick: e => { if (e.target.classList.contains('sheet')) close(); } },
      el('div', { class: 'card2 ttbox' },
        el('b', { class: 'mittl' }, 'データを削除して最初からやり直しますか？'),
        el('p', { class: 'ttsub' }, '武将・小判・番付など、すべてのデータが削除されます。元に戻せません。'),
        el('button', { class: 'go wide danger', onclick: () => { S.reset = 2; SFX.pick(); draw(); } }, '最初からやり直す'),
        el('button', { class: 'ghost wide', onclick: close }, 'キャンセル')));
  }
  return el('div', { class: 'sheet', onclick: e => { if (e.target.classList.contains('sheet')) close(); } },
    el('div', { class: 'card2 ttbox' },
      el('b', { class: 'mittl' }, '本当に削除しますか？'),
      el('p', { class: 'ttsub' }, `${P.name || '名前未設定'}　Lv.${P.lv}　武将 ${P.own.length}体`),
      /* 手形を持っているなら、それも消えることを言っておく（2026-09-25）。
         同じIDは二度と発行されないので、ここを黙っていると事故になる */
      P.link.code ? el('p', { class: 'lkwarn' },
        `引き継ぎID ${P.link.code} も削除されます。同じIDは二度と発行されません。`) : null,
      el('button', { class: 'go wide danger', onclick: () => {
        try { localStorage.removeItem('wanko.player.v1'); } catch { /* 消せない作りでも落ちない */ }
        location.reload();
      } }, '削除して最初から'),
      el('button', { class: 'ghost wide', onclick: close }, 'キャンセル')));
}

/* ---- はじまりの名乗り（2026-09-25）----
   選んだ一騎の横長の一枚絵を全幅で出し、その上に名乗りを重ねる。
   絵は hero（設定画のいちばん上）を第一に、無ければ奥義のカットインで代える。
   どちらも無ければ何も出さず、そのまま城へ入る。 */
const OPENING_CRY = 'いざ尋常に参るわん';
function openingArt() {
  const c = charOf(P.first);
  return c ? (heroUrl(c.no) || cutinArt(c.no, '奥義')) : null;
}
/* 初陣の相手（2026-09-25）。
   本拠地は制覇済みで始まる決まりなので、出発の章のうち まだ取っていない
   いちばん手前の国を初陣にあてる。全部取っていれば初陣は起こさない。 */
function firstPref() {
  const home = PREF[P.camp.start || 'aichi'];
  if (!home) return null;
  const p = PREFS.find(x => x.region === home.region && !prefTaken(x.id))
         || PREFS.find(x => !prefTaken(x.id));
  return p ? { pref: p, step: prefStep(p.id) } : null;
}
function openingSheet() {
  const c = charOf(P.first); const art = openingArt();
  if (!art) return null;
  /* 名乗りのあとは、そのまま初陣へ連れていく（2026-09-25）。
     抜いた武将がどう動くかを、城に入る前に一度見せる。
     出発の国の一戦目をそのまま使う。兵糧は取らない（はじめの一戦なので） */
  const go = () => {
    S.opening = false; SFX.pick();
    /* 名乗りのあとは城へ（2026-09-30）。
       城から、育成 → 武将強化 → 部隊 → 初陣 の順にチュートリアルが案内する。
       前はここから勝手に戦が始まっていて、覚える間がなかった */
    S.screen = 'home';
    draw();
  };
  return el('div', { class: 'opsheet', onclick: go },
    /* 同じ絵をぼかして画面いっぱいに敷く（2026-09-25）。
       一枚絵が横長（2.8:1）なので、真っ黒の中に帯が浮くと寂しかった */
    el('img', { class: 'opbg', src: art, alt: '' }),
    el('div', { class: 'opart' },
      el('img', { src: art, alt: '' }),
      el('div', { class: 'optxt' },
        el('div', { class: 'nm' }, c.name),
        el('div', { class: 'sk', 'data-t': OPENING_CRY }, OPENING_CRY))),
    el('div', { class: 'ophint' }, '画面をたたいて出陣'));
}

/* ---------------- はじまりの一騎（チュートリアル・2026-09-21）----------------
   1. ひとこと世界観
   2. SSRから好きな1体を選ぶ
   3. そのまま わんこみくじ十連（無料）
   これで最低でも11体そろうので、武将0体で始まることはない。 */
function screenTutorial() {
  const step = P.tutorial;
  if (step === 0) {
    /* はじまりの一騎を選ぶ画面（2026-09-30 に作り直した）。
       前は15枚を小さく並べていたので、どの子も同じに見えて選びようがなかった。
       札を一枚だけ大きく出し、左右の矢印か横に払うことで送る。
       札の表には数値も特技も人物紹介も刷ってあるので、ほかの説明は要らない。
       ヘッダーも出さない（はじめて見る画面なので、選ぶことだけに集中させる） */
    const ssr = POOL.SSR.slice().sort((a, b) => a.no - b.no);
    const i = Math.max(0, Math.min(ssr.length - 1, S.tutI || 0));
    const c = ssr[i];
    S.pick = c.no;
    const move = d => { S.tutI = (i + d + ssr.length) % ssr.length; S.tutBack = false; SFX.pick(); draw(); };
    const back = !!S.tutBack;
    const art = back ? cardUrl(c.no, 'back') : cardArt(c);
    let sx = null;                                 // 横に払って送る
    return {
      body: el('div', { class: 'tut tut1' },
        pageTalk('tutorial'),
        el('div', {
          class: 'tutpick',
          onpointerdown: e => { sx = e.clientX; },
          onpointerup: e => {
            if (sx == null) return;
            const d = e.clientX - sx; sx = null;
            if (Math.abs(d) > 40) move(d < 0 ? 1 : -1);
          },
          onpointercancel: () => { sx = null; },
        },
          el('button', { class: 'tutarw l', title: '前の武将', onclick: () => move(-1) }, '‹'),
          /* 押すと表裏が返る（2026-09-30）。
             表には、焼いていない数値をその場で重ねる（ほかの札と同じ仕掛け） */
          el('div', {
            class: 'tutcard' + (art ? ' art' : '') + (back ? ' back' : ''),
            title: back ? '押すと表' : '押すと裏',
            onclick: () => { S.tutBack = !back; SFX.pick(); draw(); },
          },
            art ? el('img', { class: 'tutci', src: art, alt: c.name, draggable: 'false' })
                : el('div', { class: 'tutfall', style: chipStyle(c) },
                    el('b', {}, c.name), attrTag(c.attr, 'sm'), rarTag('SSR')),
            (art && !back) ? cardStatOverlay(c, true) : null,
            el('span', { class: 'tutflip' }, back ? '表' : '裏')),
          el('button', { class: 'tutarw r', title: '次の武将', onclick: () => move(1) }, '›')),
        el('div', { class: 'tutdots' }, ssr.map((x, j) => el('i', { class: j === i ? 'on' : '' }))),
        el('button', {
          class: 'go big out tutgo',
          onclick: () => {
            P.first = c.no;                         // はじまりの一騎を覚える（2026-09-25）
            /* はじめの十連は門出のくじで引く（2026-09-30）。
               信わんが出るのはここだけなので、いちばん最初は必ずこちらを通す */
            S.gbanner = 'release';
            /* 十連は手引きのいちばん最後に回した（2026-09-30）。
               先に部隊を組み、初陣を戦い、育成をひと通りなぞってから引く。
               手ほどき用のもう一騎（いちばん若い番号のN）を添える */
            grantStarter(c.no, guideMate()); setCampStart(c);
            S.pick = null; S.tutI = 0; S.tutBack = false;
            S.opening = !!openingArt(); S.screen = S.opening ? 'tutorial' : 'team';
            savePlayer(); draw();
          },
        }, 'この武将で出陣する')),
      bare: true,
      mid: true,
    };
  }
  /* 選んだあとは、そのまま無料十連へ。
     見た目はふだんのガチャの画面とそろえた（2026-09-26）。
     はじめに見る画面だけ作りが違うと、あとでガチャを開いたとき別物に見える。
     確率は帯で並べず、右上の「詳細」に畳んだ（ふだんのガチャと同じ） */
  /* はじめの十連も、ふだんのガチャと同じ宝箱の演出を通す（2026-09-26） */
  /* 途中で開き直しても、はじめの十連は門出のくじのまま（2026-09-30） */
  if (!S.gacha && !S.rv && !S.rvall) S.gbanner = 'release';
  const showing = !!(S.gbox || S.gboxing || S.rv || S.rvall);
  const inBox = !!(showing || (S.gacha && S.gopen));
  const waiting = !!(S.gbox || S.gboxing);
  return {
    body: (bgEl => el('div', { class: 'gacha tutg art' + (inBox ? ' takara' : '') + (S.rv || S.rvall ? ' bare' : '') },
      S.rv ? null : bgEl,
      showing ? null : gachaTop(),
      S.rv || S.rvall ? null : (S.gacha ? gachaResult(S.gacha) : null),
      S.rv ? revealView(S.rv, bgEl) : S.rvall ? revealAll(S.rvall) : waiting ? gachaBox() : S.gacha
        ? el('button', { class: 'go big out', onclick: tutGoHome }, '城へ戻る')
        : el('div', { class: 'pulls' + (uiUrl('pull_ten_free') || uiUrl('pull_ten') ? ' art' : '') },
            pullBtn('ten free', '十連', '初回無料', true, () => doPull(10, true))),
      S.rates ? ratesSheet(...pityLeft()) : null,
      S.opening ? openingSheet() : null))(gachaBgEl(inBox)),
    /* はじまりの十連もヘッダーを出さない（2026-09-26）。ふだんのガチャと同じ見え方にする */
    bare: true,
  };
}
/* はじまりの十連を見終わって城へ入る（2026-09-26 にひとまとめにした）。
   城へ入る前に、はじまりの一騎の名乗りを一枚はさむ（2026-09-25）。
   絵が無い武将のときはそのまま城へ（絵が無くても動く決まり） */
function tutGoHome() {
  P.tutorial = 2; savePlayer();
  S.gacha = null; S.gopen = false; S.rvall = null; S.rv = null;
  if (openingArt()) { S.opening = true; SFX.pick(); } else S.screen = 'home';
  draw();
}
function tutorDetail(c) {
  if (!c) return null;
  const st = c.stats || {};
  return el('div', { class: 'pkd' },
    el('div', { class: 'h' }, el('b', {}, c.name),
      attrTag(c.attr), rarTag('SSR'), el('span', {}, `コスト ${c.cost}`)),
    el('div', { class: 'sts' },
      ['兵量', '火力', '賢さ', '防御', '回復', '速さ'].map(k =>
        el('div', {}, statLabel(k), el('b', {}, num(st[k] ?? (k === '兵量' ? c.hp : null)) || '―')))),
    c.ultimate ? el('p', { class: 'u' }, el('i', {}, '奥義'), el('b', {}, c.ultimate.name)) : null);
}

/* ---------------- ホーム ---------------- */
/* ---- ホームの左右メニュー（2026-09-22）----
   ヘッダーに詰め込むのをやめ、ホームの画面端に縦に並べる。
   app/assets/ui/menu_<名>.png を置くと、文字の札から絵に変わる（192×192の透過PNG）。
   badge を立てると右上に赤い「！」が出る（お知らせの数がついたら使う）。 */
/* 置き場（2026-09-22 改2）
     side:'TL' … 左上の縦列（正方形の座）。上から お知らせ・道具・仲間
     side:'BR' … 右下・フッターの上。上から お役目（正方形）・イベント・番付
     square    … 右下の列でも正方形のまま出す（お役目だけ）
     off:true  … いまは出さない（お役目は中身が決まってから戻す） */
/* file は app/assets/ui/<file>.png（2026-09-23 に届いた絵）。
   無ければ menu_<名>.png / banner_<名>.png、それも無ければ漢字一文字の札に落ちる */
const HOME_MENU = [
  { side: 'TL', name: 'お知らせ', mark: '報', file: 'home_notice',
    go: () => { S.news = true; S.newsTab = NEWS_TAGS[0]; S.newsId = null; },
    badge: () => newsUnread() },
  { side: 'TL', name: '道具',     mark: '袋', file: 'home_items',   go: () => { S.bag = true; S.bagTab = '稽古'; S.bagSel = null; S.bagMsg = ''; } },
  { side: 'TL', name: '仲間',     mark: '友', file: 'home_friend',
    go: () => { S.fr = true; S.frId = null; S.frMsg = ''; },
    badge: () => frBack() },
  /* 店は育成の中からホームへ移した（2026-09-26）。
     買い物は育てることとは別の用事なので、城の画面から直に入れるほうが早い。
     絵は ui/home_shop.png（無ければ menu_店.png、それも無ければ「店」の一字） */
  { side: 'TL', name: '店',       mark: '店', file: 'home_shop',
    go: () => { S.screen = 'shop'; S.shopTab = 'furi'; S.shopMsg = ''; } },
  /* お役目は右下の列のいちばん上（2026-09-24）。
     右手の親指が届くところに置きたいので左上から移した。
     square を立てると、横長の札の列の中でも正方形のまま右端をそろえて並ぶ */
  { side: 'BR', name: 'お役目',   mark: '任', file: 'home_mission', square: true,
    go: () => { S.mi = true; S.miTab = miTab0(); S.miMsg = ''; },
    badge: () => miReadyCount() },
  { side: 'BR', name: 'イベント', mark: '祭', file: 'home_event',   go: () => { S.screen = 'event'; S.evId = null; S.evMsg = ''; } },
  { side: 'BR', name: '番付',     mark: '番', file: 'home_ranking',
    go: () => { S.rk = true; S.rkSel = null; S.rkPz = false; S.rkPzT = null; S.rkMsg = ''; },
    badge: () => (rkState().last ? 1 : 0) },
  /* 試練の塔（2026-10-01）。左下・全国の釦の上。
     絵（ui/home_tower.png）は看板なので、ほかの座より ひと回り大きく出す */
  { side: 'BL', name: '試練の塔', mark: '塔', file: 'home_tower', big: true,
    go: () => { S.screen = 'tower'; S.twMsg = ''; S.twSel = null; } },
];
function homeMenuBtn(m) {
  const wide = m.side === 'BR' && !m.square;
  const art = (m.file && uiUrl(m.file)) || uiUrl((wide ? 'banner_' : 'menu_') + m.name);
  return el('button', {
    class: (wide ? 'hmw' : 'hmb') + (art ? ' art' : '') + (m.soon ? ' soon' : '')
         + (m.big ? ' big' : ''),
    title: m.soon ? `${m.name}（近日）` : m.name,
    disabled: m.soon ? true : null,
    onclick: m.soon ? null : () => { m.go(); SFX.pick(); draw(); },
  },
    el('span', { class: 'hmi' }, art ? keepImg({ src: art, alt: '' }) : el('i', {}, m.mark)),
    /* 絵が無くて、名が一字の印とおなじなら、下の名札は出さない（2026-09-26）。
       同じ字を二度並べても読むものが増えないし、札の高さが他とそろわなくなる */
    (art || m.name === m.mark) ? null : el('span', { class: 'hml' }, m.name),
    /* 未読の数を赤丸で出す（2026-09-24）。badge は数を返す関数。
       0 のときは丸そのものを出さない */
    (() => {
      const k = typeof m.badge === 'function' ? m.badge() : (m.badge ? 1 : 0);
      return k ? el('em', { class: 'hmbadge' }, k > 9 ? '9+' : String(k)) : null;
    })());
}
const homeMenu = side => {
  const list = HOME_MENU.filter(m => m.side === side && !m.off);
  if (!list.length) return null;
  const cls = side === 'BR' ? 'bottom' : side === 'BL' ? 'bottomleft' : 'topleft';
  return el('div', { class: 'hmenu ' + cls }, list.map(homeMenuBtn));
};

function screenHome() {
  const q = P.squads[P.active];
  const gen = charOf(q.general) || squadChars(q)[0] || null;
  const bg = bgUrl('home');
  const art = gen ? pawnUrl(gen.no) : null;
  /* 背景は画面いっぱい、その手前に総大将を大きく立たせる（2026-09-21）。
     城下町の絵は参道が明るく空いているので、そこに立たせると城を背負った絵になる。
     コマ画像が無い武将は、これまでどおり属性色の札で出す。 */
  return {
    body: el('div', { class: 'home' + (bg ? ' art' : '') },
      keepBg(bg, 'bgfull'),
      bg ? null : el('div', { class: 'keep' },
        el('div', { class: 'castle' }),
        el('div', { class: 'flags' }, [...Array(5)].map(() => el('i', {})))),
      gen ? el('div', { class: 'lordstage' + (art ? '' : ' noart') },
        el('div', { class: 'halo' }),
        /* 立ち絵を押すと、その武将の札がひらく（2026-09-29）。
           ホームの主役はいま出している部隊の総大将なので、
           「この子は誰で、いまどれだけ強いのか」を見るのに図鑑まで回らせない。
           言葉では教えず、右下の小さな「札」の印だけで気づかせる */
        /* 右下に置いていた小さな「札」の印は外した（2026-09-30）。
           城下町の絵の上に浮いて見えるほうが気になった。押せば出る、で足りる */
        el('button', { class: 'lordtap', title: gen.name + 'の札', onclick: () => openCard(gen) },
          art ? keepImg({ class: 'lordart', src: art, alt: gen.name })
              : el('div', { class: 'lordart chip', style: chipStyle(gen) }))) : null,
      /* 戦績の数字と「編成へ」は出さない（2026-09-21）。
         下ナビに編成があるので重複だったし、絵と城を隠していた。 */
      gen ? null : el('div', { class: 'front' },
        el('div', { class: 'lord none' }, el('div', { class: 'say' },
          el('b', {}, 'まだ武将がおらぬ'),
          el('span', {}, 'わんこみくじで武将を集めよ')))),
      homeMenu('TL'), homeMenu('BL'), homeMenu('BR'),
      tebikiCard()),
    nav: true,
  };
}

/* 出す部隊をえらぶ札（2026-09-29）。
   全国の出陣画面には前から部隊の一覧があったが、お祭り・稽古・番付は
   いまの部隊のまま始まってしまい、組み替えるには画面を戻るしかなかった。
   どの戦でも、始める前にここを一枚挟む。
   札を押すと P.active が変わる（全国の出陣画面と同じ仕掛け）ので、
   選んでから「この部隊で挑む」でそのまま戦に入る */
function sqAsk(title, note, go, solo) {
  /* solo は一騎打ち（2026-09-30）。出るのは総大将ひとりなので、
     コストの上限も同じ元武将の重なりも見ない。部隊は「誰を出すか」を決めるためだけに通す */
  S.sqp = { title, note, go, solo: !!solo }; SFX.pick(); draw();
}
function sqSheet() {
  const a = S.sqp; if (!a) return null;
  const close = () => { S.sqp = null; SFX.pick(); draw(); };
  const q = P.squads[P.active] || { nos: [] };
  const over = squadCost(q) > costMax();
  const dups = dupOrigins(q.nos);
  const ok = q.nos.length && (a.solo || (!over && !dups.length));
  return el('div', { class: 'sheet', onclick: e => { if (e.target.classList.contains('sheet')) close(); } },
    el('div', { class: 'card2 sqbox' },
      el('b', { class: 'sqttl' }, a.title),
      a.note ? el('p', { class: 'note' }, a.note) : null,
      el('div', { class: 'sqlist' }, P.squads.map((sq2, i) => squadCard(sq2, i))),
      !q.nos.length ? el('p', { class: 'note warn' }, '部隊を編成してから挑める')
        : a.solo ? null
        : over ? el('p', { class: 'note warn' }, `コストが上限を超えている（${squadCost(q)} / ${costMax()}）`)
        : dups.length ? el('p', { class: 'note warn' }, '同じ武将が重なっておる。編成で片方を外すわん')
        : null,
      /* 道具の釦は、ここにも置く（2026-09-29）。
         お祭り・稽古・番付は全国の出陣画面を通らないので、
         この札を挟むようになってから道具を持ち込むところが無くなっていた。
         見た目と置き場所は全国の出陣と同じ（挑むの右に丸く） */
      (() => {
        const prepN = prepList().length;
        const part = uiUrl('btn_道具');
        return el('div', { class: 'mgrow sqgo' },
          el('button', { class: 'go', disabled: ok ? null : true,
            onclick: () => { const g = a.go; S.sqp = null; g(); } }, 'この部隊で挑む'),
          el('button', {
            class: 'prepcir' + (prepN ? ' on' : '') + (part ? ' art' : ''), title: '道具を使う',
            onclick: () => { S.prepBox = true; SFX.pick(); draw(); },
          }, part ? keepImg({ src: part, alt: '道具' }) : el('i', {}, '具'),
             el('em', {}, `${prepN}/${PREP_MAX}`)));
      })(),
      prepTags(),
      el('button', { class: 'ghost wide', onclick: close }, 'やめる')),
    S.prepBox ? prepSheet() : null);
}
/* ---------------- 全国（ステージと部隊を選んで出陣）---------------- */
/* 部隊の札。選んでいる札をもう一度押すと、そのまま編成へ進む（2026-09-21）。
   下までスクロールして「編む」を押しに行かなくてよい。ボタンはそのまま残してある */
function squadCard(q, i, onPick, toEdit) {
  const over = squadCost(q) > costMax();
  const empty = !q.nos.length;
  const on = P.active === i;
  const dups = dupOrigins(q.nos);          // 同じ元武将の重なり（2026-09-22）
  return el('button', {
    class: 'sq' + (on ? ' on' : '') + (empty ? ' empty' : '') + (dups.length ? ' dupl' : ''),
    onclick: () => {
      if (on && toEdit) { S.screen = 'team'; SFX.pick(); draw(); return; }
      P.active = i; SFX.pick(); (onPick || draw)();
    },
  },
    el('div', { class: 'h' },
      el('b', {}, q.name),
      dups.length ? el('span', { class: 'c over' }, '同じ武将あり') : null,
      /* 総戦力はコストの左に（2026-09-23）。
         数字が二つ並ぶので、どちらも「名前＋数」の形にして読み違えないようにする */
      empty ? null : el('span', { class: 'c pw' }, el('em', {}, '総戦力'), squadPower(q)),
      el('span', { class: 'c' + (over ? ' over' : '') },
        empty ? null : el('em', {}, 'コスト'),
        empty ? '未編成' : squadCost(q))),
    el('div', { class: 'b' },
      /* 空のときの説明書きは出さない（2026-09-25）。
         「未編成」と右の「編成」の釦で足りる */
      el('div', { class: 'ms' }, empty
        ? null
        : squadChars(q).map(c => el('span', {
            class: 'm' + (q.general === c.no ? ' gen' : ''), style: chipStyle(c),
            title: c.name,
          })))),
    /* 右下の近道（2026-09-23）。行き先は画面で入れ替える。
       出陣の画面からは「編成」＝その部隊をそのまま編成で開く
       （敵と重なった武将を外したり、コスト超過を直したりするため）。
       部隊の画面からは「出陣」＝その部隊を選んで全国へ。
       枠じたいが button なので、中はボタンにせず span で受ける */
    /* 陣形の見本は「出陣」の釦の真上（2026-09-27）。
       題の列にも顔の列にも場所を取らせず、右の柱にまとめる */
    empty ? null : el('span', { class: 'fpm', title: formName(q.form) }, formPreview(q.form, 28)),
    el('span', {
      class: 'sqedit' + (toEdit ? ' out' : ''), role: 'button', tabindex: '0',
      title: toEdit ? `${q.name} で出陣する` : `${q.name} を編成する`,
      onclick: e => {
        e.stopPropagation();
        P.active = i; S.pickMsg = '';
        /* 部隊えらびの札から編成へ抜けるとき（2026-09-30）。
           札を閉じずに画面だけ変えていたので、編成の上に札が残り、
           「押しても何も起きない」ように見えていた。
           札は預かっておいて、編成の左下の釦でそのまま戦へ戻れるようにする */
        /* 友の家や番付の札も一緒に預ける（2026-09-30）。
           これらは画面をまたいで出しっぱなしなので、閉じずに編成へ行くと
           編成の上に覆いかぶさって「押しても何も起きない」ように見えていた */
        if (S.sqp) {
          S.sqpHold = { ask: S.sqp, from: S.screen, fr: S.fr, frId: S.frId, rk: S.rk };
          S.sqp = null; S.fr = false; S.frId = null; S.rk = false;
        }
        S.screen = toEdit ? 'map' : 'team';
        SFX.pick(); savePlayer(); draw();
      },
    }, el('i', {}, toEdit ? '出' : '陣'), toEdit ? '出陣' : '編成'),
  );
}
/* 全国＝天下統一の道（2026-09-21）
   章（地方）を選び、その中の国を1つずつ取っていく。 */
/* 家紋。絵が無ければ家名の頭一文字を丸に入れる */
/* 横に長い紋（州浜など）は、座の中で小さく見えるので少し広げる（2026-09-21） */
/* 横に広い紋は丸いっぱいまで広げる（ふつうは丸の76%）。
   雑賀衆の八咫烏は翼をひろげていて縦が短く、26pxだと他より小さく見えた（2026-09-28） */
const WIDE_KAMON = new Set(['里見家', '雑賀衆']);
function kamon(house, cls) {
  const u = kamonUrl(house);
  return el('span', { class: 'kam' + (cls ? ' ' + cls : '') + (WIDE_KAMON.has(house) ? ' wide' : '') },
    u ? el('img', { src: u, alt: house }) : el('i', {}, (house || '？')[0]));
}
function prefCard(p) {
  const step = prefStep(p.id), taken = prefTaken(p.id);
  return el('button', {
    class: 'pc' + (taken ? ' taken' : '') + (p.battles > 1 ? ' big' : ''),
    onclick: () => { S.pref = p.id; SFX.pick(); draw(); },
  },
    kamon(p.house),
    el('div', { class: 'pci' },
      el('b', {}, p.name),
      el('span', { class: 'lord' }, p.house),
      el('span', { class: 'pcst' }, taken ? '制覇' : (p.battles > 1 ? `${step} / ${p.battles} 戦` : '未征服'))));
}
/* 絵巻の日本地図（2026-09-21）。3枚を横に並べて、指で左右になぞる。
   国の位置には家紋の旗を立てる。旗を押すと出陣のページへ移る。 */
function flagBtn(p, open) {
  const ok = open.includes(p.region);
  const taken = prefTaken(p.id);
  return el('button', {
    class: 'flag' + (taken ? ' taken' : '') + (ok ? '' : ' locked') + (p.battles > 1 ? ' big' : ''),
    style: `left:${mapX(p)}%;top:${mapY(p)}%`,
    disabled: ok ? null : true,
    title: ok ? `${p.name}　${p.house}` : 'まだ行けぬ',
  },
    /* 制した国にはのぼりを立てる（2026-09-29）。
       家紋の縁を光らせるだけでは、地図を引いて見たときに分からなかった。
       色は青にした（2026-09-30）。地図の紙が茶と朱なので、赤だと同化して見えない。
       戦いの画面とも揃えた（自軍＝青／敵＝赤） */
    taken && uiUrl('nobori_青') ? keepImg({ class: 'fnob', src: uiUrl('nobori_青'), alt: '制覇' }) : null,
    kamon(p.house, 'onmap'), el('span', { class: 'fn' }, ok ? p.house : '？'));
}
function japanMap(maps, open, reg) {
  /* 3枚の絵を「巻」ごとに箱へ入れる（2026-09-22）。
     こうすると継ぎ目の霞を CSS だけで 2枚目・3枚目の左端に置ける。
     以前は 33.3334% / 66.6667% と決め打ちだったが、絵の白フチを切ったので
     3枚の幅がそろわなくなり、位置がずれるようになった。 */
  const inner = el('div', { class: 'jmapin' },
    maps.map(u => el('span', { class: 'jmc' }, el('img', { class: 'jm', src: u, alt: '' }))),
    PREFS.map(p => {
      const b = flagBtn(p, open);
      b.onclick = () => { S.pref = p.id; S.screen = 'march'; SFX.pick(); draw(); };
      return b;
    }));
  const scroller = el('div', { class: 'jmap' }, inner);
  // 制覇の数・章のタブ・章の名は、地図の上に重ねる（2026-09-21）
  const over = el('div', { class: 'jover' },
    el('div', { class: 'unibar' }, el('b', {}, `制覇 ${takenCount()} / ${PREFS.length}`)),
    el('div', { class: 'row chapters' }, REGION_ORDER.map(id => {
      const ok = open.includes(id), done = regionTaken(id);
      const r = REGIONS.find(x => x.id === id);
      return el('button', {
        class: 'chip' + (S.region === id ? ' on' : '') + (ok ? '' : ' locked') + (done ? ' done' : ''),
        disabled: ok ? null : true,
        onclick: () => { S.region = id; S.pref = null; SFX.pick(); draw(); },
      }, ok ? r.name : '？');
    })),
    // 章の題。絵（app/assets/ui/title_九州.png など）があれば文字の代わりに出す
    (() => {
      const art = uiUrl('title_' + reg.name);
      return el('div', { class: 'jttl' + (art ? ' art' : '') },
        art ? el('img', { src: art, alt: reg.label }) : reg.label);
    })());
  const wrap = el('div', { class: 'jwrap' }, scroller, over);
  /* 鼠で引きずっても動くようにする（2026-09-30）。
     指はそのまま巻けるが、机の上では引きずるほうが自然。
     6px 動いてから「引きずり」とみなし、そのときだけ旗の押しこみを止める。 */
  let drag = null;
  scroller.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    drag = { x: e.clientX, y: e.clientY, sl: scroller.scrollLeft, st: scroller.scrollTop, on: false };
  });
  scroller.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.on && Math.abs(dx) + Math.abs(dy) < 6) return;
    if (!drag.on) { drag.on = true; scroller.classList.add('jdrag'); }
    scroller.scrollLeft = drag.sl - dx;
    scroller.scrollTop = drag.st - dy;
  });
  for (const t of ['pointerup', 'pointercancel', 'pointerleave'])
    scroller.addEventListener(t, () => {
      if (drag && drag.on) setTimeout(() => scroller.classList.remove('jdrag'), 0);
      drag = null;
    });
  // いまの章が真ん中に来るように寄せる（縦も合わせる：2026-09-30）
  const center = () => {
    const first = prefsOf(S.region)[0];
    if (!first || !inner.clientWidth) return;
    scroller.scrollLeft = Math.max(0, mapX(first) / 100 * inner.clientWidth - scroller.clientWidth / 2);
    scroller.scrollTop = Math.max(0, mapY(first) / 100 * inner.clientHeight - scroller.clientHeight / 2);
  };
  requestAnimationFrame(center);
  setTimeout(center, 300);
  return wrap;
}
/* ================= お役目（2026-09-24）=================
   ホームの「任」から開く。日課・週課・祭・累計褒美の四つ。
   同じ行いで四つとも進み、褒美はそれぞれ別にもらえる。 */

/* 受け取り済みの箱。タグごとに分けてあるので、日課は日が変わると空に戻る */
const MI_GOT = { 門出: 'gf', 日課: 'gd', 週課: 'gw', 祭: 'ge', 累計褒美: 'gt' };
const miNow = m => (P.mi[MI_BOX[m.tab]] || {})[m.key] || 0;
const miDone = m => miNow(m) >= m.goal;
const miGot = m => (P.mi[MI_GOT[m.tab]] || []).includes(m.id);
const miReady = m => miDone(m) && !miGot(m);
const miOfTab = tab => MISSIONS.filter(m => m.tab === tab);
/* 門出（初回だけのお役目・2026-09-26）。
   九つ全部を受け取り終えたら、タグごと画面から消す。
   「一度きり」を数で説明せず、消えることで伝える */
const kadodeOver = () => miOfTab(KADODE).every(miGot);
const miTabs = () => MI_TABS.filter(t => t !== KADODE || !kadodeOver());
const miTab0 = () => miTabs()[0];
/* 受け取れるお役目の数。ホームの札の赤丸と、タグの肩に出す */
const miReadyCount = tab => (tab ? miOfTab(tab) : MISSIONS).filter(miReady).length;

/* 褒美の中身を一行の文にする */
function miWords(rw) {
  const w = [];
  if (rw.koban) w.push(`小判 ${rw.koban}`);
  if (rw.soul) w.push(`武士の魂 ${rw.soul}`);
  if (rw.stone) w.push(`石 ${rw.stone}`);
  if (rw.stamina) w.push(`兵糧 ${rw.stamina}`);
  if (rw.ticket) w.push(`${TICKET} ${rw.ticket}`);
  for (const [k, v] of Object.entries(rw.items || {})) w.push(`${k} ${v}`);
  if (rw.title) w.push(`称号「${rw.title}」`);
  return w.join('　');
}

/* 褒美の絵（2026-09-28）。字だけだと何が貰えるか分からなかったので、
   札のいちばん左に一つ置く。品が先、なければ通貨、それも無ければ称号の印。
   絵が無ければ itemIcon が字に落ちるので、素材が無くても崩れない */
function miIcon(rw) {
  rw = rw || {};
  const it = Object.keys(rw.items || {})[0];
  if (it) return itemIcon(it);
  if (rw.ticket) return itemIcon(TICKET);
  if (rw.koban) return curIcon('koban');
  if (rw.soul) return curIcon('soul');
  if (rw.stone) return curIcon('stone');
  if (rw.stamina) return curIcon('food');
  /* 称号の褒美は、その称号の額（frame）の絵をそのまま出す（2026-09-28）。
     「称」の一字だけでは何がもらえるのか分からず、小判だけ絵で浮いていた。
     額は称号と一対一なので、絵を見ればどの称号か分かる。絵が無ければ「称」に落ちる */
  if (rw.title) {
    const fu = frameUrl(rw.title);
    return fu ? el('span', { class: 'itic ktitle art', title: rw.title },
                     el('img', { src: fu, alt: rw.title, loading: 'lazy' }))
              : el('span', { class: 'itic' }, '称');
  }
  return null;
}

/* 一つ受け取る。受け取れない札を押しても何も起きない */
function miTake(m) {
  if (!miReady(m)) return null;
  const rw = m.rw || {};
  if (rw.koban) P.koban += rw.koban;
  if (rw.soul) P.soul += rw.soul;
  if (rw.stone) P.free += rw.stone;
  if (rw.stamina) P.stamina = Math.min(P.staminaMax, P.stamina + rw.stamina);
  if (rw.ticket) P.items[TICKET] = (P.items[TICKET] || 0) + rw.ticket;
  for (const [k, v] of Object.entries(rw.items || {})) P.items[k] = (P.items[k] || 0) + v;
  if (rw.title) gainTitle(rw.title);
  P.mi[MI_GOT[m.tab]].push(m.id);
  // 果たしたお役目の通算（称号「門前の子犬」に使う・2026-09-25）。
  // miBump を使うと日が変わっていたときに今いれた gd が飛ぶので、通算だけ直に足す
  P.mi.t.duty = (P.mi.t.duty || 0) + 1;
  savePlayer();
  return rw;
}
/* まとめて受け取る。いま出ているタグのぶんだけ */
function miTakeAll(tab) {
  const list = miOfTab(tab).filter(miReady);
  if (!list.length) return 0;
  for (const m of list) miTake(m);
  return list.length;
}

/* いまの値から決まるものを、お役目の数に写す（2026-09-24）。
   出陣の回数のように積むものは miBump、制覇の国数のように
   「いまいくつか」で決まるものはここで miSet する。
   起動したときと、戦や育成のあとに呼ぶ。 */
function miRefresh() {
  miRoll();
  if (!(P.mi.d.login || 0)) miBump('login');          // その日はじめて城に戻った
  miSet('taken', takenCount());                        // 制した国の数
  // 極みまで育てた武将の数。覚醒で上限が伸びるので「いまの上限に届いているか」で見る
  miSet('maxLv', P.own.filter(n => hasCard(n) && charState(n).lv >= lvCapOf(n)).length);
  miSet('chap', REGION_ORDER.filter(regionTaken).length);   // 平定した章の数（2026-09-25）
  /* 門出の「ぜんぶ果たす」（2026-09-26）。受け取りではなく達成の数で見るので、
     八つ目が済んだその場で九つ目が灯り、まとめて頂戴で一度に取れる */
  miSet('kadode', miOfTab(KADODE).filter(m => m.key !== 'kadode' && miDone(m)).length);
  rkRoll();    // 番付の日と月の切り替わり（2026-09-25）。開いていなくても留守番の戦は進む
  checkTitles();
}
/* ---- 称号30（2026-09-25）----
   5つの系統（全国・番付・錬成・集め・お祭り）に位1〜6がひとつずつ。
   位は絵の格（枠の素材と色数）を決めるだけで、手に入る条件とは別。
   枠の絵は app/assets/frame/<称号>.webp。無ければ今までの金の細い縁に落ちる。

   名はファイル名そのものになるので、あとから変えない。 */
/* 肩書きがまだ無いときの呼び名（2026-09-26）。額も付かない */
const NONAME = '無名';
const cnt = k => (P.mi && P.mi.t ? P.mi.t[k] : 0) || 0;
/* 称号に使う総合力（2026-09-25）。
   teamPower() は編成の画面で今えらんでいる5人を見るので、
   別の画面にいるあいだ取りこぼさないよう、いまの部隊のほうとも見くらべる。
   段の高さは実測で決めた：コスト上限1000で組める最も強い5人が
   Lv1で約14500、Lv99（2.96倍）で約42900。覇者はその9割ほどに置いてある */
const titlePower = () => {
  let a = 0, b = 0;
  try { a = teamPower(); } catch { /* 画面によっては選んでいない */ }
  try { b = squadPower(P.squads[P.active]); } catch { /* 部隊が無いことがある */ }
  return Math.max(a, b);
};
/* 家の名がそろっていない（織田家／織田軍）ので、末尾の「家」「軍」を落としてから数える */
const clanStem = c => String(c.clan || '').replace(/(家|軍)$/, '');
const clanAll = name => {
  const list = C.filter(c => clanStem(c) === name);
  return list.length > 0 && list.every(c => P.own.includes(c.no));
};
const TITLES = [
  /* 全国 ─ 制した国の数 */
  /* はじめから額が付いていると、肩書きを取った手応えが無い（2026-09-26）。
     一国でも取ってから渡す。それまでは肩書き無し＝「無名」で、額も付かない */
  { n: '野伏せり',     g: '全国', t: 1, f: () => takenCount() >= 1 },
  { n: '里の番犬',     g: '全国', t: 1, f: () => takenCount() >= 3 },
  { n: '城持ち',       g: '全国', t: 2, f: () => takenCount() >= 10 },
  { n: '大名',         g: '全国', t: 4, f: () => takenCount() >= 22 },
  { n: '国盗り',       g: '全国', t: 5, f: () => takenCount() >= 38 },
  { n: '天下統一',     g: '全国', t: 6, f: () => takenCount() >= PREFS.length },
  /* 番付 ─ 総合力と勝ち星 */
  { n: '足軽頭',       g: '番付', t: 1, f: () => titlePower() >= 8000 },
  { n: '侍大将',       g: '番付', t: 2, f: () => titlePower() >= 14000 },
  { n: '道場破り',     g: '番付', t: 3, f: () => frTotal().win >= 10 },
  { n: '鬼神',         g: '番付', t: 4, f: () => titlePower() >= 22000 },
  { n: '軍神',         g: '番付', t: 5, f: () => titlePower() >= 30000 },
  /* 総合力に届いたうえで、本丸の番付で一位に立つこと（2026-09-25） */
  { n: '覇者',         g: '番付', t: 6,
    f: () => titlePower() >= 38000 && rkState().tier === RK_TIERS.length - 1 && rkMyRank() === 1 },
  /* 錬成 ─ 強化・継承・覚醒 */
  { n: '鍛冶の見習い', g: '錬成', t: 1, f: () => cnt('upOk') >= 1 },
  { n: '相伝の口',     g: '錬成', t: 2, f: () => cnt('inhOk') >= 1 },
  { n: '鍛冶好き',     g: '錬成', t: 3, f: () => cnt('upOk') >= 30 },
  { n: '相伝の主',     g: '錬成', t: 4, f: () => cnt('inhOk') >= 30 },
  { n: '鍛冶狂い',     g: '錬成', t: 5, f: () => cnt('up') >= 300 },
  { n: '業物の主',     g: '錬成', t: 6, f: () => cnt('maxLv') >= 10 },
  /* 集め ─ 図鑑と家 */
  { n: '犬好き',       g: '集め', t: 1, f: () => P.own.length >= 20 },
  { n: '真田党',       g: '集め', t: 2, f: () => clanAll('真田') },
  { n: '織田党',       g: '集め', t: 3, f: () => clanAll('織田') },
  { n: '武田党',       g: '集め', t: 4, f: () => clanAll('武田') },
  { n: '目利き',       g: '集め', t: 5, f: () => P.own.length >= 70 },
  { n: '万犬の主',     g: '集め', t: 6, f: () => P.own.length >= C.length },
  /* お祭り ─ 祭・お役目・日々 */
  { n: '門前の子犬',   g: 'お祭り', t: 1, f: () => cnt('duty') >= 1 },
  { n: '拾い上手',     g: 'お祭り', t: 2, f: () => cnt('item') >= 50 },
  { n: '日参',         g: 'お祭り', t: 3, f: () => cnt('login') >= 30 },
  { n: '祭ばやし',     g: 'お祭り', t: 4, f: () => cnt('ev') >= 5 },
  { n: '百戦錬磨',     g: 'お祭り', t: 5, f: () => cnt('battle') >= 500 },
  /* 祭の番付ができたら「一位」に差し替える（2026-09-25 時点では出た回数） */
  { n: '祭の主',       g: 'お祭り', t: 6, f: () => cnt('ev') >= 20 },
  /* 番付の蔵で軍功と引き換える肩書き（2026-09-25）。
     実績でとる30個とは別枠。f が false なのは、買う以外では手に入らないため。
     ここに並べておかないと checkTitles が「知らない称号」として落としてしまう */
  /* 試練の塔（2026-10-01）。十階ごとの櫓の主を抜くと渡す。
     f が false なのは、登る以外では手に入らないため。
     ここに並べておかないと checkTitles が「知らない称号」として落としてしまう */
  { n: '塔に入りし者', g: '塔', t: 1, f: () => false },
  { n: '寡兵の将',     g: '塔', t: 2, f: () => false },
  { n: '地の利',       g: '塔', t: 2, f: () => false },
  { n: '一門の主',     g: '塔', t: 3, f: () => false },
  { n: '無傷の名',     g: '塔', t: 3, f: () => false },
  { n: '疾風',         g: '塔', t: 4, f: () => false },
  { n: '役者ぞろい',   g: '塔', t: 4, f: () => false },
  { n: '位に依らず',   g: '塔', t: 5, f: () => false },
  { n: '奇策の主',     g: '塔', t: 5, f: () => false },
  { n: '天守の主',     g: '塔', t: 6, f: () => false },
  { n: '誉れ者',       g: '蔵', t: 3, f: () => false },
  { n: '一騎当千',     g: '蔵', t: 4, f: () => false },
  { n: '番付の主',     g: '蔵', t: 6, f: () => false },
];
const TITLE_ORDER = new Map(TITLES.map((x, i) => [x.n, i]));
const titleOf = n => TITLES.find(x => x.n === n) || null;

/* 手に入る条件を満たした称号を配る。一度取れば消えない。
   古い称号（国人・小名・大大名）は30個に入れ替えたので、持っていても落とす */
function checkTitles() {
  let got = false;
  for (const x of TITLES) {
    let ok = false;
    try { ok = !!x.f(); } catch { ok = false; }   // 数え方がまだ無いものは飛ばす
    if (ok) got = gainTitle(x.n) || got;
  }
  const keep = (P.titles || []).filter(t => TITLE_ORDER.has(t));
  if (keep.length !== (P.titles || []).length) {
    P.titles = keep;
    if (!keep.includes(P.title)) P.title = keep[0] || '';
    savePlayer(); got = true;
  }
  return got;
}

/* 称号を選ぶ（2026-09-24、2026-09-25 に入口を顔へ移した）。
   ヘッダーの顔をたたくと開く。名乗った称号は、友の一覧でこちらを見た相手に出る。
   自分の画面には出さない（自分の格は自分が一番よく知っているので） */
function ttSheet() {
  const close = () => { S.tt = false; draw(); };
  const list = P.titles || [];
  return el('div', { class: 'sheet', onclick: e => { if (e.target.classList.contains('sheet')) close(); } },
    el('div', { class: 'card2 ttbox' },
      el('b', { class: 'mittl' }, '称号'),
      el('p', { class: 'ttsub' }, list.length
        ? '選んだ称号が、友から見たときの名の下に出るワン！'
        : 'まだ称号は無いワン！　お役目を果たすか、国を獲れば手に入るワン！'),
      list.length ? el('div', { class: 'ttlist' }, list.slice()
        .sort((a, b) => (TITLE_ORDER.get(a) ?? 99) - (TITLE_ORDER.get(b) ?? 99)).map(t =>
        /* 額の絵があれば、その称号の額を小さく出す（2026-09-25）。
           肩書きと見た目が同時に変わるので、選ぶ前に見せておく */
        el('button', {
          class: 'ttc' + (P.title === t ? ' on' : '') + (frameUrl(t) ? ' hasfr' : ''),
          onclick: () => { P.title = t; savePlayer(); SFX.pick(); draw(); },
        }, frameUrl(t) ? el('img', { class: 'ttfr', src: frameUrl(t), alt: '', loading: 'lazy' }) : null,
          el('span', {}, t))) ) : null,
      closeX(close)));
}

function miSheet() {
  miRefresh();
  const close = () => { S.mi = false; S.miMsg = ''; draw(); };
  // 開いている間に門出が終わることがある（最後の一つを受け取った直後）
  const tab = miTabs().includes(S.miTab) ? S.miTab : (S.miTab = miTab0());
  const list = miOfTab(tab);
  const ready = miReadyCount(tab);
  return el('div', { class: 'sheet', onclick: e => { if (e.target.classList.contains('sheet')) close(); } },
    el('div', { class: 'card2 mibox' },
      el('b', { class: 'mittl' }, 'お役目'),
      el('div', { class: 'mitabs' }, miTabs().map(t => {
        const k = miReadyCount(t);
        return el('button', {
          class: 'mitab' + (tab === t ? ' on' : ''),
          onclick: () => { S.miTab = t; S.miMsg = ''; SFX.pick(); draw(); },
        }, t, k ? el('em', {}, k > 9 ? '9+' : String(k)) : null);
      })),
      el('div', { class: 'milist' }, list.length ? list.map(m => {
        const now = Math.min(miNow(m), m.goal);
        const pct = Math.round(now / m.goal * 100);
        const got = miGot(m), can = miReady(m);
        const ic = miIcon(m.rw);
        return el('div', { class: 'mirow' + (got ? ' got' : '') + (can ? ' can' : '') + (ic ? ' hasic' : '') },
          /* 褒美の絵を押すと、その品が何かを出す（2026-09-30）。
             絵だけでは「石」も「稽古の書」も何に使うのか分からなかった */
          ic ? el('button', { class: 'miic tapic', title: '何に使うか見る',
            onclick: e => { e.stopPropagation(); S.rwi = m.rw; SFX.pick(); draw(); } }, ic) : null,
          el('div', { class: 'mitxt' },
            el('b', {}, m.text),
            /* 品の名だけでは何の行か分からなかったので、頭に「褒美」と置く（2026-09-28）。
               ゲームの中の言い回しにそろえた（累計褒美・お役目の褒美） */
            el('i', {}, el('em', { class: 'mirwl' }, '褒美'), miWords(m.rw || {}))),
          el('div', { class: 'mibar' }, el('span', { style: `width:${pct}%` })),
          el('div', { class: 'minum' }, `${num(now)} / ${num(m.goal)}`),
          el('button', {
            class: 'mig' + (can ? ' on' : ''), disabled: can ? null : true,
            onclick: () => {
              const rw = miTake(m);
              if (rw) { S.miMsg = miWords(rw); SFX.get(); draw(); }
            },
          }, got ? '済' : '頂戴'));
      }) : el('p', { class: 'minone' }, 'いまはお役目がないワン！')),
      S.miMsg ? el('p', { class: 'mimsg' }, S.miMsg) : null,
      el('button', {
        class: 'go wide' + (ready ? '' : ' soon'), disabled: ready ? null : true,
        onclick: () => { const n = miTakeAll(tab); if (n) { S.miMsg = `${n} つ受け取ったワン！`; SFX.get(); draw(); } },
        /* 数は札の右上に出ているので、釦には書かない（2026-09-25） */
      }, 'まとめて頂戴いたす'),
      closeX(close)));
}

/* 褒美の品が何かを出す札（2026-09-30）。
   お役目の絵を押すと開く。品は蔵の説明（ITEMS の desc）をそのまま使い、
   通貨と称号はここに一行ずつ書いてある。数はその褒美でもらえる数を添える。 */
const CUR_INFO = {
  koban:  ['小判',     '蔵で道具を買うのに使う'],
  soul:   ['武士の魂', '重ねを解雇すると増える。魂の市で使う'],
  stone:  ['石',       'くじを引くのに使う'],
  stamina:['兵糧',     '出陣に要る。時がたつと戻る'],
};
function rwInfoRows(rw) {
  const out = [];
  for (const [k, [nm, note]] of Object.entries(CUR_INFO))
    if (rw[k]) out.push({ icon: curIcon(k), name: nm, n: rw[k], note });
  if (rw.ticket) out.push({ icon: itemIcon(TICKET), name: TICKET, n: rw.ticket,
    note: (ITEMS[TICKET] || {}).desc || 'お祭りの一戦に使う' });
  for (const [k, v] of Object.entries(rw.items || {}))
    out.push({ icon: itemIcon(k), name: k, n: v, note: (ITEMS[k] || {}).desc || '' });
  if (rw.title) out.push({ icon: miIcon({ title: rw.title }), name: `称号「${rw.title}」`, n: 0,
    note: '名の前につく肩書き。顔の額も変わる' });
  return out;
}
function rwInfoSheet() {
  const rw = S.rwi; if (!rw) return null;
  const close = () => { S.rwi = null; draw(); };
  const rows = rwInfoRows(rw);
  /* 幕は薄く（rwish）。後ろのお役目の並びを見せたまま重ねる（2026-09-30） */
  return el('div', { class: 'sheet rwish', onclick: e => { e.stopPropagation();
      if (e.target.classList.contains('sheet')) close(); } },
    el('div', { class: 'card2 rwibox', onclick: e => e.stopPropagation() },
      el('b', { class: 'mittl' }, 'この褒美について'),
      el('div', { class: 'rwilist' }, rows.length ? rows.map(r =>
        el('div', { class: 'rwirow' },
          el('div', { class: 'rwiic' }, r.icon),
          el('div', { class: 'rwitx' },
            el('b', {}, r.name, r.n ? el('em', {}, `×${num(r.n)}`) : null),
            el('p', {}, r.note || '―')))) : el('p', { class: 'minone' }, '―')),
      closeX(close)));
}

/* ================= 手引き（2026-09-25）=================
   城に入ってから、遊び方をひと通りなぞってもらう小さな札。
   押させて覚えてもらう形にしてあるので、強くは止めない（閉じても進める）。
   済んだかどうかは、いまの持ち物や部隊を見て決める（別に数を持たない）。 */
const TEBIKI = [
  { k: '編成', text: '部隊に五人そろえるワン！', go: () => { S.screen = 'team'; },
    ok: () => (P.squads[P.active] || {}).nos.length >= 5 },
  { k: '強化', text: '武将を一度 強くするワン！', go: () => { S.screen = 'power'; },
    ok: () => Object.values(P.chars || {}).some(c => (c.lv || 1) > 1) },
  { k: 'お役目', text: 'お役目の褒美を受け取るワン！', go: () => { S.mi = true; S.miTab = miTab0(); S.miMsg = ''; },
    ok: () => cnt('duty') >= 1 },
];
/* いくつ目まで済んだか。0＝初陣もまだ／1〜＝手引きの何番目か */
const tebikiStep = () => (P.tut2.on ? 1 + TEBIKI.filter(t => t.ok()).length : 0);
const tebikiAll = () => TEBIKI.every(t => t.ok());
/* 仕上げの褒美 */
const TEBIKI_PRIZE = { stone: 300, koban: 3000, items: { '稽古の書': 10 } };
function tebikiTake() {
  P.free += TEBIKI_PRIZE.stone;
  P.koban += TEBIKI_PRIZE.koban;
  for (const [k, v] of Object.entries(TEBIKI_PRIZE.items)) P.items[k] = (P.items[k] || 0) + v;
  P.tut2.got = true; P.tut2.on = false;
  savePlayer();
}
/* ホームに出す札。全部済んで褒美も受け取ったら、もう出ない */
function tebikiCard() {
  if (!P.tut2 || !P.tut2.on || P.tut2.got) return null;
  const done = TEBIKI.filter(t => t.ok()).length;
  if (tebikiAll()) {
    return el('div', { class: 'tebiki done' },
      el('b', {}, '手引き　相すみもうした'),
      el('button', { class: 'go wide', onclick: () => { tebikiTake(); SFX.get(); draw(); } },
        '褒美を頂戴いたす'));
  }
  return el('div', { class: 'tebiki' },
    el('b', {}, '手引き', el('em', {}, `${done} / ${TEBIKI.length}`)),
    el('div', { class: 'tblist' }, TEBIKI.map(t => {
      const ok = t.ok();
      return el('button', {
        class: 'tbrow' + (ok ? ' ok' : ''), disabled: ok ? true : null,
        onclick: () => { t.go(); SFX.pick(); draw(); },
      },
        el('i', {}, ok ? '済' : '→'),
        el('span', {}, t.text));
    })));
}

/* ================= 番付（2026-09-25）=================
   プレイヤー同士の腕くらべ。いまはサーバーが無いので、表の空きは NPC で埋める。
   段は五つ（五の丸〜本丸）、一枚の表に50組。月が変わると
   上位10組が昇格・下位10組が降格して、段ごとの褒美が出る。

   ・挑む … 対戦札を1枚使って戦う。勝ち負けでその場で点が動く
   ・挑まれる … 自分の部隊が留守番になる。日が変わったときにまとめて反映する
   数え方は rank.js にまとめてある。サーバーができたら rkRoom() を差し替えるだけでよい。 */

function rkState() {
  if (!P.rk || typeof P.rk !== 'object') {
    /* はじめて番付に載るときだけ、いまの総合力に見合う段から始める（2026-09-25）。
       みな五の丸から始めると、すでに育っている人が四か月ぶん格下しか殴れない */
    P.rk = { tier: rkTierOfPower(titlePower()), pt: 0, seed: (Math.random() * 1e9) | 0,
             month: rkMonth(), day: '', tick: RK_TICKET, done: {}, log: [], last: null, best: 0 };
  }
  const r = P.rk;
  if (!Array.isArray(r.log)) r.log = [];
  if (!r.done || typeof r.done !== 'object') r.done = {};
  return r;
}
/* 自分の総合力。称号と同じものさしを使う */
const rkMyPower = () => titlePower();
/* その総合力なら、どの段から始めるのが妥当か */
function rkTierOfPower(pow) {
  let t = 0;
  for (let i = 0; i < RK_POWER.length; i++) if (pow >= RK_POWER[i][0]) t = i;
  return t;
}

/* NPCの部隊。顔ぶれは種から決め、素の値をその組の総合力に合うよう伸び縮みさせる。
   敵はマスタの素の値のままで戦うので（grownFor は自分の側だけ）、
   ここで stats を作り替えないと、段が上がっても相手が強くならない */
const rkScale = (st, k) => {
  const o = {};
  for (const [a, b] of Object.entries(st || {})) o[a] = typeof b === 'number' ? Math.max(1, Math.round(b * k)) : b;
  return o;
};
/* 一覧に顔を出すための総大将だけを安く取り出す（部隊5体を組むのは重いので）*/
function rkGenOf(npc) {
  const rnd = rkRand(npc.pick);
  for (let i = 0; i < 40; i++) { const c = C[Math.floor(rnd() * C.length)]; if (c) return c; }
  return C[0];
}
function rkTeamOf(npc) {
  const rnd = rkRand(npc.pick);
  const t = [];
  let guard = 0;
  while (t.length < 5 && guard++ < 400) {
    const c = C[Math.floor(rnd() * C.length)];
    if (t.some(x => x.no === c.no)) continue;
    if (c.origin && t.some(x => x.origin === c.origin)) continue;   // 敵の中で同じ人物は重ねない
    t.push(c);
  }
  const base = t.reduce((a, c) => a + SP_STATS.reduce((b, k) => b + ((c.stats || {})[k] || 0), 0), 0) || 1;
  const k = (npc.power || base) / base;
  return t.map(c => ({ ...c, stats: rkScale(c.stats, k), hp: c.hp ? Math.round(c.hp * k) : c.hp }));
}

/* その組のいまの持ち点 */
const rkPtOf = npc => rkNpcPt(npc, rkDayOfMonth(), rkState().tier);

/* いまの番付表。自分とNPCを点の順に並べ、順位を振る */
function rkTable() {
  const r = rkState();
  const day = rkDayOfMonth();
  const rows = rkRoom(r.tier, r.seed).map(n => ({ ...n, pt: rkNpcPt(n, day, r.tier) }));
  rows.push({ id: 'me', me: true, name: P.name || '無名の将', title: P.title || '',
              power: rkMyPower(), pt: r.pt });
  rows.sort((a, b) => b.pt - a.pt || (a.me ? -1 : b.me ? 1 : 0));
  rows.forEach((x, i) => { x.rank = i + 1; });
  return rows;
}
const rkMyRank = () => (rkTable().find(x => x.me) || {}).rank || RK_SEATS;

/* 戦わせて勝敗だけ返す（留守番の戦に使う。盤面は見せない） */
function rkFight(npc, seed) {
  try {
    const q = P.squads[P.active] || {};
    const mem = squadChars(q).map(grownFor);
    if (!mem.length) return false;
    const B = rkTeamOf(npc);
    const res = runBattle(
      { members: mem, generalNo: q.general || mem[0].no, formation: q.form || FORMS[0],
        manual: false, modeSwitches: [{ turn: 0, manual: false }], slots: q.slots },
      { members: B, generalNo: B[0].no, formation: q.form || FORMS[0] },
      stageRules('地形なし'), seed >>> 0, { log: false });
    return res.winner === 'A';
  } catch { return false; }
}

/* 日が変わったときの留守番の戦。表から何組かが挑んでくる */
function rkRaidDay(r) {
  const room = rkRoom(r.tier, r.seed);
  const rnd = rkRand(rkSeed(r.seed + ':' + today()));
  const out = [];
  if (!(P.squads[P.active] || {}).nos.length) { r.log = []; return; }
  for (let i = 0; i < RK_RAID; i++) {
    const n = room[Math.floor(rnd() * room.length)];
    const won = rkFight(n, rkSeed(`${n.id}:${today()}:raid`));
    const d = rkPoint(r.pt, rkPtOf(n), won);
    r.pt = Math.max(0, r.pt + d);
    out.push({ name: n.name, power: n.power, won, d });
  }
  r.log = out;
}

/* 先月の締め。順位で昇格・降格を決め、褒美を積んでおく（受け取りは番付の札から） */
function rkClose(r) {
  const days = rkDaysInMonth(new Date(new Date().setDate(0)));   // 先月の日数
  const rows = rkRoom(r.tier, r.seed).map(n => ({ ...n, pt: rkNpcPt(n, days, r.tier) }));
  rows.push({ me: true, pt: r.pt });
  rows.sort((a, b) => b.pt - a.pt || (a.me ? -1 : b.me ? 1 : 0));
  const rank = rows.findIndex(x => x.me) + 1;
  const to = rkNextTier(r.tier, rank);
  r.last = { month: r.month, tier: r.tier, rank, to, move: rkMoveWord(r.tier, to),
             prize: rkPrizeOf(r.tier, rank) };
  r.tier = to;
  r.pt = 0;
  r.seed = (Math.random() * 1e9) | 0;      // 段が変わるので表も入れ替わる
  r.month = rkMonth();
  r.best = Math.max(r.best || 0, to);
}

/* 日と月の切り替わり。起動と番付を開くたびに呼ぶ */
function rkRoll() {
  const r = rkState();
  let moved = false;
  if (r.month !== rkMonth()) { rkClose(r); moved = true; }
  if (r.day !== today()) {
    r.day = today();
    r.tick = RK_TICKET;                      // 対戦札を配り直す
    r.done = {};
    rkRaidDay(r);
    moved = true;
  }
  if (moved) savePlayer();
  return moved;
}
/* 先月の褒美を受け取る */
function rkTakePrize() {
  const r = rkState();
  if (!r.last) return null;
  const g = r.last.prize || {};
  if (g.koban) P.koban += g.koban;
  if (g.stone) P.free += g.stone;
  if (g.gun) P.gun = (P.gun || 0) + g.gun;
  const out = r.last;
  r.last = null;
  savePlayer();
  return out;
}

/* 挑む。対戦札を1枚使うだけ（2026-09-25）。
   同じ相手に何度でも挑める。札の枚数がそのまま1日の手数になる */
function rkStart(npc) {
  const r = rkState();
  if (r.tick < 1) { S.rkMsg = '今日の対戦札はもう無いわん'; draw(); return; }
  if (!(P.squads[P.active] || {}).nos.length) { S.rkMsg = 'まず部隊を組むわん'; draw(); return; }
  // 出す部隊をえらんでから始める（2026-09-29）
  sqAsk('番付に出す部隊', `${npc.name} に挑む`, () => {
    r.tick -= 1;
    savePlayer();
    S.rk = false; S.rkSel = null; S.rkMsg = '';
    /* 格を測る物差しは持ち点（2026-09-25）。挑んだ時点の点で決める */
    startBattle(null, null, null, { npc, minePt: r.pt, foePt: rkPtOf(npc) });
  });
}
/* 挑んだ戦の決着。点を動かして、その場で見せる言葉を返す */
function rkFinish(bout, won) {
  const r = rkState();
  const d = rkPoint(bout.minePt, bout.foePt, won);
  r.pt = Math.max(0, r.pt + d);
  savePlayer();
  return d;
}

/* ---- 番付の札 ---- */
function rkSheet() {
  rkRoll();
  const r = rkState();
  const rows = rkTable();
  const me = rows.find(x => x.me) || {};
  const close = () => { S.rk = false; S.rkSel = null; S.rkMsg = ''; draw(); };
  if (r.last) return rkLastSheet(r.last);
  if (S.rkPz) return rkPrizeSheet();
  if (S.rkSel) return rkFoeSheet(rows.find(x => x.id === S.rkSel) || null);
  return el('div', { class: 'sheet', onclick: e => { if (e.target.classList.contains('sheet')) close(); } },
    el('div', { class: 'card2 rkbox' },
      el('div', { class: 'rkttl' },
        el('b', { class: 'mittl' }, '番付'),
        /* 段ごとの褒美を見る小さな釦（2026-09-25）。右上に置く */
        /* 小判の絵だと「ここで小判がもらえる」に見えるので、しるしに変えた（2026-09-25） */
        el('button', { class: 'rkpz', title: '月末の褒美を見る',
          onclick: () => { S.rkPz = true; SFX.pick(); draw(); } }, el('i', {}, 'i'))),
      el('div', { class: 'rkhead' },
        el('div', { class: 'rkt' }, el('b', {}, RK_TIERS[r.tier]), el('i', {}, `${me.rank} 位 / ${RK_SEATS}`)),
        el('div', { class: 'rkp' }, el('b', {}, num(r.pt)), el('i', {}, 'pt')),
        el('div', { class: 'rkk' }, el('b', {}, `${r.tick} / ${RK_TICKET}`), el('i', {}, '対戦札'))),
      el('p', { class: 'ttsub' }, `月が変われば 上位${RK_UP}組が昇格、下位${RK_DOWN}組が降格するわん`),
      r.log.length ? el('div', { class: 'rkraid' },
        el('b', {}, '留守のあいだの戦'),
        r.log.map(x => el('span', { class: x.won ? 'w' : 'l' },
          `${x.name} に ${x.won ? '勝' : '負'}　${x.d > 0 ? '+' : ''}${x.d}`))) : null,
      /* 自分の段は、下にくっつけて常に見えるようにする（2026-09-25）。
         上から8番までに入っているときは、そのまま正しい順位のところに置く
         （すぐ見える高さなので、下に貼ると かえって順位が読めなくなる） */
      el('div', { class: 'rklist' }, rows.map(x => el('button', {
        class: 'rkrow' + (x.me ? (rkMyRank() > RK_PIN ? ' me pin' : ' me') : ''),
        onclick: x.me ? null : () => { S.rkSel = x.id; S.rkMsg = ''; SFX.pick(); draw(); },
      },
        el('span', { class: 'rkn' }, x.rank),
        /* 顔はヘッダーの自分の顔と同じ作り。NPCは総大将の顔を出す（2026-09-25）*/
        frFace(x.me ? faceChar() : rkGenOf(x), 'rkf', x.me ? P.title : x.title),
        el('span', { class: 'rknm' },
          el('b', {}, x.name),
          el('i', {}, x.me ? (x.title || NONAME) : rkSide(r.pt, x.pt),
            el('em', {}, `総合力 ${num(x.power)}`))),
        el('span', { class: 'rkpt' }, el('b', {}, num(x.pt)), el('i', {}, 'pt'))))),
      S.rkMsg ? el('p', { class: 'mimsg' }, S.rkMsg) : null,
      closeX(close)));
}
/* 相手の札。部隊を見てから出陣する */
function rkFoeSheet(foe) {
  const back = () => { S.rkSel = null; S.rkMsg = ''; SFX.pick(); draw(); };
  if (!foe) { S.rkSel = null; return null; }
  const r = rkState();
  const team = rkTeamOf(foe);
  const ok = r.tick > 0;
  return el('div', { class: 'sheet', onclick: e => { if (e.target.classList.contains('sheet')) back(); } },
    el('div', { class: 'card2 frbox home' },
      el('div', { class: 'frhead' },
        frFace(team[0]),
        el('span', { class: 'frn' }, el('b', {}, foe.name),
          el('i', {}, `${foe.rank} 位　${rkSide(r.pt, foe.pt)}　総合力 ${num(foe.power)}`)),
        el('em', { class: 'frrec' }, `${num(foe.pt)} pt`)),
      el('div', { class: 'frteam' }, team.map((c, i) =>
        el('button', { class: 'frc' + (i === 0 ? ' gen' : ''), title: c.name, onclick: () => openCard(c, true) },
          cardArt(c) ? keepImg({ class: 'cf', src: cardArt(c), alt: c.name, loading: 'lazy' })
                     : el('i', { style: chipStyle(c) }, el('b', {}, (c.name || '')[0] || '')),
          i === 0 ? genMark() : null))),
      el('p', { class: 'ttsub' }, (() => {
        const w = rkPoint(r.pt, foe.pt, true), l = rkPoint(r.pt, foe.pt, false);
        return `勝てば ${w > 0 ? '+' : ''}${w}　負ければ ${l}`;
      })()),
      S.rkMsg ? el('p', { class: 'frmsg' }, S.rkMsg) : null,
      /* 釦は一つだけなので、二列の枠から外して真ん中に置く（2026-09-25）。
         友の札と同じ .frbtns を使っていたせいで、左の列に寄っていた */
      el('div', { class: 'frbtns solo' },
        el('button', { class: 'go' + (ok ? '' : ' soon'), disabled: ok ? null : true,
          onclick: () => rkStart(foe) },
          r.tick < 1 ? '対戦札が無いわん' : '出陣')),
      closeX(back, 'もどる')));
}
/* 褒美の一覧（2026-09-25）。番付の右上の小さな釦から開く。
   表に載っていれば誰でももらえる。段を選ぶと、その段の順位ごとの数が並ぶ */
function rkPrizeSheet() {
  const r = rkState();
  const tier = S.rkPzT == null ? r.tier : S.rkPzT;
  const close = () => { S.rkPz = false; S.rkPzT = null; SFX.pick(); draw(); };
  return el('div', { class: 'sheet', onclick: e => { if (e.target.classList.contains('sheet')) close(); } },
    el('div', { class: 'card2 rkbox' },
      el('b', { class: 'mittl' }, '月末の褒美'),
      el('div', { class: 'row chapters' }, RK_TIERS.map((t, i) => el('button', {
        class: 'chip' + (tier === i ? ' on' : ''),
        onclick: () => { S.rkPzT = i; SFX.pick(); draw(); },
      }, t))),
      el('p', { class: 'ttsub' }, '番付に載っておれば、みな頂けるわん'),
      el('div', { class: 'rklist' }, RK_BANDS.map(b => {
        const g = rkPrizeOf(tier, b.to);
        /* 名は rkgift（2026-09-30）。もとは 'pz' だったが、
           褒美の玉を縦に積む .pz（width:26px・縦並び）と名がぶつかって、
           行がひとつの細い柱に潰れていた */
        return el('div', { class: 'rkrow rkgift' },
          el('span', { class: 'rkn wide' }, b.label),
          el('span', { class: 'rw evrw pzrw' },
            el('span', {}, curIcon('koban'), num(g.koban)),
            el('span', {}, curIcon('stone'), num(g.stone)),
            el('span', {}, curIcon('gun'), num(g.gun))));
      })),
      el('p', { class: 'note' }, '軍功は番付でしか手に入らぬ。育成の蔵で品と引き換えられるわん'),
      closeX(close)));
}

/* 先月の結果。褒美を受け取るまで番付は開かない */
function rkLastSheet(last) {
  const take = () => { rkTakePrize(); SFX.get(); draw(); };
  const g = last.prize || {};
  return el('div', { class: 'sheet' },
    el('div', { class: 'card2 resbox ' + (last.to > last.tier ? 'win' : '') },
      el('div', { class: 'wray' }),
      el('b', { class: 'rttl' }, `${RK_TIERS[last.tier]}　${last.rank} 位`),
      el('p', { class: 'rsub' }, last.move === '昇格' ? `${RK_TIERS[last.to]} へ昇格したわん`
        : last.move === '降格' ? `${RK_TIERS[last.to]} へ落ちたわん` : 'その段に留まったわん'),
      el('div', { class: 'rw evrw' },
        g.koban ? el('span', {}, curIcon('koban'), `+${num(g.koban)}`) : null,
        g.stone ? el('span', {}, curIcon('stone'), `+${num(g.stone)}`) : null,
        g.gun ? el('span', {}, curIcon('gun'), `+${num(g.gun)}`) : null),
      el('button', { class: 'go wide', onclick: take }, '褒美を頂戴いたす')));
}

/* ---- 名乗り（2026-09-24）----
   はじめに一度だけ、自分の名を決める。P.name が空のあいだは、どの画面の上にも出て閉じられない。
   チュートリアルの段（P.tutorial）とは切り離してあるので、
   すでに遊んでいた人にも一度だけ出て、そのあとは二度と出ない。 */
const NAME_MAX = 8;
function nameSheet() {
  const save = () => {
    const i = document.querySelector('.nminp');
    const v = (i ? i.value : '').trim().slice(0, NAME_MAX);
    if (!v) { S.nmMsg = '名がないと出陣できぬわん'; draw(); return; }
    P.name = v; savePlayer(); S.nmMsg = ''; SFX.win(); draw();
  };
  return el('div', { class: 'sheet nmsh' },
    el('div', { class: 'card2 nmbox' },
      el('b', { class: 'nmttl' }, '名を名乗るわん'),
      el('p', { class: 'nmsub' }, 'この名で天下に知られるわん'),
      el('input', {
        class: 'nminp', type: 'text', maxlength: String(NAME_MAX),
        placeholder: '八文字まで入るわん', autocomplete: 'off', spellcheck: 'false',
        onkeydown: e => { if (e.key === 'Enter') { e.preventDefault(); save(); } },
      }),
      S.nmMsg ? el('p', { class: 'nmmsg' }, S.nmMsg) : null,
      el('button', { class: 'go wide', onclick: save }, 'この名で参る')));
}

/* ================= 友（2026-09-24）=================
   下した国の主が、そのまま友になる。
   「倒した相手と誼を結ぶ」は戦国のならい。作りものの友を並べるより筋が通るし、
   全国を進めるほど友が増えるので、天下取りの手が止まらない。
   友の部隊は campEnemy がその国の seed から作り直すので、保存しなくても
   いつ開いても同じ顔ぶれが出る。あとで本物の友を繋ぐときも、この棚に並べればよい。 */

/* 友の顔ぶれ。制覇した国のうち、自分の本拠地だけは除く（それは自分なので） */
const frList = () => PREFS.filter(p => prefTaken(p.id) && p.id !== (P.camp.start || 'aichi'));
/* その友の中身。部隊はその国の最後の戦（国主戦）の顔ぶれ */
function frOf(id) {
  const p = PREF[id];
  if (!p) return null;
  const team = campFoes(p, Math.max(0, p.battles - 1));
  return { pref: p, house: p.house, name: lordName(p), team, general: team[0] || null, rank: frRank(team) };
}
/* 友の顔（2026-09-24）。ヘッダーの自分の顔とまったく同じ作りにする。
   家紋だと「家」に見えて人に見えないので、総大将の顔を出すことにした。
   本物の友を繋いだときも、相手のヘッダーの顔がそのままここに並ぶ。 */
function frFace(gen, cls, title) {
  /* 額は称号のもの（2026-09-25）。相手の称号が分かるときはそれを使う。
     肩書きがまだ無い人には額を付けない（2026-09-26） */
  const frame = title ? (frameUrl(title) || uiUrl('player_frame')) : null;
  /* 顔の絵はコマ絵 → 無ければカードの絵を寄せて顔だけ切り出す → それも無ければ属性の色。
     コマ絵は47体ぶんしか無いので、カードで拾えるぶんは拾う（2026-09-24） */
  const style = faceStyle(gen);
  return el('span', { class: 'ic frface' + (frame ? ' framed' : '') + (cls ? ' ' + cls : ''), style },
    gen ? null : el('i', {}, '将'),
    frame ? el('img', { class: 'pf', src: frame, alt: '' }) : null);
}
/* 総大将の印（2026-09-29）。盤面のコマと同じ絵を使う。
   これまで友の一覧と番付だけ「大」の字で、盤面と見た目が食い違っていた。
   絵が無ければ、これまでどおり「大」の字に落ちる */
function genMark() {
  const art = uiUrl('general_mark_red') || uiUrl('general_mark');
  return art ? keepImg({ class: 'frgen art', src: art, alt: '総大将' })
             : el('em', { class: 'frgen' }, '大');
}
/* 保存してある勝敗など。無ければその場で作る */
function frState(id) {
  if (!P.fr[id]) P.fr[id] = { win: 0, lose: 0, spar: '', gift: '', back: null };
  return P.fr[id];
}
/* 称号（2026-09-24）。自分も友も、同じものさし＝部隊の総合力で測る。
   総合力は5つの数（火力・賢さ・防御・回復・速さ）の合計。
   数は画面に出さない。格だけ見せて、実際どれほどかは稽古で確かめてもらう。

   自分は一度その総合力に届けば称号を手に入れ、部隊を組み替えても消えない。
   天下統一だけは総合力ではなく、四十七の国すべてを制したときに手に入る（mission.js）。 */
const TITLE_POWER = [
  { p: 0,     name: '野伏せり' },
  { p: 8000,  name: '足軽頭' },
  { p: 14000, name: '侍大将' },
  { p: 22000, name: '鬼神' },
  { p: 30000, name: '軍神' },
  { p: 38000, name: '覇者' },
];
const rankOfPower = pow => {
  let r = TITLE_POWER[0];
  for (const x of TITLE_POWER) if (pow >= x.p) r = x;
  return r.name;
};
/* 友の称号。相手の部隊の総合力から */
const frRank = team => rankOfPower((team || []).reduce((a, c) => a + powerOf(c), 0));
const frTotal = () => Object.values(P.fr || {}).reduce((a, f) => ({ win: a.win + (f.win||0), lose: a.lose + (f.lose||0) }), { win: 0, lose: 0 });
/* 返礼が届いている友の数（ホームの札の赤丸） */
const frBack = () => frList().filter(p => frBackReady(P.fr[p.id])).length;

/* 陣中見舞い（2026-09-24）。1日1回、兵糧を置いていける。
   置いた側は何も減らない。次に来たときに返礼が届いている、という往復にした。
   取られるのではなく増えるほうが、friend というより「誼」らしい。 */
/* 返礼は小判500だけ（2026-09-24）。中身が毎回変わると「何が出るか」の遊びになってしまい、
   誼を結ぶ話ではなくなる。決まったものが決まって返る、のほうが見舞いらしい */
const GIFT_BACK = { koban: 500 };
function frGift(id) {
  const f = frState(id);
  if (f.gift === today()) return false;
  f.gift = today();
  /* 返礼はその場では渡さない。日を置いて届く（2026-09-24）。
     置いた当日に返ってくると「見舞い」ではなく両替になってしまうので、
     day を刻んでおいて、日付が変わってから受け取れるようにする */
  f.back = { day: today(), gift: GIFT_BACK };
  savePlayer();
  return true;
}
/* 届いている返礼を受け取る。訪ねた瞬間に配る（お知らせと同じ考え方） */
const frBackReady = f => !!(f && f.back && f.back.gift && f.back.day !== today());
function frTakeBack(id) {
  const f = frState(id);
  if (!frBackReady(f)) return null;
  const g = f.back.gift;
  if (g.koban) P.koban += g.koban;
  if (g.stamina) P.stamina = Math.min(P.staminaMax, P.stamina + g.stamina);
  f.back = null;
  savePlayer();
  return g;
}

/* 稽古（2026-09-24）。同じ友とは1日1回。兵糧は要らない。
   seed に日付を混ぜてあるので、毎日ちがう空と地形になる。 */
const canSpar = id => frState(id).spar !== today();
function sparStart(id) {
  const fr = frOf(id);
  if (!fr || !canSpar(id)) return;
  // どう手合わせするかを先にえらぶ（2026-09-30）
  S.spAsk = id; SFX.pick(); draw();
}
/* 稽古のしかたをえらぶ札（2026-09-30）。
   一騎打ち＝総大将どうしの一対一。腕まかせのオートで決まる。
   総力戦＝いままでどおり、えらんだ部隊まるごと。
   どちらも「何が違うか」は字で並べず、語り手の吹き出しで言わせる */
function sparAskSheet() {
  const id = S.spAsk; if (id == null) return null;
  const fr = frOf(id); if (!fr) { S.spAsk = null; return null; }
  const close = () => { S.spAsk = null; SFX.pick(); draw(); };
  const go = duel => {
    S.spAsk = null;
    sqAsk(duel ? '一騎打ちに出す部隊' : '稽古に出す部隊',
      duel ? `${fr.name} との一騎打ち。出るのは総大将ひとりだけ` : `${fr.name} との総力戦`,
      () => {
        S.fr = false; S.frId = null; S.frMsg = '';
        startBattle(null, null, { id, pref: fr.pref, duel: !!duel });
      }, !!duel);
  };
  /* 絵と話は「読むもの」、えらぶのは下の二つの釦（2026-09-30）。
     前は話そのものが釦だったので、どこを押せばよいのか分かりにくかった */
  const row = (key, head, body) => {
    const no = talkerNo(key);
    const c = charOf(no);
    const art = faceUrl(no, '不敵') || faceUrl(no, '通常') || pawnUrl(no);
    return el('div', { class: 'gtalk slim sparpick' + (art ? ' art' : '') },
      art ? keepImg({ class: 'gtface', src: art, alt: c ? c.name : '' })
          : el('i', { class: 'gtface' }, '犬'),
      el('div', { class: 'gtbub' },
        el('b', {}, c ? c.name : 'わんこ'),
        el('p', {}, el('em', {}, head), body)));
  };
  return el('div', { class: 'sheet', onclick: e => { if (e.target === e.currentTarget) close(); } },
    el('div', { class: 'card2 sqbox' },
      el('b', { class: 'sqttl' }, `${fr.name} との稽古`),
      /* 語りは一匹にまとめた（2026-09-30）。二匹ぶん並べると札が長くなるうえ、
         どちらの犬を選ぶ話なのかと紛らわしかった */
      row('spar_duel', 'どちらで参るワン？',
        '一騎打ちは総大将どうしが たった一騎で打ち合うワン。口は出せぬ、腕まかせだワン。'
        + '総力戦は部隊まるごとでぶつかるワン。陣立ても持ち込んだ道具も、そのまま効くワン'),
      el('div', { class: 'sparbtns' },
        el('button', { class: 'go', onclick: () => go(true) }, '一騎打ち'),
        el('button', { class: 'go', onclick: () => go(false) }, '総力戦')),
      closeX(close, 'やめる')));
}

function frSheet() {
  const close = () => { S.fr = false; S.frMsg = ''; draw(); };
  const list = frList();
  const t = frTotal();
  return el('div', { class: 'sheet', onclick: e => { if (e.target.classList.contains('sheet')) close(); } },
    el('div', { class: 'card2 frbox' },
      /* 札の題は帯にする（2026-09-25）。ホームの釦は「友」のままだが、
         札を開いたら「友人」と言い切ったほうが読みやすい */
      el('b', { class: 'mittl frttl' }, '友人'),
      el('p', { class: 'frnote' }, list.length
        ? `通算 ${t.win} 勝 ${t.lose} 敗`
        : 'まだ友はおらぬわん。国を下せば、その主が友になるわん'),
      list.length ? el('div', { class: 'frlist' }, list.map(p => {
        const f = frState(p.id);
        const fr = frOf(p.id);
        return el('button', { class: 'frrow', onclick: () => { S.frId = p.id; S.frMsg = ''; SFX.pick(); draw(); } },
          frFace(fr && fr.general),
          el('span', { class: 'frn' },
            el('b', {}, lordName(p)),
            el('i', {}, fr ? fr.rank : '')),
          el('span', { class: 'frr' },
            el('em', {}, `${f.win}勝 ${f.lose}敗`),
            frBackReady(f) ? el('span', { class: 'frdot' }) : el('span', { class: 'frok' }, '訪問')));
      })) : null,
      closeX(close)));
}

/* 友の家。訪ねた瞬間に返礼を受け取る */
function frHomeSheet() {
  const id = S.frId, fr = frOf(id);
  if (!fr) { S.frId = null; return null; }
  const f = frState(id);
  const got = frTakeBack(id);
  const back = () => { S.frId = null; S.frMsg = ''; SFX.pick(); draw(); };
  const gen = fr.general;
  return el('div', { class: 'sheet', onclick: e => { if (e.target.classList.contains('sheet')) back(); } },
    el('div', { class: 'card2 frbox home' },
      el('div', { class: 'frhead' },
        frFace(gen, 'big'),
        el('span', { class: 'frn' }, el('b', {}, fr.name), el('i', {}, fr.rank)),
        el('em', { class: 'frrec' }, `${f.win}勝 ${f.lose}敗`)),
      /* 部隊の5枚だけを並べる（2026-09-24）。
         はじめは総大将を上に大きく立たせていたが、1枚目とまったく同じ絵が
         二度出るだけだったのでやめた。総大将は札の隅の「大」で分かる。
         カードの絵が無い武将は属性の色に名の一字（壊れた画像を出さない） */
      el('div', { class: 'frteam' }, fr.team.map((c, i) =>
        el('button', { class: 'frc' + (i === 0 ? ' gen' : ''), title: c.name, onclick: () => openCard(c, true) },
          cardArt(c) ? keepImg({ class: 'cf', src: cardArt(c), alt: c.name, loading: 'lazy' })
                     : el('i', { style: chipStyle(c) }, el('b', {}, (c.name || '')[0] || '')),
          i === 0 ? genMark() : null))),
      got ? el('p', { class: 'frmsg good' }, `返礼が届いておるわん　${giftWords(got)}`) : null,
      S.frMsg ? el('p', { class: 'frmsg' }, S.frMsg) : null,
      el('div', { class: 'frbtns' },
        el('button', { class: 'go' + (canSpar(id) ? '' : ' soon'), disabled: canSpar(id) ? null : true,
          /* 済んだときは「済」の一字（2026-09-25）。長い文だと二行に折れて釦の形が崩れる */
          onclick: () => sparStart(id) }, canSpar(id) ? '稽古を申し込む' : '済'),
        el('button', { class: 'ghost' + (f.gift === today() ? ' soon' : ''), disabled: f.gift === today() ? true : null,
          onclick: () => { if (frGift(id)) { S.frMsg = '見舞いを置いてきたわん。返礼は後日であろう'; SFX.pick(); draw(); } } },
          f.gift === today() ? '済' : '陣中見舞')),
      closeX(back, 'もどる')));
}

/* ---- 全国をはじめて開いたときの物語（2026-09-24 に作り直した）----
   ここは前から screenMap が呼んでいたのに、中身がどこにも無かった。
   P.camp.intro は既定が false なので、新しく始めた人は全国を開いた瞬間に
   「sagaSheet is not defined」で画面が落ちていた（他の画面は無事なので気づきにくい）。
   campaign.js の INTRO を出し、閉じたら intro を立てて二度と出さない。 */
function sagaSheet() {
  const close = () => { P.camp.intro = true; savePlayer(); SFX.pick(); draw(); };
  /* 語り手の顔を添えて、字は黒漆で読ませる（2026-09-30）。
     札が生成りの色になったのに字が金のままで、まったく読めなかった */
  const no = talkerNo('saga');
  const art = faceUrl(no, '凛々しい') || faceUrl(no, '通常') || faceUrl(no, '笑顔') || pawnUrl(no);
  return el('div', { class: 'sheet sagash', onclick: e => { if (e.target.classList.contains('sheet')) close(); } },
    el('div', { class: 'card2 sagabox' },
      el('div', { class: 'sagatop' },
        art ? keepImg({ class: 'sagaf', src: art, alt: '' }) : el('i', { class: 'sagaf' }, '犬'),
        el('b', {}, '天下の分け目')),
      el('div', { class: 'sagain' }, INTRO.map(t => el('p', {}, t))),
      el('button', { class: 'go wide', onclick: close }, 'いざ、天下へ')));
}

function screenMap() {
  const q = P.squads[P.active];
  const ready = q.nos.length >= 1 && squadCost(q) <= costMax() && !dupOrigins(q.nos).length;
  const open = openRegions();
  const home = PREF[P.camp.start || 'aichi'].region;
  if (!S.region || !open.includes(S.region)) S.region = open.includes(home) ? home : open[0];
  const reg = REGIONS.find(r => r.id === S.region);
  const maps = [1, 2, 3].map(v => bgUrl('map_' + v));
  const hasMap = maps.every(Boolean);
  // 絵巻地図があるときは、地図を画面いっぱいに敷いて、情報はその上に重ねる
  if (hasMap) {
    return {
      body: el('div', { class: 'mapbody' },
        japanMap(maps, open, reg),
        !P.camp.intro ? sagaSheet() : null),
      nav: true,
    };
  }
  return {
    body: el('div', {},
      el('div', { class: 'unibar' }, el('b', {}, `制覇 ${takenCount()} / ${PREFS.length}`)),
      el('div', { class: 'row chapters' }, REGION_ORDER.map(id => {
        const ok = open.includes(id), done = regionTaken(id);
        const r = REGIONS.find(x => x.id === id);
        return el('button', {
          class: 'chip' + (S.region === id ? ' on' : '') + (ok ? '' : ' locked') + (done ? ' done' : ''),
          disabled: ok ? null : true,
          onclick: () => { S.region = id; S.pref = null; SFX.pick(); draw(); },
        }, ok ? r.name : '？');
      })),
      el('h2', {}, reg.label),
      el('div', { class: 'prefs' }, prefsOf(S.region).map(p => {
        const b = prefCard(p);
        b.onclick = () => { S.pref = p.id; S.screen = 'march'; SFX.pick(); draw(); };
        return b;
      })),
      !P.camp.intro ? sagaSheet() : null),
    nav: true,
  };
}

/* 出陣のページ（2026-09-21）。国を選んだあと、ここで部隊を決めて出す。 */
function screenMarch() {
  const p = PREF[S.pref] || PREF[P.camp.start || 'aichi'];
  const q = P.squads[P.active];
  const ready = q.nos.length >= 1 && squadCost(q) <= costMax() && !dupOrigins(q.nos).length;
  const step = Math.min(prefStep(p.id), p.battles - 1);
  const taken = prefTaken(p.id);
  const last = step >= p.battles - 1;
  const talk = last && LORD_TALK[p.id] ? LORD_TALK[p.id].before : null;
  /* 敵の陣立てを先に見て、同じ人物が両軍に出ないようにする（2026-09-23） */
  const foes = campFoes(p, step);
  const clash = foeClash(q.nos, foes);
  S.foe = { pref: p.id, step, origins: [...foeOriginSet(foes)] };   // 編成画面でも灰色にする
  /* 兵糧は章が進むほど重い（2026-09-26）。国と段どりで変わる */
  const food = marchFood(p, step);
  const can = ready && canMarch(p, step) && !clash.length;
  return {
    body: el('div', {},
      el('button', { class: 'ghost back', onclick: () => { S.screen = 'map'; SFX.pick(); draw(); } }, '← 全国へ'),
      /* 敵の城の見出しも、ほかの画面と同じ「顔＋吹き出し」にした（2026-09-29）。
         向かう先の主の顔が見えるほうが、誰と戦うのかが伝わる。
         盤面の名は startBattle と同じ種から出しているので、出たあとの景色と食い違わない */
      (() => {
        const lno = p.lord;
        const lart = lno ? (faceUrl(lno, '不敵') || faceUrl(lno, '通常') || pawnUrl(lno)) : null;
        const where = (p.battles > 1 ? `${STEP_NAME[Math.min(step, 2)]}（${step} / ${p.battles} 戦）　／　` : '')
          + stageLabel(stageOf(p, step), (campSeed(p.id, step) >>> 0) % stageVarCount(stageOf(p, step))) + 'の戦場';
        return el('div', { class: 'gtalk slim marchtalk' },
          lart ? keepImg({ class: 'gtface', src: lart, alt: lordName(p) })
               : kamon(p.house, 'big'),
          el('div', { class: 'gtbub' },
            el('b', {}, `${p.house}　${lordName(p)}`),
            el('p', {},
              el('em', {}, p.name + (taken ? '　制覇' : '')),
              talk ? `「${talk}」` : where),
            talk ? el('span', { class: 'mtwhere' }, where) : null));
      })(),
      /* 出す部隊は、お祭り・稽古・番付の札と同じクリームの箱にそろえた（2026-09-29）。
         同じことをする場は、どこでも同じ姿にする */
      el('div', { class: 'card2 sqbox marchsq' },
        el('b', { class: 'sqttl' }, '出す部隊'),
        el('div', { class: 'sqlist' }, P.squads.map((sq2, i) => squadCard(sq2, i)))),
      /* 敵の顔ぶれ（2026-09-29 に絵にした）。
         名を並べるだけでは誰が出るのか分からなかったので、コマ絵の下に名を添える。
         五騎が横一列に収まる大きさにしてある */
      el('div', { class: 'card2 sqbox marchfoe' },
        el('b', { class: 'sqttl' }, '敵の陣立て'),
        el('div', { class: 'foeicons' }, foes.map((c, i) => {
          const art = pawnUrl(c.no) || faceUrl(c.no, '通常') || cardArt(c);
          return el('span', {
            class: 'foec' + (i === 0 && last && p.lord === c.no ? ' lord' : ''),
            title: `${c.name}（${c.origin}）`,
          },
            el('span', { class: 'foei' },
              art ? keepImg({ src: art, alt: c.name }) : el('i', { style: chipStyle(c) }),
              rarTag(c.rarity, 'foer')),
            el('b', {}, c.name));
        }))),
      clash.length
        ? el('div', { class: 'shopmsg warn' },
            '敵に同じ武将が出ておる：' + clash.map(c => `${c.name}（${c.origin}）`).join('　')
            + '　同じ人物は両軍に立てぬ。編成で外してから出陣せよ')
        : null,
      dupOrigins(q.nos).length
        ? el('p', { class: 'note warn' },
            '同じ武将が重なっておる：' + dupOrigins(q.nos).map(d =>
              `${d.origin}（${d.nos.map(n => (charOf(n) || {}).name).join('・')}）`).join('　')
            + '　編成で片方を外してから出陣せよ')
        : !ready ? el('p', { class: 'note' }, '部隊を編成してから出陣できる')
             : (!canMarch(p, step) ? el('p', { class: 'note' }, `兵糧が足りぬ（要 ${food}）。道具でもどせる`) : null),
      clash.length ? el('button', {
        class: 'go wide', onclick: () => { S.screen = 'team'; SFX.pick(); draw(); },
      }, '編成を直す') : null,
      /* 出陣の釦（2026-09-26 に一枚絵にした）。
         絵に「出陣」と彫ってあるので字は重ねず、兵糧のことだけ下に小さく添える。
         絵が無ければ、これまでどおりの字の釦に落ちる */
      (() => {
        const art = uiUrl('btn_出陣');
        const go = () => {
          const march = () => { if (!spendFood(p, step)) return; startBattle({ pref: p, step }); };
          // 兵糧が足りなければ、その場で道具を使って続けられる（2026-09-21）
          if (!canMarch(p, step)) { S.foodAfter = march; S.foodNeed = food; S.food = true; SFX.pick(); draw(); return; }
          march();
        };
        const word = canMarch(p, step) ? (taken ? 'もう一度戦う' : '出陣') + `　兵糧 ${food}`
                                : `兵糧をもどして出陣（要 ${food}）`;
        /* 道具の釦は、出陣の釦の右に丸く置く（2026-09-29）。
           前は出陣の上に横いっぱいの帯で置いていたが、
           出陣より先に目に入ってしまい、押す順番が分かりにくかった */
        const prepN = prepList().length;
        /* 道具の釦は一枚絵にした（2026-09-29）。絵が無ければ「具」の字に落ちる */
        const part = uiUrl('btn_道具');
        const pbtn = el('button', {
          class: 'prepcir' + (prepN ? ' on' : '') + (part ? ' art' : ''), title: '道具を使う',
          onclick: () => { S.prepBox = true; SFX.pick(); draw(); },
        }, part ? keepImg({ src: part, alt: '道具' }) : el('i', {}, '具'),
           el('em', {}, `${prepN}/${PREP_MAX}`));
        if (!art) {
          return el('div', { class: 'marchgo' },
            el('div', { class: 'mgrow' },
              el('button', { class: 'go big out', disabled: can ? null : true, onclick: go }, word), pbtn),
            prepTags());
        }
        return el('div', { class: 'marchgo' },
          el('div', { class: 'mgrow' },
            el('button', {
              class: 'go big out pic', disabled: can ? null : true, title: word, onclick: go,
            }, keepImg({ src: art, alt: '出陣' })),
            pbtn),
          el('p', { class: 'marchsub' },
            canMarch(p, step) ? (taken ? `もう一度戦う　兵糧 ${food}` : `兵糧 ${food}`)
                       : `兵糧をもどして出陣（要 ${food}）`),
          prepTags());
      })(),
      S.prepBox ? prepSheet() : null),
    nav: true,
  };
}

/* ---- 戦仕度（2026-09-21） ----
   合戦に持ち込む道具は、出陣する前にここで決める。戦のさなかには開けない。
   秘薬は自軍だけ、天候の品は両軍にかかる。持ち込みは3つまで、天候はひとつまで。 */
const PREP_MAX = 3;
const prepList = () => (S.prep || (S.prep = []));
/* 持ち込んだ道具の札だけを並べる（2026-09-29）。
   「道具を使う」の釦は出陣の隣に移したので、ここは選んだものの控えだけ */
function prepTags() {
  const list = prepList();
  if (!list.length) return null;
  return el('div', { class: 'ptags' }, list.map((n, i) => el('button', {
    class: 'ptag', onclick: () => { list.splice(i, 1); SFX.pick(); draw(); },
  }, itemIcon(n), el('span', {}, n), el('i', {}, '×'))));
}
function prepBox(pref, step) {
  const list = prepList();
  /* 出陣の前に天候は見せない（2026-09-25）。
     空は出てみて分かるほうがよい。先に「平常」と書いてあると、
     読んで確かめるだけの作業になってしまう。
     道具の釦は、押すものだと分かる大きさにした（前は小さな丸札で気づかれなかった） */
  return el('div', { class: 'prep' },
    el('div', { class: 'prow' },
      el('button', { class: 'go prepgo', onclick: () => { S.prepBox = true; SFX.pick(); draw(); } },
        el('i', {}, '具'),
        el('span', {}, '道具を使う'),
        el('em', {}, `${list.length} / ${PREP_MAX}`))),
    list.length
      ? el('div', { class: 'ptags' }, list.map((n, i) => el('button', {
          class: 'ptag', onclick: () => { list.splice(i, 1); SFX.pick(); draw(); },
        }, itemIcon(n), el('span', {}, n), el('i', {}, '×'))))
      : el('p', { class: 'note' }, '道具を持ち込むと、開戦からずっと効く'));
}
const prepWeather = () => {
  const w = prepList().map(n => ITEMS[n].weather).filter(Boolean);
  return w.length ? w[w.length - 1] : null;
};
function prepSheet() {
  const list = prepList();
  const names = Object.keys(ITEMS).filter(k => ITEMS[k].inBattle);
  const owned = names.filter(n => item(n) - list.filter(x => x === n).length > 0);
  const add = name => () => {
    if (list.length >= PREP_MAX) { S.prepMsg = `持ち込めるのは ${PREP_MAX} つまで`; SFX.pick(); draw(); return; }
    if (ITEMS[name].weather && prepWeather()) { S.prepMsg = '天候の品はひとつまで'; SFX.pick(); draw(); return; }
    list.push(name); S.prepMsg = ''; SFX.pick(); draw();
  };
  /* 道具が増えると「閉じる」が下ナビに隠れていた（2026-09-29）。
     箱を縦に区切り、品の並びだけを流すようにして、閉じるは必ず下に残す */
  return el('div', { class: 'sheet', onclick: e => { if (e.target.classList.contains('sheet')) { S.prepBox = false; S.prepMsg = ''; draw(); } } },
    el('div', { class: 'card2 prepbox' },
      el('h3', {}, `戦仕度　（${list.length} / ${PREP_MAX}）`),
      el('p', { class: 'note' }, '開戦からずっと効く。負けても使ったぶんは戻らない'),
      S.prepMsg ? el('div', { class: 'shopmsg' }, S.prepMsg) : null,
      list.length ? el('div', { class: 'ptags' }, list.map((n, i) => el('button', {
        class: 'ptag on', onclick: () => { list.splice(i, 1); S.prepMsg = ''; SFX.pick(); draw(); },
      }, itemIcon(n), el('span', {}, n), el('i', {}, '×')))) : null,
      el('div', { class: 'shoplist' }, owned.map(name => {
        const it = ITEMS[name], left = item(name) - list.filter(x => x === name).length;
        return el('div', { class: 'shoprow' },
          itemIcon(name),
          el('div', { class: 'sitm' },
            el('b', {}, name, el('span', { class: 'have' }, `のこり ${num(left)}`)),
            el('span', { class: 'sd' }, it.desc)),
          /* 「持つ」から「使う」へ（2026-09-26）。持ち込んだ時点で消えるので、
             気持ちのうえでも もう使っている */
          el('button', { class: 'go sm', onclick: add(name) }, '使う'));
      })),
      owned.length ? null : el('p', { class: 'note' }, '持ち込める道具がない。ショップの「蔵」で買える'),
      closeX(() => { S.prepBox = false; S.prepMsg = ''; SFX.pick(); draw(); })));
}

// 出陣に入れる／外す。カードの1タップと、カードのポップアップの両方から呼ぶ
/* ---- 同じ武将が二人いる部隊は組ませない（2026-09-22）----
   「織田信わん」と「織田ノブワン」はどちらも織田信長なので、同じ戦場に二人は立てない。
   characters.json の origin（元になった実在の武将）で見る。
   いまのマスタでは 織田信長／徳川家康／井伊直政／立花誾千代 の4組8体が該当する。 */
const originOf = no => (charOf(no) || {}).origin || null;
/* その部隊に、no と同じ元武将がすでにいるか（自分自身は数えない） */
function sameOriginIn(nos, no) {
  const o = originOf(no);
  if (!o) return null;
  const hit = nos.find(n => n !== no && originOf(n) === o);
  return hit == null ? null : { no: hit, origin: o };
}
/* 部隊の中の重なりを全部あげる（保存済みの部隊にも古い重なりが残っていることがある） */
function dupOrigins(nos) {
  const by = {};
  for (const n of nos) { const o = originOf(n); if (o) (by[o] || (by[o] = [])).push(n); }
  return Object.entries(by).filter(([, v]) => v.length > 1).map(([o, v]) => ({ origin: o, nos: v }));
}

function togglePick(c) {
  const q = P.squads[P.active];
  if (S.picked.some(p => p.no === c.no)) {
    q.nos = q.nos.filter(n => n !== c.no);
    S.slots = S.slots.map(n => (n === c.no ? null : n));
    if (S.general === c.no) S.general = q.nos[0] ?? null;
    S.pickMsg = '';
  } else if (q.nos.length < 5) {
    const foeSet = new Set((S.foe && S.foe.origins) || []);
    if (c.origin && foeSet.has(c.origin)) {
      S.pickMsg = `${c.origin} は次の戦に敵として出ておる。同じ人物は両軍には立てぬ`;
      SFX.pick(); draw(); return false;
    }
    const dup = sameOriginIn(q.nos, c.no);
    if (dup) {
      const other = charOf(dup.no);
      S.pickMsg = `${dup.origin} はすでに「${other ? other.name : ''}」で出陣しておる。同じ武将は一隊にひとりまで`;
      SFX.pick(); draw(); return false;
    }
    q.nos.push(c.no);
    miBump('team');   // お役目の数（門出・2026-09-26）。自分の手で入れたときだけ数える
    if (S.general == null) S.general = c.no;
    S.pickMsg = '';
  } else return false;
  SFX.pick();
  draw();
  return true;
}

/* ---------------- 編成（部隊プリセットの一覧）---------------- */
/* ---------------- 育成（2026-09-21）----------------
   ここが入口。武将強化・部隊編成・特技強化・特技継承・ショップへ散る。 */
const GROW_MENU = [
  { key: 'power',   mark: '将', name: '武将強化', note: 'レベルを上げ、限界をひらき、魂を振る' },
  { key: 'squads',  mark: '陣', name: '部隊編成', note: '出す5隊を組み、陣形と配置を決める' },
  { key: 'skillup', mark: '技', name: '特技強化', note: '同じ特技を重ねてLv3まで上げる。★で成功率が変わる' },
  { key: 'inherit', mark: '継', name: '特技継承', note: '他の武将の重ねから特技をひとつ受け継ぐ' },
  /* ショップはホームの左上へ移した（2026-09-26）。育成の献立からは外す */
];
function screenGrow() {
  return {
    body: el('div', {},
      /* 道具は三本線メニューの「所持アイテム」にまとめた（2026-09-21）。
         47種を帯で並べると文字の壁になって読めなかった */
      el('div', { class: 'growmenu' }, GROW_MENU.map(m =>
        (() => {
          /* 題を彫った一枚絵（grow_plate_<名>.png）があれば、行まるごとそれに差し替える。
             文字は絵に入っているので重ねない。無ければ従来の 座＋丸アイコン＋文字（2026-09-22） */
          const plate = uiUrl('grow_plate_' + m.name);
          if (plate) return el('button', {
            class: 'gm plate' + (m.soon ? ' soon' : ''),
            title: m.name,                      // 手引きがこの座を探すのに使う（2026-09-30）
            disabled: m.soon ? true : null,
            /* 入ったらまず武将えらび（2026-09-29） */
            onclick: m.soon ? null : () => { S.gpop = false; S.screen = m.key; SFX.pick(); draw(); },
          },
            keepImg({ class: 'gmp', src: plate, alt: m.name }),
            m.soon ? el('span', { class: 'gmn' }, el('em', {}, '近日')) : null);
          const icon = uiUrl('grow_' + m.name);
          const row = uiUrl('grow_row');
          return el('button', {
          class: 'gm' + (uiUrl('grow_row') ? ' art' : '') + (m.soon ? ' soon' : ''),
          title: m.name,                        // 手引きがこの座を探すのに使う（2026-09-30）
          style: row ? `--grow-row:url("${row}")` : null,
          disabled: m.soon ? true : null,
          onclick: m.soon ? null : () => { S.gpop = false; S.screen = m.key; SFX.pick(); draw(); },
        },
          el('span', { class: 'gmi' + (icon ? ' art' : '') },
            icon ? el('img', { src: icon, alt: '' }) : m.mark),
          el('span', { class: 'gmt' },
            el('b', {}, m.name, m.soon ? el('em', {}, '近日') : null)));
        })()))),
    nav: true,
  };
}

/* 武将強化。武将を選んで、レベル・覚醒・自由育成をここでやる */
function growTarget() {
  const own = P.own.filter(hasCard).map(charOf).filter(Boolean);
  if (!own.length) return null;
  // 既定は「いま選んでいる部隊の総大将」（2026-09-29）。
  // 三つの育成画面でばらばらの武将が出ていたので、ホームの顔にそろえた
  if (S.grow == null || !hasCard(S.grow)) S.grow = (homeChar() || own[0]).no;
  return charOf(S.grow);
}
function screenPower() {
  const c = growTarget();
  if (!c) return { body: el('div', {}, el('p', { class: 'note' }, 'まだ武将がいない')), nav: true };
  const st = charState(c.no);
  const cap = lvCapOf(c.no);
  const need = expToNext(st.lv);
  const g = grownStats(c);
  const ak = st.awake < AWAKE_MAX ? awakeCheck(c.rarity, st.awake, c.attr) : null;
  const feed = (kind, n) => () => {
    const r = feedBook(c.no, kind, n);
    // 上がったぶんは札のなかで一度だけ光らせる（2026-09-26）
    if (r && r.up) S.pwUp = r.up;
    if (r) { if (r.up) miBump('lv'); SFX.pick(); if (r.up) SFX.win(); draw(); }   // お役目の数（門出・2026-09-26）
  };
  /* 限界まで届くのに要る冊数（2026-09-26）。
     持っている数と、上限までの残りの経験の、少ないほうを取る。
     余らせて捨てることが無いようにするため */
  const feedFit = kind => {
    const it = ITEMS[kind] || {};
    if (!it.exp) return 1;
    let rest = -st.exp;
    for (let l = st.lv; l < cap; l++) rest += expToNext(l);
    return Math.max(1, Math.min(item(kind), Math.ceil(rest / it.exp)));
  };
  /* 稽古の絵を押したときの手（2026-09-26）。
     ちょん押しで1冊、長押しで限界まで一気に。
     釦を四つ並べずに、二つの使い方を絵ひとつに持たせた */
  const feedHold = (btn, kind) => {
    let long = false, t = null;
    const clear = () => { if (t) { clearTimeout(t); t = null; } };
    btn.onpointerdown = () => {
      long = false;
      t = setTimeout(() => { long = true; t = null; feed(kind, feedFit(kind))(); }, 420);
    };
    btn.onpointerup = clear;
    btn.onpointercancel = () => { clear(); long = false; };
    btn.onpointerleave = () => { clear(); long = false; };
    // 長押しで食わせたあとは画面を組み直すので、この click は来ない
    btn.onclick = () => { if (long) { long = false; return; } feed(kind, 1)(); };
  };
  /* ---- 三つの札（2026-09-26）---- */
  const BOOKS = ['稽古の書', '大稽古の書', '皆伝の書'];
  const canFeed = st.lv < cap && BOOKS.some(k => item(k) > 0);
  const canSoul = P.soul > 0 && spUsed(c.no) < SP_MAX;
  const pwClose = () => { S.pw = null; S.sp = null; S.spEdit = null; SFX.pick(); draw(); };
  /* 押すと札が開く釦。絵（ui/power_<名>）があれば絵に、無ければ一字に落ちる */
  function pwBtn(key, name, mark, lit) {
    const art = uiUrl('power_' + name);
    return el('button', {
      class: 'pwb' + (art ? ' art' : '') + (lit ? ' lit' : ''), title: name,
      onclick: () => { S.pw = key; S.sp = null; S.spEdit = null; SFX.pick(); draw(); },
    },
      art ? keepImg({ class: 'pwbuttonart', src: art, alt: name })
          : el('span', { class: 'pwi' }, mark),
      art ? null : el('b', {}, name),
      lit ? el('em', { class: 'pwd' }) : null);
  }
  function pwSheet(title, inner) {
    return el('div', { class: 'sheet', onclick: e => { if (e.target.classList.contains('sheet')) pwClose(); } },
      /* 札はほかの札（お役目・友・称号）と同じ明るい仕立てにそろえる（2026-09-26）。
         黒漆で通すのは育成の「画面」のほうで、札は札の仲間に見えるほうがよい。
         中身は黒地むけの色が混ざっているので、.pwbox で明るいほうへ寄せ直してある */
      el('div', { class: 'card2 pwbox' },
        el('b', { class: 'mittl' }, title),
        inner,
        closeX(pwClose)));
  }
  /* 稽古の中身。数が上がるのをその場で見せたいので、
     段・経験の帯・ステータスを札のなかにも出す（2026-09-26）。
     組み直しのたびに DOM が新しくなるので、光らせる仕掛けは class を足すだけでよい */
  const feedBody = () => {
    const up = S.pwUp || 0;
    S.pwUp = 0;
    return el('div', {},
    el('div', { class: 'pwlv' + (up ? ' flash' : '') },
      el('b', {}, `Lv.${st.lv}`),
      el('span', {}, `/ ${cap}`),
      up ? el('em', {}, `+${up}`) : null),
    el('div', { class: 'expbar' },
      el('i', { style: `width:${Math.min(100, st.exp / need * 100)}%` }),
      el('span', {}, st.lv >= cap ? '限界' : `次まで ${num(need - st.exp)}`)),
    el('div', { class: 'sts' + (up ? ' flash' : '') }, SP_STATS.map(k =>
      el('div', {}, statLabel(k), el('b', {}, num(g[k])),
        el('em', { class: 'up' }, st.sp[k] ? `+${st.sp[k]}` : ''))), totRow(g)),
    el('div', { class: 'feedmats' }, BOOKS.map(k => {
      const have = item(k);
      const off = have < 1 || st.lv >= cap;
      const b = el('button', {
        class: 'fdm' + (off ? ' off' : ''), disabled: off ? true : null,
        title: `${k}　のこり ${num(have)}`,
      }, itemIcon(k), el('em', { class: 'fdn' }, num(have)));
      if (!off) feedHold(b, k);
      return b;
    })),
    el('p', { class: 'note' }, st.lv >= cap ? '限界まで育った' : '※ 押すと1冊。長押しで限界まで一気に'));
  };
  /* 覚醒の中身（2026-09-21 素材制／2026-09-25 小判も要るように） */
  const awakeBody = () => st.awake >= AWAKE_MAX
    ? el('p', { class: 'note' }, 'これ以上は覚醒できない')
    : el('div', {},
        el('p', { class: 'note' }, `つぎの覚醒で、レベルの上限が ${LV_CAP[st.awake + 1]} まで開く`),
        /* 品は絵だけを横に並べ、数は絵の下に置く（2026-09-25） */
        el('div', { class: 'akmats' }, ak.rows.map(x =>
          el('div', { class: 'akm' + (x.ok ? ' ok' : '') },
            itemIcon(x.name),
            el('span', {}, `${num(Math.min(item(x.name), x.n))}/${num(x.n)}`)))),
        el('div', { class: 'akcost' + (ak.kobanOk ? '' : ' ng') },
          el('span', { class: 'l' }, '消費'), curIcon('koban'), el('b', {}, num(ak.koban))),
        el('button', {
          class: 'go wide' + (ak.ok ? ' ready' : ''), disabled: ak.ok ? null : true,
          onclick: () => {
            const r = awaken(c.no, c.rarity, c.attr);
            if (r) miBump('awake');   // お役目の数（2026-09-24）
            if (r) { SFX.ult ? SFX.ult() : SFX.win(); draw(); }
          },
        }, ak.ok ? '覚醒する' : (ak.matOk ? '小判が足りない' : '素材が足りない')));
  return {
    body: el('div', {},
      S.gpop ? null :
      el('button', { class: 'ghost back', onclick: () => { S.sp = null; S.pw = null; S.gpop = false; S.screen = 'grow'; SFX.pick(); draw(); } }, '← 育成へ'),
      // 誰を育てるか。先に武将をえらぶ（2026-09-29）
      growPickPage('lv', no => { S.grow = no; S.sp = null; S.spEdit = null; S.pw = null; }),
      !S.gpop ? null : growPop(() => { S.pw = null; S.gpop = false; SFX.pick(); draw(); },
      // いまの姿
      el('div', { class: 'card2 growbox' },
        el('div', { class: 'top' },
          faceBtn(c),
          el('div', {},
            el('b', {}, c.name),
            el('div', { class: 'meta' }, rarTag(c.rarity, 'sm'), attrTag(c.attr, 'sm'),
              el('span', {}, `Lv.${st.lv} / ${cap}`),
              el('span', {}, '覚醒 ' + '◆'.repeat(st.awake) + '◇'.repeat(AWAKE_MAX - st.awake))))),
        // 経験のゲージ
        el('div', { class: 'expbar' },
          el('i', { style: `width:${Math.min(100, st.exp / need * 100)}%` }),
          el('span', {}, st.lv >= cap ? '限界' : `次まで ${num(need - st.exp)}`)),
        // ステータス
        /* 絵も並べる（2026-09-25）。ここだけ字だけで、ほかの画面と揃っていなかった */
        el('div', { class: 'sts' }, SP_STATS.map(k =>
          /* ＋の欄は振っていなくても空で置く（2026-09-25）。
             無いと その行だけ数が右へずれて、縦の線がそろわなかった */
          el('div', {}, statLabel(k), el('b', {}, num(g[k])),
            el('em', { class: 'up' }, st.sp[k] ? `+${st.sp[k]}` : ''))), totRow(g)),
        /* 三つの育てかたを、ステータスの下に横並びの釦でまとめた（2026-09-26）。
           一枚の画面に稽古・覚醒・魂を縦に積むと、どこからどこまでが
           どの話なのか分からなくなっていた。押すとそれぞれの札が開く。
           金の丸がついている釦は、いま何かできるという合図 */
        el('div', { class: 'pwmenu' },
          pwBtn('稽古', '稽古', '書', canFeed),
          pwBtn('覚醒', '覚醒', '覚', !!(ak && ak.ok)),
          pwBtn('魂', '魂を振る', '魂', canSoul))),
      S.pw === '稽古' ? pwSheet('稽古をつける', feedBody()) : null,
      S.pw === '覚醒' ? pwSheet('覚醒', awakeBody()) : null,
      S.pw === '魂' ? pwSheet('武士の魂を振る', spPanel(c)) : null),
    ),
    nav: true,
  };
}

/* ---- 武将を選ぶ（2026-09-21） ----
   いま選んでいる武将を大きく出し、押すと一覧のシートが開く。
   持ち武将が100体になると横帯では選べないため。 */
function pickBar(c, onPick, mode) {
  const st = charState(c.no);
  return el('button', {
    class: 'pickbar',
    onclick: () => { S.cpFor = onPick; S.cpMode = mode || 'cnt'; S.cp = true; SFX.pick(); draw(); },
  },
    el('span', { class: 'pf' }, cardImg(c) || el('i', { style: chipStyle(c) })),
    el('span', { class: 'pt' },
      el('b', {}, c.name),
      el('span', {}, `Lv.${st.lv}　覚醒 ${st.awake}　／　持ち武将 ${num(P.own.filter(hasCard).length)} 体`)),
    el('span', { class: 'pc' }, '武将を選ぶ'));
}
/* 育成の三画面は「武将を選ぶ」が先（2026-09-29）。
   黒金の画面いっぱいで武将をえらび、えらんだら強化の中身が札で開く。
   前は強化の画面が先に出ていて、武将を替えるには上の帯を押す必要があった。
   えらぶ手数は同じでも、何をする画面かが先に分かる */
function growPickPage(mode, onPick) {
  const list = pickApply(P.own.filter(hasCard).map(charOf).filter(Boolean), PF_GROW);
  return el('div', { class: 'gpick' },
    pickRows(PF_GROW),
    el('div', { class: 'pickgrid' }, list.map(ch => el('button', {
      class: 'pg',
      onclick: () => { onPick(ch.no); S.gpop = true; SFX.pick(); draw(); },
    }, cardImg(ch) || el('i', { style: chipStyle(ch) }),
       /* 武将強化はレベル、特技強化と継承は重ねの数が選ぶ手がかり（2026-09-23） */
       mode === 'lv' ? el('span', { class: 'own lvb2' }, `Lv.${charState(ch.no).lv}`)
                     : el('span', { class: 'own' }, `×${num(cntOf(ch.no))}`)))));
}
/* 札（ポップアップ）の「閉じる」（2026-09-30）。
   見た目はこれまでの横いっぱいの釦のまま、札の下ぎわに貼り付けて動かさない。
   長い札だと、下まで巻かないと閉じられないのが不便だった。
   画面そのものを戻る釦（金丸×）とは役目が違うので、形も分けてある */
function closeX(fn, label) {
  return el('button', { class: 'ghost wide sheetclose', onclick: fn }, label || '閉じる');
}
/* 強化の中身を出す札（2026-09-29）。
   閉じるは、戻るの追従釦と同じ場所・同じ形。画面の下にいても押せる。
   外側を押しても閉じるが、中の札（稽古・覚醒・魂）を押して閉じないよう
   currentTarget で見分ける */
function growPop(close, ...kids) {
  /* 閉じるは中の札のいちばん下に入れる（2026-09-30）。
     ほかのポップアップと同じ「横いっぱいの閉じる」で、下ぎわに貼り付いて動かない */
  const box = el('div', {
    class: 'sheet growpop',
    onclick: e => { if (e.target === e.currentTarget) close(); },
  }, ...kids.filter(Boolean));
  (box.querySelector('.card2') || box).append(closeX(close));
  return box;
}
function pickSheet() {
  const close = () => { S.cp = false; S.cpFor = null; S.cpMode = null; draw(); };
  const list = pickApply(P.own.filter(hasCard).map(charOf).filter(Boolean), PF_GROW);
  return el('div', { class: 'sheet', onclick: e => { if (e.target.classList.contains('sheet')) close(); } },
    el('div', { class: 'card2' },
      el('b', { class: 'mittl' }, '武将を選ぶ'),
      pickRows(PF_GROW),
      el('div', { class: 'pickgrid' }, list.map(ch => {
        return el('button', {
          class: 'pg',
          onclick: () => { const fn = S.cpFor; S.cp = false; S.cpFor = null; S.cpMode = null; if (fn) fn(ch.no); SFX.pick(); draw(); },
        }, cardImg(ch) || el('i', { style: chipStyle(ch) }),
           /* 武将強化では「いま何レベルか」が選ぶ手がかりになるので、
              所持枚数ではなくレベルを出す（2026-09-23）。特技強化・継承は重ねが要るので枚数のまま */
           S.cpMode === 'lv'
             ? el('span', { class: 'own lvb2' }, `Lv.${charState(ch.no).lv}`)
             : el('span', { class: 'own' }, `×${num(cntOf(ch.no))}`));
      })),
      list.length ? null : el('p', { class: 'note' }, 'この絞り込みに当てはまる武将がいない'),
      closeX(close)));
}

/* 覚醒に要る素材を1行で出す。足りないぶんは「無銘」で埋まることも見せる */
function matRow(name, need, have, sub) {
  const ok = have + (sub ? sub.n : 0) >= need;
  return el('div', { class: 'matrow' + (ok ? ' ok' : '') },
    itemIcon(name),
    el('div', { class: 'mi' },
      el('b', {}, name),
      sub ? el('span', { class: 'msub' }, `${sub.name} で ${num(sub.n)} ぶん埋める`) : null),
    el('span', { class: 'mn' }, `${num(Math.min(item(name), need))}${sub ? `+${num(sub.n)}` : ''} / ${num(need)}`));
}

/* ---- 武士の魂：下書き式の振り分け（2026-09-21） ----
   ＋で増やし、−で戻せる。画面を出た時点では何も変わっておらず、
   「強化を確定する」を押したときにはじめて魂が減る。確定したぶんは戻せない。 */
function spDraft(no) {
  if (!S.sp || S.sp.no !== no) S.sp = { no, d: Object.fromEntries(SP_STATS.map(k => [k, 0])) };
  return S.sp.d;
}
const spDraftTotal = no => SP_STATS.reduce((a, k) => a + spDraft(no)[k], 0);
function spBump(no, k, n) {
  const d = spDraft(no);
  if (n > 0) {
    const room = Math.min(n, P.soul - spDraftTotal(no), SP_MAX - spUsed(no) - spDraftTotal(no));
    if (room <= 0) return false;
    d[k] += room;
  } else {
    const back = Math.min(-n, d[k]);          // 下書きの範囲でしか戻せない
    if (back <= 0) return false;
    d[k] -= back;
  }
  return true;
}
function spPanel(c) {
  const st = charState(c.no);
  const d = spDraft(c.no);
  const total = spDraftTotal(c.no);
  const left = P.soul - total;
  const used = spUsed(c.no);
  const room = SP_MAX - used - total;
  return el('div', { class: 'sppan' },
    el('p', { class: 'note sphd' },
      `振った ${num(used)}${total ? ` → ${num(used + total)}` : ''} / ${num(SP_MAX)}　　`
      + `のこる魂 ${num(left)}${total ? `（${num(P.soul)} − ${num(total)}）` : ''}`),
    el('div', { class: 'splist' }, SP_STATS.map(k => spRow(c, k))),
    el('div', { class: 'spfoot' },
      el('button', {
        class: 'ghost sm', disabled: total ? null : true,
        onclick: () => { S.sp = null; S.spEdit = null; SFX.pick(); draw(); },
      }, 'はじめに戻す'),
      el('button', {
        /* 念押しの札はやめて、その場で確定する（2026-09-26）。
           ＋−で積んでいる時点で本人は決めている。もう一枚はさむと手が止まるだけ。
           取り返しがつかないことは、すぐ下の※に書いてある */
        class: 'go', disabled: total ? null : true,
        onclick: () => {
          const n = commitSp(c.no, spDraft(c.no));
          S.spEdit = null; S.sp = null;
          if (n) SFX.win(); else SFX.pick();
          draw();
        },
      }, total ? `強化を確定する（魂 ${num(total)}）` : '強化を確定する')),
    el('p', { class: 'note warn' }, '※ ＋−は長押しで速くなる。数字を押せば直接入れられる。確定したぶんは戻せない'),
  );
}

/* 1行ぶん。[−] [ +5pt ] [＋] [最大] */
function spRow(c, k) {
  const st = charState(c.no);
  const d = spDraft(c.no);
  const total = spDraftTotal(c.no);
  const room = Math.min(P.soul - total, SP_MAX - spUsed(c.no) - total);
  const minus = el('button', { class: 'sq minus', disabled: d[k] < 1 ? true : null }, '−');
  const plus  = el('button', { class: 'sq plus',  disabled: room < 1 ? true : null }, '＋');
  spHold(minus, c, k, -1);
  spHold(plus, c, k, +1);
  const val = S.spEdit === k
    ? el('input', {
        class: 'spval edit', type: 'number', inputmode: 'numeric', min: 0,
        max: d[k] + Math.max(0, room), value: String(d[k]),
        onkeydown: e => { if (e.key === 'Enter') e.target.blur(); },
        onblur: e => { spSet(c, k, parseInt(e.target.value, 10) || 0); S.spEdit = null; draw(); },
      })
    : el('button', {
        class: 'spval', onclick: () => { S.spEdit = k; draw(); setTimeout(() => {
          const i2 = document.querySelector('.spval.edit'); if (i2) { i2.focus(); i2.select(); } }, 0); },
      }, `+${num(d[k])}pt`);
  const max = el('button', {
    class: 'sq max', disabled: room < 1 ? true : null,
    onclick: () => { if (spBump(c.no, k, room)) { SFX.pick(); spRefresh(c); } },
  }, '最大');
  return el('div', { class: 'sprow' + (d[k] ? ' on' : ''), 'data-k': k },
    el('div', { class: 'spv' },
      el('span', { class: 'spn' }, k),
      el('div', { class: 'spnums' },
        el('b', { class: 'spnow' }, `+${num(st.sp[k])}`),
        el('em', { class: 'spto' }, d[k] ? `→ +${num(st.sp[k] + d[k])}` : ''))),
    el('div', { class: 'spctl' }, minus, val, plus, max));
}
/* 数値を直接入れる */
function spSet(c, k, v) {
  const d = spDraft(c.no);
  const room = Math.min(P.soul - spDraftTotal(c.no), SP_MAX - spUsed(c.no) - spDraftTotal(c.no));
  const want = Math.max(0, Math.min(v, d[k] + Math.max(0, room)));
  d[k] = want;
  SFX.pick();
}
/* 長押しで加速。押しているあいだは画面を組み直さず、数字だけ書き換える */
function spHold(btn, c, k, dir) {
  let timer = null, wait = null, n = 0;
  const step = () => (n < 10 ? 1 : n < 25 ? 5 : n < 45 ? 20 : 50);
  const tick = () => {
    if (!spBump(c.no, k, dir * step())) { stop(); spRefresh(c); return; }
    n++;
    spRefresh(c);
  };
  const stop = () => { clearTimeout(wait); clearInterval(timer); wait = timer = null; };
  btn.onpointerdown = e => {
    if (btn.disabled) return;
    e.preventDefault();
    n = 0; tick(); SFX.pick();
    wait = setTimeout(() => { timer = setInterval(tick, 80); }, 380);
  };
  // 押し終わりも組み直さない。数字と押せる／押せないは spRefresh が書き換える
  const end = () => { if (wait || timer) { stop(); spRefresh(c); } };
  btn.onpointerup = end;
  btn.onpointercancel = end;
  btn.onpointerleave = end;
}
/* 押しているあいだの書き換え。組み直さないのでボタンが消えない */
function spRefresh(c) {
  const st = charState(c.no), d = spDraft(c.no);
  const total = spDraftTotal(c.no), used = spUsed(c.no);
  const left = P.soul - total, room = Math.min(left, SP_MAX - used - total);
  for (const k of SP_STATS) {
    const row = document.querySelector(`.sprow[data-k="${k}"]`); if (!row) continue;
    row.classList.toggle('on', !!d[k]);
    row.querySelector('.spnow').textContent = `+${num(st.sp[k])}`;
    row.querySelector('.spto').textContent = d[k] ? `→ +${num(st.sp[k] + d[k])}` : '';
    const v = row.querySelector('.spval'); if (v && v.tagName === 'BUTTON') v.textContent = `+${num(d[k])}pt`;
    row.querySelector('.sq.minus').disabled = d[k] < 1;
    row.querySelector('.sq.plus').disabled = room < 1;
    row.querySelector('.sq.max').disabled = room < 1;
  }
  const hd = document.querySelector('.sppan .sphd');
  if (hd) hd.textContent = `振った ${num(used)}${total ? ` → ${num(used + total)}` : ''} / ${num(SP_MAX)}　　`
    + `のこる魂 ${num(left)}${total ? `（${num(P.soul)} − ${num(total)}）` : ''}`;
  const go = document.querySelector('.spfoot .go');
  if (go) { go.disabled = !total; go.textContent = total ? `強化を確定する（魂 ${num(total)}）` : '強化を確定する'; }
  const rs = document.querySelector('.spfoot .ghost');
  if (rs) rs.disabled = !total;
}

/* まだ作っていない画面は、ここで「近日」と出しておく */
function soonScreen(title, lines) {
  return () => ({
    body: el('div', {},
      el('button', { class: 'ghost back', onclick: () => { S.screen = 'grow'; SFX.pick(); draw(); } }, '← 育成へ'),
      el('h2', {}, title),
      el('div', { class: 'card2' },
        lines.map(t => el('p', { style: 'font-size:12px;color:var(--text2);line-height:1.8;margin:0 0 6px' }, t)),
        el('p', { class: 'note' }, 'この画面はこれから作る'))),
    nav: true,
  });
}
/* ---------------- 特技強化（2026-09-21） ----------------
   通常特技をLv3まで上げる。素材は「同じ通常特技を持つ武将の重ね」か「特技の伝書」。
   成功率は特技の★で決まり、素材を積むほど足し算で上がる。護符を1つ添えられる。
   失敗すると積んだ素材は消える。 */
const stars = n => '★'.repeat(n) + '☆'.repeat(5 - n);
const CHARMS = ['上達の護符・小', '上達の護符・中', '上達の護符・大'];   // 強化用。継承は INH_CHARMS

function skillTarget() {
  if (S.skc != null && hasCard(S.skc)) return charOf(S.skc);
  return homeChar() || charOf(P.own.find(hasCard)) || null;
}
/* いま積んでいる素材 [{no}|{book:true}] */
const skMats = () => (S.skm || (S.skm = []));
const skMatCount = (no) => skMats().filter(m => !m.book && m.no === no).length;
const skBookCount = () => skMats().filter(m => m.book).length;

function screenSkillUp() {
  const c = skillTarget();
  if (!c) return { body: el('div', {}, el('p', { class: 'note' }, 'まだ武将がいない')), nav: true };
  const lv = skillLvOf(c.no);
  const ns = slotsOf(c);                         // 3枠そのまま。空きは「あき」として出す
  const upable = i => ns[i] && !ns[i].uniq;      // ◆と空き枠にレベルは無いので選べない
  if (S.sks == null || S.sks >= ns.length || !upable(S.sks)) {
    const j = ns.findIndex((_, i) => upable(i));
    S.sks = j >= 0 ? j : 0;
  }
  const cur = ns[S.sks] || null;
  const slot = cur ? cur.slot : 0;
  const sk = cur && !cur.uniq ? cur.sk : null;    // ◆にレベルは無いので強化できない
  const mats = skMats();
  const charm = S.skch || null;
  const full = !sk || lv[slot] >= SKILL_MAX;
  const rate = sk && mats.length ? skillRate(sk.name, mats, charm) : 0;
  return {
    body: el('div', {},
      S.gpop ? null :
      el('button', { class: 'ghost back', onclick: () => { S.skm = []; S.skch = null; S.gpop = false; S.screen = 'grow'; SFX.pick(); draw(); } }, '← 育成へ'),
      // 誰の特技を上げるか。先に武将をえらぶ（2026-09-29）
      growPickPage('cnt', no => { S.skc = no; S.sks = 0; S.skm = []; S.skch = null; S.skMsg = ''; }),
      !S.gpop ? null : growPop(() => { S.gpop = false; SFX.pick(); draw(); },
      el('div', { class: 'card2 growbox' },
        el('div', { class: 'top' },
          faceBtn(c),
          el('div', {},
            el('b', {}, c.name),
            el('div', { class: 'meta' }, rarTag(c.rarity, 'sm'), attrTag(c.attr, 'sm'),
              el('span', {}, `重ね ${num(dupOf(c.no))}`)))),
        dupOf(c.no) ? el('button', {
          class: 'ghost sm', style: 'margin-bottom:10px',
          onclick: () => { const r = sellDup(c.no, c.rarity, 1); if (r) { SFX.win(); S.skMsg = `重ねを1つ売って魂 ${num(r.soul)} を得た`; draw(); } },
        }, `重ねを1つ売る（魂 +${num(SOUL_BY_RARITY[c.rarity] || 1)}）`) : null,

        el('h3', {}, 'どの特技を上げるか'),
        el('div', { class: 'sklist' }, ns.map((x, i) => el('button', {
          class: 'skrow' + (i === S.sks && x && !x.uniq ? ' on' : '')
            + (x && x.uniq ? ' locked' : '') + (x ? '' : ' empty')
            + (x && !x.uniq && lv[x.slot] >= SKILL_MAX ? ' max' : ''),
          disabled: !x || x.uniq ? true : null,
          onclick: !x || x.uniq ? null : () => { S.sks = i; S.skm = []; S.skch = null; S.skMsg = ''; SFX.pick(); draw(); },
        },
          el('div', { class: 'skhd' },
            el('b', {}, x ? x.sk.name : `${'一二三'[i]}の枠（空き）`),
            el('span', { class: 'sklv' },
              !x ? 'あき'
                : x.uniq ? (x.own ? '固有◆' : '継いだ◆')
                : lv[x.slot] >= SKILL_MAX ? '極' : `Lv.${lv[x.slot]}`)),
          x ? el('span', { class: 'skst' },
            x.uniq ? '◆ レベルは無い（強化できない）' : stars(starOf(x.sk.name))) : null,
          el('span', { class: 'sktx' },
            x ? x.sk.text : '特技継承で、ここに特技を入れられる')))),
        !ns.some(x => x && !x.uniq)
          ? el('p', { class: 'note' }, 'この武将には強化できる通常特技が無い') : null,

        sk && !full ? el('div', {},
          /* 継承と同じ形にそろえた（2026-09-25）。キャラ1体 × 道具1つ */
          el('h3', {}, '強化に使うカードを選んでわん！'),
          el('div', { class: 'matpick' }, matChoices(c, sk).map(x => x)),
          /* 「上達の護符」の見出しは消した（2026-09-26）。釦の絵がその品を出している */
          charm
            ? el('div', { class: 'charmon' },
                itemIcon(charm),
                el('span', { class: 'n' }, charm),
                el('span', { class: 'v' }, `成功率 +${ITEMS[charm].luck}%`),
                el('button', { class: 'ghost sm', onclick: () => { S.skch = null; SFX.pick(); draw(); } }, '外す'))
            : useItemBtn('特技', 'アイテム', CHARMS[2]),
          el('div', { class: 'ratebar' },
            el('i', { style: `width:${rate}%` }),
            el('b', {}, `成功率 ${rate}%`)),
          S.skMsg ? el('div', { class: 'shopmsg' }, S.skMsg) : null,
          artGo('強化', '強化する', mats.length ? 'ready' : '',
            () => {
              if (eatenCards(mats).length && !S.skAsk) { S.skAsk = true; SFX.pick(); draw(); return; }
              const r = skillUp(c.no, slot, sk.name, mats, charm);
              if (r) { miBump('up'); if (r.ok) miBump('upOk'); }   // お役目の数（2026-09-24）
              S.skm = []; S.skch = null; S.skAsk = false;
              if (!r) { S.skMsg = '素材が足りない'; SFX.pick(); }
              else if (r.ok) {
                S.skMsg = '';
                S.win = { title: '特技強化 成功', name: sk.name, lv: r.lv };
                SFX.win();
              } else {
                S.skMsg = '';
                S.win = { bad: true, title: '特技強化 失敗', name: sk.name,
                          note: `${lostNames(mats)} は失われました` };
                SFX.pick();
              }
              draw();
            }, !mats.length),
          el('p', { class: 'note warn' }, '※失敗してもキャラとアイテムは戻りません。'),
          S.skAsk ? eatSheet(eatenCards(mats), () => {
            const r = skillUp(c.no, slot, sk.name, mats, charm);
              if (r) { miBump('up'); if (r.ok) miBump('upOk'); }   // お役目の数（2026-09-24）
            S.skm = []; S.skch = null; S.skAsk = false;
            if (!r) S.skMsg = '素材が足りない';
            else if (r.ok) { S.skMsg = ''; S.win = { title: '特技強化 成功', name: sk.name, lv: r.lv }; SFX.win(); }
            else { S.skMsg = ''; S.win = { bad: true, title: '特技強化 失敗', name: sk.name,
                    note: `${lostNames(mats)} は失われました` }; SFX.pick(); }
            draw();
          }, () => { S.skAsk = false; draw(); }) : null)
          : (cur && cur.uniq ? el('p', { class: 'note' }, '◆（固有）にレベルは無い。強化できない')
             : sk ? el('p', { class: 'note' }, 'この特技はもう極まっている') : null),
        S.skMsg && (full || !sk) ? el('div', { class: 'shopmsg' }, S.skMsg) : null)),
    ),
    nav: true,
  };
}
/* 素材に使えるものを並べる。同じ特技を持つ武将の「重ね」＋特技の伝書。
   重ねが0の武将は出さない（押せない札を並べても「選べない」と見えるだけなので） */
function matChoices(target, sk) {
  const out = [];
  // 同じ特技を持つ武将なら誰でも素材になる。重ねでも、カード本体でもよい
  const owners = C.filter(x => hasCard(x.no)
    && slotsOf(x).some(y => y && y.sk.name === sk.name)
    && (matLeft(x.no, target.no) > 0 || skMatCount(x.no) > 0));
  for (const o of owners) {
    const used = skMatCount(o.no);
    const left = matLeft(o.no, target.no) - used;
    const eatsCard = cardsNeeded(o.no, used) > 0;      // いま積んだぶんに本体が含まれるか
    out.push(el('button', {
      class: 'mc' + (used ? ' on' : '') + (eatsCard ? ' eat' : ''),
      disabled: left < 1 && !used ? true : null,
      title: `${o.name}　手持ち ${num(cntOf(o.no))} 枚（長押しでカード）`,
      ...holdCard(o),                                   // 長押しでカードを見る（2026-09-24）
      /* 素材はひとつだけ（2026-09-25）。押すと選ぶ、もう一度押すと外す */
      onclick: () => {
        if (heldJust()) return;
        S.skm = used ? [] : [{ no: o.no }];
        S.skMsg = ''; SFX.pick(); draw();
      },
    }, cardImg(o), rarTag(o.rarity, 'mcr'), el('span', { class: 'mcn' }, matTag(o.no, target.no, used))));
  }
  const bookLeft = item(BOOK) - skBookCount();
  if (item(BOOK) > 0) out.push(el('button', {
    class: 'mc book' + (skBookCount() ? ' on' : ''),
    disabled: bookLeft < 1 && !skBookCount() ? true : null,
    title: `${BOOK}　持 ${num(item(BOOK))}`,
    onclick: () => {
      S.skm = skBookCount() ? [] : [{ book: true }];
      S.skMsg = ''; SFX.pick(); draw();
    },
  }, el('span', { class: 'itic k特技' }, '技'), el('span', { class: 'mcn' }, `×${num(bookLeft)}`)));
  if (!out.length) out.push(noMat(
    'この特技を上げる素材がない',
    `「${sk.name}」を持つ武将の**重ね**か、**${BOOK}**が要る。`));
  return out;
}
/* 武将解雇（2026-09-21）。枚数は武将強化と同じ ⊖ 数 ⊕ 最大 で選ぶ。
   図鑑からは消えず、持っている枚数だけが減る（0枚になっても記録は残る） */
function fireSheet() {
  const c = charOf(S.fire); if (!c) return null;
  const close = () => { S.fire = null; draw(); };
  const max = fireMax(c.no);
  if (S.fireN == null || S.fireN > max) S.fireN = Math.min(1, max);
  const n = Math.max(0, S.fireN);
  const one = SOUL_BY_RARITY[c.rarity] || 1;
  const soul = one * n;
  const busy = inSquad(c.no);
  const bump = d => () => {
    S.fireN = Math.max(1, Math.min(max, (S.fireN || 1) + d));
    SFX.pick(); draw();
  };
  return el('div', { class: 'sheet', onclick: e => { if (e.target.classList.contains('sheet')) close(); } },
    el('div', { class: 'card2' },
      el('b', { class: 'mittl' }, `${c.name} を解雇する`),
      el('div', { class: 'top', style: 'margin-top:10px' },
        el('span', { class: 'f', style: chipStyle(c) }),
        el('div', {},
          el('b', {}, c.name),
          el('div', { class: 'meta' }, rarTag(c.rarity, 'sm'), attrTag(c.attr, 'sm'),
            el('span', {}, `手持ち ${num(cntOf(c.no))} 枚`)))),
      max < 1
        ? el('p', { class: 'note warn' },
            busy ? 'この武将は部隊に入っている。部隊から外してから解雇する' : 'もう持っていない')
        : el('div', {},
            el('div', { class: 'sprow on' },
              el('div', { class: 'spv' },
                el('span', { class: 'spn' }, '手放す枚数'),
                el('div', { class: 'spnums' },
                  el('b', {}, `${num(cntOf(c.no))} → ${num(cntOf(c.no) - n)} 枚`))),
              el('div', { class: 'spctl' },
                el('button', { class: 'sq minus', disabled: n <= 1 ? true : null, onclick: bump(-1) }, '−'),
                el('span', { class: 'spval' }, `${num(n)}枚`),
                el('button', { class: 'sq plus', disabled: n >= max ? true : null, onclick: bump(1) }, '＋'),
                el('button', { class: 'sq max', disabled: n >= max ? true : null,
                  onclick: () => { S.fireN = max; SFX.pick(); draw(); } }, '最大'))),
            busy ? el('p', { class: 'note' }, '部隊に入っているので、最後の1枚は残る') : null,
            el('p', { class: 'note warn' },
              cntOf(c.no) - n <= 0
                ? '手持ちが 0 枚になる。図鑑には残るが、育てたレベル・魂・継承は失われる'
                : '育てたレベル・魂・継承は、手持ちが 0 枚になったときに失われる'),
            el('p', { class: 'note' }, `武士の魂 ${num(soul)} を得る（1枚 ${num(one)}）`)),
      el('div', { class: 'acts2' },
        el('button', { class: 'ghost sm', onclick: close }, 'やめる'),
        el('button', {
          class: 'go sm danger', disabled: max < 1 ? true : null,
          onclick: () => {
            const r = dismiss(c.no, c.rarity, n);
            S.fire = null; S.fireN = null;
            if (r) { SFX.win(); if (r.left <= 0) { S.detail = null; S.side = null; } }
            else SFX.pick();
            draw();
          },
        }, max < 1 ? '解雇できない' : `解雇する（魂 +${num(soul)}）`))));
}

/* 強化・継承が成功したときの祝い（2026-09-21）。良いことは大きく出す */
/* 失敗したときに失われた素材を並べる（2026-09-24）。同じものは ×n にまとめる */
function lostNames(ms) {
  const c = {};
  for (const m of (ms || [])) {
    const n = m.book ? BOOK : ((charOf(m.no) || {}).name || '');
    if (n) c[n] = (c[n] || 0) + 1;
  }
  return Object.entries(c).map(([n, k]) => (k > 1 ? `${n} ×${k}` : n)).join('・');
}
/* 特技名から先頭の（属性）を落とす。札では属性は要らない（2026-09-24） */
const plainSkill = n => String(n || '').replace(/^[（(][^）)]*[）)]\s*/, '');
function winSheet() {
  const w = S.win; if (!w) return null;
  const close = () => { S.win = null; draw(); };   // どこを押しても閉じる（カットインと同じ）
  /* 出すのは3つだけ（2026-09-24）。題・特技名・そのひとこと。
     印も内枠も効果の文も「タップして戻る」も出さない。どこを押しても閉じる */
  const isInherit = w.title.includes('継承');
  const frame = uiUrl(w.bad ? 'win_frame_lose' : 'win_frame');
  const titleArt = uiUrl(isInherit
    ? (w.bad ? 'title_継承失敗' : 'title_継承成功')
    : (w.bad ? 'title_強化失敗' : 'title_強化成功'));
  return el('div', { class: 'sheet wsheet' + (w.bad ? ' bad' : ''), onclick: close },
    el('div', { class: 'card2 winbox slim' + (frame ? ' framed' : '') + (w.bad ? ' lose' : ''),
      style: frame ? `--wframe:url("${frame}")` : null },
      el('div', { class: 'wray' }),
      titleArt ? el('img', { class: 'wttlart', src: titleArt, alt: w.title })
               : el('b', { class: 'wttl' }, w.title),
      el('div', { class: 'wbody' },
        el('span', { class: 'wn' }, plainSkill(w.name)),
        w.lv ? el('span', { class: 'wlv' },
          el('i', { class: 'old' }, `Lv.${w.lv - 1}`),
          el('i', { class: 'arr' }, '➜'),
          el('em', {}, `Lv.${w.lv}`)) : null,
        /* 継承のときは「誰から誰へ」と「何が失われたか」を続けて出す（2026-09-25） */
        w.from ? el('span', { class: 'wfrom' },
          el('i', {}, w.from), el('em', {}, '➜'), el('i', { class: 'to' }, w.to)) : null,
        w.lost ? el('span', { class: 'wlost' }, `${w.lost} は失われました`) : null,
        w.note ? el('span', { class: 'wnote' }, w.note) : null)));
}

/* 最後の1枚を使うときの確認（2026-09-21／文言を正した 2026-09-25）。
   ★図鑑からは消えない。手持ちが0枚になるだけで、記録は残る。
   ただし育てたぶん（レベル・覚醒・継いだ技）は失われ、
   0枚のあいだは編成にも強化にも出てこなくなる。だから必ず1枚はさむ */
function eatSheet(nos, go, cancel) {
  return el('div', { class: 'sheet', onclick: e => { if (e.target.classList.contains('sheet')) cancel(); } },
    el('div', { class: 'card2 eatbox' },
      el('b', { class: 'mittl' }, '最後の1枚を使う'),
      el('p', { class: 'note warn' },
        '手持ちが 0 枚になる。図鑑には残るが、育てたレベル・覚醒・継いだ技は失われ、'
        + '編成にも強化にも出てこなくなる'),
      /* 何を失うのかが分かるよう、札の表をそのまま大きく見せる（2026-09-25）。
         56角に切り抜くと誰のカードだか分からなかった */
      el('div', { class: 'eatcards' }, nos.map(n => {
        const o = charOf(n); if (!o) return null;
        return el('div', { class: 'eatc' },
          /* カードの絵がまだ無い武将は、属性の色の札に名を載せる（絵が無くても動く決まり） */
          cardArt(o) ? cardImg(o)
            : el('span', { class: 'f', style: chipStyle(o) }, el('i', {}, o.name)),
          el('b', {}, o.name));
      })),
      /* 進むほうを左、やめるほうを右。二つとも同じ幅で真ん中に寄せる */
      el('div', { class: 'eatacts' },
        el('button', { class: 'go', onclick: go }, 'それでも使う'),
        el('button', { class: 'ghost', onclick: cancel }, 'やめる'))));
}
/* 札の隅に出す「あと何枚使えるか」。数え方は図鑑とそろえる */
function matTag(no, targetNo, used) {
  return `×${num(Math.max(0, matLeft(no, targetNo) - used))}`;
}
/* 積んだ素材のうち、カード本体を食べる武将の一覧 */
function eatenCards(mats) {
  const byNo = {};
  for (const m of mats) if (!m.book) byNo[m.no] = (byNo[m.no] || 0) + 1;
  return Object.keys(byNo).filter(k => cardsNeeded(Number(k), byNo[k]) > 0).map(Number);
}
/* 素材が無いときの案内。小さな注記だと見落とすので、はっきり出す（2026-09-21） */
function noMat(title, body) {
  return el('div', { class: 'nomat' },
    el('b', {}, title),
    el('p', {}, body.replace(/\*\*/g, '')),
    el('ul', {},
      el('li', {}, '重ね … 同じ武将をもう一度引くと増える'),
      el('li', {}, `${BOOK} … ショップの「蔵」で 2,500 小判`)),
    el('button', {
      class: 'go sm', onclick: () => { S.shopTab = 'kura'; S.screen = 'shop'; SFX.pick(); draw(); },
    }, 'ショップへ'));
}
/* ---------------- 特技継承（2026-09-21） ----------------
   他の武将の「重ね」を素材に、その武将が持つ特技をひとつ受け継ぐ。
   通常特技は Lv1 に戻る。◆は同じ属性の武将にしか継げない。奥義は継げない。 */
function inhTarget() {
  if (S.ihc != null && hasCard(S.ihc)) return charOf(S.ihc);
  return homeChar() || charOf(P.own.find(hasCard)) || null;
}
const ihMats = () => (S.ihm || (S.ihm = []));
const ihMatCount = no => ihMats().filter(m => m.no === no).length;

/* 継承の素材に出す武将（2026-09-27）。
   もとは「重ねが残っている子ぜんぶ」だった。40体を超えると探せないので、
   位・渡せる特技の属性・◆の3つで絞る。属性は犬ではなく**技**のほうを見る */
function ihList(c) {
  const rar = S.ihRar || 'すべて';
  const el2 = S.ihElem || 'すべて';
  return P.own.filter(no => matLeft(no, c.no) > 0).filter(no => {
    const o = charOf(no); if (!o) return false;
    if (rar !== 'すべて' && o.rarity !== rar) return false;
    if (el2 === 'すべて' && !S.ihUniq) return true;
    const gs = givableOf(o);
    if (S.ihUniq && !gs.some(g => g.uniq && canInherit(c, g))) return false;
    if (el2 === 'すべて') return true;
    return gs.some(g => (g.sk.element || '共通') === el2);
  });
}

function screenInherit() {
  const c = inhTarget();
  if (!c) return { body: el('div', {}, el('p', { class: 'note' }, 'まだ武将がいない')), nav: true };
  const slots = slotsOf(c);
  const src = S.ihsrc != null ? charOf(S.ihsrc) : null;
  const giv = src ? givableOf(src).map(g => ({ ...g, from: src.no })) : [];
  if (src && (S.ihg == null || S.ihg >= giv.length)) S.ihg = 0;
  const g = src ? giv[S.ihg] : null;
  const ok = g ? canInherit(c, g) : false;
  // 空きがあればそこ、無ければ二の枠。一の枠（固有）も選べる
  const firstFree = [0, 1, 2].find(i => !slots[i]);
  const slot = (S.ihslot != null) ? S.ihslot : (firstFree != null ? firstFree : 1);
  const mats = ihMats();
  const icharm = S.ihch || null;
  const rate = g && ok && mats.length ? inhRate(c, g, mats.length, icharm) : 0;
  const left = src ? matLeft(src.no, c.no) - mats.length : 0;
  return {
    body: el('div', {},
      S.gpop ? null :
      el('button', { class: 'ghost back', onclick: () => { S.ihm = []; S.ihsrc = null; S.ihch = null; S.gpop = false; S.screen = 'grow'; SFX.pick(); draw(); } }, '← 育成へ'),
      // 継ぐ先の武将を先にえらぶ（2026-09-29）
      growPickPage('cnt', no => { S.ihc = no; S.ihslot = null; S.ihm = []; S.ihch = null; S.ihMsg = ''; }),
      !S.gpop ? null : growPop(() => { S.gpop = false; SFX.pick(); draw(); },
      el('div', { class: 'card2 growbox' },
        /* 題も注意書きも出さない（2026-09-25）。
           枠を押せば入る、埋まっていれば上書きされる ── 押せば分かることは書かない */
        // いまの3枠
        el('div', { class: 'sklist' }, [0, 1, 2].map(i => {
          const x = slots[i];
          const own = x && x.own;                 // 元からの固有◆
          return el('button', {
            class: 'skrow' + (i === slot ? ' on' : '') + (x ? '' : ' empty') + (own ? ' ownuniq' : ''),
            onclick: () => { S.ihslot = i; S.ihMsg = ''; SFX.pick(); draw(); },
          },
            el('div', { class: 'skhd' },
              el('b', {}, x ? x.sk.name : `${'一二三'[i]}の枠（空き）`),
              el('span', { class: 'sklv' },
                own ? '固有◆' : x ? (x.uniq ? '継いだ◆' : `Lv.${skillLvOf(c.no)[i]}`) : 'あき')),
            x ? el('span', { class: 'sktx' }, x.sk.text)
              : el('span', { class: 'sktx' }, 'ここに継げば、特技がひとつ増える'));
        })),

        // 誰から継ぐか
        el('h3', {}, '継承するカードを選んでわん！'),
        /* 絞り込み（2026-09-27）。
           継ぐときに見ているのは「どの犬か」ではなく「どの技がもらえるか」なので、
           位だけでなく**渡せる特技の属性**で絞れるようにした。
           ◆は同じ属性にしか継げないので、「◆が継げる子だけ」の一押しも置く */
        el('div', { class: 'row chapters bagtabs ihf' }, ['すべて', ...RAR].map(r => el('button', {
          class: 'chip' + ((S.ihRar || 'すべて') === r ? ' on' : ''),
          onclick: () => { S.ihRar = r; SFX.pick(); draw(); },
        }, r))),
        el('div', { class: 'row chapters bagtabs ihf attrf' }, ['すべて', ...ATTRS, '共通'].map(a => el('button', {
          class: 'chip' + ((S.ihElem || 'すべて') === a ? ' on' : ''),
          onclick: () => { S.ihElem = a; SFX.pick(); draw(); },
        }, a))),
        el('div', { class: 'row chapters bagtabs ihf' },
          el('button', {
            class: 'chip' + (S.ihUniq ? ' on' : ''),
            onclick: () => { S.ihUniq = !S.ihUniq; SFX.pick(); draw(); },
          }, '◆が継げる子だけ'),
          el('span', { class: 'ihcount' }, `${ihList(c).length} 体`)),
        el('div', { class: 'matpick' }, ihList(c).map(no => {
          const o = charOf(no); if (!o) return null;
          return el('button', {
            class: 'mc' + (S.ihsrc === no ? ' on' : ''),
            title: `${o.name}　手持ち ${num(cntOf(no))} 枚（長押しでカード）`,
            ...holdCard(o),                             // 長押しでカードを見る（2026-09-24）
            /* 選んだカードが、そのまま素材になる（2026-09-25）。
               「選ぶ」と「足す」を分けていたのが分かりにくさの元だった */
            onclick: () => {
              if (heldJust()) return;
              const same = S.ihsrc === no;
              S.ihsrc = same ? null : no; S.ihg = 0;
              S.ihm = same ? [] : [{ no }];
              S.ihMsg = ''; SFX.pick(); draw();
            },
          }, cardImg(o), rarTag(o.rarity, 'mcr'), el('span', { class: 'mcn' }, matTag(no, c.no, 0)));
        })),
        !P.own.some(no => matLeft(no, c.no) > 0)
          ? noMat('継がせる素材がない',
                  '継承には、特技を渡す武将の「重ね」かカード本体が要る。') : null,

        src ? el('div', {},
          /* 渡す側は「いま枠に入っている3つ」（2026-09-23）。
             その武将が継承で手に入れた特技も、そのまま渡せる。
             渡しても元の武将からは消えない */
          el('h3', {}, `${src.name} の特技（いまの3枠）`),
          el('div', { class: 'sklist' }, giv.map((x, i) => {
            const able = canInherit(c, x);
            return el('button', {
              class: 'skrow' + (i === S.ihg ? ' on' : '') + (able ? '' : ' max')
                + (x.own ? ' ownuniq' : ''),
              onclick: () => { S.ihg = i; S.ihMsg = ''; SFX.pick(); draw(); },
            },
              el('div', { class: 'skhd' },
                el('b', {}, x.sk.name),
                el('span', { class: 'sklv' },
                  x.own ? '固有◆' : x.uniq ? '継いだ◆' : `Lv.${x.lv}`)),
              el('span', { class: 'skst' },
                x.uniq
                  ? (x.sk.element
                      ? (able ? `${x.sk.element} の武将に継げる` : `${x.sk.element} の武将にしか継げない`)
                      : 'この◆は属性が分からず、いまは渡せない')
                  : `${stars(starOf(x.sk.name))}　素材1つで ${INH_RATE_NORMAL}%`),
              el('span', { class: 'sktx' }, x.sk.text));
          })),
          el('p', { class: 'note' },
            'いまその武将が持っている特技なら、継いで手に入れたものでも渡せる。'
            + '渡しても元の武将からは消えない。受け取る側では通常特技は Lv1 から'),
          el('p', { class: 'note' },
            '固有を継承で上書きした武将は、その固有をもう渡せない。'
            + 'また、解雇して手札が0枚になると育てたぶんも継いだ特技も失い、引き直すと元の姿に戻る'),
          el('p', { class: 'note' }, '奥義と大将特性は継げない。特技の伝書は継承には使えない（武将からしか継げない）'),

          /* 護符の選び方を一本にした（2026-09-25）。
             丸札で選ぶ列と「アイテムを使う」が同じことを二通りでやっていて、
             どちらが本物か分からなかった。道具棚から選ぶ形だけを残す。
             添えた護符は、継承を試したときに使い切る（成功しても失敗しても戻らない）。
             ここで消さないのは、選んだだけで画面を離れたときに失わせないため */
          /* 見出しは消した（2026-09-26）。釦の絵がその品を出している */
          icharm
            ? el('div', { class: 'charmon' },
                itemIcon(icharm),
                el('span', { class: 'n' }, icharm),
                el('span', { class: 'v' }, `成功率 +${ITEMS[icharm].luckInh}%`),
                el('button', { class: 'ghost sm', onclick: () => { S.ihch = null; SFX.pick(); draw(); } }, '外す'))
            : useItemBtn('相伝', 'アイテム', INH_CHARMS[2]),
          /* 継げないときは帯にしない（2026-09-25）。
             囲うと押せる釦に見えてしまうので、字だけで伝える。
             ◆の段の下がり方も出さない ── 成功率の数字を見れば分かる */
          !ok
            ? el('p', { class: 'note warn' }, '※ 属性が合わないので継げないわん')
            : el('div', { class: 'ratebar' },
                el('i', { style: `width:${rate}%` }),
                /* 何もしていないときは 0% と出すだけにした（2026-09-25）。
                   「技を伝授してから継ぐ」と書いても何のことか分からない。
                   伝授を押すと 0% が跳ね上がるので、それで伝わる */
                el('b', {}, `継承の成功率 ${rate}%`)),
          /* カード本体を使うことは、押したあとの確かめの札（eatSheet）で
             ちゃんと見せているので、ここには書かない（2026-09-25） */
          S.ihMsg ? el('div', { class: 'shopmsg' }, S.ihMsg) : null,
          )
          : null,

        /* 継承の釦と注意書きは、武将を選ぶ前から出しておく（2026-09-25）。
           下に何があるか見えないと、どこで終わるのか分からない。
           選ぶまでは押せない灰のまま置く */
        artGo('継承', '技を継承する', (ok && mats.length) ? 'ready' : '',
          () => {
            if (eatenCards(mats).length && !S.ihAsk) { S.ihAsk = true; SFX.pick(); draw(); return; }
            const r = inherit(c, slot, g, mats, icharm);
            if (r) { miBump('inh'); if (r.ok) miBump('inhOk'); }   // お役目の数（2026-09-24）
            S.ihm = []; S.ihch = null; S.ihAsk = false;
            if (!r) { S.ihMsg = '素材が足りない'; SFX.pick(); }
            else if (r.ok) {
              S.ihMsg = '';
              /* 誰から誰へ渡ったか、何が失われたかを出す（2026-09-25）。
                 枠の番号は、画面に戻れば見れば分かるので出さない */
              S.win = { title: '特技継承 成功', name: g.sk.name,
                        from: src.name, to: c.name, lost: lostNames(mats) };
              SFX.win();
            } else {
              S.ihMsg = '';
              S.win = { bad: true, title: '特技継承 失敗', name: g.sk.name,
                        note: `${lostNames(mats)} は失われました` };
              SFX.pick();
            }
            draw();
          }, !(ok && mats.length)),
        el('p', { class: 'note warn' }, '※失敗してもキャラとアイテムは戻りません。'),
        S.ihAsk ? eatSheet(eatenCards(mats), () => {
          const r = inherit(c, slot, g, mats, icharm);
          if (r) { miBump('inh'); if (r.ok) miBump('inhOk'); }   // お役目の数（2026-09-24）
          S.ihm = []; S.ihch = null; S.ihAsk = false;
          if (!r) S.ihMsg = '素材が足りない';
          else if (r.ok) { S.ihMsg = ''; S.win = { title: '特技継承 成功', name: g.sk.name,
                            from: src.name, to: c.name, lost: lostNames(mats) }; SFX.win(); }
          else { S.ihMsg = ''; S.win = { bad: true, title: '特技継承 失敗', name: g.sk.name,
                  note: `${lostNames(mats)} は失われました` }; SFX.pick(); }
          draw();
        }, () => { S.ihAsk = false; draw(); }) : null)),
    ),
    nav: true,
  };
}
/* ---- ショップ（2026-09-21） ----
   常設の「蔵」はいつでも買える。「振り売り」は日替わりで3品だけ、
   2〜4割安いかわりに1日ひとつずつ。日付から決め打ちなので端末が変わっても同じ品が並ぶ。 */
const SHOP_TABS = [
  { key: 'furi', name: '振り売り', note: '今日だけの安売り。ひとつずつ' },
  { key: 'kura', name: '蔵', note: 'いつでも買える品' },
  { key: 'awake', name: '具足屋', note: '覚醒に要る具足と軍配。属性ごとに別の品が要る' },
  { key: 'rank',  name: '番付の蔵', note: '軍功と引き換える。番付でしか手に入らぬ品' },
  /* 「持ち物」の棚は外した（2026-09-26）。三本線の「所持アイテム」（袋）で
     同じものが見られるうえ、買う棚と持ち物の棚が並ぶと どちらを見ているのか紛れる */
];
function itemIcon(name) {
  const it = ITEMS[name] || {};
  const mark =
    it.badge != null ? '木鉄金'[it.badge]       // 軍配は段を出す。属性は色と隅の字で見せる
    : it.attr ? it.attr[0]                     // 猛・智・守・仁・神
    : it.free ? '無'
    : it.ticket ? '祭'
    : it.weather ? it.weather
    : it.inBattle ? '薬'
    : it.food ? '糧'
    : it.costUp ? '陣'
    : it.luck ? '符'
    : it.luckInh ? '継'
    : it.skill ? '技'
    : '書';
  const tone = it.attr ? 'a' + it.attr : it.free ? 'a無銘' : it.badge != null ? 'a軍配'
    : it.weather ? 'w' + it.weather : it.ticket ? 'a祭' : '';
  /* 軍配は属性ごとに名が分かれたが（2026-09-23）、絵はまだ段ごとの1枚しかない。
     専用の絵が無ければ段の絵を借り、属性は枠の色と隅の一字で見分ける。 */
  const own = itemUrl(name);
  const u = own || (it.badge != null ? itemUrl(BADGES[it.badge]) : null);
  /* 属性ごとの絵が置かれたら、隅の一字は要らなくなるので自動で消える */
  const borrowed = it.badge != null && !own;
  return el('span', { class: 'itic k' + (it.kind || '') + (tone ? ' ' + tone : '') + (u ? ' art' : '') },
    u ? el('img', { src: u, alt: name }) : mark,
    borrowed ? el('em', { class: 'iat' }, it.attr[0]) : null);
}
/* gearCell（覚醒の具足の升目）は消した（2026-09-26）。
   ショップの「持ち物」の棚をやめたので、使い道が無くなった。
   同じものは 三本線 →所持アイテム →覚醒 の棚で見られる */
/* 小判はヘッダーから外したので、ショップの上で大きく見せる（2026-09-22）。
   軍功も同じ並びに入れた（2026-09-26）。番付の蔵だけ別の書き方だと、
   同じ「持っているもの」なのに見え方がそろわない */
function kobanRow() {
  return el('div', { class: 'wallet' },
    coin('koban', '判', '小判', P.koban, true),
    coin('soul', '魂', '武士の魂', P.soul, true),
    coin('gun', '功', '軍功', P.gun || 0, true, CUR_ART.gun));
}
function shopBuy(name, price, n, kind) {
  return () => {
    const r = kind === 'deal' ? buyDeal(name) : buyItem(name, n);
    if (r) { miBump('buy'); SFX.coin(); S.shopMsg = `${name} を ${r.n} つ手に入れた（小判 ${num(r.cost)}）`; }   // お役目の数（門出・2026-09-26）
    else { SFX.pick(); S.shopMsg = '小判が足りない'; }
    draw();
  };
}
/* 番付の蔵の品の絵（2026-09-29）。
   これまで魂・称号・武将だけ一字の札だったが、どれも絵はもう置いてある。
   魂＝coin_魂／肩書き＝その称号の額／武将＝コマ絵。無ければこれまでどおり一字に落ちる */
function rkShopIcon(g) {
  if (g.kind === 'item') return itemIcon(g.name);
  const art = g.kind === 'soul' ? uiUrl('coin_魂')
            : g.kind === 'title' ? frameUrl(g.name)
            : (pawnUrl(g.no) || faceUrl(g.no, '通常') || cardArt(charOf(g.no)));
  const mark = g.kind === 'soul' ? '魂' : g.kind === 'title' ? '称' : '将';
  const cls = 'itic k' + mark + (art ? ' art' : '');
  return el('span', { class: cls }, art ? keepImg({ src: art, alt: g.name }) : mark);
}
/* 番付の蔵。軍功で引き換える（2026-09-25）。
   一度きりの品は P.rkBuy に名を控えて、棚から消す */
const rkBought = key => ((P.rkBuy || []).includes(key));
function rkTrade(g) {
  const key = g.kind + ':' + g.name;
  if ((P.gun || 0) < g.price) { S.shopMsg = '軍功が足りぬ'; SFX.pick(); draw(); return; }
  if (g.once && rkBought(key)) return;
  P.gun -= g.price;
  let word = '';
  if (g.kind === 'item') { P.items[g.name] = (P.items[g.name] || 0) + g.n; word = `${g.name} ×${g.n}`; }
  else if (g.kind === 'soul') { P.soul += g.n; word = `武士の魂 ${num(g.n)}`; }
  else if (g.kind === 'title') { gainTitle(g.name); word = `称号「${g.name}」`; }
  else if (g.kind === 'char') {
    if (!P.own.includes(g.no)) P.own.push(g.no);
    setCnt(g.no, cntOf(g.no) + 1);
    word = `${g.name} を召し抱えた`;
  }
  if (g.once) { P.rkBuy = [...(P.rkBuy || []), key]; }
  savePlayer();
  SFX.win(); S.shopMsg = `${word}（軍功 ${num(g.price)}）`; draw();
}

function screenShop() {
  // 無くなった棚（持ち物）を開いたままだと空になるので、先頭に戻す（2026-09-26）
  const tab = SHOP_TABS.some(t => t.key === S.shopTab) ? S.shopTab : (S.shopTab = SHOP_TABS[0].key);
  const deals = dailyDeals();
  return {
    body: el('div', {},
      /* 入口がホームに移ったので、戻り先も城へ（2026-09-26） */
      el('button', { class: 'ghost back', onclick: () => { S.shopMsg = ''; S.screen = 'home'; SFX.pick(); draw(); } }, '← 城へ'),
      kobanRow(),
      el('div', { class: 'row chapters' }, SHOP_TABS.map(t => el('button', {
        class: 'chip' + (tab === t.key ? ' on' : ''),
        onclick: () => { S.shopTab = t.key; S.shopMsg = ''; SFX.pick(); draw(); },
      }, t.name))),
      el('p', { class: 'note' }, (SHOP_TABS.find(t => t.key === tab) || {}).note),
      S.shopMsg ? el('div', { class: 'shopmsg' }, S.shopMsg) : null,

      tab === 'furi' ? el('div', { class: 'shoplist' },
        deals.map(d => {
          const it = ITEMS[d.name];
          const done = dealBought(d.name);
          return el('div', { class: 'shoprow' + (done ? ' done' : '') },
            itemIcon(d.name),
            el('div', { class: 'sitm' },
              el('b', {}, d.name, el('span', { class: 'off' }, `${d.off}%引`)),
              el('span', { class: 'sd' }, it.desc),
              el('span', { class: 'sp2' }, el('s', {}, num(it.price)), ` 小判 ${num(d.price)}`)),
            el('button', {
              class: 'go sm', disabled: (done || P.koban < d.price) ? true : null,
              onclick: shopBuy(d.name, d.price, 1, 'deal'),
            }, done ? '買った' : '買う'));
        }),
        el('p', { class: 'note' }, '振り売りは日付が変わると入れ替わる')) : null,

      tab === 'rank' ? el('div', {},
        el('div', { class: 'shoplist' }, RK_SHOP.map(g => {
          const key = g.kind + ':' + g.name;
          const done = g.once && rkBought(key);
          const poor = (P.gun || 0) < g.price;
          return el('div', { class: 'shoprow' + (done ? ' done' : '') },
            rkShopIcon(g),
            el('div', { class: 'sitm' },
              el('b', {}, g.kind === 'item' ? `${g.name} ×${g.n}` : g.kind === 'soul' ? `武士の魂 ${num(g.n)}` : g.name,
                g.once ? el('span', { class: 'off' }, '一度きり') : null),
              el('span', { class: 'sd' }, g.desc),
              el('span', { class: 'sp2' }, `軍功 ${num(g.price)}`)),
            el('button', { class: 'go sm', disabled: (done || poor) ? true : null,
              onclick: () => rkTrade(g) }, done ? '交換済' : '換える'));
        })),
        el('p', { class: 'note' }, '軍功は番付の月末の褒美で手に入るわん')) : null,

      tab === 'kura' ? el('div', {},
        ITEM_KINDS.map(kind => {
          const names = Object.keys(ITEMS).filter(k => ITEMS[k].kind === kind && !ITEMS[k].noShop);
          if (!names.length) return null;
          return el('div', {},
            el('h3', { class: 'shoph' },
              kind === '稽古' ? '稽古の蔵' : kind === '兵糧' ? '兵糧蔵'
              : kind === '編成' ? '陣触れの蔵' : kind === '陣中' ? '陣中の蔵' : '特技の蔵'),
            el('div', { class: 'shoplist' }, names.map(name => {
              const it = ITEMS[name];
              return el('div', { class: 'shoprow' },
                itemIcon(name),
                el('div', { class: 'sitm' },
                  el('b', {}, name, el('span', { class: 'have' }, `持 ${num(item(name))}`)),
                  el('span', { class: 'sd' }, it.desc),
                  el('span', { class: 'sp2' }, `小判 ${num(it.price)}`)),
                el('div', { class: 'sbtns' },
                  el('button', {
                    class: 'go sm', disabled: P.koban < it.price ? true : null,
                    onclick: shopBuy(name, it.price, 1),
                  }, '×1'),
                  el('button', {
                    class: 'go sm', disabled: P.koban < it.price * 10 ? true : null,
                    onclick: shopBuy(name, it.price, 10),
                  }, '×10')));
            })));
        }),
        el('h3', { class: 'shoph' }, '魂の市'),
        el('div', { class: 'shoplist' },
          el('div', { class: 'shoprow' },
            /* 魂にも絵を出す（2026-09-30）。番付の蔵と同じ coin_魂 を使う。
               絵が無ければ これまでどおり「魂」の一字に落ちる */
            (() => { const a = uiUrl('coin_魂');
              return el('span', { class: 'itic k魂' + (a ? ' art' : '') },
                a ? keepImg({ src: a, alt: '武士の魂' }) : '魂'); })(),
            el('div', { class: 'sitm' },
              el('b', {}, `武士の魂 ${num(SOUL_PACK.n)}`),
              el('span', { class: 'sd' }, '武将強化の「魂を振る」で使う'),
              el('span', { class: 'sp2' }, `小判 ${num(SOUL_PACK.price)}`)),
            el('div', { class: 'sbtns' },
              el('button', {
                class: 'go sm', disabled: P.koban < SOUL_PACK.price ? true : null,
                onclick: () => { const r = buySoul(1); if (r) { miBump('buy'); SFX.win(); S.shopMsg = `武士の魂を ${num(r.n)} 手に入れた`; } else { SFX.pick(); S.shopMsg = '小判が足りない'; } draw(); },
              }, '×1'),
              el('button', {
                class: 'go sm', disabled: P.koban < SOUL_PACK.price * 10 ? true : null,
                onclick: () => { const r = buySoul(10); if (r) { miBump('buy'); SFX.win(); S.shopMsg = `武士の魂を ${num(r.n)} 手に入れた`; } else { SFX.pick(); S.shopMsg = '小判が足りない'; } draw(); },
              }, '×10')))) ) : null,

      tab === 'awake' ? (() => {
        const pick = S.shopAttr || ATTRS[0];
        const names = pick === '共通'
          ? [0, 1, 2].map(t => freeMat(t))
          : [0, 1, 2].map(r => badgeMat(pick, r));
        return el('div', {},
          el('div', { class: 'row chapters attrpick' }, ATTRS.concat('共通').map(a => el('button', {
            class: 'chip' + (pick === a ? ' on' : ''),
            onclick: () => { S.shopAttr = a; S.shopMsg = ''; SFX.pick(); draw(); },
          }, a))),
          el('div', { class: 'shoplist' }, names.map(name => {
            const it = ITEMS[name];
            return el('div', { class: 'shoprow' },
              itemIcon(name),
              el('div', { class: 'sitm' },
                el('b', {}, name, el('span', { class: 'have' }, `持 ${num(item(name))}`)),
                el('span', { class: 'sd' }, it.desc),
                el('span', { class: 'sp2' }, `小判 ${num(it.price)}`)),
              el('div', { class: 'sbtns' },
                el('button', {
                  class: 'go sm', disabled: P.koban < it.price ? true : null,
                  onclick: shopBuy(name, it.price, 1),
                }, '×1'),
                el('button', {
                  class: 'go sm', disabled: P.koban < it.price * 5 ? true : null,
                  onclick: shopBuy(name, it.price, 5),
                }, '×5')));
          })),
          el('p', { class: 'note' },
            pick === '共通'
              ? '無銘の籠手・具足・兜は、どの武将の覚醒にも数を積む品。属性は問わない'
              : `${pick}の武将の覚醒に要る芯。木 → 鉄 → 金 の順に、段が上がるほど少数で効く`));
      })() : null,

    ),
    nav: true,
  };
}

function screenSquads() {
  return {
    body: el('div', {},
      el('button', { class: 'ghost back', onclick: () => { S.screen = 'grow'; SFX.pick(); draw(); } }, '← 育成へ'),
      el('p', { style: 'font-size:11px;color:var(--text3);margin:-4px 0 8px' },
        '編成・陣形・配置をまとめて5つまで保存できる。選んでから「編成する」'),
      el('div', { class: 'sqlist' }, P.squads.map((sq2, i) => squadCard(sq2, i, null, true))),
      /* 下にも戻り道を置いた（2026-09-28）。
         上の「← 育成へ」まで指を伸ばさずに戻れる。主の釦との幅は 1:3 */
      el('div', { class: 'footrow' },
        el('button', {
          class: 'ghost bk',
          onclick: () => { S.screen = 'grow'; SFX.pick(); draw(); },
        }, 'もどる'),
        el('button', {
          class: 'go big',
          onclick: () => { S.screen = 'team'; draw(); },
        }, '編成する'))),
    nav: true,
  };
}

/* ---------------- 図鑑 ---------------- */
/* 並べ替え（2026-09-27）。100体そろうと位と属性だけでは探せないので、
   出陣コスト・手持ちの枚数・総合力でも並べられるようにした。
   同じ札をもう一度押すと 昇り／降り が入れ替わる。
   ふだんは番号順（図鑑は番号で覚えるものなので、これを基本にする）。
   up は「その並びで最初に出したい向き」＝ 番号は小さい順、ほかは大きい順 */
/* ---- 武将をえらぶ画面の絞込み（2026-09-30）----
   編成・育成・特技えらび・図鑑で、同じ札・同じ並びにそろえた。
   前は画面ごとに「位だけ」「位と属性だけ」とばらばらで、
   編成では出陣の重さで絞れず、5人の枠をやりくりしにくかった。
   どの箱に覚えておくかは呼ぶ側が渡す（画面ごとに絞込みを別に覚えたいため） */
/* 並びの名は、遊ぶ人が札の上で見ている言葉にそろえた（2026-09-30）。
   「位」は絞込みの行と紛らわしいので「レア」、出陣の重さは札に刷ってある通り「コスト」 */
const DEXSORT = [
  { k: 'rar',  name: 'レア',   up: false, v: c => -RAR.indexOf(c.rarity) },
  { k: 'no',   name: 'No.',    up: true,  v: c => c.no },
  { k: 'cost', name: 'コスト', up: false, v: c => c.cost || 0 },
  /* 「手持ち」の並びは外した（2026-09-30）。
     図鑑が持っている武将だけを出すようになったので、重ねの枚数で並べる意味が薄い。
     古い保存に 'cnt' が残っていても、見つからなければ先頭（レア）に落ちる */
  { k: 'pow',  name: '総合力', up: false, v: c => powerOf(c) },
];
const pfGet = (ks, k, d) => { const v = ks[k] ? S[ks[k]] : null; return v == null ? d : v; };
const pfSet = (ks, k, v) => { if (ks[k]) S[ks[k]] = v; SFX.pick(); draw(); };
/* 絞込みを当てて、並べ替えて返す */
function pickApply(list, ks, opt) {
  const rar = pfGet(ks, 'rar', 'すべて');
  const att = pfGet(ks, 'att', 'すべて');
  const out = list.filter(c =>
    (rar === 'すべて' || c.rarity === rar) &&
    (att === 'すべて' || c.attr === att));
  const so = DEXSORT.find(x => x.k === pfGet(ks, 'sort', (opt && opt.sort0) || 'rar')) || DEXSORT[0];
  const up = pfGet(ks, 'asc', null) == null ? so.up : !!pfGet(ks, 'asc', null);
  return out.sort((a, b) => { const d = so.v(a) - so.v(b); return (up ? d : -d) || a.no - b.no; });
}
const pfRow = (lb, kids, extra) =>
  el('div', { class: 'row chapters pfrow' + (extra ? ' ' + extra : '') },
    el('span', { class: 'sortlb' }, lb), kids);
/* 絞込みの札の並び（位・属性・並び）。図鑑でずっと使っていた三つにそろえた（2026-09-30） */
function pickRows(ks, opt) {
  const rar = pfGet(ks, 'rar', 'すべて');
  const att = pfGet(ks, 'att', 'すべて');
  const so  = DEXSORT.find(x => x.k === pfGet(ks, 'sort', (opt && opt.sort0) || 'rar')) || DEXSORT[0];
  const up  = pfGet(ks, 'asc', null) == null ? so.up : !!pfGet(ks, 'asc', null);
  return [
    pfRow('位', ['すべて', ...RAR].map(r => el('button', {
      class: 'chip' + (rar === r ? ' on' : '') + (r !== 'すべて' && rarUrl(r) ? ' ric' : ''),
      onclick: () => pfSet(ks, 'rar', r),
    }, r === 'すべて' ? 'すべて' : rarTag(r)))),
    pfRow('属性', ['すべて', ...ATTRS].map(a => el('button', {
      class: 'chip' + (att === a ? ' on' : '') + (a !== 'すべて' && attrUrl(a) ? ' aic' : ''),
      onclick: () => pfSet(ks, 'att', a),
    }, a === 'すべて' ? 'すべて' : attrTag(a, 'sm'))), 'attrf'),
    pfRow('並び', DEXSORT.map(x => el('button', {
      class: 'chip' + (so.k === x.k ? ' on' : ''),
      title: so.k === x.k ? 'もう一度押すと向きが変わる' : null,
      onclick: () => {
        if (so.k === x.k) S[ks.asc] = !up;
        else { S[ks.sort] = x.k; S[ks.asc] = x.up; }
        SFX.pick(); draw();
      },
    }, x.name, so.k === x.k ? el('i', { class: 'sar' }, up ? '▲' : '▼') : null))),
  ];
}
const PF_DEX  = { rar: 'filter', att: 'afilter', sort: 'dexSort', asc: 'dexAsc' };
const PF_TEAM = { rar: 'filter', att: 'tattr',   sort: 'tsort',   asc: 'tasc' };
const PF_GROW = { rar: 'cpRar',  att: 'cpAttr',  sort: 'cpSort',  asc: 'cpAsc' };
function screenDex() {
  /* 位と属性は「かつ」で重ねて当たる。並びは、その絞り込んだ中での順番。
     図鑑だけは 未奉公の札も出す（2026-09-30）。
     「何が残っているか」を見に来る画面なので、まだ見ぬ者が並んでいてよい。
     編成・育成・特技えらびは もとから持っている武将しか並ばない */
  const sorted = pickApply(C, PF_DEX, { sort0: 'no' });
  const list = sorted;
  const got = list.filter(c => owns(c.no)).length;
  return {
    body: el('div', {},
      el('h2', {}, `図鑑（${P.own.length}/${C.length}）`,
        el('span', { class: 'sub2' }, `　手持ち ${num(P.own.reduce((a, n) => a + cntOf(n), 0))} 枚`)),
      pickRows(PF_DEX, { sort0: 'no' }),
      el('p', { style: 'font-size:11px;color:var(--text3);margin:6px 0 8px' },
        `この絞り込みでは ${got}/${list.length} 体`),
      el('div', { class: 'dex' }, sorted.map(c => {
        const has = owns(c.no);
        // まだ手に入れていない武将は「未奉公」の共通カード（2026-09-21）
        const card = has ? cardArt(c) : unknownCardUrl('front');
        return el('button', {
          class: 'dc' + (has ? '' : ' no yet') + (card ? ' card art' : ''),
          onclick: () => { openCard(has ? c : UNKNOWN); },
        },
          card ? (has ? cardImg(c) : el('img', { class: 'cf', src: card, alt: '未奉公', loading: 'lazy' }))
               : el('span', { class: 'f', style: has ? chipStyle(c) : '' }, has ? null : el('i', {}, '？')),
          // 素材にカード本体も使えるようになったので、持っている枚数を出す（2026-09-21）
          has ? el('span', { class: 'own' + (cntOf(c.no) ? '' : ' zero') }, `×${num(cntOf(c.no))}`) : null,
          card ? null : el('span', { class: 'n' }, has ? c.name.slice(0, 6) : '未奉公'),
          card ? null : rarTag(c.rarity, 'sm'));
      }))),
    nav: true,
  };
}
// ステータス名のラベル。素材があれば絵を添える（2026-09-21）
function statLabel(k) {
  const u = statUrl(k);
  return el('span', {}, u ? el('img', { class: 'si', src: u, alt: '' }) : null, k);
}
/* 総合力の行（2026-09-30）。5つの数の合計＝powerOf と同じものさし。
   どこを伸ばしたか見くらべるとき、いちいち足し算させたくないので速さの下に置く */
function totRow(g) {
  const p = SP_STATS.reduce((a, k) => a + (g[k] || 0), 0);
  return el('div', { class: 'tot' }, el('span', {}, '総合力'),
    el('b', {}, num(p)), el('em', { class: 'up' }, ''));
}
/* カードの表裏を並べて見せる（2026-09-21）
   カードに能力も特技も人物紹介も刷ってあるので、開いたらカードそのものを出す。
   どちらかを押すと、そちらを画面いっぱいに広げる。 */
/* 継いだ特技を札の上で描き直す（2026-09-27）。
   焼いた札には元の技が入っているので、
   ① 字のところと絵のところに「まっさらな和紙」を当てて消し、
   ② その上に いまの技の 菱・名・効き目 を描く。
   絵は描き下ろしが無いので、空き枠と同じ薄い金の囲いにしておく。
   長さは cqw（札の幅を 100 とする単位）で持つので、札を大小どちらで出しても崩れない */
const _RICH = /[+-]?\d+(?:\.\d+)?(?:%|倍)/g;
function richText(t) {
  const out = []; let i = 0;
  String(t || '').replace(_RICH, (m, at) => {
    if (at > i) out.push(String(t).slice(i, at));
    out.push(el('em', { class: 'rd' }, m)); i = at + m.length; return m;
  });
  if (i < String(t || '').length) out.push(String(t).slice(i));
  return out;
}
/* 継いだ技の絵（2026-09-27）。
   技そのものの絵が無くても、空っぽの囲いを出すよりはその犬の絵を出したほうがいい。
   カットインと同じ考えで「技の絵」ではなく「その犬が技を出しているところ」と見なす。
   横長のものから順に探し、どれも無ければ薄い囲いだけにする */
function slotArtUrl(no, slot, name) {
  return skillArtUrl(name)
    || cutinArt(no, slot === 0 ? '固有' : '特技')
    || cutinArt(no, '特技') || cutinArt(no, '攻撃') || cutinArt(no, '奥義')
    || heroUrl(no)
    || faceUrl(no, '通常') || cutinUrl(no)
    || null;
}
function redrawSlot(k, patch, t, now, no) {
  const q = v => (v / 864 * 100).toFixed(3) + 'cqw';
  const P2 = v => (v / 864 * 100).toFixed(3) + '%';
  const PY2 = v => (v / 1280 * 100).toFixed(3) + '%';
  const y = k.top + t.row * k.pitch;                 // この枠の上ばし（札の座標）
  const bg = (dx, dy) =>
    `background-image:url(${patch});background-size:${q(k.pw)} ${q(k.ph)};`
    + `background-position:-${q(dx - k.px)} -${q(dy - k.py)};background-repeat:no-repeat`;
  const box = (x, yy, w, h, extra) => el('i', {
    class: 'cwash',
    style: `left:${P2(x)};top:${PY2(yy)};width:${q(w)};height:${q(h)};` + (extra || bg(x, yy)),
  });
  const out = [
    box(k.tx - 6, y, k.rx + 8 - (k.tx - 6), k.pitch - 14),        // 字のところ
    box(k.lx, y + k.barh + 6, k.artw, k.arth),                    // 絵のところ
  ];
  if (!now || !now.sk) {                                          // 空になった枠
    out.push(el('b', {
      class: 'cskn none',
      style: `left:${P2(k.tx)};top:${PY2(y + 32)};font-size:${q(19)}`,
    }, '― 空き　継いで埋められる ―'));
    return out;
  }
  // 技の絵。描き下ろしが無ければ その犬の絵を借りる（2026-09-27）
  const art = slotArtUrl(no, t.slot, now.sk.name);
  out.push(el(art ? 'img' : 'i', {
    class: art ? 'cskimg' : 'cskart', ...(art ? { src: art, alt: '' } : {}),
    style: `left:${P2(k.lx)};top:${PY2(y + k.barh + 6)};width:${q(k.artw)};height:${q(k.arth)}`,
  }));
  // 技名。あたまの (属性) は菱の絵にする。(共通) は絵が無いので字ごと落として詰める
  const raw = now.sk.name || '';
  const m = /^\(([^)]*)\)\s*/.exec(raw);
  const core = m ? raw.slice(m[0].length) : raw;
  const mark = m && attrUrl(m[1]) ? m[1] : null;
  if (mark) out.push(el('img', {
    class: 'cskd', src: attrUrl(mark), alt: mark,
    style: `left:${P2(k.tx)};top:${PY2(y + 1)};width:${q(32)};height:${q(32)}`,
  }));
  out.push(el('b', {
    class: 'cskn',
    style: `left:${P2(k.tx + (mark ? 38 : 0))};top:${PY2(y + 2)};font-size:${q(k.name)}`,
  }, core));
  out.push(el('span', {
    class: 'cskt',
    style: `left:${P2(k.tx)};top:${PY2(y + k.toptxt)};width:${q(k.tw)};`
      + `font-size:${q(k.body)};line-height:${q(k.lh)}`,
  }, ...richText(now.sk.text || '')));
  return out;
}
/* 札の表に「いまの数値」を重ねる（2026-09-27 の仕掛けを 2026-09-30 に切り出した）。
   焼いた札には、育てば変わる数が入っていない。置き場所は札ごとの layout に控えてある。
   ro（読むだけ）のときと、まだ持っていない武将は、素の数値をそのまま出す。
   重ねる側の箱に container-type:inline-size が要る（cqw を物差しにしているため） */
/* 役割の箱に射程を足す（2026-09-30）。
   焼いた札には射程が入っていない。110枚を焼き直すのは重いので、
   箱の中だけ塗りつぶして書き直す。
   枠はどの札も同じ型なので、置き場所は一組で足りる（864×1280 の目盛りで実測）。
     見出しの濃い帯 … x 252-534 / y 1126-1149、地の色 rgb(20,18,14)
     中身のクリーム … x 252-534 / y 1155-1194、地の色 rgb(251,248,235)
   塗るのは枠の内側だけ。金の縁には かからない */
const ROLE_BOX = {
  lb: { x: 255, y: 1127, w: 277, h: 22, bg: '#131110', fg: '#efe2c4', size: 19 },
  /* 紙は上がわずかに温かく、下がわずかに白い。実測の色でうすい階調をかけて継ぎ目を消す */
  vl: { x: 254, y: 1156, w: 279, h: 37, fg: '#241e18', size: 29,
        bg: 'linear-gradient(#fbf5e5,#fcf8ed)' },
};
function cardStatOverlay(c, ro) {
  if (!c || c.no == null || c.no === '未奉公') return [];
  const lay = cardLayout(c.no);
  if (!lay || !lay.stat) return [];
  const pc = (v, base) => (v / base * 100).toFixed(3) + '%';
  const fs = v => (v / 864 * 100).toFixed(3) + 'cqw';
  const g = (!ro && P.own.includes(c.no)) ? grownStats(c) : (c.stats || {});
  const out = lay.stat.map(t => el('b', {
    class: 'clv num',
    style: `left:${pc(t.cx, 864)};top:${pc(t.cy, 1280)};font-size:${fs(t.size)}`,
  }, String(g[t.k] ?? (c.stats || {})[t.k] ?? 0)));   // 札はカンマを打たない
  /* 射程が分かる子だけ書き換える。無ければ焼いたままの「役割」で通す */
  if (c.range != null && c.role) {
    /* 役割の名は「万能・軍団指揮」のように長い子がいる。
       箱の内のり（277）に収まるよう、字数で大きさを落とす（2026-09-30） */
    const fit = (t, txt) => {
      const n = [...txt].length;
      return Math.min(t.size, Math.floor((t.w - 14) / n));
    };
    const put = (t, txt) => [
      el('i', { class: 'crolebg',
        style: `left:${pc(t.x, 864)};top:${pc(t.y, 1280)};`
             + `width:${pc(t.w, 864)};height:${pc(t.h, 1280)};background:${t.bg}` }),
      el('b', { class: 'clv crole',
        style: `left:${pc(t.x + t.w / 2, 864)};top:${pc(t.y + t.h / 2, 1280)};`
             + `font-size:${fs(fit(t, txt))};color:${t.fg}` }, txt),
    ];
    out.push(...put(ROLE_BOX.lb, '役割 ／ 射程'), ...put(ROLE_BOX.vl, `${c.role} ／ ${c.range}`));
  }
  return out;
}
function cardSheet(c) {
  const un = c.no === '未奉公';
  const fr = un ? unknownCardUrl('front') : cardUrl(c.no, 'front');
  const bk = un ? unknownCardUrl('back') : cardUrl(c.no, 'back');
  const zoom = S.side;
  const close = () => { S.detail = null; S.side = null; S.detailRO = false; draw(); };
  /* 焼いた札には、育てば変わる数（升の数値・特技の位）が入っていない（2026-09-27）。
     いま持っている値をその場で重ねるので、強化しても継承しても札がすぐ追いつく。
     置き場所は札ごとに layout に控えてある。無い札はこれまでどおり焼いた数が出る */
  const live = side => {
    const lay = un ? null : cardLayout(c.no);
    if (!lay) return [];
    const pc = (v, base) => (v / base * 100).toFixed(3) + '%';
    const fs = v => (v / 864 * 100).toFixed(3) + 'cqw';
    const out = [];
    if (side === 'front') out.push(...cardStatOverlay(c, S.detailRO));
    if (side === 'back' && lay.slot) {
      /* 特技の枠は3つ。焼いてあるのは元の技なので、継承で中身が入れ替わった枠だけ
         和紙で塗りつぶして描き直す（2026-09-27）。
         塗る紙は、字を入れる前に切っておいた同じ札の和紙なので継ぎ目が出ない。
         枠どうしの入れ替えも、枠ごとに「焼いた技名」と今の技名を見くらべるので拾える。
         一の枠（固有◆）に位は無く、空いている枠にも出さない */
      const sl = slotsOf(c);
      const sk = (!S.detailRO && P.own.includes(c.no)) ? skillLvOf(c.no) : [1, 1, 1];
      const k = lay.sk, patch = k ? cardPatchUrl(c.no) : null;
      const mine2 = !S.detailRO && P.own.includes(c.no);
      for (const t of lay.slot) {
        const now = mine2 ? sl[t.slot] : null;
        const nm = now && now.sk ? now.sk.name : null;
        /* 自分の持ち物でないとき（敵の札・図鑑の読むだけ）は塗り直さない（2026-09-30）。
           焼いてある元の技がそのまま正しいのに、
           「いまの技が無い＝空き」とみなして元の技まで消していた。
           合戦中に敵の札を開くと、明智ミツワンの特技が三つとも「空き」になっていたのはこれ */
        const moved = mine2 && patch && t.row != null && nm !== (t.baked || null);
        if (moved) out.push(...redrawSlot(k, patch, t, now, c.no));
        if (t.slot && (moved ? now : sl[t.slot])) out.push(el('b', {
          class: 'clv lv',
          style: `left:${pc(t.x, 864)};top:${pc(t.y, 1280)};font-size:${fs(t.size)}`,
        }, `Lv.${sk[t.slot] || 1}/3`));
      }
    }

    return out;
  };
  /* 札は開いたら いきなり大きく（2026-09-30）。
     前は小さい2枚が出て、特技を読むまでに「開く→押す」の二手かかっていた。
     ・押す … 閉じる
     ・横に払う／左右の矢印 … 表と裏を入れかえる
     得意苦手の帯は札の絵に刷ってあるので出さない */
  const side = (S.side === 'back' && bk) ? 'back' : 'front';
  const flip = e => {
    if (e) e.stopPropagation();
    if (!bk) return;
    S.side = side === 'front' ? 'back' : 'front';
    SFX.pick(); draw();
  };
  const card = el('button', { class: 'cdc zoom' },
    el('img', { src: side === 'front' ? fr : bk, alt: c.name, draggable: false }),
    ...live(side));
  /* 横に払って裏返す。30px 動いたら「払った」とみなし、そのあとの押しは殺す */
  let sw = null;
  card.addEventListener('pointerdown', e => { sw = { x: e.clientX, y: e.clientY, on: false }; });
  card.addEventListener('pointermove', e => {
    if (!sw || sw.on) return;
    const dx = e.clientX - sw.x, dy = e.clientY - sw.y;
    if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) { sw.on = true; flip(); }
  });
  for (const t of ['pointerup', 'pointercancel', 'pointerleave'])
    card.addEventListener(t, () => { if (sw && sw.on) setTimeout(() => { sw = null; }, 0); else sw = null; });
  card.onclick = e => { e.stopPropagation(); if (sw && sw.on) return; close(); };

  const mine = !un && !S.detailRO && P.own.includes(c.no);
  const goto = (screen, set) => e => {
    e.stopPropagation();
    set(); S.detail = null; S.side = null; S.screen = screen; SFX.pick(); draw();
  };
  const arw = dir => el('button', {
    class: 'cdarw ' + dir, title: side === 'front' ? '裏を見る' : '表を見る', onclick: flip,
  }, dir === 'l' ? '‹' : '›');
  return el('div', { class: 'sheet cards one', onclick: () => { if (heldJust()) return; close(); } },
    el('div', { class: 'cardwrap zoomed', onclick: e => e.stopPropagation() },
      bk ? arw('l') : null, card, bk ? arw('r') : null,
      bk ? el('div', { class: 'cddots' },
        el('i', { class: side === 'front' ? 'on' : '' }),
        el('i', { class: side === 'back' ? 'on' : '' })) : null),
    mine ? el('div', { class: 'cardgo row4', onclick: e => e.stopPropagation() },
      el('button', { class: 'go xs', disabled: hasCard(c.no) ? null : true, onclick: goto('power', () => { S.grow = c.no; S.sp = null; S.spEdit = null; }) }, '武将強化'),
      el('button', { class: 'go xs', disabled: hasCard(c.no) ? null : true, onclick: goto('skillup', () => { S.skc = c.no; S.sks = 0; S.skm = []; S.skch = null; S.skMsg = ''; }) }, '特技強化'),
      el('button', { class: 'go xs', disabled: hasCard(c.no) ? null : true, onclick: goto('inherit', () => { S.ihc = c.no; S.ihslot = null; S.ihm = []; S.ihsrc = null; S.ihMsg = ''; }) }, '特技継承'),
      // 重複の使い道は「継承」「強化」「売って魂」の3つ。売るのは重ねだけで、本体は減らない
      el('button', {
        class: 'go xs danger',
        onclick: e => { e.stopPropagation(); S.fire = c.no; S.fireN = 1; draw(); },
      }, '武将解雇')) : null,
    el('p', { class: 'cardhint', onclick: close },
      bk ? '札を押すと閉じる　／　横に払うと裏' : '札を押すと閉じる'));
}
function dexDetail(c) {
  if (!c) return null;
  if (cardArt(c)) return cardSheet(c);
  const st = c.stats || {};
  const row = (k, v) => el('div', {}, statLabel(k), el('b', {}, v ?? '―'));
  return el('div', { class: 'sheet', onclick: e => {
    if (heldJust()) return;                       // 長押しで開いた直後の click では閉じない
    if (e.target.classList.contains('sheet')) { S.detail = null; draw(); }
  } },
    el('div', { class: 'card2' },
      el('div', { class: 'top' },
        el('div', { class: 'f', style: chipStyle(c) }),
        el('div', {},
          el('b', {}, c.name),
          el('div', { class: 'meta' },
            attrTag(c.attr), rarTag(c.rarity),
            el('span', {}, `コスト ${c.cost}`)))),
      el('div', { class: 'sts' },
        /* 兵量は札ごとに持っていない（10,000を部隊で分け合う決まり）。
           数が無いのに「0」と出て壊れて見えたので、無いときは行ごと出さない（2026-09-28） */
        (st.兵量 ?? c.hp) != null ? row('兵量', num(st.兵量 ?? c.hp)) : null,
        row('火力', st.火力), row('賢さ', st.賢さ),
        row('防御', st.防御), row('回復', st.回復), row('速さ', st.速さ),
        /* 総合力（2026-09-30）。ここは素の数なので grownStats ではなく stats から足す */
        el('div', { class: 'tot wide' }, el('span', {}, '総合力'),
          el('b', {}, num(SP_STATS.reduce((a, k) => a + (st[k] || 0), 0))))),
      c.ultimate ? el('div', { class: 'sk' }, el('span', { class: 'lb ult' }, '奥義'),
        el('b', {}, c.ultimate.name), el('p', {}, c.ultimate.text || '')) : null,
      /* 焼いた札が無いときの見せかた（2026-09-28）。
         札の絵が無い武将は、ここが唯一の中身の出どころになる。
         c.skills は今のデータに無いので、固有と通常特技も並べる */
      ((c.unique && c.unique.name) ? [c.unique] : []).map(k => el('div', { class: 'sk' },
        el('span', { class: 'lb' }, '固有'), el('b', {}, k.name), el('p', {}, k.text || ''))),
      (c.normals || []).map(k => el('div', { class: 'sk' }, el('span', { class: 'lb' }, '特技'),
        el('b', {}, k.name), el('p', {}, k.text || ''))),
      c.generalTrait ? el('div', { class: 'sk' }, el('span', { class: 'lb' }, '大将'),
        el('b', {}, c.generalTrait.name), el('p', {}, c.generalTrait.text || '')) : null,
      (c.skills || []).map(k => el('div', { class: 'sk' }, el('span', { class: 'lb' }, '特技'),
        el('b', {}, k.name), el('p', {}, k.text || ''))),
      groundRow(c),
      c.note ? el('p', { class: 'flavor' }, c.note) : null,
      P.own.includes(c.no) ? el('div', { class: 'cardgo flat' },
        el('button', { class: 'go sm', disabled: hasCard(c.no) ? null : true, onclick: () => { S.grow = c.no; S.sp = null; S.gpop = true; S.detail = null; S.screen = 'power'; SFX.pick(); draw(); } }, '武将強化'),
        el('button', { class: 'go sm', disabled: hasCard(c.no) ? null : true, onclick: () => { S.skc = c.no; S.sks = 0; S.skm = []; S.skch = null; S.gpop = true; S.detail = null; S.screen = 'skillup'; SFX.pick(); draw(); } }, '特技強化'),
        el('button', { class: 'go sm', disabled: hasCard(c.no) ? null : true, onclick: () => { S.ihc = c.no; S.ihslot = null; S.ihm = []; S.ihsrc = null; S.gpop = true; S.detail = null; S.screen = 'inherit'; SFX.pick(); draw(); } }, '特技継承'),
        el('button', { class: 'go sm danger', disabled: fireMax(c.no) < 1 ? true : null,
          onclick: () => { S.fire = c.no; S.fireN = 1; draw(); } }, '武将解雇')) : null,
      closeX(() => { S.detail = null; draw(); })));
}

/* いま選んでいるくじ。ガチャ一覧から選ぶまでは先頭（くじの中身は gachas.js） */
const curGacha = () => gachaOf(S.gbanner || GACHAS[0].id);
/* 一覧の上で喋る人（2026-09-28）。信長わん（No.1）の絵を使う。
   絵が無ければ顔、それも無ければ何も出さない */
/* 顔の絵（256角）を先に見る。英雄の絵は横長なので、ここに出すと細い帯になってしまう */
const talkerUrl = () => faceUrl(1, '笑顔') || faceUrl(1, '通常') || pawnUrl(1) || heroUrl(1);
function screenGachaList() {
  const talk = talkerUrl();
  const sel = S.gbanner ? gachaOf(S.gbanner) : GACHAS[0];
  return {
    body: el('div', { class: 'glist' },
      // 上の語り。信長わんの絵と、吹き出し
      /* ここだけ顔も字も大きかったので、ほかの画面と同じ slim にそろえた（2026-09-30） */
      el('div', { class: 'gtalk slim' + (talk ? ' art' : '') },
        talk ? keepImg({ class: 'gtface', src: talk, alt: '織田信わん' })
             : el('i', { class: 'gtface' }, '犬'),
        el('div', { class: 'gtbub' },
          el('b', {}, '織田信わん'),
          el('p', {}, el('em', {}, 'くじを引くワン！！'), sel.words || 'くじを引いてみるかの？')),
        ),
      // 帯の一覧
      el('div', { class: 'glrows' }, GACHAS.map(g => {
        const u = bannerUrl(g.id);
        return el('div', { class: 'glwrap' },
          el('button', {
            class: 'glrow' + (u ? ' art' : ''),
            onclick: () => { S.gbanner = g.id; S.screen = 'gacha'; SFX.pick(); draw(); },
          }, u ? keepImg({ class: 'glimg', src: u, alt: g.name, loading: 'lazy' })
               : el('div', { class: 'gltxt' },
                   el('b', {}, g.name),
                   g.sub ? el('em', {}, g.sub) : null),
            ),
          /* 「開催中」「常設」「いつでも」の札は出さない（2026-09-28）。
             帯の絵が語るので、字を重ねると うるさい。終わりのあるくじだけ日付を出す */
          g.until ? el('div', { class: 'gluntil' }, `${g.until} まで`) : null);
      })),
      S.rates ? ratesSheet(...pityLeft()) : null,
      S.shop ? shopSheet() : null),
    nav: true,
  };
}

/* ---------------- ガチャ（わんこみくじ）----------------
   神社とおみくじ。巻物が飛んで開き、レアリティごとの光をまとって武将が出る。 */
const RAR_WORD = { N: '木札', R: '青の光', SR: '朱と金', SSR: '金の巻物', UR: '紫雲に虹' };
function screenGacha() {
  const g = S.gacha;
  /* 祭の札で引けるくじでは、札が先（2026-09-30）。
     持っていれば値札が札に変わり、尽きたら黙って石の値札に戻る */
  const tkt = curGacha().ticket ? item(TICKET) : 0;
  const byOne = tkt >= TICKET_PRICE.single;
  const byTen = tkt >= TICKET_PRICE.ten;
  const canOne = byOne || stones() >= PRICE.single;
  const canTen = P.firstFree || byTen || stones() >= PRICE.ten;
  const [toSSR, toUR] = pityLeft();
  /* 宝の前の景色は、引いてから札を見終わるまで敷いたままにする（2026-09-26） */
  /* 演出のさなか（宝の前・一体ずつの見せ場）は、下の帯も引く釦も出さない */
  const showing = !!(S.gbox || S.gboxing || S.rv || S.rvall);
  const inBox = !!(showing || (g && S.gopen));
  const waiting = !!(S.gbox || S.gboxing);
  return {
    /* 見せ場のときは、景色を .reveal の中に入れる（2026-09-26）。
       動画の黒を screen で透かすには、透かす相手が同じ重なりの組にいる必要がある。
       外に置いたままだと 黒が透けず、画面が真っ黒になってしまった */
    body: (bgEl => el('div', { class: 'gacha' + ' art' + (inBox ? ' takara' : '') + (S.rv || S.rvall ? ' bare' : '') },
      S.rv ? null : bgEl,
      showing ? null : gachaTop(),
      /* 引くボタン。app/assets/ui/ に pull_one.png / pull_ten.png を置けば
         絵のボタンに切り替わる。値段は絵に焼かず、アプリが下に重ねる（初回無料の出し分けがあるため） */
      showing ? null : pityBar(),
      S.rv ? revealView(S.rv, bgEl)
        : S.rvall ? revealAll(S.rvall)
        : waiting ? gachaBox()
        : el('div', { class: 'pulls' + (uiUrl('pull_one') || uiUrl('pull_ten') ? ' art' : '') },
            pullBtn('one', '一度引く',
              byOne ? tktPrice(TICKET_PRICE.single) : stonePrice(PRICE.single),
              canOne, () => doPull(1),
              byOne ? `祭の札 ${TICKET_PRICE.single}枚` : `${num(PRICE.single)} 石`),
            pullBtn('ten' + (P.firstFree ? ' free' : ''), '十連',
              P.firstFree ? '初回無料'
                : byTen ? tktPrice(TICKET_PRICE.ten) : stonePrice(PRICE.ten),
              canTen, () => doPull(10),
              P.firstFree ? '初回無料'
                : byTen ? `祭の札 ${TICKET_PRICE.ten}枚` : `${num(PRICE.ten)} 石`)),
      S.rv || S.rvall ? null : (g ? gachaResult(g) : null),
      S.rates ? ratesSheet(toSSR, toUR) : null,
      S.shop ? shopSheet() : null))(gachaBgEl(inBox)),
    /* ガチャはヘッダーを出さない（2026-09-26）。景色を端まで見せたい。
       演出のさなかは下の帯も消す（見せ場のじゃまになるため） */
    bare: true,
    nav: !showing,
  };
}
/* ガチャの右上（2026-09-26）。ヘッダーを外したので、石の残りをここに出す。
   「詳細」の左に並べる。数は略さず そのまま出す（買う判断に使うため） */
function gachaTop() {
  return el('div', { class: 'gtop' },
    /* 「← くじ選び」といまのくじの名は出さない（2026-09-28）。
       下の帯の「ガチャ」がくじ選びへ戻る道になっているし、
       どのくじかは後ろの絵が語る。上に字を並べると景色のじゃまになる */
    /* 祭りのくじでは、持っている札もここに出す（2026-09-30）。
       石と同じ並びに置くと「どちらで引くのか」が値札と突き合わせて分かる */
    curGacha().ticket ? el('div', { class: 'gstone' }, itemIcon(TICKET),
      el('b', {}, num(item(TICKET)))) : null,
    el('div', { class: 'gstone' }, curIcon('stone'), el('b', {}, num(stones()))),
    el('button', { class: 'detail', onclick: () => { S.rates = true; draw(); } },
      el('i', {}, '?'), '詳細'));
}
/* ガチャの後ろに敷くもの（2026-09-26）。
   宝の前では動く景色（bg/gacha_open.mp4）を一度だけ流し、最後のコマで止める。
   動画が無ければ同じ名の静止画、それも無ければ ふだんの gacha の絵に落ちる */
function gachaBgEl(inBox) {
  /* くじごとの景色（2026-09-28）。bg/gacha_<印>.jpg があればそれ、無ければふだんの gacha.jpg */
  const own = bgUrl('gacha_' + curGacha().id);
  const still = (inBox && bgUrl('gacha_open')) || own || bgUrl('gacha');
  const mv = inBox ? bgVideoUrl('gacha_open') : null;
  if (mv) {
    return el('div', { class: 'bgstack' },
      gachaVid(mv, still),
      el('div', { class: 'bgfull' }));
  }
  /* くじごとに絵を上へ寄せる（2026-09-30）。gachas.js の bgUp に px で書く。
     箱を伸ばすと cover が絵を引き伸ばして題字が切れるので、動かすだけにしてある。
     下に空いたぶんは みくじの帯とフッターが隠す */
  const node = keepBg(still, 'bgfull');
  if (node) node.style.backgroundPosition = curGacha().bgUp ? `center -${curGacha().bgUp}px` : '';
  return node;
}
/* 音の種類ごとの一行（2026-09-28）。入り切りの札と、つまみを一段に。
   数（%）は出さない。どれくらい鳴るかは耳で決めるもの。
   つまみは触っているあいだ音がついてくる（input）が、覚えるのは離したとき（change）。
   毎回 savePlayer を呼ぶと、動かすたびに書き込みが走って重い */
function volRow(kind, label) {
  const m = sndOf(kind);
  const off = !P.sound;
  const set = (o) => {
    P.mix[kind] = { ...m, ...o };
    setMix({ [kind]: P.mix[kind] });
  };
  return el('div', { class: 'mrow vrow' + (off ? ' soon' : '') + (m.on ? '' : ' mute') },
    el('span', { class: 'l' }, label),
    el('input', {
      class: 'vbar', type: 'range', min: '0', max: '100', step: '5',
      value: String(Math.round(m.v * 100)), disabled: off ? true : null,
      oninput: e => set({ v: +e.target.value / 100 }),
      onchange: e => { set({ v: +e.target.value / 100 }); savePlayer(); if (m.on) SFX.pick(); },
    }),
    el('button', {
      class: 'vsw' + (m.on ? ' on' : ''), disabled: off ? true : null,
      title: m.on ? 'オフにする' : 'オンにする',
      onclick: () => { set({ on: !m.on }); savePlayer(); if (!m.on) SFX.pick(); draw(); updateAudio(); },
    }, m.on ? 'オン' : 'オフ'));
}
/* いまの入り切りと大きさ。保存に無ければ既定に落とす（古い保存でも落ちない）。
   名は sndOf。replay.js にも mixOf があり、束ねると同じところに並んでぶつかる */
function sndOf(kind) {
  const D = { bgm: { on: true, v: .55 }, amb: { on: true, v: .40 }, se: { on: true, v: .70 } };
  if (!P.mix || typeof P.mix !== 'object') P.mix = {};
  const cur = P.mix[kind];
  if (!cur || typeof cur !== 'object') P.mix[kind] = { ...D[kind] };
  return P.mix[kind];
}
/* 三本線のメニュー（2026-09-21）
   いまは環境設定（音）だけ。これから足すものは「近日」と出しておく。 */
function menuSheet() {
  const close = () => { S.menu = false; draw(); };
  const row = (label, right, on) => el('button', {
    class: 'mrow' + (on ? '' : ' soon'), disabled: on ? null : true,
    onclick: on || null,
  }, el('span', { class: 'l' }, label), el('span', { class: 'r' }, right));
  /* 三本線の真下＝右上から開く（2026-09-21）。下から出ると押した場所と離れて違和感が出る */
  return el('div', { class: 'sheet corner', onclick: e => { if (e.target.classList.contains('sheet')) close(); } },
    el('div', { class: 'card2 menu' },
      el('b', { class: 'mittl' }, '環境設定'),
      el('div', { class: 'mlist' },
        row('所持アイテム', `${num(bagCount())} 個`, () => { S.menu = false; S.bag = true; SFX.pick(); draw(); }),
        row('音', P.sound ? 'オン' : 'オフ', () => {
          /* 覚えさせる（2026-09-28）。入れたのに開き直すと消えるのは不親切 */
          P.sound = !P.sound; savePlayer(); soundEnabled(P.sound); if (P.sound) SFX.pick();
          draw(); updateAudio();
        }),
        /* 音量設定（2026-09-28）。ふだんは1行に畳み、押すと三つが開く。
           環境設定の並びが長いので、いつも見えている必要のないものは隠す */
        row('音量設定', S.volOpen ? '閉じる' : '開く', () => { S.volOpen = !S.volOpen; SFX.pick(); draw(); }),
        S.volOpen ? el('div', { class: 'vwrap' },
          volRow('bgm', '曲'),
          volRow('amb', '場の音'),
          volRow('se',  '効き音')) : null,
        row('背景を動かす', P.bgMove === false ? 'オフ' : 'オン', () => {
          // 動く背景を止める（2026-09-26）。古い端末で重いとき・電池を持たせたいとき
          P.bgMove = P.bgMove === false; savePlayer(); SFX.pick(); draw();
        }),
        row('合戦の速さ', speedOf().label, () => {
          const i = SPEEDS.findIndex(x => x.v === P.speed);
          P.speed = SPEEDS[(i + 1) % SPEEDS.length].v;
          savePlayer(); SFX.pick(); draw();
        }),
        row('通知', '近日'),
        row('データ引き継ぎ', P.link.code ? '発行済み' : '未発行',
          () => { S.menu = false; lkOpen(); }),
        /* 保存の控え（2026-09-30）。サーバーに預ける前のつなぎ。
           ★ここの言葉は戦国口調にしない。間違えると本当に記録が消えるため */
        row('保存の控えを書き出す', 'ファイル', () => { S.menu = false; saveExport(); SFX.pick(); draw(); }),
        row('控えから戻す', '読み込む', () => { S.menu = false; S.keepMsg = ''; saveImportPick(); }),
        row('保存の持ち', KEEP_OK === true ? '消えない' : KEEP_OK === false ? 'ふつう' : '確かめ中',
          () => { S.keepHelp = !S.keepHelp; SFX.pick(); draw(); }),
        S.keepHelp ? el('p', { class: 'note keepnote' },
          KEEP_OK === true
            ? 'この端末では、しばらく遊ばなくても記録は消えません。'
            : 'ブラウザは、しばらく使われていない置き場から順に記録を消すことがあります。'
              + 'ホーム画面に追加して、そこから遊ぶと消えにくくなります。'
              + '大事な記録は「保存の控えを書き出す」でファイルに残してください。') : null,
        row('遊び方', '合戦の手引き', () => { S.menu = false; S.help = true; SFX.pick(); draw(); }),
        row('お問い合わせ', '近日')),
      el('p', { class: 'ver' }, 'わんこ大戦国　開発中の版'),
      /* 書体の表記（2026-09-23）。SIL Open Font License は表示が要る */
      el('p', { class: 'ver credit' },
        '書体：源ノ明朝／源ノ角ゴシック', el('br', {}),
        'Source Han Serif / Source Han Sans — SIL Open Font License 1.1'),
      closeX(close)));
}

/* ---- 遊び方（合戦の手引き・2026-09-24） ----
   数字は書かない。何が起きるかだけを書いて、どれくらい効くかは遊んで掴んでもらう。 */
const HELP = [
  { t: '合戦の進み方', p: [
    '速さの順に手番がまわる。相手の兵量をゼロにするか、決着のターンまでに多く残したほうが勝ち。',
    '総大将が討たれても負けにはならないが、大将特性は消える。',
  ] },
  { t: 'オートと手動', p: [
    '盤面の右上のボタンで、戦のさなかにいつでも切り替えられる。',
    '合戦の進む速さは、三本線の「合戦の速さ」で変えられる。通常・1.5倍・2倍の三つ。',
    'オートから手動に変えたときは、見せ終わったターンをやり直さないよう次のターンから効く。',
    '選んだ方式は次の戦にも引き継がれる。',
  ] },
  { t: '手番でできること', p: [
    '白い破線の枠＝いま動かせる自分の武将。押すと待機して手番を送る。',
    '水色に光るマス＝移動できるところ。押せばそこへ動く。',
    '赤く光る相手＝攻撃できる相手。押せば斬りかかる。',
    '右下の丸い印＝奥義。ゲージが満ちると光る。',
  ] },
  { t: '間合い', p: [
    '接近戦の武将は上下左右の隣にしか届かない。斜めには届かない。',
    '弓や槍のように間合いの長い武将は、斜めにも届く。',
    '十字や周囲に広がるのは、特技と奥義の効きかた。',
  ] },
  { t: '得意と苦手', p: [
    '武将にはそれぞれ得意と苦手がある。地面がふたつ、天候がひとつ、陣形がひとつ。カードの裏に書いてある。',
    '地面は立っているマスで決まる。得意な地面では力が増し、苦手な地面では鈍る。マスごとに地面は違うので、動けば変わる。',
    '天候はその戦の空で決まる。戦仕度で天候の品を持ち込めば呼び変えられるが、空は敵にもかかる。',
    '陣形は出陣のときに決まり、その戦のあいだ変わらない。',
  ] },
  { t: '属性の五すくみ', p: [
    '猛将は智将に弱く、智将は守将に、守将は仁将に、仁将は神速に、神速は猛将に弱い。',
    '苦手な属性の敵が多いほど、その武将は力を落とす。',
  ] },
  { t: '戦仕度', p: [
    '出陣の前に、合戦へ持ち込む道具を三つまで決められる。開戦からずっと効く。',
    '秘薬は味方だけ。天候の品は両軍にかかる。',
    '使った道具は、負けても戻らない。',
  ] },
  { t: '盤面の見かた', p: [
    '盤面の外、上が敵・下が味方。顔の下の数が残りの兵量。',
    '顔の左上の印が総大将。右下に出るものはその武将にかかっている効き。',
    '討たれた武将には赤い×が付く。',
  ] },
];
/* ================= お知らせ（2026-09-24）=================
   記事は news.js に置く。ホームの「報」から開く。
   タグは更新と不具合の2つだけ。ふだんは更新を使い、詫びや取りこぼしは不具合に置く。 */

/* 帯の絵。app/assets/news/<art>.png（1080×300）。無ければ帯は出ない */
const newsUrl = n => {
  const f = (n.art || '') + '.png';
  return n.art && (MANIFEST.news || []).includes(f) ? `assets/news/${f}` : null;
};
const newsOf = id => NEWS.find(n => n.id === id) || null;
const newsRead = n => (P.newsRead || []).includes(n.id);
const newsUnread = () => NEWS.filter(n => !newsRead(n)).length;
const newsOfTag = tag => NEWS.filter(n => n.tag === tag);
const unreadOfTag = tag => newsOfTag(tag).filter(n => !newsRead(n)).length;

/* お詫びの品は「開いたら配る」（2026-09-24）。
   受け取りボタンは置かない。押し忘れて褒美が宙に浮くのを避けたいのと、
   受け取り待ちの赤丸が残り続けるのが煩わしいため。
   配ったかどうかは P.newsGot で覚えているので、読み返しても二度は落ちない。 */
function newsTake(n) {
  if (!n.gift || (P.newsGot || []).includes(n.id)) return null;
  const g = n.gift;
  if (g.koban) P.koban += g.koban;
  if (g.soul) P.soul += g.soul;
  if (g.stone) P.free += g.stone;
  if (g.stamina) P.stamina = Math.min(P.staminaMax, P.stamina + g.stamina);
  for (const [k, v] of Object.entries(g.items || {})) P.items[k] = (P.items[k] || 0) + v;
  P.newsGot.push(n.id);
  savePlayer();
  return g;
}
/* お詫びの中身を一行の文にする。「小判 300／魂 1」のように */
function giftWords(g) {
  const w = [];
  if (g.koban) w.push(`小判 ${g.koban}`);
  if (g.soul) w.push(`武士の魂 ${g.soul}`);
  if (g.stone) w.push(`石 ${g.stone}`);
  if (g.stamina) w.push(`兵糧 ${g.stamina}`);
  for (const [k, v] of Object.entries(g.items || {})) w.push(`${k} ${v}`);
  return w.join('　');
}

function openNews(n) {
  S.newsId = n.id;
  if (!newsRead(n)) { P.newsRead.push(n.id); savePlayer(); }
  const got = newsTake(n);
  SFX.pick();
  draw();
  if (got) { SFX.win(); newsRain(); }
}
/* 小判が降る（2026-09-24）。お詫びを配った合図。
   絵は使わず、丸を10枚ほど落とすだけ。素材が無くても成り立つようにしている */
function newsRain() {
  const box = document.querySelector('.nwbody');
  if (!box) return;
  for (let i = 0; i < 12; i++) {
    const c = el('i', { class: 'nwcoin' });
    c.style.left = (6 + Math.random() * 88) + '%';
    box.append(c);
    c.animate([
      { transform: 'translateY(-40px) rotate(0deg)', opacity: 0 },
      { transform: 'translateY(0) rotate(180deg)', opacity: 1, offset: .25 },
      { transform: `translateY(${120 + Math.random() * 90}px) rotate(540deg)`, opacity: 0 },
    ], { duration: 900 + Math.random() * 500, delay: i * 55, easing: 'cubic-bezier(.3,.1,.6,1)' })
      .onfinish = () => c.remove();
  }
}

function newsSheet() {
  const close = () => { S.news = false; S.newsId = null; draw(); };
  const open = newsOf(S.newsId);
  const back = () => { S.newsId = null; SFX.pick(); draw(); };

  /* 本文 */
  if (open) {
    const art = newsUrl(open);
    const g = open.gift;
    return el('div', { class: 'sheet', onclick: e => { if (e.target.classList.contains('sheet')) close(); } },
      el('div', { class: 'card2 nwbox' },
        el('b', { class: 'nwttl' }, 'お知らせ'),
        el('div', { class: 'nwbody one' },
          el('div', { class: 'nwhead t' + open.tag },
            el('span', { class: 'nwtag' }, open.tag),
            open.fixed ? el('span', { class: 'nwfix' }, '直済') : null,
            el('span', { class: 'nwdate' }, open.date)),
          el('div', { class: 'nwart2' },
            el('h4', {}, open.title),
            art ? keepImg({ class: 'nwimg', src: art, alt: '' }) : null,
            open.body.map(x => el('p', {}, x)),
            g ? el('div', { class: 'nwgift' },
              /* 不具合のお知らせなら「お詫びの品」、それ以外の配りものは「贈り物」（2026-09-28）。
                 祝いの石を配るのに「お詫び」と書いてあるのは、さすがにおかしい */
              el('span', { class: 'gl' }, open.tag === '不具合' ? 'お詫びの品' : '贈り物'),
              el('span', { class: 'gv' }, giftWords(g))) : null)),
        closeX(back, 'もどる')));
  }

  /* 一覧 */
  const list = newsOfTag(S.newsTab);
  return el('div', { class: 'sheet', onclick: e => { if (e.target.classList.contains('sheet')) close(); } },
    el('div', { class: 'card2 nwbox' },
      el('b', { class: 'nwttl' }, 'お知らせ'),
      el('div', { class: 'nwtabs' }, NEWS_TAGS.map(t => {
        const k = unreadOfTag(t);
        return el('button', {
          class: 'nwtab' + (S.newsTab === t ? ' on' : ''),
          onclick: () => { S.newsTab = t; SFX.pick(); draw(); },
        }, t, k ? el('em', {}, k > 9 ? '9+' : String(k)) : null);
      })),
      el('div', { class: 'nwbody' }, list.length ? list.map(n => {
        const art = newsUrl(n);
        return el('button', { class: 'nwrow' + (newsRead(n) ? '' : ' new'), onclick: () => openNews(n) },
          el('div', { class: 'nwhead t' + n.tag },
            el('span', { class: 'nwtag' }, n.tag),
            n.fixed ? el('span', { class: 'nwfix' }, '直済') : null,
            el('span', { class: 'nwdate' }, n.date)),
          art ? keepImg({ class: 'nwimg', src: art, alt: '' }) : null,
          el('div', { class: 'nwline' },
            el('span', { class: 'nwt' }, n.title),
            newsRead(n) ? null : el('em', { class: 'nwdot' })));
      }) : el('p', { class: 'nwnone' }, 'まだ何もありませぬ')),
      closeX(close)));
}

function helpSheet() {
  const close = () => { S.help = false; draw(); };
  return el('div', { class: 'sheet', onclick: e => { if (e.target.classList.contains('sheet')) close(); } },
    el('div', { class: 'card2 helpbox' },
      el('b', { class: 'mittl' }, '合戦の手引き'),
      el('div', { class: 'helplist' }, HELP.map(h =>
        el('div', { class: 'hsec' },
          el('h4', {}, h.t),
          h.p.map(x => el('p', {}, x))))),
      closeX(close)));
}

/* ---- 兵糧をもどす（2026-09-21） ----
   ヘッダーの兵糧バーの＋と、兵糧が足りないときの出陣ボタンから開く。
   after を渡すと、使い終わったあとにそれを実行する（足りないまま出陣を押したときの続き） */
function foodSheet() {
  const close = () => { S.food = false; S.foodAfter = null; draw(); };
  const names = Object.keys(ITEMS).filter(k => ITEMS[k].food && item(k) > 0);
  const after = S.foodAfter;
  return el('div', { class: 'sheet', onclick: e => { if (e.target.classList.contains('sheet')) close(); } },
    el('div', { class: 'card2' },
      el('b', { class: 'mittl' }, '兵糧をもどす'),
      el('div', { class: 'foodbar' },
        el('span', {}, '兵糧'), el('i', { style: `width:${Math.round(P.stamina / P.staminaMax * 100)}%` }),
        el('b', {}, `${num(P.stamina)} / ${num(P.staminaMax)}`)),
      /* 時間でも戻る（2026-09-26）。何分で1つ、までは言わない。
         「待てば戻る」と分かれば足りる（説明しすぎない） */
      el('p', { class: 'note' }, P.stamina >= P.staminaMax ? '兵糧は満ちている' : '兵糧は時とともに戻る'),
      names.length ? el('div', { class: 'shoplist' }, names.map(name => {
        const it = ITEMS[name], have = item(name);
        return el('div', { class: 'shoprow' },
          itemIcon(name),
          el('div', { class: 'sitm' },
            el('b', {}, name, el('span', { class: 'have' }, `持 ${num(have)}`)),
            el('span', { class: 'sd' }, it.desc)),
          el('button', {
            class: 'go sm', disabled: P.stamina >= P.staminaMax ? true : null,
            onclick: () => {
              const r = useFood(name);
              if (!r) { SFX.pick(); draw(); return; }
              SFX.win();
              // 出陣の途中なら、足りるようになった時点でそのまま出す
              if (after && P.stamina >= (S.foodNeed || FOOD_COST)) { S.food = false; S.foodAfter = null; S.foodNeed = 0; after(); return; }
              draw();
            },
          }, '使う'));
      })) : el('p', { class: 'note' }, '兵糧の道具を持っていない。ショップの「蔵」で買える'),
      P.stamina >= P.staminaMax ? el('p', { class: 'note' }, 'もう満ちている') : null,
      closeX(close)));
}

/* ---- 所持アイテム（2026-09-21） ----
   47種あるので、文字を並べず「絵＋個数」の升目にして、種類ごとに分ける。
   0個のものは沈めるだけで隠さない（何が足りないかを見せたいので）。 */
const BAG_TABS = [
  { key: '稽古', name: '稽古', note: '武将強化でレベルを上げる' },
  { key: '覚醒', name: '覚醒', note: '覚醒に使う具足と軍配' },
  { key: '特技', name: '特技', note: '特技強化に使う伝書と護符' },
  /* 相伝の護符を特技の棚から分けた（2026-09-27）。
     継承の画面から棚を開いたとき、強化用の伝書が並んで紛らわしかった */
  { key: '相伝', name: '相伝', note: '特技継承で当たりを上げる護符' },
  { key: '陣中', name: '陣中', note: '戦仕度で持ち込む秘薬と天候の品' },
  { key: '編成', name: '編成', note: 'コストの上限をしばらく上げる陣触れの品' },
  { key: '兵糧', name: '兵糧', note: 'ここで使って兵糧をもどす' },
  { key: 'お祭り', name: 'お祭り', note: 'お祭りで使う札' },
];
const bagCount = () => Object.keys(ITEMS).reduce((a, k) => a + item(k), 0);
/* 覚醒の品は 属性(籠手→具足→兜) → 無銘 → 軍配 の順に並べる */
/* ---- 道具を使う（2026-09-22） ----
   所持アイテムは見るだけだったので、品ごとに「使う」を付けた。
   使える画面にいればその場で効かせ、いなければその画面へ連れていく。
   道具の名は player.js の useItem（数を減らす方）と紛らわしいので goUseItem にした。 */
const ITEM_GO = {
  稽古: { screen: 'power',   go: '武将強化で使う',       here: '稽古をつける' },
  覚醒: { screen: 'power',   go: '武将強化の覚醒で使う', here: '覚醒に使う' },
  特技: { screen: 'skillup', go: '特技強化で使う',       here: '特技強化で使う' },
  相伝: { screen: 'inherit', go: '特技継承で使う',       here: '特技継承で使う' },
  陣中: { screen: 'map',     go: '出陣前の戦仕度で使う', here: '戦仕度で使う' },
  編成: { here: 'いま飲む', go: 'いま飲む' },                                  // どこからでも飲める（2026-09-23）
  兵糧: { food: true,        go: 'ここで使う',           here: 'ここで使う' },
  お祭り: { soon: true,        go: 'イベントで使う（近日）', here: 'イベントで使う（近日）' },
};
const itemKind = name => {
  const it = ITEMS[name] || {};
  const k = it.kind || '稽古';
  /* 相伝の護符は kind が「特技」だが、使う場所が継承なので棚では分ける（2026-09-27） */
  return (k === '特技' && it.luckInh != null) ? '相伝' : k;
};
/* いまの画面でそのまま使えるか */
function usableHere(name) {
  const k = itemKind(name);
  if (k === '兵糧') return true;
  if (k === '編成') return true;           // 陣触れの品はどの画面からでも飲める（2026-09-23）
  if (k === '特技') return S.screen === 'skillup';
  if (k === '相伝') return S.screen === 'inherit';
  if (k === '稽古' && S.screen === 'power') return true;
  return false;
}
/* 棚の「使う」に出す文言 */
function bagUseLabel(name) {
  const g = ITEM_GO[itemKind(name)] || {};
  return (usableHere(name) ? g.here : g.go) || '使う';
}
function goUseItem(name) {
  const k = itemKind(name), g = ITEM_GO[k] || {};
  miBump('item');   // お役目の数（2026-09-24）
  if (g.soon) { S.bagMsg = 'イベントは近日。いまは使えない'; SFX.pick(); draw(); return; }
  if (g.food) { S.bag = false; S.bagSel = null; S.food = true; SFX.pick(); draw(); return; }
  if (k === '編成') {
    const r = useCostItem(name);
    S.bagMsg = r ? `コストの上限が ${costMax()} になった（あと${costBuffLeft()}）` : '飲めなんだ';
    if (r) SFX.win(); else SFX.pick();
    draw(); return;
  }
  if ((k === '特技' || k === '相伝') && usableHere(name)) {
    S.bag = false; S.bagSel = null; applySkillItem(name); return;
  }
  if (k === '稽古' && S.screen === 'power') {
    const r = feedBook(S.grow, name, 1);
    S.bagMsg = r ? `${name} を1冊 使った` : 'これ以上は育たない（覚醒すれば先へ進める）';
    if (r && r.up) miBump('lv');   // お役目の数（門出・2026-09-26）
    if (r) { SFX.win(); if (r.up) SFX.win(); } else SFX.pick();
    draw(); return;
  }
  S.bag = false; S.bagSel = null; S.bagMsg = '';
  S.screen = g.screen || 'grow'; SFX.pick(); draw();
}
/* 特技強化の画面で、伝書は素材に積み、護符は添える */
function applySkillItem(name) {
  const it = ITEMS[name] || {};
  /* 添えたことは護符の行そのものが見せるので、しるしは出さない（2026-09-25） */
  if (it.luckInh) { S.ihch = name; S.ihMsg = ''; SFX.win(); draw(); return; }
  if (it.luck) { S.skch = name; S.skMsg = ''; SFX.win(); draw(); return; }
  if (name === BOOK) {
    if (item(BOOK) - skBookCount() < 1) S.skMsg = `${BOOK} が足りない`;
    else if (skMats().length >= MAT_MAX) S.skMsg = `素材は ${MAT_MAX} つまで`;
    else { skMats().push({ book: true }); S.skMsg = `${BOOK} を1つ積んだ`; SFX.win(); draw(); return; }
    SFX.pick(); draw(); return;
  }
  SFX.pick(); draw();
}
/* 画面から道具棚を開く。その画面で使う種類を先に出す */
/* 題を彫った一枚絵の釦（2026-09-26）。
   app/assets/ui/btn_<名>.webp があれば絵に差し替え、無ければ今までの金の釦。
   文字は絵に入っているので重ねない（育成の題札と同じ考え） */
function artGo(name, label, cls, on, off) {
  const art = uiUrl('btn_' + name);
  return el('button', {
    class: 'go wide' + (art ? ' pic' : '') + (cls ? ' ' + cls : ''),
    disabled: off ? true : null, title: label, onclick: off ? null : on,
  }, art ? keepImg({ src: art, alt: label }) : label);
}
/* 画面から道具棚を開く（2026-09-26 に絵を足した）。
   袋の字ではなく、その画面で使う品そのものの絵を出す。
   何を選びに行くのかが、押す前に分かる */
function useItemBtn(tab, label, sample) {
  return el('button', {
    class: 'ghost wide useitem',
    onclick: () => { S.bag = true; S.bagTab = tab; S.bagSel = null; S.bagMsg = ''; SFX.pick(); draw(); },
  }, sample && ITEMS[sample] ? itemIcon(sample) : el('i', { class: 'uii' }, '袋'),
     label || 'アイテムを使う');
}
/* 覚醒の品は 無銘（籠手→具足→兜）→ 軍配（木→鉄→金、属性の順）で並べる（2026-09-23） */
function bagKey(name) {
  const it = ITEMS[name] || {};
  if (it.free) return [0, it.tier];
  if (it.badge != null) return [1, it.badge * 10 + Math.max(0, ATTRS.indexOf(it.attr))];
  if (it.attr) return [2, it.tier || 0];
  return [0, 0];
}
function bagOrder(a, b) {
  const x = bagKey(a), y = bagKey(b);
  return x[0] - y[0] || x[1] - y[1];
}
function bagCell(name) {
  const it = ITEMS[name], n = item(name);
  return el('button', {
    title: name,
    class: 'bagc' + (n ? '' : ' none') + (S.bagSel === name ? ' on' : ''),
    onclick: () => { S.bagSel = S.bagSel === name ? null : name; SFX.pick(); draw(); },
  }, itemIcon(name), el('b', {}, num(n)));
}
function bagSheet() {
  const close = () => { S.bag = false; S.bagSel = null; S.bagMsg = ''; draw(); };
  const tab = S.bagTab || '稽古';
  // 持っていないものは出さない（2026-09-21）
  const names = Object.keys(ITEMS)
    .filter(k => itemKind(k) === tab && item(k) > 0).sort(bagOrder);
  const t = BAG_TABS.find(x => x.key === tab) || BAG_TABS[0];
  const sel = S.bagSel && ITEMS[S.bagSel] ? S.bagSel : null;
  return el('div', { class: 'sheet', onclick: e => { if (e.target.classList.contains('sheet')) close(); } },
    el('div', { class: 'card2 bagbox' },
      el('b', { class: 'mittl' }, '所持アイテム'),
      el('div', { class: 'row chapters bagtabs ihf' }, BAG_TABS.map(x => el('button', {
        class: 'chip' + (tab === x.key ? ' on' : ''),
        onclick: () => { S.bagTab = x.key; S.bagSel = null; S.bagMsg = ''; SFX.pick(); draw(); },
      }, x.name))),
      el('p', { class: 'note' }, t.note),
      names.length
        ? el('div', { class: 'baggrid' }, names.map(n => bagCell(n)))
        : el('p', { class: 'note' }, 'この種類の道具は持っていない'),
      /* 品を選んでいないときは空の箱を出さない（2026-09-25）。
         押せば説明が出ることは、一度押せば分かる。言われるまでもない */
      sel ? el('div', { class: 'bagnote on' },
        el('div', {},
          el('b', {}, sel, el('span', {}, `　持 ${num(item(sel))}`)),
          el('span', {}, ITEMS[sel].desc))) : null,
      S.bagMsg ? el('div', { class: 'shopmsg' }, S.bagMsg) : null,
      sel ? el('button', {
        class: 'go wide', disabled: item(sel) < 1 ? true : null,
        onclick: () => goUseItem(sel),
      }, bagUseLabel(sel)) : null,
      closeX(close)));
}

/* 石が足りないときの案内（2026-09-21）
   いまは案内だけ。課金画面ができたら、この「石を買う」から遷移させる。 */
function shopSheet() {
  const close = () => { S.shop = false; draw(); };
  return el('div', { class: 'sheet', onclick: e => { if (e.target.classList.contains('sheet')) close(); } },
    el('div', { class: 'card2' },
      el('b', { style: 'font-size:16px' }, '石が足りぬ'),
      el('p', { style: 'font-size:12px;color:var(--text2);margin:8px 0 14px;line-height:1.7' },
        `いま持っているのは ${num(stones())} 石。`,
        el('br', {}),
        `一祈りに ${num(PRICE.single)} 石、十連に ${num(PRICE.ten)} 石が要る。`),
      el('div', { class: 'acts', style: 'margin-top:0' },
        el('button', { class: 'ghost', onclick: close }, '閉じる'),
        el('div', { class: 'spacer' }),
        el('button', { class: 'go', onclick: close }, '石を買う（近日）'))));
}

/* 天井バー（2026-09-21）
   下ナビのすぐ上に常駐させ、「URの天井まであと何回か」を一目で見せる。
   数えているのは最後にURが出てからの回数。URを引いた時点で 0 に戻る。
   SSR以上の天井は別の数えなので、右端に小さく添えるだけにする。 */
const PITY_MARKS = [30, 60, 90, 120, 150];
/* 帯の節目に置く褒美の絵（2026-09-26）。
   30 … SR以上が確定　60 … SSR以上が確定
   90 … 相伝の護符・大 が1つ　120 … 上達の護符・大 が1つ　150 … URが確定
   絵が無ければ 節目の矢印のままになる（絵が無くても動く決まり） */
const pityGift = m => {
  const rank = { [PITY.ur]: 'UR', [PITY.ssr]: 'SSR', [PITY.sr]: 'SR' }[m];
  if (rank) return rarUrl(rank) ? { src: rarUrl(rank), alt: rank } : null;
  const item = (PITY.gifts || {})[m];
  if (item) { const u = itemUrl(item); return u ? { src: u, alt: item } : null; }
  return null;
};
/* いま選んでいるくじの「あと何回で天井か」（2026-09-28） */
function pityLeft() {
  const q = pityOf(curGacha().id);
  return [Math.max(0, PITY.ssr - q.ssr), Math.max(0, PITY.ur - q.ur)];
}
function pityBar() {
  const n = pityOf(curGacha().id).ur, max = PITY.ur;   // 数えはくじごと（2026-09-28）
  const pct = Math.max(0, Math.min(100, n / max * 100));
  return el('div', { class: 'pity' },
    el('div', { class: 'cnt' },
      el('span', { class: 'lb' }, 'みくじ'),
      el('b', {}, num(n))),
    el('div', { class: 'trk' },
      el('div', { class: 'line' }, el('i', { style: `width:${pct}%` })),
      el('div', { class: 'marks' }, PITY_MARKS.map(m => el('div', {
        class: 'mk' + (n >= m ? ' on' : '') + (pityGift(m) ? ' goal' : ''),
        style: `left:${m / max * 100}%`,
      },
        /* 褒美のある節目は、その絵を置く。無ければ これまでの矢印・字に落ちる */
        (() => { const g = pityGift(m);
          return el('span', { class: 'pin' + (g ? ' icon' : '') },
            g ? el('img', { class: 'urimg', src: g.src, alt: g.alt, title: g.alt })
              : (m === max ? el('em', {}, 'UR') : null)); })(),
        el('span', { class: 'num' }, m))))));
  /* 「あと◯回」の字は出さない（2026-09-26）。
     数で語らず、帯の進み具合だけ見せる。推し量る楽しみを残す */
}

/* 排出率などの詳細。右上の「詳細」から開く（2026-09-21） */
function ratesSheet(toSSR, toUR) {
  const row = (k, v) => el('div', { class: 'rw' }, el('span', {}, k), el('b', {}, v));
  return el('div', { class: 'sheet', onclick: e => { if (e.target.classList.contains('sheet')) { S.rates = false; draw(); } } },
    el('div', { class: 'card2' },
      el('h2', { class: 'rttl' }, curGacha().name + '　詳細'),
      /* このくじで出るURの顔ぶれと、一人ぶんの出やすさ（2026-09-28）。
         ピックアップを上に、その他を下に。ここを伏せると引く気が起きない */
      (() => {
        const g0 = curGacha();
        const { pick, rest } = urListOf(g0, POOL);
        if (!pick.length && !rest.length) return null;
        const rt = urRatesOf(g0, POOL, RATES.UR);
        const row2 = (n, up) => {
          const c = charOf(n); if (!c) return null;
          return el('div', { class: 'rw' + (up ? ' up' : '') },
            el('span', {}, up ? el('i', { class: 'pkup' }, 'PICK UP') : null, c.name),
            el('b', {}, `${(rt[n] * 100).toFixed(2)}%`));
        };
        return el('div', {},
          el('h3', {}, 'このくじで出るUR'),
          el('div', { class: 'rtab' },
            pick.map(n => row2(n, true)),
            rest.map(n => row2(n, false))));
      })(),
      el('h3', {}, '排出率'),
      el('div', { class: 'rtab' }, RAR.map(r =>
        el('div', { class: 'rw' }, el('span', { class: 'r-' + r }, rarTag(r, 'sm')),
          el('b', {}, `${(RATES[r] * 100).toFixed(0)}%`)))),
      el('h3', {}, '価格'),
      /* 祭りのくじは札で引ける（2026-09-30）。札が先、尽きたら石 */
      el('div', { class: 'rtab' },
        row('一祈り', curGacha().ticket
          ? `${TICKET}${TICKET_PRICE.single}枚／なければ ${num(PRICE.single)} 石`
          : `${num(PRICE.single)} 石`),
        row('十連', curGacha().ticket
          ? `${TICKET}${TICKET_PRICE.ten}枚／なければ ${num(PRICE.ten)} 石`
          : `${num(PRICE.ten)} 石`)),
      el('h3', {}, '確定と天井'),
      el('div', { class: 'rtab' },
        row('十連', '10体目までにSR以上が1体確定'),
        row('SR以上の天井', `${PITY.sr}連`),
        row('SSR以上の天井', `${PITY.ssr}連（あと ${toSSR} 回）`),
        row('URの天井', `${PITY.ur}連（あと ${toUR} 回）`)),
      el('h3', {}, 'おみくじの帯の褒美'),
      el('div', { class: 'rtab' },
        Object.entries(PITY.gifts || {}).map(([n, k]) => row(`${n}連`, `${k} ×1`))),
      el('h3', {}, '重なった武将'),
      el('div', { class: 'rtab' }, RAR.slice().reverse().map(r =>
        row(r, `武士の魂 +${SOUL_BY_RARITY[r]}`))),
      el('h3', {}, '手持ち'),
      el('div', { class: 'rtab' },
        row('石（合計）', `${num(stones())} 石`),
        row('　うち有償石', `${num(P.paid)} 石`),
        row('　うち無償石', `${num(P.free)} 石`),
        row('兵糧', `${P.stamina} / ${P.staminaMax}`),
        row('所持している武将', `${P.own.filter(hasCard).length} / ${C.length} 体`)),
      el('p', { class: 'ticketnote' },
        'みくじの結果は「御籤番号」だけで決まる。番号を控えておけば、同じ抽選をいつでも引き直して確かめられる。'),
      closeX(() => { S.rates = false; draw(); })));
}
/* 結果の見せ方（2026-09-21 改訂）
   まず引いたなかで**いちばんレアリティの高い武将を1体大きく**見せる。
   十連はそのあとに獲得した武将の一覧を出す。単発は大きい1体だけ。
   所持しているかどうかは結果には出さない（見たいのは誰が来たか）。 */
function gachaResult(g) {
  const top = g.items.slice().sort((a, b) => RAR.indexOf(a.rarity) - RAR.indexOf(b.rarity))[0];
  const c = charOf(top.no) || {};
  const dups = g.items.filter(x => x.dup).length;
  return el('div', { class: 'result2 lv-' + top.rarity },
    el('div', { class: 'hero lv-' + top.rarity },
      el('div', { class: 'ray' }),
      cardArt(c)
        ? el('button', { class: 'face art', title: 'カードを見る', onclick: () => openCard(c) }, cardImg(c))
        : el('div', { class: 'face', style: chipStyle(c) }),
      el('div', { class: 'name' },
        rarTag(top.rarity, 'big'),
        el('b', {}, c.name || ''),
        el('span', { class: 'sub' }, `${c.attr || '―'}　${RAR_WORD[top.rarity]}`))),
    g.items.length > 1 ? el('div', { class: 'listttl' }, `獲得した武将 ${g.items.length}体`) : null,
    g.items.length > 1 ? el('div', { class: 'got' }, g.items.map((x, i) => {
      const cc = charOf(x.no) || {};
      const art = cardArt(cc);
      return el('div', {
        class: 'gi r-' + x.rarity + ' lv-' + x.rarity + (art ? ' art' : ''),
        style: `animation-delay:${i * 80}ms`,
        onclick: art ? () => openCard(cc) : null,
      },
        art ? cardImg(cc) : el('span', { class: 'f', style: chipStyle(cc) }),
        art ? null : el('span', { class: 'n' }, cc.name || ''),
        // レアリティはカードの右上に刷ってあるので、絵があるときは重ねない
        art ? null : rarTag(x.rarity, 'sm'));
    })) : null,
    dups ? el('p', { class: 'soulgot' },
      `重なった武将 ${dups} 体は「重ね」として持つ　特技強化の素材になり、売れば魂になる`) : null,
    el('p', { class: 'ticket' }, `御籤番号 ${g.ticket}`),
    el('p', { class: 'ticketnote' }, 'この番号があれば同じ結果をいつでも引き直して確かめられる'));
}
// noDup を立てると、すでに持っている武将を抽選から外す（はじまりの十連だけ使う。
// 選んだばかりの一騎がそのまま重複して魂になるのは、初回としてあまりに寂しいため） 
/* 引くボタン1つぶん。素材があれば絵だけを出す（値段は絵に焼き込まれている）。
   無料のときは pull_ten_free.png があればそれを使い、無ければ通常の絵に「初回無料」の帯を添える。 */
/* 引くボタン（2026-09-21 改訂）
   石が足りなくても押せるし、暗くもしない。押したら石を買う画面へ案内する。
   「引けない見た目」にすると絵が台無しになるうえ、買ってもらう導線も消えるため。 */
/* 値札（2026-09-30）。粒の絵 ＋ 数。石も札も同じ組みにして、見比べやすくする。
   絵が無ければ、itemIcon / curIcon が字の粒に落ちる（絵が無くても動く） */
const tktPrice = n => el('span', { class: 'tkp' }, itemIcon(TICKET), el('em', {}, '×' + n));
const stonePrice = n => el('span', { class: 'tkp' }, curIcon('stone'), el('em', {}, num(n) + '石'));
/* 引く釦（2026-09-30 改）。
   前は名も値段も絵に焼いてあったので、絵の上に字を重ねていなかった。
   石と札で値札を出し分けたいので、絵は空にしてもらい、名と値はこちらで書く。
   ptext は title（長押しの吹き出し）に出す字。値札が絵のときだけ渡す */
function pullBtn(kind, label, price, can, on, ptext) {
  const base = kind.split(' ')[0];
  const free = kind.includes('free');
  const art = (free && uiUrl('pull_' + base + '_free')) || uiUrl('pull_' + base);
  const freeBadge = free && !uiUrl('pull_' + base + '_free');
  return el('button', {
    class: 'pull ' + kind + (art ? ' art' : ''),
    onclick: can ? on : () => { S.shop = true; SFX.pick(); draw(); },
    title: `${label}　${ptext || (typeof price === 'string' ? price : '')}`,
  },
    art ? el('img', { class: 'pimg', src: art, alt: label }) : null,
    el('b', {}, label),
    (art && freeBadge) ? el('span', { class: 'freeband' }, '初回無料') : null,
    el('span', { class: 'pr' }, price));
}
/* ---- 宝箱の演出（2026-09-26）----
   引いたらすぐ札を見せず、宝の前に立たせる。押して開けた瞬間に出るほうが、
   引いた手ごたえが残る。絵（ui/gacha_box）が無ければ、これまでの巻物に落ちる。
   背景は bg/gacha_open。札が出たあとも、同じ景色を敷いたままにする */
function gachaBox() {
  const art = uiUrl('gacha_box');
  return el('div', {
    class: 'gbox' + (S.gboxing ? ' opening' : ''),
    onclick: S.gboxing ? null : openBox,
  },
    el('div', { class: 'gblight' }),
    /* 字は宝箱の絵の上に重ねる（2026-09-26）。帯を敷くと札が増えて見え、
       景色のにぎやかさに負ける。金字に濃い影だけで読ませる */
    el('div', { class: 'gbwrap' },
      art ? keepImg({ class: 'gbart', src: art, alt: '宝箱' })
          : el('div', { class: 'gbfall' }, '宝'),
      S.gboxing ? null : el('b', { class: 'gbtxt' }, '宝箱を開く')));
}
async function openBox() {
  const r = S.gbox;
  if (!r) return;
  /* 宝箱の音は 箱の芝居と同じ長さで作ってある（2026-09-28）。
     音の山が二つあり、0.25秒＝箱が揺れる／2.60秒＝ぱっと開く。
     動画で箱が開くのは 2.65秒（実測）なので、ずれは0.05秒。そのまま頭から鳴らす */
  S.gbox = null; S.gboxing = true; SFX.box(); draw();
  /* 動く景色があるときは、それが箱の開く芝居そのもの（2026-09-26）。
     4秒流して最後のコマで止まり、そのまま札の背景になる。
     動画が無ければ、これまでどおり短く光らせるだけ */
  const mv = bgVideoUrl('gacha_open');
  if (mv && GVID) await playOnce(GVID, 4300);
  else {
    const best = r.items.reduce((a, x) => (RAR.indexOf(x.rarity) < RAR.indexOf(a) ? x.rarity : a), 'N');
    await sleep(RAR.indexOf(best) <= 1 ? 1200 : 750);
  }
  S.gboxing = false;
  if (S.gpre) { await Promise.race([S.gpre, hold(2500)]); S.gpre = null; }
  startReveal(r);
}
/* ---- 一体ずつの見せ場（2026-09-26）----
   一連でも十連でも、出るのは一体ずつ。ふれるたび次へ。
   出すのは「札」「名」「位」の三つだけ。ヘッダーも下の帯も引く釦も消す。
   位は左上に大きく置いて、出るたびに飛び込ませる */
/* ---- 前触れと、最後の一枚での色変わり（2026-09-26）----
   十連は「いちばん良い一体」を最後に回す。開けたあと 札を見ているあいだ、
   SSR以上が入っていれば画面のふちに金のもやを残しておく（＝前触れ）。
   URが入っていても前触れは金のまま。だから最後の一枚の直前に
   金が虹へ割れる瞬間が生まれる。嘘はついていないのに裏切れる、というのが狙い。
   SSR止まりのときも同じ間で金が燃え上がるので、燃え上がったこと自体は手がかりにならない。 */
const RAR_TOP = list => list.reduce((a, x) => (RAR.indexOf(x.rarity) < RAR.indexOf(a) ? x.rarity : a), 'N');
// 素の待ち（合戦の速さに引きずられたくないので sleep は使わない）
const hold = ms => new Promise(r => setTimeout(r, ms));
/* 引いた子の絵を、見せ場が始まる前にぜんぶ読んでおく（2026-09-30）。
   これをしないと、位の印だけが先に飛び込んで札が遅れて出る。
   裏もここで読む。あとで札を押したときに待たされないため */
function preloadPull(r) {
  const urls = [];
  for (const x of (r && r.items) || []) {
    for (const u of [cardUrl(x.no, 'front'), cardUrl(x.no, 'back'), cardPatchUrl(x.no), rarUrl(x.rarity)])
      if (u) urls.push(u);
  }
  return Promise.all([...new Set(urls)].map(u => new Promise(res => {
    const im = new Image(); im.onload = res; im.onerror = res; im.src = u;
  })));
}
function startReveal(r) {
  S.gacha = null; S.gopen = true;
  const list = r.items.slice();
  /* いちばん良い一体を最後へ。同じ位が複数あるときは先に出たほうを残す */
  if (list.length > 1) {
    const top = RAR_TOP(list);
    const at = list.findIndex(x => x.rarity === top);
    if (at >= 0 && at !== list.length - 1) list.push(list.splice(at, 1)[0]);
  }
  const top = RAR_TOP(list);
  /* URのうち4回に1回は「はじめから虹」（2026-09-26）。
     いつも金から始まると、金の間がただの待ちになって意味を失う。
     たまに即 虹が立つから「金で始まった＝まだ分からない」が本物になる。
     御籤番号から決めているので、同じ番号なら同じ出方になる */
  const sugu = top === 'UR' && (idHash(r.ticket) % 4 === 0);
  S.rv = { list, i: 0, res: r, omen: (top === 'SSR' || top === 'UR') ? '金' : null, ig: null, sugu };
  const r0 = list[0].rarity;
  SFX.rare(r0);                    // 位ごとの音（2026-09-28）
  if (r0 === 'UR' || r0 === 'SSR') { try { ultFlare(); } catch { /* 盤面が無くても進む */ } }
  /* 一連は前触れの間が無いので、その場で燃え上がらせてから出す */
  if (list.length === 1 && (r0 === 'SSR' || r0 === 'UR')) { igniteThen(r0); return; }
  draw();
}
/* 金が立ち上がり、URのときだけ途中で虹へ割れる。
   「はじめから虹」のときは金を挟まず、短く強く出す。終わったら札を出す */
async function igniteThen(tier, advance) {
  if (!S.rv) return;
  const sugu = tier === 'UR' && S.rv.sugu;
  S.rv.ig = tier; draw();
  try { ultFlare(); } catch { /* 盤面が無くても進む */ }
  await hold(tier === 'UR' ? (sugu ? 850 : 1150) : 700);
  if (!S.rv) return;
  S.rv.ig = null;
  if (advance) S.rv.i++;
  SFX.rare(S.rv.list[S.rv.i].rarity);   // 位ごとの音（2026-09-28）
  draw();
}
function revealView(rv, bgEl) {
  /* 燃え上がっている最中は、札を出さずに光だけ見せる */
  if (rv.ig) {
    const sugu = rv.ig === 'UR' && rv.sugu;
    return el('div', { class: 'reveal ig lv-' + rv.ig },
      bgEl || null,
      el('div', { class: 'rvig ' + (rv.ig === 'UR' ? (sugu ? 'nizi sugu' : 'nizi') : 'kin') },
        sugu ? null : el('i', { class: 'k' }),
        rv.ig === 'UR' ? el('i', { class: 'n' }) : null));
  }
  const x = rv.list[rv.i];
  const c = charOf(x.no) || {};
  const art = cardArt(c);
  /* 位ごとの見せ場の動画（2026-09-26）。fx/rar_<位>.mp4 を置くとそちらが出る。
     黒地の絵を screen で重ねるので、透けた動画でなくてよい。
     置いていない位は これまでの CSS の光のまま（絵が無くても動く） */
  const fxv = fxVideoUrl('rar_' + x.rarity);
  /* 前触れ：まだ最後の一枚に着いていないあいだ、画面のふちに金のもやを残す */
  const omen = rv.omen && rv.i < rv.list.length - 1 ? ' omen' : '';
  return el('div', { class: 'reveal lv-' + x.rarity + (fxv ? ' movie' : '') + omen, onclick: nextReveal },
    bgEl || null,
    /* 節は毎回あたらしく作る。使い回すと頭から流れ直さないため */
    fxv ? el('video', { class: 'rvfx', src: fxv, autoplay: true, muted: true,
      playsinline: true, preload: 'auto', tabindex: -1, 'aria-hidden': 'true' }) : null,
    /* 位ごとの一閃（SSR以上だけ。画面ぜんぶが一瞬光る） */
    el('div', { class: 'rvflash' }),
    el('div', { class: 'rvstage' },
      /* 位（レアリティ）。札の20px上に大きく、稲妻のように飛び込む（2026-09-26） */
      el('div', { class: 'rvrar r-' + x.rarity }, rarTag(x.rarity, 'huge')),
      el('div', { class: 'rvcard' },
        el('div', { class: 'rvburst' }),
        el('div', { class: 'rvring' }),
        /* keepImg を使わないのは、毎回あたらしい節にして動きを出しなおすため。
           絵が読めなかったら、その場で属性色の札に差し替える（絵が無くても動く） */
        art ? el('img', { class: 'rvart', src: art, alt: c.name || '',
                onerror: e => { const box = e.target.parentNode; e.target.remove();
                  if (box) box.append(el('div', { class: 'rvfall', style: chipStyle(c) })); } })
            : el('div', { class: 'rvfall', style: chipStyle(c) }))),
    el('b', { class: 'rvname' }, c.name || ''),
    /* 十連のときだけ、右下に「スキップ」（2026-09-30）。
       一体ずつ見たくない人のために、そのまま並びの画面へ飛ばす */
    rv.list.length > 1
      ? el('button', { class: 'rvskip', onclick: e => { e.stopPropagation(); skipReveal(); } }, 'スキップ')
      : null);
}
function skipReveal() {
  const rv = S.rv; if (!rv) return;
  SFX.pick();
  S.rv = null;
  S.rvall = rv.res; S.rvSeen = false;
  draw();
}
function nextReveal() {
  const rv = S.rv;
  if (!rv || rv.ig) return;              // 燃えている最中は飛ばせない
  SFX.pick();
  if (rv.i < rv.list.length - 1) {
    const nx = rv.list[rv.i + 1].rarity;
    /* これから出るのが最後の一枚で、それがSSR以上なら 先に燃え上がらせる */
    if (rv.i + 1 === rv.list.length - 1 && (nx === 'SSR' || nx === 'UR')) {
      igniteThen(nx, true);
      return;
    }
    rv.i++;
    SFX.rare(nx);                   // 位ごとの音（2026-09-28）
    if (nx === 'UR' || nx === 'SSR') { try { ultFlare(); } catch { /* 盤面が無くても進む */ } }
    draw();
    return;
  }
  /* 見終わった。一連はガチャの入口へ、十連は締めの一覧へ */
  S.rv = null;
  if (rv.list.length > 1) { S.rvall = rv.res; S.rvSeen = false; }
  else { S.gacha = null; S.gopen = false; }
  draw();
}
/* ---- 十連の締め（2026-09-26）----
   出た10体を並べるだけ。引く釦もおみくじの帯も、下の帯も出さない。
   いちばん位の高い一体だけ縁取って光らせる。ふれるとガチャの入口へもどる */
let rvChime = 0;              // 並びの音の通し番号。画面を離れたら古い音は鳴らさない
function revealAll(res) {
  const items = res.items;
  const bestR = items.reduce((a, x) => (RAR.indexOf(x.rarity) < RAR.indexOf(a) ? x.rarity : a), 'N');
  const bestI = items.findIndex(x => x.rarity === bestR);
  const tut = S.screen === 'tutorial';
  const n = items.length;
  const price = n === 1 ? PRICE.single : PRICE.ten;
  /* 一枚ずつずらして出すのは、出たての一度だけ（2026-09-28）。
     札を押して閉じるたびに出直しの動きが走ると、目がちらつく */
  const fresh = !S.rvSeen;
  S.rvSeen = true;
  /* 並ぶ札に合わせて位の音を鳴らす（2026-09-30）。
     スキップで飛ばしても、一枚ずつに音が付くので無音にならない。
     間は札の出だしと同じ100ミリ秒。SFX.rare は前の音を止めてから鳴らすので、
     ぱらぱらと札が落ちて、最後にいちばん良い位が鳴り残る。
     いちばん良い札が途中にいるときは、締めにもう一度だけ鳴らす */
  if (fresh) {
    const tok = ++rvChime;
    items.forEach((x, i) => setTimeout(() => {
      if (tok !== rvChime || !S.rvall) return;
      SFX.rare(x.rarity);
    }, 140 + i * 100));
    if (bestI < n - 1 && RAR.indexOf(bestR) <= 2) setTimeout(() => {
      if (tok !== rvChime || !S.rvall) return;
      SFX.rare(bestR);
    }, 140 + n * 100 + 160);
  }
  /* 一枚ぶんの札 */
  const cell = (x, i) => {
    const c = charOf(x.no) || {};
    const art = cardArt(c);
    const box = el('div', {
      class: 'rvg lv-' + x.rarity + (i === bestI ? ' top' : '') + (art ? ' art' : '') + ' tapc',
      /* 一気には出さず、0.1秒ずつずらして一枚ずつ出す（2026-09-26）。
         二度目からは動かさないが、`.rvg` は opacity:0 から動きで浮かび上がる作りなので、
         動きを止めるだけだと札が消えたままになる（2026-09-28 に踏んだ）。
         止めるときは、その動きの終わりの姿（見えている・傾きなし）も一緒に置く */
      style: fresh ? `animation-delay:${i * 100}ms`
                   : 'animation:none;opacity:1;transform:none',
      title: `${c.name || ''} のカードを見る`,
      /* 出たその場で札の中身を確かめられる（2026-09-28）。
         どんな技を持った子なのか、画面を移らずに見たい */
      onclick: () => { if (c.no != null) openCard(c); },
    });
    if (art) {
      box.append(el('img', { class: 'rvgi', src: art, alt: c.name || '',
        /* 絵が読めなければ属性色の札に落ちる（絵が無くても動く） */
        onerror: e => { e.target.remove(); box.classList.remove('art');
          box.append(el('span', { class: 'f', style: chipStyle(c) }),
                     el('span', { class: 'n' }, c.name || '')); } }));
    } else {
      box.append(el('span', { class: 'f', style: chipStyle(c) }),
                 el('span', { class: 'n' }, c.name || ''));
    }
    return box;
  };
  /* 上から 3枚・4枚・3枚。まん中の段をいちばん広くして、菱形に見せる（2026-09-26） */
  const ROWS = [[0, 3], [3, 7], [7, 10]];
  return el('div', { class: 'rvall' },
    /* 右上に石の残り */
    el('div', { class: 'rvstone' }, curIcon('stone'), el('b', {}, num(stones()))),
    el('div', { class: 'rvgrid' },
      ROWS.map(([a, b]) => {
        const row = items.slice(a, b);
        return row.length ? el('div', { class: 'rvrow' }, row.map((x, j) => cell(x, a + j))) : null;
      })),
    /* おみくじの帯（天井）は 札の下に敷く。節目の褒美をもらっていたら、その下に一行 */
    el('div', { class: 'rvbar' }, pityBar(), giftRow(res)),
    el('div', { class: 'rvacts' },
      el('button', { class: 'rvb back', onclick: tut ? tutGoHome : closeRvAll },
        tut ? '城へ戻る' : 'もどる'),
      tut ? null : el('button', { class: 'rvb again', onclick: againPull },
        el('b', {}, n === 1 ? 'もう一祈り' : 'もう十連'),
        el('span', {}, `${num(price)} 石`))));
}
/* 帯の節目でもらったもの（2026-09-26）。もらった引きのときだけ出す */
function giftRow(res) {
  const g = res && res.gifts;
  if (!g) return null;
  const ks = Object.keys(g);
  if (!ks.length) return null;
  return el('div', { class: 'rvgift' }, ks.map(k => {
    const u = itemUrl(k);
    return el('span', { class: 'gf' },
      u ? el('img', { src: u, alt: k }) : null,
      el('b', {}, k), el('i', {}, `×${g[k]}`));
  }));
}
/* 締めの画面から、そのままもう一度引く（2026-09-26）。
   石が足りなければ、これまでどおり石を買う札へ案内する */
function againPull() {
  const res = S.rvall;
  const n = (res && res.items.length) || 10;
  const price = n === 1 ? PRICE.single : PRICE.ten;
  if (!P.firstFree && stones() < price) {
    S.rvall = null; S.gacha = null; S.gopen = false;
    S.shop = true; SFX.pick(); draw(); return;
  }
  S.rvall = null; S.gacha = null;
  doPull(n);
}
function closeRvAll() {
  const res = S.rvall;
  S.rvall = null;
  /* はじまりの十連だけは「城へ戻る」を踏ませたいので、これまでの札にもどす */
  if (S.screen === 'tutorial') S.gacha = res;
  else { S.gacha = null; S.gopen = false; }
  SFX.pick(); draw();
}

async function doPull(count, noDup) {
  miBump('gacha');   // お役目の数（2026-09-24）
  /* くじを引く音は、ふだんの押す音と同じにした（2026-09-30）。
     専用の se_pull は使わなくなったので、音源ごと app/_to_delete/audio へ移した */
  SFX.pick();
  /* いま選んでいるくじの表から引く（2026-09-28）。URだけ くじごとに絞られている */
  const BASE = poolOf(curGacha(), POOL);
  let pool = BASE;
  if (noDup) {
    pool = {};
    for (const r2 of RAR) {
      const rest = BASE[r2].filter(c => !owns(c.no));
      pool[r2] = rest.length ? rest : BASE[r2];
    }
  }
  const r = pull(count, pool, curGacha().id, { ticket: !!curGacha().ticket });
  if (!r) return;
  const pre = preloadPull(r);   // 絵の先読みは、芝居のあいだに裏で走らせる（2026-09-30）
  /* 宝箱があるときは、そちらに預けて手を止める（2026-09-26） */
  /* みくじの音（SFX.pull）だけでよい。ここで SFX.pick を重ねると、
     画面が切り替わった直後に「かちっ」と鳴って耳につく（2026-09-30 に外した） */
  if (uiUrl('gacha_box')) { S.gacha = null; S.gbox = r; S.gpre = pre; S.gopen = true; draw(); return; }
  S.gacha = null; draw();
  // 巻物が飛んで開く
  const best = r.items.reduce((a, x) => (RAR.indexOf(x.rarity) < RAR.indexOf(a) ? x.rarity : a), 'N');
  const fx = el('div', { class: 'omikuji lv-' + best },
    el('div', { class: 'scroll' }), el('div', { class: 'glow' }));
  $('#app').append(fx);
  await sleep(RAR.indexOf(best) <= 1 ? 1500 : 1000);
  if (best === 'UR' || best === 'SSR') { try { ultFlare(); } catch { /* 盤面が無くても進む */ } }
  await Promise.race([pre, hold(2500)]);   // 絵が揃うまで待つ。遅ければ諦めて進む
  fx.remove();
  S.gacha = r; draw();
  $('.result2')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ---------------- 編成 ---------------- */
/* 部隊をまるごと空にする＝部隊解散（2026-09-23）。取り返しはつくが、一応たずねる */
function disbandSheet() {
  const q = P.squads[P.active];
  const close = () => { S.disband = false; draw(); };
  return el('div', { class: 'sheet', onclick: e => { if (e.target.classList.contains('sheet')) close(); } },
    el('div', { class: 'card2' },
      el('b', { class: 'mittl' }, `「${q.name}」を解散する`),
      el('p', { class: 'note' }, `${q.nos.length}体を出陣から外す。武将そのものは失わない`),
      el('div', { class: 'matpick' }, q.nos.map(n => {
        const o = charOf(n); if (!o) return null;
        return el('div', { class: 'mc on' }, cardImg(o), el('span', { class: 'mcn' }, o.name.slice(0, 5)));
      })),
      el('div', { class: 'acts2' },
        el('button', { class: 'ghost sm', onclick: close }, 'やめる'),
        el('button', {
          class: 'go sm danger',
          onclick: () => {
            q.nos = []; q.general = null;
            S.slots = [null, null, null, null, null];
            S.disband = false; S.pickMsg = '';
            saveSquads(); SFX.pick(); draw();
          },
        }, 'すべて外す'))));
}

function screenTeam() {
  // 編成に並ぶのは所持している武将だけ（2026-09-21）
  const mine = C.filter(c => owns(c.no));
  const on = c => S.picked.some(p => p.no === c.no);
  const sorted = pickApply(mine, PF_TEAM);

  const q0 = P.squads[P.active];
  /* これから出る戦の敵に同じ人物がいるなら、その札も選べない（2026-09-23）。
     S.foe は出陣ページが置く。全国を経ていなければ空 */
  const foeSet = new Set((S.foe && S.foe.origins) || []);
  const foeNg = c => !!(c.origin && foeSet.has(c.origin));
  const blocked = c => !on(c) && (!!sameOriginIn(q0.nos, c.no) || foeNg(c));
  const grid = el('div', { class: 'grid tgrid' }, sorted.map(c => {
   const art = cardArt(c);
   const ng = blocked(c);
   return el('button', {
    class: 'card' + (on(c) ? ' on' : '') + (art ? ' art' : '') + (ng ? ' samelord' : ''),
    title: ng ? (foeNg(c) ? `${c.origin} は敵として出ている` : `${c.origin} はすでに出陣している`) : c.name,
    onclick: () => { if (heldJust()) return; togglePick(c); },
    ...holdCard(c),
   },
    ng ? el('span', { class: 'sameltag' + (foeNg(c) ? ' foe' : '') }, foeNg(c) ? '敵に出ている' : '同じ武将') : null,
    art ? cardImg(c) : null,
    !art && S.general === c.no ? el('span', { class: 'gen' }, '大将') : null,
    art ? null : rarTag(c.rarity, 'sm corner'),
    art ? null : el('div', { class: 'nm' }, c.name),
    art ? null : el('div', { class: 'meta' }, attrTag(c.attr, 'sm'), el('span', {}, c.cost)),
    /* 出陣しているかは金の枠と明るさで分かるので、文字は重ねない。
       印を出すのは総大将だけ（部隊にひとり）。右下の署名の上に小さく。 */
    art && S.general === c.no ? el('span', { class: 'onmark gn' }, '大将') : null);
  }));

  const over = cost() > costMax();
  const dups = dupOrigins(q0.nos);        // 古い保存に残っている重なり
  return {
    body: el('div', {},
      el('h2', {}, '部隊の名前'),
      /* 名前の欄を短くして、同じ行に「部隊を解く」を置く（2026-09-23）。
         5人を1枚ずつ外すのが面倒だという話。押すと確認を出してから空にする */
      el('div', { class: 'namerow' },
        el('input', {
          class: 'nameIn', type: 'text', maxlength: 12, value: S.name,
          oninput: e => { P.squads[P.active].name = e.target.value.slice(0, 12); saveSquads(); },
        }),
        el('button', {
          class: 'ghost sm disband', disabled: q0.nos.length ? null : true,
          onclick: () => { S.disband = true; SFX.pick(); draw(); },
        }, '部隊解散')),
      S.disband ? disbandSheet() : null,
      /* 絞込みは図鑑・育成とそろえた（2026-09-30）。
         題を付けずに一行ずつ並べたので、前より場所を取らない */
      pickRows(PF_TEAM),
      el('h2', {}, `武将を選ぶ（${S.picked.length}/5）　所持 ${P.own.filter(hasCard).length}体`),
      !mine.length ? el('button', {
        class: 'notice', onclick: () => { S.screen = 'gachalist'; draw(); },
      }, el('b', {}, '武将がまだおらぬ'), el('span', {}, 'わんこみくじで引いてから編成する')) : null,
      el('p', { class: 'note', style: 'font-size:11px;color:var(--text3);margin:-4px 0 8px' },
        'タップで出陣に入れる／外す　／　長押しでカードを表裏で見る'),
      el('p', { class: 'note', style: 'font-size:11px;color:var(--text3);margin:-6px 0 8px' },
        '同じ武将（元になった人物が同じ）は、一隊にひとりまで'),
      (() => {
        const hit = q0.nos.map(charOf).filter(c => c && foeNg(c));
        return hit.length ? el('div', { class: 'shopmsg warn' },
          '次の戦の敵に同じ武将が出ておる：' + hit.map(c => `${c.name}（${c.origin}）`).join('　')
          + '　タップで外せる') : null;
      })(),
      dups.length ? el('div', { class: 'shopmsg warn' },
        '同じ武将が重なっておる：' + dups.map(d =>
          `${d.origin}（${d.nos.map(n => (charOf(n) || {}).name).join('・')}）`).join('　') +
        '　どちらかを外すまで陣形へ進めぬ') : null,
      S.pickMsg ? el('div', { class: 'shopmsg' }, S.pickMsg) : null,
      /* おすすめ編成（2026-09-23）。コスト内で総戦力がいちばん高くなる5人に組み替える。
         いま敵に出ている人物は外して考える */
      el('button', {
        class: 'ghost wide reco', disabled: mine.length ? null : true,
        onclick: () => {
          const pool = mine.filter(c => !foeNg(c));
          const best = bestTeam(pool);
          if (!best.length) { S.pickMsg = 'おすすめを組めなんだ'; SFX.pick(); draw(); return; }
          q0.nos = best.map(c => c.no);
          S.general = best.reduce((a, c) => (powerOf(c) > powerOf(a) ? c : a), best[0]).no;
          S.slots = [null, null, null, null, null];
          S.pickMsg = `総戦力 ${num(best.reduce((a, c) => a + powerOf(c), 0))} の編成に組み替えた`;
          saveSquads(); SFX.win ? SFX.win() : SFX.pick(); draw();
        },
      }, el('i', {}, '★'), 'おすすめ編成（総戦力が最大）'),
      grid,
      el('div', { class: 'acts' },
        el('button', { class: 'ghost', onclick: () => { S.screen = 'squads'; draw(); } }, '部隊へ'),
        el('div', { class: 'info' },
          el('span', { class: 'ic' }, el('b', { class: over ? 'over' : '' }, `${cost()}`), ` / ${costMax()}`,
            costBuff() ? el('em', { class: 'cbuff' }, `+${costBuff().add}　あと${costBuffLeft()}`) : null),
          // 総戦力＝5つの値を育てたぶんこみで足したもの（2026-09-23）
          el('span', { class: 'ip' }, el('em', {}, '総戦力'), el('b', {}, num(teamPower())))),
        el('button', {
          class: 'go', disabled: !(S.picked.length >= 1 && !over && !dups.length) || null,
          onclick: () => { S.screen = 'form'; draw(); },
        }, '陣形へ'))),
    nav: true,
  };
}

/* ---------------- 陣形・ステージ ---------------- */
function formPreview(name, w) {
  const W = RULES.board.width, H = RULES.board.height, D = RULES.board.deployDepth || 4;
  const xOff = Math.floor((W - 5) / 2);
  const cells = RULES.formations[name].cells;
  // 大きさを選べるようにした（2026-09-27）。部隊の一覧では小さく、題の横に置く
  const gp = (w || 74) < 50 ? 1 : 2;
  const g = el('div', { style: `display:grid;grid-template-columns:repeat(5,1fr);gap:${gp}px;width:${w || 74}px` });
  // 自軍は盤面の手前（下）から始まるので、前衛（fy=0）がいちばん上に来る（2026-09-21）
  const set = new Set(cells.map(([fx, fy]) => fy * 5 + fx));
  for (let y = 0; y < D; y++) for (let x = 0; x < 5; x++)
    g.append(el('div', { style: `aspect-ratio:1;border-radius:2px;background:${set.has(y * 5 + x) ? 'var(--gold)' : '#ffffff12'}` }));
  return g;
}
// 陣形の枠に誰を置くかをドラッグで決める（2026-09-20）
// cells の並びがそのまま slots の並び。engine 側は team.slots をそのまま使う。
let DRAG = null;
/* 小さな丸に入れる顔（2026-09-25）。
   表情の「笑顔」→ コマ絵 → カードの顔まわり → 属性の色 の順に落ちる。
   表情の絵は顔だけを描いてあるので、小さな枠でいちばん収まりがよい。
   笑顔にしているのは、ここがプレイヤーの顔（ヘッダー・友の一覧）だから。
   ふだん目に入るところは、機嫌のいい顔でいてほしい */
function faceStyle(c) {
  if (!c) return '';
  const face = faceUrl(c.no, '笑顔') || faceUrl(c.no, '通常');
  if (face) return `background-image:url(${face});background-size:112%;background-position:50% 44%`;
  if (pawnUrl(c.no)) return chipStyle(c);
  const card = cardArt(c);
  if (card) return `background-image:url(${card});background-size:230%;background-position:47% 24%`;
  return chipStyle(c);
}
/* コマ絵の下地（2026-09-26）。
   属性の色（智将の藤色など）を敷いていたが、金と黒漆の画面で浮いていた。
   和紙のようなベージュの照りに変え、属性は枠や字のほうで見せる。
   絵がまだ無い武将だけは、これまでどおり属性の色の札に落とす */
const CHIP_BG = 'linear-gradient(160deg,#f6ecd8,#e2cfa8 52%,#c9b184)';
function chipStyle(c) {
  const url = pawnUrl(c.no);
  const bg = { 猛将: '#d9544d', 智将: '#7a7ee0', 守将: '#4fa36b', 仁将: '#d98fc0', 神速: '#e0c04a' }[c.attr] || '#888';
  return url ? `background-image:url(${url}),${CHIP_BG}` : `background-color:${bg}`;
}
/* ================= キャラカードの共通部品（2026-09-21）=================
   図鑑のカード表示が良かったので、武将を見せる画面すべてで同じ絵を使う。
   カードがまだ無い番号は、これまでどおり属性色の札に落ちる。
   コマ画像のままにしてあるのは、小さすぎてカードが読めない場所だけ
   （盤面のコマ／陣形の配置枠／部隊メンバーの丸／ヘッダーの顔）。 */
/* まだ手に入れていない武将を表す仮の1体（2026-09-21）。
   これを openCard に渡すと「未奉公」のカードが表裏で開く */
const UNKNOWN = { no: '未奉公', name: '未奉公', rarity: null, attr: null };
function cardArt(c) {
  if (!c || c.no == null) return null;
  return c.no === '未奉公' ? unknownCardUrl('front') : cardUrl(c.no, 'front');
}
function openCard(c, ro) { if (!c) return; S.detail = c.no; S.side = null; S.detailRO = !!ro; draw(); }
/* 育成の画面の顔を押すと、その武将のカードが開く（2026-09-23） */
function faceBtn(c) {
  return el('button', {
    class: 'f faceb', style: chipStyle(c), title: `${c.name} のカードを見る`,
    onclick: e => { e.stopPropagation(); SFX.pick(); openCard(c); },
  });   /* 「札」の印は外した（2026-09-24）。押したら出るのは見ればわかるので、
           顔の上に飾りを増やさない */
}
// カード1枚ぶんの絵。読み込めなかったら、その場で札に差し替える
function cardImg(c) {
  return keepImg({
    /* iPhone の Safari は、大きな絵をたくさん並べると読み込みを投げ出す（2026-09-30）。
       あとまわし（lazy）に加えて、組み立てと別の筋で解かせる（async） */
    class: 'cf', src: cardArt(c), alt: c.name || '', loading: 'lazy', decoding: 'async',
    onerror: e => {
      const box = e.target.parentNode; e.target.remove();
      if (!box) return;
      box.classList.remove('art');
      box.prepend(el('span', { class: 'f', style: chipStyle(c) }));
    },
  });
}
/* カードの操作（2026-09-21 改訂）
   絵の上にも下にもボタンを置かない。カードは絵だけで見せる。
     1タップ  … 出陣に入れる／外す（はじまりの一騎では、その一騎を選ぶ）
     長押し   … 表裏のポップアップ。総大将もそこで決める
   長押しで開いたあとは押していた札が作り直されるので、click が
   どこに飛んでも拾えるよう、時刻で見分ける。 */
const HOLD_MS = 420;
let HOLD_T = null, HELD_AT = 0;
function holdCard(c) {
  const stop = () => { clearTimeout(HOLD_T); HOLD_T = null; };
  return {
    onpointerdown: () => { stop(); HOLD_T = setTimeout(() => {
      HOLD_T = null; HELD_AT = Date.now(); SFX.pick(); openCard(c); }, HOLD_MS); },
    onpointerup: stop, onpointerleave: stop, onpointercancel: stop,
    // 長押しの途中でブラウザのメニューが出ないようにする
    oncontextmenu: e => { e.preventDefault(); stop(); openCard(c); },
  };
}
// 長押しで開いた直後の click は、押していた札の選択として扱わない
const heldJust = () => Date.now() - HELD_AT < 600;

function startDrag(e, c, from) {
  e.preventDefault();
  const g = el('div', { class: 'draghost', style: chipStyle(c) });   // フッターの button.ghost と衝突しない名前にする
  document.body.append(g);
  const move = ev => { g.style.left = ev.clientX + 'px'; g.style.top = ev.clientY + 'px';
    const cell = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('.pc.slot');
    for (const n of document.querySelectorAll('.pc.over')) n.classList.remove('over');
    if (cell) cell.classList.add('over');
  };
  const up = ev => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    g.remove();
    for (const n of document.querySelectorAll('.pc.over')) n.classList.remove('over');
    const cell = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('.pc.slot');
    const to = cell ? +cell.dataset.slot : null;
    place(c.no, from, to);
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  move(e);
}
function place(no, from, to) {
  const cells = RULES.formations[S.form].cells;
  const slots = Array.from({ length: cells.length }, (_, i) => S.slots[i] ?? null);
  if (to == null) {                       // 枠の外に落としたら控えに戻す
    if (from != null) slots[from] = null;
  } else {
    const swapWith = slots[to];
    slots[to] = no;
    if (from != null) slots[from] = swapWith ?? null;   // 枠どうしは入れ替え
    else for (let i = 0; i < slots.length; i++) if (i !== to && slots[i] === no) slots[i] = null;
  }
  S.slots = slots;
  SFX.pick();
  draw();
}
function placeGrid() {
  const cells = RULES.formations[S.form].cells;
  const D = RULES.board.deployDepth || 4;
  const g = el('div', { class: 'place' });
  const slotOf = new Map();     // 「列,行」→ slot番号
  // 上の行ほど敵に近い（前衛）。盤面と同じ向きで置ける（2026-09-21）
  cells.forEach(([fx, fy], i) => slotOf.set(fx + ',' + fy, i));
  for (let row = 0; row < D; row++) for (let col = 0; col < 5; col++) {
    const si = slotOf.get(col + ',' + row);
    const pc = el('div', { class: 'pc' + (si != null ? ' slot' : '') });
    if (si != null) {
      pc.dataset.slot = si;
      const no = S.slots[si];
      const c = no != null ? S.picked.find(p => p.no === no) : null;
      if (c) {
        const u = el('div', {
          class: 'u' + (S.general === c.no ? ' gen' : ''), style: chipStyle(c),
          onpointerdown: e => startDrag(e, c, si),
          oncontextmenu: ev => { ev.preventDefault(); S.general = c.no; draw(); },
        }, el('span', {}, c.name.slice(0, 4)));
        pc.append(u);
      }
    }
    g.append(pc);
  }
  return g;
}
/* ---- 得意／苦手（2026-09-24） ----
   武将ごとに 得意な地形2・得意な陣形1／苦手な地形2・苦手な陣形1 を持つ。
   地形は立っているマスで毎ターン見るので、動けば変わる。陣形は出陣で決まる。 */
const terLabel = code => { const t = RULES.terrain?.types?.[code]; return (t && (t.short || t.label)) || code; };
/* ---- 天候の札（2026-09-24）----
   app/assets/ui/weather_<空>.png を置くと、字の左に絵が付く。
   ファイル名だけ「曇り」なので、そこは読み替える。20×20のドット絵なので、
   ぼかさずそのまま出す（style.css の image-rendering:pixelated）。 */
const WFILE = { 晴: '晴', 曇: '曇り', 雨: '雨', 嵐: '嵐', 雪: '雪' };
const weatherUrl = w => uiUrl('weather_' + (WFILE[w] || w));
function wTag(w, cls) {
  const u = weatherUrl(w);
  // 絵があるときは絵だけ。字も枠も出さない（2026-09-24）
  if (u) return el('span', { class: 'wico' + (cls ? ' ' + cls : ''), title: w },
    keepImg({ class: 'wi', src: u, alt: w }));
  return el('span', { class: 'wtag w' + w + (cls ? ' ' + cls : ''), title: w }, w);
}
/* 陣形の「何が得意な形か」（2026-09-24）。名前だけだと何が起きるか分からないので添える */
const formTag = f => (RULES.formations?.[f]?.tag) || '';
/* カードや帯に出す短い呼び名（「重視」を落としたもの）。V字→守備、凹→奇襲 */
const formShort = f => (RULES.formations?.[f]?.tagShort) || formTag(f).replace('重視', '') || f || '';
const formName = f => (f && formTag(f)) ? `${f}　${formTag(f)}` : (f || '');
const groundOf = c => (c && c.ground) || null;
const goodTer = c => (groundOf(c)?.good || []).map(terLabel);
const badTer  = c => (groundOf(c)?.bad  || []).map(terLabel);
/* 得意／苦手の一行。カードにも育成にも出す */
function groundRow(c) {
  const g = groundOf(c);
  if (!g) return null;
  return el('div', { class: 'gdrow' },
    el('div', { class: 'gd good' },
      el('b', {}, '得意'),
      el('span', {}, goodTer(c).join('・')),
      el('em', {}, g.goodWeather || '—'),
      el('i', { title: formName(g.goodForm) }, formShort(g.goodForm))),
    el('div', { class: 'gd bad' },
      el('b', {}, '苦手'),
      el('span', {}, badTer(c).join('・')),
      el('em', {}, g.badWeather || '—'),
      el('i', { title: formName(g.badForm) }, formShort(g.badForm))));
}

function screenForm() {
  const cells = RULES.formations[S.form].cells;
  const benched = S.picked.filter(c => !S.slots.includes(c.no));
  return {
    body: el('div', {},
      el('h2', {}, '陣形'),
      /* 陣形の札は絵だけにした（2026-09-24）。
         名前・性格・誰が得意かは、右上の ⓘ を押すと出る。
         盤面の形を見比べるのが選び方の本筋なので、文字は札から外している。 */
      el('div', { class: 'grid formgrid', style: 'grid-template-columns:repeat(auto-fill,minmax(104px,1fr))' },
        FORMS.map(f => el('button', {
          class: 'fcard fpick' + (S.form === f ? ' on' : ''),
          onclick: () => { S.form = f; S.slots = []; SFX.pick(); draw(); },
        }, formPreview(f), el('span', { class: 'ftg' }, formTag(f))))),

      el('h2', {}, '配置'),
      el('p', { style: 'font-size:11px;color:var(--text3);margin:-4px 0 6px' },
        '武将をドラッグして枠に置く。枠どうしのドラッグで入れ替え。長押しで総大将'),
      placeGrid(),
      benched.length ? el('div', { class: 'bench' }, benched.map(c => el('div', {
        class: 'u' + (S.general === c.no ? ' gen' : ''), style: chipStyle(c),
        onpointerdown: e => startDrag(e, c, null),
        oncontextmenu: ev => { ev.preventDefault(); S.general = c.no; draw(); },
      }, el('span', {}, c.name.slice(0, 4))))) : null,
      benched.length ? el('p', { style: 'font-size:11px;color:var(--text3);margin:6px 0 0' },
        '枠に入れなかった武将は、自動で空いた枠に入る') : null,

      el('div', { class: 'acts' },
        el('button', { class: 'ghost', onclick: () => { S.screen = 'team'; draw(); } }, '編成へ戻る'),
        el('div', { class: 'spacer' }),
        el('button', { class: 'go', onclick: () => { S.screen = 'squads'; draw(); } }, '保存して部隊へ'))),
    nav: true,
  };
}

/* ---------------- 戦闘 ---------------- */
let BATTLE = null;
/* 天下統一の道の敵軍（2026-09-21）
   県と段階から決まるので、同じ国に何度行っても同じ相手が出る。
   章が進むほど兵力が増え、国主戦はさらに上積みする。 */
function campSeed(id, step) {
  let h = 2166136261 >>> 0;
  const t = id + ':' + step;
  for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}
/* その戦に出る敵を、出陣の前に割り出す（2026-09-23）。
   startBattle と同じ seed から同じ rng を作るので、並ぶ顔ぶれは戦闘と一致する。
   これを使って「敵に出ている武将と同じ人物は自軍で使えない」を出陣前に止める。 */
function campFoes(pref, step) {
  let s2 = campSeed(pref.id, step) >>> 0;
  const rng = () => { s2 = (s2 + 0x6D2B79F5) >>> 0; let x = Math.imul(s2 ^ (s2 >>> 15), 1 | s2); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  return campEnemy(pref, step, rng);
}
/* 敵に出ている「元武将」の一覧 */
const foeOriginSet = foes => new Set(foes.map(c => c.origin).filter(Boolean));
/* 自軍の中で、敵と同じ人物になってしまう者 */
function foeClash(nos, foes) {
  const set = foeOriginSet(foes);
  return nos.map(charOf).filter(c => c && c.origin && set.has(c.origin));
}

/* 敵の育ちと兵力（2026-09-26 に作り直し）。
   前は「地図の東西（REGION_ORDER）」で強さを決めていたので、
   織田（愛知＝中部）で始めた人がいきなり5章目の強さと当たり、
   逆に九州で始めた人は最後までぬるい、という歪みがあった。
   いまは **はじめの国からいくつ目の章か**（chapterRank）で決める。
   あわせて、敵にも育ちを持たせた。前は素の値のままだったので、
   こちらがレベルを上げるほど一方的になっていた（実測：Lv20・魂0でも全章98〜100%勝ち）。 */
const FOE_LV   = (rank, step, last, lord) => 1 + rank * 15 + step * 7 + (last && lord ? 12 : 0);
const FOE_SOUL = rank => rank * 104;   // 土道で歩きが速くなったぶん下げた（2026-09-27）
const FOE_WANT = (rank, step, last, lord) => 560 + rank * 160 + step * 90 + (last && lord ? 180 : 0);
/* 敵1体を育てる。こちらの grownStats と同じ式（Lv1を100%として1レベル +2%）。
   魂はこちらと同じ 999 が上限。特技レベルは normals の数だけ並べて渡す。
   武将のデータに hp は無い（engine が数値から組み立てる）ので、hp は触らない */
function foeGrown(c, lv, soul, skLv) {
  const sp = Math.min(999, soul | 0);
  if (lv <= 1 && !sp && (!skLv || skLv <= 1)) return c;
  const mul = 1 + (lv - 1) * 0.02;
  const st = {};
  for (const k of ['火力', '賢さ', '防御', '回復', '速さ']) st[k] = Math.round((c.stats?.[k] || 0) * mul) + sp;
  const out = { ...c, stats: st };
  if (skLv && skLv > 1) out.skillLv = (c.normals || []).map(() => skLv);
  return out;
}
function campEnemy(pref, step, rng) {
  const rank = chapterRank(pref.region, (PREF[P.camp.start || 'aichi'] || {}).region);
  const last = step >= pref.battles - 1;                 // その県の最後の戦＝国主
  const want = FOE_WANT(rank, step, last, pref.lord);
  /* 席は5つ。ただし1章は兵力の目安（560〜920）が小さく、
     残りをならす決まりのせいで実際には4体しか立たない（2026-09-28 実測）。
     わざと3体まで減らすと、こちらの範囲攻撃が散らずに相打ちが増え、
     中部1章の勝率は 85.3% → 81.7% と逆に下がったので5のままにする。 */
  const size = 5;
  const t = [];
  // 国主は最後の戦にだけ出す。総大将になる
  const lord = last && pref.lord ? C.find(c => c.no === pref.lord) : null;
  if (lord) t.push(lord);
  /* 国主以外は、こちらの部隊にいる人物を避けて選ぶ（2026-09-23）。
     同じ人物が両軍に立つのはおかしいが、雑兵のほうで当たるたびに
     編成をやり直させるのは煩いので、機械のほうで譲る。
     国主だけは動かせないので、そこは編成で外してもらう。 */
  const mine = new Set(((P.squads[P.active] || {}).nos || [])
    .map(n => (charOf(n) || {}).origin).filter(Boolean));
  // 残りの兵力に収まる武将だけから選ぶ。こうしないと1体目に大物を引いて席が埋まらない
  let sum = t.reduce((a, c) => a + c.cost, 0);
  /* 残りの兵力を、残りの枠でならして配る。
     こうしないと1体目に大物を引いて席が埋まらず、2体だけの軍になってしまう。
     序盤は兵力が少ないので雑兵が並び、終盤は名のある将がそろう。 */
  while (t.length < size) {
    const room = want - sum;
    const need = Math.max(1, 4 - t.length);
    const cap = t.length >= 3 ? room : Math.max(150, Math.floor(room / need));
    const cand = C.filter(c => c.cost <= Math.min(room, cap) && !t.some(x => x.no === c.no)
      && !(c.origin && mine.has(c.origin))
      && !t.some(x => x.origin && c.origin && x.origin === c.origin));   // 敵の中でも同じ人物は重ねない
    if (!cand.length) break;
    const c = cand[Math.floor(rng() * cand.length)];
    t.push(c); sum += c.cost;
  }
  const out = t.length ? t : [C.find(c => c.cost === Math.min(...C.map(x => x.cost)))];
  const lv = FOE_LV(rank, step, last, pref.lord), soul = FOE_SOUL(rank);
  return out.map(c => foeGrown(c, lv, soul));
}
// 国主の名前（いない国は野伏せり）
function lordName(pref) {
  if (pref.lord) { const c = C.find(x => x.no === pref.lord); if (c) return c.name; }
  return NO_LORD_NAME[pref.id] || (pref.name + 'の野伏せり');
}
function enemyTeam(rng) {
  // 相手はこちらと同じ合計コストに近づくようランダムに組む
  const want = Math.max(200, cost());
  const pool = C.filter(c => !S.picked.some(p => p.no === c.no));   // 同じ武将が両軍に出ると戦況が読めない
  const t = [];
  let sum = 0, guard = 0;
  while (t.length < S.picked.length && guard++ < 400) {
    const c = pool[Math.floor(rng() * pool.length)];
    if (t.some(x => x.no === c.no)) continue;
    if (sum + c.cost > want * 1.1 && t.length) continue;
    t.push(c); sum += c.cost;
  }
  return t.length ? t : C.slice(0, S.picked.length);
}
/* ---- お祭りの敵（2026-09-23）----
   級ごとに目安の兵力が決まっている。全国の道と同じで、こちらの部隊にいる人物は避ける */
/* お祭りの敵（2026-09-26 に育ちを持たせた）。
   級ごとに Lv・魂・特技レベルが上がる。超級は Lv99・魂999・特技レベル3＝こちらの上限と同じ。
   前は素の値のままで、育てた部隊には手応えが無かった */
function evEnemy(rank, rng) {
  const want = EV_POWER[rank] || 500;
  const mine = new Set(((P.squads[P.active] || {}).nos || [])
    .map(n => (charOf(n) || {}).origin).filter(Boolean));
  /* 兵力を使い切る組み方（2026-09-26 に直した）。
     前は「残りを残りの枠でならす」やり方で、超級（1200）でも
     実測 700〜1050・ほぼNの雑兵ばかりになっていた。
     いまは重いほうから、**残りの枠に最低のコストを残せるかぎり**取る。
     こうすると 1200 をきっちり使い切り、名のある将が並ぶ。 */
  const MIN = Math.min(...C.map(c => c.cost));
  const pool = C.filter(c => !(c.origin && mine.has(c.origin)));
  const t = [];
  let sum = 0;
  for (let slot = 0; slot < 5; slot++) {
    const left = 5 - t.length - 1;                       // このあとに要る枠
    const room = want - sum - left * MIN;                // ここで使ってよい上限
    const cand = pool.filter(c => c.cost <= room && !t.some(x => x.no === c.no)
      && !t.some(x => x.origin && c.origin && x.origin === c.origin));
    if (!cand.length) break;
    /* 一人目は いちばん重い将（＝そのお祭りの主）。
       のこりは「残りの兵力 ÷ 残りの枠」に近い者から選び、5人ぶんを使い切る。
       重いほうから取るだけだと、あとが 100 の雑兵で埋まって
       4人しか立たないことがあった（2026-09-26 に直した） */
    const aim = slot === 0 ? room : Math.round((want - sum) / (5 - t.length));
    let near = Infinity;
    for (const c of cand) near = Math.min(near, Math.abs(c.cost - aim));
    const best = cand.filter(c => Math.abs(c.cost - aim) === near);
    const c = best[Math.floor(rng() * best.length)];
    t.push(c); sum += c.cost;
  }
  const out = t.length ? t : C.slice(0, 5);
  return out.map(c => foeGrown(c, EV_LV[rank] || 1, EV_SOUL[rank] || 0, EV_SKILL[rank] || 1));
}

/* camp を渡すと天下統一の道の一戦になる（2026-09-21）。
   渡さなければ、これまでどおりの「戦場を選んで一戦」 */
/* spar（稽古・2026-09-24）＝友との手合わせ。{ id, pref } を渡す。
   seed に日付を混ぜるので、同じ友でも日ごとに空と顔ぶれが変わる。
   兵糧は要らない。そのかわり同じ友とは1日1回。 */
/* bout（番付・2026-09-25）＝プレイヤー同士の腕くらべ。{ npc, mine } を渡す。
   稽古と同じで必ずオート。対戦札は挑む側で1枚減らしてある */
function startBattle(camp, evb, spar, bout, tw) {
  /* 開いている札はここで全部閉じる（2026-09-24）。
     キャラカードを開いたまま出陣すると、盤面の上に札が残り続けていた */
  S.detail = null; S.fr = false; S.frId = null; S.frMsg = '';
  S.menu = false; S.news = false; S.newsId = null; S.help = false; S.bag = false;
  S.rk = false; S.rkSel = null; S.rkMsg = '';
  /* お役目の数（2026-09-24）。出陣した時点で数える。
     勝ち負けにかかわらず「挑んだ」を数えたいので、決着ではなくここ */
  miBump('battle');
  if (camp) miBump('camp');
  if (evb) miBump('ev');
  if (spar) miBump('spar');
  if (tw) miBump('battle');
  const seed = camp ? campSeed(camp.pref.id, camp.step)
             : spar ? campSeed(spar.id + ':' + today(), spar.pref.battles - 1)
             : bout ? rkSeed(bout.npc.id + ':' + today())
             : (Math.random() * 1e9) | 0;
  let s = seed >>> 0;
  const rng = () => { s = (s + 0x6D2B79F5) >>> 0; let x = Math.imul(s ^ (s >>> 15), 1 | s); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  // 大国は段どりでステージが変わる（先陣＝野 → 本陣＝川や峠 → 国主＝その国の顔）
  if (camp) S.stage = stageOf(camp.pref, camp.step);
  if (spar) S.stage = stageOf(spar.pref, spar.pref.battles - 1);   // 稽古は相手の国の地形で
  // 番付は相手ごとに地形が決まる。同じ相手なら毎回同じ景色（腕くらべなので条件を揃える）
  if (bout) S.stage = STAGES[rkSeed(bout.npc.id) % STAGES.length];
  // お祭りは級で場所が決まる（2026-09-28）。初級＝草原／中級＝河川／上級＝山岳／超級＝城郭。
  // 前はここを素通りしていたので、直前の戦の盤面を引きずっていた
  if (evb) S.stage = EV_STAGE[evb.rank] || '草原';
  /* 塔は階ごとに場所が決まっている（2026-10-01）。
     同じ階なら いつも同じ景色。何度でも挑めるので、条件がぶれては読みにならない */
  if (tw) S.stage = (towerOf(tw.f) || {}).stage || '草原';
  // 障害の置き方は種で決まる（2026-09-26）。同じ国の同じ段なら、いつも同じ盤面
  // お祭りだけは級の番号で固定し、同じ級はいつも同じ景色にする（2026-09-28）
  S.stageV = evb ? (evb.rank % stageVarCount(S.stage))
                 : tw ? (tw.f % stageVarCount(S.stage))
                 : ((seed >>> 0) % stageVarCount(S.stage));
  // 人が絡む戦だけ、相手ごと・日ごとに攻守を入れ替える（2026-09-26）
  S.stageFlip = stageFlipFor(spar, bout);
  const rules = stageRules(S.stage, S.stageV, S.stageFlip);
  let B = camp ? campEnemy(camp.pref, camp.step, rng)
            : spar ? campEnemy(spar.pref, spar.pref.battles - 1, rng)
            : bout ? rkTeamOf(bout.npc)
            : evb ? evEnemy(evb.rank, rng)
            : tw ? twEnemy(tw.f, rng) : enemyTeam(rng);
  /* 初陣だけは一対一（2026-09-30）。
     こちらは一騎しかいないのに相手が五騎では、手ざわりを覚える前に押し切られる。
     手引きの「初陣」の歩にいるあいだだけ、相手も総大将ひとりにする */
  const first = camp && guideOn() && P.gstep === GUIDE_FIGHT;
  if (first && B.length > 1) B = B.slice(0, 1);
  const bForm = FORMS[Math.floor(rng() * FORMS.length)];
  // 手動⇄オートは戦闘中に切り替えるので、編成側は常に manual 扱いで回し、
  // 実際にどちらで動くかは modes（そのターン以降この方式）で決める
  // 戦仕度で選んだ道具を、ここで使い切って開戦から効かせる（2026-09-21）
  const prep = [];
  /* 塔には陣中の品を持ち込めない（2026-10-01）。
     効き目で押し切れる場にすると、しばりを読む楽しみが消える。
     戦仕度で選んでいても、ここで使わずに手元に残す */
  for (const name of (tw ? [] : prepList())) {
    const it = ITEMS[name];
    if (!useItem(name, 1)) continue;
    prep.push({ turn: 1, name, side: 'A', stat: it.stat, pct: it.pct ? it.pct / 100 : 0, weather: it.weather });
  }
  const wSet = prep.map(x => x.weather).filter(Boolean).pop();
  S.prep = [];
  /* 稽古は必ずオート（2026-09-24）。友との手合わせは見るものにしたいので、
     手で動かせるようにはしない。切り替えの札も盤面に出さない */
  /* 初陣は手で動かすところから覚えてもらう（2026-09-30）。そのあともしばらく手動のまま */
  if (first) P.manual = true;
  BATTLE = { seed, rules, B, bForm, commands: [], modes: [{ turn: 0, manual: (spar || bout) ? false : !!P.manual }],
             shown: 0, live: null, playing: true, sel: null, busy: false, camp: camp || null,
             ev: evb || null,
             spar: spar || null,
             bout: bout || null,
             tw: tw || null,
             weather: wSet || weatherOf(seed, S.stage),
             useItems: prep.filter(x => !x.weather), prep };
  resolve();
  BATTLE.live = initLive(BATTLE.res);
  S.screen = 'battle';
  /* 開戦の札（2026-09-23）。どこの戦か・相手・空を一枚見せてから動きだす */
  S.vs = {
    // 題は「滋賀」と「決戦」に割る。あいだに家紋を挟むため（2026-09-24）
    ttlL: tw ? `${tw.f}階` : camp ? camp.pref.name : spar ? spar.pref.name : S.stage,
    ttlR: tw ? ((towerOf(tw.f) || {}).name || '試練')
        : camp ? (camp.pref.battles > 1 ? STEP_NAME[Math.min(camp.step, 2)] : '決戦')
        : spar ? (spar.duel ? '一騎打ち' : '稽古') : 'の戦',
    house: camp ? camp.pref.house : spar ? spar.pref.house : null,
    foe: (camp ? `${camp.pref.house}　` : spar ? `${spar.pref.house}　` : '') + (B[0] ? B[0].name : ''),
    w: BATTLE.weather,
  };
  SFX.start();   // 開戦の合図（2026-09-28）。開戦の札と一緒に鳴らす
  draw();
  setTimeout(() => { S.vs = null; draw(); play(); }, 1200);
}
/* その戦の天候（2026-09-21）。seed とステージから決め打ちで決まるので、
   同じ戦に何度挑んでも同じ空になる。地形によって出やすい空が違う */
const WEATHER_WEIGHT = {
  草原: { 晴: 5, 曇: 3, 雨: 2, 嵐: 1, 雪: 0 },
  山岳: { 晴: 3, 曇: 3, 雨: 1, 嵐: 1, 雪: 3 },
  河川: { 晴: 2, 曇: 3, 雨: 5, 嵐: 1, 雪: 0 },
  海:   { 晴: 3, 曇: 2, 雨: 2, 嵐: 4, 雪: 0 },
  城郭: { 晴: 5, 曇: 3, 雨: 2, 嵐: 1, 雪: 0 },
};
function weatherOf(seed, stage) {
  const w = WEATHER_WEIGHT[stage] || WEATHER_WEIGHT['草原'];
  let h = (seed ^ 0x9e3779b9) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x2545f491) >>> 0;
  let total = 0; for (const k of WEATHERS) total += w[k] || 0;
  let r = (h / 4294967296) * total;
  for (const k of WEATHERS) { r -= (w[k] || 0); if (r < 0) return k; }
  return '晴';
}
/* その戦の天候。戦仕度で天候の品を持ち込んでいれば、開戦からその空になる */
const weatherNow = () => (BATTLE ? BATTLE.weather : '晴');
// 指示を1つ足すたびに頭から回し直す。決定論なので、すでに見せたところまでは必ず同じ経過になる。
/* 育てたぶん（レベル・魂・特技レベル）と、継承で入れ替えた特技を乗せる（2026-09-21）。
   コストは変えない。敵（NPC）はマスタの素の値のまま。
   お祭りの早送りからも使うので、resolve の外に出した（2026-09-23） */
function grownFor(m) {
    // 一の枠が元の固有のままなら char.unique を使う。
    // 上書きしていたら元の固有は消える（unique を null にする）
    const all = slotsOf(m).filter(Boolean);
    const keepOwn = all.find(x => x.slot === 0 && x.own);
    const rest = all.filter(x => !(x.slot === 0 && x.own));
    const lv = skillLvOf(m.no);
    const norm = rest.filter(x => !x.uniq);
    return {
      ...m,
      unique: keepOwn ? m.unique : null,
      stats: grownStats(m),
      normals: norm.map(x => x.sk),
      skillLv: norm.map(x => lv[x.slot] || 1),
      uniqExtra: rest.filter(x => x.uniq).map(x => x.sk),   // 継承した◆
    };
}
function resolve() {
  const b = BATTLE;
  const grown = grownFor;
  /* 一騎打ちは、たがいの総大将ひとりずつだけで解く（2026-09-30）。
     並び順の指定（slots）は一体には要らないので外す */
  const duel = !!(b.spar && b.spar.duel);
  const mine = duel ? S.picked.filter(m => m.no === S.general).slice(0, 1) : S.picked;
  const foes = duel ? b.B.slice(0, 1) : b.B;
  b.res = runBattle(
    { members: (mine.length ? mine : S.picked).map(grown), generalNo: S.general, formation: S.form,
      manual: true, modeSwitches: b.modes, slots: duel ? null : S.slots },
    { members: foes, generalNo: foes[0].no, formation: b.bForm },
    b.rules, b.seed, { log: true, commands: b.commands, weather: b.weather, useItems: b.useItems });
}
// いま見えているターン
function curTurn() {
  const b = BATTLE;
  if (b.res.awaiting && b.shown >= b.res.log.length) return b.res.awaiting.turn;
  const s = b.res.log.slice(0, b.shown).filter(e => e.type === 'snapshot').pop();
  return s ? s.turn : 0;
}
// いま見えているターンが手動かどうか
function manualNow() {
  const t = curTurn();
  let v = true;
  for (const m of BATTLE.modes) { if (m.turn <= t) v = !!m.manual; else break; }
  return v;
}
// 次に切り替わるターン（まだ先の予約があればその番号、無ければ null）
function pendingSwitch() {
  const t = curTurn();
  const m = BATTLE.modes.find(x => x.turn > t);
  return m || null;
}
/* 手動⇄オートの切り替え（2026-09-20）
   すでに見せ終わったターンの経過が後から変わらないよう、ターンの区切りで切り替える。
   ・手動→オート：そのターンにまだ指示を出していなければ即座、出していれば次のターンから
   ・オート→手動：必ず次のターンから（途中まで見せたターンをやり直さないため） */
function toggleAuto() {
  if (BATTLE && (BATTLE.spar || BATTLE.bout)) return;   // 稽古と番付は必ずオート
  const b = BATTLE;
  if (!b || !b.res) return;
  const t = curTurn(), wasManual = manualNow();
  const from = wasManual
    ? (b.commands.some(c => c.turn === t) ? t + 1 : t)
    : t + 1;
  b.modes = b.modes.filter(m => m.turn < from);
  b.modes.push({ turn: from, manual: !wasManual });
  /* いま選んだほうを覚えておく（2026-09-23）。
     手動で終えたら次の戦も手動から、オートで終えたら次もオートから始まる */
  P.manual = !wasManual; savePlayer();
  fxToken++; b.busy = false; b.playing = false;   // 走っている再生をいったん止める
  resolve();
  // 切り替えたターンより先まで見せていたら、そのターンの頭まで戻す
  const head = b.res.log.findIndex(e => e.type === 'snapshot' && e.turn === from);
  if (head >= 0 && b.shown > head) {
    seekTo(head);
  } else {
    b.shown = Math.min(b.shown, b.res.log.length);
    b.live = initLive(b.res);
    for (let i = 0; i < b.shown; i++) applyEvent(b.live, b.res.log[i]);
    drawBattle();
  }
  SFX.pick();
  b.playing = true;
  play();
}
function command(c) {
  const a = BATTLE.res.awaiting;
  if (!a || BATTLE.busy) return;
  BATTLE.commands.push({ unit: a.unit, turn: a.turn, ...c });
  resolve();
  play();                       // 選んだ行動はその場で動く（ターンの終わりを待たない）
}

/* ===== 盤面の現在値 =====
   スナップショットを土台に、イベントで座標と兵量を動かす。
   次のスナップショットで必ず補正されるので、回復や各種補正がずれたままにならない。 */
function initLive(res) {
  const s = res.log.find(e => e.type === 'snapshot');
  return new Map((s ? s.units : []).map(u => [u.id, { ...u }]));
}
function applyEvent(live, e) {
  const get = id => live.get(id);
  switch (e.type) {
    case 'snapshot': for (const u of e.units) live.set(u.id, { ...u }); break;
    case 'move': case 'retreat': case 'charge': { const u = get(e.src); if (u) { u.x = e.x; u.y = e.y; } break; }
    case 'swap': { const a = get(e.src), b = get(e.with);
      if (a && b) { const t = { x: a.x, y: a.y }; a.x = b.x; a.y = b.y; b.x = t.x; b.y = t.y; } break; }
    case 'dmg': case 'supportFire': case 'counter': case 'dyingStrike': case 'burn': {
      const t = get(e.tgt); if (t && e.v != null) t.hp = Math.max(0, t.hp - e.v); break; }
    case 'ko': { const t = get(e.tgt); if (t) { t.alive = false; t.hp = 0; } break; }
    case 'withdraw': { const u = get(e.src); if (u) u.alive = false; break; }
    case 'revive': { const t = get(e.tgt); if (t) { t.alive = true; t.hp = Math.max(t.hp, 1); } break; }
  }
}
const liveUnits = () => [...BATTLE.live.values()];
function troops(units, side) {
  return units.filter(u => u.id.startsWith(side + '-')).reduce((a, u) => a + Math.max(0, u.hp), 0);
}

let boardCache = null, pawnCache = null;
let fxToken = 0;
/* 合戦の速さ（2026-09-24）
   2 が元の速さ（いちばん速い）。1 はその半分でじっくり見える。
   再生の「間」だけを伸び縮みさせる。カットインや動きそのものの長さは変えない
   （そちらまで伸ばすと、絵が終わったあとに待たされて間延びするため）。 */
const SPEEDS = [
  { v: 1,   label: '通常' },
  { v: 1.5, label: '1.5倍' },
  { v: 2,   label: '2倍' },
];
const speedOf = () => SPEEDS.find(x => x.v === P.speed) || SPEEDS[0];
const playMul = () => 2 / (P.speed || 1);          // 速さ2 なら 1倍（元の速さ）、1 なら 2倍の長さ
const sleep = ms => new Promise(r => setTimeout(r, Math.round(ms * playMul())));
const cellOf = id => {
  const u = BATTLE.live.get(id);
  return u ? boardCache.children[u.y * BATTLE.rules.board.width + u.x] : null;
};
const noOf = id => +String(id).split('-')[1];
// 地形が通れるマスか（rules.stage.map が無ければ全部通れる）
function walkableAt(x, y) {
  const m = BATTLE.rules.stage && BATTLE.rules.stage.map;
  if (!m) return true;
  const code = (m[y] && m[y][x]) || 'PLAIN';
  const t = BATTLE.rules.terrain && BATTLE.rules.terrain.types && BATTLE.rules.terrain.types[code];
  return !t || t.walkable !== false;
}
// 頭の（属性）と末尾の◆は表示では落とす
const clean = t => String(t || '').replace(/^[（(][^）)]*[）)]\s*/, '').replace(/[◆◇]\s*$/, '');
const uniqNameOf = no => clean((C.find(c => c.no === no)?.unique?.name) || '固有');
const skillShort = nm => clean(nm);

/* ===== ログを1件ずつ見せる =====
   ここが再生の本体。ターンの区切りを待たず、起きた順にそのまま見せる。 */
async function play() {
  if (!BATTLE || BATTLE.busy) return;
  setPlayMul(playMul());        // 動きとカットインの長さも速さに合わせる（2026-09-24）
  BATTLE.busy = true;
  const my = ++fxToken;
  const log = BATTLE.res.log;
  // 途中でナビから合戦を抜けると BATTLE が無くなるので、毎回たしかめる
  const stop = () => { if (BATTLE) BATTLE.busy = false; };
  while (BATTLE && BATTLE.shown < log.length) {
    if (my !== fxToken) { stop(); return; }
    const e = log[BATTLE.shown++];
    await showEvent(e, my);
    if (!BATTLE || my !== fxToken) { stop(); return; }
    if (!BATTLE.playing) break;
  }
  stop();
  if (BATTLE && S.screen === 'battle') drawBattle();
}
// 状態異常と、そのとき出す絵（2026-09-21）
const STATUS_FX = { 炎上: 'burn', 感電: 'shock', 混乱: 'confuse', ひるみ: 'stun',
                    回復不能: 'buff_down', 挑発: 'shock' };
async function showEvent(e, my) {
  const live = BATTLE.live;
  const posOf = id => live.get(id) || { x: 0, y: 0 };
  const before = snapshotRects(pawnCache);
  const src = pawnCache.get(e.src), tgt = pawnCache.get(e.tgt);
  const srcPos = { ...posOf(e.src) }, tgtPos = { ...posOf(e.tgt) };

  switch (e.type) {
    case 'snapshot':
      applyEvent(live, e); drawBattle(); return;

    case 'move': case 'retreat': case 'swap': case 'charge':
      applyEvent(live, e); drawBattle(); flipMove(pawnCache, before);
      SFX.move(); await sleep(260); return;

    case 'dmg': case 'supportFire': case 'counter': case 'dyingStrike': {
      lunge(src, srcPos, tgtPos);
      await sleep(110);
      applyEvent(live, e); drawBattle();
      const d = { x: Math.sign(tgtPos.x - srcPos.x), y: Math.sign(tgtPos.y - srcPos.y) };
      hitFlash(tgt, d);
      // 当たった場所に絵を出す（2026-09-21）。会心は別の絵で大きく、援護射撃は矢
      fxBurst(cellOf(e.tgt), e.crit ? 'crit' : (e.type === 'supportFire' ? 'arrow_hit' : 'slash'),
              { scale: e.crit ? 1.35 : 1, ms: e.crit ? 520 : 380, spin: !e.crit });
      if (e.v != null) popNumber(cellOf(e.tgt), String(e.v), e.crit ? 'crit' : '');
      if (e.crit) { boardCache.classList.add('shake'); setTimeout(() => boardCache.classList.remove('shake'), 240); SFX.crit(); }
      else SFX.hit();
      await sleep(e.crit ? 260 : 150); return;
    }
    case 'burn':
      applyEvent(live, e); drawBattle();
      fxBurst(cellOf(e.tgt), 'burn', { ms: 440 });
      popNumber(cellOf(e.tgt), String(e.v), 'burn'); await sleep(140); return;

    case 'ko': {
      SFX.ko();
      popNumber(cellOf(e.tgt), '敗走', 'ko');
      const ms = fleeAway(pawnCache.get(e.tgt), String(e.tgt)[0]);
      await sleep(ms); applyEvent(live, e); drawBattle(); return;
    }
    case 'withdraw': {
      popNumber(cellOf(e.src), '撤退', 'ko');
      const ms = fleeAway(pawnCache.get(e.src), String(e.src)[0]);
      await sleep(ms); applyEvent(live, e); drawBattle(); return;
    }

    case 'revive':
      applyEvent(live, e); drawBattle(); SFX.heal();
      fxBurst(cellOf(e.tgt), 'heal', { scale: 1.2, ms: 560 });
      popNumber(cellOf(e.tgt), '復活', 'heal'); await sleep(320); return;
    case 'cleanse':
      applyEvent(live, e); drawBattle(); SFX.heal();
      fxBurst(cellOf(e.tgt || e.src), 'heal', { ms: 420 });
      popNumber(cellOf(e.tgt || e.src), '浄化', 'heal'); await sleep(200); return;
    case 'damageToHeal': case 'damageToHealOn':
      applyEvent(live, e); drawBattle();
      fxBurst(cellOf(e.src), 'heal', { ms: 400 }); await sleep(140); return;
    case 'healBlocked':
      applyEvent(live, e); drawBattle();
      fxBurst(cellOf(e.tgt || e.src), 'buff_down', { ms: 400 });
      popNumber(cellOf(e.tgt || e.src), '回復不能', ''); await sleep(160); return;
    case 'empowered': case 'bond': case 'shareStat':
      applyEvent(live, e); drawBattle();
      fxBurst(cellOf(e.src), 'buff_up', { ms: 420 }); await sleep(140); return;
    case 'aoeSplit': case 'shapeAtk':
      applyEvent(live, e); drawBattle();
      fxBurst(cellOf(e.src), 'impact', { scale: 1.25, ms: 460 }); await sleep(120); return;

    // 奥義・固有・特技はすべてカットインで見せる（2026-09-20）
    case 'ult': {
      const no = noOf(e.src);
      // 奥義は「その属性の音＋奥義の芯」を重ねる（2026-09-28）
      SFX.ougi((charOf(no) || {}).attr); ultFlare(src);
      fxBurst(cellOf(e.src), 'ult_burst', { scale: 1.6, ms: 760, spin: true });
      const ms = cutIn(document.body, { name: e.name, skill: ultNameOf(no),
                                        art: cutinArt(no, '奥義'), img: faceUrl(no, '不敵') || cutinUrl(no), kind: 'ult' });
      await sleep(Math.min(ms, 820)); return;
    }
    case 'unique': {
      const no = noOf(e.src);
      // 固有特技の音は属性ごとに変える（2026-09-28）。奥義と取り違えないように
      SFX.uniq((charOf(no) || {}).attr); ultFlare(src);
      fxBurst(cellOf(e.src), 'ult_burst', { scale: 1.3, ms: 560, spin: true });
      /* 固有は一枚絵をやめ、顔＋技名の中くらいの帯に戻した（2026-09-30）。
         一枚絵は画面をほとんど覆うので、続けて出ると盤面が見えなかった。
         大きな一枚絵は奥義だけの見せ場にする */
      const ms = cutIn(document.body, { name: e.name, skill: uniqNameOf(no),
                                        art: null, img: faceUrl(no, '真剣') || cutinUrl(no), kind: 'unique' });
      await sleep(Math.min(ms, 560)); return;
    }
    case 'skill': {
      // 特技は1ターンに何度も出るので、盤面を止めない小さい帯で見せる
      const u = C.find(c => c.no === noOf(e.src));
      // 特技も属性の音にする（2026-09-28）。釦を押す音と同じでは技が出たと分からない
      SFX.waza((u || {}).attr);
      const ms = cutIn(document.body, { name: u ? u.name : '', skill: skillShort(e.name),
                                        art: null,   // 通常特技も顔＋技名だけ（2026-09-30）
                                        img: faceUrl(noOf(e.src), '通常') || cutinUrl(noOf(e.src)), kind: 'skill' });
      await sleep(Math.min(ms, 360)); return;
    }

    case 'eva': SFX.eva(); popNumber(cellOf(e.tgt), '回避', ''); await sleep(140); return;
    case 'endure': SFX.heal(); fxBurst(cellOf(e.tgt), 'guard', { ms: 420 });
      popNumber(cellOf(e.tgt), '耐えた', 'heal'); await sleep(160); return;
    case 'cover':
      fxBurst(cellOf(e.src), 'guard', { ms: 400 });
      popNumber(cellOf(e.src), 'かばう', 'heal'); await sleep(140); return;
    case 'status':
      // 状態異常は、その名前にあわせた絵を出す（2026-09-21）
      fxBurst(cellOf(e.tgt), STATUS_FX[e.name] || 'shock', { ms: 420 });
      popNumber(cellOf(e.tgt), e.name, ''); await sleep(120); return;
    case 'taunt':
      fxBurst(cellOf(e.src), 'shock', { ms: 380 });
      popNumber(cellOf(e.src), '挑発', ''); await sleep(120); return;
    default: return;
  }
}
// 巻き戻し：指定のログ位置まで一気に進めて、演出なしで描く
function seekTo(idx) {
  fxToken++; BATTLE.busy = false; BATTLE.playing = false;
  BATTLE.live = initLive(BATTLE.res);
  for (let i = 0; i < idx; i++) applyEvent(BATTLE.live, BATTLE.res.log[i]);
  BATTLE.shown = idx;
  drawBattle();
}

function drawBattle() {
  const { res } = BATTLE;
  const units = liveUnits();
  for (const n of boardCache.querySelectorAll('.reach,.go-move,.go-atk,.go-wait')) n.remove();
  render(boardCache, pawnCache, units, BATTLE.rules);
  const ta = troops(units, 'A'), tb = troops(units, 'B');
  const pa = ta + tb > 0 ? ta / (ta + tb) * 100 : 50;
  $('#barA').style.width = pa + '%';
  $('#barB').style.width = (100 - pa) + '%';
  $('#barMid').style.left = pa + '%';
  $('#tA').textContent = ta.toLocaleString();
  $('#tB').textContent = tb.toLocaleString();
  const cur = res.log.slice(0, BATTLE.shown).filter(e => e.type === 'snapshot').pop();
  const tn = $('#turnNum');
  if (tn) tn.textContent = cur ? cur.turn : 0;
  // 盤面の外の顔を、いまの盤面に合わせて組み直す（2026-09-23）
  rosterRow($('#rosterB'), 'B');
  rosterRow($('#rosterA'), 'A');

  // 盤面の右上：いまどちらで動いているか。予約中なら「次ターンから」を添える
  const ab = $('#autoBtn');
  if (ab && (BATTLE.spar || BATTLE.bout)) ab.style.display = 'none';   // 稽古と番付は切り替えさせない
  if (ab && !BATTLE.spar && !BATTLE.bout) {
    const man = manualNow(), pend = pendingSwitch();
    ab.className = 'autobtn' + (man ? ' man' : '');
    ab.querySelector('.lbl').textContent = man ? '手動' : 'オート';
    ab.querySelector('.g').textContent = pend ? `${pend.turn}Tから${pend.manual ? '手動' : 'オート'}` : '';
  }

  // 手動操作のパネル
  const waiting = res.awaiting && BATTLE.shown >= res.log.length && !BATTLE.busy;
  const panel = $('#manualBox');
  panel.innerHTML = '';
  const ub = $('#ultBtn');
  if (ub) ub.style.display = 'none';
  for (const pw of pawnCache.values()) pw.style.outline = '';
  if (waiting) {
    const a = res.awaiting;
    const snap = BATTLE.live.get(a.unit);
    const cost = (snap && snap.ultCost) ?? 5;
    const canUlt = snap && snap.ult >= cost;
    const pawn = pawnCache.get(a.unit);
    if (pawn) { pawn.style.outline = '2px dashed #fff'; pawn.style.outlineOffset = '2px'; }
    const W2 = BATTLE.rules.board.width, H2 = BATTLE.rules.board.height;
    const cellAt = (x, y) => boardCache.children[y * W2 + x];
    const foes = units.filter(u => u.alive && u.id[0] !== a.unit[0]);
    // 射程1は上下左右だけ、射程2以上は斜めも届く（2026-09-20）
    const reachable = f => {
      if (!snap) return false;
      const r = snap.range || 1;
      if (Math.abs(f.x - snap.x) + Math.abs(f.y - snap.y) > r) return false;
      return r >= 2 || f.x === snap.x || f.y === snap.y;
    };
    const inRange = foes.filter(reachable);
    // ボタンでモードを切り替えず、盤面を直接タップして動かす（2026-09-20）
    //   水色のマス＝移動  ／  赤く光る相手＝攻撃

    // 奥義は盤面の右下に丸ボタンで常駐させる（2026-09-20）
    $('#ultBtn').style.display = '';
    $('#ultBtn').classList.toggle('ready', !!canUlt);   // art を消さないよう ready だけ切り替える
    $('#ultBtn').disabled = !canUlt;
    $('#ultBtn').onclick = () => { if (canUlt) command({ type: 'ult' }); };
    const have = snap ? Math.floor(snap.ult) : 0;
    $('#ultBtn').querySelector('.g').textContent = `${have}/${cost}`;
    const ring = $('#ultBtn').querySelector('.ring');
    if (ring) ring.style.setProperty('--p', `${Math.max(0, Math.min(100, have / cost * 100))}%`);

    // 攻撃が届くマスを薄い赤で示す（射程1＝上下左右、射程2以上＝斜めも）
    if (snap) {
      const r = snap.range || 1;
      for (let ny = Math.max(0, snap.y - r); ny <= Math.min(H2 - 1, snap.y + r); ny++) {
        for (let nx = Math.max(0, snap.x - r); nx <= Math.min(W2 - 1, snap.x + r); nx++) {
          const d = Math.abs(nx - snap.x) + Math.abs(ny - snap.y);
          if (d === 0 || d > r) continue;
          if (r < 2 && nx !== snap.x && ny !== snap.y) continue;
          cellAt(nx, ny).append(el('span', { class: 'reach' }));
        }
      }
    }
    // 攻撃できる相手：赤く光らせて、タップでそのまま攻撃
    for (const f of inRange) cellAt(f.x, f.y).append(el('button', {
      class: 'go-atk', title: `${res.initial.find(u => u.id === f.id)?.name || ''} を攻撃`,
      onclick: () => { SFX.pick(); command({ type: 'attack', tgt: f.id }); } }));
    // 移動できるマス：水色。タップでそのまま移動
    let moveCells = 0;
    if (snap) {
      for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
        const nx = snap.x + dx, ny = snap.y + dy;
        if (nx < 0 || nx >= W2 || ny < 0 || ny >= H2) continue;
        if (units.some(u => u.alive && u.x === nx && u.y === ny)) continue;
        if (!walkableAt(nx, ny)) continue;
        cellAt(nx, ny).append(el('button', {
          class: 'go-move', title: '移動',
          onclick: () => { SFX.move(); command({ type: 'move', x: nx, y: ny }); } }));
        moveCells++;
      }
    }
    // 待機：行動中の自分のコマをタップする（2026-09-20）
    if (snap) {
      const me = cellAt(snap.x, snap.y);
      me.append(el('button', {
        class: 'go-wait', title: 'タップで待機',
        onclick: () => { SFX.pick(); command({ type: 'wait' }); } }));
    }
    // 攻撃も移動も奥義もできないときは、詰まないように自動で手番を送る
    if (!moveCells && !inRange.length && !canUlt) setTimeout(() => command({ type: 'wait' }), 260);
  }

  // 決着
  const done = !res.awaiting && BATTLE.shown >= res.log.length && !BATTLE.busy;
  $('#resultBox').innerHTML = '';
  if (done && res.winner) {
    if (!BATTLE._sang) { BATTLE._sang = true; (res.winner === 'A' ? SFX.win : SFX.lose)(); }
    // 報酬は1戦につき一度だけ配る（巻き戻して見返しても増えない）
    if (!BATTLE._paid) {
      BATTLE._paid = true;
      /* 番付の一戦に褒美は付けない（2026-09-25）。
         1日5戦×30日ぶんの小判が湧くと、天下統一の道のほうが軽くなってしまう。
         番付の見返りは点と、月末の褒美だけ */
      /* お祭りはお祭りの褒美が本体なので、勝ちの褒美は初めて取ったときだけ付ける
         （2026-09-29）。二度目からはお祭りの褒美だけ。
         戦った数は数えたいので、褒美なしのときも giveReward(false) を通す */
      const evFirst = !!(BATTLE.ev && !evDone(BATTLE.ev.id, BATTLE.ev.rank));
      const won0 = res.winner === 'A';
      BATTLE.reward = BATTLE.bout ? null
                    : BATTLE.tw ? null
                    : BATTLE.spar ? sparReward(won0)
                    : BATTLE.ev ? giveReward(won0 && evFirst, rewardMulOf(S.picked))
                    : giveReward(won0, rewardMulOf(S.picked));
      /* 塔は勝ってもそれだけでは抜けられない（2026-10-01）。
         戦いぶりのしばりをここで確かめ、そろって初めて一階のぼる。
         ふつうの褒美（小判など）は付けない。石だけを配る決まりにした */
      if (BATTLE.tw) {
        const sec = (BATTLE.rules && BATTLE.rules.time && BATTLE.rules.time.secPerTurn) || 2;
        BATTLE.twNg = won0 ? twResult(BATTLE.tw.f, res, sec) : ['勝てなかった'];
        BATTLE.twWon = (won0 && !BATTLE.twNg.length) ? twClear(BATTLE.tw.f) : null;
      }
      // 天下統一の道は、勝ったぶんだけ国を進める
      if (BATTLE.camp && res.winner === 'A') BATTLE.march = advancePref(BATTLE.camp.pref.id);
      // お祭りは、勝ったときだけ褒美を配って済の印をつける（2026-09-23）
      if (BATTLE.ev && res.winner === 'A') { BATTLE.evWon = evWin(BATTLE.ev.id, BATTLE.ev.rank); miBump('evOk'); }   // お役目の数（門出・2026-09-26）
      /* 稽古の勝敗を友ごとに積む（2026-09-24）。あとで番付に使う。
         その日はもう挑めないよう、勝っても負けても spar に今日を入れる */
      if (BATTLE.spar) {
        const f = frState(BATTLE.spar.id);
        if (res.winner === 'A') f.win++; else f.lose++;
        f.spar = today();
        savePlayer();
      }
      // 番付の点はその場で動く（2026-09-25）。挑まれたぶんは日が変わってからまとめて
      if (BATTLE.bout) BATTLE.boutPt = rkFinish(BATTLE.bout, res.winner === 'A');
      miRefresh();   // 制した国の数や称号を、戦のあとに整える（2026-09-24）
      /* 勝敗は画面の下ではなく、中央のポップアップで知らせる（2026-09-23）。
         制覇したときは、勝利のあとにもう一枚「◯◯ 制覇」を続けて出す。
         drawBattle は draw の最後に呼ばれるので、次の回に持ち越して出す */
      /* 負けの札に出す数（2026-09-29）。
         倒した数・討たれた数・かかった手数。褒美が無いぶん、戦いぶりを残す */
      S.res = { i: 0, won: res.winner === 'A', reason: res.reason, ta, tb, stat: battleStat(res) };
      setTimeout(draw, 40);
    }
    /* 下の帯の戦闘結果はやめた（2026-09-23）。
       中央のポップアップで受け取ってもらうので、同じことを二度出さない */
  }
}

/* 戦いぶりを数える（2026-09-29）。
   盤面を見た戦も、早送りの戦も、同じここを通す。
   エンジンが一つ一つの傷に「出どころ」を書いているので、足し上げるだけでよい。
   こちら側の武将は id が A- で始まる */
const DMG_FOLD = { normal: 'normal', counter: 'normal', support: 'normal', dying: 'normal',
                   skill: 'skill', unique: 'unique', ult: 'ult' };
function battleStat(res) {
  const us = res.units || [];
  const by = {}; const unit = {};
  let crit = 0, hits = 0, taken = 0;
  for (const e of (res.log || [])) {
    if (e.type !== 'dmg') continue;
    if (String(e.src).startsWith('A-')) {
      const v = e.via || 'normal';
      by[v] = (by[v] || 0) + e.v; hits++; if (e.crit) crit++;
      const no = parseInt(String(e.src).split('-')[1], 10);
      const u = unit[no] || (unit[no] = { no, all: 0, normal: 0, skill: 0, unique: 0, ult: 0, kaeshi: 0 });
      u.all += e.v; u[DMG_FOLD[v] || 'normal'] += e.v;
      if (v === 'counter') u.kaeshi++;
    } else taken += e.v;
  }
  for (const k of Object.keys(by)) by[k] = Math.round(by[k]);
  // 出陣した味方は、傷を与えられなかった者も並べる。「何もできなかった」ことも戦いぶり
  for (const u of us) if (u.side === 'A' && !unit[u.no]) {
    unit[u.no] = { no: u.no, all: 0, normal: 0, skill: 0, unique: 0, ult: 0, kaeshi: 0 };
  }
  const units = Object.values(unit).map(u => ({
    ...u, all: Math.round(u.all), normal: Math.round(u.normal),
    skill: Math.round(u.skill), unique: Math.round(u.unique), ult: Math.round(u.ult),
    alive: !!(us.find(x => x.side === 'A' && x.no === u.no) || {}).alive,
  })).sort((a, b) => b.all - a.all);
  return {
    ko:   us.filter(u => u.side === 'B' && !u.alive).length,
    lost: us.filter(u => u.side === 'A' && !u.alive).length,
    dmg:  Math.round(us.filter(u => u.side === 'A').reduce((a, u) => a + (u.dmgDealt || 0), 0)),
    taken: Math.round(taken), crit, hits, by, units,
    turn: (res.log || []).reduce((a, e) => (e.turn > a ? e.turn : a), 0),
  };
}
/* ---- 合戦の結果を中央のポップアップで出す（2026-09-23）----
   1枚目は勝敗と褒美。国を取ったときは2枚目に「◯◯ 制覇」。天下統一なら3枚目。
   「報酬を受け取る」で次へ進み、次が無ければ閉じて戦闘結果の画面に戻る。 */
function resSteps() {
  if (!S.res || !BATTLE) return [];
  const out = [S.res.won ? 'win' : 'lose'];
  const mr = BATTLE.march;
  /* 制覇の札は、初めてその国を取ったときだけ（2026-09-29）。
     取り返すたびに出すと、同じ国を往復する遊びで毎回同じ札が挟まって煩わしい。
     褒美も advancePref が first のときしか配っていないので、札もそこへ合わせる */
  if (S.res.won && mr && mr.first) out.push('taken');
  if (S.res.won && mr && mr.unified) out.push('unified');
  /* お祭りの褒美は別の札にせず、勝ちの札にまとめて並べる（2026-09-29）。
     「勝利」と「お祭りの褒美」を続けて出すと、同じことを二度見せることになる */
  return out;
}
/* お祭りの褒美を、玉と札で並べる */
function evRewardRow(rw) {
  if (!rw) return null;
  const kids = [];
  if (rw.stone) kids.push(el('span', {}, curIcon('stone'), `+${num(rw.stone)}`));
  if (rw.koban) kids.push(el('span', {}, curIcon('koban'), `+${num(rw.koban)}`));
  if (rw.soul)  kids.push(el('span', {}, curIcon('soul'), `+${num(rw.soul)}`));
  for (const [k, n] of Object.entries(rw.items || {}))
    if (n > 0) kids.push(el('span', {}, itemIcon(k), `${k} +${n}`));
  return kids.length ? el('div', { class: 'rw evrw' }, kids) : null;
}
/* 褒美の玉の行 */
function rewardRow(o, exp) {
  // 何ももらえないときは帯ごと出さない（2026-09-27）。負けの札に空の帯が残らないように
  if (!o || !(o.stone || o.koban || o.soul || o.book || exp)) return null;
  return el('div', { class: 'rw' },
    o.stone ? el('span', {}, curIcon('stone'), `+${num(o.stone)}`) : null,
    o.koban ? el('span', {}, curIcon('koban'), `+${num(o.koban)}`) : null,
    o.soul ? el('span', {}, curIcon('soul'), `+${num(o.soul)}`) : null,
    o.book ? el('span', {}, el('i', { class: 'lv' }, '書'), `稽古の書 +${o.book}`) : null,
    exp ? el('span', {}, el('i', { class: 'lv' }, '将'), `経験 +${exp}`) : null);
}
/* 褒美をひとつの札にする（2026-09-29）。
   絵があれば絵、無ければ字。数は右下に重ねる。
   遊ぶ人には「何が、いくつ」だけを見せたいので、名は下に小さく添えるだけ */
function prizeTile(art, mark, name, count) {
  return el('div', { class: 'pz' },
    el('span', { class: 'pzw' },
      art ? keepImg({ class: 'pzi', src: art, alt: name }) : el('i', { class: 'pzm' }, mark),
      count != null ? el('b', { class: 'pzn' }, num(count)) : null),
    el('span', { class: 'pzt' }, name));
}
function prizeRow(rw, ev) {
  const t = [];
  /* 勝ちの褒美（2026-09-29）。お祭りのぶんも同じ並びにまとめる。
     お祭りは二度目から勝ちの褒美が付かないので、そのときはお祭りのぶんだけ並ぶ */
  const add = (a, m, n, c) => { if (c) t.push(prizeTile(a, m, n, c)); };
  if (rw && !rw.lost) {
    add(uiUrl('coin_石'), '勾', '勾玉', rw.stone);
    add(uiUrl('coin_小判'), '判', '小判', rw.koban);
    add(uiUrl('coin_魂'), '魂', '魂', rw.soul);
    add(itemUrl('稽古の書'), '書', '稽古の書', rw.book);
    add(null, '将', '経験', rw.exp);
  }
  if (ev) {
    add(uiUrl('coin_石'), '勾', '勾玉', ev.stone);
    add(uiUrl('coin_小判'), '判', '小判', ev.koban);
    add(uiUrl('coin_魂'), '魂', '魂', ev.soul);
    for (const [k, n] of Object.entries(ev.items || {})) add(itemUrl(k), '具', k, n);
    // もらった武将はコマ絵で。新しく来たのか、重なったのかを下に添える
    for (const g of (ev.got || [])) {
      const o = charOf(g.no); if (!o) continue;
      t.push(prizeTile(pawnUrl(g.no) || faceUrl(g.no, '通常'), (o.name || '')[0] || '将',
                       g.dup ? '重ね' : '新', null));
    }
  }
  if (!t.length) return null;
  return el('div', { class: 'pzrow' }, t);
}
/* 戦いぶりを見るための印（2026-09-29）。勝ちにも負けにも出す。
   押すと傷の内わけが開く。押しても札は閉じない */
function infoMark() {
  /* 巻物と虫めがねの絵に差し替えた（2026-09-30）。
     名は ui/btn_戦いぶり。はじめ btn_info で置いたが中身を取り違えたので、
     機器が古い写しを掴んだままにならないよう、名ごと変えた。
     絵が無ければこれまでの丸に「i」に落ちる */
  const art = uiUrl('btn_戦いぶり') || uiUrl('btn_info');
  return el('button', {
    class: 'infomark' + (art ? ' art' : ''), title: '戦いぶり',
    onclick: e => { e.stopPropagation(); S.dmg = true; SFX.pick(); draw(); },
  }, art ? keepImg({ src: art, alt: '戦いぶり' }) : el('i', {}, 'i'));
}
/* 傷の内わけ（2026-09-29）。
   エンジンが一つ一つの傷に出どころを書いているので、それを帯で見せる。
   ここは「知りたい人だけが開く場」なので、数をそのまま出してよい */
function dmgUnitRow(u, top) {
  const c = charOf(u.no) || {};
  const art = pawnUrl(u.no) || faceUrl(u.no, '通常');
  const cell = (n, v) => el('span', { class: 'dgc' + (v ? '' : ' zero') },
    el('i', {}, n), el('b', {}, num(v)));
  return el('div', { class: 'dgu' + (u.alive ? '' : ' fell') },
    el('span', { class: 'dgf' },
      art ? keepImg({ src: art, alt: c.name || '' }) : el('i', { style: chipStyle(c) })),
    el('div', { class: 'dgub' },
      el('div', { class: 'dguh' },
        el('span', { class: 'dgun' }, c.name || ('No.' + u.no)),
        el('b', { class: 'dgut' }, num(u.all))),
      el('div', { class: 'dgbar' }, el('i', { style: `width:${Math.round(100 * u.all / top)}%` })),
      el('div', { class: 'dgcs' },
        cell('通常', u.normal), cell('特技', u.skill),
        cell('固有', u.unique), cell('奥義', u.ult),
        el('span', { class: 'dgc' + (u.kaeshi ? '' : ' zero') },
          el('i', {}, '反撃'), el('b', {}, num(u.kaeshi) + '回')))));
}
function dmgSheet() {
  const st = (S.res && S.res.stat) || {};
  const us = st.units || [];
  const close = () => { S.dmg = false; SFX.pick(); draw(); };
  const top = Math.max(1, ...us.map(u => u.all));
  return el('div', { class: 'sheet', onclick: e => { if (e.target.classList.contains('sheet')) close(); } },
    el('div', { class: 'card2 dgbox' },
      el('b', { class: 'dgttl' }, '戦いぶり'),
      el('div', { class: 'dgtop' },
        el('div', {}, el('span', {}, '与えた傷'), el('b', {}, num(st.dmg || 0))),
        el('div', {}, el('span', {}, '受けた傷'), el('b', {}, num(st.taken || 0)))),
      el('div', { class: 'dgsub' },
        el('span', {}, '撃破 ', el('b', {}, num(st.ko || 0))),
        el('span', {}, '討死 ', el('b', {}, num(st.lost || 0))),
        el('span', {}, '会心 ', el('b', {}, num(st.crit || 0))),
        el('span', {}, '手数 ', el('b', {}, num(st.turn || 0)))),
      us.length ? el('div', { class: 'dglist' }, us.map(u => dmgUnitRow(u, top)))
                : el('p', { class: 'note' }, '戦いぶりが残っておらぬ'),
      closeX(close)));
}
/* 制覇したときの一言（2026-09-29）。
   降した相手の言葉を先に置き、そのあとに「いまどのあたりか」で変わる一言を足す。
   同じ国を取り返しても札は出ない作りなので、ここは制覇のたびに一度きり。
   国と制覇数から選ぶので、画面を描き直しても文は変わらない（ちらつかない） */
const TAKEN_TALK = {
  early: ['まだ旗は数えるほど。されど、はじまりはいつも一つワン',
          'この一国が、のちの世に語られる一歩となるワン',
          '隣の国が、こちらを見ておるワン',
          '名を上げたな。噂は風より早いワン'],
  mid:   ['半ばまで来たワン。ここからは力比べになるワン',
          '相手も本気になってきたワン。油断めさるな',
          '旗が増えた。兵糧の心配もしておくワン',
          '名だたる家が、次々と門を叩いてくるワン'],
  late:  ['天下統一まで、もう一息ワン',
          '残るは数えるほど。最後こそ手を抜くなワン',
          'ここまで来たか。世が変わる音がするワン',
          '最後の一国が、いちばん重いワン'],
};
function takenTalk(p, foeGen) {
  const done = takenCount(), all = PREFS.length;
  const bag = TAKEN_TALK[done < all * 0.34 ? 'early' : done < all * 0.75 ? 'mid' : 'late'];
  // 国の名と制覇数から選ぶ。描き直しても同じ文が出るように、乱数は使わない
  let h = done * 31;
  for (const ch of String((p && p.id) || '')) h = (h * 33 + ch.charCodeAt(0)) >>> 0;
  const word = bag[h % bag.length];
  const lord = p && LORD_TALK[p.id] ? LORD_TALK[p.id].after : null;
  return lord ? `「${lord}」　${word}` : `「${word}」`;
}
/* 制覇の褒美を、勝ちの札と同じ大きさの絵で並べる（2026-09-29） */
function bonusRow(b) {
  if (!b) return null;
  const t = [];
  if (b.stone) t.push(prizeTile(uiUrl('coin_石'), '勾', '勾玉', b.stone));
  if (b.koban) t.push(prizeTile(uiUrl('coin_小判'), '判', '小判', b.koban));
  if (b.soul)  t.push(prizeTile(uiUrl('coin_魂'), '魂', '魂', b.soul));
  if (b.book)  t.push(prizeTile(itemUrl('大稽古の書'), '書', '大稽古の書', b.book));
  if (b.gear)  t.push(prizeTile(itemUrl(b.gear), '具', b.gear, b.gearN));
  if (b.badge) t.push(prizeTile(itemUrl(b.badge), '配', b.badge, b.badgeN));
  if (!t.length) return null;
  return el('div', { class: 'pzrow tkpz' }, t);
}
function resSheet() {
  const steps = resSteps();
  const kind = steps[S.res.i];
  if (!kind) { S.res = null; return null; }
  const last = S.res.i >= steps.length - 1;
  const next = () => {
    if (!last) { S.res.i++; SFX.pick(); draw(); return; }
    /* 褒美を受け取り終えたら閉じる（2026-09-23）。
       天下統一の道の一戦は、終わった盤面に戻っても何もできないので、そのまま全国へ返す。
       戦場を選んで戦う一戦（camp なし）は、もう一戦できるので盤面に残す */
    const toMap = !!BATTLE.camp, toEv = !!BATTLE.ev, toFr = BATTLE.spar && BATTLE.spar.id;
    const toRk = !!BATTLE.bout, rkD = BATTLE.boutPt;
    /* 塔は必ず塔へ返す（2026-10-01）。抜けたなら褒美を、届かなかったなら
       何が足りなかったかを、そのまま塔の画面に出す */
    const toTw = !!BATTLE.tw;
    const twF = toTw ? BATTLE.tw.f : 0;
    const twW = BATTLE.twWon, twN = BATTLE.twNg;
    S.res = null; S.dmg = false;   // 戦いぶりの札も一緒に畳む（2026-09-29）
    /* 初陣（手引きの一戦目）のあとだけは、全国ではなく城へ返す（2026-09-25）。
       ここから手引きが始まるので、まず城の景色を見せたい */
    const toFirst = !!(BATTLE.camp && P.tut2.on && !P.tut2.got && tebikiStep() === 1);
    if (toTw) {
      fxToken++; BATTLE = null;
      S.screen = 'tower'; S.twSel = null;
      S.twMsg = twW
        ? (twW.first ? `${twF}階を抜けた　石 ${num(twW.stone)}${twW.title ? `／称号「${twW.title}」` : ''}`
                     : `${twF}階を抜けた（褒美は受け取り済み）`)
        : `届かなんだ　― ${(twN || []).join('／')}`;
      SFX.pick(); draw(); return;
    }
    if (toMap || toEv || toFr || toRk) { fxToken++; const id = BATTLE.ev && BATTLE.ev.id; BATTLE = null;
      S.screen = (toEv ? 'event' : (toFr || toRk || toFirst) ? 'home' : 'map');
      if (toEv) { S.evId = id; S.evMsg = ''; }
      // 稽古のあとは、その友の家へ返す（ホームの上に札が乗る）
      if (toFr) { S.fr = true; S.frId = toFr; S.frMsg = ''; }
      // 番付のあとは番付表へ返し、動いた点をその場で知らせる
      if (toRk) { S.rk = true; S.rkSel = null;
        S.rkMsg = `${rkD > 0 ? '+' : ''}${rkD} pt`; } }
    SFX.pick(); draw();
  };
  const rw = BATTLE.reward, mr = BATTLE.march, p = BATTLE.camp ? BATTLE.camp.pref : null;
  /* 負けの札は一枚絵にした（2026-09-29）。
     丸い枠の絵の上に「敗北」の字を重ね、その下に戦いぶりを白字で置く。
     顔も釦も出さない。どこを押しても閉じる（言わなくても押すので、案内も出さない）。
     絵が無ければ、これまでどおりの札に落ちる（「絵が無くても動く」を崩さない） */
  if (kind === 'lose' && uiUrl('pop_敗北')) {
    const st = S.res.stat || {};
    const n = v => num(v || 0);
    return el('div', { class: 'sheet losesheet', onclick: next },
      el('div', { class: 'losepop', style: `background-image:url("${uiUrl('pop_敗北')}")` },
        infoMark(),
        /* 中の丸は絵の 50%（中心は横 50%・縦 51%）。字も数も、その中に収める */
        el('div', { class: 'lpin' },
          uiUrl('title_敗北')
            ? keepImg({ class: 'lpword', src: uiUrl('title_敗北'), alt: '敗北' })
            : el('b', { class: 'lpword txt' }, '敗北'),
          el('div', { class: 'lpnum' },
            el('span', {}, '撃破', el('b', {}, n(st.ko))),
            el('span', {}, '討死', el('b', {}, n(st.lost))),
            el('span', {}, '手数', el('b', {}, n(st.turn)))),
          el('p', { class: 'lpsub' }, S.res.skip ? '早送りで決着' : S.res.reason))));
  }
  /* 勝ちの札も一枚絵にした（2026-09-29）。
     金の丸枠に「勝利」の字を重ね、その下に褒美を絵で並べる。
     数は絵の右下に小さく重ねる。受け取る釦は枠の外、いちばん下 */
  if (kind === 'win' && uiUrl('pop_勝利')) {
    const st = S.res.stat || {};
    const n = v => num(v || 0);
    const pz = prizeRow(rw, BATTLE.evWon);
    /* 褒美が出ない一戦（番付など）に「受け取る」は変なので、
       そのときは釦を出さず、画面を押して閉じる（2026-09-29） */
    return el('div', { class: 'sheet winsheet' + (pz ? '' : ' tap'), onclick: pz ? null : next },
      el('div', { class: 'winpop', style: `background-image:url("${uiUrl('pop_勝利')}")` },
        infoMark(),
        /* 中の金の面は絵の 47.5%（中心は横 49.9%・縦 51.4%） */
        el('div', { class: 'wpin' },
          uiUrl('title_勝利')
            ? keepImg({ class: 'wpword', src: uiUrl('title_勝利'), alt: '勝利' })
            : el('b', { class: 'wpword txt' }, '勝利'),
          pz,
          el('div', { class: 'wpnum' },
            el('span', {}, '撃破', el('b', {}, n(st.ko))),
            el('span', {}, '討死', el('b', {}, n(st.lost))),
            el('span', {}, '手数', el('b', {}, n(st.turn)))))),
      pz ? el('button', { class: 'go wide wptake', onclick: next }, '受け取る') : null);
  }
  let box;
  if (kind === 'win' || kind === 'lose') {
    const won = kind === 'win';
    /* 勝ち負けで総大将の顔が変わる（2026-09-25）。
       app/assets/face/<番号>_<表情>.png がある武将だけ出る。無ければ何も出ない */
    const gen = faceChar();
    const gf = gen ? faceUrl(gen.no, won ? '笑顔' : '驚き') : null;
    box = el('div', { class: 'card2 resbox ' + (won ? 'win' : 'lose') },
      el('div', { class: 'wray' }),
      gf ? keepImg({ class: 'rface', src: gf, alt: '' }) : null,
      el('b', { class: 'rttl' }, won ? '勝利' : '敗北'),
      el('p', { class: 'rsub' }, S.res.skip ? '早送りで決着' : `${S.res.reason}　残兵量 ${num(S.res.ta)} 対 ${num(S.res.tb)}`),
      rewardRow(rw, rw && rw.exp),
      /* 番付は褒美のかわりに、動いた点を出す（2026-09-25）*/
      BATTLE.bout ? el('div', { class: 'rw' },
        el('span', {}, `番付　${BATTLE.boutPt > 0 ? '+' : ''}${BATTLE.boutPt} pt`)) : null,
      rw && rw.lvUp ? el('p', { class: 'rlv' }, `Lv.${P.lv} に上がった`) : null);
  } else if (kind === 'taken') {
    /* 制覇の札（2026-09-29 に作り直した）。
       もとは題と数と褒美の帯だけで寂しかったので、
       降した総大将の顔と、そのときどきで変わる一言を添えた */
    const foeGen = (BATTLE.B && BATTLE.B[0]) || null;
    const fArt = foeGen ? (faceUrl(foeGen.no, '驚き') || faceUrl(foeGen.no, '通常') || pawnUrl(foeGen.no)) : null;
    box = el('div', { class: 'card2 resbox taken' },
      el('b', { class: 'rttl' }, `${p ? p.name : ''} 制覇`),
      el('div', { class: 'tkline' },
        el('span', { class: 'tkf' },
          fArt ? keepImg({ src: fArt, alt: foeGen ? foeGen.name : '' })
               : el('i', { style: foeGen ? chipStyle(foeGen) : '' })),
        el('p', { class: 'tkbal' }, takenTalk(p, foeGen))),
      el('p', { class: 'rsub' }, `制覇 ${takenCount()} / ${PREFS.length}`),
      bonusRow(mr && mr.bonus));
  } else if (kind === 'ev') {
    /* お祭りの褒美（2026-09-23）。武将がもらえるお祭りは、顔も出す */
    const ev = evOf(BATTLE.ev.id), rw = BATTLE.evWon;
    box = el('div', { class: 'card2 resbox taken' },
      el('div', { class: 'wray' }),
      el('b', { class: 'rttl' }, `${ev ? ev.name : 'お祭り'}　${EV_RANKS[BATTLE.ev.rank]}`),
      (rw.got || []).length ? el('div', { class: 'matpick evgot' }, rw.got.map(g => {
        const o = charOf(g.no); if (!o) return null;
        return el('div', { class: 'mc on', title: o.name },
          cardImg(o) || el('i', { style: chipStyle(o) }),
          el('span', { class: 'mcn' }, g.dup ? '重ね +1' : '新'));
      })) : null,
      evRewardRow(rw));
  } else {
    box = el('div', { class: 'card2 resbox unified' },
      el('div', { class: 'wray' }),
      el('b', { class: 'rttl' }, '天下統一'),
      el('p', { class: 'rtalk' }, '——四十七の国、ことごとく従えたり。'));
  }
  box.append(el('button', { class: 'go wide', onclick: next },
    kind === 'lose' ? '受け取る' : '報酬を受け取る'));
  // 暗幕を押しても閉じない。褒美は必ずボタンで受け取ってもらう
  return el('div', { class: 'sheet ressheet' }, box);
}

/* ================= 試練の塔（2026-10-01）=================
   百階。一階ずつ、しばりを読んで編成で解く場。
   ・兵糧は どの階も 10。何度でも挑める
   ・褒美は初めて抜けた一度だけ。石だけを配る
   ・陣中の品は持ち込めない（startBattle で止めている）
   ・敵の顔ぶれは階の番号で決まり打ち。同じ階なら いつも同じ相手 */
const twState = () => { if (!P.tower) P.tower = { floor: 1, got: [] }; return P.tower; };
const twFloor = () => twState().floor || 1;
const twGot = f => (twState().got || []).includes(f);

/* その階の敵。階の番号を種にするので、何度挑んでも同じ顔ぶれ（2026-10-01）。
   組み方はお祭りと同じ「兵力を使い切る」やり方 */
function twEnemy(f, _rng) {
  const t = towerOf(f); if (!t) return enemyTeam(_rng);
  let s = ((f * 2654435761) ^ 0x5bf03635) >>> 0;
  const rng = () => { s = (s + 0x6D2B79F5) >>> 0; let x = Math.imul(s ^ (s >>> 15), 1 | s);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  const want = t.enemy.cost;
  const MIN = Math.min(...C.map(c => c.cost));
  const out = [];
  let sum = 0;
  for (let slot = 0; slot < 5; slot++) {
    const left = 5 - out.length - 1;
    const room = want - sum - left * MIN;
    const cand = C.filter(c => c.cost <= room && !out.some(x => x.no === c.no)
      && !out.some(x => x.origin && c.origin && x.origin === c.origin));
    if (!cand.length) break;
    const aim = slot === 0 ? room : Math.round((want - sum) / (5 - out.length));
    let near = Infinity;
    for (const c of cand) near = Math.min(near, Math.abs(c.cost - aim));
    const best = cand.filter(c => Math.abs(c.cost - aim) === near);
    const c = best[Math.floor(rng() * best.length)];
    out.push(c); sum += c.cost;
  }
  const list = out.length ? out : C.slice(0, 5);
  return list.map(c => foeGrown(c, t.enemy.lv, t.enemy.soul, t.enemy.skill));
}

/* 挑む。部隊をえらんでから、しばりと兵糧を検める（お祭りと同じ順） */
function twGo(f) {
  if (f > twFloor()) { S.twMsg = 'まだ、この階には上がれぬ'; SFX.pick(); draw(); return; }
  const t = towerOf(f); if (!t) return;
  sqAsk(`${f}階に出す部隊`, `${t.name}　${t.t}`, () => twGo2(f));
}
function twGo2(f) {
  const t = towerOf(f); if (!t) return;
  const q = P.squads[P.active];
  if (!q.nos.length) { S.twMsg = '部隊を編成してから挑める'; SFX.pick(); draw(); return; }
  if (dupOrigins(q.nos).length) { S.twMsg = '同じ武将が重なっている'; SFX.pick(); draw(); return; }
  /* しばりのうち、編成で分かるぶんはここで弾く（2026-10-01）。
     戦ってから「役目ちがい」で落とすのは、兵糧も時も無駄にする */
  const ng = twTeam(f, S.picked, S.form);
  if (ng.length) { S.twMsg = ng.join('／'); SFX.pick(); draw(); return; }
  if (squadCost(q) > costMax()) { S.twMsg = 'コストが上限を超えている'; SFX.pick(); draw(); return; }
  if (P.stamina < TOWER_FOOD) {
    S.twMsg = `兵糧が足りぬ（要 ${TOWER_FOOD}）`;
    S.foodAfter = () => twGo2(f);
    S.food = true; SFX.pick(); draw(); return;
  }
  P.stamina -= TOWER_FOOD; savePlayer();
  S.twMsg = '';
  startBattle(null, null, null, null, { f });
}

/* 抜けたときの締め。褒美は初めての一度だけ */
function twClear(f) {
  const t = towerOf(f); if (!t) return null;
  const st = twState();
  const first = !twGot(f);
  if (first) {
    st.got = [...(st.got || []), f];
    if (f >= (st.floor || 1)) st.floor = Math.min(TOWER_MAX, f + 1);
    P.free = (P.free || 0) + t.rw.stone;
    if (t.rw.title) gainTitle(t.rw.title);
    savePlayer();
  }
  return { first, stone: first ? t.rw.stone : 0, title: first ? (t.rw.title || null) : null };
}

/* ---- 画面 ---- */
function twRow(t) {
  const now = twFloor();
  const done = twGot(t.f);
  const lock = t.f > now;
  const boss = isBoss(t.f), gate = isGate(t.f);
  return el('button', {
    class: 'twrow' + (done ? ' done' : '') + (lock ? ' lock' : '')
         + (boss ? ' boss' : gate ? ' gate' : '') + (t.f === now ? ' now' : ''),
    disabled: lock ? true : null,
    onclick: () => { S.twSel = t.f; S.twMsg = ''; SFX.pick(); draw(); },
  },
    el('span', { class: 'twf' }, String(t.f), el('em', {}, '階')),
    el('span', { class: 'twt' },
      el('b', {}, lock ? '？？？' : t.name),
      el('i', {}, lock ? '前の階を抜けば見える' : t.t)),
    el('span', { class: 'twr' },
      done ? el('em', { class: 'twok' }, '済')
           : el('em', { class: 'twh' }, '★'.repeat(t.hard))));
}
/* 階の札。しばり・盤・敵の強さ・褒美を出して、そこから挑む */
function twSheet() {
  const f = S.twSel; const t = towerOf(f); if (!t) return null;
  const close = () => { S.twSel = null; S.twMsg = ''; draw(); };
  const done = twGot(f);
  return el('div', { class: 'sheet', onclick: e => { if (e.target.classList.contains('sheet')) close(); } },
    el('div', { class: 'card2 twbox' },
      el('b', { class: 'mittl' }, `${f}階　${t.name}`),
      el('p', { class: 'twcond' }, t.t),
      el('div', { class: 'twmeta' },
        el('span', {}, '場所', el('b', {}, t.stage)),
        el('span', {}, '兵糧', el('b', {}, String(TOWER_FOOD))),
        el('span', {}, '難しさ', el('b', {}, '★'.repeat(t.hard)))),
      el('div', { class: 'twrw' },
        curIcon('stone'), el('b', {}, num(t.rw.stone)),
        t.rw.title ? el('em', {}, `称号「${t.rw.title}」`) : null,
        done ? el('i', { class: 'twdone' }, '受け取り済み') : null),
      el('p', { class: 'note' }, '陣中の品は持ち込めぬ。敵の陣形は、挑むまで分からぬ'),
      S.twMsg ? el('p', { class: 'twng' }, S.twMsg) : null,
      el('div', { class: 'acts2' },
        el('button', { class: 'ghost', onclick: close }, '閉じる'),
        el('button', { class: 'go', onclick: () => twGo(f) }, done ? 'もう一度挑む' : '挑む')),
      closeX(close)));
}
function screenTower() {
  const now = twFloor();
  const tier = towerTier(now);
  return {
    body: el('div', { class: 'tower' },
      el('div', { class: 'twhead' },
        el('b', {}, `試練の塔　${now} 階`),
        el('span', {}, `${TIER_NAME[tier] || ''}の重　／　百階`)),
      el('div', { class: 'twbar' }, el('i', { style: `width:${now / TOWER_MAX * 100}%` })),
      el('div', { class: 'twlist' }, TOWER.filter(t => t.f <= now + 2).reverse().map(twRow)),
      S.twSel ? twSheet() : null),
    nav: true,
  };
}

/* ================= お祭り（イベント）2026-09-23 =================
   一覧 → お祭りを選ぶ → 4つの級。前の級を取ると次が開く。
   一度取った級は「済」になり、早送り（スキップ）で盤面を見ずに決着できる。 */
/* お祭りも、出す部隊をえらんでから始める（2026-09-29）。
   兵糧やコストの検めは、部隊をえらび終えてから。
   先に検めると、札の中で部隊を替えても古い部隊で弾かれてしまう */
function evGo(id, rank, skip) {
  if (!evOpen(id, rank)) { S.evMsg = `${EV_RANKS[rank - 1]} を先に取る必要がある`; SFX.pick(); draw(); return; }
  if (evDone(id, rank)) { S.evMsg = 'この級は、もう取っている'; SFX.pick(); draw(); return; }
  const ev = evOf(id);
  sqAsk(`${skip ? '早送り' : 'お祭り'}に出す部隊`,
        `${ev ? ev.name : 'お祭り'}　${EV_RANKS[rank]}`,
        () => evGo2(id, rank, skip));
}
function evGo2(id, rank, skip) {
  const q = P.squads[P.active];
  if (!q.nos.length) { S.evMsg = '部隊を編成してから挑める'; SFX.pick(); draw(); return; }
  if (squadCost(q) > costMax()) { S.evMsg = 'コストが上限を超えている'; SFX.pick(); draw(); return; }
  if (dupOrigins(q.nos).length) { S.evMsg = '同じ武将が重なっている。編成を直してから'; SFX.pick(); draw(); return; }
  const food = EV_FOOD[rank];
  if (P.stamina < food) {
    S.evMsg = `兵糧が足りぬ（要 ${food}）`;
    S.foodAfter = () => evGo2(id, rank, skip);
    S.food = true; SFX.pick(); draw(); return;
  }
  P.stamina -= food; savePlayer();
  if (skip) { evSkip(id, rank); return; }
  startBattle(null, { id, rank });
}
/* 早送り。盤面を出さずに勝敗だけ決めて、褒美の札に飛ばす（2026-09-23） */
function evSkip(id, rank) {
  const seed = (Math.random() * 1e9) | 0;
  let s2 = seed >>> 0;
  const rng = () => { s2 = (s2 + 0x6D2B79F5) >>> 0; let x = Math.imul(s2 ^ (s2 >>> 15), 1 | s2); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  const B = evEnemy(rank, rng);
  S.stage = EV_STAGE[rank] || '草原';                  // 早送りでも級の場所で戦う（2026-09-28）
  S.stageV = rank % stageVarCount(S.stage);            // 盤面ちがいも級で固定（2026-09-28）
  S.stageFlip = false;                                 // お祭りは相手が国なので入れ替えない
  const rules = stageRules(S.stage, S.stageV, S.stageFlip);
  const res = runBattle(
    { members: S.picked.map(grownFor), generalNo: S.general, formation: S.form, slots: S.slots },
    { members: B, generalNo: B[0].no, formation: FORMS[Math.floor(rng() * FORMS.length)] },
    rules, seed, { log: true });   // 早送りでも戦いぶりを数えたいので記録は取る（2026-09-29）
  const won = res.winner === 'A';
  miBump('battle'); miBump('ev'); miBump('skip');   // お役目の数（2026-09-24）
  // 盤面は出さないが、褒美の配りかたは同じ道を通す
  // お祭りの勝ちの褒美は初めて取ったときだけ（2026-09-29）。盤面を見る戦と同じ決まりにそろえた
  const evFirst2 = !evDone(id, rank);
  BATTLE = { ev: { id, rank }, camp: null, reward: giveReward(won && evFirst2, rewardMulOf(S.picked)), march: null, skipped: true };
  BATTLE.evWon = won ? evWin(id, rank) : null;
  if (won) miBump('evOk');   // お役目の数（門出・2026-09-26）
  /* 早送りでも本当の数を出す（2026-09-29）。
     ここは盤面を見せないだけで、戦そのものは同じように解いている */
  const st2 = battleStat(res);
  S.res = { i: 0, won, reason: res.reason || '早送り', ta: 0, tb: 0, skip: true, stat: st2 };
  SFX.pick(); draw();
}

function screenEvent() {
  evState();                                  // 日付・週の切り替わりをここで通す
  /* 日が変わって出なくなったお祭りを開いたままにしない（2026-09-29） */
  const open = S.evId && evShownToday(evOf(S.evId)) ? evOf(S.evId) : null;
  if (!open) {
    return {
      body: el('div', {},
        /* 上の語りが同じことを言っているので、ここのひとことは消した（2026-09-29） */
        S.evMsg ? el('div', { class: 'shopmsg' }, S.evMsg) : null,
        /* その日に出るお祭りだけ並べる（2026-09-29）。
           武将覚醒は月〜金、特技強化は土日 */
        el('div', { class: 'evlist' }, EVENTS.filter(evShownToday).map(ev => {
          const done = EV_RANKS.filter((_, r) => evCleared(ev.id, r)).length;
          const left = EV_RANKS.filter((_, r) => evOpen(ev.id, r) && !evDone(ev.id, r)).length;
          const art = uiUrl(ev.icon);
          /* 一枚絵の幟に差し替えた（2026-09-29）。
             app/assets/ui/evbn_<お祭りのid>.webp があれば、その絵ひとつで行をまかなう。
             題も何が出るかも絵に描いてあるので、字の説明は重ねない。
             絵が無ければ、これまでの「印＋題＋ひとこと」の行に落ちる */
          const bn = uiUrl('evbn_' + ev.id);
          return el('button', {
            class: 'evrow' + (bn ? ' bn' : '') + (bn && ev.id === 'awake' ? ' hasatt' : '') + (left ? '' : ' allDone'),
            onclick: () => { S.evId = ev.id; S.evMsg = ''; SFX.pick(); draw(); },
          },
            bn ? keepImg({ class: 'evbnimg', src: bn, alt: ev.name }) : null,
            /* 今日の軍配の属性は幟の上に出す（2026-09-29）。
               日ごとに替わるので、開かないと分からないのは不親切 */
            bn && ev.id === 'awake'
              ? el('span', { class: 'evatt attr a-' + awakeAttrsToday()[0] }, awakeAttrsToday()[0])
              : null,
            bn ? null : el('span', { class: 'evic' }, art ? keepImg({ src: art, alt: '' }) : el('i', {}, ev.mark)),
            bn ? null : el('span', { class: 'evtx' },
              el('b', {}, ev.name,
                el('em', { class: 'evkind k' + ev.kind },
                  ev.kind === 'daily' ? '毎日' : ev.kind === 'weekly' ? '毎週' : '常設')),
              el('span', { class: 'evnote' }, ev.id === 'awake'
                ? `${ev.note}　／　今日は ${awakeAttrsToday().join('・')}` : ev.note)),
            el('span', { class: 'evn' }, el('b', {}, done), ` / ${EV_RANKS.length}`),
            left ? el('em', { class: 'evbadge' }, left) : null);
        }))),
      nav: true,
    };
  }
  const q = P.squads[P.active];
  return {
    body: el('div', {},
      el('button', { class: 'ghost back', onclick: () => { S.evId = null; S.evMsg = ''; SFX.pick(); draw(); } }, '← お祭りへ'),
      el('div', { class: 'card2 growbox' },
        el('div', { class: 'top' },
          /* 見出しの升は、その祭りで出るものの絵（2026-09-29）。
             ui/ev_* の絵があればそちらを先に使う */
          el('span', { class: 'f evbig' }, uiUrl(open.icon)
            ? keepImg({ src: uiUrl(open.icon), alt: '' }) : evFaceIcon(open)),
          el('div', {},
            el('b', {}, open.name),
            /* 「常設・毎日・毎週」の帯は消した（2026-09-29）。
               取ったあとに「今日はもう取った」と出るので、二重に言わなくてよい */
            el('div', { class: 'meta' },
              el('span', {}, `部隊 ${q.nos.length}体　コスト ${squadCost(q)}`)))),
        open.id === 'awake'
          ? el('p', { class: 'note' }, `今日の軍配は ${awakeAttrsToday().join('・')}`)
          : el('p', { class: 'note' }, open.note),
        S.evMsg ? el('div', { class: 'shopmsg' }, S.evMsg) : null,
        el('div', { class: 'evranks' }, EV_RANKS.map((rk, r) => {
          const opened = evOpen(open.id, r), cleared = evCleared(open.id, r), done = evDone(open.id, r);
          const rw = open.reward(r) || {};
          return el('div', { class: 'evrank' + (opened ? '' : ' locked') + (done ? ' done' : '') },
            el('div', { class: 'evhd' },
              el('b', {}, rk),
              cleared ? el('span', { class: 'evclr' }, '済') : null,
              el('span', { class: 'evfood' }, curIcon('food'), `${EV_FOOD[r]}`)),
            el('div', { class: 'evrw2' }, rwChips(rw)),
            !opened ? el('p', { class: 'note' }, `${EV_RANKS[r - 1]} を取ると開く`)
            : done ? el('p', { class: 'note' }, open.kind === 'weekly' ? '今週はもう取った' : '今日はもう取った')
            : el('div', { class: 'acts2' },
                el('button', {
                  class: 'go sm', disabled: P.stamina < EV_FOOD[r] ? null : null,
                  onclick: () => evGo(open.id, r, false),
                }, '挑む'),
                /* 土日の二つ（allRanks）は、まだ取っていなくても早送りできる（2026-09-29）。
                   二日で何度も回る祭りなので、毎回盤面を見るのはかえって重い */
                (cleared || open.allRanks) ? el('button', {
                  class: 'ghost sm', onclick: () => evGo(open.id, r, true),
                }, 'スキップ') : null));
        })))),
    nav: true,
  };
}
/* 褒美を小さな札で並べる（一覧用） */
/* お祭りの顔（2026-09-29）。
   その祭りで出るものの絵を、そのまま見出しの升に置く。
   中身を変えれば絵もついてくるので、お祭りを足しても直すところが増えない。
   絵が無ければ、これまでの一字（判・魂・書…）に落ちる */
function evFaceIcon(ev) {
  const rw = ev.reward(0) || {};
  const it = Object.keys(rw.items || {})[0];
  if (it) return itemIcon(it);
  const no = (rw.chars || [])[0];
  const o = no != null ? charOf(no) : null;
  if (o) {
    const art = faceUrl(o.no, '通常') || pawnUrl(o.no);
    if (art) return keepImg({ class: 'evfc', src: art, alt: o.name });
  }
  if (rw.koban) return curIcon('koban');
  if (rw.soul)  return curIcon('soul');
  if (rw.stone) return curIcon('stone');
  return el('i', {}, ev.mark);
}
function rwChips(rw) {
  const out = [];
  if (rw.stone) out.push(el('span', { class: 'rc2' }, curIcon('stone'), num(rw.stone)));
  if (rw.koban) out.push(el('span', { class: 'rc2' }, curIcon('koban'), num(rw.koban)));
  if (rw.soul)  out.push(el('span', { class: 'rc2' }, curIcon('soul'), num(rw.soul)));
  for (const [k, n] of Object.entries(rw.items || {})) if (n > 0)
    out.push(el('span', { class: 'rc2' }, itemIcon(k), `${k} ×${n}`));
  for (const no of (rw.chars || [])) {
    const o = charOf(no);
    if (o) out.push(el('span', { class: 'rc2 chr' }, rarTag(o.rarity, 'sm'), o.name));
  }
  return out;
}

function screenBattle() {
  boardCache = boardEl(BATTLE.rules, stageArt(S.stage));
  pawnCache = pawns(boardCache, BATTLE.res.initial);
  // 合戦のときは中身を画面の縦中央に置く（下に余白が出るため・2026-09-21）
  const body = el('div', { class: 'battlebody' },
    /* 盤面の外に、敵は上・味方は下で顔を並べる（2026-09-23）。
       一体ずつの兵量・状態異常・強化弱化・総大将の印をここで見せる */
    el('div', { class: 'roster ene', id: 'rosterB' }),
    /* 手動オートと奥義のボタンは盤面そのものに対して置く（2026-09-21）。
       ステージ絵の余白ぶん枠が広がっても、盤面の角から離れないようにするため。 */
    el('div', { class: 'boardwrap' }, fieldEl(boardCache, stageArt(S.stage),
      // 兵量は盤面の中、手動オートのボタンと同じ段の真ん中に（2026-09-23）
      el('div', { class: 'troop' },
        el('div', { class: 'fill fillA', id: 'barA' }),
        el('div', { class: 'fill fillB', id: 'barB' }),
        el('div', { class: 'mid', id: 'barMid' }),
        el('div', { class: 'n nA', id: 'tA' }, '—'),
        el('div', { class: 'n nB', id: 'tB' }, '—')),
      el('button', { id: 'autoBtn', class: 'autobtn', onclick: () => toggleAuto() },
        el('span', { class: 'lbl' }, '手動'), el('span', { class: 'g' }, '')),
      el('button', { id: 'ultBtn', class: 'ultbtn' + (uiUrl('ult_btn') ? ' art' : '') + (uiUrl('ult_btn_ready') ? ' hasready' : ''),
        style: 'display:none' },
        uiUrl('ult_btn') ? el('img', { class: 'bgimg off', src: uiUrl('ult_btn'), alt: '' }) : null,
        uiUrl('ult_btn_ready') ? el('img', { class: 'bgimg on', src: uiUrl('ult_btn_ready'), alt: '' }) : null,
        uiUrl('ult_btn') ? null : el('span', { class: 'lbl' }, '奥義'),
        el('span', { class: 'g' }, '0/5'),
        el('span', { class: 'ring' })),
      // ターンは盤面の下ぎわに、四角の札で（2026-09-23）
      el('div', { class: 'turnbox', id: 'turnBox' },
        el('em', {}, 'ターン'), el('b', { id: 'turnNum' }, '—')))),
    el('div', { class: 'roster ally', id: 'rosterA' }),
    el('div', { id: 'manualBox', style: 'margin:8px 0' }),
    el('div', { id: 'resultBox' }));
  return { body, nav: true };
}

/* ---- 盤面の外に並べる顔（2026-09-23）----
   敵は上、味方は下。一体ずつ、兵量の帯・状態異常・強化弱化・総大将の印を添える。
   drawBattle から毎回組み直すので、中身はいつでも今の盤面と合っている。 */
const STATUS_MARK = { 炎上: '炎', 感電: '電', 混乱: '乱', ひるみ: '怯', 回復不能: '癒', 挑発: '挑', 洗脳: '💕' };
function rosterRow(box, side) {
  if (!box) return;
  const units = liveUnits().filter(u => String(u.id).startsWith(side + '-'));
  const genNo = side === 'A' ? S.general : (BATTLE.B && BATTLE.B[0] ? BATTLE.B[0].no : null);
  // 総大将の印は盤面のコマと同じ絵を使う（自軍は朱、敵軍は蒼）
  const gmark = uiUrl(side === 'B' ? 'general_mark_blue' : 'general_mark_red') || uiUrl('general_mark');
  box.innerHTML = '';
  for (const u of units) {
    const no = noOf(u.id), c = charOf(no);
    const art = pawnUrl(no);
    const hp = Math.max(0, Math.round(u.hp));
    const low = u.maxHp ? hp / u.maxHp : 1;
    /* 状態異常もステータス変化も、複数あるときは並べずに
       0.5秒ごとに1つずつ切り替える（2026-09-23）。小さい枠に並べると読めないため */
    const mods = u.mods || [];
    const mb = mods.length ? el('div', { class: 'rmod' }, mods.map(m =>
      el('i', {
        class: 'ma ' + (m.up ? 'up' : 'dn') + ' s-' + m.stat,
        title: `${m.stat} ${m.up ? '上昇' : '低下'}`,
      }))) : null;
    const bad = (u.st || []).filter(Boolean);
    const bb = bad.length ? el('div', { class: 'rbad' }, bad.map(n => {
      const u2 = statusIconUrl(n);
      return u2 ? el('img', { class: 'sb art', src: u2, alt: n, title: n })
                : el('span', { class: 'sb', title: n }, STATUS_MARK[n] || n.slice(0, 1));
    })) : null;
    // 組み直した直後は全部見えてしまうので、その場で1つに絞る
    if (bb) stFace(bb);
    if (mb) stFace(mb);
    box.append(el('div', {
      /* 顔を押すと、その武将の札が開く（2026-09-30）。
         戦のさなかに数値や特技を確かめたいのに、押しても何も起きず、
         長押しすると端末の「画像を保存」が出てしまっていた */
      class: 'rc' + (u.alive ? '' : ' dead') + (no === genNo ? ' gen' : '') + (c ? ' tapc' : ''),
      title: c ? `${c.name}　兵量 ${num(hp)} / ${num(u.maxHp || 0)}　（押すと札）`
               : `兵量 ${num(hp)} / ${num(u.maxHp || 0)}`,
      onclick: c ? (e => { e.stopPropagation(); SFX.pick(); openCard(c, true); }) : null,
    },
      el('div', { class: 'rf' },
        art ? el('img', { src: art, alt: '' }) : el('i', { style: c ? chipStyle(c) : '' }),
        // 総大将は左上
        no === genNo
          ? (gmark ? el('img', { class: 'rgen art', src: gmark, alt: '総大将' })
                   : el('span', { class: 'rgen' }, '大'))
          : null,
        // 状態異常は右上。盤面のコマと同じ絵を使う（2026-09-23）
        bb,
        /* ステータスの上下は右下（2026-09-23 改訂）。
           小さい絵は何が変わったか読めなかったので、矢印の向きと色だけにした。
           火力＝赤／防御＝緑／回復＝水／速さ＝黄／賢さ＝紫。
           複数かかっているときは縦に並べず、盤面のコマと同じ拍で1つずつ切り替える */
        (u.mods || []).length ? mb : null,
        // 討たれた者は灰色に沈めて、大きな × を重ねる（2026-09-23）
        u.alive ? null : (uiUrl('red_x')
          ? el('img', { class: 'rko art', src: uiUrl('red_x'), alt: '討死' })
          : el('span', { class: 'rko' }, '✕'))),
      // 兵量は帯ではなく数字で（2026-09-23）
      el('div', { class: 'rhpn' + (u.alive ? (low <= 0.2 ? ' bad' : low <= 0.5 ? ' warn' : '') : ' dead') },
        u.alive ? num(hp) : '0')));
  }
}

/* ---- 開戦の札（2026-09-23）----
   どこの戦か・相手は誰か・空はどうかを、始まる前に一枚だけ見せる。 */
/* 開戦のカットイン（2026-09-24 作り直し）
   箱のポップアップをやめ、奥義と同じ「帯」の見せ方に寄せた。
     上段  〈国名〉 [家紋] 〈決戦／緒戦…〉
     中央  いざ！出陣じゃー！（ui/vs_title.png）
     下段  [天候] 〈家名　相手の大将〉
   天候の一言は出さない（1.2秒では読めないため）。 */
function vsSheet() {
  const v = S.vs; if (!v) return null;
  const title = uiUrl('march_call') || uiUrl('vs_title');
  return el('div', { class: 'cutin vscut' },
    el('div', { class: 'band' }),
    el('div', { class: 'vsin' },
      el('div', { class: 'vsrow top' },
        el('b', {}, v.ttlL),
        v.house ? kamon(v.house, 'big') : null,
        el('b', {}, v.ttlR)),
      title ? keepImg({ class: 'vsart', src: title, alt: 'いざ！出陣じゃー！' })
            : el('div', { class: 'vsart none' }, 'いざ！出陣じゃー！'),
      el('div', { class: 'vsrow foot' },
        wTag(v.w, 'big'),
        el('span', { class: 'vsfoe' }, v.foe))));
}

/* ---------------- 描画 ---------------- */
// 画面が変わったらBGMを、ステージが変わったら環境音を差し替える
const AMB = { '地形なし': 'amb_plain', 草原: 'amb_plain', 山岳: 'amb_mountain',
              河川: 'amb_river', 海: 'amb_sea', 城郭: 'amb_castle' };
/* 画面ごとの曲（2026-09-28）。前は「合戦」と「それ以外」の二つしかなかった。
   並びで渡すと、置いてある最初の一本が鳴る。だから曲を1本ずつ足していける。
   どれも無ければ最後の bgm_home に落ち、それも無ければ無音（音が無くても遊べる） */
const SCREEN_BGM = {
  title:     ['bgm_title', 'bgm_home'],
  gacha:     ['bgm_gacha', 'bgm_home'],
  gachalist: ['bgm_gacha', 'bgm_home'],
  map:       ['bgm_map', 'bgm_home'],
  tutorial:  ['bgm_gacha', 'bgm_title', 'bgm_home'],
};
/* 天候の音（2026-09-28）。地形の音より天候のほうが強いので、あれば入れ替える。
   晴と曇は地形の音のまま（風の音を二重にしても うるさいだけ） */
const AMB_W = { 雨: 'amb_rain', 雪: 'amb_snow', 嵐: 'amb_storm' };
function battleBgm() {
  /* 国主との一戦だけ別の曲にできる。bgm_boss.mp3 が無ければ ふだんの合戦の曲 */
  const c = BATTLE && BATTLE.camp;
  const lord = !!(c && c.pref && c.pref.lord && c.step >= c.pref.battles - 1);
  return lord ? ['bgm_boss', 'bgm_battle', 'bgm_home'] : ['bgm_battle', 'bgm_home'];
}
/* 場面替わりのつなぎ音（2026-09-28）。
   大きな画面が入れ替わったときだけ一度鳴らす。
   合戦へ入るときは開戦の合図があるので重ねない（低い音がふたつ重なると濁る） */
let lastScreen = null;
/* 嵐の日は、ときどき雷を落とす（2026-09-29）。
   環境音の輪に混ぜず、8〜20秒のばらばらな間で一発ずつ鳴らす。
   輪にしてしまうと同じ間で鳴って「録音」に聞こえる。ばらけさせると空が生きる */
let thunderT = null;
function thunderOn(on) {
  if (!on) { if (thunderT) { clearTimeout(thunderT); thunderT = null; } return; }
  if (thunderT) return;
  const again = () => {
    thunderT = setTimeout(() => {
      thunderT = null;
      if (!P.sound || S.screen !== 'battle' || !BATTLE || BATTLE.weather !== '嵐') return;
      SFX.kaminari(); again();
    }, 8000 + Math.random() * 12000);
  };
  again();
}
function updateAudio() {
  thunderOn(P.sound && S.screen === 'battle' && !!BATTLE && BATTLE.weather === '嵐');
  if (!P.sound) return;
  if (lastScreen !== null && lastScreen !== S.screen && S.screen !== 'battle') SFX.tsunagi();
  lastScreen = S.screen;
  if (S.screen === 'battle') {
    bgm(battleBgm());
    const w = BATTLE && AMB_W[BATTLE.weather];
    ambient([w, AMB[S.stage] || 'amb_plain'].filter(Boolean));
  } else {
    bgm(SCREEN_BGM[S.screen] || ['bgm_home']);
    ambient(null);
  }
}

/* 下ナビ。順番は 全国／編成／ホーム／図鑑／ガチャ。ホームが真ん中（2026-09-21） */
const NAV = [
  { key: 'map', lbl: '全国', mark: '国' },
  // ボタンの絵は「編成」のまま。文字だけ育成にした（2026-09-21）
  { key: 'grow', lbl: '育成', art: '編成', mark: '陣' },
  { key: 'home', lbl: 'ホーム', mark: '城', home: true },
  { key: 'dex', lbl: '図鑑', mark: '巻' },
  { key: 'gachalist', lbl: 'ガチャ', art: 'ガチャ', mark: '籤' },
];
// 育成の下位画面はすべて「育成」を光らせる
const NAV_OF = { map: 'map', march: 'map', grow: 'grow', squads: 'grow', team: 'grow', form: 'grow',
                 power: 'grow', skillup: 'grow', inherit: 'grow', shop: 'grow',
                 home: 'home', dex: 'dex', gacha: 'gachalist', gachalist: 'gachalist' };
function navBar() {
  const here = NAV_OF[S.screen];
  const nf = uiUrl('nav_frame');
  return el('div', nf ? { class: 'nav framed', style: `--nframe:url(${nf})` } : { class: 'nav' },
    NAV.map(n => {
    const on = here === n.key;
    /* 絵があれば漢字の代わりに使う（2026-09-21）。
       nav_全国.png ／ 選んでいるとき用の nav_全国_on.png（無ければ同じ絵を金に光らせる） */
    const base = 'nav_' + (n.art || n.lbl);
    const art = uiUrl(base), lit = uiUrl(base + '_on');
    return el('button', {
    class: 'nv' + (on ? ' on' : '') + (n.home ? ' home' : '') + (art ? ' pic' : ''),
    onclick: () => {
      if (S.screen === n.key) return;
      if (S.screen === 'battle') { fxToken++; BATTLE = null; S.res = null; S.vs = null; }   // 合戦から抜けるときは再生を止める
      S.screen = n.key; S.detail = null; S.rates = false; S.shop = false; S.menu = false;
      /* 下の帯は札より前に出しているので、札を開いたままでも押せる（2026-09-30）。
         そのまま移ると札の覚えが残るので、ここで一度ぜんぶ片づける */
      S.pw = null; S.gpop = false; S.cp = false; S.sqp = null; S.mi = false;
      S.fr = false; S.frId = null; S.bag = false; S.rk = false; S.news = false; S.help = false;
      S.sqpHold = null;   // 下のナビで別の画面へ行ったら、預かっていた戦は忘れる（2026-09-30）
      if (n.key !== 'gacha' && n.key !== 'gachalist') { S.gacha = null; S.gbox = null; S.gboxing = false; S.gopen = false; S.rv = null; S.rvall = null; }
      SFX.pick(); draw();
    },
  }, art
      // 絵のときは、名前をボタンの下のほうに重ねる（2026-09-21）
      ? el('i', {}, keepImg({ src: (on && lit) || art, alt: n.lbl,
            // 選んでいるとき用の絵が無ければ、同じ絵を金に光らせる
            class: on && !lit ? 'lit' : '' }),
          el('span', {}, n.lbl))
      : [el('i', {}, n.mark), el('span', {}, n.lbl)]);
  }));
}

/* ---- 画面ごとの背景（2026-09-22）----
   app/assets/bg/<下の名前>.jpg を置くと、その画面の後ろに敷かれる。
   ホーム・ガチャ・全国は画面の側で自前に出しているので、ここでは扱わない。
   絵の上に文字や札がびっしり乗るので、暗幕（.scrim）を重ねて読めるようにする。 */
const SCREEN_BG = {
  march:   'march',    // 出陣
  squads:  'squads',   // 部隊
  team:    'team',     // 編成
  form:    'form',     // 陣形と配置
  grow:    'grow',     // 育成
  power:   'power',    // 武将強化
  skillup: 'skillup',  // 特技強化
  inherit: 'inherit',  // 特技継承
  shop:    'shop',     // ショップ
  dex:     'dex',      // 図鑑
  /* くじ選び（2026-09-28）。専用の絵は無いので家紋の地紋に落ちる。
     あとで bg/gachalist.jpg を置けば そちらが優先される */
  gachalist: 'gachalist',
  battle:  'battle',   // 合戦（2026-09-23）。盤面の上下、陣幕の帯になる
  event:   'event',    // お祭り（2026-09-23）
};
/* その画面の専用の絵が無いときに敷く地紋（2026-09-23）。
   家紋を散らした茶色の一枚で、黒いままの画面をぜんぶ埋める。
   あとで march.jpg などを置けば、そちらが優先される */
const BG_FALLBACK = 'kamon';
function screenBg() {
  /* はじまりの一騎だけ家紋の地紋を敷く（2026-09-30）。
     真っ黒だと ほかの画面と別物に見えた。十連のほうは くじ自前の景色があるので敷かない */
  const name = S.screen === 'tutorial'
    ? (P.tutorial === 0 ? BG_FALLBACK : null)
    : SCREEN_BG[S.screen];
  if (!name) return null;
  const cls = 'bgfull scrim' + (S.screen === 'battle' ? ' bgbattle' : '');
  /* 合戦の地紋は、その日の空で差し替える（2026-09-26）。
     bg/battle_雨.mp4 があれば動く背景、bg/battle_雨.jpg があれば静止画、
     どちらも無ければ これまでの bg/battle.jpg に落ちる。
     動かすかどうかは環境設定で切れる（古い端末や電池のため） */
  if (S.screen === 'battle' && BATTLE && BATTLE.weather) {
    const w = name + '_' + BATTLE.weather;
    const still = bgUrl(w) || bgUrl(name) || bgUrl(BG_FALLBACK);
    const mv = P.bgMove === false ? null : bgVideoUrl(w);
    if (mv) return el('div', { class: 'bgstack' },
      keepVid(mv, still, 'bgvid'),
      el('div', { class: cls + ' onvid' }),
      levinEl(BATTLE.weather));
    if (bgUrl(w)) return el('div', { class: 'bgstack' },
      keepBg(still, cls), levinEl(BATTLE.weather));
  }
  const u = bgUrl(name) || bgUrl(BG_FALLBACK);
  // 合戦だけは暗幕のかけ方が違う（盤面が真ん中を覆うので、上下だけ濃くする）
  return keepBg(u, cls);
}
/* 稲光（2026-09-26）。動画には焼き込まず、ここで光らせる。
   焼き込むと1秒ごとに光ってしまうし、空ごとに間合いを変えられない。
   CSS の長い周期でまばらに光らせるので、走らせ続ける仕掛けは要らない（0バイト） */
function levinEl(w) {
  if (w !== '雨' && w !== '嵐') return null;
  return el('div', { class: 'levin' + (w === '嵐' ? ' wild' : '') });
}

/* 題の帯を出さない画面（2026-09-23）。絵や別の見出しがすでに題になっている */
/* 画面の題を、ガチャ一覧と同じ「語り」にした（2026-09-29）。
   ただ題を一行置くより、何をする場所なのかが分かる。
   書き出しの一言を太く出し、そのあとに何ができるかを短く添える。
   語り手は日ごと・画面ごとに持ち武将の中から選ぶので、毎日ちがう顔が出る
   （描き直しても変わらないよう、日付と画面名から決める。乱数は使わない） */

/* ================= チュートリアル（2026-09-30）=================
   はじめて遊ぶ人に、押す所をひとつずつ指で差す。
   目当ての釦のほかは薄くして押せなくする（三本線・戻る・閉じるはいつでも押せる）。

   道すじ：一騎をえらぶ → 名乗り → 城 → 育成 → 武将強化
           → 部隊編成 → 陣形 → 初陣（一対一・手動）
           → お役目の褒美 → 特技強化 → 特技継承 → くじ
   先に強くしてから戦わせる並びにした（2026-09-30）。
   組んで戦ってから鍛えるより、育てた子で勝つほうが手ごたえが伝わる

   P.gstep が何歩目か。1 から始まり、GUIDE の数を超えたら 0 に戻して終わり。
   古い保存は 0 のままなので、これまで遊んでいる人には出ない。

   各歩は find() で「いま指す釦」を返す。その画面にいなければ、そこへ行く釦を返す。
   返した釦を押すと、次の歩へ進む（auto があれば、その条件で勝手に進む）。 */
const GUIDE_FIGHT = 10;                // 初陣の歩（GUIDE の何番目か。1 はじまり）
const guideOn = () => P.gstep > 0 && P.gstep <= GUIDE.length;
const gdNow = () => (guideOn() ? GUIDE[P.gstep - 1] : null);
const gq = sel => document.querySelector(sel);
const gdNav = lbl => [...document.querySelectorAll('.nav button')]
  .find(b => (b.textContent || '').trim() === lbl) || null;
const gdGm = name => [...document.querySelectorAll('.gm')]
  .find(b => (b.title || '') === name) || null;
/* 回り道の印（2026-09-30）。
   目当ての画面にいないとき「そこへ行く釦」を差すが、それを押しても歩は進めない。
   印を付けておかないと、帯を押すだけで先へ飛んでしまう */
const gdVia = n => { if (n) n.dataset.gdvia = '1'; return n; };
const gdToGrow = () => gdVia(gdNav('育成'));
const gdToSquads = () => (S.screen === 'grow' ? gdVia(gdGm('部隊編成')) : gdVia(gdNav('育成')));
/* 目当ての釦。使えなければ、その手前に押すもの（素材えらびなど）を差す */
const gdAct = (title, pickSel) => {
  const b = [...document.querySelectorAll('button')].find(x => (x.title || '') === title);
  if (b && !b.disabled) return b;
  return gq(pickSel) || null;
};
/* 手ほどき用のもう一騎＝いちばん若い番号のN（絵が無くても動く） */
const guideMate = () => {
  const list = (POOL.N || []).slice().sort((a, b) => a.no - b.no);
  return list.length ? list[0].no : null;
};
/* 初陣の国（出発の国のとなり）。地図の旗は title が「県名　家名」 */
const gdFirstFlag = () => {
  const fp = firstPref(); if (!fp) return null;
  /* その国のある章に切り替えておく（2026-09-30）。
     章がちがうと旗じたいが画面に無く、どこも光らなかった */
  if (S.region !== fp.pref.region && openRegions().includes(fp.pref.region)) {
    S.region = fp.pref.region; setTimeout(draw, 0); return null;
  }
  return [...document.querySelectorAll('.flag, .pc')]
    .find(b => !b.disabled && (b.title || b.textContent || '').includes(fp.pref.name)) || null;
};
const GUIDE = [
  // ── 城で、まず鍛える ──
  { say: ['まずは武将を鍛えるワン！', '下の帯の「育成」を押すワン'],
    find: () => gdNav('育成') },
  /* 稽古はひと続きの手順なので、押すたびに歩を進めず「位が上がったら」次へ */
  { say: ['稽古をつけるワン！', '「武将強化」から、鍛える子をえらんで 稽古の書を食わせるワン'],
    auto: () => Object.values(P.chars || {}).some(c => (c.lv || 1) > 1),
    find: () => {
      if (S.screen !== 'power') return S.screen === 'grow' ? gdVia(gdGm('武将強化')) : gdToGrow();
      if (!S.gpop) return gq('.pickgrid .pg');
      if (S.pw !== '稽古') return gq('.pwb[title="稽古"]');
      return gq('.fdm:not(.off)');
    } },
  // ── 部隊を組む ──
  { say: ['つぎは部隊だワン！', '育成の「部隊編成」を押すワン'],
    find: () => S.screen === 'grow' ? gdGm('部隊編成') : gdToGrow() },
  { say: ['出す部隊をえらぶワン！', '「編成する」を押すワン'],
    find: () => S.screen === 'squads' ? gq('.footrow .go') : gdToSquads() },
  { say: ['出す武将をえらぶワン！', '札を押すと出陣に入るワン。決まったら下の「陣形へ」を押すワン'],
    find: () => {
      if (S.screen !== 'team') return gdToSquads();
      /* まず一枚 押させてから陣形へ（2026-09-30）。
         はじめから入っている一騎だけだと、札を押す手ざわりを覚える場が無かった */
      const un = document.querySelector('.tgrid .card:not(.on):not(.samelord)');
      if (un && S.picked.length < 2) return gdVia(un);
      return gq('.acts .go');
    },
    /* 札を差しているあいだも「陣形へ」は押せるままにする（行き止まりを作らない） */
    also: '.acts .go' },
  { say: ['陣を敷くワン！', '武将を枠に引いて置くワン。置けたら「保存して部隊へ」だワン'],
    find: () => {
      if (S.screen !== 'form') return gdToSquads();
      /* 枠に入れていない武将が居るあいだは、その子を差す（2026-09-30）。
         引いて置く仕草を一度やってもらう。押しても歩は進めない（回り道あつかい） */
      const u = document.querySelector('.bench .u');
      if (u) return gdVia(u);
      return gq('.acts .go');
    },
    /* 引いて置けなくても先へ進めるように、「保存して部隊へ」は押せるままにする。
       枠に入れなかった武将は、どのみち自動で空いた枠に入る */
    also: '.acts .go' },
  // ── 初陣 ──
  { say: ['いざ出陣だワン！', '右下の「出陣」を押して、全国へ出るワン'],
    find: () => S.screen === 'squads' ? gq('.sqedit.out') : gdToSquads() },
  { say: ['となりの国へ攻めるワン！', '光っている国を押すワン'],
    find: () => S.screen === 'map' ? gdFirstFlag() : gdVia(gdNav('全国')) },
  { say: ['ここが初陣だワン！', '「出陣」を押すワン。相手は総大将ただ一騎だワン'],
    find: () => S.screen === 'march' ? gq('.marchgo .go') : gdVia(gdNav('全国')) },
  /* 初陣。盤面のあいだは何も出さず、何も縛らない（guidePaint が盤面では早じまいする）。
     勝つまでが手ほどきなので、負けて戻ってきたら もう一度「出陣」を差す（2026-09-30）。
     前は戦の語りが城や地図にまで出たうえ、負けると先へ進めなくなっていた */
  { say: ['勝つまでが手ほどきだワン！', 'もう一度「出陣」を押すワン。負けても減るのは兵糧だけだワン'],
    free: true, auto: () => (P.wins || 0) >= 1,
    find: () => S.screen === 'march' ? gq('.marchgo .go')
              : S.screen === 'map' ? gdFirstFlag()
              : gdVia(gdNav('全国')) },
  // ── 城に戻って、残りをひと通り ──
  { say: ['お役目の褒美を受け取るワン！', '城に戻って「任」を押して、たまった褒美を頂くワン'],
    /* 受け取ったら次へ。もらえるものが一つも無いときは、札を開いた時点で次へ（2026-09-30） */
    auto: () => ['gd', 'gw', 'ge', 'gt', 'gf'].some(k => ((P.mi || {})[k] || []).length > 0)
      || (S.mi && !document.querySelector('.mig.on')),
    find: () => {
      if (S.screen !== 'home') return gdVia(gdNav('ホーム'));
      if (!S.mi) return gq('.hmb[title*="お役目"]');
      return gq('.mig.on') || gq('.sheet .go.wide:not([disabled])');
    } },
  { say: ['つぎは技を磨くワン！', '「特技強化」から、重ねを食わせて技の位を上げるワン'],
    auto: () => Object.values(P.chars || {}).some(c => (c.sk || []).some(v => v > 1)),
    find: () => {
      if (S.screen !== 'skillup') return S.screen === 'grow' ? gdVia(gdGm('特技強化')) : gdToGrow();
      if (!S.gpop) return gq('.pickgrid .pg');
      return gdAct('強化する', '.matpick .mc:not(.off)');
    } },
  { say: ['技を継がせるワン！', '「特技継承」で、ほかの子の技をひとつ受け継ぐワン'],
    auto: () => Object.values(P.chars || {}).some(c => (c.inh || []).some(Boolean)),
    find: () => {
      if (S.screen !== 'inherit') return S.screen === 'grow' ? gdVia(gdGm('特技継承')) : gdToGrow();
      if (!S.gpop) return gq('.pickgrid .pg');
      return gdAct('技を継承する', '.matpick .mc');
    } },
  { say: ['締めはくじだワン！', '下の帯の「ガチャ」を押すワン。初回の十連はただだワン'],
    /* 引き終わるまで続ける（2026-09-30）。帯をえらんで、十連を押すまで */
    auto: () => !P.firstFree,
    find: () => {
      if (S.screen === 'gacha') return gq('.pulls .pull.free') || gq('.pulls .pull.ten');
      if (S.screen === 'gachalist') {
        /* 門出のくじ（信わんが出るのはここだけ）を名指しで差す */
        const i = GACHAS.findIndex(x => x.id === 'release');
        const rows = [...document.querySelectorAll('.glrow')];
        return rows[i >= 0 ? i : 0] || null;
      }
      return gdVia(gdNav('ガチャ'));
    } },
];
/* 指差しを描く。draw() の最後から毎回よぶ。
   幕は出さず、押せない釦を薄くするだけ（2026-09-30 に決めた見せ方） */
function guidePaint() {
  /* 歩が最後を越えたら 0 に戻す（2026-09-30）。
     0 でないあいだは「強化は必ず成功」が効きっぱなしになるので、必ず片づける */
  if (P.gstep > GUIDE.length) { P.gstep = 0; savePlayer(); }
  for (const n of document.querySelectorAll('.gdsay, .gdarw')) n.remove();
  for (const n of document.querySelectorAll('.gdhit')) n.classList.remove('gdhit', 'gdrel');
  for (const n of document.querySelectorAll('[data-gdvia]')) delete n.dataset.gdvia;
  for (const n of document.querySelectorAll('[data-gdok]')) delete n.dataset.gdok;
  for (const n of document.querySelectorAll('.gdlock')) n.classList.remove('gdlock');
  document.body.classList.toggle('gdon', guideOn());
  const g = gdNow(); if (!g) return;
  if (g.auto && g.auto()) {
    P.gstep++; if (P.gstep > GUIDE.length) P.gstep = 0;
    savePlayer(); setTimeout(draw, 0); return;
  }
  /* 名乗りの一枚絵・盤面・天下の分け目のあいだは、指差しをまったく出さない（2026-09-30）。
     どれも読ませたい見せ場なので、重ねないし、縛りもしない */
  if (S.opening || S.screen === 'battle' || S.win || (S.screen === 'map' && !P.camp.intro)) return;
  const hit = g.find ? g.find() : null;
  /* 押せるもの：目当ての釦・三本線・戻る・閉じる。それ以外は薄くして触れなくする。
     free の歩（戦のさなか）と、差す先が見つからないときは 何も縛らない
     （縛ったまま指す先を見失うと、どこも押せない行き止まりになる） */
  if (!(g.free || !hit)) {
    /* also ＝ 指してはいないが押せるままにしておく釦（2026-09-30）。
       これを押しても歩は進むので、引いて置けなくても先へ行ける */
    const also = g.also ? [...document.querySelectorAll(g.also)] : [];
    for (const x of also) x.dataset.gdok = '1';
    for (const b of document.querySelectorAll('button, [role="button"], input, select')) {
      const keep = (b === hit || hit.contains(b) || b.contains(hit))
        || also.some(x => x === b || x.contains(b) || b.contains(x))
        || b.classList.contains('menub') || b.classList.contains('back')
        || b.classList.contains('sheetclose') || b.classList.contains('rvskip')
        || b.classList.contains('nv')
        /* 戻る・閉じるのたぐいと、手引きの「やめる」は必ず押せるままにする（2026-09-30）。
           .sqback などを錠していたせいで、行き止まりになることがあった */
        || b.classList.contains('gdquit') || b.classList.contains('sqback')
        || b.classList.contains('xclose') || b.classList.contains('ghost');           // 下の帯はいつでも押せる
      if (!keep) b.classList.add('gdlock');
    }
  }
  if (!hit) { gdBubble(g, null); return; }
  hit.classList.add('gdhit');
  /* 位置の決まっていない釦だけ relative にする（2026-09-30）。
     .flag や .sqedit のように absolute で置いてある釦にまで relative をかけると、
     置き場所が流れて、旗が地図から外れたり 出陣の釦が札の左に出たりしていた */
  if (getComputedStyle(hit).position === 'static') hit.classList.add('gdrel');
  let r = hit.getBoundingClientRect();
  /* はみ出している釦は、まず見えるところまで運ぶ（2026-09-30）。
     地図は横に長く、画面の下も切れるので、端が少しでも外に出ていたら寄せる */
  /* 地図は上の帯（章のタブ）と下の霞が地図にかぶるので、その内側を「見えるところ」とみなす（2026-09-30） */
  const onMap = !!hit.closest('.jmap');
  const top0 = onMap ? 150 : 0, bot0 = innerHeight - (onMap ? 140 : 0);
  if (!r.width || r.left < 0 || r.top < top0 || r.right > innerWidth || r.bottom > bot0) {
    hit.scrollIntoView({ block: 'center', inline: 'center' });
    r = hit.getBoundingClientRect();
    /* 巻く入れ物（絵巻地図）は scrollIntoView が効かないことがあるので、手で寄せる。
       地図は縦にも巻けるようにしたので（2026-09-30）、上下も同じように寄せる */
    const outX = r.left < 0 || r.right > innerWidth;
    const outY = r.top < top0 || r.bottom > bot0;
    if (outX || outY) {
      for (let n = hit.parentElement; n; n = n.parentElement) {
        const wide = n.scrollWidth > n.clientWidth + 4, tall = n.scrollHeight > n.clientHeight + 4;
        if (!wide && !tall) continue;
        const bb = n.getBoundingClientRect();
        if (outX && wide) n.scrollLeft += (r.left + r.width / 2) - (bb.left + n.clientWidth / 2);
        if (outY && tall) n.scrollTop += (r.top + r.height / 2) - (bb.top + n.clientHeight / 2);
        break;
      }
    }
  }
  gdBubble(g, hit);
  /* 絵や書体が入ると高さが変わるので、少し待ってから置き直す（2026-09-30）。
     「はじめは位置がずれていて、画面を動かすと直る」のはこれが理由だった */
  setTimeout(gdRelayout, 60);
  setTimeout(gdRelayout, 260);
  setTimeout(gdRelayout, 700);
}
/* 矢印と語りを、指す釦のいまの場所に合わせて置く（2026-09-30）。
   画面を巻くと釦は動くのに、position:fixed の矢印と語りは止まったままだったので、
   巻くたび・画面の向きが変わるたびに置き直す */
function gdBubble(g, hit) {
  let a = document.querySelector('.gdarw');
  let say = document.querySelector('.gdsay');
  if (!say) {
    const no = talkerNo('guide' + P.gstep);
    const art = faceUrl(no, '笑顔') || faceUrl(no, '通常') || pawnUrl(no);
    say = el('div', { class: 'gdsay' },
      art ? el('img', { class: 'gdf', src: art, alt: '' }) : el('i', { class: 'gdf' }, '犬'),
      el('div', { class: 'gdb' }, el('b', {}, g.say[0]), el('p', {}, g.say[1])),
      /* 逃げ道（2026-09-30）。戻るなどで思わぬ画面へ行くと、
         指す先が別の画面にあって進めなくなることがあった。いつでも降りられるようにする */
      el('button', { class: 'gdquit', title: '手引きをやめる',
        onclick: () => { P.gstep = 0; savePlayer(); SFX.pick(); draw(); } }, 'やめる'));
    document.body.append(say);
  }
  if (!hit) {                                   // 指す先が無いときは、いつもの下ぎわ
    if (a) a.remove();
    say.style.top = ''; say.style.bottom = '';
    return;
  }
  const r = hit.getBoundingClientRect();
  if (!r.width) return;
  const up = r.top > 210;                       // 上に置けないときは下から差す
  if (!a || a.classList.contains('dn') !== !up) {
    if (a) a.remove();
    a = el('div', { class: 'gdarw' + (up ? '' : ' dn') });
    document.body.append(a);
  }
  a.style.left = Math.round(Math.max(20, Math.min(innerWidth - 20, r.left + r.width / 2))) + 'px';
  a.style.top = Math.round(up ? r.top - 30 : r.bottom + 10) + 'px';
  const h = say.getBoundingClientRect().height || 76;
  if (up) {
    say.style.bottom = Math.round(Math.max(8, innerHeight - r.top + 34)) + 'px';
    say.style.top = 'auto';
  } else {
    say.style.top = Math.round(Math.min(innerHeight - h - 8, r.bottom + 36)) + 'px';
    say.style.bottom = 'auto';
  }
}
/* 巻いたり向きが変わったりしたら、置き直す */
let gdTick = 0;
function gdRelayout() {
  if (!guideOn() || gdTick) return;
  /* 語りが出ていないときは、何もしない（2026-09-30）。
     前はここが語りを作り直していたので、手引きを出してはいけない画面
     （開幕の一枚絵・合戦・天下の分け目の札）にも語りが居残り、
     指す先が無いまま画面がふさがって先へ進めなくなっていた */
  if (!document.querySelector('.gdsay')) return;
  gdTick = requestAnimationFrame(() => {
    gdTick = 0;
    const g = gdNow(); if (!g) return;
    gdBubble(g, document.querySelector('.gdhit'));
  });
}
addEventListener('scroll', gdRelayout, { passive: true, capture: true });
addEventListener('resize', gdRelayout, { passive: true });
/* 指した釦が押されたら次の歩へ。click は capture で先に受ける（2026-09-30） */
document.addEventListener('click', e => {
  if (!guideOn()) return;
  const g = gdNow();
  if (g && g.auto) return;                        // ひと続きの手順は auto の条件で進む
  const ok = e.target.closest && e.target.closest('[data-gdok]');
  const hit = document.querySelector('.gdhit');
  const onHit = hit && (e.target === hit || hit.contains(e.target));
  if (!ok && !onHit) return;
  if (!ok && hit.dataset.gdvia) return;           // 回り道の釦では進めない
  P.gstep++;
  if (P.gstep > GUIDE.length) P.gstep = 0;         // 手引きはここまで
  savePlayer();
}, true);

const PAGE_TALK = {
  /* はじまりの一騎（2026-09-30）。持ち武将がまだ無いので、語り手は信わんに落ちる */
  tutorial: ['はじまりの一騎だワン！！',
    '天下は乱れ、犬たちが旗を掲げたワン。まずは旗下に加える武将を、ひとり選ぶワン'],
  grow:    ['育成をするワン！！', '武将を強くする場だワン。稽古で位を上げ、技を磨き、覚醒で殻を破るワン'],
  power:   ['武将を鍛えるワン！！', '稽古で位を上げ、覚醒で枠を広げ、武士の魂で数値を振り分けるワン'],
  skillup: ['特技を磨くワン！！', '同じ武将の重ねや伝書を食わせると、技の位が上がるワン'],
  inherit: ['特技を継がせるワン！！', 'ほかの武将の重ねを使って、その子の技をひとつ受け継ぐワン。◆は同じ属性だけだワン'],
  team:    ['部隊を組むワン！！', '五騎まで並べられるワン。コストの上限を超えると出陣できぬワン'],
  squads:  ['部隊をえらぶワン！！', '五つまで組み置けるワン。戦ごとに出す部隊を選べるワン'],
  form:    ['陣を敷くワン！！', '並べ方で得意・苦手が変わるワン。相手の陣立てを見てから決めるとよいワン'],
  dex:     ['武将を眺めるワン！！', '集めた者も、まだ見ぬ者も、みなここに載るワン'],
  shop:    ['買い物をするワン！！', '小判と軍功で品を換えるワン。振り売りは日が変わると入れ替わるワン'],
  event:   ['お祭りに出るワン！！', '兵糧を使って小さな戦に挑むワン。前の級を取ると次が開くワン'],
  /* 出陣の画面は、県の名と家紋の大きな見出しがもう上にあるので語りは置かない（2026-09-29） */
};
/* 語り手をえらぶ（2026-09-29）。顔の絵がある持ち武将の中から、日付と画面名で決める */
function talkerNo(screen) {
  const pool = (P.own || []).filter(no => faceUrl(no, '笑顔') || faceUrl(no, '通常'));
  const list = pool.length ? pool : [1];
  let h = 0;
  for (const ch of (screen + today())) h = (h * 33 + ch.charCodeAt(0)) >>> 0;
  return list[h % list.length];
}
function pageTalk(screen) {
  const t = PAGE_TALK[screen];
  if (!t) return null;
  const no = talkerNo(screen);
  const c = charOf(no);
  const art = faceUrl(no, '笑顔') || faceUrl(no, '通常') || pawnUrl(no);
  return el('div', { class: 'gtalk slim' + (art ? ' art' : '') },
    art ? keepImg({ class: 'gtface', src: art, alt: c ? c.name : '' })
        : el('i', { class: 'gtface' }, '犬'),
    el('div', { class: 'gtbub' },
      el('b', {}, c ? c.name : 'わんこ'),
      el('p', {}, el('em', {}, t[0]), t[1])));
}
/* 出陣も題の帯を出さない（2026-09-29）。
   すぐ下に「← 全国へ」と敵の城の語りがあって、どこにいるかは分かる */
const NO_TITLE = new Set(['title', 'home', 'battle', 'tutorial', 'gacha', 'gachalist', 'map', 'march', 'loading']);

const SCREENS = {
  title: screenTitle,
  tutorial: screenTutorial,
  march: screenMarch,
  home: screenHome, map: screenMap, squads: screenSquads, dex: screenDex,
  grow: screenGrow, power: screenPower, skillup: screenSkillUp, inherit: screenInherit, shop: screenShop,
  gacha: screenGacha, gachalist: screenGachaList, team: screenTeam, form: screenForm, battle: screenBattle,
  event: screenEvent, loading: screenLoading,
  tower: screenTower,
};
const SUB = { title: '', tutorial: 'はじまり', home: 'ホーム', map: '全国', march: '出陣', squads: '部隊', dex: '図鑑',
              gacha: 'わんこみくじ', gachalist: 'くじ選び', team: '編成', form: '陣形と配置', battle: '合戦', event: 'お祭り',
              grow: '育成', power: '武将強化', skillup: '特技強化', inherit: '特技継承', shop: 'ショップ',
              tower: '試練の塔' };
/* 画面は毎回まるごと組み直すので、そのままだと押すたびに先頭へ戻ってしまう。
   同じ画面のままなら、縦の位置を覚えておいて戻す（2026-09-21） */
let LAST_SCREEN = null;
function draw() {
  IMG_USED = new Set();          // 絵の使い回しは1回の描画につき1か所まで
  saveSquads();                                   // 画面が変わるたびに保存する
  /* 巻いている場所は #app（2026-09-30）。ページ自体は動かさなくなった */
  const keepY = (LAST_SCREEN === S.screen) ? ($('#app') ? $('#app').scrollTop : 0) : 0;
  const v = (SCREENS[S.screen] || screenHome)();
  const app = $('#app');
  app.innerHTML = '';
  // append に null を渡すと文字の "null" が出るので、先にふるい落とす
  /* スタートの画面はヘッダーもナビも出さない（2026-09-25）。一枚絵を画面いっぱいに見せたい */
  const bare = !!v.bare;
  const parts = [
    /* ヘッダーは枠を敷かない（2026-09-21）。中身が多くて必ずどこかが重なるため、
       豪華さは「魂の玉」「プレイヤーの額」など部品ごとの絵で出す。
       右上は三本線。音の切り替えなどはこの中にまとめた。 */
    bare ? null : el('header', {},
      /* 合戦のあいだは右上の三本線を出さない（2026-09-30）。
         戦のさなかに設定へ入る道は要らないし、盤面の上に釦が重なって邪魔になる。
         下の帯（フッター）はそのまま出す */
      el('div', { class: 'hrow' }, playerBar(),
        S.screen === 'battle' ? null : el('button', {
          class: 'menub', title: 'メニュー',
          onclick: () => { S.menu = true; SFX.pick(); draw(); },
        }, el('i', {}), el('i', {}), el('i', {}))),
      /* 画面名も部隊名もヘッダーには出さない（2026-09-21）。下のナビと本文で分かる */
      ),
    screenBg(),
    /* mid ＝ 中身を画面の縦まん中に置く画面（2026-09-30）。
       main は #app の flex で高さが決まるので、% ではなく main 側で寄せる */
    el('main', { class: (v.nav ? 'hasnav' : '') + (v.mid ? ' mid' : '') },
      /* 画面の題（2026-09-23）。3段の線は意味が伝わらないのでやめ、
         どの画面にいるかを帯で出すことにした。ホームや合戦など、
         絵そのものが題になっている画面には出さない */
      NO_TITLE.has(S.screen) ? null
        : (pageTalk(S.screen) || el('div', { class: 'ptitle' }, el('b', {}, SUB[S.screen] || ''))),
      v.body),
    v.nav ? navBar() : (v.bar ? el('div', { class: 'bar' }, v.bar) : null),
    // カードのポップアップはどの画面からでも開ける（2026-09-21）
    S.detail != null ? dexDetail(S.detail === '未奉公' ? UNKNOWN : charOf(S.detail)) : null,
    S.menu ? menuSheet() : null,
    S.help ? helpSheet() : null,
    S.news ? newsSheet() : null,
    S.mi ? miSheet() : null,
    S.tt ? ttSheet() : null,
    S.rk ? rkSheet() : null,
    S.link ? linkSheet() : null,
    S.reset ? resetSheet() : null,
    /* キャラカードを開いているあいだは友の札を引っ込める（2026-09-24）。
       重ねて出すとカードが友の札の裏に隠れてしまう。閉じれば友の家に戻る */
    S.detail == null ? (S.frId ? frHomeSheet() : (S.fr ? frSheet() : null)) : null,
    /* 名乗りが済むまで、どの画面の上にも出る。
       ただしスタートの画面だけは別（2026-09-25）。一枚絵を見せる場なので札を重ねない */
    (!P.name && S.screen !== 'title') ? nameSheet() : null,
    S.bag ? bagSheet() : null,
    /* 褒美の中身は、お役目の札のさらに上に重ねる（2026-09-30） */
    S.rwi ? rwInfoSheet() : null,
    /* 出す部隊をえらぶ札は、いちばん上に重ねる（2026-09-29）。
       友の家や番付の札の下に潜ってしまい、稽古が申し込めなくなっていた */
    /* 部隊えらびの札から編成へ抜けているあいだ、戦へ戻る道を左下に置く（2026-09-30） */
    (S.sqpHold && (S.screen === 'team' || S.screen === 'form'))
      ? el('button', { class: 'sqback', title: '戦へもどる',
          onclick: () => { const h = S.sqpHold; S.sqpHold = null;
                           S.screen = h.from; S.sqp = h.ask;
                           S.fr = !!h.fr; S.frId = h.frId != null ? h.frId : null; S.rk = !!h.rk;
                           SFX.pick(); draw(); } }, '← 戦へ')
      : null,
    S.keepAsk ? keepAskSheet() : null,
    S.keepMsg ? el('div', { class: 'sheet', onclick: () => { S.keepMsg = ''; draw(); } },
      el('div', { class: 'card2 keepbox' },
        el('p', {}, S.keepMsg),
        closeX(() => { S.keepMsg = ''; draw(); }))) : null,
    S.spAsk != null ? sparAskSheet() : null,
    S.sqp ? sqSheet() : null,
    S.food ? foodSheet() : null,
    S.cp ? pickSheet() : null,
    S.fire != null ? fireSheet() : null,
    S.win ? winSheet() : null,
    S.res ? resSheet() : null,
    (S.res && S.dmg) ? dmgSheet() : null,   // 戦いぶりは結果の札の上に重ねる（2026-09-29）
    S.vs ? vsSheet() : null,
  ];
  app.append(...parts.filter(Boolean));
  guidePaint();                      // はじめての手引きの指差し（2026-09-30）
  /* ヘッダーの高さを CSS に渡す（2026-09-22）。ヘッダーが二段になって高くなったぶん、
     ガチャの背景（題字が絵の上端に入っている）が下に潜らないよう、ここぶんだけ下げる */
  const hd = app.querySelector('header');
  document.documentElement.style.setProperty('--hdr', (hd ? Math.round(hd.getBoundingClientRect().height) : 0) + 'px');
  /* 自分の顔の帯（名とレベル）の下ぎわも渡す（2026-09-30）。
     ホームの左に立てる 報・袋・友・店 の列を、顔のすぐ下から始めるのに使う。
     ヘッダーの高さ（--hdr）で合わせると、二段目の空いているところぶん下がりすぎていた */
  const mebar = hd && hd.querySelector('.me');
  document.documentElement.style.setProperty('--mefoot',
    (mebar ? Math.round(mebar.getBoundingClientRect().bottom) : 0) + 'px');
  /* フッターの実際の高さも渡す（2026-09-24）。
     ホームを画面にぴったり収めて、揺れないようにするのに使う */
  const nv = app.querySelector('.nav');
  /* 帯が無い画面では 0 を入れる（2026-09-30）。
     前の画面の高さが残ったままだと、追従の戻る釦が宙に浮く */
  /* 帯を下から 8px 浮かせたので（2026-09-30）、高さだけでは足りない。
     画面の下ぎわから帯の上ぎわまでを測って渡す */
  /* 帯は下から浮かせてあり、座（丸い絵）は帯より上へはみ出している（2026-09-30）。
     いちばん上に出ているところから測らないと、本文が座に潜り込む */
  let navTop = nv ? nv.getBoundingClientRect().top : innerHeight;
  if (nv) for (const i of nv.querySelectorAll('.nv i'))
    navTop = Math.min(navTop, i.getBoundingClientRect().top);
  document.documentElement.style.setProperty('--nav',
    (nv ? Math.round(innerHeight - navTop) : 0) + 'px');
  /* 札（ポップアップ）の後ろに敷く絵（2026-09-24）。
     合戦の盤面だけは敷かない。勝敗の札の後ろに盤面が見えていてほしいので */
  const sbg = S.screen === 'battle' ? null : bgUrl('home');
  document.documentElement.style.setProperty('--scrbg', sbg ? `url("${sbg}")` : 'none');
  if (keepY) app.scrollTop = keepY;
  LAST_SCREEN = S.screen;
  updateAudio();
  if (S.screen === 'battle') drawBattle();
}
/* 兵糧を時間で戻す見張り（2026-09-26）。
   30秒ごとに数え直し、**増えたときだけ**描き直す。
   合戦のさなかと ガチャの見せ場のあいだは描き直さない（動きが飛ぶため）。
   画面に戻ってきたときも一度数え直す（裏に回っているあいだは止まるため） */
function foodTick() {
  const got = refillFood();
  if (!got) return;
  if (S.screen === 'battle' || S.rv || S.rvall || S.gbox || S.gboxing) return;
  draw();
}
setInterval(foodTick, 30000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) foodTick(); });

/* 起動したら、いまの値からお役目の数を整える（2026-09-24）。
   名乗りの前に呼んでも困らない。draw の前に一度だけ */
miRefresh();
askPersist();
draw();
