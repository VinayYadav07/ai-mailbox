# AI Mailbox - Smart Email App with AI

This is my AI Mailbox project made with React, Firebase and Gemini AI.
In this app user can send and receive mails, and AI reads every mail. AI tells the priority, finds tasks, deadlines and meetings, and writes reply for the mail.

**Live Link:** https://ai-mailbox-eight.vercel.app

![Inbox](screenshots/ai-mailbox-inbox.webp)

## Features

- Sign up and login using Firebase Authentication
- Send and receive mails between users
- Inbox updates live when new mail comes
- AI gives short summary of every mail
- AI gives priority to every mail (Urgent, Important or Normal)
- AI finds tasks, deadlines and meetings from the mail
- AI writes reply and can change tone (Professional, Friendly or Concise)
- Search mails in simple English, like "mails from priya about invoice"
- Daily briefing page with urgent mails, tasks and meetings
- Follow-ups page and action center for pending work
- If Gemini is not working, app still works with simple offline rules

## Tech Used

- React.js
- JavaScript
- Vite
- React Router
- React Bootstrap
- Context API
- Firebase Authentication
- Firestore Database
- Gemini AI API
- Vercel

## Screenshots

| Read Mail with AI                                   | Daily Briefing                                          |
| --------------------------------------------------- | ------------------------------------------------------- |
| ![Read mail](screenshots/ai-mailbox-read-mail.webp) | ![Daily briefing](screenshots/ai-mailbox-briefing.webp) |

| Compose with AI                                 |
| ----------------------------------------------- |
| ![Compose](screenshots/ai-mailbox-compose.webp) |

## What I Learned

- How to use AI in a real project
- How to write prompt so AI gives answer in JSON
- How to keep API key safe on server side
- How to get live data from Firestore

## Problems I Faced

- Sometimes AI was giving extra text with JSON. I removed that text before reading it.
- When free AI limit was over, nothing was showing. I added simple offline rules, now app works without AI also.
- AI was checking same mail again and again. I saved AI result in Firestore, now it runs only one time.

## Future Plans

- Add attachments in mail
- Add calendar for meetings
- Send notification for urgent mails

## How to Run

1. Clone the project

```bash
git clone https://github.com/VinayYadav07/ai-mailbox.git
cd ai-mailbox
```

2. Install packages

```bash
npm install
```

3. Make a `.env` file in the main folder and add your Firebase details and Gemini key

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_DATABASE_URL=your_database_url
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

GEMINI_API_KEY=your_gemini_key
AI_MODEL=gemini-3.1-flash-lite
```

4. Start the project

```bash
npm run dev
```

5. Open http://localhost:5173 in browser

## Made By

**Vinay Kumar Yadav**

- Portfolio: https://portfolio-rho-red-54.vercel.app
- LinkedIn: https://www.linkedin.com/in/vinay-yadav-593b53329
- GitHub: https://github.com/VinayYadav07
