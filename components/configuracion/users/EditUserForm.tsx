// /components/configuracion/users/EditUserForm.tsx
"use client";

import { useState, useEffect } from "react";
import { Typography, Box, Button, TextField, FormControl, InputLabel, Select, MenuItem } from "@mui/material";

interface EditUserFormProps {
  initialData: {
    nombre: string;
    apellido: string;
    email: string; // El email no se edita, pero es útil mostrarlo
    rol: "admin" | "user";
  };
  isSubmitting: boolean;
  onSave: (formData: any) => void;
  onCancel: () => void;
}

export const EditUserForm = ({ initialData, isSubmitting, onSave, onCancel }: EditUserFormProps) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState<{ nombre?: string; apellido?: string; rol?: string }>({});

  // Sincroniza el estado del formulario con los datos iniciales
  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} className="space-y-4 max-w-2xl bg-white p-6 rounded-lg shadow">
      {/* Tu formulario con TextField, Select, etc. */}
      <TextField
        fullWidth
        label="Nombre"
        variant="outlined"
        value={formData.nombre}
        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
        error={!!errors.nombre}
        helperText={errors.nombre}
      />
      {/* ... otros campos */}
      <div className="flex justify-end gap-3 pt-4">
        <Button onClick={onCancel} variant="outlined">
          Cancelar
        </Button>
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>
    </Box>
  );
};