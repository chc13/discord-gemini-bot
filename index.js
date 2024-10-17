require("dotenv").config();
const ADMIN_ID = process.env.ADMIN_ID;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_LOCK = process.env.CHANNEL_LOCK;
const CHANNEL_ID = process.env.CHANNEL_ID;
const SERVER_LOCK = process.env.SERVER_LOCK;
const SERVER_ID = process.env.SERVER_ID;
const GEMINI_API = process.env.GEMINI_API;
const SYSTEM_INSTRUCTION = process.env.SYSTEM_INSTRUCTION;
const MODEL = process.env.MODEL;
const BOT_STATUS = process.env.BOT_STATUS;
const BOT_ACTIVITY = process.env.BOT_ACTIVITY;
const TEMPERATURE = process.env.TEMPERATURE;
const MESSAGE_SIZE = process.env.MESSAGE_SIZE;
const SINGLE_REPLIES = process.env.SINGLE_REPLIES;
const REQUESTS_PER_MINUTE = process.env.REQUESTS_PER_MINUTE;
const TOKENS_PER_MINUTE = process.env.TOKENS_PER_MINUTE;
const REQUESTS_PER_DAY = process.env.REQUESTS_PER_DAY;

//alternative to env
/* const API_KEY = require("./apikey.js");
const ADMIN_ID = API_KEY.ADMIN_ID;
const DISCORD_TOKEN = API_KEY.DISCORD_TOKEN;
const CHANNEL_LOCK = API_KEY.CHANNEL_LOCK;
const CHANNEL_ID = API_KEY.CHANNEL_ID;
const SERVER_LOCK = API_KEY.SERVER_LOCK;
const SERVER_ID = API_KEY.SERVER_ID;
const GEMINI_API = API_KEY.GEMINI_API;
const SYSTEM_INSTRUCTION = API_KEY.SYSTEM_INSTRUCTION;
const MODEL = API_KEY.MODEL;
const BOT_STATUS = API_KEY.BOT_STATUS;
const BOT_ACTIVITY = API_KEY.BOT_ACTIVITY;
const TEMPERATURE = API_KEY.TEMPERATURE;
const MESSAGE_SIZE = API_KEY.MESSAGE_SIZE;
const SINGLE_REPLIES = API_KEY.SINGLE_REPLIES;
const REQUESTS_PER_MINUTE = API_KEY.REQUESTS_PER_MINUTE;
const TOKENS_PER_MINUTE = API_KEY.TOKENS_PER_MINUTE;
const REQUESTS_PER_DAY = API_KEY.REQUESTS_PER_DAY; */

//cooldown variables
let rpmCount = 0;
let rpdCount = 0;
let tpmCount = 0;
let rpmDate = 0;
let rpdDate = 0;
let tpmDate = 0;

const { Client, GatewayIntentBits, ActivityType } = require("discord.js");
const {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} = require("@google/generative-ai");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

//set to lowest harm categories to avoid API errors
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

//gemini stuff
const genAI = new GoogleGenerativeAI(GEMINI_API);
const model = genAI.getGenerativeModel({
  model: MODEL,
  systemInstruction: SYSTEM_INSTRUCTION,
  generationConfig: {
    //candidateCount: 1,
    //stopSequences: ["x"],
    //maxOutputTokens: 20,
    temperature: TEMPERATURE,
  },
  safetySettings: safetySettings,
});

// Optionally specify existing chat history
/* let history = [
  ModelContent(role: "user", parts: "Hello, I have 2 dogs in my house."),
  ModelContent(role: "model", parts: "Great to meet you. What would you like to know?"),
] */

// Initialize the chat with optional chat history
let chat = model.startChat();

client.on("ready", () => {
  console.log("Logged in as " + client.user.tag);

  client.user.setPresence({
    status: BOT_STATUS, // You can also use 'idle', 'dnd', or 'invisible'
    activities: [
      {
        type: ActivityType.Custom,
        name: "customname",
        state: BOT_ACTIVITY,
      },
    ],
  });
});

