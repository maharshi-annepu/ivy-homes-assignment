import urllib.request
import urllib.parse
import json
import time
import os

API_KEY = 'IVY26-336B8CC469F8'
BASE_URL = 'https://solve.ivy.homes'

os.makedirs('data', exist_ok=True)

def login():
    login_data = json.dumps({'email': 'demo1@ivy.homes', 'password': 'f214f01ed6'}).encode('utf-8')
    req = urllib.request.Request(f'{BASE_URL}/auth/login', data=login_data, headers={'Content-Type': 'application/json', 'x-api-key': API_KEY}, method='POST')
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())

auth = login()
token = auth['access_token']

def fetch_all(endpoint, name):
    global token
    records = []
    offset = 0
    limit = 50
    
    print(f"Starting complete crawl for {endpoint}...")
    while True:
        url = f"{BASE_URL}{endpoint}?limit={limit}&offset={offset}"
        req = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}', 'x-api-key': API_KEY})
        try:
            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            if e.code == 401:
                print("Token expired, refreshing...")
                auth_new = login()
                token = auth_new['access_token']
                continue
            else:
                print(f"Error fetching {url}: HTTP {e.code}")
                break
                
        results = data.get('results', [])
        count = len(results)
        has_more = data.get('has_more', False)
        records.extend(results)
        
        offset += count
        if offset % 500 == 0 or not has_more or count == 0:
            print(f"Progress {endpoint}: offset={offset}, fetched={len(records)}, has_more={has_more}")
            
        if not has_more or count == 0:
            break
            
        time.sleep(0.04) # safe and fast
        
    out_file = f"data/{name}.json"
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(records, f, indent=2, ensure_ascii=False)
    print(f"FINISHED: Saved {len(records)} records to {out_file}\n")
    return records

fetch_all('/v1/listings', 'listings')
fetch_all('/v1/rentals', 'rentals')
fetch_all('/v1/projects', 'projects')

print("All full datasets pulled successfully!")
