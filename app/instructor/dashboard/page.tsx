'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import RightbarRecruiters from '@/components/Rightbar';
import HeaderLoggedIn from '@/components/HeaderLoggedIn';

interface Course {
  id: string;
  title: string;
  description?: string;
  studentsCount?: number;
}

export default function InstructorDashboardPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<{ courses: number; students: number }>({
    courses: 0,
    students: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/instructor/courses`, {
          credentials: 'include',
        });

        if (!res.ok) {
          console.error("Failed to load instructor courses", res.status);
          setError("Failed to load dashboard data");
          return;
        }

        const data = await res.json();

        if (Array.isArray(data)) {
          const cleanCourses = data.map((course) => ({
            ...course,
            studentsCount: Number(course.studentsCount) || 0,
          }));

          setCourses(cleanCourses);

          const totalStudents = cleanCourses.reduce(
            (sum, c) => sum + c.studentsCount,
            0
          );

          setStats({
            courses: cleanCourses.length,
            students: totalStudents,
          });
        } else {
          setCourses([]);
          setStats({ courses: 0, students: 0 });
        }
      } catch (err) {
        console.error(err);
        setError("Network error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <>
      <HeaderLoggedIn />

      <div className="bg-[#F3F2EF] text-gray-900 pt-16">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-6 flex gap-6 mt-[-70px]">

          {/* LEFT SIDEBAR */}
          <aside className="w-[280px] hidden lg:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-hide">
            <Sidebar />
          </aside>

          {/* MAIN */}
          <main className="flex-1 py-8">
            <div className="max-w-[980px] mx-auto">

              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">
                  Instructor Dashboard
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Overview of your courses, learners and quick actions.
                </p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0A66C2]" />
                </div>
              ) : (
                <>
                  {error && (
                    <div className="mb-4 text-sm text-red-700 bg-red-50 p-3 rounded">
                      {error}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-white rounded-lg shadow-sm flex flex-col">
                      <div className="text-sm text-gray-500">Courses</div>
                      <div className="mt-2 text-2xl font-bold text-gray-900">
                        {stats.courses}
                      </div>
                      <div className="mt-3 text-xs text-gray-500">
                        Create and manage your course content
                      </div>
                    </div>

                    <div className="p-4 bg-white rounded-lg shadow-sm flex flex-col">
                      <div className="text-sm text-gray-500">Students</div>
                      <div className="mt-2 text-2xl font-bold text-gray-900">
                        {stats.students}
                      </div>
                      <div className="mt-3 text-xs text-gray-500">
                        Enrolled learners across your courses
                      </div>
                    </div>

                    <div className="p-4 bg-white rounded-lg shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="text-sm text-gray-500">Quick Links</div>
                        <ul className="mt-2 space-y-2 text-sm">
                          <li>
                            <Link href="/instructor/my-courses" className="text-[#0A66C2] hover:text-[#004182] font-medium">
                              Manage courses →
                            </Link>
                          </li>
                          <li>
                            <Link href="/instructor/courses/create" className="text-[#0A66C2] hover:text-[#004182] font-medium">
                              Create course →
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Courses List */}
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Your Courses</h2>

                    {courses.length === 0 ? (
                      <p className="text-sm text-gray-600">
                        You haven’t created any courses yet.
                      </p>
                    ) : (
                      <ul className="space-y-4">
                        {courses.map((course) => (
                          <li key={course.id} className="p-4 border rounded-md hover:shadow-md transition">
                            <Link
                              href={`/instructor/courses/${course.id}`}
                              className="text-[#0A66C2] hover:text-[#004182] font-semibold"
                            >
                              <h3 className="text-md">{course.title}</h3>
                            </Link>
                            {course.description && (
                              <p className="text-sm text-gray-600 mt-1">{course.description}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              Students enrolled: {course.studentsCount}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Actions</h2>
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href="/instructor/courses/create"
                        className="px-4 py-2 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-md text-sm font-medium"
                      >
                        Create Course
                      </Link>
                      <Link
                        href="/instructor/modules/create"
                        className="px-4 py-2 border border-[#0A66C2] text-[#0A66C2] hover:bg-[#E5F0FB] rounded-md text-sm font-medium"
                      >
                        Create Module
                      </Link>
                      <Link
                        href="/instructor/lessons/create"
                        className="px-4 py-2 border border-[#0A66C2] text-[#0A66C2] hover:bg-[#E5F0FB] rounded-md text-sm font-medium"
                      >
                        Create Lesson
                      </Link>
                      <Link
                        href="/instructor/my-courses"
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium"
                      >
                        Manage Courses
                      </Link>
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
