import { Notes } from '@/components/Course';
import { examSummary } from '@/lib/content';

export async function generateMetadata({ params }) { const { exam } = await params; return { title: `${exam.toUpperCase()} notes`, robots: { index: false } }; }
export default async function Page({ params }) { const { exam } = await params; return <Notes e={examSummary(exam)} />; }
