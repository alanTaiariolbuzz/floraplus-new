"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { activateAgencyUserAction } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

export default function OnboardingComplete() {
  const supabase = createClient();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleClickShowConfirmPassword = () =>
    setShowConfirmPassword((show) => !show);

  useEffect(() => {
    (async () => {
      try {
        // Procesar el hash y persistir la sesión
        const urlParams = new URLSearchParams(
          window.location.hash.substring(1)
        ); // Eliminar el # inicial
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
    setPasswordError(null);

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

      //1.Actualizar contraseña del usuario en Supabase Auth
      const { data: userData, error: userError } =
        await supabase.auth.updateUser({
          password: password,
        });

      if (userError) {
        setError(userError.message);
        setLoading(false);
        return;
      }

      //2.Activar usuario
      const activationResult = await activateAgencyUserAction(
        userData.user.id,
        "CR" // Default to Costa Rica for now, will be updated in Stripe setup
      );

      if (activationResult.error) {
        setError(activationResult.error);
        setLoading(false);
        return;
      }

      // Verificar que tenemos un ID de agencia válido
      if (!activationResult.agencyId) {
        setError(
          "No se pudo obtener el ID de agencia. Por favor, contacte a soporte."
        );
        setLoading(false);
        return;
      }

      // Redirigir al paso 2 (configuración de Stripe)
      window.location.href = `/onboarding/stripe-accounts?agencyId=${activationResult.agencyId}`;
    } catch (e: any) {
      setError(e.message || "Error inesperado");
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
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded"
          >
            Reintentar
          </button>
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
          Crea tu contraseña
        </Typography>

        <form onSubmit={handleSubmit} className="mt-6">
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
            {loading ? "Procesando..." : "Continuar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
