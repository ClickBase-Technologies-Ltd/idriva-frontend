'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import RightbarRecruiters from '@/components/Rightbar';
import HeaderLoggedIn from '@/components/HeaderLoggedIn';

export default function InstructorDashboardPage() {
  const [stats, setStats] = useState<{ courses: number; students: number }>({ courses: 0, students: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/instructor/courses`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setStats({ courses: Array.isArray(data) ? data.length : 0, students: 0 });
        } else {
          console.error('Failed to load instructor courses', res.status);
          setError('Failed to load dashboard data');
        }
      } catch (e) {
        console.error(e);
        setError('Network error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <>
      <HeaderLoggedIn />

      <div className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white pt-16">
        <div className="max-w-[1360px] mx-auto px-4 lg:px-6 flex gap-6 mt-[-70px]">
          {/* LEFT SIDEBAR */}
          <aside className="w-[280px] hidden lg:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-hide">
            <Sidebar />
          </aside>

          {/* MAIN */}
          <main className="flex-1 py-8">
            <div className="max-w-[980px] mx-auto">
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Instructor Dashboard</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Overview of your courses, learners and quick actions.</p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                </div>
              ) : (
                <>
                  {error && (
                    <div className="mb-4 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 p-3 rounded">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex flex-col">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Courses</div>
                      <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{stats.courses}</div>
                      <div className="mt-3 text-xs text-gray-500">Create and manage your course content</div>
                    </div>

                    <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex flex-col">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Students</div>
                      <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{stats.students}</div>
                      <div className="mt-3 text-xs text-gray-500">Enrolled learners across your courses</div>
                    </div>

                    <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex flex-col justify-between">
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Quick Links</div>
                        <ul className="mt-2 space-y-2 text-sm">
                          <li><Link href="/instructor/my-courses" className="text-blue-600 hover:underline">Manage courses →</Link></li>
                          <li><Link href="/instructor/courses/create" className="text-blue-600 hover:underline">Create course →</Link></li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Actions</h2>
                    <div className="flex flex-wrap gap-3">
                      <Link href="/instructor/courses/create" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm">Create Course</Link>
                      <Link href="/instructor/modules/create" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm">Create Module</Link>
                      <Link href="/instructor/lessons/create" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm">Create Lesson</Link>
                      <Link href="/instructor/my-courses" className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-sm">Manage Courses</Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          </main>

          {/* RIGHT SIDEBAR */}
          <aside className="w-[320px] hidden xl:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden scrollbar-hide">
            <RightbarRecruiters />
          </aside>
        </div>
      </div>
    </>
  );
}