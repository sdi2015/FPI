# FPI-005 Remediation / Work Management Orchestration

Classification: Walmart Internal / Need-to-Know – Draft  
Data mode: Synthetic/demo data only

## Purpose

This folder contains the first local-only orchestration layer for the Region 75 demo. It converts FPI-004 top risk drivers into draft remediation/work actions that are safe to preview and validate locally.

## Files

- `remediation_orchestrator.py` — creates local draft actions from FPI-004 scoring output.
- `expected_region75_actions.json` — expected Region 75 draft actions.
- `validate_orchestration.py` — expected-vs-actual validation and guardrail checks.
- `orchestration-output-region75.json` — generated actual draft-action output.

## Run

From `02_Active_Build/fpi-app`:

```bash
python scoring/validate_scoring.py
python orchestration/validate_orchestration.py
python orchestration/remediation_orchestrator.py
```

To refresh output:

```bash
python scoring/risk_scoring.py > scoring/scoring-output-region75.json
python orchestration/remediation_orchestrator.py > orchestration/orchestration-output-region75.json
```

## Current draft actions

FPI-005 currently generates three local draft actions from the FPI-004 top drivers:

1. Attach synthetic fire alarm test evidence.
2. Review synthetic VMS health degradation.
3. Review synthetic fire alarm health signal.

Each action remains:

- `status`: `Draft`
- `adapter_mode`: `Local Draft Only`
- `verification_required`: `true`

## Guardrails

- Local draft only.
- Synthetic Region 75 data only.
- No production work-order creation.
- No live adapter calls.
- No credentials, production URLs, real facility vulnerabilities, employee PII, law-enforcement contacts, or sensitive facility posture.
