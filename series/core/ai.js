/* AI（自分のキーを入れた人だけ）。キーは3Dの町と同じ場所（town:ai）に置き、2Dでも3Dでも同じキーを使う。
   運営のサーバーは通らない（ブラウザから各社へ直接）。使い道：
   - 「自然な文か」の判定（無料）
   - 例文・長文を作る（有料会員の回数、超えたらダイヤ。回数のしくみは member.useAI） */
const KEY = 'town:ai';
const MODELS = { gemini: 'gemini-flash-lite-latest', openai: 'gpt-4o-mini', claude: 'claude-haiku-5-5' };
export const AI_LABEL = { gemini: 'Gemini(Google・無料枠あり)', openai: 'ChatGPT(OpenAI API)', claude: 'Claude(Anthropic API)' };
export function createAI() {
  const load = () => { try { return Object.assign({ provider: 'gemini', key: '', model: '' }, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { return { provider: 'gemini', key: '', model: '' }; } };
  const save = s => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { } };
  async function ask(system, user, maxTokens = 600) {
    const s = load(), key = String(s.key || '').trim(); if (!key) throw new Error('AIのキーが入っていません(設定から入れられます)');
    const p = MODELS[s.provider] ? s.provider : 'gemini', model = s.model || MODELS[p];
    let url, headers = { 'content-type': 'application/json' }, body, pick;
    if (p === 'gemini') {
      url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`; headers['x-goog-api-key'] = key;
      body = { systemInstruction: { parts: [{ text: system }] }, contents: [{ role: 'user', parts: [{ text: user }] }], generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 } };
      pick = j => (j.candidates?.[0]?.content?.parts || []).map(x => x.text || '').join('');
    } else if (p === 'openai') {
      url = 'https://api.openai.com/v1/chat/completions'; headers.authorization = 'Bearer ' + key;
      body = { model, max_completion_tokens: maxTokens, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] };
      pick = j => j.choices?.[0]?.message?.content || '';
    } else {
      url = 'https://api.anthropic.com/v1/messages'; headers['x-api-key'] = key; headers['anthropic-version'] = '2023-06-01'; headers['anthropic-dangerous-direct-browser-access'] = 'true';
      body = { model, max_tokens: maxTokens, system, messages: [{ role: 'user', content: user }] };
      pick = j => (j.content || []).map(x => x.text || '').join('');
    }
    let res; try { res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), referrerPolicy: 'no-referrer', credentials: 'omit' }); } catch (e) { throw new Error('通信できませんでした'); }
    if (!res.ok) throw new Error(res.status === 429 ? '使いすぎか、無料枠の上限みたい。少し待ってね' : res.status >= 500 ? 'AIの会社側が混み合っています' : 'キーが使えないみたい(' + res.status + ')');
    return String(pick(await res.json()) || '').trim();
  }
  // JSON で返してもらう（```json で囲まれていても読む）
  async function askJSON(system, user, maxTokens) {
    const t = await ask(system + '\n出力はJSONだけ。前後に説明を書かない。', user, maxTokens);
    const m = t.match(/\{[\s\S]*\}|\[[\s\S]*\]/); if (!m) throw new Error('AIの返事を読めませんでした');
    return JSON.parse(m[0]);
  }
  return {
    get ready() { return !!String(load().key || '').trim(); },
    get state() { const s = load(); return { provider: s.provider, hasKey: !!s.key }; },
    configure({ provider, key }) { const s = load(); if (provider && MODELS[provider]) s.provider = provider; if (key !== undefined) s.key = String(key).trim(); save(s); },
    ask, askJSON,
    // 自然な文か：{ok:'o'|'t'|'x', fix:'直した文', why:'理由(日本語)'}
    check(en, word) {
      return askJSON('あなたは英語の先生。学習者が書いた英文が自然かどうかを判定する。o=自然、t=通じるが不自然、x=まちがい。fix は自然な英文(o なら同じ文)。why は日本語で40字以内。',
        `英文:${en}${word ? `\n使いたい言葉:${word}` : ''}\n{"ok":"o|t|x","fix":"...","why":"..."}`, 300);
    },
    // 例文3つと短い長文：{examples:[{en,ja}], passage:[{en,ja}]}
    examples(word, levelName) {
      return askJSON('英語学習アプリの教材を作る。中高生向け。自然で、まちがいのない英語。日本語訳はやさしい自然な日本語。',
        `「${word}」を使った例文を3つと、「${word}」を使った3〜5文の短いお話を作る。レベル:${levelName || '中級'}。\n{"examples":[{"en":"","ja":""}],"passage":[{"en":"","ja":""}]}`, 900);
    },
  };
}
