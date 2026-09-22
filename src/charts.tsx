import { useId, useMemo, useRef, useState } from "react";
import { geoOrthographic, geoPath, geoGraticule10, geoDistance } from "d3-geo";
import { feature } from "topojson-client";
import world from "./data/world-land.json";
import bundle from "./data/atlas-bundle.json";
import { exportChart } from "./exports";

export type Project = (typeof bundle.projects)[number];
export const colors = [
  "#267567",
  "#4279b0",
  "#8668a9",
  "#bf7839",
  "#b95c58",
  "#596f88",
];
export const exposureColor = (n: number) =>
  n <= 20 ? "#267567" : n <= 40 ? "#bb8b30" : n <= 70 ? "#c47c3c" : "#b54c58";
export const compact = (n: number) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
export const money = (n: number) => `$${compact(n)}`;

function Tools({ id, title }: { id: string; title: string }) {
  return (
    <span className="chart-tools">
      <button
        aria-label={`Download ${title} as SVG`}
        onClick={() => exportChart(id, title, "svg")}
      >
        SVG
      </button>
      <button
        aria-label={`Download ${title} as PNG`}
        onClick={() => exportChart(id, title, "png")}
      >
        PNG ↓
      </button>
    </span>
  );
}
export function Scatter({
  projects,
  mode = "exposure",
  onOpen,
}: {
  projects: Project[];
  mode?: "exposure" | "progress";
  onOpen: (p: Project) => void;
}) {
  const id = `scatter-${useId().replaceAll(":", "")}`;
  const exposure = mode === "exposure";
  const title = exposure
    ? "Project exposure & progress"
    : "Project progress tracker";
  const [hover, setHover] = useState<Project | null>(null);
  const x = (p: Project) => 58 + (exposure ? p.exposure : p.expected) * 4.85;
  const y = (p: Project) => 279 - p.progress * 2.22;
  return (
    <section className="panel chart-panel">
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          <p>
            {exposure
              ? "Where delivery meets uncertainty"
              : "Actual delivery against elapsed project time"}
          </p>
        </div>
        <Tools id={id} title={title} />
      </div>
      <svg id={id} viewBox="0 0 590 340" role="img" aria-label={title}>
        <rect x="58" y="57" width="485" height="222" rx="2" fill="#fafbf8" />
        {exposure ? (
          <>
            <rect x="58" y="57" width="194" height="222" fill="#edf4ec" />
            <rect x="397" y="57" width="146" height="222" fill="#fbefed" />
            <text x="74" y="76" fontSize="10" fill="#617d68">
              LOWER EXPOSURE
            </text>
            <text x="412" y="76" fontSize="10" fill="#a46a65">
              HIGHER EXPOSURE
            </text>
          </>
        ) : (
          <>
            <path
              d="M58 279 L543 57"
              stroke="#aabeb8"
              strokeWidth="1.5"
              strokeDasharray="5 5"
            />
            <text x="377" y="84" fontSize="10" fill="#617d68">
              ON-PLAN REFERENCE
            </text>
          </>
        )}
        {[0, 25, 50, 75, 100].map((n) => (
          <g key={n}>
            <line
              x1="58"
              y1={279 - n * 2.22}
              x2="543"
              y2={279 - n * 2.22}
              stroke="#dce5df"
              strokeDasharray="3 4"
            />
            <text
              x="43"
              y={283 - n * 2.22}
              textAnchor="end"
              fontSize="11"
              fill="#677a72"
            >
              {n}%
            </text>
            <text
              x={58 + n * 4.85}
              y="301"
              textAnchor="middle"
              fontSize="11"
              fill="#677a72"
            >
              {n}
            </text>
          </g>
        ))}
        <text x="300" y="329" textAnchor="middle" fontSize="11" fill="#536a61">
          {exposure
            ? "Threat exposure index (0–100)"
            : "Expected project progress (%)"}
        </text>
        <text
          transform="translate(15 180) rotate(-90)"
          textAnchor="middle"
          fontSize="11"
          fill="#536a61"
        >
          Actual project progress (%)
        </text>
        {projects.map((p) => (
          <circle
            key={p.id}
            cx={x(p)}
            cy={y(p)}
            r={5 + p.budget / 300000}
            fill={
              exposure
                ? exposureColor(p.exposure)
                : bundle.programs.find((pr) => pr.name === p.program)!.color
            }
            fillOpacity=".82"
            stroke="#fff"
            strokeWidth="1.5"
            tabIndex={0}
            role="button"
            aria-label={`Open ${p.name}`}
            onClick={() => onOpen(p)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpen(p);
              }
            }}
            onMouseEnter={() => setHover(p)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(p)}
            onBlur={() => setHover(null)}
          >
            <title>
              {p.name}: {p.progress}% actual, {p.expected}% expected,{" "}
              {p.exposure} exposure; {p.program}
            </title>
          </circle>
        ))}
      </svg>
      <div className="chart-caption" aria-live="polite">
        {hover
          ? `${hover.name} · ${hover.progress}% delivered · ${hover.exposure} exposure`
          : projects.length
            ? `${projects.length} projects · Bubble size represents budget · Select to open Project 360`
            : "No projects match these filters."}
      </div>
    </section>
  );
}

