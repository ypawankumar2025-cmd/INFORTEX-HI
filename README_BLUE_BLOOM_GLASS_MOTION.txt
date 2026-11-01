INFOTEX HI — BLUE BLOOM GLASS + MOTION (v3)
==========================================

Palette: Midnight Navy #021861 / Cobalt Blue #255DCE / Bright Red #DE1110

Includes previous Blue Bloom v2 visuals PLUS new translucent frosted-glass panels,
blurred glass AI chats and Project AI, moving ambient flower colours, subtle
entrance transitions, hover lift, and light motion on incoming chat messages.

INSTALL
1) BACK UP your working HI project folder first.
2) Extract ZIP. Copy the included frontend folder into existing HI folder.
   Allow Windows to REPLACE matching frontend files.
3) Don't replace/delete .env, backend, Docker volumes or database.
4) In the existing HI folder terminal run:
   docker compose up -d --no-deps --build frontend
5) Open http://localhost:8080 and press Ctrl+Shift+R.

FILES
frontend/src/main.tsx                     imports CSS theme layers
frontend/src/blue-bloom-cinema.css        base theme
frontend/src/blue-bloom-glass-motion.css  NEW glass and motion layer
frontend/public/hi-blue-bloom.svg         original botanical artwork

The update is CUMULATIVE: no need to install the previous Blue Bloom ZIP first.
No changes to App.tsx, the removed Agent Team integration, AI calls, backend,
credentials, or database. If UI is unsatisfactory, restore original main.tsx
from backup or remove blue-bloom-* imports from main.tsx.

ACCESSIBILITY: prefers-reduced-motion disables the animations; fallback for
browsers without backdrop-filter is included.

Verification: CSS parse and TS entrypoint checks in our environment.
A complete React/Vite Docker build should be verified on your laptop.
