// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const path = require('path');
const dotenv = require('dotenv');
const restify = require('restify');
const { BotFrameworkAdapter, ConversationState, MemoryStorage, UserState} = require('botbuilder');

//Creazione del path per il .env file
const ENV_FILE = path.join(__dirname, '.env');
dotenv.config({ path: ENV_FILE });
// This bot's main dialog.
const { DetinyItemBot } = require('./bots/bot');
// Import main dialog
const { MainDialog } = require('./dialogs/mainDialog');
// Import LUIS
const { DIBrecognizer } = require('./cognitiveModels/DIBrecognizer');

// Create HTTP server
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${ server.name } listening to ${ server.url }`);
    console.log('\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator');
    console.log('\nTo talk to your bot, open the emulator select "Open Bot"');
});

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about how bots work.
const adapter = new BotFrameworkAdapter({appId: process.env.MicrosoftAppId, appPassword: process.env.MicrosoftAppPassword });

// Create LUIS Recognizer
// Update these values with the ones taken from Azure LUIS
const {LuisAppId, LuisAPIKey, LuisAPIHostName } = process.env;
const luisConfig = { applicationId: LuisAppId, endpointKey: LuisAPIKey, endpoint: `https://${ LuisAPIHostName }` };
const luisRecognizer = new DIBrecognizer(luisConfig);

// Create conversation and user state with in-memory storage provider
const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage);
const userState = new UserState(memoryStorage);

// Create the bot and the main dialog
const dialog = new MainDialog(luisRecognizer, userState);
const bot = new DetinyItemBot(conversationState, userState, dialog);

// Listen for incoming requests.
server.post('/api/messages', (req, res) => {
    adapter.processActivity(req, res, async (context) => {
        // Route to main dialog.
        await bot.run(context);
    });
});

