import os
import requests

api_key = os.environ.get("PARITOK_API_KEY", "")

try:
    resp = requests.post(
        "https://api.paritok.com/api/compress",  # Note the api subdomain here just to check
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
