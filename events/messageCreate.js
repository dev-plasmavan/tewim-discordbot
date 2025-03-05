require('dotenv').config();

const { Events, MessageFlags } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const managementHistories = require('../utils/managementHistories');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp", tools: [{ googleSearch: {}, },], },);

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot) return;

        if (message.channel.id === process.env.CHANNEL_ID) {
            try {
                const messageText = message.content.trim();
                const channelId = message.channelId;
                message.channel.sendTyping()

                let conversationHistories = await managementHistories.loadConversationHistories('channel');

                if (!conversationHistories[channelId]) {
                    conversationHistories[channelId] = [];
                }

                const channelHistory = conversationHistories[channelId];
                const conversationContext = channelHistory.map(entry => ({ role: entry.role, parts: [{ text: entry.text }] }) );

                const chat = model.startChat({ history: conversationContext });
                
                const result = await chat.sendMessage(messageText);
                const responseText = result.response.text();

                channelHistory.push({ role: 'user', text: messageText });
                channelHistory.push({ role: 'model', text: responseText });

                await managementHistories.saveConversationHistories(conversationHistories, 'channel');

                await message.channel.send(responseText);
            } catch (error) {
                console.error(error);
                await message.channel.send({ content: 'There was an error while executing this command.', flags: MessageFlags.Ephemeral });
            }
        }
    }
}
