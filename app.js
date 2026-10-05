import { FaceLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/+esm";

const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";

const EXPRESSIONS = {
  surprise: { name: "SURPRISED", emoji: "😮", instruction: "Open your mouth and raise your eyebrows", targets: { jawOpen: .78, browInnerUp: .65, eyeWideLeft: .48, eyeWideRight: .48, mouthSmileLeft: .05, mouthSmileRight: .05 } },
  smile: { name: "BIG SMILE", emoji: "😁", instruction: "Smile as wide as you can", targets: { mouthSmileLeft: .86, mouthSmileRight: .86, cheekSquintLeft: .48, cheekSquintRight: .48, jawOpen: .12 } },
  wink: { name: "WINK", emoji: "😉", instruction: "Wink one eye and keep the other open", targets: { eyeBlinkLeft: .88, eyeBlinkRight: .08, mouthSmileLeft: .38, mouthSmileRight: .38 } },
  angry: { name: "ANGRY", emoji: "😠", instruction: "Pull your eyebrows down and tense your eyes", targets: { browDownLeft: .72, browDownRight: .72, eyeSquintLeft: .40, eyeSquintRight: .40, jawOpen: .05 } },
  kiss: { name: "KISS FACE", emoji: "😘", instruction: "Pucker your lips", targets: { mouthPucker: .84, mouthFunnel: .55, jawOpen: .04, mouthSmileLeft: .03, mouthSmileRight: .03 } }
};

const $ = (id) => document.getElementById(id);
const screens = ["startScreen", "gameScreen", "resultScreen"];
const video = $("video");
const overlay = $("overlay");
const ctx = overlay.getContext("2d");
let stream = null, faceLandmarker = null, modelReady = false, cameraReady = false, processing = false;
let currentExpressionKey = "surprise", currentScore = 0, bestScoreThisRound = 0, lastFinalScore = 0, deferredInstallPrompt = null, rafId = null, lastVideoTime = -1, chosenFromLink = false;

function showScreen(id) { screens.forEach(s => $(s).classList.toggle("active", s === id)); }
function pickExpression() {
  const requested = new URLSearchParams(location.search).get("c");
  if (!chosenFromLink && requested && EXPRESSIONS[requested]) { currentExpressionKey = requested; chosenFromLink = true; }
  else { const keys = Object.keys(EXPRESSIONS); currentExpressionKey = keys[Math.floor(Math.random() * keys.length)]; }
  const e = EXPRESSIONS[currentExpressionKey];
  $("targetName").textContent = e.name; $("targetInstruction").textContent = e.instruction; $("targetEmoji").textContent = e.emoji; $("startEmoji").textContent = e.emoji;
}
async function initModel() {
  if (modelReady || faceLandmarker) return;
  $("statusText").textContent = "Loading face model…";
  try {
    const vision = await FilesetResolver.forVisionTasks(WASM_URL);
    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" }, runningMode: "VIDEO", numFaces: 1,
      outputFaceBlendshapes: true, outputFacialTransformationMatrixes: false,
      minFaceDetectionConfidence: .5, minFacePresenceConfidence: .5, minTrackingConfidence: .5,
    });
    modelReady = true; $("statusText").textContent = "AI ready — center your face"; updateReadyState();
  } catch (err) { console.error(err); $("statusText").textContent = "Could not load face AI. Check internet connection and reload."; }
}
async function startCamera() {
  if (stream) return;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 1280 } }, audio: false });
    video.srcObject = stream; await video.play(); cameraReady = true; resizeOverlay(); $("cameraHint").textContent = "Center your face"; updateReadyState(); loop();
  } catch (err) { console.error(err); $("statusText").textContent = "Camera permission is required for COPY FACE."; $("cameraHint").textContent = "Camera blocked"; }
}
function stopCamera() { if (stream) stream.getTracks().forEach(t => t.stop()); stream = null; cameraReady = false; if (rafId) cancelAnimationFrame(rafId); rafId = null; }
function updateReadyState() { const ready = modelReady && cameraReady; $("captureBtn").disabled = !ready; if (ready) { $("captureBtn").textContent = "I'M READY"; $("statusText").textContent = "Make the face, then tap I'M READY"; } }
function resizeOverlay() { const rect = overlay.getBoundingClientRect(); const dpr = Math.min(devicePixelRatio || 1, 2); overlay.width = Math.round(rect.width * dpr); overlay.height = Math.round(rect.height * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
function categoryMap(result) { const categories = result?.faceBlendshapes?.[0]?.categories || []; const map = {}; for (const c of categories) map[c.categoryName] = c.score; return map; }
function expressionScore(actual, targets) {
  const diffs = [];
  for (const [name, target] of Object.entries(targets)) { const value = actual[name] ?? 0; const weight = target > .4 ? 1.2 : .75; diffs.push(Math.abs(value - target) * weight); }
  const mae = diffs.reduce((a,b) => a+b, 0) / Math.max(diffs.length, 1); const raw = Math.max(0, 1 - mae / .72); return Math.max(0, Math.min(100, Math.pow(raw, .82) * 100));
}
function drawFaceGuide(result) {
  ctx.clearRect(0,0,overlay.clientWidth,overlay.clientHeight); const lm = result?.faceLandmarks?.[0]; if (!lm) return;
  ctx.fillStyle = "rgba(246,255,61,.76)"; const keyIdx = [1,33,263,61,291,13,14,70,300], w = overlay.clientWidth, h = overlay.clientHeight;
  for (const idx of keyIdx) { const p = lm[idx]; if (!p) continue; const x = w * (1 - p.x), y = h * p.y; ctx.beginPath(); ctx.arc(x,y,2.1,0,Math.PI*2); ctx.fill(); }
}
function loop() {
  if (!stream) return;
  if (modelReady && video.readyState >= 2 && video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    try {
      const result = faceLandmarker.detectForVideo(video, performance.now()); drawFaceGuide(result); const actual = categoryMap(result);
      if (Object.keys(actual).length) {
        const score = expressionScore(actual, EXPRESSIONS[currentExpressionKey].targets); currentScore = score; if (processing) bestScoreThisRound = Math.max(bestScoreThisRound, score);
        $("liveScore").textContent = score.toFixed(0)+"%"; $("meterFill").style.width = score+"%"; $("cameraHint").textContent = score > 82 ? "HOLD IT!" : score > 60 ? "Almost…" : "Copy the face";
      } else { $("liveScore").textContent = "--%"; $("meterFill").style.width = "0%"; $("cameraHint").textContent = "Face not detected"; }
    } catch (err) { console.warn(err); }
  }
  rafId = requestAnimationFrame(loop);
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function runChallenge() {
  if (processing || !modelReady || !cameraReady) return;
  processing = true; bestScoreThisRound = 0; $("captureBtn").disabled = true; $("statusText").textContent = "Get ready…";
  for (const n of [3,2,1]) { $("countdown").textContent = n; $("countdown").classList.remove("hidden"); await sleep(650); }
  $("countdown").textContent = "GO"; await sleep(350); $("countdown").classList.add("hidden"); $("statusText").textContent = "HOLD THE FACE"; await sleep(2200);
  processing = false; showResult(Math.max(bestScoreThisRound, currentScore));
}
function scoreHeadline(score) { if (score >= 96) return "ABSURDLY CLOSE"; if (score >= 90) return "ALMOST PERFECT"; if (score >= 82) return "VERY CLOSE"; if (score >= 70) return "NOT BAD"; return "TRY THAT AGAIN"; }
function localBestKey() { return "p99_best_"+currentExpressionKey; }
function getLocalBest() { return Number(localStorage.getItem(localBestKey()) || 0); }
function saveLocalBest(score) { if (score > getLocalBest()) localStorage.setItem(localBestKey(), score.toFixed(1)); }
function showResult(score) {
  stopCamera(); score = Math.max(0, Math.min(99.9, score)); saveLocalBest(score); const e = EXPRESSIONS[currentExpressionKey];
  $("resultEmoji").textContent = e.emoji; $("finalScore").textContent = score.toFixed(1); $("resultHeadline").textContent = scoreHeadline(score);
  $("resultDetail").textContent = "Your best on this device: "+getLocalBest().toFixed(1)+"%";
  const deg = Math.max(10, score * 3.6); document.querySelector(".score-ring").style.background = "conic-gradient(var(--accent) 0deg, var(--accent2) "+deg+"deg, #24242d "+deg+"deg)";
  showScreen("resultScreen");
}
function challengeUrl() { const url = new URL(location.href); url.searchParams.set("c", currentExpressionKey); return url.toString(); }
function makeShareCard(score) {
  const canvas = $("shareCanvas"), c = canvas.getContext("2d"), e = EXPRESSIONS[currentExpressionKey], g = c.createLinearGradient(0,0,1080,1920);
  g.addColorStop(0,"#09090e"); g.addColorStop(1,"#17121e"); c.fillStyle=g; c.fillRect(0,0,1080,1920);
  c.fillStyle="#f6ff3d"; c.font="900 54px system-ui"; c.fillText("PROJECT 99",78,120);
  c.fillStyle="#fff"; c.font="900 86px system-ui"; c.fillText("CAN YOU",78,300); c.fillText("BEAT THIS?",78,400);
  c.font="240px Apple Color Emoji, Segoe UI Emoji"; c.fillText(e.emoji,370,760);
  c.fillStyle="#a5a5b2"; c.font="800 34px system-ui"; c.fillText(e.name,78,930);
  c.fillStyle="#fff"; c.font="900 230px system-ui"; c.fillText(score.toFixed(1),70,1230);
  c.fillStyle="#f6ff3d"; c.font="900 88px system-ui"; c.fillText("% MATCH",725,1230);
  c.fillStyle="#fff"; c.font="800 50px system-ui"; c.fillText("COPY THE FACE.",78,1460); c.fillText("SEND YOUR SCORE.",78,1535);
  c.fillStyle="#777786"; c.font="700 30px system-ui"; c.fillText("#PROJECT99",78,1800); return canvas;
}
async function shareResult() {
  const score = Number($("finalScore").textContent), canvas = makeShareCard(score), text = "I scored "+score.toFixed(1)+"% on "+EXPRESSIONS[currentExpressionKey].name+". Can you beat me?", url = challengeUrl();
  try {
    const blob = await new Promise(r => canvas.toBlob(r,"image/png",.94)), file = blob ? new File([blob],"project99-score.png",{type:"image/png"}) : null;
    if (navigator.share) { const payload = { title:"PROJECT 99", text, url }; if (file && navigator.canShare?.({files:[file]})) payload.files=[file]; await navigator.share(payload); return; }
    await navigator.clipboard.writeText(text+" "+url); $("shareBtn").textContent="LINK COPIED";
  } catch (err) {
    if (err?.name !== "AbortError") { console.error(err); try { await navigator.clipboard.writeText(text+" "+url); $("shareBtn").textContent="LINK COPIED"; } catch (_) {} }
  }
}
$("startBtn").addEventListener("click", async () => { pickExpression(); showScreen("gameScreen"); await Promise.all([initModel(), startCamera()]); });
$("backBtn").addEventListener("click", () => { stopCamera(); showScreen("startScreen"); });
$("captureBtn").addEventListener("click", runChallenge);
$("againBtn").addEventListener("click", async () => { pickExpression(); showScreen("gameScreen"); await startCamera(); updateReadyState(); });
$("shareBtn").addEventListener("click", shareResult);
window.addEventListener("resize", resizeOverlay);
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferredInstallPrompt=e; $("installBtn").classList.remove("hidden"); });
$("installBtn").addEventListener("click", async () => { if (!deferredInstallPrompt) return; deferredInstallPrompt.prompt(); await deferredInstallPrompt.userChoice; deferredInstallPrompt=null; $("installBtn").classList.add("hidden"); });
if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(console.warn);
pickExpression();
