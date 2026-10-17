// テスト用:src のロジック部分を Node で読み込む
const fs = require('fs'), vm = require('vm'), path = require('path');
module.exports = function (extra) {
  const files = ['util.js', 'dict_data.js', 'dict.js', 'grammar.js', 'seed_data.js', 'seeds.js', 'supply.js', 'game.js'].concat(extra || []);
  const ctx = { console, Math, Date, JSON }; vm.createContext(ctx);
  const src = files.filter(f => fs.existsSync(path.join(__dirname, '../src', f))).map(f => fs.readFileSync(path.join(__dirname, '../src', f), 'utf8')).join('\n;\n');
  vm.runInContext(src + '\n;this.__={U:typeof U!=="undefined"?U:null,Dict,G,DICT_DATA,Supply:typeof Supply!=="undefined"?Supply:null,Game:typeof Game!=="undefined"?Game:null,Seeds:typeof Seeds!=="undefined"?Seeds:null};', ctx, { filename: 'bundle.js' });
  return ctx.__;
};
