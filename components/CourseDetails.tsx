'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import RightbarRecruiters from '@/components/Rightbar';
import HeaderLoggedIn from '@/components/HeaderLoggedIn';
import Footer from '@/components/Footer';
import { PlayIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/solid';

interface Lesson {
  id: number;
  title: string;
  duration?: string;
}

interface Module {
  id: number;
  title: string;
  lessons?: Lesson[];
}

interface Course {
  id: number;
  title: string;
  description?: string;
  thumbnail?: string;
  price?: number;
  enrolled?: boolean;
  modules?: Module[];
}

export default function CourseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");
  const lessonId = searchParams.get("lessonId"); // <-- new query param

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [expandedModuleIds, setExpandedModuleIds] = useState<number[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  // Fetch course data
  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/learning/${courseId}`);
        setCourse(res.data);

        // If lessonId exists, redirect immediately to lesson page
        if (lessonId) {
          router.replace(`/dashboard/learning/lesson?courseId=${courseId}&lessonId=${lessonId}`);
        }
      } catch (err) {
        console.error(err);
        setMessage('Failed to fetch course data.');
        setStatus('error');
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id, courseId, lessonId, router]);

  // Handle Paystack redirect verification
  useEffect(() => {
    const reference = searchParams.get('trxref') || searchParams.get('reference');
    if (!reference) return;

    const verifyPayment = async () => {
      setStatus('loading');
      setMessage('Verifying your payment, please wait...');
      try {
        const res = await api.get(`/learning/${courseId}/payment-verify`, {
          params: { reference },
        });

        if (res.data.enrolled) {
          setStatus('success');
          setMessage('Payment successful! Redirecting to your course...');
          setCourse(prev => prev ? { ...prev, enrolled: true } : prev);

          // Redirect to first lesson if exists
          const firstLessonId = course?.modules?.find(m => m.lessons?.length)?.lessons?.[0]?.id;
          setTimeout(() => {
            if (firstLessonId) {
              router.replace(`/dashboard/learning/lesson?courseId=${courseId}&lessonId=${firstLessonId}`);
            } else {
              router.replace(`/dashboard/learning?courseId=${courseId}`);
            }
          }, 2500);
        } else {
          setStatus('error');
          setMessage(res.data.message || 'Payment verification failed.');
        }
      } catch (err: any) {
        console.error(err);
        setStatus('error');
        setMessage(err?.response?.data?.message || 'An error occurred during verification.');
      }
    };

    verifyPayment();
  }, [searchParams, courseId, router, course]);

  const startCourse = (specificLessonId?: number) => {
    if (!course) return;
    const firstLessonId = specificLessonId || course.modules?.find(m => m.lessons?.length)?.lessons?.[0]?.id;
    if (firstLessonId) {
      router.replace(`/dashboard/learning/lesson?courseId=${courseId}&lessonId=${firstLessonId}`);
    } else {
      router.replace(`/dashboard/learning?courseId=${courseId}`);
    }
  };

  const handleEnrollAndStart = async () => {
    if (!course) return;
    setProcessing(true);

    try {
      if (course.enrolled) {
        startCourse();
        return;
      }

      if (!course.price || course.price === 0) {
        const res = await api.post(`/learning/${course.id}/enroll`);
        if (res.data.enrolled) {
          setCourse({ ...course, enrolled: true });
          startCourse();
        } else {
          setStatus('error');
          setMessage(res.data.message || 'Failed to enroll. Try again.');
        }
      } else {
        const res = await api.post(`/learning/${course.id}/checkout`);
        const redirectUrl = res.data.authorization_url || res.data.url;
        if (redirectUrl) window.location.href = redirectUrl;
        else setStatus('error');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const toggleModule = (moduleId: number) => {
    setExpandedModuleIds(prev => prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]);
  };

  return (
    <>
      <HeaderLoggedIn />
      <div className="bg-gray-50 min-h-screen pt-2">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-6 flex gap-6">
          <aside className="w-[280px] hidden lg:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
            <Sidebar />
          </aside>

          <main className="flex-1 py-8">
            {loading ? <p>Loading course...</p> : !course ? <p>Course not found.</p> : (
              <>
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                  <h1 className="text-3xl font-bold text-[#0A66C2]">{course.title}</h1>
                  <p className="mt-2 text-gray-600">{course.description}</p>
                  <img src={course.thumbnail || '/cover_photo.jpg'} alt={course.title} className="w-full h-64 object-cover rounded mt-4" />

                  <button
                    onClick={handleEnrollAndStart}
                    disabled={processing}
                    className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-[#0A66C2] text-white font-medium rounded hover:bg-[#004182] disabled:opacity-60"
                  >
                    <PlayIcon className="w-5 h-5" />
                    {course.enrolled ? 'Continue Course' : 'Enroll & Start'}
                  </button>

                  {status !== 'idle' && (
                    <div className="mt-4 flex flex-col items-center gap-2">
                      {status === 'loading' && (
                        <div className="flex flex-col items-center gap-2">
                          <ClockIcon className="w-8 h-8 text-blue-500 animate-spin" />
                          <p className="text-gray-700">{message}</p>
                        </div>
                      )}
                      {status === 'success' && (
                        <div className="flex flex-col items-center gap-2">
                          <CheckCircleIcon className="w-8 h-8 text-green-500 animate-bounce" />
                          <p className="text-green-700 font-semibold">{message}</p>
                        </div>
                      )}
                      {status === 'error' && (
                        <div className="flex flex-col items-center gap-2">
                          <XCircleIcon className="w-8 h-8 text-red-500" />
                          <p className="text-red-600 font-semibold">{message}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6 mb-16">
                  <h2 className="text-2xl font-semibold mb-4">Course Modules</h2>
                  {course.modules?.map(m => {
                    const isExpanded = expandedModuleIds.includes(m.id);
                    return (
                      <div key={m.id} className="mb-4 border-b pb-2">
                        <button
                          onClick={() => toggleModule(m.id)}
                          className="w-full flex justify-between items-center py-2 text-left font-medium text-gray-800 hover:text-[#0A66C2]"
                        >
                          {m.title} ({m.lessons?.length || 0} lessons)
                          {isExpanded ? <ChevronUpIcon className="w-5 h-5 text-gray-500" /> : <ChevronDownIcon className="w-5 h-5 text-gray-500" />}
                        </button>
                        {isExpanded && m.lessons?.length && (
                          <ul className="ml-4 mt-2 list-decimal list-inside text-gray-700">
                            {m.lessons.map(l => (
                              <li key={l.id} className="py-1 flex justify-between">
                                <span>{l.title}</span>
                                {l.duration && <span className="text-sm text-gray-500">{l.duration}</span>}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </main>

          <aside className="w-[320px] hidden xl:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
            <RightbarRecruiters />
          </aside>
        </div>
      </div>
      <Footer />
    </>
  );
}
