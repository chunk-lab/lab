/* チャンクストーリー（読む・聞く方のチュートリアル）。7章：主役→＝/うごき→土台→順番→おまけタグ→説明シール→全体マップ
   中身は src/story/（chunkstory.js＝台本と仕組み、chunkstory.css＝見た目。クラス名は全部 cs- 付き）。
   街での使い方：const st = createStory({ base, store, report, onOpen, onClose })。開く＝st.open()、片づけ＝st.destroy()
   進み具合はこのゲームのセーブ（key: story）。報酬（コイン等）は、数字が決まるまでは付けず、できごと（story_clear など）を知らせるだけ */
import './story/chunkstory.js';
import './story/chunkstory.css';
import { lessonList, lessonResults } from './story/lessonmap.js';
import { startLesson } from './engine.js';
export function createStory(HOST) {
  const root = document.createElement('div'); root.className = 'ccStoryApp'; root.hidden = true;
  const host = document.createElement('div'); host.style.cssText = 'height:100%'; root.appendChild(host);
  const css = document.createElement('style');
  css.textContent = '.ccStoryApp{position:fixed;inset:0;z-index:75;background:#fbf1f6;overflow:hidden}.ccStoryApp[hidden]{display:none}';
  document.head.appendChild(css); document.body.appendChild(root);
  const rep = (k, d) => { try { HOST.report && HOST.report(k, d); } catch (e) { } };
  function open() {
    root.hidden = false; HOST.onOpen && HOST.onOpen();
    window.ChunkStory.mount(host, {
      save: p => HOST.store.set('story', p),
      load: () => { try { const v = HOST.store.get('story'); return typeof v === 'string' ? JSON.parse(v) : v; } catch (e) { return null; } },
      onUnlock: key => rep('story_unlock', { key }),
      onChapterClear: (no, r) => rep('story_clear', { chapter: no, pct: r && r.pct, firstClear: r && r.firstClear }),
      // 切る場面は、チャンクチャンク本体のチャレンジ（自分で横に流して切る）で遊ぶ。「order」の場面や、対応表にない文は、今までの簡易版
      onStage: (st, ch, finish) => {
        const list = st.type === 'cut' ? lessonList(st.items) : null; if (!list) return false;
        root.hidden = true;
        startLesson(list, '第' + ch.no + '章 ' + (st.title || ''),
          res => { root.hidden = false; finish(lessonResults(res)); },
          () => { root.hidden = false; try { window.ChunkStory.openMap(); } catch (e) { } });
        return true;
      },
      onFinish: () => close(), onExit: () => close(),
      assets: { base: HOST.base + 'img/chara/', ext: '.webp' }
    });
  }
  function close() { try { window.ChunkStory.unmount(); } catch (e) { } root.hidden = true; HOST.onClose && HOST.onClose(); }
  function destroy() { try { window.ChunkStory.unmount(); } catch (e) { } try { root.remove(); css.remove(); } catch (e) { } }
  return { open, close, visible: () => !root.hidden, destroy };
}
