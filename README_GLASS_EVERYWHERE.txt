INFOTEX HI — CINEMATIC GLASS EVERYWHERE (v4)
================================================
Visual direction: midnight navy #021861 / cobalt #255DCE / bright red #DE1110.

This update makes the entire existing INFOTEX HI interface glass-like:
- EVERY sidebar navigation item (Overview, Workspace, Project Details, Intelligence Studio,
  AI Chat, Project AI, Agent Control, Knowledge Hub, Tasks, Team, Analytics, Notifications)
- Workspace selector, dashboard cards, project cards, activity cards, stats
- Intelligence Studio composer, agent panels, research results, review boxes
- Normal AI Chat + Project AI chats, bubbles, conversation history, composer
- Tasks, milestones, kanban, tables, analytics, knowledge hub, team collaboration,
  notifications, modal dialogs, login and landing cards
- Blue frosted panels with thin icy borders, red edge glints, gentle ambient depth
- Dashboard retains original blue flower / red background botanical artwork

WHAT THIS PATCH DOES NOT CHANGE
- Backend C++ source, API provider, Docker configuration, database, .env and credentials
- React application logic, authentication, project/chat data or agent controls
- Project AI "Send to Agent Team" remains REMOVED if it was already removed locally
- It is NOT a screenshot; these are real CSS files for the actual running site.

INSTALL — WINDOWS
1. Make a backup of your currently working HI project folder.
2. Download ZIP, right-click -> Extract All.
3. Copy the "frontend" folder from extracted ZIP into your existing:
   Downloads\INFOTEX_HI_Fullstack_Project (5)\HI\
   Choose "Replace the files in the destination" when asked.
4. Do NOT replace .env, backend, docker-compose.yml, or delete any database volume.
5. In a CMD at the EXISTING HI folder run:
      docker compose up -d --no-deps --build frontend
6. On success, open http://localhost:8080 and press Ctrl+Shift+R.
7. Visit Overview, Workspace, Intelligence Studio, AI Chat, Project AI, Tasks
   to confirm that styles render and existing workflows still behave normally.

FILES INCLUDED
frontend/src/main.tsx
    Imports existing styles, Blue Bloom base, previous motion layer, then new v4
    glass-everywhere layer last. Logic unchanged.
frontend/src/blue-bloom-cinema.css
frontend/src/blue-bloom-glass-motion.css
frontend/src/hi-cinematic-glass-everywhere.css
frontend/public/hi-blue-bloom.svg

ROLLBACK
Restore your old frontend/src/main.tsx from the backup. The new CSS file can
remain unused; removing its import disables this v4 glass layer. Alternatively,
restore all five files from your backup.

VALIDATION
- CSS parse: passed; declaration errors: none.
- Asset import/path checks: passed.
- Full local frontend compilation: NOT verified in our environment because an
  npm dependency (xmlchars 2.2.0) was unavailable in the local cache.
  Run the Docker frontend build above on the user's computer to verify.

CAUTION: Protect .env and API keys. Do not upload an archive containing secrets
or Docker database data to public GitHub.
