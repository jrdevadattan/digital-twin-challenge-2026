# GlucoTwin: 20-minute walkthrough runbook

Team dev. J R Deva Dattan, Army Institute of Technology, Pune.

This is a recording plan, not a completed video. The timing includes live interaction, reading the displayed evidence, and short pauses. Reading the narration alone will run short. Rehearse with a stopwatch, record the working app, then verify that the exported video is exactly 20:00. The verified submission form specifies 15-20 minutes and an unlisted YouTube link, while the public listing says at least 20 minutes. Exactly 20:00 is the common boundary. Never extend the duration with a frozen title screen or repeated footage.

## Before recording

Use a clean browser window with notifications disabled and no account information visible. Record only the synthetic application, this deck, architecture PDF, and public-safe repository files. Keep source clinical workbooks, private contact details, credentials, and developer messages off screen. Use a legible desktop viewport, test microphone levels, and enlarge text in the evidence documents. All patient names in the app are fictional.

Run the project's current test and build commands. Open the app at its verified local or approved published URL. Reset replay, choose the first fictional patient, and select the normal patient scenario. Check that the starting clock is 12:00 IST, glucose is about 142.6 mg/dL, and the synthetic estimate rounds to 40%. If the implementation has changed, update this runbook from the measured fixtures before recording. Do not narrate a value that is absent from the screen.

Keep the following files open in a safe editor: public/model-evidence.json, model/real-benchmark-evidence.json, model/README.md, model/REAL_BENCHMARK.md, LICENSE, and docs/CONTRIBUTIONS.md. Open only aggregate real evidence. Do not show raw records or person IDs from the real dataset. Save a recording copy before editing.

## 00:00-01:15 | Introduction and scope

Show slides 1 and 2. Spend about 35 seconds on each. Explain the proposed reviewer workflow without claiming a clinician study.

Narration: “I'm J R Deva Dattan from Team dev at Army Institute of Technology, Pune. GlucoTwin is a research workspace for inspecting a two-hour glucose event estimate. Every patient you will see in the app is fictional. It is not intended for clinical decisions.

“The question behind this prototype is simple: when a glucose reading changes, can a reviewer see what information produced the estimate and whether that information is still usable? The interface brings the current snapshot, model output, and its evidence into the same review flow. This is a proposed clinician-facing workflow. We haven't conducted clinician interviews or a usability study.

“I'll show the working replay first, including a false positive and a missed episode. Then I'll separate the synthetic engineering results from a small retrospective benchmark on public research data. The real benchmark exposes a substantial false-alert burden and only a very small difference between fused and glucose-only models.”

## 01:15-02:30 | Exact outcome

Show slide 3. Point at the 120-minute horizon and read the event definition. Explain the boundary using 12:00 as an example: candidate observations are 12:15 through 14:00. Two high readings must both fall in that interval.

Narration: “Our target is two consecutive readings strictly above 180 milligrams per deciliter in the next 120 minutes. Samples arrive every 15 minutes. Two readings span 15 minutes; we do not describe that as 30 minutes above range.

“A current reading above 180 suppresses a new-event estimate, even if it is only a single high reading. That is a conservative project choice. Missing future samples make the outcome unknown, rather than negative. These choices are part of the benchmark definition. The threshold has time-in-range literature behind it, but this particular episode protocol is ours. It is not an emergency definition or a treatment trigger.”

During the remaining time, explain why a high current observation differs from a forecast of a future event. Advance to slide 4 only after the example is clear.

## 02:30-04:00 | Data separation and timing

Show slide 4, then the source and limitation paragraphs in model/REAL_BENCHMARK.md. Keep the source DOI visible.

Narration: “There are two evidence streams. The browser runs a model trained on a deterministic synthetic generator. That generator uses static patient context by design. Better fusion results on it demonstrate that the software can combine the inputs; they cannot establish a clinical benefit.

“The separate ShanghaiT2DM feasibility benchmark covers 100 adults and 109 recording sessions. We retain every session for a person in one split. Its static inputs are age and source-recorded gender. We assume these were available at enrollment, but their exact prospective timing isn't independently verified.

“The source paper allows some laboratory measurements months before or after the sensor recording. We therefore exclude all undated labs, along with treatment history and outcome-derived summary fields. Real data stay outside the public app and repository. The browser's fictional HbA1c fixture is dated before replay and has no connection to a Shanghai participant.”

Point to CC BY 4.0 and the modification notice. Explain that code licensing does not change data licensing. Do not scroll to any raw data location or open a workbook.

## 04:00-06:10 | First snapshot and the two outputs

Switch to the app's Twin overview. Select Ananya Rao, GT-001, and reset. At 12:00 IST the expected fixture is 142.58 mg/dL, baseline HbA1c 8.8%, age 70, and a synthetic event estimate near 40%. Read only values actually shown.

Narration: “This is a fictional profile selected from held-out synthetic examples. The timestamp is simulated time. The estimate uses the observations available at that moment. Future readings are present in the replay fixture but stay hidden from inference and the chart until we reach them.

