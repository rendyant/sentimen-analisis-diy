import requests

url = "http://localhost:8000/auth/login"
payload = {
    "email": "rendyant2305@gmail.com",
    "password": "Reant2305"
}

print("Mengirim request beruntun untuk memicu rate limit...")
for i in range(1, 25):
    response = requests.post(url, json=payload)
    print(f"Request ke-{i}: Status Code -> {response.status_code}")
    if response.status_code == 429:
        print("\nSUCCESS: Rate limiter aktif! Melebihi batas 20 request/menit.")
        break