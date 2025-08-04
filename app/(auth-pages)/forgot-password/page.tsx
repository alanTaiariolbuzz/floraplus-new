"use client";
import { forgotPasswordAction } from "@/app/actions";
import { FormMessage } from "@/components/form-message";
import { Message } from "@/types/message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function ForgotPassword(props: {
  searchParams: Promise<Message>;
}) {
  const [searchParams, setSearchParams] = useState<Message>({});
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  // Manejar searchParams que es una Promise en Next.js 15
  useEffect(() => {
    props.searchParams.then(setSearchParams);
  }, [props.searchParams]);

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    setMessage(null);

    try {
      await forgotPasswordAction(formData);
      setMessage({
        success:
          "Te hemos enviado un correo con las instrucciones para restablecer tu contraseña. Por favor, revisa tu bandeja de entrada.",
      });
    } catch (error) {
      console.error("Error en forgot password:", error);
      setMessage({
        error:
          error instanceof Error
            ? error.message
            : "Ocurrió un error al enviar el correo de recuperación. Por favor, intenta nuevamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayMessage = message || searchParams || {};

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center p-6 bg-white rounded-lg max-w-[598px] h-[407px]">
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
          No pasa nada. Ingresa tu correo y enviaremos un link para crear otra.
        </p>
        <form className="w-full flex flex-col gap-4" action={handleSubmit}>
          <Input
            name="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-14 w-full"
          />
          <SubmitButton
            formAction={handleSubmit}
            className="h-14 w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Enviando..." : "Reset Password"}
          </SubmitButton>
          <FormMessage message={displayMessage} />
        </form>
      </div>
    </div>
  );
}
