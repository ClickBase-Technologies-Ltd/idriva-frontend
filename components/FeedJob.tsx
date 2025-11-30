"use client";

import api from "@/lib/api";
import { getRole } from "@/lib/auth";
import { faSpinner, faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState, useEffect } from "react";

export default function FeedJob({ job }) {
  if (!job) return null;
  const role = getRole();

  const [applying, setApplying] = useState(false);
  const [checkingApplication, setCheckingApplication] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [resume, setResume] = useState(null);

  // Check if user has already applied to this job
  useEffect(() => {
    const checkApplicationStatus = async () => {
      if (role !== 'Driver' || !job.jobId) return;
      
      setCheckingApplication(true);
      try {
        const response = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/jobs/${job.jobId}/application-status`);
        // Assuming the API returns { hasApplied: true/false } or the application object
        setHasApplied(response.data.hasApplied || response.data.application !== null);
      } catch (error) {
        console.error('Error checking application status:', error);
        // If endpoint doesn't exist or returns error, assume not applied
        setHasApplied(false);
      } finally {
        setCheckingApplication(false);
      }
    };

    checkApplicationStatus();
  }, [job.jobId, role]);

  const handleApplyClick = () => {
    setShowApplicationForm(true);
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    setApplying(true);
    
    const formData = new FormData();
    formData.append('coverLetter', coverLetter);
    formData.append('applicationStatus', 'pending');
    formData.append('jobId', job.jobId);
    
    if (resume) {
      formData.append('resume', resume);
    }

    try {
      await api.post(`${process.env.NEXT_PUBLIC_API_URL}/jobs/${job.jobId}/apply`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('Application submitted successfully!');
      setHasApplied(true); // Update state to reflect application
      setShowApplicationForm(false);
      setCoverLetter("");
      setResume(null);
    } catch (error) {
      console.error('Error applying to job:', error);
      alert('Failed to apply to job. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  const handleCancelApplication = () => {
    setShowApplicationForm(false);
    setCoverLetter("");
    setResume(null);
  };

  // If still checking application status, show loading
//   if (checkingApplication) {
//     return (
//       <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm break-words">
//         <div className="flex items-center justify-center py-4">
//           <FontAwesomeIcon icon={faSpinner} className="animate-spin text-gray-400" />
//           <span className="ml-2 text-sm text-gray-500">Checking application status...</span>
//         </div>
//       </div>
//     );
//   }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm break-words">
      {/* Company + Timestamp */}
      <div className="flex items-start mb-3">
        <img
          src={`${process.env.NEXT_PUBLIC_FILE_URL}/${job.companyLogo || '/company-avatar.png'}`}
          className="w-10 h-10 rounded-full object-cover mr-3"
          alt={job.companyName || "Company"}
        />

        <div>
          <p className="font-semibold text-sm">{job.companyName}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {job.created_at
              ? new Date(job.created_at).toLocaleString()
              : "Just now"}
          </p>
        </div>
      </div>

      {/* Job Title */}
      <p className="font-semibold text-lg">{job.jobTitle}</p>

      {/* Description */}
      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 line-clamp-3">
        {job.jobDescription}
      </p>

      {/* Footer / Actions */}
      <div className="mt-4 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
        <span>
          {job.companyLocation ? job.companyLocation : "Location not specified"}
        </span>

        <span>
          Salary:{" "}
          {job.salary ? job.salary : "Not specified"}
        </span>
      </div>

      {/* Application Status */}
      {/* {hasApplied && (
        <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center text-green-700 dark:text-green-300 text-sm">
            <FontAwesomeIcon icon={faCheck} className="mr-2" />
            You have applied to this job
          </div>
        </div>
      )} */}

      {/* Application Form Modal */}
      {showApplicationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Apply to {job.jobTitle}</h3>
            <form onSubmit={handleSubmitApplication}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Cover Letter</label>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm"
                  rows={4}
                  placeholder="Why are you interested in this position?"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Resume (Optional)</label>
                <input
                  type="file"
                  onChange={(e) => setResume(e.target.files[0])}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm"
                  accept=".pdf,.doc,.docx"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancelApplication}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applying}
                  className="bg-[#00639C] text-white px-4 py-2 rounded-full hover:bg-[#005080] text-sm disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {applying ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Application"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Apply Button - Only show if user hasn't applied and job is open */}
      {role === 'Driver' && !hasApplied && (
        <div className="mt-4 flex justify-end">
          <button
            disabled={applying || job.jobStatus !== "open"}
            onClick={handleApplyClick}
            className="bg-[#00639C] text-white px-4 py-2 rounded-full hover:bg-[#005080] text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {applying ? (
              <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            ) : job.jobStatus === "open" ? (
              "Apply Now"
            ) : (
              "Closed"
            )}
          </button>
        </div>
      )}

      {/* View Application Button - If user has already applied */}
      {role === 'Driver' && hasApplied && (
        <div className="mt-4 flex justify-end">
          <button
            disabled
            className="bg-gray-400 text-white px-4 py-2 rounded-full text-sm font-medium cursor-not-allowed flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faCheck} />
            Applied
          </button>
        </div>
      )}
    </div>
  );
}