import { signInAction } from "@/app/actions";
import { FormMessage } from "@/components/form-message";
import { Message } from "@/types/message";
import { SubmitButton } from "@/components/submit-button";
import { TextField, Switch, FormControlLabel } from "@mui/material";
import Image from "next/image";
import Typography from "@mui/material/Typography";
import SignInForm from "./sign-in-form";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const translateError = (error: string): string => {
  const errorMessages: { [key: string]: string } = {
    "Invalid login credentials": "Credenciales inválidas",
    "Email not confirmed": "Email no confirmado",
    "Invalid email or password": "Email o contraseña inválidos",
    "Email not found": "Email no encontrado",
    "Invalid password": "Contraseña inválida",
    "Too many requests": "Demasiados intentos. Por favor, intente más tarde",
    "Failed to establish session": "Error al establecer la sesión",
  };

  return errorMessages[error] || error;
};

export default async function Login({ searchParams }: PageProps) {
  const params = await searchParams;
  const error = params.error as string | undefined;
  const hasError = !!error;
  const errorMessage = error ? translateError(error) : "";

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

      <div className="flex flex-col w-[50vw] h-screen items-center justify-center">
        <SignInForm hasError={hasError} errorMessage={errorMessage} />
      </div>
    </div>
  );
}
