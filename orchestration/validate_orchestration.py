#!/usr/bin/env python3
"""Validate FPI-005 local remediation orchestration expected vs actual output."""
from __future__ import annotations

import json
from pathlib import Path

from remediation_orchestrator import ADAPTER_MODE, SCORING_OUTPUT_PATH, SEED_PATH, build_actions, load_json

ROOT = Path(__file__).resolve().parent
EXPECTED_PATH = ROOT / "expected_region75_actions.json"
FORBIDDEN_MARKERS = [
    "password",
    "token",
    "secret",
    "credential",
    "production url",
    "prod url",
    "law enforcement contact",
]


def fail(message: str) -> int:
    print(f"FPI orchestration validation failed: {message}")
    return 2


def main() -> int:
    for path in [SEED_PATH, SCORING_OUTPUT_PATH, EXPECTED_PATH]:
        if not path.exists():
            return fail(f"missing required file: {path}")

    seed = load_json(SEED_PATH)
    scoring = load_json(SCORING_OUTPUT_PATH)
    expected = load_json(EXPECTED_PATH)
    actual = build_actions(seed, scoring)

    raw_text = json.dumps(actual).lower()
    for marker in FORBIDDEN_MARKERS:
        if marker in raw_text:
            return fail(f"forbidden marker found in orchestration output: {marker}")

    if actual["facility_id"] != expected["facility_id"]:
        return fail(f"facility_id expected {expected['facility_id']} but found {actual['facility_id']}")
    if actual["source_score"] != expected["expected_source_score"]:
        return fail(f"source_score expected {expected['expected_source_score']} but found {actual['source_score']}")
    if actual["source_tier"] != expected["expected_source_tier"]:
        return fail(f"source_tier expected {expected['expected_source_tier']} but found {actual['source_tier']}")
    if actual["adapter_mode"] != expected["expected_adapter_mode"] or actual["adapter_mode"] != ADAPTER_MODE:
        return fail("adapter_mode must remain Local Draft Only")

    actions = actual["draft_actions"]
    if len(actions) != expected["expected_action_count"]:
        return fail(f"action count expected {expected['expected_action_count']} but found {len(actions)}")

    for index, expected_action in enumerate(expected["expected_actions"]):
        action = actions[index]
        for key, expected_value in expected_action.items():
            if action.get(key) != expected_value:
                return fail(f"action {index + 1} {key} expected {expected_value!r} but found {action.get(key)!r}")
        if action.get("status") != "Draft":
            return fail(f"action {action['action_id']} must remain Draft")
        if action.get("verification_required") is not expected["expected_verification_required"]:
            return fail(f"action {action['action_id']} verification_required mismatch")
        if action.get("adapter_mode") != ADAPTER_MODE:
            return fail(f"action {action['action_id']} adapter_mode must remain {ADAPTER_MODE}")
        if not action.get("recommended_next_step"):
            return fail(f"action {action['action_id']} needs a recommended_next_step")
        if "Synthetic draft only" not in action.get("guardrail_note", ""):
            return fail(f"action {action['action_id']} needs synthetic-only guardrail note")

    print("FPI orchestration validation passed.")
    print(f"- facility: {actual['display_name']}")
    print(f"- source score/tier: {actual['source_score']} / {actual['source_tier']}")
    print(f"- draft actions: {len(actions)}")
    for action in actions:
        print(f"  - {action['action_id']}: {action['title']} | {action['priority']} | {action['owner_role']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
