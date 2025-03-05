require('dotenv').config();

const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const managementHistories = require('../utils/managementHistories');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp", tools: [{ googleSearch: {}, },], },);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('talk')
        .setDescription('Engage in a conversation with the AI bot.')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Your message to the bot.')
                .setRequired(true)
        )
        .addBooleanOption(option =>
            option.setName('hide')
                .setDescription('Send the response privately.')
                .setRequired(false)
        ),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: false });

        try {
            const prompt = interaction.options.getString('message').trim();
            const isSecret = interaction.options.getBoolean('hide') || false;
            const userId = interaction.user.id;

            let conversationHistories = await managementHistories.loadConversationHistories('user');

            if (!conversationHistories[userId]) {
                conversationHistories[userId] = [];
            }

            const channelHistory = conversationHistories[userId];
            const conversationContext = channelHistory.map(entry => ({ role: entry.role, parts: [{ text: entry.text }] }) );

            const chat = model.startChat({ history: conversationContext });
            
            const result = await chat.sendMessage(prompt);
            const responseText = result.response.text();

            channelHistory.push({ role: 'user', text: prompt });
            channelHistory.push({ role: 'model', text: responseText });

            await managementHistories.saveConversationHistories(conversationHistories, 'user');

            if (isSecret) {
                await interaction.editReply({ content: responseText, flags: MessageFlags.Ephemeral });
            } else {
                await interaction.editReply(responseText);
            }
        } catch (error) {
            console.error('Error in talk command:', error);
            await interaction.editReply({ content: 'An error occurred while processing your request.', flags: MessageFlags.Ephemeral });
        }
    }
};