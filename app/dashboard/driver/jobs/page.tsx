'use client';
import { useState, useEffect, useRef } from 'react';
import Sidebar from "@/components/Sidebar";
import RightbarRecruiters from "@/components/Rightbar";
import HeaderLoggedIn from "@/components/HeaderLoggedIn";
import api from '@/lib/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faCheck, faClock, faTimes } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  profile_picture?: string;
}

interface Job {
  jobId: number;
  jobTitle: string;
  jobDescription: string;
  jobLocation: string;
  salary: number | null;
  jobType: string;
  jobStatus: string;
  companyName: string;
  companyLogo: string | null;
  applications_count: number;
  created_at: string;
  image_url?: string;
  company?: {
    companyName: string;
    companyLogo: string;
  };
  hasApplied?: boolean;
  applicationStatus?: string;
}

interface ApplicationResponse {
  success: boolean;
  message: string;
  application?: any;
}

export default function JobsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [applyingJobId, setApplyingJobId] = useState<number | null>(null);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  
  const jobsContainerRef = useRef<HTMLDivElement>(null);

  // Fetch user data and jobs
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData: User = JSON.parse(storedUser);
          setUser(userData);
          
          // Fetch user's applications
          await fetchMyApplications();
        }

        await fetchJobs();
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load jobs');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch all jobs from API (not just "my-jobs")
  const fetchJobs = async () => {
    try {
      const response = await api.get('/jobs'); // Changed from '/my-jobs' to '/jobs'
      
      if (response.status === 200) {
        const data = Array.isArray(response.data) ? response.data : [response.data];
        
        // Check if user has applied to each job
        const jobsWithApplicationStatus = data.map((job: Job) => {
          const application = myApplications.find(app => app.jobId === job.jobId);
          return {
            ...job,
            hasApplied: !!application,
            applicationStatus: application?.status || null
          };
        });
        
        setJobs(jobsWithApplicationStatus);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError('Failed to load jobs');
    }
  };

  // Fetch user's applications
  const fetchMyApplications = async () => {
    try {
      const response = await api.get('/my-applications');
      if (response.status === 200) {
        setMyApplications(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  // Handle apply to job
  const handleApply = async (jobId: number) => {
    if (!user) {
      setError('Please login to apply for jobs');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setApplyingJobId(jobId);
    try {
      const response = await api.post<ApplicationResponse>(`/jobs/${jobId}/apply`);
      
      if (response.data.success) {
        setSuccess(response.data.message || 'Application submitted successfully!');
        
        // Refresh jobs to update application status
        await fetchMyApplications();
        await fetchJobs();
        
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.data.message || 'Failed to apply for job');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error: any) {
      console.error('Error applying for job:', error);
      setError(error.response?.data?.message || 'Failed to apply for job');
      setTimeout(() => setError(''), 3000);
    } finally {
      setApplyingJobId(null);
    }
  };

  // Format salary
  const formatSalary = (salary: number | null) => {
    if (!salary) return 'Not specified';
    return `NGN${salary.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <>
        <HeaderLoggedIn />
        <div className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white pt-16">
          <div className="max-w-[1360px] mx-auto px-4 lg:px-6 flex gap-6 mt-[-70px] min-h-screen">
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading jobs...</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

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
          <main 
            ref={jobsContainerRef}
            className="flex-1 space-y-6 mt-6 max-h-[calc(100vh-4rem)] overflow-y-auto scrollbar-hide"
          >
            {/* Success/Error Messages */}
            {success && (
              <div className="bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="text-green-600 dark:text-green-400 font-medium">{success}</div>
                  <button 
                    onClick={() => setSuccess('')}
                    className="ml-auto text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="text-red-600 dark:text-red-400 font-medium">{error}</div>
                  <button 
                    onClick={() => setError('')}
                    className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Available Jobs</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Browse and apply for exciting opportunities
                  {myApplications.length > 0 && (
                    <span className="ml-2 text-[#00639C]">
                      • {myApplications.length} application{myApplications.length !== 1 ? 's' : ''} submitted
                    </span>
                  )}
                </p>
              </div>
              
              {user && (
                <Link
                  href="/dashboard/applicant/my-applications"
                  className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-6 py-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium"
                >
                  View My Applications
                </Link>
              )}
            </div>

            {/* Jobs List */}
            {jobs.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm text-center">
                <div className="text-6xl text-gray-400 mb-4">💼</div>
                <p className="text-gray-500 dark:text-gray-400 text-lg">No jobs available at the moment.</p>
                <p className="text-gray-500 dark:text-gray-400 mb-4">Check back later for new opportunities!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <JobCard
                    key={job.jobId}
                    job={job}
                    onApply={handleApply}
                    applyingJobId={applyingJobId}
                  />
                ))}
              </div>
            )}
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

// JobCard Component for Applicants
function JobCard({ 
  job, 
  onApply,
  applyingJobId
}: {
  job: Job;
  onApply: (jobId: number) => void;
  applyingJobId: number | null;
}) {
  const [showFullDescription, setShowFullDescription] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
            <FontAwesomeIcon icon={faClock} className="mr-1" />
            Pending
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            <FontAwesomeIcon icon={faCheck} className="mr-1" />
            Accepted
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
            <FontAwesomeIcon icon={faTimes} className="mr-1" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const isApplying = applyingJobId === job.jobId;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex items-start space-x-4 flex-1">
            <img
              src={`${process.env.NEXT_PUBLIC_FILE_URL}/${job.companyLogo || '/company-avatar.png'}`}
              className="w-12 h-12 rounded-full object-cover"
              alt={job.companyName}
            />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {job.jobTitle}
                </h3>
                {job.hasApplied && job.applicationStatus && (
                  getStatusBadge(job.applicationStatus)
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {job.companyName || job.company?.companyName}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center">
                    📍 {job.jobLocation || 'Remote'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center">
                    ⏰ {job?.jobType?.charAt(0).toUpperCase() + job?.jobType?.slice(1)}
                  </span>
                  {job.salary && (
                    <>
                      <span>•</span>
                      <span className="flex items-center">
                         {/* {formatSalary(job.salary)} */}
                        {job.salary && <span className="ml-1 text-xs">/month</span>}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Posted {new Date(job.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
          
          {job.jobStatus === 'open' && (
            <div className="ml-4">
              {job.hasApplied ? (
                <button
                  disabled
                  className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-6 py-2 rounded-full text-sm font-medium cursor-not-allowed"
                >
                  {job.applicationStatus === 'pending' ? 'Application Submitted' : 'Already Applied'}
                </button>
              ) : (
                <button
                  onClick={() => onApply(job.jobId)}
                  disabled={isApplying}
                  className="bg-[#00639C] text-white px-6 py-2 rounded-full hover:bg-[#005080] text-sm font-medium flex items-center justify-center min-w-[100px] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isApplying ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                      Applying...
                    </>
                  ) : (
                    'Apply Now'
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {showFullDescription ? job.jobDescription : `${job.jobDescription.substring(0, 200)}...`}
            {job.jobDescription.length > 200 && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="ml-2 text-[#00639C] hover:text-[#005080] text-sm font-medium"
              >
                {showFullDescription ? 'Show less' : 'Read more'}
              </button>
            )}
          </p>
          
          {job.image_url && (
            <img
              src={`${process.env.NEXT_PUBLIC_FILE_URL}/${job.image_url}`}
              alt="Job"
              className="w-full h-48 object-cover rounded-lg mt-4"
            />
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {job.applications_count || 0} application{job.applications_count !== 1 ? 's' : ''} received
          </div>
          
          <div className={`text-xs px-3 py-1 rounded-full ${
            job.jobStatus === 'open'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
          }`}>
            {job.jobStatus === 'open' ? 'Active' : 'Closed'}
          </div>
        </div>
      </div>
    </div>
  );
}