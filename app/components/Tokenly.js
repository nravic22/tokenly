'use client';

import { useState, useMemo } from "react";

// ─── CONFIG & MOCK DATA ────────────────────────────────────────────
const COMPANY_VALUES = ["Innovation", "Teamwork", "Integrity", "Customer First", "Growth Mindset"];
const MONTHLY_ALLOWANCE = 500;

// 3 dummy users for demo
const DEMO_USERS = [
  { id: "u1", name: "Alex Chen", email: "alex@company.io", password: "alex1234", role: "Frontend Engineer", avatar: "AC", dept: "Engineering", walletAddress: "7xKX...m3Rp" },
  { id: "u2", name: "Maya Patel", email: "maya@company.io", password: "maya1234", role: "Product Designer", avatar: "MP", dept: "Design", walletAddress: "4nQz...kL8v" },
  { id: "u3", name: "Jordan Lee", email: "jordan@company.io", password: "jordan1234", role: "Backend Engineer", avatar: "JL", dept: "Engineering", walletAddress: "9bTw...p5Hn" },
];

// All known users (demo + signed up) — managed in state
const INITIAL_RECOGNITIONS = [
  { id: "r1", from: "u2", to: "u1", amount: 50, message: "Amazing work shipping the new dashboard! The animations are chef's kiss 🎨", value: "Innovation", timestamp: Date.now() - 3600000, reactions: { "🔥": ["u3"], "💯": ["u2"] }, comments: [{ userId: "u3", text: "Totally agree, the UI is incredible!", time: Date.now() - 1800000 }] },
  { id: "r2", from: "u1", to: "u3", amount: 75, message: "Jordan debugged the production issue at 2am. True team player! 🛡️", value: "Teamwork", timestamp: Date.now() - 7200000, reactions: { "🫡": ["u1","u2"] }, comments: [] },
  { id: "r3", from: "u3", to: "u2", amount: 55, message: "Maya redesigned the onboarding flow — conversion up 40%! Incredible eye for detail.", value: "Innovation", timestamp: Date.now() - 86400000, reactions: { "🎯": ["u1"], "💜": ["u3"] }, comments: [] },
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

// ─── UTILITIES ─────────────────────────────────────────────────────
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
  for (let c of (id || "x")) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function makeAvatar(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// ─── THEME ─────────────────────────────────────────────────────────
const T = {
  bg: "#0B0E11", bgCard: "#141820", bgHover: "#1A2030", bgInput: "#0F1318",
  border: "#1E2A3A", borderFocus: "#9945FF",
  text: "#E8ECF1", textMuted: "#6B7A8D", textDim: "#4A5568",
  accent: "#9945FF", accentGlow: "rgba(153,69,255,0.15)",
  teal: "#14F195", tealGlow: "rgba(20,241,149,0.12)",
  orange: "#F59E0B", red: "#EF4444",
  gradient: "linear-gradient(135deg, #9945FF, #14F195)",
};

// ─── SMALL COMPONENTS ──────────────────────────────────────────────
function Avatar({ userId, size = 40, name }) {
  const label = name ? makeAvatar(name) : "?";
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:getAvatarColor(userId||name||"x"), display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.35, fontWeight:700, color:"#fff", flexShrink:0 }}>
      {label}
    </div>
  );
}

function TokenBadge({ amount }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 10px", borderRadius:20, fontSize:"0.8rem", fontWeight:600, background:`${T.teal}18`, color:T.teal, border:`1px solid ${T.teal}30`, fontFamily:"monospace" }}>
      ◎ {amount} KUDOS
    </span>
  );
}

