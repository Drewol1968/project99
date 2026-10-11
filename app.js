import { FaceLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/+esm";
import { submitScoreAndRank, isRankingConfigured } from "./ranking.js?v=2";

const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";

const EXPRESSIONS = {
  surprise: { name: "SURPRISED", emoji: "😮", instruction: "Open your mouth and raise your eyebrows", targets: { jawOpen: .42, browInnerUp: .24, eyeWideLeft: .16, eyeWideRight: .16, mouthSmileLeft: .10, mouthSmileRight: .10 } },
  smile: { name: "BIG SMILE", emoji: "😁", instruction: "Smile as wide as you can", targets: { mouthSmileLeft: .42, mouthSmileRight: .42, cheekSquintLeft: .16, cheekSquintRight: .16, jawOpen: .14 } },
  wink: { name: "WINK", emoji: "😉", instruction: "Wink one eye and keep the other open", targets: { eyeBlinkLeft: .52, eyeBlinkRight: .14, mouthSmileLeft: .20, mouthSmileRight: .20 } },
  angry: { name: "ANGRY", emoji: "😠", instruction: "Pull your eyebrows down and tense your eyes", targets: { browDownLeft: .34, browDownRight: .34, eyeSquintLeft: .16, eyeSquintRight: .16, jawOpen: .14 } },
  kiss: { name: "KISS FACE", emoji: "😘", instruction: "Pucker your lips", targets: { mouthPucker: .36, mouthFunnel: .22, jawOpen: .12, mouthSmileLeft: .14, mouthSmileRight: .14 } }
};

const UI = {
  en: {
    dailyEyebrow:"DAILY HUMAN CHALLENGE", homeTitle:"Can you beat<br/>today's face?",
    homeSubtitle:"One global face every day. Your camera analyzes the expression locally on your phone. No face image is uploaded.",
    streakLabel:"🔥 STREAK", todayBestLabel:"🏆 TODAY BEST", dailyBadge:"DAILY",
    challengeNameHome:"COPY FACE", challengeMeta:"Same challenge worldwide · resets daily",
    start:"PLAY TODAY'S CHALLENGE", random:"RANDOM FACE", install:"INSTALL APP",
    gameEyebrow:"COPY FACE", copyThis:"COPY THIS", liveMatch:"LIVE MATCH",
    resultEyebrow:"YOUR RESULT", share:"CHALLENGE A FRIEND", again:"TRY AGAIN", home:"BACK TO HOME",
    ready:"I'M READY", center:"Center your face", makeFace:"Make the face, then tap I'M READY",
    hold:"HOLD IT!", almost:"Almost…", copy:"Copy the face", noFace:"Face not detected",
    cameraRequired:"Camera permission is required for COPY FACE.", cameraBlocked:"Camera blocked",
    loading:"Loading face model…", aiReady:"AI ready — center your face", getReady:"Get ready…", holdFace:"HOLD THE FACE",
    bestToday:"Today's best on this device: ", bestDevice:"Your best on this device: ", streakWord:"day streak",
    score96:"ABSURDLY CLOSE", score90:"ALMOST PERFECT", score82:"VERY CLOSE", score70:"NOT BAD", scoreLow:"TRY THAT AGAIN"
  },
  pl: {
    dailyEyebrow:"CODZIENNE WYZWANIE", homeTitle:"Czy pobijesz<br/>dzisiejszy wynik?",
    homeSubtitle:"Każdego dnia jedna taka sama mina dla wszystkich. Kamera analizuje mimikę lokalnie na Twoim telefonie. Zdjęcie twarzy nie jest wysyłane.",
    streakLabel:"🔥 SERIA", todayBestLabel:"🏆 NAJLEPSZY DZIŚ", dailyBadge:"DZISIAJ",
    challengeNameHome:"SKOPIUJ MINĘ", challengeMeta:"To samo wyzwanie na całym świecie · zmienia się codziennie",
    start:"ZAGRAJ W DZISIEJSZE WYZWANIE", random:"LOSOWA MINA", install:"ZAINSTALUJ APLIKACJĘ",
    gameEyebrow:"SKOPIUJ MINĘ", copyThis:"SKOPIUJ TO", liveMatch:"DOPASOWANIE",
    resultEyebrow:"TWÓJ WYNIK", share:"WYZWANIE DLA PRZYJACIELA", again:"SPRÓBUJ PONOWNIE", home:"WRÓĆ NA START",
    ready:"JESTEM GOTOWY", center:"Ustaw twarz na środku", makeFace:"Zrób pokazaną minę i naciśnij JESTEM GOTOWY",
    hold:"TRZYMAJ!", almost:"Prawie…", copy:"Skopiuj minę", noFace:"Nie wykryto twarzy",
    cameraRequired:"Aby zagrać, zezwól na dostęp do przedniej kamery.", cameraBlocked:"Kamera zablokowana",
    loading:"Ładowanie modelu twarzy…", aiReady:"AI gotowe — ustaw twarz na środku", getReady:"Przygotuj się…", holdFace:"TRZYMAJ MINĘ",
    bestToday:"Najlepszy dziś na tym urządzeniu: ", bestDevice:"Najlepszy na tym urządzeniu: ", streakWord:"dni z rzędu",
    score96:"NIEMAL IDEALNIE", score90:"PRAWIE IDEALNIE", score82:"BARDZO BLISKO", score70:"NIEŹLE", scoreLow:"SPRÓBUJ JESZCZE RAZ"
  }
};
const LANG = (navigator.language || "en").toLowerCase().startsWith("pl") ? "pl" : "en";
const T = UI[LANG];

function exprText(key) {
  if (LANG !== "pl") return EXPRESSIONS[key];
  const pl = {
    surprise:{name:"ZDZIWIENIE",instruction:"Otwórz usta i unieś brwi"},
    smile:{name:"SZEROKI UŚMIECH",instruction:"Uśmiechnij się jak najszerzej"},
    wink:{name:"MRUGNIĘCIE",instruction:"Mrugnij jednym okiem, drugie zostaw otwarte"},
    angry:{name:"ZŁOŚĆ",instruction:"Ściągnij brwi i zmruż oczy"},
    kiss:{name:"BUZIAK",instruction:"Zrób dzióbek ustami"}
  };
  return {...EXPRESSIONS[key], ...pl[key]};
}
function applyLanguage() {
  document.documentElement.lang = LANG;
  if ($("dailyEyebrow")) $("dailyEyebrow").textContent=T.dailyEyebrow;
  if ($("homeTitle")) $("homeTitle").innerHTML=T.homeTitle;
  if ($("homeSubtitle")) $("homeSubtitle").textContent=T.homeSubtitle;
  if ($("streakLabel")) $("streakLabel").textContent=T.streakLabel;
  if ($("todayBestLabel")) $("todayBestLabel").textContent=T.todayBestLabel;
  if ($("dailyBadge")) $("dailyBadge").textContent=T.dailyBadge;
  if ($("challengeNameHome")) $("challengeNameHome").textContent=T.challengeNameHome;
  if ($("challengeMeta")) $("challengeMeta").textContent=T.challengeMeta;
  if ($("startBtn")) $("startBtn").textContent=T.start;
  if ($("randomBtn")) $("randomBtn").textContent=T.random;
  if ($("installBtn")) $("installBtn").textContent=T.install;
  if ($("gameEyebrow")) $("gameEyebrow").textContent=T.gameEyebrow;
  if ($("copyThisLabel")) $("copyThisLabel").textContent=T.copyThis;
  if ($("liveMatchLabel")) $("liveMatchLabel").textContent=T.liveMatch;
  if ($("resultEyebrow")) $("resultEyebrow").textContent=T.resultEyebrow;
  if ($("shareBtn")) $("shareBtn").textContent=T.share;
  if ($("againBtn")) $("againBtn").textContent=T.again;
  if ($("homeBtn")) $("homeBtn").textContent=T.home;
  if ($("streakResultLabel")) $("streakResultLabel").textContent=T.streakWord;
  if ($("privacyPill")) $("privacyPill").textContent = LANG==="pl" ? "AI NA TELEFONIE" : "ON-DEVICE AI";
}

const $ = (id) => document.getElementById(id);
const screens = ["startScreen", "gameScreen", "resultScreen"];
const video = $("video");
const overlay = $("overlay");
const ctx = overlay.getContext("2d");
let stream = null, faceLandmarker = null, modelReady = false, cameraReady = false, processing = false;
let currentExpressionKey = "surprise", currentScore = 0, bestScoreThisRound = 0, lastFinalScore = 0, lastGlobalRank = null, deferredInstallPrompt = null, rafId = null, lastVideoTime = -1, chosenFromLink = false, isDailyRun = true;

function showScreen(id) { screens.forEach(s => $(s).classList.toggle("active", s === id)); }
function fmtScore(n) { const x = Number(n); const s = Number.isFinite(x) ? x.toFixed(1) : "0.0"; return LANG==="pl" ? s.replace(".", ",") : s; }
function storedNumber(key) { const raw = localStorage.getItem(key); if (raw == null) return 0; const n = Number(String(raw).replace(",", ".")); return Number.isFinite(n) ? n : 0; }
function utcDateKey(date = new Date()) { return date.toISOString().slice(0,10); }
function yesterdayUtcKey() { const d = new Date(); d.setUTCDate(d.getUTCDate()-1); return utcDateKey(d); }
function hashString(s) { let h = 2166136261; for (let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h,16777619); } return h >>> 0; }
function dailyExpressionKey() { const keys = Object.keys(EXPRESSIONS); return keys[hashString("project99:"+utcDateKey()) % keys.length]; }
function applyExpression(key) {
  currentExpressionKey = key;
  const e = exprText(key);
  $("targetName").textContent = e.name; $("targetInstruction").textContent = e.instruction; $("targetEmoji").textContent = e.emoji; $("startEmoji").textContent = e.emoji;
}
function pickExpression(mode = "daily") {
  const requested = new URLSearchParams(location.search).get("c");
  if (!chosenFromLink && requested && EXPRESSIONS[requested]) { chosenFromLink = true; isDailyRun = false; applyExpression(requested); return; }
  if (mode === "daily") { isDailyRun = true; applyExpression(dailyExpressionKey()); }
  else { isDailyRun = false; const keys = Object.keys(EXPRESSIONS); applyExpression(keys[Math.floor(Math.random()*keys.length)]); }
}
function refreshHomeStats() {
  $("streakValue").textContent = String(Number(localStorage.getItem("p99_daily_streak") || 0));
  const best = storedNumber("p99_daily_best_"+utcDateKey());
  $("todayBestValue").textContent = best > 0 ? fmtScore(best)+"%" : "--";
  applyExpression(dailyExpressionKey());
}
function updateDailyStreak(score) {
  const today = utcDateKey();
  const last = localStorage.getItem("p99_daily_last");
  let streak = storedNumber("p99_daily_streak");
  if (last !== today) {
    streak = last === yesterdayUtcKey() ? streak + 1 : 1;
    localStorage.setItem("p99_daily_streak", String(streak));
    localStorage.setItem("p99_daily_last", today);
  }
  const bestKey = "p99_daily_best_"+today;
  const oldBest = storedNumber(bestKey);
  if (score > oldBest) localStorage.setItem(bestKey, Number(score).toFixed(1));
  return streak;
}
async function initModel() {
  if (modelReady || faceLandmarker) return;
  $("statusText").textContent = T.loading;
  try {
    const vision = await FilesetResolver.forVisionTasks(WASM_URL);
    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" }, runningMode: "VIDEO", numFaces: 1,
      outputFaceBlendshapes: true, outputFacialTransformationMatrixes: false,
      minFaceDetectionConfidence: .5, minFacePresenceConfidence: .5, minTrackingConfidence: .5,
    });
    modelReady = true; $("statusText").textContent = T.aiReady; updateReadyState();
  } catch (err) { console.error(err); $("statusText").textContent = "Could not load face AI. Check internet connection and reload."; }
}
async function startCamera() {
  if (stream) return;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 1280 } }, audio: false });
    video.srcObject = stream; await video.play(); cameraReady = true; resizeOverlay(); $("cameraHint").textContent = T.center; updateReadyState(); loop();
  } catch (err) { console.error(err); $("statusText").textContent = T.cameraRequired; $("cameraHint").textContent = T.cameraBlocked; }
}
function stopCamera() { if (stream) stream.getTracks().forEach(t => t.stop()); stream = null; cameraReady = false; if (rafId) cancelAnimationFrame(rafId); rafId = null; }
function updateReadyState() { const ready = modelReady && cameraReady; $("captureBtn").disabled = !ready; if (ready) { $("captureBtn").textContent = T.ready; $("statusText").textContent = T.makeFace; } }
function resizeOverlay() { const rect = overlay.getBoundingClientRect(); const dpr = Math.min(devicePixelRatio || 1, 2); overlay.width = Math.round(rect.width * dpr); overlay.height = Math.round(rect.height * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
function categoryMap(result) { const categories = result?.faceBlendshapes?.[0]?.categories || []; const map = {}; for (const c of categories) map[c.categoryName] = c.score; return map; }
function expressionScore(actual, targets) {
  // Score against practical thresholds instead of exact blendshape values.
  // This is much more stable across different faces and cameras.
  const parts = [];
  for (const [name, target] of Object.entries(targets)) {
    const value = actual[name] ?? 0;
    let s;
    if (target <= .15) {
      // Feature should stay low (e.g. jawOpen during a smile).
      const tolerance = Math.max(.22, target + .18);
      s = 1 - Math.min(1, Math.max(0, value - target) / tolerance);
    } else {
      // Feature should be clearly present. Reaching the threshold is full credit.
      s = Math.min(1, value / target);
    }
    parts.push(s);
  }
  const avg = parts.reduce((a,b) => a+b, 0) / Math.max(parts.length, 1);
  // Keep the scale competitive while avoiding overly punishing mid-range scores.
  return Math.max(0, Math.min(99.9, Math.pow(avg, .72) * 100));
}
function drawFaceGuide(result) {
  ctx.clearRect(0,0,overlay.clientWidth,overlay.clientHeight);
}
function loop() {
  if (!stream) return;
  if (modelReady && video.readyState >= 2 && video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    try {
      const result = faceLandmarker.detectForVideo(video, performance.now()); drawFaceGuide(result); const actual = categoryMap(result);
      if (Object.keys(actual).length) {
        const score = expressionScore(actual, EXPRESSIONS[currentExpressionKey].targets); currentScore = score; if (processing) bestScoreThisRound = Math.max(bestScoreThisRound, score);
        $("liveScore").textContent = score.toFixed(0)+"%"; $("meterFill").style.width = score+"%"; $("cameraHint").textContent = score > 82 ? T.hold : score > 60 ? T.almost : T.copy;
      } else { $("liveScore").textContent = "--%"; $("meterFill").style.width = "0%"; $("cameraHint").textContent = T.noFace; }
    } catch (err) { console.warn(err); }
  }
  rafId = requestAnimationFrame(loop);
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function runChallenge() {
  if (processing || !modelReady || !cameraReady) return;
  processing = true; bestScoreThisRound = 0; $("captureBtn").disabled = true; $("statusText").textContent = T.getReady;
  for (const n of [3,2,1]) { $("countdown").textContent = n; $("countdown").classList.remove("hidden"); await sleep(650); }
  $("countdown").textContent = "GO"; await sleep(350); $("countdown").classList.add("hidden"); $("statusText").textContent = T.holdFace; await sleep(2200);
  processing = false; showResult(Math.max(bestScoreThisRound, currentScore));
}
function scoreHeadline(score) { if (score >= 96) return T.score96; if (score >= 90) return T.score90; if (score >= 82) return T.score82; if (score >= 70) return T.score70; return T.scoreLow; }
function localBestKey() { return "p99_best_"+currentExpressionKey; }
function getLocalBest() { return storedNumber(localBestKey()); }
function saveLocalBest(score) { if (score > getLocalBest()) localStorage.setItem(localBestKey(), Number(score).toFixed(1)); }
async function updateGlobalRank(score) {
  const card = $("globalRankCard");
  const text = $("globalRankText");
  if (!card || !text) return;
  if (!isDailyRun) { card.classList.add("hidden"); return; }
  if (!isRankingConfigured()) {
    card.classList.add("hidden");
    return;
  }
  card.classList.remove("hidden");
  text.textContent = LANG==="pl" ? "Zapisywanie wyniku…" : "Saving score…";
  try {
    const r = await submitScoreAndRank({ challengeDate: utcDateKey(), expression: currentExpressionKey, score });
    if (!r.configured) { card.classList.add("hidden"); return; }
    const topPct = Math.max(1, Math.ceil((r.rank / Math.max(r.total, 1)) * 100));
    lastGlobalRank = { rank:r.rank, total:r.total, topPct };
    text.textContent = LANG==="pl"
      ? "#"+r.rank+" z "+r.total+" · TOP "+topPct+"% dzisiaj"
      : "#"+r.rank+" of "+r.total+" · TOP "+topPct+"% today";
  } catch (err) {
    console.error(err);
    text.textContent = (LANG==="pl" ? "Błąd rankingu: " : "Ranking error: ") + (err?.message || "unknown");
  }
}
function showResult(score) {
  lastGlobalRank = null;
  stopCamera(); score = Math.max(0, Math.min(99.9, score)); lastFinalScore = score; saveLocalBest(score); const e = exprText(currentExpressionKey);
  let streak = storedNumber("p99_daily_streak");
  if (isDailyRun) streak = updateDailyStreak(score);
  $("resultEmoji").textContent = e.emoji; $("finalScore").textContent = fmtScore(score); $("resultHeadline").textContent = scoreHeadline(score);
  $("resultDetail").textContent = isDailyRun ? T.bestToday+fmtScore(storedNumber("p99_daily_best_"+utcDateKey()) || score)+"%" : T.bestDevice+fmtScore(getLocalBest())+"%";
  $("streakResult").classList.toggle("hidden", !isDailyRun); $("streakResultValue").textContent = String(streak);
  if ($("streakResultLabel")) $("streakResultLabel").textContent = LANG==="pl" ? (streak===1 ? "dzień z rzędu" : "dni z rzędu") : (streak===1 ? "day streak" : "day streak");
  const deg = Math.max(10, score * 3.6); document.querySelector(".score-ring").style.background = "conic-gradient(var(--accent) 0deg, var(--accent2) "+deg+"deg, #24242d "+deg+"deg)";
  showScreen("resultScreen");
  updateGlobalRank(score);
}
function challengeUrl() { const url = new URL(location.href); url.searchParams.set("c", currentExpressionKey); return url.toString(); }
function makeShareCard(score) {
  const canvas = $("shareCanvas"), c = canvas.getContext("2d"), e = EXPRESSIONS[currentExpressionKey], g = c.createLinearGradient(0,0,1080,1920);
  g.addColorStop(0,"#09090e"); g.addColorStop(1,"#17121e"); c.fillStyle=g; c.fillRect(0,0,1080,1920);
  c.fillStyle="#f6ff3d"; c.font="900 54px system-ui"; c.fillText("PROJECT 99",78,120);
  c.fillStyle="#fff"; c.font="900 86px system-ui"; c.fillText("CAN YOU",78,300); c.fillText("BEAT THIS?",78,400);
  c.font="240px Apple Color Emoji, Segoe UI Emoji"; c.fillText(e.emoji,370,760);
  c.fillStyle="#a5a5b2"; c.font="800 34px system-ui"; c.fillText(e.name,78,930);
  c.fillStyle="#fff"; c.font="900 230px system-ui"; c.fillText(fmtScore(score),70,1230);
  c.fillStyle="#f6ff3d"; c.font="900 88px system-ui"; c.fillText("% MATCH",725,1230);
  c.fillStyle="#fff"; c.font="800 50px system-ui"; c.fillText("COPY THE FACE.",78,1460); c.fillText("SEND YOUR SCORE.",78,1535);
  if (lastGlobalRank?.total > 0) {
    c.fillStyle="#f6ff3d"; c.font="900 42px system-ui";
    c.fillText("#"+lastGlobalRank.rank+" / "+lastGlobalRank.total+" · TOP "+lastGlobalRank.topPct+"%",78,1640);
  }
  c.fillStyle="#777786"; c.font="700 30px system-ui"; c.fillText("#PROJECT99",78,1800); return canvas;
}
async function shareResult() {
  const score = lastFinalScore, canvas = makeShareCard(score), url = challengeUrl();
  const rankPart = lastGlobalRank?.total > 0
    ? (LANG==="pl" ? " Jestem #"+lastGlobalRank.rank+" z "+lastGlobalRank.total+" (TOP "+lastGlobalRank.topPct+"%)." : " I'm #"+lastGlobalRank.rank+" of "+lastGlobalRank.total+" (TOP "+lastGlobalRank.topPct+"%).")
    : "";
  const text = LANG==="pl"
    ? "Mam "+fmtScore(score)+"% w PROJECT 99."+rankPart+" Pobijesz mnie?"
    : "I scored "+fmtScore(score)+"% in PROJECT 99."+rankPart+" Can you beat me?";
  try {
    const blob = await new Promise(r => canvas.toBlob(r,"image/png",.94)), file = blob ? new File([blob],"project99-score.png",{type:"image/png"}) : null;
    if (navigator.share) { const payload = { title:"PROJECT 99", text, url }; if (file && navigator.canShare?.({files:[file]})) payload.files=[file]; await navigator.share(payload); return; }
    await navigator.clipboard.writeText(text+" "+url); $("shareBtn").textContent="LINK COPIED";
  } catch (err) {
    if (err?.name !== "AbortError") { console.error(err); try { await navigator.clipboard.writeText(text+" "+url); $("shareBtn").textContent="LINK COPIED"; } catch (_) {} }
  }
}
$("startBtn").addEventListener("click", async () => { pickExpression("daily"); showScreen("gameScreen"); await Promise.all([initModel(), startCamera()]); });
$("randomBtn").addEventListener("click", async () => { pickExpression("random"); showScreen("gameScreen"); await Promise.all([initModel(), startCamera()]); });
$("backBtn").addEventListener("click", () => { stopCamera(); showScreen("startScreen"); });
$("captureBtn").addEventListener("click", runChallenge);
$("againBtn").addEventListener("click", async () => { showScreen("gameScreen"); await startCamera(); updateReadyState(); });
$("homeBtn").addEventListener("click", () => { refreshHomeStats(); showScreen("startScreen"); });
$("shareBtn").addEventListener("click", shareResult);
window.addEventListener("resize", resizeOverlay);
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferredInstallPrompt=e; $("installBtn").classList.remove("hidden"); });
$("installBtn").addEventListener("click", async () => { if (!deferredInstallPrompt) return; deferredInstallPrompt.prompt(); await deferredInstallPrompt.userChoice; deferredInstallPrompt=null; $("installBtn").classList.add("hidden"); });
if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js?v=10").catch(console.warn);
applyLanguage();
refreshHomeStats();
