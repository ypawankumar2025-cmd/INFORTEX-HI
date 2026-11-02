
#!/usr/bin/env python3
"""Verify PostgreSQL migration versions against local SQL files."""

from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
MIGRATIONS = ROOT / "database" / "migrations"


def local_versions():
    files = sorted(MIGRATIONS.glob("[0-9]*_*.sql"))
    return [file.name.split("_", 1)[0] for file in files]


def database_versions():
    command = [
        "docker", "compose", "exec", "-T",
        "db", "psql",
        "-U", "hi",
        "-d", "hi",
        "-At",
        "-c",
        "SELECT version FROM schema_migrations ORDER BY version;",
    ]

    result = subprocess.run(
        command,
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=True,
    )

    return [
        line.strip()
        for line in result.stdout.splitlines()
        if line.strip()
    ]


def main():
    if not MIGRATIONS.is_dir():
        print("FAIL: Migration directory not found.")
        return 1

    local = local_versions()

    if not local:
        print("FAIL: No migration SQL files found.")
        return 1

    if len(local) != len(set(local)):
        print("FAIL: Duplicate local migration versions.")
        return 1

    try:
        applied = database_versions()
    except (OSError, subprocess.CalledProcessError) as error:
        print(f"FAIL: Cannot query PostgreSQL: {error}")
        return 1

    print("Local migrations:", ", ".join(local))
    print("Applied migrations:", ", ".join(applied))

    missing = sorted(set(local) - set(applied))
    unknown = sorted(set(applied) - set(local))

    if missing:
        print("FAIL: Unapplied migrations:", ", ".join(missing))

    if unknown:
        print("FAIL: Unknown database migrations:", ", ".join(unknown))

    if missing or unknown:
        return 1

    if len(applied) != len(set(applied)):
        print("FAIL: Duplicate applied migration versions.")
        return 1

    print("PASS: All migration versions match.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
