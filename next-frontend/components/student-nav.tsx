'use client';

import Link from 'next/link';
import { useStudentSession } from '@/lib/use-student-session';

export function StudentNav() {
  const { ready, student } = useStudentSession();

  if (!ready) return <span className="nav-account nav-account--placeholder" aria-hidden="true" />;

  if (!student) {
    return (
      <Link className="nav-account" href="/my-tests">
        Login
      </Link>
    );
  }

  return (
    <Link className="nav-account nav-account--user" href="/my-tests" title={student.email} aria-label="My tests">
      <span className="nav-account__avatar" aria-hidden="true">
        {student.name.trim().charAt(0).toUpperCase()}
      </span>
      <span className="nav-account__label">My tests</span>
    </Link>
  );
}
