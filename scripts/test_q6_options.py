import json

with open('data/listings.json', 'r', encoding='utf-8') as f:
    listings = json.load(f)

floor_anom = set(l['listing_id'] for l in listings if l.get('floor') is not None and l.get('total_floors') is not None and l.get('floor') > l.get('total_floors'))
neg_price = set(l['listing_id'] for l in listings if l.get('price', 0) < 0)
carpet_super = set(l['listing_id'] for l in listings if l.get('carpet_area', 0) > l.get('super_built_up_area', 0))
swapped_coords = set(l['listing_id'] for l in listings if l.get('latitude', 0) > 20)
future_posted = set(l['listing_id'] for l in listings if l.get('posted_at', '') > '2026-09-10T00:00:00')

low_price_q9 = set(l['listing_id'] for l in listings if 0 < l.get('price', 0) < 1000000)

live_2bhk = [l for l in listings if l.get('is_live') is True and l.get('bedroom') == 2]

def calc_q6(excluded, convert_mag=True):
    sub = [l for l in live_2bhk if l['listing_id'] not in excluded]
    rates = []
    for l in sub:
        c = l['carpet_area']
        if convert_mag and l.get('website') == 'magichomes' and c < 300:
            c = c * 10.7639104
        rates.append(l['price'] / c)
    return sum(rates) / len(rates), len(sub)

print(f"Total live 2BHK: {len(live_2bhk)}")

# Test various combinations of Q4
options = [
    ("Floor only (8)", floor_anom),
    ("Floor + Carpet (16)", floor_anom | carpet_super),
    ("Floor + Carpet + NegPrice (24)", floor_anom | carpet_super | neg_price),
    ("Floor + Carpet + NegPrice + SwappedCoords (32)", floor_anom | carpet_super | neg_price | swapped_coords),
    ("All 5 groups (40)", floor_anom | carpet_super | neg_price | swapped_coords | future_posted),
    ("NegPrice only (8)", neg_price),
]

print("\nWith MAG sqm converted to sqft:")
for name, q4_set in options:
    excl = q4_set | low_price_q9
    mean_val, count = calc_q6(excl, convert_mag=True)
    print(f"  Q4 = {name}: count={count}, Q6 mean = {mean_val:.2f}")

print("\nWithout MAG sqm conversion (raw):")
for name, q4_set in options:
    excl = q4_set | low_price_q9
    mean_val, count = calc_q6(excl, convert_mag=False)
    print(f"  Q4 = {name}: count={count}, Q6 mean = {mean_val:.2f}")
