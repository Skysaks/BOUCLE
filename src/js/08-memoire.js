/* ----- Mémoire ----- */
function vMemoire(){
  const m=S.mem, obs=[...S.observations].filter(o=>(!m.phase||o.phase===m.phase)&&(!m.valence||o.valence===m.valence)&&(!m.shape||(byId(S.debriefs,o.debriefId)||{}).shape===m.shape));
  obs.sort((a,b)=>((byId(S.debriefs,b.debriefId)||{}).date||"").localeCompare((byId(S.debriefs,a.debriefId)||{}).date||""));
  const qs=["Contre les 4-4-2, qu'avons-nous essayé pour sortir du pressing, et qu'est-ce qui a semblé marcher ?","Quels problèmes reviennent le plus souvent depuis le début de saison ?","Qu'a donné notre travail sur la transition défensive ?"];
  return `<section class="sect"><div><p class="eyebrow">Mémoire du staff</p><h2>Interroger la saison</h2></div>
    <div class="card"><label class="f" for="q">Votre question<input type="text" id="q" data-bind="mem.q" value="${esc(m.q)}" placeholder="Contre les 4-4-2, qu'avons-nous essayé ?"></label>
      <div class="qchips">${qs.map((q,i)=>`<button type="button" data-action="q" data-i="${i}">${esc(q)}</button>`).join("")}</div>
      <div class="row">${m.busy?`<button class="btn" data-action="stop" type="button">Arrêter</button>`:`<button class="btn primary" data-action="ask" type="button" ${S.ai===false?"disabled":""}>Demander</button>`}</div>
      ${m.error?`<div class="banner err"><div>${esc(m.error)}</div></div>`:""}
      ${m.busy&&!m.answer?thinking("Claude relit vos débriefs, décisions et revues…"):""}
      ${m.answer?`<div class="answer" id="answer">${esc(m.answer)}</div><p class="small muted">Réponse construite uniquement à partir de votre mémoire. Une évolution observée n'est pas une preuve de cause.</p>`:""}
    </div>
    <div class="card"><div class="secthead"><div><p class="eyebrow">Parcourir</p><h3>${obs.length} observation${obs.length>1?"s":""}</h3></div></div>
      <div class="fgrid"><label class="f" for="fp">Phase<select id="fp" data-bind="mem.phase" data-live="1"><option value="">Toutes</option>${PHASES.map(p=>`<option ${m.phase===p?"selected":""}>${p}</option>`).join("")}</select></label>
      <label class="f" for="fs">Structure adverse<select id="fs" data-bind="mem.shape" data-live="1"><option value="">Toutes</option>${SHAPES.map(s=>`<option ${m.shape===s?"selected":""}>${s}</option>`).join("")}</select></label>
      <label class="f" for="fv">Sens<select id="fv" data-bind="mem.valence" data-live="1"><option value="">Les deux</option><option value="+" ${m.valence==="+"?"selected":""}>+ fonctionne</option><option value="-" ${m.valence==="-"?"selected":""}>− problème</option></select></label></div>
      <div>${obs.slice(0,60).map(o=>`<div class="line"><div><p>${esc(o.text)}</p><p class="small muted">${esc(debriefLabel(o.debriefId))}</p></div><div class="chips" style="justify-content:flex-end">${phaseChip(o.phase)}${o.valence==="+"?`<span class="chip plus">+</span>`:`<span class="chip minus">−</span>`}</div></div>`).join("")||`<p class="muted">Aucune observation pour ces filtres.</p>`}</div>
    </div></section>`;
}

