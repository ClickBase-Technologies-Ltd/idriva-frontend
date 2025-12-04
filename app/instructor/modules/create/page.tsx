"use client";

import { Suspense } from "react";
import CreateModulePage from "@/components/Modules";

export default function Page() {
  return (
    <Suspense>
      <CreateModulePage />
    </Suspense>
  );
}
