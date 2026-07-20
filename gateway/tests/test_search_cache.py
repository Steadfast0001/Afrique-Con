import json
import datetime

import pytest

from app import main as gateway_main


class FakeRedis:
    def __init__(self):
        self.store = {}
        # store expiry as unix timestamp (int)
        self.expiry = {}

    def set(self, key, value, ex=None):
        self.store[key] = value
        if ex is not None:
            import time
            self.expiry[key] = int(time.time()) + int(ex)
        else:
            self.expiry.pop(key, None)

    def get(self, key):
        import time
        exp = self.expiry.get(key)
        if exp is not None and time.time() >= exp:
            # expired
            self.store.pop(key, None)
            self.expiry.pop(key, None)
            return None
        return self.store.get(key)

    def delete(self, key):
        if key in self.store:
            del self.store[key]
            self.expiry.pop(key, None)
            return 1
        return 0

    def scan_iter(self, match=None):
        # very simple glob-like match for prefix "search:index:"
        for k in list(self.store.keys()):
            if not match:
                yield k
            elif match.endswith("*") and k.startswith(match[:-1]):
                yield k

    def expire(self, key, seconds):
        import time
        if key in self.store:
            self.expiry[key] = int(time.time()) + int(seconds)
            return True
        return False


@pytest.fixture(autouse=True)
def patch_redis(monkeypatch):
    fake = FakeRedis()
    monkeypatch.setattr(gateway_main, "get_redis_client", lambda: fake)
    yield fake


def test_cache_store_and_retrieve(patch_redis):
    key = gateway_main.make_search_key("A", "B", "2026-07-10T00:00:00")
    payload = {"results": [{"journey_id": "j1", "departure_at": "2026-07-10T01:00:00"}]}
    gateway_main.cache_search_results(key, payload, ttl=1234)

    cached = gateway_main.get_cached_search(key)
    assert cached == payload
    # ensure expiry timestamp set equals now+ttl (approx)
    import time
    exp = patch_redis.expiry.get(key)
    assert exp is not None
    assert abs(exp - (int(time.time()) + 1234)) <= 2


def test_invalidate_search_cache_for_journey(patch_redis):
    # create two keys, one referencing journey j-x
    key1 = gateway_main.make_search_key("X", "Y", "2026-07-10")
    key2 = gateway_main.make_search_key("X", "Z", "2026-07-10")
    payload1 = {"results": [{"journey_id": "journey-123", "departure_at": "2026-07-11T01:00:00"}]}
    payload2 = {"results": [{"journey_id": "other-1", "departure_at": "2026-07-11T03:00:00"}]}

    gateway_main.cache_search_results(key1, payload1)
    gateway_main.cache_search_results(key2, payload2)

    deleted = gateway_main.invalidate_search_cache_for_journey("journey-123")
    assert deleted >= 1
    assert gateway_main.get_cached_search(key1) is None
    # other key should remain
    assert gateway_main.get_cached_search(key2) == payload2


def test_cache_default_ttl_used(patch_redis):
    key = gateway_main.make_search_key("A", "B", "2026-07-10")
    payload = {"results": []}
    gateway_main.cache_search_results(key, payload)
    # ensure expiry timestamp set equals now+DEFAULT_SEARCH_TTL (approx)
    import time
    exp = patch_redis.expiry.get(key)
    assert exp is not None
    assert abs(exp - (int(time.time()) + gateway_main.DEFAULT_SEARCH_TTL)) <= 2


def test_cache_expiry(patch_redis):
    key = gateway_main.make_search_key("A", "B", "2026-07-10T00:00:00")
    payload = {"results": [{"journey_id": "j1", "departure_at": "2026-07-10T01:00:00"}]}
    # set with ex=0 -> immediate expiry
    patch_redis.set(key, json.dumps(payload), ex=0)
    assert gateway_main.get_cached_search(key) is None


def test_refresh_near_term_jobs_once(patch_redis):
    # create a key with a near-term departure
    from datetime import datetime, timedelta
    date = (datetime.utcnow() + timedelta(hours=1)).isoformat()
    key = gateway_main.make_search_key("A", "B", date)
    payload = {"results": [{"journey_id": "j-refresh", "departure_at": date}]}
    # set with a short ttl
    patch_redis.set(key, json.dumps(payload), ex=10)
    # ensure ttl is short
    import time
    before = patch_redis.expiry.get(key)
    # call the single-pass refresh
    import asyncio
    touched = asyncio.run(gateway_main.refresh_near_term_jobs_once())
    assert touched >= 1
    after = patch_redis.expiry.get(key)
    assert after > before
