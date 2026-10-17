/* ゲームの一覧（id → ゲーム）。新しいゲームはここに足して、series.config.mjs にファイルを書く */
import punichunk from './cb/game-punichunk.js';
import cards from './cb/game-cards.js';
import stream from './stream/game.js';
import chunkchunk from './chunkchunk/game.js';
export const GAMES = { punichunk, cards, stream, chunkchunk };
