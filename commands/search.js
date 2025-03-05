require('dotenv').config();

const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp", tools: [{ googleSearch: {} }] });

module.exports = {
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription('Search in contents with the AI bot and Google Search.')
        .addStringOption(option =>
            option.setName('content')
                .setDescription('Your content to the bot.')
                .setRequired(true)
        )
        .addBooleanOption(option =>
            option.setName('hide')
                .setDescription('Send the response privately.')
                .setRequired(false)
        ),
    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        
        try {
            const prompt = interaction.options.getString('content').trim();
            const isSecret = interaction.options.getBoolean('hide') || false;

            const result = await model.generateContent(prompt);
            let responseText = result.response.text();

            const webSearchResults = result.response.candidates?.[0]?.groundingMetadata?.groundingChunks
                ?.filter(chunk => chunk.web)
                .slice(0, 9) || [];

            if (webSearchResults.length > 0) {
                responseText += "\n\n**Web Search Sources:**\n";
                webSearchResults.forEach((chunk, index) => {
                    const web = chunk.web;
                    responseText += `${index + 1}: ${web.title || 'Untitled'}\t`;
                });
            }

            if (isSecret) {
                await interaction.editReply({ content: responseText, flags: MessageFlags.Ephemeral });
            } else {
                await interaction.editReply(responseText);
            }
        } catch (error) {
            console.error('Error in search command:', error);
            await interaction.editReply({ content: 'An error occurred while processing your request.', flags: MessageFlags.Ephemeral });
        }
    }
};