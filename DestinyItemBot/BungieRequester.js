const axios = require("axios");
const qs = require("qs");
const { QueueServiceClient } = require("@azure/storage-queue");
const { promisify } = require('util')
const sleep = promisify(setTimeout)

const path = require('path');
const dotenv = require('dotenv');
const ENV_FILE = path.join(__dirname, '.env');
dotenv.config({ path: ENV_FILE });

class BungieRequester {
    constructor(apiKey, clientId, callBack) {
        this.basePath = "https://www.bungie.net/Platform";
        this.baseLoginPath = "https://www.bungie.net/en/oauth/authorize?";

        this.apiKey = apiKey;
        this.clientId = clientId;
        this.callBack = callBack;

        this.state=Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    async loginlink() {


        var responseType = "response_type=code&";
        var callBackUri = "redirect_uri=" + this.callBack + "&";
        var state = "state=" + this.state;

        return this.baseLoginPath + responseType + "client_id=" + this.clientId + "&" + callBackUri + state;
    }

    async getOauthCode(){
        const queueServiceClient = QueueServiceClient.fromConnectionString(process.env.StorageAccountEndPoint);
        
        var queues;
        var flag=0;
    
        while(!flag){
            queues = await (await queueServiceClient.listQueues().byPage().next()).value.queueItems;
            for(let i=0; i<queues.length;i++){
                if(queues[i].name.localeCompare(this.state)==0){
                    flag=1;
                }
            }
            await sleep(parseInt(process.env.TimeOne)*1000).then(() => {})
        }

        const queueClient = queueServiceClient.getQueueClient(this.state);

        var receivedMessages = await queueClient.receiveMessages();
        var message = receivedMessages.receivedMessageItems[0];

        queueServiceClient.deleteQueue(this.state)

        return message.messageText;
    }

    async getAccessData() {

        await sleep(parseInt(process.env.TimeTwo)*1000).then(() => {})

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

    async getCharacterId(membershipPlatformId, membershipType, character) {

        return await axios.get(this.basePath + '/Destiny2/' + membershipType + '/' + 'Profile/'+ membershipPlatformId +'/?components=100', {
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

    async getVendor(membershipType, character, vendorHash){

        var accessdata = await this.getAccessData();
        var membershipPlatformId = await this.getPlatformID(await accessdata.membership_id, membershipType);
        var characterId = await this.getCharacterId (await membershipPlatformId, membershipType, character);

        await axios.get(this.basePath + '/Destiny2/'+ membershipType +'/Profile/'+ membershipPlatformId+'/Character/'+ characterId +'/Vendors/'+ vendorHash +'/?components=402', {
            headers: {
                "X-API-Key": this.apiKey,
                "Authorization" : "Bearer " + accessdata.access_token
            }
        })
            .then(result => {
                console.log(result.data.Response.sales.data);
            }).catch(error => {
                console.log(error);
            });
    }


}
var br = new BungieRequester(process.env.BungieApiKey, process.env.BungieClientId, process.env.BungieCallBack);

async function test() {
    console.log(await br.loginlink());
    br.getVendor(1,2,672118013);
}
test();

