// app/(protected)/configuracion/users/[id]/page.tsx
"use client"; // Marca el componente como un Client Component

import { useEffect, useState } from "react";
import { CircularProgress, Typography, TextField, Button } from "@mui/material";

// Define la interfaz para los datos del usuario que esperas recibir
interface User {
	id: string;
	nombre: string;
	apellido?: string;
	correo: string;
	funcion: string;
}

// Next.js automáticamente pasa los "params" de la ruta
export default function EditUserPage({ params }: { params: { id: string } }) {
	// El ID del usuario está en params.id
	const { id } = params;

	const [userData, setUserData] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Este useEffect se ejecuta cuando el componente se monta para cargar los datos
	useEffect(() => {
		const fetchUserData = async () => {
			try {
				const response = await fetch(`/api/usuarios/${id}`);
				if (!response.ok) {
					throw new Error("Error al cargar los datos del usuario.");
				}
				const data = await response.json();
				setUserData(data.user); // Asumiendo que la API devuelve { user: ... }
			} catch (err) {
				setError("No se pudo cargar la información del usuario.");
			} finally {
				setIsLoading(false);
			}
		};

		fetchUserData();
	}, [id]); // El array de dependencias asegura que se vuelva a cargar si el ID cambia

	// Lógica de visualización basada en el estado
	if (isLoading) {
		return (
			<div className="flex justify-center items-center h-64">
				<CircularProgress />
			</div>
		);
	}

	if (error || !userData) {
		return <Typography color="error">{error || "Usuario no encontrado."}</Typography>;
	}

	// Lógica para manejar el envío del formulario de edición
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// Aquí iría la llamada a la API con un método PUT o PATCH
		console.log("Datos a enviar para actualizar:", userData);
		// fetch(`/api/usuarios/${id}`, { method: "PUT", body: JSON.stringify(userData) })
		// ... y luego manejar la respuesta y la navegación
	};

	return (
		<div>
			<Typography variant="h4" gutterBottom>
				Editar Usuario
			</Typography>

			<form onSubmit={handleSubmit} className="space-y-4">
				<TextField
					label="Nombre"
					variant="outlined"
					fullWidth
					value={userData.nombre}
					onChange={(e) =>
						setUserData({ ...userData, nombre: e.target.value })
					}
				/>
				<TextField
					label="Correo Electrónico"
					variant="outlined"
					fullWidth
					type="email"
					value={userData.correo}
					onChange={(e) =>
						setUserData({ ...userData, correo: e.target.value })
					}
				/>
				{/* Agrega más campos según tus necesidades */}
				<Button type="submit" variant="contained" color="primary">
					Guardar Cambios
				</Button>
			</form>
		</div>
	);
}