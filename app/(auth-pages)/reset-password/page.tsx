"use client";

import { useState, useEffect } from "react";
import { resetPasswordAction } from "@/app/actions";
import { FormMessage } from "@/components/form-message";
import { Message } from "@/types/message";
import { SubmitButton } from "@/components/submit-button";
import {
  TextField,
  IconButton,
  InputAdornment,
  Typography,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import Image from "next/image";

export default function ResetPassword(props: {
  searchParams: Promise<Message>;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [searchParams, setSearchParams] = useState<Message>({});

  // Handle searchParams Promise
  useEffect(() => {
    props.searchParams.then(setSearchParams);
  }, [props.searchParams]);

  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleClickShowConfirmPassword = () =>
    setShowConfirmPassword(!showConfirmPassword);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);

    // Validación de contraseña
    if (value.length > 0 && value.length < 8) {
      setPasswordError("La contraseña debe tener al menos 8 caracteres");
    } else if (confirmPassword && value !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden");
    } else {
      setPasswordError("");
    }
  };

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setConfirmPassword(value);

    // Validación de confirmación
    if (password && value !== password) {
      setPasswordError("Las contraseñas no coinciden");
    } else {
      setPasswordError("");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center p-6 bg-white max-w-[598px] h-[515px] border border-[#E0E0E0] rounded-[8px]">
        <Image
          src="/icons/mail-circle.svg"
          alt="Mail icon"
          width={48}
          height={48}
          className="mb-6"
        />
        <h1 className="text-2xl font-semibold mb-2">
          Establece tu nueva contraseña
        </h1>
        <p className="text-sm text-gray-600 mb-8 text-center">
          Ingresa tu nueva contraseña para completar el proceso de recuperación.
        </p>
        <p className="text-xs text-gray-500 mb-4 text-center">
          Usuario: {/* We'll need to get this from session */}
        </p>
        <form className="w-full flex flex-col gap-4">
          <div>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: "500" }}
              className="pb-1"
            >
              Nueva contraseña
            </Typography>
            <TextField
              name="password"
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              variant="outlined"
              required
              fullWidth
              value={password}
              onChange={handlePasswordChange}
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
              onChange={handleConfirmPasswordChange}
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

          <SubmitButton
            formAction={resetPasswordAction}
            className="h-14 w-full"
            disabled={!!passwordError || !password || !confirmPassword}
          >
            Cambiar contraseña
          </SubmitButton>
          <FormMessage message={searchParams} />
        </form>
      </div>
    </div>
  );
}
