import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Code, ArrowRight } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import "../index.css";

export default function AdminPortal() {
  const navigate = useNavigate();
  const { userProfile, loading } = useAuth();

  useEffect(() => {
    if (!loading && (!userProfile || userProfile.role !== "admin")) {
      navigate("/");
    }
  }, [userProfile, loading, navigate]);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", color: "var(--text-muted)" }}>Authorizing Administration Console...</div>;

  return (
    <div className="admin-portal-container animate-fade-in" style={{ padding: "4rem 2rem", maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "4rem" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(239, 68, 68, 0.1)", color: "#EF4444", padding: "0.5rem 1.25rem", borderRadius: "999px", fontWeight: 800, fontSize: "0.9rem", marginBottom: "1rem" }}>
          <Shield size={16} /> System Administration
        </div>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 900, fontFamily: "'Outfit', sans-serif", color: "var(--text-main)", marginBottom: "1rem" }}>
          Admin & Developer Portal
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto" }}>
          Select a console to proceed. All actions are logged and require system administrator privileges.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
        
        {/* Admin Dashboard Card */}
        <div 
          onClick={() => navigate("/admin/dashboard")}
          style={{ 
            background: "var(--card-bg)", 
            border: "1px solid var(--border-color)", 
            borderRadius: "24px", 
            padding: "2.5rem", 
            cursor: "pointer", 
            transition: "all 0.3s ease",
            position: "relative",
            overflow: "hidden"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-color)"; e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "150px", height: "150px", background: "radial-gradient(circle, rgba(255,71,87,0.1) 0%, transparent 70%)", borderRadius: "50%" }} />
          <div style={{ background: "rgba(255, 71, 87, 0.1)", color: "var(--primary)", width: "60px", height: "60px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
            <Shield size={28} />
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.75rem", fontFamily: "'Outfit', sans-serif" }}>Admin Dashboard</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "2rem" }}>
            Moderate listings, verify users, handle reports, and view community feedback. Standard moderation controls.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--primary)", fontWeight: 700, fontSize: "0.9rem" }}>
            Access Dashboard <ArrowRight size={16} />
          </div>
        </div>

        {/* Developer Options Card */}
        <div 
          onClick={() => navigate("/admin/developer")}
          style={{ 
            background: "var(--card-bg)", 
            border: "1px solid var(--border-color)", 
            borderRadius: "24px", 
            padding: "2.5rem", 
            cursor: "pointer", 
            transition: "all 0.3s ease",
            position: "relative",
            overflow: "hidden"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#6366F1"; e.currentTarget.style.transform = "translateY(-4px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-color)"; e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "150px", height: "150px", background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)", borderRadius: "50%" }} />
          <div style={{ background: "rgba(99, 102, 241, 0.1)", color: "#6366F1", width: "60px", height: "60px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
            <Code size={28} />
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.75rem", fontFamily: "'Outfit', sans-serif" }}>Developer Options</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "2rem" }}>
            System configurations, feature flags, API endpoints, database seeding, and performance logs.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#6366F1", fontWeight: 700, fontSize: "0.9rem" }}>
            Access Developer Tools <ArrowRight size={16} />
          </div>
        </div>

      </div>
    </div>
  );
}
