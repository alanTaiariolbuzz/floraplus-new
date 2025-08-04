"use client";

import { useState } from "react";
import {
  Typography,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import TableChartIcon from "@mui/icons-material/TableChart";
import { useRouter } from "next/navigation";

interface DownloadState {
  loading: boolean;
  error: string | null;
  success: string | null;
}

interface MenuState {
  anchorEl: HTMLElement | null;
  selectedReport: string | null;
}

export default function Reportes() {
  const router = useRouter();
  const [menuStates, setMenuStates] = useState<Record<string, MenuState>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );
  const [downloadState, setDownloadState] = useState<DownloadState>({
    loading: false,
    error: null,
    success: null,
  });

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    reportId: string
  ) => {
    setMenuStates((prev) => ({
      ...prev,
      [reportId]: {
        anchorEl: event.currentTarget,
        selectedReport: reportId,
      },
    }));
  };

  const handleMenuClose = (reportId: string) => {
    setMenuStates((prev) => ({
      ...prev,
      [reportId]: {
        anchorEl: null,
        selectedReport: null,
      },
    }));
  };

  const downloadReport = async (
    dateRange: string,
    format: string,
    reportId: string
  ) => {
    // Set loading state for specific report
    setLoadingStates((prev) => ({ ...prev, [reportId]: true }));
    setDownloadState({ loading: false, error: null, success: null });

    try {
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      const response = await fetch(
        `${siteUrl}/api/reportes/reservas?dateRange=${dateRange}&format=${format}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al descargar el reporte");
      }

      // Get filename from response headers
      const contentDisposition = response.headers.get("content-disposition");
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
        : `reservas_${dateRange}.${format}`;

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setDownloadState({
        loading: false,
        error: null,
        success: `Reporte descargado exitosamente: ${filename}`,
      });

      // Clear success message after 5 seconds
      setTimeout(() => {
        setDownloadState((prev) => ({ ...prev, success: null }));
      }, 5000);
    } catch (error) {
      console.error("Error downloading report:", error);
      setDownloadState({
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al descargar el reporte",
        success: null,
      });

      // Clear error message after 5 seconds
      setTimeout(() => {
        setDownloadState((prev) => ({ ...prev, error: null }));
      }, 5000);
    } finally {
      // Clear loading state for specific report
      setLoadingStates((prev) => ({ ...prev, [reportId]: false }));
    }
  };

  const reportOptions = [
    {
      id: "last_month",
      title: "Último mes",
      description: "Listado de reservas e ingresos del último mes.",
      dateRange: "last_month",
    },
    {
      id: "last_3_months",
      title: "Últimos 3 meses",
      description: "Listado de reservas e ingresos de los últimos 3 meses.",
      dateRange: "last_3_months",
    },
    {
      id: "last_6_months",
      title: "Últimos 6 meses",
      description: "Listado de reservas e ingresos de los últimos 6 meses.",
      dateRange: "last_6_months",
    },
    {
      id: "all_time",
      title: "Histórico completo",
      description: "Listado de reservas e ingresos históricamente.",
      dateRange: "all_time",
    },
  ];

  const formatOptions = [
    { value: "xlsx", label: "Excel (.xlsx)", icon: <TableChartIcon /> },
    { value: "csv", label: "CSV (.csv)", icon: <FileDownloadIcon /> },
  ];

  return (
    <>
      <div className="my-6 px-12">
        <div className="flex flex-row justify-between items-center bg-[#FAFAFA] pb-5">
          <Typography variant="h4" sx={{ fontWeight: "500" }}>
            Reportes
          </Typography>
        </div>

        <div className="border border-[#E0E0E0] bg-[#fafafa] rounded-[8px] p-4 h-[135px]">
          <div className="w-full h-full flex items-center justify-center p-4 bg-white rounded-[8px]">
            <Typography variant="h6" sx={{ fontSize: "16px" }}>
              ¡La función de reportes avanzados llegará pronto!
            </Typography>
          </div>
        </div>

        <div className="mt-10 mb-5">
          <Typography variant="h6">Informes de Reservas e Ingresos</Typography>
        </div>

        <div>
          {reportOptions.map((report) => (
            <div
              key={report.id}
              className="border border-[#E0E0E0] bg-white rounded-[8px] p-4 h-[85px] flex flex-row items-center justify-between mt-2"
            >
              <div>
                <Typography variant="h6">{report.title}</Typography>
                <Typography variant="body2" sx={{ color: "#757575" }}>
                  {report.description}
                </Typography>
              </div>

              <div className="flex flex-row items-center gap-2">
                <div
                  className="flex flex-row items-center gap-2 cursor-pointer"
                  onClick={(event) => handleMenuClick(event, report.id)}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      color: "#E65100",
                      cursor: "pointer",
                      fontSize: "14px",
                    }}
                  >
                    DESCARGAR
                  </Typography>
                  <DownloadIcon sx={{ color: "#E65100", fontSize: "20px" }} />
                </div>
                {/* <Button
                  variant="outlined"
                  endIcon={<DownloadIcon />}
                  onClick={(event) => handleMenuClick(event, report.id)}
                  disabled={loadingStates[report.id]}
                  sx={{
                    color: "#E65100",
                    "&:focus": {
                      backgroundColor: "transparent",
                      color: "#E65100",
                    },
                    "&:hover": {
                      backgroundColor: "transparent",
                      color: "#E65100",
                    },
                    borderColor: "white",
                    "&:disabled": {
                      borderColor: "#E0E0E0",
                      color: "#BDBDBD",
                    },
                  }}
                >
                  DESCARGAR
                </Button> */}

                <Menu
                  anchorEl={menuStates[report.id]?.anchorEl || null}
                  open={Boolean(menuStates[report.id]?.anchorEl)}
                  onClose={() => handleMenuClose(report.id)}
                  PaperProps={{
                    sx: {
                      mt: 1,
                      borderRadius: "4px",
                    },
                  }}
                >
                  {formatOptions.map((format) => (
                    <MenuItem
                      key={format.value}
                      onClick={() => {
                        downloadReport(
                          report.dateRange,
                          format.value,
                          report.id
                        );
                        handleMenuClose(report.id);
                      }}
                      sx={{
                        minWidth: "140px",
                        "&:hover": {
                          backgroundColor: "#FFF3E0",
                        },
                      }}
                    >
                      <ListItemIcon>{format.icon}</ListItemIcon>
                      {format.label}
                    </MenuItem>
                  ))}
                </Menu>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Snackbar
        open={Boolean(downloadState.error || downloadState.success)}
        autoHideDuration={5000}
        onClose={() =>
          setDownloadState({ loading: false, error: null, success: null })
        }
      >
        <Alert
          onClose={() =>
            setDownloadState({ loading: false, error: null, success: null })
          }
          severity={downloadState.error ? "error" : "success"}
          sx={{ width: "100%" }}
        >
          {downloadState.error || downloadState.success}
        </Alert>
      </Snackbar>
    </>
  );
}
