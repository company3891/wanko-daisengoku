/* ================= 試練の塔（2026-10-01）=================
   百階。ひとつ抜かねば次へ進めない。一階ごとに「しばり」が付く。

   ・兵糧は どの階も 10
   ・何度でも挑める。褒美は初めて抜けた一度だけ
   ・陣中の品（秘薬・天候の品）は持ち込めない
   ・敵の陣形は、挑むまで分からない（一度見たら覚える）
   ・褒美は石だけ。品は配らない。節目（5の倍数）は多めに、
     櫓の主（10の倍数）はさらに多く、称号も渡す
   ・特技の伝書は 櫓の主（5の倍数）だけが渡す（2026-10-02）。
     ふつうの階からは外した。店の棚からも外したので、
     伝書の出どころは「櫓の主」と「番付の蔵」の二つだけになる。
     櫓の主 ×3 ／ 大櫓（10の倍数）×6

   ── しばりの書き方 ──
   units {max}          出す頭数の上限
   cost  {max}          出陣コストの合計の上限
   each  {cost}         一人ずつのコストの上限
   attr  {v} / {allDiff}
   rarity{v} / {max} / {min} / {allDiff}
   clan  {v} / {none} / {allDiff}
   gender{v}
   role  {has} / {hasAny} / {not} / {allDiff} / {has,min} / {one,rest}
   range {v} / {min} / {hasV}
   form  {v}            陣形
   genPos{v:'前'|'後'}  総大将の置き場
   turns {max}          何ターン以内
   noDeath              誰も倒されない
   hpLeft{pct}          兵量を何割以上残す
   noUlt / ult{min}     奥義
   noCover              かばわない
   counter{min} / crit{min} / status{min}
   genSafe              総大将が無傷
   genOnly              総大将だけで倒しきる
   foeGenFirst          敵の総大将を最初に倒す
   useNo {v}            この武将を入れる
   hold {turns}         そのターンまで持ちこたえれば勝ち
   （階そのものに書く持ち物）
   hold:N               決着のターンを N にし、守り切った側（こちら）を勝ちにする
   hp1:true             味方はみな兵量1から始まる（先に癒す手を作らねば勝てない）
   keep:{hp}            盤の奥に天守（壊せる城）を立てる。2026-10-02
                        守り兵を全部倒しても、城が立っているうちは終わらない。
                        射程1は城の正面一マスからしか斬れず、射程2以上は石垣ごしに届く
   limit:N              決着のターンを N にする（攻め城は時がかかるので伸ばす）

   しばりは二段で見る。
   ・「編成」の段（tower.js の checkTeam）… 出陣の前に弾ける
   ・「戦いぶり」の段（checkResult）… 戦い終わりの控えで確かめる
*/
export const TOWER_FOOD = 10;          // 一階あたりの兵糧
export const TOWER_MAX = 100;

/* 位の並び。名がぶつからないよう 塔だけの呼び名にする（2026-10-01・束ねると同じ袋に入るため） */
const TW_RANK = ['N', 'R', 'SR', 'SSR', 'UR'];
const twRk = r => Math.max(0, TW_RANK.indexOf(r));

