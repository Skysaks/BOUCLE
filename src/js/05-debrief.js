/* ----- Débrief ----- */
function openForReview(){ return realOnly(S.decisions).filter(d=>d.status!=="closed" && d.intervention); }
function vDebrief(){
  const c=S.cap;
  if(c.done){
    return `<section class="card"><p class="eyebrow">Débrief enregistré</p><h2>${c.done.obs} observation${c.done.obs>1?"s":""} ajoutée${c.done.obs>1?"s":""} à la mémoire</h2>
      <p class="muted">${c.done.rev ? `${c.done.rev} décision${c.done.rev>1?"s":""} réévaluée${c.done.rev>1?"s":""}. ` : ""}Prochaine étape : actualiser les sujets pour voir ce qui mérite d'être travaillé.</p>
      <div class="row"><button class="btn primary" data-action="go-sujets-refresh" type="button" ${S.ai===false?"disabled":""}>Actualiser les sujets</button><button class="btn" data-action="new-debrief" type="button">Nouveau débrief</button></div></section>` + recentDebriefs();
  }
  if(c.step==="confirm"){
    const kept=c.extracted.filter(o=>o.keep).length;
    return `<section class="sect"><div class="secthead"><div><p class="eyebrow">Étape 2 sur 2 · ${esc(c.opponent||"Match")} ${c.us!==""&&c.them!==""?esc(c.us+"-"+c.them):""}</p><h2>${c.extracted.length} observation${c.extracted.length>1?"s":""} identifiée${c.extracted.length>1?"s":""}. Confirmer ?</h2></div></div>
      <p class="muted small">Décochez ce qui est faux ou inutile. Touchez + / − pour corriger le sens.</p>
      <div class="list">${c.extracted.map((o,i)=>`<div class="obs ${o.keep?"":"off"}">
        <input type="checkbox" id="keep-${i}" data-action="keep" data-i="${i}" ${o.keep?"checked":""} aria-label="Garder l'observation ${i+1}">
        <div><div class="meta">${phaseChip(o.phase)}<button class="chip ${o.valence==="+"?"plus":"minus"}" style="border:0;cursor:pointer" data-action="flip" data-i="${i}" type="button">${o.valence==="+"?"+ fonctionne":"− problème"}</button>${o.period?`<span class="chip">${esc(o.period)}</span>`:""}${(o.players||[]).map(p=>`<span class="chip">${esc(p)}</span>`).join("")}<span class="chip conf-${esc(o.certainty||"moyenne")}">certitude ${esc(o.certainty||"moyenne")}</span></div>
          <p>${esc(o.text)}</p>${o.principle?`<p class="small muted">Principe : ${esc(o.principle)}</p>`:""}${o.hypothesis?`<p class="hyp">Hypothèse du staff : ${esc(o.hypothesis)}</p>`:""}</div></div>`).join("")}</div>
      ${manualAdd()}
      ${c.error?`<div class="banner err"><div>${esc(c.error)}</div></div>`:""}
      <div class="row"><button class="btn primary" data-action="confirm" type="button" ${c.busy||!S.canWrite?"disabled":""}>${c.busy?"Enregistrement…":`Confirmer ${kept} observation${kept>1?"s":""}`}</button><button class="btn ghost" data-action="back-write" type="button">Revenir au texte</button></div></section>`;
  }
  const rev=openForReview();
  return `<section class="sect"><div class="secthead"><div><p class="eyebrow">Après le match · 3 minutes</p><h2>Débrief</h2></div></div>
    <div class="card"><div class="fgrid">
      <label class="f" for="c-date">Date<input type="date" id="c-date" data-bind="cap.date" value="${esc(c.date)}"></label>
      <label class="f" for="c-opp">Adversaire<input type="text" id="c-opp" data-bind="cap.opponent" value="${esc(c.opponent)}" placeholder="AS Garonne" autocomplete="off"></label>
      <label class="f" for="c-shape">Structure adverse<select id="c-shape" data-bind="cap.shape"><option value="">Non notée</option>${SHAPES.map(s=>`<option ${c.shape===s?"selected":""}>${s}</option>`).join("")}</select></label>
      <div class="f"><span>Score (nous – eux)</span><div class="score"><input type="number" min="0" inputmode="numeric" id="c-us" data-bind="cap.us" value="${esc(c.us)}" aria-label="Buts marqués"><span>–</span><input type="number" min="0" inputmode="numeric" id="c-them" data-bind="cap.them" value="${esc(c.them)}" aria-label="Buts encaissés"></div></div>
    </div></div>
    ${rev.length?`<div class="card"><div><p class="eyebrow">Revue ciblée</p><h3>Ce que nous travaillons en ce moment</h3><p class="small muted">Deux réponses rapides par décision. Un exemple ou un comptage rend le verdict solide.</p></div>
      ${rev.map(d=>{ const r=c.reviews[d.id]||{}; return `<div class="sect" style="gap:8px;padding-top:10px;border-top:1px solid var(--line)"><p><strong>${esc(d.title)}</strong></p><p class="small muted">Indicateur : ${esc(d.kpi||"—")}</p>
        <div class="seg" role="group" aria-label="Évolution">${[["mieux","Mieux"],["pareil","Pareil"],["pire","Pire"],["na","Pas observé"]].map(([k,l])=>`<button type="button" class="v-${k}" aria-pressed="${r.verdict===k}" data-action="rv" data-id="${d.id}" data-v="${k}">${l}</button>`).join("")}</div>
        <div class="fgrid"><label class="f" for="rx-${d.id}">Un exemple<input type="text" id="rx-${d.id}" data-bind="rev.${d.id}.example" value="${esc(r.example||"")}" placeholder="Ce qu'on a vu"></label><label class="f" for="rc-${d.id}">Comptage<span class="hint">facultatif, ex. 6/9</span><input type="text" id="rc-${d.id}" data-bind="rev.${d.id}.count" value="${esc(r.count||"")}" inputmode="text"></label></div></div>`; }).join("")}</div>`:""}
    <div class="card"><label class="f" for="c-text">Ce que vous avez vu<span class="hint">Parlez comme au vestiaire. Sur téléphone, touchez le micro du clavier pour dicter.</span>
      <textarea id="c-text" data-bind="cap.text" placeholder="Première mi-temps, on a souffert quand leur 6 venait décrocher. Nos deux attaquants pressaient trop haut et le milieu sortait trop tard. Par contre la sortie côté droit a bien fonctionné…">${esc(c.text)}</textarea></label>
      ${c.error?`<div class="banner err"><div>${esc(c.error)}</div></div>`:""}
      <div class="row">${c.busy?thinking("Claude structure votre débrief… (5 à 30 s)"):`<button class="btn primary" data-action="extract" type="button" ${S.ai===false||!S.canWrite?"disabled":""}>Extraire les observations</button><button class="btn ghost" data-action="manual" type="button" ${!S.canWrite?"disabled":""}>Saisir à la main</button>`}</div>
    </div></section>` + recentDebriefs();
}
function manualAdd(){
  return `<details><summary>Ajouter une observation à la main</summary><div class="fgrid" style="margin-top:10px">
    <label class="f" for="m-phase">Phase<select id="m-phase">${PHASES.map(p=>`<option>${p}</option>`).join("")}</select></label>
    <label class="f" for="m-val">Sens<select id="m-val"><option value="-">− problème</option><option value="+">+ fonctionne</option></select></label>
    <label class="f" for="m-text" style="grid-column:1/-1">Observation<input type="text" id="m-text" placeholder="Nos centraux jouent long dès la pression"></label></div>
    <div class="row" style="margin-top:10px"><button class="btn" data-action="manual-add" type="button">Ajouter</button></div></details>`;
}
function recentDebriefs(){
  const ds=[...S.debriefs].sort((a,b)=>(b.date||"").localeCompare(a.date||"")).slice(0,6);
  if(!ds.length) return S.mode==="live"?`<section class="card flat empty"><h3>Aucun débrief pour l'instant</h3><p class="muted">Après votre prochain match, dictez trois minutes de ce que vous avez vu. Boucle en tire les observations.</p></section>`:"";
  return `<section class="card"><p class="eyebrow">Derniers débriefs</p><div>${ds.map(d=>{ const n=S.observations.filter(o=>o.debriefId===d.id).length; const r=resultOf(d.us,d.them); return `<div class="line"><div><strong>${esc(d.opponent||"Match")}</strong> <span class="muted small">${fmtDate(d.date)}${d.shape?" · "+esc(d.shape):""}</span>${d.example?` <span class="chip">exemple</span>`:""}</div><div class="num">${r?`${esc(d.us)}-${esc(d.them)} <span class="chip ${r==="V"?"plus":r==="D"?"minus":""}">${r}</span>`:""} <span class="muted small">${n} obs.</span></div></div>`; }).join("")}</div></section>`;
}

