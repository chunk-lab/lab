/* 単体アプリ(マージ単体)専用のデータ。
   町のデータ(town: … / cs:core: …)には、読むのも書くのもしない。保存は 'solo:' から始まる場所だけ。
   ・お金: 単体のコイン(マージで売る・届ける・お題でたまる)。町のコイン・ダイヤとは別物
   ・なかよし: 単体の中だけの記録(町の住人のなかよし度は変わらない)
   ・家具: マージの品を組み合わせて作る(買えない)。自分の部屋に置く / 住人の「部屋づくりの依頼」に使う(使うと、なくなる)
   ・部屋: 1部屋だけ。家具を置いてコインを払うと広がる。広がるほど、作れる家具がふえる */
import { createStorage } from '../core/core.js';
import { ITEMS, ITEM } from './furniture.js';
import { LV } from './social.js';

const st = createStorage('solo:');
export const soloStore = st;

// ---- コイン ----
const subs = new Set();
const coins = () => st.get('coins') ?? 100;
const setCoins = n => { st.set('coins', n); subs.forEach(f => { try { f(n); } catch (e) { } }); };
export const soloWallet = {
  get: coins,
  add(n) { n = Math.round(n); if (!Number.isFinite(n) || !n) return coins(); setCoins(Math.max(0, coins() + n)); return coins(); },
  give(n) { const b = coins(); this.add(n); return coins() - b; },
  spend(n) { n = Math.round(n); if (!Number.isFinite(n) || n < 0 || coins() < n) return false; if (n) setCoins(coins() - n); return true; },
  onChange(f) { subs.add(f); return () => subs.delete(f); },
};

// ---- なかよし(マージの住人カードのハート。単体の中だけ) ----
const G = (k, d) => st.get(k) || d;
export const soloSocial = {
  aff(id) { return G('aff', {})[id] || 0; },
  level(id) { const a = this.aff(id); let l = 0; LV.forEach((t, i) => { if (a >= t) l = i; }); return l; },
  addAff(id, n) { const A = G('aff', {}), before = this.level(id); A[id] = Math.max(0, Math.min(LV[LV.length - 1] + 20, (A[id] || 0) + n)); st.set('aff', A); const after = this.level(id); return { before, after, up: after > before }; },
  mergeNote() { },
  addCredit() { },
  markMade(k) { const M = G('made', {}); if (M[k]) return false; M[k] = 1; st.set('made', M); return true; },
};

// ---- 家具(持ち物) ----
const inv = () => G('inv', null) || (() => { const v = { chair: 1, plant: 1 }; st.set('inv', v); return v; })();   // はじめに いす と 観葉植物 を1つずつ
export const soloFurn = {
  inv,
  count: id => inv()[id] || 0,
  give(id, n = 1) { const v = inv(); v[id] = (v[id] || 0) + n; st.set('inv', v); },
  take(id, n = 1) { const v = inv(); if ((v[id] || 0) < n) return false; v[id] -= n; if (!v[id]) delete v[id]; st.set('inv', v); return true; },
};

// ---- 家具の作り方(マージの品の組み合わせ) ----
//   家具の値段で段階(1〜5)を決め、段階ごとに必要な品のLvと数がふえる。種類ごとに使う系統を変える(どれか1つの生成機だけでは作れない)
const CAT_LINES = {
  'ねる・すわる': [['toolA', 'sewB'], ['toolA', 'sewA']],
  'つくえ・しゅうのう': [['toolA', 'toolB'], ['toolA', 'seaB']],
  'あかり': [['toolB', 'seaB'], ['toolB', 'seaA']],
  'かざり': [['seaA', 'sewB'], ['seaB', 'cafeA'], ['sewA', 'seaA']],
  'かべ': [['toolB', 'seaA'], ['sewB', 'toolB']],
  'キッチン・おふろ': [['cafeB', 'toolA'], ['cafeA', 'toolB']],
};
const STAR = {}; export const starOf = id => STAR[id] || 1;   // 家具の★(段階)
const LVS = { 1: [2, 2], 2: [3, 2], 3: [3, 3, 2], 4: [4, 3, 3], 5: [5, 4, 3] };
const TIER_OVR = { bed: 2, desk: 2, lamp: 1, rug: 1 };   // 部屋の基本になる物は、早めに作れるように
const tierOf = it => TIER_OVR[it.id] || (it.price <= 150 ? 1 : it.price <= 350 ? 2 : it.price <= 600 ? 3 : it.price <= 900 ? 4 : 5);
export const TIER_RANK = { 1: 0, 2: 1, 3: 2, 4: 4, 5: 6 };   // その段階の家具が作れるようになる、部屋の広さの段
const SOLO_ITEMS = ITEMS.filter(it => it.price > 0 && !it.noshop && !/^(medal|sp_|fs_)/.test(it.id) && !['tank', 'door', 'window', 'bouquet'].includes(it.id));
export const FURN_RECIPES = SOLO_ITEMS.map((it, i) => {
  const t = tierOf(it), pairs = CAT_LINES[it.cat] || [['toolA', 'seaA']], pr = pairs[i % pairs.length], lv = LVS[t];
  const lines = pr.slice(); if (lv.length > 2) lines.push(['cafeA', 'cafeB', 'sewA', 'seaB'].find(l => !pr.includes(l)));
  return { id: it.id, name: it.name, cat: it.cat, tier: t, need: lines.map((ln, k) => ({ ln, lv: lv[k] })) };
}).map(rc => (STAR[rc.id] = rc.tier, rc)).sort((a, b) => a.tier - b.tier || a.need.reduce((s, x) => s + x.lv, 0) - b.need.reduce((s, x) => s + x.lv, 0));

