import { Button, Nav, Badge } from "react-bootstrap";
import { NavLink, useNavigate } from "react-router-dom";
import { useMailContext } from "../store/MailContext";

const SidebarLink = ({ to, icon, label, count, color = "secondary" }) => (
  <Nav.Link as={NavLink} to={to} end className="sidebar-link d-flex align-items-center">
    <span className="me-2">{icon}</span>
    <span className="flex-grow-1">{label}</span>
    {count > 0 && (
      <Badge bg={color} pill className="ms-2">
        {count}
      </Badge>
    )}
  </Nav.Link>
);

const Sidebar = () => {
  const navigate = useNavigate();
  const { state } = useMailContext();
  const mails = state.mails;

  const unread = mails.filter((mail) => !mail.receiverRead).length;
  const urgent = mails.filter((mail) => mail.ai?.priority === "Urgent" && !mail.replied).length;
  const needReply = mails.filter((mail) => mail.ai?.replyRequired && !mail.replied).length;

  let pendingTasks = 0;
  mails.forEach((mail) => {
    pendingTasks += (mail.ai?.actions || []).filter((item) => !item.done).length;
  });

  return (
    <div className="sidebar p-3">
      <Button className="w-100 rounded-pill mb-4 fw-bold shadow-sm" onClick={() => navigate("/compose")}>
        ✏️ Compose
      </Button>

      <Nav className="flex-column gap-1 mb-3">
        <SidebarLink to="/inbox" icon="📥" label="Inbox" count={unread} color="danger" />
        <SidebarLink to="/sent" icon="📤" label="Sent" />
      </Nav>

      <hr className="my-2" />
      <div className="sidebar-section">AI assistant</div>

      <Nav className="flex-column gap-1">
        <SidebarLink to="/briefing" icon="☀️" label="Daily briefing" count={urgent} color="danger" />
        <SidebarLink to="/actions" icon="✅" label="Action center" count={pendingTasks} color="primary" />
        <SidebarLink to="/follow-ups" icon="↩️" label="Follow-ups" count={needReply} color="warning" />
      </Nav>
    </div>
  );
};

export default Sidebar;
