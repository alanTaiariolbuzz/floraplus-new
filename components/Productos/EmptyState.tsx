"use client";

import { useRouter } from "next/navigation";
import { Box, Typography, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import Image from "next/image";
interface EmptyStateProps {
  entityName: string; // Nombre de la entidad ("Actividades", "Adicionales", etc.)
  redirectPath: string; // Ruta a donde llevar el botón
}

const EmptyState: React.FC<EmptyStateProps> = ({
  entityName,
  redirectPath,
}) => {
  const router = useRouter();

  const handleCreate = () => {
    router.push(redirectPath);
  };

  return (
    <div>
      <div className="border border-[#E0E0E0] rounded-[8px] mt-6">
        <div className="bg-[#fafafa] h-[70vh] w-[100%] flex flex-col items-center justify-center border-[16px] rounded-[8px] border-white">
          <Image
            src="/icons/mail-error.svg"
            alt="Mail Error"
            width={21}
            height={21}
          />

          <Typography variant="body1" gutterBottom sx={{ py: "12px" }}>
            No tienes {entityName.toLowerCase()}
          </Typography>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
          >
            Crear {entityName}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;
