# ☸️ Kubestronaut Study Hub

A personal study platform for the five Kubestronaut certifications: **KCNA → KCSA → CKAD → CKA → CKS**.
KCNA is fully built out. The other exams are registered and ready to be filled with content.

## What is inside (KCNA)

- **14 chapters** mapped to the official CNCF curriculum (Fundamentals 44%, Container Orchestration 28%, Application Delivery 16%, Architecture 12%)
- **Interactive slides**: clickable architecture diagrams with animated step-by-step walkthroughs, flip cards, annotated YAML, match exercises, inline knowledge checks
- **Chapter quizzes** with explanations for every answer
- **Mock exams**: 3 fixed + 1 random, 60 questions in 90 minutes, weighted like the real blueprint, flag and navigator, per-domain score report and full review
- **Weak-area drill** and **domain drills** built from your answer history
- **Flashcards** for every key term, plus a printable **cheat sheet**
- **Exam intel**: format, blueprint, what real candidates report, traps, exam-day checklist (with sources)
- **Library** for your own saved Claude artifacts

Progress is stored in your browser (localStorage). Use *Backup / restore* in the footer to move it between devices.

## Run it

No build step, no dependencies.

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. Opening `index.html` directly from disk also works.

### Host it on GitHub Pages

The workflow in `.github/workflows/pages.yml` validates the content and deploys the site on every push to `main`.
Enable it once under *Settings → Pages → Source: GitHub Actions*.

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
```
