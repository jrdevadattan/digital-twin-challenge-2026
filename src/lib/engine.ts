import model from "../../public/model.json";
import demo from "../../public/model-demo.json";
const displayPatients = [
  {
    id: "GT-001",
    name: "Ananya Rao",
    initials: "AR",
    age: 54,
    sex: "Female",
    durationYears: 8,
    baselineA1c: 7.8,
    scenario: "default",
    color: "peach",
  },
  {
    id: "GT-002",
    name: "Vikram Shah",
    initials: "VS",
    age: 62,
    sex: "Male",
    durationYears: 12,
    baselineA1c: 7.1,
    scenario: "default",
    color: "lavender",
  },
  {
    id: "GT-003",
    name: "Meera Iyer",
    initials: "MI",
    age: 47,
    sex: "Female",
    durationYears: 5,
    baselineA1c: 8.2,
    scenario: "default",
    color: "blue",
  },
  {
    id: "GT-004",
    name: "Arjun Nair",
    initials: "AN",
    age: 58,
    sex: "Male",
    durationYears: 9,
    baselineA1c: 7.5,
    scenario: "default",
    color: "sage",
  },
] as const;
export const patients = displayPatients.map((p, i) => ({
  ...p,
  age: demo.patients[i].age,
  durationYears: demo.patients[i].durationYears,
  baselineA1c: demo.patients[i].baselineA1c,
}));
export type Patient = (typeof patients)[number];
export type Scenario =
  "default" | "dropout" | "cold-start" | "invalid" | "disconnected";
export type Reading = { minute: number; value: number };
export type Forecast = Reading & { low: number; high: number };
export const initialStep = 16,
  maxStep = 32;
export const modelVersion = "glucotwin-synthetic-logistic-v1";
export function syntheticValue(patient: Patient, index: number) {
  return (
    demo.patients.find((p) => p.id === patient.id)!.readings[index]?.value ??
    NaN
  );
}
export function predictEstimate(input: number[]) {
  const m = model.models.fused;
  const z = input.reduce(
    (sum, x, i) => sum + ((x - m.mean[i]) / m.scale[i]) * m.coefficients[i],
    m.intercept,
  );
  return 1 / (1 + Math.exp(-z));
}
export function clockLabel(minute: number) {
  const total = 8 * 60 + minute;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
export function features(
  patient: Pick<Patient, "age" | "durationYears" | "baselineA1c">,
  readings: Reading[],
) {
  const recent = readings.slice(-5),
    current = recent.at(-1)!.value,
    mean = recent.reduce((a, b) => a + b.value, 0) / recent.length;
  const tm = recent.reduce((s, r) => s + r.minute, 0) / recent.length;
  const slope =
    recent.reduce((s, r) => s + (r.minute - tm) * (r.value - mean), 0) /
    (recent.reduce((s, r) => s + (r.minute - tm) ** 2, 0) || 1);
  return [
    current,
    slope,
    mean,
    Math.sqrt(
      recent.reduce((a, b) => a + (b.value - mean) ** 2, 0) / recent.length,
    ),
    patient.age,
    patient.durationYears,
    patient.baselineA1c,
  ];
}
export function infer(
  id: string,
  step: number,
  override: Scenario = "default",
) {
  const patient = patients.find((p) => p.id === id) ?? patients[0];
  const safeStep = Math.max(0, Math.min(maxStep, Math.floor(step))),
    minute = safeStep * 15;
  const scenario = override === "default" ? patient.scenario : override;
  let readings: Reading[] = Array.from({ length: safeStep + 1 }, (_, i) => ({
    minute: i * 15,
    value: syntheticValue(patient, i),
  }));
  if (scenario === "dropout")
    readings = readings.filter((r) => r.minute <= minute - 45);
  if (scenario === "cold-start") readings = readings.slice(-3);
  if (scenario === "disconnected") readings = [];
  const last = readings.at(-1),
    current = last?.value ?? null,
    freshnessMinutes = last ? minute - last.minute : null;
  const completeness = Math.round(
    (readings.filter((r) => r.minute >= minute - 360).length /
      Math.min(25, safeStep + 1)) *
      100,
  );
  const input = readings.length >= 5 ? features(patient, readings) : null;
  const slope = input?.[1] ?? 0;
  let status:
    | "ready"
    | "stale"
    | "cold-start"
    | "invalid"
    | "disconnected"
    | "current-event" = "ready";
  let reason = "Inputs pass prototype quality checks.";
  if (scenario === "disconnected") {
    status = "disconnected";
    reason = "No sensor observations are available. Forecast withheld.";
  } else if (scenario === "invalid") {
    status = "invalid";
    reason = "Simulated unit mismatch. Input rejected; forecast withheld.";
  } else if (freshnessMinutes !== null && freshnessMinutes >= 30) {
    status = "stale";
    reason = "Last reading is at least 30 minutes old. Forecast withheld.";
  } else if (readings.length < 9) {
    status = "cold-start";
    reason =
      "At least 9 observations (2 hours) are required. Forecast withheld.";
  } else if (current !== null && current > 180) {
    status = "current-event";
    reason =
      "The current reading already exceeds 180 mg/dL. New-episode inference is conservatively withheld.";
  }
  const forecast: Forecast[] =
    status === "ready"
      ? Array.from({ length: 9 }, (_, i) => {
          const ahead = i * 15,
            value = current!;
          const envelope =
            i === 0
              ? 0
              : model.continuous.persistence.interval90AbsoluteResidualMgDl[
                  i - 1
                ];
          return {
            minute: minute + ahead,
            value,
            low: Math.max(40, value - envelope),
            high: value + envelope,
          };
        })
      : [];
  const estimate = status === "ready" && input ? predictEstimate(input) : null;

  const projectedEpisode = forecast
    .slice(1)
    .some((r, i, a) => i > 0 && r.value > 180 && a[i - 1].value > 180);
  return {
    estimate,
    threshold: model.models.fused.threshold,
    patient,
    minute,
    now: clockLabel(minute),
    readings,
    forecast,
    current,
    slope,
    status,
    reason,
    completeness,
    freshnessMinutes,
    input,
    projectedEpisode,
  };
}
export type TwinState = ReturnType<typeof infer>;
