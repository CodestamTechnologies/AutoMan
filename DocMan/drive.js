const { google } = require('googleapis');
const path = require('path');

class GoogleDocManager {
    constructor(serviceAccountFile, scopes) {
        this.serviceAccountFile = serviceAccountFile;
        this.scopes = scopes;
        this.creds = this.authenticate();
        this.docsService = google.docs({ version: 'v1', auth: this.creds });
        this.driveService = google.drive({ version: 'v3', auth: this.creds });
    }

    authenticate() {
        const auth = new google.auth.GoogleAuth({
            keyFile: this.serviceAccountFile,
            scopes: this.scopes,
        });
        return auth;
    }

    async createDocument(title) {
        const document = await this.docsService.documents.create({
            requestBody: {
                title: title,
            },
        });

        const documentId = document.data.documentId;
        const docLink = `https://docs.google.com/document/d/${documentId}`;
        return { documentId, docLink };
    }

    async insertText(documentId, text) {
        const requests = [
            {
                insertText: {
                    location: {
                        index: 1, // Insert text after the title (index 0)
                    },
                    text: text,
                },
            },
        ];

        const result = await this.docsService.documents.batchUpdate({
            documentId: documentId,
            requestBody: {
                requests: requests,
            },
        });
        return result.data;
    }

    async makeDocumentPublic(documentId) {
        const permissions = {
            type: 'anyone',
            role: 'reader',
        };
        const result = await this.driveService.permissions.create({
            resource: permissions,
            fileId: documentId,
            fields: 'id',
        });
        return result.data;
    }
}

async function createGoogleDoc(content) {
    const SERVICE_ACCOUNT_FILE = path.join(__dirname, 'meetman-bf762-8d3ecc91b4d9.json'); // Replace with your service account key file
    const SCOPES = [
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/drive',
    ];
    const TITLE = 'Generated AI VC Summary';

    const docManager = new GoogleDocManager(SERVICE_ACCOUNT_FILE, SCOPES);

    const { documentId, docLink } = await docManager.createDocument(TITLE);
    console.log(`Created new document with ID: ${documentId}`);
    console.log(`Document link: ${docLink}`);

    await docManager.insertText(documentId, content);
    console.log('Generated content inserted successfully into document.');

    await docManager.makeDocumentPublic(documentId);
    console.log('Document made public.');
    console.log(`Public document link: ${docLink}`);
    return docLink
}

module.exports = { createGoogleDoc }
