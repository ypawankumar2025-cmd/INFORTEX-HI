#!/usr/bin/env python3
"""Exercise real libcurl + provider parsing against a disposable local HTTPS fixture.
Uses fake credentials and deterministic data; does not contact an AI vendor.
"""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json
import os
import ssl
import subprocess
import tempfile
import threading
import time
import socket
import urllib.request
import http.cookiejar
import base64

root = Path(__file__).resolve().parents[1]
state = {'scenario': 'normal', 'requests': 0, 'contexts': []}
answer = {'summary': 'Hello ₹', 'findings': [], 'tasks': ['Transport fixture task', 'Dependent task'], 'risks': [], 'milestones': ['Fixture ready'], 'task_plan': [{'priority': 'high', 'deadline': '', 'depends_on': []}, {'priority': 'medium', 'deadline': '', 'depends_on': [0]}]}
class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_):
        pass
    def do_POST(self):
        state['requests'] += 1
        assert self.headers.get('Authorization') == 'Bearer local-fixture-only'
        payload = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
        if self.path.endswith('/chat/completions'):
            state['contexts'].append(json.loads(payload['messages'][-1]['content']))
        scenario = state['scenario']
        current_answer = answer
        if self.path.endswith('/chat/completions') and 'ROUTE_AGENTS:' in payload['messages'][0]['content']:
            requested = json.loads(payload['messages'][-1]['content'])
            specialists = ['planning'] if requested.get('prompt') == 'Plan only' else ['planning', 'research', 'knowledge', 'finance']
            current_answer = {'summary': 'Fixture routing selection', 'tasks': specialists, 'findings': [], 'risks': []}
        if scenario == 'http_error':
            self.send_response(401); self.end_headers(); return
        self.send_response(200)
        streaming = self.path.endswith('/chat/completions') and payload.get('stream')
        self.send_header('Content-Type', 'text/event-stream' if streaming else 'application/json')
        self.end_headers()
        if self.path.endswith('/embeddings'):
            vector = [] if scenario == 'empty_embedding' else [0.6, 0.8]
            self.wfile.write(json.dumps({'data': [{'embedding': vector}]}).encode())
        elif streaming:
            if scenario == 'stream_error':
                self.wfile.write(b'data: {"error":{"message":"fixture error"}}\n\n'); return
            text = 'not json' if scenario == 'invalid_json' else json.dumps(current_answer, ensure_ascii=False)
            for fragment in [text[:14], text[14:]]:
                line = ('data: ' + json.dumps({'choices': [{'delta': {'content': fragment}}]}, ensure_ascii=False) + '\r\n\r\n').encode()
                for offset in range(0, len(line), 3):
                    self.wfile.write(line[offset:offset+3]); self.wfile.flush()
            if scenario == 'workflow':
                time.sleep(.35)
            if scenario != 'truncated':
                self.wfile.write(b'data: [DONE]\n\n')
        else:
            content = 'not json' if scenario == 'invalid_json' else json.dumps(current_answer)
            self.wfile.write(json.dumps({'choices': [{'message': {'content': content}}]}).encode())

