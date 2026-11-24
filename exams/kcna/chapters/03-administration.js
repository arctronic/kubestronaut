KS.registerChapter('kcna', {
  id: 'administration',
  title: 'Cluster Administration',
  subtitle: 'kubectl, kubeconfig, namespaces, quotas, installing, upgrading and keeping a cluster healthy',
  icon: '🛠️',
  minutes: 35,
  objectives: [
    'Recognise the everyday kubectl commands and what each one does',
    'Explain how kubeconfig clusters, users and contexts decide where kubectl sends requests',
    'Use namespaces, ResourceQuota and LimitRange to divide a cluster between teams',
    'Compare installation options and describe the Kubernetes release, version-skew and upgrade rules',
    'Perform node maintenance, back up etcd and reason about owner references and garbage collection',
  ],

  slides: [
    {
      kicker: 'The CLI',
      title: 'kubectl essentials',
      blocks: [
        { type: 'text', html: 'Every kubectl command follows the same shape: <code>kubectl &lt;verb&gt; &lt;resource&gt; [name] [flags]</code>. kubectl only talks to the <b>API server</b>; it never touches nodes or etcd directly.' },
        { type: 'code', lang: 'bash', title: 'commands you must recognise', code: `
kubectl get pods -n shop -o wide
kubectl describe pod web-7d4f
kubectl apply -f web.yaml
kubectl create deployment web --image=nginx:1.27 --replicas=3
kubectl edit deployment web
kubectl delete -f web.yaml
kubectl logs web-7d4f -c nginx -f --previous
kubectl exec -it web-7d4f -- sh
kubectl port-forward svc/web 8080:80
kubectl run tmp --image=busybox:1.36 -it --rm -- sh`, notes: { 1: '<b>get</b> lists objects. <code>-n</code> picks a namespace, <code>-A</code> means all namespaces, <code>-o wide</code> adds node and IP columns, <code>-w</code> watches.', 2: '<b>describe</b> shows a human-readable summary plus recent <b>Events</b>: the first stop when a Pod is Pending or crashing.', 3: '<b>apply</b> creates or updates from a file: declarative.', 4: '<b>create</b> makes a new object and fails if it already exists: imperative.', 5: '<b>edit</b> opens the live object in your editor and saves it back to the API.', 6: '<b>delete</b> by file, by <code>type/name</code> or by label (<code>-l</code>).', 7: '<b>logs</b>: <code>-c</code> picks a container, <code>-f</code> follows, <code>--previous</code> shows the last crashed instance.', 8: '<b>exec</b> runs a command inside a running container. Everything after <code>--</code> is the command.', 9: '<b>port-forward</b> tunnels local port 8080 to port 80 of the Service through the API server. Great for testing without exposing anything.', 10: '<b>run</b> creates a single <b>Pod</b> (not a Deployment). <code>--rm</code> deletes it when you exit.' } },
      ],
      tip: 'Exam items often show one command and ask what it does. Watch for <code>kubectl run</code> (creates a Pod), <code>logs --previous</code> (crashed container) and <code>port-forward</code> (local tunnel, not a Service).',
    },

    {
      kicker: 'Output & YAML',
      title: 'Output formats and generating manifests',
      blocks: [
        { type: 'cols', ratio: '1.2fr 1fr', cols: [
          [
            { type: 'code', lang: 'bash', title: 'output and dry runs', code: `
kubectl get deploy web -o yaml
kubectl get pods -o json
kubectl get pods -o name
kubectl get pods -o jsonpath='{.items[*].spec.nodeName}'
kubectl create deployment web --image=nginx --dry-run=client -o yaml > web.yaml
kubectl apply -f web.yaml --dry-run=server
kubectl diff -f web.yaml
kubectl explain pod.spec.containers.resources`, notes: { 1: 'The full live object, including <code>status</code> and system metadata.', 3: 'Just <code>pod/name</code> lines, handy for scripting.', 4: 'Extract specific fields. <code>-o custom-columns=…</code> builds your own table.', 5: 'The classic trick: build YAML imperatively <b>without</b> creating anything, then edit and apply it.', 6: '<code>server</code> dry run sends the request through admission and validation but does not persist it.', 7: 'Shows what <code>apply</code> would change in the live object.', 8: 'Field documentation straight from the API schema.' } },
          ],
          [
            { type: 'flip', items: [
              { front: '<code>-o wide</code>', back: 'Extra columns: node, Pod IP, nominated node, readiness gates.' },
              { front: '<code>--dry-run=client</code>', back: 'kubectl builds the object locally and prints it. Nothing reaches the cluster.' },
              { front: '<code>-o yaml</code> vs <code>describe</code>', back: '<code>-o yaml</code> is the raw object (machine-readable). <code>describe</code> is a formatted summary with Events.' },
            ] },
          ],
        ] },
      ],
      tip: '<code>--dry-run=client -o yaml</code> is the answer whenever a question asks how to <b>generate</b> a manifest without creating the resource.',
    },

    {
      kicker: 'Ways of working',
      title: 'Imperative vs declarative management',
      blocks: [
        { type: 'compare', headers: ['Technique', 'Example', 'Strengths', 'Weaknesses'], rows: [
          ['Imperative commands', '<code>kubectl create deployment</code>, <code>scale</code>, <code>expose</code>, <code>set image</code>', 'Fast, nothing to write', 'No record, not repeatable'],
          ['Imperative object configuration', '<code>kubectl create -f</code>, <code>replace -f</code>, <code>delete -f</code>', 'Files can live in Git', '<code>create</code> fails if the object exists; <code>replace</code> drops fields changed by others'],
          ['Declarative object configuration', '<code>kubectl apply -f dir/</code>', 'Idempotent, works on whole directories, basis of GitOps', 'Merging rules are more complex'],
        ] },
        { type: 'cols', cols: [
          [
            { type: 'callout', kind: 'info', title: 'How apply remembers', html: 'Client-side <code>apply</code> stores your last file in the <code>kubectl.kubernetes.io/last-applied-configuration</code> annotation and computes a three-way merge. <code>kubectl apply --server-side</code> instead tracks field ownership in <code>metadata.managedFields</code>.' },
          ],
          [
            { type: 'callout', kind: 'trap', title: 'Mixing styles', html: 'A <code>kubectl scale</code> or <code>kubectl edit</code> on an object managed by Git is overwritten on the next <code>apply</code> (or by Argo CD / Flux). Changes made outside the source of truth are <b>drift</b>.' },
          ],
        ] },
      ],
      tip: 'Running <code>kubectl apply</code> twice with the same file is safe and changes nothing the second time. Running <code>kubectl create</code> twice fails with <i>AlreadyExists</i>.',
    },

    {
      kicker: 'kubeconfig · interactive',
      title: 'Clusters, users and contexts',
      blocks: [
        { type: 'diagram', width: 900, height: 400,
          caption: 'Press ▶ Play to see how kubectl decides where to send a request, or click a box.',
          groups: [
            { x: 190, y: 15, w: 470, h: 370, label: 'kubeconfig file', color: 'amber' },
          ],
          nodes: [
            { id: 'kubectl', x: 20, y: 170, w: 140, h: 56, label: 'kubectl', icon: '💻', color: 'gray', info: 'Looks for configuration in this order: the <code>--kubeconfig</code> flag, then the <code>KUBECONFIG</code> environment variable (a list of files that are merged), then <code>~/.kube/config</code>.' },
            { id: 'cur', x: 210, y: 55, w: 190, h: 56, label: 'current-context', sub: 'dev', color: 'amber', info: 'The context used when you do not pass <code>--context</code>. Changed with <code>kubectl config use-context</code>.' },
            { id: 'ctxa', x: 210, y: 170, w: 190, h: 60, label: 'context: dev', sub: 'cluster + user + ns', color: 'blue', info: 'A context is just a named triple: <b>cluster</b>, <b>user</b> and optionally a default <b>namespace</b>. It holds no credentials itself.' },
            { id: 'ctxb', x: 210, y: 290, w: 190, h: 60, label: 'context: prod', sub: 'cluster + user', color: 'purple', info: 'Selected per command with <code>kubectl --context prod …</code> or permanently with <code>use-context prod</code>.' },
            { id: 'cla', x: 450, y: 55, w: 190, h: 56, label: 'cluster: kind-dev', sub: 'server URL + CA', color: 'green', info: 'A cluster entry holds the API server URL (<code>server</code>) and the CA certificate used to trust it.' },
            { id: 'usr', x: 450, y: 172, w: 190, h: 56, label: 'user: alice', sub: 'cert / token / exec', color: 'pink', info: 'A user entry holds credentials: client certificate and key, a bearer token, or an <code>exec</code> plugin that fetches a token (used by EKS, GKE, AKS and OIDC logins).' },
            { id: 'clb', x: 450, y: 292, w: 190, h: 56, label: 'cluster: prod-eks', sub: 'server URL + CA', color: 'green', info: 'Second cluster in the same file. One kubeconfig can describe many clusters.' },
            { id: 'apia', x: 700, y: 55, w: 180, h: 56, label: 'API server (dev)', icon: '🚪', color: 'teal', info: 'The request lands here and is authenticated with the user credentials from the context.' },
            { id: 'apib', x: 700, y: 292, w: 180, h: 56, label: 'API server (prod)', icon: '🚪', color: 'teal', info: 'Switching context points the same kubectl at a completely different cluster. Always check which context is active before deleting things.' },
          ],
          edges: [
            { from: 'kubectl', to: 'cur', label: 'reads', color: 'gray' },
            { from: 'cur', to: 'ctxa', color: 'amber' },
            { from: 'ctxa', to: 'cla', color: 'blue' },
            { from: 'ctxa', to: 'usr', color: 'blue' },
            { from: 'ctxb', to: 'clb', color: 'purple' },
            { from: 'ctxb', to: 'usr', color: 'purple' },
            { from: 'cla', to: 'apia', color: 'green' },
            { from: 'clb', to: 'apib', color: 'green' },
            { from: 'kubectl', to: 'ctxb', dashed: true, label: '--context prod', color: 'purple' },
          ],
          steps: [
            { on: ['kubectl'], text: 'kubectl loads its configuration: <code>--kubeconfig</code> flag, else the files in <code>$KUBECONFIG</code>, else <code>~/.kube/config</code>.' },
            { on: ['kubectl', 'cur', 'kubectl>cur'], text: 'Without <code>--context</code>, it reads <b>current-context</b>, here <i>dev</i>.' },
            { on: ['cur', 'ctxa', 'cur>ctxa'], text: 'The context <i>dev</i> names a cluster, a user and a default namespace.' },
            { on: ['ctxa', 'cla', 'usr', 'ctxa>cla', 'ctxa>usr'], text: 'The <b>cluster</b> entry gives the API server address and CA; the <b>user</b> entry gives the credentials.' },
            { on: ['cla', 'apia', 'cla>apia'], text: 'kubectl sends an HTTPS request to the dev API server, authenticated as alice.' },
            { on: ['kubectl', 'ctxb', 'kubectl>ctxb', 'ctxb>clb', 'clb', 'clb>apib', 'apib'], text: '<code>kubectl --context prod get pods</code> overrides current-context for one command and goes to the prod cluster instead.' },
          ],
        },
        { type: 'code', lang: 'bash', title: 'kubectl config', code: `
kubectl config get-contexts
kubectl config current-context
kubectl config use-context prod
kubectl config set-context --current --namespace=shop
kubectl config view --minify`, notes: { 3: 'Switches current-context: all later commands go to prod.', 4: 'Changes the default namespace of the active context, so you can stop typing <code>-n shop</code>.', 5: 'Prints only the parts used by the current context (secrets are redacted).' } },
      ],
      tip: '<b>Context = cluster + user + namespace.</b> kubeconfig is a client-side file; the API server knows nothing about contexts.',
    },

    {
      kicker: 'Multi-tenancy',
      title: 'Namespaces',
      blocks: [
        { type: 'text', html: 'A namespace is a <b>scope for names</b> and an attachment point for policy (RBAC, ResourceQuota, LimitRange, NetworkPolicy, Pod Security labels). Names must be unique only within a namespace. Deleting a namespace deletes <b>everything inside it</b>.' },
        { type: 'cards', cols: 2, items: [
          { icon: '📁', color: 'blue', title: 'default', text: 'Where objects go when you do not specify a namespace.' },
          { icon: '⚙️', color: 'red', title: 'kube-system', text: 'Objects created by the Kubernetes system: control plane Pods (kubeadm), CoreDNS, kube-proxy, CNI agents.' },
          { icon: '🌍', color: 'green', title: 'kube-public', text: 'Readable by all clients, including unauthenticated ones. Holds the <code>cluster-info</code> ConfigMap used during bootstrapping.' },
          { icon: '💓', color: 'amber', title: 'kube-node-lease', text: 'One <b>Lease</b> object per node: the lightweight heartbeat the node controller uses to detect failed nodes.' },
        ] },
        { type: 'callout', kind: 'exam', title: 'Namespaces do not isolate the network', html: 'By default, Pods in different namespaces can reach each other freely. Network isolation needs <b>NetworkPolicies</b>. Across namespaces you reach a Service with its DNS name <code>&lt;svc&gt;.&lt;namespace&gt;.svc.cluster.local</code>.' },
      ],
      tip: 'Nodes, PersistentVolumes, StorageClasses, ClusterRoles and Namespaces themselves are <b>cluster-scoped</b>: they belong to no namespace.',
    },

    {
      kicker: 'Fair sharing',
      title: 'ResourceQuota and LimitRange',
      blocks: [
        { type: 'compare', headers: ['', 'ResourceQuota', 'LimitRange'], rows: [
          ['Scope', '<b>Total</b> for the whole namespace', '<b>Per container / Pod / PVC</b> in the namespace'],
          ['Controls', 'Sum of requests/limits, count of Pods, Services, PVCs, Secrets…', 'Min/max per object, <b>default</b> requests and limits'],
          ['Typical goal', '“Team A may use at most 20 CPUs and 50 Pods”', '“Every container gets 100m CPU unless it says otherwise”'],
          ['Enforced by', 'Admission controller at creation time', 'Admission controller at creation time'],
        ] },
        { type: 'cols', cols: [
          [
            { type: 'code', lang: 'yaml', title: 'resourcequota.yaml', code: `
apiVersion: v1
kind: ResourceQuota
metadata:
  name: team-a
  namespace: team-a
spec:
  hard:
    requests.cpu: '20'
    limits.memory: 64Gi
    pods: '50'
    persistentvolumeclaims: '10'`, notes: { 8: 'Sum of CPU requests of all Pods in the namespace.', 10: 'Object count quota: the 51st Pod is rejected.' } },
          ],
          [
            { type: 'code', lang: 'yaml', title: 'limitrange.yaml', code: `
apiVersion: v1
kind: LimitRange
metadata:
  name: defaults
  namespace: team-a
spec:
  limits:
  - type: Container
    defaultRequest:
      cpu: 100m
    default:
      cpu: 500m
    max:
      cpu: '2'`, notes: { 9: 'Injected as the request when a container sets none.', 11: 'Injected as the limit when a container sets none.', 13: 'A container asking for more than 2 CPUs is rejected.' } },
          ],
        ] },
        { type: 'callout', kind: 'trap', title: 'Quota without defaults', html: 'Once a ResourceQuota covers <code>requests.cpu</code> or memory, every new Pod <b>must</b> declare those values, or it is rejected. A LimitRange with defaults fixes that automatically. Neither object affects Pods that already exist.' },
      ],
      tip: 'Quick test: “limit the <b>total</b>” → ResourceQuota; “set <b>defaults</b> or per-container min/max” → LimitRange.',
    },

    {
      kicker: 'Getting a cluster',
      title: 'Installation options',
      blocks: [
        { type: 'cards', cols: 3, items: [
          { icon: '🧰', color: 'blue', title: 'kubeadm', text: 'Official tool to bootstrap a conformant cluster: <code>kubeadm init</code> on the first control plane node, <code>kubeadm join</code> on the others. You still provide machines, a runtime and a CNI.' },
          { icon: '🐳', color: 'teal', title: 'kind', text: '<b>K</b>ubernetes <b>in D</b>ocker: each node is a container. Starts in seconds, supports multi-node; ideal for CI and testing Kubernetes itself.' },
          { icon: '💻', color: 'green', title: 'minikube', text: 'Local learning/dev cluster in a VM or container on your laptop, with handy add-ons (dashboard, ingress, metrics-server).' },
          { icon: '🪶', color: 'amber', title: 'k3s', text: 'Lightweight, certified distribution packaged as a single binary. Uses SQLite by default (embedded etcd for HA). Popular for edge, IoT and ARM.' },
          { icon: '☁️', color: 'purple', title: 'Managed: EKS, GKE, AKS', text: 'The cloud provider runs and upgrades the control plane (including etcd). You manage workloads and, usually, node pools.' },
          { icon: '🏗️', color: 'gray', title: 'Others', text: 'Kubespray (Ansible playbooks), Cluster API (clusters managed declaratively by another cluster), vendor platforms such as OpenShift and Rancher.' },
        ] },
        { type: 'compare', headers: ['Need', 'Pick'], rows: [
          ['Throw-away cluster in a CI pipeline', 'kind'],
          ['Learn on a laptop with add-ons', 'minikube'],
          ['Small footprint on edge devices', 'k3s'],
          ['Full control over self-managed production', 'kubeadm (or Kubespray / Cluster API)'],
          ['No control plane to operate', 'EKS / GKE / AKS'],
        ] },
      ],
      tip: 'In a managed service you <b>cannot</b> SSH to the control plane or back up etcd yourself; that is the provider’s responsibility. The <b>Certified Kubernetes</b> conformance program verifies that distributions expose a consistent API.',
    },

    {
      kicker: 'Releases',
      title: 'Versioning, cadence and version skew',
      blocks: [
        { type: 'stats', items: [
          { value: 'x.y.z', label: 'major.minor.patch (semver)' },
          { value: '3', label: 'minor releases per year' },
          { value: '~14 mo', label: 'support per minor release' },
          { value: '3', label: 'newest minors maintained' },
        ] },
        { type: 'compare', headers: ['Component', 'Allowed skew relative to kube-apiserver'], rows: [
          ['Other kube-apiservers (HA)', 'Within <b>1</b> minor version of each other'],
          ['kube-controller-manager, kube-scheduler, cloud-controller-manager', 'Not newer; may be <b>1</b> minor older'],
          ['kubelet, kube-proxy', 'Not newer; may be up to <b>3</b> minor versions older'],
          ['kubectl', 'Within <b>1</b> minor version, older or newer'],
        ] },
        { type: 'callout', kind: 'exam', title: 'The golden rule', html: '<b>Nothing may be newer than the API server.</b> That is why the control plane is always upgraded <b>first</b> and nodes afterwards. Example: with a 1.33 API server, a 1.30 kubelet is supported, a 1.34 kubelet is not.' },
      ],
      tip: 'Patch releases (1.33.<b>z</b>) bring bug and security fixes and arrive roughly monthly; minor releases (1.<b>y</b>) bring features roughly every four months.',
    },

    {
      kicker: 'Upgrades',
      title: 'Upgrading a kubeadm cluster',
      blocks: [
        { type: 'flow', caption: 'One minor version at a time, control plane first. Click a step.', items: [
          { icon: '📦', label: 'Upgrade kubeadm', sub: 'first control plane node', info: 'Install the new kubeadm package version on the first control plane node.' },
          { icon: '🔍', label: 'kubeadm upgrade plan', sub: 'check what is possible', info: 'Verifies the cluster can be upgraded and lists target versions for each component.' },
          { icon: '🚀', label: 'kubeadm upgrade apply', sub: 'v1.y.z', info: 'Upgrades the static Pod manifests of the API server, controller-manager, scheduler and etcd, plus CoreDNS and kube-proxy add-ons. Other control plane nodes run <code>kubeadm upgrade node</code>.' },
          { icon: '🤖', label: 'kubelet & kubectl', sub: 'on control plane nodes', info: 'Drain the node, upgrade the kubelet and kubectl packages, restart the kubelet, uncordon.' },
          { icon: '🧱', label: 'Workers, one by one', sub: 'drain → upgrade → uncordon', info: 'For each worker: <code>kubectl drain</code>, upgrade kubeadm, <code>kubeadm upgrade node</code>, upgrade and restart the kubelet, <code>kubectl uncordon</code>.' },
        ] },
        { type: 'callout', kind: 'warn', title: 'No skipping minors', html: 'Going from 1.31 to 1.33 means two upgrades: 1.31 → 1.32 → 1.33. Skipping a minor version is not supported. Back up etcd before you start.' },
      ],
      tip: 'Order to remember: <b>kubeadm → control plane → kubelets</b>, and <b>control plane nodes → worker nodes</b>.',
    },

    {
      kicker: 'API lifecycle',
      title: 'API versions and deprecation',
      blocks: [
        { type: 'compare', headers: ['Level', 'Example', 'Enabled by default?', 'After deprecation'], rows: [
          ['Alpha', '<code>v1alpha1</code>', 'No (feature gate)', 'Can be removed in any release without notice'],
          ['Beta', '<code>v1beta1</code>, <code>v2beta2</code>', 'New beta APIs: no (since 1.24)', 'Still served for at least <b>9 months or 3 releases</b>, whichever is longer'],
          ['Stable (GA)', '<code>v1</code>, <code>v2</code>', 'Yes', 'Not removed within the same major version'],
        ] },
        { type: 'timeline', items: [
          { when: '1.22', title: 'Ingress v1beta1 removed', text: '<code>extensions/v1beta1</code> and <code>networking.k8s.io/v1beta1</code> Ingress stopped being served; manifests had to move to <code>networking.k8s.io/v1</code>.' },
          { when: '1.24', title: 'dockershim removed', text: 'Docker Engine is no longer usable as a runtime directly; containerd or CRI-O are used through CRI.' },
          { when: '1.25', title: 'PodSecurityPolicy removed', text: 'Replaced by Pod Security Admission and the Pod Security Standards.' },
        ] },
        { type: 'callout', kind: 'tip', title: 'Before every upgrade', html: 'Read the release notes and the deprecation guide, look for API server deprecation warnings, and migrate manifests (the <code>kubectl convert</code> plugin helps). Objects already stored in etcd are converted automatically; it is your <b>YAML files and Helm charts</b> that break.' },
      ],
      tip: 'If a question says “a manifest that worked last year now fails with <i>no matches for kind … in version …</i> after an upgrade”, the API version was <b>removed</b>.',
    },

    {
      kicker: 'Node maintenance',
      title: 'cordon, drain, uncordon',
      blocks: [
        { type: 'cols', ratio: '1.1fr 1fr', cols: [
          [
            { type: 'code', lang: 'bash', title: 'maintenance window', code: `
kubectl cordon node-2
kubectl drain node-2 --ignore-daemonsets --delete-emptydir-data
# patch the OS, upgrade the kubelet, reboot ...
kubectl uncordon node-2
kubectl get nodes`, notes: { 1: '<b>cordon</b>: mark the node unschedulable. Existing Pods keep running; no new ones arrive.', 2: '<b>drain</b>: cordons, then <b>evicts</b> Pods so their controllers recreate them elsewhere. Respects PodDisruptionBudgets. DaemonSet Pods must be ignored because they would just come back.', 4: '<b>uncordon</b>: schedulable again. Pods do <b>not</b> automatically move back; new Pods will land here.', 5: 'A cordoned node shows <code>Ready,SchedulingDisabled</code>.' } },
          ],
          [
            { type: 'compare', headers: ['Command', 'New Pods?', 'Existing Pods'], rows: [
              ['cordon', 'Blocked', 'Stay'],
              ['drain', 'Blocked', 'Evicted'],
              ['uncordon', 'Allowed', 'Unchanged'],
            ] },
            { type: 'callout', kind: 'trap', html: 'Bare Pods (no controller) are deleted by drain and <b>not</b> recreated; drain refuses unless you add <code>--force</code>. Use a <b>PodDisruptionBudget</b> to keep a minimum number of replicas up during drains.' },
          ],
        ] },
      ],
      tip: '“Prevent new Pods from being scheduled on a node without touching running ones” → <code>kubectl cordon</code>. “Safely empty a node” → <code>kubectl drain</code>.',
    },

    {
      kicker: 'Disaster recovery',
      title: 'Backing up etcd',
      blocks: [
        { type: 'code', lang: 'bash', title: 'snapshot with etcdctl', code: `
ETCDCTL_API=3 etcdctl snapshot save /backup/etcd-snap.db \\
  --endpoints=https://127.0.0.1:2379 \\
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \\
  --cert=/etc/kubernetes/pki/etcd/server.crt \\
  --key=/etc/kubernetes/pki/etcd/server.key
etcdutl snapshot status /backup/etcd-snap.db
etcdutl snapshot restore /backup/etcd-snap.db --data-dir /var/lib/etcd-restored`, notes: { 1: '<code>snapshot save</code> takes a consistent point-in-time copy of the whole keyspace from a <b>running</b> member. API version 3 is the default in current etcdctl.', 2: 'The client URL of an etcd member (port 2379; members talk to each other on 2380).', 3: 'etcd uses mutual TLS: the CA plus a client certificate and key. kubeadm keeps them in <code>/etc/kubernetes/pki/etcd/</code>.', 6: 'Offline file operations such as status and restore live in <code>etcdutl</code> (older guides use <code>etcdctl snapshot restore</code>).', 7: 'Restore into a <b>new</b> data directory, then point the etcd static Pod manifest at it.' } },
        { type: 'cols', cols: [
          [
            { type: 'callout', kind: 'exam', title: 'What a snapshot contains', html: 'All API objects: Deployments, Secrets, RBAC, CRDs and their custom resources. It does <b>not</b> contain the data inside PersistentVolumes or container images; those need their own backup (e.g. Velero, storage snapshots).' },
          ],
          [
            { type: 'callout', kind: 'warn', title: 'Treat it like a secret', html: 'Unless encryption at rest is enabled, Secrets sit in the snapshot as plain base64. Store backups encrypted and off the cluster.' },
          ],
        ] },
      ],
      tip: 'Backing up etcd = backing up the cluster state. Combine regular <code>etcdctl snapshot save</code> runs with keeping your manifests in Git.',
    },

    {
      kicker: 'Housekeeping',
      title: 'Owner references, garbage collection and plugins',
      blocks: [
        { type: 'cols', ratio: '1fr 1.1fr', cols: [
          [
            { type: 'code', lang: 'yaml', title: 'a Pod owned by a ReplicaSet', code: `
metadata:
  name: web-6b9f-x2k4
  ownerReferences:
  - apiVersion: apps/v1
    kind: ReplicaSet
    name: web-6b9f
    controller: true
    blockOwnerDeletion: true`, notes: { 3: '<code>ownerReferences</code> points a dependent at its owner. Controllers set it automatically: Deployment → ReplicaSet → Pod, Job → Pod.', 7: 'Marks the managing controller. A namespaced dependent may only have owners in the same namespace or cluster-scoped owners.', 8: 'In foreground deletion, the owner is not removed until this dependent is gone.' } },
          ],
          [
            { type: 'compare', headers: ['<code>--cascade=</code>', 'What happens'], rows: [
              ['<code>background</code> (default)', 'Owner deleted immediately; the garbage collector deletes dependents afterwards'],
              ['<code>foreground</code>', 'Dependents deleted first, then the owner'],
              ['<code>orphan</code>', 'Owner deleted, dependents kept with their ownerReference removed'],
            ] },
            { type: 'callout', kind: 'info', title: 'Finalizers', html: 'Keys in <code>metadata.finalizers</code> block deletion until a controller removes them (e.g. <code>kubernetes.io/pvc-protection</code> keeps an in-use PVC). They are why objects can hang in <i>Terminating</i>.' },
          ],
        ] },
        { type: 'cards', cols: 2, items: [
          { icon: '🔌', color: 'teal', title: 'kubectl plugins', text: 'Any executable named <code>kubectl-foo</code> on your PATH becomes <code>kubectl foo</code>. <code>kubectl plugin list</code> shows them.' },
          { icon: '📦', color: 'purple', title: 'krew', text: 'The plugin manager for kubectl: <code>kubectl krew install ctx ns</code> adds context and namespace switchers.' },
        ] },
        { type: 'match', title: 'Match the task to the command', pairs: [
          ['Stop new Pods landing on a node', 'kubectl cordon'],
          ['Switch the active cluster', 'kubectl config use-context'],
          ['Generate YAML without creating anything', '--dry-run=client -o yaml'],
          ['Delete a Deployment but keep its ReplicaSets', '--cascade=orphan'],
          ['Back up all cluster objects', 'etcdctl snapshot save'],
        ] },
        { type: 'check', q: 'You delete a Deployment with plain <code>kubectl delete deployment web</code>. What happens to its ReplicaSets and Pods?', options: ['They keep running as orphans', 'They are deleted by the garbage collector because their ownerReferences point to the deleted Deployment', 'The ReplicaSets are kept but the Pods are deleted', 'The command fails until you delete the Pods first'], answer: 1, explain: 'The default cascading deletion is <b>background</b>: the Deployment disappears at once and the garbage collector removes the dependents it owned (ReplicaSets, then their Pods). Keeping them requires <code>--cascade=orphan</code>.' },
      ],
      tip: 'Owner references are why deleting a Deployment cleans up everything it created, while deleting a single Pod only makes its ReplicaSet create another one.',
    },
  ],

  summary: [
    'kubectl talks only to the API server: <b>get, describe, apply, create, edit, delete, logs, exec, port-forward</b>; <code>--dry-run=client -o yaml</code> generates manifests.',
    '<b>Imperative</b> commands are fast; <b>declarative</b> <code>kubectl apply</code> is idempotent and the basis of GitOps.',
    'kubeconfig holds <b>clusters, users and contexts</b>; a context = cluster + user + namespace; switch with <code>kubectl config use-context</code>.',
    'Built-in namespaces: <b>default, kube-system, kube-public, kube-node-lease</b>. ResourceQuota caps namespace totals; LimitRange sets per-container defaults and bounds.',
    '3 minor releases per year, ~14 months support each. <b>Nothing may be newer than the API server</b>; kubelets may lag up to 3 minors. Upgrade control plane first, one minor at a time.',
    'Maintenance: <b>cordon</b> (no new Pods) → <b>drain</b> (evict) → <b>uncordon</b>. Back up cluster state with <code>etcdctl snapshot save</code>.',
    '<b>ownerReferences</b> drive garbage collection: default background cascade, or foreground / orphan.',
  ],

  glossary: [
    { term: 'kubectl', def: 'The Kubernetes command-line client; turns commands and manifests into API server requests.' },
    { term: 'kubeconfig', def: 'Client config file (default ~/.kube/config) listing clusters, users, contexts and the current-context.' },
    { term: 'Context', def: 'Named combination of a cluster, a user and optionally a default namespace in kubeconfig.' },
    { term: 'Declarative management', def: 'Describing desired state in files and using kubectl apply to converge objects to it, repeatedly and idempotently.' },
    { term: 'Dry run', def: 'Executing a request without persisting it: client-side (local only) or server-side (through admission and validation).' },
    { term: 'Namespace', def: 'Virtual partition of a cluster providing a scope for names and a target for quotas and policies.' },
    { term: 'kube-node-lease', def: 'Namespace holding one Lease object per node, used as a lightweight node heartbeat.' },
    { term: 'ResourceQuota', def: 'Namespace object limiting the aggregate resource consumption and object counts in that namespace.' },
    { term: 'LimitRange', def: 'Namespace object setting default, minimum and maximum resources per container, Pod or PVC.' },
    { term: 'kubeadm', def: 'Official tool for bootstrapping (init/join) and upgrading conformant Kubernetes clusters.' },
    { term: 'kind', def: 'Kubernetes IN Docker: runs cluster nodes as containers, commonly used for CI and testing.' },
    { term: 'Version skew policy', def: 'Rules for how far component versions may differ; no component may be newer than kube-apiserver.' },
    { term: 'Drain', def: 'Cordon a node and evict its Pods (respecting PodDisruptionBudgets) before maintenance.' },
    { term: 'etcd snapshot', def: 'Point-in-time backup of the etcd keyspace, taken with etcdctl snapshot save.' },
    { term: 'ownerReferences', def: 'Metadata linking a dependent object to its owner, used by the garbage collector for cascading deletion.' },
    { term: 'krew', def: 'Package manager for kubectl plugins (executables named kubectl-<name>).' },
  ],

  quiz: [
    { q: 'What does <code>kubectl create deployment api --image=shop/api:1.0 --dry-run=client -o yaml</code> do?', options: ['Creates the Deployment and prints it as YAML', 'Prints a Deployment manifest without sending anything to the cluster', 'Validates the Deployment on the API server without storing it', 'Creates the Deployment in a dry-run namespace'], answer: 1, explain: 'With <code>--dry-run=client</code> kubectl builds the object locally and <code>-o yaml</code> prints it, a common way to generate a manifest. Validation by the API server without persisting is <code>--dry-run=server</code>. There is no special dry-run namespace.' },
    { q: 'A developer wants to test a ClusterIP Service from their laptop without creating an Ingress or changing the Service type. Which command fits?', options: ['<code>kubectl expose svc/web --type=NodePort</code>', '<code>kubectl exec -it svc/web -- curl localhost</code>', '<code>kubectl port-forward svc/web 8080:80</code>', '<code>kubectl proxy --port=80 svc/web</code>'], answer: 2, explain: '<code>port-forward</code> opens a tunnel through the API server from a local port to the Service, with no cluster changes. <code>expose</code> creates a new Service; <code>exec</code> runs a command in a container; <code>kubectl proxy</code> exposes the API server itself, not an application port.' },
    { q: 'Which kubeconfig element combines a cluster, a user and a default namespace?', options: ['A context', 'A ServiceAccount', 'A Role', 'A cluster entry'], answer: 0, explain: 'A <b>context</b> is the named triple of cluster, user and namespace. A cluster entry holds only the server URL and CA; ServiceAccounts and Roles are API objects in the cluster, not kubeconfig sections.' },
    { q: 'Which command makes all subsequent kubectl commands target the cluster defined in the context <code>staging</code>?', options: ['<code>kubectl config set-cluster staging</code>', '<code>kubectl config use-context staging</code>', '<code>kubectl config set-context staging --current</code>', '<code>kubectl --context staging</code>'], answer: 1, explain: '<code>use-context</code> changes the <b>current-context</b> stored in kubeconfig. <code>set-cluster</code> creates or edits a cluster entry; <code>set-context</code> edits a context; <code>--context</code> applies only to a single command.' },
    { q: 'Which namespace contains one Lease object per node, used for node heartbeats?', options: ['kube-system', 'kube-public', 'default', 'kube-node-lease'], answer: 3, explain: '<b>kube-node-lease</b> holds a Lease per node that the kubelet renews; the node controller uses it to detect failures. kube-system holds system components, kube-public holds publicly readable data like cluster-info, and default is for user objects with no namespace specified.' },
    { q: 'A platform team wants to ensure the <code>team-a</code> namespace can never use more than 40 CPU cores of requests in total. Which object should they create?', options: ['LimitRange', 'ResourceQuota', 'PodDisruptionBudget', 'PriorityClass'], answer: 1, explain: 'A <b>ResourceQuota</b> caps aggregate usage per namespace. A LimitRange works per container or Pod (defaults, min, max) and cannot cap totals. A PodDisruptionBudget limits voluntary evictions; a PriorityClass ranks Pods for scheduling and preemption.' },
    { q: 'Which TWO tools are mainly used to run a local or throw-away Kubernetes cluster for development and CI? (Select 2)', options: ['kind', 'kubeadm upgrade', 'minikube', 'etcdctl'], answer: [0, 2], explain: '<b>kind</b> runs nodes as containers and <b>minikube</b> runs a local cluster in a VM or container; both are built for dev and CI. <code>kubeadm upgrade</code> upgrades an existing cluster, and etcdctl is the etcd client used for backups.' },
    { q: 'The API servers of a cluster run 1.33. Which kubelet version is supported on a worker node according to the version skew policy?', options: ['1.34', '1.35', '1.30', '1.29'], answer: 2, explain: 'A kubelet must not be newer than kube-apiserver and may be up to <b>three</b> minor versions older, so 1.30 to 1.33 are supported. 1.34 and 1.35 are newer than the API server; 1.29 is four minors behind.' },
    { q: 'You need to upgrade a kubeadm cluster from 1.31 to 1.33. What is the correct approach?', options: ['Upgrade the worker nodes to 1.33 first, then the control plane', 'Run <code>kubeadm upgrade apply v1.33.x</code> once on the control plane', 'Upgrade the control plane and then the nodes to 1.32, then repeat for 1.33', 'Upgrade all nodes at the same time to avoid version skew'], answer: 2, explain: 'kubeadm upgrades go <b>one minor version at a time</b>, control plane first, then nodes. Jumping straight to 1.33 skips a minor, upgrading workers first would make kubelets newer than the API server, and upgrading everything at once risks the whole cluster.' },
    { q: 'Which TWO statements about <code>kubectl drain node-3 --ignore-daemonsets</code> are true? (Select 2)', options: ['It marks node-3 as unschedulable', 'It deletes node-3 from the cluster', 'It evicts Pods while respecting PodDisruptionBudgets', 'It automatically uncordons the node when finished'], answer: [0, 2], explain: 'Drain first <b>cordons</b> the node, then <b>evicts</b> its Pods through the Eviction API, honouring PodDisruptionBudgets. The Node object stays in the cluster, and you must run <code>kubectl uncordon</code> yourself after maintenance.' },
    { q: 'Which command takes a backup of all Kubernetes API objects in a self-managed cluster?', options: ['<code>kubectl get all -A -o yaml &gt; backup.yaml</code>', '<code>kubeadm upgrade plan</code>', '<code>etcdctl snapshot save</code>', '<code>kubectl cordon --all</code>'], answer: 2, explain: '<code>etcdctl snapshot save</code> copies the whole etcd keyspace, which holds every object. <code>kubectl get all</code> misses many kinds (Secrets, ConfigMaps, RBAC, CRDs) because “all” covers only a few common workload types. The other commands do not back anything up.' },
    { q: 'You run <code>kubectl delete replicaset web-6b9f --cascade=orphan</code>. What happens?', options: ['The ReplicaSet is deleted and its Pods keep running without an owner', 'The Pods are deleted first, then the ReplicaSet', 'The ReplicaSet is deleted and the garbage collector removes its Pods in the background', 'Nothing is deleted until all finalizers are removed from the Pods'], answer: 0, explain: '<b>orphan</b> removes the owner and strips the ownerReference from dependents, leaving them running. Pods-first is <b>foreground</b>; immediate owner deletion followed by dependent cleanup is the default <b>background</b> cascade.' },
  ],
});
