import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { unzipSync, strFromU8 } from "fflate";

test("All views render with no page errors or external requests", async ({
  page,
}) => {
  const errors: string[] = [];
  const external: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (
      /^https?:/.test(request.url()) &&
      !request.url().startsWith("http://127.0.0.1:4173/")
    )
      external.push(request.url());
  });
  await page.goto("./");
  await expect(
    page.getByRole("heading", { name: "The bigger picture." }),
  ).toBeVisible();
  for (const name of [
    "Projects",
    "Deliverables",
    "Staff",
    "Financials",
    "Funding Pipeline",
    "Risks",
    "Issues",
  ]) {
    await page
      .getByRole("navigation")
      .getByRole("button", { name, exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name, exact: true, level: 1 }),
    ).toBeVisible();
    await expect(page.locator("tbody tr").first()).toBeVisible();
  }
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
  await expect(page.locator("body")).not.toContainText(
    /no data reported|\bundefined\b|\bNaN\b|citiesppmo|wri\.org/i,
  );
});
test("Filters, chart drill-down, sorting and Project 360 preserve scope", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByLabel("Program", { exact: true }).selectOption("Health");
  await expect(page.getByText("12 projects in scope")).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Projects", exact: true })
    .click();
  await page
    .getByLabel("Schedule", { exact: true })
    .selectOption("Behind schedule");
  await expect(
    page.getByRole("table", { name: "Project directory" }).locator("tbody"),
  ).not.toContainText("Sustainability");
  await page
    .getByRole("button", { name: "Actual progress", exact: false })
    .first()
    .click();
  await page
    .getByRole("table", { name: "Project directory" })
    .locator("tbody .table-link")
    .first()
    .click();
  const modal = page.getByRole("dialog", { name: "Project 360" });
  await expect(modal).toBeVisible();
  await expect(
    modal.getByRole("table", { name: "Project deliverables" }),
  ).toBeVisible();
  expect(new URL(page.url()).searchParams.get("project")).toMatch(/^ATL-P/);
  await page
    .getByRole("button", { name: "Close Project 360", exact: true })
    .click();
  await expect(page.getByLabel("Program", { exact: true })).toHaveValue(
    "Health",
  );
  await expect(page.getByLabel("Schedule", { exact: true })).toHaveValue(
    "Behind schedule",
  );
  await page
    .getByRole("button", { name: "Reset filters", exact: false })
    .click();
  await expect(page.getByText("48 projects in scope")).toBeVisible();
});
test("Search, shareable project URLs, help, and empty filters are usable", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByLabel("Search across Atlas").fill("Watershed");
  await page
    .getByRole("region", { name: "Search results" })
    .getByRole("button", { name: /Project Watershed Futures/ })
    .click();
  await expect(page.getByRole("dialog", { name: "Project 360" })).toContainText(
    "Watershed Futures",
  );
  await page.reload();
  await expect(page.getByRole("dialog", { name: "Project 360" })).toBeVisible();
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "About this hub", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "About this hub" }),
  ).toContainText("This is an independent portfolio implementation");
  await page.keyboard.press("Escape");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Risks", exact: true })
    .click();
  await page.getByLabel("Category", { exact: true }).selectOption("Delivery");
  await expect(
    page.getByText(
      "No records match these filters. Clear a filter to explore the portfolio.",
    ),
  ).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/NaN|undefined/);
});
test("Workbook and chart exports contain Atlas branding and synthetic values", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByLabel("Program", { exact: true }).selectOption("Education");
  const workbookDownload = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export current view", exact: true })
    .click();
  const workbookFile = await workbookDownload;
  expect(workbookFile.suggestedFilename()).toBe("Atlas_Overview.xlsx");
  const workbook = unzipSync(readFileSync((await workbookFile.path())!));
  expect(
    (strFromU8(workbook["xl/worksheets/sheet1.xml"]).match(/<row\b/g) || [])
      .length,
  ).toBe(13);
  expect(Object.values(workbook).map(strFromU8).join("")).toContain(
    "This is an independent portfolio implementation",
  );
  const svgDownload = page.waitForEvent("download");
  await page
    .getByRole("button", {
      name: "Download Project exposure & progress as SVG",
    })
    .click();
  const svgFile = await svgDownload;
  const svg = readFileSync((await svgFile.path())!, "utf8");
  expect(svg).toContain("Synthetic demonstration data");
  expect(svg).toContain("independent portfolio implementation");
  const pngDownload = page.waitForEvent("download");
  await page
    .getByRole("button", {
      name: "Download Project exposure & progress as PNG",
    })
    .click();
  expect((await pngDownload).suggestedFilename()).toMatch(/\.png$/);
});
test("Narrow screens and keyboard interaction work", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page
    .getByRole("button", { name: "About this hub", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("dialog", { name: "About this hub" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "About this hub", exact: true }),
  ).toBeFocused();
});