const land = feature(world as never, world.objects.land as never);
export function Globe({
  projects,
  onLocation,
}: {
  projects: Project[];
  onLocation: (id: string) => void;
}) {
  const id = `globe-${useId().replaceAll(":", "")}`;
  const [rotation, setRotation] = useState(-20);
  const drag = useRef<{ x: number; angle: number; moved: boolean } | null>(
    null,
  );
  const projection = useMemo(
    () =>
      geoOrthographic()
        .translate([264, 178])
        .scale(150)
        .rotate([rotation, -12])
        .clipAngle(90),
    [rotation],
  );
  const path = geoPath(projection);
  const visibleLocations = bundle.locations.filter((l) =>
    projects.some((p) => p.locationId === l.id),
  );
  const center: [number, number] = [-rotation, 12];
  const gradient = `${id}-sea`;
  return (
    <section className="panel globe-panel">
      <div className="panel-heading">
        <div>
          <h2>Our footprint</h2>
          <p>Fictional initiatives. A connected perspective.</p>
        </div>
        <Tools id={id} title="Atlas geographic footprint" />
      </div>
      <div className="globe-content">
        <svg
          id={id}
          viewBox="0 0 528 350"
          role="img"
          aria-label="Interactive globe of fictional project sites"
          style={{ touchAction: "pan-y" }}
          onPointerDown={(e) => {
            drag.current = { x: e.clientX, angle: rotation, moved: false };
          }}
          onPointerMove={(e) => {
            if (drag.current && e.buttons) {
              const dx = e.clientX - drag.current.x;
              if (Math.abs(dx) > 4) {
                drag.current.moved = true;
                setRotation(drag.current.angle + dx * 0.5);
              }
            }
          }}
          onPointerUp={() => {
            setTimeout(() => {
              drag.current = null;
            }, 0);
          }}
          onPointerLeave={() => {
            drag.current = null;
          }}
        >
          <defs>
            <radialGradient id={gradient} cx="35%" cy="30%">
              <stop offset="0" stopColor="#f2f6ee" />
              <stop offset="1" stopColor="#d7e5dc" />
            </radialGradient>
          </defs>
          <ellipse
            cx="269"
            cy="332"
            rx="100"
            ry="9"
            fill="#214d3e"
            opacity=".08"
          />
          <circle
            cx="264"
            cy="178"
            r="150"
            fill={`url(#${gradient})`}
            stroke="#becdc4"
          />
          <path
            d={path(geoGraticule10()) || ""}
            fill="none"
            stroke="#bccfc3"
            strokeWidth=".5"
          />
          <path
            d={path(land as never) || ""}
            fill="#8baa92"
            stroke="#fbfdf8"
            strokeWidth=".45"
          />
          {visibleLocations.map((l) => {
            const coordinate: [number, number] = [l.longitude, l.latitude];
            if (geoDistance(coordinate, center) > Math.PI / 2) return null;
            const p = projection(coordinate);
            if (!p) return null;
            return (
              <circle
                key={l.id}
                cx={p[0]}
                cy={p[1]}
                r="5"
                fill="#173d36"
                stroke="#d5ecaa"
                strokeWidth="2"
                role="button"
                tabIndex={0}
                aria-label={`Show ${l.name}`}
                onClick={() => {
                  if (!drag.current?.moved) onLocation(l.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onLocation(l.id);
                }}
              >
                <title>
                  {l.name} · {l.country}
                </title>
              </circle>
            );
          })}
        </svg>
        <div className="globe-stat">
          <strong>{visibleLocations.length}</strong>
          <span>
            demonstration
            <br />
            sites
          </span>
        </div>
      </div>
      <div className="globe-control">
        <button
          aria-label="Rotate globe west"
          onClick={() => setRotation((r) => r - 35)}
        >
          ←
        </button>
        <span>Drag to explore · Select a site</span>
        <button
          aria-label="Rotate globe east"
          onClick={() => setRotation((r) => r + 35)}
        >
          →
        </button>
      </div>
    </section>
  );
}
export function Bars({
  title,
  subtitle,
  entries,
  onSelect,
  currency = false,
}: {
  title: string;
  subtitle: string;
  entries: { label: string; value: number; color?: string }[];
  onSelect?: (label: string) => void;
  currency?: boolean;
}) {
  const id = `bars-${useId().replaceAll(":", "")}`;
  const max = Math.max(...entries.map((e) => e.value), 1);
  const height = Math.max(190, entries.length * 44 + 32);
  return (
    <section className="panel chart-panel">
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <Tools id={id} title={title} />
      </div>
      <svg id={id} viewBox={`0 0 590 ${height}`} role="img" aria-label={title}>
        {entries.map((e, i) => (
          <g
            key={e.label}
            role={onSelect ? "button" : undefined}
            tabIndex={onSelect ? 0 : undefined}
            aria-label={onSelect ? `Filter ${e.label}` : undefined}
            onClick={() => onSelect?.(e.label)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onSelect?.(e.label);
            }}
          >
            <text x="16" y={i * 44 + 27} fontSize="11" fill="#3f5c51">
              {e.label.length > 24 ? `${e.label.slice(0, 22)}…` : e.label}
            </text>
            <rect
              x="190"
              y={i * 44 + 12}
              width="315"
              height="24"
              fill="#f0f3ed"
              rx="4"
            />
            <rect
              x="190"
              y={i * 44 + 12}
              width={(e.value / max) * 315}
              height="24"
              fill={e.color || colors[i % colors.length]}
              rx="4"
            />
            <text
              x="568"
              y={i * 44 + 28}
              textAnchor="end"
              fontSize="12"
              fontWeight="600"
              fill="#294d40"
            >
              {currency ? money(e.value) : compact(e.value)}
            </text>
            <title>
              {e.label}: {e.value.toLocaleString("en-US")}
              {currency ? " USD" : ""}
            </title>
          </g>
        ))}
        {!entries.length && (
          <text x="295" y="95" textAnchor="middle" fill="#677a72">
            No records match these filters.
          </text>
        )}
      </svg>
    </section>
  );
}
