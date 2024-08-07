const qrcode = require('qrcode-terminal');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
  console.log('Client is ready!');
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

  if (message.body === '!ping') {
    await message.reply('pong');
  }

  if (message.body === '!send-media') {
    const media = MessageMedia.fromFilePath('./index.js');
    await client.sendMessage(message.from, media);
  }
});

const verifyAndLog = async (number) => {
  try {
    const sanitizedNumber = number.toString().replace(/\D/g, "");
    const finalNumber = `91${sanitizedNumber.slice(-10)}`;
    
    const numberDetails = await client.getNumberId(finalNumber);
    
    if (!numberDetails) {
      console.log(`${finalNumber} is not on WhatsApp`);
      return;
    }

    const isRegistered = await client.isRegisteredUser(numberDetails._serialized);

    if (isRegistered) {
      console.log(`User with number ${finalNumber} is registered on WhatsApp.`);
      // Uncomment the following code to send the message
      /*
      const media = MessageMedia.fromFilePath('./public/demo.jpg');
      await client.sendMessage(numberDetails._serialized, media, {
        caption: CAPTION
      });
      */
    } else {
      console.log(`${finalNumber} is not a registered user.`);
    }
  } catch (error) {
    console.error(`Failed to verify and log the number ${number}:`, error);
  }
};

client.initialize();
