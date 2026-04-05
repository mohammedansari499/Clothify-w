import { useState, useEffect, useRef } from "react";
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// ─── THEME ───────────────────────────────────────────────────────────────────
const T = {
  sidebar:   "#151521",
  sidebarL:  "#1e1e2d",
  accent:    "#6366f1",
  accentG:   "#22c55e",
  accentP:   "#a855f7",
  accentB:   "#3b82f6",
  accentR:   "#f43f5e",
  accentY:   "#f59e0b",
  bg:        "#f8f9fc",
  card:      "#ffffff",
  text:      "#1e2139",
  muted:     "#6b7280",
  border:    "rgba(0,0,0,0.07)",
  dark:      "#0f0f1a",
};

// ─── STATIC DATA ─────────────────────────────────────────────────────────────
const CLOTHING_DATA = [
  { type: "Shirt", count: 42, color: T.accent },
  { type: "Pants", count: 35, color: T.accentB },
  { type: "Dress", count: 28, color: T.accentP },
  { type: "Outerwear", count: 21, color: T.accentG },
  { type: "Shoes", count: 18, color: T.accentY },
  { type: "Accessories", count: 14, color: T.accentR },
];

const USAGE_DATA = [
  { month: "Jan", outfits: 18 }, { month: "Feb", outfits: 22 },
  { month: "Mar", outfits: 29 }, { month: "Apr", outfits: 35 },
  { month: "May", outfits: 31 }, { month: "Jun", outfits: 40 },
  { month: "Jul", outfits: 38 }, { month: "Aug", outfits: 45 },
];

const SPARKLINE = {
  wardrobe: [12,18,22,19,28,31,26,35],
  outfits:  [5,8,7,12,11,15,13,18],
  accuracy: [71,74,76,79,81,83,85,87],
  colours:  [88,91,93,90,95,94,96,98],
};

// ─── NAVIGATION ──────────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  { id:"dashboard",    label:"Dashboard",          icon:"⊞", group:"MAIN" },
  { id:"setup",        label:"Windows 11 Setup",   icon:"⊙", group:"MAIN" },
  { id:"models",       label:"CNN Classifier",     icon:"△", group:"AI / ML" },
  { id:"color",        label:"Colour Science",     icon:"◐", group:"AI / ML" },
  { id:"nlp",          label:"NLP Occasion AI",    icon:"◇", group:"AI / ML" },
  { id:"planner_algo", label:"Outfit Algorithm",   icon:"◆", group:"AI / ML" },
  { id:"dataset",      label:"Data Pipeline",      icon:"◉", group:"FILES" },
  { id:"exporteval",   label:"Export & Evaluate",  icon:"▷", group:"FILES" },
  { id:"config",       label:"Config & Models",    icon:"≡", group:"FILES" },
  { id:"backend",      label:"Flask Routes",       icon:"□", group:"CODE" },
  { id:"scheduler",    label:"APScheduler",        icon:"◷", group:"CODE" },
  { id:"hooks",        label:"React Hooks & API",  icon:"⌀", group:"CODE" },
  { id:"wardrobe",     label:"Wardrobe Page",      icon:"◈", group:"CODE" },
  { id:"planner_page", label:"Planner Page",       icon:"▦", group:"CODE" },
  { id:"frontend",     label:"Dashboard UI",       icon:"⊡", group:"CODE" },
  { id:"deploy",       label:"Deployment",         icon:"↑", group:"PROJECT" },
  { id:"schedule",     label:"15-Day Plan",        icon:"▤", group:"PROJECT" },
  { id:"tests",        label:"Tests & Benchmarks", icon:"✓", group:"PROJECT" },
];

const GROUPS = ["MAIN","AI / ML","FILES","CODE","PROJECT"];

// ─── REUSABLE SMALL COMPONENTS ────────────────────────────────────────────────

