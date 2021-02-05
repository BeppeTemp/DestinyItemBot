//Importazione di vari moduli
const { ActivityTypes, MessageFactory, InputHints, CardFactory, TurnContext, BotFrameworkAdapter } = require('botbuilder');
const { TextPrompt, ComponentDialog, DialogSet, DialogTurnStatus, WaterfallDialog } = require('botbuilder-dialogs');
const { LuisRecognizer } = require('botbuilder-ai');
const { BungieRequester } = require('../API/BungieRequester');
const { LongRequest } = require('../dialogs/LongRequest');

//Importazione del .env
const path = require('path');
const dotenv = require('dotenv');
const ENV_FILE = path.join(__dirname, '../.env');
dotenv.config({ path: ENV_FILE });

//Queste a che servono ?
const MAIN_DIALOG = 'MAIN_DIALOG';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const TEXT_PROMPT = 'TEXT_PROMPT';

const USER_PROFILE_PROPERTY = 'USER_PROFILE_PROPERTY';
const DIALOGSTATE = "DIALOG_STATE";

const LOGIN_USER = 'LOGIN_USER';
const WELCOMED_USER = 'WELCOMES_USER_PROPERTY';

// Main dialog showed as first forwards to the dialog based on the user request
class MainDialog extends ComponentDialog {
    constructor(luisRecognizer, userState) {
        super(MAIN_DIALOG);

        //Verifica connessione con LUIS
        if (!luisRecognizer) throw new Error('[MainDialog]: Missing parameter \'luisRecognizer\' is required');
        this.luisRecognizer = luisRecognizer;
        this.userState = userState;

        this.userProfileAccessor = userState.createProperty(USER_PROFILE_PROPERTY);
        this.dialogState = userState.createProperty(DIALOGSTATE)

        this.loginUser = userState.createProperty(LOGIN_USER);
        this.welcomedUserProperty = userState.createProperty(WELCOMED_USER);

        // Adding used dialogs
        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.welcomeStep.bind(this),
                this.loginStep.bind(this),
                this.getCodeStep.bind(this),
                this.chooseStep.bind(this),
                this.vendorStep.bind(this),
                this.loopStep.bind(this)
            ]));

        //Inizializzazione del BungieRequester
        this.br = new BungieRequester();

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
        const reply = {
            type: ActivityTypes.Message
        };
        if (!this.luisRecognizer.isConfigured) {
            var messageText = 'ATTENZIONE: LUIS non configurato. Controlla il file .env!';
            await step.context.sendActivity(messageText, null, InputHints.IgnoringInput);
            return await step.next();
        }
        const didBotWelcomedUser = await this.welcomedUserProperty.get(step.context, false);
        if (didBotWelcomedUser === false) {
            var card = CardFactory.thumbnailCard(
                'Salve Guardiano/a ! Sono il Destiny Vendor Bot.',
                [{
                    url: "https://i.postimg.cc/cHpnVgGg/bunshee.png"
                }],
                [],
                {
                    text: 'Puoi chiedermi di mostrarti gli inventari di tre dei nostri amici vendor: Banshee-44, Xur e il ragno. Prima di iniziare ricordati di effettuare il login, che dovrai ripetere ogni 60 minuti di inattività (Zavala non ci ha dato abbastanza fondi). Che la luce del Viaggiatore sia con te.',
                }
            );

            reply.attachments = [card];
            await step.context.sendActivity(reply)
            await this.welcomedUserProperty.set(step.context, true);
        }
        return await step.next();
    }

    //login card
    async loginStep(step) {
        const reply = {
            type: ActivityTypes.Message
        };

        const didLoginUser = await this.loginUser.get(step.context, false);

        if (didLoginUser === false) {
            var card = CardFactory.thumbnailCard(
                'Login richiesto o codice di accesso scaduto.',
                [],
                [{
                    type: 'openUrl',
                    title: 'Login',
                    value: this.br.loginlink(),

                }],
                {
                    text: 'Premi sul bottone per ottenere il tuo codice di login ed autenticarti nel bot.',
                }
            );
            reply.attachments = [card];
            await step.context.sendActivity(reply)

            return await step.prompt(TEXT_PROMPT, 'Inserisci il codice di login ottenuto dalla pagina di Bungie.');
        }else{
            return step.next();
        }
    }

    async getCodeStep(step) {
        const didLoginUser = await this.loginUser.get(step.context, false);

        if (didLoginUser === false) {
            var accessdata = await this.userProfileAccessor.get(step.context, {});
            accessdata = await this.br.getAccessData(step.result);
            await this.userProfileAccessor.set(step.context, accessdata);
            const name = await this.br.getName(accessdata.membership_id, process.env.MemberShipType);
            await step.context.sendActivity("Codice di accesso ottenuto, salve " + name + ".");
            await this.loginUser.set(step.context, true);
        }

        return await step.next();
    }

    async chooseStep(step) {
        return await step.prompt(TEXT_PROMPT, 'Come posso aiutarti ?');
    }

    // Forwards to the correct dialog based on the menu option or the intent recognized by LUIS
    async vendorStep(step) {

        var accessdata = await this.userProfileAccessor.get(step.context, {});

        accessdata = await this.br.refreshAccessData(accessdata.refresh_token);

        await this.userProfileAccessor.set(step.context, accessdata);

        const conversationData = await this.dialogState.get(step.context, {});

        conversationData.conversationReference = TurnContext.getConversationReference(step.context.activity);

        const reply = {
            type: ActivityTypes.Message
        };

        // Call LUIS and gather user request.
        const luisResult = await this.luisRecognizer.executeLuisQuery(step.context);

        //Mostra l'invetraio dell'armaiolo
        if (LuisRecognizer.topIntent(luisResult) === 'GetGunsmith') {
            await step.context.sendActivity(`Sto contattando Banshee-44 alla Torre, probabilmente ha dimenticato dove ha lasciato la radio. Puoi farmi altre richieste nel frattempo !`);
            LongRequest.getGunsmithLong(this.br, accessdata, conversationData.conversationReference);
        }

        //Mostra l'invetraio del ragno
        if (LuisRecognizer.topIntent(luisResult) === "GetSpider") {
            await step.context.sendActivity(`Sto contattando il Ragno sulla Riva, probabilmente è impegnato a ricattare qualcuno. Puoi farmi altre richieste nel frattempo !`);
            LongRequest.getSpiderLong(this.br, accessdata, conversationData.conversationReference);
        }

        //Mostra l'invetraio di Xur
        if (LuisRecognizer.topIntent(luisResult) === "GetXur") {
            await step.context.sendActivity(`Sto cercando Xur nelle destinazioni, potrei chiedere ai Nove dove si trova. Puoi farmi altre richieste nel frattempo !`);
            LongRequest.getXurLong(this.br, accessdata, conversationData.conversationReference);
        }

        //Richiesta non supportata
        if (LuisRecognizer.topIntent(luisResult) === "None") {
            reply.text = "Mi dispiace ma non sono in grado di aiutarti.";
            await step.context.sendActivity(reply)
        }
        return await step.replaceDialog(this.id);
    }

    //Fa un loop
    async loopStep(step) {
        return await step.replaceDialog(this.id);
    }
}
module.exports.MainDialog = MainDialog;
module.exports.MAIN_DIALOG = MAIN_DIALOG;