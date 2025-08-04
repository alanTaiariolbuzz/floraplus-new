"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { TextField, Button, InputAdornment, IconButton } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import { activateUserAction } from "./actions";

export default function AdminComplete() {
  const supabase = createClient();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      // Modo desarrollo: simular un email para testing
      if (process.env.NODE_ENV === "development") {
        setEmail("test@example.com");
        setLoad(false);
        return;
      }

      // 1️⃣  procesa el hash y persiste la sesión
      const urlParams = new URLSearchParams(window.location.hash.substring(1)); // Remove the leading #
      const refreshToken = urlParams.get("refresh_token");

      if (!refreshToken) {
        throw new Error("No se obtuvo refresh_token");
      }

      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error) {
        throw error;
      }

      setEmail(data.session?.user.email ?? null);
      setLoad(false);
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPasswordError("");

    // En modo desarrollo, solo mostrar un mensaje
    if (process.env.NODE_ENV === "development") {
      alert("En modo desarrollo: Formulario enviado");
      return;
    }

    if (!password) {
      setPasswordError("La contraseña es requerida");
      return;
    }

    if (password.length < 8) {
      setPasswordError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden");
      return;
    }

    //1.Actualizar contraseña del usuario en Supabase Auth
    const { data: userData, error: userError } = await supabase.auth.updateUser(
      {
        password: password,
      }
    );

    if (userError) {
      setPasswordError(userError.message);
      return;
    }

    //2.Activar usuario y actualizar agencia
    const activationResult = await activateUserAction(userData.user.id);

    if (activationResult.error) {
      setPasswordError(activationResult.error);
      return;
    }

    if (userData) {
      setLoad(true);
      window.location.href = "/dashboard";
    }
  }

  if (loading) return <p>Cargando…</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="flex flex-row w-screen">
      <div className="relative w-[50vw] h-screen">
        <Image
          src="/images/parrots.webp"
          alt="Logo"
          fill
          className="object-cover"
          priority
        />
      </div>
      <div className="flex flex-col items-center justify-center w-[50vw]">
        <form onSubmit={handleSubmit} className="flex flex-col w-[70%] gap-4">
          <Typography variant="h6" sx={{ mb: 3 }}>
            Hola {email}, elige tu contraseña:
          </Typography>

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
            variant="contained"
            sx={{
              backgroundColor: "#F47920 !important",
              mt: 2,
              color: "white",
            }}
          >
            Crear cuenta
          </Button>
        </form>
      </div>
    </div>
  );
}
