/* ================= 落ち延び道中（2026-10-08）=================
   札で戦う一人旅。悠さんの決めごと（2026-10-08）：
     ・出陣は武将ひとり。育てた強さをそのまま持ち込む
     ・話は30。初めて抜けた話ごとに小さな褒美。10話ごとに、その武将の上限が開く
       （上限の表は player.js の TR_MILE。ここでは数えない）
     ・札は武将ごとに4種 ── 特技・固有・奥義・大将特性
     ・一ターンの気は5。奥義は5、大将特性は3、特技は★の数、固有は位で決まる
     ・山札は10枚。同じ札を重ねて入れてよい
   ここは数と決まりだけを持つ。画面は main.js の screenTrail が描く。
   名がほかとぶつからないよう、ぜんぶ tr／TR_ で始める（束ねると同じ袋に入るため） */

export const TR_KI = 5;            // 一ターンの気
export const TR_HAND = 5;          // 一ターンに引く札
export const TR_DECK = 10;         // 山札の枚数
export const TR_DUP = 4;           // 同じ札は4枚まで
export const TR_ULT_MAX = 2;       // 奥義と大将特性は2枚まで（重すぎて手が回らなくなるため）
export const TR_COST = { ult: 5, gen: 3 };
/* 固有は★を持たないので、位で気を決める（2026-10-08） */
export const TR_UNIQ_COST = { N: 1, R: 2, SR: 2, SSR: 3, UR: 3 };
export const TR_KIND_NAME = { sk: '特技', u: '固有', ult: '奥義', gen: '大将特性' };

