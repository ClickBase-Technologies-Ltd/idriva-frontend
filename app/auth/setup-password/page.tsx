'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
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

  useEffect(() => {
    const email = localStorage.getItem('pending_user_email');
    if (!email) {
      router.push('/auth/signup');
      return;
    }
    setUserEmail(email);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

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
      const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/setup-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          password: formData.password,
          password_confirmation: formData.confirmPassword,
        }),
      });

      const updateData = await updateResponse.json().catch(() => ({}));
      if (!updateResponse.ok || updateData.status !== 'success') {
        setError(updateData.message || `Failed to set password (${updateResponse.status})`);
        setIsLoading(false);
        return;
      }

      setSuccess('Password set successfully! Logging you in...');

      const loginResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: userEmail, password: formData.password }),
      });

      const loginData = await loginResponse.json().catch(() => ({}));
      if (loginResponse.ok) {
        const userData = {
          firstName: loginData.firstName,
          lastName: loginData.lastName,
          email: loginData.email,
          phoneNumber: loginData.phoneNumber,
          role: loginData.role,
          access_token: loginData.access_token,
        };
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.removeItem('pending_user_email');

        setSuccess('Login successful! Redirecting to dashboard...');
        setTimeout(() => router.push('/dashboard'), 1200);
      } else {
        setError(loginData.message || 'Auto-login failed. Please login manually.');
        localStorage.removeItem('pending_user_email');
        setTimeout(() => router.push('/auth/login'), 2500);
      }
    } catch (err) {
      console.error('Password setup failed:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const passwordStrength = () => {
    if (formData.password.length === 0) return '';
    if (formData.password.length < 6) return 'weak';
    if (formData.password.length < 8) return 'medium';
    return 'strong';
  };

  if (!userEmail) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 mt-28 lg:mt-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* LEFT: marketing */}
          <div className="flex flex-col justify-center">
            <h1 className="text-5xl lg:text-6xl font-semibold text-[#0A66C2] leading-tight mb-6">
              Welcome to iDriva
            </h1>

            <p className="text-gray-700 text-lg leading-relaxed mb-10">
              Manage your professional driver profile, track your training, connect with communities, and unlock new opportunities.
            </p>

            <div className="opacity-40 mb-10">
              <Image src="/logo.png" alt="iDriva Logo" width={180} height={180} className="object-contain" />
            </div>

            <div className="space-y-5">
              <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <span className="h-10 w-10 bg-blue-100 rounded-full" />
                <p className="font-medium text-gray-700">Track your learning and training progress easily.</p>
              </div>

              <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <span className="h-10 w-10 bg-indigo-100 rounded-full" />
                <p className="font-medium text-gray-700">Stay connected to your community and career updates.</p>
              </div>

              <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <span className="h-10 w-10 bg-green-100 rounded-full" />
                <p className="font-medium text-gray-700">Access opportunities tailored for your driver journey.</p>
              </div>
            </div>
          </div>

          {/* RIGHT: setup password card (login look & feel) */}
          <div>
            <div className="bg-white border border-gray-300 rounded-lg shadow-md p-10">
              <h2 className="text-3xl font-semibold text-gray-900 mb-2">Complete account setup</h2>
              <p className="text-gray-600 mb-6">Create a password for <strong>{userEmail}</strong></p>

              {success && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-md mb-5 flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5" />
                  {success}
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md mb-5">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Create a secure password (6+ characters)"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                      className="w-full border border-gray-400 rounded-md px-3 py-3 text-base focus:border-[#0A66C2] focus:ring-[#0A66C2]"
                    />
                    <button type="button" className="absolute right-3 top-3 text-gray-500" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* strength */}
                  {formData.password && (
                    <div className="mt-2 text-sm">
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
                        <div className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength() === 'weak' ? 'w-1/3 bg-red-500' :
                          passwordStrength() === 'medium' ? 'w-2/3 bg-yellow-500' :
                          passwordStrength() === 'strong' ? 'w-full bg-green-500' : 'w-0'
                        }`} />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                      className="w-full border border-gray-400 rounded-md px-3 py-3 text-base focus:border-[#0A66C2] focus:ring-[#0A66C2]"
                    />
                    <button type="button" className="absolute right-3 top-3 text-gray-500" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>

                  {formData.confirmPassword && (
                    <div className={`text-sm mt-2 ${formData.password === formData.confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                      {formData.password === formData.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white py-3 rounded-full text-base font-semibold transition-all shadow"
                >
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2"><ArrowPathIcon className="w-5 h-5 animate-spin" /> Setting up...</span>
                  ) : (
                    'Complete setup & sign in'
                  )}
                </button>

                <div className="flex items-center my-3">
                  <div className="flex-1 h-px bg-gray-300" />
                  <span className="px-3 text-gray-500 text-sm">or</span>
                  <div className="flex-1 h-px bg-gray-300" />
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => router.push('/auth/login')} className="flex-1 border border-gray-500 text-gray-700 hover:bg-gray-100 py-3 rounded-full text-base font-semibold">
                    Sign in
                  </button>
                  <button type="button" onClick={() => router.push('/auth/signup')} className="flex-1 border border-gray-500 text-gray-700 hover:bg-gray-100 py-3 rounded-full text-base font-semibold">
                    Create new account
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
