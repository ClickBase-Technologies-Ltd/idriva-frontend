"use client";

import { Suspense } from "react";
import ApplicationsPage from "@/components/Applications";

export default function Page() {
  return (
    <Suspense>
      <ApplicationsPage />
    </Suspense>
  );
}
