/* ================= 武将取引所（2026-10-01）=================
   育てた武将を、他の主へ「武士の魂」で譲り渡す場。

   ── 決めごと ──
   ・払いも受け取りも 武士の魂だけ。小判も石も使わない
   ・出せるのは 一度に三枚まで
   ・出した武将は その場で手元から消える（手持ちの枚数も育ちも、まるごと預ける）。
     取り下げれば そのまま戻る
   ・買うほうは すぐ手に入る。育った中身（位・覚醒・魂ふり・継いだ技）もそのまま移る
   ・売れたかどうかは その場では分からない。**六時間ごとに帳面を検めて**、魂が入る

   ── サーバーが無いあいだ ──
   他の主は、番付と同じく NPC で埋めてある。
   日付の半日と枠の番号を種にしているので、同じ半日なら いつ開いても同じ品が並ぶ。
   サーバーができたら mkStock()（並べる）と mkSettle()（売れたか検める）の
   中身を 取りにいく／送る に差し替えるだけでよい。画面は触らずに済む。 */

import { P, savePlayer, SOUL_BY_RARITY, SP_STATS, charState, cntOf, setCnt,
         inSquad, hasCard } from './player.js';
import { rkName } from './rank.js';

export const MK_MAX = 3;                       // 一度に出せる枚数
export const MK_SLOTS = 36;                    // 他の主が並べる品の数
export const MK_EVERY_MS = 6 * 3600 * 1000;    // 帳面を検める間（六時間）
const MK_HALF_MS = 12 * 3600 * 1000;           // 他の主の顔ぶれが入れ替わる間（半日）
export const MK_LIFE_MS = 48 * 3600 * 1000;    // 出していられる長さ（二日）。過ぎたら戻る

/* 保存の受け皿。P に無ければ作る（古い保存でも落ちない） */
export function mkState() {
  if (!P.market || typeof P.market !== 'object') P.market = {};
  const m = P.market;
  if (!Array.isArray(m.listed)) m.listed = [];   // 自分が出している品
  if (!Array.isArray(m.log)) m.log = [];         // 売れた帳面
  if (!Array.isArray(m.sold)) m.sold = [];       // 他の主の品のうち、もう買ったもの（印）
  if (typeof m.at !== 'number') m.at = Date.now();   // 最後に帳面を検めた時刻
  return m;
}

/* ---- 値ぶみ ----
   位がいちばん重い（重ねたときの魂と同じ物差しを十倍して使う）。
   そこに 育てたぶん（位・覚醒・ふった魂・技の位）を足す。
   遊ぶ人には この式は見せない。「目安」とだけ出す */
export function mkWorth(c, st) {
  if (!c) return 10;
  const one = SOUL_BY_RARITY[c.rarity] || 1;
  const s = st || {};
  const sp = SP_STATS.reduce((a, k) => a + ((s.sp || {})[k] || 0), 0);
  const sk = (s.sk || []).reduce((a, v) => a + Math.max(0, (v || 1) - 1), 0);
  return Math.max(10, Math.round(one * 10 + (s.lv || 1) * 2 + (s.awake || 0) * 60
                                 + sp * 1.2 + sk * 40));
}
/* 預かっている育ちでの総合値（2026-10-01）。
   grownStats と同じ式（Lv1を100%として1レベル +2%、そこに ふった魂を足す）。
   grownStats は いま手元にいる武将しか見ないので、取引所ぶんはここで数える */
export function mkPower(c, st) {
  if (!c) return 0;
  const s = st || {};
  const mul = 1 + ((s.lv || 1) - 1) * 0.02;
  return SP_STATS.reduce((a, k) =>
    a + Math.round(((c.stats || {})[k] || 0) * mul) + ((s.sp || {})[k] || 0), 0);
}
/* 付けられる値の幅。安く出せば早く売れ、高く出せば なかなか売れない */
export const mkLo = w => Math.max(10, Math.round(w * 0.5));
export const mkHi = w => Math.round(w * 3);

