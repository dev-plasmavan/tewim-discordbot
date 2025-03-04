const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(require('dotenv').config().parsed.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

module.exports = {
    data: new SlashCommandBuilder()
        .setName('talk')
        .setDescription('Talk with the bot.')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message you want to send to the bot.')
                .setRequired(true)
        )
        .addBooleanOption(option =>
            option.setName('hide')
                .setDescription('Hide the message from other users.')
                .setRequired(false)
        ),
    async execute(interaction) {
        try {
            const prompt = interaction.options.getString('message');
            const isSecret = interaction.options.getBoolean('hide') || false;

            const result = await model.generateContent(prompt);
            const responseText = result.response.text()

            if (isSecret) {
                await interaction.reply({ content: responseText, flags: MessageFlags.Ephemeral });
            } else {
                await interaction.reply(responseText);
            }
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while executing this command.', flags: MessageFlags.Ephemeral });
        }
    }
}