"use client";

import { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import {
  TextField,
  Typography,
  Box,
  IconButton,
  Button,
  Tooltip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useRouter } from "next/navigation";

import LaptopIcon from "@mui/icons-material/Laptop";
import SearchIcon from "@mui/icons-material/Search";

interface Agencia {
  id: number;
  nombre_comercial: string;
  activa: boolean;
  email_contacto: string;
  stripe_account_id: string;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

// Nuevo componente para el botón Spy Mode
function SpyModeButton({ agencyId }: { agencyId: number }) {
  const router = useRouter();
  const [loadingSpy, setLoadingSpy] = useState(false);

  const handleSpyMode = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingSpy(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/usuarios/superadmin/spy_mode?agencia_id=${agencyId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error activando Spy Mode:", errorData.message);
        alert(`Error: ${errorData.message}`);
        setLoadingSpy(false);
        return;
      }
      // Redirigir a /dashboard si es exitoso
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Error activando Spy Mode:", error);
      alert("Error interno al activar Spy Mode");
    } finally {
      setLoadingSpy(false);
    }
  };

  return (
    <Tooltip title="">
      <span>
        <IconButton disabled={loadingSpy} onClick={handleSpyMode}>
          {loadingSpy ? (
            <span className="w-6 h-6 flex items-center justify-center">
              <svg
                className="animate-spin h-6 w-6 text-primary"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            </span>
          ) : (
            <LaptopIcon sx={{ fontSize: 24 }} color="primary" />
          )}
        </IconButton>
      </span>
    </Tooltip>
  );
}

export default function AdminAccountManagement() {
  const router = useRouter();
  const [data, setData] = useState<Agencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filteredData, setFilteredData] = useState<Agencia[]>([]);
  const [syncingAgencies, setSyncingAgencies] = useState<Set<number>>(
    new Set()
  );
  const [syncingAll, setSyncingAll] = useState(false);

  // Load agencies data
  useEffect(() => {
    fetch(`${siteUrl}/api/agencias`)
      .then((response) => response.json())
      .then((result) => {
        setData(result.data);
        setFilteredData(result.data);
      })
      .catch((error) => {
        console.error("Error loading agencies:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Filter data based on search
  useEffect(() => {
    const filtered = data.filter(
      (agencia) =>
        agencia?.nombre_comercial
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        agencia?.email_contacto?.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredData(filtered);
  }, [data, search]);

  // Función para sincronizar el estado de Stripe de una agencia
  const syncAgencyStripeStatus = async (agencyId: number) => {
    setSyncingAgencies((prev) => new Set(prev).add(agencyId));

    try {
      const response = await fetch(
        `${siteUrl}/api/agencias/${agencyId}/sync-stripe-status`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        // Actualizar el estado local de la agencia
        setData((prevData) =>
          prevData.map((agencia) =>
            agencia.id === agencyId
              ? { ...agencia, activa: result.data.currentStatus }
              : agencia
          )
        );

        // Mostrar mensaje de éxito
        alert(
          `Estado sincronizado exitosamente. Estado anterior: ${result.data.previousStatus ? "Activa" : "Inactiva"}, Estado actual: ${result.data.currentStatus ? "Activa" : "Inactiva"}`
        );
      } else {
        alert(`Error al sincronizar: ${result.message}`);
      }
    } catch (error) {
      console.error("Error al sincronizar estado de Stripe:", error);
      alert("Error interno al sincronizar el estado de Stripe");
    } finally {
      setSyncingAgencies((prev) => {
        const newSet = new Set(prev);
        newSet.delete(agencyId);
        return newSet;
      });
    }
  };

  // Función para sincronizar todas las agencias
  const syncAllAgenciesStripeStatus = async () => {
    setSyncingAll(true);

    try {
      const response = await fetch(
        `${siteUrl}/api/agencias/sync-all-stripe-status`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        // Recargar los datos para mostrar los cambios
        const refreshResponse = await fetch(`${siteUrl}/api/agencias`);
        const refreshResult = await refreshResponse.json();

        if (refreshResponse.ok) {
          setData(refreshResult.data);
          setFilteredData(refreshResult.data);
        }

        // Mostrar resumen de la sincronización
        alert(
          `Sincronización completada:\n- Total: ${result.data.total}\n- Exitosas: ${result.data.successful}\n- Fallidas: ${result.data.failed}\n- Cambios de estado: ${result.data.statusChanges}`
        );
      } else {
        alert(`Error al sincronizar: ${result.message}`);
      }
    } catch (error) {
      console.error("Error al sincronizar todas las agencias:", error);
      alert("Error interno al sincronizar los estados de Stripe");
    } finally {
      setSyncingAll(false);
    }
  };

  const columns = [
    { field: "nombre_comercial", headerName: "Nombre", flex: 1 },
    {
      field: "activa",
      headerName: "Estado",
      flex: 1,
      renderCell: (params: any) => (
        <div className="flex items-center  h-full w-full">
          <p
            className={`font-normal text-[13px] leading-[18px] tracking-[0.16px] p-2 rounded-[8px] ${
              params.value
                ? "bg-[#E8F5E9] text-[#2E7D32]"
                : "bg-[#FFF3E0] text-[#EF6C00]"
            }`}
          >
            {params.value ? "Activa" : "Inactiva"}
          </p>
        </div>
      ),
    },
    {
      field: "spyMode",
      headerName: "Spy Mode",
      renderCell: (params: any) => <SpyModeButton agencyId={params.row.id} />, // Usar el nuevo componente
    },
  ];

  return (
    <>
      <div className="bg-white overflow-hidden ">
        <div className="">
          <div className="flex flex-row justify-between items-center bg-[#FAFAFA] py-6 ">
            <Typography variant="h4" sx={{ fontWeight: "500" }}>
              Gestión de cuentas
            </Typography>
            <div className="flex gap-2">
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                sx={{ mb: 2 }}
                onClick={() => router.push("/admin/cuentas/nueva")}
              >
                Crear cuenta
              </Button>
            </div>
          </div>

          <div className="  border border-[#E0E0E0] rounded-[8px]">
            <div className="w-full flex flex-row justify-end my-5 px-12">
              <TextField
                label="Buscar"
                variant="outlined"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ width: "270px" }}
                InputProps={{
                  endAdornment: (
                    <SearchIcon
                      sx={{ color: "action.active", mr: 1, my: 0.5 }}
                    />
                  ),
                  style: { fontSize: "16px" },
                }}
                InputLabelProps={{
                  style: { fontSize: "16px" },
                }}
              />
            </div>

            <Box
              sx={{
                maxHeight: filteredData.length === 0 ? 230 : 600,
                width: "100%",
                height: filteredData.length === 0 ? 230 : "auto",
              }}
            >
              <DataGrid
                sx={{
                  border: "none!important",
                  "--DataGrid-containerBackground": "#FAFAFA",
                  "& .MuiDataGrid-columnHeaders": {
                    backgroundColor: "#FAFAFA",
                  },
                }}
                rows={filteredData}
                columns={columns}
                loading={loading}
                paginationModel={
                  filteredData.length > 20
                    ? { pageSize: 20, page: 0 }
                    : undefined
                }
                pageSizeOptions={filteredData.length > 20 ? [20] : []}
                hideFooterPagination={filteredData.length <= 20}
                slots={{
                  noRowsOverlay: () => (
                    <div
                      style={{
                        height: "100%",
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 1,
                        padding: 2,
                        backgroundColor: "white",
                      }}
                    >
                      <div className="bg-[#fafafa] rounded-[8px] w-[calc(100%-16px)] h-[calc(100%-16px)] flex flex-col items-center justify-center gap-2">
                        <Typography variant="body2" color="text.secondary">
                          No hay agencias registradas
                        </Typography>
                      </div>
                    </div>
                  ),
                  footer: filteredData.length > 20 ? undefined : () => null,
                }}
              />
            </Box>
          </div>
        </div>
      </div>
    </>
  );
}
