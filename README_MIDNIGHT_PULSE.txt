INFOTEX HI — MIDNIGHT PULSE UI UPDATE (v1.0)
Theme: cinematic tech · midnight navy + cobalt blue + bright red

WHAT THIS CHANGES
- Recolors and polishes dashboard, sidebar, top navigation, cards,
  buttons, tables, task boards, Normal AI Chat, Project AI and login screens.
- Adds responsive styles and reduced-motion accessibility support.
- No backend code, API endpoints, database or .env changes.
- Does not add/remove any Agent Team controls.
- This update is intended to be applied ON TOP of your currently working
  HI project (including the previous Project AI Only patch).

INSTALL (WINDOWS 11)
1. BACK UP your existing HI folder first (copy it to a safe folder).
2. Extract this ZIP; it contains a frontend folder.
3. Copy that frontend folder into:
   Downloads\INFOTEX_HI_Fullstack_Project (5)\HI\
4. Confirm Replace the files in the destination when prompted.
   Only frontend/index.html and frontend/src/main.tsx have matching names.
   The new frontend/src/midnight-pulse.css file is added.
5. Do not delete, overwrite, or share your .env file; it is NOT included.
6. Open CMD in your HI folder and run:
   docker compose up -d --no-deps --build frontend
7. Open http://localhost:8080 and press Ctrl+Shift+R.
8. Confirm dashboard, Normal AI Chat, Project AI and tasks render correctly.

ROLLBACK
- Easiest: restore your backup copy of frontend/index.html and
  frontend/src/main.tsx. Optionally delete frontend/src/midnight-pulse.css.
- Or just remove the line: import "./midnight-pulse.css"; from
  frontend/src/main.tsx then rebuild the frontend.
- Do not run docker compose down -v (that would remove database volumes).

VALIDATION
- CSS parsed with 0 syntax errors using tinycss2.
- Full npm/Vite build NOT run in this environment: npm dependencies
  were unavailable. Build on your own laptop using the Docker command above.
- Theme uses built-in OS fonts, gradients and CSS; no external font files.
