#!/usr/bin/env python3
"""Local remediation orchestration drafts for the FPI Store WS-X38 demo.

This module converts explainable risk drivers into draft remediation/work items.
It is intentionally local-only: no live integrations, no credentials, and no
writes to production systems.
"""
from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
SEED_PATH = ROOT / "data" / "seed" / "fpi-seed-wsx38.json"
SCORING_OUTPUT_PATH = ROOT / "scoring" / "scoring-output-wsx38.json"

ADAPTER_MODE = "Local Draft Only"
GUARDRAIL_NOTE = "Synthetic draft only. Do not send to live work management, vendor, alarm, VMS, or compliance systems."

OWNER_BY_FACTOR_PREFIX = {
    "evidence-": "Fire/Life Safety",
    "technology-tech-vms": "Security Technology",
    "technology-tech-fire": "Fire/Life Safety",
    "remediation-": "Field Operations",
    "freshness-": "Integration / Data Services",
    "incident-": "Enterprise Security Intelligence",
}

ACTION_BY_FACTOR_PREFIX = {
    "evidence-": "Attach and verify synthetic evidence",
    "technology-tech-vms": "Review synthetic VMS health degradation",
    "technology-tech-fire": "Review synthetic fire alarm health signal",
    "remediation-": "Advance remediation toward verification",
    "freshness-": "Refresh local synthetic source snapshot",
    "incident-": "Review incident context for risk linkage",
}

PRIORITY_BY_POINTS = [
    (16, "P1-Critical"),
    (10, "P2-High"),
    (5, "P3-Medium"),
    (0, "P4-Low"),
]


@dataclass(frozen=True)
class DraftAction:
    action_id: str
    facility_id: str
    title: str
    source_factor_id: str
    source_label: str
    priority: str
    owner_role: str
    status: str
    verification_required: bool
    adapter_mode: str
    recommended_next_step: str
    guardrail_note: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "action_id": self.action_id,
            "facility_id": self.facility_id,
            "title": self.title,
            "source_factor_id": self.source_factor_id,
            "source_label": self.source_label,
            "priority": self.priority,
            "owner_role": self.owner_role,
            "status": self.status,
            "verification_required": self.verification_required,
            "adapter_mode": self.adapter_mode,
            "recommended_next_step": self.recommended_next_step,
            "guardrail_note": self.guardrail_note,
        }


def priority_for_points(points: int) -> str:
    for threshold, priority in PRIORITY_BY_POINTS:
        if points >= threshold:
            return priority
    return "P4-Low"


def value_for_factor(prefix_map: dict[str, str], factor_id: str, default: str) -> str:
    for prefix, value in prefix_map.items():
        if factor_id.startswith(prefix):
            return value
    return default


def action_title(driver: dict[str, Any]) -> str:
    base = value_for_factor(ACTION_BY_FACTOR_PREFIX, driver["factor_id"], "Review synthetic risk driver")
    if driver["factor_id"].startswith("evidence-") and "fire" in driver["factor_id"]:
        return "Attach synthetic fire alarm test evidence"
    return base


def recommended_next_step(driver: dict[str, Any]) -> str:
    label = driver["label"].lower()
    if "evidence" in label and "missing" in label:
        return "Collect demo-safe evidence placeholder, attach it to the local remediation draft, and route for verification."
    if "camera" in label or "vms" in label:
        return "Assign Security Technology owner to review the synthetic VMS health signal and document verification evidence."
    if "fire alarm" in label:
        return "Assign Fire/Life Safety owner to verify the synthetic fire alarm status and confirm evidence requirements."
    return "Review the synthetic driver, assign an owner, and require verification before closure."


def build_actions(seed: dict[str, Any], scoring: dict[str, Any]) -> dict[str, Any]:
    facility_id = scoring["facility_id"]
    facility = next(item for item in seed["facilities"] if item["facility_id"] == facility_id)
    actions: list[DraftAction] = []

    for index, driver in enumerate(scoring.get("top_drivers", []), start=1):
        factor_id = driver["factor_id"]
        actions.append(
            DraftAction(
                action_id=f"draft-wsx38-{index:03d}",
                facility_id=facility_id,
                title=action_title(driver),
                source_factor_id=factor_id,
                source_label=driver["label"],
                priority=priority_for_points(driver["points"]),
                owner_role=value_for_factor(OWNER_BY_FACTOR_PREFIX, factor_id, "Field Operations"),
                status="Draft",
                verification_required=True,
                adapter_mode=ADAPTER_MODE,
                recommended_next_step=recommended_next_step(driver),
                guardrail_note=GUARDRAIL_NOTE,
            )
        )

    return {
        "classification": "Walmart Internal / Need-to-Know - Draft",
        "data_mode": "synthetic_demo_only",
        "orchestration_version": "2026-05-04.fpi-005.local-v1",
        "facility_id": facility_id,
        "display_name": facility["display_name"],
        "source_scoring_version": scoring["scoring_version"],
        "source_score": scoring["score"],
        "source_tier": scoring["tier"],
        "adapter_mode": ADAPTER_MODE,
        "guardrail_note": GUARDRAIL_NOTE,
        "draft_actions": [action.to_dict() for action in actions],
    }


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    output = build_actions(load_json(SEED_PATH), load_json(SCORING_OUTPUT_PATH))
    print(json.dumps(output, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
