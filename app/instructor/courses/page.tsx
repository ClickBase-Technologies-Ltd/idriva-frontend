"use client";

import { Suspense } from "react";
import CourseManagePage from "@/components/Courses";

export default function Page() {
  return (
    <Suspense>
      <CourseManagePage />
    </Suspense>
  );
}
