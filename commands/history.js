const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } = require('discord.js');

const managementHistories = require('../utils/managementHistories');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('history')
        .setDescription('Manage the history of bot conversations')
        .addStringOption(option =>
            option.setName('action')
                .setDescription('What do you want to do?')
                .setRequired(true)
                .addChoices(
                    { name: 'Get Histories', value: 'getHistories' },
                    { name: 'Clear Histories', value: 'clearHistories' },
                )
        ),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const selectedAction = interaction.options.getString('action');
            const userId = interaction.user.id;

            let conversationHistories = await managementHistories.loadConversationHistories('user');

            if (!conversationHistories[userId]) {
                conversationHistories[userId] = [];
            }

            const channelHistory = conversationHistories[userId];
            const conversationContext = channelHistory.map(entry => ({ role: entry.role, parts: [{ text: entry.text }] }) );

            if (conversationContext.length === 0) {
                await interaction.editReply({ content: 'You don\'t have any conversation history yet.', });
                return;
            }

            switch (selectedAction) {
                case 'getHistories':
                    const exportText = JSON.stringify(conversationContext, null, 2);
                    const exportFile = new AttachmentBuilder(
                        Buffer.from(exportText), 
                        { name: `${userId}_user_conversation_history.json` }
                    );
                    
                    const exampleEmbed = new EmbedBuilder()
                        .setTitle('Got Chat Histories')
                        .setDescription(`Got conversation history for user ${userId}`);
                    
                    await interaction.editReply({ embeds: [exampleEmbed], files: [exportFile]});
                    
                    break;
                case 'clearHistories':
                    conversationHistories[userId] = [];
                    await managementHistories.saveConversationHistories(conversationHistories, 'user');
                    await interaction.editReply({ content: 'Your conversation history has been cleared.',});

                    break;
                default:
                    await interaction.editReply({ content: 'Invalid action selected.',});
            }
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: 'There was an error while executing this command.' });
        }
    }
};