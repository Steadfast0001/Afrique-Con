from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def _configure_for_path(path: Path) -> None:
    """Ensure the correct service root is in sys.path before importing app modules."""
    path = path.resolve()
    # Clear any cached 'app' modules to avoid importing the wrong service's app
    for name in list(sys.modules):
        if name == "app" or name.startswith("app."):
            sys.modules.pop(name, None)
    
    # Add the appropriate service root to sys.path
    if path.is_relative_to(ROOT / "branch-backend"):
        branch_root = ROOT / "branch-backend"
        if str(branch_root) not in sys.path:
            sys.path.insert(0, str(branch_root))
    elif path.is_relative_to(ROOT / "gateway"):
        gateway_root = ROOT / "gateway"
        if str(gateway_root) not in sys.path:
            sys.path.insert(0, str(gateway_root))


def pytest_configure(config):
    """Configure paths early for each testpath."""
    if config.option.collectonly:
        return
    # Don't modify paths in pytest_configure; let the service conftests handle it