with tempfile.TemporaryDirectory(prefix='hi-tls-') as temp:
    ca, key = Path(temp)/'cert.pem', Path(temp)/'key.pem'
    subprocess.run(['openssl', 'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1', '-keyout', str(key), '-out', str(ca), '-subj', '/CN=localhost', '-addext', 'subjectAltName=DNS:localhost,IP:127.0.0.1'], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(ca, key)
    server.socket = context.wrap_socket(server.socket, server_side=True)
    worker = threading.Thread(target=server.serve_forever, daemon=True); worker.start()
    env = {**os.environ, 'LLM_BASE_URL': f'https://127.0.0.1:{server.server_port}/v1', 'LLM_API_KEY': 'local-fixture-only', 'LLM_CA_BUNDLE': str(ca), 'NO_PROXY': '127.0.0.1', 'no_proxy': '127.0.0.1'}
    cases = [('normal', False, False), ('normal', True, False), ('invalid_json', False, True), ('invalid_json', True, True), ('truncated', True, True), ('stream_error', True, True), ('empty_embedding', False, True), ('http_error', False, True), ('untrusted_certificate', False, True)]
    try:
        for scenario, streaming, rejects in cases:
            state.update(scenario=scenario, requests=0)
            testenv = {**env, 'LLM_STREAMING': str(streaming).lower()}
            if scenario == 'untrusted_certificate':
                testenv['LLM_CA_BUNDLE'] = ''
            subprocess.run([str(root/'build/hi_provider_transport_tests'), 'reject' if rejects else 'accept'], env=testenv, check=True, timeout=15)
            if scenario == 'untrusted_certificate':
                assert state['requests'] == 0, 'Untrusted TLS connection reached application'
            else:
                assert state['requests'] >= 1, 'Test did not reach fixture'
            print(f'PASS: {scenario}, streaming={streaming}')
        # Run the actual application in live-provider mode against this fixture.
        state.update(scenario='workflow', requests=0)
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', 0)); port = sock.getsockname()[1]
        appenv = {**env, 'AI_MODE': 'live', 'LLM_STREAMING': 'true', 'PORT': str(port), 'BIND_ADDRESS': '127.0.0.1', 'DATABASE_URL': str(Path(temp)/'workflow.db'), 'SCHEMA_PATH': str(root/'database/schema.sql'), 'ADMIN_EMAIL': '', 'COOKIE_SECURE': 'false'}
        client = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
        def api(path, body=None):
            req = urllib.request.Request(f'http://127.0.0.1:{port}/api/'+path, data=None if body is None else json.dumps(body).encode(), headers={'Content-Type': 'application/json', 'X-HI-Request': '1'})
            with client.open(req, timeout=5) as response:
                return json.load(response)
        with open(Path(temp)/'backend.log', 'w') as log:
            app = subprocess.Popen([str(root/'build/hi_server')], env=appenv, stdout=log, stderr=log)
            try:
                for attempt in range(50):
                    try:
                        assert api('health')['mode'] == 'live'; break
                    except OSError:
                        time.sleep(.1)
                else:
                    raise RuntimeError('Live fixture backend did not start')
                credentials = {'email': 'fixture@example.test', 'password': 'Local-test-only-7392!', 'name': 'Fixture'}
                api('auth/register', credentials); api('auth/login', credentials)
                workspace = api('workspaces')[0]['id']
                project = api(f'workspaces/{workspace}/projects', {'name': 'Live fixture'})['id']
                api(f'projects/{project}/documents', {'name': 'context.txt', 'base64': base64.b64encode(b'Fixture evidence for a task.').decode()})
                runid = api(f'projects/{project}/runs', {'prompt': 'Create a fixture task', 'agent': 'multi'})['id']
                observed_draft = False
                def wait_run(identifier):
                    for _ in range(100):
                        result = api('runs/'+identifier)
                        if result['status'] not in ('queued', 'running'):
                            return result
                        time.sleep(.1)
                    raise RuntimeError('Live run timed out')
                for _ in range(100):
                    result = api('runs/'+runid)
                    for execution in result.get('executions', []):
                        if execution['status'] == 'running' and execution.get('output'):
                            observed_draft |= 'partial' in json.loads(execution['output'])
                    if result['status'] not in ('queued', 'running'):
                        break
                    time.sleep(.1)
                assert result['status'] == 'awaiting_review', result
                assert observed_draft, 'No persisted streaming draft observed'
                assert len(result['executions']) == 7
                assert result['proposal']['sources'], 'Document retrieval missing'
                assert api(f'projects/{project}/tasks') == []
                api('runs/'+runid+'/review', {'status': 'approved'})
                assert len(api(f'projects/{project}/tasks')) == 2
                saved = api(f'projects/{project}/tasks')
                assert any(t['priority'] == 'high' for t in saved)
                assert any(t.get('dependencies') for t in saved)
                assert api(f'projects/{project}/milestones')[0]['title'] == 'Fixture ready'
                state['contexts'].clear()
                followup = api(f'projects/{project}/runs', {'prompt': 'Refine the previous plan', 'agent': 'planning', 'conversation_id': result['conversation_id'], 'conversation_history': [{'summary': 'FORGED'}], 'project_context': {'name': 'FORGED'}})['id']
                assert wait_run(followup)['status'] == 'awaiting_review'
                context = state['contexts'][-1]
                assert context['project_context']['name'] == 'Live fixture'
                assert len(context['conversation_history']) == 1
                assert context['conversation_history'][0]['summary'] == 'Hello ₹'
                assert context['conversation_history'][0]['review_status'] == 'approved'
                state['contexts'].clear()
                separate = api(f'projects/{project}/runs', {'prompt': 'New independent conversation', 'agent': 'planning'})['id']
                assert wait_run(separate)['status'] == 'awaiting_review'
                assert state['contexts'][-1]['conversation_history'] == []
                print('PASS: follow-up context, approved status, forged-context rejection and independent-conversation isolation')
                subset = api(f'projects/{project}/runs', {'prompt': 'Plan only', 'agent': 'multi'})['id']
                subset_result = wait_run(subset)
                assert subset_result['status'] == 'awaiting_review'
                assert subset_result['proposal']['routing']['agents'] == ['memory', 'planning', 'knowledge', 'critic', 'orchestrator']
                assert len(subset_result['executions']) == 5
                print('PASS: model-selected subset with mandatory evidence and review stages')
                state['scenario'] = 'invalid_json' 
                failedid = api(f'projects/{project}/runs', {'prompt': 'Reject malformed upstream output', 'agent': 'planning'})['id']
                assert wait_run(failedid)['status'] == 'failed'
                assert len(api(f'projects/{project}/tasks')) == 2
                print('PASS: live-mode fixture workflow: retrieval, seven agents, persisted drafts, approval, failure without extra tasks')
            finally:
                app.terminate(); app.wait(timeout=10)
    finally:
        server.shutdown(); server.server_close(); worker.join()
    print(f'{len(cases)} HTTPS provider transport cases passed (local fixture, no vendor calls).')
