import { useState } from "react";
import { Alert, Button, Card, Container, Form, Spinner } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // login form submit hone pe chalao
  const loginHandler = async (e) => {
    e.preventDefault();
    setError("");

    // basic check
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    try {
      setLoading(true);
      const result = await signInWithEmailAndPassword(auth, email, password);
      const token = await result.user.getIdToken();
      localStorage.setItem("token", token);
      navigate("/briefing");
    } catch (err) {
      // firebase ke error codes ke hisab se message dikhao
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found"
      ) {
        setError("Wrong email or password");
      } else {
        setError("Login failed. Please try again");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="auth-page">
      <div className="auth-wrapper">
        <Card className="auth-card shadow-lg">
          <Card.Body className="p-5">
            <h2 className="text-center fw-bold text-primary mb-2">
              ✨ AI Mailbox
            </h2>
            <p className="text-center text-muted mb-4">
              Intelligent email management & action assistant
            </p>

            {/* error dikhao */}
            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={loginHandler}>
              {/* email field */}
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Form.Group>

              {/* password field */}
              <Form.Group className="mb-4">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Form.Group>

              {/* login button */}
              <Button type="submit" className="w-100" disabled={loading}>
                {loading ? <Spinner size="sm" /> : "Login"}
              </Button>
            </Form>

            {/* signup link */}
            <p className="text-center mt-4 mb-0">
              Don't have an account? <Link to="/signup">Sign Up</Link>
            </p>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default Login;
