import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import * as XLSX from "xlsx";
import {
  format as formatDate,
  subMonths,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { es } from "date-fns/locale";

// TypeScript interfaces
interface ReservaItem {
  id: string;
  total: number;
  item_id: string;
  cantidad: number;
  item_type: string;
  descripcion: string;
  precio_unitario: number;
}

interface Turno {
  id: string;
  actividad_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
}

interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
}

interface Agencia {
  id: string;
  nombre: string;
}

interface Pago {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

interface Reserva {
  id: string;
  estado: string;
  created_at: string;
  monto_total: number;
  codigo_reserva?: string;
  turno: Turno;
  cliente: Cliente;
  agencia: Agencia;
  reserva_items: ReservaItem[];
}

// Status mapping for Spanish labels
const STATUS_CONFIG = {
  hold: "Pendiente",
  confirmed: "Confirmado",
  expired: "Expirado",
  cancelled: "Cancelado",
  refunded: "Cancelado",
  "no-show": "No Show",
  "check-in": "Check In",
  pendiente: "Pendiente",
  confirmada: "Confirmado",
  expirada: "Expirado",
  cancelada: "Cancelado",
};

// Status normalization mapping
const STATUS_NORMALIZATION = {
  hold: "pendiente",
  confirmed: "confirmada",
  expired: "expirada",
  cancelled: "cancelada",
  refunded: "cancelada",
  "no-show": "no-show",
  "check-in": "check-in",
  pendiente: "pendiente",
  confirmada: "confirmada",
  expirada: "expirada",
  cancelada: "cancelada",
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileFormat = searchParams.get("format") || "xlsx"; // xlsx or csv
    const dateRange = searchParams.get("dateRange") || "last_month"; // last_month, last_3_months, last_6_months, all_time

    // Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { code: 401, message: "No autorizado" },
        { status: 401 }
      );
    }

    // Get user's agency and role
    const { data: userData, error: userError } = await supabase
      .from("usuarios")
      .select("agencia_id, rol_id")
      .eq("id", user.id)
      .single();

    if (userError || typeof userData?.rol_id === "undefined") {
      return NextResponse.json(
        { code: 400, message: "No se pudo obtener el rol del usuario" },
        { status: 400 }
      );
    }

    const isAdmin = userData.rol_id === 1;

    if (!isAdmin && !userData?.agencia_id) {
      return NextResponse.json(
        { code: 400, message: "Usuario no tiene agencia asignada" },
        { status: 400 }
      );
    }

    // Calculate date range
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    switch (dateRange) {
      case "last_month":
        // Change from previous month to current month (more likely to have data)
        startDate = startOfMonth(new Date());
        endDate = new Date();
        break;
      case "last_3_months":
        startDate = startOfMonth(subMonths(new Date(), 3));
        endDate = new Date();
        break;
      case "last_6_months":
        startDate = startOfMonth(subMonths(new Date(), 6));
        endDate = new Date();
        break;
      case "all_time":
        // No date filter
        break;
      default:
        return NextResponse.json(
          { code: 400, message: "Rango de fechas inválido" },
          { status: 400 }
        );
    }

    // Build query
    let query = supabase
      .from("reservas")
      .select(
        `
        *,
        turno:turnos (
          id,
          actividad_id,
          fecha,
          hora_inicio,
          hora_fin
        ),
        cliente:clientes (
          id,
          nombre,
          apellido,
          email,
          telefono
        ),
        agencia:agencias (
          id,
          nombre
        ),
        reserva_items:reserva_items (
          id,
          total,
          item_id,
          cantidad,
          item_type,
          descripcion,
          precio_unitario
        )
      `
      )
      .order("created_at", { ascending: false });

    if (!isAdmin) {
      query = query.eq("turno.agencia_id", userData.agencia_id);
    }

    // Apply date filter if specified
    if (startDate && endDate) {
      query = query
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());
    }

    const { data: reservas, error } = await query;


    if (error) {
      console.error("Error fetching reservations:", error);
      return NextResponse.json(
        { code: 500, message: "Error al obtener las reservas" },
        { status: 500 }
      );
    }

    // Obtener los pagos de manera separada
    const reservaIds = reservas.map((r) => r.id);
    const { data: pagos, error: pagosError } = await supabase
      .from("pagos")
      .select(
        `
        reserva_id,
        amount,
        currency,
        status,
        created_at
      `
      )
      .in("reserva_id", reservaIds);

    if (pagosError) {
      console.error("Error fetching payments:", pagosError);
      return NextResponse.json(
        { code: 500, message: "Error al obtener los pagos" },
        { status: 500 }
      );
    }

    // Crear un mapa de pagos por reserva_id
    const pagosMap: Record<number, any> = {};
    pagos.forEach((pago) => {
      pagosMap[pago.reserva_id] = pago;
    });

    // Get activity titles (incluyendo soft deleted para mostrar en reservas)
    const actividadIds = reservas
      .map((reserva) => reserva.turno?.actividad_id)
      .filter(Boolean);

    const { data: actividades, error: actividadesError } = await supabase
      .from("actividades")
      .select("id, titulo")
      .in("id", actividadIds);

    if (actividadesError) {
      console.error("Error fetching activities:", actividadesError);
      return NextResponse.json(
        { code: 500, message: "Error al obtener las actividades" },
        { status: 500 }
      );
    }

    // Create activities map
    const actividadesMap: Record<number, string> = actividades.reduce(
      (acc: Record<number, string>, actividad) => {
        acc[actividad.id] = actividad.titulo;
        return acc;
      },
      {}
    );

    // Transform data for export
    const exportData = reservas.map((reserva: Reserva) => {
      // Obtener el pago correspondiente a esta reserva
      const pago = pagosMap[Number(reserva.id)];
      const normalizedStatus =
        STATUS_NORMALIZATION[
          reserva.estado?.toLowerCase() as keyof typeof STATUS_NORMALIZATION
        ] || reserva.estado?.toLowerCase();

      const statusLabel =
        STATUS_CONFIG[normalizedStatus as keyof typeof STATUS_CONFIG] ||
        reserva.estado;

      // Calculate total people
      const totalPersonas = reserva.reserva_items
        .filter((item: ReservaItem) => item.item_type === "tarifa")
        .reduce((sum: number, item: ReservaItem) => sum + item.cantidad, 0);

      // Format dates
      const fechaCompra = reserva.created_at
        ? formatDate(new Date(reserva.created_at), "dd/MM/yyyy", { locale: es })
        : "Sin fecha";

      const fechaTour = reserva.turno?.fecha
        ? formatDate(new Date(reserva.turno.fecha), "dd/MM/yyyy", {
            locale: es,
          })
        : "Sin fecha";

      // Format time with proper validation
      let horaTour = "Sin horario";
      if (reserva.turno?.hora_inicio) {
        try {
          // Handle different time formats
          let timeString = reserva.turno.hora_inicio;

          // Remove timezone if present
          if (timeString.includes("+")) {
            timeString = timeString.split("+")[0];
          }

          // Ensure we have a valid time format
          if (
            timeString.match(/^\d{2}:\d{2}:\d{2}$/) ||
            timeString.match(/^\d{2}:\d{2}$/)
          ) {
            const [hours, minutes] = timeString.split(":");
            const hour = parseInt(hours);
            const minute = parseInt(minutes);

            if (
              !isNaN(hour) &&
              !isNaN(minute) &&
              hour >= 0 &&
              hour <= 23 &&
              minute >= 0 &&
              minute <= 59
            ) {
              const timeDate = new Date(2000, 0, 1, hour, minute);
              horaTour = formatDate(timeDate, "hh:mm a");
            }
          }
        } catch (error) {
          console.warn(
            "Error formatting time:",
            reserva.turno.hora_inicio,
            error
          );
          horaTour = "Sin horario";
        }
      }

      return {
        Cliente:
          `${reserva.cliente?.nombre || ""} ${reserva.cliente?.apellido || ""}`.trim() ||
          "Sin cliente",
        "Nro. Reserva": reserva.codigo_reserva || `#${reserva.id}`,
        Actividad:
          actividadesMap[Number(reserva.turno?.actividad_id) || 0] ||
          "Sin actividad",
        Estado: statusLabel,
        "Precio Total": `$${pago?.amount?.toFixed(2) || reserva.monto_total?.toFixed(2) || "0.00"}`,
        "Fecha de Compra": fechaCompra,
        "Fecha del Tour": fechaTour,
        "Hora del Tour": horaTour,
        Personas: totalPersonas,
        Email: reserva.cliente?.email || "Sin email",
        Teléfono: reserva.cliente?.telefono || "Sin teléfono",
      };
    });

    // Generate filename
    const now = new Date();
    const timestamp = formatDate(now, "yyyy-MM-dd_HH-mm");
    const rangeLabel = {
      last_month: "ultimo_mes",
      last_3_months: "ultimos_3_meses",
      last_6_months: "ultimos_6_meses",
      all_time: "historico_completo",
    }[dateRange];

    const filename = `reservas_${rangeLabel}_${timestamp}.${fileFormat}`;

    if (fileFormat === "csv") {
      // Generate CSV
      const csvContent = generateCSV(exportData);

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    } else {
      // Generate XLSX
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Auto-size columns
      const columnWidths = [
        { wch: 25 }, // Cliente
        { wch: 15 }, // Nro. Reserva
        { wch: 30 }, // Actividad
        { wch: 12 }, // Estado
        { wch: 15 }, // Precio Total
        { wch: 15 }, // Fecha de Compra
        { wch: 15 }, // Fecha del Tour
        { wch: 12 }, // Hora del Tour
        { wch: 10 }, // Personas
        { wch: 25 }, // Email
        { wch: 15 }, // Teléfono
      ];
      worksheet["!cols"] = columnWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, "Reservas");

      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { code: 500, message: "Error al generar el reporte" },
      { status: 500 }
    );
  }
}

function generateCSV(data: any[]): string {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","), // Header row
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Escape quotes and wrap in quotes if contains comma or newline
          const escaped = String(value).replace(/"/g, '""');
          return escaped.includes(",") || escaped.includes("\n")
            ? `"${escaped}"`
            : escaped;
        })
        .join(",")
    ),
  ];

  return csvRows.join("\n");
}
