"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  Switch,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";
import EmptyState from "@/components/Productos/EmptyState";
import AddIcon from "@mui/icons-material/Add";

interface Transporte {
  id: number;
  titulo: string;
  direccion: string;
  precio: number;
  cupo_maximo: number;
  limite_horario: boolean;
  limite_horas: number;
  mensaje: string;
  activo: boolean;
  actividad_ids: number[];
  horarios: { id: number; hora_salida: string; hora_llegada: string }[];
}

const TransportePage = () => {
  const router = useRouter();
  // const [transportes, setTransportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  // const [selectedTransporte, setSelectedTransporte] = useState(null);
  const [transportes, setTransportes] = useState<Transporte[]>([]);
  const [selectedTransporte, setSelectedTransporte] =
    useState<Transporte | null>(null);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  useEffect(() => {
    const fetchTransportes = async () => {
      try {
        const response = await fetch(`${siteUrl}/api/transportes`);
        const data = await response.json();
        setTransportes(Array.isArray(data.data) ? data.data : []);
      } catch (error) {
        console.error("Error al obtener los transportes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransportes();
  }, []);

  const handleEdit = (id: number) => {
    router.push(`/productos/transportes/editar/${id}`);
  };

  const handleDeleteClick = (transporte: Transporte) => {
    setSelectedTransporte(transporte);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTransporte) return;

    try {
      const response = await fetch(
        `${siteUrl}/api/transportes?id=${selectedTransporte.id}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setTransportes((prev) =>
          prev.filter((t) => t.id !== selectedTransporte.id)
        );
      } else {
        console.error("Error al eliminar el transporte.");
      }
    } catch (error) {
      console.error("Error en la solicitud DELETE:", error);
    } finally {
      setDeleteDialogOpen(false);
      setSelectedTransporte(null);
    }
  };

  const handleToggleEstado = async (
    transporte: Transporte,
    nuevoEstado: boolean
  ) => {
    try {
      const datosActualizados: Transporte = {
        ...transporte,
        activo: nuevoEstado,
      };

      const res = await fetch(
        `${siteUrl}/api/transportes?id=${transporte.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(datosActualizados),
        }
      );

      if (res.ok) {
        setTransportes((prev) =>
          prev.map((t) =>
            t.id === transporte.id ? { ...t, activo: nuevoEstado } : t
          )
        );
      } else {
        const errorText = await res.text();
        console.error("Error en la actualización:", errorText);
      }
    } catch (error) {
      console.error("Error al actualizar estado:", error);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (transportes.length < 1) {
    return (
      <EmptyState
        entityName="Transportes"
        redirectPath="/productos/transportes/nuevo"
      />
    );
  }

  return (
    <Box>
      <div className="relative">
        <Button
          className="!absolute !right-[50px] !mt-[-60px]"
          variant="contained"
          color="success"
          startIcon={<AddIcon />}
          sx={{ mb: 2 }}
          onClick={() => router.push("/productos/transportes/nuevo")}
        >
          Crear Nuevo adicional
        </Button>
      </div>

      <Box display="flex" flexWrap="wrap" gap={3}>
        {transportes.map((transporte) => (
          <Card key={transporte.id} sx={{ width: 360, height: 270 }}>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={1}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={transporte.activo}
                      onChange={(e) =>
                        handleToggleEstado(transporte, e.target.checked)
                      }
                    />
                  }
                  label={transporte.activo ? "Publicado" : "Borrador"}
                />
                <Box display="flex" gap={1}>
                  <IconButton
                    onClick={() => handleEdit(transporte.id)}
                    color="primary"
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDeleteClick(transporte)}
                    color="error"
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              <Typography variant="h6" fontWeight="bold" mb={1}>
                {transporte.titulo}
              </Typography>

              {transporte.horarios?.[0] && (
                <Box display="flex" gap={3} mb={1}>
                  <Typography variant="body2">
                    Salida: {transporte.horarios[0].hora_salida.slice(0, 5)}
                  </Typography>
                  {transporte.horarios[0].hora_llegada && (
                    <Typography variant="body2">
                      Llegada: {transporte.horarios[0].hora_llegada.slice(0, 5)}
                    </Typography>
                  )}
                </Box>
              )}

              <Typography variant="body2" color="text.secondary">
                USD ${transporte.precio.toFixed(2)} · {transporte.cupo_maximo}{" "}
                cupos
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>¿Eliminar transporte?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar{" "}
            <strong>{selectedTransporte?.titulo}</strong>? Esta acción no se
            puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TransportePage;
