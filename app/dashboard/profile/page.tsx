'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import HeaderLoggedIn from '@/components/HeaderLoggedIn';
import Sidebar from '@/components/Sidebar';
import RightbarRecruiters from '@/components/Rightbar';
import api from '@/lib/api';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faSpinner, faUpload, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';

interface User {
  id?: string;
  firstName: string;
  lastName: string;
  otherNames?: string;
  email: string;
  phoneNumber: string | null; // Keep as phoneNumber
  location?: string | null;
  bio?: string | null;
  profileImage: string | null;
  role: string;
  created_at: string;
}

interface Education {
  id: number;
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string | null;
  description: string | null;
}

interface WorkExperience {
  id: number;
  company: string;
  position: string;
  location: string | null;
  start_date: string;
  end_date: string | null;
  currently_working: boolean;
  description: string | null;
}

interface Skill {
  id: number;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [education, setEducation] = useState<Education[]>([]);
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
 
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
 
  const [activeSection, setActiveSection] = useState<'basic' | 'education' | 'experience' | 'skills'>('basic');
  const [editingEducation, setEditingEducation] = useState<number | null>(null);
  const [editingExperience, setEditingExperience] = useState<number | null>(null);
  const [editingSkill, setEditingSkill] = useState<number | null>(null);
  // Form states
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    otherNames: '',
    email: '',
    phoneNumber: '',
    location: '',
    bio: '',
    profileImage: null as File | null,
  });
  const [educationForm, setEducationForm] = useState({
    institution: '',
    degree: '',
    field_of_study: '',
    start_date: '',
    end_date: '',
    description: '',
  });
  const [experienceForm, setExperienceForm] = useState({
    company: '',
    position: '',
    location: '',
    start_date: '',
    end_date: '',
    currently_working: false,
    description: '',
  });
  const [skillForm, setSkillForm] = useState({
    name: '',
    level: 'intermediate' as 'beginner' | 'intermediate' | 'advanced' | 'expert',
  });
  // Fetch user profile data
 useEffect(() => {
  const fetchProfileData = async () => {
    try {
      setLoading(true);
     
      // Fetch all profile data
      const [biodataRes, educationRes, experienceRes, skillsRes] = await Promise.all([
        api.get('/profile/biodata'),
        api.get('/profile/education'),
        api.get('/profile/experience'),
        api.get('/profile/skills')
      ]);
      // Set user data from API
      const userData: User = biodataRes.data;
      setUser(userData);
     
      // Update form data from API response - use phoneNumber
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        otherNames: userData.otherNames || '',
        email: userData.email || '',
        phoneNumber: userData.phoneNumber || '', // Use phoneNumber
        location: userData.location || '',
        bio: userData.bio || '',
        profileImage: null,
      });
      // Set other sections from API
      setEducation(educationRes.data || []);
      setWorkExperience(experienceRes.data || []);
      setSkills(skillsRes.data || []);
    } catch (error: any) {
      console.error('Error fetching profile data:', error);
     
      // If unauthorized, redirect to login
      if (error.response?.status === 401) {
        router.push('/login');
        return;
      }
     
      setError('Failed to load profile data');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };
  fetchProfileData();
}, [router]);
const refreshProfileData = async () => {
  try {
    setLoading(true);
   
    // Fetch all profile data in parallel for better performance
    const [biodataRes, educationRes, experienceRes, skillsRes] = await Promise.all([
      api.get('/profile/biodata'),
      api.get('/profile/education'),
      api.get('/profile/experience'),
      api.get('/profile/skills')
    ]);
    // Update user state from API response
    const userData: User = biodataRes.data;
    setUser(userData);
   
    // Update form data from API - use phoneNumber as it comes from endpoint
    setFormData({
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      otherNames: userData.otherNames || '',
      email: userData.email || '',
      phoneNumber: userData.phoneNumber || '', // Keep as phoneNumber
      location: userData.location || '',
      bio: userData.bio || '',
      profileImage: null,
    });
    // Update other sections from API
    setEducation(educationRes.data || []);
    setWorkExperience(experienceRes.data || []);
    setSkills(skillsRes.data || []);
  } catch (error) {
    console.error('Error refreshing profile data:', error);
    throw error;
  } finally {
    setLoading(false);
  }
};
  // Handle basic info update
