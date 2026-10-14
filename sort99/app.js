import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "../ranking-config.js?v=2";

const supabase=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
const $=id=>document.getElementById(id);
const isPL=(navigator.language||"").toLowerCase().startsWith("pl");
if(!isPL){
  const tx={
    pill:"DAILY PUZZLE",eyebrow:"CLASSIC 15 PUZZLE",title:"One empty space.<br>Put 1–15 in order.",
    sub:"Tap a tile next to the empty space. The tile slides into the gap.",how1:"GOAL",
    how2:"1 2 3 4 / 5 6 7 8 / 9 10 11 12 / 13 14 15 / empty",
    bestLabel:"BEST TODAY",streakLabel:"STREAK",start:"PLAY TODAY",practice:"PRACTICE RANDOM",
    fine:"ONLY A TILE NEXT TO THE EMPTY SPACE CAN MOVE",gameLabel:"SLIDE INTO THE EMPTY SPACE",
    movesLabel:"MOVES",placeLabel:"IN PLACE",goal:"Tiles with a green outline can move now.",
    resultLabel:"YOUR SCORE",timeLabel:"TIME",rMovesLabel:"MOVES",leaderTitle:"TOP 10 TODAY",
    share:"SHARE — BEAT ME",again:"TRY AGAIN",homeBtn:"BACK HOME"
  };
  for(const [id,val] of Object.entries(tx)){if($(id)) $(id).innerHTML=val;}
}
const screens=["home","game","result"];
let tiles=[],moves=0,startAt=0,timerId=null,isDaily=true,lastScore=0;

