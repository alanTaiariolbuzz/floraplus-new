"use client";
// components/Dashboard/Sections/SalesTabs.tsx
import { useState } from "react";
import { Tabs, Tab, Grid, Paper, Typography, Skeleton } from "@mui/material";
import { SalesCard } from "../Metrics/MetricCard";
import { CancelCard } from "../Metrics/CancelCard";
import { SalesTable } from "../Tables/SalesTable";
import { Sale, Cancellation } from "../types";

interface SalesTabsProps {
  sales: Sale[];
  cancellations: Cancellation[];
  refundsTotal: number;
  isLoading?: boolean;
}

export const SalesTabs = ({
  sales,
  cancellations,
  refundsTotal,
  isLoading = false,
}: SalesTabsProps) => {
  const [activeTab, setActiveTab] = useState(0);

  // Calcular métricas
  const salesCount = sales.length;
  const salesIncome = sales.reduce((sum, s) => sum + (s.amount || 0), 0);
  const cancellationsCount = cancellations.length;

  if (isLoading) {
    return (
      <>
        <Skeleton
          variant="rectangular"
          height={48}
          sx={{ borderRadius: "8px 8px 0 0" }}
        />
        <div className="flex flex-row gap-4 p-4 bg-white border-t border-[#E0E0E0]">
          <Grid item xs={6}>
            <Skeleton variant="rectangular" height={100} />
          </Grid>
          <Grid item xs={6}>
            <Skeleton variant="rectangular" height={100} />
          </Grid>
        </div>
        <Skeleton
          variant="rectangular"
          height={300}
          sx={{ borderRadius: "0 0 8px 8px" }}
        />
      </>
    );
  }

  return (
    <>
      <Tabs
        sx={{
          backgroundColor: "white",
          borderTopLeftRadius: "8px",
          borderTopRightRadius: "8px",
        }}
        value={activeTab}
        variant="fullWidth"
        onChange={(_, newVal) => setActiveTab(newVal)}
      >
        <Tab label="Ventas" />
        <Tab label="Cancelaciones" />
      </Tabs>

      <div className="flex flex-row gap-4 p-4 bg-white border-t border-[#E0E0E0]">
        {activeTab === 0 ? (
          <>
            <Grid item xs={6}>
              <SalesCard title="Cantidad Ventas hoy" value={salesCount} />
            </Grid>
            <Grid item xs={6}>
              <SalesCard title="Total ingresos" value={salesIncome} isMoney />
            </Grid>
          </>
        ) : (
          <>
            <Grid item xs={6}>
              <CancelCard
                title="Cancelaciones hoy"
                value={cancellationsCount}
              />
            </Grid>
            <Grid item xs={6}>
              <CancelCard
                title="Total reembolsos hoy"
                value={refundsTotal}
                isMoney
              />
            </Grid>
          </>
        )}
      </div>

      {activeTab === 0 ? (
        <SalesTable data={sales} mode="sales" />
      ) : (
        <SalesTable data={cancellations} mode="cancellations" />
      )}
    </>
  );
};
