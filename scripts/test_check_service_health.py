"""Health probe tests using synthetic HTTP responses only."""
import io
import json
import unittest
from unittest.mock import patch
from check_service_health import validate_origin, check_health


class FakeResponse:
    status = 200
    def __init__(self, body):
        self.data = io.BytesIO(body)
    def read(self, amount=-1):
        return self.data.read(amount)
    def __enter__(self):
        return self
    def __exit__(self, *args):
        return False


class HealthTests(unittest.TestCase):
    def test_allows_localhost_only(self):
        self.assertEqual(validate_origin('http://localhost:8080/'), 'http://localhost:8080')
        self.assertEqual(validate_origin('http://127.0.0.1:8080'), 'http://127.0.0.1:8080')

    def test_rejects_remote_and_unsafe_urls(self):
        for url in ('https://example.com:443', 'http://192.168.1.2:8080',
                    'http://localhost:8080/secret', 'http://localhost'):
            with self.subTest(url=url), self.assertRaises(ValueError):
                validate_origin(url)

    @patch('check_service_health.urllib.request.urlopen')
    def test_healthy_frontend_and_backend(self, open_url):
        open_url.side_effect = [FakeResponse(b'{"status":"ok"}'),
                                FakeResponse(b'<!doctype html><html>HI</html>')]
        self.assertEqual(check_health('http://localhost:8080'), [])
        self.assertEqual(open_url.call_count, 2)

    @patch('check_service_health.urllib.request.urlopen')
    def test_detects_unhealthy_backend(self, open_url):
        open_url.side_effect = [FakeResponse(b'{"status":"down"}'),
                                FakeResponse(b'<html>HI</html>')]
        self.assertTrue(any('Backend' in e for e in check_health('http://localhost:8080')))

    @patch('check_service_health.urllib.request.urlopen')
    def test_detects_frontend_regression(self, open_url):
        open_url.side_effect = [FakeResponse(b'{"status":"ok"}'),
                                FakeResponse(b'{"not":"html"}')]
        self.assertTrue(any('Frontend' in e for e in check_health('http://localhost:8080')))


if __name__ == '__main__':
    unittest.main()
