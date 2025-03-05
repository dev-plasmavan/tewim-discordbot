const fs = require('fs').promises;
const path = require('path');

const USER_HISTORY_FILE_PATH = path.join(__dirname, '..', 'data', 'user_conversation_histories.json');
const CHANNEL_HISTORY_FILE_PATH = path.join(__dirname, '..', 'data', 'channel_conversation_histories.json');
const MAX_HISTORY_LENGTH = 50;

function getConversationHistoriesFilePath(contextType) {
    switch(contextType) {
        case 'user':
            return USER_HISTORY_FILE_PATH;
        case 'channel':
            return CHANNEL_HISTORY_FILE_PATH;
        default:
            throw new Error(`Invalid context type: ${contextType}`);
    }
}

async function loadConversationHistories(contextType) {
    const historyFilePath = getConversationHistoriesFilePath(contextType);

    try {
        const dataDir = path.dirname(historyFilePath);
        await fs.mkdir(dataDir, { recursive: true });

        try {
            await fs.access(historyFilePath);
        } catch (accessError) {
            await fs.writeFile(historyFilePath, JSON.stringify({}), 'utf8');
            return {};
        }

        const fileContents = await fs.readFile(historyFilePath, 'utf8');
        return JSON.parse(fileContents);
    } catch (error) {
        console.error('Error loading conversation histories:', error);
        return {};
    }
}

async function saveConversationHistories(conversationHistories, contextType) {
    const historyFilePath = getConversationHistoriesFilePath(contextType);

    try {
        Object.keys(conversationHistories).forEach(key => {
            if (conversationHistories[key].length > MAX_HISTORY_LENGTH) {
                conversationHistories[key] = conversationHistories[key]
                    .slice(-MAX_HISTORY_LENGTH);
            }
        });
        
        await fs.writeFile(historyFilePath, JSON.stringify(conversationHistories, null, 2), 'utf8');
    } catch (error) {
        console.error('Error saving conversation histories:', error);
    }
}

module.exports = {
    loadConversationHistories,
    saveConversationHistories
};