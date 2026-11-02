#!/usr/bin/env python3
"""Fail fast if cross-component entry points needed by INFORTEX-HI are missing."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = (
    'backend/CMakeLists.txt', 'backend/src/main.cpp',
    'frontend/package.json', 'frontend/src/services/api.ts',
    'frontend/nginx.conf', 'frontend/vite.config.ts',
    'database/schema.sql', 'docker-compose.yml',
    '.env.example', 'Start-HI.ps1', '.github/workflows/verify.yml',
    'scripts/integration_test.py', 'scripts/test-compose.py',
)


def check_layout(root: Path) -> list[str]:
    return [f'Missing project file: {rel}' for rel in REQUIRED
            if not (root / rel).is_file()]


def main() -> int:
    problems = check_layout(ROOT)
    for message in problems:
        print('FAIL:', message)
    if problems:
        return 1
    print(f'PASS: {len(REQUIRED)} required project components present.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
