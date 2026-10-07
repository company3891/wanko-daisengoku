// わんこ大戦国 プレイヤーデータとガチャ（2026-09-21）
// 所持武将・通貨・部隊プリセットを端末に保存する。ここには画面の都合を持ち込まない。
import { PREF, PREFS, REGION_ORDER, prefsOf, homePrefOf, FOOD_COST, chapterRank, foodCost } from './campaign.js';

/* ================= 保存 ================= */
const KEY = 'wanko.player.v1';
export const SQUAD_MAX = 5;
export const COST_MAX = 1000;
/* ---- コスト上限の一時上げ（2026-09-23）----
   P.costUp = { add: 200, until: ミリ秒 }。刻限を過ぎたら消える。 */
export function costBuff() {
  const b = P.costUp;
  if (!b || !b.until || b.until <= Date.now()) { if (P.costUp) { P.costUp = null; savePlayer(); } return null; }
  return b;
}
export const costMax = () => COST_MAX + (costBuff() ? costBuff().add : 0);
/* 残りをうけとる。「あと 3時間20分」のように出す */
export function costBuffLeft() {
  const b = costBuff(); if (!b) return '';
  const m = Math.max(0, Math.round((b.until - Date.now()) / 60000));
  return m >= 60 ? `${Math.floor(m / 60)}時間${m % 60 ? `${m % 60}分` : ''}` : `${m}分`;
}
/* 品を飲む。効いているあいだに飲んだら、長いほうの刻限に伸ばす */
export function useCostItem(name) {
  const it = ITEMS[name];
  if (!it || !it.costUp || item(name) < 1) return false;
  const now = Date.now();
  const end = now + it.hours * 3600e3;
  const b = costBuff();
  P.costUp = { add: it.costUp, until: b ? Math.max(b.until, end) : end };
  P.items[name] -= 1;
  savePlayer();
  return P.costUp;
}

export const P = {
  own: [],            // 所持している武将のNo.（重複は持たない。重ねて引いたら魂になる）
  /* 名乗り（2026-09-24）。はじめに一度だけ決める。空のうちは名乗りの札が出る */
  name: '',
  /* はじまりの一騎（2026-09-25）。チュートリアルで選んだ武将のNo.。
     出陣の名乗りの絵に使う。P に並べておかないと保存から読み戻らない */
  first: 0,
  lv: 1, exp: 0,
  stamina: 100, staminaMax: 100,
  /* 兵糧を最後に数え直した時刻（2026-09-26）。時間で戻す仕掛けに使う。
     P の既定値に並べておかないと loadPlayer が読み戻さない */
  foodAt: 0,
  paid: 0,            // 有償ストーン（金の勾玉）
  /* ストーン販売所で買った控え（2026-10-07）。
     P の既定値に並べておかないと loadPlayer が読み戻さない */
  buys: [],
  /* 無償ストーン（青の勾玉）。はじめは持たせない（2026-09-26）。
     むかしは 3000 を配っていたが、門出のお役目を果たしてもらう形に寄せた */
  /* 背景を動かすか（2026-09-26）。古い端末や電池のために切れるようにした。
     ここに並べておかないと loadPlayer が読み戻さない */
  bgMove: true,
  free: 0,
  soul: 0,            // 武士の魂
  koban: 0,           // 小判
  gun: 0,             // 軍功（2026-09-25）。番付でしか手に入らない。ショップの番付の蔵で使う
  /* 引き継ぎの備え（2026-09-25）。
     code＝手形（世界にひとつの名札）／pass＝合言葉の覚え／salt＝その味付け
     at＝備えた日／ties＝挿した紐（LINEなど。サーバーができてから）
     P に並べておかないと保存から読み戻らない */
  link: { code: '', pass: '', salt: '', at: 0, ties: {} },
  draws: 0,           // ガチャ通算回数（御籤番号に使う。くじをまたいだ通し番号）
  sinceSR: 0, sinceSSR: 0, sinceUR: 0,   // 古い保存からの引き継ぎ用。いまは pity を見る
  /* 天井の数えは くじごとに持つ（2026-09-28）。
     一本の数えだと、祭りのくじを引いた進みが門出のくじにも乗ってしまう。
     { <くじの印>: { sr, ssr, ur, draws } }。P に並べないと保存から読み戻らない */
  pity: {},
  firstFree: true,    // 初回10連が無料かどうか
  /* 一日ひとたびの ただ引き（2026-10-02）。{ <くじの印>: '使った日' }。
     P の既定値に並べておかないと loadPlayer が読み戻さない */
  gfree: {},
  /* 音の入り切り（2026-09-28）。前は画面の覚え（S）に置いていたので、
     入れても開き直すたびにオフへ戻っていた。P に並べて覚えさせる。
     はじめから入にしておく（2026-09-30）。端末は人が触るまで鳴らせないが、
     スタートの画面をたたいた時点で触れたことになるので、そこから鳴り出す */
  sound: true,
  /* 種類ごとの入り切りと大きさ（2026-09-28）。v は 0〜1。
     既定は もとの音の作り（BGM 平均 -21dB／環境音 -27dB）に合わせた値。
     P に並べておかないと保存から読み戻らない */
  mix: { bgm: { on: true, v: .55 }, amb: { on: true, v: .40 }, se: { on: true, v: .70 } },
  tutorial: 0,        // 0=未実施 1=SSR選択済み 2=完了
  wins: 0, battles: 0,
  squads: [],
  active: 0,
  /* 天下統一の進み具合（2026-09-21）
     start=出発した国 ／ done={県:勝った戦の数} ／ intro=開幕の物語を見たか ／ clear=天下統一したか */
  /* got＝もう褒美を受け取った国（2026-09-27）。制覇の褒美は初回の一度だけ */
  camp: { start: null, done: {}, intro: false, clear: false, got: [] },
  /* 道具（2026-09-21）。{ '稽古の書': 3, ... } */
  items: {},
  /* コスト上限の一時上げ（2026-09-23）。{ add, until } か null */
  costUp: null,
  /* 合戦を手動で始めるか（2026-09-23）。前の戦で選んだほうを覚えておく */
  manual: false,
  /* 合戦の速さ（2026-09-24）。1＝通常／1.5＝1.5倍／2＝2倍（最大・元の速さ） */
  speed: 1,
  /* お知らせ（2026-09-24）。読んだ記事の id と、お詫びを配り終えた記事の id。
     ここに並べておかないと loadPlayer が読み戻さず、開くたび未読に戻ってしまう */
  newsRead: [],
  newsGot: [],
  /* お役目（2026-09-24）。
     day/week ＝ 日課・週課をいつ空にしたか
     d/w/t    ＝ 数えたもの（日ごと／週ごと／ずっと）
     gd/gw/ge/gt ＝ 褒美を受け取り済みの id（日課・週課・お祭り・功名）
     ここに並べておかないと loadPlayer が読み戻さない */
  /* gf ＝門出（初回だけのお役目）で受け取り済みの id（2026-09-26） */
  mi: { day: '', week: '', d: {}, w: {}, t: {}, gd: [], gw: [], ge: [], gt: [], gf: [] },
  /* 称号（2026-09-24）。titles＝持っているもの／title＝いま名乗っているもの */
  titles: [],
  title: '',
  rkBuy: [],          // 番付の蔵で一度きりの品を買った控え（2026-09-25）
  /* 手引き（2026-09-25）。城に入ってからの案内。
     on＝出しているか／got＝仕上げの褒美を受け取ったか */
  tut2: { on: false, got: false },
  /* はじめての手引き（2026-09-30）。何歩目かを持つ。0＝出さない（済み・古い保存）。
     P に並べておかないと保存から読み戻らない */
  gstep: 0,
  /* 手引きを「やめる」で降りたときの歩（2026-10-02）。
     環境設定から つづきに戻すのに使う。0＝やめていない（はじめから）。
     P に並べておかないと保存から読み戻らない */
  gquit: 0,
  /* 「はじめの一度だけ必ず成功」の札（2026-10-01）。使ったら消える。
     もとは「手引きが進んでいるあいだ（P.gstep > 0）」を条件にしていたが、
     手引きの歩が指す先を見失ったまま止まると P.gstep が 0 に戻らず、
     強化も継承も **ずっと必ず成功** になっていた（しくじりの札が一生出ない）。
     一度きりの札なら、どこで止まっても二度目からは素直にさいころを振る。
     古い保存には無いので、既定は false（もう何度も試している人に只の成功は配らない）。
     はじめる人には grantStarter が true を立てる。
     P に並べておかないと保存から読み戻らない */
  firstSure: { up: false, inh: false },
  /* 番付（2026-09-25）。段・持ち点・表の種・対戦札・留守番の記録など。
     P に並べておかないと保存から読み戻らない。中身は rank.js の決めごとに合わせる */
  rk: null,
  /* 武将取引所（2026-10-01）。listed＝出している品／log＝売れた取引履歴／
     sold＝もう買った品の印／at＝最後に取引履歴を確かめた時刻。
     P に並べておかないと保存から読み戻らない */
  market: null,
  /* 友（2026-10-06）。palTag＝自分の主番号（人に見せてよい番号。
     引き継ぎIDは乗っ取りの鍵なので別もの）／palNpc＝友になった国の主の印 */
  palTag: '', palNpc: [],
  /* palNpcAsk＝国の主に出した願い（印→受けてくれる時刻）／
     palMoved＝平定ぶんを友へ引き継いだ印（一度きり・2026-10-06） */
  palNpcAsk: null, palMoved: 0,
  /* awayLog＝留守のあいだに攻められた覚え（2026-10-06）。
     サーバーの置き手紙は一度受け取ると消えるので、手元にも控えを残す。
     新しい保存の品は必ずここに並べる。並べないと localStorage から読み戻らない */
  awayLog: [],
  /* 試練の塔（2026-10-01）。floor＝いま挑める階（1から）／got＝褒美を受け取った階
     P に並べておかないと保存から読み戻らない */
  tower: { floor: 1, got: [] },
  /* 友（2026-09-24）。制覇した国の主が友になる。
     国id → { win, lose, spar:'20260924', gift:'20260924', back:{koban,stamina} }
     spar＝最後に稽古した日／gift＝最後に見舞いを置いた日／back＝届いている返礼 */
  fr: {},
  /* お祭りの進み具合（2026-09-23）。{ cleared, day, doneDay, week, doneWeek }
     ここに無い項目は loadPlayer が読み込まないので、必ず並べておくこと */
  ev: null,
  /* 武将ごとの育成（2026-09-21）。{ '8': { lv, exp, awake, sp:{火力,…} } } */
  chars: {},
  /* ショップ（2026-09-21）。day=振り売りの日付 ／ bought={品名:買った数} */
  shop: { day: '', bought: {} },
  /* 重ねて引いた同じ武将（2026-09-21）。{ '8': 2 }。旧形式。いまは cnt を使う */
  dup: {},
  /* いま持っている枚数（2026-09-21）。{ '8': 3 }。0 になっても図鑑からは消えない */
  cnt: {},
  cntV2: false,          // 旧形式（本体＋重ね）から読み替えたか。P に置かないと保存から戻らない
  awakeV3: false,        // 覚醒の品を「無銘＋軍配（属性つき）」に読み替えたか（2026-09-23）

};

