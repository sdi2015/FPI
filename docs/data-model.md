# FPI-002 Canonical Data Model Notes

Classification: Walmart Internal / Need-to-Know – Draft  
Data mode: Synthetic/demo data only

## Purpose

FPI-002 establishes the first canonical local JSON shape for the event build. The goal is to let UI, scoring, remediation, technology health, and demo/QA work from one shared seed instead of each workstream inventing its own object model.

## Mock facility

The MVP mock facility is:

```text
Store WS-X38
Store code: WS-X38
Mock location: Richland, VA
Canonical facility_id: store-wsx38
```

This is treated as synthetic/demo context for the prototype. Do not add real facility vulnerabilities, real employee details, law-enforcement contacts, production source records, or sensitive facility posture.

## Files

```text
data/schema/fpi-canonical.schema.json
data/seed/fpi-seed-wsx38.json
scripts/validate_seed.py
```

## Canonical collections

| Collection | Purpose | Primary key |
|---|---|---|
| `facilities` | Store/facility identity and role visibility. | `facility_id` |
| `risk_assessments` | Current explainable risk posture. | `risk_id` |
| `technology_issues` | Normalized fire, VMS/camera, access, network/security device signals. | `issue_id` |
| `incidents` | Synthetic event history that can influence risk. | `incident_id` |
| `remediations` | Actionable field/security/fire tasks requiring verification before closure. | `remediation_id` |
| `evidence` | Synthetic proof/evidence records linked to remediations. | `evidence_id` |
| `source_freshness` | Local/future adapter freshness and quality cues. | `source_id` |

## Status vocabulary

Technology health status uses the shared vocabulary required by the FPI guardrails:

```text
Normal, Warning, Degraded, Critical, Unknown, Not Applicable
```

Remediation status uses:

```text
Open, In Progress, Blocked, Ready for Verification, Closed, Reopened
```

Evidence status uses:

```text
Missing, Attached, Verified, Rejected
```

## Adapter boundary

The seed intentionally stores local normalized FPI objects, not vendor-specific payloads. Future adapters should map source-specific records into this canonical shape.

Approved event-build adapter modes:

- `Local JSON`
- `SQLite`
- `Future Adapter Placeholder`

Do not call live systems from this seed or validation script.

## Validation

Run from `02_Active_Build/fpi-app`:

```bash
python scripts/validate_seed.py
```

Expected result begins with:

```text
FPI seed validation passed.
```

The validator checks:

- Required top-level collections exist.
- Data mode is `synthetic_demo_only`.
- Facility identity matches Store WS-X38 / Richland, VA.
- Technology issue statuses use the approved vocabulary.
- Risk drivers reference known sources and include recommended actions.
- Technology issues, remediations, and evidence records link to known IDs.
- Remediations require verification before closure.

## Coordination notes

- FPI-003 UI should bind to `data/seed/fpi-seed-wsx38.json` or an adapter that preserves this shape.
- FPI-004 scoring should replace the current static score only through a reviewed scoring task; the seed keeps expected baseline factors for comparison.
- FPI-005 orchestration should generate or update `remediations` and `evidence` through the canonical IDs.
- Chris R / technology health work should preserve the `technology_issues` status vocabulary.
- Chris E / fire alarm work should extend fire/life-safety details without exposing real records.
