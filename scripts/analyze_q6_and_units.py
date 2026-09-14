import json

with open('data/listings.json', 'r', encoding='utf-8') as f:
    listings = json.load(f)

# Find all 2BHK listings where is_live is True
live_2bhk = [l for l in listings if l.get('is_live') is True and l.get('bedroom') == 2]
print(f"Total live 2BHK listings: {len(live_2bhk)}")

# Check websites
web_counts = {}
for l in live_2bhk:
    w = l.get('website')
    web_counts[w] = web_counts.get(w, 0) + 1
print(f"Websites in live 2BHK: {web_counts}")

# Check carpet areas in live 2BHK
mag_2bhk = [l for l in live_2bhk if l.get('website') == 'magichomes']
other_2bhk = [l for l in live_2bhk if l.get('website') != 'magichomes']

print(f"MAG live 2BHK: {len(mag_2bhk)}, Other live 2BHK: {len(other_2bhk)}")
print("MAG live 2BHK carpet areas:", sorted([l['carpet_area'] for l in mag_2bhk]))

# Check if there are any MAG listings where carpet_area < 300
mag_small = [l for l in mag_2bhk if l['carpet_area'] < 300]
print(f"MAG live 2BHK with carpet < 300: {len(mag_small)}")

# Check prices in live 2BHK
prices = sorted([l['price'] for l in live_2bhk])
print(f"Lowest 10 prices in live 2BHK: {prices[:10]}")
print(f"Highest 10 prices in live 2BHK: {prices[-10:]}")
