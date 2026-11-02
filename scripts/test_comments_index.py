
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

INDEX_PATTERN = re.compile(
    r"CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+comments_project_created"
    r"\s+ON\s+comments\s*\(\s*project_id\s*,\s*created_at\s+DESC\s*\)\s*;",
    re.IGNORECASE,
)


class TestCommentsIndex(unittest.TestCase):

    def test_fresh_schema_contains_index(self):
        sql = (ROOT / "database/schema.sql").read_text(encoding="utf-8")
        self.assertRegex(sql, INDEX_PATTERN)

    def test_migration_contains_index(self):
        sql = (
            ROOT / "database/migrations/005_comments_index.sql"
        ).read_text(encoding="utf-8")
        self.assertRegex(sql, INDEX_PATTERN)

    def test_migration_registers_version_005(self):
        sql = (
            ROOT / "database/migrations/005_comments_index.sql"
        ).read_text(encoding="utf-8")
        self.assertRegex(sql, r"VALUES\s*\(\s*'005'\s*,\s*0\s*\)")


if __name__ == "__main__":
    unittest.main()
