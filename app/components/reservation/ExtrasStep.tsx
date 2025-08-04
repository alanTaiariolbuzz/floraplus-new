import { useState } from "react";
import { Typography, IconButton } from "@mui/material";
import { Car, Package } from "lucide-react";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { useTranslation } from "../../hooks/useTranslation";
import { Language } from "../../translations/reservation";

interface Transporte {
  id: number;
  precio: number;
  titulo: string;
  direccion: string;
  hora_salida: string;
}

interface Adicional {
  id: number;
  titulo: string;
  titulo_en?: string;
  precio: number;
  descripcion: string;
  descripcion_en?: string;
}

interface ExtrasStepProps {
  transporte: Transporte[];
  adicionales: Adicional[];
  onExtrasSelect: (data: {
    transporte: Record<number, number>;
    adicionales: Record<number, number>;
  }) => void;
  initialData?: {
    transporte: Record<number, number>;
    adicionales: Record<number, number>;
  };
  language: Language;
}

export const ExtrasStep = ({
  transporte,
  adicionales,
  onExtrasSelect,
  initialData,
  language,
}: ExtrasStepProps) => {
  const { t } = useTranslation(language);
  const [selectedTransporte, setSelectedTransporte] = useState<
    Record<number, number>
  >(initialData?.transporte || {});
  const [selectedAdicionales, setSelectedAdicionales] = useState<
    Record<number, number>
  >(initialData?.adicionales || {});

  const handleTransporteSelect = (id: number, cantidad: number) => {
    const newSelected = { ...selectedTransporte, [id]: cantidad };
    setSelectedTransporte(newSelected);
    onExtrasSelect({
      transporte: newSelected,
      adicionales: selectedAdicionales,
    });
  };

  const handleAdicionalDecrement = (id: number) => {
    const newSelected = {
      ...selectedAdicionales,
      [id]: Math.max(0, (selectedAdicionales[id] || 0) - 1),
    };
    setSelectedAdicionales(newSelected);
    onExtrasSelect({
      transporte: selectedTransporte,
      adicionales: newSelected,
    });
  };

  const handleAdicionalIncrement = (id: number) => {
    const newSelected = {
      ...selectedAdicionales,
      [id]: (selectedAdicionales[id] || 0) + 1,
    };
    setSelectedAdicionales(newSelected);
    onExtrasSelect({
      transporte: selectedTransporte,
      adicionales: newSelected,
    });
  };

  const handleAdicionalInputChange = (id: number, value: string) => {
    const newValue = parseInt(value) || 0;
    const newSelected = {
      ...selectedAdicionales,
      [id]: Math.max(0, newValue),
    };
    setSelectedAdicionales(newSelected);
    onExtrasSelect({
      transporte: selectedTransporte,
      adicionales: newSelected,
    });
  };



  return (
    <div className="space-y-8">
      {transporte.length > 0 && (
        <div>
          <p className="mb-4 iframe-titles">{t("needTransport")}</p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {transporte?.map((t) => (
              <div
                key={t.id}
                className="flex flex-col p-4 border rounded-lg hover:border-green-500 cursor-pointer"
                onClick={() => handleTransporteSelect(t.id, 1)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Car className="w-5 h-5 text-gray-600" />
                  <Typography variant="subtitle1">{t.titulo}</Typography>
                </div>
                <Typography variant="body2" className="text-gray-600">
                  Precio: ${t.precio} por persona
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  Dirección: {t?.direccion}
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  Horario de salida: {t.hora_salida}
                </Typography>
              </div>
            ))}
          </div>
        </div>
      )}

      {adicionales.length > 0 && (
        <div>
          <p className="mb-4 iframe-titles">{t("addExtras")}</p>
          <div className="space-y-4">
            {adicionales.map((adicional) => (
              <div
                key={adicional.id}
                className="flex items-center justify-between p-4 border rounded-[8px] max-w-[390px] sm:max-w-[500px]  "
              >
                <div className="flex items-center gap-4">
                  <div>
                    <Typography variant="subtitle1">
                      {language === "en"
                        ? adicional.titulo_en
                        : adicional.titulo || t("loading")}
                    </Typography>
                    <Typography variant="body2" className="text-gray-600">
                      {language === "en"
                        ? adicional?.descripcion_en
                        : adicional?.descripcion || t("loading")}
                    </Typography>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Typography variant="subtitle1">
                    ${adicional.precio}
                  </Typography>
                  <div className="quantity-picker">
                    <IconButton
                      size="small"
                      onClick={() => handleAdicionalDecrement(adicional.id)}
                      disabled={(selectedAdicionales[adicional.id] || 0) === 0}
                      sx={{
                        width: "14px",
                        height: "14px",
                        padding: 0,
                        "& .MuiSvgIcon-root": {
                          fontSize: "22px",
                          color: "#FB8C00",
                        },
                        "&.Mui-disabled .MuiSvgIcon-root": {
                          color: "#E0E0E0",
                        },
                      }}
                    >
                      <RemoveIcon />
                    </IconButton>
                    <input
                      type="number"
                      min="0"
                      value={selectedAdicionales[adicional.id] || 0}
                      onChange={(e) =>
                        handleAdicionalInputChange(adicional.id, e.target.value)
                      }
                      className="quantity-input"
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleAdicionalIncrement(adicional.id)}
                      sx={{
                        width: "14px",
                        height: "14px",
                        padding: 0,
                        "& .MuiSvgIcon-root": {
                          fontSize: "22px",
                          color: "#FB8C00",
                        },
                        "&.Mui-disabled .MuiSvgIcon-root": {
                          color: "#E0E0E0",
                        },
                      }}
                    >
                      <AddIcon />
                    </IconButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
