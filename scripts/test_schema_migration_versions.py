
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS = ROOT / "database" / "migrations"
SCHEMA = ROOT / "database" / "schema.sql"


class TestSchemaMigrationVersions(unittest.TestCase):

    def test_all_migrations_registered_in_schema(self):
        versions = {
            path.name.split("_")[0]
            for path in MIGRATIONS.glob("*.sql")
        }

        schema = SCHEMA.read_text(encoding="utf-8")
        registered = set(
            re.findall(
                r"INSERT\s+INTO\s+schema_migrations\s*"
                r"\(\s*version\s*,\s*applied_at\s*\)\s*"
                r"VALUES\s*\(\s*'(\d+)'\s*,\s*0\s*\)",
                schema,
                re.IGNORECASE,
            )
        )

        self.assertTrue(versions, "No migration files found")
        self.assertEqual(versions, registered)


if __name__ == "__main__":
    unittest.main()
