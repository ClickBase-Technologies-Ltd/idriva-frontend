'use client';

export const dynamic = "force-dynamic"; // ✅ Fix for Next.js 16 + dynamic route

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import HeaderLoggedIn from '@/components/HeaderLoggedIn';
import Sidebar from '@/components/Sidebar';
import RightbarRecruiters from '@/components/Rightbar';

type ModuleItem = { id: number; course_id: number; title: string; position?: number; created_at?: string };
type LessonItem = {
  id: number;
  module_id: number;
  title: string;
  content_type?: string | null;
  duration_seconds?: number | null;
};

export default function CourseManagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');

  const API = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [lessonsByModule, setLessonsByModule] = useState<Record<number, LessonItem[]>>({});
  const [openModules, setOpenModules] = useState<Record<number, boolean>>({});
  const [modulesLoading, setModulesLoading] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    fetchCourse();
    fetchModulesForCourse();
  }, [courseId]);

  async function fetchCourse() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/instructor/courses/${courseId}`, { credentials: 'include', headers: { Accept: 'application/json' } });
      if (!res.ok) {
        setError(`Failed to load (${res.status})`);
        setCourse(null);
        return;
      }
      const json = await res.json().catch(() => ({}));
      const data = json.data ?? json;
      setCourse(data);
    } catch (e) {
      console.error(e);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  async function fetchModulesForCourse() {
    if (!courseId) return;
    setModulesLoading(true);
    try {
      const res = await fetch(`${API}/instructor/modules`, { credentials: 'include', headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('Failed to load modules');
      const json = await res.json().catch(() => ({}));
      const list = Array.isArray(json) ? json : (json && json.data) ? json.data : [];
      const filtered = list
        .map((m: any) => ({
          id: Number(m.id),
          course_id: Number(m.course_id ?? m.courseId ?? 0),
          title: String(m.title ?? ''),
          position: typeof m.position !== 'undefined' ? Number(m.position) : 0,
          created_at: m.created_at ?? m.createdAt ?? undefined,
        }))
        .filter((m: ModuleItem) => String(m.course_id) === String(courseId))
        .sort((a: ModuleItem, b: ModuleItem) => (Number(a.position ?? 0) - Number(b.position ?? 0)));
      setModules(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setModulesLoading(false);
    }
  }

  async function fetchLessonsForModule(moduleId: number) {
    try {
      const res = await fetch(`${API}/instructor/lessons?module_id=${moduleId}`, { credentials: 'include', headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('Failed to load lessons');
      const json = await res.json().catch(() => ({}));
      const data = Array.isArray(json) ? json : (json && json.data) ? json.data : [];
      const lessons = data.map((l: any) => ({
        id: Number(l.id),
        module_id: Number(l.module_id ?? l.moduleId ?? moduleId),
        title: String(l.title ?? ''),
        content_type: l.content_type ?? l.contentType ?? null,
        duration_seconds: typeof l.duration_seconds !== 'undefined' ? (l.duration_seconds === null ? null : Number(l.duration_seconds)) : null,
      })) as LessonItem[];
      setLessonsByModule(prev => ({ ...prev, [moduleId]: lessons }));
    } catch (err) {
      console.error(err);
    }
  }

  function toggleModuleOpen(m: ModuleItem) {
    setOpenModules(prev => {
      const next = { ...prev, [m.id]: !prev[m.id] };
      if (next[m.id] && !lessonsByModule[m.id]) fetchLessonsForModule(m.id);
      return next;
    });
  }

  async function togglePublish() {
    if (!course || !courseId) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/instructor/courses/${courseId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ published: !course.published }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setCourse(prev => ({ ...prev, published: !prev.published }));
      } else {
        alert(json.error ?? 'Failed to update publish status');
      }
    } catch (e) {
      console.error(e);
      alert('Network error');
    } finally {
      setSaving(false);
    }
  }

  async function removeCourse() {
    if (!courseId || !confirm('Delete this course? This cannot be undone.')) return;
    try {
      const res = await fetch(`${API}/instructor/courses/${courseId}`, { method: 'DELETE', credentials: 'include', headers: { Accept: 'application/json' } });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        router.push('/instructor/my-courses');
      } else {
        alert(json.error ?? 'Failed to delete');
      }
    } catch (e) {
      console.error(e);
      alert('Network error');
    }
  }

  function formatDuration(seconds?: number | null) {
    if (!seconds && seconds !== 0) return '—';
    let s = Number(seconds || 0);
    const hh = Math.floor(s / 3600);
    s -= hh * 3600;
    const mm = Math.floor(s / 60);
    const ss = s - mm * 60;
    return hh > 0
      ? `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`
      : `${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
  }

  return (
    <>
      <HeaderLoggedIn />
      <div className="pt-16 bg-[#eef3f8] dark:bg-gray-900 min-h-screen">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-6 flex gap-6 mt-[-64px]">
          <aside className="w-[280px] hidden lg:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
            <Sidebar />
          </aside>

          <main className="flex-1 py-8">
            <div className="max-w-[900px] mx-auto">
              {loading ? (
                <div className="p-8 text-center">Loading…</div>
              ) : error ? (
                <div className="p-4 bg-red-50 text-red-700 rounded">{error}</div>
              ) : !course ? (
                <div className="p-8">Course not found</div>
              ) : (
                <>
                  {/* Course Header */}
                  <div className="bg-white dark:bg-gray-800 rounded shadow p-6 mb-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h1 className="text-2xl font-semibold text-[#0A66C2]">{course.title}</h1>
                        <div className="text-sm text-gray-500 mt-1">{course.description}</div>
                        <div className="text-xs text-gray-500 mt-2">
                          {course.published ? <span className="text-green-600">Published</span> : <span className="text-yellow-600">Draft</span>}
                          {' • '}
                          {course.created_at ? new Date(course.created_at).toLocaleDateString() : ''}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button onClick={() => router.push(`/instructor/courses/edit?courseId=${courseId}`)} className="px-3 py-2 border rounded">Edit</button>
                        <button
                          onClick={() => router.push(`/instructor/modules/create?course_id=${encodeURIComponent(courseId!)}`)}
                          className="px-3 py-2 border rounded"
                        >
                          Add / Manage Modules
                        </button>
                        <button onClick={togglePublish} disabled={saving} className={`px-3 py-2 rounded ${course.published ? 'bg-white border' : 'bg-[#0A66C2] text-white'}`}>
                          {course.published ? 'Unpublish' : 'Publish'}
                        </button>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Details</h3>
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>Price: <span className="font-medium">{course.price ?? 0}</span></div>
                        <div>Students: <span className="font-medium">{course.students_count ?? course.studentsCount ?? 0}</span></div>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                      <button onClick={removeCourse} className="px-3 py-2 border border-red-300 text-red-700 rounded">Delete course</button>
                    </div>
                  </div>

                  {/* Modules list */}
                  <section className="space-y-4">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-xl font-semibold">Modules</h2>
                      <div className="text-sm text-gray-500">{modules.length} module{modules.length !== 1 ? 's' : ''}</div>
                    </div>

                    {modulesLoading ? (
                      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg text-center">Loading modules…</div>
                    ) : modules.length === 0 ? (
                      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg text-center">
                        No modules yet. <button onClick={() => router.push(`/instructor/modules/create?course_id=${encodeURIComponent(courseId!)}`)} className="text-[#0A66C2] underline ml-1">Create module</button>
                      </div>
                    ) : modules.map((m) => (
                      <div key={m.id} className="bg-white dark:bg-gray-800 border rounded-lg p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-md bg-[#0A66C2] flex items-center justify-center text-white font-semibold">
                              {String(m.title || '').slice(0,1).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-medium">{m.title}</div>
                              <div className="text-xs text-gray-500 mt-1">Created {m.created_at ? new Date(m.created_at).toLocaleDateString() : '—'}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button onClick={() => toggleModuleOpen(m)} className="px-3 py-1 border rounded-md text-sm bg-white">
                              {openModules[m.id] ? 'Hide lessons' : 'Show lessons'}
                            </button>
                            <button onClick={() => router.push(`/instructor/modules/create?course_id=${encodeURIComponent(courseId!)}&module_id=${m.id}`)} className="px-3 py-1 bg-[#0A66C2] hover:bg-[#0959a8] text-white rounded-md text-sm">
                              Add lesson
                            </button>
                          </div>
                        </div>

                        {openModules[m.id] && (
                          <div className="mt-4 border-t pt-4">
                            {(!lessonsByModule[m.id] || lessonsByModule[m.id].length === 0) ? (
                              <div className="p-4 text-sm text-gray-500">No lessons yet. Use "Add lesson" to create one.</div>
                            ) : (
                              <div className="space-y-3">
                                {lessonsByModule[m.id].map((l) => (
                                  <div key={l.id} className="flex items-center justify-between p-3 rounded hover:bg-gray-50 dark:hover:bg-gray-900">
                                    <div>
                                      <div className="text-sm font-medium">{l.title}</div>
                                      <div className="text-xs text-gray-500 mt-1">{(l.content_type ?? '—').toUpperCase()} • {formatDuration(l.duration_seconds)}</div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <button onClick={() => router.push(`/instructor/modules/create?course_id=${encodeURIComponent(courseId!)}&module_id=${m.id}&lesson_id=${l.id}`)} className="px-3 py-1 border rounded-md text-sm">Open</button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </section>
                </>
              )}
            </div>
          </main>

          <aside className="w-[320px] hidden xl:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
            <RightbarRecruiters />
          </aside>
        </div>
      </div>
    </>
  );
}
