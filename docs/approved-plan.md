# Digital Twin Challenge concept and delivery plan

Prepared 9 October 2026. This is a proposed design for approval, not an implementation or a clinical product. No model has been trained and no performance results are claimed.

## Recommendation

Build **GlucoTwin**, a working-title research dashboard for a clinician reviewing adults with Type 2 diabetes. A timestamped patient profile and a replayable glucose sensor stream update a virtual patient state and a forecast of a high-glucose excursion within the next two hours.

The strongest achievable distinction is an excellent review workflow backed by honest evidence: patient-matched inputs, uncertainty, stale-data handling, reproducible baselines, and an inspectable record of what the model knew when it made a prediction. The public demonstration uses synthetic people and readings. An anonymized open-data benchmark is conditional on a successful license, feature-timing, and leakage audit.

This is a recommendation about fit and feasibility. It is not an estimate or guarantee of selection odds. The organizer has not published numeric judging weights in the inspected material.

## Confirmed challenge constraints

The [official listing](https://unstop.com/hackathons/crp-digital-twin-challenge-2026-happiest-health-1757873), inspected through the signed-in browser on 9 October, requests one localized outcome for a chronic or lifestyle condition prevalent in India. It requires static historical/EHR information and dynamic wearable/IoT time series, a working adverse-event prediction model, and a doctor-facing interface. Anonymized, open-source, and synthetic training data are allowed. Type 2 diabetes and a two-hour glucose prediction are explicit examples.

The event is free and allows teams of one to four students. Registration closes 18 October at 19:00 IST; prototype submission closes 20 October at 19:00 IST. Required submission materials include a public GitHub repository, README with team/college/use case/stack/model/license details, architecture PDF or PPT, project presentation PDF or PPT, and a video of **at least 20 minutes**. The required folder convention is `Team Name_College Name`.

The inspected page disagrees about whether the initial shortlist has five or ten teams. Exact jury dates, numeric rubric, AI-assistance rules, and additional submission-form attestations remain unverified. These do not block design research, but must be checked before final submission.

## Three credible concepts

| Concept | Useful outcome | Evidence and scope | Trade-off | Recommendation |
| --- | --- | --- | --- | --- |
| GlucoTwin | Help a reviewer inspect an approaching glucose excursion and understand whether the forecast is trustworthy | Paired clinical and CGM data exist; a focused event is measurable; a replayable synthetic demonstration is straightforward | Small, non-Indian benchmark; some static labs have unsafe timing; two-hour accuracy remains unknown | Best fit for this deadline |
| PressureTwin | Flag a possible next-day sustained high home-BP pattern using history and cuff/activity readings | Strong condition fit and intuitive daily-review screen; fully synthetic prototype possible | This research has not verified a suitable open same-person longitudinal dataset; cuff measurement schedules and event labels complicate evaluation | Credible fallback only if the user prefers hypertension |
| RhythmTwin | Forecast an upcoming atrial-fibrillation episode from an ECG stream and patient context | [Long Term AF Database](https://physionet.org/content/ltafdb/1.0.0/) offers 84 long ECG recordings and rhythm annotations | Reviewed source does not establish the needed rich paired EHR; forecasting onset is harder than detecting current AF; signal-processing work consumes the deadline | Defer |

The comparison is qualitative and not the organizer's scoring rubric. No arbitrary numerical scores or winning probabilities are assigned.

## Why the recommended concept is useful

The concrete workflow question is: “Which synthetic patient deserves a closer look, what changed, and how much should I trust this forecast?” A clinician can move from a worklist to the underlying observations and model evidence without interpreting a generic health score.

India relevance is supported by the [ICMR-INDIAB national study](https://doi.org/10.1016/S2213-8587(23)00119-5), published in 2023, which estimated 101 million people with diabetes in India for 2021. That establishes the importance of the condition; it does not validate this proposed model or establish that a Chinese dataset generalizes to India. The intended future setting is a supervised research pilot in a diabetes clinic, after clinical, ethical, security, and local validation review.

Avoid claiming a new scientific forecasting algorithm. The defensible product distinction is evidence-first interaction and honest forecasting under imperfect data. A three-dimensional body, a general medical chatbot, genetic features without data, and a large language model producing glucose numbers do not improve the core proof.

## Dataset decision and provenance

### Primary candidate for a retrospective benchmark

[ShanghaiT2DM](https://www.nature.com/articles/s41597-023-01940-7) contains paired clinical information and 15-minute CGM from 100 Type 2 diabetes participants, with recording periods of approximately 3–14 days. The paper-linked [Figshare collection](https://figshare.com/collections/Diabetes_Datasets_ShanghaiT1DM_and_ShanghaiT2DM/6310860) leads to [release 5 dated 30 October 2023](https://figshare.com/articles/dataset/diabetes_datasets_zip/21600933), a public 3.57 MB download marked CC BY 4.0. Prefer this release over the older 20425518 record.

Critical timing caveat: the original paper permits laboratory measurements up to six months before or after CGM. An undated HbA1c, glucose lab, or similar result must not become a supposedly available prospective feature. Exclude such fields from the main benchmark unless timestamps prove availability. Start with reliable pre-existing demographic/context fields and past CGM; add fields only after audit. Report this as a retrospective feasibility benchmark, not clinical validation.

The source paper has a counting inconsistency in its description of recording periods. Count distinct people and sessions from the actual selected release instead of reproducing every published subtotal. All sessions from one person belong to the same split. Check adult eligibility, IDs, units, duplicates, missing values, timestamps, and field meaning before any training. Exclude summary fields such as hypoglycemia occurrence that may have been derived from the recording's outcomes. The download button is verified; the binary transfer, workbook contents, direct endpoint, and checksum are not yet verified.

The original article is also available from its [author's university repository](https://acris.aalto.fi/ws/portalfiles/portal/100206019/Chinese_diabetes_datasets_for_data_driven_machine_learning.pdf).

### Alternatives and reasons to defer them

- [CGMacros](https://physionet.org/content/cgmacros/1.0.0/) has baseline clinical measurements before sensor placement and paired glucose/activity/diet data. Its [paper](https://pubmed.ncbi.nlm.nih.gov/40998842/) describes 45 participants, only 14 with Type 2 diabetes. Its CC BY-NC-SA 4.0 terms require additional rights review for this competition and any commercial future use. Its [biological dictionary](https://physionet.org/content/cgmacros/1.0.0/DataDictionary_Bio.csv) also has a suspicious HbA1c unit label and explicit error sentinels. Defer it from the critical path; do not silently pool other populations and call that Type 2 validation.
- [Synthea](https://github.com/synthetichealth/synthea) can produce reproducible synthetic patient records. It is Apache-2.0 software, but generated formats and terminology have their own notices. Its default US population assumptions are not evidence of Indian representativeness. Use a small synthetic schema fixture unless full Synthea output adds demonstrated value.
- [simglucose](https://github.com/jxx123/simglucose) models Type 1 diabetes. Do not relabel it Type 2 or claim this open implementation is an FDA-approved product.
- [MIMIC-IV](https://physionet.org/content/mimiciv/3.0/) has credentialing, training, and data-use obligations. [PhysioNet also restricts sharing credentialed data with online AI services](https://physionet.org/news/post/gpt-responsible-use/). It is unnecessary for this deadline.

### Data handling boundary

Real row-level clinical data stay outside the public repository, screenshots, video, and hosted demo. Keep data acquisition instructions, release IDs, checksums, transformations, code, and aggregate results. The public app contains only clearly labeled synthetic profiles and traces. Do not fabricate a same-person link between a random Synthea record and an unrelated real sensor trace.

Review the [CC BY 4.0 terms](https://creativecommons.org/licenses/by/4.0/) and preserve attribution, license references, and modification notices. Source-code licensing does not automatically relicense data or dependencies. Do not claim consent, anonymization guarantees beyond the source, or regulatory compliance merely because a dataset is downloadable.

## Forecast specification

The proposed main target is a **new above-range episode within the next 120 minutes**, represented operationally by at least two consecutive 15-minute readings above 180 mg/dL within that future window. Two readings establish persistence across 15 minutes, not 30 minutes. Score only forecast origins that are not already in an above-range episode. An existing high reading is a current observation, not an advance prediction.

The threshold draws on [international CGM time-in-range consensus](https://pubmed.ncbi.nlm.nih.gov/31177185/). The exact episode protocol is a project definition, not a claim that this threshold means an emergency. It is not a diagnosis or a treatment trigger. Freeze the operational definition before opening the test set.

At time t, inputs may include the last six hours of observed CGM, recent slopes and variability, known clock time, freshness/missingness, and approved static fields available by t. Never use future meals, future medications, later laboratory tests, centered smoothing, or the person's full-series mean. Missing future target readings are not negative labels.

Start with persistence and a simple linear trend for continuous forecasting, plus logistic and gradient-boosted models for the binary episode. Use CPU-friendly scikit-learn models unless a measured limitation justifies more complexity. A separate quantile regression forecast can supply a median trajectory and interval, but label it separately from the episode probability and test their consistency. [Histogram gradient boosting supports quantile loss](https://scikit-learn.org/stable/auto_examples/ensemble/plot_hgbt_regression.html); interval coverage must be measured rather than presumed.

Patient adaptation is an optional extension after the core model works. Use only an initial observation period or matured past outcomes, record when the personalized state changed, and compare against the locked population model. Do not use the test patient's later outcomes to tune their earlier predictions.

## Objective validation plan

1. Create a versioned data manifest and fixed patient-level train, validation, and held-out test split. A provisional 60/20/20 person allocation may need adjustment after eligibility checks. Fit preprocessing only on training people. Preserve chronology inside each person. [Grouped and temporal cross-validation](https://scikit-learn.org/stable/modules/cross_validation.html) address distinct leakage problems; applying a random row split does neither.
2. Lock model selection, missing-data policy, event definition, threshold, and alert cooldown using training/validation only. When performing within-person adaptation, purge overlapping label horizons at the adaptation/evaluation boundary.
3. Run persistence/trend, static-only, dynamic-only, and fused comparisons on the same eligible forecast origins. Static fusion may not improve performance. Report that honestly rather than changing the test subset or target until it appears to work.
4. Report 30/60/120-minute MAE and RMSE for any continuous output. For events report prevalence, PR-AUC, precision/recall at the fixed threshold, calibration/Brier score, event-level sensitivity, false alerts per patient-day, and lead-time distribution. Separate current-event detection from future-event prediction. Deduplicate repeated alerts for one episode.
5. Report person and episode counts, not just thousands of correlated windows. Use patient-level bootstrap intervals when meaningful and mark small-sample subgroup results exploratory. Compare performance at similar alert burden. Synthetic-data metrics and real-data metrics stay in visibly separate sections.
6. Test no-forecast behavior under stale feeds, gaps, duplicated/out-of-order observations, invalid units, cold start, model-loading failure, and out-of-range inputs. Do not interpolate across target gaps or silently create outcomes.
7. Publish at least one false positive, one missed episode, and one successful warning. Select the presentation examples after establishing the aggregate results, and label examples as illustrations rather than representative accuracy claims.

No success percentage is promised before evaluation. A trustworthy unsuccessful fusion result is preferable to an inflated claim. If the data audit blocks a valid real benchmark, preserve the synthetic engineering demonstration and clearly limit the submission claim to that scope; inform the user before representing the weaker evidence as the completed plan.

## Interface and demonstration scope

### Main screen

Use a restrained, polished desktop/tablet clinician workspace: clear typography, warm neutral surfaces, a deep blue/teal accent, tabular numerals, and consistent spacing. Avoid visual clutter, decorative body models, and red/green-only status encoding.

- Left: a compact worklist of four clearly synthetic patients, with forecast state, sensor freshness, and a small trend.
- Center: selected virtual-patient summary and the main glucose chart. Historical observations, forecast start, predicted interval, threshold, and unit are unmistakable. The future actual trace remains hidden until replay reaches it.
- Right: event probability or unavailable state, exact prediction timestamp and horizon, model/version, data completeness, and a plain-language summary of actual inputs.
- Secondary tabs: history, model evidence, and provenance. The evidence tab shows measured baseline/fusion comparisons, split protocol, sample counts, known limitations, and reproducibility instructions.
- Bottom or toolbar: pause, replay, speed, reset, and scenario selection. Simulated time and wall-clock time must not be confused.

### Essential interaction story

1. Open a synthetic patient whose readings are changing.
2. Advance the feed; watch the virtual state and forecast update from actual inference.
3. Inspect what input information was available and how uncertain the forecast is.
4. Advance to the observed outcome without revealing it early.
5. Switch to a sensor-dropout case. The app shows why it withheld or invalidated a prediction.
6. Open the evidence view and show what the system achieved on its actual test protocol, including failures.

Human-review controls may acknowledge a demo alert or add a synthetic review note. They must not imply a real clinical action was sent. Feature contributions, if implemented, must come from the displayed model version and be labeled associations within the model, not physiological causes. A deterministic input summary is sufficient; no language model is required for inference or explanation.

### Acceptance bar

- Cohesive clinician dashboard at desktop and tablet sizes; no clipped charts or unreadable panels.
- Keyboard navigation, visible focus, meaningful headings/labels, readable contrast, text alternatives for status and charts, and reduced-motion support.
- Every visible control works or is clearly disabled with a reason. No blank screens, dead links, swallowed failures, or misleading success states.
- Consistent glucose units and explicit timestamps/time zone; a unit toggle, if included, changes numbers, thresholds, and labels together.
- Tested loading, empty, cold-start, missing, stale, disconnected, invalid-input, and server-error states. A proposed engineering stale limit is two missed 15-minute readings; disclose that it is a prototype policy rather than a clinical standard.
- Forecast uncertainty and provenance are always available. Stale or unavailable data never look reassuringly low risk.
- Replay is deterministic, resettable, and genuinely reproducible from a clean start.
- The public UI visibly states “Research prototype · Synthetic demo · Not for clinical decisions.”
- Full walkthrough duration is at least 20 minutes and uses the actual working interface.

## Architecture and scope limits

Suggested path: timestamped profile and sensor fixtures → schema/unit/quality validation → versioned per-patient rolling state → fixed feature extraction → model inference/calibration → forecast/quality response → dashboard and local review log. A separate offline pipeline creates the reproducible benchmark and aggregate evidence artifacts. Use the same feature implementation for training and inference.

A small Python inference service and a TypeScript interface are sufficient. Prefer available project tooling; finalize the stack during the engineering review after approval. Pin versions and keep one-command startup/test instructions. No account system, real EHR integration, paid APIs, or public patient upload is needed. No persistent health-data collection should be introduced for this prototype.

The app is a simulated-data digital-twin proof of concept. It dynamically updates patient state, but it is not a validated mechanistic physiology simulator or an autonomous treatment loop. This distinction is consistent with the [FDA educational digital-twin glossary](https://www.fda.gov/science-research/artificial-intelligence-and-medical-products/fda-digital-health-and-artificial-intelligence-glossary-educational-resource), which emphasizes dynamic updating and interaction with the physical counterpart. The real-sensor integration and supervised clinical feedback loop belong to future work.

## Ten day delivery sequence

Planning and design approval occur on 9 October. Proposed build window is 10–19 October, leaving the deadline day as contingency. This assumes a focused assisted solo build; it is not a promise about the user's available hours.

| Date IST | Outcome and verification gate |
| --- | --- |
| 10 Oct | Freeze outcome and scope; verify selected data release, units, adult eligibility, timestamps, license, and patient IDs. Decide whether the real benchmark is viable. |
| 11 Oct | Reproducible preprocessing, split manifest, synthetic fixtures, and persistence/trend baselines. Leakage tests pass. |
| 12 Oct | Fused/static/dynamic models and validation protocol; no final test tuning. |
| 13 Oct | End-to-end vertical slice: replay → model → forecast → chart. |
| 14 Oct | Complete patient worklist, evidence/provenance view, and interaction design. |
| 15 Oct | Held-out evaluation, calibration and alert metrics; record failures and limits. |
| 16 Oct | Accessibility, responsiveness, error paths, stale data, and clean-environment reproducibility. |
| 17 Oct | Architecture diagram, project deck, README, data/model cards, licenses and contribution disclosure. |
| 18 Oct | Record and review a 22–24-minute walkthrough with readable UI and actual results. |
| 19 Oct | Final secret/privacy/license/claims/link audit; approved publication and submission; verify receipt. |

Do not add a second condition, wearable integrations, causal meal/exercise recommendations, insulin dosing, a chatbot, or a deep-model bakeoff. If time compresses, protect the working model, evidence, UI error states, and required submission artifacts first. Drop optional personalization and extra chart types.

## Video and submission story

Aim for 22–24 minutes to stay safely above the required minimum after editing:

- 0–2 min: user problem, precise outcome, and scope
- 2–5 min: two data streams, provenance, static-timing caveat, and synthetic/real separation
- 5–12 min: working replay, forecast, evidence inspection, and observed outcome
- 12–15 min: missing-data and false-positive/missed-event examples
- 15–19 min: architecture, baselines, patient split, calibration and actual test results
- 19–22 min: reproducibility, limitations, privacy/licensing, and next validation step
- Final 1–2 min: concise recap and repository navigation

The deck should tell the same story in approximately 10–12 slides. Produce the architecture in the required PDF/PPT form, not only an image embedded in the README. The video must not show secret keys, browser account information, real participant records, private contact details, or fabricated successful outputs. Keep a truthful AI/tool contribution record and review any final contest attestations.

## Remaining decisions and blockers

1. User design approval is the immediate gate before implementation.
2. Inspect the final submission form and linked official rules for AI assistance, IP, additional attestations, and the shortlist discrepancy.
3. Verify raw release contents and feature timestamps before deciding the real benchmark's final feature set. Reading a paper is not a completed dataset audit.
4. No clinician interview or usability study has been performed. Describe the workflow as a proposed clinician-facing design, not clinician-validated.
5. Verify that the release contains only authorized public contents at the publication gate. Development remains private until the approved submission release is ready.

**Approval question:** Shall I build GlucoTwin with this scope: a polished two-hour glucose forecast dashboard, synthetic demo patients, and a carefully audited open-data benchmark?
