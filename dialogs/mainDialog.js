//Importazione di vari moduli
const { ActivityTypes, MessageFactory, InputHints, CardFactory, TestAdapter } = require('botbuilder');
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
const USER_PROFILE_PROPERTY = 'USER_PROFILE_PROPERTY';
const WELCOMED_USER = 'welcomedUserProperty';

// Main dialog showed as first forwards to the dialog based on the user request
class MainDialog extends ComponentDialog {
    constructor(luisRecognizer, userState) {
        super(MAIN_DIALOG);

        //Verifica connessione con LUIS
        if (!luisRecognizer) throw new Error('[MainDialog]: Missing parameter \'luisRecognizer\' is required');
        this.luisRecognizer = luisRecognizer;
        this.userState = userState;
        this.userProfileAccessor = userState.createProperty(USER_PROFILE_PROPERTY);
        this.welcomedUserProperty = userState.createProperty(WELCOMED_USER);

        // Adding used dialogs
        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.welcomeStep.bind(this),
                this.vendorStep.bind(this),
                this.loopStep.bind(this)
            ]));

        //Inizializzazione del BungieRequester
        this.br = new BungieRequester(process.env.BungieApiKey, process.env.BungieClientId, process.env.BungieCallBack);

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

    //login card
    async loginStep(step) {
        const reply = {
            type: ActivityTypes.Message
        };
 
        var accessdata = await this.userProfileAccessor.get(step.context, {});

        var card = CardFactory.thumbnailCard(
            'Login richiesto o codice di accesso scaduto.',
            [],
            [{
                type: 'openUrl',
                title: 'Login',
                value: this.br.loginlink(),

            }],
            {
                text: '(Non inviare messaggi prima di aver completato la procedura di login)',
            }
        );
        
        reply.attachments = [card];
        await step.context.sendActivity(reply)

        accessdata = await this.br.getAccessData();

        await this.userProfileAccessor.set(step.context, accessdata);

        const name = await this.br.getName(accessdata.membership_id, process.env.MemberShipType);

        await step.context.sendActivity("Codice di accesso ottenuto, salve " + name + ".")
    }

    // Welcome message, forward the text to next step
    async welcomeStep(step) {
        const reply = {
            type: ActivityTypes.Message
        };

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

            await this.loginStep(step);

            await this.welcomedUserProperty.set(step.context, true);
        }

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

        const accessdata = await this.userProfileAccessor.get(step.context, {});

        const reply = {
            type: ActivityTypes.Message
        };

        // Call LUIS and gather user request.
        const luisResult = await this.luisRecognizer.executeLuisQuery(step.context);

        //Mostra l'invetraio dell'armaiolo
        if (LuisRecognizer.topIntent(luisResult) === 'GetGunsmith') {
            const mod = await this.br.getGunsmith(accessdata, process.env.MemberShipType, process.env.Character);

            if (mod.error == 0) {

                var card = {
                    "type": "AdaptiveCard",
                    "body": [
                        {
                            "type": "ColumnSet",
                            "columns": [
                                {
                                    "type": "Column",
                                    "items": [
                                        {
                                            "type": "Image",
                                            "url": mod.modOne.image,
                                            "horizontalAlignment": "Center"
                                        }
                                    ],
                                    "width": "auto"
                                },
                                {
                                    "type": "Column",
                                    "items": [
                                        {
                                            "type": "TextBlock",
                                            "text": mod.modOne.name,
                                            "wrap": true,
                                            "spacing": "None",
                                            "fontType": "Default",
                                            "size": "Large",
                                            "weight": "Bolder",
                                            "color": "Light"
                                        },
                                        {
                                            "type": "TextBlock",
                                            "text": mod.modOne.type,
                                            "wrap": true,
                                            "color": "Light",
                                            "spacing": "Small"
                                        },
                                        {
                                            "type": "TextBlock",
                                            "text": mod.modOne.have.text,
                                            "wrap": true,
                                            "spacing": "Medium",
                                            "weight": "Bolder",
                                            "color": mod.modOne.have.color,
                                            "size": "Medium",
                                            "fontType": "Default",
                                            "isSubtle": true
                                        }
                                    ],
                                    "width": "stretch"
                                }
                            ]
                        },
                        {
                            "type": "ColumnSet",
                            "columns": [
                                {
                                    "type": "Column",
                                    "items": [
                                        {
                                            "type": "Image",
                                            "url": mod.modTwo.image,
                                            "horizontalAlignment": "Center"
                                        }
                                    ],
                                    "width": "auto"
                                },
                                {
                                    "type": "Column",
                                    "items": [
                                        {
                                            "type": "TextBlock",
                                            "text": mod.modTwo.name,
                                            "wrap": true,
                                            "spacing": "None",
                                            "fontType": "Default",
                                            "size": "Large",
                                            "weight": "Bolder",
                                            "color": "Light"
                                        },
                                        {
                                            "type": "TextBlock",
                                            "text": mod.modTwo.type,
                                            "wrap": true,
                                            "color": "Light",
                                            "spacing": "Small"
                                        },
                                        {
                                            "type": "TextBlock",
                                            "text": mod.modTwo.have.text,
                                            "wrap": true,
                                            "spacing": "Medium",
                                            "weight": "Bolder",
                                            "color": mod.modTwo.have.color,
                                            "size": "Medium",
                                            "fontType": "Default",
                                            "isSubtle": true
                                        }
                                    ],
                                    "width": "stretch"
                                }
                            ]
                        }
                    ],
                    "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                    "version": "1.2",
                    "backgroundImage": {
                        "url": "https://i.postimg.cc/43r31T11/card-Background.png"
                    }
                }

                await step.context.sendActivity({
                    text: 'Ecco le mod vendute oggi da Banshee-44:',
                    attachments: [CardFactory.adaptiveCard(card)]
                });
            } else {
                await step.context.sendActivity("Codice di accesso scaduto.");
                await this.loginStep(step);
            }
        }


        //Mostra l'invetraio del ragno
        if (LuisRecognizer.topIntent(luisResult) === "GetSpider") {
            const item = await this.br.getSpider(accessdata, process.env.MemberShipType, process.env.Character)

            if (item.error == 0) {

                var card = {
                    "type": "AdaptiveCard",
                    "body": [
                        {
                            "type": "ColumnSet",
                            "columns": [
                                {
                                    "type": "Column",
                                    "items": [
                                        {
                                            "type": "Image",
                                            "url": item.itemOne.item.icon
                                        }
                                    ],
                                    "width": "auto"
                                },
                                {
                                    "type": "Column",
                                    "items": [
                                        {
                                            "type": "TextBlock",
                                            "text": item.itemOne.item.name,
                                            "wrap": true,
                                            "fontType": "Default",
                                            "size": "Large",
                                            "weight": "Bolder",
                                            "color": "Light",
                                            "height": "stretch"
                                        },
                                        {
                                            "type": "ColumnSet",
                                            "columns": [
                                                {
                                                    "type": "Column",
                                                    "width": "stretch",
                                                    "items": [
                                                        {
                                                            "type": "TextBlock",
                                                            "text": item.itemOne.cost.quantity + " " + item.itemOne.cost.name,
                                                            "wrap": true,
                                                            "weight": "Bolder",
                                                            "color": "Light",
                                                            "size": "Medium",
                                                            "fontType": "Default",
                                                            "isSubtle": true,
                                                            "height": "stretch",
                                                            "separator": true,
                                                            "spacing": "None"
                                                        }
                                                    ]
                                                },
                                                {
                                                    "type": "Column",
                                                    "width": "auto",
                                                    "items": [
                                                        {
                                                            "type": "Image",
                                                            "url": item.itemOne.cost.icon,
                                                            "size": "small"
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ],
                                    "width": "stretch"
                                }
                            ]
                        },
                        {
                            "type": "ColumnSet",
                            "columns": [
                                {
                                    "type": "Column",
                                    "items": [
                                        {
                                            "type": "Image",
                                            "url": item.itemTwo.item.icon
                                        }
                                    ],
                                    "width": "auto"
                                },
                                {
                                    "type": "Column",
                                    "items": [
                                        {
                                            "type": "TextBlock",
                                            "text": item.itemTwo.item.name,
                                            "wrap": true,
                                            "fontType": "Default",
                                            "size": "Large",
                                            "weight": "Bolder",
                                            "color": "Light",
                                            "height": "stretch"
                                        },
                                        {
                                            "type": "ColumnSet",
                                            "columns": [
                                                {
                                                    "type": "Column",
                                                    "width": "stretch",
                                                    "items": [
                                                        {
                                                            "type": "TextBlock",
                                                            "text": item.itemTwo.cost.quantity + " " + item.itemTwo.cost.name,
                                                            "wrap": true,
                                                            "weight": "Bolder",
                                                            "color": "Light",
                                                            "size": "Medium",
                                                            "fontType": "Default",
                                                            "isSubtle": true,
                                                            "height": "stretch",
                                                            "separator": true,
                                                            "spacing": "None"
                                                        }
                                                    ]
                                                },
                                                {
                                                    "type": "Column",
                                                    "width": "auto",
                                                    "items": [
                                                        {
                                                            "type": "Image",
                                                            "url": item.itemTwo.cost.icon,
                                                            "size": "small"
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ],
                                    "width": "stretch"
                                }
                            ]
                        },
                        {
                            "type": "ColumnSet",
                            "columns": [
                                {
                                    "type": "Column",
                                    "items": [
                                        {
                                            "type": "Image",
                                            "url": item.itemThree.item.icon
                                        }
                                    ],
                                    "width": "auto"
                                },
                                {
                                    "type": "Column",
                                    "items": [
                                        {
                                            "type": "TextBlock",
                                            "text": item.itemThree.item.name,
                                            "wrap": true,
                                            "fontType": "Default",
                                            "size": "Large",
                                            "weight": "Bolder",
                                            "color": "Light",
                                            "height": "stretch"
                                        },
                                        {
                                            "type": "ColumnSet",
                                            "columns": [
                                                {
                                                    "type": "Column",
                                                    "width": "stretch",
                                                    "items": [
                                                        {
                                                            "type": "TextBlock",
                                                            "text": item.itemThree.cost.quantity + " " + item.itemThree.cost.name,
                                                            "wrap": true,
                                                            "weight": "Bolder",
                                                            "color": "Light",
                                                            "size": "Medium",
                                                            "fontType": "Default",
                                                            "isSubtle": true,
                                                            "height": "stretch",
                                                            "separator": true,
                                                            "spacing": "None"
                                                        }
                                                    ]
                                                },
                                                {
                                                    "type": "Column",
                                                    "width": "auto",
                                                    "items": [
                                                        {
                                                            "type": "Image",
                                                            "url": item.itemThree.cost.icon,
                                                            "size": "small"
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ],
                                    "width": "stretch"
                                }
                            ]
                        },
                        {
                            "type": "ColumnSet",
                            "columns": [
                                {
                                    "type": "Column",
                                    "items": [
                                        {
                                            "type": "Image",
                                            "url": item.itemFour.item.icon
                                        }
                                    ],
                                    "width": "auto"
                                },
                                {
                                    "type": "Column",
                                    "items": [
                                        {
                                            "type": "TextBlock",
                                            "text": item.itemFour.item.name,
                                            "wrap": true,
                                            "fontType": "Default",
                                            "size": "Large",
                                            "weight": "Bolder",
                                            "color": "Light",
                                            "height": "stretch"
                                        },
                                        {
                                            "type": "ColumnSet",
                                            "columns": [
                                                {
                                                    "type": "Column",
                                                    "width": "stretch",
                                                    "items": [
                                                        {
                                                            "type": "TextBlock",
                                                            "text": item.itemFour.cost.quantity + " " + item.itemFour.cost.name,
                                                            "wrap": true,
                                                            "weight": "Bolder",
                                                            "color": "Light",
                                                            "size": "Medium",
                                                            "fontType": "Default",
                                                            "isSubtle": true,
                                                            "height": "stretch",
                                                            "separator": true,
                                                            "spacing": "None"
                                                        }
                                                    ]
                                                },
                                                {
                                                    "type": "Column",
                                                    "width": "auto",
                                                    "items": [
                                                        {
                                                            "type": "Image",
                                                            "url": item.itemFour.cost.icon,
                                                            "size": "small"
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ],
                                    "width": "stretch"
                                }
                            ]
                        },
                        {
                            "type": "ColumnSet",
                            "columns": [
                                {
                                    "type": "Column",
                                    "items": [
                                        {
                                            "type": "Image",
                                            "url": item.itemFive.item.icon
                                        }
                                    ],
                                    "width": "auto"
                                },
                                {
                                    "type": "Column",
                                    "items": [
                                        {
                                            "type": "TextBlock",
                                            "text": item.itemFive.item.name,
                                            "wrap": true,
                                            "fontType": "Default",
                                            "size": "Large",
                                            "weight": "Bolder",
                                            "color": "Light",
                                            "height": "stretch"
                                        },
                                        {
                                            "type": "ColumnSet",
                                            "columns": [
                                                {
                                                    "type": "Column",
                                                    "width": "stretch",
                                                    "items": [
                                                        {
                                                            "type": "TextBlock",
                                                            "text": item.itemFive.cost.quantity + " " + item.itemFive.cost.name,
                                                            "wrap": true,
                                                            "weight": "Bolder",
                                                            "color": "Light",
                                                            "size": "Medium",
                                                            "fontType": "Default",
                                                            "isSubtle": true,
                                                            "height": "stretch",
                                                            "separator": true,
                                                            "spacing": "None"
                                                        }
                                                    ]
                                                },
                                                {
                                                    "type": "Column",
                                                    "width": "auto",
                                                    "items": [
                                                        {
                                                            "type": "Image",
                                                            "url": item.itemFive.cost.icon,
                                                            "size": "small"
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ],
                                    "width": "stretch"
                                }
                            ]
                        },
                        {
                            "type": "ColumnSet",
                            "columns": [
                                {
                                    "type": "Column",
                                    "items": [
                                        {
                                            "type": "Image",
                                            "url": item.itemSix.item.icon
                                        }
                                    ],
                                    "width": "auto"
                                },
                                {
                                    "type": "Column",
                                    "items": [
                                        {
                                            "type": "TextBlock",
                                            "text": item.itemSix.item.name,
                                            "wrap": true,
                                            "fontType": "Default",
                                            "size": "Large",
                                            "weight": "Bolder",
                                            "color": "Light",
                                            "height": "stretch"
                                        },
                                        {
                                            "type": "ColumnSet",
                                            "columns": [
                                                {
                                                    "type": "Column",
                                                    "width": "stretch",
                                                    "items": [
                                                        {
                                                            "type": "TextBlock",
                                                            "text": item.itemSix.cost.quantity + " " + item.itemSix.cost.name,
                                                            "wrap": true,
                                                            "weight": "Bolder",
                                                            "color": "Light",
                                                            "size": "Medium",
                                                            "fontType": "Default",
                                                            "isSubtle": true,
                                                            "height": "stretch",
                                                            "separator": true,
                                                            "spacing": "None"
                                                        }
                                                    ]
                                                },
                                                {
                                                    "type": "Column",
                                                    "width": "auto",
                                                    "items": [
                                                        {
                                                            "type": "Image",
                                                            "url": item.itemSix.cost.icon,
                                                            "size": "small"
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ],
                                    "width": "stretch"
                                }
                            ]
                        },
                        {
                            "type": "ColumnSet",
                            "columns": [
                                {
                                    "type": "Column",
                                    "items": [
                                        {
                                            "type": "Image",
                                            "url": item.itemSeven.item.icon
                                        }
                                    ],
                                    "width": "auto"
                                },
                                {
                                    "type": "Column",
                                    "items": [
                                        {
                                            "type": "TextBlock",
                                            "text": item.itemSeven.item.name,
                                            "wrap": true,
                                            "fontType": "Default",
                                            "size": "Large",
                                            "weight": "Bolder",
                                            "color": "Light",
                                            "height": "stretch"
                                        },
                                        {
                                            "type": "ColumnSet",
                                            "columns": [
                                                {
                                                    "type": "Column",
                                                    "width": "stretch",
                                                    "items": [
                                                        {
                                                            "type": "TextBlock",
                                                            "text": item.itemSeven.cost.quantity + " " + item.itemSeven.cost.name,
                                                            "wrap": true,
                                                            "weight": "Bolder",
                                                            "color": "Light",
                                                            "size": "Medium",
                                                            "fontType": "Default",
                                                            "isSubtle": true,
                                                            "height": "stretch",
                                                            "separator": true,
                                                            "spacing": "None"
                                                        }
                                                    ]
                                                },
                                                {
                                                    "type": "Column",
                                                    "width": "auto",
                                                    "items": [
                                                        {
                                                            "type": "Image",
                                                            "url": item.itemSeven.cost.icon,
                                                            "size": "small"
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ],
                                    "width": "stretch"
                                }
                            ]
                        },
                    ],
                    "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                    "version": "1.2",
                    "backgroundImage": {
                        "url": "https://i.postimg.cc/43r31T11/card-Background.png"
                    }
                }

                await step.context.sendActivity({
                    text: 'Ecco i materiali venduti oggi dal Ragno:',
                    attachments: [CardFactory.adaptiveCard(card)]
                });
            } else {
                await step.context.sendActivity("Codice di accesso scaduto.");
                await this.loginStep(step);
            }
        }

        //Mostra l'invetraio di Xur
        if (LuisRecognizer.topIntent(luisResult) === "GetXur") {
            const item = await this.br.getXur(accessdata, process.env.MemberShipType, process.env.Character);

            if ((item.error == 0) && (item.canPurchase == true)) {
                await step.context.sendActivity("Qui ci va la stampa.");
            }
            if (item.canPurchase == false) {
                await step.context.sendActivity("Xur oggi non c'è. Riprova nel week-end.");
            }
            if (item.error == 1) {
                await step.context.sendActivity("Codice di accesso scaduto.");
                await this.loginStep(step);
            }

            await step.context.sendActivity(reply)
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