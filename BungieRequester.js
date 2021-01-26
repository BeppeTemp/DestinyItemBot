const axios = require("axios");
const qs = require("qs");

const path = require('path');
const dotenv = require('dotenv');
const { INVOKE_RESPONSE_KEY } = require("botbuilder");
const { error } = require("console");
const ENV_FILE = path.join(__dirname, '.env');
dotenv.config({ path: ENV_FILE });

class BungieRequester {
    constructor(apiKey, clientId, callBack) {
        this.basePath = "https://www.bungie.net/Platform";
        this.baseLoginPath = "https://www.bungie.net/en/oauth/authorize?";

        this.apiKey = apiKey;
        this.clientId = clientId;
        this.callBack = callBack;
    }

    get loginlink() {
        var responseType = "response_type=code&";
        var callBackUri = "redirect_uri=" + this.callBack + "&";
        var state = "state=6i0mkLx79Hp91nzWVeHrzHG4"; //Aggiungere controllo

        return this.baseLoginPath + responseType + "client_id=" + this.clientId + "&" + callBackUri + state;
    }

    async getAccessData(code) {
        var res = {
            access_token: null,
            token_type: null,
            expires_in: null,
            membership_id: null
        }

        const data = {
            client_id: this.clientId,
            grant_type: "authorization_code",
            code: code
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

    async getVendor(oauthcode, membershipType, character, vendorHash){

        var accessdata = await this.getAccessData(oauthcode);
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
console.log(br.loginlink);
async function test() {
    br.getVendor("a5b655f83e4598d0aeec70e14d490239",1,0,672118013)
}
test();

