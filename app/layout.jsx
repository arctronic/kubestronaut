import './globals.css';
import JsonLd from '@/components/JsonLd';
import { NavProvider } from '@/components/NavContext';
import { examMetas } from '@/lib/content';
import { ORG, SITE_DESC, SITE_NAME, SITE_URL, orgLd } from '@/lib/site';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME}: free KCNA, CKA and Kubestronaut prep`, template: `%s | ${SITE_NAME}` },
  description: SITE_DESC,
  applicationName: SITE_NAME,
  authors: [{ name: ORG.name, url: ORG.url }],
  creator: ORG.name,
  publisher: ORG.name,
  category: 'education',
  keywords: ['KCNA', 'KCNA exam', 'KCNA practice questions', 'KCNA mock exam', 'KCNA study guide', 'Kubestronaut', 'Kubernetes certification', 'CKA', 'CKAD', 'CKS', 'KCSA', 'CNCF', 'cloud native', 'tronics.dev'],
  alternates: { canonical: '/' },
  openGraph: { type: 'website', siteName: SITE_NAME, title: SITE_NAME, description: SITE_DESC, url: '/', locale: 'en_US' },
  twitter: { card: 'summary_large_image', title: SITE_NAME, description: SITE_DESC },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
  formatDetection: { telephone: false },
};
export const viewport = {
  width: 'device-width', initialScale: 1,
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#ffffff' }, { media: '(prefers-color-scheme: dark)', color: '#0c1018' }],
};

// Apply the saved theme before first paint (no flash).
const THEME = `try{var t=JSON.parse(localStorage.getItem('kubestronaut.v1')||'{}').theme;if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}`;

export default function RootLayout({ children }) {
  const exams = examMetas().map(({ id, short, title, format, duration, color, available }) => ({ id, short, title, format, duration, color, available }));
  const site = {
    '@context': 'https://schema.org',
    '@graph': [
      orgLd(),
      { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, name: SITE_NAME, url: SITE_URL, description: SITE_DESC, inLanguage: 'en', publisher: { '@id': `${ORG.url}/#org` } },
      { '@type': 'EducationalOrganization', name: SITE_NAME, url: SITE_URL, parentOrganization: { '@id': `${ORG.url}/#org` } },
    ],
  };
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />
        <link rel="author" href={ORG.url} />
        <JsonLd data={site} />
      </head>
      <body><NavProvider exams={exams}>{children}</NavProvider></body>
    </html>
  );
}
