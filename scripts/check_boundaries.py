import json
import sys
import os
sys.path.append(os.getcwd())
from scripts.probe import api_get

print("Checking boundary on /v1/listings...")
for off in [4300, 4340, 4345, 4348, 4350, 4400]:
    s, r = api_get('/v1/listings', {'offset': off, 'limit': 50})
    if isinstance(r, dict):
        res = r.get('results', [])
        first_id = res[0]['listing_id'] if res else None
        last_id = res[-1]['listing_id'] if res else None
        print(f"offset={off}: total={r.get('total')}, count={r.get('count')}, has_more={r.get('has_more')}, len(results)={len(res)}, first={first_id}, last={last_id}")
    else:
        print(f"offset={off}: status={s}, resp={r}")

print("\nChecking boundary on /v1/rentals...")
for off in [1700, 1750, 1758, 1800]:
    s, r = api_get('/v1/rentals', {'offset': off, 'limit': 50})
    if isinstance(r, dict):
        res = r.get('results', [])
        print(f"offset={off}: total={r.get('total')}, count={r.get('count')}, has_more={r.get('has_more')}, len(results)={len(res)}")

print("\nChecking boundary on /v1/projects...")
for off in [400, 450, 481, 500]:
    s, r = api_get('/v1/projects', {'offset': off, 'limit': 50})
    if isinstance(r, dict):
        res = r.get('results', [])
        print(f"offset={off}: total={r.get('total')}, count={r.get('count')}, has_more={r.get('has_more')}, len(results)={len(res)}")
