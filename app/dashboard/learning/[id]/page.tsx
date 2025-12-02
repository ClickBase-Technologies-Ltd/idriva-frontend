'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import RightbarRecruiters from '@/components/Rightbar';
import HeaderLoggedIn from '@/components/HeaderLoggedIn';
import api from '@/lib/api';

interface Course {
  id: number;
  title: string;
  description?: string;
  thumbnail?: string | null;
  price?: number | null;
  enrolled?: boolean;
  modules?: any[];
}

export default function CoursePage({ params }: { params: { id: string } }) {
  const courseId = params.id;
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    let mounted = true;
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/learning/${courseId}`);
        if (!mounted) return;
        setCourse(res.data);
      } catch (err) {
        console.error('fetch course', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchCourse();
    return () => { mounted = false; };
  }, [courseId]);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      (async () => {
        try {
          setProcessing(true);
          await api.post(`/learning/${courseId}/confirm-payment`, { sessionId });
          const res = await api.get(`/learning/${courseId}`);
          setCourse(res.data);
          // remove session param by navigation (optional)
          router.replace(`/dashboard/learning/${courseId}`);
        } catch (e) {
          console.error('Payment confirm failed', e);
        } finally {
          setProcessing(false);
        }
      })();
    }
  }, [searchParams, courseId, router]);

  const handleBuy = async () => {
    if (!course) return;
    try {
      setProcessing(true);
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id,
          courseTitle: course.title,
          price: course.price || 0
        })
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error('checkout', err);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-8">Loading course...</div>;
  if (!course) return <div className="p-8">Course not found</div>;

  return (
    <>
      <HeaderLoggedIn />
      <div className="max-w-[1360px] mx-auto px-4 lg:px-6 flex gap-6 pt-16">
        <aside className="w-[280px] hidden lg:block sticky top-16">
          <Sidebar />
        </aside>

        <main className="flex-1 py-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow">
            <div className="flex gap-6">
              <img src={course.thumbnail || '/learning-placeholder.png'} alt={course.title} className="w-48 h-32 object-cover rounded" />
              <div className="flex-1">
                <h1 className="text-2xl font-bold">{course.title}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{course.description}</p>
                <div className="mt-4 flex items-center gap-4">
                  <div className="text-lg font-semibold">
                    {typeof course.price === 'number' ? `$${course.price.toFixed(2)}` : 'Free'}
                  </div>
                  {course.enrolled ? (
                    <button onClick={() => router.push(`/dashboard/learning/${course.id}/lesson/1`)} className="px-4 py-2 bg-green-600 text-white rounded">Continue course</button>
                  ) : (
                    <button onClick={handleBuy} disabled={processing} className="px-4 py-2 bg-blue-600 text-white rounded">
                      {processing ? 'Processing...' : (course.price ? `Buy for $${(course.price||0).toFixed(2)}` : 'Enroll')}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Modules list */}
            {course.modules && course.modules.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Modules</h3>
                <ul className="space-y-2">
                  {course.modules.map((m: any) => (
                    <li key={m.id} className="p-3 rounded border dark:border-gray-700">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{m.title}</div>
                          <div className="text-xs text-gray-500">{m.lessons?.length ?? 0} lessons</div>
                        </div>
                        <div>
                          {course.enrolled ? <button onClick={() => router.push(`/dashboard/learning/${course.id}/lesson/${m.lessons?.[0]?.id || 1}`)} className="text-sm text-blue-600">Start</button> : <span className="text-sm text-gray-500">Locked</span>}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </main>

        <aside className="w-[320px] hidden xl:block sticky top-16">
          <RightbarRecruiters />
        </aside>
      </div>
    </>
  );
}