client.on("messageCreate", async (msg) => {
  //API_KEY.responses(msg);

  try {
    //terminate if the message is posted in an unspecified channel
    if (Number(CHANNEL_LOCK) && msg.channel.id !== CHANNEL_ID) return;
    //terminate if the message is posted in an unspecified server
    if (Number(SERVER_LOCK) && msg.guild.id !== SERVER_ID) return;
    //terminate if the author of the message is a bot
    if (msg.author.bot) return;
    //terminate if the bot is not being mentioned
    if (!msg.mentions.has(client.user)) return;
    //terminate if the bot is not mentioned at the beginning of the message
    if (!msg.content.startsWith(`<@${client.user.id}>`)) return;

    let trimmedText = msg.content
      .replace(`<@${msg.mentions.users.first().id}>`, "")
      .trim();
    let responseTxt = "";

    if (Date.now() - rpmDate >= 60000) {
      rpmDate = Date.now();
      console.log("resetting RPM date", rpmDate);
      rpmCount = 0;
    }
    if (Date.now() - rpdDate >= 86400000) {
      rpdDate = Date.now();
      console.log("resetting RPD date", rpdDate);
      rpdCount = 0;
    }
    if (Date.now() - tpmDate >= 60000) {
      tpmDate = Date.now();
      console.log("resetting TPM date", tpmDate);
      tpmCount = 0;
    }

    if (msg.author.id == ADMIN_ID) {
      //command to check quota cooldowns
      if (trimmedText === "!quota") {
        await msg.reply(
          "RPM: " +
            rpmCount +
            "/" +
            REQUESTS_PER_MINUTE +
            "\n" +
            "RPD: " +
            rpdCount +
            "/" +
            REQUESTS_PER_DAY +
            "\n" +
            "TPM: " +
            tpmCount +
            "/" +
            TOKENS_PER_MINUTE
        );
        return;
      }

      //restarts the chat session
      if (trimmedText === "!restart") {
        /* console.log("Restarting Discord bot...");
        console.log("Restarting client...");
        client.destroy().then(() => {
          client.login(DISCORD_TOKEN);
          console.log("Client restart successful.");
        }); */
        console.log("Restarting Chat Session...");
        await msg.reply("Restarting Chat Session...");
        chat = model.startChat();
        return;
      }

      //shuts down the discord bot
      if (trimmedText === "!shutdown") {
        console.log("Shutting down...");
        await msg.reply("Shutting down...");
        client.destroy();
        return;
      }

      //bot uptime in ms
      if (trimmedText === "!uptime") {
        let days = Math.floor(client.uptime / 86400000);
        let hours = Math.floor(client.uptime / 3600000) % 24;
        let minutes = Math.floor(client.uptime / 60000) % 60;
        let seconds = Math.floor(client.uptime / 1000) % 60;
        await msg.reply(
          `__Uptime:__\n${days}d ${hours}h ${minutes}m ${seconds}s`
        );
        return;
      }
    }

    //checks quota limits and cancels operation if theyre over the set limits
    if (rpmCount >= Number(REQUESTS_PER_MINUTE)) {
      console.log("requests exceed RPM");
      await msg.reply("CAUTION: Requests exceed RPM.");
      return;
    }
    if (rpdCount >= Number(REQUESTS_PER_DAY)) {
      console.log("requests exceed RPD");
      await msg.reply("CAUTION: Requests exceed RPD.");
      return;
    }
    if (tpmCount >= Number(TOKENS_PER_MINUTE)) {
      console.log("tokens exceed TPM");
      await msg.reply("CAUTION: Token usage exceed TPM.");
      return;
    }

    rpmCount++;
    rpdCount++;

    //ask for summary of the last x messages without using chat context
    if (trimmedText === "!summary" || trimmedText === "!summarize") {
      const fetchedMessages = await msg.channel.messages.fetch({
        limit: 50,
      });

      let chatlog = "Please summarize the following chat log: \n";
      fetchedMessages
        .reverse()
        .forEach(
          (msg) => (chatlog += msg.author.tag + ": " + msg.content + "\n")
        );

      trimmedText = chatlog;

      // Count tokens in a prompt without calling text generation.
      //const countResult = await model.countTokens("hi");
      //console.log(countResult.totalTokens);

      if (Number(SINGLE_REPLIES) != 0)
        trimmedText =
          "Respond using less than " +
          Number(MESSAGE_SIZE) +
          " characters. \n" +
          trimmedText;

      //const { response } = await model.generateContent(trimmedText);
      const generateResult = await model.generateContent(trimmedText);

      console.log(generateResult.response.usageMetadata);
      tpmCount += generateResult.response.usageMetadata.totalTokenCount;

      //responseTxt = response.text();
      responseTxt = generateResult.response.text();
      /* await msg.reply({
        content: response.text(),
      }); */
    } else {
      //respond as a chat conversation

      /* const countResult = await model.countTokens({
        generateContentRequest: { contents: await chat.getHistory() },
      });
      console.log(countResult.totalTokens); // 10 */

      if (Number(SINGLE_REPLIES) != 0)
        trimmedText =
          "Respond using less than " +
          Number(MESSAGE_SIZE) +
          " characters. \n" +
          trimmedText;

      const result = await chat.sendMessage(trimmedText);

      console.log(result.response.usageMetadata);
      tpmCount += result.response.usageMetadata.totalTokenCount;

      const response = await result.response;
      responseTxt = response.text();
      /* await msg.reply({
        content: response.text(),
      }); */
    }
    //splits response into separate messages to avoid Discord limitations
    let numMsg = responseTxt.length / Number(MESSAGE_SIZE);
    numMsg = Math.ceil(numMsg);

    for (let i = 0; i < numMsg; i++) {
      if (i == numMsg - 1) {
        await msg.reply(responseTxt.substring(i * Number(MESSAGE_SIZE)));
      } else {
        await msg.reply(
          responseTxt.substring(
            i * Number(MESSAGE_SIZE),
            i * Number(MESSAGE_SIZE) + Number(MESSAGE_SIZE)
          )
        );
      }
    }

    console.log("RPM Count", rpmCount);
    console.log("RPD Count", rpdCount);
    console.log("TPM Count", tpmCount);
  } catch (error) {
    console.log(error);
    //reset ai here?
  }
});

client.login(DISCORD_TOKEN);
