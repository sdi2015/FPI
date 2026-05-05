#!/usr/bin/env python3
"""No-dependency smoke check for the FPI active build baseline."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REQUIRED_FILES = [
    ROOT / "README.md",
    ROOT / "index.html",
    ROOT / "assets" / "styles.css",
    ROOT / "assets" / "app.js",
    ROOT / "data" / "fpi-demo-data.json",
    ROOT / "data" / "seed" / "fpi-seed-region75.json",
]


def main() -> int:
    missing = [str(path.relative_to(ROOT)) for path in REQUIRED_FILES if not path.exists()]
    if missing:
        print("FPI baseline validation failed: missing required files")
        for path in missing:
            print(f"- {path}")
        return 2

    data_path = ROOT / "data" / "fpi-demo-data.json"
    data = json.loads(data_path.read_text(encoding="utf-8"))
    if data.get("data_mode") != "synthetic_demo_only":
        print("FPI baseline validation failed: data_mode must be synthetic_demo_only")
        return 2

    facilities = data.get("facilities") or []
    if not facilities or facilities[0].get("facility_id") != "region-75":
        print("FPI baseline validation failed: synthetic Region 75 record not found")
        return 2

    index_text = (ROOT / "index.html").read_text(encoding="utf-8")
    required_markers = [
        "Walmart | Facility Protection Intelligence",
        "See It. Score It. Solve It. Secure It.",
        "Store WS-X38",
        "assets/app.js",
        "assets/styles.css",
    ]
    missing_markers = [marker for marker in required_markers if marker not in index_text]
    if missing_markers:
        print("FPI baseline validation failed: index.html missing required markers")
        for marker in missing_markers:
            print(f"- {marker}")
        return 2

    app_text = (ROOT / "assets" / "app.js").read_text(encoding="utf-8")
    if "data/seed/fpi-seed-region75.json" not in app_text:
        print("FPI baseline validation failed: dashboard is not bound to canonical Region 75 seed")
        return 2

    print("FPI baseline validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
