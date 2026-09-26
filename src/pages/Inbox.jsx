import { useState } from "react";
import { Spinner, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext";
import { useMail } from "../hooks/useMail";
import { useMailContext } from "../store/MailContext";
import ai from "../ai/aiHelper";
import { removeHtml, getNameFromEmail, getTimeAgo, getDueText, priorityOrder } from "../utils/helpers";
import PriorityBadge from "../components/PriorityBadge";
import AiBadge from "../components/AiBadge";

const FILTERS = ["All", "Urgent", "Important", "Normal", "Needs reply"];
const SEARCH_EXAMPLES = ["urgent mails", "mails from priya about invoice", "meetings this week", "mails that need my reply"];

const Inbox = () => {
  const { user } = useAuth();
  const { markAsRead, deleteMail, addDemoMails } = useMail();
  const { state, dispatch } = useMailContext();
  const navigate = useNavigate();

  const [filter, setFilter] = useState("All");
  const [sortByPriority, setSortByPriority] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [addingDemo, setAddingDemo] = useState(false);

  const mails = state.mails;

  // search, filter aur sort ke hisab se list banao
  let showMails = mails;

  if (searchResult) {
    showMails = searchResult.ids
      .map((id) => mails.find((mail) => mail.id === id))
      .filter(Boolean);
  }

  if (filter === "Needs reply") {
    showMails = showMails.filter((mail) => mail.ai?.replyRequired && !mail.replied);
  } else if (filter !== "All") {
    showMails = showMails.filter((mail) => mail.ai?.priority === filter);
  }

  if (sortByPriority && !searchResult) {
    showMails = [...showMails].sort((a, b) => {
      const first = priorityOrder[a.ai?.priority] || 4;
      const second = priorityOrder[b.ai?.priority] || 4;
      return first - second || b.createdAt - a.createdAt;
    });
  }

  const count = {
    All: mails.length,
    Urgent: mails.filter((mail) => mail.ai?.priority === "Urgent").length,
    Important: mails.filter((mail) => mail.ai?.priority === "Important").length,
    Normal: mails.filter((mail) => mail.ai?.priority === "Normal").length,
    "Needs reply": mails.filter((mail) => mail.ai?.replyRequired && !mail.replied).length,
  };

  const search = async (text) => {
    if (!text.trim()) {
      setSearchResult(null);
      return;
    }
    setSearchText(text);
    setSearching(true);
    const result = await ai.searchMails(text, mails);
    setSearchResult(result);
    setFilter("All");
    setSearching(false);
  };

  const clearSearch = () => {
    setSearchResult(null);
    setSearchText("");
  };

  const openMail = (mail) => {
    if (!mail.receiverRead) {
      dispatch({ type: "MARK_AS_READ", payload: mail.id });
      markAsRead(mail.id, "inbox").catch((error) => console.log(error));
    }
    navigate(`/mail/${mail.id}`, { state: { mail, type: "inbox" } });
  };

  const handleDelete = async (id) => {
    try {
      await deleteMail(id);
      dispatch({ type: "REMOVE_MAIL", payload: id });
    } catch (error) {
      console.log("Error deleting mail:", error);
    }
  };

  const loadDemo = async () => {
    setAddingDemo(true);
    try {
      await addDemoMails(user.email);
    } catch (error) {
      alert("Could not add demo mails: " + error.message);
    }
    setAddingDemo(false);
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
      <div className="inbox-header">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <h5 className="mb-0 fw-bold">Inbox</h5>
            <span className="unread-count">{state.unreadCount} unread</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            {state.aiWorkingOn.length > 0 && (
              <span className="ai-working">
                <Spinner animation="grow" size="sm" /> AI is reading {state.aiWorkingOn.length} mail(s)
              </span>
            )}
            {state.lastUsedAI && <AiBadge usedAI={state.lastUsedAI} />}
          </div>
        </div>

        <form
          className="smart-search"
          onSubmit={(e) => {
            e.preventDefault();
            search(searchText);
          }}
        >
          <span className="smart-search-icon">✨</span>
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder='Ask your inbox, e.g. "invoices from Priya that need approval"'
          />
          {searchResult && (
            <button type="button" className="smart-search-clear" onClick={clearSearch}>
              Clear
            </button>
          )}
          <button type="submit" className="smart-search-go" disabled={searching}>
            {searching ? <Spinner size="sm" /> : "Search"}
          </button>
        </form>

        {!searchResult && mails.length > 0 && (
          <div className="search-examples">
            Try:
            {SEARCH_EXAMPLES.map((example) => (
              <button key={example} type="button" onClick={() => search(example)}>
                {example}
              </button>
            ))}
          </div>
        )}

        {searchResult && (
          <div className="search-explain">
            Found {searchResult.ids.length} mail(s). {searchResult.explanation}
          </div>
        )}

        <div className="filter-row">
          {FILTERS.map((name) => (
            <button
              key={name}
              className={`filter-chip chip-${name.split(" ")[0].toLowerCase()} ${filter === name ? "active" : ""}`}
              onClick={() => setFilter(name)}
            >
              {name} <span>{count[name]}</span>
            </button>
          ))}
          <label className="sort-toggle">
            <input type="checkbox" checked={sortByPriority} onChange={(e) => setSortByPriority(e.target.checked)} />
            Sort by priority
          </label>
        </div>
      </div>

      <div className="mail-list">
        {mails.length === 0 && (
          <div className="empty-state">
            <h6>Your inbox is empty</h6>
            <p>Send a mail to yourself, or add some demo mails to see how the AI works.</p>
            <div className="d-flex gap-2 justify-content-center">
              <Button onClick={loadDemo} disabled={addingDemo}>
                {addingDemo ? "Adding..." : "Load demo mails"}
              </Button>
              <Button variant="outline-secondary" onClick={() => navigate("/compose")}>
                Compose mail
              </Button>
            </div>
          </div>
        )}

        {mails.length > 0 && showMails.length === 0 && (
          <div className="empty-state">
            <h6>No mails found</h6>
            <p>Change the filter or clear the search.</p>
          </div>
        )}

        {showMails.map((mail) => {
          const result = mail.ai;
          const openTasks = result?.actions?.filter((item) => !item.done) || [];
          const nextTask = openTasks.find((item) => item.dueDate) || openTasks[0];

          return (
            <div
              key={mail.id}
              className={`mail-item ${!mail.receiverRead ? "unread" : ""} ${result ? "edge-" + result.priority.toLowerCase() : ""}`}
              onClick={() => openMail(mail)}
            >
              {!mail.receiverRead && <span className="unread-dot"></span>}

              <div className="mail-sender" title={mail.from}>
                {getNameFromEmail(mail.from)}
              </div>

              <div className="mail-content flex-grow-1">
                <div className="mail-line">
                  {result && <PriorityBadge priority={result.priority} small />}
                  <span className="fw-semibold mail-subject">{mail.subject}</span>
                  {mail.replied && <span className="meta-chip chip-done">Replied</span>}
                </div>

                <div className="mail-ai-line">
                  {result ? (
                    <>
                      <span className="ai-mark">✨</span>
                      {result.summary}
                    </>
                  ) : state.aiWorkingOn.includes(mail.id) ? (
                    <span className="text-muted">AI is reading...</span>
                  ) : (
                    <span className="text-muted">{removeHtml(mail.body).slice(0, 110)}</span>
                  )}
                </div>

                {result && (openTasks.length > 0 || result.meetings?.length > 0) && (
                  <div className="mail-meta-chips">
                    {openTasks.length > 0 && <span className="meta-chip">{openTasks.length} task(s)</span>}
                    {nextTask?.deadline && (
                      <span className="meta-chip chip-deadline">{getDueText(nextTask.dueDate, nextTask.deadline)}</span>
                    )}
                    {result.meetings?.[0] && (
                      <span className="meta-chip chip-meeting">Meeting: {result.meetings[0].when}</span>
                    )}
                    {result.followUp?.isFollowUp && <span className="meta-chip chip-follow">Follow-up</span>}
                  </div>
                )}
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
          );
        })}
      </div>
    </div>
  );
};

export default Inbox;
