//Importazione di vari moduli
const { ActivityTypes, MessageFactory, InputHints, CardFactory } = require('botbuilder');
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

    //login card di benvenuto
    async loginStepWelcome(context) {
        const reply = {
            type: ActivityTypes.Message
        };

        this.userProfile = await this.userProfileAccessor.get(context, {});

        var card = CardFactory.thumbnailCard(
            'Login richiesto o codice di accesso scaduto',
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
        await context.sendActivity(reply)

        this.userProfile.accessdata = await this.br.getAccessData();

        const name = await this.br.getName(this.userProfile.accessdata.membership_id, 1);

        await context.sendActivity("Codice di accesso ottenuto, salve " + name + ".")
    }

    //login card
    async loginStep(step) {
        const reply = {
            type: ActivityTypes.Message
        };

        this.userProfile = await this.userProfileAccessor.get(step.context, {});

        var card = CardFactory.thumbnailCard(
            'Login richiesto o codice di accesso scaduto',
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

        this.userProfile.accessdata = await this.br.getAccessData();

        const name = await this.br.getName(this.userProfile.accessdata.membership_id, 1);

        await step.context.sendActivity("Codice di accesso ottenuto, salve " + name + ".")
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
            const mod = await this.br.getGunsmith(this.userProfile.accessdata, 1, 2);

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
                        "url": "https://i.postimg.cc/9MkxjMf3/Immagine.png"
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
            const item = await this.br.getSpider(this.userProfile.accessdata, 1, 2)

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
                                                        "size": "Medium"
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
                                                        "size": "Medium"
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
                                                        "size": "Medium"
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
                                                        "size": "Medium"
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
                                                        "size": "Medium"
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
                                                        "size": "Medium"
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
                    "url": "https://i.postimg.cc/9MkxjMf3/Immagine.png"
                }
            }

            await step.context.sendActivity({
                text: 'Ecco i materiali venduti oggi dal Ragno:',
                attachments: [CardFactory.adaptiveCard(card)]
            });
        }

        //Mostra l'invetraio di Xur
        if (LuisRecognizer.topIntent(luisResult) === "GetXur") {
            reply.text = (await this.br.getXur(this.userProfile.accessdata, 1, 2)).toString();
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