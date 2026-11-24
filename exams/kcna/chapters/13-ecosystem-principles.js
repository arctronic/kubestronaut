KS.registerChapter('kcna', {
  id: 'ecosystem',
  title: 'Cloud Native Ecosystem & Principles',
  subtitle: 'What “cloud native” means, how it scales, the open standards behind it and which CNCF project does what',
  icon: '🌐',
  minutes: 35,
  objectives: [
    'Quote the CNCF definition of cloud native and apply its principles (microservices, 12-factor, immutable infrastructure, cattle not pets)',
    'Choose between HPA, VPA, Cluster Autoscaler, Karpenter and KEDA for a scaling scenario',
    'Explain serverless on Kubernetes with Knative, CloudEvents and FaaS',
    'Name the open standards (OCI, CRI, CNI, CSI, Gateway API, OpenTelemetry) and what each standardises',
    'Recognise CNCF maturity levels and match well-known projects to their job',
  ],

  slides: [
    {
      kicker: 'Definition',
      title: 'What does “cloud native” mean?',
      blocks: [
        { type: 'callout', kind: 'exam', title: 'CNCF Cloud Native Definition (v1.0)', html: '“Cloud native technologies empower organizations to build and run <b>scalable</b> applications in modern, dynamic environments such as <b>public, private, and hybrid clouds</b>. <b>Containers, service meshes, microservices, immutable infrastructure, and declarative APIs</b> exemplify this approach. These techniques enable <b>loosely coupled</b> systems that are <b>resilient, manageable, and observable</b>. Combined with robust <b>automation</b>, they allow engineers to make high-impact changes frequently and predictably with minimal toil.”' },
        { type: 'cards', cols: 3, items: [
          { icon: '📦', color: 'blue', title: 'Containers', text: 'Portable, immutable packaging of an app and its dependencies.' },
          { icon: '🧱', color: 'purple', title: 'Microservices', text: 'Small, independently deployable services owned by small teams.' },
          { icon: '🕸️', color: 'teal', title: 'Service mesh', text: 'Traffic management, mTLS and telemetry between services.' },
          { icon: '🧊', color: 'gray', title: 'Immutable infrastructure', text: 'Replace instead of patch in place.' },
          { icon: '📜', color: 'green', title: 'Declarative APIs', text: 'Describe desired state; controllers converge to it.' },
          { icon: '🤖', color: 'amber', title: 'Automation', text: 'CI/CD, GitOps and autoscaling remove manual toil.' },
        ] },
      ],
      tip: 'Cloud native is about <b>how</b> you build and run apps, not <b>where</b>. It applies on-premises and in hybrid clouds too; “runs only in a public cloud” is a classic wrong option.',
    },

    {
      kicker: 'Architecture',
      title: 'Monolith vs microservices',
      blocks: [
        { type: 'compare', headers: ['', 'Monolith', 'Microservices'], rows: [
          ['Deployment unit', 'One large application', 'Many small, independently deployable services'],
          ['Scaling', 'Scale the whole app', 'Scale each service separately'],
          ['Failure impact', 'One bug can take down everything', 'Failures can be isolated (with good design)'],
          ['Technology', 'Usually one stack', 'Each service may choose its language and data store'],
          ['Communication', 'In-process function calls', 'Network calls: REST, gRPC, messaging'],
          ['Complexity', 'Simple to run, hard to change at scale', 'Easy to change per service, hard to operate (needs observability, mesh, automation)'],
        ] },
        { type: 'callout', kind: 'trap', title: 'Microservices are not free', html: 'Microservices add network latency, distributed failures and operational overhead. That is exactly why cloud native tooling (orchestration, service mesh, tracing) exists. A small team with a simple app may be better served by a well-structured monolith.' },
      ],
      tip: 'Exam cue: “scale and deploy components independently”, “loosely coupled”, “own data store per service” → <b>microservices</b>.',
    },

    {
      kicker: 'Design principles',
      title: 'The Twelve-Factor App',
      blocks: [
        { type: 'text', html: 'The <b>Twelve-Factor App</b> methodology (written by Heroku engineers) describes how to build apps that run well on modern platforms. Kubernetes maps naturally onto it. Flip the factors that show up most in exam questions:' },
        { type: 'flip', items: [
          { front: '⚙️ III. Config', back: 'Store config in the <b>environment</b>, not in code. In Kubernetes: ConfigMaps, Secrets and env vars, so one image runs in every environment.' },
          { front: '🔗 IV. Backing services', back: 'Treat databases, queues and caches as <b>attached resources</b> reached by URL or credentials, swappable without code changes.' },
          { front: '🏗️ V. Build, release, run', back: 'Strictly separate stages: build an immutable image, combine it with config to make a release, then run it.' },
          { front: '🫥 VI. Processes', back: 'Run the app as one or more <b>stateless</b> processes. Persist state in a backing service, so any replica can serve any request.' },
          { front: '⚡ IX. Disposability', back: 'Fast startup and <b>graceful shutdown</b> (handle SIGTERM). Pods can be killed and replaced at any time.' },
          { front: '🪞 X. Dev/prod parity', back: 'Keep development, staging and production as similar as possible; containers make this much easier.' },
          { front: '📜 XI. Logs', back: 'Treat logs as <b>event streams</b>: write to stdout and let the platform collect and route them.' },
          { front: '📈 VIII. Concurrency', back: 'Scale <b>out</b> by running more processes (replicas), not by making one process bigger.' },
        ] },
        { type: 'callout', kind: 'info', title: 'All twelve', html: 'I Codebase · II Dependencies · III Config · IV Backing services · V Build, release, run · VI Processes · VII Port binding · VIII Concurrency · IX Disposability · X Dev/prod parity · XI Logs · XII Admin processes.' },
      ],
      tip: '“Store configuration in environment variables, separate from code” is factor III. “Write logs to stdout as an event stream” is factor XI.',
    },

    {
      kicker: 'Operations mindset',
      title: 'Immutable infrastructure: cattle, not pets',
      blocks: [
        { type: 'compare', headers: ['', 'Pets', 'Cattle'], rows: [
          ['Identity', 'Unique, hand-named servers (db-master-01)', 'Numbered, interchangeable instances'],
          ['When sick', 'Nursed back to health (SSH, patch, reboot)', 'Replaced with a fresh identical copy'],
          ['Changes', 'Mutable: patched in place, configuration drift', 'Immutable: rebuild the image and redeploy'],
          ['Kubernetes example', 'A hand-configured VM nobody dares to touch', 'Pods managed by a Deployment or ReplicaSet'],
        ] },
        { type: 'cards', items: [
          { icon: '🧊', color: 'blue', title: 'Immutable infrastructure', text: 'Servers and containers are never modified after deployment. A change means a new image or new instance, so every environment is reproducible.' },
          { icon: '🧾', color: 'green', title: 'Infrastructure as Code', text: 'Infrastructure is described in version-controlled files (Terraform/OpenTofu, Crossplane, Kubernetes YAML) and applied automatically.' },
          { icon: '🔁', color: 'purple', title: 'Rollback is a redeploy', text: 'Because the old image still exists, rolling back means deploying the previous version, not undoing manual changes.' },
        ] },
        { type: 'callout', kind: 'warn', title: 'Anti-pattern', html: '<code>kubectl exec</code> into a running container to install a patch breaks immutability: the change disappears when the Pod is replaced and drifts from what Git says.' },
      ],
      tip: 'If an option says “SSH into the server and patch it”, it is the <b>pets</b> approach. Cloud native answers replace instead of repair.',
    },

    {
      kicker: 'Resilience',
      title: 'Loose coupling and designing for failure',
      blocks: [
        { type: 'text', html: 'In a distributed system, something is always failing. Cloud native apps assume failure and limit its blast radius. <b>Loose coupling</b> means services depend on stable interfaces (APIs, events) rather than each other’s internals, so they can change, fail and scale independently.' },
        { type: 'cards', cols: 3, items: [
          { icon: '🔁', color: 'blue', title: 'Retries with backoff', text: 'Retry transient errors with exponential backoff and jitter; never hammer a struggling service.' },
          { icon: '⏱️', color: 'amber', title: 'Timeouts', text: 'Every network call needs a deadline so one slow dependency does not block everything.' },
          { icon: '🔌', color: 'red', title: 'Circuit breaker', text: 'Stop calling a failing dependency for a while and fail fast; often provided by a service mesh (Envoy).' },
          { icon: '❤️‍🩹', color: 'green', title: 'Health probes', text: 'Liveness restarts stuck containers; readiness removes unready Pods from Service endpoints.' },
          { icon: '📬', color: 'purple', title: 'Async messaging', text: 'Queues and events decouple producers from consumers in time (e.g. NATS, Kafka).' },
          { icon: '🧯', color: 'teal', title: 'Graceful degradation', text: 'Serve a reduced experience (cached data, hide a feature) instead of failing completely.' },
        ] },
        { type: 'check', q: 'Which design choice most directly makes a microservice <i>loosely coupled</i>?', options: ['Sharing one database schema between all services', 'Communicating through a stable, versioned API or events', 'Deploying all services in the same Pod', 'Calling another service’s internal functions through a shared library'], answer: 1, explain: 'Loose coupling means depending only on a <b>stable contract</b> (API or event schema). A shared database schema, a shared Pod or calling internals all tie services together so they must change and deploy in lockstep.', ref: 'https://glossary.cncf.io/loosely-coupled-architecture/' },
      ],
      tip: 'Chaos engineering (e.g. the CNCF project Chaos Mesh or LitmusChaos) deliberately injects failure to prove resilience.',
    },

    {
      kicker: 'Autoscaling · interactive',
      title: 'Who scales what?',
      blocks: [
        { type: 'diagram', width: 900, height: 440,
          caption: 'Click a component for details, or press ▶ Play to follow a traffic spike.',
          groups: [
            { x: 20, y: 20, w: 300, h: 400, label: 'Signals', color: 'blue' },
            { x: 340, y: 20, w: 250, h: 400, label: 'Autoscalers', color: 'purple' },
            { x: 610, y: 20, w: 270, h: 400, label: 'What changes', color: 'green' },
          ],
          nodes: [
            { id: 'traffic', x: 45, y: 55, w: 250, h: 56, label: 'Traffic spike', icon: '📈', sub: 'CPU climbs on Pods', color: 'red', info: 'Load increases: CPU per Pod rises above the target defined in the HPA.' },
            { id: 'ms', x: 45, y: 150, w: 250, h: 56, label: 'metrics-server', icon: '📊', sub: 'Metrics API', color: 'blue', info: 'Provides current CPU and memory per Pod through <code>metrics.k8s.io</code>. Custom and external metrics come from adapters (e.g. a Prometheus adapter, KEDA).' },
            { id: 'events', x: 45, y: 250, w: 250, h: 56, label: 'Event source', icon: '📬', sub: 'queue length, Kafka lag', color: 'teal', info: 'External event sources (message queues, streams, cron, databases) that KEDA scalers can read.' },
            { id: 'pending', x: 45, y: 345, w: 250, h: 56, label: 'Pending Pods', icon: '⏳', sub: 'no node has room', color: 'amber', info: 'Pods the scheduler cannot place because no node has enough free resources (FailedScheduling).' },
            { id: 'hpa', x: 365, y: 100, w: 200, h: 56, label: 'HPA', icon: '↔️', sub: 'more / fewer Pods', color: 'purple', info: 'HorizontalPodAutoscaler (<code>autoscaling/v2</code>) changes <code>replicas</code> on a Deployment or StatefulSet based on resource, custom or external metrics. Built into the controller manager.' },
            { id: 'keda', x: 365, y: 200, w: 200, h: 56, label: 'KEDA', icon: '⚡', sub: 'event-driven, 0↔N', color: 'pink', info: 'Kubernetes Event-driven Autoscaling (CNCF graduated). A ScaledObject defines triggers; KEDA activates from zero and feeds metrics to an HPA it manages for 1↔N.' },
            { id: 'vpa', x: 365, y: 280, w: 200, h: 50, label: 'VPA', icon: '↕️', sub: 'bigger / smaller', color: 'gray', info: 'VerticalPodAutoscaler (add-on): recommends or sets CPU/memory requests. Applying changes has traditionally meant recreating Pods. Do not combine with an HPA on the same CPU/memory metric.' },
            { id: 'ca', x: 365, y: 350, w: 200, h: 56, label: 'Cluster Autoscaler\nor Karpenter', color: 'amber', fs: 12.5, info: '<b>Cluster Autoscaler</b> resizes existing node groups when Pods are Pending or nodes are underused. <b>Karpenter</b> (Kubernetes SIG Autoscaling subproject, originally from AWS) provisions right-sized nodes directly from Pod requirements.' },
            { id: 'pods', x: 640, y: 150, w: 210, h: 60, label: 'Pod replicas', icon: '🫛', sub: 'horizontal', color: 'blue', info: 'More or fewer copies of the same Pod.' },
            { id: 'res', x: 640, y: 255, w: 210, h: 56, label: 'Pod requests', icon: '📏', sub: 'vertical', color: 'gray', info: 'CPU and memory requests/limits per container.' },
            { id: 'nodes', x: 640, y: 350, w: 210, h: 56, label: 'Nodes', icon: '🖥️', sub: 'cluster capacity', color: 'green', info: 'Machines added to or removed from the cluster.' },
          ],
          edges: [
            { from: 'traffic', to: 'ms', color: 'red' },
            { from: 'ms', to: 'hpa', label: 'CPU %', color: 'blue' },
            { from: 'events', to: 'keda', label: 'scalers', color: 'teal' },
            { from: 'hpa', to: 'pods', label: 'replicas', color: 'purple' },
            { from: 'keda', to: 'pods', color: 'pink' },
            { from: 'ms', to: 'vpa', color: 'blue', dashed: true },
            { from: 'vpa', to: 'res', color: 'gray' },
            { from: 'pods', to: 'pending', color: 'amber', dashed: true, bend: 60 },
            { from: 'pending', to: 'ca', label: 'watch', color: 'amber' },
            { from: 'ca', to: 'nodes', label: 'add node', color: 'amber' },
          ],
          steps: [
            { on: ['traffic', 'ms', 'traffic>ms'], text: 'A traffic spike raises CPU usage. <b>metrics-server</b> exposes the new per-Pod usage through the Metrics API.' },
            { on: ['ms', 'hpa', 'pods', 'ms>hpa', 'hpa>pods'], text: 'The <b>HPA</b> compares usage with its target (e.g. 70% of requested CPU) and raises <code>replicas</code>: desired = ceil(current × current / target).' },
            { on: ['pods', 'pending', 'pods>pending'], text: 'Some new Pods stay <b>Pending</b>: no node has enough unrequested CPU or memory.' },
            { on: ['pending', 'ca', 'nodes', 'pending>ca', 'ca>nodes'], text: '<b>Cluster Autoscaler</b> (or <b>Karpenter</b>) sees unschedulable Pods and adds a node; the scheduler then places them.' },
            { on: ['events', 'keda', 'pods', 'events>keda', 'keda>pods'], text: 'For queue-driven workers, <b>KEDA</b> scales on event metrics, including from <b>zero</b> when messages arrive and back to zero when idle.' },
            { on: ['ms', 'vpa', 'res', 'ms>vpa', 'vpa>res'], text: 'Independently, the <b>VPA</b> learns real usage and right-sizes CPU/memory <b>requests</b> for each container.' },
          ],
        },
      ],
      tip: '<b>HPA</b> = more Pods · <b>VPA</b> = bigger Pods · <b>Cluster Autoscaler / Karpenter</b> = more nodes · <b>KEDA</b> = event-driven, scale to zero.',
    },

    {
      kicker: 'Autoscaling',
      title: 'HPA in YAML and how the autoscalers compare',
      blocks: [
        { type: 'cols', ratio: '1fr 1.1fr', cols: [
          [
            { type: 'code', lang: 'yaml', title: 'hpa.yaml', code: `
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70`, notes: {
              1: '<code>autoscaling/v2</code> supports resource, custom, object and external metrics.',
              6: '<b>scaleTargetRef</b>: the workload whose <code>replicas</code> the HPA controls (Deployment, StatefulSet, ReplicaSet).',
              10: 'A plain HPA never goes below 1 replica. Scale to zero needs KEDA or Knative.',
              18: 'Utilization is a percentage of the container <b>requests</b>. Without CPU requests the HPA cannot compute it.',
            } },
          ],
          [
            { type: 'compare', headers: ['Tool', 'Scales', 'Based on'], rows: [
              ['HPA', 'Pod replicas (out/in)', 'CPU, memory, custom/external metrics'],
              ['VPA', 'Pod CPU/memory requests (up/down)', 'Observed usage history'],
              ['Cluster Autoscaler', 'Nodes in existing node groups', 'Pending Pods, underused nodes'],
              ['Karpenter', 'Nodes, chosen just-in-time', 'Requirements of Pending Pods'],
              ['KEDA', 'Replicas, including to/from zero', 'Events: queues, streams, cron, etc.'],
              ['Knative (KPA)', 'Revisions, including to zero', 'Concurrent requests / RPS'],
            ] },
          ],
        ] },
        { type: 'callout', kind: 'trap', title: 'Classic confusion', html: '“Add more nodes when Pods cannot be scheduled” is <b>not</b> the HPA. The HPA only changes replica counts; capacity comes from the <b>Cluster Autoscaler</b> or <b>Karpenter</b>.' },
      ],
      tip: 'HPA needs <b>metrics-server</b> (for CPU/memory) and Pods with <b>resource requests</b>.',
    },

    {
      kicker: 'Serverless',
      title: 'Serverless, FaaS, Knative and CloudEvents',
      blocks: [
        { type: 'text', html: '<b>Serverless</b> does not mean “no servers”: it means developers do not manage them. The platform handles provisioning and scaling (including to zero), and you typically pay per use. <b>FaaS</b> (Function as a Service) is the best-known form: deploy a function, the platform runs it on demand.' },
        { type: 'cards', cols: 2, items: [
          { icon: '🚀', color: 'blue', title: 'Knative Serving', text: 'Runs stateless containers with request-driven autoscaling, <b>scale to zero</b>, immutable <b>Revisions</b> and traffic splitting between them.' },
          { icon: '📨', color: 'purple', title: 'Knative Eventing', text: 'Event sources, <b>Brokers</b> and <b>Triggers</b> route events to services. Events are expressed as CloudEvents.' },
          { icon: '✉️', color: 'green', title: 'CloudEvents', text: 'CNCF graduated <b>specification</b> for describing event data in a common way across services, platforms and clouds.' },
          { icon: 'λ', color: 'amber', title: 'OpenFaaS & others', text: 'OpenFaaS is a popular open-source FaaS framework for Kubernetes (independent, not a CNCF-hosted project). Cloud FaaS: AWS Lambda, Azure Functions, Google Cloud Run functions.' },
        ] },
        { type: 'code', lang: 'bash', title: 'a CloudEvent in HTTP binary mode', code: `
POST /orders HTTP/1.1
ce-specversion: 1.0
ce-type: com.example.order.created
ce-source: /shop/checkout
ce-id: 8f2a1c
Content-Type: application/json

{"orderId": 42, "total": 19.99}`, notes: {
          2: 'Required CloudEvents attributes: <b>specversion</b>, <b>type</b>, <b>source</b>, <b>id</b>. Here they travel as <code>ce-</code> HTTP headers.',
          3: '<code>type</code> describes what happened; consumers (e.g. Knative Triggers) filter on it.',
          8: 'The event payload itself is ordinary data.',
        } },
      ],
      tip: 'Exam cue: “common format to describe events” = <b>CloudEvents</b>. “Serverless platform on Kubernetes with scale to zero” = <b>Knative</b>.',
    },

    {
      kicker: 'Open standards',
      title: 'Interfaces that keep the ecosystem pluggable',
      blocks: [
        { type: 'compare', headers: ['Standard', 'Standardises', 'Examples of implementations'], rows: [
          ['OCI (Open Container Initiative)', 'Image format, runtime and distribution (registry) specs', 'runc, crun, any OCI registry'],
          ['CRI (Container Runtime Interface)', 'kubelet ↔ container runtime (gRPC)', 'containerd, CRI-O'],
          ['CNI (Container Network Interface)', 'Pod network setup', 'Calico, Cilium, Flannel'],
          ['CSI (Container Storage Interface)', 'Storage provisioning and attachment', 'AWS EBS, Ceph (Rook), Longhorn drivers'],
          ['Gateway API', 'Role-oriented L4/L7 traffic routing (successor of Ingress); GA v1.0 in Oct 2023', 'Envoy Gateway, Istio, Cilium, NGINX'],
          ['OpenTelemetry / OTLP', 'Telemetry APIs, SDKs and protocol', 'OTel SDKs, Collector, many backends'],
          ['CloudEvents', 'Event data format', 'Knative Eventing, cloud event buses'],
          ['SMI (Service Mesh Interface)', 'Mesh API: <b>archived</b>; mesh work moved to the Gateway API GAMMA initiative', 'historical'],
        ] },
        { type: 'callout', kind: 'trap', title: 'OCI is not part of the CNCF', html: 'The <b>Open Container Initiative</b> is a separate Linux Foundation project. CRI, CNI and CSI are plugin interfaces used <i>by Kubernetes</i>; OCI defines the image and runtime formats that make “build once, run anywhere” possible.' },
      ],
      tip: 'Mnemonic: <b>CRI</b> = Runtime, <b>CNI</b> = Network, <b>CSI</b> = Storage, <b>OCI</b> = the image/runtime format underneath.',
    },

    {
      kicker: 'CNCF landscape',
      title: 'Landscape categories and maturity levels',
      blocks: [
        { type: 'cols', cols: [
          [
            { type: 'layers', title: 'CNCF landscape layers', items: [
              { label: 'App Definition & Development', sub: 'databases, streaming, app delivery, CI/CD', color: 'blue' },
              { label: 'Orchestration & Management', sub: 'scheduling, coordination, service mesh, API gateway', color: 'purple' },
              { label: 'Runtime', sub: 'container runtime, cloud native storage and network', color: 'pink' },
              { label: 'Provisioning', sub: 'automation, registries, security & compliance, key mgmt', color: 'amber' },
            ] },
            { type: 'callout', kind: 'info', title: 'Cross-cutting columns', html: '<b>Observability & Analysis</b> and <b>Platform</b> (certified distributions, hosted Kubernetes) span all layers. <b>Serverless</b> has its own section.' },
          ],
          [
            { type: 'timeline', items: [
              { when: 'Sandbox', title: 'Early stage', text: 'Entry point for new, experimental projects. Low bar to join, no endorsement of production readiness.' },
              { when: 'Incubating', title: 'Growing adoption', text: 'Used in production by several end users, healthy contributor base. Example: OpenTelemetry, Backstage.' },
              { when: 'Graduated', title: 'Mature & widely adopted', text: 'Proven adoption, security audit, solid governance. Example: Kubernetes, Prometheus, Envoy.' },
              { when: 'Archived', title: 'No longer active', text: 'Inactive or superseded projects, e.g. OpenTracing (replaced by OpenTelemetry) and SMI.' },
            ] },
          ],
        ] },
      ],
      tip: 'Order: <b>Sandbox → Incubating → Graduated</b>. A project may apply straight to Incubating, but these are the three maturity levels.',
    },

    {
      kicker: 'Know your projects',
      title: 'Well-known graduated and incubating projects',
      blocks: [
        { type: 'cards', cols: 3, items: [
          { icon: '☸️', color: 'blue', title: 'Orchestration & runtime', text: '<b>Graduated</b>: Kubernetes, etcd, containerd, CRI-O, CoreDNS, Rook (storage).' },
          { icon: '🕸️', color: 'purple', title: 'Networking & mesh', text: '<b>Graduated</b>: Envoy (proxy), Istio, Linkerd (service meshes), Cilium (eBPF CNI).' },
          { icon: '🔭', color: 'amber', title: 'Observability', text: '<b>Graduated</b>: Prometheus, Jaeger, Fluentd (incl. Fluent Bit). <b>Incubating</b>: OpenTelemetry, Thanos, Cortex.' },
          { icon: '🚚', color: 'green', title: 'Delivery & GitOps', text: '<b>Graduated</b>: Helm (package manager), Argo, Flux, Harbor (registry).' },
          { icon: '🔐', color: 'red', title: 'Security & policy', text: '<b>Graduated</b>: OPA (policy), Falco (runtime threat detection), SPIFFE and SPIRE (workload identity), TUF (secure updates).' },
          { icon: '⚡', color: 'teal', title: 'Scaling, events, data', text: '<b>Graduated</b>: KEDA, CloudEvents, Vitess (MySQL sharding), TiKV (distributed KV). <b>Incubating</b>: Backstage (developer portal), gRPC, NATS.' },
        ] },
        { type: 'callout', kind: 'trap', title: 'Not CNCF projects', html: '<b>Grafana</b> (Grafana Labs), <b>Docker Engine</b>, <b>Terraform</b> and <b>Jenkins</b> are not CNCF projects, even though they appear in the landscape or in cloud native stacks. <b>Karpenter</b>, <b>Cluster Autoscaler</b> and <b>Gateway API</b> are Kubernetes SIG subprojects, so they live under the Kubernetes project.' },
      ],
      tip: 'Kubernetes was the first CNCF project and the first to graduate; Prometheus was the second to join and the second to graduate.',
    },

    {
      kicker: 'Practice',
      title: 'Which project for which job?',
      blocks: [
        { type: 'match', pairs: [
          ['Service proxy used as the data plane of many meshes', 'Envoy'],
          ['Policy engine using the Rego language', 'Open Policy Agent'],
          ['Runtime threat detection from syscalls', 'Falco'],
          ['Cloud native container registry with scanning and signing', 'Harbor'],
          ['Kubernetes package manager using charts', 'Helm'],
          ['GitOps continuous delivery with a web UI', 'Argo CD'],
          ['Cloud native storage orchestrator for Ceph', 'Rook'],
          ['Event-driven autoscaling with scale to zero', 'KEDA'],
          ['Cluster DNS and service discovery', 'CoreDNS'],
          ['Internal developer portal and software catalog', 'Backstage'],
        ] },
        { type: 'check', q: 'A team wants every workload to get a cryptographically verifiable identity that works across clusters and clouds. Which CNCF projects are designed for this?', options: ['SPIFFE and SPIRE', 'Vitess and TiKV', 'CoreDNS and etcd', 'Harbor and TUF'], answer: 0, explain: '<b>SPIFFE</b> is the standard for workload identity (SPIFFE IDs and SVIDs) and <b>SPIRE</b> is its reference implementation. Vitess and TiKV are databases, CoreDNS and etcd provide DNS and key-value storage, and Harbor/TUF secure images and updates rather than workload identity.', ref: 'https://spiffe.io/docs/latest/spiffe-about/overview/' },
      ],
      tip: 'Rego → OPA. Syscalls/eBPF runtime alerts → Falco. Charts → Helm. Ceph → Rook. MySQL sharding → Vitess.',
    },
  ],

  summary: [
    'CNCF definition: scalable apps in public, private and hybrid clouds using <b>containers, service meshes, microservices, immutable infrastructure and declarative APIs</b>; loosely coupled, resilient, manageable, observable, automated.',
    '<b>Microservices</b> deploy and scale independently; the <b>Twelve-Factor App</b> adds config in the environment, stateless processes, disposability and logs as event streams.',
    '<b>Immutable infrastructure</b> and <b>cattle, not pets</b>: replace instead of patch; design for failure with timeouts, retries, circuit breakers and probes.',
    'Autoscaling: <b>HPA</b> = more Pods, <b>VPA</b> = bigger Pods, <b>Cluster Autoscaler / Karpenter</b> = more nodes, <b>KEDA</b> = event-driven incl. scale to zero.',
    'Serverless on Kubernetes: <b>Knative</b> Serving (scale to zero, revisions) and Eventing; <b>CloudEvents</b> is the event format spec.',
    'Open standards: <b>OCI</b> (image/runtime), <b>CRI</b>, <b>CNI</b>, <b>CSI</b>, <b>Gateway API</b>, <b>OpenTelemetry</b>; SMI is archived.',
    'Maturity: <b>Sandbox → Incubating → Graduated</b> (and Archived). OpenTelemetry and Backstage are incubating; Kubernetes, Prometheus, Envoy, Helm, Argo, Flux, Istio, Cilium, KEDA, Falco are graduated.',
  ],

  glossary: [
    { term: 'Cloud native', def: 'Building and running scalable apps in dynamic environments using containers, service meshes, microservices, immutable infrastructure and declarative APIs.' },
    { term: 'Microservices', def: 'An architecture of small, loosely coupled, independently deployable services communicating over the network.' },
    { term: 'Twelve-Factor App', def: 'Methodology of 12 practices (config in env, stateless processes, disposability, logs as streams…) for portable, scalable apps.' },
    { term: 'Immutable infrastructure', def: 'Infrastructure that is never modified after deployment; changes are made by replacing it with a new version.' },
    { term: 'Pets vs cattle', def: 'Unique, hand-maintained servers (pets) versus interchangeable, replaceable instances (cattle).' },
    { term: 'Loose coupling', def: 'Components depend only on stable interfaces, so they can change, fail and scale independently.' },
    { term: 'HPA', def: 'HorizontalPodAutoscaler: adjusts the number of Pod replicas based on observed metrics.' },
    { term: 'VPA', def: 'VerticalPodAutoscaler: recommends or sets container CPU/memory requests based on usage.' },
    { term: 'Cluster Autoscaler', def: 'Adds nodes when Pods are unschedulable and removes underused nodes, using node groups.' },
    { term: 'Karpenter', def: 'Node autoscaler (Kubernetes SIG Autoscaling subproject) that provisions right-sized nodes directly for Pending Pods.' },
    { term: 'KEDA', def: 'Kubernetes Event-driven Autoscaling: CNCF graduated project that scales workloads on event sources, including to zero.' },
    { term: 'Knative', def: 'Kubernetes-based platform for serverless workloads: Serving (scale to zero, revisions) and Eventing.' },
    { term: 'CloudEvents', def: 'CNCF graduated specification for describing event data in a common, interoperable format.' },
    { term: 'OCI', def: 'Open Container Initiative (Linux Foundation): image, runtime and distribution specifications for containers.' },
    { term: 'CNCF maturity levels', def: 'Sandbox, Incubating and Graduated: stages reflecting a project’s adoption, governance and stability.' },
  ],

  quiz: [
    { q: 'According to the CNCF definition, which set of techniques exemplifies the cloud native approach?', options: ['Virtual machines, mainframes and manual change tickets', 'Containers, service meshes, microservices, immutable infrastructure and declarative APIs', 'Monolithic applications deployed to a single public cloud', 'Serverless functions only'], answer: 1, explain: 'The CNCF definition explicitly lists <b>containers, service meshes, microservices, immutable infrastructure and declarative APIs</b>. Cloud native is not tied to one public cloud, to monoliths, or only to serverless.', ref: 'https://github.com/cncf/toc/blob/main/DEFINITION.md' },
    { q: 'Pods of a queue-processing Deployment should scale to zero when the queue is empty and scale out as messages arrive. Which project fits best?', options: ['VerticalPodAutoscaler', 'Cluster Autoscaler', 'HorizontalPodAutoscaler with a CPU target', 'KEDA'], answer: 3, explain: '<b>KEDA</b> scales on event sources such as queue length and can scale to and from <b>zero</b>. A plain CPU-based HPA keeps at least one replica and reacts to CPU, not queue depth; VPA changes Pod size; Cluster Autoscaler changes node count.', ref: 'https://keda.sh/docs/' },
    { q: 'Several Pods are stuck in Pending because no node has enough free CPU. Which component adds capacity to fix this?', options: ['Cluster Autoscaler', 'HorizontalPodAutoscaler', 'VerticalPodAutoscaler', 'metrics-server'], answer: 0, explain: 'The <b>Cluster Autoscaler</b> (or Karpenter) watches for unschedulable Pods and adds nodes. The HPA only changes replica counts (which may cause Pending Pods), the VPA resizes requests, and metrics-server only provides metrics.', ref: 'https://kubernetes.io/docs/concepts/cluster-administration/node-autoscaling/' },
    { q: 'Which Twelve-Factor principle is applied when a container image is configured through ConfigMaps and environment variables instead of hard-coded settings?', options: ['Dev/prod parity', 'Port binding', 'Config', 'Admin processes'], answer: 2, explain: 'Factor III, <b>Config</b>, says to store configuration in the environment, separate from code, so the same image runs in every environment. The other factors deal with environment similarity, exposing services via ports and one-off tasks.', ref: 'https://12factor.net/' },
    { q: 'A server has a configuration problem. Following the “cattle, not pets” and immutable infrastructure principles, what should you do?', options: ['SSH in and patch the configuration by hand', 'Replace it with a new instance built from a corrected image or template', 'Add a cron job that fixes the file every hour', 'Rename the server so it can be tracked separately'], answer: 1, explain: 'With <b>immutable infrastructure</b> you never fix in place; you <b>replace</b> the instance with a corrected version. Manual patching and cron fixes create configuration drift and treat the server as a pet.', ref: 'https://glossary.cncf.io/immutable-infrastructure/' },
    { q: 'Which specification defines a common format for describing event data so that events can be consumed across services and platforms?', options: ['OpenMetrics', 'CloudEvents', 'Container Network Interface', 'Gateway API'], answer: 1, explain: '<b>CloudEvents</b> (CNCF graduated) standardises event metadata such as id, source, type and specversion. OpenMetrics is a metrics format, CNI configures Pod networking, and Gateway API routes traffic.', ref: 'https://cloudevents.io/' },
    { q: 'Which TWO projects are CNCF graduated? (Select 2)', options: ['Envoy', 'OpenTelemetry', 'Argo', 'Backstage'], answer: [0, 2], explain: '<b>Envoy</b> and <b>Argo</b> are graduated. <b>OpenTelemetry</b> and <b>Backstage</b> are well-known <b>incubating</b> projects, a favourite trap because both are very widely used.', ref: 'https://www.cncf.io/projects/' },
    { q: 'What is the correct order of CNCF project maturity levels, from least to most mature?', options: ['Incubating → Sandbox → Graduated', 'Sandbox → Graduated → Incubating', 'Sandbox → Incubating → Graduated', 'Alpha → Beta → Stable'], answer: 2, explain: 'CNCF projects progress <b>Sandbox → Incubating → Graduated</b>. Alpha, beta and stable describe Kubernetes <i>API and feature</i> maturity, not CNCF project maturity.', ref: 'https://github.com/cncf/toc/blob/main/process/graduation_criteria.md' },
    { q: 'Which interface does the kubelet use to talk to container runtimes such as containerd and CRI-O?', options: ['CNI', 'CSI', 'OCI distribution spec', 'CRI'], answer: 3, explain: 'The <b>Container Runtime Interface</b> is the gRPC API between kubelet and runtime. CNI configures networking, CSI handles storage, and the OCI distribution spec defines how registries serve images.', ref: 'https://kubernetes.io/docs/concepts/containers/cri/' },
    { q: 'Which Knative component provides request-driven autoscaling, scale to zero and traffic splitting between revisions?', options: ['Knative Eventing', 'Knative Serving', 'Knative Broker', 'CloudEvents SDK'], answer: 1, explain: '<b>Knative Serving</b> runs stateless services with revisions, traffic splitting and scale to zero. <b>Eventing</b> (with Brokers and Triggers) routes events; CloudEvents is the event format.', ref: 'https://knative.dev/docs/' },
    { q: 'Which TWO statements about the VerticalPodAutoscaler are true? (Select 2)', options: ['It adjusts CPU and memory requests of containers based on observed usage', 'It adds nodes to the cluster when Pods are Pending', 'It should not be combined with an HPA that scales on the same CPU or memory metric', 'It is required for <code>kubectl top</code> to work'], answer: [0, 2], explain: 'The VPA right-sizes <b>requests</b>, and using it together with an HPA on the <b>same CPU/memory metric</b> makes them fight each other. Adding nodes is the Cluster Autoscaler’s job, and <code>kubectl top</code> needs metrics-server.', ref: 'https://kubernetes.io/docs/concepts/workloads/autoscaling/vertical-pod-autoscale/' },
    { q: 'Which project is a policy engine that uses the Rego language and is often used for Kubernetes admission control via Gatekeeper?', options: ['Open Policy Agent (OPA)', 'Falco', 'SPIRE', 'Harbor'], answer: 0, explain: '<b>OPA</b> evaluates policies written in <b>Rego</b>; Gatekeeper integrates it as an admission webhook. Falco detects runtime threats, SPIRE issues workload identities, and Harbor is a container registry.', ref: ['https://www.openpolicyagent.org/docs/latest/', 'https://open-policy-agent.github.io/gatekeeper/website/docs/'] },
  ],
});
