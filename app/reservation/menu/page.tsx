"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function MenuPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const agencyId = searchParams.get("agency_id");

  useEffect(() => {
    if (agencyId) {
      router.push(`/reservation/menu/es?agency_id=${agencyId}`);
    }
  }, [agencyId, router]);

  return null;
}
