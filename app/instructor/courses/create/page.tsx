'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import RightbarRecruiters from '@/components/Rightbar';
import HeaderLoggedIn from '@/components/HeaderLoggedIn';

export default function CreateCoursePage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishing(true);
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/instructor/courses`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, price: price === '' ? 0 : Number(price), published: false })
      });
      if (res.ok) {
        router.push('/instructor/my-courses');
      } else {
        console.error('Create failed', res.status);
        setError('Failed to create course. Please try again.');
      }
    } catch (e) {
      console.error(e);
      setError('Network error. Please try again.');
    } finally {
      setPublishing(false);
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

          {/* MAIN CONTENT - centered card like professional/networking UI */}
          <main className="flex-1 py-8">
            <div className="max-w-3xl mx-auto">
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Create course</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Create a new course to share with your students. Add a clear title, detailed description and optional price.</p>
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Course title</label>
                      <input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full p-3 border rounded-md bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. Modern Trucking: Safety & Regulations"
                        required
                        aria-label="Course title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                      <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="w-full p-3 border rounded-md min-h-[140px] bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Write a clear description of the course, what students will learn and prerequisites."
                        rows={6}
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price (USD)</label>
                        <input
                          type="number"
                          value={price}
                          onChange={e => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-40 p-3 border rounded-md bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0.00"
                          aria-label="Price"
                        />
                      </div>

                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Visibility</label>
                        <div className="text-sm text-gray-600 dark:text-gray-400">By default, the course will be saved as a draft. Publish when ready.</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-medium">Tip:</span> Add modules and lessons after creating the course.
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
                          disabled={publishing}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm flex items-center"
                        >
                          {publishing ? 'Creating...' : 'Create course'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>

              {/* Quick actions similar to a professional learning UI */}
              <div className="mt-6 flex gap-3">
                <button onClick={() => router.push('/instructor/modules/create')} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm">Create Module</button>
                <button onClick={() => router.push('/instructor/lessons/create')} className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm">Create Lesson</button>
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