import json
import random

def selection(json_string):
    url = json.loads(json_string)
    i = random.choice(url)
    return i
