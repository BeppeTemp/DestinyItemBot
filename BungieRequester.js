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
}

var br = new BungieRequester(process.env.BungieApiKey, process.env.BungieClientId, process.env.BungieCallBack);
console.log(br.loginlink);

async function test(){
    let a = await br.getAccessData("22476253f0c9c7b9d38af5b387f1fe20");
    console.log(a.access_token);
}

test();
