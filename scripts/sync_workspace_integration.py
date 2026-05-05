#!/usr/bin/env python3
"""Sync sanitized integration payloads from team workspaces into fpi-app/data/integration."""
from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
FOUNDRY_PACK_ROOT = ROOT.parent.parent
WORKSPACES_ROOT = FOUNDRY_PACK_ROOT / "03_Workspaces"
INTEGRATION_DIR = ROOT / "data" / "integration"
SEED_PATH = ROOT / "data" / "seed" / "fpi-seed-region75.json"

CHRISR_SOURCE = WORKSPACES_ROOT / "Chris R - Working Folder" / "01_Task_Work" / "FPI-TECH-001" / "01_Normalized_Model" / "synthetic-technology-health-adapter-output.json"
CHRISE_SOURCE = WORKSPACES_ROOT / "Chris E - Working Folder" / "01_Task_Work" / "fire-alarm-data-2026-05-04.json"
JACOB_SOURCE = WORKSPACES_ROOT / "Jacob H - Working Folder" / "01_Task_Work" / "FPI-018_UNION" / "normalized_data" / "fpi-region75-union-model.json"

CHRISR_TARGET = INTEGRATION_DIR / "chrisr-tech-health-normalized.json"
CHRISE_TARGET = INTEGRATION_DIR / "chrise-fire-controls-normalized.json"
JACOB_TARGET = INTEGRATION_DIR / "jacob-union-slice.json"


@dataclass(frozen=True)
class SourceMeta:
    owner: str
    source_path: Path

    def to_dict(self) -> dict[str, Any]:
        stat = self.source_path.stat()
        return {
            "owner": self.owner,
            "source_file": str(self.source_path),
            "source_last_modified": datetime.fromtimestamp(stat.st_mtime, UTC).isoformat(),
            "synced_at": datetime.now(UTC).isoformat(),
            "data_mode": "synthetic_demo_only",
        }


