/* ---------- démarrage ---------- */
function loadExampleLocal(){
  S.team={...EXAMPLE.team}; S.debriefs=EXAMPLE.debriefs; S.observations=EXAMPLE.observations; S.topics=EXAMPLE.topics; S.decisions=EXAMPLE.decisions;
}
const use = n => (window.claude && typeof window.claude.use==="function") ? window.claude.use(n).catch(()=>null) : Promise.resolve(null);
render();
(async()=>{
  const [d, s, u] = await Promise.all([use("db"), use("sample"), use("user")]);
  sample=s; S.ai = s ? null : false;
  if(!d){ S.mode="demo"; S.canWrite=false; loadExampleLocal(); render(); return; }
  db=d;
  if(u){ try{ uid=await u.id(); }catch(_){} try{ const w=await u.can("data.write"); S.canWrite = w!==false; }catch(_){ S.canWrite=true; } } else S.canWrite=true;
  const got=new Set();
  const mark=k=>{ got.add(k); if(got.size>=5) S.mode="live"; render(); };
  const sort=(arr,f)=>arr.sort((a,b)=>String(a[f]||"").localeCompare(String(b[f]||"")));
  const onErr=e=>{ if(e && e.code==="revoked"){ S.canWrite=false; } render(); };
  db.doc("meta/team").onSnapshot(sn=>{ S.team = sn.exists ? {name:"",level:"semi-pro",category:"", ...sn.data()} : {name:"",level:"semi-pro",category:""}; mark("team"); }, onErr);
  db.collection("debriefs").onSnapshot(sn=>{ S.debriefs=sort(sn.docs.map(x=>({id:x.id,...x.data()})),"date"); mark("debriefs"); }, onErr);
  db.collection("observations").onSnapshot(sn=>{ S.observations=sn.docs.map(x=>({id:x.id,...x.data()})); mark("observations"); }, onErr);
  db.collection("topics").onSnapshot(sn=>{ S.topics=sort(sn.docs.map(x=>({id:x.id,...x.data()})),"createdAt").reverse(); mark("topics"); }, onErr);
  db.collection("decisions").onSnapshot(sn=>{ S.decisions=sn.docs.map(x=>({id:x.id,...x.data()})); mark("decisions"); }, onErr);
})();
