KS.registerChapter('kcna', {
  id: 'scheduling',
  title: 'Scheduling',
  subtitle: 'How the kube-scheduler decides <i>where</i> every Pod runs, and every knob you have to steer it',
  icon: '🧭',
  minutes: 40,
  objectives: [
    'Explain the filter → score → bind cycle and why resource <b>requests</b> (not limits) drive placement',
    'Choose correctly between nodeName, nodeSelector, node affinity, pod (anti-)affinity, taints & tolerations and topology spread',
    'Describe taint effects (NoSchedule, PreferNoSchedule, NoExecute) and what a toleration does and does not do',
    'Explain PriorityClass and preemption, DaemonSet placement and custom schedulers',
    'Diagnose why a Pod is stuck in <i>Pending</i> from its FailedScheduling event',
  ],

  slides: [
    {
      kicker: 'The job',
      title: 'What the kube-scheduler does (and does not do)',
      blocks: [
        { type: 'text', html: 'Every new Pod starts with an empty <code>spec.nodeName</code>. The <b>kube-scheduler</b> watches the API server for such Pods, picks the best node for each one, and records the decision by creating a <b>Binding</b>, which sets <code>nodeName</code>. That is all. It never starts containers, pulls images or moves running Pods.' },
        { type: 'cards', items: [
          { icon: '👀', color: 'blue', title: 'Watches', text: 'Unscheduled Pods (no <code>nodeName</code>) whose <code>schedulerName</code> is <code>default-scheduler</code>.' },
          { icon: '🧮', color: 'purple', title: 'Decides', text: 'Filters out nodes that cannot run the Pod, scores the rest, picks the highest score.' },
          { icon: '✍️', color: 'teal', title: 'Binds', text: 'Writes the choice to the API server. The kubelet on that node then starts the Pod.' },
          { icon: '🚫', color: 'red', title: 'Does not rebalance', text: 'Once bound, a Pod stays put. Moving it means deleting it so a controller creates a new one (or using an add-on such as the Descheduler).' },
        ] },
        { type: 'callout', kind: 'trap', title: 'Classic distractor', html: '“The scheduler looks at actual CPU usage on each node.” <b>False.</b> It compares the Pod’s <b>requests</b> with the node’s <b>allocatable</b> capacity minus the requests of Pods already there. A node at 95% real CPU usage can still accept Pods if their requests fit.' },
      ],
      tip: 'Which component <b>decides</b> placement? kube-scheduler. Which one <b>runs</b> the Pod afterwards? The kubelet on the chosen node. Where is the decision stored? In <code>spec.nodeName</code>, via etcd.',
    },

    {
      kicker: 'Scheduling cycle · interactive',
      title: 'Filter → score → bind',
      blocks: [
        { type: 'diagram', width: 900, height: 420,
          caption: 'Press ▶ Play to follow one Pod through a scheduling cycle, or click any box.',
          groups: [
            { x: 340, y: 20, w: 540, h: 120, label: 'Candidate nodes', color: 'gray' },
          ],
          nodes: [
            { id: 'pod', x: 20, y: 60, w: 140, h: 56, label: 'New Pod', icon: '🫛', sub: 'nodeName: empty', color: 'blue', round: true, info: 'A Pod created by you or a controller (ReplicaSet, Job…). Its <code>spec.nodeName</code> is empty, so it is <i>Pending</i> and waiting to be scheduled.' },
            { id: 'api', x: 20, y: 180, w: 140, h: 56, label: 'kube-apiserver', color: 'blue', info: 'Stores the Pod in etcd. The scheduler and kubelets both <b>watch</b> the API server; they never talk to each other directly.' },
            { id: 'queue', x: 190, y: 180, w: 140, h: 56, label: 'Scheduling\nqueue', sub: 'by priority', color: 'purple', fs: 13, info: 'Pending Pods wait in a queue ordered by <b>priority</b> (from their PriorityClass). Higher-priority Pods are scheduled first.' },
            { id: 'filter', x: 360, y: 180, w: 140, h: 56, label: 'Filter', sub: 'can it run here?', color: 'amber', info: 'Hard rules remove nodes: not enough allocatable CPU/memory for the <b>requests</b>, an untolerated <b>NoSchedule/NoExecute taint</b>, a failing <b>nodeSelector / required node affinity</b>, required pod anti-affinity, a <b>DoNotSchedule</b> spread constraint, volume zone conflicts, host port conflicts.' },
            { id: 'score', x: 530, y: 180, w: 140, h: 56, label: 'Score', sub: 'where is best?', color: 'green', info: 'Each remaining (feasible) node gets points from scoring plugins: spreading load (least allocated), balanced resources, <b>preferred</b> affinity weights, PreferNoSchedule taints, ScheduleAnyway spread, image already present (ImageLocality). Highest total wins; ties are broken randomly.' },
            { id: 'bind', x: 700, y: 180, w: 160, h: 56, label: 'Bind', sub: 'set nodeName', color: 'teal', info: 'The scheduler posts a <b>Binding</b> to the API server, which sets <code>spec.nodeName</code>. Pod status gets the <code>PodScheduled=True</code> condition.' },
            { id: 'n1', x: 355, y: 55, w: 120, h: 60, label: 'node-1', sub: 'Insufficient cpu', color: 'red', info: 'Filtered out: the sum of existing requests plus this Pod’s CPU request exceeds the node’s allocatable CPU.' },
            { id: 'n2', x: 485, y: 55, w: 120, h: 60, label: 'node-2', sub: 'untolerated taint', color: 'red', info: 'Filtered out: the node has a taint with effect NoSchedule that the Pod does not tolerate (for example the control-plane taint).' },
            { id: 'n3', x: 615, y: 55, w: 120, h: 60, label: 'node-3', sub: 'score 64', color: 'green', info: 'Feasible. Scored lower, for example because it is already busier in terms of requests.' },
            { id: 'n4', x: 745, y: 55, w: 120, h: 60, label: 'node-4', sub: 'score 91', color: 'green', info: 'Feasible and highest score. The Pod will be bound here.' },
            { id: 'pre', x: 360, y: 320, w: 140, h: 56, label: 'PostFilter', sub: 'preemption', color: 'amber', info: 'Runs only when <b>no node passed filtering</b>. The default PostFilter plugin tries <b>preemption</b>: evict lower-priority Pods on a node so this Pod fits. The Pod gets <code>status.nominatedNodeName</code> and is retried.' },
            { id: 'pending', x: 190, y: 320, w: 140, h: 56, label: 'Stays Pending', sub: 'FailedScheduling', color: 'red', info: 'If nothing fits and preemption cannot help, the Pod stays <i>Pending</i> and a <b>FailedScheduling</b> event explains why, e.g. “0/4 nodes are available: 2 Insufficient cpu, 2 node(s) had untolerated taint”. It is retried later.' },
            { id: 'kubelet', x: 700, y: 320, w: 160, h: 56, label: 'kubelet (node-4)', icon: '🤖', color: 'green', info: 'Watches for Pods whose nodeName is its own node, then pulls images and starts containers through the CRI runtime.' },
          ],
          edges: [
            { from: 'pod', to: 'api', label: 'create', color: 'blue' },
            { from: 'api', to: 'queue', label: 'watch', color: 'purple', dashed: true },
            { from: 'queue', to: 'filter', color: 'purple' },
            { from: 'filter', to: 'n1', color: 'red', dashed: true },
            { from: 'filter', to: 'n2', color: 'red', dashed: true },
            { from: 'filter', to: 'score', label: 'feasible', color: 'amber' },
            { from: 'score', to: 'n3', color: 'green', dashed: true },
            { from: 'score', to: 'n4', color: 'green', dashed: true },
            { from: 'score', to: 'bind', color: 'green' },
            { from: 'bind', to: 'api', label: 'Binding', color: 'teal', bend: 60 },
            { from: 'kubelet', to: 'api', label: 'watch', color: 'green', dashed: true, bend: -70 },
            { from: 'filter', to: 'pre', label: '0 nodes fit', color: 'amber', dashed: true },
            { from: 'pre', to: 'pending', color: 'red' },
          ],
          steps: [
            { on: ['pod', 'api', 'pod>api'], text: 'A Pod is created (directly or by a controller). It is stored with an empty <code>nodeName</code>, so its phase is <b>Pending</b>.' },
            { on: ['api', 'queue', 'api>queue'], text: 'The scheduler’s watch sees the unscheduled Pod and adds it to the <b>scheduling queue</b>, ordered by priority.' },
            { on: ['queue', 'filter', 'queue>filter', 'filter>n1', 'filter>n2', 'n1', 'n2'], text: '<b>Filtering</b> applies hard constraints to every node. node-1 lacks CPU for the request; node-2 has a taint the Pod does not tolerate. Both are removed.' },
            { on: ['filter', 'score', 'filter>score', 'score>n3', 'score>n4', 'n3', 'n4'], text: '<b>Scoring</b> ranks the feasible nodes (node-3, node-4) using soft preferences: resource balance, preferred affinity weights, spread, image locality. node-4 wins.' },
            { on: ['score', 'bind', 'score>bind', 'bind>api', 'api'], text: '<b>Bind</b>: the scheduler writes a Binding to the API server, which sets <code>spec.nodeName: node-4</code>.' },
            { on: ['kubelet', 'kubelet>api', 'api'], text: 'The <b>kubelet</b> on node-4 sees a Pod assigned to it and starts the containers. The scheduler’s work is done.' },
            { on: ['filter', 'pre', 'filter>pre', 'pre>pending', 'pending'], text: 'Alternative path: if <b>no</b> node passes filtering, <b>PostFilter</b> tries preemption. If that fails too, the Pod stays <b>Pending</b> with a <b>FailedScheduling</b> event.' },
          ],
        },
      ],
      tip: 'Hard rules (required affinity, nodeSelector, NoSchedule taints, requests) act in <b>filtering</b>. Soft rules (preferred affinity, PreferNoSchedule, ScheduleAnyway) only change <b>scores</b>.',
    },

    {
      kicker: 'Resources',
      title: 'Requests place Pods, limits cap them',
      blocks: [
        { type: 'cols', ratio: '1fr 1.2fr', cols: [
          [
            { type: 'code', lang: 'yaml', title: 'container resources', code: `
resources:
  requests:
    cpu: 500m
    memory: 256Mi
  limits:
    cpu: "1"
    memory: 512Mi`, notes: { 2: '<b>requests</b> = what the scheduler reserves on the node. The Pod only fits where allocatable minus already-requested is at least this much.', 3: '<code>500m</code> = 500 millicores = half a CPU core.', 4: '<code>Mi</code> = mebibytes (power of 2). <code>M</code> would be megabytes.', 5: '<b>limits</b> are enforced at runtime by the kubelet/runtime via cgroups. The scheduler ignores them for placement.', 6: 'Exceeding the CPU limit = <b>throttling</b> (the container slows down).', 7: 'Exceeding the memory limit = the container is <b>OOMKilled</b>.' } },
          ],
          [
            { type: 'compare', headers: ['', 'requests', 'limits'], rows: [
              ['Used by', 'kube-scheduler (placement)', 'kubelet + kernel cgroups (enforcement)'],
              ['Meaning', 'Guaranteed reservation', 'Hard ceiling'],
              ['CPU over the value', 'Allowed if spare CPU exists', 'Throttled'],
              ['Memory over the value', 'Allowed, but evicted first under pressure', 'OOMKilled'],
              ['Only one set?', 'If only limits are set, requests default to the limits', '-'],
            ] },
            { type: 'callout', kind: 'info', title: 'Allocatable, not capacity', html: 'A node’s <b>allocatable</b> = capacity minus what is reserved for the OS and Kubernetes daemons. <code>kubectl describe node</code> shows Capacity, Allocatable and “Allocated resources” (the sum of requests).' },
          ],
        ] },
        { type: 'check', q: 'A node has 4 CPU allocatable. Running Pods request 3.6 CPU in total, but actual usage is only 0.8 CPU. A new Pod requests 500m CPU. What happens?', options: ['It is scheduled there because real usage is low', 'The node is filtered out because 3.6 + 0.5 exceeds 4', 'It is scheduled and then throttled', 'The scheduler lowers the request to 400m'], answer: 1, explain: 'The scheduler only does bookkeeping on <b>requests</b>: 3.6 + 0.5 = 4.1 &gt; 4, so the node is infeasible (“Insufficient cpu”). Real usage is irrelevant for placement, throttling is about limits at runtime, and the scheduler never changes your requests.', ref: 'https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/' },
      ],
      tip: 'Pods with no requests at all can land almost anywhere, which is why setting requests is a best practice. Requests also feed the QoS class (Guaranteed, Burstable, BestEffort).',
    },

    {
      kicker: 'Simplest controls',
      title: 'nodeName and nodeSelector',
      blocks: [
        { type: 'cols', cols: [
          [
            { type: 'code', lang: 'yaml', title: 'nodeSelector', code: `
spec:
  nodeSelector:
    disktype: ssd
    kubernetes.io/os: linux
  containers:
  - name: db
    image: postgres:17`, notes: { 2: '<b>nodeSelector</b>: a map of labels. The node must carry <b>every</b> listed label (logical AND). Exact key=value matching only.', 3: 'You add custom labels yourself: <code>kubectl label nodes node-2 disktype=ssd</code>.', 4: 'Well-known labels are set automatically: <code>kubernetes.io/hostname</code>, <code>kubernetes.io/os</code>, <code>kubernetes.io/arch</code>, <code>topology.kubernetes.io/zone</code>, <code>topology.kubernetes.io/region</code>.' } },
          ],
          [
            { type: 'code', lang: 'yaml', title: 'nodeName', code: `
spec:
  nodeName: worker-2
  containers:
  - name: debug
    image: busybox:1.37`, notes: { 2: '<b>nodeName</b> bypasses the scheduler entirely. The kubelet on worker-2 simply runs the Pod. No filtering, no affinity, no NoSchedule taint check. If the node lacks resources the kubelet rejects the Pod (e.g. <i>OutOfcpu</i>); if the node does not exist, the Pod never runs.' } },
            { type: 'callout', kind: 'warn', title: 'Avoid nodeName in real workloads', html: 'Node names change, nodes die, and nothing reschedules the Pod elsewhere. It is mostly used by tools (and the scheduler itself writes it on bind).' },
          ],
        ] },
        { type: 'compare', headers: ['', 'nodeName', 'nodeSelector', 'node affinity'], rows: [
          ['Goes through scheduler?', 'No', 'Yes (filter)', 'Yes (filter + score)'],
          ['Expressiveness', 'One exact node', 'Label equality, AND only', 'Operators In, NotIn, Exists, DoesNotExist, Gt, Lt; OR between terms'],
          ['Soft preference possible?', 'No', 'No', 'Yes (preferred… with weight)'],
        ] },
      ],
      tip: '“Simplest way to make a Pod run only on nodes labeled <code>disktype=ssd</code>?” → <b>nodeSelector</b>. If the question mentions operators, OR logic or “preferably”, it wants <b>node affinity</b>.',
    },

    {
      kicker: 'Attract Pods to nodes',
      title: 'Node affinity: required vs preferred',
      blocks: [
        { type: 'cols', ratio: '1.2fr 1fr', cols: [
          [
            { type: 'code', lang: 'yaml', title: 'pod-with-node-affinity.yaml', code: `
apiVersion: v1
kind: Pod
metadata:
  name: ml-train
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: topology.kubernetes.io/zone
            operator: In
            values: ["eu-west-1a", "eu-west-1b"]
      preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 80
        preference:
          matchExpressions:
          - key: accelerator
            operator: Exists
  containers:
  - name: train
    image: trainer:2.1`, notes: { 8: '<b>required…</b>: a hard rule, evaluated during filtering. No matching node = the Pod stays Pending.', 9: 'Multiple <code>nodeSelectorTerms</code> are <b>ORed</b>: matching any one term is enough.', 10: 'Expressions inside one term are <b>ANDed</b>.', 12: 'Operators: <b>In, NotIn, Exists, DoesNotExist, Gt, Lt</b>. NotIn and DoesNotExist give you node <i>anti</i>-affinity.', 14: '<b>preferred…</b>: a soft rule, only adds score. If no node matches, the Pod is still scheduled.', 15: '<b>weight</b> 1–100 is added to the node’s score when the preference matches.', 19: '<b>Exists</b> only checks that the label key is present; no <code>values</code> allowed.' } },
          ],
          [
            { type: 'compare', headers: ['', 'required…', 'preferred…'], rows: [
              ['Type', 'Hard (must)', 'Soft (should)'],
              ['Phase', 'Filter', 'Score'],
              ['No node matches', 'Pod stays Pending', 'Scheduled anyway'],
              ['Has weight?', 'No', 'Yes, 1–100'],
            ] },
            { type: 'callout', kind: 'exam', title: '“IgnoredDuringExecution” decoded', html: 'The rule is only checked <b>at scheduling time</b>. If someone later removes the label from the node, Pods already running there <b>keep running</b>. Nothing is evicted.' },
            { type: 'callout', kind: 'info', title: 'Combined with nodeSelector', html: 'If a Pod has both <code>nodeSelector</code> and required node affinity, <b>both</b> must be satisfied.' },
          ],
        ] },
      ],
      tip: 'Read the long field name in two halves: <i>DuringScheduling</i> (required or preferred) and <i>DuringExecution</i> (always “Ignored” today). That alone answers several questions.',
    },

    {
      kicker: 'Pods relative to Pods',
      title: 'Pod affinity & anti-affinity with topologyKey',
      blocks: [
        { type: 'text', html: 'Node affinity looks at <b>node labels</b>. Pod affinity and anti-affinity look at the <b>labels of Pods already running</b>, and ask: “is there a Pod matching this selector in the same <b>topology domain</b>?” The domain is defined by <code>topologyKey</code>, a node label.' },
        { type: 'cols', ratio: '1.1fr 1fr', cols: [
          [
            { type: 'code', lang: 'yaml', title: 'web Pod template', code: `
affinity:
  podAntiAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
    - labelSelector:
        matchLabels:
          app: web
      topologyKey: kubernetes.io/hostname
  podAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
    - weight: 100
      podAffinityTerm:
        labelSelector:
          matchLabels:
            app: cache
        topologyKey: topology.kubernetes.io/zone`, notes: { 2: '<b>podAntiAffinity</b>: keep away from matching Pods. Here: from other <code>app=web</code> replicas.', 4: 'The selector matches labels on <b>Pods</b>, not nodes.', 7: '<code>kubernetes.io/hostname</code> = each node is its own domain → at most one web replica per node (high availability).', 8: '<b>podAffinity</b>: be close to matching Pods.', 10: 'Preferred terms carry a weight, as with node affinity.', 15: '<code>topology.kubernetes.io/zone</code> = “same zone” rather than “same node”. Low latency to the cache without putting everything on one machine.' } },
          ],
          [
            { type: 'cards', cols: 1, items: [
              { icon: '🧲', color: 'green', title: 'podAffinity', text: 'Co-locate: put the web tier in the same zone (or node) as its cache to cut latency.' },
              { icon: '↔️', color: 'red', title: 'podAntiAffinity', text: 'Separate: never two replicas of the same app on one node, so a node failure only takes one down.' },
              { icon: '🗺️', color: 'blue', title: 'topologyKey', text: 'Which node label defines “together”: hostname = node, zone = availability zone, region = region.' },
            ] },
          ],
        ] },
        { type: 'callout', kind: 'trap', title: 'Required anti-affinity can block scaling', html: 'With required anti-affinity on <code>kubernetes.io/hostname</code> and 3 nodes, the 4th replica stays <b>Pending</b>: every node already hosts a replica. Use <i>preferred</i> or topology spread when you want spreading without a hard cap.' },
      ],
      tip: 'Keywords: “same node / same zone as another Pod” → <b>podAffinity</b>. “Not on the same node as another replica” → <b>podAntiAffinity</b> with <code>topologyKey: kubernetes.io/hostname</code>.',
    },

    {
      kicker: 'Repel Pods from nodes',
      title: 'Taints and tolerations',
      blocks: [
        { type: 'text', html: 'A <b>taint</b> is set on a <b>node</b> and repels Pods. A <b>toleration</b> is set on a <b>Pod</b> and lets it ignore a matching taint. Format: <code>key=value:Effect</code>.' },
        { type: 'cols', cols: [
          [
            { type: 'code', lang: 'bash', title: 'taint commands', code: `
kubectl taint nodes gpu-1 nvidia.com/gpu=true:NoSchedule
kubectl taint nodes gpu-1 nvidia.com/gpu=true:NoSchedule-
kubectl describe node gpu-1 | grep -i taints
kubectl label nodes gpu-1 accelerator=nvidia
kubectl cordon node-3
kubectl drain node-3 --ignore-daemonsets`, notes: { 1: 'Adds a taint: new Pods without a matching toleration will not be scheduled on gpu-1.', 2: 'The trailing <b>minus</b> <code>-</code> <b>removes</b> the taint (same syntax as removing a label).', 3: 'Taints appear in the node description.', 4: 'Labels are different from taints: labels <i>attract</i> via nodeSelector/affinity, taints <i>repel</i>.', 5: '<b>cordon</b> marks the node unschedulable (adds the <code>node.kubernetes.io/unschedulable:NoSchedule</code> taint). Running Pods stay.', 6: '<b>drain</b> cordons and then evicts Pods, e.g. before maintenance. DaemonSet Pods are skipped with this flag.' } },
          ],
          [
            { type: 'code', lang: 'yaml', title: 'Pod tolerations', code: `
tolerations:
- key: nvidia.com/gpu
  operator: Equal
  value: "true"
  effect: NoSchedule
- key: node.kubernetes.io/unreachable
  operator: Exists
  effect: NoExecute
  tolerationSeconds: 60`, notes: { 3: '<b>Equal</b>: key, value and effect must all match the taint.', 7: '<b>Exists</b>: matches any value for that key. An empty key with Exists tolerates every taint.', 9: '<b>tolerationSeconds</b> only makes sense with <b>NoExecute</b>: the Pod may stay on the node this long after the taint appears, then it is evicted.' } },
          ],
        ] },
        { type: 'compare', headers: ['Effect', 'New Pods without toleration', 'Already running Pods without toleration'], rows: [
          ['<b>NoSchedule</b>', 'Not scheduled', 'Keep running'],
          ['<b>PreferNoSchedule</b>', 'Avoided if possible (soft, scoring)', 'Keep running'],
          ['<b>NoExecute</b>', 'Not scheduled', '<b>Evicted</b> (immediately, or after tolerationSeconds if tolerated)'],
        ] },
      ],
      tip: 'Remember the direction: <b>taints on nodes, tolerations on Pods</b>. And only <b>NoExecute</b> affects Pods that are already running.',
    },

    {
      kicker: 'Taints in practice',
      title: 'Built-in taints and the “toleration ≠ placement” trap',
      blocks: [
        { type: 'flip', items: [
          { front: '👑 node-role.kubernetes.io/control-plane:NoSchedule', back: 'Set by kubeadm on control plane nodes so regular workloads stay off them. Control plane Pods and some DaemonSets tolerate it.' },
          { front: '📡 node.kubernetes.io/not-ready & unreachable (NoExecute)', back: 'Added by the Node controller when a node stops reporting. Pods get default tolerations of <b>300 s</b>, which is why Pods on a dead node are evicted after about 5 minutes.' },
          { front: '💾 memory-pressure / disk-pressure / pid-pressure (NoSchedule)', back: 'Added when the kubelet reports node pressure, so new Pods avoid the struggling node.' },
          { front: '🚧 node.kubernetes.io/unschedulable:NoSchedule', back: 'Added by <code>kubectl cordon</code> (or drain). Removed by <code>kubectl uncordon</code>.' },
        ] },
        { type: 'callout', kind: 'trap', title: 'A toleration does not force placement', html: 'A toleration only <b>allows</b> a Pod onto a tainted node; the Pod can still land on any untainted node. To dedicate nodes to a workload, combine both: <b>taint</b> the nodes (keep others out) <b>and</b> give the workload <b>node affinity or a nodeSelector</b> (pull it in).' },
        { type: 'compare', headers: ['Goal', 'Use'], rows: [
          ['Keep ordinary Pods off GPU nodes', 'Taint the GPU nodes'],
          ['Make GPU Pods run only on GPU nodes', 'Toleration <b>+</b> nodeSelector / node affinity'],
          ['Evict Pods from a node right now', 'NoExecute taint (or <code>kubectl drain</code>)'],
        ] },
      ],
      tip: 'Exam phrase: “taints <b>repel</b>, affinity <b>attracts</b>”. If an option claims a toleration <i>guarantees</i> a Pod runs on a node, it is wrong.',
    },

    {
      kicker: 'Even distribution',
      title: 'Topology spread constraints',
      blocks: [
        { type: 'cols', ratio: '1fr 1.1fr', cols: [
          [
            { type: 'code', lang: 'yaml', title: 'spread web replicas across zones', code: `
spec:
  topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: topology.kubernetes.io/zone
    whenUnsatisfiable: DoNotSchedule
    labelSelector:
      matchLabels:
        app: web`, notes: { 3: '<b>maxSkew</b>: maximum allowed difference in matching Pod count between the most and least loaded domain. 1 = as even as possible.', 4: '<b>topologyKey</b>: the node label that defines the domains (zones here; <code>kubernetes.io/hostname</code> for nodes).', 5: '<b>DoNotSchedule</b> = hard (filter, Pod may stay Pending). <b>ScheduleAnyway</b> = soft (only affects score).', 6: 'Which Pods to count: usually the same labels as the workload itself.' } },
          ],
          [
            { type: 'bullets', items: [
              'Goal: spread replicas <b>evenly</b> across zones or nodes for availability, with a tunable tolerance (maxSkew).',
              'Example: 3 zones holding 2 / 2 / 1 web Pods. With maxSkew 1 the next Pod must go to the zone with 1.',
              'Unlike required anti-affinity, it does <b>not</b> cap you at one Pod per domain: 6 replicas over 3 zones = 2 / 2 / 2.',
              'Multiple constraints can be combined, e.g. spread by zone <i>and</i> by node.',
            ] },
          ],
        ] },
        { type: 'compare', headers: ['Need', 'Best fit'], rows: [
          ['Exactly 0 or 1 replica per node', 'podAntiAffinity (required, hostname)'],
          ['Balance many replicas evenly across zones', 'topologySpreadConstraints'],
          ['Prefer, but do not require, separation', 'preferred anti-affinity or ScheduleAnyway'],
        ] },
      ],
      tip: 'Keywords “evenly”, “balanced across zones”, “skew” point to <b>topology spread constraints</b>.',
    },

    {
      kicker: 'Who goes first',
      title: 'PriorityClass and preemption',
      blocks: [
        { type: 'cols', ratio: '1.1fr 1fr', cols: [
          [
            { type: 'code', lang: 'yaml', title: 'priority.yaml', code: `
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: business-critical
value: 100000
globalDefault: false
preemptionPolicy: PreemptLowerPriority
description: "Checkout and payment services"
---
apiVersion: v1
kind: Pod
metadata:
  name: checkout
spec:
  priorityClassName: business-critical
  containers:
  - name: app
    image: shop/checkout:3.4.1`, notes: { 2: '<b>PriorityClass</b> is a <b>cluster-scoped</b> (non-namespaced) object.', 5: '<b>value</b>: an integer. Higher = more important. The Pod’s <code>spec.priority</code> is filled from it by admission.', 6: '<b>globalDefault: true</b> would apply this class to Pods that name no class. Only one class may be the global default.', 7: '<b>PreemptLowerPriority</b> (default) lets these Pods evict lower-priority Pods. <b>Never</b> = high queue priority but no preemption.', 15: 'Pods reference the class by name.' } },
          ],
          [
            { type: 'flow', items: [
              { icon: '🥇', label: 'Queue order', sub: 'high priority first', info: 'The scheduling queue pops higher-priority Pods first.' },
              { icon: '❌', label: 'No node fits', sub: 'filter fails', info: 'Every node is filtered out, e.g. Insufficient memory.' },
              { icon: '🔍', label: 'Find victims', sub: 'lower-priority Pods', info: 'The scheduler looks for a node where evicting some <b>lower-priority</b> Pods would make room. It tries to respect PodDisruptionBudgets but may violate them if there is no other choice.' },
              { icon: '🪓', label: 'Preempt', sub: 'graceful eviction', info: 'Victims are deleted gracefully. The pending Pod gets <code>nominatedNodeName</code>.' },
              { icon: '✅', label: 'Schedule', sub: 'next cycle', info: 'When the space is free the Pod is scheduled (not guaranteed onto the nominated node if something better appears).' },
            ] },
            { type: 'callout', kind: 'info', title: 'Built-in classes', html: '<code>system-cluster-critical</code> and <code>system-node-critical</code> exist in every cluster for components such as CoreDNS and the CNI agent.' },
          ],
        ] },
      ],
      tip: 'Preemption only evicts Pods with <b>lower</b> priority, and only when a higher-priority Pod cannot be scheduled. A Pod with no priority class has priority 0 unless a globalDefault class exists.',
    },

    {
      kicker: 'Special cases',
      title: 'DaemonSets, static Pods and custom schedulers',
      blocks: [
        { type: 'cards', items: [
          { icon: '🐑', color: 'blue', title: 'DaemonSet', text: 'One Pod per (matching) node. The DaemonSet controller creates a Pod per node with a <b>node affinity on that node’s name</b>, and the default scheduler binds it. Use nodeSelector/affinity to target a subset of nodes.' },
          { icon: '🩹', color: 'green', title: 'Automatic tolerations', text: 'DaemonSet Pods automatically tolerate taints such as <code>not-ready</code>, <code>unreachable</code>, <code>unschedulable</code> and the pressure taints, so node agents keep running on cordoned or unhealthy nodes. The control-plane taint is <b>not</b> tolerated unless you add it.' },
          { icon: '📄', color: 'amber', title: 'Static Pods', text: 'Run by the kubelet from a local manifest directory. No scheduler involved; the API server only shows a read-only “mirror Pod”.' },
          { icon: '🧩', color: 'purple', title: 'Custom schedulers', text: 'You can run extra schedulers. A Pod selects one with <code>spec.schedulerName</code>; default is <code>default-scheduler</code>. Typical uses: batch/gang scheduling (e.g. Volcano).' },
        ] },
        { type: 'code', lang: 'yaml', title: 'choose a scheduler', code: `
spec:
  schedulerName: my-batch-scheduler
  containers:
  - name: job
    image: batch/worker:1.0`, notes: { 2: 'If no scheduler with this name is running, nobody ever picks up the Pod: it stays <b>Pending</b> with no FailedScheduling event from the default scheduler.' } },
        { type: 'check', q: 'You need a log-collection agent on every worker node, including nodes added later. Which object should you use?', options: ['Deployment with replicas equal to the node count', 'DaemonSet', 'StatefulSet with podAntiAffinity', 'Static Pod on the control plane'], answer: 1, explain: 'A <b>DaemonSet</b> runs one Pod per eligible node and automatically adds Pods to new nodes. A Deployment would not track the node count, a StatefulSet adds ordered identity you don’t need, and a static Pod only runs on the node holding the manifest.', ref: 'https://kubernetes.io/docs/concepts/workloads/controllers/daemonset/' },
      ],
      tip: 'The scheduler is <b>pluggable</b>: the scheduling framework exposes extension points (filter, score, bind…) and you can configure profiles or run several schedulers side by side.',
    },

    {
      kicker: 'Troubleshooting',
      title: 'Why is my Pod stuck in Pending?',
      blocks: [
        { type: 'code', lang: 'bash', title: 'investigate', code: `
kubectl get pods --field-selector=status.phase=Pending
kubectl describe pod web-7d9f
# Events:
#   Warning  FailedScheduling  default-scheduler
#   0/3 nodes are available: 1 node(s) had untolerated taint
#   {node-role.kubernetes.io/control-plane: }, 2 Insufficient cpu.
kubectl get events --field-selector reason=FailedScheduling`, notes: { 1: 'List only Pending Pods.', 2: '<code>kubectl describe pod</code> is the first stop: the <b>Events</b> section holds the scheduler’s explanation.', 5: 'The message counts nodes per reason: here 1 node was tainted and 2 lacked CPU for the request.', 7: 'Cluster-wide view of scheduling failures.' } },
        { type: 'compare', headers: ['Message in FailedScheduling', 'Cause', 'Typical fix'], rows: [
          ['<code>Insufficient cpu</code> / <code>Insufficient memory</code>', 'Requests exceed free allocatable on every node', 'Lower requests, free capacity or add nodes (Cluster Autoscaler)'],
          ['<code>had untolerated taint</code>', 'Taint without matching toleration', 'Add a toleration or remove the taint'],
          ['<code>didn’t match Pod’s node affinity/selector</code>', 'No node carries the required labels', 'Label a node or fix the selector'],
          ['<code>didn’t match pod anti-affinity rules</code>', 'Required anti-affinity already satisfied everywhere', 'Add nodes or use preferred anti-affinity'],
          ['<code>pod has unbound immediate PersistentVolumeClaims</code>', 'PVC is not bound (no PV, no StorageClass/provisioner)', 'Create a matching PV or fix the StorageClass'],
          ['<code>node(s) were unschedulable</code>', 'Nodes are cordoned', '<code>kubectl uncordon</code>'],
        ] },
        { type: 'callout', kind: 'trap', title: 'Pending vs other states', html: '<b>Pending</b> includes “not scheduled yet” <i>and</i> “scheduled but images still pulling”. Check the <code>PodScheduled</code> condition. <b>CrashLoopBackOff</b>, failing readiness probes or <b>ImagePullBackOff</b> are <i>not</i> scheduling problems: the Pod already has a node.' },
      ],
      tip: 'Event reason to remember: <b>FailedScheduling</b>, emitted by <b>default-scheduler</b>, visible via <code>kubectl describe pod</code> or <code>kubectl get events</code>.',
    },

    {
      kicker: 'Practice',
      title: 'Which mechanism fits the scenario?',
      blocks: [
        { type: 'compare', headers: ['Scenario', 'Mechanism', 'Why not the obvious distractor?'], rows: [
          ['Run only on nodes labeled <code>disktype=ssd</code>', 'nodeSelector', 'A taint cannot attract Pods'],
          ['Prefer nodes in zone a, but any zone is acceptable', 'preferred node affinity', 'nodeSelector is always hard'],
          ['Keep all non-GPU workloads off GPU nodes', 'Taint on GPU nodes', 'Affinity on GPU Pods does not stop other Pods'],
          ['Never two replicas of the same app on one node', 'podAntiAffinity + hostname', 'Taints are per node, not per app'],
          ['Put the API Pods in the same zone as Redis', 'podAffinity + zone', 'Node affinity cannot see other Pods'],
          ['Balance 12 replicas evenly across 3 zones', 'topologySpreadConstraints', 'Required anti-affinity would cap at 3'],
          ['Payment Pods must evict batch Pods when full', 'PriorityClass (preemption)', 'ResourceQuota limits a namespace, does not evict'],
          ['Pods must leave a node now for maintenance', 'kubectl drain / NoExecute taint', 'cordon alone leaves running Pods'],
        ] },
        { type: 'match', title: 'Match the requirement to the field', pairs: [
          ['Bypass the scheduler, pin to one node', 'spec.nodeName'],
          ['Hard rule with In / NotIn / Exists', 'requiredDuringScheduling… node affinity'],
          ['Let a Pod onto a tainted node', 'tolerations'],
          ['Defines “same node” vs “same zone”', 'topologyKey'],
          ['Allowed imbalance between zones', 'maxSkew'],
          ['Choose a non-default scheduler', 'spec.schedulerName'],
        ] },
        { type: 'check', q: 'Ops wants batch Pods to run <b>only</b> on nodes in the <code>batch</code> pool, and no other Pods to run there. What is the correct combination?', options: ['A toleration on batch Pods only', 'A nodeSelector on batch Pods only', 'Taint the batch nodes, and give batch Pods a matching toleration plus a nodeSelector or node affinity for the pool', 'podAffinity between batch Pods with topologyKey kubernetes.io/hostname'], answer: 2, explain: 'Dedicated nodes need both directions: the <b>taint</b> keeps other Pods away, the <b>toleration</b> allows batch Pods in, and the <b>nodeSelector/affinity</b> makes sure batch Pods go nowhere else. A toleration alone does not force placement; a nodeSelector alone does not keep others out; podAffinity is about other Pods, not node pools.', ref: 'https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/' },
      ],
      tip: 'Ask two questions: <b>attract or repel?</b> (affinity vs taint) and <b>relative to nodes or to other Pods?</b> (node affinity vs pod affinity). That narrows almost every option down.',
    },
  ],

  summary: [
    'The scheduler <b>filters</b> infeasible nodes, <b>scores</b> the rest and <b>binds</b> the Pod by setting <code>spec.nodeName</code>; the kubelet then runs it.',
    'Placement uses <b>requests</b> vs node <b>allocatable</b>, never actual usage or limits. Limits are enforced at runtime (CPU throttled, memory OOMKilled).',
    '<b>nodeName</b> bypasses the scheduler; <b>nodeSelector</b> = simple label match; <b>node affinity</b> adds operators and required/preferred rules (IgnoredDuringExecution).',
    '<b>Pod affinity/anti-affinity</b> places Pods relative to other Pods inside a <b>topologyKey</b> domain (hostname, zone).',
    '<b>Taints repel, tolerations permit</b>: NoSchedule, PreferNoSchedule, NoExecute (evicts running Pods; tolerationSeconds). A toleration never forces placement.',
    '<b>Topology spread</b> balances replicas with maxSkew; <b>PriorityClass</b> orders the queue and enables preemption of lower-priority Pods.',
    'Pending Pod? Read the <b>FailedScheduling</b> event: Insufficient cpu/memory, untolerated taint, affinity mismatch, unbound PVC, wrong schedulerName.',
  ],

  glossary: [
    { term: 'kube-scheduler', def: 'Control plane component that assigns unscheduled Pods to nodes by filtering, scoring and binding.' },
    { term: 'Filtering', def: 'Scheduling phase that removes nodes which cannot run the Pod (resources, taints, required affinity, spread with DoNotSchedule).' },
    { term: 'Scoring', def: 'Scheduling phase that ranks feasible nodes using soft preferences; the highest score wins.' },
    { term: 'Binding', def: 'API object posted by the scheduler that sets a Pod’s spec.nodeName to the chosen node.' },
    { term: 'Resource request', def: 'Amount of CPU/memory reserved for a container; used by the scheduler for placement.' },
    { term: 'Allocatable', def: 'Node capacity minus resources reserved for the system and Kubernetes daemons; what Pods can request.' },
    { term: 'nodeSelector', def: 'Pod field listing node labels that must all match for the Pod to be scheduled there.' },
    { term: 'Node affinity', def: 'Expressive node-label rules (In, NotIn, Exists, DoesNotExist, Gt, Lt), either required (hard) or preferred (soft, weighted).' },
    { term: 'Pod anti-affinity', def: 'Rule that keeps a Pod away from Pods matching a label selector within a topology domain.' },
    { term: 'topologyKey', def: 'Node label that defines a topology domain for pod affinity and spread, e.g. kubernetes.io/hostname or topology.kubernetes.io/zone.' },
    { term: 'Taint', def: 'Node property (key=value:Effect) that repels Pods lacking a matching toleration.' },
    { term: 'Toleration', def: 'Pod property that allows (but does not require) scheduling onto nodes with a matching taint.' },
    { term: 'NoExecute', def: 'Taint effect that blocks new Pods and evicts running Pods without a toleration, optionally after tolerationSeconds.' },
    { term: 'Topology spread constraint', def: 'Rule that keeps matching Pods evenly distributed across domains within maxSkew.' },
    { term: 'PriorityClass', def: 'Cluster-scoped object mapping a name to an integer priority; higher-priority Pods are scheduled first and may preempt lower ones.' },
    { term: 'Preemption', def: 'Evicting lower-priority Pods so a pending higher-priority Pod can be scheduled.' },
  ],

  quiz: [
    { q: 'A Pod is stuck in <i>Pending</i>. <code>kubectl describe pod</code> shows: <code>0/3 nodes are available: 3 Insufficient cpu.</code> What is the most likely cause?', options: ['The container’s CPU limit is lower than its usage', 'The nodes are running at high actual CPU utilisation', 'The Pod’s CPU request exceeds the unrequested allocatable CPU on every node', 'The image could not be pulled'], answer: 2, explain: 'The scheduler compares <b>requests</b> with each node’s allocatable minus existing requests. “Insufficient cpu” means no node has enough unreserved CPU for the request. Actual utilisation and limits are not used for placement, and image pulls happen only after scheduling.', ref: 'https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/' },
    { q: 'Which value does the kube-scheduler use to decide whether a container fits on a node?', options: ['resources.requests', 'resources.limits', 'Current CPU usage reported by metrics-server', 'The container image size'], answer: 0, explain: '<b>Requests</b> are reservations and drive placement. Limits are enforced at runtime by cgroups (throttling or OOMKill). The scheduler does not use live metrics; image locality only slightly affects scoring, never fit.', ref: 'https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/' },
    { q: 'What is the simplest way to ensure a Pod only runs on nodes labeled <code>disktype=ssd</code>?', options: ['Taint the SSD nodes with disktype=ssd:NoSchedule', 'Add podAffinity with topologyKey disktype', 'Set a PriorityClass named ssd', 'Add <code>nodeSelector: {disktype: ssd}</code> to the Pod spec'], answer: 3, explain: '<b>nodeSelector</b> is the simplest hard constraint on node labels. A taint repels Pods rather than attracting them; podAffinity is about other Pods; PriorityClass only affects queue order and preemption.', ref: 'https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/' },
    { q: 'A Pod was scheduled using <code>requiredDuringSchedulingIgnoredDuringExecution</code> node affinity for <code>zone=a</code>. An admin later removes that label from the node. What happens to the running Pod?', options: ['It is evicted immediately', 'It keeps running on the node', 'It is restarted on another node in zone a', 'It moves to Pending until the label returns'], answer: 1, explain: '“<b>IgnoredDuringExecution</b>” means the rule is only checked at scheduling time. Label changes afterwards do not affect running Pods. Eviction of running Pods is what a NoExecute taint does, not affinity.', ref: 'https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/' },
    { q: 'A team wants to stop ordinary workloads from being scheduled onto expensive GPU nodes. What should they configure?', options: ['podAntiAffinity on the ordinary workloads', 'A nodeSelector on the GPU workloads', 'A taint on the GPU nodes', 'A ResourceQuota in the default namespace'], answer: 2, explain: 'A <b>taint</b> on the GPU nodes repels every Pod without a matching toleration. A nodeSelector on GPU workloads pulls them in but does nothing to keep other Pods out. Anti-affinity concerns other Pods, and ResourceQuota caps namespace totals without controlling placement.', ref: 'https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/' },
    { q: 'Which TWO statements about tolerations are true? (Select 2)', options: ['A toleration allows, but does not force, a Pod onto a node with a matching taint', 'Tolerations are set on nodes and taints on Pods', 'tolerationSeconds is used with NoExecute taints to delay eviction', 'Adding a toleration to a Pod removes the taint from the node'], answer: [0, 2], explain: 'A toleration only <b>permits</b> scheduling onto a tainted node; the Pod may still go elsewhere. <b>tolerationSeconds</b> controls how long a tolerating Pod stays after a NoExecute taint appears. Taints live on nodes and tolerations on Pods (not the reverse), and tolerations never modify node taints.', ref: 'https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/' },
    { q: 'A node gets a new taint <code>maintenance=true:NoExecute</code>. What happens to Pods already running on it that have no matching toleration?', options: ['Nothing; taints only affect new Pods', 'They are throttled to their CPU requests', 'They are marked Pending but keep running', 'They are evicted from the node'], answer: 3, explain: '<b>NoExecute</b> is the only effect that acts on running Pods: those without a matching toleration are evicted. NoSchedule and PreferNoSchedule only affect new scheduling decisions.', ref: 'https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/' },
    { q: 'You want to guarantee that no two replicas of a Deployment run on the same node. Which configuration achieves this?', options: ['A taint on each node with the app name', 'Required podAntiAffinity matching the app’s labels with <code>topologyKey: kubernetes.io/hostname</code>', 'A nodeSelector with <code>kubernetes.io/hostname</code>', 'Preferred node affinity with weight 100'], answer: 1, explain: '<b>podAntiAffinity</b> with <b>hostname</b> as topologyKey makes each node its own domain, so a node hosting one replica rejects another. Taints are per node, not per app; nodeSelector on hostname pins Pods to a single node; preferred node affinity is soft and about node labels.', ref: 'https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/' },
    { q: 'An API Deployment should run in the same availability zone as its Redis Pods to reduce latency, but not necessarily on the same node. What should you use?', options: ['podAffinity selecting the Redis Pods with <code>topologyKey: topology.kubernetes.io/zone</code>', 'podAntiAffinity selecting the Redis Pods with hostname', 'A toleration for the Redis node taint', 'spec.nodeName set to the Redis node'], answer: 0, explain: '<b>podAffinity</b> attracts Pods to where matching Pods run, and <b>topologyKey: zone</b> defines “together” as the same zone. Anti-affinity does the opposite, a toleration does not attract, and nodeName pins to one node and bypasses the scheduler.', ref: 'https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/' },
    { q: 'What does <code>kubectl taint nodes node1 dedicated=batch:NoSchedule-</code> do?', options: ['Adds a NoSchedule taint to node1', 'Cordons node1 and evicts its Pods', 'Removes the dedicated=batch:NoSchedule taint from node1', 'Adds a toleration for dedicated=batch to all Pods on node1'], answer: 2, explain: 'The trailing <b>minus</b> removes the taint, the same convention as removing a label. Without the minus it would add the taint. Cordon/drain are separate commands, and tolerations are always set in Pod specs, never by kubectl taint.', ref: 'https://kubernetes.io/docs/reference/kubectl/generated/kubectl_taint/' },
    { q: 'A Pod manifest sets <code>spec.nodeName: worker-2</code>. Which statement is true?', options: ['The scheduler still filters and scores before accepting worker-2', 'The Pod is placed on the node with the lowest load near worker-2', 'nodeName only works together with a matching toleration', 'The Pod bypasses the scheduler and the kubelet on worker-2 tries to run it directly'], answer: 3, explain: 'Setting <b>nodeName</b> skips the scheduler completely: no filtering, scoring or NoSchedule taint checks. The kubelet on that node runs the Pod or rejects it if resources are missing. No toleration is required for NoSchedule taints in this case.', ref: 'https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/' },
    { q: 'A high-priority Pod cannot be scheduled because every node is full. Lower-priority Pods are running. What does the scheduler do by default?', options: ['Waits until the Cluster Autoscaler adds a node', 'Preempts (evicts) lower-priority Pods on a node to make room', 'Lowers the requests of the new Pod', 'Schedules the Pod on the control plane node'], answer: 1, explain: 'With the default <b>preemptionPolicy: PreemptLowerPriority</b>, the scheduler’s PostFilter step evicts lower-priority victims and nominates the node. It never edits requests or ignores the control-plane taint; the Cluster Autoscaler is a separate optional add-on.', ref: 'https://kubernetes.io/docs/concepts/scheduling-eviction/pod-priority-preemption/' },
    { q: 'A Deployment has <code>topologySpreadConstraints</code> with <code>maxSkew: 1</code>, <code>topologyKey: topology.kubernetes.io/zone</code> and <code>whenUnsatisfiable: DoNotSchedule</code>. What does it do?', options: ['Limits the Deployment to one Pod per zone', 'Prefers, but does not require, spreading across zones', 'Keeps the number of matching Pods per zone within 1 of each other, leaving a Pod Pending rather than breaking that', 'Evicts Pods when a zone becomes unbalanced'], answer: 2, explain: '<b>maxSkew 1</b> allows at most a difference of one Pod between zones, and <b>DoNotSchedule</b> makes it a hard rule. It does not cap Pods at one per zone (that would be required anti-affinity), ScheduleAnyway would be the soft version, and spread constraints never evict running Pods.', ref: 'https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/' },
    { q: 'Which TWO situations can leave a Pod in Pending with no node assigned? (Select 2)', options: ['The container exits with code 1 right after starting', 'It references a PersistentVolumeClaim that cannot be bound', 'Its readiness probe keeps failing', 'Its spec.schedulerName names a scheduler that is not running'], answer: [1, 3], explain: 'An <b>unbound PVC</b> blocks scheduling (“unbound immediate PersistentVolumeClaims”), and a <b>non-existent scheduler</b> means nobody ever binds the Pod. A crashing container (CrashLoopBackOff) or failing readiness probe both happen <i>after</i> the Pod was scheduled and started.', ref: ['https://kubernetes.io/docs/concepts/storage/persistent-volumes/', 'https://kubernetes.io/docs/concepts/scheduling-eviction/running-multiple-schedulers/'] },
    { q: 'In a kubeadm cluster, why are regular application Pods not scheduled onto control plane nodes?', options: ['Control plane nodes carry the taint <code>node-role.kubernetes.io/control-plane:NoSchedule</code>', 'The kubelet does not run on control plane nodes', 'Control plane nodes have zero allocatable CPU', 'The scheduler cannot see control plane nodes'], answer: 0, explain: 'kubeadm adds the <b>control-plane NoSchedule taint</b>; Pods without a toleration are filtered out. The kubelet does run there (it runs the static control plane Pods), and the nodes have allocatable resources and are visible to the scheduler.', ref: 'https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/create-cluster-kubeadm/' },
  ],
});
