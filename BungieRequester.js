const axios = require("axios");
const qs = require("qs");

const path = require('path');
const dotenv = require('dotenv');
const { INVOKE_RESPONSE_KEY } = require("botbuilder");
const { error } = require("console");
const ENV_FILE = path.join(__dirname, '.env');
dotenv.config({ path: ENV_FILE });

const {BungieApiKey} = process.env;



class BungieRequester {
    constructor(apiKey,clientId, callBack) {
        this.basePath = "https://www.bungie.net/Platform";
        this.baseLoginPath = "https://www.bungie.net/en/oauth/authorize?";

        this.apiKey = apiKey;
        this.clientId = clientId;
        this.callBack = callBack;
    }

    get loginlink(){
        var responseType = "response_type=code&";
        var callBackUri = "redirect_uri="+this.callBack+"&";
        var state = "state=6i0mkLx79Hp91nzWVeHrzHG4"; //Aggiungere controllo

        return this.baseLoginPath+responseType+"client_id="+this.clientId+"&"+callBackUri+state;
    }

    async getAccessData(code){
        var res = {
            access_token: null,
            token_type: null,
            expires_in: null,
            membership_id: null
        }

        const data = {
            client_id : this.clientId,
            grant_type : "authorization_code",
            code : code
        }
     
        await axios.post(this.basePath+'/app/oauth/token/', qs.stringify(data))
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

    async getMemberShipID(membershipId, membershipType){

        return await axios.get(this.basePath+'/User/GetMembershipsById/'+membershipId+'/'+membershipType+'/', {
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
}

var br = new BungieRequester(process.env.BungieApiKey, process.env.BungieClientId, process.env.BungieCallBack);
console.log(br.loginlink);
async function test(){
    let mid = await br.getAccessData("1b318f39047a35fa4647eb79fe1c67bc");
    console.log(await br.getMemberShipID(4392828, 1));
}
test();
