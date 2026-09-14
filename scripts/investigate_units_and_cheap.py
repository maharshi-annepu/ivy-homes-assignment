import json
from collections import Counter

with open('data/listings.json', 'r', encoding='utf-8') as f:
    listings = json.load(f)

# 1. Investigate MAG- website and areas
mag_listings = [l for l in listings if l.get('website') == 'magichomes']
other_listings = [l for l in listings if l.get('website') != 'magichomes']

print(f"Total MAG listings: {len(mag_listings)}, Other listings: {len(other_listings)}")

mag_carpet = [l.get('carpet_area') for l in mag_listings if l.get('carpet_area')]
other_carpet = [l.get('carpet_area') for l in other_listings if l.get('carpet_area')]

print(f"MAG carpet_area: min={min(mag_carpet)}, median={sorted(mag_carpet)[len(mag_carpet)//2]}, max={max(mag_carpet)}")
print(f"Other carpet_area: min={min(other_carpet)}, median={sorted(other_carpet)[len(other_carpet)//2]}, max={max(other_carpet)}")

# Check 2 BHK carpet areas by website
by_web_2bhk = {}
for l in listings:
    if l.get('bedroom') == 2:
        w = l.get('website')
        if w not in by_web_2bhk:
            by_web_2bhk[w] = []
        by_web_2bhk[w].append(l.get('carpet_area'))

for w, areas in by_web_2bhk.items():
    print(f"Website {w} 2BHK carpet: min={min(areas)}, median={sorted(areas)[len(areas)//2]}, max={max(areas)}")

# 2. Check prices < 1,000,000
cheap = [l for l in listings if 0 < l.get('price', 0) < 1000000]
print(f"\nTotal listings with 0 < price < 1,000,000: {len(cheap)}")
for c in cheap:
    print(f"  {c['listing_id']}: price={c['price']}, carpet={c['carpet_area']}, super={c['super_built_up_area']}, bed={c['bedroom']}, loc={c['locality']}, website={c['website']}, desc={c['description']}")

# 3. Check what else might be fake
# Could fake listings have suspiciously round prices, or specific agent contact, or description?
# Let's inspect phone numbers that have unusually high or low prices, or listings with specific flags
