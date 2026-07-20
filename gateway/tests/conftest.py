from __future__ import annotations

import sys
from pathlib import Path

GATEWAY_ROOT = Path(__file__).resolve().parents[1]
for name in list(sys.modules):
    if name == "app" or name.startswith("app."):
        sys.modules.pop(name, None)
if str(GATEWAY_ROOT) not in sys.path:
    sys.path.insert(0, str(GATEWAY_ROOT))
