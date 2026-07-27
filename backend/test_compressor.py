import requests
import time

api_key = "pk_live_K2qP93k1JqHADycSo1O2pX7U_EdvMWQy"

start = time.time()
try:
    resp = requests.post(
        "https://www.paritok.com/api/compress",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "content": "void main() { char buf[10]; gets(buf); }",
            "query": "Find vulnerabilities in this code",
            "kind": "file_read"
        },
        timeout=120
    )
    print(f"Time taken: {time.time() - start:.2f}s")
    print("Status:", resp.status_code)
    print("Response:", resp.text)
except Exception as e:
    print("Error:", e)
