import { useState, useMemo } from “react”;

const uid = () => Math.random().toString(36).slice(2, 8);
const AGE_FACTOR = a => a <= 35 ? 1.0 : a <= 45 ? 0.92 : a <= 55 ? 0.82 : 0.70;
const SIZE_PTS  = { S: 1.0, M: 1.6, L: 2.4 };
const TYPE_MULT = { bleibe: 0.55, abreise: 1.0 };
const roomWeight = r => SIZE_PTS[r.size] * TYPE_MULT[r.type];
const staffCap   = s => Math.max(0, s.hoursEnd - s.hoursStart) * AGE_FACTOR(s.age);

const SIZE_L = { S: “Klein”, M: “Mittel”, L: “Groß” };
const TYPE_L = { bleibe: “Bleibereinigung”, abreise: “Abreisereinigung” };
const SIZE_C = { S: “#52b788”, M: “#f4a261”, L: “#e76f51” };
const TYPE_C = { bleibe: “#4cc9f0”, abreise: “#e05c5c” };

function distribute(staff, rooms) {
if (!staff.length || !rooms.length)
return { assigned: {}, loads: {}, targets: {}, caps: {} };
const caps    = Object.fromEntries(staff.map(s => [s.id, staffCap(s)]));
const totalC  = Object.values(caps).reduce((a, b) => a + b, 0);
const totalW  = rooms.reduce((a, r) => a + roomWeight(r), 0);
const targets = Object.fromEntries(staff.map(s => [s.id, (caps[s.id] / totalC) * totalW]));
const assigned = Object.fromEntries(staff.map(s => [s.id, []]));
const loads    = Object.fromEntries(staff.map(s => [s.id, 0]));
const sorted   = […rooms].sort((a, b) => roomWeight(b) - roomWeight(a));
for (const room of sorted) {
let best = null, best$ = -Infinity;
for (const s of staff) {
const $ = targets[s.id] - loads[s.id];
if ($ > best$) { best$ = $; best = s; }
}
assigned[best.id].push(room);
loads[best.id] += roomWeight(room);
}
return { assigned, loads, targets, caps };
}

const INIT_STAFF = [
{ id: uid(), name: “Maria K.”,  age: 42, hoursStart: 7,  hoursEnd: 15 },
{ id: uid(), name: “Jana L.”,   age: 29, hoursStart: 8,  hoursEnd: 16 },
{ id: uid(), name: “Beate W.”,  age: 57, hoursStart: 7,  hoursEnd: 13 },
{ id: uid(), name: “Petra H.”,  age: 48, hoursStart: 7,  hoursEnd: 15 },
];
const INIT_ROOMS = [
{ id: uid(), number: “101”, size: “S”, type: “bleibe”   },
{ id: uid(), number: “102”, size: “M”, type: “abreise”  },
{ id: uid(), number: “103”, size: “L”, type: “abreise”  },
{ id: uid(), number: “104”, size: “M”, type: “bleibe”   },
{ id: uid(), number: “201”, size: “S”, type: “bleibe”   },
{ id: uid(), number: “202”, size: “L”, type: “abreise”  },
{ id: uid(), number: “203”, size: “M”, type: “abreise”  },
{ id: uid(), number: “204”, size: “S”, type: “bleibe”   },
{ id: uid(), number: “301”, size: “M”, type: “abreise”  },
{ id: uid(), number: “302”, size: “L”, type: “bleibe”   },
];

const inp = {
background:”#0d0d14”, border:“1px solid #2d2d3a”, borderRadius:7,
color:”#e8e4da”, padding:“7px 10px”, fontSize:13, fontFamily:“inherit”,
outline:“none”, width:“100%”, boxSizing:“border-box”,
};
const TI = ({ value, onChange, placeholder, type=“text”, min, max }) =>
<input style={inp} type={type} value={value}
onChange={e => onChange(e.target.value)} placeholder={placeholder} min={min} max={max} />;

const Sel = ({ value, onChange, options }) =>
<select style={{ …inp, cursor:“pointer” }} value={value} onChange={e => onChange(e.target.value)}>
{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
</select>;

function Btn({ onClick, children, v=“gold”, sm, disabled }) {
const map = {
gold:  { bg:”#c9a96e”,     cl:”#1a1a1a”, br:“none” },
red:   { bg:”#c94f4f22”,   cl:”#e07070”, br:“1px solid #c94f4f44” },
blue:  { bg:”#60a5fa22”,   cl:”#7fc2ff”, br:“1px solid #60a5fa44” },
green: { bg:”#52b78822”,   cl:”#52b788”, br:“1px solid #52b78844” },
ghost: { bg:“transparent”, cl:”#666”,    br:“1px solid #333” },
};
const { bg, cl, br } = map[v] || map.gold;
return (
<button onClick={onClick} disabled={disabled} style={{
background:bg, color:cl, border:br, borderRadius:7,
padding: sm ? “4px 10px” : “8px 18px”,
fontSize: sm ? 11 : 13, fontWeight:700,
cursor: disabled ? “default” : “pointer”,
fontFamily:“inherit”, letterSpacing:.3,
opacity: disabled ? .4 : 1, transition:“opacity .15s”, whiteSpace:“nowrap”,
}}
onMouseEnter={e => !disabled && (e.currentTarget.style.opacity = .75)}
onMouseLeave={e => (e.currentTarget.style.opacity = disabled ? .4 : 1)}
>{children}</button>
);
}

const Badge = ({ color, children }) =>
<span style={{ background:color+“22”, color, border:`1px solid ${color}44`,
borderRadius:4, padding:“1px 6px”, fontSize:10, fontWeight:700, letterSpacing:.3 }}>{children}</span>;

const Field = ({ label, children }) =>

  <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
    <label style={{ fontSize:10, fontWeight:600, color:"#666", letterSpacing:.8, textTransform:"uppercase" }}>{label}</label>
    {children}
  </div>;

function FBar({ load, target }) {
const pct = target > 0 ? Math.min((load / target) * 100, 130) : 0;
const cl  = pct > 110 ? “#e05c5c” : pct < 80 ? “#f4a261” : “#52b788”;
return (
<div>
<div style={{ background:”#111”, borderRadius:3, height:5, overflow:“hidden”, marginBottom:3 }}>
<div style={{ width:`${Math.min(pct,100)}%`,
background:`linear-gradient(90deg,${cl}88,${cl})`,
height:“100%”, borderRadius:3, transition:“width .4s” }} />
</div>
<div style={{ fontSize:10, color:cl, fontWeight:700 }}>
{Math.round(pct)}% {pct>110?“⚠ Überlastet”:pct<80?“⬇ Unterbeschäftigt”:“✓ Ausgewogen”}
</div>
</div>
);
}

const card = { background:”#1c1c22”, border:“1px solid #2e2e38”, borderRadius:14, overflow:“hidden”, marginBottom:16 };

function CardHead({ label, color, sub }) {
return (
<div style={{ padding:“11px 18px”,
background:`linear-gradient(90deg,${color}14 0%,transparent 100%)`,
borderBottom:“1px solid #2e2e38”, display:“flex”, alignItems:“center”, gap:8 }}>
<span style={{ width:6, height:6, borderRadius:“50%”, background:color, display:“inline-block”, flexShrink:0 }} />
<span style={{ fontFamily:”‘Playfair Display’,serif”, fontWeight:700, color, fontSize:14 }}>{label}</span>
{sub && <span style={{ fontSize:11, color:”#555” }}>{sub}</span>}
</div>
);
}

// ── Inline edit row ───────────────────────────────────────────────────────────
function EditRow({ s, onSave, onCancel }) {
const [d, setD] = useState({ …s });
const f = k => v => setD(p => ({ …p, [k]: v }));
return (
<div style={{ background:”#111827”, border:“1px solid #c9a96e66”,
borderRadius:10, padding:“14px 16px”, display:“flex”, flexDirection:“column”, gap:12 }}>
<div style={{ fontSize:11, color:”#c9a96e”, fontWeight:700, letterSpacing:.5, textTransform:“uppercase” }}>
✎ Mitarbeiter bearbeiten
</div>
<div style={{ display:“grid”, gridTemplateColumns:“2fr 1fr 1fr 1fr”, gap:10 }}>
<Field label="Name">
<TI value={d.name} onChange={f(“name”)} placeholder=“Name” />
</Field>
<Field label="Alter">
<TI type=“number” min={16} max={70} value={d.age} onChange={f(“age”)} />
</Field>
<Field label="Beginn (Uhr)">
<TI type=“number” min={0} max={23} value={d.hoursStart} onChange={f(“hoursStart”)} />
</Field>
<Field label="Ende (Uhr)">
<TI type=“number” min={0} max={24} value={d.hoursEnd} onChange={f(“hoursEnd”)} />
</Field>
</div>
<div style={{ display:“flex”, gap:8 }}>
<Btn v=“green” sm onClick={() => onSave({ …d, age:+d.age, hoursStart:+d.hoursStart, hoursEnd:+d.hoursEnd })}>
✓ Speichern
</Btn>
<Btn v="ghost" sm onClick={onCancel}>Abbrechen</Btn>
</div>
</div>
);
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
const [staff,   setStaff]   = useState(INIT_STAFF);
const [rooms,   setRooms]   = useState(INIT_ROOMS);
const [present, setPresent] = useState(() => Object.fromEntries(INIT_STAFF.map(s => [s.id, true])));
const [editId,  setEditId]  = useState(null);
const [tab,     setTab]     = useState(“plan”);
const [nStaff,  setNStaff]  = useState({ name:””, age:35, hoursStart:7, hoursEnd:15 });
const [nRoom,   setNRoom]   = useState({ number:””, size:“M”, type:“bleibe” });

const activeStaff = useMemo(() => staff.filter(s => present[s.id]), [staff, present]);

const { assigned, loads, targets } = useMemo(
() => distribute(activeStaff, rooms), [activeStaff, rooms]
);

const fairness = useMemo(() => {
if (!activeStaff.length || !Object.keys(loads).length) return 100;
const diffs = activeStaff.map(s =>
Math.abs((loads[s.id]||0) - (targets[s.id]||0)) / Math.max(targets[s.id]||1, 0.01)
);
return Math.max(0, Math.round((1 - diffs.reduce((a,b)=>a+b,0)/diffs.length) * 100));
}, [activeStaff, loads, targets]);

const fColor = fairness >= 90 ? “#52b788” : fairness >= 70 ? “#f4a261” : “#e05c5c”;
const today  = new Date().toLocaleDateString(“de-DE”, { weekday:“long”, day:“numeric”, month:“long”, year:“numeric” });

const addStaff = () => {
if (!nStaff.name.trim()) return;
const s = { …nStaff, id:uid(), age:+nStaff.age, hoursStart:+nStaff.hoursStart, hoursEnd:+nStaff.hoursEnd };
setStaff(p => […p, s]);
setPresent(p => ({ …p, [s.id]: true }));
setNStaff({ name:””, age:35, hoursStart:7, hoursEnd:15 });
};
const removeStaff = id => {
setStaff(p => p.filter(s => s.id !== id));
setPresent(p => { const n={…p}; delete n[id]; return n; });
if (editId === id) setEditId(null);
};
const saveStaff = updated => {
setStaff(p => p.map(s => s.id === updated.id ? updated : s));
setEditId(null);
};
const togglePresent = id => setPresent(p => ({ …p, [id]: !p[id] }));
const addRoom = () => {
if (!nRoom.number.trim()) return;
setRooms(p => […p, { …nRoom, id:uid() }]);
setNRoom({ number:””, size:“M”, type:“bleibe” });
};

return (
<div style={{ minHeight:“100vh”, background:”#13131a”, color:”#e8e4da”,
fontFamily:”‘DM Sans’,‘Segoe UI’,sans-serif”, fontSize:14 }}>
<style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;600;700&display=swap'); *{box-sizing:border-box;} ::-webkit-scrollbar{width:5px;background:#111;} ::-webkit-scrollbar-thumb{background:#333;border-radius:3px;} input[type=number]::-webkit-inner-spin-button{opacity:.4;}`}</style>

```
  {/* Header */}
  <div style={{ borderBottom:"1px solid #2a2a35", padding:"15px 26px",
    display:"flex", alignItems:"center", justifyContent:"space-between",
    background:"linear-gradient(180deg,#1a1a24 0%,transparent 100%)" }}>
    <div>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:900,
        color:"#c9a96e", letterSpacing:.4 }}>Zimmerservice Planer</div>
      <div style={{ fontSize:11, color:"#555", marginTop:2 }}>{today}</div>
    </div>
    <div style={{ textAlign:"right" }}>
      <div style={{ fontSize:10, color:"#555", marginBottom:1 }}>Fairness-Score</div>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:26,
        fontWeight:900, color:fColor, lineHeight:1 }}>{fairness}%</div>
    </div>
  </div>

  {/* Stats */}
  <div style={{ display:"flex", borderBottom:"1px solid #2a2a35", background:"#111118" }}>
    {[
      { l:"Anwesend",         v:`${activeStaff.length}/${staff.length}`, c:"#c9a96e" },
      { l:"Zimmer heute",     v:rooms.length,                             c:"#60a5fa" },
      { l:"Bleibereinigung",  v:rooms.filter(r=>r.type==="bleibe").length, c:"#4cc9f0" },
      { l:"Abreisereinigung", v:rooms.filter(r=>r.type==="abreise").length, c:"#e05c5c" },
      { l:"Gesamtlast",       v:rooms.reduce((a,r)=>a+roomWeight(r),0).toFixed(1)+" Pkt", c:"#a78bfa" },
    ].map(s => (
      <div key={s.l} style={{ flex:1, padding:"8px 13px", borderRight:"1px solid #2a2a35" }}>
        <div style={{ fontSize:9, color:"#444", textTransform:"uppercase", letterSpacing:.8 }}>{s.l}</div>
        <div style={{ fontSize:17, fontWeight:700, color:s.c,
          fontFamily:"'Playfair Display',serif", marginTop:1 }}>{s.v}</div>
      </div>
    ))}
  </div>

  {/* Tabs */}
  <div style={{ display:"flex", borderBottom:"1px solid #2a2a35", padding:"0 18px" }}>
    {[["plan","📋 Verteilungsplan"],["personal","👤 Personal"],["rooms","🛏 Zimmer"]].map(([k,l]) => (
      <button key={k} onClick={() => setTab(k)} style={{
        background:"none", border:"none", cursor:"pointer",
        padding:"10px 15px", fontSize:13, fontWeight:600, fontFamily:"inherit",
        color: tab===k ? "#c9a96e" : "#555",
        borderBottom: tab===k ? "2px solid #c9a96e" : "2px solid transparent",
        transition:"color .15s",
      }}>{l}</button>
    ))}
  </div>

  <div style={{ padding:"18px 22px", maxWidth:1100, margin:"0 auto" }}>

    {/* ══ PLAN ══════════════════════════════════════════════════════════ */}
    {tab==="plan" && (
      <div>
        {activeStaff.length === 0 ? (
          <div style={{ textAlign:"center", padding:60, color:"#555" }}>
            Keine Mitarbeiter anwesend.<br/>
            <span style={{ color:"#c9a96e" }}>→ Tab „Personal" → Anwesenheit aktivieren</span>
          </div>
        ) : (
          <>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))", gap:14 }}>
              {activeStaff.map(s => {
                const sRooms = assigned[s.id] || [];
                const load   = loads[s.id] || 0;
                const target = targets[s.id] || 0;
                return (
                  <div key={s.id} style={{ background:"#1c1c22", border:"1px solid #2e2e38",
                    borderRadius:13, overflow:"hidden" }}>
                    <div style={{ padding:"12px 15px",
                      background:"linear-gradient(90deg,#c9a96e12 0%,transparent 100%)",
                      borderBottom:"1px solid #2e2e38" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                        <div>
                          <div style={{ fontFamily:"'Playfair Display',serif",
                            fontSize:15, fontWeight:700, color:"#e8e4da" }}>{s.name}</div>
                          <div style={{ fontSize:11, color:"#666", marginTop:2 }}>
                            {s.age} J. · {s.hoursStart}:00–{s.hoursEnd}:00 · ×{AGE_FACTOR(s.age).toFixed(2)}
                          </div>
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontSize:22, fontWeight:900, color:"#c9a96e",
                            fontFamily:"'Playfair Display',serif", lineHeight:1 }}>{sRooms.length}</div>
                          <div style={{ fontSize:9, color:"#555" }}>Zimmer</div>
                        </div>
                      </div>
                      <div style={{ marginTop:9 }}><FBar load={load} target={target} /></div>
                    </div>
                    <div style={{ padding:"10px 13px", display:"flex", flexDirection:"column", gap:5 }}>
                      {sRooms.length === 0 && <span style={{ color:"#444", fontSize:12 }}>Keine Zimmer</span>}
                      {sRooms.map(r => (
                        <div key={r.id} style={{ display:"flex", alignItems:"center",
                          justifyContent:"space-between", background:"#0d0d14",
                          border:"1px solid #222", borderRadius:7, padding:"5px 10px" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <span style={{ fontFamily:"'Playfair Display',serif",
                              fontSize:14, fontWeight:700, color:"#c9a96e" }}>{r.number}</span>
                            <Badge color={SIZE_C[r.size]}>{SIZE_L[r.size]}</Badge>
                            <Badge color={TYPE_C[r.type]}>{r.type==="bleibe"?"Bleibe":"Abreise"}</Badge>
                          </div>
                          <span style={{ fontSize:10, color:"#444" }}>{roomWeight(r).toFixed(1)} Pkt</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop:18, background:"#1c1c22", border:"1px solid #2e2e38",
              borderRadius:11, padding:14, display:"flex", flexWrap:"wrap", gap:20 }}>
              <div>
                <div style={{ fontSize:10, color:"#555", textTransform:"uppercase", letterSpacing:.7, marginBottom:6 }}>Gewichtung</div>
                <div style={{ display:"flex", gap:10, flexWrap:"wrap", fontSize:11 }}>
                  {Object.entries(SIZE_PTS).map(([s,p]) => <span key={s} style={{ color:SIZE_C[s] }}>{SIZE_L[s]} {p}Pkt</span>)}
                  <span style={{ color:"#333" }}>·</span>
                  <span style={{ color:TYPE_C.bleibe }}>Bleibe ×0.55</span>
                  <span style={{ color:TYPE_C.abreise }}>Abreise ×1.0</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize:10, color:"#555", textTransform:"uppercase", letterSpacing:.7, marginBottom:6 }}>Altersfaktor</div>
                <div style={{ display:"flex", gap:10, flexWrap:"wrap", fontSize:11 }}>
                  {[["≤35","1.00"],["36–45","0.92"],["46–55","0.82"],["56+","0.70"]].map(([r,f]) =>
                    <span key={r}>{r}: ×{f}</span>)}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    )}

    {/* ══ PERSONAL ══════════════════════════════════════════════════════ */}
    {tab==="personal" && (
      <div>
        {/* Anwesenheit */}
        <div style={card}>
          <CardHead label="Anwesenheit heute" color="#52b788"
            sub={`${activeStaff.length} von ${staff.length} anwesend`} />
          <div style={{ padding:"14px 16px", display:"flex", flexWrap:"wrap", gap:10 }}>
            {staff.length === 0 && <span style={{ color:"#444", fontSize:12 }}>Noch kein Personal.</span>}
            {staff.map(s => {
              const on = !!present[s.id];
              return (
                <button key={s.id} onClick={() => togglePresent(s.id)} style={{
                  display:"flex", alignItems:"center", gap:10,
                  background: on ? "#52b78814" : "#15151c",
                  border: `1px solid ${on ? "#52b78855" : "#2a2a35"}`,
                  borderRadius:10, padding:"10px 14px",
                  cursor:"pointer", transition:"all .2s", fontFamily:"inherit",
                }}>
                  <div style={{
                    width:32, height:32, borderRadius:"50%", flexShrink:0,
                    background: on ? "#52b78828" : "#1e1e26",
                    border: `2px solid ${on ? "#52b788" : "#333"}`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:13, fontWeight:700, color: on ? "#52b788" : "#555",
                    transition:"all .2s",
                  }}>{s.name[0]}</div>
                  <div style={{ textAlign:"left" }}>
                    <div style={{ fontWeight:700, fontSize:13, color: on ? "#e8e4da" : "#555", transition:"color .2s" }}>
                      {s.name}
                    </div>
                    <div style={{ fontSize:10, color: on ? "#777" : "#444", marginTop:1 }}>
                      {s.hoursStart}:00–{s.hoursEnd}:00 · {s.age} J.
                    </div>
                  </div>
                  <div style={{
                    width:18, height:18, borderRadius:5, flexShrink:0,
                    background: on ? "#52b788" : "transparent",
                    border: `2px solid ${on ? "#52b788" : "#444"}`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    color:"#111", fontSize:11, fontWeight:900, transition:"all .2s",
                  }}>{on ? "✓" : ""}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Neuer Mitarbeiter */}
        <div style={card}>
          <CardHead label="Neuen Mitarbeiter anlegen" color="#c9a96e" />
          <div style={{ padding:"14px 16px",
            display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr auto", gap:10, alignItems:"flex-end" }}>
            <Field label="Name">
              <TI value={nStaff.name} onChange={v => setNStaff(p=>({...p,name:v}))} placeholder="Vorname Nachname" />
            </Field>
            <Field label="Alter">
              <TI type="number" min={16} max={70} value={nStaff.age}
                onChange={v => setNStaff(p=>({...p,age:v}))} />
            </Field>
            <Field label="Beginn (Uhr)">
              <TI type="number" min={0} max={23} value={nStaff.hoursStart}
                onChange={v => setNStaff(p=>({...p,hoursStart:v}))} />
            </Field>
            <Field label="Ende (Uhr)">
              <TI type="number" min={0} max={24} value={nStaff.hoursEnd}
                onChange={v => setNStaff(p=>({...p,hoursEnd:v}))} />
            </Field>
            <Btn onClick={addStaff}>+ Anlegen</Btn>
          </div>
        </div>

        {/* Mitarbeiterliste */}
        <div style={card}>
          <CardHead label={`Mitarbeiterliste (${staff.length})`} color="#60a5fa" />
          <div style={{ padding:14, display:"flex", flexDirection:"column", gap:8 }}>
            {staff.length === 0 && (
              <div style={{ color:"#444", textAlign:"center", padding:20 }}>Noch keine Mitarbeiter.</div>
            )}
            {staff.map(s => (
              editId === s.id
                ? <EditRow key={s.id} s={s} onSave={saveStaff} onCancel={() => setEditId(null)} />
                : (
                  <div key={s.id} style={{
                    background:"#0d0d14", border:"1px solid #2a2a35", borderRadius:10,
                    padding:"11px 14px", display:"flex", alignItems:"center",
                    justifyContent:"space-between", gap:10, flexWrap:"wrap",
                  }}>
                    <div style={{ display:"flex", gap:11, alignItems:"center" }}>
                      <div style={{
                        width:34, height:34, borderRadius:"50%", flexShrink:0,
                        background: present[s.id] ? "#52b78820" : "#1a1a1a",
                        border: `1px solid ${present[s.id] ? "#52b78855" : "#333"}`,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:13, fontWeight:700,
                        color: present[s.id] ? "#52b788" : "#555",
                      }}>{s.name[0]}</div>
                      <div>
                        <div style={{ fontWeight:700, color:"#e8e4da" }}>{s.name}</div>
                        <div style={{ fontSize:11, color:"#666", marginTop:2 }}>
                          {s.age} Jahre · {s.hoursStart}:00–{s.hoursEnd}:00 ({s.hoursEnd-s.hoursStart}h) ·
                          Faktor <span style={{ color:"#c9a96e" }}>×{AGE_FACTOR(s.age).toFixed(2)}</span> ·
                          Kapazität <span style={{ color:"#60a5fa" }}>{staffCap(s).toFixed(1)} Pkt</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:7, alignItems:"center", flexWrap:"wrap" }}>
                      <Badge color={present[s.id]?"#52b788":"#666"}>
                        {present[s.id]?"✓ Anwesend":"✗ Abwesend"}
                      </Badge>
                      <Btn v="blue" sm onClick={() => { setEditId(s.id); }}>✎ Bearbeiten</Btn>
                      <Btn v="red"  sm onClick={() => removeStaff(s.id)}>Entfernen</Btn>
                    </div>
                  </div>
                )
            ))}
          </div>
        </div>
      </div>
    )}

    {/* ══ ZIMMER ════════════════════════════════════════════════════════ */}
    {tab==="rooms" && (
      <div>
        <div style={card}>
          <CardHead label="Zimmer hinzufügen" color="#c9a96e" />
          <div style={{ padding:"14px 16px",
            display:"grid", gridTemplateColumns:"1fr 1fr 2fr auto", gap:10, alignItems:"flex-end" }}>
            <Field label="Zimmernummer">
              <TI value={nRoom.number} onChange={v => setNRoom(p=>({...p,number:v}))} placeholder="z.B. 304" />
            </Field>
            <Field label="Größe">
              <Sel value={nRoom.size} onChange={v => setNRoom(p=>({...p,size:v}))}
                options={[{value:"S",label:"Klein (S)"},{value:"M",label:"Mittel (M)"},{value:"L",label:"Groß (L)"}]} />
            </Field>
            <Field label="Reinigungsart">
              <Sel value={nRoom.type} onChange={v => setNRoom(p=>({...p,type:v}))}
                options={[{value:"bleibe",label:"Bleibereinigung (Gast bleibt)"},{value:"abreise",label:"Abreisereinigung (Gast reist ab)"}]} />
            </Field>
            <Btn onClick={addRoom}>+ Hinzufügen</Btn>
          </div>
        </div>

        <div style={card}>
          <CardHead label={`Zimmerliste (${rooms.length})`} color="#a78bfa" />
          <div style={{ padding:14, display:"flex", flexDirection:"column", gap:7 }}>
            {rooms.length === 0 && (
              <div style={{ color:"#444", textAlign:"center", padding:20 }}>Noch keine Zimmer.</div>
            )}
            {rooms.map(r => (
              <div key={r.id} style={{
                background:"#0d0d14", border:"1px solid #2a2a35", borderRadius:9,
                padding:"9px 14px", display:"flex", alignItems:"center", justifyContent:"space-between",
              }}>
                <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                  <span style={{ fontFamily:"'Playfair Display',serif",
                    fontSize:15, fontWeight:700, color:"#c9a96e", minWidth:44 }}>{r.number}</span>
                  <Badge color={SIZE_C[r.size]}>{SIZE_L[r.size]}</Badge>
                  <Badge color={TYPE_C[r.type]}>{TYPE_L[r.type]}</Badge>
                </div>
                <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                  <span style={{ fontSize:11, color:"#555" }}>{roomWeight(r).toFixed(1)} Pkt</span>
                  <Btn v="red" sm onClick={() => setRooms(p => p.filter(x => x.id !== r.id))}>× Entfernen</Btn>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
  </div>
</div>
```

);
}
