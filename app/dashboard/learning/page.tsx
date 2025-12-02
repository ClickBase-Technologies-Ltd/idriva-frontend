'use client';
import { useState, useEffect, useRef } from 'react';
import Sidebar from "@/components/Sidebar";
import RightbarRecruiters from "@/components/Rightbar";
import HeaderLoggedIn from "@/components/HeaderLoggedIn";
import api from '@/lib/api';

interface Module {
  id: number;
  title: string;
  description: string;
  thumbnail?: string | null;
  provider?: string | null;
  created_at?: string;
}

export default function LearningPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        setLoading(true);
        const res = await api.get('/learning'); // adjust endpoint as needed
        if (res.status === 200) {
          setModules(Array.isArray(res.data) ? res.data : res.data.modules || []);
        } else {
          setError('Failed to load learning modules');
        }
      } catch (e) {
        console.error('Error loading learning modules', e);
        setError('Failed to load learning modules');
      } finally {
        setLoading(false);
      }
    };
    fetchModules();
  }, []);

  return (
    <>
      <HeaderLoggedIn />
      <div className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white pt-16">
        <div className="max-w-[1360px] mx-auto px-4 lg:px-6 flex gap-6 mt-[-70px]">
          <aside className="w-[280px] hidden lg:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-hide">
            <Sidebar />
          </aside>

          <main ref={containerRef} className="flex-1 space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Learning</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Courses and modules for drivers</p>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-3 text-sm text-gray-500">Loading modules...</p>
              </div>
            ) : error ? (
              <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg p-4">
                <div className="text-red-600">{error}</div>
              </div>
            ) : modules.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 dark:text-gray-400">No learning modules yet</div>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {modules.map((m) => (
                  <article key={m.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                    <div className="h-40 w-full mb-3 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                      <img
                        src={m.thumbnail || '/learning-placeholder.png'}
                        alt={m.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{m.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-3">{m.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-gray-500">{m.provider || 'iDriva'}</span>
                      <a
                        href={`/dashboard/learning/${m.id}`}
                        className="text-sm bg-[#00639C] text-white px-3 py-1 rounded-full hover:bg-[#005A8C]"
                      >
                        Open
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </main>

          <aside className="w-[320px] hidden xl:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden scrollbar-hide">
            <RightbarRecruiters />
          </aside>
        </div>
      </div>
    </>
  );
}