// Jab Gemini AI kaam nahi karta (key nahi hai ya limit khatam),
// tab ye simple rules chalte hai taaki app band na ho.

import { removeHtml, getNameFromEmail } from "../utils/helpers";

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

const URGENT_WORDS = ["urgent", "asap", "immediately", "is down", "not working", "critical"];
const ACTION_WORDS = ["review", "send", "share", "submit", "prepare", "update", "complete", "check", "fix", "approve", "pay", "finish", "confirm", "investigate", "reply", "sign", "book", "upload", "arrange"];
const MEETING_WORDS = ["meeting", "call", "standup", "interview", "demo"];
const FOLLOW_UP_WORDS = ["reminder", "following up", "follow up", "any update", "still waiting"];
const REPLY_WORDS = ["?", "let me know", "please reply", "confirm", "can you", "could you"];

// text me koi word hai ya nahi
function hasWord(text, words) {
  const small = text.toLowerCase();
  return words.some((word) => small.includes(word));
}

// mail ko sentences me todna
// "Hi Vinay," "Thanks" aur naam wali chhoti lines hata di
function getSentences(text) {
  return text
    .split(/[.!?\n]/)
    .map((line) => line.trim())
    .filter((line) => line.split(" ").length >= 3)
    .filter((line) => !line.endsWith(","))
    .filter((line) => !/^(hi|hello|dear|hey|thanks|thank you|regards|best)\b/i.test(line));
}

// sentence ke shuru se please, also, could you jaise words hatana
function cleanStart(sentence) {
  return sentence.replace(/^(also|please|kindly|could you please|can you please|could you|can you)\s+/i, "").replace(/^(please|kindly)\s+/i, "");
}

// kaam wala sentence hai ya nahi - pehla word action word hona chahiye
function isTask(sentence) {
  const firstWord = cleanStart(sentence).split(" ")[0].toLowerCase();
  return ACTION_WORDS.includes(firstWord);
}

// meeting wala sentence
function isMeeting(sentence) {
  const small = sentence.toLowerCase();
  return MEETING_WORDS.some((word) => small.includes(word)) && (small.includes("join") || small.includes("attend") || small.includes("meeting"));
}

