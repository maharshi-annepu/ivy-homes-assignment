import urllib.request
import urllib.parse
import json

API_KEY = 'IVY26-336B8CC469F8'
BASE_URL = 'https://solve.ivy.homes'

def login():
    login_data = json.dumps({'email': 'demo1@ivy.homes', 'password': 'f214f01ed6'}).encode('utf-8')
    req = urllib.request.Request(f'{BASE_URL}/auth/login', data=login_data, headers={'Content-Type': 'application/json', 'x-api-key': API_KEY}, method='POST')
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())

auth = login()
token = auth['access_token']
headers = {'Authorization': f'Bearer {token}', 'x-api-key': API_KEY, 'Content-Type': 'application/json'}

def req(method, path, body=None):
    data = json.dumps(body).encode('utf-8') if body else None
    r = urllib.request.Request(f'{BASE_URL}{path}', data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        body_text = e.read().decode('utf-8')
        try:
            return e.code, json.loads(body_text)
        except:
            return e.code, body_text

sample_id = 'MAG-1002627'
print("1. POST /v1/saved with {'id': sample_id}")
print(req('POST', '/v1/saved', {'id': sample_id}))

print("2. POST /v1/saved with {'listing_id': sample_id}")
print(req('POST', '/v1/saved', {'listing_id': sample_id}))

print("3. GET /v1/saved")
print(req('GET', '/v1/saved'))

print(f"4. DELETE /v1/saved/{sample_id}")
print(req('DELETE', f'/v1/saved/{sample_id}'))

print("5. GET /v1/saved")
print(req('GET', '/v1/saved'))

# Refresh
print("\n6. POST /auth/refresh")
r_data = json.dumps({'refresh_token': auth['refresh_token']}).encode('utf-8')
req_ref = urllib.request.Request(f'{BASE_URL}/auth/refresh', data=r_data, headers={'Content-Type': 'application/json', 'x-api-key': API_KEY}, method='POST')
try:
    with urllib.request.urlopen(req_ref) as resp:
        print(resp.status, json.loads(resp.read().decode('utf-8')))
except urllib.error.HTTPError as e:
    print(e.code, e.read().decode('utf-8'))
