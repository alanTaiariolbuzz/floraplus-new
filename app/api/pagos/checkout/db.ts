import { createClient } from '../../../../utils/supabase/server';
import { logError, logInfo } from '../../../../utils/error/logger';
import { NextResponse } from 'next/server';

export interface AgenciaStripe {
  stripeAccountId: string;
  fee: number;
  tax: number;
}

export async function getAgenciaStripeId(agenciaId: number): Promise<AgenciaStripe > {
      const supabase = await createClient();
    
        const { data: operador, error } = await supabase
          .from("agencias")
          .select("stripe_account_id, fee, tax")
          .eq("id", agenciaId)
          .single();
    
        if (
          error ||
          !operador?.stripe_account_id ||
          operador.fee == null
        ) {
         throw new Error(`Agencia ${agenciaId} not found or without Stripe Connect`);
        }
    
        logInfo(
          `Operador ${agenciaId} con Stripe Connect ID: ${operador.stripe_account_id}`
        );
        return {
          stripeAccountId: operador.stripe_account_id,
          fee: operador.fee,
          tax: operador.tax || 0,
        };
}



export async function getReservaItems(reservaId: number) {
  const supabase = await createClient();

  const { data: items, error } = await supabase
    .from("reservas_items")
    .select("*")
    .eq("reserva_id", reservaId);

  if (error) {
    logError(`Error fetching items for reserva ${reservaId}:`, error);
    return null;
  }

  logInfo(`Fetched ${items.length} items for reserva ${reservaId}`);

    if (!items || items.length === 0) {
        logError(`No items found for reserva ${reservaId}`);
        return null;
    }

  return items;
}