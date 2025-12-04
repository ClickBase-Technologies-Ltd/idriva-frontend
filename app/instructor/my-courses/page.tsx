"use client";

import { Suspense } from "react";
import MyCoursesPage from "@/components/MyCourses";

export default function Page() {
  return (
    <Suspense>
      <MyCoursesPage />
    </Suspense>
  );
}
