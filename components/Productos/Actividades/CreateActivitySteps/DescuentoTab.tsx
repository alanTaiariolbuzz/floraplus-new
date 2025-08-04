// components/ProductosActividadesPage.tsx
import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Typography, Box, Checkbox } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

interface Descuento {
  id: number;
  titulo: string;
  valor: number;
  tipo: string;
  moneda: string;
}

interface DescuentoTabProps {
  selectedDescuentos?: number[];
  onChange?: (selectedIds: number[]) => void;
}

export interface DescuentoTabRef {
  getSelectedDescuentos: () => number[];
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

// Move state outside component to persist between renders
let cachedDescuentos: Descuento[] = [];
let hasLoaded = false;

const DescuentoTab = forwardRef<DescuentoTabRef, DescuentoTabProps>(
  ({ selectedDescuentos = [], onChange }, ref) => {
    const [descuentos, setDescuentos] = useState<Descuento[]>(cachedDescuentos);
    const [loading, setLoading] = useState(!hasLoaded);
    const [localSelected, setLocalSelected] =
      useState<number[]>(selectedDescuentos);

    // Sync with parent's selectedDescuentos when they change
    useEffect(() => {
      setLocalSelected(selectedDescuentos);
    }, [selectedDescuentos]);

    useEffect(() => {
      const fetchDescuentos = async () => {
        // If we already have the data, don't fetch again
        if (hasLoaded) {
          setLoading(false);
          return;
        }

        try {
          const response = await fetch(`${siteUrl}/api/descuentos`);
          if (!response.ok) throw new Error("Failed to fetch descuentos");
          const data = await response.json();
          cachedDescuentos = data.data;
          setDescuentos(data.data);
          hasLoaded = true;
        } catch (error) {
          console.error("Error fetching descuentos:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchDescuentos();
    }, []);

    const handleCheckboxChange = (id: number) => {
      const newSelected = localSelected.includes(id)
        ? localSelected.filter((descuentoId) => descuentoId !== id)
        : [...localSelected, id];

      setLocalSelected(newSelected);
      // Notify parent of changes immediately
      onChange?.(newSelected);
    };

    // Expose a method to get current selections
    useImperativeHandle(
      ref,
      () => ({
        getSelectedDescuentos: () => {
          return localSelected;
        },
      }),
      [localSelected]
    );

    const columns: GridColDef[] = [
      {
        field: "titulo",
        headerName: "Nombre del descuento",
        flex: 1,
      },
      {
        field: "valor",
        headerName: "Monto",
        flex: 1,
        renderCell: (params) => {
          const descuento = params.row;
          const valor = descuento.valor;
          const tipo = descuento.tipo;
          const moneda = descuento.moneda;

          if (tipo === "porcentaje") {
            return `${valor}%`;
          } else {
            return `${moneda} ${valor}`;
          }
        },
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
          rows={descuentos}
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

DescuentoTab.displayName = "DescuentoTab";

export default DescuentoTab;
