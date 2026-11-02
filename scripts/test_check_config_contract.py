"""Test public runtime configuration contract and safe error reporting."""
import unittest
from pathlib import Path
from check_config_contract import check_template

TEMPLATE = (Path(__file__).resolve().parents[1] / '.env.example').read_text(encoding='utf-8')


class ConfigContractTests(unittest.TestCase):
    def test_real_template_is_consistent(self):
        self.assertEqual(check_template(TEMPLATE), [])

    def test_detects_duplicate_variable(self):
        errors = check_template(TEMPLATE + '\nDB_PASSWORD=CHANGE_ME\n')
        self.assertTrue(any('Duplicate' in e for e in errors))

    def test_rejects_keys_in_public_template(self):
        errors = check_template(TEMPLATE.replace('LLM_API_KEY=', 'LLM_API_KEY=private-data'))
        self.assertTrue(any('LLM_API_KEY must be empty' in e for e in errors))

    def test_rejects_origin_port_mismatch(self):
        errors = check_template(TEMPLATE.replace('HI_HTTP_PORT=8080', 'HI_HTTP_PORT=9090'))
        self.assertTrue(any('APP_ORIGIN must match' in e for e in errors))

    def test_rejects_missing_keys(self):
        errors = check_template(TEMPLATE.replace('DB_PASSWORD=CHANGE_ME', ''))
        self.assertTrue(any('Missing environment variable: DB_PASSWORD' in e for e in errors))


if __name__ == '__main__':
    unittest.main()
