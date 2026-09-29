/* ================= お役目（ミッション）2026-09-24 =================

   ここに1行足すだけで画面に出る。id は二度と変えないこと
   （受け取り済みを id で覚えているので、変えるともう一度配ってしまう）。

   tab   … '門出' / '日課' / '週課' / '祭' / '累計褒美'
   key   … 何を数えるか。miBump(key) が呼ばれるたびに増える
   goal  … いくつで達成か
   text  … 画面に出す一文。犬の声で書く
   rw    … 褒美 { koban, stone, soul, stamina, ticket, items:{名:数}, title:'称号' }

   **同じ key を四つのタグが同時に見る。** だから一度の出陣で
   日課も週課も催しも功名も進み、褒美はそれぞれ別にもらえる。 */

export const MI_TABS = ['門出', '日課', '週課', '祭', '累計褒美'];

/* どのタグがどの数を見るか。
   日課は日付で、週課と祭は週で空に戻る。累計褒美はずっと積む */
export const MI_BOX = { 門出: 't', 日課: 'd', 週課: 'w', 祭: 'w', 累計褒美: 't' };

/* 門出（2026-09-26）＝はじめの一度きり。九つ全部を受け取ったらタグごと消える。
   褒美は「次の一手に要る品」を渡していく鎖にしてある。
   素材が無くて手が止まる、が起きないようにするため。 */
export const KADODE = '門出';

