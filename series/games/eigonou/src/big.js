/* 大きい辞書（約2.9万語）。中身は全アプリ共通の data/dict/big.js（共通の辞書の材料と同じもの） */
import { BIGT as B } from '../../../data/dict/big.js';
export let BIGT;
export function init_big() { BIGT = B; }
