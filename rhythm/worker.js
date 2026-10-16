// 声を作る重い処理は裏側で動かす（画面が固まらないように）
let tts = null;
self.onmessage = async (e) => {
  const m = e.data;
  try {
    if (m.type === 'load') {
      const { KokoroTTS } = await import('https://cdn.jsdelivr.net/npm/kokoro-js@1.2.0/+esm');
      self.postMessage({ type: 'stage', text: 'モデルを準備中…' });
      tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
        dtype: m.dtype, device: m.device,
        progress_callback: (p) => self.postMessage({ type: 'progress', file: p.file, status: p.status, loaded: p.loaded, total: p.total })
      });
      self.postMessage({ type: 'loaded' });
    } else if (m.type === 'gen') {
      const t0 = performance.now();
      const a = await tts.generate(m.text, { voice: m.voice });
      const audio = a.audio instanceof Float32Array ? a.audio : Float32Array.from(a.audio);
      self.postMessage({ type: 'audio', id: m.id, ms: Math.round(performance.now() - t0), audio, sr: a.sampling_rate }, [audio.buffer]);
    }
  } catch (err) {
    self.postMessage({ type: 'error', id: m.id, msg: String((err && err.message) || err) });
  }
};
