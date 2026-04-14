import { useState, useMemo } from "react";

const uid = () => Math.random().toString(36).slice(2, 8);
const AGE_FACTOR = a => a <= 35 ? 1.0 : a <= 45 ? 0.92 : a <= 55 ? 0.82 : 0.70;
const SIZE_PTS  = { S: 1.0, M: 1.6, L: 2.4 };
const TYPE_MULT = { bleibe: 0.55, abreise: 1.0 };
const roomWeight = r => SIZE_PTS[r.size] * TYPE_MULT[r.type];
const staffCap   = s => s.hours * AGE_FACTOR(s.age);

const SIZE_L = { S: "Klein", M: "Mittel", L: "Groß" };
const TYPE_L = { bleibe: "Bleibereinigung", abreise: "Abreisereinigung" };
const SIZE_C = { S: "#6dbf8b", M: "#f5a623", L: "#e05c5c" };
const TYPE_C = { bleibe: "#5b9bd5", abreise: "#c94f4f" };
const FLOOR_C = ["#a78bfa","#60a5fa","#34d399","#fbbf24","#f87171","#e879f9"];
const FLOORS  = [1,2,3,4,5,6];

function distribute(staff, rooms) {
  if (!staff.length || !rooms.length)
    return { assigned: {}, loads: {}, targets: {}, caps: {} };
  const caps    = Object.fromEntries(staff.map(s => [s.id, staffCap(s)]));
  const totalC  = Object.values(caps).reduce((a, b) => a + b, 0);
  const totalW  = rooms.reduce((a, r) => a + roomWeight(r), 0);
  const targets = Object.fromEntries(staff.map(s => [s.id, (caps[s.id] / totalC) * totalW]));
  const assigned = Object.fromEntries(staff.map(s => [s.id, []]));
  const loads    = Object.fromEntries(staff.map(s => [s.id, 0]));
  const sorted   = [...rooms].sort((a, b) => roomWeight(b) - roomWeight(a));
  for (const room of sorted) {
    let best = null, bestVal = -Infinity;
    for (const s of staff) {
      const val = targets[s.id] - loads[s.id];
      if (val > bestVal) { bestVal = val; best = s; }
    }
    assigned[best.id].push(room);
    loads[best.id] += roomWeight(room);
  }
  return { assigned, loads, targets, caps };
}

// ── Seed data ────────────────────────────────────────────────────────────────
const INIT_STAFF = [
  { id: uid(), name: "Maria K.",  age: 42, hours: 8 },
  { id: uid(), name: "Jana L.",   age: 29, hours: 8 },
  { id: uid(), name: "Beate W.",  age: 57, hours: 6 },
  { id: uid(), name: "Petra H.",  age: 48, hours: 8 },
];

function seedRooms() {
  const cfg = {
    1: [["101","M"],["102","S"],["103","S"],["104","M"],["105","L"],["106","S"]],
    2: [["201","M"],["202","S"],["203","L"],["204","M"],["205","S"],["206","M"]],
    3: [["301","L"],["302","M"],["303","S"],["304","L"],["305","M"],["306","S"]],
    4: [["401","S"],["402","M"],["403","L"],["404","S"],["405","M"],["406","L"]],
    5: [["501","M"],["502","L"],["503","S"],["504","M"],["505","L"],["506","S"]],
    6: [["601","L"],["602","M"],["603","S"],["604","L"],["605","M"],["606","S"]],
  };
  const rows = [];
  for (const [f, list] of Object.entries(cfg))
    for (const [n, sz] of list)
      rows.push({ id: uid(), floor: +f, number: n, size: sz });
  return rows;
}
const INIT_ROOMDB = seedRooms();

// ── Today's room selection (empty by default – user picks from DB) ────────────
const INIT_TODAY = [];

