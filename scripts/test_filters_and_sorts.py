import sys, os
import json
sys.path.append(os.getcwd())
from scripts.probe import api_get

def test_listing_filters():
    print("=== Testing Filters on /v1/listings ===")
    
    # 1. Base count
    _, base = api_get('/v1/listings', {'limit': 10})
    base_first = base['results'][0]['listing_id']
    
    # 2. locality
    _, loc_res = api_get('/v1/listings', {'locality': 'whitefield', 'limit': 10})
    locs = [x['locality'] for x in loc_res['results']]
    print(f"Filter locality='whitefield': all match? {all(l == 'whitefield' for l in locs)}, distinct localities: {set(locs)}")
    
    # 3. bhk
    _, bhk_res = api_get('/v1/listings', {'bhk': 2, 'limit': 10})
    bhks = [x['bedroom'] for x in bhk_res['results']]
    print(f"Filter bhk=2: all match? {all(b == 2 for b in bhks)}, distinct bedrooms: {set(bhks)}")

    # 4. property_type
    _, pt_res = api_get('/v1/listings', {'property_type': 'villa', 'limit': 10})
    pts = [x['property_type'] for x in pt_res['results']]
    print(f"Filter property_type='villa': all match? {all(p == 'villa' for p in pts)}, distinct property_types: {set(pts)}")

    # 5. min_price
    _, minp_res = api_get('/v1/listings', {'min_price': 20000000, 'limit': 10})
    minps = [x['price'] for x in minp_res['results']]
    print(f"Filter min_price=20000000: all >= min? {all(p >= 20000000 for p in minps)}, min price seen: {min(minps) if minps else None}")

    # 6. max_price
    _, maxp_res = api_get('/v1/listings', {'max_price': 5000000, 'limit': 10})
    maxps = [x['price'] for x in maxp_res['results']]
    print(f"Filter max_price=5000000: all <= max? {all(p <= 5000000 for p in maxps)}, max price seen: {max(maxps) if maxps else None}")

    # 7. furnishing
    _, furn_res = api_get('/v1/listings', {'furnishing': 'fully-furnished', 'limit': 10})
    furns = [x['furnishing'] for x in furn_res['results']]
    print(f"Filter furnishing='fully-furnished': all match? {all(f == 'fully-furnished' for f in furns)}, distinct furnishings: {set(furns)}")

    print("\n=== Testing Sorting on /v1/listings ===")
    for sort_col in ['price', 'carpet_area', 'posted_at', 'bedroom']:
        for ord_dir in ['asc', 'desc']:
            _, s_res = api_get('/v1/listings', {'sort_by': sort_col, 'order': ord_dir, 'limit': 10})
            vals = [x.get(sort_col) for x in s_res['results']]
            print(f"sort_by={sort_col}, order={ord_dir}: first 5 values = {vals[:5]}")

if __name__ == '__main__':
    test_listing_filters()
