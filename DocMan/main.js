const { google } = require('googleapis');
const { GoogleAuth } = require('google-auth-library');
const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
} = require("@google/generative-ai");

class GoogleDocManager {
    constructor() {
        this.SERVICE_ACCOUNT_FILE = "DocMan/auto-mated-fe34661e48f1.json";
        this.SCOPES = [
            "https://www.googleapis.com/auth/documents",
            "https://www.googleapis.com/auth/drive",
        ];
    }

    async initialize() {
        try {
            // Authenticate using the service account credentials
            const auth = new GoogleAuth({
                keyFile: this.SERVICE_ACCOUNT_FILE,
                scopes: this.SCOPES,
            });

            this.authClient = await auth.getClient();

            // Initialize Google Docs and Drive API clients
            this.docs = google.docs({ version: 'v1', auth: this.authClient });
            this.drive = google.drive({ version: 'v3', auth: this.authClient });
        } catch (error) {
            console.error('Error initializing Google API clients:', error);
            throw error;
        }
    }

    async createDocument(title) {
        try {
            const res = await this.docs.documents.create({
                requestBody: { title: title }
            });
            const documentId = res.data.documentId;
            const docLink = `https://docs.google.com/document/d/${documentId}`;
            
            // Make the document public
            await this.makeDocumentPublic(documentId);

            return { documentId, docLink };
        } catch (error) {
            console.error('Error creating document:', error);
            throw error;
        }
    }

    async makeDocumentPublic(documentId) {
        try {
            await this.drive.permissions.create({
                fileId: documentId,
                requestBody: {
                    type: 'anyone',
                    role: 'reader',
                },
            });
        } catch (error) {
            console.error('Error making document public:', error);
            throw error;
        }
    }

    async insertText(documentId, text) {
        try {
            const res = await this.docs.documents.batchUpdate({
                documentId: documentId,
                requestBody: {
                    requests: [{
                        insertText: {
                            location: { index: 1 },
                            text: text
                        }
                    }]
                }
            });
            return res.data;
        } catch (error) {
            console.error('Error inserting text:', error);
            throw error;
        }
    }
}

async function analyzePromptWithGemini(apiKey, prompt) {
    const model = new GoogleGenerativeAI({
        apiKey: apiKey,
        generationConfig: {
            candidateCount: 1,
            temperature: 1.0,
            topP: 0.7,
        },
        safetySettings: [
            { category: HarmCategory.DANGEROUS, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
    });

    const response = await model.generateText({
        prompt: `
            Summarize the detailed information into precise bullet points for ${prompt}
      
            - VC Name (Percentage of women team.)
            - Fund Size: [Fund Size Information]
            - HQ Geography: [Geography Information]
            - Cheque Size: [Cheque Size Information]
            - Partner with Thesis: [Partner Name, Title]
            - Other Partners: [Partner Names]
            - Recent Investments: [Recent Investments]
            - Quote: [Quote]
      
            Ensure that each bullet point includes a source link for verification.
        `,
        maxOutputTokens: 2048,
        temperature: 0.5,
        topP: 0.9,
    });

    return response.text;
}

async function analyzeAndCreateDoc(prompt) {
    try {
        const apiKey = "gemini api"; // Replace with your actual API key
        const analysis = await analyzePromptWithGemini(apiKey, prompt);

        const docManager = new GoogleDocManager();
        await docManager.initialize(); // Ensure clients are initialized
        const { documentId, docLink } = await docManager.createDocument(prompt);
        const insertResult = await docManager.insertText(documentId, analysis);

        return {
            analysis: analysis,
            documentId: documentId,
            docLink: docLink,
            insertResult: insertResult
        };
    } catch (error) {
        console.error('Error during document analysis and creation:', error);
        throw error;
    }
}

// At the end of analyzer.js
module.exports = { analyzeAndCreateDoc };
