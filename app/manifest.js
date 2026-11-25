import { SITE_DESC, SITE_NAME } from '@/lib/site';

export const dynamic = 'force-static';
export default function manifest() {
  return {
    name: SITE_NAME, short_name: 'Kubestronaut', description: SITE_DESC, start_url: '/', display: 'standalone',
    background_color: '#f5f7fa', theme_color: '#0056d2', categories: ['education'],
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}