// ---- 自分の部屋(1部屋だけ。広げる = 家具を置く + コイン) ----
// 広げる条件 = 部屋の「すてき度」(置いた家具の ★の合計。★ = 家具の段階1〜5) + マージの品をおさめる(盤面から消える)。コイン・ダイヤは使わない
export const GROW = { base: 4, max: 8, need: r => [4, 8, 14, 22, 32, 44, 58, 74][r] || 90, items: r => ({ lv: 2 + Math.floor(r / 2), n: 2 + r }) };
const roomD = () => G('room', null) || { name: 'わたしの部屋', rank: 0, type: '', put: [] };
const saveRoom = r => st.set('room', r);
export const soloRoom = {
  rank: () => roomD().rank || 0,
  placedCount: () => (roomD().put || []).length,
  score: () => (roomD().put || []).reduce((a, p) => a + starOf(p.id), 0),
  growInfo() {
    const r = roomD(), k = r.rank || 0; if (k >= GROW.max) return { max: true, k };
    const need = GROW.need(k), have = (r.put || []).reduce((a, p) => a + starOf(p.id), 0);
    return { k, need, have, item: GROW.items(k), ok: have >= need };
  },
  // 品をおさめるのは、マージの画面(盤面の品を使う)。ここでは、すてき度だけ確かめて広げる
  grow() { const g = this.growInfo(); if (g.max) return 'これ以上は広げられないよ'; if (g.have < g.need) return `すてき度が あと ${g.need - g.have} 足りないよ(★の多い家具を置くと上がるよ)`; const r = roomD(); r.rank = (r.rank || 0) + 1; saveRoom(r); return ''; },
  canMake: rc => TIER_RANK[rc.tier] <= (roomD().rank || 0) || (G('early', [])).includes(rc.id),
  early: id => (G('early', [])).includes(id),
};

