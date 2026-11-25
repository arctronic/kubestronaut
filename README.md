# Kubestronaut Academy

A study platform for the five Kubestronaut certifications: **KCNA → KCSA → CKAD → CKA → CKS**.
KCNA is fully built out; the other exams are registered and ready for content.

Live: https://k8s.tronics.dev

## What's inside (KCNA)

- **14 lessons** mapped to the official CNCF curriculum (Fundamentals 44%, Container Orchestration 28%,
  Application Delivery 16%, Architecture 12%), 200+ slides with clickable architecture diagrams and animated
  walkthroughs, flip cards, annotated YAML, matching exercises and inline checks
- **355 practice questions**, each with an explanation and a link to its official source
- **Mock exams**: 3 fixed + 1 random, 60 questions in 90 minutes, weighted like the real blueprint
- **Course-platform UX**: dashboard with streak and weekly goal, modules → lessons → items with completion,
  grades, notes, flashcards, weak-area and domain drills, printable cheat sheet, exam guide
- **Private by design**: all progress, grades and notes stay in the browser's local storage

## Stack

- Next.js (App Router) with **static export**: every lesson, quiz, flashcard deck and mock exam is
  pre-rendered HTML with its own URL, title, description, Open Graph tags and JSON-LD (`Course`,
  `LearningResource`), plus `sitemap.xml` and `robots.txt`
- Content in `exams/` as plain data files, read at build time
- Icons from `lucide-react` (the shadcn/ui icon set)
- Served by nginx in a small Docker image

## Develop

```bash
npm install
```

```bash
npm run dev
```

```bash
npm test
```

`npm test` runs the content validator and a Playwright pass over the static build (run `npm run build` first).
Enable the commit rules from [CLAUDE.md](CLAUDE.md) once per clone:

```bash
git config core.hooksPath .githooks
```

## Deploy

```bash
docker build -t kubestronaut .
```

```bash
docker run -p 8080:80 kubestronaut
```

The image validates content, builds the static site and serves it with nginx on port 80. On Easypanel the
service builds from this repo's `Dockerfile` and redeploys on push. Set `NEXT_PUBLIC_SITE_URL` (build arg)
if the site moves to another domain; it is used for canonical URLs and the sitemap.

## Layout

```
app/                    routes (dashboard, /[exam]/..., settings, sitemap, robots)
components/             UI: Blocks (slide blocks), LessonDeck, Player, Quiz, Mock, Flashcards, Course, Dashboard
lib/content.js          build-time content loader
lib/store.js            localStorage progress store + hooks
lib/progress.js         course progress model
exams/                  content: registry, exam blueprint, chapters, mock banks
public/                 static files (saved artifacts under public/<exam>/library/)
tools/validate.js       content checker
tests/e2e.js            end-to-end test of the static build
deploy/nginx.conf       nginx config for the Docker image
```

See [CONTENT_GUIDE.md](CONTENT_GUIDE.md) to add lessons, questions or the next exam.
