import { useState } from "react";
import { Button, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext";
import { useMailContext } from "../store/MailContext";
import ai from "../ai/aiHelper";
import { analyzeMail } from "../ai/offlineAI";
import { getNameFromEmail, getTimeAgo } from "../utils/helpers";
import PriorityBadge from "../components/PriorityBadge";

const ONE_HOUR = 60 * 60 * 1000;
const WAIT_OPTIONS = [
  { label: "Any time", hours: 0 },
  { label: "1+ day", hours: 24 },
  { label: "3+ days", hours: 72 },
];

const FollowUps = () => {
  const { user } = useAuth();
  const { state } = useMailContext();
  const navigate = useNavigate();
  const [waitHours, setWaitHours] = useState(24);
  const [writingFor, setWritingFor] = useState(null);

  // 1. mails jinka reply mujhe dena hai
  const waitingOnMe = state.mails
    .filter((mail) => mail.ai?.replyRequired && !mail.replied)
    .sort((a, b) => a.createdAt - b.createdAt);

  // 2. mails jo maine bheji par jawab nahi aaya
  const waitingOnOthers = state.sent.filter((sentMail) => {
    if (sentMail.to === user.email) return false;

    const hoursPassed = (Date.now() - sentMail.createdAt) / ONE_HOUR;
    if (hoursPassed < waitHours) return false;

    const gotReply = state.mails.some((mail) => mail.from === sentMail.to && mail.createdAt > sentMail.createdAt);
    if (gotReply) return false;

    // sirf wo mails jisme kuch poocha ya maanga tha
    return analyzeMail({ mail: sentMail }).replyRequired;
  });

  const writeFollowUp = async (mail) => {
    setWritingFor(mail.id);
    const result = await ai.writeFollowUp(mail, user.email);
    setWritingFor(null);
    navigate("/compose", { state: { to: mail.to, subject: result.subject, body: result.body } });
  };

  return (
    <div className="page-wrap">
      <div className="page-head">
        <h5 className="fw-bold mb-1">Follow-ups</h5>
        <p className="text-muted mb-0">Mails where someone is waiting for a reply.</p>
      </div>

      <section className="fu-section">
        <h6>
          Waiting on me <span>{waitingOnMe.length}</span>
        </h6>

        {waitingOnMe.length === 0 && <p className="text-muted small">You have replied to all mails that needed a reply.</p>}

        {waitingOnMe.map((mail) => (
          <div key={mail.id} className="fu-row" onClick={() => navigate(`/mail/${mail.id}`, { state: { type: "inbox" } })}>
            <PriorityBadge priority={mail.ai.priority} small />
            <div className="fu-main">
              <strong>{mail.subject}</strong>
              <span>
                {getNameFromEmail(mail.from)}, received {getTimeAgo(mail.createdAt)}
                {mail.ai.followUp?.isFollowUp && <em className="fu-chasing"> (they sent a reminder)</em>}
              </span>
            </div>
            <Button size="sm" variant="outline-primary">
              Reply
            </Button>
          </div>
        ))}
      </section>

      <section className="fu-section">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h6 className="mb-0">
            Waiting on others <span>{waitingOnOthers.length}</span>
          </h6>
          <div className="tone-switch">
            {WAIT_OPTIONS.map((option) => (
              <button
                key={option.hours}
                className={waitHours === option.hours ? "active" : ""}
                onClick={() => setWaitHours(option.hours)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {waitingOnOthers.length === 0 && <p className="text-muted small mt-2">No pending replies for this time.</p>}

        {waitingOnOthers.map((mail) => (
          <div key={mail.id} className="fu-row">
            <div className="fu-main" onClick={() => navigate(`/mail/${mail.id}`, { state: { type: "sent" } })}>
              <strong>{mail.subject}</strong>
              <span>
                To {mail.to}, sent {getTimeAgo(mail.createdAt)}, no reply yet
              </span>
            </div>
            <Button size="sm" onClick={() => writeFollowUp(mail)} disabled={writingFor === mail.id}>
              {writingFor === mail.id ? <Spinner size="sm" /> : "Write follow-up"}
            </Button>
          </div>
        ))}
      </section>
    </div>
  );
};

export default FollowUps;
