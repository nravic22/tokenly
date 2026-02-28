'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from "react";

// ─── CONFIG & MOCK DATA ────────────────────────────────────────────
const COMPANY_VALUES = ["Innovation", "Teamwork", "Integrity", "Customer First", "Growth Mindset"];
const MONTHLY_ALLOWANCE = 500;

const MOCK_USERS = [
  { id: "u1", name: "Alex Chen", email: "alex@company.io", password: "alex1234", role: "Frontend Engineer", avatar: "AC", dept: "Engineering", walletAddress: "7xKX...m3Rp" },
  { id: "u2", name: "Maya Patel", email: "maya@company.io", password: "maya1234", role: "Product Designer", avatar: "MP", dept: "Design", walletAddress: "4nQz...kL8v" },
  { id: "u3", name: "Jordan Lee", email: "jordan@company.io", password: "jordan1234", role: "Backend Engineer", avatar: "JL", dept: "Engineering", walletAddress: "9bTw...p5Hn" },
  { id: "u4", name: "Sofia Rodriguez", email: "sofia@company.io", password: "sofia1234", role: "Marketing Lead", avatar: "SR", dept: "Marketing", walletAddress: "2mVx...w7Cj" },
  { id: "u5", name: "Kai Nakamura", email: "kai@company.io", password: "kai12345", role: "DevOps Engineer", avatar: "KN", dept: "Engineering", walletAddress: "8fRy...q4Ds" },
  { id: "u6", name: "Priya Sharma", email: "priya@company.io", password: "priya1234", role: "Data Analyst", avatar: "PS", dept: "Analytics", walletAddress: "3gNe...x6Bt" },
];

const MOCK_RECOGNITIONS = [
  { id: "r1", from: "u2", to: "u1", amount: 50, message: "Amazing work shipping the new dashboard! The animations are chef's kiss 🎨", value: "Innovation", timestamp: Date.now() - 3600000, reactions: { "🔥": ["u3","u4"], "💯": ["u5"], "🙌": ["u6"] }, comments: [{ userId: "u3", text: "Totally agree, the UI is incredible!", time: Date.now() - 1800000 }] },
  { id: "r2", from: "u4", to: "u3", amount: 75, message: "Jordan debugged the production issue at 2am. True team player! 🛡️", value: "Teamwork", timestamp: Date.now() - 7200000, reactions: { "🫡": ["u1","u2","u5"], "❤️": ["u6"] }, comments: [] },
  { id: "r3", from: "u1", to: "u6", amount: 40, message: "Priya's data insights completely changed our Q4 strategy. Brilliant analysis!", value: "Growth Mindset", timestamp: Date.now() - 18000000, reactions: { "🧠": ["u2","u4"], "🚀": ["u3"] }, comments: [{ userId: "u4", text: "Her presentation was so clear too!", time: Date.now() - 10000000 }] },
  { id: "r4", from: "u5", to: "u4", amount: 60, message: "Sofia's campaign brought 3x engagement. Marketing wizardry! ✨", value: "Customer First", timestamp: Date.now() - 86400000, reactions: { "✨": ["u1","u2","u3","u6"] }, comments: [] },
  { id: "r5", from: "u3", to: "u2", amount: 55, message: "Maya redesigned the onboarding flow — conversion up 40%! Incredible eye for detail.", value: "Innovation", timestamp: Date.now() - 172800000, reactions: { "🎯": ["u1","u5"], "💜": ["u4","u6"] }, comments: [] },
];

const REWARDS_CATALOG = [
  { id: "rw1", name: "Coffee Gift Card", cost: 100, emoji: "☕", category: "Gift Cards", description: "Premium coffee shop $10 card" },
  { id: "rw2", name: "Lunch Voucher", cost: 200, emoji: "🍕", category: "Gift Cards", description: "$25 restaurant voucher" },
  { id: "rw3", name: "Extra PTO Day", cost: 500, emoji: "🏖️", category: "Experience", description: "One additional day off" },
  { id: "rw4", name: "Tech Gadget Fund", cost: 1000, emoji: "🎧", category: "Tech", description: "$100 towards any gadget" },
  { id: "rw5", name: "Team Dinner", cost: 750, emoji: "🍽️", category: "Experience", description: "Dinner for you + 3 colleagues" },
  { id: "rw6", name: "Charity Donation", cost: 150, emoji: "💝", category: "Giving", description: "Donate $15 to chosen charity" },
  { id: "rw7", name: "Company Hoodie", cost: 300, emoji: "👕", category: "Swag", description: "Premium branded hoodie" },
  { id: "rw8", name: "Learning Budget", cost: 400, emoji: "📚", category: "Growth", description: "$50 for courses/books" },
  { id: "rw9", name: "SOL Airdrop", cost: 800, emoji: "◎", category: "Crypto", description: "0.5 SOL direct to wallet" },
  { id: "rw10", name: "NFT Badge", cost: 250, emoji: "🏆", category: "Crypto", description: "Exclusive achievement NFT" },
];

