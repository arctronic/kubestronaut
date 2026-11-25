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
- Every page needs a meaningful `title` and `description` (see `generateMetadata`).

## Code
- Next.js (App Router) with static export (`output: 'export'`): every page is pre-rendered HTML for SEO.
- Content stays in `exams/` and is read at build time by `lib/content.js`. Never fetch it at runtime.
- Learner progress lives only in localStorage (`lib/store.js`). Read it in client components after mount
  (`useStore()`), never during server rendering, so static HTML and hydration match.
- Icons: `lucide-react` via `components/Icon.jsx` (kebab-case names). No emojis anywhere in UI or content.
- Before committing: `npm run validate`, `npm run build`, `npm test`.
- Deploy: the `Dockerfile` builds the site and serves `out/` with nginx (Easypanel builds it on push).
