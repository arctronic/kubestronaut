KS.registerChapter('kcna', {
  id: 'security',
  title: 'Security',
  subtitle: 'The 4Cs, authentication, RBAC, admission, Pod Security, Secrets, supply chain and runtime defence',
  icon: '🔐',
  minutes: 35,
  objectives: [
    'Describe the 4Cs of cloud native security and where each control belongs',
    'Explain how Kubernetes authenticates users and ServiceAccounts and authorizes them with RBAC',
    'Apply Pod Security Standards through Pod Security Admission and a hardened securityContext',
    'Know why Secrets need encryption at rest and which tools secure the supply chain and runtime',
  ],

  slides: [
    {
      kicker: 'Mental model',
      title: 'The 4Cs of cloud native security',
      blocks: [
        { type: 'cols', ratio: '1fr 1.1fr', cols: [
          [
            { type: 'layers', title: 'Outer layers protect inner ones', items: [
              { label: 'Cloud', sub: 'data centre, cloud account, network, IAM', color: 'blue' },
              { label: 'Cluster', sub: 'API server access, RBAC, etcd, admission, NetworkPolicy', color: 'purple' },
              { label: 'Container', sub: 'image provenance, vulnerabilities, least privilege', color: 'teal' },
              { label: 'Code', sub: 'your application: TLS, dependencies, input handling', color: 'green' },
            ] },
          ],
          [
            { type: 'bullets', items: [
              'Each layer builds on the security of the layer <b>outside</b> it. A perfect app is still exposed if the cloud account or cluster is compromised.',
              '<b>Defence in depth</b>: assume any one control can fail, so stack several.',
              'Cloud examples: restricting access to the control plane endpoint, node IAM roles, private networks.',
              'Code is the layer you control most directly and is often the biggest attack surface.',
            ] },
            { type: 'callout', kind: 'exam', title: 'Order', html: '<b>Cloud → Cluster → Container → Code</b>, from outermost to innermost.' },
          ],
        ] },
      ],
      tip: 'If asked which layer covers “scanning images for CVEs” the answer is <b>Container</b>; “RBAC and admission control” is <b>Cluster</b>; “static analysis of application dependencies” is <b>Code</b>.',
    },

    {
      kicker: 'Authentication',
      title: 'Who are you? Users, groups and ServiceAccounts',
      blocks: [
        { type: 'flip', items: [
          { front: '🙅 No User object', back: 'Kubernetes has no User or Group resource. Human identities come from <b>outside</b>: certificates, an OIDC identity provider, webhooks. The API server only sees a username and groups.' },
          { front: '📜 X.509 client certs', back: 'The certificate’s <b>CN</b> becomes the username and <b>O</b> fields become groups. Common for admins (kubeconfig). Hard to revoke, so keep them short-lived.' },
          { front: '🔑 OIDC tokens', back: 'Single sign-on through an identity provider (e.g. Dex, Keycloak, cloud IdPs). The API server validates the signed ID token and reads user and group claims.' },
          { front: '🤖 ServiceAccount', back: 'A namespaced API object: the identity for <b>workloads</b>. Username format: <code>system:serviceaccount:&lt;ns&gt;:&lt;name&gt;</code>. Each namespace gets a <code>default</code> ServiceAccount.' },
          { front: '🎫 Projected tokens', back: 'Pods get short-lived, audience-bound tokens from the <b>TokenRequest API</b>, mounted as a projected volume and rotated by the kubelet. Long-lived Secret-based tokens are no longer auto-created.' },
        ] },
        { type: 'code', lang: 'bash', title: 'ServiceAccount basics', code: `
kubectl create serviceaccount ci-bot -n shop
kubectl create token ci-bot -n shop --duration=1h
kubectl get pod web -o jsonpath='{.spec.serviceAccountName}'`, notes: { 1: 'ServiceAccounts are namespaced and managed through the API, unlike human users.', 2: 'Requests a short-lived token through the TokenRequest API.', 3: 'Pods without <code>serviceAccountName</code> run as the namespace’s <code>default</code> ServiceAccount. Set <code>automountServiceAccountToken: false</code> if the app never calls the API.' } },
      ],
      tip: 'Trap: “Create a User object with kubectl to add a new developer.” There is no such object. You issue a certificate or configure OIDC, then grant permissions with RBAC.',
    },

    {
      kicker: 'Authorization · interactive',
      title: 'How RBAC connects subjects to permissions',
      blocks: [
        { type: 'diagram', width: 900, height: 430,
          caption: 'Subjects are bound to roles; roles list verbs on resources. Press ▶ Play to evaluate requests.',
          nodes: [
            { id: 'jane', x: 30, y: 40, w: 160, h: 56, label: 'User: jane', icon: '👩‍💻', sub: 'from cert / OIDC', color: 'gray', info: 'A human identity asserted by an authenticator. Not a Kubernetes object: RBAC only references the name string.' },
            { id: 'sa', x: 30, y: 175, w: 160, h: 56, label: 'ServiceAccount', sub: 'shop:ci-bot', color: 'blue', info: 'Workload identity <code>system:serviceaccount:shop:ci-bot</code>. Used by Pods and CI jobs that call the API.' },
            { id: 'grp', x: 30, y: 315, w: 160, h: 56, label: 'Group: sre', icon: '👥', sub: 'from cert O / OIDC', color: 'gray', info: 'Groups come from the authenticator too. Binding to a group grants every member the role.' },
            { id: 'rb', x: 260, y: 60, w: 180, h: 56, label: 'RoleBinding', sub: 'read-pods · ns shop', color: 'purple', info: 'Namespaced. Grants the referenced role’s permissions <b>only inside namespace shop</b> to its subjects.' },
            { id: 'rb2', x: 260, y: 195, w: 180, h: 56, label: 'RoleBinding', sub: 'ci-view · ns shop', color: 'purple', info: 'A RoleBinding may reference a <b>ClusterRole</b>. The permissions are then limited to the binding’s namespace: a handy way to reuse one role definition across namespaces.' },
            { id: 'crb', x: 260, y: 330, w: 180, h: 56, label: 'ClusterRole-\nBinding', sub: 'sre-view', color: 'red', fs: 12.5, info: 'Cluster-wide. Grants the ClusterRole in <b>every</b> namespace (and for cluster-scoped resources). Use sparingly.' },
            { id: 'role', x: 510, y: 40, w: 170, h: 56, label: 'Role', sub: 'pod-reader · ns shop', color: 'teal', info: 'Namespaced list of rules: apiGroups + resources + verbs. Permissions are purely additive; there are no deny rules.' },
            { id: 'crole', x: 510, y: 260, w: 170, h: 56, label: 'ClusterRole', sub: 'view (built-in)', color: 'amber', info: 'Cluster-scoped role. Needed for cluster-scoped resources (nodes, PVs, namespaces) and for reuse. Built-ins include cluster-admin, admin, edit and view.' },
            { id: 'res1', x: 720, y: 35, w: 160, h: 66, label: 'pods in shop', sub: 'get · list · watch', color: 'green', info: 'The rule matches requests for these verbs on pods in namespace shop. Anything else (delete, create, other namespaces) is denied by default.' },
            { id: 'res2', x: 720, y: 255, w: 160, h: 66, label: 'read most objects', sub: 'scope set by binding', color: 'green', info: 'The view role allows read-only access to most namespaced objects (not Secrets). Where it applies depends on the binding that references it.' },
          ],
          edges: [
            { from: 'jane', to: 'rb', label: 'subject', color: 'gray' },
            { from: 'sa', to: 'rb', color: 'blue' },
            { from: 'sa', to: 'rb2', color: 'blue' },
            { from: 'grp', to: 'crb', label: 'subject', color: 'gray' },
            { from: 'rb', to: 'role', label: 'roleRef', color: 'purple' },
            { from: 'rb2', to: 'crole', label: 'only in shop', color: 'purple' },
            { from: 'crb', to: 'crole', label: 'roleRef', color: 'red' },
            { from: 'role', to: 'res1', color: 'teal' },
            { from: 'crole', to: 'res2', color: 'amber' },
          ],
          steps: [
            { on: ['jane'], text: 'Jane runs <code>kubectl get pods -n shop</code>. <b>Authentication</b> establishes the username <code>jane</code> (from her certificate or OIDC token).' },
            { on: ['jane', 'rb', 'jane>rb'], text: 'The <b>RBAC authorizer</b> looks for bindings whose <code>subjects</code> include jane. RoleBinding <b>read-pods</b> in namespace shop does.' },
            { on: ['rb', 'role', 'rb>role'], text: 'The binding’s <b>roleRef</b> points to Role <b>pod-reader</b> in the same namespace.' },
            { on: ['role', 'res1', 'role>res1'], text: 'A rule allows <code>get, list, watch</code> on <code>pods</code>. The request matches, so it is <b>allowed</b>.' },
            { on: ['res1'], text: 'Jane now tries <code>kubectl delete pod web -n shop</code>. No rule grants <code>delete</code>, so it is <b>denied</b>. RBAC is deny by default and only adds permissions.' },
            { on: ['sa', 'rb2', 'sa>rb2', 'rb2>crole', 'crole'], text: 'ServiceAccount <b>ci-bot</b> is bound through a <b>RoleBinding to a ClusterRole</b>: it gets the view permissions, but only inside namespace shop.' },
            { on: ['grp', 'crb', 'grp>crb', 'crb>crole', 'crole>res2', 'res2'], text: 'Group <b>sre</b> is bound with a <b>ClusterRoleBinding</b>, so its members can view objects in <b>every</b> namespace.' },
          ],
        },
      ],
      tip: 'The scope comes from the <b>binding</b>: RoleBinding = one namespace, ClusterRoleBinding = whole cluster. A ClusterRole says <i>what</i>, the binding says <i>where</i> and <i>to whom</i>.',
    },

    {
      kicker: 'RBAC objects',
      title: 'Roles, bindings, verbs and least privilege',
      blocks: [
        { type: 'compare', headers: ['Object', 'Scope', 'Contains', 'Typical use'], rows: [
          ['Role', 'Namespaced', 'Rules (apiGroups, resources, verbs)', 'Permissions inside one namespace'],
          ['ClusterRole', 'Cluster', 'Rules, including cluster-scoped resources and non-resource URLs', 'Nodes, PVs, namespaces; reusable roles'],
          ['RoleBinding', 'Namespaced', 'Subjects + roleRef (Role or ClusterRole)', 'Grant within one namespace'],
          ['ClusterRoleBinding', 'Cluster', 'Subjects + roleRef (ClusterRole)', 'Grant across all namespaces'],
        ] },
        { type: 'cols', cols: [
          [
            { type: 'bullets', items: [
              'Read verbs: <code>get</code>, <code>list</code>, <code>watch</code>. Write verbs: <code>create</code>, <code>update</code>, <code>patch</code>, <code>delete</code>, <code>deletecollection</code>.',
              'Sensitive verbs: <code>escalate</code>, <code>bind</code>, <code>impersonate</code>. Also treat <code>list</code> on Secrets as reading them.',
              '<b>Least privilege</b>: grant only the verbs and resources needed, prefer namespaced Roles, avoid wildcards and <code>cluster-admin</code>.',
              'Other authorizer modes: <b>Node</b> (for kubelets), Webhook, ABAC. Most clusters use <code>Node,RBAC</code>.',
            ] },
          ],
          [
            { type: 'code', lang: 'bash', title: 'kubectl auth can-i', code: `
kubectl auth can-i create deployments -n shop
kubectl auth can-i delete pods --as=jane -n shop
kubectl auth can-i list secrets --as=system:serviceaccount:shop:ci-bot -n shop
kubectl auth can-i --list -n shop`, notes: { 1: 'Answers <b>yes</b> or <b>no</b> for your current identity.', 2: '<code>--as</code> impersonates another user to test their permissions (you need the impersonate permission).', 3: 'ServiceAccount usernames use the <code>system:serviceaccount:ns:name</code> form.', 4: 'Lists everything you are allowed to do in the namespace.' } },
          ],
        ] },
      ],
      tip: '“Check whether a ServiceAccount may delete Pods without actually trying” → <code>kubectl auth can-i delete pods --as=system:serviceaccount:…</code>.',
    },

    {
      kicker: 'RBAC in YAML',
      title: 'A Role and its RoleBinding',
      blocks: [
        { type: 'code', lang: 'yaml', title: 'pod-reader.yaml', code: `
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: shop
rules:
- apiGroups: [""]
  resources: ["pods", "pods/log"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
  namespace: shop
subjects:
- kind: User
  name: jane
  apiGroup: rbac.authorization.k8s.io
- kind: ServiceAccount
  name: ci-bot
  namespace: shop
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io`, notes: { 1: 'RBAC objects live in the <code>rbac.authorization.k8s.io</code> API group.', 2: 'A <b>Role</b> is namespaced; use a ClusterRole for cluster-scoped resources.', 5: 'The Role only grants permissions in this namespace.', 7: '<code>""</code> means the <b>core</b> API group (Pods, Services, Secrets, ConfigMaps). Deployments would need <code>apps</code>.', 8: '<code>pods/log</code> is a <b>subresource</b>: reading logs needs its own permission (as does <code>pods/exec</code>).', 9: 'Only read verbs: least privilege.', 12: 'The binding connects subjects to exactly one role.', 17: 'A User subject is just a name string; nothing checks that “jane” exists.', 20: 'ServiceAccount subjects need a <code>namespace</code>.', 23: '<b>roleRef</b> cannot be changed after creation: delete and recreate the binding instead.', 24: 'Could also be <code>ClusterRole</code>, which would still be limited to namespace shop by this RoleBinding.' } },
        { type: 'callout', kind: 'trap', title: 'No deny rules', html: 'RBAC permissions are <b>purely additive</b>. You cannot write a rule that removes a permission granted by another binding; you have to remove that binding.' },
      ],
      tip: 'Imperative equivalents: <code>kubectl create role pod-reader --verb=get,list,watch --resource=pods -n shop</code> and <code>kubectl create rolebinding read-pods --role=pod-reader --user=jane -n shop</code>.',
    },

    {
      kicker: 'Admission & policy',
      title: 'Admission control and policy engines',
      blocks: [
        { type: 'flow', items: [
          { icon: '🪪', label: 'Authenticated', sub: 'identity known', info: 'The request has passed authentication.' },
          { icon: '🛂', label: 'Authorized', sub: 'RBAC said yes', info: 'RBAC only answers “may this user do this verb on this resource?”. It cannot inspect the object’s contents.' },
          { icon: '🧪', label: 'Mutating admission', sub: 'may change the object', info: 'Built-in plugins and mutating webhooks set defaults, inject sidecars, add labels.' },
          { icon: '✅', label: 'Validating admission', sub: 'accept or reject', info: 'Pod Security Admission, ResourceQuota, ValidatingAdmissionPolicy (CEL) and validating webhooks such as Gatekeeper and Kyverno.' },
          { icon: '🗄️', label: 'Stored in etcd', sub: 'object accepted', info: 'Only objects that pass every admission check are persisted.' },
        ], caption: 'Admission checks <b>what</b> you create, after RBAC checks <b>whether</b> you may create it.' },
        { type: 'cards', cols: 2, items: [
          { icon: '⚖️', color: 'purple', title: 'OPA Gatekeeper', text: 'Admission controller built on Open Policy Agent (a CNCF graduated project). Policies are written in <b>Rego</b> as ConstraintTemplates and Constraints. Can audit existing objects.' },
          { icon: '🛡️', color: 'teal', title: 'Kyverno', text: 'Kubernetes-native policy engine: policies are written as <b>YAML</b> resources. Can validate, <b>mutate</b>, generate resources and verify image signatures.' },
        ] },
        { type: 'callout', kind: 'tip', title: 'Typical policies', html: 'Require labels, block <code>:latest</code> tags, allow images only from a trusted registry, require resource limits, require signed images.' },
      ],
      tip: '“Enforce that every Deployment has an owner label” is not something RBAC can do. It is an <b>admission policy</b> (Gatekeeper, Kyverno or ValidatingAdmissionPolicy).',
    },

    {
      kicker: 'Pod security',
      title: 'Pod Security Standards and Pod Security Admission',
      blocks: [
        { type: 'compare', headers: ['Profile', 'Restrictiveness', 'Intended for'], rows: [
          ['Privileged', 'Unrestricted', 'System and infrastructure workloads (CNI agents, storage drivers)'],
          ['Baseline', 'Blocks known privilege escalations: no privileged containers, hostNetwork/hostPID/hostIPC, hostPath, extra capabilities', 'Most ordinary applications with minimal changes'],
          ['Restricted', 'Baseline plus hardening: must run as non-root, <code>allowPrivilegeEscalation: false</code>, drop ALL capabilities, seccomp RuntimeDefault', 'Security-critical apps; best practice'],
        ] },
        { type: 'cols', ratio: '1.2fr 1fr', cols: [
          [
            { type: 'code', lang: 'yaml', title: 'namespace labels', code: `
apiVersion: v1
kind: Namespace
metadata:
  name: shop
  labels:
    pod-security.kubernetes.io/enforce: baseline
    pod-security.kubernetes.io/enforce-version: latest
    pod-security.kubernetes.io/warn: restricted
    pod-security.kubernetes.io/audit: restricted`, notes: { 5: 'Pod Security Admission is configured with <b>labels on the namespace</b>, not on Pods.', 6: '<b>enforce</b>: Pods violating the profile are <b>rejected</b>.', 7: 'Pins the version of the standard used for checks.', 8: '<b>warn</b>: the request succeeds, but the user sees a warning.', 9: '<b>audit</b>: the request succeeds; the violation is recorded in the <b>audit log</b>.' } },
          ],
          [
            { type: 'callout', kind: 'exam', title: 'PSP is gone', html: '<b>PodSecurityPolicy</b> was deprecated and <b>removed in Kubernetes 1.25</b>. Its built-in replacement is <b>Pod Security Admission</b>, which enforces the Pod Security Standards.' },
            { type: 'callout', kind: 'tip', title: 'Rolling it out', html: 'Start with <code>warn</code> and <code>audit</code> at <i>restricted</i> to find violations, then switch <code>enforce</code> once workloads comply.' },
          ],
        ] },
      ],
      tip: 'Standards (what the rules are: Privileged, Baseline, Restricted) vs Admission (how they are applied: enforce, audit, warn). Expect questions on both names.',
    },

    {
      kicker: 'Workload hardening',
      title: 'A hardened securityContext',
      blocks: [
        { type: 'cols', ratio: '1.25fr 1fr', cols: [
          [
            { type: 'code', lang: 'yaml', title: 'hardened-pod.yaml', code: `
apiVersion: v1
kind: Pod
metadata:
  name: api
spec:
  automountServiceAccountToken: false
  securityContext:
    runAsNonRoot: true
    runAsUser: 10001
    fsGroup: 10001
    seccompProfile:
      type: RuntimeDefault
  containers:
  - name: api
    image: registry.example.com/api:1.4.2
    securityContext:
      allowPrivilegeEscalation: false
      privileged: false
      readOnlyRootFilesystem: true
      capabilities:
        drop: ["ALL"]
    volumeMounts:
    - name: tmp
      mountPath: /tmp
  volumes:
  - name: tmp
    emptyDir: {}`, notes: { 6: 'No API token in the Pod if the app never talks to the Kubernetes API: less to steal.', 7: '<b>Pod-level</b> securityContext: applies to all containers unless a container overrides it.', 8: 'The kubelet refuses to start a container whose image would run as UID 0.', 9: 'Explicit non-root UID.', 10: 'Group ownership applied to mounted volumes so the non-root user can write.', 11: 'Restricts the syscalls the container can make using the runtime’s default seccomp profile.', 15: 'Pin a specific version (better still, a <code>@sha256</code> digest), never <code>:latest</code>.', 16: '<b>Container-level</b> securityContext: capabilities and privilege settings live here.', 17: 'Blocks setuid binaries and similar tricks from gaining more privileges than the parent process.', 18: '<code>privileged: true</code> gives almost full access to the host. Never for application workloads.', 19: 'Attackers cannot modify binaries or drop tools into the container filesystem.', 21: 'Drop every Linux capability; add back only what is needed (e.g. <code>NET_BIND_SERVICE</code>).', 22: 'With a read-only root filesystem, give the app a writable scratch directory.' } },
          ],
          [
            { type: 'flip', items: [
              { front: 'runAsNonRoot', back: 'Container must not run as UID 0. Required by the Restricted profile.' },
              { front: 'allowPrivilegeEscalation: false', back: 'Process cannot gain more privileges than its parent (no setuid escalation). Required by Restricted.' },
              { front: 'capabilities.drop: [ALL]', back: 'Removes Linux capabilities such as NET_ADMIN or SYS_ADMIN. Required by Restricted.' },
              { front: 'readOnlyRootFilesystem', back: 'Strong best practice, but <b>not</b> required by the Restricted profile.' },
            ] },
          ],
        ] },
      ],
      tip: 'Host namespaces (<code>hostNetwork</code>, <code>hostPID</code>, <code>hostIPC</code>) and <code>hostPath</code> volumes are blocked from the <b>Baseline</b> profile upward: they break container isolation.',
    },

    {
      kicker: 'Secrets',
      title: 'Secrets: encoded is not encrypted',
      blocks: [
        { type: 'code', lang: 'bash', title: 'anyone who can read the object can read the value', code: `
kubectl create secret generic db --from-literal=password=S3cr3t -n shop
kubectl get secret db -n shop -o jsonpath='{.data.password}'
# UzNjcjN0
echo 'UzNjcjN0' | base64 -d
# S3cr3t`, notes: { 1: 'Creates an Opaque Secret. Types also include <code>kubernetes.io/tls</code> and <code>kubernetes.io/dockerconfigjson</code>.', 2: 'The <code>data</code> field holds values <b>base64-encoded</b>.', 4: 'Base64 is an encoding, not encryption: one command reverses it.' } },
        { type: 'cards', cols: 3, items: [
          { icon: '🗄️', color: 'amber', title: 'Encryption at rest', text: 'By default Secrets are stored in etcd unencrypted. Configure the API server with an <b>EncryptionConfiguration</b> (aescbc, aesgcm, secretbox or a <b>KMS</b> provider).' },
          { icon: '🔏', color: 'purple', title: 'Lock down access', text: 'RBAC: restrict <code>get</code>/<code>list</code>/<code>watch</code> on Secrets. Anyone who can create Pods in a namespace can mount its Secrets too.' },
          { icon: '🏦', color: 'teal', title: 'External managers', text: 'Keep the source of truth in HashiCorp Vault or a cloud secret manager and sync with the External Secrets Operator or the Secrets Store CSI Driver.' },
        ] },
        { type: 'callout', kind: 'warn', title: 'Git is not a vault', html: 'Never commit plain Secret manifests to Git. For GitOps use encrypted forms (Sealed Secrets, SOPS) or reference an external secret manager.' },
      ],
      tip: 'Exam wording: “Kubernetes Secrets are <b>encrypted by default</b>” is <b>false</b>. They are base64-encoded; encryption at rest must be enabled.',
    },

    {
      kicker: 'Zero trust',
      title: 'Network-level controls',
      blocks: [
        { type: 'text', html: '<b>Zero trust</b> means no traffic is trusted just because it originates inside the cluster. Every connection should be explicitly allowed and, ideally, authenticated.' },
        { type: 'cards', cols: 3, items: [
          { icon: '🧱', color: 'blue', title: 'NetworkPolicy', text: 'Start with <b>default-deny</b> per namespace, then allow only required flows. Enforced by the CNI (Calico, Cilium).' },
          { icon: '🔒', color: 'green', title: 'mTLS', text: 'A service mesh (Istio, Linkerd) encrypts and authenticates every service-to-service call with workload identities.' },
          { icon: '🚪', color: 'amber', title: 'Protect the API server', text: 'Restrict who can reach the control plane endpoint, keep anonymous auth off, use TLS everywhere, never expose etcd.' },
        ] },
        { type: 'check', q: 'A security team wants Pods in namespace <code>payments</code> to accept connections only from Pods in namespace <code>checkout</code>. Which resource should they use?', options: ['A RoleBinding in payments', 'A NetworkPolicy with a namespaceSelector', 'A Pod Security Admission label on payments', 'A ClusterRole that denies other namespaces'], answer: 1, explain: '<b>NetworkPolicy</b> controls network traffic; a <code>namespaceSelector</code> in an ingress rule allows only Pods from matching namespaces. RBAC governs API access, not packets, and has no deny rules. Pod Security Admission checks Pod specs, not traffic.', ref: 'https://kubernetes.io/docs/concepts/services-networking/network-policies/' },
      ],
      tip: 'Don’t confuse layers: RBAC protects the <b>API</b>, NetworkPolicy protects <b>Pod traffic</b>, Pod Security protects the <b>node from the Pod</b>.',
    },

    {
      kicker: 'Supply chain',
      title: 'Securing what you deploy',
      blocks: [
        { type: 'flow', items: [
          { icon: '📦', label: 'Build', sub: 'minimal base image', info: 'Use small or distroless base images, pin dependencies, build in CI rather than on laptops.' },
          { icon: '📋', label: 'SBOM', sub: 'list every component', info: 'A <b>Software Bill of Materials</b> (SPDX or CycloneDX format) lists every package in the image, so you can tell quickly whether a new CVE affects you.' },
          { icon: '🔍', label: 'Scan', sub: 'find known CVEs', info: 'Image scanners such as Trivy or Grype check packages against vulnerability databases in CI and in the registry.' },
          { icon: '✍️', label: 'Sign', sub: 'Sigstore cosign', info: '<b>cosign</b> (part of <b>Sigstore</b>) signs images and attaches attestations (SBOM, provenance). Keyless signing uses short-lived certificates and a public transparency log (Rekor).' },
          { icon: '🛂', label: 'Verify at admission', sub: 'only trusted images run', info: 'An admission policy (Kyverno, Gatekeeper with a verification provider, Sigstore policy-controller) rejects images that are unsigned or from untrusted registries.' },
        ] },
        { type: 'callout', kind: 'tip', title: 'Pin by digest', html: 'A tag like <code>:1.4.2</code> can be moved to a different image; a digest like <code>@sha256:…</code> cannot. Signatures are tied to digests.' },
      ],
      tip: 'Keyword map: “signing container images” → <b>Sigstore / cosign</b>; “list of all packages inside an image” → <b>SBOM</b>; “scan for CVEs” → an image scanner such as Trivy.',
    },

    {
      kicker: 'Runtime & audit',
      title: 'Detecting attacks and recording who did what',
      blocks: [
        { type: 'cols', cols: [
          [
            { type: 'cards', cols: 1, items: [
              { icon: '🦅', color: 'red', title: 'Falco (runtime security)', text: 'CNCF graduated project that watches kernel <b>syscalls</b> (via eBPF) and raises alerts on suspicious behaviour: a shell spawned in a container, writes to <code>/etc</code>, unexpected network connections, reading sensitive files.' },
            ] },
            { type: 'callout', kind: 'info', title: 'Detect vs prevent', html: 'Falco <b>detects</b> and alerts at runtime. Admission control and Pod Security <b>prevent</b> bad objects from being created in the first place.' },
          ],
          [
            { type: 'compare', headers: ['Audit level', 'What is logged'], rows: [
              ['None', 'Nothing for matching requests'],
              ['Metadata', 'User, verb, resource, timestamp; no bodies'],
              ['Request', 'Metadata + request body'],
              ['RequestResponse', 'Metadata + request and response bodies'],
            ] },
            { type: 'text', html: '<b>Audit logging</b> is configured on the <b>kube-apiserver</b> with an audit policy file and a log or webhook backend. It answers “who did what, when, to which object?”.' },
          ],
        ] },
      ],
      tip: 'Log Secrets at the <b>Metadata</b> level only, otherwise the audit log itself leaks secret values.',
    },

    {
      kicker: 'Practice',
      title: 'Match the threat to the control',
      blocks: [
        { type: 'match', pairs: [
          ['Developer can delete Pods in prod', 'RBAC (Role + RoleBinding)'],
          ['Pod requests privileged: true', 'Pod Security Admission (enforce)'],
          ['Image pulled from an unknown registry', 'Kyverno / OPA Gatekeeper policy'],
          ['Unsigned image deployed', 'Sigstore cosign verification'],
          ['Shell opened inside a running container', 'Falco'],
          ['Need to know who deleted a Deployment', 'API server audit log'],
          ['Secret values readable in etcd backup', 'Encryption at rest (KMS)'],
        ] },
        { type: 'check', q: 'Which statement about RBAC is correct?', options: ['A ClusterRoleBinding can grant permissions only within a single namespace', 'A RoleBinding can reference a ClusterRole to grant its permissions within one namespace', 'A Role can include a rule that denies a verb granted elsewhere', 'Roles are attached directly to Pods through the Pod spec'], answer: 1, explain: 'A <b>RoleBinding referencing a ClusterRole</b> grants that role’s permissions only in the binding’s namespace. ClusterRoleBindings are cluster-wide, RBAC has no deny rules, and Pods get permissions through their <b>ServiceAccount</b>, not by attaching roles.', ref: 'https://kubernetes.io/docs/reference/access-authn-authz/rbac/' },
      ],
    },
  ],

  summary: [
    'The <b>4Cs</b>: Cloud → Cluster → Container → Code; each layer depends on the one outside it.',
    'Kubernetes has <b>no User objects</b>: humans authenticate with certificates or OIDC; workloads use namespaced <b>ServiceAccounts</b> with short-lived projected tokens.',
    '<b>RBAC</b>: Role/ClusterRole say <i>what</i> (verbs on resources), RoleBinding/ClusterRoleBinding say <i>who</i> and <i>where</i>. Additive only, no deny. Test with <code>kubectl auth can-i</code>.',
    'Admission control runs after RBAC; policy engines <b>OPA Gatekeeper</b> (Rego) and <b>Kyverno</b> (YAML) enforce custom rules.',
    '<b>Pod Security Standards</b> (Privileged, Baseline, Restricted) are applied by <b>Pod Security Admission</b> via namespace labels in <b>enforce / audit / warn</b> modes. PSP was removed in 1.25.',
    'Harden Pods: <code>runAsNonRoot</code>, <code>allowPrivilegeEscalation: false</code>, drop ALL capabilities, <code>readOnlyRootFilesystem</code>, no <code>privileged</code>.',
    'Secrets are <b>base64, not encrypted</b>: enable encryption at rest (KMS) or use external managers. Supply chain: <b>SBOMs</b>, scanning, <b>cosign</b> signing. Runtime: <b>Falco</b>. Accountability: <b>audit logs</b>.',
  ],

  glossary: [
    { term: '4Cs', def: 'Cloud, Cluster, Container, Code: the layered model of cloud native security.' },
    { term: 'ServiceAccount', def: 'Namespaced identity for processes in Pods; username system:serviceaccount:NAMESPACE:NAME.' },
    { term: 'Projected token', def: 'Short-lived, audience-bound ServiceAccount token from the TokenRequest API, mounted into Pods and rotated by the kubelet.' },
    { term: 'OIDC', def: 'OpenID Connect: lets the API server trust ID tokens from an external identity provider for user login.' },
    { term: 'RBAC', def: 'Role-Based Access Control: authorizes API requests using Roles/ClusterRoles bound to subjects.' },
    { term: 'RoleBinding', def: 'Grants a Role or ClusterRole to subjects within one namespace.' },
    { term: 'ClusterRoleBinding', def: 'Grants a ClusterRole to subjects across the entire cluster.' },
    { term: 'Admission controller', def: 'Plugin or webhook that mutates or validates objects after authentication and authorization, before they are stored.' },
    { term: 'Pod Security Standards', def: 'Three profiles of Pod hardening rules: Privileged, Baseline and Restricted.' },
    { term: 'Pod Security Admission', def: 'Built-in admission controller that applies Pod Security Standards per namespace in enforce, audit or warn mode; replaced PodSecurityPolicy.' },
    { term: 'securityContext', def: 'Pod- or container-level settings for user IDs, privileges, capabilities, seccomp and filesystem access.' },
    { term: 'Encryption at rest', def: 'API server configuration (EncryptionConfiguration, e.g. KMS) that encrypts Secrets before they are written to etcd.' },
    { term: 'OPA Gatekeeper', def: 'Admission controller using Open Policy Agent and Rego policies to enforce custom rules.' },
    { term: 'Kyverno', def: 'Kubernetes-native policy engine with YAML policies that validate, mutate and generate resources and verify images.' },
    { term: 'SBOM', def: 'Software Bill of Materials: inventory of all components in an artifact (SPDX, CycloneDX).' },
    { term: 'Falco', def: 'CNCF graduated runtime security tool that detects suspicious behaviour from kernel syscalls.' },
  ],

  quiz: [
    { q: 'In the 4Cs model of cloud native security, which layer is the outermost?', options: ['Code', 'Container', 'Cloud', 'Cluster'], answer: 2, explain: 'The order from outside in is <b>Cloud → Cluster → Container → Code</b>. Each inner layer relies on the security of the layers around it, so Code is the innermost.', ref: 'https://kubernetes.io/docs/concepts/security/cloud-native-security/' },
    { q: 'An administrator wants to add a new developer to the cluster. Which statement is correct?', options: ['Run <code>kubectl create user</code> to create a User object', 'Add the user to the <code>kube-system</code> namespace', 'Create a ServiceAccount for each human user, since that is the only supported identity', 'Kubernetes has no User object; identities come from certificates or an identity provider and are then authorized with RBAC'], answer: 3, explain: 'Human users are <b>not API objects</b>. They are authenticated externally (X.509 certificates, OIDC) and granted rights with RBAC. ServiceAccounts are meant for workloads, and namespaces do not contain users.', ref: 'https://kubernetes.io/docs/reference/access-authn-authz/authentication/' },
    { q: 'Which object grants the permissions of a Role to a user within a namespace?', options: ['ClusterRole', 'NetworkPolicy', 'ServiceAccount', 'RoleBinding'], answer: 3, explain: 'A <b>RoleBinding</b> links subjects to a Role (or ClusterRole) in its namespace. A ClusterRole only defines permissions, a ServiceAccount is a subject, and NetworkPolicy controls traffic, not API access.', ref: 'https://kubernetes.io/docs/reference/access-authn-authz/rbac/' },
    { q: 'What does <code>kubectl auth can-i list secrets --as=system:serviceaccount:dev:builder -n dev</code> do?', options: ['Checks whether the builder ServiceAccount is allowed to list Secrets in namespace dev', 'Grants the builder ServiceAccount permission to list Secrets', 'Lists all Secrets the builder ServiceAccount has created', 'Creates a token for the builder ServiceAccount'], answer: 0, explain: '<code>kubectl auth can-i</code> only <b>checks</b> authorization and prints yes or no; <code>--as</code> impersonates the ServiceAccount. It grants nothing, lists nothing and creates no tokens (that would be <code>kubectl create token</code>).', ref: 'https://kubernetes.io/docs/reference/kubectl/generated/kubectl_auth/kubectl_auth_can-i/' },
    { q: 'Which TWO statements about RBAC are true? (Select 2)', options: ['Permissions are additive; there are no deny rules', 'A ClusterRole can be referenced by a RoleBinding to grant permissions in one namespace', 'A Role can grant access to Nodes and PersistentVolumes', 'RBAC can reject a Pod that does not set runAsNonRoot'], answer: [0, 1], explain: 'RBAC is <b>allow-only</b>, and a <b>RoleBinding can reference a ClusterRole</b> to scope it to one namespace. Roles are namespaced and cannot cover cluster-scoped resources like Nodes or PVs. Inspecting Pod spec fields is the job of admission control (Pod Security Admission), not RBAC.', ref: 'https://kubernetes.io/docs/reference/access-authn-authz/rbac/' },
    { q: 'Which feature replaced PodSecurityPolicy, which was removed in Kubernetes 1.25?', options: ['Pod Security Admission', 'NetworkPolicy', 'OPA Gatekeeper', 'RuntimeClass'], answer: 0, explain: 'The built-in replacement is <b>Pod Security Admission</b>, enforcing the Pod Security Standards. Gatekeeper is a third-party policy engine that can do similar things, but it is not the built-in successor. NetworkPolicy and RuntimeClass address other concerns.', ref: 'https://kubernetes.io/docs/concepts/security/pod-security-admission/' },
    { q: 'A namespace has the label <code>pod-security.kubernetes.io/warn: restricted</code> and no other Pod Security labels. A user creates a Pod that runs as root. What happens?', options: ['The Pod is rejected', 'The Pod is created and the user sees a warning', 'The Pod is created and silently mutated to run as non-root', 'The Pod is created and the namespace is relabelled'], answer: 1, explain: 'In <b>warn</b> mode the request succeeds but returns a warning to the client. Rejection happens only in <b>enforce</b> mode, <b>audit</b> mode records the violation in the audit log, and Pod Security Admission never mutates Pods.', ref: 'https://kubernetes.io/docs/concepts/security/pod-security-admission/' },
    { q: 'Which Pod Security Standards profile is designed for system workloads, such as CNI agents, that need host-level access?', options: ['Privileged', 'Baseline', 'Restricted', 'Default'], answer: 0, explain: '<b>Privileged</b> is the unrestricted profile for trusted infrastructure workloads. Baseline blocks known privilege escalations, Restricted adds hardening on top, and there is no “Default” profile.', ref: 'https://kubernetes.io/docs/concepts/security/pod-security-standards/' },
    { q: 'Which securityContext setting prevents a process from gaining more privileges than its parent, for example through setuid binaries?', options: ['<code>readOnlyRootFilesystem: true</code>', '<code>runAsNonRoot: true</code>', '<code>allowPrivilegeEscalation: false</code>', '<code>privileged: false</code>'], answer: 2, explain: '<b>allowPrivilegeEscalation: false</b> sets the no_new_privs flag so child processes cannot gain extra privileges. readOnlyRootFilesystem stops filesystem writes, runAsNonRoot blocks UID 0, and privileged: false only avoids host-level access.', ref: 'https://kubernetes.io/docs/tasks/configure-pod-container/security-context/' },
    { q: 'A colleague says Kubernetes Secrets are safe to store in a public Git repository because they are encrypted. What is wrong with this claim?', options: ['Secrets are encrypted, but only with a weak algorithm', 'Secrets are automatically rotated, so old values in Git are harmless', 'Secrets cannot be stored as YAML at all', 'Secret values are only base64-encoded, which anyone can decode'], answer: 3, explain: 'Secret <code>data</code> is <b>base64-encoded, not encrypted</b>. Encryption at rest in etcd must be configured separately and does not protect manifests in Git. Secrets are not rotated automatically.', ref: 'https://kubernetes.io/docs/concepts/configuration/secret/' },
    { q: 'Which TWO tools are mainly used to secure the software supply chain before workloads run? (Select 2)', options: ['Sigstore cosign for signing container images', 'Falco for detecting shells spawned in containers', 'SBOMs that list every component in an image', 'CoreDNS for resolving registry hostnames'], answer: [0, 2], explain: '<b>cosign</b> signs and verifies images, and an <b>SBOM</b> records what is inside them; both protect the supply chain. Falco is <b>runtime</b> detection after the workload is running, and CoreDNS is cluster DNS.', ref: ['https://kubernetes.io/docs/concepts/security/cloud-native-security/', 'https://docs.sigstore.dev/'] },
    { q: 'Which CNCF project detects suspicious runtime behaviour, such as a shell being opened inside a container, by observing system calls?', options: ['Kyverno', 'OPA Gatekeeper', 'Falco', 'Linkerd'], answer: 2, explain: '<b>Falco</b> watches kernel syscalls and alerts on rule matches at runtime. Kyverno and Gatekeeper are admission-time policy engines that act when objects are created, and Linkerd is a service mesh.', ref: 'https://falco.org/docs/' },
  ],
});
