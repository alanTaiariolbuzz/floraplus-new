"use client";

import { useState } from "react";
import type { Tarifa } from "../../types/reservation";
import { Typography, IconButton } from "@mui/material";
import { useTranslation } from "../../hooks/useTranslation";
import { Language } from "../../translations/reservation";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

interface TariffSelectorProps {
  tarifas: Tarifa[];
  onTarifasSelect: (tarifas: { [key: string]: number }) => void;
  cupoDisponible: number;
  selectedTarifas: { [key: string]: number };
  minimo_reserva: number;
  language: Language;
}

export default function TariffSelector({
  tarifas,
  onTarifasSelect,
  cupoDisponible,
  selectedTarifas,
  minimo_reserva,
  language,
}: TariffSelectorProps) {
  const { t } = useTranslation(language);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>(
    selectedTarifas || {}
  );

  const handleIncrement = (tarifaId: string) => {
    const currentQuantity = quantities[tarifaId] || 0;
    const totalSelected = Object.values(quantities).reduce(
      (sum, qty) => sum + qty,
      0
    );

    if (totalSelected < cupoDisponible) {
      const newQuantities = {
        ...quantities,
        [tarifaId]: currentQuantity + 1,
      };
      setQuantities(newQuantities);
      onTarifasSelect(newQuantities);
    }
  };

  const handleDecrement = (tarifaId: string) => {
    const currentQuantity = quantities[tarifaId] || 0;
    if (currentQuantity > 0) {
      const newQuantities = {
        ...quantities,
        [tarifaId]: currentQuantity - 1,
      };
      setQuantities(newQuantities);
      onTarifasSelect(newQuantities);
    }
  };

  const handleInputChange = (tarifaId: string, value: string) => {
    const newQuantity = parseInt(value) || 0;
    const totalSelected = Object.values(quantities).reduce(
      (sum, qty) => sum + qty,
      0
    );
    const currentQuantity = quantities[tarifaId] || 0;
    const difference = newQuantity - currentQuantity;

    if (totalSelected + difference <= cupoDisponible) {
      const newQuantities = {
        ...quantities,
        [tarifaId]: newQuantity,
      };
      setQuantities(newQuantities);
      onTarifasSelect(newQuantities);
    }
  };

  return (
    <div className="tariff-selector">
      {tarifas.map((tarifa) => (
        <div key={tarifa.id} className="tariff-item">
          <div className="tariff-info">
            <span className="tariff-name text-[13px]">
              {language === "en" ? tarifa.nombre_en : tarifa.nombre}
            </span>
            <span className="tariff-price text-[13px] font-medium">
              ${tarifa.precio.toFixed(2)}
            </span>
          </div>
          <div className="quantity-picker">
            <IconButton
              size="small"
              onClick={() => handleDecrement(tarifa.id.toString())}
              disabled={(quantities[tarifa.id] || 0) === 0}
              sx={{
                width: "14px",
                height: "14px",
                padding: 0,
                "& .MuiSvgIcon-root": {
                  fontSize: "22px",
                  color: "#FB8C00", // color normal
                },
                "&.Mui-disabled .MuiSvgIcon-root": {
                  color: "#E0E0E0", // color cuando está deshabilitado
                },
              }}
            >
              <RemoveIcon />
            </IconButton>
            <input
              type="number"
              min="0"
              max={cupoDisponible}
              value={quantities[tarifa.id] || 0}
              onChange={(e) =>
                handleInputChange(tarifa.id.toString(), e.target.value)
              }
              className="quantity-input"
            />
            <IconButton
              size="small"
              onClick={() => handleIncrement(tarifa.id.toString())}
              disabled={
                (quantities[tarifa.id] || 0) >= cupoDisponible ||
                Object.values(quantities).reduce(
                  (acc, cantidad) => acc + cantidad,
                  0
                ) >= cupoDisponible
              }
              sx={{
                width: "14px",
                height: "14px",
                padding: 0,
                "& .MuiSvgIcon-root": {
                  fontSize: "22px",
                  color: "#FB8C00", // color normal
                },
                "&.Mui-disabled .MuiSvgIcon-root": {
                  color: "#E0E0E0", // color cuando está deshabilitado
                },
              }}
            >
              <AddIcon className="text-[#00c853] text-[22px]" />
            </IconButton>
          </div>
        </div>
      ))}
    </div>
  );
}
