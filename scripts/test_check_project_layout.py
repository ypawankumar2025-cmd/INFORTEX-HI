"""Regression tests for leader project-layout checks."""
import tempfile
import unittest
from pathlib import Path
from check_project_layout import REQUIRED, check_layout


class LayoutTests(unittest.TestCase):
    def test_real_repository_has_required_files(self):
        self.assertEqual(check_layout(Path(__file__).resolve().parents[1]), [])

    def test_missing_entries_are_reported(self):
        with tempfile.TemporaryDirectory() as temp:
            problems = check_layout(Path(temp))
        self.assertEqual(len(problems), len(REQUIRED))
        self.assertIn('backend/CMakeLists.txt', problems[0])

    def test_one_missing_entry_is_reported_exactly(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            for rel in REQUIRED:
                (root / rel).parent.mkdir(parents=True, exist_ok=True)
                (root / rel).touch()
            (root / REQUIRED[0]).unlink()
            problems = check_layout(root)
        self.assertEqual(problems, [f'Missing project file: {REQUIRED[0]}'])


if __name__ == '__main__':
    unittest.main()
