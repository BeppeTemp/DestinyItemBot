import requests
import json

#https://www.bungie.net/it/oauth/authorize?response_type=code&client_id=35042&redirect_uri=https://destinyitembot/callback&state=6i0mkLx79Hp91nzWVeHrzHG4

"""
base_oauth_path = "https://www.bungie.net/en/oauth/authorize?"
respone_type = "response_type=code&"
client_id = "client_id=35042&"
redirect_uri = "redirect_uri=https://destinyitembot/callback&"
state = "state=6i0mkLx79Hp91nzWVeHrzHG4"

requests.get(base_oauth_path+respone_type+client_id+redirect_uri+state)
"""


payload = (('client_id', '35042'),
           ('grant_type', 'authorization_code'), 
           ('code', 'b5262a8c2e8302f1b250ff90fa40aa29'))

r = requests.post('https://www.bungie.net/platform/app/oauth/token/', data=payload)
print(r.text)


"""
HEADERS = {"X-API-Key":'f607ba1906f849f09040a3c4a87e0d32'}

r = requests.get("http://www.bungie.net/Platform//User/GetMembershipsById/4392828/1/", headers=HEADERS)
print(r.text)
"""

"""
HEADERS = {"X-API-Key":'f607ba1906f849f09040a3c4a87e0d32'}

r = requests.get("http://www.bungie.net/Platform/Destiny2/1/Profile/4611686018429759726/?components=200", headers=HEADERS)
print(r.text)
"""

"""
HEADERS = {
    "X-API-Key":'f607ba1906f849f09040a3c4a87e0d32',
    "Authorization" : 'CM7vAhKGAgAg16cxKRsOm0DFn2yDWdNQXxSQbJ0vDDTivxWi+c/yuqvgAAAA/a8gIFs/hdV86A0wRNH4gLRcBmTv3EXOmuUE7OXdNSVaO3f9eG+VRHX5DK4LSAlatsOzYbnhjC21HdzM14G4E+Igo9o2hnzPLop7GTelIzuZqZA8+YpDHGt41hJGnXfw3EjOdLUCM3+Yzdtt/vcv5dmcfK7Uux4C5ctqY1MO5rv52WqNIp7/VwF7rs0gv8AM57SfuuqkzHdRWz/jqTYhLUKaDCJMGPfTNUPf6hRWYbpj5Hx7DxDuVQOo4fVaDEAwdyUzlDZgoiVus7bT+K3rATJE+xqm1IrLYCtE+bOfciY='
}

r = requests.get("https://www.bungie.net/Platform/Destiny2/1/Profile/4392828/Character/2305843009278650655/Vendors/672118013/?components=400", headers=HEADERS)
print(r.text)
"""

#Scrittura della risposta ottenuta in un file json
with open("response.json","w") as file:
    json.dump(r.json(),file)



