const axios = require("axios");

const path = require('path');
const dotenv = require('dotenv');
const ENV_FILE = path.join(__dirname, '.env');
dotenv.config({ path: ENV_FILE });

const {BungieApiKey} = process.env;

class BungieRequester {
    constructor(apiKey) {
        this.basePath = "https://www.bungie.net/Platform";
        this.apiKey = apiKey;
    }

    test(){
        var response = (async () => {
            return await axios.get(this.basePath + '/Destiny/Manifest/InventoryItem/1274330687/', 
            { 
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

var br = new BungieRequester(process.env.BungieApiKey);
br.test();