import { useState } from "react";
import { Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useMailContext } from "../store/MailContext";
import { useMail } from "../hooks/useMail";
import { getDaysLeft, getDueText, getNameFromEmail } from "../utils/helpers";
import PriorityBadge from "../components/PriorityBadge";

// tasks ko deadline ke hisab se groups me baantna
const GROUPS = [
  { name: "Overdue", check: (days) => days !== null && days < 0 },
  { name: "Today", check: (days) => days === 0 },
  { name: "Next 7 days", check: (days) => days !== null && days > 0 && days <= 7 },
  { name: "Later", check: (days) => days !== null && days > 7 },
  { name: "No deadline", check: (days) => days === null },
];

const ActionCenter = () => {
  const { state, dispatch } = useMailContext();
  const { markTaskDone } = useMail();
  const navigate = useNavigate();
  const [showDone, setShowDone] = useState(false);

  // saari mails ke tasks ek list me
  const allTasks = [];
  state.mails.forEach((mail) => {
    (mail.ai?.actions || []).forEach((item, index) => {
      allTasks.push({ ...item, index, mail, days: getDaysLeft(item.dueDate) });
    });
  });

  const pendingTasks = allTasks.filter((item) => !item.done);
  const doneTasks = allTasks.filter((item) => item.done);

  const meetings = [];
  state.mails.forEach((mail) => {
    (mail.ai?.meetings || []).forEach((meeting) => {
      const days = getDaysLeft(meeting.date);
      if (days === null || days >= 0) meetings.push({ ...meeting, mail, days });
    });
  });
  meetings.sort((a, b) => (a.days === null ? 99 : a.days) - (b.days === null ? 99 : b.days));

  const toggleTask = async (item, done) => {
    const actions = item.mail.ai.actions.map((task, i) => (i === item.index ? { ...task, done } : task));
    dispatch({ type: "SAVE_AI", payload: { id: item.mail.id, ai: { ...item.mail.ai, actions } } });
    await markTaskDone(item.mail, item.index, done).catch((error) => console.log(error));
  };

  const openMail = (mail) => navigate(`/mail/${mail.id}`, { state: { type: "inbox" } });

  const showTask = (item) => {
    const isLate = item.days !== null && item.days < 0 && !item.done;
    return (
      <li key={item.mail.id + "-" + item.index} className={`action-row ${item.done ? "done" : ""} ${isLate ? "overdue" : ""}`}>
        <Form.Check
          id={`ac-${item.mail.id}-${item.index}`}
          checked={Boolean(item.done)}
          onChange={(e) => toggleTask(item, e.target.checked)}
        />
        <div className="action-main">
          <span className="action-task">{item.task}</span>
          <button className="action-src" onClick={() => openMail(item.mail)}>
            {item.mail.subject} - {getNameFromEmail(item.mail.from)}
          </button>
        </div>
        <PriorityBadge priority={item.mail.ai.priority} small />
        <span className="action-due">{item.deadline ? `${item.deadline} (${getDueText(item.dueDate, "")})` : "-"}</span>
      </li>
    );
  };

  return (
    <div className="page-wrap">
      <div className="page-head">
        <h5 className="fw-bold mb-1">Action center</h5>
        <p className="text-muted mb-0">All the tasks, deadlines and meetings found in your mails.</p>
      </div>

      <div className="action-layout">
        <div>
          {pendingTasks.length === 0 && (
            <div className="empty-state">
              <h6>No pending tasks</h6>
              <p>When a mail asks you to do something, it will show here.</p>
            </div>
          )}

          {GROUPS.map((group) => {
            const tasks = pendingTasks
              .filter((item) => group.check(item.days))
              .sort((a, b) => (a.days === null ? 99 : a.days) - (b.days === null ? 99 : b.days));
            if (tasks.length === 0) return null;

            return (
              <section key={group.name} className={`action-group ${group.name === "Overdue" ? "group-overdue" : ""}`}>
                <h6>
                  {group.name} <span>{tasks.length}</span>
                </h6>
                <ul>{tasks.map(showTask)}</ul>
              </section>
            );
          })}

          {doneTasks.length > 0 && (
            <section className="action-group">
              <button className="link-btn" onClick={() => setShowDone(!showDone)}>
                {showDone ? "Hide" : "Show"} completed ({doneTasks.length})
              </button>
              {showDone && <ul>{doneTasks.map(showTask)}</ul>}
            </section>
          )}
        </div>

        <aside className="meeting-list">
          <h6>Upcoming meetings</h6>
          {meetings.length === 0 && <p className="text-muted small">No meetings found.</p>}
          {meetings.map((meeting, index) => (
            <button key={index} className="meeting-item" onClick={() => openMail(meeting.mail)}>
              <strong>{meeting.title}</strong>
              <span>{meeting.when}</span>
              <small>{getNameFromEmail(meeting.mail.from)}</small>
            </button>
          ))}
        </aside>
      </div>
    </div>
  );
};

export default ActionCenter;
