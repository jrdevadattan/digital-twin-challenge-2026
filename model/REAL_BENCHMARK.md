# Separate real retrospective feasibility benchmark

This optional benchmark is **not the synthetic model running in the browser**. It exports aggregate evidence only. It is not prospective, clinical, or Indian-population validation.

## Source and permitted interpretation

Zhao et al., *Chinese diabetes datasets for data-driven machine learning*, Scientific Data (2023), DOI: [10.1038/s41597-023-01940-7](https://doi.org/10.1038/s41597-023-01940-7). Source archive: [Figshare v5](https://figshare.com/articles/dataset/diabetes_datasets_zip/21600933/5), DOI 10.6084/m9.figshare.21600933.v5, CC BY 4.0. Modifications: conversion of source observations into trailing statistical features, grouped evaluation and aggregate metrics. Preserve source attribution and [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) when sharing derived results. Code licensing does not change the dataset's terms.

Verified source archive SHA-256: 59b5f5c4053a32bb6b7827844a0191597dc82228fe88ce332a189fdfc659c4cb.

The dataset has 100 adults and 109 recording sessions. All sessions for a person are grouped together. Source timestamps are timezone-naive and remain so; no UTC or IST is invented. Headers support mg/dL, including two files with bare CGM headers interpreted using the accompanying source documentation. Missing measurements are not imputed. The measured range 39.6–468 mg/dL is retained; values above the synthetic UI contract's 400 limit are not silently discarded or clipped.

Retrospective age and recorded-gender context from the study summary is paired with past-only CGM. Demographic availability at each forecast origin is assumed from study context, not independently timestamp-verified. All undated laboratory values, diabetes duration, BMI, medication/complication history and outcome-derived fields are excluded. This is a necessary limitation; do not describe these as verified prospectively available EHR fields.

## Protocol

A fixed seed (20261040) partitions sorted person IDs into 60 train, 20 validation and 20 held-out test people. The public artifact includes only a SHA-256 digest of the split manifest. Exact groups can be reproduced from the authorized source; no person IDs or per-person rows are exported.

Eligible windows require 24 contiguous current/past 15-minute observations (345-minute span), current glucose <=180, and eight contiguous future observations. Missing outcomes are unknown, not negative. Positive labels require two consecutive >180 readings fully inside the next 120 minutes. Independent audit counts match exactly: 88,715 eligible windows, 10,782 positive windows over all splits.

Dynamic features: current glucose, last-five-point OLS slope/mean/population standard deviation, and mean/population standard deviation across the full 24-point trailing window. Static features: age and source-recorded gender code. Three StandardScaler + LogisticRegression pipelines are fitted exclusively on training people. Thresholds maximize validation F1 over 0.10–0.80 by 0.05; the test set is not used to select them. Models share identical eligible evaluation origins. Alert burdens are not matched, so compare both discrimination and workload.

Episodes are deduplicated transitions into two high readings. Each must have an eligible advance forecast origin. Alerts have a 120-minute cooldown per recording. A single alert can warn multiple distinct episodes inside its horizon; each episode is counted once and each alert is counted once. Consequently true-alert count need not equal warned-episode count. False alerts per day use total observed recording duration (last minus first timestamp plus 15 minutes), including current-high periods and gaps; this denominator is disclosed rather than presented as eligible-only time.

Patient-cluster bootstrap intervals use 300 resamples of whole held-out people. The artifact also reports a paired bootstrap interval for fused-minus-dynamic PR-AUC. There are only 20 held-out people; thousands of overlapping windows do not substitute for independent patients.

## Initial measured results and limits

See real-benchmark-evidence.json for reproducible full metrics, calibration bins, Brier scores, alert burden and continuous-baseline errors. The initial held-out result is PR-AUC 0.3422 fused versus 0.3398 dynamic, 0.1189 static and 0.0995 persistence/prevalence. The small fusion difference is not evidence of clinically meaningful improvement.

At the validation-selected 0.20 threshold, fused precision is about 0.289 and per-window recall about 0.505. Although 302 of 326 forecastable episodes were warned, 754 false alerts across approximately 254 monitored patient-days correspond to 2.97 false alerts per day. This workload is substantial; do not advertise episode sensitivity without the false-alert burden. Lead-time median is 45 minutes.

Persistence also beats the clipped linear-trend trajectory at 120 minutes (MAE about 25.99 versus 42.30 mg/dL). Neither trajectory is the logistic event model. Validation absolute-residual bands have descriptive held-out marginal coverage only, not individual clinical uncertainty guarantees.

## Reproduce without exposing source records

Keep the downloaded archive and extracted workbooks outside the repository, public assets, screenshots and video. Install versions from requirements-real.txt if needed, then run from the project root:

    OPENBLAS_NUM_THREADS=1 python model/benchmark_real.py --data-dir /path/outside/repository/extracted-data
    python -m unittest discover -s model -v
    cp model/real-benchmark-evidence.json public/model-real-evidence.json

The data directory must contain Shanghai_T2DM_Summary.xlsx and Shanghai_T2DM/. The script reads data locally, never sends data to another service, and writes only model/real-benchmark-evidence.json by default. It does not export fitted real-data coefficients, traces, individual predictions or selected real examples. Never point the output argument at a public row-level export; that workflow is intentionally unsupported.

Future work requires external validation, verified feature availability, locally relevant sampling, clinician review of outcome/alert trade-offs, and privacy/security/ethics review. This preliminary retrospective benchmark does not establish fitness for care.
