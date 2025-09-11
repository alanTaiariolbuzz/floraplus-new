"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/(protected)/gestion-dinamica/nueva/components/ToastContext";


import {
	Box,
	TextField,
	Typography,
	Button,
	Paper,
	Alert,
	CircularProgress,
	Grid,
	RadioGroup,
	FormControlLabel,
	Radio,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	FormHelperText,
} from "@mui/material";
import parsePhoneNumberFromString, {
	parsePhoneNumber,
	isValidPhoneNumber,
} from "libphonenumber-js";
import { matchIsValidTel, MuiTelInput } from "mui-tel-input";


interface FormData {
	agencia: {
		nombre_sociedad: string;
		nombre_comercial: string;
		cedula_juridica: string;
		pais: string;
		sitio_web: string;
		direccion_line1: string;
		direccion_city: string;
		direccion_state: string;
		direccion_postal_code: string;
		businessType: string;
	};
	condiciones_comerciales: {
		comision: string; // Changed from number | null to string
		terminos_condiciones: string;
	};
	configuracion_fees: {
		tax: string; // Changed from number | null to string
		convenience_fee_fijo: boolean;
		convenience_fee_fijo_valor: string; // Changed from number | null to string
		convenience_fee_variable: boolean;
		convenience_fee_variable_valor: string; // Changed from number | null to string
	};
	usuario_administrador: {
		nombre: string;
		mail: string;
		telefono: string;
		dob: {
			day: number;
			month: number;
			year: number;
		} | null;
	};
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

const parseAddress = (direccion: string) => {
	// Ejemplo: "1010 Metros Oeste Multiplaza, 27, San José Province, San José, 10203, Costa Rica"
	const parts = direccion.split(",").map((part) => part.trim());

	if (parts.length >= 5) {
		return {
			line1: parts[0] + ", " + parts[1], // "1010 Metros Oeste Multiplaza, 27"
			city: parts[3], // "San José"
			state: parts[2], // "San José Province"
			postal_code: parts[4], // "10203"
		};
	} else if (parts.length >= 3) {
		return {
			line1: parts[0],
			city: parts[1],
			state: parts[2],
			postal_code: parts[3] || "",
		};
	} else {
		return {
			line1: direccion,
			city: "",
			state: "",
			postal_code: "",
		};
	}
};

export default function CreateAccount() {
   	const router = useRouter();
    const { showToast } = useToast();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [emailError, setEmailError] = useState<string>("");
	const [feeType, setFeeType] = useState<"variable" | "fixed">("variable");

	const [formData, setFormData] = useState<FormData>({
		agencia: {
			nombre_sociedad: "",
			nombre_comercial: "",
			cedula_juridica: "",
			pais: "",
			sitio_web: "",
			direccion_line1: "",
			direccion_city: "",
			direccion_state: "",
			direccion_postal_code: "",
			businessType: "company",
		},
		condiciones_comerciales: {
			comision: "0",
			terminos_condiciones: "Términos y condiciones por defecto",
		},
		configuracion_fees: {
			tax: "",
			convenience_fee_fijo: false,
			convenience_fee_fijo_valor: "",
			convenience_fee_variable: true,
			convenience_fee_variable_valor: "",
		},
		usuario_administrador: {
			nombre: "",
			mail: "",
			telefono: "",
			dob: null
				
		},
	});

	const [phoneError, setPhoneError] = useState<string>("");

	const validateAndFormatPhone = (phone: string) => {
		const isValid = matchIsValidTel(phone);
		return {
			isValid,
			formattedNumber: isValid ? phone.replace(/\s+/g, "") : "",
		};
	};

	const handlePhoneChange = (phone: string) => {
		setFormData((prev) => ({
			...prev,
			usuario_administrador: {
				...prev.usuario_administrador,
				telefono: phone,
			},
		}));
		setPhoneError("");
	};

	const handlePhoneBlur = (value: string) => {
		if (!value) {
			setPhoneError("El teléfono es requerido");
			return;
		}
		const { isValid } = validateAndFormatPhone(value);
		setPhoneError(
			isValid ? "" : "Por favor ingrese un número de teléfono válido"
		);
	};

	const validateEmail = (email: string) => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	};

	const handleEmailChange = (value: string) => {
		setFormData((prev) => ({
			...prev,
			usuario_administrador: {
				...prev.usuario_administrador,
				mail: value,
			},
		}));
		setEmailError("");
	};

	const handleEmailBlur = (value: string) => {
		if (!validateEmail(value)) {
			setEmailError("Por favor ingrese un email válido");
		}
	};

