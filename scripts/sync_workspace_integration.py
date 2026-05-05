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
JACOB_QR_MANIFEST = WORKSPACES_ROOT / "Jacob H - Working Folder" / "01_Task_Work" / "qr_briefings" / "qr_manifest.json"

CHRISR_TARGET = INTEGRATION_DIR / "chrisr-tech-health-normalized.json"
CHRISE_TARGET = INTEGRATION_DIR / "chrise-fire-controls-normalized.json"
JACOB_TARGET = INTEGRATION_DIR / "jacob-union-slice.json"
SCOPE_CATALOG_TARGET = INTEGRATION_DIR / "scope-catalog-ui.json"
CROSSWALK_TARGET = INTEGRATION_DIR / "facility-crosswalk.json"


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
        "sites": [
            {
                "site_id": str(site.get("id") or ""),
                "name": site.get("name") or "Unknown Site",
                "region": site.get("region") or "Unknown",
                "risk_score": int(site.get("riskScore") or 0),
                "open_deficiencies": int(site.get("openDeficiencies") or 0),
                "active_troubles": int(site.get("activeTroubles") or 0),
                "overdue_inspection": bool(site.get("overdueInspection")),
            }
            for site in sites
        ],
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


def sync_facility_crosswalk() -> dict[str, Any]:
    chrise = load_json(CHRISE_SOURCE)
    jacob = load_json(JACOB_SOURCE)

    sites = [
        {
            "site_id": str(site.get("id") or ""),
            "name": site.get("name") or "Unknown Site",
            "region": site.get("region") or "Unknown",
        }
        for site in chrise.get("sites", [])
        if site.get("id")
    ]
    if not sites:
        raise ValueError("Cannot build facility crosswalk: no Chris E sites found")

    work_queue = jacob.get("work_queue", [])
    if not work_queue:
        raise ValueError("Cannot build facility crosswalk: no Jacob work_queue items found")

    region_to_sites: dict[str, list[dict[str, Any]]] = {}
    for site in sites:
        region_to_sites.setdefault(site["region"], []).append(site)
    for region_sites in region_to_sites.values():
        region_sites.sort(key=lambda item: item["site_id"])

    region_cursors = {region: 0 for region in region_to_sites}
    entries: list[dict[str, Any]] = []
    unmapped: list[dict[str, Any]] = []

    for task in work_queue:
        facility_ref = task.get("facility_ref")
        region = task.get("region")
        if not facility_ref:
            unmapped.append({"task_id": task.get("task_id"), "reason": "missing facility_ref"})
            continue

        candidates = region_to_sites.get(region) or sorted(sites, key=lambda item: item["site_id"])
        if not candidates:
            unmapped.append({"task_id": task.get("task_id"), "facility_ref": facility_ref, "reason": f"no site candidates for region={region}"})
            continue

        cursor = region_cursors.get(region, 0)
        site = candidates[cursor % len(candidates)]
        region_cursors[region] = cursor + 1

        entries.append(
            {
                "task_id": task.get("task_id"),
                "facility_ref": facility_ref,
                "region": region,
                "market": task.get("market"),
                "site_id": site["site_id"],
                "site_name": site["name"],
                "scope_id": f"fire-{site['site_id'].lower()}",
                "mapping_method": "region_round_robin",
            }
        )

    payload = {
        "source_meta": {
            "owner": "FPI Integration",
            "source_files": [str(CHRISE_SOURCE), str(JACOB_SOURCE)],
            "synced_at": datetime.now(UTC).isoformat(),
            "data_mode": "synthetic_demo_only",
        },
        "mapping_summary": {
            "jacob_task_count": len(work_queue),
            "mapped_count": len(entries),
            "unmapped_count": len(unmapped),
            "region_count": len(region_to_sites),
        },
        "entries": entries,
        "unmapped": unmapped,
    }
    write_json(CROSSWALK_TARGET, payload)
    return payload


