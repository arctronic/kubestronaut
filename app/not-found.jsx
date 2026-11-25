import Link from 'next/link';
import Shell from '@/components/Shell';

export const metadata = { title: 'Page not found' };
export default function NotFound() {
  return <Shell><main className="page narrow"><div className="empty"><h1>Page not found</h1><p>That page doesn’t exist (yet).</p><Link className="btn primary" href="/">Back to the dashboard</Link></div></main></Shell>;
}
