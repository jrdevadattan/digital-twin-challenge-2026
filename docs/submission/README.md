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

## Final video

The 20:00 walkthrough has been generated with Kokoro stock Heart neural narration. See the [verification summary](VIDEO_QA.md), [transcript](GlucoTwin-transcript.txt), [captions](GlucoTwin-captions.srt) and [voice credits](NEURAL-VOICE-CREDITS.txt). [Watch the final walkthrough on YouTube](https://youtu.be/Uz4Lio8GJTE). Its logged-out watch page displayed GlucoTwin, 20:00 and Unlisted. Full remote playback verification is not claimed.

## Submission status

The repository was made public and the Unstop entry was submitted on 9 October 2026 (approximately 19:41 IST). The saved submission was reopened and verified at 14:12 UTC (19:42 IST), including the public repository URL and all 12 saved checklist items. This confirms submission, not selection or acceptance.

The published repository and presentation/architecture artifacts were checked anonymously. The video watch page showed the expected title, 20:00 duration and Unlisted visibility. The local export passed full decode; a complete human listen-through and complete remote playback verification are not claimed. The form requires 15–20 minutes and an unlisted YouTube link, while the public listing specifies at least 20 minutes; the exact 20:00 export meets that common boundary.

GitHub Actions completed successfully for source commit `96545d7574fc176a22077df4e03b7469f2760f18`: 22 TypeScript tests, 25 Python tests, 2 browser tests and the production build. These checks establish software behavior, not clinical efficacy.
