# FPI Active Build Baseline

Classification: Walmart Internal / Need-to-Know – Draft  
Data mode: Synthetic/demo data only

This folder is the controlled source-of-truth active build for Facility Protection Intelligence (FPI). It now includes the FPI-003 static dashboard shell bound to the canonical Store WS-X38 synthetic seed data while preserving the clean local run path.

## What is included

- `index.html` — FPI-003 dashboard shell with navigation, metrics, risk drivers, technology health, remediation, evidence, incident context, and source freshness sections.
- `assets/styles.css` — no-dependency dashboard styling.
- `assets/app.js` — local JSON binding for `data/seed/fpi-seed-wsx38.json`.
- `data/fpi-demo-data.json` — small synthetic dataset retained for baseline validation.
- `data/seed/fpi-seed-wsx38.json` — canonical Store WS-X38 synthetic seed data.
- `scripts/validate_baseline.py` — no-dependency smoke check for required baseline files and synthetic-data markers.
- `scripts/validate_seed.py` — no-dependency canonical seed validation.

## Run locally

From this folder:

```bash
python -m http.server 8080
```

Open:

```text
http://localhost:8080
```

## Validate baseline files

From this folder:

```bash
python scripts/validate_baseline.py
```

Expected result:

```text
FPI baseline validation passed.
```

## Integration rules

- Only the named integrator should write directly to this folder.
- Feature teams should work under `03_Workspaces/<Owner Name> - Working Folder/` and submit reviewed handoff packages under `04_Integration_Queue/ready_for_review/<TASK-ID>/`.
- Use synthetic/demo data only.
- Do not add credentials, tokens, production URLs, real facility vulnerabilities, employee PII, law-enforcement contacts, or sensitive facility posture.
- Keep live integrations behind future adapter boundaries.

## Current baseline scope

This dashboard proves the local FPI MVP shell and data-binding path only. It does not implement production authentication, live integrations, final scoring weights, or remediation write-back workflows. Those should arrive through separate locked tasks and review gates.
