'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import RightbarRecruiters from '@/components/Rightbar';
import HeaderLoggedIn from '@/components/HeaderLoggedIn';
import api from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  profile_picture?: string;
}

interface Job {
  jobId: number;
  title: string;
  description: string;
  location: string;
  salary: number | null;
  jobType: string;
  status: string;
  companyName: string;
  companyLogo: string | null;
  application_count: number;
  created_at: string;
}

interface Application {
  applicationId: number;
  applicantId: number;
  jobId: number;
  applicationStatus: string;
  created_at: string;
  coverLetter: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  location: string | null;
  profile_picture: string | null;
  jobTitle: string;
  companyName: string;
}

interface Company {
  id: number;
  companyName: string;
  companyLogo: string | null;
}

export default function ApplicationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');

  const [user, setUser] = useState<User | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedDetails, setExpandedDetails] = useState<number | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);

  // Fetch user data and applications
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Check if user is recruiter
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData: User = JSON.parse(storedUser);
          setUser(userData);
          
          if (userData.role !== 'Recruiter') {
            router.push('/dashboardjobs');
            return;
          }
        }

        // Fetch applications
        if (jobId) {
          await fetchApplicationsByJob(parseInt(jobId));
          await fetchJobDetails(parseInt(jobId));
        } else {
          await fetchAllApplications();
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load applications');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [jobId, router]);

  // Fetch applications for a specific job
  const fetchApplicationsByJob = async (id: number) => {
    try {
      const response = await api.get(`/jobs/${id}/applications`);
      setApplications(response.data.applications || response.data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      throw error;
    }
  };

  // Fetch all applications for recruiter's companies
  const fetchAllApplications = async () => {
    try {
      const response = await api.get('/applications');
      setApplications(response.data.applications || response.data || []);
    } catch (error) {
      console.error('Error fetching all applications:', error);
      throw error;
    }
  };

  // Fetch job details
  const fetchJobDetails = async (id: number) => {
    try {
      const response = await api.get(`/jobs/${id}`);
      setJob(response.data);
    } catch (error) {
      console.error('Error fetching job details:', error);
    }
  };

  // Handle status update
  const handleStatusUpdate = async (applicationId: number, applicationStatus: string) => {
    setUpdatingStatus(applicationId);
    try {
      const response = await api.put(`/applications/${applicationId}/status`, {  applicationStatus });
      
      if (response.status === 200) {
        setSuccess('Application status updated successfully!');
        
        // Update local state
        setApplications(prev => prev.map(app => 
          app.applicationId === applicationId ? { ...app, applicationStatus } : app
        ));
        
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Failed to update application status');
      setTimeout(() => setError(''), 3000);
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Toggle application details
  const toggleDetails = (id: number) => {
    setExpandedDetails(expandedDetails === id ? null : id);
  };

  // Get status badge class
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'interviewed':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'hired':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  // Calculate statistics
  const stats = {
    total: applications.length,
    pending: applications.filter(app => app.applicationStatus === 'pending').length,
    reviewed: applications.filter(app => app.applicationStatus === 'reviewed').length,
    interviewed: applications.filter(app => app.applicationStatus === 'interviewed').length,
    hired: applications.filter(app => app.applicationStatus === 'hired').length,
    rejected: applications.filter(app => app.applicationStatus === 'rejected').length,
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
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading applications...</p>
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
          <main className="flex-1 space-y-6 mt-6 max-h-[calc(100vh-4rem)] overflow-y-auto scrollbar-hide">
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
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {jobId ? `Applications for: ${job?.title}` : 'All Applications'}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {jobId ? 'Manage applications for this position' : 'View and manage all job applications across your companies'}
                  </p>
                </div>
                {jobId && (
                  <Link
                    href="/dashboard/recruiter/jobs"
                    className="bg-gray-500 text-white px-4 py-2 rounded-full hover:bg-gray-600 text-sm font-medium"
                  >
                    ← Back to Jobs
                  </Link>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">Total</div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</div>
                  <div className="text-sm text-yellow-600 dark:text-yellow-400">Pending</div>
                </div>
               <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
  <div className="text-2xl font-bold text-purple-600 dark:text-purple-300">
    {stats.reviewed}
  </div>
  <div className="text-sm text-purple-600 dark:text-purple-300">
    Reviewed
  </div>
</div>

              
               <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg text-center">
  <div className="text-2xl font-bold text-orange-600 dark:text-orange-300">
    {stats.interviewed}
  </div>
  <div className="text-sm text-orange-600 dark:text-orange-300">
    Interviewed
  </div>
</div>

                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.hired}</div>
                  <div className="text-sm text-green-600 dark:text-green-400">Hired</div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.rejected}</div>
                  <div className="text-sm text-red-600 dark:text-red-400">Rejected</div>
                </div>
              </div>
            </div>

            {/* Applications List */}
            {applications.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm text-center">
                <div className="text-6xl text-gray-400 mb-4">👥</div>
                <p className="text-gray-500 dark:text-gray-400 text-lg">No applications yet.</p>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {jobId ? 'No one has applied for this job yet.' : 'You haven\'t received any applications yet.'}
                </p>
                {!jobId && (
                  <Link
                    href="/dashboard/recruiter/jobs"
                    className="bg-[#00639C] text-white px-4 py-2 rounded-full hover:bg-[#005A8C]"
                  >
                    View Your Jobs
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((application) => (
                  <div key={application.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      {/* Applicant Info */}
                      <div className="flex items-start space-x-4 flex-1">
                        <Image
                          src={application.profile_picture 
                            ? `${process.env.NEXT_PUBLIC_FILE_URL}/${application.profile_picture}`
                            : '/User-avatar.svg'
                          }
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-full object-cover"
                          alt="Applicant"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                            {application.applicant?.firstName} {application.applicant?.lastName} {application.applicant?.otherNames ? application.applicant?.otherNames.charAt(0) + '.' : ''}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">{application.applicant?.email}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Applied on {new Date(application.created_at).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </p>
                          
                          {/* Job Info (when viewing all applications) */}
                          {!jobId && (
                            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <p className="font-medium text-gray-900 dark:text-white">{application.job?.jobTitle}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{application.job?.company?.companyName}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status and Actions */}
                      <div className="flex items-center space-x-3">
                        {/* Status Badge */}
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(application.applicationStatus)}`}>
                          {application.applicationStatus.charAt(0).toUpperCase() + application.applicationStatus.slice(1)}
                        </span>

                        {/* Actions */}
                        <div className="relative">
                          <button
                            onClick={() => toggleDetails(application.applicationId)}
                            className="text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white focus:outline-none"
                          >
                            ⋮
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Status Update Form */}
                    <div className="flex items-center space-x-4 mb-4">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Update Status:</label>
                      <select
                        value={application.applicationStatus}
                        onChange={(e) => handleStatusUpdate(application.applicationId, e.target.value)}
                        disabled={updatingStatus === application.applicationId}
                        className="border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1 text-sm"
                      >
                        <option value="pending">Pending</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="interviewed">Interviewed</option>
                        <option value="rejected">Rejected</option>
                        <option value="hired">Hired</option>
                      </select>
                      {updatingStatus === application.applicationId && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      )}
                    </div>

                    {/* Expandable Details */}
                    {expandedDetails === application.applicationId && (
                      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Application Details</h4>
                        
                        {/* Cover Letter */}
                        {application.coverLetter && (
                          <div className="mb-4">
                            <h5 className="font-medium text-gray-900 dark:text-white mb-2">Cover Letter</h5>
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                              {application.coverLetter}
                            </p>
                          </div>
                        )}

                        {/* Applicant Profile Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <h5 className="font-medium text-gray-900 dark:text-white mb-2">Contact Information</h5>
                            <p><strong>Email:</strong> {application.email}</p>
                            {application.phone && (
                              <p><strong>Phone:</strong> {application.phone}</p>
                            )}
                            {application.location && (
                              <p><strong>Location:</strong> {application.location}</p>
                            )}
                          </div>
                          
                          <div>
                            <h5 className="font-medium text-gray-900 dark:text-white mb-2">Application Info</h5>
                            <p><strong>Applied:</strong> {new Date(application.applied_at).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}</p>
                            <p className="flex items-center">
                              <strong className="mr-2">Status:</strong>
                              <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(application.applicationStatus)}`}>
                                {application.applicationStatus.charAt(0).toUpperCase() + application.applicationStatus.slice(1)}
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Action Links */}
                        <div className="flex space-x-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                          <a
                            href={`mailto:${application.email}`}
                            className="text-[#00639C] hover:text-[#005080] text-sm"
                          >
                            📧 Send Email
                          </a>
                          <Link
                            href={`/profile/view?user_id=${application.applicantId}`}
                            className="text-[#00639C] hover:text-[#005080] text-sm"
                          >
                            👤 View Profile
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
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

// Add CSS for scrollbar hide
const styles = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

// Add styles to head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}