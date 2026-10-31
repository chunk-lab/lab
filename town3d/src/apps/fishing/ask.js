// 砂吹さんに聞く:狙いの魚(いい組み合わせ)・いまのおすすめ・腕のアドバイス
import { FISH, AREAS, TANA, GEAR, gearById, BAIT_EN, SPEED_JP, SPEED_EN, RARITY, RARITY_COL } from './data.js';
import { weightOf, timeOf } from './engine.js';
import { artCanvas } from './art.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const TIME_JP = { morning: '朝', day: '昼', evening: '夕方', night: '夜' }, SEASON_JP = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' };
const HOOK_EN = { s: 'small', m: 'medium', l: 'big' };
const AREA_EN = { weed: 'the weeds', log: 'the sunken log', lily: 'the lily pads', rock: 'the rocks', deep: 'the deep spot', open: 'open water' };
const areaJP = a => (a === 'open' ? 'ひらけた所' : AREAS[a].name);
const RUMOR_PER_DAY = 3;

export function bestBaits(sp) { return Object.entries(sp.bait).sort((a, b) => b[1] - a[1]).filter(([, v], i) => i === 0 || v >= 0.7).map(([k]) => k); }

// 腕のアドバイス(最近の出来事から)
export function adviceFor(skill, eq) {
  const c = {}; for (const k of skill) c[k] = (c[k] || 0) + 1;
  const out = [];
  if ((c.early || 0) >= 2 && (c.early || 0) >= (c.late || 0)) out.push(['Easy now. Wait till the float really goes under.', 'あわせが早いよ。ウキがツンツンしても待って、「グッ」としずんでから']);
  if ((c.late || 0) >= 2) out.push(['Be quick when you see it go under!', 'しずんだら、すぐ「あわせ」。おくれるとエサをとられるよ']);
  if (c.snap) out.push(['When the meter turns red, let go of the reel.', 'メーターが赤くなったら、手をはなそう。糸が切れちゃう']);
  if (c.slack) out.push(['Keep a little tension on the line.', 'ゆるめすぎると外れるよ。魚が休んでいるときは巻こう']);
  if (c.jump) out.push(['When it jumps, stop reeling.', '魚がはねたら、巻くのをやめてゆるめるんだ']);
  if (c.hook) out.push(['Big fish need a big hook.', '大物には大針。小さい針なら、テンションを低めにね']);
  if ((c.pass || 0) >= 2) out.push(['If a fish hesitates, give it a little twitch.', '迷っている魚(？が出たら)には、ちょんと1回だけ誘ってごらん']);
  if (c.land) out.push(['Cast a little ahead of the fish, then wait.', '魚の真上に落とすと驚くよ。進む向きの少し先に落として、寄ってくるのを待つんだ。ルアーなら奥に投げて、魚の前を通すといい']);
  if ((c.spook || 0) >= 2) out.push(['Gently, gently.', '誘いすぎると逃げちゃう。1回ちょんで、少し待とう']);
  if (eq && eq.eye === 'none' && (c.catch || 0) >= 4) out.push(['Polarized glasses help you see the fish.', '偏光グラスがあると、水の中の魚がよく見えるよ']);
  if (!out.length) out.push(skill.length ? ['You are getting good at this.', 'うまくなってきたね。次は めずらしい魚を狙ってみようか'] : ['Let us start by catching a few.', 'まずは何匹か釣ってごらん。ちゃんと見てるからさ']);
  return out.slice(0, 3);
}

