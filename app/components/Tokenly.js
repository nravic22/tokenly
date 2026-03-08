'use client';

import { useState, useMemo, useEffect } from "react";

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

// ─── THEMES ────────────────────────────────────────────────────────
const THEMES = {
  dark: {
    bg: "#0B0E11", bgCard: "#141820", bgHover: "#1A2030", bgInput: "#0F1318",
    border: "#1E2A3A", borderFocus: "#9945FF",
    text: "#E8ECF1", textMuted: "#6B7A8D", textDim: "#4A5568",
    accent: "#9945FF", accentGlow: "rgba(153,69,255,0.15)",
    teal: "#14F195", tealGlow: "rgba(20,241,149,0.12)",
    orange: "#F59E0B", red: "#EF4444",
    gradient: "linear-gradient(135deg, #9945FF, #14F195)",
  },
  light: {
    bg: "#F5F7FA", bgCard: "#FFFFFF", bgHover: "#EDF0F5", bgInput: "#F0F2F5",
    border: "#D8DEE8", borderFocus: "#7C3AED",
    text: "#1A202C", textMuted: "#5A6577", textDim: "#8896A6",
    accent: "#7C3AED", accentGlow: "rgba(124,58,237,0.1)",
    teal: "#059669", tealGlow: "rgba(5,150,105,0.08)",
    orange: "#D97706", red: "#DC2626",
    gradient: "linear-gradient(135deg, #7C3AED, #059669)",
  },
};

// ─── API HELPER ──────────────────────────────────────────────────
async function apiFetch(url, options = {}) {
  const token = sessionStorage.getItem('tokenly-token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ─── SMALL COMPONENTS ──────────────────────────────────────────────
function Avatar({ userId, size = 40, name }) {
  const label = name ? makeAvatar(name) : "?";
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:getAvatarColor(userId||name||"x"), display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.35, fontWeight:700, color:"#fff", flexShrink:0 }}>
      {label}
    </div>
  );
}

function TokenBadge({ amount, T }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 10px", borderRadius:20, fontSize:"0.8rem", fontWeight:600, background:`${T.teal}18`, color:T.teal, border:`1px solid ${T.teal}30`, fontFamily:"monospace" }}>
      ◎ {amount} KUDOS
    </span>
  );
}