// ─── AUTH SCREEN ───────────────────────────────────────────────────
function AuthScreen({ onAuth, allUsers, setAllUsers }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [dept, setDept] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [walletConnecting, setWalletConnecting] = useState(false);
  const [signupData, setSignupData] = useState(null);

  // ── Real signup via API (Supabase) with fallback to local ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (mode === "signup") {
      if (!name || !email || !password) return setError("All fields are required");
      if (password.length < 6) return setError("Password must be at least 6 characters");
      if (!email.includes("@")) return setError("Please enter a valid email");
      if (allUsers.find(u => u.email === email)) return setError("An account with this email already exists");

      setLoading(true);
      try {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role: role || 'Team Member', dept: dept || 'General' }),
        });
        const data = await res.json();

        if (res.ok) {
          // Supabase signup succeeded — go to verify
          setSignupData(data.user);
          setMode("verify");
        } else if (res.status === 503) {
          // Supabase not configured — fallback to local signup
          const newUser = {
            id: `u_${Date.now()}`,
            name,
            email,
            password,
            role: role || "Team Member",
            avatar: makeAvatar(name),
            dept: dept || "General",
            walletAddress: null,
          };
          setSignupData(newUser);
          setMode("verify");
        } else {
          setError(data.error || "Signup failed");
        }
      } catch {
        // Network error — fallback to local
        const newUser = {
          id: `u_${Date.now()}`,
          name,
          email,
          password,
          role: role || "Team Member",
          avatar: makeAvatar(name),
          dept: dept || "General",
          walletAddress: null,
        };
        setSignupData(newUser);
        setMode("verify");
      }
      setLoading(false);

    } else if (mode === "verify") {
      if (verifyCode.length !== 6) return setError("Enter a 6-digit code");
      // Accept any 6 digits for demo / Supabase handles real verification via email link
      setLoading(true);
      const newUser = signupData || {
        id: `u_${Date.now()}`, name, email, password,
        role: role || "Team Member", avatar: makeAvatar(name),
        dept: dept || "General", walletAddress: null,
      };
      // Add to local users list
      setAllUsers(prev => [...prev, newUser]);
      onAuth(newUser);
      setLoading(false);

    } else {
      // ── Login ──
      if (!email || !password) return setError("All fields are required");

      // Check demo users first
      const demoUser = DEMO_USERS.find(u => u.email === email);
      if (demoUser) {
        if (demoUser.password !== password) return setError("Incorrect password");
        onAuth(demoUser);
        return;
      }

      // Check locally signed-up users
      const localUser = allUsers.find(u => u.email === email);
      if (localUser) {
        if (localUser.password !== password) return setError("Incorrect password");
        onAuth(localUser);
        return;
      }

      // Try Supabase API login
      setLoading(true);
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (res.ok && data.user) {
          const u = {
            id: data.user.id,
            name: data.user.name || email.split('@')[0],
            email: data.user.email || email,
            role: data.user.role || "Team Member",
            avatar: data.user.avatar || makeAvatar(data.user.name || email),
            dept: data.user.dept || "General",
            walletAddress: data.user.wallet_address || null,
            password,
          };
          setAllUsers(prev => {
            if (prev.find(x => x.email === u.email)) return prev;
            return [...prev, u];
          });
          onAuth(u);
        } else {
          setError(data.error || "No account found with this email");
        }
      } catch {
        setError("No account found with this email");
      }
      setLoading(false);
    }
  };

  const quickLogin = (user) => onAuth(user);

  const handleWalletConnect = async () => {
    setWalletConnecting(true);
    await new Promise(r => setTimeout(r, 1500));
    if (typeof window !== 'undefined' && window.solana && window.solana.isPhantom) {
      try {
        const resp = await window.solana.connect();
        onAuth({ ...DEMO_USERS[0], walletAddress: resp.publicKey.toString() });
      } catch { /* user rejected */ }
    } else {
      onAuth({ ...DEMO_USERS[0], walletAddress: "7xKXnR9Y...m3Rp" });
    }
    setWalletConnecting(false);
  };

  const inputStyle = { width:"100%", padding:"13px 16px", background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:10, color:T.text, fontSize:"0.9rem", outline:"none", transition:"border-color 0.2s", boxSizing:"border-box", fontFamily:"inherit" };
  const labelStyle = { display:"block", fontSize:"0.78rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"1.5px", color:T.textMuted, marginBottom:8 };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:`radial-gradient(ellipse at 30% 20%, ${T.accentGlow} 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, ${T.tealGlow} 0%, transparent 50%), ${T.bg}`, padding:20 }}>
      <div style={{ width:"100%", maxWidth:440, background:T.bgCard, borderRadius:20, border:`1px solid ${T.border}`, padding:"48px 40px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:T.gradient }} />
        <div style={{ textAlign:"center", marginBottom:8 }}>
          <span style={{ fontFamily:"'Instrument Serif', Georgia, serif", fontSize:"1.8rem", background:T.gradient, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>◎ Tokenly</span>
        </div>
        <h1 style={{ fontFamily:"'Instrument Serif', Georgia, serif", fontSize:"2.4rem", fontWeight:400, letterSpacing:"-1px", marginBottom:6, textAlign:"center" }}>
          {mode === "verify" ? "Verify Email" : mode === "signup" ? "Create Account" : "Welcome Back"}
        </h1>
        <p style={{ color:T.textMuted, fontSize:"0.92rem", textAlign:"center", marginBottom:32, lineHeight:1.5 }}>
          {mode === "verify" ? `We sent a 6-digit code to ${email}` : mode === "signup" ? "Join your team's recognition network" : "Recognize. Reward. Grow together."}
        </p>

        {error && <div style={{ background:`${T.red}15`, border:`1px solid ${T.red}30`, color:T.red, padding:"10px 14px", borderRadius:10, fontSize:"0.84rem", marginBottom:16 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {mode === "verify" ? (
            <div style={{ marginBottom:20 }}>
              <label style={labelStyle}>Verification Code</label>
              <input style={{ ...inputStyle, textAlign:"center", fontSize:"1.4rem", letterSpacing:"8px", fontFamily:"monospace" }} type="text" maxLength={6} placeholder="000000" value={verifyCode} onChange={e => setVerifyCode(e.target.value)} autoFocus />
              <p style={{ fontSize:"0.78rem", color:T.textMuted, marginTop:8, textAlign:"center" }}>Demo: enter any 6 digits to continue</p>
            </div>
          ) : (
            <>
              {mode === "signup" && (
                <>
                  <div style={{ marginBottom:18 }}>
                    <label style={labelStyle}>Full Name *</label>
                    <input style={inputStyle} type="text" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} autoFocus />
                  </div>
                  <div style={{ display:"flex", gap:12, marginBottom:18 }}>
                    <div style={{ flex:1 }}>
                      <label style={labelStyle}>Role</label>
                      <input style={inputStyle} type="text" placeholder="e.g. Designer" value={role} onChange={e => setRole(e.target.value)} />
                    </div>
                    <div style={{ flex:1 }}>
                      <label style={labelStyle}>Department</label>
                      <input style={inputStyle} type="text" placeholder="e.g. Engineering" value={dept} onChange={e => setDept(e.target.value)} />
                    </div>
                  </div>
                </>
              )}
              <div style={{ marginBottom:18 }}>
                <label style={labelStyle}>Email Address *</label>
                <input style={inputStyle} type="email" placeholder="you@company.io" value={email} onChange={e => setEmail(e.target.value)} autoFocus={mode==="login"} />
              </div>
              <div style={{ marginBottom:24 }}>
                <label style={labelStyle}>Password *</label>
                <input style={inputStyle} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
            </>
          )}
          <button type="submit" disabled={loading} style={{ width:"100%", padding:"14px", background: loading ? T.textDim : T.gradient, color:"#fff", fontWeight:700, fontSize:"0.9rem", border:"none", borderRadius:12, cursor: loading ? "wait" : "pointer", fontFamily:"inherit", transition:"all 0.2s", letterSpacing:"0.3px", opacity: loading ? 0.7 : 1 }}>
            {loading ? "⏳ Processing..." : mode === "verify" ? "Verify & Continue →" : mode === "signup" ? "Create Account →" : "Sign In →"}
          </button>
        </form>

        {mode !== "verify" && (
          <>
            <div style={{ display:"flex", alignItems:"center", gap:16, margin:"24px 0", color:T.textDim, fontSize:"0.8rem" }}>
              <div style={{ flex:1, height:1, background:T.border }} />
              <span>or</span>
              <div style={{ flex:1, height:1, background:T.border }} />
            </div>
            <button style={{ width:"100%", padding:"14px", background:"transparent", color:T.text, fontWeight:600, fontSize:"0.9rem", border:`1.5px solid ${T.border}`, borderRadius:12, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:10, transition:"all 0.2s" }} onClick={handleWalletConnect} disabled={walletConnecting}>
              <span style={{ fontSize:"1.2rem" }}>👻</span>
              {walletConnecting ? "Connecting..." : "Connect Phantom Wallet"}
            </button>

            <p style={{ textAlign:"center", marginTop:20, fontSize:"0.84rem", color:T.textMuted }}>
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
              <span style={{ color:T.accent, cursor:"pointer", fontWeight:600 }} onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}>
                {mode === "login" ? "Sign Up" : "Sign In"}
              </span>
            </p>

            {/* Demo accounts */}
            {mode === "login" && (
              <div style={{ marginTop:24, background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:14, padding:"16px 18px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:12 }}>
                  <span style={{ fontSize:"0.9rem" }}>🔑</span>
                  <span style={{ fontSize:"0.74rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"1.5px", color:T.orange }}>Demo Accounts</span>
                  <span style={{ fontSize:"0.68rem", color:T.textDim, marginLeft:"auto" }}>Click to sign in</span>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {DEMO_USERS.map(u => (
                    <div key={u.id} onClick={() => quickLogin(u)} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", borderRadius:10, cursor:"pointer", transition:"all 0.15s", border:"1px solid transparent" }}
                      onMouseEnter={e => { e.currentTarget.style.background = T.accentGlow; e.currentTarget.style.borderColor = T.accent + "30"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}>
                      <Avatar userId={u.id} size={30} name={u.name} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:"0.82rem", fontWeight:600, color:T.text }}>{u.name}</div>
                        <div style={{ fontSize:"0.7rem", color:T.textDim }}>{u.role}</div>
                      </div>
                      <div style={{ padding:"4px 12px", borderRadius:8, background:T.accent + "20", border:`1px solid ${T.accent}30`, fontSize:"0.72rem", fontWeight:600, color:T.accent }}>Sign In →</div>
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
function RecognitionCard({ recog, currentUser, allUsers, onReact }) {
  const from = allUsers.find(u => u.id === recog.from);
  const to = allUsers.find(u => u.id === recog.to);
  const [showComments, setShowComments] = useState(false);
  const reactionEmojis = ["🔥","💯","🙌","❤️","🚀","🎯"];

  return (
    <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:16, padding:24, marginBottom:16, transition:"all 0.2s" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = T.accent + "40"}
      onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
        <Avatar userId={recog.from} size={40} name={from?.name} />
        <div style={{ flex:1 }}>
          <div style={{ fontSize:"0.92rem" }}>
            <strong>{from?.name || "Unknown"}</strong>
            <span style={{ color:T.textMuted }}> recognized </span>
            <strong>{to?.name || "Unknown"}</strong>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:4 }}>
            <span style={{ fontSize:"0.76rem", color:T.textDim }}>{timeAgo(recog.timestamp)}</span>
            <TokenBadge amount={recog.amount} />
          </div>
        </div>
      </div>

      <p style={{ fontSize:"0.94rem", lineHeight:1.65, marginBottom:14, padding:"0 0 0 52px" }}>{recog.message}</p>

      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"0 0 0 52px", flexWrap:"wrap" }}>
        <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"4px 12px", borderRadius:20, fontSize:"0.76rem", fontWeight:600, background:T.accentGlow, color:T.accent, border:`1px solid ${T.accent}25` }}>★ {recog.value}</span>
        <div style={{ flex:1 }} />
        <div style={{ display:"flex", gap:2, flexWrap:"wrap" }}>
          {Object.entries(recog.reactions).map(([emoji, users]) => (
            <button key={emoji} onClick={() => onReact(recog.id, emoji)} style={{ padding:"4px 10px", borderRadius:20, border: users.includes(currentUser.id) ? `1px solid ${T.accent}40` : `1px solid ${T.border}`, background: users.includes(currentUser.id) ? T.accentGlow : "transparent", cursor:"pointer", fontSize:"0.82rem", color:T.text, display:"flex", alignItems:"center", gap:4, fontFamily:"inherit" }}>
              {emoji} <span style={{ fontSize:"0.74rem", color:T.textMuted }}>{users.length}</span>
            </button>
          ))}
          <div style={{ position:"relative", display:"inline-block" }}>
            <button style={{ padding:"4px 8px", borderRadius:20, border:`1px solid ${T.border}`, background:"transparent", cursor:"pointer", fontSize:"0.82rem", color:T.textDim, fontFamily:"inherit" }} onClick={(e) => { const menu = e.currentTarget.nextSibling; menu.style.display = menu.style.display === "flex" ? "none" : "flex"; }}>+</button>
            <div style={{ display:"none", position:"absolute", bottom:"100%", right:0, background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:12, padding:6, gap:2, flexWrap:"wrap", zIndex:10, width:160, marginBottom:4 }}>
              {reactionEmojis.map(em => (
                <button key={em} onClick={() => onReact(recog.id, em)} style={{ padding:"6px 8px", border:"none", background:"transparent", cursor:"pointer", fontSize:"1.1rem", borderRadius:8 }}
                  onMouseEnter={e => e.currentTarget.style.background = T.accentGlow}
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
          <button onClick={() => setShowComments(!showComments)} style={{ background:"none", border:"none", color:T.textMuted, cursor:"pointer", fontSize:"0.8rem", fontFamily:"inherit", padding:0 }}>
            {showComments ? "Hide" : "Show"} {recog.comments.length} comment{recog.comments.length > 1 ? "s" : ""}
          </button>
          {showComments && recog.comments.map((c, i) => {
            const cu = allUsers.find(u => u.id === c.userId);
            return (
              <div key={i} style={{ display:"flex", gap:8, marginTop:10, alignItems:"flex-start" }}>
                <Avatar userId={c.userId} size={28} name={cu?.name} />
                <div style={{ background:T.bgInput, borderRadius:10, padding:"8px 12px", flex:1 }}>
                  <span style={{ fontWeight:600, fontSize:"0.82rem" }}>{cu?.name || "User"}</span>
                  <p style={{ fontSize:"0.84rem", color:T.textMuted, margin:"2px 0 0" }}>{c.text}</p>
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
function GiveRecognitionModal({ currentUser, allUsers, onClose, onSend }) {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState(50);
  const [message, setMessage] = useState("");
  const [value, setValue] = useState(COMPANY_VALUES[0]);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const filteredUsers = allUsers.filter(u => u.id !== currentUser.id && u.name.toLowerCase().includes(search.toLowerCase()));

  const handleSend = async () => {
    if (!to || !message) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 1200));
    onSend({ to, amount, message, value });
    setSending(false);
  };

  const inputStyle = { width:"100%", padding:"13px 16px", background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:10, color:T.text, fontSize:"0.9rem", outline:"none", boxSizing:"border-box", fontFamily:"inherit" };
  const labelStyle = { display:"block", fontSize:"0.78rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"1.5px", color:T.textMuted, marginBottom:8 };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:20 }} onClick={onClose}>
      <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:20, padding:36, width:"100%", maxWidth:520, maxHeight:"90vh", overflowY:"auto", position:"relative" }} onClick={e => e.stopPropagation()}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:T.gradient, borderRadius:"20px 20px 0 0" }} />
        <button onClick={onClose} style={{ position:"absolute", top:16, right:16, background:"none", border:"none", color:T.textMuted, cursor:"pointer", fontSize:"1.2rem" }}>✕</button>
        <h2 style={{ fontFamily:"'Instrument Serif', Georgia, serif", fontSize:"1.6rem", fontWeight:400, marginBottom:4 }}>Send Recognition</h2>
        <p style={{ color:T.textMuted, fontSize:"0.86rem", marginBottom:28 }}>Celebrate a colleague with KUDOS tokens on Solana</p>

        <div style={{ marginBottom:20, position:"relative" }}>
          <label style={labelStyle}>Recognize Who?</label>
          <input style={inputStyle} placeholder="Search teammates..." value={to ? allUsers.find(u=>u.id===to)?.name : search} onChange={e => { setSearch(e.target.value); setTo(""); setShowDropdown(true); }} onFocus={() => setShowDropdown(true)} />
          {showDropdown && !to && (
            <div style={{ position:"absolute", top:"100%", left:0, right:0, background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:10, marginTop:4, maxHeight:180, overflowY:"auto", zIndex:20 }}>
              {filteredUsers.map(u => (
                <div key={u.id} onClick={() => { setTo(u.id); setShowDropdown(false); setSearch(""); }} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", cursor:"pointer", transition:"0.1s" }} onMouseEnter={e => e.currentTarget.style.background = T.accentGlow} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <Avatar userId={u.id} size={30} name={u.name} />
                  <div><div style={{ fontSize:"0.88rem", fontWeight:500 }}>{u.name}</div><div style={{ fontSize:"0.74rem", color:T.textMuted }}>{u.role}</div></div>
                </div>
              ))}
              {filteredUsers.length === 0 && <div style={{ padding:"12px 14px", color:T.textDim, fontSize:"0.84rem" }}>No teammates found</div>}
            </div>
          )}
        </div>

        <div style={{ marginBottom:20 }}>
          <label style={labelStyle}>KUDOS Amount ({amount} tokens)</label>
          <input type="range" min={10} max={200} step={5} value={amount} onChange={e => setAmount(Number(e.target.value))} style={{ width:"100%", accentColor:T.accent }} />
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.72rem", color:T.textDim }}><span>10</span><span>200</span></div>
        </div>

        <div style={{ marginBottom:20 }}>
          <label style={labelStyle}>Company Value</label>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {COMPANY_VALUES.map(v => (
              <button key={v} onClick={() => setValue(v)} style={{ padding:"7px 14px", borderRadius:20, fontSize:"0.8rem", fontWeight:500, border: v === value ? `1.5px solid ${T.accent}` : `1px solid ${T.border}`, background: v === value ? T.accentGlow : "transparent", color: v === value ? T.accent : T.textMuted, cursor:"pointer", fontFamily:"inherit" }}>{v}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom:28 }}>
          <label style={labelStyle}>Recognition Message</label>
          <textarea style={{ ...inputStyle, minHeight:90, resize:"vertical", lineHeight:1.5 }} placeholder="What did they do that was awesome?" value={message} onChange={e => setMessage(e.target.value)} />
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", background:T.bgInput, borderRadius:12, marginBottom:24, border:`1px solid ${T.border}` }}>
          <span style={{ fontSize:"1.3rem" }}>◎</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:"0.78rem", color:T.textMuted }}>Transaction Preview</div>
            <div style={{ fontSize:"0.88rem", fontFamily:"monospace" }}>{amount} KUDOS → {to ? (allUsers.find(u=>u.id===to)?.walletAddress || "pending...") : "..."}</div>
          </div>
          <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 10px", borderRadius:20, fontSize:"0.72rem", fontWeight:600, background:`${T.teal}18`, color:T.teal, border:`1px solid ${T.teal}30` }}>Solana SPL</span>
        </div>

        <button onClick={handleSend} disabled={!to || !message || sending} style={{ width:"100%", padding:"14px", background: (!to || !message) ? T.textDim : T.gradient, color:"#fff", fontWeight:700, fontSize:"0.9rem", border:"none", borderRadius:12, cursor: (!to || !message) ? "default" : "pointer", fontFamily:"inherit", opacity:(!to || !message) ? 0.5 : 1 }}>
          {sending ? "⏳ Confirming on Solana..." : "Send Recognition & Tokens →"}
        </button>
      </div>
    </div>
  );
}

// ─── REDEEM MODAL ──────────────────────────────────────────────────
function RedeemModal({ reward, balance, onClose, onRedeem }) {
  const [redeeming, setRedeeming] = useState(false);
  const canAfford = balance >= reward.cost;
  const handleRedeem = async () => { setRedeeming(true); await new Promise(r => setTimeout(r, 1500)); onRedeem(reward); setRedeeming(false); };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:20 }} onClick={onClose}>
      <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:20, padding:36, width:"100%", maxWidth:420, textAlign:"center", position:"relative" }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position:"absolute", top:16, right:16, background:"none", border:"none", color:T.textMuted, cursor:"pointer", fontSize:"1.2rem" }}>✕</button>
        <div style={{ fontSize:"3.5rem", marginBottom:12 }}>{reward.emoji}</div>
        <h3 style={{ fontFamily:"'Instrument Serif', Georgia, serif", fontSize:"1.5rem", fontWeight:400, marginBottom:6 }}>{reward.name}</h3>
        <p style={{ color:T.textMuted, fontSize:"0.88rem", marginBottom:20 }}>{reward.description}</p>
        <div style={{ display:"flex", justifyContent:"center", gap:20, marginBottom:24 }}>
          <div><div style={{ fontSize:"0.72rem", color:T.textDim, textTransform:"uppercase", letterSpacing:"1px" }}>Cost</div><div style={{ fontFamily:"monospace", fontSize:"1.1rem", color:T.orange }}>◎ {reward.cost}</div></div>
          <div><div style={{ fontSize:"0.72rem", color:T.textDim, textTransform:"uppercase", letterSpacing:"1px" }}>Balance</div><div style={{ fontFamily:"monospace", fontSize:"1.1rem", color: canAfford ? T.teal : T.red }}>◎ {balance}</div></div>
        </div>
        {canAfford ? (
          <button onClick={handleRedeem} disabled={redeeming} style={{ width:"100%", padding:"14px", background:T.gradient, color:"#fff", fontWeight:700, fontSize:"0.9rem", border:"none", borderRadius:12, cursor:"pointer", fontFamily:"inherit" }}>
            {redeeming ? "⏳ Processing..." : `Redeem for ◎ ${reward.cost}`}
          </button>
        ) : (
          <div style={{ background:`${T.red}12`, border:`1px solid ${T.red}25`, padding:"12px", borderRadius:10, fontSize:"0.86rem", color:T.red }}>
            You need ◎ {reward.cost - balance} more KUDOS
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════
export default function Tokenly() {
  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState([...DEMO_USERS]);
  const [page, setPage] = useState("feed");
  const [recognitions, setRecognitions] = useState(INITIAL_RECOGNITIONS);
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
        } else { reactions[emoji] = [...reactions[emoji], user.id]; }
      } else { reactions[emoji] = [user.id]; }
      return { ...r, reactions };
    }));
  };

  const handleSendRecognition = ({ to, amount, message, value }) => {
    const newRecog = { id: `r${Date.now()}`, from: user.id, to, amount, message, value, timestamp: Date.now(), reactions: {}, comments: [] };
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

  const leaderboard = useMemo(() => {
    const received = {}; const given = {};
    allUsers.forEach(u => { received[u.id] = 0; given[u.id] = 0; });
    recognitions.forEach(r => { received[r.to] = (received[r.to] || 0) + r.amount; given[r.from] = (given[r.from] || 0) + r.amount; });
    return allUsers.map(u => ({ ...u, received: received[u.id] || 0, given: given[u.id] || 0, total: (received[u.id] || 0) + (given[u.id] || 0) })).sort((a, b) => b.received - a.received);
  }, [recognitions, allUsers]);

  if (!user) return <AuthScreen onAuth={setUser} allUsers={allUsers} setAllUsers={setAllUsers} />;

  const rewardCategories = ["All", ...new Set(REWARDS_CATALOG.map(r => r.category))];
  const filteredRewards = rewardFilter === "All" ? REWARDS_CATALOG : REWARDS_CATALOG.filter(r => r.category === rewardFilter);
  const myReceived = recognitions.filter(r => r.to === user.id).reduce((sum, r) => sum + r.amount, 0);
  const myGiven = recognitions.filter(r => r.from === user.id).reduce((sum, r) => sum + r.amount, 0);

  const navItems = [
    { id:"feed", icon:"📣", label:"Recognition Feed" },
    { id:"give", icon:"🎁", label:"Give Kudos" },
    { id:"rewards", icon:"🏪", label:"Rewards Catalog" },
    { id:"leaderboard", icon:"🏆", label:"Leaderboard" },
    { id:"profile", icon:"👤", label:"My Profile" },
  ];

  const statCard = { background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:14, padding:20, textAlign:"center", flex:1 };

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.text, fontFamily:"'DM Sans', -apple-system, sans-serif", overflowX:"hidden" }}>
      {toastMsg && (
        <div style={{ position:"fixed", top:20, right:20, background:T.bgCard, border:`1px solid ${T.teal}40`, borderRadius:12, padding:"14px 20px", zIndex:2000, fontSize:"0.88rem", color:T.teal, boxShadow:"0 8px 32px rgba(0,0,0,0.4)", animation:"slideIn 0.3s ease" }}>{toastMsg}</div>
      )}

      <div style={{ display:"flex", minHeight:"100vh" }}>
        {/* SIDEBAR */}
        <aside className="sidebar-desktop" style={{ width:240, background:T.bgCard, borderRight:`1px solid ${T.border}`, padding:"24px 0", display:"flex", flexDirection:"column", position:"fixed", top:0, left:0, bottom:0, zIndex:50 }}>
          <div style={{ padding:"0 24px 28px" }}>
            <span style={{ fontFamily:"'Instrument Serif', Georgia, serif", fontSize:"1.4rem", background:T.gradient, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>◎ Tokenly</span>
            <div style={{ fontSize:"0.7rem", color:T.textDim, marginTop:2, letterSpacing:"1px", textTransform:"uppercase" }}>Powered by Solana</div>
          </div>
          <nav style={{ flex:1 }}>
            {navItems.map(item => (
              <div key={item.id} onClick={() => item.id === "give" ? setShowGiveModal(true) : setPage(item.id)} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 24px", fontSize:"0.88rem", fontWeight: page === item.id ? 600 : 400, color: page === item.id ? T.text : T.textMuted, background: page === item.id ? T.accentGlow : "transparent", borderRight: page === item.id ? `2px solid ${T.accent}` : "2px solid transparent", cursor:"pointer", transition:"all 0.15s" }}>
                <span style={{ fontSize:"1.05rem" }}>{item.icon}</span>{item.label}
              </div>
            ))}
          </nav>
          <div style={{ padding:"0 16px" }}>
            <div style={{ background:T.bgInput, borderRadius:12, padding:14, border:`1px solid ${T.border}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <Avatar userId={user.id} size={32} name={user.name} />
                <div>
                  <div style={{ fontSize:"0.82rem", fontWeight:600 }}>{user.name}</div>
                  <div style={{ fontSize:"0.7rem", color:T.textDim, fontFamily:"monospace" }}>{user.walletAddress || "No wallet"}</div>
                </div>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <div style={{ flex:1, background:T.bg, borderRadius:8, padding:6, textAlign:"center" }}>
                  <div style={{ fontFamily:"monospace", fontSize:"0.88rem", color:T.teal }}>◎ {balance}</div>
                  <div style={{ fontSize:"0.64rem", color:T.textDim }}>BALANCE</div>
                </div>
                <div style={{ flex:1, background:T.bg, borderRadius:8, padding:6, textAlign:"center" }}>
                  <div style={{ fontFamily:"monospace", fontSize:"0.88rem", color:T.orange }}>◎ {allowanceLeft}</div>
                  <div style={{ fontSize:"0.64rem", color:T.textDim }}>TO GIVE</div>
                </div>
              </div>
            </div>
            <button onClick={() => setUser(null)} style={{ width:"100%", marginTop:10, padding:8, background:"transparent", border:`1px solid ${T.border}`, borderRadius:8, color:T.textMuted, cursor:"pointer", fontSize:"0.78rem", fontFamily:"inherit" }}>Sign Out</button>
          </div>
        </aside>

        {/* MOBILE NAV */}
        <nav className="mobile-nav" style={{ display:"none", position:"fixed", bottom:0, left:0, right:0, background:T.bgCard, borderTop:`1px solid ${T.border}`, zIndex:100, justifyContent:"space-around", padding:"8px 0" }}>
          {navItems.filter(n => n.id !== "give").map(item => (
            <div key={item.id} onClick={() => item.id === "give" ? setShowGiveModal(true) : setPage(item.id)} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, fontSize:"0.62rem", color: page === item.id ? T.accent : T.textMuted, cursor:"pointer", padding:"4px 8px" }}>
              <span style={{ fontSize:"1.2rem" }}>{item.icon}</span>
              {item.label.split(" ")[0]}
            </div>
          ))}
        </nav>

        {/* MAIN */}
        <main className="main-content" style={{ flex:1, marginLeft:240, padding:"24px 32px", maxWidth:900, paddingBottom:80, overflow:"hidden" }}>

          {/* FEED */}
          {page === "feed" && (
            <div style={{ animation:"fadeUp 0.4s ease" }}>
              <div className="feed-header" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
                <div>
                  <h1 style={{ fontFamily:"'Instrument Serif', Georgia, serif", fontSize:"1.8rem", fontWeight:400, letterSpacing:"-0.5px" }}>Recognition Feed</h1>
                  <p style={{ color:T.textMuted, fontSize:"0.86rem", marginTop:4 }}>See how your team lifts each other up</p>
                </div>
                <button onClick={() => setShowGiveModal(true)} style={{ padding:"12px 24px", background:T.gradient, color:"#fff", fontWeight:700, fontSize:"0.9rem", border:"none", borderRadius:12, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:8, whiteSpace:"nowrap" }}><span>+</span> Give Kudos</button>
              </div>
              <div className="stat-cards" style={{ display:"flex", gap:12, marginBottom:28 }}>
                {[{ label:"Your Balance", value:`◎ ${balance}`, color:T.teal }, { label:"Received", value:`◎ ${myReceived}`, color:T.accent }, { label:"Given This Month", value:`◎ ${myGiven}`, color:T.orange }, { label:"Allowance Left", value:`◎ ${allowanceLeft}`, color:T.text }].map((s, i) => (
                  <div key={i} style={statCard}>
                    <div style={{ fontFamily:"'Instrument Serif', Georgia, serif", fontSize:"1.5rem", color:s.color, letterSpacing:"-1px" }}>{s.value}</div>
                    <div style={{ fontSize:"0.72rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"1.5px", color:T.textMuted, marginTop:4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {recognitions.map(r => <RecognitionCard key={r.id} recog={r} currentUser={user} allUsers={allUsers} onReact={handleReact} />)}
            </div>
          )}

          {/* REWARDS */}
          {page === "rewards" && (
            <div style={{ animation:"fadeUp 0.4s ease" }}>
              <h1 style={{ fontFamily:"'Instrument Serif', Georgia, serif", fontSize:"1.8rem", fontWeight:400, marginBottom:4 }}>Rewards Catalog</h1>
              <p style={{ color:T.textMuted, fontSize:"0.86rem", marginBottom:24 }}>Redeem your KUDOS tokens for awesome rewards</p>
              <div className="rewards-filter" style={{ display:"flex", alignItems:"center", gap:8, marginBottom:24, flexWrap:"wrap" }}>
                <span style={{ padding:"6px 14px", borderRadius:20, fontSize:"0.84rem", fontWeight:600, background:`${T.teal}18`, color:T.teal, border:`1px solid ${T.teal}30`, fontFamily:"monospace" }}>◎ {balance} available</span>
                <div style={{ flex:1 }} />
                {rewardCategories.map(cat => (
                  <button key={cat} onClick={() => setRewardFilter(cat)} style={{ padding:"6px 14px", borderRadius:20, fontSize:"0.78rem", fontWeight:500, border: rewardFilter===cat ? `1px solid ${T.accent}` : `1px solid ${T.border}`, background: rewardFilter===cat ? T.accentGlow : "transparent", color: rewardFilter===cat ? T.accent : T.textMuted, cursor:"pointer", fontFamily:"inherit" }}>{cat}</button>
                ))}
              </div>
              <div className="rewards-grid" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(min(220px, 100%), 1fr))", gap:16 }}>
                {filteredRewards.map(reward => (
                  <div key={reward.id} onClick={() => setRedeemReward(reward)} style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:16, padding:"28px 20px", textAlign:"center", cursor:"pointer", transition:"all 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent + "40"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = "none"; }}>
                    <div style={{ fontSize:"2.4rem", marginBottom:12 }}>{reward.emoji}</div>
                    <h3 style={{ fontSize:"1rem", fontWeight:600, marginBottom:4 }}>{reward.name}</h3>
                    <p style={{ fontSize:"0.8rem", color:T.textMuted, marginBottom:14, lineHeight:1.4 }}>{reward.description}</p>
                    <div style={{ fontFamily:"monospace", fontSize:"1rem", color: balance >= reward.cost ? T.teal : T.red, fontWeight:600 }}>◎ {reward.cost}</div>
                    <div style={{ fontSize:"0.68rem", color:T.textDim, marginTop:2, textTransform:"uppercase", letterSpacing:"1px" }}>{reward.category}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LEADERBOARD */}
          {page === "leaderboard" && (
            <div style={{ animation:"fadeUp 0.4s ease" }}>
              <h1 style={{ fontFamily:"'Instrument Serif', Georgia, serif", fontSize:"1.8rem", fontWeight:400, marginBottom:4 }}>Leaderboard</h1>
              <p style={{ color:T.textMuted, fontSize:"0.86rem", marginBottom:24 }}>Top recognized teammates this month</p>
              <div className="leaderboard-podium" style={{ display:"flex", gap:16, marginBottom:32, justifyContent:"center", alignItems:"flex-end" }}>
                {[1, 0, 2].map((idx, pos) => {
                  const u = leaderboard[idx]; if (!u) return null;
                  const heights = [200, 160, 140]; const medals = ["🥇", "🥈", "🥉"];
                  return (
                    <div key={u.id} style={{ textAlign:"center", width:160, minWidth:0 }}>
                      <Avatar userId={u.id} size={pos === 1 ? 56 : 48} name={u.name} />
                      <div style={{ fontWeight:600, fontSize:"0.9rem", marginTop:8 }}>{u.name}</div>
                      <div style={{ fontSize:"0.76rem", color:T.textMuted }}>{u.role}</div>
                      <div style={{ background: pos === 1 ? `linear-gradient(180deg, ${T.accent}30, ${T.accent}08)` : T.bgCard, border:`1px solid ${T.border}`, borderRadius:"12px 12px 0 0", marginTop:12, height:heights[pos], display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4 }}>
                        <span style={{ fontSize:"2rem" }}>{medals[idx]}</span>
                        <div style={{ fontFamily:"monospace", fontSize:"1.2rem", color:T.teal }}>◎ {u.received}</div>
                        <div style={{ fontSize:"0.68rem", color:T.textDim, textTransform:"uppercase", letterSpacing:"1px" }}>Received</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:16, overflow:"hidden" }}>
                <div className="leaderboard-table-header" style={{ display:"grid", gridTemplateColumns:"40px 1fr 100px 100px 100px", padding:"12px 20px", fontSize:"0.7rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"1.5px", color:T.textDim, borderBottom:`1px solid ${T.border}` }}>
                  <span>#</span><span>Member</span><span style={{ textAlign:"right" }}>Received</span><span style={{ textAlign:"right" }}>Given</span><span style={{ textAlign:"right" }}>Total</span>
                </div>
                {leaderboard.map((u, i) => (
                  <div key={u.id} className="leaderboard-table-row" style={{ display:"grid", gridTemplateColumns:"40px 1fr 100px 100px 100px", padding:"14px 20px", alignItems:"center", borderBottom:`1px solid ${T.border}`, background: u.id === user.id ? T.accentGlow : "transparent" }}>
                    <span style={{ fontWeight:700, color: i < 3 ? T.accent : T.textDim }}>{i + 1}</span>
                    <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
                      <Avatar userId={u.id} size={32} name={u.name} />
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontSize:"0.88rem", fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.name} {u.id === user.id && <span style={{ fontSize:"0.7rem", color:T.accent }}>(you)</span>}</div>
                        <div style={{ fontSize:"0.74rem", color:T.textMuted }}>{u.dept}</div>
                      </div>
                    </div>
                    <div style={{ textAlign:"right", fontFamily:"monospace", color:T.teal, fontSize:"0.9rem" }}>◎ {u.received}</div>
                    <div style={{ textAlign:"right", fontFamily:"monospace", color:T.orange, fontSize:"0.9rem" }}>◎ {u.given}</div>
                    <div style={{ textAlign:"right", fontFamily:"monospace", fontSize:"0.9rem" }}>◎ {u.total}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PROFILE */}
          {page === "profile" && (
            <div style={{ animation:"fadeUp 0.4s ease" }}>
              <h1 style={{ fontFamily:"'Instrument Serif', Georgia, serif", fontSize:"1.8rem", fontWeight:400, marginBottom:24 }}>My Profile</h1>
              <div className="profile-header" style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:16, padding:24, display:"flex", gap:24, alignItems:"center", marginBottom:16, flexWrap:"wrap" }}>
                <Avatar userId={user.id} size={72} name={user.name} />
                <div style={{ flex:1, minWidth:0 }}>
                  <h2 style={{ fontSize:"1.3rem", fontWeight:600 }}>{user.name}</h2>
                  <div style={{ fontSize:"0.88rem", color:T.textMuted }}>{user.role} · {user.dept || "General"}</div>
                  <div style={{ fontSize:"0.78rem", color:T.textDim, fontFamily:"monospace", marginTop:6, wordBreak:"break-all" }}>Wallet: {user.walletAddress || "Not connected"}</div>
                </div>
                <span style={{ padding:"6px 16px", borderRadius:20, fontSize:"0.9rem", fontWeight:600, background:`${T.teal}18`, color:T.teal, border:`1px solid ${T.teal}30`, fontFamily:"monospace" }}>◎ {balance} KUDOS</span>
              </div>
              <div className="profile-stats" style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:12, marginBottom:28 }}>
                {[{ label:"Total Received", value:`◎ ${myReceived}`, color:T.teal }, { label:"Total Given", value:`◎ ${myGiven}`, color:T.orange }, { label:"Sent", value:recognitions.filter(r => r.from === user.id).length, color:T.accent }, { label:"Got", value:recognitions.filter(r => r.to === user.id).length, color:T.text }].map((s, i) => (
                  <div key={i} style={statCard}>
                    <div style={{ fontFamily:"'Instrument Serif', Georgia, serif", fontSize:"1.6rem", color:s.color }}>{s.value}</div>
                    <div style={{ fontSize:"0.72rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"1.5px", color:T.textMuted, marginTop:4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <h3 style={{ fontSize:"1rem", fontWeight:600, marginBottom:14 }}>Recent Activity</h3>
              {recognitions.filter(r => r.from === user.id || r.to === user.id).slice(0, 5).map(r => {
                const isGiver = r.from === user.id;
                const other = allUsers.find(u => u.id === (isGiver ? r.to : r.from));
                return (
                  <div key={r.id} className="profile-activity-row" style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:16, padding:"16px 20px", marginBottom:12, display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
                    <div style={{ fontSize:"1.4rem" }}>{isGiver ? "📤" : "📥"}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:"0.88rem" }}>{isGiver ? "You recognized " : "Recognized by "}<strong>{other?.name || "Unknown"}</strong></div>
                      <div style={{ fontSize:"0.78rem", color:T.textMuted, marginTop:2, overflow:"hidden", textOverflow:"ellipsis" }}>{r.message.substring(0, 80)}...</div>
                    </div>
                    <div className="activity-meta" style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <TokenBadge amount={r.amount} />
                      <span style={{ fontSize:"0.76rem", color:T.textDim, whiteSpace:"nowrap" }}>{timeAgo(r.timestamp)}</span>
                    </div>
                  </div>
                );
              })}
              <h3 style={{ fontSize:"1rem", fontWeight:600, marginBottom:14, marginTop:28 }}>Wallet & Blockchain</h3>
              <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:16, padding:24 }}>
                <div className="wallet-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                  {[{ label:"Connected Wallet", value: user.walletAddress || "Not connected" }, { label:"Network", value:"Solana Mainnet", dot:true }, { label:"Token Standard", value:"SPL Token (KUDOS)" }, { label:"Transactions", value:`${recognitions.filter(r => r.from === user.id || r.to === user.id).length} on-chain` }].map((item, i) => (
                    <div key={i}>
                      <div style={{ fontSize:"0.72rem", color:T.textDim, textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>{item.label}</div>
                      <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:"0.88rem" }}>
                        {item.dot && <span style={{ width:8, height:8, borderRadius:"50%", background:T.teal }} />}
                        <span style={{ fontFamily: item.label === "Connected Wallet" ? "monospace" : "inherit" }}>{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {showGiveModal && <GiveRecognitionModal currentUser={user} allUsers={allUsers} onClose={() => setShowGiveModal(false)} onSend={handleSendRecognition} />}
      {redeemReward && <RedeemModal reward={redeemReward} balance={balance} onClose={() => setRedeemReward(null)} onRedeem={handleRedeem} />}
    </div>
  );
}
