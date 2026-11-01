INFOTEX HI — Project AI without Agent Team button

This patch removes only the Send to Agent Team action from the Project AI page. It does not remove AI Chat, Project AI, project data, or the existing Intelligence Studio and Agent Control sections. No backend or database changes.

1. Make a backup of your existing HI folder.
2. Extract this ZIP. Copy frontend/ into the working HI folder and allow Replace.
3. In HI CMD, run: docker compose up -d --no-deps --build frontend
4. Open http://localhost:8080 and Ctrl+Shift+R.
5. Project AI now provides read-only project chat without an Agent Team button.

Existing .env and PostgreSQL data must stay untouched.
