/* ================= お祭り（イベント）2026-09-23 =================
   全国の道とは別に、毎日・毎週まわす小さな戦を置く。
   ・4つの級（初級・中級・上級・超級）があり、前の級を取ると次が開く
   ・一度取った級には「済」の印がつき、次からは早送り（スキップ）できる
   ・兵糧は級で決まる。10 / 30 / 50 / 100
   報酬はこのファイルだけで決まるので、調整はここを触ればよい。 */

import { P, savePlayer, ITEMS, addItem, badgeMat, freeMat, ATTRS, today, dayNow } from './player.js';

export const EV_RANKS = ['初級', '中級', '上級', '超級'];
export const EV_FOOD  = [10, 30, 50, 100];
/* お祭りの場所（2026-09-28）。級が上がるほど足場が難しくなるように並べた。
   前は場所を決めていなかったので、起動してすぐ挑むと障害物ゼロ、
   直前に全国や番付をやっていると、その盤面をそのまま引きずっていた。 */
export const EV_STAGE = ['草原', '河川', '山岳', '城郭'];
/* 敵の兵力（コストの目安）。超級は 1200（2026-09-26 に指定） */
export const EV_POWER = [420, 760, 1120, 1200];
/* ---- お祭りの敵の育ち（2026-09-26）----
   前は級を問わず素の値のままで、育てた部隊には手応えが無かった。
   級ごとに育ちを持たせる。**超級は Lv99・魂999・特技レベル3**（こちらの上限と同じ）。
   育ちの式はこちらと同じ（Lv1を100%として1レベル +2%） */
export const EV_LV    = [1, 40, 70, 99];
export const EV_SOUL  = [0, 200, 500, 999];
export const EV_SKILL = [1, 1, 2, 3];

/* ---- 曜日で替わる覚醒の具足 ----
   月〜金は属性ひとつ。土日は武将覚醒そのものが出ない（2026-09-29）ので、
   下の「全部」の枝は使われない（曜日の仕組みを変えたときの受け皿として残す）。
   ATTRS は ['猛将','智将','守将','仁将','神速'] */
export const AWAKE_DAY = [null, 0, 1, 2, 3, 4, null];   // 日,月,火,水,木,金,土
export const weekday = () => dayNow().getDay();        // 4時の変わり目で数える（2026-10-07）
export function awakeAttrsToday() {
  const i = AWAKE_DAY[weekday()];
  return i == null ? ATTRS.slice() : [ATTRS[i]];
}
/* その日に出るお祭りかどうか（2026-09-29）。
   武将覚醒は月〜金で、日ごとに出る軍配の属性が替わる。
   特技強化の場は土日だけ開く。週のあいだ集めた具足を、週末に技へ回す流れ */
export const isWeekend = () => { const d = weekday(); return d === 0 || d === 6; };
export function evShownToday(ev) {
  if (!ev) return false;
  if (ev.days === 'weekday') return !isWeekend();
  if (ev.days === 'weekend') return isWeekend();
  return true;
}

/* ---- ウィークリーの褒美（固定）----
   級が上がるほど上のレアリティ。毎週おなじ顔ぶれで、狙って取りに行ける */
export const WEEKLY_PICK = [
  { rarity: 'R',   no: 13 },   // 高坂マサボーダー
  { rarity: 'SR',  no: 18 },   // 片倉カゲシェルティ
  { rarity: 'SSR', no: 15 },   // 上杉ケンシン
  { rarity: 'UR',  no: 11 },   // 大友ソウプードル
];

/* ---- お祭りの一覧 ----
   題は「何が手に入るか」で呼ぶ（2026-09-29）。
   蔵入りの日→大判小判／武魂の日→武士の魂／稽古の日→武将強化の日／
   御前試合→武将獲得／具足くらべ→武将覚醒／兵法所→特技強化。
   id は保存に使っているので、そのまま置いてある
   kind: 'daily'（1日1回）／'weekly'（週1回）／'free'（兵糧のつづく限り）
   reward(rank) が、その級で配るものを返す */
