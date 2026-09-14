import json
from collections import Counter

with open('data/listings.json', 'r', encoding='utf-8') as f:
    listings = json.load(f)

with open('data/projects.json', 'r', encoding='utf-8') as f:
    projects = json.load(f)

all_counts = Counter([l.get('project_id') for l in listings if l.get('project_id')])
live_counts = Counter([l.get('project_id') for l in listings if l.get('project_id') and l.get('is_live') is True])

diff_all = []
diff_live = []

matches_all = 0
matches_live = 0

for p in projects:
    pid = p['project_id']
    rep = p.get('total_listings', 0)
    act_all = all_counts.get(pid, 0)
    act_live = live_counts.get(pid, 0)
    
    if rep == act_all:
        matches_all += 1
    else:
        diff_all.append((pid, rep, act_all))
        
    if rep == act_live:
        matches_live += 1
    else:
        diff_live.append((pid, rep, act_live))

print(f"Total projects: {len(projects)}")
print(f"Matches all listings: {matches_all}, Mismatches all: {len(diff_all)}")
print(f"Matches live listings: {matches_live}, Mismatches live: {len(diff_live)}")

print("\nSample where rep == act_live (first 10):")
sample_live_matches = [p for p in projects if p.get('total_listings', 0) == live_counts.get(p['project_id'], 0)][:10]
for p in sample_live_matches:
    pid = p['project_id']
    print(f"  {pid}: reported={p.get('total_listings')}, act_live={live_counts.get(pid, 0)}, act_all={all_counts.get(pid, 0)}")

print("\nSample where rep != act_live (first 10):")
for pid, rep, act_l in diff_live[:10]:
    print(f"  {pid}: reported={rep}, act_live={act_l}, act_all={all_counts.get(pid, 0)}")
