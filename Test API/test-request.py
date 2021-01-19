import requests
import json

#https://www.bungie.net/it/oauth/authorize?response_type=code&client_id=35042&redirect_uri=https://destinyitembot/callback&state=6i0mkLx79Hp91nzWVeHrzHG4
#Chiamata per ottenere il codice da inviar eper ottenere l'access token
"""
base_oauth_path = "https://www.bungie.net/en/oauth/authorize?"
respone_type = "response_type=code&"
client_id = "client_id=35042&"
redirect_uri = "redirect_uri=https://destinyitembot/callback&"
state = "state=6i0mkLx79Hp91nzWVeHrzHG4"

requests.get(base_oauth_path+respone_type+client_id+redirect_uri+state)
"""
#Chiamata per ottenere l'access token e l'id
"""
payload = (('client_id', '35042'),
           ('grant_type', 'authorization_code'), 
           ('code', 'b5262a8c2e8302f1b250ff90fa40aa29'))

r = requests.post('https://www.bungie.net/platform/app/oauth/token/', data=payload)
print(r.text)
"""
#Chiamata per ottenere l'id di una determinata piattaforma
"""
HEADERS = {"X-API-Key":'f607ba1906f849f09040a3c4a87e0d32'}

r = requests.get("http://www.bungie.net/Platform//User/GetMembershipsById/4392828/1/", headers=HEADERS)
print(r.text)
"""
#Chiamata per ottenere l'id di un personaggio
"""
HEADERS = {"X-API-Key":'f607ba1906f849f09040a3c4a87e0d32'}

r = requests.get("http://www.bungie.net/Platform/Destiny2/1/Profile/4611686018429759726/?components=200", headers=HEADERS)
print(r.text)
"""

#Scrittura della risposta ottenuta in un file json
with open("response.json","w") as file:
    json.dump(r.json(),file)



