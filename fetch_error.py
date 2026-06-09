import urllib.request
import urllib.error

req = urllib.request.Request('http://localhost:5174/api/tokens/6/served/', method='POST')
try:
    urllib.request.urlopen(req)
except urllib.error.HTTPError as e:
    print(e.read().decode('utf-8'))
