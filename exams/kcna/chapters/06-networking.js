KS.registerChapter('kcna', {
  id: 'networking',
  title: 'Networking',
  subtitle: 'Pod IPs, CNI, Services, DNS, Ingress, Gateway API, NetworkPolicy and service meshes',
  icon: 'globe',
  minutes: 35,
  objectives: [
    'State the three rules of the Kubernetes network model and which component (CNI) implements them',
    'Choose the right Service type and explain port, targetPort and nodePort',
    'Trace a request from a client through DNS, a Service and kube-proxy rules to a Pod',
    'Compare Ingress with Gateway API and explain how NetworkPolicy restricts traffic',
    'Recognise what a service mesh adds: sidecars, mTLS and east-west traffic control',
  ],

  slides: [
    {
      kicker: 'Foundations',
      title: 'The Kubernetes network model',
      blocks: [
        { type: 'text', html: 'Kubernetes does not ship a network implementation. It defines <b>rules</b> that any network plugin must satisfy, so applications can treat the cluster as one flat network, much like VMs on a LAN.' },
        { type: 'cards', items: [
          { icon: 'tag', color: 'blue', title: 'Every Pod gets its own IP', text: 'An IP per Pod, not per container. No port juggling between apps on the same node.' },
          { icon: 'arrow-left-right', color: 'green', title: 'Pods talk without NAT', text: 'Any Pod can reach any other Pod on any node using its real IP. The IP a Pod sees for itself is the IP others see.' },
          { icon: 'house', color: 'purple', title: 'Containers share localhost', text: 'Containers in one Pod share a network namespace: same IP, same ports, they reach each other on <code>localhost</code>.' },
          { icon: 'monitor', color: 'teal', title: 'Node agents reach Pods', text: 'Agents on a node (kubelet, system daemons) can talk to all Pods on that node, e.g. for probes.' },
        ] },
        { type: 'compare', headers: ['Problem', 'Solved by'], rows: [
          ['Container-to-container in a Pod', 'Shared network namespace (localhost)'],
          ['Pod-to-Pod, across nodes', 'CNI plugin (flat Pod network)'],
          ['Pod-to-Service', 'Service ClusterIP + kube-proxy (or eBPF)'],
          ['External-to-Service', 'NodePort, LoadBalancer, Ingress, Gateway API'],
        ] },
      ],
      tip: 'Two containers in the same Pod cannot both listen on port 8080: they share one network namespace. Two <b>Pods</b> on the same node can, because each has its own IP.',
    },

    {
      kicker: 'Plugins',
      title: 'CNI: the Container Network Interface',
      blocks: [
        { type: 'flow', items: [
          { icon: 'inbox', label: 'Pod scheduled', sub: 'kubelet picks it up', info: 'The kubelet asks the container runtime (over CRI) to create the Pod sandbox.' },
          { icon: 'blocks', label: 'Sandbox created', sub: 'new network namespace', info: 'The runtime creates the Pod’s network namespace (the pause/sandbox container holds it).' },
          { icon: 'plug', label: 'CNI ADD', sub: 'runtime calls the plugin', info: 'The runtime executes the CNI plugin configured on the node (config in <code>/etc/cni/net.d</code>, binaries in <code>/opt/cni/bin</code>).' },
          { icon: 'tag', label: 'IP assigned', sub: 'IPAM + routes', info: 'The plugin creates the interface (e.g. a veth pair), allocates an IP from the node’s Pod CIDR via IPAM and sets up routes or overlays.' },
          { icon: 'circle-dot', label: 'Pod reachable', sub: 'from every node', info: 'On deletion the runtime calls CNI DEL to release the IP.' },
        ], caption: 'What happens when a Pod gets its network.' },
        { type: 'cards', cols: 3, items: [
          { icon: 'cat', color: 'amber', title: 'Calico', text: 'L3 routing (BGP) or overlay, with rich <b>NetworkPolicy</b> support. Very common on-prem and in managed clouds.' },
          { icon: 'activity', color: 'purple', title: 'Cilium', text: '<b>eBPF</b>-based networking, policy (including L7) and observability (Hubble). Can replace kube-proxy. CNCF graduated.' },
          { icon: 'waypoints', color: 'gray', title: 'Flannel', text: 'Simple overlay (VXLAN). Easy to set up but does <b>not enforce NetworkPolicy</b> by itself.' },
        ] },
        { type: 'callout', kind: 'trap', title: 'CNI vs CRI vs CSI', html: '<b>CNI</b> = networking, <b>CRI</b> = container runtime, <b>CSI</b> = storage. Without a CNI plugin, nodes stay <code>NotReady</code> and Pods stay <code>Pending</code> or <code>ContainerCreating</code>.' },
      ],
      tip: 'If a question says “NetworkPolicies were created but have no effect”, suspect a CNI that does not enforce them (classic example: Flannel alone).',
    },

    {
      kicker: 'Services',
      title: 'Services: a stable front for changing Pods',
      blocks: [
        { type: 'text', html: 'Pods are ephemeral: they are replaced on every rollout and their IPs change. A <b>Service</b> gives a set of Pods one stable virtual IP and DNS name, and load-balances across them. The set is chosen with a <b>label selector</b>.' },
        { type: 'cols', ratio: '1fr 1fr', cols: [
          [
            { type: 'flow', items: [
              { icon: 'tag', label: 'Selector', sub: 'app=web', info: 'The Service spec has <code>selector: {app: web}</code>. It does not list Pods by name.' },
              { icon: 'repeat', label: 'EndpointSlice controller', sub: 'watches Pods', info: 'A controller in kube-controller-manager finds Pods matching the selector and tracks whether each one is <b>Ready</b>.' },
              { icon: 'clipboard-list', label: 'EndpointSlices', sub: 'IP:port list', info: 'It writes EndpointSlice objects (labelled <code>kubernetes.io/service-name</code>) listing Pod IPs, ports and readiness. Large Services are split across several slices.' },
              { icon: 'shuffle', label: 'kube-proxy', sub: 'programs rules', info: 'kube-proxy on every node watches Services and EndpointSlices and programs forwarding rules.' },
            ] },
          ],
          [
            { type: 'code', lang: 'bash', title: 'inspect a Service', code: `
kubectl expose deployment web --port=80 --target-port=8080
kubectl get svc web -o wide
kubectl get endpointslices -l kubernetes.io/service-name=web
kubectl describe svc web`, notes: { 1: '<code>kubectl expose</code> creates a Service whose selector copies the Deployment’s Pod labels.', 3: 'EndpointSlices replaced the older Endpoints object, which scaled poorly because one object held every backend.', 4: 'Empty <b>Endpoints</b> in the output? The selector matches no Ready Pods: check labels and readiness probes.' } },
          ],
        ] },
        { type: 'callout', kind: 'exam', title: 'Readiness decides membership', html: 'Only Pods whose <b>readiness probe</b> passes are used as Service backends. A failing readiness probe removes the Pod from load balancing <i>without restarting it</i>.' },
      ],
      tip: 'A Service with no selector gets no automatic EndpointSlices: you manage them yourself, for example to point at a database outside the cluster.',
    },

    {
      kicker: 'Ports',
      title: 'port vs targetPort vs nodePort',
      blocks: [
        { type: 'cols', ratio: '1.2fr 1fr', cols: [
          [
            { type: 'code', lang: 'yaml', title: 'service.yaml', code: `
apiVersion: v1
kind: Service
metadata:
  name: web
  namespace: shop
spec:
  type: NodePort
  selector:
    app: web
  ports:
  - name: http
    protocol: TCP
    port: 80
    targetPort: 8080
    nodePort: 30080
  sessionAffinity: None`, notes: { 1: 'Services are in the <b>core</b> API group: <code>apiVersion: v1</code>.', 7: 'Default type is <b>ClusterIP</b> if omitted.', 8: 'Traffic goes to Ready Pods with label <code>app=web</code> in the <b>same namespace</b>.', 13: '<b>port</b>: the port clients use on the Service’s ClusterIP.', 14: '<b>targetPort</b>: the port the container actually listens on. Can be a number or a named container port. Defaults to the same value as port.', 15: '<b>nodePort</b>: opened on <b>every node</b>. Must be in 30000-32767 by default; omit it and Kubernetes picks one.', 16: 'Set <code>ClientIP</code> to send the same client to the same Pod (sticky sessions).' } },
          ],
          [
            { type: 'flow', items: [
              { icon: 'earth', label: 'nodeIP:30080', sub: 'nodePort', info: 'External clients hit any node on the nodePort.' },
              { icon: 'target', label: 'ClusterIP:80', sub: 'port', info: 'Inside the cluster, clients use the Service name or ClusterIP on <code>port</code>.' },
              { icon: 'box', label: 'PodIP:8080', sub: 'targetPort', info: 'kube-proxy rules translate the destination to a Pod IP and the targetPort.' },
            ] },
            { type: 'callout', kind: 'trap', title: 'Mix-up to avoid', html: '<code>port</code> is what <b>callers</b> use; <code>targetPort</code> is what the <b>container</b> listens on. Getting them swapped is the most common Service bug.' },
          ],
        ] },
      ],
      tip: 'Remember the default NodePort range: <b>30000-32767</b>. Any answer suggesting port 80 or 8080 as a nodePort by default is wrong.',
    },

    {
      kicker: 'Service types',
      title: 'Five ways to expose Pods',
      blocks: [
        { type: 'compare', headers: ['Type', 'Reachable from', 'How it works', 'Typical use'], rows: [
          ['ClusterIP', 'Inside the cluster only', 'Virtual IP from the service CIDR, load-balanced by kube-proxy', 'Default; internal backends, databases'],
          ['NodePort', 'Outside, via any node IP', 'ClusterIP + a port (30000-32767) opened on every node', 'Dev/test, or behind your own LB'],
          ['LoadBalancer', 'Outside, via an external IP', 'NodePort + ClusterIP + a cloud LB created by the cloud-controller-manager (or MetalLB on bare metal)', 'Exposing one service publicly'],
          ['ExternalName', 'Inside the cluster', 'DNS <b>CNAME</b> to an external hostname; no proxying, no selector', 'Alias for an external database or API'],
          ['Headless (<code>clusterIP: None</code>)', 'Inside the cluster', 'No virtual IP; DNS returns the individual <b>Pod IPs</b>', 'StatefulSets, client-side load balancing'],
        ] },
        { type: 'callout', kind: 'info', title: 'Types build on each other', html: 'A LoadBalancer Service also gets a NodePort and a ClusterIP. A NodePort Service also gets a ClusterIP. <code>externalTrafficPolicy: Local</code> keeps traffic on the receiving node and preserves the client source IP.' },
      ],
      tip: '“Gives each StatefulSet Pod a stable DNS name” → headless Service. “Maps a Service name to <code>db.example.com</code>” → ExternalName. “Needs a cloud provider integration” → LoadBalancer.',
    },

    {
      kicker: 'Request path · interactive',
      title: 'Following a request to a Pod',
      blocks: [
        { type: 'diagram', width: 900, height: 460,
          caption: 'Press Play to follow the <code>frontend</code> Pod calling <code>http://web</code>. Click any box for details.',
          groups: [
            { x: 20, y: 20, w: 540, h: 160, label: 'Control plane & kube-system', color: 'blue' },
            { x: 20, y: 220, w: 430, h: 225, label: 'Node 1', color: 'green' },
            { x: 470, y: 220, w: 410, h: 225, label: 'Node 2', color: 'green' },
          ],
          nodes: [
            { id: 'coredns', x: 40, y: 70, w: 140, h: 56, label: 'CoreDNS', icon: 'badge', sub: 'cluster DNS', color: 'amber', info: 'Resolves <code>web.shop.svc.cluster.local</code> (or just <code>web</code> from the same namespace) to the Service’s ClusterIP. Every Pod’s <code>/etc/resolv.conf</code> points here.' },
            { id: 'api', x: 200, y: 70, w: 150, h: 56, label: 'kube-apiserver', color: 'blue', info: 'Stores the Service and EndpointSlice objects. kube-proxy and CoreDNS watch it for changes.' },
            { id: 'eps', x: 370, y: 70, w: 170, h: 56, label: 'EndpointSlice', sub: 'Ready Pod IPs', color: 'teal', info: 'Maintained by the EndpointSlice controller. Lists IP:port of every Pod matching the selector and whether it is Ready.' },
            { id: 'svc', x: 610, y: 60, w: 250, h: 76, label: 'Service: web', sub: 'ClusterIP 10.96.40.12:80', color: 'purple', info: 'A virtual IP. No process listens on it: it exists only as rules on every node (iptables, IPVS, nftables or eBPF). Selector: <code>app=web</code>.' },
            { id: 'client', x: 40, y: 265, w: 150, h: 56, label: 'frontend Pod', icon: 'box', color: 'blue', round: true, info: 'The caller. It uses the DNS name, never a Pod IP, so it keeps working through rollouts and rescheduling.' },
            { id: 'kp', x: 230, y: 265, w: 200, h: 56, label: 'kube-proxy', sub: 'iptables / nftables', color: 'teal', info: 'Runs on every node (usually a DaemonSet). It does not sit in the data path: it programs kernel rules that rewrite the destination (DNAT) to a chosen backend.' },
            { id: 'podA', x: 140, y: 365, w: 170, h: 56, label: 'web Pod A', sub: '10.244.1.7:8080', color: 'green', round: true, info: 'A backend on the same node. Selection among backends is effectively random in iptables mode.' },
            { id: 'podB', x: 490, y: 265, w: 175, h: 56, label: 'web Pod B', sub: '10.244.2.4:8080', color: 'green', round: true, info: 'A backend on another node. The packet crosses nodes over the CNI network, Pod IP to Pod IP, with no NAT between Pods.' },
            { id: 'podC', x: 690, y: 265, w: 175, h: 56, label: 'web Pod C', sub: 'not Ready', color: 'red', round: true, info: 'Its readiness probe is failing, so it is marked not ready in the EndpointSlice and receives no Service traffic. It is not restarted for that reason.' },
            { id: 'kp2', x: 590, y: 370, w: 200, h: 56, label: 'kube-proxy', sub: 'same rules on node 2', color: 'teal', info: 'Every node holds the same Service rules, which is why a NodePort works on any node.' },
          ],
          edges: [
            { from: 'svc', to: 'eps', label: 'selector app=web', color: 'purple' },
            { from: 'eps', to: 'api', dashed: true, color: 'teal' },
            { from: 'kp', to: 'api', dashed: true, label: 'watch', color: 'teal' },
            { from: 'kp2', to: 'api', dashed: true, color: 'teal', bend: -60 },
            { from: 'client', to: 'coredns', label: 'DNS: web?', color: 'amber' },
            { from: 'client', to: 'kp', label: 'to 10.96.40.12', color: 'blue' },
            { from: 'kp', to: 'podA', color: 'green' },
            { from: 'kp', to: 'podB', label: 'DNAT', color: 'green' },
            { from: 'kp', to: 'podC', dashed: true, color: 'red', bend: -50 },
          ],
          steps: [
            { on: ['svc', 'api'], text: 'You create Service <b>web</b> with selector <code>app=web</code>. The API server stores it and allocates a <b>ClusterIP</b> from the service CIDR.' },
            { on: ['svc', 'eps', 'svc>eps', 'eps>api', 'podA', 'podB', 'podC'], text: 'The <b>EndpointSlice controller</b> finds Pods with <code>app=web</code> and records their IPs and readiness in an <b>EndpointSlice</b>. Pod C fails its readiness probe, so it is marked not ready.' },
            { on: ['kp', 'kp2', 'kp>api', 'kp2>api'], text: '<b>kube-proxy</b> on every node watches Services and EndpointSlices and programs kernel rules: “traffic to 10.96.40.12:80 → one of 10.244.1.7:8080, 10.244.2.4:8080”.' },
            { on: ['client', 'coredns', 'client>coredns'], text: 'The frontend calls <code>http://web</code>. Its resolver asks <b>CoreDNS</b>, which returns the ClusterIP for <code>web.shop.svc.cluster.local</code>.' },
            { on: ['client', 'kp', 'client>kp'], text: 'The packet leaves for 10.96.40.12:80. Before it leaves the node, the rules kube-proxy wrote catch it in the kernel. kube-proxy itself does not forward the packet.' },
            { on: ['kp', 'podB', 'kp>podB'], text: 'The rules <b>DNAT</b> the packet to a Ready backend, here Pod B on node 2, port 8080 (the <b>targetPort</b>). The CNI network carries it Pod-to-Pod across nodes.' },
            { on: ['podC', 'kp>podC'], text: 'Pod C is never chosen while it is not Ready. When its probe passes again, the EndpointSlice is updated and kube-proxy adds it back automatically.' },
          ],
        },
      ],
      tip: 'The ClusterIP is <b>virtual</b>: you cannot ping it reliably and no process listens on it. If the exam asks what “implements” a Service on each node, answer kube-proxy (or an eBPF replacement such as Cilium).',
    },

    {
      kicker: 'Data plane',
      title: 'kube-proxy modes and eBPF replacements',
      blocks: [
        { type: 'flip', items: [
          { front: 'iptables mode', back: 'Default on Linux for years. Writes iptables NAT rules per Service and endpoint; backend picked at random. Rule evaluation grows with the number of Services.' },
          { front: 'IPVS mode', back: 'Uses the kernel’s IP Virtual Server (hash tables) built for load balancing. Scales better for very many Services and offers algorithms such as round-robin and least-connection.' },
          { front: 'nftables mode', back: 'The newer mode using the nftables successor to iptables. Better performance and faster rule updates in large clusters.' },
          { front: 'eBPF (no kube-proxy)', back: 'CNIs such as Cilium load eBPF programs into the kernel to handle Service load balancing themselves, so kube-proxy can be removed entirely.' },
        ] },
        { type: 'callout', kind: 'info', title: 'kube-proxy is not a proxy in the data path', html: 'Despite its name, in all modern modes kube-proxy only <b>programs</b> the kernel. Packets are forwarded by the kernel (netfilter, IPVS or eBPF), not by the kube-proxy process.' },
      ],
      tip: 'Exam phrasing to watch: “Which component can replace kube-proxy?” → an eBPF-based CNI such as <b>Cilium</b>. CoreDNS and Ingress controllers cannot.',
    },

    {
      kicker: 'Service discovery',
      title: 'DNS names inside the cluster',
      blocks: [
        { type: 'text', html: '<b>CoreDNS</b> (a CNCF graduated project, deployed in <code>kube-system</code>) watches Services and Pods and answers DNS queries for them. The default cluster domain is <code>cluster.local</code>.' },
        { type: 'code', lang: 'bash', title: 'name patterns', code: `
# Service:        <service>.<namespace>.svc.cluster.local
web.shop.svc.cluster.local           # A record -> ClusterIP
web                                  # works from Pods in namespace shop
web.shop                             # works from any namespace
# Headless Service: one A record per Ready Pod
db-0.db.data.svc.cluster.local       # StatefulSet Pod db-0 via headless svc db
# Named port SRV record
_http._tcp.web.shop.svc.cluster.local
kubectl run tmp --rm -it --image=busybox:1.36 -- nslookup web.shop`, notes: { 2: 'Fully qualified domain name of a Service: <b>name.namespace.svc.cluster-domain</b>.', 3: 'Short names work thanks to the <code>search</code> domains in the Pod’s <code>/etc/resolv.conf</code>.', 4: 'Across namespaces you need at least <code>service.namespace</code>.', 6: 'StatefulSet Pods behind a headless Service get stable names: <code>pod-name.service.namespace.svc.cluster.local</code>.', 8: 'SRV records exist for named Service ports and include the port number.', 9: 'A quick throwaway Pod to test DNS from inside the cluster.' } },
        { type: 'check', q: 'A Pod in namespace <code>billing</code> must call Service <code>api</code> in namespace <code>orders</code>. Which name resolves correctly?', options: ['<code>api</code>', '<code>api.orders</code>', '<code>orders.api.svc.cluster.local</code>', '<code>api.billing.svc.cluster.local</code>'], answer: 1, explain: 'The pattern is <b>service.namespace</b>(<code>.svc.cluster.local</code>). Plain <code>api</code> would be searched in <code>billing</code> first and fail. The third option has the parts reversed, and the fourth points at the wrong namespace.', ref: 'https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/' },
      ],
      tip: 'Before CoreDNS, clusters used kube-dns. Environment variables (<code>WEB_SERVICE_HOST</code>) also exist but only for Services created <b>before</b> the Pod started, which is why DNS is preferred.',
    },

    {
      kicker: 'L7 entry',
      title: 'Ingress and ingress controllers',
      blocks: [
        { type: 'cols', ratio: '1.1fr 1fr', cols: [
          [
            { type: 'code', lang: 'yaml', title: 'ingress.yaml', code: `
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: shop
spec:
  ingressClassName: nginx
  tls:
  - hosts: [shop.example.com]
    secretName: shop-tls
  rules:
  - host: shop.example.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: api
            port:
              number: 80`, notes: { 1: 'Ingress lives in the <code>networking.k8s.io</code> API group.', 6: 'Selects which controller handles this Ingress via an IngressClass.', 7: 'TLS termination using a certificate stored in a Secret of type <code>kubernetes.io/tls</code>.', 11: 'Host-based routing: one external IP, many hostnames.', 14: 'Path-based routing to different Services.', 17: 'Ingress always routes to a <b>Service</b>, never directly to Pods by name.' } },
          ],
          [
            { type: 'bullets', items: [
              'An Ingress is just <b>rules</b> for HTTP(S): host, path, TLS. It does nothing until an <b>ingress controller</b> runs in the cluster.',
              'Controllers: NGINX-based, Traefik, HAProxy, Contour and other Envoy-based ones, cloud load balancer controllers.',
              'One LoadBalancer for the controller can serve <b>many</b> Services, instead of one cloud LB per Service.',
              'The Ingress API is stable but <b>frozen</b>: new features go into Gateway API. Anything beyond host/path/TLS needs controller-specific annotations.',
            ] },
            { type: 'callout', kind: 'trap', title: 'Not a Service type', html: '“Ingress” is a separate resource, not <code>type: Ingress</code> on a Service. It handles <b>L7 HTTP/HTTPS</b>, not arbitrary TCP/UDP.' },
          ],
        ] },
      ],
      tip: 'Scenario “route <code>/shop</code> and <code>/blog</code> on one hostname to two Services with TLS” → Ingress (or an HTTPRoute). Scenario “Ingress created, nothing happens” → no ingress controller installed.',
    },

    {
      kicker: 'Next generation',
      title: 'Gateway API: role-oriented traffic routing',
      blocks: [
        { type: 'text', html: '<b>Gateway API</b> is the official successor to Ingress, developed by SIG Network as CRDs (<code>gateway.networking.k8s.io</code>). Its v1.0 (GA) release came in October 2023. It splits configuration by <b>who owns it</b>.' },
        { type: 'layers', title: 'Resources and the roles that own them', items: [
          { label: 'GatewayClass', sub: 'infrastructure provider: which controller implements Gateways (like IngressClass)', color: 'purple' },
          { label: 'Gateway', sub: 'cluster operator: a listener (ports, protocols, TLS, allowed namespaces)', color: 'blue' },
          { label: 'HTTPRoute / GRPCRoute …', sub: 'application developer: match host, path, headers and route to Services', color: 'green' },
          { label: 'Service → Pods', sub: 'the backends', color: 'gray' },
        ] },
        { type: 'compare', headers: ['', 'Ingress', 'Gateway API'], rows: [
          ['Resources', 'Ingress (+ IngressClass)', 'GatewayClass, Gateway, HTTPRoute and other routes'],
          ['Ownership', 'One object mixes infra and app config', 'Role-oriented: provider, operator, developer'],
          ['Protocols', 'HTTP/HTTPS', 'HTTP, gRPC, TLS, TCP/UDP routes'],
          ['Advanced routing', 'Vendor annotations', 'Built in: header matching, traffic splitting (weights), redirects'],
          ['Status', 'Stable but frozen', 'Where new features land'],
        ] },
      ],
      tip: 'Keywords “role-oriented”, “GatewayClass”, “HTTPRoute” or “weighted traffic split without annotations” point to <b>Gateway API</b>.',
    },

    {
      kicker: 'Firewalling',
      title: 'NetworkPolicy: who may talk to whom',
      blocks: [
        { type: 'cols', ratio: '1fr 1fr', cols: [
          [
            { type: 'code', lang: 'yaml', title: 'default-deny + allow', code: `
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: shop
spec:
  podSelector: {}
  policyTypes: [Ingress]
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-from-frontend
  namespace: shop
spec:
  podSelector:
    matchLabels: {app: api}
  policyTypes: [Ingress]
  ingress:
  - from:
    - podSelector:
        matchLabels: {app: frontend}
    ports:
    - port: 8080`, notes: { 7: 'An empty <code>podSelector</code> selects <b>every Pod</b> in the namespace.', 8: 'Ingress listed with no ingress rules = deny all incoming traffic to the selected Pods. This is the <b>default-deny</b> pattern.', 17: 'This policy applies to Pods labelled <code>app=api</code>.', 21: 'Allowed sources: <code>podSelector</code>, <code>namespaceSelector</code> or <code>ipBlock</code>.', 24: 'Only TCP 8080 is opened. Policies add up: the default-deny plus this one allows exactly frontend → api:8080.' } },
          ],
          [
            { type: 'bullets', items: [
              'By default every Pod accepts traffic from everywhere: <b>allow-all</b>.',
              'Once <b>any</b> policy selects a Pod for a direction (Ingress or Egress), that direction becomes deny-by-default for that Pod, except what policies allow.',
              'Policies are <b>additive</b> (a union of allows). There is no explicit “deny” rule in the core API.',
              'Rules are L3/L4 (IPs, ports, labels). L7 rules need CNI extensions or a mesh.',
              'Enforced by the <b>CNI plugin</b> (Calico, Cilium…). With a non-enforcing CNI they are silently ignored.',
            ] },
            { type: 'callout', kind: 'warn', title: 'Egress default-deny breaks DNS', html: 'If you deny all egress, also allow UDP/TCP 53 to CoreDNS, or every name lookup fails.' },
          ],
        ] },
      ],
      tip: 'NetworkPolicy is <b>namespaced</b> and selects Pods by <b>labels</b>, not by Pod name or IP. It is the building block for zero-trust networking inside a cluster.',
    },

    {
      kicker: 'Service mesh',
      title: 'Service mesh: east-west traffic with superpowers',
      blocks: [
        { type: 'text', html: 'A <b>service mesh</b> moves networking concerns out of application code into infrastructure. A <b>data plane</b> of proxies handles every service-to-service (<b>east-west</b>) call; a <b>control plane</b> configures them.' },
        { type: 'cards', cols: 3, items: [
          { icon: 'lock', color: 'green', title: 'Security', text: '<b>Mutual TLS (mTLS)</b> between services with automatic certificate rotation; identity-based authorization policies.' },
          { icon: 'traffic-cone', color: 'blue', title: 'Traffic management', text: 'Retries, timeouts, circuit breaking, canary splits, fault injection.' },
          { icon: 'telescope', color: 'amber', title: 'Observability', text: 'Golden metrics (latency, errors, traffic) and distributed traces for every call, without code changes.' },
        ] },
        { type: 'compare', headers: ['', 'Istio', 'Linkerd'], rows: [
          ['Data plane', '<b>Envoy</b> sidecars, or <b>ambient</b> mode (sidecarless: per-node ztunnel + optional waypoint proxies)', 'Lightweight Rust micro-proxy (linkerd2-proxy) sidecars'],
          ['Focus', 'Feature-rich, highly configurable', 'Simplicity and low overhead'],
          ['CNCF status', 'Graduated', 'Graduated'],
        ] },
        { type: 'callout', kind: 'exam', title: 'Cue words', html: '“<b>Sidecar</b> proxy”, “<b>mTLS</b> between services without code changes”, “<b>east-west</b> traffic”, “traffic splitting between versions” → service mesh. <b>Envoy</b> is the proxy; Istio is the mesh that configures it. North-south (into the cluster) is the job of Ingress/Gateway.' },
      ],
      tip: 'Sidecars are injected into Pods by a <b>mutating admission webhook</b>, usually triggered by a namespace label. Sidecarless designs (Istio ambient, eBPF meshes) cut the per-Pod proxy overhead.',
    },

    {
      kicker: 'Practice',
      title: 'Match the requirement to the tool',
      blocks: [
        { type: 'match', pairs: [
          ['Stable internal virtual IP for a set of Pods', 'ClusterIP Service'],
          ['Alias a name to db.example.com', 'ExternalName Service'],
          ['Stable per-Pod DNS for a StatefulSet', 'Headless Service'],
          ['Host/path HTTP routing with one entry point', 'Ingress'],
          ['Role-oriented routing with HTTPRoute', 'Gateway API'],
          ['Only frontend Pods may reach the API Pods', 'NetworkPolicy'],
          ['mTLS between all services automatically', 'Service mesh'],
        ] },
        { type: 'check', q: 'A team applies a NetworkPolicy that allows only Pods labelled <code>role=frontend</code> to reach the <code>db</code> Pods. Testing shows every Pod can still connect. What is the most likely cause?', options: ['NetworkPolicies only take effect after the Pods are restarted', 'The cluster’s CNI plugin does not enforce NetworkPolicy', 'kube-proxy must be switched to IPVS mode', 'The policy must be created in the kube-system namespace'], answer: 1, explain: 'NetworkPolicy is <b>implemented by the CNI plugin</b>. With a plugin that does not enforce it (e.g. Flannel on its own) the object is accepted but ignored. Policies apply to running Pods immediately, kube-proxy mode is unrelated, and policies belong in the namespace of the Pods they select.', ref: 'https://kubernetes.io/docs/concepts/services-networking/network-policies/' },
      ],
    },
  ],

  summary: [
    'Network model: <b>every Pod gets its own IP</b>, Pods reach each other <b>without NAT</b>, containers in a Pod share <b>localhost</b>. A <b>CNI plugin</b> (Calico, Cilium, Flannel) implements it.',
    'A <b>Service</b> selects Pods by labels; the EndpointSlice controller tracks Ready Pod IPs; <b>kube-proxy</b> (iptables, IPVS, nftables) or an eBPF CNI programs the forwarding rules.',
    'Types: <b>ClusterIP</b> (default, internal), <b>NodePort</b> (30000-32767 on every node), <b>LoadBalancer</b> (cloud LB), <b>ExternalName</b> (CNAME), <b>headless</b> (<code>clusterIP: None</code>, Pod IPs in DNS).',
    '<code>port</code> = Service port, <code>targetPort</code> = container port, <code>nodePort</code> = port on each node.',
    'DNS via <b>CoreDNS</b>: <code>service.namespace.svc.cluster.local</code>.',
    '<b>Ingress</b> = HTTP(S) host/path rules that need an ingress controller; <b>Gateway API</b> (GatewayClass → Gateway → HTTPRoute) is its role-oriented successor.',
    '<b>NetworkPolicy</b>: allow-all until a policy selects a Pod; additive; enforced by the CNI. <b>Service mesh</b> (Istio, Linkerd, Envoy) adds mTLS, traffic control and telemetry for east-west traffic.',
  ],

  glossary: [
    { term: 'CNI', def: 'Container Network Interface: the plugin standard the runtime calls to attach Pods to the network and assign their IPs.' },
    { term: 'Pod network model', def: 'Each Pod has a unique IP and can reach every other Pod without NAT; containers in a Pod share one network namespace.' },
    { term: 'Service', def: 'Stable virtual IP and DNS name that load-balances to a set of Pods chosen by a label selector.' },
    { term: 'ClusterIP', def: 'Default Service type: a virtual IP reachable only from inside the cluster.' },
    { term: 'NodePort', def: 'Service type that opens the same port (default range 30000-32767) on every node.' },
    { term: 'LoadBalancer', def: 'Service type that provisions an external load balancer, usually via the cloud-controller-manager.' },
    { term: 'ExternalName', def: 'Service type that returns a DNS CNAME to an external hostname; no proxying or selector.' },
    { term: 'Headless Service', def: 'Service with clusterIP: None; DNS returns the IPs of the individual Pods. Used by StatefulSets.' },
    { term: 'EndpointSlice', def: 'Object listing the IPs, ports and readiness of the backends of a Service; replaces the older Endpoints object.' },
    { term: 'targetPort', def: 'The container port a Service forwards traffic to (number or named port).' },
    { term: 'kube-proxy', def: 'Per-node component that programs iptables, IPVS or nftables rules implementing Service virtual IPs.' },
    { term: 'CoreDNS', def: 'CNCF graduated DNS server used as the cluster DNS; resolves service.namespace.svc.cluster.local.' },
    { term: 'Ingress', def: 'API object with HTTP(S) host/path routing and TLS rules, implemented by an ingress controller.' },
    { term: 'Gateway API', def: 'Role-oriented successor to Ingress: GatewayClass, Gateway and Route resources (HTTPRoute, GRPCRoute…).' },
    { term: 'NetworkPolicy', def: 'Namespaced object that restricts Pod ingress/egress by labels, namespaces, IP blocks and ports; enforced by the CNI.' },
    { term: 'Service mesh', def: 'Infrastructure layer of proxies (sidecar or sidecarless) adding mTLS, traffic management and telemetry to service-to-service calls.' },
  ],

  quiz: [
    { q: 'Which statement is part of the Kubernetes network model?', options: ['Containers in the same Pod each receive their own IP address', 'Each node shares a single IP with all of its Pods', 'Pods on different nodes must communicate through a Service', 'Pods can communicate with all other Pods without NAT'], answer: 3, explain: 'The model requires that every Pod can reach every other Pod <b>without NAT</b>, using its own IP. Containers in one Pod <b>share</b> an IP (localhost), and Services are optional for Pod-to-Pod traffic: they add a stable name and load balancing.', ref: 'https://kubernetes.io/docs/concepts/services-networking/' },
    { q: 'Which component is responsible for assigning an IP address to a new Pod and connecting it to the cluster network?', options: ['kube-proxy', 'CoreDNS', 'The CNI plugin', 'The kube-scheduler'], answer: 2, explain: 'The container runtime calls the <b>CNI plugin</b> when the Pod sandbox is created; it creates the interface and allocates the IP. kube-proxy handles Service rules, CoreDNS handles names and the scheduler only picks a node.', ref: 'https://kubernetes.io/docs/concepts/extend-kubernetes/compute-storage-net/network-plugins/' },
    { q: 'A Service is defined with <code>port: 80</code> and <code>targetPort: 8080</code>. What does this mean?', options: ['Clients connect to the Service on 80, and traffic is forwarded to container port 8080', 'Clients connect to the Service on 8080, and the container listens on 80', 'Port 80 is opened on every node and 8080 on the load balancer', 'The Service listens on both 80 and 8080'], answer: 0, explain: '<b>port</b> is what callers use on the ClusterIP; <b>targetPort</b> is where the container listens. Opening a port on every node is the <b>nodePort</b> field, which is unrelated here.', ref: 'https://kubernetes.io/docs/concepts/services-networking/service/' },
    { q: 'Which Service type should you use so that in-cluster clients can reach an external database through the name <code>db</code>, which maps to <code>prod-db.example.com</code>?', options: ['NodePort', 'Headless', 'ExternalName', 'LoadBalancer'], answer: 2, explain: '<b>ExternalName</b> makes CoreDNS return a CNAME to the external hostname, with no proxying. Headless returns Pod IPs, NodePort and LoadBalancer expose cluster workloads to the outside, the opposite direction.', ref: 'https://kubernetes.io/docs/concepts/services-networking/service/' },
    { q: 'You create a NodePort Service without specifying <code>nodePort</code>. Which port could Kubernetes assign by default?', options: ['8080', '443', '31245', '6443'], answer: 2, explain: 'NodePorts come from the default range <b>30000-32767</b>, so 31245 is valid. 6443 is the usual API server port, and 80/443/8080 are outside the range.', ref: 'https://kubernetes.io/docs/concepts/services-networking/service/' },
    { q: 'What is the fully qualified DNS name of Service <code>cart</code> in namespace <code>shop</code> with the default cluster domain?', options: ['<code>shop.cart.svc.cluster.local</code>', '<code>cart.shop.pod.cluster.local</code>', '<code>cart.svc.shop.cluster.local</code>', '<code>cart.shop.svc.cluster.local</code>'], answer: 3, explain: 'The pattern is <b>service.namespace.svc.cluster.local</b>. The first option swaps service and namespace, and the <code>pod</code> zone is used for Pod records, not Services.', ref: 'https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/' },
    { q: 'What happens to a Pod whose readiness probe starts failing while it is behind a Service?', options: ['The kubelet restarts the container immediately', 'It is removed from the Service’s endpoints until the probe passes again', 'The Pod is evicted and rescheduled on another node', 'The Service switches to a headless configuration'], answer: 1, explain: 'Readiness controls <b>traffic</b>: the Pod is marked not ready in its EndpointSlice and receives no Service traffic, but keeps running. Restarting containers is what a failing <b>liveness</b> probe triggers.', ref: 'https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/' },
    { q: 'Which TWO statements about NetworkPolicy are true? (Select 2)', options: ['Without any NetworkPolicy, Pods accept traffic from all sources', 'NetworkPolicies are enforced by kube-proxy', 'Multiple policies selecting the same Pod combine additively', 'A NetworkPolicy can explicitly deny traffic that another policy allows'], answer: [0, 2], explain: 'The default is <b>allow-all</b>; once policies select a Pod, the allowed traffic is the <b>union</b> of their rules. Enforcement is done by the <b>CNI plugin</b>, not kube-proxy, and the core API has no deny rules, so one policy cannot cancel another’s allow.', ref: 'https://kubernetes.io/docs/concepts/services-networking/network-policies/' },
    { q: 'Which Gateway API resource is typically owned by application developers to route requests by host and path to their Services?', options: ['GatewayClass', 'Gateway', 'HTTPRoute', 'IngressClass'], answer: 2, explain: 'Developers own <b>HTTPRoute</b> objects. GatewayClass is defined by the infrastructure provider, Gateway (listeners, TLS) by the cluster operator. IngressClass belongs to the older Ingress API.', ref: 'https://kubernetes.io/docs/concepts/services-networking/gateway/' },
    { q: 'An Ingress resource has been created correctly, but no traffic is routed and the Ingress never gets an address. What is most likely missing?', options: ['An ingress controller running in the cluster', 'A headless Service', 'A NetworkPolicy allowing port 80', 'The kube-proxy IPVS mode'], answer: 0, explain: 'An Ingress is only a set of rules. An <b>ingress controller</b> (NGINX-based, Traefik, Envoy-based…) must watch it and configure a proxy. The other options do not act on Ingress objects.', ref: 'https://kubernetes.io/docs/concepts/services-networking/ingress-controllers/' },
    { q: 'Which TWO keywords in a scenario most strongly indicate that a service mesh is the right answer? (Select 2)', options: ['Mutual TLS between services without code changes', 'Persistent storage for stateful workloads', 'Sidecar proxies handling east-west traffic', 'Assigning Pods to nodes with GPUs'], answer: [0, 2], explain: 'Service meshes (Istio, Linkerd) add <b>mTLS</b>, retries and telemetry through <b>sidecar</b> (or sidecarless) proxies for <b>east-west</b> traffic. Storage is CSI/PersistentVolumes, and GPU placement is a scheduling concern (node affinity, taints).', ref: 'https://glossary.cncf.io/service-mesh/' },
    { q: 'Which project can replace kube-proxy by implementing Service load balancing with eBPF?', options: ['Flannel', 'CoreDNS', 'Linkerd', 'Cilium'], answer: 3, explain: '<b>Cilium</b> uses eBPF programs in the kernel for Service load balancing and can run without kube-proxy. Flannel is a simple overlay CNI, CoreDNS serves DNS, and Linkerd is a service mesh that relies on Services already working.', ref: 'https://docs.cilium.io/en/stable/overview/intro/' },
  ],
});
