# Project rules

## Commits
- Commit message: a single line, **80 characters max**. No body.
- **No `Co-Authored-By` or other trailers.** No tool or session attribution.
- Imperative mood, e.g. `Add CKA storage chapter`, `Fix mock timer on resume`.
- Enforced by `.githooks/commit-msg` (enable once: `git config core.hooksPath .githooks`).

## Content
- Follow `CONTENT_GUIDE.md` for chapters, questions and slide blocks.
- Every question needs a `ref` to the official source (kubernetes.io, project docs, CNCF).
- Only state facts you can back with that source. Leave out uncertain versions and dates.
- Run `npm run validate` before committing. It must report no errors.

## Code
- Plain HTML/CSS/JS, no build step, no runtime dependencies.
- Keep it working when served statically (GitHub Pages) and from `file://`.
