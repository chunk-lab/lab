// 英語ゲームのデータ:チャンクに分けた文(チャンクチャンクの文+ここで足した文)と、辞書(英語脳アプリと同じもの)
import { ONE_TIERS } from '../../../../series/games/chunkchunk/src/data.js';

// 書き方はチャンクチャンクと同じ「役割:英語=日本語 | …」。lv:1やさしい〜3
const MORE = [
  [1, 'S:I=私は | V:like=好きだ | O:cats.=猫が', '私は猫が好きだ。'],
  [1, 'S:She=彼女は | V:plays=する | O:tennis=テニスを | T:on Sundays.=日曜日に', '彼女は日曜日にテニスをする。'],
  [1, 'S:We=私たちは | V:walk=歩いて行く | P:to school=学校へ | T:every day.=毎日', '私たちは毎日歩いて学校へ行く。'],
  [1, 'S:My dog=私の犬は | V:sleeps=眠る | P:on the sofa.=ソファーの上で', '私の犬はソファーの上で眠る。'],
  [1, 'S:He=彼は | V:drinks=飲む | O:milk=牛乳を | T:in the morning.=朝に', '彼は朝に牛乳を飲む。'],
  [1, 'S:They=彼らは | V:live=住んでいる | P:in a small town.=小さな町に', '彼らは小さな町に住んでいる。'],
  [1, 'S:I=私は | V:have=持っている | O:two brothers.=2人の兄弟を', '私には兄弟が2人いる。'],
  [1, 'S:The cat=その猫は | V:is=いる | P:under the table.=テーブルの下に', 'その猫はテーブルの下にいる。'],
  [1, 'S:My mother=母は | V:cooks=作る | O:dinner=夕食を | T:every evening.=毎晩', '母は毎晩夕食を作る。'],
  [1, 'S:You=あなたは | V:can swim=泳げる | M:very fast.=とても速く', 'あなたはとても速く泳げる。'],
  [1, 'S:The sun=太陽は | V:rises=のぼる | P:in the east.=東から', '太陽は東からのぼる。'],
  [1, 'S:I=私は | V:watched=見た | O:a movie=映画を | T:last night.=昨夜', '私は昨夜映画を見た。'],
  [1, 'S:Ken=ケンは | V:ate=食べた | O:three apples.=りんごを3つ', 'ケンはりんごを3つ食べた。'],
  [1, 'S:We=私たちは | V:had=過ごした | O:a good time=楽しい時を | P:at the beach.=浜辺で', '私たちは浜辺で楽しい時を過ごした。'],
  [2, 'S:My friend=友だちは | V:gave=くれた | I:me=私に | O:a nice present.=すてきなプレゼントを', '友だちは私にすてきなプレゼントをくれた。'],
  [2, 'S:The train=電車は | V:will arrive=着くだろう | P:at the station=駅に | T:in ten minutes.=10分後に', '電車は10分後に駅に着くだろう。'],
  [2, 'S:I=私は | V:want to visit=訪れたい | O:Kyoto=京都を | T:next spring.=来年の春に', '私は来年の春に京都を訪れたい。'],
  [2, 'S:She=彼女は | V:is looking for=探している | O:her glasses.=眼鏡を', '彼女は眼鏡を探している。'],
  [2, 'S:The children=子どもたちは | V:are playing=遊んでいる | P:in the park=公園で | M:happily.=楽しそうに', '子どもたちは公園で楽しそうに遊んでいる。'],
  [2, 'S:My father=父は | V:goes=行く | P:to work=仕事に | M:by bike.=自転車で', '父は自転車で仕事に行く。'],
  [2, 'S:This book=この本は | V:is=だ | C:very interesting.=とてもおもしろい', 'この本はとてもおもしろい。'],
  [2, 'S:I=私は | V:have never seen=見たことがない | O:snow.=雪を', '私は雪を見たことがない。'],
  [2, 'S:We=私たちは | V:stayed=いた | P:at home=家に | R:because of the rain.=雨のせいで', '私たちは雨のせいで家にいた。'],
  [2, 'S:He=彼は | V:called=電話した | I:me=私に | T:late at night.=夜おそくに', '彼は夜おそくに私に電話した。'],
  [2, 'S:Please=どうか | V:open=開けて | O:the window.=窓を', 'どうか窓を開けて。'],
  [2, 'S:The girl=その女の子は | V:is singing=歌っている | O:a song=歌を | P:on the stage.=ステージで', 'その女の子はステージで歌を歌っている。'],
  [2, 'S:My sister=姉は | V:made=作った | O:a cake=ケーキを | I:for me.=私のために', '姉は私のためにケーキを作った。'],
  [2, 'S:I=私は | V:usually get up=たいてい起きる | T:at seven.=7時に', '私はたいてい7時に起きる。'],
  [2, 'S:The shop=その店は | V:opens=開く | T:at ten=10時に | T:on weekdays.=平日は', 'その店は平日は10時に開く。'],
  [2, 'S:Tom=トムは | V:can speak=話せる | O:three languages.=3つの言語を', 'トムは3つの言語を話せる。'],
  [3, 'S:The man / with a red hat=赤い帽子の男の人は | V:is waiting=待っている | P:at the bus stop.=バス停で', '赤い帽子の男の人はバス停で待っている。'],
  [3, 'S:I=私は | V:will tell=伝えるつもりだ | I:you=あなたに | O:the answer=答えを | T:tomorrow.=明日', '明日あなたに答えを伝えるつもりだ。'],
  [3, 'S:The movie / we saw yesterday=昨日見た映画は | V:was=だった | C:really exciting.=とてもわくわくした', '昨日見た映画はとてもわくわくした。'],
  [3, 'S:She=彼女は | V:has been studying=ずっと勉強している | O:English=英語を | T:for five years.=5年間', '彼女は5年間ずっと英語を勉強している。'],
  [3, 'F:If it rains=もし雨が降ったら | S:we=私たちは | V:will stay=いるだろう | P:inside.=室内に', 'もし雨が降ったら私たちは室内にいるだろう。'],
  [3, 'S:Everyone=みんなが | V:was surprised=おどろいた | R:at the news.=その知らせに', 'みんながその知らせにおどろいた。'],
  [3, 'S:I=私は | V:forgot to bring=持ってくるのを忘れた | O:my umbrella=傘を | T:today.=今日', '私は今日傘を持ってくるのを忘れた。'],
  [3, 'S:The old bridge=その古い橋は | V:was built=建てられた | T:about 100 years ago.=約100年前に', 'その古い橋は約100年前に建てられた。'],
];
const clean = s => s.replace(/\{[^}]*\}/g, '').replace(/#.*/, '').trim();
function parse(line, ja, lv) {
  const chunks = line.split(' | ').map(u => { const m = u.match(/^([A-Z]):(.*?)=(.*)$/); if (!m) return null; return { role: m[1], en: m[2].replace(/ \/ /g, ' ').trim(), ja: clean(m[3]) }; }).filter(Boolean);
  if (chunks.length < 3) return null;
  return { lv, chunks, ja: clean(ja), en: chunks.map(c => c.en).join(' ') };
}
let SENT = null;
export function sentences() {
  if (SENT) return SENT;
  SENT = [];
  for (const [lv, l, ja] of MORE) { const s = parse(l, ja, lv); if (s) SENT.push(s); }
  try { ONE_TIERS.forEach((t, i) => t.list.forEach(([l, ja]) => { const s = parse(l, ja, i < 1 ? 2 : 3); if (s && s.chunks.length <= 6) SENT.push(s); })); } catch (e) { }
  return SENT;
}
// lv(1〜3)と、チャンクの数(n。0=なんでも)で選ぶ
export function pickSentence(lv = 2, n = 0, avoid = []) {
  const all = sentences(), c = all.filter(s => s.lv <= lv && s.lv >= Math.max(1, lv - 1) && (!n || s.chunks.length === n) && !avoid.includes(s));
  const l = c.length ? c : all.filter(s => !avoid.includes(s));
  return l[Math.floor(Math.random() * l.length)];
}
export const words = s => s.en.replace(/[.,!?]/g, '').split(/\s+/);

// ---- 辞書(1.3MB。使うときだけ読む) ----
let DICT = null, dictWait = null;
export function loadDict(url = 'core/dict/data.js') {
  if (DICT) return Promise.resolve(DICT);
  if (dictWait) return dictWait;
  dictWait = new Promise((res, rej) => {
    const prev = window.__csDictLoad;
    window.__csDictLoad = (rows, phr) => {
      const list = [], byW = new Map();
      rows.split('\n').forEach((l, rank) => {
        const [w, pos] = l.split('\t'); if (!w || !pos || !/^[a-z]+$/.test(w)) return;
        const ps = pos.split(';').map(x => { const i = x.indexOf('='); return [x.slice(0, i), x.slice(i + 1).replace(/,/g, '、')]; });
        const e = { w, ps, rank: list.length }; list.push(e); if (!byW.has(w)) byW.set(w, e);
      });
      DICT = { list, byW };
      if (prev) { try { prev(rows, phr); } catch (e) { } window.__csDictLoad = prev; }
      res(DICT);
    };
    const s = document.createElement('script'); s.src = url; s.async = true;
    s.onerror = () => { window.__csDictLoad = prev; dictWait = null; rej(new Error('dict')); };
    document.head.appendChild(s);
  });
  return dictWait;
}
const POSJ = { v: '動詞', n: '名詞', adj: '形容詞', adv: '副詞', prep: '前置詞', conj: '接続詞', pr: '代名詞', aux: '助動詞', int: '間投詞', num: '数' };
// 早押しのお題に向く語(意味がある程度長い・名詞/動詞/形容詞/副詞)
export function quizWords(D, lv) {
  const [a, b] = lv === 1 ? [80, 1400] : lv === 2 ? [900, 3800] : [3000, 9000];
  return D.list.filter(e => e.rank >= a && e.rank < b && e.w.length >= 3 && e.ps.some(p => ['n', 'v', 'adj', 'adv'].includes(p[0])) && e.ps.map(p => p[1]).join('').length >= 4);
}
export const meaningText = e => e.ps.filter(p => POSJ[p[0]]).map(p => `【${POSJ[p[0]]}】${p[1]}`).join(' ');
export const mainPos = e => (e.ps.find(p => ['n', 'v', 'adj', 'adv'].includes(p[0])) || e.ps[0])[0];

// ---- カテゴリー(辞書早押しのヒント) ----
import { CATS, CAT_RAW } from './cat_data.js';
let CATM = null;
export function catOf(w) { if (!CATM) { CATM = new Map(); CAT_RAW.split(' ').forEach(t => { const i = t.indexOf(':'); CATM.set(t.slice(0, i), CATS[+t.slice(i + 1)]); }); } return CATM.get(w) || ''; }
export const posName = p => POSJ[p] || '';
