'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import HeaderLoggedIn from '@/components/HeaderLoggedIn';
import Sidebar from '@/components/Sidebar';
import RightbarRecruiters from '@/components/Rightbar';

export default function CourseEditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');

  const API = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>('');
  const [published, setPublished] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    fetchCourse();
  }, [courseId]);

  async function fetchCourse() {
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const res = await fetch(`${API}/instructor/courses/${courseId}`, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        setError(`Failed to load (${res.status})`);
        return;
      }
      const json = await res.json().catch(() => ({}));
      const data = json.data ?? json;
      setTitle(data.title ?? '');
      setDescription(data.description ?? '');
      setPrice(typeof data.price !== 'undefined' && data.price !== null ? String(data.price) : '');
      setPublished(!!data.published);
    } catch (e) {
      console.error(e);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!courseId) return;
    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const payload = {
        title: title.trim(),
        description: description || null,
        price: price ? Number(price) : 0,
        published: !!published,
      };

      const res = await fetch(`${API}/instructor/courses/${courseId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok) {
        setSuccessMessage('Course saved successfully!');
      } else {
        setError(json.error ?? 'Failed to save the course.');
      }
    } catch (e) {
      console.error(e);
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <HeaderLoggedIn />
      <div className="pt-16 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-6 flex gap-6">
          <aside className="w-[280px] hidden lg:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
            <Sidebar />
          </aside>

          <main className="flex-1 py-8">
            <div className="max-w-[900px] mx-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading…</div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 space-y-6">
                  <h2 className="text-2xl font-bold text-[#0A66C2]">Edit Course</h2>

                  {error && <div className="text-sm text-red-600">{error}</div>}
                  {successMessage && <div className="text-sm text-green-600">{successMessage}</div>}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Course Title</label>
                      <input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-[#0A66C2] focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Enter course title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Description</label>
                      <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={5}
                        className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-[#0A66C2] focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Enter course description"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Price (USD)</label>
                        <input
                          value={price}
                          onChange={e => setPrice(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-[#0A66C2] focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Status</label>
                        <select
                          value={published ? 'published' : 'draft'}
                          onChange={e => setPublished(e.target.value === 'published')}
                          className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-[#0A66C2] focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => router.back()}
                        className="px-6 py-3 border border-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={save}
                        disabled={saving}
                        className="px-6 py-3 bg-[#0A66C2] text-white rounded hover:bg-[#0959a8] disabled:opacity-60"
                      >
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  </div>
                </div>
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