“The percentage on the right is the logistic event model's synthetic estimate. The line extending into the future is a separate persistence baseline: it holds the latest glucose value constant. The shaded band uses validation absolute residuals. It describes uncertainty under the synthetic benchmark, without promising coverage for an individual patient.

“These two outputs answer different questions and can disagree. A flat persistence line can coexist with a higher event estimate because the logistic model also uses recent variation and static context. We make that separation explicit rather than implying the chart is a trajectory generated by the classifier.”

Spend the remaining time pointing out forecast origin, end time, units, model label, sensor freshness, and the chart legend. Open Provenance, read the available inputs, then return to Twin overview. Move slowly enough that a viewer can read each panel.

## 06:10-08:20 | Replay and observed outcome

Stay on GT-001. Use “Advance 15 minutes” several times, pausing on each updated timestamp. Briefly show Play, Pause, and the speed selector. Return to step-by-step progression before 13:00.

Narration: “Each step adds one observation. The current value and last-hour statistics change, so the event estimate changes too. The future actual trace doesn't appear early. Reset and the time slider make this demonstration repeatable, although moving backwards is a replay convenience rather than a clinical workflow.”

At 13:15, the current synthetic reading is 190.15. At 13:30 it is 189.52. Point out that the two readings form the defined future episode for the earlier 12:00 snapshot. Explain why the current-high state now withholds a new-event estimate.

Narration: “This is the selected successful-warning illustration. It shows one outcome that followed a warning. It does not represent the overall success rate. Once the current value is already above range, the interface treats that as an observation and stops presenting it as advance prediction.”

Mark one snapshot reviewed if available. Add the synthetic note “Demo review: inspected inputs and replay outcome.” Open Review history to show the session entry. Explain that no message or clinical action was sent. Return to overview and reset.

## 08:20-10:30 | False positive and missed episode

Select Vikram Shah, GT-002. Selection returns to 12:00. The fixture starts near 35% estimate with current glucose 165.96. Advance to 14:00, pausing near 12:30 when a single reading reaches 186.47. Show that the adjacent readings stay below 180, so the defined two-reading event does not occur in this horizon.

Narration: “This warning is a false positive under our exact label. A single high reading is visible, but the required pair never forms in this window. Changing the event definition after seeing this example would change the task. We keep the definition fixed.”

Select Meera Iyer, GT-003, at 12:00. The estimate is near 8%, below the frozen 15% synthetic threshold. Advance through 12:15, 12:30, and 12:45. The last two readings are 183.33 and 182.55.

Narration: “This selected case is a genuinely missed synthetic episode. The eligible warning origins stay below the threshold before onset. A low model estimate should never be read as a guarantee that no event will occur. These examples were selected after aggregate evaluation to show behavior. They were not used to train the model or select its threshold.”

If time remains, select Arjun Nair, GT-004, and briefly show the lower-estimate negative illustration. Do not describe it as a clinically safe patient.

## 10:30-12:15 | Missing data and rejected inputs

Return to GT-001 and reset. Choose Sensor dropout. Point to the unavailable estimate and missing forecast. Then choose Cold start, Invalid units, and Disconnected feed, allowing the viewer to read each reason. Return to Patient scenario at the end.

Narration: “The prototype withholds its forecast when the feed is stale. Its 30-minute freshness limit is an engineering policy. It isn't a clinical standard. Cold start, invalid units, and a disconnected feed also produce explicit unavailable states. The screen must not turn missing information into a reassuring low percentage.

“The interface requires nine observations before showing its forecast. The synthetic training eligibility uses at least five contiguous observations, and the real benchmark requires 24. Those are separate contracts, and the documentation records the difference. We test input order, gaps, units, and export parity in the model and browser code. These scenario controls demonstrate selected failure states; they are not a live sensor integration.”

Use the time slider to show a starting point with insufficient history and then restore 12:00. Explain that the status text and forecast must agree. Avoid implying that the scenario dropdown itself validates real hardware.

## 12:15-13:50 | Architecture and reproducibility

Show slide 6 and the architecture PDF. Trace the browser path in order. Then show the repository structure and current startup/test commands without displaying secrets or private folders.

Narration: “The running app is a React and TypeScript application built with Vite. Browser inference uses exported synthetic logistic coefficients and scaling values. A Python service is not required at runtime. That keeps the demo reproducible without accounts, paid APIs, or patient uploads.

“The offline Python pipeline generates synthetic data, makes patient-level splits, fits the scaler and classifier on training people, selects thresholds on validation people, and exports versioned JSON. Browser parity fixtures compare the TypeScript calculation with Python outputs. The real benchmark uses a separate local pipeline and exports aggregate evidence only.

“A digital-twin claim also needs care here. This prototype updates a virtual patient state with simulated sensor observations. It has no physical patient connection, no validated physiology simulator, and no autonomous treatment loop.”

