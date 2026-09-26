import { Routes, Route, Navigate } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import "./ai.css";

import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import MailListener from "./components/MailListener";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Inbox from "./pages/Inbox";
import Sent from "./pages/Sent";
import ComposeMail from "./pages/ComposeMail";
import ReadMail from "./pages/ReadMail";
import DailyBriefing from "./pages/DailyBriefing";
import ActionCenter from "./pages/ActionCenter";
import FollowUps from "./pages/FollowUps";

import { AuthProvider } from "./store/AuthContext";
import { MailProvider } from "./store/MailContext";

function App() {
  return (
    <AuthProvider>
      <MailProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* login ke baad wale pages */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <div className="app-container">
                  <MailListener />
                  <Header />
                  <Container fluid className="p-0">
                    <Row className="g-0">
                      <Col md={3} lg={2} className="sidebar-col">
                        <Sidebar />
                      </Col>
                      <Col md={9} lg={10} className="content-col">
                        <Routes>
                          <Route path="/" element={<Navigate to="/inbox" />} />
                          <Route path="/welcome" element={<Navigate to="/briefing" />} />
                          <Route path="/inbox" element={<Inbox />} />
                          <Route path="/sent" element={<Sent />} />
                          <Route path="/compose" element={<ComposeMail />} />
                          <Route path="/mail/:id" element={<ReadMail />} />
                          <Route path="/briefing" element={<DailyBriefing />} />
                          <Route path="/actions" element={<ActionCenter />} />
                          <Route path="/follow-ups" element={<FollowUps />} />
                        </Routes>
                      </Col>
                    </Row>
                  </Container>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MailProvider>
    </AuthProvider>
  );
}

export default App;
