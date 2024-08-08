import google.generativeai as genai


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
            f"""Format 
            """
        )

        return response.text


