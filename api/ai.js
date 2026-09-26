// Ye file server pe chalti hai (Vercel pe), browser me nahi.
// Isliye Gemini ki API key yahan safe rehti hai, kisi ko dikhti nahi.

const MODEL = process.env.AI_MODEL || "gemini-3.1-flash-lite";

// mail ke html ko simple text me badalna
function cleanHtml(html = "") {
  return String(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li)>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim()
    .slice(0, 5000);
}

function mailText(mail = {}) {
  return `From: ${mail.from}\nTo: ${mail.to}\nSubject: ${mail.subject}\n\n${cleanHtml(mail.body)}`;
}

// search aur briefing ke liye saari mails ka chhota version
function allMailsText(mails = []) {
  return mails
    .slice(0, 50)
    .map((mail) =>
      JSON.stringify({
        id: mail.id,
        from: mail.from,
        subject: mail.subject,
        unread: !mail.receiverRead,
        replied: mail.replied === true,
        priority: mail.ai?.priority,
        summary: mail.ai?.summary,
        tasks: mail.ai?.actions,
        meetings: mail.ai?.meetings,
        replyRequired: mail.ai?.replyRequired,
      }),
    )
    .join("\n");
}

const TONES = {
  Professional: "polite and formal",
  Friendly: "warm and casual",
  Concise: "very short, 1 to 3 sentences",
};

// har feature ke liye AI ko kya bolna hai
function makePrompt(task, data) {
  const tone = data.tone || "Professional";

  if (task === "analyzeMail") {
    return `Today is ${data.today}. I am ${data.myEmail}. Read this email and reply only in JSON:
{
  "summary": "1-2 simple sentences",
  "priority": "Urgent" or "Important" or "Normal",
  "priorityReason": "short reason",
  "category": "Work" or "Meeting" or "Finance" or "Personal" or "General",
  "actions": [{ "task": "short task", "deadline": "like Friday or null", "dueDate": "YYYY-MM-DD or null" }],
  "deadlines": [{ "label": "what is due", "date": "like Friday", "dueDate": "YYYY-MM-DD or null" }],
  "meetings": [{ "title": "short title", "when": "like Monday 10 am", "date": "YYYY-MM-DD or null" }],
  "replyRequired": true or false,
  "followUp": { "isFollowUp": true or false, "needed": true or false, "reason": "short reason" },
  "nextStep": "one next step for me",
  "suggestedReply": "reply text or empty string"
}
Urgent = urgent words or deadline in 24 hours. Important = tasks, deadlines or meetings. Normal = only information.

EMAIL:
${mailText(data.mail)}`;
  }

  if (task === "writeReply") {
    return `Write a reply from ${data.myEmail} to this email. Tone: ${TONES[tone]}.
${data.instruction ? "The reply should say: " + data.instruction : "Answer all the points in the email."}
Reply only in JSON: { "reply": "text" }

EMAIL:
${mailText(data.mail)}`;
  }

  if (task === "changeTone") {
    return `Rewrite this email in a ${TONES[tone]} tone. Keep names and dates same.
Reply only in JSON: { "text": "new email text" }

EMAIL:
${data.text}`;
  }

  if (task === "writeMail") {
    return `Write a new email from ${data.myEmail} to ${data.to || "the receiver"}. Tone: ${TONES[tone]}.
The email should say: ${data.instruction}
Reply only in JSON: { "subject": "short subject", "body": "email text" }`;
  }

  if (task === "writeFollowUp") {
    return `${data.myEmail} sent this email and got no reply. Write a short polite follow-up.
Reply only in JSON: { "subject": "subject", "body": "email text" }

EMAIL:
${mailText(data.mail)}`;
  }

  if (task === "searchMails") {
    return `The user is searching the inbox: "${data.query}". Find matching emails by meaning, sender and priority.
Reply only in JSON: { "ids": ["id1", "id2"], "explanation": "one short line" }

EMAILS:
${allMailsText(data.mails)}`;
  }

  if (task === "dailyBriefing") {
    return `Today is ${data.today}. Make a daily inbox briefing for ${data.myEmail}. Reply only in JSON:
{
  "greeting": "greeting with first name",
  "overview": "2-3 sentences about the inbox",
  "focus": "what to do first and why",
  "urgent": [{ "mailId": "", "from": "", "subject": "", "summary": "" }],
  "todo": [{ "task": "", "due": "like Friday or No deadline", "mailId": "" }],
  "meetings": [{ "title": "", "when": "", "mailId": "" }],
  "replies": [{ "mailId": "", "from": "", "subject": "" }]
}

EMAILS:
${allMailsText(data.mails)}`;
  }

  return null;
}

// Gemini se answer lena
async function askGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": process.env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, responseMimeType: "application/json" },
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error?.message || "Gemini error");
  }

  const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

  // kabhi AI ```json laga deta hai, usko hata do
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

// vite.config.js bhi isko use karta hai (laptop pe chalane ke liye)
export async function runAI(task, data = {}) {
  const prompt = makePrompt(task, data);

  if (!prompt) {
    const error = new Error("Unknown task");
    error.status = 400;
    throw error;
  }

  if (!process.env.GEMINI_API_KEY) {
    const error = new Error("GEMINI_API_KEY not found");
    error.status = 503;
    throw error;
  }

  const answer = await askGemini(prompt);
  return { usedAI: "gemini", answer };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const result = await runAI(body.task, body.data);
    res.status(200).json(result);
  } catch (error) {
    console.log("AI error:", error.message);
    res.status(error.status || 500).json({ error: error.message });
  }
}