	const handleFeeTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const newFeeType = event.target.value as "variable" | "fixed";
		setFeeType(newFeeType);

		setFormData((prev) => ({
			...prev,
			configuracion_fees: {
				...prev.configuracion_fees,
				convenience_fee_fijo: newFeeType === "fixed",
				convenience_fee_variable: newFeeType === "variable",
				convenience_fee_fijo_valor:
					newFeeType === "fixed"
						? prev.configuracion_fees.convenience_fee_fijo_valor
						: "",
				convenience_fee_variable_valor:
					newFeeType === "variable"
						? prev.configuracion_fees.convenience_fee_variable_valor
						: "",
			},
		}));
	};

	// Helper function to validate numeric input
	const validateNumericInput = (value: string): boolean => {
		// Allow empty string, single dot, or valid number format
		if (value === "" || value === ".") return true;

		// Check if it's a valid number (allows decimals with dot)
		const numericRegex = /^\d*\.?\d*$/;
		return numericRegex.test(value);
	};

	const handleChange = (
		section: keyof FormData,
		field: string,
		value: string | number
	) => {
		const stringValue = value.toString();

		if (section === "usuario_administrador") {
			if (field === "telefono") {
				handlePhoneChange(stringValue);
			} else if (field === "mail") {
				handleEmailChange(stringValue);
			} else {
				setFormData((prev) => ({
					...prev,
					[section]: {
						...prev[section],
						[field]: stringValue,
					},
				}));
			}
		} else if (section === "configuracion_fees") {
			if (field === "tax") {
				// Validate numeric input
				if (!validateNumericInput(stringValue)) return;

				setFormData((prev) => ({
					...prev,
					configuracion_fees: {
						...prev.configuracion_fees,
						tax: stringValue,
					},
				}));
			} else if (field === "convenience_fee_value") {
				// Validate numeric input
				if (!validateNumericInput(stringValue)) return;

				setFormData((prev) => ({
					...prev,
					configuracion_fees: {
						...prev.configuracion_fees,
						convenience_fee_fijo_valor: feeType === "fixed" ? stringValue : "",
						convenience_fee_variable_valor:
							feeType === "variable" ? stringValue : "",
					},
				}));
			}
		} else if (section === "condiciones_comerciales" && field === "comision") {
			// Validate numeric input
			if (!validateNumericInput(stringValue)) return;

			setFormData((prev) => ({
				...prev,
				condiciones_comerciales: {
					...prev.condiciones_comerciales,
					comision: stringValue,
				},
			}));
		} else {
			setFormData((prev) => ({
				...prev,
				[section]: {
					...prev[section],
					[field]: stringValue,
				},
			}));
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Validar email antes de enviar
		if (!validateEmail(formData.usuario_administrador.mail)) {
			setEmailError("Por favor ingrese un email válido");
			return;
		}

		// Validar teléfono
		if (!formData.usuario_administrador.telefono) {
			setPhoneError("El teléfono es requerido");
			return;
		}

		const { isValid, formattedNumber } = validateAndFormatPhone(
			formData.usuario_administrador.telefono
		);
		if (!isValid) {
			setPhoneError("Por favor ingrese un número de teléfono válido");
			return;
		}

		// Construir la dirección completa
		const direccionCompleta = [
			formData.agencia.direccion_line1,
			formData.agencia.direccion_city,
			formData.agencia.direccion_state,
			formData.agencia.direccion_postal_code,
			formData.agencia.pais,
		]
			.filter(Boolean)
			.join(", ");

		// Helper function to convert string to number safely
		const parseNumericString = (value: string): number | null => {
			if (!value || value === "") return null;
			const parsed = parseFloat(value);
			return isNaN(parsed) ? null : parsed;
		};

		const dob = formData.usuario_administrador.dob;
		const dobForStripe = dob
		? `${dob.year.toString().padStart(4, "0")}-${dob.month
			.toString()
			.padStart(2, "0")}-${dob.day.toString().padStart(2, "0")}`
		: null; 

		const isIndividual = formData.agencia.businessType === "individual";

		const dataToSend = {
			...formData,
			agencia: {
				...formData.agencia,
				direccion: direccionCompleta,
				nombre_sociedad: formData.agencia.businessType === 'individual' ? formData.usuario_administrador.nombre : formData.agencia.nombre_sociedad,
				dob_representante: dob,
			},
			condiciones_comerciales: {
				...formData.condiciones_comerciales,
				comision: parseNumericString(formData.condiciones_comerciales.comision),
			},
			configuracion_fees: {
				...formData.configuracion_fees,
				tax: parseNumericString(formData.configuracion_fees.tax),
				convenience_fee_fijo_valor: parseNumericString(
				formData.configuracion_fees.convenience_fee_fijo_valor
				),
				convenience_fee_variable_valor: parseNumericString(
				formData.configuracion_fees.convenience_fee_variable_valor
				),
			},
			usuario_administrador: {
				...formData.usuario_administrador,
				dob: dobForStripe,
				telefono: formattedNumber,
			},
			// stripeData: isIndividual
			// 	? {
			// 		individual: {
			// 		first_name: formData.usuario_administrador.nombre.split(" ")[0],
			// 		last_name: formData.usuario_administrador.nombre.split(" ")[1] || "",
			// 		dob: dobForStripe,
			// 		email: formData.usuario_administrador.mail,
			// 		phone: formattedNumber,
			// 		address: {
			// 			line1: formData.agencia.direccion_line1,
			// 			city: formData.agencia.direccion_city,
			// 			state: formData.agencia.direccion_state,
			// 			postal_code: formData.agencia.direccion_postal_code,
			// 			country: formData.agencia.pais,
			// 		},
			// 		},
			// 		business_profile: {
			// 		url: formData.agencia.sitio_web,
			// 		product_description: formData.agencia.nombre_comercial,
			// 		},
			// 		settings: {
			// 		payments: {
			// 			statement_descriptor: formData.agencia.nombre_comercial,
			// 		},
			// 		},
			// 	}
			// 	: undefined,
			stripeData: isIndividual
				? {
						individual: {
							first_name: formData.usuario_administrador.nombre.split(" ")[0],
							last_name: formData.usuario_administrador.nombre.split(" ")[1] || "",
							dob: dobForStripe,
							email: formData.usuario_administrador.mail,
							phone: formattedNumber,
							address: {
								line1: formData.agencia.direccion_line1,
								city: formData.agencia.direccion_city,
								state: formData.agencia.direccion_state,
								postal_code: formData.agencia.direccion_postal_code,
								country: formData.agencia.pais,
							},
						},
						business_profile: {
							url: formData.agencia.sitio_web,
							product_description: formData.agencia.nombre_comercial,
						},
						settings: {
							payments: {
								statement_descriptor: formData.agencia.nombre_comercial,
							},
						},
				  }
				: {
						business_profile: {
							url: formData.agencia.sitio_web,
							product_description: formData.agencia.nombre_comercial,
						},
						settings: {
							payments: {
								statement_descriptor: formData.agencia.nombre_comercial,
							},
						},
						company: {
							name: formData.agencia.nombre_sociedad,
							tax_id: formData.agencia.cedula_juridica,
						},
						representative: {
							first_name: formData.usuario_administrador.nombre.split(" ")[0],
							last_name: formData.usuario_administrador.nombre.split(" ")[1] || "",
							dob: dobForStripe,
							email: formData.usuario_administrador.mail,
							phone: formattedNumber,
							address: {
								line1: formData.agencia.direccion_line1,
								city: formData.agencia.direccion_city,
								state: formData.agencia.direccion_state,
								postal_code: formData.agencia.direccion_postal_code,
								country: formData.agencia.pais,
							},
						},
				  },
		};
		
		setLoading(true);
		setError(null);

		try {
			const response = await fetch(
				`${siteUrl}/api/agencias/onboarding/invitar`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(dataToSend),
				}
			);

			if (!response.ok) {
				const errorData = await response.json();
				if (
					errorData.error?.includes("already been registered") ||
					errorData.error?.includes("ya ha sido registrado")
				) {
					setEmailError("Este email ya está registrado");
					showToast("Este email ya está registrado");
					return;
				}
				throw new Error("Error al crear la agencia");
			}

			showToast("¡Cuenta creada satisfactoriamente!");
			router.push('/admin/cuentas');
		} catch (error) {
			setError("Error al crear la agencia. Por favor, intente nuevamente.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="my-6 px-12">
			<div className="flex flex-row justify-between items-center bg-[#FAFAFA] py-[20px] mb-6">
				<Typography variant="h4" sx={{ fontWeight: "500" }}>
					Crear Nueva Agencia
				</Typography>
			</div>

			<Paper sx={{ p: 3 }}>
				{error && (
					<Alert severity="error" sx={{ mb: 3 }}>
						{error}
					</Alert>
				)}

				<form onSubmit={handleSubmit}>
					<Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
		
						<Typography variant="h6">Información de la Agencia</Typography>
						<TextField
							select
							label="Tipo de Cuenta"
							name="businessType"
							required
							value={formData.agencia.businessType}
							onChange={(e) =>
								handleChange("agencia", "businessType", e.target.value)
							}
						>
							<MenuItem value="company">Empresa</MenuItem>
							<MenuItem value="individual">Persona Física</MenuItem>
							<MenuItem value="non_profit">Organización sin Fines de Lucro</MenuItem>
						</TextField>
						{(formData.agencia.businessType === "company" ||
							formData.agencia.businessType === "non_profit") && (
							<>
								<TextField
									label="Nombre de la Sociedad"
									value={formData.agencia.nombre_sociedad}
									onChange={(e) =>
										handleChange("agencia", "nombre_sociedad", e.target.value)
									}
									required
									fullWidth
									helperText="Nombre legal de la sociedad"
								/>
					
								<TextField
									label="Cédula Jurídica"
									value={formData.agencia.cedula_juridica}
									onChange={(e) =>
										handleChange("agencia", "cedula_juridica", e.target.value)
									}
									required
									fullWidth
									helperText="Número de identificación legal de la sociedad sin guiones ni espacios"
								/>
							</>
						)}

						<TextField
							label="Nombre Comercial"
							value={formData.agencia.nombre_comercial}
							onChange={(e) =>
								handleChange("agencia", "nombre_comercial", e.target.value)
							}
							required
							fullWidth
							helperText="Nombre que se mostrará públicamente"
						/>
						<FormControl fullWidth required>
							<InputLabel id="pais-label">País</InputLabel>
							<Select
								labelId="pais-label"
								id="pais"
								value={formData.agencia.pais}
								label="País"
								onChange={(e) =>
									handleChange("agencia", "pais", e.target.value)
								}
							>
								<MenuItem value="">
									<em>Selecciona un país</em>
								</MenuItem>
								{/* default item CR */}
								<MenuItem value="CR">Costa Rica</MenuItem>
								<MenuItem value="AR">Argentina</MenuItem>
								<MenuItem value="BO">Bolivia</MenuItem>
								<MenuItem value="CL">Chile</MenuItem>
								<MenuItem value="CO">Colombia</MenuItem>
								<MenuItem value="EC">Ecuador</MenuItem>
								<MenuItem value="US">Estados Unidos</MenuItem>
								<MenuItem value="SV">El Salvador</MenuItem>
								<MenuItem value="GT">Guatemala</MenuItem>
								<MenuItem value="MX">México</MenuItem>
								<MenuItem value="PA">Panamá</MenuItem>
								<MenuItem value="PY">Paraguay</MenuItem>
								<MenuItem value="PE">Perú</MenuItem>
								<MenuItem value="DO">República Dominicana</MenuItem>
								<MenuItem value="UY">Uruguay</MenuItem>
							</Select>
							<FormHelperText>País donde opera la sociedad</FormHelperText>
						</FormControl>

						<TextField
							label="Dirección"
							value={formData.agencia.direccion_line1}
							onChange={(e) =>
								handleChange("agencia", "direccion_line1", e.target.value)
							}
							required
							fullWidth
							helperText="Dirección física de la sociedad"
						/>
						<Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
							<TextField
								label="Ciudad"
								value={formData.agencia.direccion_city}
								onChange={(e) =>
									handleChange("agencia", "direccion_city", e.target.value)
								}
								required
								sx={{ flex: "1 1 200px" }}
								helperText="Ciudad de la sociedad"
							/>
							<TextField
								label="Estado/Provincia"
								value={formData.agencia.direccion_state}
								onChange={(e) =>
									handleChange("agencia", "direccion_state", e.target.value)
								}
								required
								sx={{ flex: "1 1 200px" }}
								helperText="Estado o provincia de la sociedad"
							/>
							<TextField
								label="Código Postal"
								value={formData.agencia.direccion_postal_code}
								onChange={(e) =>
									handleChange(
										"agencia",
										"direccion_postal_code",
										e.target.value
									)
								}
								required
								sx={{ flex: "1 1 150px" }}
								helperText="Código postal"
							/>
						</Box>
						<TextField
							label="Sitio Web"
							value={formData.agencia.sitio_web}
							onChange={(e) =>
								handleChange("agencia", "sitio_web", e.target.value)
							}
							required
							type="url"
							fullWidth
							helperText="URL del sitio web de la sociedad"
						/>
						<TextField
							label="Comisión Flora Plus (%)"
							value={formData.condiciones_comerciales.comision}
							onChange={(e) =>
								handleChange(
									"condiciones_comerciales",
									"comision",
									e.target.value
								)
							}
							required
							fullWidth
						/>

						<Typography variant="h6" sx={{ mt: 2 }}>
							Configuración de Impuestos y Fees (Opcional)
						</Typography>
						<Grid container spacing={2}>
							<Grid item xs={12} md={6}>
								<TextField
									fullWidth
									label="Tax (%)"
									variant="outlined"
									value={formData.configuracion_fees.tax}
									onChange={(e) =>
										handleChange("configuracion_fees", "tax", e.target.value)
									}
									inputProps={{ min: 0, max: 100 }}
									helperText="Porcentaje de impuesto aplicable"
								/>
							</Grid>
							<Grid item xs={12} md={6}>
								<Box
									sx={{
										display: "flex",
										flexDirection: "column",
										gap: 1,
									}}
								>
									<RadioGroup
										row
										aria-labelledby="fee-type-radio-buttons"
										name="fee-type"
										sx={{
											mt: "-48px",
										}}
										value={feeType}
										onChange={handleFeeTypeChange}
									>
										<FormControlLabel
											value="variable"
											control={<Radio size="small" />}
											label="Variable (%)"
										/>
										<FormControlLabel
											value="fixed"
											control={<Radio size="small" />}
											label="Fijo ($)"
										/>
									</RadioGroup>
									<TextField
										fullWidth
										label={
											feeType === "variable"
												? "Convenience Fee (%)"
												: "Convenience Fee ($)"
										}
										variant="outlined"
										value={
											feeType === "variable"
												? formData.configuracion_fees
													.convenience_fee_variable_valor
												: formData.configuracion_fees.convenience_fee_fijo_valor
										}
										onChange={(e) =>
											handleChange(
												"configuracion_fees",
												"convenience_fee_value",
												e.target.value
											)
										}
										inputProps={{
											min: 0,
										}}
										helperText="Fee por conveniencia aplicable a las transacciones"
									/>
								</Box>
							</Grid>
						</Grid>

						<Typography variant="h6" sx={{ mt: 2 }}>
							Información del Administrador
						</Typography>
						<>
						<TextField
							label="Fecha de Nacimiento"
							type="date"
							InputLabelProps={{ shrink: true }}
							value={
									formData.usuario_administrador.dob
										? `${formData.usuario_administrador.dob.year.toString().padStart(4,'0')}-${formData.usuario_administrador.dob.month.toString().padStart(2,'0')}-${formData.usuario_administrador.dob.day.toString().padStart(2,'0')}`
										: ""
									}
									onChange={(e) => {
									const [year, month, day] = e.target.value.split("-").map(Number);
									setFormData((prev) => ({
										...prev,
										usuario_administrador: {
										...prev.usuario_administrador!,
										dob: { day, month, year },
										},
									}));
									}}

							required
							fullWidth
							/>
						</>
						<TextField
							label="Nombre del Administrador"
							value={formData.usuario_administrador.nombre}
							onChange={(e) =>
								handleChange("usuario_administrador", "nombre", e.target.value)
							}
							required
							fullWidth
						/>
						<TextField
							label="Email"
							value={formData.usuario_administrador.mail}
							onChange={(e) =>
								handleChange("usuario_administrador", "mail", e.target.value)
							}
							onBlur={(e) => handleEmailBlur(e.target.value)}
							required
							type="email"
							fullWidth
							error={!!emailError}
							helperText={emailError}
						/>
						<Box sx={{ mb: 2 }}>
							<MuiTelInput
								label="Teléfono"
								value={formData.usuario_administrador.telefono}
								onChange={(value) =>
									handleChange("usuario_administrador", "telefono", value)
								}
								onBlur={() =>
									handlePhoneBlur(formData.usuario_administrador.telefono)
								}
								defaultCountry="CR"
								preferredCountries={["CR"]}
								fullWidth
								error={!!phoneError}
								helperText={
									phoneError || "Ingrese un número de teléfono válido"
								}
								forceCallingCode
								langOfCountryName="es"
								size="medium"
							/>
						</Box>

						<Box
							sx={{
								display: "flex",
								gap: 2,
								justifyContent: "flex-end",
								mt: 2,
							}}
						>
							<Button
								variant="outlined"
								onClick={() => router.back()}
								disabled={loading}
							>
								Cancelar
							</Button>
							<Button
								type="submit"
								variant="contained"
								color="primary"
								disabled={loading}
							>
								{loading ? "Creando..." : "Crear Cuenta"}
							</Button>
						</Box>
					</Box>
				</form>
			</Paper>
		</div>
	);
}
