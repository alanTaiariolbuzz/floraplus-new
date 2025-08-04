import { Typography, TextField } from "@mui/material";
import { useState, useEffect } from "react";

export const ConfigTyc = () => {
  const [tycContent, setTycContent] = useState("");
  const [loading, setLoading] = useState(true);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  useEffect(() => {
    // Cargar los términos y condiciones de la agencia actual
    fetch(`${siteUrl}/api/agencias?activa=true`)
      .then((response) => response.json())
      .then((result) => {
        if (result.code === 200 && result.data && result.data.length > 0) {
          // Tomar los términos y condiciones de la primera agencia activa
          // En un entorno real, esto debería ser la agencia del usuario actual
          setTycContent(result.data[0].termino_cond || "");
        }
      })
      .catch((error) => {
        console.error("Error loading TYC:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

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
      <Typography variant="subtitle1" sx={{ fontWeight: "500", mb: 3 }}>
        Términos y Condiciones
      </Typography>
      <div>
        <Typography variant="body2">{tycContent}</Typography>
      </div>
    </div>
  );
};
