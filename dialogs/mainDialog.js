//Importazione di vari moduli
const { ActivityTypes, MessageFactory, InputHints, CardFactory } = require('botbuilder');
const { ACData } = require('adaptivecards-templating');
const { TextPrompt, ComponentDialog, DialogSet, DialogTurnStatus, WaterfallDialog } = require('botbuilder-dialogs');
const { LuisRecognizer } = require('botbuilder-ai');
const { BungieRequester } = require('../API/BungieRequester');

//Importazione delle cards
const GunsmithCard = require('../cards/gunsmithCard.json');

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

// Main dialog showed as first forwards to the dialog based on the user request
class MainDialog extends ComponentDialog {
    constructor(luisRecognizer, userState) {
        super(MAIN_DIALOG);

        //Verifica connessione con LUIS
        if (!luisRecognizer) throw new Error('[MainDialog]: Missing parameter \'luisRecognizer\' is required');
        this.luisRecognizer = luisRecognizer;
        this.userState = userState;
        this.userProfileAccessor = userState.createProperty(USER_PROFILE_PROPERTY);

        // Adding used dialogs
        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.loginStep.bind(this),
            this.welcomeStep.bind(this),
            this.vendorStep.bind(this),
            this.loopStep.bind(this)
        ]));

        //Inizializzazione del BungieRequester
        this.br = new BungieRequester(process.env.BungieApiKey, process.env.BungieClientId, process.env.BungieCallBack);

        this.initialDialogId = WATERFALL_DIALOG;

        this.userProfile = null;
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
    //login step
    async loginStep (step){
        this.userProfile = await this.userProfileAccessor.get(step.context, {});

        const reply = {
            type: ActivityTypes.Message
        };

        if(!this.userProfile.accessdata){

            var card = CardFactory.thumbnailCard(
                'Login Richiesto o codice scaduto',
                [{
                    url: "https://image.flaticon.com/icons/png/512/152/152533.png"
                }],
                [{
                    type: 'openUrl',
                    title: 'Login',
                    value : this.br.loginlink(),
    
                }],
                {
                    text :'Ciao, sono il Destiny Vendor Bot e per usufruire di tutte le mie bellissime e utilissime feature devi loggarti. Questo accade sia se è la prima volta che accedi oppure è passato un pò di tempo da quando hai acceduto l ultima volta. Per farlo basta cliccare il link sottostante, dove effettuerai l accesso tramite la tua piattaforma.  Grazie.',
                }
            );

            reply.attachments = [card];
            await step.context.sendActivity(reply)
            this.userProfile.accessdata = await this.br.getAccessData();
            
        }else{
            reply.text = "Salve guardiano non so ancora il tuo nome ma ci sto lavorado (sei loggato)";
            await step.context.sendActivity(reply)
        }

        return await step.next();
    }

    // Welcome message, forward the text to next step
    async welcomeStep(step) {
        if (!this.luisRecognizer.isConfigured) {
            var messageText = 'ATTENZIONE: LUIS non configurato. Controlla il file .env!';
            await step.context.sendActivity(messageText, null, InputHints.IgnoringInput);
            return await step.next();
        }

        var messageText = 'Come posso aiutarti ?';
        const promptMessage = MessageFactory.text(messageText, InputHints.ExpectingInput);
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

        //Mostra l'invetraio dell'armaiolo
        if (LuisRecognizer.topIntent(luisResult) === 'GetGunsmith') {
            const mod = await this.br.getGunsmith(this.userProfile.accessdata,1,2);

            var template = new ACData.template(GunsmithCard);

            var card = template.expand({
                $root : {
                    "background": "../cards/resources/cardBackground.png",
                    "modeOne": {
                        "name": mod.modOne.name,
                        "type": mod.modOne.type,
                        "image": "https://www.bungie.net//common/destiny2_content/icons/da4d74b0d8ee25ca038d4053811573fc.jpg",
                        "have": "(acquistata)"
                    },
                    "modeTwo": {
                        "name": "seconda mod",
                        "type": "descrizdddddddddione",
                        "image": "https://www.bungie.net//common/destiny2_content/icons/da4d74b0d8ee25ca038d4053811573fc.jpg",
                        "have": "(acqddddduistata)"
                    }
                }
            });

            await step.context.sendActivity({
                text: 'Ecco le mod vendute oggi da Banshee-44:',
                attachments: [CardFactory.adaptiveCard(card)]
            });
        }
        
        //Mostra l'invetraio del ragno
        if (LuisRecognizer.topIntent(luisResult) === "GetSpider") {
            reply.text = (await this.br.getSpider(this.userProfile.accessdata,1,2)).toString();
            await step.context.sendActivity(reply)
        }

        //Mostra l'invetraio di Xur
        if (LuisRecognizer.topIntent(luisResult) === "GetXur") {
            reply.text = (await this.br.getXur(this.userProfile.accessdata,1,2)).toString();
            await step.context.sendActivity(reply)
        }

        //Richiesta non supportata
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