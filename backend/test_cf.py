import os
import requests

api_key = os.environ.get("PARITOK_API_KEY", "")

try:
    resp = requests.post(
        "https://www.paritok.com/api/compress",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "curl/8.7.1",
            "Accept": "*/*"
        },
        json={
            "content": "def add(a,b):\n    return a + b",
            "query": "test query",
            "kind": "file_read"
        },
        timeout=10,
        verify=False
    )
    print("Status:", resp.status_code)
    print("Response:", resp.text)
except Exception as e:
    print("Error:", e)
