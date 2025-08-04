"use client";

import { FC } from "react";
import { Typography, Box, Button } from "@mui/material";
import { ModificacionesList } from "./components/ModificacionesList";
import { ToastProvider } from "./nueva/components/ToastContext";
import AddIcon from "@mui/icons-material/Add";
import { useRouter } from "next/navigation";

export default function GestionDinamicaPage() {
  const router = useRouter();
  const handleCreateActivity = () => {
    router.push("/gestion-dinamica/nueva");
  };

  return (
    <ToastProvider>
      <div className="flex flex-col gap-4 bg-[#FAFAFA] py-[20px] px-12">
        <ModificacionesList />
      </div>
    </ToastProvider>
  );
}
