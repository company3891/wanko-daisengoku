// わんこ大戦国 プロトタイプ（2026-09-20）
// 編成 → 陣形 → 戦闘 → 勝敗。戦闘ルールは sim/src/engine.mjs をそのまま呼ぶ。
import { runBattle, withKeep, WEATHER_NOTE, WEATHER_TABLE } from '/sim/src/engine.mjs';
import { boardEl, fieldEl, pawns, byTurn, render, setBoardRev, boardCellOf, artHold, artWait, artFetch, loadManifest, flipMove, snapshotRects, lunge, hitFlash, popNumber, fleeAway, ultFlare, SFX, soundEnabled, cutIn, pawnUrl, cutinUrl, cutinArt, heroUrl, frameUrl, faceUrl, FACES, bgUrl, bgVideoUrl, fxVideoUrl, fxUrl, uiUrl, statUrl, gachaUrl, statusIconUrl, stFace, stageUrl, cardUrl, cardLayout, cardPatchUrl, skillArtUrl, unknownCardUrl, bannerUrl, attrUrl, rarUrl, fxBurst, bgm, ambient, kamonUrl, itemUrl, setPlayMul, assetUrlsOf } from './replay.js';

import { GACHAS, gachaOf, homeGacha, poolOf, urListOf, urRatesOf } from './gachas.js';
/* 束ねるときに import 行は捨てられるので、別名（as）は使えない（2026-10-01 に踏んだ）。
   tower.js のほうで twTeam / twResult という名にしてある */
import { TOWER, TOWER_FOOD, TOWER_MAX, towerOf, towerTier, TIER_NAME, isBoss, isGate,
         isGreat, twTeam, twResult } from './tower.js';
import { MK_MAX, MK_SLOTS, MK_LIFE_MS, MK_EVERY_MS, mkState, mkWorth, mkPower, mkLo, mkHi,
         mkStock, mkBought, mkBuy, mkCanList, mkList, mkPull, mkSettle, mkUnread, mkRead,
         mkNext, mkRefresh, mkCollect, mkMyList, mkMyCount, mkKuraOn,
         mkFee, mkNet } from './market.js';
import { pityOf } from './player.js';
import { TR_KI, TR_DECK, TR_DUP, TR_ULT_MAX, TR_KIND_NAME, TR_STORY, TR_PARTS, TR_MAX, TR_TIER, trReward, trKinds, trName,
         trSpec, trWords, trDefaultDeck, trDeckCount, trDupMax, trDeckOk, trBattle, trPlay, trEnd, trFoeAct,
         trRound, trLive, TR_ROWS, TR_COLS, TR_NODE, trNext, trRunNew, trFloorOf, trMaxHp, trRand,
         trTrait, TR_ITEMS, TR_ITEM_NAMES, TR_ITEM_MAX, trUseItem, trCardsFrom, trOffer, trPick, trUpKind } from './trail.js';
import { setMix } from './replay.js';
import { P, loadPlayer, savePlayer, today, miRoll, miBump, miSet, gainTitle, TICKET, TICKET_PRICE, newSquad, owns, stones, pull, gFreeOk, giveReward, rewardMulOf, sparReward, grantStarter, expNeed, expForFood, LV_MAX_PLAYER, SQUAD_MAX, COST_MAX, costMax, costBuff, costBuffLeft, useCostItem, RATES, PRICE, PITY, SOUL_BY_RARITY,
         STONE_PACKS, STONE_FREE_FROM, STONE_FREE_PCT, stonePack, addFreeStones,
         AWAKE_KOBAN, awakeKoban,
         setCampStart, prefStep, prefTaken, takenCount, regionTaken, openRegions, campLv, campBox, campLvOpen, setCampLv, canMarch, spendFood, marchFood, refillFood, foodWait, advancePref,
         ITEMS, ITEM_KINDS, item, addItem, charState, lvCapOf, spUsed, feedBook, awaken, addSp, commitSp, grownStats,
         LV_CAP, AWAKE_MAX, expToNext, SP_MAX, SP_STATS, spMaxOf, trBonus, trProg, TR_MILE, trSetProg, trBest, trTierOpen, trTier,
         dailyDeals, dealBought, buyItem, buyDeal, useFood,
         ATTRS, AWAKE_TIERS, BADGES, badgeMat, freeMat, awakeNeed, awakeCheck,
         BATTLE_STATS, WEATHERS, WEATHER_ITEM, useItem,
         SKILL_MAX, MAT_MAX, BOOK, STAR_RATE, buildStars, starOf, dupOf, skillLvOf,
         sellDup, skillRate, skillUp,
         INH_MAT_MAX, INH_RATE_NORMAL, INH_RATE_UNIQ, INH_CHARMS, inhOf, uniqInhCount, slotsOf,
         givableOf, canInherit, inhRate, inherit, lostUnique,
         matLeft, cardsNeeded, canEatCard, inSquad, dismiss, cntOf, setCnt, hasCard, fireMax,
         replacePlayer } from './player.js';
import { REGIONS, REGION_ORDER, PREFS, PREF, prefsOf, INTRO, LORD_TALK, NO_LORD_NAME, STEP_NAME, FOOD_COST, chapterRank, mapX, mapY, stageOf } from './campaign.js';
import { EVENTS, EV_RANKS, EV_FOOD, EV_POWER, EV_LV, EV_SOUL, EV_SKILL, EV_STAGE, evOf, evState, evCleared, evOpen, evDone, evWin, evRepeat,
         awakeAttrsToday, WEEKLY_PICK, evShownToday, isWeekend } from './event.js';
import { MI_TABS, MI_BOX, MISSIONS, miOf, KADODE } from './mission.js';
import { LK_TIES, LK_PASS_MIN, lkMakeCode, lkCodeOk, lkTidyCode, lkPassNg, lkPassRank,
         lkHash, lkSalt, lkTied } from './link.js';
import { KURA, linked, hello, claim, setPass, pullSave, pushSave, pushSaveForce, revOf, setRev,
         duelOpen, duelJoin,
         palMe, palList, palFind, palAsk, palOk, palNo, palBye, palDuel,
         palGift, palGiftTake, palTeam, palRaid, palRaidTake } from './net.js';
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
/* サーバーに繋がっているなら、起きたときに向こうが新しくないか見にいく（2026-10-04）。
   ほかの端末で遊んでいた場合、黙って上書きすると片方が消えるため。
   ★ここは S がまだ出来ていない位置なので、全部読み終えてから動かす（setTimeout 0） */
setTimeout(() => {
  if (!linked()) return;
  kuWatch();
  pullSave().then(g => {
    if (g && g.ok && g.blob && (g.rev || 0) > revOf()) {
      S.kuWar = { rev: g.rev, blob: g.blob, at: g.at }; draw();
    }
  }).catch(() => { /* 繋がらなくても端末の中だけで遊べる */ });
}, 0);
soundEnabled(!!P.sound);   // 覚えている音の入り切りを渡す（2026-09-28）
setMix({ bgm: sndOf('bgm'), amb: sndOf('amb'), se: sndOf('se') });
const saveSquads = savePlayer;

const S = { stage: '地形なし', filter: 'すべて', screen: 'home', manual: false, gacha: null, volOpen: false,
  /* お知らせ（2026-09-24）。news＝開いているか／newsTab＝選んでいるタグ／newsId＝読んでいる記事 */
  news: false, newsTab: '更新', newsId: null,
  /* 友（2026-09-24）。fr＝一覧を開いているか／frId＝訪ねている友／frMsg＝その場の一言 */
  fr: false, frId: null, frMsg: '',
  /* 友の札（2026-10-06）。frTab＝'find'（友を探す）／'my'（マイフレンド）、
     frQ＝さがす字、frBusy＝サーバーの返事待ち */
  frTab: 'my', frQ: '', frBusy: false,
  /* ストーン販売所（2026-10-07）。stoneBack＝どの画面から来たか
     （＋はどこからでも押せるので、戻り先を預かる）／stAsk＝確かめている口／stMsg＝その場の一言 */
  stoneBack: null, stAsk: null, stMsg: '',
  detailRO: false, detailBase: false, nmMsg: '', rwi: null,
  /* 城に入るたびのお知らせ札（2026-10-08・悠さんの指図）。
     いま何枚目を出しているか。null なら出していない */
  ad: null,
  /* 戦のさなかに札を開いたときだけ入る（2026-10-08）。
     { 火力: +120, 防御: -30 } のように、素からの差だけを持つ */
  detailMod: null,
  /* 取引所の品を札で見るとき（2026-10-01）。
     detailSt＝その品の育ち（売り主が育てた値）／detailBuy＝買える品そのもの */
  detailSt: null, detailBuy: null, mkPEdit: false,
  gpick: 0,   // くじの画面の何枚目か。0＝幟／1から＝ピックアップの紹介（2026-10-01）
  /* 武将取引所（2026-10-01）。mkTab＝雇用する／取引に出す、
     mkPut＝出す札で選んでいる武将、mkPrice＝付けている値、mkQ＝フリーワード。
     見ている品は S.detailBuy（札そのものを出すので mkSel はやめた・2026-10-01） */
  mkTab: 'buy', mkPut: null, mkPrice: 0, mkQ: '', mkMsg: '',
  /* mkBusy＝サーバーの返事を待っているあいだ（2026-10-05）。
     待っているあいだ釦を止めて、二度押しで二枚買うのを防ぐ */
  mkBusy: false,
  opSkip: false,   // はじまりの語りを早送りしたか（2026-10-05）
  mkRar: 'すべて', mkAtt: 'すべて', mkSort: 'price', mkAsc: null,   // detailBase＝図鑑から開いた札（素のまま見せる・2026-10-01）
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
  twSel: null, twMsg: '', twPz: false, twBack: false };
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
const nextExp = () => expNeed(P.lv);      // 位の表は player.js（2026-10-01）
const lvMaxed = () => P.lv >= LV_MAX_PLAYER;   // 位の上限に着いたか（2026-10-03）
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
/* 次の一つが戻るまでの残り（2026-10-01）。満ちていれば空にして消す */
function foodLeftText() {
  const w = foodWait();
  if (!w.next) return '';
  const sec = Math.ceil(w.next / 1000);
  /* 分も二けたにそろえる（2026-10-02）。1:31 と 01:31 が入れ替わると
     字の幅が変わって、ヘッダーの数がぴくぴく動いて見えた */
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
}
/* 残りの字だけを毎秒書きかえる（2026-10-01）。
   draw() を毎秒呼ぶと札も盤も作り直してしまうので、ここは字だけ差す */
function foodClock() {
  const e = document.querySelector('.w.food .fwt');
  if (!e) return;
  const t = foodLeftText();
  if (e.textContent !== t) e.textContent = t;
}
function playerBar() {
  const f = faceChar();
  // 上限に着いたら帯は満ちたまま（2026-10-03）
  const pct = lvMaxed() ? 100 : Math.max(0, Math.min(100, P.exp / nextExp() * 100));
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
      /* 名乗りは上、帯、位は帯の下（2026-10-07・悠さんの指図）。
         前は名乗りと位を一行に並べていたので、名が長いと位が押し出され、
         右の通貨の玉にまで食い込んでいた（実測：Lv.194 が石の ＋ を隠した）。
         縦に積めば、名が何文字でも位の場所は動かない */
      el('div', { class: 'lvb' },
        el('span', { class: 'l' }, el('b', { class: 'nm' }, P.name || '無名の将')),
        el('span', { class: 'g' }, el('i', { style: `width:${pct}%` })),
        el('span', { class: 'lvn' }, `Lv.${P.lv}`))),
    el('div', { class: 'cur' },
      // 兵糧は出陣のたびに減るので、いつでも見えるようにした（2026-09-21）
      /* 兵糧は時間で戻る（2026-09-26）。
         2026-10-01 改：次の一つまでの残りを、玉の下に小さく出すことにした。
         前は「説明しすぎない」で伏せていたが、出陣を待つ間だけは
         あと何分かが分からないと手持ち無沙汰になる。
         字は foodClock が毎秒書きかえる（画面ぜんぶは描き直さない） */
      (() => { const w = foodWait(); return el('span', {
        // 上限を超えて蓄えているあいだは字を金に（2026-10-03）
        class: 'w food' + (uiUrl('coin_兵糧') ? ' art' : '') + (w.full ? ' wait' : '')
             + (P.stamina > P.staminaMax ? ' over' : ''),
        title: '兵糧（出陣に使う）',
      },
        uiUrl('coin_兵糧') ? keepImg({ class: 'ci', src: uiUrl('coin_兵糧'), alt: '' }) : el('i', {}, '糧'),
        `${num(P.stamina)}`, el('em', {}, `/${num(P.staminaMax)}`),
        el('em', { class: 'fwt' }, foodLeftText()),
        // ＋から兵糧の道具をその場で使える（2026-09-21）
        el('button', {
          class: 'plus', title: '兵糧をもどす',
          onclick: e => { e.stopPropagation(); S.food = true; SFX.pick(); draw(); },
        }, '＋')); })(),
      /* 小判はヘッダーから外した（2026-09-22）。買い物のときだけ要る数字で、
         iPhone16 の幅では通貨4つが入らなかった。ショップの上に大きく出している。
         2026-10-07：**武士の魂もヘッダーから外した**（悠さんの指図）。
         名が長い人だと三つ並んで石の ＋ が隠れていた（実測：4,336 の「6」に ＋ が重なる）。
         魂を使うのは取引所だけなので、数は取引所の上に大きく出す */
      /* ストーンの玉には ＋ を添える（2026-10-07・悠さんの指図）。
         押すとストーン販売所へ。兵糧の ＋ と同じ姿にそろえてある */
      coin('stone', '勾', 'ガチャ石（有償＋無償）', stones(), false, null,
        () => { S.stoneBack = S.screen; S.screen = 'stoneshop'; S.stMsg = ''; })));
}
/* 通貨の玉（2026-09-21）
   app/assets/ui/coin_魂.png のように置くと、漢字の丸から絵に変わる。 */
function coin(cls, mark, title, n, full, arts, plus) {
  /* 絵の名は題から起こすが、軍功のように別名で来た絵もあるので
     候補を渡せるようにした（2026-09-26）。先に見つかったほうを使う。
     ※ 絵のファイル名は coin_石 のまま。呼び名をストーンに替えても素材は動かさない */
  let art = null;
  for (const nm of arts || [title.replace('武士の魂', '魂').replace('ガチャ石（有償＋無償）', '石')]) {
    art = uiUrl('coin_' + nm); if (art) break;
  }
  return el('span', { class: 'w ' + cls + (art ? ' art' : '') + (plus ? ' hasplus' : ''),
                      title: `${title}　${num(n)}` },
    art ? keepImg({ class: 'ci', src: art, alt: '' }) : el('i', {}, mark),
    full ? num(n) : numShort(n),
    /* ＋（2026-10-07）。兵糧の ＋ と同じ形。押すとストーン販売所へ */
    plus ? el('button', { class: 'plus', title: 'ストーン販売所',
      onclick: e => { e.stopPropagation(); plus(); SFX.pick(); draw(); } }, '＋') : null);
}

/* 褒美の並びで使う通貨の粒（2026-09-23）。
   ヘッダーの玉と同じ絵（coin_小判 / coin_魂 / coin_石）を使い、
   絵が無いときだけ、これまでの漢字の丸に落とす。 */
/* 通貨の絵（2026-09-25）。名を並べて書けるようにした。
   軍功は虹の勾玉の絵が coin_勾玉 で来たので、そちらも見る。
   あとから coin_軍功 を置けば、そちらが勝つ */
const CUR_ART = { koban: ['小判'], soul: ['魂'], stone: ['石'], food: ['兵糧'], gun: ['軍功', '勾玉'], exp: ['経験'] };
const CUR_MARK = { koban: '判', soul: '魂', stone: '勾', food: '糧', gun: '功', exp: '将' };
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
  /* 全国の地図とお知らせ札も先に読む（2026-10-10・悠さんの指摘）。
     地図は開いてから読んでいたので、絵の幅が0のまま組まれて
     旗が左に寄り、読み終わってから跳ねていた。
     お知らせ札も一枚ごとに読みに行くので、送るたびに間が空いていた */
  for (const n of ['map_1', 'map_2', 'map_3']) { const u = bgUrl(n); if (u) out.push(u); }
  /* 立ち絵の炎（2026-10-10）。ホームに入った瞬間から灯っているように先に読む */
  for (const n of ['虹', '赤', '黄', '青']) { const u = fxUrl('flame_' + n); if (u) out.push(u); }
  try { for (const c of adList()) { const u = adUrl(c.art); if (u) out.push(u); } } catch { }
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
const IMG_HOLD = [];
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
    /* 読んだ絵は手放さず、ほどいて（decode）おく（2026-10-10）。
       読み捨てると、画面に置いた瞬間にもう一度ほどくので一拍遅れる。
       iPhone の Safari ではこれが「札を送るたびのもたつき」に見えていた */
    im.onload = () => { IMG_HOLD.push(im); (im.decode ? im.decode().catch(() => { }) : Promise.resolve()).then(fin); };
    im.onerror = fin;
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
    /* 電波が無いなら、ここで止める（2026-10-05 ゆうごさんの指図）。
       入ってしまうと、まだ読んでいない画面の絵や飾りが揃わず崩れる。
       開く前に知らせて、初めの画面に留まってもらう */
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      S.offl = true; SFX.pick(); draw(); return;
    }
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
const lkClose = () => { S.link = null; S.lkMsg = ''; S.lkP1 = ''; S.lkP2 = ''; S.kuMsg = ''; S.kuCode = ''; draw(); };

/* パスワードを決める（はじめて発行するときも、変えるときも同じ札） */
function lkSavePass(first) {
  const code = first ? lkMakeCode() : P.link.code;
  const ng = lkPassNg(S.lkP1, S.lkP2, code);
  if (ng) { S.lkMsg = ng; draw(); return; }
  /* サーバーに預けるぶんを先に取っておく（下で S.lkP1 を空にするため）。
     平文を送るのはここだけ。サーバーでは PBKDF2 で捏ねて置かれる（2026-10-04） */
  const pw = S.lkP1;
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
  /* サーバーへ。繋がらなくても遊びは止めないので、返事は待たない（2026-10-04） */
  if (KURA) (async () => {
    if (first) {
      const h = await hello(P.link.code, P.name || '');
      if (!h.ok) return;
      await setPass(pw);
      await kuPush(true);
      kuWatch();
    } else if (linked()) {
      await setPass(pw);
    }
  })();
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

/* ---------------- サーバーへの控え（2026-10-04）----------------
   ★ゲーム内の「蔵」（ショップの棚）とは別もの。混ぜないこと。
   ★ここも戦国口調を使わない（引き継ぎ画面と同じ決めごと）。
     間違えると失うのが「気分」ではなく「データそのもの」だから。

   いちばん大事な決めごと ──「サーバーが無くても遊べる」。
   繋がらないときは静かにあきらめて、これまでどおり端末の中だけで動く。
   だからサーバーの返事を待って画面を止めることはしない。

   版くらべ：二台で遊ぶと、あとから送ったほうが先の記録を黙って消してしまう。
   それを防ぐため、送るときに手元の版を添える。食い違えばサーバーが 409 を返すので、
   どちらを採るか必ず人に尋ねる（勝手に混ぜない）。 */
let kuLast = '';        // 最後にサーバーへ送った中身。同じなら送らない（むだな書き込みを減らす）
let kuTimer = 0;

const kuBlob = () => ({ ...P, own: [...P.own] });
const kuWhen = t => { try { return new Date((t || 0) * 1000).toLocaleString('ja-JP'); } catch { return ''; } };
const kuSum = b => `${b && b.name || '名前未設定'}　Lv.${(b && b.lv) || 1}　武将 ${((b && b.own) || []).length}体　小判 ${(b && b.koban) || 0}`;

async function kuPush(force) {
  if (!linked()) return { ok: false, err: 'off' };
  /* 「あとで決める」のあいだは自動の控えを止める（2026-10-04）。
     どうせ版が食い違って弾かれるので、送るたびに同じ札が出てうるさい。
     〈今すぐ〉を押したとき（force）だけは通す ── 人が望んで送っているので */
  if (S.kuHold && !force) return { ok: false, err: 'hold' };
  const blob = kuBlob();
  const text = JSON.stringify(blob);
  if (!force && text === kuLast) return { ok: true, same: true };
  const r = await pushSave(blob);
  if (r.ok) kuLast = text;
  else if (r.status === 409) { S.kuWar = { rev: r.rev, blob: r.blob, at: r.at }; draw(); }
  return r;
}

/* 控えの送りどき。遊んでいる最中に止めたくないので、
   ①画面を離れたとき ②2分おき の二つだけ。押しての「今すぐ保存」とは別 */
function kuWatch() {
  if (kuTimer || !linked()) return;
  kuTimer = setInterval(() => { kuPush(false); }, 120000);
  const bye = () => { if (document.visibilityState === 'hidden') kuPush(false); };
  addEventListener('visibilitychange', bye);
  addEventListener('pagehide', () => kuPush(false));
}

/* この端末をサーバーにつなぐ。パスワードは手元の覚えと照らしてから預ける
   （平文を送るのはこの一度きり。サーバーでは PBKDF2 で捏ねて置かれる） */
async function kuJoin() {
  if (lkHash(S.lkP1, P.link.salt) !== P.link.pass) { S.kuMsg = 'パスワードが違います'; draw(); return; }
  S.kuBusy = true; S.kuMsg = '接続しています…'; draw();
  const h = await hello(P.link.code, P.name || '');
  if (!h.ok) {
    S.kuBusy = false;
    S.kuMsg = h.err === 'net' ? 'つながりませんでした。通信を確かめてください' : (h.err || '接続できませんでした');
    draw(); return;
  }
  await setPass(S.lkP1);
  const g = await pullSave();          // サーバーにもう記録があるなら、勝手に上書きしない
  S.kuBusy = false; S.lkP1 = ''; S.lkP2 = '';
  if (g.ok && g.blob) { S.kuWar = { rev: g.rev, blob: g.blob, at: g.at }; S.link = null; draw(); return; }
  const r = await kuPush(true);
  kuWatch();
  S.link = 'main';
  S.kuMsg = r.ok ? '接続しました。これから自動で控えます' : '接続しましたが、控えを送れませんでした';
  draw();
}

/* 別の端末から引き継ぐ。IDとパスワードで入り直し、サーバーの記録を持ってくる */
async function kuClaim() {
  const code = lkTidyCode(S.kuCode || '');
  if (!lkCodeOk(code)) { S.kuMsg = 'IDの形が違います'; draw(); return; }
  S.kuBusy = true; S.kuMsg = '確かめています…'; draw();
  const c = await claim(code, S.lkP1);
  if (!c.ok) {
    S.kuBusy = false;
    S.kuMsg = c.err === 'net' ? 'つながりませんでした。通信を確かめてください' : (c.err || 'IDかパスワードが違います');
    draw(); return;
  }
  const g = await pullSave();
  S.kuBusy = false; S.lkP1 = '';
  if (!g.ok || !g.blob) { S.kuMsg = 'そのIDには、まだバックアップがありません'; draw(); return; }
  S.kuTake = { rev: g.rev, blob: g.blob, at: g.at };
  S.link = null; draw();
}

/* サーバーの記録をこの端末に入れる。半端に混ぜず、入れ替えてから読み直す。
   ★版の数も必ずサーバーに合わせる（2026-10-04）。
     ここを忘れると、開き直すたびに「向こうが新しい」と言われて
     同じ札が出つづけ、堂々めぐりになる（実際に踏んだ） */
function kuTakeGo(blob, rev) {
  if (!replacePlayer(blob)) { S.kuMsg = 'この端末に書き込めませんでした'; draw(); return; }
  setRev(rev);
  S.kuPend = null; S.kuHold = false;
  location.reload();
}

/* 版が食い違ったとき。どちらを残すか尋ねる札。勝手に混ぜない */
function kuWarSheet() {
  const w = S.kuWar;
  const close = () => { S.kuWar = null; draw(); };
  return el('div', { class: 'sheet' }, el('div', { class: 'card2 lkbox' },
    el('b', { class: 'mittl' }, '記録が二つあります'),
    el('p', { class: 'ttsub' }, 'この端末とサーバーで、記録が食い違っています。どちらを残すか選んでください。選ばなかったほうは消えます。'),
    el('div', { class: 'lknote' },
      el('b', {}, 'この端末'), el('span', {}, kuSum(kuBlob())),
      el('b', {}, 'サーバー'), el('span', {}, `${kuSum(w.blob)}（${kuWhen(w.at)}）`)),
    S.kuMsg ? el('p', { class: 'lkmsg' }, S.kuMsg) : null,
    el('button', { class: 'go wide', onclick: async () => {
      S.kuMsg = '送っています…'; draw();
      const r = await pushSaveForce(kuBlob(), w.rev);
      S.kuWar = null;
      if (r.ok) { S.kuPend = null; S.kuHold = false; S.kuMsg = 'この端末の記録を残しました'; }
      else S.kuMsg = '送れませんでした';
      kuWatch(); draw();
    } }, 'この端末を残す'),
    el('button', { class: 'ghost wide', onclick: () => kuTakeGo(w.blob, w.rev) }, 'サーバーを残す'),
    /* あとで決める＝まだ選びたくない。自動の控えを止めて、
       引き継ぎの札から選び直せるように、食い違いの中身を取っておく（2026-10-04） */
    el('button', { class: 'ghost wide', onclick: () => {
      S.kuPend = w; S.kuHold = true; close();
    } }, 'あとで決める')));
}

/* 別の端末から持ってくるときの、最後の確かめ */
function kuTakeSheet() {
  const w = S.kuTake;
  return el('div', { class: 'sheet' }, el('div', { class: 'card2 lkbox' },
    el('b', { class: 'mittl' }, 'この端末のデータを入れ替えます'),
    el('div', { class: 'lknote' },
      el('b', {}, 'いまの記録'), el('span', {}, kuSum(kuBlob())),
      el('b', {}, '持ってくる記録'), el('span', {}, `${kuSum(w.blob)}（${kuWhen(w.at)}）`)),
    el('p', { class: 'lkwarn' }, 'いまの記録は消えます。元に戻せません。'),
    el('button', { class: 'go wide danger', onclick: () => kuTakeGo(w.blob, w.rev) }, '入れ替える'),
    el('button', { class: 'ghost wide', onclick: () => { S.kuTake = null; draw(); } }, 'キャンセル')));
}

/* ---------------- 果たし合い（対人戦・2026-10-05 作り直し）----------------
   engine は「種＋指図の並び」だけで同じ戦を一から再現できる。
   だから盤は送らない。送るのは合言葉で間に入ることと、一手ごとの指図だけ。
   間（サーバー）が指図に番号を打って二人に配るので、
   両方の端末に まったく同じ並びが届き、まったく同じ戦が映る。

   ■ 2026-10-05 の作り直し
   前は決着が出たあと二人とも行き場を失って放置された。
   間を「戦が終わっても続く部屋」にして、次の四つを行き来する。

     待ち   … 相手を待つ
     戦仕度 … 二人そろった。互いに仕度を押すと開戦
     戦     … 戦のさなか
     結び   … 勝敗が出た。もう一番か、解散

   ■ 相手が落ちたとき
   間が砂時計（10秒）を回し、残っている側の画面に数を出す。
   戻れば消える。戻らなければ間が「兵量で決めてよし」と言い、
   残っている側が自分の盤の兵量を数えて決着を告げる。
   盤は端末にしか無いので、数えるのは端末。間は時だけ数える。

   いまの割り切り：間を立てた人が A（盤の手前）、入った人が B（盤の奥）。
   B の人は自分の軍が奥に見える。盤の向きの直しは別途。 */
let DUEL = null;
let dlTick = 0;          // 一秒ごとの見張り（鼓動・砂時計）
let dlBeat = 0;          // 三秒ごとに ping を打つための数え

const dlTeam = () => ({
  members: S.picked.map(grownFor), generalNo: S.general,
  formation: S.form, slots: S.slots,
  stage: { s: S.stage, v: S.stageV, flip: S.stageFlip },
});
/* 自分がどちら側に座っているか。ふつうの戦では必ず A */
const mySide = () => (BATTLE && BATTLE.duel ? BATTLE.duel.side : 'A');
const iWon = (res) => res.winner === mySide();
const dlSay = (o) => { if (DUEL && DUEL.ws) DUEL.ws.send(o); };

function dlClose() {
  dlStopTick();
  if (DUEL && DUEL.ws) { try { DUEL.ws.bye(); } catch (_) {} try { DUEL.ws.close(); } catch (_) {} }
  DUEL = null; S.dl = null; S.dlMsg = ''; S.dlGone = 0; draw();
}
function dlStopTick() { if (dlTick) { clearInterval(dlTick); dlTick = 0; } S.dlGone = 0; }

/* ---- 一秒ごとの見張り（2026-10-05）----
   機内モードにしても繋ぎはすぐには切れない。間が close を受け取るのは一分ほど先で、
   それまで砂時計が出なかった（実測：一分）。
   そこで **端末どうしで鼓動を交わす**。三秒ごとに ping を打ち、間が相手に beat を配る。
   五秒 聞こえなければ落ちたとみなして砂時計を回す。十数えて戻らなければ兵量で決する。
   数えるのは残っているほうの端末。間は何もしなくてよい。 */
function dlWatch() {
  if (dlTick) return;
  dlBeat = 0;
  dlTick = setInterval(() => {
    if (!DUEL) { dlStopTick(); return; }
    /* 戦のあいだは三秒ごと、それ以外は十五秒ごと（2026-10-05）。
       待っているだけのときまで三秒ごとに叩くと、間が眠れず銭がかさむ */
    if (++dlBeat >= (DUEL.phase === 'fight' ? 3 : 15)) { dlBeat = 0; dlSay({ t: 'ping' }); }
    if (DUEL.phase !== 'fight') { if (S.dlGone) { S.dlGone = 0; draw(); } return; }
    const foe = (DUEL.seats || []).find(x => x.side !== DUEL.side);
    if (!foe) return;
    const silent = Date.now() - (DUEL.foeBeat || 0) > 5000;
    if (!silent) {
      if (S.dlGone || DUEL.judged) { S.dlGone = 0; DUEL.judged = false; S.dlMsg = ''; draw(); }
      return;
    }
    /* いちど数え切ったら、もう数え直さない（2026-10-05）。
       前は 0 になっても相手が黙ったままなので、また10から数えて
       いつまでも繰り返していた（ゆうごさんの実測） */
    if (DUEL.judged) return;
    S.dlGone = S.dlGone ? S.dlGone - 1 : 10;
    draw();
    if (S.dlGone <= 0) { S.dlGone = 0; DUEL.judged = true; dlJudge(DUEL.side); }
  }, 1000);
}

async function dlMake() {
  if (!linked()) { S.dlMsg = 'さきにバックアップへ接続してください'; draw(); return; }
  if (!S.picked || !S.picked.length) { S.dlMsg = 'さきに部隊を組んでください'; draw(); return; }
  S.dlBusy = true; S.dlMsg = 'ルームを作っています…'; draw();
  const r = await duelOpen(dlTeam());
  S.dlBusy = false;
  if (!r.ok) { S.dlMsg = r.err === 'net' ? 'つながりませんでした' : (r.err || 'ルームを作れませんでした'); draw(); return; }
  dlEnter(r.duel, r.seed);
}

function dlEnter(code, seed) {
  const id = String(code || '').toUpperCase().trim();
  if (id.length < 4) { S.dlMsg = '合言葉を入れてください'; draw(); return; }
  if (!S.picked || !S.picked.length) { S.dlMsg = 'さきに部隊を組んでください'; draw(); return; }
  DUEL = { id, side: null, phase: 'wait', seats: [], round: 0, wins: { A: 0, B: 0 }, over: null };
  DUEL.ws = duelJoin(id, { pid: P.link.code, name: P.name || '名無し', team: dlTeam(), seed: seed || 0 }, dlHear);
  if (!DUEL.ws) { S.dlMsg = 'つなげませんでした'; DUEL = null; draw(); return; }
  DUEL.foeBeat = Date.now();
  dlWatch();
  S.dl = 'room'; S.dlMsg = ''; draw();
}

/* 間からの知らせ。対戦のすべてがここを通る */
function dlHear(m) {
  if (!DUEL) return;
  /* 鼓動が届いた＝相手は生きている（2026-10-05）。
     数えるのは beat だけにする。cmd も room も自分の手で起きたものが
     そのまま返ってくるので、それで生死を測ると相手が落ちても気づけない */
  if (m.t === 'beat') DUEL.foeBeat = Date.now();
  if (m.t === 'beat') { if (S.dlGone) { S.dlGone = 0; S.dlMsg = ''; draw(); } return; }
  switch (m.t) {
    case 'seat': DUEL.side = m.side; break;
    case 'room':
      DUEL.phase = m.phase; DUEL.seats = m.seats || [];
      DUEL.round = m.round || 0; DUEL.wins = m.wins || { A: 0, B: 0 };
      break;
    case 'full': S.dlMsg = 'そのルームはもう埋まっています'; DUEL = null; S.dl = 'menu'; break;
    case 'start': dlStart(m.seed, m.teams, m.round); return;
    case 'resume': dlStart(m.seed, m.teams, m.round, m.cmds); return;
    /* 指図は かならず間から降りてきたものだけを積む。
       自分の手も例外にしない。そうしないと並びが二つの端末でずれる */
    case 'cmd': dlTake(m.i, m.cmd); return;
    case 'timeout': dlLate(); return;
    case 'gone': dlGone(m.secs); return;
    case 'back': dlStopTick(); S.dlMsg = ''; break;
    case 'judge': dlJudge(m.side); return;
    case 'result': dlResult(m); return;
    case 'bye':
      dlStopTick();
      if (m.side !== DUEL.side) { S.dlMsg = '相手が去りました'; DUEL.phase = 'wait'; }
      break;
    /* 自分の繋ぎが切れた（2026-10-05）。黙って止まるのがいちばん困るので、
       いちどだけ繋ぎ直す。間は主の印で同じ席に戻してくれる */
    case 'lost': dlLost(); return;
  }
  draw();
}

function dlLost() {
  if (!DUEL || DUEL.bye) return;
  S.dlMsg = '繋ぎが切れました。つなぎ直しています…';
  draw();
  const id = DUEL.id;
  setTimeout(() => {
    if (!DUEL || DUEL.id !== id) return;
    DUEL.ws = duelJoin(id, { pid: P.link.code, name: P.name || '名無し', team: dlTeam(), seed: 0 }, dlHear);
    if (!DUEL.ws) { S.dlMsg = 'つなぎ直せませんでした'; draw(); }
  }, 1200);
}

function dlStart(seed, teams, round, cmds) {
  if (!teams || !teams.A || !teams.B) return;
  S.dlGone = 0;
  DUEL.foeBeat = Date.now();
  dlWatch();
  /* 前の戦の札が残っていたら畳む（2026-10-05）。
     こちらが勝敗の札を見ているあいだに相手が「もう一番」を押すと、
     札が新しい盤の上に乗ったままになっていた */
  S.res = null; S.dmg = false; S.vs = null;
  DUEL.phase = 'fight'; DUEL.round = round || 1; DUEL.told = false;
  const st = teams.A.stage || {};
  const rules = stageRules(st.s || '地形なし', st.v, st.flip);
  BATTLE = {
    seed, rules, B: (teams[DUEL.side === 'A' ? 'B' : 'A'] || {}).members || [],
    bForm: null, first: false, commands: Array.isArray(cmds) ? cmds.slice() : [],
    modes: [{ turn: 0, manual: true }],
    shown: 0, live: null, playing: true, sel: null, busy: false,
    camp: null, ev: null, spar: null, bout: null, tw: null,
    duel: { side: DUEL.side, id: DUEL.id, A: teams.A, B: teams.B, round: DUEL.round },
    weather: weatherOf(seed, st.s || '地形なし'),
    useItems: [], prep: [],
  };
  resolve();
  BATTLE.live = initLive(BATTLE.res);
  preloadCutins([...(teams.A.members || []), ...(teams.B.members || [])].map(m => m.no));
  S.dl = null; S.dlMsg = '';
  S.screen = 'battle';
  const foe = (DUEL.seats.find(x => x.side !== DUEL.side) || {}).name || '相手';
  S.vs = { ttlL: '果たし合い', ttlR: `${DUEL.round}番勝負`,
           house: null, foe, w: BATTLE.weather };
  SFX.start(); draw();
  setTimeout(() => { S.vs = null; draw(); play(); }, 1200);
}

/* 間が配った指図を積む。番号どおりに並べる（抜けたら積まない） */
function dlTake(i, c) {
  if (!BATTLE || !BATTLE.duel) return;
  if (i !== BATTLE.commands.length) return;   // 並びが飛んだ。次の知らせを待つ
  BATTLE.commands.push(c);
  resolve();
  play();
}

/* 持ち時間ぎれ。自分の手番なら「待機」を打って先へ進める */
function dlLate() {
  if (!BATTLE || !BATTLE.duel || !DUEL) return;
  const a = BATTLE.res && BATTLE.res.awaiting;
  if (!a || !String(a.unit).startsWith(DUEL.side + '-')) return;
  dlSay({ t: 'cmd', cmd: { unit: a.unit, turn: a.turn, type: 'wait' } });
}

/* 相手が落ちた。砂時計を画面に出す（1秒ごとに減る） */
/* 間が「相手が落ちた」と気づいたとき（繋ぎがきれいに切れた場合はこちらが早い）。
   数えるのは同じ見張りなので、残り秒を入れるだけ */
function dlGone(secs) {
  DUEL.foeBeat = 0;                 // 鼓動は絶えたものとして扱う
  S.dlGone = Math.max(1, secs || 10);
  dlWatch();
  draw();
}

/* 間から「兵量で決めてよし」。盤の兵量を数えて決着を告げる */
function dlJudge(side) {
  S.dlGone = 0;
  if (!BATTLE || !BATTLE.duel || side !== DUEL.side) return;
  const us = liveUnits();
  const a = troops(us, 'A'), b = troops(us, 'B');
  const winner = a === b ? '' : (a > b ? 'A' : 'B');
  dlSay({ t: 'over', winner, reason: '相手が戻らず・兵量で決した' });
  /* 間に届かないことも ある（自分のほうが電波を失っている場合）。
     五秒 待って勝敗の知らせが来なければ、こちらだけで戦を終いにして
     待ち合いの間へ返す。盤に取り残されるのがいちばん困る（2026-10-05） */
  setTimeout(() => {
    if (!DUEL || !BATTLE || !BATTLE.duel || S.res) return;
    fxToken++; BATTLE = null; S.vs = null; S.dmg = false;
    DUEL.phase = 'after';
    S.screen = 'home'; S.dl = 'room';
    S.dlMsg = '相手が戻らず、戦は終いにしました';
    draw();
  }, 5000);
}

/* 決着。札を出して「結び」へ */
function dlResult(m) {
  S.dlGone = 0;
  DUEL.phase = 'after'; DUEL.wins = m.wins || DUEL.wins; DUEL.round = m.round || DUEL.round;
  DUEL.over = { winner: m.winner, reason: m.reason };
  /* 自分の盤がまだ決着していないのに、間から勝敗が降りてきたとき
     （相手が落ちて兵量で決した、など）。札の中身は自分の盤から作る。
     残兵量を null にすると札が「残兵量 — 対 —」になって読めない（2026-10-05） */
  if (BATTLE && BATTLE.duel && !S.res) {
    const us = BATTLE.live ? liveUnits() : [];
    S.res = { i: 0, won: m.winner === DUEL.side,
              reason: m.reason || '', ta: troops(us, 'A'), tb: troops(us, 'B'),
              stat: BATTLE.res ? battleStat(BATTLE.res) : null };
  }
  draw();
}

/* 決着を間に告げる。engine が決めた勝ち負けをそのまま渡す */
function dlReport(res) {
  if (!DUEL || !DUEL.ws || DUEL.told) return;
  DUEL.told = true;
  dlSay({ t: 'over', winner: res.winner, reason: res.reason || '' });
}

/* ---- 待ち合いの間の画面 ---- */
/* ---- 電波が切れたときの札（2026-10-05）----
   ゆうごさんの指図：電波が無いと、まだ読んでいない画面の絵や飾りが揃わない。
   中途半端に遊ばせるより、はっきり知らせて初めの画面へ戻すほうがよい。
   留守番（sw.js）のおかげで入れ物自体は開くので、ここで止めて案内する。 */
function offlineSheet() {
  return el('div', { class: 'sheet' }, el('div', { class: 'card2 lkbox' },
    el('b', { class: 'mittl' }, 'つながりませぬ'),
    el('p', { class: 'ttsub' },
      '電波が届いておりませぬ。絵や飾りが揃わぬゆえ、いちど初めの画面へ戻ります。' +
      '電波の届くところで、もう一度お試しくだされ。'),
    el('button', { class: 'go wide', onclick: () => {
      S.offl = false;
      if (DUEL) dlClose();
      fxToken++; BATTLE = null; S.res = null; S.vs = null; S.dmg = false; S.dl = null;
      S.screen = 'title'; SFX.pick(); draw();
    } }, '初めの画面へ')));
}

/* 電波の出入りを見張る。S がまだ出来ていない位置なので、全部読み終えてから動かす */
setTimeout(() => {
  const look = () => {
    const off = typeof navigator !== 'undefined' && navigator.onLine === false;
    /* 初めの画面にいるあいだは黙っている。押したときに知らせるので足りる */
    if (off && (S.screen === 'title' || S.screen === 'loading')) return;
    if (!!S.offl === off) return;
    S.offl = off;
    draw();
  };
  /* 立ち上げたときには出さない（2026-10-05）。
     初めの画面は留守番が覚えているので、そのまま見せてよい。
     知らせるのは「開始を押したとき」と「遊んでいる最中に切れたとき」だけ */
  try { addEventListener('offline', look); addEventListener('online', look); } catch (_) {}
}, 0);

function duelSheet() {
  const box = (...kids) => el('div', { class: 'sheet' },
    el('div', { class: 'card2 lkbox' }, ...kids.filter(Boolean)));

  if (S.dl === 'room' && DUEL) {
    const me = DUEL.seats.find(x => x.side === DUEL.side) || { side: DUEL.side, name: P.name };
    const foe = DUEL.seats.find(x => x.side !== DUEL.side);
    const after = DUEL.phase === 'after';
    const waiting = !foe || !foe.here;
    const seatRow = (s, mine) => el('div', { class: 'dlseat' + (mine ? ' me' : '') + (s && s.here ? '' : ' empty') },
      el('i', {}, s ? (s.side === 'A' ? '先' : '後') : '？'),
      el('span', { class: 'n' }, s ? (s.name || '名無し') : '空いています'),
      el('span', { class: 'o' }, !s || !s.here ? '…待っています'
        : after ? (s.again ? 'もう一番！' : '思案中') : (s.ready ? '仕度よし' : '仕度中')));
    const mineReady = after ? me.again : me.ready;
    return box(
      el('b', { class: 'mittl' }, after ? '勝負あり' : waiting ? '相手を待っています' : '戦仕度'),
      el('div', { class: 'lkcode' }, el('span', {}, DUEL.id)),
      waiting ? el('p', { class: 'ttsub' }, 'この合言葉を相手に伝えてください。') : null,
      DUEL.round ? el('p', { class: 'dlrec' },
        `${DUEL.round}戦　${DUEL.wins[DUEL.side] || 0} 勝 ${DUEL.wins[DUEL.side === 'A' ? 'B' : 'A'] || 0} 敗`) : null,
      el('div', { class: 'dlseats' }, seatRow(me, true), seatRow(foe, false)),
      el('div', { class: 'lknote' },
        el('b', {}, 'あなたの部隊'), el('span', {}, `${(S.picked || []).length}騎　大将 ${(charOf(S.general) || {}).name || '—'}`)),
      S.dlMsg ? el('p', { class: 'lkmsg' }, S.dlMsg) : null,
      waiting
        ? el('button', { class: 'ghost wide', onclick: () => {
            try { navigator.clipboard && navigator.clipboard.writeText(DUEL.id); S.dlMsg = '合言葉をコピーしました'; }
            catch (_) { S.dlMsg = '長押しで選んでコピーしてください'; }
            draw();
          } }, '合言葉をコピー')
        : el('button', { class: 'go wide' + (mineReady ? ' on' : ''), onclick: () => {
            const on = !mineReady;
            dlSay({ t: after ? 'again' : 'ready', on, team: dlTeam() });
            if (after) DUEL.wins = DUEL.wins; // 画面は room の知らせで整う
            SFX.pick(); draw();
          } }, mineReady ? '取り消す' : after ? 'もう一番' : '戦仕度'),
      /* 編成の画面は 'team'（2026-10-05）。'squad' という画面は無く、
         そこへ飛ばしていたので何も描かれず、上に黒い帯が出るだけだった。
         2026-10-06：いきなり編成の画面に落ちていたのを、
         ほかの出陣と同じく 一度「出す部隊をえらぶ」の札を挟むようにした */
      el('button', { class: 'ghost wide', onclick: () => {
        sqAsk('出す部隊をえらぶ', '果たし合いに出す部隊', () => {
          S.teamFrom = 'duel'; S.dl = null; S.screen = 'team'; draw();
        }, false, true);
      } }, '部隊編成'),
      el('button', { class: 'ghost wide', onclick: dlClose }, after ? '解散する' : 'やめる'));
  }

  if (S.dl === 'join') {
    return box(
      el('b', { class: 'mittl' }, '合言葉で入る'),
      el('p', { class: 'ttsub' }, '相手から聞いた合言葉を入れてください。'),
      el('div', { class: 'lkfield' },
        el('input', { class: 'lkin', type: 'text', value: S.dlCode || '',
          placeholder: '合言葉（6文字）', autocapitalize: 'characters', spellcheck: 'false',
          oninput: e => { S.dlCode = e.target.value.toUpperCase(); } })),
      S.dlMsg ? el('p', { class: 'lkmsg' }, S.dlMsg) : null,
      el('button', { class: 'go wide', onclick: () => dlEnter(S.dlCode, 0) }, '入る'),
      el('button', { class: 'ghost wide', onclick: () => { S.dl = 'menu'; S.dlMsg = ''; draw(); } }, '戻る'));
  }

  const n = (S.picked || []).length;
  return box(
    el('b', { class: 'mittl' }, '果たし合い'),
    el('p', { class: 'ttsub' }, '合言葉をやりとりして、友と五対五で戦う。手番ごとに自分で動かす。'),
    el('div', { class: 'lknote' },
      el('b', {}, 'いまの部隊'), el('span', {}, n ? `${n}騎　大将 ${(charOf(S.general) || {}).name || '—'}` : '組んでいません'),
      el('b', {}, '場'), el('span', {}, `${S.stage}　（ルームを作った人の場になる）`)),
    S.dlMsg ? el('p', { class: 'lkmsg' }, S.dlMsg) : null,
    el('button', { class: 'go wide', ...(S.dlBusy ? { disabled: true } : {}), onclick: dlMake }, 'ルーム作成'),
    el('button', { class: 'ghost wide', onclick: () => { S.dl = 'join'; S.dlCode = ''; S.dlMsg = ''; draw(); } }, '合言葉で入る'),
    el('button', { class: 'ghost wide', onclick: dlClose }, '閉じる'));
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

  /* 蔵につなぐ（2026-10-04）。いま決めてあるパスワードを一度だけ確かめる */
  if (step === 'join') {
    return box(
      el('b', { class: 'mittl' }, 'バックアップに接続'),
      el('p', { class: 'ttsub' },
        'データの控えを預けます。端末が壊れても、引き継ぎIDとパスワードがあれば取り戻せます。'),
      el('div', { class: 'lkfield' },
        el('input', { class: 'lkin', type: 'password', value: S.lkP1,
          placeholder: 'いまのパスワード',
          oninput: e => { S.lkP1 = e.target.value; } })),
      S.kuMsg ? el('p', { class: 'lkmsg' }, S.kuMsg) : null,
      el('button', { class: 'go wide', ...(S.kuBusy ? { disabled: true } : {}), onclick: kuJoin }, '接続する'),
      el('button', { class: 'ghost wide', onclick: () => { S.link = 'main'; S.lkP1 = ''; S.kuMsg = ''; draw(); } }, 'キャンセル'));
  }

  /* 別の端末から引き継ぐ（2026-10-04）。IDとパスワードで蔵に入り直す */
  if (step === 'claim') {
    return box(
      el('b', { class: 'mittl' }, '別の端末から引き継ぐ'),
      el('p', { class: 'ttsub' },
        '前の端末で発行した引き継ぎIDとパスワードを入力してください。いまのデータは入れ替わります。'),
      el('div', { class: 'lkfield' },
        el('input', { class: 'lkin', type: 'text', value: S.kuCode || '',
          placeholder: 'WAN-0000-0000', autocapitalize: 'characters', spellcheck: 'false',
          oninput: e => { S.kuCode = e.target.value; } }),
        el('input', { class: 'lkin', type: 'password', value: S.lkP1,
          placeholder: 'パスワード',
          oninput: e => { S.lkP1 = e.target.value; } })),
      S.kuMsg ? el('p', { class: 'lkmsg' }, S.kuMsg) : null,
      el('button', { class: 'go wide', ...(S.kuBusy ? { disabled: true } : {}), onclick: kuClaim }, '引き継ぐ'),
      el('button', { class: 'ghost wide', onclick: () => { S.link = 'main'; S.lkP1 = ''; S.kuCode = ''; S.kuMsg = ''; draw(); } }, 'キャンセル'));
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
    /* 蔵への控え（2026-10-04）。蔵が無い作りでも遊べるよう、KURA が空なら出さない */
    KURA ? el('div', { class: 'lkpass' },
      el('span', { class: 'l' }, 'バックアップ'),
      el('span', { class: 'd' }, S.kuPend ? '記録が二つ' : linked() ? '接続済み' : '未接続'),
      S.kuPend
        /* 「あとで決める」のまま止まっている。ここから選び直せる（2026-10-04） */
        ? el('button', { class: 'ghost sm', onclick: () => {
            S.kuWar = S.kuPend; S.kuMsg = ''; SFX.pick(); draw();
          } }, 'えらぶ')
        : linked()
        ? el('button', { class: 'ghost sm', onclick: async () => {
            S.lkMsg = '送っています…'; draw();
            const r = await kuPush(true);
            S.lkMsg = r.ok ? '控えました' : (r.status === 409 ? '' : '送れませんでした');
            draw();
          } }, '今すぐ')
        : el('button', { class: 'ghost sm', onclick: () => {
            S.link = 'join'; S.lkP1 = ''; S.kuMsg = ''; SFX.pick(); draw();
          } }, '接続')) : null,
    S.lkMsg ? el('p', { class: 'lkmsg' }, S.lkMsg) : null,
    el('p', { class: 'lkwarn' }, 'IDとパスワードは他人に教えないでください。'),
    /* 連携。サーバーができるまでは灰のまま並べておく（何につながるかだけ見せる） */
    el('div', { class: 'lkties' },
      el('b', {}, `アカウント連携　${tied} / ${LK_TIES.length}`),
      ...LK_TIES.map(t => el('button', { class: 'lkty soon', disabled: true },
        el('i', {}, t.name.slice(0, 1)),
        el('span', { class: 'n' }, t.name),
        el('span', { class: 'o' }, (P.link.ties || {})[t.id] ? '連携済み' : '準備中')))),
    KURA
      ? el('button', { class: 'ghost wide', onclick: () => {
          S.link = 'claim'; S.lkP1 = ''; S.kuCode = ''; S.kuMsg = ''; SFX.pick(); draw();
        } }, '別の端末から引き継ぐ')
      : el('button', { class: 'ghost wide soon', disabled: true }, '別の端末から引き継ぐ（準備中）'),
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

/* ---- はじまりの物語（2026-10-05 に作り直した）----
   前は「選んだ一騎の横長の絵＋名乗り」の一枚だった（2026-09-25）。
   そっけないので、**乱世の始まり**を見せる一幕にした。

     ・燃える戦場を画面いっぱいに敷く（assets/bg/opening.png）
     ・白いテロップが一行ずつ 上から降りてきて、読み終わるころに消える
       （下敷きの帯は置かない。影だけで読ませる）
     ・語り終わりに、選んだ一騎の顔が大きく浮かび上がって名乗る
     ・たたくと早送り。もう一度たたくと城へ

   文は**史実に合わせた**。応仁の乱（応仁元年＝1467年）から十一年。
   将軍の威が落ち、守護が崩れ、下の者が上を討つ ── 下剋上。
   そこから戦国の世が始まる、という筋をそのままなぞっている。
   数は年号だけ（遊びの数値は見せない決まりは守っている）。

   絵が無くても動く：背景が無ければ黒地に落ち、顔が無ければ名だけが出る。 */
const OPENING_CRY = '総大将を討ち取るワン';
const OPENING_TELOP = [
  '応仁元年、京に火が上がった。',
  '将軍の威は地に落ち、十一年のいくさが都を焼いた。',
  '焼け跡に立っていたのは、名も無き者たちだった。',
  '主を討ち、国を奪い、下の者が上に立つ。',
  '―― 下剋上。',
  '旗は百を超え、犬たちは野に放たれた。',
  'この世を、戦国という。',
  'そして今、そなたの旗が揚がる。',
];
const OP_LINE_MS = 2300;        // 一行ぶんの間合い（絵は 2.9秒かけて降りて消える）
function openingArt() {
  const c = charOf(P.first);
  return c ? (heroUrl(c.no) || cutinArt(c.no, '奥義')) : null;
}
/* 語り終わりに立たせる姿（2026-10-05・悠さんの指図でコマ絵に変えた）。
   コマ絵（assets/pawn/<番号>.png・512四方の透かし絵）は全身が入っていて、
   背景が抜けているので、戦場の上にそのまま立たせられる。
   丸く切る必要も、金の輪も要らない。
   コマ絵が無い武将は顔に落とし、そのときだけ丸く切って輪を付ける */
function openingFigure() {
  const c = charOf(P.first);
  if (!c) return null;
  const pw = pawnUrl(c.no);
  if (pw) return { url: pw, pawn: true };
  const fc = faceUrl(c.no, '真剣') || faceUrl(c.no, '不敵') || faceUrl(c.no, '通常')
          || cutinUrl(c.no);
  return fc ? { url: fc, pawn: false } : null;
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
  const c = charOf(P.first);
  const bg = bgUrl('opening');
  const fig = openingFigure();
  const skip = !!S.opSkip;
  /* 語りの終わりどき。顔はその少し前から浮かび上がらせる */
  const endMs = OPENING_TELOP.length * OP_LINE_MS;
  /* 一度めのたたきで早送り、二度めで城へ（2026-10-05）。
     長い語りを飛ばしたい人と、名乗りだけ見たい人の両方に行き場をつくる */
  const go = () => {
    if (!skip) { S.opSkip = true; SFX.pick(); draw(); return; }
    S.opening = false; S.opSkip = false; SFX.pick();
    /* 語りのあとは城へ（2026-09-30）。
       城から、育成 → 武将強化 → 部隊 → 初陣 の順に手引きが案内する */
    S.screen = 'home';
    draw();
  };
  const at = (ms) => (skip ? null : `animation-delay:${(ms / 1000).toFixed(2)}s`);
  return el('div', { class: 'opsheet' + (skip ? ' skip' : ''), onclick: go },
    bg ? el('div', { class: 'opbg2', style: `background-image:url("${bg}")` }) : null,
    el('div', { class: 'opveil' }),
    /* テロップ。どの行も同じ場所に重ねて置き、間合いをずらして出す。
       前後が 0.6秒ほど重なるので、ぷつりと切れずに移り変わる */
    el('div', { class: 'optelop' },
      OPENING_TELOP.map((t, i) => el('p', { style: at(i * OP_LINE_MS) }, t))),
    /* 名と名乗りは顔に**重ねて**、いちばん手前に置く（2026-10-05・悠さんの指図）。
       顔を1.5倍に大きくしたので、下に並べると画面に収まらない */
    el('div', { class: 'opwho' + (fig && fig.pawn ? ' pawn' : ''), style: at(Math.max(0, endMs - 1400)) },
      fig ? el('img', { class: fig.pawn ? 'oppawn' : 'opface', src: fig.url, alt: c ? c.name : '' }) : null,
      el('div', { class: 'opcap' },
        el('div', { class: 'opnm' }, c ? c.name : ''),
        el('div', { class: 'opcry', 'data-t': OPENING_CRY }, OPENING_CRY))),
    el('div', { class: 'ophint' }, skip ? '画面をたたいて出陣' : '画面をたたくと早送り'));
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
            S.opening = true; S.opSkip = false;   // 語りは必ず通す（2026-10-05）
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
  /* 語りは はじめの一騎を選んだ直後の一度きり（2026-10-05）。
     十連のあとにもう一度流すと、同じ話を二度聞かせることになる */
  S.screen = 'home';
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
    go: () => { S.fr = true; S.frId = null; S.frMsg = ''; S.frTab = 'my'; S.frQ = ''; palTick(true); },
    /* 赤丸は 返礼＋友の願い＋果たし合いの誘い（2026-10-06）。
       誘いは押し掛ける仕掛けが無いので、ここで気づけるようにしておく */
    badge: () => frBack() + PAL.asks.length + palInvites().length },
  /* 店は育成の中からホームへ移した（2026-09-26）。
     買い物は育てることとは別の用事なので、城の画面から直に入れるほうが早い。
     絵は ui/home_shop.png（無ければ menu_店.png、それも無ければ「店」の一字） */
  { side: 'TL', name: '店',       mark: '店', file: 'home_shop',
    go: () => { S.screen = 'shop'; S.shopTab = 'furi'; S.shopMsg = ''; } },
  /* お役目は右下の列のいちばん上（2026-09-24）。
     右手の親指が届くところに置きたいので左上から移した。
     square を立てると、横長の札の列の中でも正方形のまま右端をそろえて並ぶ */
  /* 落ち延び道中（ミニゲーム）は **お役目の横に、同じ大きさで**（2026-10-09・悠さんの指図）。
     square を立てた座どうしは、右下の列の上で横一列に並ぶ。
     先に書いたほうが左。お役目は右はしの定位置のままにしたいので、こちらを先に置く。
     label ＝ 札に出す短い名（絵が無いあいだだけ出る）。
     69角に「落ち延び道中」は収まらないので「道中」にしてある。
     ui/home_trail.png を置けば、名札そのものが消える */
  /* 絵（ui/home_trail.png・2026-10-09 悠さん作）に「旅」が入っているので、下の名札は出さない */
  { side: 'BR', name: '落ち延び道中', mark: '旅', file: 'home_trail', square: true, noname: true,
    go: () => { S.screen = P.trail.fight ? 'trfight' : 'trail'; S.trView = 'list'; S.trRes = null; S.trScroll = true; } },
  { side: 'BR', name: 'お役目',   mark: '任', file: 'home_mission', square: true,
    go: () => { S.mi = true; S.miTab = miTab0(); S.miMsg = ''; },
    badge: () => miReadyCount() },
  { side: 'BR', name: 'イベント', mark: '祭', file: 'home_event',   go: () => { S.screen = 'event'; S.evId = null; S.evMsg = ''; } },
  /* 果たし合い（2026-10-04）。合言葉で友と五対五。
     サーバーに繋いでいないと座に入れないので、繋ぐまでは灰色のまま */
  /* 果たし合いの座は ふだん出さない（2026-10-09・悠さんの指図）。
     友の行から直に挑めるようになったので、城に別の入口を置く意味が無くなった。

     **ただし、間（ルーム）を開いているあいだだけは出す。**
     部隊を組み直しに抜けたあと、ここから戻れないと
     自分が立てた座に二度と入れず、相手をずっと待たせることになる
     （2026-10-05 にそのために足した道。消すと詰む） */
  { side: 'BR', name: '果たし合い', mark: '果', file: 'home_duel',
    off: () => !DUEL,
    go: () => { S.dl = 'room'; S.dlMsg = ''; S.dlCode = ''; } },
  { side: 'BR', name: '番付',     mark: '番', file: 'home_ranking',
    go: () => { S.rk = true; S.rkSel = null; S.rkPz = false; S.rkPzT = null; S.rkMsg = ''; },
    badge: () => (rkState().last ? 1 : 0) },
  /* 試練の塔（2026-10-01）。左下・全国の釦の上。
     絵（ui/home_tower.png）は看板なので、ほかの座より ひと回り大きく出す */
  /* 武将取引所（2026-10-01）。左下・試練の塔の上。
     並びが上から下なので、塔より前に書けば塔の上に出る */
  /* 絵は ui/home_market.png（2026-10-02 に入った）。
     noname は 絵が見つからなかったときの備え。札に「市」の一字が出るだけで、
     下の名札は出さない（塔と高さがそろわず、字が二度出て見苦しいため） */
  { side: 'BL', name: '取引所', mark: '市', file: 'home_market', big: true, noname: true,
    go: () => { S.screen = 'market'; S.mkTab = 'buy'; S.mkPut = null;
                S.mkQ = ''; S.mkMsg = ''; },
    badge: () => mkUnread() },
  { side: 'BL', name: '試練の塔', mark: '塔', file: 'home_tower', big: true,
    /* 全国の第1章（出発した章）を平定するまでは開かない（2026-10-01）。
       いきなり しばり付きの戦に来ても、手持ちが足りず「読み」にならない */
    lock: () => towerOpen() ? null : '第1章クリアで解放',
    go: () => { S.screen = 'tower'; S.twMsg = ''; S.twSel = null; } },
];
/* 第1章＝出発した章。そこを取りきると試練の塔が開く（2026-10-01） */
/* 塔・友・称号・お役目は 並の進み具合で決める（2026-10-10）。修羅に入って振り出しに戻っても閉じない */
const towerOpen = () => regionTaken((PREF[(P.camp && P.camp.start) || 'aichi'] || {}).region, 0);
function homeMenuBtn(m) {
  const wide = m.side === 'BR' && !m.square;
  const art = (m.file && uiUrl(m.file)) || uiUrl((wide ? 'banner_' : 'menu_') + m.name);
  /* まだ開いていない座（2026-10-01）。灰色に沈めて、何をすれば開くかを札の上に書く */
  const lk = typeof m.lock === 'function' ? m.lock() : null;
  return el('button', {
    class: (wide ? 'hmw' : 'hmb') + (art ? ' art' : '') + (m.soon ? ' soon' : '')
         + (lk ? ' locked' : '') + (m.big ? ' big' : ''),
    title: m.soon ? `${m.name}（近日）` : lk ? `${m.name}　${lk}` : m.name,
    disabled: (m.soon || lk) ? true : null,
    onclick: (m.soon || lk) ? null : () => { m.go(); SFX.pick(); draw(); },
  },
    lk ? el('span', { class: 'hmlock' }, lk) : null,
    el('span', { class: 'hmi' }, art ? keepImg({ src: art, alt: '' }) : el('i', {}, m.mark)),
    /* 絵が無くて、名が一字の印とおなじなら、下の名札は出さない（2026-09-26）。
       同じ字を二度並べても読むものが増えないし、札の高さが他とそろわなくなる */
    (art || m.noname || m.name === m.mark) ? null
      : el('span', { class: 'hml' }, m.label || m.name),
    /* 未読の数を赤丸で出す（2026-09-24）。badge は数を返す関数。
       0 のときは丸そのものを出さない */
    (() => {
      const k = typeof m.badge === 'function' ? m.badge() : (m.badge ? 1 : 0);
      return k ? el('em', { class: 'hmbadge' }, k > 9 ? '9+' : String(k)) : null;
    })());
}
const homeMenu = side => {
  /* off は決め打ちでも、その場で決める関数でもよい（2026-10-09）。
     果たし合いの座は「間を開いているあいだだけ」出したいので関数にした */
  const list = HOME_MENU.filter(m => m.side === side
    && !(typeof m.off === 'function' ? m.off() : m.off));
  if (!list.length) return null;
  const cls = side === 'BR' ? 'bottom' : side === 'BL' ? 'bottomleft' : 'topleft';
  /* 右下は 正方形の座を横一列、そのあとに横長の札を縦に積む（2026-10-09）。
     これまでは全部を縦に積んでいたので、正方形が二つになると縦に伸びて
     下の帯に潜っていた */
  if (side === 'BR') {
    const sq = list.filter(m => m.square);
    const wide = list.filter(m => !m.square);
    return el('div', { class: 'hmenu ' + cls },
      sq.length ? el('div', { class: 'hmsq' }, sq.map(homeMenuBtn)) : null,
      ...wide.map(homeMenuBtn));
  }
  return el('div', { class: 'hmenu ' + cls }, list.map(homeMenuBtn));
};

function screenHome() {
  /* 城に着いたら、まずお知らせ札を出す（2026-10-08・悠さんの指図）。
     一度の立ち上げにつき一度だけ。開き直せばまた出る */
  adOpen();
  /* 取引所の取引履歴は、城にいるあいだも確かめる（2026-10-01）。
     座の赤丸は「売れた覚えのうち、まだ見ていない数」なので、
     取引所を開くまで検めないと、売れたことに気づけない */
  mkSettle(C);
  /* サーバーに出した品の売り上げも、城にいるあいだに受け取る（2026-10-05）。
     非同期なので入ってきたら描き直す。繋がらなければ何も起きない */
  mkTick();
  /* いまの部隊の奥義の一枚絵を、城にいるあいだに読んでおく（2026-10-05）。
     開戦の札（1.2秒）だけでは電波が細いときに間に合わず、帯に落ちていた。
     部隊の顔ぶれが変わったときだけ走らせる（毎回の描き直しで何度も読まない） */
  warmSquadArt();
  /* 友の願いと果たし合いの誘いも、城にいるあいだに見にいく（2026-10-06） */
  palTick();
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
        /* 足元の光だまり（halo）は外した（2026-10-08・悠さんの指図）。
           ３D調のコマ絵は自前で陰影を持つので、下に光を敷くとかえって浮いて見えた */
        /* 立ち絵を押すと、その武将の札がひらく（2026-09-29）。
           ホームの主役はいま出している部隊の総大将なので、
           「この子は誰で、いまどれだけ強いのか」を見るのに図鑑まで回らせない。
           言葉では教えず、右下の小さな「札」の印だけで気づかせる */
        /* 右下に置いていた小さな「札」の印は外した（2026-09-30）。
           城下町の絵の上に浮いて見えるほうが気になった。押せば出る、で足りる */
        /* 札やお知らせが上に出ているあいだは時計を止める ── 閉じた瞬間に燃え上がる */
        el('button', { class: 'lordtap fxlit', title: gen.name + 'の札', onclick: () => openCard(gen),
          style: fxDelay('home', S.detail != null || S.ad != null || S.spAsk != null) },
          /* 足元の輪（2026-10-10）。奥の半分は絵のうしろ、手前の半分は絵の前 */
          art ? titleBg(gen) : null,
          art ? footAura(gen, 'back') : null,
          art ? keepImg({ class: 'lordart', src: art, alt: gen.name })
              : el('div', { class: 'lordart chip', style: chipStyle(gen) }),
          art ? footAura(gen, 'front') : null,
          /* 特技の炎（2026-10-10）。立ち絵の上・ホームの釦の下（.lordstage が z2、釦の .hmenu が z4） */
          art ? skillFlames(gen) : null)) : null,
      /* 戦績の数字と「編成へ」は出さない（2026-09-21）。
         下ナビに編成があるので重複だったし、絵と城を隠していた。 */
      /* 城に誰も立っていないときの一枚（2026-10-02 に作り直した）。
         前は「まだ武将がおらぬ／わんこみくじで武将を集めよ」の一種類だけで、
         武将を百体持っていても いまの部隊が空なら この字が出ていた。
         しかも置き場が下すぎて、試練の塔の札のうしろに隠れていた。
         ・ほんとうに一体もいない … くじへ
         ・部隊が空なだけ        … 編成へ
         参道の真ん中、立ち絵が立つところに置く */
      gen ? null : (() => {
        const none = !P.own.some(hasCard);
        return el('button', {
          class: 'homeempty',
          onclick: () => { S.screen = none ? 'gachalist' : 'squads'; SFX.pick(); draw(); },
        },
          el('b', {}, none ? 'まだ武将がおらぬ' : `${(q && q.name) || '部隊'}に 誰もおらぬ`),
          el('span', {}, none ? 'わんこみくじで武将を集めよ' : '編成から武将を並べよ'));
      })(),
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
function sqAsk(title, note, go, solo, edit) {
  /* solo は一騎打ち（2026-09-30）。出るのは総大将ひとりなので、
     コストの上限も同じ元武将の重なりも見ない。部隊は「誰を出すか」を決めるためだけに通す */
  /* edit は「戦に入らず 編成へ行くだけ」の札（2026-10-06）。
     果たし合いのルームの『部隊編成』がここを通る。
     これから組むところなので、空でもコストが超えていても止めない */
  S.sqp = { title, note, go, solo: !!solo, edit: !!edit }; SFX.pick(); draw();
}
function sqSheet() {
  const a = S.sqp; if (!a) return null;
  const close = () => { S.sqp = null; SFX.pick(); draw(); };
  const q = P.squads[P.active] || { nos: [] };
  const over = squadCost(q) > costMax();
  const dups = dupOrigins(q.nos);
  const ok = a.edit || (q.nos.length && (a.solo || (!over && !dups.length)));
  return el('div', { class: 'sheet', onclick: e => { if (e.target.classList.contains('sheet')) close(); } },
    el('div', { class: 'card2 sqbox' },
      el('b', { class: 'sqttl' }, a.title),
      a.note ? el('p', { class: 'note' }, a.note) : null,
      el('div', { class: 'sqlist' }, P.squads.map((sq2, i) => squadCard(sq2, i))),
      a.edit ? null
        : !q.nos.length ? el('p', { class: 'note warn' }, '部隊を編成してから挑める')
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
        /* 編成へ行くだけの札では、道具は持ち込まない（2026-10-06） */
        if (a.edit) return el('div', { class: 'mgrow sqgo' },
          el('button', { class: 'go',
            onclick: () => { const g = a.go; S.sqp = null; g(); } }, 'この部隊を編む'));
        return el('div', { class: 'mgrow sqgo' },
          el('button', { class: 'go', disabled: ok ? null : true,
            onclick: () => { const g = a.go; S.sqp = null; g(); } },
            a.edit ? 'この部隊を編む' : 'この部隊で挑む'),
          el('button', {
            class: 'prepcir' + (prepN ? ' on' : '') + (part ? ' art' : ''), title: '道具を使う',
            onclick: () => { S.prepBox = true; SFX.pick(); draw(); },
            /* 数（0/3）は出さない（2026-10-07・悠さんの指図）。
               戦に持ち込めるのは一つという前提なので、分母を見せても意味が無い */
          }, part ? keepImg({ src: part, alt: '道具' }) : el('i', {}, '具')));
      })(),
      a.edit ? null : prepTags(),
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
      if (on && toEdit) { S.teamFrom = 'squads'; S.screen = 'team'; SFX.pick(); draw(); return; }
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
        /* 顔の下に段を出す（2026-10-01）。
           どの部隊が育っているかが、総戦力の数だけでは読み取れなかった */
        : squadChars(q).map(c => el('span', {
            class: 'm' + (q.general === c.no ? ' gen' : ''), style: chipStyle(c),
            title: `${c.name}　Lv.${charState(c.no).lv}`,
          }, el('em', { class: 'mlv' }, `Lv.${charState(c.no).lv}`))))),
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
          S.teamFrom = null;                 // 戻り道は「← 戦へ」が受け持つ
        } else if (!toEdit) {
          /* いまいる画面へ返す（2026-10-03）。
             全国の出陣から編成へ入ったのに、戻ると育成の部隊一覧へ
             飛ばされていた。知らぬ画面のときだけ部隊一覧に落とす */
          S.teamFrom = TEAM_FROM_NAME[S.screen] ? S.screen : 'squads';
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
/* 里見家は 2026-10-09 に史実の「丸に二つ引両」へ描き替えて丸くなったので外した */
const WIDE_KAMON = new Set(['雑賀衆']);
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
    /* 道ごとに幟を替える（2026-10-10）。修羅は朱、魔王は黒。絵が無いうちは青のまま */
    taken && noboriUrl() ? keepImg({ class: 'fnob', src: noboriUrl(), alt: '制覇' }) : null,
    kamon(p.house, 'onmap'), el('span', { class: 'fn' }, ok ? p.house : '？'));
}
const noboriUrl = () => uiUrl(['nobori_青', 'nobori_朱', 'nobori_黒'][campLv()] || 'nobori_青') || uiUrl('nobori_青');
function japanMap(maps, open, reg) {
  /* 3枚の絵を「巻」ごとに箱へ入れる（2026-09-22）。
     こうすると継ぎ目の霞を CSS だけで 2枚目・3枚目の左端に置ける。
     以前は 33.3334% / 66.6667% と決め打ちだったが、絵の白フチを切ったので
     3枚の幅がそろわなくなり、位置がずれるようになった。 */
  const inner = el('div', { class: 'jmapin' },
    /* 同じ img を使い回す（2026-10-10）。組み直すたびに新しい img だと、
       そのたびに絵を置き直して一瞬 空になる */
    maps.map(u => el('span', { class: 'jmc' }, keepImg({ class: 'jm', src: u, alt: '' }))),
    PREFS.map(p => {
      const b = flagBtn(p, open);
      b.onclick = () => { S.pref = p.id; S.screen = 'march'; SFX.pick(); draw(); };
      return b;
    }));
  const scroller = el('div', { class: 'jmap' }, inner);
  // 制覇の数・章のタブ・章の名は、地図の上に重ねる（2026-09-21）
  const tabs = el('div', { class: 'row chapters' }, REGION_ORDER.map(id => {
    const ok = open.includes(id), done = regionTaken(id);
    const r = REGIONS.find(x => x.id === id);
    return el('button', {
      class: 'chip' + (S.region === id ? ' on' : '') + (ok ? '' : ' locked') + (done ? ' done' : ''),
      disabled: ok ? null : true,
      onclick: () => { S.region = id; S.pref = null; SFX.pick(); draw(); },
    }, ok ? r.name : '？');
  }));
  /* 章の段は 画面を組み直すたびに左端へ戻ってしまう（2026-10-02）。
     右に隠れた東北・北海道を選んでも、押した拍子に頭まで巻き戻り、
     「段が固まって動かない」ように見えていた。
     いま選んでいる章が真ん中に来るところまで、描いたあとに送っておく。
     送るのはこの段だけ（scrollIntoView だと地図ごと動いてしまう） */
  requestAnimationFrame(() => {
    const on = tabs.querySelector('.chip.on');
    if (!on || !tabs.isConnected) return;
    const x = on.offsetLeft - (tabs.clientWidth - on.offsetWidth) / 2;
    tabs.scrollLeft = Math.max(0, x);
  });
  const over = el('div', { class: 'jover' },
    el('div', { class: 'cmrow' },
      el('div', { class: 'unibar' }, el('b', {}, `制覇 ${takenCount()} / ${PREFS.length}`)),
      campModeRow()),
    tabs,
    // 章の題。絵（app/assets/ui/title_九州.png など）があれば文字の代わりに出す
    (() => {
      const art = uiUrl('title_' + reg.name);
      return el('div', { class: 'jttl' + (art ? ' art' : '') },
        art ? el('img', { src: art, alt: reg.label }) : reg.label);
    })());
  /* 道ごとに地図の色を変える（2026-10-10）。修羅は血の気、魔王は夜。
     filter は絵（.jm）だけに掛ける ── 親に掛けると旗まで染まる */
  const wrap = el('div', { class: 'jwrap md' + campLv() }, scroller, over);
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
/* 「まとめて頂戴」で実際に取れる数（2026-10-09）。solo の札は数に入れない。
   入れてしまうと、押しても何も起きない釦が灯る */
const miBulkCount = tab => miOfTab(tab).filter(m => miReady(m) && !m.solo).length;

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
  if (rw.stone) addFreeStones(rw.stone);   // 褒美の石は必ず無料ストーン（2026-10-07）
  if (rw.stamina) P.stamina = Math.min(P.staminaMax, P.stamina + rw.stamina);
  if (rw.ticket) P.items[TICKET] = (P.items[TICKET] || 0) + rw.ticket;
  for (const [k, v] of Object.entries(rw.items || {})) P.items[k] = (P.items[k] || 0) + v;
  if (rw.title) gainTitle(rw.title);
  P.mi[MI_GOT[m.tab]].push(m.id);
  /* 受け取ったお役目の数（2026-09-25／2026-10-02 に日と週へも足した）。
     miBump を使うと日が変わっていたときに、いま入れた gd が飛ぶ。
     だから miRoll を通さず、三つの箱へ直に足す */
  P.mi.t.duty = (P.mi.t.duty || 0) + 1;
  P.mi.d.duty = (P.mi.d.duty || 0) + 1;
  P.mi.w.duty = (P.mi.w.duty || 0) + 1;
  /* 褒美でもらった小判も「集めた合計」に入れる（2026-10-02） */
  if (rw.koban) { P.mi.d.koban = (P.mi.d.koban || 0) + rw.koban;
                  P.mi.w.koban = (P.mi.w.koban || 0) + rw.koban;
                  P.mi.t.koban = (P.mi.t.koban || 0) + rw.koban; }
  savePlayer();
  return rw;
}
/* まとめて受け取る。いま出ているタグのぶんだけ */
function miTakeAll(tab) {
  /* solo の札は まとめて頂戴では取らない（2026-10-09・悠さんの指図）。
     手引きを抜けた褒美（門出の石3000）がほかに紛れて入ってくるのを止める。
     その一つだけは、自分の手で「頂戴」を押してもらう */
  const list = miOfTab(tab).filter(m => miReady(m) && !m.solo);
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
  miSet('taken', takenCount(0));                       // 制した国の数（並の道で数える・2026-10-10）
  // 極みまで育てた武将の数。覚醒で上限が伸びるので「いまの上限に届いているか」で見る
  miSet('maxLv', P.own.filter(n => hasCard(n) && charState(n).lv >= lvCapOf(n)).length);
  miSet('chap', REGION_ORDER.filter(r => regionTaken(r, 0)).length);   // 平定した章の数（並で数える）
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
  { n: '野伏せり',     g: '全国', t: 1, f: () => takenCount(0) >= 1 },
  { n: '里の番犬',     g: '全国', t: 1, f: () => takenCount(0) >= 3 },
  { n: '城持ち',       g: '全国', t: 2, f: () => takenCount(0) >= 10 },
  { n: '大名',         g: '全国', t: 4, f: () => takenCount(0) >= 22 },
  { n: '国盗り',       g: '全国', t: 5, f: () => takenCount(0) >= 38 },
  { n: '天下統一',     g: '全国', t: 6, f: () => takenCount(0) >= PREFS.length },
  /* 修羅・魔王の道（2026-10-10・悠さんの指図）。本拠地は初めから取っているので「一国」は 2 から。
     名はファイル名（frame/<名>.webp）になるので、あとから変えない。
     魔王を制した者が「第六天魔王」を名乗る ── 倒した相手の名を継ぐ */
  { n: '修羅の一歩',   g: '修羅', t: 3, f: () => campLvOpen(1) && takenCount(1) >= 2 },
  { n: '修羅の国盗り', g: '修羅', t: 5, f: () => campLvOpen(1) && takenCount(1) >= 24 },
  { n: '修羅天下',     g: '修羅', t: 6, f: () => campLvOpen(1) && !!campBox(1).clear },
  { n: '夜に挑む者',   g: '魔王', t: 4, f: () => campLvOpen(2) && takenCount(2) >= 2 },
  { n: '夜を裂く者',   g: '魔王', t: 5, f: () => campLvOpen(2) && takenCount(2) >= 24 },
  { n: '第六天魔王',   g: '魔王', t: 6, f: () => campLvOpen(2) && !!campBox(2).clear },
  /* 落ち延び道中（2026-10-10・悠さんの指図「初級は特技の品・魂・称号で報いる」）。
     どれか一体でその段の階まで抜ければ渡す。名は額の絵の名になるので、あとから変えない */
  { n: '落ち延びし者', g: '道中', t: 1, f: () => trBest(0) >= 10 },
  { n: '山越えの犬',   g: '道中', t: 2, f: () => trBest(0) >= 20 },
  { n: '帰り着きし者', g: '道中', t: 3, f: () => trBest(0) >= 30 },
  { n: '抜け道の主',   g: '道中', t: 4, f: () => trBest(1) >= 30 },
  { n: '不帰を越えし者', g: '道中', t: 6, f: () => trBest(2) >= 30 },
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
  /* ---- お役目の累計褒美で渡す称号（2026-10-09 に足した）----
     **これを並べ忘れていたせいで、取った称号が黙って消えていた。**
     checkTitles() の最後で P.titles を TITLE_ORDER に載っているものだけに絞るので、
     ここに無い称号は、次に城へ入った瞬間に落とされていた（実測で確かめた）。
     名乗っていた称号が落ちると P.title も先頭へ巻き戻る。
     f が false なのは、お役目を果たす以外では手に入らないため。
     **mission.js に rw:{title:...} を足したら、必ずここにも足すこと。** */
  { n: '市の顔',       g: 'お役目', t: 2, f: () => false },   // 取引所に50体
  { n: '真っ向勝負',   g: 'お役目', t: 3, f: () => false },   // 一騎打ちに50勝
  { n: '運試し',       g: 'お役目', t: 3, f: () => false },   // くじを500回
  { n: '腕まかせ',     g: 'お役目', t: 4, f: () => false },   // おまかせで500勝
  { n: '血を継ぐ者',   g: 'お役目', t: 4, f: () => false },   // 特技を50度継ぐ
  { n: '蔵の主',       g: 'お役目', t: 4, f: () => false },   // 小判を200万
  { n: '鬼を宿す者',   g: 'お役目', t: 5, f: () => false },   // 覚醒を100度
  { n: '不断の主',     g: 'お役目', t: 6, f: () => false },   // 365日 城に戻る
  { n: '不惑の将',     g: 'お役目', t: 6, f: () => false },   // 合わせて5000戦
];
const TITLE_ORDER = new Map(TITLES.map((x, i) => [x.n, i]));
const titleOf = n => TITLES.find(x => x.n === n) || null;
/* ---- NPCの称号（2026-10-09）----
   本物の友の顔に額を出せるようにしたら、**NPCだけ額が無い**ことになってしまう。
   それでは「どちらが人か分かってしまう」ので、NPCにも称号を持たせる。
   強さに見合った位の中から、印から決め打ちで一つ選ぶ
   ── その相手はいつ見ても同じ額を付けている。
   強さの刻みは番付の称号（足軽頭8000／侍大将14000／鬼神22000／軍神30000／覇者38000）に合わせた */
function npcTierOfPower(power) {
  const p = power || 0;
  return p >= 38000 ? 6 : p >= 30000 ? 5 : p >= 22000 ? 4 : p >= 14000 ? 3 : p >= 8000 ? 2 : 1;
}
function npcTitleOf(id, tier) {
  const pool = TITLES.filter(x => x.t === tier);
  if (!pool.length) return '';
  let h = 2166136261 >>> 0;
  for (const ch of String(id)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return pool[(h >>> 3) % pool.length].n;
}

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
  /* 並びは三段（2026-10-08・悠さんの指図）。
       一 … 果たして まだ受け取っていないもの（頂戴の釦が灯っている）
       二 … まだ果たしていないもの
       三 … 受け取り済み（CLEAR）
     長い一覧の下のほうで釦が灯っていても気づけなかった。
     段の中の並びは mission.js に書いた順のまま（sort は安定なので崩れない） */
  const miSeat = m => (miReady(m) ? 0 : miGot(m) ? 2 : 1);
  const list = miOfTab(tab).slice().sort((a, b) => miSeat(a) - miSeat(b));
  const ready = miBulkCount(tab);
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
        return el('div', { class: 'mirow' + (got ? ' got' : '') + (can ? ' can' : '')
             + (ic ? ' hasic' : '') + (m.solo && can ? ' solo' : '') },
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
          }, got ? 'CLEAR' : '頂戴'));
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
  soul:   ['武士の魂', '重ねを解雇すると増える。魂を振る・取引所で使う'],
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
  { k: '編成', text: '部隊に五人そろえるワン！', go: () => { S.teamFrom = 'home'; S.screen = 'team'; },
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
  addFreeStones(TEBIKI_PRIZE.stone);       // 褒美の石は必ず無料ストーン（2026-10-07）
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
        el('i', {}, ok ? 'CLEAR' : '→'),
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
  if (g.stone) addFreeStones(g.stone);     // 褒美の石は必ず無料ストーン（2026-10-07）
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
  if (won) miBump('rkWin');   // お役目の数（2026-10-02）
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
  const close = () => { S.rk = false; S.rkSel = null; S.rkMsg = ''; S.rkLog = false; draw(); };
  if (r.last) return rkLastSheet(r.last);
  if (S.rkPz) return rkPrizeSheet();
  if (S.rkSel) return rkFoeSheet(rows.find(x => x.id === S.rkSel) || null);
  if (S.rkLog) return rkLogSheet(r);
  /* 一覧の一騎（2026-10-11 から 4位より下だけ）。中身は前と同じ */
  const rowEl = x => el('button', {
        class: 'rkrow' + (x.me ? (rkMyRank() > RK_PIN ? ' me pin' : ' me') : ''),
        onclick: x.me ? null : () => { S.rkSel = x.id; S.rkMsg = ''; SFX.pick(); draw(); },
      },
        el('span', { class: 'rkn' }, x.rank),
        /* 顔はヘッダーの自分の顔と同じ作り。NPCは総大将の顔を出す（2026-09-25）*/
        /* NPCの称号は強さから決め打ち（2026-10-09）。自分だけ額が付いて
           相手に付かないと、そこで人かどうか分かってしまう */
        frFace(x.me ? faceChar() : rkGenOf(x), 'rkf',
          x.me ? P.title : (x.title || npcTitleOf(x.id, npcTierOfPower(x.power)))),
        el('span', { class: 'rknm' },
          el('b', {}, x.name),
          el('i', {}, x.me ? (x.title || NONAME) : rkSide(r.pt, x.pt),
            el('em', {}, `総合力 ${num(x.power)}`))),
        el('span', { class: 'rkpt' }, el('b', {}, num(x.pt)), el('i', {}, 'pt')));
  return el('div', { class: 'sheet', onclick: e => { if (e.target.classList.contains('sheet')) close(); } },
    el('div', { class: 'card2 rkbox' },
      el('div', { class: 'rkttl' },
        /* 留守のあいだの戦は、ここから別の札で見る（2026-10-11・悠さんの指図「戦歴は釦をつけてそこで確認」）。
           左上に置いて、右上の褒美の釦と対にする。新しい戦があるあいだは小さな印を灯す */
        el('button', { class: 'rklogb', title: '戦歴',
          onclick: () => { S.rkLog = true; r.logSeen = r.day; savePlayer(); SFX.pick(); draw(); } },
          '戦歴', r.log.length && r.logSeen !== r.day ? el('i', { class: 'rklogdot' }) : null),
        /* 題は段の名にした（2026-10-11・悠さんの指図「番付ってタイトルを五の丸とかの表示に」） */
        el('b', { class: 'mittl' }, RK_TIERS[r.tier]),
        /* 対戦札は しるしの横に小さく（2026-10-11）。上の三つの箱は外した：
           自分の点と順位は表彰台か一覧の自分の行に出ているので二度出しになっていた */
        /* 札の絵（ui/rk_ticket・2026-10-11 悠さん作）と「×5」だけ。絵が無いうちは「札」の一字 */
        el('span', { class: 'rktick' + (r.tick < 1 ? ' none' : '') },
          uiUrl('rk_ticket') ? keepImg({ class: 'rktkimg', src: uiUrl('rk_ticket'), alt: '対戦札' }) : el('i', {}, '札'),
          el('b', {}, `×${r.tick}`)),
        /* 段ごとの褒美を見る小さな釦（2026-09-25）。右上に置く */
        /* 小判の絵だと「ここで小判がもらえる」に見えるので、しるしに変えた（2026-09-25） */
        el('button', { class: 'rkpz', title: '月末の褒美を見る',
          onclick: () => { S.rkPz = true; SFX.pick(); draw(); } }, el('i', {}, 'i'))),
      el('p', { class: 'ttsub' }, `月が変われば 上位${RK_UP}組が昇格、下位${RK_DOWN}組が降格するわん`),
      /* 上の三人は表彰台に立ち絵で（2026-10-11・悠さんの指図）。4位から下は一覧。
         表彰台も一覧と同じく、押せば相手の札が開く（自分は押せない）。
         立ち絵のうしろに、その人の名乗る称号の背景を敷く（友の部隊の札と同じ作り）。
         NPC も同じ作りで出す ── 人かどうかが見た目で分からないように */
      el('div', { class: 'rklist' },
        rkPodium(rows.slice(0, 3), r),
        rows.slice(3).map(rowEl)),
      S.rkMsg ? el('p', { class: 'mimsg' }, S.rkMsg) : null,
      closeX(close)));
}
/* 表彰台（2026-10-11）。並びは 2・1・3（一位がまん中で高い） */
function rkPodium(top, r) {
  const col = x => {
    if (!x) return el('div', { class: 'rkpc none' });
    const ch = x.me ? faceChar() : rkGenOf(x);
    const ttl = x.me ? P.title : (x.title || npcTitleOf(x.id, npcTierOfPower(x.power)));
    const bg = ttl ? fxUrl('tbg_' + ttl) : null;
    const pw = ch ? pawnUrl(ch.no) : null;
    return el('button', {
      class: 'rkpc r' + x.rank + (x.me ? ' me' : ''),
      onclick: x.me ? null : () => { S.rkSel = x.id; S.rkMsg = ''; SFX.pick(); draw(); },
    },
      el('span', { class: 'rkpfig' },
        bg ? keepImg({ class: 'rkpbg', src: bg, alt: '' }) : null,
        pw ? keepImg({ class: 'rkppw', src: pw, alt: ch.name })
           : ch && cardArt(ch) ? keepImg({ class: 'rkpcd', src: cardArt(ch), alt: ch.name, loading: 'lazy' })
           : el('i', { class: 'rkpch', style: ch ? chipStyle(ch) : '' }, el('b', {}, ((ch && ch.name) || '')[0] || ''))),
      el('span', { class: 'rkpstep' },
        el('em', { class: 'rkprk' }, String(x.rank)),
        el('b', { class: 'rkpnm' }, x.name),
        el('span', { class: 'rkpttl' }, ttl || NONAME),
        el('span', { class: 'rkppt' }, el('b', {}, num(x.pt)), el('i', {}, 'pt'))));
  };
  return el('div', { class: 'rkpod' }, col(top[1]), col(top[0]), col(top[2]));
}
/* 留守のあいだの戦（2026-10-11 番付の札から分けた） */
function rkLogSheet(r) {
  const back = () => { S.rkLog = false; SFX.pick(); draw(); };
  const w = r.log.filter(x => x.won).length, l = r.log.length - w;
  const sum = r.log.reduce((a, x) => a + (x.d || 0), 0);
  return el('div', { class: 'sheet', onclick: e => { if (e.target.classList.contains('sheet')) back(); } },
    el('div', { class: 'card2 rkbox rklogbox' },
      el('b', { class: 'mittl' }, '戦歴'),
      el('p', { class: 'ttsub' }, '留守のあいだに、陣に攻め寄せた者たち'),
      r.log.length ? el('div', { class: 'rklogsum' },
        el('span', { class: 'rklw' }, `${w} 勝`), el('span', { class: 'rkll' }, `${l} 敗`),
        el('span', {}, `${sum > 0 ? '+' : ''}${sum} pt`)) : null,
      el('div', { class: 'rklist' }, r.log.length ? r.log.map(x => el('div', { class: 'rklogrow' + (x.won ? '' : ' lose') },
        el('em', { class: 'rklogwl' }, x.won ? '勝' : '負'),
        el('span', { class: 'rknm' }, el('b', {}, x.name), el('i', {}, el('em', {}, `総合力 ${num(x.power || 0)}`))),
        el('span', { class: 'rkpt' }, el('b', {}, `${x.d > 0 ? '+' : ''}${x.d}`), el('i', {}, 'pt'))))
        : el('p', { class: 'note' }, 'きょうは、まだ誰も攻めてこぬ')),
      closeX(back, 'もどる')));
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
        el('button', { class: 'frc' + (i === 0 ? ' gen' : ''), title: c.name, onclick: () => openCard(c, true, true) },
          cardArt(c) ? keepImg({ class: 'cf', src: cardArt(c), alt: c.name, loading: 'lazy' })
                     : el('i', { style: chipStyle(c) }, el('b', {}, (c.name || '')[0] || '')),
          i === 0 ? genMark() : null))),
      el('p', { class: 'ttsub' }, (() => {
        const w = rkPoint(r.pt, foe.pt, true), l = rkPoint(r.pt, foe.pt, false);
        return `勝てば ${w > 0 ? '+' : ''}${w}　負ければ ${l}`;
      })()),
      S.rkMsg ? el('p', { class: 'frmsg' }, S.rkMsg) : null,
      /* 2026-10-09（悠さんの指図）：番付の相手にも **友の願いを出せる**ようにした。
         強い相手と出会える場は番付しかないので、ここで結べないのはもったいない。
         結んだあとは マイフレンドに並び、果たし合いも留守の陣も見舞も通る。
         番付の顔ぶれは月で組み替わるので、願いを出した時点の姿を控える */
      (() => {
        const mine = !!rkPalOf(foe.id);
        const asked = !!((P.palRkAsk || {})[foe.id]);
        return el('div', { class: 'frbtns' },
          el('button', { class: 'go' + (ok ? '' : ' soon'), disabled: ok ? null : true,
            onclick: () => rkStart(foe) },
            r.tick < 1 ? '対戦札が無いわん' : '出陣'),
          mine ? el('button', { class: 'ghost', disabled: true }, 'もう友である')
          : asked ? el('button', { class: 'ghost', disabled: true }, '返事待ち')
          : el('button', { class: 'ghost', onclick: () => rkAsk(foe) }, '友になる'));
      })(),
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
/* 名乗りの札は 一度だけ作って使い回す（2026-10-02）。
   画面はどこを押しても まるごと組み直すので、作り直すたびに
   ・入りの動き（.card2 の up）が鳴り直して点滅する
   ・打ちかけの字と、字を打つ場所（focus）が飛ぶ
   の二つが起きていた。中身で変わるのは断りの一行だけなので、そこだけ書き換える */
let NM_NODE = null;
function nameSheet() {
  if (NM_NODE) { nmMsgPut(); return NM_NODE; }
  const save = () => {
    const i = NM_NODE ? NM_NODE.querySelector('.nminp') : document.querySelector('.nminp');
    const v = (i ? i.value : '').trim().slice(0, NAME_MAX);
    if (!v) { S.nmMsg = '名がないと出陣できぬわん'; nmMsgPut(); SFX.pick(); return; }
    P.name = v; savePlayer(); S.nmMsg = ''; NM_NODE = null; SFX.win(); draw();
  };
  NM_NODE = el('div', { class: 'sheet nmsh' },
    el('div', { class: 'card2 nmbox' },
      el('b', { class: 'nmttl' }, '名を名乗るわん'),
      el('p', { class: 'nmsub' }, 'この名で天下に知られるわん'),
      el('input', {
        class: 'nminp', type: 'text', maxlength: String(NAME_MAX),
        placeholder: '八文字まで入るわん', autocomplete: 'off', spellcheck: 'false',
        onkeydown: e => { if (e.key === 'Enter') { e.preventDefault(); save(); } },
      }),
      /* 断りの一行はいつも置いておき、字の有る無しで見せ隠しする。
         出したり消したりすると札の高さが動いて、これも点滅に見える */
      el('p', { class: 'nmmsg', style: 'display:none' }, ''),
      el('button', { class: 'go wide', onclick: save }, 'この名で参る')));
  nmMsgPut();
  return NM_NODE;
}
/* 断りの一行だけを書き換える。札は作り直さない */
function nmMsgPut() {
  const e = NM_NODE && NM_NODE.querySelector('.nmmsg');
  if (!e) return;
  e.textContent = S.nmMsg || '';
  e.style.display = S.nmMsg ? '' : 'none';
}

/* ================= 友（2026-09-24）=================
   下した国の主が、そのまま友になる。
   「倒した相手と誼を結ぶ」は戦国のならい。作りものの友を並べるより筋が通るし、
   全国を進めるほど友が増えるので、天下取りの手が止まらない。
   友の部隊は campEnemy がその国の seed から作り直すので、保存しなくても
   いつ開いても同じ顔ぶれが出る。あとで本物の友を繋ぐときも、この棚に並べればよい。 */

/* 友の顔ぶれ。制覇した国のうち、自分の本拠地だけは除く（それは自分なので） */
const frList = () => PREFS.filter(p => prefTaken(p.id, 0) && p.id !== (P.camp.start || 'aichi'));
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
  /* 番号でも武将そのものでも受ける（2026-10-06・悠さんの実測で直した）。
     国の主は武将そのもの（`fr.general`）を渡してくるが、
     サーバーから来る本物の友は **総大将の番号** を渡してくる。
     faceStyle は武将そのものを見るので、番号のままだと `c.no` が無く、
     顔も コマ絵も カードも引けずに灰色の四角になっていた */
  if (typeof gen === 'number') gen = charOf(gen);
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
/* 友との手合わせは **何度でも**（2026-10-10・悠さんの指図「友人対戦はやっぱり何回でもできる様にしよう」）。
   入り口では止めない。ただし褒美（sparReward）はその日の一戦目だけ ──
   何度でも褒美が出ると、弱い友を叩き続けるだけで稼げてしまうため。
   canSpar は「今日まだ褒美の出る一戦が残っているか」の意味になった */
const canSpar = id => frState(id).spar !== today();
function sparStart(id) {
  const fr = npcFriendOf(id);      // 国の主でも 番付の相手でも通る（2026-10-09）
  if (!fr) return;
  // どう手合わせするかを先にえらぶ（2026-09-30）
  S.spAsk = id; SFX.pick(); draw();
}
/* 稽古のしかたをえらぶ札（2026-09-30）。
   一騎打ち＝総大将どうしの一対一。腕まかせのオートで決まる。
   総力戦＝いままでどおり、えらんだ部隊まるごと。
   どちらも「何が違うか」は字で並べず、語り手の吹き出しで言わせる */
function sparAskSheet() {
  const id = S.spAsk; if (id == null) return null;
  const aw = S.spAway && S.spAway.id === id ? S.spAway : null;   // 留守の陣から来たとき（2026-10-10）
  const fr = aw ? { name: aw.name } : npcFriendOf(id);
  if (!fr) { S.spAsk = null; return null; }
  const close = () => { S.spAsk = null; S.spAway = null; SFX.pick(); draw(); };
  const go = duel => {
    S.spAsk = null; S.spAway = null;
    if (aw) {
      sqAsk(duel ? '一騎打ちに出す部隊' : '留守の陣に出す部隊',
        duel ? `${fr.name} の留守の陣へ一騎打ち。出るのは総大将ひとりだけ` : `${fr.name} の留守の陣へ総力戦`,
        () => awayRun(aw, duel), !!duel);
      return;
    }
    sqAsk(duel ? '一騎打ちに出す部隊' : '稽古に出す部隊',
      duel ? `${fr.name} との一騎打ち。出るのは総大将ひとりだけ` : `${fr.name} との総力戦`,
      () => {
        S.fr = false; S.frId = null; S.frMsg = '';
        /* 番付で知り合った相手は、国を持たない。
           盤も顔ぶれも「番付のときのその人」をそのまま借りる（2026-10-09）。
           friendly を立ててあるので、点は動かないし 対戦札も減らない */
        if (fr.rk) startBattle(null, null, null, { npc: fr.rk, friendly: true, duel: !!duel });
        else startBattle(null, null, { id, pref: fr.pref, duel: !!duel });
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
      el('b', { class: 'sqttl' }, aw ? `${fr.name} の留守の陣` : `${fr.name} との稽古`),
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

/* ================= 友（2026-10-06 に作り直した）=================

   前は「平定した国の主」だけが並ぶ一覧だった。
   本物のプレイヤーと友になれるようにして、札を二つに分けた。

     友を探す    … まだ友でない相手。本物の主を毎回30人、まぜこぜに。
                   足りないぶんは国の主（NPC）で埋める。**平定していなくても出る**
     マイフレンド … 結んだ相手ぜんぶ（100人まで）。主番号か名でさがせる

   本物の友は **双方が頷いたときだけ** 結ぶ（願う → 受ける）。
   国の主はその場で結ぶ（こちらが用意した相手なので断る理由が無い）。

   ★引き継ぎID（WAN-…）は乗っ取りの鍵なので、人には見せない。
     人に見せてよい **主番号** をサーバーが別に配る（例 W7K2M9Q4）。

   果たし合いの誘いは置き手紙。誘うほうが座を立てて合言葉を置き、
   相手は10秒ごとに机を見て気づく。**押し掛ける仕掛けは無い**ので、
   相手がゲームを開いていないと届かない。 */

let PAL = { pals: [], asks: [], sent: [], invites: [], gifts: [], raids: [] };   // サーバーから来た友の控え
let PAL_FIND = [];                                          // 「友を探す」の控え
let PAL_AT = 0, PAL_BUSY = false;
const palOn = () => linked();
/* ---- 国の主を「人」として扱う（2026-10-06・悠さんの指図）----
   NPC と分かるとつまらないので、**本物の主とまったく同じ見た目・同じ動き**にする。
     ・位と主番号を持つ（国の印から決め打ちで作るので、いつ見ても同じ）
     ・友になるときは本物と同じく「願い → 相手が受ける」を通る
       （NPC は少し間をおいて必ず受ける。待つ気持ちまで同じにしたい）
     ・果たし合い・陣中見舞も同じ釦から

   マイフレンドに出るのは **双方が頷いた相手だけ**。
   平定しただけでは出ない。

   2026-10-08（悠さんの指図）：**引き継ぎをやめ、引き継いだぶんも片づけた**。
   2026-10-06 に「一覧がいきなり空になると驚くので」と、平定ぶんを
   そのままマイフレンドへ流し込む仕掛け（palMoved）を入れていた。
   その結果、**願いを出してもいない主が48人も並んでいた**（悠さんの実測）。
   頷き合っていない相手が友の一覧に居るのは、そもそもおかしい。
   一度だけ `P.palNpc` を空にして、これからは願い→受けるを通った相手だけにする。
   外れた主は「友を探す」に戻るので、また願いを出せばよい */
function npcMigrate() {
  if (P.palNpcV2) return;
  P.palNpcV2 = 1;
  P.palNpc = [];          // 平定だけで並んでいたぶんを片づける（一度きり）
  P.palMoved = 1;         // 古い引き継ぎが二度と走らないよう印は立てたままにする
  savePlayer();
}
/* 国の主の主番号。国の印から決め打ちで作るので、いつ見ても同じ番号になる */
const NPC_ALPHA = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
function npcTag(id) {
  let h = 2166136261 >>> 0;
  for (const ch of String(id) + 'wanko') { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  let out = '';
  for (let i = 0; i < 8; i++) { out += NPC_ALPHA[h % 32]; h = Math.imul(h ^ (h >>> 13), 2654435761) >>> 0; }
  return out;
}
/* その日、その国の主が留守かどうか（2026-10-06）。
   三人に一人ほど。国の印と日付から決め打ちなので、その日は何度開いても同じ顔ぶれが留守 */
function npcAway(id) {
  let h = 2166136261 >>> 0;
  for (const ch of String(id) + today()) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return (h >>> 7) % 3 === 0 ? 1 : 0;
}
/* 国の主を、本物の主とそろえた形にする */
function npcCard(p) {
  const fr = frOf(p.id);
  const team = (fr && fr.team) || [];
  const lv = Math.max(1, Math.round(team.reduce((a, c) => a + ((c.stats && c.stats.lv) || 0), 0) / Math.max(1, team.length))
                       || Math.min(200, 8 + team.length * 9 + (p.battles || 1) * 7));
  return { id: p.id, npc: true, tag: npcTag(p.id), name: lordName(p), lv,
           /* 称号は位から（2026-10-09）。本物の友と同じく顔に額が付く */
           title: npcTitleOf(p.id, lv >= 160 ? 6 : lv >= 120 ? 5 : lv >= 90 ? 4 : lv >= 60 ? 3 : lv >= 30 ? 2 : 1),
           face: fr && fr.general, gen: fr && fr.general,
           /* 国の主にも 在／留守 がある（2026-10-06）。
              いつ訪ねても必ず居るのは、それだけで人でないと分かってしまう。
              国の印と日付から決め打ちで決まるので、その日は何度見ても同じ */
           away: npcAway(p.id), team: 1 };
}
const npcPals = () => {
  npcMigrate();
  const set = new Set(P.palNpc || []);
  set.delete(P.camp.start || 'aichi');
  return PREFS.filter(x => set.has(x.id));
};
const npcPalIds = () => new Set(npcPals().map(x => x.id));
/* ---- 番付で知り合った相手（2026-10-09・悠さんの指図）----
   番付の相手の札から「友になる」を押せるようにした。
   番付の顔ぶれは月ごとに組み替わるので、**友になった時点の姿をまるごと控える**。
   控えないと、来月には同じ番号（n0_12 など）が別の犬を指してしまう。
   控えてあるぶんは番付とは切り離されて、ずっとその人のまま。

   見た目も手ざわりも 国の主とまったく同じにする ── 願い、待ち、在／留守、
   見舞、果たし合い、留守の陣。どれが人でどれが NPC か、遊ぶ人には分からない */
const rkPals = () => (P.palRk || []);
const rkPalOf = id => rkPals().find(x => x.id === id) || null;
/* 位は総合力から。番付の組は lv を持たないので、強さから見立てる */
const rkPalLv = x => Math.max(1, Math.min(200, Math.round((x.power || 0) / 110)));
function rkFriendCard(x) {
  const team = rkTeamOf(x);
  const gen = team[0] || null;
  return { id: x.id, npc: true, rk: x, tag: npcTag(x.id), name: x.name, lv: rkPalLv(x),
           /* 番付で見ていたときと同じ額を、友になっても付けつづける（2026-10-09） */
           title: npcTitleOf(x.id, npcTierOfPower(x.power)),
           face: gen, gen, away: npcAway(x.id), team: 1 };
}
/* 友になっている NPC を番号で引く（2026-10-09）。
   国の主（県）と 番付の相手（控え）の二種類があるので、ここで吸収する。
   pref があれば国の主、rk があれば番付の相手 */
function npcFriendOf(id) {
  const x = rkPalOf(id);
  if (x) return { rk: x, pref: null, name: x.name, team: rkTeamOf(x) };
  const fr = frOf(id);
  return fr ? { rk: null, pref: fr.pref, name: fr.name, team: fr.team } : null;
}
/* 番付の相手に出した願い。国の主と同じく 15〜45秒ほどで必ず受ける */
const rkAsks = () => Object.keys(P.palRkAsk || {});
function rkAskTick() {
  const m = P.palRkAsk || {};
  const now = Date.now();
  let moved = false;
  for (const id of Object.keys(m)) {
    const a = m[id];
    if (!a || now < (a.at || 0)) continue;
    delete m[id];
    if (!Array.isArray(P.palRk)) P.palRk = [];
    if (a.x && !P.palRk.some(y => y.id === id)) P.palRk.push(a.x);
    moved = true;
  }
  if (moved) { P.palRkAsk = m; savePlayer(); }
  return moved;
}
/* 番付の相手に願いを出す。押した時点の姿を控える */
function rkAsk(npc) {
  if (rkPalOf(npc.id)) { S.rkMsg = 'もう友である'; SFX.pick(); draw(); return; }
  const m = P.palRkAsk || (P.palRkAsk = {});
  if (m[npc.id]) { S.rkMsg = 'すでに願いを出しておる。返事を待たれよ'; SFX.pick(); draw(); return; }
  m[npc.id] = { at: Date.now() + 15000 + Math.floor(Math.random() * 30000),
                x: { id: npc.id, name: npc.name, power: npc.power, pick: npc.pick,
                     tier: rkState().tier, at: Date.now() } };
  savePlayer();
  S.rkMsg = `${npc.name} に願いを出した。相手の返事を待つ`;
  SFX.pick(); draw();
}
/* 願いを出して、返事を待っている国の主（2026-10-06）。
   本物と同じく少し待たせる。15〜45秒ほどで必ず受ける */
const npcAsks = () => Object.keys(P.palNpcAsk || {});
function npcAskTick() {
  const m = P.palNpcAsk || {};
  const now = Date.now();
  let moved = false;
  for (const id of Object.keys(m)) {
    if (now < m[id]) continue;
    delete m[id];
    if (!Array.isArray(P.palNpc)) P.palNpc = [];
    if (!P.palNpc.includes(id)) P.palNpc.push(id);
    moved = true;
  }
  if (moved) { P.palNpcAsk = m; savePlayer(); }
  return moved;
}
/* 国の主からの返礼を受け取る（2026-10-06）。
   前は家を訪ねたときに渡していたが、家へ行く道をやめたので、
   城を開いたときと札を開いたときにまとめて受け取る。
   受け取らないままだと、城の赤丸が消えずに残りつづける */
function npcBackTick() {
  let n = 0, who = [];
  for (const p of npcPals()) {
    if (!frBackReady(frState(p.id))) continue;
    if (frTakeBack(p.id)) { n++; if (who.length < 2) who.push(lordName(p)); }
  }
  if (n) S.frMsg = `${who.join('・')} から返礼が届いた`;
  return n;
}

/* 置き部隊を預けるのは **変わったときだけ**（2026-10-06）。
   名乗りは九秒ごとに飛ぶので、毎回 五千字の包みを積むと
   蔵の書き込みが一時間に四百回になる。無駄だし銭もかかる。
   前に送った包みと見くらべて、同じなら送らない（サーバーは前のぶんを残す）。
   半時ごとに一度は送り直す ── 蔵の側で何かあって落ちていても、そのうち戻る */
let PAL_TEAM_SIG = '', PAL_TEAM_AT = 0;
/* 部隊をまだ組んでいない人のための 間に合わせの陣（2026-10-08・悠さんの指図）。
   **留守にしても陣は残る**を全員に通すため、組んだ覚えが無い人には
   持ち駒のうち強い五騎で陣を立てて預ける。
   これが無いと「留守」の札だけ出て、押す釦は果たし合い ── 相手は居ないので
   いつまでも入ってこない、という嘘になっていた（悠さんの実測・「た」の行）。
   国の主が team:1 で必ず戦えるのと、これでそろう。
   手元の部隊は書き換えない。預ける包みを組み立てるだけ */
function palTeamFallback() {
  const mine = P.own.filter(hasCard).map(charOf).filter(Boolean);
  if (!mine.length) return null;                        // 一騎も持っていない人は陣そのものが無い
  const five = mine.slice().sort((a, b) => powerOf(b) - powerOf(a)).slice(0, 5);
  return { members: five.map(grownFor), generalNo: five[0].no,
           formation: FORMS[0], slots: five.map(c => c.no),
           stage: { s: S.stage, v: S.stageV, flip: S.stageFlip } };
}
function palTeamNow() {
  let t = null, sig = '';
  try {
    t = (S.picked && S.picked.length) ? dlTeam() : palTeamFallback();
    if (!t) return null;
    sig = JSON.stringify(t);
  } catch (_) { return null; }
  if (sig === PAL_TEAM_SIG && Date.now() - PAL_TEAM_AT < 1800000) return null;
  PAL_TEAM_SIG = sig; PAL_TEAM_AT = Date.now();
  return t;
}

/* サーバーに声を掛ける。名乗り（見せる札）→ 友の一覧 → 探す一覧 の順 */
function palTick(force) {
  if (!palOn() || PAL_BUSY) return;
  if (!force && Date.now() - PAL_AT < 9000) return;
  PAL_BUSY = true;
  (async () => {
    try {
      const q = P.squads[P.active];
      /* 名乗りのついでに **置き部隊** を預ける（2026-10-06・悠さんの指図）。
         置き部隊は「部隊編成でいま選んでいる部隊」そのまま。
         別に組ませると、組み替えるのを忘れた弱い陣がいつまでも守ることになる */
      const r0 = await palMe(P.name || '名無し', P.lv || 1, (q && q.general) ?? null, palTeamNow(), P.title || '');
      if (r0 && r0.ok && r0.tag && r0.tag !== P.palTag) { P.palTag = r0.tag; savePlayer(); }
      const r1 = await palList();
      if (r1 && r1.ok) PAL = { pals: r1.pals || [], asks: r1.asks || [],
                               sent: r1.sent || [], invites: r1.invites || [],
                               gifts: r1.gifts || [], raids: r1.raids || [] };
      /* 届いている陣中見舞をまとめて受け取る（2026-10-06）。
         渡した印はサーバーが立てるので、二度入ることはない */
      if (PAL.gifts && PAL.gifts.length) {
        const rg = await palGiftTake();
        if (rg && rg.ok && rg.n) {
          for (let k = 0; k < rg.n; k++) {
            if (GIFT_BACK.koban) P.koban += GIFT_BACK.koban;
            if (GIFT_BACK.stamina) P.stamina = Math.min(P.staminaMax, P.stamina + GIFT_BACK.stamina);
          }
          savePlayer();
          S.frMsg = `${(rg.from || []).slice(0, 2).join('・')} から陣中見舞が届いた`;
        }
        PAL.gifts = [];
      }
      /* 留守のあいだに襲われていたら、ここで知る（2026-10-06）。
         置き部隊の値打ちは「留守に何があったか」が分かることにある。
         褒美は付けない。守り切ったかどうかが分かればそれでよい */
      if (PAL.raids && PAL.raids.length) {
        const rr = await palRaidTake();
        if (rr && rr.ok && rr.n) {
          const held = (rr.items || []).filter(x => !x.broke).length;
          const who = (rr.items || []).slice(0, 2).map(x => x.name).join('・');
          S.frMsg = held === rr.n ? `留守に ${who} が攻めてきたが、陣は守り切った`
                  : held ? `留守に ${who} が攻めてきた。${held} 度は守り切った`
                         : `留守に ${who} に陣を破られた`;
          P.awayLog = (rr.items || []).slice(0, 5).concat(P.awayLog || []).slice(0, 20);
          savePlayer();
        }
        PAL.raids = [];
      }
      if (S.fr && S.frTab === 'find') {
        const r2 = await palFind(S.frQ || '');
        if (r2 && r2.ok) PAL_FIND = r2.items || [];
      }
      PAL_AT = Date.now();
    } catch (_) { /* 繋がらない。国の主だけで続ける */ }
    PAL_BUSY = false;
    // 打っている最中は並びだけ入れ替える（2026-10-06）
    if (S.fr || S.screen === 'home') redraw();
  })();
}

/* 本物の相手を押したときの作り。待っているあいだ釦を止める */
/* 返事待ちの錠（2026-10-07）。
   **これが立ったままになると、友の釦がぜんぶ disabled になり、
   押しても何も起きない**（悠さんの実測「留守の陣を押すと何も表示されない」）。
   どこか一か所でも下ろし忘れると、そのあとずっと黙る作りだった。
   そこで「いつ立てたか」も覚えておき、25秒を過ぎたら勝手に下りるようにした。
   サーバーの返事はどれも数秒で来るので、25秒かかっていればもう来ない */
let FR_BUSY_AT = 0;
const frBusyNow = () => {
  if (S.frBusy && Date.now() - FR_BUSY_AT > 25000) S.frBusy = false;   // 錠が錆びついたら外す
  return S.frBusy;
};
const frBusySet = (v) => { S.frBusy = !!v; if (v) FR_BUSY_AT = Date.now(); };

function palDo(fn, done) {
  if (frBusyNow()) { S.frMsg = 'いま別の返事を待っておる。少し待たれよ'; draw(); return; }
  frBusySet(true); draw();
  Promise.resolve(fn()).then(r => {
    frBusySet(false);
    done(r || {});
    PAL_AT = 0; palTick(true);
    draw();
  }).catch(() => { frBusySet(false); S.frMsg = '繋がらなかった'; draw(); });
}

/* 友ひとりの行。**本物も国の主も同じ形**（2026-10-06）。
   kind … 'find'（まだ友でない）／'ask'（届いた願い）／'sent'（返事待ち）／'pal'（友） */
function palRow(c, kind) {
  const btn = (cls, label, on) => el('button', {
    class: 'frbtn ' + cls, ...(frBusyNow() ? { disabled: true } : {}),
    onclick: e => { e.stopPropagation(); on(); } }, label);
  const acts = [];
  if (kind === 'find') acts.push(btn('go', '友になる', () => {
    if (c.npc) {
      /* 国の主も、本物と同じく いったん「返事待ち」にする（2026-10-06）。
         すぐ友になると、そこだけ手ざわりが違って人でないと分かってしまう */
      const m = P.palNpcAsk || (P.palNpcAsk = {});
      m[c.id] = Date.now() + 15000 + Math.floor(Math.random() * 30000);
      savePlayer();
      S.frMsg = `${c.name} に願いを出した。相手の返事を待つ`; SFX.pick(); draw(); return;
    }
    palDo(() => palAsk({ id: c.id }), r => {
      S.frMsg = r.tied ? `${c.name} と友になった`
              : r.already ? 'もう友である'
              : r.asked || r.waiting ? `${c.name} に願いを出した。相手の返事を待つ`
              : '願いを出せなかった';
      if (r.tied) SFX.win(); else SFX.pick();
    });
  }));
  if (kind === 'ask') {
    acts.push(btn('go', '受ける', () => palDo(() => palOk({ id: c.id }), r => {
      S.frMsg = r.ok ? `${c.name} と友になった` : 'もう願いが無い'; SFX.win(); })));
    acts.push(btn('ghost', '断る', () => palDo(() => palNo({ id: c.id }), () => {
      S.frMsg = '断った'; SFX.pick(); })));
  }
  if (kind === 'sent') acts.push(el('span', { class: 'frwait' }, '返事待ち'));
  if (kind === 'pal') {
    /* その人から もう誘いが来ていたら「受けて立つ」に変える（2026-10-06）。
       二人とも「果たし合い」を押すと、座が二つ立って永遠に出会えなかった（悠さんの実測）。
       来ている誘いがあるなら、新しく立てずに**その座へ入る**のが正しい */
    const iv = c.npc ? null : palInviteFrom(c.id);
    /* 留守なら **置き部隊** と戦う（2026-10-06・悠さんの指図）。
       釦はひとつのまま、三つの面を持たせた。
         誘いが来ている → 受けて立つ
         在            → 果たし合い（座を立てて誘い、相手が入るのを待つ）
         留守          → 留守の陣（預けてある置き部隊と戦う。待たなくてよい）
       国の主にも同じ三面を持たせてあるので、どちらが人かは見分けられない */
    const away = !iv && c.away && c.team;
    acts.push(iv
      ? btn('go take', '受けて立つ', () => palTakeInvite(iv))
      : away
      ? btn('go sm', '留守の陣', () => awayGo(c))
      : btn('go sm', '果たし合い', () => {
          /* 国の主はその場で始まる（これまでの「稽古」をここに吞ませた・2026-10-06）。
             本物は座を立てて誘う。遊ぶ人から見ると同じ釦 */
          if (c.npc) {
            S.fr = false; sparStart(c.id); return;
          }
          palInvite(c);
        }));
    /* 陣中見舞。国の主にも本物の友にも置ける（2026-10-06）。
       どちらかにしか置けないと、そこで人かどうかが分かってしまう */
    /* その日もう置いた相手は、釦を灰色にして押せなくする（2026-10-10・悠さんの指図
       「1度行った時にテキストを出すのではなく、見舞ボタンをグレーアウト」）。
       本物の友はサーバーが覚えているが、端末でも f.gift に今日を控えて灰色を出す。
       国の主も同じ見え方 ── どちらが人か分からないように */
    const gave = frState(c.id).gift === today();
    const gb = btn('ghost sm' + (gave ? ' frdone' : ''), '見舞', () => {
      if (gave) return;
      if (c.npc) {
        if (frGift(c.id)) { S.frMsg = `${c.name} の陣に見舞を置いた。返礼は後日であろう`; SFX.pick(); }
        draw(); return;
      }
      palDo(() => palGift({ id: c.id }), r => {
        /* 置けた／もう置いてあった（409）のどちらでも、今日は灰色にする */
        if (r.ok || r.status === 409) { frState(c.id).gift = today(); savePlayer(); }
        S.frMsg = r.ok ? `${c.name} の陣に見舞を置いた。返礼は後日であろう`
                       : r.status === 409 ? '' : '置けなかった';
        SFX.pick();
      });
    });
    if (gave) gb.disabled = true;
    acts.push(gb);
    /* 「外す」の釦はここに置かない（2026-10-06・悠さんの指図）。
       釦が四つ並ぶと名が潰れるうえ、いちばん押してほしくないものが
       いちばん押しやすい所にあった。
       左へなぞったときだけ「削除」が出る形に変えた（下の frDelEl） */
  }
  const row = el('div', { class: 'frrow real' + (kind === 'pal' ? ' swipe' : '') },
    el('div', { class: 'frslide' },
      /* 顔を押すと、その人が主役に据えている武将の札が開く（2026-10-08・悠さんの指図）。
         強さが分かるので、願いを出すかどうかの目安になる。
         friend でも find でも同じ ── どちらが人かで手ざわりを変えない */
      /* 額は相手の称号のもの（2026-10-09）。第三引数を渡し忘れていたせいで、
         本物の友の顔にだけ一生 額が付かなかった。称号が無い人は素の丸のまま */
      el('button', { class: 'frfaceb', title: `${c.name} の主役を見る`,
        onclick: e => { e.stopPropagation(); frPeek(c); } }, frFace(c.face, null, c.title)),
      el('span', { class: 'frn' },
        /* 留守の印は 名の右（2026-10-06）。
           位と主番号の行に足すと、主番号のほうが先に切れて読めなくなった（実測） */
        /* 2026-10-08（悠さんの指図）：**陣が預かってあるときだけ**「留守」と書く。
           一騎も持っていない人には陣そのものが無く、攻めようがない。
           それでも「留守」と出すと、釦は果たし合いなのに相手は居ない、という嘘になる。
           釦の判定（c.away && c.team）とここをそろえた */
        el('b', {}, el('span', { class: 'frnm' }, c.name),
          kind === 'pal' && c.away && c.team ? el('em', { class: 'frawy' }, '留守') : null),
        el('i', {}, `位 ${num(c.lv || 1)}　${c.tag || ''}`)),
      el('span', { class: 'frr' }, ...acts)),
    kind === 'pal' ? frDelEl() : null);
  if (kind === 'pal') frSwipe(row, c);
  return row;
}

/* 左へなぞると出てくる「削除」（2026-10-06・悠さんの指図）。
   ふだんは行の外（右側）に隠れていて、なぞったぶんだけ姿を見せる。
   言い方も「外す」ではなく「削除」にそろえた */
function frDelEl() {
  return el('button', { class: 'frdel' }, '削除');
}
/* 行をなぞる手当て。開くのは一つだけ（別の行をなぞると前のは閉じる） */
function frCloseRows(except) {
  for (const n of document.querySelectorAll('.frrow.swipe.open')) if (n !== except) n.classList.remove('open');
}
function frSwipe(row, c) {
  let x0 = 0, y0 = 0, moved = false;
  const open = () => { frCloseRows(row); row.classList.add('open'); };
  const shut = () => row.classList.remove('open');
  const start = (x, y) => { x0 = x; y0 = y; moved = false; };
  const move = (x, y) => {
    const dx = x - x0, dy = y - y0;
    if (Math.abs(dy) > Math.abs(dx)) return;        // 縦に巻いているときは何もしない
    if (dx < -26) { open(); moved = true; }
    else if (dx > 26) { shut(); moved = true; }
  };
  row.addEventListener('touchstart', e => start(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
  row.addEventListener('touchmove', e => move(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
  /* 指のない端末（確かめ用）でも動くように、押しながらの動きも見る */
  row.addEventListener('pointerdown', e => { if (e.pointerType !== 'touch') start(e.clientX, e.clientY); });
  row.addEventListener('pointermove', e => { if (e.pointerType !== 'touch' && e.buttons) move(e.clientX, e.clientY); });
  /* 削除を押したとき。国の主は手元から、本物はサーバーから外す */
  const del = row.querySelector('.frdel');
  if (del) del.addEventListener('click', e => {
    e.stopPropagation();
    if (c.npc) {
      P.palNpc = (P.palNpc || []).filter(x => x !== c.id);
      savePlayer(); S.frMsg = `${c.name} を削除した`; SFX.pick(); draw(); return;
    }
    palDo(() => palBye({ id: c.id }), () => { S.frMsg = `${c.name} を削除した`; SFX.pick(); });
  });
}

/* 受けた誘いの印（2026-10-06）。
   サーバーの誘いは10分 残るので、受けたあとも「誘っている」と出つづけてしまう。
   受けた印を手元に持って、その行を畳む */
const PAL_TOOK = new Set();
const palTakeInvite = (iv) => {
  if (iv && iv.id) PAL_TOOK.add(iv.id);
  S.fr = false; S.frId = null; S.screen = 'home';
  dlEnter(iv.code, 0); SFX.win();
};
const palInvites = () => PAL.invites.filter(x => !PAL_TOOK.has(x.id));
/* その人から届いている誘い。あれば新しく座は立てない */
const palInviteFrom = (id) => palInvites().find(x => x.from && x.from === id) || null;

/* 果たし合いに誘う。先に座を立て、その合言葉を相手の机に置く */
function palInvite(c) {
  if (frBusyNow()) { S.frMsg = 'いま別の返事を待っておる。少し待たれよ'; SFX.pick(); draw(); return; }
  /* 押す直前に相手の誘いが届いていたら、そちらへ入る（2026-10-06）。
     画面を描き直す間に行き違うことがあるので、ここでももう一度見る */
  const iv0 = palInviteFrom(c.id);
  if (iv0) { palTakeInvite(iv0); return; }
  frBusySet(true); S.frMsg = `${c.name} を誘っています…`; draw();
  (async () => {
    try {
      const r = await duelOpen(dlTeam());
      if (!r || !r.ok || !r.duel) { frBusySet(false); S.frMsg = '座を立てられなかった'; draw(); return; }
      const r2 = await palDuel({ id: c.id }, r.duel);
      frBusySet(false);
      if (!r2 || !r2.ok) { S.frMsg = '誘いを出せなかった'; draw(); return; }
      /* 自分はその座で待つ。相手が気づいて入ってくるのを待ち合いの間で待つ */
      S.fr = false; S.frId = null; S.screen = 'home';
      dlEnter(r.duel, r.seed);
      S.frMsg = '';
      SFX.win(); draw();
    } catch (_) { frBusySet(false); S.frMsg = '繋がらなかった'; draw(); }
  })();
}

/* ---- 留守の陣（2026-10-06・悠さんの指図）----
   友が居ないときは、預けてある **置き部隊** と戦う。
   置き部隊は「部隊編成でいま選んでいる部隊」そのまま。
   相手が受けるのを待たなくてよいので、一人で遊んでいる時間が死なない。

   盤・陣立て・並びは ぜんぶ相手のものを借りる。こちらの都合で変えない。
   同じ陣には一日一度しか入れない（稽古と同じ勘定）。
   戦ったあと、相手の机に置き手紙を残す ── 相手は次に城を開いたとき、
   誰に攻められ、陣が守り切ったかを知る。そこが置き部隊の値打ち。 */
/* ---- 友の主役を覗く（2026-10-08・悠さんの指図）----
   顔を押すと、その人がいま主役に据えている武将の札を、**その人の育ちで**出す。
   願いを出す前に強さが分かるので、結ぶかどうかの目安になる。

   預かっているのは「育ち終わった五つの数」だけ。相手の lv も振った魂も分からないので、
   札には数だけ重ね、**特技の位は書かない**（S.detailSt.abs の道）。
   2026-10-07 の留守の陣と同じで、**黙って帰る道は作らない**。どの枝でも一言は出す */
/* 友の部隊（2026-10-10）。五枚の札を並べ、押すと育った数で札を開く。
   札を閉じるとこの並びに戻る（S.frSquad は札を開いても消さない） */
function frSquadSheet() {
  const sq = S.frSquad;
  if (!sq) return null;
  const back = () => { S.frSquad = null; SFX.pick(); draw(); };
  const peek = m => {
    S.detail = m.no; S.side = null; S.detailRO = true; S.detailBase = false;
    S.detailMod = null; S.detailBuy = null;
    S.detailSt = m.stats ? { abs: m.stats } : null;
    SFX.pick(); draw();
  };
  return el('div', { class: 'sheet', onclick: e => { if (e.target.classList.contains('sheet')) back(); } },
    el('div', { class: 'card2 frbox frsq' },
      el('b', { class: 'frhd' }, `${sq.name} の部隊`),
      /* 札ではなく立ち絵で並べる（2026-10-10・悠さんの指図「ここもキャラの立ち絵にしよう」）。
         総大将を上に大きく、そのうしろに相手の名乗っている称号の背景を敷く。
         残りの四騎は下に並べる。押せば育った数で札が開くのは前と同じ。
         立ち絵（コマ絵）が無い子は札の絵に落ちる */
      (() => {
        const fig = (m, big) => {
          const ch = charOf(m.no);
          const pw = pawnUrl(m.no);
          const bg = big && sq.title ? fxUrl('tbg_' + sq.title) : null;
          return el('button', { class: 'frsqf' + (big ? ' big' : ''), title: ch.name, onclick: () => peek(m) },
            bg ? keepImg({ class: 'frsqbg', src: bg, alt: '' }) : null,
            pw ? keepImg({ class: 'frsqpw', src: pw, alt: ch.name })
               : cardArt(ch) ? keepImg({ class: 'frsqcd', src: cardArt(ch), alt: ch.name, loading: 'lazy' })
               : el('i', { class: 'frsqch', style: chipStyle(ch) }, el('b', {}, (ch.name || '')[0] || '')),
            big ? genMark() : null,
            el('span', { class: 'frsqn' }, ch.name));
        };
        const gen = sq.mem.find(m => m.no === sq.gen) || sq.mem[0];
        const rest = sq.mem.filter(m => m !== gen);
        return el('div', { class: 'frsqwrap' },
          fig(gen, true),
          el('div', { class: 'frsqrow' }, rest.map(m => fig(m, false))));
      })(),
      el('p', { class: 'frnote' }, '押すと、育った姿が見られる'),
      closeX(back, 'もどる')));
}
function frPeek(c) {
  const open = (no, abs) => {
    const ch = charOf(no);
    if (!ch) { S.frMsg = `${c.name} の主役が引けなかった`; SFX.pick(); draw(); return; }
    S.detail = ch.no; S.side = null; S.detailRO = true; S.detailBase = false;
    S.detailMod = null; S.detailBuy = null;
    S.detailSt = abs ? { abs } : null;
    SFX.pick(); draw();
  };
  /* 顔を押したら **部隊ごと** 見せる（2026-10-10・悠さんの指図
     「総大将のキャラカードしか見れないので、選択している1部隊見れる様にして、
       その部隊のキャラを押したら、各キャラの育成後カードが見れる様にして」）。
     並べた札を押すと、その子の育った数で札が開く（frSquadSheet）。
     国の主も本物も同じ見せ方 ── どちらが人か分からないように */
  const squad = (mem, genNo) => {
    const list = (mem || []).filter(m => m && charOf(m.no));
    if (!list.length) return false;
    const g = genNo != null ? genNo : list[0].no;
    list.sort((a, b) => (b.no === g) - (a.no === g));   // 総大将を先頭に
    S.frSquad = { name: c.name, gen: g, title: c.title || '', mem: list.map(m => ({ no: m.no, stats: m.stats || null })) };
    SFX.pick(); draw();
    return true;
  };
  if (c.npc) {
    const fr = npcFriendOf(c.id);
    const gen = fr && (fr.team || [])[0];
    if (!gen) { S.frMsg = `${c.name} の主役が引けなかった`; SFX.pick(); draw(); return; }
    if (!squad(fr.team, gen.no)) open(gen.no, gen.stats || null);
    return;
  }
  /* 本物の主。陣を預かっていれば、その総大将を覗ける */
  if (frBusyNow()) { S.frMsg = 'いま別の返事を待っておる。少し待たれよ'; SFX.pick(); draw(); return; }
  if (c.face == null) { S.frMsg = `${c.name} はまだ主役を立てておらぬ`; SFX.pick(); draw(); return; }
  frBusySet(true); S.frMsg = `${c.name} の主役をうかがっています…`; draw();
  let done = false;
  const giveUp = setTimeout(() => {
    if (done) return;
    done = true; frBusySet(false);
    /* 返事が来なくても、素の札だけは開く。押して何も起きないのがいちばん悪い */
    S.frMsg = '育ちは分からなかった。素の札を出す';
    open(c.face, null);
  }, 12000);
  (async () => {
    try {
      const r = await palTeam(c.id);
      if (done) return;
      done = true; clearTimeout(giveUp); frBusySet(false);
      const mem = ((r && r.team && r.team.members) || []);
      const no = (r && r.team && r.team.generalNo) != null ? r.team.generalNo : c.face;
      S.frMsg = '';
      if (squad(mem, no)) return;
      const m = mem.find(x => x && x.no === no) || mem[0] || null;
      S.frMsg = m ? '' : '育ちは分からなかった。素の札を出す';
      open(m ? m.no : c.face, (m && m.stats) || null);
    } catch (e) {
      if (done) return;
      done = true; clearTimeout(giveUp); frBusySet(false);
      S.frMsg = '繋がらなかった。素の札を出す';
      open(c.face, null);
    }
  })();
}
/* 留守の陣（2026-10-06）。
   2026-10-07：**押しても何も出ない**という報せを受けて、
   黙って帰る道を全部ふさいだ（悠さんの実測）。どの枝でも必ず一言は出す。
   ・国の主の陣が引けない → 言う（前は黙って return していた）
   ・ほかの返事を待っている → 言う（前は黙って return していた）
   ・返事が来ないときは 20秒で諦める（frBusy が立ちっぱなしだと以後ずっと黙る）
   ・置き部隊の中身が壊れていたら、盤を立てる前に止める
     （番号だけの並びを engine に渡すと、戦の画面が真っ白になる） */
/* 留守の陣も 一騎打ち／総力戦 をえらべる（2026-10-10・悠さんの指図
   「留守の陣でも、一騎打ちと総力戦選べた方がいいね！」）。
   まず稽古と同じ札（sparAskSheet）を出し、えらんだら awayRun で陣へ入る。
   本物の友は npcFriendOf では引けないので、相手の行（c）ごと S.spAway に持たせる */
function awayGo(c) {
  S.spAsk = c.id; S.spAway = c; SFX.pick(); draw();
}
function awayRun(c, duel) {
  if (c.npc) {
    /* 国の主の留守。盤はこれまでの稽古とおなじものを使う（国主戦の顔ぶれ）。
       2026-10-09：番付で知り合った相手も同じ道を通す（国を持たないので盤は番付のもの） */
    const fr = npcFriendOf(c.id);
    if (!fr || !(fr.team || []).length) {
      S.frMsg = `${c.name} の陣が引けなかった`; SFX.pick(); draw(); return;
    }
    S.fr = false; S.frId = null; S.frMsg = '';
    if (fr.rk) startBattle(null, null, null, { npc: fr.rk, friendly: true, away: true, duel: !!duel });
    else startBattle(null, null, { id: c.id, pref: fr.pref, duel: !!duel, away: true });
    return;
  }
  if (frBusyNow()) { S.frMsg = 'いま別の返事を待っておる。少し待たれよ'; SFX.pick(); draw(); return; }
  frBusySet(true); S.frMsg = `${c.name} の陣をうかがっています…`; draw();
  let done = false;
  const giveUp = setTimeout(() => {
    if (done) return;
    done = true; frBusySet(false); S.frMsg = '返事が来なかった。少しして試されよ'; draw();
  }, 20000);
  (async () => {
    try {
      const r = await palTeam(c.id);
      if (done) return;
      done = true; clearTimeout(giveUp);
      frBusySet(false);
      if (!r || !r.ok || !r.team || !(r.team.members || []).length) {
        S.frMsg = (r && r.status === 404) ? 'まだ陣が組まれていない' : '陣をうかがえなかった';
        draw(); return;
      }
      /* 置き部隊の中身を検める（2026-10-07）。
         預かったものが古い形（番号だけ）だと engine が読めず、戦の画面が真っ白になる */
      const bad = (r.team.members || []).some(m => !m || typeof m !== 'object' || !m.stats);
      if (bad) { S.frMsg = `${c.name} の陣が古い形で預かられておる（相手が開き直せば直る）`; draw(); return; }
      /* うかがっているあいだに戻っていたら、攻めずに引く（2026-10-06）。
         居る相手の置き部隊を叩けるようにすると、生身の読み合いを誰もしなくなる */
      if (!r.away) {
        S.frMsg = `${c.name} は陣に戻っておる。果たし合いを申し込める`;
        PAL_AT = 0; palTick(true); draw(); return;
      }
      S.fr = false; S.frId = null; S.frMsg = '';
      try {
        startBattle(null, null, null, null, null, { id: c.id, name: c.name, team: r.team, duel: !!duel });
      } catch (e) {
        /* 盤が立たなかったら、真っ白のまま置き去りにしない（2026-10-07） */
        S.screen = 'home'; S.fr = true; S.frId = null;
        S.frMsg = '陣が立たなかった：' + String((e && e.message) || e).slice(0, 60);
        draw();
      }
    } catch (e) {
      if (done) return;
      done = true; clearTimeout(giveUp);
      frBusySet(false);
      S.frMsg = '繋がらなかった：' + String((e && e.message) || e).slice(0, 60);
      draw();
    }
  })();
}

/* 「友を探す」に並ぶぶんだけを組む（2026-10-06）。
   さがす一行から、ここだけを入れ替える。入れ物ごと作り直さないので、
   かな漢字の変換が途中で消えない。

   2026-10-08（悠さんの指図）：**探す場から「見せてもらう場」に変えた。**
   番号を知らない相手は探しようがないので、まだ結んでいない主を
   こちらから **混ぜて八人ずつ** 差し出す。顔を見て、強そうなら願いを出す。
   「ほかの主を見る」でいつでも顔ぶれが入れ替わる。
   さがす一行は残してある（番号を聞いた相手を名指しで呼べるように）。

   本物と国の主は **混ぜて並べる**。どちらが人か分からないほうがよい、の決まり通り。
   並びは種で決まるので、描き直しのたびに入れ替わったりはしない */
const FR_PICK = 8;
let FR_SEED = (Date.now() >>> 0);
const frShuffle = () => { FR_SEED = (Math.imul(FR_SEED ^ 0x9e3779b9, 2654435761) >>> 0) || 1; };
function frFindEl() {
  const npcIds = npcPalIds();
  const askIds = new Set(npcAsks());
  const npcFind = PREFS.filter(x => !npcIds.has(x.id) && !askIds.has(x.id)
                                 && x.id !== (P.camp.start || 'aichi')).map(npcCard);
  const q = (S.frQ || '').trim();
  const QU = q.toUpperCase();
  const all = [...PAL_FIND, ...npcFind];
  /* 名や番号を打ったときは、探し場として振る舞う（これまでどおり） */
  if (q) {
    const find = all.filter(c => String(c.name).includes(q) || (c.tag || '').includes(QU)).slice(0, 60);
    return find.length ? find.map(c => palRow(c, 'find'))
                       : [el('p', { class: 'frnote' }, 'その字で見つかる主はおらぬわん')];
  }
  if (!all.length) return [el('p', { class: 'frnote' }, 'いまは結べる主がおらぬわん')];
  /* 打っていないときは、種から決まる並びで八人だけ差し出す。
     種は「ほかの主を見る」を押したときだけ動くので、描き直しでは揺れない */
  let h = FR_SEED >>> 0;
  const rnd = () => { h = Math.imul(h ^ (h >>> 15), 0x2545f491) >>> 0; return h / 4294967296; };
  const pool = all.slice();
  const pick = [];
  while (pick.length < FR_PICK && pool.length) pick.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
  return [
    ...pick.map(c => palRow(c, 'find')),
    el('button', { class: 'ghost wide frmore',
      onclick: () => { frShuffle(); palTick(true); SFX.pick(); draw(); } }, 'ほかの主を見る'),
  ];
}

function frSheet() {
  const close = () => { S.fr = false; S.frMsg = ''; draw(); };
  palTick();
  npcAskTick();
  rkAskTick();        // 番付で出した願いも、ここで受けてもらう（2026-10-09）
  npcBackTick();
  const my = S.frTab !== 'find';
  const t = frTotal();
  const askIds = new Set(npcAsks());
  /* 国の主も本物と同じ形にそろえる（2026-10-06） */
  const npcMine = npcPals().map(npcCard);
  const npcSent = PREFS.filter(x => askIds.has(x.id)).map(npcCard);
  /* 番付で知り合った相手も、まったく同じ形で並べる（2026-10-09） */
  const rkMine = rkPals().map(rkFriendCard);
  const rkSent = rkAsks().map(id => ((P.palRkAsk || {})[id] || {}).x).filter(Boolean).map(rkFriendCard);
  /* 「友を探す」の並びは frFindEl が組む（2026-10-06）。ここでは作らない */
  const asks = PAL.asks;
  const askN = asks.length;
  /* マイフレンドの並び（2026-10-06・悠さんの指図）。
     本物のプレイヤーが先、そのあと国の主。
     本物どうしは「最後にゲームを開いた刻」の新しい順 ── いま遊んでいる人が上に来る。
     果たし合いを申し込むなら、さっきまで居た人のほうが受けてもらえる */
  const mine = [...[...PAL.pals].sort((x, y) => (y.seen || 0) - (x.seen || 0)), ...npcMine, ...rkMine];
  const sent = [...PAL.sent, ...npcSent, ...rkSent];
  if (!my) softSet('frbody', frFindEl);   // さがす一行から入れ替える場所（2026-10-06）
  return el('div', { class: 'sheet', onclick: e => { if (e.target.classList.contains('sheet')) close(); } },
    el('div', { class: 'card2 frbox' },
      el('b', { class: 'mittl frttl' }, '友'),
      el('div', { class: 'frtabs' },
        el('button', { class: 'frtab' + (my ? ' on' : ''),
          onclick: () => { S.frTab = 'my'; S.frQ = ''; S.frMsg = ''; SFX.pick(); draw(); } },
          'マイフレンド', askN ? el('em', { class: 'frbadge' }, num(askN)) : null),
        el('button', { class: 'frtab' + (my ? '' : ' on'),
          onclick: () => { S.frTab = 'find'; S.frQ = ''; S.frMsg = ''; SFX.pick(); palTick(true); draw(); } },
          '友を探す')),
      /* 自分の主番号とさがす一行は「友を探す」の側だけに置く（2026-10-06・悠さんの指図）。
         マイフレンドは自分の友を見る場で、番号を見せる相手も探す相手も居ない。
         札の上が空くぶん、友の顔が先に目に入る */
      !my && P.palTag ? el('p', { class: 'frtag' },
        'わたしの主番号　', el('b', {}, P.palTag),
        el('span', {}, 'この番号を伝えると探してもらえる')) : null,
      /* 一言は札の上に貼り付ける（2026-10-07）。
         友が48人も並ぶと、下のほうの釦を押したとき
         上に出た一言が画面の外にあって「何も出ない」ように見えていた */
      S.frMsg ? el('p', { class: 'frmsg stick' }, S.frMsg) : null,
      !my ? searchRow('frqin', S.frQ, (v) => {
        S.frQ = v; clearTimeout(FRQ_T);
        FRQ_T = setTimeout(() => { palTick(true); redraw(); }, 260);
      }, '主番号・名でさがす', 'frq') : null,

      my ? el('div', {},
        /* 届いている果たし合いの誘い */
        palInvites().length ? el('div', {},
          el('b', { class: 'frhd' }, '果たし合いの誘い'),
          el('div', { class: 'frlist' }, palInvites().map(iv =>
            el('div', { class: 'frrow real inv' },
              el('span', { class: 'frn' },
                el('b', {}, `${iv.name} が誘っている`),
                el('i', {}, `合言葉 ${iv.code}`)),
              el('span', { class: 'frr' },
                el('button', { class: 'frbtn go take', ...(frBusyNow() ? { disabled: true } : {}),
                  onclick: () => palTakeInvite(iv) }, '受けて立つ')))))) : null,
        askN ? el('div', {},
          el('b', { class: 'frhd' }, `友の願いが ${num(askN)} 件`),
          el('div', { class: 'frlist' }, asks.map(c => palRow(c, 'ask')))) : null,
        sent.length ? el('div', {},
          el('b', { class: 'frhd' }, '出した願い'),
          el('div', { class: 'frlist' }, sent.map(c => palRow(c, 'sent')))) : null,
        el('b', { class: 'frhd' }, `マイフレンド　${num(mine.length)} / ${num(PAL_MAX_UI)}`),
        el('p', { class: 'frnote' }, `通算 ${t.win} 勝 ${t.lose} 敗`),
        mine.length
          ? el('div', { class: 'frlist' }, mine.map(c => palRow(c, 'pal')))
          : el('p', { class: 'frnote' }, 'まだ友はおらぬわん。「友を探す」から願いを出すわん'))

        : el('div', {},
          el('b', { class: 'frhd' }, '友を探す'),
          el('p', { class: 'frnote' }, 'まだ結んでいない主たち。顔を押すと主役の札が見られる'),
          el('div', { class: 'frlist', id: 'frbody' }, ...frFindEl())),
      closeX(close)));
}
let FRQ_T = null;
const PAL_MAX_UI = 100;


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
        el('button', { class: 'frc' + (i === 0 ? ' gen' : ''), title: c.name, onclick: () => openCard(c, true, true) },
          cardArt(c) ? keepImg({ class: 'cf', src: cardArt(c), alt: c.name, loading: 'lazy' })
                     : el('i', { style: chipStyle(c) }, el('b', {}, (c.name || '')[0] || '')),
          i === 0 ? genMark() : null))),
      got ? el('p', { class: 'frmsg good' }, `返礼が届いておるわん　${giftWords(got)}`) : null,
      S.frMsg ? el('p', { class: 'frmsg' }, S.frMsg) : null,
      el('div', { class: 'frbtns' },
        /* 何度でも申し込める（2026-10-10）。前はその日一度で CLEAR になっていた */
        el('button', { class: 'go', onclick: () => sparStart(id) }, '稽古を申し込む'),
        el('button', { class: 'ghost' + (f.gift === today() ? ' soon' : ''), disabled: f.gift === today() ? true : null,
          onclick: () => { if (frGift(id)) { S.frMsg = '見舞いを置いてきたわん。返礼は後日であろう'; SFX.pick(); draw(); } } },
          f.gift === today() ? 'CLEAR' : '陣中見舞')),
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
        !P.camp.intro ? sagaSheet() : campStorySheet()),
      nav: true,
    };
  }
  return {
    body: el('div', {},
      el('div', { class: 'cmrow' },
        el('div', { class: 'unibar' }, el('b', {}, `制覇 ${takenCount()} / ${PREFS.length}`)),
        campModeRow()),
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
      !P.camp.intro ? sagaSheet() : campStorySheet()),
    nav: true,
  };
}
/* ---- 道の切り替え（2026-10-10・悠さんの指図）----
   「切り替えやれる様にして」「制覇しないと次のモードは選択できない」。
   制覇の数のとなりに 並・修羅・魔王 の三つ。まだ開いていない道は「？」で押せない
   （章のタブと同じ見せ方。名を先に見せないほうが、開いたときに効く） */
function campModeRow() {
  const cur = campLv();
  return el('div', { class: 'cmodes' }, CAMP_MODE.map((m, lv) => {
    const ok = campLvOpen(lv);
    return el('button', {
      class: 'cmode m' + lv + (lv === cur ? ' on' : '') + (ok ? '' : ' locked'),
      disabled: ok ? null : true,
      title: ok ? m.name : 'まだ歩めぬ道',
      onclick: () => {
        if (lv === cur || !setCampLv(lv)) return;
        S.region = null; S.pref = null; SFX.pick(); draw();
      },
    }, ok ? m.short : '？');
  }));
}
/* ---- 道を制したときの語り（2026-10-10）----
   「ノーマルをクリアしたら、ストーリーが流れてハードモードに切り替わる」。
   その道を制していて、次の幕をまだ語っていなければ出す。
   advancePref の中ではなく地図を開いたときに出すので、
   制覇の札・天下統一の札を見終えてから流れる。前から並を制していた人にも一度出る。
   幕3は魔王を制したあとの終幕で、道は切り替えない */
const CAMP_STORY = {
  1: { ttl: '修羅の道', go: '修羅の道へ', lines: [
    '天下は一つになった。……誰もが、そう思っていた。',
    '討ったはずの国主たちが、ふたたび旗を掲げている。',
    'その目は赤く、牙は前より鋭い。',
    '「一度きりの天下など、まぼろしにすぎぬ」',
    '修羅の道が、ひらかれたわん。'] },
  2: { ttl: '魔王の道', go: '魔王の道へ', lines: [
    '修羅を越えた先に、夜が来た。',
    '四十七の城に、黒い炎がともる。',
    '炎の奥で、何者かが笑っている。第六天の魔王を名のる者が。',
    '「天下が欲しくば、この夜ごと奪ってみよ」',
    '魔王の道が、ひらかれたわん。'] },
  3: { ttl: '夜明け', go: '天下を見わたす', lines: [
    '黒い炎は消え、四十七の城に朝が来た。',
    '並の道も、修羅も、魔王も。ぜんぶ、その足で越えてきた。',
    'もう、この天下に敵はおらぬ。',
    '……と言いたいところだが、犬はまた走りたくなる生きものわん。'] },
};
function campStoryNext() {
  const saw = P.camp.saw || [];
  for (const k of [1, 2, 3]) if (!saw.includes(k) && campBox(k - 1).clear) return k;
  return 0;
}
function campStorySheet() {
  const k = campStoryNext();
  if (!k) return null;
  const st = CAMP_STORY[k];
  const close = () => {
    P.camp.saw = [...(P.camp.saw || []), k];
    if (k <= 2) { P.camp.lv = k; S.region = null; S.pref = null; }
    savePlayer(); SFX.pick(); draw();
  };
  const no = talkerNo('saga');
  const art = faceUrl(no, '凛々しい') || faceUrl(no, '通常') || pawnUrl(no);
  return el('div', { class: 'sheet sagash cmstory m' + Math.min(k, 2) },
    el('div', { class: 'card2 sagabox' },
      el('div', { class: 'sagatop' },
        art ? keepImg({ class: 'sagaf', src: art, alt: '' }) : el('i', { class: 'sagaf' }, '犬'),
        el('b', {}, st.ttl)),
      el('div', { class: 'sagain' }, st.lines.map(t => el('p', {}, t))),
      el('button', { class: 'go wide', onclick: close }, st.go)));
}

/* 出陣のページ（2026-09-21）。国を選んだあと、ここで部隊を決めて出す。 */
/* ---- 全国の早送り（2026-10-07・悠さんの指図）----
   一度 制覇した国は、盤面を出さずに決着だけ見られる。
   お祭りの早送り（evSkip）と同じ作りだが、種は campSeed のまま使う。
   同じ国・同じ段・同じ部隊なら いつも同じ結末になるので、
   「見ないだけで中身は同じ」が保てる。
   兵糧はふつうの出陣と同じだけ払う。石は湧かない（制覇ずみなので noStone） */
function marchSkip(p, step) {
  const seed = campSeed(p.id, step);
  let s2 = seed >>> 0;
  const rng = () => { s2 = (s2 + 0x6D2B79F5) >>> 0; let x = Math.imul(s2 ^ (s2 >>> 15), 1 | s2); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  S.stage = stageOf(p, step);
  S.stageV = (seed >>> 0) % stageVarCount(S.stage);
  S.stageFlip = false;
  const rules = stageRules(S.stage, S.stageV, S.stageFlip);
  const B = campEnemy(p, step, rng);
  const bForm = FORMS[Math.floor(rng() * FORMS.length)];
  const res = runBattle(
    { members: S.picked.map(grownFor), generalNo: S.general, formation: S.form, slots: S.slots },
    { members: B, generalNo: B[0].no, formation: bForm },
    rules, seed, { log: true });
  const won = res.winner === 'A';
  miBump('battle'); miBump('camp'); miBump('skip');   // お役目の数
  BATTLE = { camp: { pref: p, step }, ev: null,
             reward: giveReward(won, rewardMulOf(S.picked), marchFood(p, step), true),
             march: null, skipped: true };
  if (won) BATTLE.march = advancePref(p.id);
  miAfterWin(won);
  S.res = { i: 0, won, reason: res.reason || '早送り', ta: 0, tb: 0, skip: true, stat: battleStat(res) };
  SFX.pick(); draw();
}

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
        class: 'go wide', onclick: () => { S.teamFrom = 'march'; S.screen = 'team'; SFX.pick(); draw(); },
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
          /* 数（0/3）は出さない（2026-10-07・悠さんの指図） */
        }, part ? keepImg({ src: part, alt: '道具' }) : el('i', {}, '具'));
        /* 早送りの釦（2026-10-07・悠さんの指図）。制覇した国にだけ出す。
           2026-10-07 改その一：出陣の釦の下に小さく置いていたら気づかれなかったので、
           **出陣と同じ行の左**へ移した。
           2026-10-07 改その二（悠さんの指図）：丸い釦は見栄えが悪いので、
           **お祭りと同じ『スキップ』の文字釦**にそろえた。丸に合わせる必要はない。
           兵糧はふつうの出陣と同じだけ要る（払わずに回せる道を作らないため） */
        const skipGo = () => {
          const run = () => { if (!spendFood(p, step)) return; marchSkip(p, step); };
          if (!canMarch(p, step)) { S.foodAfter = run; S.foodNeed = food; S.food = true; SFX.pick(); draw(); return; }
          run();
        };
        const skipBtn = taken ? el('button', {
          class: 'ghost sm mchskip', disabled: can ? null : true,
          title: `早送りで決着　兵糧 ${food}`, onclick: skipGo,
        }, 'スキップ') : null;
        if (!art) {
          return el('div', { class: 'marchgo' },
            el('div', { class: 'mgrow' },
              skipBtn,
              el('button', { class: 'go big out', disabled: can ? null : true, onclick: go }, word), pbtn),
            prepTags());
        }
        return el('div', { class: 'marchgo' },
          el('div', { class: 'mgrow' },
            skipBtn,
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
  const canSoul = P.soul > 0 && spUsed(c.no) < spMaxOf(c.no);
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
    /* 育成の画面は「元の数 ＋ 魂」の形で見せる（2026-10-06・悠さんの指図）。
       足したあとの合計は札のほうに出るので、こちらは内訳に徹する。
       左の数は grownStats から魂を引いた、位だけで伸びたぶん */
    el('div', { class: 'sts' + (up ? ' flash' : '') }, SP_STATS.map(k =>
      el('div', {}, statLabel(k), el('b', {}, num(g[k] - (st.sp[k] || 0))),
        el('em', { class: 'up' }, st.sp[k] ? `+${num(st.sp[k])}` : ''))), totRow(g)),
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
        el('p', { class: 'note' }, `つぎの覚醒で、レベルの上限が ${LV_CAP[st.awake + 1] + (st.awake + 1 >= AWAKE_MAX ? trBonus(c.no).lv : 0)} まで開く`),
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
      /* ---- 配置を組み替えた（2026-10-09・悠さんの指図）----
         前は顔の切り抜きを左上に小さく置くだけで、画面の上半分が寂しかった。
         名前を上の中央に、位・属性・レベル・覚醒をその下に。
         立ち絵（コマ絵・全身）を中央より左に大きく立たせ、右に数を並べる。
         金帯（経験のゲージ）は数の真上。線から下は今までどおり。
         ぜんぶ一画面に収める（393×852 で巻かない） */
      el('div', { class: 'card2 growbox gxbox' },
        /* 位と属性の印は名前の左右へ（2026-10-09・悠さんの指図）。
           下の一行に小さく畳んでいたら寂しかったので、名前と同じ背丈に大きくして
           左右へ据えた。'sm' は付けない（付けると小さいほうの見た目になる） */
        el('div', { class: 'gxhead' },
          rarTag(c.rarity, 'gxic'),
          el('b', { class: 'gxname' }, c.name),
          attrTag(c.attr, 'gxic')),
        el('div', { class: 'gxmeta' },
          el('span', {}, `Lv.${st.lv} / ${cap}`),
          el('span', {}, '覚醒 ' + '◆'.repeat(st.awake) + '◇'.repeat(AWAKE_MAX - st.awake))),
        el('div', { class: 'gxmain' },
          growFigure(c),
          el('div', { class: 'gxcol' },
            // 金帯（経験のゲージ）
            el('div', { class: 'expbar' },
              el('i', { style: `width:${Math.min(100, st.exp / need * 100)}%` }),
              el('span', {}, st.lv >= cap ? '限界' : `次まで ${num(need - st.exp)}`)),
            // ステータス
            /* 絵も並べる（2026-09-25）。ここだけ字だけで、ほかの画面と揃っていなかった */
            el('div', { class: 'sts' }, SP_STATS.map(k =>
              /* ＋の欄は振っていなくても空で置く（2026-09-25）。
                 無いと その行だけ数が右へずれて、縦の線がそろわなかった。
                 2026-10-06：左の数から魂を抜き「元の数 ＋ 魂」の形にした（悠さんの指図）。
                 足したあとの合計は札のほうに出る。総合力の行だけは合計のまま */
              el('div', {}, statLabel(k), el('b', {}, num(g[k] - (st.sp[k] || 0))),
                el('em', { class: 'up' }, st.sp[k] ? `+${num(st.sp[k])}` : '')))))),
        /* 総合力は線の下。.sts の中に置かないと 線と金の色が当たらないので包む */
        el('div', { class: 'sts gxtot' }, totRow(g)),
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
    /* 長押しで札がひらく（2026-10-02）。素材えらびと同じ手ざわりにそろえた。
       どの子だったかを確かめるのに、いちいち図鑑まで回らずに済む */
    el('div', { class: 'pickgrid' }, list.map(ch => el('button', {
      class: 'pg',
      title: `${ch.name}（長押しでカード）`,
      ...holdCard(ch),
      onclick: () => { if (heldJust()) return;
                       onPick(ch.no); S.gpop = true; SFX.pick(); draw(); },
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
          title: `${ch.name}（長押しでカード）`,
          ...holdCard(ch),
          onclick: () => { if (heldJust()) return;
                           const fn = S.cpFor; S.cp = false; S.cpFor = null; S.cpMode = null;
                           if (fn) fn(ch.no); SFX.pick(); draw(); },
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
    const room = Math.min(n, P.soul - spDraftTotal(no), spMaxOf(no) - spUsed(no) - spDraftTotal(no));
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
  const room = spMaxOf(c.no) - used - total;
  return el('div', { class: 'sppan' },
    el('p', { class: 'note sphd' },
      `振った ${num(used)}${total ? ` → ${num(used + total)}` : ''} / ${num(spMaxOf(c.no))}　　`
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
          if (n) miBump('soulUp');   // お役目の数（2026-10-02）
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
  const room = Math.min(P.soul - total, spMaxOf(c.no) - spUsed(c.no) - total);
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
  const room = Math.min(P.soul - spDraftTotal(c.no), spMaxOf(c.no) - spUsed(c.no) - spDraftTotal(c.no));
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
  const left = P.soul - total, room = Math.min(left, spMaxOf(c.no) - used - total);
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
  if (hd) hd.textContent = `振った ${num(used)}${total ? ` → ${num(used + total)}` : ''} / ${num(spMaxOf(c.no))}　　`
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
            if (r) miBump('fire', n);   // お役目の数（2026-10-02）
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
    /* 渡せる技が一つも無い子は並べない（2026-10-02）。
       三枠ぜんぶを継承で埋めた武将は、もう渡せるものが残っていない */
    if (!givableOf(o).length) return false;
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
  /* 継いだ技も並べる（2026-10-02）。押せない形で見せておかないと、
     「この子の三枠目はどこへ行った」と探させてしまう */
  const giv = src ? givableOf(src, true).map(g => ({ ...g, from: src.no })) : [];
  if (src && (S.ihg == null || S.ihg >= giv.length || !(giv[S.ihg] || {}).give)) {
    const i0 = giv.findIndex(x => x.give); S.ihg = i0 < 0 ? 0 : i0;
  }
  const g = src ? giv[S.ihg] : null;
  const ok = g ? (!!g.give && canInherit(c, g)) : false;
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
             ただし渡せるのは、その武将がもともと持っていた技だけ（2026-10-02）。
             よそから継いだ技まで渡せると、重ねの多い安い武将に強い◆をいちど継がせ、
             その子の重ねの数だけ同じ◆を配れてしまう。
             渡しても元の武将からは消えない */
          el('h3', {}, `${src.name} の特技（いまの3枠）`),
          el('div', { class: 'sklist' }, giv.map((x, i) => {
            const able = !!x.give && canInherit(c, x);
            return el('button', {
              class: 'skrow' + (i === S.ihg ? ' on' : '') + (able ? '' : ' max')
                + (x.own ? ' ownuniq' : '') + (x.give ? '' : ' borrowed'),
              /* 継いだ技は押せない（2026-10-02）。並べるのは「無くなった」と
                 思わせないためで、えらべるものではない */
              disabled: x.give ? null : true,
              onclick: x.give ? (() => { S.ihg = i; S.ihMsg = ''; SFX.pick(); draw(); }) : null,
            },
              el('div', { class: 'skhd' },
                el('b', {}, x.sk.name),
                el('span', { class: 'sklv' },
                  !x.give ? '継いだ技' : x.own ? '固有◆' : x.uniq ? '継いだ◆' : `Lv.${x.lv}`)),
              el('span', { class: 'skst' },
                !x.give
                  ? 'よそから継いだ技は、さらに渡せない'
                  : x.uniq
                    ? (x.sk.element
                        ? (able ? `${x.sk.element} の武将に継げる` : `${x.sk.element} の武将にしか継げない`)
                        : 'この◆は属性が分からず、いまは渡せない')
                    : `${stars(starOf(x.sk.name))}　素材1つで ${INH_RATE_NORMAL}%`),
              el('span', { class: 'sktx' }, x.sk.text));
          })),
          el('p', { class: 'note' },
            'その武将がもともと持っている特技だけを渡せる。よそから継いだ技は渡せない。'
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
  { key: 'kura', name: '蔵', note: '小判で買える品' },
  /* 石の蔵（2026-10-03）。兵糧を石で戻す品だけを別の棚にした。
     小判の品と同じ棚に並んでいると、どちらの財布から出るのか紛れていた */
  { key: 'stone', name: '石の蔵', note: '石で買う品。兵糧はここで戻す' },
  /* 「具足屋」は外した（2026-10-08・悠さんの指図）。
     覚醒の品を noShop にしたので、売るものが一つも無くなった。
     手に入れ方は お祭り（具足くらべ）・お役目・塔・番付・くじの積み */
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
    : it.trail ? '旅'
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
    coin('stone', '石', '石', stones(), true, CUR_ART.stone),   // 石の蔵を足したので財布にも出す（2026-10-03）
    coin('gun', '功', '軍功', P.gun || 0, true, CUR_ART.gun));
}
/* 買う釦に、その数ぶんの総額を乗せる（2026-10-03）。
   ×1／×10 だけだと「いくら出るのか」を上の値札と暗算することになっていた。
   上に数（×10 や「買う」）、下に通貨の絵と総額。
   cur は 'koban'／'stone'／'gun' */
function buyBtn(cur, total, label, dis, on) {
  return el('button', {
    class: 'go sm buyb', disabled: dis ? true : null, onclick: dis ? null : on,
  }, el('em', {}, label), el('span', { class: 'bprice' }, curIcon(cur), num(total)));
}
function shopBuy(name, price, n, kind) {
  return () => {
    const r = kind === 'deal' ? buyDeal(name) : buyItem(name, n);
    if (r && kind === 'deal') miBump('deal');   // お役目の数（2026-10-02）
    /* 通貨で字を出し分ける（2026-10-02）。兵糧は石で買う */
    const st = !!(ITEMS[name] || {}).stone;
    if (r) { miBump('buy'); SFX.coin();
      S.shopMsg = `${name} を ${r.n} つ手に入れた（${r.cur === 'stone' ? '石' : '小判'} ${num(r.cost)}）`; }
    else { SFX.pick(); S.shopMsg = st ? '石が足りない' : '小判が足りない'; }
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
            done
              ? el('button', { class: 'go sm', disabled: true }, '買った')
              : buyBtn('koban', d.price, '買う', P.koban < d.price,
                  shopBuy(d.name, d.price, 1, 'deal')));
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
            done
              ? el('button', { class: 'go sm', disabled: true }, '交換済')
              : buyBtn('gun', g.price, '換える', poor, () => rkTrade(g)));
        })),
        el('p', { class: 'note' }, '軍功は番付の月末の褒美で手に入るわん')) : null,

      /* 「魂の市」は外した（2026-10-02）。小判で魂がいくらでも買えると、
         重ねを解雇する・取引所で売るという 魂の出どころが要らなくなる。
         伝書と護符も noShop にしたので、特技の蔵は空になって自動で消える。
         2026-10-08（悠さんの指図）：稽古の書も noShop にしたので、稽古の蔵も同じく消える */
      tab === 'kura' ? el('div', {},
        ITEM_KINDS.map(kind => {
          // 石で買う品は「石の蔵」へ移した（2026-10-03）
          const names = Object.keys(ITEMS).filter(k => ITEMS[k].kind === kind && !ITEMS[k].noShop && !ITEMS[k].stone);
          if (!names.length) return null;
          return el('div', {},
            el('h3', { class: 'shoph' },
              kind === '稽古' ? '稽古の蔵' : kind === '兵糧' ? '兵糧蔵'
              : kind === '編成' ? '陣触れの蔵' : kind === '陣中' ? '陣中の蔵' : '特技の蔵'),
            el('div', { class: 'shoplist' }, names.map(name => {
              const it = ITEMS[name];
              /* 石で買う品（兵糧）と小判で買う品が同じ棚に並ぶ（2026-10-02）。
                 値札も「足りているか」も、その品の通貨で出し分ける */
              const st = !!it.stone, cost = st ? it.stone : it.price;
              const have = () => (st ? stones() : P.koban);
              return el('div', { class: 'shoprow' },
                itemIcon(name),
                el('div', { class: 'sitm' },
                  el('b', {}, name, el('span', { class: 'have' }, `持 ${num(item(name))}`)),
                  el('span', { class: 'sd' }, it.desc),
                  el('span', { class: 'sp2' }, st ? `石 ${num(cost)}` : `小判 ${num(cost)}`)),
                el('div', { class: 'sbtns' },
                  buyBtn(st ? 'stone' : 'koban', cost, '×1',
                    have() < cost, shopBuy(name, cost, 1)),
                  buyBtn(st ? 'stone' : 'koban', cost * 10, '×10',
                    have() < cost * 10, shopBuy(name, cost, 10))));
            })));
        })) : null,

      /* 石の蔵（2026-10-03）。石で買う品だけ。
         いちばん上に いまの兵糧と「次の一つまで」を出す。
         どれだけ戻るのかが分からないまま買うのを避けたい */
      tab === 'stone' ? (() => {
        const names = Object.keys(ITEMS).filter(k => ITEMS[k].stone && !ITEMS[k].noShop);
        const w = foodWait();
        return el('div', {},
          el('div', { class: 'foodnow' },
            curIcon('food'),
            el('b', {}, `${num(P.stamina)} / ${num(P.staminaMax)}`),
            el('span', {}, P.stamina > P.staminaMax ? `上限を ${num(P.stamina - P.staminaMax)} 超えておる`
              : P.stamina >= P.staminaMax ? '満ちておる'
              : `次の一つまで ${foodLeftText()}`)),
          el('div', { class: 'shoplist' }, names.map(name => {
            const it = ITEMS[name];
            const cost = it.stone;
            const full = P.stamina >= P.staminaMax;
            return el('div', { class: 'shoprow' },
              itemIcon(name),
              el('div', { class: 'sitm' },
                el('b', {}, name, el('span', { class: 'have' }, `持 ${num(item(name))}`)),
                el('span', { class: 'sd' }, it.desc),
                el('span', { class: 'sp2' }, `石 ${num(cost)}`)),
              el('div', { class: 'sbtns' },
                buyBtn('stone', cost, '×1', stones() < cost, shopBuy(name, cost, 1)),
                buyBtn('stone', cost * 10, '×10', stones() < cost * 10, shopBuy(name, cost, 10))));
          })),
          el('p', { class: 'note' },
            '買った品は袋に入る。使うのは三本線の「道具」から。' +
            '兵糧丸は満ちていても積める。上限を超えているあいだは、時では戻らぬ'));
      })() : null,

      /* 具足屋の棚は外した（2026-10-08）。SHOP_TABS からも消してある */

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
          onclick: () => { S.teamFrom = 'squads'; S.screen = 'team'; draw(); },
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
  /* 段の順（2026-10-01）。育っている子から並ぶ。
     同じ段のときは、下の並べ替えが No. で揃えるので崩れない */
  { k: 'lv',   name: 'レベル', up: false, v: c => charState(c.no).lv },
];
/* 家（所属の勢力）の一覧（2026-10-02）。
   38家もあるので丸い札では並びきらない。一行の引き出し（select）にする。
   並びは人数の多い順 ── 武田・徳川・織田…と、よく探す家が先に来る */
/* 家に入っていない者（浪人・忍者・女人など10体）の呼び名（2026-10-02）。
   家ではないので人数の多い順には混ぜず、引き出しの末尾に置く */
const NOCLAN = '無所属';
let CLANS = null;
const clanList = () => {
  if (CLANS) return CLANS;
  const n = {};
  let bare = 0;
  for (const c of C) { if (c.clan) n[c.clan] = (n[c.clan] || 0) + 1; else bare++; }
  CLANS = Object.keys(n).sort((a, b) => n[b] - n[a] || a.localeCompare(b, 'ja'));
  if (bare) CLANS.push(NOCLAN);
  return CLANS;
};
const pfGet = (ks, k, d) => { const v = ks[k] ? S[ks[k]] : null; return v == null ? d : v; };
const pfSet = (ks, k, v) => { if (ks[k]) S[ks[k]] = v; SFX.pick(); draw(); };
/* 絞込みを当てて、並べ替えて返す */
function pickApply(list, ks, opt) {
  const rar = pfGet(ks, 'rar', 'すべて');
  const att = pfGet(ks, 'att', 'すべて');
  /* 編成中だけに絞る（2026-10-01）。五つの部隊のどれかに入っている武将。
     「いま出している子だけ育てたい」ときに、位も属性も関係なく拾える */
  const sq = !!pfGet(ks, 'sq', false);
  const cl = pfGet(ks, 'clan', 'すべて');     // 家（2026-10-02）
  const out = list.filter(c =>
    (rar === 'すべて' || c.rarity === rar) &&
    (att === 'すべて' || c.attr === att) &&
    (cl === 'すべて' || (cl === NOCLAN ? !c.clan : (c.clan || '') === cl)) &&
    (!sq || inSquad(c.no)));
  const so = DEXSORT.find(x => x.k === pfGet(ks, 'sort', (opt && opt.sort0) || 'rar')) || DEXSORT[0];
  const up = pfGet(ks, 'asc', null) == null ? so.up : !!pfGet(ks, 'asc', null);
  return out.sort((a, b) => { const d = so.v(a) - so.v(b); return (up ? d : -d) || a.no - b.no; });
}
/* 題（位・属性・並び）は出さない（2026-10-01）。
   札そのものを見れば何の段かは分かるし、三段ぶんの題は場所を食っていた */
const pfRow = (kids, extra) =>
  el('div', { class: 'row chapters pfrow' + (extra ? ' ' + extra : '') }, kids);
/* 絞込みの札の並び（位・属性・並び）。図鑑でずっと使っていた三つにそろえた（2026-09-30） */
function pickRows(ks, opt) {
  const rar = pfGet(ks, 'rar', 'すべて');
  const att = pfGet(ks, 'att', 'すべて');
  const so  = DEXSORT.find(x => x.k === pfGet(ks, 'sort', (opt && opt.sort0) || 'rar')) || DEXSORT[0];
  const up  = pfGet(ks, 'asc', null) == null ? so.up : !!pfGet(ks, 'asc', null);
  return [
    pfRow(['すべて', ...RAR].map(r => el('button', {
      class: 'chip' + (rar === r ? ' on' : '') + (r !== 'すべて' && rarUrl(r) ? ' ric' : ''),
      onclick: () => pfSet(ks, 'rar', r),
    }, r === 'すべて' ? 'すべて' : rarTag(r)))),
    pfRow(['すべて', ...ATTRS].map(a => el('button', {
      class: 'chip' + (att === a ? ' on' : '') + (a !== 'すべて' && attrUrl(a) ? ' aic' : ''),
      onclick: () => pfSet(ks, 'att', a),
    }, a === 'すべて' ? 'すべて' : attrTag(a, 'sm'))), 'attrf'),
    /* 並びの段のいちばん右に「編成中」を並べる（2026-10-01）。
       段がひとつ減って、武将の札が一列ぶん早く見えるようになる。
       中身は絞込みなので、色を変えて（緑）並べ替えの札と見分ける */
    /* 家で絞る（2026-10-02）。同じ家の者をそろえて見たい、という話。
       家は38もあるので札ではなく引き出しにした。並べ替えの段の左に置く */
    pfRow([
      el('select', {
        class: 'clansel', title: '家で絞る',
        onchange: e => pfSet(ks, 'clan', e.target.value),
      }, ['すべて', ...clanList()].map(cn => el('option', {
        value: cn, selected: pfGet(ks, 'clan', 'すべて') === cn ? 'selected' : null,
      }, cn === 'すべて' ? '家：すべて' : cn))),
    ], 'clanrow'),
    pfRow([
      ...DEXSORT.map(x => el('button', {
        class: 'chip' + (so.k === x.k ? ' on' : ''),
        title: so.k === x.k ? 'もう一度押すと向きが変わる' : null,
        onclick: () => {
          if (so.k === x.k) S[ks.asc] = !up;
          else { S[ks.sort] = x.k; S[ks.asc] = x.up; }
          SFX.pick(); draw();
        },
      }, x.name, so.k === x.k ? el('i', { class: 'sar' }, up ? '▲' : '▼') : null)),
      el('button', {
        class: 'chip sqf' + (pfGet(ks, 'sq', false) ? ' on' : ''),
        title: '五つの部隊のどれかに入っている武将だけ',
        onclick: () => pfSet(ks, 'sq', !pfGet(ks, 'sq', false)),
      }, '編成中'),
    ]),
  ];
}
const PF_DEX  = { rar: 'filter', att: 'afilter', sort: 'dexSort', asc: 'dexAsc', sq: 'dexSq', clan: 'dexClan' };
const PF_TEAM = { rar: 'filter', att: 'tattr',   sort: 'tsort',   asc: 'tasc',   sq: 'tSq',  clan: 'tClan' };
const PF_GROW = { rar: 'cpRar',  att: 'cpAttr',  sort: 'cpSort',  asc: 'cpAsc',  sq: 'cpSq', clan: 'cpClan' };
/* 図鑑の「育成武将」の棚（2026-10-03）。図鑑の棚とは別の覚えにして、
   行き来しても それぞれの絞込みが残るようにする */
const PF_OWNC = { rar: 'doRar',  att: 'doAttr',  sort: 'doSort',  asc: 'doAsc',  sq: 'doSq', clan: 'doClan' };
/* ---- 特技の一覧（2026-10-02）----
   図鑑は武将の棚だったが、「この技は誰が持っているのか」を探す場が無かった。
   継承の相手をさがすのに、武将を一枚ずつ裏返して回るしかなかったので、
   技のほうから引ける棚を足す。

   並べるのは 固有◆と通常特技だけ。奥義と大将特性は継げないので棚に出さない。
   同じ名の技を何人も持っていることがあるので、技の名でひとまとめにして
   持ち主を並べる（いちばん多いもので17体）。 */
let SKBOOK = null;
function skBook() {
  if (SKBOOK) return SKBOOK;
  const m = new Map();
  const put = (name, text, el2, c, kind) => {
    if (!name) return;
    let o = m.get(name);
    if (!o) { o = { name, text: text || '', attr: el2 || c.attr, kinds: new Set(), who: [] }; m.set(name, o); }
    if (!o.text && text) o.text = text;
    o.kinds.add(kind);
    o.who.push({ no: c.no, name: c.name, kind });
  };
  for (const c of C) {
    const u = c.unique || {};
    if (u.name) put(u.name, u.text, u.element, c, '固有');
    for (const n of (c.normals || [])) put(n.name, n.text, n.element, c, '通常');
  }
  SKBOOK = [...m.values()].sort((a, b) => a.who[0].no - b.who[0].no);
  return SKBOOK;
}
/* その技を、ひとりでも持っている武将を奉公させていれば「見つけた」技 */
const skFound = o => o.who.some(w => owns(w.no));
function skList() {
  const at = S.skAttr || 'すべて';
  const kd = S.skKind || 'すべて';
  return skBook().filter(o =>
    (at === 'すべて' || (o.attr || '共通') === at) &&
    (kd === 'すべて' || o.kinds.has(kd)) &&
    (!S.skMine || skFound(o)));
}
function dexSkills() {
  const list = skList();
  const found = list.filter(skFound).length;
  const chip = (now, val, label, key) => el('button', {
    class: 'chip' + (now === val ? ' on' : ''),
    onclick: () => { S[key] = val; SFX.pick(); draw(); },
  }, label);
  return el('div', {},
    el('div', { class: 'row chapters bagtabs attrf' },
      ['すべて', ...ATTRS, '共通'].map(a =>
        chip(S.skAttr || 'すべて', a, a === 'すべて' || a === '共通' ? a : attrTag(a, 'sm'), 'skAttr'))),
    el('div', { class: 'row chapters bagtabs' }, [
      ...['すべて', '固有', '通常'].map(k => chip(S.skKind || 'すべて', k, k, 'skKind')),
      el('button', {
        class: 'chip sqf' + (S.skMine ? ' on' : ''),
        title: '手持ちの武将が持っている技だけ',
        onclick: () => { S.skMine = !S.skMine; SFX.pick(); draw(); },
      }, '持っている技'),
    ]),
    el('p', { style: 'font-size:11px;color:var(--text3);margin:6px 0 8px' },
      `この絞り込みでは ${found}/${list.length} の技`),
    el('div', { class: 'skbook' }, list.map(o => {
      const got = skFound(o);
      /* まだ誰も奉公していない技は、名も効き目も伏せる（2026-10-02）。
         武将の棚が「未奉公」の裏札を並べるのと同じ考え。
         何種あるかだけは見せて、中身は引いてからの楽しみにする */
      if (!got) return el('div', { class: 'skbr yet' },
        el('div', { class: 'skbh' }, el('b', {}, '未奉公')),
        el('span', { class: 'skbw' }, 'まだ誰も召し抱えていない'));
      const mine = o.who.filter(w => owns(w.no));
      const yet = o.who.length - mine.length;
      return el('div', { class: 'skbr' },
        el('div', { class: 'skbh' },
          attrTag(o.attr, 'sm'),
          el('b', {}, o.name),
          o.kinds.has('固有') ? el('em', { class: 'skbu' }, '固有') : null,
          /* 星は通常特技だけ（2026-10-02）。固有には段が無いので、
             既定の★1が出ると「弱い技」と読まれてしまう */
          o.kinds.has('通常') ? el('span', { class: 'skbs' }, stars(starOf(o.name))) : null),
        el('span', { class: 'skbt' }, o.text),
        el('span', { class: 'skbw' },
          mine.map(w => el('button', {
            class: 'skbn', title: `${w.name} の札を見る`,
            onclick: () => { const c = charOf(w.no); if (c) openCard(c, false, true); },
          }, `No.${w.no}　${w.name}`)),
          yet ? el('i', { class: 'skby' }, `未奉公 ${yet}体`) : null));
    })));
}
function screenDex() {
  /* 位と属性は「かつ」で重ねて当たる。並びは、その絞り込んだ中での順番。
     図鑑だけは 未奉公の札も出す（2026-09-30）。
     「何が残っているか」を見に来る画面なので、まだ見ぬ者が並んでいてよい。
     編成・育成・特技えらびは もとから持っている武将しか並ばない */
  /* 武将の棚と技の棚を、上の二つの札で行き来する（2026-10-02） */
  /* 棚は三つ（2026-10-03）。
     育成武将 … 自分の持っている武将を、育てたままの姿で並べる
     武将を見る … 未奉公もふくめた台帳。札は焼いたまま（素）
     特技を見る … 技のほうから引く棚 */
  const tab = (S.dexTab === 'skill' || S.dexTab === 'own') ? S.dexTab : 'char';
  const tabs = el('div', { class: 'row chapters bagtabs dextabs' },
    [['own', '育成武将'], ['char', '図鑑武将'], ['skill', '特技を見る']].map(([k, nm]) => el('button', {
      class: 'chip' + (tab === k ? ' on' : ''),
      onclick: () => { S.dexTab = k; SFX.pick(); draw(); },
    }, nm)));
  /* ---- 育成武将（2026-10-03）----
     持っている武将だけを、位・覚醒・特技の位まで「いまの姿」で見る棚。
     図鑑（素のまま）と違い、押すと育てたままの札が開く。
     札の右下に段を出して、どこまで育てたかが並べたまま読めるようにした */
  if (tab === 'own') {
    const mine = C.filter(c => hasCard(c.no));
    const sorted = pickApply(mine, PF_OWNC, { sort0: 'lv' });
    const maxLv = mine.filter(c => charState(c.no).lv >= lvCapOf(c.no)).length;
    return {
      body: el('div', {},
        el('h2', {}, `育成武将（${mine.length}体）`,
          el('span', { class: 'sub2' }, `　限界まで育てた者 ${maxLv}体`)),
        tabs,
        pickRows(PF_OWNC, { sort0: 'lv' }),
        el('p', { style: 'font-size:11px;color:var(--text3);margin:6px 0 8px' },
          `この絞り込みでは ${sorted.length}体　／　押すと育てたままの札が開く`),
        !mine.length ? el('button', {
          class: 'notice', onclick: () => { S.screen = 'gachalist'; draw(); },
        }, el('b', {}, '武将がまだおらぬ'), el('span', {}, 'わんこみくじで引いてから育てる')) : null,
        el('div', { class: 'dex' }, sorted.map(c => {
          const st = charState(c.no);
          const card = cardArt(c);
          const cap = lvCapOf(c.no);
          return el('button', {
            class: 'dc' + (card ? ' card art' : ''),
            title: `${c.name}　Lv.${st.lv}`,
            onclick: () => { openCard(c); },      // 素ではなく、育てたままの姿で開く
          },
            card ? cardImg(c) : el('span', { class: 'f', style: chipStyle(c) }),
            el('span', { class: 'lvb' + (st.lv >= cap ? ' cap' : '') },
              el('em', {}, 'Lv.'), String(st.lv)),
            el('span', { class: 'own' + (cntOf(c.no) ? '' : ' zero') }, `×${num(cntOf(c.no))}`),
            card ? null : el('span', { class: 'n' }, c.name.slice(0, 6)),
            card ? null : rarTag(c.rarity, 'sm'));
        }))),
      nav: true,
    };
  }
  if (tab === 'skill') {
    const all = skBook();
    return {
      body: el('div', {},
        el('h2', {}, `特技（${all.filter(skFound).length}/${all.length}）`),
        tabs,
        dexSkills()),
      nav: true,
    };
  }
  const sorted = pickApply(C, PF_DEX, { sort0: 'no' });
  const list = sorted;
  const got = list.filter(c => owns(c.no)).length;
  return {
    body: el('div', {},
      el('h2', {}, `図鑑（${P.own.length}/${C.length}）`,
        el('span', { class: 'sub2' }, `　手持ち ${num(P.own.reduce((a, n) => a + cntOf(n), 0))} 枚`)),
      tabs,
      pickRows(PF_DEX, { sort0: 'no' }),
      el('p', { style: 'font-size:11px;color:var(--text3);margin:6px 0 8px' },
        `この絞り込みでは ${got}/${list.length} 体`),
      el('div', { class: 'dex' }, sorted.map(c => {
        const has = owns(c.no);
        // まだ手に入れていない武将は「未奉公」の共通カード（2026-09-21）
        const card = has ? cardArt(c) : unknownCardUrl('front');
        return el('button', {
          class: 'dc' + (has ? '' : ' no yet') + (card ? ' card art' : ''),
          onclick: () => { openCard(has ? c : UNKNOWN, false, true); },
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
/* 札を閉じる。取引所から開いたときの覚えもここで消す（2026-10-01） */
function closeDetail() {
  S.detail = null; S.side = null; S.detailRO = false; S.detailBase = false; S.detailMod = null;
  S.detailSt = null; S.detailBuy = null; draw();
}
function cardStatOverlay(c, ro, mod) {
  if (!c || c.no == null || c.no === '未奉公') return [];
  const lay = cardLayout(c.no);
  if (!lay || !lay.stat) return [];
  const pc = (v, base) => (v / base * 100).toFixed(3) + '%';
  const fs = v => (v / 864 * 100).toFixed(3) + 'cqw';
  /* 取引所の品は、売り主が育てた値で出す（2026-10-01）。
     持ち物ではないので grownStats は使えない。式は grownStats と同じ */
  const ds = S.detailSt;
  /* abs ＝ 育った値そのもの（2026-10-08）。
     友の主役を覗くときに使う。相手の lv や振った魂は手元に無く、
     預かっているのは「育ち終わった五つの数」だけなので、そのまま出す。
     取引所の品はこれまでどおり lv と魂から組み立てる（ds.lv / ds.sp） */
  const g = (ds && ds.abs) ? ds.abs
    : ds ? (() => {
        const base = c.stats || {}, mul = 1 + ((ds.lv || 1) - 1) * 0.02, o = {};
        for (const s of SP_STATS) o[s] = Math.round((base[s] || 0) * mul) + ((ds.sp || {})[s] || 0);
        return o;
      })()
    : (!ro && P.own.includes(c.no)) ? grownStats(c) : (c.stats || {});   // ro＝素のまま
  const out = lay.stat.map(t => el('b', {
    class: 'clv num',
    style: `left:${pc(t.cx, 864)};top:${pc(t.cy, 1280)};font-size:${fs(t.size)}`,
  }, String(g[t.k] ?? (c.stats || {})[t.k] ?? 0)));   // 札はカンマを打たない
  /* 戦のさなかの一時の増減（2026-10-08・悠さんの指図）。
     数の真下に小さく「+120」「−30」。色はその数値の色（盤のコマの矢印と同じ割り当て）。
     この戦のあいだだけのものなので、ふだんの札には出ない。
     理由（薬か特技か天候か地形か）は書かない。何が起きたかだけ見せて、
     なぜ上がったかは盤を見て察してもらう */
  if (mod) {
    for (const t of lay.stat) {
      const d = mod[t.k];
      if (!d) continue;
      /* 置き場は 数の真下、役割の箱（y=1127）の手前（2026-10-08）。
         数（cy=1086・大きさ35）の底が 1103、箱の上が 1127。
         その 24 の隙に収まるよう、中心 1115・大きさ 21 にしてある */
      out.push(el('b', {
        class: 'clv dlt s-' + t.k,
        style: `left:${pc(t.cx, 864)};top:${pc(t.cy + t.size * 0.83, 1280)};`
             + `font-size:${fs(Math.round(t.size * 0.60))}`,
      }, (d > 0 ? '+' : '−') + Math.abs(d)));
    }
  }
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
  /* 所属の欄を書き直す（2026-10-10・悠さんの指摘「まだ浪人のままやね！」）。
     2026-10-09 に 浪人だった6体を史実の家に移した（characters.json の clan）が、
     札の「所属」は絵に焼き込んであるので「浪人」のまま残っていた。
     焼き直すまでのあいだ、この6体だけ クリームの紙を当てて今の家を書く。
     ほかの子は焼いた字が正しいので触らない（全員に重ねると字の太さが揃わず目立つ） */
  if (CLAN_REBAKE.has(+c.no) && c.clan) {
    const t = CLAN_BOX;
    out.push(
      el('i', { class: 'crolebg',
        style: `left:${pc(t.x, 864)};top:${pc(t.y, 1280)};`
             + `width:${pc(t.w, 864)};height:${pc(t.h, 1280)};background:${t.bg};`
             + `-webkit-mask-image:${t.mask};mask-image:${t.mask}` }),
      el('b', { class: 'clv crole',
        style: `left:${pc(t.x + t.w / 2, 864)};top:${pc(t.y + t.h / 2, 1280)};`
             + `font-size:${fs(t.size)};color:${t.fg}` }, c.clan));
  }
  return out;
}
/* 焼いた札では「浪人」なのに、いまは家に属している子（2026-10-10）。
   豊臣ヒデヨシバ・濃姫・浅井ながワン・加藤キヨマサ犬・直江カネつぐる・ガラシャわん。
   札を焼き直したら、ここから外す */
const CLAN_REBAKE = new Set([30, 31, 47, 64, 67, 68]);
/* 所属のクリームの欄（864×1280 の目盛りで実測・2026-10-10）。
   紙は x 586-819 / y 1154-1193。縁ぎわは金がにじんで黄ばむので、
   真ん中だけ塗り、左右の端は mask でぼかして継ぎ目を消す */
const CLAN_BOX = { x: 598, y: 1155, w: 210, h: 39, fg: '#241e18', size: 29,
  bg: 'linear-gradient(#fbf4e3,#fbf7ea)',
  mask: 'linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent)' };
function cardSheet(c) {
  const un = c.no === '未奉公';
  const fr = un ? unknownCardUrl('front') : cardUrl(c.no, 'front');
  const bk = un ? unknownCardUrl('back') : cardUrl(c.no, 'back');
  const zoom = S.side;
  const close = closeDetail;
  /* 焼いた札には、育てば変わる数（升の数値・特技の位）が入っていない（2026-09-27）。
     いま持っている値をその場で重ねるので、強化しても継承しても札がすぐ追いつく。
     置き場所は札ごとに layout に控えてある。無い札はこれまでどおり焼いた数が出る */
  const live = side => {
    const lay = un ? null : cardLayout(c.no);
    if (!lay) return [];
    const pc = (v, base) => (v / base * 100).toFixed(3) + '%';
    const fs = v => (v / 864 * 100).toFixed(3) + 'cqw';
    const out = [];
    if (side === 'front') out.push(...cardStatOverlay(c, cardRaw(), S.detailMod));
    if (side === 'back' && lay.slot) {
      /* 特技の枠は3つ。焼いてあるのは元の技なので、継承で中身が入れ替わった枠だけ
         和紙で塗りつぶして描き直す（2026-09-27）。
         塗る紙は、字を入れる前に切っておいた同じ札の和紙なので継ぎ目が出ない。
         枠どうしの入れ替えも、枠ごとに「焼いた技名」と今の技名を見くらべるので拾える。
         一の枠（固有◆）に位は無く、空いている枠にも出さない */
      const sl = slotsOf(c);
      const ds2 = S.detailSt;
      /* 位が分からないときは **書かない**（2026-10-08）。
         友の主役を覗くときは、預かっているのが数だけで 特技の位は分からない。
         それを Lv.1/3 と書いてしまうと嘘になる。null なら下で飛ばす */
      const sk = (ds2 && ds2.abs && !ds2.sk) ? null
        : ds2 ? (ds2.sk || [1, 1, 1])
        : (!cardRaw() && P.own.includes(c.no)) ? skillLvOf(c.no) : [1, 1, 1];
      const k = lay.sk, patch = k ? cardPatchUrl(c.no) : null;
      /* 取引所の品は 焼いた技のまま見せる（2026-10-01）。
         継いだ技の中身は手元に無いので、塗り直すと空きになってしまう */
      const mine2 = !ds2 && !cardRaw() && P.own.includes(c.no);
      for (const t of lay.slot) {
        const now = mine2 ? sl[t.slot] : null;
        const nm = now && now.sk ? now.sk.name : null;
        /* 自分の持ち物でないとき（敵の札・図鑑の読むだけ）は塗り直さない（2026-09-30）。
           焼いてある元の技がそのまま正しいのに、
           「いまの技が無い＝空き」とみなして元の技まで消していた。
           合戦中に敵の札を開くと、明智ミツワンの特技が三つとも「空き」になっていたのはこれ */
        const moved = mine2 && patch && t.row != null && nm !== (t.baked || null);
        if (moved) out.push(...redrawSlot(k, patch, t, now, c.no));
        /* 固有（◆）に位は無い（2026-10-05 改）。
           はじめは「枠の中身が固有か」で見ていたが、それだと図鑑など
           持ち物の記録が無いところで 位がまるごと消えてしまった。
           ◆は札に刷ってある字なので、**名に◆が付いていたら出さない**。
           これなら持っていない武将の札でも同じ判定で通る */
        const cur = moved ? now : sl[t.slot];
        const nmNow = (cur && cur.sk && cur.sk.name) || t.baked || '';
        if (sk && t.slot && cur && !nmNow.includes('◆')) out.push(el('b', {
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
  /* 札から育成の三画面へ飛ぶ（2026-10-02 に S.gpop を足した）。
     前は画面だけ替えていたので、着いた先は「武将をえらぶ」一覧だった。
     いま見ている札の子を育てたくて押しているのに、
     その子をもう一度 一覧から探さされていた。
     S.gpop＝その武将の中身をひらいた状態。育成の三画面はこれを見ている */
  const goto = (screen, set) => e => {
    e.stopPropagation();
    set(); S.gpop = true; S.detail = null; S.side = null; S.screen = screen; SFX.pick(); draw();
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
    /* 取引所から開いた札（2026-10-01）。中身を見てそのまま召し抱えられる */
    S.detailBuy ? mkBuyBar(c, S.detailBuy) : null,
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
    if (e.target.classList.contains('sheet')) closeDetail();
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
      S.detailBuy ? mkBuyBar(c, S.detailBuy) : null,
      (!S.detailBuy && P.own.includes(c.no)) ? el('div', { class: 'cardgo flat' },
        el('button', { class: 'go sm', disabled: hasCard(c.no) ? null : true, onclick: () => { S.grow = c.no; S.sp = null; S.gpop = true; S.detail = null; S.screen = 'power'; SFX.pick(); draw(); } }, '武将強化'),
        el('button', { class: 'go sm', disabled: hasCard(c.no) ? null : true, onclick: () => { S.skc = c.no; S.sks = 0; S.skm = []; S.skch = null; S.gpop = true; S.detail = null; S.screen = 'skillup'; SFX.pick(); draw(); } }, '特技強化'),
        el('button', { class: 'go sm', disabled: hasCard(c.no) ? null : true, onclick: () => { S.ihc = c.no; S.ihslot = null; S.ihm = []; S.ihsrc = null; S.gpop = true; S.detail = null; S.screen = 'inherit'; SFX.pick(); draw(); } }, '特技継承'),
        el('button', { class: 'go sm danger', disabled: fireMax(c.no) < 1 ? true : null,
          onclick: () => { S.fire = c.no; S.fireN = 1; draw(); } }, '武将解雇')) : null,
      closeX(closeDetail)));
}

/* いま選んでいるくじ。ガチャ一覧から選ぶまでは先頭（くじの中身は gachas.js） */
/* えらばれていないときは「ふだんのくじ」。並びの先頭ではない（2026-10-04）。
   先頭は そのとき出している祭りのくじなので、えらばずに引くと
   祭りの表から引いてしまう恐れがあった */
const curGacha = () => gachaOf(S.gbanner || homeGacha().id);
/* 一覧の上で喋る人（2026-09-28）。信長わん（No.1）の絵を使う。
   絵が無ければ顔、それも無ければ何も出さない */
/* 顔の絵（256角）を先に見る。英雄の絵は横長なので、ここに出すと細い帯になってしまう */
const talkerUrl = () => faceUrl(1, '笑顔') || faceUrl(1, '通常') || pawnUrl(1) || heroUrl(1);
function screenGachaList() {
  const talk = talkerUrl();
  const sel = S.gbanner ? gachaOf(S.gbanner) : homeGacha();
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
            onclick: () => { S.gbanner = g.id; S.gpick = 0; S.screen = 'gacha'; SFX.pick(); draw(); },
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
/* ---- ピックアップの紹介（2026-10-01）----
   くじの画面を横に払うと、ピックアップの武将を一人ずつ紹介する。
   0枚目＝これまでの幟の画面。1枚目から先が紹介。
   景色は bg/gacha_<くじの印>_<番号>.jpg があればそれに替わり、
   無ければ ふだんの景色を暗くして字を読ませる（絵が無くても動く決まり）。
   引く釦と みくじの帯は どの枚でも出したまま。見ながらそのまま引けるように */
const gachaPicks = () => (curGacha().pick || []).map(charOf).filter(Boolean);
function gachaPickEl() {
  const c = gachaPicks()[(S.gpick || 0) - 1];
  if (!c) return null;
  /* 立ち絵（hero）がいちばん大きく映える。無ければ奥義の一枚絵、顔の順に落ちる */
  /* 大きな立ち姿。いちばんよいのは切り抜きの一枚絵だが、まだ無いので
     app/assets/gacha/pu_<番号>.png を置けばそちらを使う（置くだけで反映）。
     無ければ盤のコマ絵（透過の切り抜き）に落ちる */
  const hero = gachaUrl('pu_' + String(c.no).padStart(3, '0')) || gachaUrl('pu_' + c.no)
            || pawnUrl(c.no) || faceUrl(c.no, '不敵');
  /* 見出しの「奥義」「固有発動」は、カットインと同じ筆文字を小さくして使う（2026-10-01）。
     絵が無ければ、これまでどおり一字の金の丸に落ちる */
  const blk = (art, mark, nm, tx) => el('div', { class: 'gpkb' },
    el('div', { class: 'gpkbh' + (art ? ' art' : '') },
      art ? keepImg({ class: 'gpkw', src: art, alt: mark }) : el('i', {}, mark),
      el('b', {}, clean(nm) || '―')),
    tx ? el('p', {}, tx) : null);
  return el('div', { class: 'gpkwrap' },
    hero ? keepImg({ class: 'gpkhero', src: hero, alt: c.name }) : null,
    el('div', { class: 'gpkinfo' },
      el('div', { class: 'gpktag' }, rarTag(c.rarity, 'big'), attrTag(c.attr)),
      el('b', { class: 'gpkname' }, c.name),
      c.yomi ? el('span', { class: 'gpkyomi' }, c.yomi) : null,
      blk(uiUrl('cut_奥義'), '奥', (c.ultimate || {}).name, (c.ultimate || {}).text),
      blk(uiUrl('cut_固有'), '固', (c.unique || {}).name, (c.unique || {}).text)));
}
/* 何枚目にいるかの粒だけ（2026-10-01）。
   矢印は置かない。ひとりでに送るし、横に払えば動く。
   粒そのものは押せるので、見たい一枚へ飛べる */
function gachaPager() {
  const n = gachaPicks().length; if (!n) return null;
  const i = S.gpick || 0;
  return el('div', { class: 'gpnav' },
    el('div', { class: 'gpdots' }, Array.from({ length: n + 1 }, (_, k) =>
      el('button', { class: 'gpd' + (k === i ? ' on' : ''), title: k ? '紹介' : '幟',
        onclick: () => { S.gpick = k; SFX.pick(); draw(); } }))));
}
/* ひとりでに送る（2026-10-01）。
   2秒ごとに次の一枚へ。最後まで行ったら幟（0枚目）へ戻ってまわり続ける。
   引いている最中・札が開いているあいだは送らない（見せ場のじゃまをしない）。
   draw のたびに数えなおすので、人が払った直後はそこから2秒 */
let GP_T = null;
function gpSchedule() {
  clearTimeout(GP_T);
  GP_T = setTimeout(gpStep, 2000);
}
function gpStep() {
  GP_T = null;
  if (S.screen !== 'gacha') return;                       // くじを離れたら止める
  const busy = S.gbox || S.gboxing || S.rv || S.rvall || S.gacha || S.gopen || S.rates || S.shop;
  const n = gachaPicks().length;
  if (busy || n < 1) { gpSchedule(); return; }             // 見せ場のあいだは数えなおすだけ
  S.gpick = ((S.gpick || 0) + 1) % (n + 1);
  draw();                                                  // draw がまた仕込む
}
/* 横に払って紙をめくる。30px 動いたら「払った」とみなす（札の表裏と同じ作法） */
function gachaSwipe(node) {
  const n = gachaPicks().length; if (!n) return node;
  let sw = null;
  node.addEventListener('pointerdown', e => { sw = { x: e.clientX, y: e.clientY, on: false }; });
  node.addEventListener('pointermove', e => {
    if (!sw || sw.on) return;
    const dx = e.clientX - sw.x, dy = e.clientY - sw.y;
    if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) {
      sw.on = true;
      const k = Math.max(0, Math.min(n, (S.gpick || 0) + (dx < 0 ? 1 : -1)));
      if (k !== (S.gpick || 0)) { S.gpick = k; SFX.pick(); draw(); }
    }
  });
  for (const t of ['pointerup', 'pointercancel', 'pointerleave'])
    node.addEventListener(t, () => { sw = null; });
  return node;
}
function screenGacha() {
  gpSchedule();            // ひとりでに送る数えを、描くたびに仕込み直す（2026-10-01）
  const g = S.gacha;
  /* 祭の札で引けるくじでは、札が先（2026-09-30）。
     持っていれば値札が札に変わり、尽きたら黙って石の値札に戻る */
  const tkt = curGacha().ticket ? item(TICKET) : 0;
  /* 一日ひとたびの ただ引き（2026-10-02）。札よりも石よりも先に見る */
  const oneFree = gFreeOk(curGacha());
  const byOne = !oneFree && tkt >= TICKET_PRICE.single;
  const byTen = tkt >= TICKET_PRICE.ten;
  const canOne = oneFree || byOne || stones() >= PRICE.single;
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
    body: (bgEl => gachaSwipe(el('div', { class: 'gacha' + ' art' + (inBox ? ' takara' : '')
        + (S.rv || S.rvall ? ' bare' : '') + (!showing && S.gpick ? ' onpick' : '') },
      S.rv ? null : bgEl,
      showing ? null : gachaTop(),
      /* ピックアップの紹介（2026-10-01）。幟の枚（0）では出さない */
      showing ? null : gachaPickEl(),
      showing ? null : gachaPager(),
      /* 引くボタン。app/assets/ui/ に pull_one.png / pull_ten.png を置けば
         絵のボタンに切り替わる。値段は絵に焼かず、アプリが下に重ねる（初回無料の出し分けがあるため） */
      showing ? null : pityBar(),
      S.rv ? revealView(S.rv, bgEl)
        : S.rvall ? revealAll(S.rvall)
        : waiting ? gachaBox()
        : el('div', { class: 'pulls' + (uiUrl('pull_one') || uiUrl('pull_ten') ? ' art' : '') },
            pullBtn('one' + (oneFree ? ' free' : ''), '一度引く',
              oneFree ? '1回無料'
                : byOne ? tktPrice(TICKET_PRICE.single) : stonePrice(PRICE.single),
              oneFree || canOne, () => doPull(1),
              oneFree ? '1回無料'
                : byOne ? `祭の札 ${TICKET_PRICE.single}枚` : `${num(PRICE.single)} 石`),
            pullBtn('ten' + (P.firstFree ? ' free' : ''), '十連',
              P.firstFree ? '初回無料'
                : byTen ? tktPrice(TICKET_PRICE.ten) : stonePrice(PRICE.ten),
              canTen, () => doPull(10),
              P.firstFree ? '初回無料'
                : byTen ? `祭の札 ${TICKET_PRICE.ten}枚` : `${num(PRICE.ten)} 石`)),
      S.rv || S.rvall ? null : (g ? gachaResult(g) : null),
      S.rates ? ratesSheet(toSSR, toUR) : null,
      S.shop ? shopSheet() : null)))(gachaBgEl(inBox)),
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
  /* 紹介の枚では、その武将の景色（bg/gacha_<印>_<番号>.jpg）に替える（2026-10-01）。
     まだ用意していなければ ふだんの景色のまま（CSS の .onpick が暗く落とす） */
  const pc = gachaPicks()[(S.gpick || 0) - 1];
  const own = (pc && bgUrl('gacha_' + curGacha().id + '_' + String(pc.no).padStart(3, '0')))
            || (pc && bgUrl('gacha_' + curGacha().id + '_' + pc.no))
            || bgUrl('gacha_' + curGacha().id);
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
        /* 戦のやり方（2026-10-03）。盤面の釦だけだと、戦が始まってからでないと
           変えられなかった。ここで先に決めておけるようにする。
           戦のさなかに押したときは、盤面の釦と同じ段取り（toggleAuto）に預ける。
           稽古と番付は必ずオートなので、そのときは触らせない */
        (() => {
          const inWar = !!(BATTLE && BATTLE.res);
          const spar = inWar && (BATTLE.spar || BATTLE.bout || BATTLE.away);
          const now = inWar && !spar ? manualNow() : !!P.manual;
          if (spar) return row('戦のやり方', 'オート（稽古）');
          /* はじめて挑む場は手でしか動かせない（2026-10-07） */
          if (inWar && BATTLE.firstTry) return row('戦のやり方', '手動（はじめての戦）');
          return row('戦のやり方', now ? '手動' : 'オート', () => {
            if (inWar) { S.menu = false; toggleAuto(); draw(); return; }
            P.manual = !P.manual; savePlayer(); SFX.pick(); draw();
          });
        })(),
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
        /* はじめての手引きのやり直し（2026-10-02）。
           手引きの中の「やめる」を押すと、これまでは二度と出てこなかった。
           やめた歩（P.gquit）を覚えてあれば そのつづきから、
           無ければ はじめから。手引きの最中は、語りの中に「やめる」があるので出さない */
        guideOn() ? null : row('はじめての手引き', P.gquit > 0 ? 'つづきから' : 'はじめから', () => {
          P.gstep = P.gquit > 0 ? P.gquit : 1; P.gquit = 0; savePlayer();
          S.menu = false; SFX.pick(); draw();
        }),
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
    '総大将が逃げ出しても負けにはならないが、大将特性は消える。',
    '出陣には兵糧が要る。兵糧は時とともに戻るが、道具でも戻せる。道具で戻したぶんは上限を超えて貯められる。',
  ] },
  { t: 'オートと手動', p: [
    '盤面の右上のボタンで、戦のさなかにいつでも切り替えられる。',
    '戦の前に決めておくなら、三本線の「戦のやり方」で選べる。',
    '合戦の進む速さは、三本線の「合戦の速さ」で変えられる。通常・1.5倍・2倍の三つ。',
    'オートから手動に変えたときは、見せ終わったターンをやり直さないよう次のターンから効く。',
    '選んだ方式は次の戦にも引き継がれる。稽古と番付は必ずオート。',
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
  /* 範囲の読み替え（2026-10-03）。並びではなく隣り合いで数えるようにしたので、
     「正面」が何を指すのかを書いておく。数は書かない */
  { t: '範囲の広がり', p: [
    '正面・一直線・十字・周囲・全体と、技ごとに届く形が違う。',
    '正面と一直線は、まず狙いを定め、そこに隣り合う者へ広がっていく。縦一列に並んでいなくても巻き込める。',
    '広く当たったときほど、与える傷の総量は増える。狙いを絞るか、巻き込むかで値打ちが変わる。',
  ] },
  /* 反撃まわり（2026-10-03）。反撃に反撃は返らない、を はっきり書いておく */
  { t: '反撃と道連れ', p: [
    '反撃は、斬りかかられたときだけ返る。反撃に対して反撃は返らない。',
    '倒れぎわに一度だけ斬り返す者がいる。その一撃は必ず届いてから倒れる。',
    '間合いが届かないところからの一撃には、反撃を返せない。',
  ] },
  { t: 'かばうと癒し', p: [
    'かばう持ちの味方は、総大将への一撃を身代わりに受けることがある。',
    '味方みなをかばう者もいるが、かばえる回数には限りがある。',
    '癒す者は、傷ついた味方を手当てする。誰も傷ついていなければ、その技は温存される。',
    '味方が斬りかかったとき、同じ相手へ追い撃ちをかける者もいる。',
  ] },
  { t: '奥義と固有の技', p: [
    '奥義のゲージは、動いたり傷を受けたりして溜まる。満ちたら、使うまでそれ以上は溜まらない。',
    '固有の技は、戦のはじめ・味方が倒れたとき・瀕死のときなど、武将ごとに決まったときに ひとりでに出る。',
    '見せ場の絵（カットイン）は一度の戦につき一度だけ。二度目からは黙って効く。',
    '継いだ技も、戦ではそのまま使われる。',
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
  /* 天守（2026-10-02 に入れた）。塔の一部の階にだけ立つ */
  { t: '城を落とす戦', p: [
    '盤に天守が立っている戦がある。守り兵をみな倒しても、天守が立っているかぎり決着はつかない。',
    '天守は動かず、斬りかかってもこない。石垣のように、矢や槍の通り道もふさぐ。',
    '接近戦の武将は、天守の正面に開いた参道からしか届かない。間合いの長い武将は、離れたところからでも崩せる。',
    '決着のターンまで落とせなければ、守り切られて負けになる。',
  ] },
  /* 試練の塔（2026-10-01）。階ごとのお題は塔の画面に出るが、
     「ふつうの戦と決まりが違う」ことだけ手引きにも書いておく */
  { t: '試練の塔', p: [
    '階ごとにお題がある。倒されずに勝つ、何ターン以内に勝つ、ひとりで勝つ、など。',
    '持ちこたえるだけでよい階や、味方がみな瀕死から始まる階もある。',
    '同じ階は何度でも挑めるが、褒美を受け取れるのは初めて越えたときだけ。',
  ] },
  { t: '盤面の見かた', p: [
    '盤面の外、上が敵・下が味方。顔の下の数が残りの兵量。',
    '顔の左上の印が総大将。右下に出るものはその武将にかかっている効き。',
    '逃げ出した武将には赤い×が付く。',
    '天守には、下に細い帯で残りの構えが出る。細くなるほど崩れが近い。',
  ] },
];
/* ================= お知らせ（2026-09-24）=================
   記事は news.js に置く。ホームの「報」から開く。
   タグは更新と不具合の2つだけ。ふだんは更新を使い、詫びや取りこぼしは不具合に置く。 */

/* 帯の絵。app/assets/news/<art>.png（1080×300）。無ければ帯は出ない */
const newsUrl = n => {
  if (!n.art) return null;
  /* 2026-10-08：ウェブ版は webp に焼き直すので、両方の尻尾を見る。
     .png だけを見ていたので、ウェブでは記事の帯が一枚も出ていなかった */
  for (const ext of ['.webp', '.png'])
    if ((MANIFEST.news || []).includes(n.art + ext)) return `assets/news/${n.art}${ext}`;
  return null;
};
/* ---- 城に入るたびのお知らせ札（2026-10-08・悠さんの指図）----
   開くたび、まだ知らせたい一枚絵を順に出す。**画面のどこを押しても次へ、最後で消える。**
   「今日は出さない」の釦は置かない（悠さんの指図で、毎回出すことにした）。
   絵が無ければ一枚も出さない ── 「絵が無くても動く」を崩さない。
   押したらその場へ飛ぶ道も付けない。見て、閉じて、遊びに戻るだけ */
/* ================= ログインボーナスの板（2026-10-09・悠さんの指図）=================
   「ログインボードのポップアップ作ったので、この中に報酬アイコン並べて
     取得したら、印鑑を押すみたいにしよか！」

   板は **月ごとに真っ新**（悠さんのえらび）。毎月一日からまた一番の升に戻る。
   休んだ日の升は押せないまま流れる ── 後から取り返せないから、毎日のぞく値打ちが出る。
   二十八日の月は 29〜31 の升が空のまま余る。

   褒美は **城に戻ったその場で配る**（受け取り釦は置かない）。お詫びの品と同じ考えで、
   押し忘れて褒美が宙に浮くのを避ける。「今日は表示しない」を押していても配る。
   朱印は「もう受け取った印」── 悠さんの「印鑑を押すみたいに」。

   升の place は絵（news/login_board.png・1024角）から測った。
   絵を描き直したら、ここも測り直すこと。
     内側の黒い枡 横 93/217/340/463/587/711/834（幅 97）
                  縦 251/379/507/635/762（高さ 95）
   五段目は左から三〜五番目の三つだけ */
/* 節目の日（絵をひと回り大きく出す） */
const LB_BIG = new Set([7, 14, 21, 28, 31]);
const LB_X = [9.08, 21.19, 33.20, 45.21, 57.32, 69.43, 81.45];
const LB_Y = [24.51, 37.01, 49.51, 62.01, 74.41];
const LB_W = 9.47, LB_H = 9.28;
/* 三十一日ぶんの褒美。節目は 7・14・21・28・31。
   日ごとのお役目が石100〜小判200ほどなので、ふだんの升はそれと同じかやや軽く。
   のぞくだけで貰えるぶん、手を動かすお役目より重くしない */
const LB_DAYS = [
  { stone: 100 },                        //  1
  { koban: 500 },                        //  2
  { items: { '稽古の書': 5 } },           //  3
  { items: { '兵糧俵': 1 } },             //  4
  { soul: 50 },                          //  5
  { items: { '道中手形': 10 } },          //  6
  { stone: 300 },                        //  7 節目
  { koban: 800 },                        //  8
  { items: { '特技の伝書': 3 } },         //  9
  { stone: 150 },                        // 10
  { soul: 60 },                          // 11
  { items: { '稽古の書': 8 } },           // 12
  { koban: 1000 },                       // 13
  { ticket: 5 },                         // 14 節目
  { stone: 150 },                        // 15
  { items: { '道中手形': 15 } },          // 16
  { koban: 1200 },                       // 17
  { soul: 80 },                          // 18
  { items: { '特技の伝書': 5 } },         // 19
  { stone: 200 },                        // 20
  { items: { '相伝の護符・中': 1 } },     // 21 節目
  { koban: 1500 },                       // 22
  { items: { '稽古の書': 10 } },          // 23
  { stone: 200 },                        // 24
  { soul: 100 },                         // 25
  { items: { '道中手形': 20 } },          // 26
  { koban: 2000 },                       // 27
  { stone: 500 },                        // 28 節目
  { items: { '特技の伝書': 8 } },         // 29
  { soul: 150 },                         // 30
  { stone: 1000 },                       // 31 節目（三十一日ある月だけ）
];
const lbMonthKey = () => today().slice(0, 7);
const lbDayNow = () => +today().slice(8, 10);
/* その月の日数。new Date(年, 月, 0) で前の月の末日＝その月の末日が出る */
const lbLastDay = () => {
  const [y, m] = lbMonthKey().split('-').map(Number);
  return new Date(y, m, 0).getDate();
};
/* 月が変わったら板を真っ新に */
function lbRoll() {
  const k = lbMonthKey();
  if (P.lbMonth !== k) { P.lbMonth = k; P.lbGot = []; savePlayer(); }
}
/* URL の末尾に ?lbagain を付けて開くと、判が落ちるところをもう一度見られる（2026-10-09・悠さんの指図）。
   ・今日の朱印を一つ戻す（P.lbGot から今日の日を外す）
   ・お知らせ札の「今日は表示しない」の覚え（P.adHide）を空にする
   毎月一日の見え方の確かめにも使うので本番に残す。URL は消さない ── 開き直すたびに何度でも試せる */
function lbAgain() {
  let q = '';
  try { q = location.search || ''; } catch (e) { return; }
  if (!/[?&]lbagain(?:[=&]|$)/.test(q)) return;
  lbRoll();
  const d = lbDayNow(), got = P.lbGot || [];
  /* 今日ぶんをもう受け取っていたときだけ「褒美なしで押し直す」印を立てる。
     まだ受け取っていない日に開いたなら、ふつうに配る */
  S.lbFree = got.includes(d);
  P.lbGot = got.filter(x => x !== d);
  P.adHide = {};
  savePlayer();
}
/* 今日のぶんを配る。もう押してあれば null。配り方は miTake と同じ並び */
function lbTake() {
  lbRoll();
  const d = lbDayNow();
  if ((P.lbGot || []).includes(d)) return null;
  const rw = LB_DAYS[d - 1];
  if (!rw) return null;
  /* ?lbagain で戻した朱印は、判だけ押し直して褒美は配らない（2026-10-09）。
     本番に残す仕掛けなので、開き直すたびに褒美が増える抜け道にしない */
  if (S.lbFree) { S.lbFree = false; P.lbGot.push(d); savePlayer(); return rw; }
  if (rw.koban) P.koban += rw.koban;
  if (rw.soul) P.soul += rw.soul;
  if (rw.stone) addFreeStones(rw.stone);   // 褒美の石は必ず無料ストーン（2026-10-07）
  if (rw.stamina) P.stamina = Math.min(P.staminaMax, P.stamina + rw.stamina);
  if (rw.ticket) P.items[TICKET] = (P.items[TICKET] || 0) + rw.ticket;
  for (const [k, v] of Object.entries(rw.items || {})) P.items[k] = (P.items[k] || 0) + v;
  P.lbGot.push(d);
  savePlayer();
  return rw;
}
/* 升の隅に出す小さな数。品が先、なければ通貨。数は一つだけ出す */
const lbNum = rw => num(Object.values(rw.items || {})[0] || rw.ticket || rw.koban
                       || rw.soul || rw.stone || rw.stamina || 0);
/* 板の中身。絵の上に升だけを重ねる。絵が無いときは adList が札ごと落とすので、
   ここが呼ばれるときは必ず板の絵がある */
function lbBoard() {
  lbRoll();
  const now = lbDayNow(), last = lbLastDay(), got = P.lbGot || [];
  const stamp = uiUrl('stamp_sumi');
  /* 判をつく音は、板が目の前に出た一度きり（2026-10-09・悠さんの指図
     「この画面になったら押された様なアクションつけて」）。
     lbBoard は板の札が表に来て初めて呼ばれるので、ここが「この画面になった」瞬間。
     遅れは CSS の animation-delay（.5s）に合わせてある ── 判が落ちる刹那に鳴らす */
  if (S.lbNew && !S.lbRang) {
    S.lbRang = true;
    setTimeout(() => SFX.hanko(), 500);
  }
  return el('div', { class: 'lbwrap' }, LB_DAYS.map((rw, i) => {
    const d = i + 1;
    if (d > last) return null;             // 二十八日の月は 29〜31 を空のままにする
    const r = Math.floor((d - 1) / 7);
    const c = r === 4 ? 2 + ((d - 1) % 7) : (d - 1) % 7;
    const on = got.includes(d);
    const fresh = on && d === now && S.lbNew;
    return el('div', {
      class: 'lbc' + (on ? ' on' : '') + (d === now ? ' now' : '')
             + (LB_BIG.has(d) ? ' big' : '') + (fresh ? ' fresh' : ''),
      style: `left:${LB_X[c]}%;top:${LB_Y[r]}%;width:${LB_W}%;height:${LB_H}%`,
      title: `${d}日　${miWords(rw)}`,
    }, el('i', { class: 'lbd' }, String(d)),
       miIcon(rw),
       el('b', { class: 'lbn' }, lbNum(rw)),
       on ? (stamp
         ? keepImg({ class: 'lbst' + (fresh ? ' pop' : ''), src: stamp, alt: '済' })
         : el('span', { class: 'lbst txt' + (fresh ? ' pop' : '') }, '済'))
         : null);
  }));
}

const AD_CARDS = [
  /* ログインボーナスの板をいちばん先に（2026-10-09）。褒美は adOpen でもう配ってあるので、
     ここは押された朱印を見せるだけ。over＝絵の上に重ねる中身 */
  { art: 'login_board', name: 'ログインボーナス', over: lbBoard },
  { art: 'login_duel',  name: '友人対戦' },
  { art: 'login_tower', name: '試練の塔' },
  /* 落ち延び道中（2026-10-09・悠さんの指図）。絵を news/login_trail.png に
     置けば出る。無いうちは adUrl が null を返して adList が落とすので、
     置くまで何も起きない ── 「絵が無くても動く」 */
  { art: 'login_trail', name: '落ち延び道中' },
];
/* ---- その日のお祭りの札（2026-10-09・悠さんの指図）----
   「この画像を各イベントの日に合わせてログイン時のポップアップに表示して」。
   平日は武将覚醒の属性ごとに一枚（月猛将／火智将／水守将／木仁将／金神速）、
   土日は特技強化と武士の魂の二枚。曜日は event.js の AWAKE_DAY と
   evShownToday が持っているので、**こちらで曜日を書かない**。
   並びを変えたときに札だけ嘘をつくのを避けるため。
   絵が無い日は札を出さない（adUrl が null を返すと adList が落とす）。
   お祭りの札を先に、ふだんの知らせ（友人対戦・試練の塔）を後ろに置く。
   その日だけのものを先に見せたい */
function festCards() {
  const out = [];
  const aw = evOf('awake');
  if (aw && evShownToday(aw))
    for (const a of awakeAttrsToday()) out.push({ art: 'fest_awake_' + a, name: a + '覚醒の日' });
  if (isWeekend()) {
    const tr = evOf('train'), so = evOf('daily_soul');
    if (tr && evShownToday(tr)) out.push({ art: 'fest_train', name: '特技強化の日' });
    if (so && evShownToday(so)) out.push({ art: 'fest_soul', name: '武士の魂獲得の日' });
  }
  return out;
}
/* ウェブ版は絵を webp に焼き直すので、両方の尻尾を見る（2026-10-08）。
   .png だけを見ていると、ウェブでは札が一枚も出ない */
const adUrl = a => {
  for (const ext of ['.webp', '.png'])
    if ((MANIFEST.news || []).includes(a + ext)) return `assets/news/${a}${ext}`;
  return null;
};
/* 「今日は表示しない」は **札ごと**（2026-10-09・悠さんの指図）。
   一枚ずつ別に覚えるので、押した札だけが今日は出ず、ほかの札は出る */
const adHidden = a => (P.adHide || {})[a] === today();
const adList = () => festCards().concat(AD_CARDS).filter(x => adUrl(x.art) && !adHidden(x.art));
/* 一度の立ち上げにつき一度だけ（2026-10-08）。
   覚えは残さない ── 開き直せばまた出る、が「毎回ログインのたび」の意味 */
let AD_DONE = false;
function adOpen() {
  if (AD_DONE) return;
  AD_DONE = true;
  /* 釦が止まっている上に札を重ねると、どこを押せばよいか分からなくなるので、
     手引きのさなかは札を出さない（下で見る）。名を決める前は何もしない */
  if (!P.name) return;
  lbAgain();
  /* ログインボーナスは **札を出す前に配る**（2026-10-09）。
     「今日は表示しない」を押していても、手引きの最中でも、褒美を取り逃がさない。
     S.lbNew＝今日ぶんを今まさに配った印。朱印が落ちてくる演出に使う */
  if (lbTake()) S.lbNew = true;
  /* 手引きのさなかと はじまりの物語のあいだは札を出さない */
  if (guideOn() || S.opening) return;
  if (!adList().length) return;
  S.ad = 0;
}
function adSheet() {
  const list = adList();
  const i = S.ad || 0;
  const c = list[i];
  if (!c) { S.ad = null; return null; }
  /* ふつうの閉じ方（2026-10-09）。画面を触ったときも、「閉じる」を押したときも、
     これを通る＝**次に開けばまた出る**。悠さんの指図で、触って閉じたぶんは
     「今日は表示しない」と同じ扱いにはしない */
  const close = () => { S.ad = null; SFX.pick(); draw(); };
  const next = () => {
    if (i + 1 < list.length) { S.ad = i + 1; SFX.pick(); draw(); }
    else close();
  };
  /* 今日はもう出さない。**押した一枚だけ**（2026-10-09・悠さんの指図
     「閉じるは全てのポップアップ毎に判定して」）。日付を控えるだけなので、
     朝4時の変わり目で today() が変わり、また出るようになる。
     一枚消えると後ろが繰り上がる＝同じ番号のまま次の札が出る。
     最後の一枚だったときは adSheet の頭で list[i] が無くなって閉じる */
  const hideToday = () => {
    P.adHide = { ...(P.adHide || {}), [c.art]: today() };
    savePlayer(); SFX.pick(); draw();
  };
  return el('div', { class: 'sheet adsheet', onclick: next },
    el('div', { class: 'adbox' },
      /* 絵と、その上に重ねる中身（ログインボーナスの升）をひと包みに。
         包まないと、絵の高さが決まる前に升の % がずれる */
      el('div', { class: 'adwrap' },
        keepImg({ class: 'adart', src: adUrl(c.art), alt: c.name }),
        c.over ? c.over() : null),
      /* 2026-10-09（悠さんの指図）：枚数の丸と「画面を押すと次へ」の案内を外した。
         絵を見せる場なので、札の下に小物が並ぶほど絵が小さく見える。
         押せば次へ進むのは触れば分かる */
      /* 釦は札の下に二つ（2026-10-09・悠さんの指図）。
         stopPropagation を付けないと、上の adsheet の onclick（次へ）も一緒に走る */
      el('div', { class: 'adbtns' },
        el('button', { class: 'adbtn', onclick: e => { e.stopPropagation(); hideToday(); } },
          el('span', {}, '今日は'), el('span', {}, '表示しない')),
        /* 「とじる」は画面を触ったときと同じ＝次の札へ（2026-10-10・悠さんの指図
           「閉じると画面タップは同じ動きね！」）。前は全部まとめて閉じていた */
        el('button', { class: 'adbtn', onclick: e => { e.stopPropagation(); next(); } }, 'とじる'))));
}
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
  if (g.stone) addFreeStones(g.stone);     // 褒美の石は必ず無料ストーン（2026-10-07）
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
  /* 目次を付けた（2026-10-03）。章が十三まで増えて、
     「反撃はどうなってる？」と探すのに ずっと巻かねばならなかった。
     押すとその章の頭まで飛ぶ */
  const jump = i => () => {
    const n = document.querySelector(`.helplist .hsec[data-h="${i}"]`);
    const box = document.querySelector('.helpbox .helplist');
    if (!n || !box) return;
    box.scrollTop += n.getBoundingClientRect().top - box.getBoundingClientRect().top - 4;
    SFX.pick();
  };
  return el('div', { class: 'sheet', onclick: e => { if (e.target.classList.contains('sheet')) close(); } },
    el('div', { class: 'card2 helpbox' },
      el('b', { class: 'mittl' }, '合戦の手引き'),
      el('div', { class: 'row chapters helpidx' }, HELP.map((h, i) =>
        el('button', { class: 'chip', onclick: jump(i) }, h.t))),
      el('div', { class: 'helplist' }, HELP.map((h, i) =>
        el('div', { class: 'hsec', 'data-h': String(i) },
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
      el('p', { class: 'note' },
        P.stamina > P.staminaMax ? '兵糧は時では戻らぬ（上限を超えているあいだ）'
        : P.stamina >= P.staminaMax ? '兵糧は満ちている'
        : '兵糧は時とともに戻る'),
      names.length ? el('div', { class: 'shoplist' }, names.map(name => {
        const it = ITEMS[name], have = item(name);
        return el('div', { class: 'shoprow' },
          itemIcon(name),
          el('div', { class: 'sitm' },
            el('b', {}, name, el('span', { class: 'have' }, `持 ${num(have)}`)),
            el('span', { class: 'sd' }, it.desc)),
          el('button', {
            /* 数で戻す品（兵糧丸）は、満ちていても押せる（2026-10-03）。
               上限を超えて積めるようにしたため。「満たす」品だけは無駄打ちさせない */
            class: 'go sm',
            disabled: (it.food >= 9999 && P.stamina >= P.staminaMax) ? true : null,
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
      P.stamina >= P.staminaMax ? el('p', { class: 'note' },
        P.stamina > P.staminaMax
          ? `上限を ${num(P.stamina - P.staminaMax)} 超えて蓄えておる。超えているあいだは時でもどらぬ`
          : 'もう満ちている。ここから先は道具で積める（超えたぶんは時でもどらぬ）') : null,
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
  { key: '道中', name: '道中', note: '落ち延び道中の戦で一枚ずつ使う手形' },
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

/* ストーンが足りないときの案内（2026-09-21）
   2026-10-07：ストーン販売所ができたので、「買いに行く」から繋いだ */
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
        el('button', { class: 'go', onclick: () => {
          S.shop = false; S.stoneBack = S.screen; S.screen = 'stoneshop'; S.stMsg = '';
          SFX.pick(); draw();
        } }, '石を買いに行く'))));
}

/* ================= ストーン販売所（2026-10-07・悠さんの指図）=================
   ヘッダーの石の玉の ＋ から来る、課金の棚。

   ★呼び名の決まり（2026-10-07）★
     私たちのあいだでは **ストーン** と呼ぶ（コードの名も資料もストーン）。
     **遊ぶ人に見せる字は これまでどおり「石」**。
     例外はこの画面の題だけで、そこは「ストーン販売所」。

   値と口の中身は player.js の STONE_PACKS が正典。ここでは並べるだけ。

   **お支払いの繋ぎ込みは、まだ無い。** ストア（App Store / Google Play）の
   買い物と、そのレシートを確かめる道ができてから grantStones() を呼ぶ。
   いまは押すと「これから」の札が出るだけで、ストーンは一粒も増えない。
   ここで配ってしまうと、ただのストーン配布機になってしまう。 */
function stoneShopBack() {
  S.screen = S.stoneBack && SCREENS[S.stoneBack] ? S.stoneBack : 'home';
  S.stoneBack = null; S.stAsk = null; S.stMsg = '';
  SFX.pick(); draw();
}
function stoneCard(pk) {
  const art = uiUrl('stone_' + pk.no) || uiUrl('coin_石');
  const tot = pk.paid + pk.free;
  return el('button', {
    class: 'stcard' + (pk.free ? ' bonus' : ''),
    onclick: () => { S.stAsk = pk.no; S.stMsg = ''; SFX.pick(); draw(); },
  },
    /* おまけの帯は、付く口だけ（2026-10-07）。
       「二割」とだけ言い、何粒かは下の数で見せる */
    pk.free ? el('span', { class: 'stbn' }, `おまけ ${Math.round(STONE_FREE_PCT * 100)}％`) : null,
    el('span', { class: 'stpic' }, art ? keepImg({ src: art, alt: '' }) : el('i', {}, '勾')),
    el('span', { class: 'sttx' },
      el('b', {}, num(tot), el('em', {}, '石')),
      el('span', { class: 'stsub' },
        `有償 ${num(pk.paid)}`,
        pk.free ? el('i', {}, ` ＋ 無料 ${num(pk.free)}`) : null)),
    el('span', { class: 'styen' }, '¥', num(pk.yen)));
}
/* 買う前の確かめ。中身と値を並べ、押したら いまは「これから」の札 */
function stoneAsk() {
  const pk = stonePack(S.stAsk); if (!pk) return null;
  const close = () => { S.stAsk = null; SFX.pick(); draw(); };
  const tot = pk.paid + pk.free;
  return el('div', { class: 'sheet', onclick: e => { if (e.target.classList.contains('sheet')) close(); } },
    el('div', { class: 'card2 stbox' },
      el('b', { class: 'mittl' }, 'これを買いますか'),
      el('div', { class: 'strow' }, el('span', {}, '有償の石'), el('b', {}, num(pk.paid))),
      pk.free ? el('div', { class: 'strow fr' }, el('span', {}, '無料の石'), el('b', {}, '＋' + num(pk.free))) : null,
      el('div', { class: 'strow tot' }, el('span', {}, '受け取る数'), el('b', {}, num(tot))),
      el('div', { class: 'strow yen' }, el('span', {}, 'お支払い'), el('b', {}, '¥' + num(pk.yen))),
      S.stMsg ? el('p', { class: 'note warn' }, S.stMsg) : null,
      el('div', { class: 'acts', style: 'margin-top:12px' },
        el('button', { class: 'ghost', onclick: close }, 'やめる'),
        el('div', { class: 'spacer' }),
        el('button', { class: 'go', onclick: () => {
          /* ここでストーンを配ってはいけない（2026-10-07）。
             ストアの支払いが通り、レシートを確かめてから grantStones() を呼ぶ。
             その道がまだ無いので、いまは断りの札だけ出す */
          S.stMsg = 'お支払いの繋ぎ込みはこれから。いまはまだ買えません';
          SFX.pick(); draw();
        } }, '購入へ進む')),
      closeX(close)));
}
function screenStone() {
  return {
    body: el('div', {},
      el('button', { class: 'ghost back', onclick: stoneShopBack }, '← もどる'),
      /* 題は上の帯（SUB）がもう出しているので、ここには置かない（2026-10-07）。
         二度書くと同じ字が縦に並んで、画面が間延びして見えた */
      /* いま持っている数は、買う前にいちばん見たい数（2026-10-07）。
         有償と無料の内訳まで出す。減るのは無料のほうが先 */
      el('div', { class: 'card2 sthave' },
        el('span', { class: 'sthn' }, curIcon('stone'), el('b', {}, num(stones())), el('em', {}, '石')),
        el('span', { class: 'sthb' }, `有償 ${num(P.paid)}　無料 ${num(P.free)}`)),
      el('div', { class: 'stlist' }, STONE_PACKS.map(stoneCard)),
      el('p', { class: 'stnote' },
        `${num(STONE_FREE_FROM)} 石から上の口には、買った数の `,
        el('b', {}, Math.round(STONE_FREE_PCT * 100) + '％'),
        ' を無料の石として添えます。'),
      el('p', { class: 'stnote dim' },
        '無料の石から先に使われます。表示は税込。',
        el('br', {}),
        'お支払いの繋ぎ込みはこれから（いまは買えません）'),
      S.stAsk ? stoneAsk() : null),
    nav: true,
  };
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
        row('　うち無料石', `${num(P.free)} 石`),
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
    /* 「無料」も値段とおなじ黒帯の中に書く（2026-10-02 改）。
       前は絵の上ぎわに金の丸帯を浮かせていたが、絵の外に飛び出して
       隣の釦や上の飾りと重なり、どの釦の札なのか分からなくなっていた。
       値段が出る場所と同じなら、目はいつも同じ所を見ればよい */
    el('span', { class: 'pr' + (freeBadge ? ' freeword' : '') }, price));
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
  const r = pull(count, pool, curGacha().id,
                 { ticket: !!curGacha().ticket, freeOne: count === 1 && gFreeOk(curGacha()) });
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
  /* 編成に並ぶのは「いま手元にいる」武将だけ（2026-10-03 直し）。
     owns() は「かつて手に入れたか」なので、解雇して0枚になった武将や
     取引所に出している武将も並び、選べてしまっていた。
     選ぶと部隊に残り、出陣のときに黙って抜け落ちて四騎で戦うことになる */
  const mine = C.filter(c => hasCard(c.no));
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
        /* どの部隊を組むかを、ここで選べるようにした（2026-10-01）。
           塔やお祭りから編成へ入ると、部隊えらびの画面を通らないので
           いま組んでいるのが何番目かも分からず、替えるすべも無かった。
           S.name / S.picked は P.squads[P.active] をそのまま見ているので、
           P.active を替えて描き直すだけでよい */
        el('select', {
          class: 'sqsel', title: 'どの部隊を組むか',
          onchange: e => { P.active = +e.target.value; savePlayer(); SFX.pick(); draw(); },
        /* 名で選ぶ（2026-10-02）。騎の数だけでは、どれが「先鋒」でどれが
           「守りの陣」なのか見分けられなかった。名を付けていない部隊だけ数で出す */
        }, P.squads.map((q, i) => el('option', {
          value: String(i), selected: i === P.active ? 'selected' : null,
        }, `${i + 1}　${(q.name || '').trim() || `名無し（${q.nos.length}騎）`}`))),
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
      /* 武将の升は縦に長い。コストと「陣形へ」を見るために いちいち
         いちばん下まで巻くのが手間だったので、この帯ごと画面の下に貼り付けた
         （2026-10-03）。追従していた左下の丸い戻り道は、この帯に戻り釦を
         置いたので外した。ほかの画面の戻り釦はそのまま */
      el('div', { class: 'acts actsfix' },
        S.sqpHold
          ? el('button', { class: 'ghost', onclick: () => { const h = S.sqpHold; S.sqpHold = null;
              S.screen = h.from; S.sqp = h.ask;
              S.fr = !!h.fr; S.frId = h.frId != null ? h.frId : null; S.rk = !!h.rk;
              SFX.pick(); draw(); } }, '← 戦へ')
          : el('button', { class: 'ghost', onclick: () => { S.screen = twBackGo(); SFX.pick(); draw(); } },
              '← ' + twBackLabel() + 'へ'),
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
/* 札を開く（2026-10-01 に印をひとつ足した）。
   ro   … 読むだけ（強化などの釦も出さない。敵の札・友の部隊）
   base … 釦は出すが、札の数と技は「手に入れたときのまま」を見せる（図鑑）
   図鑑は「どんな武将がいるか」を見る台帳なので、
   自分が育てたぶんを混ぜると、素の強さが どこにも見られなくなる */
function openCard(c, ro, base, mod) {
  if (!c) return;
  /* 取引所の覚えを消してから開く（2026-10-05）。
     取引所で品の札を開くと S.detailBuy（買える品）と S.detailSt（売り主の育ち）が立つ。
     閉じ方によっては残ったままになり、そのあと図鑑で札を開いたときに
     「◯◯ の品／召し抱える」の帯が出てしまっていた（実測で踏んだ）。
     開くたびに消せば、どこから開いても取り違えない */
  S.detailSt = null; S.detailBuy = null;
  /* 一時の増減は、戦のさなかに開いたときだけ（2026-10-08）。
     開くたびに入れ替えるので、戦が終わってから図鑑を開いても残らない */
  S.detailMod = (mod && Object.keys(mod).length) ? mod : null;
  S.detail = c.no; S.side = null; S.detailRO = !!ro; S.detailBase = !!base; draw();
}
/* 札の上に いまの値を重ねるか、焼いたまま（素）を出すか。
   読むだけ（detailRO）と 素のまま（detailBase）を分けた（2026-10-03）。
   戦のさなかに味方の顔を押したとき、素の札を出していたので
   継承した◆も、上げた特技の位も出ていなかった（戦っているのは育った姿なのに） */
const cardRaw = () => S.detailBase;
/* 育成の画面の顔を押すと、その武将のカードが開く（2026-09-23） */
/* 武将強化の立ち絵（2026-10-09・悠さんの指図）。
   コマ絵（assets/pawn/<番号>.png・512四方の透かし絵）は全身が入っているので、
   そのまま大きく立たせられる。**押すとその武将のカードがひらく**（悠さんの指図）。
   コマ絵が無い武将は、これまでの顔の切り抜きに落ちる
   ── 「絵が無くても動く」を崩さないため */
/* ---- 立ち絵の炎（2026-10-10・悠さんの指図）----
   特技の枠ひとつに炎ひとつ。最大三つ。空いた枠には出さない（二枠なら炎は二つ）。
     固有（◆）… 虹
     通常の特技 … 位1 赤／位2 黄／位3 青
   置き場は 左に二つ（上＝一の枠・下＝二の枠）、右に一つ（三の枠）。
   後で足元と背中にも炎を置く予定なので、胸から腰の高さに集めてある。
   出すのは ホームの立ち絵と武将強化の立ち絵だけ。合戦のコマには出さない。
   炎はその武将じしんの枠と位から決めるので、武将ごとに違う。
   絵は assets/fx/flame_<色>.webp（1秒の動くwebp）。無ければ何も出さない */
const FLAME_LV = ['赤', '赤', '黄', '青'];   // 位 → 色（位0は無いが念のため赤）
function skillFlames(c) {
  if (!c || !P.own.includes(c.no)) return null;
  const sl = slotsOf(c), lv = skillLvOf(c.no) || [];
  const out = [];
  for (let i = 0; i < 3; i++) {
    const x = sl[i];
    if (!x || !x.sk) continue;
    const col = x.uniq ? '虹' : FLAME_LV[Math.max(1, Math.min(3, lv[i] || 1))];
    const u = fxUrl('flame_' + col);
    if (u) out.push(keepImg({ class: 'skfl s' + i, src: u, alt: '' }));
  }
  return out.length ? el('div', { class: 'skfls', 'aria-hidden': 'true' }, out) : null;
}
/* ---- 足元の光の輪（2026-10-10・悠さんの指図）----
   覚醒の段で色が変わる。覚醒なしは出さない。
     覚醒1 赤／2 青／3 緑／4 金／5 虹
   輪は足を囲むので、**奥の半分は立ち絵のうしろ、手前の半分は立ち絵の前**に分けて置く。
   同じ絵を二枚重ね、clip-path で上下に切り分けている（足が輪の中に立って見える）。
   絵は assets/fx/aura_<色>.webp（1秒の動くwebp）。無ければ何も出さない */
const AURA_COL = [null, '赤', '青', '緑', '金', '虹'];
/* ---- 入った瞬間だけ燃え上がる（2026-10-10・悠さんの指図「流石にごちゃごちゃしすぎかな」→ 案2）----
   ホームに入った瞬間・武将強化で武将を選んだ瞬間・札を閉じて戻った瞬間に、
   称号の背景・足元の輪・炎を全力で出し、約2秒たったら静める（炎は小さく、輪と背景は淡く）。
   常に派手だとうるさいが、入るたびに見せ場がある。
   draw は何度も組み直すので、そのたび燃え直さないよう「入ってから何ミリ秒か」を
   負の animation-delay に渡して、演出の途中から再生させている */
let FX_KEY = null, FX_AT = 0, FX_USED = false;
function fxDelay(key, hold) {
  FX_USED = true;
  const now = Date.now();
  if (FX_KEY !== key || hold) { FX_KEY = key; FX_AT = now; }
  return `--fxd:-${now - FX_AT}ms`;
}
/* ---- 称号の背景（2026-10-10・悠さんの指図「称号に応じてキャラの背景つけよう」）----
   いま名乗っている称号（P.title）の絵を、立ち絵のいちばん奥に敷く。
   絵は assets/fx/tbg_<称号の名>.webp（止まった絵でも、1秒の動くwebpでもよい）。
   無い称号は何も敷かない ── 絵を置いた称号から順に灯っていく。
   重なり：背景（z0）＜ 輪の奥（z1）＜ 立ち絵（z2）＜ 輪の手前・炎（z3） */
function titleBg(c) {
  if (!c || !P.own.includes(c.no) || !P.title) return null;
  const u = fxUrl('tbg_' + P.title);
  return u ? keepImg({ class: 'ttlbg', src: u, alt: '' }) : null;
}
function footAura(c, side) {
  /* 2026-10-10 悠さんの指図「足元のエフェクトはキャラより背面にした方がよさそう」。
     手前の半分はやめ、輪まるごとを立ち絵のうしろに置く（back だけ出す） */
  if (side === 'front') return null;
  if (!c || !P.own.includes(c.no)) return null;
  const aw = Math.max(0, Math.min(5, charState(c.no).awake || 0));
  const col = AURA_COL[aw];
  const u = col ? fxUrl('aura_' + col) : null;
  return u ? keepImg({ class: 'ftaura ' + side, src: u, alt: '' }) : null;
}
function growFigure(c) {
  const pw = pawnUrl(c.no);
  return el('button', {
    class: 'gxfig fxlit' + (pw ? ' art' : ''), title: `${c.name} のカードを見る`,
    style: fxDelay('grow:' + c.no, S.detail != null),
    onclick: e => { e.stopPropagation(); SFX.pick(); openCard(c); },
  }, pw ? titleBg(c) : null,
     pw ? footAura(c, 'back') : null,
     pw ? keepImg({ class: 'gxpw', src: pw, alt: c.name, decoding: 'async' })
        : el('span', { class: 'f', style: chipStyle(c) }),
     pw ? footAura(c, 'front') : null,
     pw ? skillFlames(c) : null);
}
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
/* その陣形で何が起きるか（2026-10-06）。rules.json の note をそのまま出す。
   枠ごとの狙いだけを書いた文で、数字は入っていない */
const formNote = f => (RULES.formations?.[f]?.note) || '';
/* ---- 陣形で上がるもの（2026-10-06・悠さんの指図）----
   陣形そのものに数値の上げ下げは無い。上がるのは **枠の列** と **武将の得意** の二つ。

   ① 列の効き目（rules.json の slotBonus）… 前列は受ける傷が減り、中列は与える傷が増え、
      後列は遠くまで届くが受ける傷が増える。engine は fy===0 を前列、fy>=2 を後列、
      あいだを中列として数える（engine.mjs の band）。
   ② 武将ごとの得意・苦手（ground.goodForm / badForm）… 得意な陣形で出ると
      その武将だけ全部の数値が上がり、苦手だと下がる。

   画面に出すのは **②の割合一行だけ**（2026-10-06）。
   ①の枠数、札ごとの得意・苦手の数、誰が得意かの名、はどれも
   「分かりにくい」と言われて落とした。①は札の絵の形で見えている */
/* 陣形の得意／苦手の効き目を、数で出す（2026-10-06・悠さんの指図）。
   ふだんは遊ぶ人に割合を見せない決まりだが、陣形だけは
   「上がる／鈍る」では弱すぎて選ぶ手がかりにならないので、ここだけ例外で出す。
   数は sim/rules.json の ground.goodFormPct / badFormPct から引く（書き写さない）。
   ほかの画面（地形・天候）へは広げないこと */
function formPctText(key) {
  const v = RULES.ground?.[key];
  if (typeof v !== 'number' || !v) return '';
  const n = Math.round(Math.abs(v) * 1000) / 10;   /* 0.05 → 5 */
  return (v > 0 ? '+' : '−') + n + '%';
}
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
      /* 陣形の下の添え書きは、この一行だけ（2026-10-06・悠さんの指図）。
         はじめは前中後の枠数、札ごとの得意・苦手の数、誰が得意かの名、と
         足していったが、どれも「分かりにくい」と言われて全部落とした。
         残すのは効き目の割合ひとつ。ふだん遊ぶ人に割合は見せない決まりだが、
         陣形だけは言葉では選ぶ手がかりにならないので、ここだけ例外で出す */
      el('div', { class: 'grid formgrid', style: 'grid-template-columns:repeat(auto-fill,minmax(104px,1fr))' },
        FORMS.map(f => el('button', {
          class: 'fcard fpick' + (S.form === f ? ' on' : ''),
          onclick: () => { S.form = f; S.slots = []; SFX.pick(); draw(); },
        }, formPreview(f), el('span', { class: 'ftg' }, formTag(f))))),
      el('p', { class: 'fleg' },
        el('em', { class: 'fg' }, '得意'), 'な陣形の武将は すべての数値 ',
        el('b', { class: 'fg' }, formPctText('goodFormPct')), '　',
        el('em', { class: 'fb' }, '苦手'), 'だと ',
        el('b', { class: 'fb' }, formPctText('badFormPct'))),

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
        el('button', { class: 'go', onclick: () => { S.screen = twBackGo(); draw(); } },
          '保存して' + twBackLabel() + 'へ'))),
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
/* 道の段ごとの上乗せ（2026-10-10・悠さんの指図「ハードモードと超ハードモード」）。
   lv＝敵のLv、soul＝魂（999まで）、want＝兵力の目安、sk＝敵の特技の位。
   sim/tools/camp_test.mjs に LVA/SPA/WA で同じ値を与えて測った（中部はじまり・自軍コスト1000・1戦4回）：
     修羅  Lv99魂400 … 1章 87% → 7章 33%　／ 育て切り Lv99魂999 … 93% → 54%
     魔王  Lv99魂400 … 1章 35% → 7章 15%　／ 育て切り              … 58% → 33%
   試しの自軍は特技の位も陣形の選びも手で動かすこともしないので、本当はもう少し勝てる */
const CAMP_MODE = [
  { name: '並の道',   short: '並',   lv: 0,   soul: 0,   want: 0,    sk: 1 },
  { name: '修羅の道', short: '修羅', lv: 60,  soul: 400, want: 600,  sk: 2 },
  { name: '魔王の道', short: '魔王', lv: 150, soul: 900, want: 1400, sk: 3 },
];
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
  const want = FOE_WANT(rank, step, last, pref.lord) + (CAMP_MODE[campLv()] || CAMP_MODE[0]).want;
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
  const md = CAMP_MODE[campLv()] || CAMP_MODE[0];
  const lv = FOE_LV(rank, step, last, pref.lord) + md.lv;
  const soul = Math.min(999, FOE_SOUL(rank) + md.soul);
  return out.map(c => foeGrown(c, lv, soul, md.sk));
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
/* その戦に出る顔ぶれの、カットインに使う絵を先に読む（2026-10-01）。
   読めても読めなくても戦は進む（絵が無くても動く決まりは崩さない） */
/* 部隊の奥義の一枚絵を、城にいるあいだに読んでおく（2026-10-05）。
   顔ぶれが変わったときだけ。留守番（Service Worker）が覚えるので二度目からは即座に出る */
let warmKey = '';
function warmSquadArt() {
  const q = P.squads[P.active];
  const nos = ((q && q.nos) || []).filter(Boolean);
  const key = nos.join(',');
  if (!key || key === warmKey) return;
  warmKey = key;
  for (const no of nos) { const a = cutinArt(no, '奥義'); if (a) artHold(a); }
  warmAllUltArt();
}

/* ---- 奥義の一枚絵を、遊んでいるあいだに静かに集めておく（2026-10-05）----

   なぜ要るか。一枚絵は 110枚・12MB（一枚 110KB ほど）ある。
   開戦の札は1.2秒しかないので、細い電波では間に合わず帯に落ちていた。
   「出る戦では何度も出て、出ない戦は全部ちゃんと入る」のは、
   その戦の顔ぶれの絵が覚えにあるかどうかで決まっていたため（悠さんの実測）。

   やり方は fetch（覚えに入れるだけ）。Image と違って ひらいた絵を抱え込まないので、
   110枚ぜんぶ入れても端末の覚えを食わない。留守番が棚にしまうので、
   一度集めれば次からは待たない（電波が無くても出る）。

   遠慮すること ──
   ・データ節約の設定が入っていたら集めない
   ・2g のときは集めない
   ・立ち上がりから5秒おいて、一枚ずつ間を空けて集める（遊びの邪魔をしない）
   ・自分の持っている武将から先に */
let artWarming = false;
function warmAllUltArt() {
  if (artWarming) return;
  artWarming = true;
  const cx = navigator.connection || {};
  if (cx.saveData || /(^|-)2g$/.test(cx.effectiveType || '')) return;
  const mine = [], rest = [];
  for (const c of C) (P.own.includes(c.no) ? mine : rest).push(c.no);
  const nos = [...mine, ...rest];
  let i = 0;
  const step = () => {
    if (i >= nos.length) return;
    if (navigator.onLine === false) { setTimeout(step, 10000); return; }
    const u = cutinArt(nos[i++], '奥義');
    if (!u) return step();
    artFetch(u).then(() => setTimeout(step, 200));
  };
  setTimeout(step, 5000);
}
function preloadCutins(nos) {
  const urls = [];
  /* 奥義の一枚絵を先に（2026-10-05）。顔より重く、いちばん見せたい絵なので */
  for (const no of new Set(nos)) { const a = cutinArt(no, '奥義'); if (a) urls.push(a); }
  for (const no of new Set(nos)) {
    for (const u of [cutinUrl(no), faceUrl(no, '不敵'), faceUrl(no, '真剣'), faceUrl(no, '通常')])
      if (u) urls.push(u);
  }
  /* artHold が絵を手元に持っておく（2026-10-05）。
     作って捨てると、カットインのときに作り直しになって間に合わない */
  for (const u of new Set(urls)) artHold(u);
}
/* away … 留守の陣（2026-10-06）。友が居ないとき、預けてある置き部隊と戦う。
     { id, name, team } の team は相手の端末が作った包みをそのまま使う
     （members は育てたあとの姿。こちらで育て直してはいけない） */
function startBattle(camp, evb, spar, bout, tw, away) {
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
  if (spar || away) miBump('spar');
  /* 塔に挑んだ数は twGo2 で数えている（2026-10-02）。
     ここで battle をもう一度足していたので、塔の一戦が二度に数えられていた */
  const seed = camp ? campSeed(camp.pref.id, camp.step)
             : spar ? campSeed(spar.id + ':' + today(), spar.pref.battles - 1)
             : bout ? rkSeed(bout.npc.id + ':' + today())
             : away ? campSeed(away.id + ':' + today(), 0)
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
  /* 留守の陣は **相手が預けた盤** で戦う（2026-10-06）。
     置き部隊はその盤に合わせて組んであるので、こちらの都合で盤を変えると
     守り手がいきなり不利になる。地形も変わりようも向きも、そのまま借りる */
  if (away) S.stage = ((away.team || {}).stage || {}).s || '草原';
  // 障害の置き方は種で決まる（2026-09-26）。同じ国の同じ段なら、いつも同じ盤面
  // お祭りだけは級の番号で固定し、同じ級はいつも同じ景色にする（2026-09-28）
  S.stageV = evb ? (evb.rank % stageVarCount(S.stage))
                 : tw ? (tw.f % stageVarCount(S.stage))
                 : away ? (((away.team || {}).stage || {}).v || 0) % stageVarCount(S.stage)
                 : ((seed >>> 0) % stageVarCount(S.stage));
  // 人が絡む戦だけ、相手ごと・日ごとに攻守を入れ替える（2026-09-26）
  S.stageFlip = away ? !!(((away.team || {}).stage || {}).flip) : stageFlipFor(spar, bout);
  let rules = stageRules(S.stage, S.stageV, S.stageFlip);
  /* 塔だけの決まりを、その階のぶんだけ上から重ねる（2026-10-01）。
     籠城＝決着のターンをそこまでに縮め、守り切った側を勝ちにする。
     瀕死の陣＝味方はみな兵量1から始まる。engine の rules に足しただけなので、
     ほかの戦には一切ひびかない */
  if (tw) {
    const t0 = towerOf(tw.f) || {};
    if (t0.hold) rules = { ...rules, holdWin: 'A', time: { ...rules.time, maxTurns: t0.hold } };
    if (t0.hp1) rules = { ...rules, startHp: { A: 1 } };
    /* 天守（2026-10-02）。盤の奥に壊せる城を立てる。
       withKeep をここで掛けておくのは、盤を描く側（boardEl）も
       engine とおなじ盤を見なければならないため。engine 側でもう一度掛かるが、
       もう KEEP が刻まれているので二度めは同じ盤になる（何度掛けても変わらない） */
    if (t0.keep) {
      if (t0.limit) rules = { ...rules, time: { ...rules.time, maxTurns: t0.limit } };
      rules = withKeep({ ...rules, keep: { x: 4, y: 0, ...t0.keep } });
    }
  }
  let B = camp ? campEnemy(camp.pref, camp.step, rng)
            : spar ? campEnemy(spar.pref, spar.pref.battles - 1, rng)
            : bout ? rkTeamOf(bout.npc)
            : evb ? evEnemy(evb.rank, rng)
            : tw ? twEnemy(tw.f, rng)
            : away ? ((away.team || {}).members || [])
            : enemyTeam(rng);
  /* 初陣だけは一対一（2026-09-30）。
     こちらは一騎しかいないのに相手が五騎では、手ざわりを覚える前に押し切られる。
     手引きの「初陣」の歩にいるあいだだけ、相手も総大将ひとりにする */
  const first = camp && guideOn() && P.gstep === GUIDE_FIGHT;
  if (first && B.length > 1) B = B.slice(0, 1);
  /* 初陣は必ず勝てるようにする（2026-10-02）。
     はじめての一戦でつまずくと、手引きの道すじがそこで切れてしまう。
     相手を弱くするのではなく「負ける道を塞ぐ」ほうを選んだ。見た目はふつうの一騎打ちのまま。
       noLose … こちらは倒れない（何度でも兵量1で踏みとどまる。画面には「耐えた」と出る）
       holdWin … 決着のターンまで残れば こちらの勝ち（押し切れなくても負けにならない）
     この二つで、負ける道が無くなる */
  if (first) {
    rules = { ...rules, noLose: 'A', holdWin: 'A' };
    /* 相手は育てない（2026-10-02）。campEnemy は 1章の雑兵でも Lv16・魂104 で渡してくる。
       それと Lv1 のこちらが一騎打ちをすると、十ターンでは互いに倒しきれず
       「残兵量で負けているのに勝ち」という妙な絵になる。
       初陣の相手は国の軍勢ではなく物見の一騎、と読んで、素のまま立たせる */
    const raw = C.find(c => c.no === (B[0] || {}).no);
    if (raw) B = [raw];
  }
  /* 留守の陣は相手の陣立てをそのまま使う（2026-10-06）。
     ここで引き直すと、せっかく組んだ陣が無かったことになる */
  const bForm = away ? (((away.team || {}).formation) || FORMS[0])
                     : FORMS[Math.floor(rng() * FORMS.length)];
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
  /* 戦仕度で持ち込んだ道具も「道具を使った」に数える（2026-10-08・悠さんの指図）。
     これまで miBump('item') は 持ち物の棚から使ったときだけ呼んでいたので、
     果たし合いや全国に秘薬を持ち込んでも お役目が一つも進まなかった。
     実際に減ったぶん（useItem が通ったぶん）だけ数える */
  if (prep.length) miBump('item', prep.length);
  const wSet = prep.map(x => x.weather).filter(Boolean).pop();
  S.prep = [];
  /* 稽古は必ずオート（2026-09-24）。友との手合わせは見るものにしたいので、
     手で動かせるようにはしない。切り替えの札も盤面に出さない */
  /* 初陣は手で動かすところから覚えてもらう（2026-09-30）。そのあともしばらく手動のまま */
  if (first) P.manual = true;
  /* **はじめて挑む場は手でしか動かせない**（2026-10-07・悠さんの指図）。
     おまかせで素通りすると、その場で何が起きているのか覚えないまま先へ進んでしまう。
     一度取った場は、これまでどおり好きなほうで。
       全国 … その段をまだ抜けていない
       お祭り … その級をまだ取っていない
       塔 … その階をまだ抜けていない
     稽古・番付・留守の陣・果たし合いは、もともと手で動かす話ではないので外す */
  const firstTry = !(spar || bout || away)
    && !!(camp ? (camp.step >= prefStep(camp.pref.id))
        : evb ? !evCleared(evb.id, evb.rank)
        : tw ? !twGot(tw.f) : false);
  BATTLE = { seed, rules, B, bForm, first, firstTry, commands: [],
             modes: [{ turn: 0, manual: (spar || bout || away) ? false : (firstTry ? true : !!P.manual) }],
             shown: 0, live: null, playing: true, sel: null, busy: false, camp: camp || null,
             ev: evb || null,
             spar: spar || null,
             away: away || null,
             bout: bout || null,
             tw: tw || null,
             weather: wSet || weatherOf(seed, S.stage),
             useItems: prep.filter(x => !x.weather), prep };
  resolve();
  BATTLE.live = initLive(BATTLE.res);
  /* カットインの絵を、開戦の札（1.2秒）のあいだに裏で読む（2026-10-01）。
     読めていない一枚絵は cutIn が帯に落とすので、
     そのままだと その戦のはじめの奥義だけ字しか出ていなかった */
  preloadCutins([...S.picked.map(m => m.no), ...B.map(m => m.no)]);
  S.screen = 'battle';
  /* 開戦の札（2026-09-23）。どこの戦か・相手・空を一枚見せてから動きだす */
  S.vs = {
    // 題は「滋賀」と「決戦」に割る。あいだに家紋を挟むため（2026-09-24）
    ttlL: tw ? `${tw.f}階` : camp ? camp.pref.name : spar ? spar.pref.name
        : away ? `${away.name || '友'} の陣` : S.stage,
    ttlR: tw ? ((towerOf(tw.f) || {}).name || '試練')
        : camp ? (camp.pref.battles > 1 ? STEP_NAME[Math.min(camp.step, 2)] : '決戦')
        : spar ? (spar.duel ? '一騎打ち' : spar.away ? '留守の陣' : '稽古')
        : away ? (away.duel ? '一騎打ち' : '留守の陣') : 'の戦',
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
  /* 果たし合い（2026-10-04）。両軍とも人が動かす。
     編成は座から降りてきたものをそのまま使う（自分の手元の S.picked は見ない）。
     ここを手元から組み立てると、二人の盤がずれる */
  if (b.duel) {
    const side = t => ({ members: t.members || [], generalNo: t.generalNo,
      formation: t.formation, slots: t.slots,
      manual: true, modeSwitches: [{ turn: 0, manual: true }] });
    b.res = runBattle(side(b.duel.A), side(b.duel.B), b.rules, b.seed,
      { log: true, commands: b.commands, weather: b.weather });
    return;
  }
  /* 留守の陣（2026-10-06）。相手は居ないので、動かすのはこちらだけ。
     相手の総大将と並びは、預かった置き部隊のものをそのまま立てる。
     ここを素の決め打ち（先頭＝総大将・コスト順）に落とすと、
     せっかく組んだ陣と違う並びで守ることになる */
  if (b.away) {
    const fo = b.B || [];
    const t = b.away.team || {};
    const gen = fo.some(m => m.no === t.generalNo) ? t.generalNo : (fo[0] || {}).no;
    /* 留守の陣の一騎打ち（2026-10-10）。たがいの総大将ひとりずつ。並び順の指定は外す */
    const dl = !!b.away.duel;
    const mine = dl ? S.picked.filter(m => m.no === S.general).slice(0, 1) : S.picked;
    const foes = dl ? fo.filter(m => m.no === gen).slice(0, 1) : fo;
    b.res = runBattle(
      { members: (mine.length ? mine : S.picked).map(grownFor), generalNo: S.general, formation: S.form,
        manual: true, modeSwitches: b.modes, slots: dl ? null : S.slots },
      { members: foes.length ? foes : fo, generalNo: gen, formation: b.bForm, slots: dl ? null : (t.slots || null) },
      b.rules, b.seed, { log: true, commands: b.commands, weather: b.weather, useItems: b.useItems });
    return;
  }
  const grown = grownFor;
  /* 一騎打ちは、たがいの総大将ひとりずつだけで解く（2026-09-30）。
     並び順の指定（slots）は一体には要らないので外す */
  const duel = !!((b.spar && b.spar.duel) || (b.bout && b.bout.duel));
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
  if (BATTLE && (BATTLE.spar || BATTLE.bout || BATTLE.away)) return;   // 稽古と番付は必ずオート
  /* はじめて挑む場は手でしか動かせない（2026-10-07・悠さんの指図） */
  if (BATTLE && BATTLE.firstTry) { S.res = S.res; return; }
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
  /* 果たし合いでは、自分の手も いったん座へ預ける（2026-10-04）。
     座が番号を打って二人に配り、降りてきたものだけを積む。
     ここで先に積むと、相手と並びがずれて別の戦になる */
  if (BATTLE.duel) {
    if (!String(a.unit).startsWith(BATTLE.duel.side + '-')) return;   // 相手の手番
    if (DUEL && DUEL.ws) DUEL.ws.cmd({ unit: a.unit, turn: a.turn, ...c });
    return;
  }
  BATTLE.commands.push({ unit: a.unit, turn: a.turn, ...c });
  resolve();
  play();                       // 選んだ行動はその場で動く（ターンの終わりを待たない）
}

/* 奥義を押したら撃てるか、先に試す（2026-10-09・悠さんの指図）。
   奥義の形の内に誰もいないと engine は撃たずに ふつうの攻撃へ落とす。
   それだと「押したのに勝手に攻撃した」になるので、釦は押せても何も起きないようにした
   （一言を出す案もあったが、悠さんの判断で「反応しない」ほうに）。
   いまの指図に奥義を一つ足して解いてみて、engine が ultMiss の印を残したら撃てない。
   解いた結果は捨てて、もとの BATTLE.res に戻す。同じ手番では一度だけ試す */
function ultWouldMiss(a) {
  const b = BATTLE;
  const key = `${a.unit}:${a.turn}:${b.commands.length}`;
  if (b._umKey === key) return b._umMiss;
  const keep = b.res, from = keep.log.length;
  b.commands.push({ unit: a.unit, turn: a.turn, type: 'ult' });
  let miss = false;
  try {
    resolve();
    miss = b.res.log.slice(from).some(e => e.type === 'ultMiss' && e.src === a.unit);
  } catch (_) { miss = false; }
  finally { b.commands.pop(); b.res = keep; }
  b._umKey = key; b._umMiss = miss;
  return miss;
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
    /* 癒しを盤にも効かせる（2026-10-02）。
       ここが抜けていたので、削られた見かけはターンの終わりまで下がりっぱなしで、
       次のスナップショットで急に戻っていた。
       遊ぶ人には「兵量0なのに立っている」「0から回復して生き返った」と見えていた。
       all は味方ぜんぶ（e.src の陣営） */
    case 'heal': {
      const amt = e.v || 0;
      if (e.all) {
        const side = String(e.src || '')[0];
        for (const u of live.values())
          if (u.alive && u.id.startsWith(side + '-')) u.hp = Math.min(u.maxHp, u.hp + amt);
      } else { const t = get(e.tgt); if (t) t.hp = Math.min(t.maxHp, t.hp + amt); }
      break; }
    // 受けた分をそのまま戻す（2026-10-02）
    case 'damageToHeal': { const t = get(e.tgt); if (t) t.hp = Math.min(t.maxHp, t.hp + (e.v || 0)); break; }
    // 兵量1で耐えた（2026-10-02）。engine が残りの兵量を渡してくる
    case 'endure': { const t = get(e.tgt); if (t) { t.alive = true; t.hp = e.hp != null ? e.hp : Math.max(1, t.hp); } break; }
    case 'ko': { const t = get(e.tgt); if (t) { t.alive = false; t.hp = 0; } break; }
    /* ひるんで手番を落とした（2026-10-04）。
       ひるみは1ターンでターンの頭の写しには乗らないので、ここで印だけ足す。
       次の写しで消える */
    case 'flinch': { const t = get(e.src); if (t) t.st = [...new Set([...(t.st || []), 'ひるみ'])]; break; }
    /* 強化・弱化の矢印は、掛かったその場で出す（2026-10-04）。
       次のターンの頭の写しで改めて作り直されるので、ここでは足すだけでよい */
    case 'buff': { const t = get(e.tgt); if (!t) break;
      const mods = [...(t.mods || [])];
      if (!mods.some(m => m.stat === e.stat && !!m.up === !!e.up)) mods.push({ stat: e.stat, up: !!e.up });
      t.mods = mods; break; }
    case 'withdraw': { const u = get(e.src); if (u) u.alive = false; break; }
    case 'revive': { const t = get(e.tgt); if (t) { t.alive = true; t.hp = e.hp != null ? e.hp : Math.max(t.hp, 1); } break; }
  }
  /* 最後の歯止め（2026-10-02）。
     engine は兵量が0になった者をその場で退かせるので、立っている者の兵量は必ず1以上。
     盤の引き算がどこかで取りこぼしても、0は「退いた」としか読ませない */
  for (const u of live.values()) if (u.alive && u.hp <= 0) u.hp = 1;
}
const liveUnits = () => [...BATTLE.live.values()];
function troops(units, side) {
  /* 端数は見せない（2026-10-04）。感電の目減りが割合ぶんなので、
     足し合わせると「7,262.855」のような小数になって出ていた。
     天守（K-0）は守り手（B軍）のうちに数える（2026-10-04）。
     前は頭文字が B- の者しか足していなかったので、
     守り兵を払った時点で朱の帯が 0 になり、城がまだ立っているのに
     「終わらない」と見えていた */
  const mine = u => u.id.startsWith(side + '-') || (side === 'B' && u.id.startsWith('K-'));
  return Math.round(units.filter(mine).reduce((a, u) => a + Math.max(0, u.hp), 0));
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
  return u ? boardCellOf(boardCache, u.x, u.y, BATTLE.rules.board.width, BATTLE.rules.board.height) : null;
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
  /* いま誰が動いているか（2026-10-03）。盤の外の顔の列で、その札だけ光らせる。
     出来事の起こし手（e.src）がそのまま手番の者になる */
  if (e.src) BATTLE.actor = e.src;
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
    case 'flinch':
      applyEvent(live, e); drawBattle(); await sleep(260); return;

    case 'buff':
      applyEvent(live, e); drawBattle(); return;

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
      /* 奥義の一枚絵だけは、仕上がるのを ひと呼吸（最大450ms）待つ（2026-10-05）。
         開戦の札（1.2秒）の裏で読んでいるが、電波が細いと間に合わず
         帯に落ちていた（千リキュパグの奥義・悠さんの実測）。
         間に合わなければ これまでどおり帯。戦は止まらない */
      const uart = cutinArt(no, '奥義');
      if (uart) await artWait(uart, 600);
      const ms = cutIn(document.body, { name: e.name, skill: ultNameOf(no),
                                        art: uart, img: faceUrl(no, '不敵') || cutinUrl(no), kind: 'ult' });
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
      /* 技の名は エンジンが残した名を先に使う（2026-10-01）。
         継承で入れた◆はマスタ（characters.json）に無いので、
         武将の番号から引くと「固有」としか出せなかった。
         ◆は同時にいくつも出るので、二つまで並べて、残りは「ほか」でまとめる */
      const un = (e.skills || []).map(skillShort).filter(Boolean);
      const uname = un.length ? (un.slice(0, 2).join('／') + (un.length > 2 ? '　ほか' : ''))
                              : uniqNameOf(no);
      /* カットインは一戦に一度だけ（2026-10-02）。
         engine が first を立てた回だけ出す。二度目からは光と音で済ませる。
         常時の固有は hold つきで来る＝「名乗りを上げた」だけで、効き目はもう乗っている */
      if (!e.first) { await sleep(120); return; }
      const ms = cutIn(document.body, { name: e.name, skill: uname,
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

    /* 癒しを目に見えるようにした（2026-10-04）。
       これまで何も出していなかったので、兵量が戻っても盤では気づけなかった。
       水色で「＋いくつ」を浮かせる。味方みなへの癒し（e.all）は一人ずつ出す */
    case 'heal': {
      applyEvent(live, e); drawBattle();
      const amt = Math.round(e.v || 0);
      if (amt <= 0) return;
      SFX.heal();
      const show = id => { fxBurst(cellOf(id), 'heal', { ms: 360 }); popNumber(cellOf(id), '+' + num(amt), 'heal hp'); };
      if (e.all) {
        const side = String(e.src || '')[0];
        for (const u of live.values()) if (u.alive && String(u.id).startsWith(side + '-')) show(u.id);
      } else show(e.tgt);
      await sleep(90); return;
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
  /* 手番の者を、顔の列を組み直す前に決めておく（2026-10-03）。
     ・指図待ち … その武将
     ・流れているあいだ … 直前に出来事を起こした者（showEvent が入れている）
     ・戦が終わったら … 誰も光らせない */
  if (res.awaiting && BATTLE.shown >= res.log.length && !BATTLE.busy) BATTLE.actor = res.awaiting.unit;
  else if (!res.awaiting && BATTLE.shown >= res.log.length && !BATTLE.busy) BATTLE.actor = null;
  for (const n of boardCache.querySelectorAll('.reach,.go-move,.go-atk,.go-wait')) n.remove();
  render(boardCache, pawnCache, units, BATTLE.rules);
  /* 帯と顔の列は「自分が手前（青・下）」にそろえる（2026-10-05）。
     果たし合いで後手に座ると、自分の軍が朱の帯・上の列に出ていて読み違えた */
  const meS = mySide(), foeS = meS === 'A' ? 'B' : 'A';
  const ta = troops(units, meS), tb = troops(units, foeS);
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
  rosterRow($('#rosterB'), foeS);   // 上の列＝相手
  rosterRow($('#rosterA'), meS);    // 下の列＝自分

  // 盤面の右上：いまどちらで動いているか。予約中なら「次ターンから」を添える
  const ab = $('#autoBtn');
  if (ab && (BATTLE.spar || BATTLE.bout || BATTLE.away)) ab.style.display = 'none';   // 稽古と番付は切り替えさせない
  if (ab && !BATTLE.spar && !BATTLE.bout) {
    const man = manualNow(), pend = pendingSwitch();
    ab.className = 'autobtn' + (man ? ' man' : '');
    ab.querySelector('.lbl').textContent = man ? '手動' : 'オート';
    ab.querySelector('.g').textContent = pend ? `${pend.turn}Tから${pend.manual ? '手動' : 'オート'}` : '';
  }

  // 手動操作のパネル
  /* 果たし合いでは、自分の駒の番でないと操れない（2026-10-04） */
  const myTurn = !BATTLE.duel
    || String((res.awaiting || {}).unit || '').startsWith(BATTLE.duel.side + '-');
  const waiting = res.awaiting && BATTLE.shown >= res.log.length && !BATTLE.busy && myTurn;
  const foeTurn = !!BATTLE.duel && !!res.awaiting && BATTLE.shown >= res.log.length
                  && !BATTLE.busy && !myTurn;
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
    /* ゲージは溜まっていても、届く相手がいなければ撃てない（2026-10-09）。
       釦は溜まった見た目のまま押せる（押した動きも出る）が、指図は出さない */
    const ultLive = !!canUlt && !ultWouldMiss(a);   // 溜まっていないときは試さない
    const pawn = pawnCache.get(a.unit);
    if (pawn) { pawn.style.outline = '2px dashed #fff'; pawn.style.outlineOffset = '2px'; }
    const W2 = BATTLE.rules.board.width, H2 = BATTLE.rules.board.height;
    const cellAt = (x, y) => boardCellOf(boardCache, x, y, W2, H2);
    /* 誰が敵かは、洗脳を踏まえて決める（2026-10-04）。
       洗脳されている者は向こう側として戦うので、
       寝返った味方は斬る相手になり、寝返らせた敵は斬れない。
       「敵に気づかれない」でいる相手も狙えない（盤に立っていても手が届かない）。
       どちらも頭の上の印（恋・隠）で分かるようにしてある */
    const sideOf = (u) => ((u.st || []).includes('洗脳') ? (u.id[0] === 'A' ? 'B' : 'A') : u.id[0]);
    const myside = sideOf(BATTLE.live.get(a.unit) || { id: a.unit, st: [] });
    const foes = units.filter(u => u.alive && sideOf(u) !== myside
      && !(u.st || []).includes('伏兵')
      && !(u.st || []).includes('洗脳'));
    // 射程1は上下左右だけ、射程2以上は斜めも届く（2026-09-20）
    /* 形で伸ばした射程は「正面」だけ（2026-10-04）。
       素の射程2は斜めにも届くが、「正面2マス」を継いだだけの者は筋の上しか届かない。
       盤の記録に straight が立っていたら、斜めを外す */
    const reachable = f => {
      if (!snap) return false;
      const r = snap.range || 1;
      if (Math.abs(f.x - snap.x) + Math.abs(f.y - snap.y) > r) return false;
      return (r >= 2 && !snap.straight) || f.x === snap.x || f.y === snap.y;
    };
    const inRange = foes.filter(reachable);
    // ボタンでモードを切り替えず、盤面を直接タップして動かす（2026-09-20）
    //   水色のマス＝移動  ／  赤く光る相手＝攻撃

    // 奥義は盤面の右下に丸ボタンで常駐させる（2026-09-20）
    $('#ultBtn').style.display = '';
    $('#ultBtn').classList.toggle('ready', !!canUlt);   // art を消さないよう ready だけ切り替える
    $('#ultBtn').disabled = !canUlt;
    $('#ultBtn').onclick = () => { if (ultLive) command({ type: 'ult' }); };
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
          if ((r < 2 || snap.straight) && nx !== snap.x && ny !== snap.y) continue;
          cellAt(nx, ny).append(el('span', { class: 'reach' }));
        }
      }
    }
    // 攻撃できる相手：赤く光らせて、タップでそのまま攻撃
    for (const f of inRange) cellAt(f.x, f.y).append(el('button', {
      class: 'go-atk', title: `${res.initial.find(u => u.id === f.id)?.name || ''} を攻撃`,
      onclick: () => { SFX.pick(); command({ type: 'attack', tgt: f.id }); } }));
    /* 移動できるマス：水色。タップでそのまま移動（2026-10-04 改）。
       前は上下左右の一マスだけを出していたので、「移動+1」を持つ武将でも
       手で操ると一マスしか動けなかった。歩ける数（snap.move）のぶんだけ、
       通れて空いているマスをたどって広げる */
    let moveCells = 0;
    if (snap) {
      const tiles = Math.max(1, snap.move || 1);
      const blocked = (x, y) => !walkableAt(x, y)
        || units.some(u => u.alive && u.x === x && u.y === y);
      const seen = new Set([snap.y * W2 + snap.x]);
      let edge = [{ x: snap.x, y: snap.y }];
      for (let d = 0; d < tiles && edge.length; d++) {
        const next = [];
        for (const c of edge) for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
          const nx = c.x + dx, ny = c.y + dy;
          if (nx < 0 || nx >= W2 || ny < 0 || ny >= H2) continue;
          if (seen.has(ny * W2 + nx) || blocked(nx, ny)) continue;
          seen.add(ny * W2 + nx);
          next.push({ x: nx, y: ny });
          cellAt(nx, ny).append(el('button', {
            class: 'go-move', title: '移動',
            onclick: () => { SFX.move(); command({ type: 'move', x: nx, y: ny }); } }));
          moveCells++;
        }
        edge = next;
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
    /* 打てる手が一つも無ければ自動で待つ。撃てない奥義は「打てる手」に数えない（2026-10-09）。
       数えると、溜まった釦だけが残って先へ進めなくなる */
    if (!moveCells && !inRange.length && !ultLive) setTimeout(() => command({ type: 'wait' }), 260);
  }
  /* 果たし合いで相手が考えているあいだ（2026-10-04）。
     盤は触れないので、誰の番かだけ知らせる。
     手番の武将には輪を出して、どの駒が動くのかは見えるようにする */
  /* 相手が落ちた。あと何秒で兵量の判定になるかを出す（2026-10-05） */
  if (BATTLE.duel && S.dlGone > 0) {
    panel.append(el('div', { class: 'foeturn gone' },
      el('b', {}, '相手が戻らぬ'),
      el('span', {}, `あと ${S.dlGone} 　… 兵量で決します`)));
  }
  if (foeTurn) {
    const a2 = res.awaiting;
    const pw = pawnCache.get(a2.unit);
    if (pw) { pw.style.outline = '2px dashed #5aa9e6'; pw.style.outlineOffset = '2px'; }
    panel.append(el('div', { class: 'foeturn' },
      el('b', {}, '相手の手番'),
      el('span', {}, (res.initial.find(u => u.id === a2.unit) || {}).name || '')));
  }

  // 決着
  const done = !res.awaiting && BATTLE.shown >= res.log.length && !BATTLE.busy;
  $('#resultBox').innerHTML = '';
  if (done && res.winner) {
    if (!BATTLE._sang) { BATTLE._sang = true; (iWon(res) ? SFX.win : SFX.lose)(); }
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
      const won0 = iWon(res);
      /* 石は「初めて取ったとき」だけ（2026-10-07・悠さんの指図）。
         全国は、その段をまだ抜けていなければ初めて。制覇した国をもう一度攻めても湧かない。

         お祭りは **evDone ではなく evCleared で見る**（2026-10-07・悠さんの実測）。
         evDone は「今日（今週）ぶんを使ったか」で、
         大判小判・武将強化の日のような kind:'free' の祭りでは **いつも false**。
         だから evFirst で見ていると、兵糧のつづく限り何度でも石が湧いていた。
         evCleared は「その級をこれまでに一度でも取ったか」なので、
         何度通っても石が湧くのは最初の一度だけになる。
         小判・品・経験・稽古の書は これまでどおり通うたびに付く */
      const campFirst = !!(BATTLE.camp && BATTLE.camp.step >= prefStep(BATTLE.camp.pref.id));
      const evFirstEver = !!(BATTLE.ev && !evCleared(BATTLE.ev.id, BATTLE.ev.rank));
      const noStone = BATTLE.camp ? !campFirst : BATTLE.ev ? !evFirstEver : false;
      /* 経験は払った兵糧のぶんだけ（2026-10-01）。
         章が進むほど兵糧は重いので、重い戦ほど伸びる */
      const paid = BATTLE.camp ? marchFood(BATTLE.camp.pref, BATTLE.camp.step)
                 : BATTLE.ev ? EV_FOOD[BATTLE.ev.rank]
                 : FOOD_COST;
      BATTLE.reward = BATTLE.duel ? null       // 果たし合いに褒美は無い（2026-10-05）
                    /* 友との手合わせは何度でもできるが、褒美はその日の一戦目だけ（2026-10-10）。
                       f.spar に今日を入れるのは下なので、ここではまだ「一戦目か」が読める */
                    : (BATTLE.bout && BATTLE.bout.friendly) ? (canSpar(BATTLE.bout.npc.id) ? sparReward(won0) : null)
                    : BATTLE.bout ? null
                    : BATTLE.tw ? null
                    : BATTLE.away ? (canSpar(BATTLE.away.id) ? sparReward(won0) : null)
                    : BATTLE.spar ? (canSpar(BATTLE.spar.id) ? sparReward(won0) : null)
                    : BATTLE.ev ? giveReward(won0 && evFirst, rewardMulOf(S.picked), paid, noStone)
                    : giveReward(won0, rewardMulOf(S.picked), paid, noStone);
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
      /* 留守の陣（2026-10-06）。勝敗は稽古とおなじく友ごとに積む。
         そのうえで、留守だった相手の机に置き手紙を残す。
         ここが置き部隊の肝 ── 相手は次に城を開いたとき「守り切ったか」を知る。
         勝ち負けを決めるのは端末（盤は端末にしか無い）。
         つまり嘘の戦果も置ける。いまは友どうしなので、そこは直していない */
      if (BATTLE.away) {
        const f = frState(BATTLE.away.id);
        if (res.winner === 'A') f.win++; else f.lose++;
        f.spar = today();
        savePlayer();
        try { palRaid(BATTLE.away.id, won0); } catch (_) {}
      }
      // 番付の点はその場で動く（2026-09-25）。挑まれたぶんは日が変わってからまとめて
      /* 友との手合わせ（friendly）は点を動かさない（2026-10-09）。
         番付で知り合った相手と遊んでいるだけなので、番付の格には関わらせない。
         勝敗は友ごとの戦績に積む ── 国の主との稽古とそろえる */
      if (BATTLE.bout && !BATTLE.bout.friendly) BATTLE.boutPt = rkFinish(BATTLE.bout, res.winner === 'A');
      if (BATTLE.bout && BATTLE.bout.friendly) {
        const f = frState(BATTLE.bout.npc.id);
        if (res.winner === 'A') f.win++; else f.lose++;
        f.spar = today();
        savePlayer();
      }
      if (!BATTLE.duel) miAfterWin(won0);    // お役目の数（2026-10-02／果たし合いは数えない）
      if (BATTLE.evWon) miEvMat(BATTLE.evWon);
      if (BATTLE.twWon) miBump('twOk');
      miRefresh();   // 制した国の数や称号を、戦のあとに整える（2026-09-24）
      /* 勝敗は画面の下ではなく、中央のポップアップで知らせる（2026-09-23）。
         制覇したときは、勝利のあとにもう一枚「◯◯ 制覇」を続けて出す。
         drawBattle は draw の最後に呼ばれるので、次の回に持ち越して出す */
      /* 負けの札に出す数（2026-09-29）。
         倒した数・討たれた数・かかった手数。褒美が無いぶん、戦いぶりを残す */
      /* 初陣だけは言い方を変える（2026-10-02）。
         勝ち方が「守り切った」でも「総大将撃破」でも、はじめの一戦は「初陣を飾った」でよい */
      S.res = { i: 0, won: iWon(res),
                reason: (BATTLE && BATTLE.first && iWon(res)) ? '初陣を飾った' : res.reason,
                ta, tb, stat: battleStat(res) };
      /* 果たし合いは、決着を座にも告げる（2026-10-04）。
         座が種と指図を丸ごと記すので、あとで同じ戦をやり直せる */
      if (BATTLE.duel) dlReport(res);
      setTimeout(draw, 40);
    }
    /* 下の帯の戦闘結果はやめた（2026-09-23）。
       中央のポップアップで受け取ってもらうので、同じことを二度出さない */
  }
}

/* 戦が終わったときに数えるお役目（2026-10-02）。
   盤面を見た戦も 早送りも、同じここを通す。
   勝ったときだけ数えるものを集めてある（挑んだ数は startBattle 側で数える） */
function miAfterWin(won) {
  if (!won) return;
  miBump('win');
  if (S.form === 'V字') miBump('vWin');
  /* おまかせ＝一度も手で指図しなかった戦。
     modes に manual:true が一つも無ければオートで勝ったとみなす */
  if (!BATTLE || !(BATTLE.modes || []).some(x => x.manual)) miBump('autoWin');
  if (BATTLE && ((BATTLE.spar && BATTLE.spar.duel) || (BATTLE.away && BATTLE.away.duel))) miBump('duelWin');
}
/* 催しの褒美に覚醒の品（具足・軍配・無銘）が入っていたか（2026-10-02） */
function miEvMat(rw) {
  if (!rw || !rw.items) return;
  const n = Object.entries(rw.items)
    .filter(([k, v]) => v > 0 && (ITEMS[k] || {}).kind === '覚醒')
    .reduce((a, [, v]) => a + v, 0);
  if (n) miBump('evMat', n);
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
  let crit = 0, hits = 0, taken = 0, cover = 0, heal = 0;
  /* 武将ごとの控え。傷を与えなかった者も並べたいので、作るところを一つにまとめた */
  const uOf = no => unit[no] || (unit[no] = { no, all: 0, normal: 0, skill: 0, unique: 0,
                                              ult: 0, kaeshi: 0, cover: 0, heal: 0 });
  for (const e of (res.log || [])) {
    const mine = String(e.src || '').startsWith(mySide() + '-');
    if (e.type === 'dmg') {
      if (mine) {
        const v = e.via || 'normal';
        by[v] = (by[v] || 0) + e.v; hits++; if (e.crit) crit++;
        const u = uOf(parseInt(String(e.src).split('-')[1], 10));
        u.all += e.v; u[DMG_FOLD[v] || 'normal'] += e.v;
        if (v === 'counter') u.kaeshi++;
      } else taken += e.v;
      continue;
    }
    if (!mine) continue;
    const no = parseInt(String(e.src).split('-')[1], 10);
    /* かばった数と癒した量も数える（2026-10-01）。
       守り役と癒し役は傷の数字に出ないので、働きが見えなかった */
    if (e.type === 'cover') { uOf(no).cover++; cover++; }
    else if (e.type === 'heal') { uOf(no).heal += (e.v || 0); heal += (e.v || 0); }
  }
  for (const k of Object.keys(by)) by[k] = Math.round(by[k]);
  // 出陣した味方は、傷を与えられなかった者も並べる。「何もできなかった」ことも戦いぶり
  for (const u of us) if (u.side === mySide()) uOf(u.no);
  const units = Object.values(unit).map(u => ({
    ...u, all: Math.round(u.all), normal: Math.round(u.normal),
    /* 奥義ゲージは四捨五入せず切り捨てる（2026-10-04）。
       4.6 が 5 に見えると「押せるのに撃てない」ことが起きる */
    skill: Math.round(u.skill), unique: Math.round(u.unique), ult: Math.floor(u.ult),
    heal: Math.round(u.heal),
    alive: !!(us.find(x => x.side === mySide() && x.no === u.no) || {}).alive,
  /* 並べ替えは 傷＋癒し（2026-10-01）。
     癒しだけの武将がいつも最後に沈んでいたので、働きの大きさで並べる */
  })).sort((a, b) => (b.all + b.heal) - (a.all + a.heal));
  return {
    ko:   us.filter(u => u.side === 'B' && !u.alive).length,
    lost: us.filter(u => u.side === mySide() && !u.alive).length,
    dmg:  Math.round(us.filter(u => u.side === mySide()).reduce((a, u) => a + (u.dmgDealt || 0), 0)),
    taken: Math.round(taken), crit, hits, by, units,
    cover, heal: Math.round(heal),
    kaeshi: Object.values(unit).reduce((a, u) => a + u.kaeshi, 0),
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
    exp ? el('span', {}, curIcon('exp'), `経験 +${exp}`) : null);
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
    add(uiUrl('coin_経験'), '将', '経験', rw.exp);
  }
  if (ev) {
    add(uiUrl('coin_石'), '勾', '勾玉', ev.stone);
    add(uiUrl('coin_小判'), '判', '小判', ev.koban);
    add(uiUrl('coin_魂'), '魂', '魂', ev.soul);
    for (const [k, n] of Object.entries(ev.items || {})) add(itemUrl(k), '具', k, n);
    /* 称号も粒で見せる（2026-10-01）。塔の節目でもらえる。
       数ではなく名を下に添えるので、prizeTile の数の枠には入れない */
    if (ev.title) t.push(prizeTile(frameUrl(ev.title), '称', ev.title, null));
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
        /* 癒した量は、傷の数のとなりに緑で添える（2026-10-01）。
           癒し役は傷が 0 のままなので、これが無いと「何もしていない」に見えていた */
        u.heal ? el('em', { class: 'dgheal' }, '癒 ' + num(u.heal)) : null,
        el('b', { class: 'dgut' }, num(u.all))),
      el('div', { class: 'dgbar' }, el('i', { style: `width:${Math.round(100 * u.all / top)}%` })),
      u.heal ? el('div', { class: 'dgbar heal' },
        el('i', { style: `width:${Math.round(100 * u.heal / top)}%` })) : null,
      el('div', { class: 'dgcs' },
        cell('通常', u.normal), cell('特技', u.skill),
        cell('固有', u.unique), cell('奥義', u.ult),
        el('span', { class: 'dgc' + (u.kaeshi ? '' : ' zero') },
          el('i', {}, '反撃'), el('b', {}, num(u.kaeshi) + '回')),
        el('span', { class: 'dgc' + (u.cover ? '' : ' zero') },
          el('i', {}, 'かばう'), el('b', {}, num(u.cover) + '回')),
        el('span', { class: 'dgc' + (u.heal ? ' heal' : ' zero') },
          el('i', {}, '癒し'), el('b', {}, num(u.heal))))));
}
function dmgSheet() {
  const st = (S.res && S.res.stat) || {};
  const us = st.units || [];
  const close = () => { S.dmg = false; SFX.pick(); draw(); };
  const top = Math.max(1, ...us.map(u => Math.max(u.all, u.heal || 0)));
  return el('div', { class: 'sheet', onclick: e => { if (e.target.classList.contains('sheet')) close(); } },
    el('div', { class: 'card2 dgbox' },
      el('b', { class: 'dgttl' }, '戦いぶり'),
      el('div', { class: 'dgtop' },
        el('div', {}, el('span', {}, '与えた傷'), el('b', {}, num(st.dmg || 0))),
        el('div', {}, el('span', {}, '受けた傷'), el('b', {}, num(st.taken || 0)))),
      /* 守りと癒しも並べる（2026-10-01）。
         傷の数字だけだと、かばい役・癒し役の働きが どこにも残らなかった */
      el('div', { class: 'dgsub' },
        el('span', {}, '撃破 ', el('b', {}, num(st.ko || 0))),
        el('span', {}, '逃走 ', el('b', {}, num(st.lost || 0))),
        el('span', {}, '会心 ', el('b', {}, num(st.crit || 0))),
        el('span', {}, '手数 ', el('b', {}, num(st.turn || 0)))),
      el('div', { class: 'dgsub sub2' },
        el('span', {}, 'かばう ', el('b', {}, num(st.cover || 0) + '回')),
        el('span', {}, '反撃 ', el('b', {}, num(st.kaeshi || 0) + '回')),
        el('span', { class: 'heal' }, '癒し ', el('b', {}, num(st.heal || 0)))),
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
    const toMap = !!BATTLE.camp, toEv = !!BATTLE.ev;
    /* 友との手合わせ（番付で知り合った相手）は、番付ではなく友へ戻す（2026-10-09） */
    const toFr = (BATTLE.spar && BATTLE.spar.id) || (BATTLE.bout && BATTLE.bout.friendly);
    /* 留守の陣のあとは 友の一覧へ返す（2026-10-06）。
       本物の友には「家」が無いので、家ではなく一覧をそのまま開く */
    const toAway = !!(BATTLE.away && BATTLE.away.id);
    const toRk = !!BATTLE.bout && !BATTLE.bout.friendly, rkD = BATTLE.boutPt;
    /* 塔は必ず塔へ返す（2026-10-01）。抜けたなら褒美を、届かなかったなら
       何が足りなかったかを、そのまま塔の画面に出す */
    const toTw = !!BATTLE.tw;
    /* 果たし合いのあとは待ち合いの間へ返す（2026-10-05）。
       前は勝敗を出したきり放置されて、次に何をすればよいか分からなかった */
    if (BATTLE.duel) {
      fxToken++; BATTLE = null; S.res = null; S.dmg = false;
      S.screen = 'home'; S.dl = 'room'; S.dlMsg = '';
      SFX.pick(); draw(); return;
    }
    const twF = toTw ? BATTLE.tw.f : 0;
    const twW = BATTLE.twWon, twN = BATTLE.twNg;
    S.res = null; S.dmg = false;   // 戦いぶりの札も一緒に畳む（2026-09-29）
    /* 初陣（手引きの一戦目）のあとだけは、全国ではなく城へ返す（2026-09-25）。
       ここから手引きが始まるので、まず城の景色を見せたい */
    const toFirst = !!(BATTLE.camp && P.tut2.on && !P.tut2.got && tebikiStep() === 1);
    if (toTw) {
      fxToken++; BATTLE = null;
      S.screen = 'tower'; S.twSel = null;
      /* 勝ったときは何も出さない（2026-10-02）。
         褒美も「抜けた」ことも、勝ちの札でもう見せている。
         塔へ戻ってからもう一度言うと、次の階の課題の邪魔になるだけだった。
         届かなかったときだけ、何が足りなかったかを残す */
      S.twMsg = twW ? '' : `届かなんだ　― ${(twN || []).join('／')}`;
      SFX.pick(); draw(); return;
    }
    if (toMap || toEv || toFr || toRk || toAway) { fxToken++; const id = BATTLE.ev && BATTLE.ev.id; BATTLE = null;
      S.screen = (toEv ? 'event' : (toFr || toRk || toFirst || toAway) ? 'home' : 'map');
      if (toAway) { S.fr = true; S.frId = null; S.frTab = 'my'; S.frMsg = ''; }
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
            el('span', {}, '逃走', el('b', {}, n(st.lost))),
            el('span', {}, '手数', el('b', {}, n(st.turn)))),
          el('p', { class: 'lpsub' }, S.res.skip ? '早送りで決着' : S.res.reason))));
  }
  /* 勝ちの札も一枚絵にした（2026-09-29）。
     金の丸枠に「勝利」の字を重ね、その下に褒美を絵で並べる。
     数は絵の右下に小さく重ねる。受け取る釦は枠の外、いちばん下 */
  if (kind === 'win' && uiUrl('pop_勝利')) {
    const st = S.res.stat || {};
    const n = v => num(v || 0);
    /* 塔の褒美も、ふつうの勝ちと同じ札に並べて「受け取る」で閉じる（2026-10-01）。
       前は塔だけ、画面を押して閉じたあとに塔の画面で文として出していた */
    const pz = prizeRow(rw, BATTLE.evWon || (BATTLE.twWon && BATTLE.twWon.first ? BATTLE.twWon : null));
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
            el('span', {}, '逃走', el('b', {}, n(st.lost))),
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
      (BATTLE.bout && !BATTLE.bout.friendly) ? el('div', { class: 'rw' },
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
    /* 道ごとに題と一言を変え、修羅・魔王は褒美を添える（2026-10-10） */
    const lvU = (mr && mr.lv) || 0;
    const UT = ['——四十七の国、ことごとく従えたり。',
                '——修羅の国々も、ついにひれ伏した。',
                '——魔王の夜は明けた。その名は、いまやそなたのもの。'];
    box = el('div', { class: 'card2 resbox unified m' + lvU },
      el('div', { class: 'wray' }),
      el('b', { class: 'rttl' }, lvU ? `${CAMP_MODE[lvU].short}　天下統一` : '天下統一'),
      el('p', { class: 'rtalk' }, UT[lvU] || UT[0]),
      mr && mr.unifyRw ? el('p', { class: 'rsub' }, giftWords(mr.unifyRw)) : null);
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
/* いまの編成を 陣形の枠に当てはめたときの「深さ」（2026-10-02）。
   engine の layout() と同じ順で並べ、総大将がどの深さに入るかを返す。
   fy は前線からの深さなので 0 がいちばん前。
   { gen, min, max } を返し、gen === min なら前列、gen === max なら後列。
   盤の通れぬマスでずれることはあるが、ずれても自陣の行の内なので
   前後の並びは変わらない。ここは「明らかに違う」ときだけ弾ければよい */
function twPlacePos() {
  const cells = (RULES.formations[S.form] || {}).cells || [];
  const members = S.picked || [];
  if (!cells.length || !members.length) return null;
  const slots = S.slots || [];
  let order, assign;
  if (slots.some(v => v != null)) {
    const rest = members.filter(x => !slots.includes(x.no))
                        .sort((a, b) => (b.cost || 0) - (a.cost || 0));
    order = cells.map((c, i) => ({ c, i }));
    assign = cells.map((_, i) => (slots[i] == null ? null
                                 : members.find(x => x.no === slots[i]) || null));
    assign = assign.map(a => a || rest.shift() || null);
    const pair = order.map((o, i) => ({ o, char: assign[i] })).filter(p => p.char);
    order = pair.map(p => p.o); assign = pair.map(p => p.char);
  } else {
    /* 枠を指していないときは、深いマスから順に 総大将 → コストの高い順 */
    order = cells.map((c, i) => ({ c, i })).sort((a, b) => b.c[1] - a.c[1] || a.i - b.i);
    const gen = members.find(x => x.no === S.general);
    const others = members.filter(x => x.no !== S.general)
                          .sort((a, b) => (b.cost || 0) - (a.cost || 0));
    assign = [gen, ...others].filter(Boolean);
  }
  const fys = assign.map((c, i) => ({ no: c.no, fy: (order[i].c || [0, 0])[1] }));
  if (!fys.length) return null;
  const g = fys.find(x => x.no === S.general) || fys[0];
  return { gen: g.fy, min: Math.min(...fys.map(x => x.fy)),
                      max: Math.max(...fys.map(x => x.fy)) };
}
/* いまの編成では通らないしばり。塔の画面でも出陣の前でも同じものを見る */
const twTeamNg = f => twTeam(f, S.picked || [], S.form, twPlacePos());

function twGo(f) {
  if (f > twFloor()) { S.twMsg = 'まだ、この階には上がれぬ'; SFX.pick(); draw(); return; }
  /* 部隊えらびの札は挟まない（2026-10-01）。
     編成の釦が同じ画面にあるので、札を一枚はさむと手数が増えるだけ */
  twGo2(f);
}
function twGo2(f) {
  const t = towerOf(f); if (!t) return;
  const q = P.squads[P.active];
  if (!q.nos.length) { S.twMsg = '部隊を編成してから挑める'; SFX.pick(); draw(); return; }
  if (dupOrigins(q.nos).length) { S.twMsg = '同じ武将が重なっている'; SFX.pick(); draw(); return; }
  /* しばりのうち、編成で分かるぶんはここで弾く（2026-10-01）。
     戦ってから「役目ちがい」で落とすのは、兵糧も時も無駄にする */
  const ng = twTeamNg(f);
  if (ng.length) { S.twMsg = ng.join('／'); SFX.pick(); draw(); return; }
  if (squadCost(q) > costMax()) { S.twMsg = 'コストが上限を超えている'; SFX.pick(); draw(); return; }
  if (P.stamina < TOWER_FOOD) {
    S.twMsg = `兵糧が足りぬ（要 ${TOWER_FOOD}）`;
    S.foodAfter = () => twGo2(f);
    S.food = true; SFX.pick(); draw(); return;
  }
  P.stamina -= TOWER_FOOD; savePlayer();
  miBump('tower');   // お役目の数（2026-10-02）
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
    addFreeStones(t.rw.stone);             // 褒美の石は必ず無料ストーン（2026-10-07）
    P.koban = (P.koban || 0) + (t.rw.koban || 0);
    for (const [k, v] of Object.entries(t.rw.items || {})) addItem(k, v);
    if (t.rw.title) gainTitle(t.rw.title);
    savePlayer();
  }
  return { first, stone: first ? (t.rw.stone || 0) : 0, koban: first ? (t.rw.koban || 0) : 0,
           items: first ? (t.rw.items || {}) : {}, title: first ? (t.rw.title || null) : null };
}

/* ---- 塔の画面（2026-10-01 改）----
   一覧はやめて、出陣の一枚に全部のせた。
   上＝階と試練の名としばり／真ん中＝待ち受ける敵の立ち姿／下＝褒美と釦。
   はじめて来たときだけ、語りで「どういう場か」を一度だけ伝える */
/* 編成からの戻り先（2026-10-01 → 2026-10-03 に作り直し）。
   もとは「塔か、部隊か」の二択しかなかったので、全国の出陣から編成へ入ると
   戻りが育成の部隊一覧へ飛んでしまっていた。
   入った画面の名を S.teamFrom に覚えておき、そこへ返す */
const TEAM_FROM_NAME = { tower: '塔', march: '全国', squads: '部隊', home: 'ホーム', event: '催し', duel: '果たし合い' };
function twBackWhere() { return S.teamFrom || (S.twBack ? 'tower' : 'squads'); }
function twBackLabel() { return TEAM_FROM_NAME[twBackWhere()] || '部隊'; }
function twBackGo() {
  const to = twBackWhere();
  if (to === 'tower') { S.twBack = false; S.twMsg = ''; }
  S.teamFrom = null;
  /* 果たし合いのルームから編成へ来たときは、ルームへ返す（2026-10-05）。
     'duel' という画面は無いので、ホームの上にルームの札を乗せる。
     ここを素通りさせると、画面の名が見つからず盤も札も出ない崩れ方をする */
  if (to === 'duel') { S.dl = DUEL ? 'room' : 'menu'; return 'home'; }
  return to;
}
function twRow() { return null; }      // 一覧はやめた（名は guidePaint などが探さないよう残す）

/* その階で待ち受ける顔ぶれ。盤に出るのと同じ並びなので、見てから編成を組める */
function twFoes(f) {
  const list = twEnemy(f) || [];
  /* 真ん中に先頭（いちばん兵力を食う＝その階の主）を据え、
     そこから左右へ振り分けて並べる（2026-10-01）。
     真ん中からの隔たり d を札に書き、CSS で奥へ行くほど
     小さく・薄く・下に沈める。立ち姿の奥行きが出る */
  const slots = [];
  list.forEach((c, i) => {
    const d = Math.ceil(i / 2);
    if (i % 2) slots.unshift({ c, d }); else slots.push({ c, d });
  });
  return el('div', { class: 'twfoes' }, slots.map((s, i) => {
    const c = s.c;
    const art = pawnUrl(c.no);
    return el('div', { class: `twfoe d${Math.min(2, s.d)}` + (art ? ' art' : ''),
      style: `animation-delay:${i * 70}ms` },
      art ? keepImg({ src: art, alt: c.name || '' })
          : el('i', { style: chipStyle(c) }, (c.name || '')[0] || '?'),
      el('span', {}, (c.name || '').slice(0, 5)));
  }));
}
/* 櫓の主（十階ごと）の褒美を見る札 */
function twBossSheet() {
  const close = () => { S.twPz = false; draw(); };
  const now = twFloor();
  const next = Math.min(TOWER_MAX, Math.ceil(now / 10) * 10 || 10);
  const list = TOWER.filter(t => isBoss(t.f));
  return el('div', { class: 'sheet', onclick: e => { if (e.target.classList.contains('sheet')) close(); } },
    el('div', { class: 'card2 twbox' },
      el('b', { class: 'mittl' }, '櫓の主の褒美'),
      el('p', { class: 'note' }, '五階ごとの節目。十階ごとの「大櫓」は称号ももらえる'),
      el('div', { class: 'twbl' }, list.map(t => {
        const done = twGot(t.f);
        return el('div', { class: 'twbr' + (done ? ' done' : '') + (t.f === next ? ' now' : '') },
          el('span', { class: 'twbf' }, `${t.f}階`),
          el('span', { class: 'twbn' }, t.name),
          isGreat(t.f) ? el('span', { class: 'twbg' }, '大') : null,
          el('span', { class: 'twbp' }, curIcon('stone'), el('b', {}, num(t.rw.stone)),
            curIcon('koban'), el('b', {}, num(t.rw.koban || 0))),
          el('span', { class: 'twbt' }, t.rw.title ? `「${t.rw.title}」` : ''),
          done ? el('i', { class: 'twok' }, 'CLEAR') : null);
      })),
      closeX(close)));
}
/* 褒美を四角の粒で並べる（2026-10-01）。石・小判・経験の書・強化の書、そして称号。
   数は粒の右下に小さく重ねる。どれも「置くだけで反映」の絵に乗っている */
function twPrize(t, got) {
  const pz = (icon, n, label) => el('div', { class: 'twpzb', title: label },
    el('span', { class: 'twpzi' }, icon), el('em', {}, n));
  const out = [];
  if (t.rw.stone) out.push(pz(curIcon('stone'), num(t.rw.stone), '石'));
  if (t.rw.koban) out.push(pz(curIcon('koban'), num(t.rw.koban), '小判'));
  for (const [k, v] of Object.entries(t.rw.items || {})) out.push(pz(itemIcon(k), '×' + v, k));
  if (t.rw.title) out.push(pz(el('i', { class: 'twpzt' }, '称'), t.rw.title, '称号'));
  return el('div', { class: 'twprize' + (got ? ' got' : '') }, out,
    got ? el('span', { class: 'twgot' }, '受け取り済み') : null);
}
/* ================= 武将取引所（2026-10-01）=================
   育てた武将を、ほかの主と武士の魂でやりとりする場。
   上＝語り／雇用する・取引に出すの二つ／絞込み／並んでいる札。
   札の下には 魂の粒と値段だけを出す（誰の品かは押せば分かる）。
   仕組み（値ぶみ・売れ方・六時間ごとの検め）は market.js にまとめてある */
const MKSORT = [
  { k: 'price', name: '値段',   up: true,  v: (it, c) => it.price },
  { k: 'cost',  name: 'コスト', up: false, v: (it, c) => c.cost || 0 },
  { k: 'pow',   name: '総合値', up: false, v: (it, c) => mkPower(c, it.st) },
  { k: 'lv',    name: 'レベル', up: false, v: (it, c) => (it.st || {}).lv || 1 },
];
/* フリーワード。武将の名と、奥義・固有・通常特技の名を見て、一部でも当たれば通す */
function mkHit(c, q) {
  if (!q) return true;
  const t = String(q).trim().toLowerCase();
  if (!t) return true;
  const words = [c.name, c.yomi, (c.ultimate || {}).name, (c.unique || {}).name,
                 ...(c.normals || []).map(x => x.name)];
  return words.some(w => String(w || '').toLowerCase().includes(t));
}
function mkFilter(list) {
  const rar = S.mkRar || 'すべて', att = S.mkAtt || 'すべて';
  const so = MKSORT.find(x => x.k === (S.mkSort || 'price')) || MKSORT[0];
  const up = S.mkAsc == null ? so.up : !!S.mkAsc;
  const out = list.map(it => ({ it, c: charOf(it.no) })).filter(({ it, c }) => c
    && (rar === 'すべて' || c.rarity === rar)
    && (att === 'すべて' || c.attr === att)
    && mkHit(c, S.mkQ));
  out.sort((a, b) => (so.v(a.it, a.c) - so.v(b.it, b.c)) * (up ? 1 : -1));
  return out;
}
/* 絞込みの段。図鑑とそろえた形だが、並びは取引所のものに替えてある */
function mkRows() {
  const rar = S.mkRar || 'すべて', att = S.mkAtt || 'すべて';
  const so = MKSORT.find(x => x.k === (S.mkSort || 'price')) || MKSORT[0];
  const up = S.mkAsc == null ? so.up : !!S.mkAsc;
  const set = (k, v) => { S[k] = v; SFX.pick(); draw(); };
  return [
    el('div', { class: 'row chapters pfrow' }, ['すべて', ...RAR].map(r => el('button', {
      class: 'chip' + (rar === r ? ' on' : '') + (r !== 'すべて' && rarUrl(r) ? ' ric' : ''),
      onclick: () => set('mkRar', r),
    }, r === 'すべて' ? 'すべて' : rarTag(r)))),
    el('div', { class: 'row chapters pfrow attrf' }, ['すべて', ...ATTRS].map(a => el('button', {
      class: 'chip' + (att === a ? ' on' : '') + (a !== 'すべて' && attrUrl(a) ? ' aic' : ''),
      onclick: () => set('mkAtt', a),
    }, a === 'すべて' ? 'すべて' : attrTag(a, 'sm')))),
    el('div', { class: 'row chapters pfrow' }, MKSORT.map(x => el('button', {
      class: 'chip' + (so.k === x.k ? ' on' : ''),
      title: so.k === x.k ? 'もう一度押すと向きが変わる' : null,
      onclick: () => {
        if (so.k === x.k) S.mkAsc = !up; else { S.mkSort = x.k; S.mkAsc = x.up; }
        SFX.pick(); draw();
      },
    }, x.name, so.k === x.k ? el('i', { class: 'sar' }, up ? '▲' : '▼') : null))),
    /* 名でも技でも探せる一行（2026-10-01／2026-10-06 に作り直し）。
       打っている最中は画面を作り直さず、並んでいる札だけを入れ替える（#mkbody）。
       作り直すと変換の途中が消えて、日本語が打てなかった */
    searchRow('mkqin', S.mkQ, (v) => {
      S.mkQ = v; clearTimeout(MKQ_T); MKQ_T = setTimeout(redraw, 200);
    }, '武将名・特技名でさがす'),
  ];
}
let MKQ_T = null;
/* 並んでいる札だけを組む（2026-10-06）。さがす一行から、ここだけを入れ替える */
function mkBodyEl() {
  const list = mkFilter(mkStock(C));
  return [
    el('p', { class: 'mkcount' }, `${num(list.length)} 件`),
    list.length
      ? el('div', { class: 'mkgrid' }, list.map(({ it, c }) =>
          mkCard(it, c, () => { S.mkMsg = ''; mkOpen(it, c); })))
      : el('p', { class: 'note' }, 'この絞り込みに当てはまる品が無い'),
  ];
}
/* 並ぶ札ひとつ。図鑑と同じ見た目に、下へ 魂の粒と値段を添える */
function mkCard(it, c, onTap) {
  const st = it.st || {};
  /* 位は札の下ぎわに帯で重ねる（2026-10-05・悠さんの指図）。
     前は札の上に一段おいていた（2026-10-01）。絵と喧嘩しないのは良かったが、
     札から浮いて見えて、四列が間延びしていた。
     下ぎわは札の絵でも暗いところなので、黒を薄く敷けば読める */
  return el('button', { class: 'mkc' + (cardArt(c) ? ' art' : ''), onclick: onTap },
    el('span', { class: 'mkcf' },
      cardArt(c) ? cardImg(c) : el('i', { style: chipStyle(c) }, c.name.slice(0, 4)),
      el('span', { class: 'mkclvt' }, `Lv.${num(st.lv || 1)}`)),
    el('span', { class: 'mkcp' }, curIcon('soul'), el('b', {}, num(it.price))));
}
/* 品を札で開く（2026-10-01）。
   図鑑と同じ札をそのまま出し、売り主が育てた値を重ねて見せる */
function mkOpen(it, c) {
  S.detail = c.no; S.side = null;
  S.detailRO = true; S.detailBase = false;
  S.detailSt = it.st || {}; S.detailBuy = it;
  SFX.pick(); draw();
}
/* 札の下の「召し抱える」帯。値段と、足りないときの断りもここに出す */
function mkBuyBar(c, it) {
  const can = (P.soul || 0) >= it.price;
  return el('div', { class: 'mkbuybar', onclick: e => e.stopPropagation() },
    it.who ? el('span', { class: 'mkwho' }, `${it.who} の品`) : null,
    hasCard(c.no) ? el('span', { class: 'mkdup' }, 'すでに召し抱えている。買えば重ねが増える') : null,
    el('button', {
      class: 'go sm', ...(can && !S.mkBusy ? {} : { disabled: true }),
      onclick: e => {
        e.stopPropagation();
        /* サーバーの品は押さえてもらうのを待つ（2026-10-05）。
           待っているあいだ二度押しできないよう、釦を止めておく */
        if (S.mkBusy) return;
        S.mkBusy = true; draw();
        Promise.resolve(mkBuy(it)).then(r => {
          S.mkBusy = false;
          if (r && r.gone) {
            closeDetail();
            S.mkMsg = 'ひと足おそかった。その品はもう売れている';
            SFX.pick(); draw(); return;
          }
          if (!r) { S.mkMsg = '買えなかった'; SFX.pick(); draw(); return; }
          miBump('mkBuy');   // お役目の数（2026-10-02）
          closeDetail();
          S.mkMsg = `${c.name} を召し抱えた`;
          SFX.win(); draw();
        });
      },
    }, S.mkBusy ? '…' : can ? el('span', {}, '召し抱える　', curIcon('soul'), ` ${num(it.price)}`)
           : '武士の魂が足りぬ'));
}
/* 出す札。どの武将を・いくらで */
function mkPutSheet() {
  const close = () => { S.mkPut = null; S.mkMsg = ''; S.mkPEdit = false; draw(); };
  const mine = P.own.filter(no => hasCard(no) && !inSquad(no)).map(charOf).filter(Boolean);
  const c = S.mkPut === true ? null : charOf(S.mkPut);
  if (!c) {
    return el('div', { class: 'sheet', onclick: e => { if (e.target.classList.contains('sheet')) close(); } },
      el('div', { class: 'card2 mkbox' },
        el('b', { class: 'mittl' }, 'どの武将を出すか'),
        el('p', { class: 'note' }, '部隊に入っている武将は出せぬ。出すと手元から消え、売れるか二日たつまで戻らぬ'),
        mine.length ? el('div', { class: 'mkpick' }, mine.map(o => el('button', {
          class: 'mkpc' + (cardArt(o) ? ' art' : ''),
          onclick: () => { S.mkPut = o.no; S.mkPrice = mkWorth(o, charState(o.no));
                           S.mkPEdit = false; SFX.pick(); draw(); },
        }, cardArt(o) ? cardImg(o) : el('i', { style: chipStyle(o) }),
           el('span', { class: 'mkclv' }, `Lv.${num(charState(o.no).lv)}`),
           /* 手持ちの枚数を右下に（2026-10-09・悠さんの指図）。位と同じ見た目で、
              左が位・右が枚数。重ねが何枚あるか見てから出す札を決められる */
           el('span', { class: 'mkccn' }, `×${num(cntOf(o.no))}`))))
          : el('p', { class: 'note warn' }, '出せる武将がおらぬ'),
        closeX(close)));
  }
  const st = charState(c.no);
  const w = mkWorth(c, st), lo = mkLo(w, c), hi = mkHi(w);
  if (!S.mkPrice) S.mkPrice = w;
  const price = Math.max(lo, Math.min(hi, Math.round(S.mkPrice)));
  const bump = d => () => { S.mkPrice = Math.max(lo, Math.min(hi, price + d)); SFX.pick(); draw(); };
  return el('div', { class: 'sheet', onclick: e => { if (e.target.classList.contains('sheet')) close(); } },
    el('div', { class: 'card2 mkbox' },
      el('b', { class: 'mittl' }, `${c.name} を取引に出す`),
      el('div', { class: 'mkdt' },
        el('span', { class: 'mkdf' }, cardArt(c) ? cardImg(c) : el('i', { style: chipStyle(c) })),
        el('div', { class: 'mkdi' },
          el('b', {}, c.name),
          el('div', { class: 'meta' }, rarTag(c.rarity, 'sm'), attrTag(c.attr, 'sm')),
          el('div', { class: 'mkdg' },
            el('span', {}, '位', el('b', {}, `Lv.${num(st.lv)}`)),
            el('span', {}, '覚醒', el('b', {}, num(st.awake || 0))),
            el('span', {}, '手持ち', el('b', {}, `${num(cntOf(c.no))}枚`))))),
      /* 値段（2026-10-01）。±で刻むほか、数を押せばその場で打ち込める。
         上限まで刻むのは骨が折れるので、高く出したい人の逃げ道をつくった */
      el('div', { class: 'mkprice' },
        el('button', { class: 'mkpm', onclick: bump(-Math.max(5, Math.round(w * 0.05))) }, '−'),
        S.mkPEdit
          ? el('div', { class: 'mkpv edit' }, curIcon('soul'),
              el('input', {
                class: 'mkpin', type: 'number', inputmode: 'numeric',
                min: String(lo), max: String(hi), value: String(price),
                onblur: e => {
                  const v = Math.round(+e.target.value || 0);
                  S.mkPrice = Math.max(lo, Math.min(hi, v || price));
                  S.mkPEdit = false; draw();
                },
                onkeydown: e => { if (e.key === 'Enter') e.target.blur(); },
              }))
          : el('button', { class: 'mkpv',
              title: '押すと数を打ち込める',
              onclick: () => { S.mkPEdit = true; SFX.pick(); draw();
                setTimeout(() => { const i = document.querySelector('.mkpin');
                                   if (i) { i.focus(); i.select(); } }, 0); } },
              curIcon('soul'), el('b', {}, num(price))),
        el('button', { class: 'mkpm', onclick: bump(Math.max(5, Math.round(w * 0.05))) }, '＋')),
      el('p', { class: 'note' }, `目安は ${num(w)}　／　${num(lo)} 〜 ${num(hi)} のあいだで決められる`),
      /* 手数料（2026-10-05）。率は出さず、手元に入る額と引かれる額だけ見せる。
         買い手は札の値をそのまま払うので、ここは売り手の話だと分かるように書く */
      el('p', { class: 'note mknet' }, '売れたら手元に入る ', curIcon('soul'),
        el('b', {}, ` ${num(mkNet(price))}`),
        `　（手数料 ${num(mkFee(price))} を引く）`),
      el('p', { class: 'note' }, '安く出すほど早く売れる。二日たっても売れなければ戻ってくる'),
      el('p', { class: 'note warn' }, '出すと、手持ちの枚数も育ちも まるごと預かる'),
      el('div', { class: 'acts2' },
        el('button', { class: 'ghost sm', onclick: close }, 'やめる'),
        el('button', {
          class: 'go sm', disabled: mkCanList(c.no) ? null : true,
          onclick: () => {
            if (S.mkBusy) return;
            S.mkBusy = true; draw();
            Promise.resolve(mkList(c.no, price)).then(r => {
              S.mkBusy = false;
              const ok = !!(r && r.no);
              if (ok) miBump('mkList');   // お役目の数（2026-10-02）
              S.mkPut = null; S.mkPrice = 0; S.mkPEdit = false;
              S.mkMsg = ok ? `${c.name} を取引に出した`
                     : (r && r.full) ? `${MK_MAX}枚までしか出せぬ` : '出せなかった';
              if (ok) SFX.win(); else SFX.pick();
              draw();
            });
          },
        }, '取引に出す')),
      closeX(close)));
}
/* ---- サーバーの取引所に声を掛ける（2026-10-05）----
   ① 売り上げと戻り品を受け取る（mkCollect）
   ② 棚を取り寄せる（mkRefresh・一分は使い回す）
   どちらも非同期。中身が変わったときだけ描き直す。
   繋がらなければ静かに何もしない（「サーバーが無くても遊べる」） */
let mkTicking = false;
function mkTick(force) {
  if (!mkKuraOn() || mkTicking) return;
  mkTicking = true;
  (async () => {
    let moved = false;
    try {
      if (await mkCollect()) moved = true;
      if (await mkRefresh(force)) moved = true;
    } catch (_) { /* 繋がらない。端末の中だけで続ける */ }
    mkTicking = false;
    // 打っている最中は札の並びだけ入れ替える（2026-10-06）
    if (moved && (S.screen === 'market' || S.screen === 'home')) redraw();
  })();
}

function screenMarket() {
  const m = mkState();
  /* 開いたときに取引履歴を確かめる（2026-10-01）。
     前に検めてから六時間たっていなければ何もしない。
     ここは画面を組む前なので、検めた中身をそのまま下の知らせに使える */
  mkSettle(C);
  /* サーバーの棚と売り上げも見にいく（2026-10-05・非同期） */
  mkTick();
  /* 知らせは「まだ見ていない取引履歴」から組む（2026-10-01）。
     検めるのは城でも走るので、売れた中身を その場の返り値だけに頼ると
     先に城で検めたときに知らせが出ないままになる */
  const got = m.log.filter(x => !x.read);
  const sold = got.filter(x => !x.back), back = got.filter(x => x.back);
  if (got.length) S.mkMsg = [
    sold.length ? `${sold.length}件 売れた（魂 +${num(sold.reduce((a, x) =>
      a + (typeof x.net === 'number' ? x.net : x.price), 0))}）` : null,
    back.length ? `${back.length}件 売れずに戻った` : null,
  ].filter(Boolean).join('　／　');
  const tno = talkerNo('market');
  const tc = charOf(tno);
  const tart = faceUrl(tno, '笑顔') || faceUrl(tno, '通常');
  const buy = (S.mkTab || 'buy') === 'buy';
  if (buy) softSet('mkbody', mkBodyEl);     // さがす一行から入れ替える場所（2026-10-06）
  const put = buy ? [] : mkMyList();
  const nextH = Math.ceil(mkNext() / 3600000);
  /* 市の景色（2026-10-02）。bg/market.png。無ければ城の景色に落ちる。
     巻いても背景は動かない（.bgfull は position:fixed） */
  const bg = bgUrl('market') || bgUrl('home');
  return {
    body: el('div', { class: 'mkpage' + (bg ? ' art' : '') },
      keepBg(bg, 'bgfull'),
      el('div', { class: 'gtalk' + (tart ? ' art' : '') },
        tart ? keepImg({ class: 'gtface', src: tart, alt: tc ? tc.name : '' })
             : el('i', { class: 'gtface' }, '犬'),
        el('div', { class: 'gtbub' },
          el('b', {}, tc ? tc.name : 'わんこ'),
          /* 検めの間合いは「取引に出す」の側に書いてある。
             はじめに読む語りで仕組みまで説明すると長い（2026-10-01） */
          el('p', {}, el('em', {}, '取引所だワン！！'),
            '育てた武将を、ほかの主と武士の魂でやりとりする場だワン'))),
      /* 二つの釦。左＝買う、右＝出す */
      el('div', { class: 'mktabs' },
        el('button', { class: 'mktab' + (buy ? ' on' : ''),
          onclick: () => { S.mkTab = 'buy'; S.mkMsg = ''; SFX.pick(); draw(); } },
          el('i', {}, '雇'), '雇用する'),
        el('button', { class: 'mktab' + (buy ? '' : ' on'),
          onclick: () => { S.mkTab = 'sell'; S.mkMsg = ''; mkRead(); SFX.pick(); draw(); } },
          el('i', {}, '商'), '取引に出す',
          mkUnread() ? el('em', { class: 'mktb' }, num(mkUnread())) : null)),
      /* 手持ちの武士の魂（2026-10-07・悠さんの指図）。
         ヘッダーから魂の玉を外したので、使う場であるここに大きく出す。
         払うのも受け取るのも魂だけの場なので、いちばん上に置く */
      el('div', { class: 'card2 mksoul' },
        el('span', { class: 'mks' }, curIcon('soul'), el('b', {}, num(P.soul)), el('em', {}, '武士の魂')),
        el('span', { class: 'mksb' }, '雇うのも 出した品が売れるのも この魂')),
      S.mkMsg ? el('div', { class: 'shopmsg' }, S.mkMsg) : null,
      buy ? el('div', {},
        ...mkRows(),
        /* 札の並びは入れ替えてよい入れ物にまとめる（2026-10-06）。
           さがす一行は この外にあるので、打っている最中も作り直されない */
        el('div', { id: 'mkbody' }, ...mkBodyEl()))
        : el('div', {},
          el('div', { class: 'mkhead' },
            el('b', {}, `出している品　${mkMyCount()} / ${MK_MAX}`),
            /* 「次の更新まで」は、端末だけで出している品があるときだけ出す（2026-10-05）。
               サーバーに出した品は、本物の主が買った時点で売れるので、
               六時間を待つ話にはならない */
            nextH ? el('span', {}, `次の更新まで およそ ${nextH} 時間`) : null),
          put.length
            ? el('div', { class: 'mkgrid' }, put.map(it => {
                const c = charOf(it.no); if (!c) return null;
                return mkCard(it, c, () => {
                  if (S.mkBusy) return;
                  S.mkBusy = true; draw();
                  Promise.resolve(mkPull(it.id)).then(r => {
                    S.mkBusy = false;
                    S.mkMsg = (r && r.no) ? `${c.name} を取り下げた`
                            : (r && r.gone) ? 'ひと足おそかった。その品はもう売れている'
                            : (r && r.offline) ? 'いまは取り下げられぬ（サーバーに繋がっていない）'
                            : '取り下げられなかった';
                    SFX.pick(); draw();
                  });
                });
              }))
            : el('p', { class: 'note' }, 'まだ何も出していない'),
          put.length ? el('p', { class: 'note' }, '札を押すと取り下げる') : null,
          el('button', {
            class: 'go wide', ...(mkMyCount() < MK_MAX ? {} : { disabled: true }),
            onclick: () => { S.mkPut = true; S.mkPrice = 0; S.mkPEdit = false; SFX.pick(); draw(); },
          }, mkMyCount() < MK_MAX ? '武将を出す' : `${MK_MAX}枚まで`),
          el('b', { class: 'mkhead2' }, '取引履歴'),
          m.log.length
            ? el('div', { class: 'mklog' }, m.log.slice(0, 12).map(r => {
                const c = charOf(r.no);
                return el('div', { class: 'mklr' + (r.back ? ' back' : '') },
                  el('span', { class: 'mkln' }, c ? c.name : `No.${r.no}`),
                  r.back ? el('em', {}, '売れずに戻った')
                         /* 入ったのは手数料を引いたあとの額（2026-10-05）。
                            古い覚えには net が無いので price に落ちる */
                         : el('em', {}, curIcon('soul'),
                             ` +${num(typeof r.net === 'number' ? r.net : r.price)}`));
              }))
            : el('p', { class: 'note' }, 'まだ売り買いの覚えが無い')),
      S.mkPut ? mkPutSheet() : null),
    nav: true,
  };
}
function screenTower() {
  const f = twFloor();
  const t = towerOf(f);
  if (!t) return { body: el('div', {}, '天守まで登りきった'), nav: true };
  const tier = towerTier(f);
  const q = P.squads[P.active] || { nos: [] };
  /* いまの編成で通らないしばり（2026-10-02）。
     押してから断られるのではなく、押す前から見えているほうが親切。
     出陣の釦もここで止める（兵糧を捨てずに済む） */
  const ng = q.nos.length ? twTeamNg(f) : [];
  /* はじめの一度だけ、どういう場かを語る（2026-10-01）。
     二度目からは出さない。P.tower.seen に覚える */
  const st = twState();
  const first = !st.seen;
  const tno = talkerNo('tower');
  const tc = charOf(tno);
  const tart = faceUrl(tno, '笑顔') || faceUrl(tno, '通常') || pawnUrl(tno);
  if (first) { st.seen = true; savePlayer(); }
  const bg = bgUrl('tower') || bgUrl('gacha_release') || bgUrl('home');
  return {
    body: el('div', { class: 'twpage' + (bg ? ' art' : '') },
      keepBg(bg, 'bgfull'),
      /* 上：題の額に「第N階」と試練の名を収める（2026-10-01）。
         額の絵（ui/tower_frame.png）が無ければ、金の囲いの札に落ちる */
      (() => {
        const art = uiUrl('tower_frame');
        return el('div', { class: 'twtop' + (art ? ' art' : '') },
          art ? el('div', { class: 'twfrm', style: `background-image:url("${art}")` },
                  el('div', { class: 'twfin' },
                    el('span', { class: 'twfl' },
                      el('em', {}, '第'), el('b', {}, String(f)), el('em', {}, '階')),
                    el('b', { class: 'twname' }, t.name)),
                  /* 五階ごとは櫓の主。十階ごとは大櫓で称号つき（2026-10-01） */
                  isBoss(f) ? el('span', { class: 'twboss' + (isGreat(f) ? ' great' : '') },
                    isGreat(f) ? '大櫓の主' : '櫓の主') : null)
              : el('div', { class: 'twfin' },
                  el('span', { class: 'twfl' },
                    el('em', {}, '第'), el('b', {}, String(f)), el('em', {}, '階')),
                  el('b', { class: 'twname' }, t.name)),
          /* しばりだけを下に出す。場所・兵糧・難しさの行は出さない（2026-10-01 に外した）。
             兵糧は出陣の釦に、場所は盤を見れば分かる */
          el('div', { class: 'twconds' },
            el('span', { class: 'twc' }, el('i', {}, '条'), t.t)));
      })(),
      /* 真ん中：待ち受ける者。忠告はその上に重ねる（2026-10-02）。
         下の釦のそばに置くと、褒美と釦のあいだを押し広げて
         武将が上へせり上がり、課題の帯に頭をぶつけていた */
      el('div', { class: 'twmid' },
        twFoes(f),
        ng.length ? el('p', { class: 'twwarn' },
          el('i', {}, '！'), `いまの編成では通らぬ　― ${ng.join('／')}`) : null),
      first ? el('div', { class: 'gtalk slim twsay' + (tart ? ' art' : '') },
        tart ? keepImg({ class: 'gtface', src: tart, alt: tc ? tc.name : '' })
             : el('i', { class: 'gtface' }, '犬'),
        el('div', { class: 'gtbub' },
          el('b', {}, tc ? tc.name : 'わんこ'),
          el('p', {}, el('em', {}, '試練の塔だワン！！'),
            'ここは変わった戦ばかりだワン。しばりを守って勝つたびに褒美がもらえるワン。'
            + '一階ずつしか登れぬが、何度でも挑めるワン'))) : null,
      /* 下：褒美・釦 */
      el('div', { class: 'twfoot' },
        twPrize(t, twGot(f)),
        S.twMsg ? el('p', { class: 'twng' }, S.twMsg) : null,
        /* 脇の二つは木の額の絵（ui/tw_hensei.png / tw_houbi.png）。
           絵が無ければ、これまでどおり一字の丸い印に落ちる（2026-10-01） */
        (() => {
          const side = (file, mark, name, title, go) => {
            const art = uiUrl(file);
            /* 絵には字が彫ってあるので、下の名札は出さない（2026-10-01）。
               絵が無いときだけ、一字の印と名札に落ちる */
            return el('button', { class: 'twsub' + (art ? ' art' : ''), title, onclick: go },
              art ? keepImg({ class: 'twsi', src: art, alt: name })
                  : el('i', {}, mark),
              art ? null : el('span', {}, name));
          };
          return el('div', { class: 'twbtns' },
            side('tw_hensei', '陣', '編成', '部隊を組み直す',
              () => { S.twBack = true; S.teamFrom = 'tower'; S.screen = 'team'; SFX.pick(); draw(); }),
            el('button', { class: 'go twgo',
              disabled: (q.nos.length && !ng.length) ? null : true,
              onclick: () => twGo(f) },
              '出陣', el('em', {}, curIcon('food'), String(TOWER_FOOD))),
            side('tw_houbi', '褒', '褒美', '櫓の主の褒美を見る',
              () => { S.twPz = true; SFX.pick(); draw(); }));
        })(),
        el('div', { class: 'twsq' },
          squadChars(q).map(c => {
            const a2 = pawnUrl(c.no);
            return el('span', { class: 'twsqc' },
              a2 ? keepImg({ src: a2, alt: c.name }) : el('i', { style: chipStyle(c) }));
          }),
          el('em', {}, `${q.nos.length}騎　コスト ${num(squadCost(q))}`))),
      S.twPz ? twBossSheet() : null),
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
  /* 何度でも挑めるお祭り（2026-10-01）は、取ったあとも通せる。
     二度目からは、勝ちのふつうの褒美が付かないだけ（evFirst が false になる） */
  if (evDone(id, rank) && !evRepeat(id)) { S.evMsg = 'この級は、もう取っている'; SFX.pick(); draw(); return; }
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
  /* 石だけは「その級を一度でも取ったか」で見る（2026-10-07）。盤を見る戦と同じ決まり */
  const evFirstEver2 = !evCleared(id, rank);
  BATTLE = { ev: { id, rank }, camp: null,
             reward: giveReward(won && evFirst2, rewardMulOf(S.picked), EV_FOOD[rank], !evFirstEver2),
             march: null, skipped: true };
  BATTLE.evWon = won ? evWin(id, rank) : null;
  if (won) miBump('evOk');   // お役目の数（門出・2026-09-26）
  miAfterWin(won);                           // お役目の数（2026-10-02）
  if (BATTLE.evWon) miEvMat(BATTLE.evWon);
  /* 早送りでも本当の数を出す（2026-09-29）。
     ここは盤面を見せないだけで、戦そのものは同じように解いている */
  const st2 = battleStat(res);
  S.res = { i: 0, won, reason: res.reason || '早送り', ta: 0, tb: 0, skip: true, stat: st2 };
  SFX.pick(); draw();
}

/* 祭りの並び順（2026-10-07・悠さんの指図）。小さいほど上。
   土日限定は週末にしか来ないので、開いている日は一番上に立てる。
   いつでも開いている「大判小判」「武将強化の日」が、ふだんの1番2番 */
const EV_PIN = ['daily_koban', 'daily_book'];
function evSort(x) {
  if (!x.on) return 9;
  if (x.ev.days === 'weekend') return 0;
  if (EV_PIN.includes(x.ev.id)) return 1;
  return 2;
}
/* いつ開く祭りか（2026-10-07）。灰色の帯に出す言葉 */
function evDaysText(ev) {
  return ev.days === 'weekend' ? '土日のみ 開催'
       : ev.days === 'weekday' ? '月〜金 開催'
       : '毎日 開催';
}

function screenEvent() {
  evState();                                  // 日付・週の切り替わりをここで通す
  /* 日が変わって出なくなったお祭りを開いたままにしない（2026-09-29） */
  const o0 = S.evId ? evOf(S.evId) : null;
  const gone = !!(o0 && o0.once && EV_RANKS.every((_, r) => evCleared(o0.id, r)));
  const open = (o0 && evShownToday(o0) && !gone) ? o0 : null;
  if (!open) {
    return {
      body: el('div', {},
        /* 上の語りが同じことを言っているので、ここのひとことは消した（2026-09-29） */
        S.evMsg ? el('div', { class: 'shopmsg' }, S.evMsg) : null,
        /* 今日やっていない祭りも灰色で並べる（2026-10-07・悠さんの指図）。
           前はその日に出るものだけを並べていたので、
           「ほかにどんな祭りがあるのか」が遊ぶ人に分からなかった。
           灰色の上に「土日のみ 開催」と貼って、いつ来ればよいかを見せる。

           並びは四段（evSort）：
             ① 開いている土日限定（特技強化・武士の魂）… 週末だけの顔なので一番上へ
             ② 大判小判・武将強化の日 … いつでも開いている二枚。ふだんはここが1番2番
             ③ そのほかの開いている祭り（武将覚醒・武将獲得）
             ④ 今日は出ない祭り（灰色）
           同じ段のなかは EVENTS に書いた順のまま（並びが日によって踊らないように） */
        /* 一度きりの祭り（武将獲得）は、ぜんぶ取ったら並べない（2026-10-02）。
           級ごとに決まった武将をひとり配る祭りなので、取り切ったら渡すものが無い */
        el('div', { class: 'evlist' }, EVENTS.filter(ev =>
          !(ev.once && EV_RANKS.every((_, r) => evCleared(ev.id, r))))
          .map((ev, i) => ({ ev, i, on: evShownToday(ev) }))
          .sort((a, b) => (evSort(a) - evSort(b)) || (a.i - b.i))
          .map(({ ev, on }) => {
          const done = EV_RANKS.filter((_, r) => evCleared(ev.id, r)).length;
          const left = EV_RANKS.filter((_, r) => evOpen(ev.id, r) && !evDone(ev.id, r)).length;
          const art = uiUrl(ev.icon);
          /* 一枚絵の幟に差し替えた（2026-09-29）。
             app/assets/ui/evbn_<お祭りのid>.webp があれば、その絵ひとつで行をまかなう。
             題も何が出るかも絵に描いてあるので、字の説明は重ねない。
             絵が無ければ、これまでの「印＋題＋ひとこと」の行に落ちる */
          const bn = uiUrl('evbn_' + ev.id);
          /* 褒美は取り切ったが、まだ挑める祭り（武将覚醒）は暗くしない（2026-10-01）。
             今日のぶんを取り終えると allDone で薄くなっていたが、
             「何度でも挑める」ようにしたのに「もう終わり」に見えていた */
          const again = !left && evRepeat(ev.id);
          return el('button', {
            class: 'evrow' + (bn ? ' bn' : '') + (bn && ev.id === 'awake' ? ' hasatt' : '')
                 + (on ? '' : ' off')
                 + (left ? '' : (again ? ' again' : ' allDone')),
            disabled: on ? null : true,
            onclick: on ? () => { S.evId = ev.id; S.evMsg = ''; SFX.pick(); draw(); } : null,
          },
            /* 今日は出ない祭りの帯（2026-10-07）。灰色の上に貼って、いつ来ればよいかを言う。
               親に filter を掛けると子にも効くので、灰色にするのは この帯以外だけ（CSS側） */
            on ? null : el('span', { class: 'evoff' }, evDaysText(ev)),
            bn ? keepImg({ class: 'evbnimg', src: bn, alt: ev.name }) : null,
            /* 今日の軍配の属性は幟の上に出す（2026-09-29）。
               日ごとに替わるので、開かないと分からないのは不親切 */
            /* 今日やっていない祭りには、今日の属性を出さない（2026-10-07）。
               土日の武将覚醒は開いていないので、属性を出すと嘘になる */
            bn && ev.id === 'awake' && on
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
            /* 右上の赤丸（残りの級）は外した（2026-10-02）。
               右の「済んだ数 / 4」で足りるうえ、常設の祭りは毎日 赤丸が点くので、
               「見ていない知らせ」の赤丸と見分けがつかなくなっていた */
            again ? el('em', { class: 'evagain' }, '何度でも') : null,
            /* いつ出る祭りかを右上の丸で出す（2026-10-03）。
               日によって並びが入れ替わるので、「これは土日だけ」と
               分かっていないと、昨日あった祭りが消えたように見えていた */
            (() => {
              const w = ev.days === 'weekend' ? ['土日', '限定']
                      : ev.days === 'weekday' ? ['平日', '限定']
                      : ev.kind === 'weekly'  ? ['週に', '一度'] : null;
              return w ? el('span', { class: 'evlim' }, el('i', {}, w[0]), el('b', {}, w[1])) : null;
            })());
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
          return el('div', { class: 'evrank' + (opened ? '' : ' locked') + (done ? ' done' : '')
            + (done && open.repeat ? ' again' : '') },
            el('div', { class: 'evhd' },
              el('b', {}, rk),
              cleared ? el('span', { class: 'evclr' }, 'CLEAR') : null,
              el('span', { class: 'evfood' }, curIcon('food'), `${EV_FOOD[r]}`)),
            el('div', { class: 'evrw2' }, rwChips(rw)),
            !opened ? el('p', { class: 'note' }, `${EV_RANKS[r - 1]} を取ると開く`)
            : (done && !open.repeat)
              ? el('p', { class: 'note' }, open.kind === 'weekly' ? '今週はもう取った' : '今日はもう取った')
            : el('div', { class: 'acts2' },
                el('button', {
                  class: 'go sm', disabled: P.stamina < EV_FOOD[r] ? null : null,
                  onclick: () => evGo(open.id, r, false),
                }, '挑む'),
                /* 土日の二つ（allRanks）は、まだ取っていなくても早送りできる（2026-09-29）。
                   二日で何度も回る祭りなので、毎回盤面を見るのはかえって重い */
                /* 2026-10-07（悠さんの指図）：**はじめて挑む級は早送りできない**。
                   土日の二つ（allRanks）も、取るまでは盤を見てもらう */
                cleared ? el('button', {
                  class: 'ghost sm', onclick: () => evGo(open.id, r, true),
                }, 'スキップ') : null,
                /* 二度目からは品だけ、という断りをその場に出す（2026-10-01）。
                   数は出さない（「説明しすぎない」の決まり）ので、何が無いかだけ書く */
                (done && open.repeat)
                  ? el('p', { class: 'note evagain' }, '二度目からは、この品だけ')
                  : null));
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
  /* 盤の向き（2026-10-05）。果たし合いで後手（B）に座ったときだけ半回転させ、
     自分の軍が手前に来るようにする。engine はそのまま ── 回すのは描く側だけ。
     boardEl より前に立てること（マスを組むときに向きを見ているため） */
  setBoardRev(!!(BATTLE.duel && BATTLE.duel.side === 'B'));
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
      /* はじめて挑む場では、やり方の釦を出さない（2026-10-07・悠さんの指図）。
         押せない釦を置くより、無いほうが迷わない */
      (BATTLE && BATTLE.firstTry)
        ? el('div', { id: 'autoBtn', class: 'autobtn fixedman' },
            el('span', { class: 'lbl' }, '手動'), el('span', { class: 'g' }, 'はじめて'))
        : el('button', { id: 'autoBtn', class: 'autobtn', onclick: () => toggleAuto() },
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
const STATUS_MARK = { 炎上: '炎', 感電: '電', 混乱: '乱', ひるみ: '怯', 回復不能: '癒', 挑発: '挑', 洗脳: '💕', 伏兵: '👣' };
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
      /* act ＝ いま手番の者（2026-10-03）。
         総大将の金の枠（gen）は残したまま、その外に蒼い輪を重ねる */
      class: 'rc' + (u.alive ? '' : ' dead') + (no === genNo ? ' gen' : '') + (c ? ' tapc' : '')
           + (u.alive && u.id === BATTLE.actor ? ' act' : ''),
      title: c ? `${c.name}　兵量 ${num(hp)} / ${num(u.maxHp || 0)}　（押すと札）`
               : `兵量 ${num(hp)} / ${num(u.maxHp || 0)}`,
      /* 味方は育った姿で出す（2026-10-03）。継承した◆も特技の位もここで確かめたい。
         敵は こちらの育ちと関わりが無いので素のまま */
      /* 一時の増減（u.sd）も渡す（2026-10-08・悠さんの指図）。
         この戦のあいだだけ上がっているぶんを、札の数の下に色で出す */
      onclick: c ? (e => { e.stopPropagation(); SFX.pick(); openCard(c, true, side === 'B', u.sd); }) : null,
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
          ? el('img', { class: 'rko art', src: uiUrl('red_x'), alt: '逃走' })
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
                 home: 'home', dex: 'dex', gacha: 'gachalist', gachalist: 'gachalist',
                 stoneshop: 'gachalist' };
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
      /* 戦と その結果の札は、下の帯で抜けるときに必ず片づける（2026-10-04）。
         前は「合戦の画面にいるとき」だけ片づけていたので、
         早送り（盤面を出さない）の勝ち負けの札は帯を押しても残り、
         裏で画面だけ変わって「どこへも行けない」ように見えていた。
         そのあと札を押すと next() が元の画面へ連れ戻すので、なおさら動かなく見えた。
         褒美は札を出す前にもう配り終えているので、ここで畳んでも取りこぼしは無い */
      if (BATTLE || S.res) { fxToken++; BATTLE = null; S.res = null; S.dmg = false; S.vs = null; }
      S.screen = n.key; S.detail = null; S.rates = false; S.shop = false; S.menu = false;
      S.detailSt = null; S.detailBuy = null;   // 取引所の覚えを持ち越さない（2026-10-05）
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
  trail:   'kamon',    // 落ち延び道中の地図と山札（2026-10-09・真っ黒で寂しかった）
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
  /* ストーン販売所（2026-10-07）。bg/stoneshop.jpg を置けばそれ、
     無ければ家紋の地紋に落ちる（screenBg が BG_FALLBACK を見る） */
  stoneshop: 'stoneshop',
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
  /* 2026-10-07（悠さんの指図）：「武将を枠に引いて置く」が伝わらなかったので
     「武士をドラッグして配置する」に書き替えた。
     カタカナの専門語は避ける決まりだが、ここは伝わるほうを取る */
  { say: ['陣を敷くワン！', '武士をドラッグして配置するワン！置けたら「保存して部隊へ」だワン'],
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
  /* 2026-10-07（悠さんの指図）三つ直した。
     ・「締めはくじ」が何のことか分からないので「祈りおみくじ」に
     ・一祈りの説明は要らない。**十連だけ**差せば引き方は伝わる
     ・くじの画面に入ったら吹き出しは出さない（押したあとに同じ説明が残っていた）。
       差す丸だけ残して、言葉は引っ込める */
  { say: ['祈りおみくじだワン！', '下の帯の「ガチャ」を押すワン。初回の十連はただだワン'],
    quiet: () => S.screen === 'gacha' || S.screen === 'gachalist',
    /* 引き終わるまで続ける（2026-09-30）。帯をえらんで、十連を押すまで */
    auto: () => !P.firstFree,
    find: () => {
      if (S.screen === 'gacha') return gq('.pulls .pull.ten') || gq('.pulls .pull.free');
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
  /* 吹き出しを出さない歩がある（2026-10-07・悠さんの指図）。
     くじの画面では、押したあとも同じ説明が残って邪魔だった。
     差す丸（矢印と光）は残して、言葉だけ引っ込める */
  const quiet = !!(g.quiet && g.quiet());
  let say = document.querySelector('.gdsay');
  if (quiet) { if (say) say.remove(); say = null; }
  if (!say && !quiet) {
    const no = talkerNo('guide' + P.gstep);
    const art = faceUrl(no, '笑顔') || faceUrl(no, '通常') || pawnUrl(no);
    say = el('div', { class: 'gdsay' },
      art ? el('img', { class: 'gdf', src: art, alt: '' }) : el('i', { class: 'gdf' }, '犬'),
      el('div', { class: 'gdb' }, el('b', {}, g.say[0]), el('p', {}, g.say[1])),
      /* 逃げ道（2026-09-30）。戻るなどで思わぬ画面へ行くと、
         指す先が別の画面にあって進めなくなることがあった。いつでも降りられるようにする */
      /* やめた歩を覚えておく（2026-10-02）。
         前は 0 に戻すだけだったので、途中でやめると二度と出てこなかった。
         三本線（環境設定）から、やめた所のつづきに戻れるようにする */
      el('button', { class: 'gdquit', title: '手引きをやめる',
        onclick: () => { P.gquit = P.gstep; P.gstep = 0; savePlayer(); SFX.pick(); draw(); } }, 'やめる'));
    document.body.append(say);
  }
  if (!hit) {                                   // 指す先が無いときは、いつもの下ぎわ
    if (a) a.remove();
    if (say) { say.style.top = ''; say.style.bottom = ''; }
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
  if (!say) return;                             // 言葉を引っ込めた歩は、矢印だけで終わり
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
  if (!document.querySelector('.gdsay') && !document.querySelector('.gdarw')) return;
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
  /* 落ち延び道中（2026-10-08） */
  trail: ['落ち延び道中だワン！！', 'ひとりで札を握って、分かれ道を選びながら三十階を抜けるワン。道は初級・中級・上級。険しい道の国主を討てば、その子の上限が開くワン'],
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
  /* 育成武将の棚は、図鑑と見ているものが違う（2026-10-03）。
     台帳ではなく「手元の子がどこまで育ったか」の棚なので、語りも分けた */
  dexown:  ['育てた子を並べるワン！！', '位も技も、いま育っているままの姿で見られるワン'],
  shop:    ['買い物をするワン！！', '小判・石・軍功で品を換えるワン。兵糧は石の蔵で戻すワン'],
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
  // 図鑑の「育成武将」の棚だけ語りを差し替える（2026-10-03）
  if (screen === 'dex' && S.dexTab === 'own') screen = 'dexown';
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
/* ================= 落ち延び道中（2026-10-08）=================
   札で戦う一人旅。しくみは trail.js、ここは画面だけ。
     trail   … 話の一覧と山札（S.trView＝'list'｜'deck'）
     trfight … 戦のさなか
   P.trail.fight に戦の途中を丸ごと置くので、閉じても続きから戻れる */
const trCur = () => {
  const has = no => no && hasCard(no) && charOf(no);
  if (has(P.trail.cur)) return P.trail.cur;
  const q = P.squads[P.active] || { nos: [] };
  const g = has(q.general) ? q.general : (q.nos || []).find(has);
  return g || (P.own || []).find(has) || 0;
};
/* 連れている武将を、育った値と継いだ技のせた形で */
const trWho = no => { const c = charOf(no); return c ? grownFor(c) : null; };
/* 枠（継いだ技こみ）から札を作る（2026-10-09） */
const trKindsOf = who => trKinds(who, starOf, slotsOf(charOf(who.no) || who));
/* ほかの武将の札の種類（2026-10-10）。育ちは見ない（技の名と★だけ使う）。数は連れている武将の値で決まる */
const trKindsFor = (no, me) => {
  if (me && no === me.no) return trKindsOf(me);
  const c = charOf(no); return c ? trKinds(c, starOf) : [];
};
/* 兵量の上限。特性で上がる武将がいる（2026-10-10） */
const trMx = who => Math.round(trMaxHp(who) * (1 + (trTrait(who).fx.hp || 0)));
/* 札束の一枚 → 札の種類。持ち主の属性と、宿で鍛えたかを乗せる */
function trKdOfEntry(e, who) {
  if (!e || !who) return null;
  const base = trKindsFor(e.no, who).find(k => k.key === e.key);
  if (!base) return null;
  const c = charOf(e.no);
  return { ...base, up: e.up || 0, attr: (c && c.attr) || who.attr, owner: e.no };
}
const trKdOfF = (F, who) => cd => cd && F.cards ? trKdOfEntry(F.cards[cd.c], who) : null;
function trDeckOf(who, kinds) {
  const d = P.trail.deck[who.no];
  return (d && trDeckOk(d, kinds)) ? d : trDefaultDeck(kinds);
}
const trFace = no => faceUrl(no, '通常') || faceUrl(no, '笑顔') || pawnUrl(no);
const TR_ATTR_COL = { 猛将: '#d9544d', 智将: '#7a7ee0', 守将: '#4fa36b', 仁将: '#d98fc0', 神速: '#e0c04a' };

/* 札一枚（2026-10-09 作り直し）。
   技名は上に。絵は種類ごとに今ある素材から替える：
     特技 … cutin/<番号>_特技 ／ 固有 … cutin/<番号>_固有 ／ 奥義 … cutin/<番号>_奥義
     大将特性 … hero/<番号>（横長の一枚絵）。無ければ cutin の攻撃 → 顔 → コマ絵に落ちる
   o は trSpec の返り。sel＝選んでいる／dim＝気が足りない */
const TR_ART_KIND = { sk: '特技', u: '固有', ult: '奥義' };
function trArtOf(no, kind) {
  return (kind === 'gen' ? heroUrl(no) : cutinArt(no, TR_ART_KIND[kind]))
      || cutinArt(no, '攻撃') || trFace(no);
}
function trCardEl(who, kd, o, opt = {}) {
  const w = trWords(o);
  /* ほかの武将の札は、その武将の絵と属性の色で出し、右上に小さく顔を添える（2026-10-10） */
  const own = kd.owner || who.no, attr = kd.attr || who.attr;
  return el('button', {
    class: 'trc k-' + kd.kind + (opt.sel ? ' sel' : '') + (opt.dim ? ' dim' : '') + (opt.small ? ' sm' : '') + (kd.up ? ' up' : '') + (opt.cls ? ' ' + opt.cls : ''),
    style: `--ac:${TR_ATTR_COL[attr] || '#d8a94a'};${opt.style || ''}`,
    'data-h': opt.h != null ? String(opt.h) : null,
    onclick: opt.on || null,
  },
    el('span', { class: 'trcost' }, String(o.cost)),
    el('b', { class: 'trcname' }, trName(kd.sk.name) + (kd.up ? '＋' : '')),
    el('span', { class: 'trcart' },
      keepImg({ class: 'trcimg', src: trArtOf(own, kd.kind), alt: '' }),
      own !== who.no ? keepImg({ class: 'trown', src: trFace(own), alt: '' }) : null,
      el('i', { class: 'trkind' }, TR_KIND_NAME[kd.kind])),
    el('span', { class: 'trcw' }, (opt.full ? w : w.slice(0, 3)).join('\n')));
}

function screenTrail() {
  const no = trCur();
  if (!no) return { body: el('div', { class: 'trpage' }, el('p', { class: 'note' }, 'まだ武将がおらぬ。わんこみくじで武将を集めよ')), nav: true };
  const who = trWho(no);
  const kinds = trKindsOf(who);
  if (S.trView === 'deck') return trDeckScreen(who, kinds);
  const tier = trTier();
  const prog = trProg(no, tier);
  const run = trRunOf(no, tier);
  const mx = trMx(who);
  const trait = trTrait(who);
  const can = trNext(run);
  const isCan = (r, c) => can.some(x => x.r === r && x.c === c);
  const onPath = (r, c) => (run.path || []).some(x => x.r === r && x.c === c);
  /* 道の絵。行は上ほど奥（国主が上、出だしが下）。列は少しずらして手描きらしくする */
  const ROW_H = 70, TOP = 92, W = 100;
  const jx = (r, c) => { let h = (r * 7 + c * 13 + run.part * 5) % 9; return (h - 4) * 1.4; };
  const X = (r, c) => r === 'boss' ? 50 : ((c + 0.5) / TR_COLS) * W + jx(r, c);
  const Y = r => r === 'boss' ? 46 : TOP + (TR_ROWS - 1 - r) * ROW_H + 40;
  const H = TOP + TR_ROWS * ROW_H + 50;
  const lines = [];
  run.map.rows.forEach((row, r) => row.forEach((n, c) => {
    if (!n) return;
    const tgt = r === TR_ROWS - 1 ? [['boss', 0]] : n.nx.map(c2 => [r + 1, c2]);
    for (const [r2, c2] of tgt) {
      const walked = onPath(r, c) && (r2 === 'boss' ? (run.at && run.at.r === 'boss') : onPath(r2, c2));
      lines.push(`<line x1="${X(r, c)}%" y1="${Y(r)}" x2="${X(r2, c2)}%" y2="${Y(r2)}" class="${walked ? 'walk' : ''}"/>`);
    }
  }));
  const node = (r, c, t) => {
    const here = run.at && run.at.r === r && run.at.c === c;
    const ok = isCan(r, c);
    const done = onPath(r, c);
    return el('button', {
      class: 'trnode t-' + t + (trNodeArt(t) && r !== 'boss' ? ' art' : '') + (ok ? ' can' : '') + (done ? ' done' : '') + (here ? ' here' : '') + (r === 'boss' ? ' boss' : ''),
      style: `left:${X(r, c)}%;top:${Y(r)}px`,
      disabled: ok ? null : true,
      onclick: ok ? () => trGo(no, r, c) : null,
    }, r === 'boss' ? keepImg({ class: 'trbossimg', src: pawnUrl((TR_STORY[trFloorOf(run.part, 'boss')] || {}).boss) || '', alt: '' }) : null,
       trNodeArt(t) ? keepImg({ class: 'trnart', src: trNodeArt(t), alt: TR_NODE[t].name }) : el('i', {}, TR_NODE[t].mark));
  };
  const nodes = [];
  run.map.rows.forEach((row, r) => row.forEach((n, c) => { if (n) nodes.push(node(r, c, n.t)); }));
  nodes.push(node('boss', 0, '将'));
  const floorNow = run.at ? trFloorOf(run.part, run.at.r) + 1 : run.part * 10;
  /* 道に入ってきたときだけ、いまいる段まで巻く（押すたびに巻き戻らないように） */
  if (S.trScroll) { S.trScroll = false; setTimeout(() => { const n = document.querySelector('.trnode.can'); if (n) n.scrollIntoView({ block: 'center' }); }, 30); }
  return {
    body: el('div', { class: 'trpage' },
      /* 武将の札（2026-10-10・悠さんの指図）。見本（札で戦う外国の名作の人物えらび）にならい、
         大きな絵・名・兵量・ひとこと・特性を一枚に並べる */
      el('div', { class: 'trhero trsel', style: `--ac:${TR_ATTR_COL[who.attr]}` },
        keepImg({ class: 'trselart' + (heroUrl(no) ? ' wide' : ''), src: heroUrl(no) || pawnUrl(no), alt: who.name }),
        el('div', { class: 'trheroin' },
          el('b', { class: 'trselnm' }, who.name),
          el('div', { class: 'trselst' },
            el('span', { class: 'hp' }, '兵量 ', el('em', {}, `${num(run.hp)}/${num(mx)}`)),
            el('span', { class: 'trprog' }, '到達 ', el('em', {}, String(prog)), ` / ${TR_MAX} 階`)),
          el('p', { class: 'trseld' }, [who.clan, who.attr, who.role].filter(Boolean).join('・')),
          el('div', { class: 'trtrait' },
            el('i', {}, '特'),
            el('div', {}, el('b', {}, trait.name || '特性'), el('span', {}, trait.words))),
          el('div', { class: 'trmiles' }, TR_MILE.filter(m => m.t === tier).map(m =>
            el('span', { class: 'trmile' + (prog >= m.at ? ' on' : '') },
              `${m.at}階　`, [m.sp ? `魂の上限＋${m.sp}` : '', m.lv ? `レベル上限＋${m.lv}` : ''].filter(Boolean).join('・')))),
          el('div', { class: 'trbtns' },
            el('button', { class: 'ghost', onclick: () => { S.trPick = true; SFX.pick(); draw(); } }, '武将をかえる'),
            el('button', { class: 'ghost', onclick: () => { S.trView = 'deck'; S.trDraft = { ...trDeckOf(who, kinds) }; SFX.pick(); draw(); } },
              `山札（${TR_DECK}枚）`)))),
      trTierRow(tier),
      el('div', { class: 'trrun' },
        el('b', {}, `${['一', '二', '三'][run.part]}の部　${TR_PARTS[run.part]}`),
        el('span', {}, `${floorNow ? floorNow + '階' : '出立前'}`),
        el('span', { class: 'trtix' }, itemIcon(TR_TICKET), `×${num(item(TR_TICKET))}`),
        el('div', { class: 'trmebar' }, trBar(run.hp, mx, 0)),
        /* 道中の品と札束（2026-10-10）。旅のあいだだけのもの */
        el('div', { class: 'trbag' },
          el('span', { class: 'trbagl' }, '品'),
          ...[0, 1, 2].map(k => run.items[k]
            ? el('button', { class: 'tritem', onclick: () => { S.trItem = k; SFX.pick(); draw(); } }, itemIcon(run.items[k]))
            : el('span', { class: 'tritem none' })),
          el('button', { class: 'trdeckb', onclick: () => { S.trDeckView = true; SFX.pick(); draw(); } },
            '札束 ', el('em', {}, String((run.cards || []).length)), '枚'))),
      el('div', { class: 'trlegend' }, ['戦', '強', '？', '宿', '商', '宝'].map(t =>
        el('span', {}, trNodeArt(t) ? keepImg({ class: 'trlgart t-' + t, src: trNodeArt(t), alt: '' })
                                    : el('i', { class: 't-' + t }, TR_NODE[t].mark), TR_NODE[t].name))),
      el('div', { class: 'trmap', style: `height:${H}px` },
        /* 線は SVG の名前空間で作らないと描かれないので、文字から起こす */
        el('div', { class: 'trlines', html: `<svg width="100%" height="${H}">${lines.join('')}</svg>` }),
        ...nodes)),
    nav: true,
  };
}
/* 段えらび（2026-10-10・悠さんの指図「道中を初級・中級・上級に分ける」）。
   全国の道えらびと同じ丸い切り替えを使う。前の段をどれか一体で30階まで抜けると次が開く。
   道は段ごとに別に持つので、切り替えても歩きかけの道は消えない */
function trTierRow(cur) {
  return el('div', { class: 'cmrow trtierrow' },
    el('b', { class: 'trtierl' }, '道の険しさ'),
    el('div', { class: 'cmodes' }, TR_TIER.map((m, t) => {
      const ok = trTierOpen(t);
      return el('button', {
        class: 'cmode m' + t + (t === cur ? ' on' : '') + (ok ? '' : ' locked'),
        disabled: ok ? null : true,
        onclick: () => { if (t === cur) return; P.trail.tier = t; S.trScroll = true; savePlayer(); SFX.pick(); draw(); },
      }, ok ? m.n : '？');
    })));
}
/* 道の印の絵（2026-10-09・悠さんの指図）。
     敵・手練れ … ui/trail_enemy（悠さん作の紋）／宝 … ui/trail_treasure（くじの宝箱を切り出した）
     商 … ui/btn_道具（道具の袋・2026-10-09 ホームの袋の座から差し替え）／宿 … ui/trail_rest（作成中。置けばそのまま出る）
   絵が無ければ一字の印に落ちる */
const TR_NODE_ART = { 戦: 'trail_enemy', 強: 'trail_enemy', 宝: 'trail_treasure', 商: 'btn_道具', 宿: 'trail_rest', '？': 'trail_unknown' };
const trNodeArt = t => (TR_NODE_ART[t] && uiUrl(TR_NODE_ART[t])) || null;
const TR_TICKET = '道中手形';
/* 武将ごとの道。無ければ敷く。抜けた階のぶんだけ先の部から始める（10階を抜けていれば二の部から） */
/* 道は段ごとに別に持つ（2026-10-10）。初級は前からの置き場（番号だけ）、中級・上級は「番号@段」 */
const trRK = (no, t) => t ? `${no}@${t}` : no;
function trRunOf(no, t = trTier()) {
  const who = trWho(no); const mx = trMx(who);
  let r = P.trail.runs[trRK(no, t)];
  if (!r || !r.map) {
    const part = Math.min(2, Math.floor(trProg(no, t) / 10));
    r = P.trail.runs[trRK(no, t)] = trRunNew(part, mx, (Date.now() ^ (no * 40503)) >>> 0);
  }
  if (r.hp > mx) r.hp = mx;
  /* 札束が無ければ、組んだ山札から写す（2026-10-10）。前の版の道にも札束を持たせる */
  if (!Array.isArray(r.cards) || !r.cards.length) { const k = trKindsOf(who); r.cards = trCardsFrom(trDeckOf(who, k), k, no); }
  if (!Array.isArray(r.items)) r.items = [];
  return r;
}
const trAddItem = (run, nm) => { if (run.items.length >= TR_ITEM_MAX) return false; run.items.push(nm); return true; };
/* 商人が並べる品は戦の品だけ（兵量で兵量を買うのはおかしいので、兵糧は宝箱と未知の節だけ） */
const TR_SHOP_ITEMS = TR_ITEM_NAMES.filter(n => !TR_ITEMS[n].map);
/* 兵量で払う値（2026-10-10・悠さんの指図「旅の中の通貨は兵量」）。上限に対する割合 */
const trPriceCard = (kd, mx) => Math.round(mx * (kd.kind === 'ult' ? 0.2 : kd.kind === 'u' ? 0.14 : 0.1));
const trPriceItem = (nm, mx) => Math.round(mx * ((TR_ITEMS[nm] || {}).stun || (TR_ITEMS[nm] || {}).burn ? 0.13 : 0.1));
/* 節へ進む（2026-10-10 作り直し・悠さんの指図）
     宿 … 休むか、札を一枚鍛えるか     商 … 兵量を払って札や品を買う
     宝 … 札を三枚から一枚／品／小判と書、のどれか
     ？ … 商・品・宿・敵のどれかになる */
function trGo(no, r, c) {
  const run = trRunOf(no);
  if (!trNext(run).some(x => x.r === r && x.c === c)) return;
  let t = r === 'boss' ? '将' : run.map.rows[r][c].t;
  const floor = trFloorOf(run.part, r);
  const R = { rs: (run.seed ^ (floor * 2654435761) ^ (c * 40503)) >>> 0 };
  const roll = () => trRand(R);
  const unk = t === '？';
  if (unk) { const x = roll(); t = x < 0.35 ? '戦' : x < 0.55 ? '商' : x < 0.8 ? '品' : '宿'; }
  const fight = t === '戦' || t === '強' || t === '将';
  /* 戦は道中手形を一枚使う（2026-10-09）。足りなければ進めない（未知の節も、戦になるときだけ止める） */
  if (fight && item(TR_TICKET) < 1) {
    S.trEv = { t: '手形が足りない', p: '道中手形が尽きたワン。日課「城に戻る」で手に入るワン' };
    SFX.ng && SFX.ng(); draw(); return;
  }
  if (fight) {
    useItem(TR_TICKET, 1);
    const o = t === '将' ? {}
      : t === '強' ? { n: floor >= 15 ? 3 : 2, elite: true, boss: false }
      : { n: floor < 3 ? 1 : (roll() < 0.55 ? 2 : 1), boss: false };
    return trStart(no, floor, { ...o, node: { r, c, t }, unk });
  }
  run.at = { r, c }; run.path = [...(run.path || []), { r, c }]; trFloorDone(no, floor);
  const who = trWho(no);
  const kf = n2 => trKindsFor(n2, who);
  if (t === '宿') run.ev = { k: 'rest', unk };
  else if (t === '商') run.ev = { k: 'shop', unk, cards: trOffer(R, C, no, run.part, 3, kf, 0.2), items: trPick(R, TR_SHOP_ITEMS, 3), sold: [] };
  else if (t === '品') { const nm = TR_ITEM_NAMES[Math.floor(roll() * TR_ITEM_NAMES.length)]; run.ev = { k: 'item', unk, item: nm, got: trAddItem(run, nm) }; SFX.get(); }
  else if (t === '宝') {
    const x = roll(), k = run.part + 1;
    const kb = Math.round((120 + roll() * 200) * k);
    P.koban += kb; SFX.get();
    if (x < 0.4) run.ev = { k: 'chest', mode: 'cards', kb, cards: trOffer(R, C, no, run.part, 3, kf), took: null };
    else if (x < 0.7) { const nm = TR_ITEM_NAMES[Math.floor(roll() * TR_ITEM_NAMES.length)]; run.ev = { k: 'chest', mode: 'item', kb, item: nm, got: trAddItem(run, nm) }; }
    else {
      const kb2 = Math.round((200 + roll() * 400) * k), bk = 1 + Math.floor(roll() * 2) + run.part;
      P.koban += kb2; addItem('稽古の書', bk);
      run.ev = { k: 'chest', mode: 'gold', kb: kb + kb2, bk };
    }
  }
  savePlayer(); draw();
}
/* 階を抜けた。初めてなら褒美、10階ごとに上限が開く */
function trFloorDone(no, floor, t = 0) {
  if (floor + 1 <= trProg(no, t)) return null;
  const before = trBonus(no);
  trSetProg(no, t, floor + 1);
  const rw = trReward(floor, t);
  P.koban += rw.koban; P.soul += rw.soul || 0;
  for (const [nm, n] of Object.entries(rw.books || {})) addItem(nm, n);
  const after = trBonus(no);
  const mile = (after.lv !== before.lv || after.sp !== before.sp) ? { lv: after.lv - before.lv, sp: after.sp - before.sp } : null;
  return { rw, mile };
}
/* 道の出来事の札（2026-10-10 作り直し）。中身は run.ev に置く（閉じても、開き直せば同じ品が並ぶ） */
function trEvSheet() {
  if (S.trEv) {
    const close = () => { S.trEv = null; SFX.pick(); draw(); };
    return el('div', { class: 'sheet' }, el('div', { class: 'card2 trres' },
      el('b', { class: 'trresh' }, S.trEv.t), el('p', {}, S.trEv.p),
      el('button', { class: 'go wide', onclick: close }, 'とじる')));
  }
  if (S.screen !== 'trail') return null;
  const no = trCur(); if (!no) return null;
  const run = P.trail.runs[trRK(no, trTier())]; if (!run) return null;
  const who = trWho(no); const mx = trMx(who);
  if (S.trDeckView) return trDeckViewSheet(who, run);
  if (S.trItem != null) return trItemSheet(who, run, mx);
  const e = run.ev; if (!e) return null;
  const done = () => { run.ev = null; savePlayer(); SFX.pick(); draw(); };
  const head = t => (e.unk ? '？　' : '') + t;
  const box = (...k) => el('div', { class: 'sheet' }, el('div', { class: 'card2 trres trev' }, ...k));
  const cardOf = (en, opt) => { const kd = trKdOfEntry(en, who); return kd ? trCardEl(who, kd, trSpec(who, kd), { small: true, ...opt }) : null; };
  const itemRow = (nm, extra) => el('div', { class: 'trevit' }, itemIcon(nm),
    el('div', {}, el('b', {}, nm), el('small', {}, (TR_ITEMS[nm] || {}).d || '')), extra || null);
  /* 持ち物がいっぱいのときは、いまの品と入れ替えるか、あきらめる */
  const swapRow = () => el('div', { class: 'trevswap' },
    el('small', {}, '品は三つまで。入れ替えるものを選ぶ'),
    el('div', { class: 'trevsw' }, run.items.map((nm, k) => el('button', { class: 'tritem',
      onclick: () => { run.items[k] = e.item; e.got = true; SFX.get(); savePlayer(); draw(); } }, itemIcon(nm)))));
  if (e.k === 'rest') {
    if (e.msg) return box(el('b', { class: 'trresh' }, head('宿場')), el('p', {}, e.msg), el('button', { class: 'go wide', onclick: done }, '先へ'));
    if (e.step === 'up') {
      return box(el('b', { class: 'trresh' }, '札を一枚鍛える'),
        el('div', { class: 'trevcards' }, (e.picks || []).map(ix => {
          const en = run.cards[ix]; const kd = trKdOfEntry(en, who); if (!kd) return null;
          return el('div', { class: 'trevc' },
            trCardEl(who, kd, trSpec(who, kd), { small: true, on: () => {
              en.up = 1; e.msg = `${trName(kd.sk.name)} を鍛えた`; SFX.get(); savePlayer(); draw(); } }),
            el('small', { class: 'trupw' }, trUpWords(who, kd)));
        })),
        el('button', { class: 'ghost wide', onclick: () => { e.step = null; SFX.pick(); draw(); } }, 'もどる'));
    }
    const can = run.cards.some(x => !x.up);
    return box(el('b', { class: 'trresh' }, head('宿場')),
      el('p', {}, '囲炉裏の火があたたかい。どう過ごす？'),
      el('div', { class: 'trevpick' },
        el('button', { class: 'trevbig', onclick: () => {
          const h = Math.round(mx * 0.3); run.hp = Math.min(mx, run.hp + h); e.msg = 'ぐっすり眠った。兵量が戻った'; SFX.heal(); savePlayer(); draw(); } },
          el('b', {}, '休む'), el('small', {}, '兵量が戻る')),
        el('button', { class: 'trevbig', disabled: can ? null : true, onclick: () => {
          const R = { rs: (run.seed ^ ((run.path || []).length * 7777)) >>> 0 };
          e.step = 'up'; e.picks = trPick(R, run.cards.map((x, i) => x.up ? -1 : i).filter(i => i >= 0), 3); SFX.pick(); draw(); } },
          el('b', {}, '鍛える'), el('small', {}, '手持ちの札を一枚強くする'))));
  }
  if (e.k === 'shop') {
    const buy = (id, price, f) => { if (e.sold.includes(id) || run.hp <= price) return; run.hp -= price; f(); e.sold.push(id); SFX.coin(); savePlayer(); draw(); };
    return box(el('b', { class: 'trresh' }, head('商人')),
      el('p', {}, '「兵量と引き換えに、よい品を譲りますワン」'),
      el('div', { class: 'trevhp' }, trBar(run.hp, mx, 0)),
      el('div', { class: 'trevcards' }, e.cards.map((en, k) => {
        const kd = trKdOfEntry(en, who); if (!kd) return null;
        const id = 'c' + k, pr = trPriceCard(kd, mx), sold = e.sold.includes(id);
        return el('div', { class: 'trevc' + (sold ? ' sold' : '') },
          trCardEl(who, kd, trSpec(who, kd), { small: true, dim: !sold && run.hp <= pr,
            on: () => buy(id, pr, () => run.cards.push({ no: en.no, key: en.key, up: 0 })) }),
          el('small', { class: 'trprice' }, sold ? '買った' : `兵量 ${pr}`));
      })),
      el('div', { class: 'trevitems' }, e.items.map((nm, k) => {
        const id = 'i' + k, pr = trPriceItem(nm, mx), sold = e.sold.includes(id);
        const full = run.items.length >= TR_ITEM_MAX;
        return el('button', { class: 'trevib' + (sold ? ' sold' : ''), disabled: (sold || full || run.hp <= pr) ? true : null,
          onclick: () => buy(id, pr, () => trAddItem(run, nm)) },
          itemIcon(nm), el('b', {}, nm), el('small', {}, TR_ITEMS[nm].d), el('em', {}, sold ? '買った' : full ? '品がいっぱい' : `兵量 ${pr}`));
      })),
      el('button', { class: 'go wide', onclick: done }, '立ち去る'));
  }
  if (e.k === 'item' || (e.k === 'chest' && e.mode === 'item')) {
    return box(el('b', { class: 'trresh' }, e.k === 'chest' ? '宝箱' : head('落とし物')),
      e.k === 'chest' ? trChestArt({ koban: e.kb, items: [e.item] }) : null,
      el('p', {}, e.k === 'chest' ? '品がひとつ入っていた' : '道ばたに品がひとつ落ちていた'),
      itemRow(e.item),
      (!e.got && run.items.length >= TR_ITEM_MAX) ? swapRow() : null,
      el('button', { class: 'go wide', onclick: done }, e.got ? '先へ' : 'あきらめて先へ'));
  }
  if (e.k === 'chest' && e.mode === 'cards') {
    return box(el('b', { class: 'trresh' }, '宝箱'),
      trChestArt({ koban: e.kb }),
      el('p', {}, e.took != null ? '札を一枚手に入れた' : '札が三枚。一枚だけ持っていける'),
      el('div', { class: 'trevcards' }, e.cards.map((en, k) => el('div', { class: 'trevc' + (e.took === k ? ' took' : e.took != null ? ' sold' : '') },
        cardOf(en, { on: () => { if (e.took != null) return; e.took = k; run.cards.push({ no: en.no, key: en.key, up: 0 }); SFX.get(); savePlayer(); draw(); } })))),
      el('button', { class: 'go wide', onclick: done }, e.took != null ? '先へ' : '札はとらずに先へ'));
  }
  return box(el('b', { class: 'trresh' }, '宝箱'),
    trChestArt({ koban: e.kb, books: { '稽古の書': e.bk } }),
    el('button', { class: 'go wide', onclick: done }, '先へ'));
}
/* 褒美の粒（2026-10-10 夕・悠さんの指図「報酬はぜんぶ道具の絵で、初めての分も分けずにまとめて」）。
   o = { koban, soul, books: { 名: 冊 }, heal, items: [名] } */
function trPrizes(o) {
  const t = [];
  const add = (a, m, n, c) => { if (c) t.push(prizeTile(a, m, n, c)); };
  add(uiUrl('coin_小判'), '判', '小判', o.koban);
  for (const [nm, n] of Object.entries(o.books || {})) add(itemUrl(nm), '書', nm, n);
  add(uiUrl('coin_魂'), '魂', '武士の魂', o.soul);
  for (const nm of (o.items || [])) add(itemUrl(nm), '品', nm, 1);
  add(null, '兵', '兵量', o.heal);
  return t.length ? el('div', { class: 'pzrow trpz' }, t) : null;
}
/* 宝箱の絵の上に、出てきた品を浮かせる */
function trChestArt(o) {
  const art = uiUrl('trail_treasure') || uiUrl('gacha_box');
  return el('div', { class: 'trchest' },
    el('div', { class: 'trchestglow' }),
    art ? keepImg({ class: 'trchestimg', src: art, alt: '宝箱' }) : el('i', { class: 'trchestimg txt' }, '宝'),
    trPrizes(o));
}
/* 鍛えるとどう変わるか（数は札の面と同じ三つだけ） */
function trUpWords(who, kd) {
  const a = trSpec(who, kd), b = trSpec(who, { ...kd, up: 1 });
  if (trUpKind(kd) === 'c') return `気 ${a.cost} → ${b.cost}`;
  const k = ['dmg', 'blk', 'heal'].find(x => a[x]);
  return k ? `${{ dmg: '打つ', blk: '構え', heal: '癒す' }[k]} ${a[k]} → ${b[k]}` : '効き目が増す';
}
/* 品の札（道の上で押したとき） */
function trItemSheet(who, run, mx) {
  const k = S.trItem, nm = run.items[k];
  const close = () => { S.trItem = null; SFX.pick(); draw(); };
  if (!nm) { S.trItem = null; return null; }
  const it = TR_ITEMS[nm] || {};
  return el('div', { class: 'sheet', onclick: ev => { if (ev.target.classList.contains('sheet')) close(); } },
    el('div', { class: 'card2 trres trev' },
      el('div', { class: 'trevit' }, itemIcon(nm), el('div', {}, el('b', {}, nm), el('small', {}, it.d || ''))),
      el('p', { class: 'note' }, it.map ? 'いま使える' : '戦のさなかに使う'),
      el('div', { class: 'mgrow' },
        it.map ? el('button', { class: 'go', disabled: run.hp >= mx ? true : null, onclick: () => {
          run.hp = Math.min(mx, run.hp + Math.round(mx * it.heal)); run.items.splice(k, 1); S.trItem = null; SFX.heal(); savePlayer(); draw(); } }, '使う') : null,
        el('button', { class: 'ghost', onclick: () => { run.items.splice(k, 1); S.trItem = null; SFX.pick(); savePlayer(); draw(); } }, '捨てる')),
      closeX(close)));
}
/* 札束をながめる */
function trDeckViewSheet(who, run) {
  const close = () => { S.trDeckView = false; SFX.pick(); draw(); };
  return el('div', { class: 'sheet', onclick: ev => { if (ev.target.classList.contains('sheet')) close(); } },
    el('div', { class: 'card2 trres trev' },
      el('b', { class: 'trresh' }, `札束　${run.cards.length}枚`),
      el('p', { class: 'note' }, '旅のあいだだけの札。倒れると、組んだ山札に戻る'),
      el('div', { class: 'trdkv' }, run.cards.map(en => { const kd = trKdOfEntry(en, who); return kd ? trCardEl(who, kd, trSpec(who, kd), { small: true }) : null; })),
      closeX(close)));
}

/* 戦を始める（2026-10-09 作り直し）。i は階（0 から）。o は頭数・手練れ・節の印。
   道の兵量（減ったまま）と商人の品を持ち込む */
function trStart(no, i, o = {}) {
  const who = trWho(no); if (!who) return;
  const run = trRunOf(no);
  P.trail.cur = no;
  const tier = trTier();
  const F = trBattle(i, who, run.cards, C, (Date.now() ^ (no * 2654435761)) >>> 0, starOf, P.lv,
    { ...o, tier, hp: run.hp, ki: run.ki, guard: run.guard, seed: (run.seed ^ (i * 977)) >>> 0, trait: trTrait(who).fx, mx: trMx(who) });
  run.ki = 0; run.guard = 0;
  F.node = o.node || null; F.tier = tier;
  P.trail.fight = F;
  S.trSel = null; S.trItB = null; S.trFx = null; S.trRes = null; S.trQuit = false; S.trBusy = false;
  S.screen = 'trfight'; SFX.start(); draw();
}
/* 山札を組む。種類ごとに −／＋ で枚数を決め、ちょうど10枚で決まる */
function trDeckScreen(who, kinds) {
  const d = S.trDraft || (S.trDraft = { ...trDeckOf(who, kinds) });
  const n = trDeckCount(d);
  const bump = (k, v) => {
    const now = d[k] || 0, nx = now + v;
    if (nx < 0 || nx > trDupMax(k, kinds)) return;
    if (v > 0 && n >= TR_DECK) return;
    d[k] = nx; SFX.pick(); draw();
  };
  return {
    body: el('div', { class: 'trpage' },
      el('div', { class: 'trdeckhd' },
        el('b', {}, `${who.name}の山札`),
        el('span', { class: 'trdn' + (n === TR_DECK ? ' ok' : '') }, `${n} / ${TR_DECK}`)),
      el('p', { class: 'note' }, `一ターンの気は${TR_KI}。札の左上の数が使う気。同じ札を重ねて${TR_DECK}枚にする。旅に出るとき、この${TR_DECK}枚が札束になる`),
      el('div', { class: 'trdeck' }, kinds.map(kd => {
        const o = trSpec(who, kd);
        return el('div', { class: 'trdrow' },
          trCardEl(who, kd, o, { small: true }),
          el('div', { class: 'trdtx' },
            el('b', {}, trName(kd.sk.name)),
            el('p', {}, trWords(o).join('・')),
            el('small', {}, String(kd.sk.text || '').replace(/【[^】]*】/, ''))),
          el('div', { class: 'trdct' },
            el('button', { class: 'sq minus', disabled: (d[kd.key] || 0) < 1 ? true : null, onclick: () => bump(kd.key, -1) }, '−'),
            el('b', {}, String(d[kd.key] || 0)),
            el('button', { class: 'sq plus', disabled: ((d[kd.key] || 0) >= trDupMax(kd.key, kinds) || n >= TR_DECK) ? true : null, onclick: () => bump(kd.key, 1) }, '＋')));
      })),
      el('div', { class: 'trdfoot' },
        el('button', { class: 'ghost', onclick: () => { S.trDraft = trDefaultDeck(kinds); SFX.pick(); draw(); } }, 'おまかせ'),
        el('button', { class: 'go', disabled: trDeckOk(d, kinds) ? null : true,
          onclick: () => {
            P.trail.deck[who.no] = { ...d };
            /* まだ歩き出していない道なら、札束も組み直した山札から写す（2026-10-10） */
            const rn = P.trail.runs[trRK(who.no, trTier())];
            if (rn && !rn.at && !(rn.path || []).length) rn.cards = trCardsFrom(d, kinds, who.no);
            S.trView = 'list'; S.trDraft = null; savePlayer(); SFX.get(); draw(); } }, 'この山札にする'),
        el('button', { class: 'ghost', onclick: () => { S.trView = 'list'; S.trDraft = null; SFX.pick(); draw(); } }, 'やめる'))),
    nav: true,
  };
}

/* 連れていく武将をえらぶ札 */
function trPickSheet() {
  const close = () => { S.trPick = false; SFX.pick(); draw(); };
  const list = (P.own || []).filter(hasCard).map(charOf).filter(Boolean)
    .sort((a, b) => (trProg(b.no, trTier()) - trProg(a.no, trTier())) || (a.no - b.no));
  return el('div', { class: 'sheet', onclick: e => { if (e.target.classList.contains('sheet')) close(); } },
    el('div', { class: 'card2 trpick' },
      el('b', { class: 'sqttl' }, '道中に連れていく武将'),
      el('div', { class: 'trpgrid' }, list.map(c => el('button', {
        class: 'trpc' + (c.no === trCur() ? ' on' : ''), style: `--ac:${TR_ATTR_COL[c.attr]}`,
        onclick: () => { P.trail.cur = c.no; S.trPick = false; S.trScroll = true; SFX.pick(); draw(); },
      },
        keepImg({ src: pawnUrl(c.no), alt: c.name }),
        el('span', {}, c.name),
        el('em', {}, `${trProg(c.no, trTier())}階`)))),
      closeX(close)));
}

/* ---- 戦のさなか（2026-10-09 作り直し）----
   悠さんの指図：見本の絵（札で戦う外国の名作）のように、戦の地を大きく敷いて
   **自分は左・敵は右**に立たせる。札は**敵へ引きずって**使う。
   狙いの要らない札（構え・癒しなど）は、戦の地のどこかへ放せば使える。
   押すだけなら札が大きく開いて中身が読める（使いはしない） */
const TR_IT_MARK = { atk: '攻', guard: '守', buff: '昂' };
function trIntentEl(f) {
  const it = f.it; if (!it || f.hp <= 0) return el('span', { class: 'trit none' });
  if (f.stun) return el('span', { class: 'trit stun' }, 'ひるみ');
  return el('span', { class: 'trit ' + it.k + (it.ult ? ' ult' : '') },
    el('i', {}, it.ult ? '奥' : TR_IT_MARK[it.k] || '？'),
    it.k === 'atk' ? `${it.n}${it.x ? '×' + it.x : ''}` : null);
}
function trBar(hp, mx, blk) {
  return el('div', { class: 'trbar' },
    el('i', { style: `width:${Math.max(0, Math.min(100, hp / mx * 100))}%` }),
    el('span', {}, `${num(hp)}/${num(mx)}`),
    blk ? el('em', { class: 'trblk' }, String(blk)) : null);
}
const trFxOf = (who, i) => (S.trFx || []).filter(e => who === 'pl'
  ? (e.t === 'hurt' || e.t === 'heal' || e.t === 'blk' || e.t === 'dodge' || e.t === 'revive') : e.f === i);
function trFloat(list) {
  return list.length ? el('div', { class: 'trfx' }, list.map(e =>
    el('b', { class: 'fx-' + e.t }, e.t === 'hit' || e.t === 'hurt' ? (e.n ? `-${e.n}` : '防')
      : e.t === 'heal' || e.t === 'fheal' ? `+${e.n}` : e.t === 'blk' || e.t === 'fblk' ? `構${e.n}`
      : e.t === 'ko' ? '討' : e.t === 'stun' ? 'ひるみ' : e.t === 'dodge' ? 'かわした' : e.t === 'skip' ? '…'
      : e.t === 'revive' ? '踏みとどまった' : e.t === 'fbuff' ? '昂る' : ''))) : null;
}
/* 敵の立ち位置（左からの%と、奥行き）。三体なら一体を奥に下げる */
const TR_FOE_POS = { 1: [[68, 0]], 2: [[56, 0], [82, 1]], 3: [[50, 0], [70, 1], [88, 0]] };

/* 札を使う（引きずって放したところで決める）。ti は狙う敵、なければ -1 */
function trUse(h, ti) {
  const F = P.trail.fight; if (!F || F.over || S.trBusy) return false;
  const who = trWho(F.no), kdOf = trKdOfF(F, who);
  const card = F.hand[h]; if (!card) return false;
  const kd = kdOf(card); if (!kd) return false;
  const o = trSpec(who, kd, F);
  if (o.cost > F.ki) { SFX.ng && SFX.ng(); return false; }
  if (o.need && ti < 0) {
    const live = trLive(F);
    if (live.length !== 1) return false;          // 敵がひとりなら、どこへ放してもその敵へ
    ti = F.foes.indexOf(live[0]);
  }
  const ev = trPlay(F, h, ti < 0 ? 0 : ti, who, kdOf);
  if (!ev) return false;
  S.trSel = null; S.trFx = ev;
  /* 動きの控え（2026-10-09・悠さんの指図「攻撃にアクションを」）。描き直したあと trAnimate が拾う */
  const hits = [...new Set(ev.filter(e => e.t === 'hit').map(e => e.f))];
  S.trAnim = { who: 'pl', no: kd.owner || F.no, kind: kd.kind, name: trName(kd.sk.name), hits,
               ult: kd.kind === 'ult', atk: hits.length > 0, ko: ev.some(e => e.t === 'ko') };
  setTimeout(() => { if (S.trFx === ev) S.trFx = null; }, 700);
  if (ev.some(e => e.t === 'ko')) SFX.ko(); else if (kd.kind === 'ult') SFX.ult();
  else if (ev.some(e => e.t === 'hit')) SFX.hit(); else if (ev.some(e => e.t === 'heal')) SFX.heal(); else SFX.pick();
  draw();
  if (F.over) trFinish();
  return true;
}
/* 手札の一枚に、引きずる手ざわりを付ける。
   描き直すと札が作り直されるので、引いているあいだは draw() を呼ばない */
function trDrag(node, h, need) {
  node.addEventListener('pointerdown', e => {
    if (S.trBusy || !P.trail.fight || P.trail.fight.over) return;
    if (e.button != null && e.button !== 0) return;
    const sx = e.clientX, sy = e.clientY;
    const base = node.style.transform;
    let moved = false, hov = null;
    try { node.setPointerCapture(e.pointerId); } catch (_) {}
    const field = document.querySelector('.trfield');
    const hit = (x, y) => {
      const foe = document.elementsFromPoint(x, y).map(n => n.closest && n.closest('.trfoe')).find(n => n && !n.classList.contains('dead'));
      return foe || null;
    };
    const mv = ev => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (!moved && Math.hypot(dx, dy) < 10) return;
      if (!moved) { moved = true; node.classList.add('drag'); document.body.classList.add('trdragging'); }
      node.style.transform = `translate(${dx}px, ${dy}px) scale(1.12) rotate(0deg)`;
      const f = need ? hit(ev.clientX, ev.clientY) : null;
      if (hov !== f) { if (hov) hov.classList.remove('hov'); hov = f; if (hov) hov.classList.add('hov'); }
      if (field) {
        const fr = field.getBoundingClientRect();
        field.classList.toggle('drop', !need && ev.clientY < fr.bottom - 10);
      }
    };
    const up = ev => {
      node.removeEventListener('pointermove', mv);
      node.removeEventListener('pointerup', up);
      node.removeEventListener('pointercancel', up);
      document.body.classList.remove('trdragging');
      if (hov) hov.classList.remove('hov');
      if (field) field.classList.remove('drop');
      if (!moved) { S.trSel = S.trSel === h ? null : h; S.trItB = null; SFX.pick(); draw(); return; }
      node.classList.remove('drag');
      const fr = field ? field.getBoundingClientRect() : null;
      const inField = fr && ev.clientY < fr.bottom - 10;
      let ok = false;
      if (need) {
        const f = hit(ev.clientX, ev.clientY);
        if (f) ok = trUse(h, +f.dataset.i);
        else if (inField) ok = trUse(h, -1);
      } else if (inField) ok = trUse(h, -1);
      if (!ok) { node.style.transform = base; }
    };
    node.addEventListener('pointermove', mv);
    node.addEventListener('pointerup', up);
    node.addEventListener('pointercancel', up);
  });
}
/* 戦の途中の札を、いまの札の印に直す（2026-10-09・悠さんの実機で「旅を押しても開かない」）。
   札の印を u／n0／n1 から枠の番号 s0〜s2 に変えたので、その前から続いていた戦の札が
   見つからず、画面を描くところで止まっていた。古い印は読み替え、読めない札は捨てる。
   武将が持っていない（解雇した）ときは、その戦をあきらめて道へ戻す */
const TR_OLD_KEY = { u: 's0', n0: 's1', n1: 's2', n2: 's2' };
/* 札束の前の版（2026-10-10 より前）の戦は、札が { key } だけを持つ。札束を作って { c } に読み替える */
function trFixFight(F, who, kinds) {
  if (!F.pl) return false;
  if (!Array.isArray(F.cards)) {
    const keys = new Set(kinds.map(k => k.key)); const cards = [], idx = {};
    const conv = list => (list || []).map(cd => {
      let k = cd && cd.key; if (k && !keys.has(k)) k = TR_OLD_KEY[k];
      if (!k || !keys.has(k)) return null;
      if (idx[k] == null) { idx[k] = cards.length; cards.push({ no: F.no, key: k, up: 0 }); }
      return { u: cd.u, c: idx[k] };
    }).filter(Boolean);
    for (const k of ['draw', 'hand', 'disc', 'gone']) F[k] = conv(F[k]);
    F.cards = cards;
  }
  const ok = cd => cd && F.cards[cd.c] && trKdOfEntry(F.cards[cd.c], who);
  for (const k of ['draw', 'hand', 'disc', 'gone']) F[k] = (F[k] || []).filter(ok);
  for (const f of F.foes || []) {
    if (!f.cards) f.cards = { atk: [], guard: [], buff: [] };
    for (const k of ['ph', 'ult', 'pump', 'mom', 'weakT', 'vuln', 'stun', 'burn', 'burnT', 'seal', 't'])
      if (typeof f[k] !== 'number') f[k] = 0;
  }
  for (const k of ['daze', 'burn', 'burnT', 'crack', 'seal', 'tough', 'ward']) if (typeof F.pl[k] !== 'number') F.pl[k] = 0;
  return true;
}
function screenTrFight() {
  if (S.trAnim) setTimeout(trAnimate, 0);
  const F = P.trail.fight || (S.trBanner && S.trBanner.F);
  if (!F) { S.screen = 'trail'; return screenTrail(); }
  const who = charOf(F.no) && hasCard(F.no) ? trWho(F.no) : null;
  if (!who) { P.trail.fight = null; S.screen = 'trail'; return screenTrail(); }
  const kinds = trKindsOf(who);
  if (!trFixFight(F, who, kinds)) { P.trail.fight = null; S.screen = 'trail'; return screenTrail(); }
  const kdOf = trKdOfF(F, who);
  const run = trRunOf(F.no, F.tier || 0);
  const s = TR_STORY[F.i];
  const busy = !!S.trBusy || !!S.trBanner;
  const pl = F.pl;
  const bg = stageUrl((s.g || '草原') + '_背景') || stageUrl(s.g || '草原') || bgUrl('battle');
  const tags = [
    pl.might ? '勢い' : null, pl.weak ? '削がれ' : null, pl.dodge ? 'かわし' : null, pl.crit ? '冴え' : null,
    pl.thorns ? '返し' : null, pl.revive ? '踏ん張り' : null, pl.charge ? '奥義が軽い' : null,
    pl.crack ? '崩れ' : null, pl.burnT > 0 ? '炎' : null, pl.seal ? '封' : null, pl.daze ? 'ひるみ' : null,
  ].filter(Boolean);
  const pos = TR_FOE_POS[Math.min(3, F.foes.length)] || TR_FOE_POS[3];
  const n = F.hand.length;
  const sel = S.trSel != null ? F.hand[S.trSel] : null;
  const selKd = sel ? kdOf(sel) : null;
  /* 道中の品（2026-10-10）。押すと下の欄に中身と「使う」が出る */
  const itSel = S.trItB != null ? run.items[S.trItB] : null;
  const useIt = () => {
    const k = S.trItB, nm = run.items[k]; if (!nm || busy || F.over) return;
    const ev = trUseItem(F, nm); if (!ev) return;
    run.items.splice(k, 1); S.trItB = null; S.trSel = null; S.trFx = ev;
    setTimeout(() => { if (S.trFx === ev) S.trFx = null; }, 700);
    if (ev.some(x => x.t === 'heal')) SFX.heal(); else SFX.get();
    savePlayer(); draw();
  };
  const hand = el('div', { class: 'trhand' }, F.hand.map((cd, h) => {
    const kd = kdOf(cd);
    const o = trSpec(who, kd, F);
    const off = h - (n - 1) / 2;
    const node = trCardEl(who, kd, o, {
      h, sel: S.trSel === h, dim: o.cost > F.ki,
      style: `--r:${off * 5}deg;--y:${Math.abs(off) * Math.abs(off) * 4}px;z-index:${10 + h}`,
    });
    trDrag(node, h, o.need);
    return node;
  }));
  return {
    bare: true,
    body: el('div', { class: 'trfight' },
      el('div', { class: 'trfield', style: bg ? `background-image:url("${bg}")` : '' },
        el('div', { class: 'trfhd' },
          el('span', {}, el('em', {}, `${F.i + 1}階`), s.t),
          el('span', { class: 'trturn' }, `${F.turn}手め`),
          el('button', { class: 'trquit' + (S.trQuit ? ' on' : ''), onclick: () => {
            if (busy) return;
            if (!S.trQuit) { S.trQuit = true; draw(); return; }
            P.trail.fight = null; S.trQuit = false; S.screen = 'trail'; SFX.pick(); draw();
          } }, S.trQuit ? 'もう一度で退く' : '退く')),
        /* 自分（左） */
        el('div', { class: 'trme', style: `--ac:${TR_ATTR_COL[who.attr]}` },
          keepImg({ class: 'trmeimg', src: pawnUrl(who.no), alt: who.name }),
          trBar(pl.hp, pl.mx, pl.blk),
          el('b', { class: 'trnm' }, who.name),
          el('div', { class: 'trtags' }, tags.map(t => el('i', {}, t))),
          trFloat(trFxOf('pl'))),
        /* 敵（右） */
        S.trBanner ? el('div', { class: 'trbanner ' + (S.trBanner.win ? 'win' : 'lose') },
          el('div', { class: 'trbanray' }),
          uiUrl(S.trBanner.win ? 'title_勝利' : 'title_敗北')
            ? keepImg({ class: 'trbanimg', src: uiUrl(S.trBanner.win ? 'title_勝利' : 'title_敗北'), alt: '' })
            : el('b', { class: 'trbantxt' }, S.trBanner.win ? '勝利' : '敗北')) : null,
        ...F.foes.map((f, i) => {
          const [x, back] = pos[i] || [80, 0];
          return el('div', {
            class: 'trfoe' + (f.hp <= 0 ? ' dead' : '') + (S.trActing === i ? ' acting' : '') + (f.boss ? ' boss' : '') + (back ? ' back' : ''),
            'data-i': String(i),
            style: `--ac:${TR_ATTR_COL[f.attr]};left:${x}%`,
          },
            trIntentEl(f),
            keepImg({ class: 'trfimg', src: pawnUrl(f.no), alt: f.name }),
            trBar(f.hp, f.mx, f.blk),
            el('b', { class: 'trnm' }, f.name),
            el('div', { class: 'trtags' }, [f.mom > 0 ? '昂り' : null, f.pump ? '溜め' : null, f.thorns ? '返し' : null, f.vuln ? '崩れ' : null, (f.weakT || 0) > 0 ? '削がれ' : null, f.burnT > 0 ? '炎' : null, f.seal ? '封' : null].filter(Boolean).map(t => el('i', {}, t))),
            trFloat(trFxOf('foe', i)));
        })),
      el('div', { class: 'trdesk' },
        el('div', { class: 'trki' }, el('b', {}, `${F.ki}/${TR_KI}`)),
        el('span', { class: 'trpile' }, el('i', {}, '山'), String(F.draw.length)),
        itSel ? el('div', { class: 'trdetail tritd' },
          el('div', {}, el('b', {}, itSel), el('p', {}, (TR_ITEMS[itSel] || {}).d || '')),
          el('button', { class: 'trituse', disabled: (busy || F.over) ? true : null, onclick: useIt }, '使う'),
          el('button', { class: 'tritx', onclick: () => { S.trItB = null; SFX.pick(); draw(); } }, '×'))
        : selKd ? el('div', { class: 'trdetail' },
          el('b', {}, `${TR_KIND_NAME[selKd.kind]}　${trName(selKd.sk.name)}${selKd.up ? '＋' : ''}`),
          el('p', {}, trWords(trSpec(who, selKd, F)).join('・')))
          /* 何も選んでいないときは、ここに持っている品を並べる（押すと中身と「使う」） */
          : el('div', { class: 'trdetail tritray' }, run.items.length
              ? run.items.map((nm, k) => el('button', { class: 'tritem',
                  onclick: () => { S.trItB = k; S.trSel = null; SFX.pick(); draw(); } }, itemIcon(nm)))
              : el('small', {}, '品なし')),
        el('span', { class: 'trpile' }, el('i', {}, '捨'), String(F.disc.length)),
        el('button', { class: 'trendb', disabled: (busy || F.over) ? true : null, onclick: () => trFoeTurn() }, 'ターン終了')),
      hand),
    /* 下の帯は戦のさなかも出す（2026-10-09・悠さんの指図「ホームに戻れない」）。
       抜けても戦は P.trail.fight に残るので、ホームの座から続きへ戻れる */
    nav: true,
  };
}
/* 敵の手番。一匹ずつ間をおいて動かす */
/* ---- 攻めの動き（2026-10-09）----
   描き直したばかりの盤に、控えておいた動きをのせる。
   ・打つ側が相手のほうへ踏み込む
   ・技の一枚絵（cutin/<番号>_攻撃・_特技・_固有・_奥義）が帯で横切る。奥義は大きく長く
   ・打たれた側に斬撃（fx/slash・奥義は ult_burst・討ち取りは impact）が走り、白く光ってのけぞる
   絵が無ければ、その部分だけ出ない（動きは残る） */
const TR_CUT_ART = { sk: '特技', u: '固有', ult: '奥義', gen: '固有' };
function trAnimate() {
  const a = S.trAnim; if (!a) return;
  S.trAnim = null;
  const field = document.querySelector('.trfield'); if (!field) return;
  const me = field.querySelector('.trme');
  const foes = [...field.querySelectorAll('.trfoe')];
  const actor = a.who === 'pl' ? me : foes[a.fi];
  const dir = a.who === 'pl' ? 1 : -1;
  const pimg = actor && actor.querySelector(a.who === 'pl' ? '.trmeimg' : '.trfimg');
  const flip = a.who === 'pl' ? '' : ' scaleX(-1)';
  if (pimg && (a.atk || a.who === 'pl')) {
    const d = a.atk ? 46 : 14;
    pimg.animate([{ transform: 'translateX(0)' + flip },
                  { transform: `translateX(${dir * -8}px)` + flip, offset: .2 },
                  { transform: `translateX(${dir * d}px) scale(1.08)` + flip, offset: .45 },
                  { transform: 'translateX(0)' + flip }],
                 { duration: a.ult ? 620 : 420, easing: 'cubic-bezier(.2,.9,.3,1)' });
  }
  /* 帯の一枚絵。攻める技は「攻撃」の絵を先に探し、無ければ技の種類の絵 */
  const kindArt = a.who === 'pl' ? TR_CUT_ART[a.kind] : (a.ult ? '奥義' : null);
  const art = a.ult ? cutinArt(a.no, '奥義')
            : (a.atk ? (cutinArt(a.no, '攻撃') || (kindArt && cutinArt(a.no, kindArt)))
                     : (kindArt && cutinArt(a.no, kindArt)));
  if (art && (a.atk || a.who === 'pl')) {
    const cut = el('div', { class: 'trcut ' + (a.who === 'pl' ? 'from-l' : 'from-r') + (a.ult ? ' ult' : '') },
      el('img', { src: art, alt: '' }),
      el('b', {}, a.who === 'pl' ? (a.name || '') : (a.ult ? '奥義' : a.name + 'の攻め')));
    field.append(cut);
    setTimeout(() => cut.remove(), a.ult ? 1150 : 760);
  }
  /* 打たれた側。少し遅らせて、踏み込みと絵が通ったあとに当てる */
  const hitAt = a.ult ? 520 : 260;
  setTimeout(() => {
    const tgts = a.who === 'pl' ? a.hits.map(i => foes[i]).filter(Boolean) : ((a.hurt && me) ? [me] : []);
    for (const t of tgts) {
      fxBurst(t, a.ult ? 'ult_burst' : (a.ko ? 'impact' : 'slash'), { ms: a.ult ? 620 : 420, scale: a.ult ? 1.5 : 1.1, spin: !a.ult });
      const im = t.querySelector('.trmeimg, .trfimg');
      if (im) {
        const f2 = t.classList.contains('trfoe') ? ' scaleX(-1)' : '';
        const back = t.classList.contains('trfoe') ? 10 : -10;
        im.animate([{ filter: 'brightness(1)', transform: 'translateX(0)' + f2 },
                    { filter: 'brightness(3)', transform: `translateX(${back}px)` + f2, offset: .2 },
                    { filter: 'brightness(1)', transform: 'translateX(0)' + f2 }], { duration: 300 });
      }
    }
    if (tgts.length && a.ult) field.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(-6px,3px)' },
      { transform: 'translate(5px,-3px)' }, { transform: 'translate(0,0)' }], { duration: 300 });
    if (a.who === 'foe' && a.dodge && me) fxBurst(me, 'guard', { ms: 380 });
  }, hitAt);
}
async function trFoeTurn() {
  const F = P.trail.fight; if (!F || S.trBusy || F.over) return;
  S.trBusy = true; S.trSel = null; trEnd(F); S.trFx = null; draw();
  for (let i = 0; i < F.foes.length; i++) {
    if (F.over) break;
    if (F.foes[i].hp <= 0) continue;
    S.trActing = i;
    const it = F.foes[i].it || {};
    const ev = trFoeAct(F, i);
    S.trFx = ev;
    const act = ev.find(e => e.t === 'act');
    S.trAnim = { who: 'foe', fi: i, no: F.foes[i].no, name: F.foes[i].name,
                 kind: act ? act.k : null, ult: !!(act && act.ult), atk: !!(act && act.k === 'atk'),
                 hurt: ev.some(e => e.t === 'hurt'), dodge: ev.some(e => e.t === 'dodge') };
    if (ev.some(e => e.t === 'hurt' && e.n)) SFX.hit(); else if (ev.some(e => e.t === 'dodge')) SFX.eva(); else if (ev.some(e => e.t === 'fheal')) SFX.heal();
    draw();
    await sleep(act && act.k === 'atk' ? (act.ult ? 1100 : 760) : 560);
  }
  S.trActing = null;
  if (!F.over) trRound(F);
  S.trBusy = false; S.trFx = null;
  draw();
  if (F.over) trFinish();
}
/* 決着。初めて抜けた話なら褒美を配り、10話ごとの上限を開く */
function trFinish() {
  const F = P.trail.fight; if (!F || !F.over) return;
  const win = F.over === 'win';
  const no = F.no, ft = F.tier || 0, run = trRunOf(no, ft), rk = trRK(no, ft);
  const res = { win, i: F.i, no, rw: null, mile: null, boss: false, part: run.part };
  if (win) {
    run.hp = Math.max(1, F.pl.hp);
    /* 勝ちの褒美（2026-10-10・悠さんの指図）。毎回、持ち帰れる小判と、札を一枚えらぶ権と、兵量の戻り。
       手練れは稽古の書も一冊。初めて抜けた階の褒美（trFloorDone）はこれとは別に乗る */
    const who = trWho(no), mx = trMx(who), tf = trTrait(who).fx;
    const t = F.node ? F.node.t : '戦';
    const kb = Math.round((80 + F.i * 12) * (t === '将' ? 4 : t === '強' ? 2 : 1) * (1 + (tf.coin || 0)));
    P.koban += kb;
    if (t === '強') addItem('稽古の書', 1);
    const heal = Math.min(mx - run.hp, Math.round(mx * (0.08 + (tf.mend || 0))));
    run.hp += heal;
    const R = { rs: (run.seed ^ (F.i * 31337) ^ ((run.path || []).length * 7)) >>> 0 };
    /* 国主を討ったときは札えらびを付けない（2026-10-10 夕・悠さんの指図） */
    res.spoil = { kb, heal, book: t === '強' ? 1 : 0, cards: t === '将' ? [] : trOffer(R, C, no, run.part, 3, n2 => trKindsFor(n2, who)), took: null };
    const nd = F.node;      // 前の作り（話の一覧）の途中の戦には節が無い。そのときは道を動かさない
    if (nd) { run.at = { r: nd.r, c: nd.c }; run.path = [...(run.path || []), { r: nd.r, c: nd.c }]; }
    const got = trFloorDone(no, F.i, ft);
    if (got) { res.rw = got.rw; res.mile = got.mile; }
    /* 国主を倒したら次の部の道を敷く。三の部を抜けたら踏破 */
    if (nd && nd.r === 'boss') {
      res.boss = true;
      const mx = trMx(trWho(no));
      /* 次の部へは札束と品を持ち越す（2026-10-10）。三の部を抜けたら旅は終わり、組んだ山札から出直す */
      if (run.part < 2) P.trail.runs[rk] = trRunNew(run.part + 1, mx, (Date.now() ^ no) >>> 0, { cards: run.cards, items: run.items });
      else { P.trail.runs[rk] = trRunNew(0, mx, (Date.now() ^ no) >>> 0); res.end = true; }
    }
  } else {
    /* 倒れたら その部のはじめから。道は敷き直し、兵量は満たす（抜けた階と褒美は残る） */
    P.trail.runs[rk] = trRunNew(run.part, trMx(trWho(no)), (Date.now() ^ no) >>> 0);
  }
  P.trail.fight = null;
  /* いきなり札に切り替わらないよう、戦の場のまん中に勝ち負けの絵を出す（2026-10-10 夕・悠さんの指図）。
     戦は消したので、絵を出すあいだだけ盤を S.trBanner に預けて描く */
  S.trBanner = { win, F }; S.trScroll = true;
  setTimeout(() => { (win ? SFX.win : SFX.lose)(); draw(); }, 250);
  setTimeout(() => { S.trBanner = null; S.trRes = res; draw(); }, 1900);
  savePlayer();
}
function trResSheet() {
  const r = S.trRes; if (!r) return null;
  const c = charOf(r.no);
  const close = () => { S.trRes = null; S.screen = 'trail'; S.trView = 'list'; SFX.pick(); draw(); };
  const head = !r.win ? '道半ばで倒れた' : r.end ? '道を踏破した' : r.boss ? '国主を討った' : '道は開けた';
  /* 国主を討ったら題は「勝利」の絵（2026-10-10 夕）。絵が無ければ字 */
  const headEl = (r.boss && uiUrl('title_勝利'))
    ? keepImg({ class: 'trreshimg', src: uiUrl('title_勝利'), alt: head })
    : el('b', { class: 'trresh' }, head);
  /* 褒美は一列にまとめる（初めて抜けた分も足して数える） */
  const sum = { koban: 0, soul: 0, books: {}, heal: 0 };
  if (r.spoil) { sum.koban += r.spoil.kb || 0; sum.heal += r.spoil.heal || 0; if (r.spoil.book) sum.books['稽古の書'] = (sum.books['稽古の書'] || 0) + r.spoil.book; }
  if (r.rw) { sum.koban += r.rw.koban || 0; sum.soul += r.rw.soul || 0; for (const [nm, n] of Object.entries(r.rw.books || {})) sum.books[nm] = (sum.books[nm] || 0) + n; }
  const msg = !r.win ? `${['一', '二', '三'][r.part]}の部のはじめから、もう一度`
    : r.end ? '三つの部をすべて抜けた。また一の部から歩める'
    : r.boss ? `${['二', '三'][r.part]}の部「${TR_PARTS[r.part + 1]}」へ`
    : `${r.i + 1}階を抜けた`;
  return el('div', { class: 'sheet' },
    el('div', { class: 'card2 trres ' + (r.win ? 'win' : 'lose') },
      headEl,
      c ? keepImg({ class: 'trresimg', src: trFace(c.no), alt: c.name }) : null,
      el('p', {}, msg),
      r.win ? trPrizes(sum) : null,
      /* 「限界突破」（2026-10-10 夕・悠さんの指図）。光を回して大きく見せる */
      r.mile ? el('div', { class: 'trmileup trlimit' },
        el('i', { class: 'trlimray' }),
        el('b', { class: 'trlimw' }, ...'限界突破'.split('').map((ch, k) => el('span', { style: `--k:${k}` }, ch))),
        c ? el('small', {}, c.name) : null,
        r.mile.sp ? el('span', {}, `武士の魂の上限 ＋${r.mile.sp}`) : null,
        r.mile.lv ? el('span', {}, `レベルの上限 ＋${r.mile.lv}`) : null) : null,
      /* 札を一枚えらぶ（2026-10-10）。とらずに戻ってもよい */
      (r.spoil && r.spoil.cards.length) ? (() => {
        const who = trWho(r.no); const sp = r.spoil;
        return el('div', { class: 'trevpickc' },
          el('small', {}, sp.took != null ? '札束に一枚くわえた' : '札を一枚えらんで札束にくわえる'),
          el('div', { class: 'trevcards' }, sp.cards.map((en, k) => {
            const kd = trKdOfEntry(en, who); if (!kd) return null;
            return el('div', { class: 'trevc' + (sp.took === k ? ' took' : sp.took != null ? ' sold' : '') },
              trCardEl(who, kd, trSpec(who, kd), { small: true, on: () => {
                if (sp.took != null) return; sp.took = k;
                const rn = trRunOf(r.no); rn.cards.push({ no: en.no, key: en.key, up: 0 });
                SFX.get(); savePlayer(); draw(); } }));
          })));
      })() : null,
      el('button', { class: 'go wide', onclick: close }, (r.spoil && r.spoil.took == null && r.spoil.cards.length) ? '札はとらずに道へ' : '道へ戻る')));
}

/* 出陣も題の帯を出さない（2026-09-29）。
   すぐ下に「← 全国へ」と敵の城の語りがあって、どこにいるかは分かる */
/* 取引所も題の帯を出さない（2026-10-01）。語りの札がそのまま題になっている */
const NO_TITLE = new Set(['title', 'home', 'battle', 'tutorial', 'gacha', 'gachalist', 'map', 'march', 'loading', 'tower', 'market', 'trfight']);

const SCREENS = {
  title: screenTitle,
  tutorial: screenTutorial,
  march: screenMarch,
  home: screenHome, map: screenMap, squads: screenSquads, dex: screenDex,
  grow: screenGrow, power: screenPower, skillup: screenSkillUp, inherit: screenInherit, shop: screenShop,
  gacha: screenGacha, gachalist: screenGachaList, team: screenTeam, form: screenForm, battle: screenBattle,
  event: screenEvent, loading: screenLoading,
  tower: screenTower,
  market: screenMarket,
  stoneshop: screenStone,          // ストーン販売所（2026-10-07）
  trail: screenTrail, trfight: screenTrFight,   // 落ち延び道中（2026-10-08）
};
const SUB = { title: '', tutorial: 'はじまり', home: 'ホーム', map: '全国', march: '出陣', squads: '部隊', dex: '図鑑',
              gacha: 'わんこみくじ', gachalist: 'くじ選び', team: '編成', form: '陣形と配置', battle: '合戦', event: 'お祭り',
              grow: '育成', power: '武将強化', skillup: '特技強化', inherit: '特技継承', shop: 'ショップ',
              tower: '試練の塔', market: '取引所', stoneshop: 'ストーン販売所', trail: '落ち延び道中', trfight: '道中' };
/* 画面は毎回まるごと組み直すので、そのままだと押すたびに先頭へ戻ってしまう。
   同じ画面のままなら、縦の位置を覚えておいて戻す（2026-09-21） */
let LAST_SCREEN = null;
/* 札の中の巻き位置も覚える（2026-10-01）。
   武将強化・特技強化・特技継承の中身は .growbox の中で巻いているので、
   #app の位置だけ戻しても、何か押すたびに札の頭へ戻っていた。
   同じ画面・同じ武将のあいだだけ覚えておく（別の武将を開いたら頭から） */
let LAST_GROW = null;

/* ================= 字を打っている最中の描き直し（2026-10-06）=================
   悠さんの実測：「さがす一行に入れると、さがせないし画面もずれる」。
   原因は三つ重なっていた。

   ① 一字ごとに draw() が走り、#app をまるごと作り直す。
      作り直すと入れ物そのものが別の物に変わるので、
      **かな漢字の変換の途中が丸ごと消える**。日本語がそもそも打てない。
   ② 一行の字が 12.5px だった。iPhone は 16px 未満の入れ物に触れると
      勝手に拡大する決まりなので、触れた瞬間に画面がずれて見える。→ style.css で16pxにした
   ③ 変換の途中（composition）でも数えにいっていた。

   直し方：**打っているあいだは画面を作り直さない。** 並んでいる中身だけ入れ替える。
   どこを入れ替えてよいかは、画面を組むときに softSet() で預けておく。 */
let SOFT = null;        // { id, make } … 入れ替えてよい入れ物の名札と、中身の作り方
let IME = false;        // かな漢字の変換の途中か
const softSet = (id, make) => { SOFT = { id, make }; };
const typingNow = () => {
  const a = document.activeElement;
  return !!(a && a.classList && a.classList.contains('mkqin'));
};
/* 打っている最中なら中身だけ、そうでなければふつうに描き直す */
function redraw() {
  if (typingNow() && SOFT) {
    const n = document.getElementById(SOFT.id);
    if (n) {
      n.innerHTML = '';
      for (const x of [].concat(SOFT.make())) if (x != null) n.append(x.nodeType ? x : document.createTextNode(x));
      return;
    }
  }
  draw();
}
/* さがす一行をひとつ作る。名札・いまの字・字が変わったときの手当て を渡す。
   変換の途中は数えない（確定してから一度だけ）。 */
function searchRow(id, val, onQ, place, extra) {
  const fire = (v) => { onQ(v); };
  return el('div', { class: 'mkq' + (extra ? ' ' + extra : '') },
    el('input', {
      id, class: 'mkqin', type: 'search', placeholder: place,
      value: val || '',
      /* 変換の途中は触らない。終わったときに一度だけ数える（2026-10-06） */
      oncompositionstart: () => { IME = true; },
      oncompositionend: e => { IME = false; fire(e.target.value); },
      oninput: e => { if (!IME) fire(e.target.value); },
    }),
    el('button', { class: 'mkqx' + (val ? '' : ' off'), title: 'けす',
      onclick: () => { onQ(''); const n = document.getElementById(id); if (n) n.value = '';
                       SFX.pick(); draw(); } }, '×'));
}

function draw() {
  IMG_USED = new Set();          // 絵の使い回しは1回の描画につき1か所まで
  saveSquads();                                   // 画面が変わるたびに保存する
  /* 字を打っている途中で描き直すと、入れ物ごと作り直されて指が離れる（2026-10-05）。
     取引所の「さがす」で一字打つたびに引き戻されていた（悠さんの実測）。
     名札（id）の付いた一行にいるときだけ、どこまで打っていたかも含めて戻す */
  const ae = document.activeElement;
  const keepIn = (ae && ae.id && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA')) ? ae.id : '';
  let keepS = 0, keepE = 0;
  if (keepIn) { try { keepS = ae.selectionStart; keepE = ae.selectionEnd; } catch (_) {} }
  /* 巻いている場所は #app（2026-09-30）。ページ自体は動かさなくなった */
  const keepY = (LAST_SCREEN === S.screen) ? ($('#app') ? $('#app').scrollTop : 0) : 0;
  const growKey = `${S.screen}:${S.ihc ?? ''}:${S.skc ?? ''}:${S.grow ?? ''}:${S.pw ?? ''}`;
  const gbox0 = document.querySelector('.growbox');
  const keepG = (LAST_GROW === growKey && gbox0) ? gbox0.scrollTop : 0;
  const v = (SCREENS[S.screen] || screenHome)();
  /* 立ち絵の燃え上がりの時計（2026-10-10）。炎の出ない画面に行ったら止めておき、
     ホーム・武将強化に戻ってきたときに また初めから燃え上がらせる */
  if (!FX_USED) FX_KEY = null;
  FX_USED = false;
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
    S.dl ? duelSheet() : null,
    S.offl ? offlineSheet() : null,
    S.kuWar ? kuWarSheet() : null,
    S.kuTake ? kuTakeSheet() : null,
    S.reset ? resetSheet() : null,
    /* キャラカードを開いているあいだは友の札を引っ込める（2026-09-24）。
       重ねて出すとカードが友の札の裏に隠れてしまう。閉じれば友の家に戻る */
    S.detail == null ? (S.frSquad ? frSquadSheet() : S.frId ? frHomeSheet() : (S.fr ? frSheet() : null)) : null,
    /* 名乗りが済むまで、どの画面の上にも出る。
       ただしスタートの画面と 読み込みの画面は別。
       ・スタート（2026-09-25）… 一枚絵を見せる場なので札を重ねない
       ・読み込み（2026-10-02）… bootLoad が絵を六枚読むたびに draw を呼ぶので、
         ここに札を出すと そのたび作り直され、入りの動きが鳴り続けて点滅して見えた */
    (!P.name && S.screen !== 'title' && S.screen !== 'loading') ? nameSheet() : null,
    S.bag ? bagSheet() : null,
    /* 褒美の中身は、お役目の札のさらに上に重ねる（2026-09-30） */
    S.rwi ? rwInfoSheet() : null,
    /* 出す部隊をえらぶ札は、いちばん上に重ねる（2026-09-29）。
       友の家や番付の札の下に潜ってしまい、稽古が申し込めなくなっていた */
    /* 部隊えらびの札から編成へ抜けているあいだ、戦へ戻る道を左下に置く（2026-09-30） */
    /* 武将をえらぶ画面の追従の戻り道は外した（2026-10-03）。
       下に貼り付けた帯（.actsfix）に戻り釦が入ったので、二つあると重なる */
    (S.sqpHold && S.screen === 'form')
      ? el('button', { class: 'sqback', title: '戦へもどる',
          onclick: () => { const h = S.sqpHold; S.sqpHold = null;
                           S.screen = h.from; S.sqp = h.ask;
                           S.fr = !!h.fr; S.frId = h.frId != null ? h.frId : null; S.rk = !!h.rk;
                           SFX.pick(); draw(); } }, '← 戦へ')
      : null,
    /* 城に入るたびのお知らせ札は いちばん上（2026-10-08）。
       ほかの札より手前に出さないと、裏に隠れて押せない */
    S.ad != null ? adSheet() : null,
    S.keepAsk ? keepAskSheet() : null,
    S.keepMsg ? el('div', { class: 'sheet', onclick: () => { S.keepMsg = ''; draw(); } },
      el('div', { class: 'card2 keepbox' },
        el('p', {}, S.keepMsg),
        closeX(() => { S.keepMsg = ''; draw(); }))) : null,
    S.spAsk != null ? sparAskSheet() : null,
    S.trPick ? trPickSheet() : null,
    S.trRes ? trResSheet() : null,
    trEvSheet(),                     // 道の出来事・品・札束（2026-10-10）。出すものが無ければ null
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
  if (keepG) { const g2 = app.querySelector('.growbox'); if (g2) g2.scrollTop = keepG; }
  /* 打っていた一行へ指を戻す（2026-10-05）。
     preventScroll を付けないと、画面が入れ物のところまで跳ぶ */
  if (keepIn) {
    const n2 = document.getElementById(keepIn);
    if (n2 && n2 !== document.activeElement) {
      try { n2.focus({ preventScroll: true }); } catch (_) { n2.focus(); }
      try { n2.setSelectionRange(keepS, keepE); } catch (_) { /* 使えない入れ物もある */ }
    }
  }
  LAST_SCREEN = S.screen;
  LAST_GROW = growKey;
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
setInterval(foodClock, 1000);        // 兵糧の残りの字（2026-10-01）
document.addEventListener('visibilitychange', () => { if (!document.hidden) foodTick(); });

/* 起動したら、いまの値からお役目の数を整える（2026-09-24）。
   名乗りの前に呼んでも困らない。draw の前に一度だけ */
miRefresh();
askPersist();
draw();
