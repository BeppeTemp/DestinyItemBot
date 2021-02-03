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

        this.onMembersAdded(async (context, next) => {
            const reply = {
                type: ActivityTypes.Message
            };

            const membersAdded = context.activity.membersAdded;

            for(let i=0;i<membersAdded.length;i++){
                await context.sendActivity(membersAdded[i].id + " - "+ membersAdded[i].name);
            }

            

            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    var card = CardFactory.thumbnailCard(
                        'Salvo Guardiano/a ! Sono il Destiny Vendor Bot.',
                        [{
                            url: "https://i.postimg.cc/sfLntJj0/bot-Login-Logo.png"
                        }],
                        [],
                        {
                            text :'Puoi chiedermi di mostrarti gli inventari di tre dei nostri amici vendor: Banshee-44, Xur e il ragno. Prima di iniziare ricordati di effettuare il login, che dovrai ripetere ogni 30 minuti di inattivita (Zavala non ci ha dato abbastanza fondi). Che la luce del viaggiatore sia con te.',
                        }
                    );
        
                    reply.attachments = [card];
                    await context.sendActivity(reply)

                    await dialog.loginStepWelcome(context);

                    await this.dialog.run(context, this.dialogState);

                    
                }
            }

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

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
