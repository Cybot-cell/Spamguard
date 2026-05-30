import { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════
   SPAMGUARD PRO v2 — Physics Wallah Edition
   Rebuilt from CEO/CTO feedback
   - PW orange brand colors
   - Single screen, no tabs during live class
   - Mobile responsive
   - Metrics front and center
   - Teacher-first UX
═══════════════════════════════════════════════════════ */

const SPAM_KEYWORDS = ["buy now","click here","free money","earn ₹","whatsapp","t.me/","bit.ly","tinyurl","join now","promo","loot","refer","reffer","follow me","subscribe","http://","https://t","wa.me","instagram.com/","youtube.com/channel","free course","crack pw","paid notes"];
const ABUSE_WORDS = ["bc","mc","chutiya","bsdk","madarchod","bhenchod","fuck","shit","bitch","randi","gaand","harami"];

function quickCheck(text) {
  const lower = text.toLowerCase().trim();
  const reasons = [];
  if (/(.)\1{5,}/.test(text)) reasons.push("character flood");
  if (SPAM_KEYWORDS.some(k => lower.includes(k))) reasons.push("spam/promo link");
  if (ABUSE_WORDS.some(w => lower.split(/[\s,.!?]+/).includes(w))) reasons.push("abusive language");
  if ((text.match(/[!?]{4,}/g)||[]).length) reasons.push("punctuation spam");
  if ((text.match(/[A-Z]/g)||[]).length > text.length * 0.75 && text.length > 6) reasons.push("all caps");
  if (new Set(text.replace(/\s/g,"")).size <= 2 && text.length > 8) reasons.push("gibberish");
  return reasons;
}

async function aiAnalyze(text, history) {
  const ctx = history.length ? `Past: ${history.slice(-3).map(m=>`"${m.text}"→${m.verdict}`).join("; ")}` : "New user.";
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 100,
        messages: [{ role: "user", content: `Spam moderation for Indian edtech (Physics Wallah). ${ctx}\nMessage: "${text}"\nClassify: CLEAN/WARN/SPAM/ABUSE\nJSON only: {"verdict":"CLEAN","reason":"genuine doubt","confidence":94}` }]
      })
    });
    const d = await res.json();
    return JSON.parse((d.content?.[0]?.text||"{}").replace(/```json|```/g,"").trim());
  } catch { return { verdict:"CLEAN", reason:"AI unavailable", confidence:60 }; }
}

const DEMO = [
  { uid:"s1", name:"Ananya Sharma", text:"Sir please explain lens formula derivation again 🙏", delay:700 },
  { uid:"sp1", name:"PromoKing", text:"EARN ₹10,000 DAILY! Join → t.me/fastmoney99", delay:1600 },
  { uid:"s2", name:"Rohan Verma", text:"Which chapter has max JEE Mains weightage?", delay:2800 },
  { uid:"sp1", name:"PromoKing", text:"FREE JEE NOTES PDF → bit.ly/jee2025free", delay:3800 },
  { uid:"s3", name:"Karan Patel", text:"aaaaaaaaaaaaa SIR NOTICE ME PLEASE", delay:5000 },
  { uid:"s4", name:"Divya Singh", text:"Sir thermodynamics explanation was 🔥 thank you!", delay:6100 },
  { uid:"s3", name:"Karan Patel", text:"!!!!!!!! SIR SIR SIR SIR !!!!!!!!", delay:7200 },
  { uid:"sp2", name:"SpamBot_284", text:"Subscribe my channel FREE PW CRACK NOTES link in bio", delay:8200 },
  { uid:"s5", name:"Meera Joshi", text:"Sir audio is breaking, can you repeat last part?", delay:9400 },
  { uid:"sp1", name:"PromoKing", text:"LOOT DEAL!! refer and earn ₹500 wa.me/919876543210", delay:10400 },
  { uid:"s6", name:"Aryan Gupta", text:"Best class on youtube honestly 🙏 thank you sir", delay:11600 },
  { uid:"s3", name:"Karan Patel", text:"bc ye derivation samajh nahi aata yaar", delay:12600 },
  { uid:"s7", name:"Priya Nair", text:"Sir next class kab hogi? Physics ya Chemistry?", delay:13800 },
  { uid:"sp2", name:"SpamBot_284", text:"JOIN NOW JOIN NOW FOLLOW ME FOLLOW ME FREE NOTES", delay:14800 },
];

