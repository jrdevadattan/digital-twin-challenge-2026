# GlucoTwin

**Research prototype · Synthetic demo · Not for clinical decisions.**

A clinician-facing Type 2 diabetes digital-twin research workspace with timestamped fictional profiles, causal sensor replay, an actual trained static-plus-dynamic event model, descriptive uncertainty and inspectable evidence.

This repository is private during development. No public deployment or challenge submission is authorized yet. Team and college details, presentation, architecture deck and ≥20-minute walkthrough must be completed before submission.

## Start

Requires Node.js 24 and npm. Dependencies are pinned in `package-lock.json`.

```sh
npm ci
npm run dev
```

Open the Vite URL, normally http://localhost:5173. Inference runs entirely in the browser; no API keys, paid service, backend, account or real-data upload is needed.

```sh
npm test
npm run build
npm run test:e2e
python -m unittest discover -s model -p 'test_*.py'
```

See `model/README.md` for pinned Python environment and exact training commands. Browser tests require a Playwright Chromium install (`npx playwright install chromium`).

## What works

- Four fictional patients backed by selected held-out synthetic generator traces, not unrelated real sensor records.
- Causal 15-minute replay, pause, reset, step, speed and scrub controls. Simulated clock normalized to 09 October 2026, 08:00 IST. Future observations are not plotted early.
- Static + dynamic logistic event inference using age, diabetes duration, pre-existing HbA1c, current glucose, last-hour OLS slope, mean and population standard deviation.
- The exact event: two consecutive future readings >180 mg/dL among the next eight 15-minute samples. Current >180 is conservatively excluded. Missing outcomes are never relabeled negative.
- A separate persistence trajectory baseline with horizon-specific synthetic validation residual bands. It is not the event model's trajectory and not a clinical confidence interval.
- Sensor dropout, cold start, unit mismatch and disconnection scenarios suppress forecasts and model estimates.
- Session-only synthetic review notes and per-snapshot acknowledgments. Nothing is sent to a clinical system.
- Model evidence and provenance tabs, keyboard-operable Radix/shadcn components, responsive layouts and reduced-motion support.

## Measured evidence

The synthetic pipeline uses 240 people, patient-separated 144/48/48 train/validation/test splits. On 30,248 eligible test windows, prevalence is 7.73%; fused PR-AUC is 0.3205 (patient-bootstrap 95% interval 0.2731–0.3581), versus dynamic-only 0.2837 and static-only 0.1776. The 0.15 alert threshold was selected on validation, not test.

The alert burden is high: 944 false alerts / 336 patient-days = 2.81/day; window precision 27.2%. 293/334 forecastable episodes were warned, with median lead 30 minutes under the documented deduplication protocol. The persistence baseline's 120-minute MAE is 19.55 mg/dL; linear trend is worse at 33.85. These are toy-generator results, not clinical validity, real-world risk probabilities or India-population evidence.

Full measured artifacts: `public/model-evidence.json`, `public/model.json`. Demo cases are deliberately selected successful-warning, false-positive, missed-episode and stable illustrations, not representative accuracy samples. See `public/model-demo.json` and `model/README.md`.

## Data and privacy

Only synthetic patient-level records belong in the app and repository. Real benchmark source files remain outside the repository and screenshots. A separate ShanghaiT2DM retrospective benchmark used 100 adults and 109 sessions, split by patient 60/20/20. Fused PR-AUC was 0.3422 versus dynamic-only 0.3398; the paired interval includes zero, so a meaningful fusion advantage is not established. False-alert burden was 2.97 per recorded-span patient-day. Only age, recorded gender and past CGM were used; undated labs were excluded. These Chinese cohort results do not validate the synthetic browser model or establish performance in India. See `model/REAL_BENCHMARK.md` and `public/model-real-evidence.json`.

No claims of regulatory compliance, physiological causality, clinical efficacy, treatment guidance or emergency monitoring. The stale limit (30 minutes) and minimum nine observations are engineering policies.

## Project structure

- `src/`: TypeScript React interface, pure inference and tests
- `src/components/ui/`: official shadcn/ui primitives, customized through CSS
- `public/model*.json`: generated synthetic model, provenance, evidence and parity fixtures
- `model/`: reproducible synthetic training/evaluation and tests
- `docs/`: approved scope and contribution disclosure

## Contribution and license status

AI-assisted design, implementation, tests and analysis are disclosed in `docs/CONTRIBUTIONS.md`. Human ownership, team/college attribution and organizer AI-assistance attestations must be confirmed before submission. No claim that these artifacts are entirely human-authored.

Original project code is MIT-licensed (see LICENSE). Dependency licenses remain theirs. shadcn/ui is MIT-licensed; preserve its attribution. Data licenses are separate from code licensing.
