KS.registerChapter('kcna', {
  id: 'observability',
  title: 'Observability',
  subtitle: 'Metrics, logs and traces: Prometheus, OpenTelemetry, Jaeger, Fluent Bit and the SLOs they serve',
  icon: '🔭',
  minutes: 30,
  objectives: [
    'Distinguish monitoring from observability and name the signals (metrics, logs, traces, plus events and profiles)',
    'Explain how Prometheus collects, stores, queries and alerts on metrics, and the four metric types',
    'Place OpenTelemetry, Jaeger, Fluentd/Fluent Bit and Grafana in an observability stack',
    'Tell metrics-server, kube-state-metrics and cAdvisor apart',
    'Define SLI, SLO, SLA and error budget, and describe cost observability with OpenCost',
  ],

  slides: [
    {
      kicker: 'Concepts',
      title: 'Monitoring vs observability',
      blocks: [
        { type: 'text', html: '<b>Monitoring</b> watches for problems you already know about: predefined dashboards and alerts (“CPU > 90%”). <b>Observability</b> is a property of the system: how well you can understand its <i>internal state</i> from the data it emits, so you can answer questions you did not plan for (“why are checkout requests from one region slow since 14:05?”). In a distributed, constantly changing microservices system, the second matters most.' },
        { type: 'compare', headers: ['', 'Monitoring', 'Observability'], rows: [
          ['Question type', 'Known unknowns: is it broken?', 'Unknown unknowns: why is it broken?'],
          ['Approach', 'Predefined checks, thresholds, dashboards', 'Rich, correlated telemetry you can explore'],
          ['Typical output', 'An alert fires', 'A root cause found by slicing metrics, logs and traces'],
          ['Relationship', 'A subset of observability', 'Includes monitoring, goes further'],
        ] },
        { type: 'callout', kind: 'info', title: 'Telemetry', html: '<b>Telemetry</b> is the data a system emits about itself. Observability tooling collects, stores, correlates and visualises it.' },
      ],
      tip: 'If an exam option says observability means “understanding internal state from external outputs”, that is the textbook definition.',
    },

    {
      kicker: 'Signals',
      title: 'The three pillars, plus events and profiles',
      blocks: [
        { type: 'flip', items: [
          { front: '📈 Metrics', back: 'Numeric measurements over time (time series) with labels. Cheap to store, great for dashboards, trends and alerting. Answer “is something wrong and how much?”. Tool: Prometheus.' },
          { front: '📜 Logs', back: 'Timestamped, discrete text or structured (JSON) records of events inside an application. Rich detail, expensive at volume. Answer “what exactly happened?”. Tools: Fluentd, Fluent Bit.' },
          { front: '🧵 Traces', back: 'The end-to-end path of one request across services, made of spans with timings. Answer “where is the time spent / which service failed?”. Tools: Jaeger, OpenTelemetry.' },
          { front: '📣 Events', back: 'Kubernetes Event objects (Scheduled, Pulling, BackOff, FailedScheduling…). Seen with <code>kubectl get events</code> or <code>kubectl describe</code>. Short-lived: kept about one hour by default.' },
          { front: '🔥 Profiles', back: 'Continuous profiling: which functions use CPU or memory, shown as flame graphs. Often called the emerging “fourth pillar”; OpenTelemetry is adding a profiling signal.' },
        ] },
        { type: 'check', q: 'Users report that one API call is slow, and the call passes through six microservices. Which signal best shows which service adds the latency?', options: ['Metrics', 'Distributed traces', 'Kubernetes Events', 'Container logs'], answer: 1, explain: 'A <b>trace</b> records every hop of one request as spans with durations, so the slow span stands out. Metrics show that latency rose but not where in the call chain; logs are per-service and hard to stitch together; Events describe cluster objects, not requests.', ref: 'https://opentelemetry.io/docs/concepts/signals/traces/' },
      ],
      tip: 'Keyword map: <b>time series / aggregation / alerting</b> → metrics. <b>Discrete records</b> → logs. <b>Request path across services / spans</b> → traces.',
    },

    {
      kicker: 'Big picture · interactive',
      title: 'A typical cloud native observability stack',
      blocks: [
        { type: 'diagram', width: 900, height: 440,
          caption: 'Click any component for details, or press ▶ Play to follow the data from the app to your screen.',
          groups: [
            { x: 20, y: 20, w: 250, h: 400, label: 'Sources', color: 'blue' },
            { x: 300, y: 20, w: 290, h: 400, label: 'Collect & store', color: 'green' },
            { x: 620, y: 20, w: 260, h: 400, label: 'Act & visualise', color: 'amber' },
          ],
          nodes: [
            { id: 'app', x: 45, y: 60, w: 200, h: 60, label: 'App + OTel SDK', icon: '🧩', sub: '/metrics, spans, logs', color: 'blue', info: 'Your service, instrumented with the OpenTelemetry API/SDK (or a Prometheus client library). It exposes metrics on <code>/metrics</code>, emits trace spans and writes logs to stdout/stderr.' },
            { id: 'exp', x: 45, y: 170, w: 200, h: 56, label: 'Exporters', icon: '🔌', sub: 'node, KSM, blackbox', color: 'teal', info: 'Prometheus exporters translate third-party metrics into the Prometheus format: node_exporter (host), kube-state-metrics (object state), database exporters, blackbox_exporter (probes).' },
            { id: 'logs', x: 45, y: 280, w: 200, h: 56, label: 'stdout / stderr', icon: '📜', sub: '/var/log/pods on node', color: 'gray', info: 'Containers should log to stdout/stderr. The container runtime writes these streams to files on the node, which <code>kubectl logs</code> and log agents read.' },
            { id: 'otel', x: 330, y: 50, w: 230, h: 56, label: 'OTel Collector', icon: '🛰️', sub: 'receive → process → export', color: 'purple', info: 'Vendor-neutral pipeline. Receives OTLP (and other formats), processes (batch, filter, add attributes), and exports to any backend: Jaeger, Prometheus, a commercial vendor…' },
            { id: 'prom', x: 330, y: 160, w: 230, h: 60, label: 'Prometheus', icon: '🔥', sub: 'scrape (pull) + TSDB', color: 'red', info: 'Pulls metrics over HTTP from targets found by service discovery, stores them in its local time-series database and evaluates alerting rules written in PromQL.' },
            { id: 'jaeger', x: 330, y: 260, w: 110, h: 56, label: 'Jaeger', icon: '🧵', sub: 'traces', color: 'pink', info: 'Distributed tracing backend: stores spans and lets you search traces and view the waterfall of a single request.' },
            { id: 'fb', x: 450, y: 260, w: 120, h: 56, label: 'Fluent Bit', icon: '🐦', sub: 'DaemonSet', color: 'teal', info: 'Lightweight log processor running as a DaemonSet: one per node, tails container log files, enriches them with Kubernetes metadata and forwards them to a log store.' },
            { id: 'store', x: 330, y: 350, w: 240, h: 50, label: 'Log store', icon: '🗃️', sub: 'e.g. OpenSearch, Loki', color: 'gray', info: 'Where logs are indexed and searched. Kubernetes itself has no cluster-level log storage, so you must add one.' },
            { id: 'am', x: 645, y: 160, w: 210, h: 60, label: 'Alertmanager', icon: '🚨', sub: 'group, route, silence', color: 'amber', info: 'Receives alerts from Prometheus, deduplicates, groups and routes them to receivers (email, Slack, PagerDuty, webhooks), and supports silences and inhibition.' },
            { id: 'graf', x: 645, y: 280, w: 210, h: 60, label: 'Grafana', icon: '📊', sub: 'dashboards', color: 'green', info: 'Visualisation layer that queries many data sources (Prometheus, Jaeger, log stores) in one dashboard. Note: Grafana is a Grafana Labs project, not a CNCF project.' },
            { id: 'oncall', x: 645, y: 60, w: 210, h: 56, label: 'On-call engineer', icon: '📟', color: 'gray', info: 'The human who gets paged. Good alerting pages only on symptoms that threaten an SLO.' },
          ],
          edges: [
            { from: 'app', to: 'otel', label: 'OTLP', color: 'purple' },
            { from: 'prom', to: 'app', label: 'scrape', color: 'red', dashed: true },
            { from: 'prom', to: 'exp', label: 'scrape', color: 'red', dashed: true },
            { from: 'otel', to: 'jaeger', color: 'pink', bend: -30 },
            { from: 'logs', to: 'fb', label: 'tail', color: 'teal' },
            { from: 'fb', to: 'store', color: 'teal' },
            { from: 'prom', to: 'am', label: 'alerts', color: 'amber' },
            { from: 'am', to: 'oncall', label: 'notify', color: 'amber' },
            { from: 'graf', to: 'prom', label: 'PromQL', color: 'green', dashed: true },
            { from: 'graf', to: 'jaeger', color: 'green', dashed: true },
          ],
          steps: [
            { on: ['app'], text: 'The application is <b>instrumented</b>: a client library or the OpenTelemetry SDK produces metrics, spans and logs.' },
            { on: ['prom', 'app', 'exp', 'prom>app', 'prom>exp'], text: 'Prometheus <b>pulls</b> (scrapes) <code>/metrics</code> from the app and from exporters every scrape interval and stores samples in its TSDB.' },
            { on: ['app', 'otel', 'jaeger', 'app>otel', 'otel>jaeger'], text: 'Spans are sent over <b>OTLP</b> to the OpenTelemetry Collector, which batches them and exports them to <b>Jaeger</b>.' },
            { on: ['logs', 'fb', 'store', 'logs>fb', 'fb>store'], text: 'Containers log to <b>stdout/stderr</b>; a <b>Fluent Bit DaemonSet</b> tails the node log files and ships them to a log store.' },
            { on: ['prom', 'am', 'oncall', 'prom>am', 'am>oncall'], text: 'Prometheus evaluates <b>alerting rules</b>. Firing alerts go to <b>Alertmanager</b>, which groups, deduplicates and routes them to the on-call engineer.' },
            { on: ['graf', 'prom', 'jaeger', 'graf>prom', 'graf>jaeger'], text: '<b>Grafana</b> queries Prometheus (PromQL), Jaeger and log stores to show everything side by side for investigation.' },
          ],
        },
      ],
      tip: 'Remember the split: <b>Prometheus stores and alerts</b>, <b>Alertmanager notifies</b>, <b>Grafana visualises</b>. Grafana does not scrape targets itself.',
    },

    {
      kicker: 'Prometheus',
      title: 'How Prometheus collects metrics',
      blocks: [
        { type: 'cols', ratio: '1fr 1.1fr', cols: [
          [
            { type: 'bullets', items: [
              '<b>Pull model</b>: Prometheus scrapes HTTP endpoints (by convention <code>/metrics</code>) at a fixed interval.',
              '<b>Service discovery</b> (including Kubernetes SD) finds targets automatically as Pods come and go.',
              '<b>Exporters</b> expose metrics for software you cannot instrument: node_exporter, blackbox_exporter, database exporters.',
              'Samples go into a local <b>time-series database (TSDB)</b> on disk. For long-term or global storage, add projects such as Thanos or Cortex (both CNCF incubating).',
              '<b>Pushgateway</b> exists only for short-lived batch jobs that end before they can be scraped.',
              'CNCF <b>graduated</b>; the second project to join the CNCF, after Kubernetes.',
            ] },
          ],
          [
            { type: 'code', lang: 'bash', title: 'curl http://web:8080/metrics', code: `
# HELP http_requests_total Total HTTP requests.
# TYPE http_requests_total counter
http_requests_total{method="GET",code="200"} 10234
http_requests_total{method="POST",code="500"} 12
# HELP process_resident_memory_bytes RSS memory.
# TYPE process_resident_memory_bytes gauge
process_resident_memory_bytes 2.6e+07
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.1"} 900
http_request_duration_seconds_bucket{le="0.5"} 990
http_request_duration_seconds_bucket{le="+Inf"} 1000
http_request_duration_seconds_sum 87.3
http_request_duration_seconds_count 1000`, notes: {
              1: 'The <b>Prometheus text exposition format</b>. OpenMetrics is the standardised evolution of this format, not a separate tool.',
              2: '<code># TYPE</code> declares the metric type. Counters end in <code>_total</code> by convention.',
              3: 'Metric name + <b>labels</b> in braces + value. Each unique label combination is a separate time series.',
              7: 'A gauge: the current value, can go up and down.',
              9: 'Histogram buckets are cumulative: 900 requests took ≤ 0.1 s. <code>le</code> means “less than or equal”.',
              12: '<code>_sum</code> and <code>_count</code> let you compute an average latency.',
            } },
          ],
        ] },
        { type: 'callout', kind: 'trap', title: 'Push vs pull', html: '“Prometheus requires applications to push metrics to it” is <b>false</b>. Prometheus is <b>pull-based</b>. Pushgateway is a narrow exception for batch jobs, not the normal path.' },
      ],
      tip: 'Exam cue: “pull-based metrics collection with a multi-dimensional data model and its own query language” = <b>Prometheus</b>.',
    },

    {
      kicker: 'Prometheus',
      title: 'The four metric types',
      blocks: [
        { type: 'compare', headers: ['Type', 'Behaviour', 'Typical example', 'Typical query'], rows: [
          ['Counter', 'Only goes up (resets to 0 on restart)', 'requests served, errors, bytes sent', '<code>rate(x_total[5m])</code>'],
          ['Gauge', 'Goes up and down', 'memory in use, queue length, temperature', 'Use the value directly, <code>avg_over_time</code>'],
          ['Histogram', 'Counts observations into configurable buckets (+ sum, count)', 'request latency, response size', '<code>histogram_quantile(0.95, …)</code> on the server side'],
          ['Summary', 'Calculates quantiles in the client (+ sum, count)', 'latency percentiles from one instance', 'Read the precomputed quantile; cannot be aggregated across instances'],
        ] },
        { type: 'check', q: 'You need to track the number of messages currently waiting in a queue, a value that rises and falls. Which Prometheus metric type fits?', options: ['Counter', 'Histogram', 'Gauge', 'Summary'], answer: 2, explain: 'A <b>gauge</b> represents a value that can go up and down. A counter only increases, so it cannot represent a shrinking queue. Histograms and summaries describe distributions of observations such as latency.', ref: 'https://prometheus.io/docs/concepts/metric_types/' },
      ],
      tip: 'Never graph a raw counter: wrap it in <code>rate()</code> or <code>increase()</code>. Histograms can be aggregated across Pods; summaries cannot.',
    },

    {
      kicker: 'Prometheus',
      title: 'PromQL, labels and cardinality',
      blocks: [
        { type: 'code', lang: 'promql', title: 'PromQL you should recognise', code: `
http_requests_total{job="web", code="500"}
rate(http_requests_total[5m])
sum by (namespace) (rate(container_cpu_usage_seconds_total[5m]))
histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))
up == 0
kube_deployment_status_replicas_available < kube_deployment_spec_replicas`, notes: {
          1: 'An <b>instant vector selector</b> filtered by label matchers.',
          2: '<code>[5m]</code> makes a <b>range vector</b>; <code>rate()</code> gives the per-second increase of a counter over that window.',
          3: 'Aggregate per namespace. <code>sum by</code> keeps only the listed labels.',
          4: 'p95 latency computed from histogram buckets.',
          5: '<code>up</code> is generated by Prometheus for every target: 1 = last scrape succeeded, 0 = failed. A classic alert.',
          6: 'kube-state-metrics series: a Deployment has fewer available replicas than desired.',
        } },
        { type: 'callout', kind: 'warn', title: 'Cardinality', html: 'Every unique combination of label values is a new time series. Labels like <code>user_id</code>, <code>email</code> or a request ID create <b>high cardinality</b>: millions of series, huge memory use and slow queries. Use labels for bounded dimensions (method, status code, namespace); put unbounded detail in logs or traces.' },
      ],
      tip: 'PromQL is the query language of Prometheus. Grafana dashboards and Prometheus alerting rules both use it.',
    },

    {
      kicker: 'Alerting & operators',
      title: 'Alertmanager and the Prometheus Operator',
      blocks: [
        { type: 'flow', items: [
          { icon: '📐', label: 'Alerting rule', sub: 'PromQL + for: 5m', info: 'Prometheus evaluates rules periodically. An expression must stay true for the <code>for</code> duration before the alert moves from pending to firing.' },
          { icon: '🔥', label: 'Prometheus fires', sub: 'sends alert', info: 'Prometheus does not send email or chat messages itself; it pushes firing alerts to Alertmanager.' },
          { icon: '🧹', label: 'Deduplicate & group', sub: 'Alertmanager', info: 'Alerts from HA Prometheus pairs are deduplicated; many similar alerts (e.g. 50 Pods down) are grouped into one notification.' },
          { icon: '🤫', label: 'Silence / inhibit', sub: 'mute noise', info: '<b>Silences</b> mute alerts for a time window (maintenance). <b>Inhibition</b> suppresses lower-level alerts while a related higher-level alert fires (node down hides its Pod alerts).' },
          { icon: '📟', label: 'Route to receiver', sub: 'Slack, email, pager', info: 'A routing tree sends alerts to receivers based on labels such as team or severity.' },
        ] },
        { type: 'code', lang: 'yaml', title: 'servicemonitor.yaml (Prometheus Operator CRD)', code: `
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: web
  labels:
    release: prometheus
spec:
  selector:
    matchLabels:
      app: web
  endpoints:
  - port: metrics
    interval: 30s`, notes: {
          2: '<b>ServiceMonitor</b> is a custom resource from the Prometheus Operator. Others: <code>PodMonitor</code>, <code>PrometheusRule</code>, <code>Prometheus</code>, <code>Alertmanager</code>.',
          6: 'The Prometheus instance selects ServiceMonitors by label.',
          8: 'Selects the <b>Services</b> whose endpoints should be scraped.',
          12: 'Named Service port that serves <code>/metrics</code>; the operator turns this into scrape configuration.',
        } },
      ],
      tip: 'Which object tells an operator-managed Prometheus what to scrape in Kubernetes? A <b>ServiceMonitor</b> (or PodMonitor). Alert rules live in a <b>PrometheusRule</b>.',
    },

    {
      kicker: 'OpenTelemetry',
      title: 'OpenTelemetry: one vendor-neutral standard for telemetry',
      blocks: [
        { type: 'text', html: '<b>OpenTelemetry (OTel)</b> is a CNCF incubating project formed in 2019 by merging <b>OpenTracing</b> and <b>OpenCensus</b>. It standardises how you <i>generate, collect and export</i> traces, metrics and logs, so you instrument once and send data to any backend. It is <b>not</b> a storage backend or a dashboard.' },
        { type: 'cards', cols: 2, items: [
          { icon: '📝', color: 'blue', title: 'API', text: 'Language-specific interfaces your code calls to create spans and record metrics. Safe to use in libraries; does nothing until an SDK is configured.' },
          { icon: '⚙️', color: 'purple', title: 'SDK', text: 'The implementation of the API: sampling, batching, resource attributes and exporters. Auto-instrumentation agents exist for many languages.' },
          { icon: '🛰️', color: 'green', title: 'Collector', text: 'Standalone binary: <b>receivers → processors → exporters</b>. Runs as an agent (sidecar or DaemonSet) or as a central gateway Deployment.' },
          { icon: '📡', color: 'amber', title: 'OTLP', text: 'OpenTelemetry Protocol over gRPC or HTTP. The native wire format between SDKs, Collectors and backends.' },
        ] },
        { type: 'callout', kind: 'trap', title: 'OpenTelemetry ≠ OpenMetrics ≠ OpenTracing', html: '<b>OpenMetrics</b> is a text <i>format</i> for exposing metrics, derived from the Prometheus exposition format. <b>OpenTracing</b> was a tracing API, now archived and superseded by OTel. <b>OpenTelemetry</b> is the full project covering all signals.' },
      ],
      tip: 'Exam cue: “vendor-neutral instrumentation for traces, metrics and logs” = <b>OpenTelemetry</b>. “Pipeline that receives, processes and exports telemetry” = <b>OTel Collector</b>.',
    },

    {
      kicker: 'Tracing',
      title: 'Distributed tracing with Jaeger',
      blocks: [
        { type: 'cols', cols: [
          [
            { type: 'bullets', items: [
              'A <b>trace</b> is the whole journey of one request; it has a unique <b>trace ID</b>.',
              'A <b>span</b> is one unit of work in that journey (an HTTP call, a DB query) with a span ID, parent span ID, start time, duration and attributes.',
              '<b>Context propagation</b> passes the trace ID and parent span ID to the next service, usually in HTTP headers (W3C Trace Context <code>traceparent</code>).',
              '<b>Sampling</b> keeps only a share of traces to control cost: head-based (decide at the start) or tail-based (decide after seeing the whole trace, e.g. keep all errors).',
              '<b>Jaeger</b>: CNCF graduated tracing backend, created at Uber. Its own client libraries are retired in favour of OpenTelemetry SDKs, and Jaeger v2 is built on the OTel Collector.',
            ] },
          ],
          [
            { type: 'code', lang: 'bash', title: 'context propagation between services', code: `
GET /checkout HTTP/1.1
Host: payments
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01`, notes: {
              3: '<b>W3C traceparent</b>: version - <b>trace ID</b> (same for every span of this request) - <b>parent span ID</b> - flags (01 = sampled). Without this header the trace breaks into disconnected pieces.',
            } },
            { type: 'callout', kind: 'info', title: 'Service mesh helps, but…', html: 'Meshes such as Istio or Linkerd can emit spans for every hop, but the application must still <b>forward</b> the trace headers for the spans to join into one trace.' },
          ],
        ] },
      ],
      tip: 'If the question mentions <b>spans</b>, <b>trace IDs</b> or <b>latency across microservices</b>, the answer is tracing: Jaeger (backend) or OpenTelemetry (instrumentation).',
    },

    {
      kicker: 'Logging',
      title: 'Logging architectures in Kubernetes',
      blocks: [
        { type: 'text', html: 'Containers should write logs to <b>stdout and stderr</b>. The runtime stores them in files on the node, and <code>kubectl logs</code> reads them through the kubelet. When a Pod is deleted or the node dies, those logs are gone: Kubernetes provides <b>no cluster-level log storage</b>, so you add a logging pipeline.' },
        { type: 'compare', headers: ['Pattern', 'How it works', 'Pros', 'Cons'], rows: [
          ['Node-level agent (most common)', 'A <b>DaemonSet</b> (Fluent Bit / Fluentd) tails <code>/var/log/pods</code> on every node and forwards logs', 'One agent per node, no app change', 'Only works if apps log to stdout/stderr'],
          ['Sidecar container', 'A sidecar in the Pod reads the app’s log files and streams them to stdout or a backend', 'Handles apps that only write to files', 'Extra container per Pod, more resources'],
          ['Direct from app', 'The application ships logs to the backend itself (library / OTLP)', 'No agent needed', 'Couples the app to the logging backend'],
        ] },
        { type: 'compare', headers: ['', 'Fluentd', 'Fluent Bit'], rows: [
          ['Written in', 'C and Ruby', 'C'],
          ['Footprint', 'Heavier, huge plugin ecosystem', 'Very light, built for edge and per-node agents'],
          ['Typical role', 'Central aggregator / processor', 'Node agent DaemonSet, forwarding to Fluentd or a backend'],
          ['CNCF status', 'Graduated', 'Part of the graduated Fluentd project'],
        ] },
      ],
      tip: 'Which workload type runs one log collector on every node? A <b>DaemonSet</b>. Fluentd and Fluent Bit both describe themselves as a “unified logging layer”.',
    },

    {
      kicker: 'Cluster metrics',
      title: 'metrics-server vs kube-state-metrics vs cAdvisor',
      blocks: [
        { type: 'compare', headers: ['Component', 'What it reports', 'Source', 'Used by'], rows: [
          ['cAdvisor', 'Per-container CPU, memory, filesystem, network usage', 'Built into the <b>kubelet</b>', 'kubelet resource metrics, Prometheus scrapes'],
          ['metrics-server', 'Current CPU and memory of Pods and nodes (in memory only, no history)', 'Scrapes each kubelet, serves the <b>Metrics API</b> (<code>metrics.k8s.io</code>)', '<code>kubectl top</code>, HPA, VPA'],
          ['kube-state-metrics', 'State of Kubernetes <b>objects</b>: desired vs available replicas, Pod phase, restarts, Job status', 'Watches the <b>API server</b>', 'Prometheus dashboards and alerts'],
          ['node_exporter', 'Host-level OS metrics: disk, CPU, network of the node', 'Runs as a DaemonSet', 'Prometheus'],
        ] },
        { type: 'callout', kind: 'trap', title: 'metrics-server is not monitoring', html: 'metrics-server keeps only the latest values for autoscaling and <code>kubectl top</code>. It is not a time-series database, has no history and no alerting. If <code>kubectl top</code> says “Metrics API not available”, metrics-server is missing.' },
        { type: 'match', title: 'Which source answers the question?', pairs: [
          ['“How much CPU does Pod x use right now?” (kubectl top)', 'metrics-server'],
          ['“How many replicas of Deployment y are unavailable?”', 'kube-state-metrics'],
          ['“Raw per-container resource usage on this node”', 'cAdvisor in the kubelet'],
          ['“Is this node’s disk filling up?”', 'node_exporter'],
        ] },
      ],
      tip: 'Resource <b>usage</b> → metrics-server / cAdvisor. Object <b>state</b> → kube-state-metrics.',
    },

    {
      kicker: 'Reliability',
      title: 'SLI, SLO, SLA and error budgets',
      blocks: [
        { type: 'cards', cols: 2, items: [
          { icon: '📏', color: 'blue', title: 'SLI: indicator', text: 'A measured ratio of good events: e.g. share of requests answered successfully in under 300 ms.' },
          { icon: '🎯', color: 'green', title: 'SLO: objective', text: 'An internal target for an SLI over a window: “99.9% of requests succeed over 30 days”.' },
          { icon: '📄', color: 'amber', title: 'SLA: agreement', text: 'A contract with customers, with consequences (credits, refunds) if missed. Usually looser than the SLO.' },
          { icon: '💰', color: 'red', title: 'Error budget', text: '1 − SLO. The amount of unreliability you may “spend” on releases and experiments. Budget gone → slow down and fix reliability.' },
        ] },
        { type: 'stats', items: [
          { value: '99.9%', label: 'SLO over 30 days' },
          { value: '0.1%', label: 'error budget' },
          { value: '≈ 43 min', label: 'allowed downtime per 30 days' },
        ] },
        { type: 'check', q: 'A team’s SLO is 99.9% availability per month and the error budget is already exhausted halfway through the month. What does SRE practice recommend?', options: ['Raise the SLO to 99.99% to motivate the team', 'Prioritise reliability work and slow down risky releases until the budget recovers', 'Change the SLA so customers cannot claim credits', 'Disable alerting until the next month starts'], answer: 1, explain: 'An exhausted <b>error budget</b> is the signal to shift effort to reliability and reduce risky changes. Tightening the SLO makes things worse, changing the SLA is a business contract issue, and disabling alerts hides the problem.', ref: ['https://sre.google/sre-book/embracing-risk/', 'https://sre.google/sre-book/service-level-objectives/'] },
      ],
      tip: 'Order of strictness is usually <b>SLA ≤ SLO</b>: the internal objective is tighter so you notice problems before breaking the contract.',
    },

    {
      kicker: 'Cost observability',
      title: 'FinOps and OpenCost',
      blocks: [
        { type: 'text', html: 'Cloud bills arrive per VM or per account, but teams work per namespace, Deployment and label. <b>Cost observability</b> allocates infrastructure cost to Kubernetes workloads so teams can see and own what they spend. <b>FinOps</b> is the cultural practice that brings engineering, finance and business together around cloud cost; the <b>FinOps Foundation</b> is part of the Linux Foundation.' },
        { type: 'cards', items: [
          { icon: '🪙', color: 'green', title: 'OpenCost', text: 'CNCF project and vendor-neutral spec for measuring and allocating Kubernetes cost by namespace, workload, label and more. Originated by Kubecost; works with Prometheus data.' },
          { icon: '📐', color: 'blue', title: 'Requests drive cost', text: 'Allocation usually uses max(request, usage). Oversized requests waste money even if the app is idle.' },
          { icon: '🏷️', color: 'purple', title: 'Labels for showback', text: 'Consistent labels (team, app, cost-center) make showback and chargeback possible.' },
          { icon: '📉', color: 'amber', title: 'Right-sizing', text: 'Compare usage with requests; tools such as VPA recommendations help shrink waste.' },
        ] },
        { type: 'match', title: 'Which tool for which job?', pairs: [
          ['Pull-based metrics and alert rules', 'Prometheus'],
          ['Dashboards across many data sources', 'Grafana'],
          ['Vendor-neutral instrumentation and OTLP', 'OpenTelemetry'],
          ['Storing and searching distributed traces', 'Jaeger'],
          ['Lightweight per-node log forwarding', 'Fluent Bit'],
          ['Kubernetes cost allocation', 'OpenCost'],
        ] },
      ],
      tip: 'If a question mentions “allocating cloud spend to namespaces or teams”, think <b>OpenCost</b> and <b>FinOps</b>.',
    },
  ],

  summary: [
    '<b>Observability</b> = understanding internal state from emitted telemetry; monitoring (known checks and alerts) is a subset.',
    'Signals: <b>metrics</b> (time series), <b>logs</b> (discrete records), <b>traces</b> (request path made of spans), plus Kubernetes <b>events</b> and <b>profiles</b>.',
    '<b>Prometheus</b>: pull-based scraping of <code>/metrics</code>, exporters, local TSDB, PromQL, rules → <b>Alertmanager</b>. Metric types: counter, gauge, histogram, summary. Watch label <b>cardinality</b>.',
    '<b>OpenTelemetry</b> (API, SDK, Collector, OTLP) is vendor-neutral instrumentation; <b>OpenMetrics</b> is only a metrics format. <b>Jaeger</b> stores and shows traces.',
    'Log to <b>stdout/stderr</b>; collect with a node-level agent <b>DaemonSet</b> (Fluent Bit / Fluentd), a sidecar, or directly from the app.',
    '<b>metrics-server</b> = current CPU/memory for HPA and <code>kubectl top</code>; <b>kube-state-metrics</b> = object state; <b>cAdvisor</b> = container usage inside the kubelet.',
    '<b>SLI</b> measures, <b>SLO</b> targets, <b>SLA</b> promises; error budget = 1 − SLO. <b>OpenCost</b> brings cost observability (FinOps).',
  ],

  glossary: [
    { term: 'Observability', def: 'The ability to understand a system’s internal state from the telemetry it emits (metrics, logs, traces).' },
    { term: 'Telemetry', def: 'Data a system emits about its own behaviour and health.' },
    { term: 'Prometheus', def: 'CNCF graduated, pull-based metrics monitoring system with a time-series database, PromQL and alerting rules.' },
    { term: 'Exporter', def: 'A process that exposes metrics of a third-party system in Prometheus format (e.g. node_exporter).' },
    { term: 'PromQL', def: 'Prometheus Query Language used for dashboards, ad-hoc queries and alerting rules.' },
    { term: 'Cardinality', def: 'The number of unique time series, driven by label value combinations. High cardinality hurts performance.' },
    { term: 'Alertmanager', def: 'Receives alerts from Prometheus and deduplicates, groups, silences, inhibits and routes them to receivers.' },
    { term: 'ServiceMonitor', def: 'Prometheus Operator custom resource that declares which Services Prometheus should scrape.' },
    { term: 'OpenTelemetry', def: 'CNCF incubating, vendor-neutral set of APIs, SDKs, the Collector and OTLP for traces, metrics and logs.' },
    { term: 'OTLP', def: 'OpenTelemetry Protocol: the wire protocol (gRPC/HTTP) for sending telemetry.' },
    { term: 'Span', def: 'A single timed operation within a trace, with IDs, parent reference and attributes.' },
    { term: 'Context propagation', def: 'Passing trace ID and parent span ID between services (e.g. W3C traceparent header) so spans join one trace.' },
    { term: 'Jaeger', def: 'CNCF graduated distributed tracing backend for storing and visualising traces.' },
    { term: 'Fluent Bit', def: 'Lightweight log processor and forwarder, typically deployed as a DaemonSet; part of the graduated Fluentd project.' },
    { term: 'kube-state-metrics', def: 'Add-on that generates metrics about the state of Kubernetes objects by watching the API server.' },
    { term: 'Error budget', def: 'The allowed amount of unreliability, 1 − SLO, that can be spent on change before reliability work takes priority.' },
  ],

  quiz: [
    { q: 'Which statement best describes how Prometheus collects metrics by default?', options: ['Applications push metrics to the Prometheus server over gRPC', 'Prometheus scrapes HTTP endpoints exposed by targets at regular intervals', 'The kubelet forwards all container metrics to Prometheus via CRI', 'Prometheus reads metrics directly from etcd'], answer: 1, explain: 'Prometheus is <b>pull-based</b>: it scrapes <code>/metrics</code> endpoints found through service discovery. Pushing is only done via the Pushgateway for batch jobs, not by default. CRI is the runtime interface, and Prometheus never reads etcd.', ref: 'https://prometheus.io/docs/introduction/overview/' },
    { q: 'Which CNCF project provides vendor-neutral APIs, SDKs and a Collector for generating and exporting traces, metrics and logs?', options: ['OpenMetrics', 'Jaeger', 'OpenTelemetry', 'Fluentd'], answer: 2, explain: '<b>OpenTelemetry</b> covers instrumentation and export for all three signals. OpenMetrics is only a metrics exposition format, Jaeger is a tracing backend, and Fluentd is a log collector.', ref: 'https://opentelemetry.io/docs/what-is-opentelemetry/' },
    { q: 'Which Prometheus metric type should you use for the total number of HTTP requests served since the process started?', options: ['Gauge', 'Summary', 'Histogram', 'Counter'], answer: 3, explain: 'A <b>counter</b> only increases (resetting on restart), which matches a running total; you query it with <code>rate()</code>. A gauge is for values that go up and down; histograms and summaries describe distributions such as latency.', ref: 'https://prometheus.io/docs/concepts/metric_types/' },
    { q: 'A command <code>kubectl top pods</code> returns “error: Metrics API not available”. Which component is most likely missing?', options: ['kube-state-metrics', 'Alertmanager', 'node_exporter', 'metrics-server'], answer: 3, explain: '<code>kubectl top</code> and the HPA read the Metrics API (<code>metrics.k8s.io</code>) served by <b>metrics-server</b>. kube-state-metrics exposes object state for Prometheus, Alertmanager routes alerts, and node_exporter exposes host metrics in Prometheus format.', ref: 'https://kubernetes.io/docs/tasks/debug/debug-cluster/resource-metrics-pipeline/' },
    { q: 'Which component deduplicates, groups and routes alerts fired by Prometheus to destinations such as Slack or PagerDuty?', options: ['Alertmanager', 'Grafana', 'Pushgateway', 'OpenTelemetry Collector'], answer: 0, explain: '<b>Alertmanager</b> handles notification: deduplication, grouping, silencing, inhibition and routing. Grafana visualises, Pushgateway accepts pushed metrics from batch jobs, and the OTel Collector is a telemetry pipeline.', ref: 'https://prometheus.io/docs/alerting/latest/alertmanager/' },
    { q: 'What is the most common way to collect container logs from every node in a Kubernetes cluster?', options: ['A Deployment with one replica that reads logs from etcd', 'A CronJob that runs <code>kubectl logs</code> every minute', 'A StatefulSet that mounts every Pod’s volumes', 'A node-level logging agent such as Fluent Bit running as a DaemonSet'], answer: 3, explain: 'A <b>DaemonSet</b> runs one agent per node that tails the container log files written from stdout/stderr. etcd stores object state, not logs; polling with <code>kubectl logs</code> does not scale; a StatefulSet cannot mount other Pods’ volumes.', ref: 'https://kubernetes.io/docs/concepts/cluster-administration/logging/' },
    { q: 'In distributed tracing, what is a span?', options: ['A single timed operation within a trace, such as one service call', 'The total time a Pod has been running', 'A group of related log lines', 'The retention window of a metrics database'], answer: 0, explain: 'A <b>span</b> is one unit of work with a start time, duration, IDs and attributes. Spans linked by a shared trace ID form a <b>trace</b>.', ref: 'https://opentelemetry.io/docs/concepts/signals/traces/' },
    { q: 'Which TWO statements about kube-state-metrics are true? (Select 2)', options: ['It generates metrics about the state of Kubernetes objects such as Deployments and Pods', 'It is required for <code>kubectl top</code> to work', 'It obtains its data by watching the Kubernetes API server', 'It measures per-container CPU usage directly from cgroups'], answer: [0, 2], explain: 'kube-state-metrics <b>watches the API server</b> and turns <b>object state</b> (desired vs available replicas, Pod phases, restarts) into metrics. <code>kubectl top</code> needs metrics-server, and per-container usage from cgroups is cAdvisor’s job in the kubelet.', ref: 'https://kubernetes.io/docs/concepts/cluster-administration/kube-state-metrics/' },
    { q: 'An engineer adds a <code>user_id</code> label to a request counter in an app with millions of users. What is the main risk?', options: ['PromQL cannot filter on custom labels', 'The counter will turn into a gauge', 'High cardinality: millions of time series overload Prometheus', 'Alertmanager will stop grouping alerts'], answer: 2, explain: 'Each unique label value creates a new time series, so an unbounded label like <code>user_id</code> causes a <b>cardinality explosion</b> with high memory use and slow queries. PromQL can filter any label, and labels do not change the metric type.', ref: 'https://prometheus.io/docs/concepts/data_model/' },
    { q: 'A service has an SLO of 99.9% successful requests over 30 days. What is its error budget?', options: ['99.9% of requests', '0.1% of requests over the 30 days', '30 minutes per day', 'The penalty paid to customers under the SLA'], answer: 1, explain: 'The <b>error budget</b> is 1 − SLO = <b>0.1%</b> of requests (about 43 minutes of full downtime in 30 days). The SLA penalty is a contractual consequence, not the budget.', ref: ['https://sre.google/sre-book/embracing-risk/', 'https://sre.google/sre-book/service-level-objectives/'] },
    { q: 'Which TWO projects are primarily used for distributed tracing? (Select 2)', options: ['Jaeger', 'Fluent Bit', 'OpenTelemetry', 'kube-state-metrics'], answer: [0, 2], explain: '<b>OpenTelemetry</b> instruments applications and exports spans; <b>Jaeger</b> stores and visualises traces. Fluent Bit forwards logs, and kube-state-metrics exposes object-state metrics.', ref: ['https://www.jaegertracing.io/docs/latest/', 'https://opentelemetry.io/docs/concepts/signals/traces/'] },
    { q: 'Which Prometheus Operator custom resource tells Prometheus which Services to scrape?', options: ['ServiceMonitor', 'PrometheusRule', 'HorizontalPodAutoscaler', 'EndpointSlice'], answer: 0, explain: 'A <b>ServiceMonitor</b> selects Services by label and describes the endpoints to scrape. PrometheusRule holds alerting and recording rules, the HPA scales workloads, and EndpointSlice is a core networking object.', ref: 'https://github.com/prometheus-operator/prometheus-operator' },
  ],
});
