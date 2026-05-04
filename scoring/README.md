# FPI-004 Explainable Risk Scoring

Classification: Walmart Internal / Need-to-Know – Draft  
Data mode: Synthetic/demo data only

## Purpose

This folder contains the first no-dependency explainable scoring function for the Store WS-X38 synthetic demo. It reads the FPI-002 canonical seed and produces an inspectable score, tier, top drivers, and visible factor list.

## Files

- `risk_scoring.py` — scoring function and CLI JSON output.
- `expected_wsx38_score.json` — expected Store WS-X38 score/tier and top drivers.
- `validate_scoring.py` — expected-vs-actual validation with visible factor checks.

## Run

From `02_Active_Build/fpi-app`:

```bash
python scoring/validate_scoring.py
python scoring/risk_scoring.py
```

Expected validation summary:

```text
FPI scoring validation passed.
- facility: Store WS-X38
- expected score/tier: 93 / Critical
- actual score/tier: 93 / Critical
```

## Scoring model

The FPI-004 local scoring model uses additive points:

- Baseline synthetic facility context.
- Technology health status.
- Evidence status.
- Remediation status and verification requirement.
- Incident severity context.
- Source freshness.
- Verified/closed states can reduce risk when present.

Scores are clamped from 0 to 100 and mapped to risk tiers:

| Score range | Tier |
|---|---|
| 85-100 | Critical |
| 70-84 | Elevated |
| 45-69 | Guarded |
| 0-44 | Low |

## Guardrails

- Local JSON only.
- Synthetic Store WS-X38 data only.
- No production endpoints, credentials, live source calls, employee PII, real facility posture, or law-enforcement contacts.

## Current note

The FPI-002 seed's existing `risk_assessments[0].score` remains unchanged until Jason/integrator review decides whether to adopt the FPI-004 score into the canonical risk assessment contract.
