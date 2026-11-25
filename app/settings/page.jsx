import Shell from '@/components/Shell';
import Settings from '@/components/Settings';

export const metadata = { title: 'Progress & backup', robots: { index: false } };
export default function Page() { return <Shell><Settings /></Shell>; }
