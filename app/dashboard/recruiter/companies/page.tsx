'use client';
import { useState, useEffect, useRef } from 'react';
import Sidebar from "@/components/Sidebar";
import RightbarRecruiters from "@/components/Rightbar";
import HeaderLoggedIn from "@/components/HeaderLoggedIn";
import api from '@/lib/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBuilding, 
  faPlus, 
  faEllipsisVertical, 
  faEye, 
  faEdit, 
  faTrash, 
  faGlobe, 
  faIndustry, 
  faUsers, 
  faMapMarkerAlt, 
  faCalendarAlt,
  faEnvelope,
  faPhone,
  faSpinner,
  faTimes,
  faCheck,
  faExclamationTriangle,
  faUpload,
  faImage
} from '@fortawesome/free-solid-svg-icons';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  profile_picture?: string;
}

interface Company {
  companyId: number;
  companyName: string;
  companyDescription: string;
  companyWebsite: string | null;
  companyLogo: string | null;
  companyIndustry: string;
  companySize: string;
  companyLocation: string;
  companyFoundedYear: number | null;
  companyEmail: string;
  companyPhone: string | null;
  companyStatus: 'active' | 'inactive';
  companyAddress: string;
  job_count: number;
  created_at: string;
  updated_at: string;
}

interface ModalData {
  type: 'delete' | 'jobs';
  companyId: number;
  companyName: string;
  data?: any[];
  title: string;
}