export const TOWER = [
  { f:1, name:'門をたたく', t:'しばりなし', cond:[], stage:'草原', hard:1, enemy:{ cost:600, lv:20, soul:0, skill:1 }, rw:{ stone:300, koban:800, items:{ '稽古の書': 3 } } },
  { f:2, name:'猛き者', t:'猛将だけで勝つ', cond:[{ k:'attr', v:'猛将' }], stage:'草原', hard:1, enemy:{ cost:600, lv:20, soul:0, skill:1 }, rw:{ stone:300, koban:800, items:{ '稽古の書': 3 } } },
  { f:3, name:'智恵者', t:'智将だけで勝つ', cond:[{ k:'attr', v:'智将' }], stage:'草原', hard:1, enemy:{ cost:600, lv:20, soul:0, skill:1 }, rw:{ stone:300, koban:800, items:{ '稽古の書': 3 } } },
  { f:4, name:'堅き者', t:'守将だけで勝つ', cond:[{ k:'attr', v:'守将' }], stage:'草原', hard:1, enemy:{ cost:600, lv:20, soul:0, skill:1 }, rw:{ stone:300, koban:800, items:{ '稽古の書': 3 } } },
  { f:5, name:'情け深き者', t:'仁将だけで勝つ', cond:[{ k:'attr', v:'仁将' }], stage:'草原', hard:2, enemy:{ cost:720, lv:25, soul:0, skill:1 }, rw:{ stone:400, koban:1600, items:{ '稽古の書': 3, '特技の伝書': 3 } } },
  { f:6, name:'疾き者', t:'神速だけで勝つ', cond:[{ k:'attr', v:'神速' }], stage:'草原', hard:2, enemy:{ cost:600, lv:20, soul:0, skill:1 }, rw:{ stone:300, koban:800, items:{ '稽古の書': 3 } } },
  { f:7, name:'四人', t:'四人までで勝つ', cond:[{ k:'units', max:4 }], stage:'草原', hard:2, enemy:{ cost:600, lv:20, soul:0, skill:1 }, rw:{ stone:300, koban:800, items:{ '稽古の書': 3 } } },
  { f:8, name:'欠けず', t:'誰も倒されずに勝つ', cond:[{ k:'noDeath' }], stage:'草原', hard:2, enemy:{ cost:600, lv:20, soul:0, skill:1 }, rw:{ stone:300, koban:800, items:{ '稽古の書': 3 } } },
  { f:9, name:'先陣', t:'総大将を前列に置いて勝つ', cond:[{ k:'genPos', v:'前' }], stage:'草原', hard:2, enemy:{ cost:600, lv:20, soul:0, skill:1 }, rw:{ stone:300, koban:800, items:{ '稽古の書': 3 } } },
  { f:10, name:'三人', t:'三人までで勝つ', cond:[{ k:'units', max:3 }], stage:'草原', hard:3, enemy:{ cost:600, lv:20, soul:0, skill:1 }, rw:{ stone:500, koban:2400, items:{ '稽古の書': 6, '特技の伝書': 6 }, title:'塔に入りし者' } },
  { f:11, name:'二人', t:'二人までで勝つ', cond:[{ k:'units', max:2 }], stage:'山岳', hard:2, enemy:{ cost:650, lv:28, soul:50, skill:1 }, rw:{ stone:300, koban:1200, items:{ '稽古の書': 4 } } },
  { f:12, name:'軽き陣', t:'出陣コストの合計 600 以下', cond:[{ k:'cost', max:600 }], stage:'山岳', hard:2, enemy:{ cost:650, lv:28, soul:50, skill:1 }, rw:{ stone:300, koban:1200, items:{ '稽古の書': 4 } } },
  { f:13, name:'単騎', t:'一人で勝つ', cond:[{ k:'units', max:1 }], stage:'山岳', hard:3, enemy:{ cost:650, lv:28, soul:50, skill:1 }, rw:{ stone:300, koban:1200, items:{ '稽古の書': 4 } } },
  { f:14, name:'数を頼む', t:'出陣コスト150以下の武将だけで勝つ', cond:[{ k:'each', cost:150 }], stage:'山岳', hard:2, enemy:{ cost:650, lv:28, soul:50, skill:1 }, rw:{ stone:300, koban:1200, items:{ '稽古の書': 4 } } },
  { f:15, name:'身軽', t:'出陣コストの合計 400 以下', cond:[{ k:'cost', max:400 }], stage:'山岳', hard:3, enemy:{ cost:770, lv:33, soul:50, skill:1 }, rw:{ stone:400, koban:2400, items:{ '稽古の書': 4, '特技の伝書': 3 } } },
  { f:16, name:'二人、欠けず', t:'二人までで、誰も倒されずに勝つ', cond:[{ k:'units', max:2 }, { k:'noDeath' }], stage:'山岳', hard:3, enemy:{ cost:650, lv:28, soul:50, skill:1 }, rw:{ stone:300, koban:1200, items:{ '稽古の書': 4 } } },
  { f:17, name:'疾き単騎', t:'一人で 10ターン以内に勝つ', cond:[{ k:'units', max:1 }, { k:'turns', max:10 }], stage:'山岳', hard:3, enemy:{ cost:650, lv:28, soul:50, skill:1 }, rw:{ stone:300, koban:1200, items:{ '稽古の書': 4 } } },
  { f:18, name:'軽き四人', t:'四人まで・コストの合計 500 以下', cond:[{ k:'units', max:4 }, { k:'cost', max:500 }], stage:'山岳', hard:3, enemy:{ cost:650, lv:28, soul:50, skill:1 }, rw:{ stone:300, koban:1200, items:{ '稽古の書': 4 } } },
  { f:19, name:'一騎、無傷', t:'一人で、兵量を半分以上残して勝つ', cond:[{ k:'units', max:1 }, { k:'hpLeft', pct:50 }], stage:'山岳', hard:4, enemy:{ cost:650, lv:28, soul:50, skill:1 }, rw:{ stone:300, koban:1200, items:{ '稽古の書': 4 } } },
  { f:20, name:'孤影', t:'一人で、倒されずに勝つ', cond:[{ k:'units', max:1 }, { k:'noDeath' }], stage:'山岳', hard:4, enemy:{ cost:650, lv:28, soul:50, skill:1 }, rw:{ stone:500, koban:3600, items:{ '稽古の書': 8, '特技の伝書': 6 }, title:'寡兵の将' } },
  { f:21, name:'籠城', t:'15ターン持ちこたえる（倒しきらずともよい）', cond:[{ k:'hold', turns:15 }], hold:15, stage:'城郭', hard:3, enemy:{ cost:760, lv:40, soul:120, skill:1 }, rw:{ stone:300, koban:1800, items:{ '稽古の書': 5 } } },
  { f:22, name:'城を攻む', t:'10ターン以内に勝つ', cond:[{ k:'turns', max:10 }], stage:'城郭', hard:2, enemy:{ cost:700, lv:36, soul:120, skill:1 }, rw:{ stone:300, koban:1800, items:{ '稽古の書': 5 } } },
  { f:23, name:'凹の陣', t:'陣形「凹」で勝つ', cond:[{ k:'form', v:'凹' }], stage:'草原', hard:2, enemy:{ cost:700, lv:36, soul:120, skill:1 }, rw:{ stone:300, koban:1800, items:{ '稽古の書': 5 } } },
  { f:24, name:'Ｖの陣', t:'陣形「V字」で勝つ', cond:[{ k:'form', v:'V字' }], stage:'山岳', hard:3, enemy:{ cost:700, lv:36, soul:120, skill:1 }, rw:{ stone:300, koban:1800, items:{ '稽古の書': 5 } } },
  { f:25, name:'波打つ陣', t:'陣形「波型」で、誰も倒されずに勝つ', cond:[{ k:'form', v:'波型' }, { k:'noDeath' }], stage:'河川', hard:3, enemy:{ cost:820, lv:41, soul:120, skill:1 }, rw:{ stone:400, koban:3600, items:{ '稽古の書': 5, '特技の伝書': 3 } } },
  { f:26, name:'瀕死の陣', t:'味方はみな兵量1から始まる', cond:[], hp1:true, stage:'河川', hard:4, enemy:{ cost:620, lv:30, soul:80, skill:1 }, rw:{ stone:300, koban:1800, items:{ '稽古の書': 5 } } },
  { f:27, name:'森に潜む', t:'射程1の武将だけで勝つ', cond:[{ k:'range', v:1 }], stage:'山岳', hard:3, enemy:{ cost:700, lv:36, soul:120, skill:1 }, rw:{ stone:300, koban:1800, items:{ '稽古の書': 5 } } },
  { f:28, name:'壁ごしに', t:'射程2以上の武将だけで勝つ', cond:[{ k:'range', min:2 }], stage:'城郭', hard:3, enemy:{ cost:700, lv:36, soul:120, skill:1 }, rw:{ stone:300, koban:1800, items:{ '稽古の書': 5 } } },
  { f:29, name:'山を駆ける', t:'神速だけで勝つ', cond:[{ k:'attr', v:'神速' }], stage:'山岳', hard:3, enemy:{ cost:700, lv:36, soul:120, skill:1 }, rw:{ stone:300, koban:1800, items:{ '稽古の書': 5 } } },
  /* 30階・60階・100階は「天守落とし」（2026-10-02）。盤の奥に壊せる城が立つ。
     守り兵を倒しても終わらない ＝ 何を倒すかではなく、何を壊すかで編成が変わる */
  { f:30, name:'城落とし', t:'誰も倒されずに天守を落とす', cond:[{ k:'noDeath' }], keep:{ hp:3000 }, limit:25, stage:'城郭', hard:4, enemy:{ cost:620, lv:30, soul:60, skill:1 }, rw:{ stone:600, koban:5400, items:{ '稽古の書': 10, '特技の伝書': 6 }, title:'地の利' } },
  { f:31, name:'織田の旗', t:'織田家だけで勝つ', cond:[{ k:'clan', v:'織田家' }], stage:'草原', hard:3, enemy:{ cost:780, lv:45, soul:200, skill:2 }, rw:{ stone:300, koban:2600, items:{ '大稽古の書': 2 } } },
  { f:32, name:'武田の旗', t:'武田家だけで勝つ', cond:[{ k:'clan', v:'武田家' }], stage:'草原', hard:3, enemy:{ cost:780, lv:45, soul:200, skill:2 }, rw:{ stone:300, koban:2600, items:{ '大稽古の書': 2 } } },
  { f:33, name:'上杉の旗', t:'上杉家だけで勝つ', cond:[{ k:'clan', v:'上杉家' }], stage:'草原', hard:3, enemy:{ cost:780, lv:45, soul:200, skill:2 }, rw:{ stone:300, koban:2600, items:{ '大稽古の書': 2 } } },
  { f:34, name:'徳川の旗', t:'徳川家だけで勝つ', cond:[{ k:'clan', v:'徳川家' }], stage:'草原', hard:3, enemy:{ cost:780, lv:45, soul:200, skill:2 }, rw:{ stone:300, koban:2600, items:{ '大稽古の書': 2 } } },
  { f:35, name:'北条の旗', t:'北条家だけで勝つ', cond:[{ k:'clan', v:'北条家' }], stage:'草原', hard:4, enemy:{ cost:900, lv:50, soul:200, skill:2 }, rw:{ stone:400, koban:5200, items:{ '大稽古の書': 2, '特技の伝書': 3 } } },
  { f:36, name:'豊臣の旗', t:'豊臣家だけで勝つ', cond:[{ k:'clan', v:'豊臣家' }], stage:'草原', hard:3, enemy:{ cost:780, lv:45, soul:200, skill:2 }, rw:{ stone:300, koban:2600, items:{ '大稽古の書': 2 } } },
  { f:37, name:'真田の旗', t:'真田家だけで勝つ', cond:[{ k:'clan', v:'真田家' }], stage:'草原', hard:4, enemy:{ cost:780, lv:45, soul:200, skill:2 }, rw:{ stone:300, koban:2600, items:{ '大稽古の書': 2 } } },
  { f:38, name:'立花の旗', t:'立花家だけで勝つ', cond:[{ k:'clan', v:'立花家' }], stage:'草原', hard:4, enemy:{ cost:780, lv:45, soul:200, skill:2 }, rw:{ stone:300, koban:2600, items:{ '大稽古の書': 2 } } },
  { f:39, name:'主なき者ら', t:'所属のない武将だけで勝つ', cond:[{ k:'clan', none:true }], stage:'草原', hard:3, enemy:{ cost:780, lv:45, soul:200, skill:2 }, rw:{ stone:300, koban:2600, items:{ '大稽古の書': 2 } } },
  { f:40, name:'呉越同舟', t:'五人の所属がすべてちがう編成で勝つ', cond:[{ k:'clan', allDiff:true }], stage:'草原', hard:4, enemy:{ cost:780, lv:45, soul:200, skill:2 }, rw:{ stone:600, koban:7800, items:{ '大稽古の書': 4, '特技の伝書': 6 }, title:'一門の主' } },
  { f:41, name:'一人も欠けず', t:'誰も倒されずに勝つ', cond:[{ k:'noDeath' }], stage:'河川', hard:3, enemy:{ cost:850, lv:55, soul:300, skill:2 }, rw:{ stone:300, koban:3600, items:{ '大稽古の書': 3 } } },
  { f:42, name:'半分残す', t:'兵量を半分以上残して勝つ', cond:[{ k:'hpLeft', pct:50 }], stage:'河川', hard:3, enemy:{ cost:850, lv:55, soul:300, skill:2 }, rw:{ stone:300, koban:3600, items:{ '大稽古の書': 3 } } },
  { f:43, name:'三人、欠けず', t:'三人までで、誰も倒されずに勝つ', cond:[{ k:'units', max:3 }, { k:'noDeath' }], stage:'河川', hard:4, enemy:{ cost:850, lv:55, soul:300, skill:2 }, rw:{ stone:300, koban:3600, items:{ '大稽古の書': 3 } } },
  { f:44, name:'癒し手なし', t:'回復の役を入れず、誰も倒されずに勝つ', cond:[{ k:'role', not:'回復' }, { k:'noDeath' }], stage:'河川', hard:4, enemy:{ cost:850, lv:55, soul:300, skill:2 }, rw:{ stone:300, koban:3600, items:{ '大稽古の書': 3 } } },
  { f:45, name:'八分残す', t:'兵量を八割以上残して勝つ', cond:[{ k:'hpLeft', pct:80 }], stage:'河川', hard:4, enemy:{ cost:970, lv:60, soul:300, skill:2 }, rw:{ stone:400, koban:7200, items:{ '大稽古の書': 3, '特技の伝書': 3 } } },
  { f:46, name:'庇わず', t:'かばうを使わず、誰も倒されずに勝つ', cond:[{ k:'noCover' }, { k:'noDeath' }], stage:'河川', hard:4, enemy:{ cost:850, lv:55, soul:300, skill:2 }, rw:{ stone:300, koban:3600, items:{ '大稽古の書': 3 } } },
  { f:47, name:'大将は高みに', t:'総大将が一度も傷を負わずに勝つ', cond:[{ k:'genSafe' }], stage:'河川', hard:4, enemy:{ cost:850, lv:55, soul:300, skill:2 }, rw:{ stone:300, koban:3600, items:{ '大稽古の書': 3 } } },
  { f:48, name:'奥義に頼らず', t:'奥義を使わず、誰も倒されずに勝つ', cond:[{ k:'noUlt' }, { k:'noDeath' }], stage:'河川', hard:4, enemy:{ cost:850, lv:55, soul:300, skill:2 }, rw:{ stone:300, koban:3600, items:{ '大稽古の書': 3 } } },
  { f:49, name:'姫の陣', t:'女武将だけで、誰も倒されずに勝つ', cond:[{ k:'gender', v:'女' }, { k:'noDeath' }], stage:'河川', hard:5, enemy:{ cost:850, lv:55, soul:300, skill:2 }, rw:{ stone:300, koban:3600, items:{ '大稽古の書': 3 } } },
  /* 50階も天守の階にした（2026-10-02）。
     もとは「満身（全員が兵量満タンのまま勝つ）」。攻め城で無傷は成り立たないので、
     五重の題（無傷）は残したまま「誰も倒されずに落とす」に読み替えた */
  { f:50, name:'無傷の城落とし', t:'誰も倒されずに天守を落とす', cond:[{ k:'noDeath' }], keep:{ hp:3500 }, limit:25, stage:'城郭', hard:5, enemy:{ cost:850, lv:55, soul:300, skill:2 }, rw:{ stone:700, koban:10800, items:{ '大稽古の書': 6, '特技の伝書': 6 }, title:'無傷の名' } },
  { f:51, name:'八手', t:'8ターン以内に勝つ', cond:[{ k:'turns', max:8 }], stage:'草原', hard:3, enemy:{ cost:920, lv:64, soul:420, skill:2 }, rw:{ stone:300, koban:5000, items:{ '大稽古の書': 4 } } },
  { f:52, name:'六手', t:'6ターン以内に勝つ', cond:[{ k:'turns', max:6 }], stage:'草原', hard:3, enemy:{ cost:920, lv:64, soul:420, skill:2 }, rw:{ stone:300, koban:5000, items:{ '大稽古の書': 4 } } },
  { f:53, name:'五手', t:'5ターン以内に勝つ', cond:[{ k:'turns', max:5 }], stage:'草原', hard:4, enemy:{ cost:920, lv:64, soul:420, skill:2 }, rw:{ stone:300, koban:5000, items:{ '大稽古の書': 4 } } },
  { f:54, name:'疾風五手', t:'神速だけで 5ターン以内に勝つ', cond:[{ k:'attr', v:'神速' }, { k:'turns', max:5 }], stage:'草原', hard:4, enemy:{ cost:920, lv:64, soul:420, skill:2 }, rw:{ stone:300, koban:5000, items:{ '大稽古の書': 4 } } },
  { f:55, name:'四手', t:'4ターン以内に勝つ', cond:[{ k:'turns', max:4 }], stage:'草原', hard:4, enemy:{ cost:1040, lv:69, soul:420, skill:2 }, rw:{ stone:400, koban:10000, items:{ '大稽古の書': 4, '特技の伝書': 3 } } },
  { f:56, name:'三人六手', t:'三人までで 6ターン以内に勝つ', cond:[{ k:'units', max:3 }, { k:'turns', max:6 }], stage:'草原', hard:4, enemy:{ cost:920, lv:64, soul:420, skill:2 }, rw:{ stone:300, koban:5000, items:{ '大稽古の書': 4 } } },
  { f:57, name:'単騎八手', t:'一人で 8ターン以内に勝つ', cond:[{ k:'units', max:1 }, { k:'turns', max:8 }], stage:'草原', hard:4, enemy:{ cost:920, lv:64, soul:420, skill:2 }, rw:{ stone:300, koban:5000, items:{ '大稽古の書': 4 } } },
  { f:58, name:'三手', t:'3ターン以内に勝つ', cond:[{ k:'turns', max:3 }], stage:'草原', hard:5, enemy:{ cost:920, lv:64, soul:420, skill:2 }, rw:{ stone:300, koban:5000, items:{ '大稽古の書': 4 } } },
  { f:59, name:'懐に入る', t:'射程1だけで 4ターン以内に勝つ', cond:[{ k:'range', v:1 }, { k:'turns', max:4 }], stage:'草原', hard:5, enemy:{ cost:920, lv:64, soul:420, skill:2 }, rw:{ stone:300, koban:5000, items:{ '大稽古の書': 4 } } },
  { f:60, name:'疾き城落とし', t:'18ターン以内に天守を落とす', cond:[{ k:'turns', max:18 }], keep:{ hp:3500 }, limit:25, stage:'城郭', hard:5, enemy:{ cost:860, lv:58, soul:300, skill:2 }, rw:{ stone:800, koban:15000, items:{ '大稽古の書': 8, '特技の伝書': 6 }, title:'疾風' } },
  { f:61, name:'前を張る', t:'役目に「前衛」が付く武将だけで勝つ', cond:[{ k:'role', has:'前衛' }], stage:'山岳', hard:3, enemy:{ cost:1000, lv:73, soul:550, skill:3 }, rw:{ stone:300, koban:6800, items:{ '皆伝の書': 1 } } },
  { f:62, name:'後ろを支える', t:'役目に「後衛」が付く武将だけで勝つ', cond:[{ k:'role', has:'後衛' }], stage:'山岳', hard:3, enemy:{ cost:1000, lv:73, soul:550, skill:3 }, rw:{ stone:300, koban:6800, items:{ '皆伝の書': 1 } } },
  { f:63, name:'懐の間合い', t:'射程1だけで勝つ', cond:[{ k:'range', v:1 }], stage:'山岳', hard:3, enemy:{ cost:1000, lv:73, soul:550, skill:3 }, rw:{ stone:300, koban:6800, items:{ '皆伝の書': 1 } } },
  { f:64, name:'遠間', t:'射程2以上だけで勝つ', cond:[{ k:'range', min:2 }], stage:'山岳', hard:3, enemy:{ cost:1000, lv:73, soul:550, skill:3 }, rw:{ stone:300, koban:6800, items:{ '皆伝の書': 1 } } },
  { f:65, name:'影働き', t:'「忍び」か「奇襲」の役だけで勝つ', cond:[{ k:'role', hasAny:['忍び','奇襲'] }], stage:'山岳', hard:4, enemy:{ cost:1120, lv:78, soul:550, skill:3 }, rw:{ stone:400, koban:13600, items:{ '皆伝の書': 1, '特技の伝書': 3 } } },
  { f:66, name:'二人の癒し手', t:'回復の役を二人入れ、誰も倒されずに勝つ', cond:[{ k:'role', has:'回復', min:2 }, { k:'noDeath' }], stage:'山岳', hard:4, enemy:{ cost:1000, lv:73, soul:550, skill:3 }, rw:{ stone:300, koban:6800, items:{ '皆伝の書': 1 } } },
  { f:67, name:'大将は後詰', t:'総大将を後列に置いて勝つ', cond:[{ k:'genPos', v:'後' }], stage:'山岳', hard:3, enemy:{ cost:1000, lv:73, soul:550, skill:3 }, rw:{ stone:300, koban:6800, items:{ '皆伝の書': 1 } } },
  { f:68, name:'遠矢', t:'射程3の武将を入れて勝つ', cond:[{ k:'range', hasV:3 }], stage:'山岳', hard:4, enemy:{ cost:1000, lv:73, soul:550, skill:3 }, rw:{ stone:300, koban:6800, items:{ '皆伝の書': 1 } } },
  { f:69, name:'十人十色', t:'役目がすべてちがう編成で勝つ', cond:[{ k:'role', allDiff:true }], stage:'山岳', hard:4, enemy:{ cost:1000, lv:73, soul:550, skill:3 }, rw:{ stone:300, koban:6800, items:{ '皆伝の書': 1 } } },
  { f:70, name:'偏った陣', t:'前衛ひとり・残りは後衛で勝つ', cond:[{ k:'role', one:'前衛', rest:'後衛' }], stage:'山岳', hard:5, enemy:{ cost:1000, lv:73, soul:550, skill:3 }, rw:{ stone:900, koban:20400, items:{ '皆伝の書': 2, '特技の伝書': 6 }, title:'役者ぞろい' } },
  { f:71, name:'名もなき者ら', t:'N だけで勝つ', cond:[{ k:'rarity', v:'N' }], stage:'城郭', hard:3, enemy:{ cost:1060, lv:82, soul:680, skill:3 }, rw:{ stone:300, koban:9000, items:{ '皆伝の書': 1 } } },
  { f:72, name:'下士', t:'R 以下だけで勝つ', cond:[{ k:'rarity', max:'R' }], stage:'城郭', hard:3, enemy:{ cost:1060, lv:82, soul:680, skill:3 }, rw:{ stone:300, koban:9000, items:{ '皆伝の書': 1 } } },
  { f:73, name:'中士', t:'SR 以下だけで勝つ', cond:[{ k:'rarity', max:'SR' }], stage:'城郭', hard:3, enemy:{ cost:1060, lv:82, soul:680, skill:3 }, rw:{ stone:300, koban:9000, items:{ '皆伝の書': 1 } } },
  { f:74, name:'極みを欠く', t:'UR を入れずに勝つ', cond:[{ k:'rarity', max:'SSR' }], stage:'城郭', hard:3, enemy:{ cost:1060, lv:82, soul:680, skill:3 }, rw:{ stone:300, koban:9000, items:{ '皆伝の書': 1 } } },
  { f:75, name:'三人の無名', t:'N だけ三人までで勝つ', cond:[{ k:'rarity', v:'N' }, { k:'units', max:3 }], stage:'城郭', hard:4, enemy:{ cost:1180, lv:87, soul:680, skill:3 }, rw:{ stone:400, koban:18000, items:{ '皆伝の書': 1, '特技の伝書': 3 } } },
  { f:76, name:'上士のみ', t:'SSR 以上だけで勝つ', cond:[{ k:'rarity', min:'SSR' }], stage:'城郭', hard:4, enemy:{ cost:1060, lv:82, soul:680, skill:3 }, rw:{ stone:300, koban:9000, items:{ '皆伝の書': 1 } } },
  { f:77, name:'位はばらばら', t:'位がすべてちがう編成で勝つ', cond:[{ k:'rarity', allDiff:true }], stage:'城郭', hard:4, enemy:{ cost:1060, lv:82, soul:680, skill:3 }, rw:{ stone:300, koban:9000, items:{ '皆伝の書': 1 } } },
  { f:78, name:'無名、欠けず', t:'N だけで、誰も倒されずに勝つ', cond:[{ k:'rarity', v:'N' }, { k:'noDeath' }], stage:'城郭', hard:5, enemy:{ cost:1060, lv:82, soul:680, skill:3 }, rw:{ stone:300, koban:9000, items:{ '皆伝の書': 1 } } },
  { f:79, name:'一騎の極み', t:'UR 一人だけで勝つ', cond:[{ k:'rarity', v:'UR' }, { k:'units', max:1 }], stage:'城郭', hard:4, enemy:{ cost:1060, lv:82, soul:680, skill:3 }, rw:{ stone:300, koban:9000, items:{ '皆伝の書': 1 } } },
  { f:80, name:'無名の疾さ', t:'N だけで 5ターン以内に勝つ', cond:[{ k:'rarity', v:'N' }, { k:'turns', max:5 }], stage:'城郭', hard:5, enemy:{ cost:1060, lv:82, soul:680, skill:3 }, rw:{ stone:1000, koban:27000, items:{ '皆伝の書': 2, '特技の伝書': 6 }, title:'位に依らず' } },
  { f:81, name:'奥義を封ず', t:'奥義を使わずに勝つ', cond:[{ k:'noUlt' }], stage:'河川', hard:4, enemy:{ cost:1130, lv:91, soul:830, skill:3 }, rw:{ stone:300, koban:12000, items:{ '皆伝の書': 2 } } },
  { f:82, name:'三度の奥義', t:'奥義を三度以上撃って勝つ', cond:[{ k:'ult', min:3 }], stage:'河川', hard:4, enemy:{ cost:1130, lv:91, soul:830, skill:3 }, rw:{ stone:300, koban:12000, items:{ '皆伝の書': 2 } } },
  { f:83, name:'大将のひと働き', t:'総大将だけで敵を倒しきる', cond:[{ k:'genOnly' }], stage:'河川', hard:5, enemy:{ cost:1130, lv:91, soul:830, skill:3 }, rw:{ stone:300, koban:12000, items:{ '皆伝の書': 2 } } },
  { f:84, name:'術くらべ', t:'状態異常を三種類以上あたえて勝つ', cond:[{ k:'status', min:3 }], stage:'河川', hard:4, enemy:{ cost:1130, lv:91, soul:830, skill:3 }, rw:{ stone:300, koban:12000, items:{ '皆伝の書': 2 } } },
  { f:85, name:'軍神を招く', t:'上杉ケンシンを入れて勝つ', cond:[{ k:'useNo', v:15 }], stage:'河川', hard:4, enemy:{ cost:1250, lv:96, soul:830, skill:3 }, rw:{ stone:400, koban:24000, items:{ '皆伝の書': 2, '特技の伝書': 3 } } },
  { f:86, name:'会心', t:'会心を五度以上出して勝つ', cond:[{ k:'crit', min:5 }], stage:'河川', hard:4, enemy:{ cost:1130, lv:91, soul:830, skill:3 }, rw:{ stone:300, koban:12000, items:{ '皆伝の書': 2 } } },
  { f:87, name:'返し技', t:'反撃を三度以上出して勝つ', cond:[{ k:'counter', min:3 }], stage:'河川', hard:4, enemy:{ cost:1130, lv:91, soul:830, skill:3 }, rw:{ stone:300, koban:12000, items:{ '皆伝の書': 2 } } },
  { f:88, name:'首を獲る', t:'敵の総大将をいちばん先に倒して勝つ', cond:[{ k:'foeGenFirst' }], stage:'河川', hard:5, enemy:{ cost:1130, lv:91, soul:830, skill:3 }, rw:{ stone:300, koban:12000, items:{ '皆伝の書': 2 } } },
  { f:89, name:'女武者の陣', t:'女武将だけで勝つ', cond:[{ k:'gender', v:'女' }], stage:'河川', hard:4, enemy:{ cost:1130, lv:91, soul:830, skill:3 }, rw:{ stone:300, koban:12000, items:{ '皆伝の書': 2 } } },
  { f:90, name:'孤高', t:'ひとりで 15ターン持ちこたえる', cond:[{ k:'units', max:1 }, { k:'hold', turns:15 }], hold:15, stage:'城郭', hard:5, enemy:{ cost:1130, lv:91, soul:830, skill:3 }, rw:{ stone:1200, koban:36000, items:{ '皆伝の書': 4, '特技の伝書': 6 }, title:'奇策の主' } },
  { f:91, name:'猛き三人', t:'猛将だけ三人までで勝つ', cond:[{ k:'attr', v:'猛将' }, { k:'units', max:3 }], stage:'城郭', hard:4, enemy:{ cost:1200, lv:99, soul:999, skill:3 }, rw:{ stone:300, koban:16000, items:{ '皆伝の書': 2 } } },
  { f:92, name:'姫の無傷', t:'女武将だけで、誰も倒されずに勝つ', cond:[{ k:'gender', v:'女' }, { k:'noDeath' }], stage:'城郭', hard:5, enemy:{ cost:1200, lv:99, soul:999, skill:3 }, rw:{ stone:300, koban:16000, items:{ '皆伝の書': 2 } } },
  { f:93, name:'無名の疾駆', t:'N だけで 6ターン以内に勝つ', cond:[{ k:'rarity', v:'N' }, { k:'turns', max:6 }], stage:'城郭', hard:5, enemy:{ cost:1200, lv:99, soul:999, skill:3 }, rw:{ stone:300, koban:16000, items:{ '皆伝の書': 2 } } },
  { f:94, name:'単騎五手', t:'一人で 5ターン以内に勝つ', cond:[{ k:'units', max:1 }, { k:'turns', max:5 }], stage:'城郭', hard:5, enemy:{ cost:1200, lv:99, soul:999, skill:3 }, rw:{ stone:300, koban:16000, items:{ '皆伝の書': 2 } } },
  { f:95, name:'寄せ集めの無傷', t:'所属がすべてちがう編成で、誰も倒されずに勝つ', cond:[{ k:'clan', allDiff:true }, { k:'noDeath' }], stage:'城郭', hard:5, enemy:{ cost:1320, lv:99, soul:999, skill:3 }, rw:{ stone:400, koban:32000, items:{ '皆伝の書': 2, '特技の伝書': 3 } } },
  { f:96, name:'懐三人', t:'射程1だけ三人までで、誰も倒されずに勝つ', cond:[{ k:'range', v:1 }, { k:'units', max:3 }, { k:'noDeath' }], stage:'城郭', hard:5, enemy:{ cost:1200, lv:99, soul:999, skill:3 }, rw:{ stone:300, koban:16000, items:{ '皆伝の書': 2 } } },
  { f:97, name:'三重の枷', t:'兵量1から始まり、三人まで・奥義なしで勝つ', cond:[{ k:'units', max:3 }, { k:'noUlt' }], hp1:true, stage:'城郭', hard:5, enemy:{ cost:1060, lv:91, soul:830, skill:3 }, rw:{ stone:300, koban:16000, items:{ '皆伝の書': 2 } } },
  { f:98, name:'無手の単騎', t:'一人で、奥義を使わずに勝つ', cond:[{ k:'units', max:1 }, { k:'noUlt' }], stage:'城郭', hard:5, enemy:{ cost:1200, lv:99, soul:999, skill:3 }, rw:{ stone:300, koban:16000, items:{ '皆伝の書': 2 } } },
  { f:99, name:'五者五様', t:'位も属性もすべてちがう編成で勝つ', cond:[{ k:'rarity', allDiff:true }, { k:'attr', allDiff:true }], stage:'城郭', hard:5, enemy:{ cost:1200, lv:99, soul:999, skill:3 }, rw:{ stone:300, koban:16000, items:{ '皆伝の書': 2 } } },
  { f:100, name:'天守の主', t:'一人で、倒されずに天守を落とす', cond:[{ k:'units', max:1 }, { k:'noDeath' }], keep:{ hp:4000 }, limit:30, stage:'城郭', hard:5, enemy:{ cost:1200, lv:99, soul:999, skill:3 }, rw:{ stone:3000, koban:48000, items:{ '皆伝の書': 4, '特技の伝書': 6 }, title:'天守の主' } },
];

