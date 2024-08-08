import os
from datetime import datetime, timedelta
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
import google.generativeai as genai

# Set up Google Calendar API credentials
SCOPES = ['https://www.googleapis.com/auth/calendar']

def get_calendar_service():
    creds = None
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        with open('token.json', 'w') as token:
            token.write(creds.to_json())
    return build('calendar', 'v3', credentials=creds)

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
            "gemini-pro", generation_config=generation_config, safety_settings=safety_settings
        )

    def analyze_prompt(self, prompt):
        response = self.model.generate_content(
            f"Analyze this scheduling prompt and extract the following information: date, time, duration, and email address. Return the results in a structured format with clear labels. For the date, use the format DD/MM/YYYY. Prompt: {prompt}"
        )
        return response.text

def create_event(service, start_time, end_time, email, summary="Scheduled Meeting"):
    event = {
        'summary': summary,
        'start': {
            'dateTime': start_time.isoformat(),
            'timeZone': 'Your/Timezone',
        },
        'end': {
            'dateTime': end_time.isoformat(),
            'timeZone': 'Your/Timezone',
        },
        'attendees': [
            {'email': email},
        ],
    }
    event = service.events().insert(calendarId='primary', body=event).execute()
    print(f"Event created: {event.get('htmlLink')}")

def parse_analysis(analysis):
    print("Raw Gemini API output:")
    print(analysis)
    
    # Split the analysis into lines
    lines = analysis.split('\n')
    data = {}
    for line in lines:
        if ':' in line:
            key, value = line.split(':', 1)
            key = key.strip().lower().replace('*', '').replace('**', '')
            value = value.strip().replace('**', '')
            data[key] = value
    
    print("\nExtracted data:")
    print(data)
    
    # Parse date and time
    date_str = data.get('date', '')
    time_str = data.get('time', '')
    print(f"Date string: {date_str}")
    print(f"Time string: {time_str}")
    
    if not date_str or not time_str:
        raise ValueError("Date or time information is missing from the analysis")
    
    # Handle 'tomorrow' case
    if 'tomorrow' in date_str.lower():
        date = datetime.now().date() + timedelta(days=1)
    else:
        # Try different date formats
        date_formats = ["%d/%m/%Y", "%d-%m-%Y", "%B %d, %Y", "%d %B %Y"]
        for date_format in date_formats:
            try:
                date = datetime.strptime(date_str, date_format).date()
                break
            except ValueError:
                continue
        else:
            raise ValueError(f"Unable to parse date: {date_str}")
    
    # Try different time formats
    time_formats = ["%I%p", "%I:%M%p", "%H:%M"]
    for time_format in time_formats:
        try:
            time = datetime.strptime(time_str, time_format).time()
            break
        except ValueError:
            continue
    else:
        raise ValueError(f"Unable to parse time: {time_str}")
    
    start_time = datetime.combine(date, time)
    
    # Parse duration
    duration_str = data.get('duration', '1 hour')
    duration_parts = duration_str.split()
    duration_value = int(duration_parts[0])
    duration_unit = duration_parts[1] if len(duration_parts) > 1 else 'hour'
    if duration_unit.lower().startswith('hour'):
        duration = timedelta(hours=duration_value)
    elif duration_unit.lower().startswith('minute'):
        duration = timedelta(minutes=duration_value)
    else:
        duration = timedelta(hours=1)  # Default to 1 hour if unit is unrecognized
    
    # Get email
    email = data.get('email address', '')
    
    return start_time, duration, email

def main():
    gemini_api_key = 'AIzaSyAkQ2RfIo-c_OTp8dqJZlDJtPQ6tSdFIAw'
    analyzer = GeminiAnalyzer(gemini_api_key)

    prompt = input("Enter your scheduling prompt: ")
    analysis = analyzer.analyze_prompt(prompt)
    print("Gemini API analysis:")
    print(analysis)

    try:
        start_time, duration, email = parse_analysis(analysis)
        end_time = start_time + duration

        print("\nExtracted information:")
        print(f"Start time: {start_time}")
        print(f"Duration: {duration}")
        print(f"Email: {email}")

        service = get_calendar_service()
        create_event(service, start_time, end_time, email)
    except Exception as e:
        print(f"\nError processing the analysis: {e}")
        print("Please check the Gemini API output format and adjust the parsing function if necessary.")

if __name__ == '__main__':
    main()