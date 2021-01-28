// @ts-check
//  <ImportConfiguration>
const CosmosClient = require("@azure/cosmos").CosmosClient;
const axios = require("axios");
const config = require("./config");
const dbContext = require("./databaseContext");
//  </ImportConfiguration>

//  <DefineNewItem>
const newItem = {
  id: "3",
  category: "fun",
  name: "Cosmos DB",
  description: "Complete Cosmos DB Node.js Quickstart ⚡",
  isComplete: false
};
//  </DefineNewItem>

async function downloadManifest() {
  return await axios.get("https://www.bungie.net/common/destiny2_content/json/it/DestinyInventoryItemliteDefinition-28e06178-b2e8-420e-99ca-311865aaf5f0.json")
    .then(result => {
      console.log("Manifest Scaricato");

      return result.data;
    }).catch(error => {
      console.log(error);
    });
}

async function main() {

  // <CreateClientObjectDatabaseContainer>
  const { endpoint, key, databaseId, containerId } = config;

  const client = new CosmosClient({ endpoint, key });

  const database = client.database(databaseId);
  const container = database.container(containerId);

  // Make sure Tasks database is already setup. If not, create it.
  await dbContext.create(client, databaseId, containerId);
  // </CreateClientObjectDatabaseContainer>

  try {
    // <CreateItem>
    /** Create new item
     * newItem is defined at the top of this file
     */

    var Manifest = await downloadManifest();

    for(let i=0;i<Object.keys(Manifest).length;i++){
      await container.items.create(Manifest[Object.keys(Manifest)[i]]);
      console.log("Item "+i+" caricato");
    }

    // </CreateItem>

  } catch (err) {
    console.log(err.message);
  }
}

main();
