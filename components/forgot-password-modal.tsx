import { forgotPasswordAction } from "@/app/actions";
import { FormMessage } from "@/components/form-message";
import { Message } from "@/types/message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Dialog, DialogContent } from "@mui/material";
import { useState } from "react";

interface ForgotPasswordModalProps {
  open: boolean;
  onClose: () => void;
  searchParams?: Message;
}

export default function ForgotPasswordModal({
  open,
  onClose,
  searchParams,
}: ForgotPasswordModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await forgotPasswordAction(formData);

      // Si el resultado es un redirect, significa que fue exitoso
      // En este caso, mostramos un mensaje de éxito
      setMessage({
        success:
          "Te hemos enviado un correo con las instrucciones para restablecer tu contraseña. Por favor, revisa tu bandeja de entrada.",
      });

      // Cerramos el modal después de 3 segundos
      setTimeout(() => onClose(), 3000);
    } catch (error) {
      console.error("Error en forgot password:", error);
      setMessage({
        error:
          "Ocurrió un error al enviar el correo de recuperación. Por favor, intenta nuevamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayMessage = message || searchParams || {};

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogContent className="p-6">
        <div className="flex flex-col items-center">
          <Image
            src="/icons/mail-circle.svg"
            alt="Mail icon"
            width={48}
            height={48}
            className="mb-6"
          />
          <h1 className="text-2xl font-semibold mb-2">
            ¿Olvidaste tu contraseña?
          </h1>
          <p className="text-sm text-gray-600 mb-8 text-center">
            No pasa nada. Ingresa tu correo y enviaremos un link para crear
            otra.
          </p>
          <form className="w-full flex flex-col gap-4" action={handleSubmit}>
            <Input
              name="email"
              placeholder="you@example.com"
              required
              className="h-14 w-full"
            />
            <SubmitButton className="h-14 w-full" disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Enviar correo de recuperación"}
            </SubmitButton>
            {(message || searchParams) && (
              <FormMessage message={displayMessage} />
            )}
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
