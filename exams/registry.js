/* The Kubestronaut path. Flip `available: true` once an exam folder (exams/<id>/exam.js) has content. */
[
  { id: 'kcna', short: 'KCNA', icon: '☸️', color: 'blue', available: true,
    title: 'Kubernetes and Cloud Native Associate', format: 'Multiple choice', duration: '90 min',
    blurb: 'Foundations of Kubernetes and the cloud native ecosystem.' },
  { id: 'kcsa', short: 'KCSA', icon: '🛡️', color: 'teal', available: false,
    title: 'Kubernetes and Cloud Native Security Associate', format: 'Multiple choice', duration: '90 min',
    blurb: 'Security fundamentals: 4Cs, cluster hardening, threat models, compliance.' },
  { id: 'ckad', short: 'CKAD', icon: '🧑‍💻', color: 'green', available: false,
    title: 'Certified Kubernetes Application Developer', format: 'Hands-on lab', duration: '2 hours',
    blurb: 'Design, build and deploy cloud native apps on Kubernetes, in a live terminal.' },
  { id: 'cka', short: 'CKA', icon: '🛠️', color: 'amber', available: false,
    title: 'Certified Kubernetes Administrator', format: 'Hands-on lab', duration: '2 hours',
    blurb: 'Install, configure, troubleshoot and manage production clusters.' },
  { id: 'cks', short: 'CKS', icon: '🔐', color: 'red', available: false,
    title: 'Certified Kubernetes Security Specialist', format: 'Hands-on lab', duration: '2 hours',
    blurb: 'Secure the supply chain, the cluster and workloads at runtime. Requires an active CKA.' },
].forEach(KS.registerExamMeta);
