'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import RightbarRecruiters from '@/components/Rightbar';
import HeaderLoggedIn from '@/components/HeaderLoggedIn';
import Footer from '@/components/Footer'; // assuming you have a footer component
import { PlayIcon } from '@heroicons/react/24/outline';

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
              <p>Loading course...</p>
            ) : !course ? (
              <p>Course not found.</p>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h1 className="text-3xl font-bold text-[#0A66C2]">{course.title}</h1>
                <p className="mt-2 text-gray-600">{course.description}</p>

                <img
                  src={course.thumbnail || '/cover_photo.jpg'}
                  alt={course.title}
                  className="w-full h-64 object-cover rounded mt-4"
                />

                <div className="mt-6">
                  <h2 className="text-xl font-semibold">Modules</h2>
                  {course.modules?.map((m) => (
                    <div key={m.id} className="mt-4">
                      <h3 className="font-medium">{m.title}</h3>
                      <ul className="ml-4 list-disc">
                        {m.lessons?.map((l) => (
                          <li key={l.id}>
                            {l.title} {l.duration && `(${l.duration})`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <button
                  onClick={startCourse}
                  className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-[#0A66C2] text-white rounded hover:bg-[#004182]"
                >
                  <PlayIcon className="w-5 h-5" />
                  {course.enrolled ? 'Start Course' : 'Enroll & Start'}
                </button>
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
