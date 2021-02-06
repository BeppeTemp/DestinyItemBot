# DestinyVendorBot
Questo bot permette di vedere l'inventario dell'armaiolo e di conoscere se l'oggetto in vendita è già nel tuo inventario, del ragno e di xur. 
E' prevista prima una fase di login, dopodichè è possibile effettuare le query desiderate. 
Sono prestivi anche alcuni comandi come /restart per restartare il bot, oppure /logout per vuoi uscire dal bot ed eliminare le tue credenziali d'accesso.

### If you want try the bot on Telegram
@DestinyVendorBot

## Prerequisites

- [Node.js](https://nodejs.org) version 10.14.1 or higher

    ```bash
    # determine node version
    node --version
    ```

## To run the bot

- Install modules

    ```bash
    npm install
    ```
- Install modules axios

   ```bash
    npm install axios
    ```
   
- Install modules qs
   ```bash
    npm install qs
    ```
    
- Install modules qs
   ```bash
    npm install qs
    ```
    

- Start the bot

    ```bash
    node index.js
    ```

## Testing the bot using Bot Framework Emulator

[Bot Framework Emulator](https://github.com/microsoft/botframework-emulator) is a desktop application that allows bot developers to test and debug their bots on localhost or running remotely through a tunnel.

- Install the Bot Framework Emulator version 4.9.0 or greater from [here](https://github.com/Microsoft/BotFramework-Emulator/releases)

### Connect to the bot using Bot Framework Emulator

- Launch Bot Framework Emulator
- File -> Open Bot
- Enter a Bot URL of `http://localhost:3978/api/messages`