// sheet(html,center) / dex / cond / eq / own / st / sfx / onSet(combo)
export function askScreen(o) {
  const { sheet, dex, cond, eq, own, st, sfx, skill, onSet } = o;
  const day = new Date().toDateString();
  const rumor = st.get('rumor') && st.get('rumor').day === day ? st.get('rumor') : { day, n: 0, seen: [] };
  let tab = o.tab || 'now';
  const s = sheet(`<div class="ph"><h2>💬 砂吹さんに聞く</h2></div><div class="tabs"></div><div class="sc"></div><div style="padding:8px 16px 16px;text-align:center"><button class="btn sub" data-x>もどる</button></div>`);
  const tabs = s.querySelector('.tabs'), sc = s.querySelector('.sc');
  const say = (en, jp) => `<div class="item" style="display:block"><b style="font-family:Georgia,serif">“${esc(en)}”</b><div style="font-size:13px;color:#8d7f9e">${esc(jp)}</div></div>`;
  const draw = () => {
    tabs.innerHTML = [['now', 'いまのおすすめ'], ['target', '狙いの魚'], ['skill', '腕のアドバイス']].map(([k, n]) => `<button class="tab ${k === tab ? 'on' : ''}" data-t="${k}">${n}</button>`).join('');
    if (tab === 'skill') { sc.innerHTML = `<p style="font-size:13px">砂吹さん「最近の釣りを見てたけど…」</p>` + adviceFor(skill, eq).map(([e, j]) => say(e, j)).join(''); return; }
    if (tab === 'now') {
      const tm = timeOf(cond.hour), list = FISH.filter(f => f.r >= 2).map(f => [f, weightOf(f, cond)]).filter(a => a[1] > 0);
      const pick = [];
      for (const r of [2, 3, 4, 5]) { const c = list.filter(([f]) => f.r === r).sort((a, b) => b[1] - a[1] + (Math.random() - 0.5)); if (c.length) pick.push(c[0][0]); }
      sc.innerHTML = say(cond.rain ? 'Rain! The fish get bold on days like this.' : tm === 'night' ? 'At night, the big ones come up from the deep.' : tm === 'morning' ? 'Morning is a busy time for fish.' : 'Take it easy, and pick your spot.', `いまは${TIME_JP[tm]}・${SEASON_JP[cond.season]}${cond.rain ? '・雨' : ''}。こんな魚が出やすいな${pick[0] ? `。${SEASON_JP[cond.season]}なら${pick[0].name}が狙い目で、エサは${bestBaits(pick[0]).map(b => (gearById('bait', b) || {}).name || b).join('・')}がいいよ` : ''}。それと、魚の真上じゃなく、進む向きの少し先に落とすのがコツだ`)
        + pick.map(f => row(f)).join('');
      return;
    }
    sc.innerHTML = `<p style="font-size:12px;color:#8d7f9e;margin:0 0 6px">見つけた魚は、いい仕掛けを教えてくれる。まだの魚は「うわさ」(1日${RUMOR_PER_DAY}回・あと${Math.max(0, RUMOR_PER_DAY - rumor.n)}回)</p>` + FISH.map(f => row(f)).join('');
  };
  function row(f) {
    const d = dex[f.id];
    return `<div class="item" data-f="${f.id}"><div class="ar" data-ar="${f.id}" style="width:64px"></div><div style="flex:1"><b>${d ? esc(f.name) : '？？？'}</b><div style="font-size:11px;color:${RARITY_COL[f.r]};font-weight:800">${'★'.repeat(f.r)} ${RARITY[f.r]}</div></div><span class="chip">${d ? '聞く' : rumor.seen.includes(f.id) ? 'うわさ' : '？'}</span></div>`;
  }
  const paint = () => { draw(); sc.querySelectorAll('[data-ar]').forEach(el => { const f = FISH.find(x => x.id === el.dataset.ar), cv = artCanvas(f, 64, 36, { sil: !dex[f.id] }); cv.style.cssText = 'width:64px;height:auto;position:static'; el.appendChild(cv); }); };
  paint();
  tabs.onclick = e => { const b = e.target.closest('[data-t]'); if (!b) return; tab = b.dataset.t; sfx.play('tap'); paint(); };
  sc.onclick = e => { const r = e.target.closest('[data-f]'); if (!r) return; sfx.play('tap'); detail(FISH.find(x => x.id === r.dataset.f)); };
  s.querySelector('[data-x]').onclick = () => s.remove();

  function detail(f) {
    const d = dex[f.id];
    if (!d && !rumor.seen.includes(f.id)) {
      if (rumor.n >= RUMOR_PER_DAY) { const m = sheet(`<div class="ph"><h2>うわさ</h2></div><div class="sc">${say('That is all I know for today.', 'きょう話せるうわさは、ここまでだな。またあした')}</div><div style="padding:8px 16px 16px;text-align:center"><button class="btn sub" data-x>とじる</button></div>`, true); m.querySelector('[data-x]').onclick = () => m.remove(); return; }
      rumor.n++; rumor.seen.push(f.id); st.set('rumor', rumor);
    }
    const bb = bestBaits(f), lure = bb.some(b => gearById('bait', b).type === 'lure');
    let body;
    if (d) {
      body = say(`${f.en}? Try ${bb.map(b => BAIT_EN[b]).join(' or ')}${lure ? '' : ', ' + TANA[f.tana].en}, with a ${HOOK_EN[f.hook]} hook. ${lure && f.speed !== 'still' ? SPEED_EN[f.speed][0].toUpperCase() + SPEED_EN[f.speed].slice(1) + '.' : ''} Look around ${AREA_EN[f.area[0]]}.`,
        `${f.name}なら、${bb.map(b => gearById('bait', b).name).join('か')}${lure ? '' : '・' + TANA[f.tana].name}・${gearById('hook', f.hook).name}。${lure ? SPEED_JP[f.speed] + 'のがコツ。' : ''}場所は${f.area.map(areaJP).join('・')}`)
        + `<div class="item" style="display:block;font-size:13px">🕒 ${f.time === 'any' ? 'いつでも' : TIME_JP[f.time]}${f.season ? ' / ' + f.season.map(x => SEASON_JP[x]).join('・') + 'だけ' : ''}${f.rain ? ' / 雨がすき' : ''}<br>📏 ${f.size[0]}〜${f.size[1]}cm ・ 自己ベスト ${d.best}cm${d.combo ? `<br>🎣 前に釣れた仕掛け:${gearById('bait', d.combo[0]).name}${d.combo[1] ? '・' + TANA[d.combo[1]].name : ''}・${gearById('hook', d.combo[2]).name}` : ''}</div>`;
    } else {
      body = say(`I heard something lives ${f.time === 'night' ? 'out there at night' : 'around ' + AREA_EN[f.area[0]]}...`, `うわさだけどね…${f.time !== 'any' ? TIME_JP[f.time] + 'に、' : ''}${f.season ? f.season.map(x => SEASON_JP[x]).join('・') + 'だけ、' : ''}${areaJP(f.area[0])}の${TANA[f.tana].name}あたりで見たって。${f.hook === 'l' ? '大きめの針がいるらしい' : f.hook === 's' ? '小さな針がいいらしい' : ''}${f.rain ? '。雨の日がいいとか' : ''}`)
        + `<p style="font-size:12px;color:#8d7f9e">ヒント:${esc(f.hint)}</p>`;
    }
    const m = sheet(`<div class="ph" style="flex-direction:column;gap:2px"><div style="font-size:12px;font-weight:900;color:${RARITY_COL[f.r]}">${'★'.repeat(f.r)} ${RARITY[f.r]}</div><h2>${d ? esc(f.name) : '？？？'}</h2></div>
      <div class="sc"><div class="ar" style="width:200px;margin:0 auto"></div>${body}</div>
      <div style="display:flex;gap:8px;padding:8px 16px 16px;justify-content:center;flex-wrap:wrap"><button class="btn sub" data-x>とじる</button>${d ? '<button class="btn" data-set>この仕掛けにする</button>' : ''}</div>`, true);
    const cv = artCanvas(f, 200, 110, { sil: !d }); cv.style.cssText = 'width:100%;height:auto;position:static'; m.querySelector('.ar').appendChild(cv);
    m.querySelector('[data-x]').onclick = () => { m.remove(); paint(); };
    const set = m.querySelector('[data-set]');
    if (set) set.onclick = () => {
      const b = bb.find(x => own.bait.includes(x));
      const msg = onSet({ bait: b, tana: TANA[f.tana].y, hook: f.hook }, bb);
      set.textContent = msg; set.disabled = true;
    };
  }
}
