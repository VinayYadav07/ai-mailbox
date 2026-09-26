import { Navbar, Container, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../store/AuthContext";

const Header = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // logout karo aur login page pe bhejo
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <Navbar
      bg="white"
      className="border-bottom shadow-sm"
      style={{ height: "56px" }}
    >
      <Container fluid>
        <Navbar.Brand className="fw-bold text-primary">
          <span className="brand-mark">✨</span> AI Mailbox
        </Navbar.Brand>

        <div className="d-flex align-items-center gap-3">
          <span className="text-muted small">{user?.email}</span>
          <Button variant="outline-danger" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </Container>
    </Navbar>
  );
};

export default Header;
