/* KCNA: exam definition. Domains and weights follow the official CNCF KCNA curriculum (github.com/cncf/curriculum). */
KS.registerExam({
  id: 'kcna',
  short: 'KCNA',
  icon: 'ship-wheel',
  title: 'Kubernetes and Cloud Native Associate',
  tagline: 'The entry point of the Kubestronaut path: a 90-minute, multiple-choice exam on Kubernetes fundamentals and the wider cloud native ecosystem. Breadth beats depth here.',
  format: '60 multiple-choice Qs',
  duration: '90 minutes',

  mock: { questions: 60, minutes: 90, pass: 75, sets: 3 },

  domains: [
    { id: 'fund', name: 'Kubernetes Fundamentals', weight: 44, color: 'blue',
      topics: ['Kubernetes Core Concepts', 'Administration', 'Scheduling', 'Containerization'] },
    { id: 'orch', name: 'Container Orchestration', weight: 28, color: 'purple',
      topics: ['Networking', 'Security', 'Troubleshooting', 'Storage'] },
    { id: 'delivery', name: 'Cloud Native Application Delivery', weight: 16, color: 'green',
      topics: ['Application Delivery', 'Debugging'] },
    { id: 'arch', name: 'Cloud Native Architecture', weight: 12, color: 'amber',
      topics: ['Observability', 'Cloud Native Ecosystem and Principles', 'Cloud Native Community and Collaboration'] },
  ],

  // Order here = order in the UI. File lives in exams/kcna/chapters/<file>.
  chapters: [
    { id: 'architecture', file: '01-architecture.js', domain: 'fund' },
    { id: 'objects', file: '02-objects-workloads.js', domain: 'fund' },
    { id: 'administration', file: '03-administration.js', domain: 'fund' },
    { id: 'scheduling', file: '04-scheduling.js', domain: 'fund' },
    { id: 'containerization', file: '05-containerization.js', domain: 'fund' },
    { id: 'networking', file: '06-networking.js', domain: 'orch' },
    { id: 'security', file: '07-security.js', domain: 'orch' },
    { id: 'storage', file: '08-storage.js', domain: 'orch' },
    { id: 'troubleshooting', file: '09-troubleshooting.js', domain: 'orch' },
    { id: 'delivery', file: '10-application-delivery.js', domain: 'delivery' },
    { id: 'debugging', file: '11-debugging.js', domain: 'delivery' },
    { id: 'observability', file: '12-observability.js', domain: 'arch' },
    { id: 'ecosystem', file: '13-ecosystem-principles.js', domain: 'arch' },
    { id: 'community', file: '14-community.js', domain: 'arch' },
  ],
  extraFiles: ['mock-bank-1.js', 'mock-bank-2.js'],

  intel: {
    intro: 'Everything about the exam itself: format, blueprint, what past candidates say they were asked, and how to spend your 90 minutes. Candidate reports are summarised from public write-ups (links at the bottom). Never use leaked “dumps”: it breaks the LF candidate agreement and the questions are often wrong.',
    sections: [
      { icon: 'clipboard-list', title: 'Format at a glance', blocks: [
        { type: 'stats', items: [
          { value: '60', label: 'multiple-choice questions' },
          { value: '90 min', label: 'time limit' },
          { value: '75%', label: 'passing score' },
          { value: '1', label: 'free retake included' },
          { value: '2 yrs', label: 'certification validity' },
        ] },
        { type: 'bullets', items: [
          'Online, remotely proctored through the PSI secure browser. Webcam and microphone stay on the whole time.',
          'Single-answer and <b>multi-select</b> questions (“choose two”). Multi-select scores all-or-nothing.',
          'No penalty for wrong answers, so <b>never leave a question blank</b>.',
          'You can flag questions and come back. Most candidates report finishing with plenty of time left.',
          'You have 12 months from purchase to schedule and sit the exam (including the retake).',
        ] },
      ] },
      { icon: 'map', title: 'Official blueprint (current CNCF curriculum)', blocks: [
        { type: 'compare', headers: ['Domain', 'Weight', '≈ Questions', 'Subtopics'], rows: [
          ['Kubernetes Fundamentals', '44%', '26', 'Core Concepts · Administration · Scheduling · Containerization'],
          ['Container Orchestration', '28%', '17', 'Networking · Security · Troubleshooting · Storage'],
          ['Cloud Native Application Delivery', '16%', '10', 'Application Delivery · Debugging'],
          ['Cloud Native Architecture', '12%', '7', 'Observability · Ecosystem & Principles · Community & Collaboration'],
        ] },
        { type: 'callout', kind: 'info', title: 'Older guides use different numbers', html: 'Many blogs still show the pre-2025 split (46 / 22 / 16 / 8 / 8, with Observability as its own domain). The current curriculum folds Observability into Cloud Native Architecture and doubles Application Delivery to 16%. This hub follows the current version.' },
      ] },
      { icon: 'message-square', title: 'What candidates report seeing', blocks: [
        { type: 'cards', cols: 2, items: [
          { icon: 'compass', color: 'blue', title: 'Scheduling is tested heavily', text: 'One candidate who scored 87% said there were “many questions” on nodeSelector, node affinity, pod affinity/anti-affinity and taints & tolerations. Know which tool fits which scenario.' },
          { icon: 'globe', color: 'purple', title: 'CNCF ecosystem trivia surprises people', text: 'Even CKA holders report being caught out by ecosystem questions: project maturity levels, which project does what, CNCF bodies and events. Kubernetes knowledge alone is not enough.' },
          { icon: 'telescope', color: 'amber', title: 'Recognition-level observability', text: 'Expect “which tool” questions: Prometheus (pull-based metrics), OpenTelemetry (vendor-neutral traces, metrics and logs), Jaeger (tracing), Fluentd/Fluent Bit (logs). Don’t confuse OpenMetrics (a format) with OpenTelemetry (a project).' },
          { icon: 'repeat', color: 'green', title: 'GitOps & delivery', text: 'Git as the single source of truth plus a reconciling agent: Argo CD and Flux. Helm and Kustomize appear alongside. Know deployment strategies (rolling, blue/green, canary).' },
          { icon: 'network', color: 'teal', title: 'Service mesh cues', text: 'Keywords “sidecar”, “mTLS”, “east-west traffic” point to a service mesh (Istio, Linkerd, data plane often Envoy).' },
          { icon: 'timer', color: 'gray', title: 'Time is rarely the problem', text: 'A candidate with CKA background finished including a full review in about 30 minutes. Use the spare time to re-read every multi-select question.' },
        ] },
        { type: 'callout', kind: 'exam', title: 'Pattern behind the questions', html: 'Most questions are short scenario or definition items: <i>“Which component…?”, “Which object should you use to…?”, “Which CNCF project…?”, “What does this kubectl command do?”</i>. Wrong options are usually real Kubernetes terms used in the wrong context, so precise definitions matter more than memorising YAML.' },
      ] },
      { icon: 'triangle-alert', title: 'Classic traps', blocks: [
        { type: 'compare', headers: ['If you see…', 'Remember'], rows: [
          ['“Smallest deployable unit”', 'Pod, not container'],
          ['“Stores cluster state”', 'etcd (only the API server talks to it)'],
          ['“Decides which node a Pod runs on”', 'kube-scheduler. The kubelet only <i>runs</i> what it is assigned'],
          ['“One Pod per node, e.g. log agent”', 'DaemonSet'],
          ['“Stable network identity / ordered rollout”', 'StatefulSet'],
          ['Taint vs affinity', 'Taints <i>repel</i> Pods from nodes; affinity <i>attracts</i> Pods to nodes'],
          ['ConfigMap vs Secret', 'Secrets are only base64-<i>encoded</i> by default, not encrypted'],
          ['HPA vs VPA vs Cluster Autoscaler', 'more Pods · bigger Pods · more nodes'],
          ['CRI vs CNI vs CSI', 'runtime · networking · storage plugin interfaces'],
          ['Sandbox → Incubating → Graduated', 'CNCF project maturity levels, in order'],
        ] },
      ] },
      { icon: 'briefcase', title: 'Strategy for your 90 minutes', blocks: [
        { type: 'timeline', items: [
          { when: '0–45 min', title: 'First pass', text: 'Answer everything you know immediately. Flag anything you hesitate on for more than ~60 seconds.' },
          { when: '45–70 min', title: 'Flagged pass', text: 'Eliminate options. Look for the one word that makes a distractor wrong (e.g. “encrypts”, “always”, “node” vs “Pod”).' },
          { when: '70–90 min', title: 'Final sweep', text: 'Check that every multi-select has exactly the requested number of answers and no question is blank.' },
        ] },
        { type: 'callout', kind: 'tip', title: 'Readiness rule of thumb', html: 'Book the exam when you score <b>85%+ on two different mock exams here</b> and every domain is above 75%. That margin absorbs exam-day nerves and unfamiliar wording.' },
      ] },
      { icon: 'circle-check', title: 'Exam-day checklist', blocks: [
        { type: 'bullets', items: [
          'Run the PSI system check on the <b>same computer and network</b> you will use, a day before.',
          'Government photo ID with a name that exactly matches your LF account.',
          'Clear desk and walls; no second monitor, phone out of reach, nothing written nearby.',
          'Close VPNs, screen recorders, chat apps; plug in the laptop.',
          'Launch the exam up to 30 minutes early; check-in and room scan take time.',
        ] },
      ] },
      { icon: 'link', title: 'Sources', blocks: [
        { type: 'bullets', items: [
          '<a href="https://github.com/cncf/curriculum" target="_blank" rel="noopener">CNCF curriculum repository (KCNA_Curriculum.pdf)</a>: official domains and weights',
          '<a href="https://training.linuxfoundation.org/certification/kubernetes-cloud-native-associate/" target="_blank" rel="noopener">Linux Foundation KCNA page</a>: format, policies, retake',
          '<a href="https://dev.to/suzuki0430/how-i-passed-the-kcna-in-just-3-hours-after-getting-cka-3bf7" target="_blank" rel="noopener">“How I passed the KCNA in 3 hours (after CKA)”</a>: scheduling-heavy, ecosystem trivia, 30-minute finish',
          '<a href="https://dev.to/juliafmorgado/how-to-pass-the-kcna-kubernetes-and-cloud-native-associate-2hod" target="_blank" rel="noopener">“How to pass the KCNA”</a> and <a href="https://dev.to/boiledsteak/how-i-passed-kcna-kubernetes-cloud-native-associate-3leo" target="_blank" rel="noopener">“How I passed KCNA”</a>: candidate experience and logistics',
          '<a href="https://charlesuneze.substack.com/p/i-passed-the-kcna-exam" target="_blank" rel="noopener">“I passed the KCNA exam”</a>: failed twice before passing; hands-on experience helped',
          '<a href="https://sailor.sh/blog/kcna-cloud-native-architecture-observability/" target="_blank" rel="noopener">Sailor.sh KCNA guides</a>: OpenTelemetry vs OpenMetrics, service mesh cues',
        ] },
      ] },
    ],
  },

  // Shown on the exam guide page and published as FAQPage structured data. Keep answers factual.
  faq: [
    { q: 'How many questions are on the KCNA exam, and how long is it?', a: 'The KCNA has 60 multiple-choice questions and a 90-minute time limit. Some questions ask you to select more than one answer.' },
    { q: 'What score do you need to pass the KCNA?', a: 'You need 75% to pass. Wrong answers are not penalised, so never leave a question blank.' },
    { q: 'What does the KCNA exam cover?', a: 'Four domains from the official CNCF curriculum: Kubernetes Fundamentals (44%), Container Orchestration (28%), Cloud Native Application Delivery (16%) and Cloud Native Architecture (12%).' },
    { q: 'Is the KCNA a hands-on exam?', a: 'No. The KCNA is an online, remotely proctored multiple-choice exam. The hands-on exams in the Kubestronaut path are the CKAD, CKA and CKS.' },
    { q: 'Does the KCNA include a free retake, and how long is it valid?', a: 'The exam includes one free retake, and the certification is valid for 2 years.' },
    { q: 'How should I prepare for the KCNA?', a: 'Work through every domain, then take timed mock exams. A good rule of thumb is to book the exam when you score 85% or more on two different mock exams and every domain is above 75%.' },
  ],

  // Your personal library. kind:'page' = local HTML file under exams/kcna/library/, otherwise an external link.
  library: [
    { group: 'Official', icon: 'file-text', title: 'KCNA curriculum (CNCF)', url: 'https://github.com/cncf/curriculum', note: 'The source of truth for domains and weights.' },
    { group: 'Official', icon: 'graduation-cap', title: 'KCNA exam page (Linux Foundation)', url: 'https://training.linuxfoundation.org/certification/kubernetes-cloud-native-associate/', note: 'Schedule, policies, candidate handbook.' },
    { group: 'Official', icon: 'book-open', title: 'Kubernetes documentation', url: 'https://kubernetes.io/docs/concepts/', note: 'Concepts section maps closely to the Fundamentals domain.' },
    { group: 'Official', icon: 'map', title: 'CNCF Landscape', url: 'https://landscape.cncf.io/', note: 'Browse projects by category and maturity level.' },
    { group: 'Official', icon: 'landmark', title: 'CNCF projects & maturity', url: 'https://www.cncf.io/projects/', note: 'Graduated, incubating and sandbox project lists.' },
    { group: 'Official', icon: 'book-open', title: 'Cloud Native Glossary', url: 'https://glossary.cncf.io/', note: 'Official CNCF definitions. Great for the Architecture domain.' },
    { group: 'Study aids', icon: 'receipt', kind: 'route', title: 'KCNA cheat sheet', url: '#/exam/kcna/cheatsheet', note: 'Every chapter recap and key term on one printable page.' },
    { group: 'My artifacts', icon: 'puzzle', kind: 'page', title: 'How to add your own artifacts', url: 'library/README.html', note: 'Save any Claude artifact as an HTML file in exams/kcna/library/ and list it here.' },
  ],
});
