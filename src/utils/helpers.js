// chhote helper functions jo kai pages me use hote hai

export function removeHtml(html = "") {
  return String(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h\d)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// "rahul.sharma@gmail.com" se "Rahul Sharma" banao
export function getNameFromEmail(email, defaultName = "there") {
  if (!email) return defaultName;

  const firstPart = email.split("@")[0];
  const words = firstPart
    .replace(/[0-9]/g, "")
    .split(/[._\-+]/)
    .filter((word) => word !== "");

  if (words.length === 0) return defaultName;

  return words.map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");
}

export function getTimeAgo(time) {
  if (!time) return "";

  const minutes = Math.round((Date.now() - time) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(time).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// AI ka plain text html me, taaki mail sahi dikhe
export function textToHtml(text = "") {
  const safeText = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return safeText
    .split(/\n{2,}/)
    .map((para) => `<p>${para.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

// date aane me kitne din bache (minus matlab late)
export function getDaysLeft(date) {
  if (!date) return null;

  const dueDay = new Date(date);
  dueDay.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = Math.round((dueDay - today) / (24 * 60 * 60 * 1000));
  return Number.isNaN(days) ? null : days;
}

export function getDueText(date, defaultText = "No deadline") {
  const days = getDaysLeft(date);

  if (days === null) return defaultText;
  if (days < 0) return `Overdue by ${-days}d`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

// sort karne ke liye - Urgent sabse upar
export const priorityOrder = { Urgent: 1, Important: 2, Normal: 3 };
