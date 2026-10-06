"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, Eye, Users, MessageSquare, Link2, Gavel, Menu, Folder } from "lucide-react";
import { EVIDENCE, SUSPECTS, MESSAGES, MOTIVES, KEY, fresh, progress, canDeduce, tryConnect, GameState, Evidence } from "@/lib/game";

const NAV = [["overview", "Overview", Eye], ["evidence", "Evidence", Folder], ["suspects", "Suspects", Users], ["messages", "Messages", MessageSquare], ["connect", "Connect Clues", Link2], ["final", "Final Deduction", Gavel]] as const;
const BOOT = ["INITIALIZING SECURE TERMINAL...", "LOADING CASE DATABASE...", "VERIFYING ACCESS...", "ACCESS GRANTED."];

function Typed({ text, speed = 30 }: { text: string; speed?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => { setN(0); const i = setInterval(() => setN(v => (v < text.length ? v + 1 : v)), speed); return () => clearInterval(i); }, [text, speed]);
  return <span>{text.slice(0, n)}<span className="animate-pulse">▌</span></span>;
}

export default function Page() {
  const [s, setS] = useState<GameState | null>(null);
  const [tab, setTab] = useState("overview");
  const [menu, setMenu] = useState(false);
  const [open, setOpen] = useState<Evidence | null>(null);
  const [sel, setSel] = useState<string[]>([]);
  const [msg, setMsg] = useState("");
  const [pw, setPw] = useState(""); const [tries, setTries] = useState(3); const [pwMsg, setPwMsg] = useState("");
  const [bootStep, setBootStep] = useState(0);
  const [culprit, setCulprit] = useState(""); const [motive, setMotive] = useState(""); const [verdict, setVerdict] = useState("");

  useEffect(() => { try { const r = localStorage.getItem(KEY); setS(r ? JSON.parse(r) : fresh()); } catch { setS(fresh()); } }, []);
  useEffect(() => { if (s) try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} }, [s]);
  const started = s?.started;
  useEffect(() => { if (s && !started) { const i = setInterval(() => setBootStep(v => Math.min(v + 1, BOOT.length)), 900); return () => clearInterval(i); } }, [s === null, started]);
  if (!s) return null;

  if (!s.started) return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 font-mono text-emerald-300 text-center">
      <div className="h-24 text-sm text-left">{BOOT.slice(0, bootStep).map(l => <div key={l}>{l}</div>)}</div>
      {bootStep >= BOOT.length && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 max-w-xl">
        <div className="text-red-400 text-xs tracking-widest">CLASSIFICATION: CONFIDENTIAL</div>
        <h1 className="text-5xl font-bold">CASE 047</h1><h2 className="text-2xl tracking-widest"><Typed text="THE MISSING FILE" /></h2>
        <p className="text-slate-400">A confidential file disappeared from a secure office last night. One person knows what happened. Your job is to find them.</p>
        <button onClick={() => setS({ ...s, started: true, start: Date.now() })} className="border border-emerald-400 px-6 py-3 hover:bg-emerald-400/10 glow">[ START INVESTIGATION ]</button>
      </motion.div>}
    </main>);

  const has = (id: string) => s.found.includes(id);
  const clues = s.found.length;
  const reset = () => { localStorage.removeItem(KEY); setS(fresh()); setTab("overview"); setVerdict(""); setBootStep(0); };

  const doConnect = () => {
    const r = tryConnect(s, sel);
    if (r.ok) { setS(r.state); setMsg(`✓ CONNECTION VERIFIED — NEW INFORMATION UNLOCKED: Evidence #${EVIDENCE.find(e => e.id === r.unlocked)!.n}`); } else setMsg("CONNECTION INVALID. Try another combination.");
    setSel([]);
  };
  const attempt = () => {
    if (!open) return;
    if (pw.trim().toUpperCase() === open.answer) {
      setS({ ...s, found: s.found.includes("e7") ? s.found : [...s.found, "e7"] }); setPwMsg("ACCESS GRANTED — FILE DECRYPTED. Evidence #7 recovered."); setPw("");
    } else { const t = tries - 1; setTries(t); setPwMsg(t > 0 ? `ACCESS DENIED. Attempts remaining: ${t}` : "LOCKED OUT. Close and reopen to retry."); }
  };
  const submit = () => {
    if (culprit === "Daniel Brooks" && motive === MOTIVES[0]) { setS({ ...s, solved: true }); setVerdict("solved"); }
    else { setS({ ...s, wrong: s.wrong + 1 }); setVerdict("wrong"); }
  };
  const mins = Math.max(1, Math.round((Date.now() - s.start) / 60000));
  const acc = Math.max(0, 100 - s.wrong * 25);

  const Card = ({ e }: { e: Evidence }) => {
    const unlocked = has(e.id);
    return <motion.button layout whileHover={{ y: -2 }} onClick={() => { if (tab === "connect") { if (unlocked) setSel(p => p.includes(e.id) ? p.filter(x => x !== e.id) : [...p, e.id]); } else if (unlocked) { setOpen(e); setPwMsg(""); setTries(3); } else setMsg("Locked: gather more clues first."); }}
      className={`panel p-3 text-left w-full ${sel.includes(e.id) ? "ring-2 ring-cyan-400 glow" : ""} ${unlocked ? "" : "opacity-50"}`}>
      <div className="font-mono text-xs text-emerald-400">EVIDENCE #{String(e.n).padStart(2, "0")}</div>
      <div className="font-semibold flex items-center gap-2">{unlocked ? e.title : <><Lock size={14} /> UNDISCOVERED</>}</div>
      {unlocked && <div className="text-xs text-slate-400">{e.at} · {e.time}</div>}
    </motion.button>;
  };

  return (
    <div className="min-h-screen md:flex">
      <aside className={`${menu ? "block" : "hidden"} md:block md:w-60 md:min-h-screen p-4 panel rounded-none border-0 border-r flex-shrink-0`}>
        <div className="font-mono mb-4"><div className="text-emerald-300 font-bold">CASE 047</div><div className="text-xs text-slate-500">THE MISSING FILE</div></div>
        <nav className="space-y-1">{NAV.map(([id, label, Icon]) => (
          <button key={id} onClick={() => { setTab(id); setMenu(false); setMsg(""); }} className={`flex items-center gap-2 w-full px-3 py-3 rounded text-sm ${tab === id ? "bg-emerald-400/10 text-emerald-300 border border-emerald-400/40" : "text-slate-400 hover:text-white"}`}><Icon size={16} />{label}{id === "final" && !canDeduce(s) && <Lock size={12} className="ml-auto" />}</button>))}</nav>
        <div className="mt-6 font-mono text-xs"><div>CASE STATUS</div><div className="h-2 bg-slate-800 rounded mt-1"><motion.div className="h-2 bg-emerald-400 rounded" animate={{ width: `${progress(s)}%` }} /></div>{progress(s)}%<div className="mt-1">CLUES FOUND: {clues}/{EVIDENCE.length}</div>
          <button onClick={reset} className="mt-3 text-red-400 underline">Reset case</button></div>
      </aside>
      <main className="flex-1 min-w-0 p-4 md:p-8">
        <header className="flex items-center gap-3 mb-6 font-mono text-xs text-slate-400 flex-wrap">
          <button className="md:hidden panel p-2" onClick={() => setMenu(!menu)} aria-label="menu"><Menu size={18} /></button>
          <span>CLUES {clues}/{EVIDENCE.length}</span><span>CONNECTIONS {s.conns.length}</span><span>PROGRESS {progress(s)}%</span>
        </header>
        <AnimatePresence mode="wait"><motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          {tab === "overview" && <div className="space-y-4 max-w-3xl">
            <h1 className="text-3xl font-bold font-mono">CASE 047: THE MISSING FILE</h1>
            <div className="panel p-4 font-mono text-sm space-y-1"><div>STATUS: <span className="text-emerald-400">ACTIVE</span></div><div>INCIDENT: October 5, 2026 · 23:47</div><div>LOCATION: Blackwood Research Center</div></div>
            <p className="text-slate-300">A confidential research file disappeared from a locked office between 23:30 and 00:15. Four people were inside the building. One of them is lying.</p>
            <div className="grid sm:grid-cols-2 gap-3">{SUSPECTS.map(x => <div key={x.name} className="panel p-3"><div className="font-semibold">{x.name}</div><div className="text-xs text-slate-400">{x.role} · Last seen: {x.loc}</div><div className="text-xs mt-1">Suspicion: {x.suspicion}</div></div>)}</div>
            <button onClick={() => setTab("evidence")} className="border border-emerald-400 px-5 py-3 font-mono">BEGIN INVESTIGATION</button></div>}
          {tab === "evidence" && <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{EVIDENCE.map(e => <Card key={e.id} e={e} />)}</div>}
          {tab === "suspects" && <div className="grid lg:grid-cols-2 gap-4">{SUSPECTS.map(x => <div key={x.name} className="panel p-4 space-y-2">
            <div className="flex items-center gap-3"><div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center font-bold">{x.name[0]}</div><div><div className="font-semibold">{x.name}, {x.age}</div><div className="text-xs text-slate-400">{x.role}</div></div></div>
            <p className="text-sm text-slate-400">{x.bio}</p><p className="font-mono text-sm">"{x.statement}"</p>
            <div className="text-xs text-emerald-400">Connected evidence: {x.links.filter(has).map(l => `#${EVIDENCE.find(e => e.id === l)!.n}`).join(", ") || "none found yet"}</div>
            {x.name === "Daniel Brooks" && has("e1") && has("e5") && <div className="text-xs text-red-400">⚠ CONTRADICTION: card used at 23:41 and security log edited by his account.</div>}
            {x.name === "Maya Carter" && has("e4") && <div className="text-xs text-red-400">Statement partly confirmed by café receipt.</div>}
            {x.name === "Ethan Miller" && has("e8") && <div className="text-xs text-emerald-400">✓ Alibi confirmed by server records.</div>}</div>)}</div>}
          {tab === "messages" && <div className="panel p-4 font-mono text-sm space-y-2 max-w-2xl">{MESSAGES.map((m, i) => !m.need || has(m.need) ? <div key={i} className={m.who === "UNKNOWN" ? "text-red-400" : ""}>[{m.t}] {m.who}: {m.text}</div> : <div key={i} className="text-slate-600 flex gap-2 items-center"><Lock size={12} />[{m.t}] LOCKED — requires more evidence</div>)}</div>}
          {tab === "connect" && <div className="space-y-4"><p className="text-slate-400 text-sm">Select two evidence cards and connect them. Locked cards can't be selected.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">{EVIDENCE.map(e => <Card key={e.id} e={e} />)}</div>
            <button disabled={sel.length < 2} onClick={doConnect} className="border border-cyan-400 px-5 py-3 font-mono disabled:opacity-30">CONNECT ({sel.length})</button>
            <div className="mt-2 text-sm font-mono">{s.conns.map(c => <div key={c} className="text-emerald-400">⟷ {c.split("|").map(i => "#" + EVIDENCE.find(e => e.id === i)!.n).join(" ⟷ ")}</div>)}</div></div>}
          {tab === "final" && (!canDeduce(s) ? <p className="font-mono text-slate-400">LOCKED — decrypt the USB drive first.</p> : s.solved ? <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="panel p-6 glow font-mono space-y-2 max-w-xl">
            <div className="text-3xl text-emerald-400">CASE SOLVED ✓</div><div>CULPRIT: DANIEL BROOKS</div><div>MOTIVE: He stole the file to sell confidential research information.</div><div>TIME: {mins} min · CLUES: {clues}/{EVIDENCE.length} · ACCURACY: {acc}%</div><div className="text-amber-300">RANK: {acc === 100 ? "MASTER DETECTIVE" : "DETECTIVE"}</div></motion.div> :
            <div className="space-y-4 max-w-xl"><h2 className="text-2xl font-mono">Who stole the missing file?</h2>
              <div className="grid grid-cols-2 gap-2">{SUSPECTS.map(x => <button key={x.name} onClick={() => setCulprit(x.name)} className={`panel p-3 ${culprit === x.name ? "ring-2 ring-emerald-400" : ""}`}>{x.name.split(" ")[0].toUpperCase()}</button>)}</div>
              <h3 className="font-mono">Why?</h3><div className="space-y-2">{MOTIVES.map(m => <button key={m} onClick={() => setMotive(m)} className={`panel p-3 block w-full text-left text-sm ${motive === m ? "ring-2 ring-emerald-400" : ""}`}>{m}</button>)}</div>
              <button disabled={!culprit || !motive} onClick={submit} className="border border-red-400 px-5 py-3 font-mono disabled:opacity-30">SUBMIT THEORY</button>
              {verdict === "wrong" && <div className="text-red-400 font-mono">CASE UNSOLVED — Your theory does not match the evidence. Review the case and try again.</div>}</div>)}
          {msg && tab !== "final" && <div className="mt-4 font-mono text-sm text-cyan-300"><Typed text={msg} speed={15} /></div>}
        </motion.div></AnimatePresence>
      </main>
      <AnimatePresence>{open && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => setOpen(null)}>
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="panel p-5 max-w-md w-full font-mono text-sm space-y-2" onClick={e => e.stopPropagation()}>
          <div className="text-emerald-400">EVIDENCE #{String(open.n).padStart(2, "0")}</div><h3 className="text-xl">{open.title.toUpperCase()}</h3>
          <div>FOUND AT: {open.at}</div><div>TIME: {open.time}</div><p className="text-slate-300">{open.text}</p>
          {open.id === "e6" && !has("e7") && <div className="space-y-2"><div className="text-amber-300">STATUS: REQUIRES PASSWORD · Hint: {open.hint}</div>
            <input value={pw} onChange={e => setPw(e.target.value)} disabled={tries <= 0} placeholder="PASSWORD" className="w-full bg-black border border-slate-600 p-2" />
            <button onClick={attempt} disabled={tries <= 0} className="border border-emerald-400 px-4 py-2">[ ATTEMPT ACCESS ]</button></div>}
          {open.id === "e6" && <div className="text-cyan-300">{pwMsg}</div>}
          <button onClick={() => setOpen(null)} className="text-slate-400 underline">close</button></motion.div></motion.div>}</AnimatePresence>
    </div>);
}
