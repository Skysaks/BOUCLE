/* ---------- rendu ---------- */
const $ = id => document.getElementById(id);
function render(){
  renderChrome();
  const main=$("main"), a=document.activeElement;
  if(a && main.contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.type!=="checkbox"){ pending=true; return; }
  pending=false;
  const v = {debrief:vDebrief, sujets:vSujets, decisions:vDecisions, memoire:vMemoire, boucles:vBoucles}[S.view];
  main.innerHTML = banners() + v();
}
function renderChrome(){
  $("teamchip").textContent = S.team.name ? `${S.team.name}${S.team.category?" · "+S.team.category:""}` : "Équipe";
  const m=metrics(), openTopics=realOnly(S.topics).filter(t=>t.status==="open").length;
  const openDec=realOnly(S.decisions).filter(d=>d.status!=="closed");
  const steps=[
    ["Capture", m.ndeb, `${m.ndeb} débrief${m.ndeb>1?"s":""}`, "debrief", m.ndeb>0],
    ["Insight", openTopics, `${openTopics} ouvert${openTopics>1?"s":""}`, "sujets", openTopics>0],
    ["Décision", openDec.length, `${openDec.length} active${openDec.length>1?"s":""}`, "decisions", openDec.length>0],
    ["Intervention", openDec.filter(d=>d.intervention).length, "travaillées", "decisions", openDec.some(d=>d.intervention)],
    ["Revue", m.closedEv, "fermées", "boucles", m.closedEv>0]
  ];
  const here = {debrief:0, sujets:1, decisions:2, memoire:-1, boucles:4}[S.view];
  $("chain").innerHTML = steps.map((s,i)=>`<button class="link ${s[4]?"on":""} ${i===here?"here":""}" data-action="go" data-view="${s[3]}" type="button" aria-label="${s[0]} : ${s[2]}"><span class="dot">${s[1]}</span><span class="lbl">${s[0]}</span><span class="sub">${s[2]}</span></button>`).join("");
  $("tabs").innerHTML = VIEWS.map(([k,l])=>`<button type="button" data-action="go" data-view="${k}" ${S.view===k?'aria-current="page"':""}>${l}</button>`).join("");
}
function banners(){
  let h="";
  if(S.mode==="loading") h+=`<div class="banner info"><div class="thinking"><span class="spin"></span>Ouverture de la mémoire du staff…</div></div>`;
  if(S.mode==="demo") h+=`<div class="banner info"><div><strong>Démonstration.</strong> Saison d'exemple fictive, en lecture seule. L'espace partagé du staff et l'assistant IA s'activent dans la version hébergée.</div></div>`;
  if(S.mode==="live" && !S.canWrite) h+=`<div class="banner info"><div><strong>Lecture seule.</strong> Votre accès permet de consulter, pas d'enregistrer. Demandez un accès Contributeur au propriétaire.</div></div>`;
  if(S.mode==="live" && hasExamples() && S.canWrite) h+=`<div class="banner ex"><div><strong>Saison d'exemple (FC Exemple, données fictives).</strong> Parcourez la boucle, puis effacez l'exemple avant votre premier vrai débrief.</div><button class="btn" data-action="clear-examples" type="button" ${S.set.busy?"disabled":""}>${S.set.busy?"Effacement…":"Effacer l'exemple"}</button></div>`;
  if(S.ai===false && S.mode!=="demo") h+=`<div class="banner info"><div><strong>Assistant IA indisponible ici.</strong> Vous pouvez saisir les observations à la main ; l'extraction, les sujets et les propositions d'entraînement sont désactivés.</div></div>`;
  return h;
}
const thinking = t => `<div class="thinking"><span class="spin"></span>${esc(t)}</div>`;
const phaseChip = p => p ? `<span class="chip phase">${esc(p)}</span>` : "";
const valChip = v => v==="+" ? `<span class="chip plus">+ fonctionne</span>` : `<span class="chip minus">− problème</span>`;

