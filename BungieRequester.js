const axios = require("axios");
const qs = require("qs");

const path = require('path');
const dotenv = require('dotenv');
const { INVOKE_RESPONSE_KEY } = require("botbuilder");
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
        var state = "state=6i0mkLx79Hp91nzWVeHrzHG4";

        return this.baseLoginPath+responseType+"client_id="+this.clientId+"&"+callBackUri+state;
    }

    accessToken(code){

        const data = {
            client_id : this.clientId,
            grant_type : "authorization_code",
            code : code
        }
        
        var response = (async () => {
            return await axios.post(this.basePath +'/app/oauth/token/',qs.stringify(data))
            })()

            response.then(function(result){
                console.log(result.response);
            })
            .catch(function(error){
                console.log(error.response);
            });
    }


    test(){
        var response = (async () => {
            return await axios.get(this.basePath + '/Destiny/Manifest/InventoryItem/1274330687/',{ 
                headers: {'X-API-Key': this.apiKey } 
            })
        })()
        
        response.then(function(result) {
            console.log(result.data.Response.data.inventoryItem.itemName);
        })
        .catch(function(error) {
            console.log(error);
        });
    }
}

var br = new BungieRequester(process.env.BungieApiKey, process.env.BungieClientId, process.env.BungieCallBack);
console.log(br.loginlink);
br.accessToken("2b65c01bab385109a948b0bc4ebccb68");
