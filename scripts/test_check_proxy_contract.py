"""Test frontend/backend routing compatibility without starting services."""
import unittest
from pathlib import Path
from check_proxy_contract import check_proxy

ROOT = Path(__file__).resolve().parents[1]
FRONTEND = ROOT / 'frontend'
NGINX = (FRONTEND / 'nginx.conf').read_text(encoding='utf-8')
VITE = (FRONTEND / 'vite.config.ts').read_text(encoding='utf-8')
API = (FRONTEND / 'src/services/api.ts').read_text(encoding='utf-8')


class ProxyContractTests(unittest.TestCase):
    def test_real_proxy_configurations_agree(self):
        self.assertEqual(check_proxy(NGINX, VITE, API), [])

    def test_detects_broken_nginx_upstream(self):
        errors = check_proxy(NGINX.replace('backend:8081', 'other:9999'), VITE, API)
        self.assertTrue(any('nginx API' in e for e in errors))

    def test_detects_vite_port_drift(self):
        errors = check_proxy(NGINX, VITE.replace('127.0.0.1:8081', '127.0.0.1:9999'), API)
        self.assertTrue(any('Vite' in e for e in errors))

    def test_detects_cross_origin_client_change(self):
        errors = check_proxy(NGINX, VITE, API.replace('credentials: "same-origin"', 'credentials: "omit"'))
        self.assertTrue(any('cookies' in e for e in errors))


if __name__ == '__main__':
    unittest.main()
