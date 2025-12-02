'use client';
import Link from 'next/link';
import { useState } from 'react';


export default function FooterGeneral() {
{/* Footer */}
    <footer className="bg-white border-t border-gray-200 text-sm text-gray-600">
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap justify-center gap-4">
        <span>Copyright &copy; {new Date().getFullYear()} CapitalCore Outsourcing Ltd. Powered by <Link href="https://clickbase.tech" target="_blank" className="text-blue-600 hover:underline">
    ClickBase Technologies Ltd.
  </Link></span>
        <Link href="#" className="hover:text-blue-600">About</Link>
        <Link href="#" className="hover:text-blue-600">Accessibility</Link>
        <Link href="#" className="hover:text-blue-600">User Agreement</Link>
        <Link href="#" className="hover:text-blue-600">Privacy Policy</Link>
        <Link href="#" className="hover:text-blue-600">Cookie Policy</Link>
        <Link href="#" className="hover:text-blue-600">Copyright Policy</Link>
        <Link href="#" className="hover:text-blue-600">Brand Policy</Link>
        <Link href="#" className="hover:text-blue-600">Guest Controls</Link>
        <Link href="#" className="hover:text-blue-600">Community Guidelines</Link>
      </div>
    </footer>
}