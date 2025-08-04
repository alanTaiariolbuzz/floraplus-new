// app/(protected)/productos/descuentos/page.tsx
"use client";

import {
  Box,
  Button,
  Card,
  Typography,
  Switch,
  IconButton,
  Dialog,
  DialogTitle,
  DialogActions,
  FormControlLabel,
  CardContent,
  CircularProgress,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import EmptyState from "@/components/Productos/EmptyState";
import { Delete, Edit } from "@mui/icons-material";

interface Descuento {
  id: number;
  titulo: string;
  tipo: string;
  valor: number;
  alcance: string;
  valido_desde: string;
  valido_hasta: string;
  activo: boolean;
}

const API_URL = `${process.env.NEXT_PUBLIC_SITE_URL}/api/descuentos`;

const DescuentosPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [descuentos, setDescuentos] = useState<Descuento[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadDiscounts();
  }, []);

  const loadDiscounts = async () => {
    try {
      const res = await fetch(API_URL);
      const { data } = await res.json();
      setDescuentos(data);
    } catch (err) {
      console.error("Error al cargar descuentos", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    router.push("/productos/descuentos/nuevo");
  };

  const handleEdit = (id: number) => {
    router.push(`/productos/descuentos/editar/${id}`);
  };

  const handleToggle = async (descuento: Descuento) => {
    try {
      await fetch(`${API_URL}?id=${descuento.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...descuento, activo: !descuento.activo }),
      });
      loadDiscounts();
    } catch (err) {
      console.error("Error al cambiar estado", err);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    try {
      await fetch(`${API_URL}?id=${selectedId}`, {
        method: "DELETE",
      });
      setDialogOpen(false);
      setSelectedId(null);
      loadDiscounts();
    } catch (err) {
      console.error("Error al eliminar", err);
    }
  };

  const openDeleteDialog = (id: number) => {
    setSelectedId(id);
    setDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDialogOpen(false);
    setSelectedId(null);
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <CircularProgress />
      </div>
    );

  if (descuentos.length === 0) {
    return (
      <EmptyState
        entityName="Descuentos"
        redirectPath="/productos/descuentos/nuevo"
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
          onClick={handleCreate}
        >
          Crear Nuevo Descuento!
        </Button>
      </div>

      <Box display="flex" flexWrap="wrap" gap={3}>
        {descuentos.map((descuento) => (
          <Card key={descuento.id} sx={{ width: 360, height: 270 }}>
            <CardContent>
              <Box>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        checked={descuento.activo}
                        onChange={() => handleToggle(descuento)}
                      />
                    }
                    color="success"
                    label={descuento.activo ? "Publicado" : "Borrador"}
                  />
                  <Box display="flex" gap={1}>
                    <IconButton
                      onClick={() => handleEdit(descuento.id)}
                      color="primary"
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      onClick={() => openDeleteDialog(descuento.id)}
                      color="error"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                <Typography variant="h6" fontWeight="bold">
                  {descuento.titulo}
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  Tipo: {descuento.tipo}
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  Valor: {descuento.valor}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Dialog open={dialogOpen} onClose={closeDeleteDialog}>
        <DialogTitle>¿Estás seguro de eliminar este descuento?</DialogTitle>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancelar</Button>
          <Button onClick={handleDelete} color="error">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DescuentosPage;
