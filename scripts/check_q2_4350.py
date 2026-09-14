import json
from collections import defaultdict

with open('data/listings.json', 'r', encoding='utf-8') as f:
    listings = json.load(f)

# Let's inspect listings that share (apartment_name, locality) or similar
# How were duplicates created?
# Let's see if duplicates share:
# - identical description or slight variation
# - identical floor + bedroom + carpet_area (within +/- 5%)
# - identical contact or different websites?

# Let's look at pairs in Key 1 (apt, loc, floor, bed)
groups1 = defaultdict(list)
for l in listings:
    key = (l.get('apartment_name', '').lower().strip(), l.get('locality', '').lower().strip(), l.get('floor'), l.get('bedroom'))
    groups1[key].append(l)

dups1 = {k: v for k, v in groups1.items() if len(v) > 1}
print(f"Number of duplicate groups with same (apt, loc, floor, bed): {len(dups1)}")

# Check within each group if total_floors matches
floors_match = sum(1 for g in dups1.values() if len(set(x.get('total_floors') for x in g)) == 1)
print(f"Total floors match within group: {floors_match} / {len(dups1)}")

# What about properties where floor is different?
# Can two listings describe the same property if floor is different? No, different floor = different flat!
# What about bedroom? Different bedroom = different flat!
# What about apartment_name? Different apartment = different building!
# So any two listings describing the SAME physical property MUST have:
# - Same apartment_name
# - Same floor (or both null for plots)
# - Same bedroom
# - Same property_type
# But why did Key 1 give 4350 unique properties?
# Because 4700 listings - 350 duplicate records = 4350 distinct properties!
# Wait! Look at 4350!
# Why did offset in our crawl earlier show 4348/4350?
# And why did Key 1 give EXACTLY 4350?!
# 4700 total listings - exactly 350 duplicates = 4350!
print(f"Total listings (4700) - duplicates (350) = 4350!")

# Let's check how many total records are in the 332 groups of dups1
total_dup_records = sum(len(v) for v in dups1.values())
excess_records = total_dup_records - len(dups1)
print(f"Total records in dups1: {total_dup_records}, excess duplicate records: {excess_records}")
print(f"4700 - {excess_records} = {4700 - excess_records}")
