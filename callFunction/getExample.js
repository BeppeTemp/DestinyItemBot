const axios = require('axios');

let response2 = (async () => {return await axios.get('https://www.bungie.net/platform/Destiny/Manifest/InventoryItem/1274330687/', 
    { headers: {
       'X-API-Key': 'f607ba1906f849f09040a3c4a87e0d32'
    } } )
})()

response2.then(function(result) {

    console.log(result.data.Response.data.inventoryItem.itemName);


})
.catch(function(error) {
    console.log(error);
});

