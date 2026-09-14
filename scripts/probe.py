import urllib.request
import urllib.parse
import json
import time

API_KEY = 'IVY26-336B8CC469F8'
BASE_URL = 'https://solve.ivy.homes'

def get_token():
    login_data = json.dumps({'email': 'demo1@ivy.homes', 'password': 'f214f01ed6'}).encode('utf-8')
    req = urllib.request.Request(f'{BASE_URL}/auth/login', data=login_data, headers={'Content-Type': 'application/json', 'x-api-key': API_KEY}, method='POST')
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())

auth_info = get_token()
access_token = auth_info['access_token']
headers = {
    'Authorization': f'Bearer {access_token}',
    'x-api-key': API_KEY
}

def api_get(path, query_params=None):
    url = BASE_URL + path
    if query_params:
        url += '?' + urllib.parse.urlencode(query_params)
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            return e.code, json.loads(body)
        except:
            return e.code, body

def api_post(path, body):
    url = BASE_URL + path
    data = json.dumps(body).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={**headers, 'Content-Type': 'application/json'}, method='POST')
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            return e.code, json.loads(body)
        except:
            return e.code, body

def api_delete(path):
    url = BASE_URL + path
    req = urllib.request.Request(url, headers=headers, method='DELETE')
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            return e.code, json.loads(body)
        except:
            return e.code, body

print("Testing pagination on /v1/listings...")
# Test page=1, page=2 vs offset=0, offset=20
status, res1 = api_get('/v1/listings', {'page': 1, 'limit': 5})
print("With page=1, limit=5:", status, "keys:", list(res1.keys()) if isinstance(res1, dict) else res1)
if isinstance(res1, dict):
    print("offset:", res1.get('offset'), "limit:", res1.get('limit'))

status, res2 = api_get('/v1/listings', {'page': 2, 'limit': 5})
print("With page=2, limit=5:")
if isinstance(res2, dict):
    print("offset:", res2.get('offset'), "limit:", res2.get('limit'))

status, res_off = api_get('/v1/listings', {'offset': 20, 'limit': 5})
print("With offset=20, limit=5:")
if isinstance(res_off, dict):
    print("offset:", res_off.get('offset'), "limit:", res_off.get('limit'))

# Test max limit (documented: max 200)
status, res_lim200 = api_get('/v1/listings', {'limit': 200})
print("With limit=200:", status, "limit returned:", res_lim200.get('limit') if isinstance(res_lim200, dict) else res_lim200)

status, res_lim500 = api_get('/v1/listings', {'limit': 500})
print("With limit=500:", status, "limit returned:", res_lim500.get('limit') if isinstance(res_lim500, dict) else res_lim500)

# Check single listing endpoints:
# Doc: GET /v1/listing/{id}
sample_id = res1['results'][0]['listing_id'] if isinstance(res1, dict) and 'results' in res1 else None
print(f"Sample listing ID: {sample_id}")
if sample_id:
    s_doc, r_doc = api_get(f'/v1/listing/{sample_id}')
    print(f"GET /v1/listing/{sample_id}:", s_doc, r_doc)
    s_plu, r_plu = api_get(f'/v1/listings/{sample_id}')
    print(f"GET /v1/listings/{sample_id}:", s_plu, r_plu)

    # Test comparables
    # Doc says GET /v1/listings/ (Up to ten comparable listings)
    s_comp1, r_comp1 = api_get(f'/v1/listings/{sample_id}/comparables')
    print(f"GET /v1/listings/{sample_id}/comparables:", s_comp1, r_comp1 if s_comp1 != 200 else f"count {len(r_comp1)}")
    s_comp2, r_comp2 = api_get(f'/v1/listings/{sample_id}/similar')
    print(f"GET /v1/listings/{sample_id}/similar:", s_comp2, r_comp2 if s_comp2 != 200 else f"count {len(r_comp2)}")

# Check Favourites vs Saved
print("\nChecking Favourites / Saved endpoints...")
s_fav, r_fav = api_get('/v1/favourites')
print("GET /v1/favourites:", s_fav, r_fav)

s_sav, r_sav = api_get('/v1/saved')
print("GET /v1/saved:", s_sav, r_sav)

# Check Analytics / Insights
print("\nChecking Analytics / Insights endpoints...")
s_ana, r_ana = api_get('/v1/analytics/summary')
print("GET /v1/analytics/summary:", s_ana, r_ana)

for path in ['/v1/insights', '/v1/insights/summary', '/v1/summary', '/analytics/summary', '/insights/summary', '/v1/analytics']:
    s, r = api_get(path)
    if s != 404:
        print(f"FOUND {path}:", s, str(r)[:100])
    else:
        print(f"404 {path}:", r)

# Check Rentals & Projects
print("\nChecking Rentals & Projects...")
s_rent, r_rent = api_get('/v1/rentals', {'limit': 5})
print("GET /v1/rentals:", s_rent, "keys:", list(r_rent.keys()) if isinstance(r_rent, dict) else r_rent)
if isinstance(r_rent, dict) and 'results' in r_rent and len(r_rent['results']) > 0:
    r_id = r_rent['results'][0]['listing_id']
    s_r_single, _ = api_get(f'/v1/rentals/{r_id}')
    print(f"GET /v1/rentals/{r_id}:", s_r_single)
    s_r_singular, _ = api_get(f'/v1/rental/{r_id}')
    print(f"GET /v1/rental/{r_id}:", s_r_singular)

s_proj, r_proj = api_get('/v1/projects', {'limit': 5})
print("GET /v1/projects:", s_proj, "keys:", list(r_proj.keys()) if isinstance(r_proj, dict) else r_proj)
if isinstance(r_proj, dict) and 'results' in r_proj and len(r_proj['results']) > 0:
    p_id = r_proj['results'][0]['project_id']
    s_p_single, _ = api_get(f'/v1/projects/{p_id}')
    print(f"GET /v1/projects/{p_id}:", s_p_single)
    s_p_singular, _ = api_get(f'/v1/project/{p_id}')
    print(f"GET /v1/project/{p_id}:", s_p_singular)