export const towerOf = f => TOWER.find(x => x.f === f) || null;
/* 何重（え）の何階か。1〜10が一重、11〜20が二重…… */
export const towerTier = f => Math.floor((f - 1) / 10);
export const TIER_NAME = ['手ほどき', '寡兵', '地の利', '一門', '無傷',
                          '疾さ', '役目', '位', '奇策', '天守'];
/* 櫓の主は 五階ごと（2026-10-01 改）。十階ごとは「大櫓」で、称号も渡す */
export const isBoss = f => f % 5 === 0;
export const isGreat = f => f % 10 === 0;
export const isGate = f => false;      // 旧い呼び名。いまは使わない

/* ---------------- 編成の段 ----------------
   出す前に弾けるしばりだけを見る。ng は「何が足りないか」の言葉の並び。
   team は grownFor を通す前の素の武将の並び（no / attr / rarity / clan / gender / role / range / cost）*/
export function twTeam(f, team, form, pos) {
  const t = towerOf(f);
  if (!t) return [];
  const ng = [];
  const uniq = k => [...new Set(team.map(k))];
  for (const c of t.cond) {
    switch (c.k) {
      case 'units':
        if (team.length > c.max) ng.push(`${c.max}人までで出る`);
        break;
      case 'cost': {
        const s = team.reduce((a, x) => a + (x.cost || 0), 0);
        if (s > c.max) ng.push(`出陣コストの合計を ${c.max} 以下に`);
        break;
      }
      case 'each':
        if (team.some(x => (x.cost || 0) > c.cost)) ng.push(`出陣コスト ${c.cost} 以下の武将だけ`);
        break;
      case 'attr':
        if (c.v && team.some(x => x.attr !== c.v)) ng.push(`${c.v}だけで出る`);
        if (c.allDiff && uniq(x => x.attr).length < team.length) ng.push('属性をすべてちがえる');
        break;
      case 'rarity':
        if (c.v && team.some(x => x.rarity !== c.v)) ng.push(`位は ${c.v} だけ`);
        if (c.max && team.some(x => twRk(x.rarity) > twRk(c.max))) ng.push(`位は ${c.max} 以下だけ`);
        if (c.min && team.some(x => twRk(x.rarity) < twRk(c.min))) ng.push(`位は ${c.min} 以上だけ`);
        if (c.allDiff && uniq(x => x.rarity).length < team.length) ng.push('位をすべてちがえる');
        break;
      case 'clan':
        if (c.v && team.some(x => x.clan !== c.v)) ng.push(`${c.v}だけで出る`);
        if (c.none && team.some(x => x.clan)) ng.push('所属のない武将だけ');
        if (c.allDiff && uniq(x => x.clan || '浪人').length < team.length) ng.push('所属をすべてちがえる');
        break;
      case 'gender':
        if (team.some(x => x.gender !== c.v)) ng.push(`${c.v === '女' ? '女武将' : '男武将'}だけで出る`);
        break;
      case 'range':
        if (c.v != null && team.some(x => (x.range || 1) !== c.v)) ng.push(`射程 ${c.v} の武将だけ`);
        if (c.min != null && team.some(x => (x.range || 1) < c.min)) ng.push(`射程 ${c.min} 以上だけ`);
        if (c.hasV != null && !team.some(x => (x.range || 1) === c.hasV)) ng.push(`射程 ${c.hasV} を入れる`);
        break;
      case 'role': {
        const has = (x, w) => String(x.role || '').includes(w);
        if (c.hasAny && team.some(x => !c.hasAny.some(w => has(x, w))))
          ng.push(`${c.hasAny.join('・')}の役だけ`);
        else if (c.has && c.min == null && team.some(x => !has(x, c.has))) ng.push(`「${c.has}」の役だけ`);
        if (c.has && c.min != null && team.filter(x => has(x, c.has)).length < c.min)
          ng.push(`「${c.has}」の役を ${c.min}人`);
        if (c.not && team.some(x => has(x, c.not))) ng.push(`「${c.not}」の役は入れない`);
        if (c.allDiff && uniq(x => x.role).length < team.length) ng.push('役目をすべてちがえる');
        if (c.one && c.rest) {
          const a = team.filter(x => has(x, c.one)).length;
          const b = team.filter(x => has(x, c.rest)).length;
          if (!(a === 1 && b === team.length - 1)) ng.push(`${c.one}ひとり・残りは${c.rest}`);
        }
        break;
      }
      case 'form':
        if (form !== c.v) ng.push(`陣形は「${c.v}」`);
        break;
      case 'useNo':
        if (!team.some(x => x.no === c.v)) ng.push('その武将を入れる');
        break;
      /* 総大将の置き場（2026-10-02）。
         前は戦い終わりにしか見ていなかったので、置き場をまちがえたまま
         出陣でき、兵糧10と戦の時を捨てることになっていた。
         pos ＝ { gen, min, max }（陣形の枠の深さ。0 が前線側）を
         呼ぶ側が渡してきたときだけ、ここで弾く。
         渡ってこない呼び方（古い呼び出し）では、これまでどおり戦いぶりの段で見る */
      case 'genPos':
        if (pos && pos.gen != null) {
          const want = c.v === '前' ? pos.min : pos.max;
          if (pos.gen !== want) ng.push(`総大将を${c.v}列に置く`);
        }
        break;
      default: break;   // 戦いぶりの段で見る
    }
  }
  return [...new Set(ng)];
}

