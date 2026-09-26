import { useState } from "react";
import { Form, Button, Alert, Spinner } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext";
import { useMail } from "../hooks/useMail";
import { Editor } from "react-draft-wysiwyg";
import { EditorState, ContentState, convertToRaw } from "draft-js";
import draftToHtml from "draftjs-to-html";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import ai from "../ai/aiHelper";
import AiBadge from "../components/AiBadge";
import ToneButtons from "../components/ToneButtons";

// plain text ko editor me daalne ke liye
function textToEditor(text) {
  if (!text) return EditorState.createEmpty();
  return EditorState.createWithContent(ContentState.createFromText(text));
}

const ComposeMail = () => {
  const { user } = useAuth();
  const { sendMail } = useMail();
  const navigate = useNavigate();
  const location = useLocation();

  // reply ya follow-up se aaye to pehle se bhara hua data
  const oldData = location.state || {};

  const [to, setTo] = useState(oldData.to || "");
  const [subject, setSubject] = useState(oldData.subject || "");
  const [editorState, setEditorState] = useState(() => textToEditor(oldData.body));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [idea, setIdea] = useState("");
  const [tone, setTone] = useState("Professional");
  const [aiWorking, setAiWorking] = useState(false);
  const [usedAI, setUsedAI] = useState(null);
  const [beforeAI, setBeforeAI] = useState(null); // undo ke liye

  const getEditorText = () => editorState.getCurrentContent().getPlainText("\n").trim();

  const writeWithAI = async () => {
    if (!idea.trim()) {
      setError("Write what the mail should say, e.g. ask HR for leave on Monday");
      return;
    }
    setError("");
    setAiWorking(true);
    const result = await ai.writeMail(idea.trim(), to.trim(), tone, user.email);
    setBeforeAI(editorState);
    setEditorState(textToEditor(result.body));
    if (!subject.trim() && result.subject) setSubject(result.subject);
    setUsedAI(result.usedAI);
    setAiWorking(false);
  };

  const changeTone = async (newTone) => {
    setTone(newTone);
    const text = getEditorText();
    if (!text) return; // editor khali hai to sirf tone save karo

    setAiWorking(true);
    const result = await ai.changeTone(text, newTone);
    if (result.text) {
      setBeforeAI(editorState);
      setEditorState(textToEditor(result.text));
      setUsedAI(result.usedAI);
    }
    setAiWorking(false);
  };

  const undoAI = () => {
    setEditorState(beforeAI);
    setBeforeAI(null);
  };

  const sendHandler = async (e) => {
    e.preventDefault();
    setError("");

    if (!to.trim()) {
      setError("Please enter recipient email");
      return;
    }
    if (!subject.trim()) {
      setError("Please enter subject");
      return;
    }

    const htmlContent = draftToHtml(convertToRaw(editorState.getCurrentContent()));
    const plainText = htmlContent.replace(/<(.|\n)*?>/g, "").trim();
    if (!plainText) {
      setError("Please enter message");
      return;
    }

    try {
      setLoading(true);
      await sendMail({
        from: user.email,
        to: to.trim(),
        subject: subject.trim(),
        body: htmlContent,
        replyOf: oldData.replyOf || null,
      });
      navigate("/sent");
    } catch (err) {
      setError(err.message || "Unable to send mail");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="compose-container">
      <div className="compose-card">
        <div className="compose-header">
          <h5 className="mb-0 fw-bold">{oldData.replyOf ? "Reply" : "Compose mail"}</h5>
          <button className="btn-close" onClick={() => navigate(-1)}></button>
        </div>

        <div className="compose-body">
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          <div className="ai-assist">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="ai-assist-title">✨ Write with AI</span>
              {usedAI && <AiBadge usedAI={usedAI} />}
            </div>

            <div className="reply-instruction">
              <input
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    writeWithAI();
                  }
                }}
                placeholder="What should this mail say? e.g. ask Rahul to move Monday's meeting to 3 pm"
              />
              <button type="button" onClick={writeWithAI} disabled={aiWorking}>
                {aiWorking ? <Spinner size="sm" /> : "Write"}
              </button>
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap mt-2">
              <span className="small text-muted">Change tone:</span>
              <ToneButtons selected={tone} onSelect={changeTone} disabled={aiWorking} />
              {beforeAI && (
                <button type="button" className="link-btn" onClick={undoAI}>
                  Undo
                </button>
              )}
            </div>
          </div>

          <Form onSubmit={sendHandler}>
            <Form.Group className="mb-3">
              <div className="compose-field">
                <Form.Label className="compose-label">To</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="test@gmail.com"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="compose-input"
                />
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <div className="compose-field">
                <Form.Label className="compose-label">Subject</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="compose-input"
                />
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <div className="editor-wrapper">
                <Editor
                  editorState={editorState}
                  onEditorStateChange={setEditorState}
                  toolbarClassName="rdw-editor-toolbar"
                  wrapperClassName="editor-wrapper"
                  editorClassName="rdw-editor-main"
                  placeholder="Write your message..."
                  toolbar={{
                    options: ["inline", "blockType", "fontSize", "list", "textAlign", "colorPicker", "link", "remove", "history"],
                    inline: { options: ["bold", "italic", "underline", "strikethrough"] },
                    list: { options: ["unordered", "ordered"] },
                    textAlign: { options: ["left", "center", "right", "justify"] },
                  }}
                />
              </div>
            </Form.Group>

            <div className="d-flex justify-content-end">
              <Button type="submit" variant="primary" disabled={loading} className="send-btn">
                {loading ? "Sending..." : "Send"}
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default ComposeMail;
