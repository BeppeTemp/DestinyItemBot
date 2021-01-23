const { Console } = require('console');
const { XMLHttpRequest } = require('XMLHttpRequest');

var apiKey = "f607ba1906f849f09040a3c4a87e0d32";

var xhr = new XMLHttpRequest();
xhr.open("GET", "https://www.bungie.net/platform/Destiny/Manifest/InventoryItem/1274330687/", true);
xhr.setRequestHeader("X-API-Key", apiKey);

xhr.onreadystatechange = function(){
    if(this.readyState === 4 && this.status === 200){
        console.log("If: ")
        console.log(this.status)
        console.log(this.responseText)
        var json = JSON.parse(this.responseText);
        console.log(json.Response.data.inventoryItem.itemName); //Gjallarhorn
    }
    console.log("Else: ")
    console.log(this.status)
    console.log(this.responseText)
}

xhr.send();