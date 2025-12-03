'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import RightbarRecruiters from '@/components/Rightbar';
import HeaderLoggedIn from '@/components/HeaderLoggedIn';
import api from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding, faGraduationCap, faBriefcase, faIdCard, faStar, faEnvelope, faPhone, faMapMarkerAlt, faCalendarAlt, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  otherNames?: string;
  role: string;
  profileImage?: string;
  coverImage?: string;
  location?: string;
  bio?: string;
  email: string;
  phoneNumber?: string;
  email_verified_at?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Company {
  companyId: number;
  companyName: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyWebsite?: string;
  companyDescription?: string;
  companyLogo?: string;
  companyIndustry?: string;
  companySize?: string;
  companyLocation?: string;
  companyFoundedYear?: number;
  companyStatus?: string;
  createdBy?: number;
  created_at: string;
  updated_at: string;
}

interface Job {
  jobId: number;
  companyId: number;
  jobTitle: string;
  jobDescription: string;
  jobLocation: string;
  jobType: string;
  salary: string | null;
  applicationDeadline: string | null;
  jobStatus: string;
  jobImage: string | null;
  postedBy: number;
  created_at: string;
  updated_at: string;
  company: Company;
}

interface Education {
  educationId: number;
  userId: number;
  institutionName: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface WorkExperience {
  workExperienceId: number;
  userId: number;
  companyName: string | null;
  position: string;
  location: string;
  startDate: string;
  endDate: string | null;
  description: string | null;
  isCurrentlyWorking: number;
  created_at: string;
  updated_at: string;
}

interface DriversLicense {
  id: number;
  licenseId: string;
  userId: number;
  licenseNumber: string | null;
  issueDate: string;
  expiryDate: string;
  image: string | null;
  created_at: string;
  updated_at: string;
}

interface Skill {
  skillId: number;
  userId: number;
  skillName: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  created_at: string;
  updated_at: string;
}

interface Application {
  applicationId: number;
  jobId: number;
  applicantId: number;
  applicationDate: string;
  applicationStatus: string;
  coverLetter: string | null;
  resumePath: string | null;
  created_at: string;
  updated_at: string;
  job: Job;
  applicant: User;
  education: Education[];
  work_experience: WorkExperience[];
  drivers_license: DriversLicense[];
  skills: Skill[];
}

export default function ApplicationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');

