import argparse
import json
from .assistant import model_status
from .server import serve, answer_request

parser = argparse.ArgumentParser(description="Atlas Coworker with local LM Studio inference")
sub = parser.add_subparsers(dest="command", required=True)
server = sub.add_parser("serve")
server.add_argument("--port", type=int, default=8765)
sub.add_parser("check", help="Check LM Studio connectivity and the configured model ID")
evaluation = sub.add_parser("evaluate", help="Run one real local inference and show its mode")
evaluation.add_argument("--question", default="Draft the quarterly brief")
args = parser.parse_args()
if args.command == "serve":
    serve(args.port)
elif args.command == "check":
    status = model_status()
    print(json.dumps(status, indent=2))
    raise SystemExit(0 if status["reachable"] and status["model_available"] else 1)
else:
    result = answer_request({"question": args.question, "mode": "local_ai"})
    print(json.dumps({k: result[k] for k in ("mode", "summary", "source_ids", "note")}, indent=2))
    raise SystemExit(0 if result["mode"] == "local_ai" else 1)
