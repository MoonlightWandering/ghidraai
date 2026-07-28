import requests
import time

api_key = "pk_live_K2qP93k1JqHADycSo1O2pX7U_EdvMWQy"

code = """
undefined8 main(int param_1,long param_2)

{
  if (param_1 < 2) {
    _printf("Usage: %s <input_string>\n",*(undefined8 *)param_2);
    return 1;
  }
  _printf("Starting application...\n");
  process_input(*(undefined8 *)(param_2 + 8));
  _printf("Application finished cleanly.\n");
  return 0;
}
"""

print("Sending payload...")
try:
    resp = requests.post(
        "https://www.paritok.com/api/compress",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        },
        json={
            "content": code,
            "query": "find vulns",
            "kind": "file_read"
        },
        timeout=120
    )
    print("Status:", resp.status_code)
    print("Response:", resp.text)
except Exception as e:
    print("Error:", e)
