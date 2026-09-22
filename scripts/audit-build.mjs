import { readdirSync, readFileSync } from "node:fs";
import assert from "node:assert/strict";
const base = "/program-intelligence-hub/";
const root = new URL("../dist/", import.meta.url);
const html = readFileSync(new URL("index.html", root), "utf8");
assert.ok(
  html.includes(`${base}assets/`),
  "Production asset base is incorrect.",
);
assert.ok(
  html.includes("Atlas Impact Network"),
  "Atlas page title is missing.",
);
let files = 0;
function scan(folder) {
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    const url = new URL(entry.name + (entry.isDirectory() ? "/" : ""), folder);
    if (entry.isDirectory()) scan(url);
    else {
      files++;
      assert.ok(
        !entry.name.endsWith(".map"),
        "Production source maps must not be shipped.",
      );
      if (/\.(js|html|json|css|svg)$/.test(entry.name)) {
        const value = readFileSync(url, "utf8");
        assert.ok(
          !/wri\.org|sharepoint\.com|app\.asana\.com|citiesppmo|ross.center|vipper|cities4forests|no data reported/i.test(
            value,
          ),
          `Institutional content found in ${entry.name}`,
        );
      }
    }
  }
}
scan(root);
console.log(
  `Release audit passed: ${files} static files; Atlas base path; no original branding or institutional endpoints.`,
);
