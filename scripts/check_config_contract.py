#!/usr/bin/env python3
"""Verify public .env.example defaults without ever reading a private .env."""
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
REQUIRED_KEYS = ('DB_PASSWORD', 'HI_HTTP_PORT', 'APP_ORIGIN',
                 'COOKIE_SECURE', 'AI_MODE', 'LLM_API_KEY',
                 'BRAVE_SEARCH_API_KEY')


def check_template(text: str) -> list[str]:
    errors, settings = [], {}
    for number, raw in enumerate(text.splitlines(), 1):
        line = raw.strip()
        if not line or line.startswith('#'):
            continue
        if '=' not in line:
            errors.append(f'Line {number}: expected KEY=VALUE')
            continue
        key, value = line.split('=', 1)
        key = key.strip()
        if key in settings:
            errors.append(f'Duplicate environment variable: {key}')
        settings[key] = value.strip()
    errors.extend(f'Missing environment variable: {key}'
                  for key in REQUIRED_KEYS if key not in settings)
    if settings.get('DB_PASSWORD') != 'CHANGE_ME':
        errors.append('Template password must remain the placeholder CHANGE_ME')
    for key in ('LLM_API_KEY', 'BRAVE_SEARCH_API_KEY'):
        if settings.get(key):
            errors.append(f'{key} must be empty in the public template')
    if settings.get('AI_MODE') != 'demo':
        errors.append('Local example should default to demo mode')
    if settings.get('COOKIE_SECURE') != 'false':
        errors.append('HTTP localhost example requires COOKIE_SECURE=false')
    port = settings.get('HI_HTTP_PORT', '')
    if not port.isdigit() or not (1 <= int(port) <= 65535):
        errors.append('HI_HTTP_PORT must be a valid TCP port')
    origin = settings.get('APP_ORIGIN', '')
    try:
        parsed = urlsplit(origin)
        if (parsed.scheme != 'http' or parsed.hostname != 'localhost'
                or parsed.port != int(port or '0') or parsed.path not in ('', '/')):
            errors.append('APP_ORIGIN must match the local frontend port')
    except ValueError:
        errors.append('Invalid APP_ORIGIN or port')
    return errors


def main() -> int:
    errors = check_template((ROOT / '.env.example').read_text(encoding='utf-8'))
    for error in errors:
        print('FAIL:', error)
    if errors:
        return 1
    print('PASS: public environment template is coherent; private .env was not read.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
