"""Docker contract unit tests; no Docker daemon needed."""
import copy
import unittest
from check_compose_contract import check_services

VALID = {
    'services': {
        'db': {'healthcheck': {'test': ['CMD','pg_isready']}, 'volumes': [
            {'type': 'volume', 'target': '/var/lib/postgresql/data', 'source': 'postgres_data'}]},
        'backend': {'depends_on': {'db': {'condition': 'service_healthy'}},
                    'environment': {'DATABASE_URL': 'postgresql://hi@db:5432/hi'}},
        'frontend': {'depends_on': {'backend': {'condition': 'service_healthy'}},
                     'ports': [{'host_ip': '127.0.0.1', 'target': 80, 'published': '8080'}]},
    }
}


class ComposeContractTests(unittest.TestCase):
    def test_safe_compose_graph(self):
        self.assertEqual(check_services(VALID), [])

    def test_missing_backend(self):
        bad = copy.deepcopy(VALID)
        del bad['services']['backend']
        self.assertTrue(any('backend' in e for e in check_services(bad)))

    def test_exposed_database_port(self):
        bad = copy.deepcopy(VALID)
        bad['services']['db']['ports'] = [{'published':'5432','target':5432}]
        self.assertTrue(any('must not expose' in e for e in check_services(bad)))

    def test_public_frontend_binding(self):
        bad = copy.deepcopy(VALID)
        bad['services']['frontend']['ports'][0]['host_ip'] = '0.0.0.0'
        self.assertTrue(any('host-loopback' in e for e in check_services(bad)))

    def test_missing_health_dependency(self):
        bad = copy.deepcopy(VALID)
        bad['services']['backend']['depends_on']['db']['condition'] = 'service_started'
        self.assertTrue(any('healthy PostgreSQL' in e for e in check_services(bad)))

    def test_missing_persistence_volume(self):
        bad = copy.deepcopy(VALID)
        bad['services']['db']['volumes'] = []
        self.assertTrue(any('persistent' in e for e in check_services(bad)))


if __name__ == '__main__':
    unittest.main()