// ── Primitives ────────────────────────────────────────────────────────────────
const inp = {
  background:"#111118", border:"1px solid #2d2d3a", borderRadius:7,
  color:"#e8e4da", padding:"7px 10px", fontSize:13, fontFamily:"inherit",
  outline:"none", width:"100%", boxSizing:"border-box",
};
const TI = ({ value, onChange, placeholder, type="text", min, max }) =>
  <input style={inp} type={type} value={value}
    onChange={e => onChange(e.target.value)} placeholder={placeholder} min={min} max={max} />;

const Sel = ({ value, onChange, options }) =>
  <select style={{ ...inp, cursor:"pointer" }} value={value} onChange={e => onChange(e.target.value)}>
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>;

function Btn({ onClick, children, v="gold", sm, disabled }) {
  const map = {
    gold:  { bg:"#c9a96e",     cl:"#1a1a1a", br:"none" },
    red:   { bg:"#c94f4f22",   cl:"#e07070", br:"1px solid #c94f4f44" },
    blue:  { bg:"#5b9bd522",   cl:"#7fc2ff", br:"1px solid #5b9bd544" },
    green: { bg:"#6dbf8b22",   cl:"#6dbf8b", br:"1px solid #6dbf8b44" },
    ghost: { bg:"transparent", cl:"#666",    br:"1px solid #333" },
    floor: { bg:"transparent", cl:"#aaa",    br:"1px solid #333" },
  };
  const { bg, cl, br } = map[v] || map.gold;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background:bg, color:cl, border:br, borderRadius:7,
      padding: sm ? "4px 10px" : "8px 18px",
      fontSize: sm ? 11 : 13, fontWeight:700,
      cursor: disabled ? "not-allowed" : "pointer",
      fontFamily:"inherit", letterSpacing:.3,
      opacity: disabled ? .4 : 1, transition:"opacity .15s", whiteSpace:"nowrap",
    }}
      onMouseEnter={e => !disabled && (e.currentTarget.style.opacity = .75)}
      onMouseLeave={e => (e.currentTarget.style.opacity = disabled ? .4 : 1)}
    >{children}</button>
  );
}

const Badge = ({ color, children }) =>
  <span style={{ background:color+"22", color, border:"1px solid "+color+"44",
    borderRadius:4, padding:"1px 6px", fontSize:10, fontWeight:700, letterSpacing:.3 }}>{children}</span>;

const Field = ({ label, children }) =>
  <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
    <label style={{ fontSize:10, fontWeight:600, color:"#666", letterSpacing:.8, textTransform:"uppercase" }}>{label}</label>
    {children}
  </div>;

function FBar({ load, target }) {
  const pct = target > 0 ? Math.min((load/target)*100, 130) : 0;
  const cl  = pct > 110 ? "#e05c5c" : pct < 80 ? "#f5a623" : "#6dbf8b";
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"#666", marginBottom:3 }}>
        <span>Last: <b style={{ color:cl }}>{load.toFixed(1)} Pkt</b></span>
        <span>Soll: {target.toFixed(1)} Pkt</span>
      </div>
      <div style={{ background:"#0d0d14", borderRadius:3, height:5, overflow:"hidden" }}>
        <div style={{ width:Math.min(pct,100)+"%",
          background:"linear-gradient(90deg,"+cl+"88,"+cl+")",
          height:"100%", borderRadius:3, transition:"width .4s" }} />
      </div>
      <div style={{ fontSize:10, color:cl, fontWeight:700, marginTop:2 }}>
        {Math.round(pct)}% {pct>110?"⚠ Überlastet":pct<80?"⬇ Unter":"✓ Ausgewogen"}
      </div>
    </div>
  );
}

const card = {
  background:"#1c1c22", border:"1px solid #2e2e38",
  borderRadius:14, overflow:"hidden", marginBottom:20,
};

function CardHead({ label, color, sub }) {
  return (
    <div style={{ padding:"12px 20px",
      background:"linear-gradient(90deg,"+color+"18 0%,transparent 100%)",
      borderBottom:"1px solid "+color+"22",
      display:"flex", alignItems:"center", gap:8 }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:color, display:"inline-block", flexShrink:0 }} />
      <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, color:"#e8e4da", fontSize:15, letterSpacing:.4 }}>{label}</span>
      {sub && <span style={{ fontSize:11, color:"#555", marginLeft:2 }}>{sub}</span>}
    </div>
  );
}

