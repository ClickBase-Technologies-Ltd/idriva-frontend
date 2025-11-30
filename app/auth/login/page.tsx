"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  EyeIcon, 
  EyeSlashIcon, 
  EnvelopeIcon, 
  LockClosedIcon, 
  ArrowPathIcon,
  CheckCircleIcon 
} from "@heroicons/react/24/outline";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface LoginResponse {
  status?: string;
  success?: boolean;
  message?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
  state?: string;
  community?: string;
  stateId?: number;
  communityId?: number;
  id?: string;
  access_token?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data: LoginResponse = await response.json();
      console.log('Login response:', data);

      if (response.ok) {
        setSuccess('Login successful! Redirecting...');
        
        // Store user data in localStorage
        const userData = {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phoneNumber: data.phoneNumber,
          role: data.role,
          access_token: data.access_token,
          state: data.state,
          community: data.community,
          stateId: data.stateId,
          communityId: data.communityId,
          id: data.id
        };

        localStorage.setItem('user', JSON.stringify(userData));
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        setError(data.message || 'Invalid credentials. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
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
    // Clear error when user starts typing
    if (error) setError("");
    if (success) setSuccess("");
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header Section with Gradient */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <LockClosedIcon className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    Welcome Back
                  </h1>
                  <p className="text-blue-100 text-sm mt-1">
                    Sign in to your iDriva account
                  </p>
                </div>
              </div>
            </div>

            {/* Form Section */}
            <div className="p-8">
              {/* Success Message */}
              {success && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5" />
                  {success}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Success Message from URL param */}
              {status === 'success' && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5" />
                  Welcome back! Please sign in to continue.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                  <label htmlFor="username" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <EnvelopeIcon className="w-4 h-4 text-blue-600" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="username"
                    id="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl shadow-sm px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 text-gray-900"
                    required
                    autoComplete="username"
                    disabled={isLoading}
                    placeholder="Enter your email address"
                  />
                </div>

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
                      className="w-full border border-gray-300 rounded-xl shadow-sm px-4 py-3 pr-11 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 text-gray-900"
                      required
                      autoComplete="current-password"
                      disabled={isLoading}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute inset-y-0 right-0 px-3 flex items-center justify-center rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="w-4 h-4 text-gray-500" />
                      ) : (
                        <EyeIcon className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Forgot Password Link */}
                <div className="text-right">
                  <Link 
                    href="/auth/reset-password" 
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Forgot your password?
                  </Link>
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
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5" />
                      <span>Sign In</span>
                    </>
                  )}
                </button>

                {/* Sign Up Link */}
                <div className="text-center pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-700">
                    Don't have an account?{" "}
                    <Link
                      href="/auth/signup"
                      className="text-blue-600 hover:text-blue-700 font-semibold underline hover:no-underline transition-all"
                    >
                      Join iDriva now
                    </Link>
                  </p>
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