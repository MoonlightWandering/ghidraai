import requests

api_key = "pk_live_K2qP93k1JqHADycSo1O2pX7U_EdvMWQy"

try:
    resp = requests.post(
        "https://www.paritok.com/api/compress",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        },
        json={
            "content": "def test(): pass",
            "query": "find vulns",
            "kind": "file_read"
        },
        timeout=30
    )
    print("Status:", resp.status_code)
    print("Response:", resp.text)
except Exception as e:
    print("Error:", e)
