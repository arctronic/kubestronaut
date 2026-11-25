# Task: visual enrichment of the KCNA lessons

Paste everything below the line into OpenCode (DeepSeek). Run it **one chapter at a time**: replace
`<CHAPTER_ID>` with a chapter id from the table at the end (e.g. `scheduling`), and start a fresh session
for each chapter.

---

You are improving the **visuals** of one lesson in Kubestronaut Academy, a KCNA exam-prep site.
Lessons are slide decks built from data blocks. Your job: turn text-heavy slides into clear, technically
correct, interactive pictures, without changing any facts, questions or sources.

Target chapter: **`<CHAPTER_ID>`**

## 1. Read first (in this order)

1. `AGENTS.md`: project rules, commands, commit rules. Follow them exactly.
2. `CONTENT_GUIDE.md`: the slide block schema (`diagram`, `flow`, `layers`, `timeline`, `cards`, ...).
3. `exams/kcna/chapters/01-architecture.js`, slide "Anatomy of a Kubernetes cluster": the reference
   diagram. Match its quality: groups, coloured nodes with `info`, labelled edges, and a 7-step walkthrough.
4. `components/Blocks.jsx`, functions `Diagram`, `Flow`, `Layers`, `Timeline`: what each block can render.
5. `components/Icon.jsx`: the only icon names you may use.
6. The target chapter file in `exams/kcna/chapters/`.

## 2. Measure

```bash
node tools/visual-audit.js kcna --chapter=<CHAPTER_ID>
```

It prints the chapter's goals and flags every slide:

- `NO_GRAPHIC`: the slide has only tables, cards or text. Candidate for a picture.
- `TEXT_ONLY`: no visual block at all. Highest priority.
- `DIAGRAM_NO_STEPS`, `NODES_NO_INFO`, `FLOW_NO_INFO`: an existing visual is missing interactivity.
- `WORDY`: too much prose on one slide.

**Chapter goals (definition of done):** at least **3 interactive diagrams**, and at least **60% of slides**
containing a graphic block (`diagram`, `flow`, `layers`, `timeline`).

## 3. Decide what to draw

Pick the slides where a picture explains a **mechanism** better than words: something moves, decides, is
layered or happens in order. Don't decorate. Every graphic must teach the exact point the slide makes and
help answer the exam questions about it.

| The slide explains… | Use |
|---|---|
| components talking to each other, a request path, who-decides-what | `diagram` with `steps` |
| a strict sequence of stages (pipeline, lifecycle) | `flow` (every item gets an `info`) |
| a stack or hierarchy (layers of abstraction, 4Cs, runtime stack) | `layers` |
| change over time (release cadence, backoff, project maturity) | `timeline` |
| allowed vs blocked placement or traffic | `diagram`: green solid edges = allowed, red dashed = blocked |
| a comparison table | keep the table, and add a small `diagram` showing the difference side by side |

Add the graphic **into the existing slide's `blocks`**. Usually put it first, or in a `cols` layout next to
the code. Keep existing tables and code unless the picture fully replaces them. Add at most **one** new
slide per chapter, and only if a concept truly has no slide. Never reorder or delete slides.

## 4. Diagram conventions (follow strictly)

**Canvas.** Default 900×420. Use a 10 px grid, at least 20 px between nodes and 20 px inside a group's
border. Leave 34 px at the top of a group for its label. Everything must stay inside the canvas.

**Nodes.** Width 120–180, height 50–56 (64 if two-line label plus `sub`). Label at most 16 characters per
line (use `\n` for a second line), `sub` at most 22 characters. Every node gets an `info`: 1–2 sentences on
what it does and the exam-relevant fact. Add an `icon` only when it adds meaning.

**Colours** (semantic, keep consistent across the course):

| Colour | Meaning |
|---|---|
| `blue` | API server, control plane, Kubernetes objects |
| `teal` | controllers, Services, networking |
| `green` | nodes, kubelet, healthy or allowed paths |
| `purple` | scheduler, security and policy |
| `amber` | storage, data, etcd, volumes |
| `pink` | container runtime, images, containers |
| `red` | failure, blocked, denied, taint |
| `gray` | external actors: user, kubectl, CI, cloud |

