"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Button } from "@/components/ui/button";
import { activateAgencyUserAction } from "./actions";

export default function AgencyAdminComplete() {
  const supabase = createClient();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [agencyName, setAgencyName] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleClickShowConfirmPassword = () =>
    setShowConfirmPassword(!showConfirmPassword);

  useEffect(() => {
    (async () => {
      try {
        // Procesar el hash y persistir la sesión
        const urlParams = new URLSearchParams(
          window.location.hash.substring(1)
        );
        const refreshToken = urlParams.get("refresh_token");

        if (!refreshToken) {
          setError("No se obtuvo token de refresco");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.refreshSession({
          refresh_token: refreshToken,
        });

        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }

        setEmail(data.session?.user.email ?? null);
        setLoading(false);
      } catch (e: any) {
        setError(e.message || "Error al procesar la invitación");
        setLoading(false);
      }
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setPasswordError("");

    try {
      if (!password) {
        setPasswordError("La contraseña es requerida");
        setLoading(false);
        return;
      }

      if (password.length < 8) {
        setPasswordError("La contraseña debe tener al menos 8 caracteres");
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setPasswordError("Las contraseñas no coinciden");
        setLoading(false);
        return;
      }

      // 1. Actualizar contraseña del usuario en Supabase Auth
      const { data: userData, error: userError } =
        await supabase.auth.updateUser({
          password: password,
        });

      if (userError) {
        setPasswordError(userError.message);
        setLoading(false);
        return;
      }

      // 2. Activar usuario y verificar agencia
      const activationResult = await activateAgencyUserAction(userData.user.id);

      if (activationResult.error) {
        setPasswordError(activationResult.error);
        setLoading(false);
        return;
      }

      // Verificar que tenemos un ID de agencia válido y nombre
      if (!activationResult.agencyId || !activationResult.agencyName) {
        setPasswordError(
          "No se pudo obtener información de la agencia. Por favor, contacte a soporte."
        );
        setLoading(false);
        return;
      }

      setAgencyName(activationResult.agencyName);
      setSuccess(true);
      setLoading(false);

      // Redirigir al dashboard después de 3 segundos
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 3000);
    } catch (e: any) {
      setPasswordError(e.message || "Error inesperado");
      setLoading(false);
    }
  }

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <CircularProgress />
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <Typography color="error">{error}</Typography>
          <Button
            onClick={() => window.location.reload()}
            variant="destructive"
            className="mt-4"
          >
            Reintentar
          </Button>
        </div>
      </div>
    );

  if (success)
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="w-full max-w-[500px] px-[50px] py-10 bg-white rounded-[16px] shadow-md">
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <Typography
              variant="h4"
              sx={{ fontWeight: "500", textAlign: "center", mb: 3 }}
            >
              ¡Configuración completada!
            </Typography>

            <Typography
              variant="body1"
              sx={{ textAlign: "center", mb: 4, color: "#666666" }}
            >
              Tu cuenta ha sido activada correctamente para la agencia{" "}
              <span style={{ fontWeight: "600", color: "#212121" }}>
                {agencyName}
              </span>
              .
            </Typography>

            <div className="bg-[#fafafa] rounded-[8px] p-4 w-full mb-6">
              <Typography
                variant="body2"
                sx={{ textAlign: "center", color: "#666666" }}
              >
                Serás redirigido al panel en unos segundos...
              </Typography>
            </div>

            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#F47920]"></div>
              <Typography variant="body2" sx={{ ml: 2, color: "#666666" }}>
                Redirigiendo...
              </Typography>
            </div>
          </div>
        </div>
      </div>
    );

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-[700px] px-[50px] py-10 bg-white rounded-[16px] shadow-md">
        <Typography
          variant="h4"
          sx={{ fontWeight: "500", textAlign: "center" }}
        >
          Completa tu registro
        </Typography>

        <Typography variant="body1" sx={{ mt: 3, mb: 4, textAlign: "center" }}>
          Hola <b>{email}</b>, para finalizar la configuración de tu cuenta,
          establece una contraseña segura.
        </Typography>

        <form onSubmit={handleSubmit}>
          <div>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: "500" }}
              className="pb-1"
            >
              Tu contraseña
            </Typography>
            <TextField
              name="password"
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              variant="outlined"
              required
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!passwordError}
              helperText={passwordError}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <span className="text-xs text-[#666666]">
              Debe tener al menos 8 caracteres
            </span>
          </div>

          <div>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: "500" }}
              className="pb-1 pt-3"
            >
              Confirma tu contraseña
            </Typography>
            <TextField
              name="confirmPassword"
              label="Confirmar contraseña"
              type={showConfirmPassword ? "text" : "password"}
              variant="outlined"
              required
              fullWidth
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={!!passwordError}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={handleClickShowConfirmPassword}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-7"
            variant="orange"
          >
            {loading ? "Procesando..." : "Completar registro"}
          </Button>
        </form>
      </div>
    </div>
  );
}
