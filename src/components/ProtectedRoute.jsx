import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();

  if (!currentUser) return <Navigate to="/login" replace />;

  // Allow Google and Phone users directly
  const provider = currentUser.providerData?.[0]?.providerId;
  if (provider === "google.com" || provider === "phone") return children;

  // For email users, require email verification
  if (!currentUser.emailVerified) return <Navigate to="/login" replace />;

  return children;
}
