// 住人との仲(好感度)・おみやげ・好物・解放・情報ノート。町・カフェ・占いの館・アミューズメントセンターで共通。
//   数字はぜんぶ仮。ここだけ直せば全体に効く。
import { createStorage } from '../core/core.js';
const st = createStorage('town:soc:');
const dayKey = () => { const d = new Date(Date.now() - 4 * 36e5); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };

// ---- カフェで買えるおみやげ(price=コイン) ----
export const ITEMS = {
  coffee: { icon: '☕', name: 'コーヒー', en: 'coffee', price: 30 },
  matcha: { icon: '🍵', name: '抹茶ラテ', en: 'matcha latte', price: 40 },
  cocoa: { icon: '🥛', name: 'ホットココア', en: 'hot cocoa', price: 35 },
  juice: { icon: '🧃', name: 'オレンジジュース', en: 'orange juice', price: 25 },
  cake: { icon: '🍰', name: 'ショートケーキ', en: 'shortcake', price: 60 },
  choco: { icon: '🎂', name: 'チョコケーキ', en: 'chocolate cake', price: 70 },
  pudding: { icon: '🍮', name: 'プリン', en: 'pudding', price: 45 },
  parfait: { icon: '🍨', name: 'パフェ', en: 'parfait', price: 80 },
  cookie: { icon: '🍪', name: 'クッキー', en: 'cookies', price: 20 },
  croissant: { icon: '🥐', name: 'クロワッサン', en: 'croissant', price: 30 },
  sandwich: { icon: '🥪', name: 'サンドイッチ', en: 'sandwich', price: 50 },
  cupcake: { icon: '🧁', name: 'カップケーキ', en: 'cupcake', price: 40 },
  donut: { icon: '🍩', name: 'ドーナツ', en: 'donut', price: 30 },
  dango: { icon: '🍡', name: 'おだんご', en: 'dango', price: 30 },
  berry: { icon: '🍓', name: 'いちごタルト(ひみつメニュー)', en: 'strawberry tart', price: 120, secret: 'mii' },
};
export const CAFE_MENU = ['coffee', 'matcha', 'cocoa', 'juice', 'cake', 'choco', 'pudding', 'parfait', 'cookie', 'croissant', 'sandwich', 'cupcake', 'donut', 'dango', 'berry'];

// ---- 住人ごとの好み:love=大好物 / like=好き / no=にがて ----
export const PREFS = {
  sora: { love: ['cookie', 'juice'], like: ['donut', 'sandwich', 'cocoa'], no: ['coffee'] },
  hana: { love: ['parfait', 'cake'], like: ['cupcake', 'pudding', 'matcha'], no: ['dango'] },
  mii: { love: ['coffee', 'croissant'], like: ['cake', 'cookie', 'sandwich'], no: ['juice'] },
  baron: { love: ['choco', 'parfait'], like: ['coffee', 'cupcake', 'cake'], no: ['dango'] },
  gon: { love: ['sandwich', 'donut'], like: ['croissant', 'cookie', 'juice'], no: ['matcha'] },
  koharu: { love: ['matcha', 'pudding'], like: ['cookie', 'cake', 'coffee'], no: ['donut'] },
  shiori: { love: ['coffee', 'cupcake'], like: ['croissant', 'matcha', 'pudding'], no: ['parfait'] },
  maru: { love: ['donut', 'coffee'], like: ['sandwich', 'cookie', 'cocoa'], no: ['cupcake'] },
  yuzu: { love: ['dango', 'matcha'], like: ['pudding', 'cocoa', 'cookie'], no: ['coffee'] },
  chunkkun: { love: ['pudding', 'parfait'], like: ['donut', 'juice', 'cake'], no: ['coffee'] },
  choco: { love: ['choco', 'cocoa'], like: ['donut', 'parfait', 'cookie'], no: ['matcha'] },
  tetsu: { love: ['matcha', 'croissant'], like: ['coffee', 'dango', 'sandwich'], no: ['parfait'] },
  suna: { love: ['coffee', 'sandwich'], like: ['dango', 'cookie', 'croissant'], no: ['parfait'] },
  luna: { love: ['cupcake', 'matcha'], like: ['cake', 'cocoa', 'pudding'], no: ['donut'] },
};
export const NPC_NAME = { sora: 'そら君', hana: 'はなちゃん', mii: 'ミイ', baron: 'ハッタリ男爵', gon: 'ひろい屋ゴン', koharu: 'こはる先生', shiori: 'しおりさん', maru: 'マルさん', yuzu: 'ゆずちゃん', chunkkun: 'チャンクくん', choco: '大喜利チョコ', tetsu: '哲学者', suna: '砂吹さん', luna: '占い師ルナ' };
const KIDS = ['sora', 'yuzu', 'chunkkun'];   // デートの代わりに、お礼のプレゼント
// いちばん好きなものは+12 / 好き+6 / ふつう+3 / にがて-3。1人に1日1回。その日はじめて話すと+1
export const PTS = { love: 12, like: 6, normal: 3, no: -3, talk: 1 };
export const LV = [0, 5, 20, 45, 80];   // Lv0 しりあい → Lv1 → Lv2 → Lv3 → Lv4
export const LV_NAME = ['しりあい', 'なかよし', 'ともだち', 'しんゆう', 'だいすき'];

