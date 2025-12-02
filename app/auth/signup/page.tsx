"use client";

import { Suspense } from "react";
import SignupPage from "@/components/SignUp";

export default function Page() {
  return (
    <Suspense>
      <SignupPage />
    </Suspense>
  );
}
