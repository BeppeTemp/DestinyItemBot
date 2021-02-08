# DestinyVendorBot
This bot allows you to see the inventory of the gunsmith and know if the item for sale is already in your inventory, spider and xur. 
A login phase is provided first, after which it is possible to carry out the desired queries. 
There are also some commands such as /restart to restart the bot, or /logout to want to exit the bot and delete your login credentials.

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
