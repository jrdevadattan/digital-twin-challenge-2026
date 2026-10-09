# Submission materials

GlucoTwin, Team dev. J R Deva Dattan, Army Institute of Technology, Pune.

## Files

- `../../artifacts/submission/GlucoTwin-presentation.pptx`: 12-slide editable presentation adapted from the downloaded SlidesCarnival Dercetus / Minimal Medical template, with source notes and editable evidence charts.
- `../../artifacts/submission/GlucoTwin-presentation.pdf`: PDF export of the same adapted presentation.
- `../../artifacts/submission/GlucoTwin-architecture.pdf`: three-page architecture, pipeline, and safety-boundary document.
- `walkthrough-runbook.md`: timed 20-minute narration and live-demo plan. It is not a video.
- `slide-notes.md`: source references accompanying the deck.
- `TEMPLATE_ATTRIBUTION.md`: official template source, license, source checksum, and layout mapping.

## Project description

GlucoTwin is a clinician-facing research prototype for reviewing a two-hour glucose event estimate. A React and TypeScript workspace combines fictional patient context with deterministic sensor replay. It updates a synthetic logistic event estimate, shows a separate persistence trajectory with descriptive validation-residual bands, and withholds forecasts when data are stale or unavailable. Review notes remain in the browser session.

The target is two consecutive 15-minute readings strictly above 180 mg/dL within the next 120 minutes. Current-high readings do not count as advance predictions. Synthetic evaluation uses a patient-separated 144/48/48 split. The four demonstration traces illustrate a successful warning, false positive, missed episode, and negative window.

A separate retrospective ShanghaiT2DM benchmark covers 100 adults and 109 recording sessions. It uses a 60/20/20 patient split and exports only aggregate results. Fused PR-AUC is 0.3422 versus 0.3398 for dynamic-only. The paired patient-bootstrap interval for the difference includes zero. At the selected threshold, the fused model produces about 2.97 false alerts per recorded patient-day. These results establish neither a meaningful fusion benefit nor clinical fitness.

Original code uses MIT. The ShanghaiT2DM data retain CC BY 4.0 attribution. Substantial OpenAI assistance is disclosed in the contribution document. The public demonstration contains only synthetic patient-level data. GlucoTwin has no clinical deployment, live EHR connection, autonomous treatment loop, or prospective validation.

## Before submitting

Check current organizer requirements, registration status, and authorship attestations. Recheck the final app after UI changes. Record and watch the actual 20:00 walkthrough, including all failure cases, then verify its exported duration and reviewer access. The submission form requires 15-20 minutes and an unlisted YouTube link in the README, while the listing requires at least 20 minutes; exactly 20:00 meets their common boundary. Inspect the approved release for private data and credentials. Confirm final repository and video links from actual published destinations. These documents do not establish that registration, publication, video recording, or platform submission has occurred.
