import { useEffect, useRef } from "react";
import { useAuth } from "../store/AuthContext";
import { useMailContext } from "../store/MailContext";
import { useMail } from "../hooks/useMail";
import ai from "../ai/aiHelper";

// ye screen pe kuch nahi dikhata
// bas inbox, sent ko live sunta hai aur nayi mail ko AI se check karwata hai
const MailListener = () => {
  const { user } = useAuth();
  const { state, dispatch } = useMailContext();
  const { listenInbox, listenSent, saveAiResult } = useMail();

  const alreadyAdded = useRef([]);
  const isRunning = useRef(false);

  useEffect(() => {
    if (!user?.email) return;

    const stopInbox = listenInbox(user.email, (mails) => dispatch({ type: "SET_MAILS", payload: mails }));
    const stopSent = listenSent(user.email, (mails) => dispatch({ type: "SET_SENT", payload: mails }));

    return () => {
      stopInbox();
      stopSent();
    };
  }, [user?.email]);

  useEffect(() => {
    if (isRunning.current) return;

    const newMails = state.mails.filter((mail) => !mail.ai && !alreadyAdded.current.includes(mail.id));
    if (newMails.length === 0) return;

    const checkMails = async () => {
      isRunning.current = true;
      newMails.forEach((mail) => alreadyAdded.current.push(mail.id));
      dispatch({ type: "AI_WORKING", payload: newMails.map((mail) => mail.id) });

      // ek ek karke, taaki AI ki free limit jaldi khatam na ho
      for (const mail of newMails) {
        try {
          const { usedAI, ...result } = await ai.analyzeMail(mail, user?.email);
          const aiResult = { ...result, usedAI };

          dispatch({ type: "SAVE_AI", payload: { id: mail.id, ai: aiResult } });
          dispatch({ type: "AI_USED", payload: usedAI });

          await saveAiResult(mail.id, aiResult);
        } catch (error) {
          console.log("AI check failed for mail", mail.id, error);
        }
      }

      dispatch({ type: "AI_WORKING", payload: [] });
      isRunning.current = false;
    };

    checkMails();
  }, [state.mails]);

  return null;
};

export default MailListener;
