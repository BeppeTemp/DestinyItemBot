const { ActivityTypes, CardFactory, TurnContext } = require('botbuilder');
const { TextPrompt, ComponentDialog, DialogSet, DialogTurnStatus, WaterfallDialog, ChoicePrompt, ChoiceFactory } = require('botbuilder-dialogs');
const { LuisRecognizer } = require('botbuilder-ai');
const { BungieRequester } = require('../API/BungieRequester');
const { LongRequest } = require('../dialogs/LongRequest');
const { MoveItemDialog, MOVE_ITEM_DIALOG } = require("./MoveItemDialog");

const path = require('path');
const dotenv = require('dotenv');
const ENV_FILE = path.join(__dirname, '../.env');
dotenv.config({ path: ENV_FILE });

const MAIN_DIALOG = 'MAIN_DIALOG';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const TEXT_PROMPT = 'TEXT_PROMPT';
const CHOICE_PROMPT = 'CHOICE_PROMPT';

const USER_PROFILE_PROPERTY = 'USER_PROFILE_PROPERTY';
const DIALOGSTATE = "DIALOG_STATE";

const LOGIN_USER = 'LOGIN_USER';
const WELCOMED_USER = 'WELCOMES_USER_PROPERTY';

//Main dialog showed as first forwards to the dialog based on the user request
class MainDialog extends ComponentDialog {
    constructor(luisRecognizer, userState) {
        super(MAIN_DIALOG);

        if (!luisRecognizer) throw new Error('[MainDialog]: Missing parameter \'luisRecognizer\' is required');
        this.luisRecognizer = luisRecognizer;
        this.userState = userState;

        this.userProfileAccessor = userState.createProperty(USER_PROFILE_PROPERTY);
        this.dialogState = userState.createProperty(DIALOGSTATE)

        this.loginUser = userState.createProperty(LOGIN_USER);
        this.welcomedUserProperty = userState.createProperty(WELCOMED_USER);

        //Used dialogs
        this.addDialog(new MoveItemDialog(userState));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.welcomeStep.bind(this),
                this.getLoginLnkStep.bind(this),
                this.getCodeStep.bind(this),
                this.ChooseAction.bind(this),
                this.loopStep.bind(this)
            ]));

        this.br = new BungieRequester();
        this.initialDialogId = WATERFALL_DIALOG;
    }

    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    //Invia il messaggio di benvenuto
    async welcomeStep(step) {
        const reply = {
            type: ActivityTypes.Message
        };
        const didBotWelcomedUser = await this.welcomedUserProperty.get(step.context, false);
        if (didBotWelcomedUser === false) {
            var card = CardFactory.thumbnailCard(
                'Salve Guardiano/a ! Sono il DestinyVendorBot. 🤖',
                [{
                    url: "https://i.postimg.cc/cHpnVgGg/bunshee.png"
                }],
                [],
                {
                    text: 'Puoi chiedermi di spostare item tra i tuoi personaggi e mostrare gli inventari di tre dei nostri amici vendor preferiti: Banshee-44, Xur e il ragno (Zavala non ci ha dato abbastanza fondi 🥺). Prima di tutto è necessario eseguire il login al tuo account Bungie. Che la luce del Viaggiatore sia con te ❤️.',
                }
            );
            reply.attachments = [card];
            await step.context.sendActivity(reply)
            await this.welcomedUserProperty.set(step.context, true);
        }
        return await step.next();
    }

    //Mostra la card di login
    async getLoginLnkStep(step) {
        const reply = {
            type: ActivityTypes.Message
        };
        const didLoginUser = await this.loginUser.get(step.context, false);
        if (didLoginUser === false) {
            var card = CardFactory.thumbnailCard(
                '⚠️ Login richiesto ! ⚠️',
                [],
                [{
                    type: 'openUrl',
                    title: 'Login',
                    value: this.br.loginlink(),

                }],
                {
                    text: 'Premi sul pulsante per ottenere il codice di accesso e autenticarti nel bot. Una volta completata l\'operazoine non dovrai più ripeterla per 90 giorni.',
                }
            );
            reply.attachments = [card];
            await step.context.sendActivity(reply)
            return await step.prompt(CHOICE_PROMPT, {
                prompt: 'Hai effettuato il login ?:',
                choices: ChoiceFactory.toChoices(["Login completato ✅"])
            });
        }else{
            return step.next();
        }
    }

    //Ottiene il codice di accesso ed effettua il login
    async getCodeStep(step) {
        const didLoginUser = await this.loginUser.get(step.context, false);
        var accessdata = await this.userProfileAccessor.get(step.context, {});

        if (didLoginUser === false) {
            accessdata = await this.br.getAccessData();

            if (accessdata.error == 1){
                step.context.sendActivity("❌ Errore sul login, assicurati di aver completato la procedura di login sul link sopra indicato e riprova.");
                return await step.beginDialog(WATERFALL_DIALOG);
            }
            
            const name = await this.br.getName(accessdata.membership_id, process.env.MemberShipType);
            
            await this.userProfileAccessor.set(step.context, accessdata);
            await this.loginUser.set(step.context, true);

            var message = {
                "channelData": [
                    {
                        "method": "sendMessage",
                        "parameters": {
                            "text": "✅  Codice di accesso ottenuto, salve " + name + ".\n\n❓ Scrivi /help per una panoramica delle funzionalità del bot.",
                            "parse_mode": "HTML"
                        }
                    }
                ]
            }
            await step.context.sendActivity(message);
        }
        return await step.prompt(TEXT_PROMPT, "Come posso aiutarti ?");
    }

    // Forwards to the correct dialog based on the menu option or the intent recognized by LUIS
    async ChooseAction(step) {
        const reply = {
            type: ActivityTypes.Message
        };
        var accessdata = await this.userProfileAccessor.get(step.context, {});     
        accessdata = await this.br.refreshAccessData(accessdata.refresh_token);
        //Controllo scadenza refresh token
        if (accessdata.error == 1){
            await step.context.sendActivity("🆘 Codice di accesso scaduto, è necessario rieseguire l'accesso.");
            await this.loginUser.set(step.context, false);
            return step.next();
        }
        await this.userProfileAccessor.set(step.context, accessdata);
        const conversationData = await this.dialogState.get(step.context, {});
        conversationData.conversationReference = TurnContext.getConversationReference(step.context.activity);
        
        if(step.context._activity.text.localeCompare("/restart") == 0){
            await this.welcomedUserProperty.set(step.context, false);
            await this.loginUser.set(step.context, false);
            return await step.next();
        }
        if(step.context._activity.text.localeCompare("/logout") == 0){
            await this.loginUser.set(step.context, false);
            return await step.next();
        }
        if(step.context._activity.text.localeCompare("/help") == 0){

            var message = {
                "channelData": [
                    {
                        "method": "sendMessage",
                        "parameters": {
                            "text": "Il <b>DestinyVendorBot </b> ti permette di effettuare diverse operazioni inviando comandi in linguaggio naturale, alcuni esempi di interrogazioni per le varie funzionalità sono: \n\n" + 
                            "<b>🔸 Mostrare l'inventario dell'armaiolo </b>: \"Mostrami cosa vende l'armaiolo\", \"Mostrami coda vende Banshee\", \"Armaiolo\" o \"Mostrami le mod in vendita oggi. \n\n"+
                            "<b>🔸 Mostrare l'inventario del ragno </b>: \"Mostrami cosa vende il Ragno\" o \"Ragno\". \n\n"+
                            "<b>🔸 Mostrare l'inventario di Xur </b> (Disponibile solo dal Venerdi (18 ora solare, 19 ora legale) al Martedi (18 ora solare, 19 ora legale)): \"Mostrami cosa vende Xur\" o \"Xur\". \n\n"+
                            "<b>🔸 Spostare uno specifico item ad un determinato personaggio</b>: \"Sposta {nome del item}\", \"Muovi {nome del item}\" o \"Trasferisci {nome del item}\". \n"+
                            "\n\n"+
                            "Il bot implementa anche l'utilizzo di alcuni comandi che è possibile richiamare tramite la KeyWord <b>/</b>, in questo modo verrà mostrato l'elenco dei comandi e una breve descrizione degli stessi.",
                            "parse_mode": "HTML"
                        }
                    }
                ]
            }
            await step.context.sendActivity(message);
            return step.next();
        }
        const luisResult = await this.luisRecognizer.executeLuisQuery(step.context);
        //Mostra l'invetraio dell'armaiolo
        if (LuisRecognizer.topIntent(luisResult) === 'GetGunsmith') {
            LongRequest.getGunsmithLong(this.br, accessdata, conversationData.conversationReference);
            await step.context.sendActivity("Sto contattando Banshee-44 alla Torre, probabilmente ha dimenticato dove ha lasciato la radio 🤣. Ti invierò una notifica appena avrò sue notizie.");
        }
        //Mostra l'invetraio del ragno
        if (LuisRecognizer.topIntent(luisResult) === "GetSpider") {
            LongRequest.getSpiderLong(this.br, accessdata, conversationData.conversationReference);
            await step.context.sendActivity("Sto contattando il Ragno sulla Riva, probabilmente è impegnato a ricattare qualcuno 😖. Ti invierò una notifica appena avrò sue notizie.");
        }
        //Mostra l'invetraio di Xur
        if (LuisRecognizer.topIntent(luisResult) === "GetXur") {
            LongRequest.getXurLong(this.br, accessdata, conversationData.conversationReference);
            await step.context.sendActivity("Sto cercando Xur nelle destinazioni, potrei chiedere a I Nove dove si trova 🤔. Ti invierò una notifica appena avrò sue notizie.");
        } 
        //Spostamento di un item
        if (LuisRecognizer.topIntent(luisResult) === "MoveItem") {
            await step.context.sendActivity("Sei entrato nella modalità trasferimento item 🚚.")
            const data = {
                accessdata: accessdata,
                name: luisResult.entities.item[0]
            }
            return await step.beginDialog(MOVE_ITEM_DIALOG, data);
        }
        //Richiesta non supportata
        if (LuisRecognizer.topIntent(luisResult) === "None") {
            await step.context.sendActivity("❌ Mi dispiace ma non sono in grado di aiutarti.");
        }
        return await step.next();
    }
    
    //Fa un loop
    async loopStep(step) {
        return await step.replaceDialog(this.id);
    }
}
module.exports.MainDialog = MainDialog;
module.exports.MAIN_DIALOG = MAIN_DIALOG;