def load_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise FileNotFoundError(f"Missing required source file: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def sync_chrisr(seed: dict[str, Any]) -> dict[str, Any]:
    source = load_json(CHRISR_SOURCE)
    valid_remediations = {item.get("remediation_id") for item in seed.get("remediations", [])}

    tech_issues: list[dict[str, Any]] = []
    for issue in source.get("technology_issues", []):
        mapped = dict(issue)
        mapped["facility_id"] = "region-75"
        remediation_id = mapped.get("creates_remediation_id")
        if remediation_id not in valid_remediations:
            mapped["creates_remediation_id"] = "none"
        tech_issues.append(mapped)

    payload = {
        "source_meta": SourceMeta("Chris R", CHRISR_SOURCE).to_dict(),
        "source_task": "FPI-TECH-001",
        "technology_issues": tech_issues,
        "source_freshness": source.get("source_freshness", []),
    }
    write_json(CHRISR_TARGET, payload)
    return payload


def sync_chrise() -> dict[str, Any]:
    source = load_json(CHRISE_SOURCE)
    sites = source.get("sites", [])
    if not sites:
        raise ValueError("Chris E fire dataset has no sites")

    overdue = 0
    open_def = 0
    active_troubles = 0
    false_alarms = 0
    risk_values: list[float] = []
    now = datetime.now(UTC)

    for site in sites:
        next_due = site.get("nextInspectionDue")
        if next_due:
            try:
                due = datetime.fromisoformat(next_due.replace("Z", "+00:00"))
                if due < now:
                    overdue += 1
            except ValueError:
                pass
        open_def += int(site.get("openDeficiencies") or 0)
        active_troubles += int(site.get("activeTroubles") or 0)
        false_alarms += int(site.get("falseAlarms90Days") or 0)
        if isinstance(site.get("riskScore"), (int, float)):
            risk_values.append(float(site["riskScore"]))

    avg_risk = round(sum(risk_values) / max(len(risk_values), 1), 1)
    evidence_state = "Stale" if overdue > 0 else "Current"
    status = "Warning" if overdue > 0 or open_def > 0 else "Normal"
    requires_escalation = overdue > 0 or active_troubles >= 10

    payload = {
        "source_meta": SourceMeta("Chris E", CHRISE_SOURCE).to_dict(),
        "source_task": "FPI-019",
        "fire_controls": [
            {
                "control_id": "fire-ctrl-region75-aggregated",
                "facility_id": "region-75",
                "status": status,
                "evidence_state": evidence_state,
                "inspection_cadence": "Quarterly",
                "freshness_status": "Aging" if evidence_state == "Stale" else "Current",
                "confidence": "Medium",
                "risk_impact": "Elevated" if status != "Normal" else "Low",
                "requires_escalation": requires_escalation,
                "summary": f"Fire assurance summary from {len(sites)} synthetic sites: overdue inspections={overdue}, open deficiencies={open_def}, active troubles={active_troubles}.",
            }
        ],
        "portfolio_summary": {
            "site_count": len(sites),
            "overdue_inspections": overdue,
            "open_deficiencies": open_def,
            "active_troubles": active_troubles,
            "false_alarms_90_days": false_alarms,
            "average_risk_score": avg_risk,
        },
        "risk_driver_overrides": [
            {
                "driver_id": "driver-fire-evidence-gap",
                "label": "Fire evidence assurance gap",
                "points": 16 if status != "Normal" else 4,
                "explanation": "Portfolio fire evidence and inspection signals require verification before risk can be reduced.",
            }
        ],
    }
    write_json(CHRISE_TARGET, payload)
    return payload


def sync_jacob() -> dict[str, Any]:
    source = load_json(JACOB_SOURCE)
    work_queue = source.get("work_queue", [])
    playbooks = source.get("playbooks", [])
    role_views = source.get("role_views", {})

    task_queue = [
        {
            "task_id": task.get("task_id"),
            "program": "Remediation Orchestration",
            "status": task.get("status", "Open"),
            "priority": task.get("priority", "Medium"),
            "owner_lane": task.get("owner_role", "Field Operations"),
            "sla_state": "At Risk" if int(task.get("sla_hours") or 999) <= 24 else "Watch",
            "summary": task.get("title", "Synthetic remediation task"),
            "risk_type": task.get("risk_type", "Protection Risk"),
            "verification_required": bool(task.get("verification_required")),
            "evidence_required": bool(task.get("evidence_required")),
        }
        for task in work_queue[:12]
    ]

    verification = [
        {
            "verification_id": f"ver-{task['task_id']}",
            "case_id": task["task_id"],
            "evidence_id": task.get("task_id"),
            "state": "Under Review" if task.get("verification_required") else "Not Required",
            "required_for_closure": bool(task.get("verification_required")),
        }
        for task in task_queue
    ]

    role_visibility = [
        {
            "role_id": role_id,
            "label": role_id.replace("FPI-", "").replace("-", " ").title(),
            "scope": role_data.get("headline", "Role visibility context"),
        }
        for role_id, role_data in role_views.items()
    ]

    risk_drivers = [
        {
            "driver_id": driver.get("driver_id"),
            "label": driver.get("label"),
            "points": int(driver.get("impact") or 0),
            "explanation": driver.get("recommended_action", "Synthetic risk driver from Jacob union model."),
        }
        for driver in source.get("risk_drivers", [])
    ]

    exec_summary = source.get("executive_summary", {})
    queue_summary = {
        "total": len(work_queue),
        "critical": sum(1 for task in work_queue if task.get("priority") == "Critical"),
        "blocked": sum(1 for task in work_queue if task.get("status") == "Blocked"),
        "pending_verification": sum(1 for task in work_queue if task.get("status") == "Pending Verification"),
    }

    payload = {
        "source_meta": SourceMeta("Jacob H", JACOB_SOURCE).to_dict(),
        "source_task": "FPI-018_UNION",
        "executive_summary": {
            "facility_context": exec_summary.get("facility_context", "Region 75 synthetic portfolio"),
            "product_loop": exec_summary.get("product_loop", "Identify -> Explain -> Act -> Verify -> Improve posture"),
            "source_count": exec_summary.get("source_count", 0),
            "risk_driver_count": exec_summary.get("risk_driver_count", len(risk_drivers)),
            "technology_issue_count": exec_summary.get("technology_issue_count", 0),
            "work_queue_count": exec_summary.get("work_queue_count", len(work_queue)),
            "playbook_count": exec_summary.get("playbook_count", len(playbooks)),
        },
        "queue_summary": queue_summary,
        "risk_drivers": risk_drivers,
        "task_queue": task_queue,
        "verification": verification,
        "leadership_next_steps": source.get("leadership_next_steps", []),
        "playbooks": [
            {
                "playbook_id": pb.get("playbook_id"),
                "name": pb.get("name"),
                "owner_role": pb.get("owner_role"),
                "trigger": pb.get("trigger"),
                "step_count": len(pb.get("steps", [])),
                "steps": pb.get("steps", [])[:3],
            }
            for pb in playbooks[:5]
        ],
        "role_visibility": role_visibility,
    }
    write_json(JACOB_TARGET, payload)
    return payload


def main() -> int:
    seed = load_json(SEED_PATH)
    chrisr = sync_chrisr(seed)
    chrise = sync_chrise()
    jacob = sync_jacob()

    print("Workspace integration sync complete:")
    print(f"- Chris R issues synced: {len(chrisr['technology_issues'])}")
    print(f"- Chris E fire controls synced: {len(chrise['fire_controls'])}")
    print(f"- Jacob tasks synced: {len(jacob['task_queue'])}")
    print(f"- Output dir: {INTEGRATION_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
