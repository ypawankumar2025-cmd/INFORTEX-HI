# INFORTEX-HI

“Where human thinking leads, technology follows — HI — Human Intelligence by Infortex.”

## Local website quick start

The local demo uses Docker Desktop, a C++ backend, React/nginx and PostgreSQL.
The project is not automatically published to a public website by GitHub.

```cmd
docker compose up --build -d --wait
```

If `.env` does not exist, first create it locally with `python scripts\setup.py`.
Do not commit `.env` or copy secrets into issues or chat messages.
Open **http://localhost:8080**, then run the read-only smoke check:

```cmd
python scripts\check_service_health.py
```

For architecture, safe shutdown, troubleshooting and release acceptance, read
[Leader integration runbook](docs/LEADER_RUNBOOK.md) and
[Testing](docs/TESTING.md). For public deployment, review
[Deployment guidance](docs/DEPLOYMENT.md) first.

## Database Setup and Verification

The INFORTEX-HI project uses PostgreSQL with Docker Compose.

### Prerequisites

- Docker Desktop with Docker Compose
- Python 3
- Project repository cloned locally

Run the following commands from the project root directory.

### 1. Start PostgreSQL

```cmd
docker compose up -d db
```
For a fresh database, start the backend with PostgreSQL configured
to initialize `database/schema.sql` before running verification.
Starting the PostgreSQL container alone does not create the
application tables.

### 2. Verify Database Migrations

```cmd
python scripts\verify_migrations.py
```

This script compares local SQL migration versions with the
versions recorded in PostgreSQL's schema_migrations table.

### 3. Verify Database Indexes

```cmd
python scripts\verify_database_indexes.py
```

This script checks the required notification and comment
indexes, including their B-tree definitions, column order,
validity, and readiness.

### 4. Run Automated Database Tests

```cmd
python -m unittest discover -s scripts -p "test_*.py"
```

The test suite covers migration consistency, index
definitions, database verification, and error handling.

### Migration Notes

- Migration SQL files are stored in database/migrations/.
- database/schema.sql defines the initial database schema.
- Verification scripts are read-only and do not apply migrations.
- Existing databases may require migration SQL files to be
  applied separately before verification.
- Review and back up production databases before applying
  schema changes.

### Troubleshooting

If verification cannot connect to PostgreSQL, check
whether Docker Desktop and the database container are running.

If a migration or index verification fails, inspect the
reported mismatch before changing the database.
