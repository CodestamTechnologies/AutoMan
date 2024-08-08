import google.generativeai as genai
from doc_writeer import GoogleDocManager


class GeminiAnalyzer:
    def __init__(self, api_key):
        self.api_key = api_key
        self.setup_gemini()

    def setup_gemini(self):
        genai.configure(api_key=self.api_key)
        generation_config = {"candidate_count": 1, "temperature": 1.0, "top_p": 0.7}
        safety_settings = [
            {"category": "HARM_CATEGORY_DANGEROUS", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
        ]
        self.model = genai.GenerativeModel(
            "gemini-pro",
            generation_config=generation_config,
            safety_settings=safety_settings,
        )

    def analyze_prompt(self, prompt):
        response = self.model.generate_content(
            f"""
            Summarize the detailed information into precise bullet points for {prompt}

            - VC Name (Percentage of women team.)
            - Fund Size: [Fund Size Information]
            - HQ Geography: [Geography Information]
            - Cheque Size: [Cheque Size Information]
            - Partner with Thesis: [Partner Name, Title]
            - Other Partners: [Partner Names]
            - Recent Investments: [Recent Investments]
            - Quote: [Quote]

            Ensure that each bullet point includes a source link for verification.
            """
        )

        return response.text


def main():
    gemini_api_key = "gemini api"
    analyzer = GeminiAnalyzer(gemini_api_key)

    prompt = input("Enter the name: ")
    analysis = analyzer.analyze_prompt(prompt)
    print("Gemini API analysis:")
    print(analysis)

    CLIENT_SECRETS_FILE = "credentials.json"
    SCOPES = [
        "https://www.googleapis.com/auth/documents",
        "https://www.googleapis.com/auth/drive",
    ]
    TITLE = prompt

    # Create an instance of GoogleDocManager
    doc_manager = GoogleDocManager(CLIENT_SECRETS_FILE, SCOPES)

    # Create a new document
    document_id, doc_link = doc_manager.create_document(TITLE)
    print(f"Created new document with ID: {document_id}")
    print(f"Document link: {doc_link}")

    # Insert text into the document
    result = doc_manager.insert_text(document_id, analysis)
    print(f"Text inserted successfully into document: {result}")
    print(f"Updated document link: {doc_link}")


if __name__ == "__main__":
    main()