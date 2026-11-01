

\# INFOTEX HI — Frontend Testing Guide



\## Overview



The INFOTEX HI frontend uses React, TypeScript, Vite,

Vitest, and React Testing Library.



The frontend test suite currently contains 34 tests

across 6 test files.



\## Run Automated Tests



From the repository root on Windows:



```cmd

docker run --rm -v "%cd%\\frontend:/app" -w /app node:22-alpine sh -c "npm ci \&\& npm test -- --run"

```



Expected result for the current baseline:



\- Test files: 6 passed

\- Tests: 34 passed



\## Verify Production Build



```cmd

docker run --rm -v "%cd%\\frontend:/app" -w /app node:22-alpine sh -c "npm ci \&\& npm run build"

```



This checks TypeScript compilation and creates a Vite

production build.



\## Test Coverage



The automated tests cover:



\- API service behavior with mocked dependencies

\- Rendering of signed-in navigation views

\- Theme selection, persistence, and restoration

\- Markdown paragraphs, lists, and tables

\- HTTPS link rendering and unsafe URL handling

\- HTML injection regression cases

\- Code block rendering and HTML escaping

\- Clipboard success and failure feedback

\- Clipboard feedback reset after text updates

\- Exact multiline C++ code copying



\## Security Notes



AI-generated content is rendered as React elements.

Tests verify that selected unsafe HTML payloads do not

become executable DOM elements.



These tests do not replace a complete security audit,

penetration test, or backend authorization review.



Never commit real API keys, passwords, private keys,

or populated .env files.



\## Contribution Workflow



Before submitting frontend changes:



1\. Run the automated tests.

2\. Verify the production build.

3\. Review the changed files.

4\. Run `git diff --cached --check`.

5\. Commit to a feature branch.

6\. Open a pull request for team review.



\## Important



Passing mocked frontend tests does not guarantee that

external AI providers, the backend, or production

deployment will work correctly.



Integration and manual testing are also required.
