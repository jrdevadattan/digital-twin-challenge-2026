import { describe, it, expect } from "vitest";
import {
  infer,
  patients,
  syntheticValue,
  features,
  predictEstimate,
} from "./engine";
import parity from "../../public/model-parity.json";
import demo from "../../public/model-demo.json";
describe("causal replay and forecast safety", () => {
  it("is deterministic", () =>
    expect(infer("GT-001", 16)).toEqual(infer("GT-001", 16)));
  it("never exposes future observations", () => {
    for (let s = 0; s <= 32; s++) {
      const r = infer("GT-001", s);
      expect(r.readings.every((v) => v.minute <= r.minute)).toBe(true);
    }
  });
  it("preserves already-observed values as time advances", () =>
    expect(infer("GT-001", 17).readings.slice(0, -1)).toEqual(
      infer("GT-001", 16).readings,
    ));
  it.each(["dropout", "cold-start", "invalid", "disconnected"] as const)(
    "withholds %s forecasts and estimates",
    (scenario) => {
      const r = infer("GT-001", 16, scenario);
      expect(r.forecast).toEqual([]);
      expect(r.estimate).toBeNull();
      expect(r.status).not.toBe("ready");
    },
  );
  it("suppresses a current high glucose value", () => {
    const r = Array.from({ length: 33 }, (_, i) => infer("GT-001", i)).find(
      (r) => r.current !== null && r.current > 180,
    )!;
    expect(r.status).toBe("current-event");
    expect(r.forecast).toHaveLength(0);
    expect(r.estimate).toBeNull();
  });
  it("uses a complete two-hour horizon", () => {
    const r = infer("GT-001", 16);
    expect(r.forecast.at(-1)!.minute - r.minute).toBe(120);
  });
  it("has ordered bands and a persistence center", () => {
    const r = infer("GT-001", 16);
    expect(
      r.forecast.every(
        (v) => v.low <= v.value && v.high >= v.value && v.value === r.current,
      ),
    ).toBe(true);
  });
  it("has finite synthetic values for all patients", () => {
    for (const p of patients)
      for (let i = 0; i < 33; i++)
        expect(Number.isFinite(syntheticValue(p, i))).toBe(true);
  });
  it("matches exported held-out default patient estimate", () =>
    expect(infer("GT-001", 16).estimate).toBeCloseTo(
      demo.patients[0].expectedEstimate,
      10,
    ));
  it.each(parity)("matches Python features and estimate", (sample) => {
    const f = features(
      sample.profile,
      sample.readings.map((r) => ({
        minute: r.timestamp / 60000,
        value: r.value,
      })),
    );
    sample.features.forEach((x, i) => expect(f[i]).toBeCloseTo(x, 7));
    expect(predictEstimate(f)).toBeCloseTo(sample.fusedEstimate, 10);
  });
});
