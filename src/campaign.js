/* 全国ストーリーモード「天下統一の道」（2026-09-21）
   47都道府県を7つの章（地方）に分け、章ごとに平定していく。
   ・はじめに選んだ武将の本拠地から始まる（織田なら尾張＝愛知、島津なら薩摩＝鹿児島）
   ・章をひとつ平定すると、その東どなりと西どなりの章が開く＝「左右どちらへ攻めるか」
   ・大国は3戦（雑兵→侍大将→国主）、小国は1戦
   ・47県すべてを取ると天下統一
   データだけを置く。画面と進行は main.js / player.js が持つ。 */

/* 章。番号は付けない（2026-09-21）。
   はじめに選んだ武将によって攻める順番が変わるので、「第五章」のような番号は意味をなさない。
   label は題だけ。app/assets/ui/title_<name>.png を置くと、文字の代わりに絵が出る。 */
export const REGIONS = [
  { id: 'kyushu',  name: '九州',   label: '西海の狼煙' },
  { id: 'chugoku', name: '中国',   label: '山陽の覇' },
  { id: 'shikoku', name: '四国',   label: '海峡を越えて' },
  { id: 'kinki',   name: '近畿',   label: '上洛' },
  { id: 'chubu',   name: '中部',   label: '天下の分け目' },
  { id: 'kanto',   name: '関東',   label: '坂東の嵐' },
  { id: 'oshu',    name: '奥州',   label: 'みちのくの果て' },
];
// 章の並び（西 → 東）。となりの章としか行き来できない
export const REGION_ORDER = REGIONS.map(r => r.id);

/* 県。[id, 名前, 章, 戦数, 国主の番号(なければ0), ステージ, 巻, 巻の中のx%, 巻の中のy%, 家名]
   巻＝絵巻地図の何枚目か（1=西国 2=中央 3=東国）。x,y はその1枚の中での位置 */
