# Project report — INFOTEX Human Intelligence

## Problem and objective

A single chatbot response often lacks project context, traceable sources, collaboration and a clear execution boundary. HI groups specialized roles around a shared project and requires a human decision before proposed work becomes tasks.

## Implemented system

The application contains registration/login, dashboard, workspace/project management, intelligence studio, agent control, knowledge hub, task/milestone board, team discussion, analytics, notifications, profile/settings and an administrator overview. All persisted data is managed by C++. React renders server results and sends explicit user mutations.

Eight agent classes contribute planning, research, evidence retrieval, finance, review, memory, coordination and approved execution. The demo workflow follows a deterministic sequence and labels that limitation visibly. Live mode replaces content-generation and embedding strategies while preserving access controls and the approval boundary.

## Event demonstration

For 300 participants and ₹50,000, the deterministic allocator uses integer paise:

| Category | Allocation |
|---|---:|
| Venue & permissions | ₹10,000 |
| Refreshments | ₹15,000 |
| AV & equipment | ₹8,000 |
| Materials & signage | ₹4,000 |
| Speakers & travel | ₹5,000 |
| Prizes & recognition | ₹3,000 |
| Contingency | ₹5,000 |
| Total | ₹50,000 |

Available budget per participant is ₹166.66 rounded down to paise. This is an illustrative allocation, not a market feasibility finding. Venue capacity, quotations and resource commitments require human evidence.

The proposal is recorded before approval. Approval creates six application tasks and a decision history entry in one transaction. Reject/change-request paths create no execution tasks. Duplicate approval is rejected. A reviewer must hold owner/admin membership in that workspace.

## Validation and findings

C++ compilation and unit tests, API integration checks, the frontend production build and 13 frontend tests passed in the authoring environment. Tests include SQL-metacharacter handling, authentication, role restrictions, project isolation, document indexing, shared agent outputs, budget arithmetic, cyclic dependency rejection and duplicate approval handling. Public pages were inspected in a real browser and signed-in views tested against mocked API responses; authenticated browser end-to-end testing remains pending; PostgreSQL/Docker runtime and credentialed live AI remain unverified. See TESTING.md for exact scope.

## Engineering trade-offs

SQLite makes development reproducible; PostgreSQL is available through the same parameterized adapter. A balanced exact vector index and project/model cache accelerate repeated retrieval without changing cosine ranking. High-dimensional performance remains workload-dependent and unbenchmarked. Optional provider SSE streams partial JSON to the backend; polling exposes draft summaries while completed output still requires validation. The initial modular backend still centralizes application route dispatch in Service; further growth should split that class into domain services. The React application has reusable UI/auth/API modules but a large central workspace view, suitable for future route-level decomposition.

The implementation deliberately avoids claiming production readiness, verified web evidence, vendor prices or external autonomous actions. It is a functional, extensible portfolio/academic product prototype with explicit security and validation boundaries.
