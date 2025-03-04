require('dotenv').config();
const { Events, MessageFlags } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot) return;

        if (message.channel.id === process.env.CHAT_ID) {
            try {
                const messageText = message.content.trim();
                message.channel.sendTyping()

                const result = await model.generateContent(messageText);
                const responseText = result.response.text();

                await message.channel.send(responseText);
            } catch (error) {
                console.error(error);
                await message.channel.send({ content: 'There was an error while executing this command.', flags: MessageFlags.Ephemeral });
            }
        }
    }
}
