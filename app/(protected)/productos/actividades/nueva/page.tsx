// app/protected/dashboard/page.tsx
import { Typography } from "@mui/material";
import ActividadesTabs from "../../../../../components/Productos/Actividades/ActividadesTabs"; // Componente Dashboard

export default function ActividadesNueva() {
  return (
    <div>
      <div className="flex flex-row justify-between items-center bg-[#FAFAFA] pb-[10px] pt-[20px] px-8">
        <Typography variant="h4" sx={{ fontWeight: "500" }}>
          Crear actividad
        </Typography>
      </div>
      <ActividadesTabs />
    </div>
  );
}
