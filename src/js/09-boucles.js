/* ----- Boucles ----- */
function vBoucles(){
  const m=metrics(), decs=realOnly(S.decisions);
  const rows=[
    ["Capture","Débriefs enregistrés",`${m.ndeb}`,null,"Un débrief par match joué est l'objectif."],
    ["Décision rate","Sujets transformés en décision",`${m.decided}/${m.judged}`,pct(m.decided,m.judged),"Sujets décidés parmi tous les sujets proposés."],
    ["Execution rate","Décisions réellement travaillées",`${m.worked}/${m.ndec}`,pct(m.worked,m.ndec),"Intervention marquée « travaillée à l'entraînement »."],
    ["Review rate","Décisions réévaluées en match",`${m.reviewed}/${m.ndec}`,pct(m.reviewed,m.ndec),"Au moins une revue ciblée."],
    ["Loop completion","Boucles fermées avec preuves",`${m.closedEv}/${m.ndec}`,pct(m.closedEv,m.ndec),"Verdict appuyé par au moins 2 exemples ou comptages."]
  ];
  const tl=[...decs].sort((a,b)=>(a.createdAt||"").localeCompare(b.createdAt||""));
  const t=S.team;
  return `<section class="sect"><div><p class="eyebrow">North Star</p><h2>Boucles fermées</h2></div>
    <div class="card"><div class="big"><span class="n num">${m.closedMonth}</span><div><p><strong>boucle${m.closedMonth>1?"s":""} fermée${m.closedMonth>1?"s":""} avec preuves ce mois-ci</strong></p><p class="small muted">${m.active} boucle${m.active>1?"s":""} active${m.active>1?"s":""}. Une revue couvre environ 3 matchs : visez une boucle fermée toutes les 3 à 4 semaines.</p></div></div></div>
    <div class="card"><p class="eyebrow">Où la boucle casse</p><div class="tablewrap"><table class="kpi"><thead><tr><th>Indicateur</th><th>Valeur</th><th style="width:30%">Taux</th></tr></thead><tbody>
      ${rows.map(r=>`<tr><td><strong>${r[0]}</strong><br><span class="small muted">${r[1]}. ${r[4]}</span></td><td class="v">${r[2]}</td><td>${r[3]==null?"":`<div class="row" style="gap:8px;flex-wrap:nowrap"><div class="bar grow"><i style="width:${r[3]}%"></i></div><span class="num small">${r[3]} %</span></div>`}</td></tr>`).join("")}
    </tbody></table></div></div>
    ${tl.length?`<div class="card"><p class="eyebrow">Chaque boucle, de l'observation au verdict</p><div class="timeline">${tl.map(d=>`<div class="tl"><div class="small muted num">${fmtDate(d.createdAt)}${d.closedAt?` → ${fmtDate(d.closedAt)}`:""}</div><div><p><strong>${esc(d.title)}</strong></p><p class="small muted">${(d.evidenceIds||[]).length} observation${(d.evidenceIds||[]).length>1?"s":""} · ${d.intervention?esc(APPROACH[d.intervention.approach]||""):"pas d'intervention"} · ${reviewsDone(d)}/${d.reviewAfter||3} revues · ${d.status==="closed"?`<span class="v-${esc(d.outcome)}">${esc(d.outcome)}</span>`:"en cours"}</p></div></div>`).join("")}</div></div>`:""}
    <div class="card"><p class="eyebrow">Équipe</p>
      <div class="fgrid"><label class="f" for="t-name">Nom<input type="text" id="t-name" data-bind="team.name" value="${esc(t.name)}" placeholder="FC Exemple"></label>
      <label class="f" for="t-level">Niveau<select id="t-level" data-bind="team.level"><option value="semi-pro" ${t.level==="semi-pro"?"selected":""}>Semi-pro (R1 à N2)</option><option value="academie" ${t.level==="academie"?"selected":""}>Académie</option><option value="amateur" ${t.level==="amateur"?"selected":""}>Amateur</option></select></label>
      <label class="f" for="t-cat">Catégorie<input type="text" id="t-cat" data-bind="team.category" value="${esc(t.category)}" placeholder="Seniors R1, U17…"></label></div>
      <div class="row"><button class="btn" data-action="save-team" type="button" ${!S.canWrite?"disabled":""}>Enregistrer</button>${S.set.msg?`<span class="small ok">${esc(S.set.msg)}</span>`:""}</div>
      <p class="small muted">Toutes les personnes qui ont accès à cette page voient et complètent la même mémoire : invitez votre staff en Contributeur.</p></div>
  </section>`;
}

