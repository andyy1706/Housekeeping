import { useState, useMemo } from "react";

const uid = () => Math.random().toString(36).slice(2, 8);
const AGE_FACTOR = a => a <= 35 ? 1.0 : a <= 45 ? 0.92 : a <= 55 ? 0.82 : 0.70;
const SIZE_PTS  = { S: 1.0, M: 1.6, L: 2.4 };
const TYPE_MULT = { bleibe: 0.55, abreise: 1.0 };
const roomWeight = r => SIZE_PTS[r.size] * TYPE_MULT[r.type];
const staffCap   = s => s.hours * AGE_FACTOR(s.age);
const SIZE_L = { S: "Klein", M: "Mittel", L: "Gross" };
const TYPE_L = { bleibe: "Bleibereinigung", abreise: "Abreisereinigung" };
const SIZE_C = { S: "#3a9e6a", M: "#d4820a", L: "#c03030" };
const TYPE_C = { bleibe: "#2d7fc1", abreise: "#b03030" };
const FLOOR_C = ["#7c5cdb","#2d7fc1","#1e9e6e","#c49a00","#c04040","#b040b0"];
const FLOORS  = [1,2,3,4,5,6];

const DARK = {
  bg:"#13131a", bgCard:"#1c1c22", bgInner:"#111118", bgDeep:"#0d0d14",
  border:"#2e2e38", border2:"#2a2a35", border3:"#2d2d3a",
  text:"#e8e4da", textSub:"#777", textMuted:"#555", textFaint:"#444",
  accent:"#c9a96e", headerBg:"linear-gradient(180deg,#1a1a24 0%,transparent 100%)",
  statsBg:"#111118", inputBg:"#111118", editBg:"#111827",
  presentOff:"#15151c", avatarOff:"#1e1e26", dark:true,
};
const LIGHT = {
  bg:"#f4f4f0", bgCard:"#ffffff", bgInner:"#f9f8f6", bgDeep:"#f0ede8",
  border:"#ddd8d0", border2:"#e0dbd4", border3:"#d8d4ce",
  text:"#1a1a1a", textSub:"#555", textMuted:"#888", textFaint:"#aaa",
  accent:"#a0782a", headerBg:"linear-gradient(180deg,#eceae4 0%,transparent 100%)",
  statsBg:"#ede9e2", inputBg:"#ffffff", editBg:"#fdf8f0",
  presentOff:"#f0ede8", avatarOff:"#e8e4de", dark:false,
};

function distribute(staff, rooms) {
  if (!staff.length || !rooms.length) return { assigned:{}, loads:{}, targets:{}, caps:{} };
  const caps    = Object.fromEntries(staff.map(s => [s.id, staffCap(s)]));
  const totalC  = Object.values(caps).reduce((a,b) => a+b, 0);
  const totalW  = rooms.reduce((a,r) => a+roomWeight(r), 0);
  const targets = Object.fromEntries(staff.map(s => [s.id, (caps[s.id]/totalC)*totalW]));
  const assigned = Object.fromEntries(staff.map(s => [s.id, []]));
  const loads    = Object.fromEntries(staff.map(s => [s.id, 0]));
  for (const room of [...rooms].sort((a,b) => roomWeight(b)-roomWeight(a))) {
    let best=null, bestVal=-Infinity;
    for (const s of staff) { const v=targets[s.id]-loads[s.id]; if(v>bestVal){bestVal=v;best=s;} }
    assigned[best.id].push(room); loads[best.id]+=roomWeight(room);
  }
  return { assigned, loads, targets, caps };
}

