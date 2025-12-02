'use client';
import { useState, useEffect, useRef } from 'react';
import Sidebar from "@/components/Sidebar";
import RightbarRecruiters from "@/components/Rightbar";
import HeaderLoggedIn from "@/components/HeaderLoggedIn";
import api from '@/lib/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBuilding, 
  faBriefcase,
  faMapMarkerAlt,
  faMoneyBill,
  faClock,
  faImage,
  faSpinner,
  faTimes,
  faCheck,
  faExclamationTriangle,
  faUpload
} from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  profile_picture?: string;
}

interface Company {
  companyId: number; // Changed from companyId to companyId to match API
  companyName: string;
  companyLogo: string | null;
}

export default function PostJobPage() {
  const [user, setUser] = useState<User | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user data and companies
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData: User = JSON.parse(storedUser);
          setUser(userData);
        }

        await fetchCompanies();
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch companies from API
  const fetchCompanies = async () => {
  try {
    const response = await api.get('/my-companies');

    if (response.status === 200) {

      // Ensure array
      const data = Array.isArray(response.data) ? response.data : [response.data];

      const companiesData = data.map((company: any) => ({
        companyId: company.companyId,
        companyName: company.companyName,
        companyLogo: company.companyLogo
      }));

      setCompanies(companiesData);

      if (companiesData.length === 0) {
        router.push('/recruiter/companies');
      }
    }
  } catch (error) {
    console.error('Error fetching companies:', error);
    setError('Failed to load companies');
  }
};


  // Handle job post
  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    
    try {
      const response = await api.post('/jobs', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 201) {
        setSuccess('Job posted successfully!');
        setTimeout(() => {
          router.push('/dashboard/recruiter/jobs');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error posting job:', error);
      setError(error.response?.data?.message || 'Failed to post job');
      setTimeout(() => setError(''), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle image preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
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
          <main className="flex-1 space-y-6 mt-6 max-h-[calc(100vh-4rem)] overflow-y-auto scrollbar-hide pt-2 pb-10">
            {/* Success/Error Messages */}
            {success && (
              <div className="bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg p-4">
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faCheck} className="text-green-600 dark:text-green-400 mr-2" />
                  <div className="text-green-600 dark:text-green-400 font-medium flex-1">{success}</div>
                  <button 
                    onClick={() => setSuccess('')}
                    className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg p-4">
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 dark:text-red-400 mr-2" />
                  <div className="text-red-600 dark:text-red-400 font-medium flex-1">{error}</div>
                  <button 
                    onClick={() => setError('')}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              </div>
            )}

            {/* Post Job Form */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faBriefcase} className="text-blue-600" />
                Post a New Job
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Fill in the details below to create a job posting for your company.
              </p>
              
              <form onSubmit={handlePostJob} className="space-y-6" encType="multipart/form-data">
                {/* Company Selection */}
                <div>
                  <label htmlFor="companyId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Company <span className="text-red-500">*</span>
                  </label>
                  <select 
                    name="companyId" 
                    id="companyId" 
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                    required
                  >
                    <option value="">Select a company</option>
                    {companies.map((company) => (
                      <option key={company.companyId} value={company.companyId}>
                        {company.companyName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Job Title */}
                <div>
                  <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="jobTitle" 
                    id="jobTitle" 
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                    placeholder="e.g., Driving Instructor" 
                    required
                  />
                </div>

                {/* Job Description */}
                <div>
                  <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea 
                    name="jobDescription" 
                    id="jobDescription" 
                    rows={6} 
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 resize-none"
                    placeholder="Describe the job responsibilities, requirements, and benefits..."
                    required
                  />
                </div>

                {/* Job Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Location */}
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="text-gray-400" />
                      Location
                    </label>
                    <input 
                      type="text" 
                      name="jobLocation" 
                      id="jobLocation" 
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                      placeholder="e.g., New York, NY"
                    />
                  </div>
                  
                  {/* Salary */}
                  <div>
                    <label htmlFor="salary" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <FontAwesomeIcon icon={faMoneyBill} className="text-gray-400" />
                      Salary (per year)
                    </label>
                    <input 
                      type="number" 
                      name="salary" 
                      id="salary" 
                      step="0.01"
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                      placeholder="e.g., 50000"
                    />
                  </div>
                  
                  {/* Job Type */}
                  <div>
                    <label htmlFor="jobType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <FontAwesomeIcon icon={faClock} className="text-gray-400" />
                      Job Type
                    </label>
                    <select 
                      name="jobType" 
                      id="jobType" 
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                    >
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                    </select>
                  </div>
                </div>

                {/* Job Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Job Image (optional)
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {imagePreview ? (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Job image preview"
                            className="w-20 h-20 rounded-lg object-cover border border-gray-300"
                          />
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            <FontAwesomeIcon icon={faTimes} />
                          </button>
                        </div>
                      ) : (
                        <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                          <FontAwesomeIcon icon={faImage} className="text-gray-400 text-xl" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        name="jobImage"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept="image/*"
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2 w-fit"
                      >
                        <FontAwesomeIcon icon={faUpload} />
                        {imagePreview ? 'Change Image' : 'Upload Image'}
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Recommended image, max 5MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-[#00639C] text-white px-6 py-2 rounded-full hover:bg-[#005080] text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faBriefcase} />
                        Post Job
                      </>
                    )}
                  </button>
                </div>
              </form>
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