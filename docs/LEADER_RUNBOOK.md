# INFORTEX-HI — integration leader runbook

## Responsibility boundaries

The leader owns cross-component acceptance, release coordination, architecture
consistency and documentation. Backend API implementation, frontend feature
implementation and database schema ownership remain with their respective
contributors. A leader sign-off is **not** a substitute for their code reviews.

## Zero-destructive-check local workflow

1. Keep `main` and completed pull requests unchanged. Do new work in a feature
   branch based on the current `origin/main`.
2. Run `python scripts/check_project_layout.py` to find missing entry points.
3. Run `python scripts/check_config_contract.py` to inspect `.env.example` only;
   do not paste or commit a private `.env` file.
4. Run `python scripts/check_proxy_contract.py` to compare same-origin routing.
5. Run `python -m unittest discover -s scripts -p "test_*.py"`. Negative-test
   cases may print `FAIL:` in their captured diagnostics; use unittest's final
   exit status and `OK` result.
6. With Docker available, run `python scripts/check_compose_contract.py
   --require-docker`; this inspects config and does not start containers.
7. Confirm that the branch PR's GitHub Actions checks pass before merge.

## Local website demonstration

- Ensure Docker Desktop is running; use `python scripts/setup.py` to create
  a local `.env` if missing. Keep `.env` private.
- From the project root run `docker compose up --build -d --wait`.
- Open `http://localhost:8080` and verify registration, login and navigation.
- Run `python scripts/check_service_health.py` for a read-only health check.
- Inspect `docker compose ps` and `docker compose logs backend` on errors.
- Use `docker compose down` to stop services **without removing data volumes**.
  Never use `down --volumes` on real project data without a verified backup.

## Human acceptance — before calling a release ready

- Register with a test account, then verify login/logout and session handling.
- Create a project and tasks, restart the service and confirm persistence.
- Exercise AI demo flow and verify review approval prevents duplicate actions.
- Verify a second account cannot access another workspace's private project.
- Check UI on desktop and mobile width, including slow/error server responses.
- Verify database versions and indexes on a nonproduction environment.
- Test backup and restore on an isolated database before public deployment.
- Assess public TLS, secrets storage, operational monitoring and security
  controls separately; these checks do not prove production readiness.

## PR release gate

Before merge, review **Files changed**, confirm every commit represents an
actual change, verify CI green, document manual tests and maintain one clear
rollback target (the previous known-good main commit). If deployment fails,
restore the prior approved release through your normal release mechanism;
**do not** force-push or rewrite shared `main` history. A PR merged into GitHub
does not automatically deploy a public website.
