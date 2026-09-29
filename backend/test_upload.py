import requests
import json

with open('sample_reports/WCR_WELL_B.pdf', 'rb') as f:
    files = {'file': f}
    r = requests.post('http://localhost:8000/api/reports/upload', files=files)
    print(r.json())