  const [user, setUser] = useState<User | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedDetails, setExpandedDetails] = useState<number | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'education' | 'experience' | 'license' | 'skills'>('profile');

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
      setApplications(response.data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      throw error;
    }
  };

  // Fetch all applications for recruiter's companies
  const fetchAllApplications = async () => {
    try {
      const response = await api.get('/applications');
      setApplications(response.data || []);
    } catch (error) {
      console.error('Error fetching all applications:', error);
      throw error;
    }
  };

  // Handle status update
  const handleStatusUpdate = async (applicationId: number, applicationStatus: string) => {
    setUpdatingStatus(applicationId);
    try {
      const response = await api.put(`/applications/${applicationId}/status`, { applicationStatus });
      
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

  // Get skill level class
  const getSkillLevelClass = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'intermediate':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'advanced':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'expert':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
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
          <main className="flex-1 space-y-6 mt-6 max-h-[calc(100vh-4rem)] overflow-y-auto scrollbar-hide pb-20">
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
                    {jobId ? `Applications for Job #${jobId}` : 'All Applications'}
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
                  <div key={application.applicationId} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                    {/* Header Section */}
                    <div className="flex justify-between items-start mb-4">
                      {/* Applicant Info */}
                      <div className="flex items-start space-x-4 flex-1">
                        <Image
                          src={application.applicant.profileImage
                            ? `${process.env.NEXT_PUBLIC_FILE_URL}/${application.applicant.profileImage}`
                            : '/User-avatar.svg'
                          }
                          width={64}
                          height={64}
                          className="w-16 h-16 rounded-full object-cover"
                          alt="Applicant"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                            {application.applicant.firstName} {application.applicant.lastName} 
                            {application.applicant.otherNames && ` ${application.applicant.otherNames.charAt(0)}.`}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">{application.applicant.email}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Applied on {new Date(application.applicationDate).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                          
                          {/* Job Info */}
                          <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <p className="font-medium text-gray-900 dark:text-white">
                              <FontAwesomeIcon icon={faBuilding} className="mr-2 text-sm" />
                              {application.job.jobTitle} at {application.job.company.companyName}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {application.job.jobLocation} • {application.job.jobType}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Status and Actions */}
                      <div className="flex flex-col items-end space-y-2">
                        {/* Status Badge */}
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(application.applicationStatus)}`}>
                          {application.applicationStatus.charAt(0).toUpperCase() + application.applicationStatus.slice(1)}
                        </span>

                        {/* Actions */}
                        <div className="flex space-x-2">
                          <button
                            onClick={() => toggleDetails(application.applicationId)}
                            className="text-sm text-[#00639C] hover:text-[#005080] dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            {expandedDetails === application.applicationId ? 'Hide Details' : 'View Details'}
                          </button>
                          <button
                            onClick={() => window.open(`/profile/view?user_id=${application.applicantId}`, '_blank')}
                            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                            title="View Full Profile"
                          >
                            <FontAwesomeIcon icon={faExternalLinkAlt} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Status Update Form */}
                    <div className="flex items-center space-x-4 mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Update Status:</label>
                      <select
                        value={application.applicationStatus}
                        onChange={(e) => handleStatusUpdate(application.applicationId, e.target.value)}
                        disabled={updatingStatus === application.applicationId}
                        className="border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1 text-sm bg-white dark:bg-gray-800"
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
                        {/* Tabs */}
                        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 dark:border-gray-600 pb-2">
                          <button
                            onClick={() => setActiveTab('profile')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-[#00639C] text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                          >
                            Profile
                          </button>
                          <button
                            onClick={() => setActiveTab('education')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'education' ? 'bg-[#00639C] text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                          >
                            Education ({application.education.length})
                          </button>
                          <button
                            onClick={() => setActiveTab('experience')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'experience' ? 'bg-[#00639C] text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                          >
                            Experience ({application.work_experience.length})
                          </button>
                          <button
                            onClick={() => setActiveTab('license')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'license' ? 'bg-[#00639C] text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                          >
                            License ({application.drivers_license.length})
                          </button>
                          <button
                            onClick={() => setActiveTab('skills')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'skills' ? 'bg-[#00639C] text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                          >
                            Skills ({application.skills.length})
                          </button>
                        </div>

                        {/* Tab Content */}
                        <div className="min-h-[300px]">
                          {/* Profile Tab */}
                          {activeTab === 'profile' && (
                            <div className="space-y-6">
                              {/* Cover Letter */}
                              {application.coverLetter && (
                                <div>
                                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                                    <FontAwesomeIcon icon={faEnvelope} className="mr-2 text-sm" />
                                    Cover Letter
                                  </h4>
                                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                                      {application.coverLetter}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Personal Information */}
                              <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Personal Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div className="space-y-2">
                                    <p className="flex items-center">
                                      <FontAwesomeIcon icon={faEnvelope} className="mr-2 text-gray-500 dark:text-gray-400" />
                                      <strong className="mr-2">Email:</strong>
                                      <span className="text-gray-700 dark:text-gray-300">{application.applicant.email}</span>
                                    </p>
                                    {application.applicant.phoneNumber && (
                                      <p className="flex items-center">
                                        <FontAwesomeIcon icon={faPhone} className="mr-2 text-gray-500 dark:text-gray-400" />
                                        <strong className="mr-2">Phone:</strong>
                                        <span className="text-gray-700 dark:text-gray-300">{application.applicant.phoneNumber}</span>
                                      </p>
                                    )}
                                    {application.applicant.location && (
                                      <p className="flex items-center">
                                        <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-gray-500 dark:text-gray-400" />
                                        <strong className="mr-2">Location:</strong>
                                        <span className="text-gray-700 dark:text-gray-300">{application.applicant.location}</span>
                                      </p>
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                    <p className="flex items-center">
                                      <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-gray-500 dark:text-gray-400" />
                                      <strong className="mr-2">Member Since:</strong>
                                      <span className="text-gray-700 dark:text-gray-300">
                                        {new Date(application.applicant.created_at).toLocaleDateString('en-US', {
                                          month: 'long',
                                          year: 'numeric'
                                        })}
                                      </span>
                                    </p>
                                    <p className="flex items-center">
                                      <strong className="mr-2">Status:</strong>
                                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(application.applicationStatus)}`}>
                                        {application.applicationStatus.charAt(0).toUpperCase() + application.applicationStatus.slice(1)}
                                      </span>
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Bio */}
                              {application.applicant.bio && (
                                <div>
                                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Bio</h4>
                                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                      {application.applicant.bio}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Job Information */}
                              <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Job Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p><strong>Job Title:</strong> {application.job.jobTitle}</p>
                                    <p><strong>Company:</strong> {application.job.company.companyName}</p>
                                    <p><strong>Location:</strong> {application.job.jobLocation}</p>
                                  </div>
                                  <div>
                                    <p><strong>Job Type:</strong> {application.job.jobType}</p>
                                    {application.job.salary && (
                                      <p><strong>Salary:</strong> ${parseFloat(application.job.salary).toLocaleString()}</p>
                                    )}
                                    <p><strong>Applied:</strong> {new Date(application.applicationDate).toLocaleDateString('en-US')}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Education Tab */}
                          {activeTab === 'education' && (
                            <div className="space-y-4">
                              {application.education.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No education information provided.</p>
                              ) : (
                                application.education.map((edu) => (
                                  <div key={edu.educationId} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <h5 className="font-semibold text-gray-900 dark:text-white flex items-center">
                                          <FontAwesomeIcon icon={faGraduationCap} className="mr-2 text-sm" />
                                          {edu.institutionName}
                                        </h5>
                                        <p className="text-gray-600 dark:text-gray-400 mt-1">{edu.degree}</p>
                                        {edu.fieldOfStudy && (
                                          <p className="text-gray-600 dark:text-gray-400">Field: {edu.fieldOfStudy}</p>
                                        )}
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                          {new Date(edu.startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} -
                                          {edu.endDate
                                            ? ` ${new Date(edu.endDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
                                            : ' Present'
                                          }
                                        </p>
                                        {edu.description && (
                                          <p className="mt-2 text-gray-700 dark:text-gray-300 text-sm">{edu.description}</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}

                          {/* Experience Tab */}
                          {activeTab === 'experience' && (
                            <div className="space-y-4">
                              {application.work_experience.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No work experience provided.</p>
                              ) : (
                                application.work_experience.map((exp) => (
                                  <div key={exp.workExperienceId} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <h5 className="font-semibold text-gray-900 dark:text-white flex items-center">
                                          <FontAwesomeIcon icon={faBriefcase} className="mr-2 text-sm" />
                                          {exp.position}
                                        </h5>
                                        {exp.companyName && (
                                          <p className="text-gray-600 dark:text-gray-400 mt-1">Company: {exp.companyName}</p>
                                        )}
                                        {exp.location && (
                                          <p className="text-gray-600 dark:text-gray-400">Location: {exp.location}</p>
                                        )}
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                          {new Date(exp.startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} -
                                          {exp.endDate
                                            ? ` ${new Date(exp.endDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
                                            : exp.isCurrentlyWorking ? ' Present' : ''
                                          }
                                          {exp.isCurrentlyWorking && ' • Currently Working'}
                                        </p>
                                        {exp.description && (
                                          <p className="mt-2 text-gray-700 dark:text-gray-300 text-sm">{exp.description}</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}

                          {/* License Tab */}
                          {activeTab === 'license' && (
                            <div className="space-y-4">
                              {application.drivers_license.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No driver's license provided.</p>
                              ) : (
                                application.drivers_license.map((license) => (
                                  <div key={license.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                                      <div className="flex-1">
                                        <h5 className="font-semibold text-gray-900 dark:text-white flex items-center">
                                          <FontAwesomeIcon icon={faIdCard} className="mr-2 text-sm" />
                                          Driver's License: {license.licenseId}
                                        </h5>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm">
                                          <p>
                                            <strong>Issue Date:</strong> {new Date(license.issueDate).toLocaleDateString('en-US')}
                                          </p>
                                          <p>
                                            <strong>Expiry Date:</strong> {new Date(license.expiryDate).toLocaleDateString('en-US')}
                                          </p>
                                        </div>
                                      </div>
                                      {license.image && (
                                        <div className="flex-shrink-0">
                                          <Image
                                            src={`${process.env.NEXT_PUBLIC_FILE_URL}/${license.image}`}
                                            alt="Driver's License"
                                            width={200}
                                            height={120}
                                            className="rounded-lg object-cover border border-gray-300 dark:border-gray-600"
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).src = '/placeholder.jpg';
                                            }}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}

                          {/* Skills Tab */}
                          {activeTab === 'skills' && (
                            <div>
                              {application.skills.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No skills provided.</p>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {application.skills.map((skill) => (
                                    <div key={skill.skillId} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                                      <div className="flex justify-between items-center">
                                        <div>
                                          <h5 className="font-semibold text-gray-900 dark:text-white flex items-center">
                                            <FontAwesomeIcon icon={faStar} className="mr-2 text-sm" />
                                            {skill.skillName}
                                          </h5>
                                          <span className={`text-xs px-2 py-1 rounded-full mt-1 ${getSkillLevelClass(skill.skillLevel)}`}>
                                            {skill.skillLevel.charAt(0).toUpperCase() + skill.skillLevel.slice(1)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Action Links */}
                        <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                          <a
                            href={`mailto:${application.applicant.email}`}
                            className="bg-[#00639C] text-white px-4 py-2 rounded-full hover:bg-[#005080] text-sm flex items-center"
                          >
                            <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
                            Send Email
                          </a>
                          {/* <Link
                            href={`/profile/view?user_id=${application.applicantId}`}
                            target="_blank"
                            className="bg-gray-500 text-white px-4 py-2 rounded-full hover:bg-gray-600 text-sm flex items-center"
                          >
                            <FontAwesomeIcon icon={faExternalLinkAlt} className="mr-2" />
                            View Full Profile
                          </Link> */}
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