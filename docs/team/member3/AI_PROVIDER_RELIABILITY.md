# Member 3 — C++ AI provider reliability review

## Scope and boundaries

This package builds on the existing local commits (`ed2edeb`, `4692f9c`) on
`feature/member3-cpp-backend`. It adds 11 discrete changes to the provider,
stream decoder, C++ regression tests and disposable HTTPS transport fixture.
It does **not** edit frontend, SQL schema, production credentials or Docker Compose.

## Request and response flow

`OpenAICompatibleProvider::post()` sends requests through libcurl over HTTPS,
with a 10s connect timeout and 120s overall timeout. Redirect following is
disabled and response bodies are capped at 2 MiB. `complete()` asks for a
structured JSON object, checks the `choices[0].message.content` envelope and
limits decoded completion text to 200,000 bytes. Streaming uses
`CompletionStream` (SSE frames, `[DONE]`, bounded progress output) before the
same structured JSON validation. Embeddings validate `data[0].embedding`
shape, numeric elements, dimension bound (8192) and finiteness.

## Failure mapping

- Malformed provider JSON, malformed envelopes and embedding payloads => HTTP 502.
- Provider HTTP non-2xx => HTTP 502 (with provider status in diagnostic text).
- libcurl network/protocol/certificate failures => HTTP 502.
- libcurl timeout => HTTP 504.
- Bad *client* JSON is still handled at API boundary as HTTP 400.
- Invalid SSE frames/choices/deltas, duplicate `[DONE]` => HTTP 502.

## Verification before sharing/merging

1. From the repository root, inspect `git diff`, the 11 patches and staged files.
2. Build C++ and run CTest using `docker build --target build -f backend/Dockerfile -t infortex-hi-backend-tests .`.
3. Run `scripts/test-provider-transport.py` *in a disposable Docker container*
   with Python 3 and OpenSSL installed; it uses a loopback HTTPS fixture and
   fake keys, never a live vendor. This fixture checks streaming and non-streaming
   malformed outputs and transport failures. The CI build stage itself invokes
   `ctest --test-dir build --output-on-failure`.
4. Verify `git log --oneline -13`, `git status --short`, and the PR checks.
5. Review provider error messages before exposing them in a public API:
   do not leak credentials, URLs with secrets, or internal diagnostics.

## Known limitations

- Tests here cover `Error.status` in C++ on selected fixture paths, not every
  deployed HTTP endpoint status code. A dedicated API-level 502 test is a
  sensible follow-up.
- No third-party LLM vendor is contacted; real rate limiting and availability
  require separate staging validation with approved credentials.
- A green Docker compile/test on the user's machine is required before pushing;
  this package was prepared from a source archive, not the user's live Git repo.
- These changes are proposed contributions, not evidence of historical weekly
  activity. The person committing should review and take responsibility for them.
