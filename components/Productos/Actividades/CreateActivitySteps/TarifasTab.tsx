import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Divider,
  Alert,
  Grid,
  Dialog,
  DialogContent,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { EditIcon } from "lucide-react";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";

export interface Tarifa {
  id?: number;
  nombre: string;
  nombre_en: string | null;
  precio: number;
  moneda: string;
  es_principal?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface TarifaTabProps {
  tarifas: Tarifa[];
  onTarifasChange: (tarifas: Tarifa[]) => void;
}

const TarifasTab = ({ tarifas, onTarifasChange }: TarifaTabProps) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    nombre_en: "",
    precio: "",
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tarifaToDelete, setTarifaToDelete] = useState<Tarifa | null>(null);

  const handleAddClick = () => {
    setShowForm(true);
    setEditingIndex(null);
    setError("");
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData({ nombre: "", nombre_en: "", precio: "" });
    setEditingIndex(null);
  };

  const handleSaveTarifa = () => {
    if (!formData.nombre || !formData.precio) {
      setError("El nombre y el precio son obligatorios");
      return;
    }

    const newTarifa: Tarifa = {
      nombre: formData.nombre,
      nombre_en: formData.nombre_en || null,
      precio: Number(formData.precio),
      moneda: "USD",
    };

    if (editingIndex !== null) {
      const updatedTarifas = [...tarifas];
      updatedTarifas[editingIndex] = newTarifa;
      onTarifasChange(updatedTarifas);
    } else {
      onTarifasChange([...tarifas, newTarifa]);
    }

    setShowForm(false);
    setFormData({ nombre: "", nombre_en: "", precio: "" });
    setEditingIndex(null);
  };

  const handleDelete = (index: number) => {
    setTarifaToDelete(tarifas[index]);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (tarifaToDelete) {
      const index = tarifas.findIndex(
        (t) =>
          t.nombre === tarifaToDelete.nombre &&
          t.precio === tarifaToDelete.precio
      );
      if (index !== -1) {
        onTarifasChange(tarifas.filter((_, i) => i !== index));
      }
    }
    setDeleteModalOpen(false);
    setTarifaToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setTarifaToDelete(null);
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setFormData({
      nombre: tarifas[index].nombre,
      nombre_en: tarifas[index].nombre_en || "",
      precio: tarifas[index].precio.toString(),
    });
    setShowForm(true);
  };

  // Si no hay tarifas, mostramos el formulario directamente
  if (tarifas.length === 0 && !showForm) {
    setShowForm(true);
  }

  return (
    <div>
      {tarifas.length > 0 && !showForm && editingIndex === null && (
        <div className="flex flex-wrap gap-4">
          {tarifas.map((tarifa, index) => (
            <div
              key={index}
              className="w-[540px] h-[115px] flex justify-between items-center border border-gray-200 rounded-[8px] p-6 mb-4"
            >
              <div>
                <h3 className="text-xl font-semibold">{tarifa.nombre}</h3>
                {tarifa.nombre_en && (
                  <p className="text-gray-600">{tarifa.nombre_en}</p>
                )}
                <h3 className="text-xl mt-2 font-medium">
                  {tarifa.moneda} ${tarifa.precio}
                </h3>
              </div>

              <div className="flex gap-2">
                <button
                  className="px-4 py-2  text-red-500 rounded hover:text-red-600 flex items-center "
                  onClick={() => handleDelete(index)}
                >
                  <DeleteIcon className="w-5 h-5" />
                </button>
                <button
                  className="pr-4  text-gray-500 rounded hover:text-gray-600"
                  onClick={() => handleEdit(index)}
                >
                  <EditIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="max-w-[540px] border border-gray-200 rounded-[8px] p-6 mb-4">
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="mb-2 font-medium text-base leading-[1.5] tracking-[0.009em]">
                Nombre de la tarifa en español
              </p>
              <TextField
                fullWidth
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                placeholder="Ej: Adulto"
                variant="outlined"
              />
            </div>
            <div>
              <p className="mb-2 font-medium text-base leading-[1.5] tracking-[0.009em]">
                Nombre de la tarifa en inglés
              </p>
              <TextField
                fullWidth
                value={formData.nombre_en}
                onChange={(e) =>
                  setFormData({ ...formData, nombre_en: e.target.value })
                }
                placeholder="E.g. Adult"
                variant="outlined"
              />
            </div>
          </div>

          <div className="mb-4">
            <p className="mb-2 font-medium text-base leading-[1.5] tracking-[0.009em]">
              Precio
            </p>
            <TextField
              fullWidth
              type="number"
              value={formData.precio}
              onChange={(e) =>
                setFormData({ ...formData, precio: e.target.value })
              }
              InputProps={{
                startAdornment: <span>$</span>,
              }}
              variant="outlined"
              helperText="Indique el precio en USD, sin incluir ningun tipo de impuestos (como IVA, IGV, VAT, etc)"
            />
          </div>

          <div className="flex justify-end gap-4">
            {tarifas.length > 0 && (
              <button
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                onClick={handleCancel}
              >
                Cancelar
              </button>
            )}

            <Button
              className="px-4 py-2  text-white rounded "
              variant="contained"
              onClick={handleSaveTarifa}
            >
              {editingIndex !== null ? "Guardar Tarifa" : "Crear Tarifa"}
            </Button>
          </div>
        </div>
      )}

      {!showForm && (
        <Button
          variant="contained"
          className="mt-4 px-6 py-2  text-white rounded  uppercase font-semibold"
          onClick={handleAddClick}
        >
          + CREAR NUEVA TARIFA
        </Button>
      )}

      {/* Modal de confirmación para eliminar */}
      <Dialog
        open={deleteModalOpen}
        onClose={handleDeleteCancel}
        maxWidth="xs"
        fullWidth
      >
        <DialogContent sx={{ padding: "70px" }}>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-6">
              <ReportProblemIcon sx={{ fontSize: 48, color: "#FF9800" }} />
              <Typography
                variant="h4"
                sx={{ fontWeight: "500", textAlign: "center" }}
              >
                ¿Eliminar tarifa?
              </Typography>
              {tarifaToDelete && (
                <Typography
                  variant="body1"
                  sx={{ textAlign: "center", color: "#666666" }}
                >
                  "{tarifaToDelete.nombre}" - ${tarifaToDelete.precio}
                </Typography>
              )}
            </div>

            <div className="flex flex-row gap-3 items-center justify-center uppercase">
              <Button
                variant="text"
                onClick={handleDeleteCancel}
                sx={{
                  color: "#000000",
                  textTransform: "uppercase",
                  fontSize: "16px",
                }}
              >
                Mejor no
              </Button>
              <Button
                variant="contained"
                onClick={handleDeleteConfirm}
                sx={{
                  backgroundColor: "#f47920",
                  "&:hover": {
                    backgroundColor: "#f47920",
                  },
                  textTransform: "uppercase",
                  fontSize: "16px",
                }}
              >
                Sí, eliminar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TarifasTab;
