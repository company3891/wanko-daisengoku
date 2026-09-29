// わんこ大戦国 番付（2026-09-25）
// プレイヤー同士の腕くらべ。いまはサーバーが無いので、表の空きは NPC で埋める。
// サーバーができたら rkRoom() が返す顔ぶれを本物に差し替えるだけでよい。
// ここには画面の都合と戦闘そのものは持ち込まない（数と決めごとだけ）。

/* 段は五つ。上るほど城の中心へ。称号（足軽頭・軍神など）とは別の物差し */
export const RK_TIERS = ['五の丸', '四の丸', '三の丸', '二の丸', '本丸'];
export const RK_SEATS = 50;      // 番付表 一枚に載る組数
export const RK_UP = 10;         // 上位10組が昇格（本丸は据置）
export const RK_DOWN = 10;       // 下位10組が降格（五の丸は据置）
export const RK_TICKET = 5;      // 1日に配る対戦札
export const RK_NEAR = 30;       // pt がこの差の中なら「同等」（2026-09-25 に総合力から pt へ改めた）
export const RK_RAID = 3;        // 1日に挑まれる回数
/* この順位より下なら、自分の段を表の下にくっつける（2026-09-25）。
   8番までは開いてすぐ見えるので、貼らずに正しい順位のところに置く */
export const RK_PIN = 8;

/* 段ごとの、相手の総合力のはば。
   自分の総合力はレベルで伸びて 43000 ほどまで行くので、それに合わせてある。
   組の総合力は「熱心さ（vigor）」から決める。点をよく積む組ほど本当に強い、を守るため。
   こうしないと「点は高いが弱い相手」を選んで +10 を刈り取れてしまう */
export const RK_POWER = [
  [7000, 15000], [14000, 22000], [21000, 29000], [28000, 36000], [35000, 45000],
];
/* NPCが1日に積む点の目安。段が上ほど熱心に戦う人が多い、という見立て */
export const RK_PACE = [6, 8, 10, 12, 14];

/* 月末の褒美。段が上ほど大きい。表に載っていれば誰でももらえる（2026-09-25）。
   軍功（ぐんこう）は番付でしか手に入らない通貨。ショップの「番付の蔵」で引き換える */
export const RK_PRIZE = [
  { koban: 5000,  stone: 30,  gun: 100 },
  { koban: 10000, stone: 60,  gun: 200 },
  { koban: 20000, stone: 120, gun: 350 },
  { koban: 35000, stone: 200, gun: 550 },
  { koban: 60000, stone: 350, gun: 900 },
];
/* 順位の帯。上ほど厚いが、いちばん下の帯でも半分近くはもらえる */
export const RK_BANDS = [
  { to: 1,  label: '1位',      k: 3.0 },
  { to: 2,  label: '2位',      k: 2.4 },
  { to: 3,  label: '3位',      k: 2.0 },
  { to: 6,  label: '4〜6位',   k: 1.6 },
  { to: 10, label: '7〜10位',  k: 1.3 },
  { to: 20, label: '11〜20位', k: 1.0 },
  { to: 35, label: '21〜35位', k: 0.7 },
  { to: 50, label: '36〜50位', k: 0.45 },
];
export const rkBandOf = rank => RK_BANDS.find(b => rank <= b.to) || RK_BANDS[RK_BANDS.length - 1];
/* その段・その順位でもらえる褒美。端数が汚くならないよう丸める */
export function rkPrizeOf(tier, rank) {
  const b = RK_PRIZE[Math.min(tier, RK_PRIZE.length - 1)];
  const k = rkBandOf(rank).k;
  const r = (v, step) => Math.max(step, Math.round(v * k / step) * step);
  return { koban: r(b.koban, 100), stone: r(b.stone, 5), gun: r(b.gun, 10) };
}

/* ---- 点の入り方（2026-09-25 に「総合力」から「持ち点」へ改めた）----
   番付は点の高い順に並ぶので、格を測る物差しも点にしたほうが見たままで分かる。
   格上（相手の点が +30 以上）に勝てば +10、負けても −5。
   格下（相手の点が −30 以下）に勝っても +5、負ければ −10。
   同等はどちらも 5。挑んだときも、挑まれたときも、自分から見たこの表で動く。 */
export function rkPoint(minePt, theirsPt, won) {
  const d = (theirsPt || 0) - (minePt || 0);
  if (d >= RK_NEAR) return won ? 10 : -5;
  if (d <= -RK_NEAR) return won ? 5 : -10;
  return won ? 5 : -5;
}
export const rkSide = (minePt, theirsPt) => {
  const d = (theirsPt || 0) - (minePt || 0);
  return d >= RK_NEAR ? '格上' : d <= -RK_NEAR ? '格下' : '同等';
};

