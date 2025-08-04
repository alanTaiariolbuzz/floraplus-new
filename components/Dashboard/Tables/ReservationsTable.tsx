import { useReservasHoy } from "../../../app/hooks/useReservasHoy";
import { Button, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import Image from "next/image";

export const TablaReservas = () => {
  const { reservas, loading } = useReservasHoy();
  const [totalPersonas, setTotalPersonas] = useState(0);

  useEffect(() => {
    // Calcular el total de personas
    const total = reservas.reduce((acc, reserva) => {
      // Sumar todas las cantidades de los items de reserva
      const personasEnReserva = reserva.reserva_items.reduce(
        (sum, item) => sum + (item.item_type === "tarifa" ? item.cantidad : 0),
        0
      );
      return acc + personasEnReserva;
    }, 0);
    setTotalPersonas(total);
  }, [reservas]);

  return (
    <>
      <div className="flex flex-row gap-4 mb-4">
        <div className="w-1/2 border border-[#E0E0E0] bg-white rounded-[8px] h-[75px]">
          <div className="flex flex-row gap-2 items-center h-full pl-4">
            <img src="/icons/group-orange.svg" width={38} alt="PaperTick" />
            <div className="flex flex-col ">
              <Typography variant="h6" color="text.primary">
                {reservas.length}
              </Typography>
              <Typography variant="caption" color="text.primary">
                Cantidad reservas para hoy
              </Typography>
            </div>
          </div>
        </div>
        <div className="w-1/2 border border-[#E0E0E0] bg-white rounded-[8px] h-[75px]">
          <div className="flex flex-row gap-2 items-center h-full pl-4">
            <img src="/icons/paper-tick-blue.svg" width={38} alt="PaperTick" />
            <div className="flex flex-col ">
              <Typography variant="h6" color="text.primary">
                {totalPersonas}
              </Typography>
              <Typography variant="caption" color="text.primary">
                Cantidad personas para hoy
              </Typography>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[8px] overflow-hidden border border-[#E0E0E0]">
        <table className="min-w-full border-separate border-spacing-0">
          <thead className="bg-[#FAFAFA] h-[55px]">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium tracking-normal">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium tracking-normal">
                Nro. De reserva
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium tracking-normal">
                Actividad
              </th>
              <th className="px-6 py-3 text-right text-sm font-medium tracking-normal">
                Horario
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {reservas.length < 1 && (
              <tr className="">
                <td colSpan={4} className="border-t border-[#E0E0E0]">
                  <div className=" rounded-[8px] w-full">
                    <div className="bg-[#fafafa] h-[180px] w-[95.5%] flex flex-col items-center justify-center m-4 rounded-[10px] ">
                      <Image
                        src="/icons/mail-error.svg"
                        alt="Mail Error"
                        width={21}
                        height={21}
                      />

                      <Typography
                        variant="body1"
                        gutterBottom
                        sx={{ py: "12px" }}
                      >
                        No tienes reservas para hoy
                      </Typography>
                    </div>
                  </div>
                </td>
              </tr>
            )}
            {reservas.map((reserva) => (
              <tr
                key={reserva.id}
                className="hover:bg-gray-50 transition-colors "
              >
                <td className="px-6 py-4 text-sm border-t border-[#E0E0E0]">
                  {reserva.cliente?.nombre ? reserva.cliente.nombre : "-"}{" "}
                  {reserva.cliente?.apellido ? reserva.cliente.apellido : ""}
                </td>
                <td className="px-6 py-4 text-sm border-t border-[#E0E0E0]">
                  {reserva.codigo_reserva ?? "-"}
                </td>
                <td className="px-6 py-4 text-sm border-t border-[#E0E0E0]">
                  {reserva.actividad_titulo ?? "-"}
                </td>
                <td className="px-6 py-4 text-sm border-t border-[#E0E0E0] text-right">
                  {reserva.turno?.hora_inicio
                    ? reserva.turno.hora_inicio.slice(0, 5)
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};
