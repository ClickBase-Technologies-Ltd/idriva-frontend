"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import {
  CheckBadgeIcon,
  ArrowRightIcon,
  ArrowPathIcon,
} from "@heroicons/react/20/solid";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowsRotate } from "@fortawesome/free-solid-svg-icons";

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
  const urlStatus = searchParams.get("status");

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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/signin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(formData),
        }
      );

      const data: LoginResponse = await response.json();

      if (response.ok) {
        setSuccess("Login successful! Redirecting...");

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
          id: data.id,
        };

        localStorage.setItem("user", JSON.stringify(userData));

        setTimeout(() => {
          router.push("/dashboard");
        }, 1200);
      } else {
        setError(data.message || "Invalid credentials. Please try again.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <Header />

      {/* Hero Section with gradient background */}
      <main className="flex-1 mt-28 lg:mt-32 pb-30">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          
          {/* LEFT SECTION - Enhanced with visual elements */}
          <div className="flex flex-col justify-center relative">
            {/* Decorative elements */}
            <div className="absolute -top-6 -left-6 w-24 h-24 bg-blue-100 rounded-full opacity-30 blur-xl"></div>
            <div className="absolute bottom-10 right-10 w-32 h-32 bg-indigo-100 rounded-full opacity-20 blur-xl"></div>
            
            {/* Main heading with improved typography */}
            <div className="relative mb-2">
              <h2 className="text-5xl lg:text-6xl font-bold text-[#0A66C2]  mb-4">
                Welcome to iDriva
              </h2>
              <div className="w-32 h-1.5 bg-gradient-to-r from-[#0A66C2] to-blue-400 rounded-full mb-6"></div>
              
              <p className="text-gray-700 text-lg leading-relaxed max-w-xl">
                Manage your professional driver profile, track training progress, 
                connect with communities, and unlock new opportunities—all in one place.
              </p>
            </div>

            {/* Feature Cards - Enhanced with icons and hover effects */}
            <div className="space-y-1 mt-10">

              <div className="flex items-center gap-4 bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:border-blue-100 group">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <ChartBarIcon className="w-6 h-6 text-[#0A66C2]" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">
                    Track your learning and training progress with detailed analytics
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:border-indigo-100 group">
                <div className="flex-shrink-0 w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                  <ShieldCheckIcon className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">
                    Stay connected to your community and receive important career updates
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:border-green-100 group">
                <div className="flex-shrink-0 w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors">
                  <UserCircleIcon className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">
                    Access exclusive opportunities tailored for your driver journey
                  </p>
                </div>
              </div>
            </div>

            {/* Trust indicator */}
            <div className="mt-10 flex items-center gap-3 text-gray-600">
              <CheckBadgeIcon className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium">Trusted by thousands of professional drivers</span>
            </div>
          </div>

          {/* RIGHT SECTION - Enhanced login card */}
          <div className="relative">
            {/* Card with subtle shadow and improved spacing */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 lg:p-10 relative overflow-hidden">
              {/* Decorative corner */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#0A66C2]/5 to-transparent rounded-bl-full"></div>
              
              {/* Header section */}
              <div className="mb-8 relative">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome Back
                </h2>
                <p className="text-gray-600">Sign in to access your iDriva dashboard</p>
                <div className="w-16 h-1 bg-[#0A66C2] rounded-full mt-3"></div>
              </div>

              {/* Status Messages */}
              {(success || urlStatus === "success") && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-800 p-4 rounded-xl mb-6 flex items-center gap-3 shadow-sm">
                  <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{success || "Signed in successfully!"}</span>
                </div>
              )}

              {error && (
                <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 text-red-800 p-4 rounded-xl mb-6 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="username"
                      placeholder="you@example.com"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      required
                      disabled={isLoading}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3.5 text-base focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/20 focus:outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Password Input */}
               <div className="space-y-1 mb-0">  
                  <div className="flex justify-between items-center mb-0">
                    <label className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                  </div>
                  <div className="relative" >
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                      disabled={isLoading}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3.5 text-base focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/20 focus:outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed pr-12"
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Forgot Password */}
  <div className="text-right mt-0 space-y-1">
    <Link
      href="/auth/reset-password"
      className="text-sm font-medium text-[#0A66C2] hover:text-[#004182] hover:underline"
    >
      Forgot password?
    </Link>
  </div>


                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white py-4 rounded-xl text-base font-semibold transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-70 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
                >
                  {isLoading ? (
                    <>
                      <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign in</span>
                      <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">or continue with</span>
                  </div>
                </div>

                {/* Sign Up Link */}
                <div className="text-center">
                  <p className="text-gray-600 mb-0 space-y-1">New to iDriva?</p>
                  
                  <Link
                    href="/auth/signup"
                    className="inline-flex items-center justify-center w-full border-2 border-gray-300 hover:border-[#0A66C2] text-gray-800 hover:text-[#0A66C2] font-semibold py-3.5 px-4 rounded-xl text-base transition-all duration-300 hover:bg-blue-50 group"
                  >
                    Create your account
                    <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </form>
            </div>

            {/* Footer note */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                By signing in, you agree to our{" "}
                <Link href="/terms" className="text-[#0A66C2] hover:underline font-medium">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-[#0A66C2] hover:underline font-medium">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}