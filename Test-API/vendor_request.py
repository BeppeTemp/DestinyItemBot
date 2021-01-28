import requests
import json

#interrogazione per ottenere le componenti 400, 401, 402 dell'armaiolo
HEADERS = {
    "X-API-Key":'f607ba1906f849f09040a3c4a87e0d32',
    "Authorization" : 'Bearer CLbvAhKGAgAgTLtk3K/tJKojdfkNHX1yvnw5a+hW0v6yb4V7DgrgqJPgAAAAXx2iPFjQS3ewnObn2ZDSlcwTYXVeKcGQcMCb3ymFIC2ei/bcMZzOhG2j6NTldIvPTMpvtDgCPUFyvp5paRKOSWGG5EvSS68NRcGrnf+psan/sNwJQ0z9Un/Ivg29Ct9DYEfuaMFubzuykbzTmV5zKYaXaSKr0G/F9XhIROOU4uLBBBlZgNcVZfbYwwdMdbXcw7dW7qDSUl2yCQT1NtWn/j7xNC56jxYpuU45Cvfwvud//janQBY5uIyXWD/HeMSjMFaMcyaOnWC91OvW00lNGrAwD61wljBGeuen47m9vjI='
}

r = requests.get("https://www.bungie.net/Platform/Destiny2/1/Profile/4611686018429759726/Character/2305843009278650655/Vendors/672118013/?components=400,401,402", headers=HEADERS)
print(r.text)


#Scrittura della risposta ottenuta in un file json
with open("vendor.json","w") as file:
    json.dump(r.json(),file)