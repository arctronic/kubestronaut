KS.registerChapter('kcna', {
  id: 'architecture',
  title: 'Cluster Architecture',
  subtitle: 'Control plane, worker nodes and how a <code>kubectl apply</code> becomes running containers',
  icon: '🏗️',
  minutes: 30,
  objectives: [
    'Name every control plane and node component and what it is responsible for',
    'Trace a request from <code>kubectl</code> to a running container, step by step',
    'Explain the declarative model and the controller reconciliation loop',
    'Read the four top-level fields of any Kubernetes object',
  ],

  slides: [
    {
      kicker: 'Why it exists',
      title: 'What does a container orchestrator actually do?',
      blocks: [
        { type: 'text', html: 'Running one container is easy. Running <b>hundreds of containers across dozens of machines</b>, keeping them healthy, reachable and up to date, is the job of an orchestrator. Kubernetes (Greek for <i>helmsman</i>, abbreviated <b>K8s</b>) was open-sourced by Google in 2014, inspired by its internal system Borg, and was the first project donated to the CNCF.' },
        { type: 'cards', items: [
          { icon: '📦', color: 'blue', title: 'Scheduling', text: 'Places containers on machines with enough CPU/memory.' },
          { icon: '❤️‍🩹', color: 'green', title: 'Self-healing', text: 'Restarts crashed containers, replaces Pods on dead nodes.' },
          { icon: '📈', color: 'purple', title: 'Scaling', text: 'Adds or removes replicas manually or automatically.' },
          { icon: '🔎', color: 'teal', title: 'Service discovery & LB', text: 'Stable DNS names and virtual IPs in front of changing Pods.' },
          { icon: '🔄', color: 'amber', title: 'Rollouts & rollbacks', text: 'Updates apps gradually and can undo a bad release.' },
          { icon: '🔐', color: 'red', title: 'Config & secrets', text: 'Injects configuration without rebuilding images.' },
        ] },
      ],
      tip: 'Questions like “Which feature restarts failed containers automatically?” are answered by <b>self-healing</b>, which is implemented by controllers and the kubelet.',
    },

    {
      kicker: 'Big picture · interactive',
      title: 'Anatomy of a Kubernetes cluster',
      blocks: [
        { type: 'diagram', width: 900, height: 460,
          caption: 'Click a component for details, or press ▶ Play to follow <code>kubectl apply -f deployment.yaml</code>.',
          groups: [
            { x: 20, y: 20, w: 530, h: 210, label: 'Control plane', color: 'blue' },
            { x: 20, y: 250, w: 430, h: 195, label: 'Worker node 1', color: 'green' },
            { x: 470, y: 250, w: 410, h: 195, label: 'Worker node 2', color: 'green' },
          ],
          nodes: [
            { id: 'kubectl', x: 700, y: 60, w: 160, h: 56, label: 'kubectl', icon: '💻', sub: 'you / CI pipeline', color: 'gray', info: 'The CLI client. It turns your command or YAML into REST calls to the API server. Every client (dashboards, CI, controllers) talks to the cluster the same way: through the API.' },
            { id: 'ccm', x: 40, y: 62, w: 140, h: 56, label: 'cloud-controller\nmanager', color: 'gray', fs: 12.5, info: 'Optional. Runs controllers that talk to a cloud provider: creating load balancers for Services of type LoadBalancer, attaching cloud routes, noticing deleted VMs.' },
            { id: 'api', x: 205, y: 62, w: 170, h: 56, label: 'kube-apiserver', sub: 'front door of the cluster', color: 'blue', info: 'The <b>only</b> component that talks to etcd. It authenticates, authorizes and validates every request, then stores the object. All other components watch the API server. It scales horizontally.' },
            { id: 'etcd', x: 40, y: 155, w: 140, h: 52, label: 'etcd', icon: '🗄️', sub: 'key-value store', color: 'amber', info: 'Consistent, highly available key-value store (Raft consensus) holding <b>all cluster state</b>: every object, its spec and status. Back it up! Lose etcd and you lose the cluster.' },
            { id: 'sched', x: 205, y: 155, w: 170, h: 52, label: 'kube-scheduler', color: 'purple', info: 'Watches for Pods with no node assigned and picks the best node by <b>filtering</b> (resources, taints, affinity…) then <b>scoring</b>. It only writes the decision (a binding); it does not start containers.' },
            { id: 'cm', x: 390, y: 155, w: 145, h: 52, label: 'kube-controller-\nmanager', color: 'teal', fs: 12.5, info: 'One binary running many controllers: Deployment, ReplicaSet, Node, Job, EndpointSlice, ServiceAccount… Each loops forever making actual state match desired state.' },
            { id: 'k1', x: 40, y: 295, w: 130, h: 50, label: 'kubelet', icon: '🤖', color: 'green', info: 'Agent on every node. Watches the API for Pods bound to its node, asks the container runtime (via CRI) to start them, runs probes and reports status back. Also runs static Pods from local manifests.' },
            { id: 'p1', x: 315, y: 295, w: 120, h: 50, label: 'kube-proxy', color: 'teal', info: 'Implements Service virtual IPs on each node by programming iptables/IPVS (or nftables) rules so traffic to a ClusterIP reaches a healthy backend Pod. Some CNIs (e.g. Cilium) can replace it.' },
            { id: 'r1', x: 180, y: 295, w: 125, h: 50, label: 'containerd', sub: 'CRI runtime', color: 'pink', info: 'The container runtime: pulls images, creates containers through a low-level runtime such as runc. Any CRI-compliant runtime works (containerd, CRI-O).' },
            { id: 'pa', x: 45, y: 375, w: 120, h: 46, label: 'Pod', icon: '🫛', round: true, color: 'blue', info: 'A Pod: one or more containers sharing network namespace (one IP) and volumes. The smallest deployable unit.' },
            { id: 'pb', x: 185, y: 375, w: 120, h: 46, label: 'Pod (new)', icon: '🫛', round: true, color: 'blue', info: 'The Pod created by our Deployment in the walkthrough.' },
            { id: 'k2', x: 490, y: 295, w: 130, h: 50, label: 'kubelet', icon: '🤖', color: 'green', info: 'Every node, including control plane nodes in many setups, runs a kubelet.' },
            { id: 'p2', x: 760, y: 295, w: 105, h: 50, label: 'kube-proxy', color: 'teal', info: 'One kube-proxy per node, usually deployed as a DaemonSet.' },
            { id: 'r2', x: 630, y: 295, w: 120, h: 50, label: 'CRI-O', sub: 'CRI runtime', color: 'pink', info: 'Another CRI runtime, built specifically for Kubernetes. Nodes in one cluster can even use different runtimes.' },
            { id: 'pc', x: 630, y: 375, w: 120, h: 46, label: 'Pod', icon: '🫛', round: true, color: 'blue', info: 'Pods on different nodes reach each other directly by IP. That flat network is provided by the CNI plugin.' },
          ],
          edges: [
            { from: 'kubectl', to: 'api', label: 'HTTPS REST', color: 'gray' },
            { from: 'api', to: 'etcd', both: true, color: 'amber' },
            { from: 'sched', to: 'api', dashed: true, label: 'watch/bind', color: 'purple' },
            { from: 'cm', to: 'api', dashed: true, label: 'watch', color: 'teal' },
            { from: 'ccm', to: 'api', dashed: true, color: 'gray' },
            { from: 'k1', to: 'api', dashed: true, color: 'green' },
            { from: 'k2', to: 'api', dashed: true, color: 'green', bend: 40 },
            { from: 'k1', to: 'r1', label: 'CRI', color: 'pink' },
            { from: 'r1', to: 'pb', color: 'pink' },
            { from: 'k2', to: 'r2', label: 'CRI', color: 'pink' },
            { from: 'r2', to: 'pc', color: 'pink' },
          ],
          steps: [
            { on: ['kubectl', 'api', 'kubectl>api'], text: '<code>kubectl apply</code> sends the Deployment to the <b>API server</b>, which authenticates you, checks RBAC, runs admission controllers and validates the object.' },
            { on: ['api', 'etcd', 'api>etcd'], text: 'The API server <b>persists</b> the Deployment in <b>etcd</b>. At this point nothing is running yet; only the desired state is recorded.' },
            { on: ['cm', 'api', 'cm>api'], text: 'The <b>Deployment controller</b> notices the new Deployment and creates a ReplicaSet; the ReplicaSet controller creates Pod objects. They have no node yet (<i>Pending</i>).' },
            { on: ['sched', 'api', 'sched>api'], text: 'The <b>scheduler</b> sees unscheduled Pods, filters and scores nodes, and writes a <b>binding</b>: “this Pod goes to node 1”.' },
            { on: ['k1', 'api', 'k1>api'], text: 'The <b>kubelet</b> on node 1 is watching for Pods assigned to it and picks up the new Pod spec.' },
            { on: ['k1', 'r1', 'k1>r1', 'r1>pb', 'pb'], text: 'The kubelet calls the <b>container runtime over CRI</b>: pull the image, create the sandbox (network via CNI), start the containers.' },
            { on: ['k1', 'api', 'k1>api', 'p1', 'pb'], text: 'The kubelet reports status (<i>Running</i>, IP address) back to the API server. kube-proxy updates Service rules so traffic can reach the new Pod.' },
          ],
        },
      ],
      tip: 'If a question asks which component <b>decides</b> placement, it is the scheduler. Which component <b>starts</b> the containers? The kubelet (through the runtime). Which <b>stores</b> state? etcd.',
    },

    {
      kicker: 'Control plane',
      title: 'Control plane components: flip to reveal',
      blocks: [
        { type: 'flip', items: [
          { front: '🚪 kube-apiserver', back: 'REST front end for the cluster. Authn → authz → admission → validation → etcd. Stateless, scales horizontally. The only component that talks to etcd.' },
          { front: '🗄️ etcd', back: 'Distributed key-value store using Raft consensus. Single source of truth for cluster state. Runs with an odd number of members (3, 5).' },
          { front: '🧭 kube-scheduler', back: 'Assigns Pods to nodes. Filters (can it fit?), then scores (where is best?). Respects requests, taints, affinity, topology spread.' },
          { front: '🔁 kube-controller-manager', back: 'Runs the built-in controllers (Deployment, ReplicaSet, Node, Job, EndpointSlice, Namespace, ServiceAccount…) as one process.' },
          { front: '☁️ cloud-controller-manager', back: 'Cloud-specific control loops: node lifecycle, routes and LoadBalancer Services. Lets cloud vendors ship code outside the Kubernetes core.' },
        ] },
        { type: 'callout', kind: 'trap', title: 'Common distractor', html: '“The scheduler starts Pods on the chosen node.” <b>False</b>: the scheduler only records the decision. The kubelet on that node starts the containers.' },
      ],
    },

    {
      kicker: 'Worker nodes',
      title: 'What runs on every node',
      blocks: [
        { type: 'cols', ratio: '1.1fr 1fr', cols: [
          [
            { type: 'cards', cols: 1, items: [
              { icon: '🤖', color: 'green', title: 'kubelet', text: 'Node agent. Registers the node, runs Pods assigned to it, executes liveness/readiness/startup probes, mounts volumes, reports node and Pod status.' },
              { icon: '🔀', color: 'teal', title: 'kube-proxy', text: 'Network proxy that maintains Service rules (iptables, IPVS or nftables). Optional when the CNI provides a replacement (e.g. Cilium eBPF).' },
              { icon: '⚙️', color: 'pink', title: 'Container runtime', text: 'Implements the Container Runtime Interface (CRI): containerd or CRI-O, which call an OCI runtime such as runc.' },
            ] },
          ],
          [
            { type: 'layers', title: 'Node software stack', items: [
              { label: 'Your containers', sub: 'in Pods', color: 'blue' },
              { label: 'kubelet + kube-proxy', sub: 'Kubernetes agents', color: 'green' },
              { label: 'containerd / CRI-O', sub: 'high-level runtime (CRI)', color: 'pink' },
              { label: 'runc / crun / gVisor / Kata', sub: 'low-level OCI runtime', color: 'purple' },
              { label: 'Linux kernel', sub: 'namespaces + cgroups', color: 'gray' },
              { label: 'Machine', sub: 'VM or bare metal', color: 'gray' },
            ] },
            { type: 'callout', kind: 'info', title: 'Static Pods', html: 'The kubelet can run Pods from manifest files in a local directory (<code>/etc/kubernetes/manifests</code>) without the scheduler. kubeadm runs the control plane itself this way.' },
          ],
        ] },
      ],
      tip: 'Docker Engine support via “dockershim” was removed in Kubernetes 1.24. Images built with Docker still run fine because they are standard OCI images.',
    },

    {
      kicker: 'Core idea',
      title: 'Declarative state & the reconciliation loop',
      blocks: [
        { type: 'text', html: 'You never tell Kubernetes <i>how</i> to do something step by step. You declare the <b>desired state</b> (“3 replicas of nginx:1.27”) and <b>controllers</b> continuously drive the <b>actual state</b> towards it.' },
        { type: 'flow', items: [
          { icon: '👀', label: 'Observe', sub: 'watch current state via API', info: 'Controllers use watches (long-lived HTTP streams) so they react to changes instantly instead of polling.' },
          { icon: '⚖️', label: 'Diff', sub: 'desired vs actual', info: 'Spec (desired) is compared with status (observed). E.g. spec.replicas=3 but only 2 Pods exist.' },
          { icon: '🛠️', label: 'Act', sub: 'create / delete / update', info: 'The controller makes the smallest change needed, e.g. creates one more Pod, and writes back through the API server.' },
          { icon: '🔁', label: 'Repeat', sub: 'forever', info: 'The loop never ends. That is why deleting a Pod managed by a ReplicaSet just results in a new one: self-healing for free.' },
        ], caption: 'Click Step ▶ or any box.' },
        { type: 'compare', headers: ['', 'Imperative', 'Declarative'], rows: [
          ['You describe', 'Actions: <i>run this, scale that</i>', 'The end state in YAML/JSON'],
          ['Example', '<code>kubectl create deployment web --image=nginx</code>', '<code>kubectl apply -f web.yaml</code>'],
          ['Repeatable / Git-friendly', 'Not really', 'Yes, the basis of GitOps'],
        ] },
      ],
      tip: '“Desired state is stored in the object’s <b>spec</b>; observed state in its <b>status</b>.” This sentence answers several exam questions.',
    },

    {
      kicker: 'The API',
      title: 'Everything is an API resource',
      blocks: [
        { type: 'cols', cols: [
          [
            { type: 'bullets', items: [
              'Resources are grouped into <b>API groups</b>: the <i>core</i> group (<code>v1</code>: Pod, Service, ConfigMap), <code>apps/v1</code> (Deployment), <code>batch/v1</code> (Job), <code>networking.k8s.io/v1</code> (Ingress)…',
              'Versions mature: <b>alpha</b> (off by default, may vanish) → <b>beta</b> → <b>stable</b> (<code>v1</code>, <code>v2</code>).',
              'Most resources are <b>namespaced</b>; some are <b>cluster-scoped</b> (Node, PersistentVolume, Namespace, ClusterRole, StorageClass).',
              'You can extend the API with <b>CustomResourceDefinitions</b> (CRDs); an operator then reconciles them.',
            ] },
          ],
          [
            { type: 'code', lang: 'bash', title: 'explore the API', code: `
kubectl api-resources            # every kind, short name, group, namespaced?
kubectl api-resources --namespaced=false
kubectl api-versions             # enabled group/versions
kubectl explain deployment.spec.strategy
kubectl get --raw /healthz       # raw API call`, notes: { 1: 'Shows SHORTNAMES too: po, svc, deploy, ns, cm, pv, pvc…', 4: '<code>kubectl explain</code> documents any field straight from the API schema: perfect when you forget YAML.' } },
          ],
        ] },
      ],
      tip: 'Expect “Which of these is cluster-scoped?”: Node, PersistentVolume, Namespace, StorageClass, ClusterRole, CRD. PersistentVolumeClaim is <b>namespaced</b>.',
    },

    {
      kicker: 'Objects',
      title: 'Anatomy of a Kubernetes object',
      blocks: [
        { type: 'cols', ratio: '1.2fr 1fr', cols: [
          [
            { type: 'code', lang: 'yaml', title: 'deployment.yaml', code: `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
  namespace: shop
  labels:
    app: web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
      - name: nginx
        image: nginx:1.27
status: {}   # written by Kubernetes, not you`, notes: { 1: '<b>apiVersion</b>: group/version of the schema. Deployments live in <code>apps/v1</code>.', 2: '<b>kind</b>: the type of object.', 3: '<b>metadata</b>: name (unique per kind + namespace), namespace, labels, annotations, uid.', 8: '<b>spec</b>: the desired state you declare.', 10: 'The selector must match the Pod template labels, which is how the Deployment finds “its” Pods.', 13: 'The Pod template: a Pod spec embedded inside the Deployment.', 21: '<b>status</b>: observed state, filled in by controllers. You never write it.' } },
          ],
          [
            { type: 'callout', kind: 'exam', title: 'The four required top-level fields', html: '<code>apiVersion</code>, <code>kind</code>, <code>metadata</code>, <code>spec</code> (plus <code>status</code>, managed by the system).' },
            { type: 'compare', headers: ['', 'Labels', 'Annotations'], rows: [
              ['Purpose', 'Identify & select', 'Attach non-identifying info'],
              ['Used by selectors?', 'Yes', 'No'],
              ['Example', '<code>app=web</code>, <code>tier=frontend</code>', 'build id, git sha, tool config'],
            ] },
          ],
        ] },
      ],
    },

    {
      kicker: 'Inside the API server',
      title: 'The life of an API request',
      blocks: [
        { type: 'flow', items: [
          { icon: '🪪', label: 'Authentication', sub: 'who are you?', info: 'Client certificates, bearer tokens (ServiceAccount tokens), OIDC. Kubernetes has no “User” object; users come from outside.' },
          { icon: '🛂', label: 'Authorization', sub: 'are you allowed?', info: 'Usually RBAC: Roles/ClusterRoles bound to users, groups or ServiceAccounts. Other modes: Node, ABAC, Webhook.' },
          { icon: '🧪', label: 'Mutating admission', sub: 'change it', info: 'Admission controllers/webhooks may modify the object, e.g. inject default values or a sidecar container.' },
          { icon: '📐', label: 'Schema validation', sub: 'is it well-formed?', info: 'The object is validated against the OpenAPI schema for its kind.' },
          { icon: '✅', label: 'Validating admission', sub: 'accept or reject', info: 'Policy checks, e.g. Pod Security Admission, ResourceQuota, OPA Gatekeeper/Kyverno webhooks. They can only accept or reject.' },
          { icon: '🗄️', label: 'Persist to etcd', sub: 'then watchers react', info: 'Once stored, every watching controller gets notified.' },
        ] },
      ],
      tip: 'Order matters: <b>AuthN → AuthZ → Admission</b>. Mutating admission runs <i>before</i> validating admission.',
    },

    {
      kicker: 'Resilience',
      title: 'Highly available control plane',
      blocks: [
        { type: 'cols', cols: [
          [
            { type: 'bullets', items: [
              'Run <b>3 or 5</b> control plane nodes behind a load balancer for the API server.',
              'API servers are active-active. Scheduler and controller-manager use <b>leader election</b>: one active, others on standby.',
              '<b>etcd needs a quorum</b> (majority) to accept writes, so use an odd member count.',
              '<b>Stacked</b> topology: etcd runs on the control plane nodes (simpler). <b>External</b> etcd: separate machines (more resilient, more hardware).',
            ] },
          ],
          [
            { type: 'compare', headers: ['etcd members', 'Quorum', 'Failures tolerated'], rows: [
              ['1', '1', '0'], ['3', '2', '1'], ['4', '3', '1 (no gain!)'], ['5', '3', '2'], ['7', '4', '3'],
            ] },
          ],
        ] },
        { type: 'callout', kind: 'warn', title: 'Workloads keep running', html: 'If the whole control plane goes down, existing Pods <b>keep running</b> on the nodes, but nothing new can be scheduled, scaled or healed until it returns.' },
      ],
    },

    {
      kicker: 'Add-ons',
      title: 'Cluster add-ons you will hear about',
      blocks: [
        { type: 'cards', items: [
          { icon: '📛', color: 'blue', title: 'CoreDNS', text: 'Cluster DNS. Gives Services names like <code>web.shop.svc.cluster.local</code>. A CNCF graduated project.' },
          { icon: '🕸️', color: 'purple', title: 'CNI plugin', text: 'Pod networking: Calico, Cilium, Flannel, Weave. Required before Pods can talk.' },
          { icon: '📊', color: 'green', title: 'metrics-server', text: 'Collects CPU/memory from kubelets for <code>kubectl top</code> and the HPA. Not a monitoring system.' },
          { icon: '🚪', color: 'amber', title: 'Ingress / Gateway controller', text: 'NGINX, Traefik, Envoy-based. Implements Ingress or Gateway API resources.' },
          { icon: '🖥️', color: 'teal', title: 'Dashboard', text: 'Web UI for the cluster. Convenient, but a security risk if exposed.' },
        ] },
      ],
    },

    {
      kicker: 'Practice',
      title: 'Match the component to its job',
      blocks: [
        { type: 'match', pairs: [
          ['kube-apiserver', 'Validates requests and is the only client of etcd'],
          ['etcd', 'Stores all cluster state using Raft'],
          ['kube-scheduler', 'Binds unscheduled Pods to nodes'],
          ['kube-controller-manager', 'Runs Deployment, Node, Job controllers'],
          ['kubelet', 'Starts Pods on its node and runs probes'],
          ['kube-proxy', 'Programs Service routing rules on each node'],
        ] },
        { type: 'check', q: 'A node crashes. Which component notices the node is unhealthy and eventually evicts its Pods so they can be recreated elsewhere?', options: ['kube-scheduler', 'The Node controller in kube-controller-manager', 'kube-proxy on the failed node', 'etcd'], answer: 1, explain: 'The <b>Node controller</b> (inside kube-controller-manager) monitors node heartbeats (Lease objects). When a node stops reporting, it marks it NotReady and Pods are evicted; their ReplicaSets create replacements, which the scheduler then places.', ref: 'https://kubernetes.io/docs/concepts/architecture/nodes/' },
      ],
    },
  ],

  summary: [
    '<b>Control plane</b> = kube-apiserver, etcd, kube-scheduler, kube-controller-manager (+ optional cloud-controller-manager).',
    '<b>Every node</b> = kubelet, kube-proxy, container runtime (CRI: containerd or CRI-O).',
    'Only the <b>API server</b> talks to etcd; everything else watches the API server.',
    'Kubernetes is <b>declarative</b>: spec = desired state, status = observed state, controllers reconcile in a loop.',
    'Request path: <b>AuthN → AuthZ → mutating admission → validation → validating admission → etcd</b>.',
    'etcd needs a <b>quorum</b>: 3 members tolerate 1 failure, 5 tolerate 2.',
  ],

  glossary: [
    { term: 'Control plane', def: 'The set of components (API server, etcd, scheduler, controller managers) that manage the cluster’s desired state.' },
    { term: 'kube-apiserver', def: 'The REST front end of Kubernetes; authenticates, authorizes, admits and persists every request. The only component that talks to etcd.' },
    { term: 'etcd', def: 'Consistent, distributed key-value store (Raft) that holds all cluster data.' },
    { term: 'kube-scheduler', def: 'Assigns newly created Pods to nodes by filtering and scoring candidate nodes.' },
    { term: 'kube-controller-manager', def: 'Runs the built-in controllers that reconcile actual state with desired state.' },
    { term: 'cloud-controller-manager', def: 'Runs cloud-provider-specific controllers (load balancers, routes, node lifecycle).' },
    { term: 'kubelet', def: 'Agent on each node that ensures containers described in PodSpecs are running and healthy.' },
    { term: 'kube-proxy', def: 'Per-node component that maintains network rules implementing Services.' },
    { term: 'Container runtime', def: 'Software that runs containers; Kubernetes talks to it through the CRI (e.g. containerd, CRI-O).' },
    { term: 'Reconciliation loop', def: 'Observe → diff → act, repeated forever by controllers to converge actual state to desired state.' },
    { term: 'spec vs status', def: 'spec is the desired state you declare; status is the observed state written by the system.' },
    { term: 'Static Pod', def: 'A Pod managed directly by the kubelet from a local manifest file, not via the API server/scheduler.' },
    { term: 'Admission controller', def: 'Plugin that intercepts API requests after authn/authz to mutate or validate (accept/reject) objects.' },
    { term: 'Quorum', def: 'Majority of etcd members ((n/2)+1) required to commit writes.' },
    { term: 'CRD', def: 'CustomResourceDefinition: extends the Kubernetes API with your own resource kinds.' },
  ],

  quiz: [
    { q: 'Which control plane component is the only one that communicates directly with etcd?', options: ['kube-scheduler', 'kube-apiserver', 'kube-controller-manager', 'kubelet'], answer: 1, explain: 'All components read and write cluster state through the <b>kube-apiserver</b>. It is the only client of etcd, which keeps validation, authorization and auditing in one place.', ref: 'https://kubernetes.io/docs/concepts/overview/components/' },
    { q: 'What is the primary responsibility of the kube-scheduler?', options: ['Starting containers on nodes', 'Assigning Pods without a node to a suitable node', 'Restarting failed containers', 'Maintaining Service network rules'], answer: 1, explain: 'The scheduler watches for unscheduled Pods and binds each to a node after filtering and scoring. Starting containers is the kubelet’s job; Service rules belong to kube-proxy.', ref: 'https://kubernetes.io/docs/concepts/scheduling-eviction/kube-scheduler/' },
    { q: 'Which component runs on every worker node and makes sure the containers of assigned Pods are running?', options: ['kube-proxy', 'etcd', 'kubelet', 'cloud-controller-manager'], answer: 2, explain: 'The <b>kubelet</b> is the node agent. It watches for Pods bound to its node, starts them through the CRI runtime, runs probes and reports status.', ref: 'https://kubernetes.io/docs/concepts/overview/components/' },
    { q: 'Where does Kubernetes store the desired and current state of all cluster objects?', options: ['In the kubelet’s local cache', 'In etcd', 'In a ConfigMap in kube-system', 'In the container registry'], answer: 1, explain: '<b>etcd</b> is the cluster’s backing store. Everything you create with kubectl ends up there.', ref: 'https://kubernetes.io/docs/concepts/overview/components/' },
    { q: 'An etcd cluster has 5 members. How many members can fail while the cluster still accepts writes?', options: ['1', '2', '3', '4'], answer: 1, explain: 'Quorum for 5 members is 3 (a majority), so <b>2</b> can fail. That is why odd numbers are recommended: 4 members still only tolerate 1 failure.', ref: 'https://etcd.io/docs/v3.5/faq/' },
    { q: 'Which TWO statements about the reconciliation loop are true? (Select 2)', options: ['Controllers continuously compare desired state with actual state', 'It runs once when an object is created', 'Desired state is expressed in an object’s spec field', 'Users must update the status field to trigger reconciliation'], answer: [0, 2], explain: 'Controllers loop forever comparing <b>spec</b> (desired) with observed state and act on the difference. Status is written by the system, not by users.', ref: 'https://kubernetes.io/docs/concepts/architecture/controller/' },
    { q: 'In what order does the API server process a write request?', options: ['Admission → Authentication → Authorization', 'Authorization → Authentication → Admission', 'Authentication → Authorization → Admission', 'Authentication → Admission → Authorization'], answer: 2, explain: 'First <b>who are you</b> (authentication), then <b>are you allowed</b> (authorization, typically RBAC), then <b>admission control</b> (mutating, then validating) before persisting to etcd.', ref: 'https://kubernetes.io/docs/concepts/security/controlling-access/' },
    { q: 'Which component creates cloud load balancers for Services of type LoadBalancer?', options: ['kube-proxy', 'cloud-controller-manager', 'CoreDNS', 'kube-scheduler'], answer: 1, explain: 'The <b>cloud-controller-manager</b> contains the service controller that talks to the cloud provider API to provision external load balancers.', ref: 'https://kubernetes.io/docs/concepts/architecture/cloud-controller/' },
    { q: 'Which of the following resources is cluster-scoped (not namespaced)?', options: ['PersistentVolumeClaim', 'Deployment', 'PersistentVolume', 'ConfigMap'], answer: 2, explain: '<b>PersistentVolume</b> is cluster-scoped, like Node, Namespace, StorageClass and ClusterRole. PVCs, Deployments and ConfigMaps live in namespaces.', ref: 'https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/' },
    { q: 'What is the role of the Container Runtime Interface (CRI)?', options: ['It defines how Pods get IP addresses', 'It lets the kubelet use different container runtimes through a standard API', 'It defines the image format pushed to registries', 'It provides persistent storage to containers'], answer: 1, explain: 'CRI is the gRPC API between the kubelet and the runtime (containerd, CRI-O). Networking is CNI, storage is CSI, and the image format is the OCI image spec.', ref: 'https://kubernetes.io/docs/concepts/containers/cri/' },
    { q: 'The whole control plane becomes unavailable for ten minutes. What happens to Pods already running on worker nodes?', options: ['They are immediately terminated', 'They keep running, but no new scheduling or self-healing happens', 'They are moved to other nodes', 'They restart in a loop'], answer: 1, explain: 'Running containers are managed locally by the kubelet and runtime, so they <b>keep running</b>. Changes such as scaling, scheduling or replacing failed Pods wait until the control plane is back.', ref: 'https://kubernetes.io/docs/concepts/overview/components/' },
    { q: 'Which field of a Kubernetes object holds information that is written by the system and should not be set by users?', options: ['metadata', 'spec', 'status', 'kind'], answer: 2, explain: '<b>status</b> reflects observed state and is updated by controllers and the kubelet.', ref: 'https://kubernetes.io/docs/concepts/overview/working-with-objects/' },
  ],
});