const PREF_ROWS = [
  ['fukuoka', '福岡', 'kyushu', 3, 71, '城郭', 1, 33, 38, '立花家'],
  ['saga', '佐賀', 'kyushu', 1, 29, '草原', 1, 22, 40, '鍋島家'],
  ['nagasaki', '長崎', 'kyushu', 1, 32, '海', 1, 17, 46, '龍造寺家'],
  ['kumamoto', '熊本', 'kyushu', 1, 64, '城郭', 1, 27, 52, '加藤家'],
  ['oita', '大分', 'kyushu', 1, 11, '山岳', 1, 42, 42, '大友家'],
  ['miyazaki', '宮崎', 'kyushu', 1,  7, '草原', 1, 37, 60, '島津家'],
  ['kagoshima', '鹿児島', 'kyushu', 3, 62, '山岳', 1, 24, 66, '島津家'],
  ['okinawa', '沖縄', 'kyushu', 1,  0, '海', 1, 18, 88, '琉球王家'],
  ['yamaguchi', '山口', 'chugoku', 1, 10, '海', 1, 46, 30, '毛利家'],
  ['hiroshima', '広島', 'chugoku', 3, 50, '海', 1, 62, 26, '毛利家'],
  ['shimane', '島根', 'chugoku', 1, 33, '山岳', 1, 66, 19, '吉川家'],
  ['tottori', '鳥取', 'chugoku', 1,  0, '山岳', 1, 85, 16, '山名家'],
  ['okayama', '岡山', 'chugoku', 1, 27, '草原', 1, 80, 25, '宇喜多家'],
  ['ehime', '愛媛', 'shikoku', 1, 94, '海', 1, 55, 46, '長宗我部家'],
  ['kagawa', '香川', 'shikoku', 1, 83, '草原', 1, 72, 43, '十河家'],
  ['tokushima', '徳島', 'shikoku', 1, 82, '河川', 1, 78, 48, '三好家'],
  ['kochi', '高知', 'shikoku', 3, 74, '海', 1, 66, 53, '長宗我部家'],
  ['hyogo', '兵庫', 'kinki', 1, 81, '城郭', 2, 10, 56, '赤松家'],
  ['osaka', '大阪', 'kinki', 3, 30, '城郭', 2, 18, 60, '豊臣家'],
  ['kyoto', '京都', 'kinki', 3, 38, '城郭', 2, 24, 57, '明智家'],
  ['nara', '奈良', 'kinki', 1, 84, '山岳', 2, 27, 65, '筒井家'],
  ['wakayama', '和歌山', 'kinki', 1, 65, '海', 2, 18, 70, '本願寺'],
  ['shiga', '滋賀', 'kinki', 1, 47, '河川', 2, 34, 56, '浅井家'],
  ['mie', '三重', 'kinki', 1, 75, '海', 2, 40, 64, '藤堂家'],
  ['aichi', '愛知', 'chubu', 3,  1, '城郭', 2, 50, 60, '織田家'],
  ['gifu', '岐阜', 'chubu', 1, 85, '山岳', 2, 44, 48, '斎藤家'],
  ['shizuoka', '静岡', 'chubu', 1, 87, '海', 2, 74, 60, '今川家'],
  ['fukui', '福井', 'chubu', 1, 79, '海', 2, 28, 48, '朝倉家'],
  ['ishikawa', '石川', 'chubu', 1, 69, '海', 2, 34, 42, '前田家'],
  ['toyama', '富山', 'chubu', 1, 22, '山岳', 2, 40, 35, '佐々家'],
  ['nagano', '長野', 'chubu', 1,  3, '山岳', 2, 55, 38, '真田家'],
  ['yamanashi', '山梨', 'chubu', 3, 28, '山岳', 2, 66, 48, '武田家'],
  ['niigata', '新潟', 'chubu', 3, 15, '河川', 2, 52, 22, '上杉家'],
  ['kanagawa', '神奈川', 'kanto', 3,  2, '城郭', 3, 16, 76, '北条家'],
  ['tokyo', '東京', 'kanto', 1, 90, '草原', 3, 28, 72, '北条家'],
  ['saitama', '埼玉', 'kanto', 1, 91, '草原', 3, 22, 67, '北条家'],
  ['chiba', '千葉', 'kanto', 1, 93, '海', 3, 40, 75, '里見家'],
  ['gunma', '群馬', 'kanto', 1, 92, '山岳', 3, 16, 62, '長野家'],
  ['tochigi', '栃木', 'kanto', 1,  0, '草原', 3, 30, 60, '宇都宮家'],
  ['ibaraki', '茨城', 'kanto', 1,  0, '河川', 3, 44, 66, '佐竹家'],
  ['fukushima', '福島', 'oshu', 1, 24, '山岳', 3, 44, 58, '蒲生家'],
  ['yamagata', '山形', 'oshu', 1, 66, '河川', 3, 38, 50, '最上家'],
  ['miyagi', '宮城', 'oshu', 3,  6, '海', 3, 54, 48, '伊達家'],
  ['iwate', '岩手', 'oshu', 1, 18, '山岳', 3, 52, 38, '南部家'],
  ['akita', '秋田', 'oshu', 1,  0, '海', 3, 36, 38, '安東家'],
  ['aomori', '青森', 'oshu', 1,  0, '海', 3, 47, 27, '津軽家'],
  ['hokkaido', '北海道', 'oshu', 3,  0, '山岳', 3, 75, 13, '蠣崎家'],
];

export const PREFS = PREF_ROWS.map(([id, name, region, battles, lord, stage, vol, x, y, house]) =>
  ({ id, name, region, battles, lord, stage, vol, x, y, house }));
// 3枚を横に並べた「全体」での位置（%）
export const mapX = p => (p.vol - 1) * (100 / 3) + p.x / 3;
export const mapY = p => p.y;
export const PREF = Object.fromEntries(PREFS.map(p => [p.id, p]));
export const prefsOf = region => PREFS.filter(p => p.region === region);

