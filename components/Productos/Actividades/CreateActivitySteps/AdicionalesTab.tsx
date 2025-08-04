import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from "react";
import { Box, Checkbox } from "@mui/material";
import { DataGrid, GridColDef, GridPaginationModel } from "@mui/x-data-grid";

interface Adicional {
  id: number;
  titulo: string;
  precio: number;
  activo: boolean;
}

interface AdicionalesTabProps {
  selectedAdicionales?: number[];
  onChange?: (selectedIds: number[]) => void;
  paginationModel: GridPaginationModel;
  onPaginationChange: (model: GridPaginationModel) => void;
  forceRefresh?: boolean; // Nueva prop para forzar refresco
}

export interface AdicionalesTabRef {
  getSelectedAdicionales: () => number[];
  refreshAdicionales: () => Promise<void>; // Nueva función para refrescar
}

let cachedAdicionales: Adicional[] = [];
let hasLoaded = false;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

const AdicionalesTab = forwardRef<AdicionalesTabRef, AdicionalesTabProps>(
  (
    {
      selectedAdicionales = [],
      onChange,
      paginationModel,
      onPaginationChange,
      forceRefresh = false,
    },
    ref
  ) => {
    const [adicionales, setAdicionales] =
      useState<Adicional[]>(cachedAdicionales);
    const [loading, setLoading] = useState(!hasLoaded);
    const [localSelected, setLocalSelected] =
      useState<number[]>(selectedAdicionales);

    // Sincronizar selección con el padre
    useEffect(() => {
      setLocalSelected(selectedAdicionales);
    }, [selectedAdicionales]);

    // Función para obtener adicionales
    const fetchAdicionales = async (force = false) => {
      if (hasLoaded && !force) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`${siteUrl}/api/adicionales`);
        if (!response.ok) throw new Error("Failed to fetch adicionales");
        const data = await response.json();
        cachedAdicionales = data.data.filter(
          (adicional: Adicional) => adicional.activo === true
        );
        setAdicionales(cachedAdicionales);
        hasLoaded = true;
      } catch (error) {
        console.error("Error fetching adicionales:", error);
      } finally {
        setLoading(false);
      }
    };

    // Efecto para cargar adicionales
    useEffect(() => {
      fetchAdicionales();
    }, []);

    // Efecto para forzar refresco cuando cambia forceRefresh
    useEffect(() => {
      if (forceRefresh) {
        hasLoaded = false; // Invalidar caché
        fetchAdicionales(true);
      }
    }, [forceRefresh]);

    // Efecto para escuchar eventos de invalidación de caché
    useEffect(() => {
      const handleCacheInvalidation = () => {
        hasLoaded = false;
        cachedAdicionales = [];
        fetchAdicionales(true);
      };

      // Escuchar evento personalizado
      window.addEventListener(
        "adicionales-cache-invalidated",
        handleCacheInvalidation
      );

      // Cleanup
      return () => {
        window.removeEventListener(
          "adicionales-cache-invalidated",
          handleCacheInvalidation
        );
      };
    }, []);

    const handleCheckboxChange = (id: number) => {
      setLocalSelected((prevSelected) => {
        const newSelected = prevSelected.includes(id)
          ? prevSelected.filter((adicionalId) => adicionalId !== id)
          : [...prevSelected, id];
        onChange?.(newSelected);
        return newSelected;
      });
    };

    useImperativeHandle(
      ref,
      () => ({
        getSelectedAdicionales: () => {
          return localSelected;
        },
        refreshAdicionales: async () => {
          hasLoaded = false; // Invalidar caché
          await fetchAdicionales(true);
        },
      }),
      [localSelected]
    );

    const stableRows = useMemo(() => adicionales, [adicionales]);

    const columns: GridColDef[] = [
      {
        field: "titulo",
        headerName: "Nombre de la Actividad",
        flex: 1,
      },
      {
        field: "precio",
        headerName: "Precio",
        flex: 1,
        renderCell: (params) => `$${params.value}`,
      },
      {
        field: "selected",
        headerName: "Ofrecer en esta actividad",
        flex: 1,
        renderCell: (params) => (
          <Checkbox
            checked={localSelected.includes(params.row.id)}
            onChange={() => handleCheckboxChange(params.row.id)}
          />
        ),
      },
    ];

    return (
      <Box sx={{ height: "100%", width: "100%" }}>
        <DataGrid
          disableColumnFilter
          disableColumnMenu
          rows={stableRows}
          columns={columns}
          loading={loading}
          pageSizeOptions={[15]}
          paginationModel={paginationModel}
          onPaginationModelChange={onPaginationChange}
          getRowId={(row) => row.id}
          disableRowSelectionOnClick
          hideFooterPagination={stableRows.length <= 15}
          sx={{
            borderRadius: "8px",

            "& .MuiDataGrid-row": {
              backgroundColor: "",
            },
            "& .MuiDataGrid-row:hover": {
              backgroundColor: "none!important",
            },
            "& .MuiDataGrid-cell:focus": {
              outline: "none!important",
            },
            "& .MuiDataGrid-cell:active": {
              outline: "none!important",
            },
            "& .MuiDataGrid-cell:focus-within": {
              outline: "none!important",
            },
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "#fafafa!important",
            },
            "& .MuiDataGrid-columnHeaders [role='row']": {
              backgroundColor: "#fafafa!important",
            },
          }}
          slots={{
            footer: stableRows.length > 15 ? undefined : () => null,
          }}
          localeText={{
            noRowsLabel: "No tienes adicionales disponibles",
          }}
        />
      </Box>
    );
  }
);

AdicionalesTab.displayName = "AdicionalesTab";

export default AdicionalesTab;
