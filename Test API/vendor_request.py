import requests
import json

#interrogazione per ottenere le componenti 400, 401, 402 dell'armaiolo
HEADERS = {
    "X-API-Key":'f607ba1906f849f09040a3c4a87e0d32',
    "Authorization" : 'Bearer CMXvAhKGAgAgHGOrdgdVJHkvE9388mAeNtRsidCE4zm/2vZHBTLp2CHgAAAAyqmjzf5bARfzJJkte5z2cUBTiZy9cCLBJ5CKriF/ZusfZFJpzf7Yl7T2L5544gbiBzeVyoTp+mmdwQOco4xZjfeuv74EV7U9pThMj/LCyaHMbpcC28Px9Q4TuJNFHroXyVsmKYFvgGPlTyjw+3aZRzcOH6+F0QGEAsom83Xe6TqLnt4iCNwHKEn8yrP4hTFQvL2VFzK/Lswtf5YUoYHh3dHnab0Uny84oyNy10AlJcyTEiFIU68G4l/XEVl7DaN0BlNgcql9Mtg3G4At84WIdKTmlybJg3dt7NzHZVYI8gk='
}

r = requests.get("https://www.bungie.net/Platform/Destiny2/1/Profile/4611686018429759726/Character/2305843009278650655/Vendors/672118013/?components=400,401,402", headers=HEADERS)
print(r.text)


#Scrittura della risposta ottenuta in un file json
with open("vendor.json","w") as file:
    json.dump(r.json(),file)