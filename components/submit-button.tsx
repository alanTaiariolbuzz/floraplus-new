"use client";

import { LoadingButton, LoadingButtonProps } from "@mui/lab";
import { useFormStatus } from "react-dom";

interface SubmitButtonProps extends LoadingButtonProps {
  pendingText?: string;
}

export const SubmitButton = ({
  pendingText,
  children,
  disabled,
  ...props
}: SubmitButtonProps) => {
  const { pending } = useFormStatus();

  return (
    <LoadingButton
      type="submit"
      loading={pending}
      disabled={disabled || pending}
      variant="contained"
      {...props}
      sx={{
        color: "white",
        ...props.sx,
      }}
    >
      {pending && pendingText ? pendingText : children}
    </LoadingButton>
  );
};
