'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import HeaderLoggedIn from '@/components/HeaderLoggedIn';
import Sidebar from '@/components/Sidebar';
import RightbarRecruiters from '@/components/Rightbar';
import Footer from '@/components/Footer';

interface Lesson {
  id: number;
  title: string;
  content?: string;
  duration?: string;
  content_type?: string;
  content_url?: string;
  module_id?: number;
  course_id?: number;
  position?: number;
  duration_seconds?: number;
  created_at?: string;
  updated_at?: string;
}

interface ModuleWithLessons {
  id: number;
  title: string;
  position?: number;
  lessons: Lesson[];
}

interface CourseWithModules {
  id: number;
  title?: string;
  description?: string;
  modules: ModuleWithLessons[];
}

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();

  const courseId = params?.id as string;
  const lessonId = params?.lessonId as string;

  const [course, setCourse] = useState<CourseWithModules | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  // Fetch course structure (modules + lessons) and the lesson payload
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      if (!courseId || !lessonId) {
        setError('Missing courseId or lessonId in route params');
        setLoading(false);
        return;
      }

      try {
        // 1) Fetch course with modules and lessons (ordered by position)
        const courseRes = await api.get(`/learning/${courseId}`);
        const courseData: CourseWithModules = courseRes.data;

        // Normalize modules.lessons to arrays
        courseData.modules = (courseData.modules || []).map((m: any) => ({
          id: m.id,
          title: m.title,
          position: m.position,
          lessons: (m.lessons || []).map((l: any) => ({
            id: Number(l.id),
            title: l.title,
            content: l.content,
            content_type: l.content_type,
            content_url: l.content_url,
            module_id: l.module_id,
            course_id: l.course_id,
            position: l.position,
            duration_seconds: l.duration_seconds,
            created_at: l.created_at,
            updated_at: l.updated_at,
          })),
        }));

        setCourse(courseData);

        // 2) Fetch the single lesson payload (keeps content up-to-date)
        const lessonRes = await api.get(`/learning/${courseId}/lessons/${lessonId}`);
        setLesson(lessonRes.data);
      } catch (err: any) {
        console.error('Failed to load course/lesson', err);
        setError(err.response?.data ?? err.message ?? 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, lessonId]);

  // Build a flat ordered list of lessons across modules to compute prev/next
  const flatLessons = useMemo(() => {
    if (!course) return [] as Lesson[];
    const list: Lesson[] = [];
    const sortedModules = [...course.modules].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    for (const m of sortedModules) {
      const sortedLessons = [...(m.lessons || [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      for (const l of sortedLessons) {
        list.push({ ...l, module_id: m.id });
      }
    }
    return list;
  }, [course]);

  const currentIndex = useMemo(() => {
    if (!flatLessons.length || !lesson) return -1;
    return flatLessons.findIndex((l) => Number(l.id) === Number(lesson.id));
  }, [flatLessons, lesson]);

  const prevLesson = useMemo(() => {
    if (currentIndex > 0) return flatLessons[currentIndex - 1];
    return null;
  }, [flatLessons, currentIndex]);

  const nextLesson = useMemo(() => {
    if (currentIndex >= 0 && currentIndex < flatLessons.length - 1) return flatLessons[currentIndex + 1];
    return null;
  }, [flatLessons, currentIndex]);

  const goToLesson = (target: Lesson | null) => {
    if (!target) return;
    // navigate to the route pattern used by your app
    router.push(`/dashboard/learning/${courseId}/lesson/${target.id}`);
  };

  // Render helpers
  const renderMedia = () => {
    if (!lesson) return null;

    if (lesson.content_type === 'video' && lesson.content_url) {
      // simple responsive video player
      return (
        <div className="w-full aspect-video bg-black rounded overflow-hidden">
          <video
            key={lesson.content_url}
            controls
            src={lesson.content_url}
            className="w-full h-full object-cover"
          />
        </div>
      );
    }

    if (lesson.content_type === 'audio' && lesson.content_url) {
      return (
        <div className="w-full bg-white rounded p-4">
          <audio controls src={lesson.content_url} className="w-full" />
        </div>
      );
    }

    // Fallback: textual content
    return (
      <div className="prose max-w-none">
        <div dangerouslySetInnerHTML={{ __html: lesson.content || '<p>No content available.</p>' }} />
      </div>
    );
  };

  return (
    <>
      <HeaderLoggedIn />
      <div className="bg-gray-50 min-h-screen pt-2">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-6 flex gap-6">
          {/* Left sidebar (course navigation) */}
          <aside className="w-[320px] hidden lg:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-semibold mb-3">Course contents</h3>

              {!course ? (
                <p className="text-sm text-gray-500">Loading contents...</p>
              ) : (
                <div className="space-y-4">
                  {course.modules
                    .slice()
                    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                    .map((m) => (
                      <div key={m.id}>
                        <div className="text-sm font-medium text-gray-700 mb-2">{m.title}</div>
                        <ul className="space-y-1">
                          {m.lessons
                            .slice()
                            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                            .map((l) => {
                              const isActive = lesson && Number(l.id) === Number(lesson.id);
                              return (
                                <li key={l.id}>
                                  <Link
                                    href={`/dashboard/learning/${courseId}/lesson/${l.id}`}
                                    className={`block px-3 py-2 rounded text-sm ${
                                      isActive ? 'bg-[#0A66C2] text-white' : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="truncate">{l.title}</span>
                                      <span className="ml-2 text-xs text-gray-400">
                                        {l.duration_seconds ? `${l.duration_seconds}s` : ''}
                                      </span>
                                    </div>
                                  </Link>
                                </li>
                              );
                            })}
                        </ul>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 py-8">
            {loading ? (
              <div className="p-6 bg-white rounded-lg shadow-sm">
                <p>Loading lesson...</p>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-100 text-red-700 rounded">
                <h2 className="font-bold">Failed to load lesson</h2>
                <pre className="text-xs">{JSON.stringify(error, null, 2)}</pre>
              </div>
            ) : !lesson ? (
              <div className="p-6 bg-white rounded-lg shadow-sm">
                <p>Lesson not found.</p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h1 className="text-3xl font-bold text-[#0A66C2]">{lesson.title}</h1>
                      <p className="mt-2 text-gray-600">
                        {lesson.duration || (lesson.duration_seconds ? `${lesson.duration_seconds}s` : '')}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {prevLesson ? (
                        <button
                          onClick={() => goToLesson(prevLesson)}
                          className="px-4 py-2 bg-white border rounded text-sm hover:bg-gray-50"
                        >
                          Previous
                        </button>
                      ) : (
                        <div className="text-sm text-gray-400">First lesson</div>
                      )}

                      {nextLesson ? (
                        <button
                          onClick={() => goToLesson(nextLesson)}
                          className="px-4 py-2 bg-[#0A66C2] text-white rounded text-sm hover:opacity-95"
                        >
                          Next lesson
                        </button>
                      ) : (
                        <div className="text-sm text-gray-400">Last lesson</div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6">{renderMedia()}</div>

                  <div className="mt-6 text-gray-800 leading-relaxed">
                    {/* textual content fallback if media shown above */}
                    {lesson.content && lesson.content_type !== 'video' && lesson.content_type !== 'audio' && (
                      <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
                    )}
                  </div>

                  {/* Progress / module info */}
                  <div className="mt-6 border-t pt-4 text-sm text-gray-600">
                    <div>
                      Module:{' '}
                      {course
                        ? course.modules.find((m) => m.id === lesson.module_id)?.title ?? 'Unknown module'
                        : '—'}
                    </div>
                    <div>Lesson {currentIndex >= 0 ? currentIndex + 1 : '—'} of {flatLessons.length}</div>
                  </div>
                </div>

                {/* Suggested next steps */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-3">Up next</h3>
                  {nextLesson ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{nextLesson.title}</div>
                        <div className="text-sm text-gray-500">
                          {course?.modules.find((m) => m.id === nextLesson.module_id)?.title}
                        </div>
                      </div>
                      <div>
                        <button
                          onClick={() => goToLesson(nextLesson)}
                          className="px-4 py-2 bg-[#0A66C2] text-white rounded text-sm"
                        >
                          Continue
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">You have reached the end of this course.</p>
                  )}
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
