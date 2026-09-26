import { useState } from "react";
import { Alert, Button, Card, Container, Form, Spinner } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

const Signup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // signup form submit hone pe chalao
  const signupHandler = async (e) => {
    e.preventDefault();
    setError("");

    // basic checks
    if (!email || !password || !confirmPassword) {
      setError("All fields are mandatory");
      return;
    }
    if (password !== confirmPassword) {
      setError("Password and confirm password do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must contain at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      await createUserWithEmailAndPassword(auth, email, password);
      console.log("User has successfully signed up");
      navigate("/login");
    } catch (err) {
      // firebase ke error codes ke hisab se message dikhao
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email");
      } else {
        setError("Something went wrong. Please try again");
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
            <p className="text-center text-muted mb-4">Create your account</p>

            {/* error dikhao */}
            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={signupHandler}>
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
              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Form.Group>

              {/* confirm password field */}
              <Form.Group className="mb-4">
                <Form.Label>Confirm Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </Form.Group>

              {/* signup button */}
              <Button type="submit" className="w-100" disabled={loading}>
                {loading ? <Spinner size="sm" /> : "Sign Up"}
              </Button>
            </Form>

            {/* login link */}
            <p className="text-center mt-4 mb-0">
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default Signup;
