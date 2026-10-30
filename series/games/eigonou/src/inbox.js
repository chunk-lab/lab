import { ENV } from './env.js';
import { inboxLoad, inboxRest } from './common.js';
// 外から届いたことば(core.eigo の箱)を、ことば登録の画面に順番に出す(common.js の INBOX)。
// 箱から出したものは、登録・とばす まで画面が持つ。途中で閉じたら inboxBack で箱にもどす。
export function drainInbox() { const box = ENV.core && ENV.core.eigo; if (!box || !box.count()) return; inboxLoad(box.take()); }
export function inboxBack() { const r = inboxRest(); const box = ENV.core && ENV.core.eigo; if (r.length && box) box.send(r); }
