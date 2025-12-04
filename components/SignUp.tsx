"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  IdentificationIcon,
  ArrowPathIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowsRotate } from "@fortawesome/free-solid-svg-icons";

interface SignupResponse {
  status?: string;
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  user?: {
    id?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    phoneNumber?: string;
  };
}

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlStatus = searchParams.get("status");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    role: "",
  });

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    otherNames: "",
    email: "",
    phoneNumber: "",
    role: "",
  });

  const [roles, setRoles] = useState<{ roleId: number; roleName: string }[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  // OTP modal state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/roles`);
        const data = await res.json().catch(() => []);
        if (Array.isArray(data)) setRoles(data);
      } catch (e) {
        console.error("Failed to fetch roles", e);
      } finally {
        setLoadingRoles(false);
      }
    };
    fetchRoles();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
    setFieldErrors(prev => ({ ...prev, [e.target.name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setFieldErrors({ firstName: "", lastName: "", email: "", phoneNumber: "", role: "" });

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data: SignupResponse = await res.json().catch(() => ({}));
      if (res.ok && data.status === "success") {
        // show OTP modal
        setUserEmail(formData.email);
        setShowOtpModal(true);
        setFormData({ firstName: "", lastName: "", otherNames: "", email: "", phoneNumber: "", role: "" });
      } else {
        if (data.errors) {
          const newFieldErrors = { ...fieldErrors };
          Object.keys(data.errors).forEach(key => {
            const mapped = key === "phoneNumber" ? "phoneNumber" : key;
            newFieldErrors[mapped as keyof typeof newFieldErrors] = data.errors![key][0];
          });
          setFieldErrors(newFieldErrors);
          setError("Please fix the errors below and try again.");
        } else {
          setError(data.message || "There was an error. Please check your details.");
        }
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement | null;
      nextInput?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      const last = document.getElementById(`otp-5`) as HTMLInputElement | null;
      last?.focus();
    }
  };

  const handleOtpSubmit = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setOtpError("Please enter complete OTP code");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, otp: otpString }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.status === "success") {
        setOtpSuccess("Email verified! Redirecting to password setup...");
        localStorage.setItem("pending_user_email", userEmail);
        setTimeout(() => router.push("/auth/setup-password"), 1200);
      } else {
        setOtpError(data.message || "Invalid OTP code");
      }
    } catch (err) {
      console.error("OTP verify error", err);
      setOtpError("Network error. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setOtpError("");
    setOtpSuccess("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.status === "success") {
        setOtpSuccess("OTP has been resent to your email!");
        setTimeout(() => setOtpSuccess(""), 3000);
      } else {
        setOtpError(data.message || "Failed to resend OTP");
      }
    } catch (e) {
      setOtpError("Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  const OtpModal = () => (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Verify Your Email</h2>
          <p className="text-gray-600">We sent a 6-digit code to <strong>{userEmail}</strong></p>
        </div>

        {otpError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">{otpError}</div>}
        {otpSuccess && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm mb-4">{otpSuccess}</div>}

        <div className="flex justify-center gap-2 mb-6">
          {otp.map((digit, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(e.target.value, i)}
              onPaste={i === 0 ? handleOtpPaste : undefined}
              className="w-12 h-12 border-2 border-gray-300 rounded-lg text-center text-xl font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-gray-900"
            />
          ))}
        </div>

        <button onClick={handleOtpSubmit} disabled={otpLoading} className="w-full bg-[#0A66C2] hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-xl font-semibold mb-4">
          {otpLoading ? "Verifying..." : "Verify OTP"}
        </button>

        <div className="text-center">
          <button onClick={handleResendOtp} disabled={resendLoading} className="text-[#0A66C2] hover:text-blue-700 disabled:text-blue-400 font-medium">
            {resendLoading ? "Sending..." : "Resend OTP"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 mt-28 lg:mt-32 pb-30">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* LEFT - marketing */}
          <div className="flex flex-col justify-center">
            <h1 className="text-5xl lg:text-6xl font-semibold text-[#0A66C2] leading-tight mb-6">Welcome to iDriva</h1>
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

          {/* RIGHT - signup card */}
          <div>
            <div className="bg-white border border-gray-300 rounded-lg shadow-md p-10">
              <h2 className="text-3xl font-semibold text-gray-900 mb-2">Create your account</h2>
              <p className="text-gray-600 mb-6">Join iDriva professional network</p>

              {(urlStatus === "success") && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-md mb-5 flex gap-2 items-center">
                  <CheckCircleIcon className="w-5 h-5" />
                  Registration successful! Please sign in.
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md mb-5">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-[#0A66C2]" /> First Name *
                    </label>
                    <input name="firstName" value={formData.firstName} onChange={handleChange} required disabled={isLoading} className="w-full border border-gray-400 rounded-md px-3 py-3 text-base" placeholder="John" />
                    {fieldErrors.firstName && <p className="text-red-600 text-sm mt-1">{fieldErrors.firstName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-[#0A66C2]" /> Last Name *
                    </label>
                    <input name="lastName" value={formData.lastName} onChange={handleChange} required disabled={isLoading} className="w-full border border-gray-400 rounded-md px-3 py-3 text-base" placeholder="Doe" />
                    {fieldErrors.lastName && <p className="text-red-600 text-sm mt-1">{fieldErrors.lastName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-[#0A66C2]" /> Other Names
                    </label>
                    <input name="otherNames" value={formData.otherNames} onChange={handleChange} disabled={isLoading} className="w-full border border-gray-400 rounded-md px-3 py-3 text-base" placeholder="Middle names (optional)" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                      <EnvelopeIcon className="w-4 h-4 text-[#0A66C2]" /> Email Address *
                    </label>
                    <input name="email" type="email" value={formData.email} onChange={handleChange} required disabled={isLoading} className="w-full border border-gray-400 rounded-md px-3 py-3 text-base" placeholder="john.doe@example.com" />
                    {fieldErrors.email && <p className="text-red-600 text-sm mt-1">{fieldErrors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                      <PhoneIcon className="w-4 h-4 text-[#0A66C2]" /> Phone Number *
                    </label>
                    <input name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleChange} required disabled={isLoading} className="w-full border border-gray-400 rounded-md px-3 py-3 text-base" placeholder="+234 (123) 456-7890" />
                    {fieldErrors.phoneNumber && <p className="text-red-600 text-sm mt-1">{fieldErrors.phoneNumber}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                    <IdentificationIcon className="w-4 h-4 text-[#0A66C2]" /> Professional Role *
                  </label>
                  <select name="role" value={formData.role} onChange={handleChange} disabled={isLoading || loadingRoles} className="w-full border border-gray-400 rounded-md px-3 py-3 text-base bg-white">
                    {loadingRoles ? <option>Loading roles...</option> : <>
                      <option value="">Select your role</option>
                      {roles.map(r => <option key={r.roleId} value={r.roleId}>{r.roleName}</option>)}
                    </>}
                  </select>
                  {fieldErrors.role && <p className="text-red-600 text-sm mt-1">{fieldErrors.role}</p>}
                </div>

               

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white py-3 rounded-full text-base font-semibold transition-all shadow cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <FontAwesomeIcon icon={faArrowsRotate} className="animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Agree & Join iDriva"
                  )}
                </button>

                <div className="flex items-center my-3">
                  <div className="flex-1 h-px bg-gray-300" />
                  <span className="px-3 text-gray-500 text-sm">or</span>
                  <div className="flex-1 h-px bg-gray-300" />
                </div>

                <button type="button" onClick={() => router.push("/auth/login")} className="w-full border border-gray-500 text-gray-700 hover:bg-gray-100 py-3 rounded-full text-base font-semibold cursor-pointer disabled:cursor-not-allowed">
                  Have an account? Sign in
                </button>

               
              </form>
            </div>
          </div>
        </div>
      </main>

      {showOtpModal && <OtpModal />}
      <Footer />
    </div>
  );
}
