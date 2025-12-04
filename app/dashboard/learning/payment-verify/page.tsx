"use client";

import { Suspense } from "react";
import PaymentVerifyPage from "@/components/PaymentVerify";

export default function Page() {
  return (
    <Suspense>
      <PaymentVerifyPage />
    </Suspense>
  );
}
