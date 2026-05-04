#!/usr/bin/env python3
"""Explainable local risk scoring for the FPI synthetic Store WS-X38 demo.

This module intentionally has no third-party dependencies and does not call live
systems. It converts the FPI-002 canonical seed into a scored, explainable risk
summary that can be inspected by UI, QA, and demo owners.
"""
from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SEED_PATH = ROOT / "data" / "seed" / "fpi-seed-wsx38.json"

TIER_THRESHOLDS = [
    (85, "Critical"),
    (70, "Elevated"),
    (45, "Guarded"),
    (20, "Low"),
    (0, "Low"),
]

TECH_STATUS_POINTS = {
    "Critical": 18,
    "Degraded": 14,
    "Warning": 10,
    "Unknown": 8,
    "Normal": 0,
    "Not Applicable": 0,
}

SOURCE_FRESHNESS_POINTS = {
    "Stale": 8,
    "Aging": 6,
    "Unknown": 4,
    "Current": 0,
}

EVIDENCE_STATUS_POINTS = {
    "Missing": 16,
    "Rejected": 14,
    "Attached": 4,
    "Verified": -6,
}

REMEDIATION_STATUS_POINTS = {
    "Open": 8,
    "In Progress": 5,
    "Blocked": 12,
    "Ready for Verification": 3,
    "Reopened": 10,
    "Closed": -4,
}

INCIDENT_SEVERITY_POINTS = {
    "High": 10,
    "Medium": 5,
    "Low": 2,
}

BASELINE_POINTS = 25


@dataclass(frozen=True)
class Contribution:
    factor_id: str
    label: str
    points: int
    explanation: str
    source_ids: list[str]

    def to_dict(self) -> dict[str, Any]:
        return {
            "factor_id": self.factor_id,
            "label": self.label,
            "points": self.points,
            "explanation": self.explanation,
            "source_ids": self.source_ids,
        }


def tier_for_score(score: int) -> str:
    for threshold, tier in TIER_THRESHOLDS:
        if score >= threshold:
            return tier
    return "Low"


def clamp_score(score: int) -> int:
    return max(0, min(100, score))


def score_facility(seed: dict[str, Any], facility_id: str | None = None) -> dict[str, Any]:
    facilities = seed.get("facilities") or []
    if not facilities:
        raise ValueError("seed must include at least one facility")

    facility = facilities[0] if facility_id is None else next(
        item for item in facilities if item.get("facility_id") == facility_id
    )
    facility_id = facility["facility_id"]

    issues = [item for item in seed.get("technology_issues", []) if item.get("facility_id") == facility_id]
    evidence = [item for item in seed.get("evidence", []) if item.get("facility_id") == facility_id]
    remediations = [item for item in seed.get("remediations", []) if item.get("facility_id") == facility_id]
    incidents = [item for item in seed.get("incidents", []) if item.get("facility_id") == facility_id]
    sources = {item["source_id"]: item for item in seed.get("source_freshness", [])}

    contributions: list[Contribution] = [
        Contribution(
            factor_id="baseline-demo-context",
            label="Baseline facility protection context",
            points=BASELINE_POINTS,
            explanation="Starting point for the synthetic Store WS-X38 MVP risk profile.",
            source_ids=[],
        )
    ]

    for issue in issues:
        points = TECH_STATUS_POINTS.get(issue.get("status"), 0)
        if points:
            contributions.append(
                Contribution(
                    factor_id=f"technology-{issue['issue_id']}",
                    label=f"{issue['domain']} is {issue['status']}",
                    points=points,
                    explanation=issue["summary"],
                    source_ids=[issue["source_id"]],
                )
            )

    for record in evidence:
        points = EVIDENCE_STATUS_POINTS.get(record.get("status"), 0)
        if points:
            contributions.append(
                Contribution(
                    factor_id=f"evidence-{record['evidence_id']}",
                    label=f"{record['evidence_type']} evidence is {record['status']}",
                    points=points,
                    explanation=record["synthetic_note"],
                    source_ids=[],
                )
            )

    for remediation in remediations:
        points = REMEDIATION_STATUS_POINTS.get(remediation.get("status"), 0)
        if points:
            verification_note = " Verification is required before risk reduction." if remediation.get("verification_required") else ""
            contributions.append(
                Contribution(
                    factor_id=f"remediation-{remediation['remediation_id']}",
                    label=f"{remediation['title']} is {remediation['status']}",
                    points=points,
                    explanation=f"Owner role: {remediation['owner_role']}.{verification_note}",
                    source_ids=["src-remediation-local"],
                )
            )

    for incident in incidents:
        points = INCIDENT_SEVERITY_POINTS.get(incident.get("severity"), 0)
        if points:
            contributions.append(
                Contribution(
                    factor_id=f"incident-{incident['incident_id']}",
                    label=f"Recent {incident['severity']} incident context",
                    points=points,
                    explanation=incident["synthetic_summary"],
                    source_ids=[],
                )
            )

    for source_id, source in sources.items():
        points = SOURCE_FRESHNESS_POINTS.get(source.get("freshness_status"), 0)
        if points:
            contributions.append(
                Contribution(
                    factor_id=f"freshness-{source_id}",
                    label=f"{source['source_label']} freshness is {source['freshness_status']}",
                    points=points,
                    explanation=f"Adapter mode: {source['adapter_mode']}. Last demo update: {source['last_demo_update']}.",
                    source_ids=[source_id],
                )
            )

    raw_score = sum(item.points for item in contributions)
    score = clamp_score(raw_score)
    driver_candidates = [
        item for item in contributions
        if item.points > 0 and item.factor_id != "baseline-demo-context"
    ]
    positive = sorted(driver_candidates, key=lambda item: item.points, reverse=True)
    reductions = sorted((item for item in contributions if item.points < 0), key=lambda item: item.points)

    return {
        "facility_id": facility_id,
        "display_name": facility["display_name"],
        "score": score,
        "raw_score": raw_score,
        "tier": tier_for_score(score),
        "confidence": "Medium",
        "scoring_version": "2026-05-04.fpi-004.local-v1",
        "contributions": [item.to_dict() for item in contributions],
        "top_drivers": [item.to_dict() for item in positive[:3]],
        "risk_reducers": [item.to_dict() for item in reductions],
    }


def load_seed(path: Path = DEFAULT_SEED_PATH) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    result = score_facility(load_seed())
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
