//Importazione dei servizi Azure
const { ActivityHandler, CardFactory, ActivityTypes } = require('botbuilder');

class DestinyVendorBot extends ActivityHandler {
    constructor(conversationState, userState, dialog) {
        super();

        if (!conversationState) throw new Error('[DialogBot]: Missing parameter. conversationState is required');
        if (!userState) throw new Error('[DialogBot]: Missing parameter. userState is required');
        if (!dialog) throw new Error('[DialogBot]: Missing parameter. dialog is required');

        this.conversationState = conversationState;
        this.userState = userState;
        this.dialog = dialog;
        this.dialogState = this.conversationState.createProperty('DialogState');

        this.onMessage(async (context, next) => {
            await this.dialog.run(context, this.dialogState);
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

    //Override the ActivityHandler.run() method to save state changes after the bot logic completes.
    async run(context) {
        await super.run(context);

        // Save any state changes. The load happened during the execution of the Dialog.
        await this.conversationState.saveChanges(context, false);
        await this.userState.saveChanges(context, false);
    }
}
module.exports.DestinyVendorBot = DestinyVendorBot;
