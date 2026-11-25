/* ---------- appels à Claude ---------- */
function aiError(e){
  const c=e && e.code;
  if(c==="not_granted"||c==="sampling_disabled"||c==="not_declared"||c==="capability_disabled"||c==="capability_removed"){ S.ai=false; return "Claude n'est pas autorisé dans cette vue."; }
  if(c==="rate_limited") return "Trop de demandes pour le moment. Réessayez dans quelques minutes.";
  if(c==="invalid_json"||c==="empty_completion") return "La réponse n'était pas exploitable. Réessayez.";
  if(c==="refused") return "Claude n'a pas traité ce texte. Reformulez-le.";
  if(c==="cancelled") return "";
  return "La demande a échoué. Réessayez.";
}
const teamLine = () => `${S.team.level==="academie"?"académie":S.team.level==="amateur"?"amateur":"semi-pro"}${S.team.category?", "+S.team.category:""}`;

async function extract(){
  const c=S.cap; if(!c.text.trim()){ c.error="Dictez ou écrivez au moins quelques phrases."; render(); return; }
  c.busy=true; c.error=""; render();
  const prompt=`Tu assistes le staff d'une équipe de football (${teamLine()}). Transforme le débrief d'après-match ci-dessous en observations footballistiques structurées.
Règles :
- Une observation = un fait de jeu observé. Découpe quand le coach décrit plusieurs faits.
- N'invente rien qui n'est pas dans le texte. Joueurs : seulement ceux nommés tels quels (prénom, numéro ou poste).
- phase : une valeur exacte parmi ${JSON.stringify(PHASES)}.
- principle : le principe de jeu concerné, 3 à 7 mots.
- valence : "+" si ça a fonctionné, "-" si c'est un problème.
- period : "1re MT", "2e MT", "minute X", ou "" si rien n'est dit.
- hypothesis : la cause avancée par le coach, sinon "".
- certainty : "haute" si le coach est affirmatif, "moyenne" par défaut, "basse" s'il doute.
- text : reformulation fidèle, 25 mots maximum, à la première personne du pluriel ("Nous…", "Nos…").
Contexte : adversaire ${c.opponent||"non précisé"}, structure adverse ${c.shape||"non notée"}, score ${c.us!==""&&c.them!==""?c.us+"-"+c.them:"non noté"}.
Réponds uniquement en JSON : {"observations":[{"phase":"","principle":"","players":[],"period":"","valence":"-","text":"","hypothesis":"","certainty":"moyenne"}]}
Débrief :
"""${c.text.slice(0,12000)}"""`;
  try{
    const out=await sample.json(prompt,{modelTier:"default"});
    const list=(out && Array.isArray(out.observations) ? out.observations : []).filter(o=>o && o.text).slice(0,20).map(o=>({
      phase:PHASES.includes(o.phase)?o.phase:"Gestion du match", principle:String(o.principle||""), players:Array.isArray(o.players)?o.players.map(String).slice(0,6):[],
      period:String(o.period||""), valence:o.valence==="+"?"+":"-", text:String(o.text), hypothesis:String(o.hypothesis||""),
      certainty:["haute","moyenne","basse"].includes(o.certainty)?o.certainty:"moyenne", keep:true}));
    if(!list.length){ c.error="Aucune observation trouvée. Ajoutez des faits de jeu précis."; }
    else { c.extracted=list; c.step="confirm"; }
  }catch(e){ c.error=aiError(e); }
  c.busy=false; render();
}

async function confirmDebrief(){
  const c=S.cap, keep=c.extracted.filter(o=>o.keep);
  const revs=Object.entries(c.reviews).filter(([id,r])=>r.verdict && byId(S.decisions,id));
  if(!keep.length && !revs.length){ c.error="Gardez au moins une observation."; render(); return; }
  c.busy=true; c.error=""; render();
  const now=new Date().toISOString(), us=c.us===""?"":Number(c.us), them=c.them===""?"":Number(c.them);
  const dref=db.collection("debriefs").doc();
  await dref.set({date:c.date, opponent:c.opponent.trim(), shape:c.shape, us, them, text:c.text, author:uid||"", createdAt:now});
  for(const o of keep){ const {keep:_k, ...body}=o; await db.collection("observations").doc().set({...body, debriefId:dref.id, createdAt:now, author:uid||""}); }
  for(const [id,r] of revs){
    const d=byId(S.decisions,id);
    const reviews=[...(d.reviews||[]), {debriefId:dref.id, date:c.date, opponent:c.opponent.trim(), result:resultOf(us,them), verdict:r.verdict, example:(r.example||"").trim(), count:(r.count||"").trim()}];
    await db.doc("decisions/"+id).update({reviews});
  }
  c.done={obs:keep.length, rev:revs.length};
  Object.assign(c,{busy:false, step:"write", text:"", opponent:"", shape:"", us:"", them:"", reviews:{}, extracted:[], date:today()});
  saveDraft(); render();
}