**Edges.** Solid = request or data flow. `dashed: true` = watch, async or control loop. `both: true` =
two-way. Label at most 14 characters. Use `bend` (±30 to 60) only to avoid crossing a node.

**Steps.** 4–8 steps. Each step's `on` lists the node ids and edge ids (`'from>to'`) that light up. Its
`text` (max 35 words) states cause → effect in exam language and bolds the key term with `<b>`.

**Groups.** Use them for physical or logical boundaries (control plane, node, namespace, zone, cluster).

## 5. Worked example (validated)

A taints and tolerations picture for the scheduling chapter. It passes `npm run validate`.

```js
{ type: 'diagram', width: 900, height: 400,
  caption: 'Taints repel, tolerations permit. Press Play to follow two Pods through the scheduler.',
  groups: [
    { x: 300, y: 20, w: 280, h: 360, label: 'kube-scheduler filter', color: 'purple' },
    { x: 620, y: 20, w: 260, h: 170, label: 'node-a  (no taint)', color: 'green' },
    { x: 620, y: 210, w: 260, h: 170, label: 'node-b  gpu=true:NoSchedule', color: 'red' },
  ],
  nodes: [
    { id: 'web', x: 30, y: 90, w: 200, h: 56, label: 'Pod web', sub: 'no tolerations', color: 'blue', icon: 'box',
      info: 'A Pod without tolerations can only be scheduled on nodes that have no NoSchedule or NoExecute taints.' },
    { id: 'ml', x: 30, y: 270, w: 200, h: 56, label: 'Pod ml-train', sub: 'tolerates gpu=true', color: 'blue', icon: 'box',
      info: 'This Pod tolerates the gpu=true:NoSchedule taint, so node-b is allowed for it. A toleration does not force it there; use node affinity for that.' },
    { id: 'filter', x: 340, y: 175, w: 200, h: 64, label: 'TaintToleration', sub: 'filter plugin', color: 'purple',
      info: 'During filtering, the scheduler drops every node whose taints the Pod does not tolerate.' },
    { id: 'a', x: 660, y: 75, w: 180, h: 56, label: 'node-a', sub: 'schedulable', color: 'green', icon: 'server',
      info: 'No taints: any Pod can land here.' },
    { id: 'b', x: 660, y: 265, w: 180, h: 56, label: 'node-b', sub: 'gpu=true:NoSchedule', color: 'red', icon: 'server',
      info: 'The NoSchedule taint repels every Pod that does not tolerate gpu=true. Pods already running stay (only NoExecute evicts).' },
  ],
  edges: [
    { from: 'web', to: 'filter', label: 'schedule', color: 'gray' },
    { from: 'ml', to: 'filter', label: 'schedule', color: 'gray' },
    { from: 'filter', to: 'a', label: 'allowed', color: 'green' },
    { from: 'filter', to: 'b', label: 'web: blocked', color: 'red', dashed: true },
  ],
  steps: [
    { on: ['web', 'filter', 'web>filter'], text: 'Pod <b>web</b> has no tolerations and enters the scheduler’s <b>filter</b> phase.' },
    { on: ['filter', 'b', 'filter>b'], text: 'node-b carries <b>gpu=true:NoSchedule</b>. web does not tolerate it, so node-b is <b>filtered out</b>.' },
    { on: ['filter', 'a', 'filter>a'], text: 'node-a has no taints, so it passes the filter and web is bound there.' },
    { on: ['ml', 'filter', 'ml>filter'], text: 'Pod <b>ml-train</b> tolerates gpu=true, so <b>both</b> nodes pass the filter.' },
    { on: ['ml', 'a', 'b'], text: 'A toleration only <b>permits</b>; scoring may still pick node-a. To <b>require</b> node-b, add node affinity.' },
  ],
}
```

(`server` and `box` are in `components/Icon.jsx`. Check every icon you use is there.)

