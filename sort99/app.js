import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "../ranking-config.js?v=2";

const supabase=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
const $=id=>document.getElementById(id);
const screens=["home","game","result"];
let tiles=[],selected=null,moves=0,startAt=0,timerId=null,isDaily=true,lastScore=0,lastTime=0;

const langRaw=(navigator.language||"en").toLowerCase();
const LANG=langRaw.startsWith("pl")?"pl":langRaw.startsWith("ja")?"ja":langRaw.startsWith("pt")?"pt":langRaw.startsWith("es")?"es":"en";
const S={
  en:{pill:"DAILY PUZZLE",eyebrow:"ONE PUZZLE WORLDWIDE",title:"Sort it.<br>Beat the world.",sub:"Tap two tiles to swap them. Put the numbers in order with as few moves and as little time as possible.",best:"BEST TODAY",streak:"STREAK",play:"PLAY TODAY",practice:"PRACTICE RANDOM",fine:"~10 SEC · ONE FINGER · GLOBAL RANKING",sort:"SORT ASCENDING",today:"TODAY",practiceMode:"PRACTICE",moves:"MOVES",match:"MATCH",hint:"Tap one tile, then another to swap.",result:"YOUR SCORE",time:"TIME",top:"TOP 10 TODAY",share:"SHARE — BEAT ME",again:"TRY AGAIN",home:"BACK HOME",you:"YOU",rank:(r,t)=>"#"+r+" of "+t+" today",head:["TRY AGAIN","NICE RUN","FAST HANDS","ELITE SORT"],shareText:s=>"I scored "+s+"/99 in SORT 99. Beat me:"},
  pl:{pill:"ZAGADKA DNIA",eyebrow:"JEDNA ZAGADKA DLA CAŁEGO ŚWIATA",title:"Uporządkuj.<br>Pokonaj świat.",sub:"Dotknij dwóch kafelków, aby zamienić je miejscami. Ułóż liczby od 1 do 9 jak najmniejszą liczbą ruchów i w jak najkrótszym czasie.",best:"NAJLEPSZY DZIŚ",streak:"SERIA",play:"GRAJ DZISIAJ",practice:"TRENING LOSOWY",fine:"~10 SEKUND · JEDEN PALEC · GLOBALNY RANKING",sort:"UŁÓŻ ROSNĄCO",today:"DZISIAJ",practiceMode:"TRENING",moves:"RUCHY",match:"ZGODNOŚĆ",hint:"Dotknij jednego kafelka, potem drugiego, aby je zamienić.",result:"TWÓJ WYNIK",time:"CZAS",top:"TOP 10 DZISIAJ",share:"UDOSTĘPNIJ — POBIJ MNIE",again:"SPRÓBUJ PONOWNIE",home:"WRÓĆ NA START",you:"TY",rank:(r,t)=>"#"+r+" z "+t+" dzisiaj",head:["SPRÓBUJ JESZCZE RAZ","DOBRY WYNIK","SZYBKIE RĘCE","ELITA SORT"],shareText:s=>"Mam "+s+"/99 w SORT 99. Pobijesz mnie?"},
  ja:{pill:"今日のパズル",eyebrow:"世界共通のデイリーパズル",title:"並べよう。<br>世界に挑戦。",sub:"2つのタイルをタップして入れ替え、1から9まで順番に並べよう。少ない手数と短い時間を狙え。",best:"今日のベスト",streak:"連続",play:"今日のチャレンジ",practice:"ランダム練習",fine:"約10秒 · 指1本 · 世界ランキング",sort:"昇順に並べる",today:"今日",practiceMode:"練習",moves:"手数",match:"一致",hint:"1つ目のタイル、次に2つ目をタップして交換。",result:"スコア",time:"タイム",top:"今日のTOP 10",share:"シェアして勝負",again:"もう一度",home:"ホームへ",you:"あなた",rank:(r,t)=>"今日 "+t+"人中 #"+r,head:["もう一度","ナイス","速い！","エリート"],shareText:s=>"SORT 99で"+s+"/99！勝てる？"},
  pt:{pill:"PUZZLE DO DIA",eyebrow:"UM PUZZLE PARA O MUNDO",title:"Organize.<br>Supere o mundo.",sub:"Toque em duas peças para trocá-las. Coloque os números de 1 a 9 em ordem com menos movimentos e menor tempo.",best:"MELHOR HOJE",streak:"SEQUÊNCIA",play:"JOGAR HOJE",practice:"TREINO ALEATÓRIO",fine:"~10 S · UM DEDO · RANKING GLOBAL",sort:"ORDEM CRESCENTE",today:"HOJE",practiceMode:"TREINO",moves:"MOVIMENTOS",match:"ACERTO",hint:"Toque em uma peça e depois em outra para trocar.",result:"SUA PONTUAÇÃO",time:"TEMPO",top:"TOP 10 HOJE",share:"COMPARTILHAR — ME SUPERE",again:"TENTAR DE NOVO",home:"INÍCIO",you:"VOCÊ",rank:(r,t)=>"#"+r+" de "+t+" hoje",head:["TENTE DE NOVO","BOA","RÁPIDO","ELITE SORT"],shareText:s=>"Fiz "+s+"/99 no SORT 99. Consegue me superar?"},
  es:{pill:"PUZLE DEL DÍA",eyebrow:"UN PUZLE PARA TODO EL MUNDO",title:"Ordénalo.<br>Supera al mundo.",sub:"Toca dos fichas para intercambiarlas. Ordena los números del 1 al 9 con el menor número de movimientos y en el menor tiempo.",best:"MEJOR HOY",streak:"RACHA",play:"JUGAR HOY",practice:"PRÁCTICA ALEATORIA",fine:"~10 S · UN DEDO · RANKING GLOBAL",sort:"ORDEN ASCENDENTE",today:"HOY",practiceMode:"PRÁCTICA",moves:"MOVIMIENTOS",match:"ACIERTO",hint:"Toca una ficha y luego otra para intercambiarlas.",result:"TU PUNTUACIÓN",time:"TIEMPO",top:"TOP 10 DE HOY",share:"COMPARTIR — SUPÉRAME",again:"OTRA VEZ",home:"INICIO",you:"TÚ",rank:(r,t)=>"#"+r+" de "+t+" hoy",head:["OTRA VEZ","BIEN","RÁPIDO","ÉLITE SORT"],shareText:s=>"Hice "+s+"/99 en SORT 99. ¿Me superas?"}
};
const T=S[LANG];
document.documentElement.lang=LANG;

