"use client";

import { Suspense } from "react";
import LoginForm from "./LoginForm";
import LoginPage from "@/components/Login";

export default function Page() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  );
}
