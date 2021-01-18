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

"""
payload = (('client_id', '35042'),
           ('grant_type', 'authorization_code'), 
           ('code', '995b2e707c00e4a7cca7dbe51bd311ac'))

r = requests.post('https://www.bungie.net/platform/app/oauth/token/', data=payload)
print(r.text)
"""

HEADERS = {"X-API-Key":'f607ba1906f849f09040a3c4a87e0d32'}

r = requests.get("http://www.bungie.net/Platform/Destiny/1/Account/4392828/Summary/", headers=HEADERS)
print(r.text)

"""
HEADERS = {"X-API-Key":'f607ba1906f849f09040a3c4a87e0d32'}

r = requests.get("https://www.bungie.net/Platform//Destiny2/1/Profile/4392828/Character/{characterId}/Vendors/672118013/", headers=HEADERS)
print(r.text)
"""

#Scrittura della risposta ottenuta in un file json
with open("response.json","w") as file:
    json.dump(r.json(),file)