/* ---- 種から決まる乱数（番付と同じ作り）---- */
function mkRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let x = Math.imul(s ^ (s >>> 15), 1 | s);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
const halfDay = () => Math.floor(Date.now() / MK_HALF_MS);

/* ---- 他の主が並べている品 ----
   C は武将の正典（画面側から渡す）。ここでは絵も名も引かない。
   位の出かたは 下の位ほど多い。高い札ばかり並んでも手が出ないので */
const MK_RAR = ['N', 'N', 'N', 'R', 'R', 'R', 'SR', 'SR', 'SSR', 'UR'];
export function mkStock(C) {
  const day = halfDay();
  const m = mkState();
  const out = [];
  for (let i = 0; i < MK_SLOTS; i++) {
    const rng = mkRng((day * 7919 + i * 104729) ^ 0x5bf03635);
    const rar = MK_RAR[Math.floor(rng() * MK_RAR.length)];
    const pool = C.filter(c => c.rarity === rar);
    if (!pool.length) continue;
    const c = pool[Math.floor(rng() * pool.length)];
    /* 育ち。位が高い札ほど よく育った子が並ぶ（手に入りにくいぶん、中身も良い） */
    const k = ['N', 'R', 'SR', 'SSR', 'UR'].indexOf(rar);
    const lv = 1 + Math.floor(rng() * (10 + k * 14));
    const awake = Math.floor(rng() * (k >= 3 ? 4 : k >= 1 ? 3 : 2));
    const st = { lv, awake, sp: {}, sk: [1, 1, 1] };
    const w = mkWorth(c, st);
    const price = Math.max(10, Math.round(w * (0.7 + rng() * 0.9)));
    out.push({ id: `n${day}-${i}`, no: c.no, st, price, who: rkName(rng), npc: true });
  }
  return out.filter(x => !m.sold.includes(x.id));
}
export const mkBought = id => mkState().sold.includes(id);

/* ---- 買う ----
   魂を払って、その場で手に入れる。育った中身もそのまま移る。
   すでに持っている武将なら「重ね」が一枚増え、育ちは良いほうを残す
   （買ったせいで せっかく育てた子が下がるのは理不尽なので） */
export function mkBuy(it) {
  if (!it || mkBought(it.id)) return null;
  if ((P.soul || 0) < it.price) return null;
  P.soul -= it.price;
  const had = P.own.includes(it.no);
  if (!had) P.own.push(it.no);
  setCnt(it.no, cntOf(it.no) + 1);
  const cur = charState(it.no);
  const s = it.st || {};
  /* 位と覚醒は高いほうを採る。ふった魂と技の位も、多いほうを残す */
  cur.lv = Math.max(cur.lv || 1, s.lv || 1);
  cur.awake = Math.max(cur.awake || 0, s.awake || 0);
  for (const k of SP_STATS) cur.sp[k] = Math.max(cur.sp[k] || 0, (s.sp || {})[k] || 0);
  if (Array.isArray(s.sk)) for (let i = 0; i < 3; i++)
    cur.sk[i] = Math.max(cur.sk[i] || 1, s.sk[i] || 1);
  mkState().sold.push(it.id);
  savePlayer();
  return { no: it.no, price: it.price, dup: had };
}

/* ---- 出す ----
   手持ちの枚数と育ちを まるごと預かる。部隊に入っている武将は出せない
   （出陣の途中で消えると、何が起きたか分からなくなる） */
export const mkCanList = no => hasCard(no) && !inSquad(no)
  && mkState().listed.length < MK_MAX
  && !mkState().listed.some(x => x.no === no);
