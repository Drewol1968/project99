(() => {
"use strict";
const $ = id => document.getElementById(id);
const canvas = $("game"), ctx = canvas.getContext("2d");
const TILE = 64, FLOOR = 9*TILE, WORLD_H = 12*TILE, STEP=1/120;
const DATA = [
 {pl:"Święty Las",en:"Sacred Forest",theme:"forest",width:54,
  floors:[[0,9],[11,19],[21,31],[33,42],[44,54]],
  ledges:[[5,7,3],[12,7,3],[23,7,3],[28,6,2],[35,7,3],[46,7,3]],
  relics:[[6.5,6.35],[13.2,6.35],[24.4,6.35],[36.6,6.35],[47.2,6.35]],
  spikes:[[16,9,1],[37,9,1],[49,9,1]], enemies:[["wolf",15,12,18,9],["crow",26,22,30,5],["wolf",39,34,41,9]], checkpoints:[22,45]},
 {pl:"Bagna Rusałek",en:"Rusalka Marsh",theme:"swamp",width:60,
  floors:[[0,10],[12,20],[22,30],[32,40],[42,51],[53,60]],
  ledges:[[6,7,3],[14,7,3],[23,7,3],[28,6,2],[35,7,3],[44,7,3],[54,7,2]],
  moving:[[30,7,2,"x",28,32,65]],
  relics:[[7,6.35],[15,6.35],[24,6.35],[29,5.35],[45,6.35],[55,6.35]],
  spikes:[[8,9,1],[26,9,1],[48,9,1]], enemies:[["ghost",17,13,19,9],["crow",36,33,40,5],["ghost",47,43,50,9]], checkpoints:[23,43]},
 {pl:"Podwodna Kraina",en:"Sunken Kingdom",theme:"water",width:64,
  floors:[[0,11],[13,22],[24,33],[35,45],[47,55],[57,64]],
  ledges:[[7,7,3],[15,7,3],[20,6,2],[26,7,3],[31,6,2],[38,7,3],[49,7,3],[58,7,3]],
  moving:[[43,6,2,"y",5,8,55]],
  relics:[[8,6.35],[16,6.35],[21,5.3],[32,5.35],[40,6.35],[59,6.35]],
  spikes:[[18,9,1],[40,9,2],[52,9,1]], enemies:[["fish",19,15,22,6],["fish",42,37,45,5],["ghost",51,48,54,9]], checkpoints:[25,48]},
 {pl:"Stary Gród",en:"Ancient Stronghold",theme:"fortress",width:72,
  floors:[[0,9],[11,20],[22,31],[33,43],[45,54],[56,64],[66,72]],
  ledges:[[5,7,3],[12,7,3],[18,6,2],[24,7,3],[29,6,3],[35,7,3],[40,6,2],[47,7,3],[52,6,2],[59,7,3],[67,7,3]],
  moving:[[21,7,2,"y",6,8,55],[63,6,2,"x",62,66,70]],
  crumble:[[31,6,2],[54,7,2]],
  beams:[[17,3,16],[49,3,48]],
  relics:[[6,6.35],[13,6.35],[19,5.35],[25,6.35],[36,6.35],[48,6.35],[68,6.35]],
  spikes:[[7,9,1],[27,9,1],[39,9,2],[60,9,1]],
  enemies:[["guard",15,12,19,9],["crow",27,24,32,4],["ghost",38,34,42,9],["guard",50,46,53,9],["crow",62,58,67,5]],
  checkpoints:[23,46,66]},
 {pl:"Śnieżne Góry",en:"Snowy Peaks",theme:"snow",width:77,
  floors:[[0,11],[13,23],[25,34],[36,46],[48,57],[59,69],[71,77]],
  ledges:[[6,7,3],[16,7,3],[21,6,2],[28,7,3],[33,6,2],[39,7,3],[44,6,2],[51,7,3],[62,7,3],[73,7,2]],
  moving:[[58,7,2,"y",6,8,65]],
  crumble:[[34,6,2],[65,7,2]],
  relics:[[7,6.35],[17,6.35],[22,5.35],[29,6.35],[40,6.35],[52,6.35],[63,6.35],[73.5,6.35]],
  spikes:[[9,9,1],[20,9,1],[30,9,1],[42,9,1],[54,9,1],[66,9,1]],
  enemies:[["wolf",18,14,22,9],["crow",31,26,35,5],["ghost",43,37,45,9],["wolf",63,60,68,9]], checkpoints:[26,49,72]},
 {pl:"Jaskinia Żmija",en:"Serpent's Cavern",theme:"cave",width:82,
  floors:[[0,11],[13,24],[26,36],[38,49],[51,62],[64,82]],
  ledges:[[6,7,3],[15,7,3],[21,6,2],[29,7,3],[34,6,2],[41,7,3],[46,6,2],[54,7,3],[60,6,2],[67,7,3]],
  moving:[[25,7,2,"x",23,28,75],[50,6,2,"y",5,8,65]],
  crumble:[[34,6,2],[61,6,2]],
  beams:[[17,3,16],[44,3,43]],
  relics:[[7,6.35],[16,6.35],[22,5.35],[30,6.35],[35,5.35],[42,6.35],[55,6.35],[61,5.35],[68,6.35]],
  spikes:[[9,9,1],[19,9,1],[32,9,1],[45,9,1],[56,9,2]],
  flames:[[27,9],[48,9],[65,9]],enemies:[["ghost",18,14,23,9],["crow",31,27,36,4],["guard",42,39,48,9],["ghost",58,52,61,9]],
  checkpoints:[27,52,67],boss:74}
];
const TEXT = {
 pl:{
  eyebrow:"PRZYGODA • 6 KRAIN", name:"LEGENDA",startKicker:"SŁOWIAŃSKA PRZYGODA",startTitle:"SZLAK ŻMIJA",
  startText:"Przejdź sześć krain. Zbierz wszystkie relikty, aby otworzyć bramę. Skacz nad pułapkami i wskakuj przeciwnikom na głowy.",
  start:"ROZPOCZNIJ PRZYGODĘ",resume:"KONTYNUUJ PRZYGODĘ",choose:"WYBIERZ POZIOM",tips:"RUSZAJ SIĘ • SKACZ • ZBIERAJ RELIKTY",
  jump:"SKOK",help:"Telefon: przyciski. Komputer: ← → i spacja.",home:"← PROJECT 99",
  introSymbol:"ᛟ",pauseKicker:"ZATRZYMANO",pauseTitle:"PAUZA",pauseText:"Twój postęp pozostaje zapisany.",continue:"WRÓĆ DO GRY",restart:"OD NOWA TEN POZIOM",
  gate:"Brama otwarta! Dotrzyj do niej →",need:"Zbierz jeszcze relikty, aby otworzyć bramę",checkpoint:"Punkt kontrolny ✓",ouch:"Uważaj! Wracasz do punktu kontrolnego",earlyBoss:"Najpierw pokonaj Żmija!",bossHit:"Żmij trafiony!",bossEnd:"Żmij pokonany! Droga wolna.",
  clearKicker:"POZIOM UKOŃCZONY",clearTitle:"BRAWO!",next:"NASTĘPNA KRAINA",clearedText:(n,time,deaths)=>"Kraina "+n+" ukończona w "+time+". Upadki: "+deaths+".",
  victoryKicker:"WIELKI FINAŁ",victoryTitle:"POKONAŁEŚ ŻMIJA!",victoryText:"Udało Ci się przejść wszystkie sześć krain i odzyskać relikty. Jesteś bohaterem Legendy 99!",playAgain:"ZAGRAJ OD POCZĄTKU",share:"UDOSTĘPNIJ WYNIK",
  shareText:(time,deaths,url)=>"🏆 Ukończyłem LEGENDA 99: Szlak Żmija! Ostatnia kraina: "+time+", upadki: "+deaths+". Spróbujesz? "+url,
  copied:"Link skopiowany ✓",locked:"Wrota zamknięte",boss:"ŻMIJ",double:"W PODWODNEJ KRAINIE MASZ PODWÓJNY SKOK!",falldown:"Uważaj na przepaść!",record:"Nowy rekord poziomu!",sound:"Dźwięk",level:"POZIOM",press:"DOTKNIJ, ABY GRAĆ"
 },
 en:{
  eyebrow:"ADVENTURE • 6 WORLDS",name:"LEGEND",startKicker:"SLAVIC ADVENTURE",startTitle:"PATH OF THE SERPENT",
  startText:"Explore six worlds. Collect every relic to unlock the gate. Leap over traps and jump on enemies to defeat them.",
  start:"START ADVENTURE",resume:"CONTINUE ADVENTURE",choose:"SELECT A LEVEL",tips:"MOVE • JUMP • COLLECT RELICS",jump:"JUMP",
  help:"Phone: on-screen buttons. Desktop: ← → + space.",home:"← PROJECT 99",
  introSymbol:"ᛟ",pauseKicker:"GAME PAUSED",pauseTitle:"PAUSE",pauseText:"Your progress is saved.",continue:"RESUME GAME",restart:"RESTART THIS LEVEL",
  gate:"Gate unlocked! Reach it →",need:"Collect all relics to unlock the gate",checkpoint:"Checkpoint reached ✓",ouch:"Watch out! Back to checkpoint",earlyBoss:"Defeat the serpent first!",bossHit:"Serpent hit!",bossEnd:"Serpent defeated! The path is clear.",
  clearKicker:"LEVEL COMPLETE",clearTitle:"WELL DONE!",next:"NEXT WORLD",clearedText:(n,time,deaths)=>"World "+n+" finished in "+time+". Falls: "+deaths+".",
  victoryKicker:"THE GRAND FINALE",victoryTitle:"SERPENT DEFEATED!",victoryText:"You conquered all six worlds and restored the ancient relics. You are a Legend 99 hero!",playAgain:"PLAY FROM THE START",share:"SHARE YOUR RESULT",
  shareText:(time,deaths,url)=>"🏆 I beat LEGEND 99! Final world: "+time+", falls: "+deaths+". Can you finish it? "+url,
  copied:"Link copied ✓",locked:"Gate locked",boss:"SERPENT",double:"DOUBLE JUMP UNLOCKED UNDERWATER!",falldown:"Mind the gap!",record:"New level record!",sound:"Sound",level:"LEVEL",press:"TAP TO PLAY"
 }
};
const palettes={
 forest:{sky:["#2c6983","#bedfb7"],back:"#407878",far:"#26585b",hill:"#1c494d",ground:"#56463a",top:"#6cc283",stone:"#355860",light:"#d2efaf",sun:"#ffe3a3"},
 swamp:{sky:["#536a88","#d0d0a4"],back:"#6a8b85",far:"#45665d",hill:"#354f50",ground:"#59483f",top:"#6b9b66",stone:"#415b5b",light:"#e9f7ae",sun:"#ffe9b9"},
 water:{sky:["#073c74","#08a3af"],back:"#0d829e",far:"#086980",hill:"#084f72",ground:"#2a627b",top:"#81dbd7",stone:"#2c6c94",light:"#b9fff4",sun:"#6ad0d8"},
 fortress:{sky:["#1f254c","#724a73"],back:"#515078",far:"#393553",hill:"#242843",ground:"#444055",top:"#ac8292",stone:"#665968",light:"#ffe0ac",sun:"#ffc77c"},
 snow:{sky:["#547aa2","#b6d7e8"],back:"#98c1d6",far:"#638ba7",hill:"#406983",ground:"#51677c",top:"#eef9ff",stone:"#7ea0b4",light:"#d9ffff",sun:"#effbff"},
 cave:{sky:["#27182f","#723340"],back:"#602d3c",far:"#4c2231",hill:"#301827",ground:"#4d3240",top:"#b9715a",stone:"#6d4950",light:"#ffc68b",sun:"#ffb471"}
};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const number=(a)=>Number.isFinite(a)?a:0;
const rectHit=(a,b)=>a.x < b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y;
const px=t=>t*TILE;
const date=new Date().toISOString().slice(0,10);
let language=(localStorage.getItem("legend99_lang") || ((navigator.language||"en").toLowerCase().startsWith("pl")?"pl":"en"));
if(!TEXT[language]) language="en";
const txt=()=>TEXT[language];
let unlocked=clamp(parseInt(localStorage.getItem("legend99_unlocked")||"0",10)||0,0,5);
let levelIndex=unlocked, state="intro", modalKind="intro", t0=0, accumulator=0, elapsed=0, deaths=0, world=null;
let p=null, cam={x:0,y:0}, view={w:800,h:540,scale:1,dpr:1}, now=0, toastLeft=0, toastLast="";
let sfxOn=localStorage.getItem("legend99_sound")!=="off",audio=null;
const keys={left:false,right:false};
const rand=(n)=>{let x=Math.sin(n*17.272+2.17)*43758.5453123;return x-Math.floor(x)};
function beep(freq=440,duration=.09,type="sine",volume=.055){
 if(!sfxOn)return;
 try{
  const C=window.AudioContext||window.webkitAudioContext;
  if(!C)return;
  if(!audio)audio=new C();
  if(audio.state==="suspended")audio.resume();
  const o=audio.createOscillator(),g=audio.createGain(),start=audio.currentTime;
  o.type=type;o.frequency.setValueAtTime(freq,start);
  g.gain.setValueAtTime(volume,start);g.gain.exponentialRampToValueAtTime(.0001,start+duration);
  o.connect(g);g.connect(audio.destination);o.start(start);o.stop(start+duration+.01);
 }catch{}
}
function fmtTime(t){const s=Math.max(0,Math.floor(t));return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0")}
function notify(text,duration=2.5){$("toast").textContent=text;$("toast").hidden=false;toastLeft=duration;toastLast=text}
function removeToast(){toastLeft=0;$("toast").hidden=true}
function localGet(key){try{return localStorage.getItem(key)}catch{return null}}
function localSet(key,value){try{localStorage.setItem(key,String(value))}catch{}}
function makeWorld(index){
 const d=DATA[index];
 const floors=d.floors.map(([a,b])=>({x:px(a),y:FLOOR,w:px(b-a),h:WORLD_H-FLOOR,kind:"ground"}));
 const ledges=d.ledges.map(([x,y,w])=>({x:px(x),y:px(y),w:px(w),h:18,kind:"ledge"}));
 const moving=(d.moving||[]).map(([x,y,w,axis,lo,hi,speed],id)=>({id,x:px(x),y:px(y),w:px(w),h:18,originX:px(x),originY:px(y),axis,lo:px(lo),hi:px(hi),speed,dir:1,dx:0,dy:0,kind:"moving"}));
 const crumble=(d.crumble||[]).map(([x,y,w],id)=>({id,x:px(x),y:px(y),w:px(w),h:18,kind:"crumble",active:true,touched:false,timer:0,respawn:0}));
 const spikes=d.spikes.map(([x,y,w])=>({x:px(x)+5,y:px(y)-22,w:px(w)-10,h:22,kind:"spike"}));
 const flames=(d.flames||[]).map(([x,y],id)=>({x:px(x)+15,y:px(y)-46,w:34,h:46,kind:"flame",phase:id*1.5}));
 const beams=(d.beams||[]).map(([x,y,trigger])=>({x:px(x),y:px(y),w:75,h:24,trigger:px(trigger),started:false,falling:false,delay:.7,vy:0,reset:0,originY:px(y)}));
 const relics=d.relics.map(([x,y],id)=>({x:px(x),y:px(y),id,got:false}));
 const types={wolf:{w:50,h:34},ghost:{w:42,h:48},crow:{w:43,h:34},fish:{w:48,h:30},guard:{w:42,h:55}};
 const enemies=d.enemies.map(([type,x,lo,hi,top],id)=>({id,type,x:px(x),y:px(top)-(type==="crow"||type==="fish"?0:types[type].h),w:types[type].w,h:types[type].h,lo:px(lo),hi:px(hi),dir:id%2?-1:1,speed: type==="crow"?120:type==="fish"?135:type==="guard"?85:95,alive:true,cy:0,baseY:px(top)-(type==="crow"||type==="fish"?0:types[type].h)}));
 const checkpoints=d.checkpoints.map((x,id)=>({x:px(x),active:false,id}));
 return {d,index,colors:palettes[d.theme],floors,ledges,moving,crumble,spikes,flames,beams,relics,enemies,checkpoints,projectiles:[],boss:d.boss!=null?{x:px(d.boss),y:FLOOR-100,w:130,h:100,hp:3,inv:0,clock:1.9,alive:true}:null,gate:{x:px(d.width-2),y:FLOOR-107,w:62,h:107},collected:0,width:px(d.width),checkX:px(2)};
}
function spawn(resetDeath=false){
 p={x:world.checkX,y:FLOOR-50,vx:0,vy:0,w:32,h:50,ground:false,coyote:0,airJumps:levelIndex===2?1:0,inv:1.3,face:1,walk:0,standing:null};
 if(resetDeath)deaths=0;
 cam.x=clamp(p.x-view.w*.28,0,Math.max(0,world.width-view.w));
 cam.y=clamp(FLOOR-view.h*.79,0,Math.max(0,WORLD_H-view.h));
}
function resetInputs(){keys.left=false;keys.right=false;document.querySelectorAll(".control").forEach(b=>b.classList.remove("pressed"))}
function startLevel(i){
 levelIndex=clamp(i,0,5);world=makeWorld(levelIndex);elapsed=0;deaths=0;spawn(true);resetInputs();state="playing";$("modal").hidden=true;removeToast();
 const d=world.d;
 $("chapter").textContent=language==="pl"?d.pl:d.en;
 $("relics").textContent="0/"+world.relics.length;$("deaths").textContent="0";$("clock").textContent="00:00";
 $("pause").disabled=false;updateProgress();beep(520,.12,"triangle");
 if(levelIndex===2)notify(txt().double,3.5);
}
function updateProgress(){
 $("miniProgress").replaceChildren(...DATA.map((d,i)=>{
  const x=document.createElement("span");
  x.className=i===levelIndex?"active":i<unlocked?"done":"";
  x.title=(language==="pl"?d.pl:d.en);return x;
 }));
}
function setLang(){
 const t=txt();document.documentElement.lang=language;
 $("eyebrow").textContent=t.eyebrow;$("gameName").innerHTML=t.name+' <em>99</em>';
 $("controlsTip").textContent=t.tips;$("jumpText").textContent=t.jump;$("help").textContent=t.help;$("homeLink").textContent=t.home;
 $("language").textContent=language==="pl"?"EN":"PL";
 $("sound").textContent=sfxOn?"♪":"♪̸";
 if(world)$("chapter").textContent=language==="pl"?world.d.pl:world.d.en;
 else $("chapter").textContent=language==="pl"?DATA[levelIndex].pl:DATA[levelIndex].en;
 updateProgress();
 if(!$("modal").hidden)renderModal(modalKind);
}
function makePicker(){
 const el=$("levelPicker");el.replaceChildren(...DATA.map((d,i)=>{
  const b=document.createElement("button");
  b.type="button";b.className=i===levelIndex?"selected":"";
  b.textContent=(i+1)+". "+(language==="pl"?d.pl:d.en);
  b.addEventListener("click",()=>startLevel(i));return b;
 }));
}
function renderModal(kind){
 modalKind=kind;const t=txt();
 const intro=kind==="intro",pause=kind==="pause",cleared=kind==="clear",won=kind==="win";
 $("modal").hidden=false;
 $("modalKicker").textContent=intro?t.startKicker:pause?t.pauseKicker:cleared?t.clearKicker:t.victoryKicker;
 $("modalSymbol").textContent=intro?t.introSymbol:pause?"Ⅱ":cleared?"✦":"♛";
 $("modalTitle").textContent=intro?t.startTitle:pause?t.pauseTitle:cleared?t.clearTitle:t.victoryTitle;
 $("modalText").textContent=intro?t.startText:pause?t.pauseText:cleared?t.clearedText(levelIndex+1,fmtTime(elapsed),deaths):t.victoryText;
 $("mainAction").textContent=intro?(unlocked>0?t.resume:t.start):pause?t.continue:cleared?t.next:t.playAgain;
 $("secondaryAction").textContent=intro?t.choose:pause?t.restart:cleared?t.restart:t.share;
 $("levelPicker").hidden=true;makePicker();
 $("pause").disabled=intro||cleared||won;
}
function showIntro(){state="intro";renderModal("intro")}
function pauseGame(){
 if(state==="playing"){state="paused";resetInputs();renderModal("pause")}
 else if(state==="paused"){state="playing";$("modal").hidden=true;$("pause").disabled=false}
}
function damage(message){
 if(!p||p.inv>0||state!=="playing")return;
 deaths++;$("deaths").textContent=deaths;
 p.inv=1.6;beep(130,.24,"sawtooth",.08);
 notify(message||txt().ouch,2.0);
 // Always respawn on a safe segment, preserving relics and checkpoints.
 const c=world.checkX;
 p.x=c;p.y=FLOOR-p.h;p.vx=0;p.vy=0;p.ground=false;p.coyote=0;p.standing=null;p.airJumps=levelIndex===2?1:0;
}
function jump(){
 if(state!=="playing"||!p)return;
 if(p.ground||p.coyote>0||p.airJumps>0){
  if(!p.ground && p.coyote<=0) p.airJumps--;
  p.vy=levelIndex===2?-690:-735;
  p.ground=false;p.coyote=0;p.standing=null;
  beep(410,.10,"sine",.035);
 }
}
function smoothToward(value,target,amount){return Math.abs(target-value)<=amount?target:value+Math.sign(target-value)*amount}
function solidRects(){return [...world.floors,...world.ledges,...world.moving,...world.crumble.filter(c=>c.active)]}
function finishLevel(){
 state="clear";resetInputs();beep(650,.15,"triangle");setTimeout(()=>beep(880,.25,"triangle"),160);
 const bestKey="legend99_time_"+levelIndex;
 const prev=Number(localGet(bestKey)||0);
 if(prev===0||elapsed<prev){localSet(bestKey,elapsed.toFixed(2));notify(txt().record,4)}
 if(levelIndex<5) {
  unlocked=Math.max(unlocked,levelIndex+1);localSet("legend99_unlocked",unlocked);
  renderModal("clear");
 } else {
  unlocked=5;localSet("legend99_unlocked",5);
  state="won";renderModal("win");
 }
 updateProgress();
}
function update(dt){
 if(state!=="playing")return;
 elapsed+=dt;now+=dt;
 if(toastLeft>0){toastLeft-=dt;if(toastLeft<=0)$("toast").hidden=true}
 if(p.inv>0)p.inv-=dt;
 const d=world.d;
 for(const m of world.moving){
  const k=m.axis==="x"?"x":"y",before=m[k];
  m[k]+=m.dir*m.speed*dt;
  if(m[k]<m.lo){m[k]=m.lo;m.dir=1}
  if(m[k]>m.hi){m[k]=m.hi;m.dir=-1}
  m.dx=m.x-(k==="x"?before:m.x);m.dy=m.y-(k==="y"?before:m.y);
 }
 for(const c of world.crumble){
  if(c.touched&&c.active){c.timer-=dt;if(c.timer<=0){c.active=false;c.respawn=3.2;}}
  if(!c.active){c.respawn-=dt;if(c.respawn<=0){c.touched=false;c.active=true;c.timer=0}}
 }
 for(const b of world.beams){
  if(b.reset>0){b.reset-=dt;if(b.reset<=0){b.y=b.originY;b.started=false;b.falling=false;b.delay=.7;b.vy=0}}
  else if(!b.started && Math.abs((p.x+p.w/2)-b.trigger)<px(2.4)){b.started=true;beep(190,.18,"square",.035)}
  if(b.started && !b.falling){b.delay-=dt;if(b.delay<=0){b.falling=true;b.vy=0}}
  if(b.falling){b.vy=Math.min(850,b.vy+2200*dt);b.y+=b.vy*dt;if(b.y>WORLD_H){b.reset=3.4;b.falling=false}}
  if(b.falling&&rectHit(p,b))damage();
 }
 if(p.standing?.kind==="moving"){p.x+=p.standing.dx;p.y+=p.standing.dy}
 const accel=2050, maxSpeed=275;
 let target=keys.left?-maxSpeed:keys.right?maxSpeed:0;
 if(keys.left&&keys.right)target=0;
 p.vx=smoothToward(p.vx,target,(target===0?2050:accel)*dt);
 if(target)p.face=Math.sign(target);
 p.walk+=Math.abs(p.vx)*dt/43;
 const wasGround=p.ground;
 if(wasGround)p.coyote=.105;else p.coyote=Math.max(0,p.coyote-dt);
 let solids=solidRects();
 const oldX=p.x, oldY=p.y;
 p.x+=p.vx*dt;
 for(const s of solids){
  if(rectHit(p,s)){
   if(p.vx>0 && oldX+p.w<=s.x+5){p.x=s.x-p.w;p.vx=0}
   else if(p.vx<0 && oldX>=s.x+s.w-5){p.x=s.x+s.w;p.vx=0}
  }
 }
 p.x=clamp(p.x,0,world.width-p.w);
 // Every level has generous platformer jumps; the water world adds one extra midair jump.
 p.vy=Math.min(1060,p.vy+(levelIndex===2?1420:1660)*dt);
 p.y+=p.vy*dt;
 p.ground=false;p.standing=null;
 for(const s of solids){
  if(!rectHit(p,s))continue;
  if(p.vy>=0 && oldY+p.h<=s.y+Math.max(8,Math.abs(s.dy||0)+4)){
   p.y=s.y-p.h;p.vy=0;p.ground=true;p.standing=s;
   p.coyote=.105;p.airJumps=levelIndex===2?1:0;
   if(s.kind==="crumble"&&!s.touched){s.touched=true;s.timer=.72}
  }else if(p.vy<0 && oldY>=s.y+s.h-6){
   p.y=s.y+s.h;p.vy=0;
  }
 }
 // Invisible checkpoints only activate on safe ground.
 for(const cp of world.checkpoints){
  if(!cp.active && p.x>=cp.x){cp.active=true;world.checkX=cp.x;notify(txt().checkpoint,1.5);beep(740,.1,"sine")}
 }
 if(p.y>WORLD_H+120){damage(txt().falldown); if(p.inv>0 && p.y>WORLD_H+120){p.y=FLOOR-p.h;p.x=world.checkX;}}
 for(const s of world.spikes){if(rectHit(p,s)){damage();break}}
 for(const f of world.flames){
  const active=Math.sin(elapsed*2.5+f.phase)>0.15;
  if(active && rectHit(p,f)){damage();break}
 }
 // Enemy patrol and stomp detection.
 for(const e of world.enemies){
  if(!e.alive)continue;
  e.x+=e.dir*e.speed*dt;
  if(e.x<=e.lo){e.x=e.lo;e.dir=1}else if(e.x>=e.hi){e.x=e.hi;e.dir=-1}
  if(e.type==="crow"||e.type==="fish")e.y=e.baseY+Math.sin(now*2.6+e.id)*15;
  if(rectHit(p,e)){
   if(p.vy>95 && oldY+p.h<=e.y+Math.min(23,e.h*.5)){
    e.alive=false;p.y=e.y-p.h;p.vy=-525;beep(610,.08,"triangle");beep(830,.12,"sine");
   }else damage();
  }
 }
 const boss=world.boss;
 if(boss&&boss.alive){
  boss.inv=Math.max(0,boss.inv-dt);boss.clock-=dt;
  boss.y=FLOOR-boss.h+Math.sin(now*1.9)*5;
  if(boss.clock<=0){
   boss.clock=2.6;
   world.projectiles.push({x:boss.x+5,y:boss.y+68,w:21,h:22,vx:-255});
   beep(130,.15,"sawtooth",.05);
  }
  if(rectHit(p,boss)){
   if(boss.inv<=0&&p.vy>90&&oldY+p.h<=boss.y+35){
    boss.hp--;boss.inv=1.7;p.y=boss.y-p.h;p.vy=-680;beep(370,.22,"sawtooth",.07);
    notify(boss.hp>0?txt().bossHit:txt().bossEnd,2.5);
    if(boss.hp<=0){boss.alive=false;world.projectiles=[];beep(900,.45,"triangle")}
   }else if(boss.inv<=0)damage();
  }
 }
 world.projectiles=world.projectiles.filter(f=>{
  f.x+=f.vx*dt;
  if(rectHit(p,f))damage();
  return f.x>-60&&f.x<world.width+60;
 });
 for(const r of world.relics){
  if(r.got)continue;
  const dx=p.x+p.w*.5-r.x,dy=p.y+p.h*.5-r.y+Math.sin(now*4+r.id)*5;
  if(dx*dx+dy*dy<1450){
   r.got=true;world.collected++;$("relics").textContent=world.collected+"/"+world.relics.length;
   beep(550+r.id*64,.11,"sine",.045);
   if(world.collected===world.relics.length){notify(txt().gate,3);beep(880,.35,"triangle");}
  }
 }
 const gate=world.gate;
 if(rectHit(p,gate)){
  if(world.collected!==world.relics.length){
   if(toastLast!==txt().need || toastLeft<=0)notify(txt().need,1.2);
  }else if(boss&&boss.alive){
   if(toastLast!==txt().earlyBoss||toastLeft<=0)notify(txt().earlyBoss,1.4);
  }else{finishLevel();return}
 }
 $("clock").textContent=fmtTime(elapsed);
 const sc=view.scale;
 const targetX=clamp(p.x+p.w*.5-view.w*.38,0,Math.max(0,world.width-view.w));
 const targetY=clamp(p.y+p.h*.5-view.h*.76,0,Math.max(0,WORLD_H-view.h));
 cam.x+=(targetX-cam.x)*.11;cam.y+=(targetY-cam.y)*.1;
}
function poly(points,color,stroke=null){
 ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);
 for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);
 ctx.closePath();ctx.fillStyle=color;ctx.fill();
 if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}
}
function circle(x,y,r,color){
 ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
}
function rounded(x,y,w,h,r,color){
 ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();
}
function fillBackground(w,h){
 const c=world.colors,theme=world.d.theme;
 ctx.setTransform(view.dpr,0,0,view.dpr,0,0);
 let sky=ctx.createLinearGradient(0,0,0,h);
 sky.addColorStop(0,c.sky[0]);sky.addColorStop(1,c.sky[1]);
 ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
 if(theme!=="cave"){
  circle(w*.8-cam.x*.023,80-cam.y*.04,theme==="fortress"?27:41,c.sun);
  if(theme==="water"){ctx.fillStyle="#ffffff0b";for(let i=0;i<10;i++){ctx.fillRect(0,i*90+Math.sin(now+i)*12,w,3)}}
  for(let layer=0;layer<3;layer++){
   const shift=(cam.x*(.055+layer*.075))%440;
   const sy=h*(.48+layer*.14)-cam.y*.032;
   const height=80+layer*35;
   const fill=[c.back,c.far,c.hill][layer];
   ctx.fillStyle=fill;ctx.beginPath();ctx.moveTo(-100,h);
   for(let x=-150;x<w+200;x+=25){
    const offset=x+shift;
    const ridge=Math.sin(offset*.009+layer*2.1)*height*.27+Math.sin(offset*.021+layer)*height*.18;
    const slope=theme==="snow"?Math.abs(Math.sin(offset*.014+layer))*height*.55:0;
    ctx.lineTo(x,sy+ridge-slope);
   }
   ctx.lineTo(w+200,h);ctx.closePath();ctx.fill();
  }
 }else{
  ctx.fillStyle="#1b1022";for(let i=-1;i<17;i++){
   const x=i*105-cam.x*.14%105,upper=55+rand(i+20)*65;
   poly([[x,-20],[x+95,-20],[x+60,upper],[x+35,upper+25]],"#241626");
  }
  const glow=ctx.createRadialGradient(w*.58,h,10,w*.58,h,w*.95);
  glow.addColorStop(0,"#e86a3f64");glow.addColorStop(1,"#100c1900");
  ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
 }
 // Ambient drifting fireflies, snow or water bubbles without image dependencies.
 for(let i=0;i<28;i++){
  const x=(rand(i+19)*w*2+now*(theme==="snow"?-17:theme==="water"?8:3))%(w+50)-20;
  const y=(rand(i+800)*h*1.5+(theme==="water"?-now*17:now*3))%(h+20)-10;
  if(theme==="snow"){circle(x,y,1.7,"#edf9ff9e")}
  else if(theme==="water"){ctx.strokeStyle="#d7ffff72";ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(x,y,2.5+rand(i)*3,0,Math.PI*2);ctx.stroke();}
  else if(theme==="cave"){circle(x,y,1.8+rand(i),i%3===0?"#ffdd83b0":"#f98f5c80");}
  else{circle(x,y,1.7+rand(i)*1.5,c.light+"af")}
 }
}
function drawTerrain(r){
 const c=world.colors,theme=world.d.theme;
 // Keep terrain visually filled to the bottom of the current viewport.
 // The collision rectangle itself remains unchanged.
 const visibleHeight=Math.max(r.h,cam.y+view.h-r.y+TILE);
 const side=ctx.createLinearGradient(0,r.y,0,r.y+Math.max(r.h,150));
 side.addColorStop(0,c.ground);side.addColorStop(1,c.stone);
 ctx.fillStyle=side;ctx.fillRect(r.x,r.y,r.w,visibleHeight);
 ctx.fillStyle=c.top;ctx.fillRect(r.x,r.y,r.w,9);
 ctx.fillStyle="#ffffff32";ctx.fillRect(r.x,r.y,r.w,2);
 // Block edges textured as stone or earth.
 for(let x=r.x+15;x<r.x+r.w-8;x+=53){
  ctx.strokeStyle="#ffffff18";ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(x,r.y+24);ctx.lineTo(x+23,r.y+24);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+14,r.y+46);ctx.lineTo(x+14,r.y+59);ctx.stroke();
  if(theme==="forest"||theme==="swamp"){circle(x+9,r.y+8,3,c.top);}
  if(theme==="snow"){poly([[x,r.y+2],[x+12,r.y-6],[x+24,r.y+2]],"#eefbff");}
 }
}
function drawPlatform(r){
 const c=world.colors;
 ctx.fillStyle="#00000039";ctx.fillRect(r.x+5,r.y+9,r.w-2,17);
 rounded(r.x,r.y,r.w,18,4,r.kind==="moving"?"#e3c48b":r.kind==="crumble"?"#947e78":c.stone);
 ctx.fillStyle=r.kind==="moving"?"#f8e1b6":r.kind==="crumble"?"#d4b2a4":c.top;
 ctx.fillRect(r.x,r.y,r.w,6);
 ctx.fillStyle="#ffffff60";
 for(let x=r.x+18;x<r.x+r.w;x+=60)circle(x,r.y+12,2,"#dfddd6");
 if(r.kind==="moving"){ctx.fillStyle="#654c32";ctx.fillRect(r.x+8,r.y+8,7,4);ctx.fillRect(r.x+r.w-15,r.y+8,7,4)}
 if(r.kind==="crumble"&&r.touched){
  ctx.strokeStyle="#1e1a22";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(r.x+r.w*.43,r.y+3);ctx.lineTo(r.x+r.w*.53,r.y+9);ctx.lineTo(r.x+r.w*.47,r.y+17);ctx.stroke();
 }
}
function drawScenery(){
 const theme=world.d.theme;
 const first=Math.max(0,Math.floor(cam.x/210)-1), last=Math.ceil((cam.x+view.w)/210)+1;
 for(let i=first;i<=last;i++){
  const x=i*210+88,y=FLOOR;
  if(theme==="forest"){
   ctx.fillStyle="#2f4838";ctx.fillRect(x+10,y-205,15,205);
   circle(x+20,y-218,58,"#214f45");circle(x-7,y-191,40,"#2f6955");circle(x+51,y-190,39,"#376d56");
   for(let j=0;j<3;j++)circle(x+rand(i*10+j)*45,y-250+rand(i*60+j)*40,4,"#94bf74");
  }else if(theme==="swamp"){
   rounded(x,y-120,18,120,4,"#374d48");
   poly([[x-42,y-128],[x-10,y-190],[x+45,y-164],[x+69,y-112],[x-28,y-99]],"#50725f");
   for(let j=0;j<7;j++){ctx.strokeStyle="#abc9915a";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+j*9,y);ctx.lineTo(x+j*9-7,y-31-rand(j+i)*22);ctx.stroke()}
  }else if(theme==="water"){
   ctx.fillStyle="#09546e";ctx.fillRect(x,y-180,24,180);
   ctx.fillStyle="#0c6780";ctx.fillRect(x-26,y-190,77,22);
   ctx.fillRect(x-18,y-140,58,16);
   for(let j=0;j<5;j++){ctx.strokeStyle="#7fefc099";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-33+j*20,y+5);ctx.quadraticCurveTo(x-53+j*20,y-35,x-40+j*20,y-64);ctx.stroke()}
  }else if(theme==="fortress"){
   ctx.fillStyle="#343146";ctx.fillRect(x-27,y-190,90,190);
   for(let k=0;k<4;k++){ctx.fillRect(x-30+k*25,y-207,17,18)}
   rounded(x+4,y-134,26,55,13,"#151b34");
   circle(x+17,y-84,4,"#d8a271");
  }else if(theme==="snow"){
   ctx.fillStyle="#3a5862";ctx.fillRect(x+13,y-162,15,163);
   for(let k=0;k<3;k++)poly([[x-43+k*8,y-75-k*44],[x+21,y-225+k*10],[x+87-k*8,y-75-k*44]],k%2?"#2e6170":"#336e72");
   poly([[x-8,y-169],[x+21,y-220],[x+50,y-169]],"#eefbff");
  }else{
   ctx.fillStyle="#2b1725";ctx.fillRect(x-35,y-175,95,175);
   for(let k=0;k<4;k++)poly([[x-45+k*27,y-190],[x-25+k*27,y-244],[x+2+k*27,y-182]],"#472b3b");
   circle(x+14,y-66,10,"#fc975d");
  }
 }
}
function drawCheckpoint(cp){
 const x=cp.x,y=FLOOR;
 ctx.fillStyle="#394c53";ctx.fillRect(x,y-99,6,99);
 poly([[x+5,y-95],[x+44,y-80],[x+5,y-60]],cp.active?"#b4ffa6":"#5c7790");
 circle(x+3,y-103,8,cp.active?"#daffa5":"#c9d1e8");
}
function drawHazards(){
 for(const s of world.spikes){
  ctx.fillStyle="#282d39";ctx.fillRect(s.x,s.y+15,s.w,12);
  for(let x=s.x;x<s.x+s.w;x+=21)poly([[x,s.y+19],[x+10,s.y-4],[x+21,s.y+19]],world.d.theme==="snow"?"#e4f6ff":"#cad2dd","#283748");
 }
 for(const f of world.flames){
  const active=Math.sin(elapsed*2.5+f.phase)>.15;
  ctx.fillStyle="#3f2935";ctx.fillRect(f.x-6,FLOOR-9,f.w+12,12);
  if(active){
   poly([[f.x,FLOOR],[f.x+6,f.y+15],[f.x+14,f.y-15],[f.x+24,f.y+4],[f.x+f.w,FLOOR]],"#ff6b37");
   poly([[f.x+8,FLOOR],[f.x+17,f.y+8],[f.x+f.w-5,FLOOR]],"#ffdd6c");
  }else{circle(f.x+18,FLOOR-10,4,"#fcb774")}
 }
 for(const b of world.beams){
  const armed=b.started&&!b.falling&&b.reset<=0;
  ctx.fillStyle=armed&&Math.floor(now*8)%2===0?"#ff6868":"#635367";
  rounded(b.x,b.y,b.w,b.h,5,ctx.fillStyle);
  ctx.strokeStyle="#ddd0b2";ctx.lineWidth=3;ctx.beginPath();
  ctx.moveTo(b.x+14,b.y+4);ctx.lineTo(b.x+28,b.y+20);ctx.moveTo(b.x+46,b.y+4);ctx.lineTo(b.x+60,b.y+20);ctx.stroke();
  if(armed){ctx.fillStyle="#ffb8b4";ctx.font="bold 19px system-ui";ctx.fillText("!",b.x+31,b.y-9)}
 }
}
function drawRelics(){
 for(const r of world.relics){
  if(r.got)continue;
  const y=r.y+Math.sin(now*3+r.id)*6;
  const glow=ctx.createRadialGradient(r.x,y,1,r.x,y,31);
  glow.addColorStop(0,"#fff4bb88");glow.addColorStop(1,"#ffeb7800");
  ctx.fillStyle=glow;ctx.fillRect(r.x-32,y-32,64,64);
  poly([[r.x,y-18],[r.x+13,y],[r.x,y+18],[r.x-13,y]],"#ffe5a2","#ffffff");
  poly([[r.x,y-12],[r.x+7,y],[r.x,y+12],[r.x-7,y]],"#fffde1");
 }
}
function drawEnemies(){
 for(const e of world.enemies){
  if(!e.alive)continue;
  const x=e.x,y=e.y;
  ctx.save();ctx.translate(x+e.w/2,y+e.h/2);ctx.scale(e.dir,1);ctx.translate(-e.w/2,-e.h/2);
  if(e.type==="wolf"){
   rounded(3,12,43,21,9,"#373a4c");poly([[34,14],[41,-2],[48,16]],"#363b4c");poly([[7,16],[15,-5],[25,15]],"#4f5266");
   circle(35,17,3,"#ffcfa7");ctx.fillStyle="#191d2e";ctx.fillRect(6,30,6,12);ctx.fillRect(32,30,6,12);
  }else if(e.type==="ghost"){
   ctx.fillStyle="#94cfdfcc";ctx.beginPath();ctx.arc(21,20,20,Math.PI,0);
   ctx.lineTo(41,42);ctx.lineTo(31,35);ctx.lineTo(21,43);ctx.lineTo(10,35);ctx.lineTo(1,42);ctx.closePath();ctx.fill();
   circle(14,20,4,"#142c46");circle(29,20,4,"#142c46");
  }else if(e.type==="crow"){
   poly([[8,16],[-8,0],[19,11],[37,-3],[35,17]],"#1f293a");
   circle(24,14,10,"#29334a");poly([[31,16],[48,22],[31,23]],"#f6c56b");circle(26,10,2,"#ffedb1");
  }else if(e.type==="fish"){
   poly([[9,15],[-6,0],[-6,30]],"#3c84a3");
   ctx.fillStyle="#45bbc4";ctx.beginPath();ctx.ellipse(25,16,22,13,0,0,Math.PI*2);ctx.fill();
   circle(36,12,3,"#153852");
  }else{
   rounded(8,18,26,30,7,"#695a75");circle(21,12,15,"#4a476b");
   poly([[5,3],[13,-12],[19,6]],"#79708b");poly([[24,5],[32,-12],[39,5]],"#79708b");
   circle(15,13,3,"#ffd494");circle(27,13,3,"#ffd494");
   ctx.fillStyle="#33293a";ctx.fillRect(7,45,11,8);ctx.fillRect(25,45,11,8);
  }
  ctx.restore();
 }
}
function drawBoss(){
 const b=world.boss;if(!b||!b.alive)return;
 ctx.save();if(b.inv>0&&Math.floor(now*12)%2===0)ctx.globalAlpha=.55;
 const x=b.x,y=b.y;
 circle(x+60,y+84,60,"#3a382b");
 poly([[x+9,y+82],[x-35,y+60],[x+4,y+38],[x+72,y+33],[x+125,y+64],[x+153,y+36],[x+133,y+92]],"#226b62","#173b49");
 poly([[x+34,y+43],[x+55,y-12],[x+73,y+43]],"#358a76");
 poly([[x+78,y+44],[x+101,y-9],[x+111,y+53]],"#358a76");
 rounded(x+28,y+50,104,45,20,"#36847b");
 rounded(x+92,y+20,55,51,22,"#55a89a");
 poly([[x+130,y+51],[x+173,y+62],[x+134,y+69]],"#4eab9d");
 poly([[x+106,y+24],[x+114,y-2],[x+124,y+25]],"#e9dc95");
 poly([[x+129,y+25],[x+139,y-6],[x+144,y+30]],"#e9dc95");
 circle(x+129,y+41,6,"#fce8a0");circle(x+131,y+40,2.5,"#162622");
 ctx.fillStyle="#f2d4ab";for(let i=0;i<4;i++)poly([[x+118+i*7,y+64],[x+123+i*7,y+79],[x+127+i*7,y+64]],"#fff6dc");
 for(let i=0;i<3;i++){rounded(x+17+i*36,y-20,26,8,3,i<b.hp?"#caff9f":"#283845")}
 ctx.restore();
}
function drawGate(){
 const g=world.gate;
 const open=world.collected===world.relics.length&&(!world.boss||!world.boss.alive);
 ctx.fillStyle="#2c3143";rounded(g.x-10,g.y-22,82,g.h+23,16,"#504b57");
 rounded(g.x,g.y,g.w,g.h,24,open?"#7de9b6":"#292f4e");
 const energy=ctx.createLinearGradient(0,g.y,0,g.y+g.h);
 energy.addColorStop(0,open?"#ccffbb":"#4d486b");energy.addColorStop(1,open?"#157d88":"#161b39");
 rounded(g.x+8,g.y+10,g.w-16,g.h-13,17,energy);
 for(let i=0;i<5;i++)circle(g.x+g.w/2,g.y+18+i*17,open?2.5:2,open?"#efffcf":"#877ca8");
 poly([[g.x+31,g.y-39],[g.x+43,g.y-27],[g.x+31,g.y-15],[g.x+19,g.y-27]],open?"#eaffbd":"#85819d");
 if(open){ctx.strokeStyle="#d4ffb480";ctx.lineWidth=3;ctx.strokeRect(g.x+4,g.y+4,g.w-8,g.h-8)}
}
function drawPlayer(){
 if(!p)return;
 if(p.inv>0&&Math.floor(now*15)%2===0)return;
 const x=p.x,y=p.y,moving=Math.abs(p.vx)>40,step=moving?Math.sin(p.walk*2)*4:0;
 ctx.save();ctx.translate(x+p.w/2,y+p.h/2);ctx.scale(p.face,1);ctx.translate(-p.w/2,-p.h/2);
 // Light cape, tunic, face and simple animated running legs.
 poly([[8,19],[-9,42],[7,47],[28,44],[28,18]],"#d96e51");
 ctx.fillStyle="#253853";ctx.fillRect(7,34+step,8,16);ctx.fillRect(21,34-step,8,16);
 rounded(4,17,27,25,6,"#3d7591");
 ctx.fillStyle="#e5b481";ctx.fillRect(6,20,5,18);ctx.fillRect(30,20,5,18);
 circle(19,13,13,"#f2c7a3");
 poly([[3,11],[9,-3],[27,-2],[34,11],[25,8],[12,8]],"#314e68");
 ctx.fillStyle="#142433";ctx.fillRect(22,12,3,3);
 rounded(8,27,19,5,2,"#caaa68");
 ctx.restore();
}
function render(){
 if(!ctx||!world)return;
 const rect=canvas.getBoundingClientRect();
 if(rect.width<10||rect.height<10)return;
 let dpr=Math.min(window.devicePixelRatio||1,2);
 const realW=Math.round(rect.width*dpr),realH=Math.round(rect.height*dpr);
 if(canvas.width!==realW||canvas.height!==realH){canvas.width=realW;canvas.height=realH}
 const scale=clamp(rect.width/730,.70,1.16);
 view={w:rect.width/scale,h:rect.height/scale,scale,dpr};
 const maxX=Math.max(0,world.width-view.w),maxY=Math.max(0,WORLD_H-view.h);
 cam.x=clamp(cam.x,0,maxX);cam.y=clamp(cam.y,0,maxY);
 fillBackground(rect.width,rect.height);
 ctx.setTransform(dpr*scale,0,0,dpr*scale,-cam.x*dpr*scale,-cam.y*dpr*scale);
 // Gap danger for cave levels.
 if(levelIndex===5){ctx.fillStyle="#f2633470";ctx.fillRect(0,FLOOR+80,world.width,WORLD_H-FLOOR-80);}
 drawScenery();
 for(const s of world.floors)drawTerrain(s);
 for(const s of world.ledges)drawPlatform(s);
 for(const s of world.moving)drawPlatform(s);
 for(const s of world.crumble)if(s.active)drawPlatform(s);
 for(const cp of world.checkpoints)drawCheckpoint(cp);
 drawHazards();drawRelics();drawEnemies();drawBoss();drawGate();
 for(const f of world.projectiles){circle(f.x+f.w*.5,f.y+f.h*.5,13,"#ff9e4f");circle(f.x+f.w*.5,f.y+f.h*.5,6,"#fff4a3")}
 drawPlayer();
 if(levelIndex===2){
  ctx.fillStyle="#1cd3df0a";ctx.fillRect(cam.x,cam.y,view.w,view.h);
 }
}
function frame(ts){
 if(!t0)t0=ts;
 const delta=Math.min((ts-t0)/1000,.07);
 t0=ts;accumulator=Math.min(accumulator+delta,.15);
 while(accumulator>=STEP){update(STEP);accumulator-=STEP}
 render();requestAnimationFrame(frame);
}
function pointerButton(id,key){
 const b=$(id);
 const release=()=>{keys[key]=false;b.classList.remove("pressed")};
 b.addEventListener("pointerdown",e=>{e.preventDefault();if(state!=="playing")return;keys[key]=true;b.classList.add("pressed");b.setPointerCapture?.(e.pointerId)});
 b.addEventListener("pointerup",release);b.addEventListener("pointercancel",release);b.addEventListener("lostpointercapture",release);
}
pointerButton("left","left");pointerButton("right","right");
$("jump").addEventListener("pointerdown",e=>{e.preventDefault();$("jump").classList.add("pressed");jump();$("jump").setPointerCapture?.(e.pointerId)});
for(const ev of ["pointerup","pointercancel","lostpointercapture"])$("jump").addEventListener(ev,()=>$("jump").classList.remove("pressed"));
window.addEventListener("keydown",e=>{
 const k=e.key.toLowerCase();
 if(["arrowleft","arrowright","arrowup"," ","a","d","w","escape","p"].includes(k))e.preventDefault();
 if(k==="arrowleft"||k==="a")keys.left=true;
 if(k==="arrowright"||k==="d")keys.right=true;
 if((k==="arrowup"||k==="w"||k===" ")&&!e.repeat)jump();
 if((k==="escape"||k==="p")&&!e.repeat)pauseGame();
});
window.addEventListener("keyup",e=>{
 const k=e.key.toLowerCase();
 if(k==="arrowleft"||k==="a")keys.left=false;
 if(k==="arrowright"||k==="d")keys.right=false;
});
window.addEventListener("blur",()=>{resetInputs();if(state==="playing")pauseGame()});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&state==="playing")pauseGame()});
$("pause").addEventListener("click",pauseGame);
$("language").addEventListener("click",()=>{language=language==="pl"?"en":"pl";localSet("legend99_lang",language);setLang()});
$("sound").addEventListener("click",()=>{sfxOn=!sfxOn;localSet("legend99_sound",sfxOn?"on":"off");setLang();if(sfxOn)beep(660,.09)});
$("mainAction").addEventListener("click",()=>{
 if(modalKind==="intro")startLevel(unlocked);
 else if(modalKind==="pause"){state="playing";$("modal").hidden=true;$("pause").disabled=false}
 else if(modalKind==="clear")startLevel(levelIndex+1);
 else startLevel(0);
});
async function shareResult(){
 const url=location.href.split("?")[0].split("#")[0];
 const msg=txt().shareText(fmtTime(elapsed),deaths,url);
 if(navigator.share){try{await navigator.share({title:document.title,text:msg,url});return}catch(e){if(e?.name==="AbortError")return}}
 try{await navigator.clipboard.writeText(msg);notify(txt().copied,2.2)}catch{
  const a=document.createElement("textarea");a.value=msg;document.body.appendChild(a);a.select();document.execCommand("copy");a.remove();notify(txt().copied,2.2);
 }
}
$("secondaryAction").addEventListener("click",()=>{
 if(modalKind==="intro"){$("levelPicker").hidden=!$("levelPicker").hidden;makePicker();}
 else if(modalKind==="pause")startLevel(levelIndex);
 else if(modalKind==="clear")startLevel(levelIndex);
 else shareResult();
});
window.addEventListener("resize",()=>{t0=performance.now();accumulator=0});
world=makeWorld(levelIndex);spawn(true);setLang();showIntro();requestAnimationFrame(frame);
})();