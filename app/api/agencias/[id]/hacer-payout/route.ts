import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import stripeClient from "@/utils/stripe/client";
import { logError, logInfo } from "@/utils/error/logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const agenciaId = parseInt(id);

    if (isNaN(agenciaId)) {
      return NextResponse.json(
        { error: "ID de agencia inválido" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { amount, currency = "usd" } = body;

    // Validación de seguridad para producción
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const userAgent = request.headers.get("user-agent");

    // En producción, verificar que la petición viene de nuestro dominio
    if (process.env.NODE_ENV === "production") {
      const allowedOrigins = [
        process.env.NEXT_PUBLIC_SITE_URL,
        "https://tuagencia.com", // Reemplaza con tu dominio real
        "https://www.tuagencia.com",
      ].filter(Boolean);

      if (origin && !allowedOrigins.includes(origin)) {
        logError(new Error("Origen no permitido"), {
          context: "hacer-payout-post",
          agenciaId: (await params).id,
          origin,
          referer,
          userAgent,
        });
        return NextResponse.json(
          { error: "Origen no permitido" },
          { status: 403 }
        );
      }

      // Verificar que la petición viene de nuestro frontend
      if (!referer || !referer.includes(allowedOrigins[0] || "")) {
        logError(new Error("Referer no válido"), {
          context: "hacer-payout-post",
          agenciaId: (await params).id,
          referer,
          userAgent,
        });
        return NextResponse.json(
          { error: "Referer no válido" },
          { status: 403 }
        );
      }
    }

    // Validar parámetros requeridos
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "El monto debe ser mayor a 0" },
        { status: 400 }
      );
    }

    if (!currency || !["usd", "eur", "crc"].includes(currency)) {
      return NextResponse.json(
        { error: "Moneda inválida. Debe ser usd, eur o crc" },
        { status: 400 }
      );
    }

    // Verificar autenticación
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar permisos - el usuario debe pertenecer a la agencia o ser admin
    const { data: userData } = await supabase
      .from("usuarios")
      .select("rol_id, agencia_id")
      .eq("id", user.id)
      .single();

    const isAdmin = userData?.rol_id === 1; // Asumiendo que rol_id=1 es admin

    if (!isAdmin && userData?.agencia_id !== agenciaId) {
      return NextResponse.json(
        { error: "No autorizado para acceder a esta agencia" },
        { status: 403 }
      );
    }

    // Obtener la agencia y su cuenta de Stripe
    const { data: agencia, error: agenciaError } = await supabase
      .from("agencias")
      .select("id, stripe_account_id")
      .eq("id", agenciaId)
      .single();

    if (agenciaError || !agencia) {
      return NextResponse.json(
        { error: "Agencia no encontrada" },
        { status: 404 }
      );
    }

    if (!agencia.stripe_account_id) {
      return NextResponse.json(
        { error: "La agencia no tiene una cuenta de Stripe configurada" },
        { status: 400 }
      );
    }

    // Verificar que el payout schedule sea manual
    const stripeResult = stripeClient();
    if (!stripeResult.success) {
      return NextResponse.json(
        { error: "Error al inicializar Stripe" },
        { status: 500 }
      );
    }

    const stripe = stripeResult.data;

    // Obtener la configuración actual de payout
    const account = await stripe.accounts.retrieve(agencia.stripe_account_id);
    const payoutSchedule = account.settings?.payouts?.schedule;

    if (payoutSchedule?.interval !== "manual") {
      return NextResponse.json(
        {
          error:
            "Solo se pueden realizar payouts manuales cuando el schedule está configurado como 'manual'",
        },
        { status: 400 }
      );
    }

    // Verificar que la cuenta tenga payouts habilitados
    if (!account.payouts_enabled) {
      return NextResponse.json(
        { error: "Los payouts no están habilitados para esta cuenta" },
        { status: 400 }
      );
    }

    // Verificar que haya una cuenta bancaria configurada
    const externalAccounts = await stripe.accounts.listExternalAccounts(
      agencia.stripe_account_id,
      {
        object: "bank_account",
      }
    );

    if (!externalAccounts.data || externalAccounts.data.length === 0) {
      return NextResponse.json(
        { error: "No hay cuenta bancaria configurada para realizar payouts" },
        { status: 400 }
      );
    }

    // Verificar el saldo disponible
    const balance = await stripe.balance.retrieve({
      stripeAccount: agencia.stripe_account_id,
    });

    const availableBalance = balance.available.reduce((total, balanceItem) => {
      if (balanceItem.currency === currency) {
        return total + balanceItem.amount;
      }
      return total;
    }, 0);

    if (availableBalance < amount) {
      return NextResponse.json(
        {
          error: "Saldo insuficiente para realizar el payout",
          available_balance: availableBalance,
          requested_amount: amount,
          currency,
        },
        { status: 400 }
      );
    }

    // Crear el payout
    const payout = await stripe.payouts.create(
      {
        amount,
        currency,
        metadata: {
          agencia_id: agenciaId.toString(),
          created_by: user.id,
          payout_type: "manual",
        },
      },
      {
        stripeAccount: agencia.stripe_account_id,
        idempotencyKey: `manual_payout_${agenciaId}_${Date.now()}`,
      }
    );

    logInfo("Payout manual creado exitosamente", {
      agenciaId,
      stripeAccountId: agencia.stripe_account_id,
      payoutId: payout.id,
      amount,
      currency,
      userId: user.id,
    });

    return NextResponse.json(
      {
        success: true,
        payout: {
          id: payout.id,
          amount: payout.amount,
          currency: payout.currency,
          status: payout.status,
          arrival_date: payout.arrival_date,
          created: payout.created,
        },
      },
      {
        headers: {
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
          "X-XSS-Protection": "1; mode=block",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
      }
    );
  } catch (error) {
    logError(error, {
      context: "hacer-payout-post",
      agenciaId: (await params).id,
      message: "Error al crear payout manual",
    });

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
