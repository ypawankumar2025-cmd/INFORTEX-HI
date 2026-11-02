#!/usr/bin/env python3
"""Validate the resolved Docker Compose graph, without starting containers."""
import argparse
import json
import os
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def check_services(data: dict) -> list[str]:
    errors = []
    services = data.get('services', {})
    for name in ('db', 'backend', 'frontend'):
        if name not in services:
            errors.append(f'Missing Compose service: {name}')
    if errors:
        return errors
    db, backend, frontend = (services[name] for name in ('db','backend','frontend'))
    if db.get('ports') or backend.get('ports'):
        errors.append('Database and backend must not expose host ports')
    ports = frontend.get('ports') or []
    if len(ports) != 1 or ports[0].get('host_ip') != '127.0.0.1' or str(ports[0].get('target')) != '80':
        errors.append('Frontend must bind one host-loopback port to container port 80')
    if backend.get('depends_on', {}).get('db', {}).get('condition') != 'service_healthy':
        errors.append('Backend must wait for healthy PostgreSQL')
    if frontend.get('depends_on', {}).get('backend', {}).get('condition') != 'service_healthy':
        errors.append('Frontend must wait for healthy backend')
    if not db.get('healthcheck'):
        errors.append('PostgreSQL service must have a healthcheck')
    volumes = db.get('volumes') or []
    if not any(v.get('target') == '/var/lib/postgresql/data' and v.get('type') == 'volume' for v in volumes):
        errors.append('PostgreSQL data must be stored in a persistent named volume')
    if not backend.get('environment', {}).get('DATABASE_URL', '').startswith('postgresql://'):
        errors.append('Backend must use PostgreSQL under Compose')
    return errors


def load_compose(root: Path) -> dict:
    env = dict(os.environ)
    env['DB_PASSWORD'] = 'synthetic-check-only-not-a-credential'
    env['HI_HTTP_PORT'] = '8080'
    env['APP_ORIGIN'] = 'http://localhost:8080'
    result = subprocess.run(
        ['docker', 'compose', '-f', str(root / 'docker-compose.yml'), 'config', '--format', 'json'],
        cwd=root, env=env, check=True, capture_output=True, text=True, timeout=30,
    )
    return json.loads(result.stdout)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--require-docker', action='store_true', help='Fail instead of skipping when Docker is unavailable')
    args = parser.parse_args()
    try:
        config = load_compose(ROOT)
    except (FileNotFoundError, subprocess.CalledProcessError, subprocess.TimeoutExpired, ValueError) as error:
        if isinstance(error, FileNotFoundError) and not args.require_docker:
            print('SKIP: Docker CLI not installed; run in CI or with Docker Desktop.')
            return 0
        print('FAIL: Cannot resolve Docker Compose configuration:', str(error))
        return 1
    issues = check_services(config)
    for issue in issues:
        print('FAIL:', issue)
    if issues:
        return 1
    print('PASS: isolated Compose service graph and persistence requirements.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
