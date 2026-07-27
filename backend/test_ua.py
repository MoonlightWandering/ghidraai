import os
from dotenv import load_dotenv
import requests

load_dotenv()
api_key = os.environ.get("PARITOK_API_KEY")

resp = requests.post(
    "https://www.paritok.com/api/compress",
    headers={
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "User-Agent": "curl/8.7.1"
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
