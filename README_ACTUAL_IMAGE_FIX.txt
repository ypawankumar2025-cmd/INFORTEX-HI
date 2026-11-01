INFOTEX HI — ACTUAL WEBSITE HANDSHAKE IMAGE FIX (v6)
===================================================
ROOT CAUSE VERIFIED IN PROJECT SOURCE:
The Vite Dockerfile copied frontend/src but did NOT copy frontend/public.
So the previous hero CSS referred to /hi-human-robot-handshake-bg.webp
but the resulting Nginx image did not contain that image.
The CSS displayed its earlier bright-red background fallback.

THIS PATCH CHANGES REAL BUILD ASSETS, NOT A SCREENSHOT OR MOCKUP.
- frontend/src/hi-handshake-glass-menu.css
  Uses Vite-bundled relative URL ./hi-human-robot-handshake-bg.webp
  and sets the fallback background color to navy.
- frontend/src/hi-human-robot-handshake-bg.webp
  Actual banner artwork (human on left, robot on right, handshake center).
- frontend/public/hi-human-robot-handshake-bg.webp
  Keeps older public URL references working.
- frontend/Dockerfile
  Adds COPY frontend/public ./public to ensure all public images ship to Nginx.

APPLY (existing working project only):
1. BACKUP your current HI folder; do not replace your entire project.
2. Extract the ZIP (it contains a frontend directory).
3. Copy extracted frontend directory into your existing working HI directory
   in Downloads/INFOTEX_HI_Fullstack_Project (5)/HI; choose REPLACE.
4. In CMD from existing HI directory run:
   docker compose up -d --no-deps --build frontend
5. Open http://localhost:8080 and Ctrl+Shift+R.
6. Check Overview: human LEFT, robot RIGHT, handshake CENTER, live UI text.

Optional direct asset test after build:
Open http://localhost:8080/hi-human-robot-handshake-bg.webp in browser;
it must display the standalone banner artwork, not the app homepage.

IF STILL RED:
- Check that file frontend/src/hi-handshake-glass-menu.css contains
  url('./hi-human-robot-handshake-bg.webp') (not the old absolute URL).
- Check that frontend/src/hi-human-robot-handshake-bg.webp exists.
- Check build output; report any error with no API secrets.
- If needed run: docker compose build --no-cache frontend
  followed by: docker compose up -d --no-deps frontend
- Do not run docker compose down -v.

PRIVACY / PRESERVATION:
No .env or API secrets; no backend, database, chat, or navigation code changed.
No restoration of removed Project AI 'Send to Agent Team' button.
This patch addresses the hero image's packaging and source URL specifically.
