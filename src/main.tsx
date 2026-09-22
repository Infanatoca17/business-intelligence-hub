import React, { useEffect, useMemo, useRef, useState } from "react";
import bundle from "./data/atlas-bundle.json";
import { mean, sum, portfolioMetrics } from "./metrics.mjs";
import {
  Bars,
  Globe,
  Scatter,
  type Project,
  colors,
  compact,
  money,
  exposureColor,
} from "./charts";
import { exportWorkbook } from "./exports";
import "./style.css";

const views = [
  "Overview",
  "Projects",
  "Deliverables",
  "Staff",
  "Financials",
  "Funding Pipeline",
  "Risks",
  "Issues",
] as const;
type View = (typeof views)[number];
type Row = Record<string, unknown>;
type Column = {
  key: string;
  label: string;
  render?: (value: unknown, row: Row) => React.ReactNode;
};
const pct = (n: unknown) => `${Number(n).toFixed(1).replace(".0", "")}%`;
const date = (s: unknown) =>
  new Date(`${s}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
const dollar = (n: unknown) =>
  Number(n).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
const programColor = (name: string) =>
  bundle.programs.find((p) => p.name === name)?.color || colors[0];

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    search: (
      <>
        <circle cx="10" cy="10" r="6" />
        <path d="m15 15 5 5" />
      </>
    ),
    export: (
      <>
        <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />
      </>
    ),
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 6v6l4 2" />
      </>
    ),
    link: (
      <>
        <path d="M8 16 16 8M9 6l2-2a5 5 0 0 1 7 7l-2 2M15 18l-2 2a5 5 0 0 1-7-7l2-2" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.grid}
    </svg>
  );
}
function Badge({ value }: { value: unknown }) {
  const text = String(value);
  const tone = /Behind|Overdue|Critical|Open/.test(text)
    ? "red"
    : /Ahead|Complete|Closed|Secured|On track|Active|Reviewed/.test(text)
      ? "green"
      : /Major|progress|Monitoring|Negotiation/.test(text)
        ? "amber"
        : "neutral";
  return <span className={`badge ${tone}`}>{text}</span>;
}
function Kpi({
  label,
  value,
  detail,
  accent = false,
  onClick,
}: {
  label: string;
  value: string | number;
  detail: string;
  accent?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className={`kpi ${accent ? "accent" : ""}`}
      onClick={onClick}
      disabled={!onClick}
    >
      <span className="kpi-label">
        {label}
        <Icon name="arrow" size={16} />
      </span>
      <strong>{value}</strong>
      <span className="kpi-detail">{detail}</span>
    </button>
  );
}
function Table({
  title,
  rows,
  columns,
  onOpen,
  caption,
}: {
  title: string;
  rows: Row[];
  columns: Column[];
  onOpen?: (row: Row) => void;
  caption?: string;
}) {
  const [sort, setSort] = useState({ key: "", dir: 1 });
  const [page, setPage] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => setPage(0), [rows]);
  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) => {
        if (!sort.key) return 0;
        const av = a[sort.key],
          bv = b[sort.key];
        return (
          (typeof av === "number" && typeof bv === "number"
            ? av - bv
            : String(av).localeCompare(String(bv), "en", { numeric: true })) *
          sort.dir
        );
      }),
    [rows, sort],
  );
  const pages = Math.max(1, Math.ceil(rows.length / 10));
  const safePage = Math.min(page, pages - 1);
  return (
    <section className="panel table-panel">
      <div className="panel-heading">
        <div>
          <h2>
            {title} <span className="count">{rows.length}</span>
          </h2>
          <p>
            {caption ||
              "Select a record to explore its project. Sort by any column."}
          </p>
        </div>
        <button
          className="button subtle"
          disabled={exporting}
          onClick={async () => {
            setExporting(true);
            setError("");
            try {
              await exportWorkbook(rows, title);
            } catch {
              setError("The export could not be created. Please try again.");
            } finally {
              setExporting(false);
            }
          }}
        >
          <Icon name="export" />
          {exporting ? "Preparing…" : "Export XLSX"}
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      <div className="table-scroll">
        <table>
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  aria-sort={
                    sort.key === c.key
                      ? sort.dir === 1
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <button
                    onClick={() => {
                      setSort({
                        key: c.key,
                        dir: sort.key === c.key ? -sort.dir : 1,
                      });
                      setPage(0);
                    }}
                  >
                    {c.label}
                    <span aria-hidden="true">
                      {sort.key === c.key
                        ? sort.dir === 1
                          ? " ↑"
                          : " ↓"
                        : " ↕"}
                    </span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.slice(safePage * 10, safePage * 10 + 10).map((row, i) => (
              <tr key={String(row.id ?? i)}>
                {columns.map((c, ci) => (
                  <td key={c.key}>
                    {ci === 0 && onOpen ? (
                      <button
                        className="table-link"
                        onClick={() => onOpen(row)}
                      >
                        {c.render
                          ? c.render(row[c.key], row)
                          : String(row[c.key])}
                      </button>
                    ) : c.render ? (
                      c.render(row[c.key], row)
                    ) : (
                      String(row[c.key])
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && (
          <div className="empty">
            No records match these filters. Clear a filter to explore the
            portfolio.
          </div>
        )}
      </div>
      <div className="table-bottom">
        <span>
          {rows.length
            ? `${safePage * 10 + 1}–${Math.min(rows.length, safePage * 10 + 10)} of ${rows.length} records`
            : "0 records"}{" "}
          · Synthetic data
        </span>
        <div>
          <button
            aria-label={`Previous page of ${title}`}
            disabled={safePage === 0}
            onClick={() => setPage(safePage - 1)}
          >
            ←
          </button>
          <span>
            {safePage + 1} / {pages}
          </span>
          <button
            aria-label={`Next page of ${title}`}
            disabled={safePage + 1 === pages}
            onClick={() => setPage(safePage + 1)}
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
}
function Modal({
  title,
  children,
  close,
  wide = false,
}: {
  title: string;
  children: React.ReactNode;
  close: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current!;
    el.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
      el.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={wide ? "wide-modal" : ""}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
    >
      <div className="modal-head">
        <div>
          <span className="eyebrow">ATLAS IMPACT NETWORK</span>
          <h2>{title}</h2>
        </div>
        <button className="close" onClick={close} aria-label={`Close ${title}`}>
          ×
        </button>
      </div>
      <div className="modal-body">{children}</div>
    </dialog>
  );
}
function About({ close }: { close: () => void }) {
  return (
    <Modal title="About this hub" close={close}>
      <p className="lead">
        Clear connections between delivery, resources, and exposure.
      </p>
      <p>
        Atlas Impact Network is a fictional organization. This independent
        portfolio product demonstrates how organizational information can become
        an actionable, connected decision tool.
      </p>
      <h3>Explore the demo</h3>
      <ol>
        <li>Choose a program and office to scope every section.</li>
        <li>
          Select a project bubble, search result, or table row for Project 360.
        </li>
        <li>
          Compare delivery with expected progress and review the response plan.
        </li>
        <li>
          Download the filtered tables or charts. Every export is labelled as
          synthetic.
        </li>
      </ol>
      <h3>Demo methodology</h3>
      <dl className="methodology">
        <dt>Actual progress</dt>
        <dd>
          Arithmetic mean of completion across the project's six deliverables.
          Portfolio progress is the mean across the selected projects.
        </dd>
        <dt>Expected progress</dt>
        <dd>
          100 × elapsed project days ÷ total project days, bounded to 0–100,
          using the fixed snapshot date. This demo assumes linear progress.
        </dd>
        <dt>Schedule</dt>
        <dd>
          Behind schedule if actual progress is more than 10 percentage points
          below expected; ahead if more than 10 points above; otherwise on
          track.
        </dd>
        <dt>Threat exposure index</dt>
        <dd>
          Each open risk scores impact × likelihood × 4 (both inputs 1–5).
          Issues use likelihood 5 because they have occurred. Project exposure
          is the mean of non-closed risks and issues. Closed items score 0 and
          are excluded from this mean. A project with no open items scores 0.
          Portfolio exposure averages project scores.
        </dd>
        <dt>Exposure bands</dt>
        <dd>
          Minor: 0–20; Moderate: over 20–40; Major: over 40–70; Critical: over
          70–100. This is a demonstration index, not a prediction or a
          calibrated organizational method.
        </dd>
        <dt>Financials and people</dt>
        <dd>
          Burn rate = expenditure ÷ budget. FTE is the sum of staff allocations;
          weekly hours = FTE × 40. Staff records represent unique fictional
          people.
        </dd>
        <dt>Funding pipeline</dt>
        <dd>
          Requested amount sums all displayed opportunities, including secured
          opportunities. Weighted amount = requested × stage probability (25%,
          50%, 75%, or 100%). Filter the stage to narrow the scope.
        </dd>
      </dl>
      <h3>Data & provenance</h3>
      <p>
        All projects, people, donors, allocations, budgets, and scenarios are
        fictional. Geographic outlines and country names are public reference
        information; site names and project placements are fictional. Snapshot:{" "}
        {date(bundle.meta.asOf)}. No live integrations or analytics are
        configured.
      </p>
      <p className="disclaimer-box">{bundle.meta.disclaimer}</p>
      <p>
        Fictional contact: <strong>{bundle.meta.contact}</strong> (not a
        monitored address).
      </p>
      <a
        className="text-link"
        href="https://github.com/Infanatoca17"
        target="_blank"
        rel="noreferrer"
      >
        Portfolio by Ivan Morales ↗
      </a>
    </Modal>
  );
}
const badgeCol = (key: string, label: string): Column => ({
  key,
  label,
  render: (v) => <Badge value={v} />,
});
const progressCol: Column = {
  key: "progress",
  label: "Actual progress",
  render: (v) => (
    <div className="progress-cell">
      <span>{pct(v)}</span>
      <div className="track">
        <i style={{ width: `${v}%` }} />
      </div>
    </div>
  ),
};
const projectColumns: Column[] = [
  { key: "name", label: "Project" },
  { key: "program", label: "Program" },
  { key: "owner", label: "Owner" },
  progressCol,
  { key: "expected", label: "Expected", render: pct },
  badgeCol("schedule", "Schedule"),
  { key: "exposure", label: "Exposure" },
];
const deliverableColumns: Column[] = [
  { key: "name", label: "Deliverable" },
  { key: "assignee", label: "Assignee" },
  { key: "type", label: "Type" },
  { key: "dueDate", label: "Due date", render: date },
  { key: "completion", label: "Completion", render: pct },
  badgeCol("status", "Status"),
];
const riskColumns: Column[] = [
  { key: "name", label: "Risk / issue" },
  { key: "project", label: "Project" },
  { key: "category", label: "Category" },
  { key: "score", label: "Exposure" },
  badgeCol("severity", "Severity"),
  badgeCol("status", "Status"),
  { key: "owner", label: "Owner" },
  { key: "action", label: "Response action" },
  badgeCol("actionStatus", "Action status"),
  { key: "dueDate", label: "Action due", render: date },
];

function Project360({
  project: p,
  close,
}: {
  project: Project;
  close: () => void;
}) {
  const related = <T extends { projectId: string }>(rows: T[]) =>
    rows.filter((r) => r.projectId === p.id);
  const finance = related(bundle.financials)[0];
  const plan = related(bundle.plans)[0];
  const [copied, setCopied] = useState(false);
  return (
    <Modal title="Project 360" close={close} wide>
      <div className="project-hero">
        <div>
          <span
            className="program-dot"
            style={{ background: programColor(p.program) }}
          />
          <span className="eyebrow">
            {p.program} / {p.id}
          </span>
          <h2>{p.name}</h2>
          <p>{p.description}</p>
          <div className="inline-meta">
            <Badge value={p.status} />
            <span>{p.office}</span>
            <span>{p.country}</span>
          </div>
        </div>
        <button
          className="button subtle"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(window.location.href);
              setCopied(true);
            } catch {
              setCopied(false);
            }
          }}
        >
          <Icon name="link" />
          {copied ? "Link copied" : "Copy link"}
        </button>
      </div>
      <div className="kpi-grid compact-kpis">
        <Kpi
          label="Actual progress"
          value={pct(p.progress)}
          detail={`${pct(p.expected)} expected`}
        />
        <Kpi
          label="Threat exposure"
          value={p.exposure}
          detail="Index from 0 to 100"
        />
        <Kpi
          label="Project budget"
          value={money(finance.budget)}
          detail={`${money(finance.spent)} spent`}
        />
        <Kpi
          label="Delivery team"
          value={related(bundle.staff).length}
          detail={`${sum(related(bundle.staff), "fte").toFixed(1)} FTE allocated`}
        />
      </div>
      <div className="detail-grid">
        <div>
          <h3>Intended outcome</h3>
          <p>{p.outcome}</p>
          <h3>Next milestone</h3>
          <p>{p.nextMilestone}</p>
        </div>
        <dl>
          <dt>Project owner</dt>
          <dd>{p.owner}</dd>
          <dt>Demo contact</dt>
          <dd>{p.ownerEmail}</dd>
          <dt>Timeline</dt>
          <dd>
            {date(p.startDate)} — {date(p.endDate)}
          </dd>
          <dt>Demonstration site</dt>
          <dd>{p.location}</dd>
          <dt>Schedule</dt>
          <dd>
            <Badge value={p.schedule} />
          </dd>
        </dl>
      </div>
      <Table
        title="Project deliverables"
        rows={related(bundle.deliverables)}
        columns={deliverableColumns}
        caption="All deliverables belonging to this project."
      />
      <section className="response-plan">
        <span className="eyebrow">RISK MANAGEMENT PLAN · {plan.id}</span>
        <h3>{plan.name}</h3>
        <p>{plan.approach}</p>
        <p>
          Owner: {plan.owner} · Status: {plan.status} · Last review:{" "}
          {date(plan.lastReview)} · Next review: {date(plan.nextReview)}
        </p>
      </section>
      <Table
        title="Project risks and issues"
        rows={related(bundle.risks)}
        columns={riskColumns}
        caption="Exposure, response ownership, and action deadlines."
      />
      <Table
        title="Project staffing"
        rows={related(bundle.staff)}
        columns={[
          { key: "name", label: "Name" },
          { key: "role", label: "Role" },
          { key: "fte", label: "FTE" },
          { key: "weeklyHours", label: "Hours / week" },
        ]}
        caption="Fictional people allocated to this project."
      />
      <Table
        title="Project financials"
        rows={related(bundle.financials)}
        columns={[
          { key: "period", label: "Period" },
          { key: "budget", label: "Budget", render: dollar },
          { key: "spent", label: "Expenditure", render: dollar },
          { key: "forecast", label: "Forecast", render: dollar },
          { key: "nextYearBudget", label: "Next year budget", render: dollar },
        ]}
        caption="Synthetic values in USD."
      />
      <Table
        title="Project funding opportunities"
        rows={related(bundle.funding)}
        columns={[
          { key: "name", label: "Opportunity" },
          { key: "donor", label: "Fictional donor" },
          badgeCol("stage", "Stage"),
          { key: "requested", label: "Requested", render: dollar },
        ]}
        caption="Some demonstration projects have no additional funding opportunity."
      />
      <p className="disclaimer-box">{bundle.meta.disclaimer}</p>
    </Modal>
  );
}

function readRoute() {
  const q = new URLSearchParams(window.location.search);
  return {
    view:
      views.find(
        (v) => v.toLowerCase().replaceAll(" ", "-") === q.get("view"),
      ) || "Overview",
    program: bundle.programs.some((p) => p.name === q.get("program"))
      ? q.get("program")!
      : "All programs",
    office: bundle.projects.some((p) => p.office === q.get("office"))
      ? q.get("office")!
      : "All offices",
    status: ["Active", "Planned"].includes(q.get("status") || "")
      ? q.get("status")!
      : "All statuses",
    project: bundle.projects.some((p) => p.id === q.get("project"))
      ? q.get("project")!
      : "",
  };
}
export function App() {
  const initial = useMemo(readRoute, []);
  const [view, setView] = useState<View>(initial.view);
  const [program, setProgram] = useState(initial.program);
  const [office, setOffice] = useState(initial.office);
  const [status, setStatus] = useState(initial.status);
  const [projectId, setProjectId] = useState(initial.project);
  const [about, setAbout] = useState(false);
  const [search, setSearch] = useState("");
  const [queryOpen, setQueryOpen] = useState(false);
  const [detailFilter, setDetailFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [impactFilter, setImpactFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("");
  const [exportError, setExportError] = useState("");
  const [exporting, setExporting] = useState(false);
  useEffect(() => {
    const q = new URLSearchParams();
    q.set("view", view.toLowerCase().replaceAll(" ", "-"));
    if (program !== "All programs") q.set("program", program);
    if (office !== "All offices") q.set("office", office);
    if (status !== "All statuses") q.set("status", status);
    if (projectId) q.set("project", projectId);
    window.history.replaceState(null, "", `${window.location.pathname}?${q}`);
  }, [view, program, office, status, projectId]);
  useEffect(() => {
    const back = () => {
      const s = readRoute();
      setView(s.view);
      setProgram(s.program);
      setOffice(s.office);
      setStatus(s.status);
      setProjectId(s.project);
    };
    window.addEventListener("popstate", back);
    return () => window.removeEventListener("popstate", back);
  }, []);
  const navigate = (v: View) => {
    setView(v);
    setDetailFilter("All");
    setSeverityFilter("All");
    setCategoryFilter("All");
    setImpactFilter("All");
    setLocationFilter("");
  };
  const reset = () => {
    setProgram("All programs");
    setOffice("All offices");
    setStatus("All statuses");
    setDetailFilter("All");
    setSeverityFilter("All");
    setCategoryFilter("All");
    setImpactFilter("All");
    setLocationFilter("");
  };
  const projects = useMemo(
    () =>
      bundle.projects.filter(
        (p) =>
          (program === "All programs" || p.program === program) &&
          (office === "All offices" || p.office === office) &&
          (status === "All statuses" || p.status === status),
      ),
    [program, office, status],
  );
  const ids = useMemo(() => new Set(projects.map((p) => p.id)), [projects]);
  const related = <T extends { projectId: string }>(rows: T[]) =>
    rows.filter((r) => ids.has(r.projectId));
  const metrics = portfolioMetrics(projects, bundle);
  const openProject = (row: Row) => {
    setProjectId(String(row.projectId || row.id));
    setQueryOpen(false);
  };
  const selected = bundle.projects.find((p) => p.id === projectId);
  const allResults = useMemo(
    () => [
      ...bundle.projects.map((p) => ({
        id: p.id,
        projectId: p.id,
        name: p.name,
        type: "Project",
        detail: `${p.program} · ${p.owner}`,
        keywords: `${p.name} ${p.program} ${p.owner} ${p.team} ${p.country}`,
      })),
      ...bundle.deliverables.map((d) => ({
        id: d.id,
        projectId: d.projectId,
        name: d.name,
        type: "Deliverable",
        detail: d.assignee,
        keywords: `${d.name} ${d.assignee}`,
      })),
      ...bundle.staff.map((s) => ({
        id: s.id,
        projectId: s.projectId,
        name: s.name,
        type: "Person",
        detail: `${s.role} · ${s.project}`,
        keywords: `${s.name} ${s.role} ${s.email}`,
      })),
      ...bundle.risks.map((r) => ({
        id: r.id,
        projectId: r.projectId,
        name: r.name,
        type: r.kind,
        detail: r.project,
        keywords: `${r.name} ${r.category} ${r.project}`,
      })),
      ...bundle.locations.map((l) => ({
        id: l.id,
        projectId: bundle.projects.find((p) => p.locationId === l.id)!.id,
        name: l.name,
        type: "Location",
        detail: l.country,
        keywords: `${l.name} ${l.country}`,
      })),
    ],
    [],
  );
  const matches = search.trim()
    ? allResults
        .filter((r) =>
          `${r.id} ${r.keywords}`
            .toLowerCase()
            .includes(search.trim().toLowerCase()),
        )
        .slice(0, 8)
    : [];
  const byProgram = (rows: Row[], key?: string) =>
    bundle.programs.map((p) => ({
      label: p.name,
      value: key
        ? sum(
            rows.filter((r) => r.program === p.name),
            key,
          )
        : rows.filter((r) => r.program === p.name).length,
      color: p.color,
    }));
  const groups = (rows: Row[], key: string, valueKey?: string) =>
    [...new Set(rows.map((r) => String(r[key])))].map((label, i) => ({
      label,
      value: valueKey
        ? sum(
            rows.filter((r) => r[key] === label),
            valueKey,
          )
        : rows.filter((r) => r[key] === label).length,
      color: colors[i % colors.length],
    }));
  const relatedDeliverables = related(bundle.deliverables);
  const relatedRisks = related(bundle.risks);
  const projectRows = projects.filter(
    (p) =>
      (!locationFilter || p.locationId === locationFilter) &&
      (detailFilter === "All" || p.schedule === detailFilter),
  );
  const deliverableRows = relatedDeliverables.filter(
    (d) => detailFilter === "All" || d.status === detailFilter,
  );
  const staffRows = related(bundle.staff);
  const financialRows = related(bundle.financials);
  const fundingRows = related(bundle.funding).filter(
    (f) => detailFilter === "All" || f.stage === detailFilter,
  );
  const riskRows = relatedRisks.filter(
    (r) =>
      r.kind === (view === "Issues" ? "Issue" : "Risk") &&
      (detailFilter === "All" || r.status === detailFilter) &&
      (severityFilter === "All" || r.severity === severityFilter) &&
      (categoryFilter === "All" || r.category === categoryFilter) &&
      (impactFilter === "All" || r.impacted === impactFilter),
  );
  const exportRows: Row[] =
    view === "Deliverables"
      ? deliverableRows
      : view === "Staff"
        ? staffRows
        : view === "Financials"
          ? financialRows
          : view === "Funding Pipeline"
            ? fundingRows
            : view === "Risks" || view === "Issues"
              ? riskRows
              : view === "Projects"
                ? projectRows
                : projects;
  const select = (
    label: string,
    value: string,
    options: string[],
    setter: (v: string) => void,
  ) => (
    <label className="filter">
      <span>{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => setter(e.target.value)}
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
  const subtitles: Record<View, string> = {
    Overview: "A connected view of delivery, resources, and emerging risks.",
    Projects:
      "From portfolio priorities to the detail behind every initiative.",
    Deliverables:
      "See what is moving, what is complete, and what needs attention.",
    Staff: "Understand the people and capacity behind the portfolio.",
    Financials: "Connect resources with delivery across the network.",
    "Funding Pipeline": "Explore opportunities, stages, and future investment.",
    Risks: "Make uncertainty visible and response ownership clear.",
    Issues: "Track active disruptions and the actions that move them forward.",
  };
  const atRisk = projects.filter((p) => p.schedule === "Behind schedule");
  const offices = [...new Set(bundle.projects.map((p) => p.office))];
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <div className="demo-banner">
        <span className="demo-pulse" />
        Independent portfolio demo <span className="banner-separator">
          /
        </span>{" "}
        All business data is synthetic{" "}
        <button onClick={() => setAbout(true)}>About the data ↗</button>
      </div>
      <header className="header">
        <a
          className="brand"
          href={`${import.meta.env.BASE_URL}`}
          aria-label="Atlas Impact Network home"
        >
          <img
            src={`${import.meta.env.BASE_URL}atlas-mark.svg`}
            width="43"
            height="43"
            alt=""
          />
          <span>
            <strong>
              atlas<span className="brand-period">.</span>
            </strong>
            <small>IMPACT NETWORK</small>
          </span>
        </a>
        <div
          className="search-wrap"
          onKeyDown={(e) => {
            if (e.key === "Escape") setQueryOpen(false);
            if (e.key === "Enter" && matches[0]) openProject(matches[0]);
          }}
        >
          <Icon name="search" />
          <input
            aria-label="Search across Atlas"
            placeholder="Search projects, people, deliverables…"
            value={search}
            onFocus={() => setQueryOpen(true)}
            onChange={(e) => {
              setSearch(e.target.value);
              setQueryOpen(true);
            }}
          />
          {search ? (
            <button
              aria-label="Clear search"
              onClick={() => {
                setSearch("");
                setQueryOpen(false);
              }}
            >
              ×
            </button>
          ) : (
            <span className="search-hint">Explore the network</span>
          )}
          {queryOpen && search.trim() && (
            <div
              className="search-results"
              role="region"
              aria-label="Search results"
            >
              <div className="search-result-head">
                Across the entire demo portfolio
                <button
                  onClick={() => setQueryOpen(false)}
                  aria-label="Close search results"
                >
                  ×
                </button>
              </div>
              {matches.length ? (
                matches.map((r) => (
                  <button
                    className="search-result"
                    key={r.id}
                    onClick={() => openProject(r)}
                  >
                    <span className="result-type">{r.type}</span>
                    <span>
                      <strong>{r.name}</strong>
                      <small>{r.detail}</small>
                    </span>
                    <Icon name="arrow" />
                  </button>
                ))
              ) : (
                <p>No matches. Try a project, person, or country.</p>
              )}
            </div>
          )}
        </div>
        <button
          className="about-button"
          onClick={() => setAbout(true)}
          aria-label="About this hub"
        >
          ?
        </button>
        <span className="avatar" title="Independent portfolio by Ivan Morales">
          IM
        </span>
      </header>
      <nav className="nav" aria-label="Main navigation">
        {views.map((v, i) => (
          <button
            key={v}
            aria-current={view === v ? "page" : undefined}
            onClick={() => navigate(v)}
          >
            {i === 0 && <Icon name="grid" size={15} />} {v}
          </button>
        ))}
      </nav>
      <main id="main-content">
        <div className="page-heading">
          <div>
            <div className="eyebrow">
              PROGRAM INTELLIGENCE HUB <span>/</span> {bundle.meta.period}
            </div>
            <h1>{view === "Overview" ? "The bigger picture." : view}</h1>
            <p>{subtitles[view]}</p>
          </div>
          <div className="page-actions">
            <span className="snapshot">
              <Icon name="clock" size={14} /> Snapshot ·{" "}
              {date(bundle.meta.asOf)}
            </span>
            <button
              className="button primary"
              disabled={exporting}
              onClick={async () => {
                setExporting(true);
                setExportError("");
                try {
                  await exportWorkbook(exportRows, view);
                } catch {
                  setExportError(
                    "The export could not be created. Please try again.",
                  );
                } finally {
                  setExporting(false);
                }
              }}
            >
              <Icon name="export" />
              {exporting ? "Preparing export…" : "Export current view"}
            </button>
          </div>
        </div>
        {exportError && <p role="alert">{exportError}</p>}
        <div className="filters">
          {select(
            "Program",
            program,
            ["All programs", ...bundle.programs.map((p) => p.name)],
            (v) => {
              setProgram(v);
              setLocationFilter("");
            },
          )}
          {select(
            "Leading office",
            office,
            ["All offices", ...offices],
            (v) => {
              setOffice(v);
              setLocationFilter("");
            },
          )}
          {select(
            "Project status",
            status,
            ["All statuses", "Active", "Planned"],
            setStatus,
          )}
          <button className="reset" onClick={reset}>
            ↺ Reset filters
          </button>
          <span className="scope-count">
            {projects.length} projects in scope
          </span>
        </div>
        {view === "Overview" && (
          <>
            <div className="kpi-grid">
              <Kpi
                accent
                label="Active projects"
                value={metrics.active}
                detail={`${metrics.projects} total initiatives in scope`}
                onClick={() => {
                  navigate("Projects");
                  setStatus("Active");
                }}
              />
              <Kpi
                label="Portfolio delivery"
                value={pct(metrics.actual)}
                detail={`${pct(metrics.expected)} expected at this point`}
                onClick={() => navigate("Projects")}
              />
              <Kpi
                label="Portfolio budget"
                value={money(metrics.budget)}
                detail={`${money(metrics.spent)} spent · ${metrics.burn}% burn rate`}
                onClick={() => navigate("Financials")}
              />
              <Kpi
                label="Open risks & issues"
                value={metrics.riskCount + metrics.issueCount}
                detail={`${metrics.riskCount} risks · ${metrics.issueCount} issues`}
                onClick={() => navigate("Risks")}
              />
            </div>
            <div className="section-title">
              <div>
                <span className="eyebrow">PORTFOLIO LENS</span>
                <h2>See the connections.</h2>
              </div>
              <button className="text-link" onClick={() => setAbout(true)}>
                How to read these charts ↗
              </button>
            </div>
            <div className="chart-grid overview-charts">
              <Globe
                projects={projects}
                onLocation={(id) => {
                  navigate("Projects");
                  setLocationFilter(id);
                }}
              />
              <Scatter projects={projects} onOpen={openProject} />
            </div>
            <div className="section-title">
              <div>
                <span className="eyebrow">FOUR PROGRAMS. ONE NETWORK.</span>
                <h2>Progress with purpose.</h2>
              </div>
              <span className="quiet">
                Select a program to focus the portfolio
              </span>
            </div>
            <div className="program-grid">
              {bundle.programs.map((p, i) => {
                const rows = projects.filter((pr) => pr.program === p.name);
                return (
                  <button
                    className="program-card"
                    key={p.id}
                    onClick={() => setProgram(p.name)}
                    style={
                      { "--program-color": p.color } as React.CSSProperties
                    }
                  >
                    <span className="program-index">
                      0{i + 1} <Icon name="arrow" />
                    </span>
                    <h3>{p.name}</h3>
                    <p>{p.description}</p>
                    <div>
                      <strong>{rows.length}</strong>
                      <span>projects</span>
                      <strong>{pct(mean(rows.map((r) => r.progress)))}</strong>
                      <span>delivered</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="insight-strip">
              <span className="insight-icon">↗</span>
              <div>
                <strong>
                  {atRisk.length
                    ? `${atRisk.length} initiatives need a closer look.`
                    : "Delivery is aligned with the current plan."}
                </strong>
                <p>
                  {atRisk.length
                    ? "Actual delivery is more than 10 percentage points behind expected progress."
                    : "No selected project is more than 10 percentage points behind expected progress."}
                </p>
              </div>
              <button
                className="button subtle"
                onClick={() => {
                  navigate("Projects");
                  setDetailFilter("Behind schedule");
                }}
              >
                Review delivery <Icon name="arrow" />
              </button>
            </div>
          </>
        )}
        {view === "Projects" && (
          <>
            <div className="kpi-grid">
              <Kpi
                label="Projects shown"
                value={projectRows.length}
                detail="After project and location filters"
              />
              <Kpi
                label="Actual delivery"
                value={pct(mean(projectRows.map((p) => p.progress)))}
                detail={`${pct(mean(projectRows.map((p) => p.expected)))} expected`}
              />
              <Kpi
                label="Behind schedule"
                value={
                  projectRows.filter((p) => p.schedule === "Behind schedule")
                    .length
                }
                detail="Gap greater than 10 percentage points"
              />
              <Kpi
                label="Average exposure"
                value={mean(projectRows.map((p) => p.exposure)).toFixed(1)}
                detail="Threat index · 0–100"
              />
            </div>
            <div className="subfilters">
              {select(
                "Schedule",
                detailFilter,
                ["All", "On track", "Behind schedule", "Ahead of plan"],
                setDetailFilter,
              )}
              {locationFilter && (
                <button
                  className="button subtle"
                  onClick={() => setLocationFilter("")}
                >
                  Clear site:{" "}
                  {bundle.locations.find((l) => l.id === locationFilter)!.name}{" "}
                  ×
                </button>
              )}
            </div>
            <Scatter
              projects={projectRows}
              mode="progress"
              onOpen={openProject}
            />
            <Table
              title="Project directory"
              rows={projectRows}
              columns={projectColumns}
              onOpen={openProject}
            />
          </>
        )}
        {view === "Deliverables" && (
          <>
            <div className="subfilters">
              {select(
                "Deliverable status",
                detailFilter,
                ["All", "Complete", "In progress", "Scheduled", "Overdue"],
                setDetailFilter,
              )}
            </div>
            <div className="kpi-grid">
              <Kpi
                label="Deliverables"
                value={deliverableRows.length}
                detail="Within the selected scope"
              />
              <Kpi
                label="Completed"
                value={
                  deliverableRows.filter((d) => d.status === "Complete").length
                }
                detail="100% completion"
              />
              <Kpi
                label="Overdue"
                value={
                  deliverableRows.filter((d) => d.status === "Overdue").length
                }
                detail={`Due before ${date(bundle.meta.asOf)}`}
              />
              <Kpi
                label="Average completion"
                value={pct(mean(deliverableRows.map((d) => d.completion)))}
                detail="Equal weight per deliverable"
              />
            </div>
            <div className="chart-grid">
              <Bars
                title="Deliverables by status"
                subtitle="Select a bar to filter the view"
                entries={groups(deliverableRows, "status")}
                onSelect={setDetailFilter}
              />
              <Bars
                title="Deliverables by program"
                subtitle="Distribution within the current filters"
                entries={byProgram(deliverableRows)}
                onSelect={setProgram}
              />
            </div>
            <Table
              title="Deliverable register"
              rows={deliverableRows}
              columns={deliverableColumns}
              onOpen={openProject}
            />
          </>
        )}
        {view === "Staff" && (
          <>
            <div className="kpi-grid">
              <Kpi
                label="Team members"
                value={metrics.staff}
                detail="Unique fictional people"
              />
              <Kpi
                label="Allocated FTE"
                value={metrics.fte}
                detail="Sum of project allocations"
              />
              <Kpi
                label="Weekly hours"
                value={sum(staffRows, "weeklyHours")}
                detail="40 hours per full-time equivalent"
              />
              <Kpi
                label="Delivery teams"
                value={new Set(staffRows.map((s) => s.team)).size}
                detail="Represented in the selected scope"
              />
            </div>
            <div className="chart-grid">
              <Bars
                title="FTE by program"
                subtitle="Allocated full-time equivalents"
                entries={byProgram(staffRows, "fte")}
                onSelect={setProgram}
              />
              <Bars
                title="Weekly hours by office"
                subtitle="Select an office to focus the view"
                entries={groups(staffRows, "office", "weeklyHours")}
                onSelect={setOffice}
              />
            </div>
            <Table
              title="Staff allocations"
              rows={staffRows}
              columns={[
                { key: "name", label: "Name" },
                { key: "role", label: "Role" },
                { key: "project", label: "Project" },
                { key: "team", label: "Team" },
                { key: "office", label: "Office" },
                { key: "fte", label: "FTE" },
                { key: "weeklyHours", label: "Hours / week" },
              ]}
              onOpen={openProject}
            />
          </>
        )}
        {view === "Financials" && (
          <>
            <div className="kpi-grid">
              <Kpi
                label="Budget"
                value={money(metrics.budget)}
                detail="Selected project budgets · USD"
              />
              <Kpi
                label="Actual expenditure"
                value={money(metrics.spent)}
                detail="As of the synthetic snapshot"
              />
              <Kpi
                label="Forecast expenditure"
                value={money(metrics.forecast)}
                detail="Projected total cost · USD"
              />
              <Kpi
                label="Burn rate"
                value={pct(metrics.burn)}
                detail="Actual expenditure ÷ budget"
              />
            </div>
            <div className="chart-grid">
              <Bars
                title="Budget by program"
                subtitle="Select a program to filter · USD"
                entries={byProgram(financialRows, "budget")}
                onSelect={setProgram}
                currency
              />
              <Bars
                title="Expenditure by office"
                subtitle="Select an office to filter · USD"
                entries={groups(financialRows, "office", "spent")}
                onSelect={setOffice}
                currency
              />
            </div>
            <Table
              title="Financial register"
              rows={financialRows}
              columns={[
                { key: "project", label: "Project" },
                { key: "program", label: "Program" },
                { key: "budget", label: "Budget", render: dollar },
                { key: "spent", label: "Expenditure", render: dollar },
                { key: "forecast", label: "Forecast", render: dollar },
                {
                  key: "nextYearBudget",
                  label: "Next year budget",
                  render: dollar,
                },
              ]}
              onOpen={openProject}
            />
          </>
        )}
        {view === "Funding Pipeline" && (
          <>
            <div className="subfilters">
              {select(
                "Opportunity stage",
                detailFilter,
                ["All", "Proposed", "Under review", "Negotiation", "Secured"],
                setDetailFilter,
              )}
            </div>
            <div className="kpi-grid">
              <Kpi
                label="Requested amount"
                value={money(sum(fundingRows, "requested"))}
                detail="All displayed stages · USD"
              />
              <Kpi
                label="Weighted pipeline"
                value={money(
                  fundingRows.reduce(
                    (n, r) => n + r.requested * r.probability,
                    0,
                  ),
                )}
                detail="Requested × stage probability"
              />
              <Kpi
                label="Opportunities"
                value={fundingRows.length}
                detail="Fictional funding prospects"
              />
              <Kpi
                label="Secured amount"
                value={money(
                  sum(
                    fundingRows.filter((f) => f.stage === "Secured"),
                    "requested",
                  ),
                )}
                detail="Stage marked as secured · USD"
              />
            </div>
            <div className="chart-grid">
              <Bars
                title="Requested amount by stage"
                subtitle="Select a stage to filter · USD"
                entries={groups(fundingRows, "stage", "requested")}
                onSelect={setDetailFilter}
                currency
              />
              <Bars
                title="Requested amount by program"
                subtitle="Selected opportunity scope · USD"
                entries={byProgram(fundingRows, "requested")}
                onSelect={setProgram}
                currency
              />
            </div>
            <Table
              title="Funding opportunities"
              rows={fundingRows}
              columns={[
                { key: "name", label: "Opportunity" },
                { key: "donor", label: "Fictional donor" },
                badgeCol("stage", "Stage"),
                { key: "requested", label: "Requested", render: dollar },
                {
                  key: "probability",
                  label: "Probability",
                  render: (v) => pct(Number(v) * 100),
                },
                {
                  key: "expectedDecision",
                  label: "Decision date",
                  render: date,
                },
              ]}
              onOpen={openProject}
            />
          </>
        )}
        {(view === "Risks" || view === "Issues") && (
          <>
            <div className="subfilters">
              {select(
                "Record status",
                detailFilter,
                ["All", "Open", "Monitoring", "Closed"],
                setDetailFilter,
              )}
              {select(
                "Severity",
                severityFilter,
                ["All", "Minor", "Moderate", "Major", "Critical"],
                setSeverityFilter,
              )}
              {select(
                "Category",
                categoryFilter,
                ["All", "Operational", "Financial", "Delivery"],
                setCategoryFilter,
              )}
              {select(
                "Who is impacted?",
                impactFilter,
                ["All", "Communities", "Delivery team", "Partners"],
                setImpactFilter,
              )}
            </div>
            <div className="kpi-grid">
              <Kpi
                label={`${view} shown`}
                value={riskRows.length}
                detail="After all active filters"
              />
              <Kpi
                label="Open or monitoring"
                value={riskRows.filter((r) => r.status !== "Closed").length}
                detail="Response still required"
              />
              <Kpi
                label="Major or critical"
                value={riskRows.filter((r) => r.score > 40).length}
                detail="Exposure score above 40"
              />
              <Kpi
                label="Overdue actions"
                value={
                  riskRows.filter(
                    (r) =>
                      r.actionStatus !== "Complete" &&
                      r.dueDate < bundle.meta.asOf,
                  ).length
                }
                detail="Open actions past their due date"
              />
            </div>
            <div className="chart-grid">
              <Bars
                title={`${view} by status`}
                subtitle="Select a status to focus the register"
                entries={groups(riskRows, "status")}
                onSelect={setDetailFilter}
              />
              <Bars
                title={`${view} by severity`}
                subtitle="Select an exposure band to filter"
                entries={["Minor", "Moderate", "Major", "Critical"].map(
                  (label, i) => ({
                    label,
                    value: riskRows.filter((r) => r.severity === label).length,
                    color: exposureColor([10, 30, 60, 90][i]),
                  }),
                )}
                onSelect={setSeverityFilter}
              />
            </div>
            <Table
              title={`${view} register`}
              rows={riskRows}
              columns={riskColumns}
              onOpen={openProject}
            />
          </>
        )}
        <footer>
          <div className="footer-brand">
            <img
              src={`${import.meta.env.BASE_URL}atlas-mark.svg`}
              width="28"
              height="28"
              alt=""
            />
            <strong>Atlas Impact Network</strong>
            <span>Program Intelligence Hub · v{bundle.meta.version}</span>
          </div>
          <p>{bundle.meta.disclaimer}</p>
          <div className="footer-links">
            <button onClick={() => setAbout(true)}>Methodology & data</button>
            <a
              href="https://github.com/Infanatoca17"
              target="_blank"
              rel="noreferrer"
            >
              Ivan Morales · GitHub ↗
            </a>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Back to top ↑
            </button>
          </div>
        </footer>
      </main>
      {about && <About close={() => setAbout(false)} />}{" "}
      {selected && (
        <Project360 project={selected} close={() => setProjectId("")} />
      )}
    </>
  );
}
