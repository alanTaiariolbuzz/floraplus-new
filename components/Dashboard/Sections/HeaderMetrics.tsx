// components/Dashboard/Sections/HeaderMetrics.tsx
import { Grid, Typography } from "@mui/material";
import { SalesCard } from "../Metrics/MetricCard";

interface HeaderMetricsProps {
  reservationsCount: number;
  peopleCount: number;
}

export const HeaderMetrics = ({
  reservationsCount,
  peopleCount,
}: HeaderMetricsProps) => (
  <>
    <Grid className="flex flex-row w-[100%] gap-4" spacing={3}>
      <Grid className="w-1/2">
        <SalesCard title="Reservas hoy" value={reservationsCount} />
      </Grid>
      <Grid className="w-1/2">
        <SalesCard title="Personas hoy" value={peopleCount} />
      </Grid>
    </Grid>
  </>
);
