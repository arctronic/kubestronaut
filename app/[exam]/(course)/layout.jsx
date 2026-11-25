import Shell from '@/components/Shell';
import { CourseHeroCard, CourseTabs } from '@/components/Course';
import Icon from '@/components/Icon';
import { examSummary } from '@/lib/content';
import Link from 'next/link';

export default async function CourseLayout({ children, params }) {
  const { exam } = await params;
  const e = examSummary(exam);
  const hours = Math.round(e.chapters.reduce((a, c) => a + (c.minutes || 25) + 10, 0) / 60);
  return (
    <Shell>
      <main>
        <section className="course-hero">
          <div className="ch-inner">
            <div className="ch-text">
              <nav className="crumbs" aria-label="Breadcrumb"><Link href="/">Home</Link> <span>›</span> <span>Kubestronaut path</span> <span>›</span> <span>{e.short}</span></nav>
              <h1>{e.title} ({e.short})</h1>
              <p className="lead" dangerouslySetInnerHTML={{ __html: e.tagline || '' }} />
              <div className="meta-row">
                <span><Icon name="book-open" />{e.chapters.length} lessons</span>
                <span><Icon name="clipboard-list" />{e.questionCount} practice questions</span>
                <span><Icon name="timer" />~{hours} hours</span>
                <span><Icon name="trophy" />Pass mark {e.mock.pass}%</span>
              </div>
            </div>
            <CourseHeroCard e={e} />
          </div>
        </section>
        <CourseTabs examId={e.id} />
        <div className="page course-body">{children}</div>
      </main>
    </Shell>
  );
}
