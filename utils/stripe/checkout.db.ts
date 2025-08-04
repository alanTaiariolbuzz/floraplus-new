import { createAdminClient } from "@/utils/supabase/admin";

export async function savePago({
  reservaId,
  agenciaId,
  customerId,
  status,
  amount,
  currency,
  receiptUrl,
  externalStatus,
  stripeSessionId,
  stripeCustomerId,
  customerEmail,
  customerName,
  paymentMethod,
  netAmount,
  clientReferenceId,
  final_tax,
  final_fee,
  fee_flora_plus, // Nuevo campo opcional
}: {
  reservaId: number;
  agenciaId?: number | null;
  customerId?: number | null;
  status: string;
  amount: number;
  currency: string;
  receiptUrl?: string | null;
  externalStatus?: string | null;
  stripeSessionId?: string | null;
  stripeCustomerId?: string | null;
  customerEmail?: string | null;
  customerName?: string | null;
  paymentMethod?: string | null;
  fee?: number | null;
  netAmount?: number | null;
  clientReferenceId?: string | null;
  final_tax: number; // Nuevo campo opcional
  final_fee: number; // Nuevo campo opcional
  fee_flora_plus?: number | null; // Nuevo campo opcional
}) {
  const supabase = await createAdminClient();

  const { data: pago, error: insertError } = await supabase
    .from("pagos")
    .insert([
      {
        reserva_id: reservaId,
        agencia_id: agenciaId ?? null,
        customer_id: customerId ?? null,
        status,
        amount,
        currency,
        receipt_url: receiptUrl ?? null,
        external_status: externalStatus ?? null,
        stripe_session_id: stripeSessionId ?? null,
        stripe_customer_id: stripeCustomerId ?? null,
        customer_email: customerEmail ?? null,
        customer_name: customerName ?? null,
        payment_method: paymentMethod ?? null,
        net_amount: netAmount ?? null,
        client_reference_id: clientReferenceId ?? null,
        final_tax: final_tax,
        final_fee: final_fee,
        fee_flora_plus: fee_flora_plus ?? null, // Nuevo campo opcional
      },
    ])
    .select("id")
    .single();

  if (insertError) throw insertError;

  const { error: updateError } = await supabase
    .from("reservas")
    .update({ pago_id: pago.id })
    .eq("id", reservaId);

  if (updateError) throw updateError;

  return pago;
}
