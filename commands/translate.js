const { SlashCommandBuilder, ActionRowBuilder, ComponentType, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageFlags } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(require('dotenv').config().parsed.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

module.exports = {
    data: new SlashCommandBuilder()
        .setName('translate')
        .setDescription('Translate a message to the bot.')
        .addStringOption(option =>
            option.setName('text')
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
            const inputtedText = interaction.options.getString('text');
            
            const languageSelectMenu = new StringSelectMenuBuilder()
                .setCustomId('language')
                .setPlaceholder('Select a language')
                .addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel('English')
                        .setValue('en'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Spanish')
                        .setValue('es'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('French')
                        .setValue('fr'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('German')
                        .setValue('de'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Italian')
                        .setValue('it'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Japanese')
                        .setValue('ja'),
                )
            
            const row = new ActionRowBuilder()
                .addComponents(languageSelectMenu)

            await interaction.reply({
                content: `Select a language to translate the text: ${inputtedText}`,
                components: [row],
            });
            const userResponse = await interaction.fetchReply();

            const collector = userResponse.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 60000 });

            collector.on('collect', async i => {
                const isSecret = interaction.options.getBoolean('hide') || false;
                const selection = i.values[0];
                const prompt = `Translate the following sentences: ${inputtedText}, directly into ${selection}, without descriptions or details.`;

                try {
                    const result = await model.generateContent(prompt);
                    const responseText = result.response.text();

                    await userResponse.delete();
        
                    if (isSecret) {
                        await i.reply({ content: responseText, flags: MessageFlags.Ephemeral });
                    } else {
                        await i.reply(responseText);
                    }
                } catch (error) {
                    console.error(error);
                    await i.reply({ content: 'There was an error while executing this command.', flags: MessageFlags.Ephemeral });
                }
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while executing this command.', flags: MessageFlags.Ephemeral });
        }
    },
};