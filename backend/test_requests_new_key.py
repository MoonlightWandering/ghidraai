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
            "content": "def add(a,b):\n    return a + b",
            "query": "test query",
            "kind": "file_read"
        },
        timeout=10
    )
    print("Status:", resp.status_code)
    print("Response:", resp.text)
except Exception as e:
    print("Error:", e)
