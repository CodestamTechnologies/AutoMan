const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const schedule = require('node-schedule');
const fs = require('fs');
const { generateDocumentSummary } = require('./DocMan/gemini.js');
const { createGoogleDoc } = require('./DocMan/drive.js');
const { saveMessageToFile, sendFileContent, readGroupNames } = require('./NotesMan/utils.noteman.js');

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
});

// Store target group names in memory
let targetGroupNames = [];

// Folders for different types of messages
const chatFolder = 'NotesMan/chats';
const noteFolder = 'NotesMan/notes';

client.on('ready', async () => {
  console.log('Client is ready!');
  sendFileContent(new Date(), client);
  // Ensure the folders exist
  [chatFolder, noteFolder].forEach(folder => {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
  });

  try {
    targetGroupNames = await readGroupNames();
    console.log('Target group names loaded:', targetGroupNames);

    // Schedule message for 7:44 PM (current day)
    schedule.scheduleJob('44 19 * * *', () => {
      sendFileContent(new Date(), client);
    });

    // Schedule message for 7 AM (previous day)
    schedule.scheduleJob('0 7 * * *', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      sendFileContent(yesterday, client);
    });

  } catch (error) {
    console.error('Error reading group names:', error);
  }
});

client.on('message', async (message) => {
  const { from, to, notifyName, hasMedia, body, deviceType } = message;

  console.log({
    To: to,
    From: from,
    NotifyName: notifyName,
    HasMedia: hasMedia,
    Body: body,
    DeviceType: deviceType,
  });

  // DocMan Related Code
  if (message.body.startsWith('@DocMan')) {
    const prompt = message.body.slice('@DocMan'.length).trim(); // Extract the prompt from the message

    try {
      const content = await generateDocumentSummary(prompt);
      const link = await createGoogleDoc(content);
      console.log(link);
      client.sendMessage(message.from, link);
    } catch (error) {
      console.error('An error occurred while processing DocMan command:', error);
    }
  }

  // NoteMan related Code
  const chat = await message.getChat();
  if (chat.isGroup && targetGroupNames.includes(chat.name)) {
    try {
      if (message.body.includes('@note')) {
        // Save @note messages to the notes folder
        await saveMessageToFile(message, noteFolder);
      }
      await saveMessageToFile(message, chatFolder);
    } catch (error) {
      console.error('Error saving message to file:', error);
    }
  }
});

client.initialize();
