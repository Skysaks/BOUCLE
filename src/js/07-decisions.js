/* ----- Décisions ----- */
function vDecisions(){
  const all=[...S.decisions].sort((a,b)=>(b.createdAt||"").localeCompare(a.createdAt||""));
  const open=all.filter(d=>d.status!=="closed"), closed=all.filter(d=>d.status==="closed");
  return `<section class="sect"><div><p class="eyebrow">Décision → intervention → revue</p><h2>Décisions actives</h2></div>
    ${!open.length?`<div class="card flat empty"><h3>Aucune décision active</h3><p class="muted">Transformez un sujet en décision depuis l'onglet Sujets.</p><button class="btn" data-action="go" data-view="sujets" type="button">Voir les sujets</button></div>`:""}
    ${open.map(decCard).join("")}
    ${closed.length?`<div class="sect"><h3>Boucles fermées</h3>${closed.map(d=>`<div class="card"><div class="chips">${phaseChip(d.phase)}${d.example?`<span class="chip">exemple</span>`:""}${d.evidenceOk?`<span class="chip plus">avec preuves</span>`:`<span class="chip warn">sans preuve suffisante</span>`}</div><div class="row" style="justify-content:space-between"><h3 class="grow" style="min-width:0">${esc(d.title)}</h3><span class="verdict v-${esc(d.outcome)}">${esc(d.outcome)}</span></div><p class="small muted">${esc(d.kpi)} · fermée le ${fmtDate(d.closedAt)} · ${reviewsDone(d)} revue${reviewsDone(d)>1?"s":""}</p></div>`).join("")}</div>`:""}
  </section>`;
}
function decCard(d){
  const st=S.dec, busy=st.busy[d.id], err=st.error[d.id], done=reviewsDone(d), need=d.reviewAfter||3;
  const pips=Array.from({length:Math.max(need,done)},(_,i)=>{ const r=(d.reviews||[]).filter(x=>x.verdict&&x.verdict!=="na")[i]; return `<span class="pip ${r?r.verdict:""}" title="${r?esc(r.verdict+" · "+fmtDate(r.date)):"à venir"}"></span>`; }).join("");
  const verdict=verdictOf(d), ev=evidenceCount(d), ready=done>=need;
  let inter="";
  if(d.intervention){
    const i=d.intervention;
    inter=`<div class="sect" style="gap:8px;border-top:1px solid var(--line);padding-top:12px"><p class="appr">Intervention · ${esc(APPROACH[i.approach]||i.approach)}${i.fromGraph===false?" · hors référentiel":""}</p><h3>${esc(i.title)}</h3><p class="small">${esc(i.setup)}</p><p class="small"><strong>Contrainte :</strong> ${esc(i.constraint)}</p><p class="small"><strong>Réussite :</strong> ${esc(i.success)}</p>
      <div class="row">${d.workedAt?`<span class="ok small">Travaillée le ${fmtDate(d.workedAt)}</span>`:`<button class="btn" data-action="worked" data-id="${d.id}" type="button" ${!S.canWrite?"disabled":""}>Travaillée à l'entraînement</button>`}<button class="btn ghost" data-action="reopen-options" data-id="${d.id}" type="button" ${!S.canWrite?"disabled":""}>Changer d'approche</button></div></div>`;
  } else if(d.options && d.options.length && st.open[d.id]!==false){
    inter=`<div class="sect" style="border-top:1px solid var(--line);padding-top:12px"><p class="eyebrow">Trois façons de le travailler</p><div class="opts">${d.options.map((o,k)=>`<div class="opt"><p class="appr">${esc(APPROACH[o.approach]||o.approach)}</p><h3>${esc(o.title)}</h3>${o.fromGraph===false?`<span class="chip warn">hors référentiel</span>`:`<span class="chip phase">référentiel staff</span>`}<dl><dt>Pourquoi</dt><dd>${esc(o.why)}</dd><dt>Comportement attendu</dt><dd>${esc(o.expected)}</dd><dt>Contrainte</dt><dd>${esc(o.constraint)}</dd><dt>Organisation</dt><dd>${esc(o.setup)}</dd><dt>Consignes</dt><dd><ul>${(o.cues||[]).map(c=>`<li>${esc(c)}</li>`).join("")}</ul></dd><dt>Réussite</dt><dd>${esc(o.success)}</dd><dt>Compromis</dt><dd>${esc(o.tradeoff)}</dd></dl><button class="btn primary" data-action="choose" data-id="${d.id}" data-k="${k}" type="button" ${!S.canWrite?"disabled":""}>Choisir</button></div>`).join("")}</div>
      <div class="row"><button class="btn ghost" data-action="turn" data-id="${d.id}" type="button" ${busy||S.ai===false?"disabled":""}>Proposer trois autres</button></div></div>`;
  } else {
    inter=`<div class="row" style="border-top:1px solid var(--line);padding-top:12px">${busy?thinking("Claude part du référentiel staff… (10 à 40 s)"):`<button class="btn primary" data-action="turn" data-id="${d.id}" type="button" ${S.ai===false||!S.canWrite?"disabled":""}>Transformer en entraînement</button>`}</div>`;
  }
  return `<article class="card"><div class="chips">${phaseChip(d.phase)}${d.example?`<span class="chip">exemple</span>`:""}</div>
    <h3>${esc(d.title)}</h3>${d.problem?`<p class="muted">${esc(d.problem)}</p>`:""}
    <div class="row" style="justify-content:space-between"><p class="small"><strong>Indicateur :</strong> ${esc(d.kpi||"—")}</p><div class="progress" aria-label="${done} revue(s) sur ${need}">${pips}<span class="small muted num">${done}/${need}</span></div></div>
    ${err?`<div class="banner err"><div>${esc(err)}</div></div>`:""}
    ${inter}
    ${(d.reviews||[]).length?`<details><summary>Revues match par match</summary><div class="ev" style="margin-top:10px">${d.reviews.map(r=>`<div><p><span class="chip ${r.verdict==="mieux"?"plus":r.verdict==="pire"?"minus":r.verdict==="pareil"?"warn":""}">${esc(r.verdict==="na"?"pas observé":r.verdict)}</span> ${esc(r.example||"")} ${r.count?`<span class="num">· ${esc(r.count)}</span>`:""}</p><p class="src">${fmtDate(r.date)} · ${esc(r.opponent||"")} ${r.result?"· "+esc(r.result):""}</p></div>`).join("")}</div></details>`:""}
    ${ready?`<div class="sect" style="gap:8px;border-top:1px solid var(--line);padding-top:12px"><p class="eyebrow">Verdict sur ${done} matchs</p><p class="verdict v-${verdict}">${verdict}</p>
      ${biasFlag(d)?`<p class="banner err small"><span>Attention : l'appréciation suit exactement le score de chaque match, sans comptage. Le verdict reflète peut-être le résultat plus que le comportement.</span></p>`:""}
      <p class="small muted">${ev>=2?`${ev} revues appuyées par un exemple ou un comptage : la boucle peut se fermer avec preuves.`:`Seulement ${ev} revue${ev>1?"s":""} appuyée${ev>1?"s":""} par un exemple ou un comptage. Il en faut 2 pour une boucle fermée avec preuves.`}</p>
      <div class="row"><button class="btn bib" data-action="close" data-id="${d.id}" type="button" ${!S.canWrite?"disabled":""}>Fermer la boucle</button><button class="btn ghost" data-action="extend" data-id="${d.id}" type="button" ${!S.canWrite?"disabled":""}>Prolonger de 2 matchs</button></div></div>`
    :`<p class="small muted">${d.intervention?`Encore ${need-done} match${need-done>1?"s":""} de revue ciblée avant un verdict.`:"Choisissez une intervention : la revue ciblée apparaîtra dans le prochain débrief."}</p>`}
  </article>`;
}