// ---- 仲良くなると開くもの(lv で開く) ----
//   kind: game=アミューズメントセンターのゲーム / ability=頼めること / episode=お話 / date=カフェでデート / gift=お礼
export const UNLOCKS = {
  baron: [{ lv: 2, kind: 'game', id: 'cards', label: '🃏 カード対戦', text: 'アミューズメントセンターでカード対戦ができるようになった(男爵・ミイ・ゴンとも勝負できる)' }],
  yuzu: [{ lv: 2, kind: 'ability', id: 'amagoi', label: '🌦 天気をお願いする', text: '1日1回、雨・晴れ・くもりにしてもらえる(たまに失敗。仲良しほど成功しやすい)' },
    { lv: 3, kind: 'ability', id: 'luck', label: '🍀 運気をあげてもらう', text: '1日1回、その日の運気が上がる(釣りで大物・レアが出やすい)' }],
  chunkkun: [{ lv: 2, kind: 'game', id: 'hockey', label: '🏒 ぷにホッケー', text: 'アミューズメントセンターで「ぷにホッケー」が遊べるようになった' }],
  choco: [{ lv: 2, kind: 'game', id: 'party', label: '🎉 パーティ連打', text: 'アミューズメントセンターで「パーティ連打」が遊べるようになった' }],
  maru: [{ lv: 2, kind: 'game', id: 'bowling', label: '🎳 ボウリング', text: 'アミューズメントセンターで「ボウリング」が遊べるようになった' }],
  gon: [{ lv: 2, kind: 'game', id: 'boxes', label: '📦 ぐるぐるボックス', text: 'アミューズメントセンターで「ぐるぐるボックス」が遊べるようになった' },
    { lv: 3, kind: 'ability', id: 'pickup', label: '🎒 きょうの拾いものを見せてもらう', text: '1日1回、ゴンが拾ったもの(コレクション)を分けてくれる' }],
  mii: [{ lv: 2, kind: 'ability', id: 'secret', label: '🍓 カフェのひみつメニュー', text: 'カフェで「いちごタルト」が買えるようになった' }],
  suna: [{ lv: 2, kind: 'ability', id: 'bigfish', label: '🎣 きょうの大物情報を聞く', text: '1日1回、いま釣れやすい大物と時間帯を教えてくれる' }],
  shiori: [{ lv: 2, kind: 'ability', id: 'book', label: '📖 おすすめの一節を聞く', text: '1日1回、本の中の英文(短い長文)を教えてくれる(ノートに入る)' }],
  koharu: [{ lv: 2, kind: 'ability', id: 'lesson', label: '✏️ きょうの表現を教わる', text: '1日1回、使える英語の表現を教えてくれる(ノートに入る)' }],
  tetsu: [{ lv: 2, kind: 'ability', id: 'hint', label: '🔍 かくれたものの手がかりを聞く', text: '1日1回、町のどこかに隠れているものの手がかりをくれる' }],
  luna: [{ lv: 2, kind: 'ability', id: 'discount', label: '🔮 占いが半額', text: '占いが半額になった(かんたんタロットも)' },
    { lv: 3, kind: 'ability', id: 'tarot', label: '🃏 かんたんタロットが毎日1回無料', text: 'かんたんタロットが、毎日1回無料になった' }],
  hana: [], sora: [],
};
for (const id of Object.keys(PREFS)) {   // デート(大人)・お礼(子ども)は全員 Lv4
  if (id === 'luna' || id === 'hana') continue;
  (UNLOCKS[id] = UNLOCKS[id] || []).push(KIDS.includes(id) ? { lv: 4, kind: 'gift', id: 'thanks', label: '', text: 'いつものお礼に、プレゼントをもらえる' } : { lv: 4, kind: 'date', id: 'date', label: '☕ カフェでデートする', text: 'カフェでデートできるようになった' });
}
// ゲーム → だれと仲良くなると開くか(アミューズメントセンターで使う)。ここにないゲームは最初から遊べる
export const GAME_UNLOCK = {};
for (const [npc, list] of Object.entries(UNLOCKS)) for (const u of list) if (u.kind === 'game') GAME_UNLOCK[u.id] = { npc, lv: u.lv };

