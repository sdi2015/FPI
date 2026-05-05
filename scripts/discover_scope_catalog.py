#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FOUNDRY_PACK = ROOT.parent.parent

json_files = [p for p in FOUNDRY_PACK.rglob("*.json") if p.is_file() and p.stat().st_size < 30_000_000]

regions: set[str] = set()
stores: set[str] = set()

region_like = re.compile(r"(region|market)", re.I)
store_like = re.compile(r"(store|facility|site)", re.I)


def walk(obj):
    if isinstance(obj, dict):
        for key, value in obj.items():
            key_l = key.lower()
            if isinstance(value, str):
                val = value.strip()
                if val:
                    if key_l in {"region", "region_code", "region_name", "market", "facility_context"} or region_like.search(key_l):
                        if len(val) <= 80:
                            regions.add(val)
                    if key_l in {"store", "store_id", "facility_id", "site_id", "name", "display_name", "reference_code", "id"} or store_like.search(key_l):
                        if len(val) <= 100 and any(ch.isdigit() for ch in val):
                            stores.add(val)
            walk(value)
    elif isinstance(obj, list):
        for item in obj:
            walk(item)


for file_path in json_files:
    try:
        data = json.loads(file_path.read_text(encoding="utf-8"))
    except Exception:
        continue
    walk(data)

regions = {
    r for r in regions
    if r.lower() not in {"local json", "future adapter placeholder", "region"}
    and not r.lower().startswith("synthetic://")
}
stores = {s for s in stores if not s.lower().startswith("synthetic://")}

payload = {
    "scanned_json_files": len(json_files),
    "regions": sorted(regions),
    "stores_or_facilities": sorted(stores),
}

out = ROOT / "data" / "integration" / "scope-catalog-discovered.json"
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

print(f"Scanned JSON files: {len(json_files)}")
print(f"Regions discovered: {len(regions)}")
print(f"Stores/facilities discovered: {len(stores)}")
print(f"Wrote: {out}")