Allow 30 seconds to inspect the actual file paths and version fields. Do not claim a test run passed unless the recorded command or verified report shows it.

## 13:50-15:35 | Synthetic evidence

Show slide 8 and the Model evidence tab or public/model-evidence.json. Read the split counts, common test denominator, and all four PR-AUC values. Explain average precision and prevalence briefly.

Narration: “The synthetic evaluation includes 240 people, split 144 for training, 48 for validation, and 48 for testing. The held-out comparison uses the same 30,248 eligible windows. PR-AUC here means average precision, not trapezoidal area under a plotted curve.

“Fused PR-AUC is 0.3205 compared with 0.2837 for dynamic-only, 0.1776 for static-only, and 0.0773 for constant persistence scores. The fused patient-bootstrap interval is about 0.2731 to 0.3581. Those correlated windows are not 30,248 independent patients.

“The frozen synthetic threshold is 0.15. It produces 944 false alerts over 336 patient-days, about 2.81 per day. It warns 293 of 334 forecastable episodes, with median lead time of 30 minutes and window precision of 27.2%. The episode count and alert burden belong together. Alert thresholds were selected separately for each model, so workload is not matched across models.”

Show the continuous-model results: 120-minute persistence MAE 19.55 mg/dL versus 33.85 for the clipped linear trend. Explain why the app defaults to persistence.

## 15:35-17:35 | Real benchmark and uncertainty

Show slides 9 and 10, followed by the aggregate real evidence file. Keep the paired interval and false-alert figure visible together during the explanation.

Narration: “The real feasibility study has 60 training, 20 validation, and 20 held-out people. There are 20,687 eligible test windows, with event prevalence about 9.95%. Fused PR-AUC is 0.3422 and dynamic-only is 0.3398. The difference is about 0.0024. Its paired patient-bootstrap interval runs from about minus 0.00248 to plus 0.00758 and includes zero. We have not established a meaningful fusion benefit on these data.

“At the validation-selected threshold of 0.20, window precision is 28.9% and recall is 50.5%. The model warns 302 of 326 forecastable episodes, with a 45-minute median lead. It also produces 754 false alerts, or about 2.97 per recorded patient-day. The denominator includes gaps and periods already above range. It is recorded-span time, not verified sensor uptime.

“Alerts have a 120-minute cooldown. Episodes and alerts are counted separately, and one alert can warn more than one episode inside its horizon. These details explain why event sensitivity alone would overstate usefulness. The study is retrospective, small, and geographically limited. It cannot validate care in India.”

Spend the remaining time pointing to the actual denominator, bootstrap protocol, and excluded features. The displayed real metrics must never be called the browser model's test results.

## 17:35-18:55 | Limits, privacy, and next validation

Show slide 11. Return briefly to the unavailable-state UI if useful.

Narration: “Before clinical use, this would need independent local validation, verified feature timing, clinician review of the event definition and acceptable alert burden, and ethics, privacy, and security review. A larger model alone would not resolve those questions.

“The public demo collects no real patient records. The real source files remain outside the repository and recording. We make no claim of regulatory compliance, diagnostic ability, treatment benefit, or safe dosing. The next research question is whether a carefully timed and externally tested model can reduce false alerts while retaining useful advance warnings. Our present results do not answer that.”

Use the remaining time to distinguish a software quality check from clinical validation and a synthetic illustration from a representative test cohort. Keep the explanation tied to what the viewer just saw.

## 18:55-20:00 | Licensing, disclosure, and close

Show slide 12, LICENSE, and the contribution disclosure. Show only the approved release repository link if publication has actually happened. Otherwise show the local public-safe project folder without claiming it is public.

Narration: “Original project code uses the MIT license. Dependencies retain their licenses. The Shanghai dataset and its derived evidence retain CC BY 4.0 attribution, including the source DOI and the notice that we derived features and aggregate benchmark results.

“OpenAI assistance contributed substantially to planning, interface design, implementation, model evaluation, tests, and documentation. That contribution is disclosed. I remain responsible for reviewing the entry and answering the organizer's authorship questions truthfully.

“GlucoTwin demonstrates an inspectable synthetic replay, working event inference, explicit unavailable states, and reproducible evidence. The real benchmark shows a small, uncertain fusion difference and a false-alert burden that needs further research. The repository includes the commands and model cards needed to examine those results.”

End at exactly 20:00 after showing the verified artifact names. Do not announce registration, submission, deployment, or acceptance unless each has been independently confirmed.

## After recording

Check the actual exported duration of exactly 20:00 with a media probe. Host the approved video as unlisted on YouTube and include the verified link in the project README. Watch the full video once, including the beginning and end, with sound. Verify legible UI, correct values, functioning controls, and no private material. Make sure the successful warning, false positive, missed episode, and missing-data states all appear. Verify that the real and synthetic evidence remain clearly separated. Upload only after the authorized destination and final platform requirements are known, and verify that the intended reviewers can play it. A script, slideshow render, or unplayed media file is not proof of a completed working-product walkthrough.
