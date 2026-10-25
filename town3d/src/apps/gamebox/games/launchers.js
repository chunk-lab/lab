// ゲーム機から「町の中」で遊ぶもの(雪合戦3D・釣り対戦・ゴルフ・フリスビー)。ゲーム機をとじて、町の側で始める
const go = what => ctx => { ctx.emit('launch', { what, from: ctx.params && ctx.params.from }); ctx.close(); };   // 家から来たときは、終わったら家にもどる
export const snow3d = { id: 'snow3d', title: '雪合戦3D', icon: '🏔️', desc: '町のどこかで2対2', launch: go('snow3d') };
export const fishvs = { id: 'fishvs', title: '釣り対戦', icon: '🎣', desc: '砂吹さんの池で釣り勝負', launch: ctx => ctx.open('fishing', { vs: 'easy', any: 1, from: ctx.params && ctx.params.from }) };
export const golf = { id: 'golf', title: 'ミニゴルフ', icon: '⛳', desc: '町がコース。毎日かわる', launch: go('golf') };
export const frisbee = { id: 'frisbee', title: 'フリスビー', icon: '🥏', desc: '町がコース。毎日かわる', launch: go('frisbee') };
