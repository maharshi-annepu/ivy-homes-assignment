import json

with open('data/listings.json', 'r', encoding='utf-8') as f:
    listings = json.load(f)

# Corrupt listing candidates
floor_anomalies = set(l['listing_id'] for l in listings if l.get('floor') is not None and l.get('total_floors') is not None and l.get('floor') > l.get('total_floors'))
neg_price = set(l['listing_id'] for l in listings if l.get('price', 0) < 0)
carpet_super = set(l['listing_id'] for l in listings if l.get('carpet_area', 0) > l.get('super_built_up_area', 0))
future_posted = set(l['listing_id'] for l in listings if l.get('posted_at', '') > '2026-09-10T00:00:00')
swapped_coords = set(l['listing_id'] for l in listings if l.get('latitude', 0) > 20)
low_price = set(l['listing_id'] for l in listings if 0 < l.get('price', 0) < 1000000)

all_40_corrupt = floor_anomalies | neg_price | carpet_super | future_posted | swapped_coords
print(f"Total in all 5 corrupt groups: {len(all_40_corrupt)}")
print(f"Total fake (low price): {len(low_price)}")

# Check live 2BHK listings
live_2bhk = [l for l in listings if l.get('is_live') is True and l.get('bedroom') == 2]
print(f"Total live 2BHK: {len(live_2bhk)}")

# Exclude candidates
excluded_ids = all_40_corrupt | low_price
valid_2bhk = [l for l in live_2bhk if l['listing_id'] not in excluded_ids]
print(f"Valid live 2BHK after excluding corrupt & fake: {len(valid_2bhk)}")

# Variation 1: Direct price / carpet_area (as raw numbers)
rates_raw = [l['price'] / l['carpet_area'] for l in valid_2bhk]
mean_raw = sum(rates_raw) / len(rates_raw)
print(f"Variation 1 (raw price / carpet): mean = {mean_raw:.2f}")

# Variation 2: With MAG carpet converted to sqft (if carpet < 300)
# 1 sq meter = 10.7639 sqft
rates_converted = []
for l in valid_2bhk:
    c = l['carpet_area']
    if l.get('website') == 'magichomes' and c < 300:
        c_sqft = c * 10.7639104
    else:
        c_sqft = c
    rates_converted.append(l['price'] / c_sqft)

mean_converted = sum(rates_converted) / len(rates_converted)
print(f"Variation 2 (MAG < 300 converted from sqm to sqft): mean = {mean_converted:.2f}")

# Check what the mean is for ONLY non-MAG listings
rates_non_mag = [l['price'] / l['carpet_area'] for l in valid_2bhk if l.get('website') != 'magichomes']
print(f"Non-MAG only: mean = {sum(rates_non_mag) / len(rates_non_mag):.2f}")

# Check what the mean is for MAG listings with converted sqft
rates_mag_converted = []
for l in valid_2bhk:
    if l.get('website') == 'magichomes':
        c = l['carpet_area']
        if c < 300:
            c = c * 10.7639104
        rates_mag_converted.append(l['price'] / c)
print(f"MAG converted only: mean = {sum(rates_mag_converted) / len(rates_mag_converted):.2f}")
