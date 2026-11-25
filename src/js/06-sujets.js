/* ----- Sujets ----- */
function vSujets(){
  const sj=S.sujets, open=S.topics.filter(t=>t.status==="open"), done=S.topics.filter(t=>t.status!=="open");
  const nObs=realOnly(S.observations).length;
  return `<section class="sect"><div class="secthead"><div><p class="eyebrow">Insight</p><h2>Ce qui mérite peut-être d'être travaillé</h2></div>
      <button class="btn primary" data-action="refresh-topics" type="button" ${sj.busy||S.ai===false||!S.canWrite||!nObs?"disabled":""}>${sj.busy?"Analyse…":"Actualiser les sujets"}</button></div>
    <p class="muted small">Trois sujets au maximum, tirés de vos observations confirmées. La confiance dépend du nombre de matchs où le sujet revient : 1 à 2 matchs = hypothèse, 3 à 5 = tendance, 6 et plus = récurrent.</p>
    ${sj.busy?`<div class="card">${thinking("Claude relit vos dernières observations…")}</div>`:""}
    ${sj.error?`<div class="banner err"><div>${esc(sj.error)}</div></div>`:""}
    ${!open.length && !sj.busy ? `<div class="card flat empty"><h3>Aucun sujet ouvert</h3><p class="muted">${nObs?"Actualisez les sujets après chaque débrief.":"Faites d'abord un débrief : les sujets naissent de vos observations."}</p></div>`:""}
    ${open.map(topicCard).join("")}
    ${done.length?`<div class="card"><p class="eyebrow">Déjà traités</p>${done.map(t=>`<div class="line"><div>${esc(t.title)} ${t.example?`<span class="chip">exemple</span>`:""}</div><div class="small muted">${t.status==="decided"?"→ décision":"écarté"}</div></div>`).join("")}</div>`:""}
  </section>`;
}
function topicCard(t){
  const n=matchesOf(t.evidenceIds||[]), [cl,cn]=confidenceOf(n), deciding=S.sujets.decideFor===t.id, f=S.sujets.form;
  const ev=(t.evidenceIds||[]).map(id=>byId(S.observations,id)).filter(Boolean);
  return `<article class="card"><div class="chips">${phaseChip(t.phase)}${valChip(t.valence)}<span class="chip conf-${cl}">${cn} · ${n} match${n>1?"s":""}</span>${t.example?`<span class="chip">exemple</span>`:""}</div>
    <h3>${esc(t.title)}</h3><p>${esc(t.summary)}</p>
    <details><summary>Voir les ${ev.length} observation${ev.length>1?"s":""} à l'appui</summary><div class="ev" style="margin-top:10px">${ev.map(o=>`<div><p>${o.valence==="+"?"＋":"−"} ${esc(o.text)}</p><p class="src">${esc(debriefLabel(o.debriefId))}</p></div>`).join("")}</div></details>
    ${deciding?`<div class="sect" style="border-top:1px solid var(--line);padding-top:12px">
      <label class="f" for="d-title">Que voulons-nous changer ?<input type="text" id="d-title" data-bind="sujets.form.title" value="${esc(f.title)}"></label>
      <div class="fgrid"><label class="f" for="d-kpi">Indicateur à suivre<span class="hint">comptable par un adjoint pendant le match</span><input type="text" id="d-kpi" data-bind="sujets.form.kpi" value="${esc(f.kpi)}"></label>
      <label class="f" for="d-after">Revue après<select id="d-after" data-bind="sujets.form.after">${[2,3,4,5].map(x=>`<option value="${x}" ${Number(f.after)===x?"selected":""}>${x} matchs</option>`).join("")}</select></label></div>
      <div class="row"><button class="btn primary" data-action="create-decision" data-id="${t.id}" type="button" ${!S.canWrite?"disabled":""}>Créer la décision</button><button class="btn ghost" data-action="cancel-decide" type="button">Annuler</button></div></div>`
    :`<div class="row"><button class="btn primary" data-action="decide" data-id="${t.id}" type="button" ${!S.canWrite?"disabled":""}>Décider</button><button class="btn ghost" data-action="dismiss" data-id="${t.id}" type="button" ${!S.canWrite?"disabled":""}>Écarter</button></div>`}
  </article>`;
}

