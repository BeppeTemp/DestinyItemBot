const { ComponentDialog,WaterfallDialog, ChoiceFactory, ChoicePrompt, TextPrompt} = require('botbuilder-dialogs');
const { TurnContext } = require('botbuilder');
const { BungieRequester } = require('../API/BungieRequester');
const { LongRequest } = require('../dialogs/LongRequest');

const path = require('path');
const dotenv = require('dotenv');
const { isWorker } = require('cluster');
const ENV_FILE = path.join(__dirname, '../.env');
dotenv.config({ path: ENV_FILE });

const CHOICE_PROMPT = 'CHOICE_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const TEXT_PROMPT = 'TEXT_PROMPT';

const MOVE_ITEM_DIALOG = "moveItemDialog";
const DIALOGSTATE = "DIALOG_STATE";
const INFO_TRANSFER_PROPERTY = "infoTransferProperty";
const ACCESS_DATA_PROPERTY = "accessDataProperty";
const IS_NAME_WRONG = "isNameWrong";

class MoveItemDialog extends ComponentDialog {
    constructor(userState) {
        super(MOVE_ITEM_DIALOG);

        this.userState = userState;
        this.br = new BungieRequester();

        this.dialogState = userState.createProperty(DIALOGSTATE)
        this.infoTransferProperty = userState.createProperty(INFO_TRANSFER_PROPERTY);
        this.accessdataProperty = userState.createProperty(ACCESS_DATA_PROPERTY);
        this.isNameWrong = userState.createProperty(IS_NAME_WRONG);

        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new TextPrompt(TEXT_PROMPT))
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.getNameItem.bind(this),
            this.selectionItem.bind(this),
            this.selectionCharacter.bind(this),
            this.moveItem.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    //Ottiene il nome dell'item da spostare
    async getNameItem(step){
        var isWrong = await this.isNameWrong.get(step.context, false);
        
        if(isWrong){
            return await step.prompt(TEXT_PROMPT, "⚠️ Item richiesto non trovato. Scrivi solo il nome di un item che effettivamente possiedi per riprovare e assicurati di digitarlo correttamente. Se invece vuoi annullare la richiesta, scrivi /exit.");
        }
        return step.next();
    }

    //Seleziona quale item spostare in caso di doppioni
    async selectionItem(step) {

        const data = step.options;

        var accessdata = await this.accessdataProperty.get(step.context, {});
        accessdata = data.accessdata;
        await this.accessdataProperty.set(step.context, accessdata);

        var name;

        if(await this.isNameWrong.get(step.context)){
            name = step._info.result;
        }else{
            name = data.name;
        }

        if (name.localeCompare("/exit") == 0){
            await step.context.sendActivity("Sei uscito dalla modalità trasferimento item 👋.");
            return await step.endDialog();
        }

        const infoTransfer = await this.infoTransferProperty.get(step.context, {});
        infoTransfer.name = name;
        await this.infoTransferProperty.set(step.context, infoTransfer);

        const istances = await this.br.getIstancesFromId(name, accessdata ,process.env.MemberShipType);

        if (istances.items.length == 0){
            await this.isNameWrong.set(step.context, true);
            return await step.replaceDialog(this.id, data);
        }
        if (istances.items.length == 1){
            const infoTransfer = await this.infoTransferProperty.get(step.context, {});
            infoTransfer.indexItem = 0;
            await this.infoTransferProperty.set(step.context, infoTransfer);
            return step.next();
        }

        const choices = [];
        for(let i=0;i<istances.items.length;i++){
            const choice = istances.name + " " + istances.items[i].power +" 🕯";
            choices.push(choice);
        }
        choices.push("Annulla 🛑");
        return await step.prompt(CHOICE_PROMPT, {
            prompt: 'Seleziona l\'item da trasferire:',
            choices: ChoiceFactory.toChoices(choices)
        });
    }

    //Seleziona su quale personaggio spostare l'item
    async selectionCharacter(step) {
        var accessdata = await this.accessdataProperty.get(step.context, {});

        const infoTransfer = await this.infoTransferProperty.get(step.context, {});
        if(infoTransfer.indexItem != 0){
            if(step._info.result.value.localeCompare("Annulla 🛑") == 0){
                await step.context.sendActivity("Sei uscito dalla modalità trasferimento item 👋.");
                return await step.endDialog();
            }
            infoTransfer.indexItem = step._info.result.index;
        }
        await this.infoTransferProperty.set(step.context, infoTransfer);

        const characters = await this.br.getCharacters(accessdata ,process.env.MemberShipType);
        const choices = [];

        for(let i=0;i<characters.length;i++){
            choices.push(characters[i].class + " " + String(characters[i].light)+" 🕯");
        }
        choices.push("Annulla 🛑");
        return await step.prompt(CHOICE_PROMPT, {
            prompt: 'Seleziona il personaggio a cui vuoi trasferire l\'item:',
            choices: ChoiceFactory.toChoices(choices)
        });
    }

    //Effettura lo spostamento dell'item
    async moveItem(step) {
        if(step._info.result.value.localeCompare("Annulla 🛑") == 0){
            await step.context.sendActivity("Sei uscito dalla modalità trasferimento item 👋.");
            return await step.endDialog();
        }

        const conversationData = await this.dialogState.get(step.context, {});
        conversationData.conversationReference = TurnContext.getConversationReference(step.context.activity);

        var accessdata = await this.accessdataProperty.get(step.context, {});
        const infoTransfer = await this.infoTransferProperty.get(step.context, {});
        infoTransfer.indexCharacter = step._info.result.index;
        await this.infoTransferProperty.set(step.context, infoTransfer);

        LongRequest.moveItemLong(this.br, infoTransfer, accessdata, conversationData.conversationReference);
        await step.context.sendActivity("Ho avviato lo spostamento del'item da te richiesto, ti invierò una notifica appena avrò terminato l'operazione 😎.");
        await step.context.sendActivity("Sei uscito dalla modalità trasferimento item 👋.");
        await this.isNameWrong.set(step.context, false);
        return await step.endDialog();
    }
}
module.exports.MoveItemDialog = MoveItemDialog;
module.exports.MOVE_ITEM_DIALOG = MOVE_ITEM_DIALOG;