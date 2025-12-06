"use client";

import { Suspense } from "react";
import FollowersPage from "@/components/Followers";

export default function Page() {
  return (
    <Suspense>
      <FollowersPage />
    </Suspense>
  );
}
