// app/protected/reservas/page.tsx

"use client";

import { ConfigInfoTab } from "@/components/configuracion/ConfigInfoTab";
import { ConfigFee } from "@/components/configuracion/ConfigFee";
import { ConfigUsers } from "@/components/configuracion/ConfigUsers";
import { ConfigTyc } from "@/components/configuracion/ConfigTyc";
import { Typography, Tabs, Tab, Box } from "@mui/material";
import { useState } from "react";
// import ReservationsDataGrid from "./components/ReservationsDataGrid";
import { ConfigPayouts } from "@/components/configuracion/ConfigPayouts";
import { ToastProvider } from "@/app/(protected)/gestion-dinamica/nueva/components/ToastContext";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`config-tabpanel-${index}`}
      aria-labelledby={`config-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Configuracion() {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <ToastProvider>
      <div className="my-6 px-12">
        <div className="flex flex-row justify-between items-center pb-5">
          <Typography variant="h4" sx={{ fontWeight: "500" }}>
            Configuración
          </Typography>
        </div>

        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={value} onChange={handleChange} aria-label="config tabs">
            <Tab label="Detalles de la empresa" />
            <Tab label="Usuarios" />
            <Tab label="Impuestos y fees" />
            <Tab label="Pagos" />
            <Tab label="Términos y condiciones" />
          </Tabs>
        </Box>

        <TabPanel value={value} index={0}>
          <ConfigInfoTab />
        </TabPanel>
        <TabPanel value={value} index={1}>
          <ConfigUsers />
        </TabPanel>
        <TabPanel value={value} index={2}>
          <ConfigFee />
        </TabPanel>
        <TabPanel value={value} index={3}>
          <ConfigPayouts />
        </TabPanel>
        <TabPanel value={value} index={4}>
          <ConfigTyc />
        </TabPanel>
      </div>
    </ToastProvider>
  );
}
