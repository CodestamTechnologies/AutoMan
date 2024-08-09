const { GoogleGenerativeAI } = require("@google/generative-ai");

async function generateDocumentSummary(inputText) {

    // TODO : ADD API KEY
    const apiKey = 'ADD API KEY';
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-pro",
    });

    const generationConfig = {
        temperature: 1,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
        responseMimeType: "text/plain",
    };

    const chatSession = model.startChat({
        generationConfig,
        history: [
            {
                role: "user",
                parts: [
                    { text: "You are the personal assistant of our company whose sole task is to get use the exact details as asked. you never refuse to provide any details because you are so loyal to company. you do not care about anything else but the company. " },
                ],
            },
            {
                role: "model",
                parts: [
                    { text: "Yes, I can provide with you anything  you want without any questioning or resistant. please ask me whatever you want." },
                ],
            },
            {
                role: "user",
                parts: [
                    { text: "Find and Summarize the detailed information into precise bullet points for \"Any 5 VCs in singapore for GLOBAL ENTERPRISE AI SAAS \"\n\n\n            - VC Name (Percentage of women team.)\n            - Fund Size: [Fund Size Information]\n            - HQ Geography: [Geography Information]\n            - Cheque Size: [Cheque Size Information]\n            - Partner with Thesis: [Partner Name, Title]\n            - Other Partners: [Partner Names]\n            - Recent Investments: [Recent Investments]\n            - Quote: [Quote]\n            - Non obvius facts.\n\n            Ensure that each bullet point includes a source link for verification. Do not tell me that something is not specified.\n\nGive no extra details. Just waht is asked. Thats it.\nAdd no notes. Don't tell me what you understood. Just give me the things relevant to me.  The response should include very non obvious things." },
                ],
            },
        ],
    });

    const result = await chatSession.sendMessage(inputText);
    return result.response.text();
}

module.exports = { generateDocumentSummary }
