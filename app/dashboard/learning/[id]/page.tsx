'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import RightbarRecruiters from '@/components/Rightbar';
import HeaderLoggedIn from '@/components/HeaderLoggedIn';
import Footer from '@/components/Footer';
import { PlayIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

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
  thumbnail?: string;
  price?: number;
  enrolled?: boolean;
  modules?: Module[];
}

export default function CourseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<number[]>([]);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await api.get(`/learning/${id}`);
        setCourse(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  const toggleModule = (moduleId: number) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    );
  };

  const startCourse = () => {
    const lessonId = course?.modules?.[0]?.lessons?.[0]?.id || 1;
    router.push(`/dashboard/learning/${id}/lesson/${lessonId}`);
  };

  return (
    <>
      <HeaderLoggedIn />
      <div className="bg-gray-50 min-h-screen pt-2">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-6 flex gap-6">
          {/* Left Sidebar */}
          <aside className="w-[280px] hidden lg:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
            <Sidebar />
          </aside>

          {/* Main Content */}
          <main className="flex-1 py-8">
            {loading ? (
              <div className="p-8 bg-white rounded shadow text-center">Loading course...</div>
            ) : !course ? (
              <div className="p-8 bg-white rounded shadow text-center">Course not found.</div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-[#0A66C2]">{course.title}</h1>
                    <p className="mt-2 text-gray-600">{course.description}</p>
                  </div>
                  {course.thumbnail && (
                    <img
                      src={course.thumbnail || '/cover_photo.jpg'}
                      alt={course.title}
                      className="w-full lg:w-64 h-40 object-cover rounded"
                    />
                  )}
                </div>

                {/* Modules */}
                <div className="mt-8">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">Course Modules</h2>
                  <div className="space-y-4">
                    {course.modules?.map((m) => {
                      const expanded = expandedModules.includes(m.id);
                      return (
                        <div key={m.id} className="border rounded-md bg-gray-50">
                          <button
                            onClick={() => toggleModule(m.id)}
                            className="w-full px-4 py-3 flex justify-between items-center font-medium text-gray-800 hover:bg-gray-100 rounded-t-md"
                          >
                            <span>{m.title}</span>
                            {expanded ? (
                              <ChevronUpIcon className="w-5 h-5 text-gray-500" />
                            ) : (
                              <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                            )}
                          </button>
                          {expanded && (
                            <ul className="px-6 py-3 space-y-2">
                              {m.lessons?.map((l) => (
                                <li key={l.id} className="flex justify-between text-gray-700">
                                  <span>{l.title}</span>
                                  {l.duration && <span className="text-sm text-gray-500">{l.duration}</span>}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-6">
                  <button
                    onClick={startCourse}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#0A66C2] text-white font-medium rounded hover:bg-[#004182]"
                  >
                    <PlayIcon className="w-5 h-5" />
                    {course.enrolled ? 'Continue Course' : 'Enroll & Start'}
                  </button>
                </div>
              </div>
            )}
          </main>

          {/* Right Sidebar */}
          <aside className="w-[320px] hidden xl:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
            <RightbarRecruiters />
          </aside>
        </div>
      </div>
      <Footer />
    </>
  );
}
