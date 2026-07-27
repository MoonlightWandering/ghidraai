import requests
import os
import time

api_key = os.environ.get("PARITOK_API_KEY", "")
print("Using Key:", repr(api_key))

start = time.time()
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
print("Time:", time.time() - start)
