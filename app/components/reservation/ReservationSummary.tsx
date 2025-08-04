"use client";

import type {
  Actividad,
  Turno,
  Tarifa,
  Adicional,
  Transporte,
} from "../../types/reservation";

interface PersonalData {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
}

interface ReservationSummaryProps {
  actividad: Actividad;
  turno: Turno;
  tarifas: { [key: number]: number };
  adicionales: { [key: number]: number };
  transportes: { [key: number]: number };
  personalData: PersonalData;
  onConfirm: () => void;
  onBack: () => void;
}

export default function ReservationSummary({
  actividad,
  turno,
  tarifas,
  adicionales,
  transportes,
  personalData,
  onConfirm,
  onBack,
}: ReservationSummaryProps) {
  // // Calcular subtotales
  // const calcularSubtotalTarifas = () => {
  //   return Object.entries(tarifas).reduce((total, [tarifaId, cantidad]) => {
  //     const tarifa = actividad.tarifas.find((t) => t.id === parseInt(tarifaId));
  //     return total + (tarifa ? tarifa.precio * cantidad : 0);
  //   }, 0);
  // };

  // const calcularSubtotalAdicionales = () => {
  //   return Object.entries(adicionales).reduce(
  //     (total, [adicionalId, cantidad]) => {
  //       const adicional = actividad.adicionales.find(
  //         (a) => a.id === parseInt(adicionalId)
  //       );
  //       return total + (adicional ? adicional.precio * cantidad : 0);
  //     },
  //     0
  //   );
  // };

  // const calcularSubtotalTransportes = () => {
  //   return Object.entries(transportes).reduce(
  //     (total, [transporteId, cantidad]) => {
  //       const transporte = actividad.transportes.find(
  //         (t) => t.id === parseInt(transporteId)
  //       );
  //       return total + (transporte ? transporte.precio * cantidad : 0);
  //     },
  //     0
  //   );
  // };

  // const subtotalTarifas = calcularSubtotalTarifas();
  // const subtotalAdicionales = calcularSubtotalAdicionales();
  // const subtotalTransportes = calcularSubtotalTransportes();
  // const total = subtotalTarifas + subtotalAdicionales + subtotalTransportes;

  // return (
  //   <div style={{ maxWidth: "600px" }}>
  //     <h3>Resumen de tu reserva</h3>

  //     {/* Detalles de la actividad */}
  //     <div style={{ marginBottom: "20px" }}>
  //       <h4>Actividad</h4>
  //       <p>
  //         <strong>{actividad.titulo}</strong>
  //       </p>
  //       <p>Fecha: {turno.fecha.split("T")[0]}</p>
  //       <p>
  //         Horario: {turno.hora_inicio} a {turno.hora_fin}
  //       </p>
  //     </div>

  //     {/* Detalles de las tarifas */}
  //     <div style={{ marginBottom: "20px" }}>
  //       <h4>Tarifas seleccionadas</h4>
  //       {Object.entries(tarifas).map(([tarifaId, cantidad]) => {
  //         if (cantidad === 0) return null;
  //         const tarifa = actividad.tarifas.find(
  //           (t) => t.id === parseInt(tarifaId)
  //         );
  //         if (!tarifa) return null;
  //         return (
  //           <div key={tarifaId} style={{ marginBottom: "5px" }}>
  //             {tarifa.nombre} x {cantidad} - ${tarifa.precio * cantidad}
  //           </div>
  //         );
  //       })}
  //       <div style={{ marginTop: "10px", fontWeight: "bold" }}>
  //         Subtotal tarifas: ${subtotalTarifas}
  //       </div>
  //     </div>

  //     {/* Detalles de adicionales */}
  //     {Object.values(adicionales).some((cantidad) => cantidad > 0) && (
  //       <div style={{ marginBottom: "20px" }}>
  //         <h4>Servicios adicionales</h4>
  //         {Object.entries(adicionales).map(([adicionalId, cantidad]) => {
  //           if (cantidad === 0) return null;
  //           const adicional = actividad.adicionales.find(
  //             (a) => a.id === parseInt(adicionalId)
  //           );
  //           if (!adicional) return null;
  //           return (
  //             <div key={adicionalId} style={{ marginBottom: "5px" }}>
  //               {adicional.nombre} x {cantidad} - ${adicional.precio * cantidad}
  //             </div>
  //           );
  //         })}
  //         <div style={{ marginTop: "10px", fontWeight: "bold" }}>
  //           Subtotal adicionales: ${subtotalAdicionales}
  //         </div>
  //       </div>
  //     )}

  //     {/* Detalles de transportes */}
  //     {Object.values(transportes).some((cantidad) => cantidad > 0) && (
  //       <div style={{ marginBottom: "20px" }}>
  //         <h4>Transportes</h4>
  //         {Object.entries(transportes).map(([transporteId, cantidad]) => {
  //           if (cantidad === 0) return null;
  //           const transporte = actividad.transportes.find(
  //             (t) => t.id === parseInt(transporteId)
  //           );
  //           if (!transporte) return null;
  //           return (
  //             <div key={transporteId} style={{ marginBottom: "5px" }}>
  //               {transporte.nombre} x {cantidad} - $
  //               {transporte.precio * cantidad}
  //             </div>
  //           );
  //         })}
  //         <div style={{ marginTop: "10px", fontWeight: "bold" }}>
  //           Subtotal transportes: ${subtotalTransportes}
  //         </div>
  //       </div>
  //     )}

  //     {/* Datos personales */}
  //     <div style={{ marginBottom: "20px" }}>
  //       <h4>Datos personales</h4>
  //       <p>
  //         {personalData.nombre} {personalData.apellido}
  //       </p>
  //       <p>Email: {personalData.email}</p>
  //       <p>Teléfono: {personalData.telefono}</p>
  //     </div>

  //     {/* Total */}
  //     <div
  //       style={{
  //         marginTop: "20px",
  //         padding: "15px",
  //         backgroundColor: "#f8f9fa",
  //         borderRadius: "4px",
  //       }}
  //     >
  //       <h4>Total a pagar: ${total}</h4>
  //     </div>

  //     {/* Botones de acción */}
  //     <div
  //       style={{
  //         marginTop: "20px",
  //         display: "flex",
  //         gap: "10px",
  //         justifyContent: "space-between",
  //       }}
  //     >
  //       <button
  //         onClick={onBack}
  //         style={{
  //           padding: "10px 20px",
  //           border: "1px solid #ccc",
  //           borderRadius: "4px",
  //           backgroundColor: "white",
  //           cursor: "pointer",
  //         }}
  //       >
  //         Volver
  //       </button>
  //       <button
  //         onClick={onConfirm}
  //         style={{
  //           padding: "10px 20px",
  //           border: "none",
  //           borderRadius: "4px",
  //           backgroundColor: "#28a745",
  //           color: "white",
  //           cursor: "pointer",
  //         }}
  //       >
  //         Confirmar reserva
  //       </button>
  //     </div>
  //   </div>
  // );
}
