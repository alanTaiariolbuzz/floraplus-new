import { logError, logInfo } from "@/utils/error/logger";
import { NextRequest, NextResponse } from "next/server";
import { createEmbeddedCheckoutSession } from "@/utils/stripe/checkout";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    logInfo("Embedded checkout request received", body);

    const {
      agenciaId,
      reservaId,
      amount,
      currency,
      customerEmail,
      customerName,
      language,
    } = body;

    // Validar parámetros requeridos
    if (!agenciaId || !reservaId || !amount) {
      logError("Missing required parameters", { agenciaId, reservaId, amount });
      return NextResponse.json(
        {
          code: 400,
          message: "Missing required parameters: agenciaId, reservaId, amount",
        },
        { status: 400 }
      );
    }

    // Obtener el stripe_account_id y fee de la agencia
    const supabase = await createClient();
    const { data: agencia, error: agenciaError } = await supabase
      .from("agencias")
      .select(
        "stripe_account_id, tax, convenience_fee_fijo, convenience_fee_variable, convenience_fee_fijo_valor, convenience_fee_variable_valor, fee"
      )
      .eq("id", agenciaId)
      .single();

    // Obtener el código de reserva
    const { data: reserva, error: reservaError } = await supabase
      .from("reservas")
      .select("codigo_reserva")
      .eq("id", reservaId)
      .single();

    if (reservaError || !reserva) {
      logError("Error fetching reservation", {
        reservaId,
        error: reservaError,
      });
      return NextResponse.json(
        {
          code: 400,
          message: "Reservation not found",
        },
        { status: 400 }
      );
    }

    if (agenciaError || !agencia) {
      logError("Error fetching agency stripe account", {
        agenciaId,
        error: agenciaError,
      });
      return NextResponse.json(
        {
          code: 400,
          message: "Agency not found or no Stripe account configured",
        },
        { status: 400 }
      );
    }

    if (!agencia.stripe_account_id) {
      logError("Agency has no Stripe account configured", { agenciaId });
      return NextResponse.json(
        {
          code: 400,
          message: "Agency has no Stripe account configured",
        },
        { status: 400 }
      );
    }

    // Sanitizar y validar los parámetros
    const tax = agencia.tax || 0; // Default to 0 if not set

    // Los valores booleanos deberían venir como booleanos puros desde la base de datos
    const convenience_fee_fijo = agencia.convenience_fee_fijo === true;
    const convenience_fee_variable = agencia.convenience_fee_variable === true;

    // Log para debugging
    logInfo("Valores de fees de la agencia:", {
      agenciaId,
      convenience_fee_fijo: agencia.convenience_fee_fijo,
      convenience_fee_fijo_processed: convenience_fee_fijo,
      convenience_fee_variable: agencia.convenience_fee_variable,
      convenience_fee_variable_processed: convenience_fee_variable,
      convenience_fee_fijo_valor: agencia.convenience_fee_fijo_valor,
      convenience_fee_variable_valor: agencia.convenience_fee_variable_valor,
    });

    // Convert string numbers to actual numbers - handle both string and number values from database
    const toNumber = (value: any): number | undefined => {
      if (value === null || value === undefined || value === "")
        return undefined;
      const num = Number(value);
      return isNaN(num) ? undefined : num;
    };

    const convenience_fee_fijo_valor = toNumber(
      agencia.convenience_fee_fijo_valor
    );
    const convenience_fee_variable_valor =
      toNumber(agencia.convenience_fee_variable_valor) || 0; // Default to 0 if not set

    const sanitizedParams = await sanitization(
      amount,
      currency,
      customerEmail,
      customerName,
      tax,
      convenience_fee_fijo,
      convenience_fee_variable,
      convenience_fee_fijo_valor,
      convenience_fee_variable_valor
    );

    if (sanitizedParams instanceof NextResponse) {
      return sanitizedParams; // Return early if sanitization failed
    }
    // 1️⃣ —- Validación de modo de cobro

    const modeCount =
      Number(convenience_fee_fijo) + Number(convenience_fee_variable);

    // Check for both null or both empty
    const bothNull =
      convenience_fee_fijo === null && convenience_fee_variable === null;
    const bothEmpty =
      (convenience_fee_fijo === undefined || convenience_fee_fijo === null) &&
      (convenience_fee_variable === undefined ||
        convenience_fee_variable === null);

    if (modeCount !== 1 || bothNull || bothEmpty) {
      // = 0  → ambos false | = 2 → ambos true | ambos null | ambos empty
      let bothState = "";
      if (modeCount === 0 || modeCount === 2) {
        bothState = modeCount === 0 ? "false" : "true";
      } else if (bothNull) {
        bothState = "null";
      } else if (bothEmpty) {
        bothState = "empty";
      }
      const msg = `Both convenience_fee_fijo and convenience_fee_variable cannot be ${bothState}`;

      logError(msg, { convenience_fee_fijo, convenience_fee_variable });
      return NextResponse.json({ code: 400, message: msg }, { status: 400 });
    }

    // 2️⃣ —- Cálculo del fee
    const final_fee = convenience_fee_fijo
      ? (convenience_fee_fijo_valor ?? 0)
      : Number(
          (
            (sanitizedParams.amount * convenience_fee_variable_valor) /
            100
          ).toFixed(2)
        );

    //log del fee final y cual se uso
    logInfo("Final fee calculation" + final_fee);

    //ahora calculo el final_tax, tax es un valor en porcentaje
    // Tax se calcula solo sobre el amount base, no sobre amount + fee
    const final_tax = Number(((sanitizedParams.amount * tax) / 100).toFixed(2));

    // Fee Flora Plus es un porcentaje que se calcula sobre el total en checkout.ts
    const fee_flora_plus = agencia.fee || 0; // Porcentaje (ej: 5 para 5%)

    logInfo("Calling createEmbeddedCheckoutSession", {
      agenciaId: agenciaId,
      reservaId: reservaId,
      amount: sanitizedParams.amount,
      currency: sanitizedParams.currency,
      customerEmail: sanitizedParams.customerEmail,
      customerName,
      stripeAccountId: agencia.stripe_account_id,
      final_fee: final_fee,
      final_tax: final_tax,
      customerId: undefined, // Optional customer ID
      fee_flora_plus: fee_flora_plus, // Porcentaje de Flora Plus
    });

    const result = await createEmbeddedCheckoutSession({
      agenciaId,
      reservaId,
      codigo_reserva: reserva.codigo_reserva,
      amount: sanitizedParams.amount,
      currency: sanitizedParams.currency,
      customerEmail: sanitizedParams.customerEmail,
      customerName: sanitizedParams.customerName,
      stripeAccountId: agencia.stripe_account_id,
      final_fee: final_fee,
      final_tax: final_tax,
      fee_flora_plus: fee_flora_plus,
      language: language || "es", // Default to Spanish if not provided
    });

    logInfo("createEmbeddedCheckoutSession result", {
      hasResult: !!result,
      hasClientSecret: !!result?.clientSecret,
      sessionId: result?.sessionId,
    });

    if (!result || !result.clientSecret) {
      logError("Failed to create embedded checkout session", result);
      return NextResponse.json(
        {
          code: 500,
          message: "Failed to create embedded checkout session",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      code: 200,
      message: "Checkout session created successfully for embedded components",
      data: {
        sessionId: result.sessionId,
        clientSecret: result.clientSecret,
      },
    });
  } catch (error) {
    logError("Error processing embedded checkout", error);
    return NextResponse.json(
      {
        code: 500,
        message: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function sanitization(
  amount: number,
  currency: string,
  customerEmail?: string,
  customerName?: string,
  tax?: number,
  convenience_fee_fijo?: any,
  convenience_fee_variable?: any,
  convenience_fee_fijo_valor?: number,
  convenience_fee_variable_valor?: number
) {
  // Aquí puedes agregar lógica de sanitización si es necesario

  // valido campos y input sanitization
  if (typeof amount !== "number" || amount <= 0) {
    logError("Invalid amount", { amount });
    return NextResponse.json(
      {
        code: 400,
        message: "Invalid amount. It must be a positive number.",
      },
      { status: 400 }
    );
  }

  if (typeof currency !== "string" || currency.length !== 3) {
    logError("Invalid currency", { currency });
    return NextResponse.json(
      {
        code: 400,
        message: "Invalid currency. It must be a 3-letter ISO code.",
      },
      { status: 400 }
    );
  }

  if (customerEmail && typeof customerEmail !== "string") {
    logError("Invalid customer email", { customerEmail });
    return NextResponse.json(
      {
        code: 400,
        message: "Invalid customer email format.",
      },
      { status: 400 }
    );
  }

  if (customerName && typeof customerName !== "string") {
    logError("Invalid customer name", { customerName });
    return NextResponse.json(
      {
        code: 400,
        message: "Invalid customer name format.",
      },
      { status: 400 }
    );
  }

  // Los valores booleanos ya están validados como booleanos puros
  if (typeof convenience_fee_fijo !== "boolean") {
    logError("Invalid convenience fee fijo", { convenience_fee_fijo });
    return NextResponse.json(
      {
        code: 400,
        message: "Invalid convenience fee fijo. It must be a boolean.",
      },
      { status: 400 }
    );
  }

  if (typeof convenience_fee_variable !== "boolean") {
    logError("Invalid convenience fee variable", { convenience_fee_variable });
    return NextResponse.json(
      {
        code: 400,
        message: "Invalid convenience fee variable. It must be a boolean.",
      },
      { status: 400 }
    );
  }

  if (
    convenience_fee_fijo_valor !== null &&
    convenience_fee_fijo_valor !== undefined &&
    (typeof convenience_fee_fijo_valor !== "number" ||
      convenience_fee_fijo_valor < 0)
  ) {
    logError("Invalid convenience fee fijo valor", {
      convenience_fee_fijo_valor,
    });
    return NextResponse.json(
      {
        code: 400,
        message:
          "Invalid convenience fee fijo valor. It must be a non-negative number, null, or undefined.",
      },
      { status: 400 }
    );
  }

  if (
    convenience_fee_variable_valor !== null &&
    convenience_fee_variable_valor !== undefined &&
    (typeof convenience_fee_variable_valor !== "number" ||
      convenience_fee_variable_valor < 0)
  ) {
    logError("Invalid convenience fee variable valor", {
      convenience_fee_variable_valor,
    });
    return NextResponse.json(
      {
        code: 400,
        message:
          "Invalid convenience fee variable valor. It must be a non-negative number, null, or undefined.",
      },
      { status: 400 }
    );
  }

  return {
    amount,
    currency,
    customerEmail: customerEmail || "",
    customerName: customerName || "",
    tax: tax || 0, // Default to 0 if not set
    convenience_fee_fijo: convenience_fee_fijo, // Ya es boolean puro
    convenience_fee_variable: convenience_fee_variable, // Ya es boolean puro
    convenience_fee_fijo_valor: convenience_fee_fijo_valor || null, // Default to null if not set
    convenience_fee_variable_valor: convenience_fee_variable_valor || 0, // Default to 0 if not set
  };
}
