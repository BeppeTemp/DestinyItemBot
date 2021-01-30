import requests
import json

#interrogazione per ottenere le componenti 400, 401, 402 dell'armaiolo
HEADERS = {
    "X-API-Key":'f607ba1906f849f09040a3c4a87e0d32'
}

r = requests.get("https://www.bungie.net/common/destiny2_content/json/it/DestinyVendorDefinition-28e06178-b2e8-420e-99ca-311865aaf5f0.json", headers=HEADERS)

#Scrittura della risposta ottenuta in un file json
with open("vendor.json","w") as file:
    json.dump(r.json(),file)