// ---- お話(Lv1・Lv3 になったとき) ----
export const EPISODES = {
  sora: ['「あのさ…英語、最初は全然しゃべれなかったんだ。だからおまえの気持ち、ちょっとわかる」', '「おれの夢? 世界中の人と、ふつうに冗談を言い合うこと。…笑うなよ」'],
  hana: ['「ねえ、このあいだのお菓子、すっごくおいしかった! 覚えててくれたの?」', '「わたしね、ほんとは人見知りなの。でも、あなたとは なんでか平気なんだ」'],
  mii: ['「カフェの窓ぎわの席、わたしの指定席なの。あなたも座っていいよ」', '「実はね、カードの必勝法は…“あわてないこと”。ふふ、ひみつだよ」'],
  baron: ['「ふはは! わが輩に貢ぎ物とは、見どころがある!」', '「…実はわが輩、ゲームで負けた夜は こっそり練習しておるのだ。だれにも言うでないぞ」'],
  gon: ['「拾ったもんにはな、ぜんぶ物語があるんだぜ」', '「この古いボタン、昔の恋人の…いや、なんでもねえ!」'],
  koharu: ['「先生も、昔は英語の宿題を忘れて怒られたんですよ」', '「あなたの成長を見るのが、最近いちばんの楽しみなんです」'],
  shiori: ['「静かな図書館で読む本は、ひと味ちがうんです」', '「わたしが司書になったのは、ある1冊の本のおかげなんです。いつか話しますね」'],
  maru: ['「お客さんの笑顔が、いちばんの売り上げだよ!」', '「この店、じいちゃんから受けついだんだ。だいじな宝物さ」'],
  yuzu: ['「神社のねこさん、あなたのこと覚えてるみたいですよ」', '「ほんとうは、おみくじの結果をこっそり知りたくなる時があるんです…」'],
  chunkkun: ['「ふわ〜、プレゼントもらうと、からだがのびる〜!」', '「ぼく、もとは空のくもだったんだ。ほんとだよ?」'],
  choco: ['「笑いってのはな、相手をよく見ることから始まるんだ」', '「スベった日はな、帰ってひとりで反省会よ。…今日はウケたぞ!」'],
  tetsu: ['「贈り物とは、心を形にしたもの。ありがとう」', '「答えのない問いを、いっしょに考えられる友がいるのは幸せなことです」'],
  suna: ['「いいもんもらったな。…お礼に、池のいい場所を教えようか」', '「旅をしてると、たまに帰る場所がほしくなるのさ。この町は、いい町だな」'],
  luna: ['「あなたの星、少しだけ明るくなったわ」', '「わたしにも見えない未来があるの。それはね、あなたが自分で決めることよ」'],
};

