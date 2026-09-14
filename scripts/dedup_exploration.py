import json
from collections import Counter, defaultdict

with open('data/listings.json', 'r', encoding='utf-8') as f:
    listings = json.load(f)

# Total listings = 4700
# Let's test different deduplication keys

# 1. (apartment_name, locality, floor, bedroom)
# Note: What about carpet area or unit?
# If apartment has no apartment_name, or what if floor is null?
k1 = Counter([(l.get('apartment_name', '').lower().strip(), l.get('locality', '').lower().strip(), l.get('floor'), l.get('bedroom')) for l in listings])
print(f"Key 1 (apt, loc, floor, bed): {len(k1)}")

# 2. (apartment_name, floor, bedroom, carpet_area bucket?)
# Earlier we saw in duplicate groups:
# DWE-1004037: Carpet 1152, ZER-1003310: Carpet 1149 (slightly different carpet area on different portals!)
# Price also slightly different (10140000 vs 10170000)
# But they had identical (apartment_name, locality, floor, bedroom)!

# 3. What if floor is None or plot?
# For plots, floor is None or 0, bedroom is 0
# What about (apartment_name, locality, bedroom, bathroom, floor)?
k3 = Counter([(l.get('apartment_name', '').lower().strip(), l.get('locality', '').lower().strip(), l.get('bedroom'), l.get('bathroom'), l.get('floor')) for l in listings])
print(f"Key 3 (apt, loc, bed, bath, floor): {len(k3)}")

# 4. What about latitude, longitude rounded to 3 or 4 decimals?
# In India, building coordinates on portals can be slightly perturbed or same building.
# If coordinates rounded to 4 decimals + floor + bedroom:
k4 = Counter([(round(l.get('latitude', 0), 4), round(l.get('longitude', 0), 4), l.get('floor'), l.get('bedroom')) for l in listings])
print(f"Key 4 (lat4, lon4, floor, bed): {len(k4)}")

# 5. What if (apartment_name, locality, bedroom)?
k5 = Counter([(l.get('apartment_name', '').lower().strip(), l.get('locality', '').lower().strip(), l.get('bedroom')) for l in listings])
print(f"Key 5 (apt, loc, bed): {len(k5)}")

# 6. What about (apartment_name, floor)?
k6 = Counter([(l.get('apartment_name', '').lower().strip(), l.get('floor')) for l in listings])
print(f"Key 6 (apt, floor): {len(k6)}")

# 7. What about (apartment_name, bedroom, carpet bucket)?
# 8. Let's inspect listings in the same apartment_name:
apt_groups = defaultdict(list)
for l in listings:
    apt_groups[l.get('apartment_name', '').lower().strip()].append(l)

# Let's see how many listings per apartment_name
print(f"Total distinct apartment_names: {len(apt_groups)}")

# Let's inspect an apartment with multiple listings
sample_apt = [g for g in apt_groups.values() if len(g) >= 10][0]
print(f"\nSample apartment '{sample_apt[0].get('apartment_name')}' has {len(sample_apt)} listings:")
for l in sample_apt:
    print(f"  ID: {l['listing_id']} | Floor: {l.get('floor')}/{l.get('total_floors')} | Bed: {l.get('bedroom')} | Bath: {l.get('bathroom')} | Carpet: {l.get('carpet_area')} | Price: {l.get('price')} | Web: {l.get('website')}")