const INIT_STAFF = [
  { id:uid(), name:"Maria K.",  age:42, hours:8 },
  { id:uid(), name:"Jana L.",   age:29, hours:8 },
  { id:uid(), name:"Beate W.",  age:57, hours:6 },
  { id:uid(), name:"Petra H.",  age:48, hours:8 },
];
function seedRooms() {
  const cfg = {
    1:[["101","M"],["102","S"],["103","S"],["104","M"],["105","L"],["106","S"]],
    2:[["201","M"],["202","S"],["203","L"],["204","M"],["205","S"],["206","M"]],
    3:[["301","L"],["302","M"],["303","S"],["304","L"],["305","M"],["306","S"]],
    4:[["401","S"],["402","M"],["403","L"],["404","S"],["405","M"],["406","L"]],
    5:[["501","M"],["502","L"],["503","S"],["504","M"],["505","L"],["506","S"]],
    6:[["601","L"],["602","M"],["603","S"],["604","L"],["605","M"],["606","S"]],
  };
  const rows=[];
  for (const [f,list] of Object.entries(cfg))
    for (const [n,sz] of list) rows.push({id:uid(),floor:+f,number:n,size:sz});
  return rows;
}
const INIT_ROOMDB = seedRooms();

const TI = ({value,onChange,placeholder,type="text",min,max,t}) =>
  <input style={{background:t.inputBg,border:"1px solid "+t.border3,borderRadius:7,color:t.text,padding:"7px 10px",fontSize:13,fontFamily:"inherit",outline:"none",width:"100%",boxSizing:"border-box"}}
    type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} min={min} max={max}/>;

const Sel = ({value,onChange,options,t}) =>
  <select style={{background:t.inputBg,border:"1px solid "+t.border3,borderRadius:7,color:t.text,padding:"7px 10px",fontSize:13,fontFamily:"inherit",outline:"none",width:"100%",boxSizing:"border-box",cursor:"pointer"}}
    value={value} onChange={e=>onChange(e.target.value)}>
    {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
  </select>;

function Btn({onClick,children,v="gold",sm,disabled,t}) {
  const map = {
    gold:  {bg:t.accent,      cl:t.dark?"#1a1a1a":"#fff", br:"none"},
    red:   {bg:"#c94f4f22",   cl:"#c03030",               br:"1px solid #c0303044"},
    blue:  {bg:"#2d7fc122",   cl:"#2d7fc1",               br:"1px solid #2d7fc144"},
    green: {bg:"#3a9e6a22",   cl:"#3a9e6a",               br:"1px solid #3a9e6a44"},
    ghost: {bg:"transparent", cl:t.textMuted,              br:"1px solid "+t.border},
  };
  const {bg,cl,br} = map[v]||map.gold;
  return (
    <button onClick={onClick} disabled={disabled} style={{background:bg,color:cl,border:br,borderRadius:7,padding:sm?"4px 10px":"8px 18px",fontSize:sm?11:13,fontWeight:700,cursor:disabled?"not-allowed":"pointer",fontFamily:"inherit",letterSpacing:.3,opacity:disabled?.4:1,transition:"opacity .15s",whiteSpace:"nowrap"}}
      onMouseEnter={e=>!disabled&&(e.currentTarget.style.opacity=.75)}
      onMouseLeave={e=>(e.currentTarget.style.opacity=disabled?.4:1)}>{children}</button>
  );
}

const Badge = ({color,children}) =>
  <span style={{background:color+"22",color,border:"1px solid "+color+"44",borderRadius:4,padding:"1px 6px",fontSize:10,fontWeight:700,letterSpacing:.3}}>{children}</span>;

const Field = ({label,children,t}) =>
  <div style={{display:"flex",flexDirection:"column",gap:4}}>
    <label style={{fontSize:10,fontWeight:600,color:t.textMuted,letterSpacing:.8,textTransform:"uppercase"}}>{label}</label>
    {children}
  </div>;

function FBar({load,target,t}) {
  const pct = target>0 ? Math.min((load/target)*100,130) : 0;
  const cl  = pct>110?"#c03030":pct<80?"#d4820a":"#3a9e6a";
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:t.textMuted,marginBottom:3}}>
        <span>Last: <b style={{color:cl}}>{load.toFixed(1)} Pkt</b></span>
        <span>Soll: {target.toFixed(1)} Pkt</span>
      </div>
      <div style={{background:t.bgDeep,borderRadius:3,height:5,overflow:"hidden"}}>
        <div style={{width:Math.min(pct,100)+"%",background:"linear-gradient(90deg,"+cl+"88,"+cl+")",height:"100%",borderRadius:3,transition:"width .4s"}}/>
      </div>
      <div style={{fontSize:10,color:cl,fontWeight:700,marginTop:2}}>
        {Math.round(pct)}% {pct>110?"Ueberlastet":pct<80?"Unter":"Ausgewogen"}
      </div>
    </div>
  );
}

