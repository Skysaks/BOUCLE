/* ---------- état ---------- */
const today = () => new Date().toISOString().slice(0,10);
const S = {
  mode:"loading", canWrite:false, ai:null, team:{name:"",level:"semi-pro",category:""},
  debriefs:[], observations:[], topics:[], decisions:[], view:"debrief", seen:new Set(),
  cap:{step:"write", date:today(), opponent:"", shape:"", us:"", them:"", text:"", reviews:{}, extracted:[], busy:false, error:"", done:null},
  sujets:{busy:false, error:"", decideFor:null, form:{title:"",kpi:"",after:3}},
  dec:{busy:{}, error:{}, open:{}},
  mem:{q:"", answer:"", busy:false, error:"", phase:"", shape:"", valence:""},
  set:{busy:false, msg:""}
};
let db=null, sample=null, uid=null, pending=false;

try { const d = JSON.parse(localStorage.getItem("boucle-draft")||"null"); if(d){ Object.assign(S.cap, {opponent:d.opponent||"", shape:d.shape||"", us:d.us??"", them:d.them??"", text:d.text||""}); } } catch(e){}
try { const v = localStorage.getItem("boucle-view"); if(v && VIEWS.some(x=>x[0]===v)) S.view=v; } catch(e){}
function saveDraft(){ try{ localStorage.setItem("boucle-draft", JSON.stringify({opponent:S.cap.opponent,shape:S.cap.shape,us:S.cap.us,them:S.cap.them,text:S.cap.text})); }catch(e){} }

