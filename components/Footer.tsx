'use client';
import Link from 'next/link';
import { useState } from 'react';


export default function Footer() {
 return (
   <footer className="fixed bottom-0 left-0 w-full bg-white text-center py-4  text-xs sm:text-sm text-gray-600">
    <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap justify-center gap-4">
  Copyright &copy; 2025 CapitalCore Outsourcing Ltd. 
  Powered by{""}<Link href="https://clickbase.tech" target="_blank" className="text-blue-600 hover:underline">ClickBase Technologies Ltd.
  </Link>
  </div>
</footer>
 );
}