/* ================= 育成（2026-09-21） ================= */

/* 道具。ショップと報酬で手に入る（2026-09-21 拡張）
   kind … 蔵の棚分け ／ price … 小判の値 ／ use … 持ち物からその場で使えるか */
export const ITEMS = {
  '稽古の書':   { kind: '稽古', exp: 1000,   price: 300,  desc: '武将の経験を 1,000 積む' },
  '大稽古の書': { kind: '稽古', exp: 5000,   price: 1200, desc: '武将の経験を 5,000 積む' },
  '皆伝の書':   { kind: '稽古', exp: 25000,  price: 5000, desc: '武将の経験を 25,000 積む' },
  /* 兵糧は小判ではなく石で買う（2026-10-02）。
     小判は戦えば際限なく貯まるので、小判で兵糧が買えると
     いつまでも出陣し続けられてしまい、兵糧という仕掛けそのものが意味を失う。
     石は数にかぎりがあるので、「今日はここまで」の線が引ける */
  '兵糧丸':     { kind: '兵糧', food: 30,    stone: 30,   use: true, desc: '兵糧を 30 もどす' },
  /* 兵糧俵は 1000 → 5000（2026-10-02）。
     兵糧丸（30もどす）が400なので、満たす一俵が1000では安すぎて
     「待つ」という決まりごとが無いのと同じになっていた */
  '兵糧俵':     { kind: '兵糧', food: 9999,  stone: 100,  use: true, desc: '兵糧を満たす' },
  /* 伝書と護符は小判では買えない（2026-10-02）。
     小判で買えると、特技の位も継承も「通えば上がる」ものになってしまい、
     重ねを食わせる・しくじるという山場が無くなる。
     手に入れ方は お祭り・お役目・番付・みくじの積みだけに絞った。
     値は残してある（品の重さの目安と、いつか別の交換に使うため） */
  '特技の伝書': { kind: '特技', skill: 1,    price: 2500, noShop: true, desc: '特技を1段上げる（特技強化で使う）' },
  /* 特技強化の成功率を上げる護符。1回の強化にひとつだけ添えられる */
  '上達の護符・小': { kind: '特技', luck: 15, price: 800,  noShop: true, desc: '特技強化の成功率を 15% 上げる' },
  '上達の護符・中': { kind: '特技', luck: 30, price: 2000, noShop: true, desc: '特技強化の成功率を 30% 上げる' },
  '上達の護符・大': { kind: '特技', luck: 60, price: 5000, noShop: true, desc: '特技強化の成功率を 60% 上げる' },
  /* 特技継承の成功率を上げる護符（2026-09-22）。強化の護符とは別もので、継承にしか効かない。
     継承はもともと当たりが薄い（◆の3つ目は素材3つでも15%）ので、伸びしろを大きめに取った */
  '相伝の護符・小': { kind: '特技', luckInh: 10, price: 1200, noShop: true, desc: '特技継承の成功率を 10% 上げる' },
  '相伝の護符・中': { kind: '特技', luckInh: 20, price: 3000, noShop: true, desc: '特技継承の成功率を 20% 上げる' },
  '相伝の護符・大': { kind: '特技', luckInh: 40, price: 7500, noShop: true, desc: '特技継承の成功率を 40% 上げる' },
  /* ---- 陣触れの品（2026-09-23）----
     出せる部隊のコスト上限を、決めた時間だけ 200 上げる。
     効いているあいだは重ねて飲んでも足し算にはならず、長いほうの刻限で上書きする。 */
  '陣触れの狼煙': { kind: '編成', costUp: 200, hours: 1,  price: 600,  use: true,
    desc: 'コストの上限を 1時間 200 上げる' },
  '陣触れの太鼓': { kind: '編成', costUp: 200, hours: 6,  price: 2500, use: true,
    desc: 'コストの上限を 6時間 200 上げる' },
  '陣触れの旗印': { kind: '編成', costUp: 200, hours: 12, price: 4000, use: true,
    desc: 'コストの上限を 12時間 200 上げる' },
};
/* 蔵の並び順 */
export const ITEM_KINDS = ['稽古', '兵糧', '特技', '編成', '陣中'];

/* ---------------- 陣中で使う道具（2026-09-21） ----------------
   合戦のさなかに使う。押したターンの頭から、その戦のあいだずっと効く。
   秘薬は自軍だけ。天候の品は両軍にかかる＝相手の得意も変える読み合いになる。 */
export const BATTLE_STATS = ['火力', '賢さ', '防御', '回復', '速さ'];
export const WEATHERS = ['晴', '曇', '雨', '嵐', '雪'];
export const WEATHER_ITEM = {
  晴: '照る照る坊主', 曇: '朧の香', 雨: '雨乞いの壺', 嵐: '野分の法螺貝', 雪: '風花の鈴',
};
for (const st of BATTLE_STATS) {
  ITEMS[`${st}の秘薬・小`] = { kind: '陣中', inBattle: true, stat: st, pct: 5,  price: 600,
    desc: `合戦のあいだ、味方全員の${st}を 5% 上げる` };
  ITEMS[`${st}の秘薬・大`] = { kind: '陣中', inBattle: true, stat: st, pct: 10, price: 1800,
    desc: `合戦のあいだ、味方全員の${st}を 10% 上げる` };
}
for (const w of WEATHERS) {
  ITEMS[WEATHER_ITEM[w]] = { kind: '陣中', inBattle: true, weather: w, price: 1200,
    desc: `天候を「${w}」に変える（両軍にかかる）` };
}

/* ---------------- お祭りの札（2026-09-21） ----------------
   イベントのガチャを引く札。石では引けず、イベントを勝ち抜いた褒美でしか手に入らない。
   イベントとイベントガチャは後日。いまは札を持つところまで */
export const TICKET = '祭の札';
/* 一度引く＝1枚、十連＝10枚（2026-09-30）。
   石と同じ数え方にしておくと、褒美で配った枚数がそのまま
   「あと何回引けるか」になって、遊ぶ人が数えなくて済む */
export const TICKET_PRICE = { single: 1, ten: 10 };
ITEMS[TICKET] = { kind: 'お祭り', ticket: 1, noShop: true,
  desc: `祭りのくじを引く札。一度引くに1枚、十連に${TICKET_PRICE.ten}枚` };

/* ---------------- 覚醒の品（2026-09-23 改訂） ----------------
   ・「無銘」は代用品ではなく、**いちばん下の覚醒素材**。籠手→具足→兜の三段で、数を積む
   ・「軍配」は属性ごとに別の品。木→鉄→金の三段で、段が進むほど少数精鋭
   前は「属性つきの籠手」と「属性を問わない軍配」だったが、
   属性の縛りを軍配のほうへ寄せ、数を積むほうを無銘に一本化した。 */
export const ATTRS = ['猛将', '智将', '守将', '仁将', '神速'];
export const AWAKE_TIERS = ['籠手', '具足', '兜'];      // 一段め → 三段め
export const BADGES = ['木の軍配', '鉄の軍配', '金の軍配'];
const TIER_PRICE  = [900, 2200, 5000];
const BADGE_PRICE = [2000, 5500, 14000];
/* 無銘の籠手／具足／兜。属性は問わない */
export const freeMat = tier => `無銘の${AWAKE_TIERS[tier]}`;
/* 木の軍配・智将 のように、属性ごとに別の品 */
export const badgeMat = (attr, rank) => `${BADGES[rank]}・${attr}`;
/* 古い呼び名。まだ呼んでいるところがあるので、無銘に読み替えて残す */
export const awakeMat = (attr, tier) => freeMat(tier);

for (let t = 0; t < 3; t++) {
  ITEMS[freeMat(t)] = {
    kind: '覚醒', free: true, tier: t, price: TIER_PRICE[t],
    desc: `覚醒に積む${AWAKE_TIERS[t]}（${t + 1}段め）。属性は問わない`,
  };
}
for (const attr of ATTRS) for (let r = 0; r < 3; r++) {
  ITEMS[badgeMat(attr, r)] = {
    kind: '覚醒', attr, badge: r, price: BADGE_PRICE[r],
    desc: `${attr}の武将の覚醒に要る芯（${r + 1}段め）`,
  };
}

/* 段ごとの要りよう（2026-09-23）。
   b = 軍配の段（属性つき） ／ f = 無銘の段 */
