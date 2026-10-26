/* 共通部品の入口。アプリ（apps/<アプリ>/main.js）は最初にこれを呼ぶ：
   const core = createCore({ appId:'town', grants:['sub:all'], backButton:true, backLabel:'🏠 街へ' });
   core.host.open(game) でゲームを開く。core.ui.settings() / core.ui.profile() で共通の画面。
   core.dict（辞書）・core.reader.open(story, opts)（読む画面）は全アプリ共通。 */
import { createSettings } from './settings.js';
import { createSpeech } from './speech.js';
import { createSound } from './sound.js';
import { createRights } from './rights.js';
import { createEvents } from './events.js';
import { createProfile } from './profile.js';
import { createUI } from './ui.js';
import { createHost } from './host.js';
import { createWallet } from './wallet.js';
import { createDict } from './dict.js';
import { createReader } from './reader.js';
import { createNotebook } from './notebook.js';
import { createRecord } from './record.js';
import { createDayLog } from './daylog.js';
import { createStudy } from './study.js';
import { importOld } from './import.js';
import { createMember } from './member.js';
import { createCloud } from './cloud.js';
import { ECON } from './economy.js';
import { createAI } from './ai.js';
import { createToday } from './today.js';
import { createUseit } from './useit.js';
import { createLevel } from './level.js';
import { createAdmin } from './admin.js';
import { createReview } from './review.js';
import { createMission } from './mission.js';
import './reader.css';
export function createCore(config) {
  const base = config.base || './';
  const core = { config, base };
  core.settings = createSettings(config.theme);
  core.speech = createSpeech(core.settings);
  core.sound = createSound(core.settings);
  core.rights = createRights(config.grants || []);
  core.events = createEvents();
  core.wallet = createWallet();       // 共通のコイン（2Dも3Dも同じ）
  core.member = createMember(core.wallet, { toast: t => core.ui && core.ui.toast(t) });   // 会員・ダイヤ・枠・1日の上限（数字は economy.js）
  core.profile = createProfile(core.events, base);
  // 終わった報告の点数から、ゲームのごほうびコイン（1日の上限つき。d.coins があればそれを希望の枚数に）
  core.events.on((game, name, d = {}) => { if (name === 'done' && (d.coins || d.score)) core.member.earn('game', d.coins != null ? d.coins : Math.round((+d.score || 0) / 10)); });
  core.cloud = createCloud(core.member);   // 共有の教材（いまは端末の中だけ。Supabase につなぐときは cloud.js の中だけ直す）
  core.openGame = null;   // アプリ(main.js)が入れる：(ゲームid, opts) → ゲームを開く
  core.notebook = createNotebook();   // 勉強ノート（全アプリ共通の言葉の置き場）
  importOld(core.notebook);           // 前から各アプリにあった言葉を1回だけ取り込む
  core.record = createRecord(core.events, core.notebook);   // 学習の記録（done・word・resume の報告をまとめる）
  core.daylog = createDayLog(core);   // 1日の記録(時間・カテゴリー・出会った単語)
  core.ui = createUI(core);
  core.study = createStudy(core);     // 勉強部屋（自宅・アバターから開く）
  core.econ = ECON;                   // お金と会員の数字（economy.js）
  core.ai = createAI();               // 自分のAIキー（3Dの町と同じキー）
  core.level = createLevel(core);     // レベル判定・実力テスト・総合の点数
  core.useit = createUseit(core);     // この言葉を使ってみる
  core.mission = createMission(core); // 今日なにする?(1つに決めて「これでいい?」→ その中身だけで判定)
  core.review = createReview(core);   // 1日のふりかえり(今日はここまで)・前回のふりかえり
  core.today = createToday(core);     // 結果の帯
  core.admin = createAdmin(core);     // 運営画面（?admin=1）
  core.to3D = null;                   // 3Dの町があるアプリ(街)が入れる
  core.dict = createDict(base);       // 共通の辞書（使うときに読み込む）
  core.reader = createReader(core);   // 共通の「読む画面」
  const layer = document.createElement('div'); layer.className = 'cs-layer'; layer.hidden = true;
  const back = document.createElement('button'); back.className = 'cs-back'; back.hidden = true; back.textContent = config.backLabel || '← もどる';
  document.body.append(layer, back);
  core.host = createHost(core, layer, back);
  return core;
}
