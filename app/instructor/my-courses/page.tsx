'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import RightbarRecruiters from '@/components/Rightbar';
import HeaderLoggedIn from '@/components/HeaderLoggedIn';

interface Course {
  id: number;
  title: string;
  description?: string | null;
  published?: boolean;
  created_at?: string;
  price?: number | null;
  studentsCount?: number;
}

export default function MyCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'drafts'>('all');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const router = useRouter();
  const API = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');

  // create course form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPrice, setNewPrice] = useState<string>('');
  const [newPublished, setNewPublished] = useState(false);

  // edit modal controlled fields
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPrice, setEditPrice] = useState<string>('');
  const [editPublished, setEditPublished] = useState(false);

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchCourses() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/instructor/courses`, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        setError(`Failed to load courses (${res.status})`);
        setCourses([]);
        return;
      }
      const json = await res.json().catch(() => ([]));
      const data = Array.isArray(json) ? json : (json && json.data) ? json.data : [];
      setCourses(data.map((c: any) => ({
        id: Number(c.id),
        title: String(c.title ?? 'Untitled'),
        description: c.description ?? c.desc ?? null,
        published: !!c.published,
        created_at: c.created_at ?? c.createdAt,
        price: typeof c.price !== 'undefined' ? Number(c.price) : null,
        studentsCount: typeof c.studentsCount !== 'undefined' ? Number(c.studentsCount) : 0,
      })));
    } catch (e) {
      console.error(e);
      setError('Network error while loading courses');
    } finally {
      setLoading(false);
    }
  }

  const visible = useMemo(() => {
    let list = [...courses];
    if (filter === 'published') list = list.filter(c => c.published);
    if (filter === 'drafts') list = list.filter(c => !c.published);
    if (query.trim()) list = list.filter(c => c.title.toLowerCase().includes(query.trim().toLowerCase()));
    if (sort === 'newest') list.sort((a,b) => Number(new Date(b.created_at || 0)) - Number(new Date(a.created_at || 0)));
    if (sort === 'oldest') list.sort((a,b) => Number(new Date(a.created_at || 0)) - Number(new Date(b.created_at || 0)));
    if (sort === 'title') list.sort((a,b) => a.title.localeCompare(b.title));
    return list;
  }, [courses, query, filter, sort]);

  function openCourseModal(c: Course) {
    setActiveCourse(c);
    // populate controlled fields
    setEditTitle(c.title ?? '');
    setEditDescription(c.description ?? '');
    setEditPrice(typeof c.price !== 'undefined' && c.price !== null ? String(c.price) : '');
    setEditPublished(!!c.published);
    setModalOpen(true);
  }

  async function togglePublish(course: Course) {
    setSaving(true);
    try {
      const res = await fetch(`${API}/instructor/courses/${course.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ published: !course.published }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        // update list
        setCourses(prev => prev.map(p => p.id === course.id ? ({ ...p, published: !p.published }) : p));
        // if modal open for this course, update modal state too
        setActiveCourse(prev => (prev && prev.id === course.id) ? ({ ...prev, published: !prev.published }) : prev);
        setEditPublished(prev => (activeCourse && activeCourse.id === course.id) ? !prev : prev);
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

  async function saveCourseEdits() {
    if (!activeCourse) return;
    setSaving(true);
    const payload: Partial<Course> = {
      title: editTitle?.trim(),
      description: editDescription ?? null,
      price: editPrice ? Number(editPrice) : 0,
      published: !!editPublished,
    };
    try {
      const res = await fetch(`${API}/instructor/courses/${activeCourse.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        const updated = (json && json.data) ? json.data : { ...activeCourse, ...payload };
        const normalized: Course = {
          id: Number(updated.id),
          title: String(updated.title ?? payload.title ?? activeCourse.title),
          description: updated.description ?? payload.description ?? activeCourse.description,
          published: !!updated.published,
          created_at: updated.created_at ?? activeCourse.created_at,
          price: typeof updated.price !== 'undefined' && updated.price !== null ? Number(updated.price) : activeCourse.price,
          studentsCount: activeCourse.studentsCount ?? 0,
        };
        setCourses(prev => prev.map(c => c.id === normalized.id ? normalized : c));
        setModalOpen(false);
        setActiveCourse(null);
      } else {
        alert(json.error ?? 'Failed to save changes');
      }
    } catch (e) {
      console.error(e);
      alert('Network error');
    } finally {
      setSaving(false);
    }
  }

  async function deleteCourse(course: Course) {
    if (!confirm('Delete this course? This cannot be undone.')) return;
    try {
      const res = await fetch(`${API}/instructor/courses/${course.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setCourses(prev => prev.filter(c => c.id !== course.id));
        setModalOpen(false);
        setActiveCourse(null);
      } else {
        alert(json.error ?? 'Failed to delete course');
      }
    } catch (e) {
      console.error(e);
      alert('Network error');
    }
  }

  async function createCourse() {
    if (!newTitle.trim()) {
      alert('Please provide a course title.');
      return;
    }
    setCreating(true);
    try {
      const payload = {
        title: newTitle.trim(),
        description: newDescription || null,
        price: newPrice ? Number(newPrice) : 0,
        published: !!newPublished,
      };
      const res = await fetch(`${API}/instructor/courses`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        const created = json.data ?? json;
        const c: Course = {
          id: Number(created.id),
          title: String(created.title ?? payload.title),
          description: created.description ?? payload.description,
          published: !!created.published,
          created_at: created.created_at ?? new Date().toISOString(),
          price: typeof created.price !== 'undefined' ? Number(created.price) : payload.price,
          studentsCount: 0,
        };
        setCourses(prev => [c, ...prev]);
        setCreateOpen(false);
        // clear form
        setNewTitle('');
        setNewDescription('');
        setNewPrice('');
        setNewPublished(false);
        // navigate to manage page
        router.push(`/instructor/courses/${c.id}`);
      } else {
        alert(json.error ?? 'Failed to create course');
      }
    } catch (e) {
      console.error(e);
      alert('Network error');
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <HeaderLoggedIn />

      <div className="bg-[#eef3f8] dark:bg-gray-900 text-gray-900 dark:text-white pt-16">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-6 flex gap-6 mt-[-64px]">
          <aside className="w-[280px] hidden lg:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
            <Sidebar />
          </aside>

          <main className="flex-1 py-8">
            <div className="max-w-[980px] mx-auto">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl font-semibold text-[#0A66C2]">My Courses</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage your courses, modules and lessons.</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCreateOpen(true)}
                    className="px-4 py-2 bg-[#0A66C2] hover:bg-[#0959a8] text-white rounded-md text-sm"
                  >
                    New Course
                  </button>
                  <button
                    onClick={() => { setQuery(''); setFilter('all'); setSort('newest'); fetchCourses(); }}
                    className="px-3 py-2 bg-white dark:bg-gray-800 border rounded-md text-sm"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              <div className="mb-4 flex flex-col md:flex-row gap-3 items-center">
                <div className="flex-1 flex gap-2">
                  <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search courses..." className="w-full p-2 border rounded-md bg-white dark:bg-gray-800" />
                  <select value={filter} onChange={e => setFilter(e.target.value as any)} className="p-2 border rounded-md bg-white dark:bg-gray-800">
                    <option value="all">All</option>
                    <option value="published">Published</option>
                    <option value="drafts">Drafts</option>
                  </select>
                  <select value={sort} onChange={e => setSort(e.target.value as any)} className="p-2 border rounded-md bg-white dark:bg-gray-800">
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="title">Title</option>
                  </select>
                </div>

                <div className="text-sm text-gray-500">{visible.length} result{visible.length !== 1 ? 's' : ''}</div>
              </div>

              <section className="space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center p-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0A66C2]" />
                  </div>
                ) : error ? (
                  <div className="p-4 bg-red-50 text-red-700 rounded">{error}</div>
                ) : visible.length === 0 ? (
                  <div className="p-8 bg-white dark:bg-gray-800 rounded shadow text-center">
                    <div className="text-lg text-gray-600 dark:text-gray-300 mb-2">No courses yet</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Create your first course to start adding modules and lessons.</div>
                    <div className="mt-4">
                      <button onClick={() => setCreateOpen(true)} className="px-4 py-2 bg-[#0A66C2] hover:bg-[#0959a8] text-white rounded-md text-sm">Create course</button>
                    </div>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {visible.map(c => (
                      <li key={c.id} className="p-4 bg-white dark:bg-gray-800 rounded shadow flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-md bg-[#0A66C2] flex items-center justify-center text-white font-semibold text-lg">
                              {c.title.slice(0,1).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">{c.title}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {c.description ? `${c.description.slice(0,120)}${c.description.length > 120 ? '…' : ''}` : 'No description'}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {c.published ? <span className="text-green-600">Published</span> : <span className="text-yellow-600">Draft</span>} • {c.studentsCount ?? 0} learners • {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button onClick={() => openCourseModal(c)} className="px-3 py-2 border rounded-md text-sm">Details</button>
                          <button onClick={() => router.push(`/instructor/courses/${c.id}`)} className="px-3 py-2 border rounded-md text-sm text-[#0A66C2]">Manage</button>
                          <button onClick={() => router.push(`/instructor/courses/${c.id}/edit`)} className="px-3 py-2 border rounded-md text-sm">Edit</button>
                          <button onClick={() => togglePublish(c)} disabled={saving} className={`px-3 py-2 rounded-md text-sm ${c.published ? 'bg-white border' : 'bg-[#0A66C2] text-white'}`}>
                            {c.published ? 'Unpublish' : 'Publish'}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </main>

          <aside className="w-[320px] hidden xl:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
            <RightbarRecruiters />
          </aside>
        </div>

        {/* Create Course Modal */}
        {createOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setCreateOpen(false)} />
            <div className="relative w-full max-w-3xl mx-4 bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create new course</h3>
                  <div className="text-sm text-gray-500">Start with a title and basic details.</div>
                </div>
                <button onClick={() => setCreateOpen(false)} className="text-gray-500">✕</button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm mb-1">Title</label>
                  <input value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full p-3 border rounded-md bg-white dark:bg-gray-700" />
                </div>

                <div>
                  <label className="block text-sm mb-1">Description</label>
                  <textarea value={newDescription} onChange={e => setNewDescription(e.target.value)} rows={4} className="w-full p-3 border rounded-md bg-white dark:bg-gray-700" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm mb-1">Price (USD)</label>
                    <input value={newPrice} onChange={e => setNewPrice(e.target.value)} className="w-full p-3 border rounded-md bg-white dark:bg-gray-700" />
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Status</label>
                    <select value={newPublished ? 'published' : 'draft'} onChange={e => setNewPublished(e.target.value === 'published')} className="w-full p-3 border rounded-md bg-white dark:bg-gray-700">
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <div className="text-xs text-gray-500">Learners: 0</div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button onClick={() => setCreateOpen(false)} className="px-4 py-2 border rounded-md">Cancel</button>
                  <button onClick={createCourse} disabled={creating} className="px-4 py-2 bg-[#0A66C2] hover:bg-[#0959a8] text-white rounded-md">
                    {creating ? 'Creating…' : 'Create course'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Course Details / Edit Modal */}
        {modalOpen && activeCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => { setModalOpen(false); setActiveCourse(null); }} />
            <div className="relative w-full max-w-3xl mx-4 bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{activeCourse.title}</h3>
                  <div className="text-sm text-gray-500">{activeCourse.created_at ? new Date(activeCourse.created_at).toLocaleDateString() : ''}</div>
                </div>
                <button onClick={() => { setModalOpen(false); setActiveCourse(null); }} className="text-gray-500">✕</button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm mb-1">Title</label>
                  <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full p-3 border rounded-md bg-white dark:bg-gray-700" />
                </div>

                <div>
                  <label className="block text-sm mb-1">Description</label>
                  <textarea value={editDescription ?? ''} onChange={e => setEditDescription(e.target.value)} rows={5} className="w-full p-3 border rounded-md bg-white dark:bg-gray-700" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm mb-1">Price</label>
                    <input value={editPrice} onChange={e => setEditPrice(e.target.value)} className="w-full p-3 border rounded-md bg-white dark:bg-gray-700" />
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Status</label>
                    <select value={editPublished ? 'published' : 'draft'} onChange={e => setEditPublished(e.target.value === 'published')} className="w-full p-3 border rounded-md bg-white dark:bg-gray-700">
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <div className="text-xs text-gray-500">Learners: {activeCourse.studentsCount ?? 0}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button onClick={() => router.push(`/instructor/courses/${activeCourse.id}`)} className="px-3 py-2 border rounded-md text-sm">Go to course</button>
                    <button onClick={() => router.push(`/instructor/courses/${activeCourse.id}/modules`)} className="px-3 py-2 border rounded-md text-sm">Modules</button>
                  </div>

                  <div className="flex items-center gap-3">
                    <button onClick={() => { if (confirm('Delete this course?')) deleteCourse(activeCourse); }} className="px-3 py-2 border border-red-300 text-red-700 rounded-md text-sm">Delete</button>
                    <button onClick={saveCourseEdits} disabled={saving} className="px-4 py-2 bg-[#0A66C2] hover:bg-[#0959a8] text-white rounded-md text-sm">
                      {saving ? 'Saving…' : 'Save changes'}
                    </button>
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