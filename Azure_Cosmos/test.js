const axios = require("axios");

async function test (){
    await axios.get("https://www.bungie.net/common/destiny2_content/json/it/DestinyInventoryItemliteDefinition-28e06178-b2e8-420e-99ca-311865aaf5f0.json")
    .then(result => {
        console.log(result)
    }).catch(error => {
        console.log(error);
    });
}

test();