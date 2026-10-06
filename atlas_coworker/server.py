"""Serve the built React app and its same-origin local AI API."""
from __future__ import annotations
import json
import math
import re
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse
from .assistant import ROOT, guided, local_answer, model_status

BASE_PATH = re.search(r'basePath\s*=\s*"([^"]+)"', (ROOT / "deployment-base.mjs").read_text())[1]

def validate_request(body):
    if not isinstance(body, dict) or set(body) - {"question", "filters", "sample", "parameters", "mode"}:
        raise ValueError("Invalid request fields.")
    q = body.get("question")
    if not isinstance(q, str) or not 1 <= len(q.strip()) <= 1500:
        raise ValueError("Enter a question of 1–1500 characters.")
    if body.get("mode", "guided") not in {"guided", "local_ai"} or body.get("sample", "canonical") not in {"canonical", "defects"}:
        raise ValueError("Invalid mode or sample.")
    filters = body.get("filters", {})
    if not isinstance(filters, dict) or set(filters) - {"program", "office", "status", "project"} or any(not isinstance(v, str) for v in filters.values()):
        raise ValueError("Invalid filters.")
    bundle = json.loads((ROOT / "src/data/atlas-bundle.json").read_text(encoding="utf-8"))
    allowed = {"program": {"All programs"} | {p["name"] for p in bundle["programs"]}, "office": {"All offices"} | {p["office"] for p in bundle["projects"]}, "status": {"All statuses", "Active", "Planned"}, "project": {""} | {p["id"] for p in bundle["projects"]}}
    if any(v not in allowed[k] for k, v in filters.items()):
        raise ValueError("Unknown scope value.")
    params = body.get("parameters", {})
    if not isinstance(params, dict) or set(params) - {"fundingCut", "capacityCut", "probabilityUplift"}:
        raise ValueError("Unknown scenario parameter.")
    for k, v in params.items():
        if isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v) or not 0 <= v <= (1 if k == "probabilityUplift" else .5):
            raise ValueError("Scenario parameter outside supported range.")
    return {**body, "question": q.strip()}

def answer_request(body, transport=None):
    body = validate_request(body)
    response = guided(body)
    if body.get("mode") == "local_ai":
        try:
            return local_answer(response, body["question"], transport)
        except Exception:
            response.update(fallback=True, note="The local model was unavailable or its output failed validation. This is a guided fallback, not an AI-generated response.")
    return response

class Handler(SimpleHTTPRequestHandler):
    def json_response(self, code, value):
        data = json.dumps(value).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)
    def route(self):
        path = urlparse(self.path).path
        return path[len(BASE_PATH)-1:] if path.startswith(BASE_PATH) else path
    def do_GET(self):
        if self.route() == "/api/status":
            return self.json_response(200, model_status())
        if urlparse(self.path).path == "/":
            self.send_response(302)
            self.send_header("Location", BASE_PATH)
            self.end_headers()
            return
        if self.path.startswith(BASE_PATH):
            self.path = "/" + self.path[len(BASE_PATH):]
        super().do_GET()
    def do_POST(self):
        if self.route() != "/api/assistant":
            return self.json_response(404, {"error": "Unknown endpoint."})
        origin = self.headers.get("Origin")
        if origin and origin not in {f"http://127.0.0.1:{self.server.server_port}", f"http://localhost:{self.server.server_port}"}:
            return self.json_response(403, {"error": "Cross-origin requests are not allowed."})
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= 16384:
                raise ValueError("Request is empty or too large.")
            body = json.loads(self.rfile.read(length))
            return self.json_response(200, answer_request(body))
        except (ValueError, TypeError, json.JSONDecodeError) as exc:
            return self.json_response(400, {"error": str(exc)})
        except Exception:
            return self.json_response(500, {"error": "The local calculation service could not complete this request."})

def serve(port=8765):
    if not (ROOT / "dist/index.html").exists():
        raise SystemExit("Build the frontend first with npm run build.")
    with ThreadingHTTPServer(("127.0.0.1", port), partial(Handler, directory=str(ROOT / "dist"))) as server:
        print(f"Atlas Coworker: http://127.0.0.1:{port}{BASE_PATH}")
        print("Keep this terminal and the LM Studio server running.")
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("Server stopped.")
