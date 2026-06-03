import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Code, 
  Terminal, 
  Database, 
  Activity, 
  Settings2, 
  Power, 
  ArrowLeft,
  Trash2,
  RefreshCcw,
  Zap,
  Globe
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import "../index.css";

export default function DeveloperOptions() {
  const navigate = useNavigate();
  const { userProfile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("system"); // system, database, flags, logs

  useEffect(() => {
    if (!loading && (!userProfile || userProfile.role !== "admin")) {
      navigate("/app");
    }
  }, [userProfile, loading, navigate]);

  if (loading || !userProfile || userProfile.role !== "admin") {
    return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", color: "var(--text-muted)" }}>Authorizing Developer Console...</div>;
  }

  return (
    <div className="developer-options-container animate-fade-in" style={{ paddingBottom: "4rem" }}>
      
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
        <div>
          <button onClick={() => navigate("/admin/portal")} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontWeight: 700, fontSize: "0.9rem", marginBottom: "1rem" }}>
            <ArrowLeft size={16} /> Back to Portal
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <div style={{ background: "rgba(99, 102, 241, 0.1)", color: "#6366F1", padding: "0.5rem", borderRadius: "12px" }}>
              <Code size={24} />
            </div>
            <h1 style={{ fontSize: "2.25rem", fontWeight: 900, fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em", color: "var(--text-main)", margin: 0 }}>
              Developer Options
            </h1>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Advanced system configurations, environmental variables, and database controls.
          </p>
        </div>
        
        <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "12px", padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10B981", boxShadow: "0 0 10px #10B981" }} />
          <span style={{ color: "#10B981", fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>System Online</span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="admin-tabs" style={{ display: "flex", gap: "1rem", marginBottom: "2rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem", overflowX: "auto" }}>
        {[
          { id: "system", label: "System Config", icon: <Settings2 size={16} /> },
          { id: "database", label: "Database Management", icon: <Database size={16} /> },
          { id: "flags", label: "Feature Flags", icon: <Zap size={16} /> },
          { id: "logs", label: "System Logs", icon: <Terminal size={16} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`admin-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.25rem",
              borderRadius: "12px", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer",
              background: activeTab === tab.id ? "var(--card-bg)" : "transparent",
              color: activeTab === tab.id ? "#6366F1" : "var(--text-muted)",
              boxShadow: activeTab === tab.id ? "0 4px 12px rgba(0,0,0,0.05)" : "none",
              border: activeTab === tab.id ? "1px solid var(--border-color)" : "1px solid transparent",
              transition: "all 0.2s"
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="developer-tab-content">
        
        {/* SYSTEM TAB */}
        {activeTab === "system" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div style={{ background: "var(--card-bg)", padding: "2rem", borderRadius: "20px", border: "1px solid var(--border-color)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", color: "var(--text-main)" }}>
                <Power size={20} color="#EF4444" />
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800 }}>Maintenance Mode</h3>
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.5rem", lineHeight: 1.5 }}>
                Taking the system offline will display a maintenance page to all users except system administrators. Active WebSocket connections will be terminated gracefully.
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-main)", padding: "1rem", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                <span style={{ fontWeight: 700, color: "var(--text-main)" }}>System Status</span>
                <button style={{ background: "transparent", border: "1px solid var(--border-color)", color: "var(--text-main)", padding: "0.5rem 1rem", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>Toggle Offline</button>
              </div>
            </div>

            <div style={{ background: "var(--card-bg)", padding: "2rem", borderRadius: "20px", border: "1px solid var(--border-color)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", color: "var(--text-main)" }}>
                <Globe size={20} color="#3B82F6" />
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800 }}>API Endpoints</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {[
                  { name: "Auth Service", url: "https://auth.komunitrade.app/v1", status: "ok" },
                  { name: "Database Cluster", url: "us-central1-gcp", status: "ok" },
                  { name: "AI Verification Model", url: "https://ai.komunitrade.app/vision", status: "warn" }
                ].map((api, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-main)", padding: "0.75rem 1rem", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-main)" }}>{api.name}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "monospace" }}>{api.url}</div>
                    </div>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: api.status === "ok" ? "#10B981" : "#F59E0B" }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DATABASE TAB */}
        {activeTab === "database" && (
          <div style={{ background: "var(--card-bg)", padding: "2rem", borderRadius: "20px", border: "1px solid var(--border-color)" }}>
            <h3 style={{ margin: "0 0 1.5rem", fontSize: "1.2rem", fontWeight: 800, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <Database size={20} color="#8B5CF6" /> Storage & Cache Control
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
              
              <div style={{ border: "1px solid var(--border-color)", padding: "1.5rem", borderRadius: "16px" }}>
                <h4 style={{ fontWeight: 800, color: "var(--text-main)", marginBottom: "0.5rem" }}>Seed Test Data</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem", minHeight: "40px" }}>Populates the database with 50 synthetic users and 100 random listings for stress testing.</p>
                <button className="btn-secondary" style={{ width: "100%", padding: "0.6rem", display: "flex", justifyContent: "center", gap: "0.5rem" }}>
                  <Activity size={16} /> Run Seeder
                </button>
              </div>

              <div style={{ border: "1px solid var(--border-color)", padding: "1.5rem", borderRadius: "16px" }}>
                <h4 style={{ fontWeight: 800, color: "var(--text-main)", marginBottom: "0.5rem" }}>Clear IndexedDB Cache</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem", minHeight: "40px" }}>Purges local PWA caches and forces a fresh sync from the remote Firebase instance.</p>
                <button className="btn-secondary" style={{ width: "100%", padding: "0.6rem", display: "flex", justifyContent: "center", gap: "0.5rem" }}>
                  <RefreshCcw size={16} /> Flush Cache
                </button>
              </div>

              <div style={{ border: "1px solid rgba(239, 68, 68, 0.3)", padding: "1.5rem", borderRadius: "16px", background: "rgba(239, 68, 68, 0.05)" }}>
                <h4 style={{ fontWeight: 800, color: "#EF4444", marginBottom: "0.5rem" }}>Hard Reset Database</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem", minHeight: "40px" }}>Irreversibly deletes ALL documents in ALL collections. Only available in non-production environments.</p>
                <button style={{ width: "100%", padding: "0.6rem", display: "flex", justifyContent: "center", gap: "0.5rem", background: "#EF4444", color: "white", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}>
                  <Trash2 size={16} /> Wipe Database
                </button>
              </div>

            </div>
          </div>
        )}

        {/* FLAGS TAB */}
        {activeTab === "flags" && (
          <div style={{ background: "var(--card-bg)", padding: "2rem", borderRadius: "20px", border: "1px solid var(--border-color)" }}>
            <h3 style={{ margin: "0 0 1.5rem", fontSize: "1.2rem", fontWeight: 800, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <Zap size={20} color="#F59E0B" /> Experimental Features
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {[
                { name: "AI Listing Verification", desc: "Auto-approve listings using Vision API", enabled: true },
                { name: "WebSockets Chat Sync", desc: "Use real-time WebSockets instead of Firebase polling for messages", enabled: false },
                { name: "PWA Background Sync", desc: "Allow creating listings while entirely offline, synced on reconnect", enabled: true },
                { name: "Crypto Payments (Beta)", desc: "Enable Solana/USDC wallet connection on checkout", enabled: false }
              ].map((flag, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem", border: "1px solid var(--border-color)", borderRadius: "12px" }}>
                  <div>
                    <div style={{ fontWeight: 800, color: "var(--text-main)", fontSize: "1rem", marginBottom: "0.25rem" }}>{flag.name}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{flag.desc}</div>
                  </div>
                  <div style={{ width: "48px", height: "24px", background: flag.enabled ? "var(--primary)" : "var(--border-color)", borderRadius: "12px", position: "relative", cursor: "pointer", transition: "all 0.3s" }}>
                    <div style={{ width: "20px", height: "20px", background: "white", borderRadius: "50%", position: "absolute", top: "2px", left: flag.enabled ? "26px" : "2px", transition: "all 0.3s" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LOGS TAB */}
        {activeTab === "logs" && (
          <div style={{ background: "#0F172A", padding: "1.5rem", borderRadius: "20px", border: "1px solid var(--border-color)", color: "#10B981", fontFamily: "monospace", fontSize: "0.85rem", height: "400px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "0.5rem" }}>
              <span style={{ color: "white", fontWeight: "bold" }}>SYSTEM STDOUT & STDERR</span>
              <span style={{ color: "rgba(255,255,255,0.5)" }}>Auto-scroll enabled</span>
            </div>
            <div>[INFO] System initialized at {new Date().toISOString()}</div>
            <div>[INFO] Loading environment variables... OK</div>
            <div>[INFO] Firebase connection established. Ping: 24ms</div>
            <div>[WARN] Non-critical: Missing meta tags for OpenGraph</div>
            <div>[INFO] Authenticated user: admin (UID: admin-12345)</div>
            <div>[INFO] API Route /v1/listings mounted successfully</div>
            <div style={{ color: "#3B82F6" }}>[DEBUG] WebSocket channel 'global_feed' connected</div>
            <div>[INFO] Listening on port 5175...</div>
            <div style={{ marginTop: "auto", display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <div style={{ width: "8px", height: "12px", background: "#10B981", animation: "blink 1s step-end infinite" }} />
              <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
