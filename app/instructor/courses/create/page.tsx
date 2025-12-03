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
        body: JSON.stringify({
          title,
          description,
          price: price === '' ? 0 : Number(price),
          published: false,
        }),
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

      <div className="bg-[#F3F2EF] text-gray-900 pt-16">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-6 flex gap-6 mt-[-70px]">
          {/* LEFT SIDEBAR */}
          <aside className="w-[280px] hidden lg:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-hide">
            <Sidebar />
          </aside>

          {/* MAIN CONTENT */}
          <main className="flex-1 py-8">
            <div className="max-w-[980px] mx-auto">
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Create Course</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Share your expertise by creating a new course. Add a clear title, detailed description, and optional price.
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="p-6">
                  {error && (
                    <div className="mb-4 text-sm text-red-700 bg-red-50 p-3 rounded">
                      {error}
                    </div>
                  )}

                  <form onSubmit={submit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Course Title</label>
                      <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-3 border rounded-md bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0A66C2]"
                        placeholder="e.g. Modern Trucking: Safety & Regulations"
                        required
                        aria-label="Course title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-3 border rounded-md min-h-[140px] bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0A66C2]"
                        placeholder="Write a clear description of the course, what students will learn, and prerequisites."
                        rows={6}
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price (USD)</label>
                        <input
                          type="number"
                          value={price}
                          onChange={(e) =>
                            setPrice(e.target.value === '' ? '' : Number(e.target.value))
                          }
                          className="w-40 p-3 border rounded-md bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0A66C2]"
                          placeholder="0.00"
                          aria-label="Price"
                        />
                      </div>

                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                        <div className="text-sm text-gray-600">
                          By default, the course will be saved as a draft. Publish when ready.
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">Tip:</span> Add modules and lessons after creating the course.
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => router.back()}
                          className="px-4 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50"
                        >
                          Cancel
                        </button>

                        <button
                          type="submit"
                          disabled={publishing}
                          className="px-4 py-2 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-md text-sm font-medium flex items-center"
                        >
                          {publishing ? 'Creating...' : 'Create Course'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => router.push('/instructor/modules/create')}
                  className="px-3 py-2 border border-[#0A66C2] text-[#0A66C2] hover:bg-[#E5F0FB] rounded-md text-sm font-medium"
                >
                  Create Module
                </button>
                <button
                  onClick={() => router.push('/instructor/lessons/create')}
                  className="px-3 py-2 border border-[#0A66C2] text-[#0A66C2] hover:bg-[#E5F0FB] rounded-md text-sm font-medium"
                >
                  Create Lesson
                </button>
                <button
                  onClick={() => router.push('/instructor/my-courses')}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium"
                >
                  Manage Courses
                </button>
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
