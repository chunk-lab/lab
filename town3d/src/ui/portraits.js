/* 住人の顔絵(会話のときに出す)。名前 → 絵。 */
import shiori from './portraits/shiori.webp'; import koharu from './portraits/koharu.webp'; import mii from './portraits/mii.webp';
import baron from './portraits/baron.webp'; import gon from './portraits/gon.webp'; import maru from './portraits/maru.webp';
import yuzu from './portraits/yuzu.webp'; import chunkkun from './portraits/chunkkun.webp'; import choco from './portraits/choco.webp';
import luna from './portraits/luna.webp'; import tetsu from './portraits/tetsu.webp'; import suna from './portraits/suna.webp';
import sora from './portraits/sora.webp'; import hana from './portraits/hana.webp'; import self_mio from './portraits/self_mio.webp'; import self_ren from './portraits/self_ren.webp';
const BY_ID = { self_mio, self_ren, sora, hana, shiori, koharu, mii, baron, gon, maru, yuzu, chunkkun, choco, luna, tetsu, suna };
const BY_NAME = { 'そら': sora, 'はな': hana, 'しおりさん': shiori, 'こはる先生': koharu, 'ミイ': mii, 'ハッタリ男爵': baron, 'ひろい屋ゴン': gon, 'マルさん': maru, 'ゆず': yuzu, 'チャンクくん': chunkkun, '大喜利チョコ': choco, 'ルナ': luna, '哲学者': tetsu, '潮見さん': suna };
export const portrait = k => BY_ID[k] || BY_NAME[k] || null;
// 会話の文字色(キャラごと)。自分とナレーションは白
const COL = { hana: '#ffb3d1', sora: '#9bd8ff', shiori: '#bfe8a8', koharu: '#d8b8ff', mii: '#ffd09b', baron: '#ffe27a', gon: '#ffb38a', maru: '#a8f0d0', yuzu: '#ffd36b', chunkkun: '#dfe8ff', choco: '#e6b48f', luna: '#a8b4ff', tetsu: '#cfcfcf', suna: '#7fe6dc' };
const COL_NAME = { 'そら': 'sora', 'はな': 'hana', 'しおりさん': 'shiori', 'こはる先生': 'koharu', 'ミイ': 'mii', 'ハッタリ男爵': 'baron', 'ひろい屋ゴン': 'gon', 'ゴン': 'gon', 'マルさん': 'maru', 'ゆず': 'yuzu', 'チャンクくん': 'chunkkun', '大喜利チョコ': 'choco', 'ルナ': 'luna', '哲学者': 'tetsu', '潮見さん': 'suna' };
export const charColor = k => COL[k] || COL[COL_NAME[k]] || '#ffffff';
