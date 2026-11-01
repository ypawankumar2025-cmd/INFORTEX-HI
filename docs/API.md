# REST API

Base URL: `/api`. JSON request and response bodies. Authentication uses `hi_session` cookie. Include `X-HI-Request: 1` for all mutations. Browser Origin must match the configured `APP_ORIGIN`. No token is stored in localStorage.

Database row values (including counts and timestamps) are returned as strings. Computed values, flags and structured proposals use native JSON types. Timestamps are Unix seconds. Errors use `{ "error": "description" }`.

| Method | Path | Behavior |
|---|---|---|
| GET | `/health` | Mode and embedding model; public |
| POST | `/auth/register` | name, email, password (12–128 chars); creates personal workspace |
| POST | `/auth/login` | email, password; sets session cookie |
| POST | `/auth/logout` | Revokes current session |
| GET/PATCH | `/me` | Profile; PATCH name |
| POST | `/password` | current_password, new_password; revokes all sessions |
| GET/POST | `/workspaces` | List memberships / create with name |
| PATCH | `/workspaces/:w` | Rename; owner/admin |
| GET/POST | `/workspaces/:w/projects` | List/create projects with name, description |
| GET | `/workspaces/:w/members` | Member directory |
| PATCH | `/workspaces/:w/members/:u` | role: admin/member/viewer; protects owner/self |
| POST | `/workspaces/:w/invitations` | email, role; returns one-time invite token, no email delivery |
| POST | `/invitations/accept` | token; email-bound, single-use, expires after 7 days |
| GET | `/workspaces/:w/activity` | Last 100 audit entries |
| GET | `/workspaces/:w/analytics` | Actual task/run counts and agent timings/errors |
| GET | `/workspaces/:w/agents` | Registry + workspace configuration |
| PATCH | `/workspaces/:w/agents/:agent` | enabled boolean, instructions; owner/admin |
| GET/PATCH | `/projects/:p` | Read/edit name and description |
| GET/POST | `/projects/:p/tasks` | List/create tasks |
| PATCH/DELETE | `/projects/:p/tasks/:t` | Update/delete project task |
| GET/POST | `/projects/:p/milestones` | List/create title, deadline |
| PATCH | `/projects/:p/milestones/:m` | status open/done |
| GET/POST | `/projects/:p/runs` | List/start agent workflows |
| GET | `/runs/:r` | Proposal, execution rows, shared messages, approval |
| POST | `/runs/:r/review` | status approved/rejected/changes_requested, feedback |
| GET/POST | `/projects/:p/documents` | Metadata / filename + base64 upload |
| DELETE | `/projects/:p/documents/:d` | Remove document and vector chunks |
| POST | `/projects/:p/search` | query; returns results and embedding model |
| GET | `/projects/:p/memories` | Last 100 project memories |
| GET/POST | `/projects/:p/comments` | List/post content |
| GET | `/projects/:p/conversations` | List conversation IDs |
| GET | `/conversations/:c/messages` | Stored conversation messages |
| GET | `/notifications` | Current user’s last 100 notifications |
| PATCH | `/notifications/:n` | Mark own notification as read |
| GET | `/admin` | Account inventory and aggregate counts; platform admin |

## Task create body

```json
{"title":"Confirm venue","description":"Check capacity","status":"backlog","priority":"high","assignee":"","deadline":"2026-12-01","dependencies":[]}
```

Statuses: backlog, in_progress, review, done. Priorities: low, medium, high. Assignee must be a workspace member. Dependencies must belong to the same project and be acyclic. Completion requires prerequisites to be done. PATCH merges omitted task fields.

## Agent request body

```json
{"prompt":"Organize a technical event for 300 students with a budget of ₹50,000.","agent":"multi","event":true,"budget":50000,"people":300}
```

Optional `conversation_id` must belong to the same project. Agent can be `multi` or a registry ID other than execution. Event constraints are explicit integers; budget is INR rupees. The UI’s example fills these structured fields. Free text alone is not silently treated as authoritative numeric budget input.

Runs move queued → running → awaiting_review → approved/rejected/changes_requested. Failure moves to failed. Review is one-time. Repeated decisions return 409. Change requests are saved; use Refine to submit the amended prompt as a new run in the same conversation.

## Limits and error semantics

- API JSON body: 3,000,000 bytes; frontend file limit: 2,000,000 bytes.
- Extracted document text: 120,000 bytes; up to 50 documents per project.
- Prompt: 6,000 bytes; feedback: 2,000; comments: 3,000.
- Two active runs per user; queue capacity 32; two workers.
- Rate limiter: 12 authentication requests/minute, 240 other API requests/minute per remote address. Restart resets limits; use a dedicated production edge limiter for public hosting.
- 400 invalid input; 401 login needed; 403 role/origin/header denied; 404 unavailable resource/membership; 409 state conflict; 413 request too large; 429 rate/capacity; 500 internal failure.

Optional provider SSE streaming (`LLM_STREAMING=true`) persists partial output at most four times per second. The UI polls stage progress and draft summaries every 1.2 seconds; deterministic demo stages may complete before the next poll. Live provider failure is surfaced on the run and does not fall back silently.

Optional run body fields: `web_research: true` and `search_query: "public query"`. Requires live mode and `BRAVE_SEARCH_API_KEY`; otherwise returns 409. Non-boolean flags return 400. Results appear in `proposal.web_sources` as title, URL and snippet. Health includes configuration flags `web_research` and `streaming`; these indicate configuration, not a successful upstream connectivity test.

Follow-up runs with a valid `conversation_id` now receive server-built context from up to six completed prior turns in that same project/conversation. Each includes a bounded prompt, summary and review status. Project name/description are also supplied. Caller-supplied `conversation_history` or `project_context` fields are replaced with authorized database values; a new conversation starts with empty turn history.

Agent output may include `milestones` (up to 20 nonempty title strings, max 200 bytes each) and `task_plan` (one object for each task title). Task-plan entries support `priority` (`low`, `medium`, `high`), optional `deadline` (valid YYYY-MM-DD or empty), and `depends_on` (unique zero-based indices of earlier tasks). Requiring earlier prerequisites prevents cycles. Completed proposals retain this metadata; approval validates it again and creates tasks, dependency edges and milestones in one transaction. Missing optional metadata stays backward compatible with older proposals. Demo planning adds clearly templated milestone titles; live mode requests structured planning output. No milestone date is invented.