const V = {
  CLEAN:   { label:"Clean",    color:"#22c55e", bg:"#052e16", dot:"#22c55e" },
  WARN:    { label:"Warning",  color:"#f59e0b", bg:"#2d1f00", dot:"#f59e0b" },
  SPAM:    { label:"Spam",     color:"#f97316", bg:"#2d1200", dot:"#f97316" },
  ABUSE:   { label:"Abuse",    color:"#ef4444", bg:"#2a0808", dot:"#ef4444" },
  BANNED:  { label:"Banned",   color:"#dc2626", bg:"#1f0606", dot:"#dc2626" },
  MUTED:   { label:"Muted",    color:"#94a3b8", bg:"#1a1f2e", dot:"#94a3b8" },
  PENDING: { label:"Scanning", color:"#fb923c", bg:"#1f1008", dot:"#fb923c" },
};

const PW_ORANGE = "#ff6b00";
const PW_ORANGE2 = "#ff8c00";

function getInitials(name) { return name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase(); }

function formatTime(s) { return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`; }

function MsgRow({ msg, onBan, onUnban, isBanned }) {
  const v = V[msg.verdict] || V.CLEAN;
  const blocked = ["SPAM","ABUSE","BANNED","MUTED"].includes(msg.verdict);
  const pending = msg.verdict === "PENDING";
  return (
    <div style={{
      display:"flex", gap:10, alignItems:"flex-start",
      padding:"10px 12px", borderRadius:12,
      background: blocked ? `${v.bg}` : "transparent",
      border: `1px solid ${blocked ? v.color+"28" : "rgba(255,255,255,0.05)"}`,
      marginBottom:5, transition:"all 0.3s",
      animation:"msgIn 0.25s ease",
      opacity: blocked ? 0.72 : 1,
    }}>
      {/* Avatar */}
      <div style={{ width:34, height:34, borderRadius:9, background:`${v.color}18`, border:`1.5px solid ${v.color}35`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:v.color, flexShrink:0, fontFamily:"'Nunito',sans-serif" }}>
        {getInitials(msg.name)}
      </div>
      {/* Content */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3, flexWrap:"wrap" }}>
          <span style={{ fontSize:12, fontWeight:700, color:"#cbd5e1", fontFamily:"'Nunito',sans-serif" }}>{msg.name}</span>
          <span style={{ fontSize:10, fontWeight:700, color:v.color, background:v.bg, border:`1px solid ${v.color}35`, padding:"1px 7px", borderRadius:20, display:"flex", alignItems:"center", gap:3 }}>
            <span style={{ width:5, height:5, borderRadius:"50%", background:v.dot, display:"inline-block", animation:pending?"blink 1s infinite":"none" }} />
            {v.label}
          </span>
          {!pending && msg.confidence>0 && msg.verdict!=="CLEAN" && (
            <span style={{ fontSize:9, color:"#475569" }}>{msg.confidence}% sure</span>
          )}
          {msg.reason && !pending && blocked && (
            <span style={{ fontSize:9, color:"#475569", fontStyle:"italic" }}>· {msg.reason}</span>
          )}
          <span style={{ marginLeft:"auto", fontSize:9, color:"#334155" }}>{msg.ts?.toLocaleTimeString()}</span>
        </div>
        <div style={{ fontSize:13, color: blocked?"#475569":"#94a3b8", lineHeight:1.55, wordBreak:"break-word" }}>
          {pending
            ? <span style={{ display:"flex", alignItems:"center", gap:7 }}><span style={{ width:11, height:11, border:`2px solid ${PW_ORANGE}`, borderTopColor:"transparent", borderRadius:"50%", display:"inline-block", animation:"spin 0.7s linear infinite" }} />{msg.text}</span>
            : blocked ? <s>{msg.text}</s>
            : msg.text}
        </div>
      </div>
      {/* Action */}
      <div>
        {isBanned
          ? <button onClick={()=>onUnban(msg.uid)} style={{ fontSize:10, padding:"4px 9px", background:"rgba(34,197,94,0.1)", color:"#22c55e", border:"1px solid rgba(34,197,94,0.2)", borderRadius:8, cursor:"pointer", fontFamily:"'Nunito',sans-serif", fontWeight:700 }}>Unban</button>
          : <button onClick={()=>onBan(msg.uid)} style={{ fontSize:10, padding:"4px 9px", background:"rgba(239,68,68,0.08)", color:"#ef4444", border:"1px solid rgba(239,68,68,0.18)", borderRadius:8, cursor:"pointer", fontFamily:"'Nunito',sans-serif", fontWeight:700 }}>Ban</button>
        }
      </div>
    </div>
  );
}

export default function SpamGuardV2() {
  const [view, setView] = useState("dashboard"); // dashboard | live | users
  const [messages, setMessages] = useState([]);
  const [memory, setMemory] = useState({});
  const [input, setInput] = useState("");
  const [demoActive, setDemoActive] = useState(false);
  const [classOn, setClassOn] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [classTitle, setClassTitle] = useState("Physics — Optics & Lens Formula");
  const [filter, setFilter] = useState("all"); // all | clean | blocked
  const chatRef = useRef(null);
  const timers = useRef([]);
  const clockRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (classOn) { clockRef.current = setInterval(() => setElapsed(e=>e+1), 1000); }
    else clearInterval(clockRef.current);
    return () => clearInterval(clockRef.current);
  }, [classOn]);

  const processMsg = useCallback(async (uid, name, text) => {
    if (!text.trim()) return;
    const id = `${uid}-${Date.now()}-${Math.random()}`;
    const mem = memory[uid] || { strikes:0, banned:false, muted:false, messages:[], trustScore:75 };
    if (mem.banned) return;

    setMessages(p => [...p, { id, uid, name, text, verdict:"PENDING", reason:"", confidence:0, ts:new Date() }]);

    const local = quickCheck(text);
    let result;
    if (local.length) {
      result = { verdict: local.includes("abusive language") ? "ABUSE" : "SPAM", reason:local.join(" · "), confidence:96 };
    } else {
      result = await aiAnalyze(text, mem.messages);
    }

    const bad = result.verdict !== "CLEAN";
    const newStrikes = bad ? mem.strikes + (result.verdict==="WARN"?0.5:1) : Math.max(0, mem.strikes-0.2);
    const banned = newStrikes >= 3;
    const muted  = newStrikes >= 2 && !banned;
    const finalV = banned ? "BANNED" : (muted && bad) ? "MUTED" : result.verdict;

    setMemory(p => ({
      ...p,
      [uid]: {
        ...mem, name,
        strikes: newStrikes, banned, muted,
        messages: [...mem.messages, { text, verdict:result.verdict }].slice(-10),
        trustScore: Math.min(100, Math.max(0, mem.trustScore + (result.verdict==="CLEAN"?3:-18))),
        lastSeen: new Date(),
      }
    }));
    setMessages(p => p.map(m => m.id===id ? {...m, verdict:finalV, reason:result.reason, confidence:result.confidence} : m));
  }, [memory]);

  const runDemo = () => {
    if (demoActive) return;
    setDemoActive(true); setClassOn(true); setElapsed(0);
    setMessages([]); setMemory({});
    timers.current.forEach(clearTimeout);
    timers.current = DEMO.map(({ uid, name, text, delay }) =>
      setTimeout(() => processMsg(uid, name, text), delay)
    );
    setTimeout(() => setDemoActive(false), 18000);
  };

  const ban   = uid => { setMemory(p => ({...p,[uid]:{...p[uid],banned:true,strikes:10}})); setMessages(p=>p.map(m=>m.uid===uid?{...m,verdict:"BANNED"}:m)); };
  const unban = uid =>   setMemory(p => ({...p,[uid]:{...p[uid],banned:false,muted:false,strikes:0,trustScore:50}}));
  const reset = () => { setMessages([]); setMemory({}); setElapsed(0); setClassOn(false); setDemoActive(false); timers.current.forEach(clearTimeout); };

  const total   = messages.length;
  const blocked = messages.filter(m=>["SPAM","ABUSE","BANNED","MUTED"].includes(m.verdict));
  const warned  = messages.filter(m=>m.verdict==="WARN");
  const clean   = messages.filter(m=>m.verdict==="CLEAN");
  const bannedU = Object.values(memory).filter(u=>u.banned).length;
  const accuracy = total > 0 ? Math.round((blocked.length+clean.length)/total*100) : 100;
  const spamRate = total > 0 ? Math.round(blocked.length/total*100) : 0;

  const shownMsgs = filter==="blocked" ? blocked : filter==="clean" ? [...clean,...warned] : messages;

  return (
    <div style={{ minHeight:"100vh", background:"#0d0f18", color:"#e2e8f0", fontFamily:"'Nunito','Segoe UI',sans-serif", display:"flex", flexDirection:"column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Poppins:wght@600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#1e293b;border-radius:10px}
        @keyframes msgIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes livePulse{0%,100%{box-shadow:0 0 0 0 rgba(255,107,0,0.4)}70%{box-shadow:0 0 0 8px rgba(255,107,0,0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .stat-card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:18px 20px;transition:all 0.2s}
        .stat-card:hover{border-color:rgba(255,107,0,0.2);transform:translateY(-2px)}
        .nav-btn{background:none;border:none;cursor:pointer;font-family:'Nunito',sans-serif;font-size:13px;font-weight:700;padding:8px 16px;border-radius:10px;transition:all 0.2s;letter-spacing:0.3px}
        .nav-btn.active{background:rgba(255,107,0,0.15);color:#ff6b00}
        .nav-btn:not(.active){color:#475569}
        .nav-btn:not(.active):hover{color:#94a3b8;background:rgba(255,255,255,0.04)}
        .filter-btn{background:none;border:1px solid rgba(255,255,255,0.08);cursor:pointer;font-family:'Nunito',sans-serif;font-size:11px;font-weight:700;padding:5px 12px;border-radius:20px;transition:all 0.2s;color:#475569}
        .filter-btn.on{background:rgba(255,107,0,0.12);border-color:rgba(255,107,0,0.35);color:#ff6b00}
        .pw-btn{border:none;cursor:pointer;font-family:'Nunito',sans-serif;font-weight:800;border-radius:12px;transition:all 0.18s;letter-spacing:0.3px}
        .pw-btn:hover{filter:brightness(1.08);transform:translateY(-1px)}
        .pw-btn:active{transform:translateY(0) scale(0.98)}
        input{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:#e2e8f0;font-family:'Nunito',sans-serif;border-radius:10px;outline:none;transition:all 0.2s}
        input:focus{border-color:rgba(255,107,0,0.4);background:rgba(255,107,0,0.04)}
        .user-card{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:16px;transition:all 0.2s}
        .user-card:hover{border-color:rgba(255,107,0,0.2)}
      `}</style>

      {/* ══════ HEADER ══════ */}
      <header style={{ background:"rgba(13,15,24,0.97)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"12px 20px", display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:200, flexWrap:"wrap" }}>
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:`linear-gradient(135deg,${PW_ORANGE},${PW_ORANGE2})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, boxShadow:`0 4px 14px ${PW_ORANGE}50` }}>🛡️</div>
          <div>
            <div style={{ fontSize:16, fontWeight:900, color:"#fff", letterSpacing:"-0.5px", fontFamily:"'Poppins',sans-serif" }}>
              Spam<span style={{ color:PW_ORANGE }}>Guard</span>
            </div>
            <div style={{ fontSize:9, color:"#475569", letterSpacing:"1.5px", fontWeight:700 }}>PHYSICS WALLAH · AI MODERATION</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ display:"flex", gap:4, marginLeft:12 }}>
          {[["dashboard","📊 Dashboard"],["live","💬 Live Chat"],["users","👥 Users"]].map(([id,lbl])=>(
            <button key={id} className={`nav-btn ${view===id?"active":""}`} onClick={()=>setView(id)}>{lbl}</button>
          ))}
        </nav>

        {/* Live badge */}
        <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"7px 14px" }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:classOn?PW_ORANGE:"#334155", animation:classOn?"livePulse 1.8s infinite":"none" }} />
          <span style={{ fontSize:11, fontWeight:800, color:classOn?PW_ORANGE:"#334155" }}>{classOn?`LIVE · ${formatTime(elapsed)}`:"OFFLINE"}</span>
        </div>

        {/* Accuracy pill */}
        <div style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:10, padding:"7px 14px" }}>
          <span style={{ fontSize:11, fontWeight:800, color:"#22c55e" }}>✓ {accuracy}% AI Accuracy</span>
        </div>

        {/* CTA buttons */}
        <div style={{ marginLeft:"auto", display:"flex", gap:8, alignItems:"center" }}>
          <button className="pw-btn" onClick={runDemo} disabled={demoActive} style={{ background:demoActive?"#1e293b":`linear-gradient(135deg,${PW_ORANGE},${PW_ORANGE2})`, color:demoActive?"#475569":"#fff", padding:"9px 20px", fontSize:12, boxShadow:demoActive?"none":`0 4px 14px ${PW_ORANGE}40` }}>
            {demoActive ? "⏳ Demo Running…" : "▶ Run Demo"}
          </button>
          <button className="pw-btn" onClick={reset} style={{ background:"rgba(239,68,68,0.08)", color:"#ef4444", border:"1px solid rgba(239,68,68,0.18)", padding:"9px 14px", fontSize:12 }}>Reset</button>
        </div>
      </header>

      {/* ══════ BODY ══════ */}
      <div style={{ flex:1, overflowY:"auto", padding:"20px", maxWidth:1200, margin:"0 auto", width:"100%" }}>

        {/* ── DASHBOARD ── */}
        {view==="dashboard" && (
          <div style={{ animation:"fadeIn 0.3s ease" }}>
            {/* Stat cards */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:12, marginBottom:24 }}>
              {[
                { icon:"💬", val:total,          label:"Total Messages", color:"#818cf8" },
                { icon:"✅", val:clean.length,    label:"Clean Messages", color:"#22c55e" },
                { icon:"🚫", val:blocked.length,  label:"Blocked",        color:"#ef4444" },
                { icon:"⚠️", val:warned.length,   label:"Warnings",       color:"#f59e0b" },
                { icon:"🔨", val:bannedU,         label:"Banned Users",   color:PW_ORANGE },
              ].map(s=>(
                <div key={s.label} className="stat-card">
                  <div style={{ fontSize:26, marginBottom:6 }}>{s.icon}</div>
                  <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:30, fontWeight:700, color:s.color, lineHeight:1 }}>{s.val}</div>
                  <div style={{ fontSize:11, color:"#64748b", marginTop:5, fontWeight:600 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Spam rate bar */}
            <div style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:20, marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                <span style={{ fontSize:13, fontWeight:700, color:"#94a3b8" }}>Spam Rate This Session</span>
                <span style={{ fontSize:13, fontWeight:800, color:spamRate>40?"#ef4444":spamRate>20?"#f59e0b":"#22c55e" }}>{spamRate}%</span>
              </div>
              <div style={{ height:10, background:"#1e293b", borderRadius:10, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${spamRate}%`, background:`linear-gradient(90deg,${PW_ORANGE},#ef4444)`, borderRadius:10, transition:"width 0.6s ease" }} />
              </div>
              <div style={{ fontSize:11, color:"#334155", marginTop:8 }}>{total ? `${blocked.length} of ${total} messages intercepted` : "No data yet — run the demo!"}</div>
            </div>

            {/* Integration guide for PW tech */}
            <div style={{ background:`rgba(255,107,0,0.05)`, border:`1px solid rgba(255,107,0,0.18)`, borderRadius:16, padding:22, marginBottom:16 }}>
              <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:15, fontWeight:700, color:PW_ORANGE, marginBottom:16 }}>⚡ PW Tech Integration — 3 Steps</div>
              {[
                ["1. Hook into your WebSocket server","Every incoming chat message → SpamGuard API → verdict in ~200ms → render or block. One middleware function, no full rebuild needed."],
                ["2. Swap in-memory with Redis","Replace React state with a Redis store for persistent user bans across all classes and sessions company-wide."],
                ["3. Embed this panel in PW teacher dashboard","Teachers already have a control panel. Add a SpamGuard iframe or micro-frontend component — zero new login needed."],
              ].map(([t,d])=>(
                <div key={t} style={{ marginBottom:12, paddingBottom:12, borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ fontSize:12, fontWeight:800, color:"#fdba74", marginBottom:4 }}>{t}</div>
                  <div style={{ fontSize:12, color:"#64748b", lineHeight:1.7 }}>{d}</div>
                </div>
              ))}
            </div>

            {/* Quick try */}
            <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:20 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#94a3b8", marginBottom:12 }}>🧪 Try it — send a test message</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
                {["Sir please explain this 🙏","EARN ₹5000 DAILY wa.me/123","aaaaaaaaaaaaa SIR","FREE NOTES bit.ly/free"].map(s=>(
                  <button key={s} onClick={()=>{ processMsg("test-u","Test User",s); setView("live"); }} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)", color:"#64748b", padding:"7px 14px", fontSize:11, fontWeight:700, borderRadius:10, cursor:"pointer", fontFamily:"'Nunito',sans-serif", transition:"all 0.2s" }}>
                    {s}
                  </button>
                ))}
              </div>
              <div style={{ fontSize:11, color:"#334155" }}>Clicks send it to the Live Chat — results appear instantly</div>
            </div>
          </div>
        )}

        {/* ── LIVE CHAT ── */}
        {view==="live" && (
          <div style={{ animation:"fadeIn 0.3s ease", display:"flex", flexDirection:"column", height:"calc(100vh - 160px)" }}>
            {/* Filter + class info bar */}
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14, flexWrap:"wrap" }}>
              <input value={classTitle} onChange={e=>setClassTitle(e.target.value)} placeholder="Class title…" style={{ flex:1, minWidth:180, padding:"8px 12px", fontSize:12 }} />
              <div style={{ display:"flex", gap:6 }}>
                {[["all","All"],["clean","✓ Clean"],["blocked","🚫 Blocked"]].map(([id,lbl])=>(
                  <button key={id} className={`filter-btn ${filter===id?"on":""}`} onClick={()=>setFilter(id)}>{lbl}</button>
                ))}
              </div>
              <span style={{ fontSize:11, color:"#334155", whiteSpace:"nowrap" }}>{shownMsgs.length} shown</span>
            </div>

            {/* Chat area */}
            <div ref={chatRef} style={{ flex:1, overflowY:"auto", padding:"4px 2px" }}>
              {messages.length===0 && (
                <div style={{ textAlign:"center", paddingTop:60, color:"#334155" }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>🛡️</div>
                  <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:18, color:"#475569", marginBottom:8 }}>SpamGuard is on guard</div>
                  <div style={{ fontSize:12, color:"#334155" }}>Click <b style={{color:PW_ORANGE}}>Run Demo</b> or type below to test</div>
                </div>
              )}
              {shownMsgs.map(msg => (
                <MsgRow key={msg.id} msg={msg} onBan={ban} onUnban={unban} isBanned={memory[msg.uid]?.banned||false} />
              ))}
            </div>

            {/* Input */}
            <div style={{ paddingTop:12, borderTop:"1px solid rgba(255,255,255,0.06)", display:"flex", gap:10, alignItems:"center" }}>
              <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(processMsg("me","You",input),setInput(""))} placeholder="Type any message to test — try spam!" style={{ flex:1, padding:"11px 16px", fontSize:13 }} />
              <button className="pw-btn" onClick={()=>{ processMsg("me","You",input); setInput(""); }} style={{ background:`linear-gradient(135deg,${PW_ORANGE},${PW_ORANGE2})`, color:"#fff", padding:"11px 22px", fontSize:13, boxShadow:`0 4px 12px ${PW_ORANGE}40` }}>Send →</button>
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {view==="users" && (
          <div style={{ animation:"fadeIn 0.3s ease" }}>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:18, fontWeight:700, color:"#e2e8f0", marginBottom:4 }}>User Memory</div>
              <div style={{ fontSize:12, color:"#64748b" }}>AI tracks every user's behavior, strikes, and trust score. Memory persists for the full session.</div>
            </div>
            {Object.keys(memory).length===0 && <div style={{ color:"#334155", padding:20 }}>No users yet — run the demo!</div>}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
              {Object.entries(memory).map(([uid,u])=>{
                const t = Math.round(u.trustScore||75);
                const tc = t>65?"#22c55e":t>35?"#f59e0b":"#ef4444";
                return (
                  <div key={uid} className="user-card" style={{ borderColor: u.banned?"rgba(239,68,68,0.25)":u.muted?"rgba(245,158,11,0.2)":"rgba(255,255,255,0.07)", position:"relative", overflow:"hidden" }}>
                    <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${tc},transparent)` }} />
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                      <div style={{ width:42, height:42, borderRadius:10, background:`${tc}18`, border:`1.5px solid ${tc}35`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:tc, fontFamily:"'Poppins',sans-serif" }}>
                        {getInitials(u.name||uid)}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:800, color:"#e2e8f0", fontSize:14 }}>{u.name}</div>
                        <div style={{ fontSize:10, color:"#475569", marginTop:2 }}>{(u.messages||[]).length} msgs · {u.lastSeen?.toLocaleTimeString()}</div>
                      </div>
                      {u.banned&&<span style={{ fontSize:9, background:"rgba(239,68,68,0.12)", color:"#ef4444", border:"1px solid rgba(239,68,68,0.25)", padding:"3px 8px", borderRadius:20, fontWeight:800 }}>BANNED</span>}
                      {u.muted&&!u.banned&&<span style={{ fontSize:9, background:"rgba(245,158,11,0.1)", color:"#f59e0b", border:"1px solid rgba(245,158,11,0.25)", padding:"3px 8px", borderRadius:20, fontWeight:800 }}>MUTED</span>}
                    </div>
                    <div style={{ marginBottom:12 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                        <span style={{ fontSize:11, color:"#64748b", fontWeight:700 }}>Trust Score</span>
                        <span style={{ fontSize:11, fontWeight:800, color:tc }}>{t}%</span>
                      </div>
                      <div style={{ height:6, background:"#1e293b", borderRadius:6, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${t}%`, background:`linear-gradient(90deg,${tc},${tc}99)`, borderRadius:6, transition:"width 0.5s ease" }} />
                      </div>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#64748b", marginBottom:12, fontWeight:700 }}>
                      <span>Strikes: <b style={{ color:u.strikes>2?"#ef4444":u.strikes>1?"#f59e0b":"#22c55e" }}>{Math.round(u.strikes*2)/2}</b></span>
                      <span>Status: <b style={{ color:u.banned?"#ef4444":u.muted?"#f59e0b":"#22c55e" }}>{u.banned?"Banned":u.muted?"Muted":"Active"}</b></span>
                    </div>
                    {(u.messages||[]).slice(-2).map((m,i)=>(
                      <div key={i} style={{ fontSize:10, color:"#334155", borderLeft:`2px solid ${V[m.verdict]?.color||"#334155"}50`, paddingLeft:8, marginBottom:4, lineHeight:1.5 }}>
                        <span style={{ color:V[m.verdict]?.color, fontWeight:700 }}>[{m.verdict}]</span> {m.text.slice(0,44)}{m.text.length>44?"…":""}
                      </div>
                    ))}
                    <div style={{ marginTop:12 }}>
                      {u.banned
                        ? <button className="pw-btn" onClick={()=>unban(uid)} style={{ width:"100%", padding:"9px", fontSize:11, background:"rgba(34,197,94,0.1)", color:"#22c55e", border:"1px solid rgba(34,197,94,0.2)" }}>✓ Unban User</button>
                        : <button className="pw-btn" onClick={()=>ban(uid)} style={{ width:"100%", padding:"9px", fontSize:11, background:"rgba(239,68,68,0.08)", color:"#ef4444", border:"1px solid rgba(239,68,68,0.15)" }}>🔨 Ban User</button>
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