const today=()=>new Date().toISOString().slice(0,10);
const fmt=n=>isPL?String(n).replace(".",","):String(n);
function show(id){screens.forEach(s=>$(s).classList.toggle("active",s===id))}
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function neighbors(i){const r=Math.floor(i/4),c=i%4,n=[];if(r>0)n.push(i-4);if(r<3)n.push(i+4);if(c>0)n.push(i-1);if(c<3)n.push(i+1);return n}
function makePuzzle(seed,steps=24){
  let a=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,0],blank=15,prev=-1,x=hash(seed);
  for(let k=0;k<steps;k++){
    let opts=neighbors(blank).filter(v=>v!==prev);
    x=(Math.imul(x,1664525)+1013904223)>>>0;
    const next=opts[x%opts.length];
    a[blank]=a[next];a[next]=0;prev=blank;blank=next;
  }
  return a;
}
function randomPuzzle(){return makePuzzle("rnd:"+Date.now()+":"+Math.random(),28)}
function correctCount(){return tiles.filter((v,i)=>v!==0&&v===i+1).length}
function solved(){return correctCount()===15&&tiles[15]===0}
function canMove(i){return neighbors(tiles.indexOf(0)).includes(i)}
function render(target="board"){
  const el=$(target);el.innerHTML="";
  tiles.forEach((v,i)=>{
    const b=document.createElement("button");b.type="button";
    if(v===0){b.className="tile empty";b.disabled=true;}
    else{
      b.className="tile"+(v===i+1?" correct":"")+(canMove(i)?" movable":"");
      b.textContent=v;
      if(target==="board"){b.disabled=!canMove(i);b.onclick=()=>move(i);}else b.disabled=true;
    }
    el.appendChild(b);
  });
  if(target==="board")$("match").textContent=correctCount()+"/15";
}
function move(i){
  if(!startAt||!canMove(i))return;
  const blank=tiles.indexOf(0);
  tiles[blank]=tiles[i];tiles[i]=0;moves++;
  $("moves").textContent=moves;render();
  if(solved())finish();
}
function start(mode){
  isDaily=mode==="daily";tiles=isDaily?makePuzzle("slide99:"+today(),24):randomPuzzle();
  moves=0;startAt=performance.now();$("moves").textContent="0";$("modeTitle").textContent=isDaily?(isPL?"DZISIAJ":"TODAY"):(isPL?"TRENING":"PRACTICE");
  $("timer").textContent=isPL?"0,0":"0.0";show("game");render();clearInterval(timerId);
  timerId=setInterval(()=>{$("timer").textContent=fmt(((performance.now()-startAt)/1000).toFixed(1))},100);
}
function scoreFor(ms,m){const sec=ms/1000;return Math.max(1,Math.min(99.9,99.9-sec*.65-Math.max(0,m-20)*1.15))}
async function ensureUser(){const s=await supabase.auth.getSession();if(s.data.session?.user)return s.data.session.user;const r=await supabase.auth.signInAnonymously();if(r.error)throw r.error;return r.data.user}
async function submit(score,elapsed,m){await ensureUser();const r=await supabase.rpc("submit_sort99_score",{p_challenge_date:today(),p_score:score,p_moves:m,p_elapsed_ms:elapsed});if(r.error)throw r.error;return Array.isArray(r.data)?r.data[0]:r.data}
async function leaderboard(){const r=await supabase.rpc("get_sort99_leaderboard",{p_challenge_date:today(),p_limit:10});if(r.error)throw r.error;return r.data||[]}
async function finish(){
  clearInterval(timerId);const elapsed=Math.round(performance.now()-startAt);startAt=0;lastScore=scoreFor(elapsed,moves);
  $("score").textContent=fmt(lastScore.toFixed(1));$("rTime").textContent=fmt((elapsed/1000).toFixed(1))+"s";$("rMoves").textContent=moves;
  $("headline").textContent=lastScore>=90?(isPL?"MISTRZ PRZESUWANKI":"SLIDE MASTER"):lastScore>=70?(isPL?"BARDZO DOBRZE":"VERY GOOD"):(isPL?"GOTOWE":"DONE");
  if(isDaily){const key="slide99_best_"+today();const old=Number(localStorage.getItem(key)||0);if(lastScore>old)localStorage.setItem(key,lastScore.toFixed(1));updateStreak();}
  show("result");
  if(isDaily){try{
    const r=await submit(lastScore,elapsed,moves);
    $("rank").textContent=isPL?"#"+r.rank+" z "+r.total+" dzisiaj":"#"+r.rank+" of "+r.total+" today";$("rank").classList.remove("hidden");
    const rows=await leaderboard();$("leaderRows").innerHTML="";
    for(const x of rows){const d=document.createElement("div");d.className="row"+(x.is_you?" you":"");const l=document.createElement("span");l.textContent="#"+x.rank+(x.is_you?(isPL?" · TY":" · YOU"):"");const rr=document.createElement("strong");rr.textContent=fmt(Number(x.score).toFixed(1));d.append(l,rr);$("leaderRows").appendChild(d);}
    $("leader").classList.toggle("hidden",!rows.length);
  }catch(e){console.warn(e)}}
}
function updateStreak(){
  const d=today(),last=localStorage.getItem("slide99_last"),st=Number(localStorage.getItem("slide99_streak")||0);
  const y=new Date();y.setUTCDate(y.getUTCDate()-1);const ys=y.toISOString().slice(0,10);
  const next=last===d?st:(last===ys?st+1:1);localStorage.setItem("slide99_last",d);localStorage.setItem("slide99_streak",next);$("streak").textContent=next;
}
function refreshHome(){tiles=makePuzzle("slide99:"+today(),24);render("preview");const b=Number(localStorage.getItem("slide99_best_"+today())||0);$("best").textContent=b?fmt(b.toFixed(1)):"—";$("streak").textContent=localStorage.getItem("slide99_streak")||"0"}
async function share(){const sc=fmt(lastScore.toFixed(1));const text=isPL?"Mam "+sc+"/99 w SLIDE 99. Pobijesz mnie?":"I scored "+sc+"/99 in SLIDE 99. Beat me:";const url=location.origin+location.pathname;if(navigator.share)await navigator.share({title:"SLIDE 99",text,url});else{await navigator.clipboard.writeText(text+" "+url);$("share").textContent="✓"}}
$("start").onclick=()=>start("daily");$("practice").onclick=()=>start("practice");$("back").onclick=()=>{clearInterval(timerId);startAt=0;show("home")};$("again").onclick=()=>start(isDaily?"daily":"practice");$("homeBtn").onclick=()=>{refreshHome();show("home")};$("share").onclick=share;refreshHome();
