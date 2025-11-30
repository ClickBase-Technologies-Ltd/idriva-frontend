'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LockClosedIcon, EyeIcon, EyeSlashIcon, CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function SetupPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  // Get email from localStorage on component mount
  useEffect(() => {
    const email = localStorage.getItem('pending_user_email');
    if (!email) {
      router.push('/signup');
      return;
    }
    setUserEmail(email);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Validate passwords
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      // Step 1: Update password
      const updateResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/setup-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: userEmail,
            password: formData.password,
            password_confirmation: formData.confirmPassword, 
          }),
        }
      );

      const updateData = await updateResponse.json();
      console.log('Password setup response:', updateData);

      if (!updateResponse.ok || updateData.status !== 'success') {
        setError(updateData.message || 'Failed to set password');
        setIsLoading(false);
        return;
      }

      // Step 2: Auto-login after password setup
      setSuccess('Password set successfully! Logging you in...');
      
      const loginResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/signin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            username: userEmail,
            password: formData.password,
          }),
        }
      );

      const loginData = await loginResponse.json();
      console.log('Auto-login response:', loginData);

      if (loginResponse.ok) {
        // Store user data in localStorage
        const userData = {
          firstName: loginData.firstName,
          lastName: loginData.lastName,
          email: loginData.email,
          phoneNumber: loginData.phoneNumber,
          role: loginData.role,
          access_token: loginData.access_token,
          
        };

        localStorage.setItem('user', JSON.stringify(userData));
        
        // Clear pending user email
        localStorage.removeItem('pending_user_email');
        
        setSuccess('Login successful! Redirecting to dashboard...');
        
        // Redirect to dashboard
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        setError(loginData.message || 'Auto-login failed. Please login manually.');
        // Still clear the pending email and redirect to login
        localStorage.removeItem('pending_user_email');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch (error) {
      console.error('Password setup failed:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError('');
  };

  const passwordStrength = () => {
    if (formData.password.length === 0) return '';
    if (formData.password.length < 6) return 'weak';
    if (formData.password.length < 8) return 'medium';
    return 'strong';
  };

  const getPasswordStrengthColor = () => {
    const strength = passwordStrength();
    switch (strength) {
      case 'weak': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'strong': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  if (!userEmail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-8 pt-20 pb-30">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <LockClosedIcon className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    Set Your Password
                  </h1>
                  <p className="text-blue-100 text-sm mt-1">
                    Create a secure password for your account
                  </p>
                </div>
              </div>
            </div>

            {/* Form Section */}
            <div className="p-8">
              {success && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5" />
                  {success}
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              <p className="text-sm text-gray-600 mb-6">
                Welcome! Please create a secure password for <strong>{userEmail}</strong>
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Password Field */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <LockClosedIcon className="w-4 h-4 text-blue-600" />
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      id="password"
                      value={formData.password}
                      onChange={handleChange}
                      minLength={6}
                      className="w-full border border-gray-300 rounded-xl shadow-sm px-4 py-3 pr-11 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 text-gray-900"
                      required
                      disabled={isLoading}
                      placeholder="Create a secure password (6+ characters)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 px-3 flex items-center justify-center rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="w-4 h-4 text-gray-500" />
                      ) : (
                        <EyeIcon className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>Password strength:</span>
                        <span className={`font-medium ${
                          passwordStrength() === 'weak' ? 'text-red-600' :
                          passwordStrength() === 'medium' ? 'text-yellow-600' :
                          passwordStrength() === 'strong' ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {passwordStrength() ? passwordStrength().charAt(0).toUpperCase() + passwordStrength().slice(1) : ''}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            passwordStrength() === 'weak' ? 'w-1/3 bg-red-500' :
                            passwordStrength() === 'medium' ? 'w-2/3 bg-yellow-500' :
                            passwordStrength() === 'strong' ? 'w-full bg-green-500' : 'w-0'
                          }`}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <LockClosedIcon className="w-4 h-4 text-blue-600" />
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      id="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      minLength={6}
                      className="w-full border border-gray-300 rounded-xl shadow-sm px-4 py-3 pr-11 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 text-gray-900"
                      required
                      disabled={isLoading}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 px-3 flex items-center justify-center rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="w-4 h-4 text-gray-500" />
                      ) : (
                        <EyeIcon className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                  
                  {/* Password Match Indicator */}
                  {formData.confirmPassword && (
                    <div className={`text-xs mt-1 ${
                      formData.password === formData.confirmPassword ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formData.password === formData.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 disabled:from-gray-400 disabled:to-gray-500 text-white py-4 rounded-xl text-base font-semibold tracking-wide flex items-center justify-center gap-3 transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 shadow-lg hover:shadow-xl disabled:shadow"
                >
                  {isLoading ? (
                    <>
                      <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      <span>Setting up account...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5" />
                      <span>Complete Setup & Login</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}