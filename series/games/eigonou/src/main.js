/* 英語脳アプリの入口。ファイルの順番どおりに init_◯◯() を動かす（もとの1つのスクリプトと同じ順番） */
import './eigo.css';
import { ENV, attach, detach } from './env.js';
import { init_i18n } from './i18n.js';
import { init_vocab } from './vocab.js';
import { init_vocab_a1 } from './vocab_a1.js';
import { init_vocab_a2 } from './vocab_a2.js';
import { init_cefr_map } from './cefr_map.js';
import { init_engine } from './engine.js';
import { init_pv_user } from './pv_user.js';
import { init_idioms } from './idioms.js';
import { init_vcomp } from './vcomp.js';
import { init_loc } from './loc.js';
import { init_of } from './of.js';
import { init_emoji_fix } from './emoji_fix.js';
import { init_common } from './common.js';
import { init_noto_map } from './noto_map.js';
import { init_pack } from './pack.js';
import { init_addword } from './addword.js';
import { init_play } from './play.js';
import { init_motion } from './motion.js';
import { init_reel } from './reel.js';
import { init_fuku } from './fuku.js';
import { init_embed } from './embed.js';
import { init_big } from './big.js';
import { init_bigdict } from './bigdict.js';
import { init_objrank } from './objrank.js';
import { init_qbar } from './qbar.js';
import { init_qfw } from './qfw.js';
import { init_qsp } from './qsp.js';
import { init_qfr } from './qfr.js';
import { init_qfx } from './qfx.js';
import { init_coord } from './coord.js';
import { init_prac_data } from './prac_data.js';
import { init_prac } from './prac.js';
import { init_drill } from './drill.js';
import { init_geo } from './geo.js';
import { init_slot } from './slot.js';
import { drainInbox } from './inbox.js';
import { openTry, saveMemo, showPlays } from './playsent.js';
const INITS = [init_i18n, init_vocab, init_vocab_a1, init_vocab_a2, init_cefr_map, init_engine, init_pv_user, init_idioms, init_vcomp, init_loc, init_of, init_emoji_fix, init_common, init_noto_map, init_pack, init_addword, init_play, init_motion, init_reel, init_fuku, init_embed, init_big, init_bigdict, init_objrank, init_qbar, init_qfw, init_qsp, init_qfr, init_qfx, init_coord, init_prac_data, init_prac, init_drill, init_geo, init_slot];
let started = false;
window.__EIGONOU = {
  start(root, ctx) {
    Object.assign(ENV, { root, ctx, core: ctx.core, store: ctx.store });
    attach();
    if (!started) { started = true; INITS.forEach(f => f()); }
    try {
      const top = root.querySelector('.top');
      if (top && !top.querySelector('.eg-try-b')) {
        const mk = (cls, label, fn) => { const b = document.createElement('button'); b.className = 'ib ' + cls; b.textContent = label; b.style.cssText = 'font-size:12px;padding:4px 8px;white-space:nowrap'; b.onclick = fn; top.appendChild(b); };
        mk('eg-try-b', '✨ 使ってみる', () => openTry()); mk('eg-memo-b', '💾 記憶', () => saveMemo()); mk('eg-pl', '📚 記憶した文', () => showPlays());
      }
    } catch (e) { }
    setTimeout(() => { try { drainInbox(); } catch (e) { } }, 400);   // ほかのアプリから送られた言葉・表現・文を、マイことばに入れる
  },
  stop() { detach(); }
};
