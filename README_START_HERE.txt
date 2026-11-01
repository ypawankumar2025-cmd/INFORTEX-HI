INFOTEX HI - SUNSHINE SCRAPBOOK UI UPDATE
----------------------------------------
User-selected screenshot direction: baby blue #B7D8F5, vivid red #E10600,
sunshine yellow #FFD700, playful editorial scrapbook/polaroid style.

What this patch changes (FRONTEND ONLY):
- frontend/src/main.tsx   - imports new theme LAST
- frontend/src/hi-sunshine-scrapbook.css - new all-pages theme
- frontend/src/App.tsx - rewrites dashboard hero VISUAL MARKUP ONLY; existing onClick navigation preserved
- frontend/src/hi-human-robot-handshake-bg.webp - bundled polaroid illustration

What it does NOT change:
- The backend, database, .env credentials, Docker Compose, AI providers,
  AI Chat, Project AI, or the Project AI removal of 'Send to Agent Team'.
- Actual implementation of project tasks, teams, or other workflows.

INSTALL (Windows):
1. Before copying, close the site and BACK UP the whole working HI folder (or at least frontend/src).
2. Extract this ZIP. Copy its 'frontend' folder into your existing .../HI folder.
   Choose 'Replace the files in the destination'. DO NOT replace the entire HI folder.
3. From Command Prompt in .../HI:
     docker compose up -d --no-deps --build frontend
4. Open http://localhost:8080 and press Ctrl+Shift+R to hard-refresh.
5. Verify Overview, sidebar active navigation, AI Chat, Project AI, Tasks, Analytics.

ROLLBACK:
- Restore the backed-up 'frontend/src/App.tsx' and 'frontend/src/main.tsx'.
- Optional: remove the added hi-sunshine-scrapbook.css and handshake webp.
- Run: docker compose up -d --no-deps --build frontend
- Old UI should return. The previously saved UI ZIP is ONLY A PATCH, not a full project backup.

Validation: CSS parsing checked; exact imported image file exists. npm ci
offline was unavailable in the authoring environment due to missing cached npm
package 'xmlchars'. A real frontend Docker build is still required on your laptop.
