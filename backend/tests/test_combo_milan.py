"""
Backend tests for Combo Milan (spare-parts compatibility API).
Covers: /meta, /groups CRUD + confirm, /models, /submissions, /admin/verify.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL") or "https://combo-milan.preview.emergentagent.com"
BASE_URL = BASE_URL.rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- Meta ---------------------------------------------------------------
class TestMeta:
    def test_meta_returns_9_categories_and_6_brand_groups(self, api_client):
        r = api_client.get(f"{API}/meta", timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "categories" in data and "brandGroups" in data
        assert len(data["categories"]) == 9
        assert len(data["brandGroups"]) == 6
        # tempered-glass has curve-glass sub
        tg = next((c for c in data["categories"] if c["id"] == "tempered-glass"), None)
        assert tg is not None
        subs = tg.get("subCategories", [])
        assert any(s["key"] == "curve-glass" for s in subs)
        # required brand groups
        expected = {
            "Redmi/Poco", "Vivo/iQoo", "Realme/Oppo/OnePlus",
            "Samsung", "Itel/Tecno/Infinix", "Lava/Micromax/Moto",
        }
        assert expected.issubset(set(data["brandGroups"]))


# --- Admin Verify -------------------------------------------------------
class TestAdminVerify:
    def test_correct_passcode_returns_true(self, api_client):
        r = api_client.post(f"{API}/admin/verify", json={"passcode": "4321"}, timeout=15)
        assert r.status_code == 200
        assert r.json() == {"ok": True}

    def test_wrong_passcode_returns_false(self, api_client):
        r = api_client.post(f"{API}/admin/verify", json={"passcode": "0000"}, timeout=15)
        assert r.status_code == 200
        assert r.json() == {"ok": False}


# --- Groups (main + curve-glass sub) + Confirm --------------------------
class TestGroups:
    created_ids = []

    def test_groups_list_ok(self, api_client):
        r = api_client.get(f"{API}/groups", timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_create_main_group(self, api_client):
        payload = {
            "categoryId": "battery",
            "subCategory": None,
            "brandGroup": "Redmi/Poco",
            "models": ["TEST_Redmi Note 10", "TEST_Poco M3"],
            "source": "TEST_source",
            "status": "verified",
        }
        r = api_client.post(f"{API}/groups", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        doc = r.json()
        assert doc["id"]
        assert doc["categoryId"] == "battery"
        assert doc["subCategory"] is None
        assert doc["brandGroup"] == "Redmi/Poco"
        assert doc["models"] == ["TEST_Redmi Note 10", "TEST_Poco M3"]
        assert doc["source"] == "TEST_source"
        assert doc["status"] == "verified"
        assert doc["confirmCount"] == 0
        assert "_id" not in doc
        TestGroups.created_ids.append(doc["id"])

        # GET verify persistence
        r2 = api_client.get(f"{API}/groups", timeout=15)
        assert any(g["id"] == doc["id"] for g in r2.json())

    def test_create_curve_glass_subcategory_group(self, api_client):
        payload = {
            "categoryId": "tempered-glass",
            "subCategory": "curve-glass",
            "brandGroup": "Samsung",
            "models": ["TEST_S21 Ultra", "TEST_S22 Ultra"],
            "source": None,
            "status": "unconfirmed",
        }
        r = api_client.post(f"{API}/groups", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        doc = r.json()
        assert doc["subCategory"] == "curve-glass"
        assert doc["status"] == "unconfirmed"
        TestGroups.created_ids.append(doc["id"])

    def test_create_group_empty_models_400(self, api_client):
        payload = {
            "categoryId": "battery",
            "subCategory": None,
            "brandGroup": "Samsung",
            "models": ["  ", ""],
            "status": "unconfirmed",
        }
        r = api_client.post(f"{API}/groups", json=payload, timeout=15)
        assert r.status_code == 400

    def test_confirm_increments_and_persists(self, api_client):
        assert TestGroups.created_ids, "prior create test must run first"
        gid = TestGroups.created_ids[0]
        # baseline
        groups = api_client.get(f"{API}/groups", timeout=15).json()
        before = next(g for g in groups if g["id"] == gid)["confirmCount"]

        r = api_client.post(f"{API}/groups/{gid}/confirm", timeout=15)
        assert r.status_code == 200
        assert r.json()["confirmCount"] == before + 1

        r2 = api_client.post(f"{API}/groups/{gid}/confirm", timeout=15)
        assert r2.json()["confirmCount"] == before + 2

        # persisted on list
        groups2 = api_client.get(f"{API}/groups", timeout=15).json()
        final = next(g for g in groups2 if g["id"] == gid)["confirmCount"]
        assert final == before + 2

    def test_confirm_unknown_group_404(self, api_client):
        r = api_client.post(f"{API}/groups/does-not-exist-xyz/confirm", timeout=15)
        assert r.status_code == 404


# --- Models -------------------------------------------------------------
class TestModels:
    def test_create_model(self, api_client):
        payload = {"name": "TEST_Redmi Note 12", "brand": "Redmi"}
        r = api_client.post(f"{API}/models", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["name"] == "TEST_Redmi Note 12"
        assert d["brand"] == "Redmi"
        assert d["id"]
        assert "_id" not in d


# --- Submissions --------------------------------------------------------
class TestSubmissions:
    def test_create_and_list_submission(self, api_client):
        payload = {
            "modelName": "TEST_Redmi Note 11",
            "category": "battery",
            "claimedCompatibleModels": "TEST_Poco M4",
            "notes": "TEST_correction note",
        }
        r = api_client.post(f"{API}/submissions", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        s = r.json()
        assert s["modelName"] == "TEST_Redmi Note 11"
        assert s["status"] == "pending"
        sid = s["id"]

        r2 = api_client.get(f"{API}/submissions", timeout=15)
        assert r2.status_code == 200
        assert any(x["id"] == sid for x in r2.json())
