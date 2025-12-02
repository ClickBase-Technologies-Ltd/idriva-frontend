'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import RightbarRecruiters from '@/components/Rightbar';
import HeaderLoggedIn from '@/components/HeaderLoggedIn';
import api from '@/lib/api';
import {
  AcademicCapIcon,
  CurrencyDollarIcon,
  PlayIcon,
  BookmarkIcon,
  ChevronRightIcon,
  UserGroupIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

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
  thumbnail?: string | null;
  price?: number | null;
  enrolled?: boolean;
  modules?: Module[];
  instructor?: {
    id?: number;
    name?: string;
    avatar?: string | null;
  };
  published?: boolean | number | string;
  tags?: string[];
  created_at?: string | null;
}

export default function LearningIndexPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [checkoutLoadingId, setCheckoutLoadingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'free' | 'paid'>('all');

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/learning'); // fetch from backend
      const data = res.data;
      const list: Course[] = Array.isArray(data) ? data : data.courses || [];
      const published = list.filter((c) => {
        const p = c?.published;
        return p === true || p === 1 || p === '1' || p === 'true';
      });
      setCourses(published);
    } catch (e) {
      console.error('Failed to load courses', e);
      setError('Failed to load courses. Please try again.');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectCourse = (c: Course) => {
    router.push(`/dashboard/learning/${c.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startCourse = (c: Course) => {
    const lessonId = c.modules?.[0]?.lessons?.[0]?.id || 1;
    router.push(`/dashboard/learning/${c.id}/lesson/${lessonId}`);
  };

  const handleBuy = async (c: Course) => {
    try {
      setCheckoutLoadingId(c.id);
      setProcessing(true);
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: c.id,
          courseTitle: c.title,
          price: c.price || 0,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data?.url) {
        window.location.href = data.url;
      } else {
        setError(data?.message || 'Failed to start checkout. Try again later.');
      }
    } catch (err) {
      console.error('checkout', err);
      setError('Checkout failed. Please try again.');
    } finally {
      setProcessing(false);
      setCheckoutLoadingId(null);
    }
  };

  const filteredCourses = courses.filter((c) => {
    if (filter === 'all') return true;
    if (filter === 'free') return !c.price || c.price === 0;
    if (filter === 'paid') return !!c.price && c.price > 0;
    return true;
  });

  return (
    <>
      <HeaderLoggedIn />
      <div className="bg-gray-50 min-h-screen pt-2">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-6 flex gap-6">
          <aside className="w-[280px] hidden lg:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
            <Sidebar />
          </aside>

          <main className="flex-1 py-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-semibold text-[#0A66C2]">Learning</h1>
                <p className="text-gray-600 mt-1">Published courses — discover, enroll and start learning.</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center bg-white border rounded-full px-2 py-1 shadow-sm">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1 rounded-full text-sm ${filter === 'all' ? 'bg-[#0A66C2] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter('free')}
                    className={`px-3 py-1 rounded-full text-sm ${filter === 'free' ? 'bg-[#0A66C2] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    Free
                  </button>
                  <button
                    onClick={() => setFilter('paid')}
                    className={`px-3 py-1 rounded-full text-sm ${filter === 'paid' ? 'bg-[#0A66C2] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    Paid
                  </button>
                </div>

                <button
                  onClick={fetchCourses}
                  title="Refresh"
                  className="p-2 rounded-full bg-white border hover:bg-gray-50 shadow-sm"
                >
                  <ArrowPathIcon className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-8 bg-white rounded shadow-md text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
                <p className="mt-4 text-gray-600">Loading published courses...</p>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded mb-4">{error}</div>
            ) : filteredCourses.length === 0 ? (
              <div className="p-8 bg-white rounded shadow text-center">
                <h3 className="text-lg font-medium">No published courses available</h3>
                <p className="text-sm text-gray-500 mt-2">Instructors publish courses; check back later or contact support.</p>
                <div className="mt-4 flex justify-center gap-3">
                  <button onClick={fetchCourses} className="px-4 py-2 border rounded-md text-sm">Retry</button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredCourses.map((c) => (
                    <article
                    key={c.id}
                    className="bg-white rounded-lg shadow-sm border hover:shadow-md transition overflow-hidden flex flex-col"
                    >
                    {/* Thumbnail */}
                    <div className="relative h-44 w-full bg-gray-100">
                        <img
                        src={
                            c.thumbnail && c.thumbnail.trim() !== ''
                            ? c.thumbnail
                            : '/cover_photo.jpg'
                        }
                        alt={c.title}
                        className="w-full h-full object-cover"
                        />
                        <div className="absolute left-3 bottom-3 bg-white/90 text-xs text-gray-700 rounded-full px-2 py-1 flex items-center gap-2 shadow-sm">
                        <AcademicCapIcon className="w-4 h-4 text-blue-600" />
                        <span>
                            {c.modules?.length ?? 0} module
                            {(c.modules?.length ?? 0) === 1 ? '' : 's'}
                        </span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex-1 flex flex-col">
                        <h3 className="text-lg font-medium text-gray-900 line-clamp-2">
                        {c.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-2 line-clamp-3">{c.description}</p>

                        {/* Instructor + Price */}
                        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-3">
                            <img
                            src={
                                c.instructor?.avatar && c.instructor?.avatar.trim() !== ''
                                ? c.instructor.avatar
                                : '/avatar.png'
                            }
                            alt={c.instructor?.name || 'Instructor'}
                            className="w-8 h-8 rounded-full object-cover"
                            />
                            <div>
                            <div className="text-xs text-gray-800">
                                {c.instructor?.name || 'iDriva'}
                            </div>
                            <div className="text-xs text-gray-500">
                                {c.created_at
                                ? new Date(c.created_at).toLocaleDateString()
                                : ''}
                            </div>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                            <CurrencyDollarIcon className="w-4 h-4 text-gray-500" />
                            <span>
                                {typeof c.price === 'number' && c.price > 0
                                ? `$${c.price.toFixed(2)}`
                                : 'Free'}
                            </span>
                            </div>
                        </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            {c.enrolled ? (
                            <button
                                onClick={() => startCourse(c)}
                                className="inline-flex items-center gap-2 px-3 py-2 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-md text-sm"
                            >
                                <PlayIcon className="w-4 h-4" />
                                Continue
                            </button>
                            ) : (
                            <button
                                onClick={() => handleBuy(c)}
                                disabled={processing && checkoutLoadingId === c.id}
                                className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm disabled:opacity-60"
                            >
                                {processing && checkoutLoadingId === c.id ? (
                                <span className="inline-flex items-center gap-2">
                                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                    Processing
                                </span>
                                ) : (
                                <>
                                    <CurrencyDollarIcon className="w-4 h-4" />
                                    <span>{c.price && c.price > 0 ? 'Buy' : 'Enroll'}</span>
                                </>
                                )}
                            </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                            onClick={() => selectCourse(c)}
                            className="text-sm text-gray-700 hover:text-gray-900 flex items-center gap-2"
                            >
                            Enroll
                            <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                            </button>

                            <button
                            onClick={() =>
                                navigator.clipboard?.writeText(
                                `${location.origin}/dashboard/learning/${c.id}`
                                )
                            }
                            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                            title="Copy link"
                            >
                            <BookmarkIcon className="w-4 h-4" />
                            </button>
                        </div>
                        </div>

                        {/* Tags */}
                        {c.tags?.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {c.tags.slice(0, 4).map((t) => (
                            <span
                                key={t}
                                className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full"
                            >
                                {t}
                            </span>
                            ))}
                        </div>
                        ) : null}
                    </div>
                    </article>

                  ))}
                </div>

                <div className="mt-6 text-sm text-gray-500 flex items-center gap-2">
                  <UserGroupIcon className="w-4 h-4 text-gray-400" />
                  Join cohorts, track progress, and get certified by completing courses.
                </div>
              </>
            )}
          </main>

          <aside className="w-[320px] hidden xl:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
            <RightbarRecruiters />
          </aside>
        </div>
      </div>
    </>
  );
}
