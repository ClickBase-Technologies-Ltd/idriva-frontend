"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  LockClosedIcon,
  IdentificationIcon,
  ArrowPathIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface SignupResponse {
  status: string;
  success: boolean;
  message?: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    otherNames?: string;
    role: string;
    phoneNumber: string;
  };
}

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status");

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [otpError, setOtpError] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    otherNames: "",
    email: "",
    phoneNumber: "",
    role: "",
  });

  const [fieldErrors, setFieldErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    role: "",
  });

  const [loadingRoles, setLoadingRoles] = useState(true);

  const [roles, setRoles] = useState<{ roleId: number; roleName: string }[]>(
    []
  );

  // Fetch roles from API
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/roles`
        );
        const data = await response.json();
        if (Array.isArray(data)) {
          setRoles(data);
        }
      } catch (error) {
        console.error("Failed to fetch roles:", error);
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchRoles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    // Clear previous field errors
    setFieldErrors({
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      role: "",
    });

    try {
      console.log("Sending signup data:", formData);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();
      console.log("Signup API response:", data);

      if (response.ok && data.status === "success") {
        console.log("Signup successful, showing OTP modal");
        // Show OTP modal and clear form
        setShowOtpModal(true);
        // Store the email before clearing the form
        setUserEmail(formData.email); // Store email separately
        setUserId(formData.email); // Use email as identifier
        setFormData({
          firstName: "",
          lastName: "",
          otherNames: "",
          email: "",
          phoneNumber: "",
          role: "",
        });
      } else {
        if (data.errors) {
          // Set field-specific errors
          const newFieldErrors = { ...fieldErrors };
          Object.keys(data.errors).forEach((field) => {
            // Map Laravel field names to your form field names
            const fieldName = field === "phoneNumber" ? "phoneNumber" : field;
            newFieldErrors[fieldName as keyof typeof newFieldErrors] =
              data.errors[field][0];
          });
          setFieldErrors(newFieldErrors);

          // Also show a general error message
          setError("Please fix the errors below and try again.");
        } else {
          setError(
            data.message || "There was an error. Please check your details."
          );
        }
      }
    } catch (error) {
      console.error("Signup error:", error);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return; // Only allow numbers

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
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
    // Verify OTP
    console.log("Verifying OTP for:", userEmail);
    const verifyResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/verify-otp`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          otp: otpString,
        }),
      }
    );

    const verifyData = await verifyResponse.json();
    console.log("OTP verification response:", verifyData);

    if (verifyResponse.ok && verifyData.status === "success") {
      // OTP verified successfully - redirect to password setup
      setOtpSuccess("Email verified! Redirecting to password setup...");
      
      // Store email in localStorage for password setup page
      localStorage.setItem('pending_user_email', userEmail);
      
      // Redirect to password setup page after a short delay
      setTimeout(() => {
        router.push('/auth/setup-password');
      }, 1500);
    } else {
      setOtpError(verifyData.message || "Invalid OTP code");
    }
  } catch (error) {
    console.error("OTP verification failed:", error);
    setOtpError("Network error. Please try again.");
  } finally {
    setOtpLoading(false);
  }
};

  const [otpSuccess, setOtpSuccess] = useState(""); // Add this line
 const handleResendOtp = async () => {
  setResendLoading(true);
  setOtpError(""); // Clear any previous errors
  setOtpSuccess(""); // Clear any previous success messages
  
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/resend-otp`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
        }),
      }
    );

    const data = await response.json();
    if (data.status === "success") {
      setOtpSuccess("OTP has been resent to your email!");
      // Clear success message after 3 seconds
      setTimeout(() => {
        setOtpSuccess("");
      }, 3000);
    } else {
      setOtpError(data.message || "Failed to resend OTP");
    }
  } catch (error) {
    setOtpError("Failed to resend OTP");
  } finally {
    setResendLoading(false);
  }
};

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError("");
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const pastedNumbers = pastedData.replace(/\D/g, "").slice(0, 6);

    if (pastedNumbers.length === 6) {
      const newOtp = pastedNumbers.split("");
      setOtp(newOtp);

      // Focus the last input
      const lastInput = document.getElementById(`otp-5`);
      lastInput?.focus();
    }
  };

  // Add onPaste to the first OTP input
  const [userEmail, setUserEmail] = useState("");
  const OtpModal = () => (
  <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl p-8 max-w-md w-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Verify Your Email
        </h2>
        <p className="text-gray-600">
          We sent a 6-digit code to <strong>{userEmail}</strong>
        </p>
      </div>

      {/* Error Message */}
      {otpError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2">
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {otpError}
        </div>
      )}

      {/* Success Message */}
      {otpSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2">
          <CheckCircleIcon className="w-4 h-4" />
          {otpSuccess}
        </div>
      )}

      <div className="flex justify-center gap-2 mb-6">
        {otp.map((digit, index) => (
          <input
            key={index}
            id={`otp-${index}`}
            type="text"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(e.target.value, index)}
            onPaste={handleOtpPaste}
            className="w-12 h-12 border-2 border-gray-300 rounded-lg text-center text-xl font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-gray-900"
          />
        ))}
      </div>

      <button
        onClick={handleOtpSubmit}
        disabled={otpLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-xl font-semibold mb-4 transition-colors"
      >
        {otpLoading ? "Verifying..." : "Verify OTP"}
      </button>

      <div className="text-center">
        <button
          onClick={handleResendOtp}
          disabled={resendLoading}
          className="text-blue-600 hover:text-blue-700 disabled:text-blue-400 font-medium flex items-center justify-center gap-2 mx-auto"
        >
          {resendLoading ? (
            <>
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
              Sending...
            </>
          ) : (
            "Resend OTP"
          )}
        </button>
      </div>
    </div>
  </div>
);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <Header />

      {/* Scrollable main content */}
      {/* <main className="flex-1 overflow-auto py-8"> */}
      <main className="flex-1 overflow-auto py-8 pt-20 pb-30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <div className="w-full max-w-2xl">
              {/* Modern Card Design */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Header Section with Gradient */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <UserIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold">
                        Join iDriva Professional Network
                      </h1>
                      <p className="text-blue-100 text-sm mt-1">
                        Start your professional driving journey today
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form Section */}
                <div className="p-8">
                  {/* Success Message */}
                  {status === "success" && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2">
                      <CheckCircleIcon className="w-5 h-5" />
                      Registration successful! Please sign in.
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label
                          htmlFor="firstName"
                          className="block text-sm font-semibold text-gray-700 flex items-center gap-2"
                        >
                          <UserIcon className="w-4 h-4 text-blue-600" />
                          First Name *
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          id="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          className="w-full border border-gray-300 rounded-xl shadow-sm px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 text-gray-900"
                          required
                          disabled={isLoading}
                          placeholder="John"
                        />
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="last_name"
                          className="block text-sm font-semibold text-gray-700 flex items-center gap-2"
                        >
                          <UserIcon className="w-4 h-4 text-blue-600" />
                          Last Name *
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          id="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          className="w-full border border-gray-300 rounded-xl shadow-sm px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 text-gray-900"
                          required
                          disabled={isLoading}
                          placeholder="Doe"
                        />
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="otherNames"
                          className="block text-sm font-semibold text-gray-700 flex items-center gap-2"
                        >
                          <UserIcon className="w-4 h-4 text-blue-600" />
                          Other Names
                        </label>
                        <input
                          type="text"
                          name="otherNames"
                          id="otherNames"
                          value={formData.otherNames}
                          onChange={handleChange}
                          className="w-full border border-gray-300 rounded-xl shadow-sm px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 text-gray-900"
                          disabled={isLoading}
                          placeholder="Middle names (optional)"
                        />
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label
                          htmlFor="email"
                          className="block text-sm font-semibold text-gray-700 flex items-center gap-2"
                        >
                          <EnvelopeIcon className="w-4 h-4 text-blue-600" />
                          Email Address *
                        </label>
                        <input
                          type="email"
                          name="email"
                          id="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full border border-gray-300 rounded-xl shadow-sm px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 text-gray-900"
                          required
                          disabled={isLoading}
                          placeholder="john.doe@example.com"
                        />
                        {fieldErrors.email && (
                          <p className="text-red-600 text-sm mt-1">
                            {fieldErrors.email}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="phone"
                          className="block text-sm font-semibold text-gray-700 flex items-center gap-2"
                        >
                          <PhoneIcon className="w-4 h-4 text-blue-600" />
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          name="phoneNumber"
                          id="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleChange}
                          className="w-full border border-gray-300 rounded-xl shadow-sm px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 text-gray-900"
                          required
                          disabled={isLoading}
                          placeholder="+234 (123) 456-7890"
                        />
                        {fieldErrors.phoneNumber && (
                          <p className="text-red-600 text-sm mt-1">
                            {fieldErrors.phoneNumber}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Security Section */}
                    {/* <div className="space-y-2">
                      <label htmlFor="password" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <LockClosedIcon className="w-4 h-4 text-blue-600" />
                        Password *
                      </label>
                      <input
                        type="password"
                        name="password"
                        id="password"
                        value={formData.password}
                        onChange={handleChange}
                        minLength={6}
                        className="w-full border border-gray-300 rounded-xl shadow-sm px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50"
                        required
                        disabled={isLoading}
                        placeholder="Create a secure password (6+ characters)"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Must be at least 6 characters long
                      </p>
                    </div> */}

                    {/* Role Selection */}
                    <div className="space-y-2">
                      <label
                        htmlFor="role"
                        className="block text-sm font-semibold text-gray-700 flex items-center gap-2"
                      >
                        <IdentificationIcon className="w-4 h-4 text-blue-600" />
                        Professional Role *
                      </label>
                      <div className="relative">
                        <select
                          name="role"
                          id="role"
                          value={formData.role}
                          onChange={handleChange}
                          className="w-full border border-gray-300 rounded-xl shadow-sm px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 appearance-none bg-white text-gray-900"
                          disabled={isLoading || loadingRoles}
                        >
                          {loadingRoles ? (
                            <option value="">Loading roles...</option>
                          ) : (
                            <>
                              <option value="">Select your role</option>
                              {roles.map((role) => (
                                <option key={role.roleId} value={role.roleId}>
                                  {role.roleName}
                                </option>
                              ))}
                            </>
                          )}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg
                            className="w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
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
                          <span>Creating Your Account...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="w-5 h-5" />
                          <span>Agree & Join iDriva</span>
                        </>
                      )}
                    </button>

                    {/* Terms and Conditions */}
                    <div className="text-center space-y-4">
                      <p className="text-xs text-gray-600 leading-relaxed">
                        By clicking "Agree & Join iDriva", you acknowledge that
                        you have read and agree to our{" "}
                        <Link
                          href="#"
                          className="text-blue-600 hover:text-blue-700 font-medium underline"
                        >
                          User Agreement
                        </Link>
                        ,{" "}
                        <Link
                          href="#"
                          className="text-blue-600 hover:text-blue-700 font-medium underline"
                        >
                          Privacy Policy
                        </Link>
                        , and{" "}
                        <Link
                          href="#"
                          className="text-blue-600 hover:text-blue-700 font-medium underline"
                        >
                          Cookie Policy
                        </Link>
                        .
                      </p>

                      <div className="pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-700">
                          Already part of our professional network?{" "}
                          <Link
                            href="/login"
                            className="text-blue-600 hover:text-blue-700 font-semibold underline hover:no-underline transition-all"
                          >
                            Sign in here
                          </Link>
                        </p>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      {showOtpModal && <OtpModal />}
      <Footer />
    </div>
  );
}
