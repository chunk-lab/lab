/* 共通の画面：設定・プロフィール（仮）・お知らせ。見た目は core/ui.css（.cs- で始まるものだけ） */
export function createUI(core) {
  const root = document.createElement('div'); root.className = 'cs-ui'; document.body.appendChild(root);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const sheet = (html, bind) => {
    const ov = document.createElement('div'); ov.className = 'cs-ov'; ov.innerHTML = '<div class="cs-sheet" role="dialog">' + html + '<button class="cs-btn cs-close">とじる</button></div>';
    root.appendChild(ov); const close = () => ov.remove();
    ov.addEventListener('click', e => { if (e.target === ov) close(); }); ov.querySelector('.cs-close').onclick = close; bind && bind(ov, close); return close;
  };
  const toast = (t) => { const d = document.createElement('div'); d.className = 'cs-toast'; d.textContent = t; root.appendChild(d); setTimeout(() => d.remove(), 2200); };
  const settings = () => {
    const s = core.settings, row = (k, label, min, max, step) => `<label class="cs-row"><span>${label}</span><input type="range" id="cs-${k}" min="${min}" max="${max}" step="${step}" value="${s.get(k)}"></label>`;
    sheet(`<h3>設定</h3>${row('bgm', 'BGM', 0, 1, 0.05)}${row('sfx', '効果音', 0, 1, 0.05)}
      <label class="cs-row"><span>見た目</span><select id="cs-theme"><option value="cute" ${s.get('theme') === 'cute' ? 'selected' : ''}>かわいい</option><option value="chic" ${s.get('theme') === 'chic' ? 'selected' : ''}>シック</option></select></label>
      <label class="cs-row"><span>英語の読み上げ</span><input type="checkbox" id="cs-voice" ${s.get('voice') ? 'checked' : ''}></label>
      ${row('rate', '読み上げの速さ', 0.7, 1.3, 0.05)}<button class="cs-btn" id="cs-try">読み上げを試す</button>
      ${core.ai ? `<label class="cs-row"><span>AI(自分のキー)</span><select id="cs-aip">${Object.entries({ gemini: 'Gemini', openai: 'ChatGPT', claude: 'Claude' }).map(([k, n]) => `<option value="${k}" ${core.ai.state.provider === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="cs-row cs-col"><span>AIのキー${core.ai.ready ? '(入っています)' : ''}</span><input id="cs-aik" type="password" autocomplete="off" placeholder="${core.ai.ready ? '変えるときだけ入れる' : 'キーを貼る(3Dの町と同じキー)'}"></label>
      <p class="cs-note">キーはこの端末にだけ保存します。住人との会話・「自然な文か」の判定・例文づくりに使います。</p>` : ''}
      ${core.admin && core.admin.on() ? '<button class="cs-btn" id="cs-admin">運営</button>' : ''}`, (ov, close) => {
      ['bgm', 'sfx', 'rate'].forEach(k => ov.querySelector('#cs-' + k).oninput = e => s.set(k, +e.target.value));
      ov.querySelector('#cs-theme').onchange = e => s.set('theme', e.target.value);
      ov.querySelector('#cs-voice').onchange = e => s.set('voice', e.target.checked);
      ov.querySelector('#cs-try').onclick = () => core.speech.speak('Hello! Let’s read English in chunks.');
      const aip = ov.querySelector('#cs-aip'), aik = ov.querySelector('#cs-aik');
      if (aip) aip.onchange = e => core.ai.configure({ provider: e.target.value });
      if (aik) aik.onchange = e => { if (e.target.value.trim()) { core.ai.configure({ key: e.target.value }); e.target.value = ''; toast('AIのキーを入れました'); } };
      const ad = ov.querySelector('#cs-admin'); if (ad) ad.onclick = () => { close(); core.admin.open(); };
    });
  };
  const profile = () => {
    const p = core.profile;
    sheet(`<h3>プロフィール</h3><div class="cs-prof"><img src="${p.avatarURL()}" alt="アバター"><div>
      <label class="cs-row cs-col"><span>なまえ</span><input id="cs-name" maxlength="12" placeholder="なまえを入れてね" value="${esc(p.name)}"></label></div></div>
      <p class="cs-note">アバターは作り直し中（いまは仮の絵）。ステータスの項目もこれから決めます。</p>
      <ul class="cs-stat">${p.status().map(x => `<li><span>${esc(x.label)}</span><b>${esc(x.value)}</b></li>`).join('')}</ul>`, ov => {
      ov.querySelector('#cs-name').onchange = e => p.setName(e.target.value);
    });
  };
  return { root, sheet, toast, settings, profile };
}
