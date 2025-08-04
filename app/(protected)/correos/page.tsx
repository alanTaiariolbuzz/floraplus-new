"use client";

import { Box, Tabs, Tab, Typography } from "@mui/material";
import { useState } from "react";
import MailsFormat from "./components/MailsFormat";
import MailsSent from "./components/MailsSent";

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

export default function Correos() {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <>
      <div className="my-6 px-12">
        <div className="flex flex-row justify-between items-center bg-[#FAFAFA] pb-5">
          <Typography variant="h4" sx={{ fontWeight: "500" }}>
            Correos
          </Typography>
        </div>

        <div className="my-6 px-12">
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={value}
              onChange={handleChange}
              aria-label="config tabs"
            >
              <Tab label="Correos enviados" />
              <Tab label="Plantillas de correos" />
              <Tab label="Formato de correos" />
            </Tabs>
          </Box>

          <TabPanel value={value} index={0}>
            <MailsSent />
          </TabPanel>
          <TabPanel value={value} index={1}>
            plantillas de correos
          </TabPanel>
          <TabPanel value={value} index={2}>
            <MailsFormat />
          </TabPanel>
        </div>
      </div>
    </>
  );
}
