import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { getDemoMails } from "../ai/demoMails";

function newestFirst(a, b) {
  return (b.createdAt || 0) - (a.createdAt || 0);
}

function getMailsFromSnapshot(snapshot) {
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).sort(newestFirst);
}

export const useMail = () => {
  const sendMail = async ({ from, to, subject, body, replyOf = null }) => {
    if (!from || !to || !subject || !body) {
      throw new Error("All fields are required");
    }

    await addDoc(collection(db, "mails"), {
      from,
      to,
      subject,
      body,
      receiverRead: false,
      senderRead: false,
      replyOf,
      createdAt: Date.now(),
    });

    // reply hai to purani mail ko replied mark karo (follow-ups me kaam aata hai)
    if (replyOf) {
      try {
        await updateDoc(doc(db, "mails", replyOf), { replied: true, repliedAt: Date.now() });
      } catch (error) {
        console.log("Could not mark as replied", error);
      }
    }
  };

  // live listener, nayi mail aate hi list khud update hoti hai
  const listenInbox = (email, onChange) => {
    const q = query(collection(db, "mails"), where("to", "==", email));
    return onSnapshot(
      q,
      (snapshot) => onChange(getMailsFromSnapshot(snapshot)),
      (error) => console.error("Inbox error:", error),
    );
  };

  const listenSent = (email, onChange) => {
    const q = query(collection(db, "mails"), where("from", "==", email));
    return onSnapshot(
      q,
      (snapshot) => onChange(getMailsFromSnapshot(snapshot)),
      (error) => console.error("Sent error:", error),
    );
  };

  const markAsRead = async (mailId, type) => {
    const mailRef = doc(db, "mails", mailId);
    if (type === "inbox") {
      await updateDoc(mailRef, { receiverRead: true });
    } else if (type === "sent") {
      await updateDoc(mailRef, { senderRead: true });
    }
  };

  const deleteMail = async (mailId) => {
    await deleteDoc(doc(db, "mails", mailId));
  };

  // AI ka result mail me hi save karo, taaki same mail pe AI dobara na chale
  const saveAiResult = async (mailId, aiResult) => {
    await updateDoc(doc(db, "mails", mailId), { ai: { ...aiResult, checkedAt: Date.now() } });
  };

  const markTaskDone = async (mail, taskIndex, done) => {
    const actions = mail.ai.actions.map((item, index) => (index === taskIndex ? { ...item, done } : item));
    await updateDoc(doc(db, "mails", mail.id), { ai: { ...mail.ai, actions } });
  };

  const markReplied = async (mailId) => {
    await updateDoc(doc(db, "mails", mailId), { replied: true });
  };

  const addDemoMails = async (email) => {
    const mails = getDemoMails(email);
    for (const mail of mails) {
      await addDoc(collection(db, "mails"), mail);
    }
  };

  return {
    sendMail,
    listenInbox,
    listenSent,
    markAsRead,
    deleteMail,
    saveAiResult,
    markTaskDone,
    markReplied,
    addDemoMails,
  };
};
