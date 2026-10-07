import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  progressExpected,
  projectProgress,
  projectExposure,
  severity,
  riskScore,
  scheduleStatus,
} from "../src/metrics.mjs";

import { deliveryEvents } from "../src/delivery-history.mjs";

// Every business record is created here. No original source data is read.
export function generateBundle() {
  const meta = {
    name: "Atlas Impact Network",
    product: "Atlas Business Intelligence Hub",
    productLabel: "Business Intelligence Hub",
    version: "1.2.0",
    asOf: "2026-09-22",
    period: "Q3 2026",
    seed: 17092026,
    synthetic: true,
    disclaimer:
      "This is a demo with dummy data. It does not contain or reproduce copyrighted, confidential or protected code, systems, or datasets.",
    contact: "hello@atlas-impact.example",
    provenance:
      "Generated from fictional scenarios by scripts/generate-data.mjs",
  };
  const programs = [
    {
      id: "sustainability",
      name: "Sustainability",
      color: "#267567",
      description: "Climate-ready places and resilient natural systems.",
      teams: ["Climate Adaptation", "Circular Systems", "Ecosystem Renewal"],
    },
    {
      id: "health",
      name: "Health",
      color: "#4279b0",
      description: "Stronger care systems and healthier communities.",
      teams: ["Community Care", "Health Access", "Prevention & Wellbeing"],
    },
    {
      id: "governance",
      name: "Governance",
      color: "#8668a9",
      description:
        "Accountable institutions and meaningful civic participation.",
      teams: [
        "Civic Participation",
        "Public Accountability",
        "Digital Institutions",
      ],
    },
    {
      id: "education",
      name: "Education",
      color: "#bf7839",
      description: "Equitable learning opportunities throughout life.",
      teams: ["Learning Access", "Skills & Livelihoods", "Digital Learning"],
    },
  ];
  const offices = [
    "Americas",
    "Europe",
    "Africa",
    "South Asia",
    "East Asia",
    "Oceania",
  ];
  const regions = [
    ["Mexico", -99.1, 19.4],
    ["Portugal", -9.1, 38.7],
    ["Kenya", 36.8, -1.3],
    ["India", 77.6, 12.9],
    ["Vietnam", 105.8, 21.0],
    ["Australia", 151.2, -33.8],
  ];
  const places = ["Alder", "Juniper", "Cedar", "Willow"];
  const locations = programs.flatMap((p, pi) =>
    regions.map((r, i) => ({
      id: `ATL-L${String(pi * 6 + i + 1).padStart(3, "0")}`,
      name: `${places[pi]} ${["Valley", "Harbour", "Plains", "Ridge", "River", "Coast"][i]} demonstration site`,
      country: r[0],
      longitude: Number(r[1]) + pi * 0.18,
      latitude: Number(r[2]) + pi * 0.15,
      office: offices[i],
      description:
        "Fictional program site; coordinates illustrate a geographic region.",
    })),
  );
  const titles = [
    [
      "Watershed Futures",
      "Circular Neighbourhoods",
      "Urban Canopy",
      "Clean Energy Commons",
      "Coastal Renewal",
      "Regenerative Landscapes",
      "Resilient Food Systems",
      "Community Cooling",
      "Low Carbon Districts",
      "Water Stewardship",
      "Biodiversity Corridors",
      "Resource Recovery",
    ],
    [
      "Community Care Connect",
      "Healthy Starts",
      "Mobile Care Access",
      "Prevention in Practice",
      "Wellbeing Together",
      "Rural Care Networks",
      "Health Navigator",
      "Inclusive Clinics",
      "Nutrition Pathways",
      "Care Workforce",
      "Early Intervention",
      "Safe Community Spaces",
    ],
    [
      "Open Budget Lab",
      "Civic Voices",
      "Participatory Planning",
      "Public Service Design",
      "Community Accountability",
      "Digital Access Commons",
      "Transparent Procurement",
      "Local Evidence Lab",
      "Inclusive Decisions",
      "Civic Data Literacy",
      "Service Feedback Loop",
      "Institutional Learning",
    ],
    [
      "Learning Without Limits",
      "Digital Classrooms",
      "Foundational Skills",
      "Community Learning Hubs",
      "Future Skills Network",
      "Inclusive Learning Design",
      "Educator Exchange",
      "Learning Recovery",
      "Pathways to Work",
      "Connected Libraries",
      "Early Learning Lab",
      "Lifelong Learning",
    ],
  ];
  const first = [
    "Avery",
    "Ellis",
    "Morgan",
    "Rowan",
    "Quinn",
    "Sage",
    "Cameron",
    "Jordan",
    "Taylor",
    "Alex",
    "Casey",
    "Robin",
  ];
  const last = [
    "Vale",
    "Briar",
    "Aster",
    "Finch",
    "Elm",
    "Reed",
    "Linden",
    "Haven",
  ];
  const person = (n) => `${first[n % 12]} ${last[Math.floor(n / 12) % 8]}`;
  const iso = (date) => date.toISOString().slice(0, 10);
  const addDays = (date, days) =>
    iso(new Date(Date.parse(date) + days * 86400000));
  const projects = [];
  const deliverables = [];
  const risks = [];
  const plans = [];
  const staff = [];
  const financials = [];
  const funding = [];
  programs.forEach((program, pi) => {
    titles[pi].forEach((title, j) => {
      const n = pi * 12 + j;
      const id = `ATL-P${String(n + 1).padStart(3, "0")}`;
      const location = locations[pi * 6 + (j % 6)];
      const startDate = addDays("2026-01-05", (j % 5) * 21);
      const duration = 300 + (j % 4) * 45;
      const endDate = addDays(startDate, duration);
      const expected = progressExpected(startDate, endDate, meta.asOf);
      const budget = 320000 + ((n * 7) % 17) * 55000;
      const planId = `ATL-MP${String(n + 1).padStart(3, "0")}`;
      const project = {
        id,
        name: title,
        program: program.name,
        programId: program.id,
        team: program.teams[j % 3],
        office: location.office,
        locationId: location.id,
        location: location.name,
        country: location.country,
        owner: person(n),
        ownerEmail: `${person(n).toLowerCase().replaceAll(" ", ".")}@atlas-impact.example`,
        startDate,
        endDate,
        status: j === 11 ? "Planned" : "Active",
        planId,
        budget,
        description: `A fictional ${program.name.toLowerCase()} initiative supporting practical, locally led improvements through collaborative delivery and evidence-based learning.`,
        objective: `Demonstrate a repeatable ${program.teams[j % 3].toLowerCase()} approach across the ${location.office.toLowerCase()}.`,
        outcome: `Improve access to ${["resilient infrastructure", "community care", "responsive public services", "inclusive learning"][pi]} for ${1500 + n * 125} fictional participants.`,
        nextMilestone: "Partner review and learning workshop",
        progress: 0,
        expected,
        exposure: 0,
        schedule: "On track",
      };
      if (j === 11) {
        project.startDate = "2026-10-01";
        project.endDate = "2027-09-30";
        project.expected = 0;
      }
      const target =
        j === 11
          ? 0
          : Math.min(
              92,
              Math.max(
                15,
                expected + [-24, 5, 17, -15, 3, 11][j % 6] + [0, 3, -7, 5][pi],
              ),
            );
      const budgetParts = [0.1, 0.15, 0.15, 0.2, 0.2, 0.2];
      [
        "Discovery brief",
        "Partner agreement",
        "Baseline assessment",
        "Pilot delivery",
        "Learning review",
        "Scale-up roadmap",
      ].forEach((kind, k) => {
        const completion = Math.min(
          100,
          Math.max(0, Math.round(target * 6 - k * 100)),
        );
        const projectDays =
          (Date.parse(project.endDate) - Date.parse(project.startDate)) /
          86400000;
        const dueDate = addDays(
          project.startDate,
          Math.round((projectDays / 6) * (k + 1)),
        );
        deliverables.push({
          id: `ATL-D${String(n * 6 + k + 1).padStart(4, "0")}`,
          projectId: id,
          project: title,
          name: `${title} · ${kind}`,
          type: [
            "Report",
            "Agreement",
            "Assessment",
            "Implementation",
            "Workshop",
            "Strategy",
          ][k],
          assignee: person(n),
          dueDate,
          completion,
          status:
            completion === 100
              ? "Complete"
              : dueDate < meta.asOf
                ? "Overdue"
                : completion > 0
                  ? "In progress"
                  : "Scheduled",
          program: program.name,
          team: project.team,
          office: project.office,
          location: project.location,
          budget: Math.round(budget * budgetParts[k]),
          description: `Synthetic ${kind.toLowerCase()} for the ${title} demonstration project.`,
        });
      });
      const riskNames = [
        "Partner mobilisation delay",
        "Procurement lead time",
        "Service access disruption",
      ];
      riskNames.forEach((name, k) => {
        const impact = n % 13 === 0 ? 5 : 1 + ((n + k * 2) % 5);
        const likelihood = k === 2 || n % 13 === 0 ? 5 : 1 + ((n * 3 + k) % 5);
        const status =
          (n + k) % 9 === 0
            ? "Closed"
            : (n + k) % 3 === 0
              ? "Monitoring"
              : "Open";
        const record = {
          id: `ATL-R${String(n * 3 + k + 1).padStart(4, "0")}`,
          projectId: id,
          project: title,
          planId,
          kind: k === 2 ? "Issue" : "Risk",
          name,
          category: ["Operational", "Financial", "Delivery"][k],
          impacted: ["Communities", "Delivery team", "Partners"][(n + k) % 3],
          impact,
          likelihood,
          status,
          owner: person(n),
          action: [
            "Confirm partner milestones and weekly check-ins.",
            "Secure alternative suppliers and phase procurement.",
            "Activate the service-continuity plan and monitor access.",
          ][k],
          actionStatus:
            status === "Closed"
              ? "Complete"
              : (n + k) % 2
                ? "In progress"
                : "Planned",
          dueDate: addDays(meta.asOf, ((n + k) % 7) * 8 - 12),
          program: program.name,
          office: project.office,
          team: project.team,
          score: 0,
          severity: "Minor",
          description: `Fictional ${k === 2 ? "issue" : "risk"} scenario used to demonstrate tracking, ownership, and response planning.`,
        };
        record.score = riskScore(record);
        record.severity = severity(record.score);
        risks.push(record);
      });
      plans.push({
        id: planId,
        projectId: id,
        name: `${title} response plan`,
        owner: person(n),
        status: "Reviewed",
        lastReview: "2026-09-15",
        nextReview: "2026-10-15",
        approach:
          "Review weekly; escalate major and critical exposure; track actions to closure.",
      });
      for (let k = 0; k < 2; k++) {
        const index = n * 2 + k;
        const name = person(index);
        const fte = 0.5 + ((n + k) % 5) * 0.1;
        staff.push({
          id: `ATL-S${String(index + 1).padStart(3, "0")}`,
          projectId: id,
          project: title,
          name,
          role: k === 0 ? "Program specialist" : "Delivery analyst",
          email: `${name.toLowerCase().replaceAll(" ", ".")}@atlas-impact.example`,
          office: project.office,
          program: program.name,
          team: project.team,
          status: "Active",
          fte: Math.round(fte * 10) / 10,
          weeklyHours: Math.round(fte * 40),
          startDate: "2026-01-01",
          endDate: "2026-12-31",
        });
      }
      const spent =
        j === 11
          ? 0
          : Math.round(((budget * target) / 100) * (0.92 + (n % 3) * 0.08));
      financials.push({
        id: `ATL-F${String(n + 1).padStart(3, "0")}`,
        projectId: id,
        project: title,
        program: program.name,
        team: project.team,
        office: project.office,
        budget,
        spent,
        forecast: Math.round(budget * (1 + ((n % 5) - 2) * 0.03)),
        nextYearBudget: Math.round(budget * 1.12),
        currency: "USD",
        period: meta.period,
      });
      if (j % 2 === 0) {
        const stageIndex = (j / 2 + pi) % 4;
        funding.push({
          id: `ATL-O${String(funding.length + 1).padStart(3, "0")}`,
          projectId: id,
          project: title,
          name: `${title} expansion`,
          donor: [
            "Northlight Foundation",
            "Meridian Giving Circle",
            "Evergreen Futures Fund",
            "Horizon Partnership",
          ][stageIndex],
          stage: ["Proposed", "Under review", "Negotiation", "Secured"][
            stageIndex
          ],
          probability: [0.25, 0.5, 0.75, 1][stageIndex],
          requested: 180000 + n * 18500,
          currency: "USD",
          expectedDecision: addDays("2026-10-01", j * 7),
          owner: person(n),
          office: project.office,
          team: project.team,
          program: program.name,
          description:
            "Fictional funding opportunity for a demonstration project.",
        });
      }
      project.progress = projectProgress(id, deliverables);
      project.exposure = projectExposure(id, risks);
      project.schedule = scheduleStatus(project.progress, project.expected);
      projects.push(project);
    });
  });
  const assumptions = {
    scheduleTolerance: 7,
    likelihoodProbabilities: { 1: 0.10, 2: 0.25, 3: 0.45, 4: 0.65, 5: 0.85 },
    capacityCostFactor: 0.30,
    currency: "USD",
    probabilityBasis: "Illustrative synthetic assumptions; not calibrated probabilities.",
  };
  risks.forEach((r, i) => {
    r.probability = r.kind === "Issue" ? 1 : assumptions.likelihoodProbabilities[r.likelihood];
    r.lossUsd = Math.round(projects.find(p => p.id === r.projectId).budget * (0.02 + r.impact * 0.025));
    r.delayDays = r.impact * 6 + (i % 5) * 3;
    r.expectedLossUsd = r.status === "Closed" ? 0 : r.probability * r.lossUsd;
  });
  projects.forEach(p => { p.expectedLossUsd = risks.filter(r => r.projectId === p.id).reduce((s, r) => s + r.expectedLossUsd, 0); });
  financials.forEach(f => { f.expectedLossUsd = projects.find(p => p.id === f.projectId).expectedLossUsd; });
  deliverables.forEach((d, i) => Object.assign(d, deliveryEvents(d, projects.find(p => p.id === d.projectId), meta.asOf, i)));
  const observations = projects.flatMap(p => {
    const finance = financials.find(f => f.projectId === p.id);
    const ds = deliverables.filter(d => d.projectId === p.id);
    return Array.from({ length: 12 }, (_, i) => {
      const dt = new Date(Date.UTC(2025, 9 + i + 1, 0));
      const period = dt.toISOString().slice(0, 7);
      const observedAt = i === 11 ? meta.asOf : dt.toISOString().slice(0, 10);
      const expected = progressExpected(p.startDate, p.endDate, observedAt);
      const factor = p.expected > 0 ? Math.min(1, expected / p.expected) : 0;
      const deliverableCompletions = ds.map(d => ({ id: d.id, completion: i === 11 ? d.completion : Math.round(d.completion * factor) }));
      return { id: `ATL-OBS-${p.id}-${period}`, projectId: p.id, period, observedAt,
        reportedAt: observedAt, deliverableCompletions,
        progress: Math.round(deliverableCompletions.reduce((s, d) => s + d.completion, 0) / ds.length * 10) / 10,
        expected, spent: i === 11 ? finance.spent : Math.round(finance.spent * factor) };
    });
  });
  const documents = [
    { id: "DOC-METHOD", title: "Delivery and scope policy", text: "Actual progress is the arithmetic mean of deliverable completion; portfolio progress is the equal-weight mean of all projects in the selected scope, including planned projects. Expected progress uses elapsed planned time at the fixed snapshot. On track allows seven percentage points on either side of expected progress. Monthly observations are historical evidence, not a replacement for current deliverables." },
    { id: "DOC-QUALITY", title: "Synthetic quality policy", text: "Invalid, duplicate and orphan monthly observations are quarantined with source locators. Warnings identify missing owners, response actions or stale reports. The defect sample deliberately introduces eight findings; loading the canonical sample replaces the fixture, not arbitrary user data." },
    { id: "DOC-RISK", title: "Exposure and financial scenario policy", text: "Exposure is the mean impact times likelihood times four for non-closed threats, bounded from zero to one hundred. Financial consequences sum explicit probability times synthetic loss in USD, with issues at probability one and closed records excluded. Exposure and dollars have different units and are never added together." },
    { id: "DOC-PROBABILITY", title: "Synthetic probability assumptions", text: "Risk likelihood levels one through five use probabilities 10%, 25%, 45%, 65% and 85%. These are explicit fictional scenario inputs, not empirical estimates. Likelihood uplift scales probability and caps it at one; issues stay at one." },
    { id: "DOC-FINANCE", title: "Cost and delay assumptions", text: "Scenario execution cost extrapolates spending divided by deliverable-derived progress for projects with positive progress. Remaining cost increases by 0.30 times capacity reduction. Funding reductions apply to approved budget. Funding gaps are calculated per project and do not transfer surplus. Delay adds capacity delay and probability-weighted threat delay; correlations and overlap are not modeled. The synthetic financial forecast is a separate baseline field." },
    { id: "DOC-REVIEW", title: "Human review policy", text: "Review requires nonempty scope, no critical quality findings and full current monthly observation coverage. Warnings require acknowledgement. Every generated narrative requires human review. Review is session-only and resets when scope, sample, scenario or narrative changes." },
  ];
  return {
    meta,
    programs,
    locations,
    projects,
    deliverables,
    plans,
    risks,
    staff,
    financials,
    funding,
    assumptions,
    observations,
    documents,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const target = new URL("../src/data/", import.meta.url);
  mkdirSync(target, { recursive: true });
  const bundle = generateBundle();
  writeFileSync(
    new URL("atlas-bundle.json", target),
    JSON.stringify(bundle, null, 2) + "\n",
  );
  console.log(
    `Generated ${bundle.projects.length} fictional projects and ${bundle.deliverables.length} deliverables.`,
  );
}
