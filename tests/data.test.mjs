import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { generateBundle } from "../scripts/generate-data.mjs";
import {
  portfolioMetrics,
  projectExposure,
  projectProgress,
  progressExpected,
  riskScore,
  severity,
  scheduleStatus,
} from "../src/metrics.mjs";

const data = JSON.parse(
  readFileSync(
    new URL("../src/data/atlas-bundle.json", import.meta.url),
    "utf8",
  ),
);
const projectIds = new Set(data.projects.map((p) => p.id));
const datasets = [
  "projects",
  "deliverables",
  "plans",
  "risks",
  "staff",
  "financials",
  "funding",
  "locations",
];

test("All business data is reproducible and expressly synthetic", () => {
  assert.deepEqual(data, generateBundle());
  assert.equal(data.meta.synthetic, true);
  assert.deepEqual(
    data.programs.map((p) => p.name),
    ["Sustainability", "Health", "Governance", "Education"],
  );
  assert.equal(data.projects.length, 48);
  assert.equal(data.deliverables.length, 288);
});
test("Every field is populated; no missing-data markers, non-finite numbers, or original identifiers", () => {
  function walk(value, path = "") {
    assert.notEqual(value, null, path);
    assert.notEqual(value, undefined, path);
    if (typeof value === "number") assert.ok(Number.isFinite(value), path);
    if (typeof value === "string") {
      assert.ok(value.trim().length > 0, path);
      assert.ok(
        !/no data reported|\bundefined\b|\bnull\b|^n\/a$|^unknown$|^tbd$/i.test(
          value,
        ),
        path,
      );
      assert.ok(
        !/wri\.org|sharepoint|app\.asana|cities4forests|workday|\b120\d{12,}\b/i.test(
          value,
        ),
        path,
      );
      if (path.toLowerCase().includes("email"))
        assert.match(value, /^[a-z.]+@atlas-impact\.example$/);
    }
    if (value && typeof value === "object")
      Object.entries(value).forEach(([k, v]) => walk(v, `${path}.${k}`));
  }
  walk(data);
});
test("All relationships resolve; every project has full supporting records", () => {
  datasets.forEach((name) =>
    assert.equal(
      new Set(data[name].map((r) => r.id)).size,
      data[name].length,
      `duplicate ${name} id`,
    ),
  );
  for (const name of [
    "deliverables",
    "plans",
    "risks",
    "staff",
    "financials",
    "funding",
  ]) {
    for (const row of data[name])
      assert.ok(projectIds.has(row.projectId), `${name}: ${row.id}`);
  }
  for (const p of data.projects) {
    assert.ok(data.locations.some((l) => l.id === p.locationId));
    assert.equal(
      data.deliverables.filter((d) => d.projectId === p.id).length,
      6,
    );
    assert.equal(data.risks.filter((d) => d.projectId === p.id).length, 3);
    assert.equal(data.financials.filter((d) => d.projectId === p.id).length, 1);
    assert.equal(data.staff.filter((d) => d.projectId === p.id).length, 2);
    assert.ok(
      data.plans.some(
        (plan) => plan.id === p.planId && plan.projectId === p.id,
      ),
    );
  }
  for (const r of data.risks)
    assert.ok(
      data.plans.some((p) => p.id === r.planId && p.projectId === r.projectId),
    );
  assert.equal(new Set(data.staff.map((s) => s.email)).size, data.staff.length);
});
test("Progress and exposure use the same source records as the views", () => {
  for (const p of data.projects) {
    assert.equal(p.progress, projectProgress(p.id, data.deliverables));
    assert.equal(
      p.expected,
      progressExpected(p.startDate, p.endDate, data.meta.asOf),
    );
    assert.equal(p.exposure, projectExposure(p.id, data.risks));
    assert.equal(p.schedule, scheduleStatus(p.progress, p.expected));
  }
  for (const r of data.risks) {
    assert.equal(r.score, riskScore(r));
    assert.equal(r.severity, severity(r.score));
  }
});
test("Metric boundaries have explicit behavior", () => {
  assert.equal(progressExpected("2026-01-01", "2026-01-11", "2026-01-06"), 50);
  assert.equal(progressExpected("2026-01-01", "2026-01-11", "2025-12-01"), 0);
  assert.equal(progressExpected("2026-01-01", "2026-01-11", "2026-02-01"), 100);
  assert.equal(
    projectExposure("test", [
      { projectId: "test", impact: 5, likelihood: 5, status: "Closed" },
    ]),
    0,
  );
  assert.equal(
    projectExposure("test", [
      { projectId: "test", impact: 5, likelihood: 5, status: "Open" },
      { projectId: "test", impact: 5, likelihood: 5, status: "Closed" },
    ]),
    100,
  );
  assert.deepEqual([20, 20.1, 40, 40.1, 70, 70.1].map(severity), [
    "Minor",
    "Moderate",
    "Moderate",
    "Major",
    "Major",
    "Critical",
  ]);
});
test("Program subtotals reconcile with the complete portfolio", () => {
  const global = portfolioMetrics(data.projects, data);
  for (const key of [
    "projects",
    "active",
    "budget",
    "spent",
    "forecast",
    "deliverables",
    "staff",
    "riskCount",
    "issueCount",
    "requested",
    "weighted",
  ]) {
    const subtotal = data.programs.reduce(
      (n, p) =>
        n +
        portfolioMetrics(
          data.projects.filter((r) => r.program === p.name),
          data,
        )[key],
      0,
    );
    assert.equal(subtotal, global[key], key);
  }
  assert.deepEqual(portfolioMetrics([], data), {
    projects: 0,
    active: 0,
    actual: 0,
    expected: 0,
    exposure: 0,
    budget: 0,
    spent: 0,
    forecast: 0,
    burn: 0,
    deliverables: 0,
    completed: 0,
    overdue: 0,
    staff: 0,
    fte: 0,
    riskCount: 0,
    issueCount: 0,
    requested: 0,
    weighted: 0,
    locations: 0,
  });
});
test("Source and assets have no institutional links or old branding", () => {
  function scan(folder) {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const url = new URL(
        `${entry.name}${entry.isDirectory() ? "/" : ""}`,
        folder,
      );
      if (entry.isDirectory()) scan(url);
      else if (/\.(tsx?|mjs|json|svg|css|html)$/.test(entry.name)) {
        const source = readFileSync(url, "utf8");
        assert.ok(
          !/wri\.org|sharepoint\.com|app\.asana\.com|citiesppmo|ross.center|vipper|cities4forests|no data reported/i.test(
            source,
          ),
          entry.name,
        );
      }
    }
  }
  scan(new URL("../src/", import.meta.url));
  scan(new URL("../public/", import.meta.url));
});
