// チャンクリズム：確認ページとゲームで共通の部品
const $ = id => document.getElementById(id);
const S = (() => { try { return JSON.parse(localStorage.getItem('chunkrhythm.v1')) || {}; } catch (e) { return {}; } })();
function saveS() { try { localStorage.setItem('chunkrhythm.v1', JSON.stringify(S)); } catch (e) {} }

// ---------- 文章 ----------
const LV = { 1: '初級', 2: '中級', 3: '上級' };
const LIST = (typeof PASSAGES !== 'undefined' ? PASSAGES : []).map(p => ({
  id: p.id, name: `${LV[p.lv] || ''}　${p.title}`,
  chunks: p.chunks.slice(0, 12).map(c => ({ en: c.tk.map(t => t[0] + t[1] + t[2]).join(' ').replace(/\s+([,.!?;:])/g, '$1'), ja: c.ja }))
}));
const words = s => s.split(/\s+/).filter(Boolean);
const bare = w => w.replace(/[^A-Za-z0-9'\-]/g, '') || w;
// 意味の軽い単語（冠詞・前置詞・代名詞・助動詞・接続詞など）。これ以外を「意味語」として叩く
const FUNC = new Set(('a an the in on at to of for from with by about into onto over under near behind between through during before after since until up down out off as than ' +
  'and or but so if because when while though although that which who whom whose what where why how this these those there here it its ' +
  'i me my mine myself we us our ours you your yours he him his she her hers they them their theirs one ' +
  'be am is are was were been being do does did have has had will would can could shall should may might must ' +
  'not no very too also just then every some any all each both such own same other another').split(' '));
const isContent = w => !FUNC.has(bare(w).toLowerCase().replace(/'s$/, ''));

// ---------- 声の保存（IndexedDB） ----------
const DB = new Promise(res => { try { const r = indexedDB.open('chunkrhythm', 1); r.onupgradeneeded = () => r.result.createObjectStore('clips'); r.onsuccess = () => res(r.result); r.onerror = () => res(null); } catch (e) { res(null); } });
async function dbGet(k) { const d = await DB; if (!d) return null; return new Promise(r => { try { const q = d.transaction('clips').objectStore('clips').get(k); q.onsuccess = () => r(q.result || null); q.onerror = () => r(null); } catch (e) { r(null); } }); }
async function dbPut(k, v) { const d = await DB; if (!d) return; try { d.transaction('clips', 'readwrite').objectStore('clips').put(v, k); } catch (e) {} }

// ---------- 声を作る（timestamped版 Kokoro を裏側で動かす） ----------
const MODEL_TS = 'onnx-community/Kokoro-82M-v1.0-ONNX-timestamped';
let W = null, modelReady = false, waiters = {}, nid = 0;
function worker() {
  if (W) return W;
  W = new Worker('./worker.js', { type: 'module' });
  W.onmessage = e => { const m = e.data;
    if (m.type === 'progress' && m.status === 'progress' && m.total && waiters.prog) waiters.prog(m);
    if (m.type === 'loaded' && waiters.load) { const f = waiters.load; delete waiters.load; f(m); return; }
    if (m.type === 'audio' || m.type === 'error') { const k = m.id ?? 'load', w = waiters[k]; if (w) { delete waiters[k]; w(m); } } };
  return W;
}
function loadModel(device, dtype, onProg) {
  return new Promise((res, rej) => {
    const files = {};
    waiters.prog = m => { files[m.file] = [m.loaded, m.total]; const l = Object.values(files).reduce((a, x) => a + x[0], 0), t = Object.values(files).reduce((a, x) => a + x[1], 0); onProg(l, t); };
    waiters.load = m => m.type === 'error' ? rej(new Error(m.msg)) : res();
    worker().postMessage({ type: 'load', device, dtype, model: MODEL_TS });
  });
}
function genClip(text, voice, speed) {
  return new Promise((res, rej) => { const id = ++nid; waiters[id] = m => m.type === 'error' ? rej(new Error(m.msg)) : res(m); worker().postMessage({ type: 'gen', id, text, voice, speed }); });
}
async function ensureModel(st) {
  if (modelReady) return;
  const gpu = !!navigator.gpu;
  st('声のエンジンを読み込み中…', 0);
  const prog = (l, t) => st(`声のエンジンをダウンロード中 ${(l / 1e6).toFixed(0)} / ${(t / 1e6).toFixed(0)} MB`, l / t);
  try { await loadModel(gpu ? 'webgpu' : 'wasm', gpu ? 'fp32' : 'q8', prog); }
  catch (e) { if (!gpu) throw e; st('GPUで動かせなかったので、別の方法で読み込み中…', 0); await loadModel('wasm', 'q8', prog); }
  modelReady = true;
}
// 前の無音を削る。削った量（秒）も返して、単語の時刻をずらす
function trim(a, sr) {
  const th = 0.012; let s = 0, e = a.length - 1;
  while (s < a.length && Math.abs(a[s]) < th) s++;
  while (e > s && Math.abs(a[e]) < th) e--;
  s = Math.max(0, s - Math.round(sr * .008)); e = Math.min(a.length - 1, e + Math.round(sr * .05));
  return { a: a.slice(s, e + 1), cut: s / sr };
}
// 発音ごとの長さ → 単語ごとの開始・終了（秒）。空白で区切られた発音のかたまり＝1単語
function wordTimes(m, text) {
  if (!m.dur || !m.ids || m.dur.length !== m.ids.length) return { ok: false, why: `長さの情報がない（出力: ${(m.keys || []).join(',')}）` };
  const tot = m.dur.reduce((a, b) => a + b, 0), per = m.audio.length / tot;       // 1単位あたりのサンプル数（約600のはず）
  const cum = [0]; m.dur.forEach((d, i) => cum.push(cum[i] + d));
  const g = []; let s = null;
  for (let k = 1; k < m.ids.length - 1; k++) { if (m.ids[k] === m.spaceId) { if (s != null) { g.push([s, k]); s = null; } } else if (s == null) s = k; }
  if (s != null) g.push([s, m.ids.length - 1]);
  const ws = words(text), t = g.map(([a, b]) => ({ t: cum[a] * per / m.sr, e: cum[b] * per / m.sr }));
  return { ok: t.length === ws.length, per: Math.round(per), t, n: t.length, why: t.length === ws.length ? '' : `単語数${ws.length}に対して区切り${t.length}` };
}
// ---------- 単語の時刻の補正 ----------
// モデルが出す「単語の頭」は、実際の声の出だしより約46ms遅い（本物の声144チャンクで測定。tools/timing 参照）。
// 保存してある時刻は生のまま。使うときに wshift() 分だけ早める。
const WSHIFT_DEFAULT = 0.046;
const wshift = () => (typeof S.wshift === 'number' ? S.wshift : WSHIFT_DEFAULT);
const wtAt = (v, j) => { const x = v.wt[j], d = wshift(); return { t: Math.max(0, x.t - d), e: Math.max(0, x.e - d) }; };
// 破裂音ではじまる単語（p b t d k c(a,o,u) g(a,o,u,r,l)）は、声の出だしが鋭くて測りやすい
const PLO_RE = /^(p(?!h)|b|t(?!h)|d|k(?!n)|c[aou]|g[aoulr])/;
// 端末の中で、モデルの単語の頭と実際の声の出だしのずれを測る。clips: [{text, v:{a,sr,wt}}]
function measureShift(clips) {
  const out = [];
  for (const c of clips) {
    const v = c.v; if (!v || !v.wt) continue;
    const ws = words(c.text), hop = .002, n = Math.round(v.sr * .008), h = Math.round(v.sr * hop), a = v.a, N = Math.floor(a.length / h);
    const le = new Float32Array(N);
    for (let i = 0; i < N; i++) { let q = 0, k0 = i * h - (n >> 1), cnt = 0; for (let k = Math.max(0, k0); k < Math.min(a.length, k0 + n); k++) { q += a[k] * a[k]; cnt++; } le[i] = Math.log(Math.sqrt(q / Math.max(1, cnt)) + 1e-4); }
    ws.forEach((w, j) => {
      if (!v.wt[j] || !PLO_RE.test(bare(w).toLowerCase())) return;
      const c0 = Math.round(v.wt[j].t / hop), lo = Math.max(1, c0 - 100), hi = Math.min(N - 1, c0 + 100); let bv = -1, bi = -1;
      for (let i = lo; i <= hi; i++) { const d = le[i] - le[i - 1]; if (d > bv) { bv = d; bi = i; } }
      if (bv >= 1.2) out.push(bi * hop - v.wt[j].t);
    });
  }
  out.sort((x, y) => x - y);
  if (out.length < 10) return { n: out.length, ok: false };
  const med = out[out.length >> 1], q1 = out[Math.floor(out.length * .25)], q3 = out[Math.floor(out.length * .75)];
  return { n: out.length, ok: true, med, q1, q3, shift: Math.max(0, Math.min(.1, -med)) };
}
// 準備のたびに測って、補正を自動で決める
function autoShift(clips) { const m = measureShift(clips); if (m.ok && m.q3 - m.q1 < .06) { S.wshift = m.shift; m.used = true; } else { delete S.wshift; m.used = false; } saveS(); return m; }

// 必要な声をそろえる（保存済みはそのまま、ないものだけ作る）。値：{a, sr, wt:[{t,e}]|null, info}
async function getClips(texts, voice, st) {
  const uniq = [...new Set(texts)], got = {}, miss = [];
  for (const t of uniq) { const v = await dbGet(`ts1|${voice}|${t}`); if (v) got[t] = v; else miss.push(t); }
  if (miss.length) {
    await ensureModel(st);
    for (let i = 0; i < miss.length; i++) {
      st(`声を作成中 ${i + 1} / ${miss.length}（初回だけ。次からすぐ遊べます）`, i / miss.length);
      const m = await genClip(miss[i], voice, 1), tr = trim(m.audio, m.sr), w = wordTimes(m, miss[i]);
      const v = { a: tr.a, sr: m.sr, wt: w.ok ? w.t.map(x => ({ t: Math.max(0, x.t - tr.cut), e: Math.max(0, x.e - tr.cut) })) : null, info: { ms: m.ms, per: w.per, why: w.why, cut: tr.cut } };
      got[miss[i]] = v; dbPut(`ts1|${voice}|${miss[i]}`, v);
    }
  }
  st('準備できました', 1);
  return got;
}

// ---------- 音 ----------
let AC = null, master, drumG, voiceG;
function ac() {
  if (!AC) { AC = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
    master = AC.createGain(); master.connect(AC.destination);
    drumG = AC.createGain(); drumG.gain.value = .5; drumG.connect(master);
    voiceG = AC.createGain(); voiceG.gain.value = 1.15; voiceG.connect(master); }
  if (AC.state === 'suspended') AC.resume();
  return AC;
}
let NOISE = null;
function noise() { if (NOISE) return NOISE; const b = AC.createBuffer(1, AC.sampleRate * .5, AC.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return NOISE = b; }
function env(g, t, v, dec) { g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0008, t + dec); }
function kick(t) { const o = AC.createOscillator(), g = AC.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + .13); env(g, t, .95, .2); o.connect(g).connect(drumG); o.start(t); o.stop(t + .22); }
function snare(t, v = .32) { const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = noise(); f.type = 'highpass'; f.frequency.value = 1400; env(g, t, v, .13); s.connect(f).connect(g).connect(drumG); s.start(t); s.stop(t + .15); }
function hat(t, v = .09) { const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = noise(); f.type = 'highpass'; f.frequency.value = 7500; env(g, t, v, .04); s.connect(f).connect(g).connect(drumG); s.start(t); s.stop(t + .06); }
function tom(t, hi) { const o = AC.createOscillator(), g = AC.createGain(); o.frequency.setValueAtTime(hi ? 260 : 190, t); o.frequency.exponentialRampToValueAtTime(hi ? 150 : 110, t + .16); env(g, t, .8, .22); o.connect(g).connect(drumG); o.start(t); o.stop(t + .24); }
function stick(t, hi) { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'square'; o.frequency.value = hi ? 1760 : 1320; env(g, t, .14, .05); o.connect(g).connect(drumG); o.start(t); o.stop(t + .06); }
function click(t, hi, out) { const o = AC.createOscillator(), g = AC.createGain(); o.frequency.value = hi ? 2000 : 1100; env(g, t, hi ? .35 : .18, .035); o.connect(g).connect(out || master); o.start(t); o.stop(t + .05); }
function bass(t, f, len) { const o = AC.createOscillator(), g = AC.createGain(), lp = AC.createBiquadFilter(); o.type = 'triangle'; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = 400; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.32, t + .01); g.gain.setValueAtTime(.32, t + len * .7); g.gain.exponentialRampToValueAtTime(.001, t + len); o.connect(lp).connect(g).connect(drumG); o.start(t); o.stop(t + len + .02); }
function don() { const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain(); o.frequency.setValueAtTime(230, t); o.frequency.exponentialRampToValueAtTime(95, t + .09); env(g, t, .42, .12); o.connect(g).connect(master); o.start(t); o.stop(t + .14); }
const toBuf = v => { const b = AC.createBuffer(1, v.a.length, v.sr); b.copyToChannel(v.a, 0); return b; };
