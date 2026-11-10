#!/usr/bin/env python3
"""Build and test a disposable PostgreSQL stack; never uses the normal HI volume."""
import os
from pathlib import Path
import secrets
import socket
import subprocess
import sys
import tempfile
import time
import urllib.request

root = Path(__file__).resolve().parents[1]
project = 'hi-test-' + secrets.token_hex(5)
with socket.socket() as sock:
    sock.bind(('127.0.0.1', 0))
    port = sock.getsockname()[1]
origin = f'http://127.0.0.1:{port}'
with tempfile.TemporaryDirectory(prefix='hi-compose-') as temp:
    config = Path(temp) / '.env'
    config.write_text(f'DB_PASSWORD={secrets.token_hex(24)}\nAI_MODE=demo\nADMIN_EMAIL=\nAPP_ORIGIN={origin}\nHI_HTTP_PORT={port}\nCOOKIE_SECURE=false\nLLM_API_KEY=\nBRAVE_SEARCH_API_KEY=\nLLM_STREAMING=false\n')
    # Bind only a disposable test mailbox into the backend container. Test OTP
    # codes never appear in application logs or on a public endpoint.
    mailbox = Path(temp) / 'otp-mailbox.jsonl'
    mailbox.touch()
    mailbox.chmod(0o666)  # allow the non-root container user to append
    override = Path(temp) / 'ci-mailbox.compose.yml'
    override.write_text(
        'services:\n'
        '  backend:\n'
        '    environment:\n'
        '      HI_CI_TEST_MODE: "1"\n'
        '      HI_CI_OTP_FILE: "/tmp/hi-ci-otp-mailbox.jsonl"\n'
        f'      OTP_PEPPER: {secrets.token_hex(32)}\n'
        '    volumes:\n'
        '      - type: bind\n'
        f'        source: {mailbox.as_posix()}\n'
        '        target: /tmp/hi-ci-otp-mailbox.jsonl\n',
        encoding='utf-8',
    )
    env = dict(os.environ)
    # Compose shell values take priority over --env-file: isolate test settings.
    for key in ('DB_PASSWORD', 'AI_MODE', 'ADMIN_EMAIL', 'APP_ORIGIN', 'HI_HTTP_PORT', 'COOKIE_SECURE', 'LLM_API_KEY', 'BRAVE_SEARCH_API_KEY', 'LLM_STREAMING', 'OTP_PEPPER', 'HI_CI_TEST_MODE', 'HI_CI_OTP_FILE'):
        env.pop(key, None)
    command = ['docker', 'compose', '--project-name', project, '--env-file', str(config), '-f', str(root / 'docker-compose.yml'), '-f', str(override)]
    def compose(*args):
        return subprocess.run(command + list(args), cwd=root, env=env, check=True)
    def ready():
        for _ in range(90):
            try:
                with urllib.request.urlopen(origin + '/api/health', timeout=2) as response:
                    if response.status == 200:
                        return
            except (OSError, TimeoutError):
                pass
            time.sleep(1)
        raise RuntimeError('Backend did not become ready')
    subprocess.run(['docker', 'compose', 'version'], check=True)
    try:
        compose('up', '-d', '--build', '--wait', '--wait-timeout', '180')
        ready()
        subprocess.run([sys.executable, str(root / 'scripts/integration_test.py')], env={**env, 'HI_TEST_URL': origin, 'HI_CI_TEST_MODE': '1', 'HI_CI_OTP_FILE': str(mailbox)}, check=True)
        compose('restart', 'backend')
        ready()
        result = subprocess.run(command + ['exec', '-T', 'db', 'psql', '-U', 'hi', '-d', 'hi', '-At', '-c', 'SELECT count(*) FROM tasks'], env=env, check=True, capture_output=True, text=True)
        assert int(result.stdout.strip()) == 7, 'Task persistence check failed'
        print('PostgreSQL integration and restart persistence passed')
    finally:
        # Only the uniquely named disposable test project and its volumes.
        compose('down', '--volumes', '--remove-orphans')
