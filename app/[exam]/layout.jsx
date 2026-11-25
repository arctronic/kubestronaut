import { availableExamIds } from '@/lib/content';

export const dynamicParams = false;
export function generateStaticParams() { return availableExamIds().map((exam) => ({ exam })); }

export default function ExamLayout({ children }) { return children; }