/* 勢力 → 本拠地。はじめに選んだ武将の国から物語が始まる */
const HOME_BY_CLAN = {
  '織田軍': 'aichi', '織田家': 'aichi', '徳川軍': 'aichi', '徳川家': 'aichi', '榊原': 'aichi',
  '上杉軍': 'niigata', '上杉家': 'niigata',
  '武田軍': 'yamanashi', '武田家': 'yamanashi',
  '北条家': 'kanagawa', '伊達家': 'miyagi', '最上軍': 'yamagata', '蒲生家': 'fukushima',
  '島津軍': 'kagoshima', '島津家': 'kagoshima',
  '立花軍': 'fukuoka', '立花家': 'fukuoka', '黒田家': 'fukuoka',
  '龍造寺家': 'saga', '鍋島家': 'saga', '大友家': 'oita',
  '毛利軍': 'hiroshima', '毛利家': 'hiroshima', '小早川軍': 'hiroshima',
  '宇喜多家': 'okayama', '長宗我部': 'kochi', '長宗我部家': 'kochi', '三好家': 'tokushima',
  '明智軍': 'kyoto', '細川家': 'kyoto', '筒井家': 'nara', '松永家': 'nara',
  '豊臣家': 'osaka', '豊臣': 'osaka', '本願寺': 'osaka',
  '西軍': 'shiga', '京極家': 'shiga', '江': 'shiga', '藤堂軍': 'mie',
  '斎藤家': 'gifu', '今川家': 'shizuoka', '井伊軍': 'shizuoka',
  '真田軍': 'nagano', '真田家': 'nagano', '前田家': 'ishikawa',
  '朝倉家': 'fukui', '大谷家': 'fukui',
};
// 勢力の無い武将は、番号で決め打ちする
const HOME_BY_NO = { 30: 'osaka', 31: 'gifu', 47: 'shiga', 64: 'kumamoto', 67: 'niigata', 68: 'kyoto', 78: 'osaka' };

export function homePrefOf(c) {
  if (!c) return 'aichi';
  return HOME_BY_NO[c.no] || HOME_BY_CLAN[c.clan] || 'aichi';
}

/* ---------------- 物語 ---------------- */

/* 全国をはじめて開いたときの序（2026-09-24 に言い回しを犬寄りへ）。
   地の文は戦国のまま、最後の一行だけ犬の声にして、世界に犬がいると分からせる */
export const INTRO = [
  '天下は乱れ、犬たちが旗を掲げた。',
  '四十七の国に、それぞれの主あり。',
  'その全てを従えし者のみが、天下人と呼ばれるわん。',
];

/* 大国の国主との掛け合い。before は出陣の前、after は勝ったあと */
export const LORD_TALK = {
  fukuoka:   { before: '筑前の空は、我が一族の旗で足りておる。',
               after:  '見事。……この旗、そなたに預けよう。' },
  kagoshima: { before: '薩摩の犬は、退かぬ。一歩もな。',
               after:  '退かぬと申したが……今日だけは退いてやる。' },
  hiroshima: { before: '三本の矢は、束ねれば折れぬ。',
               after:  '束ねた矢を、そなたが持て。折らずにな。' },
  kochi:     { before: '四国は一つ。おぬしが二つ目を作るか。',
               after:  '海は広い。次は共に渡ろうぞ。' },
  osaka:     { before: 'この城、金で建てたのよ。落とせるかの。',
               after:  '派手に負けたわい。……惚れたぞ。' },
  kyoto:     { before: '都は誰のものでもない。……本当に、そう思うか。',
               after:  '敵は、いつも己の内にある。忘れるな。' },
  aichi:     { before: '是非に及ばず。かかってまいれ。',
               after:  '天下布ワン。……次は、そなたの番だ。' },
  yamanashi: { before: '風林火山。動かざること山の如し。',
               after:  '山とて、いつかは崩れるものよ。' },
  niigata:   { before: '義なき戦に、毘の旗は宿らぬ。',
               after:  'よい義であった。旗を持ってゆけ。' },
  kanagawa:  { before: '小田原は落ちぬ。籠もっておれば勝つ。',
               after:  '籠城ばかりでは、犬も腐るな。' },
  miyagi:    { before: '奥州の風は冷たいぞ。震えるなよ。',
               after:  '冷たい風にも、慣れるものだな。' },
  hokkaido:  { before: 'ここが日ノ本の果て。これより先に国は無い。',
               after:  '果てまで来たか。天下は、そなたのものだ。' },
};

