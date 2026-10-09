# GlucoTwin synthetic model card

## Status and intended use

**Engineering demonstration only. This model has never been clinically validated. Do not use it for diagnosis, treatment, triage, or dosing.** All people, profiles, readings, labels, and results in these artifacts are synthetic. No ShanghaiT2DM rows were used. This is a toy statistical generator, not a validated Type 2 diabetes physiology simulator and not evidence of Indian-population generalization.

Static HbA1c, age, and duration affect the synthetic signal generator by design. Consequently a measured advantage from fusion establishes software functionality under that generator, not a scientific or clinical advantage. The UI uses selected held-out synthetic traces from the same generator: one successful warning, one false positive, one genuinely missed episode (every eligible warning origin below the chosen threshold) and one low-estimate negative window. They illustrate behavior, not representative performance; future fixtures must remain hidden until replay reaches them.

## Reproduce

From the project root, using Python 3.11+ and the versions in requirements.txt:

    OPENBLAS_NUM_THREADS=1 python model/train.py
    python -m unittest discover -s model -v

Training writes public/model.json, public/model-evidence.json, public/model-parity.json, public/model-demo.json and model/split-manifest.json. It uses no credentials, downloads, external services, or real records. CPU training is deterministic using seed 20261009. Model/evidence JSON is sufficient for browser inference; no pickle deserialization or Python server is needed at runtime. The standard library unittest suite needs no test package.

## Frozen target and eligibility

At a forecast origin t, the target is two consecutive readings strictly above 180 mg/dL among t+15 through t+120 minutes. A pair must be fully inside this window. Two observations span 15 minutes; this is not a 30-minute duration claim. Incomplete future observation, a target gap, or a nonfinite future value produces an unknown label, not a negative.

We conservatively exclude every origin whose current reading is >180 mg/dL, including a single high value. This is stricter than excluding only established two-point episodes, and ensures the model never calls an already-high reading an advance warning. Origins with fewer than five observations or noncontiguous 15-minute history are ineligible. The engineering stale boundary is 30 minutes since the last sample; this is not a clinical standard. Invalid units, duplicate/out-of-order timestamps, glucose outside 40–400, invalid adult static ranges and future-dated profile information are rejected.

## Features and fusion

The dynamic feature vector is current glucose, OLS slope per minute over the trailing five observations (inclusive 60-minute span), their arithmetic mean, and population standard deviation (ddof=0). OLS uses centered minute offsets [-30,-15,0,15,30] and denominator 2250. The static vector is age, diabetes duration in years, and baseline HbA1c percent. Synthetic profile information is dated before the sensor trace. Real undated HbA1c is not allowed by this contract.

Three separately trained StandardScaler + LogisticRegression models use static-only, dynamic-only, and concatenated fused inputs. Scaling is fitted solely on training patients. A sigmoid of the exported scaled coefficient sum gives a synthetic-model estimate. It must not be presented as a calibrated clinical probability. Contributions are model associations, not causal physiological explanations.

## Splits, thresholds, metrics and dependence

There are 240 synthetic people, each with seven days of 15-minute readings. A fixed patient-level permutation assigns 144 training, 48 validation and 48 test people; all windows for a person remain together. Splits and seed are saved. No full-trace normalization, future meals, future medications, future noise, centered smoothing, or future patient outcomes enter predictors. Temporal dependence remains within people and is expressly acknowledged.

All four event methods evaluate exactly the same held-out eligible origins. Each logistic model's alert threshold maximizes validation F1 over a prespecified grid 0.10–0.80 by 0.05; no threshold is selected from the test set. This means alert burdens are not matched. Persistence on the eligible set forecasts a constant value at or below 180 and always predicts no event; its constant-score PR-AUC is therefore prevalence. Static-only is a useful separate ablation, not a personalized model.

Public evidence includes prevalence, precision, recall, average precision (labeled PR-AUC), ROC-AUC, Brier score, reliability bins, event sensitivity, false alerts per patient-day, lead times, and counts. Average precision is not trapezoidal PR-curve area. Episode evaluation requires a transition from <=180 into at least two >180 points. An episode is forecastable only if an eligible origin can see both future high points in its horizon. Alerts use a per-person 120-minute cooldown; each warned episode is counted once. Patient-days are total monitored days (including current-high periods), rather than only eligible forecast time. Descriptive cluster-bootstrap bounds use 300 resamples of complete held-out people; overlapping windows are not treated as independent patients.

False-positive, missed-event-window, and successful-warning examples are selected after aggregate evaluation as illustrations. They are not representative accuracy claims and are not used for training or threshold selection.

## Continuous chart and uncertainty

The continuous chart defaults to a **separate persistence baseline**, not the trained logistic model's prediction: it holds the current glucose value constant. An alternative linear-trend baseline is also evaluated; its slope is clipped to [-1,+1] mg/dL/min and future value is current + clipped slope × minutes. Persistence has lower held-out MAE, motivating the default. MAE and RMSE are measured at 30/60/120 minutes on the same held-out origins.

Each horizon's descriptive band is the validation 90th percentile absolute residual about its baseline. Test marginal coverage is reported separately at 30/60/120 minutes. These are not formal patient-specific confidence intervals: repeated windows are correlated, the generator is artificial, and unseen patients or shifted data may have very different coverage. Do not draw arbitrary decorative bands. The logistic event estimate and the displayed persistence trajectory are separate models and may disagree.

## Tests and next validation gate

Tests cover OLS/std correctness, future-reading invariance, profile timing, person-split isolation, stale boundary, history gaps, duplicate/order, invalid units/values, current-high exclusion, exact event boundaries, unknown missing labels, exported-inference parity, generator determinism, and common test denominators. Browser inference must also pass the exported parity vectors against the actual TypeScript implementation.

Before any real benchmark: audit licensing, paired person IDs, dates, units, adult eligibility and lab availability; retain all sessions for a person in one split. Undated/future labs and outcome-derived summary fields must be excluded. Real row-level clinical files must remain outside the public repository and demo. Clinical use would require independent local validation, safety review, ethics/security work, and supervised clinician studies well beyond this prototype.
