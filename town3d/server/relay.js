// いちばん安い同時接続サーバー:位置と吹き出しを同じ部屋の人に配るだけ(状態は持たない)。
// node server/relay.js [port]  → ブラウザで index.html?server=ws://ホスト:8787
// 小さな VPS や無料枠の PaaS で動く。Cloudflare Durable Objects に移すときも、この形を守ればよい。
import { WebSocketServer } from "ws";
const port = +process.argv[2] || +process.env.PORT || 8787;
const MAX_ROOM = +process.env.MAX_ROOM || 8, MAX_ALL = +process.env.MAX_ALL || 40; // 1部屋とサーバー全体の人数上限
let total = 0;
const count = new Map(); // 部屋ごとの接続数(join前も数える)
const rooms = new Map();
import { createServer } from "http";
// 通常のアクセス(動作確認・眠り防止の定期アクセス用)には「ok」を返す
const http = createServer((q, r) => { r.writeHead(200, { 'content-type': 'text/plain' }); r.end('ok'); });
const wss = new WebSocketServer({ server: http, maxPayload: 2048 });
http.listen(port);
wss.on('connection', (ws, req) => {
  const room = (new URL(req.url, 'http://x').searchParams.get('room') || 'town').replace(/[^\w-]/g, '').slice(0, 24) || 'town';
  if (total >= MAX_ALL || (count.get(room) || 0) >= MAX_ROOM) { ws.close(1013, 'full'); return; }
  total++; count.set(room, (count.get(room) || 0) + 1);
  if (!rooms.has(room)) rooms.set(room, new Map());
  const peers = rooms.get(room);
  let me = null, last = 0, budget = 20;
  const cast = (m, all) => { const s = JSON.stringify(m); for (const [id, p] of peers) if (all || id !== me?.id) p.ws.readyState === 1 && p.ws.send(s); };
  ws.on('message', raw => {
    const now = Date.now(); budget = Math.min(20, budget + (now - last) / 50); last = now;
    if (budget < 1) return; budget--;                         // 送りすぎを間引く
    let m; try { m = JSON.parse(raw); } catch (e) { return; }
    if (m.t === 'join' && !me) {
      me = { id: String(m.id).slice(0, 24), name: String(m.name || '').slice(0, 12), look: m.look, x: 0, z: 0, ry: 0 };
      for (const [, p] of peers) ws.send(JSON.stringify({ t: 'join', ...p.info, x: p.info.x, z: p.info.z }));
      peers.set(me.id, { ws, info: me });
      cast({ t: 'join', ...me });
    } else if (me && m.t === 'st') { Object.assign(me, { x: +m.x || 0, z: +m.z || 0, ry: +m.ry || 0 }); cast({ t: 'st', id: me.id, x: me.x, z: me.z, ry: me.ry, mv: m.mv ? 1 : 0 }); }
    else if (me && m.t === 'say') cast({ t: 'say', id: me.id, text: String(m.text).slice(0, 60) });
    else if (me && m.t === 'emo') cast({ t: 'emo', id: me.id, kind: String(m.kind).slice(0, 12) });
  });
  ws.on('close', () => { total--; count.set(room, count.get(room) - 1); if (!count.get(room)) count.delete(room); if (me) { peers.delete(me.id); cast({ t: 'leave', id: me.id }); if (!peers.size) rooms.delete(room); } });
});
console.log('relay on :' + port);
