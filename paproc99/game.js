(() => {
"use strict";
const $ = id => document.getElementById(id);
const canvas=$("game"),ctx=canvas.getContext("2d",{alpha:false});
const levelData=[
 {name:"ŚWIĘTY LAS",emoji:"🌲",short:"Las Leszego",desc:"Korzenie, pradawne dęby i strażnik Leszy.",palette:["#091d25","#315b4f","#1a403b","#82a96a"],grounds:[[0,470],[590,940],[1060,1430],[1565,1940],[2075,2660]],platforms:[[245,98,130],[635,105,130],[1110,100,125],[1600,105,120],[2130,100,130],[1785,158,95]],glows:[[170,55],[355,155],[680,145],[835,55],[1140,152],[1310,55],[1640,150],[1860,55],[2150,145],[2400,55]],enemies:[360,780,1230,1720,2240],checkpoints:[1080,2080],goal:2510,width:2660,required:6,spikes:[915,1845],flyers:[[715,136],[1695,145]],story:"W lesie Leszego ukryto pierwszą część legendy."},
 {name:"BAGNA RUSAŁEK",emoji:"🌫️",short:"Bagna Rusałek",desc:"Mgła, zgubne kładki i przebiegłe utopce.",palette:["#101e2e","#3f6165","#284c4f","#80b99a"],grounds:[[0,445],[580,900],[1045,1320],[1465,1780],[1930,2280],[2425,2740]],platforms:[[240,105,130],[625,102,125],[1100,102,140],[1530,108,130],[1935,105,130],[2425,105,120]],glows:[[170,60],[300,150],[665,145],[825,60],[1130,145],[1250,65],[1555,155],[2010,148],[2220,60],[2490,145]],enemies:[365,760,1210,1625,2100,2520],checkpoints:[1040,1920],goal:2610,width:2740,required:7,spikes:[385,1230,1690,2170],flyers:[[685,135],[1170,140],[2020,145]],story:"Rusałki kuszą wędrowców, a utopce strzegą przepraw."},
 {name:"PODWODNA KRAINA",emoji:"🌊",short:"Podwodna Kraina",desc:"Zalane ruiny, wodne zjawy i zatopiona brama.",palette:["#061b38","#116a87","#11405f","#4bc9c4"],grounds:[[0,465],[610,960],[1110,1460],[1620,1980],[2130,2720]],platforms:[[220,95,120],[640,150,135],[1130,105,130],[1640,120,120],[2160,115,135],[2370,190,120]],glows:[[165,60],[295,140],[700,196],[855,65],[1180,145],[1350,65],[1680,168],[1910,65],[2210,160],[2420,235]],enemies:[390,795,1320,1770,2240,2520],checkpoints:[1120,2130],goal:2600,width:2720,required:8,spikes:[385,850,1330,2320],flyers:[[710,145],[1190,148],[1690,160],[2370,180]],story:"W głębinach lśni ostatnia droga do Kwiatu Paproci."}
];
const GAME_SAVE="p99_fern_open_levels_v2";
const PH=39,PW=25,GRAVITY=1080,SPEED=225;
const requiredGlows=()=>stage?.required||6;
let viewW=400,viewH=460,dpr=1,groundY=375,cam=0,now=0,last=0;
let stageIndex=0,stage=null,unlocked=loadUnlocked(),mode="menu";
let hero={x:55,y:0,vx:0,vy:0,facing:1,onGround:true,coyote:0,inv:0,hp:3,anim:0,swimCD:0};
let glows=[],enemies=[],particles=[],gems=0,checkpoint=55,startTime=0,elapsed=0,toastTimeout=0;
let audioOn=false,audioContext=null;
const keys={left:false,right:false,jump:false}, rand=(n)=>Math.abs(Math.sin(n*127.321+4.67)*42193.827)%1;
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
function loadUnlocked(){try{return clamp(Number(localStorage.getItem(GAME_SAVE))||1,1,3)}catch{return 1}}
function saveUnlocked(n){unlocked=Math.max(unlocked,n);try{localStorage.setItem(GAME_SAVE,String(unlocked))}catch{}}
function resize(){
 const r=canvas.getBoundingClientRect(),oldH=viewH;
 viewW=Math.max(280,r.width);viewH=Math.max(330,r.height);
 dpr=Math.min(2,window.devicePixelRatio||1);
 canvas.width=Math.round(viewW*dpr);canvas.height=Math.round(viewH*dpr);
 ctx.setTransform(dpr,0,0,dpr,0,0);groundY=viewH-76;
 if(stage&&mode==="play")hero.y+=viewH-oldH;
}
new ResizeObserver(resize).observe(canvas);resize();
function hideLayers(){
 for(const id of ["menuOverlay","pauseOverlay","endOverlay"])$(id).hidden=true;
}
function showMenu(){
 mode="menu";keys.left=keys.right=keys.jump=false;hideLayers();
 $("topHud").hidden=true;$("menuOverlay").hidden=false;updateMenu();
}
function updateMenu(){
 $("progressLabel").textContent="ODKRYTO "+unlocked+" Z 3 KRAIN";
 $("stageList").replaceChildren(...levelData.map((level,i)=>{
 const btn=document.createElement("button");btn.type="button";
 const locked=i+1>unlocked;
 btn.className="stage-option"+(stageIndex===i?" selected":"")+(locked?" locked":"");
 btn.disabled=locked;
 const icon=document.createElement("span");icon.className="stage-icon";icon.textContent=level.emoji;
 const title=document.createElement("span");title.className="stage-name";title.textContent=(i+1)+". "+level.name;
 const sub=document.createElement("small");sub.textContent=level.desc;title.append(sub);
 const state=document.createElement("span");state.className="stage-status";state.textContent=locked?"🔒":stageIndex===i?"✓":"GRAJ";
 btn.append(icon,title,state);
 btn.addEventListener("click",()=>{stageIndex=i;updateMenu();beep(420,0.07)});
 return btn;
 }));
}
function setLevel(i){
 stageIndex=i;stage=levelData[i];
 checkpoint=55;glows=stage.glows.map((o,j)=>({x:o[0],offset:o[1],taken:false,phase:j}));
 enemies=stage.enemies.map((x,j)=>({base:x,x,dir:j%2?-1:1,range:36+j%3*13,dead:false,phase:j*.77}));
 gems=0;particles=[];elapsed=0;cam=0;hero={x:55,y:groundY-PH,vx:0,vy:0,facing:1,onGround:true,coyote:.12,inv:0,hp:3,anim:0,swimCD:0};
 $("levelTag").textContent=stage.emoji+" "+stage.name;
 updateHUD();
}
function startLevel(i=stageIndex){
 setLevel(i);mode="play";startTime=performance.now();
 hideLayers();$("topHud").hidden=false;keys.left=keys.right=keys.jump=false;
 toast(stageIndex===2?"🌊 PŁYŃ I ZBIERZ "+requiredGlows()+" ŚWIETLIKÓW":"✦ ZBIERZ "+requiredGlows()+" ŚWIETLIKÓW I ZNAJDŹ BRAMĘ",2800);
 beep(523,.09);beep(784,.12,.14);
}
function updateHUD(){
 $("gemsDisplay").textContent=String(gems);
 if($("requiredDisplay"))$("requiredDisplay").textContent=String(requiredGlows());
 $("healthDisplay").textContent=("♥ ".repeat(hero.hp)).trim()||"♡";
}
function toast(text,duration=1400){
 const el=$("toast");el.textContent=text;el.hidden=false;
 clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.hidden=true,duration);
}
function beep(freq,duration=.09,delay=0){
 if(!audioOn)return;
 try{
  audioContext=audioContext||new (window.AudioContext||window.webkitAudioContext)();
  if(audioContext.state==="suspended")audioContext.resume();
  const o=audioContext.createOscillator(),g=audioContext.createGain(),at=audioContext.currentTime+delay;
  o.type="sine";o.frequency.setValueAtTime(freq,at);o.frequency.exponentialRampToValueAtTime(Math.max(120,freq*.75),at+duration);
  g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(.08,at+.018);g.gain.exponentialRampToValueAtTime(.0001,at+duration);
  o.connect(g).connect(audioContext.destination);o.start(at);o.stop(at+duration+.02);
 }catch{}
}
$("soundBtn").addEventListener("click",()=>{
 audioOn=!audioOn;$("soundState").textContent=audioOn?"ON":"OFF";if(audioOn)beep(660,.14);
});
function finish(win){
 mode=win?"won":"lost";hideLayers();$("endOverlay").hidden=false;$("topHud").hidden=true;
 $("endSeal").textContent=win?"✺":"☾";
 $("endOverline").textContent=win?"KR AINA UKOŃCZONA".replace("KR A","KRA"):"PRZYGODA TRWA";
 $("endTitle").textContent=win?(stageIndex===2?"Legenda rozkwita!":"Brama otwarta!"):"Spróbuj ponownie";
 $("endDetail").textContent=win?(stageIndex===2?"Odkryłeś trzy magiczne krainy. To dopiero początek wielkiej słowiańskiej wyprawy!":stage.story+" Następna kraina jest już dostępna."):"Strażnicy byli dziś zbyt silni. Wyrusz ponownie i odszukaj świetliki!";
 $("endStats").textContent="✦ "+gems+" świetlików · "+Math.round(elapsed)+" s · "+(3-hero.hp)+" utraconych serc";
 if(win){
  if(stageIndex<2)saveUnlocked(stageIndex+2);
  $("endMainBtn").textContent=stageIndex<2?"NASTĘPNA KRAINA →":"ZAGRAJ OD POCZĄTKU";
  beep(660,.09);beep(880,.09,.12);beep(1100,.2,.23);
 }else{$("endMainBtn").textContent="SPRÓBUJ PONOWNIE";beep(220,.3)}
}
$("playBtn").addEventListener("click",()=>startLevel(stageIndex));
$("endMainBtn").addEventListener("click",()=>{
 if(mode==="won")startLevel(stageIndex<2?stageIndex+1:0);
 else startLevel(stageIndex);
});
$("endHomeBtn").addEventListener("click",showMenu);
$("resumeBtn").addEventListener("click",resume);
$("pauseHomeBtn").addEventListener("click",showMenu);
$("pauseBtn").addEventListener("click",()=>{if(mode==="play")pause();});
function pause(){mode="paused";keys.left=keys.right=keys.jump=false;$("pauseOverlay").hidden=false;beep(330,.07)}
function resume(){mode="play";$("pauseOverlay").hidden=true;last=performance.now();}
function bindKey(button,key){
 const el=$(button);let pid=null;
 el.addEventListener("pointerdown",e=>{
  e.preventDefault();
  if(pid!==null)return;
  pid=e.pointerId;keys[key]=true;el.classList.add("down");
  if(key==="jump")queueJump();
  try{el.setPointerCapture(pid)}catch{}
 });
 const end=e=>{
  if(pid!==e.pointerId)return;
  pid=null;keys[key]=false;el.classList.remove("down");
 };
 ["pointerup","pointercancel","lostpointercapture"].forEach(type=>el.addEventListener(type,end));
}
let queuedJump=false;
function queueJump(){queuedJump=true}
bindKey("leftBtn","left");bindKey("rightBtn","right");bindKey("jumpBtn","jump");
function keyFor(code){
 if(code==="ArrowLeft"||code==="KeyA")return "left";
 if(code==="ArrowRight"||code==="KeyD")return "right";
 if(code==="ArrowUp"||code==="Space"||code==="KeyW")return "jump";
 return null;
}
window.addEventListener("keydown",e=>{
 const key=keyFor(e.code);
 if(key){e.preventDefault();if(!keys[key]&&key==="jump")queueJump();keys[key]=true;}
 if(e.code==="Escape"||e.code==="KeyP"){if(mode==="play")pause();else if(mode==="paused")resume();}
 if(e.code==="KeyR"&&mode==="play")startLevel();
});
window.addEventListener("keyup",e=>{
 const key=keyFor(e.code);if(key){e.preventDefault();keys[key]=false;}
});
window.addEventListener("blur",()=>{keys.left=keys.right=keys.jump=false;if(mode==="play")pause();});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&mode==="play")pause();});
function burst(x,y,col,count=14){
 for(let i=0;i<count;i++){const a=Math.PI*2*i/count+(rand(i+now)*.7),speed=45+rand(i*3+now)*145;
 particles.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed-60,life:.6+rand(i)*.3,color:col,r:2+rand(i+3)*3});}
}
function surfaces(){
 return [
 ...stage.grounds.map(o=>({x:o[0],end:o[1],y:groundY,kind:0})),
 ...stage.platforms.map(o=>({x:o[0],end:o[0]+o[2],y:groundY-o[1],kind:1}))
 ];
}
function damage(){
 if(hero.inv>0||mode!=="play")return;
 hero.hp--;hero.inv=1.6;hero.vy=-210;hero.vx=-hero.facing*90;
 updateHUD();beep(180,.25);
 if(navigator.vibrate)try{navigator.vibrate(90)}catch{}
 if(hero.hp<=0){finish(false);return}
 toast("♥ UWAŻAJ! POZOSTAŁO "+hero.hp+" ŻYĆ",1200);
}
function respawn(){
 if(mode!=="play")return;
 damage();if(mode!=="play")return;
 hero.x=checkpoint;hero.y=groundY-PH;hero.vy=0;hero.vx=0;hero.onGround=true;cam=clamp(hero.x-viewW*.33,0,Math.max(0,stage.width-viewW));
}
function update(dt){
 if(!stage||mode!=="play")return;
 elapsed+=dt;hero.anim+=dt;hero.inv=Math.max(0,hero.inv-dt);hero.swimCD=Math.max(0,hero.swimCD-dt);
 const axis=(keys.right?1:0)-(keys.left?1:0);
 if(axis){hero.facing=axis;hero.vx=axis*(stageIndex===2?195:SPEED)}
 else hero.vx*=Math.pow(.045,dt*8);
 const underwater=stageIndex===2;
 const jumpNow=queuedJump||(underwater&&keys.jump&&hero.swimCD<=0);
 queuedJump=false;
 if(jumpNow){
  if(underwater){hero.vy=-320;hero.swimCD=.34;hero.onGround=false;beep(320,.045)}
  else if(hero.onGround||hero.coyote>0){hero.vy=-500;hero.onGround=false;hero.coyote=0;beep(400,.07)}
 }
 const oldBottom=hero.y+PH;
 hero.vy=Math.min(underwater?350:820,hero.vy+(underwater?620:GRAVITY)*dt);
 hero.x=clamp(hero.x+hero.vx*dt,0,stage.width-PW);
 hero.y+=hero.vy*dt;
 let landed=false;
 if(hero.vy>=0){
  for(const s of surfaces()){
   if(hero.x+PW-4>s.x&&hero.x+4<s.end&&oldBottom<=s.y+11&&hero.y+PH>=s.y){
    hero.y=s.y-PH;hero.vy=0;landed=true;break;
   }
  }
 }
 hero.onGround=landed;
 if(landed)hero.coyote=.10;else hero.coyote=Math.max(0,hero.coyote-dt);
 if(hero.y>viewH+100){respawn();return}
 if(stage.checkpoints[0]&&hero.x>stage.checkpoints[0]&&checkpoint<stage.checkpoints[0]){checkpoint=stage.checkpoints[0];toast("✺ NOWY PUNKT KONTROLNY",1250)}
 if(stage.checkpoints[1]&&hero.x>stage.checkpoints[1]&&checkpoint<stage.checkpoints[1]){checkpoint=stage.checkpoints[1];toast("✺ NOWY PUNKT KONTROLNY",1250)}
 for(const orb of glows){
  if(orb.taken)continue;
  const oy=groundY-orb.offset+Math.sin(now*.0025+orb.phase)*5;
  if(Math.hypot(hero.x+PW/2-orb.x,hero.y+PH/2-oy)<30){
   orb.taken=true;gems++;updateHUD();burst(orb.x,oy,"#ffe08a");beep(620+gems*75,.1);
   if(gems===requiredGlows())toast("✺ BRAMA OTWARTA! IDŹ W PRAWO →",2100);
  }
 }
 for(const s of stage.spikes){
  if(hero.x+PW>s+5&&hero.x<s+29&&hero.y+PH>groundY-18&&hero.y<groundY)damage();
 }
 for(const spirit of stage.flyers){
  const sx=spirit[0]+Math.sin(now*.0017+spirit[0])*43;
  const sy=groundY-spirit[1]+Math.sin(now*.0028+spirit[0]) *25;
  if(Math.hypot(hero.x+PW/2-sx,hero.y+PH/2-sy)<27)damage();
 }
 if(mode!=="play")return;
 for(const e of enemies){
  if(e.dead)continue;
  e.x=e.base+Math.sin(now*(.0019+stageIndex*.00035)+e.phase)*e.range;
  const ey=groundY-29;
  if(hero.x+PW>e.x-17&&hero.x<e.x+17&&hero.y+PH>ey&&hero.y<ey+28){
   if(hero.vy>75&&oldBottom<=ey+14){
    e.dead=true;hero.vy=underwater?-230:-290;burst(e.x,ey,"#b5dfc8",18);beep(500,.13);
   }else damage();
  }
 }
 if(hero.x>stage.goal-22&&hero.y+PH>groundY-150){
  if(gems>=requiredGlows()){finish(true);return}
  if(now-(update.portalAlert||0)>2400){toast("✦ POTRZEBUJESZ JESZCZE "+(requiredGlows()-gems)+" ŚWIETLIKÓW",1600);update.portalAlert=now;}
  hero.x=Math.min(hero.x,stage.goal-25);
 }
 for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=180*dt;p.life-=dt;}
 particles=particles.filter(p=>p.life>0);
 cam+=(clamp(hero.x-viewW*.34,0,Math.max(0,stage.width-viewW))-cam)*Math.min(1,dt*6);
}
function roundedRect(x,y,w,h,r,color){
 if(w<=0||h<=0)return;
 ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,Math.min(r,w/2,h/2));ctx.fill();
}
function polygon(coords,color){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(coords[0],coords[1]);for(let i=2;i<coords.length;i+=2)ctx.lineTo(coords[i],coords[i+1]);ctx.closePath();ctx.fill();}
function circle(x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
function line(x1,y1,x2,y2,width,color){
 ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
}
function background(){
 const c=stage?stage.palette:levelData[stageIndex].palette;
 const sky=ctx.createLinearGradient(0,0,0,viewH);
 sky.addColorStop(0,c[0]);sky.addColorStop(.68,c[1]);sky.addColorStop(1,c[2]);
 ctx.fillStyle=sky;ctx.fillRect(0,0,viewW,viewH);
 const underwater=stageIndex===2;
 if(!underwater){
  circle(viewW*.79,viewH*.16,42,"#f3e9be15");
  circle(viewW*.79,viewH*.16,27,"#f7edc38c");
  circle(viewW*.79+8,viewH*.16-7,27,c[0]);
  for(let i=0;i<38;i++){let x=rand(i+11)*viewW,y=rand(i*3+9)*groundY*.72;circle(x,y,.5+rand(i+82)*1.4,"#ffefbc88");}
 }else{
  for(let i=0;i<7;i++){
   polygon([i*viewW/6-50,0,i*viewW/6+15,0,i*viewW/6+195,viewH,i*viewW/6+75,viewH],"#6edbe80b");
  }
 }
 const p=cam*.15;
 for(let i=0;i<17;i++){
  const x=(i*130-p*1.2)%(viewW+260)-130;
  const y=groundY-62+Math.sin(i*1.8)*23;
  circle(x,y,70,"#0a222a50");
 }
 if(stageIndex===0){
  const offset=(cam*.34)%150;
  for(let i=-2;i<Math.ceil(viewW/105)+3;i++){
   const x=i*112-offset+rand(i+20)*18;
   tree(x,groundY+18,85+rand(i+8)*110,"#132e2f");
  }
  for(let i=-1;i<Math.ceil(viewW/175)+2;i++){
   const x=i*182-(cam*.64)%182+rand(i*2)*23;
   tree(x,groundY+14,92+rand(i+51)*70,"#0b2924");
  }
  for(let i=0;i<5;i++){const x=(i*173+now*.011-cam*.3)%(viewW+100)-30;circle(x,groundY-75+Math.sin(now*.002+i*7)*22,3,"#e5d18773");}
 }else if(stageIndex===1){
  const offset=cam*.28;
  for(let i=-1;i<Math.ceil(viewW/160)+2;i++){
   const x=i*160-offset%160;
   line(x,groundY+20,x+15,groundY-110,13,"#203b3c");
   circle(x+16,groundY-112,34,"#3f605a44");
   line(x+15,groundY-85,x+45,groundY-63,3,"#355b55");
   for(let j=0;j<3;j++)line(x+35+j*4,groundY-72,x+33+j*5,groundY-39+Math.sin(now*.001+j)*9,2,"#597c66");
  }
  ctx.fillStyle="#b0d9cb18";
  for(let j=0;j<6;j++){const y=groundY-20-j*35;ctx.fillRect(0,y,viewW,9);}
  for(let i=0;i<6;i++)circle((i*150+40-cam*.4+viewW*10)%viewW,groundY-115+Math.sin(now*.001+i*5)*19,3,"#dff8b46b");
 }else{
  const offset=cam*.4;
  for(let i=-1;i<Math.ceil(viewW/190)+2;i++){
   const x=i*190-offset%190;
   roundedRect(x,groundY-145,35,165,4,"#173e5799");
   roundedRect(x-10,groundY-149,55,14,3,"#295a7399");
   roundedRect(x+18,groundY-112,15,7,1,"#4e809165");
   for(let j=0;j<4;j++)circle(x+rand(i*20+j)*80,groundY-160+rand(i*7+j)*140,1.5,"#b4ffe077");
  }
  for(let i=0;i<33;i++){
   const x=(i*73-cam*.13)% (viewW+80);
   const y=(viewH-((now*.027*(1+rand(i)) +i*41)%(viewH+70)));
   ctx.strokeStyle="#b9f7fb46";ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,2+rand(i)*5,0,7);ctx.stroke();
  }
 }
}
function tree(x,y,height,color){
 line(x,y,x,y-height*.63,height*.10,color);
 polygon([x-height*.28,y-height*.38,x,y-height*.95,x+height*.28,y-height*.38],color);
 polygon([x-height*.24,y-height*.59,x,y-height*1.1,x+height*.24,y-height*.59],color);
 circle(x,y-height*.84,height*.12,"#86b19b12");
}
function drawGround(g){
 const x=g.x-cam,w=g.end-g.x,y=g.y;
 if(x>viewW+60||x+w<-60)return;
 if(stageIndex===2){
  roundedRect(x,y,w,viewH-y+50,3,"#183f53");
  roundedRect(x,y,w,12,3,"#487b87");
  for(let i=0;i<w/40;i++)line(x+i*40,y+13,x+i*40,y+27,1,"#7799a54e");
  for(let i=0;i<w/50;i++)circle(x+18+i*50,y+23+rand(i)*13,2,"#5b929f");
 }else{
  roundedRect(x,y,w,viewH-y+40,4,stageIndex===0?"#20332c":"#283d3e");
  roundedRect(x,y-5,w,16,5,stageIndex===0?"#597547":"#55776a");
  roundedRect(x,y-5,w,4,2,stageIndex===0?"#9ba86a":"#91a98b");
  for(let i=0;i<w/37;i++){
   let sx=x+i*37+9;
   line(sx,y-5,sx-4,y-12-(i%3)*4,2,"#95ad72");
   if(stageIndex===1)circle(sx+12,y+20,2,"#81988070");
  }
 }
}
function drawPlatform(p){
 const x=p.x-cam,y=p.y,w=p.end-p.x;
 if(x>viewW+60||x+w<-60)return;
 if(stageIndex===2){
  roundedRect(x,y,w,17,4,"#397787");roundedRect(x,y,w,5,3,"#8ac2bd");
  for(let i=0;i<w/30;i++)line(x+i*30,y+8,x+i*30,y+17,1,"#16384d");
  line(x+5,y+19,x+2,y+35,2,"#2f998a");
 }else if(stageIndex===1){
  roundedRect(x,y,w,15,3,"#594f3e");roundedRect(x,y,w,6,2,"#8cae80");
  for(let i=0;i<w/27;i++)line(x+i*27,y+5,x+i*27,y+13,2,"#a8b59c50");
 }else{
  roundedRect(x,y,w,22,5,"#4c5542");roundedRect(x,y,w,9,4,"#8eac70");
  for(let i=0;i<w/37;i++)line(x+i*37,y+13,x+i*37+12,y+20,2,"#273830");
 }
}
function drawOrb(orb){
 if(orb.taken)return;
 const x=orb.x-cam,y=groundY-orb.offset+Math.sin(now*.0025+orb.phase)*5;
 if(x<-25||x>viewW+25)return;
 ctx.save();
 ctx.shadowColor="#ffe37c";ctx.shadowBlur=19;
 circle(x,y,10,"#f9cd60bb");circle(x,y,5,"#fff6cc");
 ctx.restore();
 for(let i=0;i<3;i++){const a=now*.0014+orb.phase+i*2.1;circle(x+Math.cos(a)*15,y+Math.sin(a)*13,1.6,"#ffffc1c4");}
}
function drawEnemy(e){
 if(e.dead)return;
 const x=e.x-cam,y=groundY-29;
 if(x<-40||x>viewW+40)return;
 ctx.save();ctx.translate(x,y);
 const bob=Math.sin(now*.004+e.phase)*2;
 if(stageIndex===0){
  line(-10,24,-13,30,5,"#372927");line(10,24,13,30,5,"#372927");
  polygon([-16,23,-13,0,-6,-9,0,-13,6,-9,13,0,17,23],"#3e4d36");
  line(-7,-7,-16,-21,4,"#624935");line(7,-7,16,-22,4,"#624935");
  line(-16,-21,-23,-25,3,"#624935");line(16,-22,23,-25,3,"#624935");
  circle(-5,5,2.5,"#e6cf8b");circle(5,5,2.5,"#e6cf8b");
  line(-4,15,4,15,2,"#16201d");
 }else if(stageIndex===1){
  ctx.translate(0,bob);
  polygon([-17,28,-16,5,-9,-8,8,-8,17,5,17,28],"#306c66");
  circle(0,1,15,"#5a9585");
  polygon([-16,6,-20,-11,-6,-6],"#27534e");
  polygon([16,6,20,-11,6,-6],"#27534e");
  circle(-5,1,3,"#d6f8a9");circle(5,1,3,"#d6f8a9");
  line(-6,11,6,11,2,"#1b393f");
 }else{
  ctx.translate(0,bob*2);
  polygon([-20,3,-34,-8,-34,17],"#92d5b4");
  ctx.beginPath();ctx.ellipse(0,3,19,13,0,0,Math.PI*2);ctx.fillStyle="#5aacaa";ctx.fill();
  polygon([-6,-9,1,-18,8,-9],"#76c0bf");
  circle(9,0,3,"#efffd5");circle(10,0,1.1,"#183645");
  line(-10,10,7,10,1,"#256677");
 }
 ctx.restore();
}
function drawHazards(){
 for(const spike of stage.spikes){
  const x=spike-cam,y=groundY;
  if(x<-45||x>viewW+30)continue;
  roundedRect(x-3,y-5,40,6,2,stageIndex===2?"#75acaa":"#624a3d");
  for(let i=0;i<3;i++){
   const sx=x+i*12;
   polygon([sx,y-5,sx+6,y-28-(i%2)*6,sx+12,y-5],stageIndex===2?"#5accb8":"#d39b6d");
   line(sx+6,y-18,sx+9,y-7,1,stageIndex===2?"#d5ffff":"#f3d6a0");
  }
 }
 for(const spirit of stage.flyers){
  const x=spirit[0]+Math.sin(now*.0017+spirit[0])*43-cam;
  const y=groundY-spirit[1]+Math.sin(now*.0028+spirit[0])*25;
  if(x<-50||x>viewW+50)continue;
  ctx.save();ctx.shadowColor=stageIndex===2?"#8ffff0":"#c6adfc";ctx.shadowBlur=14;
  const col=stageIndex===2?"#83dad2":"#c3a8e1";
  circle(x,y,13,col);
  circle(x-4,y-2,2,"#223148");circle(x+4,y-2,2,"#223148");
  for(let i=-1;i<=1;i++)line(x+i*6,y+9,x+i*6+Math.sin(now*.004+i)*4,y+20,2,col);
  ctx.restore();
 }
}
function drawPortal(){
 const x=stage.goal-cam,y=groundY;
 if(x<-70||x>viewW+70)return;
 const unlocked=gems>=requiredGlows();
 ctx.save();
 ctx.shadowColor=unlocked?"#f3d37f":"#6d9b98";ctx.shadowBlur=unlocked?32:6;
 ctx.strokeStyle=unlocked?"#f2d183":"#567a7b";ctx.lineWidth=8;ctx.beginPath();ctx.ellipse(x,y-53,29,53,0,Math.PI,2*Math.PI);ctx.stroke();
 ctx.fillStyle=unlocked?"#d4b661":"#516366";
 ctx.fillRect(x-32,y-6,64,9);
 if(unlocked){
  circle(x,y-72,12,"#ffe9a1");
  for(let i=0;i<6;i++){const a=now*.0006+i*Math.PI/3;circle(x+Math.cos(a)*19,y-75+Math.sin(a)*18,6,"#ffe5a1");}
  line(x,y-62,x,y-36,3,"#aadfa4");
 }else{
  circle(x,y-75,12,"#729b9b88");
  line(x-9,y-68,x+9,y-82,3,"#9dbbb9");
  line(x-9,y-82,x+9,y-68,3,"#9dbbb9");
 }
 ctx.restore();
 const label=unlocked?"BRAMA OTWARTA":"ZBIERZ "+requiredGlows()+" ŚWIETLIKÓW";
 ctx.font="bold 11px system-ui";ctx.textAlign="center";
 ctx.fillStyle="#f7e6b8";ctx.shadowColor="#000";ctx.shadowBlur=5;ctx.fillText(label,x,y-131);
 ctx.textAlign="start";ctx.shadowBlur=0;
}
function drawHero(){
 const x=hero.x-cam,y=hero.y;
 if(x<-50||x>viewW+50)return;
 if(hero.inv>0&&Math.floor(now/90)%2===0)return;
 const walk=hero.onGround&&Math.abs(hero.vx)>20?Math.sin(hero.anim*16)*5:0;
 ctx.save();ctx.translate(x+PW/2,y+PH/2);ctx.scale(hero.facing,1);
 if(hero.onGround){ctx.fillStyle="#00000030";ctx.beginPath();ctx.ellipse(0,PH/2+3,18,4,0,0,7);ctx.fill();}
 line(-5,13,-6+walk,22,5,"#40382c");line(5,13,6-walk,22,5,"#40382c");
 polygon([-13,-4,-10,16,11,16,13,-5,4,-10,-5,-10],"#ac6044");
 polygon([-9,-6,-14,9,-5,14,1,-3],"#7d3f38");
 line(-10,0,-16,6+walk,4,"#e7bd86");
 circle(0,-13,10,"#e6bd87");
 polygon([-12,-13,-11,-20,0,-27,11,-20,13,-13,7,-19,-7,-19],"#40372e");
 line(-5,-9,5,-9,1.2,"#795439");circle(3,-14,1.1,"#3d3027");
 polygon([3,-1,10,4,7,11,0,3],"#d4ac63");
 line(13,5,14,12,2,"#856d45");
 ctx.save();ctx.shadowColor="#efdf8b";ctx.shadowBlur=11;circle(14,13,4,"#ffe7a6");ctx.restore();
 ctx.restore();
}
function drawDecor(){
 const step=stageIndex===2?115:90;
 const start=Math.max(0,Math.floor(cam/step)-1);
 const end=Math.ceil((cam+viewW)/step)+1;
 for(let i=start;i<=end;i++){
  const worldX=i*step+rand(i*3)*32;
  if(!stage.grounds.some(g=>worldX>g[0]+12&&worldX<g[1]-12))continue;
  const x=worldX-cam,y=groundY;
  if(stageIndex===0){
   line(x,y,x-2,y-11-rand(i)*13,3,"#82ab70");
   circle(x-3,y-16,2.5,"#e7c784");
   if(i%5===0){line(x,y,x+3,y-30,6,"#545b45");circle(x+3,y-30,11,"#58855a");}
  }else if(stageIndex===1){
   for(let t=0;t<3;t++)line(x+t*5,y+3,x+t*5-2,y-18-t*5,3,"#67998b");
   if(i%5===0)circle(x+4,y-11,5,"#a6b88a");
  }else{
   line(x,y,x-8,y-32,3,"#3ba998");line(x,y,x+9,y-28,3,"#38c0a3");
   circle(x+9,y-30,4,"#83d0c8");
  }
 }
}
function drawParticles(){
 for(const p of particles){ctx.globalAlpha=clamp(p.life/.5,0,1);circle(p.x-cam,p.y,p.r,p.color);}ctx.globalAlpha=1;
}
function draw(){
 ctx.setTransform(dpr,0,0,dpr,0,0);
 ctx.clearRect(0,0,viewW,viewH);
 background();
 if(!stage)return;
 for(const s of stage.grounds)drawGround({x:s[0],end:s[1],y:groundY});
 for(const p of stage.platforms)drawPlatform({x:p[0],end:p[0]+p[2],y:groundY-p[1]});
 drawDecor();
 drawHazards();
 for(const orb of glows)drawOrb(orb);
 drawPortal();
 for(const e of enemies)drawEnemy(e);
 drawHero();drawParticles();
 if(stageIndex===2){
  const water=ctx.createLinearGradient(0,0,0,viewH);water.addColorStop(0,"#68e5ff04");water.addColorStop(1,"#48b2d012");
  ctx.fillStyle=water;ctx.fillRect(0,0,viewW,viewH);
 }
 if(mode==="play"){
  const progress=clamp(hero.x/stage.goal,0,1);
  roundedRect(14,viewH-18,viewW-28,5,3,"#0a1b23aa");
  roundedRect(14,viewH-18,(viewW-28)*progress,5,3,"#e1c879");
 }
}
function frame(time){
 if(!last)last=time;
 const dt=clamp((time-last)/1000,0,.035);
 last=time;now=time;
 update(dt);draw();requestAnimationFrame(frame);
}
stage=levelData[0];
setLevel(0);showMenu();requestAnimationFrame(frame);
})();
