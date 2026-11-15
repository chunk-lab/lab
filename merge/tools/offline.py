"""Refresh the file:// data snapshot after editing data/*.json."""
import json
from pathlib import Path
root = Path(__file__).resolve().parents[1]
path = root / 'index.html'
a, rest = path.read_text().split('<!-- OFFLINE_DATA -->')
_, b = rest.split('<!-- /OFFLINE_DATA -->')
data = {p.stem: json.loads(p.read_text()) for p in sorted((root/'data').glob('*.json'))}
raw = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('<', r'\u003c')
path.write_text(a+'<!-- OFFLINE_DATA --><script type="application/json" id="mg-offline">'+raw+'</script><!-- /OFFLINE_DATA -->'+b)
