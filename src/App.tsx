import { useEffect, useState } from "react";
import model from "../public/model.json";
import evidence from "../public/model-evidence.json";
import realEvidence from "../public/model-real-evidence.json";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Clock3,
  Database,
  FileCheck2,
  FlaskConical,
  HeartPulse,
  Info,
  LayoutDashboard,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  SkipForward,
  Users,
  WifiOff,
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Card } from "./components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/ui/tabs";
import {
  clockLabel,
  infer,
  initialStep,
  maxStep,
  patients,
  type Scenario,
  type TwinState,
} from "./lib/engine";

function Sparkline({ state }: { state: TwinState }) {
  return (
    <svg viewBox="0 0 90 32" className="sparkline" aria-hidden="true">
      <polyline
        points={state.readings
          .map(
            (r, i) =>
              `${(i * 90) / Math.max(1, state.readings.length - 1)},${30 - (r.value - 105) * 0.31}`,
          )
          .join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}
function Chart({ state }: { state: TwinState }) {
  const W = 820,
    H = 300,
    left = 48,
    right = 20,
    top = 24,
    bottom = 44,
    start = Math.max(0, state.minute - 240),
    end = state.minute + 120;
  const x = (m: number) =>
      left + ((m - start) / (end - start)) * (W - left - right),
    y = (v: number) => top + ((260 - v) / 220) * (H - top - bottom);
  const readings = state.readings.filter((r) => r.minute >= start),
    forecast = state.forecast;
  const points = (arr: { minute: number; value: number }[]) =>
    arr.map((r) => `${x(r.minute)},${y(r.value)}`).join(" ");
  return (
    <div className="chart-wrap">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-labelledby="chart-title chart-desc"
      >
        <title id="chart-title">
          Glucose observations and two-hour forecast
        </title>
        <desc id="chart-desc">
          Observed glucose {state.current ?? "unavailable"} mg/dL at simulated{" "}
          {state.now} IST. {state.reason} Shading is a synthetic validation
          residual band. No future observations are shown.
        </desc>
        <defs>
          <linearGradient id="band" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a9c7c0" stopOpacity=".45" />
            <stop offset="100%" stopColor="#d8e8e2" stopOpacity=".35" />
          </linearGradient>
        </defs>
        <rect
          x={x(state.minute)}
          y={top}
          width={W - right - x(state.minute)}
          height={H - top - bottom}
          fill="#f6f8f5"
        />
        {[60, 100, 140, 180, 220, 260].map((v) => (
          <g key={v}>
            <line
              x1={left}
              x2={W - right}
              y1={y(v)}
              y2={y(v)}
              stroke={v === 180 ? "#c39651" : "#e9eeeb"}
              strokeDasharray={v === 180 ? "5 5" : undefined}
            />
            <text x={left - 12} y={y(v) + 4} textAnchor="end" className="axis">
              {v}
            </text>
          </g>
        ))}
        <text
          x={W - right - 5}
          y={y(180) - 9}
          textAnchor="end"
          className="threshold-label"
        >
          Above-range threshold · 180
        </text>
        {forecast.length > 0 && (
          <>
            <polygon
              points={[
                ...forecast.map((r) => `${x(r.minute)},${y(r.high)}`),
                ...forecast
                  .toReversed()
                  .map((r) => `${x(r.minute)},${y(r.low)}`),
              ].join(" ")}
              fill="url(#band)"
            />
            <polyline
              points={points(forecast)}
              fill="none"
              stroke="#4e8076"
              strokeWidth="2.7"
              strokeDasharray="6 5"
              strokeLinecap="round"
            />
          </>
        )}
        <polyline
          points={points(readings)}
          fill="none"
          stroke="#184e43"
          strokeWidth="3.1"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <line
          x1={x(state.minute)}
          x2={x(state.minute)}
          y1={top}
          y2={H - bottom}
          stroke="#8fa79d"
          strokeDasharray="3 5"
        />
        {state.current !== null && (
          <>
            <circle
              cx={x(state.readings.at(-1)!.minute)}
              cy={y(state.current)}
              r="7"
              fill="#1b594b"
              stroke="white"
              strokeWidth="3"
            />
            <rect
              x={x(state.minute) - 24}
              y={top - 19}
              width="48"
              height="22"
              rx="6"
              fill="#e6eee8"
            />
            <text
              x={x(state.minute)}
              y={top - 4}
              textAnchor="middle"
              className="now-label"
            >
              NOW
            </text>
          </>
        )}
        {Array.from(
          { length: 7 },
          (_, i) => start + ((end - start) * i) / 6,
        ).map((m) => (
          <text
            key={m}
            x={x(m)}
            y={H - 16}
            textAnchor="middle"
            className="axis"
          >
            {clockLabel(m)}
          </text>
        ))}
      </svg>
      <div className="chart-legend">
        <span>
          <i className="line-key" />
          Observed CGM
        </span>
        <span>
          <i className="line-key forecast-key" />
          Persistence baseline
        </span>
        <span>
          <i className="band-key" />
          Synthetic validation residual band
        </span>
        <span className="timezone">IST · mg/dL</span>
      </div>
    </div>
  );
}
function App() {
  const [selected, setSelected] = useState("GT-001"),
    [step, setStep] = useState(initialStep),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(1),
    [scenario, setScenario] = useState<Scenario>("default"),
    [tab, setTab] = useState("overview"),
    [reviewed, setReviewed] = useState<string[]>([]),
    [note, setNote] = useState(""),
    [notes, setNotes] = useState<
      { patient: string; time: string; text: string }[]
    >([]);
  const state = infer(selected, step, scenario),
    p = state.patient;
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(
      () =>
        setStep((s) => {
          if (s >= maxStep) {
            setPlaying(false);
            return s;
          }
          return s + 1;
        }),
      1800 / speed,
    );
    return () => clearInterval(timer);
  }, [playing, speed]);

  const ready = state.status === "ready";
  function reset() {
    setPlaying(false);
    setStep(initialStep);
    setScenario("default");
  }
  function selectPatient(id: string) {
    setSelected(id);
    setScenario("default");
    setPlaying(false);
    setStep(initialStep);
    setNote("");
  }
  const reviewKey = `${selected}-${step}`;
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to patient workspace
      </a>
      <aside className="rail">
        <a
          className="brand-mark"
          href="#main-content"
          aria-label="GlucoTwin home"
        >
          <HeartPulse size={25} />
        </a>
        <div className="rail-links">
          <button
            className={tab === "overview" ? "active" : ""}
            aria-label="Patient workspace"
            onClick={() => setTab("overview")}
          >
            <LayoutDashboard size={20} />
          </button>
          <button
            className={tab === "history" ? "active" : ""}
            aria-label="Review history"
            onClick={() => setTab("history")}
          >
            <Clock3 size={20} />
          </button>
          <button
            className={tab === "evidence" ? "active" : ""}
            aria-label="Model evidence"
            onClick={() => setTab("evidence")}
          >
            <FlaskConical size={20} />
          </button>
          <button
            className={tab === "provenance" ? "active" : ""}
            aria-label="Data provenance"
            onClick={() => setTab("provenance")}
          >
            <Database size={20} />
          </button>
        </div>
        <div className="rail-bottom">
          <div className="prototype-icon" title="Research workspace">
            <ShieldCheck size={20} />
          </div>
          <span className="user-avatar">DR</span>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="brand">
            gluco<span>twin</span>
            <span className="brand-divider" />
            <span className="workspace-label">Research workspace</span>
          </div>
          <div className="topbar-right">
            <Badge className="synthetic-badge">
              <span className="status-dot" />
              Synthetic environment
            </Badge>
            <span className="date-label">09 OCT 2026</span>
          </div>
        </header>
        <div className="page-heading">
          <div>
            <div className="eyebrow">PATIENT INTELLIGENCE</div>
            <h1>A clearer view of what comes next.</h1>
            <p>Explore evolving glucose patterns, with the evidence in view.</p>
          </div>
          <div className="session-meta">
            <span className="live-dot" />
            <div>
              <strong>Deterministic replay</strong>
              <span>All profiles and sensor readings are synthetic</span>
            </div>
          </div>
        </div>
        <div className="content-layout">
          <aside className="patient-list">
            <div className="list-heading">
              <h2>
                Patient worklist <span>04</span>
              </h2>
              <Users size={17} />
            </div>
            <div className="list-subtitle">
              Synthetic Type 2 diabetes cohort
            </div>
            <div className="patient-cards">
              {patients.map((patient) => {
                const s = infer(
                  patient.id,
                  step,
                  selected === patient.id ? scenario : "default",
                );
                return (
                  <button
                    key={patient.id}
                    className={`patient-card ${selected === patient.id ? "selected" : ""}`}
                    onClick={() => selectPatient(patient.id)}
                    aria-pressed={selected === patient.id}
                  >
                    <div className="patient-row">
                      <span className={`avatar ${patient.color}`}>
                        {patient.initials}
                      </span>
                      <span className="patient-identity">
                        <strong>{patient.name}</strong>
                        <small>
                          {patient.id} · {patient.age} yrs
                        </small>
                      </span>
                      {selected === patient.id && <ChevronRight size={16} />}
                    </div>
                    <div className="patient-value">
                      <strong>
                        {s.current?.toFixed(1) ?? "—"}
                        <small>mg/dL</small>
                      </strong>
                      <Sparkline state={s} />
                    </div>
                    <div
                      className={`patient-status ${s.status === "ready" ? "" : "muted-status"}`}
                    >
                      <span className="status-dot" />
                      {s.status === "disconnected"
                        ? "Feed disconnected"
                        : s.status === "invalid"
                          ? "Invalid input"
                          : s.status === "stale"
                            ? "Sensor feed stale"
                            : s.status === "cold-start"
                              ? "Collecting baseline"
                              : s.status === "current-event"
                                ? "Current reading above range"
                                : s.estimate !== null &&
                                    s.estimate >= s.threshold
                                  ? "Model warning"
                                  : "Forecast available"}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="worklist-note">
              <FlaskConical size={18} />
              <p>
                Built for exploration.
                <br />
                Every patient in this workspace is fictional.
              </p>
            </div>
          </aside>
          <main id="main-content" className="patient-workspace">
            <div className="patient-header">
              <div className={`avatar large ${p.color}`}>{p.initials}</div>
              <div>
                <div className="patient-title">
                  <h2>{p.name}</h2>
                  <Badge variant="outline">Synthetic patient</Badge>
                </div>
                <p>
                  {p.id}
                  <span>•</span>
                  {p.age}-year-old {p.sex.toLowerCase()}
                  <span>•</span>Type 2 diabetes · {p.durationYears} years
                </p>
              </div>
            </div>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="workspace-tabs">
                <TabsTrigger value="overview">Twin overview</TabsTrigger>
                <TabsTrigger value="history">Review history</TabsTrigger>
                <TabsTrigger value="evidence">Model evidence</TabsTrigger>
                <TabsTrigger value="provenance">Provenance</TabsTrigger>
              </TabsList>
              <TabsContent value="overview">
                <div className="overview-grid">
                  <section className="main-column">
                    <div className="metric-grid">
                      <Card className="metric-card">
                        <div className="metric-label">
                          Latest glucose <Activity size={16} />
                        </div>
                        <div className="metric-number">
                          {state.current?.toFixed(1) ?? "—"}
                          <span>mg/dL</span>
                        </div>
                        <div
                          className={
                            state.slope > 0
                              ? "metric-detail rising"
                              : "metric-detail"
                          }
                        >
                          {state.slope > 0 ? (
                            <ArrowUpRight size={15} />
                          ) : (
                            <ArrowDownRight size={15} />
                          )}{" "}
                          {state.slope > 0 ? "+" : ""}
                          {state.slope.toFixed(2)} mg/dL/min{" "}
                          <span>· recent trend</span>
                        </div>
                      </Card>
                      <Card className="metric-card">
                        <div className="metric-label">
                          Sensor freshness <Clock3 size={16} />
                        </div>
                        <div className="metric-number">
                          {state.freshnessMinutes ?? "—"}
                          <span>min ago</span>
                        </div>
                        <div
                          className={`metric-detail ${state.status === "stale" ? "amber" : ""}`}
                        >
                          <span className="status-dot" />
                          {state.freshnessMinutes === 0
                            ? "Current at replay time"
                            : state.status === "disconnected"
                              ? "Feed disconnected"
                              : "Check feed quality"}
                        </div>
                      </Card>
                      <Card className="metric-card">
                        <div className="metric-label">
                          Baseline HbA1c <FileCheck2 size={16} />
                        </div>
                        <div className="metric-number">
                          {p.baselineA1c}
                          <span>%</span>
                        </div>
                        <div className="metric-detail">
                          Synthetic profile <span>· 08 Oct 2026</span>
                        </div>
                      </Card>
                    </div>
                    <Card className="chart-card">
                      <div className="card-heading">
                        <div>
                          <h3>Glucose trajectory</h3>
                          <p>Observed context meets a 2-hour forecast</p>
                        </div>
                        <Badge variant="outline">15-minute readings</Badge>
                      </div>
                      <Chart state={state} />
                      {!ready && (
                        <div className="chart-unavailable" role="status">
                          <WifiOff size={18} />
                          <span>{state.reason}</span>
                        </div>
                      )}
                      <div className="chart-footnote">
                        <Info size={14} />
                        <span>
                          Band: validation 90th-percentile absolute residual.
                          Synthetic only; no clinical coverage guarantee.
                        </span>
                      </div>
                    </Card>
                    <Card className="context-card">
                      <div className="card-heading">
                        <div>
                          <h3>What the twin knows</h3>
                          <p>
                            Only information available at {state.now} IST enters
                            this snapshot.
                          </p>
                        </div>
                        <ShieldCheck size={19} />
                      </div>
                      <div className="context-grid">
                        <div>
                          <span className="context-icon">
                            <Activity size={17} />
                          </span>
                          <div>
                            <strong>Dynamic observations</strong>
                            <p>
                              {state.readings.length} available readings ·{" "}
                              {state.completeness}% recent completeness
                            </p>
                            <small>
                              Glucose level, recent slope and variability
                            </small>
                          </div>
                        </div>
                        <div>
                          <span className="context-icon">
                            <FileCheck2 size={17} />
                          </span>
                          <div>
                            <strong>Pre-existing profile</strong>
                            <p>Age, diabetes duration and baseline HbA1c</p>
                            <small>
                              Baseline timestamp: 08 Oct 2026, 00:00 UTC
                            </small>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </section>
                  <aside className="insight-column">
                    <Card
                      className={`forecast-card ${!ready ? "unavailable-card" : ""}`}
                    >
                      <div className="forecast-eyebrow">
                        <span className="status-dot" />
                        NEXT 120 MINUTES
                      </div>
                      <div className="forecast-icon">
                        {ready ? <Activity size={24} /> : <WifiOff size={24} />}
                      </div>
                      <h3>
                        {!ready
                          ? "Forecast withheld"
                          : state.estimate !== null &&
                              state.estimate >= state.threshold
                            ? "New-episode model warning"
                            : "Below demo alert threshold"}
                      </h3>
                      {ready && (
                        <div className="estimate-number">
                          {Math.round((state.estimate ?? 0) * 100)}
                          <span>%</span>
                          <small>Synthetic model estimate</small>
                        </div>
                      )}
                      <p>
                        {!ready
                          ? state.reason
                          : "Static + dynamic logistic model. The frozen demo alert threshold is 15%. This estimate is not validated for real patients."}
                      </p>
                      <div className="forecast-separator" />
                      <dl>
                        <div>
                          <dt>Forecast origin</dt>
                          <dd>{state.now} IST</dd>
                        </div>
                        <div>
                          <dt>Window ends</dt>
                          <dd>{clockLabel(state.minute + 120)} IST</dd>
                        </div>
                        <div>
                          <dt>Event model</dt>
                          <dd>Fused logistic v1</dd>
                        </div>
                      </dl>
                      <div className="research-caution">
                        <Info size={15} />
                        <span>
                          Research signal only. No diagnosis or treatment
                          recommendation.
                        </span>
                      </div>
                      <Button
                        className="review-button"
                        variant="outline"
                        disabled={reviewed.includes(reviewKey)}
                        onClick={() => setReviewed((r) => [...r, reviewKey])}
                      >
                        {reviewed.includes(reviewKey) ? (
                          <Check size={16} />
                        ) : (
                          <FileCheck2 size={16} />
                        )}{" "}
                        {reviewed.includes(reviewKey)
                          ? "Snapshot reviewed"
                          : "Mark snapshot reviewed"}
                      </Button>
                    </Card>
                    <Card className="quality-card">
                      <div className="quality-heading">
                        <h3>Input quality</h3>
                        <Badge variant="outline">
                          {ready ? "Available" : "Attention"}
                        </Badge>
                      </div>
                      <div className="quality-bar">
                        <span style={{ width: `${state.completeness}%` }} />
                      </div>
                      <div className="quality-summary">
                        <strong>{state.completeness}%</strong>
                        <span>recent observation coverage</span>
                      </div>
                      <p>
                        Forecasts pause after 30 minutes without a reading. This
                        is a prototype policy.
                      </p>
                      <button
                        className="text-link"
                        onClick={() => setTab("provenance")}
                      >
                        Inspect provenance <ArrowRight size={14} />
                      </button>
                    </Card>
                  </aside>
                </div>
              </TabsContent>
              <TabsContent value="history">
                <Card className="detail-panel">
                  <div className="card-heading">
                    <div>
                      <h3>Review history</h3>
                      <p>
                        Session-only notes for this synthetic patient. Reset
                        when the page reloads.
                      </p>
                    </div>
                    <Clock3 size={20} />
                  </div>
                  <label htmlFor="review-note">
                    Add a research observation
                  </label>
                  <textarea
                    id="review-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={600}
                    placeholder="Describe a pattern, data-quality issue or model limitation…"
                  />
                  <Button
                    disabled={!note.trim()}
                    onClick={() => {
                      setNotes((n) => [
                        ...n,
                        {
                          patient: selected,
                          time: state.now,
                          text: note.trim(),
                        },
                      ]);
                      setNote("");
                    }}
                  >
                    Save demo note
                  </Button>
                  <div className="note-list">
                    {notes.filter((n) => n.patient === selected).length ===
                    0 ? (
                      <div className="empty-state">
                        <FileCheck2 size={28} />
                        <h4>No review notes yet</h4>
                        <p>
                          Your observations will appear here, with their
                          simulated timestamp.
                        </p>
                      </div>
                    ) : (
                      notes
                        .filter((n) => n.patient === selected)
                        .map((n, i) => (
                          <article className="note-item" key={i}>
                            <span>{n.time} IST · Synthetic replay</span>
                            <p>{n.text}</p>
                          </article>
                        ))
                    )}
                  </div>
                </Card>
              </TabsContent>
              <TabsContent value="evidence">
                <Card className="detail-panel">
                  <div className="card-heading">
                    <div>
                      <div className="eyebrow">EVIDENCE BEFORE CONFIDENCE</div>
                      <h3>Know what this prototype can establish.</h3>
                      <p>
                        Engineering demonstrations and clinical validation are
                        different stages.
                      </p>
                    </div>
                    <FlaskConical size={26} />
                  </div>
                  <div className="evidence-cards">
                    <div>
                      <Badge variant="outline">Implemented</Badge>
                      <h4>Persistence trajectory baseline</h4>
                      <p>
                        Uses the last observed glucose as the 2-hour trajectory.
                        Measured synthetic 120-minute MAE: 19.55 mg/dL, compared
                        with 33.85 for linear trend. Residual bands are
                        descriptive, not clinical confidence intervals.
                      </p>
                    </div>
                    <div>
                      <Badge variant="outline">
                        {model ? "Artifact loaded" : "Pending evaluation"}
                      </Badge>
                      <h4>Static + dynamic model</h4>
                      <p>
                        {model
                          ? `Trained on ${evidence.splitCounts.train} synthetic people; validated on ${evidence.splitCounts.validation} and tested on ${evidence.splitCounts.test} held-out people. Fused PR-AUC ${evidence.metrics.fused.test.prAuc.toFixed(3)} versus dynamic-only ${evidence.metrics.dynamic.test.prAuc.toFixed(3)} and static-only ${evidence.metrics.static.test.prAuc.toFixed(3)}. Test event prevalence: ${(evidence.prevalence.test * 100).toFixed(2)}%.`
                          : "A fused synthetic model and patient-held-out evaluation are being prepared. No accuracy or event probability is claimed before that evidence exists."}
                      </p>
                    </div>
                    <div>
                      <Badge variant="outline">Not established</Badge>
                      <h4>Clinical generalization</h4>
                      <p>
                        No prospective trial, India-specific validation or
                        clinical efficacy claim. Real-data benchmarking is
                        conditional on licensing and leakage review.
                      </p>
                    </div>
                  </div>
                  <div className="inline-notice">
                    <Info size={20} />
                    <span>
                      <strong>
                        Important limitation:{" "}
                        {evidence.metrics.fused.events.falseAlertsPerPatientDay.toFixed(
                          2,
                        )}{" "}
                        false alerts per patient-day.
                      </strong>{" "}
                      On synthetic test data,{" "}
                      {evidence.metrics.fused.events.episodesWarned} of{" "}
                      {evidence.metrics.fused.events.forecastableEpisodes}{" "}
                      forecastable episodes were warned, with a median{" "}
                      {evidence.metrics.fused.events.leadTimeMinutes.median}
                      -minute lead. Window precision is only{" "}
                      {(evidence.metrics.fused.test.precision * 100).toFixed(1)}
                      %. These results are not clinical validation.
                    </span>
                  </div>
                  <section className="real-evidence">
                    <Badge variant="outline">
                      Separate retrospective benchmark · Not deployed in demo
                    </Badge>
                    <h4>ShanghaiT2DM: real-data feasibility</h4>
                    <p>
                      {realEvidence.people} adults, {realEvidence.sessions}{" "}
                      sessions; patient-separated 60/20/20 split. Fused PR-AUC{" "}
                      {realEvidence.metrics.fused.test.prAuc.toFixed(4)} versus
                      dynamic-only{" "}
                      {realEvidence.metrics.dynamic.test.prAuc.toFixed(4)}.{" "}
                      {realEvidence.fusionConclusion}
                    </p>
                    <p>
                      <strong>
                        {realEvidence.metrics.fused.events.falseAlertsPerPatientDay.toFixed(
                          2,
                        )}{" "}
                        false alerts per recorded-span patient-day.
                      </strong>{" "}
                      The Chinese retrospective cohort does not establish
                      clinical safety or generalization to India. Only age,
                      recorded gender and past CGM enter this benchmark; undated
                      labs are excluded. No real patient rows enter this app.
                    </p>
                  </section>
                  <h4>Frozen event definition</h4>
                  <p>
                    A new episode is at least two consecutive 15-minute readings
                    above 180 mg/dL within the next 120 minutes. Any current
                    value above 180 is conservatively excluded from advance
                    prediction. Missing future observations are not negative
                    labels.
                  </p>
                  <h4>Reproducibility</h4>
                  <p>
                    Patient-level splits, feature timing, baseline comparisons
                    and exact training parameters must accompany results.
                    Baseline HbA1c is known before the synthetic trace begins.
                  </p>
                  {evidence ? (
                    <details>
                      <summary>
                        Inspect measured synthetic evaluation artifact
                      </summary>
                      <pre>{JSON.stringify(evidence, null, 2)}</pre>
                    </details>
                  ) : (
                    <div className="inline-notice">
                      <Info size={17} />
                      No measured evaluation artifact loaded. We do not
                      substitute invented performance numbers.
                    </div>
                  )}
                </Card>
              </TabsContent>
              <TabsContent value="provenance">
                <Card className="detail-panel">
                  <div className="card-heading">
                    <div>
                      <div className="eyebrow">AN INSPECTABLE SNAPSHOT</div>
                      <h3>From input to forecast</h3>
                      <p>
                        {p.id} · 09 Oct 2026, {state.now} IST
                      </p>
                    </div>
                    <Database size={24} />
                  </div>
                  <ol className="provenance-flow">
                    <li>
                      <span>01</span>
                      <div>
                        <h4>Synthetic profile</h4>
                        <p>
                          Fictional name and demographics. HbA1c fixture
                          timestamp: 08 Oct 2026, 00:00 UTC (05:30 IST), before
                          the normalized replay.
                        </p>
                      </div>
                    </li>
                    <li>
                      <span>02</span>
                      <div>
                        <h4>Deterministic sensor stream</h4>
                        <p>
                          15-minute synthetic glucose from held-out generator
                          samples. Replay clock normalized to 09 Oct 2026, 08:00
                          IST. Future samples stay hidden until replay reaches
                          them.
                        </p>
                      </div>
                    </li>
                    <li>
                      <span>03</span>
                      <div>
                        <h4>Quality gate</h4>
                        <p>
                          Reject invalid units and disconnected feeds; withhold
                          when stale ≥30 minutes, fewer than 9 observations, or
                          any current reading exceeds 180 mg/dL.
                        </p>
                      </div>
                    </li>
                    <li>
                      <span>04</span>
                      <div>
                        <h4>Versioned inference</h4>
                        <p>
                          Fused logistic event model v1 uses seven features. The
                          chart shows a separate persistence baseline with
                          measured synthetic validation residual bands. No
                          future meal, medication or outcome enters inference.
                        </p>
                      </div>
                    </li>
                  </ol>
                  <div className="inline-notice">
                    <ShieldCheck size={18} />
                    No real patient records, uploaded health data, external
                    clinical systems or automated treatment actions.
                  </div>
                  <div className="source-links">
                    <a
                      href="https://pubmed.ncbi.nlm.nih.gov/31177185/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      CGM time-in-range consensus ↗
                    </a>
                    <a
                      href="https://www.nature.com/articles/s41597-023-01940-7"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Candidate dataset source ↗
                    </a>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </div>
        <footer className="replay-bar">
          <div className="replay-label">
            <span className="replay-icon">
              <Play size={17} />
            </span>
            <div>
              <strong>Replay laboratory</strong>
              <span>Simulated time · 09 Oct 2026</span>
            </div>
          </div>
          <div className="playback-controls">
            <Button
              variant="outline"
              size="icon"
              onClick={reset}
              aria-label="Reset replay"
            >
              <RotateCcw size={16} />
            </Button>
            <Button
              className="play-button"
              onClick={() => setPlaying((v) => !v)}
              disabled={step >= maxStep}
            >
              {playing ? <Pause size={16} /> : <Play size={16} />}{" "}
              {playing ? "Pause" : "Play"}
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={step >= maxStep}
              onClick={() => {
                setPlaying(false);
                setStep((s) => Math.min(maxStep, s + 1));
              }}
              aria-label="Advance 15 minutes"
            >
              <SkipForward size={16} />
            </Button>
            <select
              aria-label="Replay speed"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            >
              <option value={1}>1× speed</option>
              <option value={2}>2× speed</option>
              <option value={4}>4× speed</option>
            </select>
          </div>
          <div className="timeline-control">
            <span>
              {state.now}
              <small>IST</small>
            </span>
            <input
              aria-label="Replay time"
              type="range"
              min={0}
              max={maxStep}
              value={step}
              onChange={(e) => {
                setPlaying(false);
                setStep(Number(e.target.value));
              }}
            />
            <small>16:00</small>
          </div>
          <select
            className="scenario-select"
            aria-label="Test scenario"
            value={scenario}
            onChange={(e) => {
              setScenario(e.target.value as Scenario);
              setPlaying(false);
            }}
          >
            <option value="default">Patient scenario</option>
            <option value="dropout">Sensor dropout</option>
            <option value="cold-start">Cold start</option>
            <option value="invalid">Invalid units</option>
            <option value="disconnected">Disconnected feed</option>
          </select>
        </footer>
        <div className="safety-footer">
          <FlaskConical size={13} />
          Research prototype · Synthetic demo · Not for clinical decisions
          <span>GlucoTwin / v0.1</span>
        </div>
      </div>
    </div>
  );
}
export default App;
