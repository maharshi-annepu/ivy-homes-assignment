import json
from collections import Counter, defaultdict

with open('data/listings.json', 'r', encoding='utf-8') as f:
    listings = json.load(f)

# Group 1: floor > total_floors
floor_anomalies = [l['listing_id'] for l in listings if l.get('floor') is not None and l.get('total_floors') is not None and l.get('floor') > l.get('total_floors')]

# Group 2: negative price
neg_price = [l['listing_id'] for l in listings if l.get('price', 0) < 0]

# Group 3: carpet > super_built
carpet_super = [l['listing_id'] for l in listings if l.get('carpet_area', 0) > l.get('super_built_up_area', 0)]

# Group 4: future posted_at
future_posted = [l['listing_id'] for l in listings if l.get('posted_at', '') > '2026-09-10T00:00:00']

# Group 5: swapped lat/lon (lat > 20)
swapped_coords = [l['listing_id'] for l in listings if l.get('latitude', 0) > 20]

# Group 6: price < 100000 (price per sqft entered as price)
low_price = [l['listing_id'] for l in listings if 0 < l.get('price', 0) < 1000000]

# Group 7: bathroom > bedroom + 3 or weird?
# Let's check bathrooms, balconies, total_floors, bedrooms
baths = [l['listing_id'] for l in listings if l.get('bathroom', 0) > l.get('bedroom', 0) + 2]
print(f"bath > bed + 2: {len(baths)}")

# Let's check bedroom == 0
zero_bed = [l['listing_id'] for l in listings if l.get('bedroom') == 0]
print(f"bedroom == 0: {len(zero_bed)}")

# Let's check bathroom == 0
zero_bath = [l['listing_id'] for l in listings if l.get('bathroom') == 0]
print(f"bathroom == 0: {len(zero_bath)}")

# Let's check total_floors <= 0
zero_floors = [l['listing_id'] for l in listings if l.get('total_floors', 0) <= 0]
print(f"total_floors <= 0: {len(zero_floors)}")

# Let's check if there are listings with missing fields
missing_fields = defaultdict(list)
for l in listings:
    for k in ['apartment_name', 'locality', 'property_type', 'bedroom', 'bathroom', 'price', 'carpet_area', 'latitude', 'longitude', 'posted_by', 'posted_by_contact']:
        if l.get(k) is None:
            missing_fields[k].append(l['listing_id'])
for k, v in missing_fields.items():
    print(f"missing {k}: {len(v)}")

print("\nSummary of detected groups:")
print(f"1. floor > total_floors: {len(floor_anomalies)}")
print(f"2. negative price: {len(neg_price)}")
print(f"3. carpet > super_built: {len(carpet_super)}")
print(f"4. future posted_at: {len(future_posted)}")
print(f"5. swapped coordinates: {len(swapped_coords)}")
print(f"6. low price (price entered as rate): {len(low_price)}")

# Let's check MAG- carpet areas that are in sq meters
mag_sqm = [l['listing_id'] for l in listings if l.get('website') == 'magichomes' and l.get('carpet_area', 0) < 300]
print(f"7. MAG- carpet_area < 300 (sqm instead of sqft): {len(mag_sqm)}")

# Let's check duplicate properties (Question 2)
# How many records describe the same physical property?
