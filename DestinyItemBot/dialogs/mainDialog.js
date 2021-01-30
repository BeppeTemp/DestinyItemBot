//Importazione di vari moduli
const { ActivityTypes, MessageFactory, InputHints } = require('botbuilder');
const { TextPrompt, ComponentDialog, DialogSet, DialogTurnStatus, WaterfallDialog } = require('botbuilder-dialogs');
const { LuisRecognizer } = require('botbuilder-ai');
const { BungieRequester } = require('../API/BungieRequester');

//Importazione del .env
const path = require('path');
const dotenv = require('dotenv');
const ENV_FILE = path.join(__dirname, '../.env');
dotenv.config({ path: ENV_FILE });

//Queste a che servono ?
const MAIN_DIALOG = 'MAIN_DIALOG';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const TEXT_PROMPT = 'TEXT_PROMPT';

// Main dialog showed as first forwards to the dialog based on the user request
class MainDialog extends ComponentDialog {
    constructor(luisRecognizer, userState) {
        super(MAIN_DIALOG);

        if (!luisRecognizer) throw new Error('[MainDialog]: Missing parameter \'luisRecognizer\' is required');
        this.luisRecognizer = luisRecognizer;
        this.userState = userState;

        // Adding used dialogs
        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.welcomeStep.bind(this),
            this.vendorStep.bind(this),
            this.loopStep.bind(this)
        ]));

        this.br = new BungieRequester(process.env.BungieApiKey, process.env.BungieClientId, process.env.BungieCallBack);

        this.accessdata = {
            access_token: null,
            token_type: null,
            expires_in: null,
            membership_id: null
        }

        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system
     * If no dialog is active, it will start the default dialog
     */
    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    // Welcome message, forward the text to next step
    async welcomeStep(step) {
        if (!this.luisRecognizer.isConfigured) {
            var messageText = 'ATTENZIONE: LUIS non configurato. Controlla il file .env!';
            await step.context.sendActivity(messageText, null, InputHints.IgnoringInput);
            return await step.next();
        }

        var messageText = step.options.restartMsg ? step.options.restartMsg : 'Come posso aiutarti ?';
        const promptMessage = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        return await step.prompt(TEXT_PROMPT, {
            prompt: promptMessage
        });
    }

    // Forwards to the correct dialog based on the menu option or the intent recognized by LUIS
    async vendorStep(step) {
        const reply = {
            type: ActivityTypes.Message
        };

        // Call LUIS and gather user request.
        const luisResult = await this.luisRecognizer.executeLuisQuery(step.context);

        if (LuisRecognizer.topIntent(luisResult) === 'GetGunsmith') {
            if (this.accessdata.access_token==null){
                reply.text = "Non sei loggato, effettura l'accesso a questo link: " + this.br.loginlink();
                await step.context.sendActivity(reply)
                this.accessdata = await this.br.getAccessData();
            }
            const mod = await this.br.getGunsmith(this.accessdata,1,2);
            
            reply.text = mod.modOne +"\n"+mod.modTwo;
            await step.context.sendActivity(reply)
        }
        if (LuisRecognizer.topIntent(luisResult) === "GetSpider") {
            reply.text = "Sembra che tu abbia richiesto di vedere l'inventario del ragno.";
            await step.context.sendActivity(reply)
        }
        if (LuisRecognizer.topIntent(luisResult) === "None") {
            reply.text = "Mi dispiace ma non sono in grado di aiutarti.";
            await step.context.sendActivity(reply)
        }
        return await step.replaceDialog(this.id);
    }

    async loopStep(step) {
        return await step.replaceDialog(this.id);
    }
}
module.exports.MainDialog = MainDialog;
module.exports.MAIN_DIALOG = MAIN_DIALOG;