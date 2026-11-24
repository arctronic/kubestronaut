KS.registerChapter('kcna', {
  id: 'delivery',
  title: 'Application Delivery',
  subtitle: 'CI/CD, GitOps with Argo CD and Flux, Helm, Kustomize and deployment strategies',
  icon: '🚚',
  minutes: 30,
  objectives: [
    'Distinguish continuous integration, continuous delivery and continuous deployment',
    'State the four OpenGitOps principles and explain pull-based reconciliation with Argo CD or Flux',
    'Choose between Helm and Kustomize and recognise their core commands',
    'Compare Recreate, RollingUpdate, blue/green, canary, A/B and shadow releases and name progressive delivery tools',
  ],

  slides: [
    {
      kicker: 'Vocabulary',
      title: 'CI, continuous delivery, continuous deployment',
      blocks: [
        { type: 'text', html: 'Cloud native teams ship small changes often. Three terms describe how far the automation goes, and the exam likes to test the difference between the two “CDs”.' },
        { type: 'cards', items: [
          { icon: '🧪', color: 'blue', title: 'Continuous Integration (CI)', text: 'Every commit is merged to a shared branch, then <b>built and tested automatically</b>. The output is a tested artifact, e.g. a container image.' },
          { icon: '📦', color: 'amber', title: 'Continuous Delivery', text: 'Every change that passes the pipeline is <b>ready to release</b>. Going to production still needs a <b>manual approval</b> (a button, a PR merge).' },
          { icon: '🚀', color: 'green', title: 'Continuous Deployment', text: 'Every change that passes the pipeline goes to production <b>automatically</b>, with no human gate.' },
        ] },
        { type: 'compare', headers: ['', 'Continuous delivery', 'Continuous deployment'], rows: [
          ['Release to prod', 'Manual decision', 'Automatic'],
          ['Always releasable?', 'Yes', 'Yes'],
          ['Needs strong automated tests', 'Yes', 'Even more so: tests are the only gate'],
        ] },
      ],
      tip: 'Key word “manual approval before production” = continuous <b>delivery</b>. “Every passing commit reaches production automatically” = continuous <b>deployment</b>.',
    },

    {
      kicker: 'Pipelines',
      title: 'Stages of a typical container pipeline',
      blocks: [
        { type: 'flow', items: [
          { icon: '✍️', label: 'Commit', sub: 'push / pull request', info: 'A push or pull request to the source repository triggers the pipeline through a webhook.' },
          { icon: '🔨', label: 'Build', sub: 'compile + image', info: 'Compile the code and build an OCI image (Dockerfile, Buildpacks, Kaniko, BuildKit).' },
          { icon: '🧪', label: 'Test', sub: 'unit, integration', info: 'Automated tests and linters. A failure stops the pipeline: fail fast, fix fast.' },
          { icon: '🛡️', label: 'Scan & sign', sub: 'CVEs, SBOM', info: 'Scan the image for known vulnerabilities (e.g. Trivy), generate an SBOM, sign the image (e.g. Sigstore cosign).' },
          { icon: '📤', label: 'Push', sub: 'to a registry', info: 'Push the image with an <b>immutable tag</b> (version or git SHA) to a registry such as Harbor, Docker Hub, GHCR or a cloud registry.' },
          { icon: '🚢', label: 'Deploy', sub: 'push or GitOps pull', info: 'Either the pipeline runs <code>kubectl</code>/<code>helm</code> against the cluster (push), or it updates a config repo that a GitOps agent pulls.' },
          { icon: '✅', label: 'Verify', sub: 'health, metrics', info: 'Check rollout status, smoke tests and metrics; roll back if they look bad.' },
        ], caption: 'Click Step ▶ or any stage.' },
        { type: 'cards', cols: 3, items: [
          { icon: '🐱', color: 'purple', title: 'Tekton', text: 'Kubernetes-native CI/CD building blocks: <b>Tasks</b> and <b>Pipelines</b> are CRDs, and each step runs in a Pod. A CD Foundation project.' },
          { icon: '🐙', color: 'gray', title: 'GitHub Actions', text: 'Workflows as YAML in <code>.github/workflows/</code>, triggered by repository events, run on hosted or self-hosted runners.' },
          { icon: '🤵', color: 'red', title: 'Jenkins', text: 'Long-standing CI server driven by a <code>Jenkinsfile</code> and a large plugin ecosystem. Also a CD Foundation project.' },
        ] },
      ],
      tip: 'If an option says “runs pipeline steps as Pods using CRDs such as Task and Pipeline”, the answer is <b>Tekton</b>.',
    },

    {
      kicker: 'Build once, deploy many',
      title: 'Immutable image tags',
      blocks: [
        { type: 'cols', ratio: '1.2fr 1fr', cols: [
          [
            { type: 'code', lang: 'yaml', title: 'pin what you deploy', code: `
containers:
- name: web
  image: nginx:latest
- name: api
  image: ghcr.io/acme/api:1.8.2
- name: worker
  image: ghcr.io/acme/worker:3f9c2ab
- name: pinned
  image: ghcr.io/acme/web@sha256:4b1e...`, notes: { 3: '<b>Avoid</b>: <code>latest</code> is a moving pointer. Two nodes may run different code, and a rollback to “latest” goes nowhere. It also defaults <code>imagePullPolicy</code> to <code>Always</code>.', 5: 'A semantic version tag: readable and traceable to a release.', 7: 'A git commit SHA tag: ties the image to the exact source commit that built it.', 9: 'A <b>digest</b> identifies the content itself. It can never point to different bytes, which is the strongest guarantee.' } },
          ],
          [
            { type: 'bullets', items: [
              '<b>Build once</b>: the same image moves from dev to staging to prod; only configuration changes.',
              'A tag is <b>mutable</b> unless the registry enforces immutability; a digest never is.',
              'Changing the image reference in the Pod template is what triggers a Deployment rollout, so a new version needs a new tag.',
            ] },
            { type: 'callout', kind: 'trap', title: 'Rollback trap', html: 'If you overwrite <code>:v1</code> with new code, <code>kubectl rollout undo</code> “restores” the old spec but nodes may pull the new bytes. Never reuse tags.' },
          ],
        ] },
      ],
      tip: 'Exam phrasing: “ensure every environment runs exactly the same image” → reference it by <b>digest</b> or by an immutable version tag, never <code>latest</code>.',
    },

    {
      kicker: 'GitOps',
      title: 'The four OpenGitOps principles',
      blocks: [
        { type: 'text', html: '<b>GitOps</b> manages infrastructure and applications by keeping the desired state in Git and letting an agent inside the cluster make reality match it. The CNCF OpenGitOps project (from the GitOps Working Group) defines four principles. Flip each card.' },
        { type: 'flip', items: [
          { front: '1 · 📝 Declarative', back: 'The desired state of the whole system is expressed <b>declaratively</b> (YAML manifests, Helm charts, Kustomize overlays), not as scripts of steps.' },
          { front: '2 · 🔒 Versioned and immutable', back: 'Desired state is stored in a way that keeps <b>complete version history</b> and is immutable. Git gives you history, review, audit and easy revert.' },
          { front: '3 · ⬇️ Pulled automatically', back: 'Software agents <b>pull</b> the desired state from the source automatically. CI does not need cluster credentials.' },
          { front: '4 · 🔁 Continuously reconciled', back: 'Agents <b>continuously observe</b> the actual state and attempt to apply the desired state, correcting drift.' },
        ] },
        { type: 'callout', kind: 'exam', title: 'Memorise the four words', html: '<b>Declarative · Versioned &amp; immutable · Pulled automatically · Continuously reconciled.</b> A distractor such as “imperative scripts” or “pushed by CI” breaks a principle.' },
      ],
      tip: 'Rollback in GitOps is a <code>git revert</code>: the agent sees the old desired state and reconciles back to it.',
    },

    {
      kicker: 'GitOps · interactive',
      title: 'From commit to running Pods with GitOps',
      blocks: [
        { type: 'diagram', width: 900, height: 400,
          caption: 'Press ▶ Play to follow one change from a developer commit to the cluster.',
          groups: [
            { x: 470, y: 170, w: 410, h: 215, label: 'Kubernetes cluster', color: 'blue' },
          ],
          nodes: [
            { id: 'dev', x: 20, y: 60, w: 130, h: 56, label: 'Developer', icon: '👩‍💻', color: 'gray', info: 'Writes code and opens a pull request. Never runs <code>kubectl apply</code> against production in a GitOps setup.' },
            { id: 'app', x: 190, y: 60, w: 150, h: 56, label: 'App repo', sub: 'source code', color: 'purple', info: 'Holds application source and the Dockerfile. Many teams keep manifests in a <b>separate config repo</b> so app commits and deployment changes have separate history and access rules.' },
            { id: 'ci', x: 380, y: 60, w: 150, h: 56, label: 'CI pipeline', icon: '🔨', color: 'amber', info: 'Builds, tests, scans and pushes the image, then updates the config repo (commit or PR) with the new immutable tag. It needs <b>no cluster credentials</b>.' },
            { id: 'reg', x: 600, y: 60, w: 160, h: 56, label: 'Image registry', icon: '🗃️', color: 'pink', info: 'Stores the built image, e.g. <code>ghcr.io/acme/web:1.4.1</code>. Harbor is a CNCF graduated registry.' },
            { id: 'cfg', x: 190, y: 250, w: 170, h: 60, label: 'Config repo', sub: 'manifests / charts', color: 'green', info: 'The <b>single source of truth</b> for desired state: YAML, Helm values or Kustomize overlays per environment. Every change is a reviewed, versioned commit.' },
            { id: 'agent', x: 495, y: 210, w: 170, h: 60, label: 'Argo CD / Flux', icon: '🔁', sub: 'GitOps agent', color: 'teal', info: 'Runs <b>inside</b> the cluster. Polls or receives webhooks from the config repo, renders manifests, compares them with the live state and applies the difference.' },
            { id: 'api', x: 700, y: 210, w: 160, h: 60, label: 'kube-apiserver', color: 'blue', info: 'Receives the applied objects. From here the normal controllers, scheduler and kubelets take over.' },
            { id: 'pods', x: 600, y: 310, w: 170, h: 56, label: 'Deployment\nPods v1.4.1', color: 'blue', fs: 12.5, info: 'The Deployment rolls out new Pods; kubelets pull the new image from the registry.' },
          ],
          edges: [
            { from: 'dev', to: 'app', label: 'git push', color: 'gray' },
            { from: 'app', to: 'ci', label: 'webhook', color: 'purple' },
            { from: 'ci', to: 'reg', label: 'push image', color: 'pink' },
            { from: 'ci', to: 'cfg', label: 'bump tag', color: 'amber' },
            { from: 'agent', to: 'cfg', label: 'pull / watch', dashed: true, color: 'teal' },
            { from: 'agent', to: 'api', label: 'apply diff', color: 'teal' },
            { from: 'api', to: 'pods', color: 'blue' },
            { from: 'pods', to: 'reg', label: 'pull image', dashed: true, color: 'pink', bend: -60 },
          ],
          steps: [
            { on: ['dev', 'app', 'dev>app'], text: 'A developer <b>commits</b> a code change and pushes it (usually through a reviewed pull request).' },
            { on: ['app', 'ci', 'app>ci', 'ci>reg', 'reg'], text: '<b>CI builds</b> and tests the code, then <b>pushes an image</b> with an immutable tag such as <code>1.4.1</code> or the git SHA.' },
            { on: ['ci', 'cfg', 'ci>cfg'], text: 'CI (or an image-update bot) <b>updates the config repo</b>: the image tag in the manifest or Helm values changes. Git now holds the new desired state.' },
            { on: ['agent', 'cfg', 'agent>cfg'], text: '<b>Argo CD or Flux pulls</b> the config repo from inside the cluster and notices the desired state changed (status: <i>OutOfSync</i>).' },
            { on: ['agent', 'api', 'agent>api', 'api', 'pods', 'api>pods', 'pods>reg'], text: 'The agent <b>reconciles</b>: it applies the difference, the Deployment rolls out, and kubelets pull the new image.' },
            { on: ['agent', 'api', 'agent>api'], text: 'The loop never stops. If someone changes the cluster by hand, the agent detects <b>drift</b> and, with self-heal enabled, reverts it to what Git says.' },
          ],
        },
      ],
      tip: 'Notice the arrow direction: the cluster pulls from Git. CI never talks to the cluster API, so no kubeconfig with admin rights lives in CI.',
    },

    {
      kicker: 'Deployment models',
      title: 'Push vs pull deployment',
      blocks: [
        { type: 'compare', headers: ['', 'Push (CI-driven)', 'Pull (GitOps)'], rows: [
          ['Who applies changes?', 'The CI pipeline runs <code>kubectl</code> / <code>helm</code>', 'An agent inside the cluster'],
          ['Cluster credentials', 'Stored in the CI system', 'Stay inside the cluster'],
          ['Drift detection', 'None: only acts when the pipeline runs', 'Continuous: compares live state with Git'],
          ['Firewall', 'CI must reach the API server', 'Cluster only needs outbound access to Git'],
          ['Audit trail', 'Pipeline logs', 'Git history of the config repo'],
          ['Examples', 'Jenkins, GitHub Actions, Tekton running deploy steps', 'Argo CD, Flux'],
        ] },
        { type: 'check', q: 'A security team does not want production cluster credentials stored in the CI system. Which approach fits best?', options: ['Give the CI pipeline a read-only kubeconfig and run kubectl apply', 'A pull-based GitOps agent running inside the cluster', 'Run helm install from each developer laptop', 'Store the kubeconfig in a ConfigMap that CI reads'], answer: 1, explain: 'With <b>pull-based GitOps</b> the agent in the cluster fetches desired state from Git, so CI never needs cluster credentials. A read-only kubeconfig cannot apply anything, laptops break auditability, and a kubeconfig in a ConfigMap still hands credentials to CI (and is not even a Secret).', ref: 'https://opengitops.dev/' },
      ],
      tip: 'Push-based pipelines are still CD. GitOps is specifically the <b>pull + continuous reconciliation</b> model.',
    },

    {
      kicker: 'GitOps tools',
      title: 'Argo CD vs Flux',
      blocks: [
        { type: 'compare', headers: ['', 'Argo CD', 'Flux'], rows: [
          ['CNCF status', 'Graduated (part of the Argo project)', 'Graduated'],
          ['Main object', '<code>Application</code> (and <code>ApplicationSet</code> for many apps/clusters)', '<code>GitRepository</code> source + <code>Kustomization</code> / <code>HelmRelease</code>'],
          ['Architecture', 'API server + repo server + application controller; rich <b>web UI</b>', 'A set of small controllers (the GitOps Toolkit): source, kustomize, helm, notification, image automation'],
          ['Sources', 'Git, Helm repos, OCI; plain YAML, Helm, Kustomize', 'Git, Helm repos, OCI, S3-compatible buckets'],
          ['Progressive delivery add-on', 'Argo Rollouts', 'Flagger'],
        ] },
        { type: 'cards', cols: 2, items: [
          { icon: '🧭', color: 'amber', title: 'Drift detection', text: 'The agent compares rendered manifests with live objects. Argo CD shows an app as <b>Synced</b> or <b>OutOfSync</b> and <b>Healthy</b>/<b>Degraded</b>.' },
          { icon: '🩹', color: 'green', title: 'Self-heal & prune', text: 'With automated sync, <b>self-heal</b> reverts manual changes made with <code>kubectl edit</code>; <b>prune</b> deletes objects that were removed from Git.' },
        ] },
        { type: 'callout', kind: 'trap', title: 'Not the same thing', html: '<b>Argo CD</b> = GitOps continuous delivery. <b>Argo Workflows</b> = container-native workflow engine (DAGs of steps, often for CI or data jobs). <b>Argo Rollouts</b> = canary/blue-green controller. All live under the graduated Argo project.' },
      ],
      tip: '“Which TWO CNCF graduated projects implement GitOps?” → <b>Argo (Argo CD)</b> and <b>Flux</b>. Jenkins and Tekton are CD Foundation projects, not GitOps agents.',
    },

    {
      kicker: 'Packaging',
      title: 'Helm: the package manager for Kubernetes',
      blocks: [
        { type: 'cols', ratio: '1fr 1.15fr', cols: [
          [
            { type: 'cards', cols: 1, items: [
              { icon: '📦', color: 'blue', title: 'Chart', text: 'A package: <code>Chart.yaml</code> (metadata), <code>values.yaml</code> (defaults) and <code>templates/</code> (Go-templated manifests).' },
              { icon: '🎛️', color: 'amber', title: 'Values', text: 'Configuration that fills the templates. Override with <code>-f my-values.yaml</code> or <code>--set key=value</code>.' },
              { icon: '🏷️', color: 'green', title: 'Release', text: 'One installed instance of a chart in a cluster. Each upgrade creates a new numbered <b>revision</b>.' },
              { icon: '🏪', color: 'purple', title: 'Repository', text: 'Where charts are published: an HTTP chart repo or an OCI registry. Artifact Hub helps you find them.' },
            ] },
          ],
          [
            { type: 'code', lang: 'bash', title: 'Helm commands', code: `
helm repo add bitnami https://charts.bitnami.com/bitnami
helm search repo nginx
helm install web bitnami/nginx -f prod-values.yaml
helm upgrade web bitnami/nginx --set replicaCount=3
helm history web
helm rollback web 1
helm template web bitnami/nginx > rendered.yaml
helm list -A
helm uninstall web`, notes: { 1: 'Registers a chart repository locally.', 3: '<b>install</b> creates release <code>web</code> (revision 1) from a chart plus your values.', 4: '<b>upgrade</b> renders the chart again with new values and creates revision 2. <code>--install</code> makes it create the release if missing.', 5: 'Lists every revision of the release with status and chart version.', 6: '<b>rollback</b> returns the release to a previous revision (here revision 1), which itself is recorded as a new revision.', 7: '<b>template</b> renders manifests locally without installing. Handy for review or to feed a GitOps repo.', 8: 'Releases are namespaced; <code>-A</code> lists them across all namespaces.' } },
          ],
        ] },
        { type: 'callout', kind: 'info', title: 'Helm 3', html: 'Helm 3 removed the in-cluster <b>Tiller</b> server. The Helm client talks to the API server with your own credentials, and release metadata is stored as Secrets in the release’s namespace. Helm is a CNCF graduated project.' },
      ],
      tip: 'Release = installed instance; chart = package; values = configuration; repository = where charts live. Those four definitions answer most Helm questions.',
    },

    {
      kicker: 'Configuration',
      title: 'Kustomize: patch YAML, no templates',
      blocks: [
        { type: 'cols', ratio: '1.1fr 1fr', cols: [
          [
            { type: 'code', lang: 'yaml', title: 'overlays/prod/kustomization.yaml', code: `
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- ../../base
namespace: shop-prod
namePrefix: prod-
labels:
- pairs:
    env: prod
images:
- name: ghcr.io/acme/web
  newTag: 1.4.1
patches:
- path: replicas-patch.yaml`, notes: { 3: '<b>resources</b>: pull in the <b>base</b>, plain valid YAML shared by every environment.', 5: 'Set the namespace on every object in this overlay.', 6: 'Prefix every resource name, e.g. <code>web</code> becomes <code>prod-web</code>.', 10: 'The <b>images</b> transformer swaps the tag without editing the base. GitOps bots often change only this line.', 13: '<b>patches</b>: strategic merge or JSON 6902 patches, e.g. raise replicas only in prod.' } },
            { type: 'code', lang: 'bash', code: `
kubectl kustomize overlays/prod     # render only
kubectl apply -k overlays/prod      # render and apply`, notes: { 2: '<code>-k</code> points kubectl at a directory containing a <code>kustomization.yaml</code>. Kustomize has been built into kubectl since 1.14.' } },
          ],
          [
            { type: 'compare', headers: ['', 'Helm', 'Kustomize'], rows: [
              ['Approach', 'Templates + values', 'Base + overlays + patches'],
              ['Templating language', 'Go templates', 'None: plain YAML'],
              ['Packaging & sharing', 'Charts in repos / OCI', 'Directories in Git'],
              ['Release tracking', 'Releases, revisions, rollback', 'None (kubectl / GitOps does it)'],
              ['Built into kubectl', 'No', 'Yes, <code>-k</code>'],
            ] },
            { type: 'callout', kind: 'tip', title: 'They combine', html: 'Argo CD and Flux render both. Teams often install third-party software with Helm and customise their own apps with Kustomize overlays per environment.' },
          ],
        ] },
      ],
      tip: '“Customise manifests per environment <b>without templates</b>” → Kustomize. “Package, version and share an app with configurable values” → Helm.',
    },

    {
      kicker: 'Built-in strategies',
      title: 'Recreate vs RollingUpdate',
      blocks: [
        { type: 'cols', ratio: '1fr 1fr', cols: [
          [
            { type: 'code', lang: 'yaml', title: 'Deployment strategy', code: `
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  minReadySeconds: 10
  revisionHistoryLimit: 10`, notes: { 4: '<b>RollingUpdate</b> is the default. The other built-in value is <b>Recreate</b>.', 6: '<b>maxSurge</b>: how many extra Pods above <code>replicas</code> may exist during the update (default 25%).', 7: '<b>maxUnavailable</b>: how many Pods may be unavailable during the update (default 25%). 0 here means full capacity at all times.', 8: 'A new Pod must be Ready this long before it counts as available, slowing the rollout to catch crashes.', 9: 'How many old ReplicaSets to keep for <code>kubectl rollout undo</code>.' } },
          ],
          [
            { type: 'compare', headers: ['', 'Recreate', 'RollingUpdate'], rows: [
              ['How', 'Kill all old Pods, then start new ones', 'Replace Pods gradually'],
              ['Downtime', 'Yes', 'No (if readiness probes are right)'],
              ['Two versions at once?', 'Never', 'Yes, briefly'],
              ['Use when', 'Versions cannot coexist (schema lock, single-writer volume)', 'Default for stateless apps'],
            ] },
            { type: 'callout', kind: 'warn', title: 'Readiness gates the rollout', html: 'A rolling update only moves on when new Pods become <b>Ready</b>. Without a readiness probe, traffic can hit a Pod that is still starting.' },
          ],
        ] },
      ],
      tip: 'A Deployment natively supports <b>only Recreate and RollingUpdate</b>. Blue/green and canary need extra objects, a service mesh/Ingress, or a controller like Argo Rollouts or Flagger.',
    },

    {
      kicker: 'Release strategies',
      title: 'Blue/green, canary, A/B and shadow',
      blocks: [
        { type: 'compare', headers: ['Strategy', 'How traffic moves', 'Main benefit', 'Cost / risk'], rows: [
          ['Recreate', 'All old down, then all new up', 'Simple, never mixed versions', 'Downtime'],
          ['Rolling update', 'Pods replaced batch by batch', 'No downtime, built in', 'Two versions serve at once; rollback is another rollout'],
          ['Blue/green', 'Full new stack (green) beside old (blue); switch all traffic at once, e.g. change the Service selector', 'Instant switch and instant rollback', 'Double the resources during the release'],
          ['Canary', 'Small % of traffic (5% → 25% → 100%) to the new version while metrics are watched', 'Limits blast radius with real users', 'Needs traffic splitting and good metrics'],
          ['A/B testing', 'Route by user attribute (header, cookie, region) to variants', 'Measures a <b>business</b> hypothesis', 'Needs smart routing (mesh, Gateway, Ingress)'],
          ['Shadow (mirroring)', 'Copy live requests to the new version; its responses are discarded', 'Tests with real traffic, zero user impact', 'Double load; side effects such as writes or payments'],
        ] },
        { type: 'cards', cols: 2, items: [
          { icon: '🐤', color: 'amber', title: 'Progressive delivery', text: 'Automating canary or blue/green with <b>metric analysis</b>: shift traffic step by step, query Prometheus, and automatically promote or roll back.' },
          { icon: '🛠️', color: 'teal', title: 'Tools', text: '<b>Argo Rollouts</b>: a <code>Rollout</code> CRD that replaces the Deployment, with canary/blue-green steps and analysis. <b>Flagger</b> (Flux family): automates canaries using a service mesh or ingress.' },
        ] },
      ],
      tip: '“Release to 5% of users first and watch error rates” = <b>canary</b>. “Two full environments, flip all traffic” = <b>blue/green</b>. “Version B only for users with a cookie” = <b>A/B</b>. “Duplicate traffic, ignore responses” = <b>shadow</b>.',
    },

    {
      kicker: 'Beyond Deployments',
      title: 'Operators and CRDs for application lifecycle',
      blocks: [
        { type: 'text', html: 'Stateless apps fit a Deployment. Complex software (databases, message queues, monitoring stacks) needs <b>day-2 knowledge</b>: backups, failover, upgrades in the right order. An <b>Operator</b> encodes that human operator knowledge in software.' },
        { type: 'flow', items: [
          { icon: '📐', label: 'CRD', sub: 'new API kind', info: 'A CustomResourceDefinition adds a kind such as <code>PostgresCluster</code> or <code>Prometheus</code> to the API.' },
          { icon: '📝', label: 'Custom resource', sub: 'your desired state', info: 'You write a short object: “3 replicas, version 16, daily backups”. It is stored in etcd like any other object.' },
          { icon: '🔁', label: 'Controller', sub: 'reconciles', info: 'The operator’s controller watches those objects and creates StatefulSets, Services, Secrets, CronJobs… and keeps them correct.' },
          { icon: '🩺', label: 'Day 2', sub: 'upgrade, backup, heal', info: 'It performs ordered upgrades, failover and backups, the jobs a human operator would do.' },
        ] },
        { type: 'callout', kind: 'exam', title: 'Operator = CRD + controller', html: 'An Operator is a custom controller that reconciles custom resources using domain knowledge. Examples: Prometheus Operator, CloudNativePG, cert-manager. Argo CD itself is configured with CRDs (<code>Application</code>), and so is Flux.' },
      ],
      tip: 'If a question asks how to automate “backups, upgrades and failover of a database on Kubernetes”, the answer is an <b>Operator</b>, not a Helm chart or a CronJob alone.',
    },

    {
      kicker: 'Practice',
      title: 'Match the delivery tool or term',
      blocks: [
        { type: 'match', pairs: [
          ['Argo CD', 'GitOps agent with Application CRD and web UI'],
          ['Flux', 'GitOps Toolkit controllers: source, kustomize, helm'],
          ['Helm', 'Charts, values and versioned releases'],
          ['Kustomize', 'Base + overlays, built into kubectl -k'],
          ['Argo Rollouts', 'Canary and blue/green Rollout CRD'],
          ['Tekton', 'Pipelines and Tasks as Kubernetes CRDs'],
        ] },
        { type: 'check', q: 'An engineer runs <code>kubectl scale deploy/web --replicas=10</code> in a cluster managed by Argo CD with automated sync and self-heal. Git says 3 replicas. What happens?', options: ['The cluster keeps 10 replicas and Git is updated to 10', 'Argo CD detects drift and returns the Deployment to 3 replicas', 'Argo CD deletes the Deployment because it was modified', 'Nothing, because Argo CD only acts on new commits'], answer: 1, explain: 'With <b>self-heal</b>, the agent continuously compares live state with Git and reverts manual drift back to the declared 3 replicas. GitOps agents do not write back to Git, do not delete changed objects (prune only removes objects deleted from Git), and they reconcile continuously, not only on commits.', ref: ['https://argo-cd.readthedocs.io/en/stable/', 'https://opengitops.dev/'] },
      ],
    },
  ],

  summary: [
    'CI builds and tests every change; continuous <b>delivery</b> keeps it releasable with a manual gate; continuous <b>deployment</b> releases automatically.',
    'OpenGitOps principles: <b>declarative, versioned &amp; immutable, pulled automatically, continuously reconciled</b>.',
    '<b>Argo CD</b> and <b>Flux</b> are CNCF graduated GitOps agents: they pull from Git, detect drift and self-heal.',
    '<b>Helm</b> = charts + values → releases with revisions (<code>install / upgrade / rollback / template</code>). <b>Kustomize</b> = base + overlays + patches, no templating, <code>kubectl apply -k</code>.',
    'Deployments support only <b>Recreate</b> and <b>RollingUpdate</b> (maxSurge / maxUnavailable). Blue/green, canary, A/B and shadow need extra routing or tools.',
    'Progressive delivery automates canaries with metric analysis: <b>Argo Rollouts</b>, <b>Flagger</b>.',
    'Deploy <b>immutable</b> image tags or digests; Operators (CRD + controller) automate complex app lifecycles.',
  ],

  glossary: [
    { term: 'Continuous Integration', def: 'Merging changes frequently and building and testing every commit automatically.' },
    { term: 'Continuous Delivery', def: 'Every change that passes the pipeline is releasable; production release needs a manual approval.' },
    { term: 'Continuous Deployment', def: 'Every change that passes the pipeline is released to production automatically.' },
    { term: 'GitOps', def: 'Operating model where desired state lives in Git and an in-cluster agent pulls and continuously reconciles it.' },
    { term: 'OpenGitOps', def: 'CNCF project defining the four GitOps principles: declarative, versioned and immutable, pulled automatically, continuously reconciled.' },
    { term: 'Drift', def: 'A difference between the live cluster state and the desired state stored in Git.' },
    { term: 'Self-heal', def: 'GitOps agent behaviour that automatically reverts manual changes so the cluster matches Git again.' },
    { term: 'Argo CD', def: 'CNCF graduated (Argo project) declarative GitOps CD tool built around the Application CRD, with a web UI.' },
    { term: 'Flux', def: 'CNCF graduated GitOps tool built from modular controllers (GitOps Toolkit): source, kustomize, helm, notification, image automation.' },
    { term: 'Helm chart', def: 'A package of templated Kubernetes manifests plus default values.yaml and Chart.yaml metadata.' },
    { term: 'Helm release', def: 'One installed instance of a chart in a cluster; each upgrade or rollback adds a revision.' },
    { term: 'Kustomize', def: 'Template-free customisation of YAML with bases, overlays and patches; built into kubectl (apply -k).' },
    { term: 'Blue/green deployment', def: 'Run old (blue) and new (green) versions side by side and switch all traffic at once.' },
    { term: 'Canary deployment', def: 'Send a small share of traffic to the new version first and increase it while metrics stay healthy.' },
    { term: 'Progressive delivery', def: 'Automated, metric-driven gradual release (canary, blue/green) with automatic promotion or rollback, e.g. Argo Rollouts, Flagger.' },
    { term: 'Image digest', def: 'Content hash (sha256) that identifies an image immutably, unlike a tag which can be moved.' },
  ],

  quiz: [
    { q: 'A team’s pipeline builds and tests every commit and produces a release candidate, but a manager must click “Approve” before it reaches production. Which practice is this?', options: ['Continuous integration only', 'Continuous delivery', 'Continuous deployment', 'GitOps self-healing'], answer: 1, explain: '<b>Continuous delivery</b> keeps every change releasable but keeps a manual gate before production. Continuous deployment would release automatically without approval. CI alone stops at building and testing, and self-healing is about reverting drift, not release approval.', ref: 'https://glossary.cncf.io/continuous-delivery/' },
    { q: 'Which is NOT one of the four OpenGitOps principles?', options: ['Declarative', 'Pulled automatically', 'Continuously reconciled', 'Pushed by the CI pipeline'], answer: 3, explain: 'The principles are <b>declarative</b>, <b>versioned and immutable</b>, <b>pulled automatically</b> and <b>continuously reconciled</b>. A CI pipeline pushing changes into the cluster is the classic push model that GitOps replaces with in-cluster pulling.', ref: 'https://opengitops.dev/' },
    { q: 'Which TWO CNCF graduated projects are GitOps continuous delivery tools? (Select 2)', options: ['Argo (Argo CD)', 'Jenkins', 'Flux', 'Tekton'], answer: [0, 2], explain: '<b>Argo CD</b> (Argo project) and <b>Flux</b> are both CNCF graduated and implement pull-based GitOps. Jenkins and Tekton are CI/CD tools hosted by the CD Foundation, and they run pipelines rather than continuously reconciling a cluster from Git.', ref: ['https://github.com/cncf/toc/blob/main/projects/argo/argo-graduation-proposal.md', 'https://github.com/cncf/toc/blob/main/projects/flux/flux-graduation-proposal.md'] },
    { q: 'In a Helm context, what is a <b>release</b>?', options: ['A packaged set of templates and default values', 'An installed instance of a chart in a cluster, tracked with revisions', 'A server hosting chart archives', 'The values.yaml file of a chart'], answer: 1, explain: 'A <b>release</b> is one installation of a chart (e.g. <code>helm install web bitnami/nginx</code> creates release <code>web</code>). The package itself is the <b>chart</b>, a server hosting charts is a <b>repository</b>, and values.yaml holds default configuration.', ref: 'https://helm.sh/docs/glossary/' },
    { q: 'What does <code>helm template web ./mychart -f prod.yaml</code> do?', options: ['Installs the chart as release web', 'Creates a new chart skeleton called web', 'Renders the chart’s manifests locally without installing anything', 'Rolls the web release back to its template'], answer: 2, explain: '<code>helm template</code> renders the Go templates with the given values and prints plain YAML; nothing is sent to the cluster. <code>helm install</code> installs, <code>helm create</code> scaffolds a new chart and <code>helm rollback</code> restores a previous revision.', ref: 'https://helm.sh/docs/helm/helm_template/' },
    { q: 'You need different replica counts and image tags for dev and prod from the same plain YAML, without any templating language. Which tool fits best?', options: ['Kustomize overlays', 'Helm hooks', 'A ConfigMap per environment', 'Tekton Tasks'], answer: 0, explain: '<b>Kustomize</b> keeps a plain-YAML base and applies per-environment overlays and patches (<code>kubectl apply -k</code>), with no templates. Helm hooks run Jobs at lifecycle points, ConfigMaps hold app configuration rather than manifest variations, and Tekton runs pipelines.', ref: 'https://kubectl.docs.kubernetes.io/references/kustomize/' },
    { q: 'Which Deployment strategy terminates all existing Pods before creating new ones?', options: ['RollingUpdate', 'Canary', 'Blue/green', 'Recreate'], answer: 3, explain: '<b>Recreate</b> scales the old ReplicaSet to zero first, causing downtime but never running two versions at once. RollingUpdate replaces Pods gradually, and canary or blue/green are not built-in Deployment strategy types at all.', ref: 'https://kubernetes.io/docs/concepts/workloads/controllers/deployment/' },
    { q: 'A new version should receive 5% of production traffic first, then more as long as error rates stay low. Which strategy is this?', options: ['Blue/green', 'Shadow deployment', 'Canary', 'Recreate'], answer: 2, explain: 'A small, gradually increasing share of real traffic is a <b>canary</b> release. Blue/green switches all traffic at once, shadow mirrors traffic but discards the new version’s responses, and Recreate has downtime with no traffic shaping.', ref: 'https://glossary.cncf.io/canary-deployment/' },
    { q: 'Which tool replaces a Deployment with a <code>Rollout</code> custom resource to automate canary and blue/green releases with metric analysis?', options: ['Argo Rollouts', 'Argo Workflows', 'Kustomize', 'Helm'], answer: 0, explain: '<b>Argo Rollouts</b> provides the Rollout CRD with canary/blue-green steps and AnalysisTemplates (e.g. Prometheus queries). Argo Workflows runs DAG-style workflows, and Kustomize and Helm only generate manifests; they do not control traffic during a release.', ref: 'https://argoproj.github.io/rollouts/' },
    { q: 'A GitOps agent shows an application as <i>OutOfSync</i>. What does that mean?', options: ['The cluster cannot reach the container registry', 'The Pods are failing their readiness probes', 'Two Git repositories contain conflicting commits', 'The live state in the cluster differs from the desired state in Git'], answer: 3, explain: '<b>OutOfSync</b> is Argo CD’s term for drift: rendered manifests from Git do not match live objects. Image pull or probe failures show up as health status (e.g. Degraded or Progressing), not sync status, and the agent does not compare repositories against each other.', ref: 'https://argo-cd.readthedocs.io/en/stable/core_concepts/' },
    { q: 'Which TWO practices make a rollback reliable and reproducible? (Select 2)', options: ['Deploying with the <code>latest</code> image tag', 'Referencing images by immutable version tag or digest', 'Reverting the commit in the GitOps config repository', 'Editing live objects with <code>kubectl edit</code> during incidents'], answer: [1, 2], explain: 'Immutable tags or <b>digests</b> guarantee that “the previous version” means the exact same bytes, and with GitOps a <b>git revert</b> makes the agent reconcile back to the old desired state. <code>latest</code> is a moving pointer, and manual <code>kubectl edit</code> creates drift that a self-healing agent will revert anyway.', ref: ['https://kubernetes.io/docs/concepts/containers/images/', 'https://opengitops.dev/'] },
    { q: 'What best describes a Kubernetes Operator?', options: ['A person with cluster-admin rights', 'A Helm chart that installs a database', 'A custom controller that manages custom resources using application-specific knowledge', 'A kubectl plugin for viewing logs'], answer: 2, explain: 'An <b>Operator</b> combines a CRD with a controller that encodes operational knowledge (upgrades, backups, failover) and reconciles it continuously. A Helm chart only installs manifests once per upgrade; it does not keep running logic in the cluster.', ref: 'https://kubernetes.io/docs/concepts/extend-kubernetes/operator/' },
  ],
});
