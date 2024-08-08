from google.oauth2 import service_account
from googleapiclient.discovery import build

# Replace with the path to your credentials JSON file
SERVICE_ACCOUNT_FILE = "auto-mated-fe34661e48f1.json"
SCOPES = [
    "https://www.googleapis.com/auth/documents",
    "https://www.googleapis.com/auth/drive",
]

# Authenticate and construct the services
credentials = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE, scopes=SCOPES
)
docs_service = build("docs", "v1", credentials=credentials)
drive_service = build("drive", "v3", credentials=credentials)

# Create a new Google Doc
document = docs_service.documents().create(body={"title": "My New Document"}).execute()
document_id = document["documentId"]
print(f"Created new document with ID: {document_id}")

# The text you want to insert into the document
text = "Hello, this is a sample text written into Google Docs using Python!"

# Define the request body to insert text at the end of the document
requests = [
    {
        "insertText": {
            "location": {
                "index": 1,  # Insert text after the title (which is index 0)
            },
            "text": text,
        }
    }
]

# Send the request to the Docs API to insert text
result = (
    docs_service.documents()
    .batchUpdate(documentId=document_id, body={"requests": requests})
    .execute()
)

print(f"Text inserted successfully into document: {result}")
