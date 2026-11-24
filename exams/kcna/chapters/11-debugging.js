KS.registerChapter('kcna', {
  id: 'debugging',
  title: 'Debugging Applications',
  subtitle: 'Logs, exec, port-forward, ephemeral debug containers and rollout forensics',
  icon: '🐞',
  minutes: 30,
  objectives: [
    'Pick the right kubectl command for a symptom: logs, describe, events, exec, port-forward or debug',
    'Explain ephemeral containers, why distroless images need them, and the three modes of <code>kubectl debug</code>',
    'Diagnose configuration errors, failing probes and broken Services from inside the cluster',
    'Inspect, pause and undo Deployment rollouts and validate changes before applying them',
  ],

  slides: [
    {
      kicker: 'Method',
      title: 'A repeatable debugging workflow',
      blocks: [
        { type: 'text', html: 'Application debugging on Kubernetes follows the same path every time: look at the <b>status</b>, read the <b>events</b>, read the <b>logs</b>, then go <b>inside</b> if you still need to. Each step uses a different kubectl command.' },
        { type: 'flow', items: [
          { icon: '📋', label: 'get', sub: 'status & restarts', info: '<code>kubectl get pods -o wide</code> shows STATUS (Pending, CrashLoopBackOff, CreateContainerConfigError…), READY, RESTARTS and the node.' },
          { icon: '🔍', label: 'describe', sub: 'events & conditions', info: '<code>kubectl describe pod web</code> shows container states, last termination reason (OOMKilled, Error), probe config, mounts and the recent <b>events</b> at the bottom.' },
          { icon: '📜', label: 'logs', sub: 'what the app said', info: '<code>kubectl logs web</code> prints the container’s stdout/stderr. Add <code>--previous</code> for the crashed instance.' },
          { icon: '🐚', label: 'exec / debug', sub: 'look inside', info: '<code>kubectl exec</code> if the image has a shell; <code>kubectl debug</code> with an ephemeral container if it does not.' },
          { icon: '🔌', label: 'port-forward', sub: 'test directly', info: '<code>kubectl port-forward</code> lets you hit the app from your laptop, bypassing Services and Ingress.' },
          { icon: '🛠️', label: 'fix & verify', sub: 'rollout status', info: 'Change the manifest (ideally in Git), apply, and watch <code>kubectl rollout status</code>.' },
        ], caption: 'Click Step ▶ or any box.' },
        { type: 'callout', kind: 'tip', title: 'Events expire', html: 'Events are ordinary API objects kept only for a short time (one hour by default). Debug soon, or list them sorted: <code>kubectl get events --sort-by=.metadata.creationTimestamp</code>.' },
      ],
      tip: 'Status and events come from <b>Kubernetes</b> (describe); application errors come from the <b>app</b> (logs). Many exam distractors swap the two.',
    },

    {
      kicker: 'Logs',
      title: 'kubectl logs, flag by flag',
      blocks: [
        { type: 'code', lang: 'bash', title: 'reading container logs', code: `
kubectl logs web-7d9f
kubectl logs -f web-7d9f
kubectl logs web-7d9f -c sidecar
kubectl logs web-7d9f --previous
kubectl logs -l app=web --all-containers
kubectl logs web-7d9f --since=15m --timestamps
kubectl logs web-7d9f --tail=50
kubectl logs deploy/web`, notes: { 1: 'Prints stdout/stderr of the Pod’s only container. Kubernetes captures what the app writes to <b>stdout and stderr</b>, not files inside the container.', 2: '<b>-f</b> (follow) streams new lines, like <code>tail -f</code>.', 3: '<b>-c</b> picks a container. Required when the Pod has more than one, otherwise kubectl asks you to choose (or uses the default-container annotation).', 4: '<b>--previous</b> (<code>-p</code>) shows the logs of the <b>last terminated</b> instance. Essential for CrashLoopBackOff: the current container may have no output yet.', 5: '<b>-l</b> selects Pods by label; with a selector kubectl shows only the last 10 lines per Pod unless you set <code>--tail</code>.', 6: '<b>--since</b> limits by age (also <code>--since-time</code>); <code>--timestamps</code> prefixes each line.', 7: '<b>--tail</b> prints only the last N lines.', 8: 'Using a workload reference picks <b>one</b> of its Pods, not all of them.' } },
        { type: 'callout', kind: 'trap', title: 'Where did my logs go?', html: 'If the app writes only to <code>/var/log/app.log</code> inside the container, <code>kubectl logs</code> shows nothing. Write to stdout/stderr, or add a sidecar that tails the file. Logs also disappear with the Pod, which is why clusters ship them to a central backend (Fluent Bit → Loki/Elasticsearch).' },
      ],
      tip: '“The container keeps restarting; how do you see why the <i>last</i> one died?” → <code>kubectl logs &lt;pod&gt; --previous</code>.',
    },

    {
      kicker: 'Kubernetes’ side of the story',
      title: 'describe and events',
      blocks: [
        { type: 'cols', ratio: '1fr 1.1fr', cols: [
          [
            { type: 'code', lang: 'bash', code: `
kubectl describe pod web-7d9f
kubectl get events -n shop --sort-by=.metadata.creationTimestamp
kubectl events --for pod/web-7d9f
kubectl get events --field-selector type=Warning`, notes: { 1: 'Human-readable summary: containers, state, <b>Last State</b> with exit code and reason, probes, volumes, conditions and the Pod’s events.', 2: 'All events in a namespace, oldest first. Good for seeing the sequence of what happened.', 3: 'The <code>kubectl events</code> subcommand filters events for one object.', 4: 'Only warnings: failed mounts, failed scheduling, probe failures, back-offs.' } },
          ],
          [
            { type: 'compare', headers: ['Event reason', 'What it tells you'], rows: [
              ['<code>FailedScheduling</code>', 'No node fits: resources, taints, affinity, unbound PVC'],
              ['<code>Failed</code> + <code>ErrImagePull</code>', 'Bad image name/tag or missing registry credentials'],
              ['<code>BackOff</code>', 'Container keeps exiting; kubelet waits longer between restarts'],
              ['<code>Unhealthy</code>', 'A liveness, readiness or startup probe failed'],
              ['<code>FailedMount</code>', 'Volume, ConfigMap or Secret could not be mounted'],
              ['<code>Killing</code>', 'Container stopped, e.g. after a failed liveness probe'],
            ] },
          ],
        ] },
      ],
      tip: 'Exit code <b>137</b> with reason <b>OOMKilled</b> in “Last State” means the container exceeded its memory limit. Exit code <b>1</b> usually means the app itself failed: read the logs.',
    },

    {
      kicker: 'Configuration',
      title: 'Config errors: CreateContainerConfigError',
      blocks: [
        { type: 'cols', ratio: '1.1fr 1fr', cols: [
          [
            { type: 'code', lang: 'yaml', title: 'env from a ConfigMap key', code: `
containers:
- name: app
  image: ghcr.io/acme/app:2.0.1
  env:
  - name: LOG_LEVEL
    valueFrom:
      configMapKeyRef:
        name: app-config
        key: log_level
  volumeMounts:
  - name: cfg
    mountPath: /etc/app
volumes:
- name: cfg
  configMap:
    name: app-files`, notes: { 5: 'An environment variable built from a ConfigMap key.', 8: 'If ConfigMap <code>app-config</code> does not exist, or has no key <code>log_level</code>, the container is never created: status <b>CreateContainerConfigError</b>. The same happens for a missing Secret or Secret key.', 9: 'Add <code>optional: true</code> under configMapKeyRef if the key may legitimately be absent.', 14: 'A ConfigMap mounted as files. If <code>app-files</code> is missing, the Pod stays in <b>ContainerCreating</b> with a <code>FailedMount</code> event instead.' } },
          ],
          [
            { type: 'code', lang: 'bash', title: 'inspect what the app really sees', code: `
kubectl exec web-7d9f -- env | grep LOG
kubectl exec web-7d9f -- ls -l /etc/app
kubectl exec web-7d9f -- cat /etc/app/app.yaml
kubectl get cm app-config -o yaml`, notes: { 1: 'Prints the environment of the running container: did the variable arrive with the expected value?', 2: 'Lists the mounted files. Each ConfigMap key becomes one file.', 4: 'Compare the source object with what the container sees; check key names for typos.' } },
            { type: 'callout', kind: 'trap', title: 'Updates are not equal', html: 'Changing a ConfigMap does <b>not</b> update environment variables in running containers; restart the Pods (<code>kubectl rollout restart</code>). Mounted files are refreshed eventually, except when mounted with <code>subPath</code>.' },
          ],
        ] },
      ],
      tip: '“Pod status <b>CreateContainerConfigError</b>” → a referenced ConfigMap/Secret or one of its keys is missing. Check with <code>kubectl describe pod</code>.',
    },

    {
      kicker: 'Health checks',
      title: 'Debugging failing probes',
      blocks: [
        { type: 'compare', headers: ['Probe', 'When it fails…', 'What you see'], rows: [
          ['Liveness', 'kubelet <b>restarts</b> the container', 'RESTARTS grows, <code>Unhealthy</code> + <code>Killing</code> events, maybe CrashLoopBackOff'],
          ['Readiness', 'Pod is marked <b>not Ready</b> and removed from Service endpoints; no restart', 'READY <code>0/1</code>, Service returns errors or no backends'],
          ['Startup', 'Liveness and readiness are held off until it succeeds; if it never does, the container is killed', 'Slow-starting app restarts before it finishes booting'],
        ] },
        { type: 'cols', cols: [
          [
            { type: 'bullets', items: [
              'Read the event message: <i>“Liveness probe failed: HTTP probe failed with statuscode: 500”</i> or <i>“connection refused”</i>.',
              'Check port and path: probe port must match the port the app listens on.',
              'Check timing: <code>initialDelaySeconds</code>, <code>periodSeconds</code>, <code>timeoutSeconds</code>, <code>failureThreshold</code>.',
              'Reproduce: <code>kubectl port-forward</code> and curl the probe path yourself.',
            ] },
          ],
          [
            { type: 'callout', kind: 'warn', title: 'Classic misconfiguration', html: 'A liveness probe that checks a <b>database dependency</b> restarts every replica when the database blips, turning a small outage into a big one. Liveness should check only the process itself; use readiness for dependencies.' },
          ],
        ] },
      ],
      tip: '“Pod is Running but receives no traffic and never restarts” → <b>readiness</b> probe failing. “Pod restarts every 30 seconds while starting” → liveness too aggressive; add a <b>startup</b> probe.',
    },

    {
      kicker: 'Getting inside',
      title: 'kubectl exec and kubectl port-forward',
      blocks: [
        { type: 'code', lang: 'bash', code: `
kubectl exec -it web-7d9f -- sh
kubectl exec -it web-7d9f -c app -- /bin/bash
kubectl exec web-7d9f -- cat /etc/resolv.conf
kubectl port-forward pod/web-7d9f 8080:80
kubectl port-forward svc/web 8080:80
kubectl port-forward deploy/web 9090`, notes: { 1: '<b>-i</b> keeps stdin open, <b>-t</b> allocates a terminal: together you get an interactive shell. Everything after <code>--</code> is the command to run.', 2: '<b>-c</b> chooses the container in a multi-container Pod.', 3: 'Non-interactive: run one command and print its output.', 4: 'Opens <code>localhost:8080</code> on your machine and tunnels it through the API server and kubelet to port 80 of the Pod. No Service or Ingress needed.', 5: 'Through a Service name kubectl still picks <b>one Pod</b> behind it; there is no load balancing.', 6: 'Same local and remote port when only one number is given.' } },
        { type: 'cards', cols: 2, items: [
          { icon: '🐚', color: 'blue', title: 'exec needs a shell', text: '<code>exec</code> runs a process <b>inside the existing container</b>, so the binary must exist in the image. In a distroless or scratch image, <code>sh</code> is not there and exec fails.' },
          { icon: '🔌', color: 'teal', title: 'port-forward is for humans', text: 'A temporary tunnel for testing from your workstation. It stops when the command ends and is no way to expose an app to users.' },
        ] },
      ],
      tip: '“Test an app’s web UI from your laptop without creating a Service” → <code>kubectl port-forward</code>. “Run a command inside a running container” → <code>kubectl exec</code>.',
    },

    {
      kicker: 'Why ephemeral containers exist',
      title: 'Distroless images and the missing shell',
      blocks: [
        { type: 'text', html: '<b>Distroless</b> (and <code>scratch</code>-based) images contain only the application and its runtime dependencies: no shell, no package manager, no <code>curl</code>. That shrinks the attack surface and image size, but <code>kubectl exec -- sh</code> fails with <i>executable file not found</i>.' },
        { type: 'flip', items: [
          { front: '🧊 Ephemeral container', back: 'A temporary container added to an <b>already running Pod</b> for troubleshooting. Added through the Pod’s <code>ephemeralcontainers</code> subresource. Stable since Kubernetes 1.25.' },
          { front: '🚫 What it cannot have', back: 'No ports, no liveness/readiness/startup probes, no resource guarantees. It is never restarted, and once added it <b>cannot be removed</b>; it goes away with the Pod.' },
          { front: '🎯 --target', back: 'Shares the <b>process namespace</b> of a chosen container, so <code>ps</code> shows the app’s processes and <code>/proc/&lt;pid&gt;/root</code> reaches its filesystem.' },
          { front: '♻️ No restart', back: 'Adding an ephemeral container does <b>not</b> restart the Pod or the app. You debug the exact process that is misbehaving.' },
        ] },
        { type: 'callout', kind: 'exam', title: 'Why not just edit the Pod?', html: 'A Pod’s container list is immutable after creation. Ephemeral containers are the one supported way to add a container to a running Pod, and you add them with <code>kubectl debug</code>, not <code>kubectl edit</code>.' },
      ],
      tip: '“The image has no shell and you must inspect the running process without restarting it” → <b>ephemeral container</b> via <code>kubectl debug</code>.',
    },

    {
      kicker: 'Ephemeral containers · interactive',
      title: 'How a debug container joins a running Pod',
      blocks: [
        { type: 'diagram', width: 900, height: 420,
          caption: 'Press ▶ Play to follow <code>kubectl debug -it web-7d9f --image=busybox:1.36 --target=app</code>.',
          groups: [
            { x: 440, y: 125, w: 440, h: 280, label: 'Worker node', color: 'green' },
            { x: 465, y: 235, w: 395, h: 155, label: 'Pod web-7d9f (Running)', color: 'blue' },
          ],
          nodes: [
            { id: 'user', x: 20, y: 50, w: 180, h: 60, label: 'kubectl debug', icon: '💻', sub: '--target=app', color: 'gray', info: 'Builds an ephemeral container spec (image, name, target) and sends it to the API server. With <code>-it</code> it then attaches your terminal to it.' },
            { id: 'api', x: 250, y: 50, w: 170, h: 60, label: 'kube-apiserver', color: 'blue', info: 'Receives an update to the Pod’s <code>ephemeralcontainers</code> subresource. Normal Pod updates could not add a container; this subresource can. RBAC must allow it.' },
            { id: 'spec', x: 250, y: 170, w: 170, h: 60, label: 'Pod spec', sub: 'ephemeralContainers[]', color: 'amber', info: 'The new entry is appended to <code>spec.ephemeralContainers</code>. The regular <code>containers</code> list is untouched and nothing is restarted.' },
            { id: 'kubelet', x: 465, y: 160, w: 150, h: 52, label: 'kubelet', icon: '🤖', color: 'green', info: 'Watches its Pods, notices the new ephemeral container and asks the runtime to start it inside the existing Pod sandbox.' },
            { id: 'rt', x: 680, y: 160, w: 170, h: 52, label: 'containerd', sub: 'CRI runtime', color: 'pink', info: 'Pulls <code>busybox:1.36</code> and starts it in the same network namespace as the Pod, plus the target’s process namespace.' },
            { id: 'app', x: 485, y: 285, w: 165, h: 76, label: 'app container', sub: 'distroless, no shell', color: 'blue', info: 'The misbehaving application. It keeps running throughout; you inspect it live.' },
            { id: 'dbg', x: 680, y: 285, w: 165, h: 76, label: 'debugger', icon: '🧰', sub: 'ephemeral · busybox', color: 'purple', info: 'Has a shell and tools. Shares the Pod’s network (same IP, <code>localhost</code> reaches the app) and, with <code>--target</code>, the app’s processes.' },
          ],
          edges: [
            { from: 'user', to: 'api', label: 'update subresource', color: 'gray' },
            { from: 'api', to: 'spec', label: 'append', color: 'amber' },
            { from: 'kubelet', to: 'api', label: 'watch', dashed: true, color: 'green' },
            { from: 'kubelet', to: 'rt', label: 'CRI', color: 'pink' },
            { from: 'rt', to: 'dbg', label: 'start', color: 'pink' },
            { from: 'dbg', to: 'app', label: 'shared PID + net', dashed: true, both: true, color: 'purple' },
          ],
          steps: [
            { on: ['app'], text: 'The <b>app container</b> is misbehaving, but its distroless image has no shell, so <code>kubectl exec -- sh</code> fails.' },
            { on: ['user', 'api', 'user>api'], text: '<code>kubectl debug</code> sends an update to the Pod’s <b>ephemeralcontainers subresource</b> describing a busybox container that targets <code>app</code>.' },
            { on: ['api', 'spec', 'api>spec'], text: 'The API server appends it to <code>spec.ephemeralContainers</code>. The Pod is <b>not</b> recreated and the app is not restarted.' },
            { on: ['kubelet', 'api', 'kubelet>api'], text: 'The <b>kubelet</b> on the Pod’s node sees the change through its watch.' },
            { on: ['kubelet', 'rt', 'kubelet>rt', 'rt>dbg', 'dbg'], text: 'The kubelet asks the <b>runtime</b> to pull the image and start the debugger inside the existing Pod sandbox.' },
            { on: ['dbg', 'app', 'dbg>app'], text: 'Your terminal attaches. The debugger shares the Pod IP and, thanks to <code>--target</code>, the app’s <b>process namespace</b>: run <code>ps</code>, <code>wget localhost:8080</code>, or browse <code>/proc/1/root</code>.' },
          ],
        },
      ],
      tip: 'The debug container lives until the Pod dies. You can exit its shell, but you cannot delete it from the Pod spec.',
    },

    {
      kicker: 'kubectl debug',
      title: 'Three ways to use kubectl debug',
      blocks: [
        { type: 'code', lang: 'bash', code: `
kubectl debug -it web-7d9f --image=busybox:1.36 --target=app
kubectl debug web-7d9f -it --copy-to=web-debug --container=app -- sh
kubectl debug web-7d9f --copy-to=web-debug --set-image=app=ghcr.io/acme/app:2.0.1-debug
kubectl debug node/worker-1 -it --image=ubuntu
chroot /host`, notes: { 1: '<b>Ephemeral container</b> in the running Pod. Best for a live process in a distroless image.', 2: '<b>--copy-to</b> creates a <b>new Pod</b> that is a copy of the original, here with the app container’s command replaced by <code>sh</code>. Useful when the app crashes on start, so there is nothing running to attach to.', 3: 'A copy with a different image, e.g. a debug build, leaving the original Pod untouched.', 4: '<b>Node debugging</b>: creates a Pod on that node using the host’s network, PID and IPC namespaces, with the node’s root filesystem mounted at <code>/host</code>.', 5: 'Inside the node debug Pod, switch into the host filesystem to read kubelet logs or config.' } },
        { type: 'compare', headers: ['Mode', 'Creates', 'Use when'], rows: [
          ['Ephemeral', 'Extra container in the <b>same</b> Pod', 'App is running; image lacks tools'],
          ['<code>--copy-to</code>', 'A <b>new</b> Pod copied from the original', 'App crashes immediately; you want to change command/image or share processes'],
          ['<code>node/&lt;name&gt;</code>', 'A privileged-style Pod on the node with host namespaces', 'Node problem: kubelet, disk, networking on the host'],
        ] },
        { type: 'callout', kind: 'tip', title: 'Clean up', html: 'Copies and node debug Pods are ordinary Pods: delete them when you are done. They are not managed by the original Deployment.' },
      ],
      tip: 'SSH is not needed to look at a node: <code>kubectl debug node/&lt;name&gt;</code> gives you a shell with the host filesystem under <code>/host</code>.',
    },

    {
      kicker: 'Networking from the inside',
      title: 'Debugging a Service with a temporary Pod',
      blocks: [
        { type: 'cols', ratio: '1.15fr 1fr', cols: [
          [
            { type: 'code', lang: 'bash', code: `
kubectl run tmp --rm -it --image=busybox:1.36 --restart=Never -- sh
nslookup web.shop.svc.cluster.local
wget -qO- http://web.shop:80/healthz
kubectl run net --rm -it --image=nicolaka/netshoot -- bash
curl -v http://web.shop:80
kubectl get endpointslices -n shop -l kubernetes.io/service-name=web
kubectl get pods -n shop -l app=web --show-labels`, notes: { 1: 'A throwaway Pod inside the cluster network. <b>--rm</b> deletes it on exit, <b>--restart=Never</b> makes a bare Pod.', 2: 'Does the Service name resolve through CoreDNS? Failure points at DNS or a wrong name/namespace.', 3: 'busybox ships <code>wget</code>, not <code>curl</code>.', 4: '<b>netshoot</b> is a popular image full of network tools: curl, dig, tcpdump, iperf.', 6: 'No endpoints = the Service selector matches no <b>Ready</b> Pods.', 7: 'Compare Pod labels with the Service selector; a typo is the classic cause.' } },
          ],
          [
            { type: 'flow', items: [
              { icon: '📛', label: 'DNS?', sub: 'nslookup', info: 'Name does not resolve: wrong namespace, typo, or CoreDNS problem.' },
              { icon: '🎯', label: 'Endpoints?', sub: 'EndpointSlices', info: 'Empty: selector does not match labels, or Pods are not Ready (readiness probe).' },
              { icon: '🔢', label: 'Ports?', sub: 'port → targetPort', info: '“Connection refused”: targetPort does not match the port the container listens on.' },
              { icon: '🛡️', label: 'Policy?', sub: 'NetworkPolicy', info: 'Timeouts while everything else looks right: a NetworkPolicy may be blocking traffic.' },
            ] },
          ],
        ] },
      ],
      tip: '“Service exists but has no endpoints” → the <b>selector</b> does not match the Pod labels, or the Pods are not Ready. Check before blaming kube-proxy.',
    },

    {
      kicker: 'Releases',
      title: 'Rollout debugging: status, history, undo, pause',
      blocks: [
        { type: 'code', lang: 'bash', code: `
kubectl rollout status deploy/web
kubectl rollout history deploy/web
kubectl rollout history deploy/web --revision=3
kubectl rollout undo deploy/web
kubectl rollout undo deploy/web --to-revision=2
kubectl rollout pause deploy/web
kubectl rollout resume deploy/web
kubectl rollout restart deploy/web`, notes: { 1: 'Waits and reports progress; exits non-zero if the rollout fails its progress deadline. Ideal in CI.', 2: 'Lists revisions (old ReplicaSets). The CHANGE-CAUSE column comes from the <code>kubernetes.io/change-cause</code> annotation.', 3: 'Shows the Pod template of one revision: which image did revision 3 use?', 4: 'Rolls back to the previous revision by scaling the old ReplicaSet back up.', 5: 'Rolls back to a specific revision.', 6: 'A <b>paused</b> Deployment ignores Pod template changes: you can make several edits without triggering a rollout. A forgotten pause is a classic “my change does nothing” cause.', 7: 'Resumes and rolls out all accumulated changes at once.', 8: 'Recreates all Pods with the same spec, e.g. to pick up changed ConfigMap env vars.' } },
        { type: 'callout', kind: 'info', title: 'Stuck rollouts', html: 'If new Pods never become Ready (bad image, failing readiness probe), the rollout stalls. After <code>progressDeadlineSeconds</code> (600 s by default) the Deployment gets condition <code>Progressing=False</code> with reason <b>ProgressDeadlineExceeded</b>. Kubernetes does <b>not</b> roll back automatically; you run <code>rollout undo</code> (or use a progressive delivery tool).' },
      ],
      tip: '“Revert a Deployment to its previous version” → <code>kubectl rollout undo deploy/&lt;name&gt;</code>. “See what changed between versions” → <code>kubectl rollout history --revision=N</code>.',
    },

    {
      kicker: 'Prevention',
      title: 'Check before you apply: diff, dry-run, explain',
      blocks: [
        { type: 'compare', headers: ['Command', 'What it does', 'Hits the server?'], rows: [
          ['<code>kubectl apply -f web.yaml --dry-run=client</code>', 'Builds the object locally and prints it; catches YAML and basic schema mistakes', 'No'],
          ['<code>kubectl apply -f web.yaml --dry-run=server</code>', 'Sends the request through validation and <b>admission</b> but does not persist it', 'Yes, nothing stored'],
          ['<code>kubectl diff -f web.yaml</code>', 'Shows what would change compared with the <b>live</b> object', 'Yes, nothing stored'],
          ['<code>kubectl explain deploy.spec.strategy</code>', 'Documents a field from the API schema', 'Reads the schema'],
          ['<code>kubectl get deploy web -o yaml</code>', 'Shows the full live object including defaults and status', 'Yes'],
        ] },
        { type: 'check', q: 'You want to know whether a manifest would be rejected by the cluster’s admission webhooks, without creating anything. Which command should you use?', options: ['kubectl apply -f app.yaml --dry-run=client', 'kubectl apply -f app.yaml --dry-run=server', 'kubectl explain app.yaml', 'kubectl create -f app.yaml --save-config'], answer: 1, explain: '<b>--dry-run=server</b> runs the full server-side path (validation and admission, including webhooks) without persisting. Client dry-run never contacts admission, <code>kubectl explain</code> documents fields rather than checking files, and <code>create --save-config</code> really creates the object.', ref: 'https://kubernetes.io/docs/reference/kubectl/generated/kubectl_apply/' },
      ],
      tip: 'A field name you cannot remember (e.g. where <code>failureThreshold</code> lives) → <code>kubectl explain pod.spec.containers.livenessProbe</code>.',
    },

    {
      kicker: 'Practice',
      title: 'Symptom → command',
      blocks: [
        { type: 'match', title: 'Match each symptom to the first command you would run', pairs: [
          ['Container in CrashLoopBackOff, need its last output', 'kubectl logs web --previous'],
          ['Pod stuck Pending, need the reason', 'kubectl describe pod web'],
          ['Distroless app misbehaving, no shell in image', 'kubectl debug -it web --image=busybox --target=app'],
          ['Test the app from your laptop, no Service exists', 'kubectl port-forward pod/web 8080:80'],
          ['Service name might not resolve', 'kubectl run tmp --rm -it --image=busybox -- nslookup web'],
          ['Bad release just went out', 'kubectl rollout undo deploy/web'],
          ['Suspect a problem on the node itself', 'kubectl debug node/worker-1 -it --image=ubuntu'],
        ] },
      ],
      tip: 'Read the symptom carefully: “crashed” → previous logs, “never started” → describe/events, “running but wrong” → exec or debug.',
    },
  ],

  summary: [
    'Workflow: <b>get → describe (events) → logs → exec/debug → port-forward → fix</b>.',
    '<code>kubectl logs</code>: <code>-f</code> follow, <code>-c</code> container, <code>--previous</code> crashed instance, <code>-l</code> selector, <code>--since</code>, <code>--tail</code>. Only stdout/stderr is captured.',
    '<b>CreateContainerConfigError</b> = missing ConfigMap/Secret or key referenced by env; missing volume source = stuck ContainerCreating with FailedMount.',
    'Liveness failure → restart; readiness failure → removed from endpoints, no restart; startup probe protects slow starters.',
    '<b>Ephemeral containers</b> (via <code>kubectl debug</code>) add tools to a running Pod without restarting it, ideal for distroless images; <code>--copy-to</code> debugs a copy; <code>node/</code> debugs a node with its filesystem at <code>/host</code>.',
    'Debug Services from inside with a temporary busybox/netshoot Pod: DNS, endpoints, ports, NetworkPolicy.',
    'Rollouts: <code>status</code>, <code>history</code>, <code>undo [--to-revision]</code>, <code>pause/resume</code>; validate with <code>diff</code> and <code>--dry-run=server</code>.',
  ],

  glossary: [
    { term: 'kubectl logs --previous', def: 'Shows the logs of the previous, terminated instance of a container; key for CrashLoopBackOff.' },
    { term: 'kubectl exec', def: 'Runs a command inside an existing container; requires that binary (e.g. a shell) to exist in the image.' },
    { term: 'kubectl port-forward', def: 'Tunnels a local port to a port on a Pod (or one Pod behind a Service) through the API server for testing.' },
    { term: 'kubectl debug', def: 'Adds an ephemeral container to a Pod, creates a modified copy of a Pod (--copy-to), or starts a debug Pod on a node.' },
    { term: 'Ephemeral container', def: 'Temporary container added to a running Pod for troubleshooting; no ports or probes, never restarted, cannot be removed.' },
    { term: 'Distroless image', def: 'Minimal image containing only the app and its runtime dependencies, without a shell or package manager.' },
    { term: 'Process namespace sharing', def: 'Containers that share a PID namespace can see each other’s processes; kubectl debug --target uses it.' },
    { term: 'Event', def: 'Short-lived API object recording something that happened to an object (scheduling, pulls, probe failures, mounts).' },
    { term: 'CreateContainerConfigError', def: 'Container status when its configuration cannot be built, typically a missing ConfigMap/Secret or key.' },
    { term: 'CrashLoopBackOff', def: 'Container repeatedly exits and the kubelet waits an increasing delay before restarting it.' },
    { term: 'Readiness probe', def: 'Check that decides whether a Pod receives Service traffic; failure removes it from endpoints without restarting it.' },
    { term: 'Server-side dry run', def: '--dry-run=server: the request is validated and admitted by the API server but not persisted.' },
    { term: 'kubectl diff', def: 'Shows the differences between local manifests and the live objects before applying.' },
    { term: 'kubectl rollout undo', def: 'Reverts a Deployment (or DaemonSet/StatefulSet) to a previous revision.' },
    { term: 'ProgressDeadlineExceeded', def: 'Deployment condition reason set when a rollout makes no progress within progressDeadlineSeconds (default 600 s).' },
    { term: 'netshoot', def: 'Community container image packed with network troubleshooting tools (curl, dig, tcpdump) for temporary debug Pods.' },
  ],

  quiz: [
    { q: 'A Pod is in CrashLoopBackOff. Which command shows the output of the container instance that just crashed?', options: ['kubectl describe pod web --previous', 'kubectl get pod web -o yaml', 'kubectl logs web --previous', 'kubectl exec web -- cat /var/log/app.log'], answer: 2, explain: '<code>kubectl logs --previous</code> (<code>-p</code>) returns the logs of the last terminated instance. describe has no <code>--previous</code> flag and shows events, not app output; <code>-o yaml</code> shows the object; exec cannot run in a container that keeps crashing, and Kubernetes captures stdout/stderr, not log files.', ref: 'https://kubernetes.io/docs/reference/kubectl/generated/kubectl_logs/' },
    { q: 'A Pod has two containers, <code>app</code> and <code>proxy</code>. How do you stream the logs of <code>proxy</code> only?', options: ['kubectl logs web -f -c proxy', 'kubectl logs web --tail proxy', 'kubectl logs -l proxy web', 'kubectl attach web proxy'], answer: 0, explain: '<b>-c</b> selects a container and <b>-f</b> follows the stream. <code>--tail</code> takes a line count, <code>-l</code> is a label selector for Pods (not containers), and <code>attach</code> connects to the main process’ stdio rather than reading logs.', ref: 'https://kubernetes.io/docs/reference/kubectl/generated/kubectl_logs/' },
    { q: 'Which statement about ephemeral containers is correct?', options: ['They can define readiness probes and ports', 'They are added to a running Pod without restarting it and cannot be removed afterwards', 'They are created with kubectl edit on the Pod', 'They replace the application container until the Pod is deleted'], answer: 1, explain: 'Ephemeral containers are appended through the <code>ephemeralcontainers</code> subresource (by <code>kubectl debug</code>), run alongside the app without restarting it, and stay in the spec until the Pod is deleted. They cannot have ports or probes, cannot be added with <code>kubectl edit</code>, and do not replace any container.', ref: 'https://kubernetes.io/docs/concepts/workloads/pods/ephemeral-containers/' },
    { q: 'Why are ephemeral containers especially useful for distroless images?', options: ['Distroless images cannot be pulled by containerd', 'Distroless images do not write logs', 'Distroless images cannot use readiness probes', 'Distroless images have no shell or tools, so kubectl exec has nothing to run'], answer: 3, explain: 'A distroless image contains only the app and its runtime, so <code>kubectl exec -- sh</code> fails. An ephemeral container brings its own tools into the Pod. Distroless images pull, log to stdout and support probes like any other image.', ref: 'https://kubernetes.io/docs/concepts/workloads/pods/ephemeral-containers/' },
    { q: 'A Pod’s status is <b>CreateContainerConfigError</b>. What is the most likely cause?', options: ['The node is out of memory', 'The image tag does not exist in the registry', 'An environment variable references a ConfigMap or Secret key that does not exist', 'The liveness probe is failing'], answer: 2, explain: 'The kubelet could not build the container configuration, typically because a referenced <b>ConfigMap/Secret or key is missing</b>. A missing image gives ErrImagePull/ImagePullBackOff, memory pressure gives OOMKilled or eviction, and a failing liveness probe causes restarts of a container that was already created.', ref: 'https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/' },
    { q: 'What does <code>kubectl port-forward svc/web 8080:80</code> do?', options: ['Changes the Service port from 80 to 8080', 'Exposes the Service on every node at port 8080', 'Forwards local port 8080 to port 80 of one Pod selected by the Service', 'Load-balances local port 8080 across all Pods of the Service'], answer: 2, explain: 'port-forward opens a tunnel from your workstation to <b>one Pod</b> chosen via the Service, for testing. It does not modify the Service, it is not a NodePort, and it does not load-balance between Pods.', ref: 'https://kubernetes.io/docs/tasks/access-application-cluster/port-forward-access-application-cluster/' },
    { q: 'A Pod is Running with READY <code>0/1</code>, never restarts and receives no traffic from its Service. Which probe is most likely failing?', options: ['Readiness probe', 'Liveness probe', 'Startup probe that already succeeded', 'No probe: the Service selector is wrong'], answer: 0, explain: 'A failing <b>readiness</b> probe marks the Pod not Ready and removes it from endpoints without restarting it. A failing liveness probe would increase RESTARTS. A wrong selector would not make the Pod show <code>0/1</code> READY, and a startup probe that succeeded no longer runs.', ref: 'https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/' },
    { q: 'Which TWO commands help you test a change against the live cluster without persisting anything? (Select 2)', options: ['kubectl diff -f web.yaml', 'kubectl apply -f web.yaml --dry-run=server', 'kubectl replace -f web.yaml', 'kubectl rollout restart deploy/web'], answer: [0, 1], explain: '<b>kubectl diff</b> compares your manifest with the live object and <b>--dry-run=server</b> runs validation and admission without storing the result. <code>replace</code> really overwrites the object and <code>rollout restart</code> really recreates the Pods.', ref: ['https://kubernetes.io/docs/reference/kubectl/generated/kubectl_diff/', 'https://kubernetes.io/docs/reference/kubectl/generated/kubectl_apply/'] },
    { q: 'You need a shell on a worker node to read kubelet configuration, but SSH is disabled. What can you use?', options: ['kubectl exec node/worker-1 -- sh', 'kubectl port-forward node/worker-1 22', 'kubectl logs node/worker-1', 'kubectl debug node/worker-1 -it --image=ubuntu'], answer: 3, explain: '<b>kubectl debug node/&lt;name&gt;</b> starts a Pod on that node in the host namespaces with the node’s filesystem mounted at <code>/host</code>. exec, port-forward and logs work on Pods, not on nodes.', ref: 'https://kubernetes.io/docs/tasks/debug/debug-cluster/kubectl-node-debug/' },
    { q: 'A Service exists, but requests time out and <code>kubectl get endpointslices -l kubernetes.io/service-name=web</code> shows no endpoints. What should you check first?', options: ['Whether kube-proxy is running on the control plane', 'Whether the Service selector matches the labels of Ready Pods', 'Whether the Service type is LoadBalancer', 'Whether CoreDNS has the right upstream servers'], answer: 1, explain: 'Endpoints are built from Pods that match the <b>selector</b> and are <b>Ready</b>. No endpoints means a label mismatch or unready Pods. kube-proxy and the Service type only matter once endpoints exist, and DNS would fail before you even reach the Service IP.', ref: 'https://kubernetes.io/docs/tasks/debug/debug-application/debug-service/' },
    { q: 'You changed the image in a Deployment but no new Pods appear. <code>kubectl rollout status</code> says the Deployment is paused. What fixes it?', options: ['kubectl rollout resume deploy/web', 'kubectl rollout undo deploy/web', 'kubectl rollout history deploy/web', 'kubectl delete rs --all'], answer: 0, explain: 'A <b>paused</b> Deployment accumulates template changes without rolling them out. <code>rollout resume</code> starts the rollout. undo would revert your change, history only lists revisions, and deleting ReplicaSets does not unpause anything.', ref: 'https://kubernetes.io/docs/concepts/workloads/controllers/deployment/' },
    { q: 'Which TWO actions let you troubleshoot an app container that crashes immediately at startup? (Select 2)', options: ['Run kubectl exec into the crashing container', 'Read kubectl logs with --previous', 'Create a copy with kubectl debug --copy-to and override the command with a shell', 'Run kubectl rollout pause on the Deployment'], answer: [1, 2], explain: '<b>--previous</b> logs show why the last instance died, and <b>kubectl debug --copy-to</b> creates a copy of the Pod where you can replace the command with <code>sh</code> and investigate. exec needs a running container, which a crash-looping one rarely is, and pausing a rollout does not stop the crash or give you a shell.', ref: 'https://kubernetes.io/docs/tasks/debug/debug-application/debug-running-pod/' },
  ],
});