async function refreshTopics(){
  const sj=S.sujets; if(sj.busy) return;
  const obs=realOnly(S.observations);
  if(!obs.length){ sj.error="Aucune observation à analyser."; render(); return; }
  sj.busy=true; sj.error=""; render();
  const recentDeb=[...realOnly(S.debriefs)].sort((a,b)=>(b.date||"").localeCompare(a.date||"")).slice(0,8).map(d=>d.id);
  const pool=obs.filter(o=>recentDeb.includes(o.debriefId)).slice(0,160);
  const lines=pool.map(o=>`${o.id} | ${debriefLabel(o.debriefId)} | ${o.phase} | ${o.valence} | ${o.text}${o.hypothesis?" | hypothèse : "+o.hypothesis:""}`).join("\n");
  const taken=S.topics.filter(t=>t.status!=="open").map(t=>"- "+t.title).join("\n")||"aucun";
  const prompt=`Tu assistes le staff d'une équipe de football (${teamLine()}). À partir des observations ci-dessous, propose au maximum 3 sujets qui méritent peut-être d'être travaillés.
Priorités : un sujet qui revient sur plusieurs matchs passe avant un fait isolé ; l'impact sur les buts ou occasions compte ; un point positif peut être un sujet "à consolider".
Règles :
- evidenceIds : uniquement des identifiants présents dans la liste, au moins 2 si possible.
- N'invente aucun fait. Ne reprends pas un sujet déjà traité.
- title : 8 mots maximum. summary : 35 mots maximum, factuel.
- phase : une valeur exacte parmi ${JSON.stringify(PHASES)}. valence : "-" ou "+".
- kpi : un indicateur simple qu'un adjoint peut compter pendant un match (forme "X / Y").
Sujets déjà traités :
${taken}
Observations (id | match | phase | sens | texte) :
${lines}
Réponds uniquement en JSON : {"topics":[{"title":"","summary":"","phase":"","valence":"-","evidenceIds":[],"kpi":""}]}`;
  try{
    const out=await sample.json(prompt,{modelTier:"default"});
    const ids=new Set(pool.map(o=>o.id));
    const fresh=(out && Array.isArray(out.topics)?out.topics:[]).map(t=>({title:String(t.title||"").slice(0,90), summary:String(t.summary||""), phase:PHASES.includes(t.phase)?t.phase:"", valence:t.valence==="+"?"+":"-", evidenceIds:(Array.isArray(t.evidenceIds)?t.evidenceIds:[]).map(String).filter(x=>ids.has(x)), kpi:String(t.kpi||"")})).filter(t=>t.title && t.evidenceIds.length).slice(0,3);
    if(!fresh.length){ sj.error="Pas de sujet solide dans les observations actuelles."; }
    else{
      for(const t of S.topics.filter(t=>t.status==="open" && !t.example)) await db.doc("topics/"+t.id).delete();
      const now=new Date().toISOString();
      for(const t of fresh) await db.collection("topics").doc().set({...t, status:"open", createdAt:now});
    }
  }catch(e){ sj.error = aiError(e); }
  sj.busy=false; render();
}

async function createDecision(topicId){
  const t=byId(S.topics,topicId), f=S.sujets.form;
  if(!f.title.trim()){ return; }
  const ref=db.collection("decisions").doc();
  await ref.set({title:f.title.trim(), problem:t.summary||"", topicId, phase:t.phase||"", evidenceIds:t.evidenceIds||[], kpi:f.kpi.trim(), reviewAfter:Number(f.after)||3, status:"open", intervention:null, reviews:[], createdAt:new Date().toISOString(), author:uid||""});
  await db.doc("topics/"+topicId).update({status:"decided", decisionId:ref.id});
  S.sujets.decideFor=null; S.view="decisions"; render();
}

