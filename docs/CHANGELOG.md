# Verification update — 2026-10-30

- Confirmed real-browser rendering of the landing page and registration/login navigation.
- Added five React component tests: 13 signed-in views, create-project flow, event request/approval interaction, member restrictions and API error display. They use an explicit mocked API.
- Improved the navigation accessible name by hiding a decorative HI badge from assistive technology.
- Reject impossible calendar dates and duplicate task prerequisites with client errors.
- Preserve UTF-8 character boundaries when shortening conversation titles and agent excerpts.
- Added larger-document upload and multibyte text regression coverage.
- Passed clean C++ build, core tests, 94 API checks, restart persistence, TypeScript production build and 11 frontend tests.
- Remaining: authenticated browser end-to-end/mobile QA, Docker/PostgreSQL runtime and credentialed live provider testing.

## Optional provider streaming and web research

- Added bounded incremental SSE decoding, partial draft persistence and safe UI summary rendering.
- Added explicit per-run Brave search query opt-in, server-only credentials and linked excerpts.
- Added stream/search boundary unit coverage and API rejection checks; frontend suite now has 13 tests.
- Added isolated Docker/PostgreSQL verification runner; actual Docker and credentialed provider verification still require the target environment.

## Provider transport verification and startup reliability

- Added actual libcurl HTTPS fixture tests, including streamed JSON, embeddings, HTTP failures and TLS certificate rejection.
- Added a full live-mode backend workflow against the fixture, including drafts, retrieval, seven agents, approval and failure isolation.
- Added native custom CA-bundle configuration without disabling TLS verification.
- Windows launcher now waits for Compose health and opens the configured app origin. PowerShell execution remains to be verified on Windows.
- Added CI workflow for C++/SQLite, transport fixtures, frontend and Docker/PostgreSQL; remote CI execution is pending.

## Conversation continuity correction and requirements audit

- Fixed follow-up runs not receiving explicit preceding conversation turns.
- Added bounded server-side history snapshots, project context, review status, and rejection of caller-forged context.
- Added live-mode fixture checks for follow-up continuity and independent-conversation isolation.
- Added REQUIREMENTS_AUDIT.md identifying implemented behavior, architectural deviations and unexecuted acceptance checks without assigning an unsupported completion percentage.

- Added structured AI proposal milestones, priorities, deadlines and dependency indices, including review UI and atomic approval persistence.
- Added validation rejecting cyclic/forward dependencies and integration coverage for persisted live-fixture plans.

## Dynamic routing and indexed retrieval

- Added model-directed specialist selection with strict agent allowlist, mandatory review/evidence stages, disabled-agent checks and visible routing rationale.
- Added deterministic demo routing without pretending it is model reasoning.
- Replaced repeated vector parsing/scoring with a cached, balanced exact C++ vector index, scoped by project and embedding model.
- Added brute-force ranking equivalence, invalid route rejection, subset-routing fixture and cache refresh/isolation tests.
