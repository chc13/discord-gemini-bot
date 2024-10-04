require("dotenv").config();

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const GEMINI_API = process.env.GEMINI_API;
const SYSTEM_INSTRUCTION = process.env.SYSTEM_INSTRUCTION;
const MODEL = process.env.MODEL;
const BOT_STATUS = process.env.BOT_STATUS;
const TEMPERATURE = process.env.TEMPERATURE;

const { Client, GatewayIntentBits } = require("discord.js");
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
const chat = model.startChat();

client.on("ready", () => {
  console.log("Logged in as " + client.user.tag);

  client.user.setPresence({
    status: BOT_STATUS, // You can also use 'idle', 'dnd', or 'invisible'
  });
});

client.on("messageCreate", async (msg) => {
  try {
    //terminate if the message is posted in an unspecified channel
    if (msg.channel.id !== CHANNEL_ID) return;
    //terminate if the author of the message is a bot
    if (msg.author.bot) return;
    //terminate if the bot is not being mentioned
    if (!msg.mentions.has(client.user)) return;
    //terminate if the bot is mentioned at the beginning of the message
    if (!msg.content.startsWith(`<@${client.user.id}>`)) return;

    let trimmedText = msg.content
      .replace(`<@${msg.mentions.users.first().id}>`, "")
      .trim();

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
      //TODO: content[BASE_TYPE_MAX_LENGTH]: Must be 2000 or fewer in length.
      trimmedText = "Respond using less than 2000 characters. \n" + trimmedText;
      const { response } = await model.generateContent(trimmedText);
      await msg.reply({
        content: response.text(),
      });
    } else {
      //respond as a chat conversation
      //TODO: content[BASE_TYPE_MAX_LENGTH]: Must be 2000 or fewer in length.
      trimmedText = "Respond using less than 2000 characters. \n" + trimmedText;
      const result = await chat.sendMessage(trimmedText);
      const response = await result.response;
      await msg.reply({
        content: response.text(),
      });
    }
  } catch (error) {
    console.log(error);
  }
});

client.login(DISCORD_TOKEN);
