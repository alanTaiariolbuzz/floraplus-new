"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useTranslation } from "../../../hooks/useTranslation";

interface Activity {
  id: number;
  titulo: string;
  imagen: string;
}

export default function MenuPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [agencyName, setAgencyName] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const agencyId = searchParams.get("agency_id");
  const { t } = useTranslation("es");

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!agencyId) {
          console.error("No agency ID found in URL");
          return;
        }

        // Fetch activities from API
        const response = await fetch(
          `/api/public/actividades?agencia_id=${agencyId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch activities");
        }
        const { data } = await response.json();
        setActivities(data);

        // Fetch agency name
        const agencyResponse = await fetch(`/api/agencias?id=${agencyId}`);
        if (!agencyResponse.ok) {
          throw new Error("Failed to fetch agency");
        }
        const { data: agencyData } = await agencyResponse.json();
        if (agencyData && agencyData.length > 0) {
          setAgencyName(agencyData[0].nombre_comercial);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [agencyId]);

  const handleReserve = (activityId: number) => {
    router.push(`/reservation/es?actividad_id=${activityId}`);
  };

  if (!agencyId) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <h1 className="text-2xl text-gray-600">{t("error")}</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="h-[80px] bg-[#FB8C00] rounded-t-lg flex items-center px-6">
        <h1 className="text-white text-xl font-medium">{agencyName}</h1>
      </div>

      {/* Activities Container */}
      <div className="p-6">
        <h1 className="text-[1.25rem] font-[600] mb-4">{t("ourActivities")}</h1>
        <div className="flex flex-wrap gap-6">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="w-[250px] h-[365px] flex flex-col rounded-[8px] overflow-hidden shadow-sm border border-[#E0E0E0]"
            >
              <div className="relative w-full h-[200px]">
                <Image
                  src={activity.imagen}
                  alt={activity.titulo}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4 flex flex-col flex-grow justify-between">
                <h2 className="text-[1.25rem] font-medium">
                  {activity.titulo}
                </h2>
                <button
                  onClick={() => handleReserve(activity.id)}
                  className="w-[100%] h-[40px] bg-[#FB8C00] text-white text-[0,9375rem] uppercase rounded-md hover:bg-[#F57C00] transition-colors"
                >
                  {t("reserveNow")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
