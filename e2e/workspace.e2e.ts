import { test, expect } from "@playwright/test";
test("replay, quality gates and session notes", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Ananya Rao", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".estimate-number")).toContainText("40");
  for (const scenario of ["dropout", "cold-start", "invalid", "disconnected"]) {
    await page.getByLabel("Test scenario").selectOption(scenario);
    await expect(
      page.getByRole("heading", { name: "Forecast withheld", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".estimate-number")).toHaveCount(0);
  }
  await page.getByRole("button", { name: "Reset replay", exact: true }).click();
  await page
    .getByRole("button", { name: "Advance 15 minutes", exact: true })
    .click();
  await expect(page.getByLabel("Replay time")).toHaveValue("17");
  await page.getByRole("tab", { name: "Review history", exact: true }).click();
  await page
    .getByLabel("Add a research observation")
    .fill("Synthetic review test.");
  await page.getByRole("button", { name: "Save demo note" }).click();
  await expect(
    page.getByText("Synthetic review test.", { exact: true }),
  ).toBeVisible();
});
test("responsive layout stays within viewport", async ({ page }) => {
  for (const width of [320, 375, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Input quality", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("IST · mg/dL", { exact: true })).toBeVisible();
    for (const button of await page
      .locator(".playback-controls button")
      .all()) {
      const bounds = await button.boundingBox();
      expect(bounds!.height).toBeGreaterThanOrEqual(44);
      expect(bounds!.width).toBeGreaterThanOrEqual(44);
    }
    if (width <= 650) {
      expect(
        await page
          .locator(".forecast-card > p")
          .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
      ).toBeGreaterThanOrEqual(14);
      const chart = await page
        .locator(".chart-wrap svg")
        .evaluate((el) => ({
          actual: el.getBoundingClientRect().width,
          viewBox: parseFloat(el.getAttribute("viewBox")!.split(" ")[2]),
        }));
      expect(Math.abs(chart.actual - chart.viewBox)).toBeLessThan(1);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
});
