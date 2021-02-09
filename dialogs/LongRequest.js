const { CardFactory, BotFrameworkAdapter } = require('botbuilder');

//Contine una serie di metodi che ritornano messaggi proattivi per gestire richieste più lunghe di 15 secondi
class LongRequest {
    //Ritorna l'inventario dell'armaiolo
    static async getGunsmithLong(br, accessdata, conversationReference) {
        const mod = await br.getGunsmith(accessdata, process.env.MemberShipType, process.env.Character);
        // Set up the adapter and send the message
        try {
            const adapter = new BotFrameworkAdapter({
                appId: process.env.microsoftAppID,
                appPassword: process.env.microsoftAppPassword,
                channelService: process.env.ChannelService,
                openIdMetadata: process.env.BotOpenIdMetadata
            });
            await adapter.continueConversation(conversationReference, async turnContext => {
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
                await turnContext.sendActivity({
                    text: 'Ecco le mod vendute oggi da Banshee-44 😎:',
                    attachments: [CardFactory.adaptiveCard(card)]
                });
            });
        } catch (error) {
            console.log(error);
        }
    }
    //Ritorna l'inventario del Ragno
    static async getSpiderLong(br, accessdata, conversationReference) {
        const item = await br.getSpider(accessdata, process.env.MemberShipType, process.env.Character)
        // Set up the adapter and send the message
        try {
            const adapter = new BotFrameworkAdapter({
                appId: process.env.microsoftAppID,
                appPassword: process.env.microsoftAppPassword,
                channelService: process.env.ChannelService,
                openIdMetadata: process.env.BotOpenIdMetadata
            });
            await adapter.continueConversation(conversationReference, async turnContext => {
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
                                            "url": item.items[0].item.icon
                                        }
                                    ],
                                    "width": "auto"
                                },
                                {
                                    "type": "Column",
                                    "items": [
                                        {
                                            "type": "TextBlock",
                                            "text": item.items[0].item.name,
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
                                                            "text": item.items[0].cost.quantity + " " + item.items[0].cost.name,
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
                                                            "url": item.items[0].cost.icon,
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
                                            "url": item.items[1].item.icon
                                        }
                                    ],
                                    "width": "auto"
                                },
                                {
                                    "type": "Column",
                                    "items": [
                                        {
                                            "type": "TextBlock",
                                            "text": item.items[1].item.name,
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
                                                            "text": item.items[1].cost.quantity + " " + item.items[1].cost.name,
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
                                                            "url": item.items[1].cost.icon,
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
                                            "url": item.items[2].item.icon
                                        }
                                    ],
                                    "width": "auto"
                                },
                                {
                                    "type": "Column",
                                    "items": [
                                        {
                                            "type": "TextBlock",
                                            "text": item.items[2].item.name,
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
                                                            "text": item.items[2].cost.quantity + " " + item.items[2].cost.name,
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
                                                            "url": item.items[2].cost.icon,
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
                                            "url": item.items[3].item.icon
                                        }
                                    ],
                                    "width": "auto"
                                },
                                {
                                    "type": "Column",
                                    "items": [
                                        {
                                            "type": "TextBlock",
                                            "text": item.items[3].item.name,
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
                                                            "text": item.items[3].cost.quantity + " " + item.items[3].cost.name,
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
                                                            "url": item.items[3].cost.icon,
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
                                            "url": item.items[4].item.icon
                                        }
                                    ],
                                    "width": "auto"
                                },
                                {
                                    "type": "Column",
                                    "items": [
                                        {
                                            "type": "TextBlock",
                                            "text": item.items[4].item.name,
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
                                                            "text": item.items[4].cost.quantity + " " + item.items[4].cost.name,
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
                                                            "url": item.items[4].cost.icon,
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
                                            "url": item.items[5].item.icon
                                        }
                                    ],
                                    "width": "auto"
                                },
                                {
                                    "type": "Column",
                                    "items": [
                                        {
                                            "type": "TextBlock",
                                            "text": item.items[5].item.name,
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
                                                            "text": item.items[5].cost.quantity + " " + item.items[5].cost.name,
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
                                                            "url": item.items[5].cost.icon,
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
                                            "url": item.items[6].item.icon
                                        }
                                    ],
                                    "width": "auto"
                                },
                                {
                                    "type": "Column",
                                    "items": [
                                        {
                                            "type": "TextBlock",
                                            "text": item.items[6].item.name,
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
                                                            "text": item.items[6].cost.quantity + " " + item.items[6].cost.name,
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
                                                            "url": item.items[6].cost.icon,
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
                await turnContext.sendActivity({
                    text: 'Ecco i materiali venduti oggi dal Ragno 😎:',
                    attachments: [CardFactory.adaptiveCard(card)]
                });
            });
        } catch (error) {
            console.log(error);
        }
    }
    //Ritorna l'inventraio di Xur
    static async getXurLong(br, accessdata, conversationReference) {
        const item = await br.getXur(accessdata, process.env.MemberShipType, process.env.Character);
        // Set up the adapter and send the message
        try {
            const adapter = new BotFrameworkAdapter({
                appId: process.env.microsoftAppID,
                appPassword: process.env.microsoftAppPassword,
                channelService: process.env.ChannelService,
                openIdMetadata: process.env.BotOpenIdMetadata
            });
            await adapter.continueConversation(conversationReference, async turnContext => {
                if (item.canPurchase == true) {
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
                                                "url": item.weapon.icon,
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
                                                "text": item.weapon.name,
                                                "wrap": true,
                                                "spacing": "None",
                                                "fontType": "Default",
                                                "size": "Large",
                                                "weight": "Bolder",
                                                "color": "Light"
                                            },
                                            {
                                                "type": "TextBlock",
                                                "text": item.weapon.type,
                                                "wrap": true,
                                                "color": "Light",
                                                "spacing": "Small"
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
                                                "url": item.armorOne.icon,
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
                                                "text": item.armorOne.name,
                                                "spacing": "None",
                                                "fontType": "Default",
                                                "size": "Large",
                                                "color": "Light",
                                                "weight": "Bolder"
                                            },
                                            {
                                                "type": "TextBlock",
                                                "text": "Mobilità: " + item.armorOne.stats.all.mobilità + " - Resilienza: " + item.armorOne.stats.all.resilienza + " - Recupero: " + item.armorOne.stats.all.recupero,
                                                "color": "Light",
                                                "spacing": "Small",
                                            },
                                            {
                                                "type": "TextBlock",
                                                "text": "Disciplina: " + item.armorOne.stats.all.disciplina + " - Intelletto: " + item.armorOne.stats.all.intelletto + " - Forza: " + item.armorOne.stats.all.forza,
                                                "color": "Light",
                                                "spacing": "Small",
                                            },
                                            {
                                                "type": "TextBlock",
                                                "text": "Totale: " + item.armorOne.stats.tot,
                                                "color": "Light",
                                                "spacing": "Small",
                                                "weight": "Bolder",
                                                "size": "Medium"
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
                                                "url": item.armorTwo.icon,
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
                                                "text": item.armorTwo.name,
                                                "spacing": "None",
                                                "fontType": "Default",
                                                "size": "Large",
                                                "color": "Light",
                                                "weight": "Bolder"
                                            },
                                            {
                                                "type": "TextBlock",
                                                "text": "Mobilità: " + item.armorTwo.stats.all.mobilità + " - Resilienza: " + item.armorTwo.stats.all.resilienza + " - Recupero: " + item.armorTwo.stats.all.recupero,
                                                "color": "Light",
                                                "spacing": "Small",
                                            },
                                            {
                                                "type": "TextBlock",
                                                "text": "Disciplina: " + item.armorTwo.stats.all.disciplina + " - Intelletto: " + item.armorTwo.stats.all.intelletto + " - Forza: " + item.armorTwo.stats.all.forza,
                                                "color": "Light",
                                                "spacing": "Small",
                                            },
                                            {
                                                "type": "TextBlock",
                                                "text": "Totale: " + item.armorTwo.stats.tot,
                                                "color": "Light",
                                                "spacing": "Small",
                                                "weight": "Bolder",
                                                "size": "Medium"
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
                                                "url": item.armorThree.icon,
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
                                                "text": item.armorThree.name,
                                                "spacing": "None",
                                                "fontType": "Default",
                                                "size": "Large",
                                                "color": "Light",
                                                "weight": "Bolder"
                                            },
                                            {
                                                "type": "TextBlock",
                                                "text": "Mobilità: " + item.armorThree.stats.all.mobilità + " - Resilienza: " + item.armorThree.stats.all.resilienza + " - Recupero: " + item.armorThree.stats.all.recupero,
                                                "color": "Light",
                                                "spacing": "Small",
                                            },
                                            {
                                                "type": "TextBlock",
                                                "text": "Disciplina: " + item.armorThree.stats.all.disciplina + " - Intelletto: " + item.armorThree.stats.all.intelletto + " - Forza: " + item.armorThree.stats.all.forza,
                                                "color": "Light",
                                                "spacing": "Small",
                                            },
                                            {
                                                "type": "TextBlock",
                                                "text": "Totale: " + item.armorThree.stats.tot,
                                                "color": "Light",
                                                "spacing": "Small",
                                                "weight": "Bolder",
                                                "size": "Medium"
                                            }
                                        ],
                                        "width": "stretch"
                                    }
                                ]
                            }
                        ],
                        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                        "version": "1.0",
                        "backgroundImage": {
                            "url": "https://i.postimg.cc/43r31T11/card-Background.png"
                        }
                    }
                    await turnContext.sendActivity({
                        text: 'Ecco gli item venduti oggi da Xur 😎:',
                        attachments: [CardFactory.adaptiveCard(card)]
                    });
                }
                if (item.canPurchase == false) {
                    await turnContext.sendActivity("Non sono riuscito a trovarlo, mi sa che è in ferie 🤷🏻‍♂️. Riprova nel week-end.");
                }
            });
        } catch (error) {
            console.log(error);
        }
    }
    //Avvia lo spostamento di un arma
    static async moveItemLong(br, infoTransfer, accessdata, conversationReference) {
        const status = await br.moveItem(infoTransfer, accessdata, process.env.membershipType);
        // Set up the adapter and send the message
        try {
            const adapter = new BotFrameworkAdapter({
                appId: process.env.microsoftAppID,
                appPassword: process.env.microsoftAppPassword,
                channelService: process.env.ChannelService,
                openIdMetadata: process.env.BotOpenIdMetadata
            });
            await adapter.continueConversation(conversationReference, async turnContext => {
                if(status.error == 0){
                    await turnContext.sendActivity("✅ Il trasferimento che avevi richiesto è stato completato con successo.");
                }else{
                    await turnContext.sendActivity("❌ Il trasferimento che avevi richiesto è fallito. Riprova assicurandoti di non aver richiesto il trasferimento di un item equipaggiato su un PG attivo in game, se il problema persiste constatta uno sviluppatore.");
                } 

            });
        } catch (error) {
            console.log(error);
        }
    }
}
module.exports.LongRequest = LongRequest;