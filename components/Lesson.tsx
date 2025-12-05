'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import RightbarRecruiters from '@/components/Rightbar';
import HeaderLoggedIn from '@/components/HeaderLoggedIn';
import Footer from '@/components/Footer';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

interface Lesson {
  id: number;
  title: string;
  content?: string;
  duration?: string;
  completed?: boolean;
}

interface Module {
  id: number;
  title: string;
  lessons?: Lesson[];
}

interface Course {
  id: number;
  title: string;
  modules?: Module[];
}

export default function CourseLessonPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = searchParams.get('courseId');
  const lessonIdParam = searchParams.get('lessonId');

  const [course, setCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Fetch course data */
  useEffect(() => {
    if (!courseId) return;

    const fetchCourse = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/learning/${courseId}`);
        setCourse(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch course data.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  /** Flatten lessons for progress tracking */
  const allLessons = useMemo(() => {
    if (!course?.modules) return [];
    return course.modules.flatMap((m) => m.lessons || []);
  }, [course]);

  /** Set current lesson */
  useEffect(() => {
    if (!course || !lessonIdParam) return;
    const lessonId = Number(lessonIdParam);
    const lesson = allLessons.find((l) => l.id === lessonId);

    if (lesson) {
      setCurrentLesson(lesson);
    } else {
      setError('Lesson not found.');
    }
  }, [course, lessonIdParam, allLessons]);

  /** Progress tracking */
  const lessonIndex = useMemo(() => {
    if (!currentLesson) return null;
    return allLessons.findIndex((l) => l.id === currentLesson.id) + 1; // 1-based
  }, [currentLesson, allLessons]);

  const totalLessons = allLessons.length;

  /** Navigation helpers */
  const getNextLessonId = (): number | null => {
    if (!currentLesson || !lessonIndex) return null;
    return allLessons[lessonIndex] ? allLessons[lessonIndex].id : null;
  };

  const getPreviousLessonId = (): number | null => {
    if (!currentLesson || !lessonIndex) return null;
    return lessonIndex > 1 ? allLessons[lessonIndex - 2].id : null;
  };

  const goToLesson = (lessonId: number) => {
    router.push(`/dashboard/learning/lesson?courseId=${courseId}&lessonId=${lessonId}`);
  };

  /** Render */
  return (
    <>
      <HeaderLoggedIn />
      <div className="bg-gray-50 min-h-screen pt-2">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-6 flex gap-6">
          {/* Sidebar */}
          <aside className="w-[280px] hidden lg:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
            <Sidebar />
          </aside>

          {/* Main Lesson Area */}
          <main className="flex-1 py-8">
            {loading && (
              <div className="p-8 text-center text-gray-500 text-lg">Loading course...</div>
            )}

            {!loading && error && (
              <div className="p-8 text-center text-red-600 text-lg">{error}</div>
            )}

            {!loading && !error && course && currentLesson && (
              <>
                {/* Lesson Header */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-[#0A66C2]">{currentLesson.title}</h1>
                    {lessonIndex && (
                      <span className="text-sm text-gray-500">
                        Lesson {lessonIndex} of {totalLessons}
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  {lessonIndex && (
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[#0A66C2] h-2 rounded-full transition-all"
                        style={{ width: `${(lessonIndex / totalLessons) * 100}%` }}
                      />
                    </div>
                  )}

                  {currentLesson.completed !== undefined && (
                    <div className="flex items-center gap-2 mt-2">
                      {currentLesson.completed ? (
                        <CheckCircleIcon className="w-6 h-6 text-green-500" />
                      ) : (
                        <XCircleIcon className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                  )}

                  {currentLesson.duration && (
                    <p className="flex items-center gap-1 mt-2 text-gray-500 text-sm">
                      <ClockIcon className="w-4 h-4" /> Duration: {currentLesson.duration}
                    </p>
                  )}
                  <div
                    className="mt-4 text-gray-800 prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: currentLesson.content || '' }}
                  />
                </div>

                {/* Lesson Navigation */}
                <div className="flex justify-between mb-16">
                  <button
                    disabled={!getPreviousLessonId()}
                    onClick={() => {
                      const prevId = getPreviousLessonId();
                      if (prevId) goToLesson(prevId);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                    Previous Lesson
                  </button>

                  <button
                    disabled={!getNextLessonId()}
                    onClick={() => {
                      const nextId = getNextLessonId();
                      if (nextId) goToLesson(nextId);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-[#0A66C2] text-white rounded-lg hover:bg-[#004182] disabled:opacity-50 transition"
                  >
                    Next Lesson
                    <ChevronRightIcon className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}
          </main>

          {/* Rightbar */}
          <aside className="w-[320px] hidden xl:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
            <RightbarRecruiters />
          </aside>
        </div>
      </div>
      <Footer />
    </>
  );
}
