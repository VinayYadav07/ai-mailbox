// Saare AI features isi file ko call karte hai.
// Pehle Gemini (/api/ai) try karte hai, kaam na kare to offlineAI.js chalta hai.

import offlineAI from "./offlineAI";

const PRIORITIES = ["Urgent", "Important", "Normal"];

// AI kabhi koi field bhool jata hai, isliye default value
function fixAnalyzeResult(data) {
  return {
    summary: data.summary || "No summary available.",
    priority: PRIORITIES.includes(data.priority) ? data.priority : "Normal",
    priorityReason: data.priorityReason || "",
    category: data.category || "General",
    actions: (data.actions || [])
      .filter((item) => item && item.task)
      .map((item) => ({ task: item.task, deadline: item.deadline || null, dueDate: item.dueDate || null, done: false })),
    deadlines: data.deadlines || [],
    meetings: data.meetings || [],
    replyRequired: data.replyRequired === true,
    followUp: {
      isFollowUp: data.followUp?.isFollowUp === true,
      needed: data.followUp?.needed === true,
      reason: data.followUp?.reason || "",
    },
    nextStep: data.nextStep || "",
    suggestedReply: data.suggestedReply || "",
  };
}

// AI ko sirf zaroori cheezein bhejo
function shortMail(mail) {
  if (!mail) return mail;

  return {
    id: mail.id,
    from: mail.from,
    to: mail.to,
    subject: mail.subject,
    body: mail.body,
    createdAt: mail.createdAt,
    receiverRead: mail.receiverRead,
    replied: mail.replied,
    ai: mail.ai,
  };
}

async function askAI(task, data = {}) {
  const today = new Date().toDateString();
  const sendData = {
    ...data,
    today,
    mail: shortMail(data.mail),
    mails: data.mails ? data.mails.map(shortMail) : undefined,
  };

  let answer;
  let usedAI = "offline";

  // 1. pehle Gemini try karo
  try {
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task, data: sendData }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "AI request failed");
    }

    answer = result.answer;
    usedAI = result.usedAI;
  } catch (error) {
    // 2. Gemini nahi chala to offline rules
    console.log(task + ": Gemini not working, using offline AI.", error.message);
    answer = offlineAI[task](sendData);
  }

  answer = answer || {};

  if (task === "analyzeMail") {
    return { ...fixAnalyzeResult(answer), usedAI };
  }

  // search me ids hamesha list honi chahiye
  if (task === "searchMails") {
    return { ids: (answer.ids || []).map(String), explanation: answer.explanation || "", usedAI };
  }

  // briefing me sab list khaali ho sakti hai
  if (task === "dailyBriefing") {
    return {
      greeting: answer.greeting || "Hello!",
      overview: answer.overview || "",
      focus: answer.focus || "",
      urgent: answer.urgent || [],
      todo: answer.todo || [],
      meetings: answer.meetings || [],
      replies: answer.replies || [],
      usedAI,
    };
  }

  return { ...answer, usedAI };
}

export function isOffline(usedAI) {
  return !usedAI || usedAI === "offline";
}

export function getAIName(usedAI) {
  if (isOffline(usedAI)) return "Offline AI";
  return "Gemini AI";
}

// pages me seedha ai.analyzeMail(mail) likh sakte hai
const ai = {
  analyzeMail: (mail, myEmail) => askAI("analyzeMail", { mail, myEmail }),
  writeReply: (mail, tone, instruction, myEmail) => askAI("writeReply", { mail, tone, instruction, myEmail }),
  changeTone: (text, tone) => askAI("changeTone", { text, tone }),
  writeMail: (instruction, to, tone, myEmail) => askAI("writeMail", { instruction, to, tone, myEmail }),
  writeFollowUp: (mail, myEmail) => askAI("writeFollowUp", { mail, myEmail }),
  searchMails: (query, mails) => askAI("searchMails", { query, mails }),
  dailyBriefing: (mails, myEmail) => askAI("dailyBriefing", { mails, myEmail }),
};

export default ai;
