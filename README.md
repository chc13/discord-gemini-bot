# Discord Gemini AI Chat Bot

Developed under Node.js, this is a simple Discord bot program utilizing Google's Gemini AI API to generate replies and chat summaries.

## Quick Start

**You'll need to provide your own _Discord Bot Token_ and _Gemini AI API Key_.**

### Install the latest version of Node.js.

[Download here](https://nodejs.org/en)

### Navigate to the source directory and install the npm dependencies.

`npm install`

### Set up your Discord bot and get its token. Make sure to enable `Message Content Intent`.

[Do that here](https://discord.com/developers/applications)

### Get your Gemini AI API key.

[Get it here](https://ai.google.dev/gemini-api/docs/api-key)

### Create and configure your .env file at the root of the directory.

```
#Discord Gemini Bot .env file
ADMIN_ID=Your.Discord.ID.Here
DISCORD_TOKEN=Your.Discord.Bot.Token.Here
CHANNEL_LOCK=0
CHANNEL_ID=Your.Channel.ID.Here
SERVER_LOCK=0
SERVER_ID=Your.Server.ID.Here
BOT_STATUS=online
BOT_ACTIVITY="Gemini AI Bot by chc13"
GEMINI_API=Your.Gemini.API.Key.Here
MODEL=gemini-1.5-flash
SYSTEM_INSTRUCTION="You are a Discord chat bot"
TEMPERATURE=1.0
MESSAGE_SIZE=2000
SINGLE_REPLIES=1
REQUESTS_PER_MINUTE=10
TOKENS_PER_MINUTE=900000
REQUESTS_PER_DAY=1000
AUTOSAVE_CHAT=1
AUTOLOAD_CHAT=1
```

### Run index.js through Node.js.

`npm run start`

## Usage

`@mention` your bot followed with a message to chat with it.

`@mention !summary` your bot to receive a summary of the last 50 messages in the Discord channel.

### Admin Only Commands

`@mention !quota` to display current quota cooldowns.

`@mention !reset` to reset to a new instance of the Gemini AI chat session.

`@mention !shutdown` to shut down the bot.

`@mention !uptime` to display current uptime.

## Dependencies

This program uses the following npm packages:

- [@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai)
- [discord.js](https://www.npmjs.com/package/discord.js)
- [dotenv](https://www.npmjs.com/package/dotenv)

## License

This project is licensed under the GPL-3.0 License
