# FPI Integration Plan (Cody S, Chris E, Chris R, Jacob)

Date: 2026-05-05  
Integrator: Atlas (`code-puppy-9a4326`)  
Target: `02_Active_Build/fpi-app`

## 1) Current workspace readiness snapshot

### Cody S
- Folder reviewed: `03_Workspaces/Cody S - Working Folder/`
- Status: **No task package present yet** (README only).
- Blocking impact: Remediation orchestration UI can only use current synthetic baseline until Cody publishes field queue/task lifecycle package.

### Chris E
- Folder reviewed: `03_Workspaces/Chris E - Working Folder/`
- Present: assignment doc + large fire datasets.
- Risk: current fire dataset includes detailed site naming/context and should **not** be copied directly into app UI payloads.
- Needed: normalized/sanitized fire control output package (fields + rules + safe samples).

### Chris R
- Folder reviewed: `03_Workspaces/Chris R - Working Folder/01_Task_Work/FPI-TECH-001/`
- Strong candidate artifacts:
  - `synthetic-technology-health-adapter-output.json`
  - `technology-health-adapter-output.schema.json`
  - `technology-health-integration-contract.md`
- Ready level: **High** for integration into adapter/normalization lane.

### Jacob
- Folder reviewed: `03_Workspaces/Jacob H - Working Folder/01_Task_Work/FPI-018_UNION/`
- Strong candidate artifacts:
  - `normalized_data/fpi-region75-union-model.json`
  - docs on canonical impacts, role visibility, union summary
- Caution: union package is broad; integrate by **object slices**, not wholesale copy.

## 2) Integration strategy (safe + incremental)

## Phase A — Contract-first normalization (Day 1)
Goal: lock data seams before UI changes.

1. Adopt Chris R schema as the technology-health adapter contract.
2. Define FPI internal mapper:
   - input: `technology-health-adapter-output.json`
   - output: app-safe `technology_issues` + `source_freshness` structures used by `app.js`.
3. Add contract validation step to local pipeline:
   - JSON schema validate before render.

Exit criteria:
- Contract validation passes.
- No source-specific fields leak into app state.

## Phase B — Fire/life-safety safe slice (Day 1-2)
Goal: integrate Chris E logic without raw data leakage.

1. Do **not** import `fire-alarm-data-2026-05-04.json` directly.
2. Create a sanitizer/adapter that emits only canonical fields:
   - `control_id`, `facility_id`, `status`, `evidence_state`, `inspection_cadence`, `freshness_status`, `confidence`, `risk_impact`, `requires_escalation`.
3. Add fire-derived risk drivers to scoring inputs with synthetic-safe summaries.

Exit criteria:
- No real site names / AHJ names / operational details in rendered UI.
- Fire rules feed Risk & Alerts and Program Coverage cards via canonical model.

## Phase C — Union model object slicing (Day 2)
Goal: pull Jacob’s high-value objects into baseline app model.

Integrate these additions from union proposal:
- `Task`
- `Verification`
- `AuditEvent`
- `Playbook`
- `RoleVisibility`
- `IntegrationSource`

Do not merge full union JSON directly. Map slices into:
- `data/seed/*` expansion
- lightweight reader utilities in `assets/app.js` (or split module)

Exit criteria:
- Program cards show richer demo signals from task/verification/playbook state.
- Evidence/closure logic references verification object, not hardcoded text only.

## Phase D — Cody field-ops package integration (Day 2-3, blocking)
Goal: connect field prioritization and SLA lifecycle to remediation UI.

Await required Cody handoff package in:
- `03_Workspaces/Cody S - Working Folder/03_Handoff_Drafts/<TASK-ID>/handoff.md`

Expected objects/rules:
- task priority rules
- blocked/escalation states
- SLA timers
- ownership lanes
- closure gating states

Integration touchpoints:
- Command Center: remediation queue + top drivers
- Remediation page: lifecycle board and owner lanes
- Demo Mode steps: field-ops orchestration fidelity

Exit criteria:
- Remediation status and SLA behavior are driven by data, not static labels.

## 3) UI mapping plan to current Operating Programs sidebar

Map owner outputs to existing sidebar program rows:

- Data Ingestion & Normalization → Chris R adapter + Chris E fire adapter + Jacob integration source records
- Facility Protection Profiling → Jacob canonical objects
- Executive Protection Readiness → existing scope profile + future owner rules
- Fire-System Monitoring & Assurance → Chris E normalized fire controls
- Camera & Technical Control Monitoring → Chris R technology issues
- Network & Security Device Posture → Chris R domain mapping
- Threat Detection & Risk Scoring → scoring module consuming normalized drivers
- Remediation Orchestration → Cody lifecycle package
- Vendor Intelligence & Recommendations → existing vendor module + future queue signals
- Law Enforcement / External Coordination → demo-safe posture text only
- Verification & Evidence Closure → Jacob verification/audit objects + Cody closure gating
- Dashboarding, Governance & Executive Reporting → Jacob role visibility + report summaries

## 4) Merge order (recommended)

1. Chris R contract + adapter output schema integration
2. Chris E fire sanitizer + canonical fire controls
3. Jacob union object-slice integration
4. Cody field-ops lifecycle integration (once delivered)
5. Final UI harmonization + demo script polish

## 5) Guardrails (must remain true)

- Synthetic/demo-safe only.
- No raw workspace dumps into active app.
- No credentials, production URLs, or sensitive operational details.
- Law-enforcement lane remains readiness-only and demo-safe.
- Validate each phase before next phase merge.

## 6) Concrete next actions for team

### Cody S
- Deliver first handoff slice: task lifecycle + SLA + blocked/escalation rules package.

### Chris E
- Deliver normalized fire-control adapter output + evidence state rules doc.

### Chris R
- Confirm schema version tag + provide minimal adapter fixture set for tests.

### Jacob
- Publish object-slice mapping table from union JSON to active seed schema.

## 7) Integration verification checklist

- Schema checks pass for tech and fire normalized payloads.
- Program Coverage cards render from canonical data, not static-only strings.
- Remediation queue reflects real lifecycle states and SLA flags.
- Evidence closure remains verification-gated.
- Demo Mode step narration aligns with operating programs and integrated data.
