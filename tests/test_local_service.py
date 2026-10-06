import json
import os
import tempfile
import threading
import unittest
from functools import partial
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from unittest.mock import patch
from atlas_coworker.assistant import guided, local_answer, model_status, settings, validate_model_result
from atlas_coworker.server import answer_request, validate_request, Handler, BASE_PATH

class ServiceTests(unittest.TestCase):
    def setUp(self):
        self.env = patch.dict(os.environ, {"LM_STUDIO_MODEL": "synthetic-test-model", "LM_STUDIO_BASE_URL": "http://127.0.0.1:1234/v1", "LM_STUDIO_TIMEOUT": "120", "LM_STUDIO_API_KEY": ""})
        self.env.start()
    def tearDown(self):
        self.env.stop()
    def test_guided_uses_full_48_project_dataset(self):
        answer = guided({"question": "Report"})
        self.assertEqual(answer["facts"]["projects"], 48)
        self.assertEqual(answer["facts"]["deliverables"], 288)
        self.assertEqual(answer["facts"]["observed"], 48)
        self.assertEqual(answer["mode"], "guided")
    def test_scopes_quality_and_scenario_reach_the_shared_engine(self):
        answer = answer_request({"question": "What changes in this scenario?", "sample": "defects", "filters": {"program": "Health"}, "parameters": {"fundingCut": .2, "capacityCut": .25, "probabilityUplift": .5}})
        self.assertEqual(answer["facts"]["projects"], 12)
        self.assertEqual(answer["scenario"]["parameters"]["fundingCut"], .2)
        self.assertTrue(all(r["program"] == "Health" for r in answer["scenario"]["rows"]))
    def test_lm_studio_contract_and_verified_numbers_are_preserved(self):
        baseline = guided({"question": "Report"})
        def transport(payload):
            self.assertEqual(payload["response_format"]["type"], "json_schema")
            self.assertTrue(payload["response_format"]["json_schema"]["strict"])
            self.assertEqual(payload["temperature"], 0)
            self.assertFalse(payload["stream"])
            self.assertEqual(payload["model"], "synthetic-test-model")
            return {"choices": [{"message": {"content": json.dumps({"summary": "A local narrative.", "actions": ["Review delivery."], "source_ids": ["CALC-PORTFOLIO"]})}}]}
        result = local_answer(baseline, "Report", transport)
        self.assertEqual(result["mode"], "local_ai")
        self.assertEqual(result["facts"], baseline["facts"])
        self.assertEqual(result["scenario"], baseline["scenario"])
        self.assertEqual(baseline["mode"], "guided")
    def test_invalid_citations_trigger_an_explicit_guided_fallback(self):
        def invalid(_):
            return {"choices": [{"message": {"content": '{"summary":"Text","actions":[],"source_ids":["INVENTED"]}'}}]}
        result = answer_request({"question": "Report", "mode": "local_ai"}, invalid)
        self.assertEqual(result["mode"], "guided")
        self.assertTrue(result["fallback"])
    def test_unavailable_model_falls_back(self):
        with patch.dict(os.environ, {"LM_STUDIO_MODEL": ""}):
            result = answer_request({"question": "Report", "mode": "local_ai"})
        self.assertEqual(result["mode"], "guided")
        self.assertTrue(result["fallback"])
    def test_unsupported_topic_does_not_call_a_model(self):
        def forbidden(_):
            self.fail("Unsupported questions must not call the model")
        result = answer_request({"question": "What is the weather?", "mode": "local_ai"}, forbidden)
        self.assertEqual(result["intent"], "unsupported")
        self.assertEqual(result["mode"], "guided")
    def test_request_boundaries_reject_invalid_scope_and_parameters(self):
        for invalid in [{"question": ""}, {"question": "Report", "filters": {"program": "Unknown"}}, {"question": "Report", "filters": {"project": "ATL-P999"}}, {"question": "Report", "parameters": {"fundingCut": True}}, {"question": "Report", "parameters": {"capacityCut": float('nan')}}, {"question": "Report", "sample": "unknown"}, {"question": "Report", "unknown": True}]:
            with self.assertRaises(ValueError):
                validate_request(invalid)
    def test_adapter_is_local_only_and_timeout_is_bounded(self):
        for base in ["https://example.com/v1", "http://example.com/v1", "http://localhost:1234/v1?token=x", "http://user:pass@localhost:1234/v1"]:
            with patch.dict(os.environ, {"LM_STUDIO_BASE_URL": base}):
                with self.assertRaises(ValueError): settings()
        with patch.dict(os.environ, {"LM_STUDIO_TIMEOUT": "999"}):
            with self.assertRaises(ValueError): settings()
    def test_response_shapes_and_lengths_are_checked(self):
        for value in [{}, {"summary": "", "actions": [], "source_ids": ["CALC-PORTFOLIO"]}, {"summary": "x", "actions": [0], "source_ids": ["CALC-PORTFOLIO"]}, {"summary": "x", "actions": [], "source_ids": []}]:
            with self.assertRaises(ValueError): validate_model_result(value, {"CALC-PORTFOLIO"})
    def test_real_http_transport_uses_lm_studio_path_schema_and_optional_auth(self):
        requests = []
        class ModelHandler(BaseHTTPRequestHandler):
            def log_message(self, *args): pass
            def do_GET(self):
                self.send_response(200); self.end_headers(); self.wfile.write(b'{"data":[{"id":"synthetic-test-model"}]}')
            def do_POST(self):
                requests.append((self.path, self.headers.get('Authorization'), json.loads(self.rfile.read(int(self.headers['Content-Length'])))))
                value = {"choices": [{"message": {"content": '{"summary":"Mock HTTP narrative","actions":[],"source_ids":["CALC-PORTFOLIO"]}'}}]}
                self.send_response(200); self.end_headers(); self.wfile.write(json.dumps(value).encode())
        with ThreadingHTTPServer(('127.0.0.1', 0), ModelHandler) as server:
            thread = threading.Thread(target=server.serve_forever, daemon=True); thread.start()
            try:
                with patch.dict(os.environ, {"LM_STUDIO_BASE_URL": f"http://127.0.0.1:{server.server_port}/v1", "LM_STUDIO_API_KEY": "synthetic-token"}):
                    status = model_status()
                    self.assertTrue(status['reachable']); self.assertTrue(status['model_available'])
                    self.assertNotIn('synthetic-token', json.dumps(status))
                    result = answer_request({"question": "Report", "mode": "local_ai"})
                    self.assertEqual(result['mode'], 'local_ai')
            finally:
                server.shutdown(); thread.join()
        self.assertEqual(requests[0][0], '/v1/chat/completions')
        self.assertEqual(requests[0][1], 'Bearer synthetic-token')
        self.assertEqual(requests[0][2]['response_format']['json_schema']['name'], 'atlas_coworker_answer')
    def test_app_http_contract_subpath_and_cross_origin_boundary(self):
        class QuietHandler(Handler):
            def log_message(self, *args): pass
        with tempfile.TemporaryDirectory() as folder:
            Path(folder, 'index.html').write_text('Synthetic app')
            with ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=folder)) as server:
                thread = threading.Thread(target=server.serve_forever, daemon=True); thread.start()
                base = f'http://127.0.0.1:{server.server_port}'
                try:
                    with urlopen(base + BASE_PATH) as response: self.assertEqual(response.read(), b'Synthetic app')
                    request = Request(base + BASE_PATH + 'api/assistant', data=b'{"question":"Report"}', headers={'Content-Type': 'application/json'})
                    with urlopen(request) as response: self.assertEqual(json.load(response)['facts']['projects'], 48)
                    external = Request(base + BASE_PATH + 'api/assistant', data=b'{"question":"Report"}', headers={'Origin': 'https://example.com'})
                    with self.assertRaises(HTTPError) as error: urlopen(external)
                    self.assertEqual(error.exception.code, 403)
                finally:
                    server.shutdown(); thread.join()

if __name__ == '__main__': unittest.main()
