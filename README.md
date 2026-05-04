# FPI Localhost App

Classification: Walmart Internal / Need-to-Know – Draft  
Data mode: Synthetic/demo data only

This folder is the local VS Code/localhost app for Facility Protection Intelligence (FPI).

## Correct folder

Open this exact folder in VS Code:

```text
C:\Users\j0w16ja\OneDrive - Walmart Inc\FPI - D Team\02_Foundry_Pack\foundry_pack\02_Active_Build\fpi-app
```

## Fastest way to run

Double-click:

```text
run_localhost.bat
```

That script will:

1. Switch to this folder.
2. Run the local validation checks.
3. Open the browser.
4. Start localhost at:

```text
http://localhost:8080/
```

Leave the command window open while using the app. Press `Ctrl+C` to stop the server.

## VS Code terminal run

From this folder:

```bash
python -m http.server 8080
```

Open:

```text
http://localhost:8080/
```

## Current expected version

The current local shell is:

```text
fpi-015
```

The page source should include:

```text
assets/styles.css?v=fpi-015
assets/app.js?v=fpi-015
```

If the UI looks old or broken, hard refresh:

```text
Ctrl + F5
```

## One-click health check

Double-click:

```text
health_check.bat
```

Or run from this folder:

```bash
python scripts/validate_baseline.py
python scripts/validate_seed.py
python scoring/validate_scoring.py
python orchestration/validate_orchestration.py
node --check assets/app.js
```

Expected: all checks pass.

## What is included

- `index.html` — FPI program console / local operating shell.
- `leadership-brief.html` — printable leadership brief.
- `assets/styles.css` — app styling.
- `assets/app.js` — local JSON data binding and work queue logic.
- `assets/service-verticals.json` — service vertical configuration.
- `data/seed/fpi-seed-wsx38.json` — canonical Store WS-X38 synthetic seed data.
- `scoring/scoring-output-wsx38.json` — explainable scoring output.
- `orchestration/orchestration-output-wsx38.json` — local draft action output.
- `run_localhost.bat` — one-click Windows launcher.
- `run_localhost.ps1` — PowerShell launcher.
- `health_check.bat` — one-click validation.

## Data loaded by the UI

The app reads only local files from this folder:

```text
data/seed/fpi-seed-wsx38.json
scoring/scoring-output-wsx38.json
orchestration/orchestration-output-wsx38.json
assets/service-verticals.json
```

No live integrations are called.

## Troubleshooting

### Browser says data failed to load

Do not open `index.html` directly with `file://`. Use localhost:

```bash
python -m http.server 8080
```

Then open:

```text
http://localhost:8080/
```

### Port 8080 is already in use

Run a different port:

```bash
python -m http.server 8081
```

Then open:

```text
http://localhost:8081/
```

### UI looks stale

Hard refresh:

```text
Ctrl + F5
```

Confirm source includes `fpi-015`.

### OneDrive is still syncing

Wait for OneDrive to finish syncing, then rerun:

```text
health_check.bat
run_localhost.bat
```

## Integration rules

- Only the named integrator/dev lead should write directly to this folder.
- Feature teams should work under `03_Workspaces/<Owner Name> - Working Folder/`.
- Reviewed work should be submitted under `04_Integration_Queue/ready_for_review/<TASK-ID>/`.
- Use synthetic/demo data only.
- Do not add credentials, tokens, production URLs, real facility vulnerabilities, employee PII, law-enforcement contacts, or sensitive facility posture.
