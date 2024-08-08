from google.oauth2 import credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build


class GoogleDocManager:
    def __init__(self, client_secrets_file, scopes):
        self.client_secrets_file = client_secrets_file
        self.scopes = scopes
        self.creds = self.authenticate()
        self.docs_service = build("docs", "v1", credentials=self.creds)
        self.drive_service = build("drive", "v3", credentials=self.creds)

    def authenticate(self):
        flow = InstalledAppFlow.from_client_secrets_file(
            self.client_secrets_file, self.scopes
        )
        creds = flow.run_local_server(port=0)
        return creds

    def create_document(self, title):
        document = self.docs_service.documents().create(body={"title": title}).execute()
        document_id = document["documentId"]
        doc_link = f"https://docs.google.com/document/d/{document_id}"
        return document_id, doc_link

    def insert_text(self, document_id, text):
        requests = [
            {
                "insertText": {
                    "location": {
                        "index": 1,  # Insert text after the title (index 0)
                    },
                    "text": text,
                }
            }
        ]
        result = (
            self.docs_service.documents()
            .batchUpdate(documentId=document_id, body={"requests": requests})
            .execute()
        )
        return result


def main():
    CLIENT_SECRETS_FILE = "credentials.json"
    SCOPES = [
        "https://www.googleapis.com/auth/documents",
        "https://www.googleapis.com/auth/drive",
    ]
    TITLE = "DocMan test"
    TEXT = "Hello, this is a sample text written into Google Docs using Python!"

    doc_manager = GoogleDocManager(CLIENT_SECRETS_FILE, SCOPES)
    document_id, doc_link = doc_manager.create_document(TITLE)
    print(f"Created new document with ID: {document_id}")
    print(f"Document link: {doc_link}")

    result = doc_manager.insert_text(document_id, TEXT)
    print(f"Text inserted successfully into document: {result}")
    print(f"Updated document link: {doc_link}")


if __name__ == "__main__":
    main()
