import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Typography, Box, Checkbox } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

interface Horario {
  id: number;
  hora_salida: string;
  hora_llegada: string;
}

interface Transporte {
  id: number;
  titulo: string;
  precio: number;
  horarios: Horario[];
}

interface TransportesTabProps {
  selectedTransportes?: number[];
  onChange?: (selectedIds: number[]) => void;
}

export interface TransportesTabRef {
  getSelectedTransportes: () => number[];
}

// Move state outside component to persist between renders
let cachedTransportes: Transporte[] = [];
let hasLoaded = false;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const TransportesTab = forwardRef<TransportesTabRef, TransportesTabProps>(
  ({ selectedTransportes = [], onChange }, ref) => {
    const [transportes, setTransportes] =
      useState<Transporte[]>(cachedTransportes);
    const [loading, setLoading] = useState(!hasLoaded);
    const [localSelected, setLocalSelected] =
      useState<number[]>(selectedTransportes);

    // Sync with parent's selectedTransportes when they change
    useEffect(() => {
      setLocalSelected(selectedTransportes);
    }, [selectedTransportes]);

    useEffect(() => {
      const fetchTransportes = async () => {
        // If we already have the data, don't fetch again
        if (hasLoaded) {
          setLoading(false);
          return;
        }

        try {
          const response = await fetch(`${siteUrl}/api/transportes`);
          if (!response.ok) throw new Error("Failed to fetch transportes");
          const data = await response.json();

          // Store transportes with their horarios
          cachedTransportes = data.data;
          setTransportes(data.data);

          hasLoaded = true;
        } catch (error) {
          console.error("Error fetching transportes:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchTransportes();
    }, []);

    const handleCheckboxChange = (id: number) => {
      const newSelected = localSelected.includes(id)
        ? localSelected.filter((transporteId) => transporteId !== id)
        : [...localSelected, id];

      setLocalSelected(newSelected);
      // Notify parent of changes
      onChange?.(newSelected);
    };

    // Expose a method to get current selections
    useImperativeHandle(
      ref,
      () => ({
        getSelectedTransportes: () => localSelected,
      }),
      [localSelected]
    );

    const columns: GridColDef[] = [
      {
        field: "titulo",
        headerName: "Nombre del transporte",
        flex: 1,
      },
      {
        field: "hora_salida",
        headerName: "Salida",
        flex: 1,
        valueGetter: (params: any) => {
          const row = params?.row as Transporte;
          if (!row?.horarios?.length) return "-";
          return row.horarios[0].hora_salida?.slice(0, 5) || "-";
        },
      },
      {
        field: "hora_llegada",
        headerName: "Llegada",
        flex: 1,
        valueGetter: (params: any) => {
          const row = params?.row as Transporte;
          if (!row?.horarios?.length) return "-";
          return row.horarios[0].hora_llegada?.slice(0, 5) || "-";
        },
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
      <Box sx={{ height: 400, width: "100%" }}>
        <DataGrid
          rows={transportes}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          disableRowSelectionOnClick
          sx={{
            "& .MuiDataGrid-row": {
              backgroundColor: "#fafafa!important",
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
              backgroundColor: "#FAFAFA!important",
            },
          }}
        />
      </Box>
    );
  }
);

TransportesTab.displayName = "TransportesTab";

export default TransportesTab;
