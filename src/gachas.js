/* くじの一覧（2026-09-28）
   くじが増えていくので、まず帯を並べて選んでもらい、押したら引く画面へ移る。
   ここに一行足すだけで新しいくじが増える。

   ── くじの書き方 ──
   id      印。帯の絵 app/assets/banner/<印>.png と
           後ろの絵 app/assets/bg/gacha_<印>.jpg の名にもなる（置くだけで反映）
   pick    ピックアップ。そのくじで初めて出すURの武将番号。
           **そのくじだけのもの**で、ほかのくじには出ない（2026-10-04 の決めごと）
   cast    そのくじで初めて出す武将の番号ぜんぶ（位は問わない）。
           pick（UR）も合わせてここに書く。**そのくじだけのもの**で、
           ほかのくじには位にかかわらず出ない（2026-10-04）
   home    true にすると「ふだんのくじ」。選ばれていないときの既定になる。
           一つだけ立てること
   pickUp  ピックアップがUR枠のうち何割を占めるか。書かなければ半分（0.5）
   urs     ピックアップ以外に、そのくじで出るURの武将番号。
           **書かなくてよい**（2026-10-04）。書かなければ
           「どのくじのピックアップでもないUR」＝みなの共通ぶんが入る。
           つまり あとから出すくじに、前のくじの顔ぶれは混ざらない
   bgUp    後ろの絵を何px上に寄せるか（2026-09-30）。書かなければ動かさない。
           絵の大きさは変えないので、下に空いたぶんは みくじの帯が隠す
   ticket  true にすると「祭の札」で引ける（2026-09-30）。
           札を先に減らし、足りなければ石に落ちる。書かなければ石だけ
   freeDay true にすると 一日にひとたび、一度引きが ただになる（2026-10-02）。
           使った日は P.gfree に くじの印ごとに控える。日が変われば また引ける
   どちらも書かなければ、これまでどおり全部のURが同じ率で出る。

   UR以外（SSR・SR・R・N）も、cast に書いた者は そのくじだけに出る。
   それ以外の顔ぶれと率は、どのくじでも同じ。 */
export const GACHAS = [
  {
    id: 'kamimatsuri1', name: '神キャラ祭り第一弾', sub: '戦国を支えた者達',
    until: '2026/11/30 23:59',
    words: '祭りじゃ。剣聖と茶聖が、ひときわ出やすうなっておる',
    ticket: true,                // 祭の札で引ける（2026-09-30）
    bgUp: 80,                    // 題字を残したまま、二匹を少し大きく見せる（2026-09-30）
    pick: [103, 104],            // 宮本ムサシ土佐・千リキュパグ（このくじだけ）
    /* 祭りで迎えた十体（2026-10-04）。位にかかわらず このくじだけに出る。
       猿飛サスケニーズ・石川ゴエシュナ・宮本ムサシ土佐・千リキュパグ・
       伊達マサシェパ・弥助クロラブ・出雲オクニパピヨン・望月チヨスピッツ・
       果心コジゾイ・雑賀マゴハウンド */
    cast: [101, 102, 103, 104, 105, 106, 107, 108, 109, 110],
    // urs は書かない。共通ぶん（2・38・61・71）が自ずと入り、信わんは入らない
  },
  {
    /* もとの「常世のわんこみくじ」はこれに一本化した（2026-09-28）。
       いつでも引ける ふだんのくじ＝門出のくじ。祭りの二人はここには出ない */
    id: 'release', name: 'リリースキャンペーンガチャ', sub: 'UR五英雄',
    until: null,
    words: '門出の祝いじゃ。いつでも引ける。信わんがひときわ出やすうなっておる',
    home: true,                  // ふだんのくじ（えらばれていないときの既定・2026-10-04）
    freeDay: true,               // 一日にひとたび、一度引きがただ（2026-10-02）
    pick: [1],                   // 織田信わんはここだけ
    cast: [1],
    // urs は書かない。共通ぶん（2・38・61・71）が自ずと入り、祭りの十体は入らない
  },
];
/* ふだんのくじ（2026-10-04）。えらばれていないときは かならずここに落とす。
   前は並びの先頭＝そのとき出している祭りのくじに落ちていたので、
   選ばずに引くと祭りの表から引いてしまう恐れがあった */
export const homeGacha = () => GACHAS.find(g => g.home) || GACHAS[0];
export const gachaOf = id => GACHAS.find(g => g.id === id) || homeGacha();

/* そのくじだけの顔ぶれ（2026-10-04）。pick（UR）と cast（位を問わず）を合わせたもの */
const castOf = g => new Set([...((g && g.cast) || []), ...((g && g.pick) || [])]);
/* ほかのくじのものになっている番号。ここに載っている者は このくじには出さない */
function foreignOf(g) {
  const mine = castOf(g);
  const out = new Set();
  for (const o of GACHAS) if (o !== g) for (const n of castOf(o)) if (!mine.has(n)) out.add(n);
  return out;
}
/* ほかのくじのものを取りのぞいた顔ぶれ（位ごと）。
   「あとから出すくじに、前のくじの顔ぶれは混ざらない」を、
   手で書き写さずに守るための仕掛け。新しいくじは pick と cast を書くだけでよい */
export function castPool(g, POOL) {
  const ng = foreignOf(g);
  if (!ng.size) return POOL;
  const out = {};
  for (const r of Object.keys(POOL)) {
    const kept = POOL[r].filter(c => !ng.has(c.no));
    out[r] = kept.length ? kept : POOL[r];   // 空になるなら元のまま（絵が無くても動く、と同じ考え）
  }
  return out;
}
/* どのくじのものでもないUR＝みなの共通ぶん */
function commonUrs(POOL) {
  const taken = new Set(GACHAS.flatMap(g => [...castOf(g)]));
  return (POOL.UR || []).map(c => c.no).filter(n => !taken.has(n));
}

/* そのくじで出るUR（ピックアップが先、そのあと その他）。詳細の画面でも使う */
export function urListOf(g, POOL) {
  const all = POOL.UR || [];
  const has = n => all.some(c => c.no === n);
  const pick = (g && g.pick || []).filter(has);
  const rest = (g && g.urs) ? g.urs.filter(n => has(n) && !pick.includes(n))
                            : commonUrs(POOL).filter(n => !pick.includes(n));
  return { pick, rest };
}
/* ピックアップが UR枠のうち何割か。既定は半分 */
export const pickUpOf = g => (g && g.pickUp != null) ? g.pickUp : 0.5;

/* そのくじ一人ぶんの出やすさ（詳細に出す数）。UR枠ぜんたいを urRate として割る */
export function urRatesOf(g, POOL, urRate) {
  const { pick, rest } = urListOf(g, POOL);
  const s = (pick.length && rest.length) ? pickUpOf(g) : (pick.length ? 1 : 0);
  const out = {};
  for (const n of pick) out[n] = urRate * s / pick.length;
  for (const n of rest) out[n] = urRate * (1 - s) / rest.length;
  return out;
}

/* そのくじの引き当て表を作る。URだけ差し替える。
   出やすさは「同じ武将を何枚も並べる」やり方で付ける（2026-09-28）。
   drawOne は並びから等しく1枚引くので、枚数がそのまま重みになる。
   こうすると引き当ての決まり（御籤番号から同じ結果が出る）を崩さずに済む。
   そのくじのURが1体もいなければ全部のURに落とす（「絵が無くても動く」と同じ考え） */
export function poolOf(g, POOL0) {
  // まず ほかのくじのものを取りのぞく（位を問わず）。そのうえでURの重みを付ける
  const POOL = castPool(g, POOL0);
  const { pick, rest } = urListOf(g, POOL);
  if (!pick.length && !rest.length) return POOL;
  if (!pick.length || !rest.length) {
    const only = (pick.length ? pick : rest);
    if (only.length === (POOL.UR || []).length) return POOL;
    return { ...POOL, UR: POOL.UR.filter(c => only.includes(c.no)) };
  }
  const s = pickUpOf(g);
  // 枚数。pick 一人ぶん wp 枚、rest 一人ぶん wo 枚。これで pick 側の割合がちょうど s になる
  let wp = Math.round(s * rest.length * 100);
  let wo = Math.round((1 - s) * pick.length * 100);
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  const d = gcd(wp, wo) || 1; wp = Math.max(1, wp / d); wo = Math.max(1, wo / d);
  const list = [];
  for (const n of pick) for (let i = 0; i < wp; i++) list.push(POOL.UR.find(c => c.no === n));
  for (const n of rest) for (let i = 0; i < wo; i++) list.push(POOL.UR.find(c => c.no === n));
  return { ...POOL, UR: list };
}
