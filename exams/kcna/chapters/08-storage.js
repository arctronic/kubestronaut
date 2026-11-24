KS.registerChapter('kcna', {
  id: 'storage',
  title: 'Storage',
  subtitle: 'Volumes, PersistentVolumes, StorageClasses and CSI: how data outlives a Pod',
  icon: '💾',
  minutes: 30,
  objectives: [
    'Tell ephemeral volumes (emptyDir, configMap, secret, downwardAPI) apart from persistent storage',
    'Explain how a PersistentVolumeClaim binds to a PersistentVolume, statically or through a StorageClass',
    'Pick the right access mode, reclaim policy and volumeBindingMode for a scenario',
    'Describe why storage drivers moved out of tree to CSI, and what VolumeSnapshots and volumeClaimTemplates add',
  ],

  slides: [
    {
      kicker: 'Why it matters',
      title: 'Containers forget everything: ephemeral vs persistent data',
      blocks: [
        { type: 'text', html: 'A container’s writable layer lives only as long as that container. When it crashes and the kubelet restarts it, files written inside are <b>gone</b>. Kubernetes solves this with <b>volumes</b>: directories mounted into containers whose lifetime is decoupled from the container, and sometimes from the Pod as well.' },
        { type: 'cards', items: [
          { icon: '📄', color: 'gray', title: 'Container filesystem', text: 'Lost on every container restart. Never store data you need here.' },
          { icon: '⏳', color: 'amber', title: 'Ephemeral volume', text: 'Survives container restarts, deleted together with the Pod. emptyDir, configMap, secret, downwardAPI, projected.' },
          { icon: '🗄️', color: 'green', title: 'Persistent volume', text: 'Lives independently of any Pod. Requested through a PersistentVolumeClaim and backed by real storage (cloud disk, NFS, Ceph…).' },
        ] },
        { type: 'callout', kind: 'exam', title: 'The one-line rule', html: 'Volume lifetime ≥ container lifetime. <b>Ephemeral</b> volumes die with the <b>Pod</b>; <b>persistent</b> volumes survive Pod deletion and rescheduling to another node.' },
      ],
      tip: '“A container restarts and its data must still be there, but it is fine to lose it when the Pod is deleted”: that is <b>emptyDir</b>. “Data must survive the Pod”: that is a <b>PersistentVolumeClaim</b>.',
    },

    {
      kicker: 'Volume types',
      title: 'The volume types you must recognise: flip to reveal',
      blocks: [
        { type: 'flip', items: [
          { front: '📂 emptyDir', back: 'Empty directory created when the Pod lands on a node, shared by all containers in the Pod, deleted when the Pod is removed. Scratch space, caches, sidecar hand-off.' },
          { front: '🖥️ hostPath', back: 'Mounts a file or directory from the <b>node’s</b> filesystem. Ties the Pod to that node’s data and is a security risk. Mostly for system agents.' },
          { front: '⚙️ configMap', back: 'Projects ConfigMap keys as files. Non-secret configuration such as nginx.conf.' },
          { front: '🔑 secret', back: 'Projects Secret keys as files on a tmpfs (RAM-backed) mount, so they are never written to the node’s disk.' },
          { front: '🧩 projected', back: 'Combines several sources (secret, configMap, downwardAPI, serviceAccountToken) into <b>one</b> directory.' },
          { front: '🪞 downwardAPI', back: 'Exposes the Pod’s own metadata (name, namespace, labels, annotations, resource limits) as files.' },
          { front: '📎 persistentVolumeClaim', back: 'Mounts durable storage by referencing a PVC by name. The Pod never names the PV or the disk directly.' },
          { front: '🌱 ephemeral (generic)', back: 'A PVC template inside the Pod spec: a StorageClass provisions a volume for the Pod and it is deleted with the Pod. Persistent-volume features, ephemeral lifetime.' },
        ] },
      ],
      tip: 'Mounting a Secret as a volume uses <b>tmpfs</b>; that is the reason it does not land on the node’s disk. It is still not encrypted in etcd unless you configure encryption at rest.',
    },

    {
      kicker: 'Node-local volumes',
      title: 'emptyDir (incl. Memory) and the dangers of hostPath',
      blocks: [
        { type: 'cols', ratio: '1.2fr 1fr', cols: [
          [
            { type: 'code', lang: 'yaml', title: 'pod-volumes.yaml', code: `
apiVersion: v1
kind: Pod
metadata:
  name: worker
spec:
  containers:
  - name: app
    image: busybox:1.36
    command: ["sh", "-c", "sleep 3600"]
    volumeMounts:
    - name: scratch
      mountPath: /cache
    - name: logs
      mountPath: /host/var/log
      readOnly: true
  volumes:
  - name: scratch
    emptyDir:
      medium: Memory
      sizeLimit: 256Mi
  - name: logs
    hostPath:
      path: /var/log
      type: Directory`, notes: {
              10: '<b>volumeMounts</b> live on the container: which volume, mounted where. The same volume can be mounted by several containers.',
              15: 'Mount read-only whenever the container only needs to read. Cheap defence in depth.',
              16: '<b>volumes</b> live on the Pod spec: they define what the storage is.',
              18: 'emptyDir: starts empty, survives container restarts, deleted with the Pod.',
              19: '<code>medium: Memory</code> mounts a <b>tmpfs</b> (RAM). Very fast, but what you write counts against the container’s <b>memory limit</b> and vanishes on node reboot.',
              20: '<code>sizeLimit</code> caps usage; if exceeded, the kubelet evicts the Pod.',
              22: 'hostPath exposes the node’s own filesystem to the container.',
              24: '<code>type</code> adds a check, e.g. Directory, DirectoryOrCreate, File, Socket.',
            } },
          ],
          [
            { type: 'callout', kind: 'warn', title: 'Why hostPath is risky', html: '<ul><li>A writable mount of <code>/</code>, <code>/etc</code> or the runtime socket is an easy path to <b>node takeover</b>.</li><li>Data stays on <b>one node</b>: rescheduled Pods find a different (empty) directory.</li><li>The <b>Baseline</b> and <b>Restricted</b> Pod Security Standards disallow hostPath.</li></ul>' },
            { type: 'compare', headers: ['', 'emptyDir', 'hostPath'], rows: [
              ['Lifetime', 'The Pod', 'The node'],
              ['Shared with', 'Containers in the Pod', 'Anything on the node'],
              ['Typical use', 'Scratch, cache, sidecars', 'Node agents (log shippers, CNI)'],
              ['Safe for apps?', 'Yes', 'Avoid'],
            ] },
          ],
        ] },
      ],
      tip: 'Exam wording “a temporary in-memory scratch directory shared by two containers in the same Pod” = <b>emptyDir with medium: Memory</b>.',
    },

    {
      kicker: 'Config as files',
      title: 'configMap, secret, projected and downwardAPI volumes',
      blocks: [
        { type: 'cols', cols: [
          [
            { type: 'code', lang: 'yaml', title: 'volumes section', code: `
volumes:
- name: config
  configMap:
    name: web-config
- name: creds
  secret:
    secretName: db-password
- name: bundle
  projected:
    sources:
    - secret:
        name: db-password
    - configMap:
        name: web-config
    - serviceAccountToken:
        path: token
        expirationSeconds: 3600
- name: podinfo
  downwardAPI:
    items:
    - path: labels
      fieldRef:
        fieldPath: metadata.labels`, notes: {
              3: 'Each key in the ConfigMap becomes a file named after the key.',
              7: 'Note the field name: <code>secretName</code> for a secret volume, <code>name</code> for configMap.',
              9: '<b>projected</b>: several sources merged into one mount point.',
              15: 'A short-lived, audience-bound ServiceAccount token that the kubelet rotates automatically.',
              19: 'downwardAPI: the Pod learns about itself without calling the API server.',
            } },
          ],
          [
            { type: 'compare', headers: ['', 'Env variable', 'Volume file'], rows: [
              ['Updates when ConfigMap/Secret changes?', 'No, only on container restart', 'Yes, eventually (kubelet sync)'],
              ['Exception', 'n/a', 'Not when mounted with <code>subPath</code>'],
              ['Good for', 'Simple flags, small values', 'Config files, certificates'],
            ] },
            { type: 'callout', kind: 'trap', title: 'Classic distractor', html: '“Changing a ConfigMap automatically updates the environment variables of running Pods.” <b>False.</b> Env vars are read once at container start. Mounted files are refreshed; env vars are not.' },
          ],
        ] },
      ],
      tip: 'If a question mentions mounting a Secret, a ConfigMap and a ServiceAccount token <b>into the same directory</b>, the answer is a <b>projected</b> volume.',
    },

    {
      kicker: 'Persistent storage model',
      title: 'PV, PVC and StorageClass: who owns what',
      blocks: [
        { type: 'compare', headers: ['Object', 'Scope', 'Created by', 'Describes'], rows: [
          ['PersistentVolume (PV)', 'Cluster-scoped', 'Admin (static) or a provisioner (dynamic)', 'An actual piece of storage: size, access modes, reclaim policy, backend details'],
          ['PersistentVolumeClaim (PVC)', 'Namespaced', 'Developer / app', 'A request: “I need 10Gi, ReadWriteOnce, class fast-ssd”'],
          ['StorageClass', 'Cluster-scoped', 'Admin', 'A template for creating PVs on demand: provisioner + parameters + policies'],
        ] },
        { type: 'bullets', items: [
          'The control plane <b>binds</b> a PVC to a PV that satisfies its size, access modes and class. Binding is <b>one-to-one</b> and exclusive: a bound PV cannot be claimed by another PVC.',
          'A PVC may be bound to a <b>larger</b> PV than requested (asking 5Gi may bind a 10Gi PV); it is never bound to a smaller one.',
          'No matching PV and no way to provision one? The PVC stays <b>Pending</b>, and so does any Pod that uses it.',
          'Pods reference the <b>PVC</b>, never the PV. That decouples app manifests from the storage implementation.',
          '<b>Storage object in use protection</b>: a PVC used by a Pod, or a bound PV, is not removed until it is no longer in use (finalizers).',
        ] },
      ],
      tip: 'The analogy: <b>PV is to PVC as Node is to Pod</b>. Pods consume node resources; PVCs consume PV resources.',
    },

    {
      kicker: 'Dynamic provisioning · interactive',
      title: 'From a PVC to a mounted disk',
      blocks: [
        { type: 'diagram', width: 900, height: 390,
          caption: 'Press ▶ Play to follow a Pod requesting storage from a StorageClass backed by a CSI driver. Click any box for details.',
          groups: [
            { x: 20, y: 35, w: 400, h: 120, label: 'Namespace: shop', color: 'blue' },
            { x: 20, y: 205, w: 400, h: 165, label: 'Worker node', color: 'green' },
            { x: 440, y: 35, w: 200, h: 335, label: 'Cluster-scoped', color: 'purple' },
            { x: 660, y: 35, w: 220, h: 335, label: 'Storage side', color: 'teal' },
          ],
          nodes: [
            { id: 'pod', x: 40, y: 75, w: 160, h: 60, label: 'Pod', icon: '🫛', sub: 'claimName: data', color: 'blue', round: true, info: 'The Pod lists a volume of type <code>persistentVolumeClaim</code> with <code>claimName: data</code>. It does not know (or care) which disk will back it.' },
            { id: 'pvc', x: 240, y: 75, w: 160, h: 60, label: 'PVC: data', sub: '10Gi · RWO', color: 'blue', info: 'Namespaced request for storage: size, access mode and <code>storageClassName: fast-ssd</code>. Status starts as <b>Pending</b>.' },
            { id: 'sc', x: 460, y: 75, w: 160, h: 60, label: 'StorageClass', sub: 'fast-ssd', color: 'purple', info: 'Names the <b>provisioner</b> (a CSI driver), its <b>parameters</b> (disk type, IOPS…), the <b>reclaimPolicy</b> for new PVs, <b>volumeBindingMode</b> and <b>allowVolumeExpansion</b>.' },
            { id: 'prov', x: 680, y: 75, w: 180, h: 60, label: 'CSI controller', sub: 'external-provisioner', color: 'teal', info: 'The controller part of the CSI driver, usually a Deployment. Sidecars like <b>external-provisioner</b>, <b>external-attacher</b>, <b>external-resizer</b> and <b>external-snapshotter</b> watch Kubernetes objects and call the driver over gRPC.' },
            { id: 'disk', x: 680, y: 190, w: 180, h: 56, label: 'Storage backend', icon: '🧱', sub: 'cloud disk / SAN', color: 'amber', info: 'The real storage: a cloud block disk, an NFS share, a Ceph pool… Kubernetes never talks to it directly, only through the driver.' },
            { id: 'pv', x: 460, y: 285, w: 160, h: 60, label: 'PersistentVolume', sub: 'pvc-7f3c…', color: 'purple', info: 'Created automatically by the provisioner. Carries the capacity, access modes, the class’s reclaimPolicy and a <code>claimRef</code> pointing to the PVC.' },
            { id: 'kubelet', x: 40, y: 250, w: 160, h: 60, label: 'kubelet', icon: '🤖', color: 'green', info: 'Before starting containers, the kubelet waits until all volumes are attached and mounted. Stuck mounts show up as a Pod in <b>ContainerCreating</b> with FailedMount events.' },
            { id: 'node', x: 240, y: 250, w: 160, h: 60, label: 'CSI node plugin', sub: 'DaemonSet', color: 'teal', info: 'Runs on every node (DaemonSet). Implements NodeStage/NodePublish: formats if needed and mounts the attached device into the Pod’s volume directory.' },
          ],
          edges: [
            { from: 'pod', to: 'pvc', label: 'claims', color: 'blue' },
            { from: 'pvc', to: 'sc', label: 'storageClassName', color: 'purple' },
            { from: 'sc', to: 'prov', label: 'provisioner', color: 'teal' },
            { from: 'prov', to: 'disk', label: 'CreateVolume', color: 'amber' },
            { from: 'prov', to: 'pv', label: 'creates', color: 'purple', bend: 40 },
            { from: 'pv', to: 'pvc', label: 'bind', color: 'green', both: true },
            { from: 'kubelet', to: 'node', label: 'mount', color: 'green' },
            { from: 'node', to: 'disk', label: 'attach + mount', color: 'amber', dashed: true },
            { from: 'node', to: 'pod', label: 'mounted', color: 'blue', dashed: true },
          ],
          steps: [
            { on: ['pod', 'pvc', 'pod>pvc'], text: 'The <b>Pod</b> references a <b>PVC</b> named <code>data</code> asking for 10Gi, ReadWriteOnce, class <code>fast-ssd</code>. No PV exists yet, so the PVC is <b>Pending</b>.' },
            { on: ['pvc', 'sc', 'pvc>sc'], text: 'The PVC’s <code>storageClassName</code> points to a <b>StorageClass</b>. With <code>WaitForFirstConsumer</code>, nothing happens until the scheduler has placed the Pod, so the disk is created in the right zone.' },
            { on: ['sc', 'prov', 'sc>prov'], text: 'The class names a <b>provisioner</b>, a CSI driver. Its <b>external-provisioner</b> sidecar notices a PVC for its class and takes over.' },
            { on: ['prov', 'disk', 'prov>disk'], text: 'The driver calls the backend (<b>CreateVolume</b>): a real disk is created with the class’s parameters (type, IOPS, encryption…).' },
            { on: ['prov', 'pv', 'prov>pv'], text: 'A <b>PersistentVolume</b> object representing that disk is created, inheriting the class’s <b>reclaimPolicy</b> (Delete by default).' },
            { on: ['pv', 'pvc', 'pv>pvc'], text: 'The PV and the PVC are <b>bound</b> one-to-one. Both now show status <b>Bound</b>.' },
            { on: ['kubelet', 'node', 'kubelet>node', 'node>disk', 'disk'], text: 'On the chosen node the volume is <b>attached</b> and the <b>CSI node plugin</b> mounts it. Until this finishes the Pod shows <i>ContainerCreating</i>.' },
            { on: ['node', 'pod', 'node>pod'], text: 'The kubelet starts the containers with the volume at its <code>mountPath</code>. The Pod is <b>Running</b> and its data now outlives the Pod.' },
          ],
        },
      ],
      tip: 'Exam order to memorise: <b>Pod → PVC → StorageClass → provisioner (CSI) → PV → bind → attach/mount</b>. Without a StorageClass the admin must create PVs by hand (static provisioning).',
    },

    {
      kicker: 'StorageClass',
      title: 'Dynamic provisioning and the default StorageClass',
      blocks: [
        { type: 'cols', ratio: '1.2fr 1fr', cols: [
          [
            { type: 'code', lang: 'yaml', title: 'storageclass.yaml + pvc.yaml', code: `
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
  annotations:
    storageclass.kubernetes.io/is-default-class: "true"
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: data
  namespace: shop
spec:
  storageClassName: fast-ssd
  accessModes: ["ReadWriteOnce"]
  resources:
    requests:
      storage: 10Gi`, notes: {
              1: 'StorageClass lives in the <code>storage.k8s.io/v1</code> API group and is <b>cluster-scoped</b>.',
              6: 'Marks this as the <b>default</b> class. PVCs that omit <code>storageClassName</code> get it. Only one class should carry it.',
              7: '<b>provisioner</b>: which volume plugin / CSI driver creates the volumes.',
              8: '<b>parameters</b> are opaque to Kubernetes and passed to the driver.',
              10: 'Applied to every PV this class creates. Defaults to <b>Delete</b> if omitted.',
              11: 'Default is <code>Immediate</code>. WaitForFirstConsumer delays binding until a Pod is scheduled.',
              12: 'Allows growing PVCs later by editing <code>spec.resources.requests.storage</code>.',
              20: 'Pick the class explicitly. Omit the field to use the default class.',
              21: 'Access modes requested; must be supported by the driver.',
            } },
          ],
          [
            { type: 'callout', kind: 'trap', title: 'Omitted vs empty string', html: '<code>storageClassName</code> <b>omitted</b> → the default StorageClass is used.<br><code>storageClassName: ""</code> → dynamic provisioning is <b>disabled</b>; the PVC only binds to a pre-created PV with no class.' },
            { type: 'compare', headers: ['Provisioning', 'Who creates the PV?'], rows: [
              ['Static', 'An admin writes PV objects in advance'],
              ['Dynamic', 'The StorageClass’s provisioner, on demand for each PVC'],
            ] },
            { type: 'code', lang: 'bash', title: 'inspect', code: `
kubectl get storageclass     # (default) marks the default
kubectl get pvc -n shop      # STATUS: Pending / Bound
kubectl get pv               # cluster-wide, no -n
kubectl describe pvc data -n shop`, notes: { 3: 'PVs are cluster-scoped, so a namespace flag does nothing for them.', 4: 'The Events section explains a Pending PVC (no class, provisioner errors, waiting for first consumer).' } },
          ],
        ] },
      ],
      tip: 'A “default StorageClass” is just an <b>annotation</b> on a StorageClass. Managed clusters (EKS, GKE, AKS) usually ship one, which is why PVCs “just work” there.',
    },

    {
      kicker: 'Access modes',
      title: 'RWO, ROX, RWX and RWOP',
      blocks: [
        { type: 'compare', headers: ['Mode', 'Short', 'Meaning', 'Typical backend'], rows: [
          ['ReadWriteOnce', 'RWO', 'Read-write by a single <b>node</b> (several Pods on that node can share it)', 'Block storage: cloud disks, iSCSI'],
          ['ReadOnlyMany', 'ROX', 'Read-only by many nodes', 'NFS, CephFS, pre-populated data'],
          ['ReadWriteMany', 'RWX', 'Read-write by many nodes at once', 'File storage: NFS, CephFS, cloud file shares'],
          ['ReadWriteOncePod', 'RWOP', 'Read-write by a single <b>Pod</b> in the whole cluster', 'CSI volumes only'],
        ] },
        { type: 'callout', kind: 'trap', title: 'Node, not Pod', html: 'ReadWriteOnce restricts the volume to <b>one node</b>, not one Pod. Two Pods scheduled on the same node can both mount an RWO volume. If you need exactly one Pod, use <b>ReadWriteOncePod</b>.' },
        { type: 'check', q: 'A Deployment with 3 replicas spread across 3 nodes must write to the same shared directory. Which access mode does the PVC need?', options: ['ReadWriteOnce', 'ReadWriteMany', 'ReadOnlyMany', 'ReadWriteOncePod'], answer: 1, explain: 'Several nodes writing at the same time requires <b>ReadWriteMany</b>, usually a file system such as NFS or CephFS. RWO limits writes to a single node, ROX is read-only, and RWOP allows only one Pod.' },
      ],
      tip: 'Block devices (a typical cloud disk) generally support only <b>RWO/RWOP</b>. If a question needs RWX, look for a <b>file</b> storage answer (NFS, CephFS, a cloud file service).',
    },

    {
      kicker: 'Lifecycle',
      title: 'PV phases and reclaim policies',
      blocks: [
        { type: 'flow', items: [
          { icon: '🟢', label: 'Available', sub: 'free, not yet bound', info: 'A static PV waiting for a matching PVC.' },
          { icon: '🔗', label: 'Bound', sub: 'claimed by a PVC', info: 'Exclusive one-to-one binding with a PVC. Pods use it through the PVC.' },
          { icon: '🗑️', label: 'PVC deleted', sub: 'claim released', info: 'The user deletes the PVC. What happens next depends on <code>persistentVolumeReclaimPolicy</code>.' },
          { icon: '🟡', label: 'Released', sub: 'Retain: data kept', info: 'With <b>Retain</b>, the PV stays with its data but is not available for a new claim until an admin cleans it up (or removes the claimRef) manually.' },
          { icon: '❌', label: 'Deleted / Failed', sub: 'Delete: disk removed', info: 'With <b>Delete</b>, the PV object and the backing disk are removed. <b>Failed</b> means automatic reclamation did not succeed.' },
        ], caption: 'Click Step ▶ or any box.' },
        { type: 'compare', headers: ['Reclaim policy', 'When the PVC is deleted', 'Default for'], rows: [
          ['Retain', 'PV becomes <b>Released</b>; data and disk kept for manual recovery', 'Manually created PVs'],
          ['Delete', 'PV <b>and</b> the backing storage are deleted', 'Dynamically provisioned PVs (StorageClass default)'],
          ['Recycle', 'Basic scrub (<code>rm -rf</code>) and reuse. <b>Deprecated</b>: use dynamic provisioning instead', 'Nothing; avoid'],
        ] },
      ],
      tip: 'Production databases on dynamic storage? Set <code>reclaimPolicy: Retain</code> on the class (or patch the PV) so an accidental <code>kubectl delete pvc</code> does not destroy the disk.',
    },

    {
      kicker: 'Scheduling & growth',
      title: 'WaitForFirstConsumer and volume expansion',
      blocks: [
        { type: 'cols', cols: [
          [
            { type: 'cards', cols: 1, items: [
              { icon: '⚡', color: 'gray', title: 'volumeBindingMode: Immediate', text: 'Default. The PV is provisioned and bound as soon as the PVC is created, before any Pod is scheduled. Risk: the disk lands in zone A, then the Pod cannot be scheduled because its CPU/affinity needs point to zone B.' },
              { icon: '⏸️', color: 'green', title: 'volumeBindingMode: WaitForFirstConsumer', text: 'Binding and provisioning wait until a Pod using the PVC is <b>scheduled</b>. The scheduler picks a node first, the volume is created in that node’s topology (zone). The PVC shows <i>Pending: waiting for first consumer</i>, which is normal.' },
            ] },
          ],
          [
            { type: 'bullets', items: [
              '<b>Expansion</b>: if the class has <code>allowVolumeExpansion: true</code>, edit the PVC’s <code>spec.resources.requests.storage</code> to a larger value.',
              'The CSI driver (external-resizer) grows the volume; the file system is resized, online for many drivers.',
              'Volumes can only <b>grow</b>. Shrinking a PVC is not supported.',
              'Expanding is a PVC edit, not a PV edit and not a new StorageClass.',
            ] },
            { type: 'check', q: 'Pods using zonal cloud disks keep failing to schedule because their PV was created in a different zone. Which StorageClass setting fixes this?', options: ['reclaimPolicy: Retain', 'allowVolumeExpansion: true', 'volumeBindingMode: WaitForFirstConsumer', 'accessModes: ReadWriteMany'], answer: 2, explain: '<b>WaitForFirstConsumer</b> delays provisioning until the Pod is scheduled, so the disk is created in the zone of the chosen node. Reclaim policy and expansion do not influence placement, and accessModes is not a StorageClass field.' },
          ],
        ] },
      ],
      tip: 'A PVC that is <b>Pending</b> with “waiting for first consumer to be created before binding” is not broken. It binds as soon as a Pod that uses it is scheduled.',
    },

    {
      kicker: 'Container Storage Interface',
      title: 'CSI: why storage drivers left the Kubernetes tree',
      blocks: [
        { type: 'cols', ratio: '1fr 1fr', cols: [
          [
            { type: 'text', html: 'Originally, drivers for AWS EBS, GCE PD, Azure Disk, Cinder and others were compiled <b>into</b> Kubernetes (“in-tree”). Every bug fix waited for a Kubernetes release, vendors had to contribute to core, and the code grew huge. The <b>Container Storage Interface</b> is a standard gRPC API so that storage vendors ship <b>out-of-tree</b> drivers independently.' },
            { type: 'bullets', items: [
              'Same idea as <b>CRI</b> (runtimes) and <b>CNI</b> (networking): a plugin interface, not built-in code.',
              'In-tree drivers have been migrated to CSI (<b>CSI migration</b>): old PV specs are transparently handled by the matching CSI driver.',
              'A CSI driver is <b>not portable by itself</b>: install the driver for your backend, then reference it in a StorageClass.',
            ] },
          ],
          [
            { type: 'layers', title: 'A typical CSI driver', items: [
              { label: 'StorageClass / PVC / VolumeSnapshot', sub: 'Kubernetes API objects', color: 'purple' },
              { label: 'CSI sidecars', sub: 'external-provisioner, -attacher, -resizer, -snapshotter', color: 'blue' },
              { label: 'Controller plugin', sub: 'Deployment: create/delete/attach/snapshot', color: 'teal' },
              { label: 'Node plugin', sub: 'DaemonSet: mount/unmount on each node', color: 'green' },
              { label: 'Storage backend', sub: 'cloud disk, SAN, Ceph, NFS…', color: 'amber' },
            ] },
          ],
        ] },
      ],
      tip: 'Match the acronyms: <b>CRI</b> = runtime, <b>CNI</b> = networking, <b>CSI</b> = storage. “Lets vendors develop storage plugins without changing Kubernetes core code” = CSI.',
    },

    {
      kicker: 'Stateful apps & backups',
      title: 'volumeClaimTemplates and VolumeSnapshots',
      blocks: [
        { type: 'cols', ratio: '1.1fr 1fr', cols: [
          [
            { type: 'code', lang: 'yaml', title: 'statefulset (excerpt) + snapshot', code: `
kind: StatefulSet
metadata:
  name: db
spec:
  serviceName: db
  replicas: 3
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: fast-ssd
      resources:
        requests:
          storage: 20Gi
---
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshot
metadata:
  name: data-db-0-nightly
spec:
  volumeSnapshotClassName: csi-snapclass
  source:
    persistentVolumeClaimName: data-db-0`, notes: {
              7: '<b>volumeClaimTemplates</b>: one PVC per replica, named <code>&lt;template&gt;-&lt;statefulset&gt;-&lt;ordinal&gt;</code>: data-db-0, data-db-1, data-db-2.',
              6: 'Scaling down does <b>not</b> delete the PVCs by default, so scaling back up reattaches the same data. Configurable with <code>persistentVolumeClaimRetentionPolicy</code>.',
              17: 'VolumeSnapshot is a CRD (<code>snapshot.storage.k8s.io</code>) served by the snapshot controller, not part of the core API group.',
              22: 'Like a StorageClass, a <b>VolumeSnapshotClass</b> names the CSI driver and deletion policy.',
              24: 'A point-in-time copy of this PVC. Restore by creating a new PVC with <code>dataSource</code> pointing to the snapshot.',
            } },
          ],
          [
            { type: 'compare', headers: ['Snapshot object', 'Analogous to'], rows: [
              ['VolumeSnapshot', 'PVC (namespaced request)'],
              ['VolumeSnapshotContent', 'PV (the actual snapshot)'],
              ['VolumeSnapshotClass', 'StorageClass'],
            ] },
            { type: 'callout', kind: 'info', title: 'Requirements', html: 'Snapshots work only with a <b>CSI driver that supports them</b>, plus the snapshot CRDs and snapshot controller installed in the cluster. In-tree and hostPath volumes cannot be snapshotted this way.' },
          ],
        ] },
      ],
      tip: 'Why does every StatefulSet replica keep “its own” data after rescheduling? Because each ordinal gets a <b>stable PVC</b> from volumeClaimTemplates, and the Pod with the same name always reattaches to it.',
    },

    {
      kicker: 'Ecosystem & practice',
      title: 'Cloud native storage projects, then match the terms',
      blocks: [
        { type: 'cards', items: [
          { icon: '♜', color: 'purple', title: 'Rook', text: 'CNCF <b>graduated</b> storage orchestrator. Runs <b>Ceph</b> on Kubernetes via an operator, offering block, file and object storage.' },
          { icon: '🐂', color: 'teal', title: 'Longhorn', text: 'CNCF project (originated at Rancher): lightweight distributed <b>block</b> storage built from the nodes’ local disks, with replicas, snapshots and backups.' },
          { icon: '🐙', color: 'gray', title: 'Ceph', text: 'Distributed storage system (block, file, object). Not a CNCF project itself; Rook is how you run it cloud-natively.' },
        ] },
        { type: 'match', pairs: [
          ['emptyDir', 'Scratch space deleted with the Pod'],
          ['hostPath', 'Mounts a directory from the node'],
          ['PersistentVolumeClaim', 'Namespaced request for storage'],
          ['StorageClass', 'Template for dynamic provisioning'],
          ['ReadWriteOncePod', 'Only one Pod may mount it read-write'],
          ['Retain', 'Keeps the disk after the claim is deleted'],
        ] },
      ],
      tip: 'Trap: <b>Rook</b> is the CNCF project; <b>Ceph</b> is the storage system it orchestrates. “Which CNCF graduated project provides storage orchestration for Kubernetes?” → Rook.',
    },
  ],

  summary: [
    'Container filesystems are lost on restart. <b>Ephemeral volumes</b> (emptyDir, configMap, secret, downwardAPI, projected) live as long as the Pod; <b>persistent volumes</b> outlive it.',
    '<b>emptyDir</b> with <code>medium: Memory</code> is a tmpfs counted against memory limits. <b>hostPath</b> exposes the node’s filesystem and is disallowed by Baseline/Restricted Pod Security.',
    '<b>PV</b> (cluster-scoped, actual storage) binds one-to-one to a <b>PVC</b> (namespaced request). A <b>StorageClass</b> lets a provisioner create PVs dynamically; the default class is set by an annotation.',
    'Access modes: <b>RWO</b> one node, <b>ROX</b> many nodes read-only, <b>RWX</b> many nodes read-write, <b>RWOP</b> one Pod.',
    'Reclaim policies: <b>Delete</b> (dynamic default), <b>Retain</b> (manual cleanup, PV becomes Released); <b>Recycle</b> is deprecated.',
    '<b>WaitForFirstConsumer</b> provisions in the scheduled node’s zone; <code>allowVolumeExpansion</code> lets PVCs grow but never shrink.',
    '<b>CSI</b> moved drivers out of tree. StatefulSet <b>volumeClaimTemplates</b> give each replica its own PVC; <b>VolumeSnapshots</b> need a CSI driver. Rook (graduated) runs Ceph; Longhorn provides distributed block storage.',
  ],

  glossary: [
    { term: 'Volume', def: 'A directory mounted into one or more containers of a Pod, whose lifetime is independent of the container.' },
    { term: 'emptyDir', def: 'Ephemeral volume created empty when a Pod starts on a node and deleted with the Pod; can be RAM-backed with medium: Memory.' },
    { term: 'hostPath', def: 'Volume that mounts a file or directory from the host node’s filesystem; powerful and risky.' },
    { term: 'projected volume', def: 'Volume that merges several sources (secret, configMap, downwardAPI, serviceAccountToken) into one directory.' },
    { term: 'downwardAPI', def: 'Mechanism exposing a Pod’s own metadata and resource fields to its containers as env vars or files.' },
    { term: 'PersistentVolume (PV)', def: 'Cluster-scoped object representing a piece of provisioned storage with capacity, access modes and reclaim policy.' },
    { term: 'PersistentVolumeClaim (PVC)', def: 'Namespaced request for storage by a user; binds one-to-one to a suitable PV.' },
    { term: 'StorageClass', def: 'Cluster-scoped template naming a provisioner and parameters, used to create PVs dynamically.' },
    { term: 'Dynamic provisioning', def: 'Automatic creation of a PV (and backing storage) when a PVC requests a StorageClass.' },
    { term: 'Access mode', def: 'How a volume can be mounted: ReadWriteOnce, ReadOnlyMany, ReadWriteMany, ReadWriteOncePod.' },
    { term: 'Reclaim policy', def: 'What happens to a PV when its claim is deleted: Retain, Delete (Recycle is deprecated).' },
    { term: 'WaitForFirstConsumer', def: 'volumeBindingMode that delays binding and provisioning until a Pod using the PVC is scheduled.' },
    { term: 'CSI', def: 'Container Storage Interface: standard API that lets storage vendors ship out-of-tree drivers for Kubernetes.' },
    { term: 'volumeClaimTemplates', def: 'StatefulSet field that creates a dedicated PVC for each replica (e.g. data-db-0).' },
    { term: 'VolumeSnapshot', def: 'Namespaced request for a point-in-time copy of a PVC, fulfilled by a CSI driver via a VolumeSnapshotClass.' },
    { term: 'Rook', def: 'CNCF graduated project that runs and manages Ceph storage on Kubernetes using an operator.' },
  ],

  quiz: [
    { q: 'Two containers in the same Pod need a shared scratch directory that survives container restarts but can be discarded when the Pod is deleted. Which volume type fits best?', options: ['hostPath', 'emptyDir', 'PersistentVolumeClaim', 'configMap'], answer: 1, explain: '<b>emptyDir</b> is created with the Pod, shared by its containers, survives container restarts and is deleted with the Pod. hostPath would tie data to a node and is risky; a PVC is overkill for throwaway data; configMap volumes are for configuration, not writable scratch space.' },
    { q: 'What is the effect of setting <code>medium: Memory</code> on an emptyDir volume?', options: ['The volume is stored in etcd', 'The volume persists across Pod deletions', 'The volume is replicated to every node', 'The volume is backed by tmpfs (RAM) and its usage counts toward the container’s memory limit'], answer: 3, explain: 'A Memory-backed emptyDir is a <b>tmpfs</b>: fast, cleared on node reboot, and charged to the container’s memory. Nothing about it is persistent, stored in etcd or replicated.' },
    { q: 'Which statement about PersistentVolumes and PersistentVolumeClaims is correct?', options: ['PVs are namespaced and PVCs are cluster-scoped', 'One PV can be bound to several PVCs at the same time', 'A PVC binds one-to-one to a PV that satisfies its size and access modes', 'Pods reference PVs directly by name'], answer: 2, explain: 'Binding is <b>exclusive and one-to-one</b>. PVs are cluster-scoped and PVCs are namespaced (not the other way around), and Pods reference the <b>PVC</b>, never the PV.' },
    { q: 'A PVC omits the <code>storageClassName</code> field entirely. What happens in a cluster that has a default StorageClass?', options: ['The PVC is rejected by the API server', 'The PVC only binds to statically created PVs with no class', 'The default StorageClass is applied and a PV is provisioned dynamically', 'The PVC uses hostPath storage'], answer: 2, explain: 'Omitting the field means “use the <b>default class</b>” (the one annotated <code>storageclass.kubernetes.io/is-default-class</code>). Setting it to the empty string <code>""</code> is what disables dynamic provisioning and restricts binding to class-less PVs.' },
    { q: 'Which access mode allows a volume to be mounted read-write by exactly one Pod in the whole cluster?', options: ['ReadWriteOnce', 'ReadOnlyMany', 'ReadWriteMany', 'ReadWriteOncePod'], answer: 3, explain: '<b>ReadWriteOncePod</b> (CSI only) restricts the volume to a single Pod. ReadWriteOnce restricts it to a single <i>node</i>, so several Pods on that node could still share it.' },
    { q: 'A dynamically provisioned PV has the default reclaim policy. What happens when its PVC is deleted?', options: ['The PV becomes Released and the data is kept', 'The PV and its backing storage are deleted', 'The volume is scrubbed with rm -rf and made Available again', 'The PV is rebound to the next pending PVC'], answer: 1, explain: 'StorageClasses default to <b>Delete</b>, so the PV and the disk are removed. Keeping the data as Released is <b>Retain</b>; scrubbing and reuse was <b>Recycle</b>, which is deprecated.' },
    { q: 'Which TWO settings belong in a StorageClass? (Select 2)', options: ['provisioner', 'accessModes', 'volumeBindingMode', 'claimName'], answer: [0, 2], explain: 'A StorageClass defines <b>provisioner</b>, parameters, reclaimPolicy, <b>volumeBindingMode</b> and allowVolumeExpansion. <code>accessModes</code> is requested on the PVC (and declared on PVs), and <code>claimName</code> is how a Pod volume references a PVC.' },
    { q: 'Why was the Container Storage Interface (CSI) introduced?', options: ['To let storage vendors develop and release drivers outside the Kubernetes core code', 'To give Pods IP addresses on a flat network', 'To encrypt Secrets stored in etcd', 'To replace the kubelet’s container runtime'], answer: 0, explain: 'CSI moved storage drivers <b>out of tree</b>, so vendors ship and fix drivers on their own schedule. Pod networking is CNI, runtimes are CRI, and etcd encryption is an API server feature.' },
    { q: 'A StatefulSet named <code>web</code> has 2 replicas and a volumeClaimTemplate named <code>www</code>. Which PVCs exist?', options: ['www-0 and www-1', 'web-www-0 and web-www-1', 'www-web-0 and www-web-1', 'A single PVC named www shared by both Pods'], answer: 2, explain: 'PVCs are named <b>&lt;template&gt;-&lt;statefulset&gt;-&lt;ordinal&gt;</b>, giving www-web-0 and www-web-1. Each replica gets its own PVC; they are not shared.' },
    { q: 'An application needs more space. Its StorageClass has <code>allowVolumeExpansion: true</code>. What should you do?', options: ['Edit the PVC and increase spec.resources.requests.storage', 'Create a new StorageClass with a larger size', 'Edit the StorageClass parameters', 'Delete and recreate the PV with a bigger capacity'], answer: 0, explain: 'Expansion is triggered by <b>editing the PVC’s requested size</b>; the CSI driver resizes the volume. StorageClasses hold no size, and recreating PVs would risk losing data. Volumes can only grow, never shrink.' },
    { q: 'Which TWO volume types expose data to a container without needing any PersistentVolume? (Select 2)', options: ['downwardAPI', 'A volumeClaimTemplate', 'projected', 'A VolumeSnapshot'], answer: [0, 2], explain: '<b>downwardAPI</b> and <b>projected</b> are ephemeral volume types filled by the kubelet. volumeClaimTemplates create PVCs (and thus PVs), and a VolumeSnapshot is a copy of a PVC, not a mountable volume type.' },
    { q: 'Which CNCF graduated project runs the Ceph storage system on Kubernetes using an operator?', options: ['Longhorn', 'Vitess', 'Rook', 'etcd'], answer: 2, explain: '<b>Rook</b> is the CNCF graduated storage orchestrator for Ceph. Longhorn is distributed block storage from Rancher, Vitess is a MySQL sharding system, and etcd is the cluster key-value store.' },
  ],
});
