// イベント進行だけを保存する。ゲーム・財布・プロフィールの保存には触らない。
export function createEpisodeProgress(store, episode) {
  const valid = s => s && s.version === 1 && Number.isInteger(s.index) && s.index >= 0 && s.index < episode.steps.length;
  const fresh = () => ({ version: 1, index: 0, completed: false, mode: '3d', passed: false });
  let state = store.get(episode.id);
  state = valid(state) ? { ...fresh(), ...state } : fresh();
  const save = () => store.set(episode.id, { ...state });
  return {
    get state() { return { ...state }; },
    get step() { return episode.steps[state.index]; },
    mode(mode) { if (mode !== '2d' && mode !== '3d') return; state.mode = mode; save(); },
    accept(game, name, data = {}) {
      const s = episode.steps[state.index], m = s.match;
      if (s.type !== 'game' || game !== s.game || !m || name !== m.name) return false;
      if (Object.entries(m).some(([k, v]) => k !== 'name' && data[k] !== v)) return false;
      if (name === 'done' && data.finished !== true) return false;
      state.passed = true; save(); return true;
    },
    next() {
      if (episode.steps[state.index].type === 'game' && !state.passed) return false;
      if (state.index >= episode.steps.length - 1) return false;
      state.index++; state.passed = false; save(); return true;
    },
    complete() { if (episode.steps[state.index].type !== 'door') return false; state.completed = true; save(); return true; },
    restart() { const mode = state.mode; state = { ...fresh(), mode }; save(); },
  };
}
