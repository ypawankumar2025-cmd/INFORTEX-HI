#!/usr/bin/env python3
"""Read-only health smoke test for a local, running INFORTEX-HI website."""
import argparse
import json
import urllib.error
import urllib.request
from urllib.parse import urlsplit


def validate_origin(origin: str) -> str:
    parsed = urlsplit(origin)
    if (parsed.scheme != 'http' or parsed.hostname not in ('localhost','127.0.0.1')
            or parsed.username is not None or parsed.password is not None
            or parsed.path not in ('', '/') or parsed.query or parsed.fragment
            or parsed.port is None):
        raise ValueError('Only explicit local http://localhost:PORT or http://127.0.0.1:PORT is supported')
    return origin.rstrip('/')


def check_health(origin: str, timeout: float = 5) -> list[str]:
    url = validate_origin(origin)
    errors = []
    with urllib.request.urlopen(url + '/api/health', timeout=timeout) as response:
        health = json.load(response)
        if response.status != 200 or health.get('status') != 'ok':
            errors.append('Backend /api/health did not report status=ok')
    with urllib.request.urlopen(url + '/', timeout=timeout) as response:
        html = response.read(16000).decode('utf-8', errors='replace').lower()
        if response.status != 200 or '<html' not in html:
            errors.append('Frontend root did not return an HTML document')
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', default='http://localhost:8080')
    args = parser.parse_args()
    try:
        errors = check_health(args.url)
    except (ValueError, OSError, urllib.error.URLError, json.JSONDecodeError) as error:
        print('FAIL: Cannot verify local service:', str(error))
        return 1
    for error in errors:
        print('FAIL:', error)
    if errors:
        return 1
    print('PASS: local frontend and backend health endpoints are responding.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