/* 国主のいない国は野伏せり。名前だけ作る */
export const NO_LORD_NAME = {
  okinawa: '琉球の海衆', tottori: '因幡の野伏せり', tochigi: '下野の土豪',
  ibaraki: '常陸の川衆', akita: '出羽の山衆', aomori: '津軽の荒武者',
  hokkaido: '蝦夷の名無し将',
};

/* 1戦の呼び名（大国は3段） */
export const STEP_NAME = ['先陣', '本陣', '国主'];

/* ---- 章の順（2026-09-26）----
   難しさと兵糧は「地図の東西（REGION_ORDER）」ではなく
   **はじめの国からいくつ目の章か** で決める。
   本拠地が中部（織田＝愛知）の人は中部が1章目、近畿と関東が2章目…となる。
   東西の並びで決めていたら、愛知で始めた人がいきなり5章目の強さと当たっていた。
   となりの章としか行き来できないので、はじめの国からの隔たりが そのまま進み具合になる。
   同じ隔たりなら西を先に数える（どちらから攻めても順番が入れ替わらないように）。 */
export function chapterRank(region, startRegion) {
  const si = REGION_ORDER.indexOf(startRegion);
  if (si < 0) return Math.max(0, REGION_ORDER.indexOf(region));
  const sorted = REGION_ORDER
    .map((r, i) => ({ r, i, d: Math.abs(i - si) }))
    .sort((a, b) => a.d - b.d || a.i - b.i);
  const k = sorted.findIndex(x => x.r === region);
  return k < 0 ? 0 : k;
}

/* ---- 出陣に要る兵糧（2026-09-26）----
   前は どの国でも 3 の据え置きだった。章が進むほど重くする。
   国主との一戦だけ、さらに +1（最後の一戦は重い）。いちばん重くて 10。 */
export const FOOD_BY_RANK = [3, 4, 5, 6, 7, 8, 9];
export const FOOD_COST = 3;                 // いちばん軽いとき（据え置きの名残・表示の既定値）
export function foodCost(rank, last, lord) {
  const base = FOOD_BY_RANK[Math.max(0, Math.min(6, rank | 0))] || 3;
  return Math.min(10, base + (last && lord ? 1 : 0));
}

/* 大国（3戦）は段どりでステージが変わる（2026-09-21）。
   国境の野で戦い、峠や川を越え、最後にその国の主城・本陣へ挑む。
   [先陣, 本陣] の順。最後の一戦は上の表の stage（その国の顔）を使う。 */
const PRE_STAGE = {
  fukuoka:   ['海', '草原'],
  kagoshima: ['海', '草原'],
  hiroshima: ['草原', '山岳'],
  kochi:     ['山岳', '草原'],
  osaka:     ['河川', '草原'],
  kyoto:     ['山岳', '河川'],
  aichi:     ['草原', '河川'],
  yamanashi: ['草原', '河川'],
  niigata:   ['海', '草原'],
  kanagawa:  ['海', '山岳'],
  miyagi:    ['草原', '山岳'],
  hokkaido:  ['海', '草原'],
};
export function stageOf(pref, step) {
  if (!pref) return '草原';
  if (pref.battles <= 1 || step >= pref.battles - 1) return pref.stage;
  const pre = PRE_STAGE[pref.id] || ['草原', '山岳'];
  return pre[step] || pre[0];
}
