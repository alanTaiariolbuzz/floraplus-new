"use client";

import { useState } from "react";
import type { Adicional, Transporte } from "../../types/reservation";

interface AdditionalServicesSelectorProps {
  adicionales: Adicional[];
  transportes: Transporte[];
  onSelect: (selections: {
    adicionales: { [key: number]: number };
    transportes: { [key: number]: number };
  }) => void;
}


// @ts-ignore
export default function AdditionalServicesSelector({
  adicionales,
  transportes,
  onSelect,
}: AdditionalServicesSelectorProps) {
  const [selectedAdicionales, setSelectedAdicionales] = useState<{
    [key: number]: number;
  }>({});
  const [selectedTransportes, setSelectedTransportes] = useState<{
    [key: number]: number;
  }>({});

  const handleAdicionalChange = (adicionalId: number, cantidad: number) => {
    const newAdicionales = {
      ...selectedAdicionales,
      [adicionalId]: cantidad,
    };
    setSelectedAdicionales(newAdicionales);
    onSelect({
      adicionales: newAdicionales,
      transportes: selectedTransportes,
    });
  };

  const handleTransporteChange = (transporteId: number, cantidad: number) => {
    const newTransportes = {
      ...selectedTransportes,
      [transporteId]: cantidad,
    };
    setSelectedTransportes(newTransportes);
    onSelect({
      adicionales: selectedAdicionales,
      transportes: newTransportes,
    });
  };

  return (
    <div>
      {adicionales.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h4>Servicios adicionales disponibles:</h4>
          {adicionales.map((adicional) => (
            <div key={adicional.id} style={{ marginBottom: "10px" }}>
              <label>
                {adicional.nombre} - ${adicional.precio}
                {adicional.descripcion && (
                  <span> ({adicional.descripcion})</span>
                )}
              </label>
              <input
                type="number"
                min="0"
                value={selectedAdicionales[adicional.id] || 0}
                onChange={(e) =>
                  handleAdicionalChange(
                    adicional.id,
                    parseInt(e.target.value) || 0
                  )
                }
                style={{ marginLeft: "10px" }}
              />
            </div>
          ))}
        </div>
      )}

      {transportes.length > 0 && (
        <div>
          <h4>Transportes disponibles:</h4>
          {transportes.map((transporte) => (
            <div key={transporte.id} style={{ marginBottom: "10px" }}>
              <label>
                {transporte.nombre} - ${transporte.precio}
                {transporte.descripcion && (
                  <span> ({transporte.descripcion})</span>
                )}
              </label>
              <input
                type="number"
                min="0"
                value={selectedTransportes[transporte.id] || 0}
                onChange={(e) =>
                  handleTransporteChange(
                    transporte.id,
                    parseInt(e.target.value) || 0
                  )
                }
                style={{ marginLeft: "10px" }}
              />
            </div>
          ))}
        </div>
      )}

      {adicionales.length === 0 && transportes.length === 0 && (
        <p>No hay servicios adicionales ni transportes disponibles.</p>
      )}
    </div>
  );
}
