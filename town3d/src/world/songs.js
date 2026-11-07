// ストリートピアノの曲(著作権の切れた曲だけ)。"音名オクターブ:拍" をスペースで並べる。R は休み
const S = {
  twinkle: { name: 'きらきら星', bpm: 100, m: 'C4:1 C4:1 G4:1 G4:1 A4:1 A4:1 G4:2 F4:1 F4:1 E4:1 E4:1 D4:1 D4:1 C4:2 G4:1 G4:1 F4:1 F4:1 E4:1 E4:1 D4:2 G4:1 G4:1 F4:1 F4:1 E4:1 E4:1 D4:2 C4:1 C4:1 G4:1 G4:1 A4:1 A4:1 G4:2 F4:1 F4:1 E4:1 E4:1 D4:1 D4:1 C4:2' },
  joy: { name: '喜びの歌', bpm: 112, m: 'E4:1 E4:1 F4:1 G4:1 G4:1 F4:1 E4:1 D4:1 C4:1 C4:1 D4:1 E4:1 E4:1.5 D4:0.5 D4:2 E4:1 E4:1 F4:1 G4:1 G4:1 F4:1 E4:1 D4:1 C4:1 C4:1 D4:1 E4:1 D4:1.5 C4:0.5 C4:2' },
  elise: { name: 'エリーゼのために', bpm: 132, m: 'E5:0.5 D#5:0.5 E5:0.5 D#5:0.5 E5:0.5 B4:0.5 D5:0.5 C5:0.5 A4:1.5 R:0.5 C4:0.5 E4:0.5 A4:0.5 B4:1.5 R:0.5 E4:0.5 G#4:0.5 B4:0.5 C5:1.5 R:0.5 E4:0.5 E5:0.5 D#5:0.5 E5:0.5 D#5:0.5 E5:0.5 B4:0.5 D5:0.5 C5:0.5 A4:1.5 R:0.5 C4:0.5 E4:0.5 A4:0.5 B4:1.5 R:0.5 E4:0.5 C5:0.5 B4:0.5 A4:2' },
  saints: { name: '聖者の行進', bpm: 150, m: 'C4:1 E4:1 F4:1 G4:4 R:1 C4:1 E4:1 F4:1 G4:4 R:1 C4:1 E4:1 F4:1 G4:2 E4:2 C4:2 E4:2 D4:4 R:1 E4:1 E4:1 D4:1 C4:3 C4:1 E4:2 G4:2 G4:1 F4:3 R:1 E4:1 F4:1 G4:2 E4:2 C4:2 D4:2 C4:4' },
  canon: { name: 'カノン', bpm: 72, m: 'F#5:2 E5:2 D5:2 C#5:2 B4:2 A4:2 B4:2 C#5:2 D5:1 C#5:1 B4:1 A4:1 G4:1 F#4:1 G4:1 E4:1 D4:1 F#4:1 A4:1 G4:1 F#4:1 D4:1 F#4:1 E4:1 D4:1 B3:1 D4:1 A4:1 G4:1 B4:1 A4:1 G4:1 F#4:4' },
  gymno: { name: 'ジムノペディ 第1番', bpm: 72, m: 'R:3 F#5:1 A5:1 G5:1 F#5:1 C#5:1 B4:1 C#5:1 D5:1 A4:3 F#4:3 R:3 F#5:1 A5:1 G5:1 F#5:1 C#5:1 B4:1 C#5:1 D5:1 A4:3 C#5:3 F#5:6' },
  bday: { name: 'ハッピーバースデー', bpm: 100, m: 'G4:0.75 G4:0.25 A4:1 G4:1 C5:1 B4:2 G4:0.75 G4:0.25 A4:1 G4:1 D5:1 C5:2 G4:0.75 G4:0.25 G5:1 E5:1 C5:1 B4:1 A4:2 F5:0.75 F5:0.25 E5:1 C5:1 D5:1 C5:3' },
};
const N = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
const hz = n => { const m = /^([A-G]#?)(\d)$/.exec(n); if (!m) return 0; return 440 * Math.pow(2, (N[m[1]] + (+m[2] + 1) * 12 - 69) / 12); };
// [{f:Hz, t:始まり秒, d:長さ秒, k:高さの順番(0〜)}]
export function songNotes(id) {
  const s = S[id]; if (!s) return [];
  const beat = 60 / s.bpm; let t = 0; const out = [];
  for (const tok of s.m.split(/\s+/)) { const [n, b] = tok.split(':'); const d = (+b || 1) * beat; if (n !== 'R') out.push({ f: hz(n), t, d }); t += d; }
  const fs = [...new Set(out.map(x => x.f))].sort((a, b) => a - b); out.forEach(x => { x.k = fs.indexOf(x.f); x.n = fs.length; });
  return out;
}
export const SONGS = Object.entries(S).map(([id, s]) => ({ id, name: s.name }));