/* ---------------- 戦いぶりの段 ----------------
   res は runBattle の返り。secPerTurn は rules.time.secPerTurn。
   勝っていることは呼ぶ側で確かめてある前提 */
export function twResult(f, res, secPerTurn) {
  const t = towerOf(f);
  if (!t) return [];
  const ng = [];
  const ia = res.initial.filter(u => u.side === 'A');
  const ib = res.initial.filter(u => u.side === 'B');
  const ua = res.units.filter(u => u.side === 'A');
  const gen = ua.find(u => u.isGeneral) || ua[0];
  const log = res.log || [];
  const idA = new Set(ia.map(u => u.id));
  const turns = Math.ceil((res.durationSec || 0) / (secPerTurn || 2));
  for (const c of t.cond) {
    switch (c.k) {
      case 'turns':
        if (turns > c.max) ng.push(`${c.max}ターン以内に決める（かかったのは ${turns}）`);
        break;
      case 'noDeath':
        if (ua.some(u => !u.alive)) ng.push('一人も倒されずに勝つ');
        break;
      case 'hpLeft': {
        const hp = ua.reduce((a, u) => a + u.hp, 0), mx = ua.reduce((a, u) => a + u.maxHp, 0);
        const p = mx ? hp / mx * 100 : 0;
        if (p + 0.01 < c.pct) ng.push(`兵量を ${c.pct}% 以上残す（残ったのは ${Math.floor(p)}%）`);
        break;
      }
      case 'noUlt':
        if (log.some(e => e.type === 'ult' && idA.has(e.src))) ng.push('奥義を使わずに勝つ');
        break;
      case 'ult': {
        const n = log.filter(e => e.type === 'ult' && idA.has(e.src)).length;
        if (n < c.min) ng.push(`奥義を ${c.min}度以上（撃ったのは ${n}度）`);
        break;
      }
      case 'noCover':
        if (log.some(e => e.type === 'cover' && idA.has(e.src))) ng.push('かばわずに勝つ');
        break;
      case 'counter': {
        const n = log.filter(e => e.type === 'counter' && idA.has(e.src)).length;
        if (n < c.min) ng.push(`反撃を ${c.min}度以上（返したのは ${n}度）`);
        break;
      }
      case 'crit': {
        const n = ua.reduce((a, u) => a + (u.crits || 0), 0);
        if (n < c.min) ng.push(`会心を ${c.min}度以上（出たのは ${n}度）`);
        break;
      }
      case 'status': {
        const kinds = new Set(log.filter(e => e.type === 'status' && idA.has(e.src)).map(e => e.name));
        if (kinds.size < c.min) ng.push(`状態異常を ${c.min}種類以上（与えたのは ${kinds.size}種）`);
        break;
      }
      /* 籠城（2026-10-01）。勝ちかどうかは engine の holdWin が決めている。
         ここでは「本当にそのターンまで戦い続けたか」だけを見る。
         早く倒しきって勝ったときも、守り切ったことに変わりはないので通す */
      case 'hold':
        if (turns < c.turns && res.units.some(u => u.side === 'B' && u.alive))
          ng.push(`${c.turns}ターン持ちこたえる（もったのは ${turns}）`);
        break;
      case 'genSafe':
        if (gen && gen.hp < gen.maxHp) ng.push('総大将が傷を負わずに勝つ');
        break;
      case 'genOnly': {
        const others = ua.filter(u => !u.isGeneral).reduce((a, u) => a + (u.kills || 0), 0);
        if (others > 0) ng.push('総大将だけで倒しきる');
        break;
      }
      case 'foeGenFirst': {
        const foeGen = ib.find(u => u.isGeneral);
        const firstKo = log.find(e => e.type === 'ko' && !idA.has(e.tgt));
        if (!foeGen || !firstKo || firstKo.tgt !== foeGen.id) ng.push('敵の総大将をいちばん先に倒す');
        break;
      }
      /* 総大将の置き場は、盤の上でどれだけ敵に近いかで見る（2026-10-01）。
         陣形の枠の番号は戦のあとに残らないので、初めの座標から測るほうが確か */
      case 'genPos': {
        if (!gen || !ib.length) break;
        const g0 = ia.find(u => u.isGeneral) || ia[0];
        const by = ib.reduce((a, u) => a + u.y, 0) / ib.length;
        const d = u => Math.abs(u.y - by);
        const ds = ia.map(d);
        const want = c.v === '前' ? Math.min(...ds) : Math.max(...ds);
        if (Math.abs(d(g0) - want) > 0.001) ng.push(`総大将を${c.v}列に置く`);
        break;
      }
      default: break;   // 編成の段で見た
    }
  }
  return [...new Set(ng)];
}