/* ---- 種から数を出す（同じ種なら いつ開いても同じ顔ぶれ） ---- */
export function rkRand(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let x = Math.imul(s ^ (s >>> 15), 1 | s);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
export function rkSeed(str) {
  let h = 2166136261 >>> 0;
  for (const ch of String(str)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}

/* ---- NPCの名 ----
   本物のプレイヤーが並んだときに浮かないよう、人が付けそうな名にしてある。
   姓を持たせず、短い呼び名＋ときどき飾り。 */
const NM_HEAD = ['', '', '', '大', '小', '鉄', '金', '蒼', '紅', '雷', '風', '影', '白', '黒'];
const NM_BODY = ['ころ', 'ぽち', 'こむぎ', 'あずき', 'きなこ', 'もなか', 'だいふく', 'しば', 'くろ', 'しろ',
  'ちゃちゃ', 'こてつ', 'げんき', 'むさし', 'のぶ', 'ひで', 'らん', 'そら', 'りく', 'かい',
  'てん', 'ふく', 'もも', 'あんず', 'たろ', 'はな', 'ゆき', 'まる', 'すみれ', 'かえで',
  'ハチ', 'レオ', 'ソラ', 'マロン', 'ココ', 'ムギ', 'ナナ', 'リン', 'ジロ', 'タケ'];
const NM_TAIL = ['', '', '', '丸', '之助', '斎', '坊', '公', '屋', '党'];
export function rkName(rnd) {
  const h = NM_HEAD[Math.floor(rnd() * NM_HEAD.length)];
  const b = NM_BODY[Math.floor(rnd() * NM_BODY.length)];
  const t = NM_TAIL[Math.floor(rnd() * NM_TAIL.length)];
  return h + b + t;
}

/* ---- 番付表の空き席（NPC）----
   tier … 段（0〜4）／ seed … その表の種 ／ n … 作る数
   power は総合力。vigor は「どれだけ熱心に戦うか」で、日ごとに積む点の速さになる。
   pick は部隊の顔ぶれを決めるための種（武将の選びは画面側でやる）。 */
export function rkRoom(tier, seed, n = RK_SEATS - 1) {
  const [lo, hi] = RK_POWER[Math.min(tier, RK_POWER.length - 1)];
  const out = [];
  for (let i = 0; i < n; i++) {
    const rnd = rkRand(rkSeed(`${seed}:${tier}:${i}`));
    rnd(); rnd();                                   // はじめの2つは片寄るので捨てる
    const vigor = 0.3 + rnd() * 1.5;                // 0.3〜1.8倍
    /* 総合力は熱心さから決める（2026-09-25）。
       点をよく積む組ほど部隊も強い、という形にしておかないと
       「点は高いが弱い相手」を選んで +10 を刈り取れてしまう */
    const t = (vigor - 0.3) / 1.5;
    out.push({
      id: `n${tier}_${i}`,
      name: rkName(rnd),
      power: Math.round(lo + (hi - lo) * (t * 0.85 + rnd() * 0.15)),
      vigor,
      pick: rkSeed(`${seed}:${tier}:${i}:team`),
      npc: true,
    });
  }
  return out;
}
/* NPCのいまの持ち点。月のはじめからの日数に、その人の熱心さを掛ける。
   自分が休んでいるあいだに抜かれていくので、毎日さわる理由になる */
export function rkNpcPt(npc, dayOfMonth, tier) {
  const pace = RK_PACE[Math.min(tier, RK_PACE.length - 1)];
  return Math.round(Math.max(0, dayOfMonth) * pace * npc.vigor);
}

/* ---- 日と月 ---- */
export const rkMonth = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
export const rkDayOfMonth = (d = new Date()) => d.getDate();
/* その月が何日あるか。月末の集計に使う */
export const rkDaysInMonth = (d = new Date()) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

/* 昇格・降格。順位（1から数える）と段から、次の段を返す */
export function rkNextTier(tier, rank) {
  if (rank <= RK_UP && tier < RK_TIERS.length - 1) return tier + 1;
  if (rank > RK_SEATS - RK_DOWN && tier > 0) return tier - 1;
  return tier;
}
export const rkMoveWord = (from, to) => (to > from ? '昇格' : to < from ? '降格' : '据置');

/* ---- 番付の蔵（2026-09-25）----
   軍功でしか買えない品。kind は
   item＝道具 ／ soul＝武士の魂 ／ title＝称号（一度きり）／ char＝武将の重ね（一度きり）
   once を立てた品は、買うと棚から消える。 */
export const RK_SHOP = [
  { kind: 'item',  name: '特技の伝書',     n: 1,   price: 60,   desc: '特技を強くする種。番付の蔵では小判が要らぬ' },
  { kind: 'item',  name: '相伝の護符・大', n: 1,   price: 150,  desc: '継承のしくじりを減らす' },
  { kind: 'item',  name: '皆伝の書',       n: 1,   price: 400,  desc: '特技をひと息に極める' },
  { kind: 'soul',  name: '武士の魂',       n: 300, price: 120,  desc: '数値を伸ばす' },
  { kind: 'title', name: '誉れ者',         price: 800,  desc: '番付の蔵でしか手に入らぬ肩書き',  once: true },
  { kind: 'title', name: '一騎当千',       price: 2000, desc: '番付の蔵でしか手に入らぬ肩書き',  once: true },
  { kind: 'title', name: '番付の主',       price: 5000, desc: '番付の蔵でしか手に入らぬ肩書き',  once: true },
  { kind: 'char',  no: 38, name: '明智ミツワン', price: 3000, desc: '番付でのみ召し抱えられる一騎', once: true },
];
