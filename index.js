const path = require('path');
const dotenv = require('dotenv');
const restify = require('restify');
const { BotFrameworkAdapter, ConversationState, MemoryStorage, UserState} = require('botbuilder');

//Creazione del path per il .env file
const ENV_FILE = path.join(__dirname, '.env');
dotenv.config({ path: ENV_FILE });
// This bot's main dialog.
const { DestinyVendorBot } = require('./bots/DestinyVendorBot');
// Import main dialog
const { MainDialog } = require('./dialogs/mainDialog');
// Import LUIS
const { DIBrecognizer } = require('./cognitiveModels/DIBrecognizer');

// Create HTTP server
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log(`\n${ server.name } listening to ${ server.url }`);
});

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about how bots work.
const adapter = new BotFrameworkAdapter({
    appId: process.env.MicrosoftAppId, 
    appPassword: process.env.MicrosoftAppPassword 
});

// Create LUIS Recognizer
// Update these values with the ones taken from Azure LUIS
const { LuisAppId, LuisAPIKey, LuisAPIHostName } = process.env;
const luisConfig = { 
    applicationId: LuisAppId, 
    endpointKey: LuisAPIKey, 
    endpoint: `https://${ LuisAPIHostName }` 
};
const luisRecognizer = new DIBrecognizer(luisConfig);

// Create conversation and user state with in-memory storage provider
const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage);
const userState = new UserState(memoryStorage);

// Create the bot and the main dialog
const dialog = new MainDialog(luisRecognizer, userState);
const bot = new DestinyVendorBot(conversationState, userState, dialog);

// Catch-all for errors
adapter.onTurnError = async (context, error) => {
    // This check writes out errors to console log .vs. app insights
    console.error(`\n [onTurnError] unhandled error: ${ error }`);

    // Send a trace activity, which will be displayed in Bot Framework Emulator
    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${ error }`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
    );

    // Send a message to the user
    await context.sendActivity('The bot encountered an error or bug.');
    await context.sendActivity('To continue to run this bot, please fix the bot source code.');

    // Clear out state
    await conversationState.delete(context);
};

// Listen for incoming requests.
server.post('/api/messages', (req, res) => {
    adapter.processActivity(req, res, async (context) => {
        // Route to main dialog.
        await bot.run(context);
    });
});

//9f256ef2-2131-4644-be77-05bbe8fa5cb1
//GfL%0_}iUc|$WbsVoJJ&t@z*Esp