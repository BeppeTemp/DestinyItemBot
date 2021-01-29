// @ts-check
//  <ImportConfiguration>
const CosmosClient = require("@azure/cosmos").CosmosClient;
const config = require("./config");

async function main() {

  // <CreateClientObjectDatabaseContainer>
  const { endpoint, key, databaseId, containerId } = config;

  const client = new CosmosClient({ endpoint, key });

  const database = client.database(databaseId);
  const container = database.container(containerId);

  try {
    const querySpec = {
      query: "SELECT * from c WHERE c.id=\"518387148\" OR c.id=\"2263321586\""
    };
    
    const { resources: items } = await container.items.query(querySpec).fetchAll();

    console.log(items[0].displayProperties.name);
    console.log(items[1].displayProperties.name);

  } catch (err) {
    console.log(err.message);
  }
}

main();