async function turnIntoTraining(id){
  const st=S.dec, d=byId(S.decisions,id); if(st.busy[id]) return;
  st.busy[id]=true; st.error[id]=""; st.open[id]=true; render();
  const ev=(d.evidenceIds||[]).map(x=>byId(S.observations,x)).filter(Boolean).map(o=>`- ${o.text}${o.hypothesis?" (hypothèse : "+o.hypothesis+")":""}`).join("\n");
  const graph=GRAPH[d.phase];
  const prompt=`Tu es entraîneur adjoint diplômé. Le staff d'une équipe (${teamLine()}) a pris cette décision :
Décision : ${d.title}
Problème : ${d.problem}
Indicateur suivi : ${d.kpi}
Observations de match :
${ev||"- aucune"}
${graph?`Référentiel du staff (à utiliser en priorité, sans le contredire) :
${graph}`:"Aucun référentiel staff pour cette phase : tes propositions sont hors référentiel, mets fromGraph à false."}
Propose exactement 3 façons de travailler ce comportement à l'entraînement, dans cet ordre :
1. approach "decouverte" : un environnement où les joueurs trouvent la solution eux-mêmes.
2. approach "repetition" : un environnement plus contraint qui répète le comportement.
3. approach "realisme" : reproduire presque exactement la structure du problème rencontré en match.
Pour chacune : title (6 mots max), why (pourquoi cet environnement, 25 mots max), expected (comportement attendu), constraint (la contrainte qui provoque le comportement), setup (espace en mètres, effectif, durée en minutes ; pour 14 à 18 joueurs de champ, séance de 75 à 90 min), cues (3 consignes courtes de 5 mots max), success (critère observable chiffré), tradeoff (le risque ou effet secondaire), fromGraph (true si tiré du référentiel).
Français, vocabulaire de terrain, aucune généralité.
Réponds uniquement en JSON : {"options":[{"approach":"decouverte","title":"","why":"","expected":"","constraint":"","setup":"","cues":["","",""],"success":"","tradeoff":"","fromGraph":true}]}`;
  try{
    const out=await sample.json(prompt,{modelTier:"default", cache:false});
    const opts=(out && Array.isArray(out.options)?out.options:[]).slice(0,3).map(o=>({approach:["decouverte","repetition","realisme"].includes(o.approach)?o.approach:"realisme", title:String(o.title||""), why:String(o.why||""), expected:String(o.expected||""), constraint:String(o.constraint||""), setup:String(o.setup||""), cues:(Array.isArray(o.cues)?o.cues:[]).map(String).slice(0,4), success:String(o.success||""), tradeoff:String(o.tradeoff||""), fromGraph: graph ? o.fromGraph!==false : false}));
    if(opts.length<3) st.error[id]="Proposition incomplète. Réessayez.";
    else await db.doc("decisions/"+id).update({options:opts});
  }catch(e){ st.error[id]= aiError(e); }
  st.busy[id]=false; render();
}

let memCtl=null;
async function ask(){
  const m=S.mem; if(!m.q.trim()||m.busy) return;
  m.busy=true; m.answer=""; m.error=""; render();
  const debs=realOnly(S.debriefs), obs=realOnly(S.observations), decs=realOnly(S.decisions);
  const dLines=[...debs].sort((a,b)=>(a.date||"").localeCompare(b.date||"")).map(d=>{
    const os=obs.filter(o=>o.debriefId===d.id).map(o=>`    [${o.phase} ${o.valence}] ${o.text}${o.hypothesis?" (hyp. "+o.hypothesis+")":""}`).join("\n");
    return `- ${debriefLabel(d.id)}\n${os}`; }).join("\n");
  const kLines=decs.map(k=>`- Décision « ${k.title} » (${k.phase}), indicateur : ${k.kpi}. Intervention : ${k.intervention?`${APPROACH[k.intervention.approach]||""} — ${k.intervention.title}`:"aucune"}${k.workedAt?", travaillée le "+k.workedAt:""}. Revues : ${(k.reviews||[]).map(r=>`${r.date} ${r.opponent} ${r.verdict}${r.count?" ("+r.count+")":""}${r.example?" « "+r.example+" »":""}`).join(" ; ")||"aucune"}. Statut : ${k.status==="closed"?"fermée, "+k.outcome:"en cours"}.`).join("\n");
  const prompt=`Tu es la mémoire du staff d'une équipe de football (${teamLine()}). Réponds à la question uniquement avec les données ci-dessous.
Règles : français, 180 mots maximum ; cite les matchs par date et adversaire ; distingue ce qui a été essayé, ce qui a semblé fonctionner et ce qui reste incertain ; une évolution observée est une association, pas une preuve de cause ; si les données ne suffisent pas, dis-le et indique ce qu'il faudrait noter aux prochains débriefs. Pas de titres Markdown, pas de gras.
Question : ${m.q}
Matchs et observations :
${dLines||"aucun"}
Décisions et revues :
${kLines||"aucune"}`;
  memCtl=new AbortController();
  try{
    await sample(prompt.slice(0,200000),{signal:memCtl.signal, cache:false, onText:({text})=>{ m.answer=text; const el=$("answer"); if(el) el.textContent=text; else render(); }});
  }catch(e){ if(e && e.text) m.answer=e.text; m.error=aiError(e); }
  m.busy=false; render();
}

async function clearExamples(){
  if(S.set.busy) return; S.set.busy=true; render();
  try{
    for(const [coll,key] of [["observations","observations"],["debriefs","debriefs"],["topics","topics"],["decisions","decisions"]]){
      for(const x of S[key].filter(x=>x.example)) await db.doc(coll+"/"+x.id).delete();
    }
    if(S.team.example) await db.doc("meta/team").set({name:"", level:"semi-pro", category:"", updatedAt:new Date().toISOString()});
  }catch(e){ dbFail(e); }
  S.set.busy=false; S.view="debrief"; render();
}

