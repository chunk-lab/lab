/* 英語の読み上げ（端末の音声合成）。声選び・速さ・ON/OFF は共通の設定に従う。 */
export function createSpeech(settings) {
  let voice = null, jaVoice = null;   // 日本語の声は、問題文の日本語を読むときだけ使う(入っていない端末では読まない)
  const pick = () => { try { const vs = speechSynthesis.getVoices() || [], en = vs.filter(x => /^en[-_]?/i.test(x.lang || '')); voice = en.find(x => /US/i.test(x.lang)) || en[0] || null; jaVoice = vs.find(x => /^ja[-_]?/i.test(x.lang || '')) || null; } catch (e) { } };
  try { pick(); speechSynthesis.addEventListener('voiceschanged', pick); } catch (e) { }
  return {
    speak(text, opt = {}) {
      if (!settings.get('voice')) { opt.onend && setTimeout(opt.onend, 0); return; }
      if (opt.lang === 'ja' && !jaVoice) { opt.onend && setTimeout(opt.onend, 0); return; }
      try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); if (opt.lang === 'ja') { u.lang = 'ja-JP'; u.voice = jaVoice; } else { u.lang = 'en-US'; if (voice) u.voice = voice; } u.rate = (opt.rate || 1) * settings.get('rate'); if (opt.onend) u.onend = u.onerror = opt.onend; speechSynthesis.speak(u); } catch (e) { opt.onend && opt.onend(); }
    },
    stop() { try { speechSynthesis.cancel(); } catch (e) { } },
    get voice() { return voice; }
  };
}
