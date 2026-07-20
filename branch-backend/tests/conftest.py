from __future__ import annotations

import sys
from pathlib import Path

BRANCH_ROOT = Path(__file__).resolve().parents[1]
for name in list(sys.modules):
    if name == "app" or name.startswith("app."):
        sys.modules.pop(name, None)
if str(BRANCH_ROOT) not in sys.path:
    sys.path.insert(0, str(BRANCH_ROOT))
