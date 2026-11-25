# Content guide

All study content is plain JavaScript data. No build step. Files register themselves with the global `KS` object.

```
exams/
  registry.js                 # the 5 exams of the Kubestronaut path (set available:true when ready)
  <exam>/exam.js              # blueprint: domains + weights, chapter list, mock config, intel page, library
  <exam>/chapters/NN-*.js     # one chapter = slides + summary + glossary + quiz
  <exam>/mock-bank-*.js       # extra questions used by the fixed mock exams
```

The Next.js app reads these files at build time (`lib/content.js`) and pre-renders a page per lesson,
quiz, flashcard deck and mock exam. Validate after every change:

```bash
node tools/validate.js kcna
```

## Chapter file

```js
KS.registerChapter('kcna', {
  id: 'scheduling',              // must match the id in exam.js `chapters`
  title: 'Scheduling',
  subtitle: 'How Pods land on nodes',   // HTML allowed
  icon: 'compass',               // Lucide icon name (https://lucide.dev/icons), never an emoji
  minutes: 25,
  objectives: ['…', '…'],        // shown on the auto-generated cover slide
  slides: [ { kicker, title, blocks: [ …blocks ], tip } ],
  summary: ['…'],                // auto-generated recap slide
  glossary: [{ term, def }],     // flashcards
  quiz: [ question, … ],         // chapter quiz (also feeds random mocks and drills)
});
```

A cover slide and a recap slide are added automatically. Do not author them.

### Question

```js
{ q: 'Question text (HTML ok)', options: ['A', 'B', 'C', 'D'], answer: 1,
  explain: 'Why B is right and why the others are wrong.',
  ref: 'https://kubernetes.io/docs/concepts/workloads/pods/' }
// multi-select: answer is an array and the question says "(Select 2)"
{ q: 'Which TWO …? (Select 2)', options: [...], answer: [0, 2], explain: '…', ref: ['url1', 'url2'] }
```

Every question (quiz, mock bank and inline `check` blocks) must have a `ref`: the official page
(kubernetes.io, the project's own docs, the CNCF glossary or TOC) that backs the answer. It is shown as a
“📖 Source” link under the explanation. The validator fails on a missing ref; pass `--urls=<file>` to also
require every ref to appear in a list of verified URLs.

Mock-bank questions additionally need `domain: 'fund' | 'orch' | 'delivery' | 'arch'` (KCNA) and are registered with
`KS.registerMockBank('kcna', [ … ])`. Options are shuffled at runtime, so never write “both A and B” or “all of the above”.

### Slide blocks

| type | fields | what it renders |
|---|---|---|
| `text` | `html` | paragraph |
| `bullets` | `items[]`, `reveal?` | bullet list; `reveal:true` = one at a time on Space/Next |
| `cards` | `items[{icon,title,text,color}]`, `cols?` | colored concept cards |
| `flip` | `items[{front,back}]`, `title?` | click-to-flip cards |
| `compare` | `headers[]`, `rows[[]]` | comparison table (first column bold) |
| `code` | `lang` (yaml, bash, dockerfile, promql), `code`, `title?`, `notes{line:html}` | highlighted code; annotated lines are clickable |
| `callout` | `kind` (tip, warn, trap, info, exam), `title?`, `html` | colored callout box |
| `diagram` | `width,height, groups[], nodes[], edges[], steps[]?, caption?, intro?` | interactive SVG diagram (see below) |
| `flow` | `items[{icon,label,sub,info}]`, `caption?` | horizontal pipeline; step through, click for `info` |
| `layers` | `items[{label,sub,color}]`, `title?` | stacked layer diagram |
| `tabs` | `tabs[{label, blocks[]}]` | tabbed content |
| `cols` | `cols[[blocks],[blocks]]`, `ratio?` (CSS grid columns) | side-by-side columns |
| `check` | `q, options, answer, explain` | inline single-answer knowledge check |
| `stats` | `items[{value,label}]` | big numbers |
| `timeline` | `items[{when,title,text}]` | vertical timeline |
| `reveal` | `items[{q,a}]` | accordion Q&A |
| `match` | `pairs[[left,right]]`, `title?` | click-to-match exercise |
| `svg` | `svg` (raw markup), `caption?` | custom drawing |

Colors are names: `blue, teal, green, amber, red, purple, pink, gray`. Every `icon` field is a
[Lucide](https://lucide.dev/icons) icon name such as `database` or `shield`. If you use a new one, add it to
`components/Icon.jsx`. Emojis are not used anywhere.

### Diagram

```js
{ type: 'diagram', width: 900, height: 420,
  groups: [{ x, y, w, h, label, color }],                   // dashed containers (e.g. “Node 1”)
  nodes:  [{ id, x, y, w, h, label, sub, icon, color, info, round, fs }], // label may contain \n
  edges:  [{ from, to, label, color, dashed, both, bend }],  // bend = curve offset in px
  steps:  [{ on: ['nodeId', 'from>to'], text }],             // optional animated walkthrough
  caption: '…' }
```

Coordinates are in the viewBox (default 900×420). Keep nodes inside the canvas and labels short (≤ 18 chars per line).

## Adding a new exam (KCSA, CKAD, CKA, CKS)

1. Create `exams/<id>/exam.js` (copy KCNA's and change domains and weights from the CNCF curriculum).
2. Add chapter files and mock banks, then run the validator.
3. Set `available: true` for the exam in `exams/registry.js`. Its pages, sitemap entries and metadata are generated automatically on the next build.

## Saving a Claude artifact into the library

Save the artifact's HTML into `public/<id>/library/<name>.html` and add an entry to `library` in `exam.js`:

```js
{ group: 'My artifacts', icon: 'puzzle', kind: 'page', title: 'Service types explained', url: 'library/service-types.html' }
```

External links (for example a published claude.ai artifact URL) just omit `kind`.
