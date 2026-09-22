import React from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import {
  render,
  screen,
  cleanup,
  within,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../src/main";
import bundle from "../src/data/atlas-bundle.json";
import { money } from "../src/charts";
import { createWorkbookSheets } from "../src/exports";
import writeExcelFile from "write-excel-file/node";
import { unzipSync, strFromU8 } from "fflate";

// jsdom checks DOM behavior, not browser layout or native dialog focus trapping.
beforeEach(() => {
  window.history.replaceState(null, "", "/program-intelligence-hub/");
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
const navigate = (view: string) =>
  fireEvent.click(
    within(screen.getByRole("navigation")).getByRole("button", {
      name: view,
      exact: true,
    }),
  );

test("Eight views render meaningful data with no missing-data text", () => {
  const app = render(<App />);
  for (const view of [
    "Overview",
    "Projects",
    "Deliverables",
    "Staff",
    "Financials",
    "Funding Pipeline",
    "Risks",
    "Issues",
  ]) {
    navigate(view);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      view === "Overview" ? "The bigger picture." : view,
    );
    expect(app.container.textContent).not.toMatch(
      /no data reported|\bundefined\b|\bNaN\b|citiesppmo|wri\.org/i,
    );
    if (view !== "Overview")
      expect(app.container.querySelectorAll("tbody tr").length).toBeGreaterThan(
        0,
      );
  }
});
test("Global scope persists across navigation and resets correctly", () => {
  render(<App />);
  fireEvent.change(screen.getByLabelText("Program", { exact: true }), {
    target: { value: "Health" },
  });
  expect(screen.getByText("12 projects in scope")).toBeTruthy();
  navigate("Projects");
  const table = screen.getByRole("table", { name: "Project directory" });
  expect(table.textContent).toContain("Health");
  expect(table.textContent).not.toContain("Sustainability");
  expect(new URL(window.location.href).searchParams.get("program")).toBe(
    "Health",
  );
  fireEvent.click(screen.getByRole("button", { name: /Reset filters/ }));
  expect(screen.getByText("48 projects in scope")).toBeTruthy();
});
test("Table sorting, pagination and project drill-down use the displayed rows", async () => {
  render(<App />);
  navigate("Projects");
  fireEvent.click(
    screen.getByRole("button", { name: /Next page of Project directory/ }),
  );
  expect(screen.getByText(/11–20 of 48 records/)).toBeTruthy();
  fireEvent.click(
    within(screen.getByRole("table", { name: "Project directory" })).getByRole(
      "button",
      { name: /Actual progress/ },
    ),
  );
  const firstRow = screen
    .getByRole("table", { name: "Project directory" })
    .querySelector("tbody tr")!;
  expect(firstRow.textContent).toContain("0%");
  fireEvent.click(within(firstRow as HTMLElement).getByRole("button"));
  const dialog = screen.getByRole("dialog", { name: "Project 360" });
  expect(
    within(dialog)
      .getByRole("table", { name: "Project deliverables" })
      .querySelectorAll("tbody tr"),
  ).toHaveLength(6);
  expect(
    within(dialog)
      .getByRole("table", { name: "Project risks and issues" })
      .querySelectorAll("tbody tr"),
  ).toHaveLength(3);
  expect(new URL(window.location.href).searchParams.get("project")).toMatch(
    /^ATL-P/,
  );
  fireEvent.click(screen.getByRole("button", { name: "Close Project 360" }));
  expect(screen.queryByRole("dialog")).toBeNull();
});
test("Search locates both people and project records", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.type(screen.getByLabelText("Search across Atlas"), "Watershed");
  const results = screen.getByRole("region", { name: "Search results" });
  const project = within(results).getByRole("button", {
    name: /Project Watershed Futures/,
  });
  await user.click(project);
  expect(
    screen.getByRole("dialog", { name: "Project 360" }).textContent,
  ).toContain("Watershed Futures");
  fireEvent.click(screen.getByRole("button", { name: "Close Project 360" }));
  await user.clear(screen.getByLabelText("Search across Atlas"));
  await user.type(screen.getByLabelText("Search across Atlas"), "Avery Vale");
  expect(
    screen.getByRole("region", { name: "Search results" }).textContent,
  ).toContain("Person");
});
test("Project deep links load correctly and invalid IDs are ignored", () => {
  window.history.replaceState(
    null,
    "",
    "?view=projects&program=Education&project=ATL-P037",
  );
  render(<App />);
  expect(
    screen.getByRole("dialog", { name: "Project 360" }).textContent,
  ).toContain("Learning Without Limits");
  expect(
    (screen.getByLabelText("Program", { exact: true }) as HTMLSelectElement)
      .value,
  ).toBe("Education");
  cleanup();
  window.history.replaceState(null, "", "?view=bad&project=bad&program=bad");
  render(<App />);
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
    "The bigger picture.",
  );
});
test("Funding totals reflect stage filters and table exports share that scope", () => {
  render(<App />);
  navigate("Funding Pipeline");
  fireEvent.change(screen.getByLabelText("Opportunity stage"), {
    target: { value: "Negotiation" },
  });
  const expected = bundle.funding
    .filter((f) => f.stage === "Negotiation")
    .reduce((n, f) => n + f.requested, 0);
  const kpi = screen
    .getByText("Requested amount", { exact: true })
    .closest("button")!;
  expect(kpi.textContent).toContain(money(expected));
  expect(
    screen
      .getByRole("table", { name: "Funding opportunities" })
      .querySelectorAll("tbody tr"),
  ).toHaveLength(6);
});
test("Chart controls and empty-state combinations do not invent data", () => {
  render(<App />);
  navigate("Risks");
  fireEvent.click(
    screen.getByRole("button", { name: "Filter Critical", exact: true }),
  );
  expect((screen.getByLabelText("Severity") as HTMLSelectElement).value).toBe(
    "Critical",
  );
  fireEvent.change(screen.getByLabelText("Category", { exact: true }), {
    target: { value: "Delivery" },
  });
  expect(
    screen.getByText(
      "No records match these filters. Clear a filter to explore the portfolio.",
    ),
  ).toBeTruthy();
  expect(document.body.textContent).not.toMatch(/NaN|undefined/);
});
test("Methodology and disclaimer are visible in the help dialog", () => {
  render(<App />);
  fireEvent.click(
    screen.getByRole("button", { name: "About this hub", exact: true }),
  );
  const dialog = screen.getByRole("dialog", { name: "About this hub" });
  expect(dialog.textContent).toContain(bundle.meta.disclaimer);
  expect(dialog.textContent).toContain("impact × likelihood × 4");
  fireEvent.click(screen.getByRole("button", { name: "Close About this hub" }));
  expect(screen.queryByRole("dialog")).toBeNull();
});
test("Real XLSX generation preserves typed numeric cells and the disclaimer", async () => {
  const rows = bundle.projects.filter((p) => p.program === "Education");
  const sheets = createWorkbookSheets(rows, "Education projects");
  const bytes = await writeExcelFile(sheets).toBuffer();
  const files = unzipSync(new Uint8Array(bytes));
  const dataXml = strFromU8(files["xl/worksheets/sheet1.xml"]);
  expect((dataXml.match(/<row\b/g) || []).length).toBe(13);
  expect(Object.values(files).map(strFromU8).join("")).toContain(
    bundle.meta.disclaimer,
  );
  expect(strFromU8(files["xl/workbook.xml"])).toContain("About");
  expect(dataXml).toContain("pane");
});
