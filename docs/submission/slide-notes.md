## Slide 1



## Slide 2

Project scope: docs/approved-plan.md. No clinician interview or usability study has been performed.

## Slide 3

Project-specific event protocol; threshold context: Battelino et al., International Consensus on Time in Range (2019), https://pubmed.ncbi.nlm.nih.gov/31177185/. The episode protocol is not an emergency definition or a treatment trigger.

## Slide 4

Sources: model/README.md, model/REAL_BENCHMARK.md, public/model-evidence.json, model/real-benchmark-evidence.json. Zhao et al. (2023), https://doi.org/10.1038/s41597-023-01940-7.

## Slide 5

Implementation: src/App.tsx and src/lib/engine.ts. Session-only notes and acknowledgments never contact a clinical system. No live EHR or sensor connection.

## Slide 6

Implementation: src/lib/engine.ts, src/App.tsx, model/train.py, model/benchmark_real.py. Browser runs synthetic JSON coefficients; the real benchmark exports aggregates only.

## Slide 7

Sources: model/README.md and public/model-evidence.json. Synthetic persistence 120-minute MAE 19.55 mg/dL; clipped linear trend 33.85 mg/dL. The bands use validation 90th percentile absolute residuals; marginal coverage is measured per horizon.

## Slide 8

Source: public/model-evidence.json; seed 20261009; split 144/48/48 people. Average precision is labeled PR-AUC. Threshold 0.15 selected on validation. Patient bootstrap uses 300 resamples; fused PR-AUC 95% interval 0.2731 to 0.3581. Generator-driven evidence only.

## Slide 9

Source: model/real-benchmark-evidence.json. ShanghaiT2DM v5, https://doi.org/10.6084/m9.figshare.21600933.v5, CC BY 4.0. 60/20/20 patient split; 20,687 eligible test windows. Average precision is labeled PR-AUC. Paired cluster bootstrap: 300 resamples of 20 test people.

## Slide 10

Source: model/real-benchmark-evidence.json, model/REAL_BENCHMARK.md. At threshold 0.20 chosen on validation: precision 0.289, recall 0.505, Brier 0.0787. 120-minute alert cooldown per recording. Episodes and alerts separately deduplicated; one alert may warn multiple episodes. Denominator is recorded-span time, including gaps and current-high periods.

## Slide 11

Sources: public/model-demo.json, src/lib/engine.ts, model/test_model.py, model/test_real.py. UI requires nine samples; synthetic training requires at least five. Real benchmark requires 24 contiguous past/current samples. UI 30-minute stale limit is an engineering policy.

## Slide 12

Sources: README.md, model/README.md, model/REAL_BENCHMARK.md, docs/CONTRIBUTIONS.md, docs/THIRD_PARTY_NOTICES.md. Dataset: Zhao et al. (2023), https://doi.org/10.1038/s41597-023-01940-7; release https://doi.org/10.6084/m9.figshare.21600933.v5, CC BY 4.0 https://creativecommons.org/licenses/by/4.0/. Derived trailing features and aggregate evaluation are modifications.
