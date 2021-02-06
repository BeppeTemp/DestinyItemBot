// @ts-check
//  <ImportConfiguration>
const CosmosClient = require("@azure/cosmos").CosmosClient;
const axios = require("axios");
const config = require("./config");
const dbContext = require("./databaseContext");


async function downloadManifest() {
  console.log("Download manifest avviato \n")

  // @ts-ignore
  return await axios.get("https://www.bungie.net/common/destiny2_content/json/it/DestinyInventoryItemDefinition-28e06178-b2e8-420e-99ca-311865aaf5f0.json")
    .then(result => {
      console.log("Manifest Scaricato \n");

      return result.data;
    }).catch(error => {
      console.log(error);
    });
}

async function main() {

  // <CreateClientObjectDatabaseContainer>
  const { endpoint, key, databaseId, containerId } = config;

  const client = new CosmosClient({ endpoint, key });

  //await client.database(databaseId).delete();
  //console.log("Database Eliminato \n");

  const database = client.database(databaseId);
  const container = database.container(containerId);

  // Make sure Tasks database is already setup. If not, create it.
  await dbContext.create(client, databaseId, containerId);

  try {
    var Manifest = await downloadManifest();

    console.log("Avvio upload degli item \n")

    for(let i=0;i<Object.keys(Manifest).length;i++){
      var item = Manifest[Object.keys(Manifest)[i]];
      var nstr = Manifest[Object.keys(Manifest)[i]]["displayProperties"]["name"];
      var str = nstr.replace(/\s/g, '');
      str = str.toLowerCase();

      item.id = Object.keys(Manifest)[i]
      item.name = str;

      await container.items.create(item);

      console.log(nstr+ " caricato sul database (Item "+i+" di "+ Object.keys(Manifest).length+")");
      if (i % 100 == 0){
        console.clear();
      }
    }
  } catch (err) {
    console.log(err.message);
  }
}

main();
