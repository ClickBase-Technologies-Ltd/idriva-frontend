'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import HeaderLoggedIn from '@/components/HeaderLoggedIn';
import Sidebar from '@/components/Sidebar';
import RightbarRecruiters from '@/components/Rightbar';

type CourseItem = { id: number; title: string };
type ModuleItem = { id: number; course_id: number; title: string; position?: number; created_at?: string };
type LessonItem = {
  id: number;
  module_id: number;
  title: string;
  content?: string | null;
  content_type?: string;
  content_url?: string | null;
  duration_seconds?: number | null;
  position?: number;
  published?: boolean;
};

export default function CreateModulePage() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [lessonsByModule, setLessonsByModule] = useState<Record<number, LessonItem[]>>({});
  const [openModules, setOpenModules] = useState<Record<number, boolean>>({});
  const [courseId, setCourseId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{ type: 'error' | 'success' | ''; message: string }>({ type: '', message: '' });
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Record<number, string>>({});
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [lessonModuleId, setLessonModuleId] = useState<number | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonContentType, setLessonContentType] = useState<'video'|'pdf'|'html'|'text'>('video');
  const [lessonUrl, setLessonUrl] = useState('');
  const [lessonDuration, setLessonDuration] = useState(''); // e.g. "05:30"
  const [lessonSaving, setLessonSaving] = useState(false);
  const [lessonError, setLessonError] = useState('');
  const [lessonEditorOpen, setLessonEditorOpen] = useState(false);
  const [activeLesson, setActiveLesson] = useState<LessonItem | null>(null);
  const [editorSaving, setEditorSaving] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const API = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';

  useEffect(() => { fetchAll(); /* eslint-disable-next-line */ }, []);

  // If a course_id query param is present, preselect that course after courses load
  useEffect(() => {
    const sp = searchParams?.get?.('course_id') ?? searchParams?.get?.('course');
    if (!sp) return;
    const num = Number(sp);
    if (Number.isNaN(num)) return;
    // if courses already loaded, ensure we set; otherwise fetchAll will not overwrite
    if (courses.length > 0) {
      // set only if current courseId is empty to avoid clobbering user's selection
      if (courseId === '') setCourseId(num);
    } else {
      // no courses loaded yet — set so when fetchAll runs it may be preserved
      setCourseId(num);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, courses]);

  async function fetchAll() {
    setLoading(true);
    setStatus({ type: '', message: '' });
    try {
      const [rc, rm] = await Promise.all([
        fetch(`${API}/instructor/courses`, { credentials: 'include' }),
        fetch(`${API}/instructor/modules`, { credentials: 'include' }),
      ]);
      if (!rc.ok) throw new Error('Failed to load courses');
      if (!rm.ok) throw new Error('Failed to load modules');

      const pc = await rc.json().catch(() => ({}));
      const pm = await rm.json().catch(() => ({}));
      const coursesData = Array.isArray(pc) ? pc : (pc && pc.data) ? pc.data : [];
      const modulesData = Array.isArray(pm) ? pm : (pm && pm.data) ? pm.data : [];

      setCourses(coursesData.map((c: any) => ({ id: Number(c.id), title: c.title })));
      setModules(modulesData.map((m: any) => ({
        id: Number(m.id),
        course_id: Number(m.course_id ?? m.courseId ?? 0),
        title: String(m.title ?? ''),
        position: typeof m.position !== 'undefined' ? Number(m.position) : 0,
        created_at: m.created_at ?? m.createdAt ?? undefined,
      })));
      // if a query param was set earlier but courses were empty then, ensure we keep it
      const sp = searchParams?.get?.('course_id') ?? searchParams?.get?.('course');
      if (sp && courseId === '') {
        const num = Number(sp);
        if (!Number.isNaN(num)) setCourseId(num);
      }
    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', message: 'Failed to load data. Try refresh.' });
    } finally {
      setLoading(false);
    }
  }

  // lazy load lessons for opened modules
  useEffect(() => {
    if (!courseId) return;
    const moduleIds = modulesForCourse.map(m => m.id);
    moduleIds.forEach(id => { if (!lessonsByModule[id] && openModules[id]) fetchLessonsForModule(id); });
    // eslint-disable-next-line
  }, [modules, courseId, openModules]);

  const modulesForCourse = useMemo(() => {
    if (!courseId) return [];
    const list = modules.filter(m => Number(m.course_id) === Number(courseId));
    const filtered = search.trim()
      ? list.filter(m => m.title.toLowerCase().includes(search.trim().toLowerCase()))
      : list;
    return filtered.sort((a, b) => (Number(a.position ?? 0) - Number(b.position ?? 0)));
  }, [modules, courseId, search]);

  function parseDurationToSeconds(input: string): number | null {
    if (!input) return null;
    const parts = input.split(':').map(p => Number(p));
    if (parts.some(isNaN)) return null;
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return null;
  }

  function formatDuration(seconds?: number | null) {
    if (!seconds && seconds !== 0) return '—';
    let s = Number(seconds || 0);
    const hh = Math.floor(s / 3600);
    s -= hh * 3600;
    const mm = Math.floor(s / 60);
    const ss = s - mm * 60;
    return hh > 0 ? `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}` : `${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
  }

  async function fetchLessonsForModule(moduleId: number) {
    try {
      const res = await fetch(`${API}/instructor/lessons?module_id=${moduleId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load lessons');
      const json = await res.json().catch(() => ({}));
      const data = Array.isArray(json) ? json : (json && json.data) ? json.data : [];
      const lessons = data.map((l: any) => ({
        id: Number(l.id),
        module_id: Number(l.module_id ?? l.moduleId ?? moduleId),
        title: String(l.title ?? ''),
        content: l.content ?? null,
        content_type: l.content_type ?? l.contentType ?? 'video',
        content_url: l.content_url ?? l.contentUrl ?? null,
        duration_seconds: typeof l.duration_seconds !== 'undefined' ? (l.duration_seconds === null ? null : Number(l.duration_seconds)) : null,
        position: typeof l.position !== 'undefined' ? Number(l.position) : 0,
        published: typeof l.published !== 'undefined' ? Boolean(l.published) : true,
      })) as LessonItem[];

      setLessonsByModule(prev => ({ ...prev, [moduleId]: lessons.sort((a,b) => (Number(a.position ?? 0) - Number(b.position ?? 0))) }));
    } catch (err) {
      console.error(err);
    }
  }

  async function openAddLessonModal(moduleId: number) {
    setLessonModuleId(moduleId);
    setLessonTitle('');
    setLessonContent('');
    setLessonContentType('video');
    setLessonUrl('');
    setLessonDuration('');
    setLessonError('');
    setLessonModalOpen(true);
  }

  async function submitLesson(e?: React.FormEvent) {
    e?.preventDefault();
    setLessonError('');
    if (!lessonModuleId) return setLessonError('No module selected.');
    if (!lessonTitle.trim()) return setLessonError('Provide a lesson title.');

    const durationSeconds = parseDurationToSeconds(lessonDuration);
    if (lessonDuration && durationSeconds === null) {
      return setLessonError('Duration must be in mm:ss or hh:mm:ss or seconds format.');
    }

    if (lessonUrl && !/^https?:\/\//i.test(lessonUrl)) {
      return setLessonError('Content URL must start with http:// or https://');
    }

    setLessonSaving(true);
    try {
      const payload: any = {
        module_id: lessonModuleId,
        title: lessonTitle.trim(),
        content: lessonContent || undefined,
        content_type: lessonContentType,
        content_url: lessonUrl || undefined,
        duration_seconds: durationSeconds ?? undefined,
      };

      const res = await fetch(`${API}/instructor/lessons`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok && (json.ok === true || json.created === true)) {
        const created: LessonItem = {
          id: Number(json.data?.id ?? Date.now()),
          module_id: Number(lessonModuleId),
          title: String(json.data?.title ?? lessonTitle.trim()),
          content: (json.data && typeof json.data.content !== 'undefined') ? json.data.content : (lessonContent || null),
          content_type: (json.data && typeof json.data.content_type !== 'undefined') ? json.data.content_type : lessonContentType,
          content_url: (json.data && typeof json.data.content_url !== 'undefined') ? json.data.content_url : (lessonUrl || null),
          duration_seconds: (json.data && typeof json.data.duration_seconds !== 'undefined') ? json.data.duration_seconds : (durationSeconds ?? null),
          position: (json.data && typeof json.data.position !== 'undefined') ? json.data.position : undefined,
          published: (json.data && typeof json.data.published !== 'undefined') ? Boolean(json.data.published) : true,
        };

        setLessonsByModule(prev => {
          const list = (prev[created.module_id] ?? []).concat(created);
          return { ...prev, [created.module_id]: list.sort((a,b) => (Number(a.position ?? 0) - Number(b.position ?? 0))) };
        });

        setOpenModules(prev => ({ ...prev, [created.module_id]: true }));
        setLessonModalOpen(false);
        setLessonSaving(false);
        setStatus({ type: 'success', message: 'Lesson created.' });
        setTimeout(() => setStatus({ type: '', message: '' }), 3000);
        return;
      }

      if (json && json.error) setLessonError(String(json.error));
      else if (json && json.errors) {
        const first = Object.values(json.errors)[0];
        setLessonError(Array.isArray(first) ? String(first[0]) : String(first));
      } else {
        setLessonError('Failed to create lesson.');
      }
    } catch (err) {
      console.error(err);
      setLessonError('Network error. Please try again.');
    } finally {
      setLessonSaving(false);
    }
  }

  async function fetchLessonAndOpenEditor(lessonId: number) {
    try {
      setActiveLesson(null);
      setEditorSaving(false);
      const res = await fetch(`${API}/instructor/lessons/${lessonId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load lesson');
      const json = await res.json().catch(() => ({}));
      const l = (json && json.data) ? json.data : json;
      const lesson: LessonItem = {
        id: Number(l.id),
        module_id: Number(l.module_id ?? l.moduleId ?? 0),
        title: String(l.title ?? ''),
        content: l.content ?? null,
        content_type: l.content_type ?? l.contentType ?? 'video',
        content_url: l.content_url ?? l.contentUrl ?? null,
        duration_seconds: typeof l.duration_seconds !== 'undefined' ? (l.duration_seconds === null ? null : Number(l.duration_seconds)) : null,
        position: typeof l.position !== 'undefined' ? Number(l.position) : 0,
        published: typeof l.published !== 'undefined' ? Boolean(l.published) : true,
      };
      setActiveLesson(lesson);
      setLessonEditorOpen(true);
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Failed to open lesson.' });
      setTimeout(() => setStatus({ type: '', message: '' }), 2500);
    }
  }

  async function saveLessonEdits(payload: Partial<LessonItem>) {
    if (!activeLesson) return;
    setEditorSaving(true);
    try {
      const res = await fetch(`${API}/instructor/lessons/${activeLesson.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && (json.ok === true || json.updated === true)) {
        const updated = (json.data) ? json.data : { ...activeLesson, ...payload };
        setLessonsByModule(prev => {
          const list = (prev[Number(updated.module_id)] ?? []).map(l => l.id === updated.id ? ({
            id: Number(updated.id),
            module_id: Number(updated.module_id),
            title: String(updated.title ?? ''),
            content: updated.content ?? null,
            content_type: updated.content_type ?? 'video',
            content_url: updated.content_url ?? null,
            duration_seconds: typeof updated.duration_seconds !== 'undefined' ? updated.duration_seconds : null,
            position: typeof updated.position !== 'undefined' ? Number(updated.position) : 0,
            published: typeof updated.published !== 'undefined' ? Boolean(updated.published) : true,
          }) : l);
          return { ...prev, [Number(updated.module_id)]: list.sort((a,b) => (Number(a.position ?? 0) - Number(b.position ?? 0))) };
        });
        setActiveLesson(prev => prev ? { ...prev, ...payload } : prev);
        setStatus({ type: 'success', message: 'Saved.' });
        setTimeout(() => setStatus({ type: '', message: '' }), 2000);
        setLessonEditorOpen(false);
        return;
      }
      alert(json.error ?? 'Failed to save.');
    } catch (err) {
      console.error(err);
      alert('Network error.');
    } finally {
      setEditorSaving(false);
    }
  }

  async function deleteLesson(moduleId: number, lessonId: number) {
    if (!confirm('Delete this lesson?')) return;
    try {
      const res = await fetch(`${API}/instructor/lessons/${lessonId}`, { method: 'DELETE', credentials: 'include' });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.deleted === true) {
        setLessonsByModule(prev => {
          const list = (prev[moduleId] ?? []).filter(l => l.id !== lessonId);
          return { ...prev, [moduleId]: list };
        });
        setStatus({ type: 'success', message: 'Lesson deleted.' });
        setTimeout(() => setStatus({ type: '', message: '' }), 2500);
        return;
      }
      alert(json.error ?? 'Failed to delete lesson.');
    } catch (err) {
      console.error(err);
      alert('Network error.');
    }
  }

  // move lesson up or down in the UI and persist positions (swap with neighbor)
  async function moveLesson(moduleId: number, lessonId: number, direction: 'up' | 'down') {
    const list = [...(lessonsByModule[moduleId] ?? [])];
    const idx = list.findIndex(l => l.id === lessonId);
    if (idx === -1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= list.length) return;
    const a = list[idx];
    const b = list[swapIdx];

    // prepare positions (fall back to indexes if positions missing)
    const posA = typeof a.position !== 'undefined' ? a.position ?? idx + 1 : idx + 1;
    const posB = typeof b.position !== 'undefined' ? b.position ?? swapIdx + 1 : swapIdx + 1;

    // swap locally immediately for snappy UI
    const newList = [...list];
    newList[idx] = { ...b, position: posA };
    newList[swapIdx] = { ...a, position: posB };
    setLessonsByModule(prev => ({ ...prev, [moduleId]: newList.sort((x,y) => (Number(x.position ?? 0) - Number(y.position ?? 0))) }));

    // persist both
    try {
      await Promise.all([
        fetch(`${API}/instructor/lessons/${a.id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ position: posB }),
        }),
        fetch(`${API}/instructor/lessons/${b.id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ position: posA }),
        }),
      ]);
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Failed to persist order. Refresh to sync.' });
      setTimeout(() => setStatus({ type: '', message: '' }), 3000);
    }
  }

  async function submitModule(e?: React.FormEvent) {
    e?.preventDefault();
    setStatus({ type: '', message: '' });
    if (!courseId) return setStatus({ type: 'error', message: 'Select a course first.' });
    if (!title.trim()) return setStatus({ type: 'error', message: 'Provide a title.' });

    setSaving(true);
    try {
      const res = await fetch(`${API}/instructor/modules`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId, title: title.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && (json.ok === true || json.created === true)) {
        const created = json.data
          ? {
              id: Number(json.data.id),
              course_id: Number(json.data.course_id ?? json.data.courseId ?? courseId),
              title: String(json.data.title ?? title.trim()),
              position: json.data.position ?? (modulesForCourse.length ? (modulesForCourse[modulesForCourse.length - 1].position ?? 0) + 1 : 1),
              created_at: json.data.created_at ?? json.data.createdAt ?? new Date().toISOString(),
            } as ModuleItem
          : {
              id: Date.now(),
              course_id: courseId as number,
              title: title.trim(),
              position: (modulesForCourse.length ? (modulesForCourse[modulesForCourse.length - 1].position ?? 0) + 1 : 1),
              created_at: new Date().toISOString(),
            } as ModuleItem;

        setModules(prev => [...prev, created]);
        setTitle('');
        setStatus({ type: 'success', message: 'Module created.' });
        setTimeout(() => setStatus({ type: '', message: '' }), 3000);
        return;
      }

      if (json && json.error) setStatus({ type: 'error', message: String(json.error) });
      else if (json && json.errors) {
        const first = Object.values(json.errors)[0];
        setStatus({ type: 'error', message: Array.isArray(first) ? String(first[0]) : String(first) });
      } else {
        setStatus({ type: 'error', message: 'Failed to create module.' });
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Network error.' });
    } finally {
      setSaving(false);
    }
  }

  // LinkedIn-like color helpers
  const primary = 'bg-[#0A66C2]';
  const primaryHover = 'hover:bg-[#0959a8]';

  return (
    <>
      <HeaderLoggedIn />

      <div className="bg-[#eef3f8] dark:bg-gray-900 text-gray-900 dark:text-white pt-2 min-h-screen">
        <div className="w-full mx-auto px-4 lg:px-6 py-8">
          <div className="flex gap-6">
            <aside className="hidden lg:block w-72 sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto"><Sidebar /></aside>

            <main className="flex-1 max-w-6xl mx-auto">
              <header className="mb-6">
                <h1 className="text-2xl font-semibold text-[#0A66C2]">Create & Manage Modules</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Add lessons and manage them per module. Lessons show under each module.</p>
              </header>

              <div className="mb-6 flex flex-col md:flex-row gap-3 items-start md:items-center">
                <div className="flex-1">
                  <select value={courseId} onChange={e => setCourseId(e.target.value === '' ? '' : Number(e.target.value))} className="w-full md:w-80 p-3 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                    <option value="">Select course</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                  <button onClick={() => fetchAll()} className="px-4 py-2 bg-white dark:bg-gray-800 border rounded-md">Refresh</button>
                  <button onClick={() => { setCourseId(''); setSearch(''); }} className="px-4 py-2 bg-white dark:bg-gray-800 border rounded-md">Reset</button>
                </div>

                <div className="ml-auto w-full md:w-64">
                  <input placeholder="Search modules..." value={search} onChange={e => setSearch(e.target.value)} className="w-full p-2 border rounded-md bg-white dark:bg-gray-800" />
                </div>
              </div>

              <section className="mb-6 bg-white dark:bg-gray-800 border rounded-lg p-6">
                <form onSubmit={async (e) => { e.preventDefault(); await submitModule(e as any); }} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                  <div className="md:col-span-2">
                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="New module title" className="w-full p-3 border rounded-md bg-white dark:bg-gray-900" />
                  </div>

                  <div>
                    <button type="submit" disabled={saving} className={`w-full px-4 py-2 ${primary} ${primaryHover} text-white rounded-md`}>{saving ? 'Saving...' : 'Create module'}</button>
                  </div>

                  <div className="text-sm text-gray-500">Tip: Modules are ordered by position. Expand a module to see its lessons.</div>
                </form>

                {status.message && <div className={`mt-4 p-3 rounded text-sm ${status.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-800'}`}>{status.message}</div>}
              </section>

              <section className="space-y-4">
                {loading ? (
                  <div className="p-6 bg-white dark:bg-gray-800 rounded-lg text-center">Loading...</div>
                ) : !courseId ? (
                  <div className="p-6 bg-white dark:bg-gray-800 rounded-lg text-center">Choose a course to view its modules.</div>
                ) : modulesForCourse.length === 0 ? (
                  <div className="p-6 bg-white dark:bg-gray-800 rounded-lg text-center">No modules yet — create the first one.</div>
                ) : modulesForCourse.map(m => (
                  <div key={m.id} className="bg-white dark:bg-gray-800 border rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-md bg-[#0A66C2] flex items-center justify-center text-white font-medium">{m.position ?? '-'}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="text-sm font-medium">{m.title}</div>
                            <div className="text-xs text-gray-500 mt-1">Created {m.created_at ? new Date(m.created_at).toLocaleDateString() : '—'}</div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button onClick={() => setOpenModules(prev => ({ ...prev, [m.id]: !prev[m.id] }))} className="px-3 py-1 border rounded-md text-sm bg-white">
                              {openModules[m.id] ? 'Hide lessons' : 'Show lessons'}
                            </button>
                            <button onClick={() => openAddLessonModal(m.id)} className={`px-3 py-1 ${primary} text-white rounded-md text-sm`}>Add lesson</button>
                          </div>
                        </div>

                        {openModules[m.id] && (
                          <div className="mt-4 border-t pt-4">
                            <div className="space-y-2">
                              {(lessonsByModule[m.id] ?? []).length === 0 ? (
                                <div className="text-sm text-gray-500">No lessons yet for this module.</div>
                              ) : (lessonsByModule[m.id] ?? []).map((l, idx) => (
                                <div key={l.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-900">
                                  <div>
                                    <div className="text-sm font-medium">{l.title}</div>
                                    <div className="text-xs text-gray-500 mt-1">{(l.content_type ?? '—').toUpperCase()} • {formatDuration(l.duration_seconds)}</div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <button onClick={() => fetchLessonAndOpenEditor(l.id)} className="px-3 py-1 border rounded-md text-sm">Open</button>
                                    <button onClick={() => moveLesson(m.id, l.id, 'up')} disabled={idx === 0} title="Move up" className="px-2 py-1 border rounded-md text-sm">▲</button>
                                    <button onClick={() => moveLesson(m.id, l.id, 'down')} disabled={idx === ((lessonsByModule[m.id] ?? []).length - 1)} title="Move down" className="px-2 py-1 border rounded-md text-sm">▼</button>
                                    <button onClick={() => deleteLesson(m.id, l.id)} className="px-3 py-1 border border-red-300 text-red-700 rounded-md text-sm">Delete</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            </main>

            <aside className="hidden xl:block w-80 sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto"><RightbarRecruiters /></aside>
          </div>
        </div>

        {/* Lesson Creator Modal */}
        {lessonModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setLessonModalOpen(false)} />
            <div className="relative w-full max-w-2xl mx-4 bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <div>
                  <h3 className="text-lg font-semibold">Add Lesson</h3>
                  <p className="text-sm text-gray-500">Provide title, content, type, URL and duration.</p>
                </div>
                <button onClick={() => setLessonModalOpen(false)} className="text-gray-500">✕</button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); submitLesson(); }} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Module</label>
                    <select disabled value={lessonModuleId ?? ''} className="w-full p-3 border rounded-md bg-gray-50">
                      <option value="">{modules.find(x => x.id === lessonModuleId)?.title ?? '—'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Duration (mm:ss or hh:mm:ss)</label>
                    <input value={lessonDuration} onChange={e => setLessonDuration(e.target.value)} placeholder="05:30" className="w-full p-3 border rounded-md bg-white" />
                    <p className="text-xs text-gray-500 mt-1">Optional — for learner progress.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-1">Lesson title</label>
                  <input value={lessonTitle} onChange={e => setLessonTitle(e.target.value)} placeholder="e.g. Introduction" className="w-full p-3 border rounded-md bg-white" />
                </div>

                <div>
                  <label className="block text-sm mb-1">Content type</label>
                  <select value={lessonContentType} onChange={e => setLessonContentType(e.target.value as any)} className="w-full p-3 border rounded-md bg-white">
                    <option value="video">Video</option>
                    <option value="pdf">PDF</option>
                    <option value="html">HTML</option>
                    <option value="text">Text</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-1">Content (optional)</label>
                  <textarea value={lessonContent} onChange={e => setLessonContent(e.target.value)} rows={5} className="w-full p-3 border rounded-md bg-white" />
                </div>

                <div>
                  <label className="block text-sm mb-1">Content URL (optional)</label>
                  <input value={lessonUrl} onChange={e => setLessonUrl(e.target.value)} placeholder="https://..." className="w-full p-3 border rounded-md bg-white" />
                </div>

                {lessonError && <div className="text-sm text-red-700 bg-red-50 p-2 rounded">{lessonError}</div>}

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">You can edit lesson details later.</div>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setLessonModalOpen(false)} className="px-4 py-2 border rounded-md">Cancel</button>
                    <button type="submit" disabled={lessonSaving} className={`px-4 py-2 ${primary} ${primaryHover} text-white rounded-md`}>{lessonSaving ? 'Creating...' : 'Create lesson'}</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Lesson Editor Modal (Open button target) */}
        {lessonEditorOpen && activeLesson && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setLessonEditorOpen(false)} />
            <div className="relative w-full max-w-2xl mx-4 bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <div>
                  <h3 className="text-lg font-semibold">{activeLesson.title}</h3>
                  <p className="text-sm text-gray-500">Edit lesson — quick inline editor.</p>
                </div>
                <button onClick={() => setLessonEditorOpen(false)} className="text-gray-500">✕</button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm mb-1">Title</label>
                  <input defaultValue={activeLesson.title} onBlur={e => setActiveLesson(prev => prev ? ({ ...prev, title: e.target.value }) : prev)} className="w-full p-3 border rounded-md bg-white" />
                </div>

                <div>
                  <label className="block text-sm mb-1">Content type</label>
                  <select defaultValue={activeLesson.content_type} onChange={e => setActiveLesson(prev => prev ? ({ ...prev, content_type: e.target.value }) : prev)} className="w-full p-3 border rounded-md bg-white">
                    <option value="video">Video</option>
                    <option value="pdf">PDF</option>
                    <option value="html">HTML</option>
                    <option value="text">Text</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-1">Content</label>
                  <textarea defaultValue={activeLesson.content ?? ''} onBlur={e => setActiveLesson(prev => prev ? ({ ...prev, content: e.target.value }) : prev)} rows={6} className="w-full p-3 border rounded-md bg-white" />
                </div>

                <div>
                  <label className="block text-sm mb-1">Content URL</label>
                  <input defaultValue={activeLesson.content_url ?? ''} onBlur={e => setActiveLesson(prev => prev ? ({ ...prev, content_url: e.target.value }) : prev)} className="w-full p-3 border rounded-md bg-white" />
                </div>

                <div className="flex items-center gap-4">
                  <div>
                    <label className="block text-sm mb-1">Duration</label>
                    <input defaultValue={formatDuration(activeLesson.duration_seconds)} onBlur={e => {
                      const secs = parseDurationToSeconds(e.target.value);
                      setActiveLesson(prev => prev ? ({ ...prev, duration_seconds: secs }) : prev);
                    }} className="p-3 border rounded-md bg-white" />
                    <div className="text-xs text-gray-500 mt-1">mm:ss or hh:mm:ss</div>
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Published</label>
                    <input type="checkbox" defaultChecked={!!activeLesson.published} onChange={e => setActiveLesson(prev => prev ? ({ ...prev, published: e.target.checked }) : prev)} />
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">Preview: <a className="text-[#0A66C2]" href={activeLesson.content_url ?? '#'} target="_blank" rel="noreferrer">{activeLesson.content_url ? 'Open resource' : 'No URL'}</a></div>

                  <div className="flex items-center gap-3">
                    <button onClick={() => { setLessonEditorOpen(false); }} className="px-4 py-2 border rounded-md">Cancel</button>
                    <button onClick={() => activeLesson && saveLessonEdits({
                      title: activeLesson.title,
                      content: activeLesson.content,
                      content_type: activeLesson.content_type,
                      content_url: activeLesson.content_url,
                      duration_seconds: activeLesson.duration_seconds,
                      published: activeLesson.published,
                    })} disabled={editorSaving} className={`px-4 py-2 ${primary} ${primaryHover} text-white rounded-md`}>{editorSaving ? 'Saving...' : 'Save changes'}</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}