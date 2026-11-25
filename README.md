# ☸️ Kubestronaut Academy

A personal study platform for the five Kubestronaut certifications: **KCNA → KCSA → CKAD → CKA → CKS**.
KCNA is fully built out. The other exams are registered and ready to be filled with content.

## What is inside (KCNA)

- **14 chapters** mapped to the official CNCF curriculum (Fundamentals 44%, Container Orchestration 28%, Application Delivery 16%, Architecture 12%)
- **Interactive slides**: clickable architecture diagrams with animated step-by-step walkthroughs, flip cards, annotated YAML, match exercises, inline knowledge checks
- **Chapter quizzes** with explanations for every answer, each linked to its official source (kubernetes.io, CNCF, project docs)
- **Mock exams**: 3 fixed + 1 random, 60 questions in 90 minutes, weighted like the real blueprint, flag and navigator, per-domain score report and full review
- **Weak-area drill** and **domain drills** built from your answer history
- **Flashcards** for every key term, plus a printable **cheat sheet**
- **Exam intel**: format, blueprint, what real candidates report, traps, exam-day checklist (with sources)
- **Library** for your own saved Claude artifacts

### Learner experience (course-platform style)

- **Dashboard**: continue-learning card, the 5-course Kubestronaut path, weekly goal with day tracker, streak, study time, accuracy, per-domain readiness and an activity feed
- **Course page**: modules → lessons → items (slides, practice quiz, optional flashcards) with completion status, plus Grades, Notes, Exam guide and Resources tabs
- **Lesson player**: collapsible outline sidebar, next/previous item, notes drawer that autosaves per lesson, resume exactly where you left off

Everything (progress, grades, attempts, notes, streaks, weekly goal, study time) is stored in your browser's
local storage. Nothing leaves the device. Use *Progress & backup* (gear icon) to export or restore it.

## Run it

No build step, no runtime dependencies.

```bash
npm start
```

Then open http://localhost:8000. Opening `index.html` directly from disk also works.

### Host it on GitHub Pages

The workflow in `.github/workflows/pages.yml` validates the content and deploys the site on every push to `main`.
Enable it once under *Settings → Pages → Source: GitHub Actions*.

## Develop

```bash
git config core.hooksPath .githooks
```

```bash
npm test
```

The hook enforces the commit rules in [CLAUDE.md](CLAUDE.md): one line, at most 80 characters, no co-author trailers.
`npm test` runs the content validator and a Playwright end-to-end pass over every slide, mock exam and page.

## Add content

See [CONTENT_GUIDE.md](CONTENT_GUIDE.md) for the chapter, question and slide-block schema, and how to add the next exam.
Always validate after editing:

```bash
node tools/validate.js kcna
```

## Layout

```
index.html               app shell
assets/css/app.css       styles (dark/light)
assets/js/core.js        storage, loader, router
assets/js/blocks.js      slide block renderers (diagram, flow, flip, code…)
assets/js/views.js       pages: home, exam, deck, quiz, mock, results, flashcards…
exams/registry.js        the 5 exams of the path
exams/kcna/exam.js       KCNA blueprint, intel, library
exams/kcna/chapters/     one file per chapter
exams/kcna/mock-bank-*.js extra mock-exam questions
tools/validate.js        content checker
tests/e2e.js             browser end-to-end test
.githooks/commit-msg     commit message rules
```