// "Friday", "tomorrow" ya "30 Sep" jaisa din dhoondhna
function findDayWord(sentence) {
  const small = sentence.toLowerCase();
  if (small.includes("today")) return "Today";
  if (small.includes("tomorrow")) return "Tomorrow";

  const day = DAYS.find((d) => small.includes(d));
  if (day) return day[0].toUpperCase() + day.slice(1);

  // 30 sep / 30 september
  const match = small.match(/\b(\d{1,2})\s(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*/);
  if (match) return match[1] + " " + match[2][0].toUpperCase() + match[2].slice(1);

  return null;
}

// "12 pm", "11 am" jaisa time dhoondhna
function findTime(sentence) {
  const match = sentence.match(/\b\d{1,2}(:\d{2})?\s?(am|pm)\b/i);
  return match ? match[0] : "";
}

// day word ko date me badalna (YYYY-MM-DD)
function dayToDate(word) {
  if (!word) return null;

  const date = new Date();

  if (word === "Tomorrow") {
    date.setDate(date.getDate() + 1);
  } else if (DAYS.includes(word.toLowerCase())) {
    let diff = DAYS.indexOf(word.toLowerCase()) - date.getDay();
    if (diff <= 0) diff = diff + 7;
    date.setDate(date.getDate() + diff);
  } else if (word !== "Today") {
    // "30 Sep" wala case
    const parts = word.split(" ");
    const month = MONTHS.indexOf(parts[1].toLowerCase());
    if (month === -1) return null;
    date.setMonth(month, Number(parts[0]));
  }

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function analyzeMail({ mail, myEmail }) {
  const text = removeHtml(mail?.body || "");
  const subject = mail?.subject || "";
  const sentences = getSentences(text);
  const sender = getNameFromEmail(mail?.from, "Someone");

  // tasks nikalna
  const actions = [];
  const meetings = [];

  sentences.forEach((sentence) => {
    const day = findDayWord(sentence);

    if (isMeeting(sentence)) {
      const time = findTime(sentence);
      let title = cleanStart(sentence).split(/ at | on /i)[0];
      title = title.charAt(0).toUpperCase() + title.slice(1);
      const when = [day, time].filter(Boolean).join(" ") || "Not mentioned";
      meetings.push({ title: title, when: when, date: dayToDate(day) });
    } else if (isTask(sentence)) {
      let task = cleanStart(sentence).split(/ by /i)[0];
      task = task.charAt(0).toUpperCase() + task.slice(1);
      actions.push({ task: task, deadline: day, dueDate: dayToDate(day) });
    }
  });

  const deadlines = actions
    .filter((item) => item.deadline)
    .map((item) => ({ label: item.task, date: item.deadline, dueDate: item.dueDate }));

  // priority decide karna
  let priority = "Normal";
  let priorityReason = "Only information";

  const dueToday = actions.some((item) => item.deadline === "Today");

  if (hasWord(subject + " " + text, URGENT_WORDS) || dueToday) {
    priority = "Urgent";
    priorityReason = "Mail has urgent words";
  } else if (actions.length > 0 || meetings.length > 0) {
    priority = "Important";
    priorityReason = "Mail has tasks or meeting";
  }

  const isFollowUp = hasWord(subject + " " + text, FOLLOW_UP_WORDS);
  const replyRequired = actions.length > 0 || hasWord(text, REPLY_WORDS);

  let nextStep = "No action needed";
  if (actions.length > 0) nextStep = actions[0].task;
  else if (meetings.length > 0) nextStep = "Add the meeting to your calendar";
  else if (replyRequired) nextStep = "Reply to " + sender;

  return {
    summary: sentences.slice(0, 2).join(". ") || subject,
    priority,
    priorityReason,
    category: meetings.length > 0 ? "Meeting" : "General",
    actions,
    deadlines,
    meetings,
    replyRequired,
    followUp: { isFollowUp, needed: isFollowUp && replyRequired, reason: isFollowUp ? "Sender sent a reminder" : "" },
    nextStep,
    suggestedReply: replyRequired
      ? writeReply({ mail, tone: "Professional", myEmail }).reply
      : "",
  };
}

// tone ke hisaab se start aur end
const TONE_TEXT = {
  Professional: { start: "Hello", end: "Regards" },
  Friendly: { start: "Hi", end: "Thanks a lot" },
  Concise: { start: "Hi", end: "Thanks" },
};

function writeReply({ mail, tone = "Professional", instruction = "", myEmail }) {
  const sender = getNameFromEmail(mail?.from, "there");
  const myName = getNameFromEmail(myEmail, "");
  const words = TONE_TEXT[tone] || TONE_TEXT.Professional;

  let message = instruction || "Thank you for your mail. I have noted everything and will get back to you soon.";
  if (tone === "Friendly" && !instruction) {
    message = "Thanks for the mail! I got it and will work on it soon.";
  }
  if (tone === "Concise" && !instruction) {
    message = "Noted, will update you soon.";
  }

  return { reply: `${words.start} ${sender},\n\n${message}\n\n${words.end},\n${myName}` };
}

function changeTone({ text = "", tone = "Professional" }) {
  const words = TONE_TEXT[tone] || TONE_TEXT.Professional;

  // purana hi, hello aur regards hata do
  let lines = text.split("\n").filter((line) => line.trim() !== "");
  lines = lines.filter((line) => !/^(hi|hello|dear|hey)\b/i.test(line) && !/^(regards|thanks|thank you|best)\b/i.test(line));

  let body = lines.join("\n");
  if (tone === "Concise") {
    body = getSentences(body).slice(0, 2).join(". ") + ".";
  }

  return { text: `${words.start},\n\n${body}\n\n${words.end}` };
}

function writeMail({ instruction = "", to = "", myEmail = "", tone = "Professional" }) {
  const subject = instruction.split(" ").slice(0, 6).join(" ");
  const toName = getNameFromEmail(to, "there");
  const myName = getNameFromEmail(myEmail, "");
  const words = TONE_TEXT[tone] || TONE_TEXT.Professional;

  return {
    subject: subject.charAt(0).toUpperCase() + subject.slice(1),
    body: `${words.start} ${toName},\n\n${instruction}\n\n${words.end},\n${myName}`,
  };
}

function writeFollowUp({ mail, myEmail }) {
  const toName = getNameFromEmail(mail?.to, "there");
  const myName = getNameFromEmail(myEmail, "");

  return {
    subject: "Follow up: " + (mail?.subject || ""),
    body: `Hi ${toName},\n\nI am following up on my last mail. Please let me know if you got a chance to check it.\n\nThanks,\n${myName}`,
  };
}

// simple search - har word ko mail me dhoondho
function searchMails({ query = "", mails = [] }) {
  const words = query
    .toLowerCase()
    .split(" ")
    .filter((word) => word.length > 2 && !["mails", "mail", "from", "about", "the", "with"].includes(word));

  const found = mails.filter((mail) => {
    const allText = `${mail.from} ${mail.subject} ${removeHtml(mail.body)} ${mail.ai?.priority || ""}`.toLowerCase();
    return words.every((word) => allText.includes(word));
  });

  return {
    ids: found.map((mail) => mail.id),
    explanation: `Searched for: ${words.join(", ") || "everything"}`,
  };
}

function dailyBriefing({ mails = [], myEmail }) {
  const name = getNameFromEmail(myEmail, "there");
  const unread = mails.filter((mail) => !mail.receiverRead);
  const urgentMails = mails.filter((mail) => mail.ai?.priority === "Urgent");

  const todo = [];
  const meetings = [];
  const replies = [];

  mails.forEach((mail) => {
    (mail.ai?.actions || [])
      .filter((item) => !item.done)
      .forEach((item) => todo.push({ task: item.task, due: item.deadline || "No deadline", mailId: mail.id }));

    (mail.ai?.meetings || []).forEach((item) => meetings.push({ title: item.title, when: item.when, mailId: mail.id }));

    if (mail.ai?.replyRequired && !mail.replied) {
      replies.push({ mailId: mail.id, from: mail.from, subject: mail.subject });
    }
  });

  return {
    greeting: `Good day, ${name}!`,
    overview: `You have ${mails.length} mails, ${unread.length} unread and ${urgentMails.length} urgent.`,
    focus: todo.length > 0 ? `Start with: ${todo[0].task}` : "Nothing important today.",
    urgent: urgentMails.map((mail) => ({ mailId: mail.id, from: mail.from, subject: mail.subject, summary: mail.ai?.summary })),
    todo,
    meetings,
    replies,
  };
}

const offlineAI = {
  analyzeMail,
  writeReply,
  changeTone,
  writeMail,
  writeFollowUp,
  searchMails,
  dailyBriefing,
};

export { analyzeMail };
export default offlineAI;
