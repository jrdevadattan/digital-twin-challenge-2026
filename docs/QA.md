# Verification record

9 October 2026, private cloud build.

## Executed

- `npm run build`: TypeScript and Vite production build passed.
- `npm test`: 22 TypeScript tests passed, including Python-export feature/inference parity, no future observations, deterministic replay and four forecast-withholding states.
- `python -m unittest discover -s model -v`: 25 Python tests passed (independent model review).
- Actual cloud Chromium preview at localhost:5175, with the compiled React source served by Vite.
- Desktop visual inspection and full-page screenshots. The chart, model estimate, labels, profile and worklist render together without clipping.
- Actual 390px mobile and 768px tablet iframe viewports: measured document scroll widths equal client widths; no horizontal overflow. Mobile disconnection control correctly withholds the forecast.
- Sensor dropout, cold start, invalid units and disconnected scenarios: heading becomes Forecast withheld and numeric event estimate disappears. Selected worklist status matches.
- Step advances exactly one 15-minute tick; reset restores step 16. 4× playback reaches step 32 and disables Play. Home on the replay slider reaches step 0 and withholds the forecast for cold start.
- Radix keyboard ArrowRight changes Twin overview to Review history.
- Mark snapshot reviewed changes to a disabled acknowledgment.
- A synthetic session note saves and appears in Review history. No external communication occurs.
- Model evidence shows synthetic results and the separate real retrospective benchmark, including false-alert burden and no established real-data fusion benefit.
- Independent review checked all 88,715 real benchmark windows against target, gaps and person split; public real evidence contains aggregate statistics only.

## Limits

- The Playwright runner suite is supplied for reproducibility but was not executed in this cloud executor; native Chromium tests above were used because isolated headless socket binding is restricted.
- No automated axe/WCAG certification is claimed. Keyboard focus, labels, text statuses, reduced-motion CSS and layout were manually inspected. A full screen-reader and contrast audit remains future work.
- No user computer was accessed. Other browser tabs and services were preserved.
- Browser inference accepts only fixed synthetic fixtures. Generic sensor ingestion validation is implemented and tested in Python, not exposed as a browser upload/API.
- Clinical validity, deployment reliability, prospective performance and real EHR integration are not established by these checks.

Screenshots are in `artifacts/screenshots/` and show fictional patients only.

## Responsive correction, 9 October

The first mobile layout used undersized text. It was replaced after user feedback.

- Actual iframe viewports at 320, 375 and 390 CSS pixels now use full-size horizontally scrollable patient cards, stacked metric rows, 14px forecast copy, 16px select controls and 44px playback/slider targets.
- The event estimate appears after the metrics and before the chart; input quality remains visible.
- Chart viewBox width follows its measured container: 247/302/317px respectively, matching rendered width exactly. Axis text is actually 12px, not a larger SVG font scaled down. Narrow charts use four quarter-hour-aligned ticks and provide a numeric textual baseline/range summary.
- Overview, evidence and provenance panels fit each small viewport; 768px and 1024px layouts were also checked with the stale-feed state.
- Patient worklist and tab bar use explicitly bounded horizontal scrolling. The document itself has no horizontal overflow.
- Critical units, stale policy, uncertainty text and research-only disclosure remain visible at mobile sizes.

## Public CI verification (9 October 2026)

GitHub Actions runs were inspected during release. The run for source commit `96545d7574fc176a22077df4e03b7469f2760f18` passed the production build, 22 TypeScript tests, 25 Python tests and 2 Playwright browser tests. This supplements the earlier native-cloud browser checks above; the earlier statement about the cloud executor remains specific to that environment. Documentation-only changes after this source commit do not alter application behavior.