const handleBasicInfoUpdate = async (e: React.FormEvent) => {
  e.preventDefault();
  setSaving(true);
  setError('');
  setSuccess('');
  try {
    // Send formData as-is since field names match API
    const response = await api.put('/profile/biodata', formData);
   
    if (response.status === 200) {
      setSuccess('Profile updated successfully!');
     
      // Update local state with API response
      const updatedUser = response.data;
      setUser(updatedUser);
     
      // Optionally update localStorage for other components
      localStorage.setItem('user', JSON.stringify(updatedUser));
     
      setTimeout(() => setSuccess(''), 3000);
    }
  } catch (error: any) {
    console.error('Error updating profile:', error);
    setError(error.response?.data?.message || 'Failed to update profile');
    setTimeout(() => setError(''), 3000);
  } finally {
    setSaving(false);
  }
};
  // Handle profile picture upload
  // Update the handleProfilePictureUpload function
const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  // Validate file type
  if (!file.type.startsWith('image/')) {
    setError('Please upload an image file');
    setTimeout(() => setError(''), 3000);
    return;
  }
  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    setError('Image size must be less than 5MB');
    setTimeout(() => setError(''), 3000);
    return;
  }
  setUploading(true);
  setError('');
  setSuccess('');
  try {
    const formData = new FormData();
    formData.append('profileImage', file);
    const response = await api.post('/profile/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
 if (response.status === 200 || response.status === 201) {
  setSuccess('Profile picture updated successfully!');
 
  // Refetch to confirm server update
  try {
    await refreshProfileData(); // This will update user state from server
  } catch (err) {
    console.error('Failed to refresh after upload:', err);
    // Fallback to local update as before
    if (user) {
      const profileImage = response.data.profileImage || response.data.data?.profileImage;
      const updatedUser = { ...user, profileImage };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser)); // Optional: for other components
    }
  }
 
  // ... timestamp update for existing img
  setTimeout(() => setSuccess(''), 3000);
}
  } catch (error: any) {
    console.error('Error uploading profile picture:', error);
    setError(error.response?.data?.message || 'Failed to upload profile picture');
    setTimeout(() => setError(''), 3000);
  } finally {
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }
};
  // Education CRUD
  const handleAddEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
   
    try {
      const response = await api.post('/profile/education', educationForm);
     
      if (response.status === 201) {
        setEducation([...education, response.data]);
        setEducationForm({
          institution: '',
          degree: '',
          field_of_study: '',
          start_date: '',
          end_date: '',
          description: '',
        });
        setSuccess('Education added successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error adding education:', error);
      setError('Failed to add education');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSaving(false);
    }
  };
  const handleUpdateEducation = async (id: number) => {
    setSaving(true);
   
    try {
      const response = await api.put(`/profile/education/${id}`, educationForm);
     
      if (response.status === 200) {
        setEducation(education.map(edu => edu.id === id ? response.data : edu));
        setEditingEducation(null);
        setEducationForm({
          institution: '',
          degree: '',
          field_of_study: '',
          start_date: '',
          end_date: '',
          description: '',
        });
        setSuccess('Education updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error updating education:', error);
      setError('Failed to update education');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSaving(false);
    }
  };
  const handleDeleteEducation = async (id: number) => {
    if (!confirm('Are you sure you want to delete this education entry?')) return;
    try {
      const response = await api.delete(`/profile/education/${id}`);
     
      if (response.status === 200) {
        setEducation(education.filter(edu => edu.id !== id));
        setSuccess('Education deleted successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error deleting education:', error);
      setError('Failed to delete education');
      setTimeout(() => setError(''), 3000);
    }
  };
  // Work Experience CRUD
  const handleAddExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
   
    try {
      const response = await api.post('/profile/experience', experienceForm);
     
      if (response.status === 201) {
        setWorkExperience([...workExperience, response.data]);
        setExperienceForm({
          company: '',
          position: '',
          location: '',
          start_date: '',
          end_date: '',
          currently_working: false,
          description: '',
        });
        setSuccess('Work experience added successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error adding work experience:', error);
      setError('Failed to add work experience');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSaving(false);
    }
  };
  const handleUpdateExperience = async (id: number) => {
    setSaving(true);
   
    try {
      const response = await api.put(`/profile/experience/${id}`, experienceForm);
     
      if (response.status === 200) {
        setWorkExperience(workExperience.map(exp => exp.id === id ? response.data : exp));
        setEditingExperience(null);
        setExperienceForm({
          company: '',
          position: '',
          location: '',
          start_date: '',
          end_date: '',
          currently_working: false,
          description: '',
        });
        setSuccess('Work experience updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error updating work experience:', error);
      setError('Failed to update work experience');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSaving(false);
    }
  };
  const handleDeleteExperience = async (id: number) => {
    if (!confirm('Are you sure you want to delete this work experience?')) return;
    try {
      const response = await api.delete(`/profile/experience/${id}`);
     
      if (response.status === 200) {
        setWorkExperience(workExperience.filter(exp => exp.id !== id));
        setSuccess('Work experience deleted successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error deleting work experience:', error);
      setError('Failed to delete work experience');
      setTimeout(() => setError(''), 3000);
    }
  };
  // Skills CRUD
  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
   
    try {
      const response = await api.post('/profile/skills', skillForm);
     
      if (response.status === 201) {
        setSkills([...skills, response.data]);
        setSkillForm({ name: '', level: 'intermediate' });
        setSuccess('Skill added successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error adding skill:', error);
      setError('Failed to add skill');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSaving(false);
    }
  };
  const handleDeleteSkill = async (id: number) => {
    if (!confirm('Are you sure you want to delete this skill?')) return;
    try {
      const response = await api.delete(`/profile/skills/${id}`);
     
      if (response.status === 200) {
        setSkills(skills.filter(skill => skill.id !== id));
        setSuccess('Skill deleted successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error deleting skill:', error);
      setError('Failed to delete skill');
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
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading profile...</p>
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
            {/* Profile Header */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Profile Picture */}
                <div className="relative">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-700 shadow-lg">
       <img
  src={user?.profileImage
    ? `${process.env.NEXT_PUBLIC_FILE_URL}/${user.profileImage}?t=${new Date().getTime()}`
    : '/User-avatar.png'
  }
  alt={`${user?.firstName} ${user?.lastName}`}
  width={128}
  height={128}
  className="object-cover rounded-full"
  onError={(e) => {
    e.currentTarget.src = '/User-avatar.png';
  }}
/>
{/* <img
            src={company.companyLogo ? `${process.env.NEXT_PUBLIC_FILE_URL}/${user.profileImage}` : '/company-avatar.png'}
            className="w-16 h-16 rounded-lg object-cover"
            alt={company.companyName}
          /> */}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute bottom-2 right-2 bg-[#00639C] text-white p-2 rounded-full hover:bg-[#005080] disabled:opacity-50"
                  >
                    {uploading ? (
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                    ) : (
                      <FontAwesomeIcon icon={faUpload} />
                    )}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleProfilePictureUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                {/* User Info */}
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {user?.firstName} {user?.otherNames && `${user.otherNames} `}{user?.lastName}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">{user?.email}</p>
                  {user?.location && (
                    <p className="text-gray-600 dark:text-gray-400">📍 {user.location}</p>
                  )}
                  {user?.bio && (
                    <p className="mt-3 text-gray-700 dark:text-gray-300">{user.bio}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-full text-sm">
                      {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 rounded-full text-sm">
                      Member since {new Date(user?.created_at || '').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* Navigation Tabs */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveSection('basic')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeSection === 'basic'
                      ? 'bg-[#00639C] text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Basic Info
                </button>
                <button
                  onClick={() => setActiveSection('education')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeSection === 'education'
                      ? 'bg-[#00639C] text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Education
                </button>
                <button
                  onClick={() => setActiveSection('experience')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeSection === 'experience'
                      ? 'bg-[#00639C] text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Work Experience
                </button>
                <button
                  onClick={() => setActiveSection('skills')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeSection === 'skills'
                      ? 'bg-[#00639C] text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Skills
                </button>
              </div>
            </div>
            {/* Content Sections */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              {/* Basic Info Section */}
              {activeSection === 'basic' && (
                <form onSubmit={handleBasicInfoUpdate} className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Basic Information</h2>
                 
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 bg-white dark:bg-gray-900"
                        required
                      />
                    </div>
                   
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Other Names
                      </label>
                      <input
                        type="text"
                        value={formData.otherNames}
                        onChange={(e) => setFormData({...formData, otherNames: e.target.value})}
                        className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 bg-white dark:bg-gray-900"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 bg-white dark:bg-gray-900"
                        required
                      />
                    </div>
                   
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 bg-white dark:bg-gray-900"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                        className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 bg-white dark:bg-gray-900"
                      />
                    </div>
                   
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 bg-white dark:bg-gray-900"
                        placeholder="City, Country"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      rows={4}
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 bg-white dark:bg-gray-900 resize-none"
                      placeholder="Tell us about yourself..."
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formData.bio.length}/500 characters
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-[#00639C] text-white px-6 py-2 rounded-full hover:bg-[#005080] disabled:opacity-50 flex items-center"
                    >
                      {saving ? (
                        <>
                          <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </form>
              )}
              {/* Education Section */}
              {activeSection === 'education' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Education</h2>
                    <button
                      onClick={() => setEditingEducation(-1)}
                      className="bg-[#00639C] text-white px-4 py-2 rounded-full hover:bg-[#005080] text-sm flex items-center"
                    >
                      <FontAwesomeIcon icon={faPlus} className="mr-2" />
                      Add Education
                    </button>
                  </div>
                  {/* Add/Edit Education Form */}
                  {(editingEducation === -1 || editingEducation !== null) && (
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      if (editingEducation === -1) {
                        handleAddEducation(e);
                      } else {
                        handleUpdateEducation(editingEducation);
                      }
                    }} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                        {editingEducation === -1 ? 'Add New Education' : 'Edit Education'}
                      </h3>
                     
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Institution *
                            </label>
                            <input
                              type="text"
                              value={educationForm.institution}
                              onChange={(e) => setEducationForm({...educationForm, institution: e.target.value})}
                              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2"
                              required
                            />
                          </div>
                         
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Degree *
                            </label>
                            <input
                              type="text"
                              value={educationForm.degree}
                              onChange={(e) => setEducationForm({...educationForm, degree: e.target.value})}
                              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Field of Study
                          </label>
                          <input
                            type="text"
                            value={educationForm.field_of_study}
                            onChange={(e) => setEducationForm({...educationForm, field_of_study: e.target.value})}
                            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Start Date *
                            </label>
                            <input
                              type="month"
                              value={educationForm.start_date}
                              onChange={(e) => setEducationForm({...educationForm, start_date: e.target.value})}
                              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2"
                              required
                            />
                          </div>
                         
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              End Date
                            </label>
                            <input
                              type="month"
                              value={educationForm.end_date}
                              onChange={(e) => setEducationForm({...educationForm, end_date: e.target.value})}
                              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Description
                          </label>
                          <textarea
                            value={educationForm.description}
                            onChange={(e) => setEducationForm({...educationForm, description: e.target.value})}
                            rows={3}
                            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 resize-none"
                          />
                        </div>
                        <div className="flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingEducation(null);
                              setEducationForm({
                                institution: '',
                                degree: '',
                                field_of_study: '',
                                start_date: '',
                                end_date: '',
                                description: '',
                              });
                            }}
                            className="px-4 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={saving}
                            className="bg-[#00639C] text-white px-6 py-2 rounded-full hover:bg-[#005080] disabled:opacity-50"
                          >
                            {saving ? 'Saving...' : (editingEducation === -1 ? 'Add Education' : 'Update Education')}
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                  {/* Education List */}
                  <div className="space-y-4">
                    {education.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No education added yet. Add your first education entry!
                      </div>
                    ) : (
                      education.map((edu) => (
                        <div key={edu.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 dark:text-white">{edu.institution}</h3>
                              <p className="text-gray-600 dark:text-gray-400">{edu.degree}</p>
                              {edu.field_of_study && (
                                <p className="text-gray-600 dark:text-gray-400">Field: {edu.field_of_study}</p>
                              )}
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {new Date(edu.start_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} -
                                {edu.end_date
                                  ? ` ${new Date(edu.end_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
                                  : ' Present'
                                }
                              </p>
                              {edu.description && (
                                <p className="mt-2 text-gray-700 dark:text-gray-300">{edu.description}</p>
                              )}
                            </div>
                           
                            <div className="flex space-x-2 ml-4">
                              <button
                                onClick={() => {
                                  setEditingEducation(edu.id);
                                  setEducationForm({
                                    institution: edu.institution,
                                    degree: edu.degree,
                                    field_of_study: edu.field_of_study || '',
                                    start_date: edu.start_date,
                                    end_date: edu.end_date || '',
                                    description: edu.description || '',
                                  });
                                }}
                                className="text-[#00639C] hover:text-[#005080]"
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </button>
                              <button
                                onClick={() => handleDeleteEducation(edu.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
              {/* Work Experience Section */}
              {activeSection === 'experience' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Work Experience</h2>
                    <button
                      onClick={() => setEditingExperience(-1)}
                      className="bg-[#00639C] text-white px-4 py-2 rounded-full hover:bg-[#005080] text-sm flex items-center"
                    >
                      <FontAwesomeIcon icon={faPlus} className="mr-2" />
                      Add Experience
                    </button>
                  </div>
                  {/* Add/Edit Experience Form */}
                  {(editingExperience === -1 || editingExperience !== null) && (
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      if (editingExperience === -1) {
                        handleAddExperience(e);
                      } else {
                        handleUpdateExperience(editingExperience);
                      }
                    }} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                        {editingExperience === -1 ? 'Add New Work Experience' : 'Edit Work Experience'}
                      </h3>
                     
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Company *
                            </label>
                            <input
                              type="text"
                              value={experienceForm.company}
                              onChange={(e) => setExperienceForm({...experienceForm, company: e.target.value})}
                              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2"
                              required
                            />
                          </div>
                         
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Position *
                            </label>
                            <input
                              type="text"
                              value={experienceForm.position}
                              onChange={(e) => setExperienceForm({...experienceForm, position: e.target.value})}
                              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Location
                          </label>
                          <input
                            type="text"
                            value={experienceForm.location}
                            onChange={(e) => setExperienceForm({...experienceForm, location: e.target.value})}
                            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2"
                            placeholder="City, Country"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Start Date *
                            </label>
                            <input
                              type="month"
                              value={experienceForm.start_date}
                              onChange={(e) => setExperienceForm({...experienceForm, start_date: e.target.value})}
                              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2"
                              required
                            />
                          </div>
                         
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              End Date
                            </label>
                            <input
                              type="month"
                              value={experienceForm.end_date}
                              onChange={(e) => setExperienceForm({...experienceForm, end_date: e.target.value})}
                              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2"
                              disabled={experienceForm.currently_working}
                            />
                          </div>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="currently_working"
                            checked={experienceForm.currently_working}
                            onChange={(e) => {
                              setExperienceForm({
                                ...experienceForm,
                                currently_working: e.target.checked,
                                end_date: e.target.checked ? '' : experienceForm.end_date
                              });
                            }}
                            className="mr-2"
                          />
                          <label htmlFor="currently_working" className="text-sm text-gray-700 dark:text-gray-300">
                            I currently work here
                          </label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Description
                          </label>
                          <textarea
                            value={experienceForm.description}
                            onChange={(e) => setExperienceForm({...experienceForm, description: e.target.value})}
                            rows={4}
                            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 resize-none"
                            placeholder="Describe your responsibilities and achievements..."
                          />
                        </div>
                        <div className="flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingExperience(null);
                              setExperienceForm({
                                company: '',
                                position: '',
                                location: '',
                                start_date: '',
                                end_date: '',
                                currently_working: false,
                                description: '',
                              });
                            }}
                            className="px-4 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={saving}
                            className="bg-[#00639C] text-white px-6 py-2 rounded-full hover:bg-[#005080] disabled:opacity-50"
                          >
                            {saving ? 'Saving...' : (editingExperience === -1 ? 'Add Experience' : 'Update Experience')}
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                  {/* Experience List */}
                  <div className="space-y-4">
                    {workExperience.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No work experience added yet. Add your first work experience!
                      </div>
                    ) : (
                      workExperience.map((exp) => (
                        <div key={exp.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 dark:text-white">{exp.position}</h3>
                              <p className="text-gray-600 dark:text-gray-400">{exp.company}</p>
                              {exp.location && (
                                <p className="text-gray-600 dark:text-gray-400">📍 {exp.location}</p>
                              )}
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {new Date(exp.start_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} -
                                {exp.currently_working
                                  ? ' Present'
                                  : exp.end_date
                                    ? ` ${new Date(exp.end_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
                                    : ''
                                }
                              </p>
                              {exp.description && (
                                <p className="mt-2 text-gray-700 dark:text-gray-300">{exp.description}</p>
                              )}
                            </div>
                           
                            <div className="flex space-x-2 ml-4">
                              <button
                                onClick={() => {
                                  setEditingExperience(exp.id);
                                  setExperienceForm({
                                    company: exp.company,
                                    position: exp.position,
                                    location: exp.location || '',
                                    start_date: exp.start_date,
                                    end_date: exp.end_date || '',
                                    currently_working: exp.currently_working,
                                    description: exp.description || '',
                                  });
                                }}
                                className="text-[#00639C] hover:text-[#005080]"
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </button>
                              <button
                                onClick={() => handleDeleteExperience(exp.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
              {/* Skills Section */}
              {activeSection === 'skills' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Skills</h2>
                    <button
                      onClick={() => setEditingSkill(-1)}
                      className="bg-[#00639C] text-white px-4 py-2 rounded-full hover:bg-[#005080] text-sm flex items-center"
                    >
                      <FontAwesomeIcon icon={faPlus} className="mr-2" />
                      Add Skill
                    </button>
                  </div>
                  {/* Add Skill Form */}
                  {editingSkill === -1 && (
                    <form onSubmit={handleAddSkill} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Add New Skill</h3>
                     
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Skill Name *
                          </label>
                          <input
                            type="text"
                            value={skillForm.name}
                            onChange={(e) => setSkillForm({...skillForm, name: e.target.value})}
                            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Skill Level *
                          </label>
                          <select
                            value={skillForm.level}
                            onChange={(e) => setSkillForm({...skillForm, level: e.target.value as any})}
                            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2"
                          >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                            <option value="expert">Expert</option>
                          </select>
                        </div>
                        <div className="flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => setEditingSkill(null)}
                            className="px-4 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={saving}
                            className="bg-[#00639C] text-white px-6 py-2 rounded-full hover:bg-[#005080] disabled:opacity-50"
                          >
                            {saving ? 'Adding...' : 'Add Skill'}
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                  {/* Skills List */}
                  <div className="space-y-4">
                    {skills.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No skills added yet. Add your first skill!
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {skills.map((skill) => (
                          <div key={skill.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">{skill.name}</h3>
                                <span className={`text-xs px-2 py-1 rounded-full mt-1 ${
                                  skill.level === 'beginner' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                                  skill.level === 'intermediate' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                                  skill.level === 'advanced' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                                  'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                                }`}>
                                  {skill.level.charAt(0).toUpperCase() + skill.level.slice(1)}
                                </span>
                              </div>
                             
                              <button
                                onClick={() => handleDeleteSkill(skill.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
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