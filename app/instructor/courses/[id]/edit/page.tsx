'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import HeaderLoggedIn from '@/components/HeaderLoggedIn';
import Sidebar from '@/components/Sidebar';
import RightbarRecruiters from '@/components/Rightbar';

export default function CourseEditPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const API = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>('');
  const [published, setPublished] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchCourse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchCourse() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/instructor/courses/${id}`, { credentials: 'include', headers: { Accept: 'application/json' } });
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
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description || null,
        price: price ? Number(price) : 0,
        published: !!published,
      };
      const res = await fetch(`${API}/instructor/courses/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        router.push(`/instructor/courses/${id}`);
      } else {
        alert(json.error ?? 'Failed to save');
      }
    } catch (e) {
      console.error(e);
      alert('Network error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <HeaderLoggedIn />
      <div className="pt-16 bg-[#eef3f8] min-h-screen">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-6 flex gap-6 mt-[-64px]">
          <aside className="w-[280px] hidden lg:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
            <Sidebar />
          </aside>

          <main className="flex-1 py-8">
            <div className="max-w-[900px] mx-auto">
              {loading ? (
                <div className="p-8 text-center">Loading…</div>
              ) : (
                <div className="bg-white rounded shadow p-6">
                  <h2 className="text-lg font-semibold mb-4">Edit Course</h2>
                  {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm mb-1">Title</label>
                      <input value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border rounded" />
                    </div>

                    <div>
                      <label className="block text-sm mb-1">Description</label>
                      <textarea value={description} onChange={e => setDescription(e.target.value)} rows={5} className="w-full p-2 border rounded" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm mb-1">Price (USD)</label>
                        <input value={price} onChange={e => setPrice(e.target.value)} className="w-full p-2 border rounded" />
                      </div>

                      <div>
                        <label className="block text-sm mb-1">Status</label>
                        <select value={published ? 'published' : 'draft'} onChange={e => setPublished(e.target.value === 'published')} className="w-full p-2 border rounded">
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button onClick={() => router.push(`/instructor/courses/${id}`)} className="px-4 py-2 border rounded">Cancel</button>
                      <button onClick={save} disabled={saving} className="px-4 py-2 bg-[#0A66C2] text-white rounded">
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