export default function CompaniesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingCompany, setEditingCompany] = useState<number | null>(null);
  const [modalData, setModalData] = useState<ModalData | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [creatingNew, setCreatingNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const companiesContainerRef = useRef<HTMLDivElement>(null);

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
        setError('Failed to load companies');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch companies from API
  const fetchCompanies = async () => {
    try {
      const response = await api.get('/companies');
      
      if (response.status === 200) {
        setCompanies(response.data);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      setError('Failed to load companies');
    }
  };

  // Handle create company
  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    
    try {
      const response = await api.post('/companies', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 201) {
        setSuccess('Company created successfully!');
        setCreatingNew(false);
        await fetchCompanies();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error creating company:', error);
      setError('Failed to create company');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle update company
  const handleUpdateCompany = async (e: React.FormEvent, companyId: number) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    
    try {
      const response = await api.post(`/companies/${companyId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200) {
        setSuccess('Company updated successfully!');
        setEditingCompany(null);
        await fetchCompanies();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error updating company:', error);
      setError('Failed to update company');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete company
  const handleDeleteCompany = async (companyId: number) => {
    try {
      const response = await api.delete(`/companies/${companyId}`);
      
      if (response.status === 200) {
        setSuccess('Company deleted successfully!');
        setModalData(null);
        await fetchCompanies();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error deleting company:', error);
      setError('Failed to delete company');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Show company jobs modal
  const showCompanyJobsModal = async (companyId: number, companyName: string) => {
    setModalLoading(true);
    try {
      const response = await api.get(`/companies/${companyId}/jobs`);
      const jobs = response.data.jobs || response.data || [];

      setModalData({
        type: 'jobs',
        companyId,
        companyName,
        data: jobs,
        title: `Jobs at ${companyName}`
      });
    } catch (error) {
      console.error('Error fetching company jobs:', error);
      setError('Failed to load company jobs');
    } finally {
      setModalLoading(false);
    }
  };

  // Show delete confirmation modal
  const showDeleteModal = (companyId: number, companyName: string) => {
    setModalData({
      type: 'delete',
      companyId,
      companyName,
      title: 'Delete Company'
    });
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
            ref={companiesContainerRef}
            className="flex-1 space-y-6 mt-6 max-h-[calc(100vh-4rem)] overflow-y-auto scrollbar-hide"
          >
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

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Companies</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your companies and post jobs.</p>
              </div>
              <button 
                onClick={() => setCreatingNew(true)}
                className="bg-[#00639C] text-white px-6 py-2 rounded-full hover:bg-[#005080] text-sm font-medium flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faPlus} />
                Add Company
              </button>
            </div>

            {/* Create Company Form */}
            {creatingNew && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FontAwesomeIcon icon={faBuilding} className="text-blue-600" />
                  Add New Company
                </h3>
                <CompanyForm
                  onSubmit={handleCreateCompany}
                  onCancel={() => setCreatingNew(false)}
                  submitText="Create Company"
                  submitting={submitting}
                />
              </div>
            )}

            {/* Companies List */}
            {companies.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm text-center">
                <FontAwesomeIcon icon={faBuilding} className="text-6xl text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">No companies yet.</p>
                <p className="text-gray-500 dark:text-gray-400 mb-4">Add your first company to start posting jobs!</p>
                <button 
                  onClick={() => setCreatingNew(true)}
                  className="bg-[#00639C] text-white px-4 py-2 rounded-full hover:bg-[#005080] flex items-center gap-2 mx-auto"
                >
                  <FontAwesomeIcon icon={faPlus} />
                  Add Company
                </button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {companies.map((company) => (
                  <CompanyCard
                    key={company.companyId}
                    company={company}
                    isEditing={editingCompany === company.companyId}
                    onEditStart={() => setEditingCompany(company.companyId)}
                    onEditCancel={() => setEditingCompany(null)}
                    onUpdate={handleUpdateCompany}
                    onDelete={showDeleteModal}
                    onViewJobs={showCompanyJobsModal}
                    submitting={submitting}
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

      {/* Modal */}
      {modalData && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-96 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {modalData.title}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="overflow-y-auto max-h-80 p-4">
              {modalData.type === 'delete' ? (
                <div className="text-center">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 text-4xl mb-4" />
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Are you sure you want to delete <strong>{modalData.companyName}</strong>? This action cannot be undone.
                  </p>
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={closeModal}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-2"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDeleteCompany(modalData.companyId)}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center gap-2"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                      Delete Company
                    </button>
                  </div>
                </div>
              ) : modalData.type === 'jobs' ? (
                modalLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : modalData.data && modalData.data.length === 0 ? (
                  <div className="text-center p-8 text-gray-500 dark:text-gray-400">
                    No jobs posted for this company yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {modalData.data?.map((job: any) => (
                      <div key={job.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="font-medium text-gray-900 dark:text-white">{job.title}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {job.location} • {job.type}
                        </div>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                          job.status === 'open' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        }`}>
                          {job.status}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// CompanyCard Component
function CompanyCard({ 
  company, 
  isEditing, 
  onEditStart, 
  onEditCancel, 
  onUpdate, 
  onDelete,
  onViewJobs,
  submitting 
}: {
  company: Company;
  isEditing: boolean;
  onEditStart: () => void;
  onEditCancel: () => void;
  onUpdate: (e: React.FormEvent, companyId: number) => void;
  onDelete: (companyId: number, companyName: string) => void;
  onViewJobs: (companyId: number, companyName: string) => void;
  submitting: boolean;
}) {
  const [openMenu, setOpenMenu] = useState(false);

  if (isEditing) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <CompanyForm
          company={company}
          onSubmit={(e) => onUpdate(e, company.companyId)}
          onCancel={onEditCancel}
          submitText="Update Company"
          submitting={submitting}
        />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start space-x-4 flex-1">
          <img
            src={company.companyLogo ? `${process.env.NEXT_PUBLIC_FILE_URL}/${company.companyLogo}` : '/company-avatar.png'}
            className="w-16 h-16 rounded-lg object-cover"
            alt={company.companyName}
          />
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{company.companyName}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <FontAwesomeIcon icon={faIndustry} className="text-gray-400" />
              {company.companyIndustry}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 flex items-center gap-1">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="text-gray-400" />
              {company.companyLocation}
            </p>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setOpenMenu(!openMenu)}
            className="text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white focus:outline-none p-2"
          >
            <FontAwesomeIcon icon={faEllipsisVertical} />
          </button>
          {openMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-50">
              <ul className="text-sm text-gray-700 dark:text-gray-200 divide-y divide-gray-200 dark:divide-gray-600">
                <li>
                  <button
                    onClick={() => {
                      onViewJobs(company.companyId, company.companyName);
                      setOpenMenu(false);
                    }}
                    className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left gap-3"
                  >
                    <FontAwesomeIcon icon={faEye} className="text-gray-500" />
                    View Jobs ({company.job_count ?? 0})
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      onEditStart();
                      setOpenMenu(false);
                    }}
                    className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left gap-3"
                  >
                    <FontAwesomeIcon icon={faEdit} className="text-gray-500" />
                    Edit Company
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      onDelete(company.companyId, company.companyName);
                      setOpenMenu(false);
                    }}
                    className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left text-red-600 gap-3"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                    Delete Company
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 line-clamp-2">
        {company.companyDescription}
      </p>

      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faUsers} className="text-gray-400 text-xs" />
          <div>
            <span className="text-gray-500 dark:text-gray-400">Size:</span>
            <span className="ml-1 text-gray-900 dark:text-white">{company.companySize}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400 text-xs" />
          <div>
            <span className="text-gray-500 dark:text-gray-400">Founded:</span>
            <span className="ml-1 text-gray-900 dark:text-white">
              {company.companyFoundedYear || 'N/A'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faEnvelope} className="text-gray-400 text-xs" />
          <div>
            <span className="text-gray-500 dark:text-gray-400">Email:</span>
            <span className="ml-1 text-gray-900 dark:text-white">{company.companyEmail}</span>
          </div>
        </div>
      </div>
       

      {company.companyWebsite && (
        <a 
          href={company.companyWebsite} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faGlobe} />
          {company.companyWebsite}
        </a>
      )}
