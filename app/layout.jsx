import './globals.css';
import { SITE_DESC, SITE_NAME, SITE_URL } from '@/lib/site';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME}: free KCNA, CKA and Kubestronaut prep`, template: `%s | ${SITE_NAME}` },
  description: SITE_DESC,
  applicationName: SITE_NAME,
  keywords: ['KCNA', 'KCNA exam', 'KCNA practice questions', 'KCNA mock exam', 'Kubestronaut', 'Kubernetes certification', 'CKA', 'CKAD', 'CKS', 'KCSA', 'CNCF', 'cloud native'],
  alternates: { canonical: '/' },
  openGraph: { type: 'website', siteName: SITE_NAME, title: SITE_NAME, description: SITE_DESC, url: '/', locale: 'en_US' },
  twitter: { card: 'summary_large_image', title: SITE_NAME, description: SITE_DESC },
  robots: { index: true, follow: true },
};
export const viewport = { themeColor: '#0056d2', width: 'device-width', initialScale: 1 };

// Apply the saved theme before first paint (no flash).
const THEME = `try{var t=JSON.parse(localStorage.getItem('kubestronaut.v1')||'{}').theme;if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
