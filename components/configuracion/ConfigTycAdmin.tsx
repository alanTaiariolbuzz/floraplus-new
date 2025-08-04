import { Typography, TextField, Box } from "@mui/material";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Button as MuiButton } from "@mui/material";

export const ConfigTycAdmin = () => {
  const [tycContent, setTycContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [agenciesCount, setAgenciesCount] = useState(0);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  useEffect(() => {
    // Cargar los términos y condiciones existentes
    fetch(`${siteUrl}/api/configuracion/tyc`)
      .then((response) => response.json())
      .then((result) => {
        if (result.success && result.data) {
          setTycContent(result.data.contenido || "");
        }
      })
      .catch((error) => {
        console.error("Error loading TYC:", error);
      })
      .finally(() => {
        setLoading(false);
      });

    // Cargar el número de agencias activas
    fetch(`${siteUrl}/api/agencias?activa=true`)
      .then((response) => response.json())
      .then((result) => {
        if (result.code === 200 && result.data) {
          setAgenciesCount(result.data.length);
        }
      })
      .catch((error) => {
        console.error("Error loading agencies count:", error);
      });
  }, []);

  const handleSave = async () => {
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await fetch(`${siteUrl}/api/configuracion/tyc`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contenido: tycContent,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitMessage({
          type: "success",
          message:
            result.message || "Términos y condiciones guardados exitosamente",
        });
        setTimeout(() => {
          setSubmitMessage(null);
        }, 3000);
      } else {
        setSubmitMessage({
          type: "error",
          message:
            result.message || "Error al guardar los términos y condiciones",
        });
      }
    } catch (error) {
      setSubmitMessage({
        type: "error",
        message: "Error de conexión. Por favor, intente nuevamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkUpdate = async () => {
    if (!tycContent.trim()) {
      setSubmitMessage({
        type: "error",
        message: "Los términos y condiciones no pueden estar vacíos",
      });
      return;
    }

    setIsBulkUpdating(true);
    setSubmitMessage(null);

    try {
      const response = await fetch(`${siteUrl}/api/agencias/bulk-update-tyc`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          termino_cond: tycContent,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitMessage({
          type: "success",
          message:
            result.message ||
            `Términos y condiciones actualizados para ${result.data?.total || 0} agencias`,
        });
        setTimeout(() => {
          setSubmitMessage(null);
        }, 5000);
      } else {
        setSubmitMessage({
          type: "error",
          message:
            result.message ||
            "Error al actualizar términos y condiciones en las agencias",
        });
      }
    } catch (error) {
      setSubmitMessage({
        type: "error",
        message: "Error de conexión. Por favor, intente nuevamente.",
      });
    } finally {
      setIsBulkUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col bg-white pb-5 rounded-[8px] p-5 shadow-sm border border-[#E0E0E0]">
        <Typography variant="subtitle1" sx={{ fontWeight: "500", mb: 3 }}>
          Términos y Condiciones
        </Typography>
        <div className="text-center py-8">
          <Typography>Cargando términos y condiciones...</Typography>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white pb-5 rounded-[8px] p-5 shadow-sm border border-[#E0E0E0]">
      <div className="flex justify-between items-center mb-3">
        <Typography variant="subtitle1" sx={{ fontWeight: "500" }}>
          Términos y Condiciones
        </Typography>
        <div className="flex gap-2">
          <MuiButton
            variant="contained"
            color="primary"
            onClick={handleBulkUpdate}
            disabled={isSubmitting || isBulkUpdating}
            className="min-w-[120px]"
          >
            {isBulkUpdating
              ? "Actualizando..."
              : "Actualizar en todas las agencias"}
          </MuiButton>
        </div>
      </div>

      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 500, mb: 2 }}>
          Editar términos y condiciones
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={20}
          variant="outlined"
          placeholder="Ingrese los términos y condiciones aquí..."
          value={tycContent}
          onChange={(e) => setTycContent(e.target.value)}
          sx={{
            "& .MuiOutlinedInput-root": {
              fontFamily: "monospace",
              fontSize: "14px",
            },
          }}
        />
      </Box>

      {submitMessage && (
        <div
          className={`p-3 rounded-md mt-4 ${
            submitMessage.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {submitMessage.message}
        </div>
      )}

      <Box sx={{ mt: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Los términos y condiciones serán visibles para todos los usuarios de
          la plataforma. Al hacer clic en "Actualizar en todas las agencias" se
          aplicarán estos términos a todas las agencias activas.
        </Typography>
      </Box>
    </div>
  );
};
