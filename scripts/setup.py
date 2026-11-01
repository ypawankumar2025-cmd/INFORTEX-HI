#!/usr/bin/env python3
"""Creates a local configuration without overwriting an existing one."""
from pathlib import Path
import secrets
root=Path(__file__).resolve().parent.parent
path=root/'.env'
if path.exists():
    print('Existing .env retained.')
else:
    path.write_text((root/'.env.example').read_text().replace('DB_PASSWORD=CHANGE_ME','DB_PASSWORD='+secrets.token_hex(24)))
    path.chmod(0o600)
    print('Created .env with a random database password. No AI key is required for demo mode.')
print('Next: docker compose up --build -d')
print('Then open http://localhost:8080 and register your own account.')
