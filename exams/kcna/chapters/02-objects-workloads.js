KS.registerChapter('kcna', {
  id: 'objects',
  title: 'Objects & Workloads',
  subtitle: 'Pods, the controllers that manage them, and how configuration, health checks and resources are attached',
  icon: 'blocks',
  minutes: 35,
  objectives: [
    'Describe what containers in one Pod share, and when to use init containers and sidecars',
    'Choose the right workload object: Deployment, StatefulSet, DaemonSet, Job or CronJob',
    'Explain how a Deployment performs a rolling update and a rollback through ReplicaSets',
    'Consume ConfigMaps and Secrets as environment variables or volumes and know the difference',
    'Tell liveness, readiness and startup probes apart and derive a Pod’s QoS class from its resources',
  ],

  slides: [
    {
      kicker: 'The atom',
      title: 'Pods: the smallest deployable unit',
      blocks: [
        { type: 'cols', ratio: '1fr 1.15fr', cols: [
          [
            { type: 'text', html: 'Kubernetes never schedules a bare container. It schedules a <b>Pod</b>: a group of one or more containers that are always placed on the <b>same node</b> and share a context.' },
            { type: 'cards', cols: 1, items: [
              { icon: 'globe', color: 'blue', title: 'Shared network', text: 'One IP address and one port space per Pod. Containers talk to each other over <code>localhost</code>, so two containers cannot both listen on port 80.' },
              { icon: 'save', color: 'green', title: 'Shared storage', text: 'Volumes are declared at Pod level and mounted into any container. <code>emptyDir</code> is the classic scratch space shared by containers.' },
              { icon: 'recycle', color: 'amber', title: 'Shared fate', text: 'Pods are ephemeral and are not “moved”. A replacement Pod gets a new name and a new IP. That is why you put controllers and Services in front of them.' },
            ] },
          ],
          [
            { type: 'code', lang: 'yaml', title: 'pod.yaml (two containers)', code: `
apiVersion: v1
kind: Pod
metadata:
  name: web
  labels:
    app: web
spec:
  volumes:
  - name: logs
    emptyDir: {}
  containers:
  - name: nginx
    image: nginx:1.27
    ports:
    - containerPort: 80
    volumeMounts:
    - name: logs
      mountPath: /var/log/nginx
  - name: shipper
    image: fluent/fluent-bit:3.0
    volumeMounts:
    - name: logs
      mountPath: /logs`, notes: { 1: 'Pods live in the <b>core</b> API group, so the apiVersion is just <code>v1</code>.', 9: 'Volumes are defined once at Pod level…', 10: '<code>emptyDir</code> is created when the Pod starts on a node and deleted when the Pod is removed. It survives container restarts.', 11: '<code>containers</code> is a list: every entry runs in the same network namespace.', 17: '…and mounted by each container that needs them.', 20: 'A helper container reading the same files: the sidecar pattern.' } },
          ],
        ] },
      ],
      tip: '“Smallest deployable unit in Kubernetes?” The answer is always <b>Pod</b>, never container or node. In practice you rarely create Pods directly; a controller creates them from a Pod template.',
    },

    {
      kicker: 'Pod design',
      title: 'Init containers, sidecars and multi-container patterns',
      blocks: [
        { type: 'flip', title: 'Flip each pattern', items: [
          { front: 'Init container', back: 'Listed under <code>initContainers</code>. Runs <b>to completion, one after another</b>, before any app container starts. Typical use: wait for a database, run a migration, fetch config. If one fails, the kubelet retries it according to the Pod’s restartPolicy.' },
          { front: 'Native sidecar', back: 'An init container with <code>restartPolicy: Always</code>. It starts before the app containers, <b>keeps running</b> alongside them and is stopped after them. Does not block a Job from completing. GA in Kubernetes 1.33.' },
          { front: 'Sidecar pattern', back: 'A helper that extends the main container: log shipper, config reloader, service mesh proxy (Envoy in Istio).' },
          { front: 'Ambassador', back: 'A proxy that represents an <b>outside</b> service to the app. The app talks to <code>localhost</code>; the ambassador handles connection details, sharding or TLS.' },
          { front: 'Adapter', back: 'Transforms the app’s output into a standard format, e.g. converts custom metrics into Prometheus format.' },
        ] },
        { type: 'code', lang: 'yaml', title: 'init container + native sidecar', code: `
spec:
  initContainers:
  - name: wait-for-db
    image: busybox:1.36
    command: ['sh', '-c', 'until nc -z db 5432; do sleep 2; done']
  - name: log-agent
    image: fluent/fluent-bit:3.0
    restartPolicy: Always
  containers:
  - name: app
    image: shop/api:2.1`, notes: { 3: 'Classic init container: must exit 0 before the next one starts.', 7: 'Setting <code>restartPolicy: Always</code> on an init container turns it into a <b>native sidecar</b>: it is started in order, then keeps running.', 9: 'App containers start only after all classic init containers have completed and sidecars have started.' } },
      ],
      tip: 'Cue words: “must run <b>before</b> the app starts” → init container. “Runs <b>alongside</b> the app for its whole life” → sidecar. A service mesh injecting a proxy uses the sidecar pattern.',
    },

    {
      kicker: 'Lifecycle',
      title: 'Pod phases and restartPolicy',
      blocks: [
        { type: 'flow', caption: 'The five values of <code>status.phase</code>. Click a phase for details.', items: [
          { icon: 'hourglass', label: 'Pending', sub: 'accepted, not running yet', info: 'The Pod object exists but at least one container is not yet running: waiting to be scheduled, pulling images, or running init containers.' },
          { icon: 'activity', label: 'Running', sub: 'bound, ≥1 container up', info: 'The Pod is bound to a node and at least one container is running, starting or restarting.' },
          { icon: 'circle-check', label: 'Succeeded', sub: 'all exited 0', info: 'All containers terminated successfully and will not be restarted. Typical end state of a Job Pod.' },
          { icon: 'circle-x', label: 'Failed', sub: 'all exited, ≥1 error', info: 'All containers terminated and at least one exited with a non-zero code or was killed by the system.' },
          { icon: 'circle-help', label: 'Unknown', sub: 'node unreachable', info: 'The state could not be obtained, usually because the API server lost contact with the node’s kubelet.' },
        ] },
        { type: 'compare', headers: ['restartPolicy', 'Container restarted when…', 'Allowed in'], rows: [
          ['<code>Always</code> (default)', 'it exits for any reason', 'Pods, Deployments, StatefulSets, DaemonSets (required there)'],
          ['<code>OnFailure</code>', 'it exits with a non-zero code', 'Jobs / CronJobs, bare Pods'],
          ['<code>Never</code>', 'never', 'Jobs / CronJobs, bare Pods'],
        ] },
        { type: 'callout', kind: 'trap', title: 'CrashLoopBackOff is not a phase', html: '<code>CrashLoopBackOff</code>, <code>ImagePullBackOff</code> and <code>ContainerCreating</code> are container <b>state reasons</b> shown by <code>kubectl get pods</code>. The Pod phase meanwhile is Running or Pending. The kubelet restarts crashing containers with an exponential back-off delay capped at five minutes.' },
      ],
      tip: 'restartPolicy is set per <b>Pod</b>, and restarts happen in place on the same node by the kubelet. Restarting a container never reschedules the Pod to another node.',
    },

    {
      kicker: 'Glue',
      title: 'Labels and selectors',
      blocks: [
        { type: 'text', html: 'Labels are key/value pairs in <code>metadata.labels</code>. Controllers and Services do not keep lists of Pods; they <b>select</b> Pods by label, continuously. Change a Pod’s labels and it can drop out of its ReplicaSet and Service.' },
        { type: 'cols', cols: [
          [
            { type: 'compare', headers: ['', 'Equality-based', 'Set-based'], rows: [
              ['Operators', '<code>=</code> <code>==</code> <code>!=</code>', '<code>in</code> <code>notin</code> <code>exists</code> (key only)'],
              ['kubectl', '<code>-l app=web,tier!=db</code>', '<code>-l \'env in (prod,qa)\'</code>'],
              ['In YAML', '<code>matchLabels</code>', '<code>matchExpressions</code>'],
              ['Supported by', 'Services, ReplicaSet, Deployment, Job…', 'ReplicaSet, Deployment, DaemonSet, Job… (not Service)'],
            ] },
          ],
          [
            { type: 'code', lang: 'bash', title: 'working with labels', code: `
kubectl get pods --show-labels
kubectl get pods -l app=web
kubectl get pods -l 'env in (prod,staging)'
kubectl get pods -l '!canary'
kubectl label pod web-7d4f tier=frontend
kubectl label pod web-7d4f tier-`, notes: { 1: 'Adds a LABELS column.', 4: 'Selects Pods that do <b>not</b> have the <code>canary</code> key at all.', 5: 'Add a label; use <code>--overwrite</code> to change an existing value.', 6: 'A trailing dash <b>removes</b> the label.' } },
          ],
        ] },
        { type: 'check', q: 'A Service has <code>selector: {app: shop}</code>. You run <code>kubectl label pod shop-1 app=debug --overwrite</code>. What happens?', options: ['The Service keeps routing to shop-1 because it was selected when created', 'shop-1 is removed from the Service endpoints, and its ReplicaSet (if any) creates a replacement Pod', 'The command fails because labels are immutable', 'shop-1 is deleted immediately'], answer: 1, explain: 'Selection is evaluated continuously. Once the label no longer matches, the Pod leaves the Service’s EndpointSlices, and a ReplicaSet selecting <code>app=shop</code> sees one Pod too few and creates a new one. The relabelled Pod keeps running as an orphan, which is a handy debugging trick. Labels are mutable.', ref: 'https://kubernetes.io/docs/concepts/workloads/controllers/replicaset/' },
      ],
      tip: 'Labels identify and select; annotations hold non-identifying metadata. Label values are at most 63 characters. A Deployment’s <code>spec.selector</code> is immutable after creation.',
    },

    {
      kicker: 'Controllers · interactive',
      title: 'Deployment → ReplicaSet → Pods: a rolling update',
      blocks: [
        { type: 'diagram', width: 900, height: 420,
          intro: 'A Deployment with <code>replicas: 3</code>, <code>maxSurge: 1</code>, <code>maxUnavailable: 0</code> is updated from v1 to v2.',
          caption: 'Press Play to watch <code>kubectl set image deployment/web app=web:v2</code> roll out, or click any box.',
          groups: [
            { x: 230, y: 10, w: 660, h: 130, label: 'Old ReplicaSet (revision 1)', color: 'gray' },
            { x: 230, y: 270, w: 660, h: 140, label: 'New ReplicaSet (revision 2)', color: 'green' },
          ],
          nodes: [
            { id: 'dep', x: 20, y: 180, w: 170, h: 60, label: 'Deployment', icon: 'rocket', sub: 'web · replicas 3', color: 'blue', info: 'Owns ReplicaSets, not Pods directly. It stores the strategy (RollingUpdate or Recreate) and keeps old ReplicaSets (up to <code>revisionHistoryLimit</code>, default 10) for rollbacks.' },
            { id: 'rs1', x: 250, y: 50, w: 170, h: 60, label: 'ReplicaSet', sub: 'web-6b9f · image v1', color: 'gray', info: 'Created for the original Pod template. Its name and its Pods carry a <code>pod-template-hash</code> label so the two ReplicaSets never select each other’s Pods.' },
            { id: 'rs2', x: 250, y: 310, w: 170, h: 60, label: 'ReplicaSet', sub: 'web-7c5d · image v2', color: 'green', info: 'Created when the Pod template changed (new image). Only changes to <code>spec.template</code> trigger a rollout; scaling replicas does not.' },
            { id: 'p1a', x: 460, y: 55, w: 120, h: 50, label: 'Pod v1', round: true, color: 'gray', info: 'Old Pod. Will be terminated once a v2 Pod is Ready.' },
            { id: 'p1b', x: 600, y: 55, w: 120, h: 50, label: 'Pod v1', round: true, color: 'gray', info: 'Old Pod. Still receiving traffic from the Service during the rollout.' },
            { id: 'p1c', x: 740, y: 55, w: 120, h: 50, label: 'Pod v1', round: true, color: 'gray', info: 'Old Pod. The last one to go.' },
            { id: 'svc', x: 620, y: 180, w: 160, h: 56, label: 'Service', icon: 'shuffle', sub: 'selector app=web', color: 'teal', info: 'The Service selects <code>app=web</code>, which matches Pods of <b>both</b> ReplicaSets. During a rolling update users can hit v1 and v2. Only <b>Ready</b> Pods receive traffic.' },
            { id: 'p2a', x: 460, y: 315, w: 120, h: 50, label: 'Pod v2', round: true, color: 'green', info: 'First new Pod, created by surging to 4 Pods total.' },
            { id: 'p2b', x: 600, y: 315, w: 120, h: 50, label: 'Pod v2', round: true, color: 'green', info: 'Second new Pod.' },
            { id: 'p2c', x: 740, y: 315, w: 120, h: 50, label: 'Pod v2', round: true, color: 'green', info: 'Third new Pod. Rollout complete.' },
          ],
          edges: [
            { from: 'dep', to: 'rs1', label: 'owns', color: 'gray' },
            { from: 'dep', to: 'rs2', label: 'owns', color: 'green' },
            { from: 'rs1', to: 'p1a', color: 'gray' },
            { from: 'rs1', to: 'p1b', color: 'gray', bend: -30 },
            { from: 'rs1', to: 'p1c', color: 'gray', bend: -50 },
            { from: 'rs2', to: 'p2a', color: 'green' },
            { from: 'rs2', to: 'p2b', color: 'green', bend: 30 },
            { from: 'rs2', to: 'p2c', color: 'green', bend: 50 },
            { from: 'svc', to: 'p1b', dashed: true, color: 'teal' },
            { from: 'svc', to: 'p2b', dashed: true, color: 'teal' },
          ],
          steps: [
            { on: ['dep', 'rs1', 'dep>rs1', 'rs1>p1a', 'rs1>p1b', 'rs1>p1c', 'p1a', 'p1b', 'p1c'], text: 'Steady state: the Deployment owns one ReplicaSet, which keeps <b>3 v1 Pods</b> running.' },
            { on: ['dep', 'rs2', 'dep>rs2'], text: 'You change the image. The Pod template hash changes, so the Deployment controller creates a <b>new ReplicaSet</b> with 0 replicas.' },
            { on: ['rs2', 'rs2>p2a', 'p2a'], text: '<code>maxSurge: 1</code> allows 4 Pods in total, so the new ReplicaSet is scaled to 1. <code>maxUnavailable: 0</code> means no old Pod may go away yet.' },
            { on: ['rs1', 'p1a', 'p2a', 'svc', 'svc>p1b'], text: 'When the v2 Pod passes its <b>readiness probe</b>, the old ReplicaSet is scaled to 2. The Service now spreads traffic over v1 and v2.' },
            { on: ['rs2', 'rs2>p2b', 'p2b', 'rs1', 'p1b', 'svc>p2b'], text: 'Repeat: new RS → 2, old RS → 1 …' },
            { on: ['rs2', 'rs2>p2c', 'p2c', 'rs1', 'p1c'], text: '… new RS → 3, old RS → 0. Capacity never dropped below 3 Ready Pods.' },
            { on: ['dep', 'rs1', 'dep>rs1'], text: 'The old ReplicaSet is <b>kept with 0 replicas</b>. <code>kubectl rollout undo</code> simply scales it back up: that is how rollbacks work.' },
          ],
        },
      ],
      tip: 'Hierarchy to memorise: <b>Deployment owns ReplicaSets, ReplicaSets own Pods</b>. Deleting a Pod of a Deployment just makes the ReplicaSet create another one.',
    },

    {
      kicker: 'Deployments',
      title: 'Update strategies and rollout commands',
      blocks: [
        { type: 'compare', headers: ['', 'RollingUpdate (default)', 'Recreate'], rows: [
          ['How', 'Replace Pods gradually', 'Delete <b>all</b> old Pods, then create new ones'],
          ['Downtime', 'None if readiness probes are correct', 'Yes, between old and new'],
          ['Two versions at once?', 'Yes, briefly', 'Never'],
          ['Tuning', '<code>maxSurge</code> (extra Pods, default 25%) and <code>maxUnavailable</code> (missing Pods, default 25%)', 'None'],
          ['Use when', 'Stateless apps, most cases', 'App cannot run two versions side by side (schema lock, single writer)'],
        ] },
        { type: 'code', lang: 'bash', title: 'kubectl rollout', code: `
kubectl set image deployment/web app=web:v2
kubectl rollout status deployment/web
kubectl rollout history deployment/web
kubectl rollout undo deployment/web
kubectl rollout undo deployment/web --to-revision=3
kubectl rollout pause deployment/web
kubectl rollout restart deployment/web
kubectl scale deployment/web --replicas=5`, notes: { 1: 'Changes the Pod template, so it triggers a new rollout (new ReplicaSet).', 2: 'Blocks until the rollout finishes or fails.', 3: 'Lists revisions. Each revision corresponds to a ReplicaSet kept around.', 4: 'Rolls back to the <b>previous</b> revision.', 5: 'Rolls back to a specific revision from the history.', 6: 'Pause to batch several template changes into one rollout; <code>rollout resume</code> continues.', 7: 'Recreates all Pods with the same spec (adds a timestamp annotation to the template). Useful to pick up a changed Secret.', 8: 'Scaling changes replicas only: <b>no</b> new ReplicaSet, no new revision.' } },
        { type: 'callout', kind: 'exam', title: 'Blue/green and canary?', html: 'They are <b>not</b> values of <code>strategy.type</code>. Deployments only support <code>RollingUpdate</code> and <code>Recreate</code>. Blue/green and canary are built with two Deployments plus Service/Ingress switching, or tools such as Argo Rollouts and Flagger.' },
      ],
      tip: 'Default Deployment strategy: <b>RollingUpdate with 25% maxSurge and 25% maxUnavailable</b>. Default <code>revisionHistoryLimit</code>: 10.',
    },

    {
      kicker: 'Stateful apps',
      title: 'StatefulSet: stable identity, ordered operations',
      blocks: [
        { type: 'cols', ratio: '1fr 1.1fr', cols: [
          [
            { type: 'cards', cols: 1, items: [
              { icon: 'tag', color: 'purple', title: 'Stable names', text: 'Pods are named <code>&lt;sts&gt;-0</code>, <code>-1</code>, <code>-2</code>. A replaced Pod gets the <b>same</b> name back.' },
              { icon: 'badge', color: 'blue', title: 'Stable DNS', text: 'Through a <b>headless Service</b> (<code>clusterIP: None</code>): <code>db-0.db.prod.svc.cluster.local</code> always points at Pod 0.' },
              { icon: 'hard-drive', color: 'green', title: 'Stable storage', text: '<code>volumeClaimTemplates</code> give each Pod its own PVC (<code>data-db-0</code>…) that is re-attached to the replacement Pod and kept by default when Pods are deleted.' },
              { icon: 'hash', color: 'amber', title: 'Ordered', text: 'Default <code>OrderedReady</code>: created 0 → N-1, each Ready before the next; scaled down and deleted in reverse order.' },
            ] },
          ],
          [
            { type: 'code', lang: 'yaml', title: 'statefulset.yaml', code: `
apiVersion: v1
kind: Service
metadata:
  name: db
spec:
  clusterIP: None
  selector:
    app: db
  ports:
  - port: 5432
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: db
spec:
  serviceName: db
  replicas: 3
  selector:
    matchLabels:
      app: db
  template:
    metadata:
      labels:
        app: db
    spec:
      containers:
      - name: postgres
        image: postgres:16
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: ['ReadWriteOnce']
      resources:
        requests:
          storage: 10Gi`, notes: { 6: '<code>clusterIP: None</code> makes it <b>headless</b>: DNS returns the individual Pod IPs instead of one virtual IP.', 17: '<code>serviceName</code> links the StatefulSet to the headless Service that governs Pod DNS names. You create that Service yourself.', 31: 'One PVC per Pod is created from this template. Deleting the StatefulSet does not delete these PVCs by default.' } },
          ],
        ] },
      ],
      tip: 'Keywords “stable network identity”, “ordered deployment”, “each replica needs its own persistent volume” (databases, Kafka, ZooKeeper, etcd) → <b>StatefulSet</b>.',
    },

    {
      kicker: 'More controllers',
      title: 'DaemonSet, Job and CronJob',
      blocks: [
        { type: 'tabs', tabs: [
          { label: 'DaemonSet', blocks: [
            { type: 'text', html: 'Runs <b>one Pod on every node</b> (or every node matching a nodeSelector/affinity). When a node joins, it gets the Pod automatically; when it leaves, the Pod is garbage collected. There is no <code>replicas</code> field.' },
            { type: 'bullets', items: [
              'Typical uses: log collectors (Fluent Bit), node monitoring (Prometheus node-exporter), CNI agents, kube-proxy, storage daemons.',
              'To run on control plane nodes the Pod template must <b>tolerate</b> their taint.',
              'Update strategies: <code>RollingUpdate</code> (default) or <code>OnDelete</code>.',
            ] },
          ] },
          { label: 'Job', blocks: [
            { type: 'code', lang: 'yaml', title: 'job.yaml', code: `
apiVersion: batch/v1
kind: Job
metadata:
  name: report
spec:
  completions: 5
  parallelism: 2
  backoffLimit: 4
  activeDeadlineSeconds: 600
  ttlSecondsAfterFinished: 3600
  template:
    spec:
      restartPolicy: OnFailure
      containers:
      - name: report
        image: shop/report:1.0`, notes: { 1: 'Jobs and CronJobs live in the <code>batch/v1</code> API group.', 6: 'The Job is done after 5 Pods complete successfully (default 1).', 7: 'At most 2 Pods run at the same time (default 1).', 8: 'Retries before the Job is marked Failed (default 6).', 9: 'Hard time limit for the whole Job.', 10: 'Delete the finished Job and its Pods automatically after one hour.', 13: 'Must be <code>OnFailure</code> or <code>Never</code>; <code>Always</code> is not allowed for Jobs.' } },
          ] },
          { label: 'CronJob', blocks: [
            { type: 'code', lang: 'yaml', title: 'cronjob.yaml', code: `
apiVersion: batch/v1
kind: CronJob
metadata:
  name: nightly-backup
spec:
  schedule: '0 2 * * *'
  timeZone: 'Europe/Berlin'
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 1
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: Never
          containers:
          - name: backup
            image: shop/backup:1.0`, notes: { 6: 'Standard 5-field cron syntax: minute hour day-of-month month day-of-week. Here: every day at 02:00.', 8: '<code>Allow</code> (default) lets runs overlap, <code>Forbid</code> skips a run while the previous one is active, <code>Replace</code> cancels the old run.', 11: 'A CronJob creates <b>Jobs</b>, which create Pods: CronJob → Job → Pod.' } },
          ] },
        ] },
      ],
      tip: 'Exam cue: “run to completion” → Job; “on a schedule” → CronJob; “on every node” → DaemonSet. Deployments are for processes that should run forever.',
    },

    {
      kicker: 'Decision table',
      title: 'Which workload object?',
      blocks: [
        { type: 'compare', headers: ['Object', 'Use it for', 'Pod identity', 'Scaling', 'Ends?'], rows: [
          ['Deployment', 'Stateless, long-running apps (web, APIs)', 'Random suffix, interchangeable', '<code>replicas</code>, HPA', 'No'],
          ['ReplicaSet', 'Keeping N identical Pods (managed by a Deployment)', 'Random suffix', '<code>replicas</code>', 'No'],
          ['StatefulSet', 'Databases, queues, clustered apps', 'Ordinal <code>-0, -1</code>, stable DNS + PVC', '<code>replicas</code>, ordered', 'No'],
          ['DaemonSet', 'One agent per node', 'One per node', 'Follows node count', 'No'],
          ['Job', 'Batch task that must finish', 'Random suffix', '<code>completions</code> / <code>parallelism</code>', 'Yes'],
          ['CronJob', 'Recurring batch task', 'One Job per run', 'One Job per schedule tick', 'Each run ends'],
          ['Bare Pod', 'Quick tests, debugging', 'Name you choose', 'None, not self-healing', 'Depends'],
        ] },
        { type: 'match', title: 'Match the scenario to the object', pairs: [
          ['Fluent Bit on every node', 'DaemonSet'],
          ['Stateless REST API with zero-downtime updates', 'Deployment'],
          ['3-node PostgreSQL cluster, each with its own disk', 'StatefulSet'],
          ['Database migration that runs once', 'Job'],
          ['Report generated every Monday 06:00', 'CronJob'],
        ] },
      ],
      tip: 'ReplicationController is the legacy predecessor of ReplicaSet. If an option mentions it, it is almost never the best answer today.',
    },

    {
      kicker: 'Configuration',
      title: 'ConfigMaps and Secrets: env vars or volumes',
      blocks: [
        { type: 'cols', ratio: '1.15fr 1fr', cols: [
          [
            { type: 'code', lang: 'yaml', title: 'consuming config', code: `
spec:
  containers:
  - name: app
    image: shop/api:2.1
    env:
    - name: LOG_LEVEL
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: log_level
    - name: DB_PASSWORD
      valueFrom:
        secretKeyRef:
          name: db-creds
          key: password
    envFrom:
    - configMapRef:
        name: app-config
    volumeMounts:
    - name: config
      mountPath: /etc/app
      readOnly: true
  volumes:
  - name: config
    configMap:
      name: app-config`, notes: { 5: 'Single keys injected as environment variables.', 8: 'Reference one key of a ConfigMap.', 13: 'Same idea for a Secret: <code>secretKeyRef</code>.', 16: '<code>envFrom</code> imports <b>every</b> key of the ConfigMap as a variable.', 19: 'Mount the ConfigMap as files: one file per key in <code>/etc/app</code>.', 23: 'Secrets can be mounted the same way with a <code>secret:</code> volume; they are stored in tmpfs (memory) on the node.' } },
          ],
          [
            { type: 'compare', headers: ['', 'Env var', 'Volume'], rows: [
              ['Picks up changes?', 'No, only at container start', 'Yes, eventually (kubelet sync), except <code>subPath</code> mounts'],
              ['Good for', 'Small flags, settings', 'Whole config files, certificates'],
            ] },
            { type: 'compare', headers: ['', 'ConfigMap', 'Secret'], rows: [
              ['Data', 'Plain text', 'base64-encoded'],
              ['Encrypted at rest?', 'No', 'Only if encryption at rest is configured'],
              ['Size limit', '1 MiB', '1 MiB'],
            ] },
          ],
        ] },
        { type: 'callout', kind: 'trap', title: 'base64 is not encryption', html: 'Anyone who can read the Secret object can decode it. Protect Secrets with <b>RBAC</b>, <b>encryption at rest</b> (EncryptionConfiguration or a KMS provider) and, often, an external secret store. Both ConfigMaps and Secrets can be marked <code>immutable: true</code>.' },
      ],
      tip: 'Changed a ConfigMap but the app still shows old values from an env var? Env vars are fixed at container start: restart the Pods, e.g. with <code>kubectl rollout restart</code>.',
    },

    {
      kicker: 'Health',
      title: 'Liveness, readiness and startup probes',
      blocks: [
        { type: 'flip', items: [
          { front: 'Liveness probe', back: '“Is the process stuck?” On failure the kubelet <b>restarts the container</b>. Catches deadlocks that do not crash the process.' },
          { front: 'Readiness probe', back: '“Can it serve traffic now?” On failure the Pod is <b>removed from Service endpoints</b>. The container is <b>not</b> restarted. Gates rolling updates.' },
          { front: 'Startup probe', back: '“Has it finished booting?” Liveness and readiness checks are <b>held off</b> until it succeeds. Protects slow-starting apps from being killed by liveness.' },
        ] },
        { type: 'cols', cols: [
          [
            { type: 'code', lang: 'yaml', title: 'probes', code: `
startupProbe:
  httpGet: { path: /healthz, port: 8080 }
  failureThreshold: 30
  periodSeconds: 10
livenessProbe:
  httpGet: { path: /healthz, port: 8080 }
  periodSeconds: 10
readinessProbe:
  tcpSocket: { port: 8080 }
  initialDelaySeconds: 5`, notes: { 3: '30 × 10 s: the app gets up to 5 minutes to start before it is killed.', 6: 'Probe mechanisms: <code>httpGet</code> (2xx/3xx = success), <code>tcpSocket</code>, <code>exec</code> (exit 0), <code>grpc</code>.', 9: 'A plain TCP connect check: is the port open?' } },
          ],
          [
            { type: 'compare', headers: ['Probe fails', 'Result'], rows: [
              ['Liveness', 'Container killed and restarted'],
              ['Readiness', 'No traffic; Pod shows <code>0/1 READY</code>'],
              ['Startup', 'Container restarted after failureThreshold'],
            ] },
            { type: 'callout', kind: 'tip', html: 'Probes are executed by the <b>kubelet</b> on the node, not by the control plane.' },
          ],
        ] },
      ],
      tip: 'The most tested distinction: <b>liveness → restart</b>, <b>readiness → remove from load balancing</b>. A Pod can be Running but not Ready.',
    },

    {
      kicker: 'Resources',
      title: 'Requests, limits and QoS classes',
      blocks: [
        { type: 'cols', ratio: '1fr 1.2fr', cols: [
          [
            { type: 'bullets', items: [
              '<b>requests</b>: what the scheduler reserves. A Pod only lands on a node with enough unreserved allocatable capacity.',
              '<b>limits</b>: the hard ceiling enforced at runtime through cgroups.',
              'Over the <b>CPU</b> limit → <b>throttled</b> (slowed down).',
              'Over the <b>memory</b> limit → <b>OOMKilled</b>, then restarted per restartPolicy.',
              'Units: CPU in cores or millicores (<code>500m</code> = half a core); memory in bytes (<code>256Mi</code>, <code>1Gi</code>).',
            ] },
          ],
          [
            { type: 'compare', headers: ['QoS class', 'Condition', 'Evicted under node pressure'], rows: [
              ['<b>Guaranteed</b>', 'Every container sets CPU <i>and</i> memory requests <b>equal to</b> limits', 'Last'],
              ['<b>Burstable</b>', 'At least one container sets a request or limit, but not Guaranteed', 'In between'],
              ['<b>BestEffort</b>', 'No container sets any request or limit', 'First'],
            ] },
          ],
        ] },
        { type: 'check', q: 'A Pod has one container with <code>requests: {cpu: 250m, memory: 128Mi}</code> and <code>limits: {cpu: 500m, memory: 256Mi}</code>. What is its QoS class?', options: ['Guaranteed', 'BestEffort', 'Burstable', 'Restricted'], answer: 2, explain: 'Requests are set but differ from the limits, so it is <b>Burstable</b>. Guaranteed requires requests == limits for both CPU and memory in every container; BestEffort means nothing is set. “Restricted” is a Pod Security Standards level, not a QoS class.', ref: 'https://kubernetes.io/docs/concepts/workloads/pods/pod-qos/' },
      ],
      tip: 'If you set only limits, Kubernetes copies them into requests, so a container with only CPU and memory limits ends up <b>Guaranteed</b>. QoS is computed automatically and shown in <code>status.qosClass</code>.',
    },
  ],

  summary: [
    'A <b>Pod</b> is the smallest deployable unit: containers in it share one IP (<code>localhost</code>), volumes and node.',
    '<b>Init containers</b> run to completion first; an init container with <code>restartPolicy: Always</code> is a <b>native sidecar</b> (GA in 1.33).',
    'Pod phases: <b>Pending, Running, Succeeded, Failed, Unknown</b>. CrashLoopBackOff is a container state reason, not a phase.',
    '<b>Deployment → ReplicaSet → Pods</b>. Changing the Pod template creates a new ReplicaSet; old ones are kept for <code>kubectl rollout undo</code>.',
    'Pick the controller by need: Deployment (stateless), StatefulSet (stable identity + per-Pod storage), DaemonSet (one per node), Job (run to completion), CronJob (scheduled).',
    'ConfigMaps/Secrets as <b>env vars</b> are fixed at start; as <b>volumes</b> they update. Secrets are base64-encoded, not encrypted by default.',
    '<b>Liveness</b> failure restarts, <b>readiness</b> failure removes from endpoints, <b>startup</b> delays the others. QoS: Guaranteed, Burstable, BestEffort.',
  ],

  glossary: [
    { term: 'Pod', def: 'One or more containers scheduled together on one node, sharing a network namespace (one IP) and volumes.' },
    { term: 'Init container', def: 'A container that runs to completion before the app containers start; init containers run one at a time in order.' },
    { term: 'Native sidecar', def: 'An init container with restartPolicy: Always; it starts before and keeps running alongside the main containers.' },
    { term: 'restartPolicy', def: 'Pod-level setting (Always, OnFailure, Never) that tells the kubelet when to restart exited containers.' },
    { term: 'Label selector', def: 'A query on labels (equality- or set-based) used by controllers, Services and kubectl -l to pick objects.' },
    { term: 'ReplicaSet', def: 'Controller that keeps a specified number of identical Pods running; normally managed by a Deployment.' },
    { term: 'Deployment', def: 'Manages ReplicaSets to provide declarative updates, rolling updates and rollbacks for stateless Pods.' },
    { term: 'maxSurge / maxUnavailable', def: 'RollingUpdate parameters: how many extra Pods may be created, and how many may be unavailable, during an update (default 25% each).' },
    { term: 'StatefulSet', def: 'Workload controller giving each Pod a stable ordinal name, stable DNS via a headless Service and its own PVC.' },
    { term: 'Headless Service', def: 'A Service with clusterIP: None; DNS returns individual Pod IPs instead of a virtual IP.' },
    { term: 'DaemonSet', def: 'Ensures a copy of a Pod runs on all (or selected) nodes, adding Pods as nodes join.' },
    { term: 'Job', def: 'Runs Pods until a specified number complete successfully; retries failures up to backoffLimit.' },
    { term: 'CronJob', def: 'Creates Jobs on a repeating schedule written in cron syntax.' },
    { term: 'ConfigMap', def: 'Object holding non-confidential key/value configuration, consumed as env vars, command args or files.' },
    { term: 'Secret', def: 'Object holding sensitive data, base64-encoded; mounted via tmpfs or injected as env vars.' },
    { term: 'QoS class', def: 'Guaranteed, Burstable or BestEffort; derived from requests/limits and used to rank Pods for eviction.' },
  ],

  quiz: [
    { q: 'Two containers in the same Pod need to exchange data over the network. Which address should one container use to reach the other?', options: ['The other container’s own IP address', 'The node’s IP address and a NodePort', '<code>localhost</code> plus the other container’s port', 'The ClusterIP of a Service created for each container'], answer: 2, explain: 'Containers in a Pod share one network namespace, so they communicate over <b>localhost</b>. Containers do not get individual IPs (the Pod does), and NodePorts or Services are for traffic coming from outside the Pod.', ref: 'https://kubernetes.io/docs/concepts/workloads/pods/' },
    { q: 'Which Pod spec feature should you use to run a database schema migration that must finish before the application container starts?', options: ['A readiness probe', 'An init container', 'A DaemonSet', 'A postStart lifecycle hook'], answer: 1, explain: 'Init containers run to completion, in order, before any app container starts. A readiness probe only controls traffic; a DaemonSet is a node-level controller; postStart runs <i>after</i> the container has started, in parallel with it.', ref: 'https://kubernetes.io/docs/concepts/workloads/pods/init-containers/' },
    { q: 'How is a native sidecar container declared in Kubernetes 1.33?', options: ['As an entry in <code>containers</code> with the annotation <code>sidecar=true</code>', 'As an entry in <code>initContainers</code> with <code>restartPolicy: Always</code>', 'As a separate Pod with <code>podAffinity</code> to the app Pod', 'As an <code>ephemeralContainers</code> entry'], answer: 1, explain: 'Native sidecars are init containers with <code>restartPolicy: Always</code>: they start before the app and keep running. No annotation exists for this; a separate Pod would not share localhost; ephemeral containers are for interactive debugging.', ref: 'https://kubernetes.io/docs/concepts/workloads/pods/sidecar-containers/' },
    { q: 'A Pod shows <code>STATUS: CrashLoopBackOff</code>. Which statement is correct?', options: ['CrashLoopBackOff is the fifth Pod phase', 'The scheduler cannot find a node for the Pod', 'A container keeps exiting and the kubelet is waiting with an increasing delay before restarting it', 'The image could not be pulled from the registry'], answer: 2, explain: 'CrashLoopBackOff is a container waiting reason: the container keeps crashing and the kubelet backs off between restarts. The Pod phases are Pending, Running, Succeeded, Failed and Unknown. Scheduling problems leave the Pod Pending; pull problems show ErrImagePull / ImagePullBackOff.', ref: 'https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/' },
    { q: 'Which TWO restartPolicy values are valid for the Pod template of a Job? (Select 2)', options: ['Always', 'OnFailure', 'Never', 'OnSuccess'], answer: [1, 2], explain: 'Jobs need Pods that eventually stop, so only <b>OnFailure</b> and <b>Never</b> are allowed. <b>Always</b> is the default for Pods and required by Deployments, StatefulSets and DaemonSets. OnSuccess does not exist.', ref: 'https://kubernetes.io/docs/concepts/workloads/controllers/job/' },
    { q: 'A Deployment has <code>replicas: 4</code>, <code>maxSurge: 1</code> and <code>maxUnavailable: 0</code>. During a rolling update, what is the maximum number of Pods that can exist at once?', options: ['3', '4', '8', '5'], answer: 3, explain: 'maxSurge allows one Pod above the desired count, so up to <b>5</b> Pods exist. maxUnavailable: 0 means the number of available Pods never drops below 4. 8 would be the case with a Recreate-like double deployment, which does not happen.', ref: 'https://kubernetes.io/docs/concepts/workloads/controllers/deployment/' },
    { q: 'What does <code>kubectl rollout undo deployment/web</code> do?', options: ['Deletes the Deployment and all its Pods', 'Scales the previous ReplicaSet back up and the current one down, returning to the previous Pod template', 'Restarts all Pods with the current Pod template', 'Reverts the last change to the replicas field'], answer: 1, explain: 'Old ReplicaSets are kept (scaled to 0) as revision history. Undo rolls back to the previous revision by scaling that ReplicaSet up again. Restarting with the same template is <code>rollout restart</code>; replica changes are not revisions at all.', ref: 'https://kubernetes.io/docs/concepts/workloads/controllers/deployment/' },
    { q: 'Your application cannot tolerate two versions running at the same time. Which Deployment strategy should you configure?', options: ['RollingUpdate with maxSurge 25%', 'Canary', 'Recreate', 'BlueGreen'], answer: 2, explain: '<b>Recreate</b> terminates all old Pods before creating new ones, so versions never overlap (at the cost of downtime). Canary and BlueGreen are not valid <code>strategy.type</code> values; RollingUpdate runs both versions briefly.', ref: 'https://kubernetes.io/docs/concepts/workloads/controllers/deployment/' },
    { q: 'Which object should you use to run a ZooKeeper ensemble where each member needs a stable hostname and its own persistent volume?', options: ['Deployment', 'DaemonSet', 'ReplicaSet', 'StatefulSet'], answer: 3, explain: 'A <b>StatefulSet</b> provides stable ordinal names, stable DNS through a headless Service and per-Pod PVCs from volumeClaimTemplates. Deployments and ReplicaSets treat Pods as interchangeable, and a DaemonSet ties Pods to nodes rather than to identities.', ref: 'https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/' },
    { q: 'A ConfigMap value is injected into a container as an environment variable. You edit the ConfigMap. What happens in the running container?', options: ['The variable updates within about a minute', 'Nothing; the variable keeps its old value until the container is restarted', 'The Pod is automatically restarted by the ConfigMap controller', 'The kubelet rejects the change until the Pod is deleted'], answer: 1, explain: 'Environment variables are resolved only when the container starts. ConfigMaps mounted as <b>volumes</b> are refreshed by the kubelet, but env vars are not, and no controller restarts Pods for you; use <code>kubectl rollout restart</code>.', ref: 'https://kubernetes.io/docs/concepts/configuration/configmap/' },
    { q: 'Which TWO statements about probes are true? (Select 2)', options: ['A failing readiness probe removes the Pod from Service endpoints without restarting it', 'A failing liveness probe causes the scheduler to move the Pod to another node', 'A startup probe delays liveness and readiness checks until the application has started', 'Probes are executed by kube-proxy on each node'], answer: [0, 2], explain: 'Readiness controls traffic and startup holds back the other probes. A failed liveness probe makes the <b>kubelet</b> restart the container on the same node; nothing is rescheduled. Probes are run by the kubelet, not kube-proxy.', ref: 'https://kubernetes.io/docs/concepts/workloads/pods/probes/' },
    { q: 'A Pod has two containers. Neither container sets any CPU or memory requests or limits. Which QoS class is assigned, and how is it treated under memory pressure?', options: ['BestEffort; it is among the first to be evicted', 'Burstable; it is evicted last', 'Guaranteed; it is never evicted', 'BestEffort; it is never evicted because it reserves nothing'], answer: 0, explain: 'No requests or limits anywhere means <b>BestEffort</b>, and such Pods are the first candidates for eviction when a node runs low on memory. Guaranteed Pods are evicted last, not never; Burstable requires at least one request or limit.', ref: 'https://kubernetes.io/docs/concepts/workloads/pods/pod-qos/' },
  ],
});
