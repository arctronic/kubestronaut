# Kubestronaut Academy: agent guide

Study platform for the Kubestronaut certifications (KCNA first). Next.js App Router with **static export**:
every lesson, quiz and mock exam is pre-rendered HTML. Learner progress lives only in the browser
(localStorage). Live at https://k8s.tronics.dev, deployed by Easypanel from the `Dockerfile` on every push to `main`.

## Commands

| Command | What it does |
|---|---|
| `npm install` | install dependencies (Node 20+) |
| `npm run dev` | dev server on http://localhost:3000 |
| `npm run validate` | content checker (schema, answers, sources, diagram geometry, icons, no emojis) |
| `node tools/visual-audit.js kcna [--chapter=<id>]` | lists text-heavy slides and diagram gaps |
| `npm run build` | static export to `out/` |
| `npm test` | validator + Playwright end-to-end test of `out/` (run `npm run build` first) |

## Where things live

```
exams/registry.js                 the 5 exams of the path
exams/kcna/exam.js                blueprint: domains + weights, chapter list, mock config, exam guide, library
exams/kcna/chapters/NN-*.js       lesson content: slides, summary, glossary, quiz
exams/kcna/mock-bank-*.js         mock exam questions
app/                              routes; pages read content at build time via lib/content.js
components/Blocks.jsx             renderer for every slide block type (diagram, flow, layers, ...)
components/Icon.jsx               allowed icon names (Lucide, kebab-case)
lib/store.js                      localStorage progress store
CONTENT_GUIDE.md                  full schema for chapters, questions and slide blocks
docs/prompts/                     ready-made task briefs
```

Content files are plain scripts: `KS.registerChapter('kcna', { ... })`. They are data, not modules.

## Hard rules

1. **Accuracy first.** Only state facts backed by official docs (kubernetes.io, CNCF, project docs).
   Leave out version numbers, dates or maturity levels you are not sure of.
2. **Every question has a `ref`** (official source URL). Do not change questions, answers, explanations or
   refs unless the task asks for it.
3. **No emojis anywhere.** Icons are Lucide names from `components/Icon.jsx` (e.g. `database`, `shield`).
4. **Don't change the slide renderer or app code for a content task.** Use the existing block types.
   No new dependencies.
5. **JS string safety:** use backtick template literals for multi-line `code`, with no backticks or `${`
   inside them. Escape apostrophes in single-quoted strings or use the typographic ’.
6. **Before committing:** `npm run validate` (0 errors), `npm run build`, `npm test`.
7. **Commits:** a single line of at most 80 characters, imperative mood, **no `Co-Authored-By` or any
   other trailer**, no tool attribution. Enforced by `.githooks/commit-msg`
   (`git config core.hooksPath .githooks`).

## Git
- `main` is production: every push to `main` deploys https://k8s.tronics.dev (Easypanel, `Dockerfile`).
- Work on a short-lived branch named `feat/<topic>`, `fix/<topic>`, `content/<topic>` or `docs/<topic>`,
  one topic per branch, then merge into `main` once `npm run validate`, `npm run build` and `npm test` pass.
- Never force-push, rebase or rewrite history on `main`, and never delete it. Fix mistakes with a new commit
  (`git revert`). The `pre-push` hook blocks non fast-forward pushes to `main` and runs the validator.
- Keep commits small and focused: one logical change per commit, content and code changes separate.
- Never commit secrets (`.env`, tokens, keys) or generated files (`node_modules/`, `.next/`, `out/`).
- Pull before you start (`git pull --ff-only`) so `main` stays linear.
- Enable the hooks once per clone: `git config core.hooksPath .githooks`.

## Design language

Course-platform look (light, white cards, blue `#0056d2` primary), dark mode supported. Colors in content
are names: `blue, teal, green, amber, red, purple, pink, gray`. See `docs/prompts/visual-enrichment.md` for
the diagram conventions.
