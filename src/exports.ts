import bundle from "./data/atlas-bundle.json";
import type { SheetData } from "write-excel-file/browser";

export const exportNote = `${bundle.meta.name} | Synthetic demonstration data | ${bundle.meta.asOf}`;
function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
export function createWorkbookSheets(
  rows: Record<string, unknown>[],
  name: string,
) {
  const keys = rows.length ? Object.keys(rows[0]) : ["Message"];
  const data: SheetData = [
    keys.map((key) => ({
      value: key,
      fontWeight: "bold",
      color: "#FFFFFF",
      backgroundColor: "#173D36",
    })),
  ];
  if (rows.length)
    rows.forEach((row) =>
      data.push(
        keys.map((key) =>
          typeof row[key] === "number"
            ? (row[key] as number)
            : String(row[key]),
        ),
      ),
    );
  else data.push(["No records match the current filters."]);
  const about: SheetData = [
    ["Product", bundle.meta.product],
    ["Organization", bundle.meta.name],
    ["Data as of", bundle.meta.asOf],
    ["Scope", name],
    ["Data", "All business records and people are fictional."],
    ["Disclaimer", { value: bundle.meta.disclaimer, wrap: true, height: 45 }],
  ];
  return [
    {
      sheet: "Data",
      data,
      columns: keys.map((key) => ({
        width: key.toLowerCase().includes("name") ? 34 : 24,
      })),
      stickyRowsCount: 1,
    },
    { sheet: "About", data: about, columns: [{ width: 28 }, { width: 110 }] },
  ];
}
export async function exportWorkbook(
  rows: Record<string, unknown>[],
  name: string,
) {
  const { default: writeExcelFile } = await import("write-excel-file/browser");
  const blob = await writeExcelFile(createWorkbookSheets(rows, name), {
    fontFamily: "Calibri",
    fontSize: 11,
  }).toBlob();
  download(blob, `Atlas_${name.replaceAll(" ", "_")}.xlsx`);
}
export function exportChart(id: string, title: string, type: "svg" | "png") {
  const source = document.getElementById(id) as SVGSVGElement | null;
  if (!source) return;
  const svg = source.cloneNode(true) as SVGSVGElement;
  const viewBox = source.viewBox.baseVal;
  const width = viewBox.width || 680;
  const height = viewBox.height || 340;
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height + 90}`);
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height + 90));
  svg.setAttribute("style", "background:#fffdf8;font-family:Arial,sans-serif");
  const addText = (text: string, y: number, size: number) => {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "text");
    el.setAttribute("x", "16");
    el.setAttribute("y", String(y));
    el.setAttribute("font-size", String(size));
    el.setAttribute("fill", "#31544c");
    el.textContent = text;
    svg.appendChild(el);
  };
  addText(title, height + 20, 13);
  addText(exportNote, height + 38, 9);
  const lines = bundle.meta.disclaimer.match(/.{1,91}(?:\s|$)/g) || [
    bundle.meta.disclaimer,
  ];
  lines.forEach((line, i) => addText(line, height + 53 + i * 11, 8));
  const raw = new XMLSerializer().serializeToString(svg);
  const filename = `Atlas_${title.replaceAll(" ", "_")}`;
  if (type === "svg") {
    download(new Blob([raw], { type: "image/svg+xml" }), `${filename}.svg`);
    return;
  }
  const img = new Image();
  const url = URL.createObjectURL(new Blob([raw], { type: "image/svg+xml" }));
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = width * 2;
    canvas.height = (height + 90) * 2;
    const context = canvas.getContext("2d");
    if (context) {
      context.fillStyle = "#fffdf8";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) download(blob, `${filename}.png`);
      });
    }
    URL.revokeObjectURL(url);
  };
  img.onerror = () => URL.revokeObjectURL(url);
  img.src = url;
}
