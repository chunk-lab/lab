(() => {
  if ('MergeBridge' in window) return;
  const prefix = 'cs:merge:mock:';
  const read = (key, initial) => JSON.parse(localStorage.getItem(prefix + key) ?? JSON.stringify(initial));
  const write = (key, value) => localStorage.setItem(prefix + key, JSON.stringify(value));
  const valid = n => { if (!Number.isSafeInteger(n) || n < 0) throw new RangeError('amount'); };
  const wallet = key => ({
    get: () => read(key, 0),
    add(n) { valid(n); write(key, this.get() + n); },
    spend(n) { valid(n); if (this.get() < n) return false; write(key, this.get() - n); return true; }
  });
  const increase = (key, id, n) => { valid(n); const values = read(key, {}); values[id] = (values[id] || 0) + n; write(key,values); };
  const day = () => new Date().toLocaleDateString('sv-SE');
  window.MergeBridge = {
    coins:wallet('coins'), gems:wallet('gems'),
    items:{get:() => read('items',{}), add:(id,n) => increase('items',id,n)},
    affection:{get:id => read('affection',{})[id] || 0, add:(id,n) => increase('affection',id,n)},
    english:{solvedToday:() => read('english',{} )[day()] || 0}
  };
  /* Isolated test fixture. The production bridge never sees this control. */
  window.MGPractice = {answer:() => { const d=day(); write('english',{[d]:window.MergeBridge.english.solvedToday()+1}); }};
})();
