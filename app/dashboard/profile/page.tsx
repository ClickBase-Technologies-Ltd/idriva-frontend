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
  coverImage: string | null;
  role: string;
  created_at: string;
}

interface Education {
  id: number;
  educationId: number;
  institutionName: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string | null;
  description: string | null;
}

interface WorkExperience {
  id: number;
  company: string;
  position: string;
  location: string | null;
  startDate: string;
  endDate: string | null;
  currently_working: boolean;
  description: string | null;
}

interface Skill {
  id: number;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

interface DriversLicense {
  id: number;
  licenseId: string;
  issueDate: string;
  expiryDate: string;
  image: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [education, setEducation] = useState<Education[]>([]);
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [driversLicense, setDriversLicense] = useState<DriversLicense | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingEducation, setEditingEducation] = useState<number | null>(null);
  const [editingExperience, setEditingExperience] = useState<number | null>(null);
  const [editingSkill, setEditingSkill] = useState<number | null>(null);
  const [editingLicense, setEditingLicense] = useState(false);
  const [activeSection, setActiveSection] = useState<'basic' | 'education' | 'experience' | 'skills' | 'drivers-license'>('basic');
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
    coverImage: null as File | null,
  });
  const [educationForm, setEducationForm] = useState({
    institutionName: '',
    degree: '',
    fieldOfStudy: '',
    startDate: '',
    endDate: '',
    description: '',
  });
  const [experienceForm, setExperienceForm] = useState({
    company: '',
    position: '',
    location: '',
    startDate: '',
    endDate: '',
    currently_working: false,
    description: '',
  });
  const [skillForm, setSkillForm] = useState({
    name: '',
    level: 'intermediate' as 'beginner' | 'intermediate' | 'advanced' | 'expert',
  });
  const [licenseForm, setLicenseForm] = useState({
    licenseId: '',
    issueDate: '',
    expiryDate: '',
    image: null as File | null,
  });

  // Initial fetch
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
     
        // Fetch all profile data
        const [biodataRes, educationRes, experienceRes, skillsRes, licenseRes] = await Promise.all([
          api.get('/profile/biodata'),
          api.get('/profile/education'),
          api.get('/profile/experience'),
          api.get('/profile/skills'),
          api.get('/profile/drivers-license')
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
          coverImage: null,
        });
       
        // Set other sections from API
        setEducation(Array.isArray(educationRes.data?.education)
          ? educationRes.data.education.map(edu => ({
              ...edu,
              id: edu.educationId // Map educationId to id for your UI
            }))
          : []);
       
        setWorkExperience(Array.isArray(experienceRes.data?.workExperience)
          ? experienceRes.data.workExperience.map(exp => ({
              ...exp,
              id: exp.workExperienceId // Map experienceId to id for your UI
            }))
          : []);
       
        setSkills(Array.isArray(skillsRes.data?.skills)
          ? skillsRes.data.skills.map(skill => ({
              ...skill,
              id: skill.skillId, // Map skillId to id for your UI
              name: skill.skillName || '', // Map skillName to name
              level: (skill.skillLevel || 'intermediate') as 'beginner' | 'intermediate' | 'advanced' | 'expert' // Map skillLevel to level
            }))
          : []);
       
        // FIX: Check for driversLicense property
        setDriversLicense(licenseRes.data?.driversLicense || null);
       
      } catch (error: any) {
        console.error('Error fetching profile data:', error);
     
        // If unauthorized, redirect to login
        if (error.response?.status === 401) {
          router.push('/');
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
      const [biodataRes, educationRes, experienceRes, skillsRes, licenseRes] = await Promise.all([
        api.get('/profile/biodata'),
        api.get('/profile/education'),
        api.get('/profile/experience'),
        api.get('/profile/skills'),
        api.get('/profile/drivers-license')
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
        coverImage: null,
      });
     
      // Update other sections from API
      setEducation(Array.isArray(educationRes.data?.education)
        ? educationRes.data.education.map(edu => ({
            ...edu,
            id: edu.educationId
          }))
        : []);
     
      setWorkExperience(Array.isArray(experienceRes.data?.workExperience)
        ? experienceRes.data.workExperience.map(exp => ({
            ...exp,
            id: exp.workExperienceId
          }))
        : []);
     
      setSkills(Array.isArray(skillsRes.data?.skills)
        ? skillsRes.data.skills.map(skill => ({
            ...skill,
            id: skill.skillId,
            name: skill.skillName || '',
            level: (skill.skillLevel || 'intermediate') as 'beginner' | 'intermediate' | 'advanced' | 'expert'
          }))
        : []);
     
      // FIX: Check for driversLicense property
      setDriversLicense(licenseRes.data?.driversLicense || null);
     
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
      const response = await api.post('/profile/biodata', formData);
   
      if (response.status === 200) {
        setSuccess('Profile updated successfully!');
     
        // Local update
        setUser(response.data);
        // setFormData({
        //   firstName: response.data.firstName || '',
        //   lastName: response.data.lastName || '',
        //   otherNames: response.data.otherNames || '',
        //   email: response.data.email || '',
        //   phoneNumber: response.data.phoneNumber || '',
        //   location: response.data.location || '',
        //   bio: response.data.bio || '',
        //   profileImage: null,
        //   coverImage: null,
        // });
        await refreshProfileData();
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
        // Local update
        const profileImage = response.data.profileImage || response.data.data?.profileImage;
        if (profileImage && user) {
          const updatedUser = { ...user, profileImage };
          setUser(updatedUser);
        }
        await refreshProfileData();
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

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
   
    setCoverUploading(true);
    setError('');
    setSuccess('');
   
    try {
      const formData = new FormData();
      formData.append('coverImage', file);
     
      console.log('Uploading cover image...'); // Debug log
     
      const response = await api.post('/profile/upload-cover-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
     
      console.log('Cover image upload response:', response.data); // Debug log
     
      if (response.status === 200 || response.status === 201) {
        setSuccess('Cover image updated successfully!');
       
        // Local update
        let coverImageUrl = '';
        if (response.data.coverImage) {
          coverImageUrl = response.data.coverImage;
        } else if (response.data.data?.coverImage) {
          coverImageUrl = response.data.data.coverImage;
        } else if (response.data.user?.coverImage) {
          coverImageUrl = response.data.user.coverImage;
        } else if (response.data.profile?.coverImage) {
          coverImageUrl = response.data.profile.coverImage;
        }
       
        console.log('Extracted cover image URL:', coverImageUrl); // Debug log
       
        if (coverImageUrl && user) {
          const updatedUser = { ...user, coverImage: coverImageUrl };
          setUser(updatedUser);
        }
       
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error: any) {
      console.error('Error uploading cover image:', error);
      console.error('Error response:', error.response?.data); // Debug log
     
      setError(error.response?.data?.message || error.response?.data?.error || 'Failed to upload cover image');
      setTimeout(() => setError(''), 3000);
    } finally {
      setCoverUploading(false);
      if (coverInputRef.current) {
        coverInputRef.current.value = '';
      }
    }
  };

  const handleEducationAction = async (action: 'add' | 'update' | 'delete', id?: number) => {
  try {
    setSaving(true);
    let response;
    
    switch(action) {
      case 'add':
        response = await api.post('/profile/education', educationForm);
        break;
      case 'update':
        response = await api.post(`/profile/education/${id}`, educationForm);
        break;
      case 'delete':
        response = await api.delete(`/profile/education/${id}`);
        break;
    }
    
    if (response?.status === 200 || response?.status === 201) {
      // Refresh from server instead of constructing locally
      await refreshProfileData();
      
      // Reset form and state
      if (action !== 'delete') {
        setEditingEducation(null);
        setEducationForm({
          institutionName: '',
          degree: '',
          fieldOfStudy: '',
          startDate: '',
          endDate: '',
          description: '',
        });
      }
      
      // Show success message
      const messages = {
        add: 'Education added successfully!',
        update: 'Education updated successfully!',
        delete: 'Education deleted successfully!'
      };
      setSuccess(messages[action]);
      setTimeout(() => setSuccess(''), 3000);
    }
  } catch (error) {
    console.error(`Error ${action}ing education:`, error);
    console.error('Error details:', error.response?.data); // Add this for debugging
    setError(`Failed to ${action} education`);
    setTimeout(() => setError(''), 3000);
  } finally {
    setSaving(false);
  }
};

  // Then update your handlers:
  const handleAddEducation = (e: React.FormEvent) => {
    e.preventDefault();
    handleEducationAction('add');
  };
  const handleUpdateEducation = (id: number) => {
    handleEducationAction('update', id);
  };
  const handleDeleteEducation = (id: number) => {
    if (confirm('Are you sure you want to delete this education entry?')) {
      handleEducationAction('delete', id);
    }
  };

const handleAddExperience = async (e: React.FormEvent) => {
  e.preventDefault();
  setSaving(true);

  try {
    const response = await api.post('/profile/experience', experienceForm);
    
    if (response.status === 201 || response.status === 200) {
      // Refresh from server instead of constructing locally
      await refreshProfileData();
      
      setEditingExperience(null);
      setExperienceForm({
        company: '',
        position: '',
        location: '',
        startDate: '',
        endDate: '',
        currently_working: false,
        description: '',
      });
      setSuccess('Work experience added successfully!');
      setTimeout(() => setSuccess(''), 3000);
    }
  } catch (error) {
    console.error('Error adding work experience:', error);
    console.error('Error details:', error.response?.data); // Add this for debugging
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
        const updatedExp = {
          ...response.data,
          id: response.data.workExperienceId
        };
        setWorkExperience(prev => prev.map(exp => exp.id === id ? updatedExp : exp));
        setEditingExperience(null);
        setExperienceForm({
          company: '',
          position: '',
          location: '',
          startDate: '',
          endDate: '',
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
        setWorkExperience(prev => prev.filter(exp => exp.id !== id));
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
 const handleSkillAction = async (action: 'add' | 'update' | 'delete', id?: number) => {
  try {
    setSaving(true);
    let response;
    
    switch(action) {
      case 'add':
        // Map form data to match API
        const apiData = {
          skillName: skillForm.name,
          skillLevel: skillForm.level
        };
        response = await api.post('/profile/skills', apiData);
        break;
      case 'update':
        // You would need to implement this if needed
        // response = await api.put(`/profile/skills/${id}`, apiData);
        break;
      case 'delete':
        response = await api.delete(`/profile/skills/${id}`);
        break;
    }
    
    if (response?.status === 200 || response?.status === 201) {
      // Instead of trying to construct from response.data, refresh from server
      await refreshProfileData();
      
      // Reset form and state
      if (action !== 'delete') {
        setEditingSkill(null);
        setSkillForm({ name: '', level: 'intermediate' });
      }
      
      // Show success message
      const messages = {
        add: 'Skill added successfully!',
        update: 'Skill updated successfully!',
        delete: 'Skill deleted successfully!'
      };
      setSuccess(messages[action]);
      setTimeout(() => setSuccess(''), 3000);
    }
  } catch (error) {
    console.error(`Error ${action}ing skill:`, error);
    console.error('Error details:', error.response?.data); // Add this for debugging
    setError(`Failed to ${action} skill`);
    setTimeout(() => setError(''), 3000);
  } finally {
    setSaving(false);
  }
};
 // Then update your handlers:
  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    handleSkillAction('add');
  };
  const handleDeleteSkill = (id: number) => {
    if (confirm('Are you sure you want to delete this skill?')) {
      handleSkillAction('delete', id);
    }
  };

  // Drivers License handlers
  const handleLicenseImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setLicenseForm(prev => ({ ...prev, image: file }));
  };
  const handleAddLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    if (!licenseForm.licenseId || !licenseForm.issueDate || !licenseForm.expiryDate) {
      setError('All fields are required');
      setSaving(false);
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (!licenseForm.image) {
      setError('License image is required');
      setSaving(false);
      setTimeout(() => setError(''), 3000);
      return;
    }
    try {
      const formData = new FormData();
      formData.append('licenseId', licenseForm.licenseId);
      formData.append('issueDate', licenseForm.issueDate);
      formData.append('expiryDate', licenseForm.expiryDate);
      formData.append('image', licenseForm.image);
      const response = await api.post('/profile/drivers-license', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.status === 201 || response.status === 200) {
        // Local update
        setDriversLicense(response.data);
        await refreshProfileData();
        // setLicenseForm({
        //   licenseId: '',
        //   issueDate: '',
        //   expiryDate: '',
        //   image: null,
        // });
        setEditingLicense(false);
        setSuccess('Drivers license added successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error: any) {
      console.error('Error adding drivers license:', error);
      setError(error.response?.data?.message || 'Failed to add drivers license');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSaving(false);
    }
  };
  const handleUpdateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    if (!licenseForm.licenseId || !licenseForm.issueDate || !licenseForm.expiryDate) {
      setError('License ID, issue date, and expiry date are required');
      setSaving(false);
      setTimeout(() => setError(''), 3000);
      return;
    }
    try {
      const formData = new FormData();
      formData.append('licenseId', licenseForm.licenseId);
      formData.append('issueDate', licenseForm.issueDate);
      formData.append('expiryDate', licenseForm.expiryDate);
      if (licenseForm.image) {
        formData.append('image', licenseForm.image);
      }
      const response = await api.put(`/profile/drivers-license/${driversLicense?.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.status === 200) {
        // Local update
        setDriversLicense(response.data);
        setLicenseForm(prev => ({ ...prev, image: null }));
        setEditingLicense(false);
        setSuccess('Drivers license updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error: any) {
      console.error('Error updating drivers license:', error);
      setError(error.response?.data?.message || 'Failed to update drivers license');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSaving(false);
    }
  };
  const handleDeleteLicense = async () => {
    if (!confirm('Are you sure you want to delete your drivers license?')) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await api.delete(`/profile/drivers-license/${driversLicense?.id}`);
      if (response.status === 200) {
        // Local update
        setDriversLicense(null);
        setSuccess('Drivers license deleted successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error: any) {
      console.error('Error deleting drivers license:', error);
      setError(error.response?.data?.message || 'Failed to delete drivers license');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSaving(false);
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
            {/* Profile Header */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              {/* Cover Image */}
              <div className="relative mb-6">
                <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                  <img
                    src={user?.coverImage
                      ? `${process.env.NEXT_PUBLIC_FILE_URL}/${user.coverImage}?t=${new Date().getTime()}`
                      : '/cover_photo.jpg'
                    }
                    alt="Cover Image"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/cover_photo.jpg';
                    }}
                  />
                </div>
                <button
                  onClick={() => coverInputRef.current?.click()}
                  disabled={coverUploading}
                  className="absolute top-2 right-2 bg-[#00639C] text-white p-2 rounded-full hover:bg-[#005080] disabled:opacity-50 z-10"
                >
                  {coverUploading ? (
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                  ) : (
                    <FontAwesomeIcon icon={faUpload} />
                  )}
                </button>
                <input
                  type="file"
                  ref={coverInputRef}
                  onChange={handleCoverImageUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
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
                <button
                  onClick={() => setActiveSection('drivers-license')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeSection === 'drivers-license'
                      ? 'bg-[#00639C] text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Drivers License
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
                              institutionName *
                            </label>
                            <input
                              type="text"
                              value={educationForm.institutionName}
                              onChange={(e) => setEducationForm({...educationForm, institutionName: e.target.value})}
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
                            value={educationForm.fieldOfStudy}
                            onChange={(e) => setEducationForm({...educationForm, fieldOfStudy: e.target.value})}
                            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Start Date *
                            </label>
                            <input
                              type="date"
                              value={educationForm.startDate}
                              onChange={(e) => setEducationForm({...educationForm, startDate: e.target.value})}
                              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2"
                              required
                            />
                          </div>
                       
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              End Date
                            </label>
                            <input
                              type="date"
                              value={educationForm.endDate}
                              onChange={(e) => setEducationForm({...educationForm, endDate: e.target.value})}
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
                                institutionName: '',
                                degree: '',
                                fieldOfStudy: '',
                                startDate: '',
                                endDate: '',
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
                              <h3 className="font-semibold text-gray-900 dark:text-white">{edu.institutionName}</h3>
                              <p className="text-gray-600 dark:text-gray-400">{edu.degree}</p>
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
                                <p className="mt-2 text-gray-700 dark:text-gray-300">{edu.description}</p>
                              )}
                            </div>
                         
                            <div className="flex space-x-2 ml-4">
                              <button
                                onClick={() => {
                                  setEditingEducation(edu.id);
                                  setEducationForm({
                                    institutionName: edu.institutionName,
                                    degree: edu.degree,
                                    fieldOfStudy: edu.fieldOfStudy || '',
                                    startDate: edu.startDate,
                                    endDate: edu.endDate || '',
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
                              type="date"
                              value={experienceForm.startDate}
                              onChange={(e) => setExperienceForm({...experienceForm, startDate: e.target.value})}
                              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2"
                              required
                            />
                          </div>
                       
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              End Date
                            </label>
                            <input
                              type="date"
                              value={experienceForm.endDate}
                              onChange={(e) => setExperienceForm({...experienceForm, endDate: e.target.value})}
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
                                endDate: e.target.checked ? '' : experienceForm.endDate
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
                                startDate: '',
                                endDate: '',
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
                                {new Date(exp.startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} -
                                {exp.currently_working
                                  ? ' Present'
                                  : exp.endDate
                                    ? ` ${new Date(exp.endDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
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
                                    startDate: exp.startDate,
                                    endDate: exp.endDate || '',
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
                                  {skill?.level?.charAt(0).toUpperCase() + skill?.level?.slice(1)}
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
              {/* Drivers License Section */}
              {activeSection === 'drivers-license' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Drivers License</h2>
                  </div>
                  {editingLicense ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (driversLicense) {
                          handleUpdateLicense(e);
                        } else {
                          handleAddLicense(e);
                        }
                      }}
                      className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6"
                    >
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                        {driversLicense ? 'Edit Drivers License' : 'Add Drivers License'}
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            License ID {!driversLicense && '*'}
                          </label>
                          <input
                            type="text"
                            value={licenseForm.licenseId}
                            onChange={(e) =>
                              setLicenseForm({ ...licenseForm, licenseId: e.target.value })
                            }
                            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 bg-white dark:bg-gray-900"
                            required={!!driversLicense}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Issue Date {!driversLicense && '*'}
                            </label>
                            <input
                              type="date"
                              value={licenseForm.issueDate}
                              onChange={(e) =>
                                setLicenseForm({ ...licenseForm, issueDate: e.target.value })
                              }
                              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 bg-white dark:bg-gray-900"
                              required={!!driversLicense}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Expiry Date {!driversLicense && '*'}
                            </label>
                            <input
                              type="date"
                              value={licenseForm.expiryDate}
                              onChange={(e) =>
                                setLicenseForm({ ...licenseForm, expiryDate: e.target.value })
                              }
                              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 bg-white dark:bg-gray-900"
                              required={!!driversLicense}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            License Image {driversLicense ? '(Optional)' : '*'}
                          </label>
                          <input
                            type="file"
                            onChange={handleLicenseImageChange}
                            accept="image/*"
                            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 bg-white dark:bg-gray-900"
                          />
                          {licenseForm.image && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              Selected: {licenseForm.image.name}
                            </p>
                          )}
                        </div>
                        <div className="flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingLicense(false);
                              setLicenseForm({
                                licenseId: driversLicense?.licenseId || '',
                                issueDate: driversLicense?.issueDate || '',
                                expiryDate: driversLicense?.expiryDate || '',
                                image: null,
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
                            {saving ? (
                              <>
                                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                                Saving...
                              </>
                            ) : (
                              driversLicense ? 'Update License' : 'Add License'
                            )}
                          </button>
                        </div>
                      </div>
                    </form>
                  ) : driversLicense ? (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">License ID: {driversLicense.licenseId}</h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-1">
                            Issue Date: {new Date(driversLicense.issueDate).toLocaleDateString('en-US')}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400">
                            Expiry Date: {new Date(driversLicense.expiryDate).toLocaleDateString('en-US')}
                          </p>
                        </div>
                        {driversLicense.image && (
                          <div className="flex-shrink-0">
                            <Image
                              src={`${process.env.NEXT_PUBLIC_FILE_URL}/${driversLicense.image}?t=${new Date().getTime()}`}
                              alt="Drivers License"
                              width={200}
                              height={120}
                              className="rounded-lg object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder.jpg';
                              }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2 mt-4">
                        <button
                          onClick={() => {
                            setEditingLicense(true);
                            setLicenseForm({
                              licenseId: driversLicense.licenseId,
                              issueDate: driversLicense.issueDate,
                              expiryDate: driversLicense.expiryDate,
                              image: null,
                            });
                          }}
                          className="text-[#00639C] hover:text-[#005080] p-2"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          onClick={handleDeleteLicense}
                          className="text-red-600 hover:text-red-800 p-2"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <p className="mb-4">No drivers license added yet.</p>
                      <button
                        onClick={() => {
                          setEditingLicense(true);
                          setLicenseForm({
                            licenseId: '',
                            issueDate: '',
                            expiryDate: '',
                            image: null,
                          });
                        }}
                        className="bg-[#00639C] text-white px-6 py-2 rounded-full hover:bg-[#005080] text-sm"
                      >
                        <FontAwesomeIcon icon={faPlus} className="mr-2" />
                        Add Drivers License
                      </button>
                    </div>
                  )}
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