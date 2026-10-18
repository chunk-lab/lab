#!/usr/bin/env node
/* スマホ版（iPhone・Android）の包み方。Capacitor で、組み立てたWeb版を包む。
   使い方：  node build.mjs <アプリ>  →  node tools/cap.mjs <アプリ>
   できるもの：mobile/<アプリ>/（package.json・capacitor.config.json・www/＝dist/<アプリ>）
   そのあと mobile/<アプリ>/ で  npm install  →  npx cap add ios / android  →  npx cap sync  →  Xcode / Android Studio で開く
   ※ まだ試していない（この環境では npm のレジストリに届かず、Xcode・Android Studio もない）。
   ※ アプリの名前・ID（com.…）はまだ決まっていないので、下の NAMES は仮。ストアに出す前に、相談して決める。 */
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NAMES = {   // 仮の名前と ID（決まったら直す）
  town: ['チャンクタウン', 'com.example.chunk.town'], stream: ['チャンクストリーム', 'com.example.chunk.stream'],
  punichunk: ['ぷにチャンク', 'com.example.chunk.puni'], cards: ['チャンク・カード', 'com.example.chunk.cards'], eigonou: ['英語脳アプリ', 'com.example.chunk.eigonou']
};
const app = process.argv[2];
if (!app || !NAMES[app]) { console.error('使い方: node tools/cap.mjs <' + Object.keys(NAMES).join('|') + '>'); process.exit(1); }
const dist = path.join(ROOT, 'dist', app);
if (!fs.existsSync(path.join(dist, 'index.html'))) { console.error('先に  node build.mjs ' + app + '  で組み立ててください'); process.exit(1); }
const out = path.join(ROOT, 'mobile', app), www = path.join(out, 'www');
fs.rmSync(www, { recursive: true, force: true }); fs.mkdirSync(www, { recursive: true });
fs.cpSync(dist, www, { recursive: true, filter: s => !/artifact\.html$/.test(s) });
const [name, id] = NAMES[app];
fs.writeFileSync(path.join(out, 'capacitor.config.json'), JSON.stringify({ appId: id, appName: name, webDir: 'www', server: { androidScheme: 'https' }, ios: { contentInset: 'always' } }, null, 2) + '\n');
fs.writeFileSync(path.join(out, 'package.json'), JSON.stringify({ name: 'chunk-mobile-' + app, private: true, dependencies: { '@capacitor/core': '^6.0.0', '@capacitor/ios': '^6.0.0', '@capacitor/android': '^6.0.0' }, devDependencies: { '@capacitor/cli': '^6.0.0' } }, null, 2) + '\n');
console.log('できました: mobile/' + app + '/（www に dist/' + app + ' をコピー）。次：cd mobile/' + app + ' && npm install && npx cap add ios && npx cap add android && npx cap sync');
