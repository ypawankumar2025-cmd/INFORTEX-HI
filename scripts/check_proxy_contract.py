#!/usr/bin/env python3
"""Protect the React -> nginx/Vite -> C++ API routing contract."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def check_proxy(nginx: str, vite: str, api: str) -> list[str]:
    errors = []
    if not re.search(r'location\s+/api/\s*\{', nginx):
        errors.append('nginx must expose /api/ as a route')
    if not re.search(r'proxy_pass\s+http://backend:8081\s*;', nginx):
        errors.append('nginx API must forward to the Compose backend')
    if not re.search(r'["\']/api["\']\s*:\s*["\']http://127\.0\.0\.1:8081["\']', vite):
        errors.append('Vite /api proxy must target local C++ port 8081')
    if not re.search(r'fetch\s*\(\s*["\']/api/["\']\s*\+\s*path', api):
        errors.append('React API client must use same-origin /api/ routes')
    if not re.search(r'credentials\s*:\s*["\']same-origin["\']', api):
        errors.append('React API client must keep same-origin cookies')
    return errors


def main() -> int:
    frontend = ROOT / 'frontend'
    errors = check_proxy(
        (frontend / 'nginx.conf').read_text(encoding='utf-8'),
        (frontend / 'vite.config.ts').read_text(encoding='utf-8'),
        (frontend / 'src/services/api.ts').read_text(encoding='utf-8'),
    )
    for error in errors:
        print('FAIL:', error)
    if errors:
        return 1
    print('PASS: nginx, Vite and React share compatible API routing.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