export function mkList(no, price) {
  const m = mkState();
  if (!mkCanList(no)) return null;
  const n = cntOf(no);
  const st = JSON.parse(JSON.stringify(charState(no)));   // 育ちをそのまま預かる
  m.listed.push({ id: `m${Date.now()}-${no}`, no, cnt: n, st,
                  price: Math.max(1, Math.round(price)), at: Date.now() });
  setCnt(no, 0);                                          // 手元からは消える
  savePlayer();
  return { no, price, cnt: n };
}
/* ---- 取り下げる。枚数も育ちも そのまま戻る ---- */
export function mkPull(id) {
  const m = mkState();
  const i = m.listed.findIndex(x => x.id === id);
  if (i < 0) return null;
  const it = m.listed[i];
  m.listed.splice(i, 1);
  if (!P.own.includes(it.no)) P.own.push(it.no);
  setCnt(it.no, cntOf(it.no) + (it.cnt || 1));
  P.chars[String(it.no)] = JSON.parse(JSON.stringify(it.st));
  savePlayer();
  return { no: it.no };
}

/* ---- 六時間ごとの検め ----
   安く出した品ほど売れる。目安ちょうどで六割、半値なら八割強、三倍だとほぼ売れない。
   開くたびに呼んでよい（前に検めてから六時間たっていなければ何もしない）。
   売れた品は帳面（log）に積む。魂はその場で入る＝「六時間ごとに反映」 */
export function mkSettle(C) {
  const m = mkState();
  const now = Date.now();
  const from = m.at || now;
  const turns = Math.floor((now - from) / MK_EVERY_MS);
  if (turns < 1) return null;
  m.at = from + turns * MK_EVERY_MS;
  const rolls = Math.min(turns, 8);          // 久しぶりに開いても、振るのは八回まで
  const got = [];
  /* 時の順に進める（2026-10-01）。
     先に寿命で戻してしまうと、長く留守にした人の品が
     「売れる機会をもらえないまま戻る」ことになる */
  for (let t = 1; t <= rolls && m.listed.length; t++) {
    const when = from + t * MK_EVERY_MS;
    for (const it of [...m.listed]) {
      if (when - (it.at || when) >= MK_LIFE_MS) continue;   // 寿命ぶんは下でまとめて戻す
      const c = (C || []).find(x => x.no === it.no);
      const w = mkWorth(c, it.st);
      /* 値が目安の何倍か。半値で .85、目安ちょうどで .6、三倍で .05 */
      const r = it.price / Math.max(1, w);
      const p = Math.max(0.05, Math.min(0.92, 0.85 - (r - 0.5) * 0.5));
      const rng = mkRng((it.id.length * 2654435761 + Math.floor(when / 1000)) >>> 0);
      if (rng() >= p) continue;
      m.listed.splice(m.listed.indexOf(it), 1);
      P.soul = (P.soul || 0) + it.price;
      const rec = { no: it.no, price: it.price, at: when, who: rkName(rng), read: false };
      m.log.unshift(rec);
      got.push(rec);
    }
  }
  /* 二日たっても売れなかった品は、主のもとへ戻す（2026-10-01） */
  for (const it of [...m.listed]) {
    if (now - (it.at || now) < MK_LIFE_MS) continue;
    const price = it.price, no = it.no;
    mkPull(it.id);
    const rec = { no, price, at: now, back: true, read: false };
    m.log.unshift(rec);
    got.push(rec);
  }
  if (m.log.length > 40) m.log.length = 40;   // 帳面は四十件まで
  savePlayer();
  return got.length ? got : null;
}
/* まだ見ていない売り上げの数（座の赤丸に使う） */
export const mkUnread = () => mkState().log.filter(x => !x.read).length;
export function mkRead() {
  const m = mkState();
  let n = 0;
  for (const x of m.log) if (!x.read) { x.read = true; n++; }
  if (n) savePlayer();
  return n;
}
/* 次の検めまで何ミリ秒か（画面に「あと◯時間」を出すのに使う） */
export const mkNext = () => Math.max(0, (mkState().at || Date.now()) + MK_EVERY_MS - Date.now());
