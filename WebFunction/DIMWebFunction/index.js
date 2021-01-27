const { QueueServiceClient } = require("@azure/storage-queue");

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    const name = (req.query.name || (req.body && req.body.name));
    const responseMessage = name
        ? "Hello, " + name + ". This HTTP triggered function executed successfully."
        : "This HTTP triggered function executed successfully. Pass a name in the query string or in the request body for a personalized response.";

    var codeb = req.query.code.split(",")[1];
    var state = req.query.state;

    storecode(codeb,state);

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: responseMessage
    };
}

async function storecode(codeb, state){
    const connectionString = "DefaultEndpointsProtocol=https;AccountName=dimstorageaccount;AccountKey=ChV1Qk57/9m3xSnnMbzNC2NI4R3uBsVxRW0gE8fVKb6+5vMhMpwRkOSPcXdrPBCOD+qzvyop+sIgNJKJBCkmCQ==;EndpointSuffix=core.windows.net"
    const queueName = state.toLowerCase();
    
    const queueServiceClient = QueueServiceClient.fromConnectionString(connectionString);
    const queueClient = queueServiceClient.getQueueClient(queueName);

    await queueClient.create();
    
    await queueClient.sendMessage(codeb);
}


//Test link: http://localhost:7071/api/DIMWebFunction?code=2CL9pybUae91yGjtu0W1Ty7mJ6S1jB8tzkZ6S6b1F5KYKuviXaVx2w%3D%3D&code=86f9b04b6c9c2e0fce626133bdf68e84&state=6i0mkLx79Hp91nzWVeHrzHG4