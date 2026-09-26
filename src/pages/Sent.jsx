import { Spinner, Badge, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useMail } from "../hooks/useMail";
import { useMailContext } from "../store/MailContext";
import { removeHtml, getTimeAgo } from "../utils/helpers";

const Sent = () => {
  const { deleteMail } = useMail();
  const { state, dispatch } = useMailContext();
  const navigate = useNavigate();
  const mails = state.sent;

  const handleDelete = async (id) => {
    try {
      await deleteMail(id);
      dispatch({ type: "REMOVE_MAIL", payload: id });
    } catch (error) {
      console.log("Error deleting mail:", error);
      alert("Unable to delete mail");
    }
  };

  if (!state.loaded) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "80vh" }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="inbox-container">
      <div className="inbox-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0 fw-bold">Sent</h5>
        <Badge bg="secondary" pill className="fs-6">
          {mails.length} sent
        </Badge>
      </div>

      <div className="mail-list">
        {mails.length === 0 ? (
          <div className="empty-state">
            <h6>No sent mails</h6>
            <p>You haven't sent any mails yet.</p>
            <Button onClick={() => navigate("/compose")}>Compose mail</Button>
          </div>
        ) : (
          mails.map((mail) => (
            <div
              key={mail.id}
              className="mail-item d-flex align-items-center"
              onClick={() => navigate(`/mail/${mail.id}`, { state: { mail, type: "sent" } })}
            >
              <div className="mail-sender">
                <span className="text-muted">To:</span> {mail.to}
              </div>
              <div className="mail-content flex-grow-1">
                <span className="fw-semibold me-2">{mail.subject}</span>
                <span className="text-muted">{removeHtml(mail.body).substring(0, 100)}</span>
              </div>
              <div className="mail-time">{getTimeAgo(mail.createdAt)}</div>
              <button
                className="btn btn-outline-danger btn-sm ms-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(mail.id);
                }}
              >
                🗑️
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Sent;