const AWAKE_RECIPE = [
  [{ b: 0, n: 5 },  { f: 0, n: 10 }, { f: 1, n: 10 }],                    // Lv50 → 60
  [{ b: 1, n: 5 },  { b: 0, n: 5 },  { f: 0, n: 20 }, { f: 1, n: 10 }],   //     → 70
  [{ b: 2, n: 1 },  { b: 1, n: 5 },  { b: 0, n: 10 }, { f: 2, n: 10 }],   //     → 80
  [{ b: 2, n: 3 },  { b: 1, n: 10 }, { f: 2, n: 20 }, { f: 1, n: 20 }],   //     → 90
  [{ b: 2, n: 5 },  { b: 1, n: 20 }, { b: 0, n: 20 }, { f: 2, n: 40 }],   //     → 99
];
/* レアリティが高いほど多く要る（上限そのものは同じ） */
const RAR_MUL = { N: 1, R: 1, SR: 1.5, SSR: 2, UR: 2.5 };
/* その回の覚醒に要るものを、並びで返す */
export function awakeNeed(rarity, times, attr) {
  const r = AWAKE_RECIPE[times]; if (!r) return null;
  const m = RAR_MUL[rarity] || 1;
  return r.map(x => ({
    name: x.b != null ? badgeMat(attr, x.b) : freeMat(x.f),
    n: Math.ceil(x.n * m),
    badge: x.b != null,
  }));
}
/* いま覚醒できるか。足りない品がひとつでもあれば ok は false */
export function awakeCheck(rarity, times, attr) {
  const need = awakeNeed(rarity, times, attr);
  if (!need) return null;
  const rows = need.map(x => ({ ...x, have: item(x.name), ok: item(x.name) >= x.n }));
  const koban = awakeKoban(times);
  const kobanOk = P.koban >= koban;
  return { rows, koban, kobanOk, matOk: rows.every(x => x.ok), ok: rows.every(x => x.ok) && kobanOk };
}
export const item = k => P.items[k] || 0;
export function addItem(k, n) { P.items[k] = item(k) + n; savePlayer(); }
export function useItem(k, n) {
  if (item(k) < n) return false;
  P.items[k] -= n; savePlayer(); return true;
}

/* レベルの上限。覚醒するたびに開く（レアリティは変わらない） */
export const LV_CAP = [50, 60, 70, 80, 90, 99];
export const AWAKE_MAX = 5;
/* 覚醒に要る小判（2026-09-25）。段が上がるほど重くする。
   素材だけだと、貯まった品を流し込むだけの作業になっていた。
   小判を噛ませると「今この子に使うか」を選ぶことになる */
export const AWAKE_KOBAN = [5000, 20000, 50000, 80000, 100000];
export const awakeKoban = times => AWAKE_KOBAN[times] ?? AWAKE_KOBAN[AWAKE_KOBAN.length - 1];
// 次のレベルに要る経験。低いうちは軽く、上がるほど重い
export const expToNext = lv => 100 + lv * 30;
// 自由育成は武士の魂で振る。5つ合わせて999まで
export const SP_MAX = 999;
export const SP_STATS = ['火力', '賢さ', '防御', '回復', '速さ'];

const blank = () => ({ lv: 1, exp: 0, awake: 0, sp: { 火力: 0, 賢さ: 0, 防御: 0, 回復: 0, 速さ: 0 } });
export function charState(no) {
  const k = String(no);
  if (!P.chars[k]) P.chars[k] = blank();
  const c = P.chars[k];
  if (!c.sp) c.sp = blank().sp;
  for (const s of SP_STATS) if (typeof c.sp[s] !== 'number') c.sp[s] = 0;
  /* 枠の数え方を「一の枠＝固有◆」に改めた（2026-09-21）。
     特技は固有と通常を合わせて3つなので、固有も枠のひとつとして数える。
     古い保存は通常特技が 0・1 番だったので、ひとつずつ後ろへずらす */
  if (!c.v2) {
    const osk = Array.isArray(c.sk) ? c.sk : [];
    const oin = Array.isArray(c.inh) ? c.inh : [];
    c.sk = [1, osk[0] ?? 1, osk[1] ?? 1];
    c.inh = [null, oin[0] ?? null, oin[1] ?? null];
    c.v2 = true;
  }
  if (!Array.isArray(c.sk)) c.sk = [1, 1, 1];
  if (!Array.isArray(c.inh)) c.inh = [null, null, null];
  return c;
}
export const lvCapOf = no => LV_CAP[Math.min(charState(no).awake, AWAKE_MAX)];
export const spUsed = no => SP_STATS.reduce((a, s) => a + charState(no).sp[s], 0);

/* 道具を食わせて経験を積む。上限に達したら余りは捨てずに貯めておく */
export function feedBook(no, kind, n) {
  const it = ITEMS[kind];
  if (!it || !it.exp || !useItem(kind, n)) return null;
  const c = charState(no);
  c.exp += it.exp * n;
  const cap = lvCapOf(no);
  let up = 0;
  while (c.lv < cap && c.exp >= expToNext(c.lv)) { c.exp -= expToNext(c.lv); c.lv++; up++; }
  if (c.lv >= cap) c.exp = Math.min(c.exp, expToNext(c.lv));   // 上限では貯めすぎない
  savePlayer();
  return { lv: c.lv, up };
}
/* 覚醒。レベルの上限だけが開く。レアリティも大将特性も変わらない（2026-09-21 素材制に変更） */
export function awaken(no, rarity, attr) {
  const c = charState(no);
  if (c.awake >= AWAKE_MAX) return null;
  const k = awakeCheck(rarity, c.awake, attr);
  if (!k || !k.ok) return null;
  for (const x of k.rows) P.items[x.name] = item(x.name) - x.n;
  P.koban -= k.koban;                      // 小判も払う（2026-09-25）
  c.awake++;
  savePlayer();
  return { awake: c.awake, cap: lvCapOf(no), rows: k.rows };
}
/* 自由育成。武士の魂1つで1ポイント */
export function addSp(no, stat, n) {
  const c = charState(no);
  if (!SP_STATS.includes(stat)) return false;
  const room = Math.min(n, SP_MAX - spUsed(no), P.soul);
  if (room <= 0) return false;
  c.sp[stat] += room; P.soul -= room;
  savePlayer();
  return room;
}
/* 下書きをまとめて確定する（2026-09-21）。
   画面では ＋−で下書きを作り、「強化を確定する」で一度に通す。
   足りない・はみ出すときは何も通さない＝途中まで通って壊れることがない */
export function commitSp(no, draft) {
  const c = charState(no);
  let total = 0;
  for (const s of SP_STATS) {
    const v = Math.max(0, Math.floor(draft[s] || 0));
    if (v) total += v;
  }
  if (total <= 0) return null;
  if (total > P.soul) return null;
  if (spUsed(no) + total > SP_MAX) return null;
  for (const s of SP_STATS) c.sp[s] += Math.max(0, Math.floor(draft[s] || 0));
  P.soul -= total;
  savePlayer();
  return total;
}
/* 育てたぶんを乗せたステータスを返す（戦闘へ渡す値） */
export function grownStats(ch) {
  const c = charState(ch.no);
  const base = ch.stats || {};
  const out = {};
  // レベル1を100%として、1レベルごとに +2%（Lv99で約3倍）
  const mul = 1 + (c.lv - 1) * 0.02;
  for (const s of SP_STATS) out[s] = Math.round((base[s] || 0) * mul) + (c.sp[s] || 0);
  return out;
}


/* ================= 特技強化（2026-09-21） =================
   通常特技はLv3まで。素材は「同じ通常特技を持つ武将の重ね」か「特技の伝書」。
   成功率は特技の★で決まり、素材を積むほど足し算で上がる。上達の護符を1つ添えられる。
   失敗すると積んだ素材は消える（レベルは上がらない）。 */
export const SKILL_MAX = 3;                       // 通常特技のレベル上限
/* 1回に使える素材は1つだけ（2026-09-25 に 5→1）。
   重ねて成功率を上げる形は、画面が込み入るわりに得がなかった。
   3枚で60%と1枚で20%は、成功1回あたりに要る枚数が同じ（どちらも5枚）。
   重ねは「一発で決めたい」ためのブレ消しでしかなかったので、
   分かりやすさを取って「キャラ1体 × 道具1つ」にそろえた。数値はそのまま */
export const MAT_MAX = 1;                         // 1回に使える素材の数
export const BOOK = '特技の伝書';
/* 特技の★＝その特技を持つ武将のうち、いちばん低いレアリティ */
const STAR_BY_RARITY = { N: 1, R: 2, SR: 3, SSR: 4, UR: 5 };
/* ★ごとの、素材1つあたりの成功率（%）。
   通常特技3枠をすべてLv3にするのに要るカードが ★1で25体／★5で100体 になるよう置いた */
export const STAR_RATE = [0, 40, 32, 24, 15, 7];

let STAR_CACHE = null;
export function buildStars(all) {
  STAR_CACHE = {};
  for (const c of all) for (const n of (c.normals || [])) {
    const r = STAR_BY_RARITY[c.rarity] || 1;
    STAR_CACHE[n.name] = STAR_CACHE[n.name] ? Math.min(STAR_CACHE[n.name], r) : r;
  }
  return STAR_CACHE;
}
export const starOf = name => (STAR_CACHE && STAR_CACHE[name]) || 1;

/* ---- 所持枚数（2026-09-21 改）----
   一度手に入れた武将は図鑑から消えない。持っている枚数だけが 0 になる。
   P.own ＝ 図鑑に載った武将（消えない）／ P.cnt ＝ いま持っている枚数 */
