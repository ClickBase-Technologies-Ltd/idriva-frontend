"use client";

import { Suspense } from "react";
import LessonPage from "@/components/Lesson";

export default function Page() {
  return (
    <Suspense>
      <LessonPage />
    </Suspense>
  );
}
