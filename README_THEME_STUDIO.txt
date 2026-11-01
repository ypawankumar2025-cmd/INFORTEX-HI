INFOTEX HI -- THEME STUDIO (FIVE THEMES)
=======================================

WHAT IT DOES
------------
Adds a functional 'Themes' menu item to your existing INFOTEX HI React app.
On first open, the default design is ORIGINAL BLUE GLASS (handshake image,
navy/cobalt/red, glass navigation). Users can choose one of four additional
full-page looks: Chocolate Atelier, Cobalt Noir, Sunshine Scrapbook, and
Sage & Amber. Theme selection applies instantly to the page and is remembered
in the same browser via localStorage key 'infotex-hi-theme-v1'.

THEME COLORS
------------
Original Blue Glass:  #021861 / #255DCE / #DE1110  (DEFAULT)
Chocolate Atelier:   #4E342E / #CC5500 / #F8F4E7
Cobalt Noir:         #000000 / #2C3480 / #FFFFFF
Sunshine Scrapbook:  #B7D8F5 / #E10600 / #FFD700
Sage & Amber:        #9CAF88 / #A7A7A7 / #CC5500

IMPORTANT: These preferences are stored in the browser, not synced to other
devices/accounts. This release does not add any database tables or API calls.

INSTALLATION (Windows)
----------------------
1. STOP: Copy your CURRENT ENTIRE HI folder to an independent backup first.
   You can name it HI_BACKUP_BEFORE_THEME_STUDIO. Do not delete the working HI.
   IMPORTANT: Do not publish your private .env file or backups online.
2. Extract this ZIP using 'Extract All'.
3. Copy the extracted 'frontend' folder INTO your existing working 'HI' folder
   in Downloads. Select 'Replace the files in the destination' when asked.
   Do not replace your entire HI directory with this patch.
4. Open CMD in your existing HI folder and run:
       docker compose up -d --no-deps --build frontend
5. Once frontend is built and running, open http://localhost:8080 and perform
   Ctrl+Shift+R to force reload.
6. Click 'Themes' in the sidebar. Click each card to select instantly.
   Use 'Restore original blue' to revert the design without rebuilding.

REVERT BACK TO YOUR EARLIER WEBSITE CODE
---------------------------------------
If the new code has problems, restore the ENTIRE 'frontend' directory from
HI_BACKUP_BEFORE_THEME_STUDIO (not from the old standalone diagnostic patch),
then run:
       docker compose up -d --no-deps --build frontend
Don't run 'docker compose down -v' (removes database volumes).

PRESERVATION
------------
This ZIP changes FRONTEND only (React/CSS/theme images and Dockerfile).
It does not change C++ backend, PostgreSQL schema, API keys, .env, AI provider,
Normal AI Chat backend, Project AI API, or any database volumes. The Project AI
'Send to Agent Team' button remains absent in the bundled frontend.

SOURCE VALIDATION
-----------------
React/TypeScript syntax checked with the TypeScript transpiler.
CSS tokenization/stylesheet parsing checked with tinycss2.
Bundled image/stylesheet and ZIP contents validated.
Full npm/Vite/Docker build not verified here due to missing npm dependency
packages in the test environment; run the Docker command above on your laptop.
