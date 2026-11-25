export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://k8s.tronics.dev').replace(/\/$/, '');
export const SITE_NAME = 'Kubestronaut Academy';
export const SITE_DESC = 'Free, interactive prep for the Kubestronaut certifications (KCNA, KCSA, CKAD, CKA, CKS): visual lessons, practice quizzes with official sources, flashcards and timed mock exams.';
/** Publisher: the parent site. */
export const ORG = { name: 'Tronics', url: 'https://tronics.dev', domain: 'tronics.dev' };

export const OFFICIAL_LINKS = [
  { label: 'KCNA curriculum (CNCF)', href: 'https://github.com/cncf/curriculum' },
  { label: 'Kubernetes documentation', href: 'https://kubernetes.io/docs/home/' },
  { label: 'CNCF landscape', href: 'https://landscape.cncf.io/' },
  { label: 'Kubestronaut program', href: 'https://www.cncf.io/training/kubestronaut/' },
];

/** JSON-LD helpers */
export const orgLd = () => ({ '@type': 'Organization', '@id': `${ORG.url}/#org`, name: ORG.name, url: ORG.url, logo: `${SITE_URL}/icon.svg` });
export function breadcrumbLd(items) {
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${SITE_URL}${path}` })) };
}
