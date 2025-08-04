import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { sendEmail } from "@/utils/email/service";
import { getReservaDataForConfirmacion } from "@/src/backend/services/email/Service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await req.json();

    if (!id || !status) {
      return NextResponse.json(
        {
          code: 400,
          message: "Debe enviar el ID de la reserva y el nuevo estado",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verificar que la reserva existe
    const { data: existingReserva, error: fetchError } = await supabase
      .from("reservas")
      .select("id, estado")
      .eq("id", Number(id))
      .single();

    if (fetchError || !existingReserva) {
      return NextResponse.json(
        {
          code: 404,
          message: "Reserva no encontrada",
        },
        { status: 404 }
      );
    }

    // Actualizar el estado de la reserva
    const updateFields: any = { estado: status };
    if (status === "cancelled" || status === "cancelada") {
      updateFields.cancelled_at = new Date().toISOString();
    }
    const { data, error } = await supabase
      .from("reservas")
      .update(updateFields)
      .eq("id", Number(id))
      .select("id, estado, cancelled_at")
      .single();

    if (error) {
      console.error("Error updating reservation status:", error);
      return NextResponse.json(
        {
          code: 500,
          message: "Error al actualizar el estado de la reserva",
          error: error.message,
        },
        { status: 500 }
      );
    }

    // Enviar email de cancelación si corresponde
    if (status === "cancelled" || status === "cancelada") {
      try {
        // Detectar idioma (por ahora por defecto 'es', o usar 'en' si el email del cliente termina en .com)
        let lang = "es";

        // Obtener el email del cliente para detectar el idioma
        const { data: clienteData } = await supabase
          .from("reservas")
          .select(
            `
            cliente:clientes (
              email
            )
          `
          )
          .eq("id", Number(id))
          .single();

        if (
          clienteData?.cliente?.[0]?.email &&
          clienteData.cliente[0].email.match(/\.(com|us|uk|en)$/i)
        ) {
          lang = "en";
        }

        // Obtener datos completos de la reserva con el idioma correcto
        const reservaData = await getReservaDataForConfirmacion(
          id.toString(),
          lang
        );

        // TemplateId: 'cancel' o 'cancel.en'
        const templateId = lang === "en" ? "cancel.en" : "cancel";
        await sendEmail({
          to: reservaData.email,
          subject:
            reservaData.nombreComercial +
            ": " +
            (lang === "en"
              ? "Your booking has been cancelled"
              : "Tu reserva ha sido cancelada"),
          template: templateId,
          agencia_id: reservaData.agenciaId,
          reserva_id: parseInt(id),
          template_name: templateId,
          data: {
            ...reservaData,
            precio: reservaData.precioTotal, // <-- Mapeo correcto para el template
            tarifas: reservaData.tarifas,
            adicionales: reservaData.adicionales,
          },
          fromName: reservaData.nombreComercial,
        });
      } catch (err) {
        console.error("Error enviando email de cancelación:", err);
      }
    }

    return NextResponse.json(
      {
        code: 200,
        message: "Estado de la reserva actualizado exitosamente",
        data: {
          id: data.id,
          estado: data.estado,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in PATCH /api/reservas/[id]/status:", error);
    return NextResponse.json(
      {
        code: 500,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
