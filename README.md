# PROJECT 99 — MVP v0.1

Working mobile-first PWA prototype for the **COPY FACE** challenge.

## What works
- Front camera
- On-device MediaPipe Face Landmarker
- Live face-expression match score
- Five random expression challenges: surprised, smile, wink, angry, kiss
- 3-second countdown + 2.2-second scored attempt
- Local best score stored on the device
- Shareable challenge URL
- Share card generated on-device as PNG when supported
- Installable PWA shell
- No face image upload/backend in this prototype

## Important MVP limitations
- Face scoring is heuristic and must be calibrated on real users before launch.
- No global leaderboard/backend yet.
- No video recording/export yet.
- MediaPipe JS/WASM and model are loaded from Google/jsDelivr at runtime.
- Before public launch, add privacy/consent flows and complete legal review for camera use, minors, analytics and advertising.

## Next steps
1. Test scoring on 20–50 faces.
2. Add anonymous user/device ID + backend leaderboard.
3. Add 9:16 attempt recording and clip export.
4. Add PERFECT ANGLE challenge.
5. Add DAILY CHALLENGE and deep links.