// ── Inline edit row ───────────────────────────────────────────────────────────
function EditRow({ s, onSave, onCancel }) {
  const [d, setD] = useState({ ...s });
  const f = k => v => setD(p => ({ ...p, [k]: v }));
  return (
    <div style={{ background:"#111827", border:"1px solid #c9a96e55",
      borderRadius:10, padding:"14px 16px", display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ fontSize:11, color:"#c9a96e", fontWeight:700, letterSpacing:.5, textTransform:"uppercase" }}>
        ✎ Bearbeiten
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:10 }}>
        <Field label="Name"><TI value={d.name} onChange={f("name")} placeholder="Name" /></Field>
        <Field label="Alter"><TI type="number" min={16} max={70} value={d.age} onChange={f("age")} /></Field>
        <Field label="Arbeitsstunden"><TI type="number" min={1} max={12} value={d.hours} onChange={f("hours")} /></Field>
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <Btn v="green" sm onClick={() => onSave({ ...d, age:+d.age, hours:+d.hours })}>✓ Speichern</Btn>
        <Btn v="ghost" sm onClick={onCancel}>Abbrechen</Btn>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [staff,   setStaff]   = useState(INIT_STAFF);
  const [roomDB,  setRoomDB]  = useState(INIT_ROOMDB);
  const [today,   setToday]   = useState(INIT_TODAY); // rooms selected for today
  const [present, setPresent] = useState(() => Object.fromEntries(INIT_STAFF.map(s => [s.id, true])));
  const [editId,  setEditId]  = useState(null);
  const [tab,     setTab]     = useState("plan");
  const [nStaff,  setNStaff]  = useState({ name:"", age:30, hours:8 });
  const [nRoom,   setNRoom]   = useState({ floor:1, number:"", size:"M" });

  const activeStaff = useMemo(() => staff.filter(s => present[s.id]), [staff, present]);
  const { assigned, loads, targets } = useMemo(() => distribute(activeStaff, today), [activeStaff, today]);

  const fairness = useMemo(() => {
    if (!activeStaff.length || !today.length) return 100;
    const diffs = activeStaff.map(s =>
      Math.abs((loads[s.id]||0)-(targets[s.id]||0)) / Math.max(targets[s.id]||1, 0.01)
    );
    return Math.max(0, Math.round((1 - diffs.reduce((a,b)=>a+b,0)/diffs.length)*100));
  }, [activeStaff, today, loads, targets]);

  const fColor = fairness >= 90 ? "#6dbf8b" : fairness >= 70 ? "#f5a623" : "#e05c5c";
  const dateStr = new Date().toLocaleDateString("de-DE", { weekday:"long", day:"numeric", month:"long", year:"numeric" });

  // staff actions
  const addStaff = () => {
    if (!nStaff.name.trim()) return;
    const s = { ...nStaff, id:uid(), age:+nStaff.age, hours:+nStaff.hours };
    setStaff(p => [...p, s]);
    setPresent(p => ({ ...p, [s.id]:true }));
    setNStaff({ name:"", age:30, hours:8 });
  };
  const removeStaff = id => {
    setStaff(p => p.filter(s => s.id !== id));
    setPresent(p => { const n={...p}; delete n[id]; return n; });
    if (editId === id) setEditId(null);
  };
  const saveStaff = updated => { setStaff(p => p.map(s => s.id===updated.id?updated:s)); setEditId(null); };
  const togglePresent = id => setPresent(p => ({ ...p, [id]:!p[id] }));

  // room DB actions
  const addRoomDB = () => {
    if (!nRoom.number.trim()) return;
    setRoomDB(p => [...p, { ...nRoom, id:uid(), floor:+nRoom.floor }]);
    setNRoom({ floor:1, number:"", size:"M" });
  };
  const removeRoomDB = id => {
    setRoomDB(p => p.filter(r => r.id !== id));
    setToday(p => p.filter(r => r.id !== id));
  };

  // today actions
  const toggleToday = room => {
    const inToday = today.some(r => r.id === room.id);
    if (inToday) {
      setToday(p => p.filter(r => r.id !== room.id));
    } else {
      setToday(p => [...p, { ...room, type:"abreise" }]);
    }
  };
  const setRoomType = (id, type) => setToday(p => p.map(r => r.id===id ? {...r, type} : r));
  const addFloorToToday = floor => {
    const floorRooms = roomDB.filter(r => r.floor===floor && !today.some(t => t.id===r.id));
    setToday(p => [...p, ...floorRooms.map(r => ({ ...r, type:"abreise" }))]);
  };
  const clearToday = () => setToday([]);

  return (
    <div style={{ minHeight:"100vh", background:"#13131a", color:"#e8e4da",
      fontFamily:"'DM Sans','Segoe UI',sans-serif", fontSize:14 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;600;700&display=swap');
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:5px;background:#111;}
        ::-webkit-scrollbar-thumb{background:#333;border-radius:3px;}
        input[type=number]::-webkit-inner-spin-button{opacity:.4;}
      `}</style>

      {/* Header */}
      <div style={{ borderBottom:"1px solid #2a2a35", padding:"16px 30px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        background:"linear-gradient(180deg,#1a1a24 0%,transparent 100%)" }}>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900,
            color:"#c9a96e", letterSpacing:.5 }}>Zimmerservice Planer</div>
          <div style={{ fontSize:11, color:"#555", marginTop:2 }}>Faire Personalplanung · Housekeeping · {dateStr}</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:11, color:"#555", marginBottom:2 }}>Fairness-Score</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28,
            fontWeight:900, color:fColor, lineHeight:1 }}>{fairness}%</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"flex", borderBottom:"1px solid #2a2a35", background:"#111118" }}>
        {[
          { l:"Anwesend",         v:activeStaff.length+"/"+staff.length, c:"#c9a96e" },
          { l:"Zimmer heute",     v:today.length,                         c:"#5b9bd5" },
          { l:"Bleibereinigung",  v:today.filter(r=>r.type==="bleibe").length,  c:"#6dbf8b" },
          { l:"Abreisereinigung", v:today.filter(r=>r.type==="abreise").length, c:"#c94f4f" },
          { l:"Gesamtlast",       v:today.reduce((a,r)=>a+roomWeight(r),0).toFixed(1)+" Pkt", c:"#a78bfa" },
        ].map(s => (
          <div key={s.l} style={{ flex:1, padding:"9px 16px", borderRight:"1px solid #2a2a35" }}>
            <div style={{ fontSize:9, color:"#444", textTransform:"uppercase", letterSpacing:.8 }}>{s.l}</div>
            <div style={{ fontSize:20, fontWeight:700, color:s.c,
              fontFamily:"'Playfair Display',serif", marginTop:1 }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", borderBottom:"1px solid #2a2a35", padding:"0 22px" }}>
        {[
          ["plan",     "📋 Verteilungsplan"],
          ["tagesplan","🛏 Tagesplan"],
          ["personal", "👤 Personal"],
          ["db",       "🏨 Zimmerdatenbank"],
        ].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            background:"none", border:"none", cursor:"pointer",
            padding:"11px 16px", fontSize:13, fontWeight:600, fontFamily:"inherit",
            color: tab===k ? "#c9a96e" : "#555",
            borderBottom: tab===k ? "2px solid #c9a96e" : "2px solid transparent",
            transition:"color .15s",
          }}>{l}</button>
        ))}
      </div>

      <div style={{ padding:"22px 28px", maxWidth:1200, margin:"0 auto" }}>

        {/* ══ VERTEILUNGSPLAN ═══════════════════════════════════════════════ */}
        {tab==="plan" && (
          <div>
            {today.length===0 && (
              <div style={{ textAlign:"center", padding:60, color:"#555" }}>
                Noch keine Zimmer für heute ausgewählt.<br/>
                <span style={{ color:"#c9a96e" }}>→ Tab „Tagesplan" → Zimmer aktivieren</span>
              </div>
            )}
            {today.length>0 && activeStaff.length===0 && (
              <div style={{ textAlign:"center", padding:60, color:"#555" }}>
                Keine Mitarbeiter anwesend.<br/>
                <span style={{ color:"#c9a96e" }}>→ Tab „Personal" → Anwesenheit aktivieren</span>
              </div>
            )}
            {today.length>0 && activeStaff.length>0 && (
              <>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))", gap:16 }}>
                  {activeStaff.map(s => {
                    const sRooms = assigned[s.id] || [];
                    const load   = loads[s.id] || 0;
                    const target = targets[s.id] || 0;
                    return (
                      <div key={s.id} style={{ ...card, marginBottom:0 }}>
                        <div style={{ padding:"14px 18px",
                          background:"linear-gradient(90deg,#c9a96e14 0%,transparent 100%)",
                          borderBottom:"1px solid #2e2e38" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                            <div>
                              <div style={{ fontFamily:"'Playfair Display',serif",
                                fontSize:16, fontWeight:700, color:"#e8e4da" }}>{s.name}</div>
                              <div style={{ fontSize:11, color:"#777", marginTop:2 }}>
                                {s.age} Jahre · {s.hours}h · Faktor ×{AGE_FACTOR(s.age).toFixed(2)}
                              </div>
                            </div>
                            <div style={{ textAlign:"right" }}>
                              <div style={{ fontSize:24, fontWeight:900, color:"#c9a96e",
                                fontFamily:"'Playfair Display',serif", lineHeight:1 }}>{sRooms.length}</div>
                              <div style={{ fontSize:10, color:"#555" }}>Zimmer</div>
                            </div>
                          </div>
                          <div style={{ marginTop:10 }}><FBar load={load} target={target} /></div>
                        </div>
                        <div style={{ padding:"12px 16px", display:"flex", flexDirection:"column", gap:6 }}>
                          {sRooms.length===0 && <span style={{ color:"#444", fontSize:12 }}>Keine Zimmer zugewiesen</span>}
                          {sRooms.map(r => (
                            <div key={r.id} style={{ display:"flex", alignItems:"center",
                              justifyContent:"space-between", background:"#111118",
                              border:"1px solid #222", borderRadius:8, padding:"6px 11px" }}>
                              <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                                <span style={{ fontFamily:"'Playfair Display',serif",
                                  fontSize:14, fontWeight:700, color:"#c9a96e" }}>{r.number}</span>
                                <Badge color={FLOOR_C[r.floor-1]}>Etage {r.floor}</Badge>
                                <Badge color={SIZE_C[r.size]}>{SIZE_L[r.size]}</Badge>
                                <Badge color={TYPE_C[r.type]}>{r.type==="bleibe"?"Bleibe":"Abreise"}</Badge>
                              </div>
                              <span style={{ fontSize:10, color:"#555" }}>{roomWeight(r).toFixed(1)} Pkt</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Legend */}
                <div style={{ marginTop:20, background:"#1c1c22", border:"1px solid #2e2e38",
                  borderRadius:12, padding:16, display:"flex", flexWrap:"wrap", gap:24 }}>
                  <div>
                    <div style={{ fontSize:10, color:"#555", textTransform:"uppercase", letterSpacing:.7, marginBottom:6 }}>Zimmergewicht</div>
                    <div style={{ display:"flex", gap:12, fontSize:12, flexWrap:"wrap" }}>
                      {Object.entries(SIZE_PTS).map(([s,p]) =>
                        <span key={s} style={{ color:SIZE_C[s] }}>{SIZE_L[s]} {p}Pkt</span>)}
                      <span style={{ color:"#333" }}>×</span>
                      <span style={{ color:TYPE_C.bleibe }}>Bleibe ×0.55</span>
                      <span style={{ color:TYPE_C.abreise }}>Abreise ×1.0</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize:10, color:"#555", textTransform:"uppercase", letterSpacing:.7, marginBottom:6 }}>Altersfaktor</div>
                    <div style={{ display:"flex", gap:10, fontSize:12, flexWrap:"wrap" }}>
                      {[["≤35","1.00"],["36–45","0.92"],["46–55","0.82"],["56+","0.70"]].map(([r,f]) =>
                        <span key={r}>{r}: ×{f}</span>)}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ══ TAGESPLAN ═════════════════════════════════════════════════════ */}
        {tab==="tagesplan" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div style={{ fontSize:13, color:"#666" }}>{today.length} Zimmer für heute ausgewählt</div>
              <div style={{ display:"flex", gap:8 }}>
                {FLOORS.map(f => (
                  <Btn key={f} v="ghost" sm onClick={() => addFloorToToday(f)}>
                    + Etage {f}
                  </Btn>
                ))}
                {today.length>0 && <Btn v="red" sm onClick={clearToday}>Alle entfernen</Btn>}
              </div>
            </div>

            {FLOORS.map(floor => {
              const floorRooms = roomDB.filter(r => r.floor===floor).sort((a,b)=>a.number.localeCompare(b.number));
              if (!floorRooms.length) return null;
              return (
                <div key={floor} style={card}>
                  <CardHead
                    label={floor+". Etage"}
                    color={FLOOR_C[floor-1]}
                    sub={today.filter(r=>r.floor===floor).length+" / "+floorRooms.length+" ausgewählt"}
                  />
                  <div style={{ padding:14, display:"flex", flexWrap:"wrap", gap:8 }}>
                    {floorRooms.map(r => {
                      const todayEntry = today.find(t => t.id===r.id);
                      const active = !!todayEntry;
                      return (
                        <div key={r.id} style={{ display:"flex", flexDirection:"column", gap:5,
                          background: active ? FLOOR_C[floor-1]+"18" : "#111118",
                          border: "1px solid "+(active ? FLOOR_C[floor-1]+"55" : "#2a2a35"),
                          borderRadius:10, padding:"10px 12px",
                          transition:"all .2s", minWidth:110 }}>
                          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:6 }}>
                            <button onClick={() => toggleToday(r)} style={{
                              background:"none", border:"none", cursor:"pointer",
                              fontFamily:"'Playfair Display',serif", fontSize:16,
                              fontWeight:700, color: active ? FLOOR_C[floor-1] : "#666",
                              padding:0, display:"flex", alignItems:"center", gap:6,
                            }}>
                              <span style={{ fontSize:11, opacity:.6 }}>{active?"✓":"○"}</span>
                              {r.number}
                            </button>
                            <Badge color={SIZE_C[r.size]}>{SIZE_L[r.size]}</Badge>
                          </div>
                          {active && (
                            <div style={{ display:"flex", gap:4 }}>
                              <button onClick={() => setRoomType(r.id,"bleibe")} style={{
                                flex:1, background: todayEntry.type==="bleibe" ? TYPE_C.bleibe+"33" : "transparent",
                                border: "1px solid "+(todayEntry.type==="bleibe" ? TYPE_C.bleibe : "#333"),
                                borderRadius:5, color: todayEntry.type==="bleibe" ? TYPE_C.bleibe : "#555",
                                fontSize:10, fontWeight:700, cursor:"pointer", padding:"3px 0", fontFamily:"inherit",
                              }}>Bleibe</button>
                              <button onClick={() => setRoomType(r.id,"abreise")} style={{
                                flex:1, background: todayEntry.type==="abreise" ? TYPE_C.abreise+"33" : "transparent",
                                border: "1px solid "+(todayEntry.type==="abreise" ? TYPE_C.abreise : "#333"),
                                borderRadius:5, color: todayEntry.type==="abreise" ? TYPE_C.abreise : "#555",
                                fontSize:10, fontWeight:700, cursor:"pointer", padding:"3px 0", fontFamily:"inherit",
                              }}>Abreise</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══ PERSONAL ══════════════════════════════════════════════════════ */}
        {tab==="personal" && (
          <div>
            {/* Anwesenheit */}
            <div style={card}>
              <CardHead label="Anwesenheit heute" color="#6dbf8b"
                sub={activeStaff.length+" von "+staff.length+" anwesend"} />
              <div style={{ padding:"14px 18px", display:"flex", flexWrap:"wrap", gap:10 }}>
                {staff.length===0 && <span style={{ color:"#444", fontSize:12 }}>Noch kein Personal angelegt.</span>}
                {staff.map(s => {
                  const on = !!present[s.id];
                  return (
                    <button key={s.id} onClick={() => togglePresent(s.id)} style={{
                      display:"flex", alignItems:"center", gap:10,
                      background: on ? "#6dbf8b14" : "#15151c",
                      border: "1px solid "+(on ? "#6dbf8b55" : "#2a2a35"),
                      borderRadius:10, padding:"10px 14px",
                      cursor:"pointer", transition:"all .2s", fontFamily:"inherit",
                    }}>
                      <div style={{ width:34, height:34, borderRadius:"50%", flexShrink:0,
                        background: on ? "#6dbf8b28" : "#1e1e26",
                        border: "2px solid "+(on ? "#6dbf8b" : "#333"),
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:13, fontWeight:700, color: on ? "#6dbf8b" : "#555",
                      }}>{s.name[0]}</div>
                      <div style={{ textAlign:"left" }}>
                        <div style={{ fontWeight:700, fontSize:13, color: on ? "#e8e4da" : "#555" }}>{s.name}</div>
                        <div style={{ fontSize:10, color: on ? "#777" : "#444", marginTop:1 }}>
                          {s.hours}h · {s.age} J.
                        </div>
                      </div>
                      <div style={{ width:18, height:18, borderRadius:5, flexShrink:0,
                        background: on ? "#6dbf8b" : "transparent",
                        border: "2px solid "+(on ? "#6dbf8b" : "#444"),
                        display:"flex", alignItems:"center", justifyContent:"center",
                        color:"#111", fontSize:11, fontWeight:900,
                      }}>{on ? "✓" : ""}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Neuer MA */}
            <div style={card}>
              <CardHead label="Neuen Mitarbeiter anlegen" color="#c9a96e" />
              <div style={{ padding:"14px 18px",
                display:"grid", gridTemplateColumns:"2fr 1fr 1fr auto", gap:12, alignItems:"flex-end" }}>
                <Field label="Name">
                  <TI value={nStaff.name} onChange={v=>setNStaff(p=>({...p,name:v}))} placeholder="Vorname Nachname" />
                </Field>
                <Field label="Alter">
                  <TI type="number" min={16} max={70} value={nStaff.age} onChange={v=>setNStaff(p=>({...p,age:v}))} />
                </Field>
                <Field label="Stunden / Tag">
                  <TI type="number" min={1} max={12} value={nStaff.hours} onChange={v=>setNStaff(p=>({...p,hours:v}))} />
                </Field>
                <Btn onClick={addStaff}>+ Anlegen</Btn>
              </div>
            </div>

            {/* Mitarbeiterliste */}
            <div style={card}>
              <CardHead label={"Mitarbeiterliste ("+staff.length+")"} color="#5b9bd5" />
              <div style={{ padding:16, display:"flex", flexDirection:"column", gap:8 }}>
                {staff.length===0 && <div style={{ color:"#444", textAlign:"center", padding:20 }}>Noch keine Mitarbeiter.</div>}
                {staff.map(s => (
                  editId===s.id
                    ? <EditRow key={s.id} s={s} onSave={saveStaff} onCancel={()=>setEditId(null)} />
                    : (
                      <div key={s.id} style={{ background:"#111118", border:"1px solid #2a2a35",
                        borderRadius:10, padding:"11px 15px",
                        display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, flexWrap:"wrap" }}>
                        <div style={{ display:"flex", gap:11, alignItems:"center" }}>
                          <div style={{ width:36, height:36, borderRadius:"50%", flexShrink:0,
                            background: present[s.id] ? "#6dbf8b20" : "#1a1a1a",
                            border: "1px solid "+(present[s.id]?"#6dbf8b55":"#333"),
                            display:"flex", alignItems:"center", justifyContent:"center",
                            fontSize:14, fontWeight:700, color: present[s.id]?"#6dbf8b":"#555",
                          }}>{s.name[0]}</div>
                          <div>
                            <div style={{ fontWeight:700, color:"#e8e4da", fontSize:14 }}>{s.name}</div>
                            <div style={{ fontSize:11, color:"#666", marginTop:2 }}>
                              {s.age} Jahre · {s.hours}h/Tag ·
                              Faktor <span style={{ color:"#c9a96e" }}>×{AGE_FACTOR(s.age).toFixed(2)}</span> ·
                              Kapazität <span style={{ color:"#5b9bd5" }}>{staffCap(s).toFixed(1)} Pkt</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ display:"flex", gap:7, alignItems:"center", flexWrap:"wrap" }}>
                          <Badge color={present[s.id]?"#6dbf8b":"#555"}>{present[s.id]?"✓ Anwesend":"✗ Abwesend"}</Badge>
                          <Btn v="blue" sm onClick={()=>setEditId(s.id)}>✎ Bearbeiten</Btn>
                          <Btn v="red"  sm onClick={()=>removeStaff(s.id)}>Entfernen</Btn>
                        </div>
                      </div>
                    )
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ ZIMMERDATENBANK ═══════════════════════════════════════════════ */}
        {tab==="db" && (
          <div>
            <div style={card}>
              <CardHead label="Zimmer hinzufügen" color="#c9a96e" />
              <div style={{ padding:"14px 18px",
                display:"grid", gridTemplateColumns:"1fr 1fr 1fr auto", gap:12, alignItems:"flex-end" }}>
                <Field label="Etage">
                  <Sel value={nRoom.floor} onChange={v=>setNRoom(p=>({...p,floor:+v}))}
                    options={FLOORS.map(f=>({ value:f, label:f+". Etage" }))} />
                </Field>
                <Field label="Zimmernummer">
                  <TI value={nRoom.number} onChange={v=>setNRoom(p=>({...p,number:v}))} placeholder="z.B. 307" />
                </Field>
                <Field label="Größe">
                  <Sel value={nRoom.size} onChange={v=>setNRoom(p=>({...p,size:v}))}
                    options={[{value:"S",label:"Klein (S)"},{value:"M",label:"Mittel (M)"},{value:"L",label:"Groß (L)"}]} />
                </Field>
                <Btn onClick={addRoomDB}>+ Hinzufügen</Btn>
              </div>
            </div>

            {FLOORS.map(floor => {
              const fRooms = roomDB.filter(r=>r.floor===floor).sort((a,b)=>a.number.localeCompare(b.number));
              return (
                <div key={floor} style={card}>
                  <CardHead label={floor+". Etage"} color={FLOOR_C[floor-1]}
                    sub={fRooms.length+" Zimmer"} />
                  <div style={{ padding:14, display:"flex", flexWrap:"wrap", gap:8 }}>
                    {fRooms.length===0 && <span style={{ color:"#444", fontSize:12 }}>Keine Zimmer.</span>}
                    {fRooms.map(r => (
                      <div key={r.id} style={{ background:"#111118", border:"1px solid #2a2a35",
                        borderRadius:9, padding:"8px 12px",
                        display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontFamily:"'Playfair Display',serif",
                          fontSize:15, fontWeight:700, color:"#c9a96e" }}>{r.number}</span>
                        <Badge color={SIZE_C[r.size]}>{SIZE_L[r.size]}</Badge>
                        <Btn v="red" sm onClick={()=>removeRoomDB(r.id)}>×</Btn>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
