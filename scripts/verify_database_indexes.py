
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
        "SELECT t.relname, idx.relname, pg_get_indexdef(idx.oid), "
        "i.indisvalid, i.indisready "
        "FROM pg_index i "
        "JOIN pg_class idx ON idx.oid=i.indexrelid "
        "JOIN pg_class t ON t.oid=i.indrelid "
        "JOIN pg_namespace n ON n.oid=t.relnamespace "
        "WHERE n.nspname='public' "
        "AND t.relname IN ('notifications','comments');",
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
        parts = line.split("|", 4)
        if len(parts) != 5:
            print(f"FAIL: Unexpected database output: {line}")
            return 1

        table, name, definition, is_valid, is_ready = parts
        indexes[(table, name)] = (definition, is_valid, is_ready)

   
    failed = False

    for (table, name), columns in EXPECTED.items():
        index_info = indexes.get((table, name))

        if index_info is None:
            print(f"FAIL: Missing index {name}")
            failed = True
            continue

        definition, is_valid, is_ready = index_info

        if not re.search(
            r"\bUSING\s+btree\s*" + columns,
            definition,
            re.IGNORECASE,
        ):
            print(f"FAIL: Incorrect index definition for {name}")
            failed = True
        elif is_valid != "t" or is_ready != "t":
            print(
                f"FAIL: Index {name} unhealthy "
                f"(valid={is_valid}, ready={is_ready})"
            )
            failed = True
        else:
            print(f"PASS: {name}")

    if failed:
        return 1

    print("PASS: All required database indexes verified.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