/* ---- 種のある乱数。戦の途中で閉じても、開き直したら同じ続きになる ---- */
export function trRand(F) {
  let t = (F.rs = (F.rs + 0x6D2B79F5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const trInt = (F, n) => Math.floor(trRand(F) * n);
function trShuffle(F, a) {
  for (let i = a.length - 1; i > 0; i--) { const j = trInt(F, i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const trS = v => (v || 0) / 10;                 // 素の値を札の目に落とす（火力1000 → 100）
const trR = v => Math.max(0, Math.round(v));

/* ================= 30話 =================
   一の部「都落ち」→ 二の部「山越え」→ 三の部「帰り道」。10・20・30話は国主が出る。
   h は家の名（campaign.js と同じ書き方）。n は国主のほかの頭数、boss は国主の No.
   g は戦の地（2026-10-09）。app/assets/stage/<地>_背景.jpg を戦の背に敷く */
export const TR_PARTS = ['都落ち', '山越え', '帰り道'];
export const TR_STORY = [
  { g: '城郭', t: '燃える御殿',   h: '明智家', n: 1, l: '火の粉の舞う廊下。まずは目の前の一匹を退けよ' },
  { g: '城郭', t: '裏門の番犬',   h: '明智家', n: 1, l: '門を守る犬が、低くうなっている' },
  { g: '河川', t: '鴨川の渡し',   h: '明智家', n: 2, l: '浅瀬に追っ手がふたり。水音で気づかれた' },
  { g: '草原', t: '竹藪の伏兵',   h: '筒井家', n: 1, l: '笹がざわめく。風ではない' },
  { g: '山岳', t: '近江の峠',     h: '浅井家', n: 2, l: '峠の茶屋は、もう敵の手に落ちていた' },
  { g: '河川', t: '湖畔の夜襲',   h: '浅井家', n: 2, l: '湖を背に、夜目のきく犬どもが囲む' },
  { g: '山岳', t: '伊賀の抜け道', h: '藤堂家', n: 1, l: '道案内を名乗る者の目が笑っていない' },
  { g: '山岳', t: '霧の山寺',     h: '筒井家', n: 2, l: '鐘が鳴るたび、霧の向こうに影がふえる' },
  { g: '草原', t: '追っ手の大将', h: '明智家', n: 3, l: '名のある将が、ついに自ら出てきた' },
  { g: '城郭', t: '惟任の執念',   h: '明智家', n: 2, boss: 38, l: '追っ手の主が、道をふさいで待っていた' },
  { g: '城郭', t: '美濃の関所',   h: '斎藤家', n: 1, l: '通行の札は無い。押し通るしかない' },
  { g: '河川', t: '長良の河原',   h: '斎藤家', n: 2, l: '川霧にまぎれて、槍の穂先が光る' },
  { g: '山岳', t: '木曽の吊り橋', h: '真田家', n: 1, l: '揺れる橋の向こうに、一匹が立ちはだかる' },
  { g: '山岳', t: '雪の峠越え',   h: '真田家', n: 2, l: '足跡を追ってくる者がいる' },
  { g: '山岳', t: '山の民の試し', h: '真田家', n: 2, l: '山に住む犬たちが、腕を見せよと言う' },
  { g: '河川', t: '諏訪の湖',     h: '武田家', n: 2, l: '氷の張った湖を渡る。割れる音がした' },
  { g: '草原', t: '騎馬の群れ',   h: '武田家', n: 3, l: '地鳴りが近づいてくる' },
  { g: '山岳', t: '甲斐の隠し湯', h: '武田家', n: 1, l: '湯けむりの奥で、誰かが刀を研いでいる' },
  { g: '草原', t: '風林火山の陣', h: '武田家', n: 3, l: '旗が四つ。どれも動かぬ山のよう' },
  { g: '城郭', t: '甲斐の虎',     h: '武田家', n: 2, boss: 28, l: '山の主が、ゆっくりと立ち上がる' },
  { g: '海', t: '駿河の浜',     h: '今川家', n: 1, l: '海が見えた。帰り道は近い……はずだった' },
  { g: '草原', t: '富士の裾野',   h: '今川家', n: 2, l: '裾野は広く、隠れる場所が無い' },
  { g: '山岳', t: '箱根の山道',   h: '北条家', n: 2, l: '関の手前で、待ち伏せの声' },
  { g: '城郭', t: '小田原の堀',   h: '北条家', n: 3, l: '城の堀ばたで、物見に見つかった' },
  { g: '草原', t: '相模の夜',     h: '北条家', n: 2, l: '月の無い夜。鼻だけがたよりになる' },
  { g: '草原', t: '越後の雪原',   h: '上杉家', n: 2, l: '一面の白。足もとから冷えてくる' },
  { g: '城郭', t: '春日山の麓',   h: '上杉家', n: 3, l: '毘の旗が、風に鳴っている' },
  { g: '山岳', t: '最後の関',     h: '上杉家', n: 2, l: 'この関を越えれば、本国の匂いがする' },
  { g: '草原', t: '夜明けの追撃', h: '上杉家', n: 3, l: '夜が明ける。追っ手も最後の力をふりしぼる' },
  { g: '城郭', t: '越後の龍',     h: '上杉家', n: 2, boss: 15, l: '龍が、道のまん中で待っていた' },
];
export const TR_MAX = TR_STORY.length;
/* 初めて抜けたときの褒美（2026-10-08・「簡単な報酬」）。
   小判と魂を少し。5の倍数の話は多め */
export function trReward(i) {
  const n = i + 1;
  const big = n % 5 === 0;
  /* 武士の魂は貴重にしたいので出さない（2026-10-09・悠さんの指図）。小判と稽古の書にした。
     5の倍数の階は大稽古の書、10の倍数（国主）はさらに皆伝の書を一冊 */
  const books = { '稽古の書': 1 + Math.floor(n / 10) };
  if (big) books['大稽古の書'] = 1;
  if (n % 10 === 0) books['皆伝の書'] = 1;
  /* 国主（10・20・30階）を初めて討ったときだけ武士の魂も渡す（2026-10-09・悠さんの指図）。
     ふだんの階からは出さないので、魂の重みは保たれる */
  const soul = n % 10 === 0 ? [30, 60, 100][n / 10 - 1] || 100 : 0;
  return { koban: (300 + n * 40) * (big ? 3 : 1), books, soul };
}
/* 敵の強さ。話が進むほど素の値に掛ける倍を大きくする。
   これにプレイヤーレベルの倍（trLvMul）を掛ける（2026-10-09・悠さんの指図「敵が雑魚すぎる」） */
export const trLvMul = lv => 1 + 0.005 * Math.max(0, (lv || 1) - 1);
export const trFoeMul = i => 0.8 + 0.15 * i;

/* ================= 札 =================
   札の効き目は、持ち主の育った値から毎回作る（覚えない）。
   道中のあいだに武将を育てても、札がそのまま強くなる。 */

/* 特技の文から「添えの効き目」を一つ読む。上から順に、最初に当たったもの */
const TR_RIDERS = [
  ['stun',   /ひるみ|ひるませ|混乱|洗脳/],
  ['burn',   /炎上|感電/],
  ['seal',   /回復不能/],
  ['vuln',   /防御-|防御－/],
  ['weak',   /敵.*(火力|賢さ)[-－]/],
  ['revive', /復活/],
  ['cover',  /かばう|注意を引き付け|挑発/],
  ['thorns', /反撃/],
  ['dodge',  /攻撃されなく|回避|見つからなく/],
  ['crit',   /会心|クリティカル/],
  ['charge', /奥義ゲージ/],
  ['sweep',  /射程|範囲が|正面|十字|前列|周囲|全体/],
  ['mend',   /回復/],
  ['draw',   /速さ\+|報酬/],
  ['might',  /火力\+|賢さ\+|知力\+/],
  ['wall',   /防御\+|被ダメージ/],
];
export function trRider(text) {
  const t = String(text || '').replace(/【[^】]*】/, m => (/全体/.test(m) ? '全体' : ''));
  for (const [k, re] of TR_RIDERS) if (re.test(t)) return k;
  return 'plain';
}

/* 重い札ほど一枚の値打ちを少し上げる（気1あたりの重み） */
const trV = c => c * (1 + 0.1 * (c - 1));
const trMain = st => Math.max(st['火力'] || 0, st['賢さ'] || 0);

/* 属性ごとの素の働き。どの特技も、まずこれをする（2026-10-08）。
   特技の多くは「自身の火力+8%」のような常に効くものなので、それだけでは札にならない。
   素の働き＋文から読んだ添え、の二段にした */
function trBase(attr, st, v) {
  const o = { dmg: 0, blk: 0, heal: 0, draw: 0 };
  if (attr === '猛将') o.dmg = trS(st['火力']) * 0.72 * v;
  else if (attr === '智将') o.dmg = trS(st['賢さ']) * 0.64 * v;
  /* 守将・仁将は一人旅だと打つ手が細すぎた（2026-10-09・悠さんの実機で「打つ 28」）。
     守将は防御の重みでも打ち、仁将は回復の気でも打つ */
  else if (attr === '守将') { o.dmg = trS(trMain(st)) * 0.3 * v + trS(st['防御']) * 0.22 * v; o.blk = trS(st['防御']) * 0.6 * v; }
  else if (attr === '仁将') { o.dmg = trS(trMain(st)) * 0.3 * v + trS(st['回復']) * 0.2 * v; o.heal = trS(st['回復']) * 0.5 * v; }
  else { o.dmg = trS(st['速さ']) * 0.58 * v; if (v >= 2) o.draw = 1; }
  return o;
}
function trApplyRider(o, r, st, v, c) {
  switch (r) {
    case 'stun':   o.stun = c >= 3 ? 1 : 0.5; break;
    case 'burn':   o.burn = trS(trMain(st)) * 0.28 * v; break;
    case 'seal':   o.seal = 2; break;
    case 'vuln':   o.vuln = 2; break;
    case 'weak':   o.weak = 2; break;
    case 'revive': o.revive = 1; o.exhaust = true; break;
    case 'cover':  o.blk += trS(st['防御']) * 0.5 * v; break;
    case 'thorns': o.thorns = trS(st['防御']) * 0.35 * v; o.blk += trS(st['防御']) * 0.2 * v; break;
    case 'dodge':  o.dodge = 1; break;
    case 'crit':   o.crit = 1; break;
    case 'charge': o.charge = 2; break;
    case 'sweep':  o.all = true; o.dmg *= 0.75; break;
    case 'mend':   o.heal += trS(st['回復']) * 0.35 * v; break;
    case 'draw':   o.draw += 1; break;
    case 'might':  o.might = 0.08 * c; break;
    case 'wall':   o.blk += trS(st['防御']) * 0.4 * v; break;
    default:       o.dmg *= 1.2; o.blk *= 1.2; o.heal *= 1.2;
  }
  return o;
}
const trPct = text => {
  const m = String(text || '').match(/(火力|賢さ|知力|防御|回復|速さ)(?:ステータス)?\s*(\d+)%/);
  return m ? { st: m[1] === '知力' ? '賢さ' : m[1], p: +m[2] } : null;
};

/* 武将ひとりの札の種類。who は grownFor を通した武将（育った値・継いだ技が入っている）。
   starOf は特技の★を返す関数（player.js） */
export function trKinds(who, starOf, slots) {
  const out = [];
  /* 自分の武将は特技の枠（slotsOf）から作る（2026-10-09・悠さんの実機で「技が5つない」）。
     grownFor の normals は継いだ固有◆を落としているので、継いだ◆が札にならなかった。
     枠ごとに s0〜s2 の印を付ける。継いだ◆も固有として扱う */
  if (slots) {
    for (const x of slots) {
      if (!x || !x.sk || !x.sk.name) continue;
      const uq = !!x.uniq;
      const cost = uq ? (TR_UNIQ_COST[who.rarity] || 2) : Math.max(1, Math.min(5, (starOf && starOf(x.sk.name)) || 1));
      out.push({ key: 's' + x.slot, kind: uq ? 'u' : 'sk', sk: x.sk, cost });
    }
    if (who.ultimate && who.ultimate.name) out.push({ key: 'ult', kind: 'ult', sk: who.ultimate, cost: TR_COST.ult });
    if (who.generalTrait && who.generalTrait.name) out.push({ key: 'gen', kind: 'gen', sk: who.generalTrait, cost: TR_COST.gen });
    return out;
  }
  if (who.unique && who.unique.name)
    out.push({ key: 'u', kind: 'u', sk: who.unique, cost: TR_UNIQ_COST[who.rarity] || 2 });
  (who.normals || []).forEach((sk, i) => {
    if (!sk || !sk.name) return;
    const star = Math.max(1, Math.min(5, (starOf && starOf(sk.name)) || 1));
    out.push({ key: 'n' + i, kind: 'sk', sk, cost: star });
  });
  if (who.ultimate && who.ultimate.name) out.push({ key: 'ult', kind: 'ult', sk: who.ultimate, cost: TR_COST.ult });
  if (who.generalTrait && who.generalTrait.name) out.push({ key: 'gen', kind: 'gen', sk: who.generalTrait, cost: TR_COST.gen });
  return out;
}
/* 札の名から（属性）と◆を落とす */
export const trName = n => String(n || '').replace(/^[（(][^）)]*[）)]/, '').replace(/◆/g, '');

/* 札一枚の効き目。kd は trKinds の一つ */
export function trSpec(who, kd, F) {
  const st = who.stats || {};
  let c = kd.cost;
  if (kd.kind === 'ult' && F && F.pl) c = Math.max(0, c - (F.pl.charge || 0));
  let o;
  if (kd.kind === 'ult') {
    const pc = trPct(kd.sk.text);
    const t = kd.sk.text || '';
    o = { dmg: 0, blk: 0, heal: 0, draw: 0 };
    const heals = /回復/.test(t) && !/ダメージ/.test(t);
    if (heals) { o.heal = trS(st['回復']) * ((pc ? pc.p : 120) / 100) * 2.6; o.blk = trS(st['防御']) * 1.2; }
    else {
      const base = pc ? trS(st[pc.st]) * pc.p / 100 : trS(trMain(st)) * 1.5;
      o.dmg = base * 2.5;
      if (/全体/.test(t)) o.all = true;
      else if (/十字|周囲|前列|列|正面/.test(t)) o.two = true;
    }
    const r = trRider(t.replace(/ダメージ/g, ''));
    if (['stun', 'burn', 'seal', 'vuln', 'weak', 'dodge', 'thorns'].includes(r)) trApplyRider(o, r, st, 3, 5);
    o.ult = true;
  } else if (kd.kind === 'gen') {
    /* 大将特性は「この戦のあいだずっと」の札（一戦に一度・使えば消える）。
       同じ札を二枚入れれば二重にかかる */
    const t = kd.sk.text || '';
    const m = t.match(/(火力|賢さ|知力|防御|回復|速さ)\+(\d+)%/);
    const k = m ? (m[1] === '知力' ? '賢さ' : m[1])
                : ({ 猛将: '火力', 智将: '賢さ', 守将: '防御', 仁将: '回復', 神速: '速さ' }[who.attr] || '火力');
    const p = m ? +m[2] : 10;
    o = { dmg: 0, blk: trS(st['防御']) * 0.6, heal: 0, draw: 0, exhaust: true, power: true };
    if (k === '火力' || k === '賢さ') o.might = p * 2.5 / 100;
    else if (k === '防御') o.guardUp = p * 3 / 100;
    else if (k === '回復') o.healUp = p * 3 / 100;
    else o.drawUp = 1;
  } else {
    const v = trV(c);
    o = trBase(who.attr, st, v);
    trApplyRider(o, trRider(kd.sk.text), st, v, c);
  }
  for (const k of ['dmg', 'blk', 'heal', 'burn', 'thorns']) if (o[k]) o[k] = trR(o[k]);
  o.cost = c;
  o.need = !!(o.dmg && !o.all);
  return o;
}
/* 札の面に出す短い言葉。数は 打つ・構え・癒す の三つだけ */
export function trWords(o) {
  const w = [];
  if (o.dmg) w.push((o.all ? '敵みなに ' : o.two ? 'ふたりに ' : '') + '打つ ' + o.dmg);
  if (o.blk) w.push('構え ' + o.blk);
  if (o.heal) w.push('癒す ' + o.heal);
  if (o.draw) w.push(`${o.draw}枚引く`);
  if (o.stun) w.push(o.stun >= 1 ? 'ひるませる' : 'ときどきひるませる');
  if (o.burn) w.push('燃やす');
  if (o.seal) w.push('癒しを封じる');
  if (o.vuln) w.push('守りを崩す');
  if (o.weak) w.push('勢いを削ぐ');
  if (o.revive) w.push('一度踏みとどまる');
  if (o.thorns) w.push('打たれたら返す');
  if (o.dodge) w.push('一度かわす');
  if (o.crit) w.push('次の一撃が冴える');
  if (o.charge) w.push('奥義が軽くなる');
  if (o.might) w.push(o.power ? 'この戦、勢いが増す' : '勢いが増す');
  if (o.guardUp) w.push('この戦、構えが固くなる');
  if (o.healUp) w.push('この戦、癒しが厚くなる');
  if (o.drawUp) w.push('この戦、引く札がふえる');
  if (o.exhaust && !o.power) w.push('一戦に一度');
  return w;
}

/* 山札の既定（2026-10-08）。同じ札を重ねて10枚にする。
   奥義1・大将特性1・残りは軽い特技から順に配る */
export function trDefaultDeck(kinds) {
  const d = {};
  for (const k of kinds) d[k.key] = 0;
  if (kinds.some(k => k.key === 'ult')) d.ult = 1;
  if (kinds.some(k => k.key === 'gen')) d.gen = 1;
  let left = TR_DECK - (d.ult || 0) - (d.gen || 0);
  const order = kinds.filter(k => k.kind === 'sk' || k.kind === 'u').sort((a, b) => a.cost - b.cost);
  for (let i = 0; left > 0 && order.length && i < 200; i++) {
    const k = order[i % order.length];
    if (d[k.key] < trDupMax(k.key, kinds)) { d[k.key]++; left--; }
  }
  /* 技が少なくて届かないときは、奥義・大将特性も重ねて10枚にする */
  for (const k of ['gen', 'ult']) while (left > 0 && d[k] != null && d[k] < trDupMax(k, kinds)) { d[k]++; left--; }
  return d;
}
export const trDeckCount = d => Object.values(d || {}).reduce((a, b) => a + (b || 0), 0);
/* 同じ札を何枚まで重ねられるか（2026-10-09）。
   ふだんは技4枚・奥義と大将特性2枚。ただし技の枠が空いていて10枚に届かない武将は、
   届くぶんだけ技の上限を上げる（悠さん「札はできるだけ多いほうがいい」） */
export function trDupMax(key, kinds) {
  const big = key === 'ult' || key === 'gen';
  if (!kinds) return big ? TR_ULT_MAX : TR_DUP;
  const sk = kinds.filter(k => k.kind === 'sk' || k.kind === 'u').length;
  const bigN = kinds.filter(k => k.key === 'ult' || k.key === 'gen').length;
  const room = TR_DECK - bigN * TR_ULT_MAX;
  const skMax = sk ? Math.max(TR_DUP, Math.ceil(room / sk)) : TR_DUP;
  if (big) return sk ? TR_ULT_MAX : Math.max(TR_ULT_MAX, Math.ceil(TR_DECK / Math.max(1, bigN)));
  return skMax;
}
export function trDeckOk(d, kinds) {
  const keys = new Set(kinds.map(k => k.key));
  for (const [k, v] of Object.entries(d || {})) {
    if (!keys.has(k) && v) return false;
    if (v < 0 || v > trDupMax(k, kinds)) return false;
  }
  return trDeckCount(d) === TR_DECK;
}

/* ================= 敵 =================
   敵も同じ武将の札を持つ（2026-10-09・悠さんの指図）。
   どの札を切るかは裏で決め、こちらには「何をしてくるか」だけを見せる。
   一手ごとに 攻める → 守る → 昂る を巡る。並びは敵ごとにずらして、そろって守らないようにする */
const TR_POOL_RAR = i => i < 5 ? ['N', 'R'] : i < 15 ? ['N', 'R', 'SR'] : i < 25 ? ['R', 'SR', 'SSR'] : ['SR', 'SSR', 'UR'];
export const TR_FOE_CYCLE = ['atk', 'guard', 'buff'];
/* 敵の札を三つの袋に分ける。札そのものの数ではなく「何をする札か」だけを覚える */
function trFoeCards(ch, starOf) {
  const bag = { atk: [], guard: [], buff: [] };
  for (const kd of trKinds(ch, starOf)) {
    const t = kd.sk.text || '';
    const r = kd.kind === 'ult' ? trRider(t.replace(/ダメージ/g, '')) : trRider(t);
    const c = { key: kd.key, kind: kd.kind, r, cost: kd.cost, all: /全体/.test(t) };
    if (kd.kind === 'ult') {
      if (/回復/.test(t) && !/ダメージ/.test(t)) bag.guard.push({ ...c, heal: true });
      else bag.atk.push({ ...c, ult: true });
    } else if (kd.kind === 'gen' || ['might', 'crit', 'charge', 'revive', 'draw'].includes(r)) bag.buff.push(c);
    else if (['cover', 'thorns', 'dodge', 'wall', 'mend'].includes(r)) bag.guard.push({ ...c, heal: r === 'mend' });
    else bag.atk.push(c);
  }
  return bag;
}
function trFoe(ch, mul, boss, ph, starOf) {
  const st = {};
  for (const k of ['火力', '賢さ', '防御', '回復', '速さ']) st[k] = (ch.stats[k] || 0) * mul;
  /* 敵の兵量は 2026-10-09 に厚くした（悠さんの実測「敵が雑魚すぎる」・一枚で二体とも倒れていた） */
  const hp = trR((trS(st['防御']) + trS(st['回復'])) * (boss ? 4.8 : 2.3));
  return { no: ch.no, name: ch.name, attr: ch.attr, rarity: ch.rarity, st, hp, mx: hp, blk: 0,
           boss: !!boss, weakT: 0, vuln: 0, stun: 0, burn: 0, burnT: 0, seal: 0, mom: 0, pump: 0,
           t: 0, ph: ph || 0, it: null, ult: 0, cards: trFoeCards(ch, starOf) };
}
/* o.n＝頭数（国主のほか）／o.boss＝国主を出すか／o.elite＝手練れ（強め）／o.seed＝顔ぶれの種 */
export function trFoes(i, all, meNo, starOf, k = 1, o = {}) {
  const s0 = TR_STORY[i];
  const s = { ...s0, n: o.n != null ? o.n : s0.n, boss: o.boss === false ? 0 : s0.boss };
  if (o.elite) k *= 1.25;
  const F = { rs: (o.seed != null ? o.seed : (i + 1) * 7919) + (meNo || 0) * 104729 };
  const me = all.find(c => c.no === meNo);
  const away = c => c.no !== meNo && (!me || c.origin !== me.origin) && c.no !== s.boss;
  const rar = TR_POOL_RAR(i);
  let pool = all.filter(c => c.clan === s.h && rar.includes(c.rarity) && away(c));
  if (pool.length < s.n + 1) pool = pool.concat(all.filter(c => c.clan !== s.h && rar.includes(c.rarity) && away(c)));
  const mul = trFoeMul(i) * k;
  const out = [];
  if (s.boss) {
    const b = all.find(c => c.no === s.boss);
    if (b && (!me || b.origin !== me.origin)) out.push(trFoe(b, mul * 1.15, true, 0, starOf));
    else { const alt = all.filter(c => c.rarity === 'UR' && away(c)); if (alt.length) out.push(trFoe(alt[trInt(F, alt.length)], mul * 1.15, true, 0, starOf)); }
  }
  const want = s.n + out.length;
  const used = new Set(out.map(f => (all.find(c => c.no === f.no) || {}).origin));
  for (let g = 0; out.length < want && pool.length && g < 400; g++) {
    const c = pool[trInt(F, pool.length)];
    pool = pool.filter(x => x !== c);
    if (used.has(c.origin)) continue;
    used.add(c.origin);
    out.push(trFoe(c, mul, false, out.length, starOf));
  }
  return out;
}

/* 次の一手。巡りの番に合う袋から、裏で札を一枚えらぶ。
   袋が空なら、属性なりの素の動きに落ちる（絵や札が足りなくても動く、と同じ考え方） */
function trIntent(F, f) {
  const want = TR_FOE_CYCLE[(f.t + f.ph) % 3];
  const bag = (f.cards && f.cards[want]) || [];
  const atk = trS(Math.max(f.st['火力'], f.st['賢さ'])) * 0.62;
  let c = null;
  if (bag.length) {
    /* 国主の奥義は、攻めの番の二度に一度だけ（毎回撃つと手の打ちようが無い） */
    const ults = bag.filter(x => x.ult), rest = bag.filter(x => !x.ult);
    if (ults.length && (f.boss ? f.ult % 2 === 1 : f.ult % 3 === 2)) c = ults[trInt(F, ults.length)];
    else if (rest.length) c = rest[trInt(F, rest.length)];
    else c = ults[0];
  }
  if (want === 'atk') {
    f.ult++;
    const k = c ? (1 + 0.08 * ((c.cost || 1) - 1)) : 1;
    const it = { k: 'atk', n: trR(atk * k * (c && c.ult ? 2.1 : 1) * (f.pump ? 1.6 : 1)), ult: !!(c && c.ult) };
    if (f.attr === '神速' && !it.ult) { it.x = 2; it.n = trR(it.n * 0.55); }
    if (c) {
      if (c.r === 'stun') it.daze = 1;
      else if (c.r === 'burn') it.burn = trR(atk * 0.3);
      else if (c.r === 'vuln') it.crack = 2;
      else if (c.r === 'weak') it.weak = 2;
      else if (c.r === 'seal') it.seal = 2;
    }
    return it;
  }
  if (want === 'guard') {
    const it = { k: 'guard', n: trR(trS(f.st['防御']) * 1.1) };
    if (c && (c.heal || f.attr === '仁将')) it.heal = trR(trS(f.st['回復']) * 0.9);
    if (c && c.r === 'cover') it.cover = trR(trS(f.st['防御']) * 0.5);
    if (c && c.r === 'thorns') it.thorns = trR(trS(f.st['防御']) * 0.3);
    return it;
  }
  const it = { k: 'buff', mom: 0.2 };
  if (c && (c.r === 'crit' || c.r === 'charge')) it.pump = 1;
  if (c && c.kind === 'gen') it.mom = 0.3;
  return it;
}

/* 自分の兵量の上限。道中のあいだは戦をまたいで減ったままになる */
export const trMaxHp = who => { const st = who.stats || {}; return trR(trS(st['防御']) * 2.6 + trS(st['回復']) * 1.6 + 120); };

/* ================= 道（2026-10-09・悠さんの指図）=================
   一本道では単調なので、札で戦う外国の名作のように **分かれ道** を選ばせる。
   三つの部それぞれが一枚の道。下から上へ9段、10段目は国主（どの道を通っても必ず通る）。
   段の番号がそのまま「階」になる（一の部の1段目＝1階 … 国主＝10階）。
   節の種類：
     戦 … 敵（1〜2体）     強 … 手練れ（2〜3体・強め・褒美が厚い）
     ？ … 何が起きるか分からない   宿 … 休む（兵量が戻る）
     商 … 商人（小判で薬や護符）   宝 … 宝箱
     将 … 国主（10階ごと） */
export const TR_ROWS = 9;                 // 国主の手前までの段
export const TR_COLS = 4;
export const TR_NODE = {
  戦: { mark: '敵', name: '敵' }, 強: { mark: '強', name: '手練れ' }, '？': { mark: '？', name: '未知' },
  宿: { mark: '宿', name: '休憩' }, 商: { mark: '商', name: '商人' }, 宝: { mark: '宝', name: '宝箱' },
  将: { mark: '将', name: '国主' },
};
export function trMap(part, seed) {
  const R = { rs: (seed >>> 0) || 1 };
  const rows = [...Array(TR_ROWS)].map(() => Array(TR_COLS).fill(null));
  const put = (r, c) => rows[r][c] || (rows[r][c] = { t: null, nx: [] });
  /* 道を4本ひく。出だしの列はなるべく散らす。隣の列へ斜めに移るか、まっすぐ上がる */
  const starts = trShuffle(R, [0, 1, 2, 3]);
  for (let k = 0; k < 4; k++) {
    let c = k < 3 ? starts[k] : starts[trInt(R, 3)];
    for (let r = 0; r < TR_ROWS; r++) {
      const n = put(r, c);
      if (r === TR_ROWS - 1) break;
      const nc = Math.max(0, Math.min(TR_COLS - 1, c + [-1, 0, 1][trInt(R, 3)]));
      if (!n.nx.includes(nc)) n.nx.push(nc);
      c = nc;
    }
  }
  /* 種類をきめる。1段目は必ず敵、9段目は必ず宿（国主の前に一息つかせる）、5段目は宝か商 */
  const roll = r => {
    const w = [['戦', 44], ['？', 22], ['商', 9]];
    if (r >= 2) w.push(['強', 13]);
    if (r >= 2 && r !== TR_ROWS - 2) w.push(['宿', 9]);
    w.push(['宝', 3]);
    let x = trRand(R) * w.reduce((a, b) => a + b[1], 0);
    for (const [t, v] of w) { if ((x -= v) < 0) return t; }
    return '戦';
  };
  for (let r = 0; r < TR_ROWS; r++) for (let c = 0; c < TR_COLS; c++) {
    const n = rows[r][c]; if (!n) continue;
    if (r === 0) n.t = '戦';
    else if (r === TR_ROWS - 1) n.t = '宿';
    else if (r === 4) n.t = trRand(R) < 0.6 ? '宝' : '商';
    else {
      let t = roll(r);
      /* 強・宿・商は続けて並ばないようにする（下の段とおなじなら敵に替える） */
      const below = r > 0 ? rows[r - 1].filter(x => x && x.nx.includes(c)).map(x => x.t) : [];
      if (['強', '宿', '商'].includes(t) && below.includes(t)) t = '戦';
      n.t = t;
    }
    n.nx.sort((a, b) => a - b);
  }
  return { part, rows };
}
/* いま進める節。at が null なら1段目ぜんぶ、9段目にいれば国主 */
export function trNext(run) {
  if (!run || !run.map) return [];
  if (!run.at) return run.map.rows[0].map((n, c) => n ? { r: 0, c } : null).filter(Boolean);
  if (run.at.r === 'boss') return [];
  if (run.at.r >= TR_ROWS - 1) return [{ r: 'boss', c: 0 }];
  const n = run.map.rows[run.at.r][run.at.c];
  return (n ? n.nx : []).map(c => ({ r: run.at.r + 1, c }));
}
/* 新しい部の道を敷く。兵量は満たす */
export function trRunNew(part, mx, seed) {
  return { part, map: trMap(part, seed), at: null, path: [], hp: mx, seed, ki: 0, guard: 0 };
}
/* 節から階へ（0 から数える）。国主は各部の10階 */
export const trFloorOf = (part, r) => part * 10 + (r === 'boss' ? 9 : r);

/* ================= 戦 ================= */
/* deck は { key: 枚数 }。kinds は trKinds の並び。seed は戦ごとに変える */
export function trBattle(i, who, kinds, deck, all, seed, starOf, lv, o = {}) {
  const pile = [];
  let u = 0;
  for (const k of kinds) for (let n = 0; n < (deck[k.key] || 0); n++) pile.push({ u: u++, key: k.key });
  const st = who.stats || {};
  const mx = trMaxHp(who);
  const F = {
    i, no: who.no, rs: (seed >>> 0) || 1, turn: 0, over: null,
    pl: { hp: Math.max(1, Math.min(mx, o.hp != null ? o.hp : mx)), mx, blk: 0, might: 0, guardUp: 0, healUp: 0, drawUp: 0, weak: 0, dodge: 0,
          thorns: 0, crit: 0, charge: 0, revive: 0,
          /* 敵の札から受けるもの（2026-10-09）。daze＝次の手番の気が1減る／burn＝手番のはじめに焼ける
             ／crack＝受けが重くなる／seal＝癒せない */
          daze: 0, burn: 0, burnT: 0, crack: 0, seal: 0 },
    lv: lv || 1,
    foes: trFoes(i, all, who.no, starOf, trLvMul(lv), o),
    draw: [], hand: [], disc: [], gone: [], ki: TR_KI,
  };
  F.draw = trShuffle(F, pile);
  trTurn(F);
  /* 商人の品（2026-10-09）。気の巻＝はじめの手番の気＋1／護符＝はじめから構える */
  if (o.ki) F.ki += o.ki;
  if (o.guard) F.pl.blk += o.guard;
  return F;
}
function trDraw(F, n) {
  for (let k = 0; k < n; k++) {
    if (!F.draw.length) { if (!F.disc.length) return; F.draw = trShuffle(F, F.disc); F.disc = []; }
    F.hand.push(F.draw.pop());
  }
}
/* こちらの手番の始まり */
export function trTurn(F) {
  F.turn++;
  F.ki = TR_KI - (F.pl.daze ? 1 : 0); F.pl.daze = 0;
  F.pl.blk = 0; F.pl.thorns = 0;
  if (F.pl.burnT > 0) {
    F.pl.hp = Math.max(F.pl.revive ? 1 : 0, F.pl.hp - F.pl.burn); F.pl.burnT--;
    if (F.pl.hp <= 0) { F.over = 'lose'; return; }
  }
  trDraw(F, TR_HAND + (F.pl.drawUp || 0));
  for (const f of F.foes) if (f.hp > 0) f.it = trIntent(F, f);
}
export const trLive = F => F.foes.filter(f => f.hp > 0);
function trHitFoe(F, f, n, ev) {
  let d = trR(n * (1 + F.pl.might) * (F.pl.weak ? 0.75 : 1) * (f.vuln ? 1.5 : 1));
  const b = Math.min(f.blk, d); f.blk -= b; d -= b;
  f.hp = Math.max(0, f.hp - d);
  ev.push({ t: 'hit', f: F.foes.indexOf(f), n: d, b });
  if (f.hp <= 0) ev.push({ t: 'ko', f: F.foes.indexOf(f) });
  /* 守りの番に「返し」の札を切った敵は、打たれると打ち返す（2026-10-09） */
  if (f.thorns && F.pl.hp > 0) { const r = Math.min(F.pl.hp - 1, f.thorns); if (r > 0) { F.pl.hp -= r; ev.push({ t: 'hurt', n: r, b: 0 }); } }
}
/* 札を使う。h は手札の何枚目、ti は狙う敵の番号。返すのは出来事の並び（画面が光らせるのに使う） */
export function trPlay(F, h, ti, who, kinds) {
  if (F.over) return null;
  const card = F.hand[h]; if (!card) return null;
  const kd = kinds.find(k => k.key === card.key); if (!kd) return null;
  const o = trSpec(who, kd, F);
  if (o.cost > F.ki) return null;
  F.ki -= o.cost;
  F.hand.splice(h, 1);
  if (o.exhaust) F.gone.push(card); else F.disc.push(card);
  if (o.ult) F.pl.charge = 0;
  const ev = [{ t: 'play', key: card.key, kind: kd.kind }];
  const live = trLive(F);
  const tgt = F.foes[ti] && F.foes[ti].hp > 0 ? F.foes[ti] : live[0];
  if (o.dmg && live.length) {
    const n = o.dmg * (F.pl.crit ? 2 : 1);
    if (F.pl.crit) { F.pl.crit = 0; ev.push({ t: 'crit' }); }
    const list = o.all ? live : o.two ? [tgt, ...live.filter(x => x !== tgt)].slice(0, 2) : [tgt];
    for (const f of list) trHitFoe(F, f, n, ev);
  }
  const tg = o.all ? trLive(F) : (tgt && tgt.hp > 0 ? [tgt] : []);
  for (const f of tg) {
    if (o.stun && (o.stun >= 1 || trRand(F) < o.stun)) { f.stun = 1; ev.push({ t: 'stun', f: F.foes.indexOf(f) }); }
    if (o.burn) { f.burn = Math.max(f.burn, o.burn); f.burnT = 3; }
    if (o.seal) f.seal = Math.max(f.seal, o.seal);
    if (o.vuln) f.vuln = Math.max(f.vuln, o.vuln);
    if (o.weak) f.weakT = Math.max(f.weakT || 0, o.weak);
  }
  if (o.blk) { const b = trR(o.blk * (1 + F.pl.guardUp)); F.pl.blk += b; ev.push({ t: 'blk', n: b }); }
  if (o.heal) {
    const h2 = F.pl.seal ? 0 : Math.min(F.pl.mx - F.pl.hp, trR(o.heal * (1 + F.pl.healUp)));
    F.pl.hp += h2; ev.push({ t: 'heal', n: h2 });
  }
  if (o.thorns) F.pl.thorns += o.thorns;
  if (o.dodge) F.pl.dodge += o.dodge;
  if (o.crit) F.pl.crit = 1;
  if (o.charge) F.pl.charge += o.charge;
  if (o.revive) F.pl.revive = 1;
  if (o.might) F.pl.might += o.might;
  if (o.guardUp) F.pl.guardUp += o.guardUp;
  if (o.healUp) F.pl.healUp += o.healUp;
  if (o.drawUp) F.pl.drawUp += o.drawUp;
  if (o.draw) trDraw(F, o.draw);
  if (!trLive(F).length) F.over = 'win';
  return ev;
}
/* 手番を終える。手札は捨て札へ。このあと敵を一匹ずつ trFoeAct で動かす */
export function trEnd(F) { F.disc.push(...F.hand); F.hand = []; }
function trHitMe(F, f, n, ev) {
  if (F.pl.dodge > 0) { F.pl.dodge--; ev.push({ t: 'dodge' }); return; }
  let d = trR(n * ((f.weakT || 0) > 0 ? 0.75 : 1) * (1 + f.mom) * (F.pl.crack ? 1.25 : 1));
  const b = Math.min(F.pl.blk, d); F.pl.blk -= b; d -= b;
  F.pl.hp = Math.max(0, F.pl.hp - d);
  ev.push({ t: 'hurt', n: d, b, f: F.foes.indexOf(f) });
  if (F.pl.thorns && f.hp > 0) {
    const r = Math.min(f.hp, F.pl.thorns); f.hp -= r;
    ev.push({ t: 'hit', f: F.foes.indexOf(f), n: r, b: 0 });
    if (f.hp <= 0) ev.push({ t: 'ko', f: F.foes.indexOf(f) });
  }
  if (F.pl.hp <= 0 && F.pl.revive) { F.pl.revive = 0; F.pl.hp = trR(F.pl.mx * 0.3); ev.push({ t: 'revive' }); }
}
/* 敵ひとりの手番。fi は敵の番号 */
export function trFoeAct(F, fi) {
  const f = F.foes[fi]; const ev = [];
  if (!f || f.hp <= 0 || F.over) return ev;
  f.blk = 0; f.thorns = 0;
  if (f.burnT > 0) {
    const d = Math.min(f.hp, f.burn); f.hp -= d; f.burnT--;
    ev.push({ t: 'hit', f: fi, n: d, b: 0, burn: true });
    if (f.hp <= 0) { ev.push({ t: 'ko', f: fi }); if (!trLive(F).length) F.over = 'win'; return ev; }
  }
  if (f.stun) { f.stun = 0; ev.push({ t: 'skip', f: fi }); }
  else {
    const it = f.it || trIntent(F, f);
    ev.push({ t: 'act', f: fi, k: it.k, ult: !!it.ult });
    if (it.k === 'atk') {
      for (let x = 0; x < (it.x || 1) && F.pl.hp > 0; x++) trHitMe(F, f, it.n, ev);
      f.pump = 0;
      if (it.daze) F.pl.daze = 1;
      if (it.burn) { F.pl.burn = Math.max(F.pl.burn, it.burn); F.pl.burnT = 2; }
      if (it.crack) F.pl.crack = Math.max(F.pl.crack, it.crack);
      if (it.weak) F.pl.weak = Math.max(F.pl.weak, it.weak);
      if (it.seal) F.pl.seal = Math.max(F.pl.seal, it.seal);
    } else if (it.k === 'guard') {
      f.blk += it.n; ev.push({ t: 'fblk', f: fi, n: it.n });
      if (it.cover) for (const g of trLive(F)) if (g !== f) { g.blk += it.cover; ev.push({ t: 'fblk', f: F.foes.indexOf(g), n: it.cover }); }
      if (it.thorns) f.thorns = it.thorns;
      if (it.heal && !f.seal) {
        const tg = trLive(F).sort((a, b) => a.hp / a.mx - b.hp / b.mx)[0];
        if (tg) { const h = Math.min(tg.mx - tg.hp, it.heal); if (h) { tg.hp += h; ev.push({ t: 'fheal', f: F.foes.indexOf(tg), n: h }); } }
      }
    } else {
      f.mom = Math.min(1, f.mom + it.mom);
      if (it.pump) f.pump = 1;
      ev.push({ t: 'fbuff', f: fi });
    }
  }
  f.t++;
  if (f.seal > 0) f.seal--;
  if (f.vuln > 0) f.vuln--;
  if ((f.weakT || 0) > 0) f.weakT--;
  if (F.pl.hp <= 0) F.over = 'lose';
  if (!trLive(F).length) F.over = 'win';
  return ev;
}
/* 敵がみな動いたあと。こちらの弱りを一つ減らして、次の手番へ */
export function trRound(F) {
  if (F.over) return;
  if (F.pl.weak > 0) F.pl.weak--;
  if (F.pl.crack > 0) F.pl.crack--;
  if (F.pl.seal > 0) F.pl.seal--;
  trTurn(F);
}