// ─── AUTH SCREEN ───────────────────────────────────────────────────
function AuthScreen({ onAuth, allUsers, setAllUsers, T, theme, setTheme, vendorBranding }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [dept, setDept] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [walletConnecting, setWalletConnecting] = useState(false);

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
          body: JSON.stringify({ name, email, password, role: role || 'Team Member', dept: dept || 'General', vendor_id: vendorBranding?.id || null }),
        });
        const data = await res.json();

        if (res.ok) {
          setSuccess("Account created! Check your email for a confirmation link, then sign in.");
          setMode("login");
          setName(""); setPassword(""); setRole(""); setDept("");
        } else if (res.status === 503) {
          // Supabase not configured — fallback to local signup & auto-login
          const newUser = {
            id: `u_${Date.now()}`, name, email, password,
            role: role || "Team Member", avatar: makeAvatar(name),
            dept: dept || "General", walletAddress: null,
          };
          setAllUsers(prev => [...prev, newUser]);
          onAuth(newUser);
        } else {
          setError(data.error || "Signup failed");
        }
      } catch {
        // Network error — fallback to local signup & auto-login
        const newUser = {
          id: `u_${Date.now()}`, name, email, password,
          role: role || "Team Member", avatar: makeAvatar(name),
          dept: dept || "General", walletAddress: null,
        };
        setAllUsers(prev => [...prev, newUser]);
        onAuth(newUser);
      }
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
            is_super_admin: data.is_super_admin || false,
            token: data.token || null,
            vendors: data.vendors || [],
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
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:`radial-gradient(ellipse at 30% 20%, ${T.accentGlow} 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, ${T.tealGlow} 0%, transparent 50%), ${T.bg}`, padding:20, position:"relative" }}>
      <button onClick={setTheme} style={{ position:"absolute", top:20, right:20, width:40, height:40, borderRadius:12, border:`1px solid ${T.border}`, background:T.bgCard, color:T.text, cursor:"pointer", fontSize:"1.1rem", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s", zIndex:10 }} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>{theme === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19'}</button>
      <div style={{ width:"100%", maxWidth:440, background:T.bgCard, borderRadius:20, border:`1px solid ${T.border}`, padding:"48px 40px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:T.gradient }} />

        {/* Vendor branding or default Tokenly branding */}
        {vendorBranding ? (
          <div style={{ textAlign:"center", marginBottom:20 }}>
            {vendorBranding.logo_url ? (
              <div style={{ background:"#0B0E11", borderRadius:20, padding:"14px 24px", display:"inline-flex", alignItems:"center", justifyContent:"center", marginBottom:12 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={vendorBranding.logo_url} alt={vendorBranding.name} width={200} height={64} style={{ maxHeight:64, maxWidth:200, objectFit:"contain", display:"block" }} />
              </div>
            ) : (
              <>
                <div style={{ width:64, height:64, borderRadius:16, background:T.accentGlow, border:`1px solid ${T.border}`, display:"inline-flex", alignItems:"center", justifyContent:"center", marginBottom:12 }}>
                  <span style={{ fontSize:"1.8rem", fontWeight:700, color:T.accent }}>{vendorBranding.name.charAt(0).toUpperCase()}</span>
                </div>
                <div style={{ fontSize:"1.1rem", fontWeight:600, color:T.text }}>{vendorBranding.name}</div>
              </>
            )}
            <div style={{ fontSize:"0.72rem", color:T.textDim, marginTop:4, letterSpacing:"1px", textTransform:"uppercase" }}>Powered by Tokenly</div>
          </div>
        ) : (
          <div style={{ textAlign:"center", marginBottom:8 }}>
            <span style={{ fontFamily:"'Instrument Serif', Georgia, serif", fontSize:"1.8rem", background:T.gradient, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>◎ Tokenly</span>
          </div>
        )}

        <h1 style={{ fontFamily:"'Instrument Serif', Georgia, serif", fontSize:"2.4rem", fontWeight:400, letterSpacing:"-1px", marginBottom:6, textAlign:"center" }}>
          {mode === "signup" ? "Create Account" : "Welcome Back"}
        </h1>
        <p style={{ color:T.textMuted, fontSize:"0.92rem", textAlign:"center", marginBottom:32, lineHeight:1.5 }}>
          {mode === "signup" ? "Join your team's recognition network" : "Recognize. Reward. Grow together."}
        </p>

        {error && <div style={{ background:`${T.red}15`, border:`1px solid ${T.red}30`, color:T.red, padding:"10px 14px", borderRadius:10, fontSize:"0.84rem", marginBottom:16 }}>{error}</div>}
        {success && <div style={{ background:`${T.teal}15`, border:`1px solid ${T.teal}30`, color:T.teal, padding:"10px 14px", borderRadius:10, fontSize:"0.84rem", marginBottom:16 }}>{success}</div>}

        <form onSubmit={handleSubmit}>
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
          <button type="submit" disabled={loading} style={{ width:"100%", padding:"14px", background: loading ? T.textDim : T.gradient, color:"#fff", fontWeight:700, fontSize:"0.9rem", border:"none", borderRadius:12, cursor: loading ? "wait" : "pointer", fontFamily:"inherit", transition:"all 0.2s", letterSpacing:"0.3px", opacity: loading ? 0.7 : 1 }}>
            {loading ? "⏳ Processing..." : mode === "signup" ? "Create Account →" : "Sign In →"}
          </button>
        </form>

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
              <span style={{ color:T.accent, cursor:"pointer", fontWeight:600 }} onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setSuccess(""); }}>
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
      </div>
    </div>
  );
}

// ─── RECOGNITION CARD ──────────────────────────────────────────────
function RecognitionCard({ recog, currentUser, allUsers, onReact, T }) {
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
            <TokenBadge amount={recog.amount} T={T} />
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
function GiveRecognitionModal({ currentUser, allUsers, onClose, onSend, T }) {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState(50);
  const [message, setMessage] = useState("");
  const [value, setValue] = useState(COMPANY_VALUES[0]);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const filteredUsers = allUsers.filter(u => u.id !== currentUser.id && u.is_super_admin !== true && u.name.toLowerCase().includes(search.toLowerCase()));

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

// ─── VENDOR MANAGEMENT (Super Admin) ──────────────────────────────
function VendorManagement({ T }) {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editVendor, setEditVendor] = useState(null);
  const [expandedVendor, setExpandedVendor] = useState(null);
  const [vendorMembers, setVendorMembers] = useState({});
  const [error, setError] = useState('');
  const [editMemberData, setEditMemberData] = useState(null); // { member, vendorId }
  const [showAddMember, setShowAddMember] = useState(null); // vendorId

  const fetchVendors = async () => {
    try {
      const data = await apiFetch('/api/admin/vendors');
      setVendors(data.vendors || []);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  useEffect(() => { fetchVendors(); }, []);

  const fetchMembers = async (vendorId) => {
    try {
      const data = await apiFetch(`/api/admin/vendors/${vendorId}`);
      setVendorMembers(prev => ({ ...prev, [vendorId]: data.members || [] }));
    } catch {}
  };

  const toggleExpand = (vendorId) => {
    if (expandedVendor === vendorId) {
      setExpandedVendor(null);
    } else {
      setExpandedVendor(vendorId);
      if (!vendorMembers[vendorId]) fetchMembers(vendorId);
    }
  };

  const toggleBlock = async (vendor) => {
    try {
      await apiFetch(`/api/admin/vendors/${vendor.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !vendor.is_active }),
      });
      fetchVendors();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteVendor = async (vendorId) => {
    try {
      await apiFetch(`/api/admin/vendors/${vendorId}`, { method: 'DELETE' });
      fetchVendors();
    } catch (err) {
      setError(err.message);
    }
  };

  const updateMember = async (membershipId, updates, vendorId) => {
    try {
      await apiFetch(`/api/vendor/employees/${membershipId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      setEditMemberData(null);
      fetchMembers(vendorId);
    } catch (err) {
      setError(err.message);
    }
  };

  const removeMember = async (membershipId, vendorId) => {
    if (!confirm('Remove this member from the vendor?')) return;
    try {
      await apiFetch(`/api/vendor/employees/${membershipId}`, { method: 'DELETE' });
      fetchMembers(vendorId);
    } catch (err) {
      setError(err.message);
    }
  };

  const addMemberToVendor = async (vendorId, memberEmail, memberRole) => {
    await apiFetch('/api/vendor/employees', {
      method: 'POST',
      body: JSON.stringify({ vendor_id: vendorId, email: memberEmail, role: memberRole || 'employee' }),
    });
    setShowAddMember(null);
    fetchMembers(vendorId);
  };

  const inputStyle = { width:"100%", padding:"13px 16px", background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:10, color:T.text, fontSize:"0.9rem", outline:"none", boxSizing:"border-box", fontFamily:"inherit" };
  const labelStyle = { display:"block", fontSize:"0.78rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"1.5px", color:T.textMuted, marginBottom:8 };

  return (
    <div style={{ animation:"fadeUp 0.4s ease" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:"'Instrument Serif', Georgia, serif", fontSize:"1.8rem", fontWeight:400, letterSpacing:"-0.5px" }}>Vendor Management</h1>
          <p style={{ color:T.textMuted, fontSize:"0.86rem", marginTop:4 }}>Manage all vendors, their logos, and access</p>
        </div>
        <button onClick={() => setShowAddModal(true)} style={{ padding:"12px 24px", background:T.gradient, color:"#fff", fontWeight:700, fontSize:"0.9rem", border:"none", borderRadius:12, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:8, whiteSpace:"nowrap" }}>+ Add Vendor</button>
      </div>

      {error && <div style={{ background:`${T.red}15`, border:`1px solid ${T.red}30`, color:T.red, padding:"10px 14px", borderRadius:10, fontSize:"0.84rem", marginBottom:16 }}>{error}</div>}

      {loading ? (
        <div style={{ textAlign:"center", padding:40, color:T.textMuted }}>Loading vendors...</div>
      ) : vendors.length === 0 ? (
        <div style={{ textAlign:"center", padding:60, background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:16 }}>
          <div style={{ fontSize:"3rem", marginBottom:12 }}>🏢</div>
          <h3 style={{ fontFamily:"'Instrument Serif', Georgia, serif", fontSize:"1.3rem", fontWeight:400, marginBottom:8 }}>No Vendors Yet</h3>
          <p style={{ color:T.textMuted, fontSize:"0.88rem" }}>Add your first vendor to get started</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {vendors.map(vendor => (
            <div key={vendor.id} style={{ background:T.bgCard, border:`1px solid ${vendor.is_active ? T.border : T.red + '40'}`, borderRadius:16, overflow:"hidden", transition:"all 0.2s" }}>
              {/* Vendor Row */}
              <div style={{ display:"flex", alignItems:"center", gap:16, padding:"20px 24px", cursor:"pointer" }} onClick={() => toggleExpand(vendor.id)}>
                {/* Logo */}
                <div style={{ width:48, height:48, borderRadius:12, background: vendor.logo_url ? 'transparent' : T.accentGlow, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, overflow:"hidden" }}>
                  {vendor.logo_url ? (
                    <img src={vendor.logo_url} alt={vendor.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  ) : (
                    <span style={{ fontSize:"1.2rem", fontWeight:700, color:T.accent }}>{vendor.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:"1rem", fontWeight:600 }}>{vendor.name}</span>
                    <span style={{ padding:"2px 10px", borderRadius:20, fontSize:"0.7rem", fontWeight:600, background: vendor.is_active ? `${T.teal}18` : `${T.red}18`, color: vendor.is_active ? T.teal : T.red, border:`1px solid ${vendor.is_active ? T.teal + '30' : T.red + '30'}` }}>
                      {vendor.is_active ? 'Active' : 'Blocked'}
                    </span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:2 }}>
                    <span style={{ fontSize:"0.78rem", color:T.textDim }}>
                      Created {new Date(vendor.created_at).toLocaleDateString()}
                    </span>
                    {vendor.slug && (
                      <a href={`/v/${vendor.slug}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize:"0.74rem", color:T.accent, textDecoration:"none", display:"inline-flex", alignItems:"center", gap:4, padding:"1px 8px", borderRadius:6, background:T.accentGlow, border:`1px solid ${T.accent}25` }}>
                        /v/{vendor.slug} ↗
                      </a>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display:"flex", gap:8 }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => setEditVendor(vendor)} style={{ padding:"8px 16px", borderRadius:8, border:`1px solid ${T.border}`, background:"transparent", color:T.textMuted, cursor:"pointer", fontSize:"0.78rem", fontFamily:"inherit", fontWeight:500 }}>Edit</button>
                  <button onClick={() => toggleBlock(vendor)} style={{ padding:"8px 16px", borderRadius:8, border:`1px solid ${vendor.is_active ? T.orange + '50' : T.teal + '50'}`, background: vendor.is_active ? `${T.orange}12` : `${T.teal}12`, color: vendor.is_active ? T.orange : T.teal, cursor:"pointer", fontSize:"0.78rem", fontFamily:"inherit", fontWeight:600 }}>
                    {vendor.is_active ? 'Block' : 'Unblock'}
                  </button>
                  <button onClick={() => { if (confirm('Are you sure you want to block this vendor?')) deleteVendor(vendor.id); }} style={{ padding:"8px 12px", borderRadius:8, border:`1px solid ${T.red}30`, background:`${T.red}08`, color:T.red, cursor:"pointer", fontSize:"0.82rem", fontFamily:"inherit" }}>✕</button>
                </div>

                {/* Expand arrow */}
                <span style={{ color:T.textDim, fontSize:"0.9rem", transition:"transform 0.2s", transform: expandedVendor === vendor.id ? "rotate(180deg)" : "rotate(0)" }}>▼</span>
              </div>

              {/* Expanded: Members List */}
              {expandedVendor === vendor.id && (
                <div style={{ borderTop:`1px solid ${T.border}`, padding:"16px 24px", background:T.bgInput }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                    <div style={{ fontSize:"0.78rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"1.5px", color:T.textMuted }}>
                      Members
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setShowAddMember(vendor.id); }} style={{ padding:"6px 14px", borderRadius:8, background:T.accentGlow, border:`1px solid ${T.accent}30`, color:T.accent, cursor:"pointer", fontSize:"0.74rem", fontWeight:600, fontFamily:"inherit" }}>+ Add Member</button>
                  </div>
                  {!vendorMembers[vendor.id] ? (
                    <div style={{ color:T.textDim, fontSize:"0.84rem", padding:8 }}>Loading...</div>
                  ) : vendorMembers[vendor.id].length === 0 ? (
                    <div style={{ color:T.textDim, fontSize:"0.84rem", padding:8 }}>No members yet</div>
                  ) : (
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {vendorMembers[vendor.id].map(member => (
                        <div key={member.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", background:T.bgCard, borderRadius:10, border:`1px solid ${T.border}` }}>
                          <Avatar userId={member.user?.id} size={32} name={member.user?.name} />
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:"0.86rem", fontWeight:500 }}>{member.user?.name || 'Unknown'}</div>
                            <div style={{ fontSize:"0.74rem", color:T.textDim }}>{member.user?.email}</div>
                          </div>
                          <span style={{ padding:"3px 10px", borderRadius:20, fontSize:"0.7rem", fontWeight:600, background:T.accentGlow, color:T.accent, border:`1px solid ${T.accent}25` }}>
                            {member.role === 'vendor_admin' ? 'Admin' : 'Employee'}
                          </span>
                          <span style={{ padding:"3px 10px", borderRadius:20, fontSize:"0.7rem", fontWeight:600, background: member.is_active ? `${T.teal}18` : `${T.red}18`, color: member.is_active ? T.teal : T.red }}>
                            {member.is_active ? 'Active' : 'Inactive'}
                          </span>
                          <div style={{ display:"flex", gap:6 }}>
                            <button onClick={(e) => { e.stopPropagation(); setEditMemberData({ member, vendorId: vendor.id }); }} style={{ padding:"5px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:"transparent", color:T.textMuted, cursor:"pointer", fontSize:"0.74rem", fontFamily:"inherit" }}>Edit</button>
                            <button onClick={(e) => { e.stopPropagation(); removeMember(member.id, vendor.id); }} style={{ padding:"5px 8px", borderRadius:8, border:`1px solid ${T.red}30`, background:`${T.red}08`, color:T.red, cursor:"pointer", fontSize:"0.78rem", fontFamily:"inherit" }}>✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Vendor Modal */}
      {showAddModal && (
        <VendorFormModal
          T={T}
          title="Add New Vendor"
          onClose={() => setShowAddModal(false)}
          onSave={async ({ name, logo_url }) => {
            await apiFetch('/api/admin/vendors', {
              method: 'POST',
              body: JSON.stringify({ name, logo_url }),
            });
            setShowAddModal(false);
            fetchVendors();
          }}
          inputStyle={inputStyle}
          labelStyle={labelStyle}
        />
      )}

      {/* Edit Vendor Modal */}
      {editVendor && (
        <VendorFormModal
          T={T}
          title="Edit Vendor"
          initial={editVendor}
          onClose={() => setEditVendor(null)}
          onSave={async ({ name, logo_url }) => {
            await apiFetch(`/api/admin/vendors/${editVendor.id}`, {
              method: 'PATCH',
              body: JSON.stringify({ name, logo_url }),
            });
            setEditVendor(null);
            fetchVendors();
          }}
          inputStyle={inputStyle}
          labelStyle={labelStyle}
        />
      )}

      {/* Add Member to Vendor Modal (Super Admin) */}
      {showAddMember && (
        <AddMemberModal T={T} onClose={() => setShowAddMember(null)} onSave={(memberEmail, memberRole) => addMemberToVendor(showAddMember, memberEmail, memberRole)} inputStyle={inputStyle} labelStyle={labelStyle} />
      )}

      {/* Edit Member Modal (Super Admin) */}
      {editMemberData && (
        <EditMemberModal T={T} member={editMemberData.member} onClose={() => setEditMemberData(null)} onSave={(updates) => updateMember(editMemberData.member.id, updates, editMemberData.vendorId)} inputStyle={inputStyle} labelStyle={labelStyle} />
      )}
    </div>
  );
}

function VendorFormModal({ T, title, initial, onClose, onSave, inputStyle, labelStyle }) {
  const [name, setName] = useState(initial?.name || '');
  const [slug, setSlug] = useState(initial?.slug || '');
  const [logoUrl, setLogoUrl] = useState(initial?.logo_url || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [slugStatus, setSlugStatus] = useState(null); // null | 'checking' | 'available' | 'taken'
  const slugTimerRef = useState(null);

  const autoSlug = (val) => val.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

  const checkSlugUnique = (slugVal) => {
    if (slugTimerRef[0]) clearTimeout(slugTimerRef[0]);
    if (!slugVal || slugVal.length < 2) { setSlugStatus(null); return; }
    // Skip check if editing and slug hasn't changed
    if (initial?.slug === slugVal) { setSlugStatus('available'); return; }
    setSlugStatus('checking');
    slugTimerRef[0] = setTimeout(async () => {
      try {
        const res = await fetch(`/api/vendor/public/${slugVal}`);
        setSlugStatus(res.ok ? 'taken' : 'available');
      } catch {
        setSlugStatus(null);
      }
    }, 400);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Vendor name is required');
    const finalSlug = slug.trim() || autoSlug(name);
    if (!finalSlug) return setError('URL slug is required');
    if (slugStatus === 'taken') return setError('This URL slug is already taken. Choose a different one.');
    setSaving(true);
    setError('');
    try {
      await onSave({ name: name.trim(), logo_url: logoUrl.trim() || null, slug: finalSlug });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:20 }} onClick={onClose}>
      <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:20, padding:36, width:"100%", maxWidth:480, position:"relative" }} onClick={e => e.stopPropagation()}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:T.gradient, borderRadius:"20px 20px 0 0" }} />
        <button onClick={onClose} style={{ position:"absolute", top:16, right:16, background:"none", border:"none", color:T.textMuted, cursor:"pointer", fontSize:"1.2rem" }}>✕</button>

        <h2 style={{ fontFamily:"'Instrument Serif', Georgia, serif", fontSize:"1.5rem", fontWeight:400, marginBottom:24 }}>{title}</h2>

        {error && <div style={{ background:`${T.red}15`, border:`1px solid ${T.red}30`, color:T.red, padding:"10px 14px", borderRadius:10, fontSize:"0.84rem", marginBottom:16 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom:20 }}>
            <label style={labelStyle}>Vendor Name *</label>
            <input style={inputStyle} type="text" placeholder="e.g. Acme Corp" value={name} onChange={e => { setName(e.target.value); if (!initial) { const s = autoSlug(e.target.value); setSlug(s); checkSlugUnique(s); } }} autoFocus />
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={labelStyle}>URL Slug *</label>
            <div style={{ position:"relative" }}>
              <input style={{ ...inputStyle, paddingRight: 90 }} type="text" placeholder="e.g. acme-corp" value={slug} onChange={e => { const s = autoSlug(e.target.value); setSlug(s); checkSlugUnique(s); }} />
              {slugStatus && (
                <span style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", fontSize:"0.74rem", fontWeight:600, color: slugStatus === 'available' ? T.teal : slugStatus === 'taken' ? T.red : T.textDim }}>
                  {slugStatus === 'checking' ? 'Checking...' : slugStatus === 'available' ? 'Available' : 'Taken'}
                </span>
              )}
            </div>
            <p style={{ fontSize:"0.74rem", color:T.textDim, marginTop:6 }}>Login URL: {typeof window !== 'undefined' ? window.location.origin : ''}/v/{slug || autoSlug(name) || '...'}</p>
          </div>
          <div style={{ marginBottom:24 }}>
            <label style={labelStyle}>Logo URL</label>
            <input style={inputStyle} type="url" placeholder="https://example.com/logo.png" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} />
            {logoUrl && (
              <div style={{ marginTop:12, display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:48, height:48, borderRadius:12, border:`1px solid ${T.border}`, overflow:"hidden" }}>
                  <img src={logoUrl} alt="Preview" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e => e.target.style.display = 'none'} />
                </div>
                <span style={{ fontSize:"0.78rem", color:T.textDim }}>Logo preview</span>
              </div>
            )}
          </div>
          <button type="submit" disabled={saving || slugStatus === 'taken' || slugStatus === 'checking'} style={{ width:"100%", padding:"14px", background: (saving || slugStatus === 'taken') ? T.textDim : T.gradient, color:"#fff", fontWeight:700, fontSize:"0.9rem", border:"none", borderRadius:12, cursor: (saving || slugStatus === 'taken') ? "not-allowed" : "pointer", fontFamily:"inherit", opacity: (saving || slugStatus === 'taken') ? 0.6 : 1 }}>
            {saving ? "Saving..." : initial ? "Update Vendor" : "Create Vendor"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── MEMBER MANAGEMENT (Vendor Admin) ──────────────────────────────
function MemberManagement({ user, T }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editMember, setEditMember] = useState(null);

  // Find the vendor where this user is vendor_admin
  const adminVendor = (user.vendors || []).find(v => v.role === 'vendor_admin');
  const vendorId = adminVendor?.vendor_id;
  const vendorName = adminVendor?.vendor_name || 'Your Vendor';

  const fetchMembers = async () => {
    if (!vendorId) { setLoading(false); return; }
    try {
      const data = await apiFetch(`/api/vendor/employees?vendor_id=${vendorId}`);
      setMembers(data.employees || []);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  useEffect(() => { fetchMembers(); }, [vendorId]);

  const addMember = async (memberEmail, memberRole) => {
    await apiFetch('/api/vendor/employees', {
      method: 'POST',
      body: JSON.stringify({ vendor_id: vendorId, email: memberEmail, role: memberRole || 'employee' }),
    });
    setShowAddModal(false);
    fetchMembers();
  };

  const updateMember = async (membershipId, updates) => {
    try {
      await apiFetch(`/api/vendor/employees/${membershipId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      setEditMember(null);
      fetchMembers();
    } catch (err) {
      setError(err.message);
    }
  };

  const removeMember = async (membershipId) => {
    if (!confirm('Remove this member from the vendor?')) return;
    try {
      await apiFetch(`/api/vendor/employees/${membershipId}`, { method: 'DELETE' });
      fetchMembers();
    } catch (err) {
      setError(err.message);
    }
  };

  const inputStyle = { width:"100%", padding:"13px 16px", background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:10, color:T.text, fontSize:"0.9rem", outline:"none", boxSizing:"border-box", fontFamily:"inherit" };
  const labelStyle = { display:"block", fontSize:"0.78rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"1.5px", color:T.textMuted, marginBottom:8 };

  if (!vendorId) {
    return (
      <div style={{ animation:"fadeUp 0.4s ease", textAlign:"center", padding:60 }}>
        <div style={{ fontSize:"3rem", marginBottom:12 }}>👥</div>
        <h3 style={{ fontFamily:"'Instrument Serif', Georgia, serif", fontSize:"1.3rem", fontWeight:400, marginBottom:8 }}>No Vendor Admin Access</h3>
        <p style={{ color:T.textMuted, fontSize:"0.88rem" }}>You are not an admin of any vendor</p>
      </div>
    );
  }

  return (
    <div style={{ animation:"fadeUp 0.4s ease" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:"'Instrument Serif', Georgia, serif", fontSize:"1.8rem", fontWeight:400, letterSpacing:"-0.5px" }}>Members</h1>
          <p style={{ color:T.textMuted, fontSize:"0.86rem", marginTop:4 }}>{vendorName} — manage your team</p>
        </div>
        <button onClick={() => setShowAddModal(true)} style={{ padding:"12px 24px", background:T.gradient, color:"#fff", fontWeight:700, fontSize:"0.9rem", border:"none", borderRadius:12, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:8, whiteSpace:"nowrap" }}>+ Add Member</button>
      </div>

      {error && <div style={{ background:`${T.red}15`, border:`1px solid ${T.red}30`, color:T.red, padding:"10px 14px", borderRadius:10, fontSize:"0.84rem", marginBottom:16 }}>{error}</div>}

      {loading ? (
        <div style={{ textAlign:"center", padding:40, color:T.textMuted }}>Loading members...</div>
      ) : members.length === 0 ? (
        <div style={{ textAlign:"center", padding:60, background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:16 }}>
          <div style={{ fontSize:"3rem", marginBottom:12 }}>👥</div>
          <h3 style={{ fontFamily:"'Instrument Serif', Georgia, serif", fontSize:"1.3rem", fontWeight:400, marginBottom:8 }}>No Members Yet</h3>
          <p style={{ color:T.textMuted, fontSize:"0.88rem" }}>Add your first team member to get started</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {members.map(member => (
            <div key={member.id} style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:14, padding:"16px 20px", display:"flex", alignItems:"center", gap:14, transition:"all 0.2s" }}>
              <Avatar userId={member.user?.id} size={40} name={member.user?.name} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:"0.92rem", fontWeight:500 }}>{member.user?.name || 'Unknown'}</div>
                <div style={{ fontSize:"0.78rem", color:T.textDim }}>{member.user?.email}</div>
              </div>
              <span style={{ padding:"4px 12px", borderRadius:20, fontSize:"0.72rem", fontWeight:600, background:T.accentGlow, color:T.accent, border:`1px solid ${T.accent}25` }}>
                {member.role === 'vendor_admin' ? 'Admin' : 'Employee'}
              </span>
              <span style={{ padding:"4px 12px", borderRadius:20, fontSize:"0.72rem", fontWeight:600, background: member.is_active ? `${T.teal}18` : `${T.red}18`, color: member.is_active ? T.teal : T.red }}>
                {member.is_active ? 'Active' : 'Inactive'}
              </span>
              <div style={{ display:"flex", gap:6 }}>
                <button onClick={() => setEditMember(member)} style={{ padding:"6px 14px", borderRadius:8, border:`1px solid ${T.border}`, background:"transparent", color:T.textMuted, cursor:"pointer", fontSize:"0.76rem", fontFamily:"inherit" }}>Edit</button>
                <button onClick={() => removeMember(member.id)} style={{ padding:"6px 10px", borderRadius:8, border:`1px solid ${T.red}30`, background:`${T.red}08`, color:T.red, cursor:"pointer", fontSize:"0.82rem", fontFamily:"inherit" }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Member Modal */}
      {showAddModal && (
        <AddMemberModal T={T} onClose={() => setShowAddModal(false)} onSave={addMember} inputStyle={inputStyle} labelStyle={labelStyle} />
      )}

      {/* Edit Member Modal */}
      {editMember && (
        <EditMemberModal T={T} member={editMember} onClose={() => setEditMember(null)} onSave={(updates) => updateMember(editMember.id, updates)} inputStyle={inputStyle} labelStyle={labelStyle} />
      )}
    </div>
  );
}

function AddMemberModal({ T, onClose, onSave, inputStyle, labelStyle }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('employee');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return setError('Email is required');
    setSaving(true);
    setError('');
    try {
      await onSave(email.trim(), role);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:20 }} onClick={onClose}>
      <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:20, padding:36, width:"100%", maxWidth:440, position:"relative" }} onClick={e => e.stopPropagation()}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:T.gradient, borderRadius:"20px 20px 0 0" }} />
        <button onClick={onClose} style={{ position:"absolute", top:16, right:16, background:"none", border:"none", color:T.textMuted, cursor:"pointer", fontSize:"1.2rem" }}>✕</button>
        <h2 style={{ fontFamily:"'Instrument Serif', Georgia, serif", fontSize:"1.5rem", fontWeight:400, marginBottom:24 }}>Add Member</h2>
        {error && <div style={{ background:`${T.red}15`, border:`1px solid ${T.red}30`, color:T.red, padding:"10px 14px", borderRadius:10, fontSize:"0.84rem", marginBottom:16 }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom:20 }}>
            <label style={labelStyle}>Email *</label>
            <input style={inputStyle} type="email" placeholder="employee@company.com" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
          </div>
          <div style={{ marginBottom:24 }}>
            <label style={labelStyle}>Role</label>
            <select style={{ ...inputStyle, cursor:"pointer" }} value={role} onChange={e => setRole(e.target.value)}>
              <option value="employee">Employee</option>
              <option value="vendor_admin">Vendor Admin</option>
            </select>
          </div>
          <button type="submit" disabled={saving} style={{ width:"100%", padding:"14px", background: saving ? T.textDim : T.gradient, color:"#fff", fontWeight:700, fontSize:"0.9rem", border:"none", borderRadius:12, cursor: saving ? "not-allowed" : "pointer", fontFamily:"inherit", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Adding..." : "Add Member"}
          </button>
        </form>
      </div>
    </div>
  );
}

function EditMemberModal({ T, member, onClose, onSave, inputStyle, labelStyle }) {
  const [role, setRole] = useState(member.role || 'employee');
  const [isActive, setIsActive] = useState(member.is_active !== false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave({ role, is_active: isActive });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:20 }} onClick={onClose}>
      <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:20, padding:36, width:"100%", maxWidth:440, position:"relative" }} onClick={e => e.stopPropagation()}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:T.gradient, borderRadius:"20px 20px 0 0" }} />
        <button onClick={onClose} style={{ position:"absolute", top:16, right:16, background:"none", border:"none", color:T.textMuted, cursor:"pointer", fontSize:"1.2rem" }}>✕</button>
        <h2 style={{ fontFamily:"'Instrument Serif', Georgia, serif", fontSize:"1.5rem", fontWeight:400, marginBottom:8 }}>Edit Member</h2>
        <p style={{ color:T.textMuted, fontSize:"0.86rem", marginBottom:24 }}>{member.user?.name || 'Unknown'} — {member.user?.email}</p>
        {error && <div style={{ background:`${T.red}15`, border:`1px solid ${T.red}30`, color:T.red, padding:"10px 14px", borderRadius:10, fontSize:"0.84rem", marginBottom:16 }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom:20 }}>
            <label style={labelStyle}>Role</label>
            <select style={{ ...inputStyle, cursor:"pointer" }} value={role} onChange={e => setRole(e.target.value)}>
              <option value="employee">Employee</option>
              <option value="vendor_admin">Vendor Admin</option>
            </select>
          </div>
          <div style={{ marginBottom:24 }}>
            <label style={labelStyle}>Status</label>
            <select style={{ ...inputStyle, cursor:"pointer" }} value={isActive ? 'active' : 'inactive'} onChange={e => setIsActive(e.target.value === 'active')}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <button type="submit" disabled={saving} style={{ width:"100%", padding:"14px", background: saving ? T.textDim : T.gradient, color:"#fff", fontWeight:700, fontSize:"0.9rem", border:"none", borderRadius:12, cursor: saving ? "not-allowed" : "pointer", fontFamily:"inherit", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving..." : "Update Member"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── REDEEM MODAL ──────────────────────────────────────────────────
function RedeemModal({ reward, balance, onClose, onRedeem, T }) {
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
export default function Tokenly({ vendorSlug }) {
  const [user, setUser] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isVendorAdminUser, setIsVendorAdminUser] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [allUsers, setAllUsers] = useState([...DEMO_USERS]);
  const [page, setPage] = useState("feed");
  const [vendorBranding, setVendorBranding] = useState(null);
  const [recognitions, setRecognitions] = useState(INITIAL_RECOGNITIONS);
  const [showGiveModal, setShowGiveModal] = useState(false);
  const [redeemReward, setRedeemReward] = useState(null);
  const [balance, setBalance] = useState(720);
  const [allowanceLeft, setAllowanceLeft] = useState(MONTHLY_ALLOWANCE);
  const [toastMsg, setToastMsg] = useState("");
  const [rewardFilter, setRewardFilter] = useState("All");
  const [theme, setTheme] = useState('dark');
  const T = THEMES[theme];

  useEffect(() => {
    const saved = localStorage.getItem('tokenly-theme');
    if (saved && saved !== theme) setTheme(saved);
  }, []);

  // Fetch vendor branding if on a vendor-specific login page
  useEffect(() => {
    if (!vendorSlug) return;
    let cancelled = false;
    const controller = new AbortController();

    fetch(`/api/vendor/public/${vendorSlug}`, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        if (!cancelled && data.vendor) setVendorBranding(data.vendor);
      })
      .catch(() => {});

    return () => { cancelled = true; controller.abort(); };
  }, [vendorSlug]);

  useEffect(() => {
    const saved = sessionStorage.getItem('tokenly-user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        setIsSuperAdmin(parsed.is_super_admin === true);
        setIsVendorAdminUser((parsed.vendors || []).some(v => v.role === 'vendor_admin'));
      } catch {}
    }
    setSessionReady(true);
  }, []);

  const loginUser = (u) => {
    setUser(u);
    setIsSuperAdmin(u.is_super_admin === true);
    setIsVendorAdminUser((u.vendors || []).some(v => v.role === 'vendor_admin'));
    if (u.is_super_admin) setPage('vendors');
    sessionStorage.setItem('tokenly-user', JSON.stringify(u));
    if (u.token) sessionStorage.setItem('tokenly-token', u.token);
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('tokenly-theme', next);
  };

  useEffect(() => {
    document.body.style.background = T.bg;
    document.body.style.color = T.text;
  }, [T.bg, T.text]);

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

  if (!sessionReady) return null;
  if (!user) return <AuthScreen onAuth={loginUser} allUsers={allUsers} setAllUsers={setAllUsers} T={T} theme={theme} setTheme={toggleTheme} vendorBranding={vendorBranding} />;

  const rewardCategories = ["All", ...new Set(REWARDS_CATALOG.map(r => r.category))];
  const filteredRewards = rewardFilter === "All" ? REWARDS_CATALOG : REWARDS_CATALOG.filter(r => r.category === rewardFilter);
  const myReceived = recognitions.filter(r => r.to === user.id).reduce((sum, r) => sum + r.amount, 0);
  const myGiven = recognitions.filter(r => r.from === user.id).reduce((sum, r) => sum + r.amount, 0);

  const navItems = [
    ...(isSuperAdmin ? [{ id:"vendors", icon:"🏢", label:"Vendors" }] : []),
    ...(isVendorAdminUser && !isSuperAdmin ? [{ id:"members", icon:"👥", label:"Members" }] : []),
    { id:"feed", icon:"📣", label:"Recognition Feed" },
    { id:"give", icon:"🎁", label:"Give Kudos" },
    { id:"rewards", icon:"🏪", label:"Rewards Catalog" },
    { id:"leaderboard", icon:"🏆", label:"Leaderboard" },
    { id:"profile", icon:"👤", label:"My Profile" },
  ];

  const statCard = { background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:14, padding:20, textAlign:"center", flex:1 };

  const themeToggleBtn = (
    <button onClick={toggleTheme} style={{ width:40, height:40, borderRadius:12, border:`1px solid ${T.border}`, background:T.bgCard, color:T.text, cursor:"pointer", fontSize:"1.1rem", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s", flexShrink:0 }} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>{theme === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19'}</button>
  );

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.text, fontFamily:"'DM Sans', -apple-system, sans-serif", overflowX:"hidden" }}>
      {toastMsg && (
        <div style={{ position:"fixed", top:20, right:20, background:T.bgCard, border:`1px solid ${T.teal}40`, borderRadius:12, padding:"14px 20px", zIndex:2000, fontSize:"0.88rem", color:T.teal, boxShadow:"0 8px 32px rgba(0,0,0,0.4)", animation:"slideIn 0.3s ease" }}>{toastMsg}</div>
      )}

      <div style={{ display:"flex", minHeight:"100vh" }}>
        {/* SIDEBAR */}
        <aside className="sidebar-desktop" style={{ width:240, background:T.bgCard, borderRight:`1px solid ${T.border}`, padding:"24px 0", display:"flex", flexDirection:"column", position:"fixed", top:0, left:0, bottom:0, zIndex:50 }}>
          <div style={{ padding:"0 24px 28px" }}>
            {(() => {
              const userVendor = (user.vendors || []).find(v => v.vendor_logo);
              const vendorLogo = userVendor?.vendor_logo;
              const vendorName = userVendor?.vendor_name;
              if (vendorLogo) {
                return (
                  <>
                    <div style={{ width:48, height:48, borderRadius:12, background:"#0B0E11", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", border:`1px solid ${T.border}` }}>
                      <img src={vendorLogo} alt={vendorName || 'Vendor'} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    </div>
                    {vendorName && <div style={{ fontSize:"0.82rem", fontWeight:600, marginTop:8 }}>{vendorName}</div>}
                    <div style={{ fontSize:"0.7rem", color:T.textDim, marginTop:2, letterSpacing:"1px", textTransform:"uppercase" }}>Powered by Solana</div>
                  </>
                );
              }
              return (
                <>
                  <span style={{ fontFamily:"'Instrument Serif', Georgia, serif", fontSize:"1.4rem", background:T.gradient, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>◎ Tokenly</span>
                  <div style={{ fontSize:"0.7rem", color:T.textDim, marginTop:2, letterSpacing:"1px", textTransform:"uppercase" }}>Powered by Solana</div>
                </>
              );
            })()}
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
            <button onClick={() => { setUser(null); setIsSuperAdmin(false); setPage('feed'); sessionStorage.removeItem('tokenly-user'); sessionStorage.removeItem('tokenly-token'); }} style={{ width:"100%", marginTop:10, padding:8, background:"transparent", border:`1px solid ${T.border}`, borderRadius:8, color:T.textMuted, cursor:"pointer", fontSize:"0.78rem", fontFamily:"inherit" }}>Sign Out</button>
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

          {/* VENDORS (Super Admin) */}
          {page === "vendors" && isSuperAdmin && <VendorManagement T={T} />}

          {/* MEMBERS (Vendor Admin) */}
          {page === "members" && isVendorAdminUser && <MemberManagement user={user} T={T} />}

          {/* FEED */}
          {page === "feed" && (
            <div style={{ animation:"fadeUp 0.4s ease" }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16 }}>
                <div>
                  <h1 style={{ fontFamily:"'Instrument Serif', Georgia, serif", fontSize:"1.8rem", fontWeight:400, letterSpacing:"-0.5px" }}>Recognition Feed</h1>
                  <p style={{ color:T.textMuted, fontSize:"0.86rem", marginTop:4 }}>See how your team lifts each other up</p>
                </div>
                {themeToggleBtn}
              </div>
              <div className="feed-header" style={{ display:"flex", justifyContent:"flex-end", marginBottom:24 }}>
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
              {recognitions.map(r => <RecognitionCard key={r.id} recog={r} currentUser={user} allUsers={allUsers} onReact={handleReact} T={T} />)}
            </div>
          )}

          {/* REWARDS */}
          {page === "rewards" && (
            <div style={{ animation:"fadeUp 0.4s ease" }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24 }}>
                <div>
                  <h1 style={{ fontFamily:"'Instrument Serif', Georgia, serif", fontSize:"1.8rem", fontWeight:400, marginBottom:4 }}>Rewards Catalog</h1>
                  <p style={{ color:T.textMuted, fontSize:"0.86rem" }}>Redeem your KUDOS tokens for awesome rewards</p>
                </div>
                {themeToggleBtn}
              </div>
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
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24 }}>
                <div>
                  <h1 style={{ fontFamily:"'Instrument Serif', Georgia, serif", fontSize:"1.8rem", fontWeight:400, marginBottom:4 }}>Leaderboard</h1>
                  <p style={{ color:T.textMuted, fontSize:"0.86rem" }}>Top recognized teammates this month</p>
                </div>
                {themeToggleBtn}
              </div>
              <div className="leaderboard-podium" style={{ display:"flex", gap:16, marginBottom:32, justifyContent:"center", alignItems:"flex-end" }}>
                {[1, 0, 2].map((idx, pos) => {
                  const u = leaderboard[idx]; if (!u) return null;
                  const heights = [200, 160, 140]; const medals = ["🥇", "🥈", "🥉"];
                  return (
                    <div key={u.id} style={{ display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", width:160, minWidth:0 }}>
                      <Avatar userId={u.id} size={idx === 0 ? 56 : 48} name={u.name} />
                      <div style={{ fontWeight:600, fontSize:"0.9rem", marginTop:8 }}>{u.name}</div>
                      <div style={{ fontSize:"0.76rem", color:T.textMuted }}>{u.role}</div>
                      <div style={{ background: idx === 0 ? `linear-gradient(180deg, ${T.accent}30, ${T.accent}08)` : T.bgCard, border:`1px solid ${T.border}`, borderRadius:"12px 12px 0 0", marginTop:12, height:heights[idx], display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4, alignSelf:"stretch" }}>
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
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24 }}>
                <h1 style={{ fontFamily:"'Instrument Serif', Georgia, serif", fontSize:"1.8rem", fontWeight:400 }}>My Profile</h1>
                {themeToggleBtn}
              </div>
              <div className="profile-header" style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:16, padding:24, display:"flex", gap:24, alignItems:"center", marginBottom:16, flexWrap:"wrap" }}>
                <Avatar userId={user.id} size={72} name={user.name} />
                <div style={{ flex:1, minWidth:0 }}>
                  <h2 style={{ fontSize:"1.3rem", fontWeight:600 }}>{user.name}</h2>
                  <div style={{ fontSize:"0.88rem", color:T.textMuted }}>{user.role} · {user.dept || "General"}</div>
                  <div style={{ fontSize:"0.78rem", color:T.textDim, marginTop:4 }}>{user.email}</div>
                  <div style={{ fontSize:"0.78rem", color:T.textDim, fontFamily:"monospace", marginTop:4, wordBreak:"break-all" }}>Wallet: {user.walletAddress || "Not connected"}</div>
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
                      <TokenBadge amount={r.amount} T={T} />
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
              <button className="mobile-sign-out" onClick={() => { setUser(null); setIsSuperAdmin(false); setPage('feed'); sessionStorage.removeItem('tokenly-user'); sessionStorage.removeItem('tokenly-token'); }} style={{ display:"none", width:"100%", marginTop:28, marginBottom:60, padding:"14px 0", background:"transparent", border:`1px solid ${T.border}`, borderRadius:12, color:T.textMuted, cursor:"pointer", fontSize:"0.88rem", fontFamily:"inherit" }}>Sign Out</button>
            </div>
          )}
        </main>
      </div>

      {showGiveModal && <GiveRecognitionModal currentUser={user} allUsers={allUsers} onClose={() => setShowGiveModal(false)} onSend={handleSendRecognition} T={T} />}
      {redeemReward && <RedeemModal reward={redeemReward} balance={balance} onClose={() => setRedeemReward(null)} onRedeem={handleRedeem} T={T} />}
    </div>
  );
}