const get = (k, d) => { const v = st.get(k); return v == null ? d : v; };
export const social = {
  aff(id) { return get('aff', {})[id] || 0; },
  level(id) { const a = this.aff(id); let l = 0; LV.forEach((t, i) => { if (a >= t) l = i; }); return l; },
  next(id) { const l = this.level(id); return LV[l + 1] != null ? LV[l + 1] - this.aff(id) : 0; },
  addAff(id, n) {
    const A = get('aff', {}), before = this.level(id); A[id] = Math.max(0, Math.min(LV[LV.length - 1] + 20, (A[id] || 0) + n)); st.set('aff', A);
    const after = this.level(id); return { before, after, up: after > before };
  },
  reaction(id, item) { const p = PREFS[id]; if (!p) return 'normal'; return p.love.includes(item) ? 'love' : p.like.includes(item) ? 'like' : p.no.includes(item) ? 'no' : 'normal'; },
  // その日はじめて話した
  talked(id) { const T = get('talk', {}); if (T[id] === dayKey()) return null; T[id] = dayKey(); st.set('talk', T); return this.addAff(id, PTS.talk); },
  canGive(id) { return (get('gave', {})[id] || '') !== dayKey(); },
  give(id, item) {
    if (!this.canGive(id) || !this.useItem(item)) return null;
    const G = get('gave', {}); G[id] = dayKey(); st.set('gave', G);
    const r = this.reaction(id, item), res = this.addAff(id, PTS[r]);
    this.learnPref(id, item, r);
    return { r, ...res };
  },
  // ---- 持っているおみやげ ----
  bag() { return get('bag', {}); },
  addItem(k, n = 1) { const B = this.bag(); B[k] = (B[k] || 0) + n; st.set('bag', B); },
  lockedItems() { return get('lockItem', {}); },
  isItemLocked(k) { return !!this.lockedItems()[k]; },
  toggleItemLock(k) { const L = this.lockedItems(); if (L[k]) delete L[k]; else L[k] = 1; st.set('lockItem', L); return !!L[k]; },   // ロック中のおみやげは、プレゼントなどで減らない
  useItem(k) { if (this.isItemLocked(k)) return false; const B = this.bag(); if (!B[k]) return false; B[k]--; if (!B[k]) delete B[k]; st.set('bag', B); return true; },
  // ---- 解放 ----
  unlocksOf(id) { return (UNLOCKS[id] || []).filter(u => this.level(id) >= u.lv); },
  has(npc, uid) { return this.unlocksOf(npc).some(u => u.id === uid); },
  gameOpen(gid) { const g = GAME_UNLOCK[gid]; return !g || this.level(g.npc) >= g.lv || this.admin(); },
  admin() { try { return JSON.parse(localStorage.getItem('cs:core:admin')) === true; } catch (e) { return false; } },
  // 1日1回の頼みごと
  usedToday(key) { return (get('use', {})[key] || '') === dayKey(); },
  markUsed(key) { const U = get('use', {}); U[key] = dayKey(); st.set('use', U); },
  // 運気(その日)
  luckToday() { return get('luck', '') === dayKey(); },
  setLuck() { st.set('luck', dayKey()); },
  // 1回きりのもの(お礼など)
  once(key) { const O = get('once', {}); if (O[key]) return false; O[key] = 1; st.set('once', O); return true; },
  seenEpisode(id, lv) { return this.once('ep:' + id + ':' + lv); },
  // ---- 好みを知っているか(占い・プレゼントでわかる) ----
  knownPrefs() { return get('kp', {}); },
  learnPref(id, item, r) {
    const K = this.knownPrefs(), k = id + ':' + item; if (K[k]) return false; K[k] = r || this.reaction(id, item); st.set('kp', K);
    const lbl = { love: '大好物', like: '好き', no: 'にがて', normal: 'ふつう' }[K[k]];
    this.addInfo('好み', `${NPC_NAME[id] || id}:${ITEMS[item] ? ITEMS[item].icon + ITEMS[item].name : item} は ${lbl}`, 'pref:' + k);
    return true;
  },
  // ---- 情報ノート(ことばノートの「情報」タブ) ----
  info() { return get('info', []); },
  addInfo(cat, text, key) { const L = this.info(); if (key && L.some(x => x.key === key)) return false; L.push({ cat, text, key: key || '', at: Date.now() }); st.set('info', L.slice(-400)); this.onInfo && this.onInfo(); return true; },
  putInfo(cat, text, key) { const L = this.info(), x = key && L.find(y => y.key === key); if (x) { x.text = text; x.cat = cat; } else L.push({ cat, text, key: key || '', at: Date.now() }); st.set('info', L.slice(-400)); this.onInfo && this.onInfo(); return true; },   // 同じkeyなら書きかえ(タロットのまとめがあとから届くため)
};

