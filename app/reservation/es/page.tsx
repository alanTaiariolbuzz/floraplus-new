"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ReservationIframe } from "../../components/reservation/ReservationIframe";
import { useTranslation } from "../../hooks/useTranslation";

// Loading fallback component for Suspense
const LoadingFallback = () => {
  const { t } = useTranslation("es");
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <p>{t("loading")}</p>
    </div>
  );
};

function ReservationContent() {
  const searchParams = useSearchParams();
  const actividadId = searchParams.get("actividad_id");
  const agencyId = searchParams.get("agency_id");
  const { t } = useTranslation("es");

  if (!actividadId) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-red-500">
        <p>{t("error")}</p>
      </div>
    );
  }

  return <ReservationIframe actividadId={actividadId} language="es" />;
}

export default function ReservationPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ReservationContent />
    </Suspense>
  );
}