export const EVENTS = [
  /* 並びは「何のために通うか」でまとめる（2026-10-03）。
     金 → 武将を育てる三つ（稽古・覚醒・特技）→ 魂 → 週にひと勝負。
     育てる三つのあいだに別の祭りが挟まると、どれが強化の場か読み取りにくかった。
     その日に出ない祭り（平日だけ・土日だけ）は screenEvent が並べない */
  {
    id: 'daily_koban', kind: 'free', name: '大判小判', mark: '判',
    note: '小判が出る。兵糧のつづく限り', icon: 'ev_koban',
    reward: r => ({ koban: [1500, 5000, 12000, 30000][r] }),
  },
  {
    id: 'daily_book', kind: 'free', name: '武将強化の日', mark: '強',
    note: '稽古の書が出る。兵糧のつづく限り', icon: 'ev_book',
    reward: r => ({ items: { 稽古の書: [5, 12, 25, 50][r] } }),
  },
  {
    /* repeat（2026-10-01）＝取ったあとも何度でも挑める。
       二度目からは、勝ちのふつうの褒美（石・小判・魂・稽古の書）は出さず、
       このお祭りの品だけを配る。覚醒の素材は数を積む品なので、
       兵糧のつづく限り通えるほうが育てやすい */
    id: 'awake', kind: 'daily', days: 'weekday', repeat: true, name: '武将覚醒', mark: '覚',
    note: '覚醒の具足が出る。日ごとに属性が替わる', icon: 'ev_awake',
    reward: r => {
      const at = awakeAttrsToday();
      const out = {};
      /* 軍配は属性ごと。級が上がるほど上の段が出る。
         無銘は数を積む品なので、どの級でもまとまって出す */
      const rank = [0, 0, 1, 2][r];
      const bn = [3, 6, 4, 2][r];
      for (const a of at) out[badgeMat(a, rank)] = bn;
      const tier = [0, 1, 1, 2][r];
      out[freeMat(tier)] = [10, 15, 20, 25][r];
      return { items: out };
    },
  },
  {
    id: 'train', kind: 'free', days: 'weekend', allRanks: true, name: '特技強化', mark: '技', 
    note: '護符が出る。土日のあいだ、どの級にも何度でも', icon: 'ev_train',
    /* 稽古の書は「稽古の日」と丸かぶりだったので、護符だけの場にした（2026-09-29）。
       兵法所＝強化と継承の当たりを上げる場、稽古の日＝素材を積む場、と役目を分ける */
    reward: r => ({ items: [
      { '上達の護符・小': 1 },
      { '相伝の護符・小': 1 },
      { '上達の護符・小': 1, '相伝の護符・小': 1 },
      { '上達の護符・中': 1 },
    ][r] }),
  },
  {
    id: 'daily_soul', kind: 'free', days: 'weekend', allRanks: true, name: '武士の魂', mark: '魂',
    note: '武士の魂が出る。土日のあいだ、どの級にも何度でも', icon: 'ev_soul',
    /* 2026-10-07：悠さんの指図で 15/45/100/240 → 10/30/50/100 に下げた */
    reward: r => ({ soul: [10, 30, 50, 100][r] }),
  },
  {
    /* once（2026-10-02）＝級をぜんぶ取ったら、一覧から消える。
       級ごとに決まった武将をひとり配る祭りなので、取り切ったら渡すものが無い */
    id: 'weekly', kind: 'weekly', once: true, name: '武将獲得', mark: '得',
    note: '週にひと勝負。勝てば武将がひとり増える', icon: 'ev_weekly',
    reward: r => ({ chars: [WEEKLY_PICK[r].no], stone: [100, 300, 700, 1500][r] }),
  },
];
export const evOf = id => EVENTS.find(e => e.id === id) || null;

/* ---- 進み具合 ----
   P.ev = { cleared:{ 'id:rank':true }, day, doneDay:{}, week, doneWeek:{} } */
export function evState() {
  if (!P.ev || typeof P.ev !== 'object') P.ev = {};
  const e = P.ev;
  if (!e.cleared) e.cleared = {};
  if (!e.doneDay) e.doneDay = {};
  if (!e.doneWeek) e.doneWeek = {};
  // 日付が変わったら「今日ぶん」を空にする
  const d = today();
  if (e.day !== d) { e.day = d; e.doneDay = {}; }
  const w = weekKey();
  if (e.week !== w) { e.week = w; e.doneWeek = {}; }
  return e;
}
/* 週の区切りは月曜はじまり。ISO 風に「年-W週」で持つ */
export function weekKey() {
  const n = dayNow();                                   // 4時の変わり目で数える（2026-10-07）
  const d = new Date(n.getFullYear(), n.getMonth(), n.getDate());
  const wd = (d.getDay() + 6) % 7;              // 月=0
  d.setDate(d.getDate() - wd);                   // その週の月曜
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const key = (id, r) => `${id}:${r}`;
export const evCleared = (id, r) => !!evState().cleared[key(id, r)];
/* その級に挑めるか。初級はいつでも、あとは前の級を取っていれば開く。
   土日の二つ（武士の魂・特技強化）は allRanks を立ててあり、
   はじめからどの級にも挑める（2026-09-29）。週末だけの祭りなので、
   順に開けていると二日で回りきれない */
export const evOpen = (id, r) => {
  const ev = evOf(id);
  if (ev && ev.allRanks) return true;
  return r === 0 || evCleared(id, r - 1);
};
/* そのお祭りは、取ったあとも挑めるか（2026-10-01） */
export const evRepeat = id => !!(evOf(id) || {}).repeat;
/* 今日（今週）もう取ったか */
export function evDone(id, r) {
  const ev = evOf(id); if (!ev) return true;
  const e = evState();
  if (ev.kind === 'daily') return !!e.doneDay[key(id, r)];
  if (ev.kind === 'weekly') return !!e.doneWeek[key(id, r)];
  return false;                                  // free は何度でも
}
/* 勝ったときに呼ぶ。褒美を配り、済の印をつける */
export function evWin(id, r) {
  const ev = evOf(id); if (!ev) return null;
  const e = evState();
  const rw = ev.reward(r) || {};
  if (rw.koban) P.koban += rw.koban;
  if (rw.soul)  P.soul  += rw.soul;
  if (rw.stone) P.free  += rw.stone;
  if (rw.items) for (const [k, n] of Object.entries(rw.items)) if (n > 0) addItem(k, n);
  const got = [];
  for (const no of (rw.chars || [])) {
    const had = P.own.includes(no);
    P.cnt[String(no)] = (P.cnt[String(no)] || (had ? 1 : 0)) + 1;
    if (!had) P.own.push(no);
    got.push({ no, dup: had });
  }
  e.cleared[key(id, r)] = true;
  if (ev.kind === 'daily')  e.doneDay[key(id, r)]  = true;
  if (ev.kind === 'weekly') e.doneWeek[key(id, r)] = true;
  savePlayer();
  return { ...rw, got };
}
/* 負けたときも「今日ぶん」は使ったことにするか → しない。
   兵糧は払っているので、勝つまで挑めるほうが気持ちがよい */