export const MISSIONS = [
  /* ---- 門出（初回だけ。全部受け取ると消える・2026-09-26）----
     上から順に、次にやることの素材を渡していく。
     鎖の最後で石3000。はじめに石を持たせるのをやめて、ここに寄せた */
  { id: 'f_team',  tab: '門出', key: 'team',  goal: 1, text: '部隊に武将を入れるワン！',   rw: { items: { '兵糧俵': 1 } } },
  { id: 'f_duty',  tab: '門出', key: 'duty',  goal: 1, text: 'お役目の褒美をもらうワン！', rw: { koban: 1000 } },
  { id: 'f_camp',  tab: '門出', key: 'camp',  goal: 1, text: '全国に出陣するワン！',       rw: { koban: 4000 } },
  { id: 'f_buy',   tab: '門出', key: 'buy',   goal: 1, text: '蔵で買い物をするワン！',     rw: { items: { '稽古の書': 10 } } },
  { id: 'f_lv',    tab: '門出', key: 'lv',    goal: 1, text: '武将を強くするワン！',       rw: { items: { '特技の伝書': 3 } } },
  { id: 'f_up',    tab: '門出', key: 'up',    goal: 1, text: '特技を強くするワン！',       rw: { items: { '相伝の護符・中': 1 } } },
  { id: 'f_inh',   tab: '門出', key: 'inh',   goal: 1, text: '特技を継がせるワン！',       rw: { ticket: 3 } },
  { id: 'f_evOk',  tab: '門出', key: 'evOk',  goal: 1, text: '催しに勝つワン！',           rw: { stone: 300 } },
  /* 上の八つが「済んだら」灯る。受け取りは待たない（まとめて頂戴で一度に取れる） */
  { id: 'f_all',   tab: '門出', key: 'kadode', goal: 8, text: '門出のお役目をぜんぶ果たすワン！', rw: { stone: 3000 } },

  /* ---- 日課 ---- */
  { id: 'd_login', tab: '日課', key: 'login', goal: 1,  text: '城に戻るワン！',              rw: { koban: 100 } },
  { id: 'd_camp',  tab: '日課', key: 'camp',  goal: 1,  text: '全国に一度 出陣するワン！',    rw: { stone: 1 } },
  { id: 'd_spar',  tab: '日課', key: 'spar',  goal: 1,  text: '友と一度 稽古するワン！',      rw: { koban: 200 } },
  { id: 'd_item',  tab: '日課', key: 'item',  goal: 1,  text: '道具を一度 使うワン！',        rw: { koban: 150 } },
  { id: 'd_gacha', tab: '日課', key: 'gacha', goal: 1,  text: 'わんこみくじを引くワン！',      rw: { koban: 200 } },

  /* ---- 週課 ---- */
  { id: 'w_skip',  tab: '週課', key: 'skip',  goal: 3,  text: '早送りで三度 決着をつけるワン！', rw: { koban: 500 } },
  { id: 'w_item',  tab: '週課', key: 'item',  goal: 3,  text: '道具を三度 使うワン！',         rw: { stone: 2 } },
  { id: 'w_camp',  tab: '週課', key: 'camp',  goal: 10, text: '全国に十度 出陣するワン！',      rw: { stone: 3 } },
  { id: 'w_up',    tab: '週課', key: 'up',    goal: 5,  text: '特技の強化に五度 挑むワン！',    rw: { items: { '稽古の書': 3 } } },
  { id: 'w_spar',  tab: '週課', key: 'spar',  goal: 5,  text: '友と五度 稽古するワン！',        rw: { soul: 1 } },

  /* ---- 祭 ---- */
  /* 祭は週で入れ替わる。褒美が違うので、日課や週課と中身がかぶってよい */
  { id: 'e_camp',  tab: '祭'  , key: 'camp',  goal: 1,  text: '全国に一度 出陣するワン！',      rw: { ticket: 1 } },
  { id: 'e_ev',    tab: '祭'  , key: 'ev',    goal: 3,  text: '催しに三度 挑むワン！',          rw: { ticket: 2 } },
  { id: 'e_spar',  tab: '祭'  , key: 'spar',  goal: 3,  text: '友と三度 稽古するワン！',        rw: { ticket: 1 } },

  /* ---- 累計褒美（ずっと積む。称号はここで取る）---- */
  { id: 't_batt10',  tab: '累計褒美', key: 'battle', goal: 10,   text: '合わせて十度 戦うワン！',      rw: { koban: 500 } },
  { id: 't_batt100', tab: '累計褒美', key: 'battle', goal: 100,  text: '合わせて百度 戦うワン！',      rw: { title: '百戦錬磨' } },
  { id: 't_batt1000',tab: '累計褒美', key: 'battle', goal: 1000, text: '合わせて千度 戦うワン！',      rw: { title: '軍神' } },
  { id: 't_upOk1',   tab: '累計褒美', key: 'upOk',   goal: 1,    text: '特技の強化を一度 成すワン！',  rw: { koban: 300 } },
  { id: 't_up100',   tab: '累計褒美', key: 'up',     goal: 100,  text: '特技の強化に百度 挑むワン！',  rw: { title: '鍛冶狂い' } },
  { id: 't_inhOk1',  tab: '累計褒美', key: 'inhOk',  goal: 1,    text: '特技を一度 継がせるワン！',    rw: { stone: 3 } },
  { id: 't_spar10',  tab: '累計褒美', key: 'spar',   goal: 10,   text: '友と十度 稽古するワン！',      rw: { title: '道場破り' } },
  { id: 't_maxLv1',  tab: '累計褒美', key: 'maxLv',  goal: 1,    text: '武将を一体 極みまで育てるワン！', rw: { title: '目利き' } },
  { id: 't_awake1',  tab: '累計褒美', key: 'awake',  goal: 1,    text: '武将を一度 覚醒させるワン！',  rw: { soul: 1 } },
  /* はじめの章を平定したら石3000（2026-09-25）。ここが序盤のいちばん大きな山 */
  { id: 't_chap1',   tab: '累計褒美', key: 'chap',   goal: 1,    text: 'はじめの章を平定するワン！',   rw: { stone: 3000 } },
  { id: 't_taken12', tab: '累計褒美', key: 'taken',  goal: 12,   text: '十二の国を制するワン！',       rw: { title: '国盗り' } },
  { id: 't_taken47', tab: '累計褒美', key: 'taken',  goal: 47,   text: '四十七の国すべてを制するワン！', rw: { title: '天下統一' } },
];

export const miOf = id => MISSIONS.find(m => m.id === id) || null;
