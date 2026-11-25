/* ---------- utilitaires ---------- */
const esc = s => String(s??"").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmtDate = iso => { if(!iso) return ""; const [y,m,d]=iso.slice(0,10).split("-"); return `${d}/${m}`; };
const resultOf = (us,them) => (us===""||them===""||us==null||them==null) ? "" : (Number(us)>Number(them)?"V":Number(us)<Number(them)?"D":"N");
const byId = (arr,id) => arr.find(x=>x.id===id);
const realOnly = arr => { const real = arr.filter(x=>!x.example); return real.length ? real : arr; };
const hasExamples = () => [S.debriefs,S.observations,S.topics,S.decisions].some(a=>a.some(x=>x.example)) || S.team.example;
const pct = (a,b) => b ? Math.round(100*a/b) : null;

function debriefLabel(id){ const d=byId(S.debriefs,id); if(!d) return "match supprimé"; const r=resultOf(d.us,d.them); return `${fmtDate(d.date)} · ${d.opponent||"adversaire"}${d.shape?` (${d.shape})`:""}${r?` · ${d.us}-${d.them}`:""}`; }
function matchesOf(evIds){ const s=new Set(); evIds.forEach(id=>{ const o=byId(S.observations,id); if(o) s.add(o.debriefId); }); return s.size; }
function confidenceOf(n){ return n>=6 ? ["haute","Récurrent"] : n>=3 ? ["moyenne","Tendance"] : ["basse","Hypothèse"]; }

const VSCORE = {mieux:1, pareil:0, pire:-1};
function verdictOf(dec){
  const rv=(dec.reviews||[]).filter(r=>r.verdict && r.verdict!=="na");
  if(!rv.length) return null;
  const m = rv.reduce((a,r)=>a+VSCORE[r.verdict],0)/rv.length;
  return m>0.34 ? "Amélioré" : m<-0.34 ? "Dégradé" : "Stable";
}
function evidenceCount(dec){ return (dec.reviews||[]).filter(r=>r.verdict && r.verdict!=="na" && ((r.example||"").trim() || (r.count||"").toString().trim())).length; }
function biasFlag(dec){
  const rv=(dec.reviews||[]).filter(r=>r.verdict && r.verdict!=="na" && r.result);
  if(rv.length<3) return false;
  const align = rv.every(r=> (r.result==="V"&&r.verdict==="mieux")||(r.result==="D"&&r.verdict==="pire")||(r.result==="N"&&r.verdict==="pareil"));
  const counted = rv.filter(r=>/\d/.test(String(r.count||""))).length;
  return align && counted<2;
}
function reviewsDone(dec){ return (dec.reviews||[]).filter(r=>r.verdict && r.verdict!=="na").length; }

function metrics(){
  const topics=realOnly(S.topics), decs=realOnly(S.decisions);
  const decided=topics.filter(t=>t.status==="decided").length, judged=topics.length;
  const withInt=decs.filter(d=>d.intervention).length, worked=decs.filter(d=>d.workedAt).length;
  const reviewed=decs.filter(d=>reviewsDone(d)>0).length;
  const closedEv=decs.filter(d=>d.status==="closed" && d.evidenceOk).length;
  const month=today().slice(0,7);
  const closedMonth=decs.filter(d=>d.status==="closed" && d.evidenceOk && (d.closedAt||"").slice(0,7)===month).length;
  const active=decs.filter(d=>d.status!=="closed").length;
  return {decided,judged,withInt,worked,reviewed,closedEv,closedMonth,active,ndec:decs.length,ndeb:realOnly(S.debriefs).length};
}

