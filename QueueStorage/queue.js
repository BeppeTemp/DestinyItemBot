const { QueueClient, QueueServiceClient } = require("@azure/storage-queue");

async function test(){
    // Retrieve the connection from an environment
    // variable called AZURE_STORAGE_CONNECTION_STRING
    const connectionString = "DefaultEndpointsProtocol=https;AccountName=dimstorageaccount;AccountKey=ChV1Qk57/9m3xSnnMbzNC2NI4R3uBsVxRW0gE8fVKb6+5vMhMpwRkOSPcXdrPBCOD+qzvyop+sIgNJKJBCkmCQ==;EndpointSuffix=core.windows.net"

    // Instantiate a QueueServiceClient which will be used
    // to create a QueueClient and to list all the queues
    const queueServiceClient = QueueServiceClient.fromConnectionString(connectionString);

    console.log(await queueServiceClient.listQueues().next());

    // Get a QueueClient which will be used
    // to create and manipulate a queue
    const queueClient = queueServiceClient.getQueueClient("dimloginqueue");

    await queueClient.sendMessage("ciao a tutti");

    console.log()

}

test();