export const cntOf = no => {
  const k = String(no);
  return P.cnt[k] != null ? P.cnt[k] : (P.own.includes(no) ? 1 : 0);
};
export function setCnt(no, n) {
  P.cnt[String(no)] = Math.max(0, n);
  if (P.cnt[String(no)] <= 0) delete P.chars[String(no)];   // 育てたぶんも失う
}
/* 「重ね」＝2枚目以降 */
export const dupOf = no => Math.max(0, cntOf(no) - 1);
/* 手札として使えるか（出陣・素材・解雇の対象になる） */
export const hasCard = no => cntOf(no) > 0;
export const inSquad = no => P.squads.some(q => (q.nos || []).includes(no));
/* 素材に出せる枚数。いま育てている本人と、部隊に入っている武将は1枚だけ残す */
export const keepOne = (no, targetNo) => no === targetNo || inSquad(no);
export const matLeft = (no, targetNo) => Math.max(0, cntOf(no) - (keepOne(no, targetNo) ? 1 : 0));
export const canEatCard = (no, targetNo) => matLeft(no, targetNo) > 0;
/* 積んだ数のうち、何枚が「最後の1枚」を削るか＝図鑑の表示が0になるか */
export const cardsNeeded = (no, n) => (n >= cntOf(no) ? 1 : 0);
function eatMats(byNo, targetNo) {
  for (const k of Object.keys(byNo)) if (byNo[k] > matLeft(Number(k), targetNo)) return false;
  for (const k of Object.keys(byNo)) setCnt(Number(k), cntOf(Number(k)) - byNo[k]);
  return true;
}
export function skillLvOf(no) {
  const c = charState(no);
  if (!Array.isArray(c.sk)) c.sk = [1, 1, 1];
  while (c.sk.length < 3) c.sk.push(1);
  return c.sk;
}
/* 武将を解雇する（2026-09-21）。重ねもろとも手放して武士の魂に換える。
   部隊に入っているあいだは解雇できない（外せば解雇できる） */
/* 解雇できる枚数。部隊に入っているあいだは最後の1枚を残す */
export const fireMax = no => Math.max(0, cntOf(no) - (inSquad(no) ? 1 : 0));
export function dismiss(no, rarity, n = 1) {
  const k = Math.min(Math.max(1, Math.floor(n)), fireMax(no));
  if (k < 1) return null;
  const soul = (SOUL_BY_RARITY[rarity] || 1) * k;
  setCnt(no, cntOf(no) - k);
  P.soul += soul;
  savePlayer();
  return { n: k, soul, left: cntOf(no) };
}
/* 「重ねを売る」は廃止し、武将解雇に一本化した（2026-09-21）。
   互換のため名前だけ残して解雇へ通す */
export const sellDup = (no, rarity, n = 1) => dismiss(no, rarity, n);
/* 成功率。mats は [{no}|{book:true}] の並び */
export function skillRate(skillName, mats, charm) {
  const base = STAR_RATE[starOf(skillName)] || 10;
  const add = charm && ITEMS[charm] ? ITEMS[charm].luck : 0;
  return Math.max(0, Math.min(100, base * mats.length + add));
}
/* 強化を1回試す。成否にかかわらず素材と護符は消える */
export function skillUp(no, slot, skillName, mats, charm) {
  const sk = skillLvOf(no);
  if (sk[slot] >= SKILL_MAX) return null;
  if (!mats.length || mats.length > MAT_MAX) return null;
  const needBook = mats.filter(m => m.book).length;
  if (item(BOOK) < needBook) return null;
  const byNo = {};
  for (const m of mats) if (!m.book) byNo[m.no] = (byNo[m.no] || 0) + 1;
  for (const k of Object.keys(byNo)) if (byNo[k] > matLeft(Number(k), no)) return null;
  if (charm && item(charm) < 1) return null;
  const rate = skillRate(skillName, mats, charm);
  if (needBook) useItem(BOOK, needBook);
  if (!eatMats(byNo, no)) return null;
  if (charm) useItem(charm, 1);
  /* はじめの一度だけ必ず成功（2026-09-30／札を一度きりに直した 2026-10-01）。
     はじめて触る所で失敗させると、何が悪かったのか分からないまま素材だけ減る */
  const sure = !!(P.firstSure && P.firstSure.up);
  if (sure) P.firstSure.up = false;
  const ok = sure ? true : Math.random() * 100 < rate;
  if (ok) sk[slot]++;
  savePlayer();
  return { ok, rate, lv: sk[slot] };
}

/* ================= 特技継承（2026-09-21） =================
   他の武将の「重ね」を素材に、その武将が持つ特技をひとつ受け継ぐ。
   ・枠は3つ。空いている枠に入れる。埋まっている枠は上書きになる
   ・通常特技を継ぐと Lv1 に戻る（◆にレベルは無い）
   ・◆（固有）は「同じ属性の武将」にしか継げない
   ・奥義と大将特性は継げない
   ・失敗すると素材だけ消える。枠はそのまま */
export const INH_MAT_MAX = 1;                 // 継承も キャラ1体 × 道具1つ（2026-09-25）
export const INH_RATE_NORMAL = 30;            // 通常特技
export const INH_RATE_UNIQ = [20, 10, 5];     // ◆の1つ目／2つ目／3つ目

export function inhOf(no) {
  const c = charState(no);
  if (!Array.isArray(c.inh)) c.inh = [null, null, null];
  while (c.inh.length < 3) c.inh.push(null);
  return c.inh;
}
export const uniqInhCount = no => inhOf(no).filter(x => x && x.uniq).length;
/* 継承できる特技かどうか。通常はどこへでも入る。◆だけ属性の条件がある */

/* 3つの枠のいまの中身。
   一の枠は固有◆で、入れ替えも強化もできない（その武将の顔なので）。
   二・三の枠が通常特技。継承で入れた特技もここに入る。 */
export function slotsOf(ch) {
  const inh = inhOf(ch.no);
  const base = ch.normals || [];
  const out = [];
  // 一の枠はもともと固有◆。継承で上書きすると、その武将の固有は失われる
  if (inh[0]) out.push({ sk: inh[0].sk, slot: 0, uniq: !!inh[0].uniq, inherited: true, from: inh[0].from });
  else out.push(hasUniq(ch) ? { sk: ch.unique, slot: 0, uniq: true, inherited: false, own: true } : null);
  for (let i = 1; i <= 2; i++) {
    if (inh[i]) out.push({ sk: inh[i].sk, slot: i, uniq: !!inh[i].uniq, inherited: true, from: inh[i].from });
    else out.push(base[i - 1] ? { sk: base[i - 1], slot: i, uniq: false, inherited: false } : null);
  }
  return out;
}
/* 一の枠が上書きされているか＝元の固有を失っているか */
export const lostUnique = no => !!inhOf(no)[0];
/* その武将が誰かに渡せる特技（通常3つ＋固有◆）。奥義と大将特性は渡せない */
/* マスタで固有が空の武将が59体いる（2026-09-21 時点）。
   名前の無い固有は「持っていない」として扱う */
export const hasUniq = ch => !!(ch && ch.unique && ch.unique.name);
/* ---- 渡せるのは「その武将がもともと持っている特技」（2026-10-02 改）----
   前は「いま枠に入っている3つ」すべてを渡せた。継いだ特技も渡せたので、
   重ねの多い安い武将に強い◆をいちど継がせると、その子の重ねの数だけ
   同じ◆を配れてしまった（重ね10枚なら10回挑める）。
   くじで引いた本人からしか継げないようにして、その抜け道をふさぐ。
   渡しても元の武将からは失われない（重ね／カード本体を食う形は変わらない）。
   固有を継承で上書きしていれば、その固有はもう渡せない（枠に無いので）。
   なお解雇して手札が0枚になると育てたぶんも継いだ特技も消える（setCnt を見よ）ので、
   引き直した武将はマスタどおりの姿に戻る。
   all＝true のときは、画面に出すために 継いだ特技も含めて返す（give で選り分ける） */
export function givableOf(ch, all) {
  return slotsOf(ch).filter(Boolean).filter(x => all || !x.inherited).map(x => ({
    sk: { ...x.sk, element: x.uniq ? (x.sk.element ?? (x.own ? ch.attr : null)) : x.sk.element },
    uniq: !!x.uniq,
    slot: x.slot,
    own: !!x.own,            // その武将が元から持っていた固有か
    inherited: !!x.inherited, // 継いで手に入れたものか
    from: x.from || null,     // 誰から継いだか
    give: !x.inherited,       // 他の武将へ渡せるか（継いだものは渡せない）
    lv: x.uniq ? null : (skillLvOf(ch.no)[x.slot] || 1),
  }));
}
/* ◆は同じ属性の武将にしか継げない（スキルマスターの継承条件＝初出キャラの属性） */
export const canInherit = (target, g) => !g.uniq || (g.sk.element || null) === target.attr;

export const INH_CHARMS = ['相伝の護符・小', '相伝の護符・中', '相伝の護符・大'];
export function inhRate(target, g, n, charm) {
  if (!canInherit(target, g)) return 0;
  const base = g.uniq ? (INH_RATE_UNIQ[uniqInhCount(target.no)] ?? 0) : INH_RATE_NORMAL;
  const add = charm && ITEMS[charm] ? (ITEMS[charm].luckInh || 0) : 0;
  return Math.max(0, Math.min(100, base * n + add));
}
/* 継ぐ。mats は [{no}] の並び（重ねを使う）。成否にかかわらず素材は消える */
export function inherit(target, slot, g, mats, charm) {
  if (slot < 0 || slot > 2) return null;     // 一の枠（固有◆）も入れ替えられる
  if (!mats.length || mats.length > INH_MAT_MAX) return null;
  /* 継いだ特技は、さらに渡せない（2026-10-02）。
     画面で押せないようにしてあるが、ここでも止める。
     ここが抜けていると、強い◆が重ねの数だけ増やせてしまう */
  if (g && (g.inherited || g.give === false)) return null;
  if (!canInherit(target, g)) return null;
  const byNo = {};
  for (const m of mats) byNo[m.no] = (byNo[m.no] || 0) + 1;
  for (const k of Object.keys(byNo)) if (byNo[k] > matLeft(Number(k), target.no)) return null;
  if (charm && item(charm) < 1) return null;
  const rate = inhRate(target, g, mats.length, charm);
  if (!eatMats(byNo, target.no)) return null;
  if (charm) useItem(charm, 1);            // 失敗しても戻らない（強化の護符と同じ）
  /* はじめの一度だけ必ず成功（札を一度きりに直した 2026-10-01。強化と同じ） */
  const sureI = !!(P.firstSure && P.firstSure.inh);
  if (sureI) P.firstSure.inh = false;
  const ok = sureI ? true : Math.random() * 100 < rate;
  if (ok) {
    const inh = inhOf(target.no);
    inh[slot] = { sk: { ...g.sk }, uniq: g.uniq, from: g.from || null };
    skillLvOf(target.no)[slot] = 1;        // 通常特技は Lv1 に戻る
  }
  savePlayer();
  return { ok, rate };
}

