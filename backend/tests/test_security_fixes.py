"""
Security-fix verification tests for Combo Milan (SEC-001, SEC-002, SEC-003).
Covers:
- SEC-001: X-Admin-Passcode enforcement on POST /groups and POST /models
- Public-by-design endpoints: confirm, submissions, GETs
- SEC-003: per-IP rate limiting (429 after 60 req/min)
NOTE: TestRateLimit runs LAST (alphabetical class order is not guaranteed, so the
rate-limit test class is named to sort last AND placed last in file). The rate
limiter buckets per-IP across ALL rate-limited endpoints, so this test must be
the final one in the suite to avoid poisoning other tests.
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL")
assert BASE_URL, "EXPO_PUBLIC_BACKEND_URL must be set"
BASE_URL = BASE_URL.rstrip("/")
API = f"{BASE_URL}/api"
ADMIN = "4321"

GROUP_PAYLOAD = {
    "categoryId": "battery",
    "subCategory": None,
    "brandGroup": "Redmi/Poco",
    "models": ["TEST_SEC_Group A", "TEST_SEC_Group B"],
    "source": "TEST_sec",
    "status": "unconfirmed",
}


@pytest.fixture(scope="module")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- SEC-001: POST /groups requires admin passcode ----------------------
class TestGroupsAdminAuth:
    created_id = None

    def test_create_group_no_header_403(self, api_client):
        r = api_client.post(f"{API}/groups", json=GROUP_PAYLOAD, timeout=15)
        assert r.status_code == 403, f"expected 403, got {r.status_code}: {r.text}"

    def test_create_group_wrong_passcode_403(self, api_client):
        r = api_client.post(
            f"{API}/groups",
            json=GROUP_PAYLOAD,
            headers={"X-Admin-Passcode": "9999"},
            timeout=15,
        )
        assert r.status_code == 403, f"expected 403, got {r.status_code}: {r.text}"
        assert "Invalid admin passcode" in r.text

    def test_create_group_empty_passcode_403(self, api_client):
        r = api_client.post(
            f"{API}/groups",
            json=GROUP_PAYLOAD,
            headers={"X-Admin-Passcode": ""},
            timeout=15,
        )
        assert r.status_code == 403

    def test_create_group_cannot_self_verify_without_auth(self, api_client):
        # Attempt to self-mark 'verified' without passcode must be rejected
        payload = dict(GROUP_PAYLOAD, status="verified")
        r = api_client.post(f"{API}/groups", json=payload, timeout=15)
        assert r.status_code == 403

    def test_create_group_correct_passcode_200(self, api_client):
        r = api_client.post(
            f"{API}/groups",
            json=GROUP_PAYLOAD,
            headers={"X-Admin-Passcode": ADMIN},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        doc = r.json()
        assert doc["id"]
        assert doc["models"] == ["TEST_SEC_Group A", "TEST_SEC_Group B"]
        assert "_id" not in doc
        TestGroupsAdminAuth.created_id = doc["id"]
        # persistence check
        groups = api_client.get(f"{API}/groups", timeout=15).json()
        assert any(g["id"] == doc["id"] for g in groups)

    def test_created_group_reported_for_cleanup(self, api_client):
        # Always passes; surfaces created TEST_ ids in output for cleanup
        print(f"\nTEST group id created: {TestGroupsAdminAuth.created_id}")
        assert True


# --- SEC-001: POST /models requires admin passcode ----------------------
class TestModelsAdminAuth:
    def test_create_model_no_header_403(self, api_client):
        r = api_client.post(
            f"{API}/models",
            json={"name": "TEST_SEC_Model", "brand": "TEST"},
            timeout=15,
        )
        assert r.status_code == 403, f"expected 403, got {r.status_code}: {r.text}"

    def test_create_model_wrong_passcode_403(self, api_client):
        r = api_client.post(
            f"{API}/models",
            json={"name": "TEST_SEC_Model", "brand": "TEST"},
            headers={"X-Admin-Passcode": "0000"},
            timeout=15,
        )
        assert r.status_code == 403

    def test_create_model_correct_passcode_200(self, api_client):
        r = api_client.post(
            f"{API}/models",
            json={"name": "TEST_SEC_Model X", "brand": "TEST_SEC"},
            headers={"X-Admin-Passcode": ADMIN},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["name"] == "TEST_SEC_Model X"
        assert "_id" not in d


# --- Public-by-design endpoints must keep working -----------------------
class TestPublicEndpoints:
    def test_get_groups_public_200(self, api_client):
        r = api_client.get(f"{API}/groups", timeout=20)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_get_meta_public_200(self, api_client):
        r = api_client.get(f"{API}/meta", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "categories" in data and "brandGroups" in data

    def test_submission_public_200(self, api_client):
        r = api_client.post(
            f"{API}/submissions",
            json={
                "modelName": "TEST_SEC_Submission",
                "category": "battery",
                "claimedCompatibleModels": "TEST_SEC_A = TEST_SEC_B",
                "notes": "TEST_sec note",
            },
            timeout=15,
        )
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "pending"

    def test_confirm_public_works(self, api_client):
        # pick any existing group (real data, read-only increment on a TEST group preferred)
        groups = api_client.get(f"{API}/groups", timeout=20).json()
        target = next(
            (g for g in groups if g.get("source") == "TEST_sec"), groups[0]
        )
        gid = target["id"]
        before = target["confirmCount"]
        r = api_client.post(f"{API}/groups/{gid}/confirm", timeout=15)
        assert r.status_code == 200, r.text
        assert r.json()["confirmCount"] == before + 1


# --- SEC-003: rate limiting (MUST RUN LAST — poisons per-IP bucket) -----
class TestZZRateLimit:
    def test_confirm_rate_limited_after_60_per_min(self, api_client):
        groups = api_client.get(f"{API}/groups", timeout=20).json()
        target = next(
            (g for g in groups if g.get("source") == "TEST_sec"), groups[0]
        )
        gid = target["id"]
        statuses = []
        for _ in range(70):
            r = api_client.post(f"{API}/groups/{gid}/confirm", timeout=15)
            statuses.append(r.status_code)
            if r.status_code == 429:
                break
        assert 429 in statuses, (
            f"expected 429 after >60 rapid confirms from same IP, got statuses: "
            f"{statuses[:5]}... total={len(statuses)}"
        )
        ok_count = statuses.count(200)
        # earlier tests in this run consumed a few rate-limit slots
        assert ok_count <= 60, f"more than 60 requests succeeded: {ok_count}"
        print(f"\nRate limit hit after {ok_count} successful confirms in this run")
