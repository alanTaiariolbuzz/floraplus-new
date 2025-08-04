// app/protected/reservas/page.tsx

import { Typography } from "@mui/material";
import ReservationsDataGrid from "./components/ReservationsDataGrid";

export default function Reservas() {
  return (
    <>
      <div className="my-6 px-12">
        <div className="flex flex-row justify-between items-center bg-[#FAFAFA] pb-5">
          <Typography variant="h4" sx={{ fontWeight: "500" }}>
            Reservas
          </Typography>
        </div>
        <ReservationsDataGrid />
      </div>
    </>
  );
}
