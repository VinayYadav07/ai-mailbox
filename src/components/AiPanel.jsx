import { useEffect, useState } from "react";
import { Button, Form, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext";
import { useMailContext } from "../store/MailContext";
import { useMail } from "../hooks/useMail";
import ai from "../ai/aiHelper";
import { getDueText, textToHtml } from "../utils/helpers";
import PriorityBadge from "./PriorityBadge";
import AiBadge from "./AiBadge";
import ToneButtons from "./ToneButtons";

// Mail kholne pe right side me dikhne wala AI box
const AiPanel = ({ mail }) => {
  const { user } = useAuth();
  const { dispatch } = useMailContext();
  const { saveAiResult, markTaskDone, sendMail, markReplied } = useMail();
  const navigate = useNavigate();
  const result = mail.ai;

  const [checkingAgain, setCheckingAgain] = useState(false);
  const [tone, setTone] = useState("Professional");
  const [instruction, setInstruction] = useState("");
  const [reply, setReply] = useState("");
  const [replyUsedAI, setReplyUsedAI] = useState(null);
  const [writing, setWriting] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // dusri mail khuli to AI ka suggested reply dikhao
  useEffect(() => {
    setReply(result?.suggestedReply || "");
    setReplyUsedAI(result?.usedAI || null);
    setSent(false);
  }, [mail.id, result?.suggestedReply, result?.usedAI]);

  const checkAgain = async () => {
    setCheckingAgain(true);
    const { usedAI, ...newResult } = await ai.analyzeMail(mail, user.email);
    const aiResult = { ...newResult, usedAI };
    dispatch({ type: "SAVE_AI", payload: { id: mail.id, ai: aiResult } });
    await saveAiResult(mail.id, aiResult).catch(() => {});
    setCheckingAgain(false);
  };

  const writeReply = async (newTone = tone) => {
    setTone(newTone);
    setWriting(true);
    const answer = await ai.writeReply(mail, newTone, instruction.trim(), user.email);
    setReply(answer.reply);
    setReplyUsedAI(answer.usedAI);
    setWriting(false);
  };

  const toggleTask = async (index, done) => {
    const actions = result.actions.map((item, i) => (i === index ? { ...item, done } : item));
    dispatch({ type: "SAVE_AI", payload: { id: mail.id, ai: { ...result, actions } } });
    await markTaskDone(mail, index, done).catch((error) => console.log(error));
  };

  const replySubject = mail.subject.toLowerCase().startsWith("re:") ? mail.subject : "Re: " + mail.subject;

  const openInCompose = () => {
    navigate("/compose", {
      state: { to: mail.from, subject: replySubject, body: reply, replyOf: mail.id },
    });
  };

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await sendMail({
        from: user.email,
        to: mail.from,
        subject: replySubject,
        body: textToHtml(reply),
        replyOf: mail.id,
      });
      setSent(true);
    } catch (error) {
      alert(error.message);
    }
    setSending(false);
  };

  if (!result) {
    return (
      <aside className="ai-panel">
        <div className="ai-loading">
          <span className="ai-pulse" />
          AI is reading this mail...
        </div>
      </aside>
    );
  }

  return (
    <aside className="ai-panel">
      <div className="ai-panel-head">
        <h6>AI insights</h6>
        <div className="d-flex align-items-center gap-2">
          <AiBadge usedAI={result.usedAI} />
          <button className="link-btn" onClick={checkAgain} disabled={checkingAgain}>
            {checkingAgain ? "Checking..." : "Check again"}
          </button>
        </div>
      </div>

      <section className="ai-block">
        <div className="d-flex align-items-center gap-2 mb-2">
          <PriorityBadge priority={result.priority} />
          <span className="ai-category">{result.category}</span>
        </div>
        <p className="ai-summary">{result.summary}</p>
        {result.priorityReason && (
          <p className="ai-reason">Why {result.priority.toLowerCase()}: {result.priorityReason}</p>
        )}
      </section>

      <section className="ai-block ai-grid">
        <div>
          <span className="ai-k">Reply required</span>
          <span className={`ai-v ${result.replyRequired ? "yes" : "no"}`}>
            {result.replyRequired ? (mail.replied ? "Yes (replied)" : "Yes") : "No"}
          </span>
        </div>
        <div>
          <span className="ai-k">Follow-up</span>
          <span className={`ai-v ${result.followUp?.isFollowUp ? "yes" : "no"}`}>
            {result.followUp?.isFollowUp ? "Sender is reminding" : result.followUp?.needed ? "Expected" : "Not needed"}
          </span>
        </div>
      </section>

      {result.actions?.length > 0 && (
        <section className="ai-block">
          <h6 className="ai-h">Tasks</h6>
          <ul className="ai-actions">
            {result.actions.map((item, index) => (
              <li key={index} className={item.done ? "done" : ""}>
                <Form.Check
                  id={`task-${mail.id}-${index}`}
                  checked={Boolean(item.done)}
                  onChange={(e) => toggleTask(index, e.target.checked)}
                  label={item.task}
                />
                {item.deadline && (
                  <span className="due">
                    {item.deadline}
                    {item.dueDate ? ` (${getDueText(item.dueDate)})` : ""}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {result.meetings?.length > 0 && (
        <section className="ai-block">
          <h6 className="ai-h">Meetings</h6>
          {result.meetings.map((meeting, index) => (
            <div key={index} className="ai-meeting">
              <strong>{meeting.title}</strong>
              <span>{meeting.when}</span>
            </div>
          ))}
        </section>
      )}

      {result.deadlines?.length > 0 && (
        <section className="ai-block">
          <h6 className="ai-h">Deadlines</h6>
          {result.deadlines.map((item, index) => (
            <div key={index} className="ai-meeting">
              <span>{item.label}</span>
              <strong>{item.date}</strong>
            </div>
          ))}
        </section>
      )}

      {result.nextStep && (
        <section className="ai-block ai-next">
          <h6 className="ai-h">Next step</h6>
          <p>{result.nextStep}</p>
        </section>
      )}

      <section className="ai-block ai-reply">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="ai-h mb-0">Smart reply</h6>
          {replyUsedAI && <AiBadge usedAI={replyUsedAI} />}
        </div>

        <ToneButtons selected={tone} onSelect={writeReply} disabled={writing} />

        <div className="reply-instruction">
          <input
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && writeReply()}
            placeholder="Optional: ask for 2 more days, say no politely..."
          />
          <button onClick={() => writeReply()} disabled={writing}>
            {writing ? <Spinner size="sm" /> : reply ? "Write again" : "Write reply"}
          </button>
        </div>

        <textarea
          className="reply-box"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={8}
          placeholder={writing ? "Writing..." : "Click Write reply to get a reply from AI"}
        />

        {sent ? (
          <div className="reply-sent">
            Reply sent to {mail.from}.{" "}
            <button className="link-btn" onClick={() => navigate("/sent")}>
              Open Sent
            </button>
          </div>
        ) : (
          <div className="d-flex gap-2 justify-content-end flex-wrap">
            {!mail.replied && result.replyRequired && (
              <Button size="sm" variant="link" className="text-muted" onClick={() => markReplied(mail.id)}>
                Mark as done
              </Button>
            )}
            <Button size="sm" variant="outline-primary" onClick={openInCompose} disabled={!reply.trim()}>
              Edit first
            </Button>
            <Button size="sm" variant="primary" onClick={sendReply} disabled={!reply.trim() || sending}>
              {sending ? "Sending..." : "Send reply"}
            </Button>
          </div>
        )}
      </section>
    </aside>
  );
};

export default AiPanel;
