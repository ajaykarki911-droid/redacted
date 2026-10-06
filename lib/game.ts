export interface Evidence { id: string; n: number; title: string; at: string; time: string; text: string; hint?: string; answer?: string; }
export interface Suspect { name: string; role: string; age: number; statement: string; suspicion: string; loc: string; bio: string; links: string[]; }
export interface Message { t: string; who: string; text: string; need?: string; }
export interface GameState { started: boolean; found: string[]; conns: string[]; solved: boolean; wrong: number; start: number; }

export const EVIDENCE: Evidence[] = [
  { id: "e1", n: 1, title: "Access Card Record", at: "Archive Room door", time: "23:41", text: "23:41 — Card #0412 (Daniel Brooks) used at the archive room door. Brooks stated nobody entered after 11 PM." },
  { id: "e2", n: 2, title: "Security Camera Screenshot", at: "Corridor B", time: "23:43", text: "23:43 — Figure in a dark uniform enters the archive room. Face hidden. Metadata timestamp reads 23:34 — clock drift or an edit?" },
  { id: "e3", n: 3, title: "Phone Message", at: "Recovered from Archive Room", time: "23:44", text: "23:44 — \"The door is open.\" Sent from a burner number to a contact saved as 'M.B.'" },
  { id: "e4", n: 4, title: "Coffee Receipt", at: "Maya's coat pocket", time: "23:19", text: "Night Owl Café, 23:19. One latte. Maya Carter was across the street when the incident began — her statement holds." },
  { id: "e5", n: 5, title: "Security Log", at: "Security Room terminal", time: "23:38–23:50", text: "The log has a 12 minute gap, edited from the security admin account. Only Brooks holds that login." },
  { id: "e6", n: 6, title: "USB Drive", at: "Archive Room", time: "00:18", text: "A damaged USB drive under the desk. It is encrypted.", hint: "The first place you met.", answer: "BLACKWOOD" },
  { id: "e7", n: 7, title: "Deleted Email", at: "Recovered from USB", time: "22:05", text: "From D. Brooks to a buyer at Meridian Biotech: 'I can deliver the full research file Friday. Half payment up front.'" },
  { id: "e8", n: 8, title: "Server Login Record", at: "Server Room", time: "23:10–00:05", text: "Ethan Miller logged into the server continuously throughout the window. Alibi confirmed." },
];
export const OPEN = ["e1", "e2", "e4", "e5", "e8"];
export const CONNS: Record<string, string> = { "e1|e2": "e3", "e3|e5": "e6" };
export const SUSPECTS: Suspect[] = [
  { name: "Maya Carter", role: "Research Assistant", age: 24, statement: "I left the building at 11:20 PM.", suspicion: "Medium", loc: "Café across the street", bio: "Calm, intelligent, extremely careful.", links: ["e4"] },
  { name: "Daniel Brooks", role: "Security Officer", age: 41, statement: "No one entered the archive room after 11 PM.", suspicion: "High", loc: "Security Room", bio: "Experienced and confident.", links: ["e1", "e2", "e5", "e7"] },
  { name: "Olivia Reed", role: "Project Manager", age: 36, statement: "I was in my office the entire night.", suspicion: "Medium", loc: "Olivia's Office", bio: "Professional and defensive.", links: [] },
  { name: "Ethan Miller", role: "IT Technician", age: 29, statement: "I was fixing a server issue downstairs.", suspicion: "Low", loc: "Server Room", bio: "Quiet and technical.", links: ["e8"] },
];
export const MESSAGES: Message[] = [
  { t: "23:12", who: "Maya", text: "Are you still at the building?" },
  { t: "23:14", who: "Ethan", text: "Yeah." },
  { t: "23:15", who: "Maya", text: "Did you see Daniel?" },
  { t: "23:16", who: "Ethan", text: "No. Why?" },
  { t: "23:30", who: "Ethan", text: "Archive door's been propped open. Weird.", need: "e3" },
  { t: "23:52", who: "UNKNOWN", text: "He never went home. Check the USB.", need: "e5" },
];
export const MOTIVES = ["To sell confidential research information", "To destroy evidence of a safety violation", "Personal revenge against the project manager", "To cover up a server breach"];
export const KEY = "case047-save";
export const fresh = (): GameState => ({ started: false, found: [...OPEN], conns: [], solved: false, wrong: 0, start: Date.now() });
export const progress = (s: GameState) => Math.round(((s.found.length + s.conns.length) / (EVIDENCE.length + Object.keys(CONNS).length)) * 100);
export const canDeduce = (s: GameState) => s.found.includes("e7");
export function tryConnect(s: GameState, ids: string[]): { ok: boolean; state: GameState; unlocked?: string } {
  const k = [...ids].sort().join("|"); const u = CONNS[k];
  if (!u || s.conns.includes(k)) return { ok: false, state: s };
  return { ok: true, unlocked: u, state: { ...s, conns: [...s.conns, k], found: s.found.includes(u) ? s.found : [...s.found, u] } };
}
