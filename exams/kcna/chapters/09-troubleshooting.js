KS.registerChapter('kcna', {
  id: 'troubleshooting',
  title: 'Troubleshooting',
  subtitle: 'From a red status to a root cause: Pods, nodes, Services, DNS and the control plane',
  icon: 'stethoscope',
  minutes: 30,
  objectives: [
    'Apply a systematic workflow: get → describe → events → logs → exec',
    'Map every common Pod status (Pending, CrashLoopBackOff, ImagePullBackOff, OOMKilled…) to its likely cause and first command',
    'Diagnose NotReady nodes and an unhealthy control plane, including when to use journalctl and crictl',
    'Debug unreachable Services and DNS: selectors, EndpointSlices, targetPort, NetworkPolicy and CoreDNS',
  ],

  slides: [
    {
      kicker: 'Method',
      title: 'A systematic approach beats guessing',
      blocks: [
        { type: 'text', html: 'Almost every Kubernetes problem can be narrowed down with the same five commands, from the widest view to the most intrusive. Start broad, read what Kubernetes already tells you, and only then go inside the container.' },
        { type: 'flow', items: [
          { icon: 'clipboard-list', label: 'get', sub: 'what is the status?', info: '<code>kubectl get pods -o wide</code> shows STATUS, RESTARTS, READY and the node. The status column alone usually tells you which branch of the decision tree you are in.' },
          { icon: 'search', label: 'describe', sub: 'conditions + events', info: '<code>kubectl describe pod web-5d8f</code> shows container states, last termination reason and exit code, conditions, volumes, and the <b>Events</b> at the bottom.' },
          { icon: 'newspaper', label: 'events', sub: 'what happened, in order', info: '<code>kubectl get events --sort-by=.metadata.creationTimestamp</code> lists scheduling failures, image pulls, probe failures and kills for the whole namespace.' },
          { icon: 'scroll-text', label: 'logs', sub: 'what the app said', info: '<code>kubectl logs web-5d8f --previous</code> shows the output of the <b>crashed</b> container instance, which is what you need for CrashLoopBackOff.' },
          { icon: 'terminal', label: 'exec', sub: 'look from inside', info: '<code>kubectl exec -it web-5d8f -- sh</code> to check files, env vars, DNS and connectivity from inside. Needs a running container (and a shell in the image); otherwise use <code>kubectl debug</code>.' },
        ], caption: 'Click Step or any box.' },
        { type: 'callout', kind: 'exam', title: 'Which command shows events?', html: '<code>kubectl describe</code> (events for one object) and <code>kubectl get events</code> (all events in a namespace). <code>kubectl logs</code> shows <b>container output</b>, never Kubernetes events.' },
      ],
      tip: 'Events are kept only for a limited time (one hour by default), so look at them early. Old problems may have no events left.',
    },

    {
      kicker: 'Decision tree · interactive',
      title: 'Where do I look first?',
      blocks: [
        { type: 'diagram', width: 900, height: 420,
          caption: 'Press Play to walk each branch, or click a box for details.',
          nodes: [
            { id: 'start', x: 345, y: 15, w: 210, h: 54, label: 'kubectl get pods\n-o wide', icon: 'clipboard-list', color: 'gray', info: 'Always start here: STATUS, READY, RESTARTS, AGE and NODE give you the branch to follow.' },
            { id: 'pend', x: 15, y: 130, w: 155, h: 56, label: 'Pending', color: 'amber', info: 'The Pod exists but has <b>not been scheduled</b> (no node), or is waiting for a volume to bind.' },
            { id: 'crash', x: 195, y: 130, w: 160, h: 56, label: 'CrashLoopBackOff', color: 'red', fs: 12.5, info: 'The container starts, exits, and the kubelet restarts it with an increasing back-off delay (up to 5 minutes).' },
            { id: 'img', x: 375, y: 130, w: 160, h: 56, label: 'ImagePullBackOff\nErrImagePull', color: 'pink', fs: 12, info: 'The kubelet cannot pull the image. ErrImagePull is the first failure; ImagePullBackOff means it is waiting before retrying.' },
            { id: 'run', x: 555, y: 130, w: 160, h: 56, label: 'Running but\nnot working', color: 'blue', info: 'Pod looks healthy but users get errors or timeouts: often a Service, readiness, DNS or NetworkPolicy issue.' },
            { id: 'node', x: 735, y: 130, w: 150, h: 56, label: 'Node NotReady', color: 'purple', info: 'Pods on that node may show Unknown or be stuck Terminating. The node stopped reporting healthy status.' },
            { id: 'pend2', x: 15, y: 240, w: 155, h: 56, label: 'describe pod:\nFailedScheduling', color: 'amber', fs: 12, info: 'The Events explain exactly why: <i>0/3 nodes are available: 3 Insufficient cpu</i>, untolerated taints, affinity mismatch, unbound PVC.' },
            { id: 'crash2', x: 195, y: 240, w: 160, h: 56, label: 'logs --previous', color: 'red', info: 'Read the logs of the previous (crashed) instance. Then check the <b>exit code</b> and <b>reason</b> in describe (e.g. OOMKilled, 137).' },
            { id: 'img2', x: 375, y: 240, w: 160, h: 56, label: 'describe: Events', color: 'pink', info: 'The event message says whether the image or tag was not found, access was denied (missing imagePullSecrets), or the registry was unreachable or rate-limited.' },
            { id: 'run2', x: 555, y: 240, w: 160, h: 56, label: 'get endpointslices', color: 'blue', fs: 12.5, info: 'Does the Service have endpoints? Empty means a selector/label mismatch or Pods not Ready.' },
            { id: 'node2', x: 735, y: 240, w: 150, h: 56, label: 'describe node', color: 'purple', info: 'Conditions: Ready, MemoryPressure, DiskPressure, PIDPressure. Then SSH to the node.' },
            { id: 'pend3', x: 15, y: 345, w: 155, h: 56, label: 'resources, taints\naffinity, PVC', color: 'amber', fs: 12, info: 'Fix by lowering requests, adding nodes, adding a toleration, fixing labels/affinity, or fixing the StorageClass.' },
            { id: 'crash3', x: 195, y: 345, w: 160, h: 56, label: 'fix app, config,\nlimits, probes', color: 'red', fs: 12, info: 'Typical fixes: wrong command/args, missing env or config, too-low memory limit, a liveness probe that kills a slow-starting app.' },
            { id: 'img3', x: 375, y: 345, w: 160, h: 56, label: 'tag, registry,\npull secret', color: 'pink', fs: 12, info: 'Correct the image name/tag, add <code>imagePullSecrets</code> for a private registry, or mirror the image.' },
            { id: 'run3', x: 555, y: 345, w: 160, h: 56, label: 'nslookup from\na test Pod', color: 'blue', fs: 12, info: 'If endpoints exist, test DNS and direct Pod IP access from a throwaway Pod, then check targetPort and NetworkPolicies.' },
            { id: 'node3', x: 735, y: 345, w: 150, h: 56, label: 'journalctl -u\nkubelet; crictl', color: 'purple', fs: 12, info: 'On the node: <code>systemctl status kubelet</code>, <code>journalctl -u kubelet</code>, <code>crictl ps -a</code>, disk space with <code>df -h</code>.' },
          ],
          edges: [
            { from: 'start', to: 'pend', color: 'amber' },
            { from: 'start', to: 'crash', color: 'red' },
            { from: 'start', to: 'img', color: 'pink' },
            { from: 'start', to: 'run', color: 'blue' },
            { from: 'start', to: 'node', color: 'purple' },
            { from: 'pend', to: 'pend2', color: 'amber' },
            { from: 'pend2', to: 'pend3', color: 'amber' },
            { from: 'crash', to: 'crash2', color: 'red' },
            { from: 'crash2', to: 'crash3', color: 'red' },
            { from: 'img', to: 'img2', color: 'pink' },
            { from: 'img2', to: 'img3', color: 'pink' },
            { from: 'run', to: 'run2', color: 'blue' },
            { from: 'run2', to: 'run3', color: 'blue' },
            { from: 'node', to: 'node2', color: 'purple' },
            { from: 'node2', to: 'node3', color: 'purple' },
          ],
          steps: [
            { on: ['start'], text: 'Begin with <code>kubectl get pods -o wide</code>. The <b>STATUS</b> column picks the branch; <b>RESTARTS</b> and <b>NODE</b> add context.' },
            { on: ['start>pend', 'pend', 'pend>pend2', 'pend2', 'pend2>pend3', 'pend3'], text: '<b>Pending</b>: the scheduler could not place the Pod. <code>kubectl describe pod</code> shows a <b>FailedScheduling</b> event with the reason: resources, taints, affinity or an unbound PVC.' },
            { on: ['start>crash', 'crash', 'crash>crash2', 'crash2', 'crash2>crash3', 'crash3'], text: '<b>CrashLoopBackOff</b>: the app keeps exiting. Read <code>kubectl logs --previous</code> and the exit code in describe, then fix the app, its config, its memory limit or an aggressive liveness probe.' },
            { on: ['start>img', 'img', 'img>img2', 'img2', 'img2>img3', 'img3'], text: '<b>ImagePullBackOff / ErrImagePull</b>: the event names the problem: wrong image or tag, missing <b>imagePullSecrets</b>, or an unreachable/rate-limited registry.' },
            { on: ['start>run', 'run', 'run>run2', 'run2', 'run2>run3', 'run3'], text: '<b>Running but broken</b>: check that the Service has <b>EndpointSlices</b> (selector matches labels, Pods Ready), then DNS from a test Pod, <b>targetPort</b> and <b>NetworkPolicies</b>.' },
            { on: ['start>node', 'node', 'node>node2', 'node2', 'node2>node3', 'node3'], text: '<b>Node NotReady</b>: <code>kubectl describe node</code> for conditions, then on the node: kubelet service status and logs (<code>journalctl -u kubelet</code>) and the runtime via <code>crictl</code>.' },
          ],
        },
      ],
      tip: 'For exam questions, link the symptom to the <b>first</b> command: Pending → <code>describe pod</code>; CrashLoopBackOff → <code>logs --previous</code>; NotReady node → <code>describe node</code> / <code>journalctl -u kubelet</code>.',
    },

    {
      kicker: 'Cheat sheet',
      title: 'Status → likely cause → first command',
      blocks: [
        { type: 'compare', headers: ['Status / reason', 'Likely cause', 'First command'], rows: [
          ['Pending', 'No node fits: insufficient CPU/memory, taints, affinity, nodeSelector, unbound PVC', '<code>kubectl describe pod</code> (FailedScheduling)'],
          ['ContainerCreating (stuck)', 'Volume cannot attach/mount, Secret/ConfigMap volume missing, CNI not ready', '<code>kubectl describe pod</code> (FailedMount, network events)'],
          ['ErrImagePull / ImagePullBackOff', 'Wrong image name or tag, private registry without imagePullSecrets, registry unreachable', '<code>kubectl describe pod</code>'],
          ['CreateContainerConfigError', 'Referenced ConfigMap/Secret or one of its keys does not exist', '<code>kubectl describe pod</code>, then <code>kubectl get cm,secret</code>'],
          ['CrashLoopBackOff', 'App exits repeatedly: bug, bad command/args, missing config, failing liveness probe', '<code>kubectl logs POD --previous</code>'],
          ['OOMKilled (exit 137)', 'Container exceeded its memory limit and was killed by the kernel', '<code>kubectl describe pod</code> (Last State), <code>kubectl top pod</code>'],
          ['Error', 'Main process exited with a non-zero code', '<code>kubectl logs POD</code>'],
          ['Completed', 'Process exited with code 0. Normal for Jobs; for a Deployment it means the command finished and will restart', '<code>kubectl logs POD</code>, check command'],
          ['Terminating (stuck)', 'Finalizers not removed, or the node is unreachable', '<code>kubectl get pod -o yaml</code> (finalizers), <code>kubectl get nodes</code>'],
          ['Running, READY 0/1', 'Readiness probe failing: Pod is excluded from Service endpoints', '<code>kubectl describe pod</code> (Unhealthy events)'],
        ] },
      ],
      tip: '<b>Pending</b> is a <i>scheduling</i> problem (no node yet). <b>ContainerCreating</b> means a node was chosen and something on the node (volumes, network, image) is still in progress or stuck.',
    },

    {
      kicker: 'Pending',
      title: 'Reading a FailedScheduling event',
      blocks: [
        { type: 'cols', ratio: '1.3fr 1fr', cols: [
          [
            { type: 'code', lang: 'bash', title: 'kubectl describe pod api-7c9d (Events, trimmed)', code: `
Type     Reason            From               Message
----     ------            ----               -------
Warning  FailedScheduling  default-scheduler  0/4 nodes are available:
  1 node(s) had untolerated taint {node-role.kubernetes.io/control-plane: },
  2 Insufficient memory,
  1 node(s) didn't match Pod's node affinity/selector.
  preemption: 0/4 nodes are available: 4 No preemption victims found.`, notes: {
              3: 'The <b>From</b> column tells you the scheduler raised it: the Pod was never bound to a node, so the kubelet and runtime are not involved yet.',
              4: 'Control plane nodes are tainted. Workload Pods need a toleration to land there (usually you do not want that).',
              5: 'Requests are larger than what is left on the node. The scheduler uses <b>requests</b>, not actual usage.',
              6: 'nodeSelector or required node affinity points at labels no remaining node carries. Check for a typo with <code>kubectl get nodes --show-labels</code>.',
              7: 'Not even evicting lower-priority Pods would make room.',
            } },
          ],
          [
            { type: 'cards', cols: 1, items: [
              { icon: 'ruler', color: 'amber', title: 'Insufficient cpu / memory', text: 'Lower the requests, free capacity, or add nodes (Cluster Autoscaler does this automatically).' },
              { icon: 'ban', color: 'red', title: 'Untolerated taint', text: 'Add a matching toleration, or remove the taint if it is stale (e.g. a cordoned or NotReady node).' },
              { icon: 'magnet', color: 'purple', title: 'Affinity / nodeSelector', text: 'Fix the label on the node or the selector in the Pod.' },
              { icon: 'save', color: 'teal', title: 'Unbound PersistentVolumeClaim', text: 'The PVC is Pending: no matching PV or StorageClass. Check <code>kubectl describe pvc</code>.' },
            ] },
          ],
        ] },
      ],
      tip: 'Trap: a <b>ResourceQuota</b> violation does not produce a Pending Pod. The API server rejects the Pod, so it is never created; for a Deployment you see a <b>FailedCreate</b> event on the ReplicaSet instead.',
    },

    {
      kicker: 'Crashes',
      title: 'CrashLoopBackOff, exit codes and OOMKilled',
      blocks: [
        { type: 'cols', cols: [
          [
            { type: 'compare', headers: ['Exit code', 'Meaning', 'Typical cause'], rows: [
              ['0', 'Success', 'Process finished (Completed). Fine for Jobs'],
              ['1', 'Generic application error', 'Exception, bad config, missing dependency'],
              ['126 / 127', 'Not executable / command not found', 'Wrong <code>command</code> or entrypoint'],
              ['137', '128 + 9 = SIGKILL', '<b>OOMKilled</b> (memory limit) or killed after grace period'],
              ['143', '128 + 15 = SIGTERM', 'Graceful stop, e.g. failed liveness probe or Pod deletion'],
            ] },
          ],
          [
            { type: 'code', lang: 'bash', title: 'investigate a crash loop', code: `
kubectl get pod api-7c9d
kubectl logs api-7c9d --previous
kubectl logs api-7c9d -c sidecar
kubectl describe pod api-7c9d | grep -A5 "Last State"
kubectl get pod api-7c9d -o jsonpath='{.status.containerStatuses[0].lastState}'`, notes: {
              1: 'RESTARTS keeps climbing and STATUS alternates between Running, Error and CrashLoopBackOff.',
              2: '<code>--previous</code> (<code>-p</code>): logs of the last terminated instance. Without it you may only see the new instance’s first lines.',
              3: 'Multi-container Pod? Choose the container with <code>-c</code> (or <code>--all-containers</code>).',
              4: 'Shows <b>Reason</b> (Error, OOMKilled, Completed) and <b>Exit Code</b> of the previous run.',
            } },
          ],
        ] },
        { type: 'callout', kind: 'info', title: 'What “BackOff” means', html: 'CrashLoopBackOff is not a crash reason; it is the kubelet <b>waiting</b> before the next restart. The delay grows exponentially (10s, 20s, 40s…) up to five minutes and resets after the container runs successfully for a while.' },
      ],
      tip: '<b>OOMKilled + exit code 137</b> = the container exceeded its <b>memory limit</b>. Raise the limit or fix the leak. CPU over the limit is <b>throttled</b>, never killed.',
    },

    {
      kicker: 'Startup errors',
      title: 'Image and configuration failures: flip to reveal',
      blocks: [
        { type: 'flip', items: [
          { front: 'ErrImagePull', back: 'First failed pull: image or tag does not exist, typo in registry host, authentication denied.' },
          { front: 'ImagePullBackOff', back: 'Same problem, retried with back-off. Read the event message; it names the image and the error.' },
          { front: 'Private registry', back: 'Pull fails with “unauthorized”: create a <code>docker-registry</code> Secret and reference it in <code>imagePullSecrets</code> (or on the ServiceAccount).' },
          { front: 'CreateContainerConfigError', back: 'The image is pulled, but a referenced ConfigMap or Secret (or a key in it) is missing, so the container cannot be configured.' },
          { front: 'ContainerCreating', back: 'Usually a volume: PVC cannot attach (wrong zone, RWO volume still attached elsewhere), missing Secret for a secret volume, or the CNI plugin failing to set up the network.' },
          { front: 'Stuck Terminating', back: 'A finalizer is waiting for a controller, or the node is gone. Last resort: <code>kubectl delete pod X --grace-period=0 --force</code>.' },
        ] },
        { type: 'check', q: 'A Pod shows <code>CreateContainerConfigError</code>. The image exists and pulls fine. What is the most likely cause?', options: ['The node is out of memory', 'A ConfigMap or Secret referenced by the Pod does not exist', 'The readiness probe is failing', 'The image tag is wrong'], answer: 1, explain: 'CreateContainerConfigError happens <b>after</b> the image pull, when building the container config: typically an env var or envFrom referencing a <b>missing ConfigMap/Secret or key</b>. A wrong tag gives ErrImagePull; a failing readiness probe leaves the Pod Running but not Ready; memory pressure leads to eviction or OOMKilled.', ref: 'https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/' },
      ],
      tip: 'Force-deleting a Pod only removes the API object. If the node is merely partitioned, the containers may <b>still be running</b> there, which matters for StatefulSets.',
    },

    {
      kicker: 'Events & logs',
      title: 'The commands you should recognise on sight',
      blocks: [
        { type: 'code', lang: 'bash', title: 'events, logs, exec', code: `
kubectl get events -n shop --sort-by=.metadata.creationTimestamp
kubectl get events --field-selector type=Warning -A
kubectl events --for pod/api-7c9d -n shop
kubectl logs deploy/api --since=15m
kubectl logs -f api-7c9d --tail=50
kubectl logs -l app=api --all-containers --prefix
kubectl exec -it api-7c9d -- sh
kubectl debug -it api-7c9d --image=busybox:1.36 --target=api
kubectl get pod api-7c9d -o yaml`, notes: {
          1: 'Events are not sorted by default. <code>--sort-by</code> on the timestamp puts them in chronological order.',
          2: 'Only warnings, across all namespaces (<code>-A</code>). A quick “what is going wrong anywhere?” view.',
          3: 'The newer <code>kubectl events</code> command, filtered to one object.',
          4: 'Logs from a Pod picked from the Deployment, limited to the last 15 minutes.',
          5: '<code>-f</code> streams (follow) like <code>tail -f</code>; <code>--tail</code> limits the backlog.',
          6: 'Logs from all Pods matching a label selector, prefixed with the Pod/container name.',
          7: 'A shell inside a running container. Fails on distroless images that have no shell.',
          8: 'Adds an <b>ephemeral debug container</b> sharing the target container’s process namespace: the answer for distroless images or crashed tooling.',
          9: 'The full object including <code>status</code>: conditions, containerStatuses, finalizers, nodeName.',
        } },
        { type: 'callout', kind: 'trap', title: 'Logs live on the node', html: 'kubectl logs reads container stdout/stderr that the kubelet keeps on the node. When a Pod is <b>deleted</b> its logs are gone with it. Long-term log storage needs a log pipeline (e.g. Fluent Bit / Fluentd to a backend).' },
      ],
      tip: '“What does <code>kubectl logs web --previous</code> do?” → shows the logs of the <b>previous terminated instance</b> of the container, not of the previous Pod or previous Deployment revision.',
    },

    {
      kicker: 'Nodes',
      title: 'When a node goes NotReady',
      blocks: [
        { type: 'cols', cols: [
          [
            { type: 'compare', headers: ['Node condition', 'True means', 'Consequence'], rows: [
              ['Ready', 'kubelet healthy and posting status', 'False/Unknown: Pods eventually evicted and recreated elsewhere'],
              ['MemoryPressure', 'Node memory is low', 'kubelet evicts Pods (status <i>Evicted</i>), new Pods avoid it'],
              ['DiskPressure', 'Disk or image filesystem nearly full', 'Image garbage collection, evictions'],
              ['PIDPressure', 'Too many processes', 'Evictions'],
              ['NetworkUnavailable', 'Node network not configured', 'Usually the CNI plugin'],
            ] },
          ],
          [
            { type: 'code', lang: 'bash', title: 'kubectl first, then on the node', code: `
kubectl get nodes
kubectl describe node worker-2
ssh worker-2
systemctl status kubelet
journalctl -u kubelet --since "10 min ago"
systemctl status containerd
df -h; free -m`, notes: {
              2: 'Conditions, capacity vs allocatable, taints such as <code>node.kubernetes.io/not-ready</code> or <code>disk-pressure</code>, and events.',
              4: 'Is the kubelet even running? A stopped kubelet = node stops heartbeating = NotReady.',
              5: 'The kubelet runs as a <b>systemd service</b>, not as a Pod, so its logs are in the journal, not in <code>kubectl logs</code>.',
              6: 'A dead container runtime also makes the node NotReady.',
              7: 'Full disks and memory exhaustion are common, boring root causes.',
            } },
          ],
        ] },
      ],
      tip: 'Common NotReady causes: <b>kubelet stopped or crashing</b> (bad config, expired certificate), <b>container runtime down</b>, <b>CNI not installed/broken</b>, or the node is simply unreachable.',
    },

    {
      kicker: 'Control plane',
      title: 'Is the control plane healthy?',
      blocks: [
        { type: 'cols', ratio: '1.1fr 1fr', cols: [
          [
            { type: 'code', lang: 'bash', title: 'check the control plane', code: `
kubectl get pods -n kube-system
kubectl get --raw='/readyz?verbose'
kubectl get --raw='/livez'
kubectl logs -n kube-system kube-apiserver-cp-1
ls /etc/kubernetes/manifests
crictl ps -a | grep kube-apiserver`, notes: {
              1: 'In kubeadm clusters the control plane runs as <b>static Pods</b>: kube-apiserver-&lt;node&gt;, etcd-&lt;node&gt;, kube-scheduler-&lt;node&gt;, kube-controller-manager-&lt;node&gt;, plus CoreDNS and kube-proxy.',
              2: 'The API server’s health endpoints. <code>verbose</code> lists every individual check (etcd, informers, post-start hooks).',
              3: '<b>livez</b> = is the process alive; <b>readyz</b> = is it ready to serve traffic.',
              5: 'The kubelet runs whatever manifest is in this directory. A typo in kube-apiserver.yaml here takes the API server down.',
              6: 'If the API server is down, kubectl cannot help. Ask the runtime directly on the control plane node.',
            } },
          ],
          [
            { type: 'bullets', items: [
              'Managed services (EKS, GKE, AKS) hide the control plane; you only see its health through the API and provider status.',
              '<code>kubectl get componentstatuses</code> is <b>deprecated</b>; prefer the <code>/readyz</code> and <code>/livez</code> endpoints.',
              'Symptoms → component: Pods stay unscheduled → <b>scheduler</b>; Deployments do not create Pods → <b>controller-manager</b>; kubectl times out → <b>API server</b> or <b>etcd</b>.',
            ] },
            { type: 'callout', kind: 'exam', title: 'Symptom mapping', html: 'New Pods sit in <b>Pending</b> with <b>no events at all</b> (not even FailedScheduling) on every node? Suspect the <b>kube-scheduler</b> itself.' },
          ],
        ] },
      ],
      tip: 'Static Pods are created by the kubelet from files, so <code>kubectl delete</code> on them only recreates the mirror Pod. Edit or move the manifest file instead.',
    },

    {
      kicker: 'Networking',
      title: 'The Service does not answer',
      blocks: [
        { type: 'flow', items: [
          { icon: 'tag', label: 'Selector', sub: 'matches Pod labels?', info: 'The most common bug. <code>kubectl get svc api -o wide</code> shows the selector; compare with <code>kubectl get pods --show-labels</code>. One typo (app=api vs app=API) means zero backends.' },
          { icon: 'contact', label: 'EndpointSlices', sub: 'any addresses?', info: '<code>kubectl get endpointslices -l kubernetes.io/service-name=api</code>. Empty = selector mismatch or no <b>Ready</b> Pods. The older Endpoints API is deprecated in favour of EndpointSlices.' },
          { icon: 'circle-check', label: 'Readiness', sub: 'Pods Ready?', info: 'Pods failing their readiness probe are removed from endpoints even though they are Running.' },
          { icon: 'hash', label: 'Ports', sub: 'targetPort correct?', info: '<code>port</code> is what clients call; <code>targetPort</code> must equal the port the container actually listens on. Wrong targetPort = connection refused.' },
          { icon: 'blocks', label: 'NetworkPolicy', sub: 'traffic allowed?', info: 'A default-deny policy in the namespace silently drops traffic. Check <code>kubectl get networkpolicy -n shop</code>.' },
          { icon: 'shuffle', label: 'kube-proxy / CNI', sub: 'node plumbing', info: 'Last: kube-proxy (or its eBPF replacement) and the CNI plugin Pods in kube-system must be healthy.' },
        ], caption: 'Check from top to bottom. Click Step or any box.' },
        { type: 'code', lang: 'bash', title: 'service checks', code: `
kubectl get svc api -n shop -o wide
kubectl get endpointslices -n shop -l kubernetes.io/service-name=api
kubectl get pods -n shop --show-labels
kubectl port-forward svc/api 8080:80 -n shop`, notes: {
          2: 'No addresses listed? The problem is between the Service selector and the Pods, not the network.',
          4: 'Bypasses Ingress, DNS and NetworkPolicy from your laptop. If this works, the app is fine and the issue is in front of it.',
        } },
      ],
      tip: 'Empty EndpointSlices + Running Pods = <b>label/selector mismatch</b> or <b>readiness failing</b>. Endpoints present but connection refused = <b>wrong targetPort</b> (or the app listens on 127.0.0.1).',
    },

    {
      kicker: 'DNS',
      title: 'Debugging cluster DNS',
      blocks: [
        { type: 'cols', cols: [
          [
            { type: 'code', lang: 'bash', title: 'test from a throwaway Pod', code: `
kubectl run dnstest --rm -it --restart=Never --image=busybox:1.36 -- nslookup api.shop.svc.cluster.local
kubectl exec -it api-7c9d -- cat /etc/resolv.conf
kubectl get pods -n kube-system -l k8s-app=kube-dns
kubectl logs -n kube-system -l k8s-app=kube-dns
kubectl get svc kube-dns -n kube-system`, notes: {
              1: 'A temporary Pod (<code>--rm</code> deletes it afterwards) resolving the Service’s full name: &lt;service&gt;.&lt;namespace&gt;.svc.cluster.local.',
              2: 'The nameserver should be the cluster DNS Service IP; search domains let you use the short name <code>api</code> inside the same namespace.',
              3: 'CoreDNS Pods still carry the historical label <code>k8s-app=kube-dns</code>.',
              4: 'CoreDNS logs show upstream errors, loops or plugin issues.',
              5: 'The DNS Service is still named <b>kube-dns</b> for compatibility, even though CoreDNS serves it.',
            } },
          ],
          [
            { type: 'bullets', items: [
              'Name resolves by <b>full name</b> but not by <b>short name</b>? You are in a different namespace: use <code>api.shop</code> or the FQDN.',
              'Nothing resolves? Check CoreDNS Pods are Running and that a NetworkPolicy is not blocking UDP/TCP 53 to kube-system.',
              'Resolves to an IP but no reply? DNS is fine; continue with the Service checklist.',
              'Headless Service (<code>clusterIP: None</code>)? DNS returns the <b>Pod IPs</b> directly instead of one virtual IP.',
            ] },
          ],
        ] },
      ],
      tip: 'Which Pods provide cluster DNS? <b>CoreDNS</b> (CNCF graduated) in the <code>kube-system</code> namespace, behind the Service named <code>kube-dns</code>.',
    },

    {
      kicker: 'Capacity',
      title: 'Resource exhaustion, quotas and crictl',
      blocks: [
        { type: 'cols', cols: [
          [
            { type: 'code', lang: 'bash', title: 'who is using what?', code: `
kubectl top nodes
kubectl top pods -A --sort-by=memory
kubectl describe node worker-2 | grep -A8 "Allocated resources"
kubectl describe resourcequota -n shop
kubectl get limitrange -n shop`, notes: {
              1: 'Live CPU/memory usage. Requires <b>metrics-server</b>; without it you get “Metrics API not available”.',
              3: 'Sum of <b>requests</b> and limits on the node vs allocatable. Scheduling uses these numbers, not live usage.',
              4: 'Used vs hard limits for the namespace. A full quota makes new Pods fail at creation time.',
              5: 'LimitRange injects default requests/limits and enforces min/max per container.',
            } },
          ],
          [
            { type: 'code', lang: 'bash', title: 'on the node, below Kubernetes', code: `
crictl pods
crictl ps -a
crictl logs 3f2a9c1b
crictl inspect 3f2a9c1b
crictl images`, notes: {
              1: '<b>crictl</b> talks to the CRI runtime (containerd, CRI-O) directly. Pod sandboxes on this node.',
              2: '<code>-a</code> includes exited containers, great for control plane static Pods that keep crashing.',
              3: 'Container logs even when the API server is down.',
            } },
            { type: 'callout', kind: 'warn', title: 'Not docker', html: 'Since dockershim was removed in 1.24, nodes typically have no Docker daemon. Use <b>crictl</b> (CRI debugging tool), not <code>docker ps</code>.' },
          ],
        ] },
      ],
      tip: '<code>kubectl top</code> shows <b>actual usage</b>; <code>kubectl describe node</code> shows <b>requested</b> capacity. A node can look idle in top yet refuse new Pods because its requests are fully allocated.',
    },

    {
      kicker: 'Practice',
      title: 'Match the symptom to the first move',
      blocks: [
        { type: 'match', pairs: [
          ['Pending with FailedScheduling', 'kubectl describe pod'],
          ['CrashLoopBackOff', 'kubectl logs --previous'],
          ['Node NotReady, kubelet suspected', 'journalctl -u kubelet'],
          ['Service has no endpoints', 'Compare selector with Pod labels'],
          ['Name does not resolve', 'nslookup from a test Pod'],
          ['API server down, need container list', 'crictl ps -a'],
        ] },
        { type: 'check', q: 'A container shows <code>Last State: Terminated, Reason: OOMKilled, Exit Code: 137</code>. What is the right fix?', options: ['Increase the CPU limit', 'Raise the container’s memory limit or reduce its memory usage', 'Add a readiness probe', 'Change the Service targetPort'], answer: 1, explain: 'OOMKilled with exit code 137 means the kernel killed the process for exceeding its <b>memory limit</b>. CPU limits only throttle, readiness probes affect traffic not memory, and targetPort is a networking setting.', ref: 'https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/' },
      ],
    },
  ],

  summary: [
    'Work from broad to deep: <b>get → describe → events → logs → exec</b> (or <code>kubectl debug</code> for distroless).',
    '<b>Pending</b> = scheduling (resources, taints, affinity, unbound PVC); <b>ContainerCreating</b> stuck = volume/network on the node; <b>ImagePullBackOff</b> = image name/tag/credentials.',
    '<b>CrashLoopBackOff</b> → <code>kubectl logs --previous</code>; <b>OOMKilled / exit 137</b> = memory limit exceeded; <b>CreateContainerConfigError</b> = missing ConfigMap/Secret.',
    '<code>kubectl get events --sort-by=.metadata.creationTimestamp</code> orders events; events expire after about an hour.',
    'Node <b>NotReady</b>: <code>kubectl describe node</code>, then <code>systemctl status kubelet</code>, <code>journalctl -u kubelet</code>, <code>crictl ps -a</code> on the node.',
    'Control plane: static Pods in <b>kube-system</b> (manifests in /etc/kubernetes/manifests); health via <code>kubectl get --raw /readyz</code>.',
    'Service unreachable: <b>selector/labels → EndpointSlices → readiness → targetPort → NetworkPolicy</b>. DNS: <code>nslookup</code> from a test Pod and check CoreDNS (<code>k8s-app=kube-dns</code>).',
  ],

  glossary: [
    { term: 'CrashLoopBackOff', def: 'Pod state where a container keeps exiting and the kubelet waits an increasing back-off delay before each restart.' },
    { term: 'ImagePullBackOff', def: 'State where the kubelet failed to pull an image (ErrImagePull) and is waiting before retrying.' },
    { term: 'CreateContainerConfigError', def: 'Error creating a container’s configuration, usually because a referenced ConfigMap or Secret (or key) is missing.' },
    { term: 'OOMKilled', def: 'Termination reason when a container exceeds its memory limit and is killed by the kernel (exit code 137).' },
    { term: 'Exit code 137', def: '128 + 9: the process received SIGKILL, typically due to OOM or exceeding the termination grace period.' },
    { term: 'FailedScheduling', def: 'Scheduler event explaining why no node could accept a Pending Pod.' },
    { term: 'Event', def: 'Short-lived API object recording something that happened to another object (scheduled, pulled, killed, failed).' },
    { term: 'kubectl logs --previous', def: 'Shows logs from the previous terminated instance of a container; essential for crash loops.' },
    { term: 'kubectl debug', def: 'Adds an ephemeral debug container to a running Pod (or copies a Pod/node) for troubleshooting.' },
    { term: 'NotReady', def: 'Node condition when the kubelet is not reporting healthy status to the control plane.' },
    { term: 'Node pressure', def: 'MemoryPressure, DiskPressure or PIDPressure conditions that trigger kubelet evictions.' },
    { term: 'journalctl -u kubelet', def: 'Reads the systemd journal for the kubelet service on a node.' },
    { term: 'crictl', def: 'CLI for CRI-compatible container runtimes, used on a node to inspect Pods, containers, images and logs.' },
    { term: '/readyz and /livez', def: 'API server health endpoints for readiness and liveness; add ?verbose for individual checks.' },
    { term: 'EndpointSlice', def: 'Object listing the ready backend addresses of a Service; empty slices mean no matching Ready Pods.' },
    { term: 'kube-dns Service', def: 'The cluster DNS Service in kube-system, served by CoreDNS Pods labelled k8s-app=kube-dns.' },
  ],

  quiz: [
    { q: 'A Pod has been in <b>Pending</b> for ten minutes. Which command most directly shows why?', options: ['kubectl logs POD', 'kubectl describe pod POD', 'kubectl exec -it POD -- sh', 'kubectl top pod POD'], answer: 1, explain: '<code>kubectl describe pod</code> shows the <b>FailedScheduling</b> event with the reason. A Pending Pod has no running container, so <code>logs</code> and <code>exec</code> have nothing to work with, and <code>top</code> needs a running Pod.', ref: 'https://kubernetes.io/docs/tasks/debug/debug-application/debug-pods/' },
    { q: 'A container keeps restarting and the Pod shows <b>CrashLoopBackOff</b>. Which command shows the output of the container instance that just crashed?', options: ['kubectl logs POD --previous', 'kubectl get events --previous', 'kubectl describe deployment --previous', 'kubectl rollout history'], answer: 0, explain: '<code>kubectl logs --previous</code> (<code>-p</code>) reads the logs of the last <b>terminated</b> container instance. Events have no <code>--previous</code> flag, and rollout history lists Deployment revisions, not container output.', ref: 'https://kubernetes.io/docs/reference/kubectl/generated/kubectl_logs/' },
    { q: 'What does exit code <b>137</b> combined with reason <b>OOMKilled</b> indicate?', options: ['The image could not be pulled', 'The container exceeded its CPU limit and was killed', 'The container exceeded its memory limit and was killed', 'The liveness probe returned HTTP 500'], answer: 2, explain: '137 = 128 + 9 (SIGKILL); with reason OOMKilled the kernel killed the process for exceeding its <b>memory limit</b>. Exceeding a CPU limit only causes <b>throttling</b>. Image pull failures never start the container, and a failing liveness probe leads to SIGTERM-based restarts.', ref: 'https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/' },
    { q: 'A Pod shows <b>ImagePullBackOff</b>. Its image is in a private registry and the event says “unauthorized”. What is missing?', options: ['A NetworkPolicy allowing egress', 'A PersistentVolumeClaim for the image cache', 'A readiness probe', 'imagePullSecrets referencing registry credentials'], answer: 3, explain: 'Private registries need credentials: a <code>docker-registry</code> Secret referenced in <b>imagePullSecrets</b> (or attached to the ServiceAccount). The image is pulled by the node, so NetworkPolicy (Pod traffic) is not the issue, and PVCs and probes are unrelated.', ref: 'https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/' },
    { q: 'Which command lists events in a namespace in chronological order?', options: ['kubectl get events --sort-by=.metadata.creationTimestamp', 'kubectl logs events --sort', 'kubectl describe namespace --events', 'kubectl get events --watch-only'], answer: 0, explain: 'Events are not sorted by default; <code>--sort-by</code> on a timestamp field orders them. <code>kubectl logs</code> reads container output, not events, and the other flags do not sort.', ref: 'https://kubernetes.io/docs/reference/kubectl/quick-reference/' },
    { q: 'A worker node is <b>NotReady</b>. You SSH into it. Which command helps you find out why the kubelet is failing?', options: ['kubectl logs kubelet -n kube-system', 'docker logs kubelet', 'kubectl get --raw /readyz', 'journalctl -u kubelet'], answer: 3, explain: 'The kubelet runs as a <b>systemd service</b>, so its logs are in the journal: <code>journalctl -u kubelet</code>. It is not a Pod (no kubectl logs), Docker is usually not installed since dockershim was removed, and /readyz reports API server health.', ref: 'https://kubernetes.io/docs/concepts/cluster-administration/system-logs/' },
    { q: 'A Service has no endpoints even though three Pods are Running. Which TWO causes are most likely? (Select 2)', options: ['The Service selector does not match the Pod labels', 'The Pods are failing their readiness probe', 'The StorageClass is missing', 'The kubelet is using cgroup v2'], answer: [0, 1], explain: 'Endpoints are built from Pods that <b>match the selector</b> and are <b>Ready</b>. A label/selector mismatch or failing readiness probes both leave the EndpointSlices empty. Storage and cgroup versions do not affect Service endpoints.', ref: 'https://kubernetes.io/docs/tasks/debug/debug-application/debug-service/' },
    { q: 'The Service has endpoints, but clients get “connection refused”. The container listens on port 8080. What should you check first?', options: ['The Service’s targetPort', 'The Pod’s nodeSelector', 'The PersistentVolume reclaim policy', 'The Deployment’s revisionHistoryLimit'], answer: 0, explain: 'Endpoints exist, so selection works; traffic then goes to <b>targetPort</b>, which must equal the container’s listening port (8080). nodeSelector affects scheduling, reclaim policy affects storage, and revisionHistoryLimit affects rollbacks.', ref: 'https://kubernetes.io/docs/tasks/debug/debug-application/debug-service/' },
    { q: 'Which approach is the standard way to test whether a Service name resolves inside the cluster?', options: ['Run nslookup from a temporary Pod, e.g. kubectl run with busybox', 'Run nslookup on your laptop against the public DNS', 'Check kubectl get svc for a DNS column', 'Restart the kube-apiserver'], answer: 0, explain: 'Cluster DNS (CoreDNS) is only reachable from inside the cluster, so test from a <b>throwaway Pod</b>: <code>kubectl run --rm -it --image=busybox -- nslookup svc.ns.svc.cluster.local</code>. Public DNS does not know cluster names, kubectl get svc shows no resolution result, and restarting the API server is unrelated.', ref: 'https://kubernetes.io/docs/tasks/administer-cluster/dns-debugging-resolution/' },
    { q: 'In a kubeadm cluster, the kube-scheduler and kube-apiserver run as Pods in kube-system. How are they managed?', options: ['As a Deployment managed by the controller-manager', 'As a DaemonSet on every node', 'As static Pods created by the kubelet from manifests in /etc/kubernetes/manifests', 'As systemd services only, with no Pod representation'], answer: 2, explain: 'kubeadm runs control plane components as <b>static Pods</b>: the kubelet watches <code>/etc/kubernetes/manifests</code> and the API shows read-only mirror Pods. They are not Deployments or DaemonSets; only the kubelet (and the runtime) run as systemd services.', ref: 'https://kubernetes.io/docs/tasks/configure-pod-container/static-pod/' },
    { q: 'You need to inspect containers on a node while the API server is unavailable. Which tool do you use on the node?', options: ['kubectl get pods', 'kubeadm token list', 'helm status', 'crictl'], answer: 3, explain: '<b>crictl</b> talks directly to the CRI runtime (containerd, CRI-O) on the node, so it works even when the API server is down. kubectl needs the API server, kubeadm token list manages bootstrap tokens, and helm status reads release info through the API.', ref: 'https://kubernetes.io/docs/tasks/debug/debug-cluster/crictl/' },
    { q: 'Which TWO statements about <code>kubectl top</code> are true? (Select 2)', options: ['It requires metrics-server (or another Metrics API provider)', 'It shows actual CPU and memory usage of nodes or Pods', 'It shows the requests used by the scheduler', 'It reads data directly from etcd'], answer: [0, 1], explain: '<code>kubectl top</code> queries the <b>Metrics API</b> (usually metrics-server) for <b>live usage</b>. Scheduled requests are shown by <code>kubectl describe node</code>, and metrics are not stored in etcd.', ref: 'https://kubernetes.io/docs/tasks/debug/debug-cluster/resource-metrics-pipeline/' },
  ],
});
