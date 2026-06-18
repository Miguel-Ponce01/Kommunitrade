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
  Heart,
  ArrowLeft,
  ExternalLink,
  Eye,
  Activity,
  FileText,
  Star,
  X,
  Info,
  Check,
  AlertCircle
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { db, collection, getDocs, doc, deleteDoc, updateDoc, addDoc, serverTimestamp, query, where } from "../firebase";
import "../index.css";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { userProfile, loading } = useAuth();
  
  const [activeTab, setActiveTab] = useState("users"); // users | listings | feedback | reports | transactions | disputes | trustLogs
  const [usersList, setUsersList] = useState([]);
  const [listingsList, setListingsList] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
  const [reportsList, setReportsList] = useState([]);
  const [transactionsList, setTransactionsList] = useState([]);
  const [disputesList, setDisputesList] = useState([]);
  const [trustLogsList, setTrustLogsList] = useState([]);
  
  const [dbLoading, setDbLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Trust Adjustment Modal State
  const [showAdjustTrustModal, setShowAdjustTrustModal] = useState(false);
  const [adjustingUser, setAdjustingUser] = useState(null);
  const [adjustDelta, setAdjustDelta] = useState(-15);
  const [adjustRule, setAdjustRule] = useState("Rule 303: Meetup Reliability");
  const [adjustReason, setAdjustReason] = useState("");
  const [submittingAdjust, setSubmittingAdjust] = useState(false);

  // Transaction Audit Modal State
  const [viewingTx, setViewingTx] = useState(null);

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

      // 4. Reports
      const reportsSnap = await getDocs(collection(db, "reports"));
      const reports = reportsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      reports.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setReportsList(reports);

      // 5. Transactions
      const txSnap = await getDocs(collection(db, "transactions"));
      const transactions = txSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      transactions.sort((a, b) => {
        const timeA = a.created_at?.seconds || a.timestamp?.seconds || 0;
        const timeB = b.created_at?.seconds || b.timestamp?.seconds || 0;
        return timeB - timeA;
      });
      setTransactionsList(transactions);

      // 6. Disputes
      const disputesSnap = await getDocs(collection(db, "disputes"));
      const disputes = disputesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      disputes.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setDisputesList(disputes);

      // 7. Trust Logs
      const trustLogsSnap = await getDocs(collection(db, "trust_logs"));
      const trustLogs = trustLogsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      trustLogs.sort((a, b) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
      });
      setTrustLogsList(trustLogs);
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
      const nextScore = nextVerified ? 30 : 0;
      const nextStatus = nextVerified ? "VERIFIED" : "UNVERIFIED";
      await updateDoc(userRef, {
        verified: nextVerified,
        isVerified: nextVerified,
        verificationScore: nextVerified ? 100 : 0,
        trustScore: nextScore,
        verificationStatus: nextStatus
      });

      // Write trust log
      const changeAmount = nextVerified ? 30 : -(targetUser.trustScore || 30);
      await addDoc(collection(db, "trust_logs"), {
        userId: targetUser.id,
        change: changeAmount,
        newScore: nextScore,
        event: nextVerified ? "Verification Approved" : "Verification Revoked",
        ruleApplied: "Rule 101: General Conduct",
        reason: nextVerified 
          ? "Identity verification badge approved by admin." 
          : "Identity verification badge revoked by admin.",
        timestamp: serverTimestamp(),
        uid: targetUser.id,
        action: nextVerified ? "identity_verification" : "identity_revocation",
        points: changeAmount,
        createdAt: serverTimestamp()
      });

      // Update local state
      setUsersList(usersList.map(u => 
        u.id === targetUser.id 
          ? { 
              ...u, 
              verified: nextVerified, 
              isVerified: nextVerified, 
              verificationScore: nextVerified ? 100 : 0, 
              trustScore: nextScore,
              verificationStatus: nextStatus
            }
          : u
      ));

      // Refresh data to show new log in tab
      fetchData();
    } catch (e) {
      alert("Failed to update verification: " + e.message);
    }
  };

  // Adjust User Trust Score Submit
  const handleTrustScoreAdjustmentSubmit = async (e) => {
    e.preventDefault();
    if (!adjustingUser) return;
    setSubmittingAdjust(true);
    try {
      const currentScore = adjustingUser.trustScore ?? 100;
      const nextScore = Math.max(0, Math.min(100, currentScore + Number(adjustDelta)));
      
      const userRef = doc(db, "users", adjustingUser.id);
      await updateDoc(userRef, {
        trustScore: nextScore
      });

      await addDoc(collection(db, "trust_logs"), {
        userId: adjustingUser.id,
        change: Number(adjustDelta),
        newScore: nextScore,
        event: Number(adjustDelta) >= 0 ? "Admin Commendation" : "Admin Penalty",
        ruleApplied: adjustRule,
        reason: adjustReason,
        timestamp: serverTimestamp()
      });

      // Update local state
      setUsersList(usersList.map(u => u.id === adjustingUser.id ? { ...u, trustScore: nextScore } : u));
      
      setShowAdjustTrustModal(false);
      setAdjustingUser(null);
      alert("Trust score adjusted and log recorded successfully.");
    } catch (err) {
      console.error("Adjustment failed:", err);
      alert("Failed to adjust trust score: " + err.message);
    } finally {
      setSubmittingAdjust(false);
    }
  };

  // Adjust User Trust Score (legacy inline)
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

  // Dismiss Report
  const handleDismissReport = async (reportId) => {
    if (!window.confirm("Are you sure you want to dismiss this report?")) return;
    try {
      await deleteDoc(doc(db, "reports", reportId));
      setReportsList(reportsList.filter(r => r.id !== reportId));
    } catch (e) {
      alert("Failed to dismiss report: " + e.message);
    }
  };

  // Dismiss Dispute
  const handleDismissDispute = async (dispute) => {
    if (!window.confirm("Are you sure you want to dismiss this dispute? This will clear the dispute flag from the transaction.")) return;
    try {
      await deleteDoc(doc(db, "disputes", dispute.id));
      
      const txRef = doc(db, "transactions", dispute.transactionId);
      await updateDoc(txRef, {
        disputed: false,
        disputeReason: ""
      });
      
      setDisputesList(disputesList.filter(d => d.id !== dispute.id));
      setTransactionsList(transactionsList.map(t => 
        t.id === dispute.transactionId 
          ? { ...t, disputed: false, disputeReason: "" } 
          : t
      ));
      
      alert("Dispute dismissed successfully.");
    } catch (e) {
      alert("Failed to dismiss dispute: " + e.message);
    }
  };

  // Uphold Dispute & Penalty
  const handleUpholdDispute = async (dispute) => {
    if (!window.confirm("Are you sure you want to uphold this dispute? This will cancel the transaction, penalize the offender by -15% trust, write a trust log, and remove this dispute.")) return;
    try {
      // 1. Cancel transaction
      const txRef = doc(db, "transactions", dispute.transactionId);
      await updateDoc(txRef, {
        status: "Cancelled",
        disputed: true,
        disputeReason: `Dispute upheld: ${dispute.reason}`
      });

      // 2. Penalize reported user (offender) by 15%
      const offenderId = dispute.reportedUserId;
      let currentScore = 100;
      const offenderInList = usersList.find(u => u.id === offenderId);
      if (offenderInList) {
        currentScore = offenderInList.trustScore ?? 100;
      }
      const nextScore = Math.max(0, currentScore - 15);
      
      const offenderRef = doc(db, "users", offenderId);
      await updateDoc(offenderRef, {
        trustScore: nextScore
      });

      // 3. Write trust log
      let ruleApplied = "Rule 101: General Conduct";
      if (dispute.reason?.includes("303") || dispute.reason?.includes("Reliability")) {
        ruleApplied = "Rule 303: Meetup Reliability";
      } else if (dispute.reason?.includes("202") || dispute.reason?.includes("Accuracy")) {
        ruleApplied = "Rule 202: Listing Accuracy";
      } else if (dispute.reason?.includes("404") || dispute.reason?.includes("Authenticity")) {
        ruleApplied = "Rule 404: Financial Authenticity";
      }

      await addDoc(collection(db, "trust_logs"), {
        userId: offenderId,
        change: -15,
        newScore: nextScore,
        event: "Dispute Penalty",
        ruleApplied: ruleApplied,
        reason: `Dispute upheld by admin: ${dispute.comments || dispute.reason}`,
        timestamp: serverTimestamp()
      });

      // 4. Delete dispute doc
      await deleteDoc(doc(db, "disputes", dispute.id));

      // Update states
      setDisputesList(disputesList.filter(d => d.id !== dispute.id));
      setTransactionsList(transactionsList.map(t => 
        t.id === dispute.transactionId 
          ? { ...t, status: "Cancelled", disputed: true, disputeReason: `Dispute upheld: ${dispute.reason}` } 
          : t
      ));
      setUsersList(usersList.map(u => u.id === offenderId ? { ...u, trustScore: nextScore } : u));

      alert("Dispute upheld successfully. Transaction cancelled and offender penalized.");
    } catch (e) {
      alert("Failed to uphold dispute: " + e.message);
    }
  };

  // Cancel Transaction
  const handleCancelTransaction = async (txId) => {
    if (!window.confirm("Are you sure you want to cancel this transaction agreement?")) return;
    try {
      const txRef = doc(db, "transactions", txId);
      await updateDoc(txRef, {
        status: "Cancelled"
      });
      setTransactionsList(transactionsList.map(t => 
        t.id === txId ? { ...t, status: "Cancelled" } : t
      ));
      alert("Transaction cancelled successfully.");
    } catch (e) {
      alert("Failed to cancel transaction: " + e.message);
    }
  };

  const handleAuditDisputeReceipt = (dispute) => {
    const tx = transactionsList.find(t => t.id === dispute.transactionId);
    if (tx) {
      setViewingTx(tx);
    } else {
      setViewingTx({
        id: dispute.transactionId,
        reference_number: dispute.reference_number || "TRX-UNKNOWN",
        item_name: dispute.item_name || "Unknown Item",
        item_condition: "Unknown",
        agreed_price: 0,
        payment_method: "Unknown",
        meetup_location: "Unknown Spot",
        meetup_date: "N/A",
        meetup_time: "N/A",
        buyerId: dispute.reporterId,
        sellerId: dispute.reportedUserId,
        buyerPin: "------",
        sellerPin: "------",
        status: "Disputed",
        disputed: true,
        disputeReason: dispute.reason
      });
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

  const filteredReports = reportsList.filter(r => 
    (r.reason || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.reportedUserId || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.reporterId || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransactions = transactionsList.filter(t => 
    (t.id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.status || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.buyerId || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.sellerId || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDisputes = disputesList.filter(d => 
    (d.id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.reference_number || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.item_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.reason || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.comments || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.reporterAlias || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTrustLogs = trustLogsList.filter(log => {
    const user = usersList.find(u => u.id === log.userId) || {};
    const matchTerm = searchTerm.toLowerCase();
    return (
      (user.displayName || "").toLowerCase().includes(matchTerm) ||
      (user.email || "").toLowerCase().includes(matchTerm) ||
      (log.userId || "").toLowerCase().includes(matchTerm) ||
      (log.event || "").toLowerCase().includes(matchTerm) ||
      (log.ruleApplied || "").toLowerCase().includes(matchTerm) ||
      (log.reason || "").toLowerCase().includes(matchTerm)
    );
  });

  const actionBtnStyle = {
    border: "1px solid var(--border-color)",
    background: "var(--card-bg)",
    color: "var(--text-main)",
    padding: "0.45rem 0.85rem",
    borderRadius: "8px",
    fontWeight: 700,
    fontSize: "0.8rem",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
    transition: "var(--transition)"
  };

  const actionBtnDangerStyle = {
    border: "1px solid rgba(239, 68, 68, 0.2)",
    background: "rgba(239, 68, 68, 0.05)",
    color: "#EF4444",
    padding: "0.45rem 0.85rem",
    borderRadius: "8px",
    fontWeight: 700,
    fontSize: "0.8rem",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
    transition: "var(--transition)"
  };

  const actionBtnSuccessStyle = {
    border: "1px solid rgba(16, 185, 129, 0.2)",
    background: "rgba(16, 185, 129, 0.05)",
    color: "#10B981",
    padding: "0.45rem 0.85rem",
    borderRadius: "8px",
    fontWeight: 700,
    fontSize: "0.8rem",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
    transition: "var(--transition)"
  };

  return (
    <div className="admin-dashboard-container animate-fade-in" style={{ paddingBottom: "4rem" }}>
      
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
        <div>
          <button onClick={() => navigate("/admin/portal")} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontWeight: 700, fontSize: "0.9rem", marginBottom: "1rem" }}>
            <ArrowLeft size={16} /> Back to Portal
          </button>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(239, 68, 68, 0.1)", color: "#EF4444", padding: "0.4rem 1rem", borderRadius: "999px", fontWeight: 800, fontSize: "0.8rem", marginBottom: "0.75rem", width: "fit-content" }}>
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem", marginBottom: "2.5rem" }}>
        
        {/* Users Card */}
        <div style={{ background: "var(--card-bg)", padding: "1.5rem", borderRadius: "20px", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <div style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3B82F6", width: "48px", height: "48px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: "1.75rem", fontWeight: 900, fontFamily: "'Outfit', sans-serif", color: "var(--text-main)", lineHeight: 1.1 }}>{usersList.length}</div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500, marginTop: "0.2rem" }}>Registered Members</div>
          </div>
        </div>

        {/* Listings Card */}
        <div style={{ background: "var(--card-bg)", padding: "1.5rem", borderRadius: "20px", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <div style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10B981", width: "48px", height: "48px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShoppingBag size={24} />
          </div>
          <div>
            <div style={{ fontSize: "1.75rem", fontWeight: 900, fontFamily: "'Outfit', sans-serif", color: "var(--text-main)", lineHeight: 1.1 }}>{listingsList.length}</div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500, marginTop: "0.2rem" }}>Active Listings</div>
          </div>
        </div>

        {/* Feedback Card */}
        <div style={{ background: "var(--card-bg)", padding: "1.5rem", borderRadius: "20px", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <div style={{ background: "rgba(139, 92, 246, 0.1)", color: "#8B5CF6", width: "48px", height: "48px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MessageSquare size={24} />
          </div>
          <div>
            <div style={{ fontSize: "1.75rem", fontWeight: 900, fontFamily: "'Outfit', sans-serif", color: "var(--text-main)", lineHeight: 1.1 }}>{feedbackList.length}</div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500, marginTop: "0.2rem" }}>Feedbacks Filed</div>
          </div>
        </div>

        {/* Reports Card */}
        <div style={{ background: "var(--card-bg)", padding: "1.5rem", borderRadius: "20px", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "1.25rem", position: 'relative' }}>
          {reportsList.length > 0 && (
            <div style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#EF4444', color: 'white', fontSize: '0.75rem', fontWeight: 900, padding: '0.2rem 0.6rem', borderRadius: '12px', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.4)' }}>
              {reportsList.length} ALERTS
            </div>
          )}
          <div style={{ background: "rgba(239, 68, 68, 0.1)", color: "#EF4444", width: "48px", height: "48px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <div style={{ fontSize: "1.75rem", fontWeight: 900, fontFamily: "'Outfit', sans-serif", color: "var(--text-main)", lineHeight: 1.1 }}>{reportsList.length}</div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500, marginTop: "0.2rem" }}>Active Reports</div>
          </div>
        </div>

        {/* Transactions Card */}
        <div style={{ background: "var(--card-bg)", padding: "1.5rem", borderRadius: "20px", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <div style={{ background: "rgba(6, 182, 212, 0.1)", color: "#06B6D4", width: "48px", height: "48px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FileText size={24} />
          </div>
          <div>
            <div style={{ fontSize: "1.75rem", fontWeight: 900, fontFamily: "'Outfit', sans-serif", color: "var(--text-main)", lineHeight: 1.1 }}>{transactionsList.length}</div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500, marginTop: "0.2rem" }}>Total Transactions</div>
          </div>
        </div>

        {/* Disputes Card */}
        <div style={{ background: "var(--card-bg)", padding: "1.5rem", borderRadius: "20px", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "1.25rem", position: 'relative' }}>
          {disputesList.filter(d => d.status === 'active').length > 0 && (
            <div style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#F59E0B', color: 'white', fontSize: '0.75rem', fontWeight: 900, padding: '0.2rem 0.6rem', borderRadius: '12px', boxShadow: '0 4px 10px rgba(245, 158, 11, 0.4)' }}>
              {disputesList.filter(d => d.status === 'active').length} OPEN
            </div>
          )}
          <div style={{ background: "rgba(245, 158, 11, 0.1)", color: "#F59E0B", width: "48px", height: "48px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ fontSize: "1.75rem", fontWeight: 900, fontFamily: "'Outfit', sans-serif", color: "var(--text-main)", lineHeight: 1.1 }}>{disputesList.length}</div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500, marginTop: "0.2rem" }}>Active Disputes</div>
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
        <div style={{ display: "flex", background: "var(--border-color)", padding: "0.3rem", borderRadius: "12px", gap: "0.2rem", flexWrap: "wrap" }}>
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
          <button 
            className={`admin-tab-btn ${activeTab === "reports" ? "active" : ""}`} 
            onClick={() => { setActiveTab("reports"); setSearchTerm(""); }}
            style={{...tabButtonStyle(activeTab === "reports"), position: 'relative'}}
          >
            <ShieldAlert size={15} /> Reports
            {reportsList.length > 0 && (
              <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#EF4444', width: '8px', height: '8px', borderRadius: '50%' }}></span>
            )}
          </button>
          <button 
            className={`admin-tab-btn ${activeTab === "transactions" ? "active" : ""}`} 
            onClick={() => { setActiveTab("transactions"); setSearchTerm(""); }}
            style={tabButtonStyle(activeTab === "transactions")}
          >
            <FileText size={15} /> Transactions
          </button>
          <button 
            className={`admin-tab-btn ${activeTab === "disputes" ? "active" : ""}`} 
            onClick={() => { setActiveTab("disputes"); setSearchTerm(""); }}
            style={{...tabButtonStyle(activeTab === "disputes"), position: 'relative'}}
          >
            <AlertTriangle size={15} /> Disputes
            {disputesList.filter(d => d.status === 'active').length > 0 && (
              <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#F59E0B', width: '8px', height: '8px', borderRadius: '50%' }}></span>
            )}
          </button>
          <button 
            className={`admin-tab-btn ${activeTab === "trustLogs" ? "active" : ""}`} 
            onClick={() => { setActiveTab("trustLogs"); setSearchTerm(""); }}
            style={tabButtonStyle(activeTab === "trustLogs")}
          >
            <Activity size={15} /> Trust Logs
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
                  <th style={thStyle}>Status & Rating</th>
                  <th style={thStyle}>Verified Spot</th>
                  <th style={thStyle}>Trust Rating</th>
                  <th style={thStyle}>Badges</th>
                  <th style={thStyle} className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "3rem 0", color: "var(--text-muted)" }}>No registered users match your search.</td>
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
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: user.isOnline || user.lastActive ? "#10B981" : "var(--text-muted)" }} />
                          <span style={{ fontSize: "0.8rem", color: "var(--text-main)", fontWeight: 700 }}>{user.isOnline || user.lastActive ? "Active" : "Offline"}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "#F59E0B", fontSize: "0.85rem", fontWeight: 800 }}>
                          <Star size={12} fill="#F59E0B" /> {user.averageRating ? user.averageRating.toFixed(1) : "New"}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-main)", fontWeight: 500 }}>{user.barangay || "Not set"}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 800, color: getTrustColor(user.trustScore) }}>{user.trustScore ?? 100}%</span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: "0.3rem" }}>
                          <span style={{ padding: "0.2rem 0.5rem", borderRadius: "6px", fontSize: "0.7rem", fontWeight: 700, ...getRoleBadgeStyle(user.role) }}>
                            {(user.role || "user").toUpperCase()}
                          </span>
                          <span style={{ padding: "0.2rem 0.5rem", borderRadius: "6px", fontSize: "0.7rem", fontWeight: 700, ...getVerifyBadgeStyle(user.verified || user.isVerified, user.verificationStatus) }}>
                            {user.verificationStatus === "PENDING_REVIEW" ? "PENDING REVIEW" : (user.verified || user.isVerified) ? "VERIFIED" : "UNVERIFIED"}
                          </span>
                        </div>
                      </td>
                      <td style={tdStyle} className="text-right">
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
                          <button 
                            onClick={() => window.open(`/app/profile/${user.id}`, "_blank")} 
                            style={actionBtnStyle}
                            title="View Profile"
                          >
                            <ExternalLink size={13} /> View Profile
                          </button>
                          <button 
                            onClick={() => {
                              setAdjustingUser(user);
                              setAdjustDelta(-15);
                              setAdjustRule("Rule 303: Meetup Reliability");
                              setAdjustReason("");
                              setShowAdjustTrustModal(true);
                            }}
                            style={actionBtnStyle}
                            title="Adjust Trust Score"
                          >
                            <Settings size={13} /> Adjust Trust Score
                          </button>
                          <button 
                            onClick={() => handleToggleVerification(user)} 
                            style={(user.verified || user.isVerified) ? actionBtnDangerStyle : actionBtnSuccessStyle}
                          >
                            {(user.verified || user.isVerified) ? <UserX size={13} /> : <UserCheck size={13} />}
                            {user.verificationStatus === "PENDING_REVIEW" ? "Approve Verification" : (user.verified || user.isVerified) ? "Revoke Badge" : "Verify Identity"}
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user.id)} 
                            disabled={user.id === userProfile?.uid}
                            style={{ ...actionBtnDangerStyle, opacity: user.id === userProfile?.uid ? 0.3 : 1 }}
                            title="Delete User Document"
                          >
                            <Trash2 size={13} /> Delete Profile
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
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                          <button 
                            onClick={() => window.open(`/app/item/${listing.id}`, "_blank")} 
                            style={actionBtnStyle}
                            title="View Listing Page"
                          >
                            <Eye size={13} /> View Listing
                          </button>
                          <button 
                            onClick={() => handleDeleteListing(listing.id)} 
                            style={actionBtnDangerStyle}
                            title="Delete Listing"
                          >
                            <Trash2 size={13} /> Delete Listing
                          </button>
                        </div>
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
                        <p style={{ fontSize: "0.9rem", color: "var(--text-main)", maxWidth: "500px", wordBreak: "break-word", lineHeight: 1.4, margin: 0 }}>
                          {feedback.message}
                        </p>
                      </td>
                      <td style={tdStyle} className="text-right">
                        <button 
                          onClick={() => handleDeleteFeedback(feedback.id)} 
                          style={actionBtnDangerStyle}
                          title="Delete Feedback"
                        >
                          <Trash2 size={13} /> Delete Feedback
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* REPORTS PANEL */}
          {activeTab === "reports" && (
            <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: "850px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-color)", textAlign: "left" }}>
                  <th style={thStyle}>Reported Member</th>
                  <th style={thStyle}>Filer (Reporter)</th>
                  <th style={thStyle}>Reason & Details</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle} className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "3rem 0", color: "var(--text-muted)" }}>No active reports.</td>
                  </tr>
                ) : (
                  filteredReports.map((report) => {
                    const reportedUser = usersList.find(u => u.id === report.reportedUserId) || {};
                    const reporter = usersList.find(u => u.id === report.reporterId) || {};
                    return (
                      <tr key={report.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                        <td style={tdStyle}>
                          <div>
                            <div style={{ fontWeight: 800, color: "var(--text-main)", fontSize: "0.95rem" }}>
                              {reportedUser.displayName || "Unknown User"}
                            </div>
                            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                              {reportedUser.email || "No Email"}
                            </div>
                            <div style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#EF4444", fontWeight: 700, marginTop: "0.25rem" }}>
                              UID: {report.reportedUserId?.slice(0, 12)}...
                            </div>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <div>
                            <div style={{ fontWeight: 800, color: "var(--text-main)", fontSize: "0.95rem" }}>
                              {reporter.displayName || "Unknown User"}
                            </div>
                            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                              {reporter.email || "No Email"}
                            </div>
                            <div style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                              UID: {report.reporterId?.slice(0, 12)}...
                            </div>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: 800, color: "var(--text-main)" }}>{report.reason}</span>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                            {report.timestamp ? report.timestamp.toDate().toLocaleString() : 'Recent'}
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ padding: "0.2rem 0.5rem", borderRadius: "6px", fontSize: "0.7rem", fontWeight: 700, background: "rgba(239, 68, 68, 0.1)", color: "#EF4444" }}>
                            {report.status?.toUpperCase() || 'ACTIVE'}
                          </span>
                        </td>
                        <td style={tdStyle} className="text-right">
                          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                            <button 
                              onClick={() => handleDismissReport(report.id)} 
                              style={actionBtnStyle}
                            >
                              Dismiss Report
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(report.reportedUserId)} 
                              style={actionBtnDangerStyle}
                              title="Ban/Delete User"
                            >
                              <Trash2 size={13} /> Ban Reported User
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {/* TRANSACTIONS PANEL */}
          {activeTab === "transactions" && (
            <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-color)", textAlign: "left" }}>
                  <th style={thStyle}>Transaction ID</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Amount</th>
                  <th style={thStyle}>Participants (Buyer → Seller)</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle} className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "3rem 0", color: "var(--text-muted)" }}>No transactions match your search.</td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={tdStyle}>
                        <div style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "var(--text-main)", fontWeight: 700 }}>{tx.id.slice(0, 10)}...</div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                          {tx.created_at?.seconds ? tx.created_at.toDate().toLocaleString() : tx.timestamp?.seconds ? tx.timestamp.toDate().toLocaleString() : 'N/A'}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 800, color: "var(--text-main)" }}>₱{(tx.agreed_price || tx.amount || 0).toLocaleString()}</div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-main)", fontFamily: "monospace", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700 }}>BUYER:</span> {tx.buyer_name || tx.buyerId?.slice(0,8)}
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-main)", fontFamily: "monospace", display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.2rem" }}>
                          <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700 }}>SELLER:</span> {tx.seller_masked_name || tx.sellerId?.slice(0,8)}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ 
                          padding: "0.2rem 0.5rem", 
                          borderRadius: "6px", 
                          fontSize: "0.7rem", 
                          fontWeight: 700, 
                          background: tx.status === 'Completed' ? "rgba(16, 185, 129, 0.1)" : tx.status === 'Cancelled' ? "rgba(239, 68, 68, 0.1)" : "rgba(245, 158, 11, 0.1)", 
                          color: tx.status === 'Completed' ? "#10B981" : tx.status === 'Cancelled' ? "#EF4444" : "#F59E0B" 
                        }}>
                          {tx.status?.toUpperCase() || 'PENDING'}
                        </span>
                      </td>
                      <td style={tdStyle} className="text-right">
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                          <button 
                            onClick={() => setViewingTx(tx)} 
                            style={actionBtnStyle}
                          >
                            <Eye size={13} /> Audit Details
                          </button>
                          {tx.status !== "Cancelled" && tx.status !== "Completed" && (
                            <button 
                              onClick={() => handleCancelTransaction(tx.id)} 
                              style={actionBtnDangerStyle}
                            >
                              <X size={13} /> Cancel Transaction
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* DISPUTES PANEL */}
          {activeTab === "disputes" && (
            <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-color)", textAlign: "left" }}>
                  <th style={thStyle}>Dispute Ref</th>
                  <th style={thStyle}>Reporter Alias</th>
                  <th style={thStyle}>Offender ID</th>
                  <th style={thStyle}>Item Listing</th>
                  <th style={thStyle}>Violation Reason</th>
                  <th style={thStyle}>Comments</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle} className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDisputes.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "3rem 0", color: "var(--text-muted)" }}>No transaction disputes matching search.</td>
                  </tr>
                ) : (
                  filteredDisputes.map((dispute) => (
                    <tr key={dispute.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 800, color: "var(--text-main)", fontSize: "0.9rem" }}>{dispute.reference_number || "TRX-UNKNOWN"}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace" }}>ID: {dispute.id.slice(0, 8)}...</div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-main)", fontWeight: 700 }}>{dispute.reporterAlias || "Anonymous"}</div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "monospace" }}>UID: {dispute.reporterId?.slice(0, 8)}...</div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-main)", fontFamily: "monospace" }}>UID: {dispute.reportedUserId?.slice(0, 10)}...</div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-main)", fontWeight: 700 }}>{dispute.item_name || "Unknown Item"}</div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 800, color: "#EF4444", fontSize: "0.85rem" }}>{dispute.reason}</span>
                      </td>
                      <td style={tdStyle}>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", maxWidth: "250px", wordBreak: "break-word", margin: 0, lineHeight: 1.3 }}>
                          {dispute.comments}
                        </p>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ 
                          padding: "0.2rem 0.5rem", 
                          borderRadius: "6px", 
                          fontSize: "0.7rem", 
                          fontWeight: 700, 
                          background: dispute.status === 'resolved' ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)", 
                          color: dispute.status === 'resolved' ? "#10B981" : "#EF4444" 
                        }}>
                          {dispute.status?.toUpperCase() || 'ACTIVE'}
                        </span>
                      </td>
                      <td style={tdStyle} className="text-right">
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
                          <button 
                            onClick={() => handleAuditDisputeReceipt(dispute)} 
                            style={actionBtnStyle}
                          >
                            <Eye size={13} /> Audit Receipt
                          </button>
                          {dispute.status !== "resolved" && (
                            <>
                              <button 
                                onClick={() => handleDismissDispute(dispute)} 
                                style={actionBtnSuccessStyle}
                              >
                                <Check size={13} /> Dismiss Dispute
                              </button>
                              <button 
                                onClick={() => handleUpholdDispute(dispute)} 
                                style={actionBtnDangerStyle}
                              >
                                <AlertTriangle size={13} /> Uphold Dispute & Penalty
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* TRUST LOGS PANEL */}
          {activeTab === "trustLogs" && (
            <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: "850px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-color)", textAlign: "left" }}>
                  <th style={thStyle}>Date & Time</th>
                  <th style={thStyle}>Recipient Member</th>
                  <th style={thStyle}>Event</th>
                  <th style={thStyle}>Rule Applied</th>
                  <th style={thStyle}>Score Delta</th>
                  <th style={thStyle}>Result Score</th>
                  <th style={thStyle}>Details / Reason</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrustLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "3rem 0", color: "var(--text-muted)" }}>No trust rating logs match your search.</td>
                  </tr>
                ) : (
                  filteredTrustLogs.map((log) => {
                    const user = usersList.find(u => u.id === log.userId) || {};
                    const isPositive = log.change > 0;
                    const logTime = log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : log.timestamp || 'Recent';
                    return (
                      <tr key={log.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                        <td style={tdStyle}>
                          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{logTime}</span>
                        </td>
                        <td style={tdStyle}>
                          <div>
                            <div style={{ fontWeight: 800, color: "var(--text-main)", fontSize: "0.95rem" }}>
                              {user.displayName || "Unknown User"}
                            </div>
                            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                              {user.email || "No Email"}
                            </div>
                            <div style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                              UID: {log.userId?.slice(0, 12)}...
                            </div>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: 700, color: "var(--text-main)" }}>{log.event}</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ padding: "0.2rem 0.5rem", borderRadius: "6px", fontSize: "0.7rem", fontWeight: 800, background: "var(--primary-light)", color: "var(--primary)" }}>
                            {log.ruleApplied || "General"}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: 900, fontSize: "1.1rem", color: isPositive ? "#10B981" : "#EF4444" }}>
                            {isPositive ? `+${log.change}` : log.change}%
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: 800, color: getTrustColor(log.newScore) }}>
                            {log.newScore ?? 100}%
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <p style={{ fontSize: "0.85rem", color: "var(--text-main)", maxWidth: "350px", wordBreak: "break-word", margin: 0, lineHeight: 1.4 }}>
                            {log.reason}
                          </p>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

        </div>
      )}

      {/* Adjust Trust Score Modal Overlay */}
      {showAdjustTrustModal && adjustingUser && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(4px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000
        }}>
          <form onSubmit={handleTrustScoreAdjustmentSubmit} style={{
            background: "var(--card-bg)",
            border: "1px solid var(--border-color)",
            borderRadius: "20px",
            padding: "2rem",
            width: "100%",
            maxWidth: "480px",
            boxShadow: "var(--shadow-premium)",
            color: "var(--text-main)",
            position: "relative"
          }}>
            <button 
              type="button"
              onClick={() => { setShowAdjustTrustModal(false); setAdjustingUser(null); }}
              style={{
                position: "absolute",
                top: "1.25rem",
                right: "1.25rem",
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer"
              }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: "1.5rem", fontWeight: 800, fontFamily: "'Outfit', sans-serif", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Settings size={22} color="var(--primary)" /> Adjust Trust Score
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              Apply a score delta to <strong>{adjustingUser.displayName || "User"}</strong>. All score adjustments are logged in their audit trail for full community transparency.
            </p>

            <div style={{ background: "var(--bg-color)", padding: "0.75rem", borderRadius: "10px", marginBottom: "1.25rem", fontSize: "0.85rem" }}>
              <div><strong>Email:</strong> {adjustingUser.email || "No Email"}</div>
              <div><strong>Current Score:</strong> <span style={{ fontWeight: 800, color: getTrustColor(adjustingUser.trustScore) }}>{adjustingUser.trustScore ?? 100}%</span></div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "0.85rem" }}>Trust Score Delta</label>
                <select 
                  value={adjustDelta} 
                  onChange={(e) => setAdjustDelta(Number(e.target.value))}
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1px solid var(--border-color)", background: "var(--bg-color)", color: "var(--text-main)", fontWeight: 600 }}
                >
                  <option value="-15">-15 (Major Dispute Penalty)</option>
                  <option value="-10">-10 (Standard Infraction)</option>
                  <option value="-5">-5 (Minor Warning)</option>
                  <option value="5">+5 (Trade Success Commendation)</option>
                  <option value="10">+10 (Exemplary Behavior Commendation)</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "0.85rem" }}>Rule / Violation Category</label>
                <select 
                  value={adjustRule} 
                  onChange={(e) => setAdjustRule(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1px solid var(--border-color)", background: "var(--bg-color)", color: "var(--text-main)", fontWeight: 600 }}
                >
                  <option value="Rule 101: General Conduct">Rule 101: General Conduct</option>
                  <option value="Rule 202: Listing Accuracy">Rule 202: Listing Accuracy</option>
                  <option value="Rule 303: Meetup Reliability">Rule 303: Meetup Reliability</option>
                  <option value="Rule 404: Financial Authenticity">Rule 404: Financial Authenticity</option>
                  <option value="Rule 505: Communication Policy">Rule 505: Communication Policy</option>
                  <option value="Commendation 1: Positive Trade">Commendation 1: Positive Trade</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "0.85rem" }}>Reason Description</label>
                <textarea 
                  required
                  rows={3}
                  placeholder="Explanatory reason shown on user's security dashboard..."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1px solid var(--border-color)", background: "var(--bg-color)", color: "var(--text-main)", fontFamily: "inherit", resize: "none", fontSize: "0.9rem" }}
                />
              </div>

            </div>

            <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button 
                type="button" 
                onClick={() => { setShowAdjustTrustModal(false); setAdjustingUser(null); }} 
                className="btn-secondary" 
                style={{ padding: "0.5rem 1rem", borderRadius: "10px" }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={submittingAdjust}
                className="btn-primary" 
                style={{ padding: "0.5rem 1.25rem", borderRadius: "10px", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
              >
                {submittingAdjust ? "Applying..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Audit Receipt Modal Overlay */}
      {viewingTx && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(4px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "var(--card-bg)",
            border: "1px solid var(--border-color)",
            borderRadius: "20px",
            padding: "2rem",
            width: "100%",
            maxWidth: "540px",
            boxShadow: "var(--shadow-premium)",
            color: "var(--text-main)",
            position: "relative"
          }}>
            <button 
              onClick={() => setViewingTx(null)}
              style={{
                position: "absolute",
                top: "1.25rem",
                right: "1.25rem",
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer"
              }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: "1.5rem", fontWeight: 800, fontFamily: "'Outfit', sans-serif", marginBottom: "1.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FileText size={22} color="var(--primary)" /> Trade Receipt Audit Log
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", fontSize: "0.9rem" }}>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700, display: "block", textTransform: "uppercase" }}>Transaction Reference</span>
                  <span style={{ fontWeight: 800, fontFamily: "monospace" }}>{viewingTx.reference_number || "N/A"}</span>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700, display: "block", textTransform: "uppercase" }}>Agreement Status</span>
                  <span style={{ 
                    fontWeight: 800, 
                    padding: "0.15rem 0.5rem", 
                    borderRadius: "4px", 
                    fontSize: "0.75rem",
                    background: viewingTx.status === "Completed" ? "rgba(16, 185, 129, 0.1)" : viewingTx.status === "Cancelled" ? "rgba(239, 68, 68, 0.1)" : "rgba(245, 158, 11, 0.1)",
                    color: viewingTx.status === "Completed" ? "#10B981" : viewingTx.status === "Cancelled" ? "#EF4444" : "#F59E0B"
                  }}>{viewingTx.status?.toUpperCase() || "PENDING"}</span>
                </div>
              </div>

              <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }} />

              <div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700, display: "block", textTransform: "uppercase" }}>Item Listing Details</span>
                <span style={{ fontWeight: 800 }}>{viewingTx.item_name || "Unnamed Item"}</span>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginLeft: "0.5rem" }}>({viewingTx.item_condition || "Used"})</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700, display: "block", textTransform: "uppercase" }}>Agreed Valuation</span>
                  <span style={{ fontWeight: 800 }}>₱{(viewingTx.agreed_price || viewingTx.amount || 0).toLocaleString()}</span>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700, display: "block", textTransform: "uppercase" }}>Payment Mode</span>
                  <span style={{ fontWeight: 800, color: "var(--primary)" }}>{viewingTx.payment_method || "Direct Trade"}</span>
                </div>
              </div>

              <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }} />

              <div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700, display: "block", textTransform: "uppercase" }}>Meetup Venue</span>
                <span style={{ fontWeight: 800 }}>{viewingTx.meetup_location || "Davao City Spot"}</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700, display: "block", textTransform: "uppercase" }}>Meetup Schedule</span>
                  <span style={{ fontWeight: 700 }}>{viewingTx.meetup_date || "N/A"} @ {viewingTx.meetup_time || "N/A"}</span>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700, display: "block", textTransform: "uppercase" }}>Agreement Created At</span>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    {viewingTx.created_at?.seconds ? viewingTx.created_at.toDate().toLocaleString() : viewingTx.timestamp?.seconds ? viewingTx.timestamp.toDate().toLocaleString() : "N/A"}
                  </span>
                </div>
              </div>

              <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }} />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", background: "var(--bg-color)", padding: "0.75rem", borderRadius: "10px" }}>
                <div>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.7rem", fontWeight: 700, display: "block", textTransform: "uppercase" }}>Buyer Account / PIN</span>
                  <span style={{ fontFamily: "monospace", fontSize: "0.8rem", display: "block", overflow: "hidden", textOverflow: "ellipsis" }}>{viewingTx.buyer_name ? `${viewingTx.buyer_name} (${viewingTx.buyerId?.slice(0,6)})` : viewingTx.buyerId || "N/A"}</span>
                  <span style={{ fontWeight: 800, color: "#10B981", fontSize: "0.95rem" }}>PIN: {viewingTx.buyerPin || "------"}</span>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.7rem", fontWeight: 700, display: "block", textTransform: "uppercase" }}>Seller Account / PIN</span>
                  <span style={{ fontFamily: "monospace", fontSize: "0.8rem", display: "block", overflow: "hidden", textOverflow: "ellipsis" }}>{viewingTx.seller_masked_name ? `${viewingTx.seller_masked_name} (${viewingTx.sellerId?.slice(0,6)})` : viewingTx.sellerId || "N/A"}</span>
                  <span style={{ fontWeight: 800, color: "#10B981", fontSize: "0.95rem" }}>PIN: {viewingTx.sellerPin || "------"}</span>
                </div>
              </div>

              {viewingTx.disputed && (
                <div style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "10px", padding: "0.75rem", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                  <AlertCircle size={18} color="#EF4444" style={{ flexShrink: 0, marginTop: "0.1rem" }} />
                  <div>
                    <span style={{ color: "#EF4444", fontWeight: 800, fontSize: "0.85rem", display: "block" }}>DISPUTE STATUS: ACTIVE / FLAGGED</span>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-main)" }}>Reason: {viewingTx.disputeReason || "No reason specified."}</span>
                  </div>
                </div>
              )}

            </div>

            <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setViewingTx(null)} className="btn-secondary" style={{ padding: "0.5rem 1.25rem", borderRadius: "10px", fontWeight: 700 }}>
                Close Audit Log
              </button>
            </div>
          </div>
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

function getVerifyBadgeStyle(verified, status) {
  if (verified || status === "VERIFIED") return { background: "rgba(16, 185, 129, 0.1)", color: "#10B981" };
  if (status === "PENDING_REVIEW") return { background: "rgba(245, 158, 11, 0.15)", color: "#F59E0B" };
  return { background: "var(--border-color)", color: "var(--text-muted)" };
}
