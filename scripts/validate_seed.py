#!/usr/bin/env python3
"""No-dependency validation for the FPI-002 canonical synthetic seed."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SEED_PATH = ROOT / "data" / "seed" / "fpi-seed-wsx38.json"
SCHEMA_PATH = ROOT / "data" / "schema" / "fpi-canonical.schema.json"

ALLOWED_SYSTEM_STATUSES = {"Normal", "Warning", "Degraded", "Critical", "Unknown", "Not Applicable"}
REQUIRED_TOP_LEVEL = {
    "classification",
    "data_mode",
    "dataset_version",
    "facilities",
    "risk_assessments",
    "technology_issues",
    "incidents",
    "remediations",
    "evidence",
    "source_freshness",
}


def fail(message: str) -> int:
    print(f"FPI seed validation failed: {message}")
    return 2


def main() -> int:
    if not SEED_PATH.exists():
        return fail(f"missing seed file: {SEED_PATH.relative_to(ROOT)}")
    if not SCHEMA_PATH.exists():
        return fail(f"missing schema file: {SCHEMA_PATH.relative_to(ROOT)}")

    seed = json.loads(SEED_PATH.read_text(encoding="utf-8"))
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    if schema.get("title") != "FPI Canonical Synthetic Demo Dataset":
        return fail("schema title is missing or incorrect")

    missing = sorted(REQUIRED_TOP_LEVEL - set(seed))
    if missing:
        return fail(f"missing top-level keys: {', '.join(missing)}")

    if seed.get("classification") != "Walmart Internal / Need-to-Know - Draft":
        return fail("classification marker is missing or incorrect")
    if seed.get("data_mode") != "synthetic_demo_only":
        return fail("data_mode must be synthetic_demo_only")

    facilities = seed.get("facilities") or []
    if len(facilities) != 1:
        return fail("expected exactly one mock facility for MVP seed")

    facility = facilities[0]
    expected_facility = {
        "facility_id": "store-wsx38",
        "store_code": "WS-X38",
        "reference_code": "WS-X38",
        "display_name": "Store WS-X38",
        "mock_location": "Richland, VA",
    }
    for key, expected in expected_facility.items():
        if facility.get(key) != expected:
            return fail(f"facility.{key} expected {expected!r} but found {facility.get(key)!r}")

    facility_ids = {item["facility_id"] for item in facilities}
    remediation_ids = {item["remediation_id"] for item in seed["remediations"]}
    issue_ids = {item["issue_id"] for item in seed["technology_issues"]}
    source_ids = {item["source_id"] for item in seed["source_freshness"]}

    for collection_name in ["risk_assessments", "technology_issues", "incidents", "remediations", "evidence"]:
        for item in seed[collection_name]:
            if item.get("facility_id") not in facility_ids:
                return fail(f"{collection_name} item references unknown facility_id: {item.get('facility_id')}")

    for issue in seed["technology_issues"]:
        if issue.get("status") not in ALLOWED_SYSTEM_STATUSES:
            return fail(f"technology issue {issue.get('issue_id')} has invalid status {issue.get('status')!r}")
        source_id = issue.get("source_id")
        if source_id not in source_ids:
            return fail(f"technology issue {issue.get('issue_id')} references unknown source_id {source_id!r}")
        remediation_id = issue.get("creates_remediation_id")
        if remediation_id != "none" and remediation_id not in remediation_ids:
            return fail(f"technology issue {issue.get('issue_id')} references unknown remediation {remediation_id!r}")

    for remediation in seed["remediations"]:
        for issue_id in remediation.get("related_issue_ids", []):
            if issue_id not in issue_ids:
                return fail(f"remediation {remediation.get('remediation_id')} references unknown issue {issue_id!r}")
        if remediation.get("verification_required") is not True:
            return fail(f"remediation {remediation.get('remediation_id')} must require verification")

    for evidence in seed["evidence"]:
        if evidence.get("remediation_id") not in remediation_ids:
            return fail(f"evidence {evidence.get('evidence_id')} references unknown remediation")

    for risk in seed["risk_assessments"]:
        if not 0 <= risk.get("score", -1) <= 100:
            return fail(f"risk {risk.get('risk_id')} score must be between 0 and 100")
        if not risk.get("top_drivers"):
            return fail(f"risk {risk.get('risk_id')} must include top_drivers")
        for driver in risk["top_drivers"]:
            if driver.get("source_id") not in source_ids:
                return fail(f"risk driver {driver.get('driver_id')} references unknown source")
            if not driver.get("recommended_action"):
                return fail(f"risk driver {driver.get('driver_id')} needs a recommended_action")

    print("FPI seed validation passed.")
    print(f"- facility: {facility['display_name']} / {facility['mock_location']}")
    print(f"- risk assessments: {len(seed['risk_assessments'])}")
    print(f"- technology issues: {len(seed['technology_issues'])}")
    print(f"- remediations: {len(seed['remediations'])}")
    print(f"- evidence records: {len(seed['evidence'])}")
    print(f"- source freshness records: {len(seed['source_freshness'])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
