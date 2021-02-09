const { QueueServiceClient } = require("@azure/storage-queue");

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    const responseMessage = "<!doctype html><html><head> <meta name='viewport' content='width=device-width, initial-scale=1'> <title>Autenticazione completata</title> <style> body { background-repeat: no-repeat; background-size: cover; background-color: #232936; } p { text-align: center; font-family: sans-serif; } .text-center { text-align: center; } </style></head><p style='font-size: 50px; margin-bottom: -15px; color: yellow;'>Login completato!</p><p style='font-size: 18px; color: white; margin-top: 60px;'>Adesso copia questo codice e scrivilo nella chat del bot: <strong> <p style='font-size: 18px;background-color: #232936; color: white; border-style: none; text-decoration: none; margin-top: 60px; ;' id='codeb'>"+codeb+" </p> </strong></p></html>";

    var codeb = req.query.code.split(",")[1];
    var state = req.query.state;

    storecode(codeb,state);

    context.res = {
        body: responseMessage
    };
}

async function storecode(codeb, state){
    const connectionString = "DefaultEndpointsProtocol=https;AccountName=dimwebfunction;AccountKey=yMBp3Z9Uim1d/0dFj2B1dSadWIxfRuWrGQRs13e/8wzboFL7f7CRHXdvpQNXFTwylxkfmoEHYjN8y+d9aeypSw==;EndpointSuffix=core.windows.net"
    const queueName = state.toLowerCase();
    
    const queueServiceClient = QueueServiceClient.fromConnectionString(connectionString);
    const queueClient = queueServiceClient.getQueueClient(queueName);

    await queueClient.create();
    
    await queueClient.sendMessage(codeb);
}


//Test link: http://localhost:7071/api/DIMWebFunction?code=2CL9pybUae91yGjtu0W1Ty7mJ6S1jB8tzkZ6S6b1F5KYKuviXaVx2w%3D%3D&code=86f9b04b6c9c2e0fce626133bdf68e84&state=6i0mkLx79Hp91nzWVeHrzHG4

