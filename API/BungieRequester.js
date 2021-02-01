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

        if (check[0] == 64) {
            var modOneString = items[0].displayProperties.name + " - " + items[0].itemTypeDisplayName + " (Già acquistata)";
        } else {
            var modOneString = items[0].displayProperties.name + " - " + items[0].itemTypeDisplayName + " (Non acquistata)";
        }

        if (check[1] == 64) {
            var modTwoString = items[1].displayProperties.name + " - " + items[1].itemTypeDisplayName + " (Già acquistata)";
        } else {
            var modTwoString = items[1].displayProperties.name + " - " + items[1].itemTypeDisplayName + " (Non acquistata)";
        }

        const mod = {
            modOne: modOneString,
            modTwo: modTwoString
        }

        return mod;
    }

    //Ritorna i materiali in vendita dal ragno
    async getSpider(accessdata, membershipType, character) {
    }

    //Ritorna gli item venduti da Xur
    async getXur(accessdata, membershipType, character) {
        var membershipPlatformId = await this.getPlatformID(await accessdata.membership_id, membershipType);
        var characterId = await this.getCharacterId(await membershipPlatformId, membershipType, character);

        var itemHash = await axios.get(this.basePath + '/Destiny2/' + membershipType + '/Profile/' + membershipPlatformId + '/Character/' + characterId + '/Vendors/' + process.env.xur + '/?components=402', {
            headers: {
                "X-API-Key": this.apiKey,
                "Authorization": accessdata.token_type + " " + accessdata.access_token
            }
        })
            .then(result => {
                var itemHash = {
                    one: result.data.Response.sales.data[Object.keys(result.data.Response.sales.data)[0]],
                    two: result.data.Response.sales.data[Object.keys(result.data.Response.sales.data)[1]],
                    three: result.data.Response.sales.data[Object.keys(result.data.Response.sales.data)[2]],
                    four: result.data.Response.sales.data[Object.keys(result.data.Response.sales.data)[3]],
                }
                return itemHash;
            }).catch(error => {
                console.log(error);
            });

        const querySpec = { query: "SELECT * from c WHERE c.id=\"" + itemHash.one.itemHash + "\" OR c.id=\"" + itemHash.two.itemHash + "\" OR c.id=\"" + itemHash.three.itemHash + "\" OR c.id=\"" + itemHash.four.itemHash + "\""};

        const DbSettings = {
            endpoint: process.env.EndPoint,
            key: process.env.Key
        }
        
        const client = new CosmosClient(DbSettings);
        const database = client.database(process.env.DataBaseId);
        const container = database.container(process.env.ContainerId);

        const { resources: items } = await container.items.query(querySpec).fetchAll();

        console.log(items[0].displayProperties.name);
        console.log(items[1].displayProperties.name);
        console.log(items[2].displayProperties.name);
        console.log(items[3].displayProperties.name);

        //bisogna formattare bene la cosa (come sono fatti gli item li trovi sul DB)
    }
}
module.exports.BungieRequester = BungieRequester;