"use client";

import Image from "next/image";
import Link from "next/link";

export default function RightbarRecruiters({ recruiters = [] }) {
  return (
    <div className="w-72 hidden xl:block bg-transparent border-l border-gray-200 dark:border-gray-700 
                    h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto overflow-x-hidden 
                    scrollbar-hide px-4 pt-4 space-y-4 text-sm">

      {/* Premium Prompt */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="font-semibold mb-2">Stand out to prospects</h3>
        <p className="text-gray-600 dark:text-gray-400 text-xs">
          Try Premium for free and boost your visibility.
        </p>

        <Link
          href="/premium"
          className="block mt-3 w-full bg-[#005a8c] text-white py-1.5 rounded text-sm hover:bg-[#004a6b] text-center"
        >
          Try Premium
        </Link>
      </div>

      {/* iDriva News */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="font-semibold mb-2">iDriva News</h3>
        <ul className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
          <li>• Tech layoffs decline globally</li>
          <li>• New trends in remote work</li>
          <li>• Africa&apos;s startup ecosystem grows</li>
          <li>• Skills in demand 2025</li>
          <li>• Driving industry updates</li>
        </ul>
      </div>

      {/* Recruiters List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="font-semibold mb-2">Recruiters</h3>

        <div className="space-y-3">
          {recruiters.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              No recruiters found.
            </p>
          ) : (
            recruiters.map((rec) => (
              <div key={rec.id} className="flex items-center space-x-2">
                <Image
                  src={resolveAvatar(rec)}
                  width={32}
                  height={32}
                  className="rounded object-cover"
                  alt={rec.full_name || rec.email || "Recruiter"}
                />

                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">
                    {rec.full_name || rec.email || "Recruiter"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Activity: {rec.activity_count ?? 0}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}

/** Utility: Return avatar URL or fallback */
function resolveAvatar(rec) {
  if (rec.profile_picture)
    return `/uploads/profile-picture/${rec.profile_picture}`;

  if (rec.avatar)
    return `/uploads/${rec.avatar}`;

  return "/avatar.png";
}
