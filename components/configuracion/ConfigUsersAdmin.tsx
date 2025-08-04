import { CircularProgress, Skeleton, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Button as MuiButton,
  TextField,
  Box,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

interface User {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  activo: boolean;
}

interface NewUserForm {
  nombre: string;
  apellido: string;
  email: string;
}

export const ConfigUsersAdmin = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<NewUserForm>({
    nombre: "",
    apellido: "",
    email: "",
  });
  const [errors, setErrors] = useState<Partial<NewUserForm>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  useEffect(() => {
    fetch(`${siteUrl}/api/usuarios/superadmin`)
      .then((response) => response.json())
      .then((result) => {
        setUsuarios(result.resultado || []);
      })
      .catch((error) => {
        console.error("Error loading users:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleDelete = (id: string) => {
    // Implement delete functionality

  };

  const validateForm = (): boolean => {
    const newErrors: Partial<NewUserForm> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido";
    }

    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Por favor ingrese un email válido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof NewUserForm, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Limpiar error cuando el usuario comienza a escribir
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await fetch(`${siteUrl}/api/usuarios/superadmin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          apellido: formData.apellido,
          email: formData.email,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitMessage({
          type: "success",
          message: result.message || "Usuario creado exitosamente",
        });
        setFormData({ nombre: "", apellido: "", email: "" });

        // Recargar la lista de usuarios
        const refreshResponse = await fetch(
          `${siteUrl}/api/usuarios/superadmin`
        );
        const refreshResult = await refreshResponse.json();
        if (refreshResult.resultado) {
          setUsuarios(refreshResult.resultado);
        }

        setTimeout(() => {
          setIsModalOpen(false);
          setSubmitMessage(null);
        }, 2000);
      } else {
        setSubmitMessage({
          type: "error",
          message: result.message || "Error al crear el usuario",
        });
      }
    } catch (error) {
      setSubmitMessage({
        type: "error",
        message: "Error de conexión. Por favor, intente nuevamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setFormData({ nombre: "", apellido: "", email: "" });
    setErrors({});
    setSubmitMessage(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ nombre: "", apellido: "", email: "" });
    setErrors({});
    setSubmitMessage(null);
  };

  return (
    <div className="flex flex-col bg-white  rounded-[8px]  shadow-sm border border-[#E0E0E0]">
      <div className="flex justify-end gap-4  items-center p-5">
        <TextField
          label="Buscar"
          variant="outlined"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: "270px", height: "45px" }}
          InputProps={{
            endAdornment: (
              <SearchIcon sx={{ color: "action.active", mr: 1, my: 0.5 }} />
            ),
          }}
          InputLabelProps={{
            style: { fontSize: "16px" },
          }}
        />
        <MuiButton
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenModal}
        >
          Crear Usuario
        </MuiButton>
      </div>

      <div className="rounded-[8px] overflow-hidden ">
        <table className="min-w-full border-separate border-spacing-0">
          <thead className="bg-[#FAFAFA] h-[55px]">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium tracking-normal">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium tracking-normal">
                Correo
              </th>

              <th className="px-6 py-3 text-left text-sm font-medium tracking-normal">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-sm font-medium tracking-normal">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm">
                  <div className="flex justify-center items-center h-[160px]">
                    <CircularProgress />
                  </div>
                </td>
              </tr>
            ) : usuarios?.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm">
                  No hay usuarios registrados
                </td>
              </tr>
            ) : (
              usuarios?.map((usuario) => (
                <tr
                  key={usuario.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4 text-sm border-t border-[#E0E0E0]">
                    {usuario.nombre} {usuario.apellido}
                  </td>
                  <td className="px-6 py-4 text-sm border-t border-[#E0E0E0]">
                    {usuario.email}
                  </td>

                  <td className="px-6 py-4 text-sm border-t border-[#E0E0E0]">
                    <p
                      className={`font-normal text-[13px] leading-[18px] tracking-[0.16px] p-2 rounded-[8px] w-[70px] text-center ${
                        usuario.activo
                          ? "bg-[#E8F5E9] text-[#2E7D32]"
                          : "bg-[#FFF3E0] text-[#EF6C00]"
                      }`}
                    >
                      {usuario.activo ? "Activo" : "Inactivo"}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm border-t border-[#E0E0E0] text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(usuario.id);
                      }}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <DeleteIcon />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal para agregar usuario */}
      <Dialog
        open={isModalOpen}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="text-xl font-semibold mb-4">
          Crear Nuevo Usuario Administrador
        </DialogTitle>
        <DialogContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
                Nombre
              </Typography>
              <TextField
                fullWidth
                placeholder="Ingrese el nombre..."
                variant="outlined"
                value={formData.nombre}
                onChange={(e) => handleInputChange("nombre", e.target.value)}
                error={!!errors.nombre}
                helperText={errors.nombre}
              />
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
                Apellido
              </Typography>
              <TextField
                fullWidth
                placeholder="Ingrese el apellido..."
                variant="outlined"
                value={formData.apellido}
                onChange={(e) => handleInputChange("apellido", e.target.value)}
                error={!!errors.apellido}
                helperText={errors.apellido}
              />
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
                Email
              </Typography>
              <TextField
                fullWidth
                placeholder="usuario@ejemplo.com"
                variant="outlined"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                error={!!errors.email}
                helperText={errors.email}
              />
            </Box>

            {submitMessage && (
              <div
                className={`p-3 rounded-md ${
                  submitMessage.type === "success"
                    ? "bg-green-50 border border-green-200 text-green-700"
                    : "bg-red-50 border border-red-200 text-red-700"
                }`}
              >
                {submitMessage.message}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <p
                className="px-4 mr-4 py-2 cursor-pointer font-medium text-base text-[#9E9E9E] 
            leading-[1.75] tracking-[0.02857em] uppercase "
                onClick={handleCloseModal}
              >
                CANCELAR
              </p>
              <MuiButton
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? "Creando..." : "Crear Usuario"}
              </MuiButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
