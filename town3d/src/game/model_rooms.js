/* ホームセンターの「モデルルーム」。家具の置き方ごと部屋を登録して、まるごと買う・1か月借りる。
   登録枠: 無料会員 1 / 有料会員 3。借りている間は、その枠は使えない(作り直せない)。
   買う: 部屋を増やす分(今の部屋数で 25,50,100…) + 6×6より広い分(行・列それぞれ 1,2,4…の合計) + 1ダイヤ。家具はぜんぶ新品で付く。
         借りていた人は、払ったレンタル代を引く(買う値段の半分まで)。最低 5ダイヤ。
   借りる: 1か月券 3ダイヤ(自動では更新しない)。期限がきたら、部屋と家具を返す。期限の3日前から知らせる。 */
import { createStorage } from '../core/core.js';
import { ITEMS, ITEM, MAX_OWN, houseData, furn, onHouseRead } from './furniture.js';

const st = createStorage('town:model:');
const DAY = 864e5, RENT_DAYS = 30, RENT_GEMS = 3, BASE = 6, MIN_BUY = 5;
const lines = n => 2 ** Math.max(0, n - BASE) - 1;   // 6より広い分: 1+2+4+…(広くなければ 0)

export const models = {
  RENT_GEMS, RENT_DAYS,
  list: () => st.get('list') || [],
  save: v => st.set('list', v),
  get(id) { return this.list().find(m => m.id === id) || null; },
  put(m) { const L = this.list(), i = L.findIndex(x => x.id === m.id); if (i < 0) L.push(m); else L[i] = m; this.save(L); },
  slots: paid => (paid ? 3 : 1),
  create(name) { const m = { id: 'm' + Date.now().toString(36), name: name || 'モデルルーム', cols: BASE, rows: BASE, type: '', put: [], paidRent: 0, rent: null }; this.put(m); return m; },
  remove(id) { const m = this.get(id); if (!m || m.rent) return false; this.save(this.list().filter(x => x.id !== id)); return true; },
  rename(id, name) { const m = this.get(id); if (m) { m.name = String(name).slice(0, 12) || m.name; this.put(m); } },
  count: m => (m.put || []).length,
  // 値段
  basePrice(m, c0) { return houseData.roomPrice(c0) + lines(m.cols) + lines(m.rows) + 1; },
  buyPrice(m, c0) {
    const p = this.basePrice(m, c0);   // 借りている部屋は部屋数に入らないので、買うときに1部屋ぶん足される
    const off = Math.min(m.paidRent || 0, Math.floor(p / 2));
    return Math.max(MIN_BUY, p - off);
  },
  // モデルルームを作る画面(自宅と同じ)用の、家と家具の入れ物
  storeFor(id) {
    const self = this;
    const room = () => { const m = self.get(id); return { id: 'mr', name: m.name, cols: m.cols, rows: m.rows, type: m.type || '', wall: m.wall, floor: m.floor, cw: m.cw, cf: m.cf, sx: 0, sy: 0, from: null }; };
    const houseD = {
      model: true,
      get: () => ({ rooms: [room()] }),
      room: () => room(),
      cost: c => houseData.cost(c),
      linePrice: () => ({ coins: null, gems: 0 }),
      roomPrice: () => 0,
      expand(roomId, axis, via) {
        const m = self.get(id); if (!m || m.rent) return '借りている間は、変えられないよ';
        if (via === 'shrink') { if (m[axis] <= 4) return 'これ以上は せまくできないよ'; m[axis]--; m.put = (m.put || []).filter(p => { const W = (axis === 'cols' ? m.cols : m.rows) * 2; return (axis === 'cols' ? p.gx : p.gz) < W; }); }
        else { if (m[axis] >= 20) return 'これ以上は広げられないよ'; m[axis]++; }
        self.put(m); return '';
      },
      addRoom: () => ({ err: 'モデルルームは1部屋だけだよ' }),
      setColor(rid, k, c, own) { const m = self.get(id); if (!m || m.rent) return; m[k] = c; if (own) m[k === 'wall' ? 'cw' : 'cf'] = c; self.put(m); },
      setType(rid, t) { const m = self.get(id); if (m) { m.type = t || ''; self.put(m); } },
      rename(rid, name) { self.rename(id, name); },
    };
    const furnD = {
      inv: () => Object.fromEntries(ITEMS.map(i => [i.id, MAX_OWN])),
      owned: () => MAX_OWN,   // モデルルームでは、どの家具も好きなだけ置ける
      placed: () => (self.get(id)?.put || []).map(p => ({ ...p, room: 'mr' })).filter(p => ITEM[p.id]),
      savePlaced(v) { const m = self.get(id); if (!m || m.rent) return; m.put = v.map(({ room, ...p }) => p); self.put(m); },
    };
    return { houseData: houseD, furn: furnD };
  },
  // 自宅に部屋を作って、家具を置く(rent があれば借りている印)。置いた家具の uid を返す
  _install(m, rent) {
    const at = houseData.spot(); if (!at) return { err: '家に、新しい部屋をつなげる場所がないよ' };
    const room = houseData.putRoom(at, { name: m.name, cols: m.cols, rows: m.rows, type: m.type, rent, wall: m.wall, floor: m.floor, cw: m.cw, cf: m.cf });
    const placed = furn.placed(), inv = furn.inv(), uids = [];
    for (const p of m.put || []) { const uid = 'mp' + Math.random().toString(36).slice(2, 9); placed.push({ ...p, uid, room: room.id, ...(rent ? { rent: m.id } : {}) }); inv[p.id] = (inv[p.id] || 0) + 1; uids.push(uid); }
    furn.savePlaced(placed); furn.saveInv(inv);
    return { room, uids };
  },
  buy(id, ctx) {
    const m = this.get(id); if (!m) return { err: '見つからないよ' }; if (!ctx.gems) return { err: 'ダイヤが使えない場所だよ' };
    const price = this.buyPrice(m, ctx.house);
    if (ctx.gems.get() < price) return { err: `ダイヤが足りないよ(あと ${price - ctx.gems.get()})` };
    if (m.rent) {   // 借りている部屋を、そのまま自分のものにする
      if (!ctx.gems.spend(price)) return { err: 'ダイヤが足りないよ' };
      const h = houseData.get(), r = h.rooms.find(x => x.id === m.rent.roomId); if (r) { delete r.rent; houseData.save(h); }
      const placed = furn.placed(); for (const p of placed) if (p.rent === m.id) delete p.rent; furn.savePlaced(placed);
      m.rent = null; m.paidRent = 0; this.put(m); return { room: r, price };
    }
    if (!houseData.spot()) return { err: '家に、新しい部屋をつなげる場所がないよ' };
    if (!ctx.gems.spend(price)) return { err: 'ダイヤが足りないよ' };
    const r = this._install(m, null); m.paidRent = 0; this.put(m); return { room: r.room, price };
  },
  rent(id, ctx) {
    const m = this.get(id); if (!m) return { err: '見つからないよ' }; if (!ctx.gems) return { err: 'ダイヤが使えない場所だよ' };
    if (ctx.gems.get() < RENT_GEMS) return { err: `ダイヤが足りないよ(あと ${RENT_GEMS - ctx.gems.get()})` };
    if (m.rent) {   // 延長
      if (!ctx.gems.spend(RENT_GEMS)) return { err: 'ダイヤが足りないよ' };
      m.rent.until = Math.max(m.rent.until, Date.now()) + RENT_DAYS * DAY; m.paidRent = (m.paidRent || 0) + RENT_GEMS; m.rent.warned = 0; this.put(m); return { extended: true, until: m.rent.until };
    }
    if (!houseData.spot()) return { err: '家に、新しい部屋をつなげる場所がないよ' };
    if (!ctx.gems.spend(RENT_GEMS)) return { err: 'ダイヤが足りないよ' };
    const until = Date.now() + RENT_DAYS * DAY, r = this._install(m, { model: m.id, until });
    m.rent = { roomId: r.room.id, until, items: (m.put || []).map(p => p.id) }; m.paidRent = (m.paidRent || 0) + RENT_GEMS; this.put(m); return { room: r.room, until };
  },
  // 期限がきた部屋を返す。返したものの名前のリスト
  expire(now = Date.now()) {
    const out = [];
    for (const m of this.list()) {
      if (!m.rent || m.rent.until > now) continue;
      const inv = furn.inv();
      for (const id of m.rent.items || []) { inv[id] = Math.max(0, (inv[id] || 0) - 1); if (!inv[id]) delete inv[id]; }   // 借りた家具を返す(しまっていても)
      let placed = furn.placed().filter(p => p.rent !== m.id && p.room !== m.rent.roomId);   // 借りた部屋に置いていた自分の家具は、持ち物にもどる
      const cnt = {}; placed = placed.filter(p => { cnt[p.id] = (cnt[p.id] || 0) + 1; return cnt[p.id] <= (inv[p.id] || 0); });   // 返したあと、持っている数より多く置かれている分は外す
      furn.savePlaced(placed); furn.saveInv(inv); houseData.removeRoom(m.rent.roomId);
      m.rent = null; this.put(m); out.push(m.name);
    }
    return out;
  },
  // 期限が3日以内の部屋(知らせる用。1日1回)
  soon(now = Date.now()) {
    const out = [];
    for (const m of this.list()) if (m.rent && m.rent.until - now < 3 * DAY && m.rent.until > now) { const day = Math.floor(now / DAY); if (m.rent.warned !== day) { m.rent.warned = day; this.put(m); out.push({ name: m.name, days: Math.ceil((m.rent.until - now) / DAY) }); } }
    return out;
  },
};

// 家を読むたびに、期限を過ぎた部屋を返す(読み取りだけで、ふだんは何もしない)
onHouseRead(() => { if (models.list().some(m => m.rent && m.rent.until <= Date.now())) models.expire(); });
