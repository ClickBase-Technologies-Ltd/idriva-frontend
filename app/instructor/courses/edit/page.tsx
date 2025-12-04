"use client";

import { Suspense } from "react";
import CourseEditPage from "@/components/CourseEdit";

export default function Page() {
  return (
    <Suspense>
      <CourseEditPage />
    </Suspense>
  );
}
