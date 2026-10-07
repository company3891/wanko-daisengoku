/* ================= お役目（ミッション）2026-09-24 =================

   ここに1行足すだけで画面に出る。id は二度と変えないこと
   （受け取り済みを id で覚えているので、変えるともう一度配ってしまう）。

   tab   … '門出' / '日課' / '週課' / '祭' / '累計褒美'
   key   … 何を数えるか。miBump(key) が呼ばれるたびに増える
   goal  … いくつで達成か
   text  … 画面に出す一文。犬の声で書く
   rw    … 褒美 { koban, stone, soul, stamina, ticket, items:{名:数}, title:'称号' }

   **同じ key を四つのタグが同時に見る。** だから一度の出陣で
   日課も週課も催しも功名も進み、褒美はそれぞれ別にもらえる。

   ── 数えているもの（2026-10-02 に増やした）──
   battle 出陣   win  勝ち     camp 全国     ev   催しに挑む  evOk 催しに勝つ
   evMat  催しで覚醒の品      spar 友と競う  duelWin 一騎打ちに勝つ
   rkWin  番付で勝つ          tower 塔に挑む  twOk 塔を抜ける
   vWin   V字の陣で勝つ       autoWin おまかせで勝つ          skip 早送り
   lv     武将を強くする      maxLv 極みまで  awake 覚醒     soulUp 魂を振る
   up/upOk 特技強化（挑む/成す）  inh/inhOk 特技継承（挑む/成す）
   gacha  くじを引く          buy 蔵で買う   deal 振り売りで買う  item 道具を使う
   mkList 取引所に出す        mkBuy 取引所で買う              fire 解雇する
   koban  集めた小判の合計    login 城に戻った日              duty 褒美を受け取る
   taken  制した国            chap 平定した章 */

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

  /* ---- 日課（2026-10-02 に十に組み直した）----
     どれも「一日のうちに ひとまわり触れる」ところを一つずつ。
     出陣・買い物・育てる・引く・競う が端から端まで並ぶように選んである。

     2026-10-07（悠さんの指図）：石が少なすぎたので **十こで合わせて 300** に振り直した。
     重いお役目ほど多く、軽いものは少なく。小判や品はそのまま据え置き。
     合わせて 300 ＝ 20+30+20+30+30+40+30+20+50+30。
     **数を動かすときは、合わせて 300 になるか必ず数え直すこと** */
  { id: 'd_camp',  tab: '日課', key: 'camp',  goal: 1, text: '全国に一度 出陣するワン！',       rw: { stone: 30 } },
  { id: 'd_buy',   tab: '日課', key: 'buy',   goal: 1, text: '蔵で買い物をするワン！',          rw: { koban: 150, stone: 20 } },
  { id: 'd_lv',    tab: '日課', key: 'lv',    goal: 1, text: '武将を一度 強くするワン！',       rw: { koban: 200, stone: 30 } },
  { id: 'd_gacha', tab: '日課', key: 'gacha', goal: 1, text: 'わんこみくじを引くワン！',        rw: { koban: 200, stone: 30 } },
  { id: 'd_login', tab: '日課', key: 'login', goal: 1, text: '城に戻るワン！',                  rw: { koban: 100, stone: 20 } },
  { id: 'd_evOk',  tab: '日課', key: 'evOk',  goal: 1, text: '催しに一度 勝つワン！',           rw: { stone: 40 } },
  { id: 'd_spar',  tab: '日課', key: 'spar',  goal: 1, text: '友と一度 競うワン！',             rw: { koban: 200, stone: 30 } },
  { id: 'd_item',  tab: '日課', key: 'item',  goal: 1, text: '道具を一度 使うワン！',           rw: { koban: 150, stone: 20 } },
  { id: 'd_batt3', tab: '日課', key: 'battle', goal: 3, text: '三度 出陣するワン！',            rw: { stone: 50 } },
  { id: 'd_duty',  tab: '日課', key: 'duty',  goal: 1, text: 'お役目の褒美を一度 受け取るワン！', rw: { koban: 100, stone: 30 } },

  /* ---- 週課（2026-10-02 に十に組み直した）----
     日課より重く、育てるほうへ寄せた。一週かけて ゆっくり埋まる重さにしてある。

     2026-10-07（悠さんの指図）：石を **十こで合わせて 1000** に振り直した。
     合わせて 1000 ＝ 100+100+120+80+120+100+100+80+120+80。
     **数を動かすときは、合わせて 1000 になるか必ず数え直すこと**

     日課300×7 ＋ 週課1000 ＝ 一週で 3100。十連がちょうど一度ぶん回る勘定 */
  { id: 'w_up',    tab: '週課', key: 'up',      goal: 1,     text: '特技の強化に一度 挑むワン！',       rw: { koban: 1500, stone: 100 } },
  { id: 'w_inh',   tab: '週課', key: 'inh',     goal: 1,     text: '特技の継承に一度 挑むワン！',       rw: { koban: 1500, stone: 100 } },
  { id: 'w_awake', tab: '週課', key: 'awake',   goal: 1,     text: '武将を一体 覚醒させるワン！',       rw: { stone: 120 } },
  { id: 'w_soul',  tab: '週課', key: 'soulUp',  goal: 1,     text: '武士の魂を振って 武将を強くするワン！', rw: { items: { '稽古の書': 3 }, stone: 80 } },
  { id: 'w_auto',  tab: '週課', key: 'autoWin', goal: 10,    text: 'おまかせで十度 勝つワン！',         rw: { stone: 120 } },
  { id: 'w_spar',  tab: '週課', key: 'spar',    goal: 10,    text: '友と十度 競うワン！',               rw: { soul: 150, stone: 100 } },
  { id: 'w_koban', tab: '週課', key: 'koban',   goal: 10000, text: '小判を合わせて一万 集めるワン！',   rw: { stone: 100 } },
  { id: 'w_login', tab: '週課', key: 'login',   goal: 3,     text: '三日 城に戻るワン！',               rw: { stone: 80 } },
  { id: 'w_rk',    tab: '週課', key: 'rkWin',   goal: 5,     text: '番付で五度 勝つワン！',             rw: { stone: 120 } },
  { id: 'w_evMat', tab: '週課', key: 'evMat',   goal: 1,     text: '催しで覚醒の品を手に入れるワン！',  rw: { koban: 2000, stone: 80 } },

  /* ---- 祭（2026-10-02 に十に組み直した）----
     週で入れ替わる。褒美は祭の札 一枚ずつ、ぜんぶで十枚。
     「ふだん通らない道」をひととおり踏ませる並びにしてある */
  { id: 'e_duel',   tab: '祭', key: 'duelWin', goal: 1, text: '友との一騎打ちに勝つワン！',     rw: { ticket: 1 } },
  { id: 'e_mkList', tab: '祭', key: 'mkList',  goal: 1, text: '取引所に一体 出すワン！',        rw: { ticket: 1 } },
  { id: 'e_tower',  tab: '祭', key: 'tower',   goal: 1, text: '試練の塔に一度 挑むワン！',      rw: { ticket: 1 } },
  { id: 'e_vwin',   tab: '祭', key: 'vWin',    goal: 1, text: 'Ｖ字の陣で勝つワン！',           rw: { ticket: 1 } },
  { id: 'e_rk3',    tab: '祭', key: 'rkWin',   goal: 3, text: '番付で三度 勝つワン！',          rw: { ticket: 1 } },
  { id: 'e_lv',     tab: '祭', key: 'lv',      goal: 1, text: '武将を一度 強くするワン！',      rw: { ticket: 1 } },
  { id: 'e_up',     tab: '祭', key: 'up',      goal: 1, text: '特技の強化に一度 挑むワン！',    rw: { ticket: 1 } },
  { id: 'e_inh',    tab: '祭', key: 'inh',     goal: 1, text: '特技の継承に一度 挑むワン！',    rw: { ticket: 1 } },
  { id: 'e_deal',   tab: '祭', key: 'deal',    goal: 1, text: '振り売りの品を買うワン！',       rw: { ticket: 1 } },
  { id: 'e_fire',   tab: '祭', key: 'fire',    goal: 1, text: '武将を一体 解雇するワン！',      rw: { ticket: 1 } },

  /* ================= 累計褒美（ずっと積む。称号はここで取る）=================
     2026-10-02 に百一まで増やした。
     日課・週課・祭でやることが そのまま長い坂になるよう、同じ key を伸ばしてある。
     **古い十二の id と goal は そのまま残した。**
     id を変えると受け取り済みが外れ、称号をもう一度配ってしまうため */

  /* ---- 出陣と勝ち ---- */
  { id: 't_batt10',   tab: '累計褒美', key: 'battle', goal: 10,   text: '合わせて十度 戦うワン！',       rw: { koban: 500 } },
  { id: 't_batt100',  tab: '累計褒美', key: 'battle', goal: 100,  text: '合わせて百度 戦うワン！',       rw: { title: '百戦錬磨' } },
  { id: 't_batt500',  tab: '累計褒美', key: 'battle', goal: 500,  text: '合わせて五百度 戦うワン！',     rw: { stone: 300 } },
  { id: 't_batt1000', tab: '累計褒美', key: 'battle', goal: 1000, text: '合わせて千度 戦うワン！',       rw: { title: '軍神' } },
  { id: 't_batt3000', tab: '累計褒美', key: 'battle', goal: 3000, text: '合わせて三千度 戦うワン！',     rw: { stone: 1000 } },
  { id: 't_win10',    tab: '累計褒美', key: 'win',    goal: 10,   text: '十度 勝ち名乗りを上げるワン！', rw: { koban: 800 } },
  { id: 't_win100',   tab: '累計褒美', key: 'win',    goal: 100,  text: '百度 勝ち名乗りを上げるワン！', rw: { stone: 150 } },
  { id: 't_win500',   tab: '累計褒美', key: 'win',    goal: 500,  text: '五百度 勝ち名乗りを上げるワン！', rw: { stone: 400 } },
  { id: 't_win1000',  tab: '累計褒美', key: 'win',    goal: 1000, text: '千度 勝ち名乗りを上げるワン！', rw: { soul: 1000 } },
  { id: 't_auto10',   tab: '累計褒美', key: 'autoWin', goal: 10,  text: 'おまかせで十度 勝つワン！',     rw: { koban: 600 } },
  { id: 't_auto100',  tab: '累計褒美', key: 'autoWin', goal: 100, text: 'おまかせで百度 勝つワン！',     rw: { stone: 200 } },
  { id: 't_auto500',  tab: '累計褒美', key: 'autoWin', goal: 500, text: 'おまかせで五百度 勝つワン！',   rw: { title: '腕まかせ' } },
  { id: 't_skip20',   tab: '累計褒美', key: 'skip',   goal: 20,   text: '早送りで二十度 決着をつけるワン！', rw: { koban: 1000 } },
  { id: 't_skip100',  tab: '累計褒美', key: 'skip',   goal: 100,  text: '早送りで百度 決着をつけるワン！',   rw: { stone: 200 } },
  { id: 't_vwin1',    tab: '累計褒美', key: 'vWin',   goal: 1,    text: 'Ｖ字の陣で勝つワン！',           rw: { koban: 400 } },
  { id: 't_vwin20',   tab: '累計褒美', key: 'vWin',   goal: 20,   text: 'Ｖ字の陣で二十度 勝つワン！',    rw: { stone: 120 } },
  { id: 't_vwin100',  tab: '累計褒美', key: 'vWin',   goal: 100,  text: 'Ｖ字の陣で百度 勝つワン！',      rw: { soul: 500 } },

  /* ---- 全国 ---- */
  { id: 't_camp10',   tab: '累計褒美', key: 'camp',  goal: 10,   text: '全国に十度 出陣するワン！',      rw: { koban: 600 } },
  { id: 't_camp100',  tab: '累計褒美', key: 'camp',  goal: 100,  text: '全国に百度 出陣するワン！',      rw: { stone: 250 } },
  { id: 't_chap1',    tab: '累計褒美', key: 'chap',  goal: 1,    text: 'はじめの章を平定するワン！',     rw: { stone: 3000 } },
  { id: 't_chap3',    tab: '累計褒美', key: 'chap',  goal: 3,    text: '三つの章を平定するワン！',       rw: { stone: 500 } },
  { id: 't_chap8',    tab: '累計褒美', key: 'chap',  goal: 8,    text: '八つの章を平定するワン！',       rw: { stone: 1500 } },
  { id: 't_taken1',   tab: '累計褒美', key: 'taken', goal: 1,    text: 'はじめの国を制するワン！',       rw: { koban: 500 } },
  { id: 't_taken12',  tab: '累計褒美', key: 'taken', goal: 12,   text: '十二の国を制するワン！',         rw: { title: '国盗り' } },
  { id: 't_taken24',  tab: '累計褒美', key: 'taken', goal: 24,   text: '二十四の国を制するワン！',       rw: { stone: 600 } },
  { id: 't_taken36',  tab: '累計褒美', key: 'taken', goal: 36,   text: '三十六の国を制するワン！',       rw: { stone: 900 } },
  { id: 't_taken47',  tab: '累計褒美', key: 'taken', goal: 47,   text: '四十七の国すべてを制するワン！', rw: { title: '天下統一' } },

  /* ---- 育てる ---- */
  { id: 't_lv1',      tab: '累計褒美', key: 'lv',     goal: 1,   text: '武将を一度 強くするワン！',      rw: { koban: 300 } },
  { id: 't_lv50',     tab: '累計褒美', key: 'lv',     goal: 50,  text: '武将を五十度 強くするワン！',    rw: { items: { '大稽古の書': 3 } } },
  { id: 't_lv200',    tab: '累計褒美', key: 'lv',     goal: 200, text: '武将を二百度 強くするワン！',    rw: { items: { '皆伝の書': 2 } } },
  { id: 't_maxLv1',   tab: '累計褒美', key: 'maxLv',  goal: 1,   text: '武将を一体 極みまで育てるワン！', rw: { title: '目利き' } },
  { id: 't_maxLv10',  tab: '累計褒美', key: 'maxLv',  goal: 10,  text: '武将を十体 極みまで育てるワン！', rw: { stone: 500 } },
  { id: 't_awake1',   tab: '累計褒美', key: 'awake',  goal: 1,   text: '武将を一度 覚醒させるワン！',    rw: { soul: 100 } },
  { id: 't_awake10',  tab: '累計褒美', key: 'awake',  goal: 10,  text: '武将を十度 覚醒させるワン！',    rw: { stone: 200 } },
  { id: 't_awake50',  tab: '累計褒美', key: 'awake',  goal: 50,  text: '武将を五十度 覚醒させるワン！',  rw: { stone: 500 } },
  { id: 't_awake100', tab: '累計褒美', key: 'awake',  goal: 100, text: '武将を百度 覚醒させるワン！',    rw: { title: '鬼を宿す者' } },
  { id: 't_soul1',    tab: '累計褒美', key: 'soulUp', goal: 1,   text: '武士の魂を一度 振るワン！',      rw: { koban: 400 } },
  { id: 't_soul100',  tab: '累計褒美', key: 'soulUp', goal: 100, text: '武士の魂を百度 振るワン！',      rw: { soul: 800 } },

  /* ---- 特技 ---- */
  { id: 't_up1',      tab: '累計褒美', key: 'up',    goal: 1,   text: '特技の強化に一度 挑むワン！',    rw: { koban: 300 } },
  { id: 't_up100',    tab: '累計褒美', key: 'up',    goal: 100, text: '特技の強化に百度 挑むワン！',    rw: { title: '鍛冶狂い' } },
  { id: 't_up300',    tab: '累計褒美', key: 'up',    goal: 300, text: '特技の強化に三百度 挑むワン！',  rw: { stone: 600 } },
  { id: 't_upOk1',    tab: '累計褒美', key: 'upOk',  goal: 1,   text: '特技の強化を一度 成すワン！',    rw: { koban: 300 } },
  { id: 't_upOk100',  tab: '累計褒美', key: 'upOk',  goal: 100, text: '特技の強化を百度 成すワン！',    rw: { stone: 400 } },
  { id: 't_inh1',     tab: '累計褒美', key: 'inh',   goal: 1,   text: '特技の継承に一度 挑むワン！',    rw: { koban: 300 } },
  { id: 't_inh100',   tab: '累計褒美', key: 'inh',   goal: 100, text: '特技の継承に百度 挑むワン！',    rw: { stone: 400 } },
  { id: 't_inhOk1',   tab: '累計褒美', key: 'inhOk', goal: 1,   text: '特技を一度 継がせるワン！',      rw: { stone: 3 } },
  { id: 't_inhOk50',  tab: '累計褒美', key: 'inhOk', goal: 50,  text: '特技を五十度 継がせるワン！',    rw: { title: '血を継ぐ者' } },

  /* ---- くじと買い物 ---- */
  { id: 't_gacha1',   tab: '累計褒美', key: 'gacha', goal: 1,   text: 'わんこみくじを引くワン！',        rw: { koban: 300 } },
  { id: 't_gacha50',  tab: '累計褒美', key: 'gacha', goal: 50,  text: 'わんこみくじを五十度 引くワン！', rw: { stone: 150 } },
  { id: 't_gacha200', tab: '累計褒美', key: 'gacha', goal: 200, text: 'わんこみくじを二百度 引くワン！', rw: { stone: 400 } },
  { id: 't_gacha500', tab: '累計褒美', key: 'gacha', goal: 500, text: 'わんこみくじを五百度 引くワン！', rw: { title: '運試し' } },
  { id: 't_buy1',     tab: '累計褒美', key: 'buy',   goal: 1,   text: '蔵で買い物をするワン！',          rw: { koban: 200 } },
  { id: 't_buy100',   tab: '累計褒美', key: 'buy',   goal: 100, text: '蔵で百度 買い物をするワン！',     rw: { stone: 200 } },
  { id: 't_deal1',    tab: '累計褒美', key: 'deal',  goal: 1,   text: '振り売りの品を買うワン！',        rw: { koban: 300 } },
  { id: 't_deal50',   tab: '累計褒美', key: 'deal',  goal: 50,  text: '振り売りの品を五十 買うワン！',   rw: { stone: 250 } },
  { id: 't_item1',    tab: '累計褒美', key: 'item',  goal: 1,   text: '道具を一度 使うワン！',           rw: { koban: 200 } },
  { id: 't_item30',   tab: '累計褒美', key: 'item',  goal: 30,  text: '道具を三十度 使うワン！',         rw: { koban: 2000 } },
  { id: 't_item100',  tab: '累計褒美', key: 'item',  goal: 100, text: '道具を百度 使うワン！',           rw: { stone: 250 } },
  { id: 't_koban1',   tab: '累計褒美', key: 'koban', goal: 10000,   text: '小判を一万 集めるワン！',     rw: { stone: 100 } },
  { id: 't_koban2',   tab: '累計褒美', key: 'koban', goal: 200000,  text: '小判を二十万 集めるワン！',   rw: { stone: 400 } },
  { id: 't_koban3',   tab: '累計褒美', key: 'koban', goal: 2000000, text: '小判を二百万 集めるワン！',   rw: { title: '蔵の主' } },

  /* ---- 取引所 ---- */
  { id: 't_mkl1',     tab: '累計褒美', key: 'mkList', goal: 1,  text: '取引所に一体 出すワン！',         rw: { koban: 500 } },
  { id: 't_mkl50',    tab: '累計褒美', key: 'mkList', goal: 50, text: '取引所に五十体 出すワン！',       rw: { title: '市の顔' } },
  { id: 't_mkb1',     tab: '累計褒美', key: 'mkBuy',  goal: 1,  text: '取引所で一体 召し抱えるワン！',   rw: { koban: 500 } },
  { id: 't_mkb50',    tab: '累計褒美', key: 'mkBuy',  goal: 50, text: '取引所で五十体 召し抱えるワン！', rw: { stone: 400 } },
  { id: 't_fire1',    tab: '累計褒美', key: 'fire',   goal: 1,  text: '武将を一体 解雇するワン！',       rw: { koban: 200 } },
  { id: 't_fire30',   tab: '累計褒美', key: 'fire',   goal: 30, text: '武将を三十体 解雇するワン！',     rw: { soul: 300 } },
  { id: 't_fire150',  tab: '累計褒美', key: 'fire',   goal: 150, text: '武将を百五十体 解雇するワン！',  rw: { soul: 1500 } },

  /* ---- 友と番付 ---- */
  { id: 't_spar1',    tab: '累計褒美', key: 'spar',    goal: 1,   text: '友と一度 競うワン！',           rw: { koban: 200 } },
  { id: 't_spar10',   tab: '累計褒美', key: 'spar',    goal: 10,  text: '友と十度 稽古するワン！',       rw: { title: '道場破り' } },
  { id: 't_spar100',  tab: '累計褒美', key: 'spar',    goal: 100, text: '友と百度 競うワン！',           rw: { stone: 300 } },
  { id: 't_duel1',    tab: '累計褒美', key: 'duelWin', goal: 1,   text: '一騎打ちに勝つワン！',          rw: { koban: 600 } },
  { id: 't_duel10',   tab: '累計褒美', key: 'duelWin', goal: 10,  text: '一騎打ちに十度 勝つワン！',     rw: { stone: 200 } },
  { id: 't_duel50',   tab: '累計褒美', key: 'duelWin', goal: 50,  text: '一騎打ちに五十度 勝つワン！',   rw: { title: '真っ向勝負' } },
  { id: 't_rk1',      tab: '累計褒美', key: 'rkWin',   goal: 1,   text: '番付で一度 勝つワン！',         rw: { koban: 400 } },
  { id: 't_rk20',     tab: '累計褒美', key: 'rkWin',   goal: 20,  text: '番付で二十度 勝つワン！',       rw: { stone: 250 } },
  { id: 't_rk100',    tab: '累計褒美', key: 'rkWin',   goal: 100, text: '番付で百度 勝つワン！',         rw: { stone: 700 } },

  /* ---- 催し ---- */
  { id: 't_ev1',      tab: '累計褒美', key: 'ev',    goal: 1,   text: '催しに一度 挑むワン！',          rw: { koban: 200 } },
  { id: 't_ev50',     tab: '累計褒美', key: 'ev',    goal: 50,  text: '催しに五十度 挑むワン！',        rw: { stone: 200 } },
  { id: 't_ev200',    tab: '累計褒美', key: 'ev',    goal: 200, text: '催しに二百度 挑むワン！',        rw: { stone: 500 } },
  { id: 't_evOk1',    tab: '累計褒美', key: 'evOk',  goal: 1,   text: '催しに一度 勝つワン！',          rw: { koban: 300 } },
  { id: 't_evOk30',   tab: '累計褒美', key: 'evOk',  goal: 30,  text: '催しに三十度 勝つワン！',        rw: { stone: 250 } },
  { id: 't_evOk150',  tab: '累計褒美', key: 'evOk',  goal: 150, text: '催しに百五十度 勝つワン！',      rw: { stone: 600 } },
  { id: 't_evMat1',   tab: '累計褒美', key: 'evMat', goal: 1,   text: '催しで覚醒の品を手に入れるワン！', rw: { koban: 500 } },
  { id: 't_evMat50',  tab: '累計褒美', key: 'evMat', goal: 50,  text: '催しで覚醒の品を五十 集めるワン！', rw: { stone: 400 } },

  /* ---- 試練の塔 ---- */
  { id: 't_tw1',      tab: '累計褒美', key: 'tower', goal: 1,   text: '試練の塔に一度 挑むワン！',      rw: { koban: 400 } },
  { id: 't_tw20',     tab: '累計褒美', key: 'tower', goal: 20,  text: '試練の塔に二十度 挑むワン！',    rw: { stone: 200 } },
  { id: 't_tw100',    tab: '累計褒美', key: 'tower', goal: 100, text: '試練の塔に百度 挑むワン！',      rw: { stone: 500 } },
  { id: 't_twOk1',    tab: '累計褒美', key: 'twOk',  goal: 1,   text: '塔の一階を抜けるワン！',         rw: { koban: 600 } },
  { id: 't_twOk10',   tab: '累計褒美', key: 'twOk',  goal: 10,  text: '塔を十階 のぼるワン！',          rw: { stone: 250 } },
  { id: 't_twOk30',   tab: '累計褒美', key: 'twOk',  goal: 30,  text: '塔を三十階 のぼるワン！',        rw: { stone: 500 } },
  { id: 't_twOk50',   tab: '累計褒美', key: 'twOk',  goal: 50,  text: '塔を五十階 のぼるワン！',        rw: { stone: 900 } },
  { id: 't_twOk100',  tab: '累計褒美', key: 'twOk',  goal: 100, text: '塔を百階 のぼりきるワン！',      rw: { stone: 3000 } },

  /* ---- 通いつめ ---- */
  { id: 't_login7',   tab: '累計褒美', key: 'login', goal: 7,   text: '七日 城に戻るワン！',            rw: { stone: 100 } },
  { id: 't_login30',  tab: '累計褒美', key: 'login', goal: 30,  text: '三十日 城に戻るワン！',          rw: { stone: 300 } },
  { id: 't_login100', tab: '累計褒美', key: 'login', goal: 100, text: '百日 城に戻るワン！',            rw: { stone: 800 } },
  { id: 't_login365', tab: '累計褒美', key: 'login', goal: 365, text: '三百六十五日 城に戻るワン！',    rw: { title: '不断の主' } },
  { id: 't_duty10',   tab: '累計褒美', key: 'duty',  goal: 10,  text: 'お役目の褒美を十度 受け取るワン！', rw: { koban: 800 } },
  { id: 't_duty100',  tab: '累計褒美', key: 'duty',  goal: 100, text: 'お役目の褒美を百度 受け取るワン！', rw: { stone: 400 } },
  { id: 't_duty500',  tab: '累計褒美', key: 'duty',  goal: 500, text: 'お役目の褒美を五百度 受け取るワン！', rw: { stone: 1200 } },
  { id: 't_batt5000', tab: '累計褒美', key: 'battle', goal: 5000, text: '合わせて五千度 戦うワン！',       rw: { title: '不惑の将' } },
];

export const miOf = id => MISSIONS.find(m => m.id === id) || null;
