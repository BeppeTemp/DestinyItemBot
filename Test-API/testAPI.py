import requests
import json

#interrogazione per ottenere le componenti 400, 401, 402 dell'armaiolo
HEADERS = {
    "X-API-Key":'f607ba1906f849f09040a3c4a87e0d32',
    "Authorization": 'Bearer CPL5AhKGAgAg2GBLVzbrHfxl6kbgmUJ5cBfizVEEZ3UvPW3PS2w7RTHgAAAApApW5D7um3g6dQXKr7HZCNjxD8HwGv+mkb2Yygm9Zf/bWNald4N8YURr0g3a09Wl2JetkGQB7Swkv9hvbv4csU4wm/cQuAb3xaJygV10Pa0fTrFeMbwQR+hdEFMqKHDFCH43JYVmNGDcgVfcgUTt+ym1UMbQc2lF76t/UHUaPrRj/jk5zK+5QHodiwJdtjb7+/dWDhibzf+BMXRnWPdYwFmzr1XWfUACltQENUMgq9TEN/HFNxV8q1Kx0Y0pey2LKKtSe1ilG4+5L69Whdai0dNdqtSMXX6/vO0nOlBT+c4='
}

r = requests.get("https://www.bungie.net/Platform/Destiny2/1/Profile/4611686018429759726/?components=102,201,300", headers=HEADERS)

print(r)

#Scrittura della risposta ottenuta in un file json
with open("vendor.json","w") as file:
    json.dump(r.json(),file)