//Importazione di vari moduli
const axios = require("axios");
const qs = require("qs");
const { promisify } = require('util')
const sleep = promisify(setTimeout)

//Importazione dei servizi Azure
const { QueueServiceClient } = require("@azure/storage-queue");
const { CosmosClient } = require("@azure/cosmos");

//Importazione del .env
const path = require('path');
const dotenv = require('dotenv');
const ENV_FILE = path.join(__dirname, '../.env');
dotenv.config({ path: ENV_FILE });

class BungieRequester {
    //Costruttore
    constructor(apiKey, clientId, callBack) {
        this.basePath = process.env.BungieBasePath;
        this.baseLoginPath = process.env.BungieBaseLoginPath;

        this.apiKey = apiKey;
        this.clientId = clientId;
        this.callBack = callBack;

        this.state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    //Generazione del link per il login
    loginlink() {
        var responseType = "response_type=code&";
        var callBackUri = "redirect_uri=" + this.callBack + "&";
        var state = "state=" + this.state;
        return this.baseLoginPath + responseType + "client_id=" + this.clientId + "&" + callBackUri + state;
    }

    //Verifica ad la presenza del OauthCode all'interno della storage queue
    async getOauthCode() {
        const queueServiceClient = QueueServiceClient.fromConnectionString(process.env.StorageAccountEndPoint);

        var queues;
        var flag = 0;

        while (!flag) {
            queues = await (await queueServiceClient.listQueues().byPage().next()).value.queueItems;
            for (let i = 0; i < queues.length; i++) {
                if (queues[i].name.localeCompare(this.state) == 0) {
                    flag = 1;
                }
            }
            await sleep(parseInt(process.env.TimeOne) * 1000).then(() => { })
        }

        const queueClient = queueServiceClient.getQueueClient(this.state);

        var receivedMessages = await queueClient.receiveMessages();
        var message = receivedMessages.receivedMessageItems[0];

        queueServiceClient.deleteQueue(this.state)

        return message.messageText;
    }

    //Recupera i dati di accesso (Access_Token, Token_Type, Exipers_In, Memebership_Id)
    async getAccessData() {

        await sleep(parseInt(process.env.TimeTwo) * 1000).then(() => { })

        var res = {
            access_token: null,
            token_type: null,
            expires_in: null,
            membership_id: null
        }

        const data = {
            client_id: this.clientId,
            grant_type: "authorization_code",
            code: await this.getOauthCode()
        }

        await axios.post(this.basePath + '/app/oauth/token/', qs.stringify(data))
            .then(result => {
                res.access_token = result.data.access_token;
                res.token_type = result.data.token_type;
                res.expires_in = result.data.expires_in;
                res.membership_id = result.data.membership_id;
            }).catch(error => {
                console.log(error.data);
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
                    first: result.data.Response.sales.data[Object.keys(result.data.Response.sales.data)[2]],
                    second: result.data.Response.sales.data[Object.keys(result.data.Response.sales.data)[3]]
                }
                return mods;
            }).catch(error => {
                console.log(error);
            });

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

        const mod = {
            modOne: {
                name: items[0].displayProperties.name,
                type: items[0].itemTypeDisplayName,
                image: "https://www.bungie.net/" + items[0].displayProperties.icon,
                have: "(Non acquistata)"
            },
            modTwo: {
                name: items[1].displayProperties.name,
                type: items[1].itemTypeDisplayName,
                iamge: "https://www.bungie.net/" + items[1].displayProperties.icon,
                have: "(Non acquistata)"
            }
        }

        if (check[0] == 64) { mod.modOne.have = "(Già acquistata)"; }
        if (check[1] == 64) { mod.modTwo.have = "(Già acquistata)"; }

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
                //te ne servono 7 
                const items = {
                    one: result.data.Response.sales.data[Object.keys(result.data.Response.sales.data)[0]].itemHash,
                    two: result.data.Response.sales.data[Object.keys(result.data.Response.sales.data)[1]].itemHash,
                    three: result.data.Response.sales.data[Object.keys(result.data.Response.sales.data)[2]].itemHash,
                    four: result.data.Response.sales.data[Object.keys(result.data.Response.sales.data)[3]].itemHash,
                    five: result.data.Response.sales.data[Object.keys(result.data.Response.sales.data)[4]].itemHash,
                    six: result.data.Response.sales.data[Object.keys(result.data.Response.sales.data)[5]].itemHash,
                    seven: result.data.Response.sales.data[Object.keys(result.data.Response.sales.data)[6]].itemHash,
                }

                const costs = {
                    one: result.data.Response.sales.data[Object.keys(result.data.Response.sales.data)[0]].costs,
                    two: result.data.Response.sales.data[Object.keys(result.data.Response.sales.data)[1]].costs,
                    three: result.data.Response.sales.data[Object.keys(result.data.Response.sales.data)[2]].costs,
                    four: result.data.Response.sales.data[Object.keys(result.data.Response.sales.data)[3]].costs,
                    five: result.data.Response.sales.data[Object.keys(result.data.Response.sales.data)[4]].costs,
                    six: result.data.Response.sales.data[Object.keys(result.data.Response.sales.data)[5]].costs,
                    seven: result.data.Response.sales.data[Object.keys(result.data.Response.sales.data)[6]].costs,
                }

                const spiderItems = {
                    items: items,
                    costs: costs,
                }

                return spiderItems;
            }).catch(error => {
                console.log(error);
            });

        const DbSettings = {
            endpoint: process.env.EndPoint,
            key: process.env.Key
        }

        const client = new CosmosClient(DbSettings);
        const database = client.database(process.env.DataBaseId);
        const container = database.container(process.env.ContainerId);

        const { resources: NameOne } = await container.items.query("SELECT * from c WHERE c.id=\"" + spiderItems.items.one + "\"").fetchAll();
        const { resources: NameTwo } = await container.items.query("SELECT * from c WHERE c.id=\"" + spiderItems.items.two + "\"").fetchAll();
        const { resources: NameThree } = await container.items.query("SELECT * from c WHERE c.id=\"" + spiderItems.items.three + "\"").fetchAll();
        const { resources: NameFour } = await container.items.query("SELECT * from c WHERE c.id=\"" + spiderItems.items.four + "\"").fetchAll();
        const { resources: NameFive } = await container.items.query("SELECT * from c WHERE c.id=\"" + spiderItems.items.five + "\"").fetchAll();
        const { resources: NameSix } = await container.items.query("SELECT * from c WHERE c.id=\"" + spiderItems.items.six + "\"").fetchAll();
        const { resources: NameSeven } = await container.items.query("SELECT * from c WHERE c.id=\"" + spiderItems.items.seven + "\"").fetchAll();

        const { resources: CostNameOne } = await container.items.query("SELECT * from c WHERE c.id=\"" + spiderItems.costs.one[0].itemHash + "\"").fetchAll();
        const { resources: CostNameTwo } = await container.items.query("SELECT * from c WHERE c.id=\"" + spiderItems.costs.two[0].itemHash + "\"").fetchAll();
        const { resources: CostNameThree } = await container.items.query("SELECT * from c WHERE c.id=\"" + spiderItems.costs.three[0].itemHash + "\"").fetchAll();
        const { resources: CostNameFour } = await container.items.query("SELECT * from c WHERE c.id=\"" + spiderItems.costs.four[0].itemHash + "\"").fetchAll();
        const { resources: CostNameFive } = await container.items.query("SELECT * from c WHERE c.id=\"" + spiderItems.costs.five[0].itemHash + "\"").fetchAll();
        const { resources: CostNameSix } = await container.items.query("SELECT * from c WHERE c.id=\"" + spiderItems.costs.six[0].itemHash + "\"").fetchAll();
        const { resources: CostNameSeven } = await container.items.query("SELECT * from c WHERE c.id=\"" + spiderItems.costs.seven[0].itemHash + "\"").fetchAll();

        const result = {
            one: NameOne[0].displayProperties.name + " (" + CostNameOne[0].displayProperties.name + ": " + spiderItems.costs.one[0].quantity + ")",
            two: NameTwo[0].displayProperties.name + " (" + CostNameTwo[0].displayProperties.name + ": " + spiderItems.costs.two[0].quantity + ")",
            three: NameThree[0].displayProperties.name + " (" + CostNameThree[0].displayProperties.name + ": " + spiderItems.costs.three[0].quantity + ")",
            four: NameFour[0].displayProperties.name + " (" + CostNameFour[0].displayProperties.name + ": " + spiderItems.costs.four[0].quantity + ")",
            five: NameFive[0].displayProperties.name + " (" + CostNameFive[0].displayProperties.name + ": " + spiderItems.costs.five[0].quantity + ")",
            six: NameSix[0].displayProperties.name + " (" + CostNameSix[0].displayProperties.name + ": " + spiderItems.costs.six[0].quantity + ")",
            seven: NameSeven[0].displayProperties.name + " (" + CostNameSeven[0].displayProperties.name + ": " + spiderItems.costs.seven[0].quantity + ")",

            toString: function () {
                return this.one + "\n" + this.two + "\n" + this.three + "\n" + this.four + "\n" + this.five + "\n" + this.six + "\n" + this.seven;
            }
        }

        return result;
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

                        toString: function () {
                            return "Mobilità: " + this.mobilità + "\n" + "Resilienza: " + this.resilienza + "\n" + "Recupero: " + this.recupero + "\n" + "Disciplina: " + this.disciplina + "\n" + "Intelletto: " + this.intelletto + "\n" + "Forza: " + this.forza + "\n" + "Totale: " + this.tot() + "\n";
                        }
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

                        toString: function () {
                            return "Mobilità: " + this.mobilità + "\n" + "Resilienza: " + this.resilienza + "\n" + "Recupero: " + this.recupero + "\n" + "Disciplina: " + this.disciplina + "\n" + "Intelletto: " + this.intelletto + "\n" + "Forza: " + this.forza + "\n" + "Totale: " + this.tot() + "\n";
                        }
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

                        toString: function () {
                            return "Mobilità: " + this.mobilità + "\n" + "Resilienza: " + this.resilienza + "\n" + "Recupero: " + this.recupero + "\n" + "Disciplina: " + this.disciplina + "\n" + "Intelletto: " + this.intelletto + "\n" + "Forza: " + this.forza + "\n" + "Totale: " + this.tot() + "\n";
                        }
                    },
                }

                var items = {
                    itemsHash: itemsHash,
                    itemsStats: itemsStats
                }

                return items;

            }).catch(error => {
                console.log(error);
            });

        const querySpec = { query: "SELECT * from c WHERE c.id=\"" + items.itemsHash.weapon.itemHash + "\" OR c.id=\"" + items.itemsHash.one.itemHash + "\" OR c.id=\"" + items.itemsHash.two.itemHash + "\" OR c.id=\"" + items.itemsHash.three.itemHash + "\"" };

        const DbSettings = {
            endpoint: process.env.EndPoint,
            key: process.env.Key
        }

        const client = new CosmosClient(DbSettings);
        const database = client.database(process.env.DataBaseId);
        const container = database.container(process.env.ContainerId);

        const { resources: itemsDb } = await container.items.query(querySpec).fetchAll();

        const collectibles = [itemsDb[0].collectibleHash, itemsDb[1].collectibleHash, itemsDb[2].collectibleHash, itemsDb[3].collectibleHash]

        const weapon = itemsDb[2].displayProperties.name + " - " + itemsDb[2].itemTypeDisplayName + "\n \n";
        const armorOne = itemsDb[0].displayProperties.name + " - " + itemsDb[0].itemTypeDisplayName + "\n \n" + items.itemsStats.one.toString();
        const armorTwo = itemsDb[1].displayProperties.name + " - " + itemsDb[1].itemTypeDisplayName + "\n \n" + items.itemsStats.two.toString();
        const armorThree = itemsDb[3].displayProperties.name + " - " + itemsDb[3].itemTypeDisplayName + "\n \n" + items.itemsStats.three.toString();

        var result = {
            weapon: weapon,
            armorOne: armorOne,
            armorTwo: armorTwo,
            armorThree: armorThree,

            toString: function () {
                return this.weapon + "\n" + this.armorOne + "\n" + this.armorTwo + "\n" + this.armorThree;
            }
        }
        return result;
    }
}
module.exports.BungieRequester = BungieRequester;