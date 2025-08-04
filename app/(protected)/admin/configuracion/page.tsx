"use client";

import { Typography, Tabs, Tab, Box, TextField, Button } from "@mui/material";
import { useState } from "react";
import { ConfigUsersAdmin } from "@/components/configuracion/ConfigUsersAdmin";
import { ConfigTycAdmin } from "@/components/configuracion/ConfigTycAdmin";

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
      id={`admin-config-tabpanel-${index}`}
      aria-labelledby={`admin-config-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AdminSettings() {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <>
      <div className="my-6 px-12">
        <div className="flex flex-row justify-between items-center pb-5">
          <Typography variant="h4" sx={{ fontWeight: "500" }}>
            Configuración
          </Typography>
        </div>

        <Box
          sx={{
            borderBottom: 1,
            borderRadius: "8px",
            border: "1px solid #E0E0E0",
            // height: "90px",
            paddingTop: "2px",
            backgroundColor: "white",
          }}
        >
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="admin config tabs"
          >
            <Tab label="Usuarios" />
            <Tab label="Términos y condiciones" />
          </Tabs>
        </Box>

        <TabPanel value={value} index={0}>
          <ConfigUsersAdmin />
        </TabPanel>
        <TabPanel value={value} index={1}>
          <ConfigTycAdmin />
        </TabPanel>
      </div>
    </>
  );
}