function localize(){
  $("dailyPill").textContent=T.pill;
  $("homeEyebrow").textContent=T.eyebrow;
  $("homeTitle").innerHTML=T.title;
  $("homeSub").textContent=T.sub;
  $("bestLabel").textContent=T.best;
  $("streakLabel").textContent=T.streak;
  $("start").textContent=T.play;
  $("practice").textContent=T.practice;
  $("homeFine").textContent=T.fine;
  $("sortLabel").textContent=T.sort;
  $("movesLabel").textContent=T.moves;
  $("matchLabel").textContent=T.match;
  $("hint").textContent=T.hint;
  $("resultLabel").textContent=T.result;
  $("timeLabel").textContent=T.time;
  $("resultMovesLabel").textContent=T.moves;
  $("leaderTitle").textContent=T.top;
  $("share").textContent=T.share;
  $("again").textContent=T.again;
  $("homeBtn").textContent=T.home;
}

const today=()=>new Date().toISOString().slice(0,10);
const fmt=n=>LANG==="pl"?String(n).replace(".",","):String(n);
function show(id){screens.forEach(x=>$(x).classList.toggle("active",x===id))}
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function seededShuffle(seed){let a=[1,2,3,4,5,6,7,8,9],x=hash(seed);for(let i=a.length-1;i>0;i--){x=(Math.imul(x,1664525)+1013904223)>>>0;const j=x%(i+1);[a[i],a[j]]=[a[j],a[i]]}if(a.every((v,i)=>v===i+1))[a[0],a[1]]=[a[1],a[0]];return a}
function randomShuffle(){let a=[1,2,3,4,5,6,7,8,9];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}if(a.every((v,i)=>v===i+1))[a[0],a[1]]=[a[1],a[0]];return a}
function correctCount(){return tiles.filter((v,i)=>v===i+1).length}
function render(target="board"){const el=$(target);el.innerHTML="";tiles.forEach((v,i)=>{const b=document.createElement("button");b.type="button";b.className="tile"+(selected===i?" selected":"")+(v===i+1?" correct":"");b.textContent=v;b.setAttribute("aria-label",String(v));b.onclick=()=>tap(i);el.appendChild(b)});if(target==="board")$("match").textContent=Math.round(correctCount()/9*100)+"%"}
function tap(i){if(!startAt)return;if(selected===null){selected=i;render();return}if(selected===i){selected=null;render();return}[tiles[selected],tiles[i]]=[tiles[i],tiles[selected]];moves++;selected=null;$("moves").textContent=moves;render();if(correctCount()===9)finish()}
function start(mode){isDaily=mode==="daily";tiles=isDaily?seededShuffle("sort99:"+today()):randomShuffle();moves=0;selected=null;startAt=performance.now();$("moves").textContent="0";$("modeTitle").textContent=isDaily?T.today:T.practiceMode;$("timer").textContent="0.0";show("game");render();clearInterval(timerId);timerId=setInterval(()=>{$("timer").textContent=fmt(((performance.now()-startAt)/1000).toFixed(1))},100)}
function scoreFor(ms,m){const secs=ms/1000;const timePart=Math.max(0,60-secs*2.2);const movePart=Math.max(0,39-(m-8)*4.2);return Math.max(1,Math.min(99.9,timePart+movePart))}
async function ensureUser(){const s=await supabase.auth.getSession();if(s.data.session?.user)return s.data.session.user;const r=await supabase.auth.signInAnonymously();if(r.error)throw r.error;return r.data.user}
async function submit(score,elapsed,moves){await ensureUser();const r=await supabase.rpc("submit_sort99_score",{p_challenge_date:today(),p_score:score,p_moves:moves,p_elapsed_ms:elapsed});if(r.error)throw r.error;return Array.isArray(r.data)?r.data[0]:r.data}
async function leaderboard(){const r=await supabase.rpc("get_sort99_leaderboard",{p_challenge_date:today(),p_limit:10});if(r.error)throw r.error;return r.data||[]}
async function finish(){clearInterval(timerId);const elapsed=Math.round(performance.now()-startAt);startAt=0;lastTime=elapsed;lastScore=scoreFor(elapsed,moves);$("score").textContent=fmt(lastScore.toFixed(1));$("rTime").textContent=fmt((elapsed/1000).toFixed(1))+"s";$("rMoves").textContent=moves;const hi=lastScore>=90?3:lastScore>=75?2:lastScore>=55?1:0;$("headline").textContent=T.head[hi];if(isDaily){const key="sort99_best_"+today();const old=Number(localStorage.getItem(key)||0);if(lastScore>old)localStorage.setItem(key,lastScore.toFixed(1));updateStreak();}show("result");if(isDaily){try{const r=await submit(lastScore,elapsed,moves);$("rank").textContent=T.rank(r.rank,r.total);$("rank").classList.remove("hidden");const rows=await leaderboard();$("leaderRows").innerHTML="";rows.forEach(x=>{const d=document.createElement("div");d.className="row"+(x.is_you?" you":"");const left=document.createElement("span");left.textContent="#"+x.rank+(x.is_you?" · "+T.you:"");const right=document.createElement("strong");right.textContent=fmt(Number(x.score).toFixed(1));d.append(left,right);$("leaderRows").appendChild(d)});$("leader").classList.toggle("hidden",!rows.length)}catch(e){console.warn(e)}}}
function updateStreak(){const d=today(),last=localStorage.getItem("sort99_last"),st=Number(localStorage.getItem("sort99_streak")||0);const y=new Date();y.setUTCDate(y.getUTCDate()-1);const ys=y.toISOString().slice(0,10);const next=last===d?st:(last===ys?st+1:1);localStorage.setItem("sort99_last",d);localStorage.setItem("sort99_streak",next);$("streak").textContent=next}
function refreshHome(){tiles=seededShuffle("sort99:"+today());render("preview");const b=Number(localStorage.getItem("sort99_best_"+today())||0);$("best").textContent=b?fmt(b.toFixed(1)):"—";$("streak").textContent=localStorage.getItem("sort99_streak")||"0"}
async function share(){const score=fmt(lastScore.toFixed(1));const text=T.shareText(score);const url=location.origin+location.pathname;if(navigator.share)await navigator.share({title:"SORT 99",text,url});else{await navigator.clipboard.writeText(text+" "+url);$("share").textContent="✓"}}
$("start").onclick=()=>start("daily");
$("practice").onclick=()=>start("practice");
$("back").onclick=()=>{clearInterval(timerId);startAt=0;show("home")};
$("again").onclick=()=>start(isDaily?"daily":"practice");
$("homeBtn").onclick=()=>{refreshHome();show("home")};
$("share").onclick=share;
localize();
refreshHome();
