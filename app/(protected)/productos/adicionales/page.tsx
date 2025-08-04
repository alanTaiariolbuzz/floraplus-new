"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Box,
  Switch,
  Dialog,
  DialogTitle,
  DialogActions,
  IconButton,
  Typography,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EmptyState from "@/components/Productos/EmptyState";
import { DataGrid } from "@mui/x-data-grid";
import { Delete, Edit } from "@mui/icons-material";
import "../../../globals.css";
interface Actividad {
  id: number;
  titulo: string;
  imagen?: string;
  estado?: string;
  precio: number;
  moneda: string;
  activo: boolean;
}

const API_URL = `${process.env.NEXT_PUBLIC_SITE_URL}/api/adicionales`;

const AdicionalesPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<Actividad[]>([]);
  const [error, setError] = useState("");
  const [estado, setEstado] = useState<{ [key: number]: boolean }>({});
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  // Estado para el diálogo de eliminación
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleCreateAdicional = () => {
    router.push("/productos/adicionales/nuevo");
  };

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Error al obtener adicionales");
        const { data } = await response.json();
        setActivities(data);

        // Set initial switch states
        const estados = data.reduce((acc: any, item: Actividad) => {
          acc[item.id] = item.activo;
          return acc;
        }, {});
        setEstado(estados);
      } catch (err) {
        setError("Error cargando adicionales");
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, []);

  const handleToggle = async (id: number) => {
    try {
      const newState = !estado[id];
      const response = await fetch(`${API_URL}?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ activo: newState }),
      });

      if (!response.ok) throw new Error("Error al actualizar el estado");

      // Actualizar el estado local solo si la actualización fue exitosa
      setEstado((prev) => ({ ...prev, [id]: newState }));
    } catch (error) {
      console.error("Error actualizando estado:", error);
      // Podrías mostrar un mensaje de error al usuario aquí
    }
  };

  const handleEdit = (id: number) => {
    router.push(`/productos/adicionales/editar/${id}`);
  };

  // Abrir diálogo de confirmación
  const confirmDelete = (id: number) => {
    setSelectedId(id);
    setDeleteDialogOpen(true);
  };

  // Eliminar adicional con actualización en el estado
  const handleDelete = async () => {
    if (!selectedId) return;

    try {
      const response = await fetch(`${API_URL}?id=${selectedId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Error al eliminar el adicional");

      // Actualizar la lista eliminando el item sin necesidad de recargar
      setActivities((prev) => prev.filter((item) => item.id !== selectedId));
    } catch (error) {
      console.error("Error eliminando adicional:", error);
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <CircularProgress />
      </div>
    );

  if (error) return <p style={{ color: "red" }}>{error}</p>;

  if (activities.length < 1) {
    return (
      <div className="pt-[20px] px-12">
        <Typography variant="h4" sx={{ fontWeight: "500" }}>
          Adicionales
        </Typography>
        <EmptyState
          entityName="Adicionales"
          redirectPath="/productos/adicionales/nuevo"
        />
      </div>
    );
  }

  const columns = [
    { field: "titulo", headerName: "Nombre", flex: 1 },
    {
      field: "precio",
      headerName: "Precio",
      flex: 1,
      renderCell: (params: any) =>
        params.row.precio && params.row.moneda
          ? `${params.row.precio} ${params.row.moneda}`
          : "-",
    },
    {
      field: "estado",
      headerName: "Estado",
      flex: 1,
      renderCell: (params: any) => (
        <Switch
          checked={estado[params.row.id] || false}
          onChange={() => handleToggle(params.row.id)}
        />
      ),
    },
    {
      field: "editar",
      headerName: "Editar",
      sortable: false,
      flex: 1,
      renderCell: (params: any) => (
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={() => handleEdit(params.row.id)}
        >
          Editar
        </Button>
      ),
    },
    {
      field: "eliminar",
      headerName: "Eliminar",
      flex: 0.5,
      sortable: false,
      renderCell: (params: any) => (
        <IconButton onClick={() => confirmDelete(params.row.id)}>
          <Delete color="error" />
        </IconButton>
      ),
    },
  ];

  return (
    <div className="bg-[#FAFAFA] py-[20px] px-12">
      <div className="flex flex-row justify-between items-center bg-[#FAFAFA] ">
        <Typography variant="h4" sx={{ fontWeight: "500" }}>
          Adicionales
        </Typography>
        <Button
          // className="!absolute !right-[50px] !mt-[-60px]"
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          sx={{ mb: 2 }}
          onClick={handleCreateAdicional}
        >
          Crear Adicional
        </Button>
      </div>

      <Box sx={{ minHeight: 500, width: "100%", mt: 4 }}>
        <DataGrid
          rows={activities}
          columns={columns}
          pageSizeOptions={[15]}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          disableRowSelectionOnClick
          sx={{
            mt: 2,
            "& .MuiDataGrid-row": {
              backgroundColor: "white!important",
            },
            "& .MuiDataGrid-row:hover": {
              backgroundColor: "none!important", // Evita el efecto hover
            },
            "& .MuiDataGrid-cell:focus": {
              outline: "none!important", // Evita el efecto hover
            },
            "& .MuiDataGrid-cell:active": {
              outline: "none!important", // Evita el efecto hover
            },
            "& .MuiDataGrid-cell:focus-within": {
              outline: "none!important", // fondo del header
            },
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "#fafafa!important",
            },
            "& .MuiDataGrid-columnHeaders [role='row']": {
              backgroundColor: "#fafafa!important",
            },
          }}
          slots={{
            footer: activities.length > 15 ? undefined : () => null,
          }}
        />
      </Box>

      {/* Dialog de confirmación */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>
          ¿Estás seguro de que querés eliminar este adicional?
        </DialogTitle>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleDelete} color="error">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AdicionalesPage;
