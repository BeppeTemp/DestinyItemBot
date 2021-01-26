const { QueueClient, QueueServiceClient } = require("@azure/storage-queue");
const qs = require("qs");

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    const name = (req.query.name || (req.body && req.body.name));
    const responseMessage = name
        ? "Hello, " + name + ". This HTTP triggered function executed successfully."
        : "This HTTP triggered function executed successfully. Pass a name in the query string or in the request body for a personalized response.";

    var codeb = req.query.code;
    console.log(codeb);
    codeb = codeb.split(",");
    console.log(codeb[1]);
    storecode(qs.stringify(codeb[1]));

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: responseMessage
    };
}

async function storecode(codeb){
    const connectionString = "DefaultEndpointsProtocol=https;AccountName=dimstorageaccount;AccountKey=ChV1Qk57/9m3xSnnMbzNC2NI4R3uBsVxRW0gE8fVKb6+5vMhMpwRkOSPcXdrPBCOD+qzvyop+sIgNJKJBCkmCQ==;EndpointSuffix=core.windows.net"
    const queueServiceClient = QueueServiceClient.fromConnectionString(connectionString);
    const queueClient = queueServiceClient.getQueueClient("dimloginqueue");
    await queueClient.sendMessage(codeb);
}