function Card({children,t}) {
  return <div style={{background:t.bgCard,border:"1px solid "+t.border,borderRadius:14,overflow:"hidden",marginBottom:20}}>{children}</div>;
}

function CardHead({label,color,sub,t}) {
  return (
    <div style={{padding:"12px 20px",background:"linear-gradient(90deg,"+color+"18 0%,transparent 100%)",borderBottom:"1px solid "+t.border,display:"flex",alignItems:"center",gap:8}}>
      <span style={{width:6,height:6,borderRadius:"50%",background:color,display:"inline-block",flexShrink:0}}/>
      <span style={{fontFamily:"'Playfair Display',serif",fontWeight:700,color:t.text,fontSize:15,letterSpacing:.4}}>{label}</span>
      {sub&&<span style={{fontSize:11,color:t.textMuted,marginLeft:2}}>{sub}</span>}
    </div>
  );
}

function EditRow({s,onSave,onCancel,t}) {
  const [d,setD] = useState({...s});
  const f = k => v => setD(p=>({...p,[k]:v}));
  return (
    <div style={{background:t.editBg,border:"1px solid "+t.accent+"55",borderRadius:10,padding:"14px 16px",display:"flex",flexDirection:"column",gap:12}}>
      <div style={{fontSize:11,color:t.accent,fontWeight:700,letterSpacing:.5,textTransform:"uppercase"}}>Bearbeiten</div>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:10}}>
        <Field label="Name" t={t}><TI value={d.name} onChange={f("name")} placeholder="Name" t={t}/></Field>
        <Field label="Alter" t={t}><TI type="number" min={16} max={70} value={d.age} onChange={f("age")} t={t}/></Field>
        <Field label="Stunden" t={t}><TI type="number" min={1} max={12} value={d.hours} onChange={f("hours")} t={t}/></Field>
      </div>
      <div style={{display:"flex",gap:8}}>
        <Btn v="green" sm t={t} onClick={()=>onSave({...d,age:+d.age,hours:+d.hours})}>Speichern</Btn>
        <Btn v="ghost" sm t={t} onClick={onCancel}>Abbrechen</Btn>
      </div>
    </div>
  );
}

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const t = darkMode ? DARK : LIGHT;
  const [staff,   setStaff]   = useState(INIT_STAFF);
  const [roomDB,  setRoomDB]  = useState(INIT_ROOMDB);
  const [today,   setToday]   = useState([]);
  const [present, setPresent] = useState(()=>Object.fromEntries(INIT_STAFF.map(s=>[s.id,true])));
  const [editId,  setEditId]  = useState(null);
  const [tab,     setTab]     = useState("plan");
  const [nStaff,  setNStaff]  = useState({name:"",age:30,hours:8});
  const [nRoom,   setNRoom]   = useState({floor:1,number:"",size:"M"});

  const activeStaff = useMemo(()=>staff.filter(s=>present[s.id]),[staff,present]);
  const {assigned,loads,targets} = useMemo(()=>distribute(activeStaff,today),[activeStaff,today]);

  const fairness = useMemo(()=>{
    if (!activeStaff.length||!today.length) return 100;
    const diffs = activeStaff.map(s=>Math.abs((loads[s.id]||0)-(targets[s.id]||0))/Math.max(targets[s.id]||1,0.01));
    return Math.max(0,Math.round((1-diffs.reduce((a,b)=>a+b,0)/diffs.length)*100));
  },[activeStaff,today,loads,targets]);

  const fColor = fairness>=90?"#3a9e6a":fairness>=70?"#d4820a":"#c03030";
  const dateStr = new Date().toLocaleDateString("de-DE",{weekday:"long",day:"numeric",month:"long",year:"numeric"});

  const addStaff = ()=>{
    if (!nStaff.name.trim()) return;
    const s={...nStaff,id:uid(),age:+nStaff.age,hours:+nStaff.hours};
    setStaff(p=>[...p,s]); setPresent(p=>({...p,[s.id]:true}));
    setNStaff({name:"",age:30,hours:8});
  };
  const removeStaff = id=>{
    setStaff(p=>p.filter(s=>s.id!==id));
    setPresent(p=>{const n={...p};delete n[id];return n;});
    if(editId===id) setEditId(null);
  };
  const saveStaff = u=>{setStaff(p=>p.map(s=>s.id===u.id?u:s));setEditId(null);};
  const togglePresent = id=>setPresent(p=>({...p,[id]:!p[id]}));
  const addRoomDB = ()=>{
    if (!nRoom.number.trim()) return;
    setRoomDB(p=>[...p,{...nRoom,id:uid(),floor:+nRoom.floor}]);
    setNRoom({floor:1,number:"",size:"M"});
  };
  const removeRoomDB = id=>{setRoomDB(p=>p.filter(r=>r.id!==id));setToday(p=>p.filter(r=>r.id!==id));};
  const toggleToday = room=>{
    if (today.some(r=>r.id===room.id)) setToday(p=>p.filter(r=>r.id!==room.id));
    else setToday(p=>[...p,{...room,type:"abreise"}]);
  };
  const setRoomType = (id,type)=>setToday(p=>p.map(r=>r.id===id?{...r,type}:r));
  const addFloorToToday = floor=>{
    const newR=roomDB.filter(r=>r.floor===floor&&!today.some(t2=>t2.id===r.id));
    setToday(p=>[...p,...newR.map(r=>({...r,type:"abreise"}))]);
  };

  return (
    <div style={{minHeight:"100vh",background:t.bg,color:t.text,fontFamily:"'DM Sans','Segoe UI',sans-serif",fontSize:14,transition:"background .3s,color .3s"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;600;700&display=swap');*{box-sizing:border-box;}::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-thumb{border-radius:3px;}input[type=number]::-webkit-inner-spin-button{opacity:.4;}`}</style>

      {/* Header */}
      <div style={{borderBottom:"1px solid "+t.border,padding:"16px 30px",display:"flex",alignItems:"center",justifyContent:"space-between",background:t.headerBg}}>
        <div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900,color:t.accent,letterSpacing:.5}}>Zimmerservice Planer</div>
          <div style={{fontSize:11,color:t.textMuted,marginTop:2}}>Faire Personalplanung - Housekeeping - {dateStr}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:20}}>
          <button onClick={()=>setDarkMode(d=>!d)} style={{display:"flex",alignItems:"center",gap:8,background:t.bgInner,border:"1px solid "+t.border,borderRadius:20,padding:"6px 14px",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:600,color:t.textSub}}>
            <span style={{fontSize:16}}>{darkMode?"☀️":"🌙"}</span>{darkMode?"Hell":"Dunkel"}
          </button>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:11,color:t.textMuted,marginBottom:2}}>Fairness-Score</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:900,color:fColor,lineHeight:1}}>{fairness}%</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{display:"flex",borderBottom:"1px solid "+t.border,background:t.statsBg}}>
        {[
          {l:"Anwesend",         v:activeStaff.length+"/"+staff.length,               c:t.accent},
          {l:"Zimmer heute",     v:today.length,                                       c:TYPE_C.bleibe},
          {l:"Bleibereinigung",  v:today.filter(r=>r.type==="bleibe").length,          c:"#3a9e6a"},
          {l:"Abreisereinigung", v:today.filter(r=>r.type==="abreise").length,         c:"#c03030"},
          {l:"Gesamtlast",       v:today.reduce((a,r)=>a+roomWeight(r),0).toFixed(1)+" Pkt", c:FLOOR_C[0]},
        ].map(s=>(
          <div key={s.l} style={{flex:1,padding:"9px 16px",borderRight:"1px solid "+t.border}}>
            <div style={{fontSize:9,color:t.textFaint,textTransform:"uppercase",letterSpacing:.8}}>{s.l}</div>
            <div style={{fontSize:20,fontWeight:700,color:s.c,fontFamily:"'Playfair Display',serif",marginTop:1}}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{display:"flex",borderBottom:"1px solid "+t.border,padding:"0 22px",background:t.bg}}>
        {[["plan","Verteilungsplan"],["tagesplan","Tagesplan"],["personal","Personal"],["db","Zimmerdatenbank"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{background:"none",border:"none",cursor:"pointer",padding:"11px 16px",fontSize:13,fontWeight:600,fontFamily:"inherit",color:tab===k?t.accent:t.textMuted,borderBottom:tab===k?"2px solid "+t.accent:"2px solid transparent",transition:"color .15s"}}>{l}</button>
        ))}
      </div>

      <div style={{padding:"22px 28px",maxWidth:1200,margin:"0 auto"}}>

        {/* PLAN */}
        {tab==="plan"&&(
          <div>
            {today.length===0&&<div style={{textAlign:"center",padding:60,color:t.textMuted}}>Noch keine Zimmer ausgewaehlt.<br/><span style={{color:t.accent}}>Tab Tagesplan aufrufen</span></div>}
            {today.length>0&&activeStaff.length===0&&<div style={{textAlign:"center",padding:60,color:t.textMuted}}>Keine Mitarbeiter anwesend.<br/><span style={{color:t.accent}}>Tab Personal aufrufen</span></div>}
            {today.length>0&&activeStaff.length>0&&(
              <>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:16}}>
                  {activeStaff.map(s=>{
                    const sRooms=assigned[s.id]||[], load=loads[s.id]||0, target=targets[s.id]||0;
                    return (
                      <div key={s.id} style={{background:t.bgCard,border:"1px solid "+t.border,borderRadius:14,overflow:"hidden"}}>
                        <div style={{padding:"14px 18px",background:"linear-gradient(90deg,"+t.accent+"12 0%,transparent 100%)",borderBottom:"1px solid "+t.border}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                            <div>
                              <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:t.text}}>{s.name}</div>
                              <div style={{fontSize:11,color:t.textSub,marginTop:2}}>{s.age} Jahre - {s.hours}h - x{AGE_FACTOR(s.age).toFixed(2)}</div>
                            </div>
                            <div style={{textAlign:"right"}}>
                              <div style={{fontSize:24,fontWeight:900,color:t.accent,fontFamily:"'Playfair Display',serif",lineHeight:1}}>{sRooms.length}</div>
                              <div style={{fontSize:10,color:t.textMuted}}>Zimmer</div>
                            </div>
                          </div>
                          <div style={{marginTop:10}}><FBar load={load} target={target} t={t}/></div>
                        </div>
                        <div style={{padding:"12px 16px",display:"flex",flexDirection:"column",gap:6}}>
                          {sRooms.length===0&&<span style={{color:t.textFaint,fontSize:12}}>Keine Zimmer</span>}
                          {sRooms.map(r=>(
                            <div key={r.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:t.bgInner,border:"1px solid "+t.border2,borderRadius:8,padding:"6px 11px"}}>
                              <div style={{display:"flex",alignItems:"center",gap:7}}>
                                <span style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:t.accent}}>{r.number}</span>
                                <Badge color={FLOOR_C[r.floor-1]}>Etage {r.floor}</Badge>
                                <Badge color={SIZE_C[r.size]}>{SIZE_L[r.size]}</Badge>
                                <Badge color={TYPE_C[r.type]}>{r.type==="bleibe"?"Bleibe":"Abreise"}</Badge>
                              </div>
                              <span style={{fontSize:10,color:t.textFaint}}>{roomWeight(r).toFixed(1)} Pkt</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{marginTop:20,background:t.bgCard,border:"1px solid "+t.border,borderRadius:12,padding:16,display:"flex",flexWrap:"wrap",gap:24}}>
                  <div>
                    <div style={{fontSize:10,color:t.textMuted,textTransform:"uppercase",letterSpacing:.7,marginBottom:6}}>Zimmergewicht</div>
                    <div style={{display:"flex",gap:12,fontSize:12,flexWrap:"wrap"}}>
                      {Object.entries(SIZE_C).map(([k,c])=><span key={k} style={{color:c}}>{SIZE_L[k]} {SIZE_PTS[k]}Pkt</span>)}
                      <span style={{color:TYPE_C.bleibe}}>Bleibe x0.55</span>
                      <span style={{color:TYPE_C.abreise}}>Abreise x1.0</span>
                    </div>
                  </div>
                  <div>
                    <div style={{fontSize:10,color:t.textMuted,textTransform:"uppercase",letterSpacing:.7,marginBottom:6}}>Altersfaktor</div>
                    <div style={{display:"flex",gap:10,fontSize:12,flexWrap:"wrap",color:t.textSub}}>
                      {[["35","1.00"],["36-45","0.92"],["46-55","0.82"],["56+","0.70"]].map(([r,f])=><span key={r}>{r}: x{f}</span>)}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAGESPLAN */}
        {tab==="tagesplan"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
              <div style={{fontSize:13,color:t.textSub}}>{today.length} Zimmer fuer heute ausgewaehlt</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {FLOORS.map(f=><Btn key={f} v="ghost" sm t={t} onClick={()=>addFloorToToday(f)}>+ Etage {f}</Btn>)}
                {today.length>0&&<Btn v="red" sm t={t} onClick={()=>setToday([])}>Alle entfernen</Btn>}
              </div>
            </div>
            {FLOORS.map(floor=>{
              const floorRooms=roomDB.filter(r=>r.floor===floor).sort((a,b)=>a.number.localeCompare(b.number));
              if (!floorRooms.length) return null;
              return (
                <Card key={floor} t={t}>
                  <CardHead label={floor+". Etage"} color={FLOOR_C[floor-1]} t={t} sub={today.filter(r=>r.floor===floor).length+" / "+floorRooms.length+" ausgewaehlt"}/>
                  <div style={{padding:14,display:"flex",flexWrap:"wrap",gap:8}}>
                    {floorRooms.map(r=>{
                      const te=today.find(t2=>t2.id===r.id), active=!!te;
                      return (
                        <div key={r.id} style={{display:"flex",flexDirection:"column",gap:5,background:active?FLOOR_C[floor-1]+"18":t.bgInner,border:"1px solid "+(active?FLOOR_C[floor-1]+"55":t.border2),borderRadius:10,padding:"10px 12px",transition:"all .2s",minWidth:110}}>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:6}}>
                            <button onClick={()=>toggleToday(r)} style={{background:"none",border:"none",cursor:"pointer",fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:active?FLOOR_C[floor-1]:t.textFaint,padding:0,display:"flex",alignItems:"center",gap:6}}>
                              <span style={{fontSize:11,opacity:.6}}>{active?"v":"o"}</span>{r.number}
                            </button>
                            <Badge color={SIZE_C[r.size]}>{SIZE_L[r.size]}</Badge>
                          </div>
                          {active&&(
                            <div style={{display:"flex",gap:4}}>
                              {["bleibe","abreise"].map(tp=>(
                                <button key={tp} onClick={()=>setRoomType(r.id,tp)} style={{flex:1,background:te.type===tp?TYPE_C[tp]+"33":"transparent",border:"1px solid "+(te.type===tp?TYPE_C[tp]:t.border2),borderRadius:5,color:te.type===tp?TYPE_C[tp]:t.textMuted,fontSize:10,fontWeight:700,cursor:"pointer",padding:"3px 0",fontFamily:"inherit"}}>
                                  {tp==="bleibe"?"Bleibe":"Abreise"}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* PERSONAL */}
        {tab==="personal"&&(
          <div>
            <Card t={t}>
              <CardHead label="Anwesenheit heute" color="#3a9e6a" t={t} sub={activeStaff.length+" von "+staff.length+" anwesend"}/>
              <div style={{padding:"14px 18px",display:"flex",flexWrap:"wrap",gap:10}}>
                {staff.length===0&&<span style={{color:t.textFaint,fontSize:12}}>Noch kein Personal.</span>}
                {staff.map(s=>{
                  const on=!!present[s.id];
                  return (
                    <button key={s.id} onClick={()=>togglePresent(s.id)} style={{display:"flex",alignItems:"center",gap:10,background:on?"#3a9e6a14":t.presentOff,border:"1px solid "+(on?"#3a9e6a55":t.border2),borderRadius:10,padding:"10px 14px",cursor:"pointer",transition:"all .2s",fontFamily:"inherit"}}>
                      <div style={{width:34,height:34,borderRadius:"50%",flexShrink:0,background:on?"#3a9e6a28":t.avatarOff,border:"2px solid "+(on?"#3a9e6a":t.border),display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:on?"#3a9e6a":t.textMuted}}>{s.name[0]}</div>
                      <div style={{textAlign:"left"}}>
                        <div style={{fontWeight:700,fontSize:13,color:on?t.text:t.textMuted}}>{s.name}</div>
                        <div style={{fontSize:10,color:on?t.textSub:t.textFaint,marginTop:1}}>{s.hours}h - {s.age} J.</div>
                      </div>
                      <div style={{width:18,height:18,borderRadius:5,flexShrink:0,background:on?"#3a9e6a":"transparent",border:"2px solid "+(on?"#3a9e6a":t.border),display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11,fontWeight:900}}>{on?"v":""}</div>
                    </button>
                  );
                })}
              </div>
            </Card>
            <Card t={t}>
              <CardHead label="Neuen Mitarbeiter anlegen" color={t.accent} t={t}/>
              <div style={{padding:"14px 18px",display:"grid",gridTemplateColumns:"2fr 1fr 1fr auto",gap:12,alignItems:"flex-end"}}>
                <Field label="Name" t={t}><TI value={nStaff.name} onChange={v=>setNStaff(p=>({...p,name:v}))} placeholder="Vorname Nachname" t={t}/></Field>
                <Field label="Alter" t={t}><TI type="number" min={16} max={70} value={nStaff.age} onChange={v=>setNStaff(p=>({...p,age:v}))} t={t}/></Field>
                <Field label="Stunden/Tag" t={t}><TI type="number" min={1} max={12} value={nStaff.hours} onChange={v=>setNStaff(p=>({...p,hours:v}))} t={t}/></Field>
                <Btn onClick={addStaff} t={t}>+ Anlegen</Btn>
              </div>
            </Card>
            <Card t={t}>
              <CardHead label={"Mitarbeiterliste ("+staff.length+")"} color={TYPE_C.bleibe} t={t}/>
              <div style={{padding:16,display:"flex",flexDirection:"column",gap:8}}>
                {staff.length===0&&<div style={{color:t.textFaint,textAlign:"center",padding:20}}>Noch keine Mitarbeiter.</div>}
                {staff.map(s=>(
                  editId===s.id
                    ? <EditRow key={s.id} s={s} onSave={saveStaff} onCancel={()=>setEditId(null)} t={t}/>
                    : (
                      <div key={s.id} style={{background:t.bgInner,border:"1px solid "+t.border2,borderRadius:10,padding:"11px 15px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}>
                        <div style={{display:"flex",gap:11,alignItems:"center"}}>
                          <div style={{width:36,height:36,borderRadius:"50%",flexShrink:0,background:present[s.id]?"#3a9e6a20":t.avatarOff,border:"1px solid "+(present[s.id]?"#3a9e6a55":t.border),display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:present[s.id]?"#3a9e6a":t.textMuted}}>{s.name[0]}</div>
                          <div>
                            <div style={{fontWeight:700,color:t.text,fontSize:14}}>{s.name}</div>
                            <div style={{fontSize:11,color:t.textSub,marginTop:2}}>
                              {s.age} Jahre - {s.hours}h/Tag - Faktor <span style={{color:t.accent}}>x{AGE_FACTOR(s.age).toFixed(2)}</span> - Kapazitaet <span style={{color:TYPE_C.bleibe}}>{staffCap(s).toFixed(1)} Pkt</span>
                            </div>
                          </div>
                        </div>
                        <div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap"}}>
                          <Badge color={present[s.id]?"#3a9e6a":t.textFaint}>{present[s.id]?"Anwesend":"Abwesend"}</Badge>
                          <Btn v="blue" sm t={t} onClick={()=>setEditId(s.id)}>Bearbeiten</Btn>
                          <Btn v="red"  sm t={t} onClick={()=>removeStaff(s.id)}>Entfernen</Btn>
                        </div>
                      </div>
                    )
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ZIMMERDATENBANK */}
        {tab==="db"&&(
          <div>
            <Card t={t}>
              <CardHead label="Zimmer hinzufuegen" color={t.accent} t={t}/>
              <div style={{padding:"14px 18px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr auto",gap:12,alignItems:"flex-end"}}>
                <Field label="Etage" t={t}><Sel value={nRoom.floor} onChange={v=>setNRoom(p=>({...p,floor:+v}))} t={t} options={FLOORS.map(f=>({value:f,label:f+". Etage"}))}/></Field>
                <Field label="Zimmernummer" t={t}><TI value={nRoom.number} onChange={v=>setNRoom(p=>({...p,number:v}))} placeholder="z.B. 307" t={t}/></Field>
                <Field label="Groesse" t={t}><Sel value={nRoom.size} onChange={v=>setNRoom(p=>({...p,size:v}))} t={t} options={[{value:"S",label:"Klein (S)"},{value:"M",label:"Mittel (M)"},{value:"L",label:"Gross (L)"}]}/></Field>
                <Btn onClick={addRoomDB} t={t}>+ Hinzufuegen</Btn>
              </div>
            </Card>
            {FLOORS.map(floor=>{
              const fRooms=roomDB.filter(r=>r.floor===floor).sort((a,b)=>a.number.localeCompare(b.number));
              return (
                <Card key={floor} t={t}>
                  <CardHead label={floor+". Etage"} color={FLOOR_C[floor-1]} t={t} sub={fRooms.length+" Zimmer"}/>
                  <div style={{padding:14,display:"flex",flexWrap:"wrap",gap:8}}>
                    {fRooms.length===0&&<span style={{color:t.textFaint,fontSize:12}}>Keine Zimmer.</span>}
                    {fRooms.map(r=>(
                      <div key={r.id} style={{background:t.bgInner,border:"1px solid "+t.border2,borderRadius:9,padding:"8px 12px",display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:t.accent}}>{r.number}</span>
                        <Badge color={SIZE_C[r.size]}>{SIZE_L[r.size]}</Badge>
                        <Btn v="red" sm t={t} onClick={()=>removeRoomDB(r.id)}>x</Btn>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
