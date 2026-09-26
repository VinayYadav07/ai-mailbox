import { Navigate } from "react-router-dom";
import { Spinner } from "react-bootstrap";
import { useAuth } from "../store/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // jab tak auth check ho raha hai, spinner dikhao
  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  // agar user login nahi hai to login page pe bhejo
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // warna page dikhao
  return children;
};

export default ProtectedRoute;
