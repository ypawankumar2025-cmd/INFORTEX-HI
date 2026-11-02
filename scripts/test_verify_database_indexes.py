
import unittest
from unittest.mock import patch
import verify_database_indexes as vi


VALID_OUTPUT = (
    "notifications|notifications_user_created|"
    "CREATE INDEX notifications_user_created "
    "ON public.notifications USING btree "
    "(user_id, created_at DESC)\n"
    "comments|comments_project_created|"
    "CREATE INDEX comments_project_created "
    "ON public.comments USING btree "
    "(project_id, created_at DESC)\n"
)


class TestDatabaseIndexes(unittest.TestCase):

    @patch.object(vi.subprocess, "run")
    def test_valid_indexes(self, run):
        run.return_value.stdout = VALID_OUTPUT
        self.assertEqual(vi.main(), 0)
        self.assertEqual(
            run.call_args.kwargs["timeout"], 30
        )

    @patch.object(vi.subprocess, "run")
    def test_missing_index(self, run):
        run.return_value.stdout = (
            VALID_OUTPUT.splitlines()[0] + "\n"
        )
        self.assertEqual(vi.main(), 1)

    @patch.object(vi.subprocess, "run")
    def test_wrong_index_definition(self, run):
        run.return_value.stdout = VALID_OUTPUT.replace(
            "created_at DESC", "created_at ASC", 1
        )
        self.assertEqual(vi.main(), 1)

    @patch.object(vi.subprocess, "run")
    def test_invalid_database_output(self, run):
        run.return_value.stdout = "invalid output\n"
        self.assertEqual(vi.main(), 1)

    @patch.object(vi.subprocess, "run")
    def test_database_command_failure(self, run):
        run.side_effect = vi.subprocess.CalledProcessError(
            1, ["docker"]
        )
        self.assertEqual(vi.main(), 1)

    @patch.object(vi.subprocess, "run")
    def test_database_timeout(self, run):
        run.side_effect = vi.subprocess.TimeoutExpired(
            ["docker"], 30
        )
        self.assertEqual(vi.main(), 1)


if __name__ == "__main__":
    unittest.main()
