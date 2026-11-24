KS.registerChapter('kcna', {
  id: 'community',
  title: 'Community & Collaboration',
  subtitle: 'Who governs the CNCF and Kubernetes, how projects mature, how to contribute and the roles that make cloud native work',
  icon: '🤝',
  minutes: 30,
  objectives: [
    'Describe the CNCF structure: Linux Foundation, Governing Board, TOC, TAGs and the end user community',
    'Explain the Sandbox → Incubating → Graduated lifecycle and what graduation requires',
    'Explain Kubernetes governance: Steering Committee, SIGs, Working Groups, KEPs and the release cycle',
    'Know how to contribute (issues, PRs, CLA/DCO, Code of Conduct, Slack, meetings) and which events exist',
    'Match cloud native personas, platform engineering and the LF certification path',
  ],

  slides: [
    {
      kicker: 'Structure · interactive',
      title: 'How the CNCF is organised',
      blocks: [
        { type: 'diagram', width: 900, height: 440,
          caption: 'Click a body for details, or press ▶ Play to follow a new project through the foundation.',
          nodes: [
            { id: 'lf', x: 350, y: 20, w: 200, h: 52, label: 'Linux Foundation', icon: '🐧', color: 'gray', info: 'Non-profit that hosts many open source foundations and projects (CNCF, OpenSSF, OCI, FinOps Foundation, OpenJS…). It also runs Linux Foundation Training & Certification, which delivers the KCNA.' },
            { id: 'cncf', x: 350, y: 105, w: 200, h: 52, label: 'CNCF', icon: '☁️', sub: 'founded 2015', color: 'blue', info: 'Cloud Native Computing Foundation: a Linux Foundation project founded in 2015 with Kubernetes as its first (seed) project. It provides a vendor-neutral home for projects plus funding, events, marketing, legal and infrastructure.' },
            { id: 'gb', x: 30, y: 200, w: 200, h: 56, label: 'Governing Board', icon: '💼', sub: 'budget, marketing', color: 'amber', info: 'Responsible for business decisions: budget, marketing, events, brand and legal matters, representing member companies. It does <b>not</b> decide which projects are accepted or how they mature.' },
            { id: 'toc', x: 350, y: 200, w: 200, h: 56, label: 'TOC', icon: '🧑‍⚖️', sub: 'technical oversight', color: 'purple', info: 'Technical Oversight Committee: the technical leadership of the CNCF. Defines the technical vision, accepts projects and votes on moving them between maturity levels. Has 11 members.' },
            { id: 'eu', x: 670, y: 200, w: 200, h: 56, label: 'End User TAB', icon: '🏢', sub: 'end user community', color: 'green', info: 'The end user community gathers organisations that <b>use</b> cloud native tech but do not sell it. Its Technical Advisory Board (TAB) feeds real-world needs back to the TOC; end users also publish Tech Radars and case studies.' },
            { id: 'tags', x: 150, y: 300, w: 200, h: 56, label: 'TAGs', icon: '🧭', sub: 'technical advisory', color: 'teal', info: 'Technical Advisory Groups (formerly called CNCF SIGs) cover domains such as security, observability, runtime and app delivery. They support the TOC: reviewing projects, writing white papers and best practices. Their exact names have been reorganised over time.' },
            { id: 'proj', x: 400, y: 300, w: 220, h: 56, label: 'CNCF projects', icon: '📦', sub: 'sandbox → graduated', color: 'blue', info: 'Each project keeps its own maintainers and governance. The CNCF provides neutral ownership of trademarks and assets, services, and promotion.' },
            { id: 'team', x: 30, y: 385, w: 200, h: 46, label: 'Project team', icon: '👩‍💻', sub: 'maintainers', color: 'pink', info: 'Maintainers who want to donate their project apply to the CNCF (starting at Sandbox or, with more evidence, Incubating).' },
            { id: 'k8s', x: 670, y: 300, w: 200, h: 56, label: 'Kubernetes', icon: '☸️', sub: 'Steering Committee', color: 'blue', info: 'Kubernetes is a CNCF graduated project with its own governance: an elected Steering Committee, SIGs, Working Groups and committees.' },
            { id: 'sigs', x: 670, y: 385, w: 200, h: 46, label: 'K8s SIGs & WGs', icon: '🛠️', color: 'teal', info: 'Kubernetes Special Interest Groups own areas of the code (SIG Node, SIG Network, SIG Storage, SIG Docs…); Working Groups are temporary cross-SIG efforts. Do not confuse them with CNCF TAGs.' },
          ],
          edges: [
            { from: 'lf', to: 'cncf', label: 'hosts', color: 'gray' },
            { from: 'cncf', to: 'gb', color: 'amber' },
            { from: 'cncf', to: 'toc', color: 'purple' },
            { from: 'cncf', to: 'eu', color: 'green' },
            { from: 'team', to: 'tags', label: 'presents', color: 'pink' },
            { from: 'tags', to: 'toc', label: 'recommend', color: 'teal', dashed: true },
            { from: 'eu', to: 'toc', label: 'feedback', color: 'green', dashed: true },
            { from: 'toc', to: 'proj', label: 'votes', color: 'purple' },
            { from: 'proj', to: 'k8s', color: 'blue' },
            { from: 'k8s', to: 'sigs', color: 'teal' },
          ],
          steps: [
            { on: ['lf', 'cncf', 'lf>cncf'], text: 'The <b>Linux Foundation</b> hosts the <b>CNCF</b>, which gives projects a vendor-neutral home.' },
            { on: ['cncf', 'gb', 'cncf>gb'], text: 'The <b>Governing Board</b> handles money and business: budget, marketing, events, legal. Not technical decisions.' },
            { on: ['team', 'tags', 'team>tags'], text: 'A <b>project team</b> applies to join; a relevant <b>TAG</b> reviews the project and its domain fit.' },
            { on: ['tags', 'toc', 'tags>toc'], text: 'The TAG advises the <b>TOC</b>, which owns technical decisions.' },
            { on: ['toc', 'proj', 'toc>proj'], text: 'The <b>TOC votes</b> to accept the project (Sandbox) and later to move it to Incubating and Graduated.' },
            { on: ['eu', 'toc', 'eu>toc'], text: 'The <b>end user community</b> and its TAB give feedback from organisations running the technology in production.' },
            { on: ['proj', 'k8s', 'sigs', 'proj>k8s', 'k8s>sigs'], text: 'Each project governs itself. <b>Kubernetes</b> has a Steering Committee, SIGs and Working Groups.' },
          ],
        },
      ],
      tip: 'Business → <b>Governing Board</b>. Technical decisions and maturity votes → <b>TOC</b>. Domain expertise → <b>TAGs</b>. Users’ voice → <b>End User community / TAB</b>.',
    },

    {
      kicker: 'Who does what',
      title: 'CNCF bodies: flip to reveal',
      blocks: [
        { type: 'flip', items: [
          { front: '💼 Governing Board', back: 'Budget, marketing, events, brand, legal. Members represent CNCF member companies. Does not pick projects.' },
          { front: '🧑‍⚖️ Technical Oversight Committee', back: 'Technical vision of the CNCF. Accepts projects, approves moves between Sandbox, Incubating and Graduated, and can archive projects.' },
          { front: '🧭 Technical Advisory Groups', back: 'Domain experts (e.g. security, observability, delivery) who scale the TOC: project reviews, white papers, landscapes and guidance.' },
          { front: '🏢 End User community & TAB', back: 'Companies that use but do not sell cloud native technology. Share case studies and Tech Radars and advise the TOC through the Technical Advisory Board.' },
          { front: '🎤 CNCF Ambassadors', back: 'Community members recognised for teaching and evangelising cloud native: talks, blogs, meetups.' },
          { front: '🧰 Maintainers', back: 'The people who own a project’s code, reviews and releases. Projects keep their own governance inside the CNCF.' },
        ] },
        { type: 'callout', kind: 'trap', title: 'TAG vs SIG', html: '<b>TAGs</b> are CNCF-wide advisory groups. <b>SIGs</b> (Special Interest Groups) are the building blocks of <b>Kubernetes</b> project governance. An exam option saying “a CNCF TAG maintains kube-scheduler code” is wrong: SIG Scheduling does.' },
      ],
      tip: 'CNCF is <b>vendor-neutral</b>: no single company controls a project’s direction, which is a key reason companies donate projects to it.',
    },

    {
      kicker: 'Project lifecycle',
      title: 'Sandbox → Incubating → Graduated',
      blocks: [
        { type: 'timeline', items: [
          { when: '1 · Sandbox', title: 'Experimental entry point', text: 'Early-stage projects that align with cloud native. Low bar, accepted by TOC vote. Gives a neutral home and visibility; not a statement of production readiness.' },
          { when: '2 · Incubating', title: 'Real production use', text: 'Documented use in production by at least three independent end users, a healthy number of committers, clear governance, and TOC due diligence.' },
          { when: '3 · Graduated', title: 'Mature and widely adopted', text: 'Committers from at least two organisations, an independent third-party security audit, the OpenSSF Best Practices badge, a public adopters list and the CNCF Code of Conduct. Needs a TOC supermajority vote.' },
          { when: 'Archived', title: 'End of active life', text: 'Projects that become inactive or superseded are archived by the TOC, e.g. rkt, OpenTracing (replaced by OpenTelemetry) and SMI. Code stays public.' },
        ] },
        { type: 'callout', kind: 'exam', title: 'Graduation checklist', html: '<b>Adopters</b> in production · <b>committers from ≥ 2 organisations</b> · <b>third-party security audit</b> · <b>OpenSSF Best Practices badge</b> · documented <b>governance</b> and committer process · <b>CNCF Code of Conduct</b> · TOC <b>supermajority</b> vote.' },
      ],
      tip: 'Graduation is about <b>maturity, adoption and sustainability</b>, not about how many GitHub stars a project has or which company created it.',
    },

    {
      kicker: 'Graduation',
      title: 'Why each graduation requirement exists',
      blocks: [
        { type: 'cards', cols: 3, items: [
          { icon: '🏭', color: 'green', title: 'Adopters', text: 'Proves the project solves real problems in production, not just in demos.' },
          { icon: '🏢', color: 'blue', title: 'Diverse committers', text: 'Maintainers from at least two organisations reduce the risk of one company abandoning or steering the project.' },
          { icon: '🔍', color: 'red', title: 'Security audit', text: 'An independent third-party audit finds vulnerabilities before users depend on the code at scale.' },
          { icon: '🏅', color: 'amber', title: 'OpenSSF badge', text: 'The OpenSSF Best Practices badge shows sound practices: vulnerability reporting, tests, secure development.' },
          { icon: '🏛️', color: 'purple', title: 'Governance', text: 'A written process for decisions, becoming a maintainer and resolving conflicts.' },
          { icon: '🤝', color: 'teal', title: 'Code of Conduct', text: 'Projects adopt the CNCF Code of Conduct so the community stays welcoming.' },
        ] },
        { type: 'check', q: 'A project is used by many companies and has thousands of GitHub stars, but all maintainers work for one company and no security audit has been done. What is most likely blocking graduation?', options: ['It is not written in Go', 'It lacks committer diversity and a third-party security audit', 'It has not been sponsored by the Governing Board', 'It must first become a Kubernetes SIG subproject'], answer: 1, explain: 'Graduation requires <b>committers from at least two organisations</b> and an <b>independent security audit</b>, among other criteria. Programming language does not matter, the TOC (not the Governing Board) votes on maturity, and CNCF projects do not need to be part of Kubernetes.', ref: 'https://github.com/cncf/toc/blob/main/process/graduation_criteria.md' },
      ],
      tip: 'The OpenSSF (Open Source Security Foundation) is another Linux Foundation foundation; its Best Practices badge was formerly known as the CII Best Practices badge.',
    },

    {
      kicker: 'Kubernetes governance',
      title: 'Steering, SIGs, Working Groups and committees',
      blocks: [
        { type: 'compare', headers: ['Group', 'Purpose', 'Owns code?', 'Lifetime'], rows: [
          ['Steering Committee', 'Top-level governance of the Kubernetes project; 7 members elected by contributors', 'No', 'Permanent (elected terms)'],
          ['SIG (Special Interest Group)', 'Owns an area: SIG Node, SIG Network, SIG Storage, SIG Scheduling, SIG Apps, SIG Auth, SIG Docs, SIG Release, SIG Architecture…', 'Yes, via subprojects', 'Long-lived'],
          ['Working Group (WG)', 'Cross-SIG topic that needs coordination', 'No, code lives in SIGs', 'Temporary, disbanded when done'],
          ['Committees', 'Sensitive topics: Code of Conduct Committee, Security Response Committee', 'No', 'Permanent'],
          ['Subproject', 'A repo or component owned by a SIG (e.g. Karpenter, Gateway API, metrics-server)', 'Yes', 'As long as maintained'],
        ] },
        { type: 'layers', title: 'Contributor ladder', items: [
          { label: 'Subproject owner', sub: 'sets technical direction of a subproject', color: 'purple' },
          { label: 'Approver', sub: 'can /approve changes in OWNERS paths', color: 'blue' },
          { label: 'Reviewer', sub: 'reviews code, can /lgtm', color: 'teal' },
          { label: 'Member', sub: 'Kubernetes GitHub org member, sponsored by two reviewers', color: 'green' },
          { label: 'Contributor', sub: 'anyone who opens issues, PRs, docs, reviews', color: 'gray' },
        ] },
      ],
      tip: 'Which group would own a new feature in the kubelet? <b>SIG Node</b>. Which group coordinates a temporary cross-cutting effort? A <b>Working Group</b>.',
    },

    {
      kicker: 'Enhancements & releases',
      title: 'KEPs and the Kubernetes release cycle',
      blocks: [
        { type: 'flow', items: [
          { icon: '💡', label: 'Idea', sub: 'discuss in a SIG', info: 'Raise it in the owning SIG’s meeting, mailing list or Slack channel first.' },
          { icon: '📝', label: 'KEP', sub: 'kubernetes/enhancements', info: 'A <b>Kubernetes Enhancement Proposal</b> documents motivation, design, test plan, graduation criteria and production readiness. It is owned by a SIG.' },
          { icon: '✅', label: 'Implementable', sub: 'SIG approves', info: 'KEP states include provisional, implementable and implemented. A production readiness review is part of the process.' },
          { icon: '🧪', label: 'Alpha', sub: 'off by default', info: 'Behind a feature gate, disabled by default, may change or be removed.' },
          { icon: '🧭', label: 'Beta', sub: 'well tested', info: 'More mature; the API may still change in compatible ways.' },
          { icon: '🏁', label: 'Stable (GA)', sub: 'supported', info: 'Generally available; the feature gate is eventually removed.' },
        ] },
        { type: 'stats', items: [
          { value: '3', label: 'minor releases per year' },
          { value: '≈ 14 mo', label: 'support (patches) per minor release' },
          { value: '3', label: 'most recent minors maintained' },
        ] },
        { type: 'callout', kind: 'info', title: 'The release team', html: 'Each release is run by a volunteer <b>release team</b> under <b>SIG Release</b>: release lead, enhancements, CI signal, bug triage, docs and comms. A <b>shadow</b> program lets newcomers learn each role. Key milestones are enhancements freeze and code freeze.' },
      ],
      tip: 'A significant change to Kubernetes starts with a <b>KEP</b>, not a direct PR. Alpha → beta → stable describes <b>feature</b> maturity; Sandbox → Incubating → Graduated describes <b>CNCF project</b> maturity.',
    },

    {
      kicker: 'Get involved',
      title: 'How to contribute',
      blocks: [
        { type: 'cols', ratio: '1fr 1.1fr', cols: [
          [
            { type: 'bullets', items: [
              'Start with issues labelled <b>good first issue</b> or <b>help wanted</b>.',
              'Sign the <b>CNCF CLA</b> (Kubernetes uses the Linux Foundation EasyCLA). Some CNCF projects use the <b>DCO</b> instead: add <code>Signed-off-by</code> with <code>git commit -s</code>.',
              'Join <b>Kubernetes Slack</b> (slack.k8s.io) or <b>CNCF Slack</b>, mailing lists and open <b>SIG meetings</b> on the public community calendar (recorded).',
              'Code is only one path: <b>docs</b>, localisation, issue triage, reviews, testing, release team shadowing, mentoring (LFX Mentorship, GSoC) and organising events all count.',
            ] },
          ],
          [
            { type: 'code', lang: 'bash', title: 'Prow commands in a Kubernetes PR comment', code: `
/assign @reviewer-name
/kind bug
/sig node
/lgtm
/approve
/hold
/retest`, notes: {
              1: 'Kubernetes repos are automated by the <b>Prow</b> CI bot, driven by slash commands in comments.',
              3: 'Routes the PR to the owning SIG.',
              4: '<b>/lgtm</b> (“looks good to me”) is given by a <b>reviewer</b>.',
              5: '<b>/approve</b> comes from an <b>approver</b> listed in the OWNERS file. lgtm + approve = merge.',
              6: 'Prevents merging until <code>/hold cancel</code>.',
              7: 'Re-runs failed tests.',
            } },
          ],
        ] },
        { type: 'callout', kind: 'tip', title: 'Etiquette', html: 'Search existing issues first, keep PRs small and focused, follow the contributor guide, and be patient: reviewers are often volunteers in other time zones.' },
      ],
      tip: 'Exam cue: “a document contributors sign to grant rights to their contribution” = <b>CLA</b>. “Sign-off line in each commit” = <b>DCO</b>.',
    },

    {
      kicker: 'Open source basics',
      title: 'Code of Conduct and licensing',
      blocks: [
        { type: 'cards', cols: 2, items: [
          { icon: '🤝', color: 'green', title: 'CNCF Code of Conduct', text: 'Based on the Contributor Covenant. Applies to project spaces and events. Violations are reported to the project or CNCF Code of Conduct Committee; Kubernetes also has its own Code of Conduct Committee.' },
          { icon: '⚖️', color: 'blue', title: 'Apache License 2.0', text: 'The default licence for CNCF project code. Permissive: commercial use, modification and distribution are allowed, with an explicit patent grant. Other licences need an exception.' },
          { icon: '📚', color: 'purple', title: 'Documentation', text: 'CNCF project documentation is typically licensed under Creative Commons Attribution 4.0 (CC BY 4.0).' },
          { icon: '🏷️', color: 'amber', title: 'Neutral ownership', text: 'Trademarks and domains of CNCF projects are held by the Linux Foundation, so no single vendor controls the brand.' },
        ] },
        { type: 'compare', headers: ['Licence type', 'Example', 'Key idea'], rows: [
          ['Permissive', 'Apache 2.0, MIT', 'Reuse freely, including in proprietary products; keep notices'],
          ['Copyleft', 'GPL, AGPL', 'Derivative works must be released under the same licence'],
        ] },
      ],
      tip: 'Which licence do CNCF projects use by default? <b>Apache 2.0</b>.',
    },

    {
      kicker: 'Events',
      title: 'Where the community meets',
      blocks: [
        { type: 'cards', items: [
          { icon: '🎪', color: 'blue', title: 'KubeCon + CloudNativeCon', text: 'The CNCF flagship conference, held in Europe and North America every year, with regional editions such as China, India and Japan. Co-located events run the day before.' },
          { icon: '🏘️', color: 'green', title: 'Kubernetes Community Days (KCD)', text: 'Community-organised, CNCF-supported local events around the world. Smaller, cheaper and focused on local practitioners.' },
          { icon: '☕', color: 'amber', title: 'Cloud Native Community Groups', text: 'Local CNCF meetups, organised through the CNCF community platform.' },
          { icon: '🛠️', color: 'purple', title: 'Contributor / Maintainer Summits', text: 'Sessions alongside KubeCon for people who contribute to Kubernetes and CNCF projects.' },
          { icon: '🧪', color: 'teal', title: 'Online programs', text: 'CNCF webinars and livestreams, plus recorded SIG and TAG meetings anyone can watch.' },
        ] },
        { type: 'callout', kind: 'trap', title: 'Who organises what?', html: '<b>KubeCon + CloudNativeCon</b> is run by the CNCF/Linux Foundation. <b>KCDs</b> are run by <b>local community organisers</b> with CNCF support and guidelines.' },
      ],
      tip: 'The official full name always pairs both brands: <b>KubeCon + CloudNativeCon</b>.',
    },

    {
      kicker: 'People',
      title: 'Cloud native personas and roles',
      blocks: [
        { type: 'match', pairs: [
          ['Site Reliability Engineer (SRE)', 'Defines SLOs, manages error budgets, reduces toil with automation'],
          ['Platform engineer', 'Builds the internal developer platform and golden paths'],
          ['DevOps engineer', 'Automates CI/CD and bridges development and operations'],
          ['Cloud architect', 'Designs the overall cloud and application architecture'],
          ['Security engineer (DevSecOps)', 'Shifts security left: scanning, policy, runtime protection'],
          ['FinOps practitioner', 'Tracks and optimises cloud spend with engineering and finance'],
          ['Application developer', 'Writes services and consumes the platform self-service'],
        ] },
        { type: 'callout', kind: 'tip', title: 'Recognise the keywords', html: '<b>SLO, error budget, toil</b> → SRE. <b>Self-service, golden path, IDP</b> → platform engineer. <b>Cost allocation, showback</b> → FinOps. <b>Shift left</b> → DevSecOps.' },
      ],
      tip: 'SRE was popularised by Google: “what happens when you ask a software engineer to design an operations function”.',
    },

    {
      kicker: 'Culture',
      title: 'DevOps, DevSecOps and platform engineering',
      blocks: [
        { type: 'compare', headers: ['', 'DevOps', 'DevSecOps', 'Platform engineering'], rows: [
          ['Core idea', 'Break the wall between dev and ops; shared ownership', 'Build security into every stage (“shift left”)', 'Treat the internal platform as a product for developers'],
          ['Typical practice', 'CI/CD, IaC, fast feedback, blameless postmortems', 'Image scanning, SBOMs, policy as code, signed artefacts', 'Internal developer platform (IDP), templates, golden paths'],
          ['Measured by', 'DORA metrics: deployment frequency, lead time, change failure rate, time to restore', 'Vulnerabilities found early, policy compliance', 'Developer productivity, adoption, reduced cognitive load'],
        ] },
        { type: 'cards', cols: 2, items: [
          { icon: '🧭', color: 'purple', title: 'Internal developer platform', text: 'A self-service layer (portal, APIs, templates) built by a platform team on top of Kubernetes and cloud services, so developers ship without becoming infrastructure experts.' },
          { icon: '🎭', color: 'blue', title: 'Backstage', text: 'Open-source framework for building developer portals: software catalog, templates (scaffolder), TechDocs and plugins. Created at Spotify; a CNCF incubating project.' },
        ] },
        { type: 'callout', kind: 'trap', title: 'DevOps is not a job title only', html: 'DevOps is primarily a <b>culture and set of practices</b>. A question asking what DevOps “is” wants collaboration, automation and shared responsibility, not “a team that runs Jenkins”.' },
      ],
      tip: 'Exam cue: “reduce developer cognitive load with self-service and golden paths” = <b>platform engineering</b>, often implemented with <b>Backstage</b>.',
    },

    {
      kicker: 'Certifications',
      title: 'The Linux Foundation / CNCF certification path',
      blocks: [
        { type: 'compare', headers: ['Certification', 'Format', 'Focus'], rows: [
          ['KCNA: Kubernetes and Cloud Native Associate', 'Multiple choice', 'Kubernetes and cloud native fundamentals (this exam)'],
          ['KCSA: Kubernetes and Cloud Native Security Associate', 'Multiple choice', 'Security fundamentals for Kubernetes and cloud native'],
          ['CKAD: Certified Kubernetes Application Developer', 'Hands-on, performance-based', 'Designing and deploying applications on Kubernetes'],
          ['CKA: Certified Kubernetes Administrator', 'Hands-on, performance-based', 'Installing, configuring and troubleshooting clusters'],
          ['CKS: Certified Kubernetes Security Specialist', 'Hands-on, performance-based', 'Securing clusters and workloads; requires an active CKA'],
        ] },
        { type: 'callout', kind: 'exam', title: 'Kubestronaut', html: 'A <b>Kubestronaut</b> holds all five Kubernetes certifications at the same time: <b>KCNA, KCSA, CKAD, CKA and CKS</b>. The <b>Golden Kubestronaut</b> extends this to every CNCF certification plus the LFCS.' },
        { type: 'check', q: 'Which certification must be held (and active) before you can take the CKS exam?', options: ['KCNA', 'CKAD', 'CKA', 'KCSA'], answer: 2, explain: 'The <b>CKS</b> requires an active <b>CKA</b>, because it builds on cluster administration skills. KCNA, KCSA and CKAD are not prerequisites for CKS.', ref: 'https://www.cncf.io/training/kubestronaut/' },
      ],
      tip: 'Associates (KCNA, KCSA) are multiple choice; the “Certified … ” exams (CKA, CKAD, CKS) are hands-on in a live terminal.',
    },
  ],

  summary: [
    'The <b>Linux Foundation</b> hosts the <b>CNCF</b> (founded 2015, Kubernetes as first project). <b>Governing Board</b> = business and budget; <b>TOC</b> = technical decisions and maturity votes; <b>TAGs</b> = domain advisory groups; <b>End User community / TAB</b> = users’ voice.',
    'Maturity: <b>Sandbox → Incubating → Graduated</b>, plus <b>Archived</b>. Graduation needs adopters, committers from ≥ 2 orgs, a third-party <b>security audit</b>, the <b>OpenSSF Best Practices badge</b>, governance, the Code of Conduct and a TOC supermajority.',
    'Kubernetes governance: elected <b>Steering Committee</b>, <b>SIGs</b> own code, temporary <b>Working Groups</b>, committees; changes go through <b>KEPs</b>; <b>3 releases a year</b>, each supported about 14 months.',
    'Contribute via issues (<b>good first issue</b>), PRs (Prow <code>/lgtm</code> + <code>/approve</code>), <b>CLA</b> or <b>DCO</b>, docs, Slack, SIG meetings; all under the CNCF <b>Code of Conduct</b>. Default licence: <b>Apache 2.0</b>.',
    'Events: <b>KubeCon + CloudNativeCon</b> (CNCF), <b>Kubernetes Community Days</b> (local organisers), Cloud Native Community Group meetups.',
    'Roles: SRE (SLOs), platform engineer (IDP, golden paths, <b>Backstage</b>), DevOps, DevSecOps (shift left), cloud architect, FinOps.',
    'Path: <b>KCNA, KCSA</b> (multiple choice) + <b>CKAD, CKA, CKS</b> (hands-on; CKS needs CKA) = <b>Kubestronaut</b>.',
  ],

  glossary: [
    { term: 'CNCF', def: 'Cloud Native Computing Foundation: Linux Foundation project founded in 2015 that hosts Kubernetes and other cloud native projects.' },
    { term: 'Governing Board', def: 'CNCF body responsible for budget, marketing, events, brand and legal matters.' },
    { term: 'TOC', def: 'Technical Oversight Committee: CNCF technical leadership that accepts projects and votes on maturity levels.' },
    { term: 'TAG', def: 'Technical Advisory Group: CNCF domain group (e.g. security, observability) that supports the TOC with reviews and guidance.' },
    { term: 'End User TAB', def: 'Technical Advisory Board of the CNCF end user community, representing organisations that use cloud native tech.' },
    { term: 'Sandbox', def: 'Entry-level CNCF maturity stage for early or experimental projects.' },
    { term: 'Incubating', def: 'Middle CNCF maturity stage: production use by several end users and a healthy contributor base.' },
    { term: 'Graduated', def: 'Highest CNCF maturity stage: wide adoption, security audit, diverse committers, solid governance.' },
    { term: 'OpenSSF Best Practices badge', def: 'Self-certification of secure open source development practices; required for CNCF graduation.' },
    { term: 'Steering Committee', def: 'Elected top-level governance body of the Kubernetes project.' },
    { term: 'SIG', def: 'Special Interest Group: a Kubernetes community group that owns an area of the project’s code and docs.' },
    { term: 'Working Group', def: 'Temporary Kubernetes group for cross-SIG topics; owns no code and disbands when done.' },
    { term: 'KEP', def: 'Kubernetes Enhancement Proposal: design document required for significant changes, owned by a SIG.' },
    { term: 'CLA / DCO', def: 'Contributor License Agreement (signed once) or Developer Certificate of Origin (Signed-off-by per commit) for contributions.' },
    { term: 'Internal developer platform', def: 'Self-service platform built by a platform team to give developers golden paths to build and run apps.' },
    { term: 'Kubestronaut', def: 'Title for holding all five active Kubernetes certifications: KCNA, KCSA, CKAD, CKA and CKS.' },
  ],

  quiz: [
    { q: 'Which CNCF body makes technical decisions such as accepting new projects and approving their move to a higher maturity level?', options: ['Governing Board', 'Technical Oversight Committee (TOC)', 'End User Technical Advisory Board', 'Kubernetes Steering Committee'], answer: 1, explain: 'The <b>TOC</b> owns the CNCF’s technical vision and votes on project acceptance and maturity. The Governing Board handles budget and marketing, the End User TAB advises from the user perspective, and the Kubernetes Steering Committee governs only Kubernetes.', ref: 'https://github.com/cncf/toc/blob/main/README.md' },
    { q: 'Which TWO are requirements for a CNCF project to reach Graduated status? (Select 2)', options: ['An independent third-party security audit', 'At least 10,000 GitHub stars', 'Committers from at least two organisations', 'Being written in Go'], answer: [0, 2], explain: 'Graduation requires (among others) a <b>third-party security audit</b> and <b>committers from at least two organisations</b>, plus adopters, governance, the OpenSSF badge and a TOC supermajority vote. Stars and programming language are not criteria.', ref: 'https://github.com/cncf/toc/blob/main/process/graduation_criteria.md' },
    { q: 'In the Kubernetes project, which kind of group owns a specific area of code such as networking or storage?', options: ['A Working Group', 'A CNCF TAG', 'A Special Interest Group (SIG)', 'The Governing Board'], answer: 2, explain: '<b>SIGs</b> (SIG Network, SIG Storage…) own code through subprojects. Working Groups are temporary and own no code, TAGs advise the CNCF TOC, and the Governing Board handles business matters.', ref: 'https://github.com/kubernetes/community/blob/main/governance.md' },
    { q: 'What is a KEP?', options: ['A Kubernetes Enhancement Proposal used to design and track significant changes', 'A Kubernetes Execution Pod used to run release tests', 'A key encryption policy for etcd', 'The CNCF process for archiving projects'], answer: 0, explain: 'A <b>KEP</b> documents the motivation, design, test plan and graduation criteria of a significant Kubernetes change, and is owned by a SIG. The other options are invented or describe unrelated processes.', ref: 'https://github.com/kubernetes/enhancements' },
    { q: 'Under which licence are CNCF project source code repositories released by default?', options: ['GPL v3', 'MIT', 'AGPL', 'Apache License 2.0'], answer: 3, explain: 'The CNCF IP policy uses the <b>Apache License 2.0</b> by default: permissive, with an explicit patent grant. GPL and AGPL are copyleft licences; MIT is permissive but is not the CNCF default.', ref: 'https://github.com/cncf/foundation/blob/main/charter.md' },
    { q: 'Which statement about Kubernetes Community Days (KCD) is correct?', options: ['They are the official name of KubeCon in Europe', 'They are local events organised by community members with CNCF support', 'They are online-only certification exams', 'They are meetings of the Kubernetes Steering Committee'], answer: 1, explain: '<b>KCDs</b> are community-organised local events supported by the CNCF. KubeCon + CloudNativeCon is the CNCF flagship conference, and certifications and Steering meetings are unrelated.', ref: 'https://www.cncf.io/kubecon-cloudnativecon-events/' },
    { q: 'How many Kubernetes minor releases are published per year under the current release cadence?', options: ['1', '2', '3', '4'], answer: 2, explain: 'Kubernetes ships <b>three</b> minor releases per year, each supported with patches for about 14 months. The cadence moved from four to three releases a year in 2021.', ref: 'https://kubernetes.io/releases/release/' },
    { q: 'An engineer’s main job is building self-service templates, a developer portal and golden paths so application teams can deploy without deep Kubernetes knowledge. Which role is this?', options: ['FinOps practitioner', 'Platform engineer', 'Site Reliability Engineer', 'Cloud architect'], answer: 1, explain: '<b>Platform engineers</b> build internal developer platforms with self-service and golden paths. SREs focus on reliability and SLOs, FinOps on cost, and cloud architects on overall architecture design.', ref: 'https://glossary.cncf.io/platform-engineering/' },
    { q: 'Which CNCF project is a framework for building internal developer portals with a software catalog and templates?', options: ['Backstage', 'Harbor', 'Argo', 'Crossplane'], answer: 0, explain: '<b>Backstage</b> (created at Spotify, CNCF incubating) provides a software catalog, scaffolder templates and TechDocs. Harbor is a registry, Argo a set of workflow and GitOps tools, and Crossplane manages infrastructure through Kubernetes APIs.', ref: 'https://backstage.io/docs/overview/what-is-backstage' },
    { q: 'In a Kubernetes pull request, what does the <code>/approve</code> Prow command indicate?', options: ['The CLA has been signed', 'An approver listed in the OWNERS file accepts the change', 'The tests should be re-run', 'The PR should be blocked from merging'], answer: 1, explain: '<b>/approve</b> comes from an <b>approver</b> in the relevant OWNERS file; combined with a reviewer’s <code>/lgtm</code> the PR can merge. <code>/retest</code> re-runs tests and <code>/hold</code> blocks merging; CLA status is checked automatically.', ref: 'https://github.com/kubernetes/community/blob/main/contributors/guide/owners.md' },
    { q: 'Which TWO certifications are performance-based (hands-on) exams? (Select 2)', options: ['KCNA', 'CKA', 'KCSA', 'CKAD'], answer: [1, 3], explain: '<b>CKA</b> and <b>CKAD</b> (and CKS) are solved in a live command-line environment. <b>KCNA</b> and <b>KCSA</b> are multiple-choice associate exams.', ref: ['https://training.linuxfoundation.org/certification/kubernetes-cloud-native-associate/', 'https://www.cncf.io/training/kubestronaut/'] },
    { q: 'Which practice best describes DevSecOps?', options: ['Running a separate security review only after deployment to production', 'Giving the security team sole ownership of the CI/CD pipeline', 'Replacing developers with automated security tools', 'Integrating security checks early and throughout the delivery pipeline (“shift left”)'], answer: 3, explain: '<b>DevSecOps</b> builds security into every stage, from code and image scanning to policy and runtime protection: <b>shift left</b>. A late, separate security gate is the opposite, and ownership stays shared rather than moving to one team.', ref: 'https://glossary.cncf.io/devsecops/' },
  ],
});
