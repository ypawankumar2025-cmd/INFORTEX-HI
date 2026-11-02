# Deployment and operations

## Supported baseline

Single C++ backend instance, PostgreSQL 16, nginx static frontend, Docker Compose. Native development: Linux/WSL with SQLite. The attached source includes a Docker build recipe, not prebuilt container images. Docker execution was unavailable in the authoring environment, so validate on the target host before presenting it as deployed.

1. Run `python scripts/setup.py` or `Start-HI.ps1` to initialize configuration.
2. Set optional ADMIN_EMAIL before registering your admin account.
3. `docker compose up --build -d`.
4. `docker compose ps` and `docker compose logs backend` to diagnose startup.
5. Open http://localhost:8080 and create your own account.

The service is bound to host loopback by default. The database and backend have no host port exposure. This is suitable for a local demonstration. The demo can run without model-provider network access after images/dependencies are built.

## Real deployment

A TLS reverse proxy should front nginx. Set APP_ORIGIN to the exact HTTPS site origin and COOKIE_SECURE=true. Expose only the frontend through the intended ingress; keep PostgreSQL private. Store environment secrets with the host’s secret-management mechanism, not in Git. Confirm cloud/provider terms and choose appropriate retention for uploaded data.

Provision resource limits and back up the PostgreSQL volume. Example logical backup, run from the HI directory:

```bash
docker compose exec -T db pg_dump -U hi hi > hi-backup.sql
```

Protect that backup: it includes user and project records. Test restoration on a separate database. Do not delete Docker volumes during routine upgrades.

## Migrations

`database/schema.sql` is the idempotent bootstrap schema run at backend startup. It contains the initial tables and records migration versions `001`–`005` for a freshly initialized database. The separate `database/migrations/` directory currently includes versions `001`–`005`; `004` and `005` add notification-history and project-comment indexes. On an *existing* database, startup does **not** automatically execute each migration file as an upgrade framework. Back up data and review/apply needed SQL changes through your approved database change process before validation. For a running Compose database, use `python scripts/verify_migrations.py` and `python scripts/verify_database_indexes.py` to inspect recorded versions and index health. Both verification scripts are read-only. No destructive upgrade automation is included.

## Operational constraints

- Only one backend replica is supported. Startup marks unfinished runs failed; the queue is in memory.
- The shared connection is serialized. Large workloads need a connection pool and distributed job ownership.
- Vector retrieval uses an exact cached C++ k-d tree with database-backed vectors. High-dimensional performance and index memory still need capacity testing; this is not a distributed vector database.
- No email delivery, OCR, SSO/MFA, password reset email, or malware scanning is included. Optional Brave search and provider SSE streaming are implemented but credentialed calls remain unverified.
- PDF parsing invokes a resource-limited process, but stronger container isolation and parser patch management are needed for hostile public uploads.
- Demo templates are not intelligent reasoning. Live prompts are untrusted, and all outputs still need human validation.
- Live API calls require a compatible provider; HTTPS, credential, rate-limit and schema failures must be tested with that account.

## Troubleshooting

- Port 8080 busy: stop the conflicting process or change both Compose host port and APP_ORIGIN.
- Origin not permitted: use the exact URL from APP_ORIGIN, including scheme/port. `localhost` and `127.0.0.1` are different origins.
- Backend unhealthy: check `.env`, database health, schema path and logs.
- Live startup failure: AI_MODE=live requires LLM_API_KEY; no silent demo fallback occurs.
- Blank/unsupported PDF: upload a text-based unencrypted PDF or export to TXT; OCR is not included.
- Changed embedding model: re-upload documents under the new model.
- Windows binary blocked: this release runs in Docker/WSL; do not weaken application-control policy. Ask your administrator if those runtimes are restricted.
