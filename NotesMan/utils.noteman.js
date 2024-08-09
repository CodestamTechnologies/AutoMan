const fs = require('fs');
const path = require('path');
const { generateSummary } = require('./gemini.noteman');

// Function to check if a file exists
const fileExists = (filePath) => {
    return new Promise((resolve) => {
        fs.access(filePath, fs.constants.F_OK, (err) => {
            resolve(!err);
        });
    });
};

// Function to ensure a directory exists, and create it if it doesn't
const ensureDirectoryExists = (dirPath) => {
    return new Promise((resolve, reject) => {
        fs.mkdir(dirPath, { recursive: true }, (err) => {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
};

// Function to read group names from a file
const readGroupNames = () => {
    return new Promise((resolve, reject) => {
        fs.readFile('groups.txt', 'utf8', (err, data) => {
            if (err) {
                return reject(new Error('Error reading group names: ' + err.message));
            }
            resolve(data.split('\n').map(name => name.trim()).filter(name => name));
        });
    });
};

// Function to save message to a file, including group name
const saveMessageToFile = async (message, folder) => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0]; // Get date in YYYY-MM-DD format
    const fileName = path.join(folder, `${dateStr}.txt`);

    try {
        // Ensure the directory exists
        await ensureDirectoryExists(folder);

        const chat = await message.getChat();
        const messageDetails = `
From: ${message.from}
Group: ${chat.name}
Timestamp: ${new Date(message.timestamp * 1000).toLocaleString()}
Body: ${message.body}
`;

        // Append message details to the file
        fs.appendFile(fileName, messageDetails, (err) => {
            if (err) {
                console.error('Error writing to file', err);
            } else {
                console.log(`Message saved to ${fileName}`);
            }
        });
    } catch (err) {
        console.error('Error processing message:', err);
    }
};

// Function to send file content as a summary
const sendFileContent = async (date, client) => {
    const dateStr = date.toISOString().split('T')[0]; // Get date in YYYY-MM-DD format
    const chatFileName = path.join('NotesMan', 'chats', `${dateStr}.txt`);
    const noteFileName = path.join('NotesMan', 'notes', `${dateStr}.txt`);

    try {
        const chatFileExists = await fileExists(chatFileName);
        const noteFileExists = await fileExists(noteFileName);

        let chatSummary = chatFileExists ? await generateSummary(chatFileName) : null;
        let notesSummary = noteFileExists ? await generateSummary(noteFileName) : null;

        if (chatSummary || notesSummary) {
            // Find chat by name
            const chats = await client.getChats();
            const targetChat = chats.find(chat => chat.name === 'Kal'); // Replace 'Kal' with your target chat name

            if (targetChat) {
                if (chatSummary) await targetChat.sendMessage(chatSummary);
                if (notesSummary) await targetChat.sendMessage(notesSummary);
            } else {
                console.log('Target chat not found.');
            }
        } else {
            console.log('No content to send.');
        }
    } catch (error) {
        console.error('Error sending message:', error);
    }
};

// Exporting the functions
module.exports = {
    fileExists,
    ensureDirectoryExists,
    readGroupNames,
    saveMessageToFile,
    sendFileContent
};
