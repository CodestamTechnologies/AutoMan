import os
import datetime as dt
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import openai
from dateutil import parser

SCOPES = ["https://www.googleapis.com/auth/calendar"]

# Configure your OpenAI API key
openai.api_key = "open-ai-api"

def extract_event_details(prompt):
    structured_prompt = f"""
    Extract event details from the following text: '{prompt}'.
    Please provide the details in the following format:
    title: <Event Title>
    location: <Event Location>
    description: <Event Description>
    time: <Start Time>
    end time: <End Time> (optional if duration is provided)
    duration: <Event Duration in hours> (optional if end time is provided)
    attendees: <Attendee Emails, separated by commas>
    colorId: <Color ID> (optional)
    reminders: <Method and time in minutes, separated by commas> (optional)
    recurrence: <Recurrence Rule> (optional)
    """

    response = openai.Completion.create(
        engine="text-davinci-003",
        prompt=structured_prompt,
        max_tokens=150,
        n=1,
        stop=None,
        temperature=0.5,
    )
    return response.choices[0].text.strip()

def parse_event_details(details):
    lines = details.split("\n")
    event_data = {
        "summary": "",
        "location": "",
        "description": "",
        "start_time": "",
        "end_time": "",
        "duration": "",
        "attendees": [],
        "colorId": "",
        "reminders": {
            "useDefault": False,
            "overrides": []
        },
        "recurrence": []
    }
    for line in lines:
        if "title:" in line.lower():
            event_data["summary"] = line.split(":")[1].strip()
        elif "location:" in line.lower():
            event_data["location"] = line.split(":")[1].strip()
        elif "description:" in line.lower():
            event_data["description"] = line.split(":")[1].strip()
        elif "time:" in line.lower():
            event_data["start_time"] = line.split(":")[1].strip()
        elif "end time:" in line.lower():
            event_data["end_time"] = line.split(":")[1].strip()
        elif "duration:" in line.lower():
            event_data["duration"] = line.split(":")[1].strip()
        elif "attendees:" in line.lower():
            event_data["attendees"] = [email.strip() for email in line.split(":")[1].split(",")]
        elif "colorId:" in line.lower():
            event_data["colorId"] = line.split(":")[1].strip()
        elif "reminders:" in line.lower():
            event_data["reminders"]["overrides"].append({
                "method": line.split(":")[1].strip().split()[0],
                "minutes": int(line.split(":")[1].strip().split()[1])
            })
        elif "recurrence:" in line.lower():
            event_data["recurrence"].append(line.split(":")[1].strip())
    return event_data

def schedule_event(event_data):
    creds = None

    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
            creds = flow.run_local_server(port=0)
        with open("token.json", "w") as token:
            token.write(creds.to_json())

    try:
        service = build("calendar", "v3", credentials=creds)

        start_time = parser.parse(event_data["start_time"])
        if event_data["end_time"]:
            end_time = parser.parse(event_data["end_time"])
        else:
            end_time = start_time + dt.timedelta(hours=int(event_data["duration"]))

        event = {
            "summary": event_data["summary"],
            "location": event_data["location"],
            "description": event_data["description"],
            "start": {
                "dateTime": start_time.isoformat(),
                "timeZone": "Asia/Kolkata",
            },
            "end": {
                "dateTime": end_time.isoformat(),
                "timeZone": "Asia/Kolkata",
            },
            "attendees": [{"email": email} for email in event_data["attendees"]],
            "reminders": event_data["reminders"],
            "recurrence": event_data["recurrence"],
            "colorId": event_data["colorId"],
            "conferenceData": {
                "createRequest": {
                    "conferenceSolutionKey": {"type": "hangoutsMeet"},
                    "requestId": "randomString"
                }
            },
        }
        event = service.events().insert(calendarId="primary", body=event, conferenceDataVersion=1).execute()
        print(f"Event created: {event.get('htmlLink')}")

    except HttpError as error:
        print("An error occurred:", error)

def main():
    prompt = "Schedule a google meet at 10AM tomorrow with souravvmishra@gmail.com for 1 hour"
    extracted_details = extract_event_details(prompt)
    event_data = parse_event_details(extracted_details)
    schedule_event(event_data)

if __name__ == "__main__":
    main()
