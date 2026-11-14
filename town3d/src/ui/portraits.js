/* 住人の顔絵(会話のときに出す)。名前 → 絵。 */
import shiori from './portraits/shiori.webp'; import koharu from './portraits/koharu.webp'; import mii from './portraits/mii.webp';
import baron from './portraits/baron.webp'; import gon from './portraits/gon.webp'; import maru from './portraits/maru.webp';
import yuzu from './portraits/yuzu.webp'; import chunkkun from './portraits/chunkkun.webp'; import choco from './portraits/choco.webp';
import luna from './portraits/luna.webp'; import tetsu from './portraits/tetsu.webp'; import suna from './portraits/suna.webp';
import sora from './portraits/sora.webp'; import hana from './portraits/hana.webp';
const BY_ID = { sora, hana, shiori, koharu, mii, baron, gon, maru, yuzu, chunkkun, choco, luna, tetsu, suna };
const BY_NAME = { 'そら': sora, 'はな': hana, 'しおりさん': shiori, 'こはる先生': koharu, 'ミイ': mii, 'ハッタリ男爵': baron, 'ひろい屋ゴン': gon, 'マルさん': maru, 'ゆず': yuzu, 'チャンクくん': chunkkun, '大喜利チョコ': choco, 'ルナ': luna, '哲学者': tetsu, '潮見さん': suna };
export const portrait = k => BY_ID[k] || BY_NAME[k] || null;
