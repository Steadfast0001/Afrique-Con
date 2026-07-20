import json
import time
from freezegun import freeze_time

import pytest

from app import main as gateway_main


def test_ttl_expiry_with_freezegun(monkeypatch):
    # Use the real cache helpers but with a fake redis client
    class SimpleRedis:
        def __init__(self):
            self.store = {}
            self.expiry = {}

        def set(self, key, value, ex=None):
            self.store[key] = value
            if ex is not None:
                self.expiry[key] = int(time.time()) + int(ex)

        def get(self, key):
            exp = self.expiry.get(key)
            if exp is not None and time.time() >= exp:
                self.store.pop(key, None)
                self.expiry.pop(key, None)
                return None
            return self.store.get(key)

        def scan_iter(self, match=None):
            for k in list(self.store.keys()):
                if not match or (match.endswith("*") and k.startswith(match[:-1])):
                    yield k

        def delete(self, key):
            if key in self.store:
                del self.store[key]
                self.expiry.pop(key, None)
                return 1
            return 0

        def expire(self, key, seconds):
            if key in self.store:
                self.expiry[key] = int(time.time()) + int(seconds)
                return True
            return False

    fake = SimpleRedis()
    monkeypatch.setattr(gateway_main, "get_redis_client", lambda: fake)

    # freeze time at t0
    with freeze_time("2026-07-10T00:00:00"):
        key = gateway_main.make_search_key("A", "B", "2026-07-10T00:00:00")
        payload = {"results": [{"journey_id": "j1", "departure_at": "2026-07-10T01:00:00"}]}
        gateway_main.cache_search_results(key, payload, ttl=60)
        # immediately available
        assert gateway_main.get_cached_search(key) == payload

    # advance time by 61 seconds — cache should expire
    with freeze_time("2026-07-10T00:01:01"):
        assert gateway_main.get_cached_search(key) is None
