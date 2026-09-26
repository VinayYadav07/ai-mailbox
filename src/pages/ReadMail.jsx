import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button, Card, Spinner } from "react-bootstrap";
import { useMailContext } from "../store/MailContext";
import { useAuth } from "../store/AuthContext";
import AiPanel from "../components/AiPanel";
import ai from "../ai/aiHelper";
import { getTimeAgo } from "../utils/helpers";

const ReadMail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { state } = useMailContext();
  const [writing, setWriting] = useState(false);

  let type = location.state?.type;
  if (!type) {
    type = state.sent.some((mail) => mail.id === id) ? "sent" : "inbox";
  }

  // context wali mail lo taaki AI ka naya result turant dikhe
  const list = type === "sent" ? state.sent : state.mails;
  const mail = list.find((item) => item.id === id) || location.state?.mail;

  if (!mail && !state.loaded) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "80vh" }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (!mail) {
    return (
      <div className="text-center p-5">
        <h5>Mail not found</h5>
        <Button variant="primary" onClick={() => navigate("/inbox")}>
          Back to Inbox
        </Button>
      </div>
    );
  }

  const writeFollowUp = async () => {
    setWriting(true);
    const result = await ai.writeFollowUp(mail, user.email);
    setWriting(false);
    navigate("/compose", { state: { to: mail.to, subject: result.subject, body: result.body } });
  };

  return (
    <div className={`read-container ${type === "inbox" ? "with-ai" : ""}`}>
      <Card className="shadow-sm read-card">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <Button
            variant="outline-primary"
            size="sm"
            className="back-btn"
            onClick={() => navigate(type === "sent" ? "/sent" : "/inbox")}
          >
            ← Back
          </Button>
          <span className="text-muted small">{getTimeAgo(mail.createdAt)}</span>
        </Card.Header>

        <Card.Body>
          <h4 className="fw-bold mb-3">{mail.subject}</h4>
          <div className="mb-3 mail-meta">
            <div>
              <strong>From:</strong> {mail.from}
            </div>
            <div>
              <strong>To:</strong> {mail.to}
            </div>
          </div>
          <hr />
          <div
            className="mail-content"
            dangerouslySetInnerHTML={{ __html: mail.body || "<p class='text-muted'>No message content</p>" }}
          />

          {type === "sent" && (
            <div className="sent-followup">
              <span>No reply yet? AI can write a polite follow-up mail for you.</span>
              <Button size="sm" onClick={writeFollowUp} disabled={writing}>
                {writing ? <Spinner size="sm" /> : "Write follow-up"}
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      {type === "inbox" && <AiPanel mail={mail} />}
    </div>
  );
};

export default ReadMail;
