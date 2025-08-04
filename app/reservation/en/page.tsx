"use client";

import { useEffect, useState } from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ReservationIframe } from "../../components/reservation/ReservationIframe";
import { useTranslation } from "../../hooks/useTranslation";
import { CircularProgress } from "@mui/material";

// Loading fallback component for Suspense
const LoadingFallback = () => {
  const { t } = useTranslation("en");
  return (
    <div className="flex items-center justify-center min-h-[400px] bg-white">
      <p>{t("loading")}</p>
    </div>
  );
};

function ReservationContent() {
  const searchParams = useSearchParams();
  const actividadId = searchParams.get("actividad_id");
  const agencyId = searchParams.get("agency_id");
  const { t } = useTranslation("en");

  if (!actividadId) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-red-500">
        <p>{t("error")}</p>
      </div>
    );
  }

  return <ReservationIframe actividadId={actividadId} language="en" />;
}

export default function ReservationPage() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </div>
    );
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <ReservationContent />
    </Suspense>
  );
}
