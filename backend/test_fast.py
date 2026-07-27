import requests
import time
import os

api_key = "pk_live_K2qP93k1JqHADycSo1O2pX7U_EdvMWQy"

print("Testing direct fast API payload...")
start = time.time()
try:
    resp = requests.post(
        "https://www.paritok.com/api/compress",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        },
        json={
            "content": "int main() { return 0; }",
            "query": "find vulns",
            "kind": "file_read"
        },
        timeout=30
    )
    print(f"Time taken: {time.time() - start:.2f}s")
    print("Status:", resp.status_code)
    print("Response:", resp.text)
except Exception as e:
    print("Error:", e)
