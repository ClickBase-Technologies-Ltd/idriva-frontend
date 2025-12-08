'use client';
import { useState, useEffect, useRef } from 'react';
import Sidebar from "@/components/Sidebar";
import RightbarRecruiters from "@/components/Rightbar";
import HeaderLoggedIn from "@/components/HeaderLoggedIn";
import api from '@/lib/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding, faCalendarAlt, faCheckCircle, faClock, faExternalLinkAlt, faFileAlt, faMapMarkerAlt, faSpinner, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  profile_picture?: string;
}

interface Application {
  applicationId: number;
  jobId: number;
  applicantId: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'accepted';
  appliedDate: string;
  resume?: string;
  coverLetter?: string;
  job: {
    jobId: number;
    jobTitle: string;
    jobDescription: string;
    jobLocation: string;
    salary: number | null;
    jobType: string;
    jobStatus: string;
    companyName: string;
    companyLogo: string | null;
    created_at: string;
    image_url?: string;
  };
}

// Get status badge color and icon - Moved outside component to be accessible everywhere
const getStatusInfo = (status: string) => {
  switch (status) {
    case 'pending':
      return {
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        icon: faClock,
        text: 'Under Review'
      };
    case 'reviewed':
      return {
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        icon: faFileAlt,
        text: 'Reviewed'
      };
    case 'shortlisted':
      return {
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
        icon: faCheckCircle,
        text: 'Shortlisted'
      };
    case 'accepted':
      return {
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        icon: faCheckCircle,
        text: 'Accepted'
      };
    case 'rejected':
      return {
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        icon: faTimesCircle,
        text: 'Not Selected'
      };
    default:
      return {
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
        icon: faClock,
        text: status
      };
  }
};

