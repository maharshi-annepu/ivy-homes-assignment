import json
from collections import Counter, defaultdict
import re

with open('data/listings.json', 'r', encoding='utf-8') as f:
    listings = json.load(f)

print("=== Analyzing Phone Numbers and Agents ===")
phone_counts = Counter([l.get('posted_by_contact') for l in listings])
print("Top 10 phone numbers by count:")
for phone, cnt in phone_counts.most_common(10):
    print(f"  {phone}: {cnt}")

print("\n=== Analyzing Descriptions ===")
desc_counts = Counter([l.get('description') for l in listings])
print("Top duplicate descriptions:")
for d, cnt in desc_counts.most_common(10):
    if cnt > 1:
        print(f"  ({cnt}x) {d[:80]}...")

print("\n=== Analyzing Titles / Apartment Names ===")
apt_counts = Counter([l.get('apartment_name') for l in listings])
print("Top apartment names:")
for apt, cnt in apt_counts.most_common(5):
    print(f"  {apt}: {cnt}")

print("\n=== Analyzing Prices ===")
prices = [l['price'] for l in listings if l.get('price') is not None]
prices.sort()
print(f"Min 10 prices: {prices[:10]}")
print(f"Max 10 prices: {prices[-10:]}")

# Check price per sqft distribution
ppsqfts = []
for l in listings:
    p = l.get('price', 0)
    c = l.get('carpet_area', 0)
    if p > 0 and c > 0:
        ppsqfts.append((p / c, l['listing_id'], p, c, l.get('bedroom'), l.get('locality'), l.get('description')))

ppsqfts.sort(key=lambda x: x[0])
print("\nLowest 10 price per sqft:")
for pps, lid, p, c, b, loc, d in ppsqfts[:10]:
    print(f"  {lid}: {pps:.1f} INR/sqft (p={p}, c={c}, b={b}, loc={loc}) desc: {d[:60]}...")

print("\nHighest 10 price per sqft:")
for pps, lid, p, c, b, loc, d in ppsqfts[-10:]:
    print(f"  {lid}: {pps:.1f} INR/sqft (p={p}, c={c}, b={b}, loc={loc}) desc: {d[:60]}...")

# Search for keywords in description: fake, enquiry, lead, call, contact, urgent, etc.
keywords = ['enquir', 'lead', 'fake', 'test', 'sample', 'urgent', 'hot deal', 'offer', 'call now', 'contact us', 'exclusive', 'genuine', 'direct', 'brokerage 0%']
for kw in keywords:
    matches = [l['listing_id'] for l in listings if kw in (l.get('description') or '').lower()]
    print(f"Keyword '{kw}': {len(matches)} matches")

# Let's check posted_by
print("\nposted_by distribution:", Counter([l.get('posted_by') for l in listings]))

# Let's check is_verified
print("is_verified distribution:", Counter([l.get('is_verified') for l in listings]))
