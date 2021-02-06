const axios = require("axios");
const qs = require("qs");
const { CosmosClient } = require("@azure/cosmos");

const path = require('path');
const dotenv = require('dotenv');
const ENV_FILE = path.join(__dirname, '../.env');
dotenv.config({ path: ENV_FILE });

class BungieRequester {
    constructor() {
        this.basePath = process.env.BungieBasePath;
        this.baseLoginPath = process.env.BungieBaseLoginPath;
        this.apiKey = process.env.BungieApiKey;
        this.clientId = process.env.BungieClientId;
        this.clientSecret = process.env.BungieClientSecret;
        this.callBack = process.env.BungieCallBack;
        this.state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    //Generazione del link per il login
    loginlink() {
        var responseType = "response_type=code&";
        var callBackUri = "redirect_uri=" + this.callBack + "&";
        var state = "state=" + this.state;
        return this.baseLoginPath + responseType + "client_id=" + this.clientId + "&" + callBackUri + state;
    }

    //Ottiene il nome utente del giocatore loggato
    async getName(membershipId, membershipType) {
        const name = await axios.get(this.basePath + '/User/GetMembershipsById/' + membershipId + '/' + membershipType + '/', {
            headers: {
                "X-API-Key": this.apiKey
            }
        })
            .then(result => {
                return result.data.Response.destinyMemberships[0].LastSeenDisplayName;
            }).catch(error => {
                console.log(error.data);
            });

        return name;
    }

    //Recupera i dati di accesso
    async getAccessData(code) {
        var res = {
            error: 0,
            access_token: null,
            token_type: null,
            expires_in: null,
            refresh_token: null,
            refresh_expires_in: null,
            membership_id: null
        }
        const data = {
            client_id: this.clientId,
            grant_type: "authorization_code",
            code: code,
            client_secret: this.clientSecret
        }
        await axios.post(this.basePath + '/app/oauth/token/', qs.stringify(data))
            .then(result => {
                res.access_token = result.data.access_token;
                res.token_type = result.data.token_type;
                res.expires_in = result.data.expires_in;
                res.refresh_token = result.data.refresh_token;
                res.refresh_expires_in = result.data.refresh_expires_in;
                res.membership_id = result.data.membership_id;
            }).catch(error => {
                res.error = 1;
                console.log(error.response.data);
            });
        return res;
    }

    //Aggiorna l'access token
    async refreshAccessData(oldcode) {
        var res = {
            error: 0,
            access_token: null,
            token_type: null,
            expires_in: null,
            refresh_token: null,
            refresh_expires_in: null,
            membership_id: null
        }
        const data = {
            client_id: this.clientId,
            grant_type: "refresh_token",
            refresh_token: oldcode,
            client_secret: this.clientSecret
        }
        await axios.post(this.basePath + '/app/oauth/token/', qs.stringify(data))
            .then(result => {
                res.access_token = result.data.access_token;
                res.token_type = result.data.token_type;
                res.expires_in = result.data.expires_in;
                res.refresh_token = result.data.refresh_token;
                res.refresh_expires_in = result.data.refresh_expires_in;
                res.membership_id = result.data.membership_id;
            }).catch(error => {
                res.error = 1;
                console.log(error.response.data);
            });
        return res;
    }

    //Recupera il Platform_Id
    async getPlatformID(membershipId, membershipType) {
        return await axios.get(this.basePath + '/User/GetMembershipsById/' + membershipId + '/' + membershipType + '/', {
            headers: {
                "X-API-Key": this.apiKey
            }
        })
            .then(result => {
                return result.data.Response.primaryMembershipId;
            }).catch(error => {
                console.log(error.data);
            });
    }

    //Recupera il Character_Id
    async getCharacterId(membershipPlatformId, membershipType, character) {
        return await axios.get(this.basePath + '/Destiny2/' + membershipType + '/' + 'Profile/' + membershipPlatformId + '/?components=100', {
            headers: {
                "X-API-Key": this.apiKey
            }
        })
            .then(result => {
                return result.data.Response.profile.data.characterIds[character];
            }).catch(error => {
                console.log(error.data);
            });
    }

    //Verifica se le mod sono già state acquistate dall'account
    async checkMod(membershipPlatformId, membershipType, items) {
        var checkList = await axios.get(this.basePath + '/Destiny2/' + membershipType + '/Profile/' + membershipPlatformId + '/?components=800', {
            headers: {
                "X-API-Key": this.apiKey,
            }
        })
            .then(result => {
                return result.data.Response.profileCollectibles.data.collectibles;
            }).catch(error => {
                console.log(error);
            });
        const check = [checkList[items[0].collectibleHash].state, checkList[items[1].collectibleHash].state];
        return check;
    }

    //Ritorna le mod in vendita del armaiolo
    async getGunsmith(accessdata, membershipType, character) {
        var membershipPlatformId = await this.getPlatformID(await accessdata.membership_id, membershipType);
        var characterId = await this.getCharacterId(await membershipPlatformId, membershipType, character);
        var mods = await axios.get(this.basePath + '/Destiny2/' + membershipType + '/Profile/' + membershipPlatformId + '/Character/' + characterId + '/Vendors/' + process.env.Gunsmith + '/?components=402', {
            headers: {
                "X-API-Key": this.apiKey,
                "Authorization": accessdata.token_type + " " + accessdata.access_token
            }
        })
            .then(result => {
                var mods = {
                    error: 0,
                    first: result.data.Response.sales.data[Object.keys(result.data.Response.sales.data)[2]],
                    second: result.data.Response.sales.data[Object.keys(result.data.Response.sales.data)[3]]
                }
                return mods;
            }).catch(error => {
                console.log(error);
                var mods = {
                    error: 1,
                    first: null,
                    second: null
                }
                return mods;
            });

        if (mods.error == 0) {
            const querySpec = { query: "SELECT * from c WHERE c.id=\"" + mods.first.itemHash + "\" OR c.id=\"" + mods.second.itemHash + "\"" };
            const DbSettings = {
                endpoint: process.env.EndPoint,
                key: process.env.Key
            }
            const client = new CosmosClient(DbSettings);
            const database = client.database(process.env.DataBaseId);
            const container = database.container(process.env.ContainerId);
            const { resources: items } = await container.items.query(querySpec).fetchAll();
            const check = await this.checkMod(membershipPlatformId, membershipType, items);
            var mod = {
                error: 0,
                modOne: {
                    name: items[0].displayProperties.name,
                    type: items[0].itemTypeDisplayName,
                    image: "https://www.bungie.net/" + items[0].displayProperties.icon,
                    have: {
                        text: "(Non acquistata)",
                        color: "attention"
                    }
                },
                modTwo: {
                    name: items[1].displayProperties.name,
                    type: items[1].itemTypeDisplayName,
                    image: "https://www.bungie.net/" + items[1].displayProperties.icon,
                    have: {
                        text: "(Non acquistata)",
                        color: "attention"
                    }
                }
            }
            if (check[0] == 64) {
                mod.modOne.have.text = "(Già acquistata)";
                mod.modOne.have.color = "good";
            }
            if (check[1] == 64) {
                mod.modTwo.have.text = "(Già acquistata)";
                mod.modTwo.have.color = "good";
            }
        } else {
            var mod = {
                error: 1,
                modOne: {
                    name: null,
                    type: null,
                    image: null,
                    have: {
                        text: null,
                        color: null
                    }
                },
                modTwo: {
                    name: null,
                    type: null,
                    image: null,
                    have: {
                        text: null,
                        color: null
                    }
                }
            }
        }
        return mod;
    }

    //Ritorna i materiali in vendita dal ragno
    async getSpider(accessdata, membershipType, character) {
        var membershipPlatformId = await this.getPlatformID(await accessdata.membership_id, membershipType);
        var characterId = await this.getCharacterId(await membershipPlatformId, membershipType, character);
        var spiderItems = await axios.get(this.basePath + '/Destiny2/' + membershipType + '/Profile/' + membershipPlatformId + '/Character/' + characterId + '/Vendors/' + process.env.Spider + '/?components=402', {
            headers: {
                "X-API-Key": this.apiKey,
                "Authorization": accessdata.token_type + " " + accessdata.access_token
            }
        })
            .then(result => {
                const items = [
                    result.data.Response.sales.data[Object.keys(result.data.Response.sales.data)[0]].itemHash,
                    result.data.Response.sales.data[Object.keys(result.data.Response.sales.data)[1]].itemHash,
                    result.data.Response.sales.data[Object.keys(result.data.Response.sales.data)[2]].itemHash,
                    result.data.Response.sales.data[Object.keys(result.data.Response.sales.data)[3]].itemHash,
                    result.data.Response.sales.data[Object.keys(result.data.Response.sales.data)[4]].itemHash,
                    result.data.Response.sales.data[Object.keys(result.data.Response.sales.data)[5]].itemHash,
                    result.data.Response.sales.data[Object.keys(result.data.Response.sales.data)[6]].itemHash,
                ]
                const costs = [
                    result.data.Response.sales.data[Object.keys(result.data.Response.sales.data)[0]].costs,
                    result.data.Response.sales.data[Object.keys(result.data.Response.sales.data)[1]].costs,
                    result.data.Response.sales.data[Object.keys(result.data.Response.sales.data)[2]].costs,
                    result.data.Response.sales.data[Object.keys(result.data.Response.sales.data)[3]].costs,
                    result.data.Response.sales.data[Object.keys(result.data.Response.sales.data)[4]].costs,
                    result.data.Response.sales.data[Object.keys(result.data.Response.sales.data)[5]].costs,
                    result.data.Response.sales.data[Object.keys(result.data.Response.sales.data)[6]].costs,
                ]
                const spiderItems = {
                    error: 0,
                    items: items,
                    costs: costs,
                }
                return spiderItems;
            }).catch(error => {
                console.log(error);
                const spiderItems = {
                    error: 1,
                    items: null,
                    costs: null,
                }
                return spiderItems;
            });

        if (spiderItems.error == 0) {
            const DbSettings = {
                endpoint: process.env.EndPoint,
                key: process.env.Key
            }
            const client = new CosmosClient(DbSettings);
            const database = client.database(process.env.DataBaseId);
            const container = database.container(process.env.ContainerId);
            const items = [];
            const costs = [];
            for (let i = 0; i < spiderItems.items.length; i++) {
                const { resources: item } = await container.items.query("SELECT * from c WHERE c.id=\"" + spiderItems.items[i] + "\"").fetchAll();
                items[i] = item[0];
            }
            for (let i = 0; i < spiderItems.costs.length; i++) {
                const { resources: cost } = await container.items.query("SELECT * from c WHERE c.id=\"" + spiderItems.costs[i][0].itemHash + "\"").fetchAll();
                costs[i] = cost[0];
            }
            const itemsSold = {
                error: 0,
                itemOne: {
                    item: {
                        name: (items[0].displayProperties.name.slice(9)).charAt(0).toUpperCase() + items[0].displayProperties.name.slice(10),
                        icon: "https://www.bungie.net/" + items[0].displayProperties.icon,
                    },
                    cost: {
                        name: costs[0].displayProperties.name,
                        icon: "https://www.bungie.net/" + costs[0].displayProperties.icon,
                        quantity: spiderItems.costs[0][0].quantity
                    }
                },
                itemTwo: {
                    item: {
                        name: (items[1].displayProperties.name.slice(9)).charAt(0).toUpperCase() + items[1].displayProperties.name.slice(10),
                        icon: "https://www.bungie.net/" + items[1].displayProperties.icon,
                    },
                    cost: {
                        name: costs[1].displayProperties.name,
                        icon: "https://www.bungie.net/" + costs[1].displayProperties.icon,
                        quantity: spiderItems.costs[1][0].quantity
                    }
                },
                itemThree: {
                    item: {
                        name: (items[2].displayProperties.name.slice(9)).charAt(0).toUpperCase() + items[2].displayProperties.name.slice(10),
                        icon: "https://www.bungie.net/" + items[2].displayProperties.icon,
                    },
                    cost: {
                        name: costs[2].displayProperties.name,
                        icon: "https://www.bungie.net/" + costs[2].displayProperties.icon,
                        quantity: spiderItems.costs[2][0].quantity
                    }
                },
                itemFour: {
                    item: {
                        name: (items[3].displayProperties.name.slice(9)).charAt(0).toUpperCase() + items[3].displayProperties.name.slice(10),
                        icon: "https://www.bungie.net/" + items[3].displayProperties.icon,
                    },
                    cost: {
                        name: costs[3].displayProperties.name,
                        icon: "https://www.bungie.net/" + costs[3].displayProperties.icon,
                        quantity: spiderItems.costs[3][0].quantity
                    }
                },
                itemFive: {
                    item: {
                        name: (items[4].displayProperties.name.slice(9)).charAt(0).toUpperCase() + items[4].displayProperties.name.slice(10),
                        icon: "https://www.bungie.net/" + items[4].displayProperties.icon,
                    },
                    cost: {
                        name: costs[4].displayProperties.name,
                        icon: "https://www.bungie.net/" + costs[4].displayProperties.icon,
                        quantity: spiderItems.costs[4][0].quantity
                    }
                },
                itemSix: {
                    item: {
                        name: (items[5].displayProperties.name.slice(9)).charAt(0).toUpperCase() + items[5].displayProperties.name.slice(10),
                        icon: "https://www.bungie.net/" + items[5].displayProperties.icon,
                    },
                    cost: {
                        name: costs[5].displayProperties.name,
                        icon: "https://www.bungie.net/" + costs[5].displayProperties.icon,
                        quantity: spiderItems.costs[5][0].quantity
                    }
                },
                itemSeven: {
                    item: {
                        name: (items[6].displayProperties.name.slice(9)).charAt(0).toUpperCase() + items[6].displayProperties.name.slice(10),
                        icon: "https://www.bungie.net/" + items[6].displayProperties.icon,
                    },
                    cost: {
                        name: costs[6].displayProperties.name,
                        icon: "https://www.bungie.net/" + costs[6].displayProperties.icon,
                        quantity: spiderItems.costs[6][0].quantity
                    }
                }
            }
            return itemsSold;
        } else {
            const itemsSold = {
                error: 1
            }
            return itemsSold;
        }
    }

    //Ritorna gli item venduti da Xur
    async getXur(accessdata, membershipType, character) {
        var membershipPlatformId = await this.getPlatformID(await accessdata.membership_id, membershipType);
        var characterId = await this.getCharacterId(await membershipPlatformId, membershipType, character);
        var items = await axios.get(this.basePath + '/Destiny2/' + membershipType + '/Profile/' + membershipPlatformId + '/Character/' + characterId + '/Vendors/' + process.env.xur + '/?components=304,400,401,402', {
            headers: {
                "X-API-Key": this.apiKey,
                "Authorization": accessdata.token_type + " " + accessdata.access_token
            }
        })
            .then(result => {
                if (Object.keys(result.data.Response.sales.data).length > 4) {
                    let itemOneStats = result.data.Response.itemComponents.stats.data[Object.keys(result.data.Response.itemComponents.stats.data)[1]].stats;
                    let itemTwoStats = result.data.Response.itemComponents.stats.data[Object.keys(result.data.Response.itemComponents.stats.data)[2]].stats;
                    let itemThreeStats = result.data.Response.itemComponents.stats.data[Object.keys(result.data.Response.itemComponents.stats.data)[3]].stats;
                    var itemsHash = {
                        weapon: result.data.Response.sales.data[Object.keys(result.data.Response.sales.data)[2]],
                        one: result.data.Response.sales.data[Object.keys(result.data.Response.sales.data)[0]],
                        two: result.data.Response.sales.data[Object.keys(result.data.Response.sales.data)[1]],
                        three: result.data.Response.sales.data[Object.keys(result.data.Response.sales.data)[3]],
                    }
                    var itemsStats = {
                        one: {
                            mobilità: itemOneStats[Object.keys(itemOneStats)[4]].value,
                            resilienza: itemOneStats[Object.keys(itemOneStats)[1]].value,
                            recupero: itemOneStats[Object.keys(itemOneStats)[3]].value,
                            disciplina: itemOneStats[Object.keys(itemOneStats)[2]].value,
                            intelletto: itemOneStats[Object.keys(itemOneStats)[0]].value,
                            forza: itemOneStats[Object.keys(itemOneStats)[5]].value,

                            tot: function () {
                                return this.mobilità + this.resilienza + this.recupero + this.disciplina + this.intelletto + this.forza;
                            },
                        },
                        two: {
                            mobilità: itemTwoStats[Object.keys(itemOneStats)[4]].value,
                            resilienza: itemTwoStats[Object.keys(itemOneStats)[1]].value,
                            recupero: itemTwoStats[Object.keys(itemOneStats)[3]].value,
                            disciplina: itemTwoStats[Object.keys(itemOneStats)[2]].value,
                            intelletto: itemTwoStats[Object.keys(itemOneStats)[0]].value,
                            forza: itemTwoStats[Object.keys(itemOneStats)[5]].value,

                            tot: function () {
                                return this.mobilità + this.resilienza + this.recupero + this.disciplina + this.intelletto + this.forza;
                            },
                        },
                        three: {
                            mobilità: itemThreeStats[Object.keys(itemOneStats)[4]].value,
                            resilienza: itemThreeStats[Object.keys(itemOneStats)[1]].value,
                            recupero: itemThreeStats[Object.keys(itemOneStats)[3]].value,
                            disciplina: itemThreeStats[Object.keys(itemOneStats)[2]].value,
                            intelletto: itemThreeStats[Object.keys(itemOneStats)[0]].value,
                            forza: itemThreeStats[Object.keys(itemOneStats)[5]].value,

                            tot: function () {
                                return this.mobilità + this.resilienza + this.recupero + this.disciplina + this.intelletto + this.forza;
                            },
                        },
                    }
                    var items = {
                        canPurchase: true,
                        itemsHash: itemsHash,
                        itemsStats: itemsStats
                    }
                    return items;
                } else {
                    var items = {
                        canPurchase: false,
                        itemsHash: null,
                        itemsStats: null
                    }
                    return items
                }
            }).catch(error => {
                console.log(error);
            });

        if (items.canPurchase == true) {
            const querySpec = { query: "SELECT * from c WHERE c.id=\"" + items.itemsHash.weapon.itemHash + "\" OR c.id=\"" + items.itemsHash.one.itemHash + "\" OR c.id=\"" + items.itemsHash.two.itemHash + "\" OR c.id=\"" + items.itemsHash.three.itemHash + "\"" };
            const DbSettings = {
                endpoint: process.env.EndPoint,
                key: process.env.Key
            }
            const client = new CosmosClient(DbSettings);
            const database = client.database(process.env.DataBaseId);
            const container = database.container(process.env.ContainerId);
            const { resources: itemsDb } = await container.items.query(querySpec).fetchAll();
            const result = {
                canPurchase: true,
                weapon: {
                    name: itemsDb[1].displayProperties.name,
                    type: itemsDb[1].itemTypeDisplayName,
                    icon: "https://www.bungie.net/" + itemsDb[1].displayProperties.icon,
                },
                armorOne: {
                    name: itemsDb[0].displayProperties.name + " - " + itemsDb[0].itemTypeDisplayName,
                    stats: {
                        all: items.itemsStats.one,
                        tot: items.itemsStats.one.tot(),
                    },
                    icon: "https://www.bungie.net/" + itemsDb[0].displayProperties.icon,
                },
                armorTwo: {
                    name: itemsDb[2].displayProperties.name + " - " + itemsDb[2].itemTypeDisplayName,
                    stats: {
                        all: items.itemsStats.two,
                        tot: items.itemsStats.two.tot(),
                    },
                    icon: "https://www.bungie.net/" + itemsDb[2].displayProperties.icon,
                },
                armorThree: {
                    name: itemsDb[3].displayProperties.name + " - " + itemsDb[3].itemTypeDisplayName,
                    stats: {
                        all: items.itemsStats.three,
                        tot: items.itemsStats.three.tot(),
                    },
                    icon: "https://www.bungie.net/" + itemsDb[3].displayProperties.icon,
                },
            }
            return result;
        }
        if (items.canPurchase == false) {
            const result = {
                canPurchase: false,
                weapon: {
                    name: null,
                    type: null,
                    icon: null,
                },
                armorOne: {
                    name: null,
                    stats: {
                        all: null,
                        tot: null,
                    },
                    icon: null,
                },
                armorTwo: {
                    name: null,
                    stats: {
                        all: null,
                        tot: null,
                    },
                    icon: null,
                },
                armorThree: {
                    name: null,
                    stats: {
                        all: null,
                        tot: null,
                    },
                    icon: null,
                },
            }
            return result;
        }
    }
}
module.exports.BungieRequester = BungieRequester;