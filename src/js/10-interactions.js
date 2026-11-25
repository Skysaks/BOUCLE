/* ---------- interactions ---------- */
function setPath(path,val){
  const p=path.split(".");
  if(p[0]==="rev"){ const r=S.cap.reviews[p[1]]||(S.cap.reviews[p[1]]={}); r[p[2]]=val; return; }
  let o=S; for(let i=0;i<p.length-1;i++) o=o[p[i]]; o[p[p.length-1]]=val;
}
document.addEventListener("input", e=>{
  const b=e.target.dataset && e.target.dataset.bind; if(!b) return;
  setPath(b, e.target.value);
  if(b.startsWith("cap.")) saveDraft();
});
document.addEventListener("change", e=>{
  const t=e.target;
  if(t.dataset && t.dataset.bind){ setPath(t.dataset.bind,t.value); if(t.dataset.live){ t.blur(); render(); } }
  if(t.dataset && t.dataset.action==="keep"){ S.cap.extracted[Number(t.dataset.i)].keep=t.checked; render(); }
});
document.addEventListener("focusout", ()=>{ setTimeout(()=>{ if(pending){ const a=document.activeElement; if(!(a && $("main").contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))) render(); } },0); });

document.addEventListener("click", async e=>{
  const el=e.target.closest("[data-action]"); if(!el || el.dataset.action==="keep") return;
  const ae=document.activeElement; if(ae && ae!==el && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) ae.blur();
  const a=el.dataset.action, id=el.dataset.id;
  try{
    if(a==="go"){ S.view=el.dataset.view; try{localStorage.setItem("boucle-view",S.view);}catch(_){} render(); window.scrollTo({top:0}); return; }
    if(a==="rv"){ const r=S.cap.reviews[id]||(S.cap.reviews[id]={}); r.verdict = r.verdict===el.dataset.v ? "" : el.dataset.v; render(); return; }
    if(a==="extract") return await extract();
    if(a==="manual"){ S.cap.step="confirm"; S.cap.extracted=[]; S.cap.error=""; render(); return; }
    if(a==="manual-add"){ const txt=$("m-text").value.trim(); if(!txt) return; S.cap.extracted.push({phase:$("m-phase").value, valence:$("m-val").value, text:txt, principle:"", players:[], period:"", hypothesis:"", certainty:"moyenne", keep:true}); render(); return; }
    if(a==="flip"){ const o=S.cap.extracted[Number(el.dataset.i)]; o.valence=o.valence==="+"?"-":"+"; render(); return; }
    if(a==="back-write"){ S.cap.step="write"; render(); return; }
    if(a==="confirm") return await confirmDebrief();
    if(a==="new-debrief"){ S.cap.done=null; S.cap.step="write"; render(); return; }
    if(a==="go-sujets-refresh"){ S.cap.done=null; S.cap.step="write"; S.view="sujets"; render(); return await refreshTopics(); }
    if(a==="refresh-topics") return await refreshTopics();
    if(a==="decide"){ const t=byId(S.topics,id); S.sujets.decideFor=id; S.sujets.form={title:t.title, kpi:t.kpi||"", after:3}; render(); return; }
    if(a==="cancel-decide"){ S.sujets.decideFor=null; render(); return; }
    if(a==="create-decision") return await createDecision(id);
    if(a==="dismiss") return await db.doc("topics/"+id).update({status:"dismissed"});
    if(a==="turn") return await turnIntoTraining(id);
    if(a==="choose"){ const d=byId(S.decisions,id); const o=d.options[Number(el.dataset.k)]; return await db.doc("decisions/"+id).update({intervention:o}); }
    if(a==="reopen-options"){ S.dec.open[id]=true; return await db.doc("decisions/"+id).update({intervention:null}); }
    if(a==="worked") return await db.doc("decisions/"+id).update({workedAt:today()});
    if(a==="extend"){ const d=byId(S.decisions,id); return await db.doc("decisions/"+id).update({reviewAfter:(d.reviewAfter||3)+2}); }
    if(a==="close"){ const d=byId(S.decisions,id); return await db.doc("decisions/"+id).update({status:"closed", outcome:verdictOf(d)||"Indéterminé", evidenceOk:evidenceCount(d)>=2, closedAt:new Date().toISOString()}); }
    if(a==="q"){ S.mem.q=el.closest(".qchips").querySelectorAll("button")[Number(el.dataset.i)].textContent; render(); return await ask(); }
    if(a==="ask") return await ask();
    if(a==="stop"){ memCtl && memCtl.abort(); return; }
    if(a==="save-team"){ await db.doc("meta/team").set({name:S.team.name.trim(), level:S.team.level, category:S.team.category.trim(), updatedAt:new Date().toISOString()}); S.set.msg="Enregistré"; render(); setTimeout(()=>{S.set.msg="";render();},2000); return; }
    if(a==="clear-examples") return await clearExamples();
  }catch(err){ dbFail(err); }
});
function dbFail(err){
  const code=err && err.code;
  if(code==="invalid_argument"){ S.canWrite=false; }
  const msg = code==="quota_exceeded" ? "La mémoire est pleine : supprimez d'anciens éléments avant d'en ajouter." : code==="invalid_argument" ? "Votre accès ne permet pas d'enregistrer." : "L'enregistrement a échoué. Réessayez dans un instant.";
  S.cap.error=msg; S.cap.busy=false; render();
}

