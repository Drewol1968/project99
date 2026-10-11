import { getPublicBetaMetrics, getPublicSourcesToday } from "./ranking.js?v=6";
const $=id=>document.getElementById(id);
const fmt=n=>Number(n||0).toLocaleString();
async function load(){
  try{
    const [m,sources]=await Promise.all([getPublicBetaMetrics(),getPublicSourcesToday()]);
    if(m){
      $("mPlayers").textContent=fmt(m.playersToday);
      $("mStarts").textContent=fmt(m.startsToday);
      $("mCompletes").textContent=fmt(m.completesToday);
      $("mShares").textContent=fmt(m.sharesToday);
      $("mRate").textContent=Number(m.completionRate||0).toFixed(1)+"%";
    }
    const box=$("sources"); box.innerHTML="";
    if(!sources.length){box.textContent="No tracked traffic yet."; return;}
    for(const s of sources){
      const row=document.createElement("div"); row.className="source-row";
      const a=document.createElement("span"); a.textContent=s.source;
      const b=document.createElement("strong"); b.textContent=fmt(s.visits);
      row.append(a,b); box.appendChild(row);
    }
  }catch(e){
    console.error(e); $("sources").textContent="Metrics temporarily unavailable.";
  }
}
load(); setInterval(load,60000);
