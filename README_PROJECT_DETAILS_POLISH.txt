INFOTEX HI — PROJECT DETAILS UI POLISH (Theme Studio compatible)

What changes:
- ONLY Project Details page style; existing functional logic unchanged.
- Balanced statistics cards (2x2 on common laptop widths), better text contrast.
- Clean Delivery Progress status rows and readable Project Memory panel.
- Responsive panel stacking on smaller screens, scrollable Recent Intelligence table.
- Works with all five Theme Studio themes.
- The counts (0%, 0 documents etc.) reflect project data; this patch does not change data.

Install on Windows:
1. Make a full backup copy of your currently working HI folder.
2. Extract this ZIP.
3. Copy the extracted 'frontend' folder into your existing HI folder; accept Replace.
4. In CMD inside HI run:
     docker compose up -d --no-deps --build frontend
5. Open http://localhost:8080 and press Ctrl+Shift+R.
6. Open Project details, and test both Blue Glass and one other theme.

Rollback:
- Restore frontend/src/App.tsx and frontend/src/main.tsx from your backup.
- The new frontend/src/hi-project-details-polish.css can be deleted.
- Rebuild the frontend with the same docker compose command.

Backend/database/API keys are not included or modified.
This ZIP is an incremental patch: apply AFTER the existing 5-theme Theme Studio update.
