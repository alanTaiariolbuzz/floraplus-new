"use client";

import { signInAction } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import {
  TextField,
  Switch,
  FormControlLabel,
  Button,
  InputAdornment,
  IconButton,
} from "@mui/material";
import Typography from "@mui/material/Typography";
import ForgotPasswordModal from "@/components/forgot-password-modal";
import { useState } from "react";
import { Visibility, VisibilityOff } from "@mui/icons-material";

interface SignInFormProps {
  hasError: boolean;
  errorMessage: string;
}

export default function SignInForm({
  hasError,
  errorMessage,
}: SignInFormProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  return (
    <form action={signInAction} className="flex flex-col w-[70%] gap-4">
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 500 }}>
        Inicio de sesión
      </Typography>

      <TextField
        name="email"
        label="Email address"
        variant="outlined"
        required
        fullWidth
        error={hasError}
      />

      <TextField
        name="password"
        label="Password"
        type={showPassword ? "text" : "password"}
        variant="outlined"
        required
        fullWidth
        sx={{ mt: 2 }}
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
        error={hasError}
      />

      <FormControlLabel
        control={<Switch name="remember" size="small" color="primary" />}
        label="Mantener sesión iniciada"
        sx={{ mt: 1, ml: "1px" }}
      />

      <SubmitButton
        sx={{ backgroundColor: "#F47920 !important" }}
        pendingText="Signing In..."
        formAction={signInAction}
      >
        Iniciar sesion
      </SubmitButton>

      {hasError && (
        <Typography color="error" variant="body2">
          {errorMessage}
        </Typography>
      )}

      <div className="flex  justify-center mt-4">
        <Button
          sx={{ color: "#757575" }}
          size="small"
          onClick={() => setModalOpen(true)}
          className="text-sm text-[#757575] hover:underline"
        >
          Olvide mi contraseña
        </Button>
      </div>

      <ForgotPasswordModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </form>
  );
}