/* ================= ショップ（2026-09-21） =================
   常設の蔵はいつでも買える。振り売り（日替わり3品）は毎日入れ替わり、
   1日ひとつずつしか買えないかわりに2〜4割安い。
   日付から決め打ちで選ぶので、端末をまたいでも同じ品が並ぶ。 */

/* 武士の魂は道具ではなく、その場で魂そのものが増える */
export const SOUL_PACK = { n: 100, price: 2500 };

/* ---- 日の変わり目（2026-10-07・悠さんの指図）----
   夜中の0時ではなく **翌朝4時** で入れ替える。
   夜ふかしの一戦が「日が変わったから」で途切れないようにするため。
   仕掛けは単純で、4時間ぶん戻した時計で日付を数えるだけ。
   日課も週課も月の番付も、祭も、ぜんぶこの dayNow() を通す。
   （端末の時計を見ているので、時計をいじれば戻せてしまう。
     サーバーの刻を見るようにするのは、蔵ができてからの宿題） */
export const DAY_RESET_H = 4;
export const dayNow = (t = Date.now()) => new Date(t - DAY_RESET_H * 3600 * 1000);

export const today = () => {
  const d = dayNow();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
function seedOf(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h;
}
/* 振り売りの品。日付で決め打ち。[{ name, price, off }]
   1品目は「今日の軍配」＝ある属性の芯（2026-09-23）。残り2品はそれ以外から選ぶ。
   毎日ちがう属性が安くなるので、育てたい武将に合わせて通う理由になる */
export function dailyDeals() {
  let h = seedOf(today());
  const rnd = () => { h = Math.imul(h ^ (h >>> 15), 0x2545f491) >>> 0; return h / 4294967296; };
  const deal = k => {
    const off = [20, 30, 40][Math.floor(rnd() * 3)];
    return { name: k, off, price: Math.round(ITEMS[k].price * (100 - off) / 100 / 10) * 10 };
  };
  const attr = ATTRS[Math.floor(rnd() * ATTRS.length)];
  const rank = [0, 0, 1, 1, 2][Math.floor(rnd() * 5)];      // 下の段ほど出やすい
  const out = [deal(badgeMat(attr, rank))];
  /* 棚に出さない品（伝書・護符・祭の札）は 振り売りにも出さない（2026-10-02）。
     蔵から外しても、日替わりの安売りに顔を出したら意味がない */
  /* 石で買う品も 振り売りには出さない（2026-10-02）。
     振り売りは小判の安売りなので、値が石の品を混ぜると値札が合わない */
  const pool = Object.keys(ITEMS).filter(k =>
    ITEMS[k].kind !== '覚醒' && !ITEMS[k].noShop && !ITEMS[k].stone);
  for (let i = 0; i < 2 && pool.length; i++) out.push(deal(pool.splice(Math.floor(rnd() * pool.length), 1)[0]));
  return out;
}
function shopState() {
  if (!P.shop || typeof P.shop !== 'object') P.shop = { day: '', bought: {} };
  if (P.shop.day !== today()) { P.shop.day = today(); P.shop.bought = {}; }
  return P.shop;
}
/* 振り売りでその品をもう買ったか */
export const dealBought = name => !!shopState().bought[name];

/* 常設の蔵で買う。n個まとめて。
   棚に出さない品は、どこから呼ばれても小判では買えない（2026-10-02） */
export function buyItem(name, n = 1) {
  if ((ITEMS[name] || {}).noShop) return null;
  const it = ITEMS[name]; if (!it) return null;
  /* 石で買う品（2026-10-02）。いまは兵糧だけ。
     cur を返しておくと、買えたときの知らせで通貨の名を出し分けられる */
  if (it.stone) {
    const cost = it.stone * n;
    if (!spendStones(cost)) return null;
    P.items[name] = item(name) + n;
    savePlayer();
    return { name, n, cost, cur: 'stone' };
  }
  const cost = it.price * n;
  if (P.koban < cost) return null;
  P.koban -= cost;
  P.items[name] = item(name) + n;
  savePlayer();
  return { name, n, cost, cur: 'koban' };
}
/* 振り売りで買う。1日ひとつずつ */
export function buyDeal(name) {
  const d = dailyDeals().find(x => x.name === name);
  if (!d) return null;
  const st = shopState();
  if (st.bought[name]) return null;
  if (P.koban < d.price) return null;
  P.koban -= d.price;
  P.items[name] = item(name) + 1;
  st.bought[name] = 1;
  savePlayer();
  return { name, n: 1, cost: d.price };
}
/* 武士の魂を買う */
export function buySoul(packs = 1) {
  const cost = SOUL_PACK.price * packs;
  if (P.koban < cost) return null;
  P.koban -= cost; P.soul += SOUL_PACK.n * packs;
  savePlayer();
  return { n: SOUL_PACK.n * packs, cost };
}
/* 持ち物から兵糧を使う */
/* ---- 兵糧は時間で戻る（2026-09-26）----
   **100秒に1つ**の据え置き。上限が増えても間合いは変わらない
   （上限が増えるほど満ちるまでは長くなる＝育てた人ほど蓄えが大きい）。
   はじめは 100×100秒＝2時間47分で満ちる。
   foodAt は「最後に数え直した時刻」。端数は繰り越すので、
   こまめに開いても損しない。満ちているあいだは時間を溜め込まない。 */
export const FOOD_EVERY_MS = 100e3;
export const foodEveryMs = () => FOOD_EVERY_MS;
export function refillFood() {
  const now = Date.now();
  if (!P.foodAt || P.foodAt > now) { P.foodAt = now; savePlayer(); return 0; }
  if (P.stamina >= P.staminaMax) { P.foodAt = now; return 0; }
  const per = foodEveryMs();
  const n = Math.floor((now - P.foodAt) / per);
  if (n <= 0) return 0;
  const add = Math.min(n, P.staminaMax - P.stamina);
  P.stamina += add;
  P.foodAt = P.stamina >= P.staminaMax ? now : P.foodAt + n * per;
  savePlayer();
  return add;
}
/* 次の1つまで／満ちるまで（ミリ秒）。満ちていれば 0 */
export function foodWait() {
  if (P.stamina >= P.staminaMax) return { next: 0, full: 0 };
  const per = foodEveryMs();
  const passed = Math.max(0, Date.now() - (P.foodAt || Date.now()));
  const next = Math.max(0, per - (passed % per));
  return { next, full: next + (P.staminaMax - P.stamina - 1) * per };
}
/* 道具で戻すぶんは、上限を超えて積める（2026-10-03）。
   時間で戻るぶんは上限で止まるが、道具は払ったぶんがそのまま入る。
   上限を超えているあいだは 時間では戻らない（refillFood が素通りする）ので、
   「貯めてから一気に遠出する」という使い方ができる。
   「兵糧を満たす」（兵糧俵）は、上限までを満たす品なので上限は超えない。 */
export function useFood(name) {
  const it = ITEMS[name];
  if (!it || !it.food) return null;
  refillFood();                                     // 時間で戻ったぶんを先に足す（2026-09-26）
  const fill = it.food >= 9999;                     // 「満たす」品か、数で戻す品か
  if (fill && P.stamina >= P.staminaMax) return null;   // 満たす品は、満ちていれば無駄打ちさせない
  if (!useItem(name, 1)) return null;
  const before = P.stamina;
  P.stamina = fill ? P.staminaMax : P.stamina + it.food;
  savePlayer();
  return { gain: P.stamina - before };
}

export function savePlayer() {
  try { localStorage.setItem(KEY, JSON.stringify({ ...P, own: [...P.own] })); }
  catch { /* 保存が使えない環境でも遊べるようにする */ }
}
/* 蔵から引いた記録を丸ごと書き戻す（2026-10-04）。
   半端に混ぜると事故るので、入れ替えたら必ず読み直す（画面側で location.reload）。
   ここで localStorage に直に書くのは、loadPlayer の読み直しに乗せるため */
export function replacePlayer(blob) {
  try { localStorage.setItem(KEY, JSON.stringify(blob)); return true; }
  catch { return false; }
}

export function loadPlayer(FORMS) {
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { /* 壊れていたら初期値 */ }
  if (raw && typeof raw === 'object') {
    for (const k of Object.keys(P)) if (raw[k] !== undefined) P[k] = raw[k];
    if (!Array.isArray(P.own)) P.own = [];
    /* 入れ子は丸ごと差し替わるので、足りない項目を埋め直す（2026-09-25）。
       古い保存には link がまだ無い */
    P.link = { code: '', pass: '', salt: '', at: 0, ties: {}, ...(P.link || {}) };
    if (!P.link.ties || typeof P.link.ties !== 'object') P.link.ties = {};
    /* 古い保存には門出の箱 gf が無い（2026-09-26）。
       入れ子は丸ごと差し替わるので、ここで足りない箱を埋め直す */
    P.mi = { day: '', week: '', d: {}, w: {}, t: {}, gd: [], gw: [], ge: [], gt: [], gf: [], ...(P.mi || {}) };
    for (const k of ['gd', 'gw', 'ge', 'gt', 'gf']) if (!Array.isArray(P.mi[k])) P.mi[k] = [];
    for (const k of ['d', 'w', 't']) if (!P.mi[k] || typeof P.mi[k] !== 'object') P.mi[k] = {};
  }
  /* 兵糧を時間で戻す（2026-09-26）。古い保存には foodAt が無いので、
     いまを数えはじめにする（過ぎたぶんをまとめて配らない） */
  if (!P.foodAt) P.foodAt = Date.now();
  refillFood();
  // 覚醒を素材制にしたので、古い保存の「覚醒の巻物」は無銘の具足に読み替える（2026-09-21）
  if (P.items && P.items['覚醒の巻物']) {
    P.items[freeMat(1)] = (P.items[freeMat(1)] || 0) + P.items['覚醒の巻物'];
    delete P.items['覚醒の巻物'];
  }
  /* 覚醒の品の作り直し（2026-09-23）。
     旧：〈属性〉の籠手／具足／兜 ＋ 木／鉄／金の軍配（属性なし）
     新：無銘の籠手／具足／兜 ＋ 〈木鉄金〉の軍配・〈属性〉
     属性つきの段は属性を問わない無銘にまとめ、属性の無かった軍配は
     どの武将にも使えた品なので、五属性ぶんそのまま配る（取りこぼしを出さない）。 */
  if (P.items && !P.awakeV3) {
    for (let t = 0; t < AWAKE_TIERS.length; t++) {
      for (const a of ATTRS) {
        const oldName = `${a}の${AWAKE_TIERS[t]}`;
        if (P.items[oldName]) {
          P.items[freeMat(t)] = (P.items[freeMat(t)] || 0) + P.items[oldName];
          delete P.items[oldName];
        }
      }
    }
    for (let r = 0; r < BADGES.length; r++) {
      const n = P.items[BADGES[r]];
      if (n) {
        for (const a of ATTRS) P.items[badgeMat(a, r)] = (P.items[badgeMat(a, r)] || 0) + n;
        delete P.items[BADGES[r]];
      }
    }
    P.awakeV3 = true;
  }
  // 天下統一の進み具合。古い保存には無いので形を整える
  if (!P.camp || typeof P.camp !== 'object') P.camp = { start: null, done: {}, intro: false, clear: false };
  if (!P.camp.done || typeof P.camp.done !== 'object') P.camp.done = {};
  if (!P.items || typeof P.items !== 'object') P.items = {};
  if (!P.shop || typeof P.shop !== 'object') P.shop = { day: '', bought: {} };
  if (!P.dup || typeof P.dup !== 'object') P.dup = {};
  if (!P.cnt || typeof P.cnt !== 'object') P.cnt = {};
  // 旧形式（本体＋重ね）を「所持枚数」に読み替える。一度だけ
  if (!P.cntV2) {
    for (const no of P.own) P.cnt[String(no)] = 1 + (P.dup[String(no)] || 0);
    P.cntV2 = true;
  }
  if (!P.chars || typeof P.chars !== 'object') P.chars = {};
  if (!Array.isArray(P.squads)) P.squads = [];
  while (P.squads.length < SQUAD_MAX) P.squads.push(newSquad(P.squads.length, FORMS));
  for (const q of P.squads) {
    if (!Array.isArray(q.nos)) q.nos = [];
    if (!Array.isArray(q.slots)) q.slots = [];
    if (!FORMS.includes(q.form)) q.form = FORMS[0];
    /* もう持っていない武将を部隊から外す（2026-10-03）。
       編成の一覧が「かつて手に入れたか（P.own）」で並べていたので、
       解雇して0枚になった武将も選べてしまい、部隊に残ったままになっていた。
       残っていると出陣のときに黙って抜け落ち、五騎のつもりが四騎で戦うことになる。
       古い保存を開いたときに ここで掃除する */
    const gone = q.nos.filter(n => !hasCard(n));
    if (gone.length) {
      q.nos = q.nos.filter(n => hasCard(n));
      q.slots = q.slots.map(n => (n != null && hasCard(n) ? n : null));
      if (q.general != null && !hasCard(q.general)) q.general = q.nos[0] ?? null;
    }
  }
  return P;
}
export const newSquad = (i, FORMS) =>
  ({ name: `部隊${'一二三四五'[i] || i + 1}`, nos: [], general: null, form: FORMS[0], slots: [] });

export const owns = no => P.own.includes(no);
export const stones = () => P.paid + P.free;

/* ★ストーンの決めごと（2026-10-07・悠さんの指図）★
   **褒美でもらえるストーンは、すべて「無料ストーン」（P.free）**。
   有償ストーン（P.paid）が増えるのは、**ストーン販売所で買ったときだけ**。
   いずれ「有料ストーンでしか引けないくじ」を作るので、ここが混ざると台無しになる。

   だから、褒美を配るところは **必ず addFreeStones() を通すこと**。
   `P.free += n` と直に書いてもよいが、書くところが増えるほど
   いつか `P.paid` と書き間違える。入り口は一本にしておく。 */
export function addFreeStones(n) {
  const v = Math.max(0, Math.round(n || 0));
  if (!v) return 0;
  P.free += v;
  return v;
}

// 無料ストーンから先に減らす（有償ストーンを残すのが親切）
export function spendStones(n) {
  if (stones() < n) return false;
  const f = Math.min(P.free, n); P.free -= f; P.paid -= (n - f);
  return true;
}
/* 有償ストーンだけで払う（2026-10-07）。
   「有料ストーンでしか引けないくじ」のための戸口。まだ誰も呼んでいない。
   使うときは、払えるかを spendPaidOnly の戻り値で見ること（足りなければ何も減らない） */
export function spendPaidOnly(n) {
  if (P.paid < n) return false;
  P.paid -= n;
  return true;
}

/* ================= ストーン販売所（2026-10-07・悠さんの指図）=================
   ストーン（これまで「石」と呼んでいたもの）を買う棚。
   値は「300ストーン＝350円」から割り出した。十円の位で丸めてある。
   500ストーンから上の口には、買った数の **2割** を無償ストーンとして添える。
   だから得をするのは「300より上を買うかどうか」の一段だけで、
   口が大きいほど得、という積み上げはしていない。
   刻みを増やしたくなったら STONE_FREE_PCT をここで段にする。

   no   … 保存と突き合わせに使う名札。**増やしてよいが消さないこと**
   paid … 有償ストーン（P.paid へ）
   free … 無償ストーン（P.free へ。先に減る）
   yen  … 円（税込のつもり） */
export const STONE_RATE = 350 / 300;        // 1ストーンの値（円）
export const STONE_FREE_PCT = 0.2;          // 添える無償の割合
export const STONE_FREE_FROM = 500;         // この口から無償が付く
export const STONE_PACKS = [300, 500, 700, 1000, 2000, 3000, 5000, 10000].map(paid => ({
  no: 'st' + paid,
  paid,
  free: paid >= STONE_FREE_FROM ? Math.round(paid * STONE_FREE_PCT) : 0,
  yen: Math.round(paid * STONE_RATE / 10) * 10,
}));
export const stonePack = no => STONE_PACKS.find(x => x.no === no) || null;

/* 買えたあとに呼ぶ。**お支払いが通ってから**しか呼んではいけない。
   いまはストア（App Store / Google Play）との繋ぎが無いので、画面からは呼ばない。
   繋いだら、レシートを確かめたあとにここを通す。
   買った控えは P.buys に積む（重ねて配らないための突き合わせに使う） */
export function grantStones(no, receipt) {
  const pk = stonePack(no); if (!pk) return null;
  P.paid += pk.paid; P.free += pk.free;
  if (!Array.isArray(P.buys)) P.buys = [];
  P.buys.push({ no, yen: pk.yen, at: Date.now(), receipt: receipt || null });
  if (P.buys.length > 200) P.buys = P.buys.slice(-200);   // 控えは直近200まで
  savePlayer();
  return pk;
}

/* ================= ガチャ =================
   排出率（仕様書 §16）: UR 2% / SSR 8% / SR 20% / R 30% / N 40%
   価格: 単発 300石 / 10連 3000石
   確定: 10連にSR以上1体 ／ 80連でSSR以上1体 ／ 150連でUR1体
   重複したら武士の魂になる（N1 / R3 / SR10 / SSR30 / UR100）

   ★ 抽選は戦闘と同じく決定論にしてある。
   通算n回目の引きは seed = hash(おみくじの元種, n) だけで決まるので、
   「御籤番号」を控えておけば、あとから同じ結果を再現して検証できる。
   サーバーは1回ぶんの結果を保存しなくても、申告が正しいか確かめられる。 */
export const RATES = { UR: 0.02, SSR: 0.08, SR: 0.20, R: 0.30, N: 0.40 };
export const SOUL_BY_RARITY = { N: 1, R: 3, SR: 10, SSR: 30, UR: 100 };
export const PRICE = { single: 300, ten: 3000 };
/* おみくじの帯の節目（2026-09-26）。帯は「URまでの積み」を見せている。
   30 … SR以上が確定　60 … SSR以上が確定
   90 … 相伝の護符・大 を1つ　120 … 上達の護符・大 を1つ　150 … URが確定
   品の褒美は、その積みにちょうど届いた一引きで一度だけ配る（URが出ると積みは0に戻る） */
export const PITY = {
  sr: 30, ssr: 60, ur: 150,
  gifts: { 90: '相伝の護符・大', 120: '上達の護符・大' },
};
const RANK = ['N', 'R', 'SR', 'SSR', 'UR'];

// 通し番号から引き直せる乱数（mulberry32）
function rngAt(base, n) {
  let s = (base ^ Math.imul(n + 1, 0x9E3779B1)) >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let x = Math.imul(s ^ (s >>> 15), 1 | s);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
export function omikujiBase() {
  if (!P.base) { P.base = (Math.random() * 0xFFFFFFFF) >>> 0; savePlayer(); }
  return P.base;
}
function rollRarity(r, floor) {
  const v = r();
  let acc = 0, got = 'N';
  for (const k of RANK.slice().reverse()) { acc += RATES[k]; if (v < acc) { got = k; break; } }
  // 確定枠：下限より低ければ引き上げる
  return RANK.indexOf(got) < RANK.indexOf(floor || 'N') ? floor : got;
}
/* 1回ぶんを引く。n は通算何回目か（0始まり）。floor は「これ以上が確定」。
   pool は { N:[...], R:[...] } のようにレアリティ別に並べた武将の配列。 */
export function drawOne(base, n, pool, floor) {
  const r = rngAt(base, n);
  let rarity = rollRarity(r, floor);
  let list = pool[rarity];
  // そのレアリティが1体もいなければ下のレアリティへ落とす（マスタ差し替えへの保険）
  while ((!list || !list.length) && RANK.indexOf(rarity) > 0) {
    rarity = RANK[RANK.indexOf(rarity) - 1]; list = pool[rarity];
  }
  if (!list || !list.length) return null;
  const c = list[Math.floor(r() * list.length) % list.length];
  return { no: c.no, name: c.name, rarity, n };
}
/* まとめて引く。count は 1 か 10。pool はレアリティ別の武将。
   返すのは { items, cost, ticket }。items の dup が true なら重複＝魂になった。 */
/* そのくじの天井の数え（2026-09-28）。無ければ作る。
   古い保存（一本の数え）は、いちばん引かれてきた門出のくじに一度だけ移す */
export function pityOf(id) {
  id = id || 'release';
  if (!P.pity || typeof P.pity !== 'object') P.pity = {};
  if (!P.pity[id]) {
    const old = (!Object.keys(P.pity).length && id === 'release'
                 && (P.sinceSR || P.sinceSSR || P.sinceUR));
    P.pity[id] = old ? { sr: P.sinceSR, ssr: P.sinceSSR, ur: P.sinceUR, draws: P.draws }
                     : { sr: 0, ssr: 0, ur: 0, draws: 0 };
    if (old) { P.sinceSR = P.sinceSSR = P.sinceUR = 0; }
  }
  return P.pity[id];
}

/* 一日ひとたびの ただ引き（2026-10-02）。
   きょう まだ引いていなければ true。くじごとに別で数える */
export function gFreeOk(g) {
  if (!g || !g.freeDay) return false;
  if (!P.gfree || typeof P.gfree !== 'object') P.gfree = {};
  return P.gfree[g.id] !== today();
}
export function pull(count, pool, gid, opt = {}) {
  const free = count === 10 && P.firstFree;
  /* 一日ひとたびの ただ引き（2026-10-02）。一度引きのときだけ。
     札より先に見るので、ただの日は札も石も減らない */
  const freeOne = count === 1 && !!opt.freeOne;
  /* 祭りのくじは札で引ける（2026-09-30）。
     opt.ticket が立っているくじでは、札を先に減らし、足りなければ石に落ちる。
     石は貯めておきたい人が多いので、持っている札から使い切るほうが親切 */
  const tneed = count === 10 ? TICKET_PRICE.ten : TICKET_PRICE.single;
  const byTicket = !free && !freeOne && !!opt.ticket && item(TICKET) >= tneed;
  const cost = (free || freeOne || byTicket) ? 0 : (count === 10 ? PRICE.ten : PRICE.single);
  if (freeOne) { if (!P.gfree || typeof P.gfree !== 'object') P.gfree = {};
                 P.gfree[gid] = today(); }
  if (byTicket) P.items[TICKET] -= tneed;
  else if (cost && !spendStones(cost)) return null;
  const base = omikujiBase();
  const start = P.draws;          // 御籤番号は くじをまたいだ通し番号のまま
  const Q = pityOf(gid);          // 天井の数えは そのくじのぶん
  const items = [];
  const gifts = {};                 // 帯の節目で配ったもの（2026-09-26）
  for (let i = 0; i < count; i++) {
    const n = start + i;
    let floor = null;
    // 天井：SSR以上とURの積み上がりを見る
    /* P.sinceUR / P.sinceSSR はこの繰り返しの中で1ずつ増えていく。
       もとは さらに i を足していて、十連のうしろほど天井が早く来ていた（2026-09-26 に直した） */
    if (Q.ur + 1 >= PITY.ur) floor = 'UR';
    else if (Q.ssr + 1 >= PITY.ssr) floor = 'SSR';
    else if (Q.sr + 1 >= PITY.sr) floor = 'SR';
    // 10連の最後まで SR 以上が出ていなければ、最後の1枠を SR 以上にする
    else if (count === 10 && i === 9 && !items.some(x => RANK.indexOf(x.rarity) >= 2)) floor = 'SR';
    const it = drawOne(base, n, pool, floor);
    if (!it) break;
    it.dup = owns(it.no);
    // 重複は魂に変えず枚数を増やす（2026-09-21）。強化・継承の素材になり、解雇すれば魂になる
    setCnt(it.no, cntOf(it.no) + 1);
    if (it.dup) it.soul = SOUL_BY_RARITY[it.rarity] || 1;
    else P.own.push(it.no);
    // 天井の数えを進める
    Q.ur = it.rarity === 'UR' ? 0 : Q.ur + 1;
    Q.ssr = (it.rarity === 'UR' || it.rarity === 'SSR') ? 0 : Q.ssr + 1;
    Q.sr = RANK.indexOf(it.rarity) >= 2 ? 0 : Q.sr + 1;
    /* 帯の節目にちょうど届いた一引きで、品を1つ配る（2026-09-26）。
       ちょうどのときだけなので、そこから先で毎回もらえることはない */
    const gift = PITY.gifts[Q.ur];
    if (gift) { addItem(gift, 1); gifts[gift] = (gifts[gift] || 0) + 1; }
    items.push(it);
  }
  P.draws = start + items.length;
  Q.draws = (Q.draws || 0) + items.length;
  if (free) P.firstFree = false;
  savePlayer();
  /* ticket は御籤番号。払った札の枚数は paidTicket（名がかぶるので分けた・2026-09-30） */
  return { items, cost, free, paidTicket: byTicket ? tneed : 0, gifts,
           ticket: `${base.toString(16).padStart(8, '0')}-${start + 1}` };
}

/* ================= はじまりの一騎 =================
   初回だけ、SSRから好きな1体を選んで迎える。ここで必ず武将が1体いる状態になるので、
   「武将0体で始まる」ことはない。 */
export function grantStarter(no, mate) {
  if (!P.own.includes(no)) P.own.push(no);
  /* 重ねを3枚持たせる（2026-09-30）。特技強化は「同じ武将の重ね」を食うので、
     1枚きりだと手ほどきの途中で進めなくなる */
  if (cntOf(no) < 3) setCnt(no, 3);
  const q = P.squads[0];
  if (!q.nos.includes(no)) q.nos.unshift(no);
  q.nos = q.nos.slice(0, 5);
  if (q.general == null) q.general = no;
  /* 手ほどき用のもう一騎（2026-09-30）。特技継承の「継ぎ元」がいないと進められない */
  if (mate != null && mate !== no) {
    if (!P.own.includes(mate)) P.own.push(mate);
    if (cntOf(mate) < 3) setCnt(mate, 3);
  }
  P.items['稽古の書'] = Math.max(P.items['稽古の書'] || 0, 10);
  /* 十連は手引きのいちばん最後に回した（2026-09-30）ので、ここで城へ出られるようにする */
  P.tutorial = 2;
  P.gstep = 1;
  P.firstSure = { up: true, inh: true };   // はじめの強化と継承は必ず成功（2026-10-01）
  savePlayer();
}

/* ================= 合戦の報酬 ================= */
/* 負けたら何ももらえない（2026-09-27）。
   もとは負けても石30・小判150・経験8が入っていたが、
   「負けたのに褒美」がおかしいので全部ゼロにした。
   戦った数（battles）だけは負けても数える。兵糧はすでに払っている */
export const REWARD = { winStone: 100, winKoban: 500, winSoul: 5, expWin: 20 };
/* ---- 主の位（2026-10-01 に組み直した）----
   前は どの一戦も経験 20 の据え置きで、位に要る経験は 位×100 だった。
   全国は 71 戦しかないので、取りきっても Lv10 に届かない。あまりに渋い。

   そこで「払った兵糧のぶんだけ経験が入る」に変えた。
   章が進むほど兵糧は重くなる（3→10）ので、重い戦ほど伸びるのが素直。
   お祭りは兵糧が 10〜100 と桁ちがいなので、上限 120 で止める。

   全国71戦の兵糧は合わせて 451〜489（はじめの国で少し変わる）。
   ×10 で 4510〜4890。下の位の表の積み上げは Lv40 で 4524 なので、
   全国を取りきると ちょうど Lv39〜40 に届く。 */
/* 経験の取り分を半分にした（2026-10-03）。
   ×10 だと Lv.175 まで上がってしまい、位が軽くなりすぎていた。
   ×5・下限15・上限60 なら、全国を取りきって Lv.28 前後に落ち着く */
export const EXP_PER_FOOD = 5;
export const EXP_MIN = 15, EXP_MAX = 60;
/* 主の位の上限（2026-10-03）。ここで頭打ち。
   上限に着いたら経験は貯めない（帯は満ちたまま） */
export const LV_MAX_PLAYER = 200;
export const expForFood = food =>
  Math.max(EXP_MIN, Math.min(EXP_MAX, Math.round((food || 0) * EXP_PER_FOOD)));
/* 次の位までに要る経験。Lv1 は 40、以後ひとつ上がるごとに +4 */
export const expNeed = lv => 36 + 4 * Math.max(1, lv | 0);
/* 褒美を増やす特技（2026-09-28・大泥棒）。
   「貰える報酬を1.5倍にする」は戦いの外の話なので、エンジンではなくここで効かせる。
   出陣した部隊に持ち主が居れば、いちばん大きい倍率ひとつだけを使う（重ねない）。 */
export function rewardMulOf(chars) {
  let mul = 1;
  for (const c of chars || []) {
    for (const k of [c.unique, ...(c.normals || [])]) {
      const m = /(?:貰|もら)える(?:報酬|褒美)を(\d+(?:\.\d+)?)倍/.exec((k && k.text) || '');
      if (m) mul = Math.max(mul, parseFloat(m[1]));
    }
  }
  return mul;
}
/* noStone … 石だけ配らない（2026-10-07・悠さんの指図）。
   一度取った国や級をもう一度攻めても石は湧かない。
   小判・魂・経験・稽古の書は、いつ戦っても付く。
   石は くじを引く元手なので、早送りで回し続けられると値打ちが消える */
export function giveReward(won, mul = 1, food = 0, noStone = false) {
  P.battles++;
  if (!won) { savePlayer(); return { lost: true }; }
  const r = {
    stone: noStone ? 0 : Math.round(REWARD.winStone * mul),
    koban: Math.round(REWARD.winKoban * mul),
    soul: Math.round(REWARD.winSoul * mul),
    exp: expForFood(food),
    mul: mul > 1 ? mul : undefined,
  };
  addFreeStones(r.stone); P.koban += r.koban; P.soul += r.soul;
  /* 集めた小判の合計（2026-10-02）。お役目「小判を一万集める」はこれを見る。
     使った小判は引かない。「稼いだ覚え」なので、減らすと数えられなくなる */
  if (r.koban) miBump('koban', r.koban);
  // 勝つと稽古の書が1冊もらえる（2026-09-21）
  P.items['稽古の書'] = (P.items['稽古の書'] || 0) + 1; r.book = 1;
  P.wins++;
  /* 位の上限に着いていたら経験を入れない（2026-10-03） */
  if (P.lv >= LV_MAX_PLAYER) { P.lv = LV_MAX_PLAYER; P.exp = 0; r.exp = 0; }
  else P.exp += r.exp;
  r.lvUp = 0;
  while (P.lv < LV_MAX_PLAYER && P.exp >= expNeed(P.lv)) { P.exp -= expNeed(P.lv); P.lv++; r.lvUp++; P.staminaMax += 2;
    // 位が上がると兵糧は満ちる。ただし道具で上限を超えて貯めているぶんは削らない（2026-10-03）
    P.stamina = Math.max(P.stamina, P.staminaMax); P.foodAt = Date.now(); }
  if (P.lv >= LV_MAX_PLAYER) { P.lv = LV_MAX_PLAYER; P.exp = 0; }
  savePlayer();
  return r;
}

/* 稽古の褒美（2026-09-24）。石を5つだけ。
   ふつうの戦と同じだけ配ると、日に一度とはいえ友の数だけ稼ぎ場になってしまう。
   稽古は本番ではないので、戦績（battles / wins）にも経験にも数えない。
   勝ち負けそのものは P.fr に積んであり、そちらが番付に乗る。 */
export const SPAR_STONE = 5;
export function sparReward(won) {
  if (!won) return { stone: 0 };
  addFreeStones(SPAR_STONE);
  savePlayer();
  return { stone: SPAR_STONE };
}

/* ================= お役目（2026-09-24）=================
   数えるだけの仕掛け。何を数えるかは mission.js が決める。 */

/* 何週目か。日をまたいだかどうかを見るのと同じ理屈で、週も文字列で比べる */
export function thisWeek() {
  const d = dayNow();                                   // 4時の変わり目をまたいで数える（2026-10-07）
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  t.setDate(t.getDate() - ((t.getDay() + 6) % 7));       // その週の月曜へ寄せる
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

/* 日が変わっていたら日課を、週が変わっていたら週課とお祭りを空に戻す。
   起動のたびと、数を足すたびに呼ぶ */
export function miRoll() {
  const m = P.mi;
  let moved = false;
  if (m.day !== today()) { m.day = today(); m.d = {}; m.gd = []; moved = true; }
  if (m.week !== thisWeek()) { m.week = thisWeek(); m.w = {}; m.gw = []; m.ge = []; moved = true; }
  if (moved) savePlayer();
  return moved;
}

/* 数を足す。日ごと・週ごと・ずっと の三つに同時に足すので、
   ひとつの行いで日課も週課もお祭りも功名も進む */
export function miBump(key, n = 1) {
  miRoll();
  const m = P.mi;
  m.d[key] = (m.d[key] || 0) + n;
  m.w[key] = (m.w[key] || 0) + n;
  m.t[key] = (m.t[key] || 0) + n;
  savePlayer();
}
/* 数を「そのもの」に合わせる（制覇の国数など、積むのではなく今の値を見るもの） */
export function miSet(key, v) {
  miRoll();
  const m = P.mi;
  m.d[key] = v; m.w[key] = v; m.t[key] = Math.max(m.t[key] || 0, v);
  savePlayer();
}

/* 称号を手に入れる。すでに持っていれば何もしない。
   はじめの一つは、取った時点で自動で名乗る */
export function gainTitle(name) {
  if (!name || P.titles.includes(name)) return false;
  P.titles.push(name);
  if (!P.title) P.title = name;
  savePlayer();
  return true;
}

/* ================= 天下統一の道（2026-09-21） ================= */

/* 出発の国を決める。はじまりの一騎で選んだ武将の本拠地。
   その武将の城は最初から自分のもの＝制覇済みで始める（2026-09-23）。
   自分の武将の城を自分で攻めるのは筋が通らないため。 */
export function setCampStart(c) {
  const id = homePrefOf(c);
  P.camp.start = id;
  const p = PREF[id];
  if (p) P.camp.done[id] = p.battles;      // 本拠地は最初から取っている
  savePlayer();
  return id;
}
// その県で何戦勝ったか
export const prefStep = id => P.camp.done[id] || 0;
// 制覇したか
export const prefTaken = id => prefStep(id) >= (PREF[id] ? PREF[id].battles : 1);
// 制覇した県の数
export const takenCount = () => PREFS.filter(p => prefTaken(p.id)).length;
// その章を平定したか
export const regionTaken = r => prefsOf(r).every(p => prefTaken(p.id));

/* 行ける章。出発の章はいつでも開いていて、
   平定した章のとなり（西どなり・東どなり）が開く＝「左右どちらへ攻めるか」 */
export function openRegions() {
  const home = PREF[P.camp.start || 'aichi'].region;
  const open = new Set([home]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const r of [...open]) {
      if (!regionTaken(r)) continue;
      const i = REGION_ORDER.indexOf(r);
      for (const j of [i - 1, i + 1]) {
        const n = REGION_ORDER[j];
        if (n && !open.has(n)) { open.add(n); changed = true; }
      }
    }
  }
  return REGION_ORDER.filter(r => open.has(r));
}

/* ---- 出陣の兵糧（2026-09-26 に段を付けた）----
   はじめの国からいくつ目の章かで重くなる。国主との一戦はさらに +1。3 → 10 */
export function marchFood(pref, step) {
  if (!pref) return FOOD_COST;
  const rank = chapterRank(pref.region, (PREF[P.camp.start || 'aichi'] || {}).region);
  const last = step >= pref.battles - 1;
  return foodCost(rank, last, pref.lord);
}
// 出陣に兵糧が足りるか
export const canMarch = (pref, step) => { refillFood(); return P.stamina >= marchFood(pref, step); };
// 出陣で兵糧を払う
export function spendFood(pref, step) {
  refillFood();                                     // 時間で戻ったぶんを先に足す（2026-09-26）
  const need = marchFood(pref, step);
  if (P.stamina < need) return false;
  /* 満ちた状態から減らすときは、ここから3時間を数えはじめる */
  if (P.stamina >= P.staminaMax) P.foodAt = Date.now();
  P.stamina -= need; savePlayer(); return true;
}

/* 1戦勝ったぶん進める。県を取りきったら true を返す */
export function advancePref(id) {
  const pr = PREF[id]; if (!pr) return { taken: false };
  const now = Math.min(prefStep(id) + 1, pr.battles);
  P.camp.done[id] = now;
  const taken = now >= pr.battles;
  let unified = false;
  if (taken && takenCount() >= PREFS.length && !P.camp.clear) { P.camp.clear = true; unified = true; }
  /* 制覇の褒美は「初めて取った一度だけ」（2026-09-27）。
     取り返すたびに配ると、弱い国を往復するだけで無限に稼げてしまう。
     古い保存には got が無いので、そのときは いま取ってある国ぜんぶを
     「もう受け取った」ことにして始める（さかのぼって配り直さない） */
  if (!Array.isArray(P.camp.got)) {
    P.camp.got = PREFS.filter(q => q.id !== id && prefTaken(q.id)).map(q => q.id);
  }
  const first = taken && !P.camp.got.includes(id);
  if (first) P.camp.got.push(id);
  // 初めて制覇したときだけ褒美を上乗せする（大国ほど多い）
  let bonus = null;
  if (first) {
    const tier = pr.battles > 2 ? 1 : 0;              // 大国ほど上の段の無銘が出る
    /* 軍配は属性つきになったので（2026-09-23）、県ごとに出る属性を決め打ちにする。
       同じ県を取り返せば同じ属性が出るので、足りない属性は取りに行ける */
    const badge = badgeMat(ATTRS[seedOf(id) % ATTRS.length], pr.battles > 2 ? 1 : 0);
    bonus = { stone: 100 * pr.battles, koban: 1000 * pr.battles, soul: pr.battles,
              book: pr.battles, gear: freeMat(tier), gearN: pr.battles, badge, badgeN: 1 };
    addFreeStones(bonus.stone); P.koban += bonus.koban; P.soul += bonus.soul;
    P.items['大稽古の書'] = (P.items['大稽古の書'] || 0) + bonus.book;
    P.items[bonus.gear] = (P.items[bonus.gear] || 0) + bonus.gearN;
    P.items[badge] = (P.items[badge] || 0) + bonus.badgeN;
  }
  savePlayer();
  return { taken, unified, bonus, first };
}
