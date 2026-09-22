export const sum = (rows, key) =>
  rows.reduce((n, row) => n + Number(row[key]), 0);
export const mean = (values) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
export const round = (value) => Math.round(value * 10) / 10;
export const progressExpected = (start, end, asOf) =>
  Math.round(
    Math.max(
      0,
      Math.min(
        1,
        (Date.parse(asOf) - Date.parse(start)) /
          (Date.parse(end) - Date.parse(start)),
      ),
    ) * 100,
  );
export const severity = (score) =>
  score <= 20
    ? "Minor"
    : score <= 40
      ? "Moderate"
      : score <= 70
        ? "Major"
        : "Critical";
export const riskScore = (risk) =>
  risk.status === "Closed" ? 0 : risk.impact * risk.likelihood * 4;
export const projectExposure = (projectId, risks) =>
  round(
    mean(
      risks
        .filter((r) => r.projectId === projectId && r.status !== "Closed")
        .map(riskScore),
    ),
  );
export const projectProgress = (projectId, deliverables) =>
  round(
    mean(
      deliverables
        .filter((d) => d.projectId === projectId)
        .map((d) => d.completion),
    ),
  );
export const scheduleStatus = (actual, expected) =>
  actual + 10 < expected
    ? "Behind schedule"
    : actual > expected + 10
      ? "Ahead of plan"
      : "On track";
export const portfolioMetrics = (projects, bundle) => {
  const ids = new Set(projects.map((p) => p.id));
  const related = (name) => bundle[name].filter((r) => ids.has(r.projectId));
  const financials = related("financials");
  const deliverables = related("deliverables");
  const risks = related("risks");
  const staff = related("staff");
  const funding = related("funding");
  return {
    projects: projects.length,
    active: projects.filter((p) => p.status === "Active").length,
    actual: round(mean(projects.map((p) => p.progress))),
    expected: round(mean(projects.map((p) => p.expected))),
    exposure: round(mean(projects.map((p) => p.exposure))),
    budget: sum(financials, "budget"),
    spent: sum(financials, "spent"),
    forecast: sum(financials, "forecast"),
    burn: sum(financials, "budget")
      ? round((sum(financials, "spent") / sum(financials, "budget")) * 100)
      : 0,
    deliverables: deliverables.length,
    completed: deliverables.filter((d) => d.status === "Complete").length,
    overdue: deliverables.filter(
      (d) => d.status !== "Complete" && d.dueDate < bundle.meta.asOf,
    ).length,
    staff: staff.length,
    fte: round(sum(staff, "fte")),
    riskCount: risks.filter((r) => r.kind === "Risk" && r.status !== "Closed")
      .length,
    issueCount: risks.filter((r) => r.kind === "Issue" && r.status !== "Closed")
      .length,
    requested: sum(funding, "requested"),
    weighted: funding.reduce((a, f) => a + f.requested * f.probability, 0),
    locations: new Set(projects.map((p) => p.locationId)).size,
  };
};
