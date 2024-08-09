const {
    GoogleGenerativeAI,
} = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");

// TODO : ADD API KEY
const apiKey = 'ADD API KEY';
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

// Function to upload a file and generate a summary using Gemini API
async function generateSummary(filePath, mimeType = 'text/plain') {
    // Upload the file
    const uploadResult = await fileManager.uploadFile(filePath, {
        mimeType,
        displayName: filePath,
    });
    const file = uploadResult.file;
    // console.log(`Uploaded file ${file.displayName} as: ${file.name}`);

    // Wait for the file to become active
    let activeFile = await fileManager.getFile(file.name);
    while (activeFile.state === "PROCESSING") {
        process.stdout.write(".");
        await new Promise((resolve) => setTimeout(resolve, 10000)); // Poll every 10 seconds
        activeFile = await fileManager.getFile(file.name);
    }

    if (activeFile.state !== "ACTIVE") {
        throw new Error(`File ${activeFile.name} failed to process`);
    }

    // console.log("...file is ready\n");

    // Start the chat session with the generative model
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-pro",
        systemInstruction:
            "You are the personal assistant. Your main task is to prepare bullet points from the given chat. Identify all the todos done today and those left for tomorrow or later. Provide an approximate ETA for them and prioritize based on urgency, importance, and deadline. **Emphasize the formatting:** Use *bold*, _italic_, ~strikethrough~, and `monospace` for all text but only where required or super important to do. No other formatting options are allowed. Keep everything concise.",
    });

    const chatSession = model.startChat({
        generationConfig: {
            temperature: 0.1,
            topP: 0.95,
            topK: 64,
            maxOutputTokens: 8192,
            responseMimeType: "text/plain",
        },
        history: [
            {
                role: "user",
                parts: [
                    {
                        fileData: {
                            mimeType: activeFile.mimeType,
                            fileUri: activeFile.uri,
                        },
                    },
                    {
                        text: "Find all the todos that are done today, what are the todos left for tomorrow or later in future. Provide approx eta for them and prioritise them as per the urgency + importance + deadline. Mention the phone number of people who are responsible. keep it concise. Since this message will be shared on whatsapp,  **Emphasize the formatting:** Use *bold*, _italic_, ~strikethrough~, and `monospace` for all text  but only where required or super important to do. No other formatting options are. Send raw text, no markdown. Allowed formatting have been mentioned. Formatting should be as minimum as possible. Keep everything concise.",
                    },
                ],
            },
        ],
    });

    const result = await chatSession.sendMessage("Find all the todos that are done today, what are the todos left for tomorrow or later in future. Provide approx eta for them and prioritise them as per the urgency + importance + deadline. Mention the phone number of people who are responsible. keep it concise. Since this message will be shared on whatsapp,  **Emphasize the formatting:** Use *bold*, _italic_, ~strikethrough~, and `monospace` for all text  but only where required or super important to do. No other formatting options are. Send raw text, no markdown. Allowed formatting have been mentioned. Formatting should be as minimum as possible. Keep everything concise.");

    return result.response.text();
}

module.exports = { generateSummary };
