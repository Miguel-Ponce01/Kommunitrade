import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  ShoppingBag, 
  MessageSquare, 
  ShieldAlert, 
  Trash2, 
  UserCheck, 
  UserX, 
  Search, 
  TrendingUp, 
  AlertTriangle,
  Settings,
  Heart
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { db, collection, getDocs, doc, deleteDoc, updateDoc } from "../firebase";
import "../index.css";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { userProfile, loading } = useAuth();
  
  const [activeTab, setActiveTab] = useState("users"); // users | listings | feedback
  const [usersList, setUsersList] = useState([]);
  const [listingsList, setListingsList] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
  
  const [dbLoading, setDbLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Security Check: Redirect non-admins
  useEffect(() => {
    if (!loading && (!userProfile || userProfile.role !== "admin")) {
      navigate("/app");
    }
  }, [userProfile, loading, navigate]);

  // Fetch all collections
  const fetchData = async () => {
    setDbLoading(true);
    try {
      // 1. Users
      const usersSnap = await getDocs(collection(db, "users"));
      const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsersList(users);

      // 2. Listings
      const listingsSnap = await getDocs(collection(db, "listings"));
      const listings = listingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setListingsList(listings);

      // 3. Feedback
      const feedbackSnap = await getDocs(collection(db, "feedback"));
      const feedback = feedbackSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort feedback by date descending
      feedback.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      setFeedbackList(feedback);
    } catch (e) {
      console.error("Failed to fetch admin dashboard collections:", e);
    } finally {
      setDbLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile && userProfile.role === "admin") {
      fetchData();
    }
  }, [userProfile]);

  // ── Moderation Handlers ──────────────────────────────────────────
  
  // Toggle User Verification Status
  const handleToggleVerification = async (targetUser) => {
    const nextVerified = !targetUser.verified;
    try {
      const userRef = doc(db, "users", targetUser.id);
      await updateDoc(userRef, {
        verified: nextVerified,
        isVerified: nextVerified,
        verificationScore: nextVerified ? 100 : 0
      });
      // Update local state
      setUsersList(usersList.map(u => 
        u.id === targetUser.id 
          ? { ...u, verified: nextVerified, isVerified: nextVerified, verificationScore: nextVerified ? 100 : 0 }
          : u
      ));
    } catch (e) {
      alert("Failed to update verification: " + e.message);
    }
  };

  // Adjust User Trust Score
  const handleTrustScoreChange = async (targetUser, delta) => {
    let nextScore = Math.max(0, Math.min(100, (targetUser.trustScore || 100) + delta));
    try {
      const userRef = doc(db, "users", targetUser.id);
      await updateDoc(userRef, { trustScore: nextScore });
      setUsersList(usersList.map(u => u.id === targetUser.id ? { ...u, trustScore: nextScore } : u));
    } catch (e) {
      alert("Failed to update trust score: " + e.message);
    }
  };

  // Delete User Profile
  const handleDeleteUser = async (targetUserId) => {
    if (targetUserId === userProfile?.uid) {
      alert("You cannot delete your own admin account.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this user profile? This action is permanent.")) return;

    try {
      await deleteDoc(doc(db, "users", targetUserId));
      setUsersList(usersList.filter(u => u.id !== targetUserId));
    } catch (e) {
      alert("Failed to delete user document: " + e.message);
    }
  };

  // Delete Listing
  const handleDeleteListing = async (listingId) => {
    if (!window.confirm("Are you sure you want to delete this listing? This action is permanent.")) return;

    try {
      await deleteDoc(doc(db, "listings", listingId));
      setListingsList(listingsList.filter(l => l.id !== listingId));
    } catch (e) {
      alert("Failed to delete listing: " + e.message);
    }
  };

  // Delete Feedback
  const handleDeleteFeedback = async (feedbackId) => {
    if (!window.confirm("Are you sure you want to delete this feedback? This action is permanent.")) return;

    try {
      await deleteDoc(doc(db, "feedback", feedbackId));
      setFeedbackList(feedbackList.filter(f => f.id !== feedbackId));
    } catch (e) {
      alert("Failed to delete feedback: " + e.message);
    }
  };

  if (loading || !userProfile || userProfile.role !== "admin") {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", flexDirection: "column", gap: "1rem" }}>
        <LoaderSpinner />
        <p style={{ color: "var(--text-muted)" }}>Authorizing Administration Console...</p>
      </div>
    );
  }

  // Filter lists based on search
  const filteredUsers = usersList.filter(u => 
    (u.displayName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.phoneNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.barangay || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredListings = listingsList.filter(l => 
    (l.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.category || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.barangay || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.sellerId || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFeedback = feedbackList.filter(f => 
    (f.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.message || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-dashboard-container animate-fade-in" style={{ paddingBottom: "4rem" }}>
      
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(239, 68, 68, 0.1)", color: "#EF4444", padding: "0.4rem 1rem", borderRadius: "999px", fontWeight: 800, fontSize: "0.8rem", marginBottom: "0.75rem" }}>
            <ShieldAlert size={12} /> System Admin Mode
          </div>
          <h1 style={{ fontSize: "2.25rem", fontWeight: 900, fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            Administration Panel
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginTop: "0.25rem" }}>
            Monitor records, moderate listings, and manage verification badges.
          </p>
        </div>
        <button className="btn-secondary" onClick={fetchData} style={{ padding: "0.6rem 1.25rem", borderRadius: "10px", fontWeight: 700 }}>
          Refresh Database
        </button>
      </div>

      {/* ── Summary Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginBottom: "2.5rem" }}>
        
        <div style={{ background: "var(--card-bg)", padding: "1.5rem", borderRadius: "20px", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <div style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3B82F6", width: "48px", height: "48px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: "1.75rem", fontWeight: 900, fontFamily: "'Outfit', sans-serif", color: "var(--text-main)", lineHeight: 1.1 }}>{usersList.length}</div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500, marginTop: "0.2rem" }}>Registered Members</div>
          </div>
        </div>

        <div style={{ background: "var(--card-bg)", padding: "1.5rem", borderRadius: "20px", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <div style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10B981", width: "48px", height: "48px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShoppingBag size={24} />
          </div>
          <div>
            <div style={{ fontSize: "1.75rem", fontWeight: 900, fontFamily: "'Outfit', sans-serif", color: "var(--text-main)", lineHeight: 1.1 }}>{listingsList.length}</div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500, marginTop: "0.2rem" }}>Active Listings</div>
          </div>
        </div>

        <div style={{ background: "var(--card-bg)", padding: "1.5rem", borderRadius: "20px", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <div style={{ background: "rgba(245, 158, 11, 0.1)", color: "#F59E0B", width: "48px", height: "48px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MessageSquare size={24} />
          </div>
          <div>
            <div style={{ fontSize: "1.75rem", fontWeight: 900, fontFamily: "'Outfit', sans-serif", color: "var(--text-main)", lineHeight: 1.1 }}>{feedbackList.length}</div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500, marginTop: "0.2rem" }}>Feedbacks Filed</div>
          </div>
        </div>

      </div>

      {/* ── Visual Metrics & Graphs ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem", marginBottom: "2.5rem" }}>
        
        {/* Category Listings Ratio */}
        <div style={{ background: "var(--card-bg)", padding: "1.5rem", borderRadius: "20px", border: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <TrendingUp size={18} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Listing Category Proportions</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {["Electronics", "Clothing", "Books", "Furniture", "Services"].map(cat => {
              const count = listingsList.filter(l => l.category === cat).length;
              const total = listingsList.length || 1;
              const pct = (count / total) * 100;
              return (
                <div key={cat} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 700 }}>
                    <span style={{ color: "var(--text-main)" }}>{cat}</span>
                    <span style={{ color: "var(--text-muted)" }}>{count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div style={{ height: "8px", background: "var(--border-color)", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: "var(--primary)", borderRadius: "4px" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* User Identity Verification Status */}
        <div style={{ background: "var(--card-bg)", padding: "1.5rem", borderRadius: "20px", border: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <ShieldAlert size={18} color="var(--secondary)" />
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Identity Verification Status</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", justifyContent: "center", height: "80%" }}>
            {(() => {
              const verifiedCount = usersList.filter(u => u.verified || u.isVerified).length;
              const totalUsers = usersList.length || 1;
              const verifiedPct = (verifiedCount / totalUsers) * 100;
              const unverifiedPct = 100 - verifiedPct;
              return (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: 700 }}>
                      <span style={{ color: "#10B981" }}>Verified Members</span>
                      <span style={{ color: "var(--text-muted)" }}>{verifiedCount} ({verifiedPct.toFixed(0)}%)</span>
                    </div>
                    <div style={{ height: "10px", background: "var(--border-color)", borderRadius: "5px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${verifiedPct}%`, background: "#10B981", borderRadius: "5px" }} />
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: 700 }}>
                      <span style={{ color: "var(--text-muted)" }}>Unverified Members</span>
                      <span style={{ color: "var(--text-muted)" }}>{usersList.length - verifiedCount} ({unverifiedPct.toFixed(0)}%)</span>
                    </div>
                    <div style={{ height: "10px", background: "var(--border-color)", borderRadius: "5px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${unverifiedPct}%`, background: "var(--text-muted)", opacity: 0.5, borderRadius: "5px" }} />
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

      </div>

      {/* ── Search & Filter Controls ── */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        
        {/* Tabs */}
        <div style={{ display: "flex", background: "var(--border-color)", padding: "0.3rem", borderRadius: "12px", gap: "0.2rem" }}>
          <button 
            className={`admin-tab-btn ${activeTab === "users" ? "active" : ""}`} 
            onClick={() => { setActiveTab("users"); setSearchTerm(""); }}
            style={tabButtonStyle(activeTab === "users")}
          >
            <Users size={15} /> Users
          </button>
          <button 
            className={`admin-tab-btn ${activeTab === "listings" ? "active" : ""}`} 
            onClick={() => { setActiveTab("listings"); setSearchTerm(""); }}
            style={tabButtonStyle(activeTab === "listings")}
          >
            <ShoppingBag size={15} /> Listings
          </button>
          <button 
            className={`admin-tab-btn ${activeTab === "feedback" ? "active" : ""}`} 
            onClick={() => { setActiveTab("feedback"); setSearchTerm(""); }}
            style={tabButtonStyle(activeTab === "feedback")}
          >
            <MessageSquare size={15} /> Feedbacks
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", border: "1px solid var(--border-color)", padding: "0.6rem 1rem", borderRadius: "12px", background: "var(--bg-color)", minWidth: "280px", flex: "1", maxWidth: "400px" }}>
          <Search size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <input 
            type="text" 
            placeholder={`Search ${activeTab}...`} 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ background: "none", border: "none", color: "var(--text-main)", outline: "none", width: "100%", fontSize: "0.9rem" }}
          />
        </div>

      </div>

      {/* ── Moderation Stage ── */}
      {dbLoading ? (
        <div style={{ textAlign: "center", padding: "5rem 0", color: "var(--text-muted)" }}>
          <LoaderSpinner />
          <p style={{ marginTop: "1rem" }}>Reading collection records...</p>
        </div>
      ) : (
        <div style={{ background: "var(--card-bg)", borderRadius: "24px", border: "1px solid var(--border-color)", padding: "1.5rem", overflowX: "auto", boxShadow: "var(--shadow-premium)" }}>
          
          {/* USERS PANEL */}
          {activeTab === "users" && (
            <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-color)", textAlign: "left" }}>
                  <th style={thStyle}>Alias / ID</th>
                  <th style={thStyle}>Contact Details</th>
                  <th style={thStyle}>Verified Spot</th>
                  <th style={thStyle}>Trust Rating</th>
                  <th style={thStyle}>Badges</th>
                  <th style={thStyle} className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "3rem 0", color: "var(--text-muted)" }}>No registered users match your search.</td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={tdStyle}>
                        <div>
                          <div style={{ fontWeight: 800, color: "var(--text-main)", fontSize: "0.95rem" }}>{user.displayName || "Unknown user"}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem", fontFamily: "monospace" }}>UID: {user.id.slice(0, 8)}...</div>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-main)" }}>{user.email || "No Email"}</div>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>{user.phoneNumber || "No Mobile"}</div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-main)", fontWeight: 500 }}>{user.barangay || "Not set"}</span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontWeight: 800, color: getTrustColor(user.trustScore) }}>{user.trustScore ?? 100}%</span>
                          <div style={{ display: "flex", gap: "0.2rem" }}>
                            <button onClick={() => handleTrustScoreChange(user, -10)} style={scoreChangeBtnStyle("-")} title="Decrease Score">-10</button>
                            <button onClick={() => handleTrustScoreChange(user, 10)} style={scoreChangeBtnStyle("+")} title="Increase Score">+10</button>
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: "0.3rem" }}>
                          <span style={{ padding: "0.2rem 0.5rem", borderRadius: "6px", fontSize: "0.7rem", fontWeight: 700, ...getRoleBadgeStyle(user.role) }}>
                            {(user.role || "user").toUpperCase()}
                          </span>
                          <span style={{ padding: "0.2rem 0.5rem", borderRadius: "6px", fontSize: "0.7rem", fontWeight: 700, ...getVerifyBadgeStyle(user.verified || user.isVerified) }}>
                            {(user.verified || user.isVerified) ? "VERIFIED" : "UNVERIFIED"}
                          </span>
                        </div>
                      </td>
                      <td style={tdStyle} className="text-right">
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                          <button 
                            onClick={() => handleToggleVerification(user)} 
                            className="btn-secondary" 
                            style={{ padding: "0.4rem 0.75rem", borderRadius: "8px", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.3rem", fontWeight: 700 }}
                          >
                            {(user.verified || user.isVerified) ? <UserX size={13} /> : <UserCheck size={13} />}
                            {(user.verified || user.isVerified) ? "Revoke Badge" : "Verify Badge"}
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user.id)} 
                            className="btn-danger" 
                            disabled={user.id === userProfile?.uid}
                            style={{ padding: "0.4rem", borderRadius: "8px", border: "none", color: "#EF4444", background: "rgba(239, 68, 68, 0.1)", cursor: "pointer", opacity: user.id === userProfile?.uid ? 0.3 : 1 }}
                            title="Delete User Document"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* LISTINGS PANEL */}
          {activeTab === "listings" && (
            <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-color)", textAlign: "left" }}>
                  <th style={thStyle}>Listing Item</th>
                  <th style={thStyle}>Seller Reference</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Barangay</th>
                  <th style={thStyle}>Price (PHP)</th>
                  <th style={thStyle}>Condition</th>
                  <th style={thStyle} className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredListings.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "3rem 0", color: "var(--text-muted)" }}>No market listings match your search.</td>
                  </tr>
                ) : (
                  filteredListings.map((listing) => (
                    <tr key={listing.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          {listing.imageUrl && (
                            <img src={listing.imageUrl} alt={listing.title} style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "cover" }} />
                          )}
                          <div>
                            <div style={{ fontWeight: 800, color: "var(--text-main)", fontSize: "0.95rem" }}>{listing.title || "Unnamed Listing"}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>{listing.description ? listing.description.slice(0, 35) + "..." : "No Description"}</div>
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-main)", fontFamily: "monospace" }}>UID: {listing.sellerId?.slice(0, 10)}...</div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ background: "var(--bg-main)", padding: "0.2rem 0.5rem", borderRadius: "6px", fontSize: "0.8rem", color: "var(--text-main)" }}>{listing.category}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-main)" }}>{listing.barangay || "Davao City"}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 800, color: "var(--text-main)" }}>₱{(listing.price || 0).toLocaleString()}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{listing.condition || "Used"}</span>
                      </td>
                      <td style={tdStyle} className="text-right">
                        <button 
                          onClick={() => handleDeleteListing(listing.id)} 
                          style={{ padding: "0.5rem", borderRadius: "8px", border: "none", color: "#EF4444", background: "rgba(239, 68, 68, 0.1)", cursor: "pointer" }}
                          title="Delete Listing"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* FEEDBACK PANEL */}
          {activeTab === "feedback" && (
            <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-color)", textAlign: "left" }}>
                  <th style={thStyle}>User Alias</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Feedback Message</th>
                  <th style={thStyle} className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeedback.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "3rem 0", color: "var(--text-muted)" }}>No community feedback matches your search.</td>
                  </tr>
                ) : (
                  filteredFeedback.map((feedback) => (
                    <tr key={feedback.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 800, color: "var(--text-main)" }}>{feedback.name || "Anonymous Member"}</div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{feedback.date || "Just now"}</span>
                      </td>
                      <td style={tdStyle}>
                        <p style={{ fontSize: "0.9rem", color: "var(--text-main)", maxWidth: "500px", wordBreak: "break-word", lineHeight: 1.4 }}>
                          {feedback.message}
                        </p>
                      </td>
                      <td style={tdStyle} className="text-right">
                        <button 
                          onClick={() => handleDeleteFeedback(feedback.id)} 
                          style={{ padding: "0.5rem", borderRadius: "8px", border: "none", color: "#EF4444", background: "rgba(239, 68, 68, 0.1)", cursor: "pointer" }}
                          title="Delete Feedback"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

        </div>
      )}

    </div>
  );
}

// ── Render Utilities ──

function LoaderSpinner() {
  return (
    <div className="spinner" style={{ border: "3px solid var(--border-color)", borderTop: "3px solid var(--primary)", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite" }} />
  );
}

// styling functions
const tabButtonStyle = (isActive) => ({
  padding: "0.5rem 1rem",
  borderRadius: "9px",
  fontSize: "0.875rem",
  fontWeight: 700,
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "0.4rem",
  background: isActive ? "var(--bg-color)" : "transparent",
  color: isActive ? "var(--text-main)" : "var(--text-muted)",
  boxShadow: isActive ? "0 4px 10px rgba(0,0,0,0.06)" : "none",
  transition: "all 0.2s ease"
});

const thStyle = {
  padding: "1rem",
  fontWeight: 700,
  fontSize: "0.85rem",
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  borderBottom: "1px solid var(--border-color)"
};

const tdStyle = {
  padding: "1.25rem 1rem",
  verticalAlign: "middle",
  borderBottom: "1px solid var(--border-color)"
};

const scoreChangeBtnStyle = (type) => ({
  background: type === "+" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
  color: type === "+" ? "#10B981" : "#EF4444",
  border: "none",
  borderRadius: "5px",
  padding: "0.15rem 0.35rem",
  fontSize: "0.7rem",
  fontWeight: 800,
  cursor: "pointer"
});

function getTrustColor(score = 100) {
  if (score >= 80) return "#10B981";
  if (score >= 50) return "#F59E0B";
  return "#EF4444";
}

function getRoleBadgeStyle(role = "user") {
  if (role === "admin") {
    return { background: "rgba(239, 68, 68, 0.1)", color: "#EF4444" };
  }
  return { background: "rgba(59, 130, 246, 0.1)", color: "#3B82F6" };
}

function getVerifyBadgeStyle(verified) {
  if (verified) {
    return { background: "rgba(16, 185, 129, 0.1)", color: "#10B981" };
  }
  return { background: "var(--border-color)", color: "var(--text-muted)" };
}
