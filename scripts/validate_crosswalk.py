#!/usr/bin/env python3
"""Validate task-to-store crosswalk completeness for integrated workspace data."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CROSSWALK_PATH = ROOT / "data" / "integration" / "facility-crosswalk.json"
JACOB_PATH = ROOT / "data" / "integration" / "jacob-union-slice.json"
SCOPE_PATH = ROOT / "data" / "integration" / "scope-catalog-ui.json"


def fail(message: str) -> int:
    print(f"Crosswalk validation failed: {message}")
    return 2


def main() -> int:
    for path in [CROSSWALK_PATH, JACOB_PATH, SCOPE_PATH]:
        if not path.exists():
            return fail(f"missing required file: {path.relative_to(ROOT)}")

    crosswalk = json.loads(CROSSWALK_PATH.read_text(encoding="utf-8"))
    jacob = json.loads(JACOB_PATH.read_text(encoding="utf-8"))
    scope = json.loads(SCOPE_PATH.read_text(encoding="utf-8"))

    entries = crosswalk.get("entries") or []
    unmapped = crosswalk.get("unmapped") or []
    tasks = jacob.get("task_queue") or []
    scopes = scope.get("scopes") or []

    if unmapped:
        sample = ", ".join(str(item.get("task_id")) for item in unmapped[:5])
        return fail(f"found {len(unmapped)} unmapped task(s): {sample}")

    if len(entries) < len(tasks):
        return fail(f"mapped entries ({len(entries)}) are less than task queue size ({len(tasks)})")

    scope_ids = {item.get("id") for item in scopes}
    missing_scope_links = [item for item in entries if item.get("scope_id") not in scope_ids]
    if missing_scope_links:
        sample = ", ".join(str(item.get("task_id")) for item in missing_scope_links[:5])
        return fail(f"crosswalk entries point to missing scope_id for task(s): {sample}")

    missing_task_site = [task for task in tasks if not task.get("site_id") or not task.get("scope_id")]
    if missing_task_site:
        sample = ", ".join(str(item.get("task_id")) for item in missing_task_site[:5])
        return fail(f"jacob task_queue has unmapped site_id/scope_id for task(s): {sample}")

    print("Crosswalk validation passed.")
    print(f"- mapped tasks: {len(entries)}")
    print(f"- jacob tasks: {len(tasks)}")
    print(f"- scopes available: {len(scopes)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