## 6. Ideas per chapter (verify each fact before drawing it)

| Chapter id | High-value pictures |
|---|---|
| `architecture` | request path inside the API server (authn → authz → admission → etcd) as a diagram; etcd quorum with 3 and 5 members |
| `objects` | Pod anatomy (containers sharing network namespace and volumes, init + native sidecar); Job vs CronJob timeline; probe timeline (startup → readiness → liveness) |
| `administration` | kubeadm upgrade order (control plane first, then nodes, one minor at a time); cordon → drain → maintenance → uncordon flow; namespace + ResourceQuota + LimitRange layers |
| `scheduling` | taints and tolerations (example above); node affinity required vs preferred; pod anti-affinity spreading across zones with `topologyKey`; Pending diagnosis tree |
| `containerization` | image layers (`layers`); build → push → pull → run flow; Linux namespaces + cgroups around a process |
| `networking` | Ingress / Gateway routing to Services; NetworkPolicy default-deny then allow; Service types side by side (ClusterIP, NodePort, LoadBalancer) |
| `security` | 4Cs (`layers`); Pod Security Standards levels; ServiceAccount token flow to the API; Secret encryption at rest |
| `storage` | access modes vs nodes; StatefulSet with one PVC per Pod; reclaim policy lifecycle (`timeline`) |
| `troubleshooting` | CrashLoopBackOff back-off `timeline`; Service with empty endpoints because of a label mismatch; node NotReady chain |
| `delivery` | canary traffic split; blue/green switch; Helm chart + values → release flow; Kustomize base + overlays (`layers`) |
| `debugging` | `kubectl port-forward` path; `kubectl logs` path through the kubelet; debug container sharing the process namespace |
| `observability` | Prometheus pull model with exporters; trace spans across services (`timeline`); logging agent DaemonSet path |
| `ecosystem` | HPA vs VPA vs Cluster Autoscaler; CNCF maturity `timeline` (sandbox → incubating → graduated); scale-to-zero with KEDA |
| `community` | KEP lifecycle flow; CNCF governance (TOC, TAGs, projects) |

## 7. Accuracy rules

- Draw only what the slide's own text, explanations and the chapter's `ref` sources already state, or what
  official docs say. If unsure, leave it out.
- Don't alter quiz questions, answers, explanations, `ref` URLs, glossary or summary.
- Don't invent version numbers, dates, defaults or CNCF maturity levels.

## 8. Verify (all must pass)

```bash
npm run validate
```

```bash
node tools/visual-audit.js kcna --chapter=<CHAPTER_ID>
```

```bash
npm run build
```

```bash
npm test
```

The validator catches node overlap, labels too wide for their node, nodes outside the canvas, edges
pointing at unknown nodes, empty steps, unknown icons and emojis. Fix every error. If you can run a
browser, open `http://localhost:3000/kcna/learn/<CHAPTER_ID>/#s<N>` with `npm run dev` and press Play on
each new diagram.

## 9. Finish

1. Commit with a single-line message, at most 80 characters, **no co-author or other trailers**, e.g.
   `Add scheduling diagrams for taints, affinity and spread`.
2. Report: slides changed (number + title), what each new visual shows, the audit numbers before and after,
   and the four command results.

## Chapters

| # | id | file |
|---|---|---|
| 1 | `architecture` | `01-architecture.js` |
| 2 | `objects` | `02-objects-workloads.js` |
| 3 | `administration` | `03-administration.js` |
| 4 | `scheduling` | `04-scheduling.js` |
| 5 | `containerization` | `05-containerization.js` |
| 6 | `networking` | `06-networking.js` |
| 7 | `security` | `07-security.js` |
| 8 | `storage` | `08-storage.js` |
| 9 | `troubleshooting` | `09-troubleshooting.js` |
| 10 | `delivery` | `10-application-delivery.js` |
| 11 | `debugging` | `11-debugging.js` |
| 12 | `observability` | `12-observability.js` |
| 13 | `ecosystem` | `13-ecosystem-principles.js` |
| 14 | `community` | `14-community.js` |
