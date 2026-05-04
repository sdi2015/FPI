#!/usr/bin/env python3
"""Validate FPI-004 explainable risk scoring expected vs actual output."""
from __future__ import annotations

import json
from pathlib import Path

from risk_scoring import DEFAULT_SEED_PATH, load_seed, score_facility

ROOT = Path(__file__).resolve().parent
EXPECTED_PATH = ROOT / "expected_region75_score.json"


def fail(message: str) -> int:
    print(f"FPI scoring validation failed: {message}")
    return 2


def main() -> int:
    if not DEFAULT_SEED_PATH.exists():
        return fail(f"missing seed: {DEFAULT_SEED_PATH}")
    if not EXPECTED_PATH.exists():
        return fail(f"missing expected output: {EXPECTED_PATH}")

    expected = json.loads(EXPECTED_PATH.read_text(encoding="utf-8"))
    actual = score_facility(load_seed(DEFAULT_SEED_PATH))

    if actual["facility_id"] != expected["facility_id"]:
        return fail(f"facility_id expected {expected['facility_id']} but found {actual['facility_id']}")
    if actual["score"] != expected["expected_score"]:
        return fail(f"score expected {expected['expected_score']} but found {actual['score']}")
    if actual["tier"] != expected["expected_tier"]:
        return fail(f"tier expected {expected['expected_tier']} but found {actual['tier']}")

    top_labels = [item["label"] for item in actual["top_drivers"]]
    if top_labels != expected["expected_top_driver_labels"]:
        return fail(f"top drivers expected {expected['expected_top_driver_labels']} but found {top_labels}")

    positive_count = len([item for item in actual["contributions"] if item["points"] > 0])
    reducer_count = len(actual["risk_reducers"])
    if positive_count != expected["expected_positive_factor_count"]:
        return fail(f"positive factor count expected {expected['expected_positive_factor_count']} but found {positive_count}")
    if reducer_count != expected["expected_reducer_count"]:
        return fail(f"reducer count expected {expected['expected_reducer_count']} but found {reducer_count}")

    for contribution in actual["contributions"]:
        if not contribution["label"] or not contribution["explanation"]:
            return fail(f"contribution {contribution['factor_id']} needs label and explanation")
        if not isinstance(contribution["points"], int):
            return fail(f"contribution {contribution['factor_id']} points must be an integer")

    print("FPI scoring validation passed.")
    print(f"- facility: {actual['display_name']}")
    print(f"- expected score/tier: {expected['expected_score']} / {expected['expected_tier']}")
    print(f"- actual score/tier: {actual['score']} / {actual['tier']}")
    print(f"- visible factors: {len(actual['contributions'])}")
    print("- top drivers:")
    for driver in actual["top_drivers"]:
        print(f"  - {driver['label']}: +{driver['points']} ({driver['explanation']})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