def sync_jacob(crosswalk: dict[str, Any]) -> dict[str, Any]:
    source = load_json(JACOB_SOURCE)
    work_queue = source.get("work_queue", [])
    playbooks = source.get("playbooks", [])
    role_views = source.get("role_views", {})
    crosswalk_by_ref = {entry.get("facility_ref"): entry for entry in (crosswalk.get("entries") or [])}

    task_queue = []
    for task in work_queue[:40]:
        mapping = crosswalk_by_ref.get(task.get("facility_ref"), {})
        task_queue.append(
            {
                "task_id": task.get("task_id"),
                "facility_ref": task.get("facility_ref"),
                "site_id": mapping.get("site_id"),
                "scope_id": mapping.get("scope_id"),
                "region": task.get("region"),
                "market": task.get("market"),
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
        )

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


def sync_scope_catalog(seed: dict[str, Any]) -> dict[str, Any]:
    chrise = load_json(CHRISE_SOURCE)
    jacob_union = load_json(JACOB_SOURCE)
    qr_entries = load_json(JACOB_QR_MANIFEST) if JACOB_QR_MANIFEST.exists() else []

    scopes: list[dict[str, Any]] = []
    seen: set[str] = set()

    def add_scope(
        scope_id: str,
        label: str,
        scope_type: str,
        summary: str,
        risk: str = "--",
        confidence: str = "--",
        region: str | None = None,
        market: str | None = None,
        site_id: str | None = None,
        facility_ref: str | None = None,
        source: str = "unknown",
    ) -> None:
        if not scope_id or scope_id in seen:
            return
        seen.add(scope_id)
        scopes.append({
            "id": scope_id,
            "label": label,
            "type": scope_type,
            "risk": risk,
            "confidence": confidence,
            "summary": summary,
            "region": region,
            "market": market,
            "site_id": site_id,
            "facility_ref": facility_ref,
            "source": source,
        })

    seed_facility = (seed.get("facilities") or [{}])[0]
    add_scope(
        scope_id=seed_facility.get("facility_id", "region-75"),
        label=seed_facility.get("display_name", "Region 75"),
        scope_type="region",
        risk="72 ELEVATED",
        confidence="89%",
        summary="Canonical Region 75 scope from active seed and Jacob union model.",
        region="Region 75",
        source="seed",
    )

    for site in chrise.get("sites", [])[:120]:
        site_id = str(site.get("id") or "")
        site_name = site.get("name") or f"Store {site_id}"
        risk_score = site.get("riskScore")
        risk = f"{risk_score} WATCH" if isinstance(risk_score, (int, float)) else "--"
        confidence = "86%"
        summary = f"Chris E fire scope · Region {site.get('region', 'Unknown')} · Open deficiencies {site.get('openDeficiencies', 0)}"
        add_scope(
            scope_id=f"fire-{site_id.lower()}",
            label=site_name,
            scope_type="store",
            risk=risk,
            confidence=confidence,
            summary=summary,
            region=site.get("region"),
            site_id=site_id,
            source="chrise",
        )

    for entry in qr_entries[:260]:
        entry_type = entry.get("type", "store")
        entry_id = str(entry.get("id") or "")
        if not entry_id:
            continue
        label = entry.get("label") or f"Scope {entry_id}"
        scope_type = "region" if entry_type == "region" else "store"
        summary = "Jacob QR scope catalog entry"
        add_scope(
            scope_id=f"qr-{entry_type}-{entry_id}",
            label=label,
            scope_type=scope_type,
            risk="--",
            confidence="--",
            summary=summary,
            site_id=entry_id if scope_type == "store" else None,
            source="jacob_qr",
        )

    for task in (jacob_union.get("work_queue") or [])[:120]:
        region = task.get("region")
        market = task.get("market")
        if region:
            add_scope(
                scope_id=f"union-region-{str(region).lower().replace(' ', '-')}",
                label=f"Region · {region}",
                scope_type="region",
                risk="--",
                confidence="--",
                summary=f"Jacob work queue scope with market context: {market or 'N/A'}",
                region=region,
                source="jacob_union",
            )
        if market:
            add_scope(
                scope_id=f"union-market-{str(market).lower().replace(' ', '-')}",
                label=f"Market · {market}",
                scope_type="market",
                risk="--",
                confidence="--",
                summary=f"Jacob market scope derived from remediation queue in {region or 'unknown region'}",
                region=region,
                market=market,
                source="jacob_union",
            )

    payload = {
        "source_meta": {
            "owner": "FPI Integration",
            "source_files": [str(SEED_PATH), str(CHRISE_SOURCE), str(JACOB_SOURCE), str(JACOB_QR_MANIFEST)],
            "synced_at": datetime.now(UTC).isoformat(),
            "data_mode": "synthetic_demo_only",
        },
        "scope_count": len(scopes),
        "scopes": scopes,
    }
    write_json(SCOPE_CATALOG_TARGET, payload)
    return payload


def main() -> int:
    seed = load_json(SEED_PATH)
    chrisr = sync_chrisr(seed)
    chrise = sync_chrise()
    crosswalk = sync_facility_crosswalk()
    jacob = sync_jacob(crosswalk)
    scope_catalog = sync_scope_catalog(seed)

    print("Workspace integration sync complete:")
    print(f"- Chris R issues synced: {len(chrisr['technology_issues'])}")
    print(f"- Chris E fire controls synced: {len(chrise['fire_controls'])}")
    print(f"- Facility crosswalk mapped: {crosswalk['mapping_summary']['mapped_count']} / {crosswalk['mapping_summary']['jacob_task_count']}")
    print(f"- Jacob tasks synced: {len(jacob['task_queue'])}")
    print(f"- Scope catalog entries: {scope_catalog['scope_count']}")
    print(f"- Output dir: {INTEGRATION_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