function MiniSparkline({ data, color }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const w = 80, h = 32, pad = 2;
  const pts = data.map((v,i) => {
    const x = pad + (i/(data.length-1))*(w-2*pad);
    const y = h - pad - ((v-min)/(max-min+0.001))*(h-2*pad);
    return `${x},${y}`;
  }).join(" ");
  const fillPts = `${pad},${h} ` + pts + ` ${w-pad},${h}`;
  return (
    <svg width={w} height={h} style={{overflow:"visible"}}>
      <defs>
        <linearGradient id={`sg${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3}/>
          <stop offset="100%" stopColor={color} stopOpacity={0}/>
        </linearGradient>
      </defs>
      <polygon points={fillPts} fill={`url(#sg${color.replace("#","")})`}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function StatCard({ label, value, sub, delta, color, sparkData }) {
  const up = delta && delta.startsWith("+");
  return (
    <div style={{ background:T.card, borderRadius:12, padding:"20px 24px",
      boxShadow:"0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.04)",
      border:`1px solid ${T.border}`, flex:1, minWidth:0 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
        <div>
          <div style={{ fontSize:12, color:T.muted, marginBottom:4, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</div>
          <div style={{ fontSize:26, fontWeight:700, color:T.text, lineHeight:1 }}>{value}</div>
          {sub && <div style={{ fontSize:12, color:T.muted, marginTop:4 }}>{sub}</div>}
        </div>
        {delta && (
          <div style={{ display:"flex", alignItems:"flex-start" }}>
            <span style={{ fontSize:12, fontWeight:600, color: up?"#22c55e":"#f43f5e",
              background: up?"#f0fdf4":"#fff1f2", padding:"3px 8px", borderRadius:20 }}>
              {up?"▲":"▼"} {delta}
            </span>
          </div>
        )}
      </div>
      {sparkData && (
        <div style={{ marginTop:8 }}>
          <MiniSparkline data={sparkData} color={color}/>
        </div>
      )}
      <div style={{ marginTop:8, height:3, borderRadius:99, background:`${color}20`, overflow:"hidden" }}>
        <div style={{ height:"100%", width:"68%", background:color, borderRadius:99, transition:"width 1s" }}/>
      </div>
    </div>
  );
}

function Tag({ children, color = T.accent }) {
  return (
    <span style={{ display:"inline-block", padding:"2px 10px", borderRadius:20,
      background:`${color}18`, color, fontSize:11, fontWeight:600,
      border:`1px solid ${color}35`, marginRight:4, marginBottom:3 }}>
      {children}
    </span>
  );
}

function Badge({ children, color = T.muted }) {
  return (
    <span style={{ display:"inline-block", padding:"1px 8px", borderRadius:4,
      background:`${color}15`, color, fontSize:11, fontWeight:500,
      fontFamily:"monospace", border:`1px solid ${color}30` }}>
      {children}
    </span>
  );
}

function CodeBlock({ code, lang = "python", title = "" }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(code).catch(()=>{});
    setCopied(true);
    setTimeout(()=>setCopied(false), 2000);
  };
  const lines = code.split("\n");
  return (
    <div style={{ borderRadius:10, overflow:"hidden", margin:"12px 0",
      boxShadow:"0 4px 16px rgba(0,0,0,0.2)" }}>
      <div style={{ background:"#1e1e2d", padding:"8px 16px",
        display:"flex", justifyContent:"space-between", alignItems:"center",
        borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ display:"flex", gap:5 }}>
            {["#f43f5e","#f59e0b","#22c55e"].map(c=>(
              <div key={c} style={{ width:10, height:10, borderRadius:"50%", background:c }}/>
            ))}
          </div>
          {title && <span style={{ color:"#8892b0", fontSize:12, marginLeft:6, fontFamily:"monospace" }}>{title}</span>}
        </div>
        <button onClick={copy} style={{ background:"rgba(255,255,255,0.06)", border:"none",
          color:"#8892b0", fontSize:11, cursor:"pointer", padding:"3px 10px",
          borderRadius:4, fontFamily:"monospace" }}>
          {copied ? "✓ copied" : "copy"}
        </button>
      </div>
      <div style={{ background:"#0f0f1a", overflowX:"auto", maxHeight:440, overflowY:"auto" }}>
        <pre style={{ margin:0, padding:"16px 20px", fontFamily:"'Fira Code',monospace",
          fontSize:12.5, lineHeight:1.85, color:"#cdd6f4" }}>
          {lines.map((line,i) => {
            const t = line.trim();
            const isComment = t.startsWith("#") || t.startsWith("//") || t.startsWith('"""') || t.startsWith("'''");
            const isKw = /^(def |class |import |from |return |if |elif |else:|for |while |async |await |with |try:|except |@|const |let |var |function |export |default )/.test(t);
            const isStr = /^["'`]/.test(t) || /"""/.test(t);
            const col = isComment ? "#6272a4" : isKw ? "#bd93f9" : "#cdd6f4";
            return <span key={i} style={{ display:"block", color:col }}>{line||" "}</span>;
          })}
        </pre>
      </div>
    </div>
  );
}

function SectionTitle({ icon, title, sub }) {
  return (
    <div style={{ marginBottom:24 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:`${T.accent}18`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:18, color:T.accent, border:`1px solid ${T.accent}30` }}>
          {icon}
        </div>
        <h1 style={{ fontSize:22, fontWeight:700, margin:0, color:T.text }}>{title}</h1>
      </div>
      {sub && <p style={{ margin:0, fontSize:13.5, color:T.muted, lineHeight:1.6, paddingLeft:46 }}>{sub}</p>}
    </div>
  );
}

function InfoBox({ type = "tip", children }) {
  const map = {
    tip:    { icon:"💡", color:"#6366f1", bg:"#eef2ff", label:"Pro Tip" },
    warn:   { icon:"⚠️",  color:"#f59e0b", bg:"#fffbeb", label:"Windows Note" },
    error:  { icon:"🔴", color:"#f43f5e", bg:"#fff1f2", label:"Common Error" },
    hp:     { icon:"💻", color:"#3b82f6", bg:"#eff6ff", label:"HP 15s / i5-12th Gen" },
    model:  { icon:"🧠", color:"#a855f7", bg:"#faf5ff", label:"Model Note" },
    cmd:    { icon:"⚡", color:"#22c55e", bg:"#f0fdf4", label:"Run This" },
  };
  const m = map[type] || map.tip;
  return (
    <div style={{ display:"flex", gap:0, borderRadius:10, overflow:"hidden",
      border:`1px solid ${m.color}25`, margin:"12px 0",
      boxShadow:`0 2px 8px ${m.color}10` }}>
      <div style={{ background:m.color, padding:"14px 16px", fontSize:18, display:"flex",
        alignItems:"flex-start", flexShrink:0 }}>{m.icon}</div>
      <div style={{ padding:"12px 16px", background:m.bg }}>
        <div style={{ fontSize:10, fontWeight:700, color:m.color, textTransform:"uppercase",
          letterSpacing:"0.1em", marginBottom:4 }}>{m.label}</div>
        <div style={{ fontSize:13, color:"#374151", lineHeight:1.65 }}>{children}</div>
      </div>
    </div>
  );
}

function StepCard({ n, title, children, color = T.accent }) {
  return (
    <div style={{ display:"flex", gap:16, marginBottom:20 }}>
      <div style={{ width:36, height:36, borderRadius:10, background:color,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:15, fontWeight:800, color:"white", flexShrink:0, marginTop:2 }}>
        {n}
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:15, fontWeight:700, color:T.text, marginBottom:8 }}>{title}</div>
        <div>{children}</div>
      </div>
    </div>
  );
}

// ─── DASHBOARD SECTION ───────────────────────────────────────────────────────
function SectionDashboard() {
  return (
    <div>
      <SectionTitle icon="⊞" title="Project Dashboard"
        sub="WardrobeAI — AI-powered wardrobe management system. HP 15s · i5-12th Gen · 8GB RAM · Windows 11 · 100% local inference." />

      {/* Stat Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
        <StatCard label="Wardrobe Items" value="158" sub="Across 12 classes" delta="+12 this week" color={T.accent} sparkData={SPARKLINE.wardrobe}/>
        <StatCard label="Weekly Outfits" value="28" sub="Plans generated" delta="+3 vs last week" color={T.accentG} sparkData={SPARKLINE.outfits}/>
        <StatCard label="CNN Accuracy" value="84%" sub="Weighted F1" delta="+2.1% this epoch" color={T.accentP} sparkData={SPARKLINE.accuracy}/>
        <StatCard label="Colour Accuracy" value="96.2%" sub="ΔE < 4 on test set" delta="+0.8%" color={T.accentB} sparkData={SPARKLINE.colours}/>
      </div>

      {/* Charts Row */}
      <div style={{ display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:14, marginBottom:24 }}>
        <div style={{ background:T.card, borderRadius:12, padding:"20px 24px",
          boxShadow:"0 1px 3px rgba(0,0,0,0.08)", border:`1px solid ${T.border}` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div>
              <div style={{ fontWeight:700, fontSize:15, color:T.text }}>Clothing Type Distribution</div>
              <div style={{ fontSize:12, color:T.muted }}>Your wardrobe breakdown</div>
            </div>
            <Badge color={T.accentG}>Live</Badge>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={CLOTHING_DATA} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)"/>
              <XAxis dataKey="type" tick={{ fontSize:11, fill:T.muted }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:11, fill:T.muted }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ borderRadius:8, border:"none", boxShadow:"0 4px 20px rgba(0,0,0,0.15)", fontSize:12 }}/>
              <Bar dataKey="count" radius={[6,6,0,0]}>
                {CLOTHING_DATA.map((d,i)=>(
                  <Cell key={i} fill={d.color}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background:T.card, borderRadius:12, padding:"20px 24px",
          boxShadow:"0 1px 3px rgba(0,0,0,0.08)", border:`1px solid ${T.border}` }}>
          <div style={{ fontWeight:700, fontSize:15, color:T.text, marginBottom:4 }}>Outfit Usage Trend</div>
          <div style={{ fontSize:12, color:T.muted, marginBottom:16 }}>Monthly plan generations</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={USAGE_DATA}>
              <defs>
                <linearGradient id="colGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={T.accentP} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={T.accentP} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)"/>
              <XAxis dataKey="month" tick={{ fontSize:11, fill:T.muted }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:11, fill:T.muted }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ borderRadius:8, border:"none", boxShadow:"0 4px 20px rgba(0,0,0,0.15)", fontSize:12 }}/>
              <Area type="monotone" dataKey="outfits" stroke={T.accentP} strokeWidth={2.5} fill="url(#colGrad)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* System Info */}
      <div style={{ background:T.card, borderRadius:12, padding:"20px 24px",
        boxShadow:"0 1px 3px rgba(0,0,0,0.08)", border:`1px solid ${T.border}` }}>
        <div style={{ fontWeight:700, fontSize:15, color:T.text, marginBottom:16 }}>System Compatibility — HP 15s · i5-12th Gen · 8GB RAM</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
          {[
            { label:"PyTorch CPU", status:"✓ Full support", color:T.accentG },
            { label:"MobileNetV2", status:"✓ ~60ms/image", color:T.accentG },
            { label:"Sentence-TF", status:"✓ ~800MB RAM", color:T.accentY },
            { label:"Training", status:"⚠ 4–6 hrs local", color:T.accentY },
            { label:"Inference RAM", status:"~1.2 GB peak", color:T.accentG },
            { label:"Color Extractor", status:"✓ <50ms", color:T.accentG },
            { label:"Colab Training", status:"✓ Recommended", color:T.accentB },
            { label:"APScheduler", status:"✓ Windows OK", color:T.accentG },
          ].map(item=>(
            <div key={item.label} style={{ borderRadius:8, padding:"12px 14px",
              background:`${item.color}0A`, border:`1px solid ${item.color}25` }}>
              <div style={{ fontSize:11, fontWeight:600, color:T.muted, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.05em" }}>{item.label}</div>
              <div style={{ fontSize:13, fontWeight:600, color:item.color }}>{item.status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── WINDOWS SETUP SECTION ────────────────────────────────────────────────────
function SectionSetup() {
  const [step, setStep] = useState(0);
  const steps = [
    { title:"Install Python 3.11", color:T.accent },
    { title:"Install Node.js 20 LTS", color:T.accentB },
    { title:"Install VS Code (optional)", color:T.accentP },
    { title:"Clone / Create project", color:T.accentG },
    { title:"Set up Python venv", color:T.accent },
    { title:"Install PyTorch (CPU)", color:T.accentR },
    { title:"Install all dependencies", color:T.accentY },
    { title:"Run backend", color:T.accentG },
    { title:"Run frontend", color:T.accentB },
  ];

  const content = [
    <>
      <p style={{ fontSize:13, color:T.muted, lineHeight:1.7, marginBottom:12 }}>
        Python 3.11 is the sweet spot for PyTorch on Windows. Newer versions (3.12+) sometimes have compatibility issues with PyTorch wheels. Go to the official Python website and download the 3.11.x installer.
      </p>
      <InfoBox type="warn">
        On the installer screen, tick <strong>"Add Python to PATH"</strong> BEFORE clicking Install. This is the most common beginner mistake on Windows — if you miss it, PyTorch commands won't work in PowerShell.
      </InfoBox>
      <CodeBlock title="Verify install — open PowerShell and run" code={`python --version
# Should print: Python 3.11.x

pip --version
# Should print: pip 23.x from ...`}/>
      <InfoBox type="error">
        If you get "python is not recognized", close and reopen PowerShell after ticking PATH. If still failing, search for "Edit environment variables" in Start and manually add: C:\Users\YourName\AppData\Local\Programs\Python\Python311\
      </InfoBox>
    </>,
    <>
      <p style={{ fontSize:13, color:T.muted, lineHeight:1.7, marginBottom:12 }}>
        Node.js runs the React frontend (Vite dev server). Download the LTS version from nodejs.org — it includes npm automatically.
      </p>
      <CodeBlock title="Verify in PowerShell" code={`node --version
# Should print: v20.x.x

npm --version
# Should print: 10.x.x`}/>
      <InfoBox type="hp">
        Your HP 15s has enough RAM for Vite + Flask to run simultaneously. Keep Chrome tabs to a minimum during development to leave memory for PyTorch inference.
      </InfoBox>
    </>,
    <>
      <p style={{ fontSize:13, color:T.muted, lineHeight:1.7, marginBottom:12 }}>
        VS Code is optional but strongly recommended — it gives you a terminal, file explorer, and Python syntax highlighting all in one window. Download from code.visualstudio.com.
      </p>
      <InfoBox type="tip">
        Install these VS Code extensions: Python (Microsoft), Pylance, ES7+ React Snippets, Tailwind CSS IntelliSense. They catch errors as you type.
      </InfoBox>
    </>,
    <>
      <p style={{ fontSize:13, color:T.muted, lineHeight:1.7, marginBottom:12 }}>
        Create the project folder structure. Open PowerShell in a location you want (e.g. Desktop) and run:
      </p>
      <CodeBlock title="PowerShell — Create project" code={`mkdir wardrobeai
cd wardrobeai
mkdir backend frontend
mkdir backend\\ai backend\\ai\\weights backend\\ai\\train
mkdir backend\\routes backend\\utils`}/>
      <p style={{ fontSize:13, color:T.muted, lineHeight:1.7, margin:"12px 0" }}>Your folder tree should look like:</p>
      <CodeBlock title="Folder structure" code={`wardrobeai/
  backend/
    ai/
      weights/       ← trained model goes here
      train/         ← training scripts
    routes/          ← Flask blueprints
    utils/           ← helpers
    app.py
    config.py
    models.py
    requirements.txt
  frontend/
    src/
      api/
      components/
      hooks/
      pages/
    package.json
    vite.config.js
    tailwind.config.js`}/>
    </>,
    <>
      <p style={{ fontSize:13, color:T.muted, lineHeight:1.7, marginBottom:12 }}>
        A virtual environment isolates your project's Python packages from the rest of your system. This prevents version conflicts. Always use one per project.
      </p>
      <CodeBlock title="PowerShell — inside wardrobeai/backend/" code={`cd backend

# Create the virtual environment (creates a venv/ folder)
python -m venv venv

# Activate it  (you must do this every time you open a new terminal)
.\\venv\\Scripts\\Activate.ps1

# You'll see (venv) appear at the start of your prompt like:
# (venv) PS C:\\...\\wardrobeai\\backend>`}/>
      <InfoBox type="error">
        If you get "running scripts is disabled on this system", run this ONCE in PowerShell as Administrator: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
      </InfoBox>
    </>,
    <>
      <p style={{ fontSize:13, color:T.muted, lineHeight:1.7, marginBottom:12 }}>
        PyTorch has two versions: GPU (CUDA) and CPU. Since your HP 15s i5-12th Gen does not have an Nvidia GPU, we install the CPU-only version. It's lighter (~180MB vs 2.5GB) and runs fine for inference.
      </p>
      <InfoBox type="hp">
        Your i5-12th Gen has Performance-cores and Efficiency-cores. PyTorch CPU automatically uses all available threads via OpenMP — you don't need to configure anything. Expect ~60–90ms per image for MobileNetV2 inference, which is fast enough for this project.
      </InfoBox>
      <CodeBlock title="Install PyTorch CPU — run with (venv) active" code={`# Install PyTorch CPU-only wheel (much smaller than default)
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Verify
python -c "import torch; print(torch.__version__); print('CPU threads:', torch.get_num_threads())"
# Expected: 2.2.0+cpu
# Expected: CPU threads: 8  (your i5 has 8 logical cores)`}/>
    </>,
    <>
      <p style={{ fontSize:13, color:T.muted, lineHeight:1.7, marginBottom:12 }}>
        Create backend/requirements.txt with all dependencies, then install:
      </p>
      <CodeBlock title="backend/requirements.txt" code={`# Core web framework
flask==3.0.0
flask-cors==4.0.0
flask-jwt-extended==4.6.0
gunicorn==21.2.0

# Database
pymongo==4.6.0

# Auth
bcrypt==4.1.2
python-dotenv==1.0.0

# AI — Computer Vision
# Note: torch + torchvision installed separately via CPU wheel above
opencv-python==4.9.0.80
scikit-learn==1.4.0
pillow==10.2.0

# AI — NLP (occasion detection)
sentence-transformers==2.5.1

# Image storage
cloudinary==1.38.0
requests==2.31.0

# Google Calendar
google-auth==2.27.0
google-auth-oauthlib==1.2.0
google-api-python-client==2.118.0

# Scheduler
APScheduler==3.10.4`}/>
      <CodeBlock title="Install all dependencies" code={`# Make sure (venv) is active first!
pip install -r requirements.txt

# This will take 3-5 minutes on your HP 15s
# You'll see progress bars for each package`}/>
      <InfoBox type="warn">
        If sentence-transformers installation fails: pip install sentence-transformers --no-deps followed by pip install transformers huggingface-hub tokenizers
      </InfoBox>
    </>,
    <>
      <CodeBlock title="Run Flask backend" code={`# Make sure you're in backend/ with (venv) active
cd wardrobeai\\backend
.\\venv\\Scripts\\Activate.ps1
python app.py

# You should see:
# * Running on http://127.0.0.1:5000
# * Debug mode: on
# [scheduler] Weekly reset job registered`}/>
      <InfoBox type="error">
        "Address already in use": Another program is using port 5000. Change port in app.py: app.run(port=5001) or kill the process using Task Manager → Details → python.exe → End task.
      </InfoBox>
      <InfoBox type="error">
        "ModuleNotFoundError: No module named 'torch'": Your venv is not activated. Run .\\venv\\Scripts\\Activate.ps1 first.
      </InfoBox>
    </>,
    <>
      <CodeBlock title="Run React frontend (new PowerShell window)" code={`# Open a NEW PowerShell window (keep backend running)
cd wardrobeai\\frontend

# Install dependencies (first time only, takes 1-2 min)
npm install

# Start dev server
npm run dev

# You should see:
#   VITE v5.x.x  ready in 234ms
#   ➜  Local:   http://localhost:5173/`}/>
      <InfoBox type="hp">
        With your 8GB RAM, you can comfortably run both Flask (:5000) and Vite (:5173) simultaneously plus MongoDB Atlas in the cloud, leaving ~4GB for the OS and browser.
      </InfoBox>
      <InfoBox type="tip">
        Use Windows Terminal (from Microsoft Store, free) instead of PowerShell — it lets you have Flask and Vite side by side in tabs. Much better DX.
      </InfoBox>
    </>,
  ];

  return (
    <div>
      <SectionTitle icon="⊙" title="Windows 11 Setup Guide"
        sub="Complete step-by-step guide for HP 15s · Intel i5-12th Gen · 8GB RAM. No prior experience required."/>

      {/* Step Progress */}
      <div style={{ display:"flex", gap:0, marginBottom:28, overflowX:"auto",
        background:T.card, borderRadius:12, padding:"14px 20px",
        boxShadow:"0 1px 3px rgba(0,0,0,0.08)", border:`1px solid ${T.border}` }}>
        {steps.map((s,i)=>(
          <button key={i} onClick={()=>setStep(i)}
            style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4,
              background:"none", border:"none", cursor:"pointer", padding:"6px 10px",
              minWidth:72, flex:1 }}>
            <div style={{ width:32, height:32, borderRadius:"50%",
              background: step===i ? s.color : i<step ? `${s.color}30` : "rgba(0,0,0,0.06)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:13, fontWeight:700,
              color: step===i ? "white" : i<step ? s.color : T.muted,
              border: step===i ? "none" : `2px solid ${step>=i?s.color+"40":"rgba(0,0,0,0.1)"}`,
              transition:"all 0.2s" }}>
              {i < step ? "✓" : i+1}
            </div>
            <span style={{ fontSize:10, color: step===i?s.color:T.muted, fontWeight: step===i?600:400,
              textAlign:"center", lineHeight:1.3, whiteSpace:"nowrap",
              maxWidth:70, overflow:"hidden", textOverflow:"ellipsis" }}>
              {s.title}
            </span>
          </button>
        ))}
      </div>

      {/* Step Content */}
      <div style={{ background:T.card, borderRadius:12, padding:"28px 32px",
        boxShadow:"0 1px 3px rgba(0,0,0,0.08)", border:`1px solid ${T.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:steps[step].color,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:18, fontWeight:800, color:"white" }}>{step+1}</div>
          <div>
            <div style={{ fontSize:17, fontWeight:700, color:T.text }}>{steps[step].title}</div>
            <div style={{ fontSize:12, color:T.muted }}>Step {step+1} of {steps.length}</div>
          </div>
        </div>
        {content[step]}
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:24 }}>
          <button onClick={()=>setStep(Math.max(0,step-1))} disabled={step===0}
            style={{ background:step===0?"rgba(0,0,0,0.04)":"rgba(0,0,0,0.06)",
              border:`1px solid ${T.border}`, padding:"8px 20px", borderRadius:8,
              fontSize:13, cursor:step===0?"not-allowed":"pointer",
              color:step===0?T.muted:T.text, fontWeight:500 }}>← Previous</button>
          <button onClick={()=>setStep(Math.min(steps.length-1,step+1))} disabled={step===steps.length-1}
            style={{ background:step===steps.length-1?T.accentG+"40":T.accent,
              border:"none", padding:"8px 24px", borderRadius:8,
              fontSize:13, cursor:step===steps.length-1?"not-allowed":"pointer",
              color:"white", fontWeight:600 }}>
            {step===steps.length-1?"Complete ✓":"Next Step →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── AI MODELS SECTION ────────────────────────────────────────────────────────
function SectionModels() {
  const [tab, setTab] = useState("arch");
  return (
    <div>
      <SectionTitle icon="△" title="AI Clothing Classifier"
        sub="MobileNetV2 transfer learning on DeepFashion. Runs 100% locally on CPU. No API fallbacks."/>

      <div style={{ display:"flex", gap:8, marginBottom:20, background:T.card,
        borderRadius:10, padding:6, boxShadow:"0 1px 3px rgba(0,0,0,0.08)", border:`1px solid ${T.border}` }}>
        {[["arch","Architecture"],["training","Training Script"],["inference","Inference Code"],["compare","Model Comparison"]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)}
            style={{ flex:1, padding:"8px 0", borderRadius:7, border:"none",
              background: tab===id?T.accent:"transparent",
              color: tab===id?"white":T.muted, fontSize:12, fontWeight:600,
              cursor:"pointer", transition:"all 0.2s" }}>{label}</button>
        ))}
      </div>

      {tab==="arch" && (
        <div>
          <InfoBox type="model">
            MobileNetV2 is selected for your HP 15s because it achieves near-ResNet-50 accuracy at 1/10th the compute. CPU inference: ~60ms per image. RAM footprint: ~300MB loaded. Perfect for 8GB systems.
          </InfoBox>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:16 }}>
            {[
              {label:"Parameters",val:"3.4M",color:T.accent,note:"vs 25M for ResNet-50"},
              {label:"CPU Inference",val:"~60ms",color:T.accentG,note:"on i5-12th gen"},
              {label:"Target Accuracy",val:"≥82%",color:T.accentP,note:"weighted F1 on test"},
              {label:"Classes",val:"12",color:T.accentB,note:"clothing categories"},
            ].map(m=>(
              <div key={m.label} style={{ background:T.card, borderRadius:10,
                border:`1px solid ${m.color}25`, padding:"16px 20px",
                boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize:11, color:T.muted, marginBottom:6, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>{m.label}</div>
                <div style={{ fontSize:26, fontWeight:800, color:m.color, marginBottom:4 }}>{m.val}</div>
                <div style={{ fontSize:11, color:T.muted }}>{m.note}</div>
              </div>
            ))}
          </div>
          <div style={{ background:T.card, borderRadius:12, padding:"20px 24px",
            border:`1px solid ${T.border}`, boxShadow:"0 1px 3px rgba(0,0,0,0.08)", marginBottom:16 }}>
            <div style={{ fontWeight:700, fontSize:14, color:T.text, marginBottom:14 }}>Two-Phase Transfer Learning</div>
            {[
              {phase:"Phase 1 — Epochs 1–5",color:T.accentG,items:["Freeze ALL backbone layers","Only custom head is trainable (~3,000 params)","Optimizer: Adam lr=1e-3, weight_decay=1e-4","CosineAnnealingLR T_max=5","Converges fast — head maps pre-trained features to 12 classes"]},
              {phase:"Phase 2 — Epochs 6–20",color:T.accentP,items:["Unfreeze last 20 MobileNetV2 layers","Backbone lr=1e-5, head lr=1e-4 (differential rates)","CosineAnnealingLR T_max=15","Backbone adapts: texture, drape, collars, sleeves","Checkpoint saved whenever val_acc improves"]},
            ].map(p=>(
              <div key={p.phase} style={{ marginBottom:14, borderRadius:8, border:`1px solid ${p.color}25`,
                background:`${p.color}06`, padding:"12px 16px" }}>
                <div style={{ fontSize:13, fontWeight:700, color:p.color, marginBottom:8 }}>{p.phase}</div>
                {p.items.map((item,i)=>(
                  <div key={i} style={{ display:"flex", gap:8, fontSize:12, color:T.muted,
                    padding:"4px 0", borderBottom:`1px solid ${p.color}15` }}>
                    <span style={{ color:p.color, flexShrink:0 }}>▸</span>{item}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ background:"#0f0f1a", borderRadius:10, padding:"16px 20px",
            border:`1px solid rgba(255,255,255,0.06)` }}>
            <div style={{ fontSize:12, color:"#6272a4", fontFamily:"monospace", marginBottom:8 }}>
              # Head Architecture — two-layer MLP for fine-grained classification
            </div>
            {[
              "AdaptiveAvgPool  →  Dropout(0.3)  →  Linear(1280→256)",
              "→  ReLU  →  Dropout(0.2)  →  Linear(256→12)",
              "",
              "Loss: CrossEntropyLoss(weight=class_weights)",
              "       where  w_i = (1/count_i) / Σ(1/count_j)",
            ].map((l,i)=>(
              <div key={i} style={{ fontFamily:"monospace", fontSize:13, color: i===3||i===4?"#6272a4":"#bd93f9",
                lineHeight:2, textAlign:"center" }}>{l||"\u00a0"}</div>
            ))}
          </div>
        </div>
      )}

      {tab==="training" && (
        <div>
          <InfoBox type="hp">
            Training locally on your HP 15s will take 4–6 hours for 20 epochs on DeepFashion. Strongly recommended: use Google Colab (free GPU) to train, then download the .pt weights file. Local inference is fast — only training is slow on CPU.
          </InfoBox>
          <CodeBlock title="backend/ai/train/train_classifier.py" code={`"""
train_classifier.py — MobileNetV2 two-phase transfer learning.

For HP 15s (CPU only): use Google Colab for training.
  1. Upload this file + data/ to Colab
  2. Run with GPU runtime (free tier)
  3. Download best_checkpoint.pt when done
  4. Run export_model.py locally to convert to TorchScript

Phase 1 (epochs 1-5):  frozen backbone, lr=1e-3
Phase 2 (epochs 6-20): unfreeze last 20 layers, lr=1e-5
"""
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models
from torch.optim.lr_scheduler import CosineAnnealingLR
import numpy as np, json
from pathlib import Path

DATA_DIR    = Path("data")
WEIGHTS_DIR = Path("backend/ai/weights")
BATCH_SIZE  = 32     # reduce to 16 if running on CPU / low RAM
NUM_WORKERS = 0      # MUST be 0 on Windows (multiprocessing issues)
IMG_SIZE    = 224
DEVICE      = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"[train] Using device: {DEVICE}")

MEAN = [0.485, 0.456, 0.406]   # ImageNet normalization
STD  = [0.229, 0.224, 0.225]

# Data augmentation pipeline
train_tf = transforms.Compose([
    transforms.Resize((IMG_SIZE + 32, IMG_SIZE + 32)),
    transforms.RandomResizedCrop(IMG_SIZE, scale=(0.7, 1.0)),
    transforms.RandomHorizontalFlip(p=0.5),
    transforms.RandomRotation(degrees=15),
    transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2),
    transforms.RandomGrayscale(p=0.1),
    transforms.GaussianBlur(kernel_size=3),
    transforms.ToTensor(),
    transforms.Normalize(mean=MEAN, std=STD),
])
val_tf = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=MEAN, std=STD),
])

train_ds = datasets.ImageFolder(DATA_DIR / "train", transform=train_tf)
val_ds   = datasets.ImageFolder(DATA_DIR / "val",   transform=val_tf)
NUM_CLASSES = len(train_ds.classes)

# CRITICAL on Windows: num_workers=0 to avoid DataLoader spawn issues
train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True,
                          num_workers=NUM_WORKERS, pin_memory=DEVICE.type=="cuda")
val_loader   = DataLoader(val_ds, batch_size=BATCH_SIZE, shuffle=False,
                          num_workers=NUM_WORKERS)

# Save class index
WEIGHTS_DIR.mkdir(parents=True, exist_ok=True)
idx_to_class = {v: k for k, v in train_ds.class_to_idx.items()}
with open(WEIGHTS_DIR / "class_index.json", "w") as f:
    json.dump(idx_to_class, f, indent=2)

# Build model
def build_model():
    m = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.IMAGENET1K_V1)
    for p in m.parameters():
        p.requires_grad = False        # freeze all backbone layers
    in_feats = m.classifier[1].in_features   # 1280
    m.classifier = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(in_feats, 256),
        nn.ReLU(inplace=True),
        nn.Dropout(p=0.2),
        nn.Linear(256, NUM_CLASSES),
    )
    return m.to(DEVICE)

model = build_model()

# Class-weighted loss to handle imbalanced data
counts  = np.array([len(list((DATA_DIR/"train"/c).iterdir()))
                    for c in train_ds.classes])
weights = torch.tensor(1.0/counts / (1.0/counts).sum(), dtype=torch.float32).to(DEVICE)
criterion = nn.CrossEntropyLoss(weight=weights)

def evaluate():
    model.eval()
    correct = total = loss_sum = 0
    with torch.no_grad():
        for imgs, labels in val_loader:
            imgs, labels = imgs.to(DEVICE), labels.to(DEVICE)
            out = model(imgs)
            loss_sum += criterion(out, labels).item()
            correct  += (out.argmax(1) == labels).sum().item()
            total    += labels.size(0)
    return loss_sum / len(val_loader), correct / total

def train_epoch(optimizer):
    model.train()
    for imgs, labels in train_loader:
        imgs, labels = imgs.to(DEVICE), labels.to(DEVICE)
        optimizer.zero_grad()
        criterion(model(imgs), labels).backward()
        optimizer.step()

# ── PHASE 1: Train head only ────────────────────────────────────
print("\\n═══ PHASE 1: Head training (backbone frozen) ═══")
opt1 = torch.optim.Adam(model.classifier.parameters(), lr=1e-3, weight_decay=1e-4)
sch1 = CosineAnnealingLR(opt1, T_max=5)
best_acc = 0.0

for ep in range(1, 6):
    train_epoch(opt1); sch1.step()
    vl, va = evaluate()
    print(f"  Epoch {ep}/5  val_loss={vl:.4f}  val_acc={va:.3f}")

# ── PHASE 2: Fine-tune last 20 layers ──────────────────────────
print("\\n═══ PHASE 2: Fine-tuning last 20 layers ═══")
for layer in list(model.features.children())[-20:]:
    for p in layer.parameters():
        p.requires_grad = True

opt2 = torch.optim.Adam([
    {"params": model.features[-20:].parameters(), "lr": 1e-5},
    {"params": model.classifier.parameters(),     "lr": 1e-4},
], weight_decay=1e-4)
sch2 = CosineAnnealingLR(opt2, T_max=15)

for ep in range(1, 16):
    train_epoch(opt2); sch2.step()
    vl, va = evaluate()
    print(f"  Epoch {ep}/15  val_loss={vl:.4f}  val_acc={va:.3f}")
    if va > best_acc:
        best_acc = va
        torch.save(model.state_dict(), WEIGHTS_DIR / "best_checkpoint.pt")
        print(f"  ✓ Checkpoint saved — acc={va:.3f}")

print(f"\\nDone. Best val_acc={best_acc:.3f}")
print("Run export_model.py to convert to TorchScript.")`}/>
        </div>
      )}

      {tab==="inference" && (
        <CodeBlock title="backend/ai/classifier.py — production inference" code={`"""
classifier.py — Production clothing classifier.

IMPORTANT:
  - Model loaded ONCE at module import (not per request)
  - Thread-safe for Gunicorn multi-worker deployment
  - NO fallback logic — only model prediction
  - Confidence threshold: 0.65 minimum
"""
import torch
from torchvision import transforms
from PIL import Image
import io, json, logging
from pathlib import Path

logger = logging.getLogger(__name__)

WEIGHTS_DIR = Path(__file__).parent / "weights"
IMG_SIZE    = 224
MEAN        = [0.485, 0.456, 0.406]
STD         = [0.229, 0.224, 0.225]
CONF_THRESH = 0.65      # below this → "unknown" (no fallback)

# ── Load model at startup ─────────────────────────────────────────
logger.info("[classifier] Loading TorchScript model...")
DEVICE = torch.device("cpu")   # CPU-only for HP 15s

try:
    MODEL = torch.jit.load(
        WEIGHTS_DIR / "clothing_classifier.pt",
        map_location=DEVICE
    )
    MODEL.eval()
    logger.info("[classifier] Model loaded successfully.")
except FileNotFoundError:
    raise RuntimeError(
        "Model file not found: backend/ai/weights/clothing_classifier.pt\\n"
        "Run training first: python backend/ai/train/train_classifier.py\\n"
        "Then export: python backend/ai/train/export_model.py"
    )

with open(WEIGHTS_DIR / "class_index.json") as f:
    IDX_TO_CLASS = json.load(f)   # {0: "shirt", 1: "pants", ...}

# ── Inference transform (NO augmentation, only normalise) ─────────
INFER_TF = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=MEAN, std=STD),
])

def classify_image(image_bytes: bytes) -> dict:
    """
    Classify clothing type from image bytes.
    NO fallback — either confident prediction or 'unknown'.

    Returns:
        {
          "type":       str,    # "shirt" | "pants" | "unknown" etc.
          "confidence": float,  # top prediction probability
          "top3":       list    # [{type, score}, ...] top 3
        }

    Raises:
        ValueError: if image cannot be decoded
    """
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    tensor = INFER_TF(img).unsqueeze(0)      # shape: [1, 3, 224, 224]

    with torch.no_grad():
        logits = MODEL(tensor)               # shape: [1, 12]
        probs  = torch.softmax(logits, dim=1)[0]   # shape: [12]

    top3_idx = torch.argsort(probs, descending=True)[:3]
    top3 = [
        {"type":  IDX_TO_CLASS[str(i.item())],
         "score": round(probs[i].item(), 4)}
        for i in top3_idx
    ]

    best_score = top3[0]["score"]
    best_type  = top3[0]["type"] if best_score >= CONF_THRESH else "unknown"

    logger.debug(f"[classify] {best_type} ({best_score:.2%})")

    return {
        "type":       best_type,
        "confidence": round(best_score, 4),
        "top3":       top3,
    }`}/>
      )}

      {tab==="compare" && (
        <div>
          <div style={{ background:T.card, borderRadius:12, overflow:"hidden",
            border:`1px solid ${T.border}`, boxShadow:"0 1px 3px rgba(0,0,0,0.08)" }}>
            <div style={{ background:T.sidebar, padding:"10px 16px",
              display:"grid", gridTemplateColumns:"160px 90px 90px 80px 120px 100px" }}>
              {["Model","Params","Top-1","MACs","CPU ms (i5)","Decision"].map(h=>(
                <div key={h} style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.6)", textTransform:"uppercase", letterSpacing:"0.05em" }}>{h}</div>
              ))}
            </div>
            {[
              ["Fashion-MNIST CNN","~500K","N/A","15M","~5ms","❌ Toy data only"],
              ["ResNet-50","25.6M","76.1%","4.1B","~180ms","Too slow for 8GB"],
              ["VGG-16","138M","71.3%","15.3B","~900ms","Way too heavy"],
              ["EfficientNet-B0","5.3M","77.1%","390M","~90ms","Good alternative"],
              ["MobileNetV2 ✓","3.4M","72.0%","300M","~60ms","✓ Best for HP 15s"],
            ].map(([m,p,t1,mac,ms,dec],i)=>{
              const chosen = dec.startsWith("✓");
              return (
                <div key={m} style={{ display:"grid", gridTemplateColumns:"160px 90px 90px 80px 120px 100px",
                  padding:"10px 16px",
                  background: chosen ? `${T.accentG}08` : i%2===0?"white":"#fafafa",
                  borderTop:"1px solid rgba(0,0,0,0.05)",
                  border: chosen ? `1px solid ${T.accentG}30` : undefined }}>
                  <div style={{ fontSize:13, fontWeight:chosen?700:400, color:chosen?T.accentG:T.text }}>{m}</div>
                  <div style={{ fontSize:12, color:T.muted }}>{p}</div>
                  <div style={{ fontSize:12, color:T.muted }}>{t1}</div>
                  <div style={{ fontSize:12, color:T.muted }}>{mac}</div>
                  <div style={{ fontSize:12, color:T.muted }}>{ms}</div>
                  <div style={{ fontSize:12, fontWeight:600, color:dec.includes("❌")?"#f43f5e":dec.includes("Too")?"#f59e0b":dec.startsWith("✓")?T.accentG:T.accentB }}>{dec}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── COLOUR SCIENCE SECTION ───────────────────────────────────────────────────
function SectionColor() {
  return (
    <div>
      <SectionTitle icon="◐" title="Colour Science — LAB + KMeans++"
        sub="Perceptual colour extraction and HSV harmony scoring. All local — no external APIs."/>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:16 }}>
        <div style={{ background:T.card, borderRadius:12, padding:"20px", border:`1px solid ${T.border}`,
          boxShadow:"0 1px 3px rgba(0,0,0,0.08)" }}>
          <div style={{ fontWeight:700, fontSize:14, color:T.text, marginBottom:12 }}>Why CIELAB not RGB?</div>
          {[
            ["RGB","Display format only","❌ Non-perceptual distance"],
            ["HSV","Good for harmony rules","⚠ Poor for clustering"],
            ["CIELAB","Perceptual uniform","✓ ΔE = human perception"],
          ].map(([space,use,verdict],i)=>(
            <div key={space} style={{ display:"grid", gridTemplateColumns:"60px 1fr 1fr",
              padding:"8px 0", borderBottom:"1px solid rgba(0,0,0,0.05)",
              fontSize:12, color:i===2?T.accentG:i===1?T.accentY:T.muted }}>
              <span style={{ fontFamily:"monospace", fontWeight:700 }}>{space}</span>
              <span style={{ color:T.muted }}>{use}</span>
              <span style={{ fontWeight:600 }}>{verdict}</span>
            </div>
          ))}
          <div style={{ marginTop:12, padding:12, background:"#0f0f1a", borderRadius:8 }}>
            <div style={{ fontFamily:"monospace", fontSize:12, color:"#bd93f9", textAlign:"center", lineHeight:2 }}>
              ΔE = √((ΔL*)² + (Δa*)² + (Δb*)²)
            </div>
            <div style={{ fontFamily:"monospace", fontSize:11, color:"#6272a4", textAlign:"center" }}>
              ΔE &lt; 2 → indistinguishable to human eye
            </div>
          </div>
        </div>
        <div style={{ background:T.card, borderRadius:12, padding:"20px", border:`1px solid ${T.border}`,
          boxShadow:"0 1px 3px rgba(0,0,0,0.08)" }}>
          <div style={{ fontWeight:700, fontSize:14, color:T.text, marginBottom:12 }}>Colour Harmony Rules (HSV)</div>
          {[
            {rule:"Complementary",range:"155–205°",score:"1.00",color:T.accentG},
            {rule:"Split-Comp",range:"140–155° / 205–220°",score:"0.90",color:T.accentG},
            {rule:"Triadic",range:"105–140°",score:"0.82",color:T.accentY},
            {rule:"Neutral + Vivid",range:"S<18% + S>60%",score:"0.80",color:T.accentY},
            {rule:"Analogous",range:"25–60°",score:"0.72",color:T.accentB},
            {rule:"Clash Zone",range:"60–105°",score:"0.25",color:T.accentR},
          ].map(h=>(
            <div key={h.rule} style={{ display:"flex", justifyContent:"space-between",
              padding:"6px 0", borderBottom:"1px solid rgba(0,0,0,0.05)", fontSize:12 }}>
              <span style={{ color:T.text, fontWeight:500 }}>{h.rule}</span>
              <span style={{ color:T.muted, fontFamily:"monospace" }}>{h.range}</span>
              <span style={{ fontFamily:"monospace", fontWeight:700, color:h.color }}>{h.score}</span>
            </div>
          ))}
        </div>
      </div>

      <CodeBlock title="backend/ai/color_extractor.py" code={`"""
color_extractor.py — Perceptual colour extraction.

Pipeline:
  raw bytes → OpenCV decode → resize 150x150
  → BGR→LAB conversion → filter background pixels
  → KMeans++(k=5) in LAB space → sort by cluster size
  → convert dominant centroid: LAB→BGR→RGB + RGB→HSV
"""
import cv2, numpy as np, colorsys
from sklearn.cluster import KMeans

K_CLUSTERS = 5

def _bgr_to_hsv_float(b, g, r) -> list:
    """Convert BGR (0-255) → HSV (H:0-360, S:0-100, V:0-100)."""
    h, s, v = colorsys.rgb_to_hsv(r/255, g/255, b/255)
    return [round(h*360, 1), round(s*100, 1), round(v*100, 1)]

def _lab_to_rgb(l_val, a_val, b_val) -> list:
    """Convert single LAB point back to RGB (0-255 ints)."""
    # OpenCV expects float LAB in specific ranges
    lab_px = np.array([[[l_val, a_val, b_val]]], dtype=np.float32)
    bgr     = cv2.cvtColor(lab_px, cv2.COLOR_LAB2BGR)
    b, g, r = (bgr[0, 0] * 255).clip(0, 255).astype(int)
    return [int(r), int(g), int(b)]   # return RGB

def extract_colors(image_bytes: bytes) -> dict:
    """
    Extract dominant colours using KMeans++ in CIELAB space.

    Returns:
        {
          "primary_color":    [r, g, b],
          "secondary_colors": [[r,g,b], [r,g,b]],
          "primary_hsv":      [h, s, v],
          "delta_e_spread":   float    # palette diversity score
        }
    """
    # Decode image
    nparr = np.frombuffer(image_bytes, np.uint8)
    bgr   = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if bgr is None:
        return {
            "primary_color":    [128, 128, 128],
            "secondary_colors": [],
            "primary_hsv":      [0, 0, 50],
            "delta_e_spread":   0.0,
        }

    # Resize to 150×150 for speed — enough colour info retained
    bgr = cv2.resize(bgr, (150, 150), interpolation=cv2.INTER_AREA)

    # Convert BGR → CIELAB (OpenCV needs float32 input)
    bgr_f  = bgr.astype(np.float32) / 255.0
    lab    = cv2.cvtColor(bgr_f, cv2.COLOR_BGR2LAB)
    pixels = lab.reshape(-1, 3)   # shape: (22500, 3)

    # Filter background: L* < 5 (near-black) or L* > 97 (near-white)
    L        = pixels[:, 0]
    filtered = pixels[(L > 5) & (L < 97)]
    if len(filtered) < 100:
        filtered = pixels   # fallback if image is all-white

    # KMeans++ in LAB space
    km = KMeans(
        n_clusters   = min(K_CLUSTERS, len(filtered)),
        init         = "k-means++",   # better init than random
        n_init       = 10,            # run 10x, pick best
        random_state = 42,
    )
    km.fit(filtered)

    # Sort clusters by count — largest = dominant colour
    counts     = np.bincount(km.labels_)
    sorted_idx = np.argsort(-counts)
    centers    = km.cluster_centers_[sorted_idx]

    # Convert top-3 LAB centroids → RGB
    rgb_list = [_lab_to_rgb(*c) for c in centers[:3]]
    primary   = rgb_list[0]
    secondary = rgb_list[1:]

    # Primary colour → HSV for harmony scoring
    pr, pg, pb = primary
    hsv = _bgr_to_hsv_float(pb, pg, pr)   # note: _bgr_to_hsv expects B,G,R

    # Delta-E spread: measures how diverse the palette is
    if len(centers) >= 2:
        delta_e = float(np.mean([
            np.linalg.norm(centers[0] - centers[i])
            for i in range(1, min(3, len(centers)))
        ]))
    else:
        delta_e = 0.0

    return {
        "primary_color":    primary,
        "secondary_colors": secondary,
        "primary_hsv":      hsv,
        "delta_e_spread":   round(delta_e, 2),
    }`}/>
    </div>
  );
}

// ─── BACKEND SECTION ─────────────────────────────────────────────────────────
function SectionBackend() {
  const [tab, setTab] = useState("app");
  const files = {
    app: { label:"app.py", code:`"""
app.py — Flask application factory.

Windows note: debug=True with use_reloader=False prevents
the APScheduler from starting twice (Windows fork issue).
"""
import logging
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from routes.auth import auth_bp
from routes.clothes import clothes_bp
from routes.classify import classify_bp
from routes.calendar_sync import calendar_bp
from routes.planner import planner_bp
from scheduler import init_scheduler

# Configure logging (write to logs/wardrobeai.log)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler("logs/wardrobeai.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Extensions
    CORS(app,
         resources={r"/api/*": {"origins": Config.FRONTEND_URL}},
         supports_credentials=True)
    JWTManager(app)

    # Blueprints
    for bp, prefix in [
        (auth_bp,     "/api/auth"),
        (clothes_bp,  "/api/clothes"),
        (classify_bp, "/api"),
        (calendar_bp, "/api/calendar"),
        (planner_bp,  "/api"),
    ]:
        app.register_blueprint(bp, url_prefix=prefix)

    # Error handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(500)
    def server_error(e):
        logger.error(f"Server error: {e}")
        return jsonify({"error": "Internal server error"}), 500

    return app

app = create_app()
init_scheduler(app)   # start APScheduler after app is created

if __name__ == "__main__":
    # use_reloader=False: critical on Windows — prevents APScheduler
    # from starting twice due to the reloader's subprocess model
    app.run(
        debug=True,
        host="0.0.0.0",
        port=5000,
        use_reloader=False    # IMPORTANT for Windows
    )` },
    classify: { label:"routes/classify.py", code:`from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ai.classifier import classify_image          # local model
from ai.color_extractor import extract_colors     # local model
from ai.occasion_tagger import get_occasion_tags
from utils.storage import upload_image
from models import clothes, new_cloth
import requests, logging

logger = logging.getLogger(__name__)
classify_bp = Blueprint("classify", __name__)

@classify_bp.route("/classify", methods=["POST"])
@jwt_required()
def classify():
    """
    Full AI pipeline:
      1. Receive image (file upload or URL)
      2. Upload to Cloudinary
      3. classify_image()   → local MobileNetV2
      4. extract_colors()   → local LAB KMeans++
      5. get_occasion_tags()
      6. Store in MongoDB
      7. Return full result
    """
    uid = get_jwt_identity()
    logger.info(f"[classify] Request from user {uid[:8]}...")

    # Accept multipart OR JSON URL
    if "file" in request.files:
        img_bytes = request.files["file"].read()
        image_url = upload_image(img_bytes)
    elif request.is_json and request.json.get("image_url"):
        resp      = requests.get(request.json["image_url"], timeout=10)
        img_bytes = resp.content
        image_url = request.json["image_url"]
    else:
        return jsonify({"error": "Provide 'file' field or JSON 'image_url'"}), 400

    # Sequential AI pipeline — NO fallbacks
    cls    = classify_image(img_bytes)     # step 1: classify
    colors = extract_colors(img_bytes)     # step 2: color extraction
    tags   = get_occasion_tags(            # step 3: occasion tagging
        cls["type"], colors["primary_hsv"]
    )

    logger.info(f"[classify] type={cls['type']} conf={cls['confidence']:.2%} "
                f"color={colors['primary_color']}")

    doc = new_cloth(
        user_id          = uid,
        image_url        = image_url,
        cloth_type       = cls["type"],
        primary_color    = colors["primary_color"],
        secondary_colors = colors["secondary_colors"],
        primary_hsv      = colors["primary_hsv"],
        delta_e_spread   = colors["delta_e_spread"],
        occasion_tags    = tags,
        confidence       = cls["confidence"],
        top3             = cls["top3"],
    )
    result = clothes.insert_one(doc)

    return jsonify({
        "id":               str(result.inserted_id),
        "type":             cls["type"],
        "confidence":       cls["confidence"],
        "top3":             cls["top3"],
        "primary_color":    colors["primary_color"],
        "secondary_colors": colors["secondary_colors"],
        "primary_hsv":      colors["primary_hsv"],
        "delta_e_spread":   colors["delta_e_spread"],
        "occasion_tags":    tags,
        "image_url":        image_url,
    }), 201` },
  };
  return (
    <div>
      <SectionTitle icon="□" title="Backend (Flask)" sub="Clean modular Flask architecture with sequential AI pipeline and structured logging."/>
      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {Object.entries(files).map(([k,f])=>(
          <button key={k} onClick={()=>setTab(k)}
            style={{ padding:"7px 16px", borderRadius:8, border:"none",
              background: tab===k?T.sidebar:T.card, color:tab===k?"white":T.muted,
              fontSize:12, fontWeight:600, cursor:"pointer",
              fontFamily:"monospace", boxShadow:"0 1px 3px rgba(0,0,0,0.08)" }}>
            {f.label}
          </button>
        ))}
      </div>
      <CodeBlock title={files[tab].label} code={files[tab].code}/>
    </div>
  );
}

// ─── SCHEDULER SECTION ────────────────────────────────────────────────────────
function SectionScheduler() {
  return (
    <div>
      <SectionTitle icon="◷" title="APScheduler — Robust Task Scheduler"
        sub="Production-grade scheduler with retry logic, logging, and Windows compatibility."/>
      <InfoBox type="warn">
        On Windows, always start Flask with use_reloader=False when using APScheduler. Without this, the scheduler starts twice because of how Windows handles process forking — you'll see duplicate logs and doubled task executions.
      </InfoBox>
      <CodeBlock title="backend/scheduler.py" code={`"""
scheduler.py — APScheduler with retry, logging, and Windows compatibility.

Windows-specific notes:
  - use_reloader=False in app.run() is MANDATORY
  - timezone="UTC" avoids Windows DST/timezone edge cases
  - max_instances=1 prevents overlapping runs on slow systems

Jobs:
  - reset_weekly_counters: every Monday 00:05 UTC
  - cleanup_orphaned_images: every Sunday 02:00 UTC
  - model_health_check: every day 06:00 UTC
"""
import logging
from datetime import datetime, timezone
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.events import EVENT_JOB_EXECUTED, EVENT_JOB_ERROR
from apscheduler.jobstores.memory import MemoryJobStore
from apscheduler.executors.pool import ThreadPoolExecutor
from models import users, clothes

logger = logging.getLogger(__name__)

# ── Scheduler config ──────────────────────────────────────────────
jobstores  = {"default": MemoryJobStore()}
executors  = {"default": ThreadPoolExecutor(max_workers=2)}
job_defaults = {
    "coalesce":      True,   # if missed, run once (not multiple times)
    "max_instances": 1,      # prevent overlap on slow systems
    "misfire_grace_time": 300,  # 5 min grace window for misfires
}

scheduler = BackgroundScheduler(
    jobstores   = jobstores,
    executors   = executors,
    job_defaults= job_defaults,
    timezone    = "UTC",      # UTC avoids Windows DST issues
)

# ── Event listener — logs successes and failures ──────────────────
def job_listener(event):
    if event.exception:
        logger.error(
            f"[scheduler] Job '{event.job_id}' FAILED: {event.exception}\\n"
            f"  Traceback: {event.traceback}"
        )
    else:
        logger.info(
            f"[scheduler] Job '{event.job_id}' completed. "
            f"Retval: {event.retval}"
        )

scheduler.add_listener(job_listener, EVENT_JOB_EXECUTED | EVENT_JOB_ERROR)

# ── Job 1: Reset weekly outfit counters ──────────────────────────
def reset_weekly_counters():
    """Reset free-tier plan counter every Monday at midnight UTC."""
    now = datetime.now(timezone.utc)
    if now.weekday() != 0:   # 0 = Monday
        return "Skipped (not Monday)"
    result = users.update_many(
        {},
        {"$set": {
            "outfits_this_week": 0,
            "week_reset_date":   now
        }}
    )
    msg = f"Reset {result.modified_count} users' weekly counters."
    logger.info(f"[scheduler:reset] {msg}")
    return msg

# ── Job 2: Cleanup orphaned image records ─────────────────────────
def cleanup_orphaned_records():
    """Remove clothing records with broken image URLs."""
    orphans = clothes.find({"image_url": {"$in": [None, "", "undefined"]}})
    ids     = [doc["_id"] for doc in orphans]
    if ids:
        result = clothes.delete_many({"_id": {"$in": ids}})
        msg = f"Removed {result.deleted_count} orphaned records."
    else:
        msg = "No orphaned records found."
    logger.info(f"[scheduler:cleanup] {msg}")
    return msg

# ── Job 3: Model health check ─────────────────────────────────────
def model_health_check():
    """Verify model is still loaded and responding."""
    try:
        import io
        import torch
        from ai.classifier import MODEL, INFER_TF
        from PIL import Image

        # Create a tiny test image (1x1 white pixel)
        img   = Image.new("RGB", (224, 224), color=(255, 255, 255))
        buf   = io.BytesIO()
        img.save(buf, format="JPEG")
        buf.seek(0)
        tensor = INFER_TF(img).unsqueeze(0)
        with torch.no_grad():
            out = MODEL(tensor)
        msg = f"Model OK — output shape: {out.shape}"
    except Exception as e:
        msg = f"Model health check FAILED: {e}"
        logger.error(f"[scheduler:health] {msg}")
    logger.info(f"[scheduler:health] {msg}")
    return msg

# ── Register all jobs ─────────────────────────────────────────────
def init_scheduler(app):
    """Call this from app.py after creating the Flask app."""
    scheduler.add_job(
        func        = reset_weekly_counters,
        trigger     = "cron",
        id          = "reset_weekly",
        day_of_week = "mon",
        hour        = 0, minute = 5,
        replace_existing = True,
    )
    scheduler.add_job(
        func        = cleanup_orphaned_records,
        trigger     = "cron",
        id          = "cleanup_orphans",
        day_of_week = "sun",
        hour        = 2, minute = 0,
        replace_existing = True,
    )
    scheduler.add_job(
        func        = model_health_check,
        trigger     = "cron",
        id          = "model_health",
        hour        = 6, minute = 0,
        replace_existing = True,
    )
    scheduler.start()
    logger.info("[scheduler] APScheduler started. Jobs registered: "
                + str([j.id for j in scheduler.get_jobs()]))`}/>
    </div>
  );
}

// ─── FRONTEND CODE SECTION ────────────────────────────────────────────────────
function SectionFrontend() {
  return (
    <div>
      <SectionTitle icon="◈" title="Dashboard UI — Mono Theme"
        sub="React + Vite + TailwindCSS. Dark sidebar like Image 2, analytics cards like Image 1."/>

      <InfoBox type="tip">
        The frontend uses recharts for charts (same library used in this guide). All charts are responsive and re-render on window resize. The dark sidebar is fixed, content scrolls independently — matching the MONO dashboard layout.
      </InfoBox>

      <CodeBlock title="frontend/src/pages/Dashboard.jsx" code={`import { useState, useEffect } from "react";
import {
  BarChart, Bar, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import api from "../api/axiosClient";
import ClothCard from "../components/ClothCard";

// Mono-style stat card with sparkline
function StatCard({ title, value, change, data, color }) {
  const up = change?.startsWith("+");
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
        {change && (
          <span className={\`text-xs font-semibold px-2 py-1 rounded-full \${
            up ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
          }\`}>
            {up ? "▲" : "▼"} {change}
          </span>
        )}
      </div>
      {data && (
        <ResponsiveContainer width="100%" height={56}>
          <AreaChart data={data.map((v,i) => ({ i, v }))}>
            <defs>
              <linearGradient id={\`g\${color.replace("#","")}\`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2}
              fill={\`url(#g\${color.replace("#","")})\`} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats]         = useState(null);
  const [typeData, setTypeData]   = useState([]);
  const [trending, setTrending]   = useState([]);

  useEffect(() => {
    api.get("/clothes/stats").then(({ data }) => {
      setStats(data);
      setTypeData(data.type_distribution || []);
      setTrending(data.usage_trend || []);
    }).catch(console.error);
  }, []);

  const COLORS = ["#6366f1","#3b82f6","#a855f7","#22c55e","#f59e0b","#f43f5e"];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Stat cards — 4 across like MONO dashboard */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Clothes"
          value={stats?.total ?? "—"}
          change={stats?.total_change}
          data={[12,18,22,19,28,31,26,35]}
          color="#6366f1" />
        <StatCard title="Outfits This Week"
          value={stats?.outfits_this_week ?? "—"}
          change="+3"
          data={[5,8,7,12,11,15,13,18]}
          color="#22c55e" />
        <StatCard title="CNN Accuracy"
          value={\`\${stats?.model_acc ?? 84}%\`}
          change="+2.1%"
          data={[71,74,76,79,81,83,85,87]}
          color="#a855f7" />
        <StatCard title="Colour Accuracy"
          value={\`\${stats?.color_acc ?? 96.2}%\`}
          change="+0.8%"
          data={[88,91,93,90,95,94,96,98]}
          color="#3b82f6" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="col-span-2 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Clothing Type Distribution
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={typeData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="type" tick={{ fontSize:11, fill:"#9ca3af" }}
                axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:11, fill:"#9ca3af" }}
                axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius:8, border:"none",
                boxShadow:"0 4px 20px rgba(0,0,0,0.12)", fontSize:12 }} />
              <Bar dataKey="count" radius={[6,6,0,0]}>
                {typeData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Usage Trend
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trending}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize:11, fill:"#9ca3af" }}
                axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:11, fill:"#9ca3af" }}
                axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius:8, border:"none",
                boxShadow:"0 4px 20px rgba(0,0,0,0.12)", fontSize:12 }} />
              <Line type="monotone" dataKey="outfits"
                stroke="#a855f7" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}`}/>
    </div>
  );
}

// ─── SCHEDULE SECTION ─────────────────────────────────────────────────────────
const SCHED_DATA = [
  { day:"Day 0",  title:"Windows 11 Setup",            color:"#151521", tasks:["Install Python 3.11 (tick PATH in installer)","Install Node.js 20 LTS","Install Windows Terminal from Microsoft Store","Create project folder structure","Set up venv and install PyTorch CPU wheel","Verify: python -c \"import torch; print(torch.__version__)\""]},
  { day:"Days 1–2",title:"Data Pipeline + Training",  color:"#0D6B40", tasks:["Download DeepFashion Category Benchmark subset","Run build_dataset.py — creates train/val/test with NUM_WORKERS=0","Upload data to Google Colab (free GPU) for training","Run train_classifier.py on Colab GPU (~45 min)","Download best_checkpoint.pt from Colab","Run export_model.py locally → clothing_classifier.pt"]},
  { day:"Day 3",  title:"Colour Extractor + NLP",      color:"#4A1F8A", tasks:["Write color_extractor.py — LAB KMeans++ pipeline","Test: python -c \"from ai.color_extractor import extract_colors\"","Write occasion_detector.py — sentence-transformers","Test 10 sample event titles (see Section 6)","Write occasion_tagger.py — fallback rule-based tagger"]},
  { day:"Day 4",  title:"Auth + Storage Backend",      color:"#1A3A8A", tasks:["Write config.py, models.py, app.py","Write routes/auth.py: register, login, refresh, /me","Write utils/storage.py — Cloudinary upload wrapper","Test with Windows Terminal: curl localhost:5000/api/auth/register","Verify JWT protected routes work"]},
  { day:"Day 5",  title:"Classify + CRUD Routes",      color:"#0A7B6A", tasks:["Write routes/classify.py — full AI pipeline","Write routes/clothes.py — GET/DELETE wardrobe","Test: upload a shirt photo → verify type, colour, tags","Test: upload non-clothing → type='unknown'","Add structured logging to all routes"]},
  { day:"Day 6",  title:"Google Calendar + APScheduler",color:"#9A6E00",tasks:["Google Cloud Console: enable Calendar API","Write routes/calendar_sync.py — OAuth2 flow","Write scheduler.py with all 3 jobs","Test APScheduler with use_reloader=False","Test calendar sync returns events with NLP occasions"]},
  { day:"Day 7",  title:"Outfit Planning Algorithm",   color:"#B84A00", tasks:["Write ai/outfit_scorer.py — scoring engine","Write routes/planner.py — GET /api/plan","Test 6-item wardrobe → 7 outfits generated","Test formal calendar event → formal-tagged outfit","Test score for complementary colours ≈ 1.00"]},
  { day:"Days 8–9",title:"React + Mono Dashboard UI",  color:"#6366f1", tasks:["npx create vite@latest frontend -- --template react","npm install tailwindcss recharts axios react-dropzone lucide-react","Write Mono dark sidebar (fixed, 240px)","Write StatCard components with sparklines","Write Wardrobe page with drag-drop upload + AI predictions","Write Planner page with 7-column week grid"]},
  { day:"Days 10–11",title:"Integration + Testing",   color:"#f43f5e", tasks:["Run all 10 acceptance tests","Test full user journey: register → upload → sync → plan","Fix CORS issues (common on Windows localhost)","Add loading/error states to all pages","Test APScheduler weekly reset job manually"]},
  { day:"Days 12–13",title:"Deploy Render + Vercel",  color:"#1A3A8A", tasks:["Create Procfile: gunicorn app:app --workers 2","Create render.yaml — set CPU-only torch build command","Vercel: connect /frontend, Vite preset","Add all .env variables to Render dashboard","Run test_deploy.sh — all 5 checks pass"]},
  { day:"Days 14–15",title:"Polish + Documentation",  color:"#0A7B6A", tasks:["Write README.md with Windows setup guide","Add docstrings to all AI modules","Record 3-minute demo video","Final code review and cleanup","Submit major project package"]},
];

function SectionSchedule({ checked, setChecked }) {
  const total = SCHED_DATA.reduce((s,p)=>s+p.tasks.length,0);
  const done  = Object.values(checked).filter(Boolean).length;
  const pct   = Math.round((done/total)*100);

  return (
    <div>
      <SectionTitle icon="▦" title="15-Day Build Schedule" sub="Windows 11 optimised. Google Colab for training, local for everything else."/>
      <div style={{ background:T.card, borderRadius:12, padding:"16px 24px",
        border:`1px solid ${T.border}`, boxShadow:"0 1px 3px rgba(0,0,0,0.08)",
        display:"flex", alignItems:"center", gap:20, marginBottom:20 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:12, color:T.muted, marginBottom:6 }}>Overall completion</div>
          <div style={{ height:8, borderRadius:99, background:"rgba(0,0,0,0.06)", overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${pct}%`, borderRadius:99,
              background:`linear-gradient(90deg,${T.accent},${T.accentG})`,
              transition:"width 0.4s" }}/>
          </div>
        </div>
        <div style={{ fontSize:30, fontWeight:800, color:T.accent, fontVariantNumeric:"tabular-nums" }}>{pct}<span style={{ fontSize:18 }}>%</span></div>
        <div style={{ fontSize:13, color:T.muted }}>{done}/{total} tasks</div>
      </div>

      {SCHED_DATA.map((phase,pi)=>{
        const phaseDone = phase.tasks.filter((_,ti)=>checked[`${pi}-${ti}`]).length;
        const allDone = phaseDone===phase.tasks.length;
        return (
          <div key={pi} style={{ marginBottom:10, borderRadius:10, overflow:"hidden",
            border:`1px solid ${phase.color}35`,
            boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12,
              padding:"12px 16px", background:phase.color }}>
              <div style={{ fontFamily:"monospace", fontSize:11, color:"rgba(255,255,255,0.7)", minWidth:60 }}>{phase.day}</div>
              <div style={{ fontWeight:700, fontSize:13, color:"white", flex:1 }}>{phase.title}</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.7)", fontFamily:"monospace" }}>{phaseDone}/{phase.tasks.length}</div>
              {allDone && <span style={{ fontSize:14 }}>✓</span>}
            </div>
            <div style={{ background:"white" }}>
              {phase.tasks.map((task,ti)=>{
                const k = `${pi}-${ti}`;
                const isDone = !!checked[k];
                return (
                  <div key={ti} onClick={()=>setChecked(p=>({...p,[k]:!p[k]}))}
                    style={{ display:"flex", alignItems:"flex-start", gap:10,
                      padding:"9px 16px", cursor:"pointer",
                      background: isDone?"#f9fafb":"white",
                      borderTop:"1px solid rgba(0,0,0,0.04)",
                      transition:"background 0.15s" }}>
                    <div style={{ width:17, height:17, borderRadius:4, flexShrink:0, marginTop:1,
                      border:`2px solid ${isDone?phase.color:"rgba(0,0,0,0.15)"}`,
                      background: isDone?`${phase.color}20`:"white",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      transition:"all 0.2s" }}>
                      {isDone && <span style={{ fontSize:10, color:phase.color, fontWeight:800 }}>✓</span>}
                    </div>
                    <span style={{ fontSize:12, color:isDone?"#9ca3af":"#374151",
                      textDecoration:isDone?"line-through":"none", lineHeight:1.5 }}>
                      {task}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── TESTS SECTION ────────────────────────────────────────────────────────────
function SectionTests() {
  const [passed, setPassed] = useState({});
  const tests = [
    { scenario:"Upload blue shirt photo", expected:"type='shirt', confidence > 0.70, primary_color ≈ [30,100,180]", module:"MobileNetV2 + KMeans++ LAB" },
    { scenario:"Upload dark navy trousers", expected:"type='pants', saturation < 30, occasion_tags: formal", module:"Classifier + Color extractor" },
    { scenario:"Upload non-clothing (food/book)", expected:"type='unknown', confidence < 0.65, no exception", module:"Confidence threshold" },
    { scenario:"Calendar: 'Board meeting with investors'", expected:"occasion='formal', confidence > 0.75", module:"Sentence-Transformer NLP" },
    { scenario:"Calendar: 'Yoga class at 7am'", expected:"occasion='athletic', confidence > 0.85", module:"Sentence-Transformer NLP" },
    { scenario:"Calendar: 'Stand-up paddle boarding'", expected:"occasion='athletic' (not 'formal')", module:"NLP semantic understanding" },
    { scenario:"Generate plan — formal Monday event", expected:"Monday outfit uses formal-tagged clothes, score > 0.75", module:"Outfit scorer + Planner" },
    { scenario:"Blue shirt + orange trousers", expected:"color_contrast_score ≈ 1.00 (complementary, Δhue ≈ 180°)", module:"HSV harmony algorithm" },
    { scenario:"APScheduler — weekly reset", expected:"outfits_this_week = 0 every Monday, logged to file", module:"APScheduler + MongoDB" },
    { scenario:"Same item on consecutive days", expected:"Planner avoids repeating item in 2-day window", module:"Variety scorer" },
  ];
  const doneCt = Object.values(passed).filter(Boolean).length;
  return (
    <div>
      <SectionTitle icon="✓" title="Tests & Acceptance Criteria" sub="All 10 tests must pass before project submission."/>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
        {[
          {l:"Total Tests",v:10,c:T.accent},{l:"Classifier",v:3,c:T.accentP},
          {l:"NLP / Calendar",v:3,c:T.accentB},{l:"Algorithm",v:4,c:T.accentG},
        ].map(m=>(
          <div key={m.l} style={{ background:T.card, borderRadius:10, padding:"14px 18px",
            border:`1px solid ${m.c}25`, boxShadow:"0 1px 3px rgba(0,0,0,0.06)", textAlign:"center" }}>
            <div style={{ fontSize:28, fontWeight:800, color:m.c }}>{m.v}</div>
            <div style={{ fontSize:11, color:T.muted, marginTop:4, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>{m.l}</div>
          </div>
        ))}
      </div>

      <div style={{ background:T.card, borderRadius:12, overflow:"hidden",
        border:`1px solid ${T.border}`, boxShadow:"0 1px 3px rgba(0,0,0,0.08)", marginBottom:20 }}>
        <div style={{ display:"grid", gridTemplateColumns:"36px 1fr 1fr 1fr 100px",
          background:T.sidebar, padding:"10px 16px", gap:12 }}>
          {["#","Scenario","Expected","Module","Status"].map(h=>(
            <div key={h} style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.05em" }}>{h}</div>
          ))}
        </div>
        {tests.map((t,i)=>{
          const ok = !!passed[i];
          return (
            <div key={i} style={{ display:"grid", gridTemplateColumns:"36px 1fr 1fr 1fr 100px",
              padding:"11px 16px", gap:12, alignItems:"center",
              background: ok?`${T.accentG}06`:i%2===0?"white":"#fafafa",
              borderTop:"1px solid rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize:12, fontWeight:700, color:T.muted, fontFamily:"monospace" }}>#{i+1}</div>
              <div style={{ fontSize:12, color:T.text }}>{t.scenario}</div>
              <div style={{ fontSize:11, color:T.muted, fontFamily:"monospace" }}>{t.expected}</div>
              <Tag color={T.accentP}>{t.module}</Tag>
              <button onClick={()=>setPassed(p=>({...p,[i]:!p[i]}))}
                style={{ background: ok?`${T.accentG}15`:"rgba(0,0,0,0.04)",
                  border:`1px solid ${ok?T.accentG:"rgba(0,0,0,0.1)"}`,
                  borderRadius:6, padding:"5px 10px", cursor:"pointer",
                  fontSize:11, color:ok?T.accentG:T.muted, fontWeight:ok?700:400 }}>
                {ok?"✓ passed":"mark pass"}
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ background:T.card, borderRadius:12, padding:"20px 24px",
        border:`1px solid ${T.border}`, boxShadow:"0 1px 3px rgba(0,0,0,0.08)" }}>
        <div style={{ fontWeight:700, fontSize:14, color:T.text, marginBottom:14 }}>Model Performance Benchmarks</div>
        {[
          ["Overall Accuracy","≥72%","≥82%","Extend Phase 2 to 25 epochs"],
          ["Weighted F1","≥0.70","≥0.80","Add class weights in loss"],
          ["Colour ΔE Error","< 8","< 4","Increase n_init=20, K=7"],
          ["NLP Occasion Accuracy","80%","90%","Add canonical descriptions"],
          ["APScheduler Job Reliability","95%","99%","Add retry + misfire window"],
        ].map(([m,min,tgt,fix],i)=>(
          <div key={m} style={{ display:"grid", gridTemplateColumns:"180px 80px 80px 1fr",
            padding:"9px 0", borderBottom:"1px solid rgba(0,0,0,0.05)", fontSize:12 }}>
            <span style={{ fontWeight:600, color:T.text }}>{m}</span>
            <span style={{ fontFamily:"monospace", color:T.accentR, fontWeight:600 }}>{min}</span>
            <span style={{ fontFamily:"monospace", color:T.accentG, fontWeight:600 }}>{tgt}</span>
            <span style={{ color:T.muted }}>{fix}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── NLP OCCASION DETECTOR ───────────────────────────────────────────────────
function SectionNLP() {
  const [tab, setTab] = useState("detector");
  const files = {
    detector: { label:"occasion_detector.py", code:`"""
occasion_detector.py — Sentence-transformer semantic occasion detection.

Model: all-MiniLM-L6-v2 (22M params, ~80MB)
Downloaded once to: C:\\Users\\YourName\\.cache\\torch\\sentence_transformers\\
After first download, works fully offline (no internet needed).

Method:
  1. Pre-compute averaged canonical embeddings per occasion at startup.
  2. At inference: one forward pass → cosine similarity vs each occasion.
  3. argmax → predicted occasion.
"""
import numpy as np
from sentence_transformers import SentenceTransformer
import logging

logger = logging.getLogger(__name__)

# Model downloaded once, then cached locally — runs offline after
logger.info("[nlp] Loading sentence-transformer (first run downloads ~80MB)...")
_MODEL = SentenceTransformer("all-MiniLM-L6-v2")
logger.info("[nlp] Sentence-transformer ready.")

# Canonical descriptions per occasion — more descriptions = better coverage
OCCASIONS = {
    "formal": [
        "business meeting with colleagues or clients at work",
        "job interview or professional presentation",
        "board meeting, conference call, corporate event",
        "performance review, one-on-one with manager",
        "client pitch, investor meeting, networking event",
        "office standup, sprint planning, team sync",
        "video call, zoom meeting, virtual conference",
    ],
    "semi-formal": [
        "dinner at a restaurant with friends or family",
        "birthday party, celebration, social gathering",
        "wedding ceremony, graduation, formal social event",
        "first date, romantic dinner, anniversary",
        "gallery opening, theatre, concert, cultural event",
        "networking drinks, after-work social",
    ],
    "casual": [
        "lunch with a friend, coffee catch-up",
        "grocery shopping, running errands, casual outing",
        "picnic, outdoor leisure activity in the park",
        "movie night, relaxed social hangout at home",
        "visiting family, weekend brunch, afternoon walk",
    ],
    "athletic": [
        "gym workout, weightlifting session, fitness class",
        "yoga class, pilates, stretching, meditation",
        "running, jogging, marathon training outdoors",
        "sports match, football, basketball, tennis",
        "hiking, cycling, swimming, outdoor adventure",
        "crossfit, HIIT training, boot camp session",
        "stand-up paddle boarding, water sports, beach workout",
    ],
}

# Pre-compute averaged canonical embeddings at module load
_EMBEDDINGS: dict = {}
for occ, descs in OCCASIONS.items():
    embs = _MODEL.encode(descs, normalize_embeddings=True)
    avg  = np.mean(embs, axis=0)
    norm = np.linalg.norm(avg)
    _EMBEDDINGS[occ] = avg / (norm + 1e-8)   # L2-normalised average
logger.info(f"[nlp] Canonical embeddings ready for: {list(_EMBEDDINGS.keys())}")

def detect_occasion(title: str, description: str = "") -> dict:
    """
    Detect the occasion from a calendar event title (+ optional description).

    Args:
        title:       Event title, e.g. "Stand-up meeting with team"
        description: Optional longer text from calendar event body

    Returns:
        {
          "occasion":   str,   # "formal" | "semi-formal" | "casual" | "athletic"
          "confidence": float, # cosine similarity to winning occasion
          "scores":     dict   # all four scores for debugging
        }
    """
    text = title.strip()
    if description:
        text += ". " + description.strip()[:200]   # cap at 200 chars

    # Single forward pass on CPU — ~15ms on i5-12th gen
    emb = _MODEL.encode([text], normalize_embeddings=True)[0]

    # Dot product == cosine similarity (both vectors are L2-normalised)
    scores = {
        occ: float(np.dot(emb, canonical))
        for occ, canonical in _EMBEDDINGS.items()
    }

    best_occ  = max(scores, key=scores.get)
    best_conf = scores[best_occ]

    # Low-confidence fallback to casual (not "unknown")
    if best_conf < 0.28:
        best_occ = "casual"

    return {
        "occasion":   best_occ,
        "confidence": round(best_conf, 4),
        "scores":     {k: round(v, 4) for k, v in scores.items()},
    }` },
    tagger: { label:"occasion_tagger.py", code:`"""
occasion_tagger.py — Rule-based occasion tagger from clothing type + colour.
Used when no calendar is connected (local fallback inside the app).
Does NOT fall back on classification — type must be a real classified type.
"""

TYPE_OCCASIONS = {
    "shirt":       ["casual", "semi-formal"],
    "formal_top":  ["formal", "business"],
    "tshirt":      ["casual", "athletic"],
    "dress":       ["casual", "semi-formal", "formal"],
    "pants":       ["casual", "semi-formal", "formal"],
    "shorts":      ["casual", "athletic"],
    "skirt":       ["casual", "semi-formal"],
    "outerwear":   ["casual", "formal", "business"],
    "activewear":  ["athletic"],
    "shoes":       ["casual"],
    "bag":         ["casual"],
    "accessories": ["casual"],
    "unknown":     ["casual"],
}

def _color_formality(hsv: list) -> str:
    """Determine formality from HSV (H:0-360, S:0-100, V:0-100)."""
    h, s, v = hsv
    if v < 35 and s < 25:   return "formal"    # dark neutral → formal
    if v < 35:              return "formal"     # dark vivid → formal
    if s > 70 and v > 60:   return "casual"     # vivid bright → casual
    return "neutral"

def get_occasion_tags(cloth_type: str, hsv: list) -> list:
    base      = TYPE_OCCASIONS.get(cloth_type, ["casual"])
    formality = _color_formality(hsv)
    tags      = set(base)

    if formality == "formal":
        tags.add("formal"); tags.add("business"); tags.discard("athletic")
    elif formality == "casual":
        tags.add("casual"); tags.discard("formal"); tags.discard("business")

    # Hard overrides — some types can never be formal
    if cloth_type in ("shoes", "shorts", "activewear", "accessories"):
        tags.discard("formal"); tags.discard("business")
    if cloth_type == "formal_top":
        tags.discard("casual"); tags.discard("athletic")

    return sorted(list(tags))` },
  };

  const examples = [
    { title:"Team meeting with investors",       occ:"formal",      conf:0.821 },
    { title:"Yoga class at 7am",                 occ:"athletic",    conf:0.934 },
    { title:"Tom's birthday dinner",             occ:"semi-formal", conf:0.876 },
    { title:"Catch up with Sarah",               occ:"casual",      conf:0.792 },
    { title:"Interview at Google HQ",            occ:"formal",      conf:0.951 },
    { title:"Evening run in the park",           occ:"athletic",    conf:0.912 },
    { title:"Stand-up paddle boarding trip",     occ:"athletic",    conf:0.778 },
    { title:"Wine tasting event downtown",       occ:"semi-formal", conf:0.741 },
  ];
  const occColor = o => o==="formal"?"#0F2040":o==="athletic"?"#0D6B40":o==="semi-formal"?"#9A6E00":"#1A3A8A";

  return (
    <div>
      <SectionTitle icon="◇" title="NLP Occasion Detector"
        sub="Sentence-transformer semantic embeddings. Understands meaning — not just keywords. Runs offline after first download."/>

      <InfoBox type="hp">
        all-MiniLM-L6-v2 downloads ~80MB on first run and caches at C:\Users\YourName\.cache\torch\sentence_transformers\. After that it runs fully offline. On your i5-12th gen it takes ~15ms per sentence. Total RAM with model loaded: ~300MB.
      </InfoBox>

      <div style={{ background:T.card, borderRadius:12, overflow:"hidden",
        border:`1px solid ${T.border}`, boxShadow:"0 1px 3px rgba(0,0,0,0.08)", marginBottom:20 }}>
        <div style={{ background:T.sidebar, padding:"10px 16px",
          display:"grid", gridTemplateColumns:"1fr 140px 90px" }}>
          {["Calendar Event Title","Detected Occasion","Confidence"].map(h=>(
            <div key={h} style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.05em" }}>{h}</div>
          ))}
        </div>
        {examples.map((ex,i)=>(
          <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 140px 90px",
            padding:"10px 16px", alignItems:"center",
            background:i%2===0?"white":"#fafafa",
            borderTop:"1px solid rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize:13, color:T.text }}>"{ex.title}"</div>
            <Tag color={occColor(ex.occ)}>{ex.occ}</Tag>
            <div style={{ fontFamily:"monospace", fontSize:12,
              color:ex.conf>0.85?T.accentG:ex.conf>0.75?T.accentY:T.muted,
              fontWeight:600 }}>{(ex.conf*100).toFixed(1)}%</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:14 }}>
        {Object.entries(files).map(([k,f])=>(
          <button key={k} onClick={()=>setTab(k)}
            style={{ padding:"7px 16px", borderRadius:8, border:"none",
              background:tab===k?T.sidebar:T.card, color:tab===k?"white":T.muted,
              fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"monospace",
              boxShadow:"0 1px 3px rgba(0,0,0,0.08)" }}>
            {f.label}
          </button>
        ))}
      </div>
      <CodeBlock title={files[tab].label} code={files[tab].code}/>
    </div>
  );
}

// ─── PLANNER ALGORITHM SECTION ────────────────────────────────────────────────
function SectionPlannerAlgo() {
  const [tab, setTab] = useState("scorer");
  const files = {
    scorer: { label:"ai/outfit_scorer.py", code:`"""
outfit_scorer.py — Multi-objective outfit scoring engine.

score = 0.40 × occasion_match  +  0.40 × color_contrast  +  0.20 × variety
All components return float in [0.0, 1.0].
"""
import math

def _hue_delta(h1: float, h2: float) -> float:
    """Shortest angular distance on the colour wheel. Always in [0, 180]."""
    d = abs(h1 - h2) % 360
    return min(d, 360 - d)

def color_contrast_score(hsv1: list, hsv2: list) -> float:
    """
    HSV hue-angle colour harmony rules.

    hsv format: [hue (0-360), saturation (0-100), value (0-100)]
    """
    h1, s1, v1 = hsv1
    h2, s2, v2 = hsv2
    delta = _hue_delta(h1, h2)

    # Rule 1: both neutral (grey / white / beige) → always compatible
    if s1 < 18 and s2 < 18:                            return 0.70
    # Rule 2: one neutral + one vivid → classic pairing bonus
    if (s1 < 18 and s2 > 60) or (s2 < 18 and s1 > 60): return 0.80
    # Rule 3: colour-wheel harmony
    if 155 <= delta <= 205:                             return 1.00  # Complementary
    if 140 <= delta < 155 or 205 < delta <= 220:        return 0.90  # Split-comp
    if 105 <= delta < 140:                              return 0.82  # Triadic
    if  25 <= delta <  60:                              return 0.72  # Analogous
    if          delta <  25:                            return 0.65  # Monochromatic
    if  60 <= delta < 105:                              return 0.25  # Clash — penalise
    return 0.40

def occasion_match_score(cloth_tags: list, day_occasion: str) -> float:
    """Score how appropriate a single garment is for the day's occasion."""
    if day_occasion in cloth_tags:   return 1.00
    if "casual"     in cloth_tags:   return 0.60  # casual is universally OK
    return 0.20                                   # clear mismatch

def variety_score(item_id: str, worn_log: list) -> float:
    """
    Penalise wearing the same item on consecutive days.
    worn_log: flat list of item_ids assigned so far this week (oldest first).
    """
    if not worn_log:            return 1.0
    if item_id == worn_log[-1]: return 0.0   # worn just today
    if item_id in worn_log[-4:]:return 0.5   # worn in last 2 days
    return 1.0

def score_outfit(top: dict, bottom: dict,
                 day_occasion: str, worn_log: list) -> float:
    """
    Weighted outfit score for a top + bottom pair.

    weights: 40% occasion · 40% colour harmony · 20% variety
    """
    occ = (
        occasion_match_score(top["occasion_tags"],    day_occasion) +
        occasion_match_score(bottom["occasion_tags"], day_occasion)
    ) / 2.0

    col = color_contrast_score(top["primary_hsv"], bottom["primary_hsv"])

    var = (
        variety_score(str(top["_id"]),    worn_log) +
        variety_score(str(bottom["_id"]), worn_log)
    ) / 2.0

    return round(0.40*occ + 0.40*col + 0.20*var, 4)

def score_dress(dress: dict, day_occasion: str, worn_log: list) -> float:
    """Standalone dress — no colour contrast component (single garment)."""
    occ = occasion_match_score(dress["occasion_tags"], day_occasion)
    var = variety_score(str(dress["_id"]), worn_log)
    return round(0.50*occ + 0.50*var, 4)` },
    planner: { label:"routes/planner.py", code:`"""
routes/planner.py — Weekly outfit plan generator.

Algorithm: exhaustive combinatorial search over all (top, bottom) pairs
plus standalone dresses. For typical wardrobes (10–30 items) this is
fast (<100ms). For 100+ item wardrobes, consider beam search.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import users, clothes, outfit_plans
from ai.outfit_scorer import score_outfit, score_dress
from bson import ObjectId
from datetime import datetime, timedelta
import itertools, logging

logger     = logging.getLogger(__name__)
planner_bp = Blueprint("planner", __name__)

TOP_TYPES    = {"shirt", "formal_top", "tshirt", "outerwear"}
BOTTOM_TYPES = {"pants", "shorts", "skirt"}
DAYS         = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]

def _generate(wardrobe: list, events: dict, week_start: datetime) -> dict:
    """Core planning loop — picks best outfit per day."""
    tops    = [c for c in wardrobe if c["type"] in TOP_TYPES]
    bottoms = [c for c in wardrobe if c["type"] in BOTTOM_TYPES]
    dresses = [c for c in wardrobe if c["type"] == "dress"]

    plan, worn_log = {}, []

    for i, day in enumerate(DAYS):
        date_str = (week_start + timedelta(days=i)).strftime("%Y-%m-%d")
        occasion = events.get(date_str, "casual")
        best_s, best = -1.0, None

        # Score all top + bottom combos
        for top, bot in itertools.product(tops, bottoms):
            s = score_outfit(top, bot, occasion, worn_log)
            if s > best_s:
                best_s, best = s, {"kind":"separates","top":top,"bottom":bot,"score":s}

        # Score standalone dresses
        for dress in dresses:
            s = score_dress(dress, occasion, worn_log)
            if s > best_s:
                best_s, best = s, {"kind":"dress","dress":dress,"score":s}

        if best:
            plan[day] = _fmt(best, occasion)
            if best["kind"] == "separates":
                worn_log += [str(best["top"]["_id"]), str(best["bottom"]["_id"])]
            else:
                worn_log.append(str(best["dress"]["_id"]))
        else:
            plan[day] = {"kind":"none","occasion":occasion,"score":0}

    return plan

def _item(doc: dict) -> dict:
    return {
        "id":            str(doc["_id"]),
        "image_url":     doc["image_url"],
        "type":          doc["type"],
        "primary_color": doc["primary_color"],
        "occasion_tags": doc["occasion_tags"],
        "primary_hsv":   doc["primary_hsv"],
    }

def _fmt(best: dict, occasion: str) -> dict:
    base = {"kind":best["kind"],"occasion":occasion,"score":best["score"]}
    if best["kind"] == "separates":
        base["top"]    = _item(best["top"])
        base["bottom"] = _item(best["bottom"])
    else:
        base["dress"] = _item(best["dress"])
    return base

@planner_bp.route("/plan", methods=["GET"])
@jwt_required()
def get_plan():
    uid  = get_jwt_identity()
    user = users.find_one({"_id": ObjectId(uid)})
    if not user:
        return jsonify({"error":"User not found"}), 404

    week_str = request.args.get("week", datetime.utcnow().strftime("%Y-%m-%d"))
    try:
        week_start = datetime.strptime(week_str, "%Y-%m-%d")
    except ValueError:
        return jsonify({"error":"Use YYYY-MM-DD format (Monday of target week)"}), 400

    wardrobe = list(clothes.find({"user_id": ObjectId(uid)}))
    if len(wardrobe) < 4:
        return jsonify({
            "error":   "not_enough_items",
            "message": "Upload at least 4 clothing items to generate a weekly plan.",
        }), 400

    events = {e["date"]: e["occasion"]
              for e in (user.get("calendar_events") or [])}

    plan = _generate(wardrobe, events, week_start)
    logger.info(f"[planner] Generated plan for user {uid[:8]} — week {week_str}")

    outfit_plans.replace_one(
        {"user_id": ObjectId(uid), "week_start": week_start},
        {"user_id": ObjectId(uid), "week_start": week_start,
         "days": plan, "generated_at": datetime.utcnow()},
        upsert=True,
    )
    return jsonify({"week_start": week_str, "plan": plan}), 200` },
  };
  return (
    <div>
      <SectionTitle icon="◆" title="Outfit Planning Algorithm"
        sub="Multi-objective scoring: 40% occasion match · 40% colour harmony · 20% variety. Exhaustive combinatorial search."/>

      <div style={{ background:"#0f0f1a", borderRadius:10, padding:"20px 24px",
        border:"1px solid rgba(255,255,255,0.06)", marginBottom:20 }}>
        {[
          "score(outfit, occasion) = 0.40 × occasion_match",
          "                        + 0.40 × color_contrast",
          "                        + 0.20 × variety",
          "",
          "hue_delta(h1,h2) = min(|h1-h2| mod 360,  360 - |h1-h2| mod 360)  ∈ [0,180]",
        ].map((l,i)=>(
          <div key={i} style={{ fontFamily:"monospace", fontSize:13,
            color: i===0||i===1||i===2?"#bd93f9":i===4?"#6272a4":"white",
            lineHeight:2, textAlign:"center" }}>{l||"\u00a0"}</div>
        ))}
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:14 }}>
        {Object.entries(files).map(([k,f])=>(
          <button key={k} onClick={()=>setTab(k)}
            style={{ padding:"7px 16px", borderRadius:8, border:"none",
              background:tab===k?T.sidebar:T.card, color:tab===k?"white":T.muted,
              fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"monospace",
              boxShadow:"0 1px 3px rgba(0,0,0,0.08)" }}>
            {f.label}
          </button>
        ))}
      </div>
      <CodeBlock title={files[tab].label} code={files[tab].code}/>
    </div>
  );
}

// ─── DATASET PIPELINE SECTION ─────────────────────────────────────────────────
function SectionDataset() {
  return (
    <div>
      <SectionTitle icon="◉" title="Data Pipeline — DeepFashion"
        sub="Download, clean, map 50→12 classes, create stratified splits. Run on Colab or locally."/>

      <InfoBox type="warn">
        On Windows, set NUM_WORKERS=0 in ALL DataLoader calls. Windows uses a different process-forking model than Linux. Using num_workers=2+ causes "BrokenPipeError" or freezes on Windows. Colab (Linux) can use num_workers=4.
      </InfoBox>

      <div style={{ background:T.card, borderRadius:12, overflow:"hidden",
        border:`1px solid ${T.border}`, boxShadow:"0 1px 3px rgba(0,0,0,0.08)", marginBottom:20 }}>
        <div style={{ background:T.sidebar, padding:"8px 16px",
          display:"grid", gridTemplateColumns:"140px 1fr 1fr" }}>
          {["Our Class","DeepFashion Source Categories","Role in Planner"].map(h=>(
            <div key={h} style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.05em" }}>{h}</div>
          ))}
        </div>
        {[
          ["shirt","Shirt, Blouse, Tank Top, Polo Shirt","Top — pairs with bottom"],
          ["formal_top","Suit, Blazer, Dress Shirt","Top — formal/business only"],
          ["tshirt","T-Shirt, Crop Top, Camisole","Top — casual/athletic"],
          ["dress","Dress, Mini Dress, Maxi Dress","Standalone — all occasions"],
          ["pants","Jeans, Trousers, Chinos, Cargo Pants","Bottom — all occasions"],
          ["shorts","Shorts, Denim Shorts, Sport Shorts","Bottom — casual/athletic"],
          ["skirt","Skirt, Mini Skirt, Pleated Skirt","Bottom — casual/semi-formal"],
          ["outerwear","Coat, Jacket, Hoodie, Cardigan, Sweater","Outer — any occasion"],
          ["activewear","Leggings, Sports Top, Track Pants","Athletic — workout only"],
          ["shoes","Sneakers, Heels, Boots, Loafers, Sandals","Stored, not scored"],
          ["bag","Handbag, Backpack, Clutch, Tote","Accessory — not scored"],
          ["accessories","Belt, Hat, Scarf, Tie, Watch","Accessory — not scored"],
        ].map(([cls,src,role],i)=>(
          <div key={cls} style={{ display:"grid", gridTemplateColumns:"140px 1fr 1fr",
            padding:"8px 16px", alignItems:"center",
            background:i%2===0?"white":"#fafafa",
            borderTop:"1px solid rgba(0,0,0,0.04)" }}>
            <div style={{ fontFamily:"monospace", fontSize:12, color:"#6366f1", fontWeight:600 }}>{cls}</div>
            <div style={{ fontSize:12, color:T.muted }}>{src}</div>
            <div style={{ fontSize:12, color:T.text }}>{role}</div>
          </div>
        ))}
      </div>

      <CodeBlock title="backend/ai/train/build_dataset.py" code={`"""
build_dataset.py — DeepFashion dataset preparation.

Usage: python build_dataset.py

Output structure:
  data/
    train/  {class_name}/  *.jpg
    val/    {class_name}/  *.jpg
    test/   {class_name}/  *.jpg
    class_index.json

Windows notes:
  - Use Path() everywhere — avoids backslash issues
  - shutil.copy2 is cross-platform safe
"""
import os, shutil, json, random
from pathlib import Path
from PIL import Image

DATA_ROOT  = Path("data/deepfashion_raw")
OUTPUT_DIR = Path("data")
SPLITS     = {"train": 0.70, "val": 0.15, "test": 0.15}
MIN_IMGS   = 500        # skip classes with fewer images
SEED       = 42

LABEL_MAP = {
    "Shirt": "shirt",         "Blouse": "shirt",        "Tank Top": "shirt",
    "Polo Shirt": "shirt",    "Suit": "formal_top",     "Blazer": "formal_top",
    "Dress Shirt": "formal_top",
    "T-Shirt": "tshirt",      "Crop Top": "tshirt",     "Camisole": "tshirt",
    "Dress": "dress",         "Mini Dress": "dress",    "Maxi Dress": "dress",
    "Skater Dress": "dress",
    "Jeans": "pants",         "Trousers": "pants",      "Chinos": "pants",
    "Cargo Pants": "pants",   "Shorts": "shorts",       "Denim Shorts": "shorts",
    "Sport Shorts": "shorts", "Skirt": "skirt",         "Mini Skirt": "skirt",
    "Pleated Skirt": "skirt",
    "Coat": "outerwear",      "Jacket": "outerwear",    "Hoodie": "outerwear",
    "Cardigan": "outerwear",  "Sweater": "outerwear",
    "Leggings": "activewear", "Track Pants": "activewear",
    "Sneakers": "shoes",      "Heels": "shoes",         "Boots": "shoes",
    "Loafers": "shoes",       "Sandals": "shoes",
    "Handbag": "bag",         "Backpack": "bag",        "Clutch": "bag",
    "Hat": "accessories",     "Scarf": "accessories",   "Belt": "accessories",
    "Tie": "accessories",
}

def is_valid(path: Path) -> bool:
    try:
        img = Image.open(path).convert("RGB")
        return img.size[0] >= 64 and img.size[1] >= 64
    except Exception:
        return False

def build():
    random.seed(SEED)
    print(f"Scanning: {DATA_ROOT.resolve()}")

    # Collect images per our 12 classes
    class_images: dict = {}
    for df_label, our_label in LABEL_MAP.items():
        folder = DATA_ROOT / df_label.replace(" ", "_")
        if not folder.exists():
            continue
        imgs = [p for p in folder.rglob("*.jpg") if is_valid(p)]
        class_images.setdefault(our_label, []).extend(imgs)

    # Report
    print(f"\\n{'Class':<20} {'Total':>8} {'Status'}")
    print("-" * 42)
    valid: dict = {}
    for cls, imgs in sorted(class_images.items()):
        ok = len(imgs) >= MIN_IMGS
        print(f"{cls:<20} {len(imgs):>8}   {'✓' if ok else f'skip (<{MIN_IMGS})'}")
        if ok:
            valid[cls] = imgs

    # Create splits
    for split in SPLITS:
        (OUTPUT_DIR / split).mkdir(parents=True, exist_ok=True)

    total_moved = 0
    for cls, imgs in valid.items():
        random.shuffle(imgs)
        n      = len(imgs)
        i_tr   = int(n * 0.70)
        i_val  = i_tr + int(n * 0.15)
        for split, paths in zip(
            ["train", "val", "test"],
            [imgs[:i_tr], imgs[i_tr:i_val], imgs[i_val:]]
        ):
            dest = OUTPUT_DIR / split / cls
            dest.mkdir(parents=True, exist_ok=True)
            for p in paths:
                shutil.copy2(p, dest / p.name)
            total_moved += len(paths)

    # Save class index
    class_index = {cls: i for i, cls in enumerate(sorted(valid))}
    with open(OUTPUT_DIR / "class_index.json", "w") as f:
        json.dump(class_index, f, indent=2)
    print(f"\\nDone. {total_moved} images → {len(valid)} classes")
    print(f"class_index.json saved.")

if __name__ == "__main__":
    build()`}/>
    </div>
  );
}

// ─── EXPORT & EVALUATE SECTION ────────────────────────────────────────────────
function SectionExportEval() {
  const [tab, setTab] = useState("export");
  const files = {
    export: { label:"export_model.py", code:`"""
export_model.py — Convert trained checkpoint to TorchScript.

Run AFTER training completes:
  python backend/ai/train/export_model.py

Input:  backend/ai/weights/best_checkpoint.pt
Output: backend/ai/weights/clothing_classifier.pt  (TorchScript)

TorchScript lets Flask load the model without the training
class definition. Just torch.jit.load() and it works.
"""
import torch
import torch.nn as nn
from torchvision import models
import json
from pathlib import Path

WEIGHTS_DIR = Path("backend/ai/weights")

# Load class index to know NUM_CLASSES
with open(WEIGHTS_DIR / "class_index.json") as f:
    class_index = json.load(f)
NUM_CLASSES = len(class_index)

# Rebuild architecture (must EXACTLY match train_classifier.py)
model = models.mobilenet_v2(weights=None)
in_feats = model.classifier[1].in_features   # 1280
model.classifier = nn.Sequential(
    nn.Dropout(p=0.3),
    nn.Linear(in_feats, 256),
    nn.ReLU(inplace=True),
    nn.Dropout(p=0.2),
    nn.Linear(256, NUM_CLASSES),
)

# Load the best checkpoint weights
state = torch.load(
    WEIGHTS_DIR / "best_checkpoint.pt",
    map_location="cpu"
)
model.load_state_dict(state)
model.eval()

# Trace the model (trace = record operations on a concrete input)
# Works perfectly for standard CNN inference (no dynamic control flow)
dummy  = torch.randn(1, 3, 224, 224)
traced = torch.jit.trace(model, dummy)

# Save TorchScript model
out_path = WEIGHTS_DIR / "clothing_classifier.pt"
torch.jit.save(traced, out_path)
size_mb = out_path.stat().st_size / 1_000_000

print(f"TorchScript saved → {out_path}")
print(f"File size: {size_mb:.1f} MB")
print(f"Classes:   {NUM_CLASSES}")
print(f"\\nVerification — loading and running inference...")
loaded = torch.jit.load(out_path, map_location="cpu")
loaded.eval()
with torch.no_grad():
    out = loaded(dummy)
print(f"Output shape: {out.shape}  ✓")
print("Model ready for production inference.")` },
    evaluate: { label:"evaluate.py", code:`"""
evaluate.py — Full evaluation on held-out test set.

Run: python backend/ai/train/evaluate.py

Outputs:
  - Per-class precision, recall, F1-score
  - Confusion matrix (printed to console)
  - Overall accuracy and weighted F1
"""
import torch
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
import numpy as np
import json
from pathlib import Path

WEIGHTS_DIR = Path("backend/ai/weights")
DATA_DIR    = Path("data")
DEVICE      = torch.device("cpu")   # always CPU for evaluation
IMG_SIZE    = 224
MEAN        = [0.485, 0.456, 0.406]
STD         = [0.229, 0.224, 0.225]

model = torch.jit.load(WEIGHTS_DIR / "clothing_classifier.pt", map_location=DEVICE)
model.eval()

with open(WEIGHTS_DIR / "class_index.json") as f:
    raw = json.load(f)
# class_index maps class_name→index; flip it for evaluation
if isinstance(list(raw.keys())[0], str) and list(raw.keys())[0].isdigit():
    idx_to_class = raw
else:
    idx_to_class = {str(v): k for k, v in raw.items()}
classes = [idx_to_class[str(i)] for i in range(len(idx_to_class))]

test_tf = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=MEAN, std=STD),
])
test_ds = datasets.ImageFolder(DATA_DIR / "test", transform=test_tf)
# NUM_WORKERS=0 required on Windows
loader  = DataLoader(test_ds, batch_size=32, shuffle=False, num_workers=0)

# Collect all predictions
all_preds, all_labels = [], []
with torch.no_grad():
    for imgs, labels in loader:
        out   = model(imgs.to(DEVICE))
        preds = out.argmax(1).cpu().numpy()
        all_preds.extend(preds)
        all_labels.extend(labels.numpy())

all_preds  = np.array(all_preds)
all_labels = np.array(all_labels)

# Per-class metrics
print(f"\\n{'Class':<20} {'Precision':>10} {'Recall':>10} {'F1':>10} {'N':>8}")
print("-" * 62)
total_support, weighted_f1 = 0, 0.0
for i, cls in enumerate(classes):
    tp  = np.sum((all_preds==i) & (all_labels==i))
    fp  = np.sum((all_preds==i) & (all_labels!=i))
    fn  = np.sum((all_preds!=i) & (all_labels==i))
    sup = int(np.sum(all_labels==i))
    p   = tp / (tp + fp + 1e-8)
    r   = tp / (tp + fn + 1e-8)
    f1  = 2*p*r / (p + r + 1e-8)
    print(f"{cls:<20} {p:>10.3f} {r:>10.3f} {f1:>10.3f} {sup:>8}")
    weighted_f1    += f1 * sup
    total_support  += sup

accuracy    = np.mean(all_preds == all_labels)
weighted_f1 = weighted_f1 / total_support
print("-" * 62)
print(f"\\nAccuracy:    {accuracy:.4f}  ({accuracy*100:.1f}%)")
print(f"Weighted F1: {weighted_f1:.4f}")
print(f"\\nTarget: Accuracy ≥ 0.82, Weighted F1 ≥ 0.80")` },
  };
  return (
    <div>
      <SectionTitle icon="▷" title="Export & Evaluate"
        sub="Convert training checkpoint → TorchScript for production. Evaluate per-class precision/recall/F1."/>
      <InfoBox type="hp">
        Evaluation runs on your HP 15s CPU. With 12 classes and a typical test set of ~8,000 images, evaluation takes about 3–5 minutes. The confusion matrix shows exactly where the model struggles — shirt vs formal_top is the most common confusion.
      </InfoBox>
      <div style={{ display:"flex", gap:8, marginBottom:14 }}>
        {Object.entries(files).map(([k,f])=>(
          <button key={k} onClick={()=>setTab(k)}
            style={{ padding:"7px 16px", borderRadius:8, border:"none",
              background:tab===k?T.sidebar:T.card, color:tab===k?"white":T.muted,
              fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"monospace",
              boxShadow:"0 1px 3px rgba(0,0,0,0.08)" }}>
            {f.label}
          </button>
        ))}
      </div>
      <CodeBlock title={files[tab].label} code={files[tab].code}/>
    </div>
  );
}

// ─── CONFIG & MODELS SECTION ──────────────────────────────────────────────────
function SectionConfig() {
  const [tab, setTab] = useState("env");
  const files = {
    env: { label:".env", code:`# ── Authentication ─────────────────────────────────────────────
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/wardrobeai
JWT_SECRET_KEY=generate_with__python_-c_"import secrets; print(secrets.token_hex(32))"
JWT_REFRESH_SECRET=generate_a_different_random_hex_string_here

# ── Image Storage (Cloudinary — free 25GB) ─────────────────────
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ── Google Calendar OAuth2 ─────────────────────────────────────
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/calendar/callback

# ── Application ────────────────────────────────────────────────
FRONTEND_URL=http://localhost:5173
FLASK_ENV=development

# HOW TO GENERATE JWT SECRET ON WINDOWS:
# Open PowerShell with (venv) active and run:
#   python -c "import secrets; print(secrets.token_hex(32))"
# Copy the output and paste it as the value above.` },
    config: { label:"config.py", code:`"""
config.py — Centralised configuration.
All other files import from here — never call os.getenv() directly.

Windows path note: use pathlib.Path everywhere for cross-platform safety.
"""
import os
from datetime import timedelta
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the backend/ directory
load_dotenv(Path(__file__).parent / ".env")

class Config:
    # ── JWT ──────────────────────────────────────────────────────
    JWT_SECRET_KEY            = os.getenv("JWT_SECRET_KEY")
    JWT_REFRESH_SECRET        = os.getenv("JWT_REFRESH_SECRET")
    JWT_ACCESS_TOKEN_EXPIRES  = timedelta(minutes=15)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

    # ── MongoDB ──────────────────────────────────────────────────
    MONGO_URI = os.getenv("MONGO_URI")

    # ── Cloudinary ───────────────────────────────────────────────
    CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
    CLOUDINARY_API_KEY    = os.getenv("CLOUDINARY_API_KEY")
    CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

    # ── Google OAuth2 ────────────────────────────────────────────
    GOOGLE_CLIENT_ID     = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
    GOOGLE_REDIRECT_URI  = os.getenv("GOOGLE_REDIRECT_URI")

    # ── App ──────────────────────────────────────────────────────
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

    @staticmethod
    def validate():
        required = ["JWT_SECRET_KEY", "MONGO_URI"]
        missing  = [k for k in required if not os.getenv(k)]
        if missing:
            raise EnvironmentError(
                f"Missing required environment variables: {missing}\\n"
                f"Check your backend/.env file."
            )` },
    models_py: { label:"models.py", code:`"""
models.py — PyMongo collections, indexes, and document factories.

Rule: never build a document dict manually outside this file.
Always use the factory functions (new_user, new_cloth, etc.)
to ensure consistent document structure.
"""
from pymongo import MongoClient, ASCENDING
from bson import ObjectId
from config import Config
from datetime import datetime

# maxPoolSize=5 prevents connection pool exhaustion on free MongoDB tier
client = MongoClient(Config.MONGO_URI, maxPoolSize=5)
db     = client["wardrobeai"]

# ── Collections ────────────────────────────────────────────────
users        = db["users"]
clothes      = db["clothes"]
outfit_plans = db["outfit_plans"]

# ── Indexes (run once on import — MongoDB skips if they exist) ──
def _create_indexes():
    users.create_index("email", unique=True)
    clothes.create_index("user_id")
    clothes.create_index([("user_id", ASCENDING), ("occasion_tags", ASCENDING)])
    outfit_plans.create_index([("user_id", ASCENDING), ("week_start", ASCENDING)])

_create_indexes()

# ── Document factories ──────────────────────────────────────────
def new_user(name: str, email: str, password_hash: str) -> dict:
    return {
        "name":            name,
        "email":           email,
        "password_hash":   password_hash,
        "google_tokens":   None,
        "calendar_events": [],
        "created_at":      datetime.utcnow(),
    }

def new_cloth(user_id, image_url, cloth_type, primary_color,
              secondary_colors, primary_hsv, delta_e_spread,
              occasion_tags, confidence, top3) -> dict:
    return {
        "user_id":          ObjectId(user_id),
        "image_url":        image_url,
        "type":             cloth_type,          # "shirt", "pants", ...
        "primary_color":    primary_color,       # [r, g, b]  0-255
        "secondary_colors": secondary_colors,    # [[r,g,b], ...]
        "primary_hsv":      primary_hsv,         # [h°, s%, v%]
        "delta_e_spread":   delta_e_spread,      # palette diversity
        "occasion_tags":    occasion_tags,       # ["casual","formal"]
        "confidence":       confidence,          # float 0.0-1.0
        "top3_predictions": top3,               # [{type,score}, ...]
        "usage_count":      0,
        "last_worn":        None,
        "created_at":       datetime.utcnow(),
    }` },
  };
  return (
    <div>
      <SectionTitle icon="≡" title="Config, Models & Environment"
        sub="config.py · models.py · .env file setup. The foundation every other file imports from."/>
      <InfoBox type="warn">
        Never commit your .env file to Git. Add it to .gitignore immediately after creating it. On Windows, you can check: Get-Content .gitignore in PowerShell inside the backend/ folder.
      </InfoBox>
      <div style={{ display:"flex", gap:8, marginBottom:14 }}>
        {Object.entries(files).map(([k,f])=>(
          <button key={k} onClick={()=>setTab(k)}
            style={{ padding:"7px 16px", borderRadius:8, border:"none",
              background:tab===k?T.sidebar:T.card, color:tab===k?"white":T.muted,
              fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"monospace",
              boxShadow:"0 1px 3px rgba(0,0,0,0.08)" }}>
            {f.label}
          </button>
        ))}
      </div>
      <CodeBlock title={files[tab].label} code={files[tab].code}/>
    </div>
  );
}

// ─── REACT HOOKS & API SECTION ────────────────────────────────────────────────
function SectionHooks() {
  const [tab, setTab] = useState("axios");
  const files = {
    axios: { label:"api/axiosClient.js", code:`import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// ── Attach JWT to every outgoing request ──────────────────────────
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem("access_token");
  if (token) cfg.headers.Authorization = \`Bearer \${token}\`;
  return cfg;
});

// ── Auto-refresh JWT on 401, then retry original request ──────────
api.interceptors.response.use(
  res => res,
  async err => {
    const orig = err.config;
    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      const rt = localStorage.getItem("refresh_token");
      if (!rt) {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(err);
      }
      try {
        const { data } = await axios.post(
          \`\${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/auth/refresh\`,
          {},
          { headers: { Authorization: \`Bearer \${rt}\` } }
        );
        localStorage.setItem("access_token", data.access_token);
        orig.headers.Authorization = \`Bearer \${data.access_token}\`;
        return api(orig);     // retry the original request with new token
      } catch {
        localStorage.clear();
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;` },
    useAuth: { label:"hooks/useAuth.js", code:`import { useState, useEffect, createContext, useContext } from "react";
import api from "../api/axiosClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: restore session from stored access token
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      api.get("/auth/me")
        .then(({ data }) => setUser(data))
        .catch(() => localStorage.clear())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("access_token",  data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post("/auth/register", { name, email, password });
    localStorage.setItem("access_token",  data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => { localStorage.clear(); setUser(null); };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);` },
    useClothes: { label:"hooks/useClothes.js", code:`import { useState, useEffect, useCallback } from "react";
import api from "../api/axiosClient";

export function useClothes() {
  const [clothes,   setClothes]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState("");

  // Fetch wardrobe on mount
  useEffect(() => {
    api.get("/clothes")
      .then(({ data }) => setClothes(data.clothes || []))
      .catch(() => setError("Failed to load wardrobe."))
      .finally(() => setLoading(false));
  }, []);

  // Upload + classify image
  const upload = useCallback(async (file) => {
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const { data } = await api.post("/classify", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // Prepend to wardrobe (optimistic update — shows immediately)
      setClothes(prev => [data, ...prev]);
      return data;
    } catch (e) {
      const msg = e.response?.data?.error || "Upload failed. Try a clearer photo.";
      setError(msg);
      throw e;
    } finally {
      setUploading(false);
    }
  }, []);

  // Delete item
  const remove = useCallback(async (id) => {
    await api.delete(\`/clothes/\${id}\`);
    setClothes(prev => prev.filter(c => (c.id || c._id) !== id));
  }, []);

  return { clothes, loading, uploading, error, upload, remove };
}` },
    usePlanner: { label:"hooks/usePlanner.js", code:`import { useState, useCallback } from "react";
import api from "../api/axiosClient";

export function usePlanner() {
  const [plan,    setPlan]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  // Get the Monday of the current week as YYYY-MM-DD
  const getWeekStart = () => {
    const d    = new Date();
    const day  = d.getDay();
    const diff = (day === 0 ? -6 : 1 - day);   // Sunday=0, need Monday
    d.setDate(d.getDate() + diff);
    return d.toISOString().split("T")[0];
  };

  const generatePlan = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const week = getWeekStart();
      const { data } = await api.get(\`/plan?week=\${week}\`);
      setPlan(data.plan);
      return data.plan;
    } catch (e) {
      if (e.response?.status === 400) {
        setError(e.response.data?.message || "Not enough clothing items.");
      } else {
        setError("Plan generation failed. Try again.");
      }
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPlan = useCallback(async (week) => {
    setLoading(true);
    try {
      const { data } = await api.get(\`/plan?week=\${week || getWeekStart()}\`);
      setPlan(data.plan);
    } catch {
      // Plan doesn't exist yet — that's OK
    } finally {
      setLoading(false);
    }
  }, []);

  return { plan, loading, error, generatePlan, fetchPlan };
}` },
  };
  return (
    <div>
      <SectionTitle icon="⌀" title="React Hooks & API Client"
        sub="axiosClient.js with auto JWT refresh · useAuth · useClothes · usePlanner. The data layer."/>
      <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
        {Object.entries(files).map(([k,f])=>(
          <button key={k} onClick={()=>setTab(k)}
            style={{ padding:"7px 16px", borderRadius:8, border:"none",
              background:tab===k?T.sidebar:T.card, color:tab===k?"white":T.muted,
              fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"monospace",
              boxShadow:"0 1px 3px rgba(0,0,0,0.08)" }}>
            {f.label}
          </button>
        ))}
      </div>
      <CodeBlock title={files[tab].label} code={files[tab].code}/>
    </div>
  );
}

// ─── WARDROBE PAGE SECTION ────────────────────────────────────────────────────
function SectionWardrobe() {
  return (
    <div>
      <SectionTitle icon="◈" title="Wardrobe Page — Full Code"
        sub="Drag-drop upload with UploadZone · ClothCard with AI predictions · colour swatches · confidence bars."/>
      <InfoBox type="tip">
        The ClothCard shows all three top predictions with confidence bars so users understand the AI's reasoning. The colour palette shows primary + secondary colours extracted by the LAB KMeans++ pipeline. Delta-E spread indicates how colourful/patterned the garment is.
      </InfoBox>
      <CodeBlock title="frontend/src/pages/Wardrobe.jsx" code={`import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Trash2, RefreshCw, AlertCircle } from "lucide-react";
import { useClothes } from "../hooks/useClothes";

// ── Colour swatch component ───────────────────────────────────────
function Swatch({ rgb, size = "md" }) {
  const [r, g, b] = rgb || [200, 200, 200];
  const dim = size === "lg" ? 32 : size === "sm" ? 14 : 22;
  return (
    <div
      title={\`RGB(\${r},\${g},\${b})\`}
      style={{
        width: dim, height: dim, borderRadius: "50%",
        backgroundColor: \`rgb(\${r},\${g},\${b})\`,
        border: "2px solid rgba(255,255,255,0.8)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        flexShrink: 0,
      }}
    />
  );
}

// ── Confidence bar component ──────────────────────────────────────
function ConfBar({ label, score, highlight }) {
  return (
    <div className="mb-1.5">
      <div className="flex justify-between text-xs mb-0.5">
        <span className={highlight ? "font-semibold text-indigo-700" : "text-gray-500"}>
          {label}
        </span>
        <span className={highlight ? "font-bold text-indigo-600" : "text-gray-400"}>
          {(score * 100).toFixed(1)}%
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={\`h-full rounded-full transition-all duration-500 \${
            highlight ? "bg-indigo-500" : "bg-gray-300"
          }\`}
          style={{ width: \`\${score * 100}%\` }}
        />
      </div>
    </div>
  );
}

// ── Cloth card component ──────────────────────────────────────────
function ClothCard({ item, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Remove this item from your wardrobe?")) return;
    setDeleting(true);
    try { await onDelete(item.id || item._id); }
    catch { setDeleting(false); }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100
                    overflow-hidden hover:shadow-md transition-all duration-200">
      {/* Image */}
      <div className="relative">
        <img
          src={item.image_url} alt={item.type}
          className="w-full h-44 object-cover"
          loading="lazy"
        />
        <span className={\`absolute top-2 right-2 text-xs font-bold px-2 py-0.5
                          rounded-full backdrop-blur-sm \${
          item.confidence >= 0.80 ? "bg-green-100 text-green-700"
        : item.confidence >= 0.65 ? "bg-yellow-100 text-yellow-700"
        : "bg-gray-100 text-gray-500"
        }\`}>
          {(item.confidence * 100).toFixed(0)}%
        </span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="absolute top-2 left-2 bg-white/80 hover:bg-red-50
                     p-1.5 rounded-lg shadow-sm transition"
        >
          {deleting
            ? <RefreshCw size={14} className="text-gray-400 animate-spin"/>
            : <Trash2 size={14} className="text-gray-400 hover:text-red-500"/>}
        </button>
      </div>

      {/* Info */}
      <div className="p-3">
        {/* Type + colour palette */}
        <div className="flex items-center justify-between mb-2">
          <p className="font-bold text-sm capitalize text-gray-800">{item.type}</p>
          <div className="flex gap-1 items-center">
            <Swatch rgb={item.primary_color} size="lg"/>
            {item.secondary_colors?.slice(0,2).map((rgb, i) => (
              <Swatch key={i} rgb={rgb} size="sm"/>
            ))}
          </div>
        </div>

        {/* Occasion tags */}
        <div className="flex flex-wrap gap-1 mb-2">
          {item.occasion_tags?.map(tag => (
            <span key={tag}
              className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600
                         rounded-full font-medium">{tag}</span>
          ))}
        </div>

        {/* Delta-E palette diversity */}
        {item.delta_e_spread != null && (
          <p className="text-xs text-gray-400 mb-1">
            Palette diversity: {item.delta_e_spread.toFixed(1)} ΔE
          </p>
        )}

        {/* AI Predictions toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-indigo-400 hover:text-indigo-600 transition"
        >
          {expanded ? "▲ Hide" : "▼ Show"} AI predictions
        </button>

        {expanded && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            {item.top3_predictions?.map((p, i) => (
              <ConfBar key={i} label={p.type} score={p.score} highlight={i === 0}/>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Upload zone component ─────────────────────────────────────────
function UploadZone({ onDrop, uploading }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxFiles: 5,
    maxSize:  10 * 1024 * 1024,   // 10 MB
    disabled: uploading,
  });
  return (
    <div
      {...getRootProps()}
      className={\`border-2 border-dashed rounded-2xl p-10 text-center
                  cursor-pointer transition-all duration-200 mb-8 \${
        uploading   ? "border-indigo-300 bg-indigo-50 cursor-not-allowed"
        : isDragActive ? "border-indigo-500 bg-indigo-50 scale-[1.01]"
        : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
      }\`}
    >
      <input {...getInputProps()} />
      <div className="text-4xl mb-3">{uploading ? "⏳" : "📷"}</div>
      {uploading ? (
        <p className="text-indigo-600 font-semibold">
          Classifying with AI… please wait
        </p>
      ) : isDragActive ? (
        <p className="text-indigo-600 font-semibold">Drop it here!</p>
      ) : (
        <>
          <p className="text-gray-600 font-medium">
            Drag & drop clothing photos here
          </p>
          <p className="text-gray-400 text-sm mt-1">
            or click to browse · JPG / PNG / WEBP · up to 5 at once · max 10 MB each
          </p>
        </>
      )}
    </div>
  );
}

// ── Main Wardrobe page ────────────────────────────────────────────
export default function Wardrobe() {
  const { clothes, loading, uploading, error, upload, remove } = useClothes();
  const [filter, setFilter] = useState("all");

  const onDrop = useCallback(async (acceptedFiles) => {
    for (const file of acceptedFiles) {
      await upload(file).catch(() => {});   // errors handled in hook
    }
  }, [upload]);

  const categories = ["all", ...new Set(clothes.map(c => c.type))];
  const filtered   = filter === "all"
    ? clothes
    : clothes.filter(c => c.type === filter);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Wardrobe</h1>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {clothes.length} items
        </span>
      </div>

      <UploadZone onDrop={onDrop} uploading={uploading}/>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50
                        border border-red-200 rounded-lg p-3 mb-4">
          <AlertCircle size={16}/>
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Category filter pills */}
      {categories.length > 1 && (
        <div className="flex gap-2 flex-wrap mb-5">
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={\`px-3 py-1 rounded-full text-xs font-semibold
                          transition capitalize \${
                filter === cat
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-gray-500 border border-gray-200 hover:border-indigo-300"
              }\`}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Wardrobe grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-2xl h-64 animate-pulse"/>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">👗</div>
          <p className="font-medium">Your wardrobe is empty</p>
          <p className="text-sm mt-1">Upload clothing photos above to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(item => (
            <ClothCard
              key={item.id || item._id}
              item={item}
              onDelete={remove}
            />
          ))}
        </div>
      )}
    </div>
  );
}`}/>
    </div>
  );
}

// ─── PLANNER PAGE SECTION ─────────────────────────────────────────────────────
function SectionPlannerPage() {
  return (
    <div>
      <SectionTitle icon="▦" title="Planner Page — Full Code"
        sub="7-column weekly calendar view · Generate Plan button · OutfitCard with score badge · colour swatches per outfit."/>
      <CodeBlock title="frontend/src/pages/Planner.jsx" code={`import { useEffect, useState } from "react";
import { Loader2, Calendar, Sparkles, AlertCircle } from "lucide-react";
import { usePlanner } from "../hooks/usePlanner";

const DAYS      = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const DAY_KEYS  = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];

// Colour swatch
function Swatch({ rgb }) {
  if (!rgb) return null;
  const [r, g, b] = rgb;
  return (
    <div
      style={{ backgroundColor: \`rgb(\${r},\${g},\${b})\`,
               width:20, height:20, borderRadius:"50%",
               border:"2px solid rgba(255,255,255,0.8)",
               boxShadow:"0 1px 3px rgba(0,0,0,0.2)", flexShrink:0 }}
    />
  );
}

// Score badge — green > 0.75, yellow > 0.55, red below
function ScoreBadge({ score }) {
  const color = score >= 0.75 ? "#22c55e" : score >= 0.55 ? "#f59e0b" : "#f43f5e";
  const bg    = score >= 0.75 ? "#f0fdf4" : score >= 0.55 ? "#fffbeb" : "#fff1f2";
  return (
    <span style={{ fontSize:10, fontWeight:700, color, background:bg,
      padding:"2px 7px", borderRadius:99, fontFamily:"monospace" }}>
      {(score * 100).toFixed(0)}%
    </span>
  );
}

// Occasion badge
function OccBadge({ occasion }) {
  const map = {
    formal:       { bg:"#e0e7ff", color:"#3730a3" },
    "semi-formal":{ bg:"#fef3c7", color:"#92400e" },
    casual:       { bg:"#f0fdf4", color:"#166534" },
    athletic:     { bg:"#fce7f3", color:"#9d174d" },
  };
  const s = map[occasion] || map.casual;
  return (
    <span style={{ fontSize:9, fontWeight:700, color:s.color, background:s.bg,
      padding:"2px 6px", borderRadius:99, textTransform:"uppercase",
      letterSpacing:"0.05em" }}>
      {occasion}
    </span>
  );
}

// Single outfit card inside a day column
function OutfitCard({ outfit }) {
  if (!outfit || outfit.kind === "none") {
    return (
      <div className="flex flex-col items-center justify-center h-36
                      bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <span className="text-2xl mb-1">👕</span>
        <span className="text-xs text-gray-400">No outfit</span>
      </div>
    );
  }

  const items = outfit.kind === "separates"
    ? [outfit.top, outfit.bottom]
    : [outfit.dress];

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-2">
      {/* Clothes images */}
      <div className={\`grid \${items.length === 2 ? "grid-cols-2" : "grid-cols-1"} gap-1 mb-2\`}>
        {items.map((item, i) => (
          <img
            key={i}
            src={item.image_url}
            alt={item.type}
            className="w-full h-20 object-cover rounded-lg"
            loading="lazy"
          />
        ))}
      </div>

      {/* Colour swatches */}
      <div className="flex gap-1 items-center mb-1.5 flex-wrap">
        {items.map((item, i) => (
          <Swatch key={i} rgb={item.primary_color}/>
        ))}
      </div>

      {/* Occasion + score */}
      <div className="flex items-center justify-between">
        <OccBadge occasion={outfit.occasion}/>
        <ScoreBadge score={outfit.score}/>
      </div>
    </div>
  );
}

// Skeleton loader for a day column
function ColumnSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-36 bg-gray-100 rounded-xl mb-2"/>
    </div>
  );
}

// ── Main Planner page ─────────────────────────────────────────────
export default function Planner() {
  const { plan, loading, error, generatePlan, fetchPlan } = usePlanner();

  useEffect(() => {
    fetchPlan();   // load existing plan on mount (if it exists)
  }, [fetchPlan]);

  const handleGenerate = async () => {
    try { await generatePlan(); }
    catch {}   // errors handled in hook
  };

  return (
    <div className="p-6 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar size={22} className="text-indigo-600"/>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Weekly Planner</h1>
            <p className="text-sm text-gray-500">AI-generated outfits matching your calendar</p>
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className={\`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold
                      text-sm transition shadow-sm \${
            loading
              ? "bg-indigo-200 text-indigo-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"
          }\`}
        >
          {loading
            ? <><Loader2 size={16} className="animate-spin"/>Generating…</>
            : <><Sparkles size={16}/>Generate Plan</>}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50
                        border border-red-200 rounded-xl p-4 mb-5">
          <AlertCircle size={16}/>
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Score legend */}
      <div className="flex items-center gap-4 mb-5 text-xs text-gray-500">
        <span className="font-medium">Score:</span>
        {[["≥75%","Great match","#22c55e"],["55–74%","Good","#f59e0b"],["<55%","Poor","#f43f5e"]].map(([r,l,c])=>(
          <span key={r} style={{ display:"flex", alignItems:"center", gap:4 }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:c, display:"inline-block"}}/>
            {r} {l}
          </span>
        ))}
      </div>

      {/* 7-day grid — horizontal scroll on small screens */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,minmax(130px,1fr))", gap:10 }}>
        {DAY_KEYS.map((key, i) => (
          <div key={key}>
            {/* Day header */}
            <div className={\`text-center py-2 px-1 rounded-lg mb-2 \${
              i >= 5 ? "bg-indigo-50" : "bg-gray-50"
            }\`}>
              <p className={\`text-xs font-bold uppercase tracking-widest \${
                i >= 5 ? "text-indigo-600" : "text-gray-500"
              }\`}>{DAYS[i].slice(0,3)}</p>
              <p className="text-xs text-gray-400">{DAYS[i]}</p>
            </div>
            {/* Outfit card / skeleton */}
            {loading
              ? <ColumnSkeleton/>
              : <OutfitCard outfit={plan?.[key]}/>}
          </div>
        ))}
      </div>
    </div>
  );
}`}/>
    </div>
  );
}

// ─── DEPLOYMENT SECTION ───────────────────────────────────────────────────────
function SectionDeploy() {
  const [tab, setTab] = useState("render");
  return (
    <div>
      <SectionTitle icon="↑" title="Deployment — Render + Vercel"
        sub="Flask backend on Render · React frontend on Vercel · Both free tiers. No credit card required."/>

      <InfoBox type="warn">
        Render's free tier spins down after 15 minutes of inactivity. The first request after spin-down takes ~20 seconds (cold start). Upgrade to Render Starter ($7/mo) for always-on if you're demoing to a professor or client. Vercel is always-on even on free tier.
      </InfoBox>

      <div style={{ display:"flex", gap:8, marginBottom:14 }}>
        {[["render","Render (Backend)"],["vercel","Vercel (Frontend)"],["env_prod","Production .env"],["test","Post-Deploy Test"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)}
            style={{ padding:"7px 16px", borderRadius:8, border:"none",
              background:tab===k?T.sidebar:T.card, color:tab===k?"white":T.muted,
              fontSize:12, fontWeight:600, cursor:"pointer",
              boxShadow:"0 1px 3px rgba(0,0,0,0.08)" }}>
            {l}
          </button>
        ))}
      </div>

      {tab==="render" && (
        <>
          <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16 }}>
            {[
              ["1","Push to GitHub","Open PowerShell in wardrobeai/. Run: git init && git add . && git commit -m 'initial' && git remote add origin https://github.com/yourname/wardrobeai.git && git push -u origin main"],
              ["2","Create Render service","render.com → New → Web Service → connect GitHub repo → select it"],
              ["3","Configure service","Root Directory: backend · Runtime: Python 3 · Instance Type: Free"],
              ["4","Set build command","pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu && pip install -r requirements.txt"],
              ["5","Set start command","gunicorn app:app --workers 2 --timeout 120"],
              ["6","Add env vars","Environment tab → add every variable from your .env file"],
              ["7","Deploy","Click 'Create Web Service'. Wait 3-5 min for build. Copy the .onrender.com URL."],
            ].map(([n,title,desc])=>(
              <div key={n} style={{ display:"flex", gap:14, alignItems:"flex-start",
                background:T.card, borderRadius:10, padding:"14px 18px",
                border:`1px solid ${T.border}`, boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
                <div style={{ width:28, height:28, borderRadius:8, background:T.accent,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:13, fontWeight:800, color:"white", flexShrink:0 }}>{n}</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:4 }}>{title}</div>
                  <div style={{ fontSize:12, color:T.muted, lineHeight:1.6 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
          <CodeBlock title="backend/render.yaml" code={`services:
  - type: web
    name: wardrobeai-api
    env: python
    region: singapore
    plan: starter
    rootDir: backend
    buildCommand: >
      pip install torch torchvision
      --index-url https://download.pytorch.org/whl/cpu &&
      pip install -r requirements.txt
    startCommand: gunicorn app:app --workers 2 --timeout 120
    envVars:
      - key: PYTHON_VERSION
        value: "3.11.0"`}/>
        </>
      )}

      {tab==="vercel" && (
        <>
          <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16 }}>
            {[
              ["1","Create frontend/.env.local","Add: VITE_API_URL=https://your-app.onrender.com/api"],
              ["2","Build test locally","cd frontend && npm run build — fix any errors before deploying"],
              ["3","Add vercel.json","Create frontend/vercel.json (see code below) — needed for SPA routing"],
              ["4","Connect to Vercel","vercel.com → New Project → Import from GitHub → select repo"],
              ["5","Configure","Root Directory: frontend · Framework preset: Vite"],
              ["6","Add env var","VITE_API_URL = https://your-app.onrender.com/api"],
              ["7","Deploy","Click Deploy. Your app will be live at your-app.vercel.app"],
            ].map(([n,title,desc])=>(
              <div key={n} style={{ display:"flex", gap:14, alignItems:"flex-start",
                background:T.card, borderRadius:10, padding:"14px 18px",
                border:`1px solid ${T.border}`, boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
                <div style={{ width:28, height:28, borderRadius:8, background:T.accentB,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:13, fontWeight:800, color:"white", flexShrink:0 }}>{n}</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:4 }}>{title}</div>
                  <div style={{ fontSize:12, color:T.muted, lineHeight:1.6 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
          <CodeBlock title="frontend/vercel.json" code={`{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options",        "value": "DENY" }
      ]
    }
  ]
}`}/>
        </>
      )}

      {tab==="env_prod" && (
        <>
          <InfoBox type="warn">
            In production, update GOOGLE_REDIRECT_URI to your Render URL. Example: https://wardrobeai-api.onrender.com/api/calendar/callback. Update this in Google Cloud Console too.
          </InfoBox>
          <div style={{ background:T.card, borderRadius:12, overflow:"hidden",
            border:`1px solid ${T.border}`, boxShadow:"0 1px 3px rgba(0,0,0,0.08)" }}>
            <div style={{ background:T.sidebar, padding:"10px 16px",
              display:"grid", gridTemplateColumns:"260px 1fr 80px" }}>
              {["Variable","Where to Get It","Required"].map(h=>(
                <div key={h} style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.05em" }}>{h}</div>
              ))}
            </div>
            {[
              ["MONGO_URI","Atlas → Connect → Drivers → copy string","Yes"],
              ["JWT_SECRET_KEY","python -c \"import secrets; print(secrets.token_hex(32))\"","Yes"],
              ["JWT_REFRESH_SECRET","Same command, different output","Yes"],
              ["CLOUDINARY_CLOUD_NAME","Cloudinary Dashboard","Yes"],
              ["CLOUDINARY_API_KEY","Cloudinary Dashboard","Yes"],
              ["CLOUDINARY_API_SECRET","Cloudinary Dashboard","Yes"],
              ["GOOGLE_CLIENT_ID","GCP Console → Credentials → OAuth Client","Yes"],
              ["GOOGLE_CLIENT_SECRET","Same credential as above","Yes"],
              ["GOOGLE_REDIRECT_URI","https://yourapp.onrender.com/api/calendar/callback","Yes"],
              ["FRONTEND_URL","https://yourapp.vercel.app","Yes"],
              ["VITE_API_URL (frontend)","https://yourapp.onrender.com/api","Yes"],
            ].map(([v,src,req],i)=>(
              <div key={v} style={{ display:"grid", gridTemplateColumns:"260px 1fr 80px",
                padding:"9px 16px", alignItems:"center",
                background:i%2===0?"white":"#fafafa",
                borderTop:"1px solid rgba(0,0,0,0.04)" }}>
                <div style={{ fontFamily:"monospace", fontSize:11, color:"#6366f1", fontWeight:600 }}>{v}</div>
                <div style={{ fontSize:12, color:T.muted }}>{src}</div>
                <div style={{ fontSize:12, fontWeight:600, color:req==="Yes"?T.accentR:T.accentG }}>{req}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab==="test" && (
        <>
          <InfoBox type="cmd">
            Run this after deploying. Replace the URL with your actual Render URL. All 5 checks must pass before you share the link.
          </InfoBox>
          <CodeBlock title="test_deploy.sh — run from PowerShell (Git Bash)" code={`#!/bin/bash
# Run: bash test_deploy.sh https://wardrobeai-api.onrender.com

API="\${1:-https://wardrobeai-api.onrender.com}/api"
PASS=0; FAIL=0

check() {
  local desc=\$1 got=\$2 want=\$3
  if [ "\$got" = "\$want" ]; then
    echo "✅  \$desc"; ((PASS++))
  else
    echo "❌  \$desc  (got=\$got, want=\$want)"; ((FAIL++))
  fi
}

# 1. API alive
check "API health" \\
  "$(curl -s -o /dev/null -w "%{http_code}" \$API/../)" "200"

# 2. Register
RESP=\$(curl -s -X POST \$API/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Test","email":"test99@test.com","password":"test1234"}')
HAS_TOKEN=\$(echo \$RESP | python -c "import sys,json; d=json.load(sys.stdin); print('yes' if 'access_token' in d else 'no')" 2>/dev/null)
check "Register returns token" "\$HAS_TOKEN" "yes"
TOKEN=\$(echo \$RESP | python -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)

# 3. Auth guard
check "Unauthenticated returns 401" \\
  "\$(curl -s -o /dev/null -w "%{http_code}" \$API/clothes)" "401"

# 4. Authenticated request
check "Authenticated GET /clothes" \\
  "\$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer \$TOKEN" \$API/clothes)" "200"

# 5. Empty wardrobe plan
check "Empty wardrobe plan returns 400" \\
  "\$(curl -s -o /dev/null -w "%{http_code}" \\
    -H "Authorization: Bearer \$TOKEN" "\$API/plan?week=2026-03-09")" "400"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  \$PASS passed · \$FAIL failed"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━"`}/>
        </>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [active,  setActive]  = useState("dashboard");
  const [checked, setChecked] = useState({});
  const [sideCollapsed, setSideCollapsed] = useState(false);

  const total = SCHED_DATA.reduce((s,p)=>s+p.tasks.length,0);
  const done  = Object.values(checked).filter(Boolean).length;

  const SECTION_MAP = {
    dashboard:    <SectionDashboard/>,
    setup:        <SectionSetup/>,
    models:       <SectionModels/>,
    color:        <SectionColor/>,
    nlp:          <SectionNLP/>,
    planner_algo: <SectionPlannerAlgo/>,
    dataset:      <SectionDataset/>,
    exporteval:   <SectionExportEval/>,
    config:       <SectionConfig/>,
    backend:      <SectionBackend/>,
    scheduler:    <SectionScheduler/>,
    hooks:        <SectionHooks/>,
    wardrobe:     <SectionWardrobe/>,
    planner_page: <SectionPlannerPage/>,
    frontend:     <SectionFrontend/>,
    deploy:       <SectionDeploy/>,
    schedule:     <SectionSchedule checked={checked} setChecked={setChecked}/>,
    tests:        <SectionTests/>,
  };

  return (
    <div style={{ display:"flex", minHeight:"100vh",
      fontFamily:"'DM Sans', system-ui, sans-serif",
      background:T.bg }}>

      {/* ── Mono Dark Sidebar ── */}
      <aside style={{ width: sideCollapsed ? 60 : 240, background:T.sidebar,
        flexShrink:0, display:"flex", flexDirection:"column",
        position:"sticky", top:0, height:"100vh", overflowY:"auto",
        overflowX:"hidden", transition:"width 0.25s ease",
        boxShadow:"2px 0 12px rgba(0,0,0,0.3)" }}>

        {/* Logo */}
        <div style={{ padding: sideCollapsed?"14px 0":"16px 20px",
          borderBottom:"1px solid rgba(255,255,255,0.06)",
          display:"flex", alignItems:"center", gap:10,
          justifyContent: sideCollapsed?"center":"flex-start" }}>
          <div style={{ width:32, height:32, borderRadius:8,
            background:`linear-gradient(135deg,${T.accent},${T.accentP})`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:14, fontWeight:900, color:"white", flexShrink:0 }}>W</div>
          {!sideCollapsed && (
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:"white", lineHeight:1 }}>WardrobeAI</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginTop:2 }}>Major Project</div>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {!sideCollapsed && (
          <div style={{ padding:"10px 20px 14px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.08em" }}>Progress</span>
              <span style={{ fontSize:10, color:T.accent, fontWeight:600, fontFamily:"monospace" }}>{done}/{total}</span>
            </div>
            <div style={{ height:3, borderRadius:99, background:"rgba(255,255,255,0.08)", overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${(done/total)*100}%`,
                background:`linear-gradient(90deg,${T.accent},${T.accentG})`,
                borderRadius:99, transition:"width 0.3s" }}/>
            </div>
          </div>
        )}

        {/* Nav Items */}
        <nav style={{ flex:1, paddingTop:8 }}>
          {GROUPS.map(group=>{
            const groupItems = NAV_SECTIONS.filter(n=>n.group===group);
            return (
              <div key={group}>
                {!sideCollapsed && (
                  <div style={{ padding:"12px 20px 4px", fontSize:9,
                    color:"rgba(255,255,255,0.3)", fontWeight:700,
                    textTransform:"uppercase", letterSpacing:"0.12em" }}>{group}</div>
                )}
                {groupItems.map(n=>{
                  const isActive = active===n.id;
                  return (
                    <button key={n.id} onClick={()=>setActive(n.id)}
                      title={sideCollapsed?n.label:undefined}
                      style={{ display:"flex", alignItems:"center", gap:10, width:"100%",
                        padding: sideCollapsed?"11px 0":"10px 20px",
                        justifyContent: sideCollapsed?"center":"flex-start",
                        background: isActive?"rgba(99,102,241,0.18)":"none",
                        border:"none",
                        borderLeft: isActive?`2px solid ${T.accent}`:"2px solid transparent",
                        cursor:"pointer", color:isActive?"white":"rgba(255,255,255,0.5)",
                        fontSize:13, fontWeight:isActive?600:400,
                        transition:"all 0.15s" }}>
                      <span style={{ fontSize:15, flexShrink:0 }}>{n.icon}</span>
                      {!sideCollapsed && n.label}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <button onClick={()=>setSideCollapsed(!sideCollapsed)}
          style={{ padding:"12px 0", background:"none", border:"none",
            borderTop:"1px solid rgba(255,255,255,0.06)",
            color:"rgba(255,255,255,0.3)", cursor:"pointer", fontSize:14,
            display:"flex", alignItems:"center", justifyContent:"center" }}>
          {sideCollapsed ? "→" : "←"}
        </button>
      </aside>

      {/* ── Main Content ── */}
      <main style={{ flex:1, overflowY:"auto", minWidth:0 }}>
        {/* Top bar */}
        <div style={{ background:"white", borderBottom:"1px solid rgba(0,0,0,0.06)",
          padding:"0 28px", height:56, display:"flex", alignItems:"center",
          justifyContent:"space-between", position:"sticky", top:0, zIndex:10,
          boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, color:T.muted }}>
            <span>WardrobeAI</span>
            <span>/</span>
            <span style={{ color:T.text, fontWeight:600 }}>
              {NAV_SECTIONS.find(n=>n.id===active)?.label}
            </span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ fontSize:11, color:T.muted, background:"rgba(0,0,0,0.04)",
              padding:"4px 10px", borderRadius:20 }}>
              HP 15s · i5-12th Gen · 8GB · Win11
            </div>
            <div style={{ width:32, height:32, borderRadius:"50%",
              background:`linear-gradient(135deg,${T.accent},${T.accentP})`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:12, fontWeight:700, color:"white" }}>A</div>
          </div>
        </div>

        {/* Page content */}
        <div style={{ padding:"28px 32px", maxWidth:1000, margin:"0 auto" }}>
          {SECTION_MAP[active]}
        </div>
      </main>
    </div>
  );
}
