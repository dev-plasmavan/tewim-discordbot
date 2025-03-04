const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

async function urlToGenerativePart(url, mimeType) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const base64Data = Buffer.from(response.data).toString('base64');
        
        return {
            inlineData: {
                data: base64Data,
                mimeType: mimeType || response.headers['content-type']
            }
        };
    } catch (error) {
        console.error('Error fetching image:', error);
        throw error;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('image')
        .setDescription('Talk with the bot using an image.')
        .addAttachmentOption(option =>
            option.setName('attachment')
                .setDescription('The image you want the bot to describe.')
                .setRequired(true)
        )
        .addBooleanOption(option =>
            option.setName('hide')
                .setDescription('Hide the message from other users.')
                .setRequired(false)
        ),
    async execute(interaction) {
        try {
            const isSecret = interaction.options.getBoolean('hide') || false;
            
            await interaction.deferReply({
                ephemeral: isSecret
            });
            
            const attachment = interaction.options.getAttachment('attachment');
            
            if (!attachment) {
                return interaction.editReply('No valid attachment found.');
            }
            
            const attachmentUrl = attachment.url;
            const mimeType = attachment.contentType || 'image/jpeg';
            const imagePart = await urlToGenerativePart(attachmentUrl, mimeType);
            
            const prompt = `Tell me about this image.`;
            const result = await model.generateContent([prompt, imagePart]);
            const responseText = result.response.text();
            
            if (isSecret) {
                await interaction.editReply({ content: responseText, flags: MessageFlags.Ephemeral });
            } else {    
                await interaction.editReply(responseText);
            }
        } catch (error) {
            console.error('Error in image command:', error);
            await interaction.followUp({ content: 'There was an error processing your image. Please try again.', flag: MessageFlags.Ephemeral });
        }
    }
}