// ─── UTILITY FUNCTIONS ─────────────────────────────────────────────
function timeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function getAvatarColor(id) {
  const colors = ["#9945FF","#14F195","#F59E0B","#EF4444","#3B82F6","#EC4899","#8B5CF6","#10B981"];
  let hash = 0;
  for (let c of id) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// ─── STYLES ────────────────────────────────────────────────────────
const theme = {
  bg: "#0B0E11",
  bgCard: "#141820",
  bgCardHover: "#1A2030",
  bgInput: "#0F1318",
  border: "#1E2A3A",
  borderFocus: "#9945FF",
  text: "#E8ECF1",
  textMuted: "#6B7A8D",
  textDim: "#4A5568",
  accent: "#9945FF",
  accentGlow: "rgba(153,69,255,0.15)",
  teal: "#14F195",
  tealGlow: "rgba(20,241,149,0.12)",
  orange: "#F59E0B",
  red: "#EF4444",
  gradient: "linear-gradient(135deg, #9945FF, #14F195)",
};

const s = {
  app: { minHeight:"100vh", background:theme.bg, color:theme.text, fontFamily:"'Satoshi', 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif" },
  // Auth styles
  authWrap: { minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:`radial-gradient(ellipse at 30% 20%, ${theme.accentGlow} 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, ${theme.tealGlow} 0%, transparent 50%), ${theme.bg}`, padding:"20px" },
  authCard: { width:"100%", maxWidth:440, background:theme.bgCard, borderRadius:20, border:`1px solid ${theme.border}`, padding:"48px 40px", position:"relative", overflow:"hidden" },
  authTitle: { fontFamily:"'Instrument Serif', Georgia, serif", fontSize:"2.4rem", fontWeight:400, letterSpacing:"-1px", marginBottom:6, textAlign:"center" },
  authSub: { color:theme.textMuted, fontSize:"0.92rem", textAlign:"center", marginBottom:32, lineHeight:1.5 },
  input: { width:"100%", padding:"13px 16px", background:theme.bgInput, border:`1px solid ${theme.border}`, borderRadius:10, color:theme.text, fontSize:"0.9rem", outline:"none", transition:"border-color 0.2s", boxSizing:"border-box", fontFamily:"inherit" },
  label: { display:"block", fontSize:"0.78rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"1.5px", color:theme.textMuted, marginBottom:8 },
  btnPrimary: { width:"100%", padding:"14px", background:theme.gradient, color:"#fff", fontWeight:700, fontSize:"0.9rem", border:"none", borderRadius:12, cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s", letterSpacing:"0.3px" },
  btnWallet: { width:"100%", padding:"14px", background:"transparent", color:theme.text, fontWeight:600, fontSize:"0.9rem", border:`1.5px solid ${theme.border}`, borderRadius:12, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:10, transition:"all 0.2s" },
  divider: { display:"flex", alignItems:"center", gap:16, margin:"24px 0", color:theme.textDim, fontSize:"0.8rem" },
  dividerLine: { flex:1, height:1, background:theme.border },
  // Layout
  layout: { display:"flex", minHeight:"100vh" },
  sidebar: { width:240, background:theme.bgCard, borderRight:`1px solid ${theme.border}`, padding:"24px 0", display:"flex", flexDirection:"column", position:"fixed", top:0, left:0, bottom:0, zIndex:50 },
  main: { flex:1, marginLeft:240, padding:"24px 32px", maxWidth:900 },
  // Nav items
  navItem: (active) => ({ display:"flex", alignItems:"center", gap:12, padding:"11px 24px", fontSize:"0.88rem", fontWeight: active ? 600 : 400, color: active ? theme.text : theme.textMuted, background: active ? theme.accentGlow : "transparent", borderRight: active ? `2px solid ${theme.accent}` : "2px solid transparent", cursor:"pointer", transition:"all 0.15s", textDecoration:"none" }),
  // Cards
  card: { background:theme.bgCard, border:`1px solid ${theme.border}`, borderRadius:16, padding:"24px", marginBottom:16, transition:"all 0.2s" },
  // Recognition
  recogHeader: { display:"flex", alignItems:"center", gap:12, marginBottom:14 },
  avatar: (id, size=40) => ({ width:size, height:size, borderRadius:"50%", background:getAvatarColor(id), display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.35, fontWeight:700, color:"#fff", flexShrink:0 }),
  badge: (color) => ({ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 10px", borderRadius:20, fontSize:"0.72rem", fontWeight:600, background:`${color}18`, color, border:`1px solid ${color}30` }),
  tag: { display:"inline-flex", alignItems:"center", gap:4, padding:"4px 12px", borderRadius:20, fontSize:"0.76rem", fontWeight:600, background:theme.accentGlow, color:theme.accent, border:`1px solid ${theme.accent}25` },
  // Stats
  statCard: { background:theme.bgCard, border:`1px solid ${theme.border}`, borderRadius:14, padding:"20px", textAlign:"center", flex:1 },
  statNum: { fontFamily:"'Instrument Serif', Georgia, serif", fontSize:"2rem", fontWeight:400, letterSpacing:"-1px" },
  statLabel: { fontSize:"0.72rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"1.5px", color:theme.textMuted, marginTop:4 },
  // Modal
  modalOverlay: { position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:20 },
  modal: { background:theme.bgCard, border:`1px solid ${theme.border}`, borderRadius:20, padding:"36px", width:"100%", maxWidth:520, maxHeight:"90vh", overflowY:"auto", position:"relative" },
};

// ─── COMPONENTS ────────────────────────────────────────────────────

function Avatar({ userId, size = 40 }) {
  const user = MOCK_USERS.find(u => u.id === userId);
  return <div style={s.avatar(userId, size)}>{user?.avatar || "?"}</div>;
}

function TokenBadge({ amount }) {
  return (
    <span style={{ ...s.badge(theme.teal), fontFamily:"monospace", fontSize:"0.8rem" }}>
      ◎ {amount} KUDOS
    </span>
  );
}

function ValueTag({ value }) {
  return <span style={s.tag}>★ {value}</span>;
}

// ─── AUTH SCREEN ───────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login"); // login, signup, verify
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [error, setError] = useState("");
  const [walletConnecting, setWalletConnecting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (mode === "signup") {
      if (!name || !email || !password) return setError("All fields are required");
      if (password.length < 6) return setError("Password must be at least 6 characters");
      if (!email.includes("@")) return setError("Please enter a valid email");
      setMode("verify");
    } else if (mode === "verify") {
      if (verifyCode === "123456" || verifyCode.length === 6) {
        onAuth({ ...MOCK_USERS[0], name: name || MOCK_USERS[0].name, email });
      } else {
        setError("Invalid verification code");
      }
    } else {
      if (!email || !password) return setError("All fields are required");
      const user = MOCK_USERS.find(u => u.email === email);
      if (!user) return setError("No account found with this email");
      if (user.password !== password) return setError("Incorrect password. Check the demo credentials below.");
      onAuth(user);
    }
  };

  const fillDemoUser = (demoUser) => {
    setEmail(demoUser.email);
    setPassword(demoUser.password);
    setError("");
  };

  const quickLogin = (demoUser) => {
    onAuth(demoUser);
  };

  const handleWalletConnect = async () => {
    setWalletConnecting(true);
    await new Promise(r => setTimeout(r, 1500));
    if (window.solana && window.solana.isPhantom) {
      try {
        const resp = await window.solana.connect();
        onAuth({ ...MOCK_USERS[0], walletAddress: resp.publicKey.toString() });
      } catch { setWalletConnecting(false); }
    } else {
      onAuth({ ...MOCK_USERS[0], walletAddress: "7xKXnR9Y...m3Rp" });
    }
    setWalletConnecting(false);
  };

  return (
    <div style={s.authWrap}>
      <div style={s.authCard}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:theme.gradient }} />
        <div style={{ textAlign:"center", marginBottom:8 }}>
          <span style={{ fontFamily:"'Instrument Serif', Georgia, serif", fontSize:"1.8rem", background:theme.gradient, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>◎ KudosChain</span>
        </div>
        <h1 style={s.authTitle}>{mode === "verify" ? "Verify Email" : mode === "signup" ? "Create Account" : "Welcome Back"}</h1>
        <p style={s.authSub}>
          {mode === "verify" ? `We sent a 6-digit code to ${email}` : mode === "signup" ? "Join your team's recognition network" : "Recognize. Reward. Grow together."}
        </p>

        {error && <div style={{ background:`${theme.red}15`, border:`1px solid ${theme.red}30`, color:theme.red, padding:"10px 14px", borderRadius:10, fontSize:"0.84rem", marginBottom:16 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {mode === "verify" ? (
            <div style={{ marginBottom:20 }}>
              <label style={s.label}>Verification Code</label>
              <input style={{ ...s.input, textAlign:"center", fontSize:"1.4rem", letterSpacing:"8px", fontFamily:"monospace" }} type="text" maxLength={6} placeholder="000000" value={verifyCode} onChange={e => setVerifyCode(e.target.value)} autoFocus />
              <p style={{ fontSize:"0.78rem", color:theme.textMuted, marginTop:8, textAlign:"center" }}>Demo: enter any 6 digits</p>
            </div>
          ) : (
            <>
              {mode === "signup" && (
                <div style={{ marginBottom:18 }}>
                  <label style={s.label}>Full Name</label>
                  <input style={s.input} type="text" placeholder="Alex Chen" value={name} onChange={e => setName(e.target.value)} autoFocus />
                </div>
              )}
              <div style={{ marginBottom:18 }}>
                <label style={s.label}>Email Address</label>
                <input style={s.input} type="email" placeholder="you@company.io" value={email} onChange={e => setEmail(e.target.value)} autoFocus={mode==="login"} />
              </div>
              <div style={{ marginBottom:24 }}>
                <label style={s.label}>Password</label>
                <input style={s.input} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
            </>
          )}
          <button type="submit" style={s.btnPrimary}>
            {mode === "verify" ? "Verify & Continue →" : mode === "signup" ? "Create Account →" : "Sign In →"}
          </button>
        </form>

        {mode !== "verify" && (
          <>
            <div style={s.divider}>
              <div style={s.dividerLine} />
              <span>or</span>
              <div style={s.dividerLine} />
            </div>
            <button style={s.btnWallet} onClick={handleWalletConnect} disabled={walletConnecting}>
              <span style={{ fontSize:"1.2rem" }}>👻</span>
              {walletConnecting ? "Connecting..." : "Connect Phantom Wallet"}
            </button>
            <p style={{ textAlign:"center", marginTop:20, fontSize:"0.84rem", color:theme.textMuted }}>
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
              <span style={{ color:theme.accent, cursor:"pointer", fontWeight:600 }} onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}>
                {mode === "login" ? "Sign Up" : "Sign In"}
              </span>
            </p>

            {mode === "login" && (
              <div style={{ marginTop:24, background:theme.bgInput, border:`1px solid ${theme.border}`, borderRadius:14, padding:"16px 18px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:12 }}>
                  <span style={{ fontSize:"0.9rem" }}>🔑</span>
                  <span style={{ fontSize:"0.74rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"1.5px", color:theme.orange }}>Demo Accounts</span>
                  <span style={{ fontSize:"0.68rem", color:theme.textDim, marginLeft:"auto" }}>Click to sign in instantly</span>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {MOCK_USERS.map(u => (
                    <div key={u.id} onClick={() => quickLogin(u)} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", borderRadius:10, cursor:"pointer", transition:"all 0.15s", border:"1px solid transparent" }}
                      onMouseEnter={e => { e.currentTarget.style.background = theme.accentGlow; e.currentTarget.style.borderColor = theme.accent + "30"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}>
                      <div style={{ width:30, height:30, borderRadius:"50%", background:getAvatarColor(u.id), display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.6rem", fontWeight:700, color:"#fff", flexShrink:0 }}>{u.avatar}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:"0.82rem", fontWeight:600, color:theme.text }}>{u.name}</div>
                        <div style={{ fontSize:"0.7rem", color:theme.textDim }}>{u.role}</div>
                      </div>
                      <div style={{ padding:"4px 12px", borderRadius:8, background:theme.accent + "20", border:`1px solid ${theme.accent}30`, fontSize:"0.72rem", fontWeight:600, color:theme.accent }}>
                        Sign In →
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── RECOGNITION CARD ──────────────────────────────────────────────
function RecognitionCard({ recog, currentUser, onReact }) {
  const from = MOCK_USERS.find(u => u.id === recog.from);
  const to = MOCK_USERS.find(u => u.id === recog.to);
  const [showComments, setShowComments] = useState(false);
  const reactionEmojis = ["🔥","💯","🙌","❤️","🚀","🎯"];

  return (
    <div style={{ ...s.card, cursor:"default" }} onMouseEnter={e => e.currentTarget.style.borderColor = theme.accent + "40"} onMouseLeave={e => e.currentTarget.style.borderColor = theme.border}>
      <div style={s.recogHeader}>
        <Avatar userId={recog.from} />
        <div style={{ flex:1 }}>
          <div style={{ fontSize:"0.92rem" }}>
            <strong>{from?.name}</strong>
            <span style={{ color:theme.textMuted }}> recognized </span>
            <strong>{to?.name}</strong>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:4 }}>
            <span style={{ fontSize:"0.76rem", color:theme.textDim }}>{timeAgo(recog.timestamp)}</span>
            <TokenBadge amount={recog.amount} />
          </div>
        </div>
      </div>

      <p style={{ fontSize:"0.94rem", lineHeight:1.65, marginBottom:14, padding:"0 0 0 52px" }}>{recog.message}</p>

      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"0 0 0 52px", flexWrap:"wrap" }}>
        <ValueTag value={recog.value} />
        <div style={{ flex:1 }} />
        <div style={{ display:"flex", gap:2, flexWrap:"wrap" }}>
          {Object.entries(recog.reactions).map(([emoji, users]) => (
            <button key={emoji} onClick={() => onReact(recog.id, emoji)} style={{ padding:"4px 10px", borderRadius:20, border: users.includes(currentUser.id) ? `1px solid ${theme.accent}40` : `1px solid ${theme.border}`, background: users.includes(currentUser.id) ? theme.accentGlow : "transparent", cursor:"pointer", fontSize:"0.82rem", color:theme.text, display:"flex", alignItems:"center", gap:4, fontFamily:"inherit" }}>
              {emoji} <span style={{ fontSize:"0.74rem", color:theme.textMuted }}>{users.length}</span>
            </button>
          ))}
          <div style={{ position:"relative", display:"inline-block" }}>
            <button style={{ padding:"4px 8px", borderRadius:20, border:`1px solid ${theme.border}`, background:"transparent", cursor:"pointer", fontSize:"0.82rem", color:theme.textDim, fontFamily:"inherit" }} onClick={(e) => { const menu = e.currentTarget.nextSibling; menu.style.display = menu.style.display === "flex" ? "none" : "flex"; }}>+</button>
            <div style={{ display:"none", position:"absolute", bottom:"100%", right:0, background:theme.bgCard, border:`1px solid ${theme.border}`, borderRadius:12, padding:"6px", gap:2, flexWrap:"wrap", zIndex:10, width:160, marginBottom:4 }}>
              {reactionEmojis.map(em => (
                <button key={em} onClick={() => onReact(recog.id, em)} style={{ padding:"6px 8px", border:"none", background:"transparent", cursor:"pointer", fontSize:"1.1rem", borderRadius:8 }}
                  onMouseEnter={e => e.currentTarget.style.background = theme.accentGlow}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  {em}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {recog.comments.length > 0 && (
        <div style={{ padding:"0 0 0 52px", marginTop:12 }}>
          <button onClick={() => setShowComments(!showComments)} style={{ background:"none", border:"none", color:theme.textMuted, cursor:"pointer", fontSize:"0.8rem", fontFamily:"inherit", padding:0 }}>
            {showComments ? "Hide" : "Show"} {recog.comments.length} comment{recog.comments.length > 1 ? "s" : ""}
          </button>
          {showComments && recog.comments.map((c, i) => {
            const cu = MOCK_USERS.find(u => u.id === c.userId);
            return (
              <div key={i} style={{ display:"flex", gap:8, marginTop:10, alignItems:"flex-start" }}>
                <Avatar userId={c.userId} size={28} />
                <div style={{ background:theme.bgInput, borderRadius:10, padding:"8px 12px", flex:1 }}>
                  <span style={{ fontWeight:600, fontSize:"0.82rem" }}>{cu?.name}</span>
                  <p style={{ fontSize:"0.84rem", color:theme.textMuted, margin:"2px 0 0" }}>{c.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── GIVE RECOGNITION MODAL ────────────────────────────────────────
function GiveRecognitionModal({ currentUser, onClose, onSend }) {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState(50);
  const [message, setMessage] = useState("");
  const [value, setValue] = useState(COMPANY_VALUES[0]);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const filteredUsers = MOCK_USERS.filter(u => u.id !== currentUser.id && u.name.toLowerCase().includes(search.toLowerCase()));

  const handleSend = async () => {
    if (!to || !message) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 1200));
    onSend({ to, amount, message, value });
    setSending(false);
  };

  return (
    <div style={s.modalOverlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:theme.gradient, borderRadius:"20px 20px 0 0" }} />
        <button onClick={onClose} style={{ position:"absolute", top:16, right:16, background:"none", border:"none", color:theme.textMuted, cursor:"pointer", fontSize:"1.2rem" }}>✕</button>
        <h2 style={{ fontFamily:"'Instrument Serif', Georgia, serif", fontSize:"1.6rem", fontWeight:400, marginBottom:4 }}>Send Recognition</h2>
        <p style={{ color:theme.textMuted, fontSize:"0.86rem", marginBottom:28 }}>Celebrate a colleague with KUDOS tokens on Solana</p>

        <div style={{ marginBottom:20, position:"relative" }}>
          <label style={s.label}>Recognize Who?</label>
          <input style={s.input} placeholder="Search teammates..." value={to ? MOCK_USERS.find(u=>u.id===to)?.name : search} onChange={e => { setSearch(e.target.value); setTo(""); setShowDropdown(true); }} onFocus={() => setShowDropdown(true)} />
          {showDropdown && !to && (
            <div style={{ position:"absolute", top:"100%", left:0, right:0, background:theme.bgCard, border:`1px solid ${theme.border}`, borderRadius:10, marginTop:4, maxHeight:180, overflowY:"auto", zIndex:20 }}>
              {filteredUsers.map(u => (
                <div key={u.id} onClick={() => { setTo(u.id); setShowDropdown(false); setSearch(""); }} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", cursor:"pointer", transition:"0.1s" }} onMouseEnter={e => e.currentTarget.style.background = theme.accentGlow} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <Avatar userId={u.id} size={30} />
                  <div><div style={{ fontSize:"0.88rem", fontWeight:500 }}>{u.name}</div><div style={{ fontSize:"0.74rem", color:theme.textMuted }}>{u.role}</div></div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginBottom:20 }}>
          <label style={s.label}>KUDOS Amount ({amount} tokens)</label>
          <input type="range" min={10} max={200} step={5} value={amount} onChange={e => setAmount(Number(e.target.value))} style={{ width:"100%", accentColor:theme.accent }} />
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.72rem", color:theme.textDim }}><span>10</span><span>200</span></div>
        </div>

        <div style={{ marginBottom:20 }}>
          <label style={s.label}>Company Value</label>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {COMPANY_VALUES.map(v => (
              <button key={v} onClick={() => setValue(v)} style={{ padding:"7px 14px", borderRadius:20, fontSize:"0.8rem", fontWeight:500, border: v === value ? `1.5px solid ${theme.accent}` : `1px solid ${theme.border}`, background: v === value ? theme.accentGlow : "transparent", color: v === value ? theme.accent : theme.textMuted, cursor:"pointer", fontFamily:"inherit", transition:"0.15s" }}>
                {v}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom:28 }}>
          <label style={s.label}>Recognition Message</label>
          <textarea style={{ ...s.input, minHeight:90, resize:"vertical", lineHeight:1.5 }} placeholder="What did they do that was awesome?" value={message} onChange={e => setMessage(e.target.value)} />
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", background:theme.bgInput, borderRadius:12, marginBottom:24, border:`1px solid ${theme.border}` }}>
          <span style={{ fontSize:"1.3rem" }}>◎</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:"0.78rem", color:theme.textMuted }}>Transaction Preview</div>
            <div style={{ fontSize:"0.88rem", fontFamily:"monospace" }}>{amount} KUDOS → {to ? MOCK_USERS.find(u=>u.id===to)?.walletAddress || "..." : "..."}</div>
          </div>
          <span style={s.badge(theme.teal)}>Solana SPL</span>
        </div>

        <button onClick={handleSend} disabled={!to || !message || sending} style={{ ...s.btnPrimary, opacity:(!to || !message) ? 0.5 : 1 }}>
          {sending ? "⏳ Confirming on Solana..." : "Send Recognition & Tokens →"}
        </button>
      </div>
    </div>
  );
}

// ─── REWARD MODAL ──────────────────────────────────────────────────
function RedeemModal({ reward, balance, onClose, onRedeem }) {
  const [redeeming, setRedeeming] = useState(false);
  const canAfford = balance >= reward.cost;

  const handleRedeem = async () => {
    setRedeeming(true);
    await new Promise(r => setTimeout(r, 1500));
    onRedeem(reward);
    setRedeeming(false);
  };

  return (
    <div style={s.modalOverlay} onClick={onClose}>
      <div style={{ ...s.modal, maxWidth:420, textAlign:"center" }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position:"absolute", top:16, right:16, background:"none", border:"none", color:theme.textMuted, cursor:"pointer", fontSize:"1.2rem" }}>✕</button>
        <div style={{ fontSize:"3.5rem", marginBottom:12 }}>{reward.emoji}</div>
        <h3 style={{ fontFamily:"'Instrument Serif', Georgia, serif", fontSize:"1.5rem", fontWeight:400, marginBottom:6 }}>{reward.name}</h3>
        <p style={{ color:theme.textMuted, fontSize:"0.88rem", marginBottom:20 }}>{reward.description}</p>
        <div style={{ display:"flex", justifyContent:"center", gap:20, marginBottom:24 }}>
          <div><div style={{ fontSize:"0.72rem", color:theme.textDim, textTransform:"uppercase", letterSpacing:"1px" }}>Cost</div><div style={{ fontFamily:"monospace", fontSize:"1.1rem", color:theme.orange }}>◎ {reward.cost}</div></div>
          <div><div style={{ fontSize:"0.72rem", color:theme.textDim, textTransform:"uppercase", letterSpacing:"1px" }}>Your Balance</div><div style={{ fontFamily:"monospace", fontSize:"1.1rem", color: canAfford ? theme.teal : theme.red }}>◎ {balance}</div></div>
        </div>
        {canAfford ? (
          <button onClick={handleRedeem} disabled={redeeming} style={s.btnPrimary}>
            {redeeming ? "⏳ Processing..." : `Redeem for ◎ ${reward.cost}`}
          </button>
        ) : (
          <div style={{ background:`${theme.red}12`, border:`1px solid ${theme.red}25`, padding:"12px", borderRadius:10, fontSize:"0.86rem", color:theme.red }}>
            You need ◎ {reward.cost - balance} more KUDOS to redeem this reward
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────
export default function KudosChain() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("feed");
  const [recognitions, setRecognitions] = useState(MOCK_RECOGNITIONS);
  const [showGiveModal, setShowGiveModal] = useState(false);
  const [redeemReward, setRedeemReward] = useState(null);
  const [balance, setBalance] = useState(720);
  const [allowanceLeft, setAllowanceLeft] = useState(MONTHLY_ALLOWANCE);
  const [toastMsg, setToastMsg] = useState("");
  const [rewardFilter, setRewardFilter] = useState("All");

  const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(""), 3000); };

  const handleReact = (recogId, emoji) => {
    setRecognitions(prev => prev.map(r => {
      if (r.id !== recogId) return r;
      const reactions = { ...r.reactions };
      if (reactions[emoji]) {
        if (reactions[emoji].includes(user.id)) {
          reactions[emoji] = reactions[emoji].filter(id => id !== user.id);
          if (reactions[emoji].length === 0) delete reactions[emoji];
        } else {
          reactions[emoji] = [...reactions[emoji], user.id];
        }
      } else {
        reactions[emoji] = [user.id];
      }
      return { ...r, reactions };
    }));
  };

  const handleSendRecognition = ({ to, amount, message, value }) => {
    const newRecog = {
      id: `r${Date.now()}`, from: user.id, to, amount, message, value,
      timestamp: Date.now(), reactions: {}, comments: [],
    };
    setRecognitions(prev => [newRecog, ...prev]);
    setAllowanceLeft(prev => prev - amount);
    showToast(`✅ Sent ◎ ${amount} KUDOS! Transaction confirmed on Solana.`);
    setShowGiveModal(false);
  };

  const handleRedeem = (reward) => {
    setBalance(prev => prev - reward.cost);
    showToast(`🎉 Redeemed: ${reward.name}! Check your wallet/email.`);
    setRedeemReward(null);
  };

  // Leaderboard data
  const leaderboard = useMemo(() => {
    const received = {};
    const given = {};
    MOCK_USERS.forEach(u => { received[u.id] = 0; given[u.id] = 0; });
    recognitions.forEach(r => {
      received[r.to] = (received[r.to] || 0) + r.amount;
      given[r.from] = (given[r.from] || 0) + r.amount;
    });
    return MOCK_USERS.map(u => ({ ...u, received: received[u.id], given: given[u.id], total: received[u.id] + given[u.id] })).sort((a, b) => b.received - a.received);
  }, [recognitions]);

  if (!user) return <AuthScreen onAuth={setUser} />;

  const rewardCategories = ["All", ...new Set(REWARDS_CATALOG.map(r => r.category))];
  const filteredRewards = rewardFilter === "All" ? REWARDS_CATALOG : REWARDS_CATALOG.filter(r => r.category === rewardFilter);

  const myReceived = recognitions.filter(r => r.to === user.id).reduce((sum, r) => sum + r.amount, 0);
  const myGiven = recognitions.filter(r => r.from === user.id).reduce((sum, r) => sum + r.amount, 0);

  return (
    <div style={s.app}>
      {/* TOAST */}
      {toastMsg && (
        <div style={{ position:"fixed", top:20, right:20, background:theme.bgCard, border:`1px solid ${theme.teal}40`, borderRadius:12, padding:"14px 20px", zIndex:2000, fontSize:"0.88rem", color:theme.teal, boxShadow:`0 8px 32px rgba(0,0,0,0.4)`, animation:"slideIn 0.3s ease" }}>
          {toastMsg}
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap');
        @keyframes slideIn { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:6px; } ::-webkit-scrollbar-track { background:transparent; } ::-webkit-scrollbar-thumb { background:${theme.border}; border-radius:3px; }
        input:focus, textarea:focus { border-color:${theme.accent} !important; outline:none; }
        @media (max-width:768px) {
          .sidebar-desktop { display:none !important; }
          .main-content { margin-left:0 !important; padding:16px !important; }
        }
      `}</style>

      <div style={s.layout}>
        {/* SIDEBAR */}
        <aside className="sidebar-desktop" style={s.sidebar}>
          <div style={{ padding:"0 24px 28px" }}>
            <span style={{ fontFamily:"'Instrument Serif', Georgia, serif", fontSize:"1.4rem", background:theme.gradient, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>◎ KudosChain</span>
            <div style={{ fontSize:"0.7rem", color:theme.textDim, marginTop:2, letterSpacing:"1px", textTransform:"uppercase" }}>Powered by Solana</div>
          </div>

          <nav style={{ flex:1 }}>
            {[
              { id:"feed", icon:"📣", label:"Recognition Feed" },
              { id:"give", icon:"🎁", label:"Give Kudos" },
              { id:"rewards", icon:"🏪", label:"Rewards Catalog" },
              { id:"leaderboard", icon:"🏆", label:"Leaderboard" },
              { id:"profile", icon:"👤", label:"My Profile" },
            ].map(item => (
              <div key={item.id} style={s.navItem(page === item.id)} onClick={() => item.id === "give" ? setShowGiveModal(true) : setPage(item.id)}>
                <span style={{ fontSize:"1.05rem" }}>{item.icon}</span>
                {item.label}
              </div>
            ))}
          </nav>

          <div style={{ padding:"0 16px" }}>
            <div style={{ background:theme.bgInput, borderRadius:12, padding:"14px", border:`1px solid ${theme.border}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <Avatar userId={user.id} size={32} />
                <div>
                  <div style={{ fontSize:"0.82rem", fontWeight:600 }}>{user.name}</div>
                  <div style={{ fontSize:"0.7rem", color:theme.textDim, fontFamily:"monospace" }}>{user.walletAddress}</div>
                </div>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <div style={{ flex:1, background:theme.bg, borderRadius:8, padding:"6px", textAlign:"center" }}>
                  <div style={{ fontFamily:"monospace", fontSize:"0.88rem", color:theme.teal }}>◎ {balance}</div>
                  <div style={{ fontSize:"0.64rem", color:theme.textDim }}>BALANCE</div>
                </div>
                <div style={{ flex:1, background:theme.bg, borderRadius:8, padding:"6px", textAlign:"center" }}>
                  <div style={{ fontFamily:"monospace", fontSize:"0.88rem", color:theme.orange }}>◎ {allowanceLeft}</div>
                  <div style={{ fontSize:"0.64rem", color:theme.textDim }}>TO GIVE</div>
                </div>
              </div>
            </div>
            <button onClick={() => setUser(null)} style={{ width:"100%", marginTop:10, padding:"8px", background:"transparent", border:`1px solid ${theme.border}`, borderRadius:8, color:theme.textMuted, cursor:"pointer", fontSize:"0.78rem", fontFamily:"inherit" }}>Sign Out</button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="main-content" style={s.main}>

          {/* ─── MOBILE NAV ─── */}
          <div style={{ display:"none" }} className="mobile-nav">
            <div style={{ display:"flex", gap:4, marginBottom:16, overflowX:"auto" }}>
              {["feed","rewards","leaderboard","profile"].map(p => (
                <button key={p} onClick={() => setPage(p)} style={{ padding:"8px 16px", borderRadius:20, border: page===p ? `1px solid ${theme.accent}` : `1px solid ${theme.border}`, background: page===p ? theme.accentGlow : "transparent", color: page===p ? theme.accent : theme.textMuted, fontSize:"0.8rem", fontWeight:500, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap", textTransform:"capitalize" }}>{p}</button>
              ))}
            </div>
          </div>

          {/* ─── FEED ─── */}
          {page === "feed" && (
            <div style={{ animation:"fadeUp 0.4s ease" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
                <div>
                  <h1 style={{ fontFamily:"'Instrument Serif', Georgia, serif", fontSize:"1.8rem", fontWeight:400, letterSpacing:"-0.5px" }}>Recognition Feed</h1>
                  <p style={{ color:theme.textMuted, fontSize:"0.86rem", marginTop:4 }}>See how your team lifts each other up</p>
                </div>
                <button onClick={() => setShowGiveModal(true)} style={{ ...s.btnPrimary, width:"auto", padding:"12px 24px", display:"flex", alignItems:"center", gap:8 }}>
                  <span>+</span> Give Kudos
                </button>
              </div>

              <div style={{ display:"flex", gap:12, marginBottom:28 }}>
                {[
                  { label:"Your Balance", value:`◎ ${balance}`, color:theme.teal },
                  { label:"Received", value:`◎ ${myReceived}`, color:theme.accent },
                  { label:"Given This Month", value:`◎ ${myGiven}`, color:theme.orange },
                  { label:"Allowance Left", value:`◎ ${allowanceLeft}`, color:theme.text },
                ].map((stat, i) => (
                  <div key={i} style={s.statCard}>
                    <div style={{ ...s.statNum, color:stat.color, fontSize:"1.5rem" }}>{stat.value}</div>
                    <div style={s.statLabel}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {recognitions.map(r => (
                <RecognitionCard key={r.id} recog={r} currentUser={user} onReact={handleReact} />
              ))}
            </div>
          )}

          {/* ─── REWARDS ─── */}
          {page === "rewards" && (
            <div style={{ animation:"fadeUp 0.4s ease" }}>
              <div style={{ marginBottom:24 }}>
                <h1 style={{ fontFamily:"'Instrument Serif', Georgia, serif", fontSize:"1.8rem", fontWeight:400, letterSpacing:"-0.5px" }}>Rewards Catalog</h1>
                <p style={{ color:theme.textMuted, fontSize:"0.86rem", marginTop:4 }}>Redeem your KUDOS tokens for awesome rewards</p>
              </div>

              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:24, flexWrap:"wrap" }}>
                <div style={{ ...s.badge(theme.teal), padding:"6px 14px", fontSize:"0.84rem" }}>◎ {balance} available</div>
                <div style={{ flex:1 }} />
                {rewardCategories.map(cat => (
                  <button key={cat} onClick={() => setRewardFilter(cat)} style={{ padding:"6px 14px", borderRadius:20, fontSize:"0.78rem", fontWeight:500, border: rewardFilter===cat ? `1px solid ${theme.accent}` : `1px solid ${theme.border}`, background: rewardFilter===cat ? theme.accentGlow : "transparent", color: rewardFilter===cat ? theme.accent : theme.textMuted, cursor:"pointer", fontFamily:"inherit" }}>
                    {cat}
                  </button>
                ))}
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:16 }}>
                {filteredRewards.map(reward => (
                  <div key={reward.id} onClick={() => setRedeemReward(reward)} style={{ ...s.card, cursor:"pointer", textAlign:"center", padding:"28px 20px" }} onMouseEnter={e => { e.currentTarget.style.borderColor = theme.accent + "40"; e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.transform = "none"; }}>
                    <div style={{ fontSize:"2.4rem", marginBottom:12 }}>{reward.emoji}</div>
                    <h3 style={{ fontSize:"1rem", fontWeight:600, marginBottom:4 }}>{reward.name}</h3>
                    <p style={{ fontSize:"0.8rem", color:theme.textMuted, marginBottom:14, lineHeight:1.4 }}>{reward.description}</p>
                    <div style={{ fontFamily:"monospace", fontSize:"1rem", color: balance >= reward.cost ? theme.teal : theme.red, fontWeight:600 }}>◎ {reward.cost}</div>
                    <div style={{ fontSize:"0.68rem", color:theme.textDim, marginTop:2, textTransform:"uppercase", letterSpacing:"1px" }}>{reward.category}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── LEADERBOARD ─── */}
          {page === "leaderboard" && (
            <div style={{ animation:"fadeUp 0.4s ease" }}>
              <div style={{ marginBottom:24 }}>
                <h1 style={{ fontFamily:"'Instrument Serif', Georgia, serif", fontSize:"1.8rem", fontWeight:400, letterSpacing:"-0.5px" }}>Leaderboard</h1>
                <p style={{ color:theme.textMuted, fontSize:"0.86rem", marginTop:4 }}>Top recognized teammates this month</p>
              </div>

              {/* Top 3 podium */}
              <div style={{ display:"flex", gap:16, marginBottom:32, justifyContent:"center", alignItems:"flex-end" }}>
                {[1, 0, 2].map((idx, pos) => {
                  const u = leaderboard[idx];
                  if (!u) return null;
                  const heights = [200, 160, 140];
                  const medals = ["🥇", "🥈", "🥉"];
                  return (
                    <div key={u.id} style={{ textAlign:"center", width:160 }}>
                      <Avatar userId={u.id} size={pos === 1 ? 56 : 48} />
                      <div style={{ fontWeight:600, fontSize:"0.9rem", marginTop:8 }}>{u.name}</div>
                      <div style={{ fontSize:"0.76rem", color:theme.textMuted }}>{u.role}</div>
                      <div style={{ background: pos === 1 ? `linear-gradient(180deg, ${theme.accent}30, ${theme.accent}08)` : `${theme.bgCard}`, border:`1px solid ${theme.border}`, borderRadius:"12px 12px 0 0", marginTop:12, height:heights[pos], display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4 }}>
                        <span style={{ fontSize:"2rem" }}>{medals[idx]}</span>
                        <div style={{ fontFamily:"monospace", fontSize:"1.2rem", color:theme.teal }}>◎ {u.received}</div>
                        <div style={{ fontSize:"0.68rem", color:theme.textDim, textTransform:"uppercase", letterSpacing:"1px" }}>Received</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Full table */}
              <div style={{ ...s.card, padding:0, overflow:"hidden" }}>
                <div style={{ display:"grid", gridTemplateColumns:"40px 1fr 100px 100px 100px", padding:"12px 20px", fontSize:"0.7rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"1.5px", color:theme.textDim, borderBottom:`1px solid ${theme.border}` }}>
                  <span>#</span><span>Team Member</span><span style={{ textAlign:"right" }}>Received</span><span style={{ textAlign:"right" }}>Given</span><span style={{ textAlign:"right" }}>Total</span>
                </div>
                {leaderboard.map((u, i) => (
                  <div key={u.id} style={{ display:"grid", gridTemplateColumns:"40px 1fr 100px 100px 100px", padding:"14px 20px", alignItems:"center", borderBottom:`1px solid ${theme.border}`, background: u.id === user.id ? theme.accentGlow : "transparent" }}>
                    <span style={{ fontWeight:700, color: i < 3 ? theme.accent : theme.textDim }}>{i + 1}</span>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <Avatar userId={u.id} size={32} />
                      <div>
                        <div style={{ fontSize:"0.88rem", fontWeight:500 }}>{u.name} {u.id === user.id && <span style={{ fontSize:"0.7rem", color:theme.accent }}>(you)</span>}</div>
                        <div style={{ fontSize:"0.74rem", color:theme.textMuted }}>{u.dept}</div>
                      </div>
                    </div>
                    <div style={{ textAlign:"right", fontFamily:"monospace", color:theme.teal, fontSize:"0.9rem" }}>◎ {u.received}</div>
                    <div style={{ textAlign:"right", fontFamily:"monospace", color:theme.orange, fontSize:"0.9rem" }}>◎ {u.given}</div>
                    <div style={{ textAlign:"right", fontFamily:"monospace", fontSize:"0.9rem" }}>◎ {u.total}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── PROFILE ─── */}
          {page === "profile" && (
            <div style={{ animation:"fadeUp 0.4s ease" }}>
              <div style={{ marginBottom:24 }}>
                <h1 style={{ fontFamily:"'Instrument Serif', Georgia, serif", fontSize:"1.8rem", fontWeight:400, letterSpacing:"-0.5px" }}>My Profile</h1>
              </div>

              <div style={{ ...s.card, display:"flex", gap:24, alignItems:"center" }}>
                <Avatar userId={user.id} size={72} />
                <div style={{ flex:1 }}>
                  <h2 style={{ fontSize:"1.3rem", fontWeight:600 }}>{user.name}</h2>
                  <div style={{ fontSize:"0.88rem", color:theme.textMuted }}>{user.role} · {user.dept || "Engineering"}</div>
                  <div style={{ fontSize:"0.78rem", color:theme.textDim, fontFamily:"monospace", marginTop:6 }}>Wallet: {user.walletAddress}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ ...s.badge(theme.teal), fontSize:"0.9rem", padding:"6px 16px" }}>◎ {balance} KUDOS</div>
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:12, margin:"20px 0" }}>
                {[
                  { label:"Total Received", value:`◎ ${myReceived}`, color:theme.teal },
                  { label:"Total Given", value:`◎ ${myGiven}`, color:theme.orange },
                  { label:"Recognitions Sent", value:recognitions.filter(r => r.from === user.id).length, color:theme.accent },
                  { label:"Recognitions Got", value:recognitions.filter(r => r.to === user.id).length, color:theme.text },
                ].map((stat, i) => (
                  <div key={i} style={s.statCard}>
                    <div style={{ fontFamily:"'Instrument Serif', Georgia, serif", fontSize:"1.6rem", color:stat.color }}>{stat.value}</div>
                    <div style={s.statLabel}>{stat.label}</div>
                  </div>
                ))}
              </div>

              <h3 style={{ fontSize:"1rem", fontWeight:600, marginBottom:14, marginTop:28 }}>Recent Activity</h3>
              {recognitions.filter(r => r.from === user.id || r.to === user.id).slice(0, 5).map(r => {
                const isGiver = r.from === user.id;
                const other = MOCK_USERS.find(u => u.id === (isGiver ? r.to : r.from));
                return (
                  <div key={r.id} style={{ ...s.card, display:"flex", alignItems:"center", gap:14, padding:"16px 20px" }}>
                    <div style={{ fontSize:"1.4rem" }}>{isGiver ? "📤" : "📥"}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:"0.88rem" }}>
                        {isGiver ? "You recognized " : "Recognized by "}
                        <strong>{other?.name}</strong>
                      </div>
                      <div style={{ fontSize:"0.78rem", color:theme.textMuted, marginTop:2 }}>{r.message.substring(0, 80)}...</div>
                    </div>
                    <TokenBadge amount={r.amount} />
                    <span style={{ fontSize:"0.76rem", color:theme.textDim }}>{timeAgo(r.timestamp)}</span>
                  </div>
                );
              })}

              <h3 style={{ fontSize:"1rem", fontWeight:600, marginBottom:14, marginTop:28 }}>Wallet & Blockchain</h3>
              <div style={{ ...s.card }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                  <div>
                    <div style={{ fontSize:"0.72rem", color:theme.textDim, textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>Connected Wallet</div>
                    <div style={{ fontFamily:"monospace", fontSize:"0.88rem" }}>{user.walletAddress}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:"0.72rem", color:theme.textDim, textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>Network</div>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ width:8, height:8, borderRadius:"50%", background:theme.teal }} />
                      <span style={{ fontSize:"0.88rem" }}>Solana Mainnet</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize:"0.72rem", color:theme.textDim, textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>Token Standard</div>
                    <div style={{ fontSize:"0.88rem" }}>SPL Token (KUDOS)</div>
                  </div>
                  <div>
                    <div style={{ fontSize:"0.72rem", color:theme.textDim, textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>Transactions</div>
                    <div style={{ fontSize:"0.88rem" }}>{recognitions.filter(r => r.from === user.id || r.to === user.id).length} on-chain</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODALS */}
      {showGiveModal && <GiveRecognitionModal currentUser={user} onClose={() => setShowGiveModal(false)} onSend={handleSendRecognition} />}
      {redeemReward && <RedeemModal reward={redeemReward} balance={balance} onClose={() => setRedeemReward(null)} onRedeem={handleRedeem} />}
    </div>
  );
}
