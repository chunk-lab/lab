// 住人とのやりとり(プレゼント・頼みごと・お話)・町の「調べる」・宝探しの運営ツール。main.js から使う
import { social, ITEMS, PREFS, NPC_NAME, EPISODES, LV_NAME, LV, PTS, memory, MEM } from '../game/social.js';
import { finds, WORDS, PHRASES, PROVERBS, PASSAGES, TREASURES, dayKey } from '../game/finds.js';
import { weather, WX_INFO } from '../game/weather.js';
import { FISH } from '../apps/fishing/data.js';

const pick = a => a[Math.floor(Math.random() * a.length)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const REACT = {
  love: ['わあっ! これ、大好きなんだ! ありがとう!', 'えっ、うそ…! いちばん好きなやつ! ほんとにありがとう!'],
  like: ['ありがとう! これ、好きなんだ。', 'うれしいな。いただきます!'],
  normal: ['ありがとう。気持ちがうれしいよ。', 'わあ、ありがとう。'],
  no: ['あ…ありがとう。…じつは、ちょっとにがてなんだ。', 'う、うん…。気持ちだけ、もらっておくね。'],
};

export function createSocialUI({ hud, wallet, audio, addNote, onAllFound, startDate, setRain, areaName, getMe, canAct, ai = null, player = () => 'あなた' }) {
  if (!document.getElementById('tw-soc-css')) { const st = document.createElement('style'); st.id = 'tw-soc-css'; st.textContent = '.tw-in{border:1px solid #d9cfe8;border-radius:10px;padding:8px 10px;font:inherit;font-size:14px;background:#fff;color:#5a4a6b;box-sizing:border-box;min-width:0}'; document.head.appendChild(st); }
  const name = r => (r && r.def && r.def.name) || '';
  const heart = id => { const l = social.level(id); return `♥ ${LV_NAME[l]}`; };

  // ---- レベルが上がったとき:お話・解放 ----
  function levelUp(r, before, after, then) {
    const id = r.def.id, msgs = [];
    for (let l = before + 1; l <= after; l++) {
      if ((l === 1 || l === 3) && EPISODES[id] && social.seenEpisode(id, l)) msgs.push(EPISODES[id][l === 1 ? 0 : 1]);
      for (const u of social.unlocksOf(id).filter(u => u.lv === l)) {
        if (u.kind === 'gift') { if (social.once('thanks:' + id)) { const g = wallet.give(100, 'thanks'); msgs.push(`いつもありがとう! これ、お礼だよ。(🪙+${g})`); } }
        else msgs.push(`🔓 ${u.text}`);
      }
    }
    const step = i => { if (i >= msgs.length) { then && then(); return; } hud.dialog({ name: name(r), role: `♥ ${LV_NAME[after]} になった!`, text: msgs[i], choices: [{ label: i + 1 < msgs.length ? 'つぎへ' : 'うん!', fn: () => step(i + 1) }] }); };
    audio.play('coin'); hud.toast(`💗 ${name(r)}と「${LV_NAME[after]}」になった!`);
    if (msgs.length) step(0); else then && then();
  }

  // ---- 話しかけたとき(その日はじめてなら、少しだけ仲良くなる) ----
  function onTalk(r) { if (!PREFS[r.def.id]) return; const res = social.talked(r.def.id); if (res && res.up) setTimeout(() => levelUp(r, res.before, res.after), 50); }

  // ---- プレゼント ----
  function gift(r, back) {
    const id = r.def.id, bag = social.bag(), ks = Object.keys(bag);
    if (!social.canGive(id)) { hud.dialog({ name: name(r), role: heart(id), text: 'きょうはもう、いいものをもらったよ。また明日ね!', choices: [] }); return; }
    if (!ks.length) { hud.dialog({ name: name(r), role: heart(id), text: '(おみやげを持っていない…。カフェで買えるよ)', choices: [] }); return; }
    const K = social.knownPrefs();
    hud.dialog({ name: '🎁 なにをあげる?', role: `${NPC_NAME[id] || name(r)} ・ ${heart(id)}`, text: 'おみやげをえらんでね(1人に1日1回)', choices: ks.map(k => ({ label: `${social.isItemLocked(k) ? '🔒 ' : ''}${ITEMS[k].icon} ${ITEMS[k].name}${bag[k] > 1 ? ' ×' + bag[k] : ''}${K[id + ':' + k] === 'love' ? ' 💗' : K[id + ':' + k] === 'no' ? ' 💦' : ''}`, fn: () => {
      if (social.isItemLocked(k)) { hud.toast('🔒 ロック中だよ(カフェのバッグでロックをはずせるよ)'); return gift(r, back); }
      const res = social.give(id, k); if (!res) return;
      audio.play(res.r === 'no' ? 'tap' : 'coin');
      const d = PTS[res.r];
      hud.dialog({ name: name(r), role: `${heart(id)} ${d > 0 ? '+' + d : d}`, text: pick(REACT[res.r]), choices: [] });
      if (res.up) setTimeout(() => levelUp(r, res.before, res.after), 1600);
    } })) });
  }

  // ---- 頼みごと ----
  function ability(r, u) {
    const id = r.def.id, key = id + ':' + u.id;
    if (social.usedToday(key)) { hud.dialog({ name: name(r), role: heart(id), text: 'きょうはもうやったよ。また明日ね!', choices: [] }); return; }
    const say = (text, role) => hud.dialog({ name: name(r), role: role || heart(id), text, choices: [] });
    if (u.id === 'amagoi') {   // 天気おねがい:雨・晴れ・くもりから選ぶ。たまに失敗(失敗しても1日1回はつかう)
      const cur = weather.now(), L = social.level(id), p = Math.min(0.9, 0.6 + 0.1 * (L - 2));
      const opts = [['rain', '☔ 雨にしてもらう'], ['sun', '☀️ 晴れにしてもらう'], ['cloud', '☁️ くもりにしてもらう']].filter(o => o[0] !== cur);
      hud.dialog({ name: name(r), role: heart(id), text: `どんな天気にしましょう? ……うまくいくとは、かぎりませんけど…(いまは${WX_INFO[cur].name}・1日1回)`, choices: [...opts.map(([k, lb]) => ({ label: lb, fn: () => {
        social.markUsed(key);
        if (Math.random() < p) {
          weather.call(k); setRain(); audio.play('open');
          say({ rain: '…天の神さま、雨をおめぐみください〜! ……ほら、くもってきましたよ。', sun: '…おひさまさん、出てきてくださ〜い! ……ほら、光がさしてきましたよ。', cloud: '…ふわふわの雲さん、おいでください〜! ……ほら、くもってきましたよ。' }[k] + `(次の予報の時間まで${WX_INFO[k].name})`);
          social.addInfo('天気', `ゆずちゃんの「おねがい」で${WX_INFO[k].name}(${new Date().getHours()}時ごろ〜次の予報まで)`);
        } else if (k === 'rain' && cur === 'sun') {
          weather.call('cloud'); setRain(); audio.play('tap');
          say('あれれ…? くもっただけでした…。ごめんなさい、雨にはなりませんでした〜。(くもりになった)');
        } else { audio.play('tap'); say('あれ…? 神さまに、とどかなかったみたいです…。ごめんなさい。(天気はそのまま)'); }
      } })), { label: 'やめておく', fn: () => say('そうですか。また言ってくださいね。') }] });
      return;
    }
    if (u.id === 'luck') { social.markUsed(key); social.setLuck(); audio.play('coin'); say('えいっ! …運気、上がりましたよ。きょうは釣りで大物やレアが出やすいはずです!'); return; }
    if (u.id === 'pickup') {
      social.markUsed(key); const have = finds.treasures(), left = TREASURES.filter(t => !have.includes(t[1])), t = left.length ? pick(left) : null;
      if (t) { finds.addTreasure(t[1]); social.addInfo('たからもの', `${t[0]}${t[1]}:${t[2]}(ゴンからもらった)`); say(`ほらよ、きょうの拾いもんだ。「${t[0]} ${t[1]}」…${t[2]}。大事にしな!`); }
      else { const g = wallet.give(30, 'gon'); say(`もう町のたからものは全部そろってるじゃねえか! これでも持ってきな。(🪙+${g})`); }
      return;
    }
    if (u.id === 'bigfish') {
      social.markUsed(key); const rare = FISH.filter(f => f.kind === 'fish' && f.r >= 4), f = pick(rare);
      const tm = { day: '昼', night: '夜', morning: '朝', evening: '夕方', any: 'いつでも' }[f.time] || 'いつでも';
      const t = `きょうは「${f.name}」が近くまで来てるかもな。${tm}に${f.rain ? '、雨の日に' : ''}ねらってみな。`; social.addInfo('大物', `${f.name}:${tm}${f.rain ? '・雨' : ''}(砂吹さん)`); say(t); return;
    }
    if (u.id === 'book') { social.markUsed(key); const p = pick(PASSAGES); addNote({ kind: 'sentence', text: p[0], meaning: p[1], npc: 'しおりさん' }); say(`この一節が好きなんです。「${p[0].slice(0, 60)}…」 ノートに書いておきましたね。`); return; }
    if (u.id === 'lesson') { social.markUsed(key); const p = pick(PHRASES); addNote({ kind: 'phrase', text: p[0], meaning: p[1], npc: 'こはる先生' }); say(`きょうの表現は「${p[0]}」。意味は「${p[1]}」です。ノートに入れておきましたよ。`); return; }
    if (u.id === 'hint') { social.markUsed(key); const a = finds.hint(areaName); if (a) social.addInfo('かくれもの', `${new Date().getMonth() + 1}/${new Date().getDate()}:${a}のあたり(哲学者)`); say(a ? `…「${a}」のあたりで、なにかが光っていた気がします。探してごらんなさい。` : 'きょうは、もう何も隠れていないようです。'); return; }
  }

  // ---- 話しかけたときのメニューに足すもの ----
  function choices(r) {
    const id = r.def.id; if (!PREFS[id]) return [];
    const out = [{ label: '🎁 プレゼントする', fn: () => gift(r) }];
    if ((ai && ai.ready) || memory.of(id).auto.length || memory.of(id).keep.length) out.push({ label: '🗒 覚えていること', fn: () => memoryPanel(r) });
    for (const u of social.unlocksOf(id)) {
      if (u.kind === 'ability' && u.label && !['secret', 'discount'].includes(u.id)) out.push({ label: u.label, fn: () => ability(r, u) });
      if (u.kind === 'date' && !(r.def.menu || []).some(m => m.act === 'date')) out.push({ label: u.label, fn: () => startDate(r) });
    }
    return out;
  }
  // カードのメニュー(ミイ・男爵・ゴン)は、男爵と仲良くなってから
  const menuOk = m => m.app !== 'chunkcards' || social.gameOpen('cards');

  // ---- 調べる ----
  let cache = [], cacheT = 0;
  function nearFind(x, z) { const now = performance.now(); if (now - cacheT > 1000) { cache = finds.spots(); cacheT = now; } let best = null, bd = 1.6; for (const s of cache) { const d = Math.hypot(s.x - x, s.z - z); if (d < bd) { bd = d; best = s; } } return best; }
  function takeFind(s) {
    if (!finds.take(s)) return; cacheT = 0; audio.play('coin');
    const prize = ['word', 'phrase', 'proverb', 'passage'].includes(s.kind) ? wallet.give(10, 'find') : 0;   // かくしもの1つ見つけるごとに10コイン(きょうの12個ぜんぶで120)
    const c = s.c, n = (t, txt) => {
      txt += prize ? `\n(🪙+${prize})` : '';
      const last = finds.allDonePending();   // これで、きょうの分をぜんぶ見つけた
      if (last && onAllFound) { finds.markAllDone(); hud.dialog({ name: '🔍 みつけた!', role: t, text: txt, choices: [{ label: 'つぎへ', fn: () => onAllFound() }] }); }
      else hud.dialog({ name: '🔍 みつけた!', role: t, text: txt, choices: [] });
    };
    if (s.kind === 'word') { addNote({ kind: 'word', text: c[0], meaning: c[1], npc: '調べる' }); n('単語', `「${c[0]}」= ${c[1]}(ことばノートに入れたよ)`); }
    else if (s.kind === 'phrase') { addNote({ kind: 'phrase', text: c[0], meaning: c[1], npc: '調べる' }); n('表現', `「${c[0]}」= ${c[1]}(ことばノートに入れたよ)`); }
    else if (s.kind === 'proverb') { addNote({ kind: 'phrase', text: c[0], meaning: c[1] + '(' + c[2] + ')', npc: '格言' }); n('格言', `「${c[0]}」— ${c[2]}\n${c[1]}`); }
    else if (s.kind === 'passage') { addNote({ kind: 'sentence', text: c[0], meaning: c[1], npc: '調べる' }); n('ちいさな物語', `${c[0]}\n(ことばノートに入れたよ)`); }
    else if (s.kind === 'treasure') { social.addInfo('たからもの', `${c[0]}${c[1]}:${c[2]}`, 'tre:' + c[1]); n('町のたからもの', `${c[0]} ${c[1]} … ${c[2]}(${finds.treasures().length} / ${TREASURES.length})`); }
    else if (s.kind === 'hunt') { const coins = (+c.coins || 0) > 0 ? wallet.give(+c.coins, 'hunt') : 0; social.addInfo('宝探し', `${c.title || 'たから'}:${c.text || ''}`, 'hunt:' + c.id); n('🏆 宝探し大会', `${c.title || 'たからもの'}${c.text ? '\n' + c.text : ''}${c.ja ? '\n' + c.ja : ''}${coins ? `\n(🪙+${coins})` : ''}`); }
  }

  // ---- 運営テスト:宝探しのたからを置く ----
  function adminHunt() {
    const t = new Date(Date.now() - 4 * 36e5), today = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    const draw = () => {
      const L = finds.localHunts(), me = getMe();
      const p = hud.panel(`<h2>🛠 宝探し大会(運営)</h2>
        <p class="tw-note">いま立っている場所(${me.x.toFixed(1)}, ${me.z.toFixed(1)})に隠す。日付を空にすると毎日出る。<br>ここで置いたものはこの端末だけ。全員に出すには、下のJSONを <b>town3d/src/game/hunt_data.js</b> の HUNTS に貼って公開する(Claudeに頼めばやります)。</p>
        <div style="display:grid;gap:6px;margin:8px 0"><input class="tw-in" data-f="title" placeholder="名前(例:金のどんぐり)"><input class="tw-in" data-f="text" placeholder="英語・メッセージ(例:You found it!)"><input class="tw-in" data-f="ja" placeholder="日本語(なくてもいい)"><div style="display:flex;gap:6px"><input class="tw-in" data-f="day" type="date" value="${today}" style="flex:1"><input class="tw-in" data-f="coins" type="number" value="100" style="width:90px" placeholder="コイン"></div></div>
        <div class="tw-actions"><button class="tw-btn main" data-h="put">📍 ここに隠す</button><button class="tw-btn" data-h="reset">見つけた記録をけす</button></div>
        <div style="max-height:30vh;overflow:auto;margin:8px 0">${L.length ? L.map(h => `<div class="tw-nrow"><div><b>${esc(h.title || 'たから')}</b> <small>${esc(h.day || '毎日')} ・ (${(+h.x).toFixed(1)}, ${(+h.z).toFixed(1)}) ・ 🪙${h.coins || 0}</small><br><small>${esc(h.text || '')}</small> <button class="tw-btn" data-del="${h.id}" style="padding:2px 9px;font-size:11px">けす</button></div></div>`).join('') : '<p class="tw-note">まだありません</p>'}</div>
        <textarea class="tw-in" readonly style="width:100%;height:80px;font-size:11px">${esc(JSON.stringify(L.map(({ id, x, z, day, title, text, ja, coins }) => ({ id, x: Math.round(x * 10) / 10, z: Math.round(z * 10) / 10, day, title, text, ja, coins })), null, 1))}</textarea>
        <div class="tw-actions"><button class="tw-btn" data-h="close">とじる</button></div>`);
      p.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.h === 'close') return hud.closePanel();
        if (b.dataset.h === 'put') { const v = k => p.querySelector(`[data-f="${k}"]`).value.trim(); const m = getMe(); finds.addHunt({ x: m.x, z: m.z, day: v('day'), title: v('title') || 'たからもの', text: v('text'), ja: v('ja'), coins: +v('coins') || 0 }); cacheT = 0; hud.closePanel(); hud.toast('📍 隠した'); setTimeout(draw, 30); }
        if (b.dataset.h === 'reset') { finds.resetHuntFound(); cacheT = 0; hud.toast('見つけた記録をけした'); }
        if (b.dataset.del) { finds.removeHunt(b.dataset.del); cacheT = 0; hud.closePanel(); setTimeout(draw, 30); }
      });
    };
    draw();
  }
  // ---- 記憶:おしゃべりが終わったら、覚えておく話題をAIにまとめてもらう ----
  async function remember(r, hist) {
    const id = r.def.id; if (!PREFS[id] || !ai || !ai.ready) return;
    const said = hist.filter(h => h.role === 'user'); if (!said.length) return;
    const talk = hist.slice(-40).map(h => `${h.role === 'user' ? player() : r.def.name}:${h.text}`).join('\n').slice(-6000);
    const known = memory.of(id).auto.map(x => '- ' + x.t).join('\n');
    const system = `あなたは会話の記録係。${r.def.name}が、友だちの「${player()}」との会話から、次に会ったときにも覚えておくとよいことを書き出す。\n` +
      `- ${player()}本人のこと(出来事・予定・好み・悩み・家族・夢・約束など)や、ふたりで話した話題を、1つ1行・短い日本語で。\n- その人にとって大事そうなことは imp:1、ちょっとした話は imp:0。\n- すでに覚えていることと同じ内容は書かない。何もなければ空。\n` +
      `- 出力はJSONだけ:{"items":[{"t":"...","imp":1}]}\n(すでに覚えていること)\n${known || 'なし'}`;
    try {
      const out = await ai.chat({ system, messages: [{ role: 'user', text: talk }], maxTokens: 1500, maxChars: 4000, free: true });
      const j = JSON.parse((out.match(/\{[\s\S]*\}/) || ['{}'])[0]); const items = Array.isArray(j.items) ? j.items : [];
      if (!items.length) return;
      const big = memory.addAuto(id, items);
      if (big > MEM.BIG_SOFT) {   // 大事なことが多くなったら、消さずにまとめ直す
        const lines = memory.of(id).auto.filter(x => x.imp).map(x => '- ' + x.t).join('\n');
        const o2 = await ai.chat({ system: `次の「覚えていること」を、内容を1つも落とさずに、重なりをまとめて ${Math.round(MEM.BIG_SOFT / 2)} 行以内にする。出力はJSONだけ:{"items":["...","..."]}`, messages: [{ role: 'user', text: lines }], maxTokens: 2000, maxChars: 6000, free: true });
        const j2 = JSON.parse((o2.match(/\{[\s\S]*\}/) || ['{}'])[0]); if (Array.isArray(j2.items) && j2.items.length >= 3) memory.replaceBig(id, j2.items);
      }
    } catch (e) { }
  }
  // ---- 「覚えていること」の画面(見る・直す・消す・覚えておいてほしいことを書く) ----
  function memoryPanel(r) {
    const id = r.def.id;
    const draw = () => {
      const m = memory.of(id), n = memory.slots(id);
      const p = hud.panel(`<h2>🗒 ${esc(r.def.name)}が覚えていること</h2>
        <p class="tw-note">おしゃべりのあとに自動で覚える(★=大事なこと。消えない)。ちがっていたら、けしたり★を変えたりできる。この端末の中だけに保存。</p>
        <div style="max-height:34vh;overflow:auto">${m.auto.length ? m.auto.map((x, i) => `<div class="tw-nrow"><div style="display:flex;gap:6px;align-items:center;width:100%"><button class="tw-btn" data-imp="${i}" style="padding:2px 8px">${x.imp ? '★' : '☆'}</button><span style="flex:1">${esc(x.t)}</span><button class="tw-btn" data-del="${i}" style="padding:2px 9px;font-size:11px">けす</button></div></div>`).join('') : '<p class="tw-note">まだありません(AIとおしゃべりすると増えていく)</p>'}</div>
        <h3 style="margin:10px 0 4px;font-size:15px">💌 覚えておいてほしいこと(${m.keep.length} / ${n})</h3>
        <p class="tw-note">仲良くなるほど、たのめる数がふえる(${LV_NAME.map((l, i) => `${l}${i}`).join('・')})。</p>
        ${m.keep.map((t, i) => `<div style="display:flex;gap:6px;margin:4px 0"><input class="tw-in" data-k="${i}" value="${esc(t)}" style="flex:1"><button class="tw-btn" data-kd="${i}" style="padding:2px 9px;font-size:11px">けす</button></div>`).join('')}
        ${m.keep.length < n ? `<div style="display:flex;gap:6px;margin:4px 0"><input class="tw-in" data-new placeholder="例:わたしの誕生日は5月3日" style="flex:1"><button class="tw-btn main" data-add>たのむ</button></div>` : n ? '' : '<p class="tw-note">もう少し仲良くなると、たのめるようになるよ。</p>'}
        <div class="tw-actions"><button class="tw-btn" data-x>とじる</button></div>`);
      p.addEventListener('change', e => { const k = e.target.closest('[data-k]'); if (k) memory.setKeep(id, +k.dataset.k, k.value); });
      p.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.x !== undefined) return hud.closePanel();
        if (b.dataset.imp) { memory.toggleImp(id, +b.dataset.imp); hud.closePanel(); setTimeout(draw, 20); }
        if (b.dataset.del) { memory.removeAuto(id, +b.dataset.del); hud.closePanel(); setTimeout(draw, 20); }
        if (b.dataset.kd) { memory.setKeep(id, +b.dataset.kd, ''); hud.closePanel(); setTimeout(draw, 20); }
        if (b.dataset.add !== undefined) { const v = p.querySelector('[data-new]').value.trim(); if (!v) return; const mm = memory.of(id); memory.setKeep(id, mm.keep.length, v); audio.play('coin'); hud.toast(`💌 ${r.def.name}が覚えてくれた`); hud.closePanel(); setTimeout(draw, 20); }
      });
    };
    draw();
  }
  return { onTalk, choices, menuOk, heart, nearFind, takeFind, adminHunt, gift, remember, memoryPanel };
}
