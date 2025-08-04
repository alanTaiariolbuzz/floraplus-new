import { CircularProgress, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/app/(protected)/gestion-dinamica/nueva/components/ToastContext";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Button as MuiButton,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

interface User {
  id: string;
  nombre: string;
  apellido?: string;
  correo: string;
  funcion: string;
}

interface NewUserForm {
  nombre: string;
  apellido: string;
  email: string;
  rol: "admin" | "user";
}

export const ConfigUsers = () => {
  const { customUser } = useUser();
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<NewUserForm>({
    nombre: "",
    apellido: "",
    email: "",
    rol: "user", // Por defecto usuario regular
  });
  const [errors, setErrors] = useState<{
    nombre?: string;
    apellido?: string;
    email?: string;
    rol?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    userId: string | null;
    userName: string;
    apellido: string;
  }>({
    isOpen: false,
    userId: null,
    userName: "",
    apellido: "",
  });

  // Función para cargar usuarios desde la API
  const loadUsuarios = async () => {
    if (!customUser?.agencia_id) {
      setError("No se pudo obtener el ID de la agencia");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/usuarios", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-agencia-id": customUser.agencia_id.toString(),
        },
      });

      const result = await response.json();

      if (response.ok) {
        // Transformar los datos de la API al formato esperado por el componente
        const transformedUsers = result.resultado.map((user: any) => ({
          id: user.id,
          nombre: user.nombre,
          apellido: user.apellido,
          correo: user.email,
          funcion: user.rol_id === 2 ? "Administrador" : "Usuario",
        }));
        setUsuarios(transformedUsers);
      } else {
        setError(result.message || "Error al cargar usuarios");
      }
    } catch (error) {
      setError("Error de conexión. Por favor, intente nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar usuarios al montar el componente
  useEffect(() => {
    loadUsuarios();
  }, [customUser?.agencia_id]);

  const handleDelete = async (id: string) => {
    // Buscar el usuario en la lista para verificar si es admin
    const usuario = usuarios.find((u) => u.id === id);

    if (!usuario) {
      console.error("Usuario no encontrado");
      return;
    }

    // No permitir eliminar administradores
    if (usuario.funcion === "Administrador") {
      showToast("No se puede eliminar un administrador");
      return;
    }

    // Abrir diálogo de confirmación
    setDeleteDialog({
      isOpen: true,
      userId: id,
      userName: usuario.nombre,
      apellido: usuario.apellido || "",
    });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.userId) return;

    try {
      const response = await fetch(`/api/usuarios/${deleteDialog.userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-agencia-id": customUser?.agencia_id?.toString() || "",
        },
      });

      const result = await response.json();

      if (response.ok) {
        // Remover el usuario de la lista local
        setUsuarios((prev) => prev.filter((u) => u.id !== deleteDialog.userId));
        showToast("Usuario eliminado exitosamente");
      } else {
        showToast(result.message || "Error al eliminar usuario");
      }
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      showToast("Error de conexión. Por favor, intente nuevamente.");
    } finally {
      setDeleteDialog({
        isOpen: false,
        userId: null,
        userName: "",
        apellido: "",
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {
      nombre?: string;
      apellido?: string;
      email?: string;
      rol?: string;
    } = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido";
    }

    if (!formData.apellido.trim()) {
      newErrors.apellido = "El apellido es requerido";
    }

    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Por favor ingrese un email válido";
    }

    if (!formData.rol) {
      newErrors.rol = "Debe seleccionar un rol";
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
    if (!customUser?.agencia_id) {
      showToast("No se pudo obtener el ID de la agencia");
      return;
    }

    setIsSubmitting(true);

    try {
      // Determinar el endpoint según el rol seleccionado
      const endpoint =
        formData.rol === "admin"
          ? "/api/usuarios/agencyadmin"
          : "/api/usuarios/agencyuser";

      const requestBody = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        agencia_id: customUser.agencia_id,
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (response.ok) {
        showToast(result.message || "Usuario invitado exitosamente");
        setFormData({ nombre: "", apellido: "", email: "", rol: "user" });
        // Recargar la lista de usuarios después de agregar uno nuevo
        setTimeout(() => {
          setIsModalOpen(false);
          loadUsuarios();
        }, 2000);
      } else {
        showToast(result.message || "Error al invitar usuario");
      }
    } catch (error) {
      showToast("Error de conexión. Por favor, intente nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setFormData({ nombre: "", apellido: "", email: "", rol: "user" });
    setErrors({});
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ nombre: "", apellido: "", email: "", rol: "user" });
    setErrors({});
  };


  return (
    <div className="flex flex-col bg-white pb-5 rounded-[8px] p-5 shadow-sm border border-[#E0E0E0]">
      <div className="flex justify-between items-center mb-3">
        <Typography variant="subtitle1" sx={{ fontWeight: "500" }}>
          Usuarios
        </Typography>
        <MuiButton
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          sx={{ mb: 2 }}
          onClick={handleOpenModal}
        >
          Crear Usuario
        </MuiButton>
      </div>

      <div className="rounded-[8px] overflow-hidden border border-[#E0E0E0]">
        <table className="min-w-full border-separate border-spacing-0">
          <thead className="bg-[#FAFAFA] h-[55px]">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium tracking-normal">
                Nombre y apellido
              </th>

              <th className="px-6 py-3 text-left text-sm font-medium tracking-normal">
                Correo
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium tracking-normal">
                Función
              </th>
              <th className="px-6 py-3 text-right text-sm font-medium tracking-normal">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {isLoading ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  <div className="flex justify-center items-center h-[120px]">
                    <CircularProgress />
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-4 text-center text-sm text-red-500"
                >
                  {error}
                </td>
              </tr>
            ) : usuarios.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No hay usuarios registrados
                </td>
              </tr>
            ) : (
              usuarios.map((usuario) => (
                <tr
                  key={usuario.id}
                  className="hover:bg-gray-50 transition-colors "
                >
                  <td className="px-6 py-4 text-sm border-t border-[#E0E0E0]">
                    {usuario.nombre} {usuario.apellido}
                  </td>

                  <td className="px-6 py-4 text-sm border-t border-[#E0E0E0]">
                    {usuario.correo}
                  </td>
                  <td className="px-6 py-4 text-sm border-t border-[#E0E0E0]">
                    <Link
                      href={`/usuarios/${usuario.id}`}
                      className="hover:underline"
                    >
                      {usuario.funcion}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm border-t border-[#E0E0E0] text-right">
                    {usuario.funcion !== "Administrador" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(usuario.id);
                        }}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        title="Eliminar usuario"
                      >
                        <DeleteIcon />
                      </button>
                    )}
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
          Agregar Nuevo Usuario
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

            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
                Tipo de usuario
              </Typography>
              <FormControl fullWidth error={!!errors.rol}>
                <InputLabel>Tipo de usuario</InputLabel>
                <Select
                  value={formData.rol}
                  label="Tipo de usuario"
                  onChange={(e) => handleInputChange("rol", e.target.value)}
                >
                  <MenuItem value="user">Usuario regular</MenuItem>
                  <MenuItem value="admin">Administrador de agencia</MenuItem>
                </Select>
                {errors.rol && (
                  <Typography variant="caption" color="error">
                    {errors.rol}
                  </Typography>
                )}
              </FormControl>
            </Box>

            <div className="flex justify-end gap-3 pt-4">
              <p
                className="px-4 mr-4 py-2 cursor-pointer font-medium text-base text-[#9E9E9E] 
            leading-[1.75] tracking-[0.02857em] uppercase "
                onClick={handleCloseModal}
              >
                CANCELAR
              </p>
              <Button
                type="submit"
                variant="orange"
                disabled={isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? "Enviando..." : "Invitar Usuario"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para eliminar usuario */}
      <Dialog
        open={deleteDialog.isOpen}
        onClose={() =>
          setDeleteDialog({
            isOpen: false,
            userId: null,
            userName: "",
            apellido: "",
          })
        }
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="text-xl font-semibold mb-4">
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent className="p-6">
          <Typography variant="body1" className="mb-6">
            ¿Está seguro de que desea eliminar al usuario{" "}
            <strong>
              {deleteDialog.userName} {deleteDialog.apellido}
            </strong>
            ?
          </Typography>
          <Typography variant="body2" color="text.secondary" className="mb-6">
            Esta acción no se puede deshacer.
          </Typography>
          <div className="flex justify-end gap-3">
            <MuiButton
              onClick={() =>
                setDeleteDialog({
                  isOpen: false,
                  userId: null,
                  userName: "",
                  apellido: "",
                })
              }
              variant="outlined"
              color="primary"
            >
              Cancelar
            </MuiButton>
            <MuiButton
              onClick={confirmDelete}
              variant="contained"
              color="error"
            >
              Eliminar
            </MuiButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
