import React, { memo, useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Box,
  Typography,
  Divider,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  styled,
  CircularProgress,
  Alert,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import UploadFileIcon from "@mui/icons-material/UploadFile";
const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  whiteSpace: "nowrap",
  width: 1,
});

interface InformationTabProps {
  titulo: string;
  titulo_en: string;
  descripcion: string;
  descripcion_en: string;
  es_privada: boolean;
  imagen: string;
  onFieldChange: (field: string, value: string | boolean) => void;
  onImageUpload: (file: File | string) => void; // Acepta tanto un archivo como una URL
}

const InformationTab = memo(
  ({
    titulo,
    titulo_en,
    descripcion,
    descripcion_en,
    es_privada,
    imagen,
    onFieldChange,
    onImageUpload,
  }: InformationTabProps) => {
    const [localTitulo, setLocalTitulo] = useState(titulo);
    const [localTituloEn, setLocalTituloEn] = useState(titulo_en);
    const [localDescripcion, setLocalDescripcion] = useState(descripcion);
    const [localDescripcionEn, setLocalDescripcionEn] =
      useState(descripcion_en);
    const [urlImage, setUrlImage] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      setLocalTitulo(titulo);
    }, [titulo]);

    useEffect(() => {
      setLocalTituloEn(titulo_en);
    }, [titulo_en]);

    useEffect(() => {
      setLocalDescripcion(descripcion);
    }, [descripcion]);

    useEffect(() => {
      setLocalDescripcionEn(descripcion_en);
    }, [descripcion_en]);

    const handleTituloBlur = useCallback(() => {
      onFieldChange("titulo", localTitulo);
    }, [localTitulo, onFieldChange]);

    const handleTituloEnBlur = useCallback(() => {

      onFieldChange("titulo_en", localTituloEn);
    }, [localTituloEn, onFieldChange]);

    const handleDescripcionBlur = useCallback(() => {

      onFieldChange("descripcion", localDescripcion);
    }, [localDescripcion, onFieldChange]);

    const handleDescripcionEnBlur = useCallback(() => {

      onFieldChange("descripcion_en", localDescripcionEn);
    }, [localDescripcionEn, onFieldChange]);

    const handleFileChange = useCallback(
      async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validar tamaño (3MB)
        if (file.size > 3 * 1024 * 1024) {
          setError("El archivo es demasiado grande. El tamaño máximo es 3MB.");
          return;
        }

        // Validar tipo de archivo
        const validTypes = [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/svg+xml",
        ];
        if (!validTypes.includes(file.type)) {
          setError(
            "Tipo de archivo no válido. Solo se permiten imágenes (JPG, PNG, GIF, SVG)."
          );
          return;
        }

        try {
          setIsLoading(true);
          setError(null);

          const formData = new FormData();
          formData.append("image", file);

          // Using fetch directly with credentials:include to send cookies
          const response = await fetch("/api/actividades/imagenes", {
            method: "POST",
            credentials: "include", // Include cookies in the request
            body: formData,
          });

          if (!response.ok) {
            throw new Error("Error al cargar la imagen");
          }

          const data = await response.json();
          onImageUpload(data.data); // Actualizar el estado con la URL de la imagen
        } catch (err) {
          setError(
            "Hubo un error al cargar la imagen. Por favor, intenta nuevamente."
          );
          console.error("Error al cargar la imagen:", err);
        } finally {
          setIsLoading(false);
        }
      },
      [onImageUpload]
    );

    const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setUrlImage(event.target.value);
    };

    const handleUrlSubmit = async () => {
      if (!urlImage) return;

      try {
        setIsLoading(true);
        setError(null);

        // Using fetch directly with credentials:include to send cookies
        const response = await fetch("/api/actividades/imagenes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Include cookies in the request
          body: JSON.stringify({ url: urlImage }),
        });

        if (!response.ok) {
          throw new Error("Error al cargar la imagen desde URL");
        }

        const data = await response.json();
        onImageUpload(data.data); // Actualizar el estado con la URL de la imagen
      } catch (err) {
        setError(
          "Hubo un error al cargar la imagen desde URL. Por favor, intenta nuevamente."
        );
        console.error("Error al cargar la imagen desde URL:", err);
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <>
        <Divider sx={{ mb: 3 }} />

        {/* Title Inputs */}
        <Box sx={{ mb: 4 }}>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexDirection: { xs: "column", sm: "row" },
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
                Nombre de la actividad en español
              </Typography>
              <TextField
                fullWidth
                placeholder="Escribe un nombre para tu actividad..."
                variant="outlined"
                value={localTitulo}
                onChange={(e) => setLocalTitulo(e.target.value)}
                onBlur={handleTituloBlur}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
                Nombre de la actividad en inglés
              </Typography>
              <TextField
                fullWidth
                placeholder="Write a name for your activity..."
                variant="outlined"
                value={localTituloEn}
                onChange={(e) => setLocalTituloEn(e.target.value)}
                onBlur={handleTituloEnBlur}
              />
            </Box>
          </Box>
        </Box>

        {/* Description Editors */}
        <Box sx={{ mb: 4 }}>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexDirection: { xs: "column", sm: "row" },
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
                Descripción en español
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Descripción de la actividad..."
                variant="outlined"
                value={localDescripcion}
                onChange={(e) => setLocalDescripcion(e.target.value)}
                onBlur={handleDescripcionBlur}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
                Descripción en inglés
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Description of the activity..."
                variant="outlined"
                value={localDescripcionEn}
                onChange={(e) => setLocalDescripcionEn(e.target.value)}
                onBlur={handleDescripcionEnBlur}
              />
            </Box>
          </Box>
        </Box>

        {/* Image Upload */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
            Imagen
          </Typography>
          <Box
            sx={{
              border: "2px dashed #ddd",
              borderRadius: 2,
              p: 4,
              textAlign: "center",
              "&:hover": { borderColor: "#666" },
              position: "relative",
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const file = e.dataTransfer.files?.[0];
              if (!file) return;

              // Validar tamaño (3MB)
              if (file.size > 3 * 1024 * 1024) {
                setError(
                  "El archivo es demasiado grande. El tamaño máximo es 3MB."
                );
                return;
              }

              // Validar tipo de archivo
              const validTypes = [
                "image/jpeg",
                "image/png",
                "image/gif",
                "image/svg+xml",
              ];
              if (!validTypes.includes(file.type)) {
                setError(
                  "Tipo de archivo no válido. Solo se permiten imágenes (JPG, PNG, GIF, SVG)."
                );
                return;
              }

              // Create a proper synthetic event
              const input = document.createElement("input");
              input.type = "file";
              const dataTransfer = new DataTransfer();
              dataTransfer.items.add(file);
              input.files = dataTransfer.files;

              const syntheticEvent = {
                target: input,
                currentTarget: input,
                preventDefault: () => {},
                stopPropagation: () => {},
                nativeEvent: e.nativeEvent,
                bubbles: true,
                cancelable: true,
                defaultPrevented: false,
                eventPhase: 0,
                isTrusted: true,
                timeStamp: Date.now(),
                type: "change",
                isDefaultPrevented: () => false,
                isPropagationStopped: () => false,
                persist: () => {},
              } as unknown as React.ChangeEvent<HTMLInputElement>;

              handleFileChange(syntheticEvent);
            }}
          >
            {isLoading && (
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  zIndex: 1,
                }}
              >
                <CircularProgress />
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <UploadFileIcon
              sx={{ fontSize: 28, color: "primary.main", mb: 1 }}
            />

            {/* Preview de la imagen actual */}
            {imagen ? (
              <Box
                sx={{
                  mb: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <Button
                  component="label"
                  variant="contained"
                  color="primary"
                  size="small"
                  disabled={isLoading}
                >
                  Cambiar imagen
                  <VisuallyHiddenInput
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </Button>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 2 }}
                >
                  O arrastra un nuevo archivo aquí para cambiar la imagen
                </Typography>{" "}
              </Box>
            ) : (
              <Box>
                <Typography variant="subtitle1" color="black">
                  Arrastra y suelta o
                  <Button component="label" variant="text" disabled={isLoading}>
                    sube una imagen
                    <VisuallyHiddenInput
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </Button>
                </Typography>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 2 }}
                >
                  SVG, PNG, JPG o GIF (max. 3MB)
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Private Tour Checkbox */}
        {/* <FormControlLabel
          control={
            <Checkbox
              checked={es_privada}
              onChange={(e) => onFieldChange("es_privada", e.target.checked)}
            />
          }
          label={
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              Tour privado
            </Typography>
          }
          sx={{ mb: 3 }}
        /> */}

        {/* <Divider sx={{ mb: 3 }} /> */}
      </>
    );
  }
);

export default InformationTab;