// ---- 住人の「部屋づくりの依頼」(小さな部屋。わたすと家具はなくなる。ごほうびで、マージが進む) ----
//   1つずつ。終わったら少し時間をおいて、つぎの依頼がくる(ずっと続けられる)
const REQ_WAIT = 2 * 3600e3;
const REQ_PEOPLE = ['maru', 'shiori', 'koharu', 'mii', 'baron', 'gon', 'yuzu', 'choco', 'luna', 'tetsu', 'suna'];
const REQ_THEMES = [
  { t: 'ねむれる部屋がほしいな', c: { 'ねる・すわる': 1, 'あかり': 1 } },
  { t: '本を読む すみっこを作って', c: { 'ねる・すわる': 1, 'あかり': 1, 'かざり': 1 } },
  { t: 'お茶ができる部屋にしたい', c: { 'つくえ・しゅうのう': 1, 'ねる・すわる': 1, 'キッチン・おふろ': 1 } },
  { t: 'かわいい部屋がいいな', c: { 'かざり': 2, 'かべ': 1 } },
  { t: 'しごと部屋をおねがい', c: { 'つくえ・しゅうのう': 1, 'ねる・すわる': 1, 'あかり': 1 } },
  { t: 'あかるくて、にぎやかな部屋', c: { 'あかり': 2, 'かざり': 2 } },
];
const reqD = () => G('req', null);
export const soloReq = {
  WAIT: REQ_WAIT,
  get() {
    let q = reqD(); const now = Date.now();
    if (!q || (q.done && now - q.doneAt >= REQ_WAIT)) {   // つぎの依頼(部屋が広いほど、少しずつ多くなる)
      const k = (q && q.n) || 0, rank = (roomD().rank || 0), who = REQ_PEOPLE[(k * 7 + 2) % REQ_PEOPLE.length];
      const okCat = new Set(FURN_RECIPES.filter(rc => TIER_RANK[rc.tier] <= rank).map(rc => rc.cat));   // いまの部屋の広さで作れる種類の家具だけで、依頼を出す
      const can = REQ_THEMES.filter(t => Object.keys(t.c).every(c => okCat.has(c)));
      const th = k === 0 ? REQ_THEMES[0] : (can.length ? can : REQ_THEMES)[(k * 5) % (can.length || REQ_THEMES.length)];
      const c = { ...th.c }; if (rank >= 3) { const ks = Object.keys(c); c[ks[k % ks.length]]++; }
      q = { n: k + 1, who, text: th.t, c, size: rank >= 4 ? 5 : 4, put: [], done: false, at: now };
      st.set('req', q);
    }
    return q;
  },
  wait() { const q = reqD(); return q && q.done ? Math.max(0, REQ_WAIT - (Date.now() - q.doneAt)) : 0; },
  check(q = this.get()) {   // 置いた家具が、条件を満たしているか
    const have = {}; (q.put || []).forEach(p => { const c = ITEM[p.id] && ITEM[p.id].cat; if (c) have[c] = (have[c] || 0) + 1; });
    const rows = Object.entries(q.c).map(([cat, n]) => ({ cat, n, have: have[cat] || 0 }));
    return { rows, ok: rows.every(r => r.have >= r.n) };
  },
  // ごほうび: 生成機のパーツ・なかよし・まだ作れない家具の作り方を1つ先に(コイン・ダイヤは出さない)
  reward(q) { const rank = roomD().rank || 0, E = G('early', []), nx = FURN_RECIPES.find(rc => TIER_RANK[rc.tier] > rank && !E.includes(rc.id)); return { part: true, aff: 3, early: nx ? nx.id : null, earlyName: nx ? nx.name : '' }; },
  deliver() {   // わたす: 置いた家具は持ち物から なくなる
    const q = this.get(); if (q.done) return { err: 'つぎの依頼を まっているよ' };
    const ck = this.check(q); if (!ck.ok) return { err: 'まだ条件がそろっていないよ' };
    for (const p of q.put) soloFurn.take(p.id, 1);
    const rw = this.reward(q); soloSocial.addAff(q.who, rw.aff); if (rw.early) { const E = G('early', []); E.push(rw.early); st.set('early', E); }
    q.done = true; q.doneAt = Date.now(); q.got = rw; q.put = []; st.set('req', q);
    const P = G('pend', []); P.push({ part: rw.part }); st.set('pend', P);   // マージを開いたときに受け取る(生成機のパーツ)
    return { ok: true, rw, who: q.who };
  },
  takePending() { const P = G('pend', []); st.set('pend', []); return P; },
};

// ---- 家の画面(home.js)にわたす入れ物。'room' = 自分の部屋 / 'req' = 依頼の部屋 ----
function placedRoom(kind) { return kind === 'req' ? (soloReq.get().put || []) : (roomD().put || []); }
export function soloStoreFor(kind) {
  const isReq = kind === 'req';
  const room = () => {
    if (isReq) { const q = soloReq.get(), n = q.size || 4; return { id: 'sr', name: '依頼の部屋', cols: n, rows: n, type: q.type || '', wall: q.wall, floor: q.floor, cw: null, cf: null, sx: 0, sy: 0, from: null }; }
    const r = roomD(), n = GROW.base + (r.rank || 0); return { id: 'sr', name: r.name || 'わたしの部屋', cols: n, rows: n, type: r.type || '', wall: r.wall, floor: r.floor, cw: null, cf: null, sx: 0, sy: 0, from: null };
  };
  const put = (k, v) => { if (isReq) { const q = soloReq.get(); q[k] = v; st.set('req', q); } else { const r = roomD(); r[k] = v; saveRoom(r); } };
  const houseData = {
    solo: kind,
    get: () => ({ rooms: [room()] }),
    room: () => room(),
    cost: () => ({ coins: 0, gems: 0 }),
    linePrice: () => ({ coins: null, gems: 0 }),
    roomPrice: () => 0,
    expand: () => '',
    addRoom: () => ({ err: '部屋は1つだけだよ' }),
    setColor(rid, k, c) { put(k, c); },
    setType(rid, t) { put('type', t || ''); },
    rename(rid, name) { if (!isReq) put('name', String(name).slice(0, 10) || 'わたしの部屋'); },
    grow: () => soloRoom.grow(),
    growInfo: () => soloRoom.growInfo(),
  };
  // 置ける数 = 持っている数 − もう一方の部屋に置いてある数(同じ家具を、2つの部屋に同時には置けない)
  const other = () => placedRoom(isReq ? 'room' : 'req');
  const furn = {
    inv: () => { const v = { ...inv() }; other().forEach(p => { if (v[p.id]) { v[p.id]--; if (!v[p.id]) delete v[p.id]; } }); return v; },
    owned(id) { return Math.max(0, (inv()[id] || 0) - other().filter(p => p.id === id).length); },
    placed: () => placedRoom(kind).map(p => ({ ...p, room: 'sr' })).filter(p => ITEM[p.id]),
    savePlaced(v) { put('put', v.map(({ room, ...p }) => p)); },
  };
  return { houseData, furn };
}
