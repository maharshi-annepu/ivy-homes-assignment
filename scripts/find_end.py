import sys, os
sys.path.append(os.getcwd())
from scripts.probe import api_get

def test_end(endpoint, start_offset):
    print(f"=== Testing end of {endpoint} from {start_offset} ===")
    offset = start_offset
    while True:
        s, r = api_get(endpoint, {'offset': offset, 'limit': 50})
        if not isinstance(r, dict):
            print(f"Non-dict response at {offset}: {s}, {r}")
            break
        count = r.get('count', 0)
        has_more = r.get('has_more', False)
        total = r.get('total')
        print(f"offset={offset}: count={count}, has_more={has_more}, total={total}")
        if not has_more or count == 0:
            print(f"End reached at offset={offset} + {count} = {offset + count}")
            break
        offset += count

test_end('/v1/listings', 4340)
test_end('/v1/rentals', 1750)
test_end('/v1/projects', 450)
