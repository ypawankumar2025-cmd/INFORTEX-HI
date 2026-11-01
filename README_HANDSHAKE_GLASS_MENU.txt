INFOTEX HI — HUMAN/ROBOT HANDSHAKE + ACTIVE GLASS MENU (v5)
===============================================================
UPDATED DESIGN
- Dashboard: dark cinematic banner with human LEFT, robot RIGHT, handshake CENTER.
- The badge, headline and Open Intelligence Studio button remain real clickable React UI.
- Every navigation item is a frosted blue glass tile.
- Hover, keyboard focus, and the CURRENTLY SELECTED menu item glow blue/red.
- Navigation highlight moves to whichever page the user selects automatically.
- Cobalt blue #255DCE, midnight navy #021861, bright red #DE1110.
- Existing pages, AI chats, tasks, roles, and backend code remain unchanged.

REQUIRES
Previous Glass Everywhere v4 patch already installed on working HI frontend.
(The screenshot supplied by the user shows this is the current setup.)

INSTALL
1. Backup your current working HI folder.
2. Extract ZIP.
3. Copy the extracted frontend folder into existing
   Downloads\INFOTEX_HI_Fullstack_Project (5)\HI\
   Choose Replace the files in the destination.
4. In CMD opened at the existing HI folder run:
   docker compose up -d --no-deps --build frontend
5. Open http://localhost:8080 and press Ctrl+Shift+R.
6. On Overview, confirm the handshake hero. Click Workspace, AI Chat,
   Project AI: the glass highlight should move to the clicked page.

FILES
frontend/src/main.tsx (imports new stylesheet last; logic unchanged)
frontend/src/hi-handshake-glass-menu.css (visual effects and responsive styles)
frontend/public/hi-human-robot-handshake-bg.webp (standalone decorative banner)

SAFETY
No .env, API keys, Docker database, or backend files in this ZIP.
Project AI Send to Agent Team removal is preserved (no App.tsx included).

ROLLBACK
Remove import of './hi-handshake-glass-menu.css' from main.tsx or restore
previous main.tsx from your backup. No data migration needed.

VALIDATION
CSS parsed with tinycss2. Imported image path and main.tsx import verified.
Full npm/Vite build not run in this environment; use your Docker frontend build.