// ---- 住人の記憶(AIとのおしゃべりで話したこと)。端末の中だけ ----
//   auto: 会話のあとAIがまとめた話題 [{t, imp:1=大事/0=ちょっとした話, at}]。大事なものは消さない(多くなったらまとめ直す)。ちょっとした話は新しい6つだけ
//   keep: 本人が「覚えておいてほしい」と書いたこと。枠は仲良し度(しりあい0 → だいすき4)
export const MEM = { SMALL_MAX: 6, BIG_SOFT: 24 };
export const memory = {
  all() { return get('mem', {}); },
  of(id) { const m = this.all()[id] || {}; return { auto: m.auto || [], keep: m.keep || [] }; },
  save(id, m) { const A = this.all(); A[id] = m; st.set('mem', A); },
  slots(id) { return social.level(id); },
  addAuto(id, items) {
    const m = this.of(id), now = Date.now();
    for (const it of items) { const t = String(it.t || '').trim().slice(0, 120); if (!t || m.auto.some(x => x.t === t)) continue; m.auto.push({ t, imp: it.imp ? 1 : 0, at: now }); }
    const big = m.auto.filter(x => x.imp), small = m.auto.filter(x => !x.imp).slice(-MEM.SMALL_MAX);
    m.auto = [...big, ...small].sort((a, b) => a.at - b.at); this.save(id, m); return big.length;
  },
  replaceBig(id, lines) { const m = this.of(id), small = m.auto.filter(x => !x.imp), now = Date.now(); m.auto = [...lines.map((t, i) => ({ t: String(t).slice(0, 160), imp: 1, at: now - 1000 + i })), ...small]; this.save(id, m); },
  removeAuto(id, i) { const m = this.of(id); m.auto.splice(i, 1); this.save(id, m); },
  toggleImp(id, i) { const m = this.of(id); if (m.auto[i]) m.auto[i].imp = m.auto[i].imp ? 0 : 1; this.save(id, m); },
  setKeep(id, i, t) { const m = this.of(id); t = String(t || '').trim().slice(0, 120); if (t) m.keep[i] = t; else m.keep.splice(i, 1); this.save(id, m); },
  // おしゃべりのときにAIへ渡す文
  prompt(id, player) {
    const m = this.of(id); if (!m.auto.length && !m.keep.length) return '';
    return [`(これまでの「${player}」とのおしゃべりで、あなたが覚えていること)`, ...m.keep.map(t => `- 「覚えておいてね」と頼まれたこと:${t}`), ...m.auto.map(x => `- ${x.t}`), '友だちとして自然に知っていることとして持っておく。話の流れで思い出したら、ときどき話題にしてもいい。'].join('\n');
  },
};
// デートのはじめのひとこと(住人ごと)
export const DATE_FIRST = {
  mii: 'ふふ、ここの窓ぎわ、わたしのお気に入りなの。なに飲む?', baron: 'ふはは! わが輩とお茶とは、光栄に思うがよい! …で、何を頼むのだ?', gon: 'カフェなんて久しぶりだぜ。…なんか落ちつかねえな、へへ',
  koharu: '先生とカフェなんて、ちょっと照れますね。きょうは授業の話はなしですよ', shiori: '本を持たないでカフェに来るの、ひさしぶりです。…なんだか新鮮ですね', maru: 'たまには店をまかせて、のんびりするのもいいね! なに食べる?',
  choco: 'カフェでデート…これはネタになる…いや、きょうはちゃんと楽しむぞ!', tetsu: '人と向かい合ってお茶を飲む時間は、いちばんぜいたくな時間かもしれません', suna: 'カフェもいいもんだな。池とはちがう落ちつきがある', luna: 'あなたと来るのは、星で決まっていたのかもね…ふふ、冗談よ',
};
