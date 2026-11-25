import { OG_SIZE, ogImage } from '@/lib/og';

export const dynamic = 'force-static';
export const alt = 'Kubestronaut Academy: free KCNA and Kubestronaut certification prep';
export const size = OG_SIZE;
export const contentType = 'image/png';
export default function Image() {
  return ogImage({ eyebrow: 'KCNA · KCSA · CKAD · CKA · CKS', title: 'Become a Kubestronaut', subtitle: 'Visual lessons, practice questions with official sources and timed mock exams.' });
}
