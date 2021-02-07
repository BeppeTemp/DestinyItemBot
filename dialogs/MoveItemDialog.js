const { ComponentDialog,WaterfallDialog, ChoiceFactory, ChoicePrompt } = require('botbuilder-dialogs');
const { BungieRequester } = require('../API/BungieRequester');

const path = require('path');
const dotenv = require('dotenv');
const ENV_FILE = path.join(__dirname, '../.env');
dotenv.config({ path: ENV_FILE });

const CHOICE_PROMPT = 'CHOICE_PROMPT';
const WATERFALL_DIALOG = 'waterfallDialog';
const MOVE_ITEM_DIALOG = "moveItemDialog";

const PROPERTY ="property";

class MoveItemDialog extends ComponentDialog {
    constructor(userState) {
        super(MOVE_ITEM_DIALOG);

        this.userState = userState;
        this.br = new BungieRequester();

        this.infoTransferProperty = userState.createProperty(PROPERTY);

        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
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

    }

    //Seleziona quale item spostare in caso di doppioni
    async selectionItem(step) {
        const accessdata = step.options;
        const name = ("falcolunare");

        const infoTransfer = await this.infoTransferProperty.get(step.context, {});
        infoTransfer.name = name;
        await this.infoTransferProperty.set(step.context, infoTransfer);

        const items = await this.br.getIstancesFromId(name, accessdata ,process.env.MemberShipType);
       
        if (items.vault.length == 0){
            console.log("non ho trova l'arma");
        }
        if (items.vault.length == 1){
            const infoTransfer = await this.infoTransferProperty.get(step.context, {});
            infoTransfer.indexItem = 0;
            await this.infoTransferProperty.set(step.context, infoTransfer);
            return step.next();
        }

        const choices = [];
        for(let i=0;i<items.vault.length;i++){
            const choice = items.name + " (" + items.vault[i].power + ")";
            choices.push(choice);
        }
        return await step.prompt(CHOICE_PROMPT, {
            prompt: 'Seleziona l\'item da trasferire:',
            choices: ChoiceFactory.toChoices(choices)
        });
    }

    //Seleziona su quale personaggio spostare l'item
    async selectionCharacter(step) {
        const infoTransfer = await this.infoTransferProperty.get(step.context, {});
        if(infoTransfer.indexItem != 0){
            infoTransfer.indexItem = step.result.index;
        }
        await this.infoTransferProperty.set(step.context, infoTransfer);

        const accessdata = step.options;
        const characters = await this.br.getCharacters(accessdata ,process.env.MemberShipType);
        const choices = [];

        for(let i=0;i<characters.length;i++){
            choices.push(characters[i].class + " " + String(characters[i].light));
        }
        return await step.prompt(CHOICE_PROMPT, {
            prompt: 'Seleziona il personaggio a cui vuoi trasferire l\'item:',
            choices: ChoiceFactory.toChoices(choices)
        });
    }

    //Effettura lo spostamento dell'item
    async moveItem(step) {
        const infoTransfer = await this.infoTransferProperty.get(step.context, {});
        infoTransfer.indexCharacter = step.result.index;
        await this.infoTransferProperty.set(step.context, infoTransfer);

        const accessdata = step.options;
        await this.br.moveItem(infoTransfer, false, accessdata, process.env.membershipType)

        return await step.endDialog();
    }
}
module.exports.MoveItemDialog = MoveItemDialog;
module.exports.MOVE_ITEM_DIALOG = MOVE_ITEM_DIALOG;