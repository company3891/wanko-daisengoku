/* くじの一覧（2026-09-28）
   くじが増えていくので、まず帯を並べて選んでもらい、押したら引く画面へ移る。
   ここに一行足すだけで新しいくじが増える。

   ── くじの書き方 ──
   id      印。帯の絵 app/assets/banner/<印>.png と
           後ろの絵 app/assets/bg/gacha_<印>.jpg の名にもなる（置くだけで反映）
   pick    ピックアップ。新入りなど、そのくじで特に出したいURの武将番号
   pickUp  ピックアップがUR枠のうち何割を占めるか。書かなければ半分（0.5）
   urs     ピックアップ以外に、そのくじで出るURの武将番号
   bgUp    後ろの絵を何px上に寄せるか（2026-09-30）。書かなければ動かさない。
           絵の大きさは変えないので、下に空いたぶんは みくじの帯が隠す
   ticket  true にすると「祭の札」で引ける（2026-09-30）。
           札を先に減らし、足りなければ石に落ちる。書かなければ石だけ
   freeDay true にすると 一日にひとたび、一度引きが ただになる（2026-10-02）。
           使った日は P.gfree に くじの印ごとに控える。日が変われば また引ける
   どちらも書かなければ、これまでどおり全部のURが同じ率で出る。

   UR以外（SSR・SR・R・N）は どのくじでも同じ顔ぶれ・同じ率。 */
export const GACHAS = [
  {
    id: 'kamimatsuri1', name: '神キャラ祭り第一弾', sub: '戦国を支えた者達',
    until: '2026/11/30 23:59',
    words: '祭りじゃ。剣聖と茶聖が、ひときわ出やすうなっておる',
    ticket: true,                // 祭の札で引ける（2026-09-30）
    bgUp: 80,                    // 題字を残したまま、二匹を少し大きく見せる（2026-09-30）
    pick: [103, 104],            // 宮本ムサシ土佐・千リキュパグ（新入り）
    urs:  [2, 38, 61, 71],       // 信長わんは門出のくじだけ。ここには出さない
  },
  {
    /* もとの「常世のわんこみくじ」はこれに一本化した（2026-09-28）。
       いつでも引ける ふだんのくじ＝門出のくじ。祭りの二人はここには出ない */
    id: 'release', name: 'リリースキャンペーンガチャ', sub: 'UR五英雄',
    until: null,
    words: '門出の祝いじゃ。いつでも引ける。信わんがひときわ出やすうなっておる',
    freeDay: true,               // 一日にひとたび、一度引きがただ（2026-10-02）
    pick: [1],                   // 織田信わんはここだけ
    urs:  [2, 38, 61, 71],
  },
];
export const gachaOf = id => GACHAS.find(g => g.id === id) || GACHAS[0];

/* そのくじで出るUR（ピックアップが先、そのあと その他）。詳細の画面でも使う */
export function urListOf(g, POOL) {
  const all = POOL.UR || [];
  const has = n => all.some(c => c.no === n);
  const pick = (g && g.pick || []).filter(has);
  const rest = (g && g.urs) ? g.urs.filter(n => has(n) && !pick.includes(n))
                            : all.map(c => c.no).filter(n => !pick.includes(n));
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
export function poolOf(g, POOL) {
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
