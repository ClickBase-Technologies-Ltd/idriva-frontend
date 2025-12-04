"use client";

import { Suspense } from "react";
import CourseDetailPage from "@/components/CourseDetails";

export default function Page() {
  return (
    <Suspense>
      <CourseDetailPage />
    </Suspense>
  );
}
