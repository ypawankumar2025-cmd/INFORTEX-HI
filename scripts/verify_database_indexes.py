
#!/usr/bin/env python3
"""Verify required indexes in the live PostgreSQL database."""

import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

EXPECTED = {
    ("notifications", "notifications_user_created"):
        r"\(\s*user_id\s*,\s*created_at\s+DESC\s*\)",
    ("comments", "comments_project_created"):
        r"\(\s*project_id\s*,\s*created_at\s+DESC\s*\)",
}


def main():
    command = [
        "docker", "compose", "exec", "-T", "db",
        "psql", "-U", "hi", "-d", "hi",
        "-At", "-F", "|", "-c",
        "SELECT tablename, indexname, indexdef FROM pg_indexes "
        "WHERE schemaname='public' "
        "AND tablename IN ('notifications','comments');",
    ]

    try:
        result = subprocess.run(
            command,
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=True,
            timeout=30,
        )
    except (
        OSError,
        subprocess.CalledProcessError,
        subprocess.TimeoutExpired,
    ) as error:
        print(f"FAIL: Cannot inspect database indexes: {error}")
        return 1

    indexes = {}

    for line in result.stdout.splitlines():
        parts = line.split("|", 2)
        if len(parts) != 3:
            print(f"FAIL: Unexpected database output: {line}")
            return 1

        table, name, definition = parts
        indexes[(table, name)] = definition

    failed = False

    for (table, name), columns in EXPECTED.items():
        definition = indexes.get((table, name))

        if definition is None:
            print(f"FAIL: Missing index {name}")
            failed = True
        elif not re.search(
            r"\bUSING\s+btree\s*" + columns,
            definition,
            re.IGNORECASE,
        ):
            print(f"FAIL: Incorrect index definition for {name}")
            failed = True
        else:
            print(f"PASS: {name}")

    if failed:
        return 1

    print("PASS: All required database indexes verified.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
