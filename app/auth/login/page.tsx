"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      {/* Add margin top so the header does NOT overlap the UI */}
      <main className="flex-1 mt-28 lg:mt-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16">

          {/* LEFT SECTION (LinkedIn-style but with iDriva branding) */}
          <div className="flex flex-col justify-center">

            <h1 className="text-5xl lg:text-6xl font-semibold text-[#0A66C2] leading-tight mb-6">
              Welcome to iDriva
            </h1>

            <p className="text-gray-700 text-lg leading-relaxed mb-10">
              Manage your professional driver profile, track your training, 
              connect with communities, and unlock new opportunities.
            </p>

            {/* Your Logo */}
            <div className="opacity-40 mb-10">
              <Image
                src="/logo.png"
                alt="iDriva Logo"
                width={180}
                height={180}
                className="object-contain"
              />
            </div>

            {/* Feature Cards – busy LinkedIn-style UI */}
            <div className="space-y-5">
              <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <span className="h-10 w-10 bg-blue-100 rounded-full"></span>
                <p className="font-medium text-gray-700">
                  Track your learning and training progress easily.
                </p>
              </div>

              <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <span className="h-10 w-10 bg-indigo-100 rounded-full"></span>
                <p className="font-medium text-gray-700">
                  Stay connected to your community and career updates.
                </p>
              </div>

              <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <span className="h-10 w-10 bg-green-100 rounded-full"></span>
                <p className="font-medium text-gray-700">
                  Access opportunities tailored for your driver journey.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT SECTION – login card */}
          <div>
            <div className="bg-white border border-gray-300 rounded-lg shadow-md p-10">

              <h2 className="text-3xl font-semibold text-gray-900 mb-4">
                Sign in
              </h2>
              <p className="text-gray-600 mb-8">Access your iDriva dashboard</p>

              {/* Success */}
              {(success || urlStatus === "success") && (
                <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-md mb-5 flex gap-2 items-center">
                  <CheckCircleIcon className="w-5 h-5" />
                  {success || "Signed in successfully!"}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md mb-5">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Email */}
                <input
                  type="email"
                  name="username"
                  placeholder="Email address"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  required
                  disabled={isLoading}
                  className="w-full border border-gray-400 rounded-md px-3 py-3 text-base focus:border-[#0A66C2] focus:ring-[#0A66C2]"
                />

                {/* Password */}
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                    disabled={isLoading}
                    className="w-full border border-gray-400 rounded-md px-3 py-3 text-base focus:border-[#0A66C2] focus:ring-[#0A66C2]"
                  />

                  <button
                    type="button"
                    className="absolute right-3 top-3 text-gray-500"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Forgot Password */}
                <div className="text-sm text-[#0A66C2] font-medium hover:underline text-right">
                  <Link href="/auth/reset-password">Forgot password?</Link>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white py-3 rounded-full text-base font-semibold transition-all shadow"
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                </button>

                {/* Divider */}
                <div className="flex items-center my-3">
                  <div className="flex-1 h-px bg-gray-300"></div>
                  <span className="px-3 text-gray-500 text-sm">or</span>
                  <div className="flex-1 h-px bg-gray-300"></div>
                </div>

                {/* Sign up */}
                <button
                  type="button"
                  onClick={() => router.push("/auth/signup")}
                  className="w-full border border-gray-500 text-gray-700 hover:bg-gray-100 py-3 rounded-full text-base font-semibold"
                >
                  New to iDriva? Join now
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
