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
import { createStudy } from './study.js';
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
  core.profile = createProfile(core.events, base);
  core.notebook = createNotebook();   // 勉強ノート（全アプリ共通の言葉の置き場）
  core.record = createRecord(core.events, core.notebook);   // 学習の記録（done・word・resume の報告をまとめる）
  core.ui = createUI(core);
  core.study = createStudy(core);     // 勉強部屋（自宅・アバターから開く）
  core.dict = createDict(base);       // 共通の辞書（使うときに読み込む）
  core.reader = createReader(core);   // 共通の「読む画面」
  const layer = document.createElement('div'); layer.className = 'cs-layer'; layer.hidden = true;
  const back = document.createElement('button'); back.className = 'cs-back'; back.hidden = true; back.textContent = config.backLabel || '← もどる';
  document.body.append(layer, back);
  core.host = createHost(core, layer, back);
  return core;
}
