import { useEffect, useState } from "react";
import { Button, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext";
import { useMailContext } from "../store/MailContext";
import { useMail } from "../hooks/useMail";
import ai from "../ai/aiHelper";
import { getNameFromEmail } from "../utils/helpers";
import AiBadge from "../components/AiBadge";

const DailyBriefing = () => {
  const { user } = useAuth();
  const { state } = useMailContext();
  const { addDemoMails } = useMail();
  const navigate = useNavigate();

  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [madeAt, setMadeAt] = useState(null);

  const aiIsBusy = state.aiWorkingOn.length > 0;
  const hasMails = state.mails.length > 0;

  const makeBriefing = async () => {
    setLoading(true);
    const result = await ai.dailyBriefing(state.mails, user.email);
    setBriefing(result);
    setMadeAt(new Date());
    setLoading(false);
  };

  // jab saari mails check ho jaye tab khud briefing bana do
  useEffect(() => {
    if (state.loaded && hasMails && !aiIsBusy && !briefing && !loading) {
      makeBriefing();
    }
  }, [state.loaded, hasMails, aiIsBusy]);

  const openMail = (mailId) => {
    if (mailId) navigate(`/mail/${mailId}`, { state: { type: "inbox" } });
  };

  const todayText = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
  const firstName = getNameFromEmail(user?.email).split(" ")[0];

  return (
    <div className="page-wrap">
      <div className="briefing">
        <header className="briefing-head">
          <div>
            <p className="briefing-date">{todayText}</p>
            <h2>{briefing?.greeting || `Hello, ${firstName}`}</h2>
          </div>
          <div className="d-flex align-items-center gap-2">
            {briefing && <AiBadge usedAI={briefing.usedAI} />}
            <Button size="sm" variant="outline-primary" onClick={makeBriefing} disabled={loading || aiIsBusy || !hasMails}>
              {loading ? <Spinner size="sm" /> : "Refresh"}
            </Button>
          </div>
        </header>

        {state.loaded && !hasMails && (
          <div className="empty-state">
            <h6>No mails yet</h6>
            <p>Add the demo mails to see a full daily briefing.</p>
            <Button onClick={() => addDemoMails(user.email)}>Load demo mails</Button>
          </div>
        )}

        {hasMails && (!briefing || aiIsBusy) && (
          <div className="briefing-loading">
            <Spinner animation="border" variant="primary" />
            <p>{aiIsBusy ? `AI is reading ${state.aiWorkingOn.length} new mail(s)...` : "Making your briefing..."}</p>
          </div>
        )}

        {hasMails && briefing && !aiIsBusy && (
          <>
            <p className="briefing-overview">{briefing.overview}</p>

            {briefing.focus && (
              <div className="briefing-focus">
                <span>Do this first</span>
                <p>{briefing.focus}</p>
              </div>
            )}

            <div className="briefing-cols">
              <section>
                <h6>Urgent</h6>
                {briefing.urgent.length === 0 && <p className="muted">Nothing urgent today.</p>}
                {briefing.urgent.map((item, index) => (
                  <button key={index} className="brief-item urgent" onClick={() => openMail(item.mailId)}>
                    <strong>{item.subject}</strong>
                    <small>{getNameFromEmail(item.from)}</small>
                    {item.summary && <p>{item.summary}</p>}
                  </button>
                ))}
              </section>

              <section>
                <h6>To-do list</h6>
                {briefing.todo.length === 0 && <p className="muted">No open tasks.</p>}
                <ul className="brief-todo">
                  {briefing.todo.map((item, index) => (
                    <li key={index} onClick={() => openMail(item.mailId)}>
                      <span>{item.task}</span>
                      <em>{item.due}</em>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h6>Meetings</h6>
                {briefing.meetings.length === 0 && <p className="muted">No meetings found.</p>}
                {briefing.meetings.map((item, index) => (
                  <button key={index} className="brief-item" onClick={() => openMail(item.mailId)}>
                    <strong>{item.title}</strong>
                    <small>{item.when}</small>
                  </button>
                ))}
              </section>

              <section>
                <h6>Waiting for your reply</h6>
                {briefing.replies.length === 0 && <p className="muted">You have replied to everything.</p>}
                {briefing.replies.map((item, index) => (
                  <button key={index} className="brief-item" onClick={() => openMail(item.mailId)}>
                    <strong>{item.subject}</strong>
                    <small>{getNameFromEmail(item.from)}</small>
                  </button>
                ))}
              </section>
            </div>

            {madeAt && (
              <p className="briefing-foot">
                Made at {madeAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DailyBriefing;
