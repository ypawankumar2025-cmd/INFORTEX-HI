# Verification record

## Executed checks

| Check | Result / scope |
|---|---|
| C++20 backend build | Passed with g++ 13.3 / CMake 3.28 on Linux. SQLite and PostgreSQL adapter compiled. |
| C++ unit tests | Budget bounds and paise totals, vector similarity, eight-agent factory, deterministic output validation, text extraction, prepared SQL, transaction rollback, byte-fragmented SSE with UTF-8, incomplete/error stream rejection and search URL filtering. |
| API integration suite | 106 checks in the latest run, including actual text-PDF and DOCX extraction. The exact count includes polling assertions and can vary with runtime timing. |
| Restart persistence | Runner restarts the backend against the same temporary SQLite database and verifies seven tasks and the approved decision survive. |
| Frontend typecheck and production build | Passed using TypeScript and Vite. |
| Frontend unit tests | Thirteen Vitest tests passed: eight API/presentation tests plus five workspace component tests covering 13 signed-in navigation views, project creation, structured event constraints, approval permissions, and request error handling. Component tests use an explicitly mocked API; they do not replace browser end-to-end tests. |

The integrated event test verifies seven pre-review agent executions and seven shared messages, retrieved evidence, ₹45,000 allocated plus ₹5,000 reserve, no premature task creation, six approved tasks and rejection of repeat approval. Additional tests exercise user/project isolation, viewer/member restrictions, invitation ownership/single-use, notifications, dependency cycles, prerequisite completion, disabled agents, changes requested and SQL-metacharacter data. The extended suite also tests invalid calendar dates, duplicate prerequisites, a larger base64 document, and a multibyte currency character at a conversation-title truncation boundary.

## Explicitly unverified

- Authenticated browser end-to-end and mobile layout QA remain pending. On the follow-up pass, the landing page rendered correctly in the real browser and registration/login navigation was verified. The earlier blank-preview symptom did not reproduce. No user credentials were entered.
- Docker Compose image builds and PostgreSQL runtime: Docker was unavailable in the authoring environment. The adapter compiled, but the passing integration database was SQLite.
- Credentialed live model/embedding, SSE and Brave search calls: no API key was supplied. Live integration exists and errors are handled; a real provider response was not tested.
- Load, adversarial penetration, accessibility audit, mobile browser testing and production disaster recovery.

These limits are material. This release is a functional local product prototype, not a fully audited production deployment.

## Reproduce

From the HI root after installing dependencies:

```bash
cmake -S backend -B build -DCMAKE_BUILD_TYPE=Debug
cmake --build build -j2
ctest --test-dir build --output-on-failure
python3 scripts/run-local-tests.py
cd frontend
npm ci
npm test
npm run build
```

`run-local-tests.py` uses temporary data and cleans up. `integration_test.py` alone targets HI_TEST_URL, creates records and should only be used with a disposable test server. The unit target keeps assertions enabled in Release builds.

## Manual acceptance checklist for the target machine

1. Start the complete app and register without a shared demo password.
2. Create a workspace/project and verify it survives restart.
3. Upload a text PDF/DOCX/TXT, search it and inspect named source excerpts.
4. Run the event example and inspect recorded agent activity and proposal.
5. Approve once, verify task creation, and confirm a repeat review is rejected.
6. Use a second account to test invitations and member/viewer permissions.
7. Change a task’s assignee, deadline, status and prerequisite; inspect metrics.
8. Check every navigation item on desktop and a narrow viewport.
9. For live mode, supply an account-supported model and embedding configuration, then verify a successful request and a provider failure.

### PostgreSQL reproduction

Run `python3 scripts/test-compose.py` with Docker Compose installed. The script isolates credentials, ports, project name and volumes, then runs integration tests and checks seven persisted tasks after restart. Syntax validation passed; actual Docker execution remains unverified here.

## HTTPS provider transport fixture

Run `python3 scripts/test-provider-transport.py` after building. The runner generates a temporary local TLS certificate and tests the real C++ libcurl provider against a loopback HTTPS server. It covers normal and fragmented SSE completions, embeddings, malformed completion JSON, missing stream termination, stream errors, empty embeddings, HTTP authentication failure and rejection of an untrusted TLS certificate. All credentials and output are synthetic; these checks do not establish real vendor connectivity or model quality.

## Continuous verification

The included `.github/workflows/verify.yml` runs C++/SQLite tests, the HTTPS fixture, frontend tests/build, and isolated Docker/PostgreSQL tests on a GitHub runner. Put the **contents of HI** at the repository root. The workflow has not been executed remotely in this environment; adding a workflow is not a passing CI result.

Latest follow-up verification: all nine HTTPS transport fixture cases passed. The actual C++ service also passed a live-mode fixture workflow covering uploaded-document embeddings/retrieval, all seven planning agents, observed persisted draft output, no tasks before approval, task creation after approval, and malformed-provider failure without extra task creation. This is an HTTP API workflow, not authenticated browser QA or a real vendor call. The 96-check SQLite integration suite and restart persistence passed again.

Latest requirements-audit follow-up: 98 API checks and restart persistence passed. C++ core tests include structured-plan validation; live-mode HTTPS fixture tests additionally verify prior-turn context, rejection of forged caller context, independent conversation isolation, task priorities, dependency edges and milestone persistence after approval. Frontend production build and all 13 tests passed after the review UI changes. Real vendor calls, Docker/PostgreSQL execution and authenticated browser QA remain pending.

Latest routing/index verification: C++ unit tests compare indexed top-five results against brute-force cosine rankings across 20 seven-dimensional queries over 80 vectors, and check zero-vector/dimension/tie boundaries. Router tests reject unsafe agent selection and preserve mandatory constraints. The HTTPS fixture verifies model-selected specialist subsets; API tests verify upload/delete cache refresh and project isolation. Final API run passed 106 checks (polling-dependent count), restart persistence passed, frontend build and 13 tests passed. No vector throughput or high-dimensional scaling claim is made. Docker/PostgreSQL, real credentials, Windows and authenticated browser/mobile acceptance remain unexecuted.
