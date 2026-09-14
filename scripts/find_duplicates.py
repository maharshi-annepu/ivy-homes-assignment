import json
from collections import Counter, defaultdict

with open('data/listings.json', 'r', encoding='utf-8') as f:
    listings = json.load(f)

print(f"Total listings: {len(listings)}")

# Check duplicate websites, URLs, apartment_name, locality, coordinates, floors, prices
# In Indian property portals, multiple brokers or websites list the SAME physical property!
# What attributes uniquely identify a physical property?
# 1. (apartment_name, floor, bedroom) or (apartment_name, floor, total_floors, bedroom, bathroom)?
# 2. Exact coordinates (latitude, longitude)?
# 3. (latitude, longitude, floor)?
# 4. (apartment_name, locality, bedroom, floor, carpet_area)?
# 5. Let's inspect pairs of listings that share properties!

coords_count = Counter([(round(l.get('latitude', 0), 5), round(l.get('longitude', 0), 5)) for l in listings])
print(f"Unique exact (lat, lon) pairs: {len(coords_count)}")

# Check how many distinct coordinates
print(f"Top coordinates frequencies: {coords_count.most_common(5)}")

# Let's check (latitude, longitude, floor)
coord_floor = Counter([(round(l.get('latitude', 0), 5), round(l.get('longitude', 0), 5), l.get('floor')) for l in listings])
print(f"Unique (lat, lon, floor): {len(coord_floor)}")

# Let's check (apartment_name, locality, bedroom, floor)
apt_loc_bed_floor = Counter([(l.get('apartment_name', '').lower().strip(), l.get('locality', '').lower().strip(), l.get('bedroom'), l.get('floor')) for l in listings])
print(f"Unique (apt, loc, bed, floor): {len(apt_loc_bed_floor)}")

# Let's check (apartment_name, floor, carpet_area)
apt_floor_area = Counter([(l.get('apartment_name', '').lower().strip(), l.get('floor'), l.get('carpet_area')) for l in listings])
print(f"Unique (apt, floor, carpet_area): {len(apt_floor_area)}")

# Let's inspect some groups with count > 1
print("\n--- Inspecting potential duplicate property groups ---")
# Group by (apartment_name, locality, floor, bedroom)
groups = defaultdict(list)
for l in listings:
    key = (l.get('apartment_name', '').lower().strip(), l.get('locality', '').lower().strip(), l.get('floor'), l.get('bedroom'))
    groups[key].append(l)

dup_groups = [g for g in groups.values() if len(g) > 1]
print(f"Groups with >1 listing by (apt, loc, floor, bed): {len(dup_groups)}, total records in these groups: {sum(len(g) for g in dup_groups)}")

# Inspect sample dup group
for g in dup_groups[:5]:
    print("\nDuplicate group:")
    for l in g:
        print(f"  ID: {l['listing_id']} | Web: {l['website']} | Price: {l['price']} | Carpet: {l['carpet_area']} | Super: {l['super_built_up_area']} | Contact: {l['posted_by_contact']} | Live: {l['is_live']}")
