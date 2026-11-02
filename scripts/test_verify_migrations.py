
import unittest
from unittest.mock import patch
import verify_migrations as vm


class TestMigrationVerification(unittest.TestCase):

    def test_all_migrations_match(self):
        with patch.object(vm, "local_versions", return_value=["001", "002", "003"]), \
             patch.object(vm, "database_versions", return_value=["001", "002", "003"]):
            self.assertEqual(vm.main(), 0)

    def test_missing_migration(self):
        with patch.object(vm, "local_versions", return_value=["001", "002", "003"]), \
             patch.object(vm, "database_versions", return_value=["001", "002"]):
            self.assertEqual(vm.main(), 1)

    def test_unknown_migration(self):
        with patch.object(vm, "local_versions", return_value=["001", "002"]), \
             patch.object(vm, "database_versions", return_value=["001", "002", "999"]):
            self.assertEqual(vm.main(), 1)

    def test_duplicate_local_versions(self):
        with patch.object(vm, "local_versions", return_value=["001", "001"]), \
             patch.object(vm, "database_versions", return_value=["001"]):
            self.assertEqual(vm.main(), 1)

    def test_duplicate_database_versions(self):
        with patch.object(vm, "local_versions", return_value=["001", "002"]), \
             patch.object(vm, "database_versions", return_value=["001", "001", "002"]):
            self.assertEqual(vm.main(), 1)

    def test_no_local_migrations(self):
        with patch.object(vm, "local_versions", return_value=[]):
            self.assertEqual(vm.main(), 1)

    def test_database_connection_failure(self):
        with patch.object(vm, "local_versions", return_value=["001"]), \
             patch.object(vm, "database_versions", side_effect=OSError("Database unavailable")):
            self.assertEqual(vm.main(), 1)


if __name__ == "__main__":
    unittest.main()