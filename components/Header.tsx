'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';


export default function Header() {
const [dark, setDark] = useState(false);


return (


<>

 <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm px-4 sm:px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Link href="/">
            <Image src="/logo.png" alt="iDriva Logo" width={100} height={32} />
          </Link>
        </div>
        <div className="hidden sm:flex space-x-4">
          <Link href="#" className="text-gray-700 text-sm font-medium hover:text-blue-700">Top Content</Link>
          <Link href="#" className="text-gray-700 text-sm font-medium hover:text-blue-700">People</Link>
          <Link href="#" className="text-gray-700 text-sm font-medium hover:text-blue-700">Learning</Link>
          <Link href="#" className="text-gray-700 text-sm font-medium hover:text-blue-700">Jobs</Link>
          <Link href="/auth/signup" className="text-gray-700 text-sm font-medium hover:text-blue-700">Join now</Link>
          <Link
            href="/auth/login"
            className="border border-blue-700 text-blue-700 text-sm px-4 py-1 rounded-full hover:bg-blue-700 hover:text-white transition"
          >
            Sign in
          </Link>
        </div>
      </nav>
      </>
);
}