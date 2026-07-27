import requests
import time

api_key = "pk_live_K2qP93k1JqHADycSo1O2pX7U_EdvMWQy"

try:
    print("Sending request with new key... (waiting up to 120s)")
    start = time.time()
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
        timeout=120
    )
    print(f"Time taken: {time.time() - start:.2f}s")
    print("Status:", resp.status_code)
    print("Response:", resp.text)
except Exception as e:
    print("Error:", e)