export default function AppliedJobsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  
  const jobsContainerRef = useRef<HTMLDivElement>(null);

  // Fetch user data and applications
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData: User = JSON.parse(storedUser);
          setUser(userData);
        }

        await fetchApplications();
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load applications');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch applications from API
  const fetchApplications = async () => {
    try {
      const response = await api.get('/my-applications');
      
      if (response.status === 200) {
        const data = Array.isArray(response.data) ? response.data : [response.data];
        setApplications(data);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      setError('Failed to load your applications');
    }
  };

  // Filter applications based on status
  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  const withdrawApplication = async (applicationId: number) => {
    if (!confirm('Are you sure you want to withdraw this application?')) return;

    try {
      const response = await api.delete(`/applications/${applicationId}`);
      
      if (response.status === 200) {
        setSuccess('Application withdrawn successfully!');
        await fetchApplications();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error withdrawing application:', error);
      setError('Failed to withdraw application');
      setTimeout(() => setError(''), 3000);
    }
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
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your applications...</p>
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
            className="flex-1 space-y-6 mt-6 max-h-[calc(100vh-4rem)] overflow-y-auto scrollbar-hide pb-10"
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
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Applications</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Track the status of your job applications.</p>
              </div>
              
              <Link
                href="/dashboard/jobs"
                className="bg-[#00639C] text-white px-6 py-2 rounded-full hover:bg-[#005A8C] text-sm font-medium flex items-center"
              >
                Browse More Jobs
              </Link>
            </div>

            {/* Filter Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-1">
              <div className="flex space-x-1 overflow-x-auto">
                {['all', 'pending', 'reviewed', 'shortlisted', 'accepted', 'rejected'].map((status) => {
                  const statusInfo = getStatusInfo(status);
                  return (
                    <button
                      key={status}
                      onClick={() => setFilter(status)}
                      className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                        filter === status
                          ? 'bg-[#00639C] text-white'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {status === 'all' ? 'All Applications' : statusInfo.text}
                      {status !== 'all' && (
                        <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-white/20">
                          {applications.filter(app => app.status === status).length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Applications List */}
            {filteredApplications.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm text-center">
                <div className="text-6xl text-gray-400 mb-4">📄</div>
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  {filter === 'all' 
                    ? 'You haven\'t applied to any jobs yet.'
                    : `No ${filter} applications found.`}
                </p>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {filter === 'all' 
                    ? 'Start applying to jobs that match your skills and interests!'
                    : 'Try changing the filter or browse more jobs.'}
                </p>
                <Link
                  href="/dashboard/jobs"
                  className="bg-[#00639C] text-white px-6 py-2 rounded-full hover:bg-[#005A8C] text-sm font-medium inline-flex items-center"
                >
                  Browse Available Jobs
                  <FontAwesomeIcon icon={faExternalLinkAlt} className="ml-2 text-sm" />
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredApplications.map((application) => (
                  <ApplicationCard
                    key={application.applicationId}
                    application={application}
                    onWithdraw={withdrawApplication}
                    onViewDetails={() => setSelectedApplication(application)}
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

      {/* Application Details Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedApplication.job.jobTitle}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {selectedApplication.job.companyName}
                </p>
              </div>
              <button
                onClick={() => setSelectedApplication(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
              {/* Application Status */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      getStatusInfo(selectedApplication.status).color
                    }`}>
                      <FontAwesomeIcon 
                        icon={getStatusInfo(selectedApplication.status).icon} 
                        className="mr-2"
                      />
                      {getStatusInfo(selectedApplication.status).text}
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Applied on {new Date(selectedApplication.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Job Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center space-x-3">
                  <FontAwesomeIcon icon={faBuilding} className="text-gray-400 w-5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Company</p>
                    <p className="font-medium">{selectedApplication.job?.company?.companyName}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="text-gray-400 w-5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                    <p className="font-medium">{selectedApplication.job.jobLocation || 'Remote'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400 w-5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Job Type</p>
                    <p className="font-medium capitalize">{selectedApplication.job.jobType.replace('-', ' ')}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <FontAwesomeIcon icon={faFileAlt} className="text-gray-400 w-5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Salary</p>
                    <p className="font-medium">
                      {selectedApplication.job.salary 
                        ? `NGN${selectedApplication.job.salary.toLocaleString()}/month`
                        : 'Negotiable'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Job Description */}
              <div className="mb-6">
                <h4 className="font-semibold text-lg mb-3">Job Description</h4>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  {selectedApplication.job.jobDescription}
                </p>
              </div>

              {/* Application Documents */}
              {(selectedApplication.resume || selectedApplication.coverLetter) && (
                <div className="mb-6">
                  <h4 className="font-semibold text-lg mb-3">Submitted Documents</h4>
                  <div className="space-y-3">
                    {selectedApplication.resume && (
                      <a 
                        href={`${process.env.NEXT_PUBLIC_FILE_URL}/${selectedApplication.resume}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                            <span className="text-blue-600 dark:text-blue-300 font-semibold">PDF</span>
                          </div>
                          <div>
                            <p className="font-medium">Resume</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Submitted with application</p>
                          </div>
                        </div>
                        <FontAwesomeIcon icon={faExternalLinkAlt} className="text-gray-400" />
                      </a>
                    )}
                    {selectedApplication.coverLetter && (
                      <a 
                        href={`${process.env.NEXT_PUBLIC_FILE_URL}/${selectedApplication.coverLetter}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                            <span className="text-green-600 dark:text-green-300 font-semibold">DOC</span>
                          </div>
                          <div>
                            <p className="font-medium">Cover Letter</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Submitted with application</p>
                          </div>
                        </div>
                        <FontAwesomeIcon icon={faExternalLinkAlt} className="text-gray-400" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Status Notes */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Application Status Information</h4>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  {selectedApplication.applicationStatus === 'pending' && 'Your application is being reviewed by the hiring team. This process typically takes 1-2 weeks.'}
                  {selectedApplication.applicationStatus === 'reviewed' && 'Your application has been reviewed. You may be contacted for next steps if you\'re shortlisted.'}
                  {selectedApplication.applicationStatus === 'shortlisted' && 'Congratulations! You\'ve been shortlisted. The company will contact you for interviews.'}
                  {selectedApplication.applicationStatus === 'accepted' && 'Congratulations! Your application has been accepted. Expect further communication regarding onboarding.'}
                  {selectedApplication.applicationStatus === 'rejected' && 'Thank you for your application. While you weren\'t selected for this role, we encourage you to apply for other positions.'}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => withdrawApplication(selectedApplication.applicationId)}
                disabled={['accepted', 'rejected'].includes(selectedApplication.applicationStatus)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  ['accepted', 'rejected'].includes(selectedApplication.applicationStatus)
                    ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800'
                }`}
              >
                Withdraw Application
              </button>
              <button
                onClick={() => setSelectedApplication(null)}
                className="bg-[#00639C] text-white px-6 py-2 rounded-full hover:bg-[#005A8C] text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ApplicationCard Component
function ApplicationCard({ 
  application,
  onWithdraw,
  onViewDetails
}: {
  application: Application;
  onWithdraw: (applicationId: number) => void;
  onViewDetails: () => void;
}) {
  const statusInfo = getStatusInfo(application.status);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        {/* Left Section - Job Info */}
        <div className="flex-1">
          <div className="flex items-start space-x-4">
            <img
              src={application.job.company?.companyLogo 
                ? `${process.env.NEXT_PUBLIC_FILE_URL}/${application.job?.company?.companyLogo}`
                : '/companyLogo.png'
              }
              alt={application.job?.company?.companyName}
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                  {application.job.jobTitle}
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                  <FontAwesomeIcon icon={statusInfo.icon} className="mr-1" />
                  {statusInfo.text}
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                <span className="flex items-center">
                  <FontAwesomeIcon icon={faBuilding} className="mr-2 w-3" />
                  {application.job?.company?.companyName}
                </span>
                <span className="flex items-center">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 w-3" />
                  {application.job.jobLocation || 'Remote'}
                </span>
                <span className="capitalize">
                  {application.job.jobType.replace('-', ' ')}
                </span>
                {application.job.salary && (
                  <span className="font-medium">
                    NGN{application.job.salary.toLocaleString()}/month
                  </span>
                )}
              </div>

              <p className="text-gray-700 dark:text-gray-300 line-clamp-2 mb-4">
                {application.job.jobDescription}
              </p>

              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 w-3" />
                Applied on {new Date(application.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex flex-col space-y-3 md:w-auto">
          <button
            onClick={onViewDetails}
            className="bg-[#00639C] text-white px-4 py-2 rounded-full hover:bg-[#005A8C] text-sm font-medium flex items-center justify-center"
          >
            View Details
            <FontAwesomeIcon icon={faExternalLinkAlt} className="ml-2 text-xs" />
          </button>
          
          <button
            onClick={() => onWithdraw(application.applicationId)}
            disabled={['accepted', 'rejected'].includes(application.applicationStatus)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center justify-center ${
              ['accepted', 'rejected'].includes(application.status)
                ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                : 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'
            }`}
          >
            <FontAwesomeIcon icon={faTimesCircle} className="mr-2" />
            Withdraw
          </button>
        </div>
      </div>
    </div>
  );
}