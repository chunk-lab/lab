// 物語の体験は同じ英語脳アプリを、保存領域にアクセスできない別のフレームで実行。
// 通常アプリのSAVED・作りかけの文・db・受け渡し箱には一切触れない。
import html from './src/view.html';

const safeJSON = x => JSON.stringify(x).replace(/</g, '\\u003c');
export async function mountEpisodeFrame(el, ctx) {
  const token = crypto.randomUUID(), base = new URL(ctx.base, location.href).href;
  const asset = name => {
    const url = new URL(name, base), config = ctx.core.config || {};
    const version = config.hashes?.['g/eigonou/' + name] || config.build;
    if (version) url.searchParams.set('v', version);
    return url.href;
  };
  const frame = document.createElement('iframe'); frame.title = '英語脳アプリ：want to の体験';
  frame.setAttribute('sandbox', 'allow-scripts');
  frame.style.cssText = 'width:100%;height:100%;border:0;display:block;background:#fff';
  const origin = location.origin === 'null' ? '*' : location.origin;
  let ready = false, timer = 0, disposed = false;
  let resolveReady, rejectReady;
  const started = new Promise((resolve, reject) => { resolveReady = resolve; rejectReady = reject; });
  function cleanup() { if (disposed) return; disposed = true; clearTimeout(timer); window.removeEventListener('message', receive); frame.remove(); ctx.core.speech.stop(); }
  function receive(e) {
    if (disposed || e.source !== frame.contentWindow || e.origin !== 'null' || e.data?.token !== token) return;
    const d = e.data;
    if (d.type === 'ready') { ready = true; clearTimeout(timer); resolveReady(); }
    else if (d.type === 'error') { if (!ready) rejectReady(new Error('英語脳アプリの体験を読み込めませんでした')); }
    else if (d.type === 'speak' && typeof d.text === 'string') ctx.core.speech.speak(d.text.slice(0, 300), { rate: .9 });
    else if (d.type === 'finish' && ready) { ctx.report('episode_practice', { exercise: 'want-to' }); ctx.exit(); }
    else if (d.type === 'exit') ctx.exit();
  }
  window.addEventListener('message', receive);
  frame.srcdoc = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><link rel="stylesheet" href="${asset('eigo.css')}"><style>html,body{margin:0;height:100%;overflow:hidden}#episode-eigo-root{height:100%;position:relative}</style></head><body><div id="episode-eigo-root" class="ct-eigo"></div><script>
  const token=${safeJSON(token)}, target=${safeJSON(origin)};
  const send=(type,extra={})=>parent.postMessage({token,type,...extra},target);
  window.addEventListener('error',()=>send('error'));
  const memory=new Map();
  const store={get:k=>memory.has(k)?JSON.parse(memory.get(k)):null,set:(k,v)=>memory.set(k,JSON.stringify(v)),remove:k=>memory.delete(k)};
  const ctx={store,core:{speech:{speak:t=>send('speak',{text:t}),stop:()=>{}},eigo:{count:()=>0},ai:{ready:false}},report:()=>{},opts:{},base:${safeJSON(base)}};
  document.getElementById('episode-eigo-root').innerHTML=${safeJSON(html)};
  const script=document.createElement('script');script.src=${safeJSON(asset('eigo.js'))};script.onerror=()=>send('error');
  script.onload=()=>{try{window.__EIGONOU.start(document.getElementById('episode-eigo-root'),ctx);window.__EIGONOU.practice({finish:()=>send('finish'),exit:()=>send('exit')});send('ready')}catch(e){send('error')}};
  document.head.appendChild(script);
  <\/script></body></html>`;
  el.appendChild(frame); ctx.showBack(true);
  timer = setTimeout(() => rejectReady(new Error('英語脳アプリの体験の読み込みが時間切れになりました')), 30000);
  try { await started; } catch (e) { cleanup(); throw e; }
  return { unmount: cleanup };
}
