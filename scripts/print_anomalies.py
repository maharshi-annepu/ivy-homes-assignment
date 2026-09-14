import json

with open('data/listings.json', 'r', encoding='utf-8') as f:
    listings = json.load(f)

by_id = {l['listing_id']: l for l in listings}

floor_anomalies = [l['listing_id'] for l in listings if l.get('floor') is not None and l.get('total_floors') is not None and l.get('floor') > l.get('total_floors')]
neg_price = [l['listing_id'] for l in listings if l.get('price', 0) < 0]
carpet_super = [l['listing_id'] for l in listings if l.get('carpet_area', 0) > l.get('super_built_up_area', 0)]
future_posted = [l['listing_id'] for l in listings if l.get('posted_at', '') > '2026-09-10T00:00:00']
swapped_coords = [l['listing_id'] for l in listings if l.get('latitude', 0) > 20]
low_price = [l['listing_id'] for l in listings if 0 < l.get('price', 0) < 1000000]

print("1. floor > total_floors:")
for lid in sorted(floor_anomalies):
    l = by_id[lid]
    print(f"  {lid}: floor={l['floor']}/{l['total_floors']}, apt={l['apartment_name']}, bed={l['bedroom']}, is_live={l['is_live']}")

print("\n2. negative price:")
for lid in sorted(neg_price):
    l = by_id[lid]
    print(f"  {lid}: price={l['price']}, bed={l['bedroom']}, is_live={l['is_live']}")

print("\n3. carpet > super_built:")
for lid in sorted(carpet_super):
    l = by_id[lid]
    print(f"  {lid}: carpet={l['carpet_area']} > super={l['super_built_up_area']}, bed={l['bedroom']}, is_live={l['is_live']}")

print("\n4. future posted_at:")
for lid in sorted(future_posted):
    l = by_id[lid]
    print(f"  {lid}: posted_at={l['posted_at']}, is_live={l['is_live']}")

print("\n5. swapped coordinates:")
for lid in sorted(swapped_coords):
    l = by_id[lid]
    print(f"  {lid}: lat={l['latitude']}, lon={l['longitude']}, loc={l['locality']}, is_live={l['is_live']}")

print("\n6. low price (price entered as rate):")
for lid in sorted(low_price):
    l = by_id[lid]
    print(f"  {lid}: price={l['price']}, carpet={l['carpet_area']}, bed={l['bedroom']}, is_live={l['is_live']}")
