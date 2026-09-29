// わんこ大戦国 データ引き継ぎ（2026-09-25）
// 引き継ぎID（世界にひとつ）と パスワード。アカウント連携（LINE・Game Center・Play ゲーム）はサーバーができてから。
// ★この機能の文言だけは戦国口調を使わない。間違えると本当にデータが消えるため。
// ここには画面を持ち込まない（決めごとと、字の作り方だけ）。
// 設計の全体は claude/わんこ大戦国_アカウントとログインの設計_20260925.md にある。

/* 引き継ぎIDに使う字。読みまちがえる I O 0 1 は外してある（声に出して写せるように）。
   32字なので 8桁で 32^8 ＝ 約1.1兆とおり。端末で作ってもぶつからない */
export const LK_ALPHA = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
export const LK_HEAD = 'WAN';
export const LK_PASS_MIN = 8;

/* 引き継ぎIDを作る。WAN-7K2M-4QX9 の形。
   いまはサーバーが無いので端末で作る。サーバーができたら、
   このIDをそのまま account の鍵として受け取る（ぶつかったときだけ作り直す） */
export function lkMakeCode(rand) {
  const r = rand || (() => {
    /* 暗号用の乱数があればそれを使う。無い環境でも落ちないように Math.random に落とす */
    try {
      const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] / 4294967296;
    } catch { return Math.random(); }
  });
  let s = '';
  for (let i = 0; i < 8; i++) s += LK_ALPHA[Math.floor(r() * LK_ALPHA.length)];
  return `${LK_HEAD}-${s.slice(0, 4)}-${s.slice(4)}`;
}
export const LK_CODE_RE = /^WAN-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/;
export const lkCodeOk = c => LK_CODE_RE.test(String(c || '').toUpperCase().trim());
/* 打ち込みの助け。小文字を直し、まぎらわしい字を寄せ、区切りを入れ直す */
export function lkTidyCode(s) {
  let t = String(s || '').toUpperCase().replace(/[^0-9A-Z]/g, '')
    .replace(/^WAN/, '').replace(/[IL]/g, '1').replace(/O/g, '0');
  /* 0 と 1 は手形に使わない字なので、打ち間違いとみなして近い字へ寄せる */
  t = t.replace(/0/g, 'Q').replace(/1/g, 'J').slice(0, 8);
  return t.length > 4 ? `${LK_HEAD}-${t.slice(0, 4)}-${t.slice(4)}` : `${LK_HEAD}-${t}`;
}

/* パスワードの確かめ。8文字以上。IDそのものはパスワードにできない。
   ★この画面だけは戦国口調をやめて、ふつうの言葉で書く（2026-09-25）。
     間違えると本当にデータが消えるところなので、雰囲気より伝わることを取る */
export function lkPassNg(pass, again, code) {
  const p = String(pass || '');
  if (p.length < LK_PASS_MIN) return `パスワードは${LK_PASS_MIN}文字以上にしてください`;
  if (/^\s|\s$/.test(p)) return '前後に空白は使えません';
  if (again != null && p !== String(again)) return 'パスワードが一致しません';
  if (code && p.toUpperCase().replace(/-/g, '') === String(code).toUpperCase().replace(/-/g, ''))
    return 'IDと同じパスワードは使えません';
  return '';
}
/* どれくらい強いか。「弱い・普通・強い」だけ見せる（数字は出さない決まり） */
export function lkPassRank(pass) {
  const p = String(pass || '');
  let k = 0;
  if (/[a-z]/.test(p)) k++;
  if (/[A-Z]/.test(p)) k++;
  if (/[0-9]/.test(p)) k++;
  if (/[^0-9a-zA-Z]/.test(p)) k++;
  const score = k + (p.length >= 12 ? 1 : 0) + (p.length >= 16 ? 1 : 0);
  return p.length < LK_PASS_MIN ? { i: 0, w: '短い' }
    : score <= 2 ? { i: 1, w: '弱い' } : score <= 4 ? { i: 2, w: '普通' } : { i: 3, w: '強い' };
}

/* パスワードの覚え方。
   ★ここは本物の守りではない。平文で置かないための下ごしらえでしかない。
   本番の照合はサーバーがやる（argon2 / bcrypt）。端末の中は誰でも覗けるので、
   ここに強い錠をかけても意味がない、という割り切り（2026-09-25）。 */
export function lkHash(pass, salt) {
  const s = String(salt || '') + '\u0000' + String(pass || '');
  let out = '';
  for (let k = 0; k < 4; k++) {
    let h = (2166136261 ^ (k * 0x9E3779B1)) >>> 0;
    for (const ch of s) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; }
    for (let i = 0; i < 64; i++) h = Math.imul(h ^ (h >>> 13), 16777619) >>> 0;
    out += h.toString(16).padStart(8, '0');
  }
  return out;
}
export function lkSalt() {
  try {
    const a = new Uint8Array(8); crypto.getRandomValues(a);
    return [...a].map(x => x.toString(16).padStart(2, '0')).join('');
  } catch { return Math.random().toString(16).slice(2, 18); }
}

/* アカウント連携。いまはどれも準備中。
   ひとつの外部idはひとつのIDにしか結び付かない／同じ種類の連携は一つまで、が決めごと */
export const LK_TIES = [
  { id: 'line', name: 'LINE', note: 'どの端末でも使えます' },
  { id: 'gamecenter', name: 'Game Center', note: 'iPhone / iPad' },
  { id: 'playgames', name: 'Play ゲーム', note: 'Android' },
];
export const lkTied = P => LK_TIES.filter(t => (P.link && P.link.ties || {})[t.id]).length;
