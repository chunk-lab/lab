// 通信アダプタ。町は次の形だけを使うので、中身を差し替えれば本物のサーバーになる。
//   connect(me)          自分の情報 { id, name, look } で入室
//   sendState(s)         { x, z, ry, mv } を 1 秒に 8 回ほど送る
//   say(text) / emote(k) 吹き出しと身ぶり
//   on(evt, fn)          'join' {id,name,look} / 'leave' {id} / 'state' {id,x,z,ry,mv} / 'say' {id,text} / 'emote' {id,kind}
//   disconnect()
import { rng } from './core.js';

function emitter() {
  const h = {};
  return {
    on(e, f) { (h[e] ||= new Set()).add(f); return () => h[e].delete(f); },
    fire(e, d) { h[e]?.forEach(f => f(d)); },
  };
}

// サーバーなしで動く「他のプレイヤーっぽい」住人たち
export function createLocalNet({ graph, looks, count = 3, seed = 7 }) {
  const ev = emitter();
  const r = rng(seed);
  const names = ['ゆうき', 'ここ', 'はるた', 'みお', 'そら'];
  const phrases = ['こんにちは!', 'ゲーセン行く人〜', 'カフェのケーキおいしい', 'いい天気だね', 'またね〜', '新記録出た!'];
  const peers = [];
  let timer = null, last = 0;

  function pick(nodeId) { const n = graph.nodes[nodeId]; return n.links[Math.floor(r() * n.links.length)]; }

  return {
    on: ev.on,
    connect() {
      const ids = Object.keys(graph.nodes);
      for (let i = 0; i < count; i++) {
        const at = ids[Math.floor(r() * ids.length)];
        const p = { id: 'peer' + i, name: names[i % names.length], look: looks[(i + 1) % looks.length], at, to: pick(at), x: graph.nodes[at].x, z: graph.nodes[at].z, ry: 0, wait: r() * 3, chat: 4 + r() * 10 };
        peers.push(p);
        ev.fire('join', { id: p.id, name: p.name, look: p.look });
      }
      last = performance.now();
      timer = setInterval(() => {
        const now = performance.now(), dt = Math.min(0.5, (now - last) / 1000); last = now;
        for (const p of peers) {
          let mv = 0;
          if (p.wait > 0) p.wait -= dt;
          else {
            const t = graph.nodes[p.to];
            const dx = t.x - p.x, dz = t.z - p.z, d = Math.hypot(dx, dz);
            if (d < 0.3) { p.at = p.to; p.to = pick(p.at); if (r() < 0.25) p.wait = 1 + r() * 4; }
            else { const s = Math.min(d, 2.6 * dt); p.x += dx / d * s; p.z += dz / d * s; p.ry = Math.atan2(dx, dz); mv = 1; }
          }
          ev.fire('state', { id: p.id, x: p.x, z: p.z, ry: p.ry, mv });
          p.chat -= dt;
          if (p.chat < 0) { p.chat = 12 + r() * 20; ev.fire('say', { id: p.id, text: phrases[Math.floor(r() * phrases.length)] }); }
        }
      }, 120);
    },
    sendState() {}, say() {}, emote() {},
    disconnect() { clearInterval(timer); peers.forEach(p => ev.fire('leave', { id: p.id })); peers.length = 0; },
  };
}

// 本物のサーバー(server/relay.js か、同じ形の WebSocket サーバー)につなぐ
export function createWsNet(url, room = 'town') {
  const ev = emitter();
  let ws = null, me = null, retry = 0, closed = false;
  const send = m => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(m)); };
  function open() {
    ws = new WebSocket(url + (url.includes('?') ? '&' : '?') + 'room=' + encodeURIComponent(room));
    ws.onopen = () => { retry = 0; send({ t: 'join', id: me.id, name: me.name, look: me.look }); };
    ws.onmessage = e => {
      let m; try { m = JSON.parse(e.data); } catch (_) { return; }
      if (!m || m.id === me.id) return;
      const map = { join: 'join', leave: 'leave', st: 'state', say: 'say', emo: 'emote' };
      if (map[m.t]) ev.fire(map[m.t], m.t === 'emo' ? { id: m.id, kind: m.kind } : m);
    };
    ws.onclose = () => { if (!closed) setTimeout(open, Math.min(10000, 1000 * 2 ** retry++)); };
  }
  return {
    on: ev.on,
    connect(profile) { me = profile; open(); },
    sendState(s) { send({ t: 'st', id: me.id, x: +s.x.toFixed(2), z: +s.z.toFixed(2), ry: +s.ry.toFixed(2), mv: s.mv }); },
    say(text) { send({ t: 'say', id: me.id, text: String(text).slice(0, 60) }); },
    emote(kind) { send({ t: 'emo', id: me.id, kind }); },
    disconnect() { closed = true; ws?.close(); },
  };
}
