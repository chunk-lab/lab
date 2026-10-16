// 声を作る重い処理は裏側で動かす（画面が固まらないように）
// timestamped版のモデルなら、声と一緒に「発音ごとの長さ」も返す
let tts = null, cap = null, spaceId = 16;
self.onmessage = async (e) => {
  const m = e.data;
  try {
    if (m.type === 'load') {
      const { KokoroTTS } = await import('https://cdn.jsdelivr.net/npm/kokoro-js@1.2.0/+esm');
      self.postMessage({ type: 'stage', text: 'モデルを準備中…' });
      tts = await KokoroTTS.from_pretrained(m.model || 'onnx-community/Kokoro-82M-v1.0-ONNX', {
        dtype: m.dtype, device: m.device,
        progress_callback: (p) => self.postMessage({ type: 'progress', file: p.file, status: p.status, loaded: p.loaded, total: p.total })
      });
      // モデルの出力を横取りして、発音ごとの長さを取っておく
      const orig = tts.model;
      tts.model = async (inputs) => {
        const out = await orig(inputs);
        const keys = Object.keys(out);
        if (!out.waveform) { const k = keys.find(k => out[k] && out[k].type === 'float32'); if (k) out.waveform = out[k]; }
        const dk = keys.find(k => /dur/i.test(k)) || keys.find(k => k !== 'waveform' && out[k] && out[k].type !== 'float32');
        cap = { keys, ids: Array.from(inputs.input_ids.data, Number), dur: dk ? Array.from(out[dk].data, Number) : null };
        return out;
      };
      try { const v = tts.tokenizer.model && tts.tokenizer.model.tokens_to_ids; if (v && v.get(' ') != null) spaceId = Number(v.get(' ')); } catch (err) {}
      self.postMessage({ type: 'loaded' });
    } else if (m.type === 'gen') {
      const t0 = performance.now(); cap = null;
      const a = await tts.generate(m.text, { voice: m.voice, speed: m.speed || 1 });
      const audio = a.audio instanceof Float32Array ? a.audio : Float32Array.from(a.audio);
      self.postMessage({ type: 'audio', id: m.id, ms: Math.round(performance.now() - t0), audio, sr: a.sampling_rate,
        ids: cap && cap.ids, dur: cap && cap.dur, keys: cap && cap.keys, spaceId }, [audio.buffer]);
    }
  } catch (err) {
    self.postMessage({ type: 'error', id: m.id, msg: String((err && err.message) || err) });
  }
};
