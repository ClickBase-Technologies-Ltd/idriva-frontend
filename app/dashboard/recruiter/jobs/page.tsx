'use client';
import { useState, useEffect, useRef } from 'react';
import Sidebar from "@/components/Sidebar";
import RightbarRecruiters from "@/components/Rightbar";
import HeaderLoggedIn from "@/components/HeaderLoggedIn";
import api from '@/lib/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faSpinner, faTrash } from '@fortawesome/free-solid-svg-icons';

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
  application_count: number;
  created_at: string;
  image_url?: string;
}

interface ModalData {
  type: 'applications';
  jobId: number;
  data: any[];
  title: string;
}

export default function JobsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingJob, setEditingJob] = useState<number | null>(null);
  const [success, setSuccess] = useState('');
  const [modalData, setModalData] = useState<ModalData | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
 
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

  // Fetch jobs from API
  const fetchJobs = async () => {
  try {
    const response = await api.get('/my-jobs');

    if (response.status === 200) {
      const data = Array.isArray(response.data) ? response.data : [response.data];
      setJobs(data);
    }
  } catch (error) {
    console.error('Error fetching jobs:', error);
    setError('Failed to load jobs');
  }
};


  // Handle update job
  const handleUpdateJob = async (e: React.FormEvent, jobId: number) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    
    try {
      const response = await api.post(`/jobs/${jobId}`, {
        jobTitle: formData.get('title'),
        jobDescription: formData.get('description'),
        jobLocation: formData.get('location'),
        salary: formData.get('salary') ? parseFloat(formData.get('salary') as string) : null,
        jobType: formData.get('type'),
        jobStatus: formData.get('status'),
      });

      if (response.status === 200) {
        setSuccess('Job updated successfully!');
        setEditingJob(null);
        await fetchJobs();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error updating job:', error);
      setError('Failed to update job');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Handle delete job
  const handleDeleteJob = async (jobId: number) => {
    if (!confirm('Are you sure you want to delete this job?')) return;

    try {
      const response = await api.delete(`/jobs/${jobId}`);
      
      if (response.status === 200) {
        setSuccess('Job deleted successfully!');
        await fetchJobs();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      setError('Failed to delete job');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Show applications modal
  const showApplicationsModal = async (jobId: number) => {
    setModalLoading(true);
    try {
      const response = await api.get(`/jobs/${jobId}/applications`);
      const applications = response.data.applications || response.data || [];

      setModalData({
        type: 'applications',
        jobId,
        data: applications,
        title: 'Applications'
      });
    } catch (error) {
      console.error('Error fetching applications:', error);
      setError('Failed to load applications');
    } finally {
      setModalLoading(false);
    }
  };

  // Close modal
  const closeModal = () => {
    setModalData(null);
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
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Jobs</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your posted job listings.</p>
              </div>
              <button className="bg-[#00639C] text-white px-6 py-2 rounded-full hover:bg-[#005A8C] text-sm font-medium">
                Post New Job
              </button>
            </div>

            {/* Jobs List */}
            {jobs.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm text-center">
                <div className="text-6xl text-gray-400 mb-4">💼</div>
                <p className="text-gray-500 dark:text-gray-400 text-lg">No jobs posted yet.</p>
                <p className="text-gray-500 dark:text-gray-400 mb-4">Start by posting your first job opening!</p>
                <a href="/dashboard/recruiter/jobs/post-a-job">
                <button className="bg-[#00639C] text-white px-4 py-2 rounded-full hover:bg-[#005A8C]">
                  Post a Job
                </button>
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <JobCard
                    key={job.jobId}
                    job={job}
                    isEditing={editingJob === job.jobId}
                    onEditStart={() => setEditingJob(job.jobId)}
                    onEditCancel={() => setEditingJob(null)}
                    onUpdate={handleUpdateJob}
                    onDelete={handleDeleteJob}
                    onShowApplications={showApplicationsModal}
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

      {/* Applications Modal */}
      {modalData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-96 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {modalData.title}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto max-h-80">
              {modalLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : modalData.data.length === 0 ? (
                <div className="text-center p-8 text-gray-500 dark:text-gray-400">
                  No applications yet
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {modalData.data.map((application: any) => (
                    <div key={application.id} className="p-4 flex items-center space-x-3">
                      <img
                        src={application.user?.avatar || '/avatar.png'}
                        alt={application.user?.firstName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {application.user?.firstName} {application.user?.lastName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Applied {new Date(application.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// JobCard Component
function JobCard({ 
  job, 
  isEditing, 
  onEditStart, 
  onEditCancel, 
  onUpdate, 
  onDelete,
  onShowApplications 
}: {
  job: Job;
  isEditing: boolean;
  onEditStart: () => void;
  onEditCancel: () => void;
  onUpdate: (e: React.FormEvent, jobId: number) => void;
  onDelete: (jobId: number) => void;
  onShowApplications: (jobId: number) => void;
}) {
  const [openMenu, setOpenMenu] = useState(false);
  const [saving, setSaving] = useState(false);

  if (isEditing) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm relative">
        <form
  onSubmit={async (e) => {
    setSaving(true);
    await onUpdate(e, job.jobId);
    setSaving(false);
  }}
  className="space-y-4"
>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Job Title
              </label>
              <input
                type="text"
                name="title"
                defaultValue={job.jobTitle}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                defaultValue={job.jobLocation}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm"
                placeholder="e.g., Remote"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Salary
              </label>
              <input
                type="number"
                name="salary"
                defaultValue={job.salary || ''}
                step="0.01"
                className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm"
                placeholder="e.g., 50000"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Job Type
                </label>
                <select
                  name="type"
                  defaultValue={job.jobType}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm"
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  defaultValue={job.jobStatus}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm"
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              name="description"
              rows={4}
              defaultValue={job.jobDescription}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm resize-none"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onEditCancel}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
  type="submit"
  disabled={saving}
  className="bg-[#00639C] text-white px-6 py-2 rounded-full hover:bg-[#005080] text-sm flex items-center justify-center min-w-[130px]"
>
{saving ? (
  <>
    <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
    Saving...
  </>
) : (
  "Save Changes"
)}

</button>

          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm relative">
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <div className="flex items-start space-x-3 flex-1">
            <img
              src={`${process.env.NEXT_PUBLIC_FILE_URL}/${job.company.companyLogo || '/company-avatar.png'}`}
              className="w-10 h-10 rounded-full object-cover mt-1"
              alt="Company"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white">{job.jobTitle}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{job.company.companyName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {job.jobLocation || 'Remote'} • {job.jobType} • 
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-1 ${
                  job.jobStatus === 'open'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                }`}>
                  {job.jobStatus.charAt(0).toUpperCase() + job.jobStatus.slice(1)}
                </span>
              </p>
              {job.salary && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  NGN{job.salary.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / month
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {new Date(job.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })} • {job.application_count} application{job.application_count !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="relative ml-4">
            <button
              onClick={() => setOpenMenu(!openMenu)}
              className="text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white focus:outline-none"
            >
              ⋮
            </button>
            {openMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-50">
                <ul className="text-sm text-gray-700 dark:text-gray-200 divide-y divide-gray-200 dark:divide-gray-600">
                  <li>
                    <button
                      onClick={() => {
                        onShowApplications(job.jobId);
                        setOpenMenu(false);
                      }}
                      className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left"
                    >
                      👥 View Applications ({job.application_count ?? 0})
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        onEditStart();
                        setOpenMenu(false);
                      }}
                      className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left"
                    >
                         <FontAwesomeIcon icon={faEdit} className="text-gray-500" />
                      Edit Job
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => onDelete(job.jobId)}
                      className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left text-red-600"
                    >
                      <FontAwesomeIcon icon={faTrash} className="text-red-500" />
                      Delete Job
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {job.jobDescription.substring(0, 150)}...
        </p>
        {job.jobImage && (
          <img
            src={`${process.env.NEXT_PUBLIC_FILE_URL}/${job.jobImage}`}
            alt="Job Image"
            className="w-full h-32 object-cover rounded-lg mt-2"
          />
        )}
      </div>
    </div>
  );
}