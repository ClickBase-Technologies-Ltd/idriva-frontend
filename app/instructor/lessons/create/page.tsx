'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import RightbarRecruiters from '@/components/Rightbar';
import HeaderLoggedIn from '@/components/HeaderLoggedIn';

export default function CreateLessonPage() {
  const [modules, setModules] = useState<{ id: number; title: string }[]>([]);
  const [moduleId, setModuleId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [contentUrl, setContentUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/instructor/modules`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setModules(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error(e);
        setError('Failed to load modules.');
      }
    })();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!moduleId) {
      setError('Please select a module.');
      return;
    }
    if (!title.trim()) {
      setError('Please provide a lesson title.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/instructor/lessons`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module_id: moduleId, title, content_url: contentUrl, content_type: 'video' })
      });
      if (res.ok) {
        router.push('/instructor/my-courses');
      } else {
        console.error('Failed', res.status);
        setError('Failed to create lesson. Please try again.');
      }
    } catch (e) {
      console.error(e);
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <HeaderLoggedIn />

      <div className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white pt-16">
        <div className="max-w-[1360px] mx-auto px-4 lg:px-6 flex gap-6 mt-[-70px]">
          {/* LEFT SIDEBAR */}
          <aside className="w-[280px] hidden lg:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-hide">
            <Sidebar />
          </aside>

          {/* MAIN CONTENT */}
          <main className="flex-1 py-8">
            <div className="max-w-3xl mx-auto">
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Create Lesson</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Add a lesson to a module. Provide a clear title and optional content URL (video/file).</p>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
                <div className="p-6">
                  {error && (
                    <div className="mb-4 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 p-3 rounded">
                      {error}
                    </div>
                  )}

                  <form onSubmit={submit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Module</label>
                      <select
                        value={moduleId}
                        onChange={e => setModuleId(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full p-3 border rounded-md bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        aria-label="Select module"
                      >
                        <option value="">Select module</option>
                        {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lesson Title</label>
                      <input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full p-3 border rounded-md bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. Introduction to Road Safety"
                        required
                        aria-label="Lesson title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content URL (video/file)</label>
                      <input
                        value={contentUrl}
                        onChange={e => setContentUrl(e.target.value)}
                        className="w-full p-3 border rounded-md bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://..."
                        aria-label="Content URL"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-medium">Tip:</span> Use a hosted video URL or upload later in the editor.
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => router.back()}
                          className="px-4 py-2 border rounded-md text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          Cancel
                        </button>

                        <button
                          type="submit"
                          disabled={saving}
                          className="px-4 py-2 bg-[#0A66C2] hover:bg-blue-700 text-white rounded-md text-sm flex items-center"
                        >
                          {saving ? 'Saving...' : 'Create lesson'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>

              {/* Quick actions */}
              <div className="mt-6 flex gap-3">
                <button onClick={() => router.push('/instructor/courses/create')} className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm">Create Course</button>
                <button onClick={() => router.push('/instructor/modules/create')} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm">Create Module</button>
                <button onClick={() => router.push('/instructor/my-courses')} className="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md text-sm">Manage courses</button>
              </div>
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