<br/>
       <div className="flex items-center gap-2">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Status:</span>
            <span className={`ml-1 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              company.companyStatus === 'active'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
            }`}>
              {company.companyStatus}
            </span>
          </div>
        </div>
    </div>
  );
}

// CompanyForm Component
function CompanyForm({ 
  company, 
  onSubmit, 
  onCancel, 
  submitText,
  submitting 
}: {
  company?: Company;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitText: string;
  submitting: boolean;
}) {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set initial preview if editing existing company with logo
  useEffect(() => {
    if (company?.companyLogo) {
      setLogoPreview(`${process.env.NEXT_PUBLIC_FILE_URL}/${company.companyLogo}`);
    }
  }, [company]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4" encType="multipart/form-data">
      {/* Logo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Company Logo
        </label>
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            {logoPreview ? (
              <div className="relative">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="w-20 h-20 rounded-lg object-cover border border-gray-300"
                />
                <button
                  type="button"
                  onClick={handleRemoveLogo}
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
              name="companyLogo"
              ref={fileInputRef}
              onChange={handleLogoChange}
              accept="image/*"
              className="hidden"
              id="logo-upload"
            />
            <label
              htmlFor="logo-upload"
              className="cursor-pointer bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2 w-fit"
            >
              <FontAwesomeIcon icon={faUpload} />
              {logoPreview ? 'Change Logo' : 'Upload Logo'}
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Recommended: Square image, max 5MB
            </p>
          </div>
        </div>
      </div>

      {/* Company Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Company Name *
        </label>
        <input
          type="text"
          name="companyName"
          defaultValue={company?.companyName}
          className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm"
          required
        />
      </div>

      {/* Company Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Company Description *
        </label>
        <textarea
          name="companyDescription"
          rows={3}
          defaultValue={company?.companyDescription}
          className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm resize-none"
          required
        />
      </div>

      {/* Company Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Company Address *
        </label>
        <textarea
          name="companyAddress"
          rows={2}
          defaultValue={company?.companyAddress || ''}
          className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm resize-none"
          required
        />
      </div>

      {/* Industry with dropdown */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Industry *
        </label>
        <select
          name="companyIndustry"
          defaultValue={company?.companyIndustry || ''}
          className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm"
          required
        >
          <option value="">Select Industry</option>
          <option value="Technology">Technology</option>
          <option value="Healthcare">Healthcare</option>
          <option value="Finance">Finance & Banking</option>
          <option value="Education">Education</option>
          <option value="Manufacturing">Manufacturing</option>
          <option value="Retail">Retail & E-commerce</option>
          <option value="Real Estate">Real Estate</option>
          <option value="Hospitality">Hospitality & Tourism</option>
          <option value="Transportation">Transportation & Logistics</option>
          <option value="Energy">Energy & Utilities</option>
          <option value="Construction">Construction</option>
          <option value="Agriculture">Agriculture</option>
          <option value="Media">Media & Entertainment</option>
          <option value="Telecommunications">Telecommunications</option>
          <option value="Legal">Legal Services</option>
          <option value="Consulting">Consulting</option>
          <option value="Non-profit">Non-profit</option>
          <option value="Government">Government</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Location with Nigerian states dropdown */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          State *
        </label>
        <select
          name="companyLocation"
          defaultValue={company?.companyLocation || ''}
          className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm"
          required
        >
          <option value="">Select State</option>
          <option value="Abuja">Abuja</option>
          <option value="Abia">Abia</option>
          <option value="Adamawa">Adamawa</option>
          <option value="Akwa Ibom">Akwa Ibom</option>
          <option value="Anambra">Anambra</option>
          <option value="Bauchi">Bauchi</option>
          <option value="Bayelsa">Bayelsa</option>
          <option value="Benue">Benue</option>
          <option value="Borno">Borno</option>
          <option value="Cross River">Cross River</option>
          <option value="Delta">Delta</option>
          <option value="Ebonyi">Ebonyi</option>
          <option value="Edo">Edo</option>
          <option value="Ekiti">Ekiti</option>
          <option value="Enugu">Enugu</option>
          <option value="Gombe">Gombe</option>
          <option value="Imo">Imo</option>
          <option value="Jigawa">Jigawa</option>
          <option value="Kaduna">Kaduna</option>
          <option value="Kano">Kano</option>
          <option value="Katsina">Katsina</option>
          <option value="Kebbi">Kebbi</option>
          <option value="Kogi">Kogi</option>
          <option value="Kwara">Kwara</option>
          <option value="Lagos">Lagos</option>
          <option value="Nasarawa">Nasarawa</option>
          <option value="Niger">Niger</option>
          <option value="Ogun">Ogun</option>
          <option value="Ondo">Ondo</option>
          <option value="Osun">Osun</option>
          <option value="Oyo">Oyo</option>
          <option value="Plateau">Plateau</option>
          <option value="Rivers">Rivers</option>
          <option value="Sokoto">Sokoto</option>
          <option value="Taraba">Taraba</option>
          <option value="Yobe">Yobe</option>
          <option value="Zamfara">Zamfara</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email *
          </label>
          <input
            type="email"
            name="companyEmail"
            defaultValue={company?.companyEmail}
            className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Company Size *
          </label>
          <select
            name="companySize"
            defaultValue={company?.companySize || ''}
            className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm"
            required
          >
            <option value="">Select size</option>
            <option value="1-10">1-10 employees</option>
            <option value="11-50">11-50 employees</option>
            <option value="51-200">51-200 employees</option>
            <option value="201-500">201-500 employees</option>
            <option value="501-1000">501-1000 employees</option>
            <option value="1000+">1000+ employees</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Phone
          </label>
          <input
            type="tel"
            name="companyPhone"
            defaultValue={company?.companyPhone || ''}
            className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Website
          </label>
          <input
            type="url"
            name="companyWebsite"
            defaultValue={company?.companyWebsite || ''}
            className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm"
            placeholder="https://"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Founded Year
          </label>
          <input
            type="number"
            name="companyFoundedYear"
            defaultValue={company?.companyFoundedYear || ''}
            min="1900"
            max={new Date().getFullYear()}
            className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm"
          />
        </div>

        {company && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              name="companyStatus"
              defaultValue={company.companyStatus}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white disabled:opacity-50 flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faTimes} />
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="bg-[#00639C] text-white px-6 py-2 rounded-full hover:bg-[#005080] text-sm disabled:opacity-50 flex items-center gap-2"
        >
          {submitting ? (
            <>
              <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
              {submitText === 'Create Company' ? 'Creating...' : 'Updating...'}
            </>
          ) : (
            submitText
          )}
        </button>
      </div>
    </form>
  );
}