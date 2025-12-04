'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import HeaderLoggedIn from '@/components/HeaderLoggedIn';
import Sidebar from '@/components/Sidebar';
import RightbarRecruiters from '@/components/Rightbar';
import Footer from '@/components/Footer';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/solid';

type Status = 'loading' | 'success' | 'error';

export default function PaymentVerifyPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('Verifying your payment, please wait...');
  const [firstLessonId, setFirstLessonId] = useState<number | null>(null);

  useEffect(() => {
    const reference = searchParams.get('trxref') || searchParams.get('reference');
    if (!id || !reference) {
      setStatus('error');
      setMessage('Payment reference not found.');
      return;
    }

    const verify = async () => {
      try {
        // Call backend API to verify payment
        const res = await api.get(`/learning/${id}/payment-verify`, {
          params: { reference },
        });

        if (res.data?.enrolled) {
          setStatus('success');
          setMessage(res.data?.message || 'Payment successful! Redirecting...');
          setFirstLessonId(res.data?.first_lesson_id ?? null);

          // ✅ Always use backend-provided first_lesson_id for redirect
          setTimeout(() => {
            if (res.data?.first_lesson_id) {
              router.replace(`/dashboard/learning/lesson?lessionId=${res.data.first_lesson_id}`);
            } else {
              router.replace(`/dashboard/learning/${id}`);
            }
          }, 2500);
        } else {
          setStatus('error');
          setMessage(res.data?.message || 'Payment verification failed.');
        }
      } catch (err: any) {
        console.error(err);
        setStatus('error');
        setMessage(
          err?.response?.data?.message || 'An error occurred during payment verification.'
        );
      }
    };

    verify();
  }, [id, searchParams, router]);

  return (
    <>
      <HeaderLoggedIn />

      <div className="bg-gray-50 min-h-screen pt-2">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-6 flex gap-6">
          {/* Sidebar (left) */}
          <aside className="w-[280px] hidden lg:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
            <Sidebar />
          </aside>

          {/* Main content */}
          <main className="flex-1 py-8">
            {/* LinkedIn-style card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-2xl mx-auto">
              <div className="flex items-start gap-4">
                {status === 'loading' && (
                  <ClockIcon className="w-12 h-12 text-[#0A66C2] animate-spin shrink-0" />
                )}
                {status === 'success' && (
                  <CheckCircleIcon className="w-12 h-12 text-green-600 animate-bounce shrink-0" />
                )}
                {status === 'error' && (
                  <XCircleIcon className="w-12 h-12 text-red-600 shrink-0" />
                )}

                <div className="flex-1">
                  <h1 className="text-2xl font-semibold text-gray-900">
                    {status === 'success'
                      ? 'Payment successful'
                      : status === 'error'
                      ? 'Payment failed'
                      : 'Verifying payment'}
                  </h1>
                  <p className="mt-2 text-gray-600">{message}</p>

                  {/* Action buttons */}
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => {
                        if (status === 'success') {
                          if (firstLessonId) {
                            router.replace(`/dashboard/learning/${id}/lesson/${firstLessonId}`);
                          } else {
                            router.replace(`/dashboard/learning/${id}`);
                          }
                        } else {
                          router.replace(`/dashboard/learning/${id}`);
                        }
                      }}
                      className={`inline-flex items-center justify-center px-5 py-2.5 rounded-md font-medium transition
                        ${
                          status === 'success'
                            ? 'bg-[#0A66C2] text-white hover:bg-[#004182]'
                            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        }`}
                    >
                      {status === 'success' ? 'Go to course' : 'Back to course'}
                    </button>

                    {status === 'error' && (
                      <button
                        onClick={() => location.reload()}
                        className="inline-flex items-center justify-center px-5 py-2.5 rounded-md font-medium transition border border-gray-300 text-gray-700 hover:bg-gray-100"
                      >
                        Try again
                      </button>
                    )}
                  </div>

                  {/* Helper note */}
                  <p className="mt-4 text-sm text-gray-500">
                    If this takes too long, you can safely close this tab and open your course from the dashboard.
                  </p>
                </div>
              </div>
            </div>
          </main>

          {/* Rightbar (right) */}
          <aside className="w-[320px] hidden xl:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
            <RightbarRecruiters />
          </aside>
        </div>
      </div>

      <Footer />
    </>
  );
}
