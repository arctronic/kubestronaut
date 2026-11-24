KS.registerChapter('kcna', {
  id: 'containerization',
  title: 'Containerization',
  subtitle: 'From Linux namespaces to OCI images, runtimes and RuntimeClass: what actually runs inside a Pod',
  icon: '📦',
  minutes: 35,
  objectives: [
    'Contrast containers with virtual machines and name the kernel features (namespaces, cgroups) that make containers possible',
    'Explain images, layers, tags vs digests and how <code>imagePullPolicy</code> behaves by default',
    'Place containerd, CRI-O, runc, crun, gVisor and Kata in the runtime stack and explain the three OCI specs',
    'Explain why dockershim was removed and why Docker-built images still run on Kubernetes',
    'Recognise image build, scanning and signing tools and Dockerfile best practices',
  ],

  slides: [
    {
      kicker: 'Foundations',
      title: 'Containers vs virtual machines',
      blocks: [
        { type: 'cols', cols: [
          [
            { type: 'layers', title: 'Virtual machines', items: [
              { label: 'App A · App B', sub: 'each with its own libs', color: 'blue' },
              { label: 'Guest OS × N', sub: 'full kernel per VM', color: 'purple' },
              { label: 'Hypervisor', sub: 'KVM, ESXi, Hyper-V', color: 'amber' },
              { label: 'Host hardware', sub: '', color: 'gray' },
            ] },
          ],
          [
            { type: 'layers', title: 'Containers', items: [
              { label: 'App A · App B', sub: 'each with its own libs', color: 'blue' },
              { label: 'Container runtime', sub: 'containerd / CRI-O + runc', color: 'pink' },
              { label: 'Host OS kernel (shared)', sub: 'namespaces + cgroups', color: 'green' },
              { label: 'Host hardware', sub: '', color: 'gray' },
            ] },
          ],
        ] },
        { type: 'compare', headers: ['', 'Virtual machine', 'Container'], rows: [
          ['Isolation unit', 'Whole OS with its own kernel', 'Process(es) on a <b>shared host kernel</b>'],
          ['Startup time', 'Tens of seconds to minutes', 'Milliseconds to seconds'],
          ['Size', 'Gigabytes', 'Megabytes (often)'],
          ['Isolation strength', 'Strong (hardware virtualization)', 'Weaker by default (kernel shared)'],
          ['Run another OS kernel?', 'Yes (Windows VM on Linux host)', 'No: Linux containers need a Linux kernel'],
        ] },
      ],
      tip: 'The one-line answer the exam wants: containers <b>share the host kernel</b>; VMs each run <b>their own kernel</b> on a hypervisor. Containers are not “lightweight VMs”.',
    },

    {
      kicker: 'Under the hood',
      title: 'Namespaces isolate, cgroups limit',
      blocks: [
        { type: 'text', html: 'A container is just a normal Linux process with two kernel features applied: <b>namespaces</b> control what it can <i>see</i>, <b>cgroups</b> control how much it can <i>use</i>.' },
        { type: 'flip', title: 'Linux namespaces (click to flip)', items: [
          { front: '🔢 PID', back: 'Own process tree: the app sees itself as PID 1 and cannot see host processes.' },
          { front: '🌐 NET', back: 'Own network interfaces, IPs, routes and ports. In Kubernetes all containers of a Pod <b>share</b> one network namespace, hence one Pod IP.' },
          { front: '📁 MNT', back: 'Own mount table and root filesystem (the image).' },
          { front: '🏷️ UTS', back: 'Own hostname and domain name.' },
          { front: '📨 IPC', back: 'Own System V IPC / POSIX message queues and shared memory.' },
          { front: '👤 USER', back: 'Maps UIDs inside to different UIDs outside, so root in the container need not be root on the host.' },
        ] },
        { type: 'cards', cols: 2, items: [
          { icon: '📏', color: 'green', title: 'cgroups (control groups)', text: 'Limit and account CPU, memory, I/O and PIDs per group of processes. Kubernetes <b>resource limits</b> are enforced through cgroups; cgroup v2 is the modern unified version.' },
          { icon: '🛡️', color: 'red', title: 'Extra hardening', text: '<b>Capabilities</b> split root powers into pieces you can drop; <b>seccomp</b> filters syscalls; <b>AppArmor/SELinux</b> restrict file and process access. All configurable via a Pod’s <code>securityContext</code>.' },
        ] },
      ],
      tip: 'Mnemonic: namespaces = <b>what you see</b>, cgroups = <b>what you get</b>. “Which kernel feature limits memory?” → cgroups. “Which isolates the process tree?” → PID namespace.',
    },

    {
      kicker: 'Images',
      title: 'Images, layers and copy-on-write',
      blocks: [
        { type: 'cols', ratio: '1fr 1.1fr', cols: [
          [
            { type: 'layers', title: 'A running container', items: [
              { label: 'Writable container layer', sub: 'thin, deleted with the container', color: 'red' },
              { label: 'COPY app/', sub: 'read-only layer', color: 'blue' },
              { label: 'RUN pip install …', sub: 'read-only layer', color: 'blue' },
              { label: 'FROM python:3.13-slim', sub: 'base image layers', color: 'purple' },
            ] },
          ],
          [
            { type: 'bullets', items: [
              'An <b>image</b> is a read-only template: an ordered stack of filesystem <b>layers</b> plus a JSON <b>config</b> (entrypoint, env, user…) described by a <b>manifest</b>.',
              'Most Dockerfile instructions that change files (<code>RUN</code>, <code>COPY</code>, <code>ADD</code>) create a new layer.',
              'Layers are <b>content-addressed</b> (sha256) and <b>shared</b>: ten images on the same base store that base once and pull it once.',
              'A union filesystem (e.g. <b>overlayfs</b>) merges layers; a <b>copy-on-write</b> writable layer sits on top of each container.',
              'The writable layer is <b>ephemeral</b>: data is lost when the container is replaced. Persist data with volumes.',
            ] },
          ],
        ] },
        { type: 'callout', kind: 'trap', title: 'Deleting a file does not shrink the image', html: 'Removing a file in a later layer only hides it; the bytes still live in the earlier layer. Clean up in the <b>same</b> <code>RUN</code> instruction, or better, use a multi-stage build.' },
      ],
      tip: 'Image = immutable template. Container = a running instance of an image plus a writable layer. Many containers can run from one image.',
    },

    {
      kicker: 'Building well',
      title: 'Dockerfile best practices',
      blocks: [
        { type: 'cols', ratio: '1.2fr 1fr', cols: [
          [
            { type: 'code', lang: 'dockerfile', title: 'Dockerfile (multi-stage)', code: `
# syntax=docker/dockerfile:1
FROM golang:1.23 AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /app ./cmd/server

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /app /app
USER nonroot:nonroot
EXPOSE 8080
ENTRYPOINT ["/app"]`, notes: { 2: '<b>Stage 1</b> (named <code>build</code>) has the full toolchain. Pin an explicit version, never an implicit <code>latest</code>.', 4: 'Copy dependency manifests first and download modules: this layer stays <b>cached</b> until dependencies change.', 6: 'Source code changes often, so it is copied <b>after</b> the cached dependency layer.', 9: '<b>Stage 2</b>: a <b>distroless</b> base has no shell or package manager, which means a tiny image and a small attack surface.', 10: 'Only the compiled binary is copied from the build stage. Compilers and sources never reach the final image.', 11: 'Run as a <b>non-root</b> user.', 12: '<code>EXPOSE</code> is documentation only; it does not publish ports.', 13: 'Exec-form ENTRYPOINT: the app runs as PID 1 and receives SIGTERM directly for graceful shutdown.' } },
          ],
          [
            { type: 'cards', cols: 1, items: [
              { icon: '🪜', color: 'blue', title: 'Multi-stage builds', text: 'Build in one stage, ship only the artifact in a minimal final stage.' },
              { icon: '🪶', color: 'green', title: 'Small base', text: 'distroless, alpine or slim variants: fewer packages, fewer CVEs, faster pulls.' },
              { icon: '🙅', color: 'red', title: 'Non-root', text: '<code>USER</code> in the image, plus <code>runAsNonRoot: true</code> in the Pod securityContext.' },
              { icon: '📌', color: 'amber', title: 'Pin versions', text: 'Pin base image tags (or digests) and package versions for reproducible builds.' },
              { icon: '🙈', color: 'gray', title: '.dockerignore & no secrets', text: 'Exclude .git, local configs and credentials from the build context. Secrets baked into a layer stay there forever.' },
            ] },
          ],
        ] },
      ],
      tip: '“How do you reduce image size and attack surface?” → <b>multi-stage build + minimal/distroless base</b>. “How do you avoid running as root?” → <code>USER</code> directive / <code>runAsNonRoot</code>.',
    },

    {
      kicker: 'Distribution',
      title: 'Registries, tags and digests',
      blocks: [
        { type: 'code', lang: 'bash', title: 'anatomy of an image reference', code: `
# registry          / repository     : tag  @ digest
registry.example.com/team/payments:1.4.2@sha256:9f86d08...
nginx                # = docker.io/library/nginx:latest
ghcr.io/acme/api:2.0 # GitHub Container Registry
docker pull nginx:1.27
docker push registry.example.com/team/payments:1.4.2`, notes: { 2: 'Full reference: registry host, repository path, optional <b>tag</b>, optional <b>digest</b>. When a digest is given it wins.', 3: 'Short names expand to defaults: registry <code>docker.io</code>, namespace <code>library</code>, tag <code>latest</code>.', 4: 'Any OCI-compliant registry works: Docker Hub, GHCR, Quay, Amazon ECR, Google Artifact Registry, Azure ACR, self-hosted <b>Harbor</b> (CNCF graduated).' } },
        { type: 'compare', headers: ['', 'Tag', 'Digest'], rows: [
          ['Looks like', '<code>:1.4.2</code>, <code>:latest</code>', '<code>@sha256:9f86d0…</code>'],
          ['Mutable?', '<b>Yes</b>: can be moved to a different image', '<b>No</b>: hash of the content'],
          ['Good for', 'Humans, release names', 'Reproducible, tamper-evident deployments'],
          ['If the image changes', 'Same tag may now pull different bytes', 'Different content = different digest'],
        ] },
        { type: 'callout', kind: 'info', title: 'Private registries', html: 'To pull from a private registry, create a Secret of type <code>kubernetes.io/dockerconfigjson</code> and reference it in <code>imagePullSecrets</code> (in the Pod or its ServiceAccount).' },
      ],
      tip: '“Which reference guarantees you always run the exact same image?” → the <b>digest</b>. <code>latest</code> is just a tag name with no special meaning to the registry.',
    },

    {
      kicker: 'Pulling in Kubernetes',
      title: 'imagePullPolicy',
      blocks: [
        { type: 'compare', headers: ['Policy', 'Behaviour'], rows: [
          ['<b>Always</b>', 'The kubelet checks the registry every time a container starts. If the digest matches the cached image, it is reused (cheap).'],
          ['<b>IfNotPresent</b>', 'Pull only if the image is not already on the node.'],
          ['<b>Never</b>', 'Never pull. The image must already be on the node, else the container fails with <code>ErrImageNeverPull</code>.'],
        ] },
        { type: 'compare', headers: ['If imagePullPolicy is omitted and the image is…', 'Default becomes'], rows: [
          ['<code>nginx:latest</code>', '<b>Always</b>'],
          ['<code>nginx</code> (no tag, so latest is implied)', '<b>Always</b>'],
          ['<code>nginx:1.27</code>', '<b>IfNotPresent</b>'],
          ['<code>nginx@sha256:…</code>', '<b>IfNotPresent</b>'],
        ] },
        { type: 'callout', kind: 'trap', title: 'Set once, at creation', html: 'The default is filled in when the object is created. Changing the tag later does <b>not</b> change an already-defaulted policy.' },
        { type: 'check', q: 'A Pod spec uses <code>image: myapp</code> with no tag and no imagePullPolicy. Which policy applies?', options: ['IfNotPresent', 'Never', 'Always', 'OnFailure'], answer: 2, explain: 'No tag means <code>:latest</code> is implied, and for <code>:latest</code> the default policy is <b>Always</b>. IfNotPresent is the default for any other explicit tag or digest; Never must be set explicitly; OnFailure is a <i>restartPolicy</i> value, not a pull policy.' },
      ],
      tip: 'Pull errors show up as <code>ErrImagePull</code> and then <code>ImagePullBackOff</code>: wrong name/tag, missing credentials or registry unreachable. The Pod is already scheduled at that point.',
    },

    {
      kicker: 'Standards',
      title: 'The Open Container Initiative (OCI)',
      blocks: [
        { type: 'text', html: 'The <b>OCI</b> is a Linux Foundation project, founded in 2015 by Docker, CoreOS and others, that defines open standards so any tool can build, ship and run any container. It maintains three specifications and the reference runtime <b>runc</b>.' },
        { type: 'cards', items: [
          { icon: '🖼️', color: 'blue', title: 'Image spec', text: 'Format of an image: manifest, config, layers (and index for multi-arch). An image built by Docker, Podman or Buildah is the same OCI image.' },
          { icon: '🏃', color: 'green', title: 'Runtime spec', text: 'How to run a “filesystem bundle” plus <code>config.json</code> as a container: lifecycle create/start/kill/delete. Implemented by runc, crun, gVisor (runsc), Kata.' },
          { icon: '🚚', color: 'purple', title: 'Distribution spec', text: 'HTTP API for pushing and pulling content to and from registries. Any compliant registry can serve images and other artifacts (Helm charts, signatures, SBOMs).' },
        ] },
        { type: 'compare', headers: ['Don’t confuse', 'Standard', 'Scope'], rows: [
          ['OCI', 'Open Container Initiative', 'Image format, runtime, registry API'],
          ['CRI', 'Container Runtime Interface', 'gRPC API from <b>kubelet</b> to the runtime'],
          ['CNI', 'Container Network Interface', 'Pod networking plugins'],
          ['CSI', 'Container Storage Interface', 'Storage plugins'],
        ] },
      ],
      tip: 'OCI = what a container image and a container <i>are</i>. CRI = how <b>Kubernetes</b> talks to a runtime. Two different layers, both frequently used as distractors for each other.',
    },

    {
      kicker: 'Runtime stack · interactive',
      title: 'From kubelet to a running process',
      blocks: [
        { type: 'diagram', width: 900, height: 400,
          caption: 'Press ▶ Play to follow a container start, or click a component.',
          groups: [
            { x: 20, y: 20, w: 860, h: 360, label: 'Worker node', color: 'green' },
          ],
          nodes: [
            { id: 'kubelet', x: 50, y: 70, w: 150, h: 56, label: 'kubelet', icon: '🤖', color: 'green', info: 'Gets the Pod spec from the API server and asks the runtime, over the <b>CRI</b> (gRPC), to pull images, create the Pod sandbox and start containers.' },
            { id: 'high', x: 290, y: 70, w: 170, h: 56, label: 'containerd / CRI-O', sub: 'high-level runtime', color: 'pink', fs: 13, info: '<b>High-level runtimes</b> implement CRI: manage images (pull, unpack, store), snapshots, sandboxes and container lifecycle. containerd is a CNCF graduated project; CRI-O is built specifically for Kubernetes.' },
            { id: 'reg', x: 560, y: 70, w: 150, h: 56, label: 'Registry', icon: '🗃️', sub: 'OCI distribution', color: 'purple', info: 'The image is pulled from an OCI-compliant registry using the distribution spec, then unpacked into layers on the node.' },
            { id: 'cni', x: 560, y: 175, w: 150, h: 56, label: 'CNI plugin', sub: 'Pod network', color: 'teal', info: 'When the Pod sandbox is created, the runtime calls the CNI plugin to set up the Pod’s network namespace and IP.' },
            { id: 'shim', x: 290, y: 175, w: 170, h: 56, label: 'shim', sub: 'per container/Pod', color: 'gray', info: 'A small shim process (e.g. containerd-shim-runc-v2) sits between the runtime and the container so the container survives runtime restarts and its exit status is collected.' },
            { id: 'low', x: 290, y: 280, w: 170, h: 56, label: 'runc / crun', sub: 'low-level OCI runtime', color: 'amber', info: '<b>Low-level runtimes</b> implement the OCI runtime spec: they ask the kernel to create namespaces and cgroups and start the process, then exit. runc (Go) is the reference implementation; crun is written in C. Sandboxed alternatives: gVisor (runsc), Kata Containers.' },
            { id: 'proc', x: 560, y: 280, w: 150, h: 56, label: 'Container', icon: '📦', sub: 'isolated process', color: 'blue', round: true, info: 'Just a Linux process in its own namespaces, limited by cgroups, with the image layers as its root filesystem.' },
            { id: 'kernel', x: 50, y: 280, w: 150, h: 56, label: 'Linux kernel', sub: 'namespaces + cgroups', color: 'green', info: 'Every container on the node shares this kernel, which is why kernel isolation features (and sandboxed runtimes) matter for security.' },
          ],
          edges: [
            { from: 'kubelet', to: 'high', label: 'CRI (gRPC)', color: 'green' },
            { from: 'high', to: 'reg', label: 'pull', color: 'purple' },
            { from: 'high', to: 'cni', label: 'sandbox net', color: 'teal', dashed: true },
            { from: 'high', to: 'shim', color: 'pink' },
            { from: 'shim', to: 'low', label: 'OCI bundle', color: 'gray' },
            { from: 'low', to: 'kernel', label: 'syscalls', color: 'amber', dashed: true },
            { from: 'low', to: 'proc', label: 'start', color: 'amber' },
          ],
          steps: [
            { on: ['kubelet', 'high', 'kubelet>high'], text: 'The kubelet calls the runtime through the <b>CRI</b>: RunPodSandbox, PullImage, CreateContainer, StartContainer.' },
            { on: ['high', 'reg', 'high>reg'], text: 'containerd or CRI-O <b>pulls the image</b> from the registry (if the pull policy requires it) and unpacks its layers.' },
            { on: ['high', 'cni', 'high>cni'], text: 'For a new Pod sandbox, the runtime invokes the <b>CNI plugin</b> to create the network namespace and assign the Pod IP.' },
            { on: ['high', 'shim', 'high>shim', 'shim>low', 'low'], text: 'A <b>shim</b> prepares an OCI bundle (rootfs + config.json) and invokes the <b>low-level runtime</b>.' },
            { on: ['low', 'kernel', 'low>kernel', 'low>proc', 'proc'], text: 'runc asks the <b>kernel</b> for namespaces and cgroups, starts the process, and exits. The container is now just an isolated process.' },
          ],
        },
      ],
      tip: 'High-level = <b>containerd, CRI-O</b> (implement CRI, manage images). Low-level = <b>runc, crun</b> (implement the OCI runtime spec, talk to the kernel).',
    },

    {
      kicker: 'Stronger isolation',
      title: 'Sandboxed runtimes and RuntimeClass',
      blocks: [
        { type: 'cols', ratio: '1fr 1.1fr', cols: [
          [
            { type: 'code', lang: 'yaml', title: 'runtimeclass.yaml', code: `
apiVersion: node.k8s.io/v1
kind: RuntimeClass
metadata:
  name: gvisor
handler: runsc
---
apiVersion: v1
kind: Pod
metadata:
  name: untrusted-job
spec:
  runtimeClassName: gvisor
  containers:
  - name: job
    image: thirdparty/tool:0.9`, notes: { 2: '<b>RuntimeClass</b> is a cluster-scoped object in the <code>node.k8s.io</code> group.', 5: '<b>handler</b>: the name of the runtime configuration in containerd/CRI-O on the node (here gVisor’s <code>runsc</code>). It must already be installed on the nodes.', 12: 'A Pod opts in with <code>runtimeClassName</code>. Pods without it use the node’s default runtime (usually runc).' } },
          ],
          [
            { type: 'compare', headers: ['Runtime', 'How it isolates', 'Trade-off'], rows: [
              ['runc / crun', 'Namespaces + cgroups on the shared host kernel', 'Fastest, weakest isolation'],
              ['gVisor (runsc)', 'A <b>user-space kernel</b> intercepts the container’s syscalls', 'Smaller kernel attack surface; some syscall overhead and compatibility gaps'],
              ['Kata Containers', 'Each Pod runs in a <b>lightweight VM</b> with its own guest kernel', 'VM-level isolation; more memory and slower start'],
            ] },
            { type: 'callout', kind: 'tip', title: 'When to use', html: 'Multi-tenant clusters, running untrusted or third-party code, CI build jobs. RuntimeClass can also carry <code>scheduling</code> rules so such Pods land only on nodes that support the handler.' },
          ],
        ] },
      ],
      tip: '“Which object lets a Pod choose a different container runtime configuration such as gVisor or Kata?” → <b>RuntimeClass</b> (referenced by <code>runtimeClassName</code>).',
    },

    {
      kicker: 'History',
      title: 'Docker, Kubernetes and the dockershim removal',
      blocks: [
        { type: 'timeline', items: [
          { when: '2013', title: 'Docker released', text: 'Makes Linux containers easy with images, a CLI and Docker Hub.' },
          { when: '2015', title: 'OCI founded', text: 'Image and runtime formats become open standards; Docker donates runc.' },
          { when: 'Kubernetes 1.5', title: 'CRI introduced', text: 'The kubelet talks to runtimes through a plugin API. Docker Engine predates CRI, so the kubelet kept a built-in adapter: <b>dockershim</b>.' },
          { when: 'Kubernetes 1.20', title: 'dockershim deprecated', text: 'Announced for removal. Cluster operators started moving nodes to containerd or CRI-O.' },
          { when: 'Kubernetes 1.24', title: 'dockershim removed', text: 'The kubelet can no longer use Docker Engine directly. <b>cri-dockerd</b> (maintained outside Kubernetes) is available for those who still need it.' },
        ] },
        { type: 'callout', kind: 'exam', title: 'What did NOT change', html: 'Images built with <code>docker build</code> are standard <b>OCI images</b> and run unchanged on containerd or CRI-O. Developers can keep using Docker on their laptops. Only the <b>node runtime</b> changed.' },
        { type: 'compare', headers: ['', 'Docker', 'Kubernetes'], rows: [
          ['What it is', 'Tooling to build, ship and run containers on one host', 'Orchestrator that runs containers across a cluster'],
          ['Runs containers via', 'containerd + runc (internally)', 'Any CRI runtime (containerd, CRI-O)'],
          ['Competitor?', 'No: complementary. Docker builds images, Kubernetes runs them at scale', ''],
        ] },
      ],
      tip: 'Remember <b>1.24</b> = dockershim removed. If an option says “Docker images no longer work on Kubernetes”, it is wrong.',
    },

    {
      kicker: 'Tooling',
      title: 'Building, scanning and signing images',
      blocks: [
        { type: 'cards', items: [
          { icon: '🐳', color: 'blue', title: 'Docker / BuildKit', text: 'The classic <code>docker build</code>. BuildKit is its modern build engine: parallel stages, better caching, build secrets, multi-platform builds (<code>docker buildx</code>).' },
          { icon: '🦭', color: 'purple', title: 'Podman', text: '<b>Daemonless</b>, rootless-friendly, Docker-compatible CLI (<code>alias docker=podman</code>). Can also generate Kubernetes YAML from containers.' },
          { icon: '🧱', color: 'teal', title: 'Buildah', text: 'Builds OCI images without a daemon, from a Dockerfile or step by step with scripts. Podman uses it for builds.' },
          { icon: '🏗️', color: 'amber', title: 'kaniko', text: 'Builds images from a Dockerfile <b>inside a container or Kubernetes Pod</b> without access to a Docker daemon: common in in-cluster CI.' },
          { icon: '🧪', color: 'green', title: 'Buildpacks', text: 'Cloud Native Buildpacks turn source code into an OCI image <b>without a Dockerfile</b> by detecting the language.' },
        ] },
        { type: 'compare', headers: ['Supply-chain step', 'Typical tools', 'What it gives you'], rows: [
          ['Scan for vulnerabilities', '<b>Trivy</b>, Grype', 'Known CVEs in OS packages and libraries, misconfigurations'],
          ['Generate an SBOM', 'Syft, Trivy', 'Software Bill of Materials: what is inside the image'],
          ['Sign and verify', '<b>Sigstore cosign</b>, Notary', 'Proof of who built the image and that it was not altered'],
          ['Enforce at deploy time', 'Admission policies (Kyverno, OPA Gatekeeper)', 'Block unsigned or vulnerable images from running'],
        ] },
      ],
      tip: '“Build an image in a Kubernetes Pod without a Docker daemon?” → <b>kaniko</b> (or Buildah). “Scan an image for CVEs?” → <b>Trivy</b>. “Sign an image?” → <b>cosign</b>.',
    },

    {
      kicker: 'Practice',
      title: 'Put every tool in its place',
      blocks: [
        { type: 'match', title: 'Match the term to its description', pairs: [
          ['runc', 'Reference low-level OCI runtime'],
          ['containerd', 'High-level runtime implementing CRI, CNCF graduated'],
          ['gVisor', 'User-space kernel that intercepts syscalls'],
          ['Kata Containers', 'Runs each Pod in a lightweight VM'],
          ['cgroups', 'Limit CPU and memory of a process group'],
          ['Image digest', 'Immutable sha256 reference to image content'],
          ['kaniko', 'Daemonless image builds inside a Pod'],
          ['Trivy', 'Vulnerability scanner for images'],
        ] },
        { type: 'check', q: 'Which component is the reference implementation of the OCI runtime specification?', options: ['containerd', 'CRI-O', 'runc', 'kubelet'], answer: 2, explain: '<b>runc</b> is the low-level runtime donated by Docker to the OCI as the reference implementation of the runtime spec. containerd and CRI-O are high-level runtimes that call runc; the kubelet talks to them over CRI.' },
      ],
      tip: 'For runtime questions, first decide which <b>layer</b> the option belongs to: kubelet → CRI → high-level runtime → OCI → low-level runtime → kernel.',
    },
  ],

  summary: [
    'Containers are isolated processes that <b>share the host kernel</b>; VMs each run their own kernel on a hypervisor.',
    '<b>Namespaces</b> isolate what a process sees (PID, NET, MNT, UTS, IPC, USER); <b>cgroups</b> limit what it uses (CPU, memory).',
    'Images are stacks of read-only, content-addressed <b>layers</b>; <b>tags are mutable</b>, <b>digests are immutable</b>. <code>:latest</code> or no tag defaults to <code>imagePullPolicy: Always</code>, other tags to IfNotPresent.',
    'OCI defines the <b>image</b>, <b>runtime</b> and <b>distribution</b> specs; CRI is the kubelet-to-runtime API.',
    'High-level runtimes (<b>containerd, CRI-O</b>) call low-level OCI runtimes (<b>runc, crun</b>); sandboxed options (<b>gVisor, Kata</b>) are selected per Pod with <b>RuntimeClass</b>.',
    '<b>dockershim</b> was removed in <b>1.24</b>; Docker-built images still run because they are OCI images.',
    'Best practice: multi-stage builds, minimal/distroless base, non-root user, pinned versions; scan with <b>Trivy</b>, sign with <b>cosign</b>, build in-cluster with <b>kaniko</b>/Buildah.',
  ],

  glossary: [
    { term: 'Container', def: 'An isolated process (or group of processes) sharing the host kernel, isolated by namespaces and limited by cgroups.' },
    { term: 'Namespace (Linux)', def: 'Kernel feature that gives a process its own view of a resource: PID, network, mount, UTS, IPC, user.' },
    { term: 'cgroups', def: 'Control groups: kernel feature that limits and accounts CPU, memory, I/O and PIDs for groups of processes.' },
    { term: 'Container image', def: 'Read-only template made of filesystem layers plus a config, described by a manifest.' },
    { term: 'Layer', def: 'Content-addressed filesystem diff in an image; shared between images and cached on nodes.' },
    { term: 'Multi-stage build', def: 'Dockerfile with several FROM stages, so only the final artifact is copied into a small runtime image.' },
    { term: 'Distroless image', def: 'Minimal base image without shell or package manager, containing only the app and its runtime dependencies.' },
    { term: 'Image digest', def: 'Immutable sha256 hash identifying exact image content, written as @sha256:….' },
    { term: 'imagePullPolicy', def: 'Container field (Always, IfNotPresent, Never) that tells the kubelet when to pull the image.' },
    { term: 'OCI', def: 'Open Container Initiative: Linux Foundation project defining the image, runtime and distribution specifications.' },
    { term: 'CRI', def: 'Container Runtime Interface: gRPC API the kubelet uses to talk to container runtimes such as containerd and CRI-O.' },
    { term: 'runc', def: 'Reference low-level OCI runtime that creates namespaces and cgroups and starts the container process.' },
    { term: 'containerd', def: 'CNCF graduated high-level container runtime that implements CRI and manages images and container lifecycle.' },
    { term: 'RuntimeClass', def: 'Cluster-scoped object mapping a name to a runtime handler; Pods select it with runtimeClassName.' },
    { term: 'dockershim', def: 'Adapter in the kubelet that let Kubernetes use Docker Engine; removed in Kubernetes 1.24.' },
  ],

  quiz: [
    { q: 'Which Linux kernel feature is used to limit how much CPU and memory a container can consume?', options: ['Namespaces', 'cgroups', 'seccomp', 'overlayfs'], answer: 1, explain: '<b>cgroups</b> limit and account resource usage, which is how Kubernetes enforces limits. Namespaces isolate what a process can see, seccomp filters syscalls, and overlayfs merges image layers.' },
    { q: 'Which kernel feature gives a container its own process tree, hostname and network interfaces?', options: ['cgroups', 'Capabilities', 'Namespaces', 'SELinux'], answer: 2, explain: '<b>Namespaces</b> (PID, UTS, NET and others) give each container its own view of those resources. cgroups limit consumption, capabilities split root privileges, and SELinux is a mandatory access control system.' },
    { q: 'What is the key architectural difference between containers and virtual machines?', options: ['Containers share the host operating system kernel, while each VM runs its own kernel', 'Containers require a hypervisor, while VMs do not', 'Containers can run any operating system kernel, while VMs cannot', 'Containers always provide stronger isolation than VMs'], answer: 0, explain: 'Containers are processes on a <b>shared host kernel</b>; VMs virtualize hardware and each boots its own kernel on a hypervisor. That is why containers start faster but, by default, isolate less strongly, and why a Linux container cannot run a different kernel.' },
    { q: 'A container specifies <code>image: nginx:latest</code> and no imagePullPolicy. What policy does Kubernetes apply?', options: ['Never', 'IfNotPresent', 'OnFailure', 'Always'], answer: 3, explain: 'For the <code>:latest</code> tag (or no tag) the default is <b>Always</b>. Any other tag or a digest defaults to IfNotPresent. Never must be set explicitly, and OnFailure is a restartPolicy value.' },
    { q: 'Which image reference guarantees that every node runs exactly the same image content?', options: ['<code>myapp:stable</code>', '<code>myapp@sha256:3f2a…</code>', '<code>myapp:latest</code>', '<code>myapp:v2</code>'], answer: 1, explain: 'A <b>digest</b> is a hash of the image content and is immutable. Tags, including version-like tags such as <code>v2</code> and <code>stable</code>, are mutable pointers that can be re-pushed to different content.' },
    { q: 'Which TWO are high-level container runtimes that implement the Kubernetes CRI? (Select 2)', options: ['runc', 'containerd', 'CRI-O', 'crun'], answer: [1, 2], explain: '<b>containerd</b> and <b>CRI-O</b> implement CRI and manage images and container lifecycle. <b>runc</b> and <b>crun</b> are low-level OCI runtimes that those high-level runtimes call to actually create the container.' },
    { q: 'Kubernetes 1.24 removed dockershim. What is the impact on images built with <code>docker build</code>?', options: ['None: they are OCI images and run on containerd or CRI-O', 'They must be rebuilt with Buildah', 'They must be converted to a Kubernetes-specific format', 'They can only run on nodes using cri-dockerd'], answer: 0, explain: 'Docker produces standard <b>OCI images</b>, so any CRI runtime can run them. The removal only affects nodes that used Docker Engine as their runtime; cri-dockerd exists for those, but it is not required to run Docker-built images.' },
    { q: 'A platform team wants untrusted third-party Pods to run under gVisor while other Pods keep using runc. Which Kubernetes object enables this?', options: ['PodSecurityPolicy', 'PriorityClass', 'StorageClass', 'RuntimeClass'], answer: 3, explain: 'A <b>RuntimeClass</b> maps a name to a runtime handler (e.g. <code>runsc</code> for gVisor) and Pods opt in via <code>runtimeClassName</code>. PodSecurityPolicy was removed in 1.25, PriorityClass is for scheduling priority, and StorageClass is for dynamic volumes.' },
    { q: 'Which TWO practices reduce the size and attack surface of a container image? (Select 2)', options: ['Use a multi-stage build and copy only the final artifact', 'Base the image on a full OS image so debugging tools are available', 'Always use the <code>latest</code> tag for the base image', 'Use a minimal or distroless base image'], answer: [0, 3], explain: '<b>Multi-stage builds</b> leave compilers and sources behind, and a <b>minimal/distroless base</b> drops shells and package managers. A full OS image adds packages and CVEs, and <code>latest</code> hurts reproducibility rather than size or security.' },
    { q: 'Which OCI specification defines how clients push and pull images to and from a registry?', options: ['Image spec', 'Distribution spec', 'Runtime spec', 'Container Runtime Interface'], answer: 1, explain: 'The <b>distribution spec</b> defines the registry HTTP API. The image spec defines the image format, the runtime spec defines how to run a bundle, and CRI is a Kubernetes API between the kubelet and the runtime, not an OCI spec.' },
    { q: 'A CI pipeline runs as Pods in Kubernetes and must build container images from Dockerfiles without access to a Docker daemon. Which tool is designed for this?', options: ['Trivy', 'cosign', 'kaniko', 'Harbor'], answer: 2, explain: '<b>kaniko</b> executes Dockerfile builds in user space inside a container, with no daemon. Trivy scans images, cosign signs them, and Harbor is a registry that stores them.' },
    { q: 'Which tool would you use to scan a container image for known vulnerabilities (CVEs)?', options: ['Trivy', 'Podman', 'runc', 'Buildpacks'], answer: 0, explain: '<b>Trivy</b> scans images (and filesystems, IaC) for CVEs and misconfigurations. Podman runs and builds containers, runc is a low-level runtime, and Buildpacks build images from source.' },
  ],
});
