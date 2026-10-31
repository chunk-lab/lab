/* ゲームの一覧（id → ゲーム）。新しいゲームはここに足して、series.config.mjs にファイルを書く */
import punichunk from './punichunk/game.js';
import cards from './cards/game.js';
import stream from './stream/game.js';
import chunkchunk from './chunkchunk/game.js';
import eigonou from './eigonou/game.js';
import library from './library/game.js';
import listen from './listen/game.js';
export const GAMES = { punichunk, cards, stream, chunkchunk, eigonou, library, listen };
