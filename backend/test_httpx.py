import os
import httpx
from dotenv import load_dotenv

load_dotenv()
api_key = os.environ.get("PARITOK_API_KEY")

try:
    with httpx.Client(http2=True, timeout=15) as client:
        resp = client.post(
            "https://www.paritok.com/api/compress",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "content": "def add(a,b):\n    return a + b",
                "query": "test query",
                "kind": "file_read"
            }
        )
        print("Status:", resp.status_code)
        print("Response:", resp.text)
except Exception as e:
    print